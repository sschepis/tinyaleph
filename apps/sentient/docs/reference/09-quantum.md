# Quantum Framework API Reference

This document details the API for the Quantum Framework modules located in `apps/sentient/lib/quantum/`.

## `math.js`

Core mathematical utilities for quantum waveform generation.

### Constants

#### `RIEMANN_ZEROS`
`Array<number>`
The first 20 imaginary parts of the non-trivial zeros of the Riemann Zeta function. Used as frequencies for waveform generation.

### Functions

#### `calculateWaveform(x, numZeros)`
Calculates the quantum waveform amplitude at a specific point.
- **Parameters**:
  - `x` (number): The input value to evaluate.
  - `numZeros` (number, optional): Number of zeros to use in summation. Defaults to all available.
- **Returns**: `number` - The calculated amplitude.

#### `generateWaveformRange(start, end, step)`
Generates waveform data points over a specified range.
- **Parameters**:
  - `start` (number): Start of range.
  - `end` (number): End of range.
  - `step` (number, optional): Step size. Defaults to 0.1.
- **Returns**: `Array<{x: number, y: number}>`

#### `generateTrainingData(start, end)`
Generates labeled training data for the QNN.
- **Parameters**:
  - `start` (number): Start of range.
  - `end` (number): End of range.
- **Returns**: `Array<{input: number, output: number, isPrime: boolean}>`

---

## `network.js`

### Class: `QuantumNeuralNetwork`

A feed-forward neural network with simulated quantum interference and entanglement layers.

#### Constructor
`new QuantumNeuralNetwork(config)`
- **config** (object):
  - `inputSize` (number): Default 1.
  - `hiddenSize` (number): Default 8.
  - `outputSize` (number): Default 1.
  - `learningRate` (number): Default 0.01.
  - `entanglementFactor` (number): Strength of hidden layer cross-coupling. Default 0.1.

#### Methods

#### `predict(input)`
Performs a forward pass to predict primality probability.
- **Parameters**:
  - `input` (number|Array): The input feature(s).
- **Returns**: `number` - Probability (0-1).

#### `train(input, target)`
Trains the network on a single example.
- **Parameters**:
  - `input` (number|Array): The input feature(s).
  - `target` (number): Expected output (0 or 1).
- **Returns**: `number` - The error magnitude.

---

## `analyzer.js`

### Class: `WaveformAnalyzer`

High-level analysis tool for detecting resonance patterns.

#### Constructor
`new WaveformAnalyzer()`

#### Methods

#### `analyzeRange(start, end, step)`
Analyzes a range of numbers for quantum resonance.
- **Parameters**:
  - `start` (number): Start of range.
  - `end` (number): End of range.
  - `step` (number, optional): Step size. Default 1.
- **Returns**: `Array<Result>`
  - `Result` object: `{ x, resonance, isPrime, waveform }`

#### `calculateResonance(amplitude)`
Converts raw waveform amplitude to a normalized resonance score.
- **Parameters**:
  - `amplitude` (number): Raw waveform value.
- **Returns**: `number` - Resonance score (0-1).

#### `findPeaks(data)`
Identifies local maxima in a dataset.
- **Parameters**:
  - `data` (Array<{x, y}>): Waveform data.
- **Returns**: `Array<{x, y}>` - Array of peak points.
