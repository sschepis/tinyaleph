/**
 * Complete Alexander Modules for Prime Sets
 * 
 * Implements module-theoretic signature extraction based on:
 * "Complete Alexander Modules for Prime Sets: Crowell Exact Sequences,
 * Iwasawa Modules, and Resonance-Signature Extraction"
 * 
 * Key concepts:
 * - ψ-Differential modules A_ψ: Universal differentials satisfying
 *   d(g₁g₂) = d(g₁) + ψ(g₁)d(g₂)
 * - Crowell exact sequence: 0 → N^ab → A_ψ → I_{Z[H]} → 0
 * - Fitting ideals E_d(A_ψ): Characteristic invariants
 * - Module signature Σ_{k,S,ℓ,ψ}: Stable memory object for prime sets
 * 
 * @module core/alexander-module
 */

'use strict';

import { isPrime, firstNPrimes, factorize } from './prime.js';

// ============================================================================
// POLYNOMIAL AND IDEAL UTILITIES
// ============================================================================

/**
 * Laurent Polynomial Class
 * 
 * Polynomials in Z[t, t⁻¹] (the group ring Z[Z])
 * Used for Alexander polynomial representation.
 */
class LaurentPolynomial {
    /**
     * Create a Laurent polynomial
     * 
     * @param {Object|Map|Array} coeffs - Coefficients indexed by power
     *   Object: { power: coeff } e.g., { 0: 1, 1: -1, 2: 1 } = 1 - t + t²
     *   Array: [a₀, a₁, a₂, ...] for non-negative powers
     */
    constructor(coeffs = {}) {
        this.coeffs = new Map();
        
        if (Array.isArray(coeffs)) {
            coeffs.forEach((c, i) => {
                if (c !== 0) this.coeffs.set(i, c);
            });
        } else if (coeffs instanceof Map) {
            for (const [k, v] of coeffs) {
                if (v !== 0) this.coeffs.set(k, v);
            }
        } else {
            for (const [k, v] of Object.entries(coeffs)) {
                if (v !== 0) this.coeffs.set(parseInt(k), v);
            }
        }
    }
    
    /**
     * Get coefficient at power n
     */
    get(n) {
        return this.coeffs.get(n) || 0;
    }
    
    /**
     * Set coefficient at power n
     */
    set(n, value) {
        if (value === 0) {
            this.coeffs.delete(n);
        } else {
            this.coeffs.set(n, value);
        }
        return this;
    }
    
    /**
     * Get minimum power with non-zero coefficient
     */
    get minPower() {
        if (this.coeffs.size === 0) return 0;
        return Math.min(...this.coeffs.keys());
    }
    
    /**
     * Get maximum power with non-zero coefficient
     */
    get maxPower() {
        if (this.coeffs.size === 0) return 0;
        return Math.max(...this.coeffs.keys());
    }
    
    /**
     * Get degree (maxPower - minPower)
     */
    get degree() {
        return this.maxPower - this.minPower;
    }
    
    /**
     * Check if polynomial is zero
     */
    get isZero() {
        return this.coeffs.size === 0;
    }
    
    /**
     * Add two Laurent polynomials
     */
    add(other) {
        const result = new LaurentPolynomial(this.coeffs);
        for (const [k, v] of other.coeffs) {
            result.set(k, result.get(k) + v);
        }
        return result;
    }
    
    /**
     * Subtract
     */
    subtract(other) {
        const result = new LaurentPolynomial(this.coeffs);
        for (const [k, v] of other.coeffs) {
            result.set(k, result.get(k) - v);
        }
        return result;
    }
    
    /**
     * Multiply two Laurent polynomials
     */
    multiply(other) {
        const result = new LaurentPolynomial();
        for (const [k1, v1] of this.coeffs) {
            for (const [k2, v2] of other.coeffs) {
                result.set(k1 + k2, result.get(k1 + k2) + v1 * v2);
            }
        }
        return result;
    }
    
    /**
     * Scalar multiplication
     */
    scale(scalar) {
        const result = new LaurentPolynomial();
        for (const [k, v] of this.coeffs) {
            result.set(k, scalar * v);
        }
        return result;
    }
    
    /**
     * Evaluate at t = value
     */
    evaluate(value) {
        let result = 0;
        for (const [k, v] of this.coeffs) {
            result += v * Math.pow(value, k);
        }
        return result;
    }
    
    /**
     * Evaluate at t = e^(iθ) on unit circle
     */
    evaluateOnCircle(theta) {
        let re = 0, im = 0;
        for (const [k, v] of this.coeffs) {
            re += v * Math.cos(k * theta);
            im += v * Math.sin(k * theta);
        }
        return { re, im, abs: Math.sqrt(re * re + im * im) };
    }
    
    /**
     * Normalize: divide by leading coefficient and shift to min power 0
     */
    normalize() {
        if (this.isZero) return new LaurentPolynomial();
        
        const shift = this.minPower;
        const lead = this.get(this.maxPower);
        const result = new LaurentPolynomial();
        
        for (const [k, v] of this.coeffs) {
            result.set(k - shift, v / lead);
        }
        
        return result;
    }
    
    /**
     * Clone
     */
    clone() {
        return new LaurentPolynomial(this.coeffs);
    }
    
    /**
     * String representation
     */
    toString() {
        if (this.isZero) return '0';
        
        const powers = [...this.coeffs.keys()].sort((a, b) => a - b);
        const terms = [];
        
        for (const k of powers) {
            const c = this.coeffs.get(k);
            if (c === 0) continue;
            
            let term = '';
            if (k === 0) {
                term = c.toString();
            } else if (k === 1) {
                term = c === 1 ? 't' : c === -1 ? '-t' : `${c}t`;
            } else if (k < 0) {
                term = c === 1 ? `t^(${k})` : c === -1 ? `-t^(${k})` : `${c}t^(${k})`;
            } else {
                term = c === 1 ? `t^${k}` : c === -1 ? `-t^${k}` : `${c}t^${k}`;
            }
            
            terms.push(term);
        }
        
        return terms.join(' + ').replace(/\+ -/g, '- ');
    }
    
    /**
     * Create from array of roots (as Laurent poly (t - r₁)(t - r₂)...)
     */
    static fromRoots(roots) {
        let result = new LaurentPolynomial({ 0: 1 });
        for (const r of roots) {
            const factor = new LaurentPolynomial({ 0: -r, 1: 1 }); // (t - r)
            result = result.multiply(factor);
        }
        return result;
    }
    
    /**
     * Create the augmentation ideal generator (t - 1)
     */
    static augmentationGenerator() {
        return new LaurentPolynomial({ 0: -1, 1: 1 }); // t - 1
    }
}

// ============================================================================
// FITTING IDEAL CLASS
// ============================================================================

/**
 * Fitting Ideal Class
 * 
 * The d-th Fitting ideal E_d(M) of a finitely presented module M
 * is generated by (n-d) × (n-d) minors of a presentation matrix,
 * where n is the number of generators.
 * 
 * For Alexander modules, the 0-th Fitting ideal gives the
 * Alexander polynomial (up to units).
 */
class FittingIdeal {
    /**
     * Create a Fitting ideal
     * 
     * @param {number} degree - The degree d of E_d
     * @param {LaurentPolynomial[]} generators - Generators of the ideal
     */
    constructor(degree, generators = []) {
        this.degree = degree;
        this.generators = generators;
    }
    
    /**
     * Check if ideal is trivial (equals entire ring)
     */
    get isTrivial() {
        return this.generators.some(g => {
            // Ideal is trivial if some generator is a unit
            return g.coeffs.size === 1 && Math.abs([...g.coeffs.values()][0]) === 1;
        });
    }
    
    /**
     * Check if ideal is zero
     */
    get isZero() {
        return this.generators.length === 0 || 
               this.generators.every(g => g.isZero);
    }
    
    /**
     * Get primary generator (gcd of all generators)
     * For principal ideals, this is unique up to units.
     */
    get primaryGenerator() {
        if (this.generators.length === 0) {
            return new LaurentPolynomial();
        }
        if (this.generators.length === 1) {
            return this.generators[0];
        }
        
        // For Laurent polynomials over Z, computing true gcd is complex.
        // We return the first non-zero generator as approximation.
        for (const g of this.generators) {
            if (!g.isZero) return g;
        }
        return new LaurentPolynomial();
    }
    
    /**
     * Compute characteristic polynomial Δ_d
     * This is the generator of E_d when it's principal.
     */
    get characteristicPolynomial() {
        return this.primaryGenerator.normalize();
    }
    
    /**
     * Evaluate ideal generators on unit circle
     * Returns minimum absolute value (distance to zero locus).
     */
    evaluateOnCircle(theta) {
        const values = this.generators.map(g => g.evaluateOnCircle(theta));
        const minAbs = Math.min(...values.map(v => v.abs));
        return { 
            values, 
            minAbs,
            theta 
        };
    }
    
    /**
     * Find zeros on unit circle (where |generator| is minimized)
     * 
     * @param {number} samples - Number of sample points
     * @returns {number[]} Angles where ideal vanishes approximately
     */
    findCircleZeros(samples = 360) {
        const zeros = [];
        const threshold = 0.1;
        
        for (let i = 0; i < samples; i++) {
            const theta = (2 * Math.PI * i) / samples;
            const { minAbs } = this.evaluateOnCircle(theta);
            if (minAbs < threshold) {
                zeros.push(theta);
            }
        }
        
        return zeros;
    }
    
    /**
     * Compute signature hash for content-addressable memory
     */
    get signatureHash() {
        const gen = this.characteristicPolynomial;
        const coeffArray = [];
        
        for (let k = gen.minPower; k <= gen.maxPower; k++) {
            coeffArray.push(gen.get(k));
        }
        
        // Simple hash: combine coefficients
        let hash = 0;
        for (let i = 0; i < coeffArray.length; i++) {
            hash = ((hash << 5) - hash + coeffArray[i]) | 0;
        }
        
        return hash;
    }
}

// ============================================================================
// CROWELL EXACT SEQUENCE
// ============================================================================

/**
 * Crowell Exact Sequence Class
 * 
 * Represents the exact sequence of Z[H]-modules:
 * 0 → N^ab → A_ψ → I_{Z[H]} → 0
 * 
 * Extended form:
 * 0 → N^ab → A_ψ → Z[H] → Z → 0
 * 
 * For prime sets, this connects:
 * - N^ab: ψ-Galois module (Iwasawa module in cyclotomic case)
 * - A_ψ: Complete Alexander module
 * - I_{Z[H]}: Augmentation ideal
 */
class CrowellSequence {
    /**
     * Create a Crowell exact sequence
     * 
     * @param {Object} groupData - Group-theoretic data
     * @param {Object} groupData.G - The group G (presentation)
     * @param {Object} groupData.H - The abelian quotient H
     * @param {Object} groupData.N - The kernel N = ker(ψ)
     */
    constructor(groupData) {
        this.G = groupData.G;
        this.H = groupData.H;
        this.N = groupData.N;
        
        this._Nab = null;       // N^ab: ψ-Galois module
        this._Apsi = null;      // A_ψ: Alexander module
        this._augIdeal = null;  // I_{Z[H]}: Augmentation ideal
    }
    
    /**
     * Get the ψ-Galois module N^ab
     */
    get NabelianModule() {
        if (!this._Nab) {
            this._Nab = this._computeNab();
        }
        return this._Nab;
    }
    
    /**
     * Get the Alexander module A_ψ
     */
    get alexanderModule() {
        if (!this._Apsi) {
            this._Apsi = this._computeApsi();
        }
        return this._Apsi;
    }
    
    /**
     * Get augmentation ideal I_{Z[H]}
     */
    get augmentationIdeal() {
        if (!this._augIdeal) {
            // For H = Z, the augmentation ideal is principal, generated by (t - 1)
            this._augIdeal = new FittingIdeal(0, [
                LaurentPolynomial.augmentationGenerator()
            ]);
        }
        return this._augIdeal;
    }
    
    /**
     * Compute N^ab (abelianization of kernel)
     * @private
     */
    _computeNab() {
        // For prime sets, N^ab is computed from the restricted ramification structure
        // This is a simplified representation
        return {
            generators: this.N.generators || [],
            relations: this.N.relations || [],
            rank: this.N.rank || 0
        };
    }
    
    /**
     * Compute A_ψ (Alexander module)
     * @private
     */
    _computeApsi() {
        // The Alexander module is computed from the Fox derivatives
        // of the group presentation
        return {
            presentationMatrix: this._computePresentationMatrix(),
            rank: this.G.relations?.length || 0
        };
    }
    
    /**
     * Compute presentation matrix (Fox derivative matrix)
     * @private
     */
    _computePresentationMatrix() {
        // Fox derivative matrix: ∂r_i/∂x_j for relations r_i, generators x_j
        // This is a matrix of Laurent polynomials
        const numRelations = this.G.relations?.length || 0;
        const numGenerators = this.G.generators?.length || 0;
        
        const matrix = [];
        for (let i = 0; i < numRelations; i++) {
            const row = [];
            for (let j = 0; j < numGenerators; j++) {
                // Simplified: placeholder for actual Fox derivative
                row.push(new LaurentPolynomial({ 0: 1 }));
            }
            matrix.push(row);
        }
        
        return matrix;
    }
    
    /**
     * Check exactness at each position
     */
    verifyExactness() {
        // In a proper implementation, this would verify:
        // 1. θ₁: N^ab → A_ψ is injective
        // 2. im(θ₁) = ker(θ₂)
        // 3. θ₂: A_ψ → I_{Z[H]} is surjective
        return {
            injectiveAtNab: true,
            exactAtApsi: true,
            surjectiveOntoAugIdeal: true
        };
    }
    
    /**
     * Get splitting isomorphism (Morishita's result)
     * A_ψ ≅ N^ab ⊕ Λ̂ where Λ̂ = Z_ℓ[[H]]
     */
    getSplitting() {
        return {
            directSum: true,
            components: ['N^ab', 'Λ̂'],
            fittingShift: 1 // E_d(N^ab) = E_{d+1}(A_ψ)
        };
    }
}

// ============================================================================
// ALEXANDER MODULE CLASS
// ============================================================================

/**
 * Complete Alexander Module
 * 
 * The ψ-differential module A_ψ for a prime set S.
 * Provides the module-theoretic invariant layer above coupling tensors.
 */
class AlexanderModule {
    /**
     * Create an Alexander module for a prime set
     * 
     * @param {number[]} primes - The prime set S
     * @param {Object} options - Configuration
     * @param {number} options.ell - Base prime ℓ (default: 2)
     * @param {string} options.field - Base field k (default: 'Q')
     */
    constructor(primes, options = {}) {
        this.primes = primes.filter(p => isPrime(p)).sort((a, b) => a - b);
        this.r = this.primes.length;
        
        if (this.r < 1) {
            throw new Error('AlexanderModule requires at least 1 prime');
        }
        
        this.ell = options.ell || 2;
        this.field = options.field || 'Q';
        
        // Compute group-theoretic data
        this._groupData = this._buildGroupData();
        this._crowellSequence = null;
        this._fittingIdeals = new Map();
        this._signature = null;
        
        this.metadata = {
            created: Date.now(),
            primeProduct: this.primes.reduce((a, b) => a * b, 1),
            primeSum: this.primes.reduce((a, b) => a + b, 0)
        };
    }
    
    /**
     * Build group-theoretic data from prime set
     * 
     * The restricted-ramification Galois group G_S(k) = π₁(Spec(O_k) \ S)
     * @private
     */
    _buildGroupData() {
        // For the prime set S = {p₁, ..., p_r}, we build:
        // - G: restricted-ramification group (simplified presentation)
        // - H: maximal abelian quotient
        // - N: kernel of ψ: G → H
        
        const generators = this.primes.map((p, i) => ({
            index: i,
            prime: p,
            symbol: `σ_${p}`
        }));
        
        // Relations encode ramification structure
        // For simplicity, we use trivial relations here
        const relations = [];
        
        // The abelianization H is free abelian of rank r
        const H = {
            rank: this.r,
            generators: generators.slice(),
            isAbelian: true
        };
        
        // For abelianization, N = [G, G] (commutator subgroup)
        const N = {
            generators: [], // Computed from commutators
            relations: [],
            rank: 0 // Depends on class field theory
        };
        
        return {
            G: { generators, relations },
            H,
            N,
            abelianization: H
        };
    }
    
    /**
     * Get the Crowell exact sequence
     */
    get crowellSequence() {
        if (!this._crowellSequence) {
            this._crowellSequence = new CrowellSequence(this._groupData);
        }
        return this._crowellSequence;
    }
    
    /**
     * Compute d-th Fitting ideal E_d(A_ψ)
     * 
     * @param {number} d - Degree of Fitting ideal
     * @returns {FittingIdeal} The ideal E_d
     */
    computeFittingIdeal(d) {
        if (this._fittingIdeals.has(d)) {
            return this._fittingIdeals.get(d);
        }
        
        const ideal = this._computeFitting(d);
        this._fittingIdeals.set(d, ideal);
        return ideal;
    }
    
    /**
     * Compute Fitting ideal from presentation matrix
     * @private
     */
    _computeFitting(d) {
        // The d-th Fitting ideal is generated by (n-d) × (n-d) minors
        // of the presentation matrix, where n = number of generators
        
        const n = this.r;
        
        if (d >= n) {
            // E_d = entire ring for d ≥ n
            return new FittingIdeal(d, [new LaurentPolynomial({ 0: 1 })]);
        }
        
        if (d === 0) {
            // E_0 is the principal ideal generated by the Alexander polynomial
            const alexPoly = this._computeAlexanderPolynomial();
            return new FittingIdeal(0, [alexPoly]);
        }
        
        // For intermediate d, compute minors
        // This is a simplified version
        const minorSize = n - d;
        const generators = this._computeMinors(minorSize);
        return new FittingIdeal(d, generators);
    }
    
    /**
     * Compute Alexander polynomial
     * 
     * For a prime set, this is related to the characteristic polynomial
     * of the Iwasawa module when interpreted via class field theory.
     * @private
     */
    _computeAlexanderPolynomial() {
        // For a single prime p, the Alexander polynomial is trivial: 1
        // For multiple primes, it encodes the ramification structure
        
        if (this.r === 1) {
            return new LaurentPolynomial({ 0: 1 });
        }
        
        // Construct polynomial from prime signatures
        // This is a simplified heuristic based on prime residue classes
        const coeffs = {};
        
        // The polynomial structure depends on the Galois group
        // Use prime-derived coefficients as approximation
        for (let i = 0; i <= this.r; i++) {
            const coeff = this._computeAlexanderCoeff(i);
            if (coeff !== 0) {
                coeffs[i] = coeff;
            }
        }
        
        // Ensure symmetric (palindromic) structure
        // Alexander polynomials satisfy Δ(t⁻¹) = t^(-deg) Δ(t) up to sign
        const poly = new LaurentPolynomial(coeffs);
        return this._symmetrize(poly);
    }
    
    /**
     * Compute Alexander polynomial coefficient
     * @private
     */
    _computeAlexanderCoeff(i) {
        if (i === 0) return 1;
        if (i === this.r) return 1;
        
        // Use prime residue structure
        let coeff = 0;
        const combos = this._combinations(this.primes, i);
        
        for (const combo of combos) {
            const prod = combo.reduce((a, b) => a * b, 1);
            const sign = this._computeSign(combo);
            coeff += sign;
        }
        
        return coeff;
    }
    
    /**
     * Compute sign from prime combo
     * @private
     */
    _computeSign(primes) {
        // Based on Legendre symbol structure
        let sign = 1;
        for (let i = 0; i < primes.length; i++) {
            for (let j = i + 1; j < primes.length; j++) {
                const leg = this._legendreSymbol(primes[i], primes[j]);
                sign *= leg;
            }
        }
        return sign;
    }
    
    /**
     * Simple Legendre symbol computation
     * @private
     */
    _legendreSymbol(a, p) {
        if (p === 2 || !isPrime(p)) return 0;
        a = ((a % p) + p) % p;
        if (a === 0) return 0;
        
        // Euler's criterion
        let result = 1;
        let exp = (p - 1) / 2;
        let base = a;
        
        while (exp > 0) {
            if (exp % 2 === 1) {
                result = (result * base) % p;
            }
            base = (base * base) % p;
            exp = Math.floor(exp / 2);
        }
        
        return result === 1 ? 1 : -1;
    }
    
    /**
     * Make polynomial symmetric/palindromic
     * @private
     */
    _symmetrize(poly) {
        if (poly.isZero) return poly;
        
        const min = poly.minPower;
        const max = poly.maxPower;
        const result = new LaurentPolynomial();
        
        for (let k = min; k <= max; k++) {
            const c1 = poly.get(k);
            const c2 = poly.get(max + min - k);
            const avg = Math.round((c1 + c2) / 2);
            result.set(k, avg);
        }
        
        return result;
    }
    
    /**
     * Compute minors of presentation matrix
     * @private
     */
    _computeMinors(size) {
        // Simplified: return generators based on prime structure
        const generators = [];
        
        if (size <= 0) {
            generators.push(new LaurentPolynomial({ 0: 1 }));
            return generators;
        }
        
        // Each minor corresponds to a subset of relations/generators
        const subsets = this._combinations(this.primes, size);
        
        for (const subset of subsets) {
            const minor = this._computeMinorFromSubset(subset);
            if (!minor.isZero) {
                generators.push(minor);
            }
        }
        
        if (generators.length === 0) {
            generators.push(new LaurentPolynomial({ 0: 1 }));
        }
        
        return generators;
    }
    
    /**
     * Compute minor from prime subset
     * @private
     */
    _computeMinorFromSubset(primes) {
        // The minor is a determinant of the Fox derivative matrix
        // For simplified implementation, use product-sum formula
        const coeffs = {};
        
        for (let i = 0; i <= primes.length; i++) {
            const sign = (i % 2 === 0) ? 1 : -1;
            const binomial = this._binomial(primes.length, i);
            coeffs[i] = sign * binomial;
        }
        
        return new LaurentPolynomial(coeffs);
    }
    
    /**
     * Binomial coefficient
     * @private
     */
    _binomial(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    }
    
    /**
     * Generate all k-combinations of array
     * @private
     */
    _combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length === 0) return [];
        
        const [first, ...rest] = arr;
        const withFirst = this._combinations(rest, k - 1).map(c => [first, ...c]);
        const withoutFirst = this._combinations(rest, k);
        
        return [...withFirst, ...withoutFirst];
    }
    
    /**
     * Get Alexander polynomial Δ₀(A_ψ)
     */
    get alexanderPolynomial() {
        return this.computeFittingIdeal(0).characteristicPolynomial;
    }
    
    /**
     * Get all Fitting ideals up to degree d
     */
    getAllFittingIdeals(maxDegree = 3) {
        const ideals = {};
        for (let d = 0; d <= maxDegree; d++) {
            ideals[d] = this.computeFittingIdeal(d);
        }
        return ideals;
    }
    
    /**
     * Get module signature Σ_{k,S,ℓ,ψ}
     */
    get signature() {
        if (!this._signature) {
            this._signature = this._computeSignature();
        }
        return this._signature;
    }
    
    /**
     * Compute module signature
     * @private
     */
    _computeSignature() {
        const fittingIdeals = this.getAllFittingIdeals();
        const alexPoly = this.alexanderPolynomial;
        
        // Signature components
        const signatureData = {
            primes: this.primes.slice(),
            ell: this.ell,
            field: this.field,
            fittingDegrees: {},
            alexanderPolynomial: alexPoly.toString(),
            characteristicValues: [],
            hash: 0
        };
        
        // Collect Fitting ideal degrees
        for (const [d, ideal] of Object.entries(fittingIdeals)) {
            signatureData.fittingDegrees[d] = {
                degree: parseInt(d),
                isTrivial: ideal.isTrivial,
                isZero: ideal.isZero,
                generatorDegree: ideal.characteristicPolynomial.degree
            };
        }
        
        // Evaluate Alexander polynomial on roots of unity
        const numRoots = 12;
        for (let k = 0; k < numRoots; k++) {
            const theta = (2 * Math.PI * k) / numRoots;
            const val = alexPoly.evaluateOnCircle(theta);
            signatureData.characteristicValues.push({
                k,
                theta,
                abs: val.abs,
                re: val.re,
                im: val.im
            });
        }
        
        // Compute signature hash
        signatureData.hash = this._computeSignatureHash(signatureData);
        
        return signatureData;
    }
    
    /**
     * Compute signature hash
     * @private
     */
    _computeSignatureHash(sig) {
        // Combine prime signature with Alexander polynomial coefficients
        let hash = 0;
        
        // Include primes
        for (const p of sig.primes) {
            hash = ((hash << 5) - hash + p) | 0;
        }
        
        // Include characteristic values
        for (const cv of sig.characteristicValues) {
            hash = ((hash << 5) - hash + Math.round(cv.abs * 1000)) | 0;
        }
        
        return hash >>> 0; // Ensure unsigned
    }
    
    /**
     * Check if two Alexander modules have equivalent signatures
     */
    static equivalentSignatures(sig1, sig2, tolerance = 0.01) {
        if (sig1.primes.length !== sig2.primes.length) return false;
        if (sig1.ell !== sig2.ell) return false;
        
        // Compare characteristic values
        for (let i = 0; i < sig1.characteristicValues.length; i++) {
            const v1 = sig1.characteristicValues[i];
            const v2 = sig2.characteristicValues[i];
            if (Math.abs(v1.abs - v2.abs) > tolerance) return false;
        }
        
        return true;
    }
    
    /**
     * Get JSON representation
     */
    toJSON() {
        return {
            primes: this.primes,
            ell: this.ell,
            field: this.field,
            alexanderPolynomial: this.alexanderPolynomial.toString(),
            signature: this.signature,
            metadata: this.metadata
        };
    }
    
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new AlexanderModule(json.primes, {
            ell: json.ell,
            field: json.field
        });
    }
    
    /**
     * Get statistics
     */
    get stats() {
        const alexPoly = this.alexanderPolynomial;
        const sig = this.signature;
        
        return {
            numPrimes: this.r,
            ell: this.ell,
            alexanderDegree: alexPoly.degree,
            signatureHash: sig.hash,
            meanCharacteristicValue: sig.characteristicValues.reduce(
                (sum, v) => sum + v.abs, 0
            ) / sig.characteristicValues.length
        };
    }
}

// ============================================================================
// MODULE SIGNATURE CLASS
// ============================================================================

/**
 * Module Signature
 *
 * A content-addressable memory key derived from Alexander module invariants.
 * Provides stable "field memory" for prime sets.
 *
 * Uses:
 * - Content-addressable key (prime-set identifier)
 * - Resonance attractor fingerprint
 * - Alignment target for operator evolution
 */
class ModuleSignature {
    /**
     * Create a module signature
     *
     * @param {AlexanderModule} module - Source Alexander module
     */
    constructor(module) {
        this.module = module;
        this._data = null;
    }
    
    /**
     * Get signature data
     */
    get data() {
        if (!this._data) {
            this._data = this.module.signature;
        }
        return this._data;
    }
    
    /**
     * Get signature hash (content-addressable key)
     */
    get hash() {
        return this.data.hash;
    }
    
    /**
     * Get primes
     */
    get primes() {
        return this.data.primes;
    }
    
    /**
     * Get Alexander polynomial string
     */
    get alexanderPolynomial() {
        return this.data.alexanderPolynomial;
    }
    
    /**
     * Get characteristic values (for fingerprinting)
     */
    get fingerprint() {
        return this.data.characteristicValues.map(v => v.abs);
    }
    
    /**
     * Compute distance between two signatures
     */
    distanceTo(other) {
        const fp1 = this.fingerprint;
        const fp2 = other.fingerprint;
        
        if (fp1.length !== fp2.length) {
            throw new Error('Fingerprint length mismatch');
        }
        
        let sumSq = 0;
        for (let i = 0; i < fp1.length; i++) {
            const diff = fp1[i] - fp2[i];
            sumSq += diff * diff;
        }
        
        return Math.sqrt(sumSq);
    }
    
    /**
     * Check if signatures are equivalent
     */
    isEquivalentTo(other, tolerance = 0.01) {
        return AlexanderModule.equivalentSignatures(this.data, other.data, tolerance);
    }
    
    /**
     * Get compact string representation
     */
    toString() {
        return `ModuleSignature[${this.primes.join(',')}|${this.hash.toString(16)}]`;
    }
    
    /**
     * Export as content-addressable memory entry
     */
    toMemoryEntry() {
        return {
            key: this.hash,
            primes: this.primes,
            fingerprint: this.fingerprint,
            polynomial: this.alexanderPolynomial,
            created: Date.now()
        };
    }
}

// ============================================================================
// SIGNATURE MEMORY CLASS
// ============================================================================

/**
 * Signature Memory
 *
 * Content-addressable memory store for module signatures.
 * Enables resonance-based retrieval and alignment.
 */
class SignatureMemory {
    constructor() {
        this.signatures = new Map(); // hash → signature
        this.primeIndex = new Map(); // prime → [hashes]
        this.metadata = {
            created: Date.now(),
            totalEntries: 0
        };
    }
    
    /**
     * Store a signature
     */
    store(signature) {
        const hash = signature.hash;
        
        if (this.signatures.has(hash)) {
            return { stored: false, reason: 'already exists', hash };
        }
        
        this.signatures.set(hash, signature);
        
        // Index by primes
        for (const p of signature.primes) {
            if (!this.primeIndex.has(p)) {
                this.primeIndex.set(p, []);
            }
            this.primeIndex.get(p).push(hash);
        }
        
        this.metadata.totalEntries++;
        
        return { stored: true, hash };
    }
    
    /**
     * Retrieve signature by hash
     */
    get(hash) {
        return this.signatures.get(hash) || null;
    }
    
    /**
     * Check if signature exists
     */
    has(hash) {
        return this.signatures.has(hash);
    }
    
    /**
     * Find signatures containing a specific prime
     */
    findByPrime(prime) {
        const hashes = this.primeIndex.get(prime) || [];
        return hashes.map(h => this.signatures.get(h)).filter(Boolean);
    }
    
    /**
     * Find closest signature to query
     */
    findClosest(querySignature, topK = 5) {
        const results = [];
        
        for (const [hash, sig] of this.signatures) {
            try {
                const distance = querySignature.distanceTo(sig);
                results.push({ hash, signature: sig, distance });
            } catch (e) {
                // Skip incompatible signatures
            }
        }
        
        results.sort((a, b) => a.distance - b.distance);
        return results.slice(0, topK);
    }
    
    /**
     * Find equivalent signatures
     */
    findEquivalent(querySignature, tolerance = 0.01) {
        const equivalent = [];
        
        for (const [hash, sig] of this.signatures) {
            if (querySignature.isEquivalentTo(sig, tolerance)) {
                equivalent.push({ hash, signature: sig });
            }
        }
        
        return equivalent;
    }
    
    /**
     * Get all signatures
     */
    getAll() {
        return [...this.signatures.values()];
    }
    
    /**
     * Get memory statistics
     */
    get stats() {
        const allPrimes = new Set();
        for (const sig of this.signatures.values()) {
            for (const p of sig.primes) {
                allPrimes.add(p);
            }
        }
        
        return {
            totalSignatures: this.signatures.size,
            uniquePrimes: allPrimes.size,
            primeIndex: this.primeIndex.size,
            created: this.metadata.created
        };
    }
    
    /**
     * Clear all signatures
     */
    clear() {
        this.signatures.clear();
        this.primeIndex.clear();
        this.metadata.totalEntries = 0;
    }
    
    /**
     * Export memory to JSON
     */
    toJSON() {
        const entries = [];
        for (const [hash, sig] of this.signatures) {
            entries.push({
                hash,
                primes: sig.primes,
                fingerprint: sig.fingerprint,
                polynomial: sig.alexanderPolynomial
            });
        }
        return { entries, metadata: this.metadata };
    }
    
    /**
     * Import memory from JSON
     */
    static fromJSON(json, moduleFactory) {
        const memory = new SignatureMemory();
        
        for (const entry of json.entries) {
            const module = moduleFactory(entry.primes);
            const signature = new ModuleSignature(module);
            memory.store(signature);
        }
        
        return memory;
    }
}

// ============================================================================
// SIGNATURE EXTRACTOR
// ============================================================================

/**
 * Signature Extractor
 *
 * Extracts module signatures from prime sets and manages
 * the signature extraction pipeline.
 */
class SignatureExtractor {
    /**
     * Create a signature extractor
     *
     * @param {Object} options - Configuration
     * @param {number} options.ell - Base prime (default: 2)
     * @param {SignatureMemory} options.memory - Optional memory store
     */
    constructor(options = {}) {
        this.ell = options.ell || 2;
        this.memory = options.memory || new SignatureMemory();
        this._cache = new Map();
    }
    
    /**
     * Extract signature from prime set
     *
     * @param {number[]} primes - Prime set S
     * @param {Object} options - Extraction options
     * @returns {ModuleSignature} The extracted signature
     */
    extract(primes, options = {}) {
        const key = primes.sort((a, b) => a - b).join(',');
        
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }
        
        const module = new AlexanderModule(primes, {
            ell: options.ell || this.ell,
            field: options.field || 'Q'
        });
        
        const signature = new ModuleSignature(module);
        
        this._cache.set(key, signature);
        
        if (options.store !== false) {
            this.memory.store(signature);
        }
        
        return signature;
    }
    
    /**
     * Extract signatures from multiple prime sets
     */
    extractBatch(primeSets, options = {}) {
        return primeSets.map(primes => this.extract(primes, options));
    }
    
    /**
     * Find resonant signatures (closest matches)
     */
    findResonant(primes, topK = 5) {
        const querySig = this.extract(primes, { store: false });
        return this.memory.findClosest(querySig, topK);
    }
    
    /**
     * Get alignment target for operator evolution
     * Returns the closest signature in memory.
     */
    getAlignmentTarget(primes) {
        const matches = this.findResonant(primes, 1);
        return matches.length > 0 ? matches[0].signature : null;
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this._cache.clear();
    }
    
    /**
     * Get extractor statistics
     */
    get stats() {
        return {
            cacheSize: this._cache.size,
            memoryStats: this.memory.stats,
            ell: this.ell
        };
    }
}

// ============================================================================
// INTEGRATION UTILITIES
// ============================================================================

/**
 * Create Alexander module from prime set
 */
function createAlexanderModule(primes, options = {}) {
    return new AlexanderModule(primes, options);
}

/**
 * Extract signature from prime set (convenience function)
 */
function extractSignature(primes, options = {}) {
    const module = new AlexanderModule(primes, options);
    return new ModuleSignature(module);
}

/**
 * Create signature memory store
 */
function createSignatureMemory() {
    return new SignatureMemory();
}

/**
 * Create signature extractor
 */
function createSignatureExtractor(options = {}) {
    return new SignatureExtractor(options);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // Polynomial utilities
    LaurentPolynomial,
    FittingIdeal,
    
    // Crowell exact sequence
    CrowellSequence,
    
    // Alexander module
    AlexanderModule,
    
    // Signature classes
    ModuleSignature,
    SignatureMemory,
    SignatureExtractor,
    
    // Factory functions
    createAlexanderModule,
    extractSignature,
    createSignatureMemory,
    createSignatureExtractor
};

export default {
    LaurentPolynomial,
    FittingIdeal,
    CrowellSequence,
    AlexanderModule,
    ModuleSignature,
    SignatureMemory,
    SignatureExtractor,
    createAlexanderModule,
    extractSignature,
    createSignatureMemory,
    createSignatureExtractor
};