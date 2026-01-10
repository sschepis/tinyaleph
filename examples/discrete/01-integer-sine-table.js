/**
 * Example 01: Integer Sine Tables
 * 
 * Demonstrates the discrete phase dynamics from discrete.pdf using
 * integer sine tables for deterministic phase computation.
 */

const { INT_SINE_TABLE, computeHistogramCoherence } = require('../../apps/sentient/lib/prsc');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Integer Sine Tables for Discrete Phase Dynamics');
console.log('═══════════════════════════════════════════════════════════════\n');

// Basic sine table properties
console.log('1. Integer Sine Table (M=256)\n');
console.log('   From discrete.pdf: Pre-computed integer sine values');
console.log('   for deterministic phase dynamics.\n');

console.log(`   Table size: ${INT_SINE_TABLE.length} entries`);
console.log(`   Range: [${Math.min(...INT_SINE_TABLE)}, ${Math.max(...INT_SINE_TABLE)}]`);

// Sample values
console.log('\n   Sample values (phase → sine):\n');
console.log('   ┌───────────┬───────────┬──────────────┐');
console.log('   │ Index     │ Phase (°) │ sin(phase)   │');
console.log('   ├───────────┼───────────┼──────────────┤');

const sampleIndices = [0, 32, 64, 96, 128, 160, 192, 224, 255];
for (const i of sampleIndices) {
    const phase = (i / 256 * 360).toFixed(1);
    const value = INT_SINE_TABLE[i];
    const normalized = (value / 127).toFixed(4);
    console.log(`   │ ${i.toString().padStart(9)} │ ${phase.padStart(9)} │ ${normalized.padStart(12)} │`);
}
console.log('   └───────────┴───────────┴──────────────┘');

// Phase accumulator simulation
console.log('\n2. Phase Accumulator Simulation\n');

function simulatePhaseAccumulator(frequency, steps) {
    const history = [];
    let phase = 0;
    
    for (let t = 0; t < steps; t++) {
        const idx = Math.floor(phase) & 0xFF;  // Mod 256
        const sine = INT_SINE_TABLE[idx];
        history.push({ t, phase: idx, sine, normalized: sine / 127 });
        phase = (phase + frequency) % 256;
    }
    
    return history;
}

const freq = 17;  // Prime frequency for interesting dynamics
const simulation = simulatePhaseAccumulator(freq, 16);

console.log(`   Frequency: ${freq} (phase increment per step)`);
console.log('\n   ┌──────┬───────────┬─────────────┐');
console.log('   │ Step │ Phase Idx │ Sine Output │');
console.log('   ├──────┼───────────┼─────────────┤');

for (const step of simulation) {
    console.log(`   │ ${step.t.toString().padStart(4)} │ ${step.phase.toString().padStart(9)} │ ${step.normalized.toFixed(4).padStart(11)} │`);
}
console.log('   └──────┴───────────┴─────────────┘');

// Histogram coherence
console.log('\n3. Histogram Coherence\n');
console.log('   C_bin(t) = max_k(b_k(t)) / |P|');
console.log('   Measures how concentrated phases are in a single bin.\n');

// Generate random phases and compute coherence
const randomPhases = Array.from({ length: 32 }, () => Math.random() * 2 * Math.PI);
const coherentPhases = Array.from({ length: 32 }, (_, i) => Math.PI + 0.1 * (Math.random() - 0.5));
const bimodalPhases = Array.from({ length: 32 }, (_, i) => 
    i < 16 ? 0.5 + 0.1 * Math.random() : 2.5 + 0.1 * Math.random()
);

const randomCoherence = computeHistogramCoherence(randomPhases);
const coherentCoherence = computeHistogramCoherence(coherentPhases);
const bimodalCoherence = computeHistogramCoherence(bimodalPhases);

console.log('   ┌───────────────────┬────────────┬──────────────┬─────────────┐');
console.log('   │ Distribution      │ Coherence  │ Max Count    │ Entropy     │');
console.log('   ├───────────────────┼────────────┼──────────────┼─────────────┤');
console.log(`   │ Random            │ ${randomCoherence.coherence.toFixed(4).padStart(10)} │ ${randomCoherence.maxCount.toString().padStart(12)} │ ${randomCoherence.entropy.toFixed(4).padStart(11)} │`);
console.log(`   │ Coherent (peaked) │ ${coherentCoherence.coherence.toFixed(4).padStart(10)} │ ${coherentCoherence.maxCount.toString().padStart(12)} │ ${coherentCoherence.entropy.toFixed(4).padStart(11)} │`);
console.log(`   │ Bimodal           │ ${bimodalCoherence.coherence.toFixed(4).padStart(10)} │ ${bimodalCoherence.maxCount.toString().padStart(12)} │ ${bimodalCoherence.entropy.toFixed(4).padStart(11)} │`);
console.log('   └───────────────────┴────────────┴──────────────┴─────────────┘');

// Phase distribution visualization
console.log('\n4. Phase Distribution (ASCII Histogram)\n');

function visualizeHistogram(binCounts, label) {
    const maxCount = Math.max(...binCounts);
    const scale = 40 / maxCount;
    
    console.log(`   ${label}:`);
    for (let i = 0; i < binCounts.length; i++) {
        const bar = '█'.repeat(Math.round(binCounts[i] * scale));
        console.log(`   Bin ${i}: ${bar} (${binCounts[i]})`);
    }
}

console.log('   Random phases:');
const randomHist = randomCoherence.binCounts;
visualizeHistogram(randomHist, 'Random');

console.log('\n   Coherent phases:');
visualizeHistogram(coherentCoherence.binCounts, 'Coherent');

// Application notes
console.log('\n5. Application in Discrete HQE\n');
console.log('   Integer sine tables enable:');
console.log('   • Deterministic phase evolution (no floating-point drift)');
console.log('   • Efficient hardware implementation (lookup tables)');
console.log('   • Reproducible dynamics across nodes');
console.log('   • Histogram coherence for sync detection');

console.log('\n═══════════════════════════════════════════════════════════════\n');