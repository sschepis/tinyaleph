/**
 * Tests for PrimeonZLadderU module
 * Covers ladder creation, evolution, measurement, and metrics
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { 
  PrimeonZLadderU, 
  createPrimeonLadder,
  shannonEntropyNats,
  probsOf,
  normalizeComplex,
  Complex
} = require('../physics');

describe('Complex number operations', () => {
  describe('construction', () => {
    it('should create zero by default', () => {
      const c = new Complex();
      assert.strictEqual(c.re, 0);
      assert.strictEqual(c.im, 0);
    });

    it('should create with real and imaginary parts', () => {
      const c = new Complex(3, 4);
      assert.strictEqual(c.re, 3);
      assert.strictEqual(c.im, 4);
    });
  });

  describe('operations', () => {
    it('should add complex numbers', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const c = Complex.add(a, b);
      assert.strictEqual(c.re, 4);
      assert.strictEqual(c.im, 6);
    });

    it('should subtract complex numbers', () => {
      const a = new Complex(3, 4);
      const b = new Complex(1, 2);
      const c = Complex.sub(a, b);
      assert.strictEqual(c.re, 2);
      assert.strictEqual(c.im, 2);
    });

    it('should multiply complex numbers', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const c = Complex.mul(a, b);
      // (1+2i)(3+4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
      assert.strictEqual(c.re, -5);
      assert.strictEqual(c.im, 10);
    });

    it('should scale complex number', () => {
      const a = new Complex(2, 3);
      const c = Complex.scale(a, 2);
      assert.strictEqual(c.re, 4);
      assert.strictEqual(c.im, 6);
    });

    it('should compute conjugate', () => {
      const a = new Complex(3, 4);
      const c = Complex.conj(a);
      assert.strictEqual(c.re, 3);
      assert.strictEqual(c.im, -4);
    });

    it('should compute squared absolute value', () => {
      const a = new Complex(3, 4);
      const abs2 = Complex.abs2(a);
      assert.strictEqual(abs2, 25); // 3² + 4² = 25
    });

    it('should compute exp(i*theta)', () => {
      const c = Complex.exp(0);
      assert.ok(Math.abs(c.re - 1) < 1e-10);
      assert.ok(Math.abs(c.im) < 1e-10);

      const c2 = Complex.exp(Math.PI / 2);
      assert.ok(Math.abs(c2.re) < 1e-10);
      assert.ok(Math.abs(c2.im - 1) < 1e-10);
    });

    it('should clone', () => {
      const a = new Complex(3, 4);
      const b = a.clone();
      assert.strictEqual(b.re, 3);
      assert.strictEqual(b.im, 4);
      assert.notStrictEqual(a, b);
    });
  });
});

describe('Helper functions', () => {
  describe('shannonEntropyNats', () => {
    it('should return 0 for delta distribution', () => {
      const probs = [1, 0, 0, 0];
      const H = shannonEntropyNats(probs);
      assert.ok(Math.abs(H) < 1e-10);
    });

    it('should return max entropy for uniform distribution', () => {
      const n = 4;
      const probs = Array(n).fill(1 / n);
      const H = shannonEntropyNats(probs);
      const maxH = Math.log(n);
      assert.ok(Math.abs(H - maxH) < 1e-10);
    });

    it('should handle zero probabilities', () => {
      const probs = [0.5, 0, 0.5, 0];
      const H = shannonEntropyNats(probs);
      assert.ok(Math.abs(H - Math.log(2)) < 1e-10);
    });
  });

  describe('probsOf', () => {
    it('should compute normalized probabilities', () => {
      const vec = [new Complex(1, 0), new Complex(0, 1)];
      const probs = probsOf(vec);
      assert.strictEqual(probs.length, 2);
      assert.ok(Math.abs(probs[0] - 0.5) < 1e-10);
      assert.ok(Math.abs(probs[1] - 0.5) < 1e-10);
    });

    it('should sum to 1', () => {
      const vec = [new Complex(1, 2), new Complex(3, 4), new Complex(5, 0)];
      const probs = probsOf(vec);
      const sum = probs.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1) < 1e-10);
    });
  });

  describe('normalizeComplex', () => {
    it('should normalize vector to unit norm', () => {
      const vec = [new Complex(3, 0), new Complex(0, 4)];
      const norm = normalizeComplex(vec);
      assert.ok(Math.abs(norm - 5) < 1e-10);
      
      // Check normalized
      let sum = 0;
      for (const v of vec) sum += Complex.abs2(v);
      assert.ok(Math.abs(sum - 1) < 1e-10);
    });
  });
});

describe('PrimeonZLadderU', () => {
  let ladder;

  beforeEach(() => {
    ladder = new PrimeonZLadderU({
      N: 8,
      d: 1,
      dz: 1,
      J: 0.25,
      leak: 0.05,
      closeZ: true,
      periodic: true
    });
  });

  describe('construction', () => {
    it('should create with specified parameters', () => {
      assert.strictEqual(ladder.N, 8);
      assert.strictEqual(ladder.d, 1);
      assert.strictEqual(ladder.dz, 1);
      assert.strictEqual(ladder.J, 0.25);
      assert.strictEqual(ladder.leak, 0.05);
      assert.strictEqual(ladder.closeZ, true);
      assert.strictEqual(ladder.periodic, true);
    });

    it('should initialize with zero state', () => {
      const m = ladder.metrics();
      // Zero state has uniform zero probs -> handled gracefully
      assert.strictEqual(m.t, 0);
      assert.strictEqual(m.stepCount, 0);
      assert.strictEqual(m.zFlux, 0);
      assert.strictEqual(m.zFluxTotal, 0);
    });

    it('should use defaults for optional params', () => {
      const defaultLadder = new PrimeonZLadderU({ N: 4 });
      assert.strictEqual(defaultLadder.d, 1);
      assert.strictEqual(defaultLadder.dz, 1);
      assert.strictEqual(defaultLadder.J, 0.25);
      assert.strictEqual(defaultLadder.leak, 0.05);
      assert.strictEqual(defaultLadder.closeZ, true);
      assert.strictEqual(defaultLadder.periodic, true);
    });
  });

  describe('excitation', () => {
    it('should excite single rung', () => {
      ladder.exciteRung(0);
      const probs = ladder.rungProbabilities();
      assert.ok(probs[0] > 0.99);
    });

    it('should handle wraparound for rung index', () => {
      ladder.exciteRung(10); // 10 mod 8 = 2
      const probs = ladder.rungProbabilities();
      assert.ok(probs[2] > 0.99);
    });

    it('should excite from primes', () => {
      ladder.excitePrimes([2, 3, 5]);
      const probs = ladder.rungProbabilities();
      // 2 mod 8 = 2, 3 mod 8 = 3, 5 mod 8 = 5
      assert.ok(probs[2] > 0);
      assert.ok(probs[3] > 0);
      assert.ok(probs[5] > 0);
    });

    it('should normalize after excitation', () => {
      ladder.excitePrimes([2, 3, 5, 7, 11, 13], 2.0);
      const probs = ladder.rungProbabilities();
      const sum = probs.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1) < 1e-10);
    });
  });

  describe('reset', () => {
    it('should reset state to zero', () => {
      ladder.exciteRung(0);
      ladder.step(0.01);
      ladder.step(0.01);
      
      ladder.reset();
      
      assert.strictEqual(ladder.t, 0);
      assert.strictEqual(ladder.stepCount, 0);
      assert.strictEqual(ladder.totalZFlux, 0);
      assert.strictEqual(ladder.lastZFlux, 0);
    });
  });

  describe('evolution', () => {
    it('should advance time', () => {
      ladder.exciteRung(0);
      ladder.step(0.01);
      assert.ok(Math.abs(ladder.t - 0.01) < 1e-10);
      assert.strictEqual(ladder.stepCount, 1);
    });

    it('should spread amplitude via hopping', () => {
      ladder.exciteRung(0);
      const probsBefore = [...ladder.rungProbabilities()];
      
      for (let i = 0; i < 50; i++) {
        ladder.step(0.01);
      }
      
      const probsAfter = ladder.rungProbabilities();
      // Should have spread to neighbors
      assert.ok(probsAfter[1] > 0.01);
      assert.ok(probsAfter[0] < probsBefore[0]); // Less localized
    });

    it('should accumulate Z-flux', () => {
      ladder.exciteRung(0);
      for (let i = 0; i < 10; i++) {
        ladder.step(0.01);
      }
      assert.ok(ladder.totalZFlux > 0);
    });

    it('should track last Z-flux per step', () => {
      ladder.exciteRung(0);
      ladder.step(0.01);
      const flux1 = ladder.lastZFlux;
      ladder.step(0.01);
      const flux2 = ladder.lastZFlux;
      // Both should be positive
      assert.ok(flux1 > 0);
      assert.ok(flux2 > 0);
    });

    it('should maintain normalization', () => {
      ladder.exciteRung(0);
      for (let i = 0; i < 100; i++) {
        ladder.step(0.01);
      }
      const probs = ladder.rungProbabilities();
      const sum = probs.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1) < 1e-6);
    });
  });

  describe('run', () => {
    it('should run multiple steps', () => {
      ladder.exciteRung(0);
      const trajectory = ladder.run(100, 0.01);
      assert.strictEqual(trajectory.length, 100);
      assert.strictEqual(ladder.stepCount, 100);
    });

    it('should return metrics for each step', () => {
      ladder.exciteRung(0);
      const trajectory = ladder.run(10, 0.01);
      for (const m of trajectory) {
        assert.ok('t' in m);
        assert.ok('coherence' in m);
        assert.ok('entropy' in m);
        assert.ok('zFlux' in m);
      }
    });
  });

  describe('metrics', () => {
    it('should compute coherence', () => {
      ladder.exciteRung(0);
      const m = ladder.metrics();
      assert.ok(m.coherence > 0.9); // Localized = high coherence
    });

    it('should compute entropy', () => {
      ladder.exciteRung(0);
      const m = ladder.metrics();
      assert.ok(m.entropy < 0.1); // Localized = low entropy
    });

    it('should compute order parameter', () => {
      ladder.exciteRung(0);
      const m = ladder.metrics();
      assert.ok(typeof m.orderParameter === 'number');
    });

    it('should track Z sector metrics', () => {
      ladder.exciteRung(0);
      ladder.run(20, 0.01);
      const m = ladder.metrics();
      assert.ok(typeof m.zEntropy === 'number');
      assert.ok(typeof m.zNorm === 'number');
    });
  });

  describe('measurement', () => {
    it('should sample a rung', () => {
      ladder.excitePrimes([2, 3, 5, 7], 1.0);
      ladder.run(50, 0.01);
      
      const result = ladder.measure();
      assert.ok(result.outcome >= 0 && result.outcome < 8);
      assert.ok(result.probability > 0 && result.probability <= 1);
    });

    it('should collapse to single rung', () => {
      ladder.excitePrimes([2, 3, 5], 1.0);
      ladder.run(30, 0.01);
      
      const result = ladder.measure();
      const probs = ladder.rungProbabilities();
      
      // After collapse, one rung should have probability 1
      assert.ok(Math.abs(probs[result.outcome] - 1) < 1e-10);
    });

    it('should reduce entropy to zero after collapse', () => {
      ladder.excitePrimes([2, 3, 5, 7], 1.0);
      ladder.run(50, 0.01);
      
      const result = ladder.measure();
      assert.ok(Math.abs(result.metricsAfter.entropy) < 1e-10);
      assert.ok(Math.abs(result.metricsAfter.coherence - 1) < 1e-10);
    });
  });

  describe('snapshot and restore', () => {
    it('should capture complete state', () => {
      ladder.exciteRung(0);
      ladder.run(50, 0.01);
      
      const snap = ladder.snapshot();
      
      assert.strictEqual(snap.N, 8);
      assert.strictEqual(snap.stepCount, 50);
      assert.ok(snap.psi.length === 8);
      assert.ok(snap.z.length === 8);
    });

    it('should restore to exact state', () => {
      ladder.exciteRung(0);
      ladder.run(50, 0.01);
      
      const snap = ladder.snapshot();
      const metricsBefore = { ...ladder.metrics() };
      
      ladder.run(100, 0.01); // Evolve further
      ladder.restore(snap);
      
      const metricsAfter = ladder.metrics();
      assert.ok(Math.abs(metricsBefore.coherence - metricsAfter.coherence) < 1e-10);
      assert.ok(Math.abs(metricsBefore.entropy - metricsAfter.entropy) < 1e-10);
    });
  });

  describe('boundary conditions', () => {
    it('should handle periodic boundaries', () => {
      const periodic = new PrimeonZLadderU({ N: 4, periodic: true });
      periodic.exciteRung(0);
      periodic.run(50, 0.01);
      
      const probs = periodic.rungProbabilities();
      // Should spread to rung 3 (periodic neighbor)
      assert.ok(probs[3] > 0.001);
    });

    it('should handle non-periodic boundaries', () => {
      const open = new PrimeonZLadderU({ N: 4, periodic: false });
      open.exciteRung(0);
      open.run(50, 0.01);
      
      const probs = open.rungProbabilities();
      // Rung 3 should have less amplitude (not a neighbor)
      assert.ok(probs[3] < probs[1]);
    });
  });

  describe('closure modes', () => {
    it('should work with closeZ=true', () => {
      const closed = new PrimeonZLadderU({ N: 4, closeZ: true, leak: 0.1 });
      closed.exciteRung(0);
      closed.run(50, 0.01);
      
      const m = closed.metrics();
      assert.ok(m.zFluxTotal > 0);
    });

    it('should work with closeZ=false', () => {
      const open = new PrimeonZLadderU({ N: 4, closeZ: false, leak: 0.1 });
      open.exciteRung(0);
      open.run(50, 0.01);
      
      const m = open.metrics();
      assert.ok(m.zFluxTotal > 0);
      assert.ok(m.zNorm > 0); // Z sector has accumulated
    });
  });
});

describe('createPrimeonLadder factory', () => {
  it('should create ladder with prime excitations', () => {
    const primes = [2, 3, 5, 7];
    const ladder = createPrimeonLadder(primes);
    
    const probs = ladder.rungProbabilities();
    // At least some of these rungs should be excited
    assert.ok(probs[2] > 0 || probs[3] > 0 || probs[5] > 0 || probs[7] > 0);
  });

  it('should auto-size ladder to fit primes', () => {
    const primes = [41, 43, 47];
    const ladder = createPrimeonLadder(primes);
    
    assert.ok(ladder.N >= 48);
  });

  it('should respect custom options', () => {
    const ladder = createPrimeonLadder([2, 3], {
      N: 32,
      J: 0.5,
      leak: 0.1,
      closeZ: false
    });
    
    assert.strictEqual(ladder.N, 32);
    assert.strictEqual(ladder.J, 0.5);
    assert.strictEqual(ladder.leak, 0.1);
    assert.strictEqual(ladder.closeZ, false);
  });

  it('should handle empty prime list', () => {
    const ladder = createPrimeonLadder([]);
    assert.ok(ladder.N >= 16);
    
    // No excitations, should be all zeros
    const probs = ladder.rungProbabilities();
    // After normalization of zero vector, gets uniform
    assert.ok(probs.every(p => !isNaN(p)));
  });
});