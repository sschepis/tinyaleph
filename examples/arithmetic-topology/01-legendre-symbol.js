/**
 * Example 01: Legendre Symbol Coupling
 * 
 * Demonstrates the Legendre symbol (a/p), the mod-2 linking number
 * analogue in arithmetic topology. This is the foundational pairwise
 * coupling used in the Arithmetic Link Kernel.
 * 
 * Key concepts:
 * - (a/p) = a^((p-1)/2) mod p
 * - Returns +1 (quadratic residue), -1 (non-residue), or 0 (divisible)
 * - Satisfies quadratic reciprocity
 */

import { LegendreSymbol, computeLegendreMatrix } from '../../core/arithmetic-link-kernel.js';

console.log('=== Legendre Symbol: Pairwise Prime Coupling ===\n');

// 1. Basic Legendre symbol computation
console.log('1. Computing Legendre symbols:');
console.log('   (3/7) =', LegendreSymbol.compute(3, 7), '  (3 is a quadratic non-residue mod 7)');
console.log('   (2/7) =', LegendreSymbol.compute(2, 7), '   (2 is a quadratic residue mod 7)');
console.log('   (5/11) =', LegendreSymbol.compute(5, 11), '  (5 is a quadratic residue mod 11)');
console.log('   (7/7) =', LegendreSymbol.compute(7, 7), '   (7 divides 7)\n');

// 2. Quadratic reciprocity verification
console.log('2. Quadratic Reciprocity:');
console.log('   For odd primes p, q: (p/q)(q/p) = (-1)^((p-1)/2 * (q-1)/2)');

const testPairs = [[3, 5], [5, 7], [3, 11], [7, 13]];
for (const [p, q] of testPairs) {
    const pq = LegendreSymbol.compute(p, q);
    const qp = LegendreSymbol.compute(q, p);
    const expected = Math.pow(-1, ((p - 1) / 2) * ((q - 1) / 2));
    console.log(`   (${p}/${q})(${q}/${p}) = ${pq} × ${qp} = ${pq * qp}, expected = ${expected}`);
}
console.log();

// 3. Coupling encodings
console.log('3. Coupling Encodings:');
const symbol = LegendreSymbol.compute(3, 7);
console.log(`   Symbol (3/7) = ${symbol}`);
console.log('   Bipolar encoding:', LegendreSymbol.toCoupling(symbol, 'bipolar'));
console.log('   Binary encoding:', LegendreSymbol.toCoupling(symbol, 'binary'));
console.log('   Phase encoding:', LegendreSymbol.toCoupling(symbol, 'phase'), 'radians\n');

// 4. Coupling matrix for prime set
console.log('4. Coupling Matrix J for primes {5, 7, 11, 13}:');
const primes = [5, 7, 11, 13];
const J = computeLegendreMatrix(primes);

console.log('   J_ij = (p_i / p_j):\n');
console.log('        p_j =', primes.map(p => String(p).padStart(3)).join(' '));
for (let i = 0; i < primes.length; i++) {
    const row = J[i].map(v => String(v).padStart(3)).join(' ');
    console.log(`   p_i=${primes[i]}:`, row);
}
console.log();

// 5. Interpretation for resonance
console.log('5. Resonance Interpretation:');
console.log('   J_ij = +1: primes i,j are "in phase" (constructive coupling)');
console.log('   J_ij = -1: primes i,j are "out of phase" (destructive coupling)');
console.log('   J_ij = 0:  no coupling (one divides the other)\n');

// Count coupling types
let positive = 0, negative = 0;
for (let i = 0; i < primes.length; i++) {
    for (let j = i + 1; j < primes.length; j++) {
        if (J[i][j] === 1) positive++;
        else if (J[i][j] === -1) negative++;
    }
}
console.log(`   Statistics for {${primes.join(', ')}}:`);
console.log(`   - Constructive pairs: ${positive}`);
console.log(`   - Destructive pairs: ${negative}`);
console.log(`   - Net coupling tendency: ${positive > negative ? 'constructive' : 'destructive'}\n`);

console.log('=== End of Example ===');