/**
 * CRT-Homology Module for tinyaleph
 * 
 * Implements:
 * - Differentiable Chinese Remainder Theorem (CRT) reconstruction
 * - Birkhoff polytope projection (doubly-stochastic attention)
 * - Residue encoding over coprime moduli
 * - Homology loss for detecting consistency failures (holes)
 * 
 * Key Insight: "Holes are not degrees of freedom. Holes are consistency 
 * failures that persist under perturbation."
 * 
 * Mathematical Framework:
 * - r_k = softmax(W_k h + b_k) ∈ Δ(ℤ/p_k)  (residue distribution)
 * - L̂ = Σ_k E[r_k] * (P/p_k) * (P/p_k)^{-1} mod p_k  (CRT reconstruction)
 * - Ker(ℛ) = { r | ℛ(r) undefined } (obstruction cycles)
 * - ℒ_homology = Σ_{cycles ∈ Ker(ℛ)} f(cycle)  (homology loss)
 * 
 * @module core/crt-homology
 */

'use strict';

// ============================================================================
// MODULAR ARITHMETIC UTILITIES
// ============================================================================

/**
 * Extended Euclidean Algorithm
 * Returns { gcd, x, y } such that gcd = a*x + b*y
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {Object} { gcd, x, y }
 */
import { firstNPrimes, isPrime, factorize } from './prime.js';
import { Complex, PrimeState } from './hilbert.js';
import { SparsePrimeState, resonanceScore, Quaternion } from './rformer.js';

function extendedGCD(a, b) {
    if (b === 0) {
        return { gcd: a, x: 1, y: 0 };
    }
    
    const { gcd, x: x1, y: y1 } = extendedGCD(b, a % b);
    const x = y1;
    const y = x1 - Math.floor(a / b) * y1;
    
    return { gcd, x, y };
}

/**
 * Modular multiplicative inverse
 * Returns a^{-1} mod m such that a * a^{-1} ≡ 1 (mod m)
 * @param {number} a - Number to invert
 * @param {number} m - Modulus
 * @returns {number|null} Inverse if exists, null otherwise
 */
function modInverse(a, m) {
    a = ((a % m) + m) % m;  // Normalize to positive
    const { gcd, x } = extendedGCD(a, m);
    
    if (gcd !== 1) {
        return null;  // No inverse exists (not coprime)
    }
    
    return ((x % m) + m) % m;
}

/**
 * Check if two numbers are coprime
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {boolean} True if gcd(a, b) = 1
 */
function areCoprime(a, b) {
    return extendedGCD(a, b).gcd === 1;
}

/**
 * Softmax function
 * @param {Array<number>} logits - Input logits
 * @returns {Array<number>} Probability distribution
 */
function softmax(logits) {
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(l => Math.exp(l - maxLogit));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    return expLogits.map(e => e / (sumExp + 1e-10));
}

// ============================================================================
// RESIDUE ENCODER: r_k = softmax(W_k h + b_k) ∈ Δ(ℤ/p_k)
// ============================================================================

/**
 * Residue Encoder
 * 
 * Encodes a hidden vector h into K residue distributions, one per prime modulus.
 * Each residue r_k is a probability distribution over ℤ/p_k.
 */
class ResidueEncoder {
    /**
     * Create a residue encoder
     * @param {Array<number>} primes - Array of coprime moduli [p_1, p_2, ..., p_K]
     * @param {number} hiddenDim - Dimension of input hidden vector
     * @param {Object} options - Configuration options
     */
    constructor(primes, hiddenDim, options = {}) {
        // Validate primes are coprime
        for (let i = 0; i < primes.length; i++) {
            for (let j = i + 1; j < primes.length; j++) {
                if (!areCoprime(primes[i], primes[j])) {
                    throw new Error(`Primes ${primes[i]} and ${primes[j]} are not coprime`);
                }
            }
        }
        
        this.primes = primes;
        this.K = primes.length;
        this.hiddenDim = hiddenDim;
        
        // Compute P = ∏ p_k
        this.P = primes.reduce((a, b) => a * b, 1);
        
        // Initialize weight matrices W_k (hiddenDim x p_k) and biases b_k
        // In a real differentiable setting, these would be trainable parameters
        this.weights = primes.map(p => this._initMatrix(hiddenDim, p, options.initScale || 0.1));
        this.biases = primes.map(p => new Float64Array(p));
        
        // Optional: learnable prime parameters
        this.learnablePrimes = options.learnablePrimes || false;
    }
    
    /**
     * Initialize a weight matrix with small random values
     * @private
     */
    _initMatrix(rows, cols, scale = 0.1) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = new Float64Array(cols);
            for (let j = 0; j < cols; j++) {
                row[j] = (Math.random() - 0.5) * 2 * scale;
            }
            matrix.push(row);
        }
        return matrix;
    }
    
    /**
     * Matrix-vector multiplication
     * @private
     */
    _matVec(matrix, vec) {
        const result = new Float64Array(matrix[0].length);
        for (let j = 0; j < matrix[0].length; j++) {
            for (let i = 0; i < matrix.length; i++) {
                result[j] += matrix[i][j] * (vec[i] || 0);
            }
        }
        return result;
    }
    
    /**
     * Encode hidden vector to K residue distributions
     * r_k = softmax(W_k^T h + b_k) ∈ Δ(ℤ/p_k)
     * 
     * @param {Array<number>|Float64Array} h - Hidden vector of dimension hiddenDim
     * @returns {Array<Float64Array>} Array of K probability distributions
     */
    encode(h) {
        return this.primes.map((p, k) => {
            // Compute logits: W_k^T h + b_k
            const logits = this._matVec(this.weights[k], h);
            for (let i = 0; i < p; i++) {
                logits[i] += this.biases[k][i];
            }
            // Apply softmax to get probability distribution over ℤ/p_k
            return Float64Array.from(softmax(Array.from(logits)));
        });
    }
    
    /**
     * Compute expected residue E[r_k] = Σ_{i=0}^{p_k-1} i * r_k[i]
     * @param {Float64Array} r_k - Residue distribution for modulus k
     * @returns {number} Expected value
     */
    expectedResidue(r_k) {
        let sum = 0;
        for (let i = 0; i < r_k.length; i++) {
            sum += i * r_k[i];
        }
        return sum;
    }
    
    /**
     * Get all expected residues from encoded distributions
     * @param {Array<Float64Array>} residues - Encoded residue distributions
     * @returns {Array<number>} Expected residues [E[r_1], ..., E[r_K]]
     */
    expectedResidues(residues) {
        return residues.map(r => this.expectedResidue(r));
    }
    
    /**
     * Encode from SparsePrimeState (integration with existing tinyaleph types)
     * @param {SparsePrimeState} state - Sparse prime state
     * @returns {Array<Float64Array>} Residue distributions
     */
    encodeFromPrimeState(state) {
        // Convert sparse state to dense hidden vector
        const h = new Float64Array(this.hiddenDim);
        const activePrimes = state.getActivePrimes();
        
        for (let i = 0; i < Math.min(activePrimes.length, this.hiddenDim); i++) {
            const p = activePrimes[i];
            const act = state.get(p);
            h[i] = act.amplitude.norm();
        }
        
        return this.encode(h);
    }
}

// ============================================================================
// CRT RECONSTRUCTOR: ℛ(r) = Σ_k E[r_k] * (P/p_k) * (P/p_k)^{-1} mod P
// ============================================================================

/**
 * Chinese Remainder Theorem Reconstructor
 * 
 * Reconstructs a unique value L̂ ∈ [0, P) from residues mod each p_k.
 */
class CRTReconstructor {
    /**
     * Create a CRT reconstructor
     * @param {Array<number>} primes - Array of coprime moduli
     */
    constructor(primes) {
        this.primes = primes;
        this.K = primes.length;
        this.P = primes.reduce((a, b) => a * b, 1);
        
        // Precompute CRT coefficients: M_k = P/p_k and M_k^{-1} mod p_k
        this.coefficients = primes.map(p => {
            const Mk = this.P / p;
            const MkInv = modInverse(Mk, p);
            if (MkInv === null) {
                throw new Error(`Cannot compute modular inverse of ${Mk} mod ${p}`);
            }
            return { Mk, MkInv };
        });
    }
    
    /**
     * Reconstruct value from expected residues (differentiable)
     * L̂ = Σ_k E[r_k] * M_k * M_k^{-1} mod P
     * 
     * @param {Array<number>} residues - Expected residues [E[r_1], ..., E[r_K]]
     * @returns {number} Reconstructed value L̂
     */
    reconstruct(residues) {
        let L = 0;
        for (let k = 0; k < this.K; k++) {
            const { Mk, MkInv } = this.coefficients[k];
            L += residues[k] * Mk * MkInv;
        }
        // Modular reduction (soft for differentiability in practice)
        return ((L % this.P) + this.P) % this.P;
    }
    
    /**
     * Compute reconstruction error (distance to nearest valid CRT value)
     * ε(r) = |ℛ(r) - nearest_valid|
     * 
     * @param {Array<number>} residues - Expected residues
     * @returns {number} Reconstruction error
     */
    reconstructionError(residues) {
        const L = this.reconstruct(residues);
        const nearestValid = Math.round(L);
        return Math.abs(L - nearestValid);
    }
    
    /**
     * Detect if residue tuple is in kernel (obstruction)
     * Ker(ℛ) ≈ { r | ε(r) > τ }
     * 
     * @param {Array<number>} residues - Expected residues
     * @param {number} tau - Error threshold
     * @returns {boolean} True if in kernel (obstruction detected)
     */
    detectKernel(residues, tau = 0.1) {
        const epsilon = this.reconstructionError(residues);
        return epsilon > tau;
    }
    
    /**
     * Validate that residues are consistent (not in kernel)
     * @param {Array<number>} residues - Expected residues
     * @param {number} tau - Threshold
     * @returns {Object} { valid, error, inKernel }
     */
    validate(residues, tau = 0.1) {
        const error = this.reconstructionError(residues);
        const inKernel = error > tau;
        return {
            valid: !inKernel,
            error,
            inKernel,
            reconstructed: this.reconstruct(residues)
        };
    }
}

// ============================================================================
// BIRKHOFF PROJECTION: A = Birkhoff(QK^T/√d) ⊙ V
// ============================================================================

/**
 * Birkhoff Polytope Projector
 * 
 * Projects attention matrices onto the Birkhoff polytope (set of doubly-stochastic
 * matrices) using the Sinkhorn-Knopp algorithm.
 * 
 * A doubly-stochastic matrix has all row sums = 1 and all column sums = 1.
 * This constrains attention to "physical" transitions in the modular algebra.
 */
class BirkhoffProjector {
    /**
     * Create a Birkhoff projector
     * @param {number} iterations - Number of Sinkhorn iterations
     * @param {number} epsilon - Small constant for numerical stability
     */
    constructor(iterations = 10, epsilon = 1e-10) {
        this.iterations = iterations;
        this.epsilon = epsilon;
    }
    
    /**
     * Sinkhorn-Knopp algorithm for doubly-stochastic projection
     * @param {Array<Array<number>>} matrix - Input matrix (non-negative)
     * @returns {Array<Array<number>>} Doubly-stochastic matrix
     */
    project(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        
        // Exponentiate (soft threshold) and ensure positivity
        let P = matrix.map(row => row.map(x => Math.exp(x) + this.epsilon));
        
        for (let iter = 0; iter < this.iterations; iter++) {
            // Row normalization: each row sums to 1
            P = P.map(row => {
                const sum = row.reduce((a, b) => a + b, 0);
                return row.map(x => x / (sum + this.epsilon));
            });
            
            // Column normalization: each column sums to 1
            const colSums = new Float64Array(cols);
            for (let j = 0; j < cols; j++) {
                for (let i = 0; i < rows; i++) {
                    colSums[j] += P[i][j];
                }
            }
            
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    P[i][j] /= (colSums[j] + this.epsilon);
                }
            }
        }
        
        return P;
    }
    
    /**
     * Birkhoff attention: A = Birkhoff(QK^T/√d) ⊙ V
     * @param {Array<Array<number>>} Q - Query matrix (n x d)
     * @param {Array<Array<number>>} K - Key matrix (m x d)
     * @param {Array<Array<number>>} V - Value matrix (m x d_v)
     * @returns {Array<Array<number>>} Attention output
     */
    attention(Q, K, V) {
        const n = Q.length;
        const m = K.length;
        const d = Q[0].length;
        const scale = 1 / Math.sqrt(d);
        
        // Compute QK^T / √d
        const scores = [];
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < m; j++) {
                let dot = 0;
                for (let k = 0; k < d; k++) {
                    dot += Q[i][k] * K[j][k];
                }
                row.push(dot * scale);
            }
            scores.push(row);
        }
        
        // Project to Birkhoff polytope
        const A = this.project(scores);
        
        // Apply attention to values: A ⊙ V
        const dv = V[0].length;
        const output = [];
        for (let i = 0; i < n; i++) {
            const row = new Float64Array(dv);
            for (let j = 0; j < m; j++) {
                for (let k = 0; k < dv; k++) {
                    row[k] += A[i][j] * V[j][k];
                }
            }
            output.push(Array.from(row));
        }
        
        return output;
    }
    
    /**
     * Check if matrix is doubly-stochastic (within tolerance)
     * @param {Array<Array<number>>} matrix - Matrix to check
     * @param {number} tolerance - Tolerance for sum deviation
     * @returns {Object} { isDoublyStochastic, rowErrors, colErrors }
     */
    validate(matrix, tolerance = 0.01) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        
        const rowSums = matrix.map(row => row.reduce((a, b) => a + b, 0));
        const colSums = new Float64Array(cols);
        for (let j = 0; j < cols; j++) {
            for (let i = 0; i < rows; i++) {
                colSums[j] += matrix[i][j];
            }
        }
        
        const rowErrors = rowSums.map(s => Math.abs(s - 1));
        const colErrors = Array.from(colSums).map(s => Math.abs(s - 1));
        
        const maxRowError = Math.max(...rowErrors);
        const maxColError = Math.max(...colErrors);
        
        return {
            isDoublyStochastic: maxRowError < tolerance && maxColError < tolerance,
            rowErrors,
            colErrors,
            maxRowError,
            maxColError
        };
    }
}

// ============================================================================
// HOMOLOGY LOSS: ℒ_homology = Σ_{cycles ∈ Ker(ℛ)} f(cycle)
// ============================================================================

/**
 * Homology Loss Calculator
 * 
 * Computes loss terms for obstruction cycles in the residue constraint graph.
 * A cycle represents a consistency failure that persists under perturbation.
 * 
 * f(cycle) = Σ_{r ∈ cycle} σ(ε(r) - τ) * |cycle|^α * β^γ
 */
class HomologyLoss {
    /**
     * Create a homology loss calculator
     * @param {Object} options - Configuration
     * @param {number} options.tau - Kernel detection threshold
     * @param {number} options.alpha - Cycle length exponent
     * @param {number} options.beta - Residue contribution weight
     * @param {number} options.gamma - Residue exponent
     * @param {number} options.lambda - Overall homology loss weight
     */
    constructor(options = {}) {
        this.tau = options.tau ?? 0.1;
        this.alpha = options.alpha ?? 1.0;
        this.beta = options.beta ?? 1.0;
        this.gamma = options.gamma ?? 0.5;
        this.lambda = options.lambda ?? 1.0;
    }
    
    /**
     * Sigmoid activation
     * @param {number} x - Input
     * @returns {number} σ(x)
     */
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    /**
     * Detect cycles in residue space from a batch of residue tuples
     * Groups consecutive kernel points as cycles
     * 
     * @param {Array<Array<number>>} residueBatch - Batch of residue tuples
     * @param {CRTReconstructor} crt - CRT reconstructor
     * @returns {Array<Array<Object>>} Detected cycles
     */
    detectCycles(residueBatch, crt) {
        const cycles = [];
        let currentCycle = [];
        
        for (let i = 0; i < residueBatch.length; i++) {
            const residues = residueBatch[i];
            const inKernel = crt.detectKernel(residues, this.tau);
            
            if (inKernel) {
                currentCycle.push({
                    index: i,
                    residues,
                    error: crt.reconstructionError(residues)
                });
            } else if (currentCycle.length > 0) {
                cycles.push(currentCycle);
                currentCycle = [];
            }
        }
        
        // Don't forget the last cycle
        if (currentCycle.length > 0) {
            cycles.push(currentCycle);
        }
        
        return cycles;
    }
    
    /**
     * Compute loss for a single cycle
     * f(cycle) = Σ_{r ∈ cycle} σ(ε(r) - τ) * |cycle|^α * β^γ
     * 
     * @param {Array<Object>} cycle - Points in the cycle
     * @returns {number} Cycle loss
     */
    cycleLoss(cycle) {
        const cycleLength = cycle.length;
        let loss = 0;
        
        for (const point of cycle) {
            const sigmaEpsilon = this.sigmoid(point.error - this.tau);
            loss += sigmaEpsilon * Math.pow(cycleLength, this.alpha) * 
                    Math.pow(this.beta, this.gamma);
        }
        
        return loss;
    }
    
    /**
     * Compute total homology loss over a batch
     * ℒ_homology = Σ_{cycles} f(cycle)
     * 
     * @param {Array<Array<number>>} residueBatch - Batch of residue tuples
     * @param {CRTReconstructor} crt - CRT reconstructor
     * @returns {Object} { loss, cycles, details }
     */
    compute(residueBatch, crt) {
        const cycles = this.detectCycles(residueBatch, crt);
        
        let totalLoss = 0;
        const details = [];
        
        for (const cycle of cycles) {
            const loss = this.cycleLoss(cycle);
            totalLoss += loss;
            details.push({
                length: cycle.length,
                loss,
                points: cycle.map(p => p.index),
                meanError: cycle.reduce((s, p) => s + p.error, 0) / cycle.length
            });
        }
        
        return {
            loss: this.lambda * totalLoss,
            cycles: cycles.length,
            details,
            totalPoints: cycles.reduce((s, c) => s + c.length, 0)
        };
    }
    
    /**
     * Compute cycle persistence: max_error - min_error across cycle
     * @param {Array<Object>} cycle - Points in the cycle
     * @returns {number} Persistence value
     */
    cyclePersistence(cycle) {
        if (cycle.length === 0) return 0;
        const errors = cycle.map(p => p.error);
        return Math.max(...errors) - Math.min(...errors);
    }
    
    /**
     * Compute Betti numbers (topological invariants)
     * β_0 = number of connected components in kernel
     * β_1 = number of holes (cycles that don't bound)
     * 
     * @param {Array<Array<number>>} residueBatch - Batch of residue tuples
     * @param {CRTReconstructor} crt - CRT reconstructor
     * @returns {Object} { beta0, beta1 }
     */
    computeBettiNumbers(residueBatch, crt) {
        const cycles = this.detectCycles(residueBatch, crt);
        
        // β_0: number of connected components (cycles)
        const beta0 = cycles.length;
        
        // β_1: estimate from persistent cycles (those with high persistence)
        const persistentThreshold = 0.5;
        let beta1 = 0;
        for (const cycle of cycles) {
            if (this.cyclePersistence(cycle) > persistentThreshold) {
                beta1++;
            }
        }
        
        return { beta0, beta1, cycles: cycles.length };
    }
}

// ============================================================================
// CRT MODULAR LAYER: Integrated CRT + Birkhoff Attention
// ============================================================================

/**
 * CRT Modular Layer
 * 
 * Combines residue encoding, CRT reconstruction, Birkhoff attention,
 * and homology loss into a single differentiable layer.
 */
class CRTModularLayer {
    /**
     * Create a CRT modular layer
     * @param {Array<number>} primes - Coprime moduli
     * @param {number} hiddenDim - Hidden dimension
     * @param {Object} options - Configuration
     */
    constructor(primes, hiddenDim, options = {}) {
        this.encoder = new ResidueEncoder(primes, hiddenDim, options);
        this.crt = new CRTReconstructor(primes);
        this.birkhoff = new BirkhoffProjector(options.sinkhornIterations || 10);
        this.homology = new HomologyLoss(options.homology || {});
        
        this.primes = primes;
        this.hiddenDim = hiddenDim;
    }
    
    /**
     * Forward pass through the CRT modular layer
     * 
     * @param {Array<number>|Float64Array} h - Hidden vector
     * @param {Array<Array<number>>} Q - Query matrix (optional)
     * @param {Array<Array<number>>} K - Key matrix (optional)
     * @param {Array<Array<number>>} V - Value matrix (optional)
     * @returns {Object} Forward pass result
     */
    forward(h, Q = null, K = null, V = null) {
        // 1. Encode to residue distributions
        const residueDistributions = this.encoder.encode(h);
        const expectedResidues = this.encoder.expectedResidues(residueDistributions);
        
        // 2. CRT reconstruction
        const L = this.crt.reconstruct(expectedResidues);
        const inKernel = this.crt.detectKernel(expectedResidues);
        const reconstructionError = this.crt.reconstructionError(expectedResidues);
        
        // 3. Birkhoff attention (if Q, K, V provided)
        let attention = null;
        if (Q && K && V) {
            attention = this.birkhoff.attention(Q, K, V);
        }
        
        // 4. Compute coherence (inverse of being in kernel)
        const coherence = 1 - Math.min(1, reconstructionError / this.homology.tau);
        
        return {
            residues: residueDistributions,
            expectedResidues,
            latent: L,
            inKernel,
            reconstructionError,
            coherence,
            attention,
            P: this.crt.P
        };
    }
    
    /**
     * Forward pass for a batch, computing homology loss
     * 
     * @param {Array<Array<number>>} hBatch - Batch of hidden vectors
     * @param {Array<number>|null} targets - Target values (for MSE loss)
     * @returns {Object} Batch forward result with losses
     */
    forwardBatch(hBatch, targets = null) {
        const results = hBatch.map(h => this.forward(h));
        const residueBatch = results.map(r => r.expectedResidues);
        
        // Compute homology loss
        const homologyResult = this.homology.compute(residueBatch, this.crt);
        
        // Compute MSE loss if targets provided
        let mseLoss = 0;
        if (targets) {
            for (let i = 0; i < results.length; i++) {
                const diff = results[i].latent - targets[i];
                mseLoss += diff * diff;
            }
            mseLoss /= results.length;
        }
        
        // Total loss
        const totalLoss = mseLoss + homologyResult.loss;
        
        return {
            results,
            homologyLoss: homologyResult.loss,
            mseLoss,
            totalLoss,
            homologyDetails: homologyResult,
            bettiNumbers: this.homology.computeBettiNumbers(residueBatch, this.crt)
        };
    }
    
    /**
     * Integration with tinyaleph SparsePrimeState
     * @param {SparsePrimeState} state - Sparse prime state
     * @returns {Object} Forward pass result
     */
    forwardFromPrimeState(state) {
        const residues = this.encoder.encodeFromPrimeState(state);
        const expectedResidues = this.encoder.expectedResidues(residues);
        const L = this.crt.reconstruct(expectedResidues);
        
        return {
            residues,
            expectedResidues,
            latent: L,
            inKernel: this.crt.detectKernel(expectedResidues),
            reconstructionError: this.crt.reconstructionError(expectedResidues),
            coherence: 1 - Math.min(1, this.crt.reconstructionError(expectedResidues) / this.homology.tau)
        };
    }
}

// ============================================================================
// CRT-FUSED ATTENTION: L̂' = CRT_Fuse({A_k, r_k})
// ============================================================================

/**
 * CRT-Fused Modular Attention
 *
 * Combines per-modulus Birkhoff attention with CRT reconstruction.
 * Each prime modulus gets its own attention head, and results are fused via CRT.
 */
class CRTFusedAttention {
    /**
     * Create CRT-fused attention
     * @param {Array<number>} primes - Coprime moduli (one per attention head)
     * @param {number} hiddenDim - Hidden dimension
     * @param {number} headDim - Per-head dimension
     * @param {Object} options - Configuration
     */
    constructor(primes, hiddenDim, headDim, options = {}) {
        this.primes = primes;
        this.K = primes.length;
        this.hiddenDim = hiddenDim;
        this.headDim = headDim;
        
        this.crt = new CRTReconstructor(primes);
        this.birkhoff = new BirkhoffProjector(options.sinkhornIterations || 10);
        this.homology = new HomologyLoss(options.homology || {});
        
        // Per-modulus projection matrices (Q_k, K_k, V_k)
        this.projections = primes.map(p => ({
            Q: this._initMatrix(hiddenDim, headDim),
            K: this._initMatrix(hiddenDim, headDim),
            V: this._initMatrix(hiddenDim, headDim)
        }));
    }
    
    /**
     * Initialize a weight matrix
     * @private
     */
    _initMatrix(rows, cols, scale = 0.1) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = new Float64Array(cols);
            for (let j = 0; j < cols; j++) {
                row[j] = (Math.random() - 0.5) * 2 * scale;
            }
            matrix.push(Array.from(row));
        }
        return matrix;
    }
    
    /**
     * Matrix multiplication
     * @private
     */
    _matMul(A, B) {
        const m = A.length;
        const n = B[0].length;
        const k = A[0].length;
        
        const result = [];
        for (let i = 0; i < m; i++) {
            const row = new Float64Array(n);
            for (let j = 0; j < n; j++) {
                for (let l = 0; l < k; l++) {
                    row[j] += A[i][l] * B[l][j];
                }
            }
            result.push(Array.from(row));
        }
        return result;
    }
    
    /**
     * Project input through per-modulus heads
     * @param {Array<Array<number>>} X - Input sequence (seq_len x hiddenDim)
     * @param {number} k - Head index
     * @returns {Object} { Q, K, V } projections
     */
    projectHead(X, k) {
        const proj = this.projections[k];
        return {
            Q: this._matMul(X, proj.Q),
            K: this._matMul(X, proj.K),
            V: this._matMul(X, proj.V)
        };
    }
    
    /**
     * Forward pass: Per-modulus Birkhoff attention fused via CRT
     *
     * For each modulus k:
     *   A_k = Birkhoff(Q_k K_k^T / √d) ⊙ V_k
     *   r_k = residue encoding of A_k
     *
     * Fused output: L̂' = CRT_Fuse({A_k, r_k})
     *
     * @param {Array<Array<number>>} X - Input sequence (seq_len x hiddenDim)
     * @returns {Object} Forward result with fused attention
     */
    forward(X) {
        const seqLen = X.length;
        const perHeadOutputs = [];
        const residueTuples = [];
        
        // Process each modular head
        for (let k = 0; k < this.K; k++) {
            const { Q, K, V } = this.projectHead(X, k);
            
            // Birkhoff attention for this head
            const A_k = this.birkhoff.attention(Q, K, V);
            perHeadOutputs.push(A_k);
            
            // Compute residue from attention output (sum modulo p_k)
            const residue = A_k.reduce((sum, row) => {
                const rowSum = row.reduce((a, b) => a + b, 0);
                return (sum + rowSum) % this.primes[k];
            }, 0);
            residueTuples.push(residue);
        }
        
        // CRT reconstruction
        const L = this.crt.reconstruct(residueTuples);
        const inKernel = this.crt.detectKernel(residueTuples);
        const coherence = 1 - Math.min(1, this.crt.reconstructionError(residueTuples) / 0.1);
        
        // Fused output: weighted average of per-head outputs
        const fusedOutput = [];
        for (let i = 0; i < seqLen; i++) {
            const row = new Float64Array(this.headDim);
            for (let k = 0; k < this.K; k++) {
                const weight = 1 / this.K;  // Uniform weighting (can be learned)
                for (let j = 0; j < this.headDim; j++) {
                    row[j] += weight * (perHeadOutputs[k][i]?.[j] || 0);
                }
            }
            fusedOutput.push(Array.from(row));
        }
        
        return {
            output: fusedOutput,
            perHeadOutputs,
            residues: residueTuples,
            latent: L,
            inKernel,
            coherence,
            P: this.crt.P
        };
    }
}

// ============================================================================
// COPRIME SELECTOR: Choose optimal coprime moduli for CRT
// ============================================================================

/**
 * Select K coprime moduli for CRT with desired product P
 *
 * Strategy: Use first K primes for maximum P with minimum K
 */
class CoprimeSelector {
    /**
     * Select K coprime moduli from available primes
     * @param {number} K - Number of moduli
     * @param {Object} options - Configuration
     */
    constructor(K = 4, options = {}) {
        this.K = K;
        this.minPrime = options.minPrime || 2;
        this.maxPrime = options.maxPrime || 100;
    }
    
    /**
     * Get K smallest primes as moduli
     * @returns {Array<number>} Array of K primes
     */
    selectMinimal() {
        return firstNPrimes(this.K);
    }
    
    /**
     * Select primes to achieve target product P
     * @param {number} targetP - Target product
     * @returns {Array<number>|null} Primes achieving closest to targetP
     */
    selectForProduct(targetP) {
        const primes = firstNPrimes(20);
        let bestPrimes = null;
        let bestProduct = 0;
        
        // Greedy selection
        const selected = [];
        let product = 1;
        
        for (const p of primes) {
            if (product * p <= targetP) {
                selected.push(p);
                product *= p;
            }
            if (selected.length >= this.K) break;
        }
        
        return selected.length > 0 ? selected : null;
    }
    
    /**
     * Select primes for specific domain (e.g., cryptographic sizes)
     * @param {string} domain - Domain name
     * @returns {Array<number>} Recommended primes
     */
    selectForDomain(domain) {
        const domains = {
            'small': [2, 3, 5, 7],           // P = 210
            'medium': [5, 7, 11, 13],        // P = 5005
            'large': [11, 13, 17, 19],       // P = 46189
            'semantic': [2, 3, 5, 7, 11],    // P = 2310 (good for semantic)
            'temporal': [3, 5, 7, 11, 13]    // P = 15015 (good for sequences)
        };
        
        return domains[domain] || domains['small'];
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Modular arithmetic utilities
    extendedGCD,
    modInverse,
    areCoprime,
    softmax,
    
    // Core classes
    ResidueEncoder,
    CRTReconstructor,
    BirkhoffProjector,
    HomologyLoss,
    CRTModularLayer,
    CRTFusedAttention,
    CoprimeSelector,
    
    // Factory functions
    createCRTLayer: (primes, hiddenDim, options = {}) =>
        new CRTModularLayer(primes, hiddenDim, options),
    
    createFusedAttention: (primes, hiddenDim, headDim, options = {}) =>
        new CRTFusedAttention(primes, hiddenDim, headDim, options),
    
    // Default configurations
    DEFAULT_PRIMES_SMALL: [2, 3, 5, 7],
    DEFAULT_PRIMES_MEDIUM: [5, 7, 11, 13],
    DEFAULT_PRIMES_SEMANTIC: [2, 3, 5, 7, 11]
};