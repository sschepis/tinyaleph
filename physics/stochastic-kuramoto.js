/**
 * Stochastic Kuramoto Models
 * 
 * Kuramoto oscillators with Langevin noise for robust synchronization:
 *   dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ) + σ·ξᵢ(t)
 * 
 * Features:
 * - White noise (Wiener process)
 * - Colored noise (Ornstein-Uhlenbeck process)
 * - Temperature-dependent coupling
 * - Noise-induced synchronization detection
 */

'use strict';

/**
 * Box-Muller transform for Gaussian random numbers
 * @returns {number} Standard normal random variable
 */
import { KuramotoModel } from './kuramoto.js';

function gaussianRandom() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/**
 * StochasticKuramoto - Kuramoto model with Langevin noise
 * 
 * Adds thermal fluctuations to oscillator dynamics:
 *   dθᵢ = [ωᵢ + K·coupling(i)]dt + σ·dWᵢ
 * 
 * where dWᵢ is a Wiener increment with variance dt.
 */
class StochasticKuramoto extends KuramotoModel {
  /**
   * @param {number[]} frequencies - Natural frequencies ωᵢ
   * @param {object} options - Configuration options
   * @param {number} [options.coupling=0.3] - Coupling strength K
   * @param {number} [options.noiseIntensity=0.1] - Noise amplitude σ
   * @param {string} [options.noiseType='white'] - 'white' or 'colored'
   * @param {number} [options.correlationTime=1.0] - τ for colored noise
   * @param {number} [options.temperature=1.0] - Temperature for T-dependent coupling
   */
  constructor(frequencies, options = {}) {
    super(frequencies, options.coupling || 0.3);
    
    this.sigma = options.noiseIntensity ?? 0.1;
    this.noiseType = options.noiseType || 'white';
    this.tau = options.correlationTime ?? 1.0;
    this.temperature = options.temperature ?? 1.0;
    this.useTemperatureCoupling = options.temperatureCoupling ?? false;
    
    // For colored noise (Ornstein-Uhlenbeck): dη = -η/τ dt + σ/√τ dW
    // Each oscillator has its own OU process
    this.coloredNoiseState = new Float64Array(frequencies.length);
    
    // Track noise history for analysis
    this.noiseHistory = [];
    this.maxHistoryLength = 1000;
    
    // Statistics
    this.noiseStats = {
      mean: 0,
      variance: 0,
      sampleCount: 0
    };
  }
  
  /**
   * Set noise intensity dynamically
   * @param {number} sigma - New noise intensity
   */
  setNoiseIntensity(sigma) {
    this.sigma = sigma;
  }
  
  /**
   * Set temperature (affects coupling if temperatureCoupling is enabled)
   * @param {number} T - Temperature
   */
  setTemperature(T) {
    this.temperature = Math.max(0.01, T);
  }
  
  /**
   * Get effective coupling (temperature-dependent)
   * K_eff = K / T  (Arrhenius-like)
   */
  getEffectiveCoupling() {
    if (this.useTemperatureCoupling) {
      return this.K / this.temperature;
    }
    return this.K;
  }
  
  /**
   * Generate white noise increment
   * @param {number} dt - Time step
   * @returns {number} Noise increment σ·√dt·N(0,1)
   */
  whiteNoiseIncrement(dt) {
    return this.sigma * Math.sqrt(dt) * gaussianRandom();
  }
  
  /**
   * Update Ornstein-Uhlenbeck process for colored noise
   * dη = -η/τ dt + (σ/√τ)·dW
   * 
   * @param {number} idx - Oscillator index
   * @param {number} dt - Time step
   * @returns {number} Colored noise value η
   */
  updateColoredNoise(idx, dt) {
    const eta = this.coloredNoiseState[idx];
    const decay = Math.exp(-dt / this.tau);
    const diffusion = this.sigma * Math.sqrt((1 - decay * decay) / 2);
    
    // Exact update for OU process
    this.coloredNoiseState[idx] = eta * decay + diffusion * gaussianRandom();
    
    return this.coloredNoiseState[idx];
  }
  
  /**
   * Get noise increment based on noise type
   * @param {number} idx - Oscillator index
   * @param {number} dt - Time step
   * @returns {number} Noise increment
   */
  getNoiseIncrement(idx, dt) {
    if (this.noiseType === 'colored') {
      return this.updateColoredNoise(idx, dt) * dt;
    }
    return this.whiteNoiseIncrement(dt);
  }
  
  /**
   * Stochastic Kuramoto coupling with noise
   * @param {object} osc - Oscillator
   * @param {number} idx - Oscillator index
   * @param {number} dt - Time step
   * @returns {number} Phase increment (deterministic + stochastic)
   */
  stochasticCoupling(osc, idx, dt) {
    // Deterministic Kuramoto coupling
    let coupling = 0;
    const Keff = this.getEffectiveCoupling();
    
    for (const other of this.oscillators) {
      if (other !== osc) {
        coupling += Math.sin(other.phase - osc.phase);
      }
    }
    
    const deterministicPart = Keff * coupling / this.oscillators.length * dt;
    
    // Stochastic part
    const stochasticPart = this.getNoiseIncrement(idx, dt);
    
    // Update statistics
    this._updateNoiseStats(stochasticPart);
    
    return deterministicPart + stochasticPart;
  }
  
  /**
   * Update running noise statistics
   * @private
   */
  _updateNoiseStats(noiseValue) {
    const n = ++this.noiseStats.sampleCount;
    const delta = noiseValue - this.noiseStats.mean;
    this.noiseStats.mean += delta / n;
    const delta2 = noiseValue - this.noiseStats.mean;
    this.noiseStats.variance += (delta * delta2 - this.noiseStats.variance) / n;
  }
  
  /**
   * Advance system by one time step with stochastic dynamics
   * @param {number} dt - Time step size
   */
  tick(dt) {
    // Store noise values for this step
    const stepNoise = [];
    
    for (let i = 0; i < this.oscillators.length; i++) {
      const osc = this.oscillators[i];
      const phaseIncrement = this.stochasticCoupling(osc, i, dt);
      
      stepNoise.push(phaseIncrement);
      
      // Update phase
      osc.phase += osc.frequency * dt + phaseIncrement;
      osc.phase = ((osc.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      
      // Amplitude decay
      osc.decay(0.02, dt);
    }
    
    // Record history
    if (this.noiseHistory.length < this.maxHistoryLength) {
      this.noiseHistory.push({
        t: Date.now(),
        noise: stepNoise,
        orderParameter: this.orderParameter()
      });
    } else {
      this.noiseHistory.shift();
      this.noiseHistory.push({
        t: Date.now(),
        noise: stepNoise,
        orderParameter: this.orderParameter()
      });
    }
  }
  
  /**
   * Run multiple steps
   * @param {number} steps - Number of steps
   * @param {number} dt - Time step size
   * @returns {object[]} Evolution history
   */
  evolve(steps, dt = 0.01) {
    const trajectory = [];
    
    for (let i = 0; i < steps; i++) {
      this.tick(dt);
      trajectory.push({
        step: i,
        orderParameter: this.orderParameter(),
        meanPhase: this.meanPhase(),
        noiseStats: { ...this.noiseStats }
      });
    }
    
    return trajectory;
  }
  
  /**
   * Detect noise-induced synchronization
   * 
   * Phenomenon where noise can actually enhance synchronization
   * by helping oscillators escape from metastable states.
   * 
   * @param {number} baselineSteps - Steps to establish baseline
   * @param {number} noisySteps - Steps with noise
   * @param {number} dt - Time step
   * @returns {object} Detection result
   */
  detectNoiseInducedSync(baselineSteps = 100, noisySteps = 200, dt = 0.01) {
    // Save current state
    const originalSigma = this.sigma;
    
    // Baseline (no noise)
    this.sigma = 0;
    const baselineTrajectory = this.evolve(baselineSteps, dt);
    const baselineOrder = baselineTrajectory.slice(-20)
      .reduce((sum, t) => sum + t.orderParameter, 0) / 20;
    
    // With noise
    this.sigma = originalSigma;
    const noisyTrajectory = this.evolve(noisySteps, dt);
    const noisyOrder = noisyTrajectory.slice(-20)
      .reduce((sum, t) => sum + t.orderParameter, 0) / 20;
    
    const enhancement = noisyOrder - baselineOrder;
    const isNoiseInduced = enhancement > 0.1;
    
    return {
      baselineOrderParameter: baselineOrder,
      noisyOrderParameter: noisyOrder,
      enhancement,
      isNoiseInduced,
      noiseIntensity: originalSigma,
      baselineTrajectory,
      noisyTrajectory
    };
  }
  
  /**
   * Compute stochastic order parameter with error bars
   * @param {number} samples - Number of samples for averaging
   * @param {number} dt - Time step between samples
   * @returns {object} Order parameter with uncertainty
   */
  orderParameterWithUncertainty(samples = 100, dt = 0.01) {
    const values = [];
    
    for (let i = 0; i < samples; i++) {
      this.tick(dt);
      values.push(this.orderParameter());
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / samples;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples;
    const stdError = Math.sqrt(variance / samples);
    
    return {
      mean,
      stdDev: Math.sqrt(variance),
      stdError,
      confidence95: [mean - 1.96 * stdError, mean + 1.96 * stdError],
      samples: values
    };
  }
  
  /**
   * Compute autocorrelation of order parameter
   * @param {number} maxLag - Maximum lag to compute
   * @returns {number[]} Autocorrelation values
   */
  orderParameterAutocorrelation(maxLag = 50) {
    if (this.noiseHistory.length < maxLag + 10) {
      return new Array(maxLag).fill(0);
    }
    
    const orderParams = this.noiseHistory.map(h => h.orderParameter);
    const n = orderParams.length;
    const mean = orderParams.reduce((a, b) => a + b, 0) / n;
    const centered = orderParams.map(v => v - mean);
    
    const autocorr = [];
    const variance = centered.reduce((sum, v) => sum + v * v, 0);
    
    for (let lag = 0; lag < maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += centered[i] * centered[i + lag];
      }
      autocorr.push(variance > 0 ? sum / variance : 0);
    }
    
    return autocorr;
  }
  
  /**
   * Get correlation time from autocorrelation decay
   * @returns {number} Estimated correlation time
   */
  estimateCorrelationTime() {
    const autocorr = this.orderParameterAutocorrelation(100);
    
    // Find where autocorrelation drops to 1/e
    const threshold = 1 / Math.E;
    for (let i = 0; i < autocorr.length; i++) {
      if (autocorr[i] < threshold) {
        return i;
      }
    }
    
    return autocorr.length; // Didn't decay fast enough
  }
  
  /**
   * Reset noise state
   */
  resetNoise() {
    this.coloredNoiseState.fill(0);
    this.noiseHistory = [];
    this.noiseStats = { mean: 0, variance: 0, sampleCount: 0 };
  }
  
  /**
   * Get current state snapshot
   */
  getState() {
    return {
      ...super.getState(),
      noiseIntensity: this.sigma,
      noiseType: this.noiseType,
      correlationTime: this.tau,
      temperature: this.temperature,
      effectiveCoupling: this.getEffectiveCoupling(),
      noiseStats: { ...this.noiseStats },
      coloredNoiseState: [...this.coloredNoiseState]
    };
  }
}

/**
 * ColoredNoiseKuramoto - Specialized class for Ornstein-Uhlenbeck noise
 * 
 * Provides more control over colored noise parameters and analysis.
 */
class ColoredNoiseKuramoto extends StochasticKuramoto {
  /**
   * @param {number[]} frequencies - Natural frequencies
   * @param {object} options - Configuration
   * @param {number} [options.coupling=0.3] - Coupling strength
   * @param {number} [options.noiseIntensity=0.1] - Noise amplitude
   * @param {number} [options.correlationTime=1.0] - OU correlation time
   */
  constructor(frequencies, options = {}) {
    super(frequencies, {
      ...options,
      noiseType: 'colored'
    });
  }
  
  /**
   * Set correlation time dynamically
   * @param {number} tau - New correlation time
   */
  setCorrelationTime(tau) {
    this.tau = Math.max(0.01, tau);
  }
  
  /**
   * Get OU process stationary distribution parameters
   * For OU: variance = σ²/(2/τ) = σ²τ/2
   */
  getStationaryVariance() {
    return (this.sigma ** 2) * this.tau / 2;
  }
  
  /**
   * Check if OU processes have equilibrated
   * @param {number} threshold - Tolerance for equilibration
   */
  isEquilibrated(threshold = 0.1) {
    const expectedVar = this.getStationaryVariance();
    let actualVar = 0;
    
    for (const eta of this.coloredNoiseState) {
      actualVar += eta ** 2;
    }
    actualVar /= this.coloredNoiseState.length;
    
    return Math.abs(actualVar - expectedVar) / expectedVar < threshold;
  }
  
  /**
   * Get power spectrum estimate of noise
   * @param {number} maxFreq - Maximum frequency
   * @param {number} resolution - Frequency resolution
   */
  noisePowerSpectrum(maxFreq = 10, resolution = 0.1) {
    const spectrum = [];
    
    // Theoretical OU spectrum: S(ω) = 2σ²τ / (1 + (ωτ)²)
    for (let omega = 0; omega <= maxFreq; omega += resolution) {
      const theoretical = 2 * this.sigma ** 2 * this.tau / (1 + (omega * this.tau) ** 2);
      spectrum.push({ omega, power: theoretical });
    }
    
    return spectrum;
  }
}

/**
 * ThermalKuramoto - Temperature-controlled synchronization
 * 
 * Models thermal effects on oscillator synchronization:
 * - High temperature: Strong fluctuations, weak effective coupling
 * - Low temperature: Weak fluctuations, strong effective coupling
 * 
 * Critical temperature T_c ≈ K (coupling strength)
 */
class ThermalKuramoto extends StochasticKuramoto {
  /**
   * @param {number[]} frequencies - Natural frequencies
   * @param {object} options - Configuration
   * @param {number} [options.coupling=0.3] - Coupling strength
   * @param {number} [options.temperature=1.0] - Initial temperature
   */
  constructor(frequencies, options = {}) {
    super(frequencies, {
      ...options,
      noiseType: 'white',
      temperatureCoupling: true
    });
    
    // Noise intensity proportional to √T (fluctuation-dissipation)
    this._updateNoiseFromTemperature();
  }
  
  /**
   * Update noise intensity from temperature
   * @private
   */
  _updateNoiseFromTemperature() {
    // Fluctuation-dissipation: σ² ∝ T
    this.sigma = Math.sqrt(this.temperature) * 0.1;
  }
  
  /**
   * Set temperature and update noise
   * @param {number} T - Temperature
   */
  setTemperature(T) {
    super.setTemperature(T);
    this._updateNoiseFromTemperature();
  }
  
  /**
   * Estimate critical temperature from current state
   * T_c ≈ K for all-to-all coupling with uniform frequencies
   */
  estimateCriticalTemperature() {
    // Approximate T_c = K * (frequency spread factor)
    const freqs = this.oscillators.map(o => o.frequency);
    const meanFreq = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    const freqSpread = Math.sqrt(
      freqs.reduce((sum, f) => sum + (f - meanFreq) ** 2, 0) / freqs.length
    );
    
    return this.K * (1 + freqSpread);
  }
  
  /**
   * Perform temperature sweep to find transition
   * @param {number} Tmin - Minimum temperature
   * @param {number} Tmax - Maximum temperature
   * @param {number} steps - Number of temperature steps
   * @param {number} equilibrationSteps - Steps to equilibrate at each T
   */
  temperatureSweep(Tmin = 0.1, Tmax = 2.0, steps = 20, equilibrationSteps = 100) {
    const results = [];
    
    for (let i = 0; i < steps; i++) {
      const T = Tmin + (Tmax - Tmin) * i / (steps - 1);
      this.setTemperature(T);
      
      // Equilibrate
      this.evolve(equilibrationSteps, 0.01);
      
      // Measure
      const stats = this.orderParameterWithUncertainty(50, 0.01);
      
      results.push({
        temperature: T,
        orderParameter: stats.mean,
        stdDev: stats.stdDev,
        confidence95: stats.confidence95
      });
    }
    
    return results;
  }
  
  /**
   * Check if system is in ordered (synchronized) phase
   * @param {number} threshold - Order parameter threshold
   */
  isOrdered(threshold = 0.5) {
    return this.orderParameter() > threshold;
  }
  
  /**
   * Check if system is at or near critical temperature
   * @param {number} tolerance - Tolerance factor
   */
  isNearCritical(tolerance = 0.2) {
    const Tc = this.estimateCriticalTemperature();
    return Math.abs(this.temperature - Tc) / Tc < tolerance;
  }
}

export {
    StochasticKuramoto,
    ColoredNoiseKuramoto,
    ThermalKuramoto,
    gaussianRandom
};