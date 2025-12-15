/**
 * AlephEngine - Unified backend-agnostic prime-based computing engine
 *
 * FIELD-BASED COMPUTATION:
 * The answer emerges from oscillator dynamics, not symbolic manipulation.
 * We excite the field, evolve it, and sample at coherent emission moments.
 */

const { Hypercomplex } = require('../core/hypercomplex');
const { KuramotoModel } = require('../physics/kuramoto');
const { stateEntropy, coherence } = require('../physics/entropy');
const { estimateLyapunov, adaptiveCoupling, classifyStability } = require('../physics/lyapunov');
const { collapseProbability, shouldCollapse, bornMeasurement } = require('../physics/collapse');

class AlephEngine {
  constructor(backend, options = {}) {
    this.backend = backend;
    this.options = {
      dampingRate: 0.02,
      baseCoupling: 0.3,
      collapseCoherence: 0.7,
      collapseEntropy: 1.8,
      maxTransformSteps: 5,
      entropyThreshold: 0.5,
      // Field evolution parameters
      maxEvolutionSteps: 100,     // Max timesteps to evolve
      coherenceThreshold: 0.6,    // Min order parameter for coherent emission
      amplitudeThreshold: 0.1,    // Min amplitude to consider a prime "active"
      stableCoherence: 0.85,      // Order parameter indicating stable state
      sampleWindow: 10,           // Keep best N frames
      dt: 0.016,
      ...options
    };
    
    this._initializeOscillators();
    this._resetState();
    this.history = [];
    this.frames = [];  // Sampled coherent frames
  }
  
  _initializeOscillators() {
    const primes = this.backend.getPrimes().slice(0, this.backend.dimension);
    const frequencies = this.backend.primesToFrequencies(primes);
    this.oscillators = new KuramotoModel(frequencies, this.options.baseCoupling);
    this.primeList = primes;
  }
  
  _resetState() {
    this.state = Hypercomplex.zero(this.backend.dimension);
    this.entropy = 0;
    this.coherenceValue = 0;
    this.lyapunov = 0;
    this.collapseIntegral = 0;
    this.stability = 'MARGINAL';
  }
  
  /**
   * Main processing pipeline: encode → excite → evolve → sample → decode
   *
   * FIELD-BASED COMPUTATION:
   * The answer emerges from oscillator dynamics. We excite the field with
   * input primes, capture the transient response (before full sync),
   * and decode from the input-weighted field state.
   */
  run(input) {
    // 1. Encode input to primes
    const inputPrimes = this.backend.encode(input);
    const inputPrimeSet = new Set(inputPrimes);
    
    // 2. Capture baseline before excitation
    const baselineAmplitudes = [...this.oscillators.getWeightedAmplitudes()];
    
    // 3. Excite oscillators corresponding to input primes
    this.excite(inputPrimes);
    
    // 4. EVOLVE field and collect INPUT-SENSITIVE frames
    this.frames = [];
    let evolutionSteps = 0;
    
    // Track differential response (excited vs baseline)
    let maxDifferential = 0;
    let bestDifferentialFrame = null;
    
    for (let i = 0; i < this.options.maxEvolutionSteps; i++) {
      this.tick(this.options.dt);
      evolutionSteps++;
      
      const currentAmplitudes = this.oscillators.getWeightedAmplitudes();
      const order = this.oscillators.orderParameter();
      
      // Compute input-weighted differential response
      // Higher score = oscillators excited by INPUT are responding more than baseline
      let inputResponse = 0;
      let otherResponse = 0;
      
      for (let j = 0; j < this.primeList.length; j++) {
        const diff = Math.abs(currentAmplitudes[j]) - Math.abs(baselineAmplitudes[j] || 0);
        if (inputPrimeSet.has(this.primeList[j])) {
          inputResponse += diff;
        } else {
          otherResponse += Math.abs(diff);
        }
      }
      
      // Differential: how much MORE the input primes respond vs other primes
      const differential = inputResponse - otherResponse * 0.3;
      
      // Sample frames with good differential response
      if (differential > 0 && order > this.options.coherenceThreshold * 0.5) {
        const frame = {
          step: i,
          order: order,
          differential: differential,
          amplitudes: [...currentAmplitudes],
          entropy: this.entropy,
          stability: this.stability
        };
        
        this.frames.push(frame);
        
        if (differential > maxDifferential) {
          maxDifferential = differential;
          bestDifferentialFrame = frame;
        }
        
        // Keep only frames with good response
        if (this.frames.length > this.options.sampleWindow) {
          this.frames.sort((a, b) => b.differential - a.differential);
          this.frames = this.frames.slice(0, this.options.sampleWindow);
        }
      }
      
      // Stop if we found a strong coherent input-response
      if (differential > 1.0 && order > this.options.coherenceThreshold &&
          this.stability !== 'CHAOTIC') {
        break;
      }
    }
    
    // 5. SELECT best frame by differential (not just order)
    let bestFrame = bestDifferentialFrame ||
      (this.frames.length > 0 ? this.frames[0] : null);
    
    // 6. DECODE from field state with input weighting
    let resultPrimes, output, steps = [];
    
    if (bestFrame && bestFrame.differential > 0) {
      // Field-based: decode from transient amplitudes, weighted by input
      resultPrimes = this.amplitudesToPrimes(bestFrame.amplitudes, inputPrimeSet);
      output = this.backend.decode(resultPrimes);
    } else {
      // Fallback: symbolic reasoning (field didn't respond to input)
      const reasoningResult = this.reason(inputPrimes);
      resultPrimes = reasoningResult.primes;
      output = this.backend.decode(resultPrimes);
      steps = reasoningResult.steps;
    }
    
    // 7. Update engine state
    this.coherenceValue = bestFrame ? bestFrame.order : this.oscillators.orderParameter();
    
    // 8. Check for state collapse
    const collapsed = this.checkCollapse();
    
    // 9. Build result object
    const result = {
      input,
      inputPrimes,
      resultPrimes,
      output,
      entropy: this.entropy,
      coherence: this.coherenceValue,
      lyapunov: this.lyapunov,
      stability: this.stability,
      collapsed,
      steps,
      evolutionSteps,
      framesCollected: this.frames.length,
      bestFrameOrder: bestFrame ? bestFrame.order : 0,
      bestDifferential: bestFrame ? bestFrame.differential : 0,
      fieldBased: bestFrame && bestFrame.differential > 0,
      orderParameter: this.oscillators.orderParameter()
    };
    
    // 10. Record history
    this.history.push({
      time: Date.now(),
      input,
      output,
      entropy: this.entropy,
      fieldBased: result.fieldBased
    });
    
    return result;
  }
  
  /**
   * Convert oscillator amplitudes to primes, prioritizing input-excited oscillators
   *
   * @param amplitudes - Current oscillator amplitudes
   * @param inputPrimes - Set of primes that were excited by input
   */
  amplitudesToPrimes(amplitudes, inputPrimes = new Set()) {
    const activePrimes = [];
    
    for (let i = 0; i < Math.min(amplitudes.length, this.primeList.length); i++) {
      const amplitude = Math.abs(amplitudes[i]);
      if (amplitude > this.options.amplitudeThreshold) {
        const prime = this.primeList[i];
        // Boost score for primes that were in the input
        const inputBoost = inputPrimes.has(prime) ? 2.0 : 1.0;
        
        activePrimes.push({
          prime: prime,
          amplitude: amplitude,
          score: amplitude * inputBoost
        });
      }
    }
    
    // Sort by score (input-boosted amplitude)
    activePrimes.sort((a, b) => b.score - a.score);
    
    // Return just the primes
    return activePrimes.map(p => p.prime);
  }
  
  /**
   * Excite oscillators corresponding to given primes
   */
  excite(primes) {
    this.oscillators.exciteByPrimes(primes, this.primeList, 0.5);
  }
  
  /**
   * Advance physics simulation by one timestep
   */
  tick(dt = 0.016) {
    // Estimate Lyapunov exponent
    this.lyapunov = estimateLyapunov(this.oscillators.oscillators);
    this.stability = classifyStability(this.lyapunov);
    
    // Adapt coupling based on stability
    this.oscillators.K = adaptiveCoupling(this.options.baseCoupling, this.lyapunov);
    
    // Advance oscillators
    this.oscillators.tick(dt);
    
    // Build state from oscillator amplitudes
    const amplitudes = this.oscillators.getWeightedAmplitudes();
    this.state = new Hypercomplex(
      this.backend.dimension, 
      Float64Array.from(amplitudes.slice(0, this.backend.dimension))
    ).normalize();
    
    // Update entropy and collapse integral
    this.entropy = stateEntropy(this.state);
    this.collapseIntegral += this.entropy * dt * 0.1;
    
    return this.state;
  }
  
  /**
   * Entropy-minimizing reasoning via transform search
   */
  reason(primes) {
    const transforms = this.backend.getTransforms();
    let current = [...new Set(primes)];
    let state = this.backend.primesToState(current);
    let H = stateEntropy(state);
    const steps = [];
    
    for (let i = 0; i < this.options.maxTransformSteps && H > this.options.entropyThreshold; i++) {
      let best = null;
      let bestH = H;
      let bestPrimes = current;
      
      // Search for entropy-reducing transform
      for (const transform of transforms) {
        const newPrimes = this.backend.applyTransform(current, transform);
        
        // Skip if no change
        if (newPrimes.length === current.length && 
            newPrimes.every((p, idx) => current[idx] === p)) {
          continue;
        }
        
        const newState = this.backend.primesToState(newPrimes);
        const newH = stateEntropy(newState);
        
        if (newH < bestH) {
          best = transform;
          bestH = newH;
          bestPrimes = newPrimes;
        }
      }
      
      if (!best) break;
      
      steps.push({
        step: i + 1,
        transform: best.n || best.name || 'unnamed',
        entropyDrop: H - bestH,
        primes: bestPrimes.slice(0, 5)
      });
      
      current = bestPrimes;
      state = this.backend.primesToState(current);
      H = bestH;
    }
    
    return { primes: current, state, entropy: H, steps };
  }
  
  /**
   * Check if state should collapse
   */
  checkCollapse() {
    const prob = collapseProbability(this.collapseIntegral, this.lyapunov);
    
    if (shouldCollapse(this.coherenceValue, this.entropy, prob, {
      minCoherence: this.options.collapseCoherence,
      minEntropy: this.options.collapseEntropy
    })) {
      this.collapseIntegral = 0;
      return true;
    }
    return false;
  }
  
  /**
   * Get current physics state for monitoring
   */
  getPhysicsState() {
    return {
      state: this.state,
      entropy: this.entropy,
      coherence: this.coherenceValue,
      lyapunov: this.lyapunov,
      stability: this.stability,
      coupling: this.oscillators.K,
      orderParameter: this.oscillators.orderParameter(),
      oscillators: this.oscillators.getState(),
      collapseProbability: collapseProbability(this.collapseIntegral, this.lyapunov)
    };
  }
  
  /**
   * Switch to a different backend at runtime
   */
  setBackend(backend) {
    this.backend = backend;
    this._initializeOscillators();
    this._resetState();
  }
  
  /**
   * Get backend info
   */
  getBackendInfo() {
    return {
      name: this.backend.getName(),
      dimension: this.backend.dimension,
      transformCount: this.backend.getTransforms().length,
      primeCount: this.backend.getPrimes().length
    };
  }
  
  /**
   * Perform measurement (for quantum/scientific backends)
   */
  measure() {
    return bornMeasurement(this.state);
  }
  
  /**
   * Reset engine state without changing backend
   */
  reset() {
    this.oscillators.reset();
    this._resetState();
    this.history = [];
    this.frames = [];
  }
  
  /**
   * Get processing history
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }
  
  /**
   * Run multiple inputs in sequence
   */
  runBatch(inputs) {
    return inputs.map(input => this.run(input));
  }
  
  /**
   * Continuously evolve state without new input
   */
  evolve(steps = 10) {
    const states = [];
    for (let i = 0; i < steps; i++) {
      this.tick(this.options.dt);
      states.push({
        step: i,
        entropy: this.entropy,
        orderParameter: this.oscillators.orderParameter(),
        stability: this.stability
      });
    }
    return states;
  }
}

module.exports = { AlephEngine };