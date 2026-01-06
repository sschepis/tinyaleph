# TinyAleph Examples Plan

## Overview

This document outlines a comprehensive set of examples demonstrating all major features of the TinyAleph library. Examples are organized by complexity (beginner → advanced) and by domain.

---

## Example Categories

### 1. Quickstart Examples
Simple, copy-paste examples to get users started immediately.

| Example | File | Description |
|---------|------|-------------|
| Hello World | `01-hello-world.js` | Minimal example: encode text, get semantic state |
| Basic Hashing | `02-basic-hash.js` | Hash a password/message in 3 lines |
| Quantum Coin Flip | `03-quantum-coin.js` | Create superposition, measure, see randomness |

### 2. Semantic Computing Examples
Natural language processing and concept mapping.

| Example | File | Description |
|---------|------|-------------|
| Vocabulary Building | `semantic/01-vocabulary.js` | Define words with prime signatures, build ontology |
| Sentence Comparison | `semantic/02-similarity.js` | Compare two sentences for semantic similarity |
| Non-Commutativity | `semantic/03-word-order.js` | Show "dog bites man" ≠ "man bites dog" |
| DNA Encoding | `semantic/04-dna-processing.js` | Use bidirectional, codons, 6-frame analysis |
| Register Translation | `semantic/05-registers.js` | Same meaning in formal/casual/poetic styles |
| Concept Clustering | `semantic/06-clustering.js` | Group related concepts by prime signature |
| Text Classification | `semantic/07-classifier.js` | Simple sentiment/topic classifier |
| Question Answering | `semantic/08-qa-system.js` | Build a simple QA system with transforms |

### 3. Cryptographic Examples
Security-focused applications.

| Example | File | Description |
|---------|------|-------------|
| Secure Password Hashing | `crypto/01-password-hash.js` | Hash and verify passwords safely |
| Key Derivation | `crypto/02-key-derivation.js` | PBKDF-like key stretching |
| Message Authentication | `crypto/03-hmac.js` | Sign and verify messages with HMAC |
| Commitment Scheme | `crypto/04-commitment.js` | Commit-reveal protocol |
| Content Addressing | `crypto/05-content-hash.js` | Content-addressable storage like IPFS |

### 4. Scientific Computing Examples
Physics simulations and quantum computing.

| Example | File | Description |
|---------|------|-------------|
| Single Qubit Gates | `scientific/01-single-qubit.js` | X, Y, Z, H gates on |0⟩ and |1⟩ |
| Two Qubit Gates | `scientific/02-two-qubit.js` | CNOT, SWAP, entanglement |
| Bell States | `scientific/03-bell-states.js` | Create and measure all 4 Bell states |
| Quantum Random Number | `scientific/04-quantum-rng.js` | True random via quantum measurement |
| Grover's Search | `scientific/05-grover-search.js` | Simplified Grover's algorithm |
| Particle Physics | `scientific/06-particles.js` | Model particle interactions |
| Wave Function Collapse | `scientific/07-wavefunction.js` | Visualize collapse dynamics |

### 5. Hypercomplex Math Examples
Low-level mathematical operations.

| Example | File | Description |
|---------|------|-------------|
| Quaternion Rotations | `math/01-quaternions.js` | 3D rotations with quaternions |
| Octonion Multiplication | `math/02-octonions.js` | Explore non-associativity |
| Zero Divisors | `math/03-zero-divisors.js` | Find and visualize sedenion zero divisors |
| Prime Geometry | `math/04-prime-geometry.js` | Map primes to geometric structures |
| Gaussian Primes | `math/05-gaussian-primes.js` | Visualize Gaussian integer primes |

### 6. Physics Engine Examples
Oscillator dynamics and stability analysis.

| Example | File | Description |
|---------|------|-------------|
| Simple Oscillator | `physics/01-oscillator.js` | Single oscillator dynamics |
| Coupled Oscillators | `physics/02-kuramoto.js` | Kuramoto synchronization |
| Phase Transitions | `physics/03-phase-transition.js` | Order parameter emergence |
| Lyapunov Analysis | `physics/04-lyapunov.js` | Stability classification |
| Entropy Evolution | `physics/05-entropy.js` | Track entropy over time |

### 7. Application Examples
Complete mini-applications.

| Example | File | Description |
|---------|------|-------------|
| Semantic Search Engine | `apps/01-search-engine.js` | Search documents by meaning |
| Chatbot | `apps/02-chatbot.js` | Simple conversational agent |
| Content Deduplication | `apps/03-deduplication.js` | Find similar/duplicate content |
| Password Manager Core | `apps/04-password-manager.js` | Key derivation for password vault |
| Ontology Explorer | `apps/05-ontology-explorer.js` | Interactive ontology browser |
| Quantum Simulator CLI | `apps/06-quantum-cli.js` | Command-line quantum circuit tool |

### 8. AI & Machine Learning Examples
Using TinyAleph for AI applications.

| Example | File | Description |
|---------|------|-------------|
| Prime Embeddings | `ai/01-embeddings.js` | Generate embeddings for text/concepts |
| Semantic Memory | `ai/02-semantic-memory.js` | Long-term memory for AI agents |
| Reasoning Chain | `ai/03-reasoning.js` | Multi-step inference with transforms |
| Knowledge Graph | `ai/04-knowledge-graph.js` | Build and query prime-based KG |
| LLM Integration | `ai/05-llm-integration.js` | Combine TinyAleph with LLM APIs |
| Agent Architecture | `ai/06-agent.js` | Simple reasoning agent |
| Symbolic + Neural | `ai/07-hybrid-ai.js` | Combine symbolic primes with embeddings |
| Entropy-Based Reasoning | `ai/08-entropy-reasoning.js` | Use entropy minimization for inference |
| Concept Learning | `ai/09-concept-learning.js` | Learn new concepts from examples |
| Prompt Engineering | `ai/10-prompt-primes.js` | Prime-based prompt construction |
| RAG with Primes | `ai/11-rag.js` | Retrieval augmented generation |
| Neural-Symbolic Bridge | `ai/12-neuro-symbolic.js` | Map neural embeddings to primes |

### 9. Advanced Examples
Deep dives into specific features.

| Example | File | Description |
|---------|------|-------------|
| Custom Backend | `advanced/01-custom-backend.js` | Implement your own backend |
| Transform Engine | `advanced/02-transforms.js` | Build reasoning with transforms |
| Field-Based Computing | `advanced/03-field-computing.js` | Oscillator-based answer emergence |
| Hybrid Pipelines | `advanced/04-hybrid-pipeline.js` | Combine multiple backends |
| Training Loop | `advanced/05-training.js` | Learn new vocabulary from data |

---

## Implementation Plan

### Phase 1: Quickstart (3 files)
Essential examples for immediate productivity.

### Phase 2: Core Domains (24 files)
- Semantic: 8 examples
- Crypto: 5 examples
- Scientific: 7 examples
- Math: 5 examples

### Phase 3: AI/ML (12 files)
- AI & ML applications that showcase TinyAleph's unique strengths

### Phase 4: Physics & Apps (11 files)
- Physics: 5 examples
- Applications: 6 examples

### Phase 5: Advanced (5 files)
Deep customization and extension patterns.

---

## Example Template

Each example should follow this structure:

```javascript
/**
 * @example Example Name
 * @description What this example demonstrates
 * @requires Specific requirements if any
 */

const { /* imports */ } = require('@aleph-ai/tinyaleph');

// ===========================================
// SETUP
// ===========================================
// Configuration and initialization

// ===========================================
// EXAMPLE CODE
// ===========================================
// Main demonstration

// ===========================================
// OUTPUT
// ===========================================
// Show results

// ===========================================
// KEY TAKEAWAYS
// ===========================================
// Summarize what was learned
```

---

## Directory Structure

```
examples/
├── README.md                    # Overview and index
├── 01-hello-world.js           # Quickstart
├── 02-basic-hash.js
├── 03-quantum-coin.js
│
├── semantic/
│   ├── README.md
│   ├── 01-vocabulary.js
│   ├── 02-similarity.js
│   ├── 03-word-order.js
│   ├── 04-dna-processing.js
│   ├── 05-registers.js
│   ├── 06-clustering.js
│   ├── 07-classifier.js
│   └── 08-qa-system.js
│
├── crypto/
│   ├── README.md
│   ├── 01-password-hash.js
│   ├── 02-key-derivation.js
│   ├── 03-hmac.js
│   ├── 04-commitment.js
│   └── 05-content-hash.js
│
├── scientific/
│   ├── README.md
│   ├── 01-single-qubit.js
│   ├── 02-two-qubit.js
│   ├── 03-bell-states.js
│   ├── 04-quantum-rng.js
│   ├── 05-grover-search.js
│   ├── 06-particles.js
│   └── 07-wavefunction.js
│
├── math/
│   ├── README.md
│   ├── 01-quaternions.js
│   ├── 02-octonions.js
│   ├── 03-zero-divisors.js
│   ├── 04-prime-geometry.js
│   └── 05-gaussian-primes.js
│
├── physics/
│   ├── README.md
│   ├── 01-oscillator.js
│   ├── 02-kuramoto.js
│   ├── 03-phase-transition.js
│   ├── 04-lyapunov.js
│   └── 05-entropy.js
│
├── apps/
│   ├── README.md
│   ├── 01-search-engine.js
│   ├── 02-chatbot.js
│   ├── 03-deduplication.js
│   ├── 04-password-manager.js
│   ├── 05-ontology-explorer.js
│   └── 06-quantum-cli.js
│
├── ai/
│   ├── README.md
│   ├── 01-embeddings.js
│   ├── 02-semantic-memory.js
│   ├── 03-reasoning.js
│   ├── 04-knowledge-graph.js
│   ├── 05-llm-integration.js
│   ├── 06-agent.js
│   ├── 07-hybrid-ai.js
│   ├── 08-entropy-reasoning.js
│   ├── 09-concept-learning.js
│   ├── 10-prompt-primes.js
│   ├── 11-rag.js
│   └── 12-neuro-symbolic.js
│
└── advanced/
    ├── README.md
    ├── 01-custom-backend.js
    ├── 02-transforms.js
    ├── 03-field-computing.js
    ├── 04-hybrid-pipeline.js
    └── 05-training.js
```

---

## Success Criteria

Each example must:
1. Run without errors (`node examples/path/to/example.js`)
2. Produce visible, understandable output
3. Include comments explaining the "why"
4. Be self-contained (no external dependencies beyond TinyAleph)
5. Be under 150 lines of code
6. Include a "Key Takeaways" section

---

## Priority Order for Implementation

1. **Quickstart examples** (highest impact for new users)
2. **AI examples** (high demand - embeddings, memory, reasoning)
3. **Semantic examples** (core use case)
4. **Crypto examples** (practical utility)
5. **Scientific examples** (unique differentiator)
6. **Math examples** (educational value)
7. **Physics examples** (advanced understanding)
8. **Application examples** (real-world patterns)
9. **Advanced examples** (power users)