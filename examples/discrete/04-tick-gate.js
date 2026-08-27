/**
 * Example 04: Tick-Only HQE Gating
 * 
 * Demonstrates the tick-based discrete gating from discrete.pdf
 * where quantum gates activate only on specific tick boundaries.
 */

import { TickGate } from '../../observer/index.js';

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

// Create tick gates in different modes
console.log('2. Creating Tick Gates\n');

const gates = [
    new TickGate({ mode: 'strict', minTickInterval: 1, name: 'strict' }),
    new TickGate({ mode: 'adaptive', coherenceThreshold: 0.6, name: 'adaptive' }),
    new TickGate({ mode: 'free', name: 'free' }),
];

for (const gate of gates) {
    console.log(`   • ${gate.mode} gate: threshold=${gate.coherenceThreshold}, minInterval=${gate.minTickInterval}ms`);
}

// Tick simulation
console.log('\n3. Tick Simulation\n');
console.log('   Without any tick events, checking shouldProcess:\n');

console.log('   ┌──────────┬──────────────┬───────────────┬─────────────────────────────┐');
console.log('   │ Mode     │ Coherence    │ Passes?       │ Reason                      │');
console.log('   ├──────────┼──────────────┼───────────────┼─────────────────────────────┤');

for (const gate of gates) {
    const r1 = gate.shouldProcess({ coherence: 0.9 });
    console.log(`   │ ${gate.mode.padEnd(8)} │ 0.9          │ ${r1.shouldPass ? 'Yes' : 'No '}           │ ${r1.reason.padEnd(27)} │`);
}
console.log('   └──────────┴──────────────┴───────────────┴─────────────────────────────┘');

console.log('\n   The strict gate blocks everything until an explicit tick;');
console.log('   adaptive gates open on high coherence; free mode never gates.\n');

// Explicit ticks
console.log('4. Explicit Tick Events\n');
const strictGate = gates[0];
console.log('   Registering 3 explicit ticks on the strict gate:\n');

console.log('   ┌───────┬────────────────┬───────────────────────────┐');
console.log('   │ Tick  │ Operation      │ Gate Decision             │');
console.log('   ├───────┼────────────────┼───────────────────────────┤');

for (let i = 0; i < 3; i++) {
    strictGate.tick();
    const r = strictGate.shouldProcess({ coherence: 0.1 });
    console.log(`   │ ${i + 1}     │ apply(gate)    │ ${r.shouldPass ? 'Pass  ✓' : 'Block ✗'} (${r.reason})           │`);
    const r2 = strictGate.shouldProcess({ coherence: 0.1 });
    console.log(`   │       │ (again)        │ ${r2.shouldPass ? 'Pass  ✓' : 'Block ✗'} (${r2.reason})           │`);
}
console.log('   └───────┴────────────────┴───────────────────────────┘');

console.log('\n   Each explicit tick permits exactly one operation;');
console.log('   subsequent operations are gated until the next tick.\n');

// Gate statistics
console.log('5. Gate Statistics\n');
for (const gate of gates) {
    const stats = gate.getStats();
    console.log(`   • ${gate.mode} gate: ${stats.passedCount} passed, ${stats.gatedCount} gated (ratio=${stats.gateRatio.toFixed(2)})`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  Key takeaway: HQE operations run only on valid tick events,');
console.log('  making discrete semantic updates deterministic.');
console.log('═══════════════════════════════════════════════════════════════');
