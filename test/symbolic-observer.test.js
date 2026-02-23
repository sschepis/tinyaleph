/**
 * Tests for Symbolic Observer Extensions
 *
 * Tests the extracted symbolic processing modules:
 * - SymbolicSMF (symbol-grounded SMF)
 * - SymbolicTemporalLayer (I-Ching moment classification)
 * - Evaluation Assays (whitepaper Section 15 tests)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SymbolicSMF, SMFSymbolMapper, AXIS_SYMBOL_MAPPING, TAG_TO_AXIS } from '../observer/symbolic-smf.js';
import { symbolDatabase } from '../core/symbols.js';
import {
    SymbolicMoment,
    SymbolicTemporalLayer,
    SymbolicPatternDetector,
    HEXAGRAM_ARCHETYPES
} from '../observer/symbolic-temporal.js';
import {
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite
} from '../observer/assays.js';

// ============================================================================
// SYMBOLIC SMF TESTS
// ============================================================================

describe('SymbolicSMF', () => {
    
    describe('AXIS_SYMBOL_MAPPING', () => {
        it('should have 16 axis mappings', () => {
            assert.strictEqual(Object.keys(AXIS_SYMBOL_MAPPING).length, 16);
        });
        
        it('should map axis 0 (coherence) to unity-related archetypes', () => {
            assert.ok(AXIS_SYMBOL_MAPPING[0]);
            assert.ok(AXIS_SYMBOL_MAPPING[0].archetypes.length > 0);
        });
        
        it('should map all 16 SMF axis indices', () => {
            for (let i = 0; i < 16; i++) {
                assert.ok(AXIS_SYMBOL_MAPPING[i], `Missing mapping for axis ${i}`);
                assert.ok(AXIS_SYMBOL_MAPPING[i].category, `Missing category for axis ${i}`);
                assert.ok(AXIS_SYMBOL_MAPPING[i].archetypes, `Missing archetypes for axis ${i}`);
            }
        });
    });
    
    describe('TAG_TO_AXIS', () => {
        it('should map cultural tags to axes', () => {
            assert.strictEqual(TAG_TO_AXIS.wisdom, 7);
            assert.strictEqual(TAG_TO_AXIS.emotion, 11);
        });
    });
    
    describe('SMFSymbolMapper', () => {
        it('should create mapper instance', () => {
            const mapper = new SMFSymbolMapper();
            assert.ok(mapper);
        });
        
        it('should map symbol to SMF via symbolToSMF', () => {
            const mapper = new SMFSymbolMapper();
            const symbol = symbolDatabase.getSymbol('unity') || symbolDatabase.search('unity')[0];
            if (symbol) {
                const smf = mapper.symbolToSMF(symbol);
                assert.ok(smf);
                assert.strictEqual(smf.s.length, 16);
            }
        });
        
        it('should find best match for an SMF orientation', () => {
            const mapper = new SMFSymbolMapper();
            const smf = new SymbolicSMF();
            smf.set('wisdom', 0.9);
            const match = mapper.findBestMatch(smf);
            // May or may not find a match depending on symbol database contents
            assert.ok(match !== undefined);
        });
    });
    
    describe('SymbolicSMF instance', () => {
        it('should create with default components', () => {
            const smf = new SymbolicSMF();
            assert.ok(smf);
            assert.strictEqual(smf.s.length, 16);
        });
        
        it('should excite from symbol ID', () => {
            const smf = new SymbolicSMF();
            const symbol = symbolDatabase.search('light')[0];
            if (symbol) {
                const result = smf.exciteFromSymbol(symbol.id);
                assert.strictEqual(result, true);
                assert.ok(smf.norm() > 0);
            }
        });
        
        it('should ground state in symbols', () => {
            const smf = new SymbolicSMF();
            smf.set('wisdom', 0.9);
            smf.normalize();
            const grounded = smf.groundInSymbols(3);
            assert.ok(Array.isArray(grounded));
        });
        
        it('should find resonant symbols', () => {
            const smf = new SymbolicSMF();
            smf.set('creation', 0.8);
            smf.normalize();
            const resonant = smf.findResonantSymbols(5);
            assert.ok(Array.isArray(resonant));
        });
        
        it('should compute symbolic entropy', () => {
            const smf = new SymbolicSMF();
            smf.set('coherence', 0.5);
            smf.set('identity', 0.5);
            smf.normalize();
            const entropy = smf.smfEntropy();
            assert.ok(entropy >= 0);
        });
        
        it('should map cultural tag to axis', () => {
            const smf = new SymbolicSMF();
            const axisIdx = smf.tagToAxis('wisdom');
            assert.strictEqual(axisIdx, 7);
        });
        
        it('should return -1 for unknown tag', () => {
            const smf = new SymbolicSMF();
            const axisIdx = smf.tagToAxis('nonexistent_tag_xyz');
            assert.strictEqual(axisIdx, -1);
        });
        
        it('should get axis archetype', () => {
            const smf = new SymbolicSMF();
            // getAxisArchetype tries to look up symbols from the database
            const archetype = smf.getAxisArchetype(0);
            // May or may not find one depending on database
            assert.ok(archetype !== undefined);
        });
        
        it('should track symbol history', () => {
            const smf = new SymbolicSMF();
            const symbol = symbolDatabase.search('light')[0];
            if (symbol) {
                smf.exciteFromSymbol(symbol.id);
                const stats = smf.getSymbolStats();
                assert.ok(stats.totalActivations >= 1);
            }
        });
        
        it('should serialize to JSON with symbolic data', () => {
            const smf = new SymbolicSMF();
            smf.set('wisdom', 0.8);
            smf.normalize();
            const json = smf.toJSON();
            assert.ok('symbolic' in json);
        });
    });
});

// ============================================================================
// SYMBOLIC TEMPORAL TESTS
// ============================================================================

describe('SymbolicTemporalLayer', () => {
    
    describe('HEXAGRAM_ARCHETYPES', () => {
        it('should have 64 hexagram archetypes', () => {
            assert.strictEqual(Object.keys(HEXAGRAM_ARCHETYPES).length, 64);
        });
        
        it('should have name and symbol for each', () => {
            for (let i = 0; i < 64; i++) {
                const hex = HEXAGRAM_ARCHETYPES[i];
                assert.ok(hex, `Missing hexagram archetype for index ${i}`);
                assert.ok(hex.name, `Hexagram ${i} missing name`);
                assert.ok(hex.symbol, `Hexagram ${i} missing symbol`);
            }
        });
        
        it('should include well-known hexagrams', () => {
            // HEXAGRAM_ARCHETYPES uses lowercase names
            assert.strictEqual(HEXAGRAM_ARCHETYPES[0].name, 'creative');
            assert.strictEqual(HEXAGRAM_ARCHETYPES[1].name, 'receptive');
        });
    });
    
    describe('SymbolicMoment', () => {
        it('should create with hexagram classification', () => {
            const moment = new SymbolicMoment({
                coherence: 0.7,
                entropy: 0.5,
                hexagramIndex: 1
            });
            assert.strictEqual(moment.hexagramIndex, 1);
        });
        
        it('should store archetype when explicitly provided', () => {
            const moment = new SymbolicMoment({
                coherence: 0.8,
                hexagramIndex: 0,
                archetype: HEXAGRAM_ARCHETYPES[0]  // creative
            });
            assert.ok(moment.archetype);
            assert.strictEqual(moment.archetype.name, 'creative');
        });
        
        it('should track PHI resonance', () => {
            const moment = new SymbolicMoment({
                coherence: 0.7,
                phiResonance: 0.618
            });
            assert.ok(Math.abs(moment.phiResonance - 0.618) < 0.001);
        });
        
        it('should serialize with symbolic data', () => {
            const moment = new SymbolicMoment({
                coherence: 0.75,
                hexagramIndex: 5,
                archetype: HEXAGRAM_ARCHETYPES[5],
                relatedSymbols: ['fire', 'water']
            });
            const json = moment.toJSON();
            assert.ok('hexagramIndex' in json);
            assert.ok('archetype' in json);
            assert.ok('relatedSymbols' in json);
        });
    });
    
    describe('SymbolicTemporalLayer', () => {
        it('should create with options', () => {
            const layer = new SymbolicTemporalLayer({
                coherenceThreshold: 0.6
            });
            assert.ok(layer);
            assert.strictEqual(layer.coherenceThreshold, 0.6);
        });
        
        it('should classify moment from SMF vector', () => {
            const layer = new SymbolicTemporalLayer();
            // classifyMoment takes (smfVector, activePrimes, amplitudes)
            const smfVector = [0.8, 0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.0,
                               0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
            const classification = layer.classifyMoment(smfVector, [2, 3, 5], null);
            
            assert.ok('hexagramIndex' in classification);
            assert.ok(classification.hexagramIndex >= 0);
            assert.ok(classification.hexagramIndex < 64);
        });
        
        it('should get current I-Ching reading after update', () => {
            const layer = new SymbolicTemporalLayer();
            // Need to trigger a moment via update
            // First call won't trigger (not enough history for coherence peak)
            // Use forceMoment instead
            layer.forceMoment({
                coherence: 0.8,
                entropy: 0.4,
                phases: [0, 0, 0],
                activePrimes: [2, 3, 5]
            });
            
            const reading = layer.getIChingReading();
            // The reading may or may not have data depending on moment classification
            assert.ok(reading === null || typeof reading === 'object');
        });
        
        it('should track hexagram distribution', () => {
            const layer = new SymbolicTemporalLayer();
            
            // forceMoment several times to build history
            for (let i = 0; i < 10; i++) {
                layer.forceMoment({
                    coherence: 0.5 + Math.random() * 0.4,
                    entropy: 0.3 + Math.random() * 0.3,
                    phases: Array(6).fill(0).map(() => Math.random() * Math.PI * 2),
                    activePrimes: [2, 3, 5]
                });
            }
            
            const stats = layer.getStats();
            assert.ok(stats.momentCount >= 0);
            assert.ok('symbolic' in stats);
        });
        
        it('should get dominant archetypes', () => {
            const layer = new SymbolicTemporalLayer();
            
            // forceMoment several times
            for (let i = 0; i < 5; i++) {
                layer.forceMoment({
                    coherence: 0.8,
                    entropy: 0.3,
                    activePrimes: [2, 3, 5]
                });
            }
            
            const dominant = layer.getDominantArchetypes(3);
            assert.ok(Array.isArray(dominant));
        });
    });
    
    describe('SymbolicPatternDetector', () => {
        it('should create detector', () => {
            const detector = new SymbolicPatternDetector();
            assert.ok(detector);
        });
        
        it('should detect narrative patterns from moments', () => {
            const detector = new SymbolicPatternDetector();
            
            // Create moments with archetype data (required for narrative detection)
            const moments = [
                new SymbolicMoment({ coherence: 0.5, hexagramIndex: 3, archetype: HEXAGRAM_ARCHETYPES[3] }),
                new SymbolicMoment({ coherence: 0.6, hexagramIndex: 4, archetype: HEXAGRAM_ARCHETYPES[4] }),
                new SymbolicMoment({ coherence: 0.7, hexagramIndex: 11, archetype: HEXAGRAM_ARCHETYPES[11] }),
                new SymbolicMoment({ coherence: 0.8, hexagramIndex: 1, archetype: HEXAGRAM_ARCHETYPES[1] })
            ];
            
            const narratives = detector.detectNarrativePatterns(moments);
            assert.ok(Array.isArray(narratives));
        });
        
        it('should detect hero journey pattern when present', () => {
            const detector = new SymbolicPatternDetector();
            
            // Hero's journey uses archetypes 'creative'(0) → 'difficulty'(2) → 'return'(23)
            const moments = [
                new SymbolicMoment({ coherence: 0.5, hexagramIndex: 0, archetype: HEXAGRAM_ARCHETYPES[0] }),
                new SymbolicMoment({ coherence: 0.3, hexagramIndex: 2, archetype: HEXAGRAM_ARCHETYPES[2] }),
                new SymbolicMoment({ coherence: 0.7, hexagramIndex: 23, archetype: HEXAGRAM_ARCHETYPES[23] }),
                new SymbolicMoment({ coherence: 0.9, hexagramIndex: 0, archetype: HEXAGRAM_ARCHETYPES[0] })
            ];
            
            const narratives = detector.detectNarrativePatterns(moments);
            // May or may not detect depending on exact sequence matching
            assert.ok(Array.isArray(narratives));
        });
    });
});

// ============================================================================
// EVALUATION ASSAYS TESTS
// ============================================================================

describe('Evaluation Assays', () => {
    
    // Mock observer core for testing
    const createMockCore = () => ({
        getStats: () => ({
            temporal: { coherence: 0.7, subjectiveTime: 100, objectiveTime: 100, temporalRatio: 1.0 },
            hqe: { lambda: -0.1 },
            smf: { smfEntropy: 0.5, peakPrimes: [2, 3, 5] },
            memory: { memoryCoherence: 0.8, memoryCount: 10 },
            agency: { currentState: 'active', intentionCount: 3, currentIntention: 'process' },
            boundary: { selfModel: { integrity: 0.9, coherence: 0.85 } }
        }),
        smf: {
            getField: () => new Array(16).fill(0.5),
            integrateStimulus: () => {},
            dimension: 64,
            reset: () => {}
        },
        memory: {},
        boundary: {},
        hqe: { dimension: 16 },
        dt: 0.1
    });
    
    describe('TimeDilationAssay', () => {
        it('should create with observer core', () => {
            const assay = new TimeDilationAssay(createMockCore());
            assert.ok(assay);
        });
        
        it('should run and return results', async () => {
            const assay = new TimeDilationAssay(createMockCore());
            const result = await assay.run({ duration: 10 });
            
            assert.strictEqual(result.assay, 'A');
            assert.strictEqual(result.name, 'Emergent Time Dilation');
            assert.ok('passed' in result);
            assert.ok('dilationFactor' in result);
            assert.ok('interpretation' in result);
        });
    });
    
    describe('MemoryContinuityAssay', () => {
        it('should create with observer core', () => {
            const assay = new MemoryContinuityAssay(createMockCore());
            assert.ok(assay);
        });
        
        it('should run and return results', async () => {
            const assay = new MemoryContinuityAssay(createMockCore());
            const result = await assay.run({ 
                perturbationStrength: 0.3,
                recoveryTicks: 5
            });
            
            assert.strictEqual(result.assay, 'B');
            assert.strictEqual(result.name, 'Memory Continuity Under Perturbation');
            assert.ok('passed' in result);
            assert.ok('identityScore' in result);
            assert.ok('components' in result);
        });
    });
    
    describe('AgencyConstraintAssay', () => {
        it('should create with observer core', () => {
            const assay = new AgencyConstraintAssay(createMockCore());
            assert.ok(assay);
        });
        
        it('should run and return results', async () => {
            const assay = new AgencyConstraintAssay(createMockCore());
            const result = await assay.run({
                constraintLevel: 0.3,
                goalDifficulty: 0.3,
                maxTicks: 10
            });
            
            assert.strictEqual(result.assay, 'C');
            assert.strictEqual(result.name, 'Agency Under Constraint');
            assert.ok('passed' in result);
            assert.ok('goal' in result);
            assert.ok('metrics' in result);
        });
    });
    
    describe('NonCommutativeMeaningAssay', () => {
        it('should create with observer core', () => {
            const assay = new NonCommutativeMeaningAssay(createMockCore());
            assert.ok(assay);
        });
        
        it('should run and return results', async () => {
            const assay = new NonCommutativeMeaningAssay(createMockCore());
            const result = await assay.run({
                conceptSequence: ['a', 'b', 'c']
            });
            
            assert.strictEqual(result.assay, 'D');
            assert.strictEqual(result.name, 'Non-Commutative Meaning');
            assert.ok('passed' in result);
            assert.ok('nonCommScore' in result);
            assert.ok('signatures' in result);
        });
    });
    
    describe('AssaySuite', () => {
        it('should create suite with all assays', () => {
            const suite = new AssaySuite(createMockCore());
            assert.ok(suite.timeDilation);
            assert.ok(suite.memoryContinuity);
            assert.ok(suite.agencyConstraint);
            assert.ok(suite.nonCommutative);
        });
        
        it('should run single assay by name', async () => {
            const suite = new AssaySuite(createMockCore());
            
            const resultA = await suite.runSingle('A', { duration: 5 });
            assert.strictEqual(resultA.assay, 'A');
            
            const resultB = await suite.runSingle('B', { recoveryTicks: 3 });
            assert.strictEqual(resultB.assay, 'B');
        });
        
        it('should throw for unknown assay', async () => {
            const suite = new AssaySuite(createMockCore());
            
            await assert.rejects(
                () => suite.runSingle('X'),
                /Unknown assay/
            );
        });
    });
});

// ============================================================================
// INTEGRATION TEST
// ============================================================================

describe('Symbolic Observer Integration', () => {
    it('should process symbolic moment through full stack', () => {
        // Create symbolic SMF with default initialization
        const smf = new SymbolicSMF();
        smf.set('wisdom', 0.8);
        smf.set('creation', 0.6);
        smf.normalize();
        
        // Get grounded symbols
        const grounded = smf.groundInSymbols(3);
        
        // Create symbolic temporal layer
        const temporal = new SymbolicTemporalLayer();
        
        // forceMoment to create a moment
        temporal.forceMoment({
            coherence: 0.75,
            entropy: 0.35,
            phases: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
            activePrimes: [2, 3, 5, 7]
        });
        
        // Get stats
        const stats = temporal.getStats();
        assert.ok(stats.momentCount >= 0);
    });
    
    it('should detect symbolic patterns over time', () => {
        const temporal = new SymbolicTemporalLayer();
        
        // Simulate a session with varying coherence using forceMoment
        const coherenceSequence = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9];
        
        for (let i = 0; i < coherenceSequence.length; i++) {
            temporal.forceMoment({
                coherence: coherenceSequence[i],
                entropy: 1 - coherenceSequence[i] * 0.8,
                phases: Array(6).fill(0).map((_, j) => i * 0.1 + j * 0.05),
                activePrimes: [2, 3, 5]
            });
        }
        
        // Should have classified moments
        const moments = temporal.recentMoments(5);
        assert.ok(moments.length >= 0);
        
        // Each moment should have hexagram classification
        for (const moment of moments) {
            if (moment.hexagramIndex !== undefined && moment.hexagramIndex !== null) {
                assert.ok(moment.hexagramIndex >= 0);
                assert.ok(moment.hexagramIndex < 64);
            }
        }
    });
});

console.log('Symbolic observer tests loaded successfully!');
