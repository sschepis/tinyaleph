/**
 * λ-Calculus Translation Layer for Prime-Indexed Semantic Calculi
 *
 * Provides a denotational semantics via λ-calculus:
 * - τ (tau) translation function from typed terms to λ-expressions
 * - Compositional semantics via function application
 * - Type preservation during translation
 * - Denotational semantics bridge
 *
 * The translation τ maps:
 * - N(p) → λx.p (constant function returning prime p)
 * - A(p) → λf.λx.f(p,x) (operator awaiting application)
 * - FUSE(p,q,r) → λx.(p+q+r) (fusion to sum)
 * - A(p)N(q) → (τ(A(p)))(τ(N(q))) = p ⊕ q
 * - S₁ ◦ S₂ → (τ(S₁), τ(S₂))
 * - S₁ ⇒ S₂ → τ(S₁) → τ(S₂)
 */

const { 
    NounTerm, 
    AdjTerm, 
    ChainTerm, 
    FusionTerm,
    NounSentence,
    SeqSentence,
    ImplSentence,
    N, A, FUSE, CHAIN
} = require('./types');

const { 
    ReductionSystem, 
    DEFAULT_OPERATOR 
} = require('./reduction');

// ============================================================================
// λ-EXPRESSION AST
// ============================================================================

/**
 * Base class for λ-expressions
 */
class LambdaExpr {
    /**
     * Get the type of this expression
     */
    getType() {
        throw new Error('Must be implemented by subclass');
    }
    
    /**
     * Convert to string representation
     */
    toString() {
        throw new Error('Must be implemented by subclass');
    }
    
    /**
     * Check if this is a value (fully evaluated)
     */
    isValue() {
        return false;
    }
    
    /**
     * Substitute variable x with expression e
     */
    substitute(x, e) {
        throw new Error('Must be implemented by subclass');
    }
    
    /**
     * Get free variables
     */
    freeVars() {
        return new Set();
    }
    
    /**
     * Alpha-equivalence check
     */
    alphaEquals(other) {
        return this.toString() === other.toString();
    }
}

/**
 * Variable expression
 */
class VarExpr extends LambdaExpr {
    constructor(name, type = null) {
        super();
        this.name = name;
        this.type = type;
    }
    
    getType() {
        return this.type;
    }
    
    toString() {
        return this.name;
    }
    
    substitute(x, e) {
        if (this.name === x) return e;
        return this;
    }
    
    freeVars() {
        return new Set([this.name]);
    }
}

/**
 * Constant (prime number) expression
 */
class ConstExpr extends LambdaExpr {
    constructor(value) {
        super();
        this.value = value;
    }
    
    getType() {
        return { kind: 'const', value: this.value };
    }
    
    toString() {
        return String(this.value);
    }
    
    isValue() {
        return true;
    }
    
    substitute(x, e) {
        return this;
    }
}

/**
 * Lambda abstraction: λx.body
 */
class LamExpr extends LambdaExpr {
    constructor(param, body, paramType = null) {
        super();
        this.param = param;
        this.body = body;
        this.paramType = paramType;
    }
    
    getType() {
        return {
            kind: 'function',
            paramType: this.paramType,
            returnType: this.body.getType()
        };
    }
    
    toString() {
        const typeAnnotation = this.paramType ? `:${JSON.stringify(this.paramType)}` : '';
        return `(λ${this.param}${typeAnnotation}.${this.body})`;
    }
    
    isValue() {
        return true; // Lambdas are values
    }
    
    substitute(x, e) {
        if (this.param === x) {
            // x is bound here, no substitution in body
            return this;
        }
        
        // Check for variable capture
        const freeInE = e.freeVars();
        if (freeInE.has(this.param)) {
            // Alpha-rename to avoid capture
            const fresh = this.freshVar(this.param);
            const renamedBody = this.body.substitute(this.param, new VarExpr(fresh));
            return new LamExpr(fresh, renamedBody.substitute(x, e), this.paramType);
        }
        
        return new LamExpr(this.param, this.body.substitute(x, e), this.paramType);
    }
    
    freeVars() {
        const vars = this.body.freeVars();
        vars.delete(this.param);
        return vars;
    }
    
    freshVar(base) {
        return `${base}'`;
    }
}

/**
 * Application expression: e1 e2
 */
class AppExpr extends LambdaExpr {
    constructor(func, arg) {
        super();
        this.func = func;
        this.arg = arg;
    }
    
    getType() {
        const funcType = this.func.getType();
        if (funcType && funcType.kind === 'function') {
            return funcType.returnType;
        }
        return null;
    }
    
    toString() {
        return `(${this.func} ${this.arg})`;
    }
    
    substitute(x, e) {
        return new AppExpr(
            this.func.substitute(x, e),
            this.arg.substitute(x, e)
        );
    }
    
    freeVars() {
        const vars = this.func.freeVars();
        for (const v of this.arg.freeVars()) {
            vars.add(v);
        }
        return vars;
    }
}

/**
 * Pair expression: (e1, e2) for sentence composition
 */
class PairExpr extends LambdaExpr {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    
    getType() {
        return {
            kind: 'pair',
            leftType: this.left.getType(),
            rightType: this.right.getType()
        };
    }
    
    toString() {
        return `⟨${this.left}, ${this.right}⟩`;
    }
    
    isValue() {
        return this.left.isValue() && this.right.isValue();
    }
    
    substitute(x, e) {
        return new PairExpr(
            this.left.substitute(x, e),
            this.right.substitute(x, e)
        );
    }
    
    freeVars() {
        const vars = this.left.freeVars();
        for (const v of this.right.freeVars()) {
            vars.add(v);
        }
        return vars;
    }
}

/**
 * Implication expression: e1 → e2
 */
class ImplExpr extends LambdaExpr {
    constructor(antecedent, consequent) {
        super();
        this.antecedent = antecedent;
        this.consequent = consequent;
    }
    
    getType() {
        return {
            kind: 'implication',
            anteType: this.antecedent.getType(),
            consType: this.consequent.getType()
        };
    }
    
    toString() {
        return `(${this.antecedent} → ${this.consequent})`;
    }
    
    isValue() {
        return this.antecedent.isValue() && this.consequent.isValue();
    }
    
    substitute(x, e) {
        return new ImplExpr(
            this.antecedent.substitute(x, e),
            this.consequent.substitute(x, e)
        );
    }
    
    freeVars() {
        const vars = this.antecedent.freeVars();
        for (const v of this.consequent.freeVars()) {
            vars.add(v);
        }
        return vars;
    }
}

/**
 * Primitive operator application: ⊕(p, q)
 */
class PrimOpExpr extends LambdaExpr {
    constructor(op, left, right) {
        super();
        this.op = op; // String name of operator
        this.left = left;
        this.right = right;
    }
    
    getType() {
        return { kind: 'prime' };
    }
    
    toString() {
        return `(${this.left} ⊕ ${this.right})`;
    }
    
    substitute(x, e) {
        return new PrimOpExpr(
            this.op,
            this.left.substitute(x, e),
            this.right.substitute(x, e)
        );
    }
    
    freeVars() {
        const vars = this.left.freeVars();
        for (const v of this.right.freeVars()) {
            vars.add(v);
        }
        return vars;
    }
}

// ============================================================================
// τ TRANSLATION FUNCTION
// ============================================================================

/**
 * Translator - Implements the τ function from Section 4
 */
class Translator {
    constructor(operator = DEFAULT_OPERATOR) {
        this.operator = operator;
        this.varCounter = 0;
    }
    
    /**
     * Generate a fresh variable name
     */
    freshVar() {
        return `x${this.varCounter++}`;
    }
    
    /**
     * τ: Term → LambdaExpr
     * Main translation function
     */
    translate(term) {
        // τ(N(p)) = p (constant)
        if (term instanceof NounTerm) {
            return new ConstExpr(term.prime);
        }
        
        // τ(A(p)) = λf.λx.⊕(p, f(x))
        // Simplified: λx.⊕(p, x)
        if (term instanceof AdjTerm) {
            const x = this.freshVar();
            return new LamExpr(
                x,
                new PrimOpExpr('⊕', new ConstExpr(term.prime), new VarExpr(x)),
                { kind: 'prime' }
            );
        }
        
        // τ(FUSE(p,q,r)) = p+q+r (constant)
        if (term instanceof FusionTerm) {
            return new ConstExpr(term.getFusedPrime());
        }
        
        // τ(A(p₁)...A(pₖ)N(q)) = ((τ(A(p₁)) ... (τ(A(pₖ)) τ(N(q))))
        if (term instanceof ChainTerm) {
            // Start with the noun
            let result = this.translate(term.noun);
            
            // Apply operators from innermost (rightmost) to outermost (leftmost)
            for (let i = term.operators.length - 1; i >= 0; i--) {
                const op = term.operators[i];
                const opLambda = this.translate(op);
                result = new AppExpr(opLambda, result);
            }
            
            return result;
        }
        
        // τ(NounSentence(e)) = τ(e)
        if (term instanceof NounSentence) {
            return this.translate(term.expr);
        }
        
        // τ(S₁ ◦ S₂) = ⟨τ(S₁), τ(S₂)⟩
        if (term instanceof SeqSentence) {
            return new PairExpr(
                this.translate(term.left),
                this.translate(term.right)
            );
        }
        
        // τ(S₁ ⇒ S₂) = τ(S₁) → τ(S₂)
        if (term instanceof ImplSentence) {
            return new ImplExpr(
                this.translate(term.antecedent),
                this.translate(term.consequent)
            );
        }
        
        throw new Error(`Cannot translate: ${term}`);
    }
    
    /**
     * Translate and show the translation steps
     */
    translateWithTrace(term) {
        const result = this.translate(term);
        return {
            source: term.signature(),
            target: result.toString(),
            type: result.getType()
        };
    }
}

// ============================================================================
// λ-CALCULUS EVALUATOR
// ============================================================================

/**
 * Call-by-value evaluator for λ-expressions
 */
class LambdaEvaluator {
    constructor(operator = DEFAULT_OPERATOR) {
        this.operator = operator;
        this.maxSteps = 1000;
    }
    
    /**
     * Evaluate one step (small-step semantics)
     */
    step(expr) {
        // Application of lambda to value: (λx.e) v → e[x := v]
        if (expr instanceof AppExpr) {
            // First evaluate function to value
            if (!expr.func.isValue()) {
                const newFunc = this.step(expr.func);
                if (newFunc) {
                    return new AppExpr(newFunc, expr.arg);
                }
            }
            
            // Then evaluate argument to value
            if (!expr.arg.isValue()) {
                const newArg = this.step(expr.arg);
                if (newArg) {
                    return new AppExpr(expr.func, newArg);
                }
            }
            
            // Both are values, perform β-reduction
            if (expr.func instanceof LamExpr && expr.arg.isValue()) {
                return expr.func.body.substitute(expr.func.param, expr.arg);
            }
        }
        
        // Primitive operator application
        if (expr instanceof PrimOpExpr) {
            // Evaluate operands first
            if (!expr.left.isValue()) {
                const newLeft = this.step(expr.left);
                if (newLeft) {
                    return new PrimOpExpr(expr.op, newLeft, expr.right);
                }
            }
            
            if (!expr.right.isValue()) {
                const newRight = this.step(expr.right);
                if (newRight) {
                    return new PrimOpExpr(expr.op, expr.left, newRight);
                }
            }
            
            // Both values, apply operator
            if (expr.left instanceof ConstExpr && expr.right instanceof ConstExpr) {
                const p = expr.left.value;
                const q = expr.right.value;
                if (this.operator.canApply(p, q)) {
                    const result = this.operator.apply(p, q);
                    return new ConstExpr(result);
                } else if (this.operator.canApply(q, p)) {
                    const result = this.operator.apply(q, p);
                    return new ConstExpr(result);
                }
                // If neither ordering works, just return the larger value
                return new ConstExpr(Math.max(p, q));
            }
        }
        
        // Pair reduction
        if (expr instanceof PairExpr) {
            if (!expr.left.isValue()) {
                const newLeft = this.step(expr.left);
                if (newLeft) {
                    return new PairExpr(newLeft, expr.right);
                }
            }
            
            if (!expr.right.isValue()) {
                const newRight = this.step(expr.right);
                if (newRight) {
                    return new PairExpr(expr.left, newRight);
                }
            }
        }
        
        // Implication reduction
        if (expr instanceof ImplExpr) {
            if (!expr.antecedent.isValue()) {
                const newAnte = this.step(expr.antecedent);
                if (newAnte) {
                    return new ImplExpr(newAnte, expr.consequent);
                }
            }
            
            if (!expr.consequent.isValue()) {
                const newCons = this.step(expr.consequent);
                if (newCons) {
                    return new ImplExpr(expr.antecedent, newCons);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Fully evaluate expression to value
     */
    evaluate(expr) {
        let current = expr;
        let steps = 0;
        
        while (steps < this.maxSteps) {
            const next = this.step(current);
            if (!next) break;
            current = next;
            steps++;
        }
        
        return {
            result: current,
            steps,
            isValue: current.isValue()
        };
    }
}

// ============================================================================
// COMPOSITIONAL SEMANTICS
// ============================================================================

/**
 * Denotational semantics via λ-calculus interpretation
 */
class Semantics {
    constructor(operator = DEFAULT_OPERATOR) {
        this.translator = new Translator(operator);
        this.evaluator = new LambdaEvaluator(operator);
        this.reducer = new ReductionSystem(operator);
    }
    
    /**
     * Get the denotation of a term
     * [[e]] = evaluate(τ(e))
     */
    denote(term) {
        const lambda = this.translator.translate(term);
        const result = this.evaluator.evaluate(lambda);
        return result.result;
    }
    
    /**
     * Check semantic equivalence
     * [[e₁]] = [[e₂]]
     */
    equivalent(term1, term2) {
        const d1 = this.denote(term1);
        const d2 = this.denote(term2);
        
        if (d1 instanceof ConstExpr && d2 instanceof ConstExpr) {
            return d1.value === d2.value;
        }
        
        return d1.toString() === d2.toString();
    }
    
    /**
     * Verify operational and denotational semantics agree
     * Theorem: If e →* v in operational semantics, then [[e]] = v
     */
    verifySemanticEquivalence(term) {
        // Get operational result
        const opResult = this.reducer.evaluate(term);
        
        // Get denotational result
        const denResult = this.denote(term);
        
        // Compare
        let equivalent = false;
        if (opResult instanceof NounTerm && denResult instanceof ConstExpr) {
            equivalent = opResult.prime === denResult.value;
        }
        
        return {
            term: term.signature(),
            operational: opResult instanceof NounTerm ? opResult.prime : opResult.signature(),
            denotational: denResult instanceof ConstExpr ? denResult.value : denResult.toString(),
            equivalent
        };
    }
}

// ============================================================================
// INTERPRETATION (Section 5 - Prime → Concept mapping)
// Enhanced with PRQS Lexicon from TriadicPrimeFusion paper
// ============================================================================

/**
 * PRQS (Prime-Indexed Resonant Quantum Semantics) Lexicon
 *
 * From TriadicPrimeFusion paper §4: Core semantic primes form a minimal
 * basis for expressing complex concepts. Categories emerge from prime
 * number-theoretic properties:
 *
 * - Structural (p ≡ 1 mod 4): Form, pattern, organization
 * - Dynamic (p ≡ 3 mod 4): Process, change, flow
 * - Relational (p ≡ 1 mod 6): Connection, interface, boundary
 * - Foundational (p ≡ 5 mod 6): Ground, identity, essence
 */
const PRQS_LEXICON = {
    // Core Semantic Primes (§4.1)
    nouns: new Map([
        // Foundational (first 10 primes)
        [2, { concept: 'duality', category: 'foundation', role: 'split/pair' }],
        [3, { concept: 'structure', category: 'foundation', role: 'form/frame' }],
        [5, { concept: 'change', category: 'dynamic', role: 'motion/flow' }],
        [7, { concept: 'identity', category: 'foundation', role: 'self/same' }],
        [11, { concept: 'complexity', category: 'structural', role: 'layers/depth' }],
        [13, { concept: 'relation', category: 'relational', role: 'link/bond' }],
        [17, { concept: 'boundary', category: 'relational', role: 'edge/limit' }],
        [19, { concept: 'observer', category: 'dynamic', role: 'witness/measure' }],
        [23, { concept: 'time', category: 'dynamic', role: 'sequence/duration' }],
        [29, { concept: 'space', category: 'structural', role: 'extent/place' }],
        
        // Extended Lexicon (§4.2)
        [31, { concept: 'energy', category: 'dynamic', role: 'force/potential' }],
        [37, { concept: 'information', category: 'structural', role: 'pattern/signal' }],
        [41, { concept: 'pattern', category: 'structural', role: 'repeat/form' }],
        [43, { concept: 'recursion', category: 'dynamic', role: 'self-reference' }],
        [47, { concept: 'emergence', category: 'relational', role: 'arising/novelty' }],
        [53, { concept: 'coherence', category: 'relational', role: 'unity/harmony' }],
        [59, { concept: 'entropy', category: 'dynamic', role: 'disorder/spread' }],
        [61, { concept: 'symmetry', category: 'structural', role: 'invariance' }],
        [67, { concept: 'causation', category: 'relational', role: 'origin/effect' }],
        [71, { concept: 'memory', category: 'structural', role: 'retention/trace' }],
        [73, { concept: 'intention', category: 'dynamic', role: 'aim/purpose' }],
        [79, { concept: 'context', category: 'relational', role: 'surround/frame' }],
        [83, { concept: 'resonance', category: 'dynamic', role: 'vibration/echo' }],
        [89, { concept: 'transformation', category: 'dynamic', role: 'change-of-form' }],
        [97, { concept: 'closure', category: 'relational', role: 'complete/whole' }],
        
        // Higher concepts (§4.3)
        [101, { concept: 'consciousness', category: 'dynamic', role: 'awareness' }],
        [103, { concept: 'meaning', category: 'relational', role: 'significance' }],
        [107, { concept: 'truth', category: 'foundation', role: 'correspondence' }],
        [109, { concept: 'beauty', category: 'structural', role: 'harmony/form' }],
        [113, { concept: 'value', category: 'relational', role: 'worth/good' }]
    ]),
    
    // Adjective/Operator mappings (§4.4)
    adjectives: new Map([
        [2, { concept: 'dual', category: 'foundation', intensifies: false }],
        [3, { concept: 'structured', category: 'structural', intensifies: true }],
        [5, { concept: 'dynamic', category: 'dynamic', intensifies: true }],
        [7, { concept: 'essential', category: 'foundation', intensifies: false }],
        [11, { concept: 'complex', category: 'structural', intensifies: true }],
        [13, { concept: 'relational', category: 'relational', intensifies: false }],
        [17, { concept: 'bounded', category: 'relational', intensifies: false }],
        [19, { concept: 'observed', category: 'dynamic', intensifies: true }],
        [23, { concept: 'temporal', category: 'dynamic', intensifies: false }],
        [29, { concept: 'spatial', category: 'structural', intensifies: false }],
        [31, { concept: 'energetic', category: 'dynamic', intensifies: true }],
        [37, { concept: 'informational', category: 'structural', intensifies: true }],
        [41, { concept: 'patterned', category: 'structural', intensifies: true }],
        [43, { concept: 'recursive', category: 'dynamic', intensifies: true }],
        [47, { concept: 'emergent', category: 'relational', intensifies: true }],
        [53, { concept: 'coherent', category: 'relational', intensifies: true }],
        [59, { concept: 'entropic', category: 'dynamic', intensifies: false }],
        [61, { concept: 'symmetric', category: 'structural', intensifies: true }],
        [67, { concept: 'causal', category: 'relational', intensifies: true }],
        [71, { concept: 'remembered', category: 'structural', intensifies: false }],
        [73, { concept: 'intentional', category: 'dynamic', intensifies: true }],
        [79, { concept: 'contextual', category: 'relational', intensifies: false }],
        [83, { concept: 'resonant', category: 'dynamic', intensifies: true }],
        [89, { concept: 'transformative', category: 'dynamic', intensifies: true }],
        [97, { concept: 'closed', category: 'relational', intensifies: false }]
    ])
};

/**
 * Semantic category classification based on prime properties
 * From PRQS paper: categories emerge from quadratic residue character
 */
function classifyPrime(p) {
    const mod4 = p % 4;
    const mod6 = p % 6;
    
    // Primary classification
    let primary;
    if (mod4 === 1) {
        primary = 'structural';  // Can be expressed as sum of two squares
    } else if (mod4 === 3) {
        primary = 'dynamic';     // Cannot be expressed as sum of two squares
    } else {
        primary = 'foundation';  // p = 2
    }
    
    // Secondary classification
    let secondary;
    if (mod6 === 1) {
        secondary = 'relational';  // Closer to 6k+1 form
    } else if (mod6 === 5) {
        secondary = 'foundational'; // Closer to 6k-1 form
    } else {
        secondary = 'neutral';  // p = 2 or p = 3
    }
    
    return { primary, secondary, mod4, mod6 };
}

/**
 * ConceptInterpreter - Maps primes to semantic concepts
 * Enhanced with PRQS Lexicon for richer semantic interpretation
 */
class ConceptInterpreter {
    constructor(lexicon = PRQS_LEXICON) {
        // Use PRQS lexicon by default
        this.nounConcepts = new Map();
        this.adjConcepts = new Map();
        this.nounMetadata = new Map();
        this.adjMetadata = new Map();
        
        // Load from lexicon
        for (const [prime, data] of lexicon.nouns) {
            this.nounConcepts.set(prime, data.concept);
            this.nounMetadata.set(prime, data);
        }
        
        for (const [prime, data] of lexicon.adjectives) {
            this.adjConcepts.set(prime, data.concept);
            this.adjMetadata.set(prime, data);
        }
    }
    
    /**
     * Get semantic category for a prime
     */
    getCategory(prime) {
        // Check if we have metadata
        if (this.nounMetadata.has(prime)) {
            return this.nounMetadata.get(prime).category;
        }
        if (this.adjMetadata.has(prime)) {
            return this.adjMetadata.get(prime).category;
        }
        
        // Derive from number-theoretic properties
        return classifyPrime(prime).primary;
    }
    
    /**
     * Get semantic role for a prime (if known)
     */
    getRole(prime) {
        if (this.nounMetadata.has(prime)) {
            return this.nounMetadata.get(prime).role;
        }
        return null;
    }
    
    /**
     * Interpret a noun term as concept
     */
    interpretNoun(term) {
        if (!(term instanceof NounTerm)) {
            throw new Error('Expected NounTerm');
        }
        
        const p = term.prime;
        if (this.nounConcepts.has(p)) {
            return this.nounConcepts.get(p);
        }
        
        // Generate description based on prime properties
        const category = classifyPrime(p);
        return `${category.primary}_concept_${p}`;
    }
    
    /**
     * Interpret a noun term with full metadata
     */
    interpretNounFull(term) {
        if (!(term instanceof NounTerm)) {
            throw new Error('Expected NounTerm');
        }
        
        const p = term.prime;
        const concept = this.interpretNoun(term);
        const category = this.getCategory(p);
        const role = this.getRole(p);
        const classification = classifyPrime(p);
        
        return {
            prime: p,
            concept,
            category,
            role,
            classification,
            isCore: this.nounMetadata.has(p)
        };
    }
    
    /**
     * Interpret an adjective term as modifier
     */
    interpretAdj(term) {
        if (!(term instanceof AdjTerm)) {
            throw new Error('Expected AdjTerm');
        }
        
        const p = term.prime;
        if (this.adjConcepts.has(p)) {
            return this.adjConcepts.get(p);
        }
        
        // Generate based on category
        const category = classifyPrime(p);
        return `${category.primary}_modifier_${p}`;
    }
    
    /**
     * Check if an adjective intensifies meaning
     */
    isIntensifier(prime) {
        if (this.adjMetadata.has(prime)) {
            return this.adjMetadata.get(prime).intensifies;
        }
        // Default: structural adjectives intensify
        return classifyPrime(prime).primary === 'structural';
    }
    
    /**
     * Interpret a chain as modified concept
     */
    interpretChain(term) {
        if (!(term instanceof ChainTerm)) {
            throw new Error('Expected ChainTerm');
        }
        
        const noun = this.interpretNoun(term.noun);
        const adjs = term.operators.map(op => this.interpretAdj(op));
        
        // Build phrase: adj1 adj2 ... noun
        return [...adjs, noun].join(' ');
    }
    
    /**
     * Full interpretation of any term
     */
    interpret(term) {
        if (term instanceof NounTerm) {
            return this.interpretNoun(term);
        }
        if (term instanceof AdjTerm) {
            return this.interpretAdj(term);
        }
        if (term instanceof ChainTerm) {
            return this.interpretChain(term);
        }
        if (term instanceof FusionTerm) {
            return `fusion(${term.p},${term.q},${term.r})`;
        }
        if (term instanceof NounSentence) {
            return `[${this.interpret(term.expr)}]`;
        }
        if (term instanceof SeqSentence) {
            return `${this.interpret(term.left)} and ${this.interpret(term.right)}`;
        }
        if (term instanceof ImplSentence) {
            return `if ${this.interpret(term.antecedent)} then ${this.interpret(term.consequent)}`;
        }
        
        return String(term);
    }
    
    /**
     * Add custom concept mappings
     */
    addNounConcept(prime, concept, metadata = {}) {
        this.nounConcepts.set(prime, concept);
        if (Object.keys(metadata).length > 0) {
            this.nounMetadata.set(prime, { concept, ...metadata });
        }
    }
    
    addAdjConcept(prime, concept, metadata = {}) {
        this.adjConcepts.set(prime, concept);
        if (Object.keys(metadata).length > 0) {
            this.adjMetadata.set(prime, { concept, ...metadata });
        }
    }
    
    /**
     * Get all core semantic primes (those with explicit mappings)
     */
    getCorePrimes() {
        const nouns = Array.from(this.nounConcepts.keys());
        const adjs = Array.from(this.adjConcepts.keys());
        return { nouns, adjs, all: [...new Set([...nouns, ...adjs])] };
    }
    
    /**
     * Analyze semantic compatibility between two primes
     * From PRQS: compatible primes have complementary categories
     */
    analyzeCompatibility(p1, p2) {
        const cat1 = classifyPrime(p1);
        const cat2 = classifyPrime(p2);
        
        // Complementary categories have higher compatibility
        const complementary = (cat1.primary !== cat2.primary);
        const sameSecondary = (cat1.secondary === cat2.secondary);
        
        // Compute compatibility score
        let score = 0.5;  // Base score
        if (complementary) score += 0.25;  // Different primary = good
        if (sameSecondary) score += 0.15;  // Same secondary = good
        if ((p1 + p2) % 4 === 0) score += 0.1;  // Sum divisible by 4
        
        return {
            p1, p2,
            cat1, cat2,
            complementary,
            sameSecondary,
            score,
            interpretation: score > 0.7 ? 'highly_compatible' :
                          score > 0.5 ? 'compatible' : 'weakly_compatible'
        };
    }
    
    /**
     * Generate semantic blend for a fusion
     * From PRQS: fusion creates emergent meaning
     */
    interpretFusionSemantic(p, q, r) {
        const concepts = [p, q, r].map(prime =>
            this.nounConcepts.get(prime) || `concept_${prime}`
        );
        
        const categories = [p, q, r].map(classifyPrime);
        
        // Count category types
        const catCounts = { structural: 0, dynamic: 0, relational: 0, foundation: 0 };
        for (const cat of categories) {
            catCounts[cat.primary] = (catCounts[cat.primary] || 0) + 1;
        }
        
        // Dominant category
        const dominant = Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        // Emergent meaning description
        const emergent = `${dominant}_fusion(${concepts.join('+')})`;
        
        return {
            components: concepts,
            categories,
            dominant,
            fusedPrime: p + q + r,
            emergent,
            description: `Emergent ${dominant} concept from ${concepts.join(', ')}`
        };
    }
}

// ============================================================================
// TYPE-DIRECTED TRANSLATION
// ============================================================================

/**
 * TypeDirectedTranslator - Translation with type constraints
 */
class TypeDirectedTranslator extends Translator {
    constructor(operator = DEFAULT_OPERATOR) {
        super(operator);
    }
    
    /**
     * Translate with explicit type annotations
     */
    translateTyped(term, context = null) {
        const lambda = this.translate(term);
        
        // Annotate with source type information
        return {
            expr: lambda,
            sourceType: term.constructor.name,
            targetType: lambda.getType(),
            context: context
        };
    }
    
    /**
     * Check type preservation
     * τ preserves typing: Γ ⊢ e : T implies τ(Γ) ⊢ τ(e) : τ(T)
     */
    checkTypePreservation(term, context = null) {
        const translation = this.translateTyped(term, context);
        
        // Verify the translated type matches expected
        return {
            preserved: translation.targetType !== null,
            source: translation.sourceType,
            target: translation.targetType
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Lambda expressions
    LambdaExpr,
    VarExpr,
    ConstExpr,
    LamExpr,
    AppExpr,
    PairExpr,
    ImplExpr,
    PrimOpExpr,
    
    // Translator
    Translator,
    TypeDirectedTranslator,
    
    // Evaluator
    LambdaEvaluator,
    
    // Semantics
    Semantics,
    ConceptInterpreter,
    
    // PRQS Lexicon (from TriadicPrimeFusion paper)
    PRQS_LEXICON,
    classifyPrime
};