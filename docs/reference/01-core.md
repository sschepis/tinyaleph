# Core Module Reference

The core module provides the fundamental mathematical primitives for Aleph.

## Hypercomplex (`core/hypercomplex.js`)

### SedenionState

The primary state object representing a point in 16-dimensional hypercomplex space.

#### Constructor

```javascript
new SedenionState(components)
```

**Parameters:**
- `components` (Array<number>): Exactly 16 real numbers

**Throws:**
- `Error` if components length ≠ 16

**Example:**
```javascript
const state = new SedenionState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
```

---

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `dimension` | number | Always 16 for sedenions |
| `components` | number[] | The 16 real components |

---

#### add(other)

Add two sedenion states component-wise.

```javascript
state.add(other)
```

**Parameters:**
- `other` (SedenionState): State to add

**Returns:** SedenionState - New state with sum

**Example:**
```javascript
const a = new SedenionState([1, 0, ...]);
const b = new SedenionState([0, 1, ...]);
const c = a.add(b);  // [1, 1, ...]
```

---

#### subtract(other)

Subtract another state component-wise.

```javascript
state.subtract(other)
```

**Parameters:**
- `other` (SedenionState): State to subtract

**Returns:** SedenionState - New state with difference

---

#### multiply(other)

Multiply using Cayley-Dickson sedenion multiplication.

```javascript
state.multiply(other)
```

**Parameters:**
- `other` (SedenionState): State to multiply with

**Returns:** SedenionState - Product state

**Notes:**
- Non-commutative: `a.multiply(b) ≠ b.multiply(a)`
- Non-associative: `(a*b)*c ≠ a*(b*c)`
- May produce zero-divisors

**Example:**
```javascript
const a = new SedenionState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const b = new SedenionState([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const c = a.multiply(b);
```

---

#### scale(scalar)

Multiply all components by a scalar.

```javascript
state.scale(scalar)
```

**Parameters:**
- `scalar` (number): Scaling factor

**Returns:** SedenionState - Scaled state

**Example:**
```javascript
const doubled = state.scale(2);
const halved = state.scale(0.5);
```

---

#### norm()

Calculate the Euclidean norm (magnitude).

```javascript
state.norm()
```

**Returns:** number - √(Σ cᵢ²)

**Example:**
```javascript
const unit = new SedenionState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
console.log(unit.norm());  // 1.0
```

---

#### normalize()

Return a unit-norm version of this state.

```javascript
state.normalize()
```

**Returns:** SedenionState - State with norm = 1

**Throws:**
- `Error` if norm is zero

**Example:**
```javascript
const scaled = state.scale(100);
const unit = scaled.normalize();
console.log(unit.norm());  // 1.0
```

---

#### conjugate()

Return the hypercomplex conjugate.

```javascript
state.conjugate()
```

**Returns:** SedenionState - Conjugate state

**Notes:**
- For sedenions: `conj([a, b, c, ...]) = [a, -b, -c, ...]`
- The real part (e₀) is unchanged, all imaginary parts are negated

---

#### inverse()

Return the multiplicative inverse.

```javascript
state.inverse()
```

**Returns:** SedenionState - State where `state * inverse ≈ 1`

**Throws:**
- `Error` if norm is zero

**Example:**
```javascript
const inv = state.inverse();
const identity = state.multiply(inv);
console.log(identity.components[0]);  // ~1.0
```

---

#### entropy()

Calculate Shannon entropy of the normalized component distribution.

```javascript
state.entropy()
```

**Returns:** number - Entropy value in range [0, log₂(16)]

**Notes:**
- Lower entropy = more concentrated distribution
- Higher entropy = more spread out distribution
- Used to measure "uncertainty" of state

**Example:**
```javascript
const pure = new SedenionState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
console.log(pure.entropy());  // 0.0 (fully concentrated)

const mixed = new SedenionState([0.25, 0.25, 0.25, 0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
console.log(mixed.entropy());  // 2.0 (spread across 4 components)
```

---

#### coherence(other)

Calculate coherence (normalized inner product) with another state.

```javascript
state.coherence(other)
```

**Parameters:**
- `other` (SedenionState): State to compare with

**Returns:** number - Coherence value in range [0, 1]

**Notes:**
- 1.0 = identical (parallel)
- 0.0 = orthogonal
- Commutative: `a.coherence(b) === b.coherence(a)`

**Example:**
```javascript
const same = state.coherence(state);  // 1.0
const orthogonal = e0.coherence(e1);  // 0.0
```

---

#### isZeroDivisorWith(other)

Check if multiplication with another state produces zero.

```javascript
state.isZeroDivisorWith(other)
```

**Parameters:**
- `other` (SedenionState): State to check against

**Returns:** boolean - True if product norm < ε

**Notes:**
- Zero-divisors are unique to sedenions (not present in octonions or lower)
- Indicates semantic contradiction

---

#### clone()

Create a deep copy of this state.

```javascript
state.clone()
```

**Returns:** SedenionState - Independent copy

---

#### toString()

Return string representation.

```javascript
state.toString()
```

**Returns:** string - Format: `"[c₀, c₁, ..., c₁₅]"`

---

### cayleyDickson(a, b, conj)

Cayley-Dickson construction for building higher algebras.

```javascript
cayleyDickson(a, b, conj)
```

**Parameters:**
- `a` (Array): First half of components
- `b` (Array): Second half of components  
- `conj` (Function): Conjugation function

**Returns:** Object - `{ real, imag }` parts

**Notes:**
- Used internally for sedenion multiplication
- `(a, b) * (c, d) = (ac - d̄b, da + bc̄)`

---

### createBasisState(index, dimension)

Create a basis state with 1 in specified position.

```javascript
createBasisState(index, dimension)
```

**Parameters:**
- `index` (number): Position for the 1 (0-15)
- `dimension` (number): State dimension (default 16)

**Returns:** SedenionState - Basis state eᵢ

**Example:**
```javascript
const e0 = createBasisState(0);  // [1, 0, 0, ...]
const e5 = createBasisState(5);  // [0, 0, 0, 0, 0, 1, 0, ...]
```

---

### createRandomState(dimension)

Create a random normalized state.

```javascript
createRandomState(dimension)
```

**Parameters:**
- `dimension` (number): State dimension (default 16)

**Returns:** SedenionState - Random unit state

---

## Prime Utilities (`core/prime.js`)

### isPrime(n)

Check if a number is prime.

```javascript
isPrime(n)
```

**Parameters:**
- `n` (number): Integer to check

**Returns:** boolean

**Example:**
```javascript
isPrime(17);  // true
isPrime(18);  // false
```

---

### nextPrime(n)

Find the next prime ≥ n.

```javascript
nextPrime(n)
```

**Parameters:**
- `n` (number): Starting value

**Returns:** number - Next prime

**Example:**
```javascript
nextPrime(10);  // 11
nextPrime(11);  // 11
```

---

### factor(n)

Return prime factorization.

```javascript
factor(n)
```

**Parameters:**
- `n` (number): Integer to factor

**Returns:** Array<number> - Prime factors (with repetition)

**Example:**
```javascript
factor(12);  // [2, 2, 3]
factor(17);  // [17]
```

---

### primesBetween(low, high)

Generate all primes in a range.

```javascript
primesBetween(low, high)
```

**Parameters:**
- `low` (number): Lower bound (inclusive)
- `high` (number): Upper bound (inclusive)

**Returns:** Array<number> - All primes in range

**Example:**
```javascript
primesBetween(10, 20);  // [11, 13, 17, 19]
```

---

### GaussianInteger

Class for Gaussian integers (a + bi where a,b ∈ ℤ).

```javascript
new GaussianInteger(real, imag)
```

**Properties:**
- `real` (number): Real part
- `imag` (number): Imaginary part

**Methods:**
- `norm()`: Returns a² + b²
- `conjugate()`: Returns GaussianInteger(a, -b)
- `multiply(other)`: Gaussian integer multiplication
- `add(other)`: Gaussian integer addition

**Example:**
```javascript
const g = new GaussianInteger(3, 4);
console.log(g.norm());  // 25
```

---

### EisensteinInteger

Class for Eisenstein integers (a + bω where ω = e^(2πi/3)).

```javascript
new EisensteinInteger(a, b)
```

**Properties:**
- `a` (number): First coefficient
- `b` (number): Coefficient of ω

**Methods:**
- `norm()`: Returns a² - ab + b²
- `conjugate()`: Returns EisensteinInteger(a-b, -b)
- `multiply(other)`: Eisenstein multiplication

---

## Fano Plane (`core/fano.js`)

### FanoPlane

Encodes the Fano plane structure for octonion multiplication.

```javascript
const fano = new FanoPlane();
```

**Properties:**
- `lines`: Array of 7 lines, each containing 3 point indices
- `points`: Array of 7 points

**Methods:**

#### getTriple(i, j)

Get the third element completing a Fano line.

```javascript
fano.getTriple(i, j)
```

**Parameters:**
- `i` (number): First element (1-7)
- `j` (number): Second element (1-7)

**Returns:** number - Third element, or 0 if not on same line

#### sign(i, j)

Get the sign for octonion multiplication eᵢ × eⱼ.

```javascript
fano.sign(i, j)
```

**Parameters:**
- `i` (number): First index
- `j` (number): Second index

**Returns:** number - +1 or -1

**Notes:**
- Sign depends on cyclic ordering along Fano lines
- eᵢ × eⱼ = ±eₖ where k = getTriple(i,j)

---

### fanoMultiply(a, b)

Multiply two octonions using Fano plane rules.

```javascript
fanoMultiply(a, b)
```

**Parameters:**
- `a` (Array): 8-component octonion
- `b` (Array): 8-component octonion

**Returns:** Array - 8-component product

---

## Semantic Sieve (`core/sieve.js`)

### SemanticSieve

Implements the entropy-minimizing sieve algorithm.

```javascript
new SemanticSieve(config)
```

**Parameters:**
- `config` (Object):
  - `transforms` (Array): Available transforms
  - `entropyThreshold` (number): Minimum entropy target
  - `maxIterations` (number): Maximum sieve passes

---

#### sieve(primes, state)

Apply transforms until entropy is minimized.

```javascript
sieve.sieve(primes, state)
```

**Parameters:**
- `primes` (Array<number>): Input prime encoding
- `state` (SedenionState): Current hypercomplex state

**Returns:** Object - `{ primes, state, steps, entropy }`

---

#### selectTransform(primes, state)

Choose the best transform to apply next.

```javascript
sieve.selectTransform(primes, state)
```

**Parameters:**
- `primes` (Array<number>): Current primes
- `state` (SedenionState): Current state

**Returns:** Transform | null - Best transform or null if none applicable

**Notes:**
- Selection based on predicted entropy reduction
- Considers transform priority and conditions

---

## LLM Coupling (`core/llm.js`)

### LLMCoupling

Bridge between Aleph and language models.

```javascript
new LLMCoupling(engine, options)
```

**Parameters:**
- `engine` (AlephEngine): Aleph engine instance
- `options` (Object):
  - `entropyThreshold` (number): Max allowed entropy (default 0.3)
  - `coherenceThreshold` (number): Min coherence (default 0.7)
  - `collapseRate` (number): Collapse strength (default 0.8)

---

#### encodeToField(text)

Convert text to hypercomplex field state.

```javascript
coupling.encodeToField(text)
```

**Parameters:**
- `text` (string): Natural language text

**Returns:** SedenionState - Field representation

---

#### validateResponse(response, queryField)

Check if LLM response is semantically valid.

```javascript
coupling.validateResponse(response, queryField)
```

**Parameters:**
- `response` (string): LLM output text
- `queryField` (SedenionState): Original query field

**Returns:** Object - `{ valid, coherence, entropy, issues }`

---

#### constrainedQuery(prompt, constraintField)

Query LLM with semantic constraints.

```javascript
coupling.constrainedQuery(prompt, constraintField)
```

**Parameters:**
- `prompt` (string): Query prompt
- `constraintField` (SedenionState): Constraint to enforce

**Returns:** Promise<string> - Constrained response

---

## Constants

### SEDENION_DIMENSION

```javascript
const SEDENION_DIMENSION = 16;
```

### OCTONION_DIMENSION

```javascript
const OCTONION_DIMENSION = 8;
```

### QUATERNION_DIMENSION

```javascript
const QUATERNION_DIMENSION = 4;
```

### EPSILON

```javascript
const EPSILON = 1e-10;  // Floating point comparison threshold