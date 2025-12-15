# Semantic Examples

This directory contains examples demonstrating TinyAleph's semantic processing capabilities.

## Examples

### 01-vocabulary.js
**Word-to-Prime Mapping** - Explore how words map to prime numbers in TinyAleph's vocabulary space.

```bash
node examples/semantic/01-vocabulary.js
```

### 02-similarity.js
**Semantic Similarity** - Compute similarity between texts using hypercomplex embeddings with various metrics.

```bash
node examples/semantic/02-similarity.js
```

### 03-word-algebra.js
**Word Algebra** - Perform algebraic operations on word embeddings (king - man + woman = queen).

```bash
node examples/semantic/03-word-algebra.js
```

### 04-clustering.js
**Text Clustering** - Group similar texts using K-means and hierarchical clustering algorithms.

```bash
node examples/semantic/04-clustering.js
```

### 05-classification.js
**Text Classification** - Classify texts into categories using prototype-based and KNN classifiers.

```bash
node examples/semantic/05-classification.js
```

### 06-dna-encoding.js
**DNA-Inspired Encoding** - Explore biological-inspired text processing with bidirectional encoding, codons, and reading frames.

```bash
node examples/semantic/06-dna-encoding.js
```

### 07-search.js
**Semantic Search** - Build a semantic search engine that finds results by meaning, not just keywords.

```bash
node examples/semantic/07-search.js
```

### 08-qa-system.js
**Question-Answering System** - Build a QA system using semantic embeddings to match questions to knowledge.

```bash
node examples/semantic/08-qa-system.js
```

## Key Concepts

### Prime Encoding
Every word token maps to a unique prime number, creating a mathematical vocabulary space where:
- Each word has a unique prime identity
- Word order affects encoding through prime powers
- Semantic relationships emerge from mathematical structure

### Hypercomplex Embeddings
Text is embedded into hypercomplex (high-dimensional) vectors where:
- Similar texts have similar embeddings
- Vector operations (add, subtract, multiply) are meaningful
- Cosine similarity measures semantic relatedness

### DNA-Inspired Processing
Biological concepts enhance text processing:
- **Bidirectional**: Alternating reading direction
- **Codons**: Triplet grouping of tokens
- **Reading Frames**: 6 different starting positions
- **Sense/Antisense**: Forward and reversed representations

## Usage Pattern

```javascript
const { SemanticBackend } = require('../../modular');

// Create backend
const backend = new SemanticBackend({ dimension: 16 });

// Get text embedding
const state = backend.textToOrderedState('your text here');

// Access components
console.log(state.c[0]);    // First component
console.log(state.norm());  // Magnitude

// Compute similarity
function similarity(s1, s2) {
    let dot = 0, m1 = 0, m2 = 0;
    for (let i = 0; i < s1.c.length; i++) {
        dot += s1.c[i] * s2.c[i];
        m1 += s1.c[i] * s1.c[i];
        m2 += s2.c[i] * s2.c[i];
    }
    return dot / (Math.sqrt(m1) * Math.sqrt(m2) || 1);
}
```

## Next Steps

After understanding semantic processing, explore:
- `../crypto/` - Cryptographic hashing and key derivation
- `../scientific/` - Quantum computing simulation
- `../ai/` - AI and machine learning applications