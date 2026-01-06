/**
 * Example: ResoFormer (Resonant Field Transformer)
 * 
 * Demonstrates all ResoFormer ML primitives:
 * - Sparse Prime State with Quaternions (H_Q = H_P ⊗ ℍ)
 * - Resonant Attention Score (Jaccard + Quaternion + Phase)
 * - Hamilton Product Composition (Non-commutative)
 * - Coherence-Gated Halting (ACT-style)
 * - Entropy Collapse Head (64-codebook)
 * - PR-Graph Memory (put/get)
 * 
 * Based on the ResoFormer specification combining:
 * - PRSC (Prime Resonance Symbolic Computing)
 * - Quantum Semantics
 * - Quaternionic Memory Field (QMF)
 * - Prime Resonant Graph Database
 */

const {
  // Quaternion algebra
  Quaternion,
  
  // Sparse prime state
  SparsePrimeState,
  
  // Attention
  resonanceScore,
  resonantAttention,
  
  // Composition
  hamiltonCompose,
  measureNonCommutativity,
  
  // Halting
  computeCoherence,
  haltingDecision,
  coherenceGatedCompute,
  
  // Collapse
  EntropyCollapseHead,
  
  // Memory
  PRGraphMemory,
  
  // Operators
  applyResonanceOperator
} = require('../../modular');

console.log('═══════════════════════════════════════════════════════════════');
console.log('              RESOFORMER DEMONSTRATION');
console.log('         (Resonant Field Transformer Primitives)');
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================================
// 1. QUATERNION ALGEBRA
// ============================================================================
console.log('1. QUATERNION ALGEBRA (ℍ)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Hamilton product: (a₁ + b₁i + c₁j + d₁k) × (a₂ + b₂i + c₂j + d₂k)');
console.log('Key property: NON-COMMUTATIVE (q₁×q₂ ≠ q₂×q₁)');

const q1 = new Quaternion(1, 2, 3, 4);
const q2 = new Quaternion(5, 6, 7, 8);

console.log('\nq₁ =', q1.toString());
console.log('q₂ =', q2.toString());
console.log('\nq₁ × q₂ =', q1.mul(q2).toString());
console.log('q₂ × q₁ =', q2.mul(q1).toString());

const commutator = q1.commutator(q2);
console.log('\nCommutator [q₁, q₂] =', commutator.toString());
console.log('‖[q₁, q₂]‖ =', q1.commutatorNorm(q2).toFixed(4));
console.log('→ Non-zero commutator proves order sensitivity!');

// ============================================================================
// 2. SPARSE PRIME STATE (H_Q = H_P ⊗ ℍ)
// ============================================================================
console.log('\n\n2. SPARSE PRIME STATE (H_Q = H_P ⊗ ℍ)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('|Ψ_t⟩ = Σ_{p ∈ P_t} α_{t,p} · q_{t,p} · |p⟩');
console.log('  α_{t,p} ∈ ℂ (complex amplitude with phase)');
console.log('  q_{t,p} ∈ ℍ (quaternion orientation)');

const sentence1 = SparsePrimeState.fromHash('The cat sat on the mat');
const sentence2 = SparsePrimeState.fromHash('The dog ran in the park');
const sentence3 = SparsePrimeState.fromHash('The cat sat on the mat');  // Same as 1

console.log('\nSentence 1: "The cat sat on the mat"');
console.log('  Active primes (k=32):', sentence1.getActivePrimes().slice(0, 5).join(', '), '...');
console.log('  Entropy:', sentence1.entropy().toFixed(4));

console.log('\nSentence 2: "The dog ran in the park"');
console.log('  Active primes:', sentence2.getActivePrimes().slice(0, 5).join(', '), '...');
console.log('  Entropy:', sentence2.entropy().toFixed(4));

// ============================================================================
// 3. RESONANT ATTENTION SCORE
// ============================================================================
console.log('\n\n3. RESONANT ATTENTION SCORE');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Res(i,j) = α·Jaccard(P_i, P_j) + β·QuaternionAlign + γ·PhaseCoherence');

const score12 = resonanceScore(sentence1, sentence2);
const score13 = resonanceScore(sentence1, sentence3);
const score23 = resonanceScore(sentence2, sentence3);

console.log('\nResonance scores (attention kernel):');
console.log('  "cat on mat" ↔ "dog in park":', score12.toFixed(4));
console.log('  "cat on mat" ↔ "cat on mat":', score13.toFixed(4), '(identical)');
console.log('  "dog in park" ↔ "cat on mat":', score23.toFixed(4));

// ============================================================================
// 4. RESONANT ATTENTION MECHANISM
// ============================================================================
console.log('\n\n4. RESONANT ATTENTION MECHANISM');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Replaces dot-product attention with resonance-based scoring');

const query = SparsePrimeState.fromHash('What animal was sitting?');
const keys = [
  SparsePrimeState.fromHash('The cat sat quietly'),
  SparsePrimeState.fromHash('The dog was running'),
  SparsePrimeState.fromHash('The bird flew away')
];
const values = keys;  // Same as keys for this demo

const attention = resonantAttention(query, keys, values, 1.0);

console.log('\nQuery: "What animal was sitting?"');
console.log('Keys:');
console.log('  [0] "The cat sat quietly"');
console.log('  [1] "The dog was running"');
console.log('  [2] "The bird flew away"');
console.log('\nAttention weights (softmax of resonance scores):');
for (let i = 0; i < attention.weights.length; i++) {
  const bar = '█'.repeat(Math.round(attention.weights[i] * 20));
  console.log(`  [${i}] ${attention.weights[i].toFixed(4)} ${bar}`);
}

// ============================================================================
// 5. HAMILTON PRODUCT COMPOSITION (ORDER-SENSITIVE)
// ============================================================================
console.log('\n\n5. HAMILTON PRODUCT COMPOSITION');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Compose(A, B) ≠ Compose(B, A) via Hamilton product');

const eventA = SparsePrimeState.fromHash('Alice called Bob');
const eventB = SparsePrimeState.fromHash('Bob answered');

const AB = hamiltonCompose(eventA, eventB);
const BA = hamiltonCompose(eventB, eventA);

console.log('\nEvent A: "Alice called Bob"');
console.log('Event B: "Bob answered"');
console.log('\nCompose(A, B) active primes:', AB.getActivePrimes().slice(0, 5).join(', '));
console.log('Compose(B, A) active primes:', BA.getActivePrimes().slice(0, 5).join(', '));

const nonComm = measureNonCommutativity(eventA, eventB);
console.log('\nNon-commutativity measure:', nonComm.toFixed(4));
console.log('→ Captures "A then B" ≠ "B then A" in representation');

// ============================================================================
// 6. RESONANCE OPERATOR (PHASE ROTATION)
// ============================================================================
console.log('\n\n6. RESONANCE OPERATOR (PHASE ROTATION)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('R̂(n)|p⟩ = e^(2πi log_p(n))|p⟩');

const original = SparsePrimeState.fromHash('test state');
const rotated5 = applyResonanceOperator(original, 5);
const rotated7 = applyResonanceOperator(original, 7);

console.log('\nApplying R̂(n) with different n:');
console.log('  Original entropy:', original.entropy().toFixed(4));
console.log('  After R̂(5):', rotated5.entropy().toFixed(4));
console.log('  After R̂(7):', rotated7.entropy().toFixed(4));

const scoreOrigRot5 = resonanceScore(original, rotated5);
const scoreRot5Rot7 = resonanceScore(rotated5, rotated7);
console.log('\nResonance after rotation:');
console.log('  Original ↔ R̂(5):', scoreOrigRot5.toFixed(4));
console.log('  R̂(5) ↔ R̂(7):', scoreRot5Rot7.toFixed(4));

// ============================================================================
// 7. COHERENCE-GATED HALTING (ACT-STYLE)
// ============================================================================
console.log('\n\n7. COHERENCE-GATED HALTING (ACT-STYLE)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Time/compute happens when the field coheres: C(t) ≥ C_threshold');

const state = SparsePrimeState.fromHash('initial thought');
const coherence = computeCoherence(state);
console.log('\nInitial coherence:', coherence.toFixed(4));

const halt = haltingDecision(state, 0.6, 0.1);
console.log('Halting decision (threshold=0.6):');
console.log('  Coherence:', halt.coherence.toFixed(4));
console.log('  Halt probability:', halt.probability.toFixed(4));
console.log('  Should halt:', halt.halt ? 'YES' : 'NO');

// Simulate coherence-gated computation
const stepFn = (s, step) => applyResonanceOperator(s, step + 2);
const result = coherenceGatedCompute(state, stepFn, 50, 0.7);

console.log('\nCoherence-gated evolution:');
console.log('  Steps taken:', result.steps);
console.log('  Halted naturally:', result.halted ? 'YES' : 'NO');
console.log('  Final coherence:', result.haltHistory[result.haltHistory.length - 1].coherence.toFixed(4));

// ============================================================================
// 8. ENTROPY COLLAPSE HEAD (64-CODEBOOK)
// ============================================================================
console.log('\n\n8. ENTROPY COLLAPSE HEAD (64-CODEBOOK)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('64 attractor states (I-Ching style) with target entropy ~5.99 bits');

const collapseHead = new EntropyCollapseHead(5.99);

const testState = SparsePrimeState.fromHash('thinking about truth');

// Soft assignment (training mode)
const soft = collapseHead.softAssign(testState);
console.log('\nSoft assignment (training):');
console.log('  Entropy over attractors:', soft.entropy.toFixed(4));
console.log('  Top 3 probabilities:', soft.probs.slice(0, 3).map(p => p.toFixed(4)).join(', '));

// Hard assignment (inference mode)
const hard = collapseHead.hardAssign(testState);
console.log('\nHard assignment (inference):');
console.log('  Selected attractor:', hard.index);
console.log('  Confidence:', hard.confidence.toFixed(4));

// Entropy regularization
const entropyLoss = collapseHead.entropyLoss(testState);
console.log('\nEntropy regularization:');
console.log('  Target entropy:', collapseHead.targetEntropy.toFixed(2));
console.log('  Current loss:', entropyLoss.toFixed(4));

// ============================================================================
// 9. PR-GRAPH MEMORY (PERSISTENT CONTENT-ADDRESSABLE)
// ============================================================================
console.log('\n\n9. PR-GRAPH MEMORY (PERSISTENT CONTENT-ADDRESSABLE)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Prime-entropy hash → phase-code → resonance retrieval → CRT decode');

const memory = new PRGraphMemory(4096, 0.8);

// Store facts
const facts = [
  { key: 'fact1', text: 'Paris is the capital of France', type: 'geography' },
  { key: 'fact2', text: 'Python is a programming language', type: 'tech' },
  { key: 'fact3', text: 'The Eiffel Tower is in Paris', type: 'geography' },
  { key: 'fact4', text: 'JavaScript runs in browsers', type: 'tech' }
];

console.log('\nStoring facts:');
for (const fact of facts) {
  const state = SparsePrimeState.fromHash(fact.text);
  memory.put(fact.key, state, { text: fact.text, type: fact.type });
  console.log(`  [${fact.key}] "${fact.text}"`);
}

// Query for related facts
const query1 = SparsePrimeState.fromHash('capital city of France');
const results1 = memory.get(query1, 2);

console.log('\nQuery: "capital city of France"');
console.log('Top 2 results:');
for (const r of results1) {
  console.log(`  - [${r.key}] score=${r.score.toFixed(4)} "${r.metadata.text}"`);
}

const query2 = SparsePrimeState.fromHash('coding languages');
const results2 = memory.get(query2, 2);

console.log('\nQuery: "coding languages"');
console.log('Top 2 results:');
for (const r of results2) {
  console.log(`  - [${r.key}] score=${r.score.toFixed(4)} "${r.metadata.text}"`);
}

// Memory stats
const stats = memory.stats();
console.log('\nMemory statistics:');
console.log('  Total entries:', stats.total);
console.log('  Locked (stable):', stats.locked);
console.log('  Average entropy:', stats.avgEntropy.toFixed(4));

// ============================================================================
// 10. FULL RESOFORMER PIPELINE
// ============================================================================
console.log('\n\n10. FULL RESOFORMER PIPELINE');
console.log('─────────────────────────────────────────────────────────────────');
console.log('Input → Sparse Prime State → Resonant Attention → Hamilton Mix →');
console.log('       → Coherence-Gated Steps → Collapse → Memory Retrieval');

// Simulate a simple ResoFormer forward pass
const input = 'What is the meaning of existence?';
console.log('\nInput:', `"${input}"`);

// 1. Encode to sparse prime state
const inputState = SparsePrimeState.fromHash(input);
console.log('\n[1] Encode to H_Q:');
console.log('    Active primes:', inputState.getActivePrimes().length);
console.log('    Entropy:', inputState.entropy().toFixed(4));

// 2. Attend to context (simulated)
const context = [
  SparsePrimeState.fromHash('Life has no inherent meaning'),
  SparsePrimeState.fromHash('Meaning is created through action'),
  SparsePrimeState.fromHash('The universe is vast and mysterious')
];
const attnResult = resonantAttention(inputState, context, context);
console.log('\n[2] Resonant Attention:');
console.log('    Weights:', attnResult.weights.map(w => w.toFixed(3)).join(', '));

// 3. Hamilton composition
const composed = hamiltonCompose(inputState, attnResult.result);
console.log('\n[3] Hamilton Composition:');
console.log('    Composed entropy:', composed.entropy().toFixed(4));

// 4. Coherence-gated steps
const evolved = coherenceGatedCompute(composed, stepFn, 20, 0.6);
console.log('\n[4] Coherence-Gated Evolution:');
console.log('    Steps:', evolved.steps);
console.log('    Final coherence:', evolved.haltHistory[evolved.haltHistory.length - 1].coherence.toFixed(4));

// 5. Collapse to attractor
const collapsed = collapseHead.hardAssign(evolved.finalState);
console.log('\n[5] Entropy Collapse:');
console.log('    Attractor index:', collapsed.index);
console.log('    Confidence:', collapsed.confidence.toFixed(4));

// 6. Memory lookup
memory.put('input', inputState, { text: input });
const memResults = memory.get(evolved.finalState, 1);
console.log('\n[6] Memory Retrieval:');
if (memResults.length > 0) {
  console.log('    Best match:', memResults[0].key, 'score:', memResults[0].score.toFixed(4));
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    DEMONSTRATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nResoFormer = (Prime Sparse State) + (Quaternionic Attention) +');
console.log('             (Resonant Phase Rotations) + (Coherence Halting) +');
console.log('             (Entropy Collapse Head) + (PR-Graph Memory)');
console.log('\nState space: H_Q = H_P ⊗ ℍ');
console.log('════════════════════════════════════════════════════════════════\n');