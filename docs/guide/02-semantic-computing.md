# Semantic Computing

This guide covers using Aleph for natural language understanding, concept mapping, and philosophical reasoning.

## Overview

Semantic computing treats **concepts as the fundamental data type**. Instead of manipulating bits or strings, we manipulate meaning directly through prime arithmetic and hypercomplex states.

---

## Creating a Semantic Engine

```javascript
const { createEngine, SemanticBackend } = require('./modular');

// Load full configuration
const config = require('./data.json');

// Create engine
const engine = createEngine('semantic', config);

// Or create backend directly
const backend = new SemanticBackend(config);
```

---

## Text Processing

### Tokenization

```javascript
const backend = new SemanticBackend(config);

// Basic tokenization
const tokens = backend.tokenize('Love is the answer');
console.log(tokens);
// [
//   { word: 'love', primes: [2,3,5], known: true, isStop: false, position: 0 },
//   { word: 'is', primes: [...], known: true, isStop: true, position: 1 },
//   { word: 'the', primes: [...], known: true, isStop: true, position: 2 },
//   { word: 'answer', primes: [...], known: true, isStop: false, position: 3 }
// ]

// Filtered tokenization (removes stop words)
const filtered = backend.tokenize('Love is the answer', true);
console.log(filtered);
// [
//   { word: 'love', primes: [2,3,5], known: true, isStop: false, position: 0 },
//   { word: 'answer', primes: [...], known: true, isStop: false, position: 1 }
// ]
```

### Encoding

```javascript
// Encode to primes (unordered)
const primes = backend.encode('wisdom and truth');
console.log(primes);  // [2, 7, 11, 7, 11, 13]

// Ordered encoding (preserves position)
const ordered = backend.encodeOrdered('wisdom and truth');
console.log(ordered);
// [
//   { word: 'wisdom', primes: [2,7,11], position: 0 },
//   { word: 'truth', primes: [7,11,13], position: 1 }
// ]
```

### Decoding

```javascript
// Decode primes to words
const primes = [2, 3, 5, 7, 11];
const words = backend.decode(primes);
console.log(words);  // "love wisdom truth"

// The decoder uses greedy covering to find words
// that best match the input primes
```

---

## State Vectors

### Prime to State Conversion

```javascript
// Unordered (commutative)
const primes = [2, 3, 5];
const state = backend.primesToState(primes);
console.log('Entropy:', state.entropy());
console.log('Norm:', state.norm());

// Ordered (non-commutative) - preserves word order
const tokens = backend.encodeOrdered('dog bites man');
const orderedState = backend.orderedPrimesToState(tokens);

const tokens2 = backend.encodeOrdered('man bites dog');
const orderedState2 = backend.orderedPrimesToState(tokens2);

console.log('Same words, different order:');
console.log('Coherence:', orderedState.coherence(orderedState2));
// Should be < 1.0 because order matters
```

### Semantic Similarity

```javascript
function semanticSimilarity(text1, text2, backend) {
  const state1 = backend.textToOrderedState(text1);
  const state2 = backend.textToOrderedState(text2);
  return state1.coherence(state2);
}

const backend = new SemanticBackend(config);

console.log('Similar concepts:');
console.log('love vs affection:', semanticSimilarity('love', 'affection', backend));
console.log('wisdom vs knowledge:', semanticSimilarity('wisdom', 'knowledge', backend));

console.log('\nOpposite concepts:');
console.log('love vs hate:', semanticSimilarity('love', 'hate', backend));
console.log('truth vs falsehood:', semanticSimilarity('truth', 'falsehood', backend));

console.log('\nUnrelated concepts:');
console.log('love vs economics:', semanticSimilarity('love', 'economics', backend));
```

---

## Semantic Transforms

Transforms are rewrite rules that simplify or modify meaning:

### Applying Transforms

```javascript
const transform = {
  n: 'question_to_insight',
  q: [curiosity_prime, unknown_prime],  // Query primes
  r: [understanding_prime, known_prime]  // Result primes
};

const inputPrimes = [2, 3, curiosity_prime, unknown_prime, 5];
const result = backend.applyTransform(inputPrimes, transform);
// Query primes replaced with result primes
```

### Transform-Based Reasoning

```javascript
const engine = createEngine('semantic', config);

const result = engine.run('What is the meaning of life?');

console.log('Reasoning steps:');
for (const step of result.steps) {
  console.log(`  Step ${step.step}: ${step.transform}`);
  console.log(`    Entropy drop: ${step.entropyDrop.toFixed(3)}`);
}

console.log('Final output:', result.output);
console.log('Final entropy:', result.entropy);
```

---

## Vocabulary Management

### Checking Vocabulary

```javascript
const backend = new SemanticBackend(config);

console.log('Vocabulary size:', backend.getVocabularySize());
console.log('Has "love":', backend.hasWord('love'));
console.log('Love primes:', backend.getWordPrimes('love'));
```

### Learning New Words

```javascript
// Add a new word with explicit primes
backend.learn('serendipity', [2, 29, 53]);
// Now "serendipity" maps to [existence, becoming, kairos]

console.log('Learned:', backend.hasWord('serendipity'));
console.log('Primes:', backend.getWordPrimes('serendipity'));
```

### Ontology Access

```javascript
// Get meaning of a prime
const meaning = backend.getOntologyMeaning(7);
console.log('Prime 7 means:', meaning);  // "logos/reason"

// Get primes for an axis
const axisPrimes = backend.getAxisPrimes(0);
console.log('Axis 0 primes:', axisPrimes);
```

---

## Two-Layer Processing

For sophisticated vocabulary handling, use the TwoLayerEngine:

```javascript
const { TwoLayerEngine } = require('./backends/semantic/two-layer');

const engine = new TwoLayerEngine({
  core: config
});

// Process with meaning and surface separation
const result = engine.process('love is truth');

console.log('Meaning (primes):', result.meaning.primes);
console.log('Meaning (entropy):', result.meaning.entropy);
console.log('Surface (words):', result.surface.words);
console.log('Surface (register):', result.surface.register);
```

### Register Translation

```javascript
const engine = new TwoLayerEngine({ core: config });

// Translate between registers
const result = engine.translate(
  'The verity is sagacious',
  'formal',
  'casual'
);

console.log('Original:', result.original);
console.log('Translated:', result.translated);
// "real talk that's big brain"
```

### Style-Specific Generation

```javascript
const engine = new TwoLayerEngine({ core: config });

// Generate with specific style
const primes = [7, 11, 13];  // truth + psyche + purpose

engine.useRegister('poetic');
const poetic = engine.generateWithStyle(primes, 'romantic');

engine.useRegister('technical');
const technical = engine.generateWithStyle(primes, 'scientific');

console.log('Poetic:', poetic);
console.log('Technical:', technical);
```

---

## Practical Applications

### Concept Clustering

```javascript
const { createEngine, SemanticBackend } = require('./modular');

function clusterConcepts(words, backend) {
  const states = words.map(w => ({
    word: w,
    state: backend.textToOrderedState(w)
  }));
  
  const clusters = [];
  const used = new Set();
  
  for (let i = 0; i < states.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = [states[i].word];
    used.add(i);
    
    for (let j = i + 1; j < states.length; j++) {
      if (used.has(j)) continue;
      
      const similarity = states[i].state.coherence(states[j].state);
      if (similarity > 0.7) {
        cluster.push(states[j].word);
        used.add(j);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

const backend = new SemanticBackend(config);
const words = ['love', 'affection', 'truth', 'honesty', 'justice', 'fairness'];
const clusters = clusterConcepts(words, backend);
console.log('Clusters:', clusters);
```

### Semantic Search

```javascript
function semanticSearch(query, documents, backend, topK = 5) {
  const queryState = backend.textToOrderedState(query);
  
  const scored = documents.map(doc => ({
    doc,
    score: backend.textToOrderedState(doc).coherence(queryState)
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

const backend = new SemanticBackend(config);
const docs = [
  'Love conquers all obstacles',
  'The truth shall set you free',
  'Wisdom comes from experience',
  'Justice must be blind',
  'Beauty is in the eye of the beholder'
];

const results = semanticSearch('knowledge and understanding', docs, backend);
for (const r of results) {
  console.log(`${r.score.toFixed(3)}: ${r.doc}`);
}
```

### Contradiction Detection

```javascript
function detectContradiction(statement1, statement2, backend) {
  const state1 = backend.textToOrderedState(statement1);
  const state2 = backend.textToOrderedState(statement2);
  
  // Check for zero-divisor relationship
  if (state1.isZeroDivisorWith(state2)) {
    return { contradicts: true, type: 'zero-divisor' };
  }
  
  // Check for low coherence
  const coherence = state1.coherence(state2);
  if (coherence < 0.2) {
    return { contradicts: true, type: 'orthogonal', coherence };
  }
  
  return { contradicts: false, coherence };
}

const backend = new SemanticBackend(config);
console.log(detectContradiction('freedom is essential', 'slavery is acceptable', backend));
```

---

## Performance Tips

### Batch Processing

```javascript
// Process many inputs efficiently
const engine = createEngine('semantic', config);
const inputs = ['love', 'truth', 'wisdom', 'justice', 'beauty'];
const results = engine.runBatch(inputs);

// Results computed in sequence, oscillators carry state
```

### Caching States

```javascript
const stateCache = new Map();

function getCachedState(text, backend) {
  if (!stateCache.has(text)) {
    stateCache.set(text, backend.textToOrderedState(text));
  }
  return stateCache.get(text);
}
```

### Reducing Dimension

```javascript
// Lower dimension = faster, less precise
const fastConfig = { ...config, dimension: 8 };
const fastEngine = createEngine('semantic', fastConfig);

// Higher dimension = slower, more precise
const preciseConfig = { ...config, dimension: 32 };
const preciseEngine = createEngine('semantic', preciseConfig);
```

---

## Next Steps

- [Cryptographic Applications →](./03-cryptographic.md)
- [Theory: Two-Layer Meaning →](../theory/06-two-layer-meaning.md)
- [Reference: SemanticBackend →](../reference/03-backends.md#semantic-backend)