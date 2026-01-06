/**
 * @example Word Algebra
 * @description Perform algebraic operations on word embeddings
 * 
 * Just like word2vec's famous "king - man + woman = queen",
 * TinyAleph supports algebraic operations on hypercomplex embeddings:
 * - Addition: combine meanings
 * - Subtraction: remove aspects
 * - Composition: create complex concepts
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Word Algebra Example');
console.log('===============================\n');

// ===========================================
// HELPER FUNCTIONS
// ===========================================

// Add two hypercomplex states
function add(state1, state2) {
    const result = Hypercomplex.zero(state1.c.length);
    for (let i = 0; i < result.c.length; i++) {
        result.c[i] = state1.c[i] + state2.c[i];
    }
    return result.normalize();
}

// Subtract state2 from state1
function subtract(state1, state2) {
    const result = Hypercomplex.zero(state1.c.length);
    for (let i = 0; i < result.c.length; i++) {
        result.c[i] = state1.c[i] - state2.c[i];
    }
    return result.normalize();
}

// Scale a state
function scale(state, factor) {
    const result = Hypercomplex.zero(state.c.length);
    for (let i = 0; i < result.c.length; i++) {
        result.c[i] = state.c[i] * factor;
    }
    return result;
}

// Cosine similarity
function similarity(state1, state2) {
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < state1.c.length; i++) {
        dot += state1.c[i] * state2.c[i];
        mag1 += state1.c[i] * state1.c[i];
        mag2 += state2.c[i] * state2.c[i];
    }
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}

// Find nearest word to a state
function findNearest(targetState, vocabulary) {
    let best = null;
    let bestSim = -1;
    
    for (const word of vocabulary) {
        const state = backend.textToOrderedState(word);
        const sim = similarity(targetState, state);
        if (sim > bestSim) {
            bestSim = sim;
            best = word;
        }
    }
    
    return { word: best, similarity: bestSim };
}

// ===========================================
// CLASSIC WORD ANALOGIES
// ===========================================

console.log('Classic Word Analogies:');
console.log('─'.repeat(50) + '\n');

// Build a vocabulary for analogy testing
const vocabulary = [
    'king', 'queen', 'man', 'woman', 'prince', 'princess',
    'boy', 'girl', 'father', 'mother', 'son', 'daughter',
    'Paris', 'France', 'Berlin', 'Germany', 'Tokyo', 'Japan', 'London', 'England',
    'big', 'bigger', 'biggest', 'small', 'smaller', 'smallest',
    'walk', 'walked', 'walking', 'run', 'ran', 'running'
];

// a:b :: c:?
function analogy(a, b, c) {
    const stateA = backend.textToOrderedState(a);
    const stateB = backend.textToOrderedState(b);
    const stateC = backend.textToOrderedState(c);
    
    // b - a + c = ?
    const diff = subtract(stateB, stateA);
    const result = add(diff, stateC);
    
    // Find nearest, excluding input words
    const candidates = vocabulary.filter(w => w !== a && w !== b && w !== c);
    return findNearest(result, candidates);
}

const analogies = [
    ['king', 'queen', 'man'],      // man:woman
    ['man', 'woman', 'king'],      // king:queen
    ['Paris', 'France', 'Berlin'], // Berlin:Germany
    ['walk', 'walked', 'run']      // run:ran
];

for (const [a, b, c] of analogies) {
    const result = analogy(a, b, c);
    console.log(`${a} : ${b} :: ${c} : ?`);
    console.log(`  → ${result.word} (${(result.similarity * 100).toFixed(1)}%)\n`);
}

// ===========================================
// CONCEPT ADDITION
// ===========================================

console.log('═'.repeat(50));
console.log('Concept Addition (A + B):');
console.log('═'.repeat(50) + '\n');

const additions = [
    ['fast', 'car'],
    ['smart', 'phone'],
    ['ice', 'cream'],
    ['machine', 'learning'],
    ['artificial', 'intelligence']
];

const additionVocab = [
    'sports car', 'racing', 'smartphone', 'mobile', 'dessert',
    'frozen', 'AI', 'algorithm', 'data science', 'automation'
];

for (const [word1, word2] of additions) {
    const state1 = backend.textToOrderedState(word1);
    const state2 = backend.textToOrderedState(word2);
    const combined = add(state1, state2);
    
    const nearest = findNearest(combined, additionVocab);
    
    console.log(`"${word1}" + "${word2}"`);
    console.log(`  → Nearest: "${nearest.word}" (${(nearest.similarity * 100).toFixed(1)}%)\n`);
}

// ===========================================
// CONCEPT SUBTRACTION
// ===========================================

console.log('═'.repeat(50));
console.log('Concept Subtraction (A - B):');
console.log('═'.repeat(50) + '\n');

const subtractions = [
    ['king', 'royalty'],
    ['smartphone', 'phone'],
    ['airplane', 'air'],
    ['breakfast', 'morning']
];

const subtractionVocab = [
    'man', 'leader', 'smart', 'computer', 'plane', 'vehicle',
    'food', 'meal', 'lunch', 'dinner'
];

for (const [word1, word2] of subtractions) {
    const state1 = backend.textToOrderedState(word1);
    const state2 = backend.textToOrderedState(word2);
    const diff = subtract(state1, state2);
    
    const nearest = findNearest(diff, subtractionVocab);
    
    console.log(`"${word1}" - "${word2}"`);
    console.log(`  → Nearest: "${nearest.word}" (${(nearest.similarity * 100).toFixed(1)}%)\n`);
}

// ===========================================
// WEIGHTED COMBINATIONS
// ===========================================

console.log('═'.repeat(50));
console.log('Weighted Combinations (αA + βB):');
console.log('═'.repeat(50) + '\n');

const baseState1 = backend.textToOrderedState('happy');
const baseState2 = backend.textToOrderedState('sad');

const emotionVocab = ['joyful', 'content', 'neutral', 'melancholy', 'depressed', 'mixed', 'bittersweet'];

console.log('Blending "happy" and "sad" with different weights:\n');

const weights = [
    [1.0, 0.0],
    [0.8, 0.2],
    [0.6, 0.4],
    [0.5, 0.5],
    [0.4, 0.6],
    [0.2, 0.8],
    [0.0, 1.0]
];

for (const [w1, w2] of weights) {
    const scaled1 = scale(baseState1, w1);
    const scaled2 = scale(baseState2, w2);
    const combined = add(scaled1, scaled2);
    
    const nearest = findNearest(combined, emotionVocab);
    
    console.log(`  ${w1.toFixed(1)} × happy + ${w2.toFixed(1)} × sad → "${nearest.word}"`);
}

// ===========================================
// VECTOR ARITHMETIC PROPERTIES
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Vector Arithmetic Properties:');
console.log('═'.repeat(50) + '\n');

const A = backend.textToOrderedState('alpha');
const B = backend.textToOrderedState('beta');
const C = backend.textToOrderedState('gamma');

// Commutativity: A + B = B + A
const AB = add(A, B);
const BA = add(B, A);
const commutative = similarity(AB, BA);
console.log(`Commutativity (A + B = B + A): ${(commutative * 100).toFixed(1)}%`);

// Associativity: (A + B) + C = A + (B + C)
const AB_C = add(add(A, B), C);
const A_BC = add(A, add(B, C));
const associative = similarity(AB_C, A_BC);
console.log(`Associativity ((A+B)+C = A+(B+C)): ${(associative * 100).toFixed(1)}%`);

// Zero element: A + 0 = A
const zero = Hypercomplex.zero(16);
const A_zero = add(A, zero);
const identity = similarity(A, A_zero);
console.log(`Identity (A + 0 = A): ${(identity * 100).toFixed(1)}%`);

// ===========================================
// COMPLEX ALGEBRAIC EXPRESSIONS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Complex Algebraic Expressions:');
console.log('═'.repeat(50) + '\n');

// (technology + science) - (math)
const tech = backend.textToOrderedState('technology');
const science = backend.textToOrderedState('science');
const math = backend.textToOrderedState('math');

const techScience = add(tech, science);
const appliedScience = subtract(techScience, math);

const scienceVocab = ['engineering', 'physics', 'chemistry', 'biology', 'invention', 'research'];
const result1 = findNearest(appliedScience, scienceVocab);
console.log(`(technology + science) - math = "${result1.word}"`);

// (animal + water) - (land)
const animal = backend.textToOrderedState('animal');
const water = backend.textToOrderedState('water');
const land = backend.textToOrderedState('land');

const aquaticCalc = subtract(add(animal, water), land);
const animalVocab = ['fish', 'whale', 'dolphin', 'shark', 'mammal', 'bird'];
const result2 = findNearest(aquaticCalc, animalVocab);
console.log(`(animal + water) - land = "${result2.word}"`);

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Embeddings support algebraic operations');
console.log('2. Analogies work via: b - a + c = d');
console.log('3. Addition combines semantic features');
console.log('4. Subtraction removes semantic aspects');
console.log('5. Weighted combinations blend meanings');
console.log('6. Vector space properties mostly hold');