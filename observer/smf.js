
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
 * - SparsePrimeState integration for prime-based SMF construction
 * - hamiltonCompose for non-commutative quaternionic composition
 * - Quaternion extraction from SMF orientation
 * 
 * Browser-compatible: No Node.js dependencies
 */

import { Hypercomplex } from '../core/hypercomplex.js';
import { multiplyIndices } from '../core/fano.js';

// ============================================================================
// CODEBOOK TUNNELING (from discrete.pdf Section 5)
// 64-attractor codebook for controlled semantic transitions
// ============================================================================

/**
 * 64-attractor codebook for SMF tunneling
 * From discrete.pdf: Each attractor is a canonical SMF orientation
 * representing a stable semantic state.
 *
 * The codebook is organized as:
 * - 16 primary attractors (single dominant axis)
 * - 48 secondary attractors (axis pairs)
 *
 * This enables discrete jumps between semantic states via
 * controlled tunneling rather than continuous drift.
 */
const CODEBOOK_SIZE = 64;

// Generate primary attractors (16 single-axis states)
function generatePrimaryAttractors() {
    const attractors = [];
    for (let i = 0; i < 16; i++) {
        const s = new Float64Array(16);
        s[i] = 1.0;
        attractors.push({ id: i, type: 'primary', axes: [i], state: s });
    }
    return attractors;
}

// Generate secondary attractors (48 axis-pair states)
function generateSecondaryAttractors() {
    const attractors = [];
    let id = 16;
    
    // Generate pairs with specific semantic relationships
    // Domain-internal pairs (same domain, axes differ by 1)
    const domains = [
        [0, 1, 2, 3],   // perceptual
        [4, 5, 6, 7],   // cognitive
        [8, 9, 10, 11], // temporal
        [12, 13, 14, 15] // meta
    ];
    
    for (const domain of domains) {
        for (let i = 0; i < domain.length; i++) {
            for (let j = i + 1; j < domain.length; j++) {
                const s = new Float64Array(16);
                s[domain[i]] = Math.SQRT1_2;
                s[domain[j]] = Math.SQRT1_2;
                attractors.push({
                    id: id++,
                    type: 'secondary',
                    axes: [domain[i], domain[j]],
                    state: s
                });
            }
        }
    }
    
    // Cross-domain pairs (adjacent domains)
    const crossPairs = [
        [0, 4], [1, 5], [2, 6], [3, 7],   // perceptual-cognitive
        [4, 8], [5, 9], [6, 10], [7, 11], // cognitive-temporal
        [8, 12], [9, 13], [10, 14], [11, 15], // temporal-meta
        [0, 12], [1, 13], [2, 14], [3, 15]   // perceptual-meta (wrap)
    ];
    
    for (const [a, b] of crossPairs) {
        const s = new Float64Array(16);
        s[a] = Math.SQRT1_2;
        s[b] = Math.SQRT1_2;
        attractors.push({
            id: id++,
            type: 'cross-domain',
            axes: [a, b],
            state: s
        });
        if (attractors.length >= 48) break;
    }
    
    return attractors.slice(0, 48);
}

// Pre-generate the codebook
const SMF_CODEBOOK = [
    ...generatePrimaryAttractors(),
    ...generateSecondaryAttractors()
];

/**
 * Find nearest codebook attractor to an SMF state
 * From discrete.pdf: nearestCodebook(s) = argmax_k(s · c_k)
 *
 * @param {Float64Array|Array} smfState - Current SMF state (16 components)
 * @returns {Object} Nearest attractor with distance metrics
 */
function nearestCodebookAttractor(smfState) {
    let maxDot = -Infinity;
    let bestAttractor = null;
    let bestIdx = -1;
    
    const s = smfState.s || smfState;
    
    for (let k = 0; k < SMF_CODEBOOK.length; k++) {
        const attractor = SMF_CODEBOOK[k];
        let dot = 0;
        for (let i = 0; i < 16; i++) {
            dot += (s[i] || 0) * attractor.state[i];
        }
        
        if (dot > maxDot) {
            maxDot = dot;
            bestAttractor = attractor;
            bestIdx = k;
        }
    }
    
    // Compute distance (1 - cosine similarity for unit vectors)
    const distance = 1 - maxDot;
    
    return {
        attractor: bestAttractor,
        index: bestIdx,
        similarity: maxDot,
        distance,
        axes: bestAttractor?.axes || [],
        type: bestAttractor?.type || 'unknown'
    };
}

/**
 * Controlled tunneling between codebook attractors
 * From discrete.pdf: Discrete jump with gate condition
 *
 * @param {Float64Array|Array} smfState - Current SMF state
 * @param {number} targetIdx - Target attractor index
 * @param {number} mixFactor - Interpolation factor [0, 1]
 * @returns {Float64Array} New SMF state after tunneling
 */
function codebookTunnel(smfState, targetIdx, mixFactor = 1.0) {
    if (targetIdx < 0 || targetIdx >= SMF_CODEBOOK.length) {
        throw new Error(`Invalid codebook index: ${targetIdx}`);
    }
    
    const s = smfState.s || smfState;
    const target = SMF_CODEBOOK[targetIdx].state;
    const result = new Float64Array(16);
    
    // Interpolate between current state and target attractor
    for (let i = 0; i < 16; i++) {
        result[i] = (1 - mixFactor) * (s[i] || 0) + mixFactor * target[i];
    }
    
    // Normalize
    let norm = 0;
    for (let i = 0; i < 16; i++) {
        norm += result[i] * result[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 1e-10) {
        for (let i = 0; i < 16; i++) {
            result[i] /= norm;
        }
    }
    
    return result;
}

/**
 * Get tunneling candidates based on semantic similarity
 * Returns attractors within a given distance threshold
 *
 * @param {Float64Array|Array} smfState - Current SMF state
 * @param {number} maxDistance - Maximum distance threshold
 * @returns {Array} Array of candidate attractors with distances
 */
function getTunnelingCandidates(smfState, maxDistance = 0.5) {
    const s = smfState.s || smfState;
    const candidates = [];
    
    for (let k = 0; k < SMF_CODEBOOK.length; k++) {
        const attractor = SMF_CODEBOOK[k];
        let dot = 0;
        for (let i = 0; i < 16; i++) {
            dot += (s[i] || 0) * attractor.state[i];
        }
        
        const distance = 1 - dot;
        if (distance <= maxDistance && distance > 0.01) { // Exclude current attractor
            candidates.push({
                index: k,
                attractor,
                similarity: dot,
                distance,
                axes: attractor.axes,
                type: attractor.type
            });
        }
    }
    
    return candidates.sort((a, b) => a.distance - b.distance);
}

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
     * Create SMF from SparsePrimeState
     * Derives quaternion orientation from complex amplitudes of active primes
     *
     * @param {Object} sparseState - Sparse prime state with complex amplitudes
     * @param {Object} options - Mapping options
     */
    static fromSparsePrimeState(sparseState, options = {}) {
        const smf = new SedenionMemoryField();
        smf.s.fill(0);
        
        const primes = sparseState.getActivePrimes ? sparseState.getActivePrimes() : [];
        
        if (!primes || primes.length === 0) {
            smf.s[0] = 1.0; // Default to coherence
            return smf;
        }
        
        // Collect amplitude and phase information
        const amplitudes = [];
        const phases = [];
        let totalMag = 0;
        
        for (const prime of primes) {
            const amp = sparseState.get(prime);
            if (amp) {
                const mag = Math.sqrt(amp.re * amp.re + amp.im * amp.im);
                const phase = Math.atan2(amp.im, amp.re);
                amplitudes.push(mag);
                phases.push(phase);
                totalMag += mag;
            }
        }
        
        if (amplitudes.length === 0) {
            smf.s[0] = 1.0;
            return smf;
        }
        
        // Compute phase statistics
        let phaseX = 0, phaseY = 0;
        for (let i = 0; i < phases.length; i++) {
            const weight = amplitudes[i] / (totalMag || 1);
            phaseX += Math.cos(phases[i]) * weight;
            phaseY += Math.sin(phases[i]) * weight;
        }
        const avgPhase = Math.atan2(phaseY, phaseX);
        const phaseCoherence = Math.sqrt(phaseX * phaseX + phaseY * phaseY);
        
        // Compute phase variance
        let phaseVariance = 0;
        for (let i = 0; i < phases.length; i++) {
            let diff = phases[i] - avgPhase;
            // Wrap to [-π, π]
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            phaseVariance += diff * diff * amplitudes[i] / (totalMag || 1);
        }
        
        // Construct quaternion from phase statistics
        const aggQ = {
            w: phaseCoherence,
            x: Math.cos(avgPhase) * (1 - phaseVariance / Math.PI),
            y: Math.sin(avgPhase) * (1 - phaseVariance / Math.PI),
            z: Math.sqrt(phaseVariance) / Math.PI
        };
        
        // Normalize quaternion
        const qNorm = Math.sqrt(aggQ.w * aggQ.w + aggQ.x * aggQ.x + aggQ.y * aggQ.y + aggQ.z * aggQ.z);
        if (qNorm > 1e-10) {
            aggQ.w /= qNorm;
            aggQ.x /= qNorm;
            aggQ.y /= qNorm;
            aggQ.z /= qNorm;
        } else {
            aggQ.w = 1;
            aggQ.x = aggQ.y = aggQ.z = 0;
        }
        
        // Map quaternion components to first 4 SMF axes
        smf.s[0] = aggQ.w; // coherence
        smf.s[1] = aggQ.x; // identity
        smf.s[2] = aggQ.y; // duality
        smf.s[3] = aggQ.z; // structure
        
        // Derive higher axes
        const rotationAngle = 2 * Math.acos(Math.max(-1, Math.min(1, aggQ.w)));
        smf.s[4] = rotationAngle / Math.PI;
        
        const avgAmp = totalMag / primes.length;
        smf.s[5] = Math.min(1, avgAmp);
        smf.s[6] = phaseCoherence;
        smf.s[7] = Math.min(1, primes.length / 16);
        
        const entropy = sparseState.entropy ? sparseState.entropy() : 0;
        smf.s[8] = Math.exp(-entropy);
        smf.s[15] = (smf.s[0] + smf.s[6] + smf.s[7]) / 3;
        
        return smf.normalize();
    }
    
    /**
     * Convert to Hypercomplex
     */
    toHypercomplex() {
        return new Hypercomplex(16, Float64Array.from(this.s));
    }
    
    /**
     * Get axis value by name or index
     */
    get(axis) {
        const idx = typeof axis === 'string' ? AXIS_INDEX[axis] : axis;
        return this.s[idx];
    }
    
    /**
     * Set axis value by name or index
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
     * Normalize to unit magnitude
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
     * Compute SMF entropy
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
     * Alias for entropy
     */
    smfEntropy(epsilon = 1e-10) {
        return this.entropy(epsilon);
    }
    
    /**
     * Non-associative sedenion multiplication
     */
    multiply(other) {
        const result = new SedenionMemoryField();
        result.s.fill(0);
        
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                const [k, sign] = multiplyIndices(16, i, j);
                result.s[k] += sign * this.s[i] * other.s[j];
            }
        }
        
        return result;
    }
    
    /**
     * Quaternionic composition using Hamilton product
     */
    quaternionCompose(other, options = {}) {
        const propagationFactor = options.propagation ?? 0.5;
        
        const qThis = this.extractQuaternion();
        const qOther = other.extractQuaternion();
        
        const composedQ = {
            w: qThis.w * qOther.w - qThis.x * qOther.x - qThis.y * qOther.y - qThis.z * qOther.z,
            x: qThis.w * qOther.x + qThis.x * qOther.w + qThis.y * qOther.z - qThis.z * qOther.y,
            y: qThis.w * qOther.y - qThis.x * qOther.z + qThis.y * qOther.w + qThis.z * qOther.x,
            z: qThis.w * qOther.z + qThis.x * qOther.y - qThis.y * qOther.x + qThis.z * qOther.w
        };
        
        const qNorm = Math.sqrt(composedQ.w ** 2 + composedQ.x ** 2 + composedQ.y ** 2 + composedQ.z ** 2);
        if (qNorm > 1e-10) {
            composedQ.w /= qNorm;
            composedQ.x /= qNorm;
            composedQ.y /= qNorm;
            composedQ.z /= qNorm;
        }
        
        const result = new SedenionMemoryField();
        
        result.s[0] = composedQ.w;
        result.s[1] = composedQ.x;
        result.s[2] = composedQ.y;
        result.s[3] = composedQ.z;
        
        for (let k = 4; k < 16; k++) {
            const original = 0.5 * (this.s[k] + other.s[k]);
            const qInfluence = (composedQ.w + 1) * 0.25;
            result.s[k] = original * (1 - propagationFactor) + original * qInfluence * propagationFactor;
        }
        
        return result.normalize();
    }
    
    /**
     * Extract quaternion subspace from SMF
     */
    extractQuaternion() {
        const w = this.s[0];
        const x = this.s[1];
        const y = this.s[2];
        const z = this.s[3];
        
        const norm = Math.sqrt(w * w + x * x + y * y + z * z);
        
        if (norm < 1e-10) {
            return { w: 1, x: 0, y: 0, z: 0 };
        }
        
        return {
            w: w / norm,
            x: x / norm,
            y: y / norm,
            z: z / norm
        };
    }
    
    /**
     * Set quaternion subspace
     */
    setQuaternion(q, normalizeAfter = true) {
        this.s[0] = q.w;
        this.s[1] = q.x;
        this.s[2] = q.y;
        this.s[3] = q.z;
        
        if (normalizeAfter) {
            this.normalize();
        }
        return this;
    }
    
    /**
     * Order-sensitive sequential composition
     */
    static sequentialCompose(smfs, options = {}) {
        if (!smfs || smfs.length === 0) {
            return new SedenionMemoryField();
        }
        
        if (smfs.length === 1) {
            return smfs[0].clone();
        }
        
        let result = smfs[0].clone();
        for (let i = 1; i < smfs.length; i++) {
            result = result.quaternionCompose(smfs[i], options);
        }
        
        return result;
    }
    
    /**
     * Compute non-commutativity measure with another SMF
     */
    nonCommutativity(other) {
        const ab = this.quaternionCompose(other);
        const ba = other.quaternionCompose(this);
        
        const qAB = ab.extractQuaternion();
        const qBA = ba.extractQuaternion();
        
        const diffW = qAB.w - qBA.w;
        const diffX = qAB.x - qBA.x;
        const diffY = qAB.y - qBA.y;
        const diffZ = qAB.z - qBA.z;
        
        const magnitude = Math.sqrt(diffW * diffW + diffX * diffX + diffY * diffY + diffZ * diffZ);
        
        let fullDiff = 0;
        for (let k = 0; k < 16; k++) {
            const d = ab.s[k] - ba.s[k];
            fullDiff += d * d;
        }
        fullDiff = Math.sqrt(fullDiff);
        
        return {
            quaternionDifference: magnitude,
            fullDifference: fullDiff,
            isCommutative: magnitude < 0.01,
            axis: magnitude > 0.01 ? {
                x: diffX / magnitude,
                y: diffY / magnitude,
                z: diffZ / magnitude
            } : null
        };
    }
    
    /**
     * Sedenion conjugate
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
     * Sedenion inverse
     */
    inverse() {
        const n2 = this.dot(this);
        if (n2 < 1e-10) {
            return null;
        }
        const conj = this.conjugate();
        const result = new SedenionMemoryField();
        for (let k = 0; k < 16; k++) {
            result.s[k] = conj.s[k] / n2;
        }
        return result;
    }
    
    /**
     * Dot product
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
     * Check for zero-divisor tunneling opportunities
     */
    canTunnelTo(other, threshold = 0.01) {
        const myNorm = this.norm();
        const otherNorm = other.norm();
        
        if (myNorm < 0.1 || otherNorm < 0.1) {
            return false;
        }
        
        const product = this.multiply(other);
        return product.norm() < threshold;
    }
    
    /**
     * SLERP interpolation
     */
    slerp(other, t) {
        const result = new SedenionMemoryField();
        for (let k = 0; k < 16; k++) {
            result.s[k] = (1 - t) * this.s[k] + t * other.s[k];
        }
        return result.normalize();
    }
    
    /**
     * Update SMF from prime-mode activity
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
     */
    computeAxisDeltas(primeState, oscillators, options = {}) {
        const delta = new Float64Array(16);
        delta[0] = 0.1;
        
        if (!oscillators || oscillators.length === 0) {
            return delta;
        }
        
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
        
        delta[0] = phaseCoherence * 0.3;
        delta[1] = Math.max(0, 0.2 - amplitudeVariance * 0.5);
        delta[2] = amplitudeVariance * 0.2;
        delta[3] = Math.min(0.3, activeCount / oscillators.length * 0.3);
        delta[4] = amplitudeVariance * 0.1;
        delta[5] = Math.min(0.3, totalAmplitude * 0.05);
        delta[6] = (phaseCoherence + delta[3]) * 0.15;
        
        if (primeState && typeof primeState.entropy === 'function') {
            const entropy = primeState.entropy();
            delta[7] = Math.max(0, 0.3 - entropy * 0.1);
        }
        
        delta[8] = phaseCoherence > 0.9 ? 0.2 : 0;
        delta[9] = 0.05;
        delta[10] = phaseCoherence > 0.7 && amplitudeVariance < 0.1 ? 0.2 : 0;
        delta[11] = phaseCoherence * 0.1;
        delta[12] = totalAmplitude > oscillators.length * 0.5 ? 0.2 : 0.05;
        delta[13] = 0.05;
        delta[14] = Math.min(0.2, activeCount / 16 * 0.2);
        delta[15] = (delta[0] + delta[1] + delta[7]) * 0.2;
        
        return delta;
    }
    
    /**
     * Get dominant axes (highest absolute values)
     */
    dominantAxes(n = 3) {
        const indexed = [];
        for (let i = 0; i < 16; i++) {
            indexed.push({
                index: i,
                name: SMF_AXES[i].name,
                value: this.s[i],
                absValue: Math.abs(this.s[i])
            });
        }
        
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
        const parts = dominant.map(a => `${a.name}:${(a.value ?? 0).toFixed(3)}`);
        return `SMF(${parts.join(', ')})`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CODEBOOK TUNNELING
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Find nearest codebook attractor to current state
     */
    nearestCodebook() {
        return nearestCodebookAttractor(this.s);
    }
    
    /**
     * Tunnel to a specific codebook attractor
     */
    tunnelTo(targetIdx, mixFactor = 1.0) {
        this.s = codebookTunnel(this.s, targetIdx, mixFactor);
        return this;
    }
    
    /**
     * Get available tunneling destinations
     */
    getTunnelingOptions(maxDistance = 0.5) {
        return getTunnelingCandidates(this.s, maxDistance);
    }
    
    /**
     * Tunnel to nearest attractor (collapse to discrete state)
     */
    collapseToNearest(mixFactor = 1.0) {
        const nearest = this.nearestCodebook();
        const beforeEntropy = this.entropy();
        
        this.tunnelTo(nearest.index, mixFactor);
        
        const afterEntropy = this.entropy();
        
        return {
            attractor: nearest.attractor,
            index: nearest.index,
            priorDistance: nearest.distance,
            entropyChange: afterEntropy - beforeEntropy,
            axes: nearest.axes,
            type: nearest.type
        };
    }
    
    /**
     * Check if current state is near a codebook attractor
     */
    isNearAttractor(threshold = 0.1) {
        const nearest = this.nearestCodebook();
        return nearest.distance <= threshold;
    }
    
    /**
     * Get codebook state information
     */
    getCodebookState() {
        const nearest = this.nearestCodebook();
        const candidates = this.getTunnelingOptions(0.5);
        
        return {
            nearestAttractor: nearest.index,
            nearestType: nearest.type,
            nearestAxes: nearest.axes,
            nearestDistance: nearest.distance,
            nearestSimilarity: nearest.similarity,
            isCollapsed: nearest.distance < 0.1,
            tunnelingOptions: candidates.length,
            topCandidates: candidates.slice(0, 5).map(c => ({
                index: c.index,
                type: c.type,
                axes: c.axes,
                distance: c.distance
            }))
        };
    }
}

export {
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX,
    SMF_CODEBOOK,
    CODEBOOK_SIZE,
    nearestCodebookAttractor,
    codebookTunnel,
    getTunnelingCandidates
};

export default {
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX,
    SMF_CODEBOOK,
    CODEBOOK_SIZE,
    nearestCodebookAttractor,
    codebookTunnel,
    getTunnelingCandidates
};
        