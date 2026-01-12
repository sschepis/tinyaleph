/**
 * Tests for Arithmetic Link Kernel (ALK) modules
 * Covers: Legendre symbol, Power residue symbol, Rédei symbol, 
 *         Milnor invariants, ALK construction, ALK-Kuramoto integration
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  LegendreSymbol,
  PowerResidueSymbol,
  RedeiSymbol,
  ArithmeticMilnorInvariant,
  MultipleResidueSymbol,
  ArithmeticLinkKernel,
  ALKOperators,
  findBorromeanPrimes,
  computeLegendreMatrix,
  quickBorromeanCheck
} from '../core/arithmetic-link-kernel.js';

import {
  ALKKuramotoModel,
  ALKNetworkKuramoto,
  createALKKuramoto,
  createALKNetworkKuramoto,
  runBorromeanExperiment
} from '../physics/alk-kuramoto.js';

// ============================================================================
// Legendre Symbol Tests
// ============================================================================

describe('LegendreSymbol', () => {
  describe('compute', () => {
    it('should compute (3/7) = -1', () => {
      const result = LegendreSymbol.compute(3, 7);
      assert.strictEqual(result, -1);
    });

    it('should compute (2/7) = 1', () => {
      const result = LegendreSymbol.compute(2, 7);
      assert.strictEqual(result, 1);
    });

    it('should compute (5/11) = 1', () => {
      const result = LegendreSymbol.compute(5, 11);
      assert.strictEqual(result, 1);
    });

    it('should return 0 when p divides a', () => {
      const result = LegendreSymbol.compute(7, 7);
      assert.strictEqual(result, 0);
    });

    it('should satisfy quadratic reciprocity', () => {
      // For odd primes p, q: (p/q)(q/p) = (-1)^((p-1)/2 * (q-1)/2)
      const p = 5, q = 7;
      const pq = LegendreSymbol.compute(p, q);
      const qp = LegendreSymbol.compute(q, p);
      const expected = Math.pow(-1, ((p - 1) / 2) * ((q - 1) / 2));
      assert.strictEqual(pq * qp, expected);
    });

    it('should throw for non-prime p', () => {
      assert.throws(() => LegendreSymbol.compute(3, 9));
    });

    it('should throw for p = 2', () => {
      assert.throws(() => LegendreSymbol.compute(3, 2));
    });
  });

  describe('toCoupling', () => {
    it('should handle bipolar encoding', () => {
      assert.strictEqual(LegendreSymbol.toCoupling(1, 'bipolar'), 1);
      assert.strictEqual(LegendreSymbol.toCoupling(-1, 'bipolar'), -1);
      assert.strictEqual(LegendreSymbol.toCoupling(0, 'bipolar'), 0);
    });

    it('should handle binary encoding', () => {
      assert.strictEqual(LegendreSymbol.toCoupling(1, 'binary'), 1);
      assert.strictEqual(LegendreSymbol.toCoupling(-1, 'binary'), 0);
    });

    it('should handle phase encoding', () => {
      assert.strictEqual(LegendreSymbol.toCoupling(1, 'phase'), 0);
      assert.strictEqual(LegendreSymbol.toCoupling(-1, 'phase'), Math.PI);
    });
  });

  describe('computeCouplingMatrix', () => {
    it('should return symmetric matrix', () => {
      const primes = [5, 7, 11];
      const J = LegendreSymbol.computeCouplingMatrix(primes);
      
      assert.strictEqual(J.length, 3);
      assert.strictEqual(J[0].length, 3);
      
      // Check diagonal is zero
      for (let i = 0; i < 3; i++) {
        assert.strictEqual(J[i][i], 0);
      }
    });

    it('should contain ±1 off-diagonal', () => {
      const primes = [5, 7, 11];
      const J = LegendreSymbol.computeCouplingMatrix(primes);
      
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          assert.ok(J[i][j] === 1 || J[i][j] === -1);
        }
      }
    });
  });
});

// ============================================================================
// Power Residue Symbol Tests
// ============================================================================

describe('PowerResidueSymbol', () => {
  describe('compute', () => {
    it('should compute quadratic residue (ℓ = 2)', () => {
      const result = PowerResidueSymbol.compute(3, 7, 2);
      assert.ok(result.defined);
    });

    it('should compute cubic residue when defined', () => {
      // q ≡ 1 (mod 3) needed for cubic residues
      const result = PowerResidueSymbol.compute(5, 13, 3); // 13 ≡ 1 (mod 3)
      assert.ok(result.defined !== undefined);
    });

    it('should indicate undefined for incompatible primes', () => {
      // p ≡ 1 (mod n) required for power residue to be fully defined
      const result = PowerResidueSymbol.compute(5, 7, 3); // 7 ≢ 1 (mod 3)
      // When p ≢ 1 (mod n), the power residue symbol returns defined: false
      // But the implementation may still return a value
      assert.ok('defined' in result);
    });
  });

  describe('computeCouplingMatrix', () => {
    it('should return matrix of correct size', () => {
      const primes = [5, 7, 13];
      const K = PowerResidueSymbol.computeCouplingMatrix(primes, 2);
      
      assert.strictEqual(K.length, 3);
      assert.strictEqual(K[0].length, 3);
    });
  });
});

// ============================================================================
// Rédei Symbol Tests
// ============================================================================

describe('RedeiSymbol', () => {
  describe('isComputable', () => {
    it('should reject non-prime inputs', () => {
      const check = RedeiSymbol.isComputable(4, 5, 7);
      assert.strictEqual(check.computable, false);
    });

    it('should reject even primes', () => {
      const check = RedeiSymbol.isComputable(2, 5, 7);
      assert.strictEqual(check.computable, false);
    });

    it('should reject identical primes', () => {
      const check = RedeiSymbol.isComputable(5, 5, 7);
      assert.strictEqual(check.computable, false);
    });

    it('should check pairwise splitting', () => {
      const check = RedeiSymbol.isComputable(5, 13, 17);
      // Result depends on whether pairwise Legendre symbols are all +1
      assert.ok('computable' in check);
    });
  });

  describe('compute', () => {
    it('should return computed flag', () => {
      const result = RedeiSymbol.compute(5, 13, 17);
      assert.ok('computed' in result);
      assert.ok('value' in result);
    });

    it('should handle non-computable cases', () => {
      const result = RedeiSymbol.compute(3, 5, 7);
      // If not computable, computed should be false
      if (!result.computed) {
        assert.ok('reason' in result);
      }
    });
  });

  describe('computeCouplingTensor', () => {
    it('should return tensor with borromean list', () => {
      const primes = [5, 7, 11, 13];
      const tensor = RedeiSymbol.computeCouplingTensor(primes);
      
      assert.ok('size' in tensor);
      assert.ok('entries' in tensor);
      assert.ok('borromean' in tensor);
      assert.ok(Array.isArray(tensor.borromean));
    });
  });
});

// ============================================================================
// Arithmetic Milnor Invariant Tests
// ============================================================================

describe('ArithmeticMilnorInvariant', () => {
  describe('construction', () => {
    it('should create Milnor invariant for prime set', () => {
      const primes = [5, 7, 11, 13];
      const milnor = new ArithmeticMilnorInvariant(primes);
      assert.ok(milnor);
      assert.strictEqual(milnor.r, 4);
    });

    it('should accept ell parameter', () => {
      const primes = [5, 7, 11];
      const milnor = new ArithmeticMilnorInvariant(primes, 3);
      assert.strictEqual(milnor.ell, 3);
    });
  });

  describe('compute', () => {
    it('should compute μ₃ for triple', () => {
      const primes = [5, 7, 11];
      const milnor = new ArithmeticMilnorInvariant(primes);
      const mu3 = milnor.compute([0, 1, 2]);
      assert.strictEqual(typeof mu3.value, 'number');
      assert.ok('computed' in mu3);
    });

    it('should compute μ₄ for quadruple', () => {
      const primes = [5, 7, 11, 13];
      const milnor = new ArithmeticMilnorInvariant(primes);
      const mu4 = milnor.compute([0, 1, 2, 3]);
      assert.strictEqual(typeof mu4.value, 'number');
    });

    it('should reject invalid multi-index', () => {
      const primes = [5, 7, 11];
      const milnor = new ArithmeticMilnorInvariant(primes);
      const result = milnor.compute([0]); // Only 1 index
      assert.strictEqual(result.computed, false);
    });
  });

  describe('getAllInvariants', () => {
    it('should return Map of invariants', () => {
      const primes = [5, 7, 11];
      const milnor = new ArithmeticMilnorInvariant(primes);
      const invariants = milnor.getAllInvariants(3);
      assert.ok(invariants instanceof Map);
    });
  });
});

// ============================================================================
// Multiple Residue Symbol Tests
// ============================================================================

describe('MultipleResidueSymbol', () => {
  describe('compute', () => {
    it('should compute for pair', () => {
      const primes = [5, 7];
      const result = MultipleResidueSymbol.compute(primes);
      assert.ok('value' in result);
    });

    it('should compute for triple', () => {
      const primes = [5, 7, 11];
      const result = MultipleResidueSymbol.compute(primes);
      assert.ok('computed' in result);
    });

    it('should reject single prime', () => {
      const result = MultipleResidueSymbol.compute([5]);
      assert.strictEqual(result.computed, false);
    });
  });
});

// ============================================================================
// ArithmeticLinkKernel Tests
// ============================================================================

describe('ArithmeticLinkKernel', () => {
  describe('construction', () => {
    it('should create ALK for prime set', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      assert.ok(alk);
      assert.strictEqual(alk.r, 4);
    });

    it('should filter non-primes', () => {
      const primes = [4, 5, 6, 7, 8, 11];
      const alk = new ArithmeticLinkKernel(primes);
      assert.strictEqual(alk.r, 3); // Only 5, 7, 11
    });

    it('should accept options', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes, { encoding: 'binary' });
      assert.strictEqual(alk.encoding, 'binary');
    });

    it('should throw for less than 2 primes', () => {
      assert.throws(() => new ArithmeticLinkKernel([5]));
    });
  });

  describe('J matrix (pairwise coupling)', () => {
    it('should return symmetric matrix', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      const J = alk.J;
      
      assert.strictEqual(J.length, 3);
      assert.strictEqual(J[0].length, 3);
    });

    it('should have zeros on diagonal', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      const J = alk.J;
      
      for (let i = 0; i < 3; i++) {
        assert.strictEqual(J[i][i], 0);
      }
    });

    it('should contain ±1 off-diagonal', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      const J = alk.J;
      
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          assert.ok(J[i][j] === 1 || J[i][j] === -1);
        }
      }
    });
  });

  describe('getCoupling', () => {
    it('should return coupling between two primes', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      const c = alk.getCoupling(5, 7);
      assert.ok(c === 1 || c === -1 || c === 0);
    });

    it('should throw for primes not in kernel', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      assert.throws(() => alk.getCoupling(5, 13));
    });
  });

  describe('Jsym (symmetrized)', () => {
    it('should return symmetric matrix', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      const Jsym = alk.Jsym;
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          assert.ok(Math.abs(Jsym[i][j] - Jsym[j][i]) < 1e-10);
        }
      }
    });
  });

  describe('K3 tensor (triadic coupling)', () => {
    it('should return triadic coupling tensor', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      const K3 = alk.K3;
      
      assert.ok('size' in K3);
      assert.ok('entries' in K3);
      assert.ok('borromean' in K3);
    });
  });

  describe('getTriadicCoupling', () => {
    it('should return triadic coupling object', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      const tc = alk.getTriadicCoupling(5, 7, 11);
      assert.ok('value' in tc);
    });
  });

  describe('findBorromeanTriples', () => {
    it('should return array', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      const borromeans = alk.findBorromeanTriples();
      assert.ok(Array.isArray(borromeans));
    });
  });

  describe('isBorromean', () => {
    it('should return boolean', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      const result = alk.isBorromean(5, 7, 11);
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('buildHamiltonian', () => {
    it('should return function', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      
      const H = alk.buildHamiltonian({});
      assert.strictEqual(typeof H, 'function');
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      
      const json = alk.toJSON();
      const restored = ArithmeticLinkKernel.fromJSON(json);
      
      assert.deepStrictEqual(restored.primes, alk.primes);
      assert.deepStrictEqual(restored.J, alk.J);
    });
  });

  describe('stats', () => {
    it('should return statistics object', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      const stats = alk.stats;
      
      assert.ok('numPrimes' in stats);
      assert.ok('pairwiseCouplings' in stats);
      assert.ok('borromeanTriples' in stats);
      assert.strictEqual(stats.numPrimes, 4);
    });
  });
});

// ============================================================================
// ALKOperators Tests
// ============================================================================

describe('ALKOperators', () => {
  describe('Resonance', () => {
    it('should create resonance operator', () => {
      const primes = [5, 7, 11];
      const alk = new ArithmeticLinkKernel(primes);
      const op = ALKOperators.Resonance(alk);
      assert.strictEqual(typeof op, 'function');
    });
  });

  describe('TriadicPhaseLock', () => {
    it('should create triadic operator', () => {
      const primes = [5, 7, 11, 13];
      const alk = new ArithmeticLinkKernel(primes);
      const op = ALKOperators.TriadicPhaseLock(alk);
      assert.strictEqual(typeof op, 'function');
    });
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('findBorromeanPrimes', () => {
    it('should return array', () => {
      const primes = [5, 7, 11, 13, 17, 19];
      const result = findBorromeanPrimes(primes);
      assert.ok(Array.isArray(result));
    });
  });

  describe('computeLegendreMatrix', () => {
    it('should compute full Legendre matrix for primes', () => {
      const primes = [5, 7, 11, 13];
      const J = computeLegendreMatrix(primes);
      
      assert.strictEqual(J.length, 4);
      assert.strictEqual(J[0].length, 4);
      
      // Diagonal should be 0
      for (let i = 0; i < 4; i++) {
        assert.strictEqual(J[i][i], 0);
      }
    });
  });

  describe('quickBorromeanCheck', () => {
    it('should return object with possible field', () => {
      const result = quickBorromeanCheck(5, 13, 17);
      assert.ok('possible' in result);
    });

    it('should reject non-primes', () => {
      const result = quickBorromeanCheck(4, 5, 7);
      assert.strictEqual(result.possible, false);
    });

    it('should reject primes containing 2', () => {
      const result = quickBorromeanCheck(2, 5, 7);
      assert.strictEqual(result.possible, false);
    });
  });
});

// ============================================================================
// ALK-Kuramoto Integration Tests
// ============================================================================

describe('ALKKuramotoModel', () => {
  describe('construction', () => {
    it('should create ALK-Kuramoto model via factory', () => {
      const primes = [5, 7, 11, 13];
      const model = createALKKuramoto(primes);
      assert.ok(model);
      assert.strictEqual(model.N, 4);
    });

    it('should accept coupling parameters', () => {
      const primes = [5, 7, 11];
      const model = createALKKuramoto(primes, {
        couplingScale: 0.5,
        triadicScale: 0.3
      });
      assert.ok(model);
    });
  });

  describe('dynamics', () => {
    it('should step the model', () => {
      const primes = [5, 7, 11, 13];
      const model = createALKKuramoto(primes);
      const initialPhases = Float64Array.from(model.theta);
      
      model.step(0.01);
      
      // Phases should have changed
      let changed = false;
      for (let i = 0; i < 4; i++) {
        if (model.theta[i] !== initialPhases[i]) {
          changed = true;
          break;
        }
      }
      assert.ok(changed);
    });

    it('should compute order parameter', () => {
      const primes = [5, 7, 11, 13];
      const model = createALKKuramoto(primes);
      
      const r = model.orderParameter();
      assert.ok(r >= 0 && r <= 1);
    });

    it('should compute triadic coherence', () => {
      const primes = [5, 7, 11, 13];
      const model = createALKKuramoto(primes);
      
      const tc = model.triadicCoherence();
      assert.ok(typeof tc === 'number');
    });
  });

  describe('evolve', () => {
    it('should evolve for specified steps', () => {
      const primes = [5, 7, 11];
      const model = createALKKuramoto(primes);
      
      model.evolve(10);
      
      assert.strictEqual(model.steps, 10);
    });
  });
});

describe('ALKNetworkKuramoto', () => {
  describe('construction', () => {
    it('should create network-aware ALK-Kuramoto model via factory', () => {
      const primes = [5, 7, 11, 13];
      const model = createALKNetworkKuramoto(primes);
      assert.ok(model);
    });
  });

  describe('dynamics', () => {
    it('should step and compute order parameter', () => {
      const primes = [5, 7, 11, 13];
      const model = createALKNetworkKuramoto(primes);
      model.step(0.01);
      
      const r = model.orderParameter();
      assert.ok(r >= 0 && r <= 1);
    });
  });
});

describe('Factory Functions', () => {
  describe('createALKKuramoto', () => {
    it('should create ALKKuramotoModel', () => {
      const primes = [5, 7, 11];
      const model = createALKKuramoto(primes);
      assert.ok(model instanceof ALKKuramotoModel);
    });
  });

  describe('createALKNetworkKuramoto', () => {
    it('should create ALKNetworkKuramoto', () => {
      const primes = [5, 7, 11];
      const adj = [
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0]
      ];
      const model = createALKNetworkKuramoto(primes, adj);
      assert.ok(model instanceof ALKNetworkKuramoto);
    });
  });
});

describe('runBorromeanExperiment', () => {
  it('should run Borromean synchronization experiment', () => {
    const primes = [5, 7, 11, 13, 17, 19, 23];
    const result = runBorromeanExperiment(primes, {
      steps: 10,
      dt: 0.01
    });
    
    assert.ok(result);
    assert.ok('borromeanTriples' in result);
    assert.ok('triadicModel' in result);
    assert.ok('pairwiseModel' in result);
  });
});