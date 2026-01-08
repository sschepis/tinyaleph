/**
 * @example DNA Encoding
 * @description Encode DNA sequences as prime-resonant semantic states
 * 
 * This example shows how TinyAleph encodes DNA sequences using prime numbers.
 * Each nucleotide maps to a specific prime:
 *   A (Adenine)  → 7   (purines get higher primes)
 *   T (Thymine)  → 2   (lowest energy, pairs with A)
 *   G (Guanine)  → 11  (highest prime, strongest purine)
 *   C (Cytosine) → 3   (pairs with G)
 *   U (Uracil)   → 5   (RNA only, replaces T)
 */

const { BioinformaticsBackend } = require('../../modular');

// Nucleotide prime mapping
const NUCLEOTIDE_PRIMES = { A: 7, T: 2, G: 11, C: 3, U: 5 };

// ===========================================
// SETUP
// ===========================================

// Create a bioinformatics backend
const backend = new BioinformaticsBackend();

// ===========================================
// EXAMPLE CODE
// ===========================================

// A sample DNA sequence (start codon + some bases)
const dnaSequence = 'ATGCGATCGATCG';

// Encode the DNA sequence - returns prime array
const primes = backend.encode(dnaSequence);

// Convert primes to hypercomplex state
const state = backend.primesToState(primes);

// ===========================================
// OUTPUT
// ===========================================

console.log('TinyAleph DNA Encoding Example');
console.log('==============================\n');

console.log('DNA Sequence:', dnaSequence);
console.log('Sequence Length:', dnaSequence.length, 'nucleotides');

console.log('\nNucleotide → Prime Mapping:');
console.log('  A (Adenine)  → 7');
console.log('  T (Thymine)  → 2');
console.log('  G (Guanine)  → 11');
console.log('  C (Cytosine) → 3');

console.log('\nPrime Encoding:');
for (let i = 0; i < dnaSequence.length; i++) {
    console.log(`  ${dnaSequence[i]} → ${primes[i]}`);
}

console.log('\nHypercomplex State (sedenion components):');
const components = state.c;  // Hypercomplex uses .c for components
console.log('  Real part:', components[0].toFixed(6));
console.log('  i:', components[1].toFixed(6));
console.log('  j:', components[2].toFixed(6));
console.log('  k:', components[3].toFixed(6));
console.log('  (remaining 12 dimensions...)\n');

// Verify decoding works
const decoded = backend.decode(primes);
console.log('Decoded sequence:', decoded);
console.log('Round-trip match:', decoded === dnaSequence ? 'YES ✓' : 'NO ✗');

// ===========================================
// COMPLEMENTARY STRAND
// ===========================================

console.log('\n==============================');
console.log('COMPLEMENTARY BASE PAIRING:');
console.log('==============================\n');

// Compute complement manually (A↔T, G↔C)
const COMPLEMENT = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
const complement = dnaSequence.split('').map(b => COMPLEMENT[b] || b).join('');

console.log('Original:   5\'-' + dnaSequence + '-3\'');
console.log('Complement: 3\'-' + complement + '-5\'');

// In DNA, A pairs with T, G pairs with C
console.log('\nBase pairing (prime products):');
for (let i = 0; i < Math.min(5, dnaSequence.length); i++) {
    const base1 = dnaSequence[i];
    const base2 = complement[i];
    const p1 = NUCLEOTIDE_PRIMES[base1];
    const p2 = NUCLEOTIDE_PRIMES[base2];
    console.log(`  ${base1}-${base2}: ${p1} × ${p2} = ${p1 * p2}`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n==============================');
console.log('KEY TAKEAWAYS:');
console.log('1. DNA nucleotides map to prime numbers (2, 3, 5, 7, 11)');
console.log('2. Prime encoding preserves sequence structure');
console.log('3. Hypercomplex states enable mathematical operations');
console.log('4. Complementary bases have related prime products');
console.log('5. Round-trip encoding/decoding is lossless');