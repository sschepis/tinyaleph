/**
 * Sedenion Memory Field (SMF)
 * 
 * 16-dimensional semantic orientation space for identity continuity
 * and order-sensitive composition. From "A Design for a Sentient Observer"
 * paper, Section 4.
 * 
 * Key features:
 * - 16 semantic axes with interpretations
 * - Non-associative sedenion multiplication
 * - Zero-divisor detection for "tunneling" transitions
 * - SMF entropy calculation
 * - SLERP interpolation for smooth transitions
 */

const { Hypercomplex } = require('../../../core/hypercomplex');
const { multiplyIndices } = require('../../../core/fano');

/**
 * Semantic axis interpretations (from paper Table 1)
 */
const SMF_AXES = [
    { index: 0,  name: 'coherence',     description: 'internal consistency / alignment' },
    { index: 1,  name: 'identity',      description: 'self-continuity / individuation' },
    { index: 2,  name: 'duality',       description: 'complementarity / opposition' },
    { index: 3,  name: 'structure',     description: 'organization / form' },
    { index: 4,  name: 'change',        description: 'transformation / dynamics' },
    { index: 5,  name: 'life',          description: 'vitality / growth' },
    { index: 6,  name: 'harmony',       description: 'balance / resonance' },
    { index: 7,  name: 'wisdom',        description: 'insight / understanding' },
    { index: 8,  name: 'infinity',      description: 'boundlessness / transcendence' },
    { index: 9,  name: 'creation',      description: 'genesis / origination' },
    { index: 10, name: 'truth',         description: 'verity / authenticity' },
    { index: 11, name: 'love',          description: 'connection / care' },
    { index: 12, name: 'power',         description: 'capacity / influence' },
    { index: 13, name: 'time',          description: 'temporality / sequence' },
    { index: 14, name: 'space',         description: 'extension / locality' },
    { index: 15, name: 'consciousness', description: 'awareness / sentience' }
];

/**
 * Axis name to index mapping
 */
const AXIS_INDEX = {};
for (const axis of SMF_AXES) {
    AXIS_INDEX[axis.name] = axis.index;
}

/**
 * SedenionMemoryField class
 * 
 * Implements a 16-dimensional semantic orientation space with
 * non-associative composition and zero-divisor tunneling.
 */
class SedenionMemoryField {
    /**
     * Create a new SMF
     * @param {Float64Array|Array|null} components - Initial components (optional)
     */
    constructor(components = null) {
        if (components) {
            this.s = components instanceof Float64Array 
                ? components 
                : Float64Array.from(components);
        } else {
            // Initialize with full coherence (axis 0)
            this.s = new Float64Array(16);
            this.s[0] = 1.0;
        }
        
        // Normalize on creation
        this.normalize();
    }
    
    /**
     * Static accessor for axis definitions
     */
    static get AXES() {
        return SMF_AXES;
    }
    
    /**
     * Static accessor for axis index map
     */
    static get AXIS_INDEX() {
        return AXIS_INDEX;
    }
    
    /**
     * Create a basis SMF (single axis excited)
     * @param {number|string} axis - Axis index or name
     * @param {number} value - Value for that axis
     */
    static basis(axis, value = 1.0) {
        const smf = new SedenionMemoryField();
        const idx = typeof axis === 'string' ? AXIS_INDEX[axis] : axis;
        smf.s.fill(0);
        smf.s[idx] = value;
        return smf;
    }
    
    /**
     * Create a uniform SMF (equal weight on all axes)
     */
    static uniform() {
        const smf = new SedenionMemoryField();
        const val = 1 / Math.sqrt(16);
        smf.s.fill(val);
        return smf;
    }
    
    /**
     * Create from Hypercomplex state
     * @param {Hypercomplex} hypercomplex - 16D hypercomplex state
     */
    static fromHypercomplex(hypercomplex) {
        if (hypercomplex.dim !== 16) {
            throw new Error('Hypercomplex state must be 16-dimensional');
        }
        return new SedenionMemoryField(hypercomplex.c);
    }
    
    /**
     * Convert to Hypercomplex
     */
    toHypercomplex() {
        return new Hypercomplex(16, Float64Array.from(this.s));
    }
    
    /**
     * Get axis value by name or index
     * @param {number|string} axis - Axis index or name
     */
    get(axis) {
        const idx = typeof axis === 'string' ? AXIS_INDEX[axis] : axis;
        return this.s[idx];
    }
    
    /**
     * Set axis value by name or index
     * @param {number|string} axis - Axis index or name
     * @param {number} value - Value to set
     */
    set(axis, value) {
        const idx = typeof axis === 'string' ? AXIS_INDEX[axis] : axis;
        this.s[idx] = value;
        return this;
    }
    
    /**
     * Compute the norm (magnitude) of the SMF
     */
    norm() {
        let sum = 0;
        for (let k = 0; k < 16; k++) {
            sum += this.s[k] * this.s[k];
        }
        return Math.sqrt(sum);
    }
    
    /**
     * Normalize to unit magnitude (equation 7)
     * s ← s / max(||s||, ε)
     */
    normalize(epsilon = 1e-10) {
        const n = this.norm();
        const denom = Math.max(n, epsilon);
        for (let k = 0; k < 16; k++) {
            this.s[k] /= denom;
        }
        return this;
    }
    
    /**
     * Compute SMF entropy (equation 8)
     * SSMF(s) = -Σ πk log(πk + ε)
     * where πk = |sk| / Σj|sj|
     */
    entropy(epsilon = 1e-10) {
        let normSum = 0;
        for (let k = 0; k < 16; k++) {
            normSum += Math.abs(this.s[k]);
        }
        
        if (normSum < epsilon) return 0;
        
        let H = 0;
        for (let k = 0; k < 16; k++) {
            const pi = Math.abs(this.s[k]) / normSum;
            if (pi > epsilon) {
                H -= pi * Math.log(pi + epsilon);
            }
        }
        return H;
    }
    
    /**
     * Alias for entropy (for compatibility)
     */
    smfEntropy(epsilon = 1e-10) {
        return this.entropy(epsilon);
    }
    
    /**
     * Non-associative sedenion multiplication (equation 9)
     * Uses Cayley-Dickson construction via Fano plane extension
     * (sa * sb) * sc ≠ sa * (sb * sc)
     * 
     * @param {SedenionMemoryField} other - SMF to multiply with
     * @returns {SedenionMemoryField} - Product SMF
     */
    multiply(other) {
        const result = new SedenionMemoryField();
        result.s.fill(0);
        
        // Use the Cayley-Dickson multiplication table
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                const [k, sign] = multiplyIndices(16, i, j);
                result.s[k] += sign * this.s[i] * other.s[j];
            }
        }
        
        return result;
    }
    
    /**
     * Sedenion conjugate (negate imaginary parts)
     */
    conjugate() {
        const result = new SedenionMemoryField();
        result.s[0] = this.s[0];
        for (let k = 1; k < 16; k++) {
            result.s[k] = -this.s[k];
        }
        return result;
    }
    
    /**
     * Sedenion inverse (if it exists)
     * For sedenions, inverse may not exist due to zero divisors
     */
    inverse() {
        const n2 = this.dot(this);
        if (n2 < 1e-10) {
            return null; // No inverse for zero or near-zero norm
        }
        const conj = this.conjugate();
        const result = new SedenionMemoryField();
        for (let k = 0; k < 16; k++) {
            result.s[k] = conj.s[k] / n2;
        }
        return result;
    }
    
    /**
     * Dot product (inner product)
     */
    dot(other) {
        let sum = 0;
        for (let k = 0; k < 16; k++) {
            sum += this.s[k] * other.s[k];
        }
        return sum;
    }
    
    /**
     * Add two SMFs
     */
    add(other) {
        const result = new SedenionMemoryField();
        for (let k = 0; k < 16; k++) {
            result.s[k] = this.s[k] + other.s[k];
        }
        return result;
    }
    
    /**
     * Scale by a scalar
     */
    scale(scalar) {
        const result = new SedenionMemoryField();
        for (let k = 0; k < 16; k++) {
            result.s[k] = this.s[k] * scalar;
        }
        return result;
    }
    
    /**
     * Check for zero-divisor tunneling opportunities (Section 4.4)
     * Two nonzero SMFs where their product is zero
     * @param {SedenionMemoryField} other - Target SMF
     * @param {number} threshold - Threshold for near-zero detection
     */
    canTunnelTo(other, threshold = 0.01) {
        const myNorm = this.norm();
        const otherNorm = other.norm();
        
        if (myNorm < 0.1 || otherNorm < 0.1) {
            return false; // Need substantial non-zero SMFs
        }
        
        const product = this.multiply(other);
        return product.norm() < threshold;
    }
    
    /**
     * SLERP interpolation for smooth transitions (equation 21)
     * s(t) = s0 * (s0^-1 * s1)^t, t ∈ [0, 1]
     * 
     * For sedenions, we use a simplified linear approximation
     * due to potential zero divisor issues
     * 
     * @param {SedenionMemoryField} other - Target SMF
     * @param {number} t - Interpolation parameter [0, 1]
     */
    slerp(other, t) {
        // Simplified approach: use normalized linear interpolation
        // (Full sedenion SLERP is complex due to non-associativity)
        
        const result = new SedenionMemoryField();
        for (let k = 0; k < 16; k++) {
            result.s[k] = (1 - t) * this.s[k] + t * other.s[k];
        }
        return result.normalize();
    }
    
    /**
     * Coupling function Γ from equation (10)
     * Updates SMF from prime-mode activity
     * 
     * s(t + Δt) = Norm((1 - η) * s(t) + η * Γ({αp, φp, Ap}))
     * 
     * @param {Object} primeState - Prime state with amplitudes
     * @param {Array} oscillators - Array of oscillator states {prime, phase, amplitude}
     * @param {Object} options - Configuration options
     */
    updateFromPrimeActivity(primeState, oscillators, options = {}) {
        const eta = options.couplingRate || 0.1;
        const delta = this.computeAxisDeltas(primeState, oscillators, options);
        
        for (let k = 0; k < 16; k++) {
            this.s[k] = (1 - eta) * this.s[k] + eta * delta[k];
        }
        this.normalize();
        
        return this;
    }
    
    /**
     * Compute axis deltas from prime activity
     * Maps semantic activity to SMF axis updates
     * 
     * @param {Object} primeState - Prime state with amplitudes
     * @param {Array} oscillators - Array of oscillators
     * @param {Object} options - Configuration
     */
    computeAxisDeltas(primeState, oscillators, options = {}) {
        const delta = new Float64Array(16);
        
        // Default: maintain current orientation with slight drift toward coherence
        delta[0] = 0.1; // Base coherence maintenance
        
        if (!oscillators || oscillators.length === 0) {
            return delta;
        }
        
        // Compute oscillator statistics
        let totalAmplitude = 0;
        let phaseCoherence = 0;
        let amplitudeVariance = 0;
        let activeCount = 0;
        
        const amplitudes = oscillators.map(o => o.amplitude || 0);
        const phases = oscillators.map(o => o.phase || 0);
        
        const meanAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
        
        for (let i = 0; i < oscillators.length; i++) {
            totalAmplitude += amplitudes[i];
            if (amplitudes[i] > 0.1) activeCount++;
            amplitudeVariance += (amplitudes[i] - meanAmplitude) ** 2;
        }
        amplitudeVariance /= amplitudes.length;
        
        // Phase coherence (Kuramoto order parameter)
        let realSum = 0, imagSum = 0;
        for (let i = 0; i < phases.length; i++) {
            if (amplitudes[i] > 0.1) {
                realSum += Math.cos(phases[i]);
                imagSum += Math.sin(phases[i]);
            }
        }
        if (activeCount > 0) {
            phaseCoherence = Math.sqrt(realSum ** 2 + imagSum ** 2) / activeCount;
        }
        
        // Map to SMF axes based on activity patterns
        
        // Axis 0 (coherence): High phase synchronization
        delta[0] = phaseCoherence * 0.3;
        
        // Axis 1 (identity): Stable amplitude pattern
        delta[1] = Math.max(0, 0.2 - amplitudeVariance * 0.5);
        
        // Axis 2 (duality): High variance (opposing forces)
        delta[2] = amplitudeVariance * 0.2;
        
        // Axis 3 (structure): Many active oscillators
        delta[3] = Math.min(0.3, activeCount / oscillators.length * 0.3);
        
        // Axis 4 (change): Recent amplitude changes (TODO: track history)
        delta[4] = amplitudeVariance * 0.1;
        
        // Axis 5 (life): Total energy (amplitude)
        delta[5] = Math.min(0.3, totalAmplitude * 0.05);
        
        // Axis 6 (harmony): High coherence + structure
        delta[6] = (phaseCoherence + delta[3]) * 0.15;
        
        // Axis 7 (wisdom): Low entropy state (concentrated)
        if (primeState && typeof primeState.entropy === 'function') {
            const entropy = primeState.entropy();
            delta[7] = Math.max(0, 0.3 - entropy * 0.1);
        }
        
        // Axis 8 (infinity): Very high coherence
        delta[8] = phaseCoherence > 0.9 ? 0.2 : 0;
        
        // Axis 9 (creation): New oscillators excited (TODO: track history)
        delta[9] = 0.05;
        
        // Axis 10 (truth): Stable, high coherence
        delta[10] = phaseCoherence > 0.7 && amplitudeVariance < 0.1 ? 0.2 : 0;
        
        // Axis 11 (love): Sustained alignment (TODO: track history)
        delta[11] = phaseCoherence * 0.1;
        
        // Axis 12 (power): High total amplitude
        delta[12] = totalAmplitude > oscillators.length * 0.5 ? 0.2 : 0.05;
        
        // Axis 13 (time): Based on phase progression (TODO: track)
        delta[13] = 0.05;
        
        // Axis 14 (space): Distribution across oscillators
        delta[14] = Math.min(0.2, activeCount / 16 * 0.2);
        
        // Axis 15 (consciousness): Combination of coherence, identity, wisdom
        delta[15] = (delta[0] + delta[1] + delta[7]) * 0.2;
        
        return delta;
    }
    
    /**
     * Get dominant axes (highest absolute values)
     * @param {number} n - Number of axes to return
     */
    dominantAxes(n = 3) {
        const indexed = this.s.map((v, i) => ({ 
            index: i, 
            name: SMF_AXES[i].name,
            value: v,
            absValue: Math.abs(v)
        }));
        
        indexed.sort((a, b) => b.absValue - a.absValue);
        return indexed.slice(0, n);
    }
    
    /**
     * Coherence with another SMF (cosine similarity)
     */
    coherence(other) {
        const d = this.dot(other);
        const n1 = this.norm();
        const n2 = other.norm();
        return (n1 > 1e-10 && n2 > 1e-10) ? d / (n1 * n2) : 0;
    }
    
    /**
     * Clone this SMF
     */
    clone() {
        return new SedenionMemoryField(Float64Array.from(this.s));
    }
    
    /**
     * Convert to array
     */
    toArray() {
        return [...this.s];
    }
    
    /**
     * Convert to object with named axes
     */
    toObject() {
        const obj = {};
        for (let k = 0; k < 16; k++) {
            obj[SMF_AXES[k].name] = this.s[k];
        }
        return obj;
    }
    
    /**
     * Create from object with named axes
     */
    static fromObject(obj) {
        const smf = new SedenionMemoryField();
        smf.s.fill(0);
        for (const [name, value] of Object.entries(obj)) {
            const idx = AXIS_INDEX[name];
            if (idx !== undefined) {
                smf.s[idx] = value;
            }
        }
        return smf.normalize();
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            axes: this.toObject(),
            norm: this.norm(),
            entropy: this.entropy(),
            dominant: this.dominantAxes(3).map(a => a.name)
        };
    }
    
    /**
     * String representation
     */
    toString() {
        const dominant = this.dominantAxes(3);
        const parts = dominant.map(a => `${a.name}:${a.value.toFixed(3)}`);
        return `SMF(${parts.join(', ')})`;
    }
}

module.exports = {
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX
};