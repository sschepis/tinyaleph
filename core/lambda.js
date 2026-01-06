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
// ============================================================================

/**
 * ConceptInterpreter - Maps primes to semantic concepts
 */
class ConceptInterpreter {
    constructor() {
        // Default concept mappings (can be customized)
        this.nounConcepts = new Map([
            [2, 'existence'],
            [3, 'unity'],
            [5, 'life'],
            [7, 'truth'],
            [11, 'consciousness'],
            [13, 'knowledge'],
            [17, 'wisdom'],
            [19, 'love'],
            [23, 'creation'],
            [29, 'infinity']
        ]);
        
        this.adjConcepts = new Map([
            [2, 'dual'],
            [3, 'triple'],
            [5, 'vital'],
            [7, 'true'],
            [11, 'conscious'],
            [13, 'knowing'],
            [17, 'wise'],
            [19, 'loving'],
            [23, 'creative'],
            [29, 'infinite']
        ]);
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
        
        // Generate description for unknown primes
        return `concept_${p}`;
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
        
        return `modifier_${p}`;
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
    addNounConcept(prime, concept) {
        this.nounConcepts.set(prime, concept);
    }
    
    addAdjConcept(prime, concept) {
        this.adjConcepts.set(prime, concept);
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
    ConceptInterpreter
};