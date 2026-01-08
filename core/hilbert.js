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

const { isPrime, firstNPrimes, factorize } = require('./prime');

/**
 * Complex number class for amplitudes
 */
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

module.exports = {
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  
  // New classes
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  
  // Constants
  PHI,
  DELTA_S
};