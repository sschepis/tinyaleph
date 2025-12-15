/**
 * ResoFormer Primitives
 * 
 * Resonant Field Transformer: a prime-indexed, phase-interference model with
 * quaternionic (order-sensitive) composition, coherence-gated compute,
 * entropy-stabilized "collapse," and a prime-resonant external memory.
 * 
 * H_Q = H_P ⊗ ℍ (Prime Hilbert space tensor Quaternions)
 * 
 * Based on the ResoFormer specification combining:
 * - PRSC (Prime Resonance Symbolic Computing)
 * - Quantum Semantics
 * - Quaternionic Memory Field (QMF)
 * - Prime Resonant Graph Database
 */

const { firstNPrimes, isPrime, factorize } = require('./prime');
const { Complex, PrimeState } = require('./hilbert');

// ============================================================================
// QUATERNION ALGEBRA
// ============================================================================

/**
 * Full Quaternion class for H_Q representation
 * q = w + xi + yj + zk (Hamilton quaternion)
 */
class Quaternion {
  constructor(w = 1, x = 0, y = 0, z = 0) {
    this.w = w;  // scalar part
    this.x = x;  // i component
    this.y = y;  // j component
    this.z = z;  // k component
  }
  
  static zero() { return new Quaternion(0, 0, 0, 0); }
  static one() { return new Quaternion(1, 0, 0, 0); }
  static i() { return new Quaternion(0, 1, 0, 0); }
  static j() { return new Quaternion(0, 0, 1, 0); }
  static k() { return new Quaternion(0, 0, 0, 1); }
  
  /**
   * Random unit quaternion (uniform on 3-sphere)
   */
  static random() {
    const u1 = Math.random();
    const u2 = Math.random();
    const u3 = Math.random();
    
    const w = Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2);
    const x = Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2);
    const y = Math.sqrt(u1) * Math.sin(2 * Math.PI * u3);
    const z = Math.sqrt(u1) * Math.cos(2 * Math.PI * u3);
    
    return new Quaternion(w, x, y, z);
  }
  
  /**
   * Create from axis-angle rotation
   */
  static fromAxisAngle(axis, angle) {
    const s = Math.sin(angle / 2);
    const c = Math.cos(angle / 2);
    const norm = Math.sqrt(axis[0]**2 + axis[1]**2 + axis[2]**2);
    
    return new Quaternion(
      c,
      s * axis[0] / norm,
      s * axis[1] / norm,
      s * axis[2] / norm
    );
  }
  
  /**
   * Hamilton product: q1 × q2
   * NON-COMMUTATIVE: q1 × q2 ≠ q2 × q1
   */
  mul(other) {
    return new Quaternion(
      this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z,
      this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
      this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
      this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w
    );
  }
  
  /**
   * Quaternion addition
   */
  add(other) {
    return new Quaternion(
      this.w + other.w,
      this.x + other.x,
      this.y + other.y,
      this.z + other.z
    );
  }
  
  /**
   * Scalar multiplication
   */
  scale(k) {
    return new Quaternion(this.w * k, this.x * k, this.y * k, this.z * k);
  }
  
  /**
   * Conjugate: q* = w - xi - yj - zk
   */
  conjugate() {
    return new Quaternion(this.w, -this.x, -this.y, -this.z);
  }
  
  /**
   * Norm: |q|² = w² + x² + y² + z²
   */
  norm2() {
    return this.w**2 + this.x**2 + this.y**2 + this.z**2;
  }
  
  norm() {
    return Math.sqrt(this.norm2());
  }
  
  /**
   * Normalize to unit quaternion
   */
  normalize() {
    const n = this.norm();
    return n > 1e-10 ? this.scale(1/n) : Quaternion.one();
  }
  
  /**
   * Inverse: q^(-1) = conj(q)/|q|^2
   */
  inverse() {
    const n2 = this.norm2();
    return n2 > 1e-10 ? this.conjugate().scale(1/n2) : Quaternion.zero();
  }
  
  /**
   * Dot product (as 4-vectors)
   */
  dot(other) {
    return this.w * other.w + this.x * other.x + this.y * other.y + this.z * other.z;
  }
  
  /**
   * Commutator: [q1, q2] = q1×q2 - q2×q1
   * Non-zero commutator indicates order matters!
   */
  commutator(other) {
    const ab = this.mul(other);
    const ba = other.mul(this);
    return new Quaternion(
      ab.w - ba.w,
      ab.x - ba.x,
      ab.y - ba.y,
      ab.z - ba.z
    );
  }
  
  /**
   * Commutator norm - measure of non-commutativity
   */
  commutatorNorm(other) {
    return this.commutator(other).norm();
  }
  
  toArray() { return [this.w, this.x, this.y, this.z]; }
  
  toString() {
    return `${this.w.toFixed(4)} + ${this.x.toFixed(4)}i + ${this.y.toFixed(4)}j + ${this.z.toFixed(4)}k`;
  }
}

// ============================================================================
// SPARSE PRIME STATE (H_Q = H_P ⊗ ℍ)
// ============================================================================

/**
 * Sparse Prime-Quaternion State
 * Each token is represented as sparse activations over primes,
 * with each active prime having a complex amplitude AND quaternion orientation.
 * 
 * |Ψ_t⟩ = Σ_{p ∈ P_t} α_{t,p} · q_{t,p} · |p⟩
 * - α_{t,p} ∈ ℂ (complex amplitude with phase)
 * - q_{t,p} ∈ ℍ (quaternion orientation)
 */
class SparsePrimeState {
  constructor(numPrimes = 4096, activeK = 32) {
    this.allPrimes = firstNPrimes(numPrimes);
    this.k = activeK;
    
    // Sparse activation: Map<prime, {amplitude: Complex, quaternion: Quaternion}>
    this.activations = new Map();
  }
  
  /**
   * Get active primes
   */
  getActivePrimes() {
    return Array.from(this.activations.keys());
  }
  
  /**
   * Set activation for a prime
   */
  set(p, amplitude, quaternion) {
    if (!isPrime(p)) return this;
    this.activations.set(p, { 
      amplitude: amplitude instanceof Complex ? amplitude : new Complex(amplitude, 0),
      quaternion: quaternion instanceof Quaternion ? quaternion : Quaternion.one()
    });
    return this;
  }
  
  /**
   * Get activation for a prime
   */
  get(p) {
    return this.activations.get(p) || { amplitude: Complex.zero(), quaternion: Quaternion.zero() };
  }
  
  /**
   * Create from prime-entropy hash (deterministic)
   */
  static fromHash(text, numPrimes = 4096, k = 32) {
    const state = new SparsePrimeState(numPrimes, k);
    const primes = state.allPrimes;
    
    // Hash text to select k primes
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    
    const selectedPrimes = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.abs((hash * (i + 1) * 31337) % primes.length);
      selectedPrimes.push(primes[idx]);
    }
    
    // Assign amplitudes and quaternions based on text
    for (let i = 0; i < selectedPrimes.length; i++) {
      const p = selectedPrimes[i];
      const phase = 2 * Math.PI * i / k;
      const amplitude = Complex.fromPolar(1/Math.sqrt(k), phase);
      
      // Create quaternion from character codes
      const charSum = text.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      const q = Quaternion.fromAxisAngle(
        [Math.sin(charSum + i), Math.cos(charSum * i), Math.sin(i)],
        (charSum * i) % (2 * Math.PI)
      );
      
      state.set(p, amplitude, q.normalize());
    }
    
    return state;
  }
  
  /**
   * Create from explicit prime list
   */
  static fromPrimes(primes, amplitudes = null, quaternions = null) {
    const state = new SparsePrimeState(4096, primes.length);
    
    for (let i = 0; i < primes.length; i++) {
      const p = primes[i];
      const amp = amplitudes ? amplitudes[i] : new Complex(1/Math.sqrt(primes.length), 0);
      const q = quaternions ? quaternions[i] : Quaternion.random();
      state.set(p, amp, q);
    }
    
    return state;
  }
  
  /**
   * Normalize amplitudes to unit norm
   */
  normalize() {
    let sumSq = 0;
    for (const [p, act] of this.activations) {
      sumSq += act.amplitude.norm2();
    }
    
    const norm = Math.sqrt(sumSq);
    if (norm < 1e-10) return this;
    
    for (const [p, act] of this.activations) {
      act.amplitude = act.amplitude.scale(1/norm);
    }
    
    return this;
  }
  
  /**
   * Compute entropy over prime amplitudes
   */
  entropy() {
    let sumSq = 0;
    for (const [p, act] of this.activations) {
      sumSq += act.amplitude.norm2();
    }
    
    if (sumSq < 1e-10) return 0;
    
    let h = 0;
    for (const [p, act] of this.activations) {
      const prob = act.amplitude.norm2() / sumSq;
      if (prob > 1e-10) {
        h -= prob * Math.log2(prob);
      }
    }
    
    return h;
  }
}

// ============================================================================
// RESONANT ATTENTION SCORE
// ============================================================================

/**
 * Resonance score between two sparse prime states
 * Res(i,j) = α·Jaccard(P_i, P_j) + β·QuaternionAlign + γ·PhaseCoherence
 */
function resonanceScore(stateI, stateJ, alpha = 0.33, beta = 0.33, gamma = 0.34) {
  const primesI = new Set(stateI.getActivePrimes());
  const primesJ = new Set(stateJ.getActivePrimes());
  
  // 1. Jaccard similarity of prime sets
  const intersection = new Set([...primesI].filter(p => primesJ.has(p)));
  const union = new Set([...primesI, ...primesJ]);
  const jaccard = intersection.size / (union.size || 1);
  
  if (intersection.size === 0) {
    return alpha * jaccard;  // No overlap, just return Jaccard
  }
  
  // 2. Quaternion alignment on overlapping primes
  let quatSum = 0;
  for (const p of intersection) {
    const qi = stateI.get(p).quaternion;
    const qj = stateJ.get(p).quaternion;
    quatSum += Math.abs(qi.dot(qj));
  }
  const quatAlign = quatSum / intersection.size;
  
  // 3. Phase coherence on overlapping primes
  let phaseSum = 0;
  for (const p of intersection) {
    const phaseI = stateI.get(p).amplitude.phase();
    const phaseJ = stateJ.get(p).amplitude.phase();
    phaseSum += Math.cos(phaseI - phaseJ);
  }
  const phaseCoherence = (phaseSum / intersection.size + 1) / 2;  // Normalize to [0, 1]
  
  return alpha * jaccard + beta * quatAlign + gamma * phaseCoherence;
}

/**
 * Resonant attention over a set of states (replacing dot-product attention)
 */
function resonantAttention(query, keys, values, temperature = 1.0) {
  const n = keys.length;
  if (n === 0) return null;
  
  // Compute resonance scores
  const scores = keys.map(k => resonanceScore(query, k));
  
  // Softmax
  const maxScore = Math.max(...scores);
  const expScores = scores.map(s => Math.exp((s - maxScore) / temperature));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const weights = expScores.map(e => e / sumExp);
  
  // Weighted sum of values (as sparse states)
  const result = new SparsePrimeState(query.allPrimes.length, query.k);
  
  for (let i = 0; i < n; i++) {
    const w = weights[i];
    for (const [p, act] of values[i].activations) {
      const current = result.get(p);
      const newAmp = current.amplitude.add(act.amplitude.scale(w));
      const newQuat = current.quaternion.add(act.quaternion.scale(w));
      result.set(p, newAmp, newQuat.normalize());
    }
  }
  
  return { result: result.normalize(), weights, scores };
}

// ============================================================================
// HAMILTON PRODUCT COMPOSITION (ORDER-SENSITIVE)
// ============================================================================

/**
 * Compose two states using Hamilton product for quaternion mixing
 * This is ORDER-SENSITIVE: compose(A, B) ≠ compose(B, A)
 */
function hamiltonCompose(stateA, stateB) {
  const result = new SparsePrimeState(stateA.allPrimes.length, stateA.k);
  
  // Get union of active primes
  const primesA = new Set(stateA.getActivePrimes());
  const primesB = new Set(stateB.getActivePrimes());
  const allPrimes = new Set([...primesA, ...primesB]);
  
  for (const p of allPrimes) {
    const actA = stateA.get(p);
    const actB = stateB.get(p);
    
    // Amplitude: multiply complex amplitudes
    const newAmp = actA.amplitude.mul(actB.amplitude);
    
    // Quaternion: Hamilton product (non-commutative!)
    const newQuat = actA.quaternion.mul(actB.quaternion);
    
    result.set(p, newAmp, newQuat.normalize());
  }
  
  return result.normalize();
}

/**
 * Measure non-commutativity between two states
 * Returns the average commutator norm over shared primes
 */
function measureNonCommutativity(stateA, stateB) {
  const primesA = new Set(stateA.getActivePrimes());
  const primesB = new Set(stateB.getActivePrimes());
  const shared = [...primesA].filter(p => primesB.has(p));
  
  if (shared.length === 0) return 0;
  
  let totalCommNorm = 0;
  for (const p of shared) {
    const qA = stateA.get(p).quaternion;
    const qB = stateB.get(p).quaternion;
    totalCommNorm += qA.commutatorNorm(qB);
  }
  
  return totalCommNorm / shared.length;
}

// ============================================================================
// COHERENCE-GATED HALTING (ACT-STYLE)
// ============================================================================

/**
 * Coherence function for a sparse prime state
 * C = Σ_{p,q ∈ P_t} w_pq · cos(θ_p - θ_q)
 */
function computeCoherence(state, weights = null) {
  const primes = state.getActivePrimes();
  const n = primes.length;
  
  if (n < 2) return 1.0;  // Single or no prime = fully coherent
  
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const phaseI = state.get(primes[i]).amplitude.phase();
      const phaseJ = state.get(primes[j]).amplitude.phase();
      const w = weights ? weights[i * n + j] : 1;
      sum += w * Math.cos(phaseI - phaseJ);
      count++;
    }
  }
  
  return (sum / count + 1) / 2;  // Normalize to [0, 1]
}

/**
 * Adaptive Computation Time (ACT) halting decision
 * Returns { halt: boolean, probability: number, coherence: number }
 */
function haltingDecision(state, threshold = 0.8, epsilon = 0.1) {
  const coherence = computeCoherence(state);
  const haltProbability = 1 / (1 + Math.exp(-(coherence - threshold) / epsilon));
  const halt = Math.random() < haltProbability;
  
  return { halt, probability: haltProbability, coherence };
}

/**
 * Run computation with coherence-gated halting
 * stepFn: (state, step) => newState
 * Returns { finalState, steps, haltHistory }
 */
function coherenceGatedCompute(initialState, stepFn, maxSteps = 100, threshold = 0.8) {
  let state = initialState;
  const history = [];
  
  for (let step = 0; step < maxSteps; step++) {
    const decision = haltingDecision(state, threshold);
    history.push({ step, ...decision });
    
    if (decision.halt) {
      return { finalState: state, steps: step + 1, haltHistory: history, halted: true };
    }
    
    state = stepFn(state, step);
  }
  
  return { finalState: state, steps: maxSteps, haltHistory: history, halted: false };
}

// ============================================================================
// ENTROPY COLLAPSE HEAD (64-CODEBOOK)
// ============================================================================

/**
 * Generate 64 attractor states (I-Ching style codebook)
 */
function generateAttractorCodebook(numPrimes = 4096) {
  const attractors = [];
  const basePrimes = firstNPrimes(64);  // First 64 primes as canonical bases
  
  for (let i = 0; i < 64; i++) {
    const state = new SparsePrimeState(numPrimes, 8);
    
    // Each attractor activates 8 primes based on its index (6 bits)
    for (let bit = 0; bit < 6; bit++) {
      if ((i >> bit) & 1) {
        const p = basePrimes[bit * 10 + (i % 10)];  // Spread across primes
        const phase = 2 * Math.PI * bit / 6;
        state.set(p, Complex.fromPolar(1/Math.sqrt(6), phase), Quaternion.random());
      }
    }
    
    state.normalize();
    attractors.push({ index: i, state });
  }
  
  return attractors;
}

/**
 * Entropy collapse head: project to nearest attractor
 */
class EntropyCollapseHead {
  constructor(targetEntropy = 5.99) {
    this.attractors = generateAttractorCodebook();
    this.targetEntropy = targetEntropy;
  }
  
  /**
   * Compute logits over attractors using resonance score
   */
  computeLogits(state) {
    return this.attractors.map(a => resonanceScore(state, a.state));
  }
  
  /**
   * Soft assignment (training mode)
   */
  softAssign(state, temperature = 1.0) {
    const logits = this.computeLogits(state);
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(l => Math.exp((l - maxLogit) / temperature));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map(e => e / sumExp);
    
    return { logits, probs, entropy: this.computeEntropyFromProbs(probs) };
  }
  
  /**
   * Hard assignment (inference mode)
   */
  hardAssign(state) {
    const logits = this.computeLogits(state);
    const maxIdx = logits.indexOf(Math.max(...logits));
    return { index: maxIdx, attractor: this.attractors[maxIdx], confidence: logits[maxIdx] };
  }
  
  /**
   * Compute entropy from probability distribution
   */
  computeEntropyFromProbs(probs) {
    let h = 0;
    for (const p of probs) {
      if (p > 1e-10) {
        h -= p * Math.log2(p);
      }
    }
    return h;
  }
  
  /**
   * Entropy regularization loss (toward target)
   */
  entropyLoss(state) {
    const { entropy } = this.softAssign(state);
    return Math.abs(entropy - this.targetEntropy);
  }
}

// ============================================================================
// PR-GRAPH MEMORY (PUT/GET)
// ============================================================================

/**
 * Prime Resonant Graph Database
 * Persistent content-addressable memory with resonance-based retrieval
 */
class PRGraphMemory {
  constructor(numPrimes = 4096, lockThreshold = 0.8) {
    this.allPrimes = firstNPrimes(numPrimes);
    this.entries = new Map();  // key: hash -> {state, metadata, entropy, locked}
    this.lockThreshold = lockThreshold;
    this.decayRate = 0.1;
  }
  
  /**
   * Generate prime-entropy hash for a key
   */
  _primeEntropyHash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
  
  /**
   * PRG-Put: Write to memory
   * 1. Prime-entropy hash selects k primes
   * 2. Phase-code payload onto those primes
   * 3. Store the superposition
   */
  put(key, state, metadata = {}) {
    const hash = this._primeEntropyHash(key);
    
    // Initial entropy (starts high, will decay toward lock)
    const entropy = state.entropy();
    
    this.entries.set(hash, {
      key,
      state,
      metadata,
      entropy,
      locked: false,
      createdAt: Date.now(),
      accessCount: 0
    });
    
    return hash;
  }
  
  /**
   * PRG-Get: Read from memory
   * 1. Generate probe from query
   * 2. Compute resonance overlap with all entries
   * 3. Lock by entropy-guided resonance
   * 4. Return best match
   */
  get(query, topK = 1) {
    if (this.entries.size === 0) return [];
    
    const results = [];
    
    for (const [hash, entry] of this.entries) {
      const score = resonanceScore(query, entry.state);
      
      // Apply entropy decay
      entry.entropy *= (1 - this.decayRate);
      
      // Check lock condition: low entropy + high resonance
      if (entry.entropy < 0.5 && score > this.lockThreshold) {
        entry.locked = true;
      }
      
      entry.accessCount++;
      
      results.push({
        hash,
        key: entry.key,
        score,
        state: entry.state,
        metadata: entry.metadata,
        locked: entry.locked,
        entropy: entry.entropy
      });
    }
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, topK);
  }
  
  /**
   * Delete by hash
   */
  delete(hash) {
    return this.entries.delete(hash);
  }
  
  /**
   * Get all locked entries (stable memories)
   */
  getLockedMemories() {
    return Array.from(this.entries.values()).filter(e => e.locked);
  }
  
  /**
   * CRT reconstruction (for distributed storage)
   */
  reconstructFromResidues(residues, primes) {
    // Chinese Remainder Theorem reconstruction
    // residues[i] ≡ value (mod primes[i])
    let M = 1;
    for (const p of primes) M *= p;
    
    let result = 0;
    for (let i = 0; i < primes.length; i++) {
      const Mi = M / primes[i];
      const yi = this._modInverse(Mi, primes[i]);
      result = (result + residues[i] * Mi * yi) % M;
    }
    
    return result;
  }
  
  _modInverse(a, m) {
    let [old_r, r] = [a, m];
    let [old_s, s] = [1, 0];
    
    while (r !== 0) {
      const quotient = Math.floor(old_r / r);
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }
    
    return ((old_s % m) + m) % m;
  }
  
  /**
   * Memory statistics
   */
  stats() {
    const total = this.entries.size;
    const locked = this.getLockedMemories().length;
    const avgEntropy = total > 0 
      ? Array.from(this.entries.values()).reduce((s, e) => s + e.entropy, 0) / total 
      : 0;
    
    return { total, locked, avgEntropy };
  }
}

// ============================================================================
// RESONANCE OPERATOR (PHASE ROTATION)
// ============================================================================

/**
 * Resonance operator: R̂(n)|p⟩ = e^(2πi log_p(n))|p⟩
 * Applies log-based phase rotation to all active primes
 */
function applyResonanceOperator(state, n) {
  const result = new SparsePrimeState(state.allPrimes.length, state.k);
  
  for (const [p, act] of state.activations) {
    const logPhase = 2 * Math.PI * Math.log(n) / Math.log(p);
    const rotation = Complex.fromPolar(1, logPhase);
    const newAmp = act.amplitude.mul(rotation);
    result.set(p, newAmp, act.quaternion);
  }
  
  return result;
}

module.exports = {
  // Quaternion
  Quaternion,
  
  // Sparse Prime State
  SparsePrimeState,
  
  // Attention
  resonanceScore,
  resonantAttention,
  
  // Composition
  hamiltonCompose,
  measureNonCommutativity,
  
  // Halting
  computeCoherence,
  haltingDecision,
  coherenceGatedCompute,
  
  // Collapse
  EntropyCollapseHead,
  generateAttractorCodebook,
  
  // Memory
  PRGraphMemory,
  
  // Operators
  applyResonanceOperator
};