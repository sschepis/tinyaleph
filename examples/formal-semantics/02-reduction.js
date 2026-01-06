/**
 * Example: Reduction Semantics and Strong Normalization
 *
 * Demonstrates the operational semantics:
 * - Small-step reduction (→)
 * - Prime-preserving operators (⊕)
 * - Strong normalization proof
 * - Confluence via Newman's Lemma
 * - Fusion canonicalization
 */

const {
    N, A, FUSE, CHAIN,
    ReductionSystem, ResonancePrimeOperator, NextPrimeOperator,
    isNormalForm, isReducible, termSize,
    FusionCanonicalizer, NormalFormVerifier,
    demonstrateStrongNormalization, testLocalConfluence
} = require('../../core');

console.log('=== Reduction Semantics and Strong Normalization ===\n');

// ============================================================================
// 1. Prime-Preserving Operators
// ============================================================================

console.log('1. PRIME-PRESERVING OPERATORS (⊕)\n');

const resonanceOp = new ResonancePrimeOperator();
const nextPrimeOp = new NextPrimeOperator();

console.log('Operator applicability (p < q required):');
console.log(`  3 ⊕ 7 applicable: ${resonanceOp.canApply(3, 7)}`);   // true
console.log(`  7 ⊕ 3 applicable: ${resonanceOp.canApply(7, 3)}`);   // false
console.log(`  4 ⊕ 7 applicable: ${resonanceOp.canApply(4, 7)}`);   // false (4 not prime)

console.log('\nResonance operator results:');
console.log(`  3 ⊕ 7 = ${resonanceOp.apply(3, 7)} (via resonance)`);
console.log(`  5 ⊕ 11 = ${resonanceOp.apply(5, 11)} (via resonance)`);
console.log(`  7 ⊕ 13 = ${resonanceOp.apply(7, 13)} (via resonance)`);

console.log('\nNext-prime operator results:');
console.log(`  3 ⊕ 7 = ${nextPrimeOp.apply(3, 7)} (next prime after 7+3)`);
console.log(`  5 ⊕ 11 = ${nextPrimeOp.apply(5, 11)} (next prime after 11+5)`);

// ============================================================================
// 2. Normal Form Detection
// ============================================================================

console.log('\n2. NORMAL FORM DETECTION\n');

const noun = N(7);
const chain = CHAIN([2, 3], N(7));
const fusion = FUSE(3, 5, 11);

console.log('Term analysis:');
console.log(`  N(7) - normal form: ${isNormalForm(noun)}, reducible: ${isReducible(noun)}`);
console.log(`  A(2)A(3)N(7) - normal form: ${isNormalForm(chain)}, reducible: ${isReducible(chain)}`);
console.log(`  FUSE(3,5,11) - normal form: ${isNormalForm(fusion)}, reducible: ${isReducible(fusion)}`);

console.log('\nTerm sizes (for termination measure):');
console.log(`  |N(7)| = ${termSize(noun)}`);
console.log(`  |A(3)| = ${termSize(A(3))}`);
console.log(`  |A(2)A(3)N(7)| = ${termSize(chain)}`);
console.log(`  |FUSE(3,5,11)| = ${termSize(fusion)}`);

// ============================================================================
// 3. Step-by-Step Reduction
// ============================================================================

console.log('\n3. STEP-BY-STEP REDUCTION\n');

const reducer = new ReductionSystem();

// Reduce a fusion term
console.log('Reducing FUSE(3, 5, 11):');
const fusionStep = reducer.step(fusion);
console.log(`  ${fusionStep.before} →[${fusionStep.rule}] ${fusionStep.after}`);
console.log(`  Result: N(${fusionStep.details.sum})`);

// Reduce an operator chain step by step
console.log('\nReducing A(2)A(3)N(7) step by step:');
const chainTerm = CHAIN([2, 3], N(7));
const trace = reducer.normalize(chainTerm);

console.log(`  Initial: ${trace.initial.signature()}`);
for (let i = 0; i < trace.steps.length; i++) {
    const step = trace.steps[i];
    console.log(`  Step ${i+1}: ${step.before.signature()} →[${step.rule}] ${step.after.signature()}`);
    if (step.details.operator) {
        console.log(`          (${step.details.operator} ⊕ ${step.details.operand} = ${step.details.result})`);
    }
}
console.log(`  Final: ${trace.final.signature()}`);

// ============================================================================
// 4. Full Evaluation
// ============================================================================

console.log('\n4. FULL EVALUATION\n');

const terms = [
    FUSE(3, 5, 11),
    CHAIN([2], N(7)),
    CHAIN([2, 3, 5], N(11)),
    FUSE(5, 7, 11)
];

console.log('Evaluating terms to normal form:');
for (const term of terms) {
    const result = reducer.evaluate(term);
    console.log(`  ${term.signature()} →* N(${result.prime})`);
}

// ============================================================================
// 5. Strong Normalization Proof
// ============================================================================

console.log('\n5. STRONG NORMALIZATION (Theorem 1)\n');

console.log('Lemma: If e → e\', then |e\'| < |e|');
console.log('This ensures termination - no infinite reduction sequences.\n');

const proofTerm = CHAIN([2, 3], N(7));
const proof = demonstrateStrongNormalization(proofTerm);

console.log(`Term: ${proof.term}`);
console.log(`Size sequence: [${proof.sizes.join(' > ')}]`);
console.log(`Strictly decreasing: ${proof.strictlyDecreasing}`);
console.log(`Normal form: ${proof.normalForm}`);
console.log(`Verified: ${proof.verified}`);

// ============================================================================
// 6. Confluence
// ============================================================================

console.log('\n6. CONFLUENCE (Theorem 2)\n');

console.log('By Newman\'s Lemma: SN + local confluence → confluence');
console.log('Different reduction orders always reach the same normal form.\n');

const confluenceTest = testLocalConfluence();
console.log(`All test cases confluent: ${confluenceTest.allConfluent}`);
for (const tc of confluenceTest.testCases) {
    console.log(`  ${tc.term} →* ${tc.normalForm}`);
}

// ============================================================================
// 7. Fusion Canonicalization
// ============================================================================

console.log('\n7. FUSION CANONICALIZATION\n');

const canonicalizer = new FusionCanonicalizer();

console.log('Finding canonical triads (d*(P)):');
const targetPrimes = [19, 23, 29, 31];

for (const P of targetPrimes) {
    const allTriads = canonicalizer.getTriads(P);
    const canonical = canonicalizer.selectCanonical(P);
    
    if (canonical) {
        console.log(`  P = ${P}: ${allTriads.length} triads, canonical = FUSE(${canonical.p}, ${canonical.q}, ${canonical.r})`);
    } else {
        console.log(`  P = ${P}: no valid triads`);
    }
}

// Show scoring
console.log('\nTriad scoring for P = 23:');
const triads23 = canonicalizer.getTriads(23);
for (const t of triads23.slice(0, 3)) {
    const score = canonicalizer.resonanceScore(t);
    console.log(`  FUSE(${t.p}, ${t.q}, ${t.r}) - score: ${score.toFixed(4)}`);
}

// ============================================================================
// 8. Normal Form Verification
// ============================================================================

console.log('\n8. NORMAL FORM VERIFICATION (NF_ok)\n');

const verifier = new NormalFormVerifier();

// Correct claims
console.log('Verifying normal form claims:');
console.log(`  NF_ok(FUSE(3,5,11), 19): ${verifier.verify(FUSE(3, 5, 11), 19)}`);
console.log(`  NF_ok(FUSE(5,7,11), 23): ${verifier.verify(FUSE(5, 7, 11), 23)}`);

// Incorrect claims
console.log(`  NF_ok(FUSE(3,5,11), 17): ${verifier.verify(FUSE(3, 5, 11), 17)}`);  // wrong

// Generate certificate
console.log('\nVerification certificate:');
const cert = verifier.certificate(CHAIN([2, 3], N(7)), N(7));
console.log(`  Term: ${cert.term}`);
console.log(`  Claimed: ${cert.claimed}`);
console.log(`  Actual: ${cert.actual}`);
console.log(`  Verified: ${cert.verified}`);
console.log(`  Steps: ${cert.steps}`);

console.log('\n=== Done ===');