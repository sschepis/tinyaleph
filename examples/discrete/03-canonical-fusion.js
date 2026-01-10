/**
 * Example 03: Canonical Fusion Selection
 * 
 * Demonstrates deterministic FUSE(p,q,r) selection from discrete.pdf
 * using the canonical triad ordering constraint.
 */

const { 
    canonicalTriad, 
    canonicalFusion, 
    canonicalTriadForTarget, 
    verifyCanonical 
} = require('../../apps/sentient/lib/prime-calculus');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Canonical Fusion Selection');
console.log('═══════════════════════════════════════════════════════════════\n');

// The problem with non-canonical fusion
console.log('1. The Non-Determinism Problem\n');
console.log('   Given target prime P, many (p, q, r) triads satisfy p + q + r = P:');
console.log('   • 19 = 3 + 5 + 11 = 3 + 7 + 9 = 5 + 7 + 7 = ...');
console.log('   • 29 = 3 + 7 + 19 = 5 + 7 + 17 = 5 + 11 + 13 = ...');
console.log('\n   Which one to choose? Canonical ordering provides determinism.\n');

// Canonical ordering
console.log('2. Canonical Ordering\n');
console.log('   Definition: A triad (p, q, r) is canonical if:');
console.log('   1. p ≤ q ≤ r (non-decreasing order)');
console.log('   2. All are prime');
console.log('   3. p is the smallest possible first element');
console.log('   4. Given p, q is the smallest possible second element\n');

// Verify triads
const testTriads = [
    [3, 5, 11],    // 19 - canonical
    [5, 3, 11],    // 19 - not canonical (order)
    [11, 5, 3],    // 19 - not canonical (order)
    [2, 2, 2],     // 6 - not prime sum
    [2, 3, 2],     // 7 - not ordered
];

console.log('   Testing triad canonicity:\n');
console.log('   ┌─────────────────┬───────────┬──────────────────────┐');
console.log('   │ Triad           │ Sum       │ Canonical?           │');
console.log('   ├─────────────────┼───────────┼──────────────────────┤');

for (const triad of testTriads) {
    const sum = triad.reduce((a, b) => a + b, 0);
    const result = verifyCanonical(triad);
    const status = result.isCanonical ? '✓ Yes' : `✗ No (${result.reason})`;
    console.log(`   │ (${triad.join(', ')})`.padEnd(18) + `│ ${sum.toString().padEnd(9)} │ ${status.slice(0, 20).padEnd(20)} │`);
}
console.log('   └─────────────────┴───────────┴──────────────────────┘');

// Finding canonical triads
console.log('\n3. Finding Canonical Triads for Target Primes\n');

const targetPrimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41];

console.log('   ┌────────┬─────────────────┬───────────────────────┐');
console.log('   │ Target │ Canonical Triad │ Verification          │');
console.log('   ├────────┼─────────────────┼───────────────────────┤');

for (const target of targetPrimes) {
    const triad = canonicalTriadForTarget(target);
    if (triad) {
        const verification = verifyCanonical(triad);
        const status = verification.isCanonical ? '✓ Verified' : '✗ Failed';
        console.log(`   │ ${target.toString().padEnd(6)} │ (${triad.join(', ')})`.padEnd(27) + `│ ${status.padEnd(21)} │`);
    } else {
        console.log(`   │ ${target.toString().padEnd(6)} │ (none)`.padEnd(27) + `│ No valid decomposition │`);
    }
}
console.log('   └────────┴─────────────────┴───────────────────────┘');

// Canonical fusion operation
console.log('\n4. Canonical Fusion Operation\n');

console.log('   FUSE(p, q, r) automatically:');
console.log('   1. Reorders arguments to canonical form');
console.log('   2. Verifies sum is prime');
console.log('   3. Returns fusion result\n');

const fusionTests = [
    [5, 3, 11],    // Will be reordered to (3, 5, 11)
    [11, 7, 5],    // Will be reordered to (5, 7, 11)
    [2, 2, 3],     // Sum = 7 (prime)
];

for (const [p, q, r] of fusionTests) {
    const result = canonicalFusion(p, q, r);
    if (result.success) {
        console.log(`   FUSE(${p}, ${q}, ${r}):`);
        console.log(`     Canonical form: (${result.canonical.join(', ')})`);
        console.log(`     Result: ${result.result}\n`);
    } else {
        console.log(`   FUSE(${p}, ${q}, ${r}): Failed - ${result.reason}\n`);
    }
}

// Uniqueness guarantee
console.log('5. Uniqueness Guarantee\n');

console.log('   For any prime P with a valid decomposition,');
console.log('   canonical selection returns a UNIQUE triad.\n');

// Show that different orderings give same canonical result
const target = 19;
const orderings = [
    [3, 5, 11],
    [5, 3, 11],
    [11, 3, 5],
    [11, 5, 3],
    [3, 11, 5],
    [5, 11, 3],
];

console.log(`   All orderings of 3+5+11 = ${target}:\n`);

for (const ordering of orderings) {
    const canonical = canonicalTriad(ordering);
    console.log(`   (${ordering.join(', ')}) → canonical: (${canonical.join(', ')})`);
}

// Applications
console.log('\n6. Applications\n');

console.log('   Canonical fusion enables:');
console.log('   • Deterministic distributed consensus');
console.log('   • Reproducible semantic transformations');
console.log('   • Unique normal forms for proofs');
console.log('   • Consistent cross-node behavior');

console.log('\n═══════════════════════════════════════════════════════════════\n');