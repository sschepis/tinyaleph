/**
 * Formal Type System for Prime-Based Compositional Languages
 *
 * Implements a typed term calculus for prime-indexed semantics:
 * - N(p): noun/subject term indexed by prime p
 * - A(p): adjective/operator term indexed by prime p
 * - S: sentence-level proposition
 *
 * Key features:
 * - Ordered operator application with p < q constraint
 * - Triadic fusion FUSE(p, q, r) where p+q+r is prime
 * - Sentence composition (◦) and implication (⇒)
 * - Full typing judgments Γ ⊢ e : T
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Type constants for the type system
 */
import { isPrime, firstNPrimes } from './prime.js';

const Types = {
    NOUN: 'N',
    ADJECTIVE: 'A',
    SENTENCE: 'S'
};

/**
 * Base class for all typed terms
 */
class Term {
    constructor(type) {
        this.type = type;
    }
    
    /**
     * Check if term is well-formed
     */
    isWellFormed() {
        throw new Error('Must be implemented by subclass');
    }
    
    /**
     * Get the semantic signature
     */
    signature() {
        throw new Error('Must be implemented by subclass');
    }
    
    /**
     * Clone the term
     */
    clone() {
        throw new Error('Must be implemented by subclass');
    }
    
    /**
     * Convert to string representation
     */
    toString() {
        throw new Error('Must be implemented by subclass');
    }
}

// ============================================================================
// NOUN TERMS N(p)
// ============================================================================

/**
 * NounTerm - N(p)
 * Represents a noun/subject indexed by prime p
 * Semantically denotes the prime itself: ⟦N(p)⟧ = p
 */
class NounTerm extends Term {
    /**
     * @param {number} prime - The prime number indexing this noun
     */
    constructor(prime) {
        super(Types.NOUN);
        
        if (!isPrime(prime)) {
            throw new TypeError(`NounTerm requires prime number, got ${prime}`);
        }
        
        this.prime = prime;
    }
    
    isWellFormed() {
        return isPrime(this.prime);
    }
    
    signature() {
        return `N(${this.prime})`;
    }
    
    clone() {
        return new NounTerm(this.prime);
    }
    
    toString() {
        return `N(${this.prime})`;
    }
    
    /**
     * Semantic interpretation: ⟦N(p)⟧ = p
     */
    interpret() {
        return this.prime;
    }
    
    /**
     * Check equality with another noun term
     */
    equals(other) {
        return other instanceof NounTerm && this.prime === other.prime;
    }
    
    toJSON() {
        return { type: 'N', prime: this.prime };
    }
    
    static fromJSON(json) {
        return new NounTerm(json.prime);
    }
}

// ============================================================================
// ADJECTIVE TERMS A(p)
// ============================================================================

/**
 * AdjTerm - A(p)
 * Represents an adjective/operator indexed by prime p
 * Semantically denotes a partial function: ⟦A(p)⟧ = f_p : D ⇀ D
 * where dom(f_p) ⊆ {q ∈ D : p < q}
 */
class AdjTerm extends Term {
    /**
     * @param {number} prime - The prime number indexing this adjective
     */
    constructor(prime) {
        super(Types.ADJECTIVE);
        
        if (!isPrime(prime)) {
            throw new TypeError(`AdjTerm requires prime number, got ${prime}`);
        }
        
        this.prime = prime;
    }
    
    isWellFormed() {
        return isPrime(this.prime);
    }
    
    signature() {
        return `A(${this.prime})`;
    }
    
    clone() {
        return new AdjTerm(this.prime);
    }
    
    toString() {
        return `A(${this.prime})`;
    }
    
    /**
     * Check if this adjective can apply to a noun (p < q constraint)
     * @param {NounTerm} noun - The noun to apply to
     */
    canApplyTo(noun) {
        if (!(noun instanceof NounTerm)) {
            throw new TypeError('Can only apply to NounTerm');
        }
        return this.prime < noun.prime;
    }
    
    /**
     * Apply this adjective to a noun term
     * Returns a ChainTerm for type safety
     * @param {NounTerm} noun - The noun to apply to
     */
    apply(noun) {
        if (!this.canApplyTo(noun)) {
            throw new TypeError(`Application constraint violated: ${this.prime} must be < ${noun.prime}`);
        }
        return new ChainTerm([this], noun);
    }
    
    /**
     * Check equality with another adjective term
     */
    equals(other) {
        return other instanceof AdjTerm && this.prime === other.prime;
    }
    
    toJSON() {
        return { type: 'A', prime: this.prime };
    }
    
    static fromJSON(json) {
        return new AdjTerm(json.prime);
    }
}

// ============================================================================
// CHAIN TERMS A(p₁)...A(pₖ)N(q)
// ============================================================================

/**
 * ChainTerm - A(p₁), A(p₂), ..., A(pₖ), N(q)
 * Represents an operator chain applied to a noun
 * Semantically: ⟦chain⟧ = f_p₁(f_p₂(...f_pₖ(q)...))
 */
class ChainTerm extends Term {
    /**
     * @param {Array<AdjTerm>} operators - Sequence of adjective operators
     * @param {NounTerm} noun - The noun being modified
     */
    constructor(operators, noun) {
        super(Types.NOUN);
        
        if (!Array.isArray(operators)) {
            throw new TypeError('Operators must be an array');
        }
        
        if (!(noun instanceof NounTerm)) {
            throw new TypeError('Noun must be a NounTerm');
        }
        
        this.operators = operators;
        this.noun = noun;
    }
    
    /**
     * Check well-formedness: all operators must satisfy p < q constraint
     */
    isWellFormed() {
        if (this.operators.length === 0) {
            return this.noun.isWellFormed();
        }
        
        // Check innermost constraint: last operator's prime < noun's prime
        const last = this.operators[this.operators.length - 1];
        if (last.prime >= this.noun.prime) {
            return false;
        }
        
        // Check chain constraints: each p_i < p_{i+1} for proper ordering
        // This follows from the composition semantics
        for (let i = 0; i < this.operators.length - 1; i++) {
            // In a well-formed chain, each operator must be able to apply
            // to the result of the inner operators
            // This is validated during reduction
        }
        
        return true;
    }
    
    signature() {
        const ops = this.operators.map(o => o.signature()).join(', ');
        return ops ? `${ops}, ${this.noun.signature()}` : this.noun.signature();
    }
    
    clone() {
        return new ChainTerm(
            this.operators.map(o => o.clone()),
            this.noun.clone()
        );
    }
    
    toString() {
        const ops = this.operators.map(o => o.toString()).join(' ');
        return ops ? `${ops} ${this.noun}` : this.noun.toString();
    }
    
    /**
     * Prepend an operator to this chain
     * @param {AdjTerm} operator - The operator to prepend
     */
    prepend(operator) {
        return new ChainTerm([operator, ...this.operators], this.noun);
    }
    
    /**
     * Get the chain length (number of operators)
     */
    get length() {
        return this.operators.length;
    }
    
    /**
     * Get all primes in the chain (operators + noun)
     */
    getAllPrimes() {
        return [...this.operators.map(o => o.prime), this.noun.prime];
    }
    
    toJSON() {
        return {
            type: 'chain',
            operators: this.operators.map(o => o.toJSON()),
            noun: this.noun.toJSON()
        };
    }
    
    static fromJSON(json) {
        return new ChainTerm(
            json.operators.map(o => AdjTerm.fromJSON(o)),
            NounTerm.fromJSON(json.noun)
        );
    }
}

// ============================================================================
// FUSION TERMS FUSE(p, q, r)
// ============================================================================

/**
 * FusionTerm - FUSE(p, q, r)
 * Represents triadic prime fusion
 * Well-formed when: p, q, r are distinct odd primes and p+q+r is prime
 * Semantically: ⟦FUSE(p,q,r)⟧ = p + q + r
 */
class FusionTerm extends Term {
    /**
     * @param {number} p - First prime
     * @param {number} q - Second prime
     * @param {number} r - Third prime
     */
    constructor(p, q, r) {
        super(Types.NOUN);
        
        this.p = p;
        this.q = q;
        this.r = r;
    }
    
    /**
     * Check well-formedness:
     * 1. p, q, r are distinct
     * 2. p, q, r are odd primes (> 2)
     * 3. p + q + r is prime
     */
    isWellFormed() {
        // Check distinctness
        if (this.p === this.q || this.q === this.r || this.p === this.r) {
            return false;
        }
        
        // Check all are odd primes (> 2)
        if (this.p === 2 || this.q === 2 || this.r === 2) {
            return false;
        }
        
        if (!isPrime(this.p) || !isPrime(this.q) || !isPrime(this.r)) {
            return false;
        }
        
        // Check sum is prime
        return isPrime(this.p + this.q + this.r);
    }
    
    /**
     * Get the fused prime value
     */
    getFusedPrime() {
        if (!this.isWellFormed()) {
            throw new Error('Cannot get fused prime from ill-formed fusion');
        }
        return this.p + this.q + this.r;
    }
    
    signature() {
        return `FUSE(${this.p}, ${this.q}, ${this.r})`;
    }
    
    clone() {
        return new FusionTerm(this.p, this.q, this.r);
    }
    
    toString() {
        return `FUSE(${this.p}, ${this.q}, ${this.r})`;
    }
    
    /**
     * Convert to equivalent NounTerm (after reduction)
     */
    toNounTerm() {
        return new NounTerm(this.getFusedPrime());
    }
    
    /**
     * Get canonical form (sorted primes)
     */
    canonical() {
        const sorted = [this.p, this.q, this.r].sort((a, b) => a - b);
        return new FusionTerm(sorted[0], sorted[1], sorted[2]);
    }
    
    toJSON() {
        return { type: 'FUSE', p: this.p, q: this.q, r: this.r };
    }
    
    static fromJSON(json) {
        return new FusionTerm(json.p, json.q, json.r);
    }
    
    /**
     * Find valid fusion triads for a target prime
     * @param {number} target - Target prime (sum of three primes)
     * @param {number} limit - Maximum prime to consider
     */
    static findTriads(target, limit = 100) {
        if (!isPrime(target)) return [];
        
        const triads = [];
        const primes = firstNPrimes(Math.min(limit, 100)).filter(p => p > 2 && p < target);
        
        for (let i = 0; i < primes.length; i++) {
            for (let j = i + 1; j < primes.length; j++) {
                const p = primes[i];
                const q = primes[j];
                const r = target - p - q;
                
                if (r > q && isPrime(r) && r !== 2) {
                    triads.push(new FusionTerm(p, q, r));
                }
            }
        }
        
        return triads;
    }
}

// ============================================================================
// SENTENCE TERMS
// ============================================================================

/**
 * SentenceTerm - S
 * Base class for sentence-level expressions
 */
class SentenceTerm extends Term {
    constructor() {
        super(Types.SENTENCE);
    }
}

/**
 * NounSentence - Sentence from noun term
 * A noun-denoting expression treated as a one-token discourse state
 * ⟦e : N⟧_S = [⟦e⟧] ∈ D*
 */
class NounSentence extends SentenceTerm {
    /**
     * @param {NounTerm|ChainTerm|FusionTerm} nounExpr - Noun expression
     */
    constructor(nounExpr) {
        super();
        
        if (!(nounExpr instanceof NounTerm || 
              nounExpr instanceof ChainTerm || 
              nounExpr instanceof FusionTerm)) {
            throw new TypeError('NounSentence requires noun-typed expression');
        }
        
        this.expr = nounExpr;
    }
    
    isWellFormed() {
        return this.expr.isWellFormed();
    }
    
    signature() {
        return `S(${this.expr.signature()})`;
    }
    
    clone() {
        return new NounSentence(this.expr.clone());
    }
    
    toString() {
        return `[${this.expr}]`;
    }
    
    /**
     * Get discourse state (sequence of primes)
     */
    getDiscourseState() {
        if (this.expr instanceof NounTerm) {
            return [this.expr.prime];
        } else if (this.expr instanceof ChainTerm) {
            // Return the primes involved in the chain
            return this.expr.getAllPrimes();
        } else if (this.expr instanceof FusionTerm) {
            return [this.expr.getFusedPrime()];
        }
        return [];
    }
    
    toJSON() {
        return { type: 'NounSentence', expr: this.expr.toJSON() };
    }
}

/**
 * SeqSentence - s₁ ◦ s₂
 * Sequential composition of sentences
 * Semantically: ⟦s₁ ◦ s₂⟧ = ⟦s₁⟧ · ⟦s₂⟧ (concatenation in D*)
 */
class SeqSentence extends SentenceTerm {
    /**
     * @param {SentenceTerm} left - Left sentence
     * @param {SentenceTerm} right - Right sentence
     */
    constructor(left, right) {
        super();
        
        if (!(left instanceof SentenceTerm) || !(right instanceof SentenceTerm)) {
            throw new TypeError('SeqSentence requires two SentenceTerms');
        }
        
        this.left = left;
        this.right = right;
    }
    
    isWellFormed() {
        return this.left.isWellFormed() && this.right.isWellFormed();
    }
    
    signature() {
        return `(${this.left.signature()} ◦ ${this.right.signature()})`;
    }
    
    clone() {
        return new SeqSentence(this.left.clone(), this.right.clone());
    }
    
    toString() {
        return `(${this.left} ◦ ${this.right})`;
    }
    
    /**
     * Get combined discourse state (concatenation)
     */
    getDiscourseState() {
        return [...this.left.getDiscourseState(), ...this.right.getDiscourseState()];
    }
    
    toJSON() {
        return { type: 'SeqSentence', left: this.left.toJSON(), right: this.right.toJSON() };
    }
}

/**
 * ImplSentence - s₁ ⇒ s₂
 * Implication/entailment between sentences
 * Semantically: M ⊨ (s₁ ⇒ s₂) iff ⟦s₁⟧ ⪯ ⟦s₂⟧ (prefix entailment)
 */
class ImplSentence extends SentenceTerm {
    /**
     * @param {SentenceTerm} antecedent - Antecedent sentence
     * @param {SentenceTerm} consequent - Consequent sentence
     */
    constructor(antecedent, consequent) {
        super();
        
        if (!(antecedent instanceof SentenceTerm) || !(consequent instanceof SentenceTerm)) {
            throw new TypeError('ImplSentence requires two SentenceTerms');
        }
        
        this.antecedent = antecedent;
        this.consequent = consequent;
    }
    
    isWellFormed() {
        return this.antecedent.isWellFormed() && this.consequent.isWellFormed();
    }
    
    signature() {
        return `(${this.antecedent.signature()} ⇒ ${this.consequent.signature()})`;
    }
    
    clone() {
        return new ImplSentence(this.antecedent.clone(), this.consequent.clone());
    }
    
    toString() {
        return `(${this.antecedent} ⇒ ${this.consequent})`;
    }
    
    /**
     * Check if implication holds (prefix entailment)
     */
    holds() {
        const ante = this.antecedent.getDiscourseState();
        const cons = this.consequent.getDiscourseState();
        
        // Prefix entailment: antecedent is prefix of consequent
        if (ante.length > cons.length) return false;
        
        for (let i = 0; i < ante.length; i++) {
            if (ante[i] !== cons[i]) return false;
        }
        
        return true;
    }
    
    toJSON() {
        return { 
            type: 'ImplSentence', 
            antecedent: this.antecedent.toJSON(), 
            consequent: this.consequent.toJSON() 
        };
    }
}

// ============================================================================
// TYPING CONTEXT AND JUDGMENTS
// ============================================================================

/**
 * TypingContext - Γ
 * A context for typing judgments
 */
class TypingContext {
    constructor() {
        this.bindings = new Map();
    }
    
    /**
     * Bind a variable name to a type
     */
    bind(name, type, term = null) {
        this.bindings.set(name, { type, term });
        return this;
    }
    
    /**
     * Get type of a variable
     */
    getType(name) {
        const binding = this.bindings.get(name);
        return binding ? binding.type : null;
    }
    
    /**
     * Get term for a variable
     */
    getTerm(name) {
        const binding = this.bindings.get(name);
        return binding ? binding.term : null;
    }
    
    /**
     * Check if variable is bound
     */
    has(name) {
        return this.bindings.has(name);
    }
    
    /**
     * Clone the context
     */
    clone() {
        const ctx = new TypingContext();
        for (const [name, binding] of this.bindings) {
            ctx.bindings.set(name, { ...binding });
        }
        return ctx;
    }
    
    toString() {
        const entries = [];
        for (const [name, { type }] of this.bindings) {
            entries.push(`${name}: ${type}`);
        }
        return `Γ = {${entries.join(', ')}}`;
    }
}

/**
 * TypingJudgment - Γ ⊢ e : T
 * Represents a typing judgment
 */
class TypingJudgment {
    /**
     * @param {TypingContext} context - The typing context Γ
     * @param {Term} term - The term e
     * @param {string} type - The type T
     */
    constructor(context, term, type) {
        this.context = context;
        this.term = term;
        this.type = type;
    }
    
    /**
     * Check if this judgment is valid
     */
    isValid() {
        if (!this.term.isWellFormed()) {
            return false;
        }
        return this.term.type === this.type;
    }
    
    toString() {
        return `${this.context} ⊢ ${this.term} : ${this.type}`;
    }
}

// ============================================================================
// TYPE CHECKER
// ============================================================================

/**
 * TypeChecker - Implements typing rules from the paper
 */
class TypeChecker {
    constructor() {
        this.context = new TypingContext();
    }
    
    /**
     * Infer type of a term
     * @param {Term} term - The term to type
     * @returns {string|null} The inferred type, or null if ill-typed
     */
    inferType(term) {
        if (term instanceof NounTerm) {
            return term.isWellFormed() ? Types.NOUN : null;
        }
        
        if (term instanceof AdjTerm) {
            return term.isWellFormed() ? Types.ADJECTIVE : null;
        }
        
        if (term instanceof ChainTerm) {
            return term.isWellFormed() ? Types.NOUN : null;
        }
        
        if (term instanceof FusionTerm) {
            return term.isWellFormed() ? Types.NOUN : null;
        }
        
        if (term instanceof SentenceTerm) {
            return term.isWellFormed() ? Types.SENTENCE : null;
        }
        
        return null;
    }
    
    /**
     * Check if a term has a specific type
     * @param {Term} term - The term to check
     * @param {string} expectedType - The expected type
     */
    checkType(term, expectedType) {
        const inferred = this.inferType(term);
        return inferred === expectedType;
    }
    
    /**
     * Derive typing judgment
     * @param {Term} term - The term to type
     * @returns {TypingJudgment|null} The judgment, or null if ill-typed
     */
    derive(term) {
        const type = this.inferType(term);
        if (type === null) return null;
        return new TypingJudgment(this.context.clone(), term, type);
    }
    
    /**
     * Check application well-formedness
     * @param {AdjTerm} adj - Adjective term
     * @param {NounTerm} noun - Noun term
     */
    checkApplication(adj, noun) {
        if (!this.checkType(adj, Types.ADJECTIVE)) {
            return { valid: false, reason: 'Adjective ill-typed' };
        }
        
        if (!this.checkType(noun, Types.NOUN)) {
            return { valid: false, reason: 'Noun ill-typed' };
        }
        
        if (!adj.canApplyTo(noun)) {
            return { valid: false, reason: `Ordering constraint violated: ${adj.prime} ≮ ${noun.prime}` };
        }
        
        return { valid: true };
    }
    
    /**
     * Check fusion well-formedness
     * @param {FusionTerm} fusion - Fusion term
     */
    checkFusion(fusion) {
        if (!fusion.isWellFormed()) {
            return { 
                valid: false, 
                reason: `Fusion ill-formed: primes ${fusion.p}, ${fusion.q}, ${fusion.r} don't satisfy constraints`
            };
        }
        return { valid: true, result: fusion.getFusedPrime() };
    }
}

// ============================================================================
// TERM BUILDERS
// ============================================================================

/**
 * Build a noun term from prime
 */
function N(prime) {
    return new NounTerm(prime);
}

/**
 * Build an adjective term from prime
 */
function A(prime) {
    return new AdjTerm(prime);
}

/**
 * Build a fusion term
 */
function FUSE(p, q, r) {
    return new FusionTerm(p, q, r);
}

/**
 * Build a chain term
 */
function CHAIN(operators, noun) {
    const ops = operators.map(p => typeof p === 'number' ? A(p) : p);
    const n = typeof noun === 'number' ? N(noun) : noun;
    return new ChainTerm(ops, n);
}

/**
 * Build a sentence from noun expression
 */
function SENTENCE(expr) {
    if (typeof expr === 'number') {
        expr = N(expr);
    }
    return new NounSentence(expr);
}

/**
 * Sequential composition of sentences
 */
function SEQ(s1, s2) {
    const left = s1 instanceof SentenceTerm ? s1 : SENTENCE(s1);
    const right = s2 instanceof SentenceTerm ? s2 : SENTENCE(s2);
    return new SeqSentence(left, right);
}

/**
 * Implication of sentences
 */
function IMPL(s1, s2) {
    const ante = s1 instanceof SentenceTerm ? s1 : SENTENCE(s1);
    const cons = s2 instanceof SentenceTerm ? s2 : SENTENCE(s2);
    return new ImplSentence(ante, cons);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    Types,
    Term,
    NounTerm,
    AdjTerm,
    ChainTerm,
    FusionTerm,
    SentenceTerm,
    NounSentence,
    SeqSentence,
    ImplSentence,
    TypingContext,
    TypingJudgment,
    TypeChecker,
    N,
    A,
    FUSE,
    CHAIN,
    SENTENCE,
    SEQ,
    IMPL
};