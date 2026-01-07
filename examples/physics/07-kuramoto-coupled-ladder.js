/**
 * Example: Kuramoto-Coupled Primeon Z-Ladder
 * 
 * This example demonstrates the hybrid model combining:
 * - Quantum ladder hopping dynamics
 * - Kuramoto oscillator synchronization on rung phases
 * - Z-flux interpreted as "collapse pressure"
 * 
 * Physics interpretation:
 * - Each rung ψ_n = |ψ_n| e^(iθ_n) has phase θ_n acting as oscillator
 * - Kuramoto coupling promotes phase coherence between rungs
 * - Z-flux accumulation represents decoherence/collapse pressure
 * - When collapse pressure exceeds threshold, measurement triggers
 */

'use strict';

const {
  KuramotoCoupledLadder,
  createKuramotoLadder,
  runCollapsePressureExperiment,
  kuramotoOrderParameter
} = require('../../physics/kuramoto-coupled-ladder');

console.log('═══════════════════════════════════════════════════════════════');
console.log('       Kuramoto-Coupled Primeon Z-Ladder Example');
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================================
// Part 1: Basic Kuramoto-Coupled Ladder
// ============================================================================

console.log('Part 1: Basic Kuramoto-Coupled Ladder');
console.log('─'.repeat(60));

// Create ladder with prime excitations
const ladder = createKuramotoLadder([2, 3, 5, 7], {
  N: 16,
  K: 0.2,               // Kuramoto coupling strength
  J: 0.25,              // Quantum hopping strength
  collapseThreshold: 0.5,
  autoCollapse: false   // Manual collapse for now
});

console.log(`Ladder size: ${ladder.N} rungs`);
console.log(`Kuramoto coupling K: ${ladder.K}`);
console.log(`Collapse threshold: ${ladder.collapseThreshold}`);
console.log();

// Check initial state
const initialSync = ladder.syncMetrics();
console.log('Initial sync metrics:');
console.log(`  Order parameter r: ${initialSync.orderParameter.toFixed(4)}`);
console.log(`  Mean phase ψ: ${initialSync.meanPhase.toFixed(4)}`);
console.log(`  Phase variance: ${initialSync.phaseVariance.toFixed(4)}`);
console.log(`  Collapse pressure: ${initialSync.collapsePressure.toFixed(4)}`);
console.log();

// Evolve with sync tracking
console.log('Evolving ladder for 100 steps...');
const result = ladder.runWithSync(100, 0.01);

console.log(`Final sync metrics:`);
const finalSync = result.syncHistory[result.syncHistory.length - 1];
console.log(`  Order parameter r: ${finalSync.orderParameter.toFixed(4)}`);
console.log(`  Collapse pressure: ${finalSync.collapsePressure.toFixed(4)}`);
console.log(`  Pressure ratio: ${finalSync.pressureRatio.toFixed(4)}`);
console.log();

// ============================================================================
// Part 2: Order Parameter Dynamics
// ============================================================================

console.log('\nPart 2: Order Parameter Dynamics');
console.log('─'.repeat(60));

// Create a new ladder with strong coupling
const strongLadder = new KuramotoCoupledLadder({
  N: 12,
  K: 0.5,  // Strong coupling
  autoCollapse: false
});

// Excite multiple rungs for interesting dynamics
strongLadder.exciteRungs([0, 3, 6, 9], 1);

console.log('Evolving with strong coupling (K=0.5)...');
const strongResult = strongLadder.runWithSync(200, 0.01);

// Sample order parameter at intervals
console.log('\nOrder parameter evolution:');
console.log('  Step    r      Pressure');
console.log('  ────────────────────────');
for (let i = 0; i < 200; i += 20) {
  const s = strongResult.syncHistory[i];
  console.log(`  ${String(i).padStart(4)}   ${s.orderParameter.toFixed(4)}   ${s.collapsePressure.toFixed(4)}`);
}

// ============================================================================
// Part 3: Auto-Collapse Dynamics
// ============================================================================

console.log('\n\nPart 3: Auto-Collapse Dynamics');
console.log('─'.repeat(60));

const autoLadder = new KuramotoCoupledLadder({
  N: 16,
  K: 0.2,
  collapseThreshold: 0.3,  // Lower threshold for more collapses
  collapseDecay: 0.05,
  autoCollapse: true        // Enable auto-collapse
});

autoLadder.exciteRung(0);

console.log('Evolving with auto-collapse enabled...');
console.log(`Collapse threshold: ${autoLadder.collapseThreshold}`);
console.log();

// Run and watch for collapses
autoLadder.run(300, 0.01);

const dynamics = autoLadder.collapseDynamics();
console.log(`Total collapses: ${dynamics.totalCollapses}`);
console.log();

if (autoLadder.collapseEvents.length > 0) {
  console.log('Collapse events:');
  console.log('  Time     Step    Outcome   Pressure   Order');
  console.log('  ────────────────────────────────────────────');
  autoLadder.collapseEvents.slice(0, 10).forEach(event => {
    console.log(`  ${event.t.toFixed(4)}   ${String(event.step).padStart(4)}      ${event.outcome}       ${event.pressure.toFixed(4)}    ${event.orderBefore.toFixed(4)}`);
  });
}

// ============================================================================
// Part 4: Synchronization Transition Detection
// ============================================================================

console.log('\n\nPart 4: Synchronization Transition Detection');
console.log('─'.repeat(60));

const transitionLadder = new KuramotoCoupledLadder({
  N: 12,
  K: 0.4,  // Moderately strong coupling
  autoCollapse: false
});

// Start with distributed excitations
transitionLadder.exciteRungs([0, 2, 4, 6, 8, 10], 0.5);

// Run to build history
transitionLadder.run(150, 0.01);

// Check for sync transition
const detection = transitionLadder.detectSyncTransition(50);

console.log('Transition detection results:');
if (detection.detected) {
  console.log(`  Transition detected: ${detection.direction}`);
  console.log(`  Early r: ${detection.earlyR.toFixed(4)}`);
  console.log(`  Late r: ${detection.lateR.toFixed(4)}`);
  console.log(`  Change: ${detection.change.toFixed(4)}`);
} else {
  console.log(`  No significant transition detected`);
  console.log(`  Early r: ${detection.earlyR?.toFixed(4) || 'N/A'}`);
  console.log(`  Late r: ${detection.lateR?.toFixed(4) || 'N/A'}`);
}

// ============================================================================
// Part 5: Collapse Pressure Experiment
// ============================================================================

console.log('\n\nPart 5: Collapse Pressure Experiment');
console.log('─'.repeat(60));

console.log('Running collapse pressure experiment...');

const experiment = runCollapsePressureExperiment({
  N: 16,
  primes: [2, 3, 5, 7, 11],
  K: 0.15,
  collapseThreshold: 0.4,
  maxSteps: 500
});

console.log('\nExperiment results:');
console.log(`  Total steps: ${experiment.trajectory.length * 10}`);
console.log(`  Total collapses: ${experiment.collapses.length}`);
console.log();

console.log('Trajectory samples:');
console.log('  Step    Order    Pressure   Entropy');
console.log('  ──────────────────────────────────────');
experiment.trajectory.slice(0, 10).forEach(snap => {
  console.log(`  ${String(snap.step).padStart(4)}    ${snap.orderParameter.toFixed(4)}   ${snap.collapsePressure.toFixed(4)}    ${snap.entropy.toFixed(4)}`);
});

console.log('\nSync transition:', experiment.syncTransition.detected 
  ? experiment.syncTransition.direction 
  : 'none detected');

// ============================================================================
// Part 6: Comparing Coupling Strengths
// ============================================================================

console.log('\n\nPart 6: Comparing Coupling Strengths');
console.log('─'.repeat(60));

const couplings = [0.05, 0.1, 0.2, 0.5, 1.0];
console.log('Coupling strength vs. final order parameter:');
console.log();
console.log('  K      Order    Avg Pressure');
console.log('  ─────────────────────────────');

couplings.forEach(K => {
  const testLadder = new KuramotoCoupledLadder({
    N: 8,
    K,
    autoCollapse: false
  });
  
  testLadder.exciteRungs([0, 2, 4, 6], 1);
  const testResult = testLadder.runWithSync(100, 0.01);
  
  const avgOrder = testResult.syncHistory.reduce((a, s) => a + s.orderParameter, 0) / 100;
  const avgPressure = testResult.syncHistory.reduce((a, s) => a + s.collapsePressure, 0) / 100;
  
  console.log(`  ${K.toFixed(2)}    ${avgOrder.toFixed(4)}      ${avgPressure.toFixed(4)}`);
});

// ============================================================================
// Part 7: Understanding the kuramotoOrderParameter Helper
// ============================================================================

console.log('\n\nPart 7: Understanding Order Parameter');
console.log('─'.repeat(60));

// Demonstration of the order parameter concept
console.log('Order parameter r = |⟨e^(iθ)⟩| measures phase coherence:');
console.log();

// Fully synchronized phases
const syncedPhases = [0, 0, 0, 0];
const syncedR = kuramotoOrderParameter(syncedPhases);
console.log(`  Synchronized (all θ=0): r = ${syncedR.r.toFixed(4)}`);

// Uniformly distributed phases
const uniformPhases = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
const uniformR = kuramotoOrderParameter(uniformPhases);
console.log(`  Uniform distribution:   r = ${uniformR.r.toFixed(4)}`);

// Partially synchronized
const partialPhases = [0, 0.1, 0.2, 0.3];
const partialR = kuramotoOrderParameter(partialPhases);
console.log(`  Partially synchronized: r = ${partialR.r.toFixed(4)}`);

// Random phases
const randomPhases = Array.from({length: 8}, () => Math.random() * 2 * Math.PI);
const randomR = kuramotoOrderParameter(randomPhases);
console.log(`  Random phases:          r = ${randomR.r.toFixed(4)}`);

// ============================================================================
// Summary
// ============================================================================

console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('                         Summary');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`
Key insights from Kuramoto-Coupled Ladder:

1. PHASE SYNCHRONIZATION
   - Kuramoto coupling (K) drives rung phases toward coherence
   - Order parameter r ∈ [0,1] measures global synchronization
   - r → 1 means quantum coherence preserved

2. COLLAPSE PRESSURE
   - Z-flux accumulation represents decoherence pressure
   - When pressure exceeds threshold, measurement triggers
   - Collapse resets pressure to 0

3. PRIME-BASED FREQUENCIES
   - Natural frequencies derived from log of primes
   - Creates interesting beating and resonance patterns

4. HYBRID DYNAMICS
   - Quantum hopping (J) enables amplitude transfer
   - Kuramoto coupling (K) promotes phase alignment
   - Together they create rich dynamical behavior

5. APPLICATIONS
   - Model of quantum coherence vs. decoherence
   - Synchronization in prime-labeled systems
   - Threshold-based collapse mechanics
`);

console.log('Example complete!');