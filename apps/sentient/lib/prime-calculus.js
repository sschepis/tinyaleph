/**
 * Prime Calculus Kernel (Section 6 of Whitepaper)
 * 
 * Deterministic discrete semantic kernel for the Sentient Observer Network.
 * Implements prime-indexed calculus with:
 * - Noun terms N(p) - atomic semantic objects
 * - Adjective terms A(p) - modifiers
 * - Fusion terms FUSE(p,q,r) - triadic combination
 * - Normal form evaluation for network verification
 * 
 * Key features:
 * - Strong normalization (all evaluations terminate)
 * - Confluence under canonical fusion selection
 * - Deterministic for cross-node verification
 */

// Try to load resolang for WASM-accelerated operations
let resolang = null;
try {
    resolang = require('@sschepis/resolang');
} catch (e) {
    // Will use JS fallback
}

/**
 * Small primes for prime checking
 */
const SMALL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53,
                      59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
                      127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181,
                      191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251];

/**
 * Check if a number is prime
 */
function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    if (n < 251 && SMALL_PRIMES.includes(n)) return true;
    
    const sqrt = Math.sqrt(n);
    for (let i = 3; i <= sqrt; i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

/**
 * Check if a number is an odd prime
 */
function isOddPrime(n) {
    return n > 2 && isPrime(n);
}

/**
 * Term types in the Prime Calculus
 */
const TermType = {
    NOUN: 'noun',           // N(p) - atomic semantic object
    ADJ: 'adj',             // A(p) - modifier/adjective
    CHAIN: 'chain',         // A(p1)...A(pk)N(q) - application chain
    FUSE: 'fuse',           // FUSE(p,q,r) - triadic fusion
    SEQ: 'seq',             // s1 ○ s2 - sequence composition
    IMPL: 'impl',           // s1 ⇒ s2 - implication
    VALUE: 'value',         // Evaluated normal form
    UNDEFINED: 'undefined'  // Ill-formed or failed evaluation
};

/**
 * Noun Term - N(p)
 * Represents an atomic semantic object indexed by prime p
 */
class NounTerm {
    constructor(prime) {
        if (!isPrime(prime)) {
            throw new Error(`NounTerm requires prime, got ${prime}`);
        }
        this.type = TermType.NOUN;
        this.prime = prime;
    }
    
    /**
     * Nouns are already in normal form
     */
    isNormalForm() {
        return true;
    }
    
    /**
     * Nouns are values
     */
    isValue() {
        return true;
    }
    
    /**
     * Get the semantic signature (for comparison)
     */
    signature() {
        return `N(${this.prime})`;
    }
    
    /**
     * Clone this term
     */
    clone() {
        return new NounTerm(this.prime);
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return { type: 'noun', prime: this.prime };
    }
    
    toString() {
        return `N(${this.prime})`;
    }
}

/**
 * Adjective Term - A(p)
 * Represents a modifier indexed by prime p
 */
class AdjTerm {
    constructor(prime) {
        if (!isPrime(prime)) {
            throw new Error(`AdjTerm requires prime, got ${prime}`);
        }
        this.type = TermType.ADJ;
        this.prime = prime;
    }
    
    /**
     * Bare adjectives are not in normal form (need noun to apply to)
     */
    isNormalForm() {
        return false;
    }
    
    isValue() {
        return false;
    }
    
    signature() {
        return `A(${this.prime})`;
    }
    
    clone() {
        return new AdjTerm(this.prime);
    }
    
    toJSON() {
        return { type: 'adj', prime: this.prime };
    }
    
    toString() {
        return `A(${this.prime})`;
    }
}

/**
 * Chain Term - A(p1)...A(pk)N(q)
 * Application chain: adjectives applied to a noun
 * Well-formedness: p1 < p2 < ... < pk < q
 */
class ChainTerm {
    /**
     * @param {Array<number>} adjPrimes - Adjective primes [p1, ..., pk]
     * @param {number} nounPrime - Noun prime q
     */
    constructor(adjPrimes, nounPrime) {
        // Validate well-formedness (Section 6.1)
        // In any well-formed chain A(p),N(q) require p < q
        for (let i = 0; i < adjPrimes.length; i++) {
            if (!isPrime(adjPrimes[i])) {
                throw new Error(`ChainTerm adjective requires prime, got ${adjPrimes[i]}`);
            }
        }
        if (!isPrime(nounPrime)) {
            throw new Error(`ChainTerm noun requires prime, got ${nounPrime}`);
        }
        
        // Check ordering constraint
        for (let i = 0; i < adjPrimes.length - 1; i++) {
            if (adjPrimes[i] >= adjPrimes[i + 1]) {
                throw new Error(`ChainTerm adjectives must be ordered: ${adjPrimes[i]} < ${adjPrimes[i + 1]}`);
            }
        }
        if (adjPrimes.length > 0 && adjPrimes[adjPrimes.length - 1] >= nounPrime) {
            throw new Error(`ChainTerm: last adjective ${adjPrimes[adjPrimes.length - 1]} must be < noun ${nounPrime}`);
        }
        
        this.type = TermType.CHAIN;
        this.adjPrimes = adjPrimes.slice();
        this.nounPrime = nounPrime;
    }
    
    /**
     * Chains are normal forms when properly ordered
     */
    isNormalForm() {
        return true;
    }
    
    isValue() {
        return true;
    }
    
    /**
     * Compute semantic signature by combining primes
     */
    signature() {
        const adjs = this.adjPrimes.map(p => `A(${p})`).join('');
        return `${adjs}N(${this.nounPrime})`;
    }
    
    /**
     * Combine primes into a single semantic hash
     */
    semanticHash() {
        // Use product of primes as semantic identifier
        let hash = this.nounPrime;
        for (const p of this.adjPrimes) {
            hash *= p;
        }
        return hash;
    }
    
    clone() {
        return new ChainTerm(this.adjPrimes, this.nounPrime);
    }
    
    toJSON() {
        return { 
            type: 'chain', 
            adjPrimes: this.adjPrimes, 
            nounPrime: this.nounPrime,
            hash: this.semanticHash()
        };
    }
    
    toString() {
        return this.signature();
    }
}

/**
 * Fusion Term - FUSE(p,q,r)
 * Triadic prime fusion (Section 6.1)
 * Well-formedness: p,q,r distinct odd primes and p+q+r is prime
 */
class FusionTerm {
    constructor(p, q, r) {
        // Validate well-formedness
        if (!isOddPrime(p) || !isOddPrime(q) || !isOddPrime(r)) {
            throw new Error(`FusionTerm requires distinct odd primes, got ${p}, ${q}, ${r}`);
        }
        if (p === q || q === r || p === r) {
            throw new Error(`FusionTerm requires distinct primes`);
        }
        
        const sum = p + q + r;
        if (!isPrime(sum)) {
            throw new Error(`FusionTerm requires p+q+r=${sum} to be prime`);
        }
        
        this.type = TermType.FUSE;
        this.p = p;
        this.q = q;
        this.r = r;
        this.fusedPrime = sum; // The result of fusion
    }
    
    /**
     * Fusion is reducible - evaluates to a noun
     */
    isNormalForm() {
        return false;
    }
    
    isValue() {
        return false;
    }
    
    /**
     * Reduce fusion to its normal form (a noun)
     */
    reduce() {
        return new NounTerm(this.fusedPrime);
    }
    
    signature() {
        return `FUSE(${this.p},${this.q},${this.r})`;
    }
    
    clone() {
        return new FusionTerm(this.p, this.q, this.r);
    }
    
    toJSON() {
        return { 
            type: 'fuse', 
            p: this.p, 
            q: this.q, 
            r: this.r,
            fusedPrime: this.fusedPrime 
        };
    }
    
    toString() {
        return this.signature();
    }
}

/**
 * Sequence Term - s1 ○ s2
 * Sequential composition of terms
 */
class SeqTerm {
    constructor(left, right) {
        this.type = TermType.SEQ;
        this.left = left;
        this.right = right;
    }
    
    isNormalForm() {
        return this.left.isNormalForm() && this.right.isNormalForm();
    }
    
    isValue() {
        return this.left.isValue() && this.right.isValue();
    }
    
    signature() {
        return `(${this.left.signature()} ○ ${this.right.signature()})`;
    }
    
    clone() {
        return new SeqTerm(this.left.clone(), this.right.clone());
    }
    
    toJSON() {
        return {
            type: 'seq',
            left: this.left.toJSON(),
            right: this.right.toJSON()
        };
    }
    
    toString() {
        return `(${this.left} ○ ${this.right})`;
    }
}

/**
 * Implication Term - s1 ⇒ s2
 * Logical implication between terms
 */
class ImplTerm {
    constructor(antecedent, consequent) {
        this.type = TermType.IMPL;
        this.antecedent = antecedent;
        this.consequent = consequent;
    }
    
    isNormalForm() {
        return this.antecedent.isNormalForm() && this.consequent.isNormalForm();
    }
    
    isValue() {
        return this.antecedent.isValue() && this.consequent.isValue();
    }
    
    signature() {
        return `(${this.antecedent.signature()} ⇒ ${this.consequent.signature()})`;
    }
    
    clone() {
        return new ImplTerm(this.antecedent.clone(), this.consequent.clone());
    }
    
    toJSON() {
        return {
            type: 'impl',
            antecedent: this.antecedent.toJSON(),
            consequent: this.consequent.toJSON()
        };
    }
    
    toString() {
        return `(${this.antecedent} ⇒ ${this.consequent})`;
    }
}

/**
 * Undefined Term - represents evaluation failure
 */
class UndefinedTerm {
    constructor(reason = 'unknown') {
        this.type = TermType.UNDEFINED;
        this.reason = reason;
    }
    
    isNormalForm() {
        return false;
    }
    
    isValue() {
        return false;
    }
    
    signature() {
        return `⊥(${this.reason})`;
    }
    
    clone() {
        return new UndefinedTerm(this.reason);
    }
    
    toJSON() {
        return { type: 'undefined', reason: this.reason };
    }
    
    toString() {
        return `⊥`;
    }
}

/**
 * Prime Calculus Evaluator
 * 
 * Implements the operational semantics from Section 6.2:
 * - Leftmost-innermost evaluation order for chains
 * - Deterministic fusion contraction
 * - Strong normalization guarantee
 */
class PrimeCalculusEvaluator {
    constructor(options = {}) {
        this.maxSteps = options.maxSteps || 1000;
        this.trace = options.trace || false;
        this.evaluationLog = [];
    }
    
    /**
     * Evaluate a term to normal form (Section 6.2)
     * 
     * @param {Object} term - Term to evaluate
     * @returns {Object} Normal form or UndefinedTerm
     */
    evaluate(term) {
        this.evaluationLog = [];
        let current = term;
        let steps = 0;
        
        while (!current.isNormalForm() && steps < this.maxSteps) {
            const next = this.step(current);
            
            if (this.trace) {
                this.evaluationLog.push({
                    step: steps,
                    from: current.signature(),
                    to: next.signature()
                });
            }
            
            if (next.type === TermType.UNDEFINED) {
                return next;
            }
            
            current = next;
            steps++;
        }
        
        if (steps >= this.maxSteps) {
            return new UndefinedTerm('max_steps_exceeded');
        }
        
        return current;
    }
    
    /**
     * Single evaluation step
     * Uses leftmost-innermost strategy
     */
    step(term) {
        switch (term.type) {
            case TermType.NOUN:
                return term; // Already normal
                
            case TermType.ADJ:
                return new UndefinedTerm('bare_adjective');
                
            case TermType.CHAIN:
                return term; // Already normal
                
            case TermType.FUSE:
                return term.reduce(); // Contract fusion to noun
                
            case TermType.SEQ:
                // Evaluate left first, then right
                if (!term.left.isNormalForm()) {
                    return new SeqTerm(this.step(term.left), term.right);
                }
                if (!term.right.isNormalForm()) {
                    return new SeqTerm(term.left, this.step(term.right));
                }
                return term;
                
            case TermType.IMPL:
                // Evaluate antecedent first, then consequent
                if (!term.antecedent.isNormalForm()) {
                    return new ImplTerm(this.step(term.antecedent), term.consequent);
                }
                if (!term.consequent.isNormalForm()) {
                    return new ImplTerm(term.antecedent, this.step(term.consequent));
                }
                return term;
                
            default:
                return new UndefinedTerm('unknown_term_type');
        }
    }
    
    /**
     * Compute normal form with full verification
     * Returns both the normal form and evaluation metadata
     */
    normalForm(term) {
        const result = this.evaluate(term);
        return {
            normalForm: result,
            signature: result.signature(),
            isValue: result.isValue(),
            steps: this.evaluationLog.length,
            trace: this.trace ? this.evaluationLog : null
        };
    }
    
    /**
     * Check if two terms have the same normal form
     * Used for network verification
     */
    equivalent(term1, term2) {
        const nf1 = this.evaluate(term1);
        const nf2 = this.evaluate(term2);
        return nf1.signature() === nf2.signature();
    }
}

/**
 * Prime Calculus Builder
 * Helper for constructing terms programmatically
 */
class PrimeCalculusBuilder {
    /**
     * Create a noun term
     */
    static noun(prime) {
        return new NounTerm(prime);
    }
    
    /**
     * Create an adjective term
     */
    static adj(prime) {
        return new AdjTerm(prime);
    }
    
    /**
     * Create a chain from adjectives and noun
     */
    static chain(adjPrimes, nounPrime) {
        return new ChainTerm(adjPrimes, nounPrime);
    }
    
    /**
     * Create a fusion term
     */
    static fuse(p, q, r) {
        return new FusionTerm(p, q, r);
    }
    
    /**
     * Create a sequence
     */
    static seq(left, right) {
        return new SeqTerm(left, right);
    }
    
    /**
     * Create an implication
     */
    static impl(antecedent, consequent) {
        return new ImplTerm(antecedent, consequent);
    }
    
    /**
     * Find valid fusion candidates for a target
     * Returns all (p,q,r) where p+q+r = target and all are odd primes
     */
    static findFusionCandidates(targetPrime, maxSearch = 100) {
        if (!isPrime(targetPrime)) return [];
        
        const candidates = [];
        const oddPrimes = SMALL_PRIMES.filter(p => p > 2 && p < targetPrime / 3);
        
        for (let i = 0; i < oddPrimes.length; i++) {
            for (let j = i + 1; j < oddPrimes.length; j++) {
                const p = oddPrimes[i];
                const q = oddPrimes[j];
                const r = targetPrime - p - q;
                
                if (r > q && r !== p && r !== q && isOddPrime(r)) {
                    candidates.push([p, q, r]);
                }
            }
        }
        
        return candidates;
    }
}

/**
 * Prime Calculus Verifier
 * Implements network verification logic from Section 6.2
 */
class PrimeCalculusVerifier {
    constructor() {
        this.evaluator = new PrimeCalculusEvaluator({ trace: false });
    }
    
    /**
     * Verify a claimed normal form (equation 19 NF_ok)
     * @param {Object} term - Original term e
     * @param {Object} claimedNF - Claimed normal form ΩNF
     * @returns {Object} Verification result
     */
    verifyNormalForm(term, claimedNF) {
        const computed = this.evaluator.evaluate(term);
        const matches = computed.signature() === claimedNF.signature();
        
        return {
            valid: matches,
            computedNF: computed.signature(),
            claimedNF: claimedNF.signature(),
            agreement: matches
        };
    }
    
    /**
     * Verify well-formedness of a term
     */
    verifyWellFormed(term) {
        try {
            // Attempt to clone (validates structure)
            term.clone();
            return { wellFormed: true, error: null };
        } catch (e) {
            return { wellFormed: false, error: e.message };
        }
    }
    
    /**
     * Full verification for network proposals
     * @param {Object} proposal - {term, claimedNF, proofs}
     */
    verify(proposal) {
        const { term, claimedNF, proofs } = proposal;
        
        // 1. Check well-formedness
        const wfCheck = this.verifyWellFormed(term);
        if (!wfCheck.wellFormed) {
            return { 
                valid: false, 
                reason: 'ill_formed', 
                details: wfCheck.error 
            };
        }
        
        // 2. Verify normal form agreement
        const nfCheck = this.verifyNormalForm(term, claimedNF);
        if (!nfCheck.valid) {
            return {
                valid: false,
                reason: 'normal_form_mismatch',
                computed: nfCheck.computedNF,
                claimed: nfCheck.claimedNF
            };
        }
        
        // 3. All checks passed
        return {
            valid: true,
            normalForm: nfCheck.computedNF
        };
    }
}

/**
 * Semantic Kernel Object
 * Wrapper for network-transmittable semantic content
 */
class SemanticObject {
    constructor(term, metadata = {}) {
        this.term = term;
        this.metadata = metadata;
        this.timestamp = Date.now();
        this.id = this.generateId();
    }
    
    generateId() {
        const sig = this.term.signature();
        // Simple hash
        let hash = 0;
        for (let i = 0; i < sig.length; i++) {
            hash = ((hash << 5) - hash) + sig.charCodeAt(i);
            hash |= 0;
        }
        return `Ω${Math.abs(hash).toString(16)}`;
    }
    
    /**
     * Get the normal form of this object
     */
    normalForm() {
        const evaluator = new PrimeCalculusEvaluator();
        return evaluator.evaluate(this.term);
    }
    
    /**
     * Create a network proposal
     */
    toProposal() {
        const nf = this.normalForm();
        return {
            id: this.id,
            term: this.term.toJSON(),
            claimedNF: nf.toJSON(),
            signature: nf.signature(),
            timestamp: this.timestamp,
            metadata: this.metadata
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            term: this.term.toJSON(),
            normalForm: this.normalForm().signature(),
            timestamp: this.timestamp,
            metadata: this.metadata
        };
    }
}

module.exports = {
    // Term types
    TermType,
    NounTerm,
    AdjTerm,
    ChainTerm,
    FusionTerm,
    SeqTerm,
    ImplTerm,
    UndefinedTerm,
    
    // Evaluator and verifier
    PrimeCalculusEvaluator,
    PrimeCalculusVerifier,
    
    // Builder
    PrimeCalculusBuilder,
    
    // Semantic object
    SemanticObject,
    
    // Utilities
    isPrime,
    isOddPrime,
    SMALL_PRIMES
};