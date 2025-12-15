# API Reference

Complete API documentation for all Aleph modules.

## Modules

### [Core Module](./01-core.md)

The foundational mathematical primitives:

- **Hypercomplex** - Sedenion algebra and Cayley-Dickson construction
- **Prime** - Prime number utilities, Gaussian and Eisenstein integers
- **Fano** - Fano plane multiplication tables for octonions
- **Sieve** - Semantic sieve algorithm for concept filtering
- **LLM** - LLM coupling utilities

### [Physics Module](./02-physics.md)

Dynamical systems and information theory:

- **Oscillator** - Phase-amplitude oscillator creation and manipulation
- **Kuramoto** - Coupled oscillator synchronization dynamics
- **Entropy** - Shannon entropy and information measures
- **Lyapunov** - Stability analysis via Lyapunov exponents
- **Collapse** - State collapse and measurement mechanics

### [Backends Module](./03-backends.md)

Domain-specific computation engines:

- **BackendInterface** - Abstract base class for all backends
- **SemanticBackend** - Natural language and concept processing
- **CryptographicBackend** - Hashing and key derivation
- **ScientificBackend** - Quantum-inspired computation

### [Engine Module](./04-engine.md)

High-level orchestration:

- **AlephEngine** - Unified computation engine
- **createEngine** - Factory function for engine creation
- **registerBackend** - Backend registration system

---

## Quick Reference

### Importing

```javascript
// Full import
const aleph = require('./modular');

// Destructured import
const { 
  createEngine,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend
} = require('./modular');

// Individual modules
const { SedenionState, cayleyDickson } = require('./core/hypercomplex');
const { createOscillator } = require('./physics/oscillator');
const { kuramotoStep } = require('./physics/kuramoto');
```

### Common Patterns

```javascript
// Create and use semantic engine
const engine = createEngine('semantic', config);
const result = engine.run('input text');

// Direct backend usage
const backend = new SemanticBackend(config);
const primes = backend.encode('text');
const state = backend.primesToState(primes);
const output = backend.decode(primes);

// Hypercomplex operations
const a = new SedenionState(components);
const b = a.multiply(other);
const c = a.add(other).normalize();
const entropy = a.entropy();
const coherence = a.coherence(b);
```

---

## Type Conventions

### SedenionState

The fundamental state object representing a point in 16-dimensional hypercomplex space.

```typescript
interface SedenionState {
  dimension: number;           // Always 16 for sedenions
  components: number[];        // 16 real components [e₀, e₁, ..., e₁₅]
  
  // Arithmetic
  add(other: SedenionState): SedenionState;
  subtract(other: SedenionState): SedenionState;
  multiply(other: SedenionState): SedenionState;
  scale(scalar: number): SedenionState;
  
  // Properties
  norm(): number;
  normalize(): SedenionState;
  conjugate(): SedenionState;
  inverse(): SedenionState;
  entropy(): number;
  coherence(other: SedenionState): number;
  
  // Utilities
  isZeroDivisorWith(other: SedenionState): boolean;
  clone(): SedenionState;
  toString(): string;
}
```

### Token

Tokenized word with metadata.

```typescript
interface Token {
  word: string;       // Original word (lowercase)
  primes: number[];   // Associated prime numbers
  known: boolean;     // Whether word is in vocabulary
  isStop: boolean;    // Whether word is a stop word
  position: number;   // Position in original text
}
```

### Transform

Semantic transformation rule.

```typescript
interface Transform {
  n: string;                           // Transform name
  q: number[];                         // Query primes
  r: number[];                         // Replacement primes
  priority?: number;                   // Application priority
  condition?: (state: SedenionState) => boolean;  // Optional condition
}
```

### EngineResult

Standard result from engine.run().

```typescript
interface EngineResult {
  input: string;              // Original input
  output: string;             // Decoded output
  primes: number[];           // Final prime encoding
  state: SedenionState;       // Final hypercomplex state
  entropy: number;            // Final entropy
  steps: TransformStep[];     // Applied transforms
}

interface TransformStep {
  step: number;
  transform: string;
  primesBefore: number[];
  primesAfter: number[];
  entropyBefore: number;
  entropyAfter: number;
  entropyDrop: number;
}
```

---

## Error Handling

### Common Errors

```javascript
// Invalid dimension
const state = new SedenionState([1, 2, 3]);  // Must be 16 components
// Throws: Error('SedenionState requires exactly 16 components')

// Unknown word
const primes = backend.getWordPrimes('xyzzy');  // Word not in vocabulary
// Returns: null (or empty array depending on backend)

// Division by zero
const inv = zeroState.inverse();
// Throws: Error('Cannot invert zero state')
```

### Safe Patterns

```javascript
// Check before inverse
if (state.norm() > 0) {
  const inv = state.inverse();
}

// Check word existence
if (backend.hasWord(word)) {
  const primes = backend.getWordPrimes(word);
}

// Validate coherence range
const coherence = state1.coherence(state2);
console.assert(coherence >= 0 && coherence <= 1);
```

---

## Performance Notes

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `SedenionState.multiply()` | O(n²) | n=16, uses Cayley-Dickson |
| `SedenionState.normalize()` | O(n) | Single pass |
| `SedenionState.entropy()` | O(n) | Shannon entropy |
| `SemanticBackend.encode()` | O(w×v) | w=words, v=vocabulary |
| `SemanticBackend.decode()` | O(p×v) | p=primes, v=vocabulary |
| `kuramotoStep()` | O(n²) | n=oscillators, all-to-all |

### Memory

- `SedenionState`: ~128 bytes (16 × 8 bytes for Float64)
- `SemanticBackend`: ~10KB base + vocabulary size
- Typical vocabulary: ~10K words = ~1MB

---

## Module Index

| Module | File | Description |
|--------|------|-------------|
| hypercomplex | `core/hypercomplex.js` | Sedenion algebra |
| prime | `core/prime.js` | Prime utilities |
| fano | `core/fano.js` | Fano plane |
| sieve | `core/sieve.js` | Semantic sieve |
| llm | `core/llm.js` | LLM coupling |
| oscillator | `physics/oscillator.js` | Oscillator creation |
| kuramoto | `physics/kuramoto.js` | Synchronization |
| entropy | `physics/entropy.js` | Information theory |
| lyapunov | `physics/lyapunov.js` | Stability |
| collapse | `physics/collapse.js` | State collapse |
| semantic | `backends/semantic/index.js` | Semantic backend |
| cryptographic | `backends/cryptographic/index.js` | Crypto backend |
| scientific | `backends/scientific/index.js` | Science backend |
| engine | `engine/aleph.js` | Main engine |