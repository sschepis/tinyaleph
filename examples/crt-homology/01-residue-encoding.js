#!/usr/bin/env node
/**
 * Example 01: Residue Encoding with CRT
 * 
 * Demonstrates encoding a hidden vector into K residue distributions
 * over coprime moduli, then reconstructing via Chinese Remainder Theorem.
 * 
 * Key concepts:
 * - r_k = softmax(W_k h + b_k) ∈ Δ(ℤ/p_k) for each prime p_k
 * - L̂ = Σ_k E[r_k] * M_k * M_k^{-1} mod P (CRT reconstruction)
 * - Kernel detection: Ker(ℛ) ≈ { r | ε(r) > τ }
 */

'use strict';

const {
    ResidueEncoder,
    CRTReconstructor,
    DEFAULT_PRIMES_SMALL
} = require('../../core/crt-homology');

console.log('=== CRT Residue Encoding Example ===\n');

// Use first 4 primes as moduli: [2, 3, 5, 7]
// Product P = 210
const primes = DEFAULT_PRIMES_SMALL;
const hiddenDim = 16;

console.log(`Moduli (primes): ${primes}`);
console.log(`Product P = ${primes.reduce((a, b) => a * b, 1)}`);
console.log(`Hidden dimension: ${hiddenDim}\n`);

// Create encoder and reconstructor
const encoder = new ResidueEncoder(primes, hiddenDim, { initScale: 0.1 });
const crt = new CRTReconstructor(primes);

// Create a sample hidden vector
const h = new Float64Array(hiddenDim);
for (let i = 0; i < hiddenDim; i++) {
    h[i] = Math.sin(i * 0.5) * 0.5 + 0.5;  // Values in [0, 1]
}

console.log('Input hidden vector (first 8 dims):');
console.log('  h =', Array.from(h.slice(0, 8)).map(x => x.toFixed(3)).join(', '), '...\n');

// Encode to residue distributions
const residues = encoder.encode(h);
const expectedResidues = encoder.expectedResidues(residues);

console.log('Residue distributions:');
for (let k = 0; k < primes.length; k++) {
    const p = primes[k];
    const r = residues[k];
    console.log(`  mod ${p}: [${Array.from(r).map(x => x.toFixed(3)).join(', ')}]`);
    console.log(`  E[r_${k}] = ${expectedResidues[k].toFixed(4)}`);
}

// CRT reconstruction
const L = crt.reconstruct(expectedResidues);
const error = crt.reconstructionError(expectedResidues);
const validation = crt.validate(expectedResidues);

console.log('\n=== CRT Reconstruction ===');
console.log(`  Reconstructed L̂ = ${L.toFixed(4)}`);
console.log(`  Reconstruction error ε(r) = ${error.toFixed(6)}`);
console.log(`  In kernel: ${validation.inKernel}`);
console.log(`  Valid (not in kernel): ${validation.valid}`);

// Demonstrate kernel detection with inconsistent residues
console.log('\n=== Kernel Detection ===');
console.log('Testing with inconsistent residue tuples:\n');

const testCases = [
    { residues: [0.5, 1.2, 2.8, 4.1], label: 'Consistent (low error)' },
    { residues: [0.99, 0.01, 2.5, 3.99], label: 'Boundary values' },
    { residues: [0.1, 0.2, 0.3, 0.4], label: 'Small residues' }
];

for (const tc of testCases) {
    const val = crt.validate(tc.residues, 0.1);
    console.log(`  ${tc.label}:`);
    console.log(`    Residues: [${tc.residues.join(', ')}]`);
    console.log(`    L̂ = ${val.reconstructed.toFixed(2)}, ε = ${val.error.toFixed(4)}`);
    console.log(`    In kernel: ${val.inKernel}\n`);
}

console.log('✓ Example complete\n');