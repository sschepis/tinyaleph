/**
 * book.pdf Chapter 8: Non-Local Communication Demo
 * 
 * Demonstrates:
 * - Bell-like prime entanglement: |Ψ_AB⟩ = 1/√2(|p⟩_A|q⟩_B + e^(iθ)|q⟩_A|p⟩_B)
 * - Resonance stability function: Ξ(p,q) = R(p,q)·e^(-ΔS)·δ_basin
 * - Golden/Silver ratio channel selection
 * - Symbolic entanglement communication protocol
 * - CHSH Bell inequality test
 */

import { firstNPrimes } from '../core/prime.js';
import { PHI } from '../core/hilbert.js';
import {
  SILVER_RATIO,
  PrimeEntangledPair,
  ResonanceStability,
  GoldenChannel,
  SilverChannel,
  SymbolicEntanglementComm,
  EntanglementWitness
} from '../core/nonlocal.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  book.pdf Chapter 8: Non-Local Communication Demo');
console.log('═══════════════════════════════════════════════════════════════\n');

// ==========================================================================
// 1. Prime Entangled Pairs
// ==========================================================================
console.log('1. Bell-like Prime Entanglement');
console.log('   |Ψ_AB⟩ = 1/√2 (|p⟩_A|q⟩_B + e^(iθ)|q⟩_A|p⟩_B)\n');

// Create entangled pair with primes 3 and 5
const pair = new PrimeEntangledPair(3, 5);
console.log(`   Entangled primes: ${pair.p}, ${pair.q}`);
console.log(`   Phase θ_pq: ${pair.phase.toFixed(4)} rad`);
console.log(`   Is entangled: ${pair.isEntangled()}`);

// Show initial states
console.log('\n   Initial superposition:');
console.log(`   State A: |${pair.p}⟩ + e^(iθ)|${pair.q}⟩`);
console.log(`   State B: |${pair.q}⟩ + e^(iθ)|${pair.p}⟩`);

// ==========================================================================
// 2. Measurement and Collapse
// ==========================================================================
console.log('\n\n2. Measurement and Non-Local Correlation');
console.log('   Measure A → correlates B\n');

pair.reset();
for (let i = 0; i < 5; i++) {
  pair.reset();
  const resultA = pair.measureA();
  console.log(`   Trial ${i + 1}: A collapsed to |${resultA.collapsedPrime}⟩ → B: |${resultA.correlatedPrime}⟩`);
}

// ==========================================================================
// 3. Resonance Stability Function
// ==========================================================================
console.log('\n\n3. Resonance Stability Function: Ξ(p,q) = R(p,q)·e^(-ΔS)·δ_basin');
console.log('   Measures stability of non-local coherence\n');

const stability = new ResonanceStability();
const primes = firstNPrimes(10);

console.log('   Prime pair stabilities:');
const stablePairs = stability.findStablePairs(primes, 5);
for (const sp of stablePairs) {
  console.log(`      (${sp.p}, ${sp.q}): Ξ = ${sp.stability.toFixed(4)}, ratio = ${sp.ratio.toFixed(3)}`);
}

// Components of stability function
console.log('\n   Stability components for (3, 5):');
console.log(`      R(3,5) = ${stability.primeResonance(3, 5).toFixed(4)} (prime resonance)`);
console.log(`      Basin factor = ${stability.sameBasin(3, 5).toFixed(4)}`);

// ==========================================================================
// 4. Golden Ratio Channel Selection
// ==========================================================================
console.log('\n\n4. Golden Ratio Channel Selection');
console.log(`   φ = ${PHI.toFixed(6)} (golden ratio)`);
console.log('   Find prime pairs with q/p ≈ φ\n');

const goldenSelector = new GoldenChannel(0.15);
const goldenPair = goldenSelector.select(primes);

console.log('   Best golden pair:');
console.log(`      p = ${goldenPair.p}, q = ${goldenPair.q}`);
console.log(`      Ratio: ${goldenPair.ratio.toFixed(6)}`);
console.log(`      Error from φ: ${goldenPair.error.toFixed(6)}`);

const goldenPairs = goldenSelector.findAllGoldenPairs(primes);
if (goldenPairs.length > 0) {
  console.log(`\n   All golden pairs (within tolerance):`)
  goldenPairs.forEach(gp => {
    console.log(`      (${gp.p}, ${gp.q}): ratio = ${gp.ratio.toFixed(4)}`);
  });
} else {
  console.log(`\n   No exact golden pairs found in first 10 primes`);
}

// ==========================================================================
// 5. Silver Ratio Channel Selection
// ==========================================================================
console.log('\n\n5. Silver Ratio Channel Selection');
console.log(`   δ_s = 1 + √2 = ${SILVER_RATIO.toFixed(6)}`);
console.log('   Alternative irrational coupling\n');

const silverSelector = new SilverChannel(0.2);
const silverPair = silverSelector.select(primes);

console.log('   Best silver pair:');
console.log(`      p = ${silverPair.p}, q = ${silverPair.q}`);
console.log(`      Ratio: ${silverPair.ratio.toFixed(6)}`);
console.log(`      Error from δ_s: ${silverPair.error.toFixed(6)}`);

// ==========================================================================
// 6. Symbolic Entanglement Communication
// ==========================================================================
console.log('\n\n6. Symbolic Entanglement Communication Protocol');
console.log('   Multi-channel entanglement-based messaging\n');

const comm = new SymbolicEntanglementComm({ numChannels: 4 });

// Show channel statistics
console.log('   Initialized channels:');
const stats = comm.getStatistics();
for (const ch of stats) {
  console.log(`      Channel ${ch.index}: primes (${ch.primes[0]}, ${ch.primes[1]}), stability = ${ch.stability.toFixed(4)}`);
}

// Test correlation
console.log('\n   Testing correlation:');
const corrTest = comm.testCorrelation(50);
console.log(`      Trials: ${corrTest.trials}`);
console.log(`      Anti-correlated: ${corrTest.matches}`);
console.log(`      Correlation: ${(corrTest.correlation * 100).toFixed(1)}%`);
console.log(`      Expected: ${(corrTest.expected * 100).toFixed(1)}%`);

// ==========================================================================
// 7. Message Transmission Demo
// ==========================================================================
console.log('\n\n7. Message Transmission via Entanglement');
console.log('   Encode bits using phase modulation\n');

// Simple test with a few bits
console.log('   Encoding single bits:');
for (let bit = 0; bit <= 1; bit++) {
  const comm2 = new SymbolicEntanglementComm({ numChannels: 4 });
  const encoded = comm2.encodeBit(bit);
  console.log(`      Bit ${bit} → Channel ${encoded.channelIdx}, collapsed to prime ${encoded.collapsedPrime}`);
}

// Send a short message
const testMessage = 'Hi';
console.log(`\n   Sending message: "${testMessage}"`);
const comm3 = new SymbolicEntanglementComm({ numChannels: 8 });
const transmission = comm3.sendMessage(testMessage);
console.log(`      Bits transmitted: ${transmission.bitCount}`);
console.log(`      Transmissions: ${transmission.transmissions.length}`);

// ==========================================================================
// 8. Entanglement Witness - Bell Test
// ==========================================================================
console.log('\n\n8. Entanglement Witness - CHSH Test');
console.log('   Classical: |S| ≤ 2, Quantum: |S| ≤ 2√2 ≈ 2.83\n');

const witness = new EntanglementWitness();
const testPair = new PrimeEntangledPair(2, 3);

// Simple test first
const simpleResult = witness.simpleTest(testPair, 30);
console.log('   Simple entanglement test:');
console.log(`      Trials: ${simpleResult.trials}`);
console.log(`      Anti-correlated: ${simpleResult.antiCorrelated}`);
console.log(`      Correlation: ${(simpleResult.correlation * 100).toFixed(1)}%`);
console.log(`      Entangled: ${simpleResult.isEntangled ? 'YES' : 'No'}`);

// CHSH test
console.log('\n   CHSH inequality test:');
const chshResult = witness.chshTest(testPair, 50);
console.log(`      S = ${chshResult.S.toFixed(3)}`);
console.log(`      Classical limit: 2.000`);
console.log(`      Quantum max: ${chshResult.maxQuantum.toFixed(3)}`);
console.log(`      Bell violation: ${chshResult.isEntangled ? 'YES' : 'No'}`);
if (chshResult.isEntangled) {
  console.log(`      Violation strength: ${(chshResult.violation * 100).toFixed(1)}%`);
}

// ==========================================================================
// 9. Multi-Pair Correlation Analysis
// ==========================================================================
console.log('\n\n9. Multi-Pair Correlation Analysis');
console.log('   Compare different prime pairs\n');

const testPairs = [
  [2, 3],
  [3, 5],
  [5, 7],
  [7, 11],
  [2, 5]
];

console.log('   Prime Pair | Stability | Correlation');
console.log('   -----------|-----------|------------');

for (const [p, q] of testPairs) {
  const pairTest = new PrimeEntangledPair(p, q);
  const stab = stability.calculate(p, q);
  const testResult = witness.simpleTest(pairTest, 20);
  
  console.log(`      (${p}, ${q.toString().padStart(2)})   |   ${stab.toFixed(4)}  |   ${(testResult.correlation * 100).toFixed(1)}%`);
}

// ==========================================================================
// 10. Golden Channel Entanglement
// ==========================================================================
console.log('\n\n10. Golden Ratio Enhanced Entanglement');
console.log('    Primes with φ-coupling may have special properties\n');

// Find best golden-coupled primes in larger set
const largePrimes = firstNPrimes(30);
const bestGolden = goldenSelector.select(largePrimes);

console.log(`    Best φ-coupled pair in first 30 primes:`);
console.log(`       p = ${bestGolden.p}, q = ${bestGolden.q}`);
console.log(`       Ratio: ${bestGolden.ratio.toFixed(6)}, Error: ${bestGolden.error.toFixed(6)}`);

// Test this pair
const goldenEntPair = new PrimeEntangledPair(bestGolden.p, bestGolden.q);
const goldenTest = witness.simpleTest(goldenEntPair, 30);
console.log(`       Correlation: ${(goldenTest.correlation * 100).toFixed(1)}%`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ✅ book.pdf Chapter 8 Non-Local Communication Demo Complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
