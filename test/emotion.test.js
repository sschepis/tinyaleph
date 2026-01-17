
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  EMOTIONAL_TEMPLATES, 
  createEmotionalState, 
  FeelingOperator, 
  ConsciousnessPrimacy, 
  EmotionalSpectrometer 
} from '../core/emotion.js';
import { PrimeState, Complex } from '../core/hilbert.js';

describe('Emotion Module', () => {
  describe('createEmotionalState', () => {
    it('should create a valid PrimeState for a known emotion', () => {
      const state = createEmotionalState('joy');
      assert.ok(state instanceof PrimeState);
      assert.ok(Math.abs(state.norm() - 1.0) < 1e-10);
      
      // Check if template primes have significant amplitude
      const template = EMOTIONAL_TEMPLATES.joy;
      for (const p of template.primes) {
        assert.ok(state.get(p).norm() > 0.1);
      }
    });

    it('should throw error for unknown emotion', () => {
      assert.throws(() => createEmotionalState('unknown'), /Unknown emotion/);
    });
  });

  describe('FeelingOperator', () => {
    const operator = new FeelingOperator();

    it('should measure emotional resonance', () => {
      const joyState = createEmotionalState('joy');
      const resonance = operator.measure(joyState, 'joy');
      assert.ok(resonance > 0.8); // Should be highly resonant with itself
      
      const fearState = createEmotionalState('fear');
      const crossResonance = operator.measure(fearState, 'joy');
      assert.ok(crossResonance < resonance); // Should be less resonant with different emotion
    });

    it('should analyze full spectrum', () => {
      const state = createEmotionalState('love');
      const spectrum = operator.spectrum(state);
      
      assert.strictEqual(spectrum.dominant, 'love');
      assert.ok(spectrum.scores.love > 0.8);
      assert.ok(spectrum.scores.fear < 0.5);
    });

    it('should apply feeling operator to state', () => {
      const state = PrimeState.uniform();
      const transformed = operator.apply(state, 'peace', 0.5);
      
      assert.ok(transformed instanceof PrimeState);
      assert.ok(Math.abs(transformed.norm() - 1.0) < 1e-10);
      
      // Should move closer to target emotion
      const resonance = operator.measure(transformed, 'peace');
      const originalResonance = operator.measure(state, 'peace');
      assert.ok(resonance > originalResonance);
    });

    it('should transition between emotions', () => {
      const start = createEmotionalState('anger');
      const mid = operator.transition(start, 'anger', 'peace', 0.5);
      
      const angerScore = operator.measure(mid, 'anger');
      const peaceScore = operator.measure(mid, 'peace');
      
      assert.ok(angerScore > 0 && angerScore < 1);
      assert.ok(peaceScore > 0 && peaceScore < 1);
    });
  });

  describe('ConsciousnessPrimacy', () => {
    const primacy = new ConsciousnessPrimacy();

    it('should calculate primacy metric', () => {
      const state = createEmotionalState('awe');
      const result = primacy.calculate(state);
      
      assert.ok(result.primacy >= 0 && result.primacy <= 1);
      assert.ok(result.components.F >= 0);
      assert.ok(result.components.R >= 0);
      assert.ok(result.components.C >= 0);
      assert.ok(result.components.Gamma >= 0);
      assert.ok(result.interpretation.length > 0);
    });

    it('should track evolution', () => {
      const state = createEmotionalState('curiosity');
      const evolver = (s) => s; // Identity evolution
      const trajectory = primacy.trackEvolution(state, evolver, 3);
      
      assert.strictEqual(trajectory.length, 3);
      assert.strictEqual(trajectory[0].step, 0);
      assert.ok(trajectory[0].primacy > 0);
    });
  });

  describe('EmotionalSpectrometer', () => {
    const spectrometer = new EmotionalSpectrometer();

    it('should analyze state properties', () => {
      const state = createEmotionalState('grief');
      const analysis = spectrometer.analyze(state);
      
      assert.strictEqual(analysis.dominant, 'grief');
      assert.ok(analysis.entropy > 0);
      assert.ok(analysis.coherence >= 0 && analysis.coherence <= 1);
      assert.ok(analysis.valence >= -1 && analysis.valence <= 1);
      assert.ok(analysis.arousal >= 0 && analysis.arousal <= 1);
      assert.ok(analysis.quadrant);
    });

    it('should analyze text input', () => {
      const analysis = spectrometer.analyze("I am very happy and excited!");
      assert.ok(analysis.dominant);
    });

    it('should compare emotional similarity', () => {
      const s1 = createEmotionalState('joy');
      const s2 = createEmotionalState('love');
      const comparison = spectrometer.compare(s1, s2);
      
      assert.ok(comparison.similarity >= 0 && comparison.similarity <= 1);
      assert.ok(comparison.analysis1);
      assert.ok(comparison.analysis2);
    });
  });
});
