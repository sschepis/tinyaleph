# @sschepis/tinyaleph

**Prime-resonant semantic computing framework**

A novel computational paradigm that encodes meaning as prime number signatures, embeds them in hypercomplex space, and performs reasoning through entropy minimization and oscillator synchronization.

[![npm version](https://badge.fury.io/js/@sschepis%2Ftinyaleph.svg)](https://www.npmjs.com/package/@sschepis/tinyaleph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Prime Semantics**: Encode concepts as unique prime number signatures
- **Hypercomplex Algebra**: 16-dimensional sedenion space with non-commutative multiplication
- **Oscillator Dynamics**: Kuramoto-model synchronization for coherent reasoning
- **Entropy Minimization**: Reasoning as reduction of semantic uncertainty
- **Multiple Backends**: Semantic (NLP), Cryptographic (hashing), Scientific (quantum-inspired)

## Installation

```bash
npm install @sschepis/tinyaleph
```

## Quick Start

```javascript
const { createEngine, SemanticBackend } = require('@sschepis/tinyaleph');

// Load configuration
const config = require('@sschepis/tinyaleph/data.json');

// Create a semantic engine
const engine = createEngine('semantic', config);

// Process a query
const result = engine.run('What is the relationship between wisdom and truth?');

console.log('Output:', result.output);
console.log('Entropy:', result.entropy);
console.log('Steps:', result.steps.length);
```

## Core Concepts

### Prime Encoding

Every concept maps to a unique set of prime numbers:

```javascript
const backend = new SemanticBackend(config);

const primes = backend.encode('love and wisdom');
console.log(primes);  // [2, 3, 5, 7, 11, ...]
```

### Hypercomplex States

Primes embed into 16-dimensional sedenion space:

```javascript
const { Hypercomplex } = require('@sschepis/tinyaleph');

// Create a state
const state = new Hypercomplex(16);
state.excite([2, 3, 5]);  // Excite with primes

// States support multiplication (non-commutative!)
const combined = state1.multiply(state2);
console.log(state1.multiply(state2) !== state2.multiply(state1));  // true
```

### Entropy-Based Reasoning

Reasoning reduces entropy through semantic transforms:

```javascript
const engine = createEngine('semantic', config);
const result = engine.run('Confused question here');

// Watch entropy decrease through reasoning steps
for (const step of result.steps) {
  console.log(`Step ${step.step}: entropy ${step.entropyAfter.toFixed(3)}`);
}
```

## Backends

### Semantic Backend

Natural language understanding and concept mapping:

```javascript
const { SemanticBackend } = require('@sschepis/tinyaleph');

const backend = new SemanticBackend(config);

// Tokenize
const tokens = backend.tokenize('Love is truth');

// Encode to primes
const primes = backend.encode('Love is truth');

// Decode back
const text = backend.decode(primes);

// Compare concepts
const state1 = backend.textToOrderedState('wisdom');
const state2 = backend.textToOrderedState('knowledge');
console.log('Similarity:', state1.coherence(state2));
```

### Cryptographic Backend

Semantic hashing and key derivation:

```javascript
const { CryptographicBackend, hash, deriveKey } = require('@sschepis/tinyaleph');

// Quick hash
const h = hash('my secret data');

// Key derivation
const key = deriveKey('password', 'salt', 32, 10000);

// Full backend
const crypto = new CryptographicBackend(config);
const semanticHash = crypto.hash('similar meanings produce similar hashes');
```

### Scientific Backend

Quantum-inspired computation:

```javascript
const { ScientificBackend } = require('@sschepis/tinyaleph');

const backend = new ScientificBackend(config);

// Create quantum-like states
const state = backend.createRandomState();
const basis = backend.createBasisState(0);

// Superposition
const superposition = backend.superpose(state, 0.5, basis, 0.5);

// Measurement
const result = backend.measure(superposition, [basis]);
```

## Physics Engine

### Oscillators

```javascript
const { Oscillator, OscillatorBank, KuramotoModel } = require('@sschepis/tinyaleph');

// Create oscillator bank
const bank = new OscillatorBank(16);

// Excite with primes
bank.excite([2, 3, 5, 7]);

// Kuramoto synchronization
const kuramoto = new KuramotoModel(bank, { coupling: 0.1 });
kuramoto.step(0.01);

console.log('Order parameter:', kuramoto.orderParameter());
```

### Entropy and Stability

```javascript
const { shannonEntropy, estimateLyapunov, stateEntropy } = require('@sschepis/tinyaleph');

// Calculate entropy
const entropy = stateEntropy(state);

// Estimate Lyapunov exponent for stability
const lambda = estimateLyapunov(entropyTimeSeries);
console.log('Stable:', lambda < 0);
```

## API Overview

### Main Exports

| Export | Description |
|--------|-------------|
| `createEngine(type, config)` | Create engine with backend |
| `AlephEngine` | Unified computation engine |
| `SemanticBackend` | Natural language processing |
| `CryptographicBackend` | Hashing and key derivation |
| `ScientificBackend` | Quantum-inspired computation |
| `Hypercomplex` | Sedenion algebra |
| `Oscillator` / `OscillatorBank` | Phase-amplitude oscillators |
| `KuramotoModel` | Coupled oscillator synchronization |
| `hash(input)` | Quick semantic hash |
| `deriveKey(pass, salt)` | Quick key derivation |

### Sub-modules

```javascript
// Direct module access
const { core, physics, backends, engine } = require('@sschepis/tinyaleph');

// Or import sub-modules directly
const core = require('@sschepis/tinyaleph/core');
const physics = require('@sschepis/tinyaleph/physics');
const backends = require('@sschepis/tinyaleph/backends');
const engine = require('@sschepis/tinyaleph/engine');
```

## Documentation

Full documentation is available in the `docs/` directory:

- **[Theory](./docs/theory/README.md)**: Mathematical foundations
  - Prime semantics, hypercomplex algebra, oscillator dynamics
  - Entropy minimization, non-commutativity, temporal emergence
  
- **[Guide](./docs/guide/README.md)**: Practical tutorials
  - Quick start, semantic computing, cryptographic applications
  - Scientific computing, LLM integration, advanced topics
  
- **[Reference](./docs/reference/README.md)**: Complete API documentation
  - Core module, physics module, backends, engine

## Examples

Run the included demos:

```bash
# Basic modular demo
npm run demo

# Two-layer meaning demo
npm run demo:two-layer

# Performance benchmark
npm run benchmark

# Interactive chat
npm run chat
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AlephEngine                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Oscillators │◄─┤   Field     │◄─┤      Transform          │ │
│  │  (Kuramoto) │  │  (Sedenion) │  │      Pipeline           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ SemanticBackend │ │CryptographicBack│ │ScientificBackend│
│                 │ │                 │ │                 │
│ • Tokenization  │ │ • Hash          │ │ • Quantum sim   │
│ • Prime encode  │ │ • Key derive    │ │ • Wave collapse │
│ • Transforms    │ │ • Verify        │ │ • Measurement   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Requirements

- Node.js >= 14.0.0

## License

MIT © Sebastian Schepis

## Contributing

Contributions welcome! Please read the documentation in `docs/` before submitting PRs.