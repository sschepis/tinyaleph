/**
 * Tests for prime number utilities
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  isPrime,
  nthPrime,
  primesUpTo,
  firstNPrimes,
  factorize,
  primeSignature,
  primeGenerator,
  GaussianInteger,
  EisensteinInteger,
  primeToFrequency,
  primeToAngle,
  sumOfTwoSquares,
  DEFAULT_PRIMES
} = require('../core/prime');

describe('Prime utilities', () => {
  describe('isPrime', () => {
    it('should return true for primes', () => {
      assert.strictEqual(isPrime(2), true);
      assert.strictEqual(isPrime(3), true);
      assert.strictEqual(isPrime(5), true);
      assert.strictEqual(isPrime(7), true);
      assert.strictEqual(isPrime(11), true);
      assert.strictEqual(isPrime(13), true);
    });

    it('should return false for non-primes', () => {
      assert.strictEqual(isPrime(0), false);
      assert.strictEqual(isPrime(1), false);
      assert.strictEqual(isPrime(4), false);
      assert.strictEqual(isPrime(6), false);
      assert.strictEqual(isPrime(8), false);
      assert.strictEqual(isPrime(9), false);
    });

    it('should handle large primes', () => {
      assert.strictEqual(isPrime(104729), true); // 10000th prime
    });
  });

  describe('nthPrime', () => {
    it('should return correct nth prime', () => {
      assert.strictEqual(nthPrime(1), 2);
      assert.strictEqual(nthPrime(2), 3);
      assert.strictEqual(nthPrime(3), 5);
      assert.strictEqual(nthPrime(4), 7);
      assert.strictEqual(nthPrime(5), 11);
      assert.strictEqual(nthPrime(10), 29);
    });
  });

  describe('primesUpTo', () => {
    it('should return primes up to limit', () => {
      const primes = primesUpTo(20);
      assert.deepStrictEqual(primes, [2, 3, 5, 7, 11, 13, 17, 19]);
    });

    it('should return empty for limit < 2', () => {
      assert.deepStrictEqual(primesUpTo(1), []);
    });
  });

  describe('firstNPrimes', () => {
    it('should return first N primes', () => {
      const primes = firstNPrimes(5);
      assert.deepStrictEqual(primes, [2, 3, 5, 7, 11]);
    });
  });

  describe('primeGenerator', () => {
    it('should generate primes', () => {
      const gen = primeGenerator(2);
      assert.strictEqual(gen.next().value, 2);
      assert.strictEqual(gen.next().value, 3);
      assert.strictEqual(gen.next().value, 5);
      assert.strictEqual(gen.next().value, 7);
    });
  });

  describe('factorize', () => {
    it('should factorize composite numbers', () => {
      const factors = factorize(12);
      // 12 = 2^2 * 3
      assert.strictEqual(factors[2], 2);
      assert.strictEqual(factors[3], 1);
    });

    it('should factorize primes', () => {
      const factors = factorize(7);
      assert.strictEqual(factors[7], 1);
      assert.strictEqual(Object.keys(factors).length, 1);
    });

    it('should handle powers of primes', () => {
      const factors = factorize(32);
      // 32 = 2^5
      assert.strictEqual(factors[2], 5);
      assert.strictEqual(Object.keys(factors).length, 1);
    });

    it('should handle multiple prime factors', () => {
      const factors = factorize(30);
      // 30 = 2 * 3 * 5
      assert.strictEqual(factors[2], 1);
      assert.strictEqual(factors[3], 1);
      assert.strictEqual(factors[5], 1);
    });
  });

  describe('primeSignature', () => {
    it('should create signature from prime array', () => {
      const sig = primeSignature([5, 3, 2]);
      assert.strictEqual(sig, '2,3,5');
    });
  });

  describe('DEFAULT_PRIMES', () => {
    it('should contain first 100 primes', () => {
      assert.strictEqual(DEFAULT_PRIMES.length, 100);
      assert.strictEqual(DEFAULT_PRIMES[0], 2);
      assert.strictEqual(DEFAULT_PRIMES[99], 541);
    });
  });
});

describe('GaussianInteger', () => {
  describe('construction', () => {
    it('should create Gaussian integer', () => {
      const g = new GaussianInteger(3, 4);
      assert.strictEqual(g.real, 3);
      assert.strictEqual(g.imag, 4);
    });
  });

  describe('norm', () => {
    it('should compute norm', () => {
      const g = new GaussianInteger(3, 4);
      assert.strictEqual(g.norm(), 25);
    });
  });

  describe('arithmetic', () => {
    it('should add', () => {
      const a = new GaussianInteger(1, 2);
      const b = new GaussianInteger(3, 4);
      const c = a.add(b);
      assert.strictEqual(c.real, 4);
      assert.strictEqual(c.imag, 6);
    });

    it('should multiply', () => {
      const a = new GaussianInteger(1, 2);
      const b = new GaussianInteger(3, 4);
      const c = a.mul(b);
      // (1+2i)(3+4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
      assert.strictEqual(c.real, -5);
      assert.strictEqual(c.imag, 10);
    });

    it('should conjugate', () => {
      const g = new GaussianInteger(3, 4);
      const c = g.conjugate();
      assert.strictEqual(c.real, 3);
      assert.strictEqual(c.imag, -4);
    });
  });

  describe('primality', () => {
    it('should detect Gaussian primes', () => {
      const g = new GaussianInteger(1, 1);
      assert.strictEqual(typeof g.isGaussianPrime(), 'boolean');
    });
  });

  describe('toString', () => {
    it('should format correctly', () => {
      assert.strictEqual(new GaussianInteger(3, 4).toString(), '3+4i');
      assert.strictEqual(new GaussianInteger(3, -4).toString(), '3-4i');
      assert.strictEqual(new GaussianInteger(3, 0).toString(), '3');
      assert.strictEqual(new GaussianInteger(0, 4).toString(), '4i');
    });
  });
});

describe('EisensteinInteger', () => {
  describe('construction', () => {
    it('should create Eisenstein integer', () => {
      const e = new EisensteinInteger(3, 4);
      assert.strictEqual(e.a, 3);
      assert.strictEqual(e.b, 4);
    });
  });

  describe('norm', () => {
    it('should compute norm', () => {
      const e = new EisensteinInteger(2, 1);
      // Norm = a² - ab + b² = 4 - 2 + 1 = 3
      assert.strictEqual(e.norm(), 3);
    });
  });

  describe('arithmetic', () => {
    it('should add', () => {
      const a = new EisensteinInteger(1, 2);
      const b = new EisensteinInteger(3, 4);
      const c = a.add(b);
      assert.strictEqual(c.a, 4);
      assert.strictEqual(c.b, 6);
    });

    it('should multiply', () => {
      const a = new EisensteinInteger(1, 0);
      const b = new EisensteinInteger(0, 1);
      const c = a.mul(b);
      // Should be omega
      assert.strictEqual(c.a, 0);
      assert.strictEqual(c.b, 1);
    });

    it('should conjugate', () => {
      const e = new EisensteinInteger(3, 4);
      const c = e.conjugate();
      assert.strictEqual(c.a, -1);
      assert.strictEqual(c.b, -4);
    });
  });

  describe('primality', () => {
    it('should detect Eisenstein primes', () => {
      const e = new EisensteinInteger(2, 0);
      assert.strictEqual(typeof e.isEisensteinPrime(), 'boolean');
    });
  });

  describe('toString', () => {
    it('should format correctly', () => {
      assert.strictEqual(new EisensteinInteger(3, 4).toString(), '3+4ω');
      assert.strictEqual(new EisensteinInteger(3, 0).toString(), '3');
      assert.strictEqual(new EisensteinInteger(0, 4).toString(), '4ω');
    });
  });
});

describe('Prime conversions', () => {
  describe('primeToFrequency', () => {
    it('should convert prime to frequency', () => {
      const freq = primeToFrequency(7);
      assert.ok(typeof freq === 'number');
      assert.ok(freq > 1); // Should be base + log(7)/logScale
    });
  });

  describe('primeToAngle', () => {
    it('should convert prime to angle', () => {
      const angle = primeToAngle(7);
      assert.ok(typeof angle === 'number');
      // 360/7 degrees in radians
      assert.ok(Math.abs(angle - (360/7 * Math.PI/180)) < 0.0001);
    });
  });

  describe('sumOfTwoSquares', () => {
    it('should find sum of two squares for p ≡ 1 mod 4', () => {
      const result = sumOfTwoSquares(5);
      // 5 = 1² + 2²
      assert.ok(result !== null);
      const [a, b] = result;
      assert.strictEqual(a * a + b * b, 5);
    });

    it('should return null for p ≡ 3 mod 4', () => {
      const result = sumOfTwoSquares(7);
      assert.strictEqual(result, null);
    });

    it('should handle p = 2', () => {
      const result = sumOfTwoSquares(2);
      assert.deepStrictEqual(result, [1, 1]);
    });
  });
});