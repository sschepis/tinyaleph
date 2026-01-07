/**
 * @example Primeon Z-Ladder Dynamics
 * @description Simulate quantum ladder evolution with Z-sector closure
 * 
 * This example demonstrates the PrimeonZLadderU model, which provides:
 * - A discrete ladder of quantum states (rungs)
 * - Nearest-neighbor hopping dynamics (discrete Schrödinger)
 * - Explicit Z-sector for tracking "leaked" amplitude (closure channel)
 * - Entropy and coherence metrics throughout evolution
 * 
 * The Z-sector captures "what leaks out" during evolution, making
 * closure and measurement explicit rather than implicit.
 */

const { 
  PrimeonZLadderU, 
  createPrimeonLadder,
  shannonEntropyNats 
} = require('../../physics');

// ===========================================
// SETUP
// ===========================================

// Create a 16-rung ladder with standard parameters
const ladder = new PrimeonZLadderU({
  N: 16,           // 16 ladder rungs
  d: 1,            // 1 internal dimension per rung
  dz: 1,           // 1 Z-sector dimension per rung
  J: 0.25,         // Nearest-neighbor coupling strength
  leak: 0.05,      // 5% amplitude leaks to Z each step
  closeZ: true,    // Project out Z each step (closure)
  periodic: true   // Periodic boundary (ring topology)
});

// ===========================================
// EXAMPLE 1: SINGLE RUNG EXCITATION
// ===========================================

console.log('Primeon Z-Ladder Example');
console.log('========================\n');

console.log('--- Example 1: Single Rung Excitation ---\n');

// Excite rung 0 with unit amplitude
ladder.exciteRung(0);

console.log('Initial state: excited rung 0');
console.log('Running 100 time steps (dt=0.01)...\n');

// Run evolution and collect trajectory
const trajectory1 = [];
for (let i = 0; i < 100; i++) {
  const m = ladder.step(0.01);
  if (i % 20 === 0) {
    trajectory1.push({ step: i, ...m });
  }
}
trajectory1.push({ step: 100, ...ladder.metrics() });

console.log('Evolution trajectory:');
console.log('Step | Coherence | Entropy | Z-Flux (total)');
console.log('-----|-----------|---------|---------------');
for (const t of trajectory1) {
  console.log(
    `${String(t.step).padStart(4)} | ${t.coherence.toFixed(4)}    | ${t.entropy.toFixed(4)}  | ${t.zFluxTotal.toFixed(6)}`
  );
}

// Show rung probability distribution
console.log('\nFinal rung probabilities (first 8):');
const probs = ladder.rungProbabilities();
for (let i = 0; i < 8; i++) {
  const bar = '█'.repeat(Math.floor(probs[i] * 40));
  console.log(`  Rung ${i}: ${probs[i].toFixed(4)} ${bar}`);
}

// ===========================================
// EXAMPLE 2: PRIME-BASED EXCITATION
// ===========================================

console.log('\n--- Example 2: Prime-Based Excitation ---\n');

// Reset and excite with primes
ladder.reset();
const primes = [2, 3, 5, 7, 11, 13];
ladder.excitePrimes(primes, 1.0);

console.log(`Excited rungs from primes [${primes.join(', ')}]`);
console.log('(Each prime p maps to rung p mod N)\n');

// Run evolution
const trajectory2 = ladder.run(200, 0.01);

console.log('After 200 steps:');
const final2 = ladder.metrics();
console.log(`  Coherence: ${final2.coherence.toFixed(4)}`);
console.log(`  Entropy: ${final2.entropy.toFixed(4)}`);
console.log(`  Order parameter: ${final2.orderParameter.toFixed(4)}`);
console.log(`  Total Z-flux: ${final2.zFluxTotal.toFixed(6)}`);

// ===========================================
// EXAMPLE 3: FACTORY FUNCTION
// ===========================================

console.log('\n--- Example 3: Factory Function ---\n');

// Use the factory for quick setup
const twinPrimes = [3, 5, 11, 13, 17, 19, 29, 31];
const primeLadder = createPrimeonLadder(twinPrimes, {
  N: 32,
  J: 0.3,
  leak: 0.02
});

console.log(`Created 32-rung ladder excited by twin primes`);
console.log(`Primes: [${twinPrimes.join(', ')}]`);

// Evolve and track
const entropyHistory = [];
for (let i = 0; i < 300; i++) {
  const m = primeLadder.step(0.01);
  if (i % 50 === 0) {
    entropyHistory.push({ step: i, entropy: m.entropy, coherence: m.coherence });
  }
}

console.log('\nEntropy over time:');
for (const h of entropyHistory) {
  const bar = '▓'.repeat(Math.floor(h.entropy * 10));
  console.log(`  Step ${String(h.step).padStart(3)}: ${h.entropy.toFixed(3)} ${bar}`);
}

// ===========================================
// EXAMPLE 4: MEASUREMENT
// ===========================================

console.log('\n--- Example 4: Quantum Measurement ---\n');

// Create fresh ladder
const measureLadder = new PrimeonZLadderU({ N: 8, J: 0.2, leak: 0.1 });
measureLadder.excitePrimes([2, 3, 5, 7], 1.0);

// Evolve a bit
measureLadder.run(50, 0.01);

console.log('Pre-measurement state:');
const preMeasure = measureLadder.metrics();
console.log(`  Entropy: ${preMeasure.entropy.toFixed(4)}`);
console.log(`  Coherence: ${preMeasure.coherence.toFixed(4)}`);

// Perform measurement
const measurement = measureLadder.measure();
console.log(`\nMeasurement collapsed to rung ${measurement.outcome}`);
console.log(`  Probability of outcome: ${measurement.probability.toFixed(4)}`);

console.log('\nPost-measurement state:');
console.log(`  Entropy: ${measurement.metricsAfter.entropy.toFixed(4)}`);
console.log(`  Coherence: ${measurement.metricsAfter.coherence.toFixed(4)}`);

// ===========================================
// EXAMPLE 5: SNAPSHOT & RESTORE
// ===========================================

console.log('\n--- Example 5: Snapshot & Restore ---\n');

// Create and evolve
const snapLadder = new PrimeonZLadderU({ N: 4, J: 0.25, leak: 0.05 });
snapLadder.exciteRung(0);
snapLadder.run(50, 0.01);

// Take snapshot
const snapshot = snapLadder.snapshot();
console.log('Snapshot taken at step', snapshot.stepCount);
console.log('  t =', snapshot.t.toFixed(4));
console.log('  coherence =', snapshot.coherence.toFixed(4));

// Continue evolution
snapLadder.run(100, 0.01);
console.log('\nAfter 100 more steps:');
console.log('  coherence =', snapLadder.metrics().coherence.toFixed(4));

// Restore snapshot
snapLadder.restore(snapshot);
console.log('\nRestored to snapshot:');
console.log('  coherence =', snapLadder.metrics().coherence.toFixed(4));

// ===========================================
// EXAMPLE 6: COMPARING CLOSURE MODES
// ===========================================

console.log('\n--- Example 6: Closure Mode Comparison ---\n');

// With Z-closure (project out each step)
const closedLadder = new PrimeonZLadderU({ 
  N: 8, J: 0.25, leak: 0.1, closeZ: true 
});
closedLadder.excitePrimes([2, 3, 5], 1.0);

// Without Z-closure (Z accumulates as memory)
const openLadder = new PrimeonZLadderU({ 
  N: 8, J: 0.25, leak: 0.1, closeZ: false 
});
openLadder.excitePrimes([2, 3, 5], 1.0);

console.log('Comparing closeZ=true vs closeZ=false (Z as memory):');
console.log('\nStep | Closed Z-flux | Open Z-flux | Closed H | Open H');
console.log('-----|---------------|-------------|----------|--------');

for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 20; j++) {
    closedLadder.step(0.01);
    openLadder.step(0.01);
  }
  const cm = closedLadder.metrics();
  const om = openLadder.metrics();
  console.log(
    `${String((i + 1) * 20).padStart(4)} | ${cm.zFluxTotal.toFixed(6).padStart(13)} | ${om.zFluxTotal.toFixed(6).padStart(11)} | ${cm.entropy.toFixed(4).padStart(8)} | ${om.entropy.toFixed(4)}`
  );
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n==============================');
console.log('KEY TAKEAWAYS:');
console.log('1. PrimeonZLadderU simulates a quantum ladder with explicit Z-sector');
console.log('2. Z-flux tracks amplitude "leaking" from core to closure channel');
console.log('3. Entropy decreases indicate convergence/coherence buildup');
console.log('4. closeZ=true projects out Z (traditional); closeZ=false keeps Z as memory');
console.log('5. Primes map deterministically to rungs via mod N for resonance patterns');
console.log('6. Measurement samples and collapses to a single rung');