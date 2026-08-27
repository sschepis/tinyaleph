/**
 * Honesty Regression Tests (Wave 1C)
 *
 * Regression coverage for the "fake math" and dead-code fixes across
 * core modules. Each block pins the new honest contract:
 *  - E8 simple roots match the standard Dynkin diagram / Cartan matrix
 *  - alpha-equivalence in the lambda layer is capture-avoiding
 *  - entanglement detection reflects actual superposition
 *  - eval-mode dropout is deterministic
 *  - Birkhoff projection is live and doubly-stochastic
 *  - oversized SAT instances are rejected explicitly
 *  - the Enochian sedenion table agrees with fano.js
 *  - golden-axis mapping is a pure function
 *  - the graviton step is non-trivial
 *  - FUSE reductions register a size decrease
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { E8RootSystem } from '../core/atlas/e8.js';

import { VarExpr, LamExpr, AppExpr } from '../core/lambda.js';

import { PrimeEntangledPair } from '../core/nonlocal.js';

import { SparsePrimeState } from '../core/rformer.js';
import { PrimeFFN } from '../core/rformer-layers.js';
import { CRTResonantAttention } from '../core/rformer-crt.js';

import { NPResonanceEncoder } from '../core/oracle.js';

import { sedenionMultTable, SedenionElement } from '../core/enochian-vocabulary.js';
import { sedenionMultiplyIndex } from '../core/fano.js';

import quaternionSemantics from '../core/quaternion-semantics.js';

import { GravitonField } from '../core/gravity.js';

import { FUSE, CHAIN, N, NounSentence, SeqSentence, ImplSentence } from '../core/types.js';
import { ProofGenerator, ReductionSystem, testLocalConfluence, termSize } from '../core/reduction.js';

import { AlexanderModule, SignatureExtractor } from '../core/alexander-module.js';

import { FreeEnergyDynamics } from '../core/topology.js';

// ============================================================================
// E8 SIMPLE ROOTS
// ============================================================================

describe('E8 simple roots (honesty fix)', () => {
  const STANDARD_CARTAN = [
    [ 2, -1,  0,  0,  0,  0,  0,  0],
    [-1,  2, -1,  0,  0,  0,  0,  0],
    [ 0, -1,  2, -1,  0,  0,  0,  0],
    [ 0,  0, -1,  2, -1,  0,  0,  0],
    [ 0,  0,  0, -1,  2, -1,  0,  0],
    [ 0,  0,  0,  0, -1,  2, -1, -1],
    [ 0,  0,  0,  0,  0, -1,  2,  0],
    [ 0,  0,  0,  0,  0, -1,  0,  2]
  ];

  it('should return exactly 8 simple roots', () => {
    const e8 = new E8RootSystem();
    const roots = e8.getSimpleRoots();
    assert.strictEqual(roots.length, 8);
  });

  it('should match the standard Dynkin-diagram vectors', () => {
    const e8 = new E8RootSystem();
    const roots = e8.getSimpleRoots();

    // α_i = e_i − e_{i+1} for i = 1..7
    for (let i = 0; i < 7; i++) {
      assert.strictEqual(roots[i][i], 1);
      assert.strictEqual(roots[i][i + 1], -1);
      for (let k = 0; k < 8; k++) {
        if (k !== i && k !== i + 1) assert.strictEqual(roots[i][k], 0);
      }
    }

    // α_8 = e_7 + e_8
    assert.strictEqual(roots[7][6], 1);
    assert.strictEqual(roots[7][7], 1);
    for (let k = 0; k < 6; k++) assert.strictEqual(roots[7][k], 0);
  });

  it('should produce the standard E8 Cartan matrix', () => {
    const e8 = new E8RootSystem();
    const roots = e8.getSimpleRoots();

    const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        assert.strictEqual(
          dot(roots[i], roots[j]),
          STANDARD_CARTAN[i][j],
          `Cartan entry (${i},${j}) mismatch`
        );
      }
    }
  });
});

// ============================================================================
// LAMBDA ALPHA-EQUIVALENCE
// ============================================================================

describe('Lambda alpha-equivalence (honesty fix)', () => {
  const lam = (param, body) => new LamExpr(param, body);
  const v = (name) => new VarExpr(name);

  it('should identify λx.x ≡ λy.y (renaming of a bound variable)', () => {
    assert.strictEqual(lam('x', v('x')).alphaEquals(lam('y', v('y'))), true);
  });

  it('should reject λx.xy ≢ λx.xx', () => {
    const e1 = lam('x', new AppExpr(v('x'), v('y')));
    const e2 = lam('x', new AppExpr(v('x'), v('x')));
    assert.strictEqual(e1.alphaEquals(e2), false);
  });

  it('should be symmetric', () => {
    const a = lam('x', v('x'));
    const b = lam('y', v('y'));
    assert.strictEqual(a.alphaEquals(b), b.alphaEquals(a));
  });

  it('should handle nested binders', () => {
    const nested1 = lam('x', lam('y', v('x')));
    const nested2 = lam('a', lam('b', v('a')));
    assert.strictEqual(nested1.alphaEquals(nested2), true);

    const nested3 = lam('x', lam('y', v('y')));
    const nested4 = lam('a', lam('b', v('a')));
    assert.strictEqual(nested3.alphaEquals(nested4), false);
  });

  it('should distinguish free from bound occurrences (capture avoidance)', () => {
    // λy.x has x FREE; λx.x has x BOUND — not equivalent
    const freeX = lam('y', v('x'));
    const boundX = lam('x', v('x'));
    assert.strictEqual(freeX.alphaEquals(boundX), false);
  });
});

// ============================================================================
// NONLOCAL ENTANGLEMENT DETECTION
// ============================================================================

describe('PrimeEntangledPair entanglement detection (honesty fix)', () => {
  it('should report a fresh pair as entangled', () => {
    const pair = new PrimeEntangledPair(2, 3);
    assert.strictEqual(pair.isEntangled(), true);
  });

  it('should report a collapsed pair as NOT entangled', () => {
    const pair = new PrimeEntangledPair(2, 3);
    pair.measureA(); // collapses both subsystems
    assert.strictEqual(pair.isEntangled(), false);
  });

  it('should report entanglement again after reset', () => {
    const pair = new PrimeEntangledPair(2, 3);
    pair.measureA();
    pair.reset();
    assert.strictEqual(pair.isEntangled(), true);
  });
});

// ============================================================================
// RFORMER-LAYERS: EVAL-MODE DETERMINISM
// ============================================================================

describe('PrimeFFN eval determinism (honesty fix)', () => {
  it('should produce identical outputs in eval mode across calls', () => {
    const ffn = new PrimeFFN({ numPrimes: 512, dropout: 0.5, activation: 'relu' });
    ffn.eval();

    const input = SparsePrimeState.fromHash('determinism-check', 512, 16);
    const out1 = ffn.forward(input);
    const out2 = ffn.forward(input);

    const primes1 = out1.getActivePrimes().sort((a, b) => a - b);
    const primes2 = out2.getActivePrimes().sort((a, b) => a - b);
    assert.deepStrictEqual(primes1, primes2);

    for (const p of primes1) {
      const a1 = out1.get(p).amplitude;
      const a2 = out2.get(p).amplitude;
      assert.ok(Math.abs(a1.re - a2.re) < 1e-12, `re mismatch for prime ${p}`);
      assert.ok(Math.abs(a1.im - a2.im) < 1e-12, `im mismatch for prime ${p}`);
    }
  });

  it('should keep dropout off by default (training flag defaults false)', () => {
    const ffn = new PrimeFFN({ numPrimes: 512, dropout: 0.5 });
    assert.strictEqual(ffn.training, false);

    const input = SparsePrimeState.fromHash('default-mode', 512, 16);
    const out1 = ffn.forward(input);
    const out2 = ffn.forward(input);
    const primes1 = out1.getActivePrimes().sort((a, b) => a - b);
    const primes2 = out2.getActivePrimes().sort((a, b) => a - b);
    assert.deepStrictEqual(primes1, primes2);
  });
});

// ============================================================================
// RFORMER-CRT: BIRKHOFF PROJECTION IS LIVE
// ============================================================================

describe('Birkhoff projection (honesty fix)', () => {
  it('should configure BirkhoffProjector with numeric (iterations, epsilon)', () => {
    const attention = new CRTResonantAttention({
      numHeads: 2,
      numPrimes: 512,
      activeK: 16,
      sinkhornIterations: 20,
      birkhoffTolerance: 1e-10
    });

    assert.strictEqual(typeof attention.birkhoffProjector.iterations, 'number');
    assert.strictEqual(attention.birkhoffProjector.iterations, 20);
    assert.strictEqual(typeof attention.birkhoffProjector.epsilon, 'number');
  });

  it('should produce a doubly-stochastic matrix (row and column sums ≈ 1)', () => {
    const attention = new CRTResonantAttention({
      numHeads: 2,
      numPrimes: 512,
      activeK: 16,
      sinkhornIterations: 50
    });

    const matrix = [
      [0.9, 0.4, 0.1],
      [0.2, 1.0, 0.3],
      [0.5, 0.1, 0.8]
    ];

    const projected = attention.birkhoffProjector.project(matrix);

    assert.ok(Array.isArray(projected));
    assert.strictEqual(projected.length, 3);

    for (let i = 0; i < 3; i++) {
      const rowSum = projected[i].reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(rowSum - 1) < 1e-3, `row ${i} sum ${rowSum}`);
    }
    for (let j = 0; j < 3; j++) {
      const colSum = projected.reduce((a, row) => a + row[j], 0);
      assert.ok(Math.abs(colSum - 1) < 1e-3, `col ${j} sum ${colSum}`);
    }
  });

  it('should use the projected matrix in the attention blend', () => {
    const attention = new CRTResonantAttention({
      numHeads: 2,
      numPrimes: 512,
      activeK: 16,
      sinkhornIterations: 20
    });

    const query = SparsePrimeState.fromHash('birkhoff-query', 512, 16);
    const keys = [
      SparsePrimeState.fromHash('birkhoff-k1', 512, 16),
      SparsePrimeState.fromHash('birkhoff-k2', 512, 16),
      SparsePrimeState.fromHash('birkhoff-k3', 512, 16)
    ];
    const values = keys;

    const result = attention.forward(query, keys, values);

    for (const headWeights of result.attentionWeights) {
      const sum = headWeights.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1.0) < 1e-9, `head weight sum ${sum} should be 1`);
      assert.ok(headWeights.every(w => Number.isFinite(w) && w >= 0));
    }
  });
});

// ============================================================================
// ORACLE: UNSUPPORTED INSTANCE SIZE
// ============================================================================

describe('NPResonanceEncoder unsupported size (honesty fix)', () => {
  it('should reject instances above the supported size explicitly', () => {
    const variables = Array.from({ length: 14 }, (_, i) => `x${i}`);
    const encoder = new NPResonanceEncoder(variables);
    const solution = encoder.solve(5);

    assert.strictEqual(solution.satisfiable, null);
    assert.strictEqual(solution.error, 'unsupported instance size');
    assert.strictEqual(solution.variables, 14);
    assert.strictEqual(solution.maxSupportedVariables, 13);
  });

  it('should still solve small instances', () => {
    const encoder = new NPResonanceEncoder(['x']);
    encoder.addClause([{ var: 'x', negated: false }]);
    const solution = encoder.solve(20);
    assert.ok(solution.satisfiable === true || solution.satisfiable === false);
  });
});

// ============================================================================
// ENOCHIAN SEDENION TABLE CONSISTENCY WITH FANO
// ============================================================================

describe('Sedenion multiplication table consistency (honesty fix)', () => {
  it('should agree with fano.js sedenionMultiplyIndex everywhere', () => {
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        assert.deepStrictEqual(
          sedenionMultTable(i, j),
          sedenionMultiplyIndex(i, j),
          `table mismatch at (${i},${j})`
        );
      }
    }
  });

  it('should compute e3·e5 consistently with fano', () => {
    const [k1, s1] = sedenionMultTable(3, 5);
    const [k2, s2] = sedenionMultiplyIndex(3, 5);
    assert.strictEqual(k1, k2);
    assert.strictEqual(s1, s2);

    // And the SedenionElement multiplication must use that table
    const e3 = new SedenionElement(new Array(16).fill(0).map((_, i) => (i === 3 ? 1 : 0)));
    const e5 = new SedenionElement(new Array(16).fill(0).map((_, i) => (i === 5 ? 1 : 0)));
    const product = e3.multiply(e5);
    assert.strictEqual(product.components[k1], s1);
  });
});

// ============================================================================
// GOLDEN AXIS MAPPER DETERMINISM
// ============================================================================

describe('GoldenAxisMapper purity (honesty fix)', () => {
  const { GoldenAxisMapper } = quaternionSemantics;

  it('should return identical results for repeated interleaved calls', () => {
    const mapper = new GoldenAxisMapper();

    const first = mapper.map(2);
    mapper.map(3);
    mapper.map(5);
    mapper.map(7);
    const second = mapper.map(2);

    assert.deepStrictEqual(first, second);
  });

  it('should agree across different mapper instances', () => {
    const m1 = new GoldenAxisMapper();
    const m2 = new GoldenAxisMapper();

    m1.map(2);
    const r1 = m1.map(11);
    const r2 = m2.map(11);

    assert.deepStrictEqual(r1, r2);
  });

  it('should return unit vectors', () => {
    const mapper = new GoldenAxisMapper();
    const axis = mapper.map(29);
    const norm = Math.sqrt(axis.i ** 2 + axis.j ** 2 + axis.k ** 2);
    assert.ok(Math.abs(norm - 1) < 1e-12);
  });
});

// ============================================================================
// GRAVITON STEP IS NON-TRIVIAL
// ============================================================================

describe('GravitonField step (honesty fix)', () => {
  it('should evolve the field (no longer a mathematical no-op)', () => {
    const field = new GravitonField({ gamma: 0.5, dt: 0.1 });
    const before = field.field.map(f => ({ re: f.re, im: f.im }));

    field.step();

    const after = field.field.map(f => ({ re: f.re, im: f.im }));
    assert.notDeepStrictEqual(after, before);
    assert.strictEqual(field.history.length, 1);
  });

  it('should not produce NaN', () => {
    const field = new GravitonField({ gamma: 0.3, dt: 0.05 });
    field.evolve(25);
    for (const f of field.field) {
      assert.ok(Number.isFinite(f.re));
      assert.ok(Number.isFinite(f.im));
    }
  });
});

// ============================================================================
// REDUCTION: FUSE SIZE DECREASE + LOCAL CONFLUENCE
// ============================================================================

describe('Reduction honesty fixes', () => {
  it('should count FusionTerm size above NounTerm size', () => {
    const fusion = FUSE(3, 5, 11); // 3+5+11 = 19 (prime)
    assert.ok(termSize(fusion) > 1);
    assert.strictEqual(termSize(fusion.toNounTerm()), 1);
  });

  it('should verify size decrease for a FUSE reduction proof', () => {
    const fusion = FUSE(3, 5, 11);
    const generator = new ProofGenerator();
    const proof = generator.generateProof(fusion);

    const verification = proof.verifySizeDecrease();
    assert.strictEqual(verification.valid, true);
  });

  it('should compute (not hardcode) local confluence verdicts', () => {
    const result = testLocalConfluence();

    assert.strictEqual(result.checked, true);
    assert.strictEqual(result.allConfluent, true);
    assert.ok(result.testCases.length >= 3);
    for (const tc of result.testCases) {
      assert.strictEqual(tc.confluent, true, `case '${tc.term}' should be confluent`);
    }
  });

  it('should exercise overlapping-redex test cases', () => {
    const reducer = new ReductionSystem();
    const fusionL = FUSE(3, 5, 11);
    const seq = new SeqSentence(new NounSentence(fusionL), new NounSentence(CHAIN([2], N(7))));
    const impl = new ImplSentence(new NounSentence(FUSE(5, 7, 11)), new NounSentence(CHAIN([3], N(7))));

    const nfSeq = reducer.evaluate(seq);
    const nfImpl = reducer.evaluate(impl);

    assert.ok(nfSeq);
    assert.ok(nfImpl);
    assert.strictEqual(typeof nfSeq.signature(), 'string');
    assert.strictEqual(typeof nfImpl.signature(), 'string');
  });
});

// ============================================================================
// ALEXANDER MODULE HONESTY MARKERS
// ============================================================================

describe('Alexander module honesty markers', () => {
  it('should not mutate the caller primes array in SignatureExtractor', () => {
    const primes = [7, 5, 11];
    const extractor = new SignatureExtractor();
    extractor.extract(primes);
    assert.deepStrictEqual(primes, [7, 5, 11]);
  });

  it('should mark polynomial/signature/json outputs as approximate heuristics', () => {
    const module = new AlexanderModule([5, 7, 11]);

    const poly = module.alexanderPolynomial;
    assert.strictEqual(poly.approximate, true);
    assert.strictEqual(poly.method, 'heuristic');

    const signature = module.signature;
    assert.strictEqual(signature.approximate, true);
    assert.strictEqual(signature.method, 'heuristic');

    const json = module.toJSON();
    assert.strictEqual(json.approximate, true);
    assert.strictEqual(json.method, 'heuristic');
  });

  it('should mark the Crowell splitting as asserted-not-computed', () => {
    const module = new AlexanderModule([5, 7, 11]);
    const splitting = module.crowellSequence.getSplitting();
    assert.strictEqual(splitting.approximate, true);
    assert.strictEqual(splitting.computed, false);
  });
});

// ============================================================================
// TOPOLOGY: FREE ENERGY DYNAMICS dt GUARD
// ============================================================================

describe('FreeEnergyDynamics simulate dt guard (honesty fix)', () => {
  it('should throw for dt = 0', () => {
    const fep = new FreeEnergyDynamics();
    assert.throws(() => fep.simulate(0.5, 1.0, 0), /dt > 0/);
  });

  it('should throw for negative dt', () => {
    const fep = new FreeEnergyDynamics();
    assert.throws(() => fep.simulate(0.5, 1.0, -0.01), /dt > 0/);
  });

  it('should still simulate with positive dt', () => {
    const fep = new FreeEnergyDynamics();
    const trajectory = fep.simulate(0.5, 1.0, 0.1);
    assert.ok(Array.isArray(trajectory));
    assert.ok(trajectory.length > 0);
  });
});
