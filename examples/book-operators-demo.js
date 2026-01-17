/**
 * book.pdf Chapter 4 Operators Demo
 * 
 * Demonstrates the new number-theoretic operators from 
 * "Resonant Foundations of Reality" book.pdf:
 * - Zeta Operator ζ̂(s)|n⟩ = n^(-s)|n⟩
 * - Von Mangoldt Operator Λ̂|n⟩ = Λ(n)|n⟩
 * - Dirichlet Character Operator χ̂_d|n⟩ = χ_d(n)|n⟩
 */

import { 
  PrimeState, 
  Complex, 
  ExtendedOperators, 
  vonMangoldt, 
  liouvilleFunction, 
  divisorCount, 
  jacobiSymbol 
} from '../core/hilbert.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  book.pdf Chapter 4: Number-Theoretic Operators Demo');
console.log('═══════════════════════════════════════════════════════════════\n');

// ==========================================================================
// 1. Von Mangoldt Function Λ(n)
// ==========================================================================
console.log('1. Von Mangoldt Function Λ(n):');
console.log('   Λ(n) = log(p) if n = p^k, else 0\n');

[2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(n => {
  const lambda = vonMangoldt(n);
  const note = lambda > 0 ? ` = log(${Math.round(Math.exp(lambda))})` : ' (not a prime power)';
  console.log(`   Λ(${n}) = ${lambda.toFixed(4)}${note}`);
});

// ==========================================================================
// 2. Liouville Function λ(n)
// ==========================================================================
console.log('\n2. Liouville Function λ(n):');
console.log('   λ(n) = (-1)^Ω(n) where Ω(n) = total prime factors with multiplicity\n');

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(n => {
  console.log(`   λ(${n}) = ${liouvilleFunction(n)}`);
});

// ==========================================================================
// 3. Divisor Count Function d(n)
// ==========================================================================
console.log('\n3. Divisor Count Function d(n):');
console.log('   d(n) = number of positive divisors\n');

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 24].forEach(n => {
  console.log(`   d(${n}) = ${divisorCount(n)}`);
});

// ==========================================================================
// 4. Jacobi Symbol (n/m)
// ==========================================================================
console.log('\n4. Jacobi Symbol (n/m):');
console.log('   Generalization of Legendre symbol using quadratic reciprocity\n');

[[3, 5], [2, 7], [5, 11], [7, 13], [4, 9], [2, 15]].forEach(([n, m]) => {
  const symbol = jacobiSymbol(n, m);
  const meaning = symbol === 1 ? 'quadratic residue' : 
                  symbol === -1 ? 'quadratic non-residue' : 
                  'not coprime';
  console.log(`   (${n}/${m}) = ${symbol} (${meaning})`);
});

// ==========================================================================
// 5. Zeta Operator ζ̂(s)
// ==========================================================================
console.log('\n5. Zeta Operator ζ̂(s)|p⟩ = p^(-s)|p⟩:');
console.log('   Connects to Riemann zeta function ζ(s) = Σ n^(-s)\n');

const state = PrimeState.uniform();
console.log('   Initial state: uniform superposition over primes');
console.log(`   Initial entropy: ${state.entropy().toFixed(4)}`);

// Apply Zeta operator with s=2
const zetaOp = ExtendedOperators.Zeta(2);
const zetaState = zetaOp(state);
console.log('\n   After applying ζ̂(2):');
console.log(`   Entropy: ${zetaState.entropy().toFixed(4)}`);
console.log('   Dominant primes (small primes get more weight):');
zetaState.dominant(5).forEach(d => {
  console.log(`      p=${d.p}: amplitude=${d.amp.toFixed(4)}`);
});

// ==========================================================================
// 6. Von Mangoldt Operator Λ̂
// ==========================================================================
console.log('\n6. Von Mangoldt Operator Λ̂|p⟩ = log(p)|p⟩:');
console.log('   Weights primes by their logarithm\n');

const lambdaState = ExtendedOperators.Lambda(state);
console.log('   After applying Λ̂ to uniform state:');
console.log('   Dominant primes (large primes get more weight):');
lambdaState.dominant(5).forEach(d => {
  console.log(`      p=${d.p}: amplitude=${d.amp.toFixed(4)} ≈ log(${d.p})/${Math.sqrt(state.primes.length).toFixed(2)}`);
});

// ==========================================================================
// 7. Dirichlet Character Operator χ̂_d
// ==========================================================================
console.log('\n7. Dirichlet Character Operator χ̂_d|p⟩ = χ_d(p)|p⟩:');
console.log('   Uses Jacobi symbol (p/d) as quadratic character\n');

const chi5 = ExtendedOperators.Chi(5);
const chiState = chi5(state);
console.log('   After applying χ̂₅ (mod 5) to uniform state:');
console.log('   First 10 primes:');
[2, 3, 5, 7, 11, 13, 17, 19, 23, 29].forEach(p => {
  const amp = chiState.get(p);
  const chi = jacobiSymbol(p, 5);
  console.log(`      p=${p}: χ₅(${p})=${chi}, amplitude=${amp.norm().toFixed(4)}`);
});

// ==========================================================================
// 8. Zeta Euler Product Approximation
// ==========================================================================
console.log('\n8. Zeta Euler Product ζ(s) = Π 1/(1-p^(-s)):');
console.log('   Approximation using first 15 primes\n');

const zeta2 = ExtendedOperators.zetaEulerProduct(2);
console.log(`   ζ(2) ≈ ${zeta2.norm().toFixed(6)}`);
console.log(`   Exact: π²/6 ≈ ${(Math.PI * Math.PI / 6).toFixed(6)}`);
console.log(`   Error: ${Math.abs(zeta2.norm() - Math.PI * Math.PI / 6).toFixed(6)}\n`);

const zeta3 = ExtendedOperators.zetaEulerProduct(3);
console.log(`   ζ(3) ≈ ${zeta3.norm().toFixed(6)}`);
console.log(`   Exact (Apéry's constant): ≈ 1.202057`);
console.log(`   Error: ${Math.abs(zeta3.norm() - 1.202057).toFixed(6)}\n`);

const zeta4 = ExtendedOperators.zetaEulerProduct(4);
console.log(`   ζ(4) ≈ ${zeta4.norm().toFixed(6)}`);
console.log(`   Exact: π⁴/90 ≈ ${(Math.pow(Math.PI, 4) / 90).toFixed(6)}`);

// ==========================================================================
// 9. Combined Operator Composition
// ==========================================================================
console.log('\n9. Combined Operator Composition:');
console.log('   Composing Zeta and Von Mangoldt operators\n');

const composed = ExtendedOperators.Lambda(zetaOp(state));
console.log('   Λ̂ · ζ̂(2) applied to uniform state:');
console.log('   Dominant primes:');
composed.dominant(5).forEach(d => {
  console.log(`      p=${d.p}: amplitude=${d.amp.toFixed(4)}`);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ✅ book.pdf Chapter 4 Operators Demo Complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
