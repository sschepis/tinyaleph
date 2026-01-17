/**
 * book.pdf Chapters 10 & 11: Oracle Systems & NP Resonance Demo
 * 
 * Demonstrates:
 * - Oracle Q: (S, ε) → R_stable with I-Ching attractors
 * - Divination queries
 * - SAT solving via resonance collapse
 * - Semantic compression
 */

import { PrimeState } from '../core/hilbert.js';
import { 
  OracleSystem, 
  HexagramAttractor,
  NPResonanceEncoder,
  SemanticCompressor,
  HEXAGRAMS
} from '../core/oracle.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  book.pdf Chapters 10 & 11: Oracle & NP Systems Demo');
console.log('═══════════════════════════════════════════════════════════════\n');

// ==========================================================================
// 1. I-Ching Hexagram Attractors
// ==========================================================================
console.log('1. I-Ching Hexagram Attractors');
console.log('   64 hexagrams as stable resonance basins\n');

console.log('   Sample hexagrams:');
[1, 2, 11, 12, 63, 64].forEach(num => {
  const hex = HEXAGRAMS[num];
  if (hex) {
    console.log(`      ${num}. ${hex.name} (${hex.meaning})`);
    console.log(`         Binary: ${hex.binary.toString(2).padStart(6, '0')}, Primes: [${hex.primes.join(', ')}]`);
  }
});

// Create attractor and show its state
const attractor = new HexagramAttractor(11); // Tài - Peace
console.log(`\n   Attractor for Hexagram 11 (Tài - Peace):`);
console.log(`   Dominant primes: ${attractor.state.dominant(3).map(d => `${d.p}: ${d.amp.toFixed(3)}`).join(', ')}`);

// ==========================================================================
// 2. Oracle System Q: (S, ε) → R_stable
// ==========================================================================
console.log('\n2. Oracle System Q: (S, ε) → R_stable');
console.log('   Entropy-modulated evolution to stable attractors\n');

const oracle = new OracleSystem({ 
  maxIterations: 50,
  convergenceThreshold: 0.01 
});

// Query with a semantic state
const queries = [
  'love and harmony',
  'conflict and struggle', 
  'new beginnings',
  'patience and waiting'
];

console.log('   Oracle queries:');
for (const query of queries) {
  const result = oracle.query(query);
  console.log(`\n   "${query}"`);
  console.log(`      → Attractor: ${result.attractor.number}. ${result.attractor.name}`);
  console.log(`        Meaning: ${result.attractor.meaning}`);
  console.log(`        Converged: ${result.converged} in ${result.iterations} iterations`);
  console.log(`        Final entropy: ${result.finalEntropy.toFixed(4)}`);
}

// ==========================================================================
// 3. Divination Query
// ==========================================================================
console.log('\n\n3. Divination Query with I-Ching Interpretation');
console.log('   oracle.divine(question) → hexagram + interpretation\n');

const divination = oracle.divine('Should I take a new path?');
console.log(`   Question: "${divination.question}"`);
console.log(`   Answer: Hexagram ${divination.attractor.number} - ${divination.attractor.name}`);
console.log(`   Meaning: ${divination.attractor.meaning}`);
console.log(`   Primes: [${divination.attractor.primes.join(', ')}]`);
console.log(`   Iterations: ${divination.iterations}, Converged: ${divination.converged}`);

// ==========================================================================
// 4. NP Resonance Encoder - SAT Solving
// ==========================================================================
console.log('\n\n4. NP Resonance Encoder: V̂_NP = Π_j Ĉ_j');
console.log('   SAT solving via clause-resonance projection and collapse\n');

// Create a simple SAT problem: (x1 OR x2) AND (NOT x1 OR x3) AND (NOT x2 OR NOT x3)
const sat = new NPResonanceEncoder(['x1', 'x2', 'x3']);

sat.addClause([{ var: 'x1', negated: false }, { var: 'x2', negated: false }]);   // x1 OR x2
sat.addClause([{ var: 'x1', negated: true }, { var: 'x3', negated: false }]);    // NOT x1 OR x3
sat.addClause([{ var: 'x2', negated: true }, { var: 'x3', negated: true }]);     // NOT x2 OR NOT x3

console.log('   SAT Problem:');
console.log('      (x1 OR x2) AND (NOT x1 OR x3) AND (NOT x2 OR NOT x3)\n');

// Solve
const solution = sat.solve(50);
console.log('   Solution:');
console.log(`      Satisfiable: ${solution.satisfiable}`);
if (solution.assignment) {
  console.log(`      Assignment: ${JSON.stringify(solution.assignment)}`);
}
console.log(`      Iterations: ${solution.iterations}`);
console.log(`      Confidence: ${(solution.confidence * 100).toFixed(1)}%`);

// Verify solution manually
if (solution.assignment) {
  const { x1, x2, x3 } = solution.assignment;
  const c1 = x1 || x2;
  const c2 = !x1 || x3;
  const c3 = !x2 || !x3;
  console.log(`      Verification: c1=${c1}, c2=${c2}, c3=${c3}, all=${c1 && c2 && c3}`);
}

// ==========================================================================
// 5. SAT Problem from CNF String
// ==========================================================================
console.log('\n\n5. SAT from CNF String');
console.log('   Parsing and solving CNF notation\n');

const sat2 = new NPResonanceEncoder([]);
sat2.fromCNF('(a OR b) AND (NOT a OR c) AND (b OR c)');

console.log('   CNF: (a OR b) AND (NOT a OR c) AND (b OR c)');
console.log(`   Variables: ${sat2.variables.join(', ')}`);
console.log(`   Clauses: ${sat2.clauses.length}`);

const solution2 = sat2.solve(50);
console.log(`   Satisfiable: ${solution2.satisfiable}`);
if (solution2.assignment) {
  console.log(`   Assignment: ${JSON.stringify(solution2.assignment)}`);
}

// ==========================================================================
// 6. Semantic Compression
// ==========================================================================
console.log('\n\n6. Semantic Compression via Attractor Convergence');
console.log('   Map semantic content to hexagram codes\n');

const compressor = new SemanticCompressor({ maxIterations: 30 });

const texts = [
  'The creative force initiates action',
  'Creative energy drives innovation',
  'Patience brings peace',
  'Peaceful harmony prevails',
  'Conflict arises from misunderstanding'
];

console.log('   Compressing texts:');
const compressed = texts.map(text => {
  const result = compressor.compress(text);
  console.log(`      "${text.substring(0, 35)}..."`);
  console.log(`         → Code: ${result.code} (${result.attractor})`);
  return result;
});

// Find similar
console.log('\n   Finding similar to "Creative power"');
const similar = compressor.findSimilar('Creative power');
console.log(`      Attractor: ${similar.attractor.number}. ${similar.attractor.name}`);
console.log(`      Exact matches: ${similar.exact.length}`);
console.log(`      Related: ${similar.related.length}`);

// ==========================================================================
// 7. Attractor Basin Analysis
// ==========================================================================
console.log('\n\n7. Attractor Basin Analysis');
console.log('   Measuring convergence patterns\n');

// Create random states and see which attractors they converge to
const basinCounts = new Map();

for (let i = 0; i < 20; i++) {
  const state = PrimeState.uniform();
  // Add some random perturbation
  for (const p of state.primes) {
    const phase = Math.random() * 2 * Math.PI;
    state.set(p, state.get(p).mul({ re: Math.cos(phase), im: Math.sin(phase) }));
  }
  state.normalize();
  
  const result = oracle.query(state);
  const key = result.attractor.number;
  basinCounts.set(key, (basinCounts.get(key) || 0) + 1);
}

console.log('   Distribution of 20 random states across attractors:');
const sorted = [...basinCounts.entries()].sort((a, b) => b[1] - a[1]);
sorted.slice(0, 5).forEach(([num, count]) => {
  const hex = HEXAGRAMS[num];
  const name = hex ? hex.name : `Hexagram ${num}`;
  console.log(`      ${num}. ${name}: ${count} states (${(count/20*100).toFixed(0)}%)`);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ✅ book.pdf Chapters 10 & 11 Oracle Demo Complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
