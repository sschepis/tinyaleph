# Scientific Computing Examples

This directory contains examples demonstrating TinyAleph's quantum computing simulation capabilities.

## Examples

### 01-single-qubit.js
**Single Qubit Operations** - Simulate quantum gates on single qubits (H, X, Z gates).

```bash
node examples/scientific/01-single-qubit.js
```

### 02-two-qubit.js
**Two-Qubit Systems** - Explore tensor products, CNOT gates, and entanglement.

```bash
node examples/scientific/02-two-qubit.js
```

### 03-quantum-circuits.js
**Quantum Circuits** - Build and execute quantum circuits from gate sequences.

```bash
node examples/scientific/03-quantum-circuits.js
```

### 04-measurement.js
**Quantum Measurement** - Understand measurement, state collapse, and probability.

```bash
node examples/scientific/04-measurement.js
```

### 05-algorithms.js
**Quantum Algorithms** - Implement Deutsch-Jozsa, Grover's search, and teleportation.

```bash
node examples/scientific/05-algorithms.js
```

### 06-random.js
**Quantum Random Numbers** - Generate true random numbers from quantum measurement.

```bash
node examples/scientific/06-random.js
```

### 07-wavefunction.js
**Wavefunction Simulation** - Explore wavefunction properties, normalization, and evolution.

```bash
node examples/scientific/07-wavefunction.js
```

## Key Concepts

### Qubits
Quantum bits that can exist in superposition:
- |0⟩ and |1⟩ are basis states
- General state: α|0⟩ + β|1⟩
- |α|² + |β|² = 1 (normalization)

### Quantum Gates
Unitary transformations on qubits:
- **H (Hadamard)**: Creates superposition
- **X (NOT)**: Flips bit
- **Z**: Flips phase
- **CNOT**: Controlled NOT (entangles qubits)

### Measurement
Observing a quantum state:
- Collapses superposition
- Results are probabilistic
- Cannot be undone

### Entanglement
Correlated quantum states:
- Bell states are maximally entangled
- Measurement of one affects the other
- Enables quantum communication

## Usage Pattern

```javascript
const { ScientificBackend } = require('../../modular');

// Create backend (dimension = 2^n for n qubits)
const backend = new ScientificBackend({ dimension: 2 });

// Encode quantum state
const ket0 = backend.encode('|0⟩');

// Apply gate
const superposition = backend.applyGate(ket0, 'H');

// Get hypercomplex state
const state = backend.primesToState(superposition);

// Measure
const result = backend.measure(state);
console.log('Measured: |' + result + '⟩');
```

## Quantum Advantage

| Algorithm | Classical | Quantum | Speedup |
|-----------|-----------|---------|---------|
| Deutsch-Jozsa | O(2^n) | O(1) | Exponential |
| Grover Search | O(N) | O(√N) | Quadratic |
| Shor Factoring | O(exp) | O((log N)³) | Exponential |

## Next Steps

After understanding quantum simulation, explore:
- `../math/` - Hypercomplex algebra and number theory
- `../physics/` - Physics simulations using oscillators
- `../apps/` - Full application examples