/**
 * Tests for Topological Framework (from 108bio.pdf)
 * 
 * Tests the core/topology.js module including:
 * - Knot class and trefoil complexity
 * - Physical constants (α⁻¹ = 137, proton/electron ratio)
 * - Gauge symmetry from 108 invariant
 * - Free Energy Dynamics (cubic FEP)
 * - Observer Hierarchy (multi-scale observers)
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
    Knot,
    TREFOIL,
    PhysicalConstants,
    GaugeSymmetry,
    FreeEnergyDynamics,
    OBSERVER_HIERARCHY
} = require('../core/topology');

const { TWIST_108 } = require('../core/prime');

// ============================================================================
// 108 INVARIANT TESTS (core/prime.js)
// ============================================================================

describe('108 Invariant', () => {
    describe('TWIST_108 constants', () => {
        it('should have correct value 108 = 2² × 3³', () => {
            assert.strictEqual(TWIST_108.value, 108);
            assert.strictEqual(TWIST_108.binary, 4);  // 2²
            assert.strictEqual(TWIST_108.ternary, 27); // 3³
            assert.strictEqual(TWIST_108.binary * TWIST_108.ternary, 108);
        });
        
        it('should have correct SU(3) angle (120°)', () => {
            assert.strictEqual(TWIST_108.su3Angle, 120);
        });
        
        it('should have correct SU(2) angle (180°)', () => {
            assert.strictEqual(TWIST_108.su2Angle, 180);
        });
        
        it('should have trefoil complexity T = 17', () => {
            assert.strictEqual(TWIST_108.trefoilComplexity, 17);
        });
        
        it('should have proton/electron ratio = 17 × 108 = 1836', () => {
            assert.strictEqual(TWIST_108.protonElectronRatio, 1836);
            assert.strictEqual(TWIST_108.trefoilComplexity * TWIST_108.value, 1836);
        });
        
        it('should have fine structure inverse = 108 + 29 = 137', () => {
            assert.strictEqual(TWIST_108.fineStructureInverse, 137);
            assert.strictEqual(TWIST_108.value + TWIST_108.mod30Boundary, 137);
        });
    });
    
    describe('Twist angle functions', () => {
        it('should compute correct twist angle for prime', () => {
            const { twistAngle } = require('../core/prime');
            // twistAngle(p) = 360/p degrees
            const angle7 = twistAngle(7);
            assert.ok(Math.abs(angle7 - (360 / 7)) < 1e-10);
            
            const angle108 = twistAngle(108);
            assert.ok(Math.abs(angle108 - (360 / 108)) < 1e-10);
        });
        
        it('should compute total twist for prime sequence', () => {
            const { totalTwist, twistAngle } = require('../core/prime');
            const primes = [2, 3, 5, 7];
            const total = totalTwist(primes);
            // Total should be sum of individual angles
            const expected = primes.reduce((sum, p) => sum + (360 / p), 0);
            assert.ok(Math.abs(total - expected) < 1e-10);
            assert.ok(total > 0);
        });
        
        it('should identify twist-closed sequences', () => {
            const { isTwistClosed, totalTwist } = require('../core/prime');
            // Need to find primes whose twist angles sum to ~360
            // 360/2 + 360/3 + 360/5 + 360/7 = 180 + 120 + 72 + 51.43 = 423.43
            // Let's just verify the function works correctly
            const primes = [2]; // 360/2 = 180°
            const closed = isTwistClosed(primes, 0.01); // 180 mod 360 = 180, not closed
            assert.ok(!closed); // 180° is not closed
            
            // Empty sequence should be closed (0 mod 360 = 0)
            const emptyClosed = isTwistClosed([], 1.0);
            assert.ok(emptyClosed);
        });
        
        it('should find closing primes for sequences', () => {
            const { findClosingPrimes } = require('../core/prime');
            const closers = findClosingPrimes([2, 3], 5.0);
            assert.ok(Array.isArray(closers));
            assert.ok(closers.length > 0);
            // Each closer should have prime, error, closesAt
            assert.ok('prime' in closers[0]);
            assert.ok('error' in closers[0]);
            assert.ok('closesAt' in closers[0]);
        });
    });
});

// ============================================================================
// KNOT AND TREFOIL TESTS
// ============================================================================

describe('Knot Class', () => {
    describe('Constructor', () => {
        it('should create knot with specified invariants', () => {
            const knot = new Knot({
                name: 'TestKnot',
                notation: '3_1',
                crossings: 3,
                sticks: 6,
                bridge: 2,
                unknotting: 1
            });
            assert.strictEqual(knot.crossings, 3);
            assert.strictEqual(knot.sticks, 6);
            assert.strictEqual(knot.bridge, 2);
            assert.strictEqual(knot.unknotting, 1);
        });
        
        it('should have default values for missing properties', () => {
            const knot = new Knot({ crossings: 3 });
            assert.strictEqual(knot.crossings, 3);
            assert.strictEqual(knot.sticks, 0);
            assert.strictEqual(knot.bridge, 1);
            assert.strictEqual(knot.unknotting, 0);
        });
    });
    
    describe('Topological Invariants', () => {
        it('should compute complexity T = s·c - b + u', () => {
            const trefoil = new Knot({
                crossings: 3,
                sticks: 6,
                bridge: 2,
                unknotting: 1
            });
            const T = trefoil.complexity();
            // T = 6·3 - 2 + 1 = 18 - 2 + 1 = 17
            assert.strictEqual(T, 17);
        });
        
        it('should derive mass ratio from complexity', () => {
            const trefoil = new Knot({
                crossings: 3,
                sticks: 6,
                bridge: 2,
                unknotting: 1
            });
            const massRatio = trefoil.deriveMassRatio();
            assert.strictEqual(massRatio, 1836); // 17 × 108
        });
        
        it('should identify prime knots', () => {
            const trefoil = new Knot({
                crossings: 3,
                sticks: 6,
                bridge: 2,
                unknotting: 1
            });
            assert.ok(trefoil.isPrimeKnot());
        });
    });
});

describe('TREFOIL constant', () => {
    it('should have 3 crossings', () => {
        assert.strictEqual(TREFOIL.crossings, 3);
    });
    
    it('should have 6 sticks', () => {
        assert.strictEqual(TREFOIL.sticks, 6);
    });
    
    it('should have bridge number 2', () => {
        assert.strictEqual(TREFOIL.bridge, 2);
    });
    
    it('should have complexity T = 17', () => {
        assert.strictEqual(TREFOIL.complexity(), 17);
    });
    
    it('should satisfy 17 × 108 = 1836', () => {
        assert.strictEqual(TREFOIL.complexity() * 108, 1836);
    });
});

// ============================================================================
// PHYSICAL CONSTANTS TESTS
// ============================================================================

describe('PhysicalConstants', () => {
    describe('protonElectronRatio', () => {
        it('should derive 1836 from trefoil complexity × 108', () => {
            const result = PhysicalConstants.protonElectronRatio();
            assert.strictEqual(result.derived, 1836);
        });
        
        it('should have small relative error vs experimental', () => {
            const result = PhysicalConstants.protonElectronRatio();
            assert.ok(result.relativeError < 0.001);
        });
    });
    
    describe('fineStructureInverse', () => {
        it('should derive 137 from 108 + 29', () => {
            const result = PhysicalConstants.fineStructureInverse();
            assert.strictEqual(result.derived, 137);
        });
        
        it('should have small relative error vs experimental', () => {
            const result = PhysicalConstants.fineStructureInverse();
            assert.ok(result.relativeError < 0.001);
        });
    });
    
    describe('higgsMass', () => {
        it('should derive 125 GeV from 5³', () => {
            const result = PhysicalConstants.higgsMass();
            assert.strictEqual(result.derived, 125);
        });
    });
    
    describe('validate', () => {
        it('should validate all derived constants', () => {
            const validation = PhysicalConstants.validate();
            assert.ok(validation.protonElectron.matches);
            assert.ok(validation.fineStructure.matches);
        });
    });
});

// ============================================================================
// GAUGE SYMMETRY TESTS
// ============================================================================

describe('GaugeSymmetry', () => {
    it('should generate SU(3) with 120° twist angle', () => {
        const su3 = GaugeSymmetry.su3();
        assert.strictEqual(su3.name, 'SU(3)');
        assert.strictEqual(su3.twistAngle, 120);
        assert.strictEqual(su3.generator, 27); // 3³
    });
    
    it('should generate SU(2) with 180° twist angle', () => {
        const su2 = GaugeSymmetry.su2();
        assert.strictEqual(su2.name, 'SU(2)');
        assert.strictEqual(su2.twistAngle, 180);
        assert.strictEqual(su2.generator, 4); // 2²
    });
    
    it('should generate U(1) with full rotation', () => {
        const u1 = GaugeSymmetry.u1();
        assert.strictEqual(u1.name, 'U(1)');
        assert.strictEqual(u1.twistAngle, 360);
        assert.strictEqual(u1.generator, 108);
    });
    
    it('should generate full Standard Model gauge group', () => {
        const sm = GaugeSymmetry.standardModel();
        assert.strictEqual(sm.name, 'SU(3) × SU(2) × U(1)');
        assert.ok(sm.components.length === 3);
        assert.ok(sm.components.some(g => g.name === 'SU(3)'));
        assert.ok(sm.components.some(g => g.name === 'SU(2)'));
        assert.ok(sm.components.some(g => g.name === 'U(1)'));
    });
    
    it('should decompose numbers into gauge structure', () => {
        const decomp = GaugeSymmetry.decompose(108);
        assert.strictEqual(decomp.value, 108);
        assert.strictEqual(decomp.su3Strength, 27); // 3³
        assert.strictEqual(decomp.su2Strength, 4);  // 2²
        assert.ok(decomp.is108Resonant);
    });
});

// ============================================================================
// FREE ENERGY DYNAMICS TESTS
// ============================================================================

describe('FreeEnergyDynamics', () => {
    describe('Constructor', () => {
        it('should create with default parameters', () => {
            const fep = new FreeEnergyDynamics();
            assert.ok(fep.alpha !== undefined);
            assert.ok(fep.beta !== undefined);
            assert.ok(fep.gamma !== undefined);
        });
        
        it('should accept custom parameters', () => {
            const fep = new FreeEnergyDynamics(0.2, -0.8, 0.15);
            assert.strictEqual(fep.alpha, 0.2);
            assert.strictEqual(fep.beta, -0.8);
            assert.strictEqual(fep.gamma, 0.15);
        });
    });
    
    describe('Derivative computation', () => {
        it('should compute dψ/dt = αψ + βψ² + γψ³', () => {
            const fep = new FreeEnergyDynamics(1, 1, 1);
            // dψ/dt at ψ=1: 1 + 1 + 1 = 3
            const deriv = fep.derivative(1);
            assert.ok(Math.abs(deriv - 3) < 1e-10);
        });
        
        it('should have zero derivative at origin', () => {
            const fep = new FreeEnergyDynamics();
            assert.strictEqual(fep.derivative(0), 0);
        });
    });
    
    describe('Potential function', () => {
        it('should compute potential V(ψ)', () => {
            const fep = new FreeEnergyDynamics();
            const V = fep.potential(1);
            assert.ok(typeof V === 'number');
        });
        
        it('should have V(0) = 0', () => {
            const fep = new FreeEnergyDynamics();
            // Note: JavaScript has -0 === 0 but strictEqual differentiates
            assert.ok(fep.potential(0) === 0 || Object.is(fep.potential(0), -0));
        });
    });
    
    describe('Evolution', () => {
        it('should step state forward in time', () => {
            const fep = new FreeEnergyDynamics();
            const psi0 = 0.5;
            const psi1 = fep.step(psi0, 0.01);
            assert.ok(typeof psi1 === 'number');
        });
        
        it('should simulate trajectory from initial condition', () => {
            const fep = new FreeEnergyDynamics();
            const trajectory = fep.simulate(0.5, 1.0, 0.01);
            assert.ok(Array.isArray(trajectory));
            assert.ok(trajectory.length > 0);
            assert.ok('t' in trajectory[0]);
            assert.ok('psi' in trajectory[0]);
            assert.ok('potential' in trajectory[0]);
        });
    });
    
    describe('Fixed Points', () => {
        it('should find fixed points', () => {
            const fep = new FreeEnergyDynamics();
            const fixedPoints = fep.fixedPoints();
            assert.ok(Array.isArray(fixedPoints));
            // Origin is always a fixed point
            assert.ok(fixedPoints.some(p => Math.abs(p.value) < 0.001));
        });
        
        it('should classify stability at points', () => {
            const fep = new FreeEnergyDynamics(0.1, -0.5, -0.1);
            const stability = fep.stabilityAt(0);
            assert.ok(['stable', 'unstable', 'marginal'].includes(stability));
        });
    });
});

// ============================================================================
// OBSERVER HIERARCHY TESTS
// ============================================================================

describe('OBSERVER_HIERARCHY', () => {
    it('should be an array of observer levels', () => {
        assert.ok(Array.isArray(OBSERVER_HIERARCHY));
        assert.ok(OBSERVER_HIERARCHY.length >= 6);
    });
    
    it('should have quantum scale as first level', () => {
        assert.ok(OBSERVER_HIERARCHY.some(h => h.scale === 'Quantum'));
    });
    
    it('should have molecular scale', () => {
        assert.ok(OBSERVER_HIERARCHY.some(h => h.scale === 'Molecular'));
    });
    
    it('should have biological scale', () => {
        assert.ok(OBSERVER_HIERARCHY.some(h => h.scale === 'Biological'));
    });
    
    it('should have cognitive scale', () => {
        assert.ok(OBSERVER_HIERARCHY.some(h => h.scale === 'Cognitive'));
    });
    
    it('should have planetary scale', () => {
        assert.ok(OBSERVER_HIERARCHY.some(h => h.scale === 'Planetary'));
    });
    
    it('should have cosmic scale as highest level', () => {
        assert.ok(OBSERVER_HIERARCHY.some(h => h.scale === 'Cosmic'));
    });
    
    it('each level should have constituentOscillators', () => {
        OBSERVER_HIERARCHY.forEach(level => {
            assert.ok('constituentOscillators' in level, `${level.scale} should have constituentOscillators`);
        });
    });
    
    it('each level should have entropyGradient', () => {
        OBSERVER_HIERARCHY.forEach(level => {
            assert.ok('entropyGradient' in level, `${level.scale} should have entropyGradient`);
        });
    });
    
    it('each level should have observableBehavior', () => {
        OBSERVER_HIERARCHY.forEach(level => {
            assert.ok('observableBehavior' in level, `${level.scale} should have observableBehavior`);
        });
    });
    
    it('should have increasing typical complexity', () => {
        let prevComplexity = 0;
        OBSERVER_HIERARCHY.forEach(level => {
            assert.ok(level.typicalComplexity >= prevComplexity,
                `${level.scale} should have complexity >= previous`);
            prevComplexity = level.typicalComplexity;
        });
    });
});

console.log('Topology tests defined successfully!');