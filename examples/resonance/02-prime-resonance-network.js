/**
 * Example: Prime Resonance Network (PRN)
 * 
 * Demonstrates the network components from the PRNS specification:
 * - Prime Resonance Identity (PRI) = (P_G, P_E, P_Q)
 * - Phase-Locked Prime Rings
 * - Holographic Memory Fields
 * - Entangled Nodes
 * - Resonant Fragments
 */

const {
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  PrimeState,
  PHI,
  DELTA_S
} = require('../../modular');

console.log('═══════════════════════════════════════════════════════════════');
console.log('         PRIME RESONANCE NETWORK DEMONSTRATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Prime Resonance Identity (PRI)
console.log('1. PRIME RESONANCE IDENTITY (PRI)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('PRI = (P_G, P_E, P_Q) - Gaussian, Eisenstein, Quaternionic primes');

const priAlpha = PrimeResonanceIdentity.fromSeed(42);
const priBeta = PrimeResonanceIdentity.random();

console.log('\nNode Alpha PRI:');
console.log('  Gaussian:', priAlpha.gaussian.toString());
console.log('  Eisenstein:', priAlpha.eisenstein.toString());
console.log('  Quaternion:', priAlpha.quaternion.toString());
console.log('  Signature:', priAlpha.signature);

console.log('\nNode Beta PRI:');
console.log('  Signature:', priBeta.signature);

const strength = priAlpha.entanglementStrength(priBeta);
console.log('\nEntanglement strength α↔β:', strength.toFixed(4));

// 2. Phase-Locked Prime Rings
console.log('\n2. PHASE-LOCKED PRIME RINGS');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Using irrational phase locks: 2π/φ, 2π/√2');
console.log('φ (golden ratio):', PHI.toFixed(6));
console.log('δS (√2):', DELTA_S.toFixed(6));

const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
const ring = new PhaseLockedRing(primes, 'phi');

console.log('\nInitial phases (scaled by 1/π):');
for (let i = 0; i < 5; i++) {
  console.log(`  Phase[${primes[i]}]: ${(ring.phases[i] / Math.PI).toFixed(4)}π`);
}

console.log('\nInitial order parameter:', ring.orderParameter().toFixed(4));

// Evolve the ring
for (let i = 0; i < 200; i++) {
  ring.tick(0.05);
}

console.log('After 200 ticks:');
console.log('  Order parameter:', ring.orderParameter().toFixed(4));
console.log('  Mean phase:', (ring.meanPhase() / Math.PI).toFixed(4) + 'π');
console.log('  Synchronization:', ring.synchronization().toFixed(4));

// 3. Holographic Memory Field
console.log('\n3. HOLOGRAPHIC MEMORY FIELD');
console.log('─────────────────────────────────────────────────────────────────');
console.log('I(x,y) = Σ A_p e^(-S(x,y)) e^(ipθ)');

const field = new HolographicField(64, 64);

// Encode multiple memory fragments at different locations
const memories = [
  { state: PrimeState.basis(7), x: 20, y: 20 },
  { state: PrimeState.basis(11), x: 44, y: 20 },
  { state: PrimeState.basis(13), x: 32, y: 44 }
];

for (const mem of memories) {
  field.encodeState(mem.state, mem.x, mem.y);
}

console.log('\nEncoded 3 memory fragments:');
console.log('  |7⟩ at (20, 20)');
console.log('  |11⟩ at (44, 20)');
console.log('  |13⟩ at (32, 44)');

console.log('\nField statistics:');
console.log('  Max intensity:', field.maxIntensity().toFixed(4));

const peaks = field.findPeaks(0.5);
console.log('  Peaks found:', peaks.length);

for (const peak of peaks.slice(0, 3)) {
  console.log(`    Peak at (${peak.x}, ${peak.y}): intensity=${peak.intensity.toFixed(4)}`);
}

// Decode from a location
const decoded = field.decodeAt(20, 20, 5);
console.log('\nDecoded from (20, 20):');
for (const { p, amp } of decoded.dominant(3)) {
  console.log(`  |${p}⟩: ${amp.toFixed(4)}`);
}

// 4. Entangled Nodes
console.log('\n4. ENTANGLED NODES');
console.log('─────────────────────────────────────────────────────────────────');

const nodeA = new EntangledNode('observer-1');
const nodeB = new EntangledNode('observer-2');
const nodeC = new EntangledNode('observer-3');

console.log('Created nodes: observer-1, observer-2, observer-3');

// Establish entanglements
const strengthAB = nodeA.entangleWith(nodeB);
const strengthBC = nodeB.entangleWith(nodeC);
const strengthAC = nodeA.entangleWith(nodeC);

console.log('\nEntanglement network:');
console.log('  observer-1 ↔ observer-2:', strengthAB.toFixed(4));
console.log('  observer-2 ↔ observer-3:', strengthBC.toFixed(4));
console.log('  observer-1 ↔ observer-3:', strengthAC.toFixed(4));

// Store memory in node A
const thoughtState = PrimeState.uniform().scale({ re: 0.5, im: 0.5 });
nodeA.storeMemory(thoughtState, 16, 16);

console.log('\nStored memory in observer-1');
console.log('  Holographic field intensity:', nodeA.holographicMemory.maxIntensity().toFixed(4));

// Evolve nodes
for (let i = 0; i < 50; i++) {
  nodeA.tick(0.1);
  nodeB.tick(0.1);
  nodeC.tick(0.1);
}

console.log('\nAfter 50 ticks:');
console.log('  observer-1 coherence:', nodeA.coherence.toFixed(4));
console.log('  observer-2 coherence:', nodeB.coherence.toFixed(4));
console.log('  observer-3 coherence:', nodeC.coherence.toFixed(4));

console.log('\nNode stability:');
console.log('  observer-1 stable:', nodeA.isStable() ? 'YES' : 'NO');
console.log('  observer-2 stable:', nodeB.isStable() ? 'YES' : 'NO');

// 5. Resonant Fragments
console.log('\n5. RESONANT FRAGMENTS');
console.log('─────────────────────────────────────────────────────────────────');

const fragmentA = ResonantFragment.fromText('truth and wisdom');
const fragmentB = ResonantFragment.fromText('love and beauty');

console.log('Fragment A: "truth and wisdom"');
console.log('  Entropy:', fragmentA.entropy.toFixed(4));
console.log('  Dominant primes:', fragmentA.dominant(3).map(d => d.p).join(', '));

console.log('\nFragment B: "love and beauty"');
console.log('  Entropy:', fragmentB.entropy.toFixed(4));
console.log('  Dominant primes:', fragmentB.dominant(3).map(d => d.p).join(', '));

// Tensor product
const combined = fragmentA.tensorWith(fragmentB);
console.log('\nTensor product A ⊗ B:');
console.log('  Combined dominant primes:', combined.dominant(3).map(d => d.p).join(', '));

// Coherence
const coherence = fragmentA.coherenceWith(fragmentB);
console.log('\nCoherence(A, B):', coherence.toFixed(4));

// Phase rotation
const rotated = fragmentA.rotatePhase(Math.PI / 4);
console.log('\nAfter π/4 phase rotation:');
console.log('  Coherence with original:', fragmentA.coherenceWith(rotated).toFixed(4));

// 6. Memory Teleportation Scenario
console.log('\n6. MEMORY TELEPORTATION SCENARIO');
console.log('─────────────────────────────────────────────────────────────────');

const sender = new EntangledNode('sender');
const receiver = new EntangledNode('receiver');

// Establish entanglement
const entStrength = sender.entangleWith(receiver);
console.log('Entanglement established:', entStrength.toFixed(4));

// Create memory to teleport
const memoryFragment = ResonantFragment.fromText('the secret of existence');
console.log('Memory to teleport: "the secret of existence"');
console.log('  Dominant primes:', memoryFragment.dominant(3).map(d => d.p).join(', '));

// Store in sender's holographic field
sender.storeMemory(memoryFragment.state, 16, 16);

// Simulate teleportation (in a real implementation, this would involve
// the Memory Teleportation Protocol from PRNS)
console.log('\nSimulating teleportation...');

// Transfer the memory pattern to receiver (conceptually)
receiver.holographicMemory.encodeState(memoryFragment.state, 16, 16);

// Verify transfer
const retrieved = receiver.holographicMemory.decodeAt(16, 16, 5);
console.log('\nRetrieved from receiver:');
for (const { p, amp } of retrieved.dominant(3)) {
  console.log(`  |${p}⟩: ${amp.toFixed(4)}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    DEMONSTRATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');