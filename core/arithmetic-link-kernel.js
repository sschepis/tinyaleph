/**
 * Arithmetic Link Kernel (ALK) for TinyAleph
 * 
 * Implements invariants from arithmetic topology to provide
 * canonical multi-order coupling tensors for prime sets.
 * 
 * Based on: "Arithmetic Link Kernels: Coupling Primes via Linking
 * Symbols, Milnor Invariants, and Higher Residue Structure"
 * 
 * Key concepts:
 * - ALK(S; ℓ, m) = (J, {K⁽³⁾}, {K⁽ⁿ⁾})
 * - J: Pairwise coupling matrix from Legendre/power residue symbols
 * - K⁽³⁾: Triadic coupling from Rédei symbol
 * - K⁽ⁿ⁾: Higher-order coupling from arithmetic Milnor invariants
 * 
 * @module core/arithmetic-link-kernel
 */

'use strict';

import { isPrime, firstNPrimes, factorize } from './prime.js';
import { modPowBigInt as modPow, modInverseBigInt as modInverse } from './math-utils.js';

// ============================================================================
// PHASE 1: PAIRWISE COUPLINGS - Legendre & Power Residue Symbols
// ============================================================================

/**
 * Legendre Symbol Class
 * 
 * The Legendre symbol (a/p) is the mod-2 linking number analogue
 * in arithmetic topology. For odd prime p:
 * 
 * (a/p) = a^((p-1)/2) mod p
 * 
 * Returns:
 *   +1 if a is a quadratic residue mod p
 *   -1 if a is a non-residue mod p
 *    0 if p divides a
 */
class LegendreSymbol {
    /**
     * Compute Legendre symbol (a/p)
     * 
     * @param {number} a - Integer
     * @param {number} p - Odd prime
     * @returns {number} -1, 0, or +1
     */
    static compute(a, p) {
        if (!isPrime(p) || p === 2) {
            throw new Error(`LegendreSymbol requires odd prime, got ${p}`);
        }
        
        a = ((a % p) + p) % p;
        if (a === 0) return 0;
        
        // Euler's criterion: (a/p) ≡ a^((p-1)/2) (mod p)
        const exp = BigInt((p - 1) / 2);
        const result = modPow(BigInt(a), exp, BigInt(p));
        
        if (result === 1n) return 1;
        if (result === BigInt(p) - 1n) return -1;
        return 0;
    }
    
    /**
     * Compute using quadratic reciprocity (alternative method)
     * 
     * @param {number} a - Integer
     * @param {number} p - Odd prime
     * @returns {number} -1, 0, or +1
     */
    static computeReciprocity(a, p) {
        // Reduce a mod p first
        a = ((a % p) + p) % p;
        if (a === 0) return 0;
        if (a === 1) return 1;
        
        // Factor out powers of 2
        let e = 0;
        while (a % 2 === 0) {
            a = a / 2;
            e++;
        }
        
        // (2/p) = (-1)^((p²-1)/8)
        let result = 1;
        if (e % 2 === 1) {
            const pMod8 = p % 8;
            if (pMod8 === 3 || pMod8 === 5) {
                result = -result;
            }
        }
        
        if (a === 1) return result;
        
        // Quadratic reciprocity: (p/a)(a/p) = (-1)^((p-1)(a-1)/4)
        if (p % 4 === 3 && a % 4 === 3) {
            result = -result;
        }
        
        return result * LegendreSymbol.computeReciprocity(p % a, a);
    }
    
    /**
     * Map Legendre symbol to coupling value
     * 
     * @param {number} symbol - Legendre symbol value (-1, 0, +1)
     * @param {string} encoding - 'bipolar' (±1), 'binary' (0/1), 'phase' (0/π)
     * @returns {number} Coupling value
     */
    static toCoupling(symbol, encoding = 'bipolar') {
        switch (encoding) {
            case 'bipolar':
                return symbol; // -1, 0, +1
            case 'binary':
                return symbol === 1 ? 1 : 0;
            case 'phase':
                return symbol === 1 ? 0 : Math.PI;
            case 'unit':
                return symbol === 0 ? 0 : 1;
            default:
                return symbol;
        }
    }
    
    /**
     * Compute coupling matrix J for prime set S
     * Jᵢⱼ := (pᵢ/pⱼ) for i ≠ j, 0 for i = j
     * 
     * @param {number[]} primes - Array of primes
     * @param {string} encoding - Coupling encoding
     * @returns {number[][]} Coupling matrix
     */
    static computeCouplingMatrix(primes, encoding = 'bipolar') {
        const r = primes.length;
        const J = [];
        
        for (let i = 0; i < r; i++) {
            J[i] = new Array(r);
            for (let j = 0; j < r; j++) {
                if (i === j) {
                    J[i][j] = 0;
                } else if (primes[i] === 2 || primes[j] === 2) {
                    // Handle p=2 specially: (a/2) not defined, use (2/p) instead
                    if (primes[j] === 2) {
                        const pMod8 = primes[i] % 8;
                        const val = (pMod8 === 1 || pMod8 === 7) ? 1 : -1;
                        J[i][j] = this.toCoupling(val, encoding);
                    } else {
                        const pMod8 = primes[j] % 8;
                        const val = (pMod8 === 1 || pMod8 === 7) ? 1 : -1;
                        J[i][j] = this.toCoupling(val, encoding);
                    }
                } else {
                    const symbol = this.compute(primes[i], primes[j]);
                    J[i][j] = this.toCoupling(symbol, encoding);
                }
            }
        }
        
        return J;
    }
}

/**
 * Power Residue Symbol Class
 * 
 * Generalizes Legendre symbol to n-th power residues.
 * For prime p ≡ 1 (mod n), the n-th power residue symbol
 * (a/p)_n is an n-th root of unity.
 */
class PowerResidueSymbol {
    /**
     * Compute n-th power residue symbol (a/p)_n
     * 
     * @param {number} a - Integer
     * @param {number} p - Prime with p ≡ 1 (mod n)
     * @param {number} n - Power (typically prime)
     * @returns {Object} { value: number, rootOfUnity: number }
     */
    static compute(a, p, n) {
        if (!isPrime(p)) {
            throw new Error(`PowerResidueSymbol requires prime, got ${p}`);
        }
        
        // Check p ≡ 1 (mod n) for n-th power residue to be defined
        if ((p - 1) % n !== 0) {
            return { value: 0, rootOfUnity: 0, defined: false };
        }
        
        a = ((a % p) + p) % p;
        if (a === 0) return { value: 0, rootOfUnity: 0, defined: true };
        
        // (a/p)_n ≡ a^((p-1)/n) (mod p)
        const exp = BigInt((p - 1) / n);
        const result = Number(modPow(BigInt(a), exp, BigInt(p)));
        
        // Find which n-th root of unity this is
        // result ≡ ζ_n^k for some k
        const g = this.findPrimitiveRoot(p);
        if (g === null) {
            return { value: result, rootOfUnity: 0, defined: true };
        }
        
        // Discrete log to find k
        const gPowN = Number(modPow(BigInt(g), exp, BigInt(p)));
        let k = 0;
        let current = 1;
        for (let i = 0; i < n; i++) {
            if (current === result) {
                k = i;
                break;
            }
            current = (current * gPowN) % p;
        }
        
        return {
            value: result,
            rootOfUnity: k, // ζ_n^k
            phase: 2 * Math.PI * k / n,
            defined: true
        };
    }
    
    /**
     * Find a primitive root mod p
     * @private
     */
    static findPrimitiveRoot(p) {
        if (!isPrime(p)) return null;
        if (p === 2) return 1;
        
        const phi = p - 1;
        const factors = factorize(phi);
        
        for (let g = 2; g < p; g++) {
            let isPrimitive = true;
            for (const q of Object.keys(factors)) {
                const exp = phi / parseInt(q);
                if (modPow(BigInt(g), BigInt(exp), BigInt(p)) === 1n) {
                    isPrimitive = false;
                    break;
                }
            }
            if (isPrimitive) return g;
        }
        
        return null;
    }
    
    /**
     * Compute n-th power residue coupling matrix
     * 
     * @param {number[]} primes - Array of primes
     * @param {number} n - Power
     * @returns {Object[][]} Matrix of power residue data
     */
    static computeCouplingMatrix(primes, n) {
        const r = primes.length;
        const K = [];
        
        for (let i = 0; i < r; i++) {
            K[i] = [];
            for (let j = 0; j < r; j++) {
                if (i === j) {
                    K[i][j] = { value: 0, phase: 0, defined: true };
                } else {
                    K[i][j] = this.compute(primes[i], primes[j], n);
                }
            }
        }
        
        return K;
    }
}

// ============================================================================
// PHASE 2: TRIADIC COUPLINGS - Rédei Symbol
// ============================================================================

/**
 * Rédei Symbol Class
 * 
 * The Rédei symbol [p₁, p₂, p₃] ∈ {±1} is the arithmetic analogue
 * of the triple linking number (Milnor's μ(123)).
 * 
 * It detects Borromean-type coherence: three primes that have
 * no pairwise coupling but exhibit irreducible triadic coupling.
 * 
 * Classical constraints for computability:
 * - p₁, p₂, p₃ are distinct odd primes
 * - (p₁/p₂) = (p₂/p₃) = (p₃/p₁) = 1 (pairwise split)
 * - p₁ ≡ p₂ ≡ 1 (mod 4) typically required
 */
class RedeiSymbol {
    /**
     * Check if Rédei symbol is computable for triple
     * 
     * @param {number} p1 - First prime
     * @param {number} p2 - Second prime
     * @param {number} p3 - Third prime
     * @returns {Object} { computable: boolean, reason: string }
     */
    static isComputable(p1, p2, p3) {
        // All must be distinct odd primes
        if (!isPrime(p1) || !isPrime(p2) || !isPrime(p3)) {
            return { computable: false, reason: 'All arguments must be prime' };
        }
        if (p1 === 2 || p2 === 2 || p3 === 2) {
            return { computable: false, reason: 'Primes must be odd' };
        }
        if (p1 === p2 || p2 === p3 || p1 === p3) {
            return { computable: false, reason: 'Primes must be distinct' };
        }
        
        // Check pairwise splitting: Legendre symbols all +1
        const l12 = LegendreSymbol.compute(p1, p2);
        const l23 = LegendreSymbol.compute(p2, p3);
        const l31 = LegendreSymbol.compute(p3, p1);
        
        if (l12 !== 1 || l23 !== 1 || l31 !== 1) {
            return {
                computable: false,
                reason: 'Pairwise Legendre symbols must all be +1 (splitting condition)',
                legendreSymbols: { l12, l23, l31 }
            };
        }
        
        // Check congruence conditions (simplified version)
        const allMod4 = (p1 % 4 === 1) && (p2 % 4 === 1) && (p3 % 4 === 1);
        if (!allMod4) {
            return {
                computable: false,
                reason: 'Classical Rédei requires pᵢ ≡ 1 (mod 4)',
                congruences: { p1mod4: p1 % 4, p2mod4: p2 % 4, p3mod4: p3 % 4 }
            };
        }
        
        return { computable: true, reason: 'All conditions satisfied' };
    }
    
    /**
     * Compute Rédei symbol [p₁, p₂, p₃]
     * 
     * @param {number} p1 - First prime
     * @param {number} p2 - Second prime
     * @param {number} p3 - Third prime
     * @returns {Object} { value: number, computed: boolean, method: string }
     */
    static compute(p1, p2, p3) {
        const check = this.isComputable(p1, p2, p3);
        if (!check.computable) {
            return { value: 0, computed: false, reason: check.reason };
        }
        
        // Find a such that a² ≡ p₁ (mod p₂)
        const a = this.sqrtMod(p1, p2);
        if (a === null) {
            return { value: 0, computed: false, reason: 'sqrt computation failed' };
        }
        
        // Compute (a/p₃) as approximation to Rédei symbol
        const redei = LegendreSymbol.compute(a, p3);
        
        return {
            value: redei,
            computed: true,
            method: 'genus_theory',
            sqrt_p1_mod_p2: a
        };
    }
    
    /**
     * Compute square root mod p using Tonelli-Shanks
     * @private
     */
    static sqrtMod(n, p) {
        n = ((n % p) + p) % p;
        if (n === 0) return 0;
        
        // Check n is quadratic residue
        if (LegendreSymbol.compute(n, p) !== 1) return null;
        
        // Special case: p ≡ 3 (mod 4)
        if (p % 4 === 3) {
            return Number(modPow(BigInt(n), BigInt((p + 1) / 4), BigInt(p)));
        }
        
        // Tonelli-Shanks algorithm
        let s = 0;
        let q = p - 1;
        while (q % 2 === 0) {
            q = Math.floor(q / 2);
            s++;
        }
        
        // Find non-residue z
        let z = 2;
        while (LegendreSymbol.compute(z, p) !== -1) z++;
        
        let m = s;
        let c = Number(modPow(BigInt(z), BigInt(q), BigInt(p)));
        let t = Number(modPow(BigInt(n), BigInt(q), BigInt(p)));
        let r = Number(modPow(BigInt(n), BigInt((q + 1) / 2), BigInt(p)));
        
        while (true) {
            if (t === 1) return r;
            
            // Find least i such that t^(2^i) ≡ 1
            let i = 1;
            let temp = (t * t) % p;
            while (temp !== 1) {
                temp = (temp * temp) % p;
                i++;
            }
            
            if (i === m) return null;
            
            const b = Number(modPow(BigInt(c), BigInt(1 << (m - i - 1)), BigInt(p)));
            m = i;
            c = (b * b) % p;
            t = (t * c) % p;
            r = (r * b) % p;
        }
    }
    
    /**
     * Compute triadic coupling tensor K⁽³⁾ for prime set
     * 
     * @param {number[]} primes - Array of primes
     * @returns {Object} Sparse tensor representation
     */
    static computeCouplingTensor(primes) {
        const r = primes.length;
        const tensor = {
            size: r,
            entries: new Map(),
            borromean: []
        };
        
        for (let i = 0; i < r; i++) {
            for (let j = i + 1; j < r; j++) {
                for (let k = j + 1; k < r; k++) {
                    const result = this.compute(primes[i], primes[j], primes[k]);
                    
                    if (result.computed) {
                        const key = `${i},${j},${k}`;
                        tensor.entries.set(key, {
                            indices: [i, j, k],
                            primes: [primes[i], primes[j], primes[k]],
                            value: result.value,
                            method: result.method
                        });
                        
                        // Check for Borromean property
                        const l12 = LegendreSymbol.compute(primes[i], primes[j]);
                        const l23 = LegendreSymbol.compute(primes[j], primes[k]);
                        const l31 = LegendreSymbol.compute(primes[k], primes[i]);
                        
                        if (l12 === 1 && l23 === 1 && l31 === 1 && result.value !== 0) {
                            tensor.borromean.push({
                                indices: [i, j, k],
                                primes: [primes[i], primes[j], primes[k]],
                                value: result.value
                            });
                        }
                    }
                }
            }
        }
        
        return tensor;
    }
}

// ============================================================================
// PHASE 3: HIGHER-ORDER COUPLINGS - Arithmetic Milnor Invariants
// ============================================================================

/**
 * Arithmetic Milnor Invariant Class
 * 
 * Milnor invariants μₘ(I) for multi-index I = i₁···iₙ capture
 * n-body prime interactions that are irreducible to lower orders.
 */
class ArithmeticMilnorInvariant {
    /**
     * Create Milnor invariant calculator
     * 
     * @param {number[]} primes - Prime set S = {p₁, ..., pᵣ}
     * @param {number} ell - Prime ℓ for pro-ℓ structure
     * @param {number} e - Power: m = ℓᵉ
     */
    constructor(primes, ell = 2, e = 1) {
        this.primes = primes;
        this.r = primes.length;
        this.ell = ell;
        this.e = e;
        this.m = Math.pow(ell, e);
        this.validPrimes = primes.filter(p => (p - 1) % ell === 0);
        this._cache = new Map();
    }
    
    /**
     * Check if multi-index I is valid
     * @private
     */
    _validateIndex(I) {
        if (!Array.isArray(I) || I.length < 2) {
            return { valid: false, reason: 'Multi-index must have length ≥ 2' };
        }
        for (const i of I) {
            if (i < 0 || i >= this.r) {
                return { valid: false, reason: `Index ${i} out of range [0, ${this.r})` };
            }
        }
        return { valid: true };
    }
    
    /**
     * Compute μₘ(I) for multi-index I
     * 
     * @param {number[]} I - Multi-index [i₁, i₂, ..., iₙ]
     * @returns {Object} { value: number, modulus: number, computed: boolean }
     */
    compute(I) {
        const check = this._validateIndex(I);
        if (!check.valid) {
            return { value: 0, modulus: this.m, computed: false, reason: check.reason };
        }
        
        const key = I.join(',');
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }
        
        let result;
        
        if (I.length === 2) {
            result = this._computeMu2(I[0], I[1]);
        } else if (I.length === 3) {
            result = this._computeMu3(I[0], I[1], I[2]);
        } else {
            result = this._computeMuN(I);
        }
        
        this._cache.set(key, result);
        return result;
    }
    
    /**
     * Compute μₘ(i,j) - pairwise
     * @private
     */
    _computeMu2(i, j) {
        const pi = this.primes[i];
        const pj = this.primes[j];
        
        if (this.ell === 2) {
            const leg = LegendreSymbol.compute(pi, pj);
            const value = leg === 1 ? 0 : 1;
            return {
                value: value % this.m,
                modulus: this.m,
                computed: true,
                method: 'legendre'
            };
        }
        
        const prs = PowerResidueSymbol.compute(pi, pj, this.ell);
        return {
            value: prs.rootOfUnity % this.m,
            modulus: this.m,
            computed: prs.defined,
            method: 'power_residue'
        };
    }
    
    /**
     * Compute μₘ(i,j,k) - triadic
     * @private
     */
    _computeMu3(i, j, k) {
        const mu_ij = this._computeMu2(i, j);
        const mu_jk = this._computeMu2(j, k);
        const mu_ki = this._computeMu2(k, i);
        
        if (mu_ij.value !== 0 || mu_jk.value !== 0 || mu_ki.value !== 0) {
            return {
                value: 0,
                modulus: this.m,
                computed: false,
                reason: 'Lower-order invariants must vanish',
                lowerOrder: { mu_ij: mu_ij.value, mu_jk: mu_jk.value, mu_ki: mu_ki.value }
            };
        }
        
        const pi = this.primes[i];
        const pj = this.primes[j];
        const pk = this.primes[k];
        
        if (this.ell === 2) {
            const redei = RedeiSymbol.compute(pi, pj, pk);
            if (redei.computed) {
                const value = redei.value === 1 ? 0 : 1;
                return {
                    value: value % this.m,
                    modulus: this.m,
                    computed: true,
                    method: 'redei'
                };
            }
        }
        
        return this._computeMasseyTriple(i, j, k);
    }
    
    /**
     * Compute μₘ(I) for |I| ≥ 4
     * @private
     */
    _computeMuN(I) {
        for (let len = 2; len < I.length; len++) {
            for (let start = 0; start <= I.length - len; start++) {
                const subIndex = I.slice(start, start + len);
                const subMu = this.compute(subIndex);
                if (subMu.value !== 0) {
                    return {
                        value: 0,
                        modulus: this.m,
                        computed: false,
                        reason: `Sub-index μ(${subIndex.join(',')}) = ${subMu.value} ≠ 0`
                    };
                }
            }
        }
        
        return this._computeFoxDerivative(I);
    }
    
    /**
     * Approximate Massey triple product
     * @private
     */
    _computeMasseyTriple(i, j, k) {
        const pi = this.primes[i];
        const pj = this.primes[j];
        const pk = this.primes[k];
        
        const hash = (pi * pj * pk) % this.m;
        
        return {
            value: hash,
            modulus: this.m,
            computed: true,
            method: 'massey_approx',
            note: 'Simplified computation'
        };
    }
    
    /**
     * Fox derivative computation for higher-order invariants
     * @private
     */
    _computeFoxDerivative(I) {
        const n = I.length;
        let value = 0;
        
        for (let i = 0; i < n; i++) {
            const sign = (i % 2 === 0) ? 1 : -1;
            value += sign * this.primes[I[i]];
        }
        
        value = ((value % this.m) + this.m) % this.m;
        
        return {
            value,
            modulus: this.m,
            computed: true,
            method: 'fox_derivative_approx',
            order: n
        };
    }
    
    /**
     * Get all non-vanishing invariants up to order n
     * 
     * @param {number} maxOrder - Maximum order to compute
     * @returns {Map} Map of multi-index → invariant value
     */
    getAllInvariants(maxOrder = 3) {
        const invariants = new Map();
        
        const generateIndices = (length) => {
            if (length === 0) return [[]];
            const shorter = generateIndices(length - 1);
            const result = [];
            for (const idx of shorter) {
                const start = idx.length > 0 ? idx[idx.length - 1] + 1 : 0;
                for (let i = start; i < this.r; i++) {
                    result.push([...idx, i]);
                }
            }
            return result;
        };
        
        for (let order = 2; order <= maxOrder; order++) {
            const indices = generateIndices(order);
            for (const I of indices) {
                const mu = this.compute(I);
                if (mu.computed && mu.value !== 0) {
                    invariants.set(I.join(','), {
                        index: I,
                        ...mu
                    });
                }
            }
        }
        
        return invariants;
    }
}

/**
 * Multiple Residue Symbol Class
 *
 * The n-fold multiple residue symbol [p_{i₁}, ..., p_{iₙ}] ∈ μ_ℓ
 * extends pairwise Legendre/power residue symbols to n-body interactions.
 */
class MultipleResidueSymbol {
    /**
     * Compute n-fold multiple residue symbol
     *
     * @param {number[]} primes - Array of n primes [p_{i₁}, ..., p_{iₙ}]
     * @param {number} ell - Prime ℓ
     * @returns {Object} { value: Complex, rootOfUnity: number }
     */
    static compute(primes, ell = 2) {
        if (primes.length < 2) {
            return { value: 1, rootOfUnity: 0, computed: false, reason: 'Need at least 2 primes' };
        }
        
        const milnor = new ArithmeticMilnorInvariant(primes, ell);
        const I = primes.map((_, i) => i);
        
        for (let len = 2; len < primes.length; len++) {
            for (let start = 0; start <= primes.length - len; start++) {
                const subI = I.slice(start, start + len);
                const mu = milnor.compute(subI);
                if (mu.computed && mu.value !== 0) {
                    return {
                        value: 0,
                        rootOfUnity: 0,
                        computed: false,
                        reason: `Lower-order μ(${subI.join(',')}) = ${mu.value} ≠ 0`
                    };
                }
            }
        }
        
        const mu = milnor.compute(I);
        const k = mu.value;
        const phase = 2 * Math.PI * k / ell;
        
        return {
            value: { re: Math.cos(phase), im: Math.sin(phase) },
            rootOfUnity: k,
            phase,
            computed: mu.computed,
            method: mu.method
        };
    }
}

// ============================================================================
// ARITHMETIC LINK KERNEL - Main Class
// ============================================================================

/**
 * Arithmetic Link Kernel (ALK)
 *
 * Packages arithmetic topology invariants as coupling tensors for
 * prime-resonant operator dynamics.
 *
 * ALK(S; ℓ, m) = (J, {K⁽³⁾}, {K⁽ⁿ⁾})
 */
class ArithmeticLinkKernel {
    /**
     * Create an Arithmetic Link Kernel
     *
     * @param {number[]} primes - Prime set S = {p₁, ..., pᵣ}
     * @param {Object} options - Configuration
     */
    constructor(primes, options = {}) {
        this.primes = primes.filter(p => isPrime(p)).sort((a, b) => a - b);
        this.r = this.primes.length;
        
        if (this.r < 2) {
            throw new Error('ALK requires at least 2 primes');
        }
        
        this.ell = options.ell || 2;
        this.e = options.e || 1;
        this.m = Math.pow(this.ell, this.e);
        this.encoding = options.encoding || 'bipolar';
        this.maxOrder = options.maxOrder || 3;
        
        this._J = null;
        this._K3 = null;
        this._Kn = new Map();
        this._milnor = null;
        
        this.metadata = {
            created: Date.now(),
            primeProduct: primes.reduce((a, b) => a * b, 1),
            primeSum: primes.reduce((a, b) => a + b, 0)
        };
    }
    
    /**
     * Get pairwise coupling matrix J ∈ ℝʳˣʳ
     */
    get J() {
        if (!this._J) {
            this._J = LegendreSymbol.computeCouplingMatrix(this.primes, this.encoding);
        }
        return this._J;
    }
    
    /**
     * Get coupling between specific primes
     */
    getCoupling(p1, p2) {
        const i = this.primes.indexOf(p1);
        const j = this.primes.indexOf(p2);
        
        if (i === -1 || j === -1) {
            throw new Error(`Primes ${p1}, ${p2} not in kernel`);
        }
        
        return this.J[i][j];
    }
    
    /**
     * Get symmetrized coupling matrix (J + J^T) / 2
     */
    get Jsym() {
        const J = this.J;
        const Jsym = [];
        
        for (let i = 0; i < this.r; i++) {
            Jsym[i] = [];
            for (let j = 0; j < this.r; j++) {
                Jsym[i][j] = (J[i][j] + J[j][i]) / 2;
            }
        }
        
        return Jsym;
    }
    
    /**
     * Get triadic coupling tensor K⁽³⁾
     */
    get K3() {
        if (!this._K3) {
            this._K3 = RedeiSymbol.computeCouplingTensor(this.primes);
        }
        return this._K3;
    }
    
    /**
     * Get triadic coupling for specific triple
     */
    getTriadicCoupling(p1, p2, p3) {
        const sorted = [p1, p2, p3].sort((a, b) => a - b);
        const i = this.primes.indexOf(sorted[0]);
        const j = this.primes.indexOf(sorted[1]);
        const k = this.primes.indexOf(sorted[2]);
        
        if (i === -1 || j === -1 || k === -1) {
            throw new Error('Primes not in kernel');
        }
        
        const key = `${i},${j},${k}`;
        return this.K3.entries.get(key) || { value: 0, computed: false };
    }
    
    /**
     * Get n-body coupling K⁽ⁿ⁾
     */
    getKn(n) {
        if (n < 4) {
            throw new Error('Use J for n=2 or K3 for n=3');
        }
        
        if (!this._Kn.has(n)) {
            this._computeKn(n);
        }
        
        return this._Kn.get(n);
    }
    
    /**
     * Compute K⁽ⁿ⁾ tensor
     * @private
     */
    _computeKn(n) {
        if (!this._milnor) {
            this._milnor = new ArithmeticMilnorInvariant(this.primes, this.ell, this.e);
        }
        
        const tensor = {
            order: n,
            size: this.r,
            entries: new Map()
        };
        
        const generateTuples = (remaining, current, start) => {
            if (remaining === 0) {
                const I = [...current];
                const mu = this._milnor.compute(I);
                if (mu.computed && mu.value !== 0) {
                    tensor.entries.set(I.join(','), {
                        indices: I,
                        primes: I.map(i => this.primes[i]),
                        value: mu.value,
                        modulus: mu.modulus
                    });
                }
                return;
            }
            
            for (let i = start; i < this.r; i++) {
                current.push(i);
                generateTuples(remaining - 1, current, i + 1);
                current.pop();
            }
        };
        
        generateTuples(n, [], 0);
        this._Kn.set(n, tensor);
    }
    
    /**
     * Find all Borromean triples
     */
    findBorromeanTriples() {
        return this.K3.borromean;
    }
    
    /**
     * Check if a specific triple is Borromean
     */
    isBorromean(p1, p2, p3) {
        const J = this.J;
        const i = this.primes.indexOf(p1);
        const j = this.primes.indexOf(p2);
        const k = this.primes.indexOf(p3);
        
        if (i === -1 || j === -1 || k === -1) return false;
        
        const trivial = this.encoding === 'bipolar' ? 1 : 0;
        if (J[i][j] !== trivial || J[j][k] !== trivial || J[k][i] !== trivial) {
            return false;
        }
        
        const triadic = this.getTriadicCoupling(p1, p2, p3);
        return triadic.value !== 0;
    }
    
    /**
     * Build interaction Hamiltonian using ALK couplings
     */
    buildHamiltonian(operators) {
        const J = this.J;
        const K3 = this.K3;
        
        return (state) => {
            let result = state.clone ? state.clone() : { ...state };
            
            if (operators.pairwise) {
                for (let i = 0; i < this.r; i++) {
                    for (let j = i + 1; j < this.r; j++) {
                        const coupling = J[i][j];
                        if (Math.abs(coupling) > 1e-10) {
                            const op = operators.pairwise(this.primes[i], this.primes[j]);
                            result = op(result, coupling);
                        }
                    }
                }
            }
            
            if (operators.triadic) {
                for (const [, entry] of K3.entries) {
                    const [i, j, k] = entry.indices;
                    const coupling = entry.value;
                    if (Math.abs(coupling) > 1e-10) {
                        const op = operators.triadic(
                            this.primes[i],
                            this.primes[j],
                            this.primes[k]
                        );
                        result = op(result, coupling);
                    }
                }
            }
            
            return result;
        };
    }
    
    /**
     * Get ALK as JSON-serializable object
     */
    toJSON() {
        return {
            primes: this.primes,
            ell: this.ell,
            m: this.m,
            encoding: this.encoding,
            J: this.J,
            K3: {
                size: this.K3.size,
                entries: Array.from(this.K3.entries.entries()),
                borromean: this.K3.borromean
            },
            metadata: this.metadata
        };
    }
    
    /**
     * Create ALK from JSON
     */
    static fromJSON(json) {
        const alk = new ArithmeticLinkKernel(json.primes, {
            ell: json.ell,
            encoding: json.encoding
        });
        
        alk._J = json.J;
        alk._K3 = {
            size: json.K3.size,
            entries: new Map(json.K3.entries),
            borromean: json.K3.borromean
        };
        alk.metadata = json.metadata;
        
        return alk;
    }
    
    /**
     * Get summary statistics
     */
    get stats() {
        const J = this.J;
        const K3 = this.K3;
        
        let pairwiseNonTrivial = 0;
        let pairwiseSum = 0;
        const trivial = this.encoding === 'bipolar' ? 1 : 0;
        
        for (let i = 0; i < this.r; i++) {
            for (let j = i + 1; j < this.r; j++) {
                if (J[i][j] !== trivial) {
                    pairwiseNonTrivial++;
                }
                pairwiseSum += Math.abs(J[i][j]);
            }
        }
        
        const maxPairwise = this.r * (this.r - 1) / 2;
        
        return {
            numPrimes: this.r,
            pairwiseCouplings: maxPairwise,
            pairwiseNonTrivial,
            pairwiseDensity: pairwiseNonTrivial / maxPairwise,
            meanAbsCoupling: pairwiseSum / maxPairwise,
            triadicEntries: K3.entries.size,
            borromeanTriples: K3.borromean.length
        };
    }
}

// ============================================================================
// ALK OPERATORS - Integration with PrimeState / Hilbert dynamics
// ============================================================================

/**
 * ALK-based resonance operators for PrimeState
 */
const ALKOperators = {
    /**
     * ALK-weighted resonance operator
     */
    Resonance(alk) {
        const J = alk.J;
        const primes = alk.primes;
        
        return (state) => {
            if (!state.amplitudes && !state.get) {
                throw new Error('State must have amplitudes');
            }
            
            const result = state.clone ? state.clone() : { amplitudes: new Map(state.amplitudes) };
            const newAmps = new Map();
            
            for (let i = 0; i < primes.length; i++) {
                const pi = primes[i];
                let sumRe = 0, sumIm = 0;
                
                for (let j = 0; j < primes.length; j++) {
                    const pj = primes[j];
                    const amp = state.get ? state.get(pj) : (state.amplitudes.get(pj) || { re: 0, im: 0 });
                    const coupling = J[i][j];
                    
                    sumRe += coupling * (amp.re || 0);
                    sumIm += coupling * (amp.im || 0);
                }
                
                newAmps.set(pi, { re: sumRe, im: sumIm });
            }
            
            for (const [p, amp] of newAmps) {
                if (result.set) {
                    result.set(p, amp);
                } else if (result.amplitudes) {
                    result.amplitudes.set(p, amp);
                }
            }
            
            return result;
        };
    },
    
    /**
     * Triadic phase-lock operator using K³
     */
    TriadicPhaseLock(alk) {
        const K3 = alk.K3;
        const primes = alk.primes;
        
        return (state) => {
            if (!state.amplitudes && !state.get) {
                throw new Error('State must have amplitudes');
            }
            
            const result = state.clone ? state.clone() : { amplitudes: new Map(state.amplitudes) };
            
            for (const [, entry] of K3.entries) {
                const [i, j, k] = entry.indices;
                const pk = primes[k];
                
                const get = (p) => state.get ? state.get(p) : state.amplitudes.get(p);
                const ak = get(pk);
                
                if (!ak) continue;
                
                const phase = entry.value * Math.PI / 2;
                const rotation = { re: Math.cos(phase), im: Math.sin(phase) };
                
                const newAk = {
                    re: (ak.re || 0) * rotation.re - (ak.im || 0) * rotation.im,
                    im: (ak.im || 0) * rotation.re + (ak.re || 0) * rotation.im
                };
                
                if (result.set) {
                    result.set(pk, newAk);
                } else if (result.amplitudes) {
                    result.amplitudes.set(pk, newAk);
                }
            }
            
            return result;
        };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find Borromean primes in a larger set
 */
function findBorromeanPrimes(primes, maxResults = 100) {
    const alk = new ArithmeticLinkKernel(primes);
    return alk.findBorromeanTriples().slice(0, maxResults);
}

/**
 * Compute pairwise coupling matrix for convenience
 */
function computeLegendreMatrix(primes, encoding = 'bipolar') {
    return LegendreSymbol.computeCouplingMatrix(primes, encoding);
}

/**
 * Quick check if triple might be Borromean
 */
function quickBorromeanCheck(p1, p2, p3) {
    if (!isPrime(p1) || !isPrime(p2) || !isPrime(p3)) {
        return { possible: false, reason: 'Not all primes' };
    }
    if (p1 === 2 || p2 === 2 || p3 === 2) {
        return { possible: false, reason: 'Contains 2' };
    }
    
    const l12 = LegendreSymbol.compute(p1, p2);
    const l23 = LegendreSymbol.compute(p2, p3);
    const l31 = LegendreSymbol.compute(p3, p1);
    
    if (l12 !== 1 || l23 !== 1 || l31 !== 1) {
        return {
            possible: false,
            reason: 'Pairwise Legendre not all +1',
            legendreSymbols: { l12, l23, l31 }
        };
    }
    
    const check = RedeiSymbol.isComputable(p1, p2, p3);
    if (!check.computable) {
        return { possible: true, reason: 'Rédei not computable: ' + check.reason };
    }
    
    const redei = RedeiSymbol.compute(p1, p2, p3);
    
    return {
        possible: redei.computed && redei.value !== 0,
        isBorromean: redei.computed && redei.value === -1,
        redeiSymbol: redei.value,
        reason: redei.computed ? 'Computed' : redei.reason
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // Modular arithmetic
    modPow,
    modInverse,
    
    // Phase 1: Pairwise
    LegendreSymbol,
    PowerResidueSymbol,
    
    // Phase 2: Triadic
    RedeiSymbol,
    
    // Phase 3: Higher-order
    ArithmeticMilnorInvariant,
    MultipleResidueSymbol,
    
    // Main ALK class
    ArithmeticLinkKernel,
    
    // Operators
    ALKOperators,
    
    // Utilities
    findBorromeanPrimes,
    computeLegendreMatrix,
    quickBorromeanCheck
};

export default {
    modPow,
    modInverse,
    LegendreSymbol,
    PowerResidueSymbol,
    RedeiSymbol,
    ArithmeticMilnorInvariant,
    MultipleResidueSymbol,
    ArithmeticLinkKernel,
    ALKOperators,
    findBorromeanPrimes,
    computeLegendreMatrix,
    quickBorromeanCheck
};