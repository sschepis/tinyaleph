/**
 * @example Wavefunction Simulation
 * @description Explore wavefunction properties and evolution
 * 
 * The wavefunction is central to quantum mechanics:
 * - Describes the quantum state completely
 * - Evolves according to Schrödinger equation
 * - Probability amplitudes determine measurements
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 8 });

console.log('TinyAleph Wavefunction Simulation Example');
console.log('=========================================\n');

// ===========================================
// WAVEFUNCTION BASICS
// ===========================================

console.log('Wavefunction Basics:');
console.log('-'.repeat(50) + '\n');

console.log('The wavefunction |ψ⟩ contains all information about a quantum system.');
console.log('It is a vector in Hilbert space with complex amplitudes.\n');

// Create a simple wavefunction
var ket0 = backend.encode('|0⟩');
var state = backend.primesToState(ket0);

console.log('Ground state |0⟩:');
console.log('  Components: [' + state.c.map(function(v) { return v.toFixed(4); }).join(', ') + ']');
console.log('  Norm: ' + state.norm().toFixed(4) + ' (should be 1)');

// ===========================================
// SUPERPOSITION STATES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Superposition States:');
console.log('='.repeat(50) + '\n');

// Create superposition
var superposition = backend.applyGate(ket0, 'H');
var superState = backend.primesToState(superposition);

console.log('Superposition |+⟩ = (|0⟩ + |1⟩)/√2:');
console.log('  Components: [' + superState.c.slice(0, 4).map(function(v) { return v.toFixed(4); }).join(', ') + ']');
console.log('  Norm: ' + superState.norm().toFixed(4));

// ===========================================
// PROBABILITY AMPLITUDES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Probability Amplitudes:');
console.log('='.repeat(50) + '\n');

console.log('|ψ⟩ = Σ αᵢ|i⟩ where αᵢ are probability amplitudes');
console.log('Probability of measuring |i⟩: P(i) = |αᵢ|²\n');

function computeProbabilities(state) {
    var probs = [];
    var total = 0;
    
    for (var i = 0; i < state.c.length; i++) {
        var amplitude = state.c[i];
        var prob = amplitude * amplitude;  // |α|²
        probs.push(prob);
        total += prob;
    }
    
    // Normalize
    return probs.map(function(p) { return p / total; });
}

var probs = computeProbabilities(superState);
console.log('Probabilities for |+⟩ state:');
for (var i = 0; i < Math.min(4, probs.length); i++) {
    if (probs[i] > 0.001) {
        console.log('  P(|' + i + '⟩) = ' + (probs[i] * 100).toFixed(1) + '%');
    }
}

// ===========================================
// NORMALIZATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Normalization:');
console.log('='.repeat(50) + '\n');

console.log('Wavefunctions must be normalized: ⟨ψ|ψ⟩ = 1');
console.log('This ensures probabilities sum to 1.\n');

// Create unnormalized state
var unnormalized = Hypercomplex.zero(8);
unnormalized.c[0] = 3;
unnormalized.c[1] = 4;

console.log('Unnormalized state:');
console.log('  Components: [' + unnormalized.c.slice(0, 2).map(function(v) { return v.toFixed(4); }).join(', ') + ', ...]');
console.log('  Norm: ' + unnormalized.norm().toFixed(4));

var normalized = unnormalized.normalize();
console.log('\nAfter normalization:');
console.log('  Components: [' + normalized.c.slice(0, 2).map(function(v) { return v.toFixed(4); }).join(', ') + ', ...]');
console.log('  Norm: ' + normalized.norm().toFixed(4) + ' (should be 1)');

// ===========================================
// TIME EVOLUTION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Time Evolution:');
console.log('='.repeat(50) + '\n');

console.log('Schrödinger equation: i ℏ d|ψ⟩/dt = H|ψ⟩');
console.log('Solution: |ψ(t)⟩ = e^(-iHt/ℏ)|ψ(0)⟩\n');

// Simulate simple time evolution (rotation)
function evolve(state, time, energy) {
    var result = Hypercomplex.zero(state.c.length);
    
    // Apply phase evolution
    var phase = energy * time;
    var cos = Math.cos(phase);
    var sin = Math.sin(phase);
    
    for (var i = 0; i < state.c.length; i++) {
        // Simplified rotation
        result.c[i] = state.c[i] * cos;
    }
    
    return result.normalize();
}

console.log('Time evolution simulation (simplified):');
var times = [0, 0.25, 0.5, 0.75, 1.0];

for (var t = 0; t < times.length; t++) {
    var time = times[t];
    var evolved = evolve(superState, time * Math.PI, 1);
    console.log('  t=' + time.toFixed(2) + 'π: [' + evolved.c.slice(0, 2).map(function(v) { return v.toFixed(3); }).join(', ') + ', ...]');
}

// ===========================================
// INNER PRODUCTS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Inner Products:');
console.log('='.repeat(50) + '\n');

console.log('⟨φ|ψ⟩ measures overlap between states');
console.log('If orthogonal: ⟨φ|ψ⟩ = 0');
console.log('If identical: ⟨ψ|ψ⟩ = 1 (normalized)\n');

function innerProduct(state1, state2) {
    var sum = 0;
    for (var i = 0; i < state1.c.length; i++) {
        sum += state1.c[i] * state2.c[i];  // Simplified (real case)
    }
    return sum;
}

var ket1 = backend.encode('|1⟩');
var state1 = backend.primesToState(ket1);

console.log('Inner products:');
console.log('  ⟨0|0⟩ = ' + innerProduct(state, state).toFixed(4) + ' (should be 1)');
console.log('  ⟨1|1⟩ = ' + innerProduct(state1, state1).toFixed(4) + ' (should be 1)');
console.log('  ⟨0|1⟩ = ' + innerProduct(state, state1).toFixed(4) + ' (orthogonal)');
console.log('  ⟨0|+⟩ = ' + innerProduct(state, superState).toFixed(4) + ' (overlap)');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Wavefunction describes complete quantum state');
console.log('2. Amplitudes squared give probabilities');
console.log('3. States must be normalized (⟨ψ|ψ⟩ = 1)');
console.log('4. Time evolution follows Schrödinger equation');
console.log('5. Inner products measure state overlap');
console.log('6. Orthogonal states have zero overlap');