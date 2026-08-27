/**
 * Example 02: Codebook Tunneling
 * 
 * Demonstrates the 64-attractor codebook from discrete.pdf for
 * controlled state transitions via tunneling.
 */

import { SMF_CODEBOOK, nearestCodebookAttractor, codebookTunnel, getTunnelingCandidates } from '../../observer/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  64-Attractor Codebook and Tunneling');
console.log('═══════════════════════════════════════════════════════════════\n');

// Codebook structure
console.log('1. SMF Codebook Structure (64 Attractors)\n');
console.log('   From discrete.pdf: Pre-defined attractor states for');
console.log('   controlled tunneling in the Sedenion Memory Field.\n');

console.log(`   Total attractors: ${SMF_CODEBOOK.length}`);

// Group by type
const byType = {};
for (const entry of SMF_CODEBOOK) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
}

console.log('\n   Distribution by type:');
for (const [type, count] of Object.entries(byType)) {
    console.log(`   • ${type}: ${count} attractors`);
}

// Sample attractors
console.log('\n2. Sample Attractors\n');
console.log('   ┌─────┬────────────────┬────────────────────────┬───────────────┐');
console.log('   │ ID  │ Type           │ Active Axes            │ State         │');
console.log('   ├─────┼────────────────┼────────────────────────┼───────────────┤');

for (const entry of SMF_CODEBOOK.slice(0, 10)) {
    const axes = entry.axes.slice(0, 4).join(', ') + (entry.axes.length > 4 ? '...' : '');
    const state = Array.from(entry.state.slice(0, 3)).map(v => v.toFixed(1)).join(', ') + '...';
    console.log(`   │ ${String(entry.id).padStart(3)} │ ${entry.type.padEnd(14)} │ ${axes.padEnd(22)} │ ${state.padEnd(13)} │`);
}
console.log('   └─────┴────────────────┴────────────────────────┴───────────────┘');

// Finding nearest attractor
console.log('\n3. Finding Nearest Attractor\n');

// Create test states (16-dimensional SMF orientations)
const testStates = [
    { name: 'Coherent', s: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Random',   s: Array.from({ length: 16 }, () => Math.random() * 2 - 1) },
    { name: 'Sparse',   s: [0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0] },
];

console.log('   Finding nearest codebook attractor for test states:\n');

for (const test of testStates) {
    const nearest = nearestCodebookAttractor(test.s);
    if (nearest && nearest.attractor) {
        console.log(`   ${test.name} state → Attractor ${nearest.attractor.id} (${nearest.attractor.type})`);
        console.log(`     Distance: ${nearest.distance.toFixed(4)}`);
    } else {
        console.log(`   ${test.name} state → No attractor found`);
    }
}

// Codebook tunneling
console.log('\n4. Codebook Tunneling\n');
console.log('   Controlled state transitions via tunneling:\n');

// Create an initial state
const initialState = [0.8, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Find tunneling candidates near the initial state
const candidates = getTunnelingCandidates(initialState, 0.9);
console.log(`   Found ${candidates.length} tunneling candidate(s):\n`);
for (const cand of candidates.slice(0, 3)) {
    console.log(`   • Attractor ${cand.attractor.id} (${cand.type}): distance=${cand.distance.toFixed(4)}`);
}

// Tunnel with different mix factors
const tunnelingTests = [
    { name: 'Gentle', mixFactor: 0.1 },
    { name: 'Partial', mixFactor: 0.5 },
    { name: 'Full', mixFactor: 1.0 },
];

if (candidates.length > 0) {
    const targetIdx = candidates[0].index;
    console.log(`\n   Tunneling toward attractor ${candidates[0].attractor.id}:`);
    for (const test of tunnelingTests) {
        const result = codebookTunnel(initialState, targetIdx, test.mixFactor);
        const dot = result.reduce((acc, v, i) => acc + v * SMF_CODEBOOK[targetIdx].state[i], 0);
        console.log(`   ${test.name} (mix=${test.mixFactor}): cosine similarity to target = ${dot.toFixed(4)}`);
    }
} else {
    console.log('   No candidates found (initial state too far from codebook).');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  Key takeaway: discrete jumps between semantic states via');
console.log('  controlled tunneling through the 64-attractor codebook.');
console.log('═══════════════════════════════════════════════════════════════');
