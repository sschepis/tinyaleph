# Scientific Applications

This guide covers using Aleph for quantum-inspired simulation, wave mechanics, and computational physics.

## Overview

Aleph's scientific backend provides **quantum-inspired computation** through hypercomplex wave mechanics. The 16-dimensional sedenion space enables simulation of:

- Quantum superposition states
- Wave interference and collapse
- Entanglement-like correlations
- Measurement operators

---

## Creating a Scientific Engine

```javascript
const { createEngine, ScientificBackend } = require('./modular');

// Load configuration
const config = require('./data.json');

// Create engine
const engine = createEngine('scientific', config);

// Or create backend directly
const backend = new ScientificBackend(config);
```

---

## Quantum States

### Creating States

```javascript
const backend = new ScientificBackend(config);

// Create basis states
const psi0 = backend.createState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const psi1 = backend.createState([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

console.log('|ψ₀⟩ norm:', psi0.norm());  // 1.0
console.log('|ψ₁⟩ norm:', psi1.norm());  // 1.0

// Create superposition
const superposition = psi0.add(psi1).normalize();
console.log('Superposition norm:', superposition.norm());  // 1.0
```

### State Properties

```javascript
const state = backend.createRandomState();

// Key properties
console.log('Norm:', state.norm());
console.log('Entropy:', state.entropy());
console.log('Dimension:', state.dimension);

// Conjugate and inverse
const conj = state.conjugate();
const inv = state.inverse();

console.log('Self * Inverse:', state.multiply(inv).norm());  // ~1.0
```

### Superposition

```javascript
const backend = new ScientificBackend(config);

// Create weighted superposition
function superpose(state1, weight1, state2, weight2) {
  return state1.scale(weight1).add(state2.scale(weight2)).normalize();
}

const a = backend.createState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const b = backend.createState([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

// Equal superposition
const equal = superpose(a, 0.5, b, 0.5);

// Biased superposition
const biased = superpose(a, 0.8, b, 0.2);

console.log('Equal entropy:', equal.entropy());
console.log('Biased entropy:', biased.entropy());
// Biased has lower entropy
```

---

## Wave Mechanics

### Interference Patterns

```javascript
const backend = new ScientificBackend(config);

// Create two wave sources
const wave1 = backend.createState([1, 0.5, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const wave2 = backend.createState([1, -0.5, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

// Constructive interference (add)
const constructive = wave1.add(wave2);
console.log('Constructive amplitude:', constructive.norm());

// Destructive interference (subtract)
const destructive = wave1.add(wave2.scale(-1));
console.log('Destructive amplitude:', destructive.norm());
```

### Evolution

```javascript
// Time evolution with unitary operator
function evolve(state, operator, dt) {
  // U(dt) ≈ I + i*H*dt for small dt
  const evolved = state.multiply(operator.scale(dt));
  return evolved.normalize();
}

const backend = new ScientificBackend(config);

const initial = backend.createRandomState();
const hamiltonian = backend.createRandomState();  // Simplified

let state = initial;
const trajectory = [state.entropy()];

for (let t = 0; t < 100; t++) {
  state = evolve(state, hamiltonian, 0.01);
  trajectory.push(state.entropy());
}

console.log('Entropy trajectory:', trajectory.slice(0, 10));
```

### Oscillator Dynamics

```javascript
const { createOscillator } = require('./physics/oscillator');

// Create coupled oscillators
const oscillators = [];
for (let i = 0; i < 10; i++) {
  oscillators.push(createOscillator({
    frequency: 1.0 + 0.1 * Math.random(),
    phase: Math.random() * 2 * Math.PI,
    amplitude: 1.0
  }));
}

// Evolve with Kuramoto coupling
const { kuramotoStep } = require('./physics/kuramoto');

for (let t = 0; t < 1000; t++) {
  kuramotoStep(oscillators, 0.1, 0.01);  // coupling, dt
}

// Check synchronization
const phases = oscillators.map(o => o.phase);
const phaseVariance = variance(phases);
console.log('Phase variance:', phaseVariance);
// Low variance indicates synchronization
```

---

## Collapse and Measurement

### State Collapse

```javascript
const { collapse } = require('./physics/collapse');
const backend = new ScientificBackend(config);

// Create superposition
const superposition = backend.createRandomState();
console.log('Before collapse - entropy:', superposition.entropy());

// Collapse toward target
const target = backend.createState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const collapsed = collapse(superposition, target, 0.8);  // 80% collapse

console.log('After collapse - entropy:', collapsed.entropy());
console.log('Coherence with target:', collapsed.coherence(target));
```

### Measurement Operators

```javascript
const backend = new ScientificBackend(config);

// Define measurement projectors
const measureUp = backend.createState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const measureDown = backend.createState([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

// Create state to measure
const state = backend.createRandomState();

// Calculate measurement probabilities
const probUp = Math.pow(state.coherence(measureUp), 2);
const probDown = Math.pow(state.coherence(measureDown), 2);

console.log('P(up):', probUp.toFixed(4));
console.log('P(down):', probDown.toFixed(4));

// Perform measurement (collapse)
function measure(state, projector) {
  const prob = Math.pow(state.coherence(projector), 2);
  if (Math.random() < prob) {
    return { outcome: 'yes', state: projector };
  } else {
    return { outcome: 'no', state: state.subtract(projector.scale(state.coherence(projector))).normalize() };
  }
}
```

---

## Entanglement Simulation

### Creating Entangled States

```javascript
const backend = new ScientificBackend(config);

// Create Bell-like state
// |Ψ⟩ = (|00⟩ + |11⟩) / √2
function createBellState(backend) {
  // Use different dimensions for "qubit 1" and "qubit 2"
  const state00 = backend.createState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const state11 = backend.createState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  
  return state00.add(state11).normalize();
}

const bell = createBellState(backend);
console.log('Bell state entropy:', bell.entropy());
```

### Correlation Measurement

```javascript
// Measure correlations between subsystems
function measureCorrelation(entangledState, proj1, proj2) {
  const combined = proj1.multiply(proj2);
  return Math.pow(entangledState.coherence(combined), 2);
}

const backend = new ScientificBackend(config);
const bell = createBellState(backend);

// Measure in aligned bases
const z0 = backend.createState([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const z1 = backend.createState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

console.log('P(00):', measureCorrelation(bell, z0, z0));
console.log('P(11):', measureCorrelation(bell, z1, z1));
// Should show correlation
```

---

## Energy and Stability

### Lyapunov Exponents

```javascript
const { lyapunov } = require('./physics/lyapunov');
const backend = new ScientificBackend(config);

// Calculate stability of trajectory
function analyzeStability(trajectory) {
  const exponent = lyapunov(trajectory);
  
  return {
    exponent,
    stable: exponent < 0,
    chaotic: exponent > 0,
    marginal: Math.abs(exponent) < 0.01
  };
}

// Generate trajectory
const states = [];
let state = backend.createRandomState();
for (let i = 0; i < 100; i++) {
  states.push(state);
  state = state.multiply(backend.createRandomState().normalize());
}

const stability = analyzeStability(states.map(s => s.entropy()));
console.log('Stability analysis:', stability);
```

### Entropy Dynamics

```javascript
const { computeEntropy } = require('./physics/entropy');
const backend = new ScientificBackend(config);

// Track entropy over evolution
function entropyEvolution(initial, steps, perturbation) {
  const entropies = [];
  let state = initial;
  
  for (let i = 0; i < steps; i++) {
    entropies.push(computeEntropy(state));
    
    // Apply small perturbation
    const noise = backend.createRandomState().scale(perturbation);
    state = state.add(noise).normalize();
  }
  
  return entropies;
}

const initial = backend.createRandomState();
const entropies = entropyEvolution(initial, 100, 0.01);

console.log('Initial entropy:', entropies[0].toFixed(4));
console.log('Final entropy:', entropies[99].toFixed(4));
console.log('Entropy change:', (entropies[99] - entropies[0]).toFixed(4));
```

---

## Practical Applications

### Quantum-Inspired Optimization

```javascript
const backend = new ScientificBackend(config);

function quantumOptimize(costFunction, dimension, iterations) {
  // Initialize random state
  let state = backend.createRandomState();
  let bestCost = costFunction(state);
  let bestState = state;
  
  for (let i = 0; i < iterations; i++) {
    // Create superposition of current and random states
    const random = backend.createRandomState();
    const superposition = state.add(random.scale(0.1)).normalize();
    
    // "Measure" by evaluating cost
    const cost = costFunction(superposition);
    
    if (cost < bestCost) {
      bestCost = cost;
      bestState = superposition;
      state = superposition;
    } else {
      // Collapse back toward best with some probability
      const acceptProb = Math.exp(-(cost - bestCost) / (iterations - i));
      if (Math.random() < acceptProb) {
        state = superposition;
      }
    }
  }
  
  return { state: bestState, cost: bestCost };
}

// Example: minimize entropy (find pure state)
const result = quantumOptimize(s => s.entropy(), 16, 1000);
console.log('Final cost (entropy):', result.cost);
```

### Signal Processing

```javascript
const backend = new ScientificBackend(config);

// Encode signal as hypercomplex state
function encodeSignal(samples, backend) {
  if (samples.length > 16) {
    throw new Error('Signal too long for 16D representation');
  }
  
  const padded = [...samples];
  while (padded.length < 16) padded.push(0);
  
  return backend.createState(padded).normalize();
}

// Decode back to samples
function decodeSignal(state, length) {
  return state.components.slice(0, length);
}

// Filter using multiplication
function filterSignal(signal, filterKernel, backend) {
  return signal.multiply(filterKernel).normalize();
}

// Example: simple lowpass filter
const signal = encodeSignal([1, 0.5, 0.3, 0.8, 0.2, 0.6], backend);
const lowpass = backend.createState([1, 0.8, 0.6, 0.4, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).normalize();

const filtered = filterSignal(signal, lowpass, backend);
console.log('Filtered signal:', decodeSignal(filtered, 6));
```

### Monte Carlo Simulation

```javascript
const backend = new ScientificBackend(config);

// Use hypercomplex states for Monte Carlo sampling
function monteCarloIntegrate(f, dimensions, samples) {
  let sum = 0;
  
  for (let i = 0; i < samples; i++) {
    // Generate random point using hypercomplex state
    const randomState = backend.createRandomState();
    const point = randomState.components.slice(0, dimensions);
    
    // Evaluate function at point
    sum += f(point);
  }
  
  return sum / samples;
}

// Example: integrate x^2 + y^2 over [-1,1]^2
function sphereTest(point) {
  const [x, y] = point.map(p => p * 2 - 1);  // Scale to [-1,1]
  return x*x + y*y;
}

const estimate = monteCarloIntegrate(sphereTest, 2, 10000);
console.log('Monte Carlo estimate:', estimate);
// Should be close to 2/3 (analytical result)
```

---

## Performance Optimization

### Batch Operations

```javascript
const backend = new ScientificBackend(config);

// Process many states efficiently
function batchEvolve(states, operator) {
  return states.map(s => s.multiply(operator).normalize());
}

// Create batch
const batch = [];
for (let i = 0; i < 100; i++) {
  batch.push(backend.createRandomState());
}

// Evolve all at once
const evolved = batchEvolve(batch, backend.createRandomState());
console.log('Batch size:', evolved.length);
```

### State Caching

```javascript
const stateCache = new Map();

function getCachedState(key, computeFn) {
  if (!stateCache.has(key)) {
    stateCache.set(key, computeFn());
  }
  return stateCache.get(key);
}

// Use for expensive computations
const expensiveState = getCachedState('complex_state', () => {
  let state = backend.createRandomState();
  for (let i = 0; i < 1000; i++) {
    state = state.multiply(backend.createRandomState()).normalize();
  }
  return state;
});
```

---

## Next Steps

- [LLM Integration →](./05-llm-integration.md)
- [Theory: Phase Synchronization →](../theory/03-phase-synchronization.md)
- [Reference: ScientificBackend →](../reference/03-backends.md#scientific-backend)