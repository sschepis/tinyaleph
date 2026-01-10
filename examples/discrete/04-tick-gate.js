/**
 * Example 04: Tick-Only HQE Gating
 * 
 * Demonstrates the tick-based discrete gating from discrete.pdf
 * where quantum gates activate only on specific tick boundaries.
 */

const { TickGate } = require('../../apps/sentient/lib/hqe');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Tick-Only HQE Gating');
console.log('═══════════════════════════════════════════════════════════════\n');

// The tick gate concept
console.log('1. Tick-Based Discrete Gating\n');
console.log('   From discrete.pdf: Gates activate on discrete tick');
console.log('   boundaries rather than continuous time.\n');
console.log('   Benefits:');
console.log('   • Deterministic gate timing');
console.log('   • Reduced noise sensitivity');
console.log('   • Synchronized multi-gate operations');
console.log('   • Hardware-friendly implementation\n');

// Create tick gates
console.log('2. Creating Tick Gates\n');

const gates = [
    new TickGate({ period: 4, phase: 0, name: 'G0' }),
    new TickGate({ period: 4, phase: 1, name: 'G1' }),
    new TickGate({ period: 4, phase: 2, name: 'G2' }),
    new TickGate({ period: 4, phase: 3, name: 'G3' }),
];

console.log('   Created 4 gates with period=4, different phases:\n');
for (const gate of gates) {
    console.log(`   • ${gate.name}: period=${gate.period}, phase=${gate.phase}`);
}

// Tick simulation
console.log('\n3. Tick Simulation\n');
console.log('   Simulating 12 ticks, showing which gates are open:\n');

console.log('   ┌──────┬──────┬──────┬──────┬──────┐');
console.log('   │ Tick │  G0  │  G1  │  G2  │  G3  │');
console.log('   ├──────┼──────┼──────┼──────┼──────┤');

for (let tick = 0; tick < 12; tick++) {
    const states = gates.map(g => g.isOpen(tick) ? '  ●  ' : '  ○  ');
    console.log(`   │ ${tick.toString().padStart(4)} │${states.join('│')}│`);
}
console.log('   └──────┴──────┴──────┴──────┴──────┘');

// Gate application
console.log('\n4. Gate Application\n');

const inputState = { amplitude: 1.0, phase: 0 };
const operation = (state) => ({
    amplitude: state.amplitude * 0.9,
    phase: state.phase + Math.PI / 4
});

console.log('   Applying gate operation through tick sequence:\n');
console.log(`   Input state: amplitude=${inputState.amplitude}, phase=${inputState.phase.toFixed(3)}`);

let currentState = { ...inputState };
const gate = gates[0];

console.log('\n   ┌──────┬─────────────┬───────────────┬───────────────┐');
console.log('   │ Tick │ Gate Open?  │ Amplitude     │ Phase         │');
console.log('   ├──────┼─────────────┼───────────────┼───────────────┤');

for (let tick = 0; tick < 8; tick++) {
    const open = gate.isOpen(tick);
    if (open) {
        currentState = gate.apply(currentState, operation, tick);
    }
    const status = open ? 'Yes ●' : 'No  ○';
    console.log(`   │ ${tick.toString().padStart(4)} │ ${status.padEnd(11)} │ ${currentState.amplitude.toFixed(6).padStart(13)} │ ${currentState.phase.toFixed(6).padStart(13)} │`);
}
console.log('   └──────┴─────────────┴───────────────┴───────────────┘');

// Multiple coordinated gates
console.log('\n5. Coordinated Multi-Gate Operations\n');

console.log('   Multiple gates can be coordinated for complex operations:');
console.log('   • Sequential: G0 → G1 → G2 → G3');
console.log('   • Parallel: All gates at same phase');
console.log('   • Interleaved: Even/odd tick separation\n');

const seqGate = new TickGate({ period: 8, phase: 0, name: 'Prepare' });
const midGate = new TickGate({ period: 8, phase: 2, name: 'Process' });
const endGate = new TickGate({ period: 8, phase: 4, name: 'Measure' });

console.log('   Sequential pipeline (period=8):');
console.log('   ┌──────┬──────────┬──────────┬──────────┐');
console.log('   │ Tick │ Prepare  │ Process  │ Measure  │');
console.log('   ├──────┼──────────┼──────────┼──────────┤');

for (let tick = 0; tick < 8; tick++) {
    const prep = seqGate.isOpen(tick) ? '    ●   ' : '    ○   ';
    const proc = midGate.isOpen(tick) ? '    ●   ' : '    ○   ';
    const meas = endGate.isOpen(tick) ? '    ●   ' : '    ○   ';
    console.log(`   │ ${tick.toString().padStart(4)} │${prep}│${proc}│${meas}│`);
}
console.log('   └──────┴──────────┴──────────┴──────────┘');

// Prime-period gates
console.log('\n6. Prime-Period Gates\n');

console.log('   Using prime periods avoids synchronization artifacts:');

const primeGates = [
    new TickGate({ period: 3, phase: 0, name: 'P3' }),
    new TickGate({ period: 5, phase: 0, name: 'P5' }),
    new TickGate({ period: 7, phase: 0, name: 'P7' }),
];

console.log('\n   Prime periods (3, 5, 7):');
console.log('   ┌──────┬──────┬──────┬──────┬─────────────┐');
console.log('   │ Tick │  P3  │  P5  │  P7  │ All Open    │');
console.log('   ├──────┼──────┼──────┼──────┼─────────────┤');

for (let tick = 0; tick < 15; tick++) {
    const p3 = primeGates[0].isOpen(tick);
    const p5 = primeGates[1].isOpen(tick);
    const p7 = primeGates[2].isOpen(tick);
    const allOpen = p3 && p5 && p7 ? 'Yes (LCM=105)' : '';
    
    const s3 = p3 ? '  ●  ' : '  ○  ';
    const s5 = p5 ? '  ●  ' : '  ○  ';
    const s7 = p7 ? '  ●  ' : '  ○  ';
    console.log(`   │ ${tick.toString().padStart(4)} │${s3}│${s5}│${s7}│ ${allOpen.padEnd(11)} │`);
}
console.log('   └──────┴──────┴──────┴──────┴─────────────┘');

console.log('\n   Prime periods ensure gates rarely align simultaneously,');
console.log('   reducing interference and providing temporal isolation.');

console.log('\n═══════════════════════════════════════════════════════════════\n');