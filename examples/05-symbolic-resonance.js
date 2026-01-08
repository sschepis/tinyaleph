/**
 * Example: Golden Ratio Resonance
 * 
 * Demonstrates the resonance calculator and its ability to detect
 * naturally harmonic relationships between primes based on the golden ratio.
 */

const {
  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  PHI,
  calculateResonance,
  findGoldenPairs
} = require('../core');

console.log('='.repeat(60));
console.log('Golden Ratio Resonance Calculator');
console.log('='.repeat(60));
console.log(`\nGolden Ratio (φ): ${PHI.toFixed(10)}`);

// ─────────────────────────────────────────────────────────────────
// Basic Resonance Calculation
// ─────────────────────────────────────────────────────────────────

console.log('\n1. Basic Resonance Between Primes');
console.log('-'.repeat(40));

const pairs = [
  [2, 3],
  [3, 5],  // Fibonacci pair - ratio ≈ 1.667
  [5, 8],  // Fibonacci pair - ratio = 1.6
  [7, 11],
  [11, 13]
];

for (const [p1, p2] of pairs) {
  const r = calculateResonance(p1, p2);
  const ratio = p2 / p1;
  const isGolden = Math.abs(ratio - PHI) < 0.1;
  console.log(
    `  ${p1} × ${p2}: ratio=${ratio.toFixed(3)}, ` +
    `resonance=${r.toFixed(4)}${isGolden ? ' ★ golden!' : ''}`
  );
}

// ─────────────────────────────────────────────────────────────────
// Find Golden Pairs
// ─────────────────────────────────────────────────────────────────

console.log('\n2. Golden Ratio Pairs (First 20 Primes)');
console.log('-'.repeat(40));

const first20 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
const goldenPairs = findGoldenPairs(first20);

if (goldenPairs.length === 0) {
  console.log('  No exact golden ratio pairs found (φ threshold: 0.1)');
} else {
  for (const pair of goldenPairs.slice(0, 5)) {
    console.log(`  ${pair.p1}/${pair.p2} = ${pair.ratio.toFixed(5)} (resonance: ${pair.resonance.toFixed(4)})`);
  }
}

// Fibonacci numbers for comparison
console.log('\n  Fibonacci numbers for reference:');
const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
for (let i = 1; i < fib.length - 1; i++) {
  const ratio = fib[i + 1] / fib[i];
  console.log(`    ${fib[i]}/${fib[i+1]} = ${ratio.toFixed(5)}`);
}

// ─────────────────────────────────────────────────────────────────
// Resonance Signature
// ─────────────────────────────────────────────────────────────────

console.log('\n3. Resonance Signatures');
console.log('-'.repeat(40));

const sets = [
  { name: 'Small primes', primes: [2, 3, 5, 7] },
  { name: 'Twin primes', primes: [3, 5, 11, 13, 17, 19] },
  { name: 'Large primes', primes: [97, 101, 103, 107, 109] },
  { name: 'Fibonacci primes', primes: [2, 3, 5, 13, 89, 233] }
];

for (const set of sets) {
  const sig = resonanceSignature(set.primes);
  console.log(`  ${set.name}: mean=${sig.mean.toFixed(4)}, variance=${sig.variance.toFixed(6)}, goldenPairs=${sig.goldenCount}`);
}

// ─────────────────────────────────────────────────────────────────
// Resonance Matrix
// ─────────────────────────────────────────────────────────────────

console.log('\n4. Resonance Matrix (First 5 Primes)');
console.log('-'.repeat(40));

const calc = new ResonanceCalculator();
const primes5 = [2, 3, 5, 7, 11];
const matrix = calc.calculateMatrix(primes5);

// Header
console.log('       ' + primes5.map(p => p.toString().padStart(6)).join(' '));

// Rows
for (let i = 0; i < primes5.length; i++) {
  const row = matrix[i].map(v => v.toFixed(3).padStart(6)).join(' ');
  console.log(`  ${primes5[i].toString().padStart(3)}  ${row}`);
}

// ─────────────────────────────────────────────────────────────────
// Find Most Resonant
// ─────────────────────────────────────────────────────────────────

console.log('\n5. Most Resonant Prime');
console.log('-'.repeat(40));

const target = 5;
const candidates = [2, 7, 11, 13, 17, 19, 23];
const most = calc.findMostResonant(target, candidates);

console.log(`  Target: ${target}`);
console.log(`  Candidates: [${candidates.join(', ')}]`);
console.log(`  Most resonant: ${most.prime} (resonance: ${most.resonance.toFixed(4)})`);

// ─────────────────────────────────────────────────────────────────
// Resonance Clusters
// ─────────────────────────────────────────────────────────────────

console.log('\n6. Resonance Clusters');
console.log('-'.repeat(40));

const manyPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
const clusters = calc.findClusters(manyPrimes, 0.4);

console.log(`  Primes: [${manyPrimes.join(', ')}]`);
console.log(`  Threshold: 0.4`);
console.log(`  Clusters found: ${clusters.length}`);
for (let i = 0; i < clusters.length; i++) {
  console.log(`    Cluster ${i + 1}: [${clusters[i].join(', ')}]`);
}

console.log('\n' + '='.repeat(60));
console.log('Resonance theory: Primes with ratios near φ have natural harmony');
console.log('='.repeat(60));