/**
 * @example Quantum Measurement
 * @description Explore quantum measurement and state collapse
 * 
 * Measurement in quantum mechanics:
 * - Collapses superposition to definite state
 * - Results are probabilistic
 * - Cannot be undone
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 4 });

console.log('TinyAleph Quantum Measurement Example');
console.log('=====================================\n');

// ===========================================
// MEASUREMENT BASICS
// ===========================================

console.log('Measurement Basics:');
console.log('-'.repeat(50) + '\n');

console.log('Before measurement: |ψ⟩ = α|0⟩ + β|1⟩');
console.log('After measurement: |0⟩ or |1⟩ (definite state)');
console.log('Probability: P(0) = |α|², P(1) = |β|²\n');

// Create superposition
var ket0 = backend.encode('|0⟩');
var superposition = backend.applyGate(ket0, 'H');
var state = backend.primesToState(superposition);

console.log('Superposition state |+⟩:');
console.log('  Components: [' + state.c.slice(0, 2).map(function(v) { return v.toFixed(4); }).join(', ') + ']');
console.log('  Norm: ' + state.norm().toFixed(4) + '\n');

// ===========================================
// REPEATED MEASUREMENTS
// ===========================================

console.log('='.repeat(50));
console.log('Repeated Measurements:');
console.log('='.repeat(50) + '\n');

function runMeasurements(trials, prepareState) {
    var results = {};
    
    for (var i = 0; i < trials; i++) {
        var state = prepareState();
        var result = backend.measure(state);
        results[result] = (results[result] || 0) + 1;
    }
    
    return results;
}

// Equal superposition
console.log('Measuring |+⟩ = (|0⟩ + |1⟩)/√2:\n');

var equalResults = runMeasurements(1000, function() {
    var primes = backend.applyGate(ket0, 'H');
    return backend.primesToState(primes);
});

for (var result in equalResults) {
    if (equalResults.hasOwnProperty(result)) {
        var count = equalResults[result];
        var pct = (count / 1000 * 100).toFixed(1);
        console.log('  |' + result + '⟩: ' + count + ' (' + pct + '%)');
    }
}
console.log('  Expected: ~50% each\n');

// ===========================================
// BIASED SUPERPOSITION
// ===========================================

console.log('='.repeat(50));
console.log('Biased Superpositions:');
console.log('='.repeat(50) + '\n');

console.log('States with unequal amplitudes have biased probabilities.\n');

// Simulate biased state (|ψ⟩ = √0.8|0⟩ + √0.2|1⟩)
function simulateBiasedMeasurement(prob0) {
    return Math.random() < prob0 ? '0' : '1';
}

var biasedResults = { '0': 0, '1': 0 };
var trials = 1000;
var prob0 = 0.8;

for (var i = 0; i < trials; i++) {
    var result = simulateBiasedMeasurement(prob0);
    biasedResults[result]++;
}

console.log('Measuring |ψ⟩ = √0.8|0⟩ + √0.2|1⟩:\n');
console.log('  |0⟩: ' + biasedResults['0'] + ' (' + (biasedResults['0']/trials*100).toFixed(1) + '%)');
console.log('  |1⟩: ' + biasedResults['1'] + ' (' + (biasedResults['1']/trials*100).toFixed(1) + '%)');
console.log('  Expected: ~80% |0⟩, ~20% |1⟩');

// ===========================================
// MEASUREMENT COLLAPSE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Measurement Collapse:');
console.log('='.repeat(50) + '\n');

console.log('After measurement, the state is collapsed.');
console.log('Repeated measurements of the SAME state give SAME result.\n');

// Demonstrate collapse
var collapsedState = null;
var firstMeasurement = null;
var subsequentResults = [];

// First measurement collapses the state
for (var i = 0; i < 10; i++) {
    if (i === 0) {
        var primes = backend.applyGate(ket0, 'H');
        collapsedState = backend.primesToState(primes);
        firstMeasurement = backend.measure(collapsedState);
        subsequentResults.push(firstMeasurement);
    } else {
        // After collapse, measurement is deterministic
        subsequentResults.push(firstMeasurement);
    }
}

console.log('Initial measurement: |' + firstMeasurement + '⟩');
console.log('Subsequent measurements (same collapsed state):');
console.log('  ' + subsequentResults.join(', '));
console.log('  All same (state is collapsed)');

// ===========================================
// MULTI-QUBIT MEASUREMENT
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Multi-Qubit Measurement:');
console.log('='.repeat(50) + '\n');

console.log('Measuring multiple qubits:');
console.log('  Can measure all at once or sequentially');
console.log('  Entangled qubits show correlations\n');

// Simulate Bell state measurement
var bellResults = { '00': 0, '01': 0, '10': 0, '11': 0 };
trials = 1000;

for (var i = 0; i < trials; i++) {
    // Bell state has 50% |00⟩ and 50% |11⟩
    var r = Math.random();
    if (r < 0.5) {
        bellResults['00']++;
    } else {
        bellResults['11']++;
    }
}

console.log('Measuring Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2:\n');
for (var outcome in bellResults) {
    if (bellResults.hasOwnProperty(outcome)) {
        var count = bellResults[outcome];
        console.log('  |' + outcome + '⟩: ' + count + ' (' + (count/trials*100).toFixed(1) + '%)');
    }
}
console.log('  Note: |01⟩ and |10⟩ never occur (entanglement)');

// ===========================================
// MEASUREMENT STATISTICS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Measurement Statistics:');
console.log('='.repeat(50) + '\n');

function computeStatistics(results, total) {
    var stats = {};
    
    for (var outcome in results) {
        if (results.hasOwnProperty(outcome)) {
            var count = results[outcome];
            var frequency = count / total;
            var stdError = Math.sqrt(frequency * (1 - frequency) / total);
            
            stats[outcome] = {
                count: count,
                frequency: frequency,
                stdError: stdError
            };
        }
    }
    
    return stats;
}

var stats = computeStatistics(equalResults, 1000);

console.log('Statistical analysis of equal superposition:\n');
for (var outcome in stats) {
    if (stats.hasOwnProperty(outcome)) {
        var s = stats[outcome];
        console.log('  |' + outcome + '⟩:');
        console.log('    Frequency: ' + (s.frequency * 100).toFixed(2) + '%');
        console.log('    Standard Error: ' + (s.stdError * 100).toFixed(2) + '%');
        console.log('    95% CI: [' + ((s.frequency - 1.96*s.stdError)*100).toFixed(1) + '%, ' + ((s.frequency + 1.96*s.stdError)*100).toFixed(1) + '%]');
    }
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Measurement collapses superposition');
console.log('2. Results are probabilistic (|amplitude|²)');
console.log('3. Collapsed states give deterministic results');
console.log('4. Entangled qubits show correlated outcomes');
console.log('5. Statistical analysis quantifies uncertainty');
console.log('6. Cannot predict individual measurement outcomes');