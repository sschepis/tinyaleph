# Quantum Computing Guide

The Sentient Observer utilizes a novel Quantum Framework for prime prediction and pattern analysis, based on the connection between the Riemann Zeta function and quantum chaos. This guide explains the core concepts and how to use the provided tools.

## Theoretical Foundation

### Riemann Zeta Function & Quantum Chaos
The distribution of prime numbers is intimately connected to the zeros of the Riemann Zeta function, $\zeta(s)$. The Hilbert-Pólya conjecture suggests that these zeros correspond to the eigenvalues of a quantum Hamiltonian operator.

Our framework leverages this connection by treating the zeros as "resonant frequencies" of a quantum system. We calculate a "quantum waveform" $\psi(x)$ defined as:

$$ \psi(x) = \sum_{n} \cos(\gamma_n \ln x) $$

where $\gamma_n$ are the imaginary parts of the non-trivial zeros of $\zeta(s)$.

### Quantum Neural Network (QNN)
We employ a specialized neural network architecture that simulates quantum interference and entanglement.
- **Interference**: Activation functions model probability amplitudes rather than simple firing rates.
- **Entanglement**: Hidden layer states are cross-coupled to simulate non-local correlations, enhancing the network's ability to detect complex patterns in the prime distribution.

## Core Components

### 1. Quantum Math (`lib/quantum/math.js`)
Provides the fundamental mathematical operations:
- **`calculateWaveform(x)`**: Computes the quantum resonance at a given value.
- **`RIEMANN_ZEROS`**: A constant array containing the first 20 non-trivial zeros.

### 2. Waveform Analyzer (`lib/quantum/analyzer.js`)
A high-level tool for scanning ranges of numbers:
- **`analyzeRange(start, end)`**: Scans a range and returns resonance scores for each integer.
- **`findPeaks(data)`**: Identifies local maxima in the waveform, which are strong candidates for prime locations.

### 3. Quantum Neural Network (`lib/quantum/network.js`)
The predictive engine:
- **`predict(input)`**: Takes a waveform value (or vector) and outputs the probability of primality.
- **`train(input, target)`**: Updates the network weights using a quantum-inspired backpropagation algorithm.

## Usage Examples

### Detecting Prime Resonance
```javascript
const { WaveformAnalyzer } = require('../../lib/quantum/analyzer');

const analyzer = new WaveformAnalyzer();
const results = analyzer.analyzeRange(10, 50);

results.forEach(r => {
    if (r.resonance > 0.8) {
        console.log(`Strong resonance at ${r.x}: ${r.resonance}`);
    }
});
```

### Training the QNN
```javascript
const { QuantumNeuralNetwork } = require('../../lib/quantum/network');
const { generateTrainingData } = require('../../lib/quantum/math');

const qnn = new QuantumNeuralNetwork();
const data = generateTrainingData(10, 100);

// Train
data.forEach(d => qnn.train(d.input, d.output));

// Predict
const prob = qnn.predict(calculateWaveform(101));
console.log(`Probability 101 is prime: ${prob}`);
```
