/**
 * Oracle Module - book.pdf Chapters 10 & 11
 * 
 * Implements Oracle Systems and NP Resonance Encoding from:
 * "Resonant Foundations of Reality" by Sebastian Schepis
 * 
 * Key formalisms:
 * - Oracle Q: (S, ε) → R_stable (entropy-modulated evolution to attractors)
 * - I-Ching attractor integration (64 hexagram basins)
 * - Clause-Resonance encoding: V̂_NP = Π_j Ĉ_j
 * - Collapse operator: Ω̂ = Σ_x ε_x|x⟩⟨x|
 */

import { PrimeState, Complex, PHI, encodeMemory } from './hilbert.js';
import { firstNPrimes } from './prime.js';

// ============================================================================
// I-CHING HEXAGRAM ATTRACTORS (Chapter 10)
// ============================================================================

/**
 * I-Ching Hexagram definitions
 * Each hexagram is a 6-bit binary pattern with semantic meaning
 */
const HEXAGRAMS = {
  1:  { name: 'Qián', meaning: 'Creative Force', binary: 0b111111, primes: [2, 3, 5, 7, 11, 13] },
  2:  { name: 'Kūn', meaning: 'Receptive Earth', binary: 0b000000, primes: [17, 19, 23, 29, 31, 37] },
  3:  { name: 'Zhūn', meaning: 'Difficulty at Beginning', binary: 0b100010, primes: [2, 5, 7] },
  4:  { name: 'Méng', meaning: 'Youthful Folly', binary: 0b010001, primes: [3, 11, 13] },
  5:  { name: 'Xū', meaning: 'Waiting', binary: 0b111010, primes: [2, 3, 5, 11] },
  6:  { name: 'Sòng', meaning: 'Conflict', binary: 0b010111, primes: [7, 13, 17, 19] },
  7:  { name: 'Shī', meaning: 'Army', binary: 0b010000, primes: [3] },
  8:  { name: 'Bǐ', meaning: 'Holding Together', binary: 0b000010, primes: [5] },
  9:  { name: 'Xiǎo Chù', meaning: 'Small Taming', binary: 0b111011, primes: [2, 3, 7, 11, 13] },
  10: { name: 'Lǚ', meaning: 'Treading', binary: 0b110111, primes: [2, 5, 7, 11, 13] },
  11: { name: 'Tài', meaning: 'Peace', binary: 0b111000, primes: [2, 3, 5] },
  12: { name: 'Pǐ', meaning: 'Standstill', binary: 0b000111, primes: [11, 13, 17] },
  // ... Additional hexagrams can be added
  63: { name: 'Jì Jì', meaning: 'After Completion', binary: 0b101010, primes: [2, 5, 11] },
  64: { name: 'Wèi Jì', meaning: 'Before Completion', binary: 0b010101, primes: [3, 7, 13] }
};

/**
 * Generate all 64 hexagrams with prime mappings
 */
function generateAllHexagrams() {
  const primes = firstNPrimes(64);
  const hexagrams = {};
  
  for (let i = 1; i <= 64; i++) {
    if (HEXAGRAMS[i]) {
      hexagrams[i] = HEXAGRAMS[i];
    } else {
      // Generate based on binary pattern
      const binary = i - 1; // 0-63
      const activeBits = [];
      for (let b = 0; b < 6; b++) {
        if ((binary >> b) & 1) {
          activeBits.push(b);
        }
      }
      hexagrams[i] = {
        name: `Hexagram ${i}`,
        meaning: `Pattern ${binary.toString(2).padStart(6, '0')}`,
        binary,
        primes: activeBits.map(b => primes[b * 10 % 64])
      };
    }
  }
  
  return hexagrams;
}

/**
 * HexagramAttractor - Creates a PrimeState attractor from a hexagram
 */
class HexagramAttractor {
  constructor(hexagramNumber) {
    const hexagrams = generateAllHexagrams();
    this.hexagram = hexagrams[hexagramNumber] || hexagrams[1];
    this.number = hexagramNumber;
    this.state = this._createState();
  }
  
  _createState() {
    const state = new PrimeState();
    const primes = this.hexagram.primes;
    const amp = 1 / Math.sqrt(primes.length);
    
    for (const p of primes) {
      if (state.amplitudes.has(p)) {
        // Phase from binary pattern
        const bitPosition = primes.indexOf(p) % 6;
        const phase = ((this.hexagram.binary >> bitPosition) & 1) ? 0 : Math.PI;
        state.set(p, Complex.fromPolar(amp, phase));
      }
    }
    
    return state.normalize();
  }
  
  /**
   * Distance from this attractor to a given state
   */
  distance(state) {
    const overlap = this.state.inner(state);
    return 1 - overlap.norm();
  }
  
  /**
   * Project state onto this attractor
   */
  project(state, strength = 0.1) {
    const result = new PrimeState(state.primes);
    
    for (const p of state.primes) {
      const current = state.get(p);
      const target = this.state.get(p);
      
      // Interpolate toward attractor
      const newRe = current.re + strength * (target.re - current.re);
      const newIm = current.im + strength * (target.im - current.im);
      
      result.set(p, new Complex(newRe, newIm));
    }
    
    return result.normalize();
  }
}

// ============================================================================
// ORACLE SYSTEM Q (Chapter 10)
// ============================================================================

/**
 * OracleSystem - Entropy-modulated evolution to stable attractors
 * 
 * From book.pdf Eq. 10.1:
 * Q: (S, ε) → R_stable
 * S_{t+1} = U(ε_t) · S_t
 * 
 * Where:
 * - S is the symbolic state
 * - ε is external entropy input
 * - R_stable is a stable resonance attractor
 */
class OracleSystem {
  constructor(options = {}) {
    this.numAttractors = options.numAttractors || 64;
    this.convergenceThreshold = options.convergenceThreshold || 0.01;
    this.maxIterations = options.maxIterations || 100;
    this.entropyWeight = options.entropyWeight || 0.1;
    
    // Initialize hexagram attractors
    this.attractors = [];
    for (let i = 1; i <= this.numAttractors; i++) {
      this.attractors.push(new HexagramAttractor(i));
    }
    
    this.history = [];
  }
  
  /**
   * Find the nearest attractor to a state
   */
  findNearestAttractor(state) {
    let minDist = Infinity;
    let nearest = this.attractors[0];
    let nearestIdx = 0;
    
    for (let i = 0; i < this.attractors.length; i++) {
      const dist = this.attractors[i].distance(state);
      if (dist < minDist) {
        minDist = dist;
        nearest = this.attractors[i];
        nearestIdx = i;
      }
    }
    
    return { attractor: nearest, distance: minDist, index: nearestIdx };
  }
  
  /**
   * Apply entropy modulation to state
   * U(ε) = e^(-iεĤ) where Ĥ is resonance Hamiltonian
   */
  applyEntropyModulation(state, epsilon) {
    const result = new PrimeState(state.primes);
    
    for (const p of state.primes) {
      const amp = state.get(p);
      // Phase rotation proportional to epsilon and log(p)
      const phase = epsilon * Math.log(p) * this.entropyWeight;
      const rotation = Complex.fromPolar(1, phase);
      result.set(p, amp.mul(rotation));
    }
    
    return result.normalize();
  }
  
  /**
   * Single oracle step: S_{t+1} = U(ε_t) · Π_attractor · S_t
   */
  step(state, epsilon = null) {
    // Generate entropy if not provided
    if (epsilon === null) {
      epsilon = (Math.random() - 0.5) * 2;
    }
    
    // Find nearest attractor
    const { attractor, distance } = this.findNearestAttractor(state);
    
    // Apply entropy modulation
    const modulated = this.applyEntropyModulation(state, epsilon);
    
    // Project toward attractor (strength inversely proportional to distance)
    const projectionStrength = 0.1 * (1 - distance);
    const projected = attractor.project(modulated, projectionStrength);
    
    return {
      state: projected,
      epsilon,
      attractor: attractor.hexagram.name,
      distance
    };
  }
  
  /**
   * Main oracle query: (S, ε) → R_stable
   * 
   * @param {PrimeState|string} input - Initial state or query string
   * @param {Array<number>} entropySequence - External entropy inputs
   * @returns {Object} Oracle result with stable attractor
   */
  query(input, entropySequence = null) {
    // Convert string to state if needed
    let state;
    if (typeof input === 'string') {
      state = encodeMemory(input);
    } else {
      state = input.clone();
    }
    
    // Generate entropy sequence if not provided
    if (!entropySequence) {
      entropySequence = [];
      for (let i = 0; i < this.maxIterations; i++) {
        entropySequence.push((Math.random() - 0.5) * 2);
      }
    }
    
    this.history = [];
    let prevEntropy = state.entropy();
    
    // Iterate until convergence
    for (let i = 0; i < this.maxIterations; i++) {
      const epsilon = entropySequence[i % entropySequence.length];
      const result = this.step(state, epsilon);
      
      this.history.push({
        iteration: i,
        epsilon: result.epsilon,
        attractor: result.attractor,
        distance: result.distance,
        entropy: state.entropy()
      });
      
      state = result.state;
      
      // Check convergence
      const currentEntropy = state.entropy();
      const deltaS = Math.abs(currentEntropy - prevEntropy);
      
      if (deltaS < this.convergenceThreshold && result.distance < 0.1) {
        const { attractor, index } = this.findNearestAttractor(state);
        return {
          converged: true,
          iterations: i + 1,
          finalState: state,
          attractor: {
            number: index + 1,
            name: attractor.hexagram.name,
            meaning: attractor.hexagram.meaning,
            primes: attractor.hexagram.primes
          },
          finalDistance: result.distance,
          finalEntropy: currentEntropy,
          history: this.history
        };
      }
      
      prevEntropy = currentEntropy;
    }
    
    // Did not converge - return nearest attractor
    const { attractor, distance, index } = this.findNearestAttractor(state);
    return {
      converged: false,
      iterations: this.maxIterations,
      finalState: state,
      attractor: {
        number: index + 1,
        name: attractor.hexagram.name,
        meaning: attractor.hexagram.meaning,
        primes: attractor.hexagram.primes
      },
      finalDistance: distance,
      finalEntropy: state.entropy(),
      history: this.history
    };
  }
  
  /**
   * Divination query with I-Ching interpretation
   */
  divine(question) {
    const result = this.query(question);
    
    // Add interpretation
    const interp = this._interpretHexagram(result.attractor.number);
    
    return {
      ...result,
      question,
      interpretation: interp
    };
  }
  
  _interpretHexagram(number) {
    const interpretations = {
      1: 'Creative energy is strong. Take initiative and lead with confidence.',
      2: 'Receptive energy prevails. Listen, nurture, and support others.',
      3: 'Difficulty at the beginning. Perseverance brings success.',
      4: 'Youthful inexperience. Seek guidance and learn from others.',
      5: 'Patience is required. Wait for the right moment to act.',
      6: 'Conflict arises. Seek resolution through understanding.',
      7: 'Leadership is needed. Organize and guide with discipline.',
      8: 'Unity and cooperation bring strength. Hold together.',
      9: 'Small steps lead to great achievements. Gentle influence.',
      10: 'Careful conduct is essential. Tread carefully.',
      11: 'Peace and harmony are achievable. Cooperation leads to success.',
      12: 'Stagnation threatens. Patience and inner work are needed.',
      63: 'A cycle is completing. Maintain what has been achieved.',
      64: 'A new cycle begins. Prepare carefully before acting.'
    };
    
    return interpretations[number] || 
      `Hexagram ${number}: The pattern suggests transformation and change. ` +
      `Meditate on the prime resonances for deeper insight.`;
  }
}

// ============================================================================
// NP RESONANCE ENCODER (Chapter 11)
// ============================================================================

/**
 * ClauseProjector - Projects onto states satisfying a clause
 * 
 * From book.pdf: Ĉ_j = Σ_{x satisfies clause j} |x⟩⟨x|
 */
class ClauseProjector {
  constructor(variables, literals) {
    this.variables = variables; // Array of variable names
    this.literals = literals;   // Array of {var, negated} objects
  }
  
  /**
   * Check if assignment satisfies clause
   */
  satisfies(assignment) {
    for (const lit of this.literals) {
      const value = assignment[lit.var];
      const satisfied = lit.negated ? !value : value;
      if (satisfied) return true; // OR clause - one true is enough
    }
    return false;
  }
  
  /**
   * Apply projector to state
   * Projects out states that don't satisfy the clause
   */
  project(state) {
    // In prime encoding: each assignment maps to a prime product
    // For simplicity, apply amplitude damping based on clause evaluation
    const result = new PrimeState(state.primes);
    
    for (const p of state.primes) {
      const amp = state.get(p);
      // Use prime mod pattern to encode assignment
      const assignment = this._primeToAssignment(p);
      const sat = this.satisfies(assignment);
      
      // Damping factor: 1 if satisfied, 0.1 if not
      const factor = sat ? 1.0 : 0.1;
      result.set(p, amp.scale(factor));
    }
    
    return result.normalize();
  }
  
  _primeToAssignment(p) {
    // Map prime to variable assignment using bit pattern
    const assignment = {};
    for (let i = 0; i < this.variables.length; i++) {
      assignment[this.variables[i]] = ((p >> i) & 1) === 1;
    }
    return assignment;
  }
}

/**
 * NPResonanceEncoder - Encode NP problems as symbolic resonance
 * 
 * From book.pdf Eq. 11.1:
 * V̂_NP = Π_j Ĉ_j (product of clause projectors)
 * 
 * For SAT: satisfying assignments are fixed points of V̂_NP
 */
class NPResonanceEncoder {
  constructor(variables) {
    this.variables = variables;
    this.clauses = [];
    this.clauseProjectors = [];
  }
  
  /**
   * Add a clause to the SAT problem
   * @param {Array} literals - Array of {var: string, negated: boolean}
   */
  addClause(literals) {
    this.clauses.push(literals);
    this.clauseProjectors.push(new ClauseProjector(this.variables, literals));
  }
  
  /**
   * Encode SAT problem from CNF string
   * Format: "(x1 OR NOT x2) AND (x2 OR x3)"
   */
  fromCNF(cnfString) {
    const clauseStrings = cnfString.split(' AND ').map(s => s.trim());
    
    for (const clauseStr of clauseStrings) {
      const inner = clauseStr.replace(/[()]/g, '').trim();
      const literalStrs = inner.split(' OR ').map(s => s.trim());
      
      const literals = literalStrs.map(lit => {
        const negated = lit.startsWith('NOT ');
        const varName = negated ? lit.substring(4).trim() : lit.trim();
        
        if (!this.variables.includes(varName)) {
          this.variables.push(varName);
        }
        
        return { var: varName, negated };
      });
      
      this.addClause(literals);
    }
    
    return this;
  }
  
  /**
   * Apply verifier operator V̂_NP = Π_j Ĉ_j
   */
  applyVerifier(state) {
    let current = state.clone();
    
    for (const projector of this.clauseProjectors) {
      current = projector.project(current);
    }
    
    return current;
  }
  
  /**
   * Create initial superposition over all assignments
   */
  createSuperposition() {
    const n = this.variables.length;
    const primes = firstNPrimes(Math.pow(2, n));
    const state = new PrimeState(primes);
    
    const amp = 1 / Math.sqrt(primes.length);
    for (const p of primes) {
      state.set(p, new Complex(amp, 0));
    }
    
    return state;
  }
  
  /**
   * Collapse operator Ω̂
   * From book.pdf: Ω̂ = Σ_x ε_x|x⟩⟨x|
   * 
   * Collapses to satisfying assignment with highest resonance
   */
  collapseOperator(state) {
    // Apply verifier first
    const verified = this.applyVerifier(state);
    
    // Find dominant assignment
    const dominant = verified.dominant(1)[0];
    
    if (dominant && dominant.amp > 0.01) {
      const assignment = {};
      for (let i = 0; i < this.variables.length; i++) {
        assignment[this.variables[i]] = ((dominant.p >> i) & 1) === 1;
      }
      
      return {
        collapsed: true,
        assignment,
        prime: dominant.p,
        amplitude: dominant.amp,
        satisfies: this._checkSatisfaction(assignment)
      };
    }
    
    return { collapsed: false, assignment: null };
  }
  
  _checkSatisfaction(assignment) {
    for (const clause of this.clauses) {
      let clauseSat = false;
      for (const lit of clause) {
        const val = assignment[lit.var];
        if (lit.negated ? !val : val) {
          clauseSat = true;
          break;
        }
      }
      if (!clauseSat) return false;
    }
    return true;
  }
  
  /**
   * Solve SAT via resonance collapse
   * 
   * @param {number} maxIterations - Max iterations for convergence
   * @returns {Object} Solution or UNSAT indication
   */
  solve(maxIterations = 100) {
    // Start with uniform superposition
    let state = this.createSuperposition();
    const oracle = new OracleSystem({ maxIterations: 10 });
    
    for (let i = 0; i < maxIterations; i++) {
      // Apply verifier
      state = this.applyVerifier(state);
      
      // Apply entropy modulation
      const epsilon = (Math.random() - 0.5) * 0.1;
      state = oracle.applyEntropyModulation(state, epsilon);
      
      // Try collapse
      const result = this.collapseOperator(state);
      
      if (result.collapsed && result.satisfies) {
        return {
          satisfiable: true,
          assignment: result.assignment,
          iterations: i + 1,
          confidence: result.amplitude
        };
      }
      
      // Check if state has collapsed to zero (UNSAT)
      if (state.norm() < 0.01) {
        return {
          satisfiable: false,
          reason: 'State collapsed to zero - no satisfying assignment',
          iterations: i + 1
        };
      }
    }
    
    // Did not converge - return best guess
    const result = this.collapseOperator(state);
    return {
      satisfiable: result.satisfies,
      assignment: result.assignment,
      iterations: maxIterations,
      confidence: result.amplitude || 0,
      note: 'Did not converge - result may be unreliable'
    };
  }
}

// ============================================================================
// SEMANTIC COMPRESSION (Chapter 10)
// ============================================================================

/**
 * SemanticCompressor - Compress information via attractor convergence
 * 
 * Maps high-dimensional semantic content to low-dimensional attractor codes
 */
class SemanticCompressor {
  constructor(options = {}) {
    this.oracle = new OracleSystem(options);
    this.dictionary = new Map(); // attractor -> encoded content
  }
  
  /**
   * Compress text to attractor code
   */
  compress(text) {
    const result = this.oracle.query(text);
    const code = result.attractor.number;
    
    // Store original for potential decompression
    if (!this.dictionary.has(code)) {
      this.dictionary.set(code, []);
    }
    this.dictionary.get(code).push(text);
    
    return {
      code,
      attractor: result.attractor.name,
      meaning: result.attractor.meaning,
      entropy: result.finalEntropy,
      iterations: result.iterations
    };
  }
  
  /**
   * Find similar items by attractor proximity
   */
  findSimilar(text) {
    const result = this.oracle.query(text);
    const code = result.attractor.number;
    
    const similar = this.dictionary.get(code) || [];
    
    // Also check adjacent attractors
    const adjacent = [
      this.dictionary.get(code - 1) || [],
      this.dictionary.get(code + 1) || []
    ].flat();
    
    return {
      exact: similar,
      related: adjacent,
      attractor: result.attractor
    };
  }
}

// Export all classes
export {
  HEXAGRAMS,
  generateAllHexagrams,
  HexagramAttractor,
  OracleSystem,
  ClauseProjector,
  NPResonanceEncoder,
  SemanticCompressor
};
