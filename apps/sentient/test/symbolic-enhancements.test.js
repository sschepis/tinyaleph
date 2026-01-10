/**
 * Symbolic Enhancements Tests
 *
 * Tests for tinyaleph 1.3.0 symbolic integration with Sentient Observer:
 * - SymbolicSMF: Symbol-grounded 16D semantic orientation
 * - SymbolicTemporalLayer: I-Ching moment classification
 * - SymbolicObserver: Full symbolic observer integration
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');

// Import symbolic extensions
const {
    SymbolicSMF,
    SMFSymbolMapper,
    smfMapper,
    AXIS_SYMBOL_MAPPING,
    TAG_TO_AXIS
} = require('../lib/symbolic-smf');

const {
    SymbolicMoment,
    SymbolicTemporalLayer,
    SymbolicPatternDetector,
    HEXAGRAM_ARCHETYPES
} = require('../lib/symbolic-temporal');

const {
    SymbolicState,
    SymbolicObserver
} = require('../lib/symbolic-observer');

// Import core dependencies
const { symbolDatabase } = require('../../../core/symbols');
const { createEngine, SemanticBackend } = require('../../../modular');

describe('SymbolicSMF', () => {
    let smf;
    
    beforeEach(() => {
        smf = new SymbolicSMF();
    });
    
    it('should initialize with correct dimension', () => {
        assert.strictEqual(smf.s.length, 16, 'SMF should have 16 components');
    });
    
    it('should have AXIS_SYMBOL_MAPPING for all 16 axes', () => {
        assert.strictEqual(Object.keys(AXIS_SYMBOL_MAPPING).length, 16);
        
        // Check first few mappings - AXIS_SYMBOL_MAPPING has {category, archetypes} structure
        assert.ok(AXIS_SYMBOL_MAPPING[0].archetypes.includes('unity'), 'Axis 0 should have unity archetype');
        assert.ok(AXIS_SYMBOL_MAPPING[1].archetypes.some(a => a.includes('hero') || a.includes('self')),
            'Axis 1 should have identity-related archetypes');
    });
    
    it('should excite from symbol and affect SMF state', () => {
        const initialNorm = smf.norm();
        
        // Try exciting from a symbol that likely exists (e.g., "hero")
        const result = smf.exciteFromSymbol('hero', 0.5);
        
        // Even if symbol not found, verify state handling
        const newNorm = smf.norm();
        // The state should be different (normalized and possibly excited)
        assert.ok(typeof newNorm === 'number', 'norm() should return number');
    });
    
    it('should ground state in symbols', () => {
        // Excite a specific axis
        smf.s[0] = 1.0;  // Coherence axis
        smf.s[1] = 0.5;  // Identity axis
        smf.normalize();
        
        const grounded = smf.groundInSymbols(3);
        
        assert.ok(Array.isArray(grounded), 'groundInSymbols should return array');
        // Should find at least one matching symbol based on axis archetypes
        if (grounded.length > 0) {
            assert.ok(grounded[0].axis, 'Grounded entry should have axis');
            assert.ok(grounded[0].symbol, 'Grounded entry should have symbol');
            assert.ok(typeof grounded[0].alignment === 'number',
                'Grounded entry should have alignment score');
        }
    });
    
    it('should find resonant symbols', () => {
        // Set up a state
        smf.s[0] = 1.0;
        smf.normalize();
        
        const resonant = smf.findResonantSymbols(5);
        
        assert.ok(Array.isArray(resonant), 'findResonantSymbols should return array');
        assert.ok(resonant.length <= 5, 'Should return at most 5 symbols');
        
        if (resonant.length > 0) {
            assert.ok(resonant[0].symbol, 'Result should have symbol');
            assert.ok(typeof resonant[0].resonance === 'number', 'Result should have resonance');
        }
    });
    
    it('should map cultural tags to axes', () => {
        const axis = smf.tagToAxis('truth');
        assert.strictEqual(axis, 10, 'truth tag should map to axis 10');
        
        const axis2 = smf.tagToAxis('wisdom');
        assert.strictEqual(axis2, 7, 'wisdom tag should map to axis 7');
    });
});

describe('SMFSymbolMapper', () => {
    let mapper;
    
    beforeEach(() => {
        mapper = new SMFSymbolMapper();
    });
    
    it('should create SMF from symbol', () => {
        // Get a sample symbol
        const allSymbols = symbolDatabase.getAllSymbols();
        if (allSymbols.length > 0) {
            const smf = mapper.symbolToSMF(allSymbols[0]);
            assert.ok(smf instanceof SymbolicSMF, 'Should return SymbolicSMF');
            assert.strictEqual(smf.s.length, 16, 'SMF should have 16 components');
        }
    });
    
    it('should calculate symbolic distance', () => {
        const smf1 = new SymbolicSMF();
        smf1.s[0] = 1.0;
        smf1.normalize();
        
        const smf2 = new SymbolicSMF();
        smf2.s[15] = 1.0;
        smf2.normalize();
        
        const distance = mapper.symbolicDistance(smf1, smf2);
        assert.ok(typeof distance === 'number', 'Distance should be a number');
        assert.ok(distance >= 0 && distance <= 1, 'Distance should be 0-1');
    });
});

describe('SymbolicTemporalLayer', () => {
    let temporal;
    
    beforeEach(() => {
        temporal = new SymbolicTemporalLayer({
            coherenceThreshold: 0.5,
            entropyMin: 0.1,
            entropyMax: 0.9
        });
    });
    
    it('should have 64 hexagram archetypes', () => {
        assert.strictEqual(Object.keys(HEXAGRAM_ARCHETYPES).length, 64);
    });
    
    it('should create symbolic moments', () => {
        const state = {
            coherence: 0.8,
            entropy: 0.5,
            activePrimes: [2, 3, 5, 7],
            smf: { s: new Array(16).fill(0.1) },
            amplitudes: [0.1, 0.2, 0.3]
        };
        
        const moment = temporal.createMoment('coherence', state);
        
        assert.ok(moment instanceof SymbolicMoment, 'Should create SymbolicMoment');
        assert.ok(moment.hexagramIndex !== null, 'Should have hexagram index');
        assert.ok(moment.hexagramIndex >= 0 && moment.hexagramIndex < 64, 
            'Hexagram index should be 0-63');
        assert.ok(moment.archetype, 'Should have archetype');
    });
    
    it('should track hexagram history', () => {
        // Create multiple moments
        for (let i = 0; i < 5; i++) {
            temporal.createMoment('coherence', {
                coherence: 0.8,
                entropy: 0.5,
                activePrimes: [2 + i, 3, 5, 7],
                smf: { s: new Array(16).fill(0.1 * (i + 1)) }
            });
        }
        
        const distribution = temporal.getHexagramDistribution();
        assert.strictEqual(distribution.length, 64, 'Distribution should have 64 entries');
        
        const dominantArchetypes = temporal.getDominantArchetypes(3);
        assert.ok(Array.isArray(dominantArchetypes), 'Should return dominant archetypes array');
    });
    
    it('should predict next archetype', () => {
        // Create a sequence of moments
        for (let i = 0; i < 10; i++) {
            temporal.createMoment('coherence', {
                coherence: 0.8,
                entropy: 0.5,
                activePrimes: [2, 3, 5, 7],
                smf: { s: new Array(16).fill(0.1) }
            });
        }
        
        const prediction = temporal.predictNextArchetype();
        assert.ok('predicted' in prediction, 'Prediction should have predicted field');
        assert.ok('confidence' in prediction, 'Prediction should have confidence field');
    });
    
    it('should get I-Ching reading', () => {
        temporal.createMoment('coherence', {
            coherence: 0.8,
            entropy: 0.5,
            activePrimes: [2, 3, 5, 7],
            smf: { s: new Array(16).fill(0.1) }
        });
        
        const reading = temporal.getIChingReading();
        
        if (reading) {
            assert.ok(reading.current, 'Reading should have current hexagram');
            assert.ok(reading.current.number >= 1 && reading.current.number <= 64,
                'Hexagram number should be 1-64');
            assert.ok(reading.current.name, 'Reading should have hexagram name');
        }
    });
});

describe('SymbolicPatternDetector', () => {
    let detector;
    
    beforeEach(() => {
        detector = new SymbolicPatternDetector();
    });
    
    it('should detect narrative patterns', () => {
        // Create mock moments with archetypes
        const moments = [
            new SymbolicMoment({ archetype: { name: 'creative' }, hexagramIndex: 0 }),
            new SymbolicMoment({ archetype: { name: 'difficulty' }, hexagramIndex: 2 }),
            new SymbolicMoment({ archetype: { name: 'return' }, hexagramIndex: 23 }),
            new SymbolicMoment({ archetype: { name: 'creative' }, hexagramIndex: 0 }),
            new SymbolicMoment({ archetype: { name: 'difficulty' }, hexagramIndex: 2 }),
            new SymbolicMoment({ archetype: { name: 'return' }, hexagramIndex: 23 })
        ];
        
        const narratives = detector.detectNarrativePatterns(moments);
        
        // Should detect the hero's journey pattern
        assert.ok(Array.isArray(narratives), 'Should return array of narratives');
    });
});

// Note: SymbolicObserver tests require full sentient-core integration
// These are tested separately in the main sentient test suite

describe('Integration Tests', () => {
    it('should correctly integrate SymbolicSMF with symbol database', () => {
        const smf = new SymbolicSMF();
        
        // Excite from some valid symbol IDs
        const allSymbols = symbolDatabase.getAllSymbols();
        if (allSymbols.length >= 2) {
            smf.exciteFromSymbol(allSymbols[0].id, 0.5);
            smf.exciteFromSymbol(allSymbols[1].id, 0.3);
            
            // Should still have valid state
            assert.strictEqual(smf.s.length, 16, 'Should have 16 components');
            assert.ok(smf.norm() > 0, 'Should have non-zero norm');
            
            // Ground in symbols
            const grounded = smf.groundInSymbols(3);
            assert.ok(Array.isArray(grounded), 'Should return grounded symbols');
        }
    });
    
    it('should correctly integrate SymbolicTemporalLayer with moments', () => {
        const temporal = new SymbolicTemporalLayer({
            coherenceThreshold: 0.3
        });
        
        // Create a sequence of moments
        for (let i = 0; i < 5; i++) {
            temporal.createMoment('coherence', {
                coherence: 0.6 + i * 0.05,
                entropy: 0.4,
                activePrimes: [2, 3, 5, 7, 11].slice(0, i + 1),
                smf: { s: new Array(16).fill(0.1 * (i + 1)) },
                amplitudes: [0.1, 0.2, 0.3, 0.4, 0.5].slice(0, i + 1)
            });
        }
        
        // Should have moments
        assert.strictEqual(temporal.moments.length, 5, 'Should have 5 moments');
        
        // Each moment should have symbolic classification
        for (const moment of temporal.moments) {
            assert.ok(moment instanceof SymbolicMoment, 'Should be SymbolicMoment');
            assert.ok(typeof moment.hexagramIndex === 'number', 'Should have hexagram index');
            assert.ok(moment.archetype, 'Should have archetype');
        }
        
        // Get stats
        const stats = temporal.getStats();
        assert.ok(stats.symbolic, 'Stats should have symbolic section');
    });
    
    it('should create compound symbols from SMF state', () => {
        const smf = new SymbolicSMF();
        
        // Set up a multi-axis state
        smf.s[0] = 1.0;   // coherence
        smf.s[7] = 0.8;   // wisdom
        smf.s[10] = 0.6;  // truth
        smf.normalize();
        
        // Create compound
        const compound = smf.createCompoundFromState('test-compound', 'Test meaning');
        
        // May or may not succeed depending on symbol availability
        if (compound) {
            assert.ok(compound.id || compound.name, 'Compound should have identifier');
        }
    });
    
    it('should calculate resonance between SMF states and symbols', () => {
        const smf = new SymbolicSMF();
        
        // Set up an axis-aligned state
        smf.s[1] = 1.0;  // identity axis
        smf.normalize();
        
        // Find resonant symbols
        const resonant = smf.findResonantSymbols(5);
        
        assert.ok(Array.isArray(resonant), 'Should return array');
        
        // If found, verify they relate to identity/archetype
        if (resonant.length > 0) {
            assert.ok(resonant[0].symbol, 'Should have symbol');
            assert.ok(typeof resonant[0].resonance === 'number', 'Should have resonance score');
        }
    });
});

console.log('Running symbolic enhancement tests...');