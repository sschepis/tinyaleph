# Aleph Documentation

**Aleph** (TinyAleph) is a semantic computing framework that uses prime numbers and hypercomplex algebra to represent and manipulate meaning. Unlike traditional computers that operate on bits, Aleph operates on *concepts* - using the mathematical structure of prime numbers to encode semantic content and physical dynamics to perform reasoning.

## Documentation Structure

This documentation is organized into three parts:

### [Part I: Theory](./theory/README.md)
Deep exploration of the theoretical foundations:
- **Prime Semantics** - How prime numbers encode meaning
- **Hypercomplex Algebra** - The Cayley-Dickson construction and sedenions
- **Phase Synchronization** - Kuramoto oscillator dynamics
- **Entropy Minimization** - Reasoning as entropy reduction
- **Non-Commutativity** - Why word order matters
- **Two-Layer Meaning** - Prime substrate vs. surface vocabulary

### [Part II: Guide](./guide/README.md)
Practical application of Aleph:
- **Quick Start** - Get running in 5 minutes
- **Semantic Computing** - Natural language understanding
- **Cryptographic Applications** - Hashing and key derivation
- **Scientific Computing** - Quantum simulation
- **LLM Integration** - Coupling with language models
- **Advanced Techniques** - Power user guide

### [Part III: Reference](./reference/README.md)
Complete API documentation:
- **Core Module** - Hypercomplex algebra and prime utilities
- **Physics Module** - Oscillators, entropy, stability
- **Backends** - Semantic, Cryptographic, Scientific
- **Engine** - The unified AlephEngine

---

## Quick Overview

### What is Semantic Computing?

Traditional computing manipulates symbols according to formal rules. Semantic computing manipulates *meaning* according to mathematical structure.

```javascript
const { createEngine } = require('./modular');

// Create a semantic engine
const engine = createEngine('semantic', require('./data.json'));

// Process natural language
const result = engine.run('What is the nature of truth?');
console.log(result.output);    // Semantic response
console.log(result.entropy);   // Information-theoretic measure
console.log(result.coherence); // Phase synchronization measure
```

### The Core Insight

**Meaning has mathematical structure.** Just as:
- Numbers can be uniquely factored into primes
- Rotations can be composed in higher dimensions
- Oscillators can synchronize through coupling

So too can concepts be:
- Decomposed into semantic primes
- Composed in hypercomplex space
- Synchronized through semantic resonance

### Key Features

| Feature | Description |
|---------|-------------|
| **Prime Encoding** | Concepts as unique prime signatures |
| **Hypercomplex States** | 16D sedenion algebra for meaning vectors |
| **Kuramoto Dynamics** | Phase synchronization for coherence |
| **Entropy Minimization** | Reasoning as entropy reduction |
| **Multiple Backends** | Semantic, Cryptographic, Scientific |
| **LLM Integration** | Couple with language models |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/tinyaleph.git
cd tinyaleph

# Install dependencies
npm install
```

## Basic Usage

```javascript
const { createEngine, SemanticBackend } = require('./modular');

// Load configuration
const config = require('./data.json');

// Create engine with semantic backend
const engine = createEngine('semantic', config);

// Run a query
const result = engine.run('love and wisdom');

console.log({
  input: result.input,
  output: result.output,
  entropy: result.entropy.toFixed(3),
  coherence: result.coherence.toFixed(3),
  stability: result.stability
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INPUT                                │
│                    (text, data, qubits)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│         (Semantic / Cryptographic / Scientific)              │
│                                                              │
│   encode(input) → primes    decode(primes) → output          │
│   primesToState(primes) → hypercomplex                       │
│   applyTransform(primes, transform) → primes                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ALEPH ENGINE                            │
│                                                              │
│   Kuramoto Oscillators ←→ Hypercomplex State                 │
│         │                        │                           │
│         ▼                        ▼                           │
│   Phase Dynamics           Entropy Tracking                  │
│   Lyapunov Stability       Coherence Measurement             │
│   Adaptive Coupling        Collapse Detection                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         OUTPUT                               │
│     { result, primes, entropy, coherence, collapsed }        │
└─────────────────────────────────────────────────────────────┘
```

---

## License

MIT License

## Contributing

Contributions are welcome! Please read the documentation thoroughly to understand the theoretical foundations before proposing changes.