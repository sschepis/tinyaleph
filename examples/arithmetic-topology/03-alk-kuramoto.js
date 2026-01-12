/**
 * Example 03: ALK-Kuramoto Synchronization
 * 
 * Demonstrates the ALK-Kuramoto model, which extends standard Kuramoto
 * oscillator dynamics with Arithmetic Link Kernel couplings.
 * 
 * Standard Kuramoto: dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)
 * 
 * ALK-Kuramoto: dθᵢ/dt = ωᵢ + Σⱼ Jᵢⱼ sin(θⱼ - θᵢ) 
 *                          + Σⱼ<ₖ K³ᵢⱼₖ sin(θⱼ + θₖ - 2θᵢ)
 * 
 * The pairwise coupling Jᵢⱼ comes from Legendre symbols.
 * The triadic coupling K³ᵢⱼₖ comes from Rédei symbols.
 */

import { 
    createALKKuramoto,
    createALKNetworkKuramoto,
    runBorromeanExperiment
} from '../../physics/alk-kuramoto.js';
import { ArithmeticLinkKernel } from '../../core/arithmetic-link-kernel.js';

console.log('=== ALK-Kuramoto: Prime-Coupled Oscillator Synchronization ===\n');

// 1. Create basic ALK-Kuramoto model
console.log('1. Creating ALK-Kuramoto Model:');
const primes = [5, 7, 11, 13, 17, 19, 23, 29];
const model = createALKKuramoto(primes, {
    couplingScale: 0.2,    // Scale for J matrix coupling
    triadicScale: 0.1,     // Scale for K³ tensor coupling
    useTriadic: true,       // Enable triadic coupling
    dt: 0.01               // Time step
});

console.log(`   Primes: {${primes.join(', ')}}`);
console.log(`   Natural frequencies ωᵢ = ln(pᵢ):`);
console.log(`   ${primes.map(p => Math.log(p).toFixed(3)).join(', ')}\n`);

// 2. Initial state
console.log('2. Initial State (random phases):');
console.log(`   Order parameter r = ${model.orderParameter().toFixed(4)}`);
console.log(`   Mean phase Ψ = ${(model.meanPhase() * 180 / Math.PI).toFixed(2)}°`);
console.log(`   Triadic coherence = ${model.triadicCoherence().toFixed(4)}\n`);

// 3. Evolve the system
console.log('3. Evolution (1000 steps, dt=0.01):');
const history = [];
for (let i = 0; i < 1000; i++) {
    model.step();
    if (i % 200 === 0) {
        history.push({
            step: i,
            time: model.time,
            r: model.orderParameter(),
            triadic: model.triadicCoherence()
        });
    }
}
history.push({
    step: 1000,
    time: model.time,
    r: model.orderParameter(),
    triadic: model.triadicCoherence()
});

console.log('   Step   Time    Order(r)  Triadic');
for (const h of history) {
    console.log(`   ${String(h.step).padStart(4)}   ${h.time.toFixed(2)}   ${h.r.toFixed(4)}    ${h.triadic.toFixed(4)}`);
}
console.log();

// 4. Phase locking analysis
console.log('4. Phase Locking Analysis:');
const lockedPairs = model.findLockedPairs(Math.PI / 6);
console.log(`   Locked pairs (|θᵢ - θⱼ| < π/6): ${lockedPairs.length}`);
if (lockedPairs.length > 0) {
    console.log('   Sample locked pairs:');
    for (const pair of lockedPairs.slice(0, 3)) {
        const diff = (pair.phaseDiff * 180 / Math.PI).toFixed(2);
        console.log(`      (${pair.primes[0]}, ${pair.primes[1]}): Δθ = ${diff}°, J = ${pair.coupling}`);
    }
}

const lockedTriads = model.findLockedTriads(Math.PI / 4);
console.log(`   Locked triads: ${lockedTriads.length}`);
if (lockedTriads.length > 0) {
    console.log('   Sample locked triads:');
    for (const triad of lockedTriads.slice(0, 3)) {
        console.log(`      {${triad.primes.join(', ')}}: coherence = ${triad.coherence.toFixed(4)}`);
    }
}
console.log();

// 5. Network Kuramoto with symmetrized coupling
console.log('5. Network ALK-Kuramoto (symmetrized coupling):');
const networkModel = createALKNetworkKuramoto(primes, {
    useSymmetric: true,
    couplingScale: 0.2
});

// Evolve
for (let i = 0; i < 500; i++) {
    networkModel.step();
}

console.log(`   Final order parameter: ${networkModel.orderParameter().toFixed(4)}`);
console.log(`   Clustering coefficient: ${networkModel.clusteringCoefficient().toFixed(4)}`);
console.log(`   Small-world coefficient: ${networkModel.smallWorldCoefficient().toFixed(4)}\n`);

// 6. Borromean synchronization experiment
console.log('6. Borromean Synchronization Experiment:');
console.log('   Comparing models with and without triadic coupling...\n');

const largePrimes = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
const experiment = runBorromeanExperiment(largePrimes, {
    steps: 500,
    dt: 0.01
});

console.log(`   Borromean triples found: ${experiment.borromeanTriples.length}`);
console.log(`   With triadic coupling:`);
console.log(`      Final r: ${experiment.triadicModel.finalR.toFixed(4)}`);
console.log(`      Final triadic coherence: ${experiment.triadicModel.finalTriadic.toFixed(4)}`);
console.log(`   Without triadic coupling:`);
console.log(`      Final r: ${experiment.pairwiseModel.finalR.toFixed(4)}`);
console.log(`      Final triadic coherence: ${experiment.pairwiseModel.finalTriadic.toFixed(4)}`);
console.log(`   Comparison:`);
console.log(`      r difference: ${experiment.comparison.rDifference.toFixed(4)}`);
console.log(`      Triadic coherence difference: ${experiment.comparison.triadicDifference.toFixed(4)}\n`);

// 7. Interpretation
console.log('7. Physical Interpretation:');
console.log('   - Legendre symbol coupling (J) drives pairwise phase locking');
console.log('   - Rédei symbol coupling (K³) enables Borromean synchronization');
console.log('   - Triadic coupling can synchronize oscillators that resist pairwise locking');
console.log('   - Prime structure determines the synchronization landscape\n');

console.log('=== End of Example ===');