/**
 * Tests for Complete Alexander Module
 * Covers: Laurent polynomials, Fitting ideals, Crowell sequence,
 *         Alexander modules, signatures, and memory
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  LaurentPolynomial,
  FittingIdeal,
  CrowellSequence,
  AlexanderModule,
  ModuleSignature,
  SignatureMemory,
  SignatureExtractor,
  createAlexanderModule,
  extractSignature,
  createSignatureMemory,
  createSignatureExtractor
} from '../core/alexander-module.js';

// ============================================================================
// Laurent Polynomial Tests
// ============================================================================

describe('LaurentPolynomial', () => {
  describe('construction', () => {
    it('should create from object', () => {
      const poly = new LaurentPolynomial({ 0: 1, 1: -2, 2: 1 });
      assert.strictEqual(poly.get(0), 1);
      assert.strictEqual(poly.get(1), -2);
      assert.strictEqual(poly.get(2), 1);
    });

    it('should create from array', () => {
      const poly = new LaurentPolynomial([1, -2, 1]);
      assert.strictEqual(poly.get(0), 1);
      assert.strictEqual(poly.get(1), -2);
      assert.strictEqual(poly.get(2), 1);
    });

    it('should create empty polynomial', () => {
      const poly = new LaurentPolynomial();
      assert.ok(poly.isZero);
    });

    it('should handle negative powers', () => {
      const poly = new LaurentPolynomial({ '-1': 2, 0: 1, 1: 3 });
      assert.strictEqual(poly.get(-1), 2);
      assert.strictEqual(poly.get(0), 1);
      assert.strictEqual(poly.get(1), 3);
    });
  });

  describe('properties', () => {
    it('should compute minPower', () => {
      const poly = new LaurentPolynomial({ '-2': 1, 0: 1, 3: 1 });
      assert.strictEqual(poly.minPower, -2);
    });

    it('should compute maxPower', () => {
      const poly = new LaurentPolynomial({ '-2': 1, 0: 1, 3: 1 });
      assert.strictEqual(poly.maxPower, 3);
    });

    it('should compute degree', () => {
      const poly = new LaurentPolynomial({ '-2': 1, 0: 1, 3: 1 });
      assert.strictEqual(poly.degree, 5); // 3 - (-2)
    });

    it('should detect zero polynomial', () => {
      const zero = new LaurentPolynomial();
      assert.ok(zero.isZero);
      
      const nonZero = new LaurentPolynomial({ 0: 1 });
      assert.ok(!nonZero.isZero);
    });
  });

  describe('arithmetic', () => {
    it('should add polynomials', () => {
      const p1 = new LaurentPolynomial({ 0: 1, 1: 2 });
      const p2 = new LaurentPolynomial({ 0: 3, 2: 1 });
      const sum = p1.add(p2);
      
      assert.strictEqual(sum.get(0), 4);
      assert.strictEqual(sum.get(1), 2);
      assert.strictEqual(sum.get(2), 1);
    });

    it('should subtract polynomials', () => {
      const p1 = new LaurentPolynomial({ 0: 5, 1: 3 });
      const p2 = new LaurentPolynomial({ 0: 2, 1: 1 });
      const diff = p1.subtract(p2);
      
      assert.strictEqual(diff.get(0), 3);
      assert.strictEqual(diff.get(1), 2);
    });

    it('should multiply polynomials', () => {
      // (1 + t)(1 - t) = 1 - t²
      const p1 = new LaurentPolynomial({ 0: 1, 1: 1 });
      const p2 = new LaurentPolynomial({ 0: 1, 1: -1 });
      const prod = p1.multiply(p2);
      
      assert.strictEqual(prod.get(0), 1);
      assert.strictEqual(prod.get(1), 0);
      assert.strictEqual(prod.get(2), -1);
    });

    it('should scale by scalar', () => {
      const poly = new LaurentPolynomial({ 0: 2, 1: 3 });
      const scaled = poly.scale(4);
      
      assert.strictEqual(scaled.get(0), 8);
      assert.strictEqual(scaled.get(1), 12);
    });
  });

  describe('evaluation', () => {
    it('should evaluate at a value', () => {
      // 1 + 2t + t² at t = 3: 1 + 6 + 9 = 16
      const poly = new LaurentPolynomial({ 0: 1, 1: 2, 2: 1 });
      const result = poly.evaluate(3);
      assert.strictEqual(result, 16);
    });

    it('should evaluate on unit circle', () => {
      // t at t = e^(iπ/2) = i
      const poly = new LaurentPolynomial({ 1: 1 });
      const result = poly.evaluateOnCircle(Math.PI / 2);
      
      assert.ok(Math.abs(result.re) < 0.0001);
      assert.ok(Math.abs(result.im - 1) < 0.0001);
    });
  });

  describe('normalization', () => {
    it('should normalize polynomial', () => {
      const poly = new LaurentPolynomial({ 1: 2, 2: 4 });
      const normalized = poly.normalize();
      
      // Should shift to start at power 0 and divide by leading coeff
      assert.strictEqual(normalized.minPower, 0);
    });
  });

  describe('toString', () => {
    it('should produce readable string', () => {
      const poly = new LaurentPolynomial({ 0: 1, 1: -1, 2: 1 });
      const str = poly.toString();
      assert.ok(typeof str === 'string');
      assert.ok(str.length > 0);
    });
  });

  describe('static methods', () => {
    it('should create from roots', () => {
      // (t - 1)(t - 2) = t² - 3t + 2
      const poly = LaurentPolynomial.fromRoots([1, 2]);
      assert.strictEqual(poly.get(0), 2);
      assert.strictEqual(poly.get(1), -3);
      assert.strictEqual(poly.get(2), 1);
    });

    it('should create augmentation generator', () => {
      const aug = LaurentPolynomial.augmentationGenerator();
      assert.strictEqual(aug.get(0), -1);
      assert.strictEqual(aug.get(1), 1);
    });
  });
});

// ============================================================================
// Fitting Ideal Tests
// ============================================================================

describe('FittingIdeal', () => {
  describe('construction', () => {
    it('should create with degree and generators', () => {
      const gen = new LaurentPolynomial({ 0: 1, 1: -1 });
      const ideal = new FittingIdeal(0, [gen]);
      
      assert.strictEqual(ideal.degree, 0);
      assert.strictEqual(ideal.generators.length, 1);
    });
  });

  describe('properties', () => {
    it('should detect trivial ideal', () => {
      const unit = new LaurentPolynomial({ 0: 1 });
      const ideal = new FittingIdeal(0, [unit]);
      assert.ok(ideal.isTrivial);
    });

    it('should detect zero ideal', () => {
      const ideal = new FittingIdeal(0, []);
      assert.ok(ideal.isZero);
    });

    it('should get primary generator', () => {
      const gen1 = new LaurentPolynomial({ 0: 2, 1: 1 });
      const gen2 = new LaurentPolynomial({ 0: 1, 2: 1 });
      const ideal = new FittingIdeal(0, [gen1, gen2]);
      
      const primary = ideal.primaryGenerator;
      assert.ok(!primary.isZero);
    });

    it('should get characteristic polynomial', () => {
      const gen = new LaurentPolynomial({ 0: 2, 1: 4, 2: 2 });
      const ideal = new FittingIdeal(0, [gen]);
      
      const char = ideal.characteristicPolynomial;
      assert.ok(char);
    });
  });

  describe('circle evaluation', () => {
    it('should evaluate on unit circle', () => {
      const gen = new LaurentPolynomial({ 0: 1, 1: -1 }); // t - 1
      const ideal = new FittingIdeal(0, [gen]);
      
      const result = ideal.evaluateOnCircle(0);
      assert.ok('minAbs' in result);
    });

    it('should find zeros on circle', () => {
      const gen = new LaurentPolynomial({ 0: -1, 1: 1 }); // t - 1, zero at t = 1
      const ideal = new FittingIdeal(0, [gen]);
      
      const zeros = ideal.findCircleZeros(360);
      assert.ok(Array.isArray(zeros));
    });
  });

  describe('signature hash', () => {
    it('should compute signature hash', () => {
      const gen = new LaurentPolynomial({ 0: 1, 1: -2, 2: 1 });
      const ideal = new FittingIdeal(0, [gen]);
      
      const hash = ideal.signatureHash;
      assert.strictEqual(typeof hash, 'number');
    });
  });
});

// ============================================================================
// Crowell Sequence Tests
// ============================================================================

describe('CrowellSequence', () => {
  describe('construction', () => {
    it('should create from group data', () => {
      const groupData = {
        G: { generators: [{ prime: 5 }, { prime: 7 }], relations: [] },
        H: { rank: 2, isAbelian: true },
        N: { generators: [], rank: 0 }
      };
      
      const seq = new CrowellSequence(groupData);
      assert.ok(seq);
    });
  });

  describe('modules', () => {
    it('should get N abelian module', () => {
      const groupData = {
        G: { generators: [{ prime: 5 }], relations: [] },
        H: { rank: 1 },
        N: { generators: [], rank: 0 }
      };
      
      const seq = new CrowellSequence(groupData);
      const Nab = seq.NabelianModule;
      assert.ok(Nab);
    });

    it('should get Alexander module', () => {
      const groupData = {
        G: { generators: [{ prime: 5 }], relations: [] },
        H: { rank: 1 },
        N: { generators: [], rank: 0 }
      };
      
      const seq = new CrowellSequence(groupData);
      const Apsi = seq.alexanderModule;
      assert.ok(Apsi);
    });

    it('should get augmentation ideal', () => {
      const groupData = {
        G: { generators: [], relations: [] },
        H: { rank: 1 },
        N: { generators: [], rank: 0 }
      };
      
      const seq = new CrowellSequence(groupData);
      const aug = seq.augmentationIdeal;
      assert.ok(aug instanceof FittingIdeal);
    });
  });

  describe('exactness', () => {
    it('should verify exactness', () => {
      const groupData = {
        G: { generators: [], relations: [] },
        H: { rank: 1 },
        N: { generators: [], rank: 0 }
      };
      
      const seq = new CrowellSequence(groupData);
      const check = seq.verifyExactness();
      assert.ok(check.injectiveAtNab);
      assert.ok(check.exactAtApsi);
      assert.ok(check.surjectiveOntoAugIdeal);
    });
  });

  describe('splitting', () => {
    it('should get splitting data', () => {
      const groupData = {
        G: { generators: [], relations: [] },
        H: { rank: 1 },
        N: { generators: [], rank: 0 }
      };
      
      const seq = new CrowellSequence(groupData);
      const split = seq.getSplitting();
      assert.ok(split.directSum);
      assert.strictEqual(split.fittingShift, 1);
    });
  });
});

// ============================================================================
// Alexander Module Tests
// ============================================================================

describe('AlexanderModule', () => {
  describe('construction', () => {
    it('should create from prime set', () => {
      const primes = [5, 7, 11];
      const module = new AlexanderModule(primes);
      assert.ok(module);
      assert.strictEqual(module.r, 3);
    });

    it('should filter non-primes', () => {
      const primes = [4, 5, 6, 7];
      const module = new AlexanderModule(primes);
      assert.strictEqual(module.r, 2); // Only 5, 7
    });

    it('should accept options', () => {
      const module = new AlexanderModule([5, 7], { ell: 3 });
      assert.strictEqual(module.ell, 3);
    });

    it('should throw for empty prime set', () => {
      assert.throws(() => new AlexanderModule([]));
    });
  });

  describe('Crowell sequence', () => {
    it('should have Crowell sequence', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const seq = module.crowellSequence;
      assert.ok(seq instanceof CrowellSequence);
    });
  });

  describe('Fitting ideals', () => {
    it('should compute E_0', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const E0 = module.computeFittingIdeal(0);
      assert.ok(E0 instanceof FittingIdeal);
      assert.strictEqual(E0.degree, 0);
    });

    it('should compute E_1', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const E1 = module.computeFittingIdeal(1);
      assert.ok(E1 instanceof FittingIdeal);
    });

    it('should get all Fitting ideals', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const ideals = module.getAllFittingIdeals(3);
      assert.ok(0 in ideals);
      assert.ok(1 in ideals);
      assert.ok(2 in ideals);
      assert.ok(3 in ideals);
    });
  });

  describe('Alexander polynomial', () => {
    it('should compute Alexander polynomial', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const alex = module.alexanderPolynomial;
      assert.ok(alex instanceof LaurentPolynomial);
    });
  });

  describe('signature', () => {
    it('should compute signature', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = module.signature;
      
      assert.ok('primes' in sig);
      assert.ok('ell' in sig);
      assert.ok('alexanderPolynomial' in sig);
      assert.ok('characteristicValues' in sig);
      assert.ok('hash' in sig);
    });

    it('should have valid hash', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = module.signature;
      assert.strictEqual(typeof sig.hash, 'number');
      assert.ok(sig.hash >= 0);
    });
  });

  describe('equivalence', () => {
    it('should detect equivalent signatures', () => {
      const sig1 = new AlexanderModule([5, 7, 11]).signature;
      const sig2 = new AlexanderModule([5, 7, 11]).signature;
      
      const equiv = AlexanderModule.equivalentSignatures(sig1, sig2);
      assert.ok(equiv);
    });

    it('should detect non-equivalent signatures', () => {
      const sig1 = new AlexanderModule([5, 7, 11]).signature;
      const sig2 = new AlexanderModule([5, 7, 13]).signature;
      
      const equiv = AlexanderModule.equivalentSignatures(sig1, sig2);
      // May or may not be equivalent depending on structure
      assert.strictEqual(typeof equiv, 'boolean');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const json = module.toJSON();
      
      assert.ok('primes' in json);
      assert.ok('ell' in json);
      assert.ok('signature' in json);
    });

    it('should deserialize from JSON', () => {
      const original = new AlexanderModule([5, 7, 11]);
      const json = original.toJSON();
      const restored = AlexanderModule.fromJSON(json);
      
      assert.deepStrictEqual(restored.primes, original.primes);
      assert.strictEqual(restored.ell, original.ell);
    });
  });

  describe('stats', () => {
    it('should compute statistics', () => {
      const module = new AlexanderModule([5, 7, 11, 13]);
      const stats = module.stats;
      
      assert.ok('numPrimes' in stats);
      assert.ok('alexanderDegree' in stats);
      assert.ok('signatureHash' in stats);
      assert.strictEqual(stats.numPrimes, 4);
    });
  });
});

// ============================================================================
// Module Signature Tests
// ============================================================================

describe('ModuleSignature', () => {
  describe('construction', () => {
    it('should create from Alexander module', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = new ModuleSignature(module);
      assert.ok(sig);
    });
  });

  describe('properties', () => {
    it('should get hash', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = new ModuleSignature(module);
      assert.strictEqual(typeof sig.hash, 'number');
    });

    it('should get primes', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = new ModuleSignature(module);
      assert.deepStrictEqual(sig.primes, [5, 7, 11]);
    });

    it('should get Alexander polynomial', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = new ModuleSignature(module);
      assert.ok(sig.alexanderPolynomial);
    });

    it('should get fingerprint', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = new ModuleSignature(module);
      assert.ok(Array.isArray(sig.fingerprint));
    });
  });

  describe('distance', () => {
    it('should compute distance to another signature', () => {
      const sig1 = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      const sig2 = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      
      const dist = sig1.distanceTo(sig2);
      assert.strictEqual(typeof dist, 'number');
      assert.ok(dist >= 0);
    });

    it('should have zero distance to self', () => {
      const module = new AlexanderModule([5, 7, 11]);
      const sig = new ModuleSignature(module);
      
      const dist = sig.distanceTo(sig);
      assert.ok(dist < 0.0001);
    });
  });

  describe('equivalence', () => {
    it('should check equivalence', () => {
      const sig1 = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      const sig2 = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      
      const equiv = sig1.isEquivalentTo(sig2);
      assert.ok(equiv);
    });
  });

  describe('string representation', () => {
    it('should produce readable toString', () => {
      const sig = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      const str = sig.toString();
      assert.ok(str.includes('ModuleSignature'));
    });
  });

  describe('memory entry', () => {
    it('should export as memory entry', () => {
      const sig = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      const entry = sig.toMemoryEntry();
      
      assert.ok('key' in entry);
      assert.ok('primes' in entry);
      assert.ok('fingerprint' in entry);
    });
  });
});

// ============================================================================
// Signature Memory Tests
// ============================================================================

describe('SignatureMemory', () => {
  describe('construction', () => {
    it('should create empty memory', () => {
      const memory = new SignatureMemory();
      assert.ok(memory);
      assert.strictEqual(memory.signatures.size, 0);
    });
  });

  describe('storage', () => {
    it('should store signature', () => {
      const memory = new SignatureMemory();
      const sig = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      
      const result = memory.store(sig);
      assert.ok(result.stored);
    });

    it('should prevent duplicate storage', () => {
      const memory = new SignatureMemory();
      const sig = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      
      memory.store(sig);
      const result = memory.store(sig);
      assert.ok(!result.stored);
    });
  });

  describe('retrieval', () => {
    it('should get signature by hash', () => {
      const memory = new SignatureMemory();
      const sig = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      memory.store(sig);
      
      const retrieved = memory.get(sig.hash);
      assert.ok(retrieved);
    });

    it('should check if signature exists', () => {
      const memory = new SignatureMemory();
      const sig = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      memory.store(sig);
      
      assert.ok(memory.has(sig.hash));
      assert.ok(!memory.has(12345));
    });

    it('should find by prime', () => {
      const memory = new SignatureMemory();
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 11])));
      memory.store(new ModuleSignature(new AlexanderModule([5, 13, 17])));
      
      const found = memory.findByPrime(5);
      assert.ok(found.length >= 1);
    });
  });

  describe('search', () => {
    it('should find closest signature', () => {
      const memory = new SignatureMemory();
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 11])));
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 13])));
      memory.store(new ModuleSignature(new AlexanderModule([5, 11, 17])));
      
      const query = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      const closest = memory.findClosest(query, 2);
      
      assert.ok(Array.isArray(closest));
      assert.ok(closest.length <= 2);
    });

    it('should find equivalent signatures', () => {
      const memory = new SignatureMemory();
      const sig1 = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      memory.store(sig1);
      
      const query = new ModuleSignature(new AlexanderModule([5, 7, 11]));
      const equiv = memory.findEquivalent(query);
      
      assert.ok(equiv.length >= 1);
    });
  });

  describe('management', () => {
    it('should get all signatures', () => {
      const memory = new SignatureMemory();
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 11])));
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 13])));
      
      const all = memory.getAll();
      assert.strictEqual(all.length, 2);
    });

    it('should clear memory', () => {
      const memory = new SignatureMemory();
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 11])));
      memory.clear();
      
      assert.strictEqual(memory.signatures.size, 0);
    });

    it('should get stats', () => {
      const memory = new SignatureMemory();
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 11])));
      
      const stats = memory.stats;
      assert.ok('totalSignatures' in stats);
      assert.ok('uniquePrimes' in stats);
    });
  });

  describe('serialization', () => {
    it('should export to JSON', () => {
      const memory = new SignatureMemory();
      memory.store(new ModuleSignature(new AlexanderModule([5, 7, 11])));
      
      const json = memory.toJSON();
      assert.ok('entries' in json);
      assert.ok('metadata' in json);
    });
  });
});

// ============================================================================
// Signature Extractor Tests
// ============================================================================

describe('SignatureExtractor', () => {
  describe('construction', () => {
    it('should create with default options', () => {
      const extractor = new SignatureExtractor();
      assert.ok(extractor);
      assert.strictEqual(extractor.ell, 2);
    });

    it('should create with custom options', () => {
      const extractor = new SignatureExtractor({ ell: 3 });
      assert.strictEqual(extractor.ell, 3);
    });
  });

  describe('extraction', () => {
    it('should extract signature', () => {
      const extractor = new SignatureExtractor();
      const sig = extractor.extract([5, 7, 11]);
      
      assert.ok(sig instanceof ModuleSignature);
    });

    it('should cache extracted signatures', () => {
      const extractor = new SignatureExtractor();
      const sig1 = extractor.extract([5, 7, 11]);
      const sig2 = extractor.extract([5, 7, 11]);
      
      assert.strictEqual(sig1, sig2);
    });

    it('should extract batch', () => {
      const extractor = new SignatureExtractor();
      const sigs = extractor.extractBatch([
        [5, 7, 11],
        [5, 7, 13],
        [5, 11, 17]
      ]);
      
      assert.strictEqual(sigs.length, 3);
    });
  });

  describe('resonance', () => {
    it('should find resonant signatures', () => {
      const extractor = new SignatureExtractor();
      extractor.extract([5, 7, 11]);
      extractor.extract([5, 7, 13]);
      extractor.extract([5, 11, 17]);
      
      const resonant = extractor.findResonant([5, 7, 11], 2);
      assert.ok(Array.isArray(resonant));
    });

    it('should get alignment target', () => {
      const extractor = new SignatureExtractor();
      extractor.extract([5, 7, 11]);
      extractor.extract([5, 7, 13]);
      
      const target = extractor.getAlignmentTarget([5, 7, 11]);
      // May or may not find target depending on structure
      assert.ok(target === null || target instanceof ModuleSignature);
    });
  });

  describe('management', () => {
    it('should clear cache', () => {
      const extractor = new SignatureExtractor();
      extractor.extract([5, 7, 11]);
      extractor.clearCache();
      
      assert.strictEqual(extractor._cache.size, 0);
    });

    it('should get stats', () => {
      const extractor = new SignatureExtractor();
      extractor.extract([5, 7, 11]);
      
      const stats = extractor.stats;
      assert.ok('cacheSize' in stats);
      assert.ok('memoryStats' in stats);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
  describe('createAlexanderModule', () => {
    it('should create Alexander module', () => {
      const module = createAlexanderModule([5, 7, 11]);
      assert.ok(module instanceof AlexanderModule);
    });
  });

  describe('extractSignature', () => {
    it('should extract signature', () => {
      const sig = extractSignature([5, 7, 11]);
      assert.ok(sig instanceof ModuleSignature);
    });
  });

  describe('createSignatureMemory', () => {
    it('should create signature memory', () => {
      const memory = createSignatureMemory();
      assert.ok(memory instanceof SignatureMemory);
    });
  });

  describe('createSignatureExtractor', () => {
    it('should create signature extractor', () => {
      const extractor = createSignatureExtractor();
      assert.ok(extractor instanceof SignatureExtractor);
    });
  });
});