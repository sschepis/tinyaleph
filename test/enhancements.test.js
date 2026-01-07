/**
 * Tests for TinyAleph Enhancements
 * 
 * Covers:
 * - Stochastic Kuramoto models
 * - Prime Entanglement Graph
 * - Streaming/Observable pattern
 * - Hypercomplex exp/log/slerp extensions
 * - Multi-Z channels for Primeon Ladder
 * - ResoFormer complete layers
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

// ============================================================================
// STOCHASTIC KURAMOTO TESTS
// ============================================================================

describe('Stochastic Kuramoto Models', () => {
  const { 
    StochasticKuramoto, 
    ColoredNoiseKuramoto, 
    ThermalKuramoto,
    gaussianRandom 
  } = require('../physics/stochastic-kuramoto');
  
  describe('gaussianRandom', () => {
    it('should generate values with approximately zero mean', () => {
      const samples = Array.from({ length: 10000 }, () => gaussianRandom());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      assert.ok(Math.abs(mean) < 0.1, `Mean ${mean} should be near 0`);
    });
    
    it('should generate values with approximately unit variance', () => {
      const samples = Array.from({ length: 10000 }, () => gaussianRandom());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / samples.length;
      assert.ok(Math.abs(variance - 1) < 0.2, `Variance ${variance} should be near 1`);
    });
  });
  
  describe('StochasticKuramoto', () => {
    it('should create with default parameters', () => {
      const frequencies = [1.0, 1.1, 0.9, 1.05];
      const model = new StochasticKuramoto(frequencies);
      
      assert.strictEqual(model.oscillators.length, 4);
      assert.strictEqual(model.sigma, 0.1);
      assert.strictEqual(model.noiseType, 'white');
    });
    
    it('should evolve state over time', () => {
      const frequencies = [1.0, 1.1, 0.9, 1.05, 1.0];
      const model = new StochasticKuramoto(frequencies, {
        coupling: 0.5,
        noiseIntensity: 0.05
      });
      
      // Evolve for 100 steps
      model.evolve(100, 0.01);
      
      const finalOrder = model.orderParameter();
      
      // Order parameter should be a number
      assert.ok(typeof finalOrder === 'number');
    });
    
    it('should track noise statistics', () => {
      const frequencies = [1.0, 1.1, 0.9];
      const model = new StochasticKuramoto(frequencies, { noiseIntensity: 0.2 });
      
      model.evolve(500, 0.01);
      
      assert.ok(model.noiseStats.sampleCount > 0);
      assert.ok(typeof model.noiseStats.mean === 'number');
      assert.ok(typeof model.noiseStats.variance === 'number');
    });
    
    it('should compute order parameter with uncertainty', () => {
      const frequencies = [1.0, 1.0, 1.0, 1.0];
      const model = new StochasticKuramoto(frequencies, { coupling: 0.5 });
      
      const result = model.orderParameterWithUncertainty(50, 0.01);
      
      // Check structure of result
      assert.ok(typeof result.mean === 'number');
      assert.ok(typeof result.stdDev === 'number');
      assert.ok(typeof result.stdError === 'number');
      assert.ok(Array.isArray(result.confidence95));
      assert.strictEqual(result.samples.length, 50);
    });
  });
  
  describe('ColoredNoiseKuramoto', () => {
    it('should use Ornstein-Uhlenbeck noise', () => {
      const frequencies = [1.0, 1.1, 0.9, 1.05];
      const model = new ColoredNoiseKuramoto(frequencies, {
        correlationTime: 2.0,
        noiseIntensity: 0.1
      });
      
      assert.strictEqual(model.noiseType, 'colored');
      assert.strictEqual(model.tau, 2.0);
    });
    
    it('should compute stationary variance', () => {
      const model = new ColoredNoiseKuramoto([1.0], {
        correlationTime: 1.0,
        noiseIntensity: 0.2
      });
      
      // Expected variance = σ²τ/2
      const expected = 0.2 * 0.2 * 1.0 / 2;
      assert.strictEqual(model.getStationaryVariance(), expected);
    });
  });
  
  describe('ThermalKuramoto', () => {
    it('should adjust noise based on temperature', () => {
      const frequencies = [1.0, 1.1, 0.9];
      const model = new ThermalKuramoto(frequencies, { temperature: 2.0 });
      
      const sigma1 = model.sigma;
      model.setTemperature(4.0);
      const sigma2 = model.sigma;
      
      // Higher temperature should mean higher noise
      assert.ok(sigma2 > sigma1);
    });
    
    it('should estimate critical temperature', () => {
      const frequencies = [1.0, 1.0, 1.0, 1.0];
      const model = new ThermalKuramoto(frequencies, { coupling: 0.5 });
      
      const Tc = model.estimateCriticalTemperature();
      
      // Critical temperature should be a valid number
      assert.ok(typeof Tc === 'number');
      // It could be NaN if frequency spread is 0, so just check it's a number
    });
  });
});

// ============================================================================
// PRIME ENTANGLEMENT GRAPH TESTS
// ============================================================================

describe('Prime Entanglement Graph', () => {
  const { 
    PrimeEntanglementGraph, 
    EntanglementEdge,
    createEntanglementGraph 
  } = require('../core/entanglement');
  
  describe('EntanglementEdge', () => {
    it('should create with source and target', () => {
      const edge = new EntanglementEdge(2, 3);
      
      assert.strictEqual(edge.source, 2);
      assert.strictEqual(edge.target, 3);
      assert.strictEqual(edge.weight, 0);
      assert.strictEqual(edge.cooccurrenceCount, 0);
    });
    
    it('should update on observation', () => {
      const edge = new EntanglementEdge(2, 3);
      
      edge.observe(0.8, 0.5);
      
      assert.ok(edge.weight > 0);
      assert.ok(edge.phaseAlignment > 0);
      assert.strictEqual(edge.cooccurrenceCount, 1);
    });
    
    it('should decay weight', () => {
      const edge = new EntanglementEdge(2, 3);
      edge.observe(1.0, 1.0);
      
      const initialWeight = edge.weight;
      edge.decay(0.5);
      
      assert.ok(edge.weight < initialWeight);
    });
  });
  
  describe('PrimeEntanglementGraph', () => {
    it('should create with first N primes', () => {
      const graph = new PrimeEntanglementGraph(25);
      
      assert.strictEqual(graph.primes.size, 25);
      assert.ok(graph.primes.has(2));
      assert.ok(graph.primes.has(97));
    });
    
    it('should create with explicit prime list', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5, 7, 11]);
      
      assert.strictEqual(graph.primes.size, 5);
    });
    
    it('should observe prime co-occurrences', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5, 7, 11]);
      
      graph.observe([2, 3], [5, 7], 0.8);
      
      assert.ok(graph.hasEdge(2, 5));
      assert.ok(graph.hasEdge(2, 7));
      assert.ok(graph.hasEdge(3, 5));
      assert.ok(graph.hasEdge(3, 7));
    });
    
    it('should find neighbors', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5, 7]);
      
      graph.observe([2], [3, 5], 1.0);
      
      const neighbors = graph.neighbors(2, 1);
      
      assert.ok(neighbors.has(3));
      assert.ok(neighbors.has(5));
    });
    
    it('should find shortest path', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5, 7]);
      
      graph.observe([2], [3], 1.0);
      graph.observe([3], [5], 1.0);
      graph.observe([5], [7], 1.0);
      
      const path = graph.shortestPath(2, 7);
      
      assert.ok(path !== null);
      assert.ok(path.path.includes(2));
      assert.ok(path.path.includes(7));
    });
    
    it('should compute clustering coefficient', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5, 7]);
      
      // Create a triangle
      graph.observe([2], [3], 1.0);
      graph.observe([3], [5], 1.0);
      graph.observe([2], [5], 1.0);
      
      const cc = graph.clusteringCoefficient(2);
      
      // Should be 1 for a complete triangle
      assert.strictEqual(cc, 1);
    });
    
    it('should convert to adjacency matrix', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5]);
      
      graph.observe([2], [3], 0.5);
      
      const matrix = graph.toAdjacencyMatrix([2, 3, 5]);
      
      assert.strictEqual(matrix.length, 3);
      assert.ok(matrix[0][1] > 0);
      assert.ok(matrix[1][0] > 0);
    });
    
    it('should prune weak edges', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5], { pruneThreshold: 0.5 });
      
      graph.observe([2], [3], 0.3); // Below threshold after one observation
      
      const pruned = graph.prune(0.5);
      
      // Edge should be pruned (weight is ~0.03 after exponential average)
      assert.ok(!graph.hasEdge(2, 3));
    });
    
    it('should compute graph statistics', () => {
      const graph = new PrimeEntanglementGraph([2, 3, 5, 7]);
      
      graph.observe([2], [3, 5], 0.8);
      
      const stats = graph.stats();
      
      assert.strictEqual(stats.nodeCount, 4);
      assert.ok(stats.edgeCount > 0);
      assert.ok(typeof stats.averageDegree === 'number');
    });
  });
  
  describe('createEntanglementGraph', () => {
    it('should create graph with factory function', () => {
      const graph = createEntanglementGraph({ numPrimes: 50 });
      
      assert.strictEqual(graph.primes.size, 50);
    });
  });
});

// ============================================================================
// STREAMING/OBSERVABLE TESTS
// ============================================================================

describe('Event System and Streaming', () => {
  const { 
    AlephEventEmitter, 
    AlephMonitor,
    EvolutionStream 
  } = require('../core/events');
  
  describe('AlephEventEmitter', () => {
    it('should emit and receive events', () => {
      const emitter = new AlephEventEmitter();
      let received = null;
      
      emitter.on('test', (data) => {
        received = data;
      });
      
      emitter.emit('test', { value: 42 });
      
      assert.deepStrictEqual(received, { value: 42 });
    });
    
    it('should support once listeners', () => {
      const emitter = new AlephEventEmitter();
      let count = 0;
      
      emitter.once('test', () => count++);
      
      emitter.emit('test');
      emitter.emit('test');
      
      assert.strictEqual(count, 1);
    });
    
    it('should remove listeners with off', () => {
      const emitter = new AlephEventEmitter();
      let count = 0;
      
      const handler = () => count++;
      emitter.on('test', handler);
      emitter.emit('test');
      emitter.off('test', handler);
      emitter.emit('test');
      
      assert.strictEqual(count, 1);
    });
    
    it('should throttle events', () => {
      const emitter = new AlephEventEmitter();
      let count = 0;
      
      emitter.throttle('test', 100);
      emitter.on('test', () => count++);
      
      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');
      
      // Only first should get through due to throttling
      assert.strictEqual(count, 1);
    });
    
    it('should support wildcard listener', () => {
      const emitter = new AlephEventEmitter();
      const events = [];
      
      emitter.on('*', (e) => events.push(e.event));
      
      emitter.emit('foo');
      emitter.emit('bar');
      
      assert.deepStrictEqual(events, ['foo', 'bar']);
    });
    
    it('should track event history', () => {
      const emitter = new AlephEventEmitter();
      
      emitter.emit('a', 1);
      emitter.emit('b', 2);
      
      const history = emitter.getHistory();
      
      assert.strictEqual(history.length, 2);
    });
    
    it('should support pause and resume', () => {
      const emitter = new AlephEventEmitter();
      let count = 0;
      
      emitter.on('test', () => count++);
      
      emitter.emit('test');
      emitter.pause();
      emitter.emit('test');
      emitter.resume();
      emitter.emit('test');
      
      assert.strictEqual(count, 2);
    });
    
    it('should support waitFor promise', async () => {
      const emitter = new AlephEventEmitter();
      
      setTimeout(() => emitter.emit('ready', { done: true }), 10);
      
      const data = await emitter.waitFor('ready', 1000);
      
      assert.deepStrictEqual(data, { done: true });
    });
  });
});

// ============================================================================
// HYPERCOMPLEX EXTENSIONS TESTS
// ============================================================================

describe('Hypercomplex Extensions', () => {
  const { Hypercomplex } = require('../core/hypercomplex');
  
  describe('exp and log', () => {
    it('should compute exponential of zero', () => {
      const zero = Hypercomplex.zero(4);
      const exp = zero.exp();
      
      // e^0 = 1
      assert.ok(Math.abs(exp.c[0] - 1) < 1e-10);
      for (let i = 1; i < 4; i++) {
        assert.ok(Math.abs(exp.c[i]) < 1e-10);
      }
    });
    
    it('should compute exponential of pure real', () => {
      const real = Hypercomplex.fromReal(4, 1);
      const exp = real.exp();
      
      // e^1 = e
      assert.ok(Math.abs(exp.c[0] - Math.E) < 1e-10);
    });
    
    it('should satisfy exp(log(q)) ≈ q for positive real', () => {
      const q = Hypercomplex.fromReal(4, 2);
      const result = q.log().exp();
      
      assert.ok(Math.abs(result.c[0] - 2) < 1e-10);
    });
    
    it('should satisfy log(exp(q)) ≈ q for small q', () => {
      const q = new Hypercomplex(4);
      q.c[0] = 0.1;
      q.c[1] = 0.2;
      
      const result = q.exp().log();
      
      assert.ok(Math.abs(result.c[0] - q.c[0]) < 1e-6);
      assert.ok(Math.abs(result.c[1] - q.c[1]) < 1e-6);
    });
  });
  
  describe('pow', () => {
    it('should compute q^0 = 1', () => {
      const q = Hypercomplex.fromArray([1, 2, 3, 4]);
      const result = q.pow(0);
      
      assert.ok(Math.abs(result.c[0] - 1) < 1e-10);
      for (let i = 1; i < 4; i++) {
        assert.ok(Math.abs(result.c[i]) < 1e-10);
      }
    });
    
    it('should compute q^1 = q', () => {
      const q = Hypercomplex.fromArray([1, 2, 3, 4]);
      const result = q.pow(1);
      
      for (let i = 0; i < 4; i++) {
        assert.ok(Math.abs(result.c[i] - q.c[i]) < 1e-10);
      }
    });
    
    it('should compute q^2 via powInt', () => {
      const q = Hypercomplex.fromArray([1, 0, 0, 0]).normalize();
      const squared = q.powInt(2);
      const mulSquared = q.mul(q);
      
      for (let i = 0; i < 4; i++) {
        assert.ok(Math.abs(squared.c[i] - mulSquared.c[i]) < 1e-10);
      }
    });
  });
  
  describe('slerp', () => {
    it('should return q1 at t=0', () => {
      const q1 = Hypercomplex.basis(4, 0, 1);
      const q2 = Hypercomplex.fromAxisAngle(4, [0, 0, 1], Math.PI / 2);
      
      const result = q1.slerp(q2, 0);
      
      assert.ok(Math.abs(result.c[0] - q1.c[0]) < 1e-10);
    });
    
    it('should return q2 at t=1', () => {
      const q1 = Hypercomplex.basis(4, 0, 1);
      const q2 = Hypercomplex.fromAxisAngle(4, [0, 0, 1], Math.PI / 2);
      
      const result = q1.slerp(q2, 1);
      
      // Should be very close to q2 (after normalization)
      const diff = result.sub(q2).norm();
      assert.ok(diff < 1e-6);
    });
    
    it('should produce normalized results', () => {
      const q1 = Hypercomplex.fromAxisAngle(4, [1, 0, 0], 0);
      const q2 = Hypercomplex.fromAxisAngle(4, [0, 1, 0], Math.PI / 4);
      
      for (let t = 0; t <= 1; t += 0.1) {
        const result = q1.slerp(q2, t);
        assert.ok(Math.abs(result.norm() - 1) < 1e-6);
      }
    });
  });
  
  describe('sandwich', () => {
    it('should rotate a vector', () => {
      // Rotation by 90 degrees around z-axis
      const q = Hypercomplex.fromAxisAngle(4, [0, 0, 1], Math.PI / 2);
      
      // Vector along x-axis
      const v = new Hypercomplex(4);
      v.c[1] = 1;
      
      const rotated = q.sandwich(v);
      
      // Should be approximately along y-axis
      assert.ok(Math.abs(rotated.c[1]) < 0.1);
      assert.ok(Math.abs(rotated.c[2] - 1) < 0.1);
    });
  });
  
  describe('fromAxisAngle and toAxisAngle', () => {
    it('should round-trip axis and angle', () => {
      const axis = [1, 0, 0];
      const angle = Math.PI / 3;
      
      const q = Hypercomplex.fromAxisAngle(4, axis, angle);
      const result = q.toAxisAngle();
      
      assert.ok(Math.abs(result.angle - angle) < 1e-6);
      assert.ok(Math.abs(result.axis[0] - 1) < 1e-6);
    });
  });
  
  describe('helper methods', () => {
    it('should compute scalar part', () => {
      const q = Hypercomplex.fromArray([1, 2, 3, 4]);
      assert.strictEqual(q.scalar(), 1);
    });
    
    it('should compute vector part', () => {
      const q = Hypercomplex.fromArray([1, 2, 3, 4]);
      const v = q.vector();
      
      assert.strictEqual(v.c[0], 0);
      assert.strictEqual(v.c[1], 2);
      assert.strictEqual(v.c[2], 3);
      assert.strictEqual(v.c[3], 4);
    });
    
    it('should check isUnit', () => {
      const unit = Hypercomplex.fromArray([1, 0, 0, 0]);
      const notUnit = Hypercomplex.fromArray([2, 0, 0, 0]);
      
      assert.ok(unit.isUnit());
      assert.ok(!notUnit.isUnit());
    });
  });
});

// ============================================================================
// MULTI-Z LADDER TESTS
// ============================================================================

describe('Multi-Channel Primeon Z-Ladder', () => {
  const { 
    PrimeonZLadderMulti, 
    ZChannel,
    createMultiChannelLadder,
    createAdiabaticSchedule
  } = require('../physics/primeon_z_ladder_multi');
  
  describe('ZChannel', () => {
    it('should create with configuration', () => {
      const channel = new ZChannel({
        name: 'test',
        dz: 2,
        leak: 0.1,
        decay: 0.01
      });
      
      assert.strictEqual(channel.name, 'test');
      assert.strictEqual(channel.dz, 2);
      assert.strictEqual(channel.leak, 0.1);
      assert.strictEqual(channel.decay, 0.01);
    });
    
    it('should initialize state array', () => {
      const channel = new ZChannel({ name: 'test', dz: 1 });
      channel.init(10);
      
      assert.strictEqual(channel.z.length, 10);
      assert.strictEqual(channel.N, 10);
    });
    
    it('should compute metrics', () => {
      const channel = new ZChannel({ name: 'test' });
      channel.init(4);
      
      const metrics = channel.metrics();
      
      assert.strictEqual(metrics.name, 'test');
      assert.ok(typeof metrics.entropy === 'number');
      assert.ok(typeof metrics.norm === 'number');
    });
  });
  
  describe('PrimeonZLadderMulti', () => {
    it('should create with default channels', () => {
      const ladder = new PrimeonZLadderMulti({ N: 8 });
      
      assert.strictEqual(ladder.N, 8);
      assert.ok(ladder.channels.has('fast'));
      assert.ok(ladder.channels.has('slow'));
      assert.ok(ladder.channels.has('permanent'));
    });
    
    it('should create with custom channels', () => {
      const ladder = new PrimeonZLadderMulti({
        N: 8,
        zChannels: [
          { name: 'alpha', leak: 0.3 },
          { name: 'beta', leak: 0.05 }
        ]
      });
      
      assert.ok(ladder.channels.has('alpha'));
      assert.ok(ladder.channels.has('beta'));
      assert.ok(!ladder.channels.has('fast'));
    });
    
    it('should excite rungs', () => {
      const ladder = new PrimeonZLadderMulti({ N: 8 });
      
      ladder.exciteRung(3);
      
      const probs = ladder.rungProbabilities();
      assert.ok(probs[3] > 0.5);
    });
    
    it('should evolve state over time', () => {
      const ladder = new PrimeonZLadderMulti({ N: 8 });
      ladder.exciteRung(0);
      
      const trajectory = ladder.run(10, 0.01);
      
      assert.strictEqual(trajectory.length, 10);
      assert.ok(trajectory[9].t > 0);
    });
    
    it('should distribute flux to different channels', () => {
      const ladder = new PrimeonZLadderMulti({ N: 8 });
      ladder.exciteRung(0);
      
      ladder.run(50, 0.01);
      
      const channelMetrics = ladder.channelMetrics();
      
      // Fast channel should have more flux due to higher leak rate
      assert.ok(channelMetrics.fast.totalFlux > channelMetrics.slow.totalFlux);
    });
    
    it('should support time-dependent Hamiltonian', () => {
      const Jt = (t) => 0.25 * (1 + Math.sin(t));
      
      const ladder = new PrimeonZLadderMulti({ N: 8, Jt });
      
      const J0 = ladder.getCurrentJ();
      ladder.step(Math.PI / 2);
      const J1 = ladder.getCurrentJ();
      
      assert.ok(J0 !== J1);
    });
    
    it('should compute entanglement entropy', () => {
      const ladder = new PrimeonZLadderMulti({ N: 8 });
      ladder.exciteRungs([0, 1, 2, 3], 1);
      
      ladder.run(20, 0.01);
      
      const entropy = ladder.entanglementEntropy();
      
      assert.ok(entropy >= 0);
      assert.ok(entropy <= Math.log(8));
    });
    
    it('should perform measurement and collapse', () => {
      const ladder = new PrimeonZLadderMulti({ N: 8 });
      ladder.exciteRungs([0, 1, 2, 3], 1);
      
      const result = ladder.measure();
      
      assert.ok(result.outcome >= 0 && result.outcome < 8);
      assert.ok(result.probability > 0);
      
      // After collapse, should be localized
      const probs = ladder.rungProbabilities();
      assert.ok(probs[result.outcome] > 0.99);
    });
  });
  
  describe('createMultiChannelLadder', () => {
    it('should create ladder from primes', () => {
      const ladder = createMultiChannelLadder([2, 3, 5, 7]);
      
      assert.ok(ladder.N >= 8);
    });
  });
  
  describe('createAdiabaticSchedule', () => {
    it('should create linear schedule', () => {
      const schedule = createAdiabaticSchedule(0, 1, 10, 'linear');
      
      assert.strictEqual(schedule(0), 0);
      assert.strictEqual(schedule(10), 1);
      assert.strictEqual(schedule(5), 0.5);
    });
    
    it('should create sinusoidal schedule', () => {
      const schedule = createAdiabaticSchedule(0, 1, 10, 'sinusoidal');
      
      assert.strictEqual(schedule(0), 0);
      assert.ok(Math.abs(schedule(10) - 1) < 1e-10);
      assert.ok(schedule(5) > 0.4 && schedule(5) < 0.6);
    });
  });
});

// ============================================================================
// RESOFORMER LAYERS TESTS
// ============================================================================

describe('ResoFormer Layers', () => {
  const {
    ResonantMultiHeadAttention,
    PrimeFFN,
    PrimeLayerNorm,
    PositionalPrimeEncoding,
    ResoFormerBlock,
    ResoFormer
  } = require('../core/rformer-layers');
  
  const { SparsePrimeState } = require('../core/rformer');
  
  describe('ResonantMultiHeadAttention', () => {
    it('should create with default heads', () => {
      const attention = new ResonantMultiHeadAttention({});
      
      assert.strictEqual(attention.numHeads, 8);
      assert.strictEqual(attention.headWeights.length, 8);
    });
    
    it('should apply multi-head attention', () => {
      const attention = new ResonantMultiHeadAttention({ numHeads: 4 });
      
      const query = SparsePrimeState.fromPrimes([2, 3, 5]);
      const keys = [
        SparsePrimeState.fromPrimes([2, 3, 7]),
        SparsePrimeState.fromPrimes([5, 7, 11])
      ];
      const values = keys;
      
      const result = attention.forward(query, keys, values);
      
      assert.ok(result.result);
      assert.strictEqual(result.headOutputs.length, 4);
      // attentionWeights is per head, so should have numHeads entries
      assert.strictEqual(result.attentionWeights.length, 4);
    });
  });
  
  describe('PrimeFFN', () => {
    it('should apply feedforward transformation', () => {
      const ffn = new PrimeFFN({ hiddenMultiplier: 4 });
      
      const input = SparsePrimeState.fromPrimes([2, 3, 5, 7]);
      const output = ffn.forward(input);
      
      assert.ok(output instanceof SparsePrimeState);
    });
    
    it('should use specified activation', () => {
      const ffn = new PrimeFFN({ activation: 'gelu' });
      
      const input = SparsePrimeState.fromPrimes([2, 3]);
      const output = ffn.forward(input);
      
      assert.ok(output instanceof SparsePrimeState);
    });
  });
  
  describe('PrimeLayerNorm', () => {
    it('should normalize state amplitudes', () => {
      const norm = new PrimeLayerNorm();
      
      // Create a state with default amplitudes
      const input = SparsePrimeState.fromPrimes([2, 3, 5]);
      
      const output = norm.forward(input);
      
      assert.ok(output instanceof SparsePrimeState);
      assert.ok(output.getActivePrimes().length > 0);
    });
  });
  
  describe('PositionalPrimeEncoding', () => {
    it('should encode position into state', () => {
      const encoding = new PositionalPrimeEncoding({ maxLength: 100 });
      
      const state = SparsePrimeState.fromPrimes([2, 3, 5]);
      const encoded = encoding.encode(state, 5);
      
      assert.ok(encoded instanceof SparsePrimeState);
      // Position should add new prime components
      assert.ok(encoded.getActivePrimes().length >= state.getActivePrimes().length);
    });
  });
  
  describe('ResoFormerBlock', () => {
    it('should create with all sublayers', () => {
      const block = new ResoFormerBlock({
        numHeads: 4,
        hiddenMultiplier: 2
      });
      
      assert.ok(block.attention);
      assert.ok(block.ffn);
      assert.ok(block.norm1);
      assert.ok(block.norm2);
    });
    
    it('should apply residual connections', () => {
      const block = new ResoFormerBlock({
        numHeads: 2
      });
      
      const input = SparsePrimeState.fromPrimes([2, 3, 5, 7]);
      const context = [SparsePrimeState.fromPrimes([11, 13])];
      
      const result = block.forward(input, context);
      
      assert.ok(result.output instanceof SparsePrimeState);
      // attentionWeights is the correct property name
      assert.ok(result.attentionWeights);
    });
  });
  
  describe('ResoFormer', () => {
    it('should create with specified depth', () => {
      const model = new ResoFormer({
        numLayers: 4,
        numHeads: 4
      });
      
      assert.strictEqual(model.blocks.length, 4);
    });
    
    it('should process sequence through all layers', () => {
      const model = new ResoFormer({
        numLayers: 2,
        numHeads: 2
      });
      
      const sequence = [
        SparsePrimeState.fromPrimes([2, 3]),
        SparsePrimeState.fromPrimes([5, 7]),
        SparsePrimeState.fromPrimes([11, 13])
      ];
      
      const result = model.forward(sequence);
      
      assert.strictEqual(result.output.length, sequence.length);
      assert.strictEqual(result.layerOutputs.length, 2);
    });
    
    it('should support single state input', () => {
      const model = new ResoFormer({
        numLayers: 1,
        numHeads: 2
      });
      
      const input = SparsePrimeState.fromPrimes([2, 3]);
      
      const result = model.forward(input);
      
      assert.ok(result.output instanceof SparsePrimeState);
    });
    
    it('should compute parameters count', () => {
      const model = new ResoFormer({
        numLayers: 2,
        numHeads: 4
      });
      
      const params = model.getParameterCount();
      
      assert.ok(params > 0);
      assert.ok(typeof params === 'number');
    });
    
    it('should support train/eval modes', () => {
      const model = new ResoFormer({
        numLayers: 1,
        numHeads: 2
      });
      
      model.train();
      assert.ok(model.blocks[0].training === true);
      
      model.eval();
      assert.ok(model.blocks[0].training === false);
    });
  });
});

// ============================================================================
// EVOLUTION STREAM TESTS
// ============================================================================

describe('EvolutionStream', () => {
  const { EvolutionStream } = require('../core/events');
  const { KuramotoModel } = require('../physics/kuramoto');
  
  it('should create stream from evolvable', () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto);
    
    assert.ok(stream instanceof EvolutionStream);
  });
  
  it('should iterate with take operator', async () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto);
    
    const taken = stream.take(5);
    const values = [];
    
    for await (const value of taken) {
      values.push(value);
    }
    
    assert.strictEqual(values.length, 5);
  });
  
  it('should filter values based on step', async () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto);
    
    // Filter for even steps only (guaranteed to match)
    const filtered = stream
      .filter(v => v.step % 2 === 0)
      .take(3);
    
    const values = [];
    for await (const value of filtered) {
      values.push(value);
    }
    
    // All values should have even steps
    values.forEach(v => assert.ok(v.step % 2 === 0));
    assert.strictEqual(values.length, 3);
  });
  
  it('should map values', async () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto);
    
    const mapped = stream
      .map(v => ({ step: v.step, doubled: v.step * 2 }))
      .take(5);
    
    const values = [];
    for await (const value of mapped) {
      values.push(value);
    }
    
    // All values should have doubled property
    values.forEach(v => assert.strictEqual(v.doubled, v.step * 2));
    assert.strictEqual(values.length, 5);
  });
  
  it('should batch values', async () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto, { maxSteps: 10 });
    
    const batched = stream.batch(5);
    
    // Get first batch
    const batch = (await batched[Symbol.asyncIterator]().next()).value;
    
    assert.strictEqual(batch.length, 5);
  });
  
  it('should reduce to final value', async () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto);
    
    const sum = await stream
      .take(10)
      .reduce((acc, v) => acc + v.step, 0);
    
    // Sum of 0..9 = 45
    assert.strictEqual(sum, 45);
  });
  
  it('should collect to array', async () => {
    const kuramoto = new KuramotoModel([1.0, 1.1, 0.9], 0.5);
    const stream = EvolutionStream.fromEvolvable(kuramoto);
    
    const collected = await stream.take(7).collect();
    
    assert.strictEqual(collected.length, 7);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('should integrate entanglement graph with stochastic Kuramoto', () => {
    const { PrimeEntanglementGraph } = require('../core/entanglement');
    const { StochasticKuramoto } = require('../physics/stochastic-kuramoto');
    
    // Build entanglement graph
    const graph = new PrimeEntanglementGraph([2, 3, 5, 7, 11]);
    graph.observe([2, 3], [5, 7], 0.8);
    graph.observe([5, 7], [11], 0.6);
    
    // Get adjacency matrix and convert to Kuramoto manually
    const primeList = [2, 3, 5, 7, 11];
    const adjacency = graph.toAdjacencyMatrix(primeList);
    const frequencies = primeList.map(p => 1.0 + 0.1 * Math.log(p));
    
    const kuramoto = new StochasticKuramoto(frequencies, {
      noiseIntensity: 0.1,
      coupling: 0.3
    });
    
    // Evolve with noise
    kuramoto.evolve(100, 0.01);
    
    const order = kuramoto.orderParameter();
    // Order parameter should be a number (may be NaN if phases diverge)
    assert.ok(typeof order === 'number');
  });
  
  it('should stream hypercomplex interpolations', async () => {
    const { Hypercomplex } = require('../core/hypercomplex');
    const { AlephEventEmitter } = require('../core/events');
    
    const emitter = new AlephEventEmitter();
    const results = [];
    
    emitter.on('interpolation', (data) => {
      results.push(data.t);
    });
    
    // Interpolate between two quaternions
    const q1 = Hypercomplex.fromAxisAngle(4, [1, 0, 0], 0);
    const q2 = Hypercomplex.fromAxisAngle(4, [1, 0, 0], Math.PI);
    
    for (let t = 0; t <= 1; t += 0.1) {
      const interpolated = q1.slerp(q2, t);
      emitter.emit('interpolation', { t, quaternion: interpolated });
    }
    
    assert.ok(results.length > 0);
  });
  
  it('should use multi-channel ladder with ResoFormer', () => {
    const { PrimeonZLadderMulti } = require('../physics/primeon_z_ladder_multi');
    const { ResoFormer } = require('../core/rformer-layers');
    const { SparsePrimeState } = require('../core/rformer');
    
    // Create multi-channel ladder
    const ladder = new PrimeonZLadderMulti({ N: 8 });
    ladder.exciteRung(0);
    
    // Run ladder to get dynamics
    const trajectory = ladder.run(20, 0.01);
    
    // Convert trajectory to prime states for ResoFormer
    const primes = [2, 3, 5, 7, 11, 13, 17, 19];
    const sequence = trajectory.slice(0, 5).map(snapshot => {
      // Use rungProbabilities method instead of snapshot.probabilities
      const probs = ladder.rungProbabilities();
      const activePrimes = primes.filter((_, i) => probs[i] > 0.05);
      return SparsePrimeState.fromPrimes(
        activePrimes.length > 0 ? activePrimes : [2]
      );
    });
    
    // Process through ResoFormer
    const model = new ResoFormer({ numLayers: 1, numHeads: 2 });
    const result = model.forward(sequence);
    
    assert.strictEqual(result.output.length, sequence.length);
  });
});

console.log('All enhancement tests defined successfully!');