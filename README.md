# @aleph-ai/tinyaleph

**Prime-resonant semantic computing framework**

A novel computational paradigm that encodes meaning as prime number signatures, embeds them in hypercomplex space, and performs reasoning through entropy minimization and oscillator synchronization.

[![npm version](https://badge.fury.io/js/@sschepis%2Ftinyaleph.svg)](https://www.npmjs.com/package/@aleph-ai/tinyaleph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Prime Semantics**: Encode concepts as unique prime number signatures
- **Hypercomplex Algebra**: 16-dimensional sedenion space with non-commutative multiplication
- **Oscillator Dynamics**: Kuramoto-model synchronization for coherent reasoning
- **Entropy Minimization**: Reasoning as reduction of semantic uncertainty
- **Multiple Backends**: Semantic (NLP), Cryptographic (hashing), Scientific (quantum-inspired)
- **Formal Type System**: Typed term calculus with N(p)/A(p)/S types and ordering constraints
- **Reduction Semantics**: Strong normalization with prime-preserving operators
- **Lambda Translation**: Model-theoretic semantics via λ-calculus embedding
- **Enochian Vocabulary**: 21-letter angelic alphabet with prime basis and sedenion operations

## Installation

```bash
npm install @aleph-ai/tinyaleph
```

## Quick Start

```javascript
const { createEngine, SemanticBackend } = require('@aleph-ai/tinyaleph');

// Load configuration
const config = require('@aleph-ai/tinyaleph/data.json');

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
const { Hypercomplex } = require('@aleph-ai/tinyaleph');

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
const { SemanticBackend } = require('@aleph-ai/tinyaleph');

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
const { CryptographicBackend, hash, deriveKey } = require('@aleph-ai/tinyaleph');

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
const { ScientificBackend } = require('@aleph-ai/tinyaleph');

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
const { Oscillator, OscillatorBank, KuramotoModel } = require('@aleph-ai/tinyaleph');

// Create oscillator bank
const bank = new OscillatorBank(16);

// Excite with primes
bank.excite([2, 3, 5, 7]);

// Kuramoto synchronization
const kuramoto = new KuramotoModel(bank, { coupling: 0.1 });
kuramoto.step(0.01);

console.log('Order parameter:', kuramoto.orderParameter());
```

### Extended Synchronization Models

Five advanced Kuramoto-family models for complex synchronization dynamics:

```javascript
const {
  NetworkKuramoto,      // Topology-aware coupling
  AdaptiveKuramoto,     // Hebbian plasticity
  SakaguchiKuramoto,    // Phase frustration (chimera states)
  SmallWorldKuramoto,   // Watts-Strogatz topology
  MultiSystemCoupling   // Cross-system synchronization
} = require('@aleph-ai/tinyaleph');

// Network Kuramoto with custom topology
const network = new NetworkKuramoto(frequencies, adjacencyMatrix, 0.5);
network.setFromEntanglementGraph(entanglementGraph, primeList);

// Adaptive Kuramoto with Hebbian learning
const adaptive = new AdaptiveKuramoto(frequencies, 0.3, 0.02);
// Coupling evolves: "concepts that sync together link together"

// Sakaguchi-Kuramoto with phase frustration
const sakaguchi = new SakaguchiKuramoto(frequencies, 0.5, Math.PI/4);
console.log('State:', sakaguchi.classifyState()); // synchronized/chimera/incoherent

// Small-world topology
const smallWorld = new SmallWorldKuramoto(frequencies, 4, 0.1, 0.5);
console.log('Small-world coefficient:', smallWorld.smallWorldCoefficient());

// Multi-system coupling (hierarchical or peer-to-peer)
const multi = new MultiSystemCoupling([system1, system2, system3]);
console.log('Inter-system coherence:', multi.interSystemCoherence());
```

### Entropy and Stability

```javascript
const { shannonEntropy, estimateLyapunov, stateEntropy } = require('@aleph-ai/tinyaleph');

// Calculate entropy
const entropy = stateEntropy(state);

// Estimate Lyapunov exponent for stability
const lambda = estimateLyapunov(entropyTimeSeries);
console.log('Stable:', lambda < 0);
```

## Formal Semantics

### Typed Term Calculus

The library implements a formal type system for prime-based compositional semantics:

```javascript
const { N, A, FUSE, CHAIN, SENTENCE, TypeChecker } = require('@aleph-ai/tinyaleph');

// Create typed terms
const noun7 = N(7);      // N(7) - noun indexed by prime 7
const adj3 = A(3);       // A(3) - adjective indexed by prime 3

// Adjective application with ordering constraint (p < q)
const chain = adj3.apply(noun7);  // A(3)N(7) is valid since 3 < 7

// Triadic fusion where p+q+r is prime
const fused = FUSE(3, 5, 11);  // 3+5+11 = 19 (prime) ✓

// Sentence composition
const s1 = SENTENCE(7);
const s2 = SENTENCE(11);
const compound = SEQ(s1, s2);  // s₁ ◦ s₂

// Type checking
const checker = new TypeChecker();
console.log(checker.inferType(noun7));  // 'N'
console.log(checker.checkApplication(adj3, noun7));  // { valid: true }
```

### Reduction Semantics

Strong normalization with prime-preserving operators:

```javascript
const {
    ReductionSystem,
    ResonanceOperator,
    NextPrimeOperator,
    demonstrateStrongNormalization
} = require('@aleph-ai/tinyaleph');

// Create reduction system
const reduction = new ReductionSystem();

// Add prime-preserving operators
reduction.addOperator(new ResonanceOperator(2));    // Resonance at p=2
reduction.addOperator(new NextPrimeOperator());      // Map to next prime

// Normalize a term sequence
const result = reduction.normalize([7, 11, 13]);
console.log(result.normalForm);    // Canonical form
console.log(result.steps);         // Reduction trace

// Demonstrate strong normalization
const proof = demonstrateStrongNormalization([3, 5, 7], reduction);
console.log(proof.terminates);     // true (guaranteed!)
```

### Lambda Calculus Translation

Model-theoretic semantics via τ translation:

```javascript
const {
    Translator,
    LambdaEvaluator,
    Semantics
} = require('@aleph-ai/tinyaleph');

// Translate prime terms to λ-expressions
const translator = new Translator();
const lambda = translator.translateNoun(N(7));  // Constant 7
const appLambda = translator.translateChain(chain);

// Evaluate λ-expressions
const evaluator = new LambdaEvaluator();
const normal = evaluator.normalize(appLambda);

// Model-theoretic interpretation
const semantics = new Semantics();
semantics.domain = [2, 3, 5, 7, 11, 13];  // Prime domain
const value = semantics.interpret(N(7));   // 7
```

### Enochian Vocabulary

The 21-letter angelic alphabet with prime basis and sedenion operations:

```javascript
const {
    EnochianEngine,
    ENOCHIAN_ALPHABET,
    PRIME_BASIS,
    CORE_VOCABULARY,
    SedenionElement
} = require('@aleph-ai/tinyaleph/apps/sentient/lib/enochian-vocabulary');

// 21-letter alphabet with prime mappings
console.log(ENOCHIAN_ALPHABET['A']);  // { prime: 3, value: 1, angle: 51.43 }
console.log(PRIME_BASIS);  // [7, 11, 13, 17, 19, 23, 29]

// Enochian engine for word processing
const engine = new EnochianEngine();

// Parse and compute word prime value
const parsed = engine.parseWord('MADRIAX');  // "O ye heavens"
console.log(parsed.primeValue);
console.log(parsed.letters);

// Sedenion operations (16-dimensional)
const s1 = new SedenionElement([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const s2 = new SedenionElement([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const product = s1.multiply(s2);  // Non-commutative!

// Access core vocabulary (35+ Enochian words)
console.log(CORE_VOCABULARY['OL']);     // "I" (first person)
console.log(CORE_VOCABULARY['ZORGE']);  // "be friendly unto"
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
| `NetworkKuramoto` | Topology-aware coupling |
| `AdaptiveKuramoto` | Hebbian plasticity |
| `SakaguchiKuramoto` | Phase frustration / chimera states |
| `SmallWorldKuramoto` | Watts-Strogatz topology |
| `MultiSystemCoupling` | Cross-system synchronization |
| `hash(input)` | Quick semantic hash |
| `deriveKey(pass, salt)` | Quick key derivation |

### Formal Semantics Exports

| Export | Description |
|--------|-------------|
| `N(prime)` | Create noun term N(p) |
| `A(prime)` | Create adjective term A(p) |
| `FUSE(p, q, r)` | Create triadic fusion |
| `CHAIN(ops, noun)` | Create operator chain |
| `SENTENCE(expr)` | Create sentence from noun |
| `SEQ(s1, s2)` | Sequential composition |
| `IMPL(s1, s2)` | Implication |
| `TypeChecker` | Type inference and checking |
| `ReductionSystem` | Reduction semantics engine |
| `ResonanceOperator` | Prime resonance operator |
| `NextPrimeOperator` | Next prime mapping |
| `ModularOperator` | Modular arithmetic |
| `Translator` | λ-calculus translation |
| `LambdaEvaluator` | β-reduction evaluator |
| `Semantics` | Model-theoretic interpretation |
| `EnochianEngine` | Enochian language processing |
| `SedenionElement` | 16D hypercomplex operations |

### Sub-modules

```javascript
// Direct module access
const { core, physics, backends, engine } = require('@aleph-ai/tinyaleph');

// Or import sub-modules directly
const core = require('@aleph-ai/tinyaleph/core');
const physics = require('@aleph-ai/tinyaleph/physics');
const backends = require('@aleph-ai/tinyaleph/backends');
const engine = require('@aleph-ai/tinyaleph/engine');
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
  
- **[Formal Semantics Examples](./examples/formal-semantics/README.md)**: New formal system demos
  - Typed terms and type checking
  - Reduction and normalization
  - Lambda translation
  - Enochian language

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

# Formal semantics examples
node examples/formal-semantics/01-typed-terms.js
node examples/formal-semantics/02-reduction.js
node examples/formal-semantics/03-lambda-translation.js
node examples/formal-semantics/04-enochian-language.js
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

┌─────────────────────────────────────────────────────────────────┐
│                     Formal Semantics Layer                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Type System   │   Reduction     │   Lambda Translation        │
│                 │                 │                             │
│ • N(p), A(p), S │ • Small-step →  │ • τ: Terms → λ-expressions  │
│ • FUSE(p,q,r)   │ • ⊕ operators   │ • β-reduction               │
│ • ◦ composition │ • Normal forms  │ • Model interpretation      │
│ • ⇒ implication │ • Confluence    │ • Semantic domains          │
└─────────────────┴─────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Enochian Language Module                     │
├─────────────────────────────────────────────────────────────────┤
│ • 21-letter alphabet with prime mappings                         │
│ • Prime basis PE = {7, 11, 13, 17, 19, 23, 29}                  │
│ • Twist angles κ(p) = 360/p degrees                              │
│ • 16-dimensional sedenion operations                             │
│ • Core vocabulary (35+ words)                                    │
│ • The Nineteen Calls (traditional invocations)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Requirements

- Node.js >= 14.0.0

## License

MIT © Sebastian Schepis

## Contributing

Contributions welcome! Please read the documentation in `docs/` before submitting PRs.