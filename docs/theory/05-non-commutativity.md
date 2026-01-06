# Non-Commutativity: Why Word Order Matters

## The Critical Insight

Consider these two sentences:
- "Dog bites man" 
- "Man bites dog"

They contain the exact same words, but their meanings are completely different. If we encode concepts as unordered sets of primes, we lose this distinction:

```javascript
// WRONG: Treats as unordered set
encode("dog bites man")  →  {dog, bites, man}  →  [2, 3, 5]
encode("man bites dog")  →  {man, bites, dog}  →  [2, 3, 5]

// Same encoding! But completely different meanings!
```

This is the **non-commutativity problem**.

---

## Semantic Non-Commutativity

Word order encodes meaning that cannot be captured by bags of words:

| Expression A | Expression B | Same Words? | Same Meaning? |
|-------------|-------------|-------------|---------------|
| "dog bites man" | "man bites dog" | ✓ | ✗ |
| "A causes B" | "B causes A" | ✓ | ✗ |
| "I love you" | "You love me" | ✓ | ✗ |
| "time creates change" | "change creates time" | ✓ | ✗ |
| "theory → experiment" | "experiment → theory" | ✓ | ✗ |

### What Order Encodes

1. **Agent/Patient** - who does what to whom
2. **Causation** - what causes what
3. **Temporal sequence** - what happens first
4. **Topic/Comment** - what we're talking about vs. what we say
5. **Given/New** - what's assumed vs. what's introduced

---

## Hypercomplex Non-Commutativity

The solution lies in hypercomplex multiplication, which is non-commutative:

```
For quaternions and beyond:

e₁ × e₂ = e₃
e₂ × e₁ = -e₃

A × B ≠ B × A (in general)
```

This non-commutativity is THE MECHANISM for encoding order—but only if we USE it.

---

## The Flawed Approach

The old implementation used summation (commutative):

```javascript
// OLD: Commutative sum - order doesn't matter
primesToState(primes) {
  const state = Hypercomplex.zero(this.dimension);
  for (const p of primes) {  // Order is incidental
    const angle = primeToAngle(p);
    for (let i = 0; i < this.dimension; i++) {
      state.c[i] += Math.cos(angle * (i + 1)) / Math.sqrt(primes.length);
    }
  }
  return state.normalize();
}
```

The `+=` operation is commutative. Summing in any order gives the same result.

---

## Solution: Sequential Multiplication

Use hypercomplex multiplication instead of addition:

```javascript
orderedPrimesToState(orderedTokens) {
  // Start with identity element (1 in hypercomplex)
  let state = Hypercomplex.basis(this.dimension, 0, 1);
  
  for (let i = 0; i < orderedTokens.length; i++) {
    const token = orderedTokens[i];
    const primes = token.primes;
    
    // Convert primes to hypercomplex rotation
    const tokenH = this.primesToHypercomplex(primes);
    
    // Apply position-dependent phase shift
    const positioned = this.applyPositionPhase(tokenH, i);
    
    // MULTIPLY (non-commutative!) - order matters!
    state = state.mul(positioned);
  }
  
  return state.normalize();
}
```

Now:
```javascript
encode("dog bites man")  // [dog, bites, man]
state1 = e_dog × e_bites × e_man

encode("man bites dog")  // [man, bites, dog]  
state2 = e_man × e_bites × e_dog

state1 ≠ state2  // Different! Non-commutative multiplication preserves order!
```

---

## Converting Primes to Hypercomplex

Each prime becomes a rotation in hypercomplex space:

```javascript
primesToHypercomplex(primes) {
  // Start with 1 (identity)
  let h = Hypercomplex.basis(this.dimension, 0, 1);
  
  for (const p of primes) {
    const angle = primeToAngle(p);
    const axis = (p % (this.dimension - 1)) + 1;  // Use prime to select axis
    
    // Create rotation: cos(θ) + sin(θ)·eₐₓᵢₛ
    const rot = Hypercomplex.zero(this.dimension);
    rot.c[0] = Math.cos(angle);
    rot.c[axis] = Math.sin(angle);
    
    // Accumulate by multiplication
    h = h.mul(rot);
  }
  
  return h.normalize();
}
```

Each prime contributes a rotation in a different plane of hypercomplex space.

---

## Position-Dependent Phase

Position further breaks symmetry:

```javascript
applyPositionPhase(h, position) {
  // Use position-th prime for phase shift
  const posPrime = nthPrime(position + 1);
  const angle = primeToAngle(posPrime) * 0.5;  // Half angle
  
  // Rotate in position-dependent plane
  const posAxis = (position % (this.dimension - 2)) + 1;
  
  const rot = Hypercomplex.zero(this.dimension);
  rot.c[0] = Math.cos(angle);
  rot.c[posAxis] = Math.sin(angle);
  
  return h.mul(rot);
}
```

This ensures that even if two words have the same primes, their position affects the state differently.

---

## The Ordered Encoding Pipeline

```
           ORDERED INPUT
           "dog bites man"
                │
                ▼
       ┌─────────────────┐
       │  Ordered Encode │
       │  [{word: "dog", │
       │    primes: [...],│
       │    position: 0}, │
       │   {word: "bites",│
       │    primes: [...],│
       │    position: 1}, │
       │   {word: "man",  │
       │    primes: [...],│
       │    position: 2}] │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Prime to       │
       │  Hypercomplex   │
       │  (for each      │
       │   token)        │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Position       │
       │  Phase Shift    │  ← Breaks residual symmetry
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Sequential     │
       │  Multiplication │  ← Non-commutative!
       │  H₀ × H₁ × H₂   │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  State Vector   │
       │  (16D)          │  ← Order is now encoded
       └─────────────────┘
```

---

## Verification

Test that order is preserved:

```javascript
const backend = new SemanticBackend({ dimension: 16 });

// Encode ordered sentences
const tokens1 = backend.encodeOrdered("dog bites man");
const tokens2 = backend.encodeOrdered("man bites dog");

const state1 = backend.orderedPrimesToState(tokens1);
const state2 = backend.orderedPrimesToState(tokens2);

const similarity = state1.coherence(state2);
console.log(`Similarity: ${similarity}`);  // Should be < 1.0

if (similarity > 0.95) {
  throw new Error("Order not being encoded - states too similar!");
}

console.log("✓ Non-commutativity preserved");
```

---

## What This Enables

With order properly encoded:

| Capability | Example |
|-----------|---------|
| **Subject-Object distinction** | "A loves B" vs "B loves A" |
| **Causal direction** | "rain causes flood" vs "flood causes rain" |
| **Narrative sequence** | Story order affects meaning |
| **Argument structure** | "if A then B" vs "if B then A" |
| **Dependency parsing** | Word relationships are directed |
| **Temporal reasoning** | before/after are opposite |

---

## Alternative Approaches

### Position-Dependent Encoding

Encode position into the prime representation:

```javascript
encodeOrdered(tokens) {
  const orderedPrimes = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const basePrimes = this.vocabulary.get(tokens[i]);
    
    // Modify primes by position
    const positionalPrimes = basePrimes.map(p => {
      return [p, nthPrime(i + 1)];  // Tuple: (concept, position)
    });
    
    orderedPrimes.push(...positionalPrimes);
  }
  
  return orderedPrimes;
}
```

### Ordered Pairs Algebra

Treat ordered pairs of concepts as new concepts:

```javascript
encodeRelational(tokens) {
  const primes = [];
  
  // Encode individual concepts
  for (const token of tokens) {
    primes.push(...this.encode(token));
  }
  
  // Encode PAIRS (order matters)
  for (let i = 0; i < tokens.length - 1; i++) {
    const pairPrime = this.getRelationPrime(tokens[i], tokens[i+1]);
    primes.push(pairPrime);  // Asymmetric relation
  }
  
  return primes;
}

getRelationPrime(from, to) {
  const fromPrimes = this.encode(from);
  const toPrimes = this.encode(to);
  
  // Asymmetric combination: (A,B) ≠ (B,A)
  const forwardProduct = fromPrimes.reduce((a,b) => a*b, 1);
  const backwardProduct = toPrimes.reduce((a,b) => a+b, 0);
  
  return forwardProduct * 1000 + backwardProduct;
}
```

---

## The Deep Insight

**Syntax IS meaning.** Word order is not separate from meaning—it IS part of the meaning.

Non-commutative algebras (quaternions, sedenions) have non-commutativity built into their structure. When A × B ≠ B × A:
- A × B can encode "A acts on B"
- B × A can encode "B acts on A"
- The order encodes the DIRECTION of the relationship

This is exactly what natural language needs for semantic computing.

---

## Quaternionic Sentences

A more advanced approach represents each word as a quaternion:

```javascript
class SemanticQuaternion {
  constructor(w, x, y, z) {
    this.w = w;  // Scalar: "being" aspect
    this.x = x;  // i: "doing" aspect
    this.y = y;  // j: "receiving" aspect
    this.z = z;  // k: "relating" aspect
  }
  
  mul(other) {
    // Hamilton's quaternion multiplication (non-commutative!)
    return new SemanticQuaternion(
      this.w*other.w - this.x*other.x - this.y*other.y - this.z*other.z,
      this.w*other.x + this.x*other.w + this.y*other.z - this.z*other.y,
      this.w*other.y - this.x*other.z + this.y*other.w + this.z*other.x,
      this.w*other.z + this.x*other.y - this.y*other.x + this.z*other.w
    );
  }
}

// "dog" emphasizes subject (w)
const dog = new SemanticQuaternion(0.8, 0.2, 0.1, 0.1);

// "bites" emphasizes action (x)
const bites = new SemanticQuaternion(0.1, 0.9, 0.1, 0.1);

// "man" can be subject or object
const man = new SemanticQuaternion(0.5, 0.2, 0.5, 0.1);

// "dog bites man"
const dbm = dog.mul(bites).mul(man);

// "man bites dog"
const mbd = man.mul(bites).mul(dog);

// dbm ≠ mbd due to non-commutativity!
```

---

## Summary

Non-commutativity is essential for semantic computing:

1. **Word order encodes meaning** that cannot be captured by bags of words
2. **Hypercomplex multiplication is non-commutative** by mathematical necessity
3. **Sequential multiplication** of token representations preserves order
4. **Position-dependent phases** add further asymmetry
5. **Non-commutativity is a feature**, not a bug

Without order encoding, we can only compute with bags of words—not sentences, not arguments, not narratives.

---

## Next: [Two-Layer Meaning →](./06-two-layer-meaning.md)