# TinyAleph Examples

Comprehensive examples demonstrating TinyAleph's capabilities across semantic processing, cryptography, quantum simulation, mathematics, physics, and AI applications.

## Quick Start

```bash
# Run a quick example
node examples/01-hello-world.js

# Run category-specific examples
node examples/semantic/01-vocabulary.js
node examples/crypto/01-password-hash.js
node examples/scientific/01-single-qubit.js
```

## Example Categories

### 🚀 Quickstart (3 examples)
Basic examples to get started immediately.

| File | Description |
|------|-------------|
| [01-hello-world.js](./01-hello-world.js) | Your first TinyAleph embedding |
| [02-basic-hash.js](./02-basic-hash.js) | Basic cryptographic hashing |
| [03-quantum-coin.js](./03-quantum-coin.js) | Quantum coin flip simulation |

### 🤖 AI & Machine Learning (12 examples)
AI applications using semantic embeddings.

| File | Description |
|------|-------------|
| [ai/01-embeddings.js](./ai/01-embeddings.js) | Text embeddings for ML |
| [ai/02-semantic-memory.js](./ai/02-semantic-memory.js) | Semantic memory systems |
| [ai/03-reasoning.js](./ai/03-reasoning.js) | Symbolic reasoning chains |
| [ai/04-knowledge-graph.js](./ai/04-knowledge-graph.js) | Knowledge graph construction |
| [ai/05-llm-integration.js](./ai/05-llm-integration.js) | LLM integration patterns |
| [ai/06-agent.js](./ai/06-agent.js) | AI agent implementation |
| [ai/07-hybrid-ai.js](./ai/07-hybrid-ai.js) | Hybrid neural-symbolic AI |
| [ai/08-entropy-reasoning.js](./ai/08-entropy-reasoning.js) | Entropy-guided reasoning |
| [ai/09-concept-learning.js](./ai/09-concept-learning.js) | Concept learning systems |
| [ai/10-prompt-primes.js](./ai/10-prompt-primes.js) | Prime-based prompt engineering |
| [ai/11-rag.js](./ai/11-rag.js) | Retrieval-augmented generation |
| [ai/12-neuro-symbolic.js](./ai/12-neuro-symbolic.js) | Neural-symbolic bridge |

### 📝 Semantic Processing (8 examples)
Text analysis and NLP applications.

| File | Description |
|------|-------------|
| [semantic/01-vocabulary.js](./semantic/01-vocabulary.js) | Word-to-prime mapping |
| [semantic/02-similarity.js](./semantic/02-similarity.js) | Semantic similarity metrics |
| [semantic/03-word-algebra.js](./semantic/03-word-algebra.js) | Word vector algebra |
| [semantic/04-clustering.js](./semantic/04-clustering.js) | Text clustering |
| [semantic/05-classification.js](./semantic/05-classification.js) | Text classification |
| [semantic/06-dna-encoding.js](./semantic/06-dna-encoding.js) | DNA-inspired encoding |
| [semantic/07-search.js](./semantic/07-search.js) | Semantic search engine |
| [semantic/08-qa-system.js](./semantic/08-qa-system.js) | Question answering |

### 🔐 Cryptography (5 examples)
Cryptographic operations and security.

| File | Description |
|------|-------------|
| [crypto/01-password-hash.js](./crypto/01-password-hash.js) | Password hashing |
| [crypto/02-key-derivation.js](./crypto/02-key-derivation.js) | Key derivation (PBKDF) |
| [crypto/03-hmac.js](./crypto/03-hmac.js) | Message authentication |
| [crypto/04-file-integrity.js](./crypto/04-file-integrity.js) | File integrity verification |
| [crypto/05-content-hash.js](./crypto/05-content-hash.js) | Content-addressable storage |

### ⚛️ Scientific Computing (7 examples)
Quantum computing simulation.

| File | Description |
|------|-------------|
| [scientific/01-single-qubit.js](./scientific/01-single-qubit.js) | Single qubit operations |
| [scientific/02-two-qubit.js](./scientific/02-two-qubit.js) | Two-qubit systems |
| [scientific/03-quantum-circuits.js](./scientific/03-quantum-circuits.js) | Quantum circuits |
| [scientific/04-measurement.js](./scientific/04-measurement.js) | Quantum measurement |
| [scientific/05-algorithms.js](./scientific/05-algorithms.js) | Quantum algorithms |
| [scientific/06-random.js](./scientific/06-random.js) | Quantum random numbers |
| [scientific/07-wavefunction.js](./scientific/07-wavefunction.js) | Wavefunction simulation |

### ➗ Mathematics (5 examples)
Mathematical foundations.

| File | Description |
|------|-------------|
| [math/01-quaternions.js](./math/01-quaternions.js) | Quaternion algebra |
| [math/02-octonions.js](./math/02-octonions.js) | Octonion algebra |
| [math/03-prime-factorization.js](./math/03-prime-factorization.js) | Prime factorization |
| [math/04-vector-spaces.js](./math/04-vector-spaces.js) | Vector space operations |
| [math/05-gaussian-primes.js](./math/05-gaussian-primes.js) | Gaussian primes |

### 🌊 Physics Simulation (6 examples)
Physics and dynamics.

| File | Description |
|------|-------------|
| [physics/01-oscillator.js](./physics/01-oscillator.js) | Coupled oscillators |
| [physics/02-lyapunov.js](./physics/02-lyapunov.js) | Lyapunov exponents |
| [physics/03-collapse.js](./physics/03-collapse.js) | State collapse |
| [physics/04-kuramoto.js](./physics/04-kuramoto.js) | Kuramoto synchronization |
| [physics/05-entropy.js](./physics/05-entropy.js) | Entropy analysis |
| [physics/06-primeon-ladder.js](./physics/06-primeon-ladder.js) | Primeon Z-ladder dynamics |

## Running Examples

### Prerequisites
```bash
npm install
```

### Run Individual Examples
```bash
node examples/ai/01-embeddings.js
```

### Run All Examples in a Category
```bash
for f in examples/ai/*.js; do node "$f"; done
```

## Example Structure

Each example follows a consistent structure:
1. **Header comment** - Description and use cases
2. **Setup** - Import and initialization
3. **Core demonstration** - Main functionality
4. **Key takeaways** - Summary of concepts

## Common Patterns

### Semantic Backend
```javascript
const { SemanticBackend } = require('../modular');
const backend = new SemanticBackend({ dimension: 16 });
const state = backend.textToOrderedState('hello world');
```

### Cryptographic Backend
```javascript
const { CryptographicBackend } = require('../modular');
const backend = new CryptographicBackend({ dimension: 32 });
const hash = backend.hash('input', 32);
```

### Scientific Backend
```javascript
const { ScientificBackend } = require('../modular');
const backend = new ScientificBackend({ dimension: 2 });
const primes = backend.applyGate(ket0, 'H');
```

## Contributing Examples

1. Create new example in appropriate category directory
2. Follow existing naming convention: `XX-name.js`
3. Include comprehensive header comment
4. Demonstrate real-world use cases
5. Add key takeaways section
6. Update this README

## Documentation

For complete documentation, see [../docs/README.md](../docs/README.md)