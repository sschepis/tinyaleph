/**
 * Prime Resonance Network Components
 * 
 * Implementation of:
 * - Prime Resonance Identity (PRI) = (P_G, P_E, P_Q)
 * - Entanglement and Coherence
 * - Phase-Locked Prime Rings
 * - Holographic Memory Fields
 * 
 * From "Prime Resonance Network Specification (PRNS)"
 */

const { GaussianInteger, EisensteinInteger, isPrime, firstNPrimes } = require('./prime');
const { Complex, PrimeState } = require('./hilbert');

// Golden ratio and its conjugate (for irrational phase locks)
const PHI = (1 + Math.sqrt(5)) / 2;           // 1.618...
const PHI_CONJ = (1 - Math.sqrt(5)) / 2;      // -0.618...
const DELTA_S = Math.sqrt(2);                  // Another irrational for phase locks

/**
 * Quaternionic Prime representation
 * Using Hamilton quaternions: q = a + bi + cj + dk
 */
class QuaternionPrime {
  constructor(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
  
  static fromPrime(p) {
    // Embed a prime in quaternion space using a specific encoding
    // p → (p, 0, 0, 0) for simplicity, or a more interesting embedding
    const sqrt = Math.sqrt(p);
    return new QuaternionPrime(p, 0, 0, 0);
  }
  
  static fromGaussian(g) {
    return new QuaternionPrime(g.real, g.imag, 0, 0);
  }
  
  norm() {
    return Math.sqrt(this.a*this.a + this.b*this.b + this.c*this.c + this.d*this.d);
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
      this.a*other.a - this.b*other.b - this.c*other.c - this.d*other.d,
      this.a*other.b + this.b*other.a + this.c*other.d - this.d*other.c,
      this.a*other.c - this.b*other.d + this.c*other.a + this.d*other.b,
      this.a*other.d + this.b*other.c - this.c*other.b + this.d*other.a
    );
  }
  
  conjugate() {
    return new QuaternionPrime(this.a, -this.b, -this.c, -this.d);
  }
  
  isHurwitzPrime() {
    // A Hurwitz quaternion is prime if its norm is a rational prime
    const n = this.norm();
    return isPrime(Math.round(n * n));
  }
  
  toArray() {
    return [this.a, this.b, this.c, this.d];
  }
  
  toString() {
    return `${this.a} + ${this.b}i + ${this.c}j + ${this.d}k`;
  }
}

/**
 * Prime Resonance Identity (PRI)
 * A triadic identity composed of:
 * - P_G: Gaussian prime
 * - P_E: Eisenstein prime
 * - P_Q: Quaternionic prime
 */
class PrimeResonanceIdentity {
  constructor(gaussianPrime, eisensteinPrime, quaternionPrime) {
    this.gaussian = gaussianPrime;      // GaussianInteger
    this.eisenstein = eisensteinPrime;  // EisensteinInteger
    this.quaternion = quaternionPrime;  // QuaternionPrime
    
    // Compute combined signature
    this._computeSignature();
  }
  
  _computeSignature() {
    const gNorm = this.gaussian.norm();
    const eNorm = this.eisenstein.norm();
    const qNorm = this.quaternion.norm();
    
    // Signature is a triple of norms
    this.signature = [gNorm, eNorm, qNorm];
    
    // Hash from signature
    this.hash = (gNorm * 997 + eNorm * 991 + Math.round(qNorm) * 983) % 1000000007;
  }
  
  /**
   * Generate a PRI from a seed integer
   */
  static fromSeed(seed) {
    // Use seed to generate three primes
    const p1 = firstNPrimes(seed + 10)[seed % 10 + 5];
    const p2 = firstNPrimes(seed + 15)[seed % 10 + 8];
    const p3 = firstNPrimes(seed + 20)[seed % 10 + 12];
    
    // Create Gaussian prime: find a + bi where a² + b² is prime
    const g = new GaussianInteger(p1 % 100, (seed * 7) % 50);
    
    // Create Eisenstein prime: find a + bω where a² - ab + b² ≡ 2 (mod 3)
    const e = new EisensteinInteger(p2 % 100, (seed * 11) % 50);
    
    // Create Quaternion prime
    const q = new QuaternionPrime(p3, seed % 10, (seed * 3) % 10, (seed * 7) % 10);
    
    return new PrimeResonanceIdentity(g, e, q);
  }
  
  /**
   * Generate a random PRI
   */
  static random() {
    const primes = firstNPrimes(50);
    
    const idx1 = Math.floor(Math.random() * primes.length);
    const idx2 = Math.floor(Math.random() * primes.length);
    const idx3 = Math.floor(Math.random() * primes.length);
    
    const p1 = primes[idx1];
    const p2 = primes[idx2];
    const p3 = primes[idx3];
    
    const g = new GaussianInteger(p1, Math.floor(Math.random() * 10));
    const e = new EisensteinInteger(p2, Math.floor(Math.random() * 10));
    const q = new QuaternionPrime(p3, 
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5)
    );
    
    return new PrimeResonanceIdentity(g, e, q);
  }
  
  /**
   * Compute entanglement strength with another PRI
   */
  entanglementStrength(other) {
    // Based on phase alignment and norm similarity
    const gPhase = Math.atan2(this.gaussian.imag, this.gaussian.real);
    const gPhaseOther = Math.atan2(other.gaussian.imag, other.gaussian.real);
    
    const ePhase = Math.atan2(this.eisenstein.b * Math.sqrt(3)/2, 
                              this.eisenstein.a - this.eisenstein.b/2);
    const ePhaseOther = Math.atan2(other.eisenstein.b * Math.sqrt(3)/2,
                                   other.eisenstein.a - other.eisenstein.b/2);
    
    const gAlignment = Math.cos(gPhase - gPhaseOther);
    const eAlignment = Math.cos(ePhase - ePhaseOther);
    
    // Quaternion alignment via normalized dot product
    const qNorm = this.quaternion.norm() * other.quaternion.norm();
    const qDot = (this.quaternion.a * other.quaternion.a +
                  this.quaternion.b * other.quaternion.b +
                  this.quaternion.c * other.quaternion.c +
                  this.quaternion.d * other.quaternion.d);
    const qAlignment = qNorm > 0 ? qDot / qNorm : 0;
    
    // Combined entanglement strength
    return (gAlignment + eAlignment + qAlignment) / 3;
  }
  
  toJSON() {
    return {
      gaussian: { real: this.gaussian.real, imag: this.gaussian.imag },
      eisenstein: { a: this.eisenstein.a, b: this.eisenstein.b },
      quaternion: this.quaternion.toArray(),
      signature: this.signature,
      hash: this.hash
    };
  }
}

/**
 * Phase-Locked Prime Ring
 * Implements stable communication via irrational phase locks
 */
class PhaseLockedRing {
  constructor(primes, phaseType = 'phi') {
    this.primes = primes;
    this.n = primes.length;
    this.phases = new Float64Array(this.n);
    
    // Select irrational phase lock
    this.phaseMultiplier = phaseType === 'phi' ? PHI : 
                           phaseType === 'deltaS' ? DELTA_S :
                           2 * Math.PI / PHI;  // 2π/φ
    
    // Initialize phases using irrational multiples
    for (let i = 0; i < this.n; i++) {
      this.phases[i] = (i * this.phaseMultiplier) % (2 * Math.PI);
    }
  }
  
  /**
   * Advance all phases by one step
   */
  tick(dt = 0.01) {
    for (let i = 0; i < this.n; i++) {
      // Each prime oscillates at frequency proportional to log(p)
      const freq = Math.log(this.primes[i]);
      this.phases[i] = (this.phases[i] + freq * dt * this.phaseMultiplier) % (2 * Math.PI);
    }
  }
  
  /**
   * Compute order parameter (Kuramoto-style)
   * r = |1/N Σ e^(iθ_j)|
   */
  orderParameter() {
    let sumReal = 0, sumImag = 0;
    for (let i = 0; i < this.n; i++) {
      sumReal += Math.cos(this.phases[i]);
      sumImag += Math.sin(this.phases[i]);
    }
    return Math.sqrt(sumReal*sumReal + sumImag*sumImag) / this.n;
  }
  
  /**
   * Mean phase
   */
  meanPhase() {
    let sumReal = 0, sumImag = 0;
    for (let i = 0; i < this.n; i++) {
      sumReal += Math.cos(this.phases[i]);
      sumImag += Math.sin(this.phases[i]);
    }
    return Math.atan2(sumImag, sumReal);
  }
  
  /**
   * Synchronization measure
   * How well are phases aligned?
   */
  synchronization() {
    const order = this.orderParameter();
    return order; // 0 = no sync, 1 = perfect sync
  }
  
  /**
   * Apply phase correction toward target
   */
  correctPhase(targetPhase, strength = 0.1) {
    for (let i = 0; i < this.n; i++) {
      const diff = targetPhase - this.phases[i];
      const correction = Math.sin(diff) * strength;
      this.phases[i] = (this.phases[i] + correction) % (2 * Math.PI);
    }
  }
  
  /**
   * Get phase vector as complex amplitudes
   */
  toPrimeState(primesList = null) {
    const state = new PrimeState(primesList || this.primes);
    for (let i = 0; i < this.n && i < state.primes.length; i++) {
      const p = this.primes[i];
      if (state.amplitudes.has(p)) {
        state.set(p, Complex.fromPolar(1, this.phases[i]));
      }
    }
    return state.normalize();
  }
  
  getPhases() {
    return [...this.phases];
  }
}

/**
 * Holographic Memory Field
 * 2D spatial representation of prime-encoded information
 * I(x,y) = Σ A_p e^(-S(x,y)) e^(ipθ)
 */
class HolographicField {
  constructor(width = 64, height = 64, primes = null) {
    this.width = width;
    this.height = height;
    this.primes = primes || firstNPrimes(25);
    
    // Complex amplitude field
    this.field = new Array(height);
    for (let y = 0; y < height; y++) {
      this.field[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        this.field[y][x] = Complex.zero();
      }
    }
    
    // Entropy surface S(x,y)
    this.entropyField = new Array(height);
    for (let y = 0; y < height; y++) {
      this.entropyField[y] = new Float64Array(width);
    }
  }
  
  /**
   * Encode a PrimeState into the holographic field
   */
  encodeState(state, centerX = null, centerY = null) {
    centerX = centerX ?? this.width / 2;
    centerY = centerY ?? this.height / 2;
    
    const sigma = Math.min(this.width, this.height) / 4;  // Spread
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const r = Math.sqrt(dx*dx + dy*dy);
        const theta = Math.atan2(dy, dx);
        
        // Gaussian envelope
        const envelope = Math.exp(-r*r / (2*sigma*sigma));
        
        // Sum over primes
        let sum = Complex.zero();
        for (const p of state.primes) {
          const amp = state.get(p);
          const phase = p * theta;  // e^(ipθ)
          const contribution = amp.mul(Complex.fromPolar(envelope, phase));
          sum = sum.add(contribution);
        }
        
        this.field[y][x] = this.field[y][x].add(sum);
        
        // Update entropy field
        const intensity = sum.norm2();
        if (intensity > 1e-10) {
          this.entropyField[y][x] += -intensity * Math.log2(intensity);
        }
      }
    }
  }
  
  /**
   * Decode field at a point back to PrimeState
   */
  decodeAt(x, y, radius = 5) {
    const state = new PrimeState(this.primes);
    
    // Sample in a small neighborhood
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const val = this.field[py][px];
          const theta = Math.atan2(dy, dx);
          
          // Recover prime contributions
          for (const p of this.primes) {
            const phase = -p * theta;  // Inverse of encoding phase
            const contribution = val.mul(Complex.fromPolar(1, phase));
            state.set(p, state.get(p).add(contribution.scale(1 / (4 * radius * radius))));
          }
        }
      }
    }
    
    return state.normalize();
  }
  
  /**
   * Get total intensity at a point
   */
  intensity(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.field[Math.floor(y)][Math.floor(x)].norm2();
    }
    return 0;
  }
  
  /**
   * Get local entropy at a point
   */
  localEntropy(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.entropyField[Math.floor(y)][Math.floor(x)];
    }
    return 0;
  }
  
  /**
   * Find regions of high intensity (potential memory fragments)
   */
  findPeaks(threshold = 0.1) {
    const peaks = [];
    const maxIntensity = this.maxIntensity();
    
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const intensity = this.field[y][x].norm2();
        
        if (intensity > threshold * maxIntensity) {
          // Check if local maximum
          let isMax = true;
          for (let dy = -1; dy <= 1 && isMax; dy++) {
            for (let dx = -1; dx <= 1 && isMax; dx++) {
              if (dx !== 0 || dy !== 0) {
                if (this.field[y+dy][x+dx].norm2() > intensity) {
                  isMax = false;
                }
              }
            }
          }
          
          if (isMax) {
            peaks.push({ x, y, intensity, phase: this.field[y][x].phase() });
          }
        }
      }
    }
    
    return peaks.sort((a, b) => b.intensity - a.intensity);
  }
  
  maxIntensity() {
    let max = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = this.field[y][x].norm2();
        if (i > max) max = i;
      }
    }
    return max;
  }
  
  /**
   * Clear the field
   */
  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.field[y][x] = Complex.zero();
        this.entropyField[y][x] = 0;
      }
    }
  }
  
  /**
   * Export as grayscale image data (intensity map)
   */
  toImageData() {
    const data = new Uint8ClampedArray(this.width * this.height * 4);
    const max = this.maxIntensity();
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const intensity = max > 0 ? this.field[y][x].norm2() / max : 0;
        const phase = (this.field[y][x].phase() + Math.PI) / (2 * Math.PI);
        
        // HSV to RGB (hue = phase, value = intensity)
        const h = phase * 360;
        const s = 1;
        const v = Math.sqrt(intensity);  // sqrt for gamma correction
        
        const [r, g, b] = hsvToRgb(h, s, v);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    
    return { width: this.width, height: this.height, data };
  }
}

// Helper: HSV to RGB conversion
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

/**
 * Entangled Node (from ResoLang spec)
 * A network node with PRI, phase ring, and holographic memory
 */
class EntangledNode {
  constructor(id, pri = null) {
    this.id = id;
    this.pri = pri || PrimeResonanceIdentity.random();
    this.phaseRing = new PhaseLockedRing(firstNPrimes(16));
    this.holographicMemory = new HolographicField(32, 32);
    this.entanglementMap = new Map();  // nodeId -> strength
    this.coherence = 1.0;
  }
  
  /**
   * Establish entanglement with another node
   */
  entangleWith(other) {
    const strength = this.pri.entanglementStrength(other.pri);
    this.entanglementMap.set(other.id, strength);
    other.entanglementMap.set(this.id, strength);
    return strength;
  }
  
  /**
   * Store a memory fragment
   */
  storeMemory(state, x = null, y = null) {
    this.holographicMemory.encodeState(state, x, y);
  }
  
  /**
   * Retrieve memory at position
   */
  retrieveMemory(x, y) {
    return this.holographicMemory.decodeAt(x, y);
  }
  
  /**
   * Advance node state
   */
  tick(dt = 0.01) {
    this.phaseRing.tick(dt);
    
    // Coherence decays slightly over time
    this.coherence *= (1 - 0.001 * dt);
    
    // But increases with synchronization
    this.coherence = Math.min(1, this.coherence + this.phaseRing.synchronization() * 0.002 * dt);
  }
  
  /**
   * Get current state as PrimeState
   */
  getState() {
    return this.phaseRing.toPrimeState();
  }
  
  /**
   * Check if stable (coherent and synchronized)
   */
  isStable() {
    return this.coherence > 0.85 && this.phaseRing.synchronization() > 0.7;
  }
  
  toJSON() {
    return {
      id: this.id,
      pri: this.pri.toJSON(),
      coherence: this.coherence,
      synchronization: this.phaseRing.synchronization(),
      entanglements: Array.from(this.entanglementMap.entries())
    };
  }
}

/**
 * Resonant Fragment (from ResoLang spec)
 * A portable memory fragment that can be teleported
 */
class ResonantFragment {
  constructor(state, centerX = 0, centerY = 0) {
    this.state = state;
    this.centerX = centerX;
    this.centerY = centerY;
    this.entropy = state.entropy();
    this.createdAt = Date.now();
  }
  
  /**
   * Create from text
   */
  static fromText(text) {
    const { encodeMemory } = require('./hilbert');
    const state = encodeMemory(text);
    return new ResonantFragment(state);
  }
  
  /**
   * Create from prime list
   */
  static fromPrimes(primes, weights = null) {
    const state = new PrimeState();
    for (let i = 0; i < primes.length; i++) {
      const p = primes[i];
      const w = weights ? weights[i] : 1 / primes.length;
      if (state.amplitudes.has(p)) {
        state.set(p, new Complex(w, 0));
      }
    }
    return new ResonantFragment(state.normalize());
  }
  
  /**
   * Tensor product with another fragment
   */
  tensorWith(other) {
    // Combine states via multiplication (non-commutative in quaternionic extension)
    const combined = new PrimeState(this.state.primes);
    for (const p of this.state.primes) {
      const a = this.state.get(p);
      const b = other.state.get(p);
      combined.set(p, a.mul(b));
    }
    return new ResonantFragment(combined.normalize());
  }
  
  /**
   * Rotate phase of fragment
   */
  rotatePhase(angle) {
    const rotation = Complex.fromPolar(1, angle);
    const rotated = this.state.scale(rotation);
    return new ResonantFragment(rotated);
  }
  
  /**
   * Check coherence with another fragment
   */
  coherenceWith(other) {
    return this.state.coherence(other.state);
  }
  
  /**
   * Get dominant primes
   */
  dominant(n = 5) {
    return this.state.dominant(n);
  }
  
  toJSON() {
    return {
      amplitudes: this.state.toArray(),
      center: [this.centerX, this.centerY],
      entropy: this.entropy,
      dominant: this.dominant(3)
    };
  }
}

module.exports = {
  // Constants
  PHI,
  PHI_CONJ,
  DELTA_S,
  
  // Classes
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  
  // Helpers
  hsvToRgb
};