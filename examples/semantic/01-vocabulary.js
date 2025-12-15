/**
 * @example Vocabulary Mapping
 * @description Explore how words map to prime numbers
 * 
 * TinyAleph assigns a unique prime number to each word token.
 * This creates a vocabulary space where:
 * - Every word has a unique prime identity
 * - Word order affects encoding (through prime powers)
 * - Semantic relationships emerge from mathematical structure
 */

const { SemanticBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Vocabulary Mapping Example');
console.log('====================================\n');

// ===========================================
// BASIC WORD-TO-PRIME MAPPING
// ===========================================

console.log('Basic Word to Prime Mapping:');
console.log('─'.repeat(40) + '\n');

const words = ['hello', 'world', 'the', 'quick', 'brown', 'fox', 'AI', 'consciousness'];

for (const word of words) {
    const primes = backend.encode(word);
    console.log(`"${word.padEnd(15)}" → prime: ${primes[0] || 'N/A'}`);
}

// ===========================================
// TOKENIZATION
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Tokenization Process:');
console.log('═'.repeat(50) + '\n');

const sentences = [
    'The cat sat on the mat',
    'Hello world',
    'Machine learning is fascinating'
];

for (const sentence of sentences) {
    const tokens = backend.encodeOrdered(sentence);
    console.log(`"${sentence}"`);
    console.log(`  Tokens: [${tokens.slice(0, 6).join(', ')}${tokens.length > 6 ? '...' : ''}]`);
    console.log(`  Count: ${tokens.length} tokens\n`);
}

// ===========================================
// PRIME UNIQUENESS
// ===========================================

console.log('═'.repeat(50));
console.log('Prime Uniqueness - Different Words, Different Primes:');
console.log('═'.repeat(50) + '\n');

const wordPairs = [
    ['cat', 'dog'],
    ['run', 'walk'],
    ['big', 'small'],
    ['hello', 'Hello'],  // Case sensitivity
    ['the', 'The']       // Case sensitivity
];

for (const [word1, word2] of wordPairs) {
    const prime1 = backend.encode(word1)[0];
    const prime2 = backend.encode(word2)[0];
    const same = prime1 === prime2;
    
    console.log(`"${word1}" (${prime1}) vs "${word2}" (${prime2})`);
    console.log(`  ${same ? 'Same prime (same token)' : 'Different primes'}\n`);
}

// ===========================================
// VOCABULARY STATISTICS
// ===========================================

console.log('═'.repeat(50));
console.log('Vocabulary Exploration:');
console.log('═'.repeat(50) + '\n');

// Collect primes for a corpus
const corpus = `
The quick brown fox jumps over the lazy dog.
Machine learning and artificial intelligence are transforming the world.
Natural language processing enables computers to understand human language.
Semantic analysis reveals the meaning behind words and phrases.
`;

const allTokens = backend.encodeOrdered(corpus);
const uniquePrimes = [...new Set(allTokens)];

console.log(`Corpus Statistics:`);
console.log(`  Total tokens: ${allTokens.length}`);
console.log(`  Unique primes: ${uniquePrimes.length}`);
console.log(`  Vocabulary density: ${(uniquePrimes.length / allTokens.length * 100).toFixed(1)}%\n`);

// Find most frequent primes
const primeFreq = new Map();
for (const prime of allTokens) {
    primeFreq.set(prime, (primeFreq.get(prime) || 0) + 1);
}

const sorted = [...primeFreq.entries()].sort((a, b) => b[1] - a[1]);
console.log('Most frequent primes:');
for (let i = 0; i < Math.min(5, sorted.length); i++) {
    console.log(`  Prime ${sorted[i][0]}: ${sorted[i][1]} occurrences`);
}

// ===========================================
// PRIME RANGES
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Prime Distribution:');
console.log('═'.repeat(50) + '\n');

const primeRanges = [
    { min: 0, max: 100, count: 0 },
    { min: 100, max: 1000, count: 0 },
    { min: 1000, max: 10000, count: 0 },
    { min: 10000, max: 100000, count: 0 },
    { min: 100000, max: Infinity, count: 0 }
];

for (const prime of uniquePrimes) {
    for (const range of primeRanges) {
        if (prime >= range.min && prime < range.max) {
            range.count++;
            break;
        }
    }
}

console.log('Primes by range:');
for (const range of primeRanges) {
    const maxLabel = range.max === Infinity ? '+' : ` - ${range.max}`;
    console.log(`  ${range.min}${maxLabel}: ${range.count} primes`);
}

// ===========================================
// SEMANTIC NEIGHBORHOODS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Semantic Neighborhoods (words with similar primes):');
console.log('═'.repeat(50) + '\n');

// Find words with numerically close primes
const wordPrimeMap = new Map();
const testWords = ['cat', 'dog', 'mouse', 'bird', 'fish', 'car', 'bus', 'train', 
                   'happy', 'sad', 'joy', 'love', 'hate', 'anger'];

for (const word of testWords) {
    const prime = backend.encode(word)[0];
    wordPrimeMap.set(word, prime);
}

// Sort by prime value
const sortedByPrime = [...wordPrimeMap.entries()].sort((a, b) => a[1] - b[1]);

console.log('Words sorted by their prime values:');
for (const [word, prime] of sortedByPrime) {
    console.log(`  ${word.padEnd(10)} → ${prime}`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Each word token maps to a unique prime number');
console.log('2. Case affects tokenization (Hello ≠ hello)');
console.log('3. Prime assignment is deterministic and reproducible');
console.log('4. Vocabulary size = number of unique primes used');
console.log('5. Prime distribution affects mathematical properties');