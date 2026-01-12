/**
 * Example 02: Rédei Symbol and Borromean Primes
 * 
 * Demonstrates the Rédei symbol [p₁, p₂, p₃], the arithmetic analogue
 * of the triple linking number (Milnor's μ(123)). This captures
 * Borromean-type coherence: three primes with no pairwise coupling
 * but irreducible triadic coupling.
 * 
 * Key concepts:
 * - [p₁, p₂, p₃] ∈ {±1} when all pairwise Legendre symbols are +1
 * - Detects irreducible 3-body prime interactions
 * - Foundation for K³ triadic coupling tensor
 */

import { 
    RedeiSymbol, 
    LegendreSymbol,
    ArithmeticLinkKernel,
    quickBorromeanCheck,
    findBorromeanPrimes
} from '../../core/arithmetic-link-kernel.js';

console.log('=== Rédei Symbol: Triadic Prime Coupling ===\n');

// 1. Check Rédei computability
console.log('1. Checking Rédei Symbol Computability:');
console.log('   Requirements: distinct odd primes with (pᵢ/pⱼ) = 1 for all pairs');

const triples = [
    [5, 13, 17],
    [5, 7, 11],
    [3, 5, 7],
    [5, 29, 41]
];

for (const [p1, p2, p3] of triples) {
    const check = RedeiSymbol.isComputable(p1, p2, p3);
    const l12 = LegendreSymbol.compute(p1, p2);
    const l23 = LegendreSymbol.compute(p2, p3);
    const l31 = LegendreSymbol.compute(p3, p1);
    
    console.log(`   [${p1}, ${p2}, ${p3}]: computable=${check.computable}`);
    console.log(`      Legendre: (${p1}/${p2})=${l12}, (${p2}/${p3})=${l23}, (${p3}/${p1})=${l31}`);
    if (!check.computable) {
        console.log(`      Reason: ${check.reason}`);
    }
}
console.log();

// 2. Compute Rédei symbols for valid triples
console.log('2. Computing Rédei Symbols:');
for (const [p1, p2, p3] of triples) {
    const result = RedeiSymbol.compute(p1, p2, p3);
    if (result.computed) {
        console.log(`   [${p1}, ${p2}, ${p3}] = ${result.value}`);
        console.log(`      Method: ${result.method}`);
    } else {
        console.log(`   [${p1}, ${p2}, ${p3}]: not computable (${result.reason})`);
    }
}
console.log();

// 3. Borromean primes concept
console.log('3. Borromean Primes Concept:');
console.log('   Like Borromean rings: three linked rings where no two are linked,');
console.log('   Borromean primes have Jᵢⱼ = +1 (split) for all pairs but [p₁,p₂,p₃] ≠ 0\n');

// 4. Quick Borromean check
console.log('4. Quick Borromean Checks:');
const candidates = [
    [5, 13, 17],
    [5, 29, 41],
    [17, 41, 73],
    [5, 7, 11]
];

for (const [p1, p2, p3] of candidates) {
    const check = quickBorromeanCheck(p1, p2, p3);
    console.log(`   (${p1}, ${p2}, ${p3}): possible=${check.possible}`);
    if (check.isBorromean !== undefined) {
        console.log(`      isBorromean: ${check.isBorromean}`);
    }
    if (check.legendreSymbols) {
        const ls = check.legendreSymbols;
        console.log(`      Legendre: l12=${ls.l12}, l23=${ls.l23}, l31=${ls.l31}`);
    }
}
console.log();

// 5. Triadic coupling tensor K³
console.log('5. Triadic Coupling Tensor K³:');
const primes = [5, 7, 11, 13, 17, 19, 23];
const alk = new ArithmeticLinkKernel(primes);
const K3 = alk.K3;

console.log(`   Prime set: {${primes.join(', ')}}`);
console.log(`   Computed triadic entries: ${K3.entries.size}`);
console.log(`   Borromean triples found: ${K3.borromean.length}\n`);

if (K3.entries.size > 0) {
    console.log('   Sample K³ entries:');
    let count = 0;
    for (const [key, entry] of K3.entries) {
        if (count >= 5) break;
        const [i, j, k] = entry.indices;
        console.log(`      K³[${primes[i]},${primes[j]},${primes[k]}] = ${entry.value}`);
        count++;
    }
}

if (K3.borromean.length > 0) {
    console.log('\n   Borromean triples:');
    for (const b of K3.borromean.slice(0, 3)) {
        const ps = b.primes;
        console.log(`      {${ps.join(', ')}}: value = ${b.value}`);
    }
}
console.log();

// 6. Physical interpretation
console.log('6. Physical Interpretation for Resonance:');
console.log('   Pairwise coupling (J): oscillator phase locking via sin(θⱼ - θᵢ)');
console.log('   Triadic coupling (K³): three-body phase locking via sin(θⱼ + θₖ - 2θᵢ)');
console.log('   Borromean coherence: synchronization without pairwise locking\n');

console.log('=== End of Example ===');