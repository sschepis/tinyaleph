/**
 * Tests for Prime Hilbert Space (HP) and Prime Resonance Network modules
 * 
 * Based on the paper:
 * "Programming Reality: Prime Resonance Systems for Memory, Computation, and Probability Control"
 */

const {
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  PHI,
  DELTA_S,
  QuaternionPrime
} = require('../core');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg = 'Assertion failed') {
  if (!condition) throw new Error(msg);
}

function assertApprox(a, b, epsilon = 0.01, msg) {
  if (Math.abs(a - b) > epsilon) {
    throw new Error(msg || `Expected ${a} ≈ ${b}`);
  }
}

console.log('=== Complex Number Tests ===\n');

test('Complex creation and norm', () => {
  const c = new Complex(3, 4);
  assert(c.norm() === 5, 'Norm should be 5');
});

test('Complex addition', () => {
  const a = new Complex(1, 2);
  const b = new Complex(3, 4);
  const sum = a.add(b);
  assert(sum.re === 4 && sum.im === 6);
});

test('Complex multiplication', () => {
  const a = new Complex(1, 2);
  const b = new Complex(3, 4);
  const prod = a.mul(b);
  // (1+2i)(3+4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
  assert(prod.re === -5 && prod.im === 10);
});

test('Complex fromPolar', () => {
  const c = Complex.fromPolar(1, Math.PI/2);
  assertApprox(c.re, 0, 0.001);
  assertApprox(c.im, 1, 0.001);
});

test('Complex conjugate', () => {
  const c = new Complex(3, 4);
  const conj = c.conj();
  assert(conj.re === 3 && conj.im === -4);
});

console.log('\n=== PrimeState Tests ===\n');

test('PrimeState basis creation', () => {
  const state = PrimeState.basis(7);
  const amp = state.get(7);
  assert(amp.re === 1 && amp.im === 0);
});

test('PrimeState uniform superposition', () => {
  const state = PrimeState.uniform();
  const entropy = state.entropy();
  // Max entropy for 25 primes = log2(25) ≈ 4.64
  assert(entropy > 4.6, 'Entropy should be near maximum');
});

test('PrimeState normalization', () => {
  const state = new PrimeState();
  state.set(2, new Complex(3, 4));
  state.set(3, new Complex(1, 0));
  const normalized = state.normalize();
  assertApprox(normalized.norm(), 1, 0.001);
});

test('PrimeState inner product', () => {
  const a = PrimeState.basis(7);
  const b = PrimeState.basis(7);
  const inner = a.inner(b);
  assert(inner.re === 1 && inner.im === 0, 'Same basis states have inner product 1');
});

test('PrimeState orthogonal basis', () => {
  const a = PrimeState.basis(7);
  const b = PrimeState.basis(11);
  const inner = a.inner(b);
  assert(inner.re === 0 && inner.im === 0, 'Different basis states are orthogonal');
});

test('PrimeState coherence', () => {
  const a = PrimeState.basis(7);
  const b = PrimeState.basis(7);
  assert(a.coherence(b) === 1, 'Same states have coherence 1');
});

test('PrimeState measurement', () => {
  const state = PrimeState.basis(7);
  const result = state.measure();
  assert(result.prime === 7, 'Basis state collapses to its prime');
});

console.log('\n=== Resonance Operators Tests ===\n');

test('Operator P (eigenvalue operator)', () => {
  const state = PrimeState.basis(7);
  const result = ResonanceOperators.P(state);
  const amp = result.get(7);
  // P|7⟩ = 7|7⟩
  assert(amp.re === 7, 'Eigenvalue should be 7');
});

test('Operator R (phase rotation)', () => {
  const state = PrimeState.basis(7);
  const R5 = ResonanceOperators.R(5);
  const result = R5(state);
  // Should preserve norm
  assertApprox(result.norm(), 1, 0.001);
});

test('Operator C (coupling)', () => {
  const state = PrimeState.uniform();
  const C5 = ResonanceOperators.C(5);
  const result = C5(state);
  assertApprox(result.norm(), 1, 0.001);
});

test('Operator H (Hadamard-like)', () => {
  const state = PrimeState.basis(2);
  const result = ResonanceOperators.H(state);
  // Should create superposition
  assert(result.entropy() > state.entropy());
});

console.log('\n=== Entropy-Driven Evolution Tests ===\n');

test('EntropyDrivenEvolution creation', () => {
  const state = PrimeState.uniform();
  const evo = new EntropyDrivenEvolution(state);
  assert(evo.time === 0);
  assert(evo.entropyIntegral === 0);
});

test('EntropyDrivenEvolution step', () => {
  const state = PrimeState.uniform();
  const evo = new EntropyDrivenEvolution(state);
  evo.step();
  assert(evo.time > 0);
  assert(evo.history.length === 1);
});

test('EntropyDrivenEvolution collapse', () => {
  const state = PrimeState.uniform();
  const evo = new EntropyDrivenEvolution(state, { lambda: 0.5 });
  const result = evo.evolveUntilCollapse(1000);
  // Should eventually collapse or reach max steps
  assert(result.steps > 0);
  assert(result.finalState !== undefined);
});

console.log('\n=== Memory Encoding Tests ===\n');

test('encodeMemory basic', () => {
  const state = encodeMemory('hello');
  assert(state.norm() > 0);
  assert(state.entropy() > 0);
});

test('encodeMemory different texts produce different states', () => {
  const a = encodeMemory('hello');
  const b = encodeMemory('world');
  // Should have different dominant primes
  const domA = a.dominant(3).map(d => d.p);
  const domB = b.dominant(3).map(d => d.p);
  // At least one difference
  const same = domA.filter(p => domB.includes(p)).length;
  assert(same < 3, 'Different texts should produce different states');
});

console.log('\n=== Symbolic Computation Tests ===\n');

test('symbolicCompute single input', () => {
  const result = symbolicCompute([PrimeState.basis(7)]);
  assert(result.result.get(7).norm() > 0);
});

test('symbolicCompute multiple inputs', () => {
  const result = symbolicCompute([
    PrimeState.basis(5),
    PrimeState.basis(7),
    PrimeState.basis(11)
  ]);
  assert(result.dominant.length > 0);
  assert(result.iterations > 0);
});

console.log('\n=== QuaternionPrime Tests ===\n');

test('QuaternionPrime creation', () => {
  const q = new QuaternionPrime(1, 2, 3, 4);
  assert(q.a === 1 && q.b === 2);
});

test('QuaternionPrime multiplication', () => {
  const i = new QuaternionPrime(0, 1, 0, 0);
  const j = new QuaternionPrime(0, 0, 1, 0);
  const k = i.mul(j);
  // i*j = k
  assertApprox(k.d, 1, 0.001);
});

test('QuaternionPrime fromPrime', () => {
  const q = QuaternionPrime.fromPrime(7);
  assert(q.a === 7);
});

console.log('\n=== PrimeResonanceIdentity Tests ===\n');

test('PRI random generation', () => {
  const pri = PrimeResonanceIdentity.random();
  assert(pri.signature.length === 3);
  assert(pri.hash !== undefined);
});

test('PRI fromSeed deterministic', () => {
  const pri1 = PrimeResonanceIdentity.fromSeed(42);
  const pri2 = PrimeResonanceIdentity.fromSeed(42);
  assert(pri1.hash === pri2.hash);
});

test('PRI entanglement strength', () => {
  const a = PrimeResonanceIdentity.random();
  const b = PrimeResonanceIdentity.random();
  const strength = a.entanglementStrength(b);
  assert(strength >= -1 && strength <= 1);
});

console.log('\n=== PhaseLockedRing Tests ===\n');

test('PhaseLockedRing creation', () => {
  const ring = new PhaseLockedRing([2, 3, 5, 7, 11]);
  assert(ring.n === 5);
  assert(ring.phases.length === 5);
});

test('PhaseLockedRing tick evolution', () => {
  const ring = new PhaseLockedRing([2, 3, 5, 7, 11]);
  const initialPhases = [...ring.phases];
  ring.tick(0.1);
  // Phases should change
  assert(ring.phases[0] !== initialPhases[0]);
});

test('PhaseLockedRing order parameter', () => {
  const ring = new PhaseLockedRing([2, 3, 5, 7, 11]);
  const order = ring.orderParameter();
  assert(order >= 0 && order <= 1);
});

test('PhaseLockedRing toPrimeState', () => {
  const ring = new PhaseLockedRing([2, 3, 5, 7, 11]);
  const state = ring.toPrimeState();
  assert(state instanceof PrimeState);
  assertApprox(state.norm(), 1, 0.001);
});

console.log('\n=== HolographicField Tests ===\n');

test('HolographicField creation', () => {
  const field = new HolographicField(32, 32);
  assert(field.width === 32);
  assert(field.height === 32);
});

test('HolographicField encodeState', () => {
  const field = new HolographicField(32, 32);
  const state = PrimeState.basis(7);
  field.encodeState(state, 16, 16);
  assert(field.maxIntensity() > 0);
});

test('HolographicField findPeaks', () => {
  const field = new HolographicField(32, 32);
  field.encodeState(PrimeState.basis(7), 16, 16);
  const peaks = field.findPeaks(0.1);
  assert(peaks.length > 0);
});

test('HolographicField decode round-trip', () => {
  const field = new HolographicField(32, 32);
  const original = PrimeState.basis(7);
  field.encodeState(original, 16, 16);
  const decoded = field.decodeAt(16, 16, 5);
  // Should have some of the original signal
  assert(decoded.get(7).norm() > 0);
});

console.log('\n=== EntangledNode Tests ===\n');

test('EntangledNode creation', () => {
  const node = new EntangledNode('test');
  assert(node.id === 'test');
  assert(node.pri !== undefined);
});

test('EntangledNode entanglement', () => {
  const a = new EntangledNode('alpha');
  const b = new EntangledNode('beta');
  const strength = a.entangleWith(b);
  assert(a.entanglementMap.has('beta'));
  assert(b.entanglementMap.has('alpha'));
});

test('EntangledNode tick', () => {
  const node = new EntangledNode('test');
  const initialCoherence = node.coherence;
  node.tick(0.1);
  // Coherence should change slightly
  assert(node.coherence !== undefined);
});

test('EntangledNode memory storage', () => {
  const node = new EntangledNode('test');
  const state = PrimeState.basis(11);
  node.storeMemory(state, 16, 16);
  assert(node.holographicMemory.maxIntensity() > 0);
});

console.log('\n=== ResonantFragment Tests ===\n');

test('ResonantFragment fromText', () => {
  const fragment = ResonantFragment.fromText('hello world');
  assert(fragment.entropy > 0);
  assert(fragment.state !== undefined);
});

test('ResonantFragment fromPrimes', () => {
  const fragment = ResonantFragment.fromPrimes([2, 3, 5, 7]);
  assert(fragment.dominant(4).length === 4);
});

test('ResonantFragment tensorWith', () => {
  const a = ResonantFragment.fromPrimes([2, 3]);
  const b = ResonantFragment.fromPrimes([5, 7]);
  const combined = a.tensorWith(b);
  assert(combined.state !== undefined);
});

test('ResonantFragment rotatePhase', () => {
  const fragment = ResonantFragment.fromPrimes([7]);
  const rotated = fragment.rotatePhase(Math.PI);
  // Phase rotation should preserve amplitude
  assertApprox(fragment.state.get(7).norm(), rotated.state.get(7).norm(), 0.001);
});

test('ResonantFragment coherenceWith', () => {
  const a = ResonantFragment.fromPrimes([7]);
  const b = ResonantFragment.fromPrimes([7]);
  const coherence = a.coherenceWith(b);
  assertApprox(coherence, 1, 0.001);
});

console.log('\n=== Constants Tests ===\n');

test('PHI golden ratio', () => {
  assertApprox(PHI, 1.618, 0.01);
  assertApprox(PHI * PHI, PHI + 1, 0.001, 'φ² = φ + 1');
});

test('DELTA_S irrational', () => {
  assertApprox(DELTA_S, Math.sqrt(2), 0.001);
});

console.log('\n=== Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ All tests passed!');
} else {
  console.log(`\n❌ ${failed} tests failed`);
  process.exit(1);
}