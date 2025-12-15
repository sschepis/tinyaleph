/**
 * Tests for physics modules
 * Covers oscillator, kuramoto, entropy, lyapunov, and collapse
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const {
  Oscillator,
  OscillatorBank,
  KuramotoModel,
  shannonEntropy,
  stateEntropy,
  coherence,
  mutualInformation,
  relativeEntropy,
  jointEntropy,
  oscillatorEntropy,
  estimateLyapunov,
  classifyStability,
  adaptiveCoupling,
  localLyapunov,
  delayEmbedding,
  stabilityMargin,
  collapseProbability,
  shouldCollapse,
  measureState,
  collapseToIndex,
  bornMeasurement,
  partialCollapse,
  applyDecoherence
} = require('../physics');
const { Hypercomplex } = require('../core/hypercomplex');

describe('Oscillator', () => {
  describe('construction', () => {
    it('should create oscillator with frequency', () => {
      const osc = new Oscillator(1.0);
      assert.strictEqual(osc.freq, 1.0);
      assert.strictEqual(typeof osc.phase, 'number');
      assert.strictEqual(typeof osc.amplitude, 'number');
    });

    it('should create oscillator with custom values', () => {
      const osc = new Oscillator(2.0, Math.PI, 0.5);
      assert.strictEqual(osc.freq, 2.0);
      assert.strictEqual(osc.phase, Math.PI);
      assert.strictEqual(osc.amplitude, 0.5);
    });

    it('should start quiescent by default', () => {
      const osc = new Oscillator(1.0);
      assert.strictEqual(osc.amplitude, 0);
    });
  });

  describe('dynamics', () => {
    it('should update phase on tick', () => {
      const osc = new Oscillator(1.0, 0, 1.0);
      const initialPhase = osc.phase;
      osc.tick(0.1);
      assert.notStrictEqual(osc.phase, initialPhase);
    });

    it('should track phase history', () => {
      const osc = new Oscillator(1.0, 0, 1.0);
      osc.tick(0.1);
      osc.tick(0.1);
      osc.tick(0.1);
      assert.strictEqual(osc.phaseHistory.length, 3);
    });
  });

  describe('excitation and decay', () => {
    it('should increase amplitude on excite', () => {
      const osc = new Oscillator(1.0, 0, 0);
      assert.strictEqual(osc.amplitude, 0);
      osc.excite(0.5);
      assert.strictEqual(osc.amplitude, 0.5);
    });

    it('should decrease amplitude on decay', () => {
      const osc = new Oscillator(1.0, 0, 1.0);
      osc.decay(0.1, 1);
      assert.ok(osc.amplitude < 1.0);
    });

    it('should cap amplitude at 1', () => {
      const osc = new Oscillator(1.0, 0, 0.8);
      osc.excite(0.5);
      assert.strictEqual(osc.amplitude, 1.0);
    });
  });

  describe('state', () => {
    it('should return state object', () => {
      const osc = new Oscillator(1.0, Math.PI/2, 0.5);
      const state = osc.getState();
      assert.strictEqual(state.freq, 1.0);
      assert.strictEqual(state.phase, Math.PI/2);
      assert.strictEqual(state.amplitude, 0.5);
    });

    it('should reset to quiescent', () => {
      const osc = new Oscillator(1.0, Math.PI, 0.8);
      osc.tick(0.1);
      osc.tick(0.1);
      osc.reset();
      assert.strictEqual(osc.phase, 0);
      assert.strictEqual(osc.amplitude, 0);
      assert.strictEqual(osc.phaseHistory.length, 0);
    });
  });
});

describe('OscillatorBank', () => {
  it('should create bank with frequencies array', () => {
    const freqs = [1.0, 1.5, 2.0, 2.5];
    const bank = new OscillatorBank(freqs);
    assert.strictEqual(bank.oscillators.length, 4);
  });

  it('should excite oscillators by indices', () => {
    const freqs = [1.0, 1.5, 2.0, 2.5];
    const bank = new OscillatorBank(freqs);
    bank.exciteByIndices([0, 2], 0.7);
    
    assert.strictEqual(bank.oscillators[0].amplitude, 0.7);
    assert.strictEqual(bank.oscillators[1].amplitude, 0);
    assert.strictEqual(bank.oscillators[2].amplitude, 0.7);
    assert.strictEqual(bank.oscillators[3].amplitude, 0);
  });

  it('should tick all oscillators', () => {
    const freqs = [1.0, 1.5, 2.0, 2.5];
    const bank = new OscillatorBank(freqs);
    bank.tick(0.1, null);
    
    // All oscillators should have phase history
    for (const osc of bank.oscillators) {
      assert.strictEqual(osc.phaseHistory.length, 1);
    }
  });

  it('should get amplitudes', () => {
    const freqs = [1.0, 1.5];
    const bank = new OscillatorBank(freqs);
    bank.exciteByIndices([0], 0.5);
    
    const amps = bank.getAmplitudes();
    assert.strictEqual(amps[0], 0.5);
    assert.strictEqual(amps[1], 0);
  });

  it('should get phases', () => {
    const freqs = [1.0, 1.5];
    const bank = new OscillatorBank(freqs);
    const phases = bank.getPhases();
    
    assert.strictEqual(phases.length, 2);
    assert.ok(phases.every(p => typeof p === 'number'));
  });

  it('should decay all oscillators', () => {
    const freqs = [1.0, 1.5];
    const bank = new OscillatorBank(freqs);
    bank.exciteByIndices([0, 1], 1.0);
    bank.decayAll(0.1, 1);
    
    for (const osc of bank.oscillators) {
      assert.ok(osc.amplitude < 1.0);
    }
  });

  it('should reset all oscillators', () => {
    const freqs = [1.0, 1.5];
    const bank = new OscillatorBank(freqs);
    bank.exciteByIndices([0, 1], 0.8);
    bank.tick(0.1, null);
    bank.reset();
    
    for (const osc of bank.oscillators) {
      assert.strictEqual(osc.amplitude, 0);
      assert.strictEqual(osc.phase, 0);
    }
  });
});

describe('KuramotoModel', () => {
  it('should create model with frequencies array', () => {
    const freqs = [1.0, 1.1, 1.2, 1.3];
    const kuramoto = new KuramotoModel(freqs, 0.1);
    assert.ok(kuramoto);
    assert.strictEqual(kuramoto.oscillators.length, 4);
  });

  it('should step the model', () => {
    const freqs = [1.0, 1.1, 1.2, 1.3];
    const kuramoto = new KuramotoModel(freqs);
    kuramoto.tick(0.01);
    // Should not throw
    assert.ok(kuramoto.oscillators[0].phaseHistory.length > 0);
  });

  it('should compute order parameter', () => {
    const freqs = [1.0, 1.0, 1.0, 1.0]; // Same frequency for easy sync
    const kuramoto = new KuramotoModel(freqs);
    // Excite all oscillators
    for (const osc of kuramoto.oscillators) {
      osc.excite(1.0);
    }
    const r = kuramoto.orderParameter();
    assert.ok(r >= 0 && r <= 1);
  });

  it('should excite by primes', () => {
    const freqs = [1.0, 1.1, 1.2, 1.3];
    const kuramoto = new KuramotoModel(freqs);
    const primeList = [2, 3, 5, 7];
    kuramoto.exciteByPrimes([2, 5], primeList, 0.5);
    
    assert.strictEqual(kuramoto.oscillators[0].amplitude, 0.5); // prime 2
    assert.strictEqual(kuramoto.oscillators[1].amplitude, 0);    // prime 3
    assert.strictEqual(kuramoto.oscillators[2].amplitude, 0.5); // prime 5
  });

  it('should get weighted amplitudes', () => {
    const freqs = [1.0, 1.1];
    const kuramoto = new KuramotoModel(freqs);
    kuramoto.oscillators[0].excite(1.0);
    const weighted = kuramoto.getWeightedAmplitudes();
    assert.strictEqual(weighted.length, 2);
  });
});

describe('Entropy Functions', () => {
  describe('shannonEntropy', () => {
    it('should return 0 for delta distribution', () => {
      const probs = [1, 0, 0, 0];
      const entropy = shannonEntropy(probs);
      assert.strictEqual(entropy, 0);
    });

    it('should return log2(n) for uniform distribution', () => {
      const probs = [0.25, 0.25, 0.25, 0.25];
      const entropy = shannonEntropy(probs);
      assert.ok(Math.abs(entropy - 2) < 0.0001);
    });

    it('should handle non-normalized input', () => {
      const probs = [1, 1, 1, 1];
      const entropy = shannonEntropy(probs);
      assert.ok(typeof entropy === 'number');
    });
  });

  describe('stateEntropy', () => {
    it('should compute entropy of hypercomplex state', () => {
      const state = Hypercomplex.basis(4, 0, 1);
      const entropy = stateEntropy(state);
      assert.strictEqual(entropy, 0);
    });

    it('should be higher for mixed states', () => {
      const pure = Hypercomplex.basis(4, 0, 1);
      const mixed = Hypercomplex.fromArray([1, 1, 1, 1]).normalize();
      
      assert.ok(stateEntropy(mixed) > stateEntropy(pure));
    });
  });

  describe('coherence', () => {
    it('should be 1 for identical states', () => {
      const a = Hypercomplex.fromArray([1, 2, 3, 4]).normalize();
      const b = a.clone();
      const coh = coherence(a, b);
      assert.ok(Math.abs(coh - 1) < 0.0001);
    });

    it('should be 0 for orthogonal states', () => {
      const a = Hypercomplex.basis(4, 0, 1);
      const b = Hypercomplex.basis(4, 1, 1);
      const coh = coherence(a, b);
      assert.ok(Math.abs(coh) < 0.0001);
    });
  });

  describe('relativeEntropy', () => {
    it('should be 0 for identical distributions', () => {
      const p = [0.5, 0.5];
      const q = [0.5, 0.5];
      const kl = relativeEntropy(p, q);
      assert.ok(Math.abs(kl) < 0.0001);
    });

    it('should be non-negative', () => {
      const p = [0.7, 0.3];
      const q = [0.4, 0.6];
      const kl = relativeEntropy(p, q);
      assert.ok(kl >= 0);
    });
  });
});

describe('Lyapunov Functions', () => {
  describe('estimateLyapunov', () => {
    it('should return a number for oscillator array', () => {
      // Create oscillators with phase history
      const oscillators = [];
      for (let i = 0; i < 4; i++) {
        const osc = new Oscillator(1.0 + i * 0.1, 0, 1.0);
        for (let j = 0; j < 30; j++) {
          osc.tick(0.1);
        }
        oscillators.push(osc);
      }
      const lambda = estimateLyapunov(oscillators);
      assert.ok(typeof lambda === 'number');
    });

    it('should return 0 for oscillators without sufficient history', () => {
      const oscillators = [
        new Oscillator(1.0, 0, 1.0),
        new Oscillator(1.1, 0, 1.0)
      ];
      const lambda = estimateLyapunov(oscillators);
      assert.strictEqual(lambda, 0);
    });
  });

  describe('classifyStability', () => {
    it('should classify negative exponent as STABLE', () => {
      const result = classifyStability(-0.5);
      assert.strictEqual(result, 'STABLE');
    });

    it('should classify positive exponent as CHAOTIC', () => {
      const result = classifyStability(0.5);
      assert.strictEqual(result, 'CHAOTIC');
    });

    it('should classify near-zero as MARGINAL', () => {
      const result = classifyStability(0.05);
      assert.strictEqual(result, 'MARGINAL');
    });
  });

  describe('adaptiveCoupling', () => {
    it('should increase coupling for stable system', () => {
      const base = 0.3;
      const adapted = adaptiveCoupling(base, -0.5);
      assert.ok(adapted > base);
    });

    it('should decrease coupling for chaotic system', () => {
      const base = 0.3;
      const adapted = adaptiveCoupling(base, 0.5);
      assert.ok(adapted < base);
    });
  });

  describe('delayEmbedding', () => {
    it('should create delay embedding matrix', () => {
      const series = [1, 2, 3, 4, 5, 6, 7, 8];
      const embedded = delayEmbedding(series, 3, 1);
      assert.ok(Array.isArray(embedded));
      assert.ok(embedded.length > 0);
      assert.strictEqual(embedded[0].length, 3);
    });
  });

  describe('stabilityMargin', () => {
    it('should compute margin from threshold', () => {
      const margin = stabilityMargin(-0.05);
      assert.ok(Math.abs(margin - 0.15) < 0.0001); // 0.1 - (-0.05)
    });
  });
});

describe('Collapse Functions', () => {
  describe('collapseProbability', () => {
    it('should compute collapse probability for state', () => {
      const prob = collapseProbability(0.5);
      assert.ok(typeof prob === 'number');
      assert.ok(prob >= 0 && prob <= 1);
    });

    it('should increase with entropy integral', () => {
      const prob1 = collapseProbability(0.1);
      const prob2 = collapseProbability(0.5);
      assert.ok(prob2 > prob1);
    });
  });

  describe('shouldCollapse', () => {
    it('should return boolean', () => {
      const result = shouldCollapse(0.9, 2.0, 0.5, { minCoherence: 0.7, minEntropy: 1.8 });
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should not collapse with low coherence', () => {
      const result = shouldCollapse(0.3, 2.0, 1.0, { minCoherence: 0.7, minEntropy: 1.8 });
      assert.strictEqual(result, false);
    });

    it('should not collapse with low entropy', () => {
      const result = shouldCollapse(0.9, 0.5, 1.0, { minCoherence: 0.7, minEntropy: 1.8 });
      assert.strictEqual(result, false);
    });
  });

  describe('measureState', () => {
    it('should return measurement result object', () => {
      const state = Hypercomplex.fromArray([1, 0.1, 0.1, 0.1]).normalize();
      const result = measureState(state);
      assert.ok('index' in result);
      assert.ok('value' in result);
    });

    it('should find dominant index', () => {
      const state = Hypercomplex.fromArray([0.1, 0.1, 1, 0.1]).normalize();
      const result = measureState(state);
      assert.strictEqual(result.index, 2);
    });
  });

  describe('collapseToIndex', () => {
    it('should collapse state toward index', () => {
      const state = Hypercomplex.fromArray([0.5, 0.5, 0.5, 0.5]).normalize();
      const collapsed = collapseToIndex(state, 0);
      assert.strictEqual(collapsed.dim, 4);
      assert.strictEqual(Math.abs(collapsed.c[0]), 1);
    });
  });

  describe('bornMeasurement', () => {
    it('should return index and probability', () => {
      const state = Hypercomplex.fromArray([0.5, 0.5, 0.5, 0.5]).normalize();
      const result = bornMeasurement(state);
      assert.ok('index' in result);
      assert.ok('probability' in result);
    });

    it('should return valid index', () => {
      const state = Hypercomplex.fromArray([1, 0, 0, 0]);
      const result = bornMeasurement(state);
      assert.ok(result.index >= 0 && result.index < 4);
    });
  });

  describe('partialCollapse', () => {
    it('should partially collapse state toward target', () => {
      const state = Hypercomplex.fromArray([0.5, 0.5, 0.5, 0.5]).normalize();
      const collapsed = partialCollapse(state, 0, 0.5);
      assert.strictEqual(collapsed.dim, 4);
      // Should be closer to index 0 than original
      assert.ok(Math.abs(collapsed.c[0]) > 0.5);
    });
  });

  describe('applyDecoherence', () => {
    it('should apply decoherence to state', () => {
      const state = Hypercomplex.fromArray([1, 0, 0, 0]);
      const decohered = applyDecoherence(state, 0.1);
      assert.strictEqual(decohered.dim, 4);
      // Should still be normalized
      assert.ok(Math.abs(decohered.norm() - 1) < 0.0001);
    });
  });
});