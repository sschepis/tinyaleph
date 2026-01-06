# The Semantic Sieve

## The Prime Uniqueness Problem

For semantic computing to work, every concept must have a **unique** prime signature. But initial assignments are often too coarse:

```
lake  → [water, location] → [2, 5]
ocean → [water, location] → [2, 5]

COLLISION! Same primes, different meanings!
```

The **Semantic Sieve** algorithm ensures the **Prime Uniqueness Invariant**: every word has a distinct prime signature.

---

## Theoretical Context

The goal is to map a lexicon of words to unique points in **Twist Space**. Since prime numbers correspond to irreducible twist operations, a word's definition is the composite twist (product) of its constituent semantic primes.

When distinct words collapse into the same composite number, we need **semantic differentiation** to resolve these collisions.

---

## Data Structures

Three core registries maintain the state:

### 1. PrimeRegistry

A monotonic iterator of prime numbers:

```javascript
class PrimeRegistry {
  constructor(existingPrimes) {
    this.used = new Set(existingPrimes);
    this.max = existingPrimes.length > 0 
      ? Math.max(...existingPrimes) 
      : 1;
  }

  next() {
    let candidate = this.max + 1;
    while (true) {
      if (isPrime(candidate) && !this.used.has(candidate)) {
        this.used.add(candidate);
        this.max = candidate;
        return candidate;
      }
      candidate++;
    }
  }
}
```

### 2. ConceptMap

A bijection between human-readable concepts and primes:

```javascript
const conceptMap = {
  "physical": 2,
  "living": 3,
  "sentient": 5,
  "aquatic": 7,
  "large": 11,
  "contained": 13,
  // ...
};
```

### 3. LexiconLedger

The current state of all words and their assigned prime factors:

```javascript
const lexicon = {
  "human": [2, 3, 5],
  "dog": [2, 3],
  "lake": [2, 5, 13],
  "ocean": [2, 5, 11],
  // ...
};
```

---

## The Sieve Algorithm

### Overview

```
1. COMPUTE signatures for all words
2. CLUSTER words with identical signatures
3. FOR each cluster with >1 word:
   a. IF cluster > 10 words: MACRO strategy
   b. ELSE: MICRO strategy
4. MINT new primes for new distinctions
5. REPEAT until all signatures unique
```

### Strategy A: Macro (Large Clusters)

For clusters with > 10 words, ask for broad sub-categories:

```javascript
// Example cluster: 50 "animal" words with signature [2, 3]

const prompt = `
You are a semantic ontologist. 
The following words are grouped as "physical, living".
Divide this list into 3-5 distinct sub-categories.

Words: dog, cat, eagle, salmon, ant, whale, ...

Return JSON: {"categories": {"CategoryName": ["word1", "word2", ...]}}
`;

// Result:
{
  "categories": {
    "Mammal": ["dog", "cat", "whale"],
    "Bird": ["eagle", "sparrow"],
    "Fish": ["salmon", "trout"],
    "Insect": ["ant", "bee"]
  }
}
```

Each new category gets a new prime:
- Mammal → prime 127
- Bird → prime 131
- Fish → prime 137
- Insect → prime 139

### Strategy B: Micro (Small Clusters)

For clusters with ≤ 10 words, find distinguishing features for pairs:

```javascript
// Cluster: [lake, ocean] with signature [2, 5, 7]

const prompt = `
Compare "lake" and "ocean".
They share concepts: [physical, form, aquatic].

Provide ONE concept TRUE for "lake" but FALSE for "ocean".
`;

// Result: "contained" (lakes are contained, oceans are not)

// Add prime for "contained" to "lake"
lake = [2, 5, 7, 13]  // Now distinct from ocean
```

---

## Implementation

```javascript
class Sieve {
  constructor() {
    this.data = require('./data.json');
    
    // Initialize registries
    const usedPrimes = [
      ...this.data.primes,
      ...Object.keys(this.data.ontology).map(Number),
      ...Object.values(this.data.vocabulary).flat()
    ];
    this.primes = new PrimeRegistry(usedPrimes);
    
    // Build concept→prime map
    this.conceptToPrime = new Map();
    for (const [p, label] of Object.entries(this.data.ontology)) {
      this.conceptToPrime.set(label.toLowerCase(), Number(p));
    }
    
    this.stats = {
      collisionsResolved: 0,
      conceptsCreated: 0,
      primesMinted: 0
    };
  }
  
  analyzeCollisions() {
    const signatureMap = new Map();
    
    for (const [word, primes] of Object.entries(this.data.vocabulary)) {
      const signature = [...primes].sort((a, b) => a - b).join(',');
      
      if (!signatureMap.has(signature)) {
        signatureMap.set(signature, []);
      }
      signatureMap.get(signature).push(word);
    }
    
    // Return clusters with collisions, sorted by size
    return [...signatureMap.entries()]
      .filter(([sig, words]) => words.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
  }
  
  getOrMintPrime(concept) {
    const key = concept.toLowerCase().trim();
    
    if (this.conceptToPrime.has(key)) {
      return this.conceptToPrime.get(key);
    }
    
    // Mint new prime
    const newPrime = this.primes.next();
    this.conceptToPrime.set(key, newPrime);
    this.data.ontology[newPrime] = concept;
    
    if (!this.data.primes.includes(newPrime)) {
      this.data.primes.push(newPrime);
    }
    
    this.stats.primesMinted++;
    this.stats.conceptsCreated++;
    
    return newPrime;
  }
  
  async resolveCluster(signature, words) {
    const currentPrimes = signature.split(',').map(Number);
    const existingConcepts = currentPrimes
      .map(p => this.data.ontology[p] || `P${p}`)
      .join(', ');
    
    if (words.length > 10) {
      // Strategy A: Macro categorization
      await this.macroStrategy(words, existingConcepts);
    } else {
      // Strategy B: Micro discrimination
      await this.microStrategy(words, existingConcepts);
    }
  }
  
  async macroStrategy(words, existingConcepts) {
    // Use LLM to categorize into subcategories
    const result = await LLM.chat([{
      role: 'system',
      content: `Categorize these words into 3-5 sub-categories.
                Current concepts: ${existingConcepts}
                Return JSON: {"categories": {"Name": ["word1", ...]}}`
    }, {
      role: 'user',
      content: `Words: ${words.slice(0, 50).join(', ')}`
    }]);
    
    const categories = JSON.parse(result.content).categories;
    
    for (const [catName, wordList] of Object.entries(categories)) {
      const prime = this.getOrMintPrime(catName);
      
      for (const word of wordList) {
        const current = this.data.vocabulary[word];
        if (current && !current.includes(prime)) {
          current.push(prime);
        }
      }
    }
    
    this.stats.collisionsResolved++;
  }
  
  async microStrategy(words, existingConcepts) {
    // Discriminate between first two words
    const [wordA, wordB] = words;
    
    const result = await LLM.chat([{
      role: 'system',
      content: `Compare "${wordA}" and "${wordB}".
                They share: ${existingConcepts}.
                Provide ONE concept TRUE for "${wordA}" but FALSE for "${wordB}".
                Return JSON: {"concept": "...", "reasoning": "..."}`
    }]);
    
    const { concept } = JSON.parse(result.content);
    const prime = this.getOrMintPrime(concept);
    
    // Add prime only to wordA
    const current = this.data.vocabulary[wordA];
    if (current && !current.includes(prime)) {
      current.push(prime);
    }
    
    this.stats.collisionsResolved++;
  }
  
  async run(maxIterations = 25) {
    console.log('🕸️ Semantic Sieve Initialized');
    
    for (let i = 0; i < maxIterations; i++) {
      const collisions = this.analyzeCollisions();
      
      if (collisions.length === 0) {
        console.log('🎉 Prime Uniqueness Invariant Satisfied!');
        break;
      }
      
      console.log(`Pass ${i + 1}: ${collisions.length} clusters`);
      
      const [signature, cluster] = collisions[0];
      await this.resolveCluster(signature, cluster);
      
      this.save();
    }
    
    console.log(`📊 Complete:
      Collisions Resolved: ${this.stats.collisionsResolved}
      New Concepts: ${this.stats.conceptsCreated}
      Primes Minted: ${this.stats.primesMinted}`);
  }
}
```

---

## The Sieve Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    START: Ingest Lexicon                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Compute Prime Signatures                     │
│           word → primes → product/signature                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Collisions?   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼ No                          ▼ Yes
    ┌─────────────────┐           ┌─────────────────┐
    │      DONE       │           │  Select Largest │
    │  All Unique!    │           │     Cluster     │
    └─────────────────┘           └────────┬────────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │ Cluster Size?  │
                                  └───────┬────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         │                                 │
                         ▼ > 10                            ▼ ≤ 10
              ┌─────────────────┐               ┌─────────────────┐
              │  MACRO Strategy │               │ MICRO Strategy  │
              │   Categorize    │               │  Discriminate   │
              └────────┬────────┘               └────────┬────────┘
                       │                                 │
                       └────────────────┬────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Mint/Reuse Prime│
                              │  for Concept    │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Assign Prime to │
                              │  Target Words   │
                              └────────┬────────┘
                                       │
                                       └──────────► [Back to Compute]
```

---

## Efficiency Optimizations

### Signature Computation

Use sum of logarithms to avoid integer overflow:

```javascript
function computeSignature(primes) {
  // Instead of: product = Π pᵢ (overflows for large products)
  // Use: log_signature = Σ log(pᵢ)
  return primes.reduce((sum, p) => sum + Math.log(p), 0);
}
```

### Prime Reuse

Before minting new primes, check if concept already exists:

```javascript
getOrMintPrime(concept) {
  const normalized = concept.toLowerCase().trim();
  
  // Check existing concepts
  if (this.conceptToPrime.has(normalized)) {
    return this.conceptToPrime.get(normalized);  // Reuse!
  }
  
  // Only mint if truly new
  return this.mintNewPrime(concept);
}
```

### Batch Processing

Process words in batches to reduce LLM calls:

```javascript
// Instead of one word at a time:
const batchWords = words.slice(0, 50);
const result = await categorize(batchWords);
```

---

## Example Sieve Run

```
Initial State:
  lake  = [2, 5]     (physical, form)
  ocean = [2, 5]     (physical, form)
  pond  = [2, 5]     (physical, form)
  sea   = [2, 5]     (physical, form)

Pass 1:
  Cluster: [lake, ocean, pond, sea]
  Strategy: Macro (4 words)
  
  LLM categorizes:
    - "Enclosed": [lake, pond]
    - "Open": [ocean, sea]
  
  Mint prime 127 for "Enclosed"
  Mint prime 131 for "Open"
  
  Result:
    lake  = [2, 5, 127]
    pond  = [2, 5, 127]
    ocean = [2, 5, 131]
    sea   = [2, 5, 131]

Pass 2:
  Cluster A: [lake, pond] with [2, 5, 127]
  Cluster B: [ocean, sea] with [2, 5, 131]
  
  Strategy: Micro for each
  
  lake vs pond: "Large" is true for lake, false for pond
  ocean vs sea: "Unbounded" is true for ocean, false for sea
  
  Mint prime 137 for "Large"
  Mint prime 139 for "Unbounded"
  
  Result:
    lake  = [2, 5, 127, 137]       ✓ Unique
    pond  = [2, 5, 127]             ✓ Unique
    ocean = [2, 5, 131, 139]       ✓ Unique
    sea   = [2, 5, 131]             ✓ Unique

Pass 3:
  No collisions!
  🎉 Prime Uniqueness Invariant Satisfied!
```

---

## Integration with QMF

The Semantic Sieve supports the Quaternionic Memory Field (QMF) framework:

### Prime Hilbert Space Initialization

The sieve populates the |pᵢ⟩ basis vectors:

```
|Ψ⟩ = Σᵢ qᵢ |pᵢ⟩
```

Each unique prime becomes a basis vector in the semantic Hilbert space.

### Resonance Filtering

Unique prime factorizations ensure the Jaccard similarity metric is non-degenerate:

```
R(w₁, w₂) = |primes(w₁) ∩ primes(w₂)| / |primes(w₁) ∪ primes(w₂)|
```

Without unique signatures, R would incorrectly identify different words as identical.

### Topological Stability

Following the Prime-Irreducibility Correspondence, the sieve ensures complex ideas are built from irreducible twist states, preventing topological defects in the memory field.

---

## Summary

The Semantic Sieve:

1. **Detects collisions** - words with identical prime signatures
2. **Resolves through differentiation** - finding distinguishing concepts
3. **Mints new primes** - for newly identified distinctions
4. **Ensures uniqueness** - every word gets a unique signature
5. **Supports semantic computation** - by enabling proper prime arithmetic

The sieve is the initialization engine for semantic computing—it transforms a crude lexicon into a mathematically rigorous semantic space.

---

## Back to: [Theory Overview →](./README.md)