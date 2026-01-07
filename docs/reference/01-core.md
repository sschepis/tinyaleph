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
```

---

## Hypercomplex Extensions

Additional methods added to the Hypercomplex class for advanced algebra.

### Exponential and Logarithm

#### exp()

Compute the hypercomplex exponential.

```javascript
state.exp()
```

**Returns:** Hypercomplex - e^q

**Notes:**
- Uses generalized Euler formula: e^q = e^a(cos|v| + v̂·sin|v|)
- Where a is scalar part, v is vector part

**Example:**
```javascript
const q = Hypercomplex.fromArray([1, 0.5, 0, 0]);
const expQ = q.exp();
```

#### log()

Compute the hypercomplex logarithm.

```javascript
state.log()
```

**Returns:** Hypercomplex - log(q)

**Notes:**
- log(q) = log|q| + v̂·arccos(a/|q|)
- Inverse of exp()

---

### Power Operations

#### pow(n)

Raise to a power using exp/log.

```javascript
state.pow(n)
```

**Parameters:**
- `n` (number): Exponent (integer or fractional)

**Returns:** Hypercomplex - q^n

#### powInt(n)

Efficient integer power by repeated multiplication.

```javascript
state.powInt(n)
```

**Parameters:**
- `n` (number): Integer exponent

**Returns:** Hypercomplex - q^n

---

### Interpolation

#### slerp(other, t)

Spherical linear interpolation.

```javascript
state.slerp(other, t)
```

**Parameters:**
- `other` (Hypercomplex): Target state
- `t` (number): Parameter in [0, 1]

**Returns:** Hypercomplex - Interpolated state

**Example:**
```javascript
const q1 = Hypercomplex.fromAxisAngle(4, [1,0,0], 0);
const q2 = Hypercomplex.fromAxisAngle(4, [0,0,1], Math.PI/2);

for (let t = 0; t <= 1; t += 0.1) {
  const interpolated = q1.slerp(q2, t);
}
```

#### squad(q1, q2, q3, t)

Spherical cubic interpolation for smooth paths.

```javascript
state.squad(q1, q2, q3, t)
```

**Parameters:**
- `q1, q2, q3` (Hypercomplex): Control points
- `t` (number): Parameter in [0, 1]

**Returns:** Hypercomplex - Smoothly interpolated state

---

### Rotation Operations

#### sandwich(v)

Apply rotation to a vector: q·v·q*

```javascript
state.sandwich(v)
```

**Parameters:**
- `v` (Hypercomplex): Vector to rotate

**Returns:** Hypercomplex - Rotated vector

#### rotateVector(v)

Rotate a 3D vector using quaternion.

```javascript
state.rotateVector(v)
```

**Parameters:**
- `v` (Array<number>): 3D vector [x, y, z]

**Returns:** Array<number> - Rotated vector

#### fromAxisAngle(dim, axis, angle)

Create rotation from axis and angle.

```javascript
Hypercomplex.fromAxisAngle(dim, axis, angle)
```

**Parameters:**
- `dim` (number): Dimension (4 for quaternion)
- `axis` (Array<number>): Rotation axis [x, y, z]
- `angle` (number): Rotation angle in radians

**Returns:** Hypercomplex - Unit quaternion

#### toAxisAngle()

Extract axis and angle from rotation.

```javascript
state.toAxisAngle()
```

**Returns:** Object - `{ axis: [x,y,z], angle: number }`

---

### Helper Methods

#### scalar()

Get scalar (real) part.

```javascript
state.scalar()
```

**Returns:** number - c[0]

#### vector()

Get vector (imaginary) part.

```javascript
state.vector()
```

**Returns:** Hypercomplex - State with c[0] = 0

#### isUnit(epsilon)

Check if unit norm.

```javascript
state.isUnit(epsilon)
```

**Returns:** boolean - |norm - 1| < epsilon

---

## Prime Entanglement Graph (`core/entanglement.js`)

Track prime relationships from co-occurrence and resonance.

### PrimeEntanglementGraph

```javascript
new PrimeEntanglementGraph(primes, options)
```

**Parameters:**
- `primes` (number | Array): Number of primes or explicit list
- `options` (Object):
  - `decayRate` (number): Edge weight decay (default 0.01)
  - `learningRate` (number): Weight update rate (default 0.1)
  - `pruneThreshold` (number): Minimum edge weight (default 0.01)

**Example:**
```javascript
const graph = new PrimeEntanglementGraph([2, 3, 5, 7, 11]);

// Record co-occurrence
graph.observe([2, 3], [5, 7], 0.8);

// Query relationships
const neighbors = graph.neighbors(7, 2);
const path = graph.shortestPath(2, 11);
```

#### Methods

| Method | Description |
|--------|-------------|
| `observe(from, to, strength)` | Record co-occurrence |
| `neighbors(prime, depth)` | Get k-hop neighborhood |
| `shortestPath(from, to)` | Find shortest path |
| `clusteringCoefficient(prime)` | Get local clustering |
| `decay(factor)` | Apply decay to all edges |
| `prune(threshold)` | Remove weak edges |
| `toAdjacencyMatrix(primeList)` | Convert to matrix |
| `toNetworkKuramoto(options)` | Create Kuramoto model |
| `stats()` | Get graph statistics |

---

## Event System (`core/events.js`)

Event-driven monitoring for real-time applications.

### AlephEventEmitter

EventEmitter compatible with Node.js pattern.

```javascript
new AlephEventEmitter(options)
```

**Parameters:**
- `options` (Object):
  - `maxHistory` (number): Event history size (default 1000)

**Methods:**

| Method | Description |
|--------|-------------|
| `on(event, callback)` | Add listener |
| `once(event, callback)` | Add one-time listener |
| `off(event, callback)` | Remove listener |
| `emit(event, data)` | Emit event |
| `throttle(event, interval)` | Throttle event |
| `pause()` / `resume()` | Pause/resume emissions |
| `waitFor(event, timeout)` | Promise for next event |
| `getHistory(event, limit)` | Get event history |

**Example:**
```javascript
const emitter = new AlephEventEmitter();

emitter.throttle('tick', 100);  // Max 10/sec

emitter.on('collapse', ({ from, to }) => {
  console.log(`Collapsed: ${from} → ${to}`);
});

const data = await emitter.waitFor('ready', 5000);
```

---

### AlephMonitor

High-level monitoring wrapper for AlephEngine.

```javascript
new AlephMonitor(engine, options)
```

**Parameters:**
- `engine` (AlephEngine): Engine to monitor
- `options` (Object):
  - `entropyLow` (number): Low entropy threshold
  - `entropyHigh` (number): High entropy threshold
  - `syncThreshold` (number): Sync detection threshold

**Events emitted:**
- `tick`: Each time step
- `collapse`: State collapse
- `entropy:low` / `entropy:high`: Threshold crossings
- `sync`: Synchronization detected
- `coherence:high`: High coherence detected

---

### EvolutionStream

Async iterator for engine evolution.

```javascript
new EvolutionStream(engine, options)
// or
EvolutionStream.fromEvolvable(evolvable, options)
```

**Parameters:**
- `engine` (Object): Engine or evolvable object
- `options` (Object):
  - `dt` (number): Time step (default 0.01)
  - `maxSteps` (number): Maximum steps
  - `stopCondition` (Function): Stop predicate

**Methods:**

| Method | Description |
|--------|-------------|
| `take(n)` | Take first n items |
| `filter(predicate)` | Filter stream |
| `map(transform)` | Transform stream |
| `batch(size)` | Group into batches |
| `reduce(fn, init)` | Reduce to value |
| `collect(max)` | Collect to array |

**Example:**
```javascript
const stream = EvolutionStream.fromEvolvable(kuramoto);

for await (const state of stream.take(100)) {
  console.log(state.orderParameter);
}

// With operators
const result = await stream
  .filter(s => s.entropy < 2.0)
  .map(s => s.orderParameter)
  .take(50)
  .collect();
```

---

## ResoFormer Layers (`core/rformer-layers.js`)

Complete transformer architecture for prime-indexed states.

### ResonantMultiHeadAttention

Multi-head attention with different resonance weights per head.

```javascript
new ResonantMultiHeadAttention(config)
```

**Parameters:**
- `config` (Object):
  - `numHeads` (number): Number of heads (default 8)
  - `numPrimes` (number): Prime vocabulary size (default 4096)
  - `activeK` (number): Sparsity per state (default 32)
  - `temperature` (number): Softmax temperature (default 1.0)

**Example:**
```javascript
const attention = new ResonantMultiHeadAttention({ numHeads: 8 });

const result = attention.forward(query, keys, values);
console.log(result.result);           // Combined output
console.log(result.headOutputs);      // Per-head outputs
console.log(result.attentionWeights); // Attention weights
```

---

### PrimeFFN

Prime-indexed feed-forward network.

```javascript
new PrimeFFN(config)
```

**Parameters:**
- `config` (Object):
  - `hiddenDim` (number): Hidden dimension (default 256)
  - `activation` (string): 'relu', 'gelu', 'swish', 'tanh'
  - `dropout` (number): Dropout probability

---

### PrimeLayerNorm

Layer normalization preserving prime structure.

```javascript
new PrimeLayerNorm(config)
```

**Parameters:**
- `config` (Object):
  - `eps` (number): Epsilon for stability
  - `gamma` (number): Scale parameter
  - `beta` (number): Shift parameter

---

### PositionalPrimeEncoding

Position encoding using prime phases.

```javascript
new PositionalPrimeEncoding(config)
```

**Parameters:**
- `config` (Object):
  - `maxLength` (number): Maximum sequence length
  - `type` (string): 'sinusoidal', 'prime', or 'golden'

**Methods:**
- `getEncoding(pos)`: Get encoding for position
- `encode(state, pos)`: Add encoding to state
- `encodeSequence(states)`: Encode entire sequence

---

### ResoFormerBlock

Complete transformer block.

```javascript
new ResoFormerBlock(config)
```

**Parameters:**
- `config` (Object):
  - `numHeads` (number): Attention heads
  - `hiddenDim` (number): FFN dimension
  - `preNorm` (boolean): Pre-norm style (default true)
  - `dropout` (number): Dropout rate

**Example:**
```javascript
const block = new ResoFormerBlock({
  numHeads: 8,
  hiddenDim: 256
});

const result = block.forward(input, context);
```

---

### ResoFormer

Full multi-layer transformer model.

```javascript
new ResoFormer(config)
```

**Parameters:**
- `config` (Object):
  - `numLayers` (number): Number of blocks (default 6)
  - `numHeads` (number): Heads per block (default 8)
  - `hiddenDim` (number): FFN dimension (default 256)
  - `numPrimes` (number): Prime vocabulary (default 4096)
  - `activeK` (number): Sparsity parameter (default 32)
  - `usePositionalEncoding` (boolean): Add position (default true)

**Methods:**
- `forward(input)`: Process input state(s)
- `train(mode)` / `eval()`: Set training mode
- `getParameterCount()`: Get parameter count

**Example:**
```javascript
const model = new ResoFormer({
  numLayers: 6,
  numHeads: 8,
  hiddenDim: 256
});

const sequence = [
  SparsePrimeState.fromPrimes([2, 3, 5]),
  SparsePrimeState.fromPrimes([7, 11, 13])
];

const outputs = model.forward(sequence);
console.log(outputs.output);        // Final outputs
console.log(outputs.layerOutputs);  // Per-layer outputs