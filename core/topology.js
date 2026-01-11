/**
 * Topological Invariants Module
 * 
 * From 108bio.pdf - "Twist Eigenstates and Topological Morphogenesis"
 * 
 * Implements knot-theoretic invariants for deriving physical constants
 * from topological structure. The Trefoil Knot (3₁) is identified as
 * the minimal non-trivial stable structure whose complexity number
 * combined with the 108 invariant yields fundamental constants.
 * 
 * Key concepts:
 * - Knot invariants: crossing number, stick number, bridge number, unknotting number
 * - Trefoil complexity: T = s·c - b + u = 17
 * - Mass ratio derivation: 17 × 108 = 1836 (proton/electron)
 * - Fine structure constant: α⁻¹ = 108 + 29 = 137
 */

// ============================================================================
// KNOT INVARIANTS
// ============================================================================

/**
 * Knot class representing a mathematical knot with topological invariants
 */
import { TWIST_108, factorize, isPrime } from './prime.js';

class Knot {
    /**
     * Create a knot with specified invariants
     * @param {Object} invariants - Knot invariants
     * @param {number} invariants.crossings - Crossing number (c)
     * @param {number} invariants.sticks - Stick number (s) - minimum edges in polygonal representation
     * @param {number} invariants.bridge - Bridge number (b) - minimum bridges in bridge presentation
     * @param {number} invariants.unknotting - Unknotting number (u) - minimum crossing changes to unknot
     * @param {string} [invariants.name] - Knot name (e.g., "Trefoil", "Figure-8")
     * @param {string} [invariants.notation] - Alexander-Briggs notation (e.g., "3_1")
     */
    constructor(invariants) {
        this.crossings = invariants.crossings || 0;
        this.sticks = invariants.sticks || 0;
        this.bridge = invariants.bridge || 1;
        this.unknotting = invariants.unknotting || 0;
        this.name = invariants.name || 'unknown';
        this.notation = invariants.notation || '';
    }
    
    /**
     * Compute the complexity number T (equation from paper)
     * T = s·c - b + u
     * 
     * This complexity captures the topological "difficulty" of the knot
     * and is used to derive physical constants.
     * 
     * @returns {number} Complexity number
     */
    complexity() {
        return this.sticks * this.crossings - this.bridge + this.unknotting;
    }
    
    /**
     * Derive mass ratio using the 108 invariant
     * mass_ratio = complexity × 108
     * 
     * For the Trefoil: 17 × 108 = 1836 (proton/electron mass ratio)
     * 
     * @returns {number} Derived mass ratio
     */
    deriveMassRatio() {
        return this.complexity() * TWIST_108.value;
    }
    
    /**
     * Check if this knot is topologically prime
     * A prime knot cannot be decomposed as a connected sum
     * 
     * Heuristic: crossings < 10 and bridge = 2 suggests prime knot
     * @returns {boolean} True if likely prime knot
     */
    isPrimeKnot() {
        // Simple heuristic based on small crossing number
        return this.crossings <= 8 && this.bridge <= 2;
    }
    
    /**
     * Compute the genus of the knot (lower bound)
     * genus ≥ (c - b + 1) / 2
     * 
     * @returns {number} Estimated genus lower bound
     */
    genusLowerBound() {
        return Math.floor((this.crossings - this.bridge + 1) / 2);
    }
    
    /**
     * Get knot descriptor object
     */
    toJSON() {
        return {
            name: this.name,
            notation: this.notation,
            crossings: this.crossings,
            sticks: this.sticks,
            bridge: this.bridge,
            unknotting: this.unknotting,
            complexity: this.complexity(),
            massRatio: this.deriveMassRatio(),
            isPrime: this.isPrimeKnot(),
            genusLowerBound: this.genusLowerBound()
        };
    }
    
    toString() {
        return `${this.name} (${this.notation}): T=${this.complexity()}`;
    }
}

// ============================================================================
// STANDARD KNOTS
// ============================================================================

/**
 * The Unknot (trivial knot)
 */
const UNKNOT = new Knot({
    name: 'Unknot',
    notation: '0_1',
    crossings: 0,
    sticks: 3,  // Minimum for a triangle
    bridge: 1,
    unknotting: 0
});

/**
 * The Trefoil Knot (3₁) - The fundamental stable structure
 * 
 * The Trefoil is the simplest non-trivial knot and appears throughout
 * nature as the minimal stable topological configuration.
 * 
 * Invariants:
 * - Crossing number c = 3
 * - Stick number s = 6
 * - Bridge number b = 2
 * - Unknotting number u = 1
 * 
 * Complexity: T = 6·3 - 2 + 1 = 17
 * Mass ratio: 17 × 108 = 1836 (exact proton/electron mass ratio)
 */
const TREFOIL = new Knot({
    name: 'Trefoil',
    notation: '3_1',
    crossings: 3,
    sticks: 6,
    bridge: 2,
    unknotting: 1
});

/**
 * The Figure-Eight Knot (4₁)
 */
const FIGURE_EIGHT = new Knot({
    name: 'Figure-Eight',
    notation: '4_1',
    crossings: 4,
    sticks: 7,
    bridge: 2,
    unknotting: 1
});

/**
 * The Cinquefoil Knot (5₁)
 */
const CINQUEFOIL = new Knot({
    name: 'Cinquefoil',
    notation: '5_1',
    crossings: 5,
    sticks: 8,
    bridge: 2,
    unknotting: 2
});

/**
 * The Three-Twist Knot (5₂)
 */
const THREE_TWIST = new Knot({
    name: 'Three-Twist',
    notation: '5_2',
    crossings: 5,
    sticks: 8,
    bridge: 2,
    unknotting: 1
});

/**
 * Collection of standard knots
 */
const STANDARD_KNOTS = {
    unknot: UNKNOT,
    trefoil: TREFOIL,
    figureEight: FIGURE_EIGHT,
    cinquefoil: CINQUEFOIL,
    threeTwist: THREE_TWIST
};

// ============================================================================
// PHYSICAL CONSTANT DERIVATION
// ============================================================================

/**
 * PhysicalConstants class for deriving constants from topological invariants
 * 
 * The central thesis of 108bio.pdf is that physical constants are
 * topological invariants arising from twist operations in 3D space.
 */
class PhysicalConstants {
    /**
     * Derive the proton-electron mass ratio
     * Uses Trefoil complexity (17) × 108 invariant = 1836
     * 
     * Matches experimental value: m_p/m_e = 1836.15267343(11)
     * 
     * @returns {Object} Derived ratio with comparison to experimental
     */
    static protonElectronRatio() {
        const derived = TREFOIL.complexity() * TWIST_108.value;
        const experimental = 1836.15267343;
        
        return {
            derived,
            experimental,
            error: Math.abs(derived - experimental),
            relativeError: Math.abs(derived - experimental) / experimental,
            formula: `${TREFOIL.complexity()} × ${TWIST_108.value} = ${derived}`,
            interpretation: 'Trefoil complexity × 108 invariant'
        };
    }
    
    /**
     * Derive the fine structure constant inverse
     * α⁻¹ = 108 + 29 = 137
     * 
     * Where 29 is the prime sieve boundary (mod-30 pattern)
     * 
     * Matches experimental value: α⁻¹ = 137.035999084(21)
     * 
     * @returns {Object} Derived value with comparison
     */
    static fineStructureInverse() {
        const derived = TWIST_108.value + TWIST_108.mod30Boundary;
        const experimental = 137.035999084;
        
        return {
            derived,
            experimental,
            error: Math.abs(derived - experimental),
            relativeError: Math.abs(derived - experimental) / experimental,
            formula: `${TWIST_108.value} + ${TWIST_108.mod30Boundary} = ${derived}`,
            interpretation: '108 invariant + prime sieve boundary'
        };
    }
    
    /**
     * Predict Higgs boson mass
     * m_H = 5³ = 125 GeV
     * 
     * Where 5 is the first prime outside the minimal twist set {2, 3}
     * 
     * Matches experimental value: m_H = 125.25 ± 0.17 GeV
     * 
     * @returns {Object} Derived mass with comparison
     */
    static higgsMass() {
        const derived = Math.pow(5, 3);
        const experimental = 125.25;
        
        return {
            derived,
            experimental,
            unit: 'GeV',
            error: Math.abs(derived - experimental),
            relativeError: Math.abs(derived - experimental) / experimental,
            formula: '5³ = 125',
            interpretation: 'First prime outside minimal twist set, cubed'
        };
    }
    
    /**
     * Get all derived physical constants
     */
    static all() {
        return {
            protonElectronRatio: this.protonElectronRatio(),
            fineStructureInverse: this.fineStructureInverse(),
            higgsMass: this.higgsMass()
        };
    }
    
    /**
     * Validate the framework by checking error margins
     * @returns {Object} Validation results
     */
    static validate() {
        const constants = this.all();
        const results = {
            protonElectron: {
                matches: constants.protonElectronRatio.relativeError < 0.001,
                accuracy: 1 - constants.protonElectronRatio.relativeError
            },
            fineStructure: {
                matches: constants.fineStructureInverse.relativeError < 0.001,
                accuracy: 1 - constants.fineStructureInverse.relativeError
            },
            higgs: {
                matches: constants.higgsMass.relativeError < 0.01,
                accuracy: 1 - constants.higgsMass.relativeError
            }
        };
        
        results.overallValid = results.protonElectron.matches && 
                               results.fineStructure.matches && 
                               results.higgs.matches;
        
        return results;
    }
}

// ============================================================================
// OBSERVER HIERARCHY
// ============================================================================

/**
 * Observer Hierarchy from 108bio.pdf Table 1
 * 
 * Each level represents an observer differing only by scale and complexity
 * of coherence. Observation is universal and recursive.
 */
const OBSERVER_HIERARCHY = [
    {
        scale: 'Quantum',
        constituentOscillators: 'Wavefunctions',
        entropyGradient: 'Vacuum entropy',
        observableBehavior: 'Collapse of state',
        typicalComplexity: 1,
        primeRange: [2, 3, 5, 7]  // Fundamental primes
    },
    {
        scale: 'Molecular',
        constituentOscillators: 'Atomic bonds',
        entropyGradient: 'Thermal flux',
        observableBehavior: 'Chemical organization',
        typicalComplexity: 10,
        primeRange: [2, 3, 5, 7, 11, 13, 17, 19, 23]
    },
    {
        scale: 'Biological',
        constituentOscillators: 'Metabolic cycles',
        entropyGradient: 'Chemical potential',
        observableBehavior: 'Life and adaptation',
        typicalComplexity: 100,
        primeRange: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
    },
    {
        scale: 'Cognitive',
        constituentOscillators: 'Neuronal fields',
        entropyGradient: 'Sensory entropy',
        observableBehavior: 'Awareness and thought',
        typicalComplexity: 1000,
        primeRange: null  // Full prime spectrum
    },
    {
        scale: 'Planetary',
        constituentOscillators: 'Biospheric systems',
        entropyGradient: 'Solar entropy',
        observableBehavior: 'Ecological balance',
        typicalComplexity: 10000,
        primeRange: null  // Full prime spectrum
    },
    {
        scale: 'Cosmic',
        constituentOscillators: 'Field harmonics',
        entropyGradient: 'Vacuum entropy',
        observableBehavior: 'Gravitational curvature',
        typicalComplexity: 100000,
        primeRange: null  // Full prime spectrum
    }
];

/**
 * Get observer level by scale name
 * @param {string} scale - Scale name
 * @returns {Object|null} Observer level or null
 */
function getObserverLevel(scale) {
    return OBSERVER_HIERARCHY.find(h => h.scale.toLowerCase() === scale.toLowerCase()) || null;
}

/**
 * Estimate observer capacity from complexity
 * C_obs = α·N_osc·K̄·τ⁻¹
 * 
 * @param {number} oscillatorCount - Number of oscillators
 * @param {number} meanCoupling - Mean coupling strength
 * @param {number} coherenceTime - Characteristic coherence time
 * @param {number} alpha - Scaling constant (default 1.0)
 * @returns {number} Observer capacity
 */
function observerCapacity(oscillatorCount, meanCoupling, coherenceTime, alpha = 1.0) {
    if (coherenceTime <= 0) return 0;
    return alpha * oscillatorCount * meanCoupling / coherenceTime;
}

// ============================================================================
// GAUGE SYMMETRY FROM 108
// ============================================================================

/**
 * Derive gauge group structure from the 108 invariant
 * 
 * 108 = 2² × 3³ generates:
 * - 3³ → SU(3) color symmetry (ternary, 120° twist)
 * - 2² → SU(2) weak symmetry (binary, 180° twist)
 * - Full 108 → U(1) electromagnetic (360° complete rotation)
 */
class GaugeSymmetry {
    /**
     * Get the SU(3) contribution (color)
     * Generated by 3³ = 27, with 120° twist angle
     */
    static su3() {
        return {
            name: 'SU(3)',
            type: 'Color',
            generator: Math.pow(3, 3),
            twistAngle: 360 / 3,
            symmetryType: 'ternary',
            description: 'Strong force color symmetry'
        };
    }
    
    /**
     * Get the SU(2) contribution (weak)
     * Generated by 2² = 4, with 180° twist angle
     */
    static su2() {
        return {
            name: 'SU(2)',
            type: 'Weak',
            generator: Math.pow(2, 2),
            twistAngle: 360 / 2,
            symmetryType: 'binary',
            description: 'Weak force isospin symmetry'
        };
    }
    
    /**
     * Get the U(1) contribution (electromagnetic)
     * Generated by full 108, with 360° complete rotation
     */
    static u1() {
        return {
            name: 'U(1)',
            type: 'Electromagnetic',
            generator: TWIST_108.value,
            twistAngle: 360,
            symmetryType: 'unitary',
            description: 'Electromagnetic phase symmetry'
        };
    }
    
    /**
     * Get the full Standard Model gauge group
     * SU(3) × SU(2) × U(1)
     */
    static standardModel() {
        return {
            name: 'SU(3) × SU(2) × U(1)',
            components: [this.su3(), this.su2(), this.u1()],
            generator: TWIST_108.value,
            factorization: `${TWIST_108.value} = ${TWIST_108.binary} × ${TWIST_108.ternary}`,
            description: 'Complete Standard Model gauge group from 108 invariant'
        };
    }
    
    /**
     * Verify that a number exhibits the gauge structure
     * @param {number} n - Number to check
     * @returns {Object} Gauge decomposition
     */
    static decompose(n) {
        const factors = factorize(n);
        
        return {
            value: n,
            factors,
            su3Strength: Math.pow(3, factors[3] || 0),
            su2Strength: Math.pow(2, factors[2] || 0),
            u1Strength: Object.keys(factors)
                .filter(p => p !== '2' && p !== '3')
                .reduce((prod, p) => prod * Math.pow(parseInt(p), factors[p]), 1),
            is108Resonant: TWIST_108.resonates(n)
        };
    }
}

// ============================================================================
// FREE ENERGY DYNAMICS
// ============================================================================

/**
 * Free Energy Principle (FEP) dynamics from 108bio.pdf Section 4.2
 * 
 * Consciousness modeled as minimization of epistemic surprise via
 * the cubic dynamics: dψ/dt = αψ + βψ² + γψ³
 * 
 * This describes the collapse of modal superpositions into stable "now".
 */
class FreeEnergyDynamics {
    /**
     * Create FEP dynamics with specified coefficients
     * @param {number} alpha - Linear term coefficient (drift)
     * @param {number} beta - Quadratic term coefficient (bifurcation)
     * @param {number} gamma - Cubic term coefficient (stabilization)
     */
    constructor(alpha = 0.1, beta = -0.5, gamma = -0.1) {
        this.alpha = alpha;
        this.beta = beta;
        this.gamma = gamma;
    }
    
    /**
     * Compute derivative dψ/dt
     * @param {number} psi - Current state
     * @returns {number} Rate of change
     */
    derivative(psi) {
        return this.alpha * psi + this.beta * psi * psi + this.gamma * psi * psi * psi;
    }
    
    /**
     * Evolve state by one time step (Euler method)
     * @param {number} psi - Current state
     * @param {number} dt - Time step
     * @returns {number} New state
     */
    step(psi, dt = 0.01) {
        return psi + this.derivative(psi) * dt;
    }
    
    /**
     * Find fixed points of the dynamics
     * Roots of αψ + βψ² + γψ³ = 0
     * ψ(α + βψ + γψ²) = 0
     * 
     * @returns {Array<Object>} Fixed points with stability info
     */
    fixedPoints() {
        const points = [{ value: 0, stability: 'depends on α' }];
        
        // Quadratic formula for ψ² + (β/γ)ψ + (α/γ) = 0
        if (this.gamma !== 0) {
            const a = this.gamma;
            const b = this.beta;
            const c = this.alpha;
            
            const discriminant = b * b - 4 * a * c;
            
            if (discriminant >= 0) {
                const sqrtD = Math.sqrt(discriminant);
                const psi1 = (-b + sqrtD) / (2 * a);
                const psi2 = (-b - sqrtD) / (2 * a);
                
                // Stability from derivative of dψ/dt
                const stability1 = this.stabilityAt(psi1);
                const stability2 = this.stabilityAt(psi2);
                
                points.push({ value: psi1, stability: stability1 });
                points.push({ value: psi2, stability: stability2 });
            }
        }
        
        return points;
    }
    
    /**
     * Determine stability at a point
     * Stable if d(dψ/dt)/dψ < 0
     */
    stabilityAt(psi) {
        const dfdpsi = this.alpha + 2 * this.beta * psi + 3 * this.gamma * psi * psi;
        if (dfdpsi < -0.001) return 'stable';
        if (dfdpsi > 0.001) return 'unstable';
        return 'marginal';
    }
    
    /**
     * Compute potential function V(ψ) where dψ/dt = -dV/dψ
     * V = -αψ²/2 - βψ³/3 - γψ⁴/4
     */
    potential(psi) {
        return -(this.alpha * psi * psi / 2 + 
                 this.beta * psi * psi * psi / 3 + 
                 this.gamma * psi * psi * psi * psi / 4);
    }
    
    /**
     * Simulate trajectory from initial condition
     * @param {number} psi0 - Initial state
     * @param {number} duration - Simulation duration
     * @param {number} dt - Time step
     * @returns {Array<Object>} Trajectory points
     */
    simulate(psi0, duration = 10, dt = 0.01) {
        const trajectory = [];
        let psi = psi0;
        let t = 0;
        
        while (t < duration) {
            trajectory.push({ t, psi, potential: this.potential(psi) });
            psi = this.step(psi, dt);
            t += dt;
        }
        
        return trajectory;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    Knot,
    UNKNOT,
    TREFOIL,
    FIGURE_EIGHT,
    CINQUEFOIL,
    THREE_TWIST,
    STANDARD_KNOTS,
    PhysicalConstants,
    OBSERVER_HIERARCHY,
    getObserverLevel,
    observerCapacity,
    GaugeSymmetry,
    FreeEnergyDynamics
};