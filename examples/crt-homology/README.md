# CRT-Homology Examples

This directory contains examples demonstrating the CRT-Homology framework integrated into tinyaleph.

## Examples

### 01-residue-encoding.js
Demonstrates encoding hidden vectors into K residue distributions over coprime moduli, then reconstructing via Chinese Remainder Theorem.

```bash
node examples/crt-homology/01-residue-encoding.js
```

### 02-birkhoff-attention.js
Shows projecting attention matrices onto the Birkhoff polytope (doubly-stochastic matrices) using Sinkhorn-Knopp algorithm.

```bash
node examples/crt-homology/02-birkhoff-attention.js
```

### 03-homology-loss.js
Illustrates detecting "holes" in residue space - consistency failures that persist under perturbation. Computes Betti numbers and homology loss.

```bash
node examples/crt-homology/03-homology-loss.js
```

### 04-crt-resoformer.js
Full CRT-enhanced ResoFormer architecture with per-modulus attention heads, CRT fusion, and homology detection.

```bash
node examples/crt-homology/04-crt-resoformer.js
```

## Key Concepts

### Chinese Remainder Theorem (CRT)
Given coprime moduli p₁, p₂, ..., pₖ with product P = ∏pₖ, any value L ∈ [0, P) can be uniquely reconstructed from its residues mod each pₖ:

```
L̂ = Σₖ E[rₖ] · (P/pₖ) · (P/pₖ)⁻¹ mod P
```

### Birkhoff Polytope
The set of doubly-stochastic matrices (all row and column sums = 1). Projecting attention onto this space enforces "conservation of attention mass".

### Homology Loss
Detects semantic inconsistencies as topological holes:

```
ℒ_homology = Σ_{cycles ∈ Ker(ℛ)} f(cycle)
```

Where Ker(ℛ) = { r | ε(r) > τ } is the kernel of high-error residue tuples.

### Betti Numbers
- β₀: Number of connected components in the kernel
- β₁: Number of 1-dimensional holes (cycles that don't bound)

## Mathematical Foundation

See [docs/reference/09-crt-homology.md](../../docs/reference/09-crt-homology.md) for complete mathematical details.

## Run All Examples

```bash
for f in examples/crt-homology/*.js; do node "$f"; done