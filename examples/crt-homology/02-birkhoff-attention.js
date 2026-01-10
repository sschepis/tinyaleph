#!/usr/bin/env node
/**
 * Example 02: Birkhoff Polytope Attention
 * 
 * Demonstrates projecting attention matrices onto the Birkhoff polytope
 * using the Sinkhorn-Knopp algorithm.
 * 
 * Key concepts:
 * - Birkhoff polytope = set of doubly-stochastic matrices (row sums = col sums = 1)
 * - Sinkhorn-Knopp: alternating row/column normalization until convergence
 * - Physical interpretation: attention as a "transport" operator
 */

'use strict';

const { BirkhoffProjector } = require('../../core/crt-homology');

console.log('=== Birkhoff Polytope Attention Example ===\n');

// Create projector with 20 Sinkhorn iterations
const projector = new BirkhoffProjector(20, 1e-10);

// Example 1: Project a random matrix
console.log('1. Random Matrix Projection:');
const randomMatrix = [
    [0.8, 0.2, 0.5],
    [0.3, 0.9, 0.1],
    [0.4, 0.6, 0.7]
];

console.log('   Input matrix:');
for (const row of randomMatrix) {
    console.log('   ', row.map(x => x.toFixed(3)).join('  '));
}

const projected = projector.project(randomMatrix);

console.log('\n   Doubly-stochastic projection:');
for (const row of projected) {
    console.log('   ', row.map(x => x.toFixed(3)).join('  '));
}

// Verify doubly-stochastic property
const validation = projector.validate(projected, 0.01);
console.log('\n   Validation:');
console.log(`     Is doubly-stochastic: ${validation.isDoublyStochastic}`);
console.log(`     Max row error: ${validation.maxRowError.toFixed(6)}`);
console.log(`     Max col error: ${validation.maxColError.toFixed(6)}`);

// Example 2: Attention mechanism
console.log('\n2. Birkhoff Attention:');

// Query, Key, Value matrices (4 tokens, dim=3)
const Q = [
    [1.0, 0.5, 0.2],
    [0.3, 0.8, 0.4],
    [0.6, 0.1, 0.9],
    [0.2, 0.7, 0.3]
];

const K = [
    [0.9, 0.4, 0.3],
    [0.2, 0.7, 0.5],
    [0.5, 0.3, 0.8],
    [0.4, 0.6, 0.2]
];

const V = [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
    [0.5, 0.5, 0.0]
];

console.log('   Queries (Q), Keys (K), Values (V): 4 tokens × 3 dims');

const attentionOutput = projector.attention(Q, K, V);

console.log('\n   Attention output:');
for (let i = 0; i < attentionOutput.length; i++) {
    console.log(`     Token ${i}: [${attentionOutput[i].map(x => x.toFixed(3)).join(', ')}]`);
}

// Example 3: Effect of iterations
console.log('\n3. Effect of Sinkhorn Iterations:');

const testMatrix = [
    [2.0, 1.0, 0.5],
    [0.5, 2.0, 1.0],
    [1.0, 0.5, 2.0]
];

for (const iterations of [1, 5, 10, 20]) {
    const proj = new BirkhoffProjector(iterations);
    const result = proj.project(testMatrix);
    const val = proj.validate(result);
    console.log(`   ${iterations.toString().padStart(2)} iters: max_error = ${val.maxRowError.toFixed(6)}`);
}

console.log('\n✓ Example complete\n');