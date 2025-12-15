/**
 * @example Semantic Similarity
 * @description Compute similarity between texts using hypercomplex embeddings
 * 
 * TinyAleph computes semantic similarity using:
 * - Hypercomplex inner products (generalized dot product)
 * - Geometric distance in high-dimensional space
 * - Structural alignment of prime representations
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Semantic Similarity Example');
console.log('=====================================\n');

// ===========================================
// HELPER FUNCTIONS
// ===========================================

// Cosine similarity between two hypercomplex states
function cosineSimilarity(state1, state2) {
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < state1.c.length; i++) {
        dot += state1.c[i] * state2.c[i];
        mag1 += state1.c[i] * state1.c[i];
        mag2 += state2.c[i] * state2.c[i];
    }
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}

// Euclidean distance
function euclideanDistance(state1, state2) {
    let sum = 0;
    for (let i = 0; i < state1.c.length; i++) {
        const diff = state1.c[i] - state2.c[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

// Angular distance (arc cosine of similarity)
function angularDistance(state1, state2) {
    const sim = cosineSimilarity(state1, state2);
    return Math.acos(Math.min(1, Math.max(-1, sim))) / Math.PI;
}

// ===========================================
// BASIC SIMILARITY
// ===========================================

console.log('Basic Similarity Comparison:');
console.log('─'.repeat(50) + '\n');

const pairs = [
    ['cat', 'dog'],
    ['cat', 'kitten'],
    ['cat', 'automobile'],
    ['happy', 'joyful'],
    ['happy', 'sad'],
    ['king', 'queen'],
    ['computer', 'laptop']
];

for (const [text1, text2] of pairs) {
    const state1 = backend.textToOrderedState(text1);
    const state2 = backend.textToOrderedState(text2);
    
    const sim = cosineSimilarity(state1, state2);
    const dist = euclideanDistance(state1, state2);
    
    console.log(`"${text1}" vs "${text2}"`);
    console.log(`  Similarity: ${(sim * 100).toFixed(1)}%`);
    console.log(`  Distance:   ${dist.toFixed(4)}\n`);
}

// ===========================================
// SENTENCE SIMILARITY
// ===========================================

console.log('═'.repeat(50));
console.log('Sentence Similarity:');
console.log('═'.repeat(50) + '\n');

const sentencePairs = [
    ['The cat sat on the mat', 'A cat was sitting on the mat'],
    ['The cat sat on the mat', 'The dog slept on the rug'],
    ['The cat sat on the mat', 'Financial markets are volatile'],
    ['I love programming', 'I enjoy coding'],
    ['The weather is nice today', 'It is a beautiful day']
];

for (const [sent1, sent2] of sentencePairs) {
    const state1 = backend.textToOrderedState(sent1);
    const state2 = backend.textToOrderedState(sent2);
    
    const sim = cosineSimilarity(state1, state2);
    
    console.log(`"${sent1}"`);
    console.log(`"${sent2}"`);
    console.log(`  Similarity: ${(sim * 100).toFixed(1)}%\n`);
}

// ===========================================
// SIMILARITY MATRIX
// ===========================================

console.log('═'.repeat(50));
console.log('Similarity Matrix:');
console.log('═'.repeat(50) + '\n');

const concepts = ['cat', 'dog', 'bird', 'car', 'bus', 'computer'];
const states = concepts.map(c => backend.textToOrderedState(c));

// Print header
process.stdout.write('         ');
for (const c of concepts) {
    process.stdout.write(c.padStart(8));
}
console.log();

// Print matrix
for (let i = 0; i < concepts.length; i++) {
    process.stdout.write(concepts[i].padEnd(9));
    for (let j = 0; j < concepts.length; j++) {
        const sim = cosineSimilarity(states[i], states[j]);
        process.stdout.write((sim * 100).toFixed(0).padStart(7) + '%');
    }
    console.log();
}

// ===========================================
// NEAREST NEIGHBORS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Nearest Neighbor Search:');
console.log('═'.repeat(50) + '\n');

const vocabulary = [
    'cat', 'kitten', 'dog', 'puppy', 'bird', 'parrot',
    'car', 'automobile', 'vehicle', 'bus', 'truck',
    'computer', 'laptop', 'desktop', 'phone', 'tablet',
    'happy', 'joyful', 'sad', 'angry', 'calm'
];

const vocabStates = vocabulary.map(word => ({
    word,
    state: backend.textToOrderedState(word)
}));

function findNeighbors(query, k = 5) {
    const queryState = backend.textToOrderedState(query);
    
    const scored = vocabStates.map(v => ({
        word: v.word,
        similarity: cosineSimilarity(queryState, v.state)
    }));
    
    scored.sort((a, b) => b.similarity - a.similarity);
    
    return scored.slice(0, k);
}

const queries = ['feline', 'automobile', 'emotions', 'technology'];

for (const query of queries) {
    console.log(`Query: "${query}"`);
    const neighbors = findNeighbors(query);
    for (let i = 0; i < neighbors.length; i++) {
        console.log(`  ${i + 1}. ${neighbors[i].word} (${(neighbors[i].similarity * 100).toFixed(1)}%)`);
    }
    console.log();
}

// ===========================================
// DOCUMENT SIMILARITY
// ===========================================

console.log('═'.repeat(50));
console.log('Document Similarity:');
console.log('═'.repeat(50) + '\n');

const documents = [
    { id: 'doc1', text: 'Machine learning is a subset of artificial intelligence that enables systems to learn from data.' },
    { id: 'doc2', text: 'Deep learning uses neural networks with many layers to process complex patterns.' },
    { id: 'doc3', text: 'Natural language processing helps computers understand human language.' },
    { id: 'doc4', text: 'The stock market experienced high volatility due to economic uncertainty.' },
    { id: 'doc5', text: 'Quantum computing uses quantum mechanics to perform computations.' }
];

const docStates = documents.map(d => ({
    ...d,
    state: backend.textToOrderedState(d.text)
}));

// Find most similar document pairs
console.log('Most similar document pairs:');
const docPairs = [];

for (let i = 0; i < docStates.length; i++) {
    for (let j = i + 1; j < docStates.length; j++) {
        const sim = cosineSimilarity(docStates[i].state, docStates[j].state);
        docPairs.push({
            doc1: docStates[i].id,
            doc2: docStates[j].id,
            similarity: sim
        });
    }
}

docPairs.sort((a, b) => b.similarity - a.similarity);

for (let i = 0; i < Math.min(5, docPairs.length); i++) {
    const p = docPairs[i];
    console.log(`  ${p.doc1} ↔ ${p.doc2}: ${(p.similarity * 100).toFixed(1)}%`);
}

// ===========================================
// MULTIPLE METRICS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Comparing Different Metrics:');
console.log('═'.repeat(50) + '\n');

const metricTests = [
    ['machine learning', 'deep learning'],
    ['machine learning', 'quantum physics']
];

console.log('Metric comparison:');
console.log('         Pair                      Cosine   Euclidean  Angular');
console.log('─'.repeat(70));

for (const [t1, t2] of metricTests) {
    const s1 = backend.textToOrderedState(t1);
    const s2 = backend.textToOrderedState(t2);
    
    const cos = cosineSimilarity(s1, s2);
    const euc = euclideanDistance(s1, s2);
    const ang = angularDistance(s1, s2);
    
    const pairStr = `"${t1}" vs "${t2}"`;
    console.log(`${pairStr.padEnd(40)} ${(cos * 100).toFixed(1).padStart(6)}%  ${euc.toFixed(4).padStart(8)}  ${(ang * 100).toFixed(1).padStart(6)}%`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Cosine similarity measures angular alignment');
console.log('2. Euclidean distance measures absolute difference');
console.log('3. Similar concepts cluster in hypercomplex space');
console.log('4. Similarity is structural, not just lexical');
console.log('5. Use similarity matrices for global analysis');