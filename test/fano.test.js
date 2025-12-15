/**
 * Tests for Fano plane and multiplication tables
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  FANO_LINES,
  octonionMultiplyIndex,
  sedenionMultiplyIndex,
  multiplyIndices,
  buildMultiplicationTable
} = require('../core/fano');

describe('Fano plane', () => {
  describe('FANO_LINES', () => {
    it('should have 7 lines', () => {
      assert.strictEqual(FANO_LINES.length, 7);
    });

    it('each line should have 3 points', () => {
      for (const line of FANO_LINES) {
        assert.strictEqual(line.length, 3);
      }
    });

    it('points should be in range 1-7', () => {
      for (const line of FANO_LINES) {
        for (const point of line) {
          assert.ok(point >= 1 && point <= 7);
        }
      }
    });
  });
});

describe('Octonion multiplication', () => {
  it('should return identity when multiplying by e0', () => {
    const [k, s] = octonionMultiplyIndex(0, 3);
    assert.strictEqual(k, 3);
    assert.strictEqual(s, 1);
  });

  it('should return identity when e0 is second factor', () => {
    const [k, s] = octonionMultiplyIndex(3, 0);
    assert.strictEqual(k, 3);
    assert.strictEqual(s, 1);
  });

  it('should return -1 for same index', () => {
    const [k, s] = octonionMultiplyIndex(1, 1);
    assert.strictEqual(k, 0);
    assert.strictEqual(s, -1);
  });

  it('should follow Fano plane structure', () => {
    // e1 * e2 = e3
    const [k, s] = octonionMultiplyIndex(1, 2);
    assert.strictEqual(k, 3);
  });

  it('should be antisymmetric for different indices', () => {
    const [k1, s1] = octonionMultiplyIndex(1, 2);
    const [k2, s2] = octonionMultiplyIndex(2, 1);
    assert.strictEqual(k1, k2);
    assert.strictEqual(s1, -s2);
  });
});

describe('Sedenion multiplication', () => {
  it('should return identity when multiplying by e0', () => {
    const [k, s] = sedenionMultiplyIndex(0, 5);
    assert.strictEqual(k, 5);
    assert.strictEqual(s, 1);
  });

  it('should return -1 for same index', () => {
    const [k, s] = sedenionMultiplyIndex(3, 3);
    assert.strictEqual(k, 0);
    assert.strictEqual(s, -1);
  });

  it('should handle octonion range', () => {
    // Should delegate to octonion for indices 0-7
    const [k, s] = sedenionMultiplyIndex(1, 2);
    const [k2, s2] = octonionMultiplyIndex(1, 2);
    assert.strictEqual(k, k2);
    assert.strictEqual(s, s2);
  });

  it('should handle high indices (8-15)', () => {
    const [k, s] = sedenionMultiplyIndex(9, 10);
    assert.ok(k >= 0 && k < 16);
    assert.ok(s === 1 || s === -1);
  });

  it('should handle mixed high/low indices', () => {
    const [k, s] = sedenionMultiplyIndex(3, 10);
    assert.ok(k >= 8 && k < 16);
  });
});

describe('multiplyIndices', () => {
  describe('complex numbers (dim 2)', () => {
    it('should handle identity', () => {
      const [k, s] = multiplyIndices(2, 0, 1);
      assert.strictEqual(k, 1);
      assert.strictEqual(s, 1);
    });

    it('should give i*i = -1', () => {
      const [k, s] = multiplyIndices(2, 1, 1);
      assert.strictEqual(k, 0);
      assert.strictEqual(s, -1);
    });
  });

  describe('quaternions (dim 4)', () => {
    it('should handle identity', () => {
      const [k, s] = multiplyIndices(4, 0, 2);
      assert.strictEqual(k, 2);
      assert.strictEqual(s, 1);
    });

    it('should give i*i = -1', () => {
      const [k, s] = multiplyIndices(4, 1, 1);
      assert.strictEqual(k, 0);
      assert.strictEqual(s, -1);
    });

    it('should satisfy i*j = k', () => {
      const [k, s] = multiplyIndices(4, 1, 2);
      assert.strictEqual(k, 3);
      assert.strictEqual(s, 1);
    });
  });

  describe('octonions (dim 8)', () => {
    it('should delegate to octonion multiplication', () => {
      const [k, s] = multiplyIndices(8, 1, 2);
      assert.ok(k >= 0 && k < 8);
      assert.ok(s === 1 || s === -1);
    });
  });

  describe('sedenions (dim 16)', () => {
    it('should delegate to sedenion multiplication', () => {
      const [k, s] = multiplyIndices(16, 1, 2);
      assert.ok(k >= 0 && k < 16);
      assert.ok(s === 1 || s === -1);
    });
  });

  describe('pathions (dim 32)', () => {
    it('should handle 32-dimensional multiplication', () => {
      const [k, s] = multiplyIndices(32, 5, 10);
      assert.ok(k >= 0 && k < 32);
      assert.ok(s === 1 || s === -1);
    });
  });
});

describe('buildMultiplicationTable', () => {
  it('should build table for complex numbers', () => {
    const table = buildMultiplicationTable(2);
    assert.strictEqual(table.length, 2);
    assert.strictEqual(table[0].length, 2);
  });

  it('should build table for quaternions', () => {
    const table = buildMultiplicationTable(4);
    assert.strictEqual(table.length, 4);
    
    // Verify i*j = k
    const [k, s] = table[1][2];
    assert.strictEqual(k, 3);
    assert.strictEqual(s, 1);
  });

  it('should build table for octonions', () => {
    const table = buildMultiplicationTable(8);
    assert.strictEqual(table.length, 8);
    assert.strictEqual(table[0].length, 8);
  });

  it('table should be consistent with multiplyIndices', () => {
    const table = buildMultiplicationTable(8);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const [k1, s1] = table[i][j];
        const [k2, s2] = multiplyIndices(8, i, j);
        assert.strictEqual(k1, k2);
        assert.strictEqual(s1, s2);
      }
    }
  });

  it('first row should be identity', () => {
    const table = buildMultiplicationTable(8);
    for (let j = 0; j < 8; j++) {
      const [k, s] = table[0][j];
      assert.strictEqual(k, j);
      assert.strictEqual(s, 1);
    }
  });
});