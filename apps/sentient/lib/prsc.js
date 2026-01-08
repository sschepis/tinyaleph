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
 *
 * v1.2.1 Enhancements:
 * - ThermalKuramoto integration for temperature-dependent dynamics
 * - Stochastic noise (white/colored) for robust synchronization
 * - Phase transition detection and critical temperature estimation
 * - Fluctuation-dissipation relationship
 */

const { Complex, PrimeState } = require('../../../core/hilbert');
const { firstNPrimes } = require('../../../core/prime');
const { gaussianRandom } = require('../../../physics/stochastic-kuramoto');

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
     * @param {boolean} [options.thermal=false] - Enable ThermalKuramoto dynamics
     * @param {number} [options.temperature=1.0] - Initial temperature (if thermal=true)
     * @param {number} [options.noiseIntensity=0.1] - Noise intensity for stochastic dynamics
     * @param {string} [options.noiseType='white'] - 'white' or 'colored' noise
     * @param {number} [options.correlationTime=1.0] - Correlation time for colored noise
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
        
        // v1.2.1: Thermal/stochastic dynamics configuration
        this.thermal = options.thermal || false;
        this.temperature = options.temperature ?? 1.0;
        this.noiseIntensity = options.noiseIntensity ?? 0.1;
        this.noiseType = options.noiseType || 'white';
        this.correlationTime = options.correlationTime ?? 1.0;
        
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
        
        // v1.2.1: Colored noise state (Ornstein-Uhlenbeck process)
        if (this.noiseType === 'colored') {
            this.coloredNoiseState = new Float64Array(this.primes.length);
        }
        
        // v1.2.1: Noise statistics for analysis
        this.noiseStats = {
            mean: 0,
            variance: 0,
            sampleCount: 0
        };
        
        // v1.2.1: Phase transition tracking
        this.phaseTransitionHistory = [];
        this._lastOrderParameter = null;
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
        
        // First pass: compute all couplings (with optional thermal effects)
        const couplings = this.oscillators.map((osc, i) =>
            this.thermal ? this.thermalCoupling(osc, i, dt) : this.kuramotoCoupling(osc)
        );
        
        // Second pass: update phases and amplitudes
        for (let i = 0; i < this.oscillators.length; i++) {
            const osc = this.oscillators[i];
            
            // Phase evolution (equation 2)
            // φp(t + Δt) = φp(t) + 2πf(p)Δt * speed
            osc.phase += 2 * Math.PI * osc.frequency * dt * this.speed;
            
            // Kuramoto coupling contribution (equation 4)
            // For thermal mode, coupling already includes stochastic term and dt
            if (this.thermal) {
                osc.phase += couplings[i]; // Already includes dt
            } else {
                osc.phase += couplings[i] * dt;
            }
            
            // Normalize phase to [0, 2π]
            osc.phase = ((osc.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            
            // Amplitude damping (equation 3)
            osc.damp(this.damp, dt);
        }
        
        // Record coherence history
        const coherence = this.globalCoherence();
        const orderParam = this.orderParameter();
        
        this.coherenceHistory.push({
            time: Date.now(),
            coherence,
            orderParameter: orderParam,
            activeCount: this.activeCount(),
            temperature: this.thermal ? this.temperature : null
        });
        
        if (this.coherenceHistory.length > this.maxHistoryLength) {
            this.coherenceHistory.shift();
        }
        
        // v1.2.1: Track phase transitions
        this._detectPhaseTransition(orderParam);
        
        return coherence;
    }
    
    /**
     * v1.2.1: Thermal Kuramoto coupling with temperature-dependent dynamics
     * Implements: dθᵢ = [ωᵢ + (K_eff/N)Σsin(θⱼ-θᵢ)]dt + σ·dW
     * where K_eff = K/T (Arrhenius-like temperature dependence)
     *
     * @param {PrimeOscillator} osc - Target oscillator
     * @param {number} idx - Oscillator index
     * @param {number} dt - Time step
     * @returns {number} Phase increment (deterministic + stochastic)
     */
    thermalCoupling(osc, idx, dt) {
        // Effective coupling (temperature-dependent)
        const Keff = this.K / Math.max(0.01, this.temperature);
        
        // Deterministic Kuramoto term
        let coupling = 0;
        const N = this.oscillators.length;
        
        for (const other of this.oscillators) {
            if (other !== osc) {
                // Weight by amplitude for amplitude-aware coupling
                const weight = Math.min(1, other.amplitude + 0.1);
                coupling += weight * Math.sin(other.phase - osc.phase);
            }
        }
        
        const deterministicPart = (Keff / N) * coupling * dt;
        
        // Stochastic part (noise)
        const stochasticPart = this.getNoiseIncrement(idx, dt);
        
        // Update noise statistics
        this._updateNoiseStats(stochasticPart);
        
        return deterministicPart + stochasticPart;
    }
    
    /**
     * v1.2.1: Generate noise increment based on noise type
     * @param {number} idx - Oscillator index
     * @param {number} dt - Time step
     * @returns {number} Noise increment
     */
    getNoiseIncrement(idx, dt) {
        if (this.noiseType === 'colored') {
            return this.updateColoredNoise(idx, dt);
        }
        // White noise: σ·√dt·N(0,1) with fluctuation-dissipation: σ ∝ √T
        const sigma = this.noiseIntensity * Math.sqrt(this.temperature);
        return sigma * Math.sqrt(dt) * gaussianRandom();
    }
    
    /**
     * v1.2.1: Update Ornstein-Uhlenbeck process for colored noise
     * dη = -η/τ dt + (σ/√τ)·dW
     *
     * @param {number} idx - Oscillator index
     * @param {number} dt - Time step
     * @returns {number} Colored noise increment
     */
    updateColoredNoise(idx, dt) {
        if (!this.coloredNoiseState) {
            this.coloredNoiseState = new Float64Array(this.oscillators.length);
        }
        
        const eta = this.coloredNoiseState[idx];
        const decay = Math.exp(-dt / this.correlationTime);
        const sigma = this.noiseIntensity * Math.sqrt(this.temperature);
        const diffusion = sigma * Math.sqrt((1 - decay * decay) / 2);
        
        // Exact update for OU process
        this.coloredNoiseState[idx] = eta * decay + diffusion * gaussianRandom();
        
        return this.coloredNoiseState[idx] * dt;
    }
    
    /**
     * v1.2.1: Update running noise statistics
     * @private
     */
    _updateNoiseStats(noiseValue) {
        const n = ++this.noiseStats.sampleCount;
        const delta = noiseValue - this.noiseStats.mean;
        this.noiseStats.mean += delta / n;
        const delta2 = noiseValue - this.noiseStats.mean;
        this.noiseStats.variance += (delta * delta2 - this.noiseStats.variance) / n;
    }
    
    /**
     * v1.2.1: Detect phase transitions based on order parameter changes
     * @private
     */
    _detectPhaseTransition(orderParam) {
        if (this._lastOrderParameter !== null) {
            const delta = orderParam - this._lastOrderParameter;
            const threshold = 0.1; // Significant change threshold
            
            if (Math.abs(delta) > threshold) {
                this.phaseTransitionHistory.push({
                    time: Date.now(),
                    fromOrder: this._lastOrderParameter,
                    toOrder: orderParam,
                    temperature: this.temperature,
                    type: delta > 0 ? 'ordering' : 'disordering'
                });
                
                // Keep limited history
                if (this.phaseTransitionHistory.length > 50) {
                    this.phaseTransitionHistory.shift();
                }
            }
        }
        this._lastOrderParameter = orderParam;
    }
    
    /**
     * v1.2.1: Set temperature for thermal dynamics
     * Updates noise intensity according to fluctuation-dissipation theorem
     * @param {number} T - New temperature
     */
    setTemperature(T) {
        this.temperature = Math.max(0.01, T);
    }
    
    /**
     * v1.2.1: Get order parameter (Kuramoto synchronization measure)
     * r = |1/N Σ e^(iθⱼ)|
     */
    orderParameter() {
        let realSum = 0, imagSum = 0;
        const N = this.oscillators.length;
        
        for (const osc of this.oscillators) {
            realSum += Math.cos(osc.phase);
            imagSum += Math.sin(osc.phase);
        }
        
        return Math.sqrt((realSum / N) ** 2 + (imagSum / N) ** 2);
    }
    
    /**
     * v1.2.1: Estimate critical temperature for phase transition
     * T_c ≈ K (coupling strength) for uniform frequencies
     */
    estimateCriticalTemperature() {
        // Compute frequency spread
        const freqs = this.oscillators.map(o => o.frequency);
        const meanFreq = freqs.reduce((a, b) => a + b, 0) / freqs.length;
        const freqSpread = Math.sqrt(
            freqs.reduce((sum, f) => sum + (f - meanFreq) ** 2, 0) / freqs.length
        );
        
        // T_c ≈ K * (1 + frequency spread factor)
        return this.K * (1 + freqSpread);
    }
    
    /**
     * v1.2.1: Check if system is in ordered (synchronized) phase
     * @param {number} threshold - Order parameter threshold
     */
    isOrdered(threshold = 0.5) {
        return this.orderParameter() > threshold;
    }
    
    /**
     * v1.2.1: Check if system is near critical temperature
     * @param {number} tolerance - Tolerance factor (fraction of T_c)
     */
    isNearCritical(tolerance = 0.2) {
        const Tc = this.estimateCriticalTemperature();
        return Math.abs(this.temperature - Tc) / Tc < tolerance;
    }
    
    /**
     * v1.2.1: Perform temperature sweep to find phase transition
     * @param {number} Tmin - Minimum temperature
     * @param {number} Tmax - Maximum temperature
     * @param {number} steps - Number of temperature steps
     * @param {number} equilibrationSteps - Steps to equilibrate at each T
     */
    temperatureSweep(Tmin = 0.1, Tmax = 2.0, steps = 20, equilibrationSteps = 100) {
        if (!this.thermal) {
            console.warn('temperatureSweep requires thermal=true');
            return [];
        }
        
        const results = [];
        const originalTemp = this.temperature;
        
        for (let i = 0; i < steps; i++) {
            const T = Tmin + (Tmax - Tmin) * i / (steps - 1);
            this.setTemperature(T);
            
            // Equilibrate
            for (let j = 0; j < equilibrationSteps; j++) {
                this.tick();
            }
            
            // Measure order parameter with averaging
            let orderSum = 0;
            const measureSteps = 50;
            for (let j = 0; j < measureSteps; j++) {
                this.tick();
                orderSum += this.orderParameter();
            }
            
            results.push({
                temperature: T,
                orderParameter: orderSum / measureSteps,
                coherence: this.globalCoherence()
            });
        }
        
        // Restore original temperature
        this.setTemperature(originalTemp);
        
        return results;
    }
    
    /**
     * v1.2.1: Enable/disable thermal dynamics
     * @param {boolean} enabled - Whether to enable thermal dynamics
     */
    setThermal(enabled) {
        this.thermal = enabled;
        if (enabled && this.noiseType === 'colored' && !this.coloredNoiseState) {
            this.coloredNoiseState = new Float64Array(this.oscillators.length);
        }
    }
    
    /**
     * v1.2.1: Get thermal state information
     */
    getThermalState() {
        return {
            thermal: this.thermal,
            temperature: this.temperature,
            noiseIntensity: this.noiseIntensity,
            noiseType: this.noiseType,
            correlationTime: this.correlationTime,
            effectiveCoupling: this.thermal ? this.K / this.temperature : this.K,
            orderParameter: this.orderParameter(),
            criticalTemperature: this.estimateCriticalTemperature(),
            isOrdered: this.isOrdered(),
            isNearCritical: this.isNearCritical(),
            noiseStats: { ...this.noiseStats },
            recentTransitions: this.phaseTransitionHistory.slice(-5)
        };
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
        const state = {
            oscillators: this.oscillators.map(o => o.toJSON()),
            coherence: this.globalCoherence(),
            meanPhase: this.meanPhase(),
            activeCount: this.activeCount(),
            totalEnergy: this.totalEnergy(),
            amplitudeEntropy: this.amplitudeEntropy()
        };
        
        // v1.2.1: Include thermal state if enabled
        if (this.thermal) {
            state.thermal = this.getThermalState();
        }
        
        return state;
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
            randomPhase: false,
            // v1.2.1: Clone thermal settings
            thermal: this.thermal,
            temperature: this.temperature,
            noiseIntensity: this.noiseIntensity,
            noiseType: this.noiseType,
            correlationTime: this.correlationTime
        });
        
        for (let i = 0; i < this.oscillators.length; i++) {
            cloned.oscillators[i] = this.oscillators[i].clone();
        }
        
        // v1.2.1: Clone colored noise state if present
        if (this.coloredNoiseState) {
            cloned.coloredNoiseState = new Float64Array(this.coloredNoiseState);
        }
        
        return cloned;
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        const json = {
            primes: this.primes,
            oscillators: this.oscillators.map(o => o.toJSON()),
            config: {
                speed: this.speed,
                damp: this.damp,
                coupling: this.K,
                dt: this.dt,
                // v1.2.1: Include thermal config
                thermal: this.thermal,
                temperature: this.temperature,
                noiseIntensity: this.noiseIntensity,
                noiseType: this.noiseType,
                correlationTime: this.correlationTime
            },
            metrics: {
                coherence: this.globalCoherence(),
                activeCount: this.activeCount(),
                totalEnergy: this.totalEnergy(),
                // v1.2.1: Include order parameter
                orderParameter: this.orderParameter()
            }
        };
        
        // v1.2.1: Include thermal metrics if enabled
        if (this.thermal) {
            json.thermal = this.getThermalState();
        }
        
        return json;
    }
    
    /**
     * v1.2.1: Reset thermal/stochastic state
     */
    resetThermal() {
        if (this.coloredNoiseState) {
            this.coloredNoiseState.fill(0);
        }
        this.noiseStats = { mean: 0, variance: 0, sampleCount: 0 };
        this.phaseTransitionHistory = [];
        this._lastOrderParameter = null;
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