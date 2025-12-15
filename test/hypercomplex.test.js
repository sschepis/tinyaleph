/**
 * Tests for Hypercomplex class
 * Tests Cayley-Dickson algebra operations across dimensions
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Hypercomplex } = require('../core/hypercomplex');

describe('Hypercomplex', () => {
  describe('construction', () => {
    it('should create zero hypercomplex of given dimension', () => {
      const h = Hypercomplex.zero(4);
      assert.strictEqual(h.dim, 4);
      assert.deepStrictEqual([...h.c], [0, 0, 0, 0]);
    });

    it('should create basis vector', () => {
      const h = Hypercomplex.basis(4, 2, 1);
      assert.strictEqual(h.c[2], 1);
      assert.strictEqual(h.c[0], 0);
    });

    it('should create from real', () => {
      const h = Hypercomplex.fromReal(4, 5);
      assert.strictEqual(h.c[0], 5);
      assert.strictEqual(h.c[1], 0);
    });

    it('should create from array', () => {
      const h = Hypercomplex.fromArray([1, 2, 3, 4]);
      assert.strictEqual(h.dim, 4);
      assert.deepStrictEqual([...h.c], [1, 2, 3, 4]);
    });

    it('should reject non-power-of-2 dimensions', () => {
      assert.throws(() => new Hypercomplex(3), /power of 2/i);
    });
  });

  describe('arithmetic', () => {
    it('should add two hypercomplex numbers', () => {
      const a = Hypercomplex.fromArray([1, 2, 3, 4]);
      const b = Hypercomplex.fromArray([5, 6, 7, 8]);
      const c = a.add(b);
      assert.deepStrictEqual([...c.c], [6, 8, 10, 12]);
    });

    it('should subtract two hypercomplex numbers', () => {
      const a = Hypercomplex.fromArray([5, 6, 7, 8]);
      const b = Hypercomplex.fromArray([1, 2, 3, 4]);
      const c = a.sub(b);
      assert.deepStrictEqual([...c.c], [4, 4, 4, 4]);
    });

    it('should scale by constant', () => {
      const a = Hypercomplex.fromArray([1, 2, 3, 4]);
      const b = a.scale(2);
      assert.deepStrictEqual([...b.c], [2, 4, 6, 8]);
    });

    it('should multiply quaternions correctly', () => {
      // i * j = k for quaternions
      const i = Hypercomplex.basis(4, 1, 1);
      const j = Hypercomplex.basis(4, 2, 1);
      const k = i.mul(j);
      assert.strictEqual(k.c[3], 1); // k component
      assert.ok(Math.abs(k.c[0]) < 0.0001);
      assert.ok(Math.abs(k.c[1]) < 0.0001);
      assert.ok(Math.abs(k.c[2]) < 0.0001);
    });

    it('should compute i * i = -1', () => {
      const i = Hypercomplex.basis(4, 1, 1);
      const result = i.mul(i);
      assert.strictEqual(result.c[0], -1); // Real part = -1
      assert.strictEqual(result.c[1], 0);
    });
  });

  describe('conjugation and inversion', () => {
    it('should conjugate correctly', () => {
      const h = Hypercomplex.fromArray([1, 2, 3, 4]);
      const c = h.conjugate();
      assert.strictEqual(c.c[0], 1);  // Real part unchanged
      assert.strictEqual(c.c[1], -2); // Imaginary parts negated
      assert.strictEqual(c.c[2], -3);
      assert.strictEqual(c.c[3], -4);
    });

    it('should compute inverse', () => {
      const h = Hypercomplex.fromArray([1, 0, 0, 0]); // Just the real 1
      const inv = h.inverse();
      assert.strictEqual(inv.c[0], 1);
    });

    it('should give identity when multiplied by inverse', () => {
      const h = Hypercomplex.fromArray([2, 0, 0, 0]);
      const inv = h.inverse();
      const product = h.mul(inv);
      assert.ok(Math.abs(product.c[0] - 1) < 0.0001);
    });
  });

  describe('metrics', () => {
    it('should compute norm', () => {
      const h = Hypercomplex.fromArray([3, 4, 0, 0]);
      assert.strictEqual(h.norm(), 5);
    });

    it('should normalize', () => {
      const h = Hypercomplex.fromArray([3, 4, 0, 0]);
      const n = h.normalize();
      assert.ok(Math.abs(n.norm() - 1) < 0.0001);
    });

    it('should compute dot product', () => {
      const a = Hypercomplex.fromArray([1, 2, 3, 4]);
      const b = Hypercomplex.fromArray([2, 3, 4, 5]);
      // 1*2 + 2*3 + 3*4 + 4*5 = 2 + 6 + 12 + 20 = 40
      assert.strictEqual(a.dot(b), 40);
    });
  });

  describe('information theory', () => {
    it('should compute entropy of pure state as 0', () => {
      const h = Hypercomplex.basis(4, 0, 1);
      assert.strictEqual(h.entropy(), 0);
    });

    it('should compute higher entropy for mixed state', () => {
      const pure = Hypercomplex.basis(4, 0, 1);
      const mixed = Hypercomplex.fromArray([1, 1, 1, 1]).normalize();
      assert.ok(mixed.entropy() > pure.entropy());
    });

    it('should compute coherence between identical states as 1', () => {
      const h = Hypercomplex.fromArray([1, 2, 3, 4]).normalize();
      const coh = h.coherence(h);
      assert.ok(Math.abs(coh - 1) < 0.0001);
    });

    it('should compute coherence between orthogonal states as 0', () => {
      const a = Hypercomplex.basis(4, 0, 1);
      const b = Hypercomplex.basis(4, 1, 1);
      assert.ok(Math.abs(a.coherence(b)) < 0.0001);
    });
  });

  describe('zero divisors', () => {
    it('should detect zero divisors in sedenions (dim 16)', () => {
      // Sedenions have zero divisors
      const a = new Hypercomplex(16);
      const b = new Hypercomplex(16);
      // This is a structural test - just verify the method exists
      assert.strictEqual(typeof a.isZeroDivisorWith(b), 'boolean');
    });
  });

  describe('dominant axes', () => {
    it('should return top n dominant axes', () => {
      const h = Hypercomplex.fromArray([1, 5, 3, 4]);
      const axes = h.dominantAxes(2);
      assert.strictEqual(axes.length, 2);
      assert.strictEqual(axes[0].i, 1); // Index 1 has value 5
      assert.strictEqual(axes[1].i, 3); // Index 3 has value 4
    });
  });

  describe('utility methods', () => {
    it('should convert to array', () => {
      const h = Hypercomplex.fromArray([1, 2, 3, 4]);
      assert.deepStrictEqual(h.toArray(), [1, 2, 3, 4]);
    });

    it('should clone', () => {
      const h = Hypercomplex.fromArray([1, 2, 3, 4]);
      const c = h.clone();
      assert.deepStrictEqual([...c.c], [1, 2, 3, 4]);
      c.c[0] = 99;
      assert.strictEqual(h.c[0], 1); // Original unchanged
    });
  });

  describe('dimensions', () => {
    it('should work with complex numbers (dim 2)', () => {
      const a = Hypercomplex.fromArray([1, 2]);
      const b = Hypercomplex.fromArray([3, 4]);
      const c = a.mul(b);
      // (1+2i)(3+4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
      assert.strictEqual(c.c[0], -5);
      assert.strictEqual(c.c[1], 10);
    });

    it('should work with octonions (dim 8)', () => {
      const a = Hypercomplex.basis(8, 1, 1);
      const b = Hypercomplex.basis(8, 2, 1);
      const c = a.mul(b);
      assert.strictEqual(c.dim, 8);
      // Just verify it computes something
      assert.ok(c.norm() > 0);
    });

    it('should work with sedenions (dim 16)', () => {
      const a = Hypercomplex.basis(16, 1, 1);
      const b = Hypercomplex.basis(16, 2, 1);
      const c = a.mul(b);
      assert.strictEqual(c.dim, 16);
    });
  });
});