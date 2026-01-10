
/**
 * Holographic Quantum Encoding (HQE)
 *
 * Implements the holographic projection mechanism from "A Design for a
 * Sentient Observer" paper, Section 5.
 *
 * Key features:
 * - Discrete Fourier Transform holographic projection
 * - Spatial interference patterns from prime states
 * - Pattern reconstruction via inverse DFT
 * - Similarity metrics between holographic patterns
 * - Distributed, non-local semantic representation
 * - Dynamic λ(t) stabilization control (equation 12)
 * - CRT-Homology integration for consistency detection
 *
 * Browser-compatible: No Node.js-specific dependencies
 *
 * @module observer/hqe
 */

'use strict';

const { Complex, PrimeState } = require('../core/hilbert');
const { firstNPrimes } = require('../core/prime');

// CRT-Homology components for consistency detection
const {
    CRTReconstructor,
    HomologyLoss,
    CoprimeSelector,
    ResidueEncoder,
    BirkhoffProjector
} = require('../core/crt-homology');

// ════════════════════════════════════════════════════════════════════
// TICK GATE (from discrete.pdf Section 4.2)
// Gates expensive holographic operations to tick events only
// ════════════════════════════════════════════════════════════════════

/**
 * Tick Gate for HQE operations
 *
 * From discrete.pdf: HQE computation should only occur on valid tick events
 * to prevent continuous CPU usage and maintain discrete-time semantics.
 *
 * Tick conditions:
 * 1. Minimum time elapsed since last tick
 * 2. Coherence threshold crossed
 * 3. External event trigger
 */
class TickGate {
    /**
     * Create a tick gate
     * @param {Object} options - Configuration
     * @param {number} [options.minTickInterval=16] - Minimum ms between ticks (~60fps max)
     * @param {number} [options.coherenceThreshold=0.7] - Coherence threshold for auto-tick
     * @param {number} [options.maxTickHistory=50] - Maximum tick history size
     * @param {'strict'|'adaptive'|'free'} [options.mode='adaptive'] - Gating mode
     */
    constructor(options = {}) {
        // Minimum milliseconds between ticks
        this.minTickInterval = options.minTickInterval || 16; // ~60fps max
        
        // Coherence threshold for triggering tick
        this.coherenceThreshold = options.coherenceThreshold || 0.7;
        
        // Last tick timestamp
        this.lastTickTime = 0;
        
        // Tick counter
        this.tickCount = 0;
        
        // Pending tick flag (set by external events)
        this.pendingTick = false;
        
        // Tick history for analysis
        this.tickHistory = [];
        this.maxTickHistory = options.maxTickHistory || 50;
        
        // Gating mode
        // 'strict' - only process on explicit ticks
        // 'adaptive' - allow through if coherence is high
        // 'free' - no gating (legacy behavior)
        this.mode = options.mode || 'adaptive';
        
        // Statistics
        this.gatedCount = 0;    // Number of operations gated (blocked)
        this.passedCount = 0;   // Number of operations passed
    }
    
    /**
     * Register an external tick event
     * Called by PRSC or SMF when coherence spikes
     */
    tick() {
        const now = Date.now();
        this.pendingTick = true;
        this.lastTickTime = now;
        this.tickCount++;
        
        this.tickHistory.push({
            time: now,
            count: this.tickCount
        });
        
        if (this.tickHistory.length > this.maxTickHistory) {
            this.tickHistory.shift();
        }
    }
    
    /**
     * Check if an operation should proceed (tick gate)
     *
     * @param {Object} state - Current system state
     * @param {number} [state.coherence=0] - Current coherence level
     * @returns {Object} Gate result
     */
    shouldProcess(state = {}) {
        const now = Date.now();
        const timeSinceLastTick = now - this.lastTickTime;
        const coherence = state.coherence || 0;
        
        let shouldPass = false;
        let reason = '';
        
        switch (this.mode) {
            case 'free':
                // No gating - always pass
                shouldPass = true;
                reason = 'free_mode';
                break;
                
            case 'strict':
                // Only pass on explicit pending tick
                shouldPass = this.pendingTick;
                reason = shouldPass ? 'pending_tick' : 'no_tick';
                break;
                
            case 'adaptive':
            default:
                // Pass if:
                // 1. Pending tick exists, OR
                // 2. Coherence exceeds threshold AND minimum interval elapsed
                if (this.pendingTick) {
                    shouldPass = true;
                    reason = 'pending_tick';
                } else if (coherence >= this.coherenceThreshold &&
                           timeSinceLastTick >= this.minTickInterval) {
                    shouldPass = true;
                    reason = 'coherence_threshold';
                    // Auto-register this as a tick
                    this.tick();
                } else if (timeSinceLastTick >= this.minTickInterval * 10) {
                    // Fallback: allow through if way too long since last tick
                    shouldPass = true;
                    reason = 'timeout_fallback';
                    this.tick();
                } else {
                    reason = 'gated';
                }
                break;
        }
        
        // Clear pending tick if we're processing
        if (shouldPass) {
            this.pendingTick = false;
            this.passedCount++;
        } else {
            this.gatedCount++;
        }
        
        return {
            shouldPass,
            reason,
            tickCount: this.tickCount,
            timeSinceLastTick,
            coherence,
            mode: this.mode
        };
    }
    
    /**
     * Get tick rate (ticks per second)
     * @returns {number} Ticks per second
     */
    getTickRate() {
        if (this.tickHistory.length < 2) return 0;
        
        const recent = this.tickHistory.slice(-10);
        const duration = recent[recent.length - 1].time - recent[0].time;
        
        if (duration <= 0) return 0;
        return ((recent.length - 1) / duration) * 1000;
    }
    
    /**
     * Get gating statistics
     * @returns {Object} Statistics
     */
    getStats() {
        const total = this.passedCount + this.gatedCount;
        return {
            tickCount: this.tickCount,
            tickRate: this.getTickRate(),
            passedCount: this.passedCount,
            gatedCount: this.gatedCount,
            gateRatio: total > 0 ? this.gatedCount / total : 0,
            mode: this.mode,
            lastTickTime: this.lastTickTime
        };
    }
    
    /**
     * Reset gate state
     */
    reset() {
        this.tickCount = 0;
        this.lastTickTime = 0;
        this.pendingTick = false;
        this.tickHistory = [];
        this.gatedCount = 0;
        this.passedCount = 0;
    }
    
    /**
     * Set gating mode
     * @param {'strict'|'adaptive'|'free'} mode - New mode
     */
    setMode(mode) {
        if (['strict', 'adaptive', 'free'].includes(mode)) {
            this.mode = mode;
        }
    }
}

// ════════════════════════════════════════════════════════════════════
// STABILIZATION CONTROLLER (equation 12) with CRT-Homology Integration
// ════════════════════════════════════════════════════════════════════

/**
 * Stabilization Controller with Homology-Aware Dynamics
 *
 * Implements dynamic λ(t) from equation 12, enhanced with CRT-Homology:
 * λ(t) = λ₀ · σ(aC·C(t) - aS·S(t) - aSMF·SSMF(s(t)) + aH·H(t))
 *
 * Where H(t) = homology penalty from detected semantic holes.
 *
 * Key insight: "Holes are consistency failures that persist under perturbation"
 * - Ker(ℛ) detection identifies CRT reconstruction failures
 * - Betti numbers (β₀, β₁) serve as topological invariants
 * - Hole persistence correlates with Lyapunov instability (λ > 0)
 *
 * Controls the "condensation pressure" - balance between
 * unitary evolution and dissipative stabilization.
 */
class StabilizationController {
    /**
     * Create a stabilization controller
     * @param {Object} options - Configuration
     * @param {number} [options.lambda0=0.1] - Base stabilization rate λ₀
     * @param {number} [options.aC=1.0] - Coherence weight
     * @param {number} [options.aS=0.8] - Entropy weight
     * @param {number} [options.aSMF=0.5] - SMF entropy weight
     * @param {number} [options.aH=0.3] - Homology weight (new)
     * @param {number} [options.steepness=2.0] - Sigmoid steepness
     * @param {number} [options.lambdaMin=0.01] - Minimum λ
     * @param {number} [options.lambdaMax=0.5] - Maximum λ
     * @param {number} [options.maxHistory=100] - History size
     * @param {Object} [options.homology] - Homology detection options
     */
    constructor(options = {}) {
        // Base stabilization rate λ₀
        this.lambda0 = options.lambda0 || 0.1;
        
        // Weighting coefficients
        this.aC = options.aC || 1.0;   // Coherence weight (positive: high C increases λ)
        this.aS = options.aS || 0.8;   // Entropy weight (positive: high S decreases λ)
        this.aSMF = options.aSMF || 0.5; // SMF entropy weight
        this.aH = options.aH || 0.3;   // Homology weight (new: holes increase λ)
        
        // Sigmoid steepness
        this.steepness = options.steepness || 2.0;
        
        // Bounds for λ
        this.lambdaMin = options.lambdaMin || 0.01;
        this.lambdaMax = options.lambdaMax || 0.5;
        
        // History for analysis
        this.history = [];
        this.maxHistory = options.maxHistory || 100;
        
        // CRT-Homology integration
        const homologyOpts = options.homology || {};
        this.homologyEnabled = homologyOpts.enabled !== false;
        
        if (this.homologyEnabled) {
            // Select coprime moduli for CRT
            const selector = new CoprimeSelector(homologyOpts.numModuli || 4);
            this.moduli = selector.selectMinimal();
            
            // Initialize CRT components
            this.crt = new CRTReconstructor(this.moduli);
            this.homologyLoss = new HomologyLoss({
                tau: homologyOpts.tau || 0.1,
                alpha: homologyOpts.alpha || 0.5,
                beta: homologyOpts.beta || 1.0,
                gamma: homologyOpts.gamma || 0.5
            });
            
            // Residue encoder (hidden dimension = moduli product for now)
            const hiddenDim = homologyOpts.hiddenDim || 32;
            this.residueEncoder = new ResidueEncoder(this.moduli, hiddenDim);
            
            // Track homology state
            this.homologyState = {
                bettiNumbers: [1, 0],  // [β₀, β₁]
                holesDetected: 0,
                lastError: 0,
                cycleCount: 0
            };
        }
    }
    
    /**
     * Sigmoid squashing function σ
     * Maps (-∞, ∞) → (0, 1)
     * @param {number} x - Input value
     * @returns {number} Sigmoid output
     */
    sigmoid(x) {
        return 1 / (1 + Math.exp(-this.steepness * x));
    }
    
    /**
     * Compute homology penalty from residue vector
     * H(t) = β₁ * (1 + log(1 + cycles)) * kernelError
     *
     * @param {Array<number>} residues - Expected residues from current state
     * @returns {number} Homology penalty
     */
    computeHomologyPenalty(residues) {
        if (!this.homologyEnabled || !residues || residues.length === 0) {
            return 0;
        }
        
        try {
            // Detect if current residues are in kernel (CRT failure)
            const inKernel = this.crt.detectKernel(residues, this.homologyLoss.tau);
            const error = this.crt.reconstructionError(residues);
            
            // Update homology state
            this.homologyState.lastError = error;
            
            if (inKernel) {
                this.homologyState.holesDetected++;
                
                // Compute Betti numbers from residue batch (simplified)
                // In full implementation, would track residue history
                this.homologyState.bettiNumbers = [
                    1,  // β₀: always at least one component
                    Math.min(5, this.homologyState.holesDetected)  // β₁: capped estimate
                ];
            }
            
            const beta1 = this.homologyState.bettiNumbers[1];
            const penalty = beta1 * (1 + Math.log(1 + this.homologyState.cycleCount)) * error;
            
            return penalty;
        } catch (e) {
            // Fallback if homology computation fails
            return 0;
        }
    }
    
    /**
     * Encode state to residues for homology analysis
     * @param {Object} state - System state with prime activations
     * @returns {Array<number>} Expected residues
     */
    stateToResidues(state) {
        if (!this.homologyEnabled) return [];
        
        // Convert state to hidden vector
        const hiddenDim = this.residueEncoder.hiddenDim;
        const h = new Float64Array(hiddenDim);
        
        if (state.amplitudes) {
            // Direct amplitude array
            for (let i = 0; i < Math.min(state.amplitudes.length, hiddenDim); i++) {
                h[i] = state.amplitudes[i];
            }
        } else if (state.primeActivations) {
            // Prime -> activation map
            let i = 0;
            for (const [prime, value] of Object.entries(state.primeActivations)) {
                if (i >= hiddenDim) break;
                h[i++] = typeof value === 'number' ? value : (value.norm ? value.norm() : 0);
            }
        } else if (typeof state.coherence === 'number') {
            // Use coherence and entropy as proxy
            h[0] = state.coherence || 0;
            h[1] = state.entropy || 0;
            h[2] = state.smfEntropy || 0;
        }
        
        // Encode to residues
        const residueDistributions = this.residueEncoder.encode(h);
        return this.residueEncoder.expectedResidues(residueDistributions);
    }
    
    /**
     * Compute current λ(t) value with homology awareness
     *
     * λ(t) = λ₀ · σ(aC·C(t) - aS·S(t) - aSMF·SSMF(s(t)) + aH·H(t))
     *
     * The homology term H(t) increases λ when semantic holes are detected,
     * encouraging faster stabilization to resolve consistency failures.
     *
     * @param {number} coherence - Global coherence C(t) ∈ [0, 1]
     * @param {number} entropy - System entropy S(t)
     * @param {number} [smfEntropy=0] - SMF entropy SSMF
     * @param {Object} [state=null] - Optional state for homology analysis
     * @returns {number} Stabilization rate λ(t)
     */
    computeLambda(coherence, entropy, smfEntropy = 0, state = null) {
        // Compute homology penalty if state provided
        let homologyPenalty = 0;
        if (this.homologyEnabled && state) {
            const residues = this.stateToResidues(state);
            homologyPenalty = this.computeHomologyPenalty(residues);
        }
        
        // Compute the argument to the sigmoid
        // Note: homology penalty INCREASES λ (more stabilization when holes detected)
        const arg = this.aC * coherence - this.aS * entropy - this.aSMF * smfEntropy + this.aH * homologyPenalty;
        
        // Apply sigmoid and scale by λ₀
        const lambda = this.lambda0 * this.sigmoid(arg);
        
        // Clamp to bounds
        const clampedLambda = Math.max(this.lambdaMin, Math.min(this.lambdaMax, lambda));
        
        // Record to history
        this.history.push({
            timestamp: Date.now(),
            coherence,
            entropy,
            smfEntropy,
            homologyPenalty,
            arg,
            lambda: clampedLambda,
            bettiNumbers: this.homologyEnabled ? [...this.homologyState.bettiNumbers] : null
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        return clampedLambda;
    }
    
    /**
     * Get the interpretation of current λ
     * @param {number} lambda - Current λ value
     * @returns {string} Interpretation
     */
    interpret(lambda) {
        if (lambda > 0.3) {
            return 'high_stabilization'; // Strong condensation pressure
        } else if (lambda > 0.1) {
            return 'normal'; // Balanced
        } else {
            return 'low_stabilization'; // More unitary/exploratory
        }
    }
    
    /**
     * Get recent lambda trend
     * @returns {number} Trend (positive = increasing, negative = decreasing)
     */
    getTrend() {
        if (this.history.length < 5) return 0;
        
        const recent = this.history.slice(-10);
        const first = recent.slice(0, Math.floor(recent.length / 2));
        const second = recent.slice(Math.floor(recent.length / 2));
        
        const firstAvg = first.reduce((s, h) => s + h.lambda, 0) / first.length;
        const secondAvg = second.reduce((s, h) => s + h.lambda, 0) / second.length;
        
        return secondAvg - firstAvg;
    }
    
    /**
     * Get statistics
     * @returns {Object} Statistics
     */
    getStats() {
        if (this.history.length === 0) {
            return { current: this.lambda0, mean: this.lambda0, trend: 0 };
        }
        
        const lambdas = this.history.map(h => h.lambda);
        const current = lambdas[lambdas.length - 1];
        const mean = lambdas.reduce((a, b) => a + b, 0) / lambdas.length;
        
        const stats = {
            current,
            mean,
            min: Math.min(...lambdas),
            max: Math.max(...lambdas),
            trend: this.getTrend(),
            interpretation: this.interpret(current)
        };
        
        // Add homology stats if enabled
        if (this.homologyEnabled) {
            stats.homology = {
                enabled: true,
                bettiNumbers: this.homologyState.bettiNumbers,
                holesDetected: this.homologyState.holesDetected,
                lastError: this.homologyState.lastError,
                cycleCount: this.homologyState.cycleCount,
                moduli: this.moduli
            };
        }
        
        return stats;
    }
    
    /**
     * Get homology state (topological invariants)
     * @returns {Object} Homology state
     */
    getHomologyState() {
        if (!this.homologyEnabled) {
            return { enabled: false };
        }
        
        return {
            enabled: true,
            ...this.homologyState,
            moduli: this.moduli,
            P: this.crt.P  // Product of moduli
        };
    }
    
    /**
     * Detect if system is in kernel (semantic hole)
     * @param {Object} state - System state
     * @returns {Object} Kernel detection result
     */
    detectKernel(state) {
        if (!this.homologyEnabled) {
            return { inKernel: false, error: 0 };
        }
        
        const residues = this.stateToResidues(state);
        const inKernel = this.crt.detectKernel(residues, this.homologyLoss.tau);
        const error = this.crt.reconstructionError(residues);
        
        return {
            inKernel,
            error,
            residues,
            reconstructed: this.crt.reconstruct(residues)
        };
    }
    
    /**
     * Reset controller
     */
    reset() {
        this.history = [];
        if (this.homologyEnabled) {
            this.homologyState = {
                bettiNumbers: [1, 0],
                holesDetected: 0,
                lastError: 0,
                cycleCount: 0
            };
        }
    }
    
    /**
     * Serialize to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        const json = {
            config: {
                lambda0: this.lambda0,
                aC: this.aC,
                aS: this.aS,
                aSMF: this.aSMF,
                aH: this.aH
            },
            stats: this.getStats()
        };
        
        if (this.homologyEnabled) {
            json.homology = this.getHomologyState();
        }
        
        return json;
    }
}

// ════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC ENCODER (equations 13-15)
// ════════════════════════════════════════════════════════════════════

/**
 * Holographic Quantum Encoding system
 * 
 * Projects prime-amplitude states into spatial interference patterns
 * using DFT, enabling distributed, reconstruction-capable memory.
 */
class HolographicEncoder {
    /**
     * Create a holographic encoder
     * @param {number} [gridSize=64] - Size of the 2D holographic grid
     * @param {Array<number>|number} [primes=64] - Primes to use or count
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.wavelengthScale=10] - Wavelength scaling factor
     * @param {number} [options.phaseOffset=0] - Global phase offset
     * @param {Object} [options.stabilization] - StabilizationController options
     * @param {Object} [options.tickGate] - TickGate options
     */
    constructor(gridSize = 64, primes = 64, options = {}) {
        this.gridSize = gridSize;
        
        // Handle primes argument
        if (typeof primes === 'number') {
            this.primes = firstNPrimes(primes);
        } else if (Array.isArray(primes)) {
            this.primes = primes;
        } else {
            this.primes = firstNPrimes(64);
        }
        
        this.primeToIndex = new Map(this.primes.map((p, i) => [p, i]));
        
        // Configuration
        this.wavelengthScale = options.wavelengthScale || 10;
        this.phaseOffset = options.phaseOffset || 0;
        
        // Stabilization controller for dynamic λ(t) (equation 12)
        this.stabilization = new StabilizationController(options.stabilization || {});
        
        // Tick gate for HQE operations (discrete.pdf Section 4.2)
        this.tickGate = new TickGate(options.tickGate || {});
        
        // Precompute spatial frequencies for each prime
        this.spatialFrequencies = this.computeSpatialFrequencies();
        
        // Holographic field (2D complex array)
        this.field = this.createField();
    }
    
    /**
     * Create an empty holographic field
     * @returns {Array<Array<Complex>>} Empty 2D complex field
     */
    createField() {
        const field = new Array(this.gridSize);
        for (let i = 0; i < this.gridSize; i++) {
            field[i] = new Array(this.gridSize);
            for (let j = 0; j < this.gridSize; j++) {
                field[i][j] = new Complex(0, 0);
            }
        }
        return field;
    }
    
    /**
     * Compute spatial frequencies for each prime
     * Maps primes to (kx, ky) frequency pairs using golden ratio spiral
     * @returns {Array<Object>} Frequency data for each prime
     */
    computeSpatialFrequencies() {
        const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
        const frequencies = [];
        
        for (let i = 0; i < this.primes.length; i++) {
            const p = this.primes[i];
            // Use logarithmic prime mapping for wavelength
            const wavelength = this.wavelengthScale * (1 + Math.log(p) / Math.log(2));
            const k = 2 * Math.PI / wavelength;
            
            // Distribute angles using golden ratio for optimal coverage
            const angle = 2 * Math.PI * i * phi;
            
            frequencies.push({
                prime: p,
                kx: k * Math.cos(angle),
                ky: k * Math.sin(angle),
                wavelength
            });
        }
        
        return frequencies;
    }
    
    /**
     * Project a prime state into the holographic field (equation 13)
     * H(x,y,t) = Σp αp(t) exp(i[kp·r + φp(t)])
     * 
     * @param {PrimeState|Object} state - Prime state or {prime: Complex} map
     * @param {Object} [options={}] - Projection options
     * @param {boolean} [options.clear=true] - Clear field before projection
     * @returns {Array<Array<Complex>>} The holographic field
     */
    project(state, options = {}) {
        const clear = options.clear !== false;
        
        if (clear) {
            this.clearField();
        }
        
        // Handle different state formats
        let amplitudes;
        if (state instanceof PrimeState) {
            amplitudes = this.primes.map(p => state.get(p) || new Complex(0, 0));
        } else if (typeof state === 'object') {
            amplitudes = this.primes.map(p => {
                const amp = state[p];
                if (!amp) return new Complex(0, 0);
                if (amp instanceof Complex) return amp;
                if (typeof amp === 'number') return new Complex(amp, 0);
                if (amp.re !== undefined) return new Complex(amp.re, amp.im || 0);
                return new Complex(0, 0);
            });
        } else {
            throw new Error('Invalid state format');
        }
        
        // Project each prime's contribution
        for (let i = 0; i < this.primes.length; i++) {
            const freq = this.spatialFrequencies[i];
            const alpha = amplitudes[i];
            
            if (alpha.norm() < 1e-10) continue;
            
            // Add this prime's plane wave to the field
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    // k·r = kx*x + ky*y
                    const phase = freq.kx * x + freq.ky * y + this.phaseOffset;
                    const wave = Complex.fromPolar(1, phase);
                    
                    // H(x,y) += αp * exp(i*k·r)
                    this.field[x][y] = this.field[x][y].add(alpha.mul(wave));
                }
            }
        }
        
        return this.field;
    }
    
    /**
     * Reconstruct amplitudes from holographic field (equation 15)
     * Uses inverse DFT to recover prime amplitudes
     * 
     * @returns {Map<number, Complex>} Reconstructed amplitudes by prime
     */
    reconstruct() {
        const amplitudes = new Map();
        
        for (let i = 0; i < this.primes.length; i++) {
            const freq = this.spatialFrequencies[i];
            const prime = this.primes[i];
            
            // Inverse DFT at this frequency
            let sum = new Complex(0, 0);
            
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    // Inverse: exp(-i*k·r)
                    const phase = -(freq.kx * x + freq.ky * y + this.phaseOffset);
                    const wave = Complex.fromPolar(1, phase);
                    
                    sum = sum.add(this.field[x][y].mul(wave));
                }
            }
            
            // Normalize by grid size
            sum = new Complex(
                sum.re / (this.gridSize * this.gridSize),
                sum.im / (this.gridSize * this.gridSize)
            );
            
            amplitudes.set(prime, sum);
        }
        
        return amplitudes;
    }
    
    /**
     * Reconstruct to PrimeState
     * @returns {PrimeState} Reconstructed prime state
     */
    reconstructToState() {
        const amplitudes = this.reconstruct();
        const state = new PrimeState(this.primes);
        
        for (const [prime, amp] of amplitudes) {
            state.set(prime, amp);
        }
        
        return state;
    }
    
    /**
     * Compute intensity pattern (equation 14)
     * I(x,y,t) = |H(x,y,t)|²
     *
     * @returns {Array<Array<number>>} Intensity at each grid point
     */
    intensity() {
        const I = new Array(this.gridSize);
        for (let x = 0; x < this.gridSize; x++) {
            I[x] = new Array(this.gridSize);
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.field[x][y];
                // Handle both Complex objects and plain {re, im} objects
                if (typeof cell.normSq === 'function') {
                    I[x][y] = cell.normSq();
                } else {
                    const re = cell.re !== undefined ? cell.re : 0;
                    const im = cell.im !== undefined ? cell.im : 0;
                    I[x][y] = re * re + im * im;
                }
            }
        }
        return I;
    }
    
    /**
     * Compute real part pattern (for visualization)
     * @returns {Array<Array<number>>} Real part at each grid point
     */
    realPart() {
        const R = new Array(this.gridSize);
        for (let x = 0; x < this.gridSize; x++) {
            R[x] = new Array(this.gridSize);
            for (let y = 0; y < this.gridSize; y++) {
                R[x][y] = this.field[x][y].re;
            }
        }
        return R;
    }
    
    /**
     * Compute phase pattern (for visualization)
     * @returns {Array<Array<number>>} Phase at each grid point
     */
    phasePattern() {
        const P = new Array(this.gridSize);
        for (let x = 0; x < this.gridSize; x++) {
            P[x] = new Array(this.gridSize);
            for (let y = 0; y < this.gridSize; y++) {
                P[x][y] = this.field[x][y].phase();
            }
        }
        return P;
    }
    
    /**
     * Clear the holographic field
     */
    clearField() {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.field[x][y] = new Complex(0, 0);
            }
        }
    }
    
    /**
     * Add another field to this one (superposition)
     * @param {Array<Array<Complex>>} otherField - Field to add
     */
    superpose(otherField) {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.field[x][y] = this.field[x][y].add(otherField[x][y]);
            }
        }
    }
    
    /**
     * Multiply field by a scalar
     * @param {number} scalar - Multiplication factor
     */
    scale(scalar) {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.field[x][y] = new Complex(
                    this.field[x][y].re * scalar,
                    this.field[x][y].im * scalar
                );
            }
        }
    }
    
    /**
     * Clone this encoder with its current field
     * @returns {HolographicEncoder} Cloned encoder
     */
    clone() {
        const cloned = new HolographicEncoder(this.gridSize, this.primes.slice(), {
            wavelengthScale: this.wavelengthScale,
            phaseOffset: this.phaseOffset
        });
        
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                cloned.field[x][y] = new Complex(
                    this.field[x][y].re,
                    this.field[x][y].im
                );
            }
        }
        
        return cloned;
    }
    
    /**
     * Compute total field energy
     * @returns {number} Total energy
     */
    totalEnergy() {
        let energy = 0;
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.field[x][y];
                // Handle both Complex objects and plain {re, im} objects
                if (typeof cell.normSq === 'function') {
                    energy += cell.normSq();
                } else {
                    const re = cell.re !== undefined ? cell.re : 0;
                    const im = cell.im !== undefined ? cell.im : 0;
                    energy += re * re + im * im;
                }
            }
        }
        return energy;
    }
    
    /**
     * Compute field entropy (based on intensity distribution)
     * @returns {number} Field entropy in bits
     */
    fieldEntropy() {
        const I = this.intensity();
        const total = this.totalEnergy();
        
        if (total < 1e-10) return 0;
        
        let H = 0;
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const p = I[x][y] / total;
                if (p > 1e-10) {
                    H -= p * Math.log2(p);
                }
            }
        }
        
        return H;
    }
    
    /**
     * Get state snapshot (compressed for storage)
     * @returns {Object} Compressed state
     */
    getState() {
        // Only store non-zero cells to save space
        const cells = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.field[x][y];
                // Handle both Complex objects and plain {re, im} objects
                const re = cell.re !== undefined ? cell.re : 0;
                const im = cell.im !== undefined ? cell.im : 0;
                const normSq = re * re + im * im;
                
                if (normSq > 1e-10) {
                    cells.push({ x, y, re, im });
                }
            }
        }
        
        return {
            gridSize: this.gridSize,
            cells,
            totalEnergy: this.totalEnergy()
        };
    }
    
    /**
     * Load state from snapshot
     * @param {Object} state - State snapshot
     */
    loadState(state) {
        if (state.gridSize !== this.gridSize) {
            throw new Error('Grid size mismatch');
        }
        
        this.clearField();
        
        for (const cell of state.cells) {
            this.field[cell.x][cell.y] = new Complex(cell.re, cell.im);
        }
    }
    
    /**
     * Evolve the holographic field with stabilization (equation 11)
     *
     * d|Ψ(t)⟩/dt = iĤ|Ψ(t)⟩ - λ(t)D̂(Ψ,s)|Ψ(t)⟩
     *
     * The first term is unitary (phase evolution), the second is dissipative
     * (stabilization toward coherent attractors).
     *
     * @param {Object} state - Current system state
     * @param {number} state.coherence - Global coherence C(t)
     * @param {number} state.entropy - System entropy S(t)
     * @param {number} [state.smfEntropy=0] - SMF entropy SSMF
     * @param {number} [dt=0.016] - Time step
     * @returns {Object} Evolution result with lambda value
     */
    evolve(state, dt = 0.016) {
        const { coherence, entropy, smfEntropy = 0 } = state;
        
        // Check tick gate before expensive HQE operations
        const gateResult = this.tickGate.shouldProcess({ coherence });
        
        if (!gateResult.shouldPass) {
            // Return gated result without processing
            return {
                lambda: 0,
                interpretation: 'gated',
                totalEnergy: this.totalEnergy(),
                fieldEntropy: this.fieldEntropy(),
                gated: true,
                gateReason: gateResult.reason,
                tickCount: gateResult.tickCount
            };
        }
        
        // Compute dynamic λ(t) using stabilization controller
        const lambda = this.stabilization.computeLambda(coherence, entropy, smfEntropy);
        
        // For each cell, apply damped evolution:
        // New amplitude = old amplitude * exp(-λ * dt)
        // This implements the dissipative term -λD̂|Ψ⟩
        const dampingFactor = Math.exp(-lambda * dt);
        
        // Apply stabilization damping
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.field[x][y];
                // Dampen high-energy cells more than low-energy (stabilization)
                const intensity = cell.re * cell.re + cell.im * cell.im;
                const localDamping = dampingFactor * (1 + lambda * intensity * 0.1);
                
                this.field[x][y] = new Complex(
                    cell.re * localDamping,
                    cell.im * localDamping
                );
            }
        }
        
        return {
            lambda,
            interpretation: this.stabilization.interpret(lambda),
            totalEnergy: this.totalEnergy(),
            fieldEntropy: this.fieldEntropy(),
            gated: false,
            tickCount: gateResult.tickCount
        };
    }
    
    /**
     * Register a tick event (from PRSC or SMF coherence spike)
     */
    tick() {
        this.tickGate.tick();
    }
    
    /**
     * Get tick gate statistics
     * @returns {Object} Statistics
     */
    getTickStats() {
        return this.tickGate.getStats();
    }
    
    /**
     * Set tick gate mode
     * @param {'strict'|'adaptive'|'free'} mode - Gating mode
     */
    setTickMode(mode) {
        this.tickGate.setMode(mode);
    }
    
    /**
     * Get stabilization statistics
     * @returns {Object} Statistics
     */
    getStabilizationStats() {
        return this.stabilization.getStats();
    }
}

// ════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC MEMORY
// ════════════════════════════════════════════════════════════════════

/**
 * Holographic Memory
 *
 * Stores and retrieves patterns using holographic interference.
 * Enables content-addressable, distributed, fault-tolerant memory.
 */
class HolographicMemory {
    /**
     * Create a holographic memory
     * @param {number} [gridSize=64] - Size of holographic grid
     * @param {number|Array} [primes=64] - Primes to use
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.maxMemories=100] - Maximum memories
     * @param {number} [options.decayRate=0.01] - Memory decay rate
     */
    constructor(gridSize = 64, primes = 64, options = {}) {
        this.encoder = new HolographicEncoder(gridSize, primes, options);
        this.memories = [];
        this.maxMemories = options.maxMemories || 100;
        this.decayRate = options.decayRate || 0.01;
    }
    
    /**
     * Store a pattern in memory
     * @param {PrimeState|Object} state - State to store
     * @param {Object} [metadata={}] - Associated metadata
     * @returns {number} Memory index
     */
    store(state, metadata = {}) {
        // Create a new encoder for this memory
        const encoder = new HolographicEncoder(
            this.encoder.gridSize,
            this.encoder.primes.slice(),
            {
                wavelengthScale: this.encoder.wavelengthScale,
                phaseOffset: this.encoder.phaseOffset
            }
        );
        
        encoder.project(state);
        
        this.memories.push({
            encoder,
            metadata,
            timestamp: Date.now(),
            accessCount: 0,
            strength: 1.0
        });
        
        // Prune if over capacity
        if (this.memories.length > this.maxMemories) {
            this.prune();
        }
        
        return this.memories.length - 1;
    }
    
    /**
     * Recall the best matching memory
     * @param {PrimeState|Object} cue - Retrieval cue
     * @param {number} [threshold=0.3] - Minimum similarity threshold
     * @returns {Object|null} Best matching memory or null
     */
    recall(cue, threshold = 0.3) {
        if (this.memories.length === 0) return null;
        
        // Project cue to holographic form
        const cueEncoder = new HolographicEncoder(
            this.encoder.gridSize,
            this.encoder.primes.slice()
        );
        cueEncoder.project(cue);
        
        // Find best match by holographic correlation
        let bestMatch = null;
        let bestScore = threshold;
        
        for (const memory of this.memories) {
            const score = this.correlate(cueEncoder, memory.encoder);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = memory;
            }
        }
        
        if (bestMatch) {
            bestMatch.accessCount++;
            bestMatch.strength = Math.min(1.0, bestMatch.strength + 0.1);
        }
        
        return bestMatch ? {
            state: bestMatch.encoder.reconstructToState(),
            metadata: bestMatch.metadata,
            score: bestScore,
            strength: bestMatch.strength
        } : null;
    }
    
    /**
     * Correlate two holographic fields
     * Returns normalized correlation coefficient
     *
     * @param {HolographicEncoder} enc1 - First encoder
     * @param {HolographicEncoder} enc2 - Second encoder
     * @returns {number} Correlation coefficient
     */
    correlate(enc1, enc2) {
        let sumProduct = 0;
        let sumSq1 = 0;
        let sumSq2 = 0;
        
        for (let x = 0; x < enc1.gridSize; x++) {
            for (let y = 0; y < enc1.gridSize; y++) {
                // Compute normSq for each cell (handling both Complex and plain objects)
                const cell1 = enc1.field[x][y];
                const cell2 = enc2.field[x][y];
                
                let v1, v2;
                if (typeof cell1.normSq === 'function') {
                    v1 = cell1.normSq();
                } else {
                    const re1 = cell1.re !== undefined ? cell1.re : 0;
                    const im1 = cell1.im !== undefined ? cell1.im : 0;
                    v1 = re1 * re1 + im1 * im1;
                }
                
                if (typeof cell2.normSq === 'function') {
                    v2 = cell2.normSq();
                } else {
                    const re2 = cell2.re !== undefined ? cell2.re : 0;
                    const im2 = cell2.im !== undefined ? cell2.im : 0;
                    v2 = re2 * re2 + im2 * im2;
                }
                
                sumProduct += v1 * v2;
                sumSq1 += v1 * v1;
                sumSq2 += v2 * v2;
            }
        }
        
        const norm = Math.sqrt(sumSq1) * Math.sqrt(sumSq2);
        return norm > 1e-10 ? sumProduct / norm : 0;
    }
    
    /**
     * Apply decay to all memories
     */
    decay() {
        for (const memory of this.memories) {
            memory.strength *= (1 - this.decayRate);
        }
        
        // Remove very weak memories
        this.memories = this.memories.filter(m => m.strength > 0.1);
    }
    
    /**
     * Prune memories to capacity
     * Removes weakest or oldest memories
     */
    prune() {
        if (this.memories.length <= this.maxMemories) return;
        
        // Sort by strength * accessCount
        this.memories.sort((a, b) =>
            (b.strength * (b.accessCount + 1)) -
            (a.strength * (a.accessCount + 1))
        );
        
        // Keep top memories
        this.memories = this.memories.slice(0, this.maxMemories);
    }
    
    /**
     * Find all memories above similarity threshold
     * @param {PrimeState|Object} cue - Retrieval cue
     * @param {number} [threshold=0.3] - Minimum similarity
     * @returns {Array<Object>} Matching memories
     */
    findSimilar(cue, threshold = 0.3) {
        const cueEncoder = new HolographicEncoder(
            this.encoder.gridSize,
            this.encoder.primes.slice()
        );
        cueEncoder.project(cue);
        
        const results = [];
        for (const memory of this.memories) {
            const score = this.correlate(cueEncoder, memory.encoder);
            if (score > threshold) {
                results.push({
                    state: memory.encoder.reconstructToState(),
                    metadata: memory.metadata,
                    score,
                    strength: memory.strength
                });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    /**
     * Get memory count
     * @returns {number} Number of stored memories
     */
    get count() {
        return this.memories.length;
    }
    
    /**
     * Clear all memories
     */
    clear() {
        this.memories = [];
    }
    
    /**
     * Serialize to JSON (compact form)
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            gridSize: this.encoder.gridSize,
            primes: this.encoder.primes,
            memories: this.memories.map(m => ({
                state: m.encoder.getState(),
                metadata: m.metadata,
                timestamp: m.timestamp,
                accessCount: m.accessCount,
                strength: m.strength
            }))
        };
    }
    
    /**
     * Load from JSON
     * @param {Object} data - Serialized memory
     * @returns {HolographicMemory} Restored memory
     */
    static fromJSON(data) {
        const memory = new HolographicMemory(data.gridSize, data.primes);
        
        for (const saved of data.memories) {
            const encoder = new HolographicEncoder(data.gridSize, data.primes);
            encoder.loadState(saved.state);
            
            memory.memories.push({
                encoder,
                metadata: saved.metadata,
                timestamp: saved.timestamp,
                accessCount: saved.accessCount,
                strength: saved.strength
            });
        }
        
        return memory;
    }
}

// ════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC SIMILARITY
// ════════════════════════════════════════════════════════════════════

/**
 * Pattern similarity using holographic comparison
 */
class HolographicSimilarity {
    /**
     * Create a similarity calculator
     * @param {number} [gridSize=32] - Holographic grid size
     * @param {number|Array} [primes=32] - Primes to use
     */
    constructor(gridSize = 32, primes = 32) {
        this.encoder1 = new HolographicEncoder(gridSize, primes);
        this.encoder2 = new HolographicEncoder(gridSize, primes);
    }
    
    /**
     * Compute holographic similarity between two states
     * @param {PrimeState|Object} state1 - First state
     * @param {PrimeState|Object} state2 - Second state
     * @returns {number} Similarity score (0-1)
     */
    similarity(state1, state2) {
        this.encoder1.project(state1);
        this.encoder2.project(state2);
        
        // Compute intensity correlation
        const I1 = this.encoder1.intensity();
        const I2 = this.encoder2.intensity();
        
        let sumProduct = 0;
        let sumSq1 = 0;
        let sumSq2 = 0;
        
        for (let x = 0; x < this.encoder1.gridSize; x++) {
            for (let y = 0; y < this.encoder1.gridSize; y++) {
                sumProduct += I1[x][y] * I2[x][y];
                sumSq1 += I1[x][y] * I1[x][y];
                sumSq2 += I2[x][y] * I2[x][y];
            }
        }
        
        const norm = Math.sqrt(sumSq1) * Math.sqrt(sumSq2);
        return norm > 1e-10 ? sumProduct / norm : 0;
    }
    
    /**
     * Compute difference pattern
     * @param {PrimeState|Object} state1 - First state
     * @param {PrimeState|Object} state2 - Second state
     * @returns {HolographicEncoder} Difference encoder
     */
    difference(state1, state2) {
        this.encoder1.project(state1);
        this.encoder2.project(state2);
        
        const diff = this.encoder1.clone();
        
        for (let x = 0; x < diff.gridSize; x++) {
            for (let y = 0; y < diff.gridSize; y++) {
                diff.field[x][y] = new Complex(
                    diff.field[x][y].re - this.encoder2.field[x][y].re,
                    diff.field[x][y].im - this.encoder2.field[x][y].im
                );
            }
        }
        
        return diff;
    }
}

// ════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════

module.exports = {
    TickGate,
    StabilizationController,
    HolographicEncoder,
    HolographicMemory,
    HolographicSimilarity
};