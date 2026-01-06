/**
 * @example Prime Embeddings
 * @description Generate embeddings for text and concepts using prime resonance
 * 
 * TinyAleph generates unique embeddings based on prime factorization and
 * hypercomplex algebra. Unlike neural embeddings, these are:
 * - Deterministic (same input = same embedding)
 * - Interpretable (based on prime structure)
 * - Order-preserving (word order affects the result)
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// BASIC EMBEDDINGS
// ===========================================

console.log('TinyAleph Prime Embeddings Example');
console.log('===================================\n');

// Generate embeddings for words
const words = ['cat', 'dog', 'animal', 'tree', 'forest'];
const embeddings = {};

console.log('Word Embeddings:');
console.log('-----------------');
for (const word of words) {
    embeddings[word] = backend.textToOrderedState(word);
    console.log(`${word.padEnd(10)}: [${embeddings[word].c.slice(0, 4).map(c => c.toFixed(3)).join(', ')}, ...]`);
}

// ===========================================
// EMBEDDING SIMILARITY
// ===========================================

console.log('\n===================================');
console.log('Embedding Similarity (Cosine):');
console.log('===================================\n');

function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.c.length; i++) {
        dot += a.c[i] * b.c[i];
        magA += a.c[i] * a.c[i];
        magB += b.c[i] * b.c[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Compare embeddings
const pairs = [
    ['cat', 'dog'],
    ['cat', 'animal'],
    ['tree', 'forest'],
    ['cat', 'tree'],
];

for (const [w1, w2] of pairs) {
    const sim = cosineSimilarity(embeddings[w1], embeddings[w2]);
    console.log(`${w1} <-> ${w2}: ${sim.toFixed(4)}`);
}

// ===========================================
// SENTENCE EMBEDDINGS
// ===========================================

console.log('\n===================================');
console.log('Sentence Embeddings:');
console.log('===================================\n');

const sentences = [
    'The cat sat on the mat',
    'The dog sat on the mat',
    'The mat sat on the cat', // Word order matters!
];

const sentenceEmbeddings = sentences.map(s => ({
    text: s,
    embedding: backend.textToOrderedState(s)
}));

console.log('Sentence similarities:');
for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
        const sim = cosineSimilarity(
            sentenceEmbeddings[i].embedding,
            sentenceEmbeddings[j].embedding
        );
        console.log(`"${sentences[i].substring(0, 20)}..." <-> "${sentences[j].substring(0, 20)}...": ${sim.toFixed(4)}`);
    }
}

// ===========================================
// EMBEDDING ARITHMETIC
// ===========================================

console.log('\n===================================');
console.log('Embedding Arithmetic:');
console.log('===================================\n');

// king - man + woman ≈ queen (classic word2vec analogy)
const king = backend.textToOrderedState('king');
const man = backend.textToOrderedState('man');
const woman = backend.textToOrderedState('woman');
const queen = backend.textToOrderedState('queen');

// Compute: king - man + woman
const result = Hypercomplex.zero(16);
for (let i = 0; i < 16; i++) {
    result.c[i] = king.c[i] - man.c[i] + woman.c[i];
}

console.log('king - man + woman = ?');
console.log(`Similarity to "queen": ${cosineSimilarity(result, queen).toFixed(4)}`);
console.log(`Similarity to "king":  ${cosineSimilarity(result, king).toFixed(4)}`);
console.log(`Similarity to "man":   ${cosineSimilarity(result, man).toFixed(4)}`);

// ===========================================
// EMBEDDING STORAGE FORMAT
// ===========================================

console.log('\n===================================');
console.log('Embedding Storage:');
console.log('===================================\n');

// Convert to JSON for storage
const embedding = backend.textToOrderedState('machine learning');
const json = JSON.stringify(Array.from(embedding.c));
console.log('JSON format (for storage):');
console.log(json.substring(0, 80) + '...');
console.log(`Size: ${json.length} bytes`);

// Restore from JSON
const restored = Hypercomplex.zero(16);
restored.c = new Float64Array(JSON.parse(json));
console.log(`\nRestored successfully: ${cosineSimilarity(embedding, restored) === 1 ? 'YES ✓' : 'NO'}`);

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n===================================');
console.log('KEY TAKEAWAYS:');
console.log('1. textToOrderedState() generates 16-dimensional hypercomplex embeddings');
console.log('2. Embeddings are deterministic and reproducible');
console.log('3. Cosine similarity measures semantic closeness');
console.log('4. Word order affects embeddings (non-commutative)');
console.log('5. Embedding arithmetic works for analogies');
console.log('6. Embeddings serialize to JSON for storage');