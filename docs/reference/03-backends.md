# Backends Module Reference

The backends module provides domain-specific computation engines built on Aleph's core primitives.

## Backend Interface (`backends/interface.js`)

### BackendInterface

Abstract base class for all backends.

```javascript
class BackendInterface {
  constructor(config) { }
  encode(input) { }
  decode(primes) { }
  process(input) { }
}
```

#### constructor(config)

Initialize backend with configuration.

**Parameters:**
- `config` (Object): Backend configuration
  - `dimension` (number): State dimension (default 16)
  - `transforms` (Array): Available transforms
  - `vocabulary` (Object): Word-to-prime mappings
  - `ontology` (Object): Prime-to-meaning mappings

---

#### encode(input)

Convert input to prime encoding. Must be implemented by subclasses.

```javascript
backend.encode(input)
```

**Parameters:**
- `input` (any): Backend-specific input

**Returns:** Array<number> - Prime encoding

---

#### decode(primes)

Convert primes back to output. Must be implemented by subclasses.

```javascript
backend.decode(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime encoding

**Returns:** any - Backend-specific output

---

#### process(input)

Full processing pipeline. Must be implemented by subclasses.

```javascript
backend.process(input)
```

**Parameters:**
- `input` (any): Backend-specific input

**Returns:** Object - Processing result

---

#### primesToState(primes)

Convert prime array to hypercomplex state.

```javascript
backend.primesToState(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime numbers

**Returns:** SedenionState

**Notes:**
- Maps primes to basis states via modular arithmetic
- Multiplies basis states in sequence

---

## Semantic Backend (`backends/semantic/index.js`)

Natural language and concept processing engine.

### Constructor

```javascript
new SemanticBackend(config)
```

**Parameters:**
- `config` (Object):
  - `vocabulary` (Object): Word-to-prime mappings
  - `ontology` (Object): Prime semantic meanings
  - `stopWords` (Array): Words to filter
  - `transforms` (Array): Semantic transforms
  - `dimension` (number): State dimension (default 16)

**Example:**
```javascript
const backend = new SemanticBackend({
  vocabulary: {
    'love': [2, 3, 5],
    'truth': [7, 11, 13]
  },
  ontology: {
    2: 'existence',
    3: 'unity',
    5: 'life'
  },
  stopWords: ['the', 'a', 'is'],
  dimension: 16
});
```

---

### Text Processing

#### tokenize(text, filterStopWords)

Tokenize text into structured tokens.

```javascript
backend.tokenize(text, filterStopWords)
```

**Parameters:**
- `text` (string): Input text
- `filterStopWords` (boolean): Remove stop words (default false)

**Returns:** Array<Token>

**Token Structure:**
```javascript
{
  word: string,      // Lowercase word
  primes: number[],  // Associated primes
  known: boolean,    // In vocabulary
  isStop: boolean,   // Is stop word
  position: number   // Position in text
}
```

**Example:**
```javascript
const tokens = backend.tokenize('Love is truth');
// [
//   { word: 'love', primes: [2,3,5], known: true, isStop: false, position: 0 },
//   { word: 'is', primes: [], known: true, isStop: true, position: 1 },
//   { word: 'truth', primes: [7,11,13], known: true, isStop: false, position: 2 }
// ]
```

---

#### encode(text)

Encode text to prime array (unordered).

```javascript
backend.encode(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** Array<number> - All primes from all words

**Example:**
```javascript
const primes = backend.encode('love and truth');
// [2, 3, 5, 7, 11, 13]
```

---

#### encodeOrdered(text)

Encode text preserving word order.

```javascript
backend.encodeOrdered(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** Array<Object> - Ordered tokens with primes

**Example:**
```javascript
const ordered = backend.encodeOrdered('dog bites man');
// [
//   { word: 'dog', primes: [...], position: 0 },
//   { word: 'bites', primes: [...], position: 1 },
//   { word: 'man', primes: [...], position: 2 }
// ]
```

---

#### decode(primes)

Decode primes to text.

```javascript
backend.decode(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime encoding

**Returns:** string - Decoded text

**Notes:**
- Uses greedy covering algorithm
- May not perfectly reconstruct original text

---

### State Conversion

#### primesToState(primes)

Convert primes to hypercomplex state (commutative).

```javascript
backend.primesToState(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime array

**Returns:** SedenionState

**Notes:**
- Order-independent (commutative combination)
- Suitable for concept matching, not phrase matching

---

#### orderedPrimesToState(tokens)

Convert ordered tokens to state (non-commutative).

```javascript
backend.orderedPrimesToState(tokens)
```

**Parameters:**
- `tokens` (Array<Object>): Ordered tokens from encodeOrdered()

**Returns:** SedenionState

**Notes:**
- Order-dependent (non-commutative multiplication)
- "dog bites man" ≠ "man bites dog"

---

#### textToOrderedState(text)

Convenience method: text → ordered state.

```javascript
backend.textToOrderedState(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** SedenionState

---

### Vocabulary Management

#### hasWord(word)

Check if word is in vocabulary.

```javascript
backend.hasWord(word)
```

**Parameters:**
- `word` (string): Word to check

**Returns:** boolean

---

#### getWordPrimes(word)

Get primes for a word.

```javascript
backend.getWordPrimes(word)
```

**Parameters:**
- `word` (string): Word to look up

**Returns:** Array<number> | null

---

#### learn(word, primes)

Add word to vocabulary.

```javascript
backend.learn(word, primes)
```

**Parameters:**
- `word` (string): New word
- `primes` (Array<number>): Prime encoding

**Returns:** void

---

#### getVocabularySize()

Get vocabulary size.

```javascript
backend.getVocabularySize()
```

**Returns:** number

---

### Ontology Access

#### getOntologyMeaning(prime)

Get meaning of a prime.

```javascript
backend.getOntologyMeaning(prime)
```

**Parameters:**
- `prime` (number): Prime number

**Returns:** string | null - Semantic meaning

---

#### getAxisPrimes(axis)

Get primes associated with a semantic axis.

```javascript
backend.getAxisPrimes(axis)
```

**Parameters:**
- `axis` (number): Axis index (0-15)

**Returns:** Array<number>

---

#### getOntologyTerms()

Get all defined ontology terms.

```javascript
backend.getOntologyTerms()
```

**Returns:** Array<string>

---

### Transform Application

#### applyTransform(primes, transform)

Apply a single transform.

```javascript
backend.applyTransform(primes, transform)
```

**Parameters:**
- `primes` (Array<number>): Current primes
- `transform` (Object): Transform to apply

**Returns:** Array<number> - Transformed primes

---

#### process(text)

Full processing with transform application.

```javascript
backend.process(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** Object
```javascript
{
  input: string,
  primes: number[],
  state: SedenionState,
  output: string,
  entropy: number,
  steps: TransformStep[]
}
```

---

## Two-Layer Engine (`backends/semantic/two-layer.js`)

Separates invariant meaning from surface vocabulary.

### Constructor

```javascript
new TwoLayerEngine(config)
```

**Parameters:**
- `config` (Object):
  - `core` (Object): Core configuration
  - `registers` (Object): Surface register definitions
  - `defaultRegister` (string): Default register name

---

### Methods

#### process(text)

Process text through both layers.

```javascript
engine.process(text)
```

**Returns:** Object
```javascript
{
  meaning: {
    primes: number[],
    state: SedenionState,
    entropy: number
  },
  surface: {
    words: string[],
    register: string
  }
}
```

---

#### translate(text, fromRegister, toRegister)

Translate between surface registers.

```javascript
engine.translate(text, fromRegister, toRegister)
```

**Parameters:**
- `text` (string): Input text
- `fromRegister` (string): Source register
- `toRegister` (string): Target register

**Returns:** Object - `{ original, translated, meaning }`

---

#### useRegister(name)

Set active surface register.

```javascript
engine.useRegister(name)
```

**Parameters:**
- `name` (string): Register name

---

#### generateWithStyle(primes, style)

Generate text from primes with style.

```javascript
engine.generateWithStyle(primes, style)
```

**Parameters:**
- `primes` (Array<number>): Meaning primes
- `style` (string): Style modifier

**Returns:** string - Styled text

---

## Cryptographic Backend (`backends/cryptographic/index.js`)

Semantic hashing and key derivation.

### Constructor

```javascript
new CryptographicBackend(config)
```

**Parameters:**
- `config` (Object):
  - `vocabulary` (Object): Word mappings
  - `dimension` (number): State dimension
  - `hashRounds` (number): Strengthening rounds

---

### Hashing

#### hash(text)

Create semantic hash of text.

```javascript
backend.hash(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** string - Hash string

**Notes:**
- Similar meanings → similar hashes
- Deterministic

---

#### hashToState(text)

Hash text to full state object.

```javascript
backend.hashToState(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** SedenionState

---

### Key Derivation

#### deriveKey(phrase)

Derive key from passphrase.

```javascript
backend.deriveKey(phrase)
```

**Parameters:**
- `phrase` (string): Key phrase

**Returns:** SedenionState - Derived key

---

#### strengthenKey(key, rounds)

Apply key strengthening.

```javascript
backend.strengthenKey(key, rounds)
```

**Parameters:**
- `key` (SedenionState): Initial key
- `rounds` (number): Strengthening rounds

**Returns:** SedenionState - Strengthened key

---

### Encoding

#### encode(text)

Encode text to primes.

```javascript
backend.encode(text)
```

**Parameters:**
- `text` (string): Input text

**Returns:** Array<number>

---

#### decode(primes)

Decode primes to text.

```javascript
backend.decode(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime encoding

**Returns:** string

---

## Scientific Backend (`backends/scientific/index.js`)

Quantum-inspired computation and simulation.

### Constructor

```javascript
new ScientificBackend(config)
```

**Parameters:**
- `config` (Object):
  - `dimension` (number): State dimension (default 16)
  - `precision` (number): Numerical precision

---

### State Creation

#### createState(components)

Create state from components.

```javascript
backend.createState(components)
```

**Parameters:**
- `components` (Array<number>): 16 real components

**Returns:** SedenionState

---

#### createRandomState()

Create random normalized state.

```javascript
backend.createRandomState()
```

**Returns:** SedenionState

---

#### createBasisState(index)

Create basis state eᵢ.

```javascript
backend.createBasisState(index)
```

**Parameters:**
- `index` (number): Basis index (0-15)

**Returns:** SedenionState

---

### State Operations

#### superpose(state1, weight1, state2, weight2)

Create weighted superposition.

```javascript
backend.superpose(state1, weight1, state2, weight2)
```

**Parameters:**
- `state1` (SedenionState): First state
- `weight1` (number): First weight
- `state2` (SedenionState): Second state
- `weight2` (number): Second weight

**Returns:** SedenionState - Normalized superposition

---

#### evolve(state, hamiltonian, dt)

Time evolve state.

```javascript
backend.evolve(state, hamiltonian, dt)
```

**Parameters:**
- `state` (SedenionState): Current state
- `hamiltonian` (SedenionState): Evolution operator
- `dt` (number): Time step

**Returns:** SedenionState - Evolved state

---

#### collapse(state, target, strength)

Collapse toward target.

```javascript
backend.collapse(state, target, strength)
```

**Parameters:**
- `state` (SedenionState): State to collapse
- `target` (SedenionState): Target attractor
- `strength` (number): Collapse strength

**Returns:** SedenionState

---

### Measurements

#### measureProbability(state, projector)

Calculate measurement probability.

```javascript
backend.measureProbability(state, projector)
```

**Parameters:**
- `state` (SedenionState): State to measure
- `projector` (SedenionState): Measurement projector

**Returns:** number - Probability [0, 1]

---

#### measure(state, basis)

Perform measurement with collapse.

```javascript
backend.measure(state, basis)
```

**Parameters:**
- `state` (SedenionState): State to measure
- `basis` (Array<SedenionState>): Measurement basis

**Returns:** Object - `{ outcome, probability, finalState }`

---

### Encoding Interface

#### encode(input)

Encode numeric input to primes.

```javascript
backend.encode(input)
```

**Parameters:**
- `input` (Array<number>): Numeric data

**Returns:** Array<number>

---

#### decode(primes)

Decode primes to numeric output.

```javascript
backend.decode(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime encoding

**Returns:** Array<number>

---

#### process(input)

Full scientific processing.

```javascript
backend.process(input)
```

**Parameters:**
- `input` (Object): Processing request

**Returns:** Object - Processing result

---

## Backend Registration

### registerBackend(name, BackendClass)

Register a custom backend.

```javascript
const { registerBackend } = require('./modular');

registerBackend('custom', CustomBackend);
```

**Parameters:**
- `name` (string): Backend identifier
- `BackendClass` (class): Backend constructor

---

### getBackend(name)

Get registered backend class.

```javascript
const { getBackend } = require('./modular');

const SemanticBackend = getBackend('semantic');
```

**Parameters:**
- `name` (string): Backend identifier

**Returns:** class | null

---

### listBackends()

List all registered backends.

```javascript
const { listBackends } = require('./modular');

console.log(listBackends());
// ['semantic', 'cryptographic', 'scientific']
```

**Returns:** Array<string>