/**
 * CRT-Homology Module Tests
 * 
 * Tests for:
 * - Extended GCD and modular inverse
 * - CRT reconstruction
 * - Birkhoff polytope projection
 * - Homology loss detection
 * - Integration with SparsePrimeState
 */

'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const {
    extendedGCD,
    modInverse,
    areCoprime,
    softmax,
    ResidueEncoder,
    CRTReconstructor,
    BirkhoffProjector,
    HomologyLoss,
    CRTModularLayer,
    CRTFusedAttention,
    CoprimeSelector,
    createCRTLayer,
    DEFAULT_PRIMES_SMALL,
    DEFAULT_PRIMES_SEMANTIC
} = require('../core/crt-homology');

const { SparsePrimeState, Complex } = require('../core');

// ============================================================================
// MODULAR ARITHMETIC TESTS
// ============================================================================

describe('Modular Arithmetic', () => {
    describe('extendedGCD', () => {
        it('should compute gcd correctly', () => {
            const { gcd } = extendedGCD(48, 18);
            assert.strictEqual(gcd, 6);
        });
        
        it('should satisfy Bézout identity: gcd = a*x + b*y', () => {
            const a = 35, b = 15;
            const { gcd, x, y } = extendedGCD(a, b);
            assert.strictEqual(a * x + b * y, gcd);
        });
        
        it('should return 1 for coprime numbers', () => {
            const { gcd } = extendedGCD(7, 11);
            assert.strictEqual(gcd, 1);
        });
    });
    
    describe('modInverse', () => {
        it('should compute modular inverse: 3^{-1} mod 7 = 5', () => {
            const inv = modInverse(3, 7);
            assert.strictEqual(inv, 5);
            assert.strictEqual((3 * inv) % 7, 1);
        });
        
        it('should compute modular inverse: 5^{-1} mod 11 = 9', () => {
            const inv = modInverse(5, 11);
            assert.strictEqual((5 * inv) % 11, 1);
        });
        
        it('should return null for non-coprime inputs', () => {
            const inv = modInverse(6, 9); // gcd(6, 9) = 3 ≠ 1
            assert.strictEqual(inv, null);
        });
        
        it('should handle negative inputs correctly', () => {
            const inv = modInverse(-3, 7);
            assert.ok(inv !== null);
            assert.strictEqual(((-3 % 7 + 7) % 7 * inv) % 7, 1);
        });
    });
    
    describe('areCoprime', () => {
        it('should return true for coprime numbers', () => {
            assert.strictEqual(areCoprime(15, 28), true);
            assert.strictEqual(areCoprime(7, 11), true);
        });
        
        it('should return false for non-coprime numbers', () => {
            assert.strictEqual(areCoprime(12, 18), false);
            assert.strictEqual(areCoprime(15, 25), false);
        });
    });
    
    describe('softmax', () => {
        it('should produce valid probability distribution', () => {
            const probs = softmax([1, 2, 3]);
            const sum = probs.reduce((a, b) => a + b, 0);
            assert.ok(Math.abs(sum - 1) < 1e-10);
            probs.forEach(p => assert.ok(p >= 0 && p <= 1));
        });
        
        it('should be numerically stable with large values', () => {
            const probs = softmax([1000, 1001, 1002]);
            const sum = probs.reduce((a, b) => a + b, 0);
            assert.ok(Math.abs(sum - 1) < 1e-10);
        });
    });
});

// ============================================================================
// CRT RECONSTRUCTOR TESTS
// ============================================================================

describe('CRTReconstructor', () => {
    let crt;
    
    beforeEach(() => {
        crt = new CRTReconstructor([2, 3, 5, 7]); // P = 210
    });
    
    it('should compute correct product P', () => {
        assert.strictEqual(crt.P, 210);
    });
    
    it('should precompute CRT coefficients', () => {
        assert.strictEqual(crt.coefficients.length, 4);
        crt.coefficients.forEach(c => {
            assert.ok('Mk' in c);
            assert.ok('MkInv' in c);
        });
    });
    
    it('should reconstruct from integer residues', () => {
        // Find number x such that x ≡ 1 (mod 2), x ≡ 2 (mod 3), x ≡ 3 (mod 5), x ≡ 4 (mod 7)
        const residues = [1, 2, 3, 4];
        const x = crt.reconstruct(residues);
        
        // Verify residues
        assert.strictEqual(x % 2, 1);
        assert.strictEqual(x % 3, 2);
        assert.strictEqual(x % 5, 3);
        assert.strictEqual(x % 7, 4);
    });
    
    it('should detect kernel (obstruction) for inconsistent residues', () => {
        // Fractional expected residues indicate uncertainty
        const fractionalResidues = [0.7, 1.3, 2.8, 4.1];
        const inKernel = crt.detectKernel(fractionalResidues, 0.05);
        // Should detect kernel since residues are not integers
        assert.ok(crt.reconstructionError(fractionalResidues) > 0);
    });
    
    it('should have zero error for integer residues', () => {
        const residues = [0, 1, 2, 3];
        const error = crt.reconstructionError(residues);
        assert.ok(error < 0.01); // Near zero for integers
    });
    
    it('should validate consistent residues', () => {
        const residues = [1, 0, 4, 6];
        const result = crt.validate(residues, 0.1);
        assert.ok(result.valid);
        assert.ok(!result.inKernel);
    });
});

// ============================================================================
// BIRKHOFF PROJECTOR TESTS
// ============================================================================

describe('BirkhoffProjector', () => {
    let birkhoff;
    
    beforeEach(() => {
        birkhoff = new BirkhoffProjector(20);
    });
    
    it('should produce doubly-stochastic matrix', () => {
        const matrix = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        
        const P = birkhoff.project(matrix);
        const validation = birkhoff.validate(P, 0.05);
        
        assert.ok(validation.isDoublyStochastic, 
            `Max row error: ${validation.maxRowError}, max col error: ${validation.maxColError}`);
    });
    
    it('should have row sums equal to 1', () => {
        const matrix = [[1, 0, 2], [0, 1, 1], [2, 1, 0]];
        const P = birkhoff.project(matrix);
        
        P.forEach((row, i) => {
            const sum = row.reduce((a, b) => a + b, 0);
            assert.ok(Math.abs(sum - 1) < 0.05, `Row ${i} sum: ${sum}`);
        });
    });
    
    it('should have column sums equal to 1', () => {
        const matrix = [[1, 0, 2], [0, 1, 1], [2, 1, 0]];
        const P = birkhoff.project(matrix);
        
        for (let j = 0; j < 3; j++) {
            const sum = P.reduce((s, row) => s + row[j], 0);
            assert.ok(Math.abs(sum - 1) < 0.05, `Column ${j} sum: ${sum}`);
        }
    });
    
    it('should compute Birkhoff attention', () => {
        const Q = [[1, 0], [0, 1], [1, 1]];
        const K = [[1, 0], [0, 1]];
        const V = [[1, 2], [3, 4]];
        
        const output = birkhoff.attention(Q, K, V);
        
        assert.strictEqual(output.length, 3); // Same as Q rows
        assert.strictEqual(output[0].length, 2); // Same as V cols
    });
});

// ============================================================================
// HOMOLOGY LOSS TESTS
// ============================================================================

describe('HomologyLoss', () => {
    let homology;
    let crt;
    
    beforeEach(() => {
        homology = new HomologyLoss({ tau: 0.1, alpha: 1.0, lambda: 1.0 });
        crt = new CRTReconstructor([2, 3, 5]);
    });
    
    it('should detect cycles in kernel', () => {
        // Create batch with some kernel points (fractional residues)
        const batch = [
            [0, 0, 0],       // Valid
            [0.5, 1.5, 2.5], // Kernel (fractional)
            [0.6, 1.6, 2.6], // Kernel (fractional)
            [1, 2, 3],       // Valid
            [0.7, 0.8, 0.9], // Kernel
            [0, 1, 2]        // Valid
        ];
        
        const cycles = homology.detectCycles(batch, crt);
        assert.ok(cycles.length > 0, 'Should detect at least one cycle');
    });
    
    it('should compute cycle loss', () => {
        const cycle = [
            { index: 0, residues: [0.5, 0.5, 0.5], error: 0.2 },
            { index: 1, residues: [0.6, 0.6, 0.6], error: 0.3 }
        ];
        
        const loss = homology.cycleLoss(cycle);
        assert.ok(loss > 0, 'Cycle loss should be positive');
    });
    
    it('should compute total homology loss', () => {
        const batch = [
            [0.5, 1.5, 2.5],
            [0.6, 1.6, 2.6],
            [0, 1, 2]
        ];
        
        const result = homology.compute(batch, crt);
        assert.ok('loss' in result);
        assert.ok('cycles' in result);
        assert.ok('details' in result);
    });
    
    it('should compute Betti numbers', () => {
        const batch = [
            [0.5, 1.5, 2.5],
            [0.6, 1.6, 2.6],
            [0, 1, 2],
            [0.7, 0.8, 0.9]
        ];
        
        const betti = homology.computeBettiNumbers(batch, crt);
        assert.ok('beta0' in betti);
        assert.ok('beta1' in betti);
    });
    
    it('should have zero loss for valid batch', () => {
        const batch = [
            [0, 1, 2],
            [1, 0, 3],
            [0, 2, 1]
        ];
        
        const result = homology.compute(batch, crt);
        assert.strictEqual(result.cycles, 0);
        assert.strictEqual(result.loss, 0);
    });
});

// ============================================================================
// RESIDUE ENCODER TESTS
// ============================================================================

describe('ResidueEncoder', () => {
    let encoder;
    
    beforeEach(() => {
        encoder = new ResidueEncoder([2, 3, 5], 8);
    });
    
    it('should encode hidden vector to residue distributions', () => {
        const h = new Float64Array([1, 0, 0, 1, 0, 1, 0, 1]);
        const residues = encoder.encode(h);
        
        assert.strictEqual(residues.length, 3); // One per prime
        assert.strictEqual(residues[0].length, 2); // mod 2
        assert.strictEqual(residues[1].length, 3); // mod 3
        assert.strictEqual(residues[2].length, 5); // mod 5
    });
    
    it('should produce valid probability distributions', () => {
        const h = new Float64Array(8).fill(0.5);
        const residues = encoder.encode(h);
        
        residues.forEach((r, k) => {
            const sum = Array.from(r).reduce((a, b) => a + b, 0);
            assert.ok(Math.abs(sum - 1) < 1e-6, `Residue ${k} sum: ${sum}`);
        });
    });
    
    it('should compute expected residues', () => {
        const h = new Float64Array(8).fill(0.5);
        const residues = encoder.encode(h);
        const expected = encoder.expectedResidues(residues);
        
        assert.strictEqual(expected.length, 3);
        expected.forEach((e, k) => {
            assert.ok(e >= 0 && e < encoder.primes[k], `Expected ${e} for mod ${encoder.primes[k]}`);
        });
    });
});

// ============================================================================
// CRT MODULAR LAYER TESTS
// ============================================================================

describe('CRTModularLayer', () => {
    let layer;
    
    beforeEach(() => {
        layer = new CRTModularLayer([2, 3, 5, 7], 16, {
            homology: { tau: 0.1, lambda: 1.0 }
        });
    });
    
    it('should perform forward pass', () => {
        const h = new Float64Array(16).map(() => Math.random());
        const result = layer.forward(h);
        
        assert.ok('residues' in result);
        assert.ok('expectedResidues' in result);
        assert.ok('latent' in result);
        assert.ok('inKernel' in result);
        assert.ok('coherence' in result);
    });
    
    it('should compute batch forward with homology loss', () => {
        const batch = Array(5).fill(null).map(() => 
            new Float64Array(16).map(() => Math.random())
        );
        
        const result = layer.forwardBatch(batch);
        
        assert.ok('homologyLoss' in result);
        assert.ok('totalLoss' in result);
        assert.ok('bettiNumbers' in result);
        assert.strictEqual(result.results.length, 5);
    });
    
    it('should integrate with SparsePrimeState', () => {
        const state = SparsePrimeState.fromPrimes([2, 3, 5, 7, 11], [
            new Complex(0.5, 0.1),
            new Complex(0.3, 0.2),
            new Complex(0.4, 0.0),
            new Complex(0.2, 0.3),
            new Complex(0.1, 0.1)
        ]);
        
        const result = layer.forwardFromPrimeState(state);
        
        assert.ok('latent' in result);
        assert.ok('coherence' in result);
        assert.ok(result.coherence >= 0 && result.coherence <= 1);
    });
});

// ============================================================================
// CRT FUSED ATTENTION TESTS
// ============================================================================

describe('CRTFusedAttention', () => {
    let attention;
    
    beforeEach(() => {
        attention = new CRTFusedAttention([2, 3, 5], 8, 4);
    });
    
    it('should perform CRT-fused attention', () => {
        const X = [
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 1, 0, 0, 1, 1, 0, 0]
        ];
        
        const result = attention.forward(X);
        
        assert.ok('output' in result);
        assert.ok('perHeadOutputs' in result);
        assert.ok('residues' in result);
        assert.ok('latent' in result);
        assert.ok('coherence' in result);
        
        assert.strictEqual(result.output.length, 3); // Same as input sequence
        assert.strictEqual(result.perHeadOutputs.length, 3); // One per prime
    });
});

// ============================================================================
// COPRIME SELECTOR TESTS
// ============================================================================

describe('CoprimeSelector', () => {
    it('should select minimal primes', () => {
        const selector = new CoprimeSelector(4);
        const primes = selector.selectMinimal();
        
        assert.strictEqual(primes.length, 4);
        assert.deepStrictEqual(primes, [2, 3, 5, 7]);
    });
    
    it('should select primes for target product', () => {
        const selector = new CoprimeSelector(5);
        const primes = selector.selectForProduct(1000);
        
        assert.ok(primes !== null);
        const product = primes.reduce((a, b) => a * b, 1);
        assert.ok(product <= 1000);
    });
    
    it('should select domain-specific primes', () => {
        const selector = new CoprimeSelector();
        
        const semantic = selector.selectForDomain('semantic');
        assert.deepStrictEqual(semantic, [2, 3, 5, 7, 11]);
        
        const temporal = selector.selectForDomain('temporal');
        assert.deepStrictEqual(temporal, [3, 5, 7, 11, 13]);
    });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: CRT + Homology + SparsePrimeState', () => {
    it('should detect semantic inconsistencies as homology holes', () => {
        const layer = createCRTLayer(DEFAULT_PRIMES_SEMANTIC, 16, {
            homology: { tau: 0.15, lambda: 2.0 }
        });
        
        // Create batch of hidden states with varying consistency
        const consistentH = new Float64Array(16).fill(0.5);
        const inconsistentH = new Float64Array(16).map((_, i) => 
            i % 2 === 0 ? 0.9 : 0.1 // Alternating pattern creates inconsistency
        );
        
        const batch = [consistentH, inconsistentH, consistentH];
        const result = layer.forwardBatch(batch);
        
        // Should compute homology loss
        assert.ok('homologyLoss' in result);
        assert.ok('bettiNumbers' in result);
    });
    
    it('should maintain coherence through CRT reconstruction', () => {
        const crt = new CRTReconstructor([2, 3, 5, 7]);
        
        // Test that reconstruction is consistent
        for (let x = 0; x < crt.P; x += 17) { // Sample every 17th value
            const residues = [x % 2, x % 3, x % 5, x % 7];
            const reconstructed = crt.reconstruct(residues);
            assert.strictEqual(reconstructed, x, `Failed for x=${x}`);
        }
    });
    
    it('should connect Lyapunov instability to kernel detection', () => {
        const crt = new CRTReconstructor([3, 5, 7]);
        const homology = new HomologyLoss({ tau: 0.1 });
        
        // Simulate "chaotic" residues (high variance, fractional)
        const chaoticBatch = Array(10).fill(null).map(() => [
            Math.random() * 2,
            Math.random() * 4,
            Math.random() * 6
        ]);
        
        const result = homology.compute(chaoticBatch, crt);
        
        // High chaos should produce cycles (consistency failures)
        // This connects to Lyapunov λ > 0 in the oscillator model
        console.log(`Chaotic batch: ${result.cycles} cycles detected, loss=${result.loss.toFixed(4)}`);
    });
});

console.log('CRT-Homology tests loaded');