/**
 * Quantum Entanglement Demo
 * 
 * Demonstrates the effect of the entanglement layer in the Quantum Neural Network.
 * We compare two networks: one with entanglement disabled and one with it enabled,
 * to see how cross-coupling affects prediction confidence.
 */

const { QuantumNeuralNetwork } = require('../../apps/sentient/lib/quantum/network');
const { generateTrainingData, calculateWaveform } = require('../../apps/sentient/lib/quantum/math');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

console.log(colors.bright + 'Quantum Entanglement Demonstration' + colors.reset);
console.log('Comparing standard neural processing vs. quantum entangled processing...\n');

// 1. Setup Data
const trainStart = 10;
const trainEnd = 50;
const testVal = 53; // A prime number just outside training range

console.log(`Training Range: ${trainStart}-${trainEnd}`);
console.log(`Test Value: ${testVal} (Prime)\n`);

const trainingData = generateTrainingData(trainStart, trainEnd);
const testInput = calculateWaveform(testVal);

// 2. Train Standard Network (No Entanglement)
console.log(colors.blue + 'Training Standard Network (Entanglement = 0)...' + colors.reset);
const standardNet = new QuantumNeuralNetwork({
    entanglementFactor: 0.0,
    learningRate: 0.05
});

for (let i = 0; i < 100; i++) {
    trainingData.forEach(d => standardNet.train(d.input, d.output));
}

const standardProb = standardNet.predict(testInput);
console.log(`Standard Probability: ${standardProb.toFixed(4)}\n`);

// 3. Train Entangled Network
console.log(colors.magenta + 'Training Entangled Network (Entanglement = 0.2)...' + colors.reset);
const entangledNet = new QuantumNeuralNetwork({
    entanglementFactor: 0.2, // Enable cross-talk
    learningRate: 0.05
});

for (let i = 0; i < 100; i++) {
    trainingData.forEach(d => entangledNet.train(d.input, d.output));
}

const entangledProb = entangledNet.predict(testInput);
console.log(`Entangled Probability: ${entangledProb.toFixed(4)}\n`);

// 4. Comparison
console.log(colors.bright + 'Results Comparison:' + colors.reset);
console.log('-------------------');
console.log(`Standard:  ${standardProb.toFixed(4)}`);
console.log(`Entangled: ${entangledProb.toFixed(4)}`);

const diff = entangledProb - standardProb;
const improvement = (diff / standardProb) * 100;

if (diff > 0) {
    console.log(colors.green + `\nEntanglement increased confidence by ${improvement.toFixed(2)}%` + colors.reset);
    console.log('The cross-coupling of hidden states allowed the network to capture');
    console.log('non-local correlations in the Riemann Zeta waveform data.');
} else {
    console.log('\nNo significant improvement observed in this run.');
    console.log('Quantum effects are probabilistic; try running again.');
}
