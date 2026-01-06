/**
 * Example: Prime Hilbert Space (HP)
 * 
 * Demonstrates the formal quantum-like structure from the paper:
 * "Programming Reality: Prime Resonance Systems for Memory, Computation, and Probability Control"
 * 
 * Key concepts:
 * - Prime basis states |p⟩
 * - Complex amplitudes αp ∈ ℂ
 * - Superposition and measurement
 * - Resonance operators (P̂, F̂, R̂, Ĉ)
 */

const {
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution
} = require('../../modular');

console.log('═══════════════════════════════════════════════════════════════');
console.log('           PRIME HILBERT SPACE DEMONSTRATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Prime Basis States
console.log('1. PRIME BASIS STATES |p⟩');
console.log('─────────────────────────────────────────────────────────────────');

const basis7 = PrimeState.basis(7);
const basis11 = PrimeState.basis(11);

console.log('|7⟩  amplitude:', basis7.get(7).toString());
console.log('|11⟩ amplitude:', basis11.get(11).toString());
console.log('Inner product ⟨7|7⟩:', basis7.inner(basis7).toString());
console.log('Inner product ⟨7|11⟩:', basis7.inner(basis11).toString(), '(orthogonal)');

// 2. Uniform Superposition
console.log('\n2. UNIFORM SUPERPOSITION');
console.log('─────────────────────────────────────────────────────────────────');

const uniform = PrimeState.uniform();
console.log('Uniform superposition entropy:', uniform.entropy().toFixed(4));
console.log('Number of primes:', uniform.primes.length);
console.log('First 5 amplitudes:');
for (let i = 0; i < 5; i++) {
  const p = uniform.primes[i];
  console.log(`  |${p}⟩: ${uniform.get(p).toString()}`);
}

// 3. Composite States
console.log('\n3. COMPOSITE STATES |n⟩ = |p₁⟩|p₂⟩...');
console.log('─────────────────────────────────────────────────────────────────');

const composite30 = PrimeState.composite(30);  // 30 = 2 × 3 × 5
console.log('|30⟩ = |2⟩|3⟩|5⟩ (as weighted superposition)');
console.log('Dominant primes:');
for (const { p, amp } of composite30.dominant(3)) {
  console.log(`  |${p}⟩: amplitude ${amp.toFixed(4)}`);
}

// 4. Resonance Operators
console.log('\n4. RESONANCE OPERATORS');
console.log('─────────────────────────────────────────────────────────────────');

// P̂: Prime eigenvalue operator
console.log('\nP̂ (Prime Eigenvalue): P̂|p⟩ = p|p⟩');
const Pstate = ResonanceOperators.P(basis7);
console.log('P̂|7⟩ amplitude:', Pstate.get(7).toString(), '(= 7 × |7⟩)');

// R̂: Phase rotation operator
console.log('\nR̂(n) (Resonance): e^(2πi log_p(n)) rotation');
const R5 = ResonanceOperators.R(5);
const rotated = R5(basis7);
console.log('R̂(5)|7⟩ amplitude:', rotated.get(7).toString());
console.log('Original norm:', basis7.norm().toFixed(4));
console.log('After R̂(5) norm:', rotated.norm().toFixed(4), '(preserved)');

// Ĉ: Coupling operator
console.log('\nĈ(n) (Coupling): Phase coupling between primes');
const C7 = ResonanceOperators.C(7);
const coupled = C7(uniform);
console.log('Ĉ(7) on uniform state - creates interference');
console.log('Dominant after coupling:', coupled.dominant(3).map(d => d.p).join(', '));

// Ĥ: Hadamard-like
console.log('\nĤ (Hadamard-like): Creates superposition');
const hadamard = ResonanceOperators.H(basis7);
console.log('Ĥ|7⟩ entropy:', hadamard.entropy().toFixed(4), '(increased)');

// 5. Measurement (Born Rule)
console.log('\n5. QUANTUM MEASUREMENT (Born Rule)');
console.log('─────────────────────────────────────────────────────────────────');

const superposition = PrimeState.uniform();
console.log('Measuring uniform superposition 10 times:');
const measurements = [];
for (let i = 0; i < 10; i++) {
  const result = superposition.measure();
  measurements.push(result.prime);
}
console.log('Results:', measurements.join(', '));

// 6. Entropy-Driven Evolution
console.log('\n6. ENTROPY-DRIVEN EVOLUTION');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Equation: d|Ψ(t)⟩/dt = iĤ|Ψ(t)⟩ - λ(R̂ - r_stable)|Ψ(t)⟩');

const evolution = new EntropyDrivenEvolution(PrimeState.uniform(), {
  lambda: 0.1,
  rStable: 0.5,
  dt: 0.01
});

console.log('\nInitial entropy:', evolution.state.entropy().toFixed(4));

for (let i = 0; i < 100; i++) {
  evolution.step();
}

console.log('After 100 steps:');
console.log('  Entropy:', evolution.state.entropy().toFixed(4));
console.log('  Time:', evolution.time.toFixed(2));
console.log('  Entropy integral:', evolution.entropyIntegral.toFixed(4));

// 7. Collapse Until Threshold
console.log('\n7. EVOLUTION UNTIL COLLAPSE');
console.log('─────────────────────────────────────────────────────────────────');
console.log('P_collapse = 1 - e^(-∫S(t)dt)');

const evo2 = new EntropyDrivenEvolution(PrimeState.uniform(), { lambda: 0.3 });
const result = evo2.evolveUntilCollapse(500);

console.log('Collapsed:', result.collapsed);
console.log('Steps taken:', result.steps);
console.log('Collapse probability:', result.probability.toFixed(4));
console.log('Final state (dominant prime):', result.finalState.prime || result.finalState.p);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    DEMONSTRATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');