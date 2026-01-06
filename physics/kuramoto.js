/**
 * Kuramoto synchronization dynamics
 */
const { OscillatorBank } = require('./oscillator');

class KuramotoModel extends OscillatorBank {
  constructor(frequencies, couplingStrength = 0.3) {
    super(frequencies);
    this.K = couplingStrength;
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

module.exports = { KuramotoModel };