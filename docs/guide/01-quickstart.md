# Quick Start

Get Aleph running in 5 minutes.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/tinyaleph.git
cd tinyaleph

# Install dependencies
npm install
```

## Verify Installation

```bash
node -e "const { createEngine } = require('./modular'); console.log('✓ Aleph ready')"
```

---

## Hello Semantic World

Create a file `hello.js`:

```javascript
const { createEngine } = require('./modular');

// Load configuration with vocabulary and ontology
const config = require('./data.json');

// Create semantic engine
const engine = createEngine('semantic', config);

// Process a query
const result = engine.run('What is love?');

console.log('Input:', result.input);
console.log('Output:', result.output);
console.log('Entropy:', result.entropy.toFixed(3));
console.log('Coherence:', result.coherence.toFixed(3));
console.log('Stability:', result.stability);
```

Run it:

```bash
node hello.js
```

Expected output:

```
Input: What is love?
Output: affection devotion compassion
Entropy: 2.145
Coherence: 0.723
Stability: STABLE
```

---

## Understanding the Output

### What Happened?

1. **Tokenization**: "What is love?" → ["love"] (stop words filtered)
2. **Prime Encoding**: "love" → [2, 3, 5] (from vocabulary)
3. **Oscillator Excitation**: Primes 2, 3, 5 excited in oscillator bank
4. **Field Evolution**: Kuramoto dynamics run for up to 100 steps
5. **Frame Sampling**: Coherent frames captured during evolution
6. **Decoding**: Best frame decoded to words

### Key Metrics

| Metric | Meaning |
|--------|---------|
| **Entropy** | How "spread out" the meaning is. Lower = clearer |
| **Coherence** | How synchronized the oscillators are. Higher = more unified |
| **Stability** | Lyapunov classification: STABLE, MARGINAL, or CHAOTIC |

---

## Exploring Physics

```javascript
const { createEngine } = require('./modular');
const config = require('./data.json');

const engine = createEngine('semantic', config);

// Run a query
engine.run('wisdom and truth');

// Examine physics state
const physics = engine.getPhysicsState();

console.log('State entropy:', physics.entropy.toFixed(3));
console.log('Order parameter:', physics.orderParameter.toFixed(3));
console.log('Lyapunov exponent:', physics.lyapunov.toFixed(4));
console.log('Coupling strength:', physics.coupling.toFixed(3));
console.log('Collapse probability:', physics.collapseProbability.toFixed(3));
```

---

## Multiple Queries

```javascript
const { createEngine } = require('./modular');
const config = require('./data.json');

const engine = createEngine('semantic', config);

const queries = [
  'What is truth?',
  'How does love relate to wisdom?',
  'Is freedom compatible with responsibility?'
];

for (const query of queries) {
  const result = engine.run(query);
  console.log(`\nQ: ${query}`);
  console.log(`A: ${result.output}`);
  console.log(`   Entropy: ${result.entropy.toFixed(2)}, Coherence: ${result.coherence.toFixed(2)}`);
}
```

---

## Batch Processing

```javascript
const { createEngine } = require('./modular');
const config = require('./data.json');

const engine = createEngine('semantic', config);

const inputs = [
  'love',
  'wisdom',
  'justice',
  'beauty',
  'truth'
];

const results = engine.runBatch(inputs);

for (const result of results) {
  console.log(`${result.input} → ${result.output} (H=${result.entropy.toFixed(2)})`);
}
```

---

## Continuous Evolution

Watch the physics unfold without new input:

```javascript
const { createEngine } = require('./modular');
const config = require('./data.json');

const engine = createEngine('semantic', config);

// Seed with a concept
engine.run('consciousness');

// Evolve for 50 steps
const states = engine.evolve(50);

console.log('Evolution trace:');
for (const state of states.slice(0, 10)) {
  console.log(`Step ${state.step}: H=${state.entropy.toFixed(3)}, r=${state.orderParameter.toFixed(3)}, ${state.stability}`);
}
```

---

## Switching Backends

```javascript
const { createEngine, CryptographicBackend } = require('./modular');
const semanticConfig = require('./data.json');

// Start with semantic
const engine = createEngine('semantic', semanticConfig);
console.log('Backend:', engine.getBackendInfo().name);

let result = engine.run('love and truth');
console.log('Semantic output:', result.output);

// Switch to cryptographic
engine.setBackend(new CryptographicBackend({ dimension: 32 }));
console.log('Backend:', engine.getBackendInfo().name);

// Now it hashes instead
result = engine.run('hello world');
console.log('Crypto primes:', result.resultPrimes.slice(0, 5));
```

---

## Using Individual Backends

You can use backends directly without the engine:

```javascript
const { SemanticBackend } = require('./modular');
const config = require('./data.json');

const backend = new SemanticBackend(config);

// Encode text to primes
const primes = backend.encode('love and wisdom');
console.log('Primes:', primes);

// Decode primes to text
const text = backend.decode(primes);
console.log('Decoded:', text);

// Get state vector
const state = backend.primesToState(primes);
console.log('State entropy:', state.entropy().toFixed(3));
```

---

## Common Patterns

### Check Semantic Similarity

```javascript
const { SemanticBackend } = require('./modular');
const config = require('./data.json');

const backend = new SemanticBackend(config);

function similarity(text1, text2) {
  const state1 = backend.textToOrderedState(text1);
  const state2 = backend.textToOrderedState(text2);
  return state1.coherence(state2);
}

console.log('love vs affection:', similarity('love', 'affection').toFixed(3));
console.log('love vs hatred:', similarity('love', 'hatred').toFixed(3));
console.log('love vs economics:', similarity('love', 'economics').toFixed(3));
```

### Monitor Stability

```javascript
const { createEngine } = require('./modular');
const config = require('./data.json');

const engine = createEngine('semantic', config);

// Process and check stability
const result = engine.run('chaos and order');

if (result.stability === 'CHAOTIC') {
  console.log('⚠️ Unstable state detected');
  console.log('Lyapunov:', result.lyapunov.toFixed(4));
} else if (result.stability === 'STABLE') {
  console.log('✓ Stable understanding achieved');
} else {
  console.log('~ Marginal stability');
}
```

### Track Collapse Events

```javascript
const { createEngine } = require('./modular');
const config = require('./data.json');

const engine = createEngine('semantic', config);

for (let i = 0; i < 10; i++) {
  const result = engine.run('quantum consciousness');
  if (result.collapsed) {
    console.log(`Collapse at iteration ${i}!`);
    console.log('Post-collapse entropy:', result.entropy.toFixed(3));
    break;
  }
}
```

---

## Next Steps

- [Semantic Computing →](./02-semantic-computing.md) - Deep dive into NLP
- [Cryptographic Applications →](./03-cryptographic.md) - Security features
- [Scientific Computing →](./04-scientific.md) - Quantum simulation
- [Theory →](../theory/README.md) - Understand the foundations