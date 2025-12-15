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

module.exports = {
  primeGenerator, nthPrime, primesUpTo, isPrime,
  factorize, primeSignature, firstNPrimes,
  GaussianInteger, EisensteinInteger,
  primeToFrequency, primeToAngle, sumOfTwoSquares,
  DEFAULT_PRIMES
};