/**
 * Kuramoto-Coupled Primeon Z-Ladder
 * 
 * Hybrid model combining:
 * - Quantum ladder hopping dynamics
 * - Kuramoto oscillator synchronization on rung phases
 * - Z-flux interpreted as "collapse pressure"
 * 
 * Physics interpretation:
 * - Each rung ψ_n = |ψ_n| e^(iθ_n) has phase θ_n acting as oscillator
 * - Kuramoto coupling promotes phase coherence between rungs
 * - Z-flux accumulation represents decoherence/collapse pressure
 * - When collapse pressure exceeds threshold, measurement triggers
 * 
 * Key concepts:
 * - Order parameter r = |⟨e^(iθ)⟩| measures global synchronization
 * - High sync (r→1) = quantum coherence preserved
 * - Low sync (r→0) = decoherence, collapse pressure builds
 * - Collapse events reduce uncertainty but reset sync
 */

'use strict';

import {  PrimeonZLadderMulti,
  ZChannel,
  createMultiChannelLadder,
  createAdiabaticSchedule  } from './primeon_z_ladder_multi.js';

import {  C,
  shannonEntropyNats,
  probsOf,
  normalize  } from './primeon_z_ladder_u.js';

/**
 * Extract phase from complex number
 * @param {C} z - Complex number
 * @returns {number} Phase in radians
 */
function getPhase(z) {
  return Math.atan2(z.im, z.re);
}

/**
 * Compute Kuramoto order parameter from phases
 * @param {number[]} phases - Array of phases
 * @returns {{r: number, psi: number}} Order parameter magnitude and mean phase
 */
function kuramotoOrderParameter(phases) {
  if (phases.length === 0) return { r: 0, psi: 0 };
  
  let sumCos = 0, sumSin = 0;
  for (const theta of phases) {
    sumCos += Math.cos(theta);
    sumSin += Math.sin(theta);
  }
  
  const r = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / phases.length;
  const psi = Math.atan2(sumSin, sumCos);
  
  return { r, psi };
}

/**
 * KuramotoCoupledLadder - Hybrid quantum ladder with Kuramoto synchronization
 * 
 * @extends PrimeonZLadderMulti
 */
class KuramotoCoupledLadder extends PrimeonZLadderMulti {
  /**
   * @param {object} opts
   * @param {number} opts.N - Number of rungs
   * @param {number} [opts.J=0.25] - Quantum hopping strength
   * @param {number} [opts.K=0.1] - Kuramoto coupling strength
   * @param {number[]} [opts.frequencies=null] - Natural frequencies per rung
   * @param {number} [opts.collapseThreshold=1.0] - Collapse pressure threshold
   * @param {number} [opts.collapseDecay=0.1] - Pressure decay rate
   * @param {boolean} [opts.autoCollapse=false] - Auto-trigger collapse
   * @param {object[]} [opts.zChannels] - Z channel configurations
   */
  constructor(opts) {
    super(opts);
    
    // Kuramoto parameters
    this.K = opts.K ?? 0.1;
    
    // Natural frequencies (default: prime-based)
    if (opts.frequencies) {
      this.frequencies = opts.frequencies.slice(0, this.N);
      while (this.frequencies.length < this.N) {
        this.frequencies.push(1.0);
      }
    } else {
      // Prime-based frequencies
      this.frequencies = this._generatePrimeFrequencies();
    }
    
    // Collapse pressure dynamics
    this.collapsePressure = 0;
    this.collapseThreshold = opts.collapseThreshold ?? 1.0;
    this.collapseDecay = opts.collapseDecay ?? 0.1;
    this.autoCollapse = opts.autoCollapse ?? false;
    
    // Tracking
    this.collapseEvents = [];
    this.orderParameterHistory = [];
    this.maxHistoryLength = opts.maxHistory ?? 1000;
  }
  
  /**
   * Generate prime-based natural frequencies
   * @private
   */
  _generatePrimeFrequencies() {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const frequencies = [];
    
    for (let n = 0; n < this.N; n++) {
      // Use log of prime for smoother distribution
      const primeIdx = n % primes.length;
      frequencies.push(Math.log(primes[primeIdx]) / Math.log(2));
    }
    
    return frequencies;
  }
  
  /**
   * Get phases of all rungs
   */
  getRungPhases() {
    const phases = [];
    
    for (let n = 0; n < this.N; n++) {
      // Use dominant component within rung
      let maxAmp = 0;
      let phase = 0;
      
      for (let k = 0; k < this.d; k++) {
        const i = n * this.d + k;
        const amp = C.abs2(this.psi[i]);
        if (amp > maxAmp) {
          maxAmp = amp;
          phase = getPhase(this.psi[i]);
        }
      }
      
      phases.push(phase);
    }
    
    return phases;
  }
  
  /**
   * Get amplitudes of all rungs
   */
  getRungAmplitudes() {
    const amplitudes = [];
    
    for (let n = 0; n < this.N; n++) {
      let amp2 = 0;
      for (let k = 0; k < this.d; k++) {
        const i = n * this.d + k;
        amp2 += C.abs2(this.psi[i]);
      }
      amplitudes.push(Math.sqrt(amp2));
    }
    
    return amplitudes;
  }
  
  /**
   * Compute current order parameter
   */
  orderParameter() {
    const phases = this.getRungPhases();
    const amplitudes = this.getRungAmplitudes();
    
    // Weight by amplitude (weighted order parameter)
    let sumCos = 0, sumSin = 0, totalWeight = 0;
    
    for (let n = 0; n < this.N; n++) {
      const weight = amplitudes[n];
      sumCos += weight * Math.cos(phases[n]);
      sumSin += weight * Math.sin(phases[n]);
      totalWeight += weight;
    }
    
    if (totalWeight === 0) return { r: 0, psi: 0, weighted: true };
    
    const r = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / totalWeight;
    const psi = Math.atan2(sumSin, sumCos);
    
    return { r, psi, weighted: true };
  }
  
  /**
   * One time step with Kuramoto phase coupling
   * @param {number} [dt=0.01] - Time step size
   */
  step(dt = 0.01) {
    // --- 1) Kuramoto phase dynamics ---
    this._applyKuramotoCoupling(dt);
    
    // --- 2) Standard ladder dynamics (hopping + Z-flux) ---
    const parentMetrics = super.step(dt);
    
    // --- 3) Update collapse pressure from Z-flux ---
    this._updateCollapsePressure(dt);
    
    // --- 4) Check for auto-collapse ---
    if (this.autoCollapse && this.collapsePressure >= this.collapseThreshold) {
      this._triggerCollapse();
    }
    
    // --- 5) Track order parameter ---
    const orderParam = this.orderParameter();
    this.orderParameterHistory.push({
      t: this.t,
      r: orderParam.r,
      psi: orderParam.psi
    });
    
    if (this.orderParameterHistory.length > this.maxHistoryLength) {
      this.orderParameterHistory.shift();
    }
    
    return this.metrics();
  }
  
  /**
   * Apply Kuramoto phase coupling to ladder
   * @private
   */
  _applyKuramotoCoupling(dt) {
    const N = this.N;
    const phases = this.getRungPhases();
    const amplitudes = this.getRungAmplitudes();
    
    // Compute phase increments
    const deltaPhase = new Array(N).fill(0);
    
    for (let n = 0; n < N; n++) {
      // Natural frequency evolution
      deltaPhase[n] += this.frequencies[n] * dt;
      
      // Kuramoto coupling
      let coupling = 0;
      for (let m = 0; m < N; m++) {
        if (m !== n) {
          // Weight coupling by amplitude product
          const weight = amplitudes[n] * amplitudes[m];
          coupling += weight * Math.sin(phases[m] - phases[n]);
        }
      }
      
      deltaPhase[n] += (this.K / N) * coupling * dt;
    }
    
    // Apply phase increments
    for (let n = 0; n < N; n++) {
      for (let k = 0; k < this.d; k++) {
        const i = n * this.d + k;
        const amp = Math.sqrt(C.abs2(this.psi[i]));
        const currentPhase = getPhase(this.psi[i]);
        const newPhase = currentPhase + deltaPhase[n];
        
        // Update with new phase, preserving amplitude
        this.psi[i] = new C(
          amp * Math.cos(newPhase),
          amp * Math.sin(newPhase)
        );
      }
    }
  }
  
  /**
   * Update collapse pressure from Z-flux
   * @private
   */
  _updateCollapsePressure(dt) {
    // Sum recent Z-flux from all channels
    let totalFlux = 0;
    for (const channel of this.channels.values()) {
      totalFlux += channel.lastFlux;
    }
    
    // Flux increases pressure, with decay
    this.collapsePressure += totalFlux;
    this.collapsePressure *= (1 - this.collapseDecay * dt);
    
    // Clamp to non-negative
    this.collapsePressure = Math.max(0, this.collapsePressure);
  }
  
  /**
   * Trigger a collapse event
   * @private
   */
  _triggerCollapse() {
    const preBefore = this.rungProbabilities();
    const orderBefore = this.orderParameter();
    
    // Perform measurement
    const result = this.measure();
    
    // Record event
    this.collapseEvents.push({
      t: this.t,
      step: this.stepCount,
      pressure: this.collapsePressure,
      orderBefore: orderBefore.r,
      outcome: result.outcome,
      probability: result.probability
    });
    
    // Reset collapse pressure after collapse
    this.collapsePressure = 0;
    
    return result;
  }
  
  /**
   * Manually trigger collapse
   */
  triggerCollapse() {
    return this._triggerCollapse();
  }
  
  /**
   * Get synchronization metrics
   */
  syncMetrics() {
    const orderParam = this.orderParameter();
    const phases = this.getRungPhases();
    const amplitudes = this.getRungAmplitudes();
    
    // Compute phase variance
    let phaseVariance = 0;
    const meanPhase = orderParam.psi;
    
    for (let n = 0; n < this.N; n++) {
      let diff = phases[n] - meanPhase;
      // Wrap to [-π, π]
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      phaseVariance += diff * diff * amplitudes[n];
    }
    
    const totalAmp = amplitudes.reduce((a, b) => a + b, 0);
    phaseVariance = totalAmp > 0 ? phaseVariance / totalAmp : 0;
    
    // Estimate critical coupling
    const freqSpread = Math.max(...this.frequencies) - Math.min(...this.frequencies);
    const criticalK = freqSpread * 2 / Math.PI;
    
    return {
      orderParameter: orderParam.r,
      meanPhase: orderParam.psi,
      phaseVariance,
      phaseStdDev: Math.sqrt(phaseVariance),
      synchronization: orderParam.r,
      criticalCoupling: criticalK,
      supercritical: this.K > criticalK,
      collapsePressure: this.collapsePressure,
      pressureRatio: this.collapsePressure / this.collapseThreshold
    };
  }
  
  /**
   * Get collapse pressure dynamics
   */
  collapseDynamics() {
    return {
      pressure: this.collapsePressure,
      threshold: this.collapseThreshold,
      ratio: this.collapsePressure / this.collapseThreshold,
      willCollapse: this.collapsePressure >= this.collapseThreshold,
      events: this.collapseEvents.slice(-10),
      totalCollapses: this.collapseEvents.length
    };
  }
  
  /**
   * Combined metrics
   */
  metrics() {
    const base = super.metrics();
    const sync = this.syncMetrics();
    
    return {
      ...base,
      kuramoto: {
        K: this.K,
        frequencies: this.frequencies,
        ...sync
      }
    };
  }
  
  /**
   * Reset state and history
   */
  reset() {
    super.reset();
    this.collapsePressure = 0;
    this.collapseEvents = [];
    this.orderParameterHistory = [];
  }
  
  /**
   * Run with sync tracking
   * @param {number} steps - Number of steps
   * @param {number} [dt=0.01] - Time step
   * @returns {object} Trajectory and sync data
   */
  runWithSync(steps, dt = 0.01) {
    const trajectory = [];
    const syncHistory = [];
    
    for (let i = 0; i < steps; i++) {
      this.step(dt);
      trajectory.push(this.metrics());
      syncHistory.push({
        t: this.t,
        ...this.syncMetrics()
      });
    }
    
    return {
      trajectory,
      syncHistory,
      collapseEvents: this.collapseEvents.slice()
    };
  }
  
  /**
   * Detect synchronization transition
   * @param {number} windowSize - Window for averaging
   */
  detectSyncTransition(windowSize = 50) {
    if (this.orderParameterHistory.length < windowSize * 2) {
      return { detected: false, reason: 'insufficient_data' };
    }
    
    const history = this.orderParameterHistory;
    const n = history.length;
    
    // Compare early and late windows
    const earlyWindow = history.slice(n - windowSize * 2, n - windowSize);
    const lateWindow = history.slice(n - windowSize);
    
    const earlyMean = earlyWindow.reduce((s, h) => s + h.r, 0) / windowSize;
    const lateMean = lateWindow.reduce((s, h) => s + h.r, 0) / windowSize;
    
    const change = lateMean - earlyMean;
    const threshold = 0.2;
    
    if (Math.abs(change) > threshold) {
      return {
        detected: true,
        direction: change > 0 ? 'synchronizing' : 'desynchronizing',
        earlyR: earlyMean,
        lateR: lateMean,
        change
      };
    }
    
    return {
      detected: false,
      earlyR: earlyMean,
      lateR: lateMean,
      change
    };
  }
  
  /**
   * Get full snapshot including Kuramoto state
   */
  snapshot() {
    const base = super.snapshot();
    
    return {
      ...base,
      K: this.K,
      frequencies: this.frequencies.slice(),
      collapsePressure: this.collapsePressure,
      collapseThreshold: this.collapseThreshold,
      collapseEvents: this.collapseEvents.slice(),
      orderParameterHistory: this.orderParameterHistory.slice(-100)
    };
  }
  
  /**
   * Restore from snapshot
   */
  restore(snap) {
    super.restore(snap);
    
    this.K = snap.K;
    this.frequencies = snap.frequencies.slice();
    this.collapsePressure = snap.collapsePressure;
    this.collapseEvents = snap.collapseEvents?.slice() || [];
    this.orderParameterHistory = snap.orderParameterHistory?.slice() || [];
  }
}

/**
 * Create a Kuramoto-coupled ladder with prime resonances
 * @param {number[]} primes - Primes for rung excitation
 * @param {object} [opts={}] - Options
 */
function createKuramotoLadder(primes, opts = {}) {
  const N = opts.N ?? Math.max(16, Math.max(...primes) + 1);
  
  const ladder = new KuramotoCoupledLadder({
    N,
    d: opts.d ?? 1,
    J: opts.J ?? 0.25,
    K: opts.K ?? 0.1,
    frequencies: opts.frequencies,
    collapseThreshold: opts.collapseThreshold ?? 1.0,
    collapseDecay: opts.collapseDecay ?? 0.1,
    autoCollapse: opts.autoCollapse ?? false,
    periodic: opts.periodic ?? true,
    zChannels: opts.zChannels,
    Jt: opts.Jt
  });
  
  if (primes.length > 0) {
    ladder.excitePrimes(primes, opts.ampScale ?? 1);
  }
  
  return ladder;
}

/**
 * Run a collapse pressure experiment
 * Track how Z-flux builds collapse pressure until threshold
 * 
 * @param {object} opts - Experiment options
 * @returns {object} Experiment results
 */
function runCollapsePressureExperiment(opts = {}) {
  const {
    N = 16,
    primes = [2, 3, 5, 7],
    J = 0.25,
    K = 0.1,
    collapseThreshold = 0.5,
    maxSteps = 1000,
    dt = 0.01
  } = opts;
  
  const ladder = createKuramotoLadder(primes, {
    N, J, K,
    collapseThreshold,
    autoCollapse: true,
    collapseDecay: 0.05
  });
  
  const results = {
    trajectory: [],
    collapses: [],
    finalState: null
  };
  
  for (let step = 0; step < maxSteps; step++) {
    ladder.step(dt);
    
    if (step % 10 === 0) {
      results.trajectory.push({
        step,
        t: ladder.t,
        orderParameter: ladder.orderParameter().r,
        collapsePressure: ladder.collapsePressure,
        entropy: ladder.coreMetrics().entropy
      });
    }
    
    // Check for new collapses
    if (ladder.collapseEvents.length > results.collapses.length) {
      results.collapses.push(
        ladder.collapseEvents[ladder.collapseEvents.length - 1]
      );
    }
  }
  
  results.finalState = ladder.metrics();
  results.syncTransition = ladder.detectSyncTransition();
  
  return results;
}

export {
    KuramotoCoupledLadder,
    createKuramotoLadder,
    runCollapsePressureExperiment,
    kuramotoOrderParameter,
    getPhase
};