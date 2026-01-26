/**
 * Base class for phase-amplitude oscillator
 *
 * Oscillators start QUIESCENT (amplitude = 0) and must be EXCITED
 * by input to become active. This ensures the field response
 * reflects the input, not a default full-amplitude state.
 */

class Oscillator {
  constructor(frequency, phase = 0, amplitude = 0) {  // Start quiescent!
    this.freq = frequency;
    this.phase = phase;
    this.amplitude = amplitude;
    this.baseAmplitude = amplitude;  // Remember initial state
    this.phaseHistory = [];
  }
  
  tick(dt, coupling = 0) {
    this.phase = (this.phase + 2 * Math.PI * this.freq * dt + coupling) % (2 * Math.PI);
    this.phaseHistory.push(this.phase);
    if (this.phaseHistory.length > 100) this.phaseHistory.shift();
  }
  
  excite(amount = 0.5) {
    this.amplitude = Math.min(1, this.amplitude + amount);
  }
  
  decay(rate = 0.02, dt = 1) {
    this.amplitude *= (1 - rate * dt);
  }
  
  getState() {
    return {
      freq: this.freq,
      phase: this.phase,
      amplitude: this.amplitude
    };
  }
  
  reset() {
    this.phase = 0;
    this.amplitude = 0;  // Reset to quiescent, not full amplitude!
    this.baseAmplitude = 0;
    this.phaseHistory = [];
  }
}

/**
 * Collection of coupled oscillators
 */
class OscillatorBank {
  /**
   * Create an OscillatorBank
   * @param {number|number[]} sizeOrFrequencies - Either a number (size) or array of frequencies
   * @param {number[]} [defaultPrimes] - Optional default primes for size-based construction
   */
  constructor(sizeOrFrequencies, defaultPrimes = null) {
    if (typeof sizeOrFrequencies === 'number') {
      // Size-based constructor: create oscillators with first N primes as frequencies
      const primes = defaultPrimes || this._generatePrimes(sizeOrFrequencies);
      this.oscillators = primes.slice(0, sizeOrFrequencies).map(p => new Oscillator(p));
      this.primeList = primes.slice(0, sizeOrFrequencies);
    } else {
      // Frequency array constructor
      this.oscillators = sizeOrFrequencies.map(f => new Oscillator(f));
      this.primeList = sizeOrFrequencies;
    }
  }
  
  /**
   * Generate first N primes (helper)
   */
  _generatePrimes(n) {
    const primes = [];
    let num = 2;
    while (primes.length < n) {
      let isPrime = true;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) { isPrime = false; break; }
      }
      if (isPrime) primes.push(num);
      num++;
    }
    return primes;
  }
  
  tick(dt, couplingFn) {
    for (const osc of this.oscillators) {
      const coupling = couplingFn ? couplingFn(osc, this.oscillators) : 0;
      osc.tick(dt, coupling);
    }
  }
  
  exciteByIndices(indices, amount = 0.5) {
    for (const idx of indices) {
      if (idx >= 0 && idx < this.oscillators.length) {
        this.oscillators[idx].excite(amount);
      }
    }
  }
  
  /**
   * Excite oscillators based on prime frequencies
   * @param {number[]} primes - Array of prime numbers to excite
   * @param {number} [amount=0.5] - Excitation amount
   */
  excite(primes, amount = 0.5) {
    const primeSet = new Set(primes);
    for (let i = 0; i < this.oscillators.length; i++) {
      // Match by prime frequency
      if (primeSet.has(this.primeList[i]) || primeSet.has(this.oscillators[i].freq)) {
        this.oscillators[i].excite(amount);
      }
    }
  }
  
  decayAll(rate = 0.02, dt = 1) {
    for (const osc of this.oscillators) {
      osc.decay(rate, dt);
    }
  }
  
  getState() {
    return this.oscillators.map(o => o.getState());
  }
  
  getAmplitudes() {
    return this.oscillators.map(o => o.amplitude);
  }
  
  getPhases() {
    return this.oscillators.map(o => o.phase);
  }
  
  reset() {
    for (const osc of this.oscillators) {
      osc.reset();
    }
  }
}

// Named exports for ESM compatibility
export { Oscillator, OscillatorBank };

export default { Oscillator, OscillatorBank };