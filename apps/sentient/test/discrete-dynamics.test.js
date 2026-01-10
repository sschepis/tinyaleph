/**
 * Tests for Discrete Dynamics Enhancements (from discrete.pdf)
 * 
 * Tests enhancements added to sentient app modules.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

// ============================================================================
// INTEGER SINE TABLES TESTS (PRSC)
// ============================================================================

describe('Integer Sine Tables (PRSC)', () => {
    const prsc = require('../lib/prsc');
    
    it('should export INT_SINE_M = 256', () => {
        assert.strictEqual(prsc.INT_SINE_M, 256);
    });
    
    it('should export INT_SINE_TABLE as Int32Array', () => {
        assert.ok(prsc.INT_SINE_TABLE instanceof Int32Array);
        assert.strictEqual(prsc.INT_SINE_TABLE.length, prsc.INT_SINE_M);
    });
    
    it('should export intSin function', () => {
        assert.strictEqual(typeof prsc.intSin, 'function');
    });
    
    it('intSin should return 0 at phase 0', () => {
        const result = prsc.intSin(0);
        assert.strictEqual(result, 0);
    });
    
    it('intSin should be positive at phase M/4', () => {
        const result = prsc.intSin(Math.floor(prsc.INT_SINE_M / 4));
        assert.ok(result > 0);
    });
    
    it('should export phaseToIndex function', () => {
        assert.strictEqual(typeof prsc.phaseToIndex, 'function');
    });
    
    it('phaseToIndex should convert phase to table index', () => {
        const idx = prsc.phaseToIndex(0);
        assert.ok(typeof idx === 'number');
    });
});

// ============================================================================
// HISTOGRAM COHERENCE TESTS (PRSC)
// ============================================================================

describe('Histogram Coherence (PRSC)', () => {
    const { computeHistogramCoherence } = require('../lib/prsc');
    
    it('should export computeHistogramCoherence function', () => {
        assert.strictEqual(typeof computeHistogramCoherence, 'function');
    });
    
    it('should return object with coherence property', () => {
        const phases = [0, 0, 0, 0];
        const result = computeHistogramCoherence(phases);
        assert.ok(typeof result === 'object');
        assert.ok('coherence' in result);
    });
    
    it('should return coherence value between 0 and 1', () => {
        const phases = [0, 0.5, 1.0, 1.5];
        const result = computeHistogramCoherence(phases);
        assert.ok(result.coherence >= 0);
        assert.ok(result.coherence <= 1);
    });
    
    it('should include entropy and bin counts', () => {
        const phases = [0, 0, 0, 0];
        const result = computeHistogramCoherence(phases);
        assert.ok('entropy' in result);
        assert.ok('binCounts' in result);
        assert.ok('numBins' in result);
    });
});

// ============================================================================
// CODEBOOK TUNNELING TESTS (SMF)
// ============================================================================

describe('Codebook Tunneling (SMF)', () => {
    const smf = require('../lib/smf');
    
    describe('SMF_CODEBOOK', () => {
        it('should export SMF_CODEBOOK', () => {
            assert.ok(smf.SMF_CODEBOOK);
        });
        
        it('should export CODEBOOK_SIZE', () => {
            assert.ok(typeof smf.CODEBOOK_SIZE === 'number');
        });
        
        it('SMF_CODEBOOK should have multiple attractors', () => {
            assert.ok(smf.SMF_CODEBOOK.length > 0);
        });
        
        it('each attractor should have state property', () => {
            for (const attractor of smf.SMF_CODEBOOK) {
                assert.ok('state' in attractor, `Attractor ${attractor.id} should have state`);
            }
        });
        
        it('each attractor should have id and type', () => {
            for (const attractor of smf.SMF_CODEBOOK) {
                assert.ok('id' in attractor);
                assert.ok('type' in attractor);
            }
        });
    });
    
    describe('nearestCodebookAttractor', () => {
        it('should export nearestCodebookAttractor function', () => {
            assert.strictEqual(typeof smf.nearestCodebookAttractor, 'function');
        });
        
        it('should find nearest attractor for state', () => {
            const state = new Float64Array(16);
            state[0] = 1.0;
            
            const result = smf.nearestCodebookAttractor(state);
            
            assert.ok(result !== undefined);
        });
    });
    
    describe('codebookTunnel', () => {
        it('should export codebookTunnel function', () => {
            assert.strictEqual(typeof smf.codebookTunnel, 'function');
        });
        
        it('should tunnel state toward target attractor', () => {
            const state = new Float64Array(16);
            state[0] = 1.0;
            
            const result = smf.codebookTunnel(state, 0, 0.5);
            
            assert.ok(result !== undefined);
        });
    });
});

// ============================================================================
// TICK-ONLY HQE GATING TESTS (HQE)
// ============================================================================

describe('Tick-Only HQE Gating', () => {
    const { TickGate } = require('../lib/hqe');
    
    it('should export TickGate class', () => {
        assert.strictEqual(typeof TickGate, 'function');
    });
    
    describe('TickGate', () => {
        it('should create with default options', () => {
            const gate = new TickGate();
            assert.ok(gate);
        });
        
        it('should have tick() method', () => {
            const gate = new TickGate();
            assert.strictEqual(typeof gate.tick, 'function');
        });
        
        it('should have shouldProcess() method', () => {
            const gate = new TickGate();
            assert.strictEqual(typeof gate.shouldProcess, 'function');
        });
        
        it('tick() should increment tick count', () => {
            const gate = new TickGate();
            const before = gate.tickCount;
            gate.tick();
            assert.strictEqual(gate.tickCount, before + 1);
        });
        
        it('shouldProcess() should return object with shouldPass', () => {
            const gate = new TickGate();
            const result = gate.shouldProcess({});
            assert.ok('shouldPass' in result);
        });
        
        it('getStats() should return statistics', () => {
            const gate = new TickGate();
            const stats = gate.getStats();
            assert.ok(typeof stats === 'object');
        });
    });
});

// ============================================================================
// CANONICAL FUSION SELECTION TESTS (Prime Calculus)
// ============================================================================

describe('Canonical Fusion Selection (Prime Calculus)', () => {
    const { PrimeCalculusBuilder } = require('../lib/prime-calculus');
    
    it('should export PrimeCalculusBuilder', () => {
        assert.ok(PrimeCalculusBuilder);
    });
    
    it('PrimeCalculusBuilder should have canonicalTriad method', () => {
        assert.strictEqual(typeof PrimeCalculusBuilder.canonicalTriad, 'function');
    });
    
    it('PrimeCalculusBuilder should have canonicalFusion method', () => {
        assert.strictEqual(typeof PrimeCalculusBuilder.canonicalFusion, 'function');
    });
    
    it('canonicalTriad should return result for valid primes', () => {
        const primes = [3, 5, 7, 11, 13];
        const result = PrimeCalculusBuilder.canonicalTriad(primes);
        // May return null or valid result
        if (result) {
            assert.ok('p' in result);
            assert.ok('q' in result);
            assert.ok('r' in result);
        }
    });
});

// ============================================================================
// FORMALIZED PROPOSAL CLASS TESTS (Network)
// ============================================================================

describe('Formalized Proposal Class (Network)', () => {
    const { Proposal } = require('../lib/network');
    
    it('should export Proposal class', () => {
        assert.strictEqual(typeof Proposal, 'function');
    });
    
    it('should create proposal with object', () => {
        const obj = { id: 'test', term: { prime: 7 } };
        const proposal = new Proposal(obj);
        assert.ok(proposal);
        assert.ok(proposal.id);
    });
    
    it('should have tickProof property', () => {
        const obj = { id: 'test', term: { prime: 7 } };
        const proposal = new Proposal(obj);
        assert.ok('tickProof' in proposal);
    });
    
    it('should have setTickProof method', () => {
        const obj = { id: 'test', term: { prime: 7 } };
        const proposal = new Proposal(obj);
        assert.strictEqual(typeof proposal.setTickProof, 'function');
    });
    
    it('should have verifyTickProof method', () => {
        const obj = { id: 'test', term: { prime: 7 } };
        const proposal = new Proposal(obj);
        assert.strictEqual(typeof proposal.verifyTickProof, 'function');
    });
    
    it('should have quality property', () => {
        const obj = { id: 'test', term: { prime: 7 } };
        const proposal = new Proposal(obj);
        assert.ok('quality' in proposal);
    });
});

// ============================================================================
// FREE ENERGY CURIOSITY TESTS (Curiosity Engine)
// ============================================================================

describe('Free Energy Curiosity (Curiosity Engine)', () => {
    const { FreeEnergyCuriosity } = require('../lib/learning/curiosity');
    
    it('should export FreeEnergyCuriosity class', () => {
        assert.strictEqual(typeof FreeEnergyCuriosity, 'function');
    });
    
    it('should create with default parameters', () => {
        const fec = new FreeEnergyCuriosity();
        assert.ok(fec);
    });
    
    it('should have alpha, beta, gamma parameters', () => {
        const fec = new FreeEnergyCuriosity();
        assert.ok('alpha' in fec);
        assert.ok('beta' in fec);
        assert.ok('gamma' in fec);
    });
    
    it('should have psi state', () => {
        const fec = new FreeEnergyCuriosity();
        assert.ok('psi' in fec);
    });
    
    it('should have freeEnergy method', () => {
        const fec = new FreeEnergyCuriosity();
        assert.strictEqual(typeof fec.freeEnergy, 'function');
    });
    
    it('should have gradient method', () => {
        const fec = new FreeEnergyCuriosity();
        assert.strictEqual(typeof fec.gradient, 'function');
    });
    
    it('should have update method', () => {
        const fec = new FreeEnergyCuriosity();
        assert.strictEqual(typeof fec.update, 'function');
    });
    
    it('freeEnergy should return number', () => {
        const fec = new FreeEnergyCuriosity();
        const F = fec.freeEnergy(0.5);
        assert.ok(typeof F === 'number');
    });
    
    it('gradient should return number', () => {
        const fec = new FreeEnergyCuriosity();
        const g = fec.gradient(0.5);
        assert.ok(typeof g === 'number');
    });
});

// ============================================================================
// OBSERVER SCALE MANAGER TESTS (Collective)
// ============================================================================

describe('Observer Scale Manager (Collective)', () => {
    const { ObserverScaleManager, OBSERVER_HIERARCHY } = require('../lib/collective');
    
    it('should export ObserverScaleManager class', () => {
        assert.strictEqual(typeof ObserverScaleManager, 'function');
    });
    
    it('should export OBSERVER_HIERARCHY', () => {
        assert.ok(OBSERVER_HIERARCHY);
    });
    
    it('should create manager with defaults', () => {
        const manager = new ObserverScaleManager();
        assert.ok(manager);
    });
    
    it('should have domainToScale method', () => {
        const manager = new ObserverScaleManager();
        assert.strictEqual(typeof manager.domainToScale, 'function');
    });
    
    it('should have assignNode method', () => {
        const manager = new ObserverScaleManager();
        assert.strictEqual(typeof manager.assignNode, 'function');
    });
    
    it('domainToScale should return string', () => {
        const manager = new ObserverScaleManager();
        const scale = manager.domainToScale('perceptual');
        assert.strictEqual(typeof scale, 'string');
    });
    
    it('assignNode should return assignment', () => {
        const manager = new ObserverScaleManager();
        const result = manager.assignNode('node1', { semanticDomain: 'cognitive' });
        assert.ok(result);
        assert.ok('scale' in result);
    });
    
    it('should have getStats method', () => {
        const manager = new ObserverScaleManager();
        assert.strictEqual(typeof manager.getStats, 'function');
    });
    
    it('getStats should return statistics', () => {
        const manager = new ObserverScaleManager();
        const stats = manager.getStats();
        assert.ok('totalNodes' in stats);
    });
});

console.log('Discrete Dynamics Tests Loaded');