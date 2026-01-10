#!/usr/bin/env node
/**
 * Example 03: Homology Loss for Consistency Detection
 * 
 * Demonstrates detecting "holes" in residue space - consistency failures
 * that persist under perturbation.
 * 
 * Key insight: "Holes are not degrees of freedom. Holes are consistency
 * failures that persist under perturbation."
 * 
 * Key concepts:
 * - Ker(ℛ) = { r | ε(r) > τ } (kernel = high reconstruction error)
 * - Cycles in kernel represent semantic inconsistencies
 * - Betti numbers: β₀ = components, β₁ = holes (1-cycles)
 * - ℒ_homology = Σ_{cycles} f(cycle) penalizes inconsistency
 */

'use strict';

const {
    CRTReconstructor,
    HomologyLoss,
    DEFAULT_PRIMES_SMALL
} = require('../../core/crt-homology');

console.log('=== Homology Loss Example ===\n');

const primes = DEFAULT_PRIMES_SMALL;
const crt = new CRTReconstructor(primes);
const homology = new HomologyLoss({
    tau: 0.1,     // Kernel detection threshold
    alpha: 1.0,   // Cycle length exponent
    beta: 1.0,    // Residue weight
    gamma: 0.5,   // Residue exponent
    lambda: 1.0   // Overall loss weight
});

console.log(`Moduli: [${primes.join(', ')}], Product P = ${crt.P}\n`);

// Example 1: Consistent residue batch (no holes)
console.log('1. Consistent Residue Batch:');
const consistentBatch = [];
for (let i = 0; i < 10; i++) {
    // Generate residues that are consistent (low error)
    const L = Math.floor(Math.random() * crt.P);
    const residues = primes.map(p => L % p);
    consistentBatch.push(residues);
}

console.log('   Generated 10 consistent residue tuples');
const consistentResult = homology.compute(consistentBatch, crt);
console.log(`   Cycles detected: ${consistentResult.cycles}`);
console.log(`   Homology loss: ${consistentResult.loss.toFixed(6)}`);
console.log(`   Total points in kernel: ${consistentResult.totalPoints}`);

const betti1 = homology.computeBettiNumbers(consistentBatch, crt);
console.log(`   Betti numbers: β₀=${betti1.beta0}, β₁=${betti1.beta1}`);

// Example 2: Inconsistent residue batch (with holes)
console.log('\n2. Inconsistent Residue Batch:');
const inconsistentBatch = [];
for (let i = 0; i < 10; i++) {
    // Generate residues that may be inconsistent
    // (random values that don't correspond to valid CRT reconstruction)
    const residues = primes.map(p => Math.random() * p);
    inconsistentBatch.push(residues);
}

console.log('   Generated 10 random (potentially inconsistent) residue tuples');
const inconsistentResult = homology.compute(inconsistentBatch, crt);
console.log(`   Cycles detected: ${inconsistentResult.cycles}`);
console.log(`   Homology loss: ${inconsistentResult.loss.toFixed(6)}`);
console.log(`   Total points in kernel: ${inconsistentResult.totalPoints}`);

const betti2 = homology.computeBettiNumbers(inconsistentBatch, crt);
console.log(`   Betti numbers: β₀=${betti2.beta0}, β₁=${betti2.beta1}`);

// Example 3: Mixed batch
console.log('\n3. Mixed Batch (alternating consistent/inconsistent):');
const mixedBatch = [];
for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
        // Consistent
        const L = Math.floor(Math.random() * crt.P);
        mixedBatch.push(primes.map(p => L % p));
    } else {
        // Inconsistent
        mixedBatch.push(primes.map(p => Math.random() * p));
    }
}

console.log('   Generated 10 mixed residue tuples');
const mixedResult = homology.compute(mixedBatch, crt);
console.log(`   Cycles detected: ${mixedResult.cycles}`);
console.log(`   Homology loss: ${mixedResult.loss.toFixed(6)}`);

if (mixedResult.details.length > 0) {
    console.log('\n   Cycle details:');
    for (const detail of mixedResult.details) {
        console.log(`     Length ${detail.length}: loss=${detail.loss.toFixed(4)}, ` +
                    `mean_error=${detail.meanError.toFixed(4)}`);
    }
}

// Example 4: Persistence analysis
console.log('\n4. Cycle Persistence (robustness of holes):');

// Create a persistent hole (cluster of inconsistent points)
const persistentBatch = [];
for (let i = 0; i < 20; i++) {
    if (i >= 5 && i <= 10) {
        // Create a cluster of high-error points
        persistentBatch.push([0.99, 0.01, 0.5, 0.5]);
    } else {
        const L = Math.floor(Math.random() * crt.P);
        persistentBatch.push(primes.map(p => L % p));
    }
}

const cycles = homology.detectCycles(persistentBatch, crt);
console.log(`   Batch size: 20, Cluster at indices 5-10`);
console.log(`   Detected ${cycles.length} cycle(s)`);

for (const cycle of cycles) {
    const persistence = homology.cyclePersistence(cycle);
    console.log(`     Cycle of length ${cycle.length}: persistence=${persistence.toFixed(4)}`);
}

const betti3 = homology.computeBettiNumbers(persistentBatch, crt);
console.log(`   Final Betti numbers: β₀=${betti3.beta0}, β₁=${betti3.beta1}`);

console.log('\n✓ Example complete\n');