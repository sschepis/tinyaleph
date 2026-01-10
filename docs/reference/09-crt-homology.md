# CRT-Homology Framework

## Overview

The CRT-Homology framework integrates **Chinese Remainder Theorem reconstruction** with **homological algebra** to detect and regularize semantic inconsistencies in the tinyaleph library. This enables:

1. **Modular encoding** of semantic states over coprime bases
2. **CRT reconstruction** for unique value recovery
3. **Birkhoff polytope projection** for doubly-stochastic attention
4. **Homology loss** for detecting topological "holes" (consistency failures)

## Mathematical Foundation

### Key Insight

> "Holes are not degrees of freedom. Holes are consistency failures that persist under perturbation."

In the CRT framework, a semantic "hole" occurs when:
- Residues `r_k` over coprime moduli `p_k` fail to reconstruct uniquely
- The reconstruction error `ε(r) = |ℛ(r) - nearest_valid|` exceeds threshold τ
- These failures form cycles in the kernel `Ker(ℛ)` with non-trivial Betti numbers

### Core Equations

#### Residue Encoding
```
r_k = softmax(W_k h + b_k) ∈ Δ(ℤ/p_k)
```

Each hidden vector `h` is encoded into K probability distributions, one per coprime modulus.

#### CRT Reconstruction
```
L̂ = Σ_k E[r_k] · (P/p_k) · (P/p_k)^{-1} mod p_k
```

Where:
- `P = ∏_k p_k` (product of all moduli)
- `(P/p_k)^{-1}` is the modular inverse mod `p_k`
- `E[r_k]` is the expected residue

#### Birkhoff Projection
```
A = Birkhoff(QK^T/√d) ⊙ V
```

Attention matrices are projected onto the Birkhoff polytope (doubly-stochastic matrices) using Sinkhorn-Knopp iteration.

#### Homology Loss
```
ℒ_homology = Σ_{cycles ∈ Ker(ℛ)} f(cycle)
f(cycle) = Σ_{r ∈ cycle} σ(ε(r) - τ) · |cycle|^α · β^γ
```

## API Reference

### Core Classes

#### `ResidueEncoder`

Encodes hidden vectors into residue distributions over coprime moduli.

```javascript
const { ResidueEncoder } = require('tinyaleph/core');

const primes = [2, 3, 5, 7];  // Coprime moduli
const hiddenDim = 32;
const encoder = new ResidueEncoder(primes, hiddenDim);

// Encode a hidden vector
const h = new Float64Array(32);
h.fill(0.5);
const residues = encoder.encode(h);  // Array of K distributions

// Get expected residues
const expected = encoder.expectedResidues(residues);
console.log('Expected residues:', expected);
```

#### `CRTReconstructor`

Reconstructs values from residues using Chinese Remainder Theorem.

```javascript
const { CRTReconstructor } = require('tinyaleph/core');

const primes = [2, 3, 5, 7];
const crt = new CRTReconstructor(primes);

// Reconstruct from expected residues
const residues = [1, 2, 3, 4];  // Expected values mod each prime
const L = crt.reconstruct(residues);
console.log('Reconstructed:', L, 'mod', crt.P);

// Detect kernel (consistency failure)
const inKernel = crt.detectKernel(residues, 0.1);
console.log('In kernel:', inKernel);

// Validate residues
const result = crt.validate(residues);
console.log('Valid:', result.valid, 'Error:', result.error);
```

#### `BirkhoffProjector`

Projects matrices onto the Birkhoff polytope using Sinkhorn-Knopp.

```javascript
const { BirkhoffProjector } = require('tinyaleph/core');

const projector = new BirkhoffProjector(10);  // 10 iterations

// Project a matrix to doubly-stochastic
const matrix = [
  [0.5, 0.3, 0.2],
  [0.3, 0.4, 0.3],
  [0.2, 0.3, 0.5]
];
const doublyStochastic = projector.project(matrix);

// Validate result
const validation = projector.validate(doublyStochastic);
console.log('Is doubly-stochastic:', validation.isDoublyStochastic);

// Birkhoff attention
const Q = [[1, 0], [0, 1]];
const K = [[1, 0], [0, 1]];
const V = [[0.5, 0.5], [0.5, 0.5]];
const output = projector.attention(Q, K, V);
```

#### `HomologyLoss`

Computes loss terms for obstruction cycles.

```javascript
const { HomologyLoss, CRTReconstructor } = require('tinyaleph/core');

const crt = new CRTReconstructor([2, 3, 5, 7]);
const homology = new HomologyLoss({
  tau: 0.1,     // Kernel detection threshold
  alpha: 0.5,   // Cycle length exponent
  beta: 1.0,    // Residue weight
  gamma: 0.5    // Residue exponent
});

// Batch of residue tuples
const batch = [
  [0.1, 0.2, 0.3, 0.4],
  [0.5, 0.6, 0.7, 0.8],
  [0.9, 0.1, 0.2, 0.3]
];

// Compute homology loss
const result = homology.compute(batch, crt);
console.log('Homology loss:', result.loss);
console.log('Cycles detected:', result.cycles);

// Compute Betti numbers
const betti = homology.computeBettiNumbers(batch, crt);
console.log('β₀ (components):', betti.beta0);
console.log('β₁ (holes):', betti.beta1);
```

#### `CRTModularLayer`

Integrated layer combining encoding, reconstruction, and attention.

```javascript
const { createCRTLayer } = require('tinyaleph/core');

const layer = createCRTLayer([2, 3, 5, 7], 32);

// Forward pass
const h = new Float64Array(32);
h.fill(0.5);
const result = layer.forward(h);

console.log('Latent:', result.latent);
console.log('In kernel:', result.inKernel);
console.log('Coherence:', result.coherence);

// Batch forward with homology loss
const batch = [h, h, h];
const batchResult = layer.forwardBatch(batch);
console.log('Homology loss:', batchResult.homologyLoss);
console.log('Betti numbers:', batchResult.bettiNumbers);
```

### CRT-Enhanced ResoFormer

#### `CRTResonantAttention`

Multi-head attention with per-modulus Birkhoff projection.

```javascript
const { CRTResonantAttention } = require('tinyaleph/core');

const attention = new CRTResonantAttention({
  numHeads: 4,
  numPrimes: 4096,
  activeK: 32,
  sinkhornIterations: 10
});

// Forward pass
const query = SparsePrimeState.fromHash('query');
const keys = [SparsePrimeState.fromHash('key1'), SparsePrimeState.fromHash('key2')];
const values = [SparsePrimeState.fromHash('val1'), SparsePrimeState.fromHash('val2')];

const result = attention.forward(query, keys, values);
console.log('Result:', result.result);
console.log('Homology info:', result.homologyInfo);
console.log('Has holes:', result.homologyInfo.hasHoles);
```

#### `CRTResoFormer`

Complete CRT-enhanced ResoFormer model.

```javascript
const { createCRTResoFormer, SparsePrimeState } = require('tinyaleph/core');

const model = createCRTResoFormer({
  numLayers: 6,
  numHeads: 8,
  hiddenDim: 256,
  numPrimes: 4096,
  activeK: 32,
  homologyWeight: 0.1
});

// Single input
const input = SparsePrimeState.fromHash('hello world');
const output = model.forward(input);

console.log('Output:', output.output);
console.log('Total homology loss:', output.totalLoss);
console.log('Holes detected:', output.homologyReport.totalHolesDetected);

// Sequence input
const sequence = [
  SparsePrimeState.fromHash('the'),
  SparsePrimeState.fromHash('quick'),
  SparsePrimeState.fromHash('brown'),
  SparsePrimeState.fromHash('fox')
];
const seqOutput = model.forward(sequence);
console.log('Sequence output length:', seqOutput.output.length);
```

### Homology-Aware Stabilization

The `StabilizationController` in `observer/hqe.js` now includes homology detection:

```javascript
const { StabilizationController } = require('tinyaleph/observer/hqe');

const controller = new StabilizationController({
  lambda0: 0.1,
  aC: 1.0,   // Coherence weight
  aS: 0.8,   // Entropy weight
  aH: 0.3,   // Homology weight (NEW)
  homology: {
    enabled: true,
    numModuli: 4,
    tau: 0.1
  }
});

// Compute λ(t) with homology awareness
const lambda = controller.computeLambda(
  0.8,   // coherence
  0.3,   // entropy
  0.1,   // SMF entropy
  { coherence: 0.8, entropy: 0.3 }  // state for homology analysis
);

console.log('Lambda:', lambda);
console.log('Betti numbers:', controller.getHomologyState().bettiNumbers);
console.log('Holes detected:', controller.getHomologyState().holesDetected);
```

## Integration with Lyapunov Stability

The CRT kernel detection correlates with Lyapunov instability:

- **λ > 0** (unstable): High reconstruction error, in kernel
- **λ ≈ 0** (marginal): Near threshold, transitional
- **λ < 0** (stable): Low error, consistent reconstruction

```javascript
const { lyapunovExponent } = require('tinyaleph/physics');
const { CRTReconstructor } = require('tinyaleph/core');

const crt = new CRTReconstructor([2, 3, 5, 7]);

// Track correlation between Lyapunov and CRT error
function correlateStability(trajectory) {
  const correlations = [];
  
  for (const state of trajectory) {
    const lambda = lyapunovExponent(state);
    const residues = extractResidues(state);
    const crtError = crt.reconstructionError(residues);
    
    correlations.push({
      lambda,
      crtError,
      inKernel: crtError > 0.1
    });
  }
  
  return correlations;
}
```

## Theoretical Background

### Chinese Remainder Theorem

For pairwise coprime moduli `p₁, p₂, ..., p_k`:

1. Any tuple `(r₁, r₂, ..., r_k)` with `0 ≤ r_i < p_i` corresponds to a unique integer `x ∈ [0, P)` where `P = ∏ p_i`
2. Reconstruction uses: `x = Σ_i r_i · M_i · M_i^{-1} mod P`
3. Where `M_i = P/p_i` and `M_i^{-1}` is the modular inverse

### Birkhoff-von Neumann Theorem

Every doubly-stochastic matrix is a convex combination of permutation matrices:

1. Row sums = 1, column sums = 1
2. Birkhoff polytope = convex hull of permutation matrices
3. Sinkhorn-Knopp alternates row/column normalization

### Homology and Betti Numbers

- **β₀**: Number of connected components in kernel
- **β₁**: Number of 1-dimensional holes (cycles that don't bound)
- Persistence: How long holes survive under parameter changes

## Performance Considerations

### Coprime Selection

Use small primes for efficiency:
- `[2, 3, 5, 7]`: P = 210, good for most applications
- `[5, 7, 11, 13]`: P = 5005, for larger latent spaces
- `[2, 3, 5, 7, 11]`: P = 2310, semantic applications

### Sinkhorn Iterations

- 5-10 iterations suffice for most applications
- Higher tolerance (1e-3) for speed, lower (1e-6) for precision
- Monitor convergence via `maxRowError` and `maxColError`

### Homology Computation

- Cycle detection scales with kernel size
- Betti number computation is approximate (not full persistent homology)
- Consider batching for large sequences

## References

1. Chinese Remainder Theorem - Hardy & Wright, "An Introduction to the Theory of Numbers"
2. Birkhoff-von Neumann Theorem - Birkhoff, "Three Observations on Linear Algebra"
3. Sinkhorn-Knopp Algorithm - Sinkhorn, "A Relationship Between Arbitrary Positive Matrices and Doubly Stochastic Matrices"
4. Topological Data Analysis - Carlsson, "Topology and Data"
5. Lyapunov Stability - Strogatz, "Nonlinear Dynamics and Chaos"