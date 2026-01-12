/**
 * ALK-Kuramoto Integration
 * 
 * Extends Kuramoto oscillator dynamics with Arithmetic Link Kernel couplings.
 * Uses ALK's J matrix for pairwise coupling and K³ tensor for triadic phase terms.
 * 
 * Key equations:
 * Standard Kuramoto: dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)
 * 
 * ALK-Kuramoto: dθᵢ/dt = ωᵢ + Σⱼ Jᵢⱼ sin(θⱼ - θᵢ) 
 *                          + Σⱼ<ₖ K³ᵢⱼₖ sin(θⱼ + θₖ - 2θᵢ)
 * 
 * The triadic term sin(θⱼ + θₖ - 2θᵢ) captures irreducible three-body
 * phase correlations (Borromean coherence).
 * 
 * @module physics/alk-kuramoto
 */

'use strict';

import { KuramotoModel } from './kuramoto.js';
import { OscillatorBank } from './oscillator.js';
import { ArithmeticLinkKernel } from '../core/arithmetic-link-kernel.js';

// ============================================================================
// ALK KURAMOTO MODEL
// ============================================================================

/**
 * ALK-Kuramoto Model
 * 
 * Extends standard Kuramoto with:
 * - Pairwise coupling from Legendre symbols (J matrix)
 * - Triadic coupling from Rédei symbols (K³ tensor)
 * - Higher-order couplings from Milnor invariants (Kⁿ)
 */
class ALKKuramotoModel {
    /**
     * Create an ALK-Kuramoto model
     * 
     * @param {OscillatorBank|number[]} oscillators - Oscillator bank or natural frequencies
     * @param {Object} alk - ArithmeticLinkKernel instance
     * @param {Object} options - Configuration
     * @param {number} options.couplingScale - Scale factor for J matrix (default: 0.1)
     * @param {number} options.triadicScale - Scale factor for K³ tensor (default: 0.05)
     * @param {boolean} options.useTriadic - Enable triadic coupling (default: true)
     * @param {boolean} options.useHigherOrder - Enable n>3 couplings (default: false)
     * @param {number} options.dt - Time step (default: 0.01)
     */
    constructor(oscillators, alk, options = {}) {
        // Handle oscillator input
        if (oscillators instanceof OscillatorBank) {
            this.bank = oscillators;
            this.N = oscillators.size;
            this.omega = new Float64Array(this.N);
            for (let i = 0; i < this.N; i++) {
                this.omega[i] = oscillators.oscillators[i].frequency;
            }
        } else if (Array.isArray(oscillators)) {
            this.omega = Float64Array.from(oscillators);
            this.N = oscillators.length;
            this.bank = null;
        } else {
            throw new Error('oscillators must be OscillatorBank or frequency array');
        }
        
        // Store ALK
        this.alk = alk;
        
        // Ensure prime count matches oscillator count
        if (alk.r !== this.N) {
            console.warn(`ALK has ${alk.r} primes but model has ${this.N} oscillators. Using min.`);
            this.N = Math.min(alk.r, this.N);
        }
        
        // Configuration
        this.couplingScale = options.couplingScale ?? 0.1;
        this.triadicScale = options.triadicScale ?? 0.05;
        this.useTriadic = options.useTriadic ?? true;
        this.useHigherOrder = options.useHigherOrder ?? false;
        this.dt = options.dt ?? 0.01;
        
        // State: phases
        this.theta = new Float64Array(this.N);
        for (let i = 0; i < this.N; i++) {
            this.theta[i] = Math.random() * 2 * Math.PI;
        }
        
        // Time tracking
        this.time = 0;
        this.steps = 0;
        
        // Cache ALK matrices
        this._J = null;
        this._K3Entries = null;
        
        // History for analysis
        this.history = [];
        this.maxHistory = options.maxHistory ?? 1000;
    }
    
    /**
     * Get cached J matrix (scaled)
     */
    get J() {
        if (!this._J) {
            const rawJ = this.alk.J;
            this._J = [];
            for (let i = 0; i < this.N; i++) {
                this._J[i] = new Float64Array(this.N);
                for (let j = 0; j < this.N; j++) {
                    this._J[i][j] = this.couplingScale * rawJ[i][j];
                }
            }
        }
        return this._J;
    }
    
    /**
     * Get cached K³ entries (scaled)
     */
    get K3Entries() {
        if (!this._K3Entries) {
            this._K3Entries = [];
            const K3 = this.alk.K3;
            for (const [, entry] of K3.entries) {
                const [i, j, k] = entry.indices;
                if (i < this.N && j < this.N && k < this.N) {
                    this._K3Entries.push({
                        i, j, k,
                        value: this.triadicScale * entry.value
                    });
                }
            }
        }
        return this._K3Entries;
    }
    
    /**
     * Compute pairwise coupling term for oscillator i
     * Σⱼ Jᵢⱼ sin(θⱼ - θᵢ)
     * 
     * @param {number} i - Oscillator index
     * @returns {number} Pairwise coupling contribution
     */
    _pairwiseCoupling(i) {
        const J = this.J;
        let sum = 0;
        
        for (let j = 0; j < this.N; j++) {
            if (i !== j && J[i][j] !== 0) {
                sum += J[i][j] * Math.sin(this.theta[j] - this.theta[i]);
            }
        }
        
        return sum;
    }
    
    /**
     * Compute triadic coupling term for oscillator i
     * Σⱼ<ₖ K³ᵢⱼₖ sin(θⱼ + θₖ - 2θᵢ)
     * 
     * This captures Borromean-type coherence where three oscillators
     * lock together without pairwise locking.
     * 
     * @param {number} i - Oscillator index
     * @returns {number} Triadic coupling contribution
     */
    _triadicCoupling(i) {
        if (!this.useTriadic) return 0;
        
        let sum = 0;
        
        for (const entry of this.K3Entries) {
            // Each entry affects all three oscillators in the triple
            if (entry.i === i) {
                // Oscillator i is first in triple
                sum += entry.value * Math.sin(this.theta[entry.j] + this.theta[entry.k] - 2 * this.theta[i]);
            } else if (entry.j === i) {
                // Oscillator i is second
                sum += entry.value * Math.sin(this.theta[entry.i] + this.theta[entry.k] - 2 * this.theta[i]);
            } else if (entry.k === i) {
                // Oscillator i is third
                sum += entry.value * Math.sin(this.theta[entry.i] + this.theta[entry.j] - 2 * this.theta[i]);
            }
        }
        
        return sum;
    }
    
    /**
     * Compute full dθᵢ/dt
     * 
     * @param {number} i - Oscillator index
     * @returns {number} Phase derivative
     */
    _dtheta(i) {
        return this.omega[i] + this._pairwiseCoupling(i) + this._triadicCoupling(i);
    }
    
    /**
     * Euler integration step
     * 
     * @param {number} dt - Time step (uses this.dt if not provided)
     */
    step(dt = this.dt) {
        const newTheta = new Float64Array(this.N);
        
        // Compute derivatives
        for (let i = 0; i < this.N; i++) {
            const dth = this._dtheta(i);
            newTheta[i] = this.theta[i] + dth * dt;
            // Wrap to [0, 2π)
            newTheta[i] = ((newTheta[i] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        }
        
        this.theta = newTheta;
        this.time += dt;
        this.steps++;
        
        // Update oscillator bank if present
        if (this.bank) {
            for (let i = 0; i < this.N; i++) {
                this.bank.oscillators[i].phase = this.theta[i];
            }
        }
        
        return this;
    }
    
    /**
     * Runge-Kutta 4 integration step (more accurate)
     * 
     * @param {number} dt - Time step
     */
    stepRK4(dt = this.dt) {
        const k1 = new Float64Array(this.N);
        const k2 = new Float64Array(this.N);
        const k3 = new Float64Array(this.N);
        const k4 = new Float64Array(this.N);
        const temp = new Float64Array(this.N);
        
        // k1 = f(t, y)
        for (let i = 0; i < this.N; i++) {
            k1[i] = this._dtheta(i);
        }
        
        // k2 = f(t + dt/2, y + k1*dt/2)
        for (let i = 0; i < this.N; i++) {
            temp[i] = this.theta[i] + k1[i] * dt / 2;
        }
        const savedTheta = this.theta;
        this.theta = temp;
        for (let i = 0; i < this.N; i++) {
            k2[i] = this._dtheta(i);
        }
        
        // k3 = f(t + dt/2, y + k2*dt/2)
        for (let i = 0; i < this.N; i++) {
            temp[i] = savedTheta[i] + k2[i] * dt / 2;
        }
        this.theta = temp;
        for (let i = 0; i < this.N; i++) {
            k3[i] = this._dtheta(i);
        }
        
        // k4 = f(t + dt, y + k3*dt)
        for (let i = 0; i < this.N; i++) {
            temp[i] = savedTheta[i] + k3[i] * dt;
        }
        this.theta = temp;
        for (let i = 0; i < this.N; i++) {
            k4[i] = this._dtheta(i);
        }
        
        // y(t + dt) = y(t) + (k1 + 2*k2 + 2*k3 + k4) * dt / 6
        for (let i = 0; i < this.N; i++) {
            this.theta[i] = savedTheta[i] + (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) * dt / 6;
            this.theta[i] = ((this.theta[i] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        }
        
        this.time += dt;
        this.steps++;
        
        if (this.bank) {
            for (let i = 0; i < this.N; i++) {
                this.bank.oscillators[i].phase = this.theta[i];
            }
        }
        
        return this;
    }
    
    /**
     * Evolve for multiple steps
     * 
     * @param {number} numSteps - Number of steps
     * @param {boolean} useRK4 - Use RK4 integration (default: false)
     * @param {boolean} record - Record history (default: false)
     */
    evolve(numSteps, useRK4 = false, record = false) {
        const stepFn = useRK4 ? () => this.stepRK4() : () => this.step();
        
        for (let i = 0; i < numSteps; i++) {
            stepFn();
            
            if (record) {
                this._recordState();
            }
        }
        
        return this;
    }
    
    /**
     * Record current state to history
     * @private
     */
    _recordState() {
        const state = {
            time: this.time,
            steps: this.steps,
            theta: Float64Array.from(this.theta),
            orderParameter: this.orderParameter(),
            triadicCoherence: this.triadicCoherence()
        };
        
        this.history.push(state);
        
        // Limit history size
        while (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    /**
     * Kuramoto order parameter r = |1/N Σⱼ e^(iθⱼ)|
     * 
     * r = 1: Perfect synchronization
     * r = 0: Incoherent (random phases)
     * 
     * @returns {number} Order parameter in [0, 1]
     */
    orderParameter() {
        let realSum = 0;
        let imagSum = 0;
        
        for (let i = 0; i < this.N; i++) {
            realSum += Math.cos(this.theta[i]);
            imagSum += Math.sin(this.theta[i]);
        }
        
        return Math.sqrt(realSum * realSum + imagSum * imagSum) / this.N;
    }
    
    /**
     * Mean phase Ψ = arg(Σⱼ e^(iθⱼ))
     * 
     * @returns {number} Mean phase in [0, 2π)
     */
    meanPhase() {
        let realSum = 0;
        let imagSum = 0;
        
        for (let i = 0; i < this.N; i++) {
            realSum += Math.cos(this.theta[i]);
            imagSum += Math.sin(this.theta[i]);
        }
        
        const phase = Math.atan2(imagSum, realSum);
        return ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    }
    
    /**
     * Triadic coherence measure
     * Measures phase coherence within Borromean triples
     * 
     * For triple (i, j, k): coherence = |e^(i(θᵢ + θⱼ + θₖ))|
     * 
     * @returns {number} Mean triadic coherence in [0, 1]
     */
    triadicCoherence() {
        const borromean = this.alk.findBorromeanTriples();
        if (borromean.length === 0) return 0;
        
        let totalCoherence = 0;
        
        for (const triple of borromean) {
            const [i, j, k] = triple.indices;
            if (i >= this.N || j >= this.N || k >= this.N) continue;
            
            const sumPhase = this.theta[i] + this.theta[j] + this.theta[k];
            // Triadic coherence: how close is sum to 0 mod 2π?
            const coherence = Math.cos(sumPhase);
            totalCoherence += Math.abs(coherence);
        }
        
        return totalCoherence / borromean.length;
    }
    
    /**
     * Phase variance (measure of incoherence)
     * 
     * @returns {number} Circular variance in [0, 1]
     */
    phaseVariance() {
        return 1 - this.orderParameter();
    }
    
    /**
     * Pairwise phase locking detection
     * Returns pairs (i, j) where |θᵢ - θⱼ| < threshold
     * 
     * @param {number} threshold - Phase difference threshold (default: π/6)
     * @returns {Array} Locked pairs [{i, j, phaseDiff}]
     */
    findLockedPairs(threshold = Math.PI / 6) {
        const locked = [];
        
        for (let i = 0; i < this.N; i++) {
            for (let j = i + 1; j < this.N; j++) {
                let diff = Math.abs(this.theta[i] - this.theta[j]);
                diff = Math.min(diff, 2 * Math.PI - diff);
                
                if (diff < threshold) {
                    locked.push({
                        i, j,
                        primes: [this.alk.primes[i], this.alk.primes[j]],
                        phaseDiff: diff,
                        coupling: this.J[i][j]
                    });
                }
            }
        }
        
        return locked;
    }
    
    /**
     * Find locked triads (three oscillators with mutual phase coherence)
     * 
     * @param {number} threshold - Phase threshold
     * @returns {Array} Locked triads
     */
    findLockedTriads(threshold = Math.PI / 4) {
        const locked = [];
        
        for (const entry of this.K3Entries) {
            const { i, j, k } = entry;
            if (i >= this.N || j >= this.N || k >= this.N) continue;
            
            const sumPhase = this.theta[i] + this.theta[j] + this.theta[k];
            const coherence = Math.abs(Math.cos(sumPhase));
            
            if (coherence > Math.cos(threshold)) {
                locked.push({
                    indices: [i, j, k],
                    primes: [this.alk.primes[i], this.alk.primes[j], this.alk.primes[k]],
                    sumPhase,
                    coherence,
                    coupling: entry.value
                });
            }
        }
        
        return locked;
    }
    
    /**
     * Get current state as object
     */
    getState() {
        return {
            time: this.time,
            steps: this.steps,
            N: this.N,
            theta: Array.from(this.theta),
            omega: Array.from(this.omega),
            orderParameter: this.orderParameter(),
            meanPhase: this.meanPhase(),
            triadicCoherence: this.triadicCoherence(),
            lockedPairs: this.findLockedPairs(),
            lockedTriads: this.findLockedTriads()
        };
    }
    
    /**
     * Set phases directly
     * 
     * @param {number[]} phases - Array of phases
     */
    setPhases(phases) {
        for (let i = 0; i < Math.min(phases.length, this.N); i++) {
            this.theta[i] = phases[i];
        }
        return this;
    }
    
    /**
     * Reset to random phases
     */
    reset() {
        for (let i = 0; i < this.N; i++) {
            this.theta[i] = Math.random() * 2 * Math.PI;
        }
        this.time = 0;
        this.steps = 0;
        this.history = [];
        return this;
    }
    
    /**
     * Clone the model
     */
    clone() {
        const clone = new ALKKuramotoModel(Array.from(this.omega), this.alk, {
            couplingScale: this.couplingScale,
            triadicScale: this.triadicScale,
            useTriadic: this.useTriadic,
            useHigherOrder: this.useHigherOrder,
            dt: this.dt
        });
        
        clone.theta = Float64Array.from(this.theta);
        clone.time = this.time;
        clone.steps = this.steps;
        
        return clone;
    }
}

// ============================================================================
// ALK NETWORK KURAMOTO
// ============================================================================

/**
 * ALK Network Kuramoto
 * 
 * Uses ALK's J matrix as the adjacency/coupling matrix for
 * network-topology aware Kuramoto dynamics.
 */
class ALKNetworkKuramoto extends ALKKuramotoModel {
    /**
     * Create ALK Network Kuramoto model
     * 
     * @param {number[]} frequencies - Natural frequencies
     * @param {Object} alk - ArithmeticLinkKernel
     * @param {Object} options - Configuration
     */
    constructor(frequencies, alk, options = {}) {
        super(frequencies, alk, options);
        
        // Use symmetrized coupling for undirected network
        this.useSymmetric = options.useSymmetric ?? true;
        
        // Compute effective coupling matrix
        this._effectiveJ = null;
    }
    
    /**
     * Get effective coupling matrix
     */
    get effectiveJ() {
        if (!this._effectiveJ) {
            if (this.useSymmetric) {
                // Use (J + J^T) / 2
                const Jsym = this.alk.Jsym;
                this._effectiveJ = [];
                for (let i = 0; i < this.N; i++) {
                    this._effectiveJ[i] = new Float64Array(this.N);
                    for (let j = 0; j < this.N; j++) {
                        this._effectiveJ[i][j] = this.couplingScale * Jsym[i][j];
                    }
                }
            } else {
                this._effectiveJ = this.J;
            }
        }
        return this._effectiveJ;
    }
    
    /**
     * Override pairwise coupling to use effective J
     */
    _pairwiseCoupling(i) {
        const J = this.effectiveJ;
        let sum = 0;
        
        for (let j = 0; j < this.N; j++) {
            if (i !== j && J[i][j] !== 0) {
                sum += J[i][j] * Math.sin(this.theta[j] - this.theta[i]);
            }
        }
        
        return sum;
    }
    
    /**
     * Compute clustering coefficient based on ALK couplings
     * 
     * @returns {number} Mean clustering coefficient
     */
    clusteringCoefficient() {
        const J = this.effectiveJ;
        let totalCC = 0;
        let validNodes = 0;
        
        for (let i = 0; i < this.N; i++) {
            // Find neighbors (non-zero coupling)
            const neighbors = [];
            for (let j = 0; j < this.N; j++) {
                if (i !== j && Math.abs(J[i][j]) > 1e-10) {
                    neighbors.push(j);
                }
            }
            
            const k = neighbors.length;
            if (k < 2) continue;
            
            // Count edges between neighbors
            let triangles = 0;
            for (let a = 0; a < k; a++) {
                for (let b = a + 1; b < k; b++) {
                    if (Math.abs(J[neighbors[a]][neighbors[b]]) > 1e-10) {
                        triangles++;
                    }
                }
            }
            
            const maxTriangles = k * (k - 1) / 2;
            totalCC += triangles / maxTriangles;
            validNodes++;
        }
        
        return validNodes > 0 ? totalCC / validNodes : 0;
    }
    
    /**
     * Compute small-world coefficient
     * σ = (C/C_random) / (L/L_random)
     * 
     * @returns {number} Small-world coefficient (σ > 1 indicates small-world)
     */
    smallWorldCoefficient() {
        const C = this.clusteringCoefficient();
        const r = this.orderParameter();
        
        // Estimate random network values
        const density = this._computeDensity();
        const C_random = density; // Expected for random network
        const L_random = Math.log(this.N); // Approximate for sparse random
        
        // Use order parameter as proxy for path length
        // Higher sync → shorter effective path
        const L = 1 / (r + 0.1);
        
        if (C_random < 1e-10 || L_random < 1e-10) return 1;
        
        return (C / C_random) / (L / L_random);
    }
    
    /**
     * Compute network density
     * @private
     */
    _computeDensity() {
        const J = this.effectiveJ;
        let edges = 0;
        
        for (let i = 0; i < this.N; i++) {
            for (let j = i + 1; j < this.N; j++) {
                if (Math.abs(J[i][j]) > 1e-10) {
                    edges++;
                }
            }
        }
        
        const maxEdges = this.N * (this.N - 1) / 2;
        return edges / maxEdges;
    }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create ALK-Kuramoto model from prime set
 * 
 * @param {number[]} primes - Array of primes
 * @param {Object} options - Configuration
 * @returns {ALKKuramotoModel} Model instance
 */
function createALKKuramoto(primes, options = {}) {
    const alk = new ArithmeticLinkKernel(primes, {
        encoding: options.encoding || 'bipolar'
    });
    
    // Generate natural frequencies from primes
    const omega = primes.map(p => Math.log(p));
    
    return new ALKKuramotoModel(omega, alk, options);
}

/**
 * Create ALK Network Kuramoto from prime set
 * 
 * @param {number[]} primes - Array of primes
 * @param {Object} options - Configuration
 * @returns {ALKNetworkKuramoto} Model instance
 */
function createALKNetworkKuramoto(primes, options = {}) {
    const alk = new ArithmeticLinkKernel(primes, {
        encoding: options.encoding || 'bipolar'
    });
    
    const omega = primes.map(p => Math.log(p));
    
    return new ALKNetworkKuramoto(omega, alk, options);
}

/**
 * Run Borromean synchronization experiment
 * 
 * Investigates how Borromean triples synchronize differently
 * from pairwise-coupled oscillators.
 * 
 * @param {number[]} primes - Array of primes
 * @param {Object} options - Experiment options
 * @returns {Object} Experiment results
 */
function runBorromeanExperiment(primes, options = {}) {
    const alk = new ArithmeticLinkKernel(primes);
    const borromean = alk.findBorromeanTriples();
    
    const steps = options.steps || 1000;
    const dt = options.dt || 0.01;
    
    // Create model with triadic coupling
    const modelTriadic = new ALKKuramotoModel(
        primes.map(p => Math.log(p)),
        alk,
        { useTriadic: true, dt }
    );
    
    // Create model without triadic coupling
    const modelPairwise = new ALKKuramotoModel(
        primes.map(p => Math.log(p)),
        alk,
        { useTriadic: false, dt }
    );
    
    // Same initial conditions
    const initialPhases = primes.map(() => Math.random() * 2 * Math.PI);
    modelTriadic.setPhases(initialPhases);
    modelPairwise.setPhases(initialPhases);
    
    // Evolve both
    const triadicHistory = [];
    const pairwiseHistory = [];
    
    for (let i = 0; i < steps; i++) {
        modelTriadic.step();
        modelPairwise.step();
        
        if (i % 10 === 0) {
            triadicHistory.push({
                time: modelTriadic.time,
                r: modelTriadic.orderParameter(),
                triadic: modelTriadic.triadicCoherence()
            });
            pairwiseHistory.push({
                time: modelPairwise.time,
                r: modelPairwise.orderParameter(),
                triadic: modelPairwise.triadicCoherence()
            });
        }
    }
    
    return {
        borromeanTriples: borromean,
        triadicModel: {
            finalR: modelTriadic.orderParameter(),
            finalTriadic: modelTriadic.triadicCoherence(),
            history: triadicHistory
        },
        pairwiseModel: {
            finalR: modelPairwise.orderParameter(),
            finalTriadic: modelPairwise.triadicCoherence(),
            history: pairwiseHistory
        },
        comparison: {
            rDifference: modelTriadic.orderParameter() - modelPairwise.orderParameter(),
            triadicDifference: modelTriadic.triadicCoherence() - modelPairwise.triadicCoherence()
        }
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    ALKKuramotoModel,
    ALKNetworkKuramoto,
    createALKKuramoto,
    createALKNetworkKuramoto,
    runBorromeanExperiment
};

export default {
    ALKKuramotoModel,
    ALKNetworkKuramoto,
    createALKKuramoto,
    createALKNetworkKuramoto,
    runBorromeanExperiment
};