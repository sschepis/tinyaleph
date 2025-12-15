# Hypercomplex Algebra

## The Cayley-Dickson Construction

Hypercomplex numbers are generalizations of complex numbers to higher dimensions. The **Cayley-Dickson construction** is a recursive method for building these algebras:

```
Real numbers (1D) → Complex numbers (2D) → Quaternions (4D) → Octonions (8D) → Sedenions (16D) → ...
```

Each doubling introduces new properties (and loses old ones):

| Algebra | Dimension | Properties Lost |
|---------|-----------|-----------------|
| Reals | 1 | - |
| Complex | 2 | Ordering |
| Quaternions | 4 | Commutativity |
| Octonions | 8 | Associativity |
| Sedenions | 16 | Alternativity |

Aleph uses 16-dimensional sedenions because they provide:
- Sufficient dimensionality for rich semantic states
- Non-commutativity for word order encoding
- Zero-divisors for paradox resolution

---

## The Hypercomplex Class

The core `Hypercomplex` class implements generic Cayley-Dickson algebras:

```javascript
class Hypercomplex {
  constructor(dim, components = null) {
    if (!Number.isInteger(Math.log2(dim))) {
      throw new Error('Dimension must be power of 2');
    }
    this.dim = dim;
    this.c = components instanceof Float64Array 
      ? components 
      : new Float64Array(dim);
  }
}
```

### Factory Methods

```javascript
// Zero element
Hypercomplex.zero(16);
// → [0, 0, 0, ..., 0]

// Basis element
Hypercomplex.basis(16, 3, 1.0);
// → [0, 0, 0, 1, 0, ..., 0] (1 at index 3)

// Real number embedding
Hypercomplex.fromReal(16, 5.0);
// → [5, 0, 0, ..., 0]

// From array
Hypercomplex.fromArray([1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
```

---

## Arithmetic Operations

### Addition and Subtraction

Component-wise, as in standard vector spaces:

```javascript
add(other) {
  const r = new Hypercomplex(this.dim);
  for (let i = 0; i < this.dim; i++) {
    r.c[i] = this.c[i] + other.c[i];
  }
  return r;
}
```

### Scalar Multiplication

```javascript
scale(k) {
  const r = new Hypercomplex(this.dim);
  for (let i = 0; i < this.dim; i++) {
    r.c[i] = this.c[i] * k;
  }
  return r;
}
```

### Hypercomplex Multiplication

This is where the magic happens. Hypercomplex multiplication is **non-commutative**:

```javascript
mul(other) {
  const r = new Hypercomplex(this.dim);
  for (let i = 0; i < this.dim; i++) {
    for (let j = 0; j < this.dim; j++) {
      const [k, s] = multiplyIndices(this.dim, i, j);
      r.c[k] += s * this.c[i] * other.c[j];
    }
  }
  return r;
}
```

The `multiplyIndices` function returns the target index `k` and sign `s` for the product of basis elements `eᵢ × eⱼ`.

---

## The Fano Plane

For octonions (8D), multiplication is defined by the **Fano plane**—a finite projective geometry with 7 points and 7 lines:

```
         1
        /|\
       / | \
      2  |  4
     / \ | / \
    /   \|/   \
   3-----7-----5
    \   /|\   /
     \ / | \ /
      6  |  ?
          \|/
```

The seven lines of the Fano plane:

```javascript
const FANO_LINES = [
  [1, 2, 3],
  [1, 4, 5],
  [1, 6, 7],
  [2, 4, 6],
  [2, 5, 7],
  [3, 4, 7],
  [3, 5, 6]
];
```

### Octonion Multiplication

```javascript
function octonionMultiplyIndex(i, j) {
  if (i === 0) return [j, 1];      // e₀ is identity
  if (j === 0) return [i, 1];
  if (i === j) return [0, -1];     // eᵢ² = -1
  
  // Find line containing both i and j
  for (const line of FANO_LINES) {
    const xi = line.indexOf(i);
    if (xi >= 0 && line.includes(j)) {
      const xj = line.indexOf(j);
      const k = line[3 - xi - xj];  // Third element
      const sign = (xj - xi + 3) % 3 === 1 ? 1 : -1;
      return [k, sign];
    }
  }
  return [i ^ j, 1];  // XOR fallback
}
```

### Sedenion Extension

Sedenions are built from octonions via Cayley-Dickson doubling:

```javascript
function sedenionMultiplyIndex(i, j) {
  if (i === 0) return [j, 1];
  if (j === 0) return [i, 1];
  if (i === j) return [0, -1];
  
  const hi = i >= 8, hj = j >= 8;  // Which half?
  const li = i & 7, lj = j & 7;    // Index within half
  
  if (!hi && !hj) return octonionMultiplyIndex(li, lj);
  if (hi && hj) {
    const [k, s] = octonionMultiplyIndex(li, lj);
    return [k, -s];  // Sign flip for high-high
  }
  if (!hi) {
    const [k, s] = octonionMultiplyIndex(lj, li);
    return [k + 8, s];
  }
  const [k, s] = octonionMultiplyIndex(li, lj);
  return [k + 8, -s];
}
```

---

## Conjugation and Inverse

### Conjugate

The conjugate flips all imaginary components:

```javascript
conjugate() {
  const r = new Hypercomplex(this.dim);
  r.c[0] = this.c[0];  // Real part unchanged
  for (let i = 1; i < this.dim; i++) {
    r.c[i] = -this.c[i];  // Imaginary parts negated
  }
  return r;
}
```

### Norm

The norm is the square root of the inner product:

```javascript
norm() {
  return Math.sqrt(this.dot(this));
}

dot(other) {
  let s = 0;
  for (let i = 0; i < this.dim; i++) {
    s += this.c[i] * other.c[i];
  }
  return s;
}
```

### Inverse

The inverse uses conjugate and norm:

```javascript
inverse() {
  const n2 = this.dot(this);
  if (n2 < 1e-10) return Hypercomplex.zero(this.dim);
  return this.conjugate().scale(1 / n2);
}
```

**Warning**: In sedenions, zero-divisors exist—elements with non-zero norm whose product is zero. These elements don't have traditional inverses.

---

## Zero-Divisors: Paradox Tunnels

A remarkable property of sedenions is the existence of **zero-divisors**:

```javascript
isZeroDivisorWith(other) {
  const prod = this.mul(other);
  return this.norm() > 0.1 && 
         other.norm() > 0.1 && 
         prod.norm() < 0.01;
}
```

### Semantic Interpretation

Zero-divisors represent **paradoxes** or **tunnels** between concepts:

```
light × darkness = 0  (paradox)
→ Tunnel exists to concept "contrast"

self × other = 0  (boundary paradox)
→ Tunnel exists to concept "relationship"
```

When two concepts multiply to zero, they annihilate—but this annihilation reveals a deeper concept.

### Finding Zero-Divisor Pairs

```javascript
function findZeroDivisorPair(state) {
  // Search for states that annihilate with the given state
  for (let i = 0; i < dim; i++) {
    const candidate = Hypercomplex.basis(dim, i);
    if (state.isZeroDivisorWith(candidate)) {
      return candidate;
    }
  }
  return null;
}
```

---

## Entropy and Coherence

### State Entropy

Shannon entropy measures how "spread out" a state is:

```javascript
entropy() {
  const n = this.norm();
  if (n < 1e-10) return 0;
  let h = 0;
  for (let i = 0; i < this.dim; i++) {
    const p = (this.c[i] / n) ** 2;
    if (p > 1e-10) h -= p * Math.log2(p);
  }
  return h;
}
```

- **Low entropy** (0-1): State concentrated on few dimensions → clear meaning
- **High entropy** (3-4): State spread across many dimensions → confused meaning

### Coherence

Coherence measures alignment between two states:

```javascript
coherence(other) {
  const n1 = this.norm(), n2 = other.norm();
  if (n1 < 1e-10 || n2 < 1e-10) return 0;
  return Math.abs(this.dot(other)) / (n1 * n2);
}
```

- **Coherence = 1**: States perfectly aligned (same meaning)
- **Coherence = 0**: States orthogonal (unrelated meanings)

---

## Dominant Axes

Finding which dimensions carry the most weight:

```javascript
dominantAxes(n = 3) {
  return [...this.c]
    .map((v, i) => ({ i, v: Math.abs(v) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n);
}
```

This reveals which semantic axes (corresponding to primes) are most active in a state.

---

## Primes to Hypercomplex State

Converting prime signatures to hypercomplex states:

```javascript
primesToState(primes) {
  const state = Hypercomplex.zero(this.dimension);
  for (const p of primes) {
    const angle = primeToAngle(p);
    for (let i = 0; i < this.dimension; i++) {
      state.c[i] += Math.cos(angle * (i + 1)) / Math.sqrt(primes.length);
    }
  }
  return state.normalize();
}
```

Each prime contributes a rotation to the state vector. The resulting vector exists in 16-dimensional hypercomplex space.

---

## Non-Commutative Encoding

The key insight: hypercomplex multiplication is non-commutative, so we can encode word order:

```javascript
orderedPrimesToState(orderedTokens) {
  let state = Hypercomplex.basis(this.dimension, 0, 1);  // Identity
  
  for (let i = 0; i < orderedTokens.length; i++) {
    const token = orderedTokens[i];
    const primes = token.primes;
    
    // Convert primes to hypercomplex rotation
    const tokenH = this.primesToHypercomplex(primes);
    
    // Apply position-dependent phase
    const positioned = this.applyPositionPhase(tokenH, i);
    
    // Sequential MULTIPLICATION (non-commutative!)
    state = state.mul(positioned);
  }
  
  return state.normalize();
}
```

Now:
```javascript
encode("dog bites man")  // → state₁
encode("man bites dog")  // → state₂
state₁ ≠ state₂  // Different! Order preserved!
```

---

## Summary

Hypercomplex algebra provides:

1. **16-dimensional state space** for rich semantic representations
2. **Non-commutative multiplication** for encoding word order
3. **Zero-divisors** for representing and resolving paradoxes
4. **Entropy** for measuring conceptual clarity
5. **Coherence** for measuring semantic alignment
6. **Fano plane structure** for principled multiplication

The algebra is the mathematical substrate on which meaning exists.

---

## Next: [Phase Synchronization →](./03-phase-synchronization.md)