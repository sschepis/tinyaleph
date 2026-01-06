/**
 * Example: Lambda Calculus Translation
 *
 * Demonstrates the τ translation:
 * - τ: Term → λ-expression
 * - Compositional semantics via function application
 * - Type preservation during translation
 * - Operational/denotational agreement
 */

const {
    N, A, FUSE, CHAIN, SENTENCE, SEQ, IMPL,
    Translator, LambdaEvaluator, Semantics, ConceptInterpreter,
    ConstExpr, LamExpr, VarExpr, AppExpr
} = require('../../core');

console.log('=== Lambda Calculus Translation ===\n');

// ============================================================================
// 1. Basic Translations
// ============================================================================

console.log('1. BASIC TRANSLATIONS (τ function)\n');

const translator = new Translator();

// τ(N(p)) = p (constant)
const noun = N(7);
const lambdaNoun = translator.translate(noun);
console.log(`τ(N(7)) = ${lambdaNoun.toString()}`);
console.log(`  Type: ${JSON.stringify(lambdaNoun.getType())}`);
console.log(`  Is value: ${lambdaNoun.isValue()}`);

// τ(A(p)) = λx.⊕(p, x)
const adj = A(3);
const lambdaAdj = translator.translate(adj);
console.log(`\nτ(A(3)) = ${lambdaAdj.toString()}`);
console.log(`  Type: ${JSON.stringify(lambdaAdj.getType())}`);

// τ(FUSE(p,q,r)) = p+q+r
const fusion = FUSE(3, 5, 11);
const lambdaFusion = translator.translate(fusion);
console.log(`\nτ(FUSE(3,5,11)) = ${lambdaFusion.toString()}`);
console.log(`  Value: ${lambdaFusion.value} (= 3 + 5 + 11)`);

// ============================================================================
// 2. Chain Translation
// ============================================================================

console.log('\n2. CHAIN TRANSLATION\n');

// τ(A(p₁)...A(pₖ)N(q)) = ((τ(A(p₁)) ... (τ(A(pₖ)) τ(N(q))))
const chain = CHAIN([2, 3], N(7));
const lambdaChain = translator.translate(chain);
console.log(`τ(${chain.signature()}):`);
console.log(`  = ${lambdaChain.toString()}`);

// Show the structure
console.log('\nStructure breakdown:');
console.log(`  τ(N(7)) = 7`);
console.log(`  τ(A(3)) = λx₀.(x₀ ⊕ 3)`);
console.log(`  τ(A(2)) = λx₁.(x₁ ⊕ 2)`);
console.log(`  Combined: ((λx₁.(x₁ ⊕ 2)) ((λx₀.(x₀ ⊕ 3)) 7))`);

// ============================================================================
// 3. Lambda Evaluation (β-reduction)
// ============================================================================

console.log('\n3. LAMBDA EVALUATION (β-reduction)\n');

const evaluator = new LambdaEvaluator();

// Simple examples
console.log('Evaluating λ-expressions:');

// (λx.x) 5 → 5
const identity = new LamExpr('x', new VarExpr('x'));
const app1 = new AppExpr(identity, new ConstExpr(5));
const result1 = evaluator.evaluate(app1);
console.log(`  (λx.x) 5 → ${result1.result.toString()} (${result1.steps} steps)`);

// (λx.x) (λy.y) → λy.y
const app2 = new AppExpr(identity, new LamExpr('y', new VarExpr('y')));
const result2 = evaluator.evaluate(app2);
console.log(`  (λx.x)(λy.y) → ${result2.result.toString()}`);

// Evaluating translated terms
console.log('\nEvaluating translated terms:');
const chainResult = evaluator.evaluate(lambdaChain);
console.log(`  τ(A(2)A(3)N(7)) → ${chainResult.result.toString()}`);
console.log(`  Steps: ${chainResult.steps}`);

// ============================================================================
// 4. Denotational Semantics
// ============================================================================

console.log('\n4. DENOTATIONAL SEMANTICS\n');

const semantics = new Semantics();

console.log('Computing denotations [[e]]:');

// [[FUSE(3,5,11)]] = 19
const d1 = semantics.denote(FUSE(3, 5, 11));
console.log(`  [[FUSE(3,5,11)]] = ${d1.value}`);

// [[N(7)]] = 7
const d2 = semantics.denote(N(7));
console.log(`  [[N(7)]] = ${d2.value}`);

// [[A(2)A(3)N(7)]]
const d3 = semantics.denote(CHAIN([2, 3], N(7)));
console.log(`  [[A(2)A(3)N(7)]] = ${d3.value || d3.toString()}`);

// ============================================================================
// 5. Semantic Equivalence
// ============================================================================

console.log('\n5. SEMANTIC EQUIVALENCE\n');

// Same terms should be equivalent
const f1 = FUSE(3, 5, 11);
const f2 = FUSE(3, 5, 11);
console.log(`[[FUSE(3,5,11)]] = [[FUSE(3,5,11)]]: ${semantics.equivalent(f1, f2)}`);

// Different fusions with same sum should be equivalent
const f3 = FUSE(5, 7, 7);  // Would be ill-formed (repeated prime)
console.log(`Different fusions summing to 19 are semantically equivalent if well-formed`);

// ============================================================================
// 6. Operational/Denotational Agreement
// ============================================================================

console.log('\n6. OPERATIONAL/DENOTATIONAL AGREEMENT\n');

console.log('Theorem: If e →* v (operational), then [[e]] = v (denotational)\n');

const terms = [
    FUSE(3, 5, 11),
    CHAIN([2], N(7)),
    CHAIN([2, 3, 5], N(11))
];

for (const term of terms) {
    const verification = semantics.verifySemanticEquivalence(term);
    console.log(`${term.signature()}:`);
    console.log(`  Operational: ${verification.operational}`);
    console.log(`  Denotational: ${verification.denotational}`);
    console.log(`  Agreement: ${verification.equivalent}`);
}

// ============================================================================
// 7. Concept Interpretation
// ============================================================================

console.log('\n7. CONCEPT INTERPRETATION\n');

const interpreter = new ConceptInterpreter();

console.log('Prime → Concept mappings:');
const conceptPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
for (const p of conceptPrimes) {
    const noun = N(p);
    const concept = interpreter.interpretNoun(noun);
    console.log(`  N(${p}) → "${concept}"`);
}

console.log('\nChain interpretation:');
const chain1 = CHAIN([2, 3], N(7));
const phrase1 = interpreter.interpretChain(chain1);
console.log(`  ${chain1.signature()} → "${phrase1}"`);

const chain2 = CHAIN([5, 7], N(11));
const phrase2 = interpreter.interpretChain(chain2);
console.log(`  ${chain2.signature()} → "${phrase2}"`);

// Custom concept mappings
console.log('\nCustom concept mappings:');
interpreter.addNounConcept(97, 'transcendence');
interpreter.addNounConcept(101, 'infinity');
console.log(`  N(97) → "${interpreter.interpretNoun(N(97))}"`);
console.log(`  N(101) → "${interpreter.interpretNoun(N(101))}"`);

// ============================================================================
// 8. Sentence Translation
// ============================================================================

console.log('\n8. SENTENCE TRANSLATION\n');

// Noun sentence
const s1 = SENTENCE(N(7));
const lambdaS1 = translator.translate(s1);
console.log(`τ(SENTENCE(N(7))) = ${lambdaS1.toString()}`);

// Sequential composition
const s2 = SENTENCE(N(11));
const seq = SEQ(s1, s2);
const lambdaSeq = translator.translate(seq);
console.log(`τ(S₁ ◦ S₂) = ${lambdaSeq.toString()}`);

// Implication
const impl = IMPL(s1, s2);
const lambdaImpl = translator.translate(impl);
console.log(`τ(S₁ ⇒ S₂) = ${lambdaImpl.toString()}`);

console.log('\n=== Done ===');