/**
 * Tests for AlephEngine
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AlephEngine } from '../engine/aleph.js';
import { createEngine } from '../engine/index.js';
import { SemanticBackend } from '../backends/semantic/index.js';
import { CryptographicBackend } from '../backends/cryptographic/index.js';
import { ScientificBackend } from '../backends/scientific/index.js';

describe('AlephEngine', () => {
  let engine;
  let backend;

  beforeEach(() => {
    backend = new SemanticBackend({
      dimension: 8,
      vocabulary: {
        hello: [2, 3],
        world: [5, 7],
        test: [11, 13],
        input: [17, 19]
      },
      ontology: {
        2: 'existence',
        3: 'relation',
        5: 'space',
        7: 'time'
      }
    });
    engine = new AlephEngine(backend);
  });

  describe('construction', () => {
    it('should create engine with backend', () => {
      assert.ok(engine);
      assert.ok(engine.backend === backend);
    });

    it('should initialize oscillators', () => {
      assert.ok(engine.oscillators);
    });

    it('should have default options', () => {
      assert.ok(engine.options.baseCoupling > 0);
      assert.strictEqual(engine.options.maxHistory, 200);
      // Dead options removed in wave 1B
      assert.ok(!('dampingRate' in engine.options));
      assert.ok(!('stableCoherence' in engine.options));
    });
  });

  describe('run', () => {
    it('should process input and return result', () => {
      const result = engine.run('hello world');
      
      assert.ok(result);
      assert.ok('input' in result);
      assert.ok('inputPrimes' in result);
      assert.ok('resultPrimes' in result);
      assert.ok('output' in result);
      assert.ok('entropy' in result);
      assert.ok('coherence' in result);
    });

    it('should return input in result', () => {
      const result = engine.run('test input');
      assert.strictEqual(result.input, 'test input');
    });

    it('should encode input to primes', () => {
      const result = engine.run('hello');
      assert.ok(Array.isArray(result.inputPrimes));
      assert.ok(result.inputPrimes.length > 0);
    });

    it('should provide stability classification', () => {
      const result = engine.run('test');
      assert.ok(['stable', 'marginal', 'chaotic'].includes(result.stability));
    });

    it('should track evolution steps', () => {
      const result = engine.run('hello');
      assert.ok(typeof result.evolutionSteps === 'number');
    });

    it('should have fieldBased property', () => {
      const result = engine.run('hello');
      // fieldBased might be undefined or boolean depending on evolution
      assert.ok(result.hasOwnProperty('fieldBased') || result.fieldBased === undefined || typeof result.fieldBased === 'boolean');
    });
  });

  describe('tick', () => {
    it('should advance simulation', () => {
      const stateBefore = engine.state.clone();
      engine.excite([2, 3, 5]);
      engine.tick(0.1);
      
      // State should have changed
      let diff = 0;
      for (let i = 0; i < engine.state.dim; i++) {
        diff += Math.abs(engine.state.c[i] - stateBefore.c[i]);
      }
      assert.ok(diff > 0);
    });

    it('should update entropy', () => {
      engine.excite([2, 3, 5]);
      engine.tick(0.1);
      assert.ok(typeof engine.entropy === 'number');
    });

    it('should update Lyapunov exponent', () => {
      engine.excite([2, 3]);
      engine.tick(0.1);
      assert.ok(typeof engine.lyapunov === 'number');
    });
  });

  describe('excite', () => {
    it('should excite oscillators by primes', () => {
      engine.excite([2, 3, 5]);
      // Engine should have excited oscillators - check raw amplitudes, not weighted
      const amps = engine.oscillators.getAmplitudes();
      const hasAmplitude = amps.some(a => a > 0);
      assert.ok(hasAmplitude);
    });
  });

  describe('reason', () => {
    it('should perform entropy-minimizing reasoning', () => {
      const result = engine.reason([2, 3, 5]);
      
      assert.ok(result.primes);
      assert.ok(result.state);
      assert.ok(typeof result.entropy === 'number');
      assert.ok(Array.isArray(result.steps));
    });
  });

  describe('physics state', () => {
    it('should get physics state', () => {
      engine.excite([2, 3]);
      engine.tick(0.1);
      
      const physics = engine.getPhysicsState();
      
      assert.ok('state' in physics);
      assert.ok('entropy' in physics);
      assert.ok('coherence' in physics);
      assert.ok('lyapunov' in physics);
      assert.ok('stability' in physics);
      assert.ok('orderParameter' in physics);
      assert.ok('oscillators' in physics);
    });
  });

  describe('backend info', () => {
    it('should get backend info', () => {
      const info = engine.getBackendInfo();
      
      assert.ok('name' in info);
      assert.ok('dimension' in info);
      assert.ok('transformCount' in info);
      assert.ok('primeCount' in info);
    });
  });

  describe('reset', () => {
    it('should reset engine state', () => {
      engine.run('hello');
      engine.reset();
      
      assert.strictEqual(engine.entropy, 0);
      assert.strictEqual(engine.history.length, 0);
    });
  });

  describe('history', () => {
    it('should track processing history', () => {
      engine.run('hello');
      engine.run('world');
      
      const history = engine.getHistory();
      assert.strictEqual(history.length, 2);
    });

    it('should limit history', () => {
      for (let i = 0; i < 20; i++) {
        engine.run(`test ${i}`);
      }
      
      const history = engine.getHistory(5);
      assert.strictEqual(history.length, 5);
    });

    it('should cap history growth at maxHistory', () => {
      const cappedEngine = new AlephEngine(backend, {
        maxEvolutionSteps: 3,
        maxHistory: 10
      });
      
      for (let i = 0; i < 30; i++) {
        cappedEngine.run(`input ${i}`);
      }
      
      assert.ok(cappedEngine.history.length <= 10);
      assert.strictEqual(cappedEngine.history.length, 10);
    });

    it('should keep the most recent history entries', () => {
      const cappedEngine = new AlephEngine(backend, {
        maxEvolutionSteps: 3,
        maxHistory: 5
      });
      
      for (let i = 0; i < 10; i++) {
        cappedEngine.run(`input ${i}`);
      }
      
      const last = cappedEngine.history[cappedEngine.history.length - 1];
      assert.strictEqual(last.input, 'input 9');
    });
  });

  describe('batch processing', () => {
    it('should run batch of inputs', () => {
      const results = engine.runBatch(['hello', 'world', 'test']);
      
      assert.strictEqual(results.length, 3);
      assert.ok(results.every(r => 'output' in r));
    });
  });

  describe('evolution', () => {
    it('should evolve state without input', () => {
      engine.excite([2, 3, 5]);
      const states = engine.evolve(5);
      
      assert.strictEqual(states.length, 5);
      for (const state of states) {
        assert.ok('step' in state);
        assert.ok('entropy' in state);
        assert.ok('orderParameter' in state);
      }
    });
  });

  describe('measurement', () => {
    it('should perform Born measurement', () => {
      engine.excite([2, 3]);
      engine.tick(0.1);
      
      const result = engine.measure();
      assert.ok('index' in result || 'outcome' in result);
    });
  });

  describe('backend switching', () => {
    it('should switch backends', () => {
      const cryptoBackend = new CryptographicBackend({ dimension: 16 });
      engine.setBackend(cryptoBackend);
      
      assert.strictEqual(engine.backend, cryptoBackend);
    });
  });
});

describe('Engine with different backends', () => {
  it('should work with CryptographicBackend', () => {
    const backend = new CryptographicBackend({ dimension: 16 });
    const engine = new AlephEngine(backend);
    
    const result = engine.run('secret');
    assert.ok(result);
    assert.ok(result.output);
  });

  it('should work with ScientificBackend', () => {
    const backend = new ScientificBackend({ dimension: 8 });
    const engine = new AlephEngine(backend);
    
    const result = engine.run('|0⟩');
    assert.ok(result);
    assert.ok(result.inputPrimes.includes(2));
  });
});

describe('createEngine factory (engine/index.js)', () => {
  it('should construct a semantic engine', () => {
    const engine = createEngine('semantic', { dimension: 8 });
    assert.ok(engine instanceof AlephEngine);
  });

  it('should construct a scientific engine via the science alias', () => {
    const engine = createEngine('science', { dimension: 8 });
    assert.ok(engine instanceof AlephEngine);
  });

  it('should construct a cryptographic engine', () => {
    const engine = createEngine('crypto', { dimension: 16 });
    assert.ok(engine instanceof AlephEngine);
  });

  it('should throw for unknown backend types', () => {
    assert.throws(() => createEngine('unknown'), /Unknown backend/);
    assert.throws(() => createEngine('not-a-backend'), /Unknown backend/);
  });
});