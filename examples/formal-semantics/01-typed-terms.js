/**
 * Example: Typed Terms in Prime-Indexed Semantic Calculi
 *
 * Demonstrates the formal type system:
 * - N(p): Noun terms indexed by prime
 * - A(p): Adjective/operator terms
 * - Operator application with p < q constraint
 * - Triadic fusion FUSE(p,q,r)
 */

const {
    N, A, FUSE, CHAIN, SENTENCE, SEQ, IMPL,
    NounTerm, AdjTerm, ChainTerm, FusionTerm,
    TypeChecker
} = require('../../core');

console.log('=== Typed Terms in Prime-Indexed Semantic Calculi ===\n');

// ============================================================================
// 1. Basic Term Construction
// ============================================================================

console.log('1. BASIC TERM CONSTRUCTION\n');

// Noun terms - N(p)
const truth = N(7);      // N(7) - "truth" (semantic meaning)
const light = N(11);     // N(11) - "light/illumination"
const wisdom = N(17);    // N(17) - "wisdom"

console.log(`Noun terms:`);
console.log(`  N(7)  = ${truth.signature()}`);
console.log(`  N(11) = ${light.signature()}`);
console.log(`  N(17) = ${wisdom.signature()}`);
console.log(`  All well-formed: ${truth.isWellFormed() && light.isWellFormed() && wisdom.isWellFormed()}`);

// Adjective terms - A(p)
const dual = A(2);       // A(2) - "dual" modifier
const triple = A(3);     // A(3) - "triple" modifier
const vital = A(5);      // A(5) - "vital" modifier

console.log(`\nAdjective terms:`);
console.log(`  A(2) = ${dual.signature()}`);
console.log(`  A(3) = ${triple.signature()}`);
console.log(`  A(5) = ${vital.signature()}`);

// ============================================================================
// 2. Operator Application with Ordering Constraint
// ============================================================================

console.log('\n2. OPERATOR APPLICATION (p < q constraint)\n');

// A(p) can apply to N(q) only if p < q
console.log(`Can A(3) apply to N(7)? ${triple.canApplyTo(truth)}`);   // true: 3 < 7
console.log(`Can A(5) apply to N(7)? ${vital.canApplyTo(truth)}`);    // true: 5 < 7
console.log(`Can A(11) apply to N(7)? ${A(11).canApplyTo(truth)}`);   // false: 11 > 7

// Building operator chains
const modified = CHAIN([2, 3, 5], N(7));  // A(2)A(3)A(5)N(7)
console.log(`\nChain: ${modified.toString()}`);
console.log(`Signature: ${modified.signature()}`);
console.log(`Well-formed: ${modified.isWellFormed()}`);  // true: all primes < 7

// Ill-formed chain (violates constraint)
const illFormed = CHAIN([2, 11], N(7));  // A(2)A(11)N(7) - 11 > 7
console.log(`\nIll-formed chain: ${illFormed.toString()}`);
console.log(`Well-formed: ${illFormed.isWellFormed()}`);  // false

// ============================================================================
// 3. Triadic Fusion
// ============================================================================

console.log('\n3. TRIADIC FUSION - FUSE(p, q, r)\n');

// FUSE(p,q,r) is well-formed when:
// 1. p, q, r are distinct odd primes
// 2. p + q + r is prime

const fusion1 = FUSE(3, 5, 11);  // 3 + 5 + 11 = 19 (prime)
console.log(`FUSE(3, 5, 11):`);
console.log(`  Signature: ${fusion1.signature()}`);
console.log(`  Well-formed: ${fusion1.isWellFormed()}`);
console.log(`  Fused prime: ${fusion1.getFusedPrime()}`);

const fusion2 = FUSE(5, 7, 11);  // 5 + 7 + 11 = 23 (prime)
console.log(`\nFUSE(5, 7, 11):`);
console.log(`  Signature: ${fusion2.signature()}`);
console.log(`  Well-formed: ${fusion2.isWellFormed()}`);
console.log(`  Fused prime: ${fusion2.getFusedPrime()}`);

// Invalid fusion (sum not prime)
const invalidFusion = FUSE(2, 3, 5);  // 2 + 3 + 5 = 10 (not prime)
console.log(`\nFUSE(2, 3, 5):`);
console.log(`  Well-formed: ${invalidFusion.isWellFormed()}`);  // false

// Find all valid triads for a target prime
console.log(`\nValid triads for prime 29:`);
const triads = FusionTerm.findTriads(29);
triads.slice(0, 5).forEach(t => {
    console.log(`  ${t.signature()} → ${t.p + t.q + t.r}`);
});

// ============================================================================
// 4. Sentence Composition
// ============================================================================

console.log('\n4. SENTENCE COMPOSITION\n');

// NounSentence - lift noun expression to sentence level
const s1 = SENTENCE(N(7));      // [N(7)]
const s2 = SENTENCE(N(11));     // [N(11)]

console.log(`Noun sentences:`);
console.log(`  S₁ = ${s1.signature()}`);
console.log(`  S₂ = ${s2.signature()}`);

// Sequential composition: S₁ ◦ S₂
const seq = SEQ(s1, s2);
console.log(`\nSequential composition (◦):`);
console.log(`  S₁ ◦ S₂ = ${seq.signature()}`);
console.log(`  Discourse state: [${seq.getDiscourseState().join(', ')}]`);

// Implication: S₁ ⇒ S₂
const impl = IMPL(s1, s2);
console.log(`\nImplication (⇒):`);
console.log(`  S₁ ⇒ S₂ = ${impl.signature()}`);

// ============================================================================
// 5. Type Checking
// ============================================================================

console.log('\n5. TYPE CHECKING\n');

const checker = new TypeChecker();

// Check various terms
const terms = [
    N(7),
    A(3),
    CHAIN([2, 3], N(7)),
    FUSE(3, 5, 11),
    SENTENCE(N(7))
];

console.log(`Type inference:`);
for (const term of terms) {
    const type = checker.inferType(term);
    console.log(`  ${term.signature()} : ${type}`);
}

// Typing judgment derivation
const judgment = checker.derive(CHAIN([2, 3], N(7)));
console.log(`\nTyping judgment:`);
console.log(`  ${judgment.toString()}`);
console.log(`  Valid: ${judgment.isValid()}`);

console.log('\n=== Done ===');