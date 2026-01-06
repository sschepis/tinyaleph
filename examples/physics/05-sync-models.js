/**
 * @example Extended Synchronization Models
 * @description Demonstrates the advanced synchronization models
 * 
 * Models covered:
 * - NetworkKuramoto: Topology-aware coupling
 * - AdaptiveKuramoto: Hebbian plasticity
 * - SakaguchiKuramoto: Phase frustration & chimera states
 * - SmallWorldKuramoto: Watts-Strogatz topology
 * - MultiSystemCoupling: Cross-system synchronization
 */

console.log('TinyAleph Extended Synchronization Models');
console.log('==========================================\n');

const { firstNPrimes, primeToFrequency } = require('../../core/prime');
const {
  KuramotoModel,
  NetworkKuramoto,
  AdaptiveKuramoto,
  SakaguchiKuramoto,
  SmallWorldKuramoto,
  MultiSystemCoupling,
  createHierarchicalCoupling,
  createPeerCoupling
} = require('../../physics');

// Generate prime-based frequencies
const primes = firstNPrimes(20);
const frequencies = primes.map(p => primeToFrequency(p));

console.log('Using', primes.length, 'prime-based oscillator frequencies\n');

// ===========================================
// 1. NETWORK KURAMOTO
// ===========================================

console.log('='.repeat(60));
console.log('1. NetworkKuramoto - Topology-Aware Coupling');
console.log('='.repeat(60) + '\n');

console.log('Instead of all-to-all coupling, uses adjacency matrix.');
console.log('Enables modular synchronization.\n');

// Create with custom adjacency (two clusters)
const N = 10;
const clusterAdj = Array(N).fill(null).map(() => Array(N).fill(0));

// Cluster 1: indices 0-4
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 5; j++) {
    if (i !== j) clusterAdj[i][j] = 1;
  }
}

// Cluster 2: indices 5-9
for (let i = 5; i < 10; i++) {
  for (let j = 5; j < 10; j++) {
    if (i !== j) clusterAdj[i][j] = 1;
  }
}

// Weak inter-cluster link
clusterAdj[4][5] = 0.2;
clusterAdj[5][4] = 0.2;

const networkModel = new NetworkKuramoto(frequencies.slice(0, 10), clusterAdj, 0.5);

// Excite cluster 1
for (let i = 0; i < 5; i++) {
  networkModel.oscillators[i].excite(0.8);
}

console.log('Two-cluster network with weak bridge link:');
console.log('  Cluster 1 (0-4): fully connected, excited');
console.log('  Cluster 2 (5-9): fully connected, quiescent');
console.log('  Bridge: 4-5 with weight 0.2\n');

// Evolve and track
for (let step = 0; step < 500; step++) {
  networkModel.tick(0.05);
}

const clusters = networkModel.findClusters(0.5);
console.log('Found', clusters.length, 'synchronized cluster(s):');
clusters.forEach((c, i) => console.log(`  Cluster ${i+1}: oscillators [${c.join(', ')}]`));
console.log('Order parameter:', networkModel.orderParameter().toFixed(3));
console.log('Avg clustering coefficient:', networkModel.averageClustering().toFixed(3));

// ===========================================
// 2. ADAPTIVE KURAMOTO
// ===========================================

console.log('\n' + '='.repeat(60));
console.log('2. AdaptiveKuramoto - Hebbian Plasticity');
console.log('='.repeat(60) + '\n');

console.log('Coupling strengths evolve: dKij/dt = ε(cos(θj-θi) - Kij)');
console.log('"Concepts that sync together link together"\n');

const adaptiveModel = new AdaptiveKuramoto(frequencies.slice(0, 8), 0.2, 0.02);

// Excite some oscillators
adaptiveModel.oscillators[0].excite(0.9);
adaptiveModel.oscillators[1].excite(0.9);
adaptiveModel.oscillators[2].excite(0.9);
adaptiveModel.oscillators[5].excite(0.5);

console.log('Initial total coupling:', adaptiveModel.totalCoupling().toFixed(2));

// Evolve
for (let step = 0; step < 1000; step++) {
  adaptiveModel.tick(0.05);
  if (step % 250 === 249) {
    adaptiveModel.recordCouplingHistory();
  }
}

console.log('Final total coupling:', adaptiveModel.totalCoupling().toFixed(2));
console.log('Order parameter:', adaptiveModel.orderParameter().toFixed(3));

// Show coupling between synchronized pair vs non-synced
const K_01 = adaptiveModel.adjacency[0][1];
const K_07 = adaptiveModel.adjacency[0][7];
console.log('\nCoupling evolution:');
console.log(`  K(0,1) synced pair: ${K_01.toFixed(3)} (should be stronger)`);
console.log(`  K(0,7) unsynced pair: ${K_07.toFixed(3)} (should be weaker)`);

// ===========================================
// 3. SAKAGUCHI-KURAMOTO
// ===========================================

console.log('\n' + '='.repeat(60));
console.log('3. SakaguchiKuramoto - Phase Frustration');
console.log('='.repeat(60) + '\n');

console.log('Adds phase lag α: dθi/dt = ω + K sin(θj - θi - α)');
console.log('Creates chimera states (partial synchronization)\n');

console.log('Phase lag α   Order r   Chimera%  State');
console.log('-'.repeat(50));

const alphaValues = [0, 0.3, 0.6, 0.9, 1.2, Math.PI/2];

for (const alpha of alphaValues) {
  const sakModel = new SakaguchiKuramoto(frequencies.slice(0, 12), 1.5, alpha);
  
  // Excite all
  for (const osc of sakModel.oscillators) {
    osc.excite(0.7);
  }
  
  // Evolve
  for (let step = 0; step < 800; step++) {
    sakModel.tick(0.05);
  }
  
  const r = sakModel.orderParameter();
  const chimera = sakModel.chimeraRatio();
  const state = sakModel.classifyState();
  
  console.log(`α = ${alpha.toFixed(2).padStart(4)}      ${r.toFixed(3)}     ${(chimera*100).toFixed(0).padStart(3)}%      ${state}`);
}

// ===========================================
// 4. SMALL-WORLD KURAMOTO
// ===========================================

console.log('\n' + '='.repeat(60));
console.log('4. SmallWorldKuramoto - Watts-Strogatz Topology');
console.log('='.repeat(60) + '\n');

console.log('Rewiring probability p: 0=ring, 1=random');
console.log('Small-world: high clustering + short path lengths\n');

console.log('p      Clustering  Avg Path  σ (small-world)  Order r');
console.log('-'.repeat(60));

const pValues = [0, 0.05, 0.1, 0.2, 0.5, 1.0];

for (const p of pValues) {
  const swModel = new SmallWorldKuramoto(frequencies.slice(0, 16), 4, p, 0.5);
  
  // Excite
  for (const osc of swModel.oscillators) {
    osc.excite(0.6);
  }
  
  // Evolve
  for (let step = 0; step < 600; step++) {
    swModel.tick(0.05);
  }
  
  const C = swModel.averageClustering();
  const L = swModel.averagePathLength();
  const sigma = swModel.smallWorldCoefficient();
  const r = swModel.orderParameter();
  
  console.log(`${p.toFixed(2)}   ${C.toFixed(3)}       ${L.toFixed(2)}      ${sigma.toFixed(2).padStart(5)}            ${r.toFixed(3)}`);
}

// ===========================================
// 5. MULTI-SYSTEM COUPLING
// ===========================================

console.log('\n' + '='.repeat(60));
console.log('5. MultiSystemCoupling - Cross-System Synchronization');
console.log('='.repeat(60) + '\n');

console.log('Multiple Kuramoto systems coupled via their mean fields.');
console.log('Models multi-agent alignment or hierarchical organization.\n');

// Create three peer systems
const system1 = new KuramotoModel(frequencies.slice(0, 8), 0.4);
const system2 = new KuramotoModel(frequencies.slice(0, 8), 0.4);
const system3 = new KuramotoModel(frequencies.slice(0, 8), 0.4);

const multiSystem = new MultiSystemCoupling([system1, system2, system3]);

// Excite different concepts in each system
for (let i = 0; i < 4; i++) system1.oscillators[i].excite(0.8);
for (let i = 2; i < 6; i++) system2.oscillators[i].excite(0.8);
for (let i = 4; i < 8; i++) system3.oscillators[i].excite(0.8);

console.log('Three peer systems with overlapping excitations:');
console.log('  System 1: primes 0-3 excited');
console.log('  System 2: primes 2-5 excited');
console.log('  System 3: primes 4-7 excited\n');

// Evolve
for (let step = 0; step < 800; step++) {
  multiSystem.tick(0.05);
}

const state = multiSystem.getState();
console.log('Final state:');
console.log('  Individual order parameters:');
state.orderParameters.forEach((op, i) => 
  console.log(`    System ${i+1}: r=${op.r.toFixed(3)}, ψ=${op.psi.toFixed(2)}`));
console.log('  Global order:', state.globalOrder.toFixed(3));

console.log('\n  Inter-system coherence matrix:');
const coh = state.interSystemCoherence;
console.log('       S1     S2     S3');
for (let i = 0; i < 3; i++) {
  console.log(`  S${i+1}  ${coh[i].map(c => c.toFixed(2).padStart(5)).join('  ')}`);
}

// ===========================================
// 6. HIERARCHICAL COUPLING
// ===========================================

console.log('\n' + '='.repeat(60));
console.log('6. Hierarchical Multi-System Coupling');
console.log('='.repeat(60) + '\n');

console.log('Bottom-up coupling: lower levels drive higher levels.\n');

const hierarchy = createHierarchicalCoupling(frequencies, 3, 8);

// Excite at bottom level
for (let i = 0; i < 4; i++) {
  hierarchy.systems[0].oscillators[i].excite(0.9);
}

console.log('Excitation at level 0 propagating upward...\n');

// Evolve
console.log('Step    L0 order   L1 order   L2 order   Global');
console.log('-'.repeat(50));

for (let step = 0; step <= 1000; step++) {
  if (step % 250 === 0) {
    const ops = hierarchy.orderParameters();
    const global = hierarchy.globalOrderParameter();
    console.log(`${step.toString().padStart(4)}    ${ops[0].r.toFixed(3)}      ${ops[1].r.toFixed(3)}      ${ops[2].r.toFixed(3)}      ${global.toFixed(3)}`);
  }
  if (step < 1000) {
    hierarchy.tick(0.05);
  }
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(60));
console.log('KEY TAKEAWAYS:');
console.log('='.repeat(60));
console.log('');
console.log('1. NetworkKuramoto: Respects semantic topology from entanglement graph');
console.log('2. AdaptiveKuramoto: Self-organizing memory via Hebbian learning');
console.log('3. SakaguchiKuramoto: Chimera states model cognitive dissonance');
console.log('4. SmallWorldKuramoto: Balance between local clusters and global reach');
console.log('5. MultiSystemCoupling: Multi-agent or hierarchical organization');
console.log('6. All models extend KuramotoModel and integrate with existing physics');
console.log('');
console.log('Usage: const { NetworkKuramoto, ... } = require("tinyaleph/physics");');