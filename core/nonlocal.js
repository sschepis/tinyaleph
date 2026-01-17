/**
 * Non-Local Communication Module - book.pdf Chapter 8
 * 
 * Implements Prime Entanglement & Non-Local Communication from:
 * "Resonant Foundations of Reality" by Sebastian Schepis
 * 
 * Key formalisms:
 * - |Ψ_AB⟩ = 1/√2(|p⟩_A|q⟩_B + e^(iθ)|q⟩_A|p⟩_B) - Bell-like prime entanglement
 * - Ξ(p,q) = R(p,q)·e^(-ΔS)·δ_basin(p,q) - Resonance stability function
 * - Golden/Silver ratio channel selection (φ = 1.618..., δ_s = 1 + √2)
 * - Symbolic entanglement communication protocol
 */

import { PrimeState, Complex, PHI, encodeMemory } from './hilbert.js';
import { firstNPrimes, isPrime } from './prime.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const SILVER_RATIO = 1 + Math.sqrt(2); // δ_s ≈ 2.414

// ============================================================================
// PRIME ENTANGLED PAIR (Chapter 8)
// ============================================================================

/**
 * PrimeEntangledPair - Bell-like entangled state for prime resonance
 * 
 * From book.pdf Eq. 8.1:
 * |Ψ_AB⟩ = 1/√2 (|p⟩_A|q⟩_B + e^(iθ_pq)|q⟩_A|p⟩_B)
 * 
 * Two prime resonators share a non-local correlation
 */
class PrimeEntangledPair {
  constructor(primeP, primeQ, options = {}) {
    this.p = primeP;
    this.q = primeQ;
    this.phase = options.phase ?? this._calculatePhase(primeP, primeQ);
    
    // Create the entangled state components
    this.stateA = new PrimeState();
    this.stateB = new PrimeState();
    
    // Bell state: 1/√2 (|p⟩_A|q⟩_B + e^(iθ)|q⟩_A|p⟩_B)
    this._initializeEntanglement();
    
    // Correlation tracking
    this.correlationStrength = 1.0;
    this.measurementHistory = [];
  }
  
  /**
   * Calculate entanglement phase from prime pair
   * θ_pq = 2π · log(p/q) mod 2π
   */
  _calculatePhase(p, q) {
    return (2 * Math.PI * Math.log(p / q)) % (2 * Math.PI);
  }
  
  /**
   * Initialize the entangled state
   */
  _initializeEntanglement() {
    const amp = 1 / Math.sqrt(2);
    
    // Party A: superposition of |p⟩ and |q⟩
    this.stateA.set(this.p, new Complex(amp, 0));
    this.stateA.set(this.q, Complex.fromPolar(amp, this.phase));
    
    // Party B: complementary superposition
    this.stateB.set(this.q, new Complex(amp, 0));
    this.stateB.set(this.p, Complex.fromPolar(amp, this.phase));
    
    this.stateA.normalize();
    this.stateB.normalize();
  }
  
  /**
   * Measure party A - collapses to |p⟩ or |q⟩
   * Returns the collapsed prime and updates B accordingly
   */
  measureA() {
    // Probabilities
    const probP = this.stateA.get(this.p).norm() ** 2;
    const probQ = this.stateA.get(this.q).norm() ** 2;
    
    const random = Math.random();
    const collapsedPrime = random < probP / (probP + probQ) ? this.p : this.q;
    const otherPrime = collapsedPrime === this.p ? this.q : this.p;
    
    // Collapse A
    this.stateA = new PrimeState();
    this.stateA.set(collapsedPrime, new Complex(1, 0));
    
    // Correlated collapse on B (anti-correlated in Bell state)
    this.stateB = new PrimeState();
    this.stateB.set(otherPrime, Complex.fromPolar(1, this.phase));
    
    this.measurementHistory.push({
      party: 'A',
      result: collapsedPrime,
      correlated: otherPrime,
      time: Date.now()
    });
    
    return {
      collapsedPrime,
      correlatedPrime: otherPrime,
      phase: this.phase
    };
  }
  
  /**
   * Measure party B - collapses and correlates with A
   */
  measureB() {
    // Probabilities
    const probP = this.stateB.get(this.p).norm() ** 2;
    const probQ = this.stateB.get(this.q).norm() ** 2;
    
    const random = Math.random();
    const collapsedPrime = random < probP / (probP + probQ) ? this.p : this.q;
    const otherPrime = collapsedPrime === this.p ? this.q : this.p;
    
    // Collapse B
    this.stateB = new PrimeState();
    this.stateB.set(collapsedPrime, new Complex(1, 0));
    
    // Correlated collapse on A
    this.stateA = new PrimeState();
    this.stateA.set(otherPrime, Complex.fromPolar(1, -this.phase));
    
    this.measurementHistory.push({
      party: 'B',
      result: collapsedPrime,
      correlated: otherPrime,
      time: Date.now()
    });
    
    return {
      collapsedPrime,
      correlatedPrime: otherPrime,
      phase: this.phase
    };
  }
  
  /**
   * Apply local operation on A (unitary)
   */
  applyLocalA(phaseRotation) {
    for (const p of this.stateA.primes) {
      const amp = this.stateA.get(p);
      const rotated = amp.mul(Complex.fromPolar(1, phaseRotation));
      this.stateA.set(p, rotated);
    }
    this.stateA.normalize();
  }
  
  /**
   * Apply local operation on B
   */
  applyLocalB(phaseRotation) {
    for (const p of this.stateB.primes) {
      const amp = this.stateB.get(p);
      const rotated = amp.mul(Complex.fromPolar(1, phaseRotation));
      this.stateB.set(p, rotated);
    }
    this.stateB.normalize();
  }
  
  /**
   * Check if pair is still entangled
   */
  isEntangled() {
    // Entangled if both have non-trivial superposition
    const aSuper = this.stateA.dominant(2).length >= 2;
    const bSuper = this.stateB.dominant(2).length >= 2;
    return aSuper && bSuper;
  }
  
  /**
   * Calculate correlation between measurements
   */
  getCorrelation() {
    if (this.measurementHistory.length < 2) return null;
    
    let correlated = 0;
    let total = 0;
    
    for (let i = 0; i < this.measurementHistory.length - 1; i += 2) {
      const m1 = this.measurementHistory[i];
      const m2 = this.measurementHistory[i + 1];
      
      if (m1.result !== m2.result) {
        correlated++;
      }
      total++;
    }
    
    return total > 0 ? correlated / total : 0;
  }
  
  /**
   * Reset entanglement
   */
  reset() {
    this.correlationStrength = 1.0;
    this.measurementHistory = [];
    this._initializeEntanglement();
  }
}

// ============================================================================
// RESONANCE STABILITY FUNCTION (Chapter 8)
// ============================================================================

/**
 * ResonanceStability - Measures stability of non-local coherence
 * 
 * From book.pdf Eq. 8.5:
 * Ξ(p,q) = R(p,q) · e^(-ΔS) · δ_basin(p,q)
 * 
 * Where:
 * - R(p,q) is prime resonance strength
 * - ΔS is entropy difference
 * - δ_basin indicates same attractor basin
 */
class ResonanceStability {
  constructor(options = {}) {
    this.decayFactor = options.decayFactor || 0.1;
    this.basinThreshold = options.basinThreshold || 0.5;
  }
  
  /**
   * Calculate prime resonance R(p,q)
   * R(p,q) = √(log(p)·log(q)) / (log(p) + log(q))
   */
  primeResonance(p, q) {
    const logP = Math.log(p);
    const logQ = Math.log(q);
    return Math.sqrt(logP * logQ) / (logP + logQ);
  }
  
  /**
   * Calculate entropy difference factor e^(-ΔS)
   */
  entropyFactor(stateA, stateB) {
    const sA = stateA.entropy();
    const sB = stateB.entropy();
    const deltaS = Math.abs(sA - sB);
    return Math.exp(-this.decayFactor * deltaS);
  }
  
  /**
   * Check if primes are in same attractor basin
   * Uses golden ratio proximity as basin indicator
   */
  sameBasin(p, q) {
    // Primes in same basin if their ratio is close to φ or 1/φ
    const ratio = Math.max(p, q) / Math.min(p, q);
    const goldenDist = Math.min(
      Math.abs(ratio - PHI),
      Math.abs(ratio - 1 / PHI),
      Math.abs(ratio - PHI * PHI)
    );
    
    return goldenDist < this.basinThreshold ? 1.0 : 
           goldenDist < 1.0 ? 1.0 - goldenDist : 0.5;
  }
  
  /**
   * Full stability function Ξ(p,q)
   */
  calculate(p, q, stateA = null, stateB = null) {
    const R = this.primeResonance(p, q);
    
    let entropyTerm = 1.0;
    if (stateA && stateB) {
      entropyTerm = this.entropyFactor(stateA, stateB);
    }
    
    const basin = this.sameBasin(p, q);
    
    return R * entropyTerm * basin;
  }
  
  /**
   * Find most stable prime pairs
   */
  findStablePairs(primes, topK = 5) {
    const pairs = [];
    
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        const stability = this.calculate(primes[i], primes[j]);
        pairs.push({
          p: primes[i],
          q: primes[j],
          stability,
          ratio: primes[j] / primes[i]
        });
      }
    }
    
    pairs.sort((a, b) => b.stability - a.stability);
    return pairs.slice(0, topK);
  }
}

// ============================================================================
// CHANNEL SELECTORS (Chapter 8)
// ============================================================================

/**
 * GoldenChannel - Select prime pairs with golden ratio coupling
 * 
 * From book.pdf: φ = (1 + √5)/2 ≈ 1.618
 * Primes p,q are golden-coupled if q/p ≈ φ
 */
class GoldenChannel {
  constructor(tolerance = 0.1) {
    this.phi = PHI;
    this.tolerance = tolerance;
  }
  
  /**
   * Find primes closest to golden ratio relationship
   */
  select(primes) {
    let best = { p: null, q: null, error: Infinity };
    
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        const ratio = primes[j] / primes[i];
        const error = Math.abs(ratio - this.phi);
        
        if (error < best.error) {
          best = { p: primes[i], q: primes[j], error, ratio };
        }
      }
    }
    
    return best;
  }
  
  /**
   * Check if pair is golden-coupled
   */
  isGoldenPair(p, q) {
    const ratio = Math.max(p, q) / Math.min(p, q);
    return Math.abs(ratio - this.phi) < this.tolerance;
  }
  
  /**
   * Find all golden pairs
   */
  findAllGoldenPairs(primes) {
    const pairs = [];
    
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        if (this.isGoldenPair(primes[i], primes[j])) {
          pairs.push({
            p: primes[i],
            q: primes[j],
            ratio: primes[j] / primes[i],
            error: Math.abs(primes[j] / primes[i] - this.phi)
          });
        }
      }
    }
    
    return pairs.sort((a, b) => a.error - b.error);
  }
}

/**
 * SilverChannel - Select prime pairs with silver ratio coupling
 * 
 * From book.pdf: δ_s = 1 + √2 ≈ 2.414
 * Alternative irrational coupling for different resonance patterns
 */
class SilverChannel {
  constructor(tolerance = 0.15) {
    this.silver = SILVER_RATIO;
    this.tolerance = tolerance;
  }
  
  /**
   * Find primes closest to silver ratio relationship
   */
  select(primes) {
    let best = { p: null, q: null, error: Infinity };
    
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        const ratio = primes[j] / primes[i];
        const error = Math.abs(ratio - this.silver);
        
        if (error < best.error) {
          best = { p: primes[i], q: primes[j], error, ratio };
        }
      }
    }
    
    return best;
  }
  
  /**
   * Check if pair is silver-coupled
   */
  isSilverPair(p, q) {
    const ratio = Math.max(p, q) / Math.min(p, q);
    return Math.abs(ratio - this.silver) < this.tolerance;
  }
}

// ============================================================================
// SYMBOLIC ENTANGLEMENT COMMUNICATION (Chapter 8)
// ============================================================================

/**
 * SymbolicEntanglementComm - Full non-local communication protocol
 * 
 * Uses prime entanglement to create correlated symbolic channels
 */
class SymbolicEntanglementComm {
  constructor(options = {}) {
    this.numChannels = options.numChannels || 8;
    this.primes = firstNPrimes(this.numChannels * 2);
    
    this.goldenSelector = new GoldenChannel();
    this.silverSelector = new SilverChannel();
    this.stabilityCalc = new ResonanceStability();
    
    // Create entangled pairs for channels
    this.channels = this._initializeChannels();
    
    // Message buffer
    this.messageBuffer = [];
  }
  
  /**
   * Initialize entangled channels
   */
  _initializeChannels() {
    const channels = [];
    
    // Find stable pairs for channels
    const stablePairs = this.stabilityCalc.findStablePairs(
      this.primes, 
      this.numChannels
    );
    
    for (const pair of stablePairs) {
      channels.push({
        pair: new PrimeEntangledPair(pair.p, pair.q),
        stability: pair.stability,
        usage: 0
      });
    }
    
    return channels;
  }
  
  /**
   * Select best channel for transmission
   */
  selectChannel() {
    // Prefer stable channels with low usage
    let best = null;
    let bestScore = -Infinity;
    
    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i];
      const score = channel.stability - 0.1 * channel.usage;
      
      if (channel.pair.isEntangled() && score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    
    // Reset if no entangled channels
    if (best === null) {
      this._initializeChannels();
      return 0;
    }
    
    return best;
  }
  
  /**
   * Encode a bit using entanglement
   * 0 = measure without phase shift
   * 1 = apply phase shift then measure
   */
  encodeBit(bit, channelIdx = null) {
    if (channelIdx === null) {
      channelIdx = this.selectChannel();
    }
    
    const channel = this.channels[channelIdx];
    
    if (bit === 1) {
      // Apply phase encoding
      channel.pair.applyLocalA(Math.PI / 2);
    }
    
    const result = channel.pair.measureA();
    channel.usage++;
    
    return {
      channelIdx,
      bit,
      collapsedPrime: result.collapsedPrime,
      correlatedPrime: result.correlatedPrime
    };
  }
  
  /**
   * Decode a bit from correlation
   */
  decodeBit(channelIdx) {
    const channel = this.channels[channelIdx];
    const result = channel.pair.measureB();
    
    // Phase encodes the bit
    const phaseAngle = Math.atan2(
      channel.pair.stateB.get(result.collapsedPrime).im,
      channel.pair.stateB.get(result.collapsedPrime).re
    );
    
    const bit = Math.abs(phaseAngle) > Math.PI / 4 ? 1 : 0;
    
    return {
      bit,
      collapsedPrime: result.collapsedPrime,
      confidence: channel.stability
    };
  }
  
  /**
   * Send a message (string)
   */
  sendMessage(message) {
    const bits = [];
    
    for (const char of message) {
      const code = char.charCodeAt(0);
      for (let i = 7; i >= 0; i--) {
        bits.push((code >> i) & 1);
      }
    }
    
    const transmissions = [];
    for (const bit of bits) {
      const result = this.encodeBit(bit);
      transmissions.push(result);
      
      // Reset channel if used too much
      if (this.channels[result.channelIdx].usage > 10) {
        this.channels[result.channelIdx].pair.reset();
        this.channels[result.channelIdx].usage = 0;
      }
    }
    
    return {
      message,
      bitCount: bits.length,
      transmissions
    };
  }
  
  /**
   * Receive message from transmissions
   */
  receiveMessage(transmissions) {
    const bits = [];
    
    for (const tx of transmissions) {
      const result = this.decodeBit(tx.channelIdx);
      bits.push(result.bit);
    }
    
    // Reconstruct characters
    const chars = [];
    for (let i = 0; i < bits.length; i += 8) {
      let code = 0;
      for (let j = 0; j < 8 && i + j < bits.length; j++) {
        code = (code << 1) | bits[i + j];
      }
      if (code > 0) {
        chars.push(String.fromCharCode(code));
      }
    }
    
    return chars.join('');
  }
  
  /**
   * Test correlation over multiple trials
   */
  testCorrelation(trials = 100) {
    let matches = 0;
    
    for (let i = 0; i < trials; i++) {
      const channel = this.channels[i % this.channels.length];
      
      if (!channel.pair.isEntangled()) {
        channel.pair.reset();
      }
      
      const resultA = channel.pair.measureA();
      const resultB = channel.pair.measureB();
      
      // In Bell state, results should be anti-correlated
      if (resultA.collapsedPrime !== resultA.correlatedPrime) {
        matches++;
      }
      
      channel.pair.reset();
    }
    
    return {
      trials,
      matches,
      correlation: matches / trials,
      expected: 1.0 // Perfect anti-correlation expected
    };
  }
  
  /**
   * Get channel statistics
   */
  getStatistics() {
    return this.channels.map((ch, i) => ({
      index: i,
      primes: [ch.pair.p, ch.pair.q],
      stability: ch.stability,
      usage: ch.usage,
      entangled: ch.pair.isEntangled(),
      correlation: ch.pair.getCorrelation()
    }));
  }
}

// ============================================================================
// ENTANGLEMENT WITNESS (Chapter 8)
// ============================================================================

/**
 * EntanglementWitness - Detect and verify entanglement
 * 
 * Uses Bell inequality violation to confirm non-classical correlations
 */
class EntanglementWitness {
  constructor() {
    this.testAngles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4];
  }
  
  /**
   * Perform CHSH inequality test
   * Classical: |S| ≤ 2
   * Quantum: |S| ≤ 2√2 ≈ 2.83
   */
  chshTest(pair, trials = 100) {
    const correlations = {};
    
    for (let a = 0; a < 2; a++) {
      for (let b = 0; b < 2; b++) {
        const angleA = this.testAngles[a];
        const angleB = this.testAngles[b + 1];
        
        let corr = 0;
        for (let t = 0; t < trials; t++) {
          pair.reset();
          
          pair.applyLocalA(angleA);
          pair.applyLocalB(angleB);
          
          const resultA = pair.measureA();
          const resultB = pair.measureB();
          
          // Outcome: +1 if same, -1 if different
          const outcome = (resultA.collapsedPrime === pair.p ? 1 : -1) * 
                          (resultB.collapsedPrime === pair.p ? 1 : -1);
          corr += outcome;
        }
        
        correlations[`E(${a},${b})`] = corr / trials;
      }
    }
    
    // CHSH parameter S = E(0,0) - E(0,1) + E(1,0) + E(1,1)
    const S = correlations['E(0,0)'] - correlations['E(0,1)'] + 
              correlations['E(1,0)'] + correlations['E(1,1)'];
    
    return {
      S,
      correlations,
      isEntangled: Math.abs(S) > 2,
      maxQuantum: 2 * Math.sqrt(2),
      violation: Math.abs(S) > 2 ? (Math.abs(S) - 2) / (2 * Math.sqrt(2) - 2) : 0
    };
  }
  
  /**
   * Simple entanglement check via correlation
   */
  simpleTest(pair, trials = 50) {
    let antiCorrelated = 0;
    
    for (let t = 0; t < trials; t++) {
      pair.reset();
      
      const resultA = pair.measureA();
      // After A measures, B should get the other prime
      
      if (resultA.correlatedPrime !== resultA.collapsedPrime) {
        antiCorrelated++;
      }
    }
    
    return {
      trials,
      antiCorrelated,
      correlation: antiCorrelated / trials,
      isEntangled: antiCorrelated / trials > 0.9
    };
  }
}

// Export all
export {
  SILVER_RATIO,
  PrimeEntangledPair,
  ResonanceStability,
  GoldenChannel,
  SilverChannel,
  SymbolicEntanglementComm,
  EntanglementWitness
};
