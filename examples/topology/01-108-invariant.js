/**
 * Example 01: The 108 Invariant
 *
 * Demonstrates the fundamental 108 = 2² × 3³ invariant from 108bio.pdf
 * that generates gauge symmetries and physical constants.
 */

const {
    TWIST_108,
    twistAngle,
    totalTwist,
    isTwistClosed,
    findClosingPrimes
} = require('../../core/prime');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  The 108 Invariant: Minimal Closed-Form Twist Configuration');
console.log('═══════════════════════════════════════════════════════════════\n');

// Basic properties
console.log('1. Basic Properties of 108\n');
console.log(`   Value: ${TWIST_108.value}`);
console.log(`   Factorization: ${TWIST_108.binary} × ${TWIST_108.ternary} = 2² × 3³`);
console.log(`   Mod-30 boundary: ${TWIST_108.mod30Boundary} (prime sieve limit)\n`);

// Twist angles
console.log('2. Twist Angles (κ = 360°/p)\n');
const fundamentalPrimes = [2, 3, 5, 7, 11, 13];
for (const p of fundamentalPrimes) {
    const angle = twistAngle(p);
    console.log(`   κ(${p}) = ${angle.toFixed(2)}°`);
}

// Closure demonstration
console.log('\n3. Twist Closure (sum must be multiple of 360°)\n');

const testSets = [
    [2, 2],           // 180 + 180 = 360
    [2, 3, 3],        // 180 + 120 + 120 = 420 (not closed)
    [3, 3, 3],        // 120 + 120 + 120 = 360
    [2, 3, 3, 3],     // 180 + 120 + 120 + 120 = 540 (not closed)
    [2, 2, 3, 3, 3],  // 180 + 180 + 120 + 120 + 120 = 720 (2 × 360)
];

for (const primes of testSets) {
    const total = totalTwist(primes);
    const closed = isTwistClosed(primes);
    console.log(`   [${primes.join(', ')}] → ${total.toFixed(0)}° ${closed ? '✓ CLOSED' : '✗ open'}`);
}

// Resonance detection
console.log('\n4. 108-Resonance Detection\n');
const testNumbers = [54, 108, 216, 324, 100, 137];
for (const n of testNumbers) {
    const resonates = TWIST_108.resonates(n);
    console.log(`   ${n} ${resonates ? '✓ resonates (n/108 = ' + n/108 + ')' : '✗ does not resonate'}`);
}

// Find primes that form closing sets
console.log('\n5. Finding Closing Prime Sets\n');
console.log('   Searching for primes that would close an open sequence...\n');

// Start with a single prime [5] and find what would close it
const currentSequence = [5];
const candidates = findClosingPrimes(currentSequence);
console.log(`   Current sequence: [${currentSequence.join(', ')}] = ${totalTwist(currentSequence).toFixed(1)}°`);
console.log('   Top candidates to close:\n');
for (const candidate of candidates.slice(0, 5)) {
    console.log(`   + ${candidate.prime} → error ${candidate.error.toFixed(2)}° ${candidate.closesAt ? '✓ CLOSES' : ''}`);
}

// Physical significance
console.log('\n6. Physical Significance\n');
console.log('   The 108 invariant appears throughout physics:\n');
console.log(`   • 108 = 2² × 3³ generates SU(3) × SU(2) × U(1) gauge group`);
console.log(`   • Fine structure: α⁻¹ = 108 + 29 = 137`);
console.log(`   • Mass ratio: 17 × 108 = 1836 (proton/electron)`);
console.log(`   • Hindu/Buddhist: 108 beads, 108 sacred names`);
console.log(`   • Geometry: interior angles of pentagon = 108°`);

console.log('\n═══════════════════════════════════════════════════════════════\n');