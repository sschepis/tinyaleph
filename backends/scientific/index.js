/**
 * Scientific Backend - Quantum simulation, particle physics, molecular dynamics
 */

import { Backend } from '../interface.js';
import { Hypercomplex } from '../../core/hypercomplex.js';
import { primeToFrequency, factorize, firstNPrimes, DEFAULT_PRIMES } from '../../core/prime.js';

class ScientificBackend extends Backend {
  constructor(config) {
    super(config);
    this.dimension = config.dimension || 16;
    this.config.primes = config.primes || DEFAULT_PRIMES;
    
    // Physical particle/force mappings
    this.physicalConstants = config.physicalConstants || {
      2: 'electromagnetic', 3: 'weak', 5: 'strong', 7: 'gravitational',
      11: 'electron', 13: 'positron', 17: 'photon', 19: 'neutrino',
      23: 'muon', 29: 'tau', 31: 'up_quark', 37: 'down_quark',
      41: 'charm_quark', 43: 'strange_quark', 47: 'top_quark', 53: 'bottom_quark',
      59: 'W_boson', 61: 'Z_boson', 67: 'Higgs', 71: 'gluon'
    };
    
    // Quantum gate transforms
    this.quantumGates = config.quantumGates || {
      X: { q: [2], r: [3], name: 'Pauli-X' },
      Y: { q: [3], r: [5], name: 'Pauli-Y' },
      Z: { q: [5], r: [7], name: 'Pauli-Z' },
      H: { q: [2, 3], r: [2, 3, 5], name: 'Hadamard' },
      CNOT: { q: [2, 11], r: [3, 13], name: 'CNOT' },
      T: { q: [7], r: [11], name: 'T-gate' },
      S: { q: [11], r: [13], name: 'S-gate' },
      SWAP: { q: [2, 3], r: [3, 2], name: 'SWAP' }
    };
    
    this.transforms = Object.values(this.quantumGates);
  }
  
  encode(input) {
    // Handle various input types
    if (Array.isArray(input)) {
      return input.flatMap(q => this.qubitToPrimes(q));
    }
    
    // Parse ket notation |n⟩
    const match = String(input).match(/\|(\d+)⟩/);
    if (match) {
      return this.integerToPrimes(parseInt(match[1]));
    }
    
    // Parse qubit string
    if (typeof input === 'string' && input.startsWith('|')) {
      return this.qubitToPrimes(input);
    }
    
    // Numeric input
    if (typeof input === 'number') {
      return this.integerToPrimes(input);
    }
    
    return [2];  // Default to |0⟩
  }
  
  qubitToPrimes(qubit) {
    const map = {
      '|0⟩': [2],
      '|1⟩': [3],
      '|+⟩': [2, 3],
      '|-⟩': [2, 5],
      '|i⟩': [3, 5],
      '|-i⟩': [3, 7],
      '|00⟩': [2, 2],
      '|01⟩': [2, 3],
      '|10⟩': [3, 2],
      '|11⟩': [3, 3],
      '|Φ+⟩': [2, 3, 5, 7],    // Bell state
      '|Φ-⟩': [2, 3, 5, 11],   // Bell state
      '|Ψ+⟩': [2, 5, 7, 11],   // Bell state
      '|Ψ-⟩': [3, 5, 7, 11]    // Bell state
    };
    return map[qubit] || [2];
  }
  
  integerToPrimes(n) {
    if (n <= 1) return [n + 2];
    const factors = factorize(n);
    return Object.entries(factors).flatMap(([p, exp]) => 
      Array(exp).fill(parseInt(p))
    );
  }
  
  decode(primes) {
    const has2 = primes.includes(2);
    const has3 = primes.includes(3);
    const has5 = primes.includes(5);
    const has7 = primes.includes(7);
    
    // Bell states
    if (primes.length >= 4 && has2 && has3 && has5) {
      if (has7) return '|Φ+⟩';
      if (primes.includes(11)) return '|Φ-⟩';
    }
    
    // Superposition states
    if (has2 && has3 && !has5) return '|+⟩';
    if (has2 && has5 && !has3) return '|-⟩';
    
    // Basis states
    if (has2 && !has3) return '|0⟩';
    if (!has2 && has3) return '|1⟩';
    
    // Default based on majority
    const count2 = primes.filter(p => p === 2).length;
    const count3 = primes.filter(p => p === 3).length;
    return count2 > count3 ? '|0⟩' : '|1⟩';
  }
  
  primesToState(primes) {
    const state = Hypercomplex.zero(this.dimension);
    
    // Count prime occurrences
    const primeCount = {};
    for (const p of primes) {
      primeCount[p] = (primeCount[p] || 0) + 1;
    }
    
    // Compute Bloch sphere angles
    let theta = 0, phi = 0;
    for (const [p, count] of Object.entries(primeCount)) {
      theta += (parseInt(p) * count) % 180 * Math.PI / 180;
      phi += (parseInt(p) * count * 2) % 360 * Math.PI / 180;
    }
    
    // Set qubit components
    state.c[0] = Math.cos(theta / 2);
    state.c[1] = Math.sin(theta / 2) * Math.cos(phi);
    state.c[2] = Math.sin(theta / 2) * Math.sin(phi);
    
    // Higher dimensions for multi-qubit systems
    for (let i = 3; i < this.dimension; i++) {
      const p = primes[i % primes.length] || 2;
      state.c[i] = Math.cos(2 * Math.PI * i / p) / Math.sqrt(this.dimension);
    }
    
    return state.normalize();
  }
  
  primesToFrequencies(primes) {
    // Hydrogen-like energy level spacing
    return primes.map((p, n) => primeToFrequency(p) * ((n + 1) ** 2));
  }
  
  applyTransform(inputPrimes, transform) {
    const inputSet = new Set(inputPrimes);
    
    // Check if all query primes are present
    if (!transform.q || !transform.q.every(p => inputSet.has(p))) {
      return inputPrimes;
    }
    
    // Remove query primes and add result primes
    const output = inputPrimes.filter(p => !transform.q.includes(p));
    return [...output, ...(transform.r || [])];
  }
  
  /**
   * Apply a quantum gate by name
   */
  applyGate(inputPrimes, gateName) {
    const gate = this.quantumGates[gateName];
    if (!gate) throw new Error(`Unknown gate: ${gateName}`);
    return this.applyTransform(inputPrimes, gate);
  }
  
  /**
   * Measure quantum state (probabilistic collapse)
   */
  measure(state) {
    const p0 = state.c[0] ** 2 + (state.c[1] || 0) ** 2;
    const outcome = Math.random() < p0 ? 0 : 1;
    return {
      outcome,
      state: outcome === 0 ? '|0⟩' : '|1⟩',
      probability: outcome === 0 ? p0 : 1 - p0
    };
  }
  
  /**
   * Simulate particle interaction
   */
  interact(particle1Primes, particle2Primes, interactionType = 'electromagnetic') {
    // Find the interaction force prime
    const interactionPrime = Object.entries(this.physicalConstants)
      .find(([p, name]) => name === interactionType)?.[0] || 2;
    
    // Combine particles with interaction
    const combined = [...particle1Primes, ...particle2Primes, parseInt(interactionPrime)];
    
    return {
      inputParticles: [particle1Primes, particle2Primes],
      interaction: interactionType,
      outputState: this.primesToState(combined),
      // Product of primes represents conserved quantity
      conserved: combined.reduce((a, b) => a * b, 1)
    };
  }
  
  /**
   * Get particle name from primes
   */
  identifyParticle(primes) {
    for (const p of primes) {
      if (this.physicalConstants[p]) {
        return this.physicalConstants[p];
      }
    }
    return 'unknown';
  }
  
  /**
   * Create entangled pair (Bell state)
   */
  createEntangledPair(type = 'Φ+') {
    const bellStates = {
      'Φ+': [2, 3, 5, 7],
      'Φ-': [2, 3, 5, 11],
      'Ψ+': [2, 5, 7, 11],
      'Ψ-': [3, 5, 7, 11]
    };
    return bellStates[type] || bellStates['Φ+'];
  }
  
  /**
   * Tensor product of two qubit states
   */
  tensorProduct(state1Primes, state2Primes) {
    // Interleave and combine primes
    const result = [];
    const maxLen = Math.max(state1Primes.length, state2Primes.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < state1Primes.length) result.push(state1Primes[i]);
      if (i < state2Primes.length) result.push(state2Primes[i]);
    }
    return result;
  }
  
  /**
   * Apply rotation gate with angle
   */
  rotate(inputPrimes, axis, angle) {
    const state = this.primesToState(inputPrimes);
    const result = Hypercomplex.zero(this.dimension);
    
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    
    if (axis === 'x') {
      result.c[0] = cos * state.c[0] - sin * state.c[1];
      result.c[1] = -sin * state.c[0] + cos * state.c[1];
    } else if (axis === 'y') {
      result.c[0] = cos * state.c[0] - sin * state.c[2];
      result.c[2] = sin * state.c[0] + cos * state.c[2];
    } else if (axis === 'z') {
      result.c[0] = cos * state.c[0];
      result.c[1] = cos * state.c[1] - sin * state.c[2];
      result.c[2] = sin * state.c[1] + cos * state.c[2];
    }
    
    return result.normalize();
  }
}

export {
    ScientificBackend
};

export default {
    ScientificBackend
};