/**
 * Tests for Formal Semantics Implementation
 *
 * Tests coverage:
 * 1. Type system (core/types.js)
 * 2. Reduction semantics (core/reduction.js)
 * 3. Lambda calculus translation (core/lambda.js)
 * 4. Enochian vocabulary (enochian-vocabulary.js)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

// Core modules
const {
    // Types
    NounType, AdjType, SentenceType,
    NounTerm, AdjTerm, ChainTerm, FusionTerm,
    NounSentence, SeqSentence, ImplSentence,
    TypingContext, TypeChecker,
    N, A, FUSE, CHAIN, SENTENCE, SEQ, IMPL,
    
    // Reduction
    ReductionSystem, ResonancePrimeOperator, NextPrimeOperator,
    isNormalForm, isReducible, termSize,
    FusionCanonicalizer, NormalFormVerifier,
    demonstrateStrongNormalization, testLocalConfluence,
    
    // Lambda
    Translator, LambdaEvaluator, Semantics, ConceptInterpreter,
    ConstExpr, LamExpr, VarExpr, AppExpr
} = require('../core');

// Enochian vocabulary
const {
    ENOCHIAN_ALPHABET,
    letterToPrime,
    PRIME_BASIS,
    twistAngle,
    validateTwistClosure,
    TwistOperator,
    EnochianWord,
    CORE_VOCABULARY,
    THE_NINETEEN_CALLS,
    SedenionElement,
    EnochianEngine
} = require('../apps/sentient/lib/enochian-vocabulary');

// ============================================================================
// TYPE SYSTEM TESTS (mtspbc.pdf)
// ============================================================================

describe('Type System', function() {
    
    describe('NounTerm - N(p)', function() {
        it('should create noun terms with valid primes', function() {
            const n7 = N(7);
            assert.strictEqual(n7.prime, 7);
            // Type is 'N' (a string constant)
            assert.strictEqual(n7.type, 'N');
        });
        
        it('should reject non-prime numbers', function() {
            assert.throws(() => N(4), /requires prime/);
            assert.throws(() => N(1), /requires prime/);
        });
        
        it('should generate correct signature', function() {
            const n11 = N(11);
            assert.strictEqual(n11.signature(), 'N(11)');
        });
    });
    
    describe('AdjTerm - A(p)', function() {
        it('should create adjective terms', function() {
            const a3 = A(3);
            assert.strictEqual(a3.prime, 3);
        });
        
        it('should check applicability constraint p < q', function() {
            const a3 = A(3);
            const n7 = N(7);
            assert.ok(a3.canApplyTo(n7)); // 3 < 7
            
            const a11 = A(11);
            assert.ok(!a11.canApplyTo(n7)); // 11 > 7
        });
    });
    
    describe('ChainTerm - A(p₁)...A(pₖ)N(q)', function() {
        it('should create valid chains', function() {
            const chain = CHAIN([2, 3], N(7));
            assert.strictEqual(chain.operators.length, 2);
            assert.strictEqual(chain.noun.prime, 7);
        });
        
        it('should validate well-formedness (all operators < noun)', function() {
            const wellFormed = CHAIN([2, 3, 5], N(11));
            assert.ok(wellFormed.isWellFormed());
            
            const illFormed = CHAIN([2, 3, 13], N(11)); // 13 > 11
            assert.ok(!illFormed.isWellFormed());
        });
        
        it('should generate correct signature', function() {
            const chain = CHAIN([2, 3], N(7));
            const sig = chain.signature();
            // Signature contains operators and noun
            assert.ok(sig.includes('2'));
            assert.ok(sig.includes('3'));
            assert.ok(sig.includes('7'));
        });
    });
    
    describe('FusionTerm - FUSE(p,q,r)', function() {
        it('should create fusion terms', function() {
            const fusion = FUSE(3, 5, 11); // 3+5+11 = 19 (prime)
            assert.strictEqual(fusion.p, 3);
            assert.strictEqual(fusion.q, 5);
            assert.strictEqual(fusion.r, 11);
        });
        
        it('should check if sum is prime', function() {
            const validFusion = FUSE(3, 5, 11); // 19 is prime
            assert.ok(validFusion.isWellFormed());
            
            const invalidFusion = FUSE(2, 3, 5); // 10 is not prime
            assert.ok(!invalidFusion.isWellFormed());
        });
        
        it('should find valid triads for target prime', function() {
            const triads = FusionTerm.findTriads(19);
            assert.ok(triads.length > 0);
            // Check all triads sum to 19
            for (const t of triads) {
                assert.strictEqual(t.p + t.q + t.r, 19);
            }
        });
        
        it('should convert to NounTerm', function() {
            const fusion = FUSE(3, 5, 11);
            const noun = fusion.toNounTerm();
            assert.strictEqual(noun.prime, 19);
        });
    });
    
    describe('Sentence Types', function() {
        it('should create NounSentence', function() {
            const sent = SENTENCE(N(7));
            assert.ok(sent instanceof NounSentence);
        });
        
        it('should create SeqSentence (S₁ ◦ S₂)', function() {
            const s1 = SENTENCE(N(7));
            const s2 = SENTENCE(N(11));
            const seq = SEQ(s1, s2);
            assert.ok(seq instanceof SeqSentence);
        });
        
        it('should create ImplSentence (S₁ ⇒ S₂)', function() {
            const s1 = SENTENCE(N(7));
            const s2 = SENTENCE(N(11));
            const impl = IMPL(s1, s2);
            assert.ok(impl instanceof ImplSentence);
        });
    });
    
    describe('Type Checking', function() {
        it('should type check well-formed terms', function() {
            // TypeChecker provides inferType method
            const checker = new TypeChecker();
            const chain = CHAIN([2, 3], N(7));
            // Well-formed chain should have valid type
            assert.ok(chain.isWellFormed());
            // inferType returns 'N' for noun-typed terms
            assert.strictEqual(checker.inferType(chain), 'N');
        });
        
        it('should reject ill-formed terms', function() {
            const illFormed = CHAIN([2, 13], N(11)); // 13 > 11
            // The chain's isWellFormed should be false
            assert.ok(!illFormed.isWellFormed());
        });
    });
});

// ============================================================================
// REDUCTION SEMANTICS TESTS (ncpsc.pdf)
// ============================================================================

describe('Reduction Semantics', function() {
    
    describe('Prime-Preserving Operators', function() {
        it('should check applicability (p < q)', function() {
            const op = new ResonancePrimeOperator();
            assert.ok(op.canApply(3, 7));
            assert.ok(!op.canApply(7, 3));
            assert.ok(!op.canApply(4, 7)); // 4 not prime
        });
        
        it('should produce prime results', function() {
            const op = new NextPrimeOperator();
            const result = op.apply(3, 7);
            // Result should be prime
            const { isPrime } = require('../core/prime');
            assert.ok(isPrime(result));
        });
    });
    
    describe('Normal Form Detection', function() {
        it('should recognize NounTerm as normal form', function() {
            assert.ok(isNormalForm(N(7)));
        });
        
        it('should recognize ChainTerm as reducible', function() {
            const chain = CHAIN([2, 3], N(7));
            assert.ok(isReducible(chain));
        });
        
        it('should recognize FusionTerm as reducible', function() {
            const fusion = FUSE(3, 5, 11);
            assert.ok(isReducible(fusion));
        });
    });
    
    describe('Term Size Measure', function() {
        it('should compute size correctly', function() {
            assert.strictEqual(termSize(N(7)), 1);
            assert.strictEqual(termSize(A(3)), 1);
            assert.strictEqual(termSize(CHAIN([2, 3], N(7))), 3);
        });
    });
    
    describe('Reduction System', function() {
        const reducer = new ReductionSystem();
        
        it('should reduce FusionTerm to NounTerm', function() {
            const fusion = FUSE(3, 5, 11);
            const result = reducer.evaluate(fusion);
            assert.ok(result instanceof NounTerm);
            assert.strictEqual(result.prime, 19);
        });
        
        it('should reduce ChainTerm step by step', function() {
            const chain = CHAIN([2, 3], N(7));
            const trace = reducer.normalize(chain);
            
            // Should have multiple steps
            assert.ok(trace.steps.length >= 1);
            
            // Final result should be NounTerm
            assert.ok(trace.final instanceof NounTerm);
        });
        
        it('should handle empty chain (just noun)', function() {
            // Just evaluate a noun directly
            const noun = N(7);
            const result = reducer.evaluate(noun);
            // With no operators, should return the noun itself
            assert.strictEqual(result.prime, 7);
        });
    });
    
    describe('Strong Normalization (Theorem 1)', function() {
        it('should demonstrate strictly decreasing size', function() {
            const chain = CHAIN([2, 3], N(7));
            const proof = demonstrateStrongNormalization(chain);
            
            assert.ok(proof.strictlyDecreasing);
            assert.ok(proof.verified);
        });
    });
    
    describe('Confluence (Theorem 2)', function() {
        it('should pass local confluence tests', function() {
            const result = testLocalConfluence();
            assert.ok(result.allConfluent);
        });
    });
    
    describe('Fusion Canonicalization', function() {
        it('should select canonical triad', function() {
            const canonicalizer = new FusionCanonicalizer();
            const triad = canonicalizer.selectCanonical(19);
            
            assert.ok(triad !== null);
            assert.strictEqual(triad.p + triad.q + triad.r, 19);
        });
        
        it('should score triads by resonance', function() {
            const canonicalizer = new FusionCanonicalizer();
            const triads = canonicalizer.getTriads(23);
            
            if (triads.length > 1) {
                const score1 = canonicalizer.resonanceScore(triads[0]);
                const score2 = canonicalizer.resonanceScore(triads[1]);
                // Scores should be numbers
                assert.ok(typeof score1 === 'number');
                assert.ok(typeof score2 === 'number');
            }
        });
    });
    
    describe('Normal Form Verification', function() {
        it('should verify correct normal form claims', function() {
            const verifier = new NormalFormVerifier();
            const fusion = FUSE(3, 5, 11);
            
            assert.ok(verifier.verify(fusion, 19));
            assert.ok(!verifier.verify(fusion, 17)); // Wrong claim
        });
        
        it('should generate verification certificates', function() {
            const verifier = new NormalFormVerifier();
            const chain = CHAIN([2], N(7));
            const cert = verifier.certificate(chain, N(7)); // Wrong claim for demo
            
            assert.ok('verified' in cert);
            assert.ok('steps' in cert);
        });
    });
});

// ============================================================================
// LAMBDA CALCULUS TRANSLATION TESTS (Section 4)
// ============================================================================

describe('Lambda Calculus Translation', function() {
    
    describe('Translator (τ function)', function() {
        const translator = new Translator();
        
        it('should translate NounTerm to constant', function() {
            const noun = N(7);
            const lambda = translator.translate(noun);
            assert.ok(lambda instanceof ConstExpr);
            assert.strictEqual(lambda.value, 7);
        });
        
        it('should translate AdjTerm to lambda abstraction', function() {
            const adj = A(3);
            const lambda = translator.translate(adj);
            assert.ok(lambda instanceof LamExpr);
        });
        
        it('should translate FusionTerm to sum constant', function() {
            const fusion = FUSE(3, 5, 11);
            const lambda = translator.translate(fusion);
            assert.ok(lambda instanceof ConstExpr);
            assert.strictEqual(lambda.value, 19);
        });
        
        it('should translate ChainTerm to nested applications', function() {
            const chain = CHAIN([2, 3], N(7));
            const lambda = translator.translate(chain);
            assert.ok(lambda instanceof AppExpr);
        });
    });
    
    describe('Lambda Evaluator', function() {
        const evaluator = new LambdaEvaluator();
        
        it('should evaluate constants to themselves', function() {
            const c = new ConstExpr(7);
            const result = evaluator.evaluate(c);
            assert.ok(result.result instanceof ConstExpr);
            assert.strictEqual(result.result.value, 7);
        });
        
        it('should perform β-reduction', function() {
            // (λx.x) 5 → 5
            const identity = new LamExpr('x', new VarExpr('x'));
            const app = new AppExpr(identity, new ConstExpr(5));
            const result = evaluator.evaluate(app);
            assert.ok(result.result instanceof ConstExpr);
            assert.strictEqual(result.result.value, 5);
        });
    });
    
    describe('Semantics', function() {
        const semantics = new Semantics();
        
        it('should compute denotation of terms', function() {
            const fusion = FUSE(3, 5, 11);
            const denotation = semantics.denote(fusion);
            assert.ok(denotation instanceof ConstExpr);
            assert.strictEqual(denotation.value, 19);
        });
        
        it('should verify semantic equivalence', function() {
            // Same fusion terms should be equivalent
            const f1 = FUSE(3, 5, 11);
            const f2 = FUSE(3, 5, 11);
            assert.ok(semantics.equivalent(f1, f2));
        });
        
        it('should verify operational/denotational agreement', function() {
            const fusion = FUSE(3, 5, 11);
            const verification = semantics.verifySemanticEquivalence(fusion);
            assert.ok(verification.equivalent);
        });
    });
    
    describe('Concept Interpreter', function() {
        const interpreter = new ConceptInterpreter();
        
        it('should interpret noun terms', function() {
            const noun = N(7);
            const concept = interpreter.interpretNoun(noun);
            assert.strictEqual(concept, 'truth');
        });
        
        it('should interpret chain terms as phrases', function() {
            const chain = CHAIN([2, 3], N(7));
            const phrase = interpreter.interpretChain(chain);
            assert.ok(phrase.includes('truth'));
        });
        
        it('should support custom concept mappings', function() {
            interpreter.addNounConcept(97, 'custom_concept');
            const noun = N(97);
            const concept = interpreter.interpretNoun(noun);
            assert.strictEqual(concept, 'custom_concept');
        });
    });
});

// ============================================================================
// ENOCHIAN VOCABULARY TESTS (paper10)
// ============================================================================

describe('Enochian Vocabulary', function() {
    
    describe('Enochian Alphabet', function() {
        it('should have 21 letters', function() {
            assert.strictEqual(ENOCHIAN_ALPHABET.length, 21);
        });
        
        it('should map letters to primes', function() {
            assert.strictEqual(letterToPrime.get('A'), 2);
            assert.strictEqual(letterToPrime.get('D'), 7);
            assert.strictEqual(letterToPrime.get('Z'), 73);
        });
        
        it('should use prime numbers only', function() {
            const { isPrime } = require('../core/prime');
            for (const entry of ENOCHIAN_ALPHABET) {
                assert.ok(isPrime(entry.prime), `${entry.letter} maps to non-prime ${entry.prime}`);
            }
        });
    });
    
    describe('Prime Basis PE', function() {
        it('should have 7 elements', function() {
            assert.strictEqual(PRIME_BASIS.length, 7);
        });
        
        it('should be {7, 11, 13, 17, 19, 23, 29}', function() {
            assert.deepStrictEqual(PRIME_BASIS, [7, 11, 13, 17, 19, 23, 29]);
        });
    });
    
    describe('Twist Operations', function() {
        it('should calculate κ(p) = 360/p', function() {
            assert.strictEqual(twistAngle(7), 360 / 7);
            assert.strictEqual(twistAngle(11), 360 / 11);
        });
        
        it('should create twist operators', function() {
            const twist = new TwistOperator(7);
            assert.strictEqual(twist.prime, 7);
            assert.ok(Math.abs(twist.angle - 360/7) < 0.0001);
        });
        
        it('should validate twist closure', function() {
            // These primes should sum to roughly 360° for one revolution
            const result = validateTwistClosure([7, 11, 13, 17, 19, 23, 29]);
            assert.ok(typeof result.totalAngle === 'number');
            assert.ok(typeof result.valid === 'boolean');
        });
        
        it('should apply 2D rotation', function() {
            const twist = new TwistOperator(7);
            const rotated = twist.apply2D(1, 0);
            // After rotation, should have non-zero y
            assert.ok(Math.abs(rotated.y) > 0.01);
        });
    });
    
    describe('EnochianWord', function() {
        it('should parse word to primes', function() {
            const word = new EnochianWord('OL', 'I');
            assert.ok(word.primes.length === 2);
        });
        
        it('should calculate prime product', function() {
            const word = new EnochianWord('AB', 'test');
            assert.strictEqual(word.primeProduct, 2 * 3);
        });
        
        it('should calculate twist sum', function() {
            const word = new EnochianWord('DE', 'test');
            const expectedSum = twistAngle(7) + twistAngle(11);
            assert.ok(Math.abs(word.twistSum - expectedSum) < 0.0001);
        });
        
        it('should compute resonance between words', function() {
            const w1 = new EnochianWord('ZACAR', 'Move');
            const w2 = new EnochianWord('ZORGE', 'Be friendly');
            const res = w1.resonanceWith(w2);
            assert.ok(typeof res.resonanceScore === 'number');
            assert.ok(res.resonanceScore >= 0 && res.resonanceScore <= 1);
        });
    });
    
    describe('Core Vocabulary', function() {
        it('should have predefined words', function() {
            assert.ok(CORE_VOCABULARY.length > 0);
        });
        
        it('should include ZACAR', function() {
            const zacar = CORE_VOCABULARY.find(w => w.word === 'ZACAR');
            assert.ok(zacar);
            assert.strictEqual(zacar.meaning, 'Move');
        });
    });
    
    describe('The 19 Calls', function() {
        it('should have 19 calls', function() {
            assert.strictEqual(THE_NINETEEN_CALLS.length, 19);
        });
        
        it('should have numbered calls 1-19', function() {
            for (let i = 0; i < 19; i++) {
                assert.strictEqual(THE_NINETEEN_CALLS[i].number, i + 1);
            }
        });
        
        it('should compute twist closure for calls', function() {
            const call = THE_NINETEEN_CALLS[0];
            const closure = call.getTotalTwist();
            assert.ok('totalAngle' in closure);
            assert.ok('valid' in closure);
        });
    });
    
    describe('SedenionElement (16D)', function() {
        it('should have 16 components', function() {
            const sed = new SedenionElement();
            assert.strictEqual(sed.components.length, 16);
        });
        
        it('should create from word', function() {
            const word = new EnochianWord('OL', 'I');
            const sed = SedenionElement.fromWord(word);
            assert.ok(sed.norm() > 0);
        });
        
        it('should compute norm', function() {
            const sed = new SedenionElement([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            assert.strictEqual(sed.norm(), 1);
        });
        
        it('should add sedenions', function() {
            const s1 = new SedenionElement([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            const s2 = new SedenionElement([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            const sum = s1.add(s2);
            assert.strictEqual(sum.components[0], 3);
        });
        
        it('should apply twist transformation', function() {
            const sed = new SedenionElement([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            const twisted = sed.twist(7);
            // Norm should be preserved
            assert.ok(Math.abs(sed.norm() - twisted.norm()) < 0.0001);
        });
    });
    
    describe('EnochianEngine', function() {
        const engine = new EnochianEngine();
        
        it('should parse text to words', function() {
            const words = engine.parse('OL SONF');
            assert.strictEqual(words.length, 2);
        });
        
        it('should compute prime signature', function() {
            const sig = engine.primeSignature('OL');
            assert.ok(sig.length > 0);
        });
        
        it('should convert text to sedenion', function() {
            const sed = engine.toSedenion('ZACAR');
            assert.ok(sed instanceof SedenionElement);
            assert.ok(sed.norm() > 0);
        });
        
        it('should compute resonance between texts', function() {
            const res = engine.resonance('OL', 'SONF');
            assert.ok(typeof res === 'number');
        });
        
        it('should execute calls', function() {
            const result = engine.executeCall(1);
            assert.ok(result.call);
            assert.ok(result.sedenion instanceof SedenionElement);
        });
        
        it('should find resonant words', function() {
            const words = engine.findResonantWords(7);
            // Should find words containing the letter D (prime 7)
            assert.ok(Array.isArray(words));
        });
        
        it('should compute basis decomposition', function() {
            const decomp = engine.basisDecomposition('ZACAR');
            assert.ok('basisCounts' in decomp);
            assert.ok('basisRatio' in decomp);
        });
    });
});
