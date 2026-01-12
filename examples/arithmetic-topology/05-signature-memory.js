/**
 * Example 05: Signature Memory and Content-Addressable Retrieval
 *
 * Demonstrates using Alexander module signatures as content-addressable
 * keys for associative memory operations.
 *
 * Key concepts:
 * - Module signatures: Σ_{k,S,ℓ,ψ} = unique fingerprint of A_ψ(S)
 * - SignatureMemory: hash-based storage with similarity search
 * - Resonance matching: finding related prime configurations
 */

import {
    SignatureMemory,
    createAlexanderModule,
    extractSignature,
    ModuleSignature
} from '../../core/alexander-module.js';

console.log('=== Signature Memory: Content-Addressable Prime Retrieval ===\n');

// 1. Initialize signature memory
console.log('1. Creating Signature Memory:');
const memory = new SignatureMemory();
console.log('   Initialized empty signature memory\n');

// 2. Store prime configurations
console.log('2. Storing Prime Configurations:');
const configs = [
    { primes: [3, 5, 7], label: 'small-triple' },
    { primes: [5, 7, 11], label: 'mid-triple-1' },
    { primes: [7, 11, 13], label: 'mid-triple-2' },
    { primes: [11, 13, 17], label: 'large-triple' },
    { primes: [5, 7, 11, 13], label: 'quadruple-1' },
    { primes: [7, 11, 13, 17], label: 'quadruple-2' },
    { primes: [3, 5, 7, 11, 13], label: 'quintuple' }
];

for (const { primes, label } of configs) {
    const module = createAlexanderModule(primes);
    const sig = extractSignature(primes);
    memory.store(sig);
    console.log(`   Stored ${label}: S = {${primes.join(',')}}, sig hash = ${sig.hash.toString(16).slice(0, 16)}...`);
}
console.log(`   Total stored: ${memory.size} signatures\n`);

// 3. Exact retrieval
console.log('3. Exact Signature Retrieval:');
const queryPrimes = [5, 7, 11];
const querySig = extractSignature(queryPrimes);
const exact = memory.get(querySig.hash);

if (exact) {
    console.log(`   Query: S = {${queryPrimes.join(',')}}`);
    console.log(`   Found: primes = {${exact.primes.join(',')}}`);
    console.log(`   Alexander polynomial: ${exact.alexanderPolynomial}\n`);
} else {
    console.log(`   Not found\n`);
}

// 4. Similarity search
console.log('4. Similarity Search:');
const searchPrimes = [5, 7, 13]; // Not stored exactly
const searchSig = extractSignature(searchPrimes);
const similar = memory.findClosest(searchSig, 3);

console.log(`   Query: S = {${searchPrimes.join(',')}}`);
console.log('   Similar configurations:');
for (const { signature, distance } of similar) {
    console.log(`     - {${signature.primes.join(',')}}: distance = ${distance.toFixed(4)}`);
}
console.log();

// 5. Signatures by prime
console.log('5. Signatures Containing Specific Prime:');
const targetPrime = 7;
const sigsWith7 = memory.findByPrime(targetPrime);
console.log(`   Signatures containing ${targetPrime}: ${sigsWith7.length}`);
for (const sig of sigsWith7.slice(0, 3)) {
    console.log(`     - {${sig.primes.join(',')}}`);
}
console.log();

// 6. Find equivalent signatures
console.log('6. Equivalent Signature Detection:');
const testPrimes = [5, 7, 11];
const testSig = extractSignature(testPrimes);
const equivalents = memory.findEquivalent(testSig, 0.1);

console.log(`   Query: S = {${testPrimes.join(',')}}`);
console.log(`   Equivalent signatures found: ${equivalents.length}`);
for (const { signature } of equivalents) {
    console.log(`     - {${signature.primes.join(',')}}`);
}
console.log();

// 7. Memory statistics
console.log('7. Memory Statistics:');
const stats = memory.stats;
console.log(`   Total signatures: ${stats.totalSignatures}`);
console.log(`   Unique primes: ${stats.uniquePrimes}`);
console.log(`   Prime index size: ${stats.primeIndex}\n`);

// 8. Serialization round-trip
console.log('8. Serialization:');
const serialized = memory.toJSON();
console.log(`   Serialized to ${JSON.stringify(serialized).length} bytes`);
console.log(`   Entries: ${serialized.entries.length}`);

const restored = SignatureMemory.fromJSON(serialized, (primes) => createAlexanderModule(primes));
console.log(`   Restored ${restored.stats.totalSignatures} entries`);

// Verify restoration
const verifySig = extractSignature([3, 5, 7]);
const verifyResult = restored.get(verifySig.hash);
console.log(`   Verification: ${verifyResult ? '✓ Found' : '✗ Not found'}\n`);

console.log('=== End of Example ===');