/**
 * Prime Hilbert Space (HP)
 * 
 * Implementation of the formal Prime Hilbert space from the paper:
 * "Programming Reality: Prime Resonance Systems for Memory, Computation, and Probability Control"
 * 
 * HP = {|ψ⟩ = Σ αp|p⟩ : Σ|αp|² = 1, αp ∈ ℂ}
 * 
 * Key features:
 * - Complex amplitudes (not just real)
 * - Prime basis states |p⟩
 * - Composite states as prime products
 * - Resonance operators (P̂, F̂, R̂, Ĉ)
 */

/**
 * Complex number class for amplitudes
 */
import { factorize, isPrime, firstNPrimes } from './prime.js';
import { modPow, modInverse } from './math-utils.js';

class Complex {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }
  
  static fromPolar(r, theta) {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }
  
  static zero() { return new Complex(0, 0); }
  static one() { return new Complex(1, 0); }
  static i() { return new Complex(0, 1); }
  
  add(other) {
    return new Complex(this.re + other.re, this.im + other.im);
  }
  
  sub(other) {
    return new Complex(this.re - other.re, this.im - other.im);
  }
  
  mul(other) {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }
  
  scale(k) {
    return new Complex(this.re * k, this.im * k);
  }
  
  conj() {
    return new Complex(this.re, -this.im);
  }
  
  norm2() {
    return this.re * this.re + this.im * this.im;
  }
  
  norm() {
    return Math.sqrt(this.norm2());
  }
  
  phase() {
    return Math.atan2(this.im, this.re);
  }
  
  normalize() {
    const n = this.norm();
    return n > 1e-10 ? this.scale(1/n) : Complex.zero();
  }
  
  exp() {
    // e^(a+bi) = e^a * (cos(b) + i*sin(b))
    const ea = Math.exp(this.re);
    return new Complex(ea * Math.cos(this.im), ea * Math.sin(this.im));
  }
  
  toString() {
    if (Math.abs(this.im) < 1e-10) return `${this.re.toFixed(4)}`;
    if (Math.abs(this.re) < 1e-10) return `${this.im.toFixed(4)}i`;
    const sign = this.im >= 0 ? '+' : '';
    return `${this.re.toFixed(4)}${sign}${this.im.toFixed(4)}i`;
  }
}

/**
 * Prime Hilbert Space State
 * |ψ⟩ = Σ αp|p⟩ where p ∈ P (primes)
 */
class PrimeState {
  constructor(primes = null, maxPrime = 100) {
    // Use provided primes or generate first N
    this.primes = primes || firstNPrimes(25);
    this.maxPrime = maxPrime;
    
    // Map prime → index and index → prime
    this.primeToIndex = new Map();
    this.indexToPrime = new Map();
    this.primes.forEach((p, i) => {
      this.primeToIndex.set(p, i);
      this.indexToPrime.set(i, p);
    });
    
    // Complex amplitudes αp for each prime
    this.amplitudes = new Map();
    for (const p of this.primes) {
      this.amplitudes.set(p, Complex.zero());
    }
  }
  
  /**
   * Create a basis state |p⟩
   */
  static basis(p, primes = null) {
    const state = new PrimeState(primes);
    if (state.amplitudes.has(p)) {
      state.amplitudes.set(p, Complex.one());
    }
    return state;
  }
  
  /**
   * Create a uniform superposition over primes
   */
  static uniform(primes = null) {
    const state = new PrimeState(primes);
    const n = state.primes.length;
    const amp = new Complex(1 / Math.sqrt(n), 0);
    for (const p of state.primes) {
      state.amplitudes.set(p, amp);
    }
    return state;
  }
  
  /**
   * Create a composite state from number n = Π p_i^a_i
   * |n⟩ = Π|p_i⟩^a_i (tensor product abstraction)
   */
  static composite(n, primes = null) {
    const state = new PrimeState(primes);
    const factors = factorize(n);
    
    // Amplitude weighted by multiplicity
    let totalWeight = 0;
    for (const [p, exp] of Object.entries(factors)) {
      totalWeight += exp;
    }
    
    if (totalWeight === 0) return state;
    
    for (const [p, exp] of Object.entries(factors)) {
      const prime = parseInt(p);
      if (state.amplitudes.has(prime)) {
        state.amplitudes.set(prime, new Complex(exp / totalWeight, 0));
      }
    }
    return state.normalize();
  }
  
  /**
   * Get amplitude for prime p
   */
  get(p) {
    return this.amplitudes.get(p) || Complex.zero();
  }
  
  /**
   * Set amplitude for prime p
   */
  set(p, amplitude) {
    if (this.amplitudes.has(p)) {
      this.amplitudes.set(p, amplitude);
    }
    return this;
  }
  
  /**
   * Add states: |ψ⟩ + |φ⟩
   */
  add(other) {
    const result = new PrimeState(this.primes);
    for (const p of this.primes) {
      result.amplitudes.set(p, this.get(p).add(other.get(p)));
    }
    return result;
  }
  
  /**
   * Scale state by complex number: c|ψ⟩
   */
  scale(c) {
    const result = new PrimeState(this.primes);
    const coeff = c instanceof Complex ? c : new Complex(c, 0);
    for (const p of this.primes) {
      result.amplitudes.set(p, this.get(p).mul(coeff));
    }
    return result;
  }
  
  /**
   * Inner product ⟨φ|ψ⟩
   */
  inner(other) {
    let sum = Complex.zero();
    for (const p of this.primes) {
      sum = sum.add(this.get(p).conj().mul(other.get(p)));
    }
    return sum;
  }
  
  /**
   * Norm ||ψ||
   */
  norm() {
    let sum = 0;
    for (const p of this.primes) {
      sum += this.get(p).norm2();
    }
    return Math.sqrt(sum);
  }
  
  /**
   * Normalize to unit vector
   */
  normalize() {
    const n = this.norm();
    if (n < 1e-10) return this;
    return this.scale(new Complex(1/n, 0));
  }
  
  /**
   * Entropy S(ψ) = -Σ |αp|² log |αp|²
   */
  entropy() {
    let h = 0;
    const n2 = this.norm() ** 2;
    if (n2 < 1e-10) return 0;
    
    for (const p of this.primes) {
      const prob = this.get(p).norm2() / n2;
      if (prob > 1e-10) {
        h -= prob * Math.log2(prob);
      }
    }
    return h;
  }
  
  /**
   * Coherence with another state: |⟨φ|ψ⟩|²
   */
  coherence(other) {
    return this.inner(other).norm2();
  }
  
  /**
   * Get dominant primes (highest amplitude)
   */
  dominant(n = 3) {
    return this.primes
      .map(p => ({ p, amp: this.get(p).norm() }))
      .sort((a, b) => b.amp - a.amp)
      .slice(0, n);
  }
  
  /**
   * Born measurement: probabilistic collapse
   */
  measure() {
    const n2 = this.norm() ** 2;
    if (n2 < 1e-10) return { prime: this.primes[0], probability: 1 };
    
    const r = Math.random() * n2;
    let cumulative = 0;
    
    for (const p of this.primes) {
      cumulative += this.get(p).norm2();
      if (r < cumulative) {
        return { 
          prime: p, 
          probability: this.get(p).norm2() / n2 
        };
      }
    }
    
    return { 
      prime: this.primes[this.primes.length - 1], 
      probability: this.get(this.primes[this.primes.length - 1]).norm2() / n2 
    };
  }
  
  /**
   * Convert to array representation
   */
  toArray() {
    return this.primes.map(p => ({
      prime: p,
      amplitude: this.get(p),
      probability: this.get(p).norm2()
    }));
  }
  
  clone() {
    const copy = new PrimeState(this.primes);
    for (const p of this.primes) {
      copy.amplitudes.set(p, new Complex(this.get(p).re, this.get(p).im));
    }
    return copy;
  }
}

/**
 * Resonance Operators from the paper
 */
const ResonanceOperators = {
  /**
   * Prime operator P̂|p⟩ = p|p⟩
   * Eigenvalue is the prime itself
   */
  P(state) {
    const result = new PrimeState(state.primes);
    for (const p of state.primes) {
      result.amplitudes.set(p, state.get(p).scale(p));
    }
    return result;
  },
  
  /**
   * Factorization operator F̂|n⟩ = Σ|p_i⟩
   * Decomposes composite state into prime components
   */
  F(state) {
    const result = new PrimeState(state.primes);
    // Already in prime basis - identity for basis states
    // For composite: distribute amplitude to factors
    for (const p of state.primes) {
      const amp = state.get(p);
      if (amp.norm() > 1e-10) {
        result.amplitudes.set(p, amp);
      }
    }
    return result.normalize();
  },
  
  /**
   * Resonance operator R̂(n)|p⟩ = e^(2πi log_p(n))|p⟩
   * Creates phase rotation based on logarithmic relationship
   */
  R(n) {
    return (state) => {
      const result = new PrimeState(state.primes);
      const logN = Math.log(n);
      
      for (const p of state.primes) {
        const logP = Math.log(p);
        const phase = 2 * Math.PI * logN / logP;
        const rotation = Complex.fromPolar(1, phase);
        result.amplitudes.set(p, state.get(p).mul(rotation));
      }
      return result;
    };
  },
  
  /**
   * Coupling operator Ĉ|ψ⟩ = Σ e^(iφ_pq) ⟨q|ψ⟩|p⟩
   * Phase coupling based on prime relationships
   */
  C(n) {
    return (state) => {
      const result = new PrimeState(state.primes);
      const logN = Math.log(n);
      
      for (const p of state.primes) {
        let sum = Complex.zero();
        for (const q of state.primes) {
          // φ_pq = 2π(log_p(n) - log_q(n))
          const phase = 2 * Math.PI * (logN / Math.log(p) - logN / Math.log(q));
          const rotation = Complex.fromPolar(1, phase);
          sum = sum.add(rotation.mul(state.get(q)));
        }
        result.amplitudes.set(p, sum.scale(1 / state.primes.length));
      }
      return result.normalize();
    };
  },
  
  /**
   * Hadamard-like superposition operator
   */
  H(state) {
    const result = new PrimeState(state.primes);
    const n = state.primes.length;
    const norm = 1 / Math.sqrt(n);
    
    for (const p of state.primes) {
      let sum = Complex.zero();
      for (const [i, q] of state.primes.entries()) {
        const phase = 2 * Math.PI * i * state.primeToIndex.get(p) / n;
        sum = sum.add(state.get(q).mul(Complex.fromPolar(1, phase)));
      }
      result.amplitudes.set(p, sum.scale(norm));
    }
    return result;
  }
};

/**
 * Entropy-driven evolution from equation (7)
 * d|Ψ(t)⟩/dt = iĤ|Ψ(t)⟩ - λ(R̂ - r_stable)|Ψ(t)⟩
 */
class EntropyDrivenEvolution {
  constructor(state, options = {}) {
    this.state = state.clone();
    this.lambda = options.lambda || 0.1;        // Decay rate
    this.rStable = options.rStable || 0.5;      // Stable resonance target
    this.dt = options.dt || 0.01;               // Time step
    this.time = 0;
    this.entropyIntegral = 0;
    this.history = [];
  }
  
  /**
   * Single time step evolution
   */
  step() {
    const s0 = this.state.entropy();
    
    // Hamiltonian evolution (rotation in Hilbert space)
    const rotatedState = ResonanceOperators.R(Math.exp(this.time))(this.state);
    
    // Entropy-driven damping
    const currentR = this.state.norm();
    const dampingFactor = 1 - this.lambda * (currentR - this.rStable) * this.dt;
    
    // Update state
    this.state = rotatedState.scale(new Complex(dampingFactor, 0)).normalize();
    
    // Track entropy
    const s1 = this.state.entropy();
    this.entropyIntegral += s1 * this.dt;
    this.time += this.dt;
    
    this.history.push({
      time: this.time,
      entropy: s1,
      entropyIntegral: this.entropyIntegral,
      dominant: this.state.dominant(3)
    });
    
    return this.state;
  }
  
  /**
   * Evolve until collapse condition met
   * Equation (8): P_collapse = 1 - e^(-∫S(t)dt)
   */
  evolveUntilCollapse(maxSteps = 1000) {
    for (let i = 0; i < maxSteps; i++) {
      this.step();
      
      const pCollapse = 1 - Math.exp(-this.entropyIntegral);
      if (Math.random() < pCollapse * this.dt) {
        return {
          collapsed: true,
          steps: i + 1,
          probability: pCollapse,
          finalState: this.state.measure()
        };
      }
    }
    
    return {
      collapsed: false,
      steps: maxSteps,
      probability: 1 - Math.exp(-this.entropyIntegral),
      finalState: this.state.dominant(1)[0]
    };
  }
  
  /**
   * Get evolution history
   */
  getHistory() {
    return this.history;
  }
}

/**
 * Memory encoding as in equation (9)
 * |M⟩ = Σ αp|p⟩
 */
function encodeMemory(text, primes = null) {
  const state = new PrimeState(primes);
  
  // Map characters to primes with phase encoding
  const chars = text.toLowerCase().split('');
  const n = chars.length;
  
  for (let i = 0; i < chars.length; i++) {
    const charCode = chars[i].charCodeAt(0);
    // Use prime at index charCode % numPrimes
    const primeIdx = charCode % state.primes.length;
    const p = state.primes[primeIdx];
    
    // Phase encodes position, amplitude encodes frequency
    const phase = 2 * Math.PI * i / n;
    const currentAmp = state.get(p);
    const newAmp = currentAmp.add(Complex.fromPolar(1/n, phase));
    state.set(p, newAmp);
  }
  
  return state.normalize();
}

/**
 * Symbolic computation via iterative entropy minimization
 * Equation (10): |Ψ₀⟩ = Σ c_i|R_i⟩ → |r_stable⟩
 */
function symbolicCompute(inputStates, maxIterations = 100, coherenceThreshold = 0.9) {
  if (inputStates.length === 0) return null;
  
  // Superposition of input states
  let state = inputStates[0].clone();
  for (let i = 1; i < inputStates.length; i++) {
    state = state.add(inputStates[i]);
  }
  state = state.normalize();
  
  const evolution = new EntropyDrivenEvolution(state, {
    lambda: 0.15,
    rStable: coherenceThreshold
  });
  
  // Evolve toward stable resonance
  let prevEntropy = state.entropy();
  for (let i = 0; i < maxIterations; i++) {
    evolution.step();
    const currentEntropy = evolution.state.entropy();
    
    // Check for stable state (entropy no longer decreasing)
    if (prevEntropy - currentEntropy < 0.001) {
      break;
    }
    prevEntropy = currentEntropy;
  }
  
  return {
    result: evolution.state,
    iterations: evolution.history.length,
    finalEntropy: evolution.state.entropy(),
    dominant: evolution.state.dominant(5)
  };
}

// Constants
const PHI = (1 + Math.sqrt(5)) / 2;  // Golden ratio ≈ 1.618
const DELTA_S = Math.sqrt(2);         // Irrational shift

/**
 * QuaternionPrime - Quaternion with prime-specific operations
 * q = a + bi + cj + dk
 */
class QuaternionPrime {
  constructor(a = 0, b = 0, c = 0, d = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
  
  static fromPrime(p) {
    // Encode prime in real component
    return new QuaternionPrime(p, 0, 0, 0);
  }
  
  static fromAngle(theta) {
    // Create unit quaternion from rotation angle around k-axis
    const halfTheta = theta / 2;
    return new QuaternionPrime(
      Math.cos(halfTheta),
      0,
      0,
      Math.sin(halfTheta)
    );
  }
  
  add(other) {
    return new QuaternionPrime(
      this.a + other.a,
      this.b + other.b,
      this.c + other.c,
      this.d + other.d
    );
  }
  
  mul(other) {
    // Hamilton product
    return new QuaternionPrime(
      this.a * other.a - this.b * other.b - this.c * other.c - this.d * other.d,
      this.a * other.b + this.b * other.a + this.c * other.d - this.d * other.c,
      this.a * other.c - this.b * other.d + this.c * other.a + this.d * other.b,
      this.a * other.d + this.b * other.c - this.c * other.b + this.d * other.a
    );
  }
  
  scale(k) {
    return new QuaternionPrime(this.a * k, this.b * k, this.c * k, this.d * k);
  }
  
  conj() {
    return new QuaternionPrime(this.a, -this.b, -this.c, -this.d);
  }
  
  norm() {
    return Math.sqrt(this.a ** 2 + this.b ** 2 + this.c ** 2 + this.d ** 2);
  }
  
  normalize() {
    const n = this.norm();
    return n > 1e-10 ? this.scale(1 / n) : new QuaternionPrime(1, 0, 0, 0);
  }
}

/**
 * PrimeResonanceIdentity (PRI)
 * Unique identity based on prime signatures
 */
class PrimeResonanceIdentity {
  constructor(signature, hash) {
    this.signature = signature;
    this.hash = hash;
  }
  
  static random() {
    // Generate random prime signature
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const signature = [];
    for (let i = 0; i < 3; i++) {
      signature.push(primes[Math.floor(Math.random() * primes.length)]);
    }
    const hash = signature.reduce((acc, p) => acc * p, 1) % 1000000007;
    return new PrimeResonanceIdentity(signature, hash);
  }
  
  static fromSeed(seed) {
    // Deterministic generation from seed
    const rng = (s) => {
      s = Math.sin(s * 9999.1) * 10000;
      return s - Math.floor(s);
    };
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const signature = [];
    let s = seed;
    for (let i = 0; i < 3; i++) {
      s = rng(s + i);
      signature.push(primes[Math.floor(s * primes.length)]);
    }
    const hash = signature.reduce((acc, p) => acc * p, 1) % 1000000007;
    return new PrimeResonanceIdentity(signature, hash);
  }
  
  entanglementStrength(other) {
    // Compute entanglement strength based on shared primes
    const shared = this.signature.filter(p => other.signature.includes(p)).length;
    const strength = (2 * shared / (this.signature.length + other.signature.length)) - 0.5;
    return Math.max(-1, Math.min(1, strength * 2));
  }
  
  coherence(other) {
    return Math.abs(this.entanglementStrength(other));
  }
}

/**
 * PhaseLockedRing - Ring of phase-locked oscillators at prime frequencies
 */
class PhaseLockedRing {
  constructor(primes) {
    this.primes = primes;
    this.n = primes.length;
    this.phases = new Float64Array(this.n);
    this.amplitudes = new Float64Array(this.n);
    
    // Initialize with random phases
    for (let i = 0; i < this.n; i++) {
      this.phases[i] = Math.random() * 2 * Math.PI;
      this.amplitudes[i] = 1.0;
    }
    
    this.coupling = 0.1;
    this.time = 0;
  }
  
  tick(dt) {
    const newPhases = new Float64Array(this.n);
    
    for (let i = 0; i < this.n; i++) {
      // Natural frequency from prime
      const omega = Math.log(this.primes[i]);
      
      // Kuramoto coupling
      let coupling = 0;
      for (let j = 0; j < this.n; j++) {
        if (i !== j) {
          coupling += Math.sin(this.phases[j] - this.phases[i]);
        }
      }
      coupling *= this.coupling / this.n;
      
      newPhases[i] = this.phases[i] + (omega + coupling) * dt;
      newPhases[i] %= 2 * Math.PI;
    }
    
    this.phases = newPhases;
    this.time += dt;
    return this;
  }
  
  orderParameter() {
    // Kuramoto order parameter r = |1/N Σ e^(iθ_j)|
    let realSum = 0, imagSum = 0;
    for (let i = 0; i < this.n; i++) {
      realSum += Math.cos(this.phases[i]);
      imagSum += Math.sin(this.phases[i]);
    }
    return Math.sqrt(realSum ** 2 + imagSum ** 2) / this.n;
  }
  
  meanPhase() {
    let realSum = 0, imagSum = 0;
    for (let i = 0; i < this.n; i++) {
      realSum += Math.cos(this.phases[i]);
      imagSum += Math.sin(this.phases[i]);
    }
    return Math.atan2(imagSum, realSum);
  }
  
  toPrimeState() {
    const state = new PrimeState(this.primes);
    for (let i = 0; i < this.n; i++) {
      state.set(this.primes[i], Complex.fromPolar(
        this.amplitudes[i] / Math.sqrt(this.n),
        this.phases[i]
      ));
    }
    return state;
  }
}

/**
 * HolographicField - 2D holographic memory field
 * Encodes PrimeStates as interference patterns
 */
class HolographicField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.field = new Float64Array(width * height);
    this.phaseField = new Float64Array(width * height);
  }
  
  encodeState(state, x, y) {
    // Encode state as interference pattern around (x, y)
    const primes = state.primes;
    
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const idx = j * this.width + i;
        const dx = i - x;
        const dy = j - y;
        const r = Math.sqrt(dx * dx + dy * dy) + 1;
        
        let intensity = 0;
        let phase = 0;
        
        for (const p of primes) {
          const amp = state.get(p);
          if (amp.norm() > 1e-10) {
            // Create ring pattern at prime frequency
            const k = 2 * Math.PI / (p * 0.5);
            intensity += amp.norm() * Math.cos(k * r + amp.phase());
            phase += amp.phase();
          }
        }
        
        this.field[idx] += intensity / primes.length;
        this.phaseField[idx] = phase / primes.length;
      }
    }
    
    return this;
  }
  
  maxIntensity() {
    let max = 0;
    for (let i = 0; i < this.field.length; i++) {
      if (Math.abs(this.field[i]) > max) {
        max = Math.abs(this.field[i]);
      }
    }
    return max;
  }
  
  findPeaks(threshold = 0.1) {
    const peaks = [];
    const maxI = this.maxIntensity();
    
    for (let i = 1; i < this.width - 1; i++) {
      for (let j = 1; j < this.height - 1; j++) {
        const idx = j * this.width + i;
        const val = this.field[idx];
        
        if (Math.abs(val) / maxI < threshold) continue;
        
        // Check if local maximum
        let isMax = true;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const nidx = (j + dj) * this.width + (i + di);
            if (Math.abs(this.field[nidx]) > Math.abs(val)) {
              isMax = false;
              break;
            }
          }
          if (!isMax) break;
        }
        
        if (isMax) {
          peaks.push({ x: i, y: j, intensity: val, phase: this.phaseField[idx] });
        }
      }
    }
    
    return peaks.sort((a, b) => Math.abs(b.intensity) - Math.abs(a.intensity));
  }
  
  decodeAt(x, y, radius = 5) {
    // Decode state by analyzing local frequency content
    const state = new PrimeState();
    const samples = [];
    
    // Sample around the point
    for (let i = Math.max(0, x - radius); i < Math.min(this.width, x + radius); i++) {
      for (let j = Math.max(0, y - radius); j < Math.min(this.height, y + radius); j++) {
        const idx = j * this.width + i;
        const r = Math.sqrt((i - x) ** 2 + (j - y) ** 2);
        if (r > 0 && r <= radius) {
          samples.push({ r, val: this.field[idx], phase: this.phaseField[idx] });
        }
      }
    }
    
    // Analyze for prime frequencies
    for (const p of state.primes) {
      const k = 2 * Math.PI / (p * 0.5);
      let real = 0, imag = 0;
      
      for (const s of samples) {
        real += s.val * Math.cos(k * s.r);
        imag += s.val * Math.sin(k * s.r);
      }
      
      const amp = Math.sqrt(real ** 2 + imag ** 2) / Math.max(1, samples.length);
      const phase = Math.atan2(imag, real);
      
      if (amp > 0.01) {
        state.set(p, Complex.fromPolar(amp, phase));
      }
    }
    
    return state.normalize();
  }
  
  clear() {
    this.field.fill(0);
    this.phaseField.fill(0);
    return this;
  }
}

/**
 * EntangledNode - Network node with entanglement capabilities
 */
class EntangledNode {
  constructor(id) {
    this.id = id;
    this.pri = PrimeResonanceIdentity.random();
    this.entanglementMap = new Map();
    this.coherence = 1.0;
    this.state = PrimeState.uniform();
    this.holographicMemory = new HolographicField(32, 32);
    this.time = 0;
  }
  
  entangleWith(other) {
    const strength = this.pri.entanglementStrength(other.pri);
    this.entanglementMap.set(other.id, { node: other, strength });
    other.entanglementMap.set(this.id, { node: this, strength });
    return strength;
  }
  
  tick(dt) {
    // Update coherence based on entanglements
    if (this.entanglementMap.size > 0) {
      let totalStrength = 0;
      for (const [, entry] of this.entanglementMap) {
        totalStrength += Math.abs(entry.strength);
      }
      this.coherence = totalStrength / this.entanglementMap.size;
    }
    
    // Decay coherence slightly
    this.coherence *= (1 - 0.01 * dt);
    this.coherence = Math.max(0.1, this.coherence);
    
    this.time += dt;
    return this;
  }
  
  storeMemory(state, x, y) {
    this.holographicMemory.encodeState(state, x, y);
    return this;
  }
  
  recallMemory(x, y, radius = 5) {
    return this.holographicMemory.decodeAt(x, y, radius);
  }
  
  getEntanglementStrength(otherId) {
    const entry = this.entanglementMap.get(otherId);
    return entry ? entry.strength : 0;
  }
}

/**
 * ResonantFragment - Fragment of resonant information
 */
class ResonantFragment {
  constructor(state) {
    this.state = state;
    this._entropy = null;
  }
  
  static fromText(text) {
    const state = encodeMemory(text);
    return new ResonantFragment(state);
  }
  
  static fromPrimes(primes) {
    const state = new PrimeState();
    const amp = 1 / Math.sqrt(primes.length);
    for (const p of primes) {
      if (state.amplitudes.has(p)) {
        state.set(p, new Complex(amp, 0));
      }
    }
    return new ResonantFragment(state.normalize());
  }
  
  get entropy() {
    if (this._entropy === null) {
      this._entropy = this.state.entropy();
    }
    return this._entropy;
  }
  
  dominant(n = 3) {
    return this.state.dominant(n);
  }
  
  tensorWith(other) {
    // Simplified tensor product: add states
    const combined = this.state.add(other.state).normalize();
    return new ResonantFragment(combined);
  }
  
  rotatePhase(theta) {
    const rotation = Complex.fromPolar(1, theta);
    const rotated = new PrimeState(this.state.primes);
    for (const p of this.state.primes) {
      rotated.set(p, this.state.get(p).mul(rotation));
    }
    return new ResonantFragment(rotated);
  }
  
  coherenceWith(other) {
    return Math.sqrt(this.state.coherence(other.state));
  }
  
  clone() {
    return new ResonantFragment(this.state.clone());
  }
}

// Legacy CommonJS export removed - ESM exports at end of file

// ============================================================================
// P-ADIC COHERENCE (from Quantum_Semantics paper)
// ============================================================================

/**
 * Calculate p-adic norm |x|_p
 *
 * For prime p, the p-adic norm of integer x is:
 * |x|_p = p^(-v_p(x)) where v_p(x) is the largest power of p dividing x
 *
 * @param {number} x - Integer value
 * @param {number} p - Prime number
 * @returns {number} p-adic norm
 */
function pAdicNorm(x, p) {
  if (x === 0) return 0;
  
  let power = 0;
  let n = Math.abs(Math.floor(x));
  
  while (n % p === 0 && n > 0) {
    power++;
    n = Math.floor(n / p);
  }
  
  return Math.pow(p, -power);
}

/**
 * Calculate p-adic valuation v_p(x)
 * The highest power of p dividing x
 *
 * @param {number} x - Integer value
 * @param {number} p - Prime number
 * @returns {number} p-adic valuation
 */
function pAdicValuation(x, p) {
  if (x === 0) return Infinity;
  
  let power = 0;
  let n = Math.abs(Math.floor(x));
  
  while (n % p === 0 && n > 0) {
    power++;
    n = Math.floor(n / p);
  }
  
  return power;
}

/**
 * P-adic coherence between two PrimeStates
 *
 * Measures coherence in p-adic metric for each prime p.
 * From Quantum_Semantics paper: uses p-adic structure for
 * capturing "closeness" in divisibility sense.
 *
 * @param {PrimeState} state1 - First state
 * @param {PrimeState} state2 - Second state
 * @param {Array<number>} primes - Primes to compute p-adic coherence for
 * @returns {Object} p-adic coherence metrics
 */
function pAdicCoherence(state1, state2, primes = [2, 3, 5]) {
  const coherences = {};
  
  for (const p of primes) {
    // Get amplitude magnitudes for this prime in both states
    const amp1 = state1.get(p);
    const amp2 = state2.get(p);
    
    const mag1 = amp1 ? amp1.norm() : 0;
    const mag2 = amp2 ? amp2.norm() : 0;
    
    // Discretize magnitudes to integers for p-adic comparison
    const int1 = Math.round(mag1 * 1000);
    const int2 = Math.round(mag2 * 1000);
    
    // p-adic distance: |x - y|_p
    const diff = Math.abs(int1 - int2);
    const pNorm = pAdicNorm(diff, p);
    
    // Coherence is 1 - normalized p-adic distance
    // Small p-adic norm (high valuation) means closer in p-adic sense
    coherences[p] = pNorm < 1e-10 ? 1.0 : Math.exp(-pNorm);
  }
  
  // Overall p-adic coherence (geometric mean)
  const values = Object.values(coherences);
  const geometric = Math.pow(
    values.reduce((prod, v) => prod * Math.max(0.001, v), 1),
    1 / values.length
  );
  
  return {
    byPrime: coherences,
    overall: geometric
  };
}

// ============================================================================
// MÖBIUS AND EULER TOTIENT OPERATORS (from qis.pdf)
// ============================================================================

/**
 * Möbius function μ(n)
 *
 * μ(n) = 1 if n = 1
 * μ(n) = (-1)^k if n is product of k distinct primes
 * μ(n) = 0 if n has squared prime factor
 *
 * @param {number} n - Positive integer
 * @returns {number} Möbius function value
 */
function mobiusFunction(n) {
  if (n === 1) return 1;
  
  const factors = factorize(n);
  
  // Check for squared factors
  for (const exp of Object.values(factors)) {
    if (exp > 1) return 0;
  }
  
  // Count distinct prime factors
  const k = Object.keys(factors).length;
  return Math.pow(-1, k);
}

/**
 * Euler's totient function φ(n)
 *
 * Counts integers 1 ≤ k ≤ n that are coprime to n.
 * φ(n) = n · Π(1 - 1/p) for all primes p dividing n
 *
 * @param {number} n - Positive integer
 * @returns {number} Euler totient
 */
function eulerTotient(n) {
  if (n === 1) return 1;
  
  const factors = factorize(n);
  
  let result = n;
  for (const p of Object.keys(factors)) {
    const prime = parseInt(p);
    result = result * (1 - 1/prime);
  }
  
  return Math.round(result);
}

// ============================================================================
// VON MANGOLDT FUNCTION (from book.pdf Chapter 4)
// ============================================================================

/**
 * Von Mangoldt function Λ(n)
 *
 * Λ(n) = log p if n = p^k for some prime p and k ≥ 1
 * Λ(n) = 0 otherwise
 *
 * From book.pdf Chapter 4: "Number-Theoretic Operators"
 * The Von Mangoldt function detects prime powers and weights them by log(p).
 *
 * @param {number} n - Positive integer
 * @returns {number} Von Mangoldt function value
 */
function vonMangoldt(n) {
  if (n <= 1) return 0;
  
  const factors = factorize(n);
  const primeFactors = Object.keys(factors);
  
  // Λ(n) is non-zero only if n = p^k (single prime factor)
  if (primeFactors.length !== 1) return 0;
  
  const p = parseInt(primeFactors[0]);
  return Math.log(p);
}

/**
 * Liouville function λ(n)
 *
 * λ(n) = (-1)^Ω(n) where Ω(n) is total number of prime factors with multiplicity
 *
 * @param {number} n - Positive integer
 * @returns {number} Liouville function value (-1 or 1)
 */
function liouvilleFunction(n) {
  if (n === 1) return 1;
  
  const factors = factorize(n);
  
  // Count total prime factors with multiplicity
  let omega = 0;
  for (const exp of Object.values(factors)) {
    omega += exp;
  }
  
  return Math.pow(-1, omega);
}

/**
 * Divisor count function d(n) = σ₀(n)
 *
 * Counts the number of positive divisors of n.
 * d(n) = Π (a_i + 1) where n = Π p_i^a_i
 *
 * @param {number} n - Positive integer
 * @returns {number} Number of divisors
 */
function divisorCount(n) {
  if (n === 1) return 1;
  
  const factors = factorize(n);
  
  let count = 1;
  for (const exp of Object.values(factors)) {
    count *= (exp + 1);
  }
  
  return count;
}

// ============================================================================
// DIRICHLET CHARACTERS (from book.pdf Chapter 4)
// ============================================================================

/**
 * Dirichlet Character χ_d(n) (Legendre symbol extension)
 *
 * For quadratic characters modulo d:
 * χ_d(n) = (n/d) Legendre/Jacobi symbol
 *
 * From book.pdf Chapter 4: Dirichlet characters encode modular arithmetic symmetries
 *
 * @param {number} n - Integer
 * @param {number} d - Modulus (conductor)
 * @returns {number} Character value: -1, 0, or 1
 */
function dirichletCharacter(n, d) {
  // Use Jacobi symbol as quadratic Dirichlet character
  return jacobiSymbol(n, d);
}

/**
 * Jacobi symbol (n/m) - generalization of Legendre symbol
 *
 * Computed using quadratic reciprocity
 *
 * @param {number} n - Numerator
 * @param {number} m - Denominator (positive odd integer)
 * @returns {number} -1, 0, or 1
 */
function jacobiSymbol(n, m) {
  if (m <= 0 || m % 2 === 0) {
    throw new Error('Jacobi symbol denominator must be positive and odd');
  }
  
  n = ((n % m) + m) % m;  // Reduce n mod m
  
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (m === 1) return 1;
  
  // Factor out powers of 2 from n
  let twos = 0;
  while (n % 2 === 0) {
    n /= 2;
    twos++;
  }
  
  // (2/m) = (-1)^((m²-1)/8)
  let result = 1;
  if (twos % 2 === 1) {
    const mMod8 = m % 8;
    if (mMod8 === 3 || mMod8 === 5) {
      result = -result;
    }
  }
  
  if (n === 1) return result;
  
  // Quadratic reciprocity: (n/m)(m/n) = (-1)^((n-1)(m-1)/4)
  if (n % 4 === 3 && m % 4 === 3) {
    result = -result;
  }
  
  return result * jacobiSymbol(m % n, n);
}

/**
 * Principal Dirichlet character χ₀ mod d
 *
 * χ₀(n) = 1 if gcd(n, d) = 1, else 0
 *
 * @param {number} n - Integer
 * @param {number} d - Modulus
 * @returns {number} 0 or 1
 */
function principalCharacter(n, d) {
  return gcd(n, d) === 1 ? 1 : 0;
}

/**
 * Greatest common divisor
 */
function gcd(a, b) {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Generate all Dirichlet characters modulo d
 *
 * For small d, enumerate character table
 *
 * @param {number} d - Modulus
 * @returns {Array<Function>} Array of character functions
 */
function generateDirichletCharacters(d) {
  const phi_d = eulerTotient(d);
  const characters = [];
  
  // Principal character always exists
  characters.push((n) => principalCharacter(n, d));
  
  // For prime modulus, we can generate all characters
  if (isPrime(d)) {
    // Find primitive root
    const g = findPrimitiveRoot(d);
    if (g) {
      // Generate characters via powers of primitive root
      for (let k = 1; k < phi_d; k++) {
        const exponent = k;
        characters.push((n) => {
          if (gcd(n, d) !== 1) return 0;
          const idx = discreteLog(n % d, g, d);
          if (idx === -1) return 0;
          return Complex.fromPolar(1, 2 * Math.PI * exponent * idx / phi_d);
        });
      }
    }
  }
  
  return characters;
}

/**
 * Find a primitive root modulo p (for prime p)
 */
function findPrimitiveRoot(p) {
  if (!isPrime(p)) return null;
  if (p === 2) return 1;
  
  const phi = p - 1;
  const factors = factorize(phi);
  
  for (let g = 2; g < p; g++) {
    let isPrimitive = true;
    for (const q of Object.keys(factors)) {
      if (modPow(g, phi / parseInt(q), p) === 1) {
        isPrimitive = false;
        break;
      }
    }
    if (isPrimitive) return g;
  }
  return null;
}

// modPow imported from math-utils.js

/**
 * Discrete logarithm: find x such that g^x ≡ n (mod p)
 * Uses baby-step giant-step for small p
 */
function discreteLog(n, g, p) {
  n = ((n % p) + p) % p;
  if (n === 1) return 0;
  
  const m = Math.ceil(Math.sqrt(p));
  
  // Baby step: compute g^j for j = 0..m-1
  const table = new Map();
  let val = 1;
  for (let j = 0; j < m; j++) {
    table.set(val, j);
    val = (val * g) % p;
  }
  
  // Giant step: compute n * (g^-m)^i for i = 0..m-1
  const gInvM = modPow(modInverse(g, p), m, p);
  val = n;
  for (let i = 0; i < m; i++) {
    if (table.has(val)) {
      return i * m + table.get(val);
    }
    val = (val * gInvM) % p;
  }
  
  return -1;  // Not found
}

// modInverse imported from math-utils.js

/**
 * Extended Resonance Operators including Möbius and Euler Totient
 *
 * From book.pdf Chapters 2 and 4:
 * - M̂|n⟩ = μ(n)|n⟩ (Möbius operator)
 * - Ê|n⟩ = exp(2πiφ(n)/n)|n⟩ (Euler phase operator)
 * - ζ̂(s)|n⟩ = n^(-s)|n⟩ (Zeta operator)
 * - Λ̂|n⟩ = Λ(n)|n⟩ (Von Mangoldt operator)
 * - χ̂_d(n)|n⟩ = χ_d(n)|n⟩ (Dirichlet character operator)
 */
const ExtendedOperators = {
  /**
   * Möbius Operator: M̂|p⟩ = μ(p)|p⟩
   * For primes, μ(p) = -1 always
   *
   * This operator distinguishes "even" vs "odd" prime products
   * and annihilates states with squared factors.
   */
  M(state) {
    const result = new PrimeState(state.primes);
    for (const p of state.primes) {
      const mu = mobiusFunction(p);
      result.amplitudes.set(p, state.get(p).scale(mu));
    }
    return result;
  },
  
  /**
   * Euler Phase Operator: Ê|n⟩ = exp(2πiφ(n)/n)|n⟩
   *
   * Applies phase rotation based on Euler's totient function.
   * For prime p: φ(p) = p-1, so phase = 2π(p-1)/p
   */
  E(state) {
    const result = new PrimeState(state.primes);
    for (const p of state.primes) {
      const phi = eulerTotient(p);
      const phase = 2 * Math.PI * phi / p;
      const rotation = Complex.fromPolar(1, phase);
      result.amplitudes.set(p, state.get(p).mul(rotation));
    }
    return result;
  },
  
  /**
   * Divisor Count Operator
   * D̂|n⟩ = d(n)|n⟩ where d(n) is number of divisors
   */
  D(state) {
    const result = new PrimeState(state.primes);
    for (const p of state.primes) {
      // For prime p, d(p) = 2
      result.amplitudes.set(p, state.get(p).scale(2));
    }
    return result;
  },
  
  /**
   * Liouville Operator
   * L̂|n⟩ = λ(n)|n⟩ where λ(n) = (-1)^Ω(n) (Ω = total prime factors with multiplicity)
   */
  L(state) {
    const result = new PrimeState(state.primes);
    for (const p of state.primes) {
      // For prime p, Ω(p) = 1, so λ(p) = -1
      result.amplitudes.set(p, state.get(p).scale(-1));
    }
    return result;
  },
  
  // ==========================================================================
  // NEW OPERATORS FROM book.pdf Chapter 4
  // ==========================================================================
  
  /**
   * Zeta Operator: ζ̂(s)|n⟩ = n^(-s)|n⟩
   * 
   * From book.pdf Chapter 4: "Number-Theoretic Operators"
   * 
   * The Zeta operator scales each prime basis state by p^(-s).
   * This connects to the Riemann zeta function ζ(s) = Σ n^(-s).
   * 
   * For complex s = σ + it:
   * - Real part σ controls amplitude decay
   * - Imaginary part t controls phase rotation
   * 
   * @param {number|Complex} s - The zeta parameter (real or complex)
   * @returns {Function} Operator function that acts on PrimeState
   */
  Zeta(s) {
    const sComplex = s instanceof Complex ? s : new Complex(s, 0);
    
    return (state) => {
      const result = new PrimeState(state.primes);
      
      for (const p of state.primes) {
        // p^(-s) = exp(-s * log(p))
        const logP = Math.log(p);
        const exponent = new Complex(-sComplex.re * logP, -sComplex.im * logP);
        const scaling = exponent.exp();
        
        result.amplitudes.set(p, state.get(p).mul(scaling));
      }
      
      return result;
    };
  },
  
  /**
   * Von Mangoldt Operator: Λ̂|n⟩ = Λ(n)|n⟩
   * 
   * From book.pdf Chapter 4: "Number-Theoretic Operators"
   * 
   * For prime basis states |p⟩: Λ̂|p⟩ = log(p)|p⟩
   * For non-prime-power: Λ̂|n⟩ = 0
   * 
   * This operator detects and weights prime powers by their logarithm.
   * It's the "derivative" of the prime counting function.
   */
  Lambda(state) {
    const result = new PrimeState(state.primes);
    
    for (const p of state.primes) {
      // For prime basis states, Λ(p) = log(p)
      const lambda = vonMangoldt(p);
      result.amplitudes.set(p, state.get(p).scale(lambda));
    }
    
    return result;
  },
  
  /**
   * Dirichlet Character Operator: χ̂_d|n⟩ = χ_d(n)|n⟩
   * 
   * From book.pdf Chapter 4: "Number-Theoretic Operators"
   * 
   * Applies Dirichlet character modulo d to scale amplitudes.
   * For quadratic characters, this uses the Jacobi symbol.
   * 
   * @param {number} d - The modulus (conductor) of the character
   * @returns {Function} Operator function
   */
  Chi(d) {
    return (state) => {
      const result = new PrimeState(state.primes);
      
      for (const p of state.primes) {
        try {
          // Use quadratic character (Jacobi symbol)
          const chi = d % 2 === 1 ? jacobiSymbol(p, d) : principalCharacter(p, d);
          result.amplitudes.set(p, state.get(p).scale(chi));
        } catch (e) {
          // For even d, fall back to principal character
          result.amplitudes.set(p, state.get(p).scale(principalCharacter(p, d)));
        }
      }
      
      return result;
    };
  },
  
  /**
   * Principal Character Operator: χ̂₀|n⟩ = χ₀(n)|n⟩
   * 
   * χ₀(n) = 1 if gcd(n, d) = 1, else 0
   * Projects onto states coprime to d.
   * 
   * @param {number} d - Modulus
   * @returns {Function} Operator function
   */
  Chi0(d) {
    return (state) => {
      const result = new PrimeState(state.primes);
      
      for (const p of state.primes) {
        const chi0 = principalCharacter(p, d);
        result.amplitudes.set(p, state.get(p).scale(chi0));
      }
      
      return result;
    };
  },
  
  /**
   * General Von Mangoldt Operator with scaling
   * Λ̂_α|n⟩ = Λ(n)^α |n⟩
   * 
   * Allows fractional powers of the Von Mangoldt function.
   * 
   * @param {number} alpha - Power to raise Λ(n)
   * @returns {Function} Operator function
   */
  LambdaAlpha(alpha) {
    return (state) => {
      const result = new PrimeState(state.primes);
      
      for (const p of state.primes) {
        const lambda = vonMangoldt(p);
        const scaled = lambda > 0 ? Math.pow(lambda, alpha) : 0;
        result.amplitudes.set(p, state.get(p).scale(scaled));
      }
      
      return result;
    };
  },
  
  /**
   * Spectral Zeta Analysis: Compute ζ(s) expectation
   * 
   * ⟨ψ|ζ̂(s)|ψ⟩ = Σ |αp|² p^(-s)
   * 
   * Returns complex value representing weighted prime sum.
   * 
   * @param {PrimeState} state - Input state
   * @param {number|Complex} s - Zeta parameter
   * @returns {Complex} Expectation value
   */
  zetaExpectation(state, s) {
    const sComplex = s instanceof Complex ? s : new Complex(s, 0);
    let sum = Complex.zero();
    
    for (const p of state.primes) {
      const prob = state.get(p).norm2();
      if (prob > 1e-10) {
        const logP = Math.log(p);
        const exponent = new Complex(-sComplex.re * logP, -sComplex.im * logP);
        const scaling = exponent.exp();
        sum = sum.add(scaling.scale(prob));
      }
    }
    
    return sum;
  },
  
  /**
   * Symbolic Zeta Function approximation
   * 
   * Computes ζ(s) ≈ Σ_{p≤N} 1/(1 - p^(-s)) (Euler product over primes)
   * 
   * @param {number|Complex} s - Zeta parameter (Re(s) > 1 for convergence)
   * @param {Array<number>} primes - Primes to sum over
   * @returns {Complex} Approximate zeta value
   */
  zetaEulerProduct(s, primes = null) {
    const ps = primes || [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const sComplex = s instanceof Complex ? s : new Complex(s, 0);
    
    let product = Complex.one();
    
    for (const p of ps) {
      const logP = Math.log(p);
      const exponent = new Complex(-sComplex.re * logP, -sComplex.im * logP);
      const pMinusS = exponent.exp();  // p^(-s)
      
      // (1 - p^(-s))^(-1)
      const denominator = Complex.one().sub(pMinusS);
      const denom2 = denominator.norm2();
      if (denom2 > 1e-10) {
        const inverse = new Complex(
          denominator.re / denom2,
          -denominator.im / denom2
        );
        product = product.mul(inverse);
      }
    }
    
    return product;
  }
};

// ============================================================================
// KNOWLEDGE RESONANCE Γ_know (from Quantum_Semantics)
// ============================================================================

/**
 * Knowledge Resonance Calculator
 *
 * From Quantum_Semantics paper: evaluates how conceptual primes align
 * across a semantic network. Measures coherence of meaning.
 *
 * Γ_know = Σ_ij J_ij · R_i · R_j / Σ_i |R_i|²
 *
 * Where J_ij are coupling strengths and R_i are resonance values.
 */
class KnowledgeResonanceCalculator {
  /**
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    // Coupling matrix (semantic adjacency)
    this.couplings = options.couplings || new Map();
    
    // Golden ratio for harmonic weighting
    this.phi = (1 + Math.sqrt(5)) / 2;
    
    // Base coupling for unknown pairs
    this.baseCoupling = options.baseCoupling || 0.1;
  }
  
  /**
   * Set coupling strength between two concept primes
   * @param {number} p1 - First prime
   * @param {number} p2 - Second prime
   * @param {number} strength - Coupling strength J_ij
   */
  setCoupling(p1, p2, strength) {
    const key = `${Math.min(p1, p2)}:${Math.max(p1, p2)}`;
    this.couplings.set(key, strength);
  }
  
  /**
   * Get coupling strength
   */
  getCoupling(p1, p2) {
    const key = `${Math.min(p1, p2)}:${Math.max(p1, p2)}`;
    if (this.couplings.has(key)) {
      return this.couplings.get(key);
    }
    
    // Default: coupling based on prime ratio proximity to PHI
    const ratio = Math.max(p1, p2) / Math.min(p1, p2);
    const phiDistance = Math.abs(ratio - this.phi);
    return this.baseCoupling * Math.exp(-phiDistance);
  }
  
  /**
   * Calculate knowledge resonance for a PrimeState
   *
   * @param {PrimeState} state - Concept state
   * @returns {Object} Resonance metrics
   */
  calculate(state) {
    const primes = state.primes.filter(p => state.get(p).norm() > 1e-10);
    
    if (primes.length === 0) {
      return { gamma: 0, selfEnergy: 0, interactionEnergy: 0 };
    }
    
    // Self-energy: Σ_i |R_i|²
    let selfEnergy = 0;
    for (const p of primes) {
      selfEnergy += state.get(p).norm2();
    }
    
    // Interaction energy: Σ_ij J_ij · R_i · R_j
    let interactionEnergy = 0;
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        const J = this.getCoupling(primes[i], primes[j]);
        const R_i = state.get(primes[i]).norm();
        const R_j = state.get(primes[j]).norm();
        interactionEnergy += J * R_i * R_j;
      }
    }
    
    // Knowledge resonance Γ_know
    const gamma = selfEnergy > 0
      ? interactionEnergy / selfEnergy
      : 0;
    
    return {
      gamma,
      selfEnergy,
      interactionEnergy,
      dominantPrimes: primes.slice(0, 3),
      coherenceLevel: this.interpretGamma(gamma)
    };
  }
  
  /**
   * Interpret gamma value
   */
  interpretGamma(gamma) {
    if (gamma > 0.7) return 'high_coherence';
    if (gamma > 0.4) return 'moderate_coherence';
    if (gamma > 0.1) return 'low_coherence';
    return 'fragmented';
  }
  
  /**
   * Calculate resonance between two states
   */
  resonanceBetween(state1, state2) {
    // Combined state
    const combined = state1.add(state2).normalize();
    const r1 = this.calculate(state1);
    const r2 = this.calculate(state2);
    const rCombined = this.calculate(combined);
    
    // Synergy: combined > individual sum
    const synergy = rCombined.gamma - (r1.gamma + r2.gamma) / 2;
    
    return {
      state1Gamma: r1.gamma,
      state2Gamma: r2.gamma,
      combinedGamma: rCombined.gamma,
      synergy,
      isConstructive: synergy > 0
    };
  }
}

// ============================================================================
// FIBONACCI WAVELET ALIGNMENT (from Quantum_Semantics)
// ============================================================================

/**
 * Fibonacci Wavelet Generator
 *
 * Creates wavelets at Fibonacci-scaled frequencies for
 * multi-resolution semantic analysis.
 */
class FibonacciWaveletBank {
  /**
   * @param {number} size - Wavelet size
   * @param {number} scales - Number of Fibonacci scales
   */
  constructor(size = 256, scales = 7) {
    this.size = size;
    this.phi = (1 + Math.sqrt(5)) / 2;
    
    // Generate Fibonacci-scaled wavelets
    this.wavelets = [];
    for (let n = -3; n <= scales - 4; n++) {
      const scale = Math.pow(this.phi, n);
      this.wavelets.push(this.generateWavelet(scale));
    }
  }
  
  /**
   * Generate a Gabor wavelet at given scale
   * @param {number} scale - Scale factor
   */
  generateWavelet(scale) {
    const wavelet = new Float64Array(this.size);
    const center = this.size / 2;
    
    for (let i = 0; i < this.size; i++) {
      const t = (i - center) / scale;
      // Gabor wavelet: cos(t) * exp(-t²/2)
      wavelet[i] = Math.cos(t) * Math.exp(-t * t / (2 * scale * scale));
    }
    
    return { scale, data: wavelet };
  }
  
  /**
   * Compute Fibonacci wavelet transform of a signal
   * @param {Array<number>} signal - Input signal
   * @returns {Array<Object>} Wavelet coefficients per scale
   */
  transform(signal) {
    const results = [];
    
    for (const wavelet of this.wavelets) {
      const coefficients = this.convolve(signal, wavelet.data);
      const energy = coefficients.reduce((sum, c) => sum + c * c, 0);
      
      results.push({
        scale: wavelet.scale,
        coefficients,
        energy,
        peak: Math.max(...coefficients.map(Math.abs))
      });
    }
    
    return results;
  }
  
  /**
   * Convolution
   */
  convolve(signal, kernel) {
    const output = new Array(signal.length).fill(0);
    const halfK = Math.floor(kernel.length / 2);
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      for (let j = 0; j < kernel.length; j++) {
        const signalIdx = i + j - halfK;
        if (signalIdx >= 0 && signalIdx < signal.length) {
          sum += signal[signalIdx] * kernel[j];
        }
      }
      output[i] = sum;
    }
    
    return output;
  }
  
  /**
   * Check alignment with Fibonacci sequence
   * @param {Array<Object>} transformResult - Wavelet transform output
   */
  measureAlignment(transformResult) {
    // Check if energy is concentrated at PHI-related scales
    const totalEnergy = transformResult.reduce((sum, r) => sum + r.energy, 0);
    
    if (totalEnergy < 1e-10) return { aligned: false, score: 0 };
    
    // Score based on PHI-power scale concentration
    let alignedEnergy = 0;
    for (const result of transformResult) {
      // Check if scale is close to a PHI power
      const logScale = Math.log(result.scale) / Math.log(this.phi);
      const isPhiPower = Math.abs(logScale - Math.round(logScale)) < 0.1;
      
      if (isPhiPower) {
        alignedEnergy += result.energy;
      }
    }
    
    const score = alignedEnergy / totalEnergy;
    
    return {
      aligned: score > 0.5,
      score,
      dominantScale: transformResult.reduce(
        (max, r) => r.energy > max.energy ? r : max,
        transformResult[0]
      ).scale
    };
  }
}

// ============================================================================
// PATTERN CLASSIFICATION (Zero/Infinity/Fibonacci from Quantum_Semantics)
// ============================================================================

/**
 * Semantic Pattern Detector
 *
 * Detects fundamental patterns in semantic waves:
 * - Zero Pattern: convergence/nullification
 * - Infinity Pattern: divergence/expansion
 * - Fibonacci Pattern: golden ratio harmony
 */
class SemanticPatternDetector {
  constructor(options = {}) {
    this.phi = (1 + Math.sqrt(5)) / 2;
    this.zeroThreshold = options.zeroThreshold || 0.1;
    this.infinityThreshold = options.infinityThreshold || 5.0;
    this.fibThreshold = options.fibThreshold || 0.1;
  }
  
  /**
   * Detect zero pattern (semantic nullification)
   * Occurs when concepts cancel each other
   */
  detectZeroPattern(state) {
    const entropy = state.entropy();
    const norm = state.norm();
    
    // Zero pattern: high entropy (spread out) + low total amplitude
    if (norm < this.zeroThreshold) {
      return {
        detected: true,
        strength: 1 - norm / this.zeroThreshold,
        type: 'convergence'
      };
    }
    
    // Check for cancellation in pairs
    let cancellationScore = 0;
    const primes = state.primes;
    
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        const amp1 = state.get(primes[i]);
        const amp2 = state.get(primes[j]);
        
        // Opposite phases with similar magnitudes -> cancellation
        const phaseDiff = Math.abs(amp1.phase() - amp2.phase());
        const magRatio = Math.min(amp1.norm(), amp2.norm()) /
                        (Math.max(amp1.norm(), amp2.norm()) + 1e-10);
        
        if (Math.abs(phaseDiff - Math.PI) < 0.3 && magRatio > 0.5) {
          cancellationScore += magRatio;
        }
      }
    }
    
    return {
      detected: cancellationScore > 1,
      strength: Math.min(1, cancellationScore / 3),
      type: 'interference'
    };
  }
  
  /**
   * Detect infinity pattern (semantic expansion)
   * Occurs when concepts reinforce unboundedly
   */
  detectInfinityPattern(state) {
    const amplitudes = state.primes.map(p => state.get(p).norm());
    const maxAmp = Math.max(...amplitudes);
    const meanAmp = amplitudes.reduce((s, a) => s + a, 0) / amplitudes.length;
    
    // Infinity pattern: one or few primes dominate strongly
    const dominanceRatio = maxAmp / (meanAmp + 1e-10);
    
    if (dominanceRatio > this.infinityThreshold) {
      return {
        detected: true,
        strength: Math.min(1, dominanceRatio / 10),
        type: 'divergence',
        dominantPrime: state.dominant(1)[0].p
      };
    }
    
    return { detected: false, strength: 0, type: 'stable' };
  }
  
  /**
   * Detect Fibonacci/Golden pattern
   * Occurs when amplitude ratios approximate PHI
   */
  detectFibonacciPattern(state) {
    const primes = state.primes.filter(p => state.get(p).norm() > 0.01);
    if (primes.length < 2) {
      return { detected: false, score: 0 };
    }
    
    // Sort by amplitude
    const sorted = primes
      .map(p => ({ p, amp: state.get(p).norm() }))
      .sort((a, b) => b.amp - a.amp);
    
    // Check consecutive amplitude ratios for PHI
    let phiCount = 0;
    let totalPairs = 0;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const ratio = sorted[i].amp / (sorted[i + 1].amp + 1e-10);
      const phiDistance = Math.abs(ratio - this.phi);
      
      if (phiDistance < this.fibThreshold) {
        phiCount++;
      }
      totalPairs++;
    }
    
    const score = totalPairs > 0 ? phiCount / totalPairs : 0;
    
    return {
      detected: score > 0.3,
      score,
      phiRatioCount: phiCount,
      dominantPair: sorted.length >= 2
        ? [sorted[0].p, sorted[1].p]
        : null
    };
  }
  
  /**
   * Full pattern classification
   */
  classify(state) {
    const zero = this.detectZeroPattern(state);
    const infinity = this.detectInfinityPattern(state);
    const fib = this.detectFibonacciPattern(state);
    
    // Determine dominant pattern
    let dominant = 'neutral';
    let confidence = 0;
    
    if (zero.detected && zero.strength > confidence) {
      dominant = 'zero';
      confidence = zero.strength;
    }
    if (infinity.detected && infinity.strength > confidence) {
      dominant = 'infinity';
      confidence = infinity.strength;
    }
    if (fib.detected && fib.score > confidence) {
      dominant = 'fibonacci';
      confidence = fib.score;
    }
    
    return {
      dominant,
      confidence,
      patterns: { zero, infinity, fibonacci: fib },
      entropy: state.entropy()
    };
  }
}

// Export all classes and functions
export {
  // Core classes
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  
  // Extended classes
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  
  // Constants
  PHI,
  DELTA_S,
  
  // P-adic functions
  pAdicNorm,
  pAdicValuation,
  pAdicCoherence,
  
  // Number theory functions (book.pdf Chapter 4)
  mobiusFunction,
  eulerTotient,
  vonMangoldt,
  liouvilleFunction,
  divisorCount,
  
  // Dirichlet characters and number theory helpers
  dirichletCharacter,
  jacobiSymbol,
  principalCharacter,
  generateDirichletCharacters,
  findPrimitiveRoot,
  modPow,
  discreteLog,
  modInverse,
  gcd,
  
  // Extended operators and calculators
  ExtendedOperators,
  KnowledgeResonanceCalculator,
  FibonacciWaveletBank,
  SemanticPatternDetector
};
