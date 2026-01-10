#!/usr/bin/env node
/**
 * Example 04: CRT-Enhanced ResoFormer
 * 
 * Demonstrates the full CRT-enhanced ResoFormer architecture:
 * - Per-modulus attention heads with Birkhoff projection
 * - CRT fusion of head outputs
 * - Homology detection for semantic consistency
 * 
 * This integrates with tinyaleph's SparsePrimeState representation.
 */

'use strict';

const {
    CRTResonantAttention,
    HomologyRegularizedBlock,
    CRTResoFormer,
    createCRTResoFormer
} = require('../../core/rformer-crt');

const { SparsePrimeState } = require('../../core/rformer');

console.log('=== CRT-Enhanced ResoFormer Example ===\n');

// Example 1: CRT Resonant Attention
console.log('1. CRT Resonant Attention:');
const attention = new CRTResonantAttention({
    numHeads: 4,
    numPrimes: 4096,
    activeK: 32
});

console.log(`   Number of heads: ${attention.numHeads}`);
console.log(`   Moduli: [${attention.moduli.join(', ')}]`);
console.log(`   Product P = ${attention.moduli.reduce((a, b) => a * b, 1)}`);

// Create sample states
const query = SparsePrimeState.fromHash('query concept');
const keys = [
    SparsePrimeState.fromHash('key 1 - related'),
    SparsePrimeState.fromHash('key 2 - similar'),
    SparsePrimeState.fromHash('key 3 - different')
];
const values = keys.map((_, i) => SparsePrimeState.fromHash(`value ${i}`));

console.log(`   Query: ${query.getActivePrimes().slice(0, 5).join(', ')}...`);
console.log(`   Keys: ${keys.length} states\n`);

const attnResult = attention.forward(query, keys, values);
console.log(`   Output primes: ${attnResult.result.getActivePrimes().length} active`);
console.log(`   Heads computed: ${attnResult.headOutputs.length}`);
console.log(`   CRT residues: [${attnResult.crtResidues.map(r => r.toFixed(2)).join(', ')}]`);
console.log(`   Homology detected: ${attnResult.homologyInfo.hasHoles}`);
console.log(`   Betti numbers: β₀=${attnResult.homologyInfo.bettiNumbers[0]}, ` +
            `β₁=${attnResult.homologyInfo.bettiNumbers[1]}`);

// Example 2: Homology Regularized Block
console.log('\n2. Homology Regularized Block:');
const block = new HomologyRegularizedBlock({
    numHeads: 4,
    hiddenDim: 256,
    numPrimes: 4096,
    activeK: 32,
    homologyWeight: 0.1
});

const input = SparsePrimeState.fromHash('input state');
const context = [
    SparsePrimeState.fromHash('context 1'),
    SparsePrimeState.fromHash('context 2'),
    SparsePrimeState.fromHash('context 3')
];

const blockResult = block.forward(input, context);
console.log(`   Input primes: ${input.getActivePrimes().length}`);
console.log(`   Output primes: ${blockResult.output.getActivePrimes().length}`);
console.log(`   Homology loss: ${blockResult.loss.toFixed(6)}`);
console.log(`   Has holes: ${blockResult.homologyInfo.hasHoles}`);

// Example 3: Full CRT ResoFormer
console.log('\n3. Full CRT ResoFormer:');
const model = createCRTResoFormer({
    numLayers: 3,
    numHeads: 4,
    hiddenDim: 256,
    numPrimes: 4096,
    activeK: 32,
    homologyWeight: 0.1,
    usePositionalEncoding: true
});

console.log(`   Layers: ${model.numLayers}`);
console.log(`   Position encoding: ${model.usePositionalEncoding}`);
console.log(`   Parameter count (est): ${model.getParameterCount()}`);

// Process a sequence
const sequence = [
    SparsePrimeState.fromHash('the'),
    SparsePrimeState.fromHash('quick'),
    SparsePrimeState.fromHash('brown'),
    SparsePrimeState.fromHash('fox')
];

console.log(`\n   Processing sequence of ${sequence.length} tokens...`);
const result = model.forward(sequence);

console.log(`   Output sequence length: ${result.output.length}`);
console.log(`   Total homology loss: ${result.totalLoss.toFixed(6)}`);
console.log(`   Homology report:`);
console.log(`     Holes detected: ${result.homologyReport.hasHoles}`);
console.log(`     Total holes: ${result.homologyReport.totalHolesDetected}`);
console.log(`     Max Betti number: ${result.homologyReport.maxBettiNumber}`);
console.log(`     Layer reports: ${result.homologyReport.layerReports.length}`);

// Example 4: Training mode
console.log('\n4. Training vs Evaluation Mode:');
model.train(true);
console.log(`   Training mode: ${model.blocks[0].training}`);

model.eval();
console.log(`   After eval(): ${model.blocks[0].training}`);

// Example 5: CRT Configuration
console.log('\n5. CRT Configuration:');
const crtConfig = model.getCRTConfig();
console.log(`   Moduli: [${crtConfig.moduli.join(', ')}]`);
console.log(`   Heads: ${crtConfig.numHeads}`);
console.log(`   Temperature: ${crtConfig.temperature}`);
console.log(`   Head weights (first head): [${crtConfig.headWeights[0].map(w => w.toFixed(3)).join(', ')}]`);

console.log('\n✓ Example complete\n');