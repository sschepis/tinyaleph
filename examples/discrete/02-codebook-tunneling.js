/**
 * Example 02: Codebook Tunneling
 * 
 * Demonstrates the 64-attractor codebook from discrete.pdf for
 * controlled state transitions via tunneling.
 */

const { SMF_CODEBOOK, nearestCodebookAttractor, codebookTunnel } = require('../../apps/sentient/lib/smf');

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
    const state = entry.state.slice(0, 3).join(', ') + '...';
    console.log(`   │ ${entry.id.toString().padStart(3)} │ ${entry.type.padEnd(14)} │ ${axes.padEnd(22)} │ ${state.padEnd(13)} │`);
}
console.log('   └─────┴────────────────┴────────────────────────┴───────────────┘');

// Finding nearest attractor
console.log('\n3. Finding Nearest Attractor\n');

// Create test states
const testStates = [
    { name: 'Coherent', s: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Random',   s: Array.from({ length: 16 }, () => Math.random() * 2 - 1) },
    { name: 'Sparse',   s: [0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0] },
];

console.log('   Finding nearest codebook attractor for test states:\n');

for (const test of testStates) {
    const nearest = nearestCodebookAttractor(test);
    if (nearest) {
        console.log(`   ${test.name} state → Attractor ${nearest.entry.id} (${nearest.entry.type})`);
        console.log(`     Distance: ${nearest.distance.toFixed(4)}`);
    } else {
        console.log(`   ${test.name} state → No attractor found`);
    }
}

// Codebook tunneling
console.log('\n4. Codebook Tunneling\n');
console.log('   Controlled state transitions via tunneling:\n');

// Create an initial state
const initialState = { s: [0.8, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };

// Try tunneling with different parameters
const tunnelingTests = [
    { rate: 0.1, threshold: 0.3 },
    { rate: 0.5, threshold: 0.5 },
    { rate: 0.9, threshold: 0.7 },
];

for (const params of tunnelingTests) {
    const result = codebookTunnel(initialState, params.rate, params.threshold);
    
    console.log(`   Rate=${params.rate}, Threshold=${params.threshold}:`);
    if (result.tunneled) {
        console.log(`     ✓ Tunneled to attractor ${result.targetId} (${result.targetType})`);
        console.log(`     Blend factor: ${result.blendFactor.toFixed(3)}`);
    } else {
        console.log(`     ✗ No tunnel (random check failed or no suitable attractor)`);
    }
}

// Attractor types explained
console.log('\n5. Attractor Types\n');

console.log('   • basis:      Single axis activation (pure modes)');
console.log('   • dual:       Two-axis correlation states');
console.log('   • triad:      Three-axis relationships');
console.log('   • quad:       Four-axis complex patterns');
console.log('   • harmonic:   Resonant frequency patterns');
console.log('   • modular:    Modular arithmetic relationships');

// Tunneling in practice
console.log('\n6. Tunneling in Practice\n');

console.log('   Codebook tunneling enables:');
console.log('   • Controlled phase transitions between stable states');
console.log('   • Escape from local minima during learning');
console.log('   • Structured exploration of semantic space');
console.log('   • Deterministic behavior for distributed consensus');

console.log('\n   Parameters:');
console.log('   • rate: Probability of attempting a tunnel');
console.log('   • threshold: Minimum distance to trigger tunneling');
console.log('   • Higher rate = more frequent transitions');
console.log('   • Higher threshold = only tunnel from far states');

console.log('\n═══════════════════════════════════════════════════════════════\n');