/**
 * Prime Resonance Semantic Computation (PRSC) Layer
 * 
 * Implements oscillator physics as the runtime carrier for semantic
 * interference and coherence. From "A Design for a Sentient Observer"
 * paper, Section 3.2.
 * 
 * Key features:
 * - Prime-indexed oscillators with frequency f(p) = 1 + ln(p)/10
 * - Phase evolution with damping
 * - Kuramoto-style coupling for synchronization
 * - Global and graph-based coherence metrics
 * - Semantic state extraction
 */

const { Complex, PrimeState } = require('../../../core/hilbert');
const { firstNPrimes } = require('../../../core/prime');

/**
 * Single oscillator representing a prime mode
 */
class PrimeOscillator {
    /**
     * Create a prime oscillator
     * @param {number} prime - The prime number this oscillator represents
     * @param {Object} options - Configuration options
     */
    constructor(prime, options = {}) {
        this.prime = prime;
        this.frequency = options.frequency || PrimeOscillator.primeToFrequency(prime);
        this.phase = options.phase !== undefined ? options.phase : Math.random() * 2 * Math.PI;
        this.amplitude = options.amplitude || 0;
        this.naturalPhase = this.phase; // For tracking phase drift
    }
    
    /**
     * Convert prime to natural frequency (equation 2)
     * f(p) = 1 + ln(p)/10
     * @param {number} p - Prime number
     */
    static primeToFrequency(p) {
        return 1 + Math.log(p) / 10;
    }
    
    /**
     * Excite this oscillator
     * @param {number} amount - Amount to add to amplitude
     */
    excite(amount = 1.0) {
        this.amplitude = Math.min(1.0, this.amplitude + amount);
    }
    
    /**
     * Apply damping to amplitude (equation 3)
     * Ap(t + Δt) = Ap(t) * (1 - damp * Δt)
     * @param {number} dampRate - Damping rate
     * @param {number} dt - Time step
     */
    damp(dampRate, dt) {
        this.amplitude *= (1 - dampRate * dt);
        if (this.amplitude < 1e-10) {
            this.amplitude = 0;
        }
    }
    
    /**
     * Get complex amplitude (amplitude * e^(i*phase))
     */
    complexAmplitude() {
        return Complex.fromPolar(this.amplitude, this.phase);
    }
    
    /**
     * Get weighted amplitude (amplitude * sin(phase))
     */
    weightedAmplitude() {
        return this.amplitude * Math.sin(this.phase);
    }
    
    /**
     * Clone this oscillator
     */
    clone() {
        return new PrimeOscillator(this.prime, {
            frequency: this.frequency,
            phase: this.phase,
            amplitude: this.amplitude
        });
    }
    
    /**
     * Serialize to object
     */
    toJSON() {
        return {
            prime: this.prime,
            frequency: this.frequency,
            phase: this.phase,
            amplitude: this.amplitude
        };
    }
}

/**
 * PRSC Layer - Prime Resonance Semantic Computation
 * 
 * Manages a bank of prime-indexed oscillators with Kuramoto coupling.
 */
class PRSCLayer {
    /**
     * Create a PRSC layer
     * @param {Array<number>|number} primes - Array of primes or count of primes to use
     * @param {Object} options - Configuration options
     */
    constructor(primes, options = {}) {
        // Handle primes argument
        if (typeof primes === 'number') {
            this.primes = firstNPrimes(primes);
        } else if (Array.isArray(primes)) {
            this.primes = primes;
        } else {
            this.primes = firstNPrimes(64); // Default to 64 primes
        }
        
        // Configuration
        this.speed = options.speed || 1.0;           // Speed multiplier
        this.damp = options.damp || 0.02;            // Damping rate
        this.K = options.coupling || 0.3;            // Kuramoto coupling strength
        this.dt = options.dt || 0.016;               // Default time step (~60Hz)
        
        // Initialize oscillators with small baseline activity for entropy
        this.oscillators = this.primes.map((p, i) => new PrimeOscillator(p, {
            phase: options.randomPhase !== false ? Math.random() * 2 * Math.PI : 0,
            // Give first few primes some initial amplitude for baseline activity
            amplitude: options.initialAmplitude !== undefined ? options.initialAmplitude :
                       (i < 8 ? 0.05 + 0.05 * Math.random() : 0.01 * Math.random())
        }));
        
        // Create prime to index map
        this.primeToIndex = new Map();
        this.primes.forEach((p, i) => this.primeToIndex.set(p, i));
        
        // History for analysis
        this.coherenceHistory = [];
        this.maxHistoryLength = options.maxHistoryLength || 100;
    }
    
    /**
     * Get oscillator by prime number
     * @param {number} prime - Prime number
     */
    getOscillator(prime) {
        const idx = this.primeToIndex.get(prime);
        return idx !== undefined ? this.oscillators[idx] : null;
    }
    
    /**
     * Single time step evolution
     * @param {number} dt - Time step (optional, uses default)
     */
    tick(dt = null) {
        dt = dt || this.dt;
        
        // First pass: compute all couplings
        const couplings = this.oscillators.map(osc => this.kuramotoCoupling(osc));
        
        // Second pass: update phases and amplitudes
        for (let i = 0; i < this.oscillators.length; i++) {
            const osc = this.oscillators[i];
            
            // Phase evolution (equation 2)
            // φp(t + Δt) = φp(t) + 2πf(p)Δt * speed
            osc.phase += 2 * Math.PI * osc.frequency * dt * this.speed;
            
            // Kuramoto coupling contribution (equation 4)
            osc.phase += couplings[i] * dt;
            
            // Normalize phase to [0, 2π]
            osc.phase = ((osc.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            
            // Amplitude damping (equation 3)
            osc.damp(this.damp, dt);
        }
        
        // Record coherence history
        const coherence = this.globalCoherence();
        this.coherenceHistory.push({
            time: Date.now(),
            coherence,
            activeCount: this.activeCount()
        });
        
        if (this.coherenceHistory.length > this.maxHistoryLength) {
            this.coherenceHistory.shift();
        }
        
        return coherence;
    }
    
    /**
     * Kuramoto coupling for an oscillator (equation 4)
     * dφi/dt = ωi + (K/N) Σj sin(φj - φi)
     * 
     * @param {PrimeOscillator} osc - Target oscillator
     */
    kuramotoCoupling(osc) {
        let sum = 0;
        const N = this.oscillators.length;
        
        for (const other of this.oscillators) {
            if (other !== osc) {
                // Weight by amplitude for amplitude-aware coupling
                const weight = Math.min(1, other.amplitude + 0.1);
                sum += weight * Math.sin(other.phase - osc.phase);
            }
        }
        
        return (this.K / N) * sum;
    }
    
    /**
     * Global coherence / order parameter (equation 5)
     * Cglobal(t) = |1/|P| Σp e^(iφp(t))|
     */
    globalCoherence() {
        let realSum = 0, imagSum = 0;
        let weightSum = 0;
        
        for (const osc of this.oscillators) {
            // Weight by amplitude for amplitude-aware coherence
            const weight = Math.max(0.1, osc.amplitude);
            realSum += weight * Math.cos(osc.phase);
            imagSum += weight * Math.sin(osc.phase);
            weightSum += weight;
        }
        
        if (weightSum < 1e-10) return 0;
        
        return Math.sqrt((realSum / weightSum) ** 2 + (imagSum / weightSum) ** 2);
    }
    
    /**
     * Graph-based coherence (equation 6)
     * Cgraph(t) = Σi,j wij cos(φi(t) - φj(t))
     * 
     * @param {Array<Array<number>>|Function} weights - Weight matrix or function(i,j)
     */
    graphCoherence(weights) {
        let sum = 0;
        const N = this.oscillators.length;
        
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                let w;
                if (typeof weights === 'function') {
                    w = weights(i, j);
                } else if (weights && weights[i] && weights[i][j] !== undefined) {
                    w = weights[i][j];
                } else {
                    w = 1 / N; // Default uniform weight
                }
                
                sum += w * Math.cos(this.oscillators[i].phase - this.oscillators[j].phase);
            }
        }
        
        return sum;
    }
    
    /**
     * Mean phase (average direction)
     */
    meanPhase() {
        let realSum = 0, imagSum = 0;
        let weightSum = 0;
        
        for (const osc of this.oscillators) {
            const weight = Math.max(0.1, osc.amplitude);
            realSum += weight * Math.cos(osc.phase);
            imagSum += weight * Math.sin(osc.phase);
            weightSum += weight;
        }
        
        return Math.atan2(imagSum / weightSum, realSum / weightSum);
    }
    
    /**
     * Excite oscillators for given primes
     * @param {Array<number>} primes - Primes to excite
     * @param {number} amount - Excitation amount
     */
    excite(primes, amount = 0.5) {
        const primeSet = new Set(primes);
        for (const osc of this.oscillators) {
            if (primeSet.has(osc.prime)) {
                osc.excite(amount);
            }
        }
    }
    
    /**
     * Excite oscillators by indices
     * @param {Array<number>} indices - Indices to excite
     * @param {number} amount - Excitation amount
     */
    exciteByIndex(indices, amount = 0.5) {
        for (const idx of indices) {
            if (idx >= 0 && idx < this.oscillators.length) {
                this.oscillators[idx].excite(amount);
            }
        }
    }
    
    /**
     * Get count of active oscillators (amplitude > threshold)
     * @param {number} threshold - Amplitude threshold
     */
    activeCount(threshold = 0.1) {
        return this.oscillators.filter(o => o.amplitude > threshold).length;
    }
    
    /**
     * Get active primes (amplitude > threshold)
     * @param {number} threshold - Amplitude threshold
     */
    activePrimes(threshold = 0.1) {
        return this.oscillators
            .filter(o => o.amplitude > threshold)
            .map(o => o.prime);
    }
    
    /**
     * Get all amplitudes as array
     */
    getAmplitudes() {
        return this.oscillators.map(o => o.amplitude);
    }
    
    /**
     * Get all phases as array
     */
    getPhases() {
        return this.oscillators.map(o => o.phase);
    }
    
    /**
     * Get weighted amplitudes (amplitude * sin(phase))
     */
    getWeightedAmplitudes() {
        return this.oscillators.map(o => o.weightedAmplitude());
    }
    
    /**
     * Convert to PrimeState (quantum-like state)
     * |ψ⟩ = Σ αp|p⟩ where αp = Ap * e^(iφp)
     */
    toSemanticState() {
        const state = new PrimeState(this.primes);
        
        for (const osc of this.oscillators) {
            const amplitude = osc.complexAmplitude();
            state.set(osc.prime, amplitude);
        }
        
        return state.normalize();
    }
    
    /**
     * Load state from PrimeState
     * @param {PrimeState} state - State to load from
     */
    fromSemanticState(state) {
        for (const osc of this.oscillators) {
            const amp = state.get(osc.prime);
            if (amp) {
                osc.amplitude = amp.norm();
                osc.phase = amp.phase();
            }
        }
    }
    
    /**
     * Compute total energy (sum of squared amplitudes)
     */
    totalEnergy() {
        return this.oscillators.reduce((sum, o) => sum + o.amplitude ** 2, 0);
    }
    
    /**
     * Compute amplitude entropy
     */
    amplitudeEntropy() {
        const total = this.oscillators.reduce((sum, o) => sum + o.amplitude, 0);
        if (total < 1e-10) return 0;
        
        let H = 0;
        for (const osc of this.oscillators) {
            const p = osc.amplitude / total;
            if (p > 1e-10) {
                H -= p * Math.log2(p);
            }
        }
        return H;
    }
    
    /**
     * Reset all oscillators
     * @param {boolean} randomPhase - Whether to randomize phases
     */
    reset(randomPhase = true) {
        for (const osc of this.oscillators) {
            osc.amplitude = 0;
            osc.phase = randomPhase ? Math.random() * 2 * Math.PI : 0;
        }
        this.coherenceHistory = [];
    }
    
    /**
     * Get state snapshot
     */
    getState() {
        return {
            oscillators: this.oscillators.map(o => o.toJSON()),
            coherence: this.globalCoherence(),
            meanPhase: this.meanPhase(),
            activeCount: this.activeCount(),
            totalEnergy: this.totalEnergy(),
            amplitudeEntropy: this.amplitudeEntropy()
        };
    }
    
    /**
     * Load state from snapshot
     * @param {Object} state - State snapshot
     */
    loadState(state) {
        if (!state.oscillators) return;
        
        for (let i = 0; i < Math.min(state.oscillators.length, this.oscillators.length); i++) {
            const saved = state.oscillators[i];
            const osc = this.oscillators[i];
            osc.amplitude = saved.amplitude || 0;
            osc.phase = saved.phase || 0;
        }
    }
    
    /**
     * Get coherence trend (recent change in coherence)
     */
    coherenceTrend() {
        if (this.coherenceHistory.length < 2) return 0;
        
        const recent = this.coherenceHistory.slice(-10);
        if (recent.length < 2) return 0;
        
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        
        const firstAvg = firstHalf.reduce((s, h) => s + h.coherence, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, h) => s + h.coherence, 0) / secondHalf.length;
        
        return secondAvg - firstAvg;
    }
    
    /**
     * Clone this PRSC layer
     */
    clone() {
        const cloned = new PRSCLayer(this.primes.slice(), {
            speed: this.speed,
            damp: this.damp,
            coupling: this.K,
            dt: this.dt,
            randomPhase: false
        });
        
        for (let i = 0; i < this.oscillators.length; i++) {
            cloned.oscillators[i] = this.oscillators[i].clone();
        }
        
        return cloned;
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            primes: this.primes,
            oscillators: this.oscillators.map(o => o.toJSON()),
            config: {
                speed: this.speed,
                damp: this.damp,
                coupling: this.K,
                dt: this.dt
            },
            metrics: {
                coherence: this.globalCoherence(),
                activeCount: this.activeCount(),
                totalEnergy: this.totalEnergy()
            }
        };
    }
}

/**
 * Entanglement Detection (equations 16-17)
 * Detects phase and amplitude correlations between oscillator pairs
 */
class EntanglementDetector {
    /**
     * Create an entanglement detector
     * @param {number} threshold - Entanglement strength threshold
     */
    constructor(threshold = 0.7) {
        this.threshold = threshold;
    }
    
    /**
     * Compute entanglement strength between two oscillators (equation 17)
     * strength(i,j) = ρφ * ρA
     * where ρφ = cos(Δφ) and ρA = min(Ai,Aj) / max(Ai,Aj)
     * 
     * @param {PrimeOscillator} osc1 - First oscillator
     * @param {PrimeOscillator} osc2 - Second oscillator
     */
    strength(osc1, osc2) {
        // Phase correlation (equation 16)
        const deltaPhi = Math.abs(osc1.phase - osc2.phase);
        const rhoPhase = Math.cos(deltaPhi);
        
        // Amplitude correlation
        const minA = Math.min(osc1.amplitude, osc2.amplitude);
        const maxA = Math.max(osc1.amplitude, osc2.amplitude);
        const rhoAmplitude = minA / (maxA + 1e-10);
        
        return rhoPhase * rhoAmplitude;
    }
    
    /**
     * Check if two oscillators are entangled
     * @param {PrimeOscillator} osc1 - First oscillator
     * @param {PrimeOscillator} osc2 - Second oscillator
     */
    isEntangled(osc1, osc2) {
        return this.strength(osc1, osc2) > this.threshold;
    }
    
    /**
     * Find all entangled pairs in a PRSC layer
     * @param {PRSCLayer} prsc - PRSC layer to analyze
     */
    findEntangledPairs(prsc) {
        const pairs = [];
        const oscillators = prsc.oscillators;
        
        for (let i = 0; i < oscillators.length; i++) {
            for (let j = i + 1; j < oscillators.length; j++) {
                const s = this.strength(oscillators[i], oscillators[j]);
                if (s > this.threshold) {
                    pairs.push({
                        i, j,
                        primes: [oscillators[i].prime, oscillators[j].prime],
                        strength: s,
                        phaseDiff: Math.abs(oscillators[i].phase - oscillators[j].phase)
                    });
                }
            }
        }
        
        return pairs.sort((a, b) => b.strength - a.strength);
    }
    
    /**
     * Build entanglement graph
     * @param {PRSCLayer} prsc - PRSC layer to analyze
     */
    buildEntanglementGraph(prsc) {
        const pairs = this.findEntangledPairs(prsc);
        const graph = new Map();
        
        for (const pair of pairs) {
            // Add edge for first prime
            if (!graph.has(pair.primes[0])) {
                graph.set(pair.primes[0], []);
            }
            graph.get(pair.primes[0]).push({
                prime: pair.primes[1],
                strength: pair.strength
            });
            
            // Add edge for second prime
            if (!graph.has(pair.primes[1])) {
                graph.set(pair.primes[1], []);
            }
            graph.get(pair.primes[1]).push({
                prime: pair.primes[0],
                strength: pair.strength
            });
        }
        
        return graph;
    }
    
    /**
     * Detect coherence peaks in history (for phrase segmentation)
     * @param {Array} history - Coherence history array
     * @param {number} windowSize - Window for peak detection
     */
    detectCoherencePeaks(history, windowSize = 5) {
        if (history.length < windowSize * 2) return [];
        
        const peaks = [];
        
        for (let i = windowSize; i < history.length - windowSize; i++) {
            const center = history[i].coherence;
            let isPeak = true;
            
            for (let j = -windowSize; j <= windowSize; j++) {
                if (j !== 0 && history[i + j].coherence >= center) {
                    isPeak = false;
                    break;
                }
            }
            
            if (isPeak) {
                peaks.push({
                    index: i,
                    time: history[i].time,
                    coherence: center
                });
            }
        }
        
        return peaks;
    }
    
    /**
     * Detect energy troughs (for phrase segmentation)
     * @param {PRSCLayer} prsc - PRSC layer
     * @param {number} threshold - Trough threshold
     */
    detectEnergyTrough(prsc, threshold = 0.1) {
        const energy = prsc.totalEnergy();
        return energy < threshold;
    }
}

module.exports = {
    PrimeOscillator,
    PRSCLayer,
    EntanglementDetector
};