# Part II: Practical Guide

This section provides hands-on guidance for using Aleph in your projects. Whether you're building semantic applications, implementing cryptographic operations, or simulating quantum systems, this guide will get you started.

## Contents

1. [Quick Start](./01-quickstart.md) - Get running in 5 minutes
2. [Semantic Computing](./02-semantic-computing.md) - Natural language understanding
3. [Cryptographic Applications](./03-cryptographic.md) - Hashing and key derivation
4. [Scientific Computing](./04-scientific.md) - Quantum simulation
5. [LLM Integration](./05-llm-integration.md) - Coupling with language models
6. [Symbolic AI & Resonance](./06-symbolic-ai.md) - Symbol inference with attention
7. [Advanced Techniques](./07-advanced.md) - Power user guide

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/tinyaleph.git
cd tinyaleph

# Install dependencies
npm install

# Verify installation
node -e "require('./modular'); console.log('✓ Aleph loaded')"
```

---

## Quick Example

```javascript
const { createEngine } = require('./modular');

// Load semantic configuration
const config = require('./data.json');

// Create an engine
const engine = createEngine('semantic', config);

// Process a query
const result = engine.run('What is the nature of wisdom?');

console.log({
  output: result.output,
  entropy: result.entropy.toFixed(3),
  coherence: result.coherence.toFixed(3)
});
```

---

## Choosing a Backend

Aleph supports three specialized backends:

| Backend | Use Case | Typical Applications |
|---------|----------|---------------------|
| **Semantic** | Natural language | Chatbots, concept mapping, reasoning |
| **Cryptographic** | Security | Hashing, key derivation, encryption |
| **Scientific** | Simulation | Quantum computing, particle physics |

```javascript
// Semantic backend
const semantic = createEngine('semantic', semanticConfig);

// Cryptographic backend
const crypto = createEngine('cryptographic', { dimension: 32 });

// Scientific backend
const science = createEngine('scientific', { dimension: 16 });
```

---

## The Engine Interface

All backends share a common engine interface:

```javascript
// Process input
const result = engine.run(input);

// Get physics state
const physics = engine.getPhysicsState();

// Evolve without input
const states = engine.evolve(10);

// Switch backends at runtime
engine.setBackend(newBackend);

// Reset state
engine.reset();

// Get history
const history = engine.getHistory(10);
```

---

## Result Object

Every `engine.run()` returns a result object:

```javascript
{
  input: "original input",
  inputPrimes: [2, 3, 5, 7],
  resultPrimes: [2, 3, 7],
  output: "decoded output",
  entropy: 2.31,
  coherence: 0.76,
  lyapunov: -0.05,
  stability: 'STABLE',
  collapsed: false,
  steps: [...],
  evolutionSteps: 42,
  framesCollected: 8,
  fieldBased: true,
  orderParameter: 0.82
}
```

| Field | Type | Description |
|-------|------|-------------|
| `input` | any | Original input |
| `inputPrimes` | number[] | Encoded prime representation |
| `resultPrimes` | number[] | Processed prime representation |
| `output` | any | Decoded output |
| `entropy` | number | Shannon entropy of final state |
| `coherence` | number | Phase coherence measure |
| `lyapunov` | number | Lyapunov exponent (stability) |
| `stability` | string | 'STABLE', 'MARGINAL', or 'CHAOTIC' |
| `collapsed` | boolean | Whether state collapsed |
| `steps` | object[] | Transform steps taken |
| `fieldBased` | boolean | Whether answer came from field dynamics |
| `orderParameter` | number | Kuramoto order parameter |

---

## Configuration

Each backend accepts configuration options:

### Semantic Backend

```javascript
const config = {
  dimension: 16,           // Hypercomplex dimension
  vocabulary: {...},       // Word → primes mapping
  ontology: {...},         // Prime → meaning mapping
  transforms: [...],       // Semantic transforms
  axes: {...},             // Semantic axes
  corePrimes: [2,3,5...],  // Protected primes
  stopWords: ['a','the'...] // Filtered words
};
```

### Engine Options

```javascript
const engineOptions = {
  dampingRate: 0.02,       // Oscillator damping
  baseCoupling: 0.3,       // Kuramoto coupling strength
  collapseCoherence: 0.7,  // Collapse coherence threshold
  collapseEntropy: 1.8,    // Collapse entropy threshold
  maxTransformSteps: 5,    // Max reasoning steps
  entropyThreshold: 0.5,   // Target entropy
  maxEvolutionSteps: 100,  // Max physics steps
  dt: 0.016                // Time step
};

const engine = createEngine('semantic', {
  ...config,
  engineOptions
});
```

---

## Next Steps

- [Quick Start →](./01-quickstart.md) - Get running in 5 minutes
- [Theory →](../theory/README.md) - Understand the foundations
- [Reference →](../reference/README.md) - Complete API documentation