/**
 * @example Quantum Circuits
 * @description Build and run quantum circuits
 * 
 * Quantum circuits are sequences of quantum gates:
 * - Compose gates into circuits
 * - Execute circuits on quantum states
 * - Measure outputs
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 4 });

console.log('TinyAleph Quantum Circuits Example');
console.log('===================================\n');

// ===========================================
// QUANTUM CIRCUIT CLASS
// ===========================================

function QuantumCircuit(numQubits) {
    this.numQubits = numQubits;
    this.gates = [];
}

QuantumCircuit.prototype.h = function(qubit) {
    this.gates.push({ gate: 'H', qubit: qubit });
    return this;
};

QuantumCircuit.prototype.x = function(qubit) {
    this.gates.push({ gate: 'X', qubit: qubit });
    return this;
};

QuantumCircuit.prototype.z = function(qubit) {
    this.gates.push({ gate: 'Z', qubit: qubit });
    return this;
};

QuantumCircuit.prototype.cnot = function(control, target) {
    this.gates.push({ gate: 'CNOT', control: control, target: target });
    return this;
};

QuantumCircuit.prototype.measure = function() {
    this.gates.push({ gate: 'MEASURE' });
    return this;
};

QuantumCircuit.prototype.toString = function() {
    var lines = [];
    for (var i = 0; i < this.numQubits; i++) {
        lines.push('q' + i + ': ');
    }
    
    for (var g = 0; g < this.gates.length; g++) {
        var gate = this.gates[g];
        for (var i = 0; i < this.numQubits; i++) {
            if (gate.gate === 'H' && gate.qubit === i) {
                lines[i] += '--[H]--';
            } else if (gate.gate === 'X' && gate.qubit === i) {
                lines[i] += '--[X]--';
            } else if (gate.gate === 'Z' && gate.qubit === i) {
                lines[i] += '--[Z]--';
            } else if (gate.gate === 'CNOT' && gate.control === i) {
                lines[i] += '--[●]--';
            } else if (gate.gate === 'CNOT' && gate.target === i) {
                lines[i] += '--[⊕]--';
            } else if (gate.gate === 'MEASURE') {
                lines[i] += '--[M]--';
            } else {
                lines[i] += '-------';
            }
        }
    }
    
    return lines.join('\n');
};

// ===========================================
// BASIC CIRCUITS
// ===========================================

console.log('Basic Quantum Circuits:');
console.log('-'.repeat(50) + '\n');

// Create a simple circuit
var circuit1 = new QuantumCircuit(2);
circuit1.h(0).cnot(0, 1).measure();

console.log('Bell State Circuit (creates entanglement):');
console.log(circuit1.toString());
console.log('\nThis creates: (|00⟩ + |11⟩)/√2\n');

// Another circuit
var circuit2 = new QuantumCircuit(2);
circuit2.x(0).h(1).cnot(1, 0).measure();

console.log('Custom Circuit:');
console.log(circuit2.toString());
console.log('');

// ===========================================
// CIRCUIT EXECUTION
// ===========================================

console.log('='.repeat(50));
console.log('Circuit Execution:');
console.log('='.repeat(50) + '\n');

function executeCircuit(circuit, backend) {
    // Initialize to |00...0⟩
    var stateLabel = '|' + '0'.repeat(circuit.numQubits) + '⟩';
    var state = backend.encode(stateLabel);
    
    // Track state through gates
    var history = [{ step: 'init', state: stateLabel }];
    
    for (var g = 0; g < circuit.gates.length; g++) {
        var gate = circuit.gates[g];
        
        if (gate.gate === 'MEASURE') {
            history.push({ step: 'measure', state: 'collapse' });
        } else {
            // Apply gate (simplified simulation)
            var newState = backend.applyGate(state, gate.gate);
            history.push({ step: gate.gate + ' q' + (gate.qubit !== undefined ? gate.qubit : gate.control), state: newState.join(',') });
            state = newState;
        }
    }
    
    return history;
}

console.log('Executing Bell State Circuit:\n');
var history = executeCircuit(circuit1, backend);
for (var i = 0; i < history.length; i++) {
    var step = history[i];
    console.log('  Step ' + i + ' (' + step.step + '): ' + (typeof step.state === 'string' ? step.state : '[' + step.state + ']'));
}

// ===========================================
// PARAMETERIZED CIRCUITS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Parameterized Circuits:');
console.log('='.repeat(50) + '\n');

console.log('Parameterized circuits have adjustable rotation angles.');
console.log('Used in variational quantum algorithms like VQE and QAOA.\n');

function ParameterizedCircuit(numQubits) {
    QuantumCircuit.call(this, numQubits);
    this.parameters = {};
}

ParameterizedCircuit.prototype = Object.create(QuantumCircuit.prototype);

ParameterizedCircuit.prototype.rx = function(qubit, theta) {
    this.gates.push({ gate: 'RX', qubit: qubit, theta: theta });
    return this;
};

ParameterizedCircuit.prototype.ry = function(qubit, theta) {
    this.gates.push({ gate: 'RY', qubit: qubit, theta: theta });
    return this;
};

ParameterizedCircuit.prototype.rz = function(qubit, theta) {
    this.gates.push({ gate: 'RZ', qubit: qubit, theta: theta });
    return this;
};

var paramCircuit = new ParameterizedCircuit(2);
paramCircuit.ry(0, 'theta1').ry(1, 'theta2').cnot(0, 1);

console.log('Parameterized Circuit:');
console.log('  RY(θ₁) on q0');
console.log('  RY(θ₂) on q1');
console.log('  CNOT(q0, q1)');
console.log('\nParameters: θ₁ = 0.5, θ₂ = 1.2');

// ===========================================
// COMMON CIRCUIT PATTERNS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Common Circuit Patterns:');
console.log('='.repeat(50) + '\n');

// GHZ state
console.log('GHZ State (3 qubits):');
console.log('  Creates: (|000⟩ + |111⟩)/√2');
var ghz = new QuantumCircuit(3);
ghz.h(0).cnot(0, 1).cnot(0, 2);
console.log(ghz.toString());

// W state
console.log('\nW State (conceptual):');
console.log('  Creates: (|001⟩ + |010⟩ + |100⟩)/√3');
console.log('  More complex circuit required\n');

// Teleportation
console.log('Quantum Teleportation (3 qubits):');
console.log('  Transfers quantum state using entanglement');
var teleport = new QuantumCircuit(3);
teleport.h(1).cnot(1, 2);  // Create Bell pair
teleport.cnot(0, 1).h(0);   // Bell measurement
teleport.measure();
console.log(teleport.toString());

// ===========================================
// CIRCUIT DEPTH AND WIDTH
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Circuit Metrics:');
console.log('='.repeat(50) + '\n');

function analyzeCircuit(circuit) {
    var width = circuit.numQubits;
    var depth = 0;
    var gateCount = 0;
    var gateCounts = {};
    
    for (var g = 0; g < circuit.gates.length; g++) {
        var gate = circuit.gates[g];
        if (gate.gate !== 'MEASURE') {
            gateCount++;
            gateCounts[gate.gate] = (gateCounts[gate.gate] || 0) + 1;
        }
    }
    
    // Simplified depth calculation
    depth = circuit.gates.filter(function(g) { return g.gate !== 'MEASURE'; }).length;
    
    return {
        width: width,
        depth: depth,
        gateCount: gateCount,
        gateCounts: gateCounts
    };
}

var metrics = analyzeCircuit(circuit1);
console.log('Bell State Circuit Metrics:');
console.log('  Width (qubits): ' + metrics.width);
console.log('  Depth (layers): ' + metrics.depth);
console.log('  Total gates: ' + metrics.gateCount);
console.log('  Gate breakdown: ' + JSON.stringify(metrics.gateCounts));

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Circuits are sequences of quantum gates');
console.log('2. Gates act on specific qubits');
console.log('3. CNOT connects qubits (creates entanglement)');
console.log('4. Parameterized circuits enable optimization');
console.log('5. Circuit depth affects noise and runtime');
console.log('6. Common patterns: Bell, GHZ, teleportation');