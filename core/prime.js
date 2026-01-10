/**
 * Prime number utilities for encoding and cryptographic operations
 */

// Prime generation
function* primeGenerator(start = 2) {
  let n = start;
  while (true) {
    if (isPrime(n)) yield n;
    n++;
  }
}

function nthPrime(n) {
  let count = 0, candidate = 2;
  while (count < n) {
    if (isPrime(candidate)) count++;
    if (count < n) candidate++;
  }
  return candidate;
}

function primesUpTo(max) {
  const sieve = new Array(max + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= max; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= max; j += i) sieve[j] = false;
    }
  }
  return sieve.map((v, i) => v ? i : 0).filter(Boolean);
}

function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3, s = Math.sqrt(n); i <= s; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Factorization
function factorize(n) {
  const factors = {};
  let d = 2;
  while (n > 1) {
    while (n % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      n /= d;
    }
    d++;
    if (d * d > n && n > 1) {
      factors[n] = (factors[n] || 0) + 1;
      break;
    }
  }
  return factors;
}

function primeSignature(primes) {
  return [...primes].sort((a, b) => a - b).join(',');
}

// Gaussian Integers (Z[i])
class GaussianInteger {
  constructor(real, imag) {
    this.real = real;
    this.imag = imag;
  }
  
  norm() { return this.real ** 2 + this.imag ** 2; }
  
  add(other) {
    return new GaussianInteger(this.real + other.real, this.imag + other.imag);
  }
  
  mul(other) {
    return new GaussianInteger(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }
  
  conjugate() {
    return new GaussianInteger(this.real, -this.imag);
  }
  
  isGaussianPrime() {
    const n = this.norm();
    if (!isPrime(n)) return false;
    // Prime if norm is prime and not split
    return n % 4 === 3 || (this.real !== 0 && this.imag !== 0);
  }
  
  toString() {
    if (this.imag === 0) return `${this.real}`;
    if (this.real === 0) return `${this.imag}i`;
    const sign = this.imag > 0 ? '+' : '';
    return `${this.real}${sign}${this.imag}i`;
  }
}

// Eisenstein Integers (Z[ω] where ω = e^(2πi/3))
class EisensteinInteger {
  constructor(a, b) {
    this.a = a;  // a + b*ω
    this.b = b;
  }
  
  norm() { return this.a ** 2 - this.a * this.b + this.b ** 2; }
  
  add(other) {
    return new EisensteinInteger(this.a + other.a, this.b + other.b);
  }
  
  mul(other) {
    return new EisensteinInteger(
      this.a * other.a - this.b * other.b,
      this.a * other.b + this.b * other.a - this.b * other.b
    );
  }
  
  conjugate() {
    return new EisensteinInteger(this.a - this.b, -this.b);
  }
  
  isEisensteinPrime() {
    const n = this.norm();
    return isPrime(n) && n % 3 === 2;
  }
  
  toString() {
    if (this.b === 0) return `${this.a}`;
    if (this.a === 0) return `${this.b}ω`;
    const sign = this.b > 0 ? '+' : '';
    return `${this.a}${sign}${this.b}ω`;
  }
}

// Prime-to-angle mapping (PRSC formula)
function primeToFrequency(p, base = 1, logScale = 10) {
  return base + Math.log(p) / logScale;
}

function primeToAngle(p) {
  return (360 / p) * (Math.PI / 180);
}

// Sum of two squares representation (for p ≡ 1 mod 4)
function sumOfTwoSquares(p) {
  if (p === 2) return [1, 1];
  if (p % 4 !== 1) return null;
  
  for (let a = 1; a * a <= p; a++) {
    const b2 = p - a * a;
    const b = Math.sqrt(b2);
    if (b === Math.floor(b)) return [a, b];
  }
  return null;
}

// Generate first N primes
function firstNPrimes(n) {
  const primes = [];
  let candidate = 2;
  while (primes.length < n) {
    if (isPrime(candidate)) primes.push(candidate);
    candidate++;
  }
  return primes;
}

// Default prime list (first 100 primes)
const DEFAULT_PRIMES = firstNPrimes(100);

// ============================================================================
// 108 INVARIANT (from 108bio.pdf - Twist Eigenstates and Topological Morphogenesis)
// ============================================================================

/**
 * The 108 Invariant - The minimal self-referential twist cavity
 *
 * 108 = 2² × 3³ is identified as the fundamental invariant for:
 * - Standard Model gauge groups (SU(3) × SU(2) × U(1))
 * - Biological self-organization (pentagon angle 108°)
 * - Consciousness as free energy minimization
 *
 * Key relationships:
 * - Trefoil complexity (17) × 108 = 1836 (proton/electron mass ratio)
 * - 108 + 29 (mod-30 prime sieve boundary) = 137 (fine structure constant inverse)
 * - 5³ = 125 GeV (Higgs mass prediction)
 */
const TWIST_108 = {
    // Fundamental value
    value: 108,
    
    // Prime factorization: 2² × 3³
    binary: 4,        // 2²
    ternary: 27,      // 3³
    
    // Gauge symmetry angles
    su3Angle: 120,    // SU(3) color symmetry: 360°/3 = 120° (ternary)
    su2Angle: 180,    // SU(2) weak symmetry: 360°/2 = 180° (binary)
    u1Angle: 360,     // U(1) electromagnetic: full rotation
    
    // Biological resonance
    pentagonAngle: 108,           // Internal angle of regular pentagon
    phyllotaxisComplement: 137.5, // Golden angle in phyllotaxis
    
    // Physical constants derived
    trefoilComplexity: 17,        // Trefoil knot complexity number
    protonElectronRatio: 1836,    // 17 × 108 = proton/electron mass ratio
    fineStructureInverse: 137,    // 108 + 29 = α⁻¹
    higgsMass: 125,               // 5³ GeV (first prime outside minimal twist set)
    mod30Boundary: 29,            // Prime sieve boundary
    
    // Twist eigenstate formula: |n⟩τ = e^(i·2π/n)
    twistEigenstate(n) {
        const angle = (2 * Math.PI) / n;
        return { re: Math.cos(angle), im: Math.sin(angle) };
    },
    
    // Check if n exhibits 108-resonance (divides cleanly with 108)
    resonates(n) {
        if (n === 0) return false;
        const ratio = 108 / n;
        return Math.abs(ratio - Math.round(ratio)) < 0.001 ||
               Math.abs(n / 108 - Math.round(n / 108)) < 0.001;
    },
    
    // Get gauge group contribution from factorization
    gaugeDecomposition(n) {
        const factors = factorize(n);
        return {
            su3Contribution: factors[3] || 0,  // Powers of 3
            su2Contribution: factors[2] || 0,  // Powers of 2
            u1Contribution: Object.keys(factors)
                .filter(p => p !== '2' && p !== '3')
                .reduce((sum, p) => sum + factors[p], 0)
        };
    },
    
    // Derive mass ratio from topological integers
    deriveMassRatio(crossings, sticks, bridge, unknotting) {
        const trefoilComplexity = sticks * crossings - bridge + unknotting;
        return trefoilComplexity * 108;
    }
};

/**
 * Twist angle for a prime (from Enochian layer and 108bio.pdf)
 * κ(p) = 360°/p
 * @param {number} p - Prime number
 * @returns {number} Twist angle in degrees
 */
function twistAngle(p) {
    return 360 / p;
}

/**
 * Total twist for a sequence of primes
 * T(P) = Σᵢ κ(pᵢ)
 * @param {Array<number>} primes - Sequence of primes
 * @returns {number} Total twist in degrees
 */
function totalTwist(primes) {
    return primes.reduce((sum, p) => sum + twistAngle(p), 0);
}

/**
 * Check twist closure (from discrete.pdf equation 18)
 * A sequence is twist-closed when T(P) mod 360 ∈ [0,ε) ∪ (360-ε, 360]
 * @param {Array<number>} primes - Sequence of primes
 * @param {number} epsilon - Tolerance in degrees (default 1.0)
 * @returns {boolean} True if twist-closed
 */
function isTwistClosed(primes, epsilon = 1.0) {
    const twist = totalTwist(primes);
    const mod = ((twist % 360) + 360) % 360;
    return mod < epsilon || mod > (360 - epsilon);
}

/**
 * Find primes that would close a twist sequence
 * @param {Array<number>} currentPrimes - Current prime sequence
 * @param {number} epsilon - Closure tolerance
 * @returns {Array<Object>} Candidate primes with closure errors
 */
function findClosingPrimes(currentPrimes, epsilon = 1.0) {
    const currentTwist = totalTwist(currentPrimes);
    const mod = ((currentTwist % 360) + 360) % 360;
    
    const candidates = [];
    const testPrimes = primesUpTo(100);
    
    for (const p of testPrimes) {
        const newMod = ((mod + twistAngle(p)) % 360);
        const error = Math.min(newMod, 360 - newMod);
        candidates.push({ prime: p, error, closesAt: error < epsilon });
    }
    
    return candidates.sort((a, b) => a.error - b.error);
}

module.exports = {
  primeGenerator, nthPrime, primesUpTo, isPrime,
  factorize, primeSignature, firstNPrimes,
  GaussianInteger, EisensteinInteger,
  primeToFrequency, primeToAngle, sumOfTwoSquares,
  DEFAULT_PRIMES,
  // 108 Invariant exports
  TWIST_108,
  twistAngle,
  totalTwist,
  isTwistClosed,
  findClosingPrimes
};