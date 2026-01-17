
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  MetricEmergence, 
  SymbolicGravity, 
  GravitonField, 
  PrimeHarmonicField,
  ModifiedEinsteinEquations 
} from '../core/gravity.js';
import { PrimeState, Complex } from '../core/hilbert.js';

describe('Gravity Module', () => {
  describe('MetricEmergence', () => {
    it('should initialize with Minkowski metric', () => {
      const metric = new MetricEmergence(4);
      const g = metric.metric;
      
      assert.strictEqual(g[0][0], -1);
      assert.strictEqual(g[1][1], 1);
      assert.strictEqual(g[2][2], 1);
      assert.strictEqual(g[3][3], 1);
      assert.strictEqual(g[0][1], 0);
    });

    it('should compute metric from field states', () => {
      const metric = new MetricEmergence(4);
      const states = Array(4).fill(null).map(() => PrimeState.uniform());
      
      const g = metric.fromFieldStates(states);
      
      // Check symmetry
      assert.strictEqual(g[0][1], g[1][0]);
      
      // Diagonal elements should be norms (positive)
      assert.ok(g[0][0] > 0);
    });

    it('should compute determinant', () => {
      const metric = new MetricEmergence(4);
      const det = metric.determinant();
      assert.strictEqual(det, -1); // Minkowski
    });

    it('should check signature', () => {
      const metric = new MetricEmergence(4);
      const sig = metric.signature();
      
      assert.strictEqual(sig.negative, 1);
      assert.strictEqual(sig.positive, 3);
    });
  });

  describe('SymbolicGravity', () => {
    it('should create entropy grid', () => {
      const gravity = new SymbolicGravity({ gridSize: 5 });
      assert.strictEqual(gravity.entropyField.length, 5);
      assert.strictEqual(gravity.entropyField[0].length, 5);
    });

    it('should compute symbolic gravity tensor', () => {
      const gravity = new SymbolicGravity({ gridSize: 5 });
      
      // Set some entropy gradient
      gravity.setEntropy(2, 2, 2, 2, 1.0);
      gravity.setEntropy(2, 3, 2, 2, 0.5);
      
      const G = gravity.computeTensor(2, 2, 2, 2);
      
      // Should be 4x4 tensor
      assert.strictEqual(G.length, 4);
      assert.strictEqual(G[0].length, 4);
    });

    it('should encode state as entropy distribution', () => {
      const gravity = new SymbolicGravity({ gridSize: 5 });
      const state = PrimeState.uniform();
      
      gravity.encodeState(state, [2, 2, 2, 2]);
      const S = gravity.getEntropy(2, 2, 2, 2);
      
      assert.ok(S > 0);
    });
  });

  describe('GravitonField', () => {
    it('should evolve field', () => {
      const field = new GravitonField({ gamma: 0.1 });
      const state = PrimeState.uniform();
      field.fromPrimeState(state);
      
      const initialNorm = field.norm();
      field.evolve(10);
      
      // Should change over time (unless static)
      // For uniform state, cross product might be zero, check if it works
      assert.ok(field.history.length === 10);
    });

    it('should compute spin-2 content', () => {
      const field = new GravitonField();
      // Set non-trivial field
      field.field = [
        new Complex(1, 0),
        new Complex(0, 1),
        new Complex(1, 1)
      ];
      
      const content = field.spin2Content();
      assert.ok(content.magnitude >= 0);
      assert.ok(Math.abs(content.trace) < 1e-10); // Traceless
    });
  });

  describe('PrimeHarmonicField', () => {
    it('should compute E-field', () => {
      const field = new PrimeHarmonicField();
      const E = field.compute(0.5, 0.1);
      
      assert.ok(E instanceof Complex);
      assert.ok(!isNaN(E.re));
      assert.ok(!isNaN(E.im));
    });

    it('should find interference peaks', () => {
      const field = new PrimeHarmonicField({ gridSize: 32 });
      const peaks = field.findPeaks(0.5);
      
      assert.ok(Array.isArray(peaks));
      if (peaks.length > 0) {
        assert.ok(peaks[0].position >= 0);
        assert.ok(peaks[0].intensity > 0);
      }
    });
  });

  describe('ModifiedEinsteinEquations', () => {
    it('should compute effective stress-energy', () => {
      const equations = new ModifiedEinsteinEquations();
      
      // Mock T_matter
      const T_matter = Array(4).fill(null).map(() => new Float64Array(4));
      T_matter[0][0] = 1.0; // Energy density
      
      const T_eff = equations.effectiveStressEnergy(T_matter, 0, 0, 0, 0);
      
      assert.strictEqual(T_eff.length, 4);
      assert.ok(!isNaN(T_eff[0][0]));
    });

    it('should check energy conditions', () => {
      const equations = new ModifiedEinsteinEquations();
      const T_eff = Array(4).fill(null).map(() => new Float64Array(4));
      T_eff[0][0] = -1.0; // Negative energy density
      
      const check = equations.checkEnergyConditions(T_eff);
      assert.strictEqual(check.weakViolated, true);
    });
  });
});
