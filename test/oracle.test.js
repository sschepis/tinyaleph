
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  HEXAGRAMS, 
  generateAllHexagrams, 
  HexagramAttractor, 
  OracleSystem, 
  ClauseProjector, 
  NPResonanceEncoder,
  SemanticCompressor 
} from '../core/oracle.js';
import { PrimeState } from '../core/hilbert.js';

describe('Oracle Module', () => {
  describe('Hexagrams', () => {
    it('should have predefined hexagrams', () => {
      assert.ok(HEXAGRAMS[1]); // Qián
      assert.ok(HEXAGRAMS[2]); // Kūn
      assert.strictEqual(HEXAGRAMS[1].name, 'Qián');
    });

    it('should generate all 64 hexagrams', () => {
      const all = generateAllHexagrams();
      assert.strictEqual(Object.keys(all).length, 64);
      assert.ok(all[64]);
    });
  });

  describe('HexagramAttractor', () => {
    it('should create attractor state', () => {
      const attractor = new HexagramAttractor(1);
      assert.ok(attractor.state instanceof PrimeState);
      assert.ok(attractor.hexagram.primes.length > 0);
    });

    it('should calculate distance', () => {
      const attractor = new HexagramAttractor(1);
      const state = attractor.state.clone();
      
      const dist = attractor.distance(state);
      assert.ok(dist < 1e-10); // Should be 0 for identical state
      
      const other = new HexagramAttractor(2);
      const dist2 = attractor.distance(other.state);
      assert.ok(dist2 > 0);
    });

    it('should project state', () => {
      const attractor = new HexagramAttractor(1);
      const state = PrimeState.uniform();
      
      const projected = attractor.project(state, 0.5);
      const distBefore = attractor.distance(state);
      const distAfter = attractor.distance(projected);
      
      assert.ok(distAfter < distBefore);
    });
  });

  describe('OracleSystem', () => {
    const oracle = new OracleSystem({ numAttractors: 8, maxIterations: 10 });

    it('should find nearest attractor', () => {
      const state = PrimeState.uniform();
      const nearest = oracle.findNearestAttractor(state);
      
      assert.ok(nearest.attractor);
      assert.ok(nearest.distance >= 0);
    });

    it('should perform oracle query', () => {
      const result = oracle.query("What is the meaning of life?");
      
      assert.ok(result.attractor);
      assert.ok(result.attractor.number >= 1);
      assert.ok(result.finalState);
    });

    it('should perform divination', () => {
      const result = oracle.divine("Should I proceed?");
      
      assert.ok(result.interpretation);
      assert.ok(result.question);
    });
  });

  describe('NPResonanceEncoder', () => {
    it('should encode SAT problem', () => {
      const encoder = new NPResonanceEncoder(['x1', 'x2']);
      encoder.addClause([{ var: 'x1', negated: false }, { var: 'x2', negated: true }]);
      
      assert.strictEqual(encoder.variables.length, 2);
      assert.strictEqual(encoder.clauses.length, 1);
    });

    it('should parse CNF string', () => {
      const encoder = new NPResonanceEncoder([]);
      encoder.fromCNF('(A OR B) AND (NOT B OR C)');
      
      assert.strictEqual(encoder.clauses.length, 2);
      assert.ok(encoder.variables.includes('A'));
      assert.ok(encoder.variables.includes('B'));
      assert.ok(encoder.variables.includes('C'));
    });

    it('should solve simple SAT', () => {
      const encoder = new NPResonanceEncoder(['x']);
      // x MUST be true
      encoder.addClause([{ var: 'x', negated: false }]);
      
      const solution = encoder.solve(20);
      
      if (solution.satisfiable) {
        assert.strictEqual(solution.assignment.x, true);
      }
    });

    it('should handle UNSAT', () => {
      const encoder = new NPResonanceEncoder(['x']);
      // x AND NOT x (impossible)
      encoder.addClause([{ var: 'x', negated: false }]);
      encoder.addClause([{ var: 'x', negated: true }]);
      
      const solution = encoder.solve(20);
      assert.strictEqual(solution.satisfiable, false);
    });
  });

  describe('SemanticCompressor', () => {
    const compressor = new SemanticCompressor({ numAttractors: 8 });

    it('should compress text', () => {
      const result = compressor.compress("Hello world");
      
      assert.ok(result.code);
      assert.ok(result.attractor);
    });

    it('should find similar items', () => {
      compressor.compress("Apple");
      compressor.compress("Banana");
      
      const result = compressor.findSimilar("Apple");
      assert.ok(Array.isArray(result.exact));
      assert.ok(result.exact.includes("Apple"));
    });
  });
});
