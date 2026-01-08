/**
 * @example DNA Computing
 * @description Build logic gates and circuits using DNA strands
 * 
 * This example demonstrates DNA computing - using DNA strands to perform
 * logical computation. The key mechanisms are:
 *   - DNA hybridization (complementary strands bind)
 *   - Strand displacement (incoming strand displaces bound strand)
 *   - Toehold-mediated reactions (short overhangs enable displacement)
 * 
 * TinyAleph models these as prime-encoded strand operations.
 */

const { 
    BioinformaticsBackend, 
    DNACircuit, 
    ANDGate, 
    ORGate, 
    NOTGate
} = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new BioinformaticsBackend();

// ===========================================
// DNA STRAND BASICS
// ===========================================

console.log('TinyAleph DNA Computing Example');
console.log('================================\n');

console.log('DNA STRAND REPRESENTATION');
console.log('-------------------------\n');

// Create DNA strands using the backend
const seq1 = 'ATGCGATC';
const seq2 = 'GATCGCAT';

const strand1Primes = backend.encode(seq1);
const strand2Primes = backend.encode(seq2);

console.log('Strand 1 (signal-A):');
console.log(`  Sequence: 5'-${seq1}-3'`);
console.log(`  Primes: [${strand1Primes.slice(0, 4).join(', ')}...]`);
console.log(`  State norm: ${backend.primesToState(strand1Primes).norm().toFixed(4)}`);

console.log('\nStrand 2 (signal-B):');
console.log(`  Sequence: 5'-${seq2}-3'`);
console.log(`  Primes: [${strand2Primes.slice(0, 4).join(', ')}...]`);

// Check if strands are complementary
const COMPLEMENT = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
const comp1 = seq1.split('').map(b => COMPLEMENT[b]).join('');
const isComplementary = comp1 === seq2;
console.log(`\nAre strands complementary? ${isComplementary ? 'YES' : 'NO'}`);
console.log(`  Complement of strand 1: ${comp1}`);

// ===========================================
// SIMPLE LOGIC GATES
// ===========================================

console.log('\n\nLOGIC GATES');
console.log('-----------\n');

// Create a simple AND gate
const andGate = new ANDGate({ name: 'AND-1' });
console.log('AND Gate:', andGate.name);

// Test all input combinations (using concentration values 0 or 1)
console.log('\n  Truth Table:');
console.log('  A | B | A AND B');
console.log('  --|---|--------');
for (const [a, b] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
    const result = andGate.evaluate(a, b);
    console.log(`  ${a} | ${b} |    ${result.output ? 1 : 0}`);
}

// Create an OR gate
const orGate = new ORGate({ name: 'OR-1' });
console.log('\nOR Gate:', orGate.name);
console.log('\n  Truth Table:');
console.log('  A | B | A OR B');
console.log('  --|---|-------');
for (const [a, b] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
    const result = orGate.evaluate(a, b);
    console.log(`  ${a} | ${b} |   ${result.output ? 1 : 0}`);
}

// Create a NOT gate
const notGate = new NOTGate({ name: 'NOT-1' });
console.log('\nNOT Gate:', notGate.name);
console.log('\n  Truth Table:');
console.log('  A | NOT A');
console.log('  --|------');
for (const a of [0, 1]) {
    const result = notGate.evaluate(a);
    console.log(`  ${a} |   ${result.output ? 1 : 0}`);
}

// ===========================================
// DNA CIRCUIT
// ===========================================

console.log('\n\nDNA CIRCUIT: (A AND B) OR (NOT C)');
console.log('----------------------------------\n');

const circuit = new DNACircuit('main-circuit');

// Add gates to create: (A AND B) OR (NOT C)
circuit.addGate('and1', new ANDGate({ name: 'and1' }));
circuit.addGate('not1', new NOTGate({ name: 'not1' }));
circuit.addGate('or1', new ORGate({ name: 'or1' }));

// Connect: and1 output → or1 input1, not1 output → or1 input2
circuit.connect('and1', 'or1', 1);
circuit.connect('not1', 'or1', 2);

console.log('Circuit structure:');
console.log('  A ──┐');
console.log('      ├──[AND]──┐');
console.log('  B ──┘         ├──[OR]── result');
console.log('      ┌──[NOT]──┘');
console.log('  C ──┘');

console.log('\nCircuit gates:', circuit.listGates ? circuit.listGates().map(g => g.name).join(', ') : [...circuit.gates.keys()].join(', '));

// Manual evaluation for all input combinations
console.log('\nTruth Table:');
console.log('A | B | C | (A∧B)∨(¬C)');
console.log('--|---|---|----------');

for (const a of [0, 1]) {
    for (const b of [0, 1]) {
        for (const c of [0, 1]) {
            // Manually compute the logic
            const andResult = a && b;
            const notResult = !c;
            const finalResult = andResult || notResult;
            console.log(`${a} | ${b} | ${c} |     ${finalResult ? 1 : 0}`);
        }
    }
}

// ===========================================
// BINDING AFFINITY
// ===========================================

console.log('\n\nBINDING AFFINITY BETWEEN STRANDS');
console.log('---------------------------------\n');

// Test binding between different strands
const strandsToTest = [
    { name: 'Strand 1', seq: seq1 },
    { name: 'Complement', seq: comp1 },
    { name: 'Different', seq: 'GGGGCCCC' }
];

console.log('Binding affinities relative to Strand 1:');

for (const strand of strandsToTest) {
    const primes = backend.encode(strand.seq);
    const result = backend.bindingAffinity(strand1Primes, primes);
    console.log(`  ${strand.name} (${strand.seq}): ${result.affinity.toFixed(4)}`);
}

// ===========================================
// DNA COMPUTING ADVANTAGES
// ===========================================

console.log('\n\nDNA COMPUTING ADVANTAGES');
console.log('------------------------\n');

console.log('1. Massive parallelism: billions of molecules compute simultaneously');
console.log('2. Energy efficient: reactions occur at room temperature');
console.log('3. Ultra-dense storage: 1 gram DNA ≈ 215 petabytes');
console.log('4. Biocompatibility: can interface with living systems');
console.log('5. Self-assembly: complex structures emerge from simple rules');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n================================');
console.log('KEY TAKEAWAYS:');
console.log('1. DNA strands encode information as prime sequences');
console.log('2. Logic gates use strand displacement reactions');
console.log('3. Circuits compose gates for complex logic');
console.log('4. Binding affinity measured via prime resonance');
console.log('5. TinyAleph models DNA computing in hypercomplex space');