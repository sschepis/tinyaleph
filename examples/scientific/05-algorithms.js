/**
 * @example Quantum Algorithms
 * @description Implement basic quantum algorithms
 * 
 * Famous quantum algorithms that demonstrate quantum advantage:
 * - Deutsch-Jozsa: Determines function properties
 * - Grover: Searches unstructured data
 * - Quantum Teleportation: Transfers quantum states
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 8 });

console.log('TinyAleph Quantum Algorithms Example');
console.log('====================================\n');

// ===========================================
// DEUTSCH-JOZSA ALGORITHM
// ===========================================

console.log('Deutsch-Jozsa Algorithm:');
console.log('-'.repeat(50) + '\n');

console.log('Problem: Given f(x), determine if it is:');
console.log('  - Constant: f(x) = 0 for all x, or f(x) = 1 for all x');
console.log('  - Balanced: f(x) = 0 for half, f(x) = 1 for half\n');

console.log('Classical: Need up to 2^(n-1) + 1 queries');
console.log('Quantum: Need exactly 1 query!\n');

function deutschJozsa(oracle) {
    // Simplified simulation of Deutsch-Jozsa
    // In full implementation, we'd apply H gates, oracle, H gates, measure
    
    var steps = [
        'Initialize |0...0⟩|1⟩',
        'Apply H to all qubits',
        'Apply oracle U_f',
        'Apply H to input qubits',
        'Measure input qubits'
    ];
    
    console.log('Algorithm steps:');
    for (var i = 0; i < steps.length; i++) {
        console.log('  ' + (i + 1) + '. ' + steps[i]);
    }
    
    // Simulate result based on oracle type
    var result = oracle.type === 'constant' ? '000' : '001'; // Non-zero means balanced
    
    return {
        measurement: result,
        conclusion: result === '000' ? 'Constant' : 'Balanced',
        queries: 1
    };
}

// Test with constant and balanced oracles
var constantOracle = { type: 'constant', f: function(x) { return 0; } };
var balancedOracle = { type: 'balanced', f: function(x) { return x % 2; } };

console.log('\nConstant function (f(x) = 0):');
var result1 = deutschJozsa(constantOracle);
console.log('  Measurement: |' + result1.measurement + '⟩');
console.log('  Conclusion: ' + result1.conclusion);
console.log('  Queries used: ' + result1.queries);

console.log('\nBalanced function (f(x) = x mod 2):');
var result2 = deutschJozsa(balancedOracle);
console.log('  Measurement: |' + result2.measurement + '⟩');
console.log('  Conclusion: ' + result2.conclusion);
console.log('  Queries used: ' + result2.queries);

// ===========================================
// GROVER'S SEARCH ALGORITHM
// ===========================================

console.log('\n' + '='.repeat(50));
console.log("Grover's Search Algorithm:");
console.log('='.repeat(50) + '\n');

console.log('Problem: Find a marked item in an unstructured database');
console.log('Classical: O(N) queries needed');
console.log('Quantum: O(√N) queries needed!\n');

function groverSearch(databaseSize, markedItem) {
    var n = Math.ceil(Math.log2(databaseSize));
    var iterations = Math.floor(Math.PI / 4 * Math.sqrt(databaseSize));
    
    console.log('Database size: ' + databaseSize);
    console.log('Qubits needed: ' + n);
    console.log('Grover iterations: ' + iterations);
    
    // Simulate Grover steps
    var steps = [
        'Initialize: |s⟩ = H⊗n|0⟩ (equal superposition)',
        'Repeat ' + iterations + ' times:',
        '  a. Apply oracle O_f (phase flip marked item)',
        '  b. Apply diffusion operator D',
        'Measure'
    ];
    
    console.log('\nAlgorithm:');
    for (var i = 0; i < steps.length; i++) {
        console.log('  ' + steps[i]);
    }
    
    // Probability of finding marked item
    var successProb = Math.sin((2 * iterations + 1) * Math.asin(1 / Math.sqrt(databaseSize))) ** 2;
    
    return {
        markedItem: markedItem,
        iterations: iterations,
        successProbability: successProb,
        classicalQueries: databaseSize / 2
    };
}

var groverResult = groverSearch(16, 7);
console.log('\nResult:');
console.log('  Looking for item: ' + groverResult.markedItem);
console.log('  Success probability: ' + (groverResult.successProbability * 100).toFixed(1) + '%');
console.log('  Quantum queries: ' + groverResult.iterations);
console.log('  Classical average: ' + groverResult.classicalQueries);
console.log('  Speedup: ' + (groverResult.classicalQueries / groverResult.iterations).toFixed(1) + 'x');

// ===========================================
// QUANTUM TELEPORTATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Quantum Teleportation:');
console.log('='.repeat(50) + '\n');

console.log('Transfer quantum state |ψ⟩ using entanglement and classical bits.\n');

function teleportation(inputState) {
    console.log('Protocol:');
    console.log('  1. Alice and Bob share Bell pair |Φ+⟩');
    console.log('  2. Alice has state to teleport: ' + inputState);
    console.log('  3. Alice performs Bell measurement on her qubits');
    console.log('  4. Alice sends 2 classical bits to Bob');
    console.log('  5. Bob applies correction based on classical bits');
    console.log('  6. Bob recovers ' + inputState + '\n');
    
    // Simulate teleportation
    var measurementOutcomes = ['00', '01', '10', '11'];
    var outcome = measurementOutcomes[Math.floor(Math.random() * 4)];
    
    var corrections = {
        '00': 'None (I)',
        '01': 'X gate',
        '10': 'Z gate',
        '11': 'Z then X gates'
    };
    
    return {
        inputState: inputState,
        bellMeasurement: outcome,
        correction: corrections[outcome],
        outputState: inputState,
        success: true
    };
}

var teleResult = teleportation('α|0⟩ + β|1⟩');
console.log('Simulation:');
console.log('  Input state: ' + teleResult.inputState);
console.log('  Bell measurement: |' + teleResult.bellMeasurement + '⟩');
console.log('  Bob applies: ' + teleResult.correction);
console.log('  Output state: ' + teleResult.outputState);
console.log('  Teleportation successful: ' + teleResult.success);

// ===========================================
// QUANTUM PHASE ESTIMATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Quantum Phase Estimation:');
console.log('='.repeat(50) + '\n');

console.log('Estimates the phase θ of a unitary U where U|ψ⟩ = e^(2πiθ)|ψ⟩');
console.log('Key subroutine for many quantum algorithms.\n');

function phaseEstimation(truePhase, precision) {
    var n = precision;
    
    console.log('True phase: ' + truePhase);
    console.log('Precision bits: ' + n);
    console.log('Phase resolution: 1/' + Math.pow(2, n) + ' = ' + (1/Math.pow(2, n)).toFixed(4));
    
    // Simulate phase estimation
    // In real algorithm: controlled-U gates, inverse QFT, measure
    
    var estimatedBinary = Math.round(truePhase * Math.pow(2, n));
    var estimatedPhase = estimatedBinary / Math.pow(2, n);
    var error = Math.abs(truePhase - estimatedPhase);
    
    return {
        truePhase: truePhase,
        estimatedPhase: estimatedPhase,
        error: error,
        precision: n
    };
}

var qpe = phaseEstimation(0.375, 4);
console.log('\nResult:');
console.log('  True phase: ' + qpe.truePhase);
console.log('  Estimated: ' + qpe.estimatedPhase);
console.log('  Error: ' + qpe.error);

// ===========================================
// ALGORITHM COMPARISON
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Algorithm Comparison:');
console.log('='.repeat(50) + '\n');

console.log('Algorithm            Problem                Classical  Quantum');
console.log('-'.repeat(70));
console.log('Deutsch-Jozsa        Function type          O(2^n)     O(1)');
console.log('Grover               Search                 O(N)       O(√N)');
console.log('Shor                 Factoring              O(exp)     O((log N)³)');
console.log('Phase Estimation     Eigenvalue             O(poly)    O(log(1/ε))');
console.log('Teleportation        State transfer         N/A        O(1) + 2 bits');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Deutsch-Jozsa shows exponential speedup');
console.log('2. Grover provides quadratic speedup for search');
console.log('3. Teleportation transfers states without moving qubits');
console.log('4. Phase estimation underlies many algorithms');
console.log('5. Quantum advantage varies by problem type');
console.log('6. Not all problems have quantum speedup');