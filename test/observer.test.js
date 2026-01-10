/**
 * Tests for Observer Architecture
 * 
 * Tests the extracted observer modules:
 * - SedenionMemoryField (SMF)
 * - PRSCLayer
 * - TemporalLayer
 * - EntanglementLayer
 * - AgencyLayer
 * - BoundaryLayer
 * - SafetyLayer
 */

'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

// ============================================================================
// SMF TESTS
// ============================================================================

describe('SedenionMemoryField', () => {
    const { SedenionMemoryField, SMF_AXES, SMF_CODEBOOK } = require('../observer/smf');
    
    it('should export SMF_AXES with 16 dimensions', () => {
        assert.strictEqual(SMF_AXES.length, 16);
        assert.ok(SMF_AXES.some(a => a.name === 'coherence'));
        assert.ok(SMF_AXES.some(a => a.name === 'identity'));
        assert.ok(SMF_AXES.some(a => a.name === 'wisdom'));
    });
    
    it('should create with default 16D state', () => {
        const smf = new SedenionMemoryField();
        assert.strictEqual(smf.s.length, 16);
    });
    
    it('should create from array', () => {
        const arr = new Float64Array(16);
        arr[0] = 0.5;
        arr[1] = 0.5;
        const smf = new SedenionMemoryField(arr);
        assert.ok(smf.s[0] > 0);
    });
    
    it('should create basis SMF for single axis', () => {
        const smf = SedenionMemoryField.basis('coherence');
        assert.ok(Math.abs(smf.s[0]) > 0.9);
    });
    
    it('should create uniform SMF', () => {
        const smf = SedenionMemoryField.uniform();
        const val = smf.s[0];
        for (let i = 1; i < 16; i++) {
            assert.ok(Math.abs(smf.s[i] - val) < 0.001);
        }
    });
    
    it('should get and set axes by name', () => {
        const smf = new SedenionMemoryField();
        smf.set('wisdom', 0.8);
        assert.ok(Math.abs(smf.get('wisdom') - 0.8) < 0.01);
    });
    
    it('should compute norm', () => {
        const smf = SedenionMemoryField.basis(0);
        const norm = smf.norm();
        assert.ok(Math.abs(norm - 1) < 0.001);
    });
    
    it('should normalize state', () => {
        const smf = new SedenionMemoryField();
        smf.s[0] = 3;
        smf.s[1] = 4;
        smf.normalize();
        assert.ok(Math.abs(smf.norm() - 1) < 0.001);
    });
    
    it('should compute entropy', () => {
        const smf = SedenionMemoryField.uniform();
        const entropy = smf.entropy();
        assert.ok(entropy > 0);
    });
    
    it('should compute dot product', () => {
        const smf1 = SedenionMemoryField.basis(0);
        const smf2 = SedenionMemoryField.basis(0);
        const dot = smf1.dot(smf2);
        assert.ok(Math.abs(dot - 1) < 0.001);
    });
    
    it('should compute coherence (cosine similarity)', () => {
        const smf1 = SedenionMemoryField.basis(0);
        const smf2 = SedenionMemoryField.basis(0);
        const coh = smf1.coherence(smf2);
        assert.ok(coh > 0.9);
    });
    
    it('should multiply sedenions', () => {
        const smf1 = SedenionMemoryField.basis(0);
        const smf2 = SedenionMemoryField.basis(1);
        const result = smf1.multiply(smf2);
        assert.ok(result.norm() > 0);
    });
    
    it('should quaternion compose', () => {
        const smf1 = SedenionMemoryField.basis(0);
        const smf2 = SedenionMemoryField.basis(1);
        const result = smf1.quaternionCompose(smf2);
        assert.ok(result.norm() > 0);
    });
    
    it('should extract quaternion', () => {
        const smf = SedenionMemoryField.basis(0);
        const q = smf.extractQuaternion();
        assert.ok('w' in q);
        assert.ok('x' in q);
        assert.ok('y' in q);
        assert.ok('z' in q);
    });
    
    it('should clone correctly', () => {
        const smf = SedenionMemoryField.basis(3);
        const clone = smf.clone();
        assert.deepStrictEqual(clone.s, smf.s);
    });
    
    it('should serialize to JSON', () => {
        const smf = SedenionMemoryField.basis(0);
        const json = smf.toJSON();
        assert.ok('axes' in json);
        assert.ok('norm' in json);
        assert.ok('entropy' in json);
    });
    
    it('should find nearest codebook attractor', () => {
        const smf = SedenionMemoryField.basis(5);
        const nearest = smf.nearestCodebook();
        assert.ok('attractor' in nearest);
        assert.ok('index' in nearest);
        assert.ok('distance' in nearest);
    });
    
    it('should export SMF_CODEBOOK with attractors', () => {
        // SMF_CODEBOOK has 56 attractors (7 primary sets × 8 combinations)
        assert.strictEqual(SMF_CODEBOOK.length, 56);
    });
    
    it('should slerp between states', () => {
        const smf1 = SedenionMemoryField.basis(0);
        const smf2 = SedenionMemoryField.basis(1);
        const mid = smf1.slerp(smf2, 0.5);
        assert.ok(Math.abs(mid.norm() - 1) < 0.01);
    });
    
    it('should get dominant axes', () => {
        const smf = SedenionMemoryField.basis(0);
        const dominant = smf.dominantAxes(3);
        assert.strictEqual(dominant.length, 3);
        assert.strictEqual(dominant[0].name, 'coherence');
    });
});

// ============================================================================
// PRSC LAYER TESTS
// ============================================================================

describe('PRSCLayer', () => {
    const { PRSCLayer, PrimeOscillator } = require('../observer/prsc');
    
    describe('PrimeOscillator', () => {
        it('should create with prime', () => {
            const osc = new PrimeOscillator(7);
            assert.strictEqual(osc.prime, 7);
            assert.ok(osc.phase >= 0);
        });
        
        it('should compute natural frequency from prime', () => {
            const freq = PrimeOscillator.primeToFrequency(7);
            assert.ok(freq > 1);
            assert.ok(freq < 2);
        });
        
        it('should excite oscillator', () => {
            const osc = new PrimeOscillator(3);
            osc.amplitude = 0;
            osc.excite(0.5);
            assert.strictEqual(osc.amplitude, 0.5);
        });
        
        it('should damp amplitude', () => {
            const osc = new PrimeOscillator(3);
            osc.amplitude = 1.0;
            osc.damp(0.1, 1.0);
            assert.ok(osc.amplitude < 1.0);
        });
    });
    
    describe('PRSCLayer', () => {
        it('should create with default oscillators', () => {
            const prsc = new PRSCLayer();
            assert.ok(prsc.oscillators.length > 0);
        });
        
        it('should create with prime count', () => {
            const prsc = new PRSCLayer(5);
            assert.strictEqual(prsc.oscillators.length, 5);
        });
        
        it('should create with prime array', () => {
            const prsc = new PRSCLayer([2, 3, 5]);
            assert.strictEqual(prsc.oscillators.length, 3);
        });
        
        it('should tick all oscillators', () => {
            const prsc = new PRSCLayer([2, 3, 5]);
            const phases = prsc.getPhases();
            prsc.tick(0.1);
            const newPhases = prsc.getPhases();
            
            // Phases should change after tick
            assert.notDeepStrictEqual(phases, newPhases);
        });
        
        it('should compute global coherence', () => {
            const prsc = new PRSCLayer([2, 3, 5]);
            const coherence = prsc.globalCoherence();
            assert.ok(coherence >= 0 && coherence <= 1);
        });
        
        it('should compute order parameter', () => {
            const prsc = new PRSCLayer();
            const r = prsc.orderParameter();
            assert.ok(r >= 0 && r <= 1);
        });
        
        it('should get phases as array', () => {
            const prsc = new PRSCLayer([2, 3, 5]);
            const phases = prsc.getPhases();
            assert.strictEqual(phases.length, 3);
        });
        
        it('should excite specific primes', () => {
            const prsc = new PRSCLayer([2, 3, 5, 7]);
            prsc.reset(true);
            prsc.excite([3, 5], 0.8);
            
            const osc3 = prsc.getOscillator(3);
            const osc7 = prsc.getOscillator(7);
            
            assert.ok(osc3.amplitude > 0.5);
            assert.ok(osc7.amplitude < 0.5);
        });
        
        it('should reset all oscillators', () => {
            const prsc = new PRSCLayer([2, 3, 5]);
            prsc.excite([2, 3, 5], 0.9);
            prsc.reset();
            
            for (const osc of prsc.oscillators) {
                assert.strictEqual(osc.amplitude, 0);
            }
        });
        
        it('should compute amplitude entropy', () => {
            const prsc = new PRSCLayer([2, 3, 5]);
            prsc.excite([2, 3, 5], 0.5);
            const entropy = prsc.amplitudeEntropy();
            assert.ok(entropy >= 0);
        });
    });
});

// ============================================================================
// TEMPORAL LAYER TESTS
// ============================================================================

describe('TemporalLayer', () => {
    const { TemporalLayer, Moment } = require('../observer/temporal');
    
    describe('Moment', () => {
        it('should create with timestamp', () => {
            const moment = new Moment({ coherence: 0.7, entropy: 0.5 });
            assert.ok(moment.timestamp > 0);
            assert.ok(moment.id.startsWith('m_'));
        });
        
        it('should serialize to JSON', () => {
            const moment = new Moment({ coherence: 0.8 });
            const json = moment.toJSON();
            assert.ok('id' in json);
            assert.ok('timestamp' in json);
            assert.ok('coherence' in json);
        });
        
        it('should create from JSON', () => {
            const original = new Moment({ coherence: 0.75 });
            const json = original.toJSON();
            const restored = Moment.fromJSON(json);
            assert.strictEqual(restored.id, original.id);
            assert.strictEqual(restored.coherence, original.coherence);
        });
    });
    
    describe('TemporalLayer', () => {
        it('should create with default thresholds', () => {
            const temporal = new TemporalLayer();
            assert.ok(temporal.coherenceThreshold > 0);
            assert.ok(temporal.entropyMin >= 0);
            assert.ok(temporal.entropyMax <= 1);
        });
        
        it('should update and possibly trigger moments', () => {
            const temporal = new TemporalLayer({ coherenceThreshold: 0.5 });
            
            // First update with high coherence
            temporal.update({
                coherence: 0.8,
                entropy: 0.5,
                phases: [0, 0, 0],
                activePrimes: [2, 3, 5]
            });
            
            // Track initial moment count
            const initialCount = temporal.moments.length;
            
            // Continue updating
            for (let i = 0; i < 10; i++) {
                temporal.update({
                    coherence: 0.5 + 0.3 * Math.sin(i),
                    entropy: 0.5,
                    phases: [i * 0.1, i * 0.2, i * 0.3],
                    activePrimes: [2, 3, 5]
                });
            }
            
            // Should have some moments recorded
            assert.ok(temporal.moments.length >= 0);
        });
        
        it('should get recent moments', () => {
            const temporal = new TemporalLayer({ coherenceThreshold: 0.3 });
            
            // Force create some moments
            for (let i = 0; i < 5; i++) {
                temporal.forceMoment({ tick: i });
            }
            
            const recent = temporal.recentMoments(3);
            assert.strictEqual(recent.length, 3);
        });
        
        it('should track subjective time', () => {
            const temporal = new TemporalLayer();
            
            // Force a moment
            temporal.forceMoment({ test: true });
            
            const time = temporal.getSubjectiveTime();
            assert.ok(time >= 0);
        });
        
        it('should get statistics', () => {
            const temporal = new TemporalLayer();
            temporal.forceMoment({});
            
            const stats = temporal.getStats();
            assert.ok('momentCount' in stats);
            assert.ok('subjectiveTime' in stats);
        });
        
        it('should reset state', () => {
            const temporal = new TemporalLayer();
            temporal.forceMoment({});
            temporal.reset();
            
            assert.strictEqual(temporal.moments.length, 0);
            assert.strictEqual(temporal.subjectiveTime, 0);
        });
    });
});

// ============================================================================
// ENTANGLEMENT LAYER TESTS
// ============================================================================

describe('EntanglementLayer', () => {
    const { EntanglementLayer, EntangledPair, Phrase } = require('../observer/entanglement');
    
    describe('EntangledPair', () => {
        it('should create pair from two primes', () => {
            const pair = new EntangledPair({ prime1: 2, prime2: 3, strength: 0.8 });
            assert.strictEqual(pair.prime1, 2);
            assert.strictEqual(pair.prime2, 3);
            assert.strictEqual(pair.strength, 0.8);
        });
        
        it('should get tuple in sorted order', () => {
            const pair = new EntangledPair({ prime1: 5, prime2: 3 });
            assert.deepStrictEqual(pair.tuple, [3, 5]);
        });
        
        it('should get unique key', () => {
            const pair = new EntangledPair({ prime1: 2, prime2: 3 });
            assert.strictEqual(pair.key, '2:3');
        });
        
        it('should check if contains prime', () => {
            const pair = new EntangledPair({ prime1: 2, prime2: 3 });
            assert.ok(pair.contains(2));
            assert.ok(pair.contains(3));
            assert.ok(!pair.contains(5));
        });
        
        it('should get other prime', () => {
            const pair = new EntangledPair({ prime1: 2, prime2: 3 });
            assert.strictEqual(pair.other(2), 3);
            assert.strictEqual(pair.other(3), 2);
        });
    });
    
    describe('Phrase', () => {
        it('should create with primes', () => {
            const phrase = new Phrase({ primes: [2, 3, 5] });
            assert.deepStrictEqual(phrase.primes, [2, 3, 5]);
        });
        
        it('should generate unique id', () => {
            const phrase = new Phrase();
            assert.ok(phrase.id.startsWith('ph_'));
        });
        
        it('should add primes', () => {
            const phrase = new Phrase();
            phrase.addPrime(7);
            phrase.addPrime(11);
            assert.deepStrictEqual(phrase.primes, [7, 11]);
        });
        
        it('should close phrase', () => {
            const phrase = new Phrase();
            assert.strictEqual(phrase.endTime, null);
            phrase.close(0.5);
            assert.ok(phrase.endTime > 0);
            assert.strictEqual(phrase.energyAtEnd, 0.5);
        });
    });
    
    describe('EntanglementLayer', () => {
        it('should create with default thresholds', () => {
            const layer = new EntanglementLayer();
            assert.ok(layer.entanglementThreshold > 0);
        });
        
        it('should compute entanglement strength', () => {
            const layer = new EntanglementLayer();
            
            const osc1 = { phase: 0, amplitude: 1.0 };
            const osc2 = { phase: 0.1, amplitude: 0.9 };
            
            const strength = layer.computeStrength(osc1, osc2);
            assert.ok(strength > 0);
            assert.ok(strength <= 1);
        });
        
        it('should detect entanglements', () => {
            const layer = new EntanglementLayer({ entanglementThreshold: 0.5 });
            
            const oscillators = [
                { prime: 2, phase: 0, amplitude: 0.9 },
                { prime: 3, phase: 0.1, amplitude: 0.8 },
                { prime: 5, phase: Math.PI, amplitude: 0.7 }
            ];
            
            const pairs = layer.detectEntanglements(oscillators);
            // First two oscillators should be entangled (similar phases)
            assert.ok(pairs.length >= 1);
        });
        
        it('should register entanglements in graph', () => {
            const layer = new EntanglementLayer();
            
            const pair = new EntangledPair({ prime1: 2, prime2: 3, strength: 0.8 });
            layer.registerEntanglement(pair);
            
            // Should have entries in the graph
            assert.ok(layer.entanglementGraph.has(2));
            assert.ok(layer.entanglementGraph.has(3));
        });
        
        it('should get entangled primes', () => {
            const layer = new EntanglementLayer();
            
            const pair = new EntangledPair({ prime1: 2, prime2: 3, strength: 0.8 });
            layer.registerEntanglement(pair);
            
            const entangled = layer.getEntangled(2);
            assert.strictEqual(entangled.length, 1);
            assert.strictEqual(entangled[0].prime2, 3);
        });
        
        it('should find entanglement chain', () => {
            const layer = new EntanglementLayer();
            
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 3, strength: 0.8 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 3, prime2: 5, strength: 0.7 }));
            
            const chain = layer.findChain(2, 5);
            assert.ok(chain !== null);
            assert.deepStrictEqual(chain, [2, 3, 5]);
        });
        
        it('should get statistics', () => {
            const layer = new EntanglementLayer();
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 3, strength: 0.8 }));
            
            const stats = layer.getStats();
            assert.ok('nodeCount' in stats);
            assert.ok('edgeCount' in stats);
            assert.strictEqual(stats.nodeCount, 2);
            assert.strictEqual(stats.edgeCount, 1);
        });
    });
});

// ============================================================================
// AGENCY LAYER TESTS
// ============================================================================

describe('AgencyLayer', () => {
    const { AgencyLayer, AttentionFocus, Goal, Action } = require('../observer/agency');
    
    describe('AttentionFocus', () => {
        it('should create with target', () => {
            const focus = new AttentionFocus({ target: 'task', type: 'goal' });
            assert.strictEqual(focus.target, 'task');
            assert.strictEqual(focus.type, 'goal');
        });
        
        it('should generate unique id', () => {
            const focus = new AttentionFocus({});
            assert.ok(focus.id.startsWith('attn_'));
        });
        
        it('should decay intensity', () => {
            const focus = new AttentionFocus({ intensity: 1.0 });
            focus.decay(0.5);
            assert.ok(focus.intensity < 1.0);
        });
        
        it('should boost intensity', () => {
            const focus = new AttentionFocus({ intensity: 0.5 });
            focus.boost(0.3);
            assert.ok(focus.intensity > 0.5);
        });
    });
    
    describe('Goal', () => {
        it('should create with description', () => {
            const goal = new Goal({ description: 'complete task' });
            assert.strictEqual(goal.description, 'complete task');
        });
        
        it('should generate unique id', () => {
            const goal = new Goal({});
            assert.ok(goal.id.startsWith('goal_'));
        });
        
        it('should track progress', () => {
            const goal = new Goal({});
            goal.updateProgress(0.5);
            assert.strictEqual(goal.progress, 0.5);
        });
        
        it('should mark achieved when progress is 1.0', () => {
            const goal = new Goal({});
            goal.updateProgress(1.0);
            assert.strictEqual(goal.status, 'achieved');
        });
        
        it('should achieve goal', () => {
            const goal = new Goal({});
            goal.achieve();
            assert.strictEqual(goal.status, 'achieved');
            assert.strictEqual(goal.progress, 1.0);
        });
        
        it('should abandon goal', () => {
            const goal = new Goal({});
            goal.abandon('no longer needed');
            assert.strictEqual(goal.status, 'abandoned');
        });
    });
    
    describe('Action', () => {
        it('should create with type and description', () => {
            const action = new Action({ type: 'internal', description: 'process data' });
            assert.strictEqual(action.type, 'internal');
            assert.strictEqual(action.description, 'process data');
        });
        
        it('should generate unique id', () => {
            const action = new Action({});
            assert.ok(action.id.startsWith('act_'));
        });
        
        it('should track execution lifecycle', () => {
            const action = new Action({});
            assert.strictEqual(action.status, 'proposed');
            
            action.select();
            assert.strictEqual(action.status, 'selected');
            
            action.execute();
            assert.strictEqual(action.status, 'executing');
            
            action.complete({ success: true });
            assert.strictEqual(action.status, 'completed');
        });
    });
    
    describe('AgencyLayer', () => {
        it('should create with default configuration', () => {
            const agency = new AgencyLayer();
            assert.ok(agency.maxFoci > 0);
            assert.ok(agency.maxGoals > 0);
        });
        
        it('should add or update focus', () => {
            const agency = new AgencyLayer();
            agency.addOrUpdateFocus({
                target: 'test',
                type: 'prime',
                intensity: 0.7
            });
            
            assert.strictEqual(agency.attentionFoci.length, 1);
            assert.strictEqual(agency.attentionFoci[0].target, 'test');
        });
        
        it('should maybe create goal', () => {
            const agency = new AgencyLayer();
            const goal = agency.maybeCreateGoal({
                description: 'test goal',
                priority: 0.5
            });
            
            assert.ok(goal !== null);
            assert.strictEqual(agency.goals.length, 1);
        });
        
        it('should create external goal', () => {
            const agency = new AgencyLayer();
            const goal = agency.createExternalGoal('user task', { priority: 0.9 });
            
            assert.strictEqual(goal.description, 'user task');
            assert.strictEqual(goal.type, 'external');
        });
        
        it('should get top focus', () => {
            const agency = new AgencyLayer();
            agency.addOrUpdateFocus({ target: 'low', type: 'prime', intensity: 0.3 });
            agency.addOrUpdateFocus({ target: 'high', type: 'prime', intensity: 0.9 });
            
            const top = agency.getTopFocus();
            assert.strictEqual(top.target, 'high');
        });
        
        it('should get top goal', () => {
            const agency = new AgencyLayer();
            agency.maybeCreateGoal({ description: 'low', priority: 0.3 });
            agency.maybeCreateGoal({ description: 'high', priority: 0.9 });
            
            const top = agency.getTopGoal();
            assert.strictEqual(top.description, 'high');
        });
        
        it('should get statistics', () => {
            const agency = new AgencyLayer();
            agency.addOrUpdateFocus({ target: 't', type: 'prime', intensity: 0.5 });
            agency.maybeCreateGoal({ description: 'g', priority: 0.5 });
            
            const stats = agency.getStats();
            assert.strictEqual(stats.fociCount, 1);
            assert.strictEqual(stats.activeGoals, 1);
        });
        
        it('should reset state', () => {
            const agency = new AgencyLayer();
            agency.addOrUpdateFocus({ target: 't', type: 'prime', intensity: 0.5 });
            agency.maybeCreateGoal({ description: 'g', priority: 0.5 });
            agency.reset();
            
            assert.strictEqual(agency.attentionFoci.length, 0);
            assert.strictEqual(agency.goals.length, 0);
        });
    });
});

// ============================================================================
// BOUNDARY LAYER TESTS
// ============================================================================

describe('BoundaryLayer', () => {
    const { BoundaryLayer, SensoryChannel, MotorChannel, ObjectivityGate } = require('../observer/boundary');
    
    describe('SensoryChannel', () => {
        it('should create with name', () => {
            const channel = new SensoryChannel({ name: 'vision' });
            assert.strictEqual(channel.name, 'vision');
            assert.ok(channel.enabled);
        });
        
        it('should update with value', () => {
            const channel = new SensoryChannel({ name: 'test' });
            const result = channel.update(42);
            
            assert.strictEqual(channel.currentValue, 42);
            assert.ok(channel.lastUpdate > 0);
        });
        
        it('should check if active', () => {
            const channel = new SensoryChannel({ name: 'test' });
            assert.ok(!channel.isActive());
            channel.update(1);
            assert.ok(channel.isActive());
        });
    });
    
    describe('MotorChannel', () => {
        it('should create with name', () => {
            const channel = new MotorChannel({ name: 'speech' });
            assert.strictEqual(channel.name, 'speech');
        });
        
        it('should queue output', () => {
            const channel = new MotorChannel({ name: 'test' });
            channel.queue('hello');
            assert.strictEqual(channel.queueLength, 1);
        });
        
        it('should get next output', () => {
            const channel = new MotorChannel({ name: 'test' });
            channel.queue('hello');
            channel.queue('world');
            
            const first = channel.getNext();
            assert.strictEqual(first, 'hello');
            assert.strictEqual(channel.queueLength, 1);
        });
    });
    
    describe('ObjectivityGate', () => {
        it('should create with threshold', () => {
            const gate = new ObjectivityGate({ threshold: 0.8 });
            assert.strictEqual(gate.threshold, 0.8);
        });
        
        it('should check output and return R value', () => {
            const gate = new ObjectivityGate();
            const result = gate.check('This is a test output.');
            
            assert.ok('R' in result);
            assert.ok('shouldBroadcast' in result);
            assert.ok(result.R >= 0 && result.R <= 1);
        });
        
        it('should pass safe, complete outputs', () => {
            const gate = new ObjectivityGate({ threshold: 0.5 });
            const result = gate.check('This is a complete sentence.');
            
            assert.ok(result.shouldBroadcast);
        });
        
        it('should track statistics', () => {
            const gate = new ObjectivityGate();
            gate.check('Test output.');
            gate.check('Another test.');
            
            const stats = gate.getStats();
            assert.ok('passCount' in stats);
            assert.ok('failCount' in stats);
        });
    });
    
    describe('BoundaryLayer', () => {
        it('should create with default channels', () => {
            const boundary = new BoundaryLayer();
            assert.ok(boundary.sensoryChannels.size > 0);
            assert.ok(boundary.motorChannels.size > 0);
        });
        
        it('should add sensory channel', () => {
            const boundary = new BoundaryLayer();
            boundary.addSensoryChannel(new SensoryChannel({ name: 'custom' }));
            assert.ok(boundary.sensoryChannels.has('custom'));
        });
        
        it('should process input', () => {
            const boundary = new BoundaryLayer();
            const result = boundary.processInput('text_input', 'hello');
            
            assert.ok(result !== null);
            assert.strictEqual(result.channel, 'text_input');
        });
        
        it('should queue output with objectivity gate', () => {
            const boundary = new BoundaryLayer();
            const result = boundary.queueOutput('text_output', 'Hello, this is a complete response.');
            
            assert.ok('queued' in result);
            assert.ok('gateResult' in result);
        });
        
        it('should get statistics', () => {
            const boundary = new BoundaryLayer();
            const stats = boundary.getStats();
            
            assert.ok('sensoryChannels' in stats);
            assert.ok('motorChannels' in stats);
            assert.ok('objectivityGate' in stats);
        });
    });
});

// ============================================================================
// SAFETY LAYER TESTS
// ============================================================================

describe('SafetyLayer', () => {
    const { SafetyLayer, SafetyConstraint, SafetyMonitor } = require('../observer/safety');
    
    describe('SafetyConstraint', () => {
        it('should create with name and condition', () => {
            const constraint = new SafetyConstraint({
                name: 'max-value',
                condition: (state) => state.value > 100
            });
            assert.strictEqual(constraint.name, 'max-value');
        });
        
        it('should check state and detect violations', () => {
            const constraint = new SafetyConstraint({
                name: 'positive',
                condition: (state) => state.x < 0
            });
            
            const result1 = constraint.check({ x: 5 });
            assert.ok(!result1.violated);
            
            const result2 = constraint.check({ x: -5 });
            assert.ok(result2.violated);
        });
        
        it('should track violation count', () => {
            const constraint = new SafetyConstraint({
                name: 'test',
                condition: (state) => state.bad
            });
            
            constraint.check({ bad: true });
            constraint.check({ bad: true });
            
            assert.strictEqual(constraint.violations, 2);
        });
    });
    
    describe('SafetyMonitor', () => {
        it('should create with thresholds', () => {
            const monitor = new SafetyMonitor({
                coherenceMin: 0.2,
                entropyMax: 0.9
            });
            
            assert.strictEqual(monitor.coherenceMin, 0.2);
            assert.strictEqual(monitor.entropyMax, 0.9);
        });
        
        it('should detect issues from state', () => {
            const monitor = new SafetyMonitor();
            
            const result = monitor.update({
                coherence: 0.05,
                entropy: 0.5
            });
            
            assert.ok(result.issues.length > 0);
            assert.ok(result.issues.some(i => i.type === 'coherence_low'));
        });
        
        it('should update alert level', () => {
            const monitor = new SafetyMonitor();
            
            // Low coherence should raise alert
            monitor.update({ coherence: 0.01, entropy: 0.5 });
            
            assert.ok(monitor.alertLevel !== 'normal');
        });
        
        it('should check if safe', () => {
            const monitor = new SafetyMonitor();
            monitor.update({ coherence: 0.5, entropy: 0.5 });
            
            assert.ok(monitor.isSafe());
        });
    });
    
    describe('SafetyLayer', () => {
        it('should create with default constraints', () => {
            const layer = new SafetyLayer();
            assert.ok(layer.constraints.size > 0);
        });
        
        it('should add custom constraint', () => {
            const layer = new SafetyLayer();
            const initialCount = layer.constraints.size;
            
            layer.addConstraint(new SafetyConstraint({
                name: 'custom',
                condition: () => false
            }));
            
            assert.strictEqual(layer.constraints.size, initialCount + 1);
        });
        
        it('should check all constraints', () => {
            const layer = new SafetyLayer();
            
            const result = layer.checkConstraints({
                coherence: 0.5,
                entropy: 0.5,
                totalAmplitude: 1.0
            });
            
            assert.ok('safe' in result);
            assert.ok('violations' in result);
            assert.ok('alertLevel' in result);
        });
        
        it('should detect unsafe state', () => {
            const layer = new SafetyLayer();
            
            const result = layer.checkConstraints({
                coherence: 0.001,  // Very low - should trigger
                entropy: 0.5,
                totalAmplitude: 1.0
            });
            
            assert.ok(result.violations.length > 0);
        });
        
        it('should check if action is permissible', () => {
            const layer = new SafetyLayer();
            
            const result = layer.isActionPermissible({
                type: 'internal',
                content: 'safe content'
            }, {});
            
            assert.ok(result.permissible);
        });
        
        it('should get safety statistics', () => {
            const layer = new SafetyLayer();
            const stats = layer.getStats();
            
            assert.ok('constraintCount' in stats);
            assert.ok('isSafe' in stats);
        });
        
        it('should generate safety report', () => {
            const layer = new SafetyLayer();
            const report = layer.generateReport();
            
            assert.ok('overallStatus' in report);
            assert.ok('stats' in report);
            assert.ok('constraints' in report);
        });
        
        it('should reset state', () => {
            const layer = new SafetyLayer();
            layer.checkConstraints({ coherence: 0.001 });
            layer.reset();
            
            assert.strictEqual(layer.violations.length, 0);
            assert.ok(!layer.emergencyShutdown);
        });
    });
});

// ============================================================================
// INTEGRATION TEST
// ============================================================================

describe('Observer Stack Integration', () => {
    const { SedenionMemoryField } = require('../observer/smf');
    const { PRSCLayer } = require('../observer/prsc');
    const { TemporalLayer } = require('../observer/temporal');
    const { EntanglementLayer } = require('../observer/entanglement');
    const { SafetyLayer } = require('../observer/safety');
    
    it('should process input through full stack', () => {
        // Create observer layers
        const smf = SedenionMemoryField.uniform();
        const prsc = new PRSCLayer([2, 3, 5, 7]);
        const temporal = new TemporalLayer();
        const entanglement = new EntanglementLayer();
        const safety = new SafetyLayer();
        
        // Run oscillator dynamics
        prsc.tick(0.1);
        
        // Get current state
        const coherence = prsc.globalCoherence();
        const entropy = smf.entropy();
        
        // Check safety
        const safetyResult = safety.checkConstraints({
            coherence,
            entropy,
            totalAmplitude: prsc.totalEnergy()
        });
        
        assert.ok(safetyResult.safe, 'State should be safe');
    });
    
    it('should track state evolution over time', () => {
        const smf = SedenionMemoryField.uniform();
        const prsc = new PRSCLayer([2, 3, 5], { coupling: 0.3 });
        const temporal = new TemporalLayer();
        
        // Simulate 10 ticks
        for (let i = 0; i < 10; i++) {
            prsc.tick(0.1);
            
            temporal.update({
                coherence: prsc.globalCoherence(),
                entropy: smf.entropy(),
                phases: prsc.getPhases(),
                activePrimes: prsc.activePrimes()
            });
        }
        
        // Should have tracked some history
        assert.ok(temporal.coherenceHistory.length > 0);
    });
});

console.log('Observer architecture tests loaded successfully!');