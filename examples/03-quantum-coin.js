/**
 * @example Quantum Coin Flip
 * @description Create a superposition, measure, and see quantum randomness
 * 
 * This example demonstrates TinyAleph's scientific backend for
 * quantum computing simulation. It shows:
 * - Creating quantum superposition states
 * - Applying quantum gates
 * - Measurement and collapse
 * - True quantum randomness
 */

const { ScientificBackend, Hypercomplex } = require('../modular');

// ===========================================
// SETUP
// ===========================================

// Create a scientific backend for quantum simulation
const backend = new ScientificBackend({ dimension: 16 });

// ===========================================
// QUANTUM COIN FLIP
// ===========================================

console.log('TinyAleph Quantum Coin Flip Example');
console.log('====================================\n');

// Start with |0⟩ state (classical "heads up" coin)
let zeroPrimes = backend.encode('|0⟩');
let zeroState = backend.primesToState(zeroPrimes);

console.log('Initial state: |0⟩ (coin heads up)');
console.log('Primes:', zeroPrimes);
console.log('First 4 components:', zeroState.c.slice(0, 4).map(c => c.toFixed(3)).join(', '));

// Apply Hadamard gate to create superposition
// H|0⟩ = (|0⟩ + |1⟩) / √2
const superpositionPrimes = backend.applyGate(zeroPrimes, 'H');
const superpositionState = backend.primesToState(superpositionPrimes);

console.log('\nAfter Hadamard gate: |+⟩ = (|0⟩ + |1⟩)/√2 (coin spinning!)');
console.log('Primes:', superpositionPrimes);
console.log('First 4 components:', superpositionState.c.slice(0, 4).map(c => c.toFixed(3)).join(', '));

// ===========================================
// MULTIPLE COIN FLIPS
// ===========================================

console.log('\n====================================');
console.log('FLIPPING THE QUANTUM COIN 10 TIMES');
console.log('====================================\n');

const results = [];

for (let i = 0; i < 10; i++) {
    // Create fresh |0⟩ state
    const coinPrimes = backend.encode('|0⟩');
    
    // Apply Hadamard to create superposition
    const spinningPrimes = backend.applyGate(coinPrimes, 'H');
    const spinningState = backend.primesToState(spinningPrimes);
    
    // Measure (collapse the superposition)
    const measurement = backend.measure(spinningState);
    
    // Interpret result
    const outcome = measurement.outcome === 0 ? 'Heads' : 'Tails';
    results.push(outcome);
    
    console.log(`Flip ${i + 1}: ${outcome} (probability: ${(measurement.probability * 100).toFixed(0)}%)`);
}

// Count results
const heads = results.filter(r => r === 'Heads').length;
const tails = results.filter(r => r === 'Tails').length;

console.log('\n------------------------------------');
console.log(`Results: ${heads} Heads, ${tails} Tails`);
console.log(`Ratio: ${(heads / results.length * 100).toFixed(0)}% / ${(tails / results.length * 100).toFixed(0)}%`);

// ===========================================
// QUANTUM VS CLASSICAL
// ===========================================

console.log('\n====================================');
console.log('QUANTUM VS CLASSICAL RANDOMNESS');
console.log('====================================\n');

// Classical: no superposition = deterministic
console.log('Classical coin (no Hadamard, always |0⟩):');
for (let i = 0; i < 3; i++) {
    const classicalPrimes = backend.encode('|0⟩');
    const classicalState = backend.primesToState(classicalPrimes);
    const result = backend.measure(classicalState);
    console.log(`  Flip ${i + 1}: ${result.outcome === 0 ? 'Heads' : 'Tails'} (prob: ${(result.probability * 100).toFixed(0)}%)`);
}

// Quantum: superposition gives randomness
console.log('\nQuantum coin (with Hadamard):');
for (let i = 0; i < 3; i++) {
    const qCoinPrimes = backend.encode('|0⟩');
    const qSpinningPrimes = backend.applyGate(qCoinPrimes, 'H');
    const qSpinningState = backend.primesToState(qSpinningPrimes);
    const qResult = backend.measure(qSpinningState);
    console.log(`  Flip ${i + 1}: ${qResult.outcome === 0 ? 'Heads' : 'Tails'} (prob: ${(qResult.probability * 100).toFixed(0)}%)`);
}

// ===========================================
// BELL STATE (ENTANGLEMENT)
// ===========================================

console.log('\n====================================');
console.log('BONUS: BELL STATE (Entanglement)');
console.log('====================================\n');

const bellPrimes = backend.createEntangledPair('Φ+');
const bellState = backend.primesToState(bellPrimes);
const bellName = backend.decode(bellPrimes);

console.log('Bell state |Φ+⟩ (maximally entangled):');
console.log('  Primes:', bellPrimes);
console.log('  Decoded:', bellName);
console.log('  Components:', bellState.c.slice(0, 4).map(c => c.toFixed(3)).join(', '));

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n====================================');
console.log('KEY TAKEAWAYS:');
console.log('1. |0⟩ and |1⟩ are basis states (like Heads/Tails)');
console.log('2. Hadamard gate creates superposition |+⟩');
console.log('3. Measurement collapses superposition probabilistically');
console.log('4. Each measurement is genuinely random');
console.log('5. Bell states demonstrate quantum entanglement');