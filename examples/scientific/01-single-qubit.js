/**
 * @example Single Qubit Operations
 * @description Simulate single qubit quantum gates
 * 
 * TinyAleph can simulate quantum computing concepts:
 * - Qubits represented as hypercomplex states
 * - Quantum gates as transformations
 * - Measurement with probabilistic collapse
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 2 });

console.log('TinyAleph Single Qubit Example');
console.log('==============================\n');

// ===========================================
// QUBIT BASICS
// ===========================================

console.log('Qubit Basics:');
console.log('-'.repeat(50) + '\n');

console.log('A qubit is a quantum bit that can be in superposition.');
console.log('Classical: 0 or 1');
console.log('Quantum: α|0⟩ + β|1⟩ where |α|² + |β|² = 1\n');

// Create basis states
var ket0 = backend.encode('|0⟩');
var ket1 = backend.encode('|1⟩');

console.log('Basis state |0⟩ primes: [' + ket0.join(', ') + ']');
console.log('Basis state |1⟩ primes: [' + ket1.join(', ') + ']');

// ===========================================
// QUANTUM GATES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Quantum Gates:');
console.log('='.repeat(50) + '\n');

// Hadamard gate - creates superposition
console.log('Hadamard Gate (H):');
console.log('  Creates equal superposition from basis states');
console.log('  H|0⟩ = (|0⟩ + |1⟩)/√2');
console.log('  H|1⟩ = (|0⟩ - |1⟩)/√2\n');

var h_state = backend.applyGate(ket0, 'H');
console.log('  H|0⟩ result primes: [' + h_state.join(', ') + ']\n');

// Pauli-X gate - bit flip
console.log('Pauli-X Gate (NOT):');
console.log('  Flips the qubit state');
console.log('  X|0⟩ = |1⟩');
console.log('  X|1⟩ = |0⟩\n');

var x_state = backend.applyGate(ket0, 'X');
console.log('  X|0⟩ result primes: [' + x_state.join(', ') + ']\n');

// Pauli-Z gate - phase flip
console.log('Pauli-Z Gate:');
console.log('  Flips the phase of |1⟩');
console.log('  Z|0⟩ = |0⟩');
console.log('  Z|1⟩ = -|1⟩\n');

var z_state = backend.applyGate(ket1, 'Z');
console.log('  Z|1⟩ result primes: [' + z_state.join(', ') + ']\n');

// ===========================================
// SUPERPOSITION
// ===========================================

console.log('='.repeat(50));
console.log('Superposition:');
console.log('='.repeat(50) + '\n');

// Create superposition state
var superposition = backend.applyGate(ket0, 'H');
var state = backend.primesToState(superposition);

console.log('Superposition |+⟩ = H|0⟩:');
console.log('  State norm: ' + state.norm().toFixed(4));
console.log('  First components: [' + state.c.slice(0, 2).map(function(v) { return v.toFixed(4); }).join(', ') + ']\n');

// ===========================================
// MEASUREMENT
// ===========================================

console.log('='.repeat(50));
console.log('Measurement:');
console.log('='.repeat(50) + '\n');

console.log('Measuring a superposition collapses it probabilistically:\n');

// Measure superposition multiple times
var measurements = { '0': 0, '1': 0 };
var trials = 100;

for (var i = 0; i < trials; i++) {
    var superState = backend.applyGate(ket0, 'H');
    var qstate = backend.primesToState(superState);
    var result = backend.measure(qstate);
    measurements[result]++;
}

console.log('Measuring |+⟩ = (|0⟩ + |1⟩)/√2, ' + trials + ' trials:');
console.log('  |0⟩: ' + measurements['0'] + ' (' + (measurements['0']/trials*100).toFixed(1) + '%)');
console.log('  |1⟩: ' + measurements['1'] + ' (' + (measurements['1']/trials*100).toFixed(1) + '%)');
console.log('  Expected: ~50% each\n');

// ===========================================
// GATE SEQUENCES
// ===========================================

console.log('='.repeat(50));
console.log('Gate Sequences:');
console.log('='.repeat(50) + '\n');

// H then H should return to original
console.log('H·H = I (identity):');
var hh = backend.applyGate(backend.applyGate(ket0, 'H'), 'H');
console.log('  H(H|0⟩) primes: [' + hh.join(', ') + ']');
console.log('  Original |0⟩: [' + ket0.join(', ') + ']\n');

// X·X = I
console.log('X·X = I (identity):');
var xx = backend.applyGate(backend.applyGate(ket0, 'X'), 'X');
console.log('  X(X|0⟩) primes: [' + xx.join(', ') + ']');
console.log('  Original |0⟩: [' + ket0.join(', ') + ']\n');

// H·X·H = Z
console.log('H·X·H = Z (gate identity):');
var hxh = backend.applyGate(backend.applyGate(backend.applyGate(ket1, 'H'), 'X'), 'H');
var z_direct = backend.applyGate(ket1, 'Z');
console.log('  H(X(H|1⟩)) primes: [' + hxh.join(', ') + ']');
console.log('  Z|1⟩ primes: [' + z_direct.join(', ') + ']\n');

// ===========================================
// BLOCH SPHERE VISUALIZATION
// ===========================================

console.log('='.repeat(50));
console.log('Bloch Sphere Representation:');
console.log('='.repeat(50) + '\n');

console.log('Single qubit states can be visualized on a Bloch sphere:');
console.log('  |0⟩ = North pole');
console.log('  |1⟩ = South pole');
console.log('  |+⟩ = Positive X axis');
console.log('  |-⟩ = Negative X axis');
console.log('  |i⟩ = Positive Y axis');
console.log('  |-i⟩ = Negative Y axis\n');

var states = [
    { name: '|0⟩', primes: ket0 },
    { name: '|1⟩', primes: ket1 },
    { name: '|+⟩', primes: backend.applyGate(ket0, 'H') },
    { name: '|-⟩', primes: backend.applyGate(ket1, 'H') }
];

console.log('State representations:');
for (var s = 0; s < states.length; s++) {
    var st = states[s];
    var qstate = backend.primesToState(st.primes);
    console.log('  ' + st.name + ': norm=' + qstate.norm().toFixed(4) + ', primes=[' + st.primes.join(', ') + ']');
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Qubits can be in superposition of |0⟩ and |1⟩');
console.log('2. Hadamard gate creates equal superposition');
console.log('3. Pauli gates flip bits or phases');
console.log('4. Measurement collapses superposition probabilistically');
console.log('5. Gates can be composed into sequences');
console.log('6. Bloch sphere visualizes single qubit states');