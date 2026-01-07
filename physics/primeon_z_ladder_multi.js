/**
 * Multi-Channel Primeon Z-Ladder
 * 
 * Extension of PrimeonZLadderU with multiple Z sectors for hierarchical memory:
 * - Fast Z (working memory): High leak rate, short-term storage
 * - Slow Z (long-term memory): Low leak rate, persistent storage  
 * - Permanent Z (archival): No leak, permanent storage
 * 
 * Features:
 * - Named Z channels with individual configurations
 * - Cross-channel interference
 * - Channel-specific metrics and snapshots
 * - Time-dependent Hamiltonian support
 * - Shaped excitation pulses
 */

'use strict';

const {
  PrimeonZLadderU,
  C,
  shannonEntropyNats,
  probsOf,
  normalize
} = require('./primeon_z_ladder_u');

/**
 * Z Channel configuration
 */
class ZChannel {
  /**
   * @param {object} config
   * @param {string} config.name - Channel identifier
   * @param {number} config.dz - Internal dimension per rung
   * @param {number} config.leak - Leak rate from core to this channel
   * @param {number} [config.decay=0] - Internal decay rate within channel
   * @param {number} [config.crossCoupling=0] - Coupling to other channels
   */
  constructor(config) {
    this.name = config.name;
    this.dz = config.dz ?? 1;
    this.leak = Math.max(0, Math.min(1, config.leak ?? 0.05));
    this.decay = config.decay ?? 0;
    this.crossCoupling = config.crossCoupling ?? 0;
    this.N = 0; // Set when attached to ladder
    
    // State array (initialized when attached)
    this.z = null;
    
    // Metrics
    this.totalFlux = 0;
    this.lastFlux = 0;
  }
  
  /**
   * Initialize channel state
   * @param {number} N - Number of rungs
   */
  init(N) {
    this.N = N;
    this.z = Array.from({ length: N * this.dz }, () => C.zero());
    this.totalFlux = 0;
    this.lastFlux = 0;
  }
  
  /**
   * Reset channel to vacuum
   */
  reset() {
    for (let i = 0; i < this.z.length; i++) {
      this.z[i] = C.zero();
    }
    this.totalFlux = 0;
    this.lastFlux = 0;
  }
  
  /**
   * Compute channel metrics
   */
  metrics() {
    const p = probsOf(this.z);
    const H = shannonEntropyNats(p);
    
    let norm = 0;
    for (const v of this.z) {
      norm += C.abs2(v);
    }
    norm = Math.sqrt(norm);
    
    return {
      name: this.name,
      entropy: H,
      norm,
      totalFlux: this.totalFlux,
      lastFlux: this.lastFlux,
      coherence: 1 / (1 + H)
    };
  }
  
  /**
   * Get state snapshot
   */
  snapshot() {
    return {
      name: this.name,
      dz: this.dz,
      leak: this.leak,
      decay: this.decay,
      z: this.z.map(v => ({ re: v.re, im: v.im })),
      ...this.metrics()
    };
  }
  
  /**
   * Restore from snapshot
   */
  restore(snap) {
    this.z = snap.z.map(v => new C(v.re, v.im));
    this.totalFlux = snap.totalFlux;
    this.lastFlux = snap.lastFlux;
  }
}

/**
 * PrimeonZLadderMulti - Multi-channel Z-ladder with hierarchical memory
 */
class PrimeonZLadderMulti {
  /**
   * @param {object} opts
   * @param {number} opts.N - Number of ladder rungs
   * @param {number} [opts.d=1] - Core internal dimension per rung
   * @param {number} [opts.J=0.25] - Nearest-neighbor coupling strength
   * @param {object[]} opts.zChannels - Array of channel configurations
   * @param {boolean} [opts.periodic=true] - Periodic boundary conditions
   * @param {Function} [opts.Jt=null] - Time-dependent J function J(t)
   */
  constructor(opts) {
    this.N = opts.N;
    this.d = opts.d ?? 1;
    this.J = opts.J ?? 0.25;
    this.J0 = this.J; // Store initial J for Jt reference
    this.periodic = opts.periodic ?? true;
    this.Jt = opts.Jt ?? null; // Time-dependent Hamiltonian
    
    // Core state
    this.psi = Array.from({ length: this.N * this.d }, () => C.zero());
    
    // Z channels
    this.channels = new Map();
    const channelConfigs = opts.zChannels || [
      { name: 'fast', dz: 1, leak: 0.2 },
      { name: 'slow', dz: 1, leak: 0.02 },
      { name: 'permanent', dz: 1, leak: 0.001, decay: 0 }
    ];
    
    for (const config of channelConfigs) {
      const channel = new ZChannel(config);
      channel.init(this.N);
      this.channels.set(config.name, channel);
    }
    
    // Metrics
    this.t = 0;
    this.stepCount = 0;
  }
  
  /**
   * Get a specific Z channel
   * @param {string} name - Channel name
   */
  getChannel(name) {
    return this.channels.get(name);
  }
  
  /**
   * Get all channel names
   */
  getChannelNames() {
    return Array.from(this.channels.keys());
  }
  
  /**
   * Reset all state to vacuum
   */
  reset() {
    for (let i = 0; i < this.psi.length; i++) {
      this.psi[i] = C.zero();
    }
    
    for (const channel of this.channels.values()) {
      channel.reset();
    }
    
    this.t = 0;
    this.stepCount = 0;
  }
  
  /**
   * Get current coupling strength (may be time-dependent)
   */
  getCurrentJ() {
    if (this.Jt) {
      return this.Jt(this.t);
    }
    return this.J;
  }
  
  /**
   * Excite a specific rung
   * @param {number} n - Rung index
   * @param {C} [amp] - Complex amplitude
   * @param {number} [k=0] - Internal index within rung
   */
  exciteRung(n, amp = new C(1, 0), k = 0) {
    const i = ((n % this.N) + this.N) % this.N * this.d + (k % this.d);
    this.psi[i] = amp;
    normalize(this.psi);
  }
  
  /**
   * Excite multiple rungs uniformly
   * @param {number[]} rungs - Array of rung indices
   * @param {number} [ampScale=1] - Amplitude scale
   */
  exciteRungs(rungs, ampScale = 1) {
    for (const n of rungs) {
      const idx = ((n % this.N) + this.N) % this.N;
      const i = idx * this.d;
      this.psi[i] = C.add(this.psi[i], new C(ampScale, 0));
    }
    normalize(this.psi);
  }
  
  /**
   * Excite with prime-based rung mapping
   * @param {number[]} primes - Prime numbers to map to rungs
   * @param {number} [ampScale=1] - Amplitude scale
   */
  excitePrimes(primes, ampScale = 1) {
    for (const p of primes) {
      const idx = ((p % this.N) + this.N) % this.N;
      const i = idx * this.d;
      this.psi[i] = C.add(this.psi[i], new C(ampScale, 0));
    }
    normalize(this.psi);
  }
  
  /**
   * Shaped pulse excitation (Gaussian envelope)
   * @param {number} centerRung - Center of the pulse
   * @param {number} width - Width parameter σ
   * @param {number} [amp=1] - Peak amplitude
   * @param {number} [phase=0] - Phase offset
   */
  gaussianPulse(centerRung, width, amp = 1, phase = 0) {
    const sigma = width;
    
    for (let n = 0; n < this.N; n++) {
      const dist = Math.min(
        Math.abs(n - centerRung),
        Math.abs(n - centerRung + this.N),
        Math.abs(n - centerRung - this.N)
      );
      
      const envelope = amp * Math.exp(-dist * dist / (2 * sigma * sigma));
      const i = n * this.d;
      
      this.psi[i] = C.add(this.psi[i], C.mul(
        new C(envelope, 0),
        C.exp(phase)
      ));
    }
    
    normalize(this.psi);
  }
  
  /**
   * Pi-pulse excitation (flip between states)
   * @param {number} n - Rung to flip
   * @param {number} [phase=0] - Phase of the flip
   */
  piPulse(n, phase = 0) {
    const idx = ((n % this.N) + this.N) % this.N;
    const i = idx * this.d;
    
    // Apply π rotation: multiply by e^(iπ/2) = i
    this.psi[i] = C.mul(this.psi[i], C.exp(Math.PI / 2 + phase));
    normalize(this.psi);
  }
  
  /**
   * One time step with multi-channel Z dynamics
   * @param {number} [dt=0.01] - Time step size
   */
  step(dt = 0.01) {
    const N = this.N;
    const d = this.d;
    const J = this.getCurrentJ();
    
    // --- 1) Core hopping dynamics ---
    const next = Array.from({ length: N * d }, () => C.zero());
    
    for (let n = 0; n < N; n++) {
      const nL = (n === 0) ? (this.periodic ? N - 1 : 0) : n - 1;
      const nR = (n === N - 1) ? (this.periodic ? 0 : N - 1) : n + 1;
      
      for (let k = 0; k < d; k++) {
        const i = n * d + k;
        const iL = nL * d + k;
        const iR = nR * d + k;
        
        const psi = this.psi[i];
        const psiL = this.psi[iL];
        const psiR = this.psi[iR];
        
        // Discrete Laplacian
        const lap = C.add(C.sub(psiL, psi), C.sub(psiR, psi));
        
        // -i * (dt*J) * lap
        const delta = C.mul(lap, new C(0, -dt * J));
        next[i] = C.add(psi, delta);
      }
    }
    
    this.psi = next;
    
    // --- 2) Multi-channel leakage ---
    for (const channel of this.channels.values()) {
      channel.lastFlux = 0;
      
      for (let i = 0; i < this.psi.length; i++) {
        const a = this.psi[i];
        const moved = C.scale(a, channel.leak);
        
        // Subtract from core
        this.psi[i] = C.sub(a, moved);
        
        // Add to channel (fold core index into channel index)
        const zi = i % (N * channel.dz);
        channel.z[zi] = C.add(channel.z[zi], moved);
        
        channel.lastFlux += C.abs2(moved);
      }
      
      channel.totalFlux += channel.lastFlux;
      
      // --- 3) Channel internal decay ---
      if (channel.decay > 0) {
        const decayFactor = 1 - channel.decay * dt;
        for (let i = 0; i < channel.z.length; i++) {
          channel.z[i] = C.scale(channel.z[i], decayFactor);
        }
      }
    }
    
    // --- 4) Cross-channel coupling ---
    this._applyCrossChannelCoupling(dt);
    
    // --- 5) Normalize core ---
    normalize(this.psi);
    
    this.t += dt;
    this.stepCount++;
    
    return this.metrics();
  }
  
  /**
   * Apply cross-channel coupling
   * @private
   */
  _applyCrossChannelCoupling(dt) {
    const channelList = Array.from(this.channels.values());
    
    for (let a = 0; a < channelList.length; a++) {
      for (let b = a + 1; b < channelList.length; b++) {
        const chanA = channelList[a];
        const chanB = channelList[b];
        
        const coupling = Math.min(chanA.crossCoupling, chanB.crossCoupling);
        if (coupling <= 0) continue;
        
        // Transfer some amplitude between channels
        const minLen = Math.min(chanA.z.length, chanB.z.length);
        
        for (let i = 0; i < minLen; i++) {
          const zA = chanA.z[i];
          const zB = chanB.z[i];
          
          const transfer = coupling * dt;
          
          // A -> B
          const toB = C.scale(zA, transfer);
          chanA.z[i] = C.sub(zA, toB);
          chanB.z[i] = C.add(zB, toB);
        }
      }
    }
  }
  
  /**
   * Run multiple steps
   * @param {number} steps - Number of steps
   * @param {number} [dt=0.01] - Time step size
   */
  run(steps, dt = 0.01) {
    const trajectory = [];
    for (let i = 0; i < steps; i++) {
      trajectory.push(this.step(dt));
    }
    return trajectory;
  }
  
  /**
   * Compute core metrics
   */
  coreMetrics() {
    const p = probsOf(this.psi);
    const H = shannonEntropyNats(p);
    
    let meanRe = 0, meanIm = 0;
    for (const v of this.psi) {
      meanRe += v.re;
      meanIm += v.im;
    }
    const orderParameter = Math.sqrt(meanRe * meanRe + meanIm * meanIm) / this.psi.length;
    
    return {
      entropy: H,
      coherence: 1 / (1 + H),
      orderParameter
    };
  }
  
  /**
   * Compute combined metrics
   */
  metrics() {
    const core = this.coreMetrics();
    
    const channelMetrics = {};
    for (const [name, channel] of this.channels) {
      channelMetrics[name] = channel.metrics();
    }
    
    // Compute total Z entropy
    let totalZEntropy = 0;
    for (const m of Object.values(channelMetrics)) {
      totalZEntropy += m.entropy;
    }
    
    return {
      t: this.t,
      stepCount: this.stepCount,
      core,
      channels: channelMetrics,
      totalZEntropy,
      currentJ: this.getCurrentJ()
    };
  }
  
  /**
   * Get per-channel metrics
   */
  channelMetrics() {
    const result = {};
    for (const [name, channel] of this.channels) {
      result[name] = channel.metrics();
    }
    return result;
  }
  
  /**
   * Get probability distribution over rungs
   */
  rungProbabilities() {
    const probs = new Array(this.N).fill(0);
    for (let n = 0; n < this.N; n++) {
      for (let k = 0; k < this.d; k++) {
        const i = n * this.d + k;
        probs[n] += C.abs2(this.psi[i]);
      }
    }
    const total = probs.reduce((a, b) => a + b, 0) || 1;
    return probs.map(p => p / total);
  }
  
  /**
   * Sample a rung according to |ψ|² distribution
   */
  sampleRung() {
    const probs = this.rungProbabilities();
    const r = Math.random();
    let cumulative = 0;
    for (let n = 0; n < this.N; n++) {
      cumulative += probs[n];
      if (r <= cumulative) return n;
    }
    return this.N - 1;
  }
  
  /**
   * Collapse to a specific rung
   * @param {number} n - Rung to collapse to
   */
  collapseToRung(n) {
    const idx = ((n % this.N) + this.N) % this.N;
    
    for (let i = 0; i < this.psi.length; i++) {
      const rungIdx = Math.floor(i / this.d);
      if (rungIdx !== idx) {
        this.psi[i] = C.zero();
      }
    }
    normalize(this.psi);
  }
  
  /**
   * Perform measurement and collapse
   */
  measure() {
    const probsBefore = this.rungProbabilities();
    const sampledRung = this.sampleRung();
    const probability = probsBefore[sampledRung];
    
    this.collapseToRung(sampledRung);
    
    return {
      outcome: sampledRung,
      probability,
      probsBefore,
      metricsAfter: this.metrics()
    };
  }
  
  /**
   * Compute entanglement entropy between core and Z channels
   * Uses bipartite entanglement measure
   */
  entanglementEntropy() {
    // Compute reduced density matrix for core
    // For simplicity, use purity-based estimate: S ≈ log(d) - log(purity)
    
    let corePurity = 0;
    const coreProbs = this.rungProbabilities();
    for (const p of coreProbs) {
      corePurity += p * p;
    }
    
    // Von Neumann entropy estimate
    const maxEntropy = Math.log(this.N);
    const entropy = maxEntropy - Math.log(1 / corePurity);
    
    return Math.max(0, Math.min(maxEntropy, entropy));
  }
  
  /**
   * Get full state snapshot
   */
  snapshot() {
    const channelSnapshots = {};
    for (const [name, channel] of this.channels) {
      channelSnapshots[name] = channel.snapshot();
    }
    
    return {
      t: this.t,
      stepCount: this.stepCount,
      N: this.N,
      d: this.d,
      J: this.J,
      periodic: this.periodic,
      psi: this.psi.map(v => ({ re: v.re, im: v.im })),
      channels: channelSnapshots,
      ...this.metrics()
    };
  }
  
  /**
   * Restore from snapshot
   */
  restore(snap) {
    this.t = snap.t;
    this.stepCount = snap.stepCount;
    this.psi = snap.psi.map(v => new C(v.re, v.im));
    
    for (const [name, channelSnap] of Object.entries(snap.channels)) {
      const channel = this.channels.get(name);
      if (channel) {
        channel.restore(channelSnap);
      }
    }
  }
}

/**
 * Factory function for creating multi-channel ladder with prime-based config
 * @param {number[]} primes - Prime numbers for initialization
 * @param {object} [opts={}] - Additional options
 */
function createMultiChannelLadder(primes, opts = {}) {
  const N = opts.N ?? Math.max(16, Math.max(...primes) + 1);
  
  const zChannels = opts.zChannels || [
    { name: 'fast', dz: 1, leak: 0.2 },
    { name: 'slow', dz: 1, leak: 0.02, decay: 0.001 },
    { name: 'permanent', dz: 1, leak: 0.001, decay: 0 }
  ];
  
  const ladder = new PrimeonZLadderMulti({
    N,
    d: opts.d ?? 1,
    J: opts.J ?? 0.25,
    zChannels,
    periodic: opts.periodic ?? true,
    Jt: opts.Jt ?? null
  });
  
  if (primes.length > 0) {
    ladder.excitePrimes(primes, opts.ampScale ?? 1);
  }
  
  return ladder;
}

/**
 * Adiabatic protocol helper
 * Creates time-dependent J function for adiabatic quantum computing
 * 
 * @param {number} J0 - Initial coupling
 * @param {number} J1 - Final coupling
 * @param {number} T - Total evolution time
 * @param {string} [schedule='linear'] - Schedule type
 */
function createAdiabaticSchedule(J0, J1, T, schedule = 'linear') {
  switch (schedule) {
    case 'linear':
      return (t) => J0 + (J1 - J0) * Math.min(1, t / T);
    
    case 'quadratic':
      return (t) => {
        const s = Math.min(1, t / T);
        return J0 + (J1 - J0) * s * s;
      };
    
    case 'sinusoidal':
      return (t) => {
        const s = Math.min(1, t / T);
        return J0 + (J1 - J0) * (1 - Math.cos(Math.PI * s)) / 2;
      };
    
    case 'exponential':
      return (t) => {
        const s = Math.min(1, t / T);
        const tau = T / 3; // Characteristic time
        return J0 + (J1 - J0) * (1 - Math.exp(-s * T / tau));
      };
    
    default:
      return (t) => J0;
  }
}

module.exports = {
  ZChannel,
  PrimeonZLadderMulti,
  createMultiChannelLadder,
  createAdiabaticSchedule
};