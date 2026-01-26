/**
 * Kuramoto synchronization dynamics
 */

import { OscillatorBank } from './oscillator.js';

class KuramotoModel extends OscillatorBank {
  /**
   * Create a Kuramoto synchronization model
   * @param {number[]|OscillatorBank} frequenciesOrBank - Array of frequencies or an existing OscillatorBank
   * @param {number|object} [couplingOrOptions=0.3] - Coupling strength (number) or options object
   */
  constructor(frequenciesOrBank, couplingOrOptions = 0.3) {
    if (frequenciesOrBank instanceof OscillatorBank) {
      // Use existing OscillatorBank's oscillators
      super([]);  // Initialize with empty array
      this.oscillators = frequenciesOrBank.oscillators;
      this.primeList = frequenciesOrBank.primeList || frequenciesOrBank.oscillators.map(o => o.freq);
      
      // Parse options
      if (typeof couplingOrOptions === 'object') {
        this.K = couplingOrOptions.coupling ?? 0.3;
      } else {
        this.K = couplingOrOptions;
      }
    } else {
      // Traditional constructor with frequencies array
      super(frequenciesOrBank);
      this.K = typeof couplingOrOptions === 'object'
        ? (couplingOrOptions.coupling ?? 0.3)
        : couplingOrOptions;
    }
  }
  
  /**
   * Single step forward in time
   * @param {number} dt - Timestep
   */
  step(dt) {
    this.tick(dt);
  }
  
  orderParameter() {
    let sx = 0, sy = 0;
    for (const osc of this.oscillators) {
      sx += osc.amplitude * Math.cos(osc.phase);
      sy += osc.amplitude * Math.sin(osc.phase);
    }
    const N = this.oscillators.length;
    return Math.sqrt((sx/N)**2 + (sy/N)**2);
  }
  
  meanPhase() {
    let sx = 0, sy = 0, ta = 0;
    for (const osc of this.oscillators) {
      sx += osc.amplitude * Math.cos(osc.phase);
      sy += osc.amplitude * Math.sin(osc.phase);
      ta += osc.amplitude;
    }
    return ta > 0 ? Math.atan2(sy/ta, sx/ta) : 0;
  }
  
  kuramotoCoupling(osc) {
    let coupling = 0;
    for (const other of this.oscillators) {
      if (other !== osc) {
        coupling += Math.sin(other.phase - osc.phase);
      }
    }
    return this.K * coupling / this.oscillators.length;
  }
  
  tick(dt) {
    super.tick(dt, (osc) => this.kuramotoCoupling(osc) * dt);
    for (const osc of this.oscillators) {
      osc.decay(0.02, dt);
    }
  }
  
  /**
   * Excite oscillators that correspond to given prime indices
   */
  exciteByPrimes(primes, primeList, amount = 0.5) {
    const primeSet = new Set(primes);
    for (let i = 0; i < this.oscillators.length && i < primeList.length; i++) {
      if (primeSet.has(primeList[i])) {
        this.oscillators[i].excite(amount);
      }
    }
  }
  
  /**
   * Get current state as amplitudes weighted by phase
   */
  getWeightedAmplitudes() {
    return this.oscillators.map(o => o.amplitude * Math.sin(o.phase));
  }
  
  /**
   * Synchronization measure (0 = desync, 1 = full sync)
   */
  synchronization() {
    return this.orderParameter();
  }
  
  /**
   * Phase coherence between pairs
   */
  pairwiseCoherence() {
    const N = this.oscillators.length;
    let total = 0, count = 0;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        total += Math.cos(this.oscillators[i].phase - this.oscillators[j].phase);
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }
}

export {
    KuramotoModel
};