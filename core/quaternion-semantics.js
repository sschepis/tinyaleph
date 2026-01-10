/**
 * Quaternionic Semantic Embedding (PIQC.pdf §3)
 *
 * Prime-indexed quaternionic semantics for directional meaning:
 * - Ψ(p) = cos(h(p)) + u(p)sin(h(p)) prime-to-quaternion mapping
 * - Q(A(p1)...N(q)) = Ψ(p1) ⊗ ... ⊗ Ψ(q) chain composition
 * - Configurable axis mapping based on prime number-theoretic properties
 *
 * The semantic axes are NOT hardcoded with meanings. Instead, the axes
 * emerge from the prime's number-theoretic properties:
 * - Quadratic residue character (mod 4, mod 8)
 * - Position in prime sequence
 * - Relationship to golden ratio φ
 *
 * Meaning emerges from the geometric relationships between primes,
 * not from predetermined labels.
 */

const { isPrime, twistAngle, nthPrime } = require('./prime');

// ============================================================================
// AXIS MAPPING STRATEGIES
// ============================================================================

/**
 * Golden ratio for axis distribution
 */
const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Base class for axis mapping strategies
 */
class AxisMapper {
    /**
     * Map a prime to an axis vector {i, j, k}
     * @param {number} p - Prime number
     * @returns {{i: number, j: number, k: number}} Unit vector
     */
    map(p) {
        throw new Error('Subclass must implement map()');
    }
}

/**
 * Modular axis mapper - uses quadratic residue properties
 *
 * Maps primes to axes based on their behavior mod small numbers:
 * - p mod 4 determines i-component sign
 * - p mod 8 determines j-component weight
 * - p mod 6 determines k-component weight
 *
 * This is purely number-theoretic with no semantic labels.
 */
class ModularAxisMapper extends AxisMapper {
    map(p) {
        // Use quadratic residue character for i-axis
        // p ≡ 1 (mod 4) means p = a² + b² (sum of two squares)
        const mod4 = p % 4;
        const i = mod4 === 1 ? 1 : mod4 === 3 ? -1 : 0;
        
        // Use mod 8 for j-axis (determines if p = a² + 2b²)
        const mod8 = p % 8;
        const j = (mod8 === 1 || mod8 === 3) ? 1 : (mod8 === 5 || mod8 === 7) ? -1 : 0;
        
        // Use mod 6 for k-axis (relates to cubic residues)
        const mod6 = p % 6;
        const k = mod6 === 1 ? 1 : mod6 === 5 ? -1 : 0;
        
        // Normalize to unit vector
        const len = Math.sqrt(i*i + j*j + k*k);
        if (len < 1e-10) {
            // p = 2 or p = 3: return special axis
            return p === 2 ? { i: 1, j: 0, k: 0 } : { i: 0, j: 1, k: 0 };
        }
        
        return { i: i/len, j: j/len, k: k/len };
    }
}

/**
 * Golden ratio axis mapper - uses golden angle distribution
 *
 * Maps each prime to a point on the unit sphere using the golden angle,
 * creating maximally uniform distribution (like sunflower seeds).
 */
class GoldenAxisMapper extends AxisMapper {
    constructor() {
        super();
        this.primeIndex = new Map();
        this.currentIndex = 0;
    }
    
    map(p) {
        // Get or assign index for this prime
        if (!this.primeIndex.has(p)) {
            this.primeIndex.set(p, this.currentIndex++);
        }
        const n = this.primeIndex.get(p);
        
        // Golden angle in radians
        const goldenAngle = 2 * Math.PI / (PHI * PHI);
        
        // Spherical coordinates using golden ratio
        const theta = goldenAngle * n;
        const phi = Math.acos(1 - 2 * (n + 0.5) / (this.currentIndex + 1));
        
        return {
            i: Math.sin(phi) * Math.cos(theta),
            j: Math.sin(phi) * Math.sin(theta),
            k: Math.cos(phi)
        };
    }
}

/**
 * Twist angle axis mapper - uses κ(p) = 360°/p to distribute axes
 *
 * The twist angle naturally encodes the prime's "rotation frequency"
 * and creates a geometrically meaningful distribution.
 */
class TwistAxisMapper extends AxisMapper {
    map(p) {
        // Use twist angle for spherical position
        const kappa = twistAngle(p) * Math.PI / 180;  // to radians
        
        // Use log(p) for elevation angle (larger primes → lower elevation)
        const elevation = Math.PI / 2 * (1 - Math.log(p) / Math.log(1000));
        
        return {
            i: Math.cos(kappa) * Math.cos(elevation),
            j: Math.sin(kappa) * Math.cos(elevation),
            k: Math.sin(elevation)
        };
    }
}

/**
 * Custom axis mapper - user provides the mapping function
 */
class CustomAxisMapper extends AxisMapper {
    constructor(mapFn) {
        super();
        this.mapFn = mapFn;
    }
    
    map(p) {
        const axis = this.mapFn(p);
        // Normalize
        const len = Math.sqrt(axis.i ** 2 + axis.j ** 2 + axis.k ** 2);
        if (len < 1e-10) return { i: 1, j: 0, k: 0 };
        return { i: axis.i / len, j: axis.j / len, k: axis.k / len };
    }
}

// Default mapper uses modular arithmetic (purely number-theoretic)
let defaultMapper = new ModularAxisMapper();

/**
 * Get the current axis mapper
 */
function getAxisMapper() {
    return defaultMapper;
}

/**
 * Set a new axis mapper
 * @param {AxisMapper} mapper - New mapper to use
 */
function setAxisMapper(mapper) {
    if (!(mapper instanceof AxisMapper)) {
        throw new TypeError('Mapper must be instance of AxisMapper');
    }
    defaultMapper = mapper;
}

/**
 * Prime → axis mapping using current mapper
 * @param {number} p - Prime number
 * @returns {{i: number, j: number, k: number}} Unit axis vector
 */
function primeToAxis(p) {
    return defaultMapper.map(p);
}

// ============================================================================
// UNIT QUATERNION CLASS
// ============================================================================

/**
 * UnitQuaternion - Quaternion with unit norm for rotations
 * q = a + bi + cj + dk where |q| = 1
 */
class UnitQuaternion {
    constructor(a = 1, b = 0, c = 0, d = 0) {
        this.a = a;  // Real/scalar part
        this.b = b;  // i component
        this.c = c;  // j component
        this.d = d;  // k component
    }
    
    /**
     * Create unit quaternion from angle-axis representation
     * q = cos(θ/2) + sin(θ/2)(xi + yj + zk)
     * 
     * @param {number} theta - Rotation angle in radians
     * @param {Object} axis - Axis vector {i, j, k}
     */
    static fromAxisAngle(theta, axis) {
        const halfTheta = theta / 2;
        const sinHalf = Math.sin(halfTheta);
        const cosHalf = Math.cos(halfTheta);
        
        // Normalize axis
        const len = Math.sqrt(axis.i ** 2 + axis.j ** 2 + axis.k ** 2);
        const norm = len > 1e-10 ? len : 1;
        
        return new UnitQuaternion(
            cosHalf,
            sinHalf * axis.i / norm,
            sinHalf * axis.j / norm,
            sinHalf * axis.k / norm
        );
    }
    
    /**
     * Create identity quaternion (1 + 0i + 0j + 0k)
     */
    static identity() {
        return new UnitQuaternion(1, 0, 0, 0);
    }
    
    /**
     * Hamilton product: q₁ ⊗ q₂ (non-commutative!)
     */
    multiply(other) {
        return new UnitQuaternion(
            this.a * other.a - this.b * other.b - this.c * other.c - this.d * other.d,
            this.a * other.b + this.b * other.a + this.c * other.d - this.d * other.c,
            this.a * other.c - this.b * other.d + this.c * other.a + this.d * other.b,
            this.a * other.d + this.b * other.c - this.c * other.b + this.d * other.a
        );
    }
    
    /**
     * Quaternion conjugate: q* = a - bi - cj - dk
     */
    conjugate() {
        return new UnitQuaternion(this.a, -this.b, -this.c, -this.d);
    }
    
    /**
     * Quaternion norm: |q|
     */
    norm() {
        return Math.sqrt(this.a ** 2 + this.b ** 2 + this.c ** 2 + this.d ** 2);
    }
    
    /**
     * Normalize to unit quaternion
     */
    normalize() {
        const n = this.norm();
        if (n < 1e-10) return UnitQuaternion.identity();
        return new UnitQuaternion(
            this.a / n, this.b / n, this.c / n, this.d / n
        );
    }
    
    /**
     * Inner product with another quaternion
     */
    dot(other) {
        return this.a * other.a + this.b * other.b + this.c * other.c + this.d * other.d;
    }
    
    /**
     * Extract rotation angle (radians)
     */
    angle() {
        return 2 * Math.acos(Math.min(1, Math.max(-1, this.a)));
    }
    
    /**
     * Extract rotation axis
     */
    axis() {
        const sinHalf = Math.sqrt(1 - this.a * this.a);
        if (sinHalf < 1e-10) {
            return { i: 0, j: 0, k: 1 }; // Default axis
        }
        return {
            i: this.b / sinHalf,
            j: this.c / sinHalf,
            k: this.d / sinHalf
        };
    }
    
    /**
     * Spherical linear interpolation (slerp)
     */
    slerp(other, t) {
        let cosTheta = this.dot(other);
        
        // Handle negative dot product (take shorter path)
        let target = other;
        if (cosTheta < 0) {
            cosTheta = -cosTheta;
            target = new UnitQuaternion(-other.a, -other.b, -other.c, -other.d);
        }
        
        if (cosTheta > 0.9995) {
            // Linear interpolation for nearly parallel quaternions
            return new UnitQuaternion(
                this.a + t * (target.a - this.a),
                this.b + t * (target.b - this.b),
                this.c + t * (target.c - this.c),
                this.d + t * (target.d - this.d)
            ).normalize();
        }
        
        const theta = Math.acos(cosTheta);
        const sinTheta = Math.sin(theta);
        const s0 = Math.sin((1 - t) * theta) / sinTheta;
        const s1 = Math.sin(t * theta) / sinTheta;
        
        return new UnitQuaternion(
            s0 * this.a + s1 * target.a,
            s0 * this.b + s1 * target.b,
            s0 * this.c + s1 * target.c,
            s0 * this.d + s1 * target.d
        );
    }
    
    /**
     * Convert to array [a, b, c, d]
     */
    toArray() {
        return [this.a, this.b, this.c, this.d];
    }
    
    /**
     * Clone the quaternion
     */
    clone() {
        return new UnitQuaternion(this.a, this.b, this.c, this.d);
    }
    
    toString() {
        const parts = [];
        if (Math.abs(this.a) > 1e-10) parts.push(this.a.toFixed(4));
        if (Math.abs(this.b) > 1e-10) parts.push(`${this.b.toFixed(4)}i`);
        if (Math.abs(this.c) > 1e-10) parts.push(`${this.c.toFixed(4)}j`);
        if (Math.abs(this.d) > 1e-10) parts.push(`${this.d.toFixed(4)}k`);
        return parts.length > 0 ? parts.join(' + ').replace(/\+ -/g, '- ') : '0';
    }
}

// ============================================================================
// PRIME-TO-QUATERNION MAPPING Ψ(p)
// ============================================================================

/**
 * Prime-to-quaternion mapping functions
 * 
 * From PIQC §3.1:
 * Ψ(p) = cos(h(p)) + u(p)sin(h(p))
 * 
 * Where:
 * - h(p) is the half-angle function
 * - u(p) is the unit axis function
 */

/**
 * Half-angle function h(p)
 * Maps prime to rotation half-angle
 */
function halfAngle(p) {
    // Use twist angle κ(p) = 360°/p as the rotation angle
    // h(p) = κ(p)/2 in radians
    const kappaRad = (twistAngle(p) * Math.PI) / 180;
    return kappaRad / 2;
}

/**
 * Axis function u(p)
 * Maps prime to rotation axis based on semantic category
 */
function axisFunction(p) {
    return primeToAxis(p);
}

/**
 * Prime-to-quaternion map Ψ(p)
 * 
 * @param {number} p - Prime number
 * @returns {UnitQuaternion} Unit quaternion for this prime
 */
function Psi(p) {
    if (!isPrime(p)) {
        throw new Error(`Psi requires prime, got ${p}`);
    }
    
    const h = halfAngle(p);
    const u = axisFunction(p);
    
    return UnitQuaternion.fromAxisAngle(2 * h, u);
}

// ============================================================================
// QUATERNIONIC CHAIN COMPOSITION
// ============================================================================

/**
 * Compute quaternionic embedding of an operator chain
 * 
 * Q(A(p₁)...A(pₖ)N(q)) = Ψ(p₁) ⊗ ... ⊗ Ψ(pₖ) ⊗ Ψ(q)
 * 
 * @param {number[]} operatorPrimes - Array of operator primes [p₁, ..., pₖ]
 * @param {number} nounPrime - Noun prime q
 * @returns {UnitQuaternion} Composed quaternion
 */
function quaternionicChain(operatorPrimes, nounPrime) {
    // Start with identity
    let result = UnitQuaternion.identity();
    
    // Apply operators left-to-right (Hamilton product is associative)
    for (const p of operatorPrimes) {
        result = result.multiply(Psi(p));
    }
    
    // Apply noun quaternion
    result = result.multiply(Psi(nounPrime));
    
    return result;
}

/**
 * Verify non-commutativity of quaternionic composition
 * 
 * @param {number} p1 - First prime
 * @param {number} p2 - Second prime
 * @returns {Object} Comparison of Ψ(p₁)⊗Ψ(p₂) vs Ψ(p₂)⊗Ψ(p₁)
 */
function verifyNonCommutativity(p1, p2) {
    const psi1 = Psi(p1);
    const psi2 = Psi(p2);
    
    const forward = psi1.multiply(psi2);
    const backward = psi2.multiply(psi1);
    
    const difference = Math.sqrt(
        (forward.a - backward.a) ** 2 +
        (forward.b - backward.b) ** 2 +
        (forward.c - backward.c) ** 2 +
        (forward.d - backward.d) ** 2
    );
    
    return {
        p1, p2,
        forward: forward.toArray(),
        backward: backward.toArray(),
        difference,
        isCommutative: difference < 1e-10
    };
}

// ============================================================================
// SEMANTIC COHERENCE METRICS
// ============================================================================

/**
 * Compute semantic coherence between two quaternionic states
 * 
 * Coherence = |⟨q₁, q₂⟩|² = (q₁ · q₂)²
 * 
 * @param {UnitQuaternion} q1 - First quaternion
 * @param {UnitQuaternion} q2 - Second quaternion
 * @returns {number} Coherence in [0, 1]
 */
function semanticCoherence(q1, q2) {
    const dot = q1.dot(q2);
    return dot * dot;
}

/**
 * Extract axis projections from a quaternion
 *
 * Returns the normalized i, j, k components without semantic labels.
 * The meaning of these axes depends on the AxisMapper in use.
 *
 * @param {UnitQuaternion} q - Quaternion to analyze
 * @returns {Object} Projections onto i, j, k axes
 */
function axisProjections(q) {
    // The i, j, k components - meaning depends on mapper configuration
    const norm = Math.sqrt(q.b ** 2 + q.c ** 2 + q.d ** 2);
    
    return {
        i: norm > 1e-10 ? q.b / norm : 0,
        j: norm > 1e-10 ? q.c / norm : 0,
        k: norm > 1e-10 ? q.d / norm : 0,
        rotationAngle: q.angle() * 180 / Math.PI, // degrees
        purity: norm  // How much of the quaternion is "rotation" vs "identity"
    };
}

/**
 * Compute semantic distance between chains
 * 
 * @param {number[]} ops1 - First chain operators
 * @param {number} noun1 - First chain noun
 * @param {number[]} ops2 - Second chain operators
 * @param {number} noun2 - Second chain noun
 * @returns {number} Geodesic distance on quaternion sphere
 */
function chainDistance(ops1, noun1, ops2, noun2) {
    const q1 = quaternionicChain(ops1, noun1);
    const q2 = quaternionicChain(ops2, noun2);
    
    const dot = Math.abs(q1.dot(q2));
    const angle = 2 * Math.acos(Math.min(1, dot));
    
    return angle;
}

// ============================================================================
// PRIME FAMILY ANALYSIS
// ============================================================================

/**
 * Analyze quaternionic properties of a prime family
 * 
 * @param {number[]} primes - Array of primes to analyze
 * @returns {Object} Family analysis
 */
function analyzePrimeFamily(primes) {
    const quaternions = primes.map(p => ({ prime: p, psi: Psi(p) }));
    
    // Compute pairwise coherences
    const coherences = [];
    for (let i = 0; i < primes.length; i++) {
        for (let j = i + 1; j < primes.length; j++) {
            coherences.push({
                p1: primes[i],
                p2: primes[j],
                coherence: semanticCoherence(quaternions[i].psi, quaternions[j].psi)
            });
        }
    }
    
    // Find most coherent pairs
    coherences.sort((a, b) => b.coherence - a.coherence);
    
    // Compute centroid (average quaternion)
    let centroid = new UnitQuaternion(0, 0, 0, 0);
    for (const { psi } of quaternions) {
        centroid = new UnitQuaternion(
            centroid.a + psi.a,
            centroid.b + psi.b,
            centroid.c + psi.c,
            centroid.d + psi.d
        );
    }
    centroid = centroid.normalize();
    
    // Compute spread (variance around centroid)
    let spread = 0;
    for (const { psi } of quaternions) {
        const dot = psi.dot(centroid);
        spread += 1 - dot * dot;
    }
    spread /= primes.length;
    
    return {
        quaternions: quaternions.map(({ prime, psi }) => ({
            prime,
            quaternion: psi.toArray(),
            angle: psi.angle() * 180 / Math.PI,
            projections: axisProjections(psi)
        })),
        coherences: coherences.slice(0, 10),  // Top 10
        centroid: centroid.toArray(),
        spread,
        meanCoherence: coherences.reduce((s, c) => s + c.coherence, 0) / coherences.length
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Axis mapping strategies
    AxisMapper,
    ModularAxisMapper,
    GoldenAxisMapper,
    TwistAxisMapper,
    CustomAxisMapper,
    getAxisMapper,
    setAxisMapper,
    primeToAxis,
    PHI,
    
    // Unit quaternion class
    UnitQuaternion,
    
    // Prime-to-quaternion mapping
    halfAngle,
    axisFunction,
    Psi,
    
    // Chain composition
    quaternionicChain,
    verifyNonCommutativity,
    
    // Coherence metrics (no semantic labels)
    semanticCoherence,  // Keep name for compatibility but it's just quaternion coherence
    axisProjections,
    chainDistance,
    
    // Analysis
    analyzePrimeFamily
};