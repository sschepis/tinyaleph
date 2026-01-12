/**
 * Example 04: Alexander Module and Fitting Ideals
 * 
 * Demonstrates the Complete Alexander Module A_ψ for prime sets,
 * including the Crowell exact sequence and Fitting ideals.
 * 
 * Key concepts:
 * - Crowell exact sequence: 0 → N^ab → A_ψ → I_{Z[H]} → 0
 * - Fitting ideals E_d(A_ψ): characteristic invariants
 * - Alexander polynomial Δ_0(A_ψ): generator of 0-th Fitting ideal
 */

import { 
    AlexanderModule,
    LaurentPolynomial,
    createAlexanderModule
} from '../../core/alexander-module.js';

console.log('=== Alexander Module: Module-Theoretic Invariants ===\n');

// 1. Create Alexander module from prime set
console.log('1. Creating Alexander Module:');
const primes = [5, 7, 11, 13];
const module = createAlexanderModule(primes, { ell: 2 });

console.log(`   Prime set S = {${primes.join(', ')}}`);
console.log(`   Base prime ℓ = ${module.ell}`);
console.log(`   Number of primes r = ${module.r}\n`);

// 2. Crowell exact sequence
console.log('2. Crowell Exact Sequence:');
console.log('   0 → N^ab → A_ψ → I_{Z[H]} → 0');
console.log();

const crowellSeq = module.crowellSequence;
const exactness = crowellSeq.verifyExactness();
console.log('   Exactness verification:');
console.log(`     - Injective at N^ab: ${exactness.injectiveAtNab}`);
console.log(`     - Exact at A_ψ: ${exactness.exactAtApsi}`);
console.log(`     - Surjective onto I: ${exactness.surjectiveOntoAugIdeal}`);

const splitting = crowellSeq.getSplitting();
console.log(`   Splitting: A_ψ ≅ N^ab ⊕ Λ̂ (${splitting.directSum})`);
console.log(`   Fitting shift: E_d(N^ab) = E_{d+1}(A_ψ)\n`);

// 3. Fitting ideals
console.log('3. Fitting Ideals E_d(A_ψ):');
console.log('   These are characteristic ideals analogous to Alexander polynomials.\n');

const ideals = module.getAllFittingIdeals(3);
for (const [d, ideal] of Object.entries(ideals)) {
    const charPoly = ideal.characteristicPolynomial;
    console.log(`   E_${d}(A_ψ):`);
    console.log(`     - Is trivial: ${ideal.isTrivial}`);
    console.log(`     - Is zero: ${ideal.isZero}`);
    console.log(`     - Characteristic poly degree: ${charPoly.degree}`);
    console.log(`     - Signature hash: ${ideal.signatureHash}`);
}
console.log();

// 4. Alexander polynomial
console.log('4. Alexander Polynomial Δ_0(A_ψ):');
const alexPoly = module.alexanderPolynomial;
console.log(`   Δ₀(A_ψ) = ${alexPoly.toString()}`);
console.log(`   Degree: ${alexPoly.degree}`);
console.log(`   Min power: ${alexPoly.minPower}`);
console.log(`   Max power: ${alexPoly.maxPower}\n`);

// Evaluate on unit circle
console.log('   Evaluation on unit circle (roots of unity):');
const roots = [1, 2, 3, 4, 6, 12];
for (const n of roots) {
    const theta = 2 * Math.PI / n;
    const val = alexPoly.evaluateOnCircle(theta);
    console.log(`     ζ_${n.toString().padStart(2)} (${(theta * 180 / Math.PI).toFixed(1)}°): |Δ| = ${val.abs.toFixed(4)}`);
}
console.log();

// 5. Compare different prime sets
console.log('5. Comparing Prime Sets:');
const primeSets = [
    [3, 5, 7],
    [5, 7, 11],
    [7, 11, 13],
    [5, 7, 11, 13],
    [3, 5, 7, 11, 13]
];

console.log('   S                  | degree | E_0 hash');
console.log('   -------------------|--------|----------');

for (const S of primeSets) {
    const m = createAlexanderModule(S);
    const ap = m.alexanderPolynomial;
    const e0 = m.computeFittingIdeal(0);
    const setStr = `{${S.join(',')}}`.padEnd(17);
    console.log(`   ${setStr} | ${String(ap.degree).padStart(6)} | ${e0.signatureHash}`);
}
console.log();

// 6. Module statistics
console.log('6. Module Statistics:');
const stats = module.stats;
console.log(`   Number of primes: ${stats.numPrimes}`);
console.log(`   Alexander degree: ${stats.alexanderDegree}`);
console.log(`   Signature hash: ${stats.signatureHash}`);
console.log(`   Mean characteristic value: ${stats.meanCharacteristicValue.toFixed(4)}\n`);

// 7. Serialization
console.log('7. Serialization:');
const json = module.toJSON();
console.log(`   JSON keys: ${Object.keys(json).join(', ')}`);
console.log(`   Primes: [${json.primes.join(', ')}]`);
console.log(`   ℓ: ${json.ell}`);
console.log(`   Field: ${json.field}\n`);

console.log('=== End of Example ===');