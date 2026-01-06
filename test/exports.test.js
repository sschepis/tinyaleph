/**
 * Tests for main module exports
 * Verifies all expected exports are present
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const aleph = require('../modular');

describe('Main module exports', () => {
  describe('Engine', () => {
    it('should export AlephEngine', () => {
      assert.ok(aleph.AlephEngine);
      assert.strictEqual(typeof aleph.AlephEngine, 'function');
    });

    it('should export createEngine factory', () => {
      assert.ok(aleph.createEngine);
      assert.strictEqual(typeof aleph.createEngine, 'function');
    });
  });

  describe('Backends', () => {
    it('should export Backend base class', () => {
      assert.ok(aleph.Backend);
      assert.strictEqual(typeof aleph.Backend, 'function');
    });

    it('should export SemanticBackend', () => {
      assert.ok(aleph.SemanticBackend);
      assert.strictEqual(typeof aleph.SemanticBackend, 'function');
    });

    it('should export CryptographicBackend', () => {
      assert.ok(aleph.CryptographicBackend);
      assert.strictEqual(typeof aleph.CryptographicBackend, 'function');
    });

    it('should export ScientificBackend', () => {
      assert.ok(aleph.ScientificBackend);
      assert.strictEqual(typeof aleph.ScientificBackend, 'function');
    });
  });

  describe('Core math', () => {
    it('should export Hypercomplex', () => {
      assert.ok(aleph.Hypercomplex);
      assert.strictEqual(typeof aleph.Hypercomplex, 'function');
    });

    it('should export FANO_LINES', () => {
      assert.ok(aleph.FANO_LINES);
      assert.ok(Array.isArray(aleph.FANO_LINES));
    });

    it('should export multiplication functions', () => {
      assert.ok(aleph.octonionMultiplyIndex);
      assert.ok(aleph.sedenionMultiplyIndex);
      assert.ok(aleph.multiplyIndices);
      assert.ok(aleph.buildMultiplicationTable);
    });
  });

  describe('Prime utilities', () => {
    it('should export primeGenerator', () => {
      assert.ok(aleph.primeGenerator);
      assert.strictEqual(typeof aleph.primeGenerator, 'function');
    });

    it('should export nthPrime', () => {
      assert.ok(aleph.nthPrime);
      assert.strictEqual(typeof aleph.nthPrime, 'function');
    });

    it('should export primesUpTo', () => {
      assert.ok(aleph.primesUpTo);
      assert.strictEqual(typeof aleph.primesUpTo, 'function');
    });

    it('should export isPrime', () => {
      assert.ok(aleph.isPrime);
      assert.strictEqual(typeof aleph.isPrime, 'function');
    });

    it('should export factorize', () => {
      assert.ok(aleph.factorize);
      assert.strictEqual(typeof aleph.factorize, 'function');
    });

    it('should export firstNPrimes', () => {
      assert.ok(aleph.firstNPrimes);
      assert.strictEqual(typeof aleph.firstNPrimes, 'function');
    });

    it('should export primeSignature', () => {
      assert.ok(aleph.primeSignature);
      assert.strictEqual(typeof aleph.primeSignature, 'function');
    });

    it('should export GaussianInteger', () => {
      assert.ok(aleph.GaussianInteger);
      assert.strictEqual(typeof aleph.GaussianInteger, 'function');
    });

    it('should export EisensteinInteger', () => {
      assert.ok(aleph.EisensteinInteger);
      assert.strictEqual(typeof aleph.EisensteinInteger, 'function');
    });

    it('should export primeToFrequency', () => {
      assert.ok(aleph.primeToFrequency);
      assert.strictEqual(typeof aleph.primeToFrequency, 'function');
    });

    it('should export primeToAngle', () => {
      assert.ok(aleph.primeToAngle);
      assert.strictEqual(typeof aleph.primeToAngle, 'function');
    });

    it('should export sumOfTwoSquares', () => {
      assert.ok(aleph.sumOfTwoSquares);
      assert.strictEqual(typeof aleph.sumOfTwoSquares, 'function');
    });

    it('should export DEFAULT_PRIMES', () => {
      assert.ok(aleph.DEFAULT_PRIMES);
      assert.ok(Array.isArray(aleph.DEFAULT_PRIMES));
    });
  });

  describe('Physics', () => {
    it('should export Oscillator', () => {
      assert.ok(aleph.Oscillator);
      assert.strictEqual(typeof aleph.Oscillator, 'function');
    });

    it('should export OscillatorBank', () => {
      assert.ok(aleph.OscillatorBank);
      assert.strictEqual(typeof aleph.OscillatorBank, 'function');
    });

    it('should export KuramotoModel', () => {
      assert.ok(aleph.KuramotoModel);
      assert.strictEqual(typeof aleph.KuramotoModel, 'function');
    });

    it('should export entropy functions', () => {
      assert.ok(aleph.shannonEntropy);
      assert.ok(aleph.stateEntropy);
      assert.ok(aleph.coherence);
      assert.ok(aleph.mutualInformation);
      assert.ok(aleph.relativeEntropy);
      assert.ok(aleph.jointEntropy);
      assert.ok(aleph.oscillatorEntropy);
    });

    it('should export Lyapunov functions', () => {
      assert.ok(aleph.estimateLyapunov);
      assert.ok(aleph.classifyStability);
      assert.ok(aleph.adaptiveCoupling);
      assert.ok(aleph.localLyapunov);
      assert.ok(aleph.delayEmbedding);
      assert.ok(aleph.stabilityMargin);
    });

    it('should export collapse functions', () => {
      assert.ok(aleph.collapseProbability);
      assert.ok(aleph.shouldCollapse);
      assert.ok(aleph.measureState);
      assert.ok(aleph.collapseToIndex);
      assert.ok(aleph.bornMeasurement);
      assert.ok(aleph.partialCollapse);
      assert.ok(aleph.applyDecoherence);
    });
  });

  describe('Convenience functions', () => {
    it('should export hash', () => {
      assert.ok(aleph.hash);
      assert.strictEqual(typeof aleph.hash, 'function');
    });

    it('should export deriveKey', () => {
      assert.ok(aleph.deriveKey);
      assert.strictEqual(typeof aleph.deriveKey, 'function');
    });
  });

  describe('LLM client', () => {
    it('should export LLM', () => {
      assert.ok(aleph.LLM);
    });
  });

  describe('Sub-modules', () => {
    it('should export core module', () => {
      assert.ok(aleph.core);
      assert.strictEqual(typeof aleph.core, 'object');
    });

    it('should export physics module', () => {
      assert.ok(aleph.physics);
      assert.strictEqual(typeof aleph.physics, 'object');
    });

    it('should export backends module', () => {
      assert.ok(aleph.backends);
      assert.strictEqual(typeof aleph.backends, 'object');
    });

    it('should export engine module', () => {
      assert.ok(aleph.engine);
      assert.strictEqual(typeof aleph.engine, 'object');
    });
  });
});

describe('createEngine factory', () => {
  it('should create semantic engine', () => {
    const engine = aleph.createEngine('semantic', { dimension: 8 });
    assert.ok(engine);
    assert.ok(engine instanceof aleph.AlephEngine);
  });

  it('should create cryptographic engine', () => {
    const engine = aleph.createEngine('crypto', { dimension: 16 });
    assert.ok(engine);
    assert.ok(engine instanceof aleph.AlephEngine);
  });

  it('should create scientific engine', () => {
    const engine = aleph.createEngine('quantum', { dimension: 8 });
    assert.ok(engine);
    assert.ok(engine instanceof aleph.AlephEngine);
  });

  it('should throw for unknown backend', () => {
    assert.throws(() => aleph.createEngine('unknown'), /Unknown backend/);
  });
});

describe('Convenience functions', () => {
  it('hash should produce buffer', () => {
    const result = aleph.hash('test');
    assert.ok(Buffer.isBuffer(result));
  });

  it('hash should produce requested length', () => {
    const result = aleph.hash('test', 16);
    assert.strictEqual(result.length, 16);
  });

  it('deriveKey should produce buffer', () => {
    const result = aleph.deriveKey('password', 'salt', 32, 100);
    assert.ok(Buffer.isBuffer(result));
  });

  it('deriveKey should produce requested length', () => {
    const result = aleph.deriveKey('password', 'salt', 16, 100);
    assert.strictEqual(result.length, 16);
  });
});