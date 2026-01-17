/**
 * book.pdf Chapter 6 & 16: Gravity & Metric Emergence Demo
 * 
 * Demonstrates:
 * - Metric emergence: g_mn = Tr(Ψ_m Ψ_n)
 * - Symbolic curvature: G^(symbolic)_μν = ∇_μ∇_ν S - g_μν S
 * - Graviton formation: ∂_t Ψ₁ = γ(Ψ₁ × Ψ₁)
 * - Prime harmonic EM: E(x,t) = Σ E_p(x) e^(iω_p t)
 */

import { PrimeState } from '../core/hilbert.js';
import { 
  MetricEmergence, 
  SymbolicGravity, 
  GravitonField,
  PrimeHarmonicField,
  ModifiedEinsteinEquations 
} from '../core/gravity.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  book.pdf Chapters 6 & 16: Gravity & Metric Emergence Demo');
console.log('═══════════════════════════════════════════════════════════════\n');

// ==========================================================================
// 1. Metric Emergence from Symbolic Fields
// ==========================================================================
console.log('1. Metric Emergence: g_mn = Tr(Ψ_m Ψ_n)');
console.log('   Deriving spacetime metric from Prime Hilbert Space\n');

const metric = new MetricEmergence(4);

// Create 4 field states for spacetime dimensions
const fieldStates = [
  PrimeState.basis(2),   // Time-like direction
  PrimeState.basis(3),   // X spatial
  PrimeState.basis(5),   // Y spatial  
  PrimeState.basis(7),   // Z spatial
];

console.log('   Initial Minkowski metric (flat spacetime):');
console.log('   g_μν = diag(-1, +1, +1, +1)');
console.log(`   Determinant: ${metric.determinant().toFixed(4)}`);
console.log(`   Signature: ${JSON.stringify(metric.signature())}\n`);

// Compute emergent metric from field inner products
metric.fromFieldStates(fieldStates);

console.log('   Emergent metric from orthogonal prime states:');
console.log('   (Basis states |2⟩, |3⟩, |5⟩, |7⟩ are orthogonal)');
for (let i = 0; i < 4; i++) {
  const row = Array.from(metric.metric[i]).map(v => v.toFixed(3)).join('  ');
  console.log(`      g_${i}ν = [${row}]`);
}
console.log(`   Ricci scalar R = ${metric.ricciScalar().toFixed(4)}\n`);

// Now with entangled states
console.log('   Now with superposition states (creates curvature):');
const entangledStates = [
  PrimeState.composite(6),   // |6⟩ = √(1/2)|2⟩ + √(1/2)|3⟩
  PrimeState.composite(10),  // |10⟩
  PrimeState.composite(15),  // |15⟩
  PrimeState.composite(21),  // |21⟩
];
metric.fromFieldStates(entangledStates);

for (let i = 0; i < 4; i++) {
  const row = Array.from(metric.metric[i]).map(v => v.toFixed(3)).join('  ');
  console.log(`      g_${i}ν = [${row}]`);
}
console.log(`   Determinant: ${metric.determinant().toFixed(6)}`);
console.log(`   Ricci scalar R = ${metric.ricciScalar().toFixed(4)} (non-zero = curved!)\n`);

// ==========================================================================
// 2. Symbolic Gravity Tensor
// ==========================================================================
console.log('2. Symbolic Gravity: G^(symbolic)_μν = ∇_μ∇_ν S - g_μν S');
console.log('   Gravitational effects from symbolic entropy gradients\n');

const symGrav = new SymbolicGravity({ gridSize: 10, dx: 1.0, dt: 0.1 });

// Create entropy distribution from a high-entropy state
const highEntropyState = PrimeState.uniform();
console.log(`   Encoding uniform superposition (S = ${highEntropyState.entropy().toFixed(4)}) into spacetime\n`);

symGrav.encodeState(highEntropyState, [0.5, 5, 5, 5]);

// Compute symbolic gravity tensor at center
const Gsym = symGrav.computeTensor(0.5, 5, 5, 5);
console.log('   G^(symbolic)_μν at center (t=0.5, x=y=z=5):');
for (let mu = 0; mu < 4; mu++) {
  const row = Array.from(Gsym[mu]).map(v => v.toFixed(4)).join('  ');
  console.log(`      G^(s)_${mu}ν = [${row}]`);
}

const trace = symGrav.trace(0.5, 5, 5, 5);
console.log(`\n   Trace (symbolic curvature scalar): ${trace.toFixed(6)}\n`);

// ==========================================================================
// 3. Graviton Formation
// ==========================================================================
console.log('3. Graviton Formation: ∂_t Ψ₁ = γ(Ψ₁ × Ψ₁)');
console.log('   Spin-2 bosonic field from non-Abelian cross-product dynamics\n');

const graviton = new GravitonField({ gamma: 0.1, dt: 0.01 });
graviton.fromPrimeState(PrimeState.composite(30)); // |30⟩ = |2⟩|3⟩|5⟩

console.log(`   Initial field: [${graviton.field.map(f => f.re.toFixed(3)).join(', ')}]`);
console.log(`   Initial norm: ${graviton.norm().toFixed(4)}\n`);

// Evolve
graviton.evolve(100);

console.log('   After 100 evolution steps:');
console.log(`   Field: [${graviton.field.map(f => f.re.toFixed(3)).join(', ')}]`);
console.log(`   Norm: ${graviton.norm().toFixed(4)}`);

const spin2 = graviton.spin2Content();
console.log(`   Spin-2 quadrupole magnitude: ${spin2.magnitude.toFixed(6)}`);
console.log(`   Quadrupole trace: ${spin2.trace.toFixed(6)} (should be ~0 for graviton)\n`);

// ==========================================================================
// 4. Prime Harmonic EM Field
// ==========================================================================
console.log('4. Prime Harmonic EM: E(x,t) = Σ_p E_p(x) e^(iω_p t)');
console.log('   Electromagnetic fields at prime-logarithmic frequencies\n');

const emField = new PrimeHarmonicField({ gridSize: 64, dx: 0.1 });
emField.fromPrimeState(PrimeState.uniform());

// Compute at a specific point
const E0 = emField.compute(0, 0);
const E1 = emField.compute(1, 0);
const E2 = emField.compute(2, 0);

console.log('   E-field at t=0:');
console.log(`      E(x=0) = ${E0.re.toFixed(4)} + ${E0.im.toFixed(4)}i, |E|² = ${E0.norm2().toFixed(4)}`);
console.log(`      E(x=1) = ${E1.re.toFixed(4)} + ${E1.im.toFixed(4)}i, |E|² = ${E1.norm2().toFixed(4)}`);
console.log(`      E(x=2) = ${E2.re.toFixed(4)} + ${E2.im.toFixed(4)}i, |E|² = ${E2.norm2().toFixed(4)}\n`);

// Find interference peaks
const peaks = emField.findPeaks(0, 0.3);
console.log(`   Interference peaks at t=0 (${peaks.length} found):`);
peaks.slice(0, 5).forEach(p => {
  console.log(`      x = ${p.position.toFixed(2)}: intensity = ${p.intensity.toFixed(4)} (${(p.relativeIntensity * 100).toFixed(1)}%)`);
});

// Spectral analysis
const spectrum = emField.spectrum(0, 10, 256);
console.log('\n   Power spectrum at x=0:');
[2, 3, 5, 7, 11].forEach(p => {
  console.log(`      ω_${p} = log(${p}) = ${Math.log(p).toFixed(4)}: power = ${spectrum.get(p).toFixed(4)}`);
});

// ==========================================================================
// 5. Modified Einstein Equations
// ==========================================================================
console.log('\n5. Modified Einstein: G_μν = κT̃_μν + λG^(symbolic)_μν');
console.log('   Unified field equations with symbolic contribution\n');

const modEinstein = new ModifiedEinsteinEquations({
  kappa: 1.0,
  lambda: 0.1,
  gridSize: 10
});

// Encode a high-entropy state
modEinstein.symbolicGravity.encodeState(highEntropyState, [0.5, 5, 5, 5]);

// Compute effective stress-energy (no matter, just symbolic)
const T_eff = modEinstein.effectiveStressEnergy(null, 0.5, 5, 5, 5);

console.log('   Effective stress-energy tensor (pure symbolic):');
for (let mu = 0; mu < 4; mu++) {
  const row = Array.from(T_eff[mu]).map(v => v.toFixed(4)).join('  ');
  console.log(`      T_eff_${mu}ν = [${row}]`);
}

const conditions = modEinstein.checkEnergyConditions(T_eff);
console.log(`\n   Energy conditions:`);
console.log(`      Effective energy density ρ = ${conditions.effectiveDensity.toFixed(6)}`);
console.log(`      Trace T = ${conditions.trace.toFixed(6)}`);
console.log(`      Weak energy condition violated: ${conditions.weakViolated}`);

// Symbolic potential
const phi = modEinstein.symbolicPotential(0.5, 1.0);
console.log(`\n   Symbolic gravitational potential Φ(r=1) = ${phi.toFixed(6)}`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ✅ book.pdf Chapters 6 & 16 Gravity Demo Complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
