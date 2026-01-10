/**
 * Tests for CRT-Enhanced ResoFormer
 * 
 * Tests cover:
 * - CRTResonantAttention: Multi-head attention with modular structure
 * - HomologyRegularizedBlock: Transformer block with homology loss
 * - CRTResoFormer: Complete model with homology reporting
 * - Integration with SparsePrimeState
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
    CRTResonantAttention,
    HomologyRegularizedBlock,
    CRTResoFormer,
    createCRTResoFormer
} = require('../core/rformer-crt');

const { SparsePrimeState, Quaternion } = require('../core/rformer');
const { Complex } = require('../core/hilbert');

// ============================================================================
// CRTResonantAttention Tests
// ============================================================================

describe('CRTResonantAttention', () => {
    
    it('should initialize with correct moduli', () => {
        const attention = new CRTResonantAttention({
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32
        });
        
        assert.strictEqual(attention.numHeads, 4);
        assert.strictEqual(attention.moduli.length, 4);
        // Moduli should be first 4 primes
        assert.deepStrictEqual(attention.moduli, [2, 3, 5, 7]);
    });
    
    it('should compute forward pass with empty keys', () => {
        const attention = new CRTResonantAttention({ numHeads: 4 });
        const query = SparsePrimeState.fromHash('test query');
        
        const result = attention.forward(query, [], []);
        
        assert.ok(result.result);
        assert.strictEqual(result.headOutputs.length, 0);
        assert.strictEqual(result.homologyInfo.hasHoles, false);
    });
    
    it('should compute forward pass with valid inputs', () => {
        const attention = new CRTResonantAttention({
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32
        });
        
        const query = SparsePrimeState.fromHash('query');
        const keys = [
            SparsePrimeState.fromHash('key1'),
            SparsePrimeState.fromHash('key2'),
            SparsePrimeState.fromHash('key3')
        ];
        const values = [
            SparsePrimeState.fromHash('value1'),
            SparsePrimeState.fromHash('value2'),
            SparsePrimeState.fromHash('value3')
        ];
        
        const result = attention.forward(query, keys, values);
        
        assert.ok(result.result instanceof SparsePrimeState);
        assert.strictEqual(result.headOutputs.length, 4);
        assert.strictEqual(result.crtResidues.length, 4);
        assert.ok('hasHoles' in result.homologyInfo);
        assert.ok('bettiNumbers' in result.homologyInfo);
    });
    
    it('should compute attention weights as doubly-stochastic', () => {
        const attention = new CRTResonantAttention({
            numHeads: 4,
            sinkhornIterations: 10
        });
        
        const query = SparsePrimeState.fromHash('query');
        const keys = [
            SparsePrimeState.fromHash('k1'),
            SparsePrimeState.fromHash('k2')
        ];
        const values = keys;
        
        const result = attention.forward(query, keys, values);
        
        // Each head should produce weights summing close to 1
        for (const headWeights of result.attentionWeights) {
            const sum = headWeights.reduce((a, b) => a + b, 0);
            assert.ok(Math.abs(sum - 1.0) < 0.1, `Weight sum ${sum} should be close to 1`);
        }
    });
    
    it('should detect homology holes for inconsistent inputs', () => {
        const attention = new CRTResonantAttention({
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32
        });
        
        // Create deliberately inconsistent states
        const query = new SparsePrimeState(4096, 32);
        query.set(2, new Complex(0.9, 0.1), Quaternion.one());
        query.set(3, new Complex(0.8, 0.2), Quaternion.one());
        
        const keys = [];
        const values = [];
        for (let i = 0; i < 5; i++) {
            const state = new SparsePrimeState(4096, 32);
            // Create varied states
            state.set(2, new Complex(Math.random(), Math.random()), Quaternion.random());
            state.set(5, new Complex(Math.random(), Math.random()), Quaternion.random());
            state.set(7, new Complex(Math.random(), Math.random()), Quaternion.random());
            keys.push(state.normalize());
            values.push(state.normalize());
        }
        
        const result = attention.forward(query, keys, values);
        
        // Should have homology info
        assert.ok(result.homologyInfo);
        assert.ok(Array.isArray(result.homologyInfo.bettiNumbers));
        assert.strictEqual(result.homologyInfo.bettiNumbers.length, 2);
    });
    
    it('should allow setting head weights', () => {
        const attention = new CRTResonantAttention({ numHeads: 4 });
        
        const newWeights = [0.6, 0.2, 0.2];
        attention.setHeadWeights(0, newWeights);
        
        assert.deepStrictEqual(attention.headWeights[0], newWeights);
    });
    
    it('should return parameters for serialization', () => {
        const attention = new CRTResonantAttention({
            numHeads: 4,
            temperature: 0.5
        });
        
        const params = attention.getParameters();
        
        assert.strictEqual(params.numHeads, 4);
        assert.deepStrictEqual(params.moduli, [2, 3, 5, 7]);
        assert.strictEqual(params.temperature, 0.5);
        assert.ok(Array.isArray(params.headWeights));
    });
});

// ============================================================================
// HomologyRegularizedBlock Tests
// ============================================================================

describe('HomologyRegularizedBlock', () => {
    
    it('should initialize with default config', () => {
        const block = new HomologyRegularizedBlock();
        
        assert.ok(block.attention);
        assert.ok(block.ffn);
        assert.ok(block.norm1);
        assert.ok(block.norm2);
        assert.ok(block.homologyLoss);
    });
    
    it('should compute forward pass with self-attention', () => {
        const block = new HomologyRegularizedBlock({
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32
        });
        
        const input = SparsePrimeState.fromHash('test input');
        const result = block.forward(input);
        
        assert.ok(result.output instanceof SparsePrimeState);
        assert.ok(Array.isArray(result.attentionWeights));
        assert.ok('homologyInfo' in result);
        assert.ok(typeof result.loss === 'number');
    });
    
    it('should compute forward pass with context', () => {
        const block = new HomologyRegularizedBlock({
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32
        });
        
        const input = SparsePrimeState.fromHash('input');
        const context = [
            SparsePrimeState.fromHash('ctx1'),
            SparsePrimeState.fromHash('ctx2'),
            SparsePrimeState.fromHash('ctx3')
        ];
        
        const result = block.forward(input, context);
        
        assert.ok(result.output instanceof SparsePrimeState);
        assert.ok(result.crtResidues.length > 0);
    });
    
    it('should include homology loss when holes detected', () => {
        const block = new HomologyRegularizedBlock({
            numHeads: 4,
            homologyWeight: 0.1
        });
        
        // Create states that may trigger homology detection
        const input = SparsePrimeState.fromHash('input');
        const context = [];
        for (let i = 0; i < 5; i++) {
            context.push(SparsePrimeState.fromHash(`context-${i}-${Math.random()}`));
        }
        
        const result = block.forward(input, context);
        
        // Loss should be non-negative
        assert.ok(result.loss >= 0);
        // If holes detected, loss should be positive
        if (result.homologyInfo.hasHoles) {
            assert.ok(result.loss > 0);
        }
    });
    
    it('should support training mode toggle', () => {
        const block = new HomologyRegularizedBlock({ dropout: 0.1 });
        
        assert.strictEqual(block.training, false);
        
        block.train(true);
        assert.strictEqual(block.training, true);
        
        block.eval();
        assert.strictEqual(block.training, false);
    });
    
    it('should apply dropout in training mode', () => {
        const block = new HomologyRegularizedBlock({
            numHeads: 4,
            dropout: 0.5
        });
        
        block.train(true);
        
        const input = SparsePrimeState.fromHash('test');
        
        // Run multiple times - dropout should cause variation
        const results = [];
        for (let i = 0; i < 5; i++) {
            results.push(block.forward(input));
        }
        
        // Results should exist (not testing for variation as it's random)
        assert.ok(results.every(r => r.output instanceof SparsePrimeState));
    });
});

// ============================================================================
// CRTResoFormer Tests
// ============================================================================

describe('CRTResoFormer', () => {
    
    it('should create model with factory function', () => {
        const model = createCRTResoFormer({
            numLayers: 2,
            numHeads: 4
        });
        
        assert.ok(model instanceof CRTResoFormer);
        assert.strictEqual(model.numLayers, 2);
        assert.strictEqual(model.blocks.length, 2);
    });
    
    it('should process single input', () => {
        const model = createCRTResoFormer({
            numLayers: 2,
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32
        });
        
        const input = SparsePrimeState.fromHash('single input');
        const result = model.forward(input);
        
        assert.ok(result.output instanceof SparsePrimeState);
        assert.strictEqual(result.layerOutputs.length, 2);
        assert.strictEqual(result.attentionMaps.length, 2);
        assert.ok('homologyReport' in result);
        assert.ok(typeof result.totalLoss === 'number');
    });
    
    it('should process sequence input', () => {
        const model = createCRTResoFormer({
            numLayers: 2,
            numHeads: 4
        });
        
        const sequence = [
            SparsePrimeState.fromHash('token1'),
            SparsePrimeState.fromHash('token2'),
            SparsePrimeState.fromHash('token3')
        ];
        
        const result = model.forward(sequence);
        
        assert.ok(Array.isArray(result.output));
        assert.strictEqual(result.output.length, 3);
        result.output.forEach(o => assert.ok(o instanceof SparsePrimeState));
    });
    
    it('should add positional encoding when enabled', () => {
        const modelWithPos = createCRTResoFormer({
            numLayers: 2,
            usePositionalEncoding: true
        });
        
        const modelWithoutPos = createCRTResoFormer({
            numLayers: 2,
            usePositionalEncoding: false
        });
        
        assert.ok(modelWithPos.posEncoder);
        assert.strictEqual(modelWithoutPos.posEncoder, undefined);
    });
    
    it('should aggregate homology reports across layers', () => {
        const model = createCRTResoFormer({
            numLayers: 3,
            numHeads: 4,
            homologyWeight: 0.1
        });
        
        const sequence = [
            SparsePrimeState.fromHash('a'),
            SparsePrimeState.fromHash('b'),
            SparsePrimeState.fromHash('c')
        ];
        
        const result = model.forward(sequence);
        
        assert.ok(result.homologyReport);
        assert.ok('hasHoles' in result.homologyReport);
        assert.ok(typeof result.homologyReport.totalHolesDetected === 'number');
        assert.ok(typeof result.homologyReport.maxBettiNumber === 'number');
        assert.ok(Array.isArray(result.homologyReport.layerReports));
        assert.strictEqual(result.homologyReport.layerReports.length, 3);
    });
    
    it('should support training mode', () => {
        const model = createCRTResoFormer({ numLayers: 2 });
        
        model.train(true);
        model.blocks.forEach(b => assert.strictEqual(b.training, true));
        
        model.eval();
        model.blocks.forEach(b => assert.strictEqual(b.training, false));
    });
    
    it('should return CRT configuration', () => {
        const model = createCRTResoFormer({
            numLayers: 2,
            numHeads: 4
        });
        
        const config = model.getCRTConfig();
        
        assert.ok(config);
        assert.strictEqual(config.numHeads, 4);
        assert.ok(Array.isArray(config.moduli));
        assert.strictEqual(config.moduli.length, 4);
    });
    
    it('should estimate parameter count', () => {
        const model = createCRTResoFormer({
            numLayers: 6,
            numHeads: 8
        });
        
        const count = model.getParameterCount();
        
        assert.ok(typeof count === 'number');
        assert.ok(count > 0);
    });
    
    it('should accumulate loss across layers', () => {
        const model = createCRTResoFormer({
            numLayers: 3,
            homologyWeight: 0.1
        });
        
        const input = SparsePrimeState.fromHash('test');
        const result = model.forward(input);
        
        // Total loss should be non-negative
        assert.ok(result.totalLoss >= 0);
    });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('CRT-ResoFormer Integration', () => {
    
    it('should process realistic sequence with homology detection', () => {
        const model = createCRTResoFormer({
            numLayers: 2,
            numHeads: 4,
            numPrimes: 4096,
            activeK: 32,
            homologyWeight: 0.1
        });
        
        // Create a sequence of semantically related states
        const tokens = ['the', 'quick', 'brown', 'fox', 'jumps'];
        const sequence = tokens.map(t => SparsePrimeState.fromHash(t));
        
        const result = model.forward(sequence);
        
        // All outputs should be valid
        assert.strictEqual(result.output.length, 5);
        result.output.forEach(o => {
            assert.ok(o instanceof SparsePrimeState);
            assert.ok(o.getActivePrimes().length > 0);
        });
        
        // Should have full layer tracking
        assert.strictEqual(result.layerOutputs.length, 2);
        assert.strictEqual(result.attentionMaps.length, 2);
    });
    
    it('should maintain prime structure through layers', () => {
        const model = createCRTResoFormer({
            numLayers: 2,
            numHeads: 4
        });
        
        const input = SparsePrimeState.fromHash('maintain structure');
        const inputPrimes = new Set(input.getActivePrimes());
        
        const result = model.forward(input);
        const outputPrimes = new Set(result.output.getActivePrimes());
        
        // Output should still have prime activations
        assert.ok(outputPrimes.size > 0);
        
        // Some overlap expected (though not guaranteed due to attention mixing)
        // This is a soft test - just checking structure is maintained
    });
    
    it('should work with fromPrimes constructor', () => {
        const model = createCRTResoFormer({ numLayers: 2 });
        
        const primes = [2, 3, 5, 7, 11, 13];
        const state = SparsePrimeState.fromPrimes(primes);
        
        const result = model.forward(state);
        
        assert.ok(result.output instanceof SparsePrimeState);
    });
});