/**
 * @example Two-Qubit Systems
 * @description Simulate two-qubit quantum systems and entanglement
 * 
 * Two-qubit systems enable:
 * - Tensor product states
 * - Entanglement
 * - Two-qubit gates like CNOT
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 4 });

console.log('TinyAleph Two-Qubit System Example');
console.log('===================================\n');

// ===========================================
// TWO-QUBIT BASICS
// ===========================================

console.log('Two-Qubit Basics:');
console.log('-'.repeat(50) + '\n');

console.log('A two-qubit system has 4 basis states:');
console.log('  |00⟩, |01⟩, |10⟩, |11⟩');
console.log('  General state: α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩');
console.log('  where |α|² + |β|² + |γ|² + |δ|² = 1\n');

// Create basis states
var ket00 = backend.encode('|00⟩');
var ket01 = backend.encode('|01⟩');
var ket10 = backend.encode('|10⟩');
var ket11 = backend.encode('|11⟩');

console.log('Basis states:');
console.log('  |00⟩ primes: [' + ket00.join(', ') + ']');
console.log('  |01⟩ primes: [' + ket01.join(', ') + ']');
console.log('  |10⟩ primes: [' + ket10.join(', ') + ']');
console.log('  |11⟩ primes: [' + ket11.join(', ') + ']');

// ===========================================
// TENSOR PRODUCTS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Tensor Products:');
console.log('='.repeat(50) + '\n');

console.log('Two independent qubits combine via tensor product:');
console.log('  |ψ₁⟩ ⊗ |ψ₂⟩\n');

// Simulate tensor product of two qubits
function tensorProduct(q1, q2) {
    // In full simulation, this would create a 4-dimensional state
    // Here we use encoding to represent the combined state
    var label = '|' + q1 + q2 + '⟩';
    return backend.encode(label);
}

var tp_00 = tensorProduct('0', '0');
var tp_01 = tensorProduct('0', '1');
var tp_10 = tensorProduct('1', '0');
var tp_11 = tensorProduct('1', '1');

console.log('Tensor products:');
console.log('  |0⟩ ⊗ |0⟩ = |00⟩: [' + tp_00.join(', ') + ']');
console.log('  |0⟩ ⊗ |1⟩ = |01⟩: [' + tp_01.join(', ') + ']');
console.log('  |1⟩ ⊗ |0⟩ = |10⟩: [' + tp_10.join(', ') + ']');
console.log('  |1⟩ ⊗ |1⟩ = |11⟩: [' + tp_11.join(', ') + ']');

// ===========================================
// CNOT GATE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('CNOT Gate (Controlled-NOT):');
console.log('='.repeat(50) + '\n');

console.log('CNOT flips the target qubit if control qubit is |1⟩:');
console.log('  CNOT|00⟩ = |00⟩');
console.log('  CNOT|01⟩ = |01⟩');
console.log('  CNOT|10⟩ = |11⟩  (target flipped)');
console.log('  CNOT|11⟩ = |10⟩  (target flipped)\n');

// Simulate CNOT
function applyCNOT(primes) {
    var state = primes.join('');
    // Map CNOT action based on input state
    if (state === ket10.join('')) return ket11;
    if (state === ket11.join('')) return ket10;
    return primes;  // |00⟩ and |01⟩ unchanged
}

console.log('CNOT results:');
console.log('  CNOT|00⟩ = [' + applyCNOT(ket00).join(', ') + ']');
console.log('  CNOT|01⟩ = [' + applyCNOT(ket01).join(', ') + ']');
console.log('  CNOT|10⟩ = [' + applyCNOT(ket10).join(', ') + ']');
console.log('  CNOT|11⟩ = [' + applyCNOT(ket11).join(', ') + ']');

// ===========================================
// ENTANGLEMENT
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Entanglement:');
console.log('='.repeat(50) + '\n');

console.log('Entangled states cannot be written as tensor products.');
console.log('Bell states are maximally entangled:\n');

// Bell states
console.log('Bell states:');
console.log('  |Φ+⟩ = (|00⟩ + |11⟩)/√2');
console.log('  |Φ-⟩ = (|00⟩ - |11⟩)/√2');
console.log('  |Ψ+⟩ = (|01⟩ + |10⟩)/√2');
console.log('  |Ψ-⟩ = (|01⟩ - |10⟩)/√2\n');

// Create Bell state |Φ+⟩: H on first qubit, then CNOT
console.log('Creating |Φ+⟩ = (|00⟩ + |11⟩)/√2:');
console.log('  1. Start with |00⟩');
console.log('  2. Apply H to first qubit -> (|0⟩+|1⟩)/√2 ⊗ |0⟩');
console.log('  3. Apply CNOT -> (|00⟩ + |11⟩)/√2');

// Simulate Bell state creation
var bellState = backend.encode('|Phi+⟩');
console.log('  Bell state |Φ+⟩ primes: [' + bellState.join(', ') + ']');

// ===========================================
// ENTANGLEMENT PROPERTIES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Entanglement Properties:');
console.log('='.repeat(50) + '\n');

console.log('Key properties of entangled states:');
console.log('  1. Non-local correlations');
console.log('  2. Cannot be factored into independent states');
console.log('  3. Measuring one qubit affects the other instantly');
console.log('  4. Basis of quantum communication and computing\n');

// Simulate measuring entangled pair
console.log('Measuring Bell state |Φ+⟩:');
console.log('  If first qubit = |0⟩ -> second qubit = |0⟩');
console.log('  If first qubit = |1⟩ -> second qubit = |1⟩');
console.log('  Always perfectly correlated!\n');

// Measurement simulation
var bellMeasurements = { '00': 0, '11': 0 };
var trials = 100;

for (var i = 0; i < trials; i++) {
    // Simulate Bell state measurement
    var r = Math.random();
    if (r < 0.5) {
        bellMeasurements['00']++;
    } else {
        bellMeasurements['11']++;
    }
}

console.log('Simulated measurements (' + trials + ' trials):');
console.log('  |00⟩: ' + bellMeasurements['00'] + ' (' + (bellMeasurements['00']/trials*100).toFixed(1) + '%)');
console.log('  |11⟩: ' + bellMeasurements['11'] + ' (' + (bellMeasurements['11']/trials*100).toFixed(1) + '%)');
console.log('  Note: |01⟩ and |10⟩ never occur (perfect correlation)');

// ===========================================
// TWO-QUBIT GATES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Two-Qubit Gates:');
console.log('='.repeat(50) + '\n');

console.log('Common two-qubit gates:\n');

console.log('CNOT (Controlled-NOT):');
console.log('  Control=|1⟩ flips target');

console.log('\nCZ (Controlled-Z):');
console.log('  Control=|1⟩ applies Z to target');
console.log('  CZ|11⟩ = -|11⟩\n');

console.log('SWAP:');
console.log('  Exchanges qubit values');
console.log('  SWAP|01⟩ = |10⟩');
console.log('  SWAP|10⟩ = |01⟩\n');

console.log('iSWAP:');
console.log('  SWAP with phase');
console.log('  iSWAP|01⟩ = i|10⟩');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Two qubits have 4 basis states');
console.log('2. Independent qubits combine via tensor product');
console.log('3. CNOT creates entanglement');
console.log('4. Bell states are maximally entangled');
console.log('5. Entangled qubits show perfect correlations');
console.log('6. Two-qubit gates enable quantum algorithms');