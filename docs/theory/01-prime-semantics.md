# Prime Semantics

## The Prime Number Foundation

Prime numbers are the atoms of arithmetic. Every positive integer can be uniquely expressed as a product of primes (Fundamental Theorem of Arithmetic). This uniqueness makes primes ideal for encoding semantic content.

### Why Primes for Meaning?

| Property | Arithmetic | Semantics |
|----------|-----------|-----------|
| **Uniqueness** | n = Πpᵢᵏⁱ uniquely | Each concept has unique prime signature |
| **Irreducibility** | Primes cannot factor further | Core concepts are semantic atoms |
| **Composition** | Integers from prime products | Complex ideas from simple ones |
| **Infinitude** | Infinitely many primes | Infinitely many possible concepts |

### The Semantic Prime Hypothesis

We hypothesize that meaning—like matter—has fundamental constituents. These "semantic atoms" are concepts that cannot be decomposed further:

- **EXISTENCE** (prime 2) - that something is
- **UNITY** (prime 3) - that something is one
- **FORM** (prime 5) - that something has structure
- **LOGOS** (prime 7) - that something has reason/pattern
- **PSYCHE** (prime 11) - that something has inner life
- **TELOS** (prime 13) - that something has purpose
- **DYNAMIS** (prime 17) - that something has power/potential
- **LIMIT** (prime 19) - that something has boundary

---

## The Ontology Mapping

Aleph uses a configurable mapping from primes to semantic content:

```javascript
const ontology = {
  2: 'existence/being',
  3: 'unity/oneness',
  5: 'form/structure',
  7: 'logos/reason',
  11: 'psyche/soul',
  13: 'telos/purpose',
  17: 'dynamis/power',
  19: 'limit/boundary',
  23: 'intensity/degree',
  29: 'becoming/change',
  31: 'physis/nature',
  37: 'techne/craft',
  41: 'episteme/knowledge',
  43: 'doxa/opinion',
  47: 'aletheia/truth',
  53: 'kairos/timing',
  // ... extends to arbitrary depth
};
```

### Building Complex Concepts

Complex concepts are products of prime concepts:

```
love = [2, 3, 5]
     = existence × unity × form
     = "that which exists as unified form"
     
wisdom = [2, 7, 11]
       = existence × logos × psyche
       = "that which exists as reasoned soul"
       
knowledge = [3, 5, 7]
          = unity × form × logos
          = "unified structured reason"
```

---

## Prime Arithmetic as Semantic Operations

### Union (Concept Combination)

```javascript
love = [2, 3, 5]
truth = [7, 11, 13]

love ∪ truth = [2, 3, 5, 7, 11, 13]
// "loving truth" or "true love"
```

### Intersection (Common Ground)

```javascript
wisdom = [2, 7, 11]
knowledge = [3, 5, 7]

wisdom ∩ knowledge = [7]
// logos is what wisdom and knowledge share
```

### Difference (Distinction)

```javascript
wisdom - knowledge = [2, 11]
// wisdom has existence and psyche that knowledge lacks

knowledge - wisdom = [3, 5]
// knowledge has unity and form that wisdom lacks
```

### Product (Deep Integration)

```javascript
love × truth = product of all prime pairs
// Creates new composite concept
```

---

## The Semantic Sieve

A critical problem arises: different words might map to the same primes if our initial assignment is too coarse.

```
lake  → [water, location] → [2, 5]
ocean → [water, location] → [2, 5]
// COLLISION! Same primes, different meanings
```

The **Semantic Sieve** algorithm resolves this:

### Algorithm: Sieve of Distinction

```
1. COMPUTE signatures for all words
2. CLUSTER words with identical signatures
3. FOR each cluster with >1 word:
   a. IF cluster > 10 words: MACRO strategy
      - Ask for broad sub-categories
   b. ELSE: MICRO strategy
      - Find distinguishing feature for pairs
4. MINT new primes for new distinctions
5. REPEAT until all signatures unique
```

### Example Resolution

```
Cluster: [lake, ocean, pond, sea]
All mapped to [water, location]

MACRO: Split into categories:
- Still water: [lake, pond] → add prime for "contained"
- Moving water: [ocean, sea] → add prime for "vast"

MICRO: Distinguish remaining pairs:
- lake vs pond: "large" vs "small" → add prime for "scale"
- ocean vs sea: "open" vs "bounded" → already have "limit"

Result:
lake  → [2, 5, 127]        (water, location, large-contained)
pond  → [2, 5, 131]        (water, location, small-contained)
ocean → [2, 5, 137]        (water, location, large-open)
sea   → [2, 5, 139, 19]    (water, location, large-bounded)
```

---

## Prime-to-Frequency Mapping

Each prime maps to an oscillator frequency using the PRSC (Prime Resonance Semantic Computing) formula:

```javascript
function primeToFrequency(p, base = 1, logScale = 10) {
  return base + Math.log(p) / logScale;
}
```

This mapping ensures:
- Larger primes → higher frequencies
- Logarithmic scaling for perceptual uniformity
- All frequencies positive and bounded

### Frequency Table

| Prime | Concept | Frequency (Hz) |
|-------|---------|---------------|
| 2 | existence | 1.069 |
| 3 | unity | 1.110 |
| 5 | form | 1.161 |
| 7 | logos | 1.195 |
| 11 | psyche | 1.240 |
| 13 | telos | 1.257 |
| 17 | dynamis | 1.283 |
| 19 | limit | 1.294 |

When concepts are activated, their corresponding oscillators are excited and begin to interact through Kuramoto coupling.

---

## Prime-to-Angle Mapping

For hypercomplex state construction, primes also map to angles:

```javascript
function primeToAngle(p) {
  return (360 / p) * (Math.PI / 180);
}
```

This mapping has deep significance:
- Prime 2 → 180° (half rotation, binary opposition)
- Prime 3 → 120° (trisection, triadic structure)
- Prime 5 → 72° (pentad, golden ratio connection)
- Prime 7 → ~51° (heptad, mystic number)

The angle determines how a prime contributes to the hypercomplex state vector.

---

## Gaussian and Eisenstein Extensions

For cryptographic applications, Aleph extends to algebraic integer rings:

### Gaussian Integers Z[i]

Complex numbers with integer components: a + bi

```javascript
class GaussianInteger {
  constructor(real, imag) {
    this.real = real;
    this.imag = imag;
  }
  
  norm() { return this.real ** 2 + this.imag ** 2; }
  
  isGaussianPrime() {
    const n = this.norm();
    if (!isPrime(n)) return false;
    return n % 4 === 3 || (this.real !== 0 && this.imag !== 0);
  }
}
```

Primes split in Z[i] according to their residue mod 4:
- p ≡ 1 (mod 4): splits as (a+bi)(a-bi) where p = a² + b²
- p ≡ 3 (mod 4): remains prime
- p = 2: ramifies as -i(1+i)²

### Eisenstein Integers Z[ω]

Where ω = e^(2πi/3) is a primitive cube root of unity:

```javascript
class EisensteinInteger {
  constructor(a, b) {
    this.a = a;  // a + bω
    this.b = b;
  }
  
  norm() { return this.a ** 2 - this.a * this.b + this.b ** 2; }
  
  isEisensteinPrime() {
    const n = this.norm();
    return isPrime(n) && n % 3 === 2;
  }
}
```

These extensions enable richer prime structures for specialized applications.

---

## The Vocabulary System

Aleph maintains a vocabulary mapping words to prime signatures:

```javascript
const vocabulary = {
  "love": [2, 3, 5],
  "wisdom": [2, 7, 11],
  "truth": [7, 11, 13],
  "beauty": [2, 5, 11],
  "justice": [3, 7, 19],
  // ... thousands of entries
};
```

### Word Encoding

Unknown words are encoded by character codes:

```javascript
wordToPrimes(word) {
  return [...word].map(c => primes[c.charCodeAt(0) % primes.length]);
}
```

This ensures every word has a prime representation, even if it's not in the vocabulary.

### Vocabulary Learning

New vocabulary can be learned:

```javascript
backend.learn("serendipity", [2, 29, 53]);
// Now "serendipity" maps to [existence, becoming, kairos]
// "a fortunate existence-change at the right moment"
```

---

## Summary

Prime semantics provides:

1. **Uniqueness**: Every concept has a unique prime signature
2. **Compositionality**: Complex concepts from simple prime combinations
3. **Algebraic structure**: Semantic operations become arithmetic operations
4. **Frequency encoding**: Primes map to oscillator frequencies
5. **Angle encoding**: Primes contribute to hypercomplex state geometry
6. **Extensibility**: Algebraic extensions for specialized applications

The prime hypothesis enables rigorous mathematical treatment of meaning—something previously considered impossible.

---

## Next: [Hypercomplex Algebra →](./02-hypercomplex-algebra.md)