# Arithmetic Topology Examples

This module implements the arithmetic-topological framework connecting prime numbers to link invariants via the Arithmetic Link Kernel (ALK) and Complete Alexander Modules.

## Theoretical Background

### The Primes-as-Knots Analogy

In arithmetic topology, prime numbers behave like knots in 3-dimensional topology:

| Topology | Number Theory |
|----------|---------------|
| Knot K ⊂ S³ | Prime p ∈ Spec(ℤ) |
| Linking number lk(K₁, K₂) | Legendre symbol (p₁/p₂) |
| Milnor μ-invariant μ(1,2,3) | Rédei symbol [p₁, p₂, p₃] |
| Seifert matrix | Coupling matrix J |
| Alexander polynomial Δ(t) | Fitting ideals E_d(A_ψ) |

### Arithmetic Link Kernel (ALK)

The ALK encapsulates all multi-scale coupling between primes:

```
ALK(S; ℓ, m) = (J, {K⁽³⁾}, {K⁽ⁿ⁾})
```

Where:
- **J** = pairwise coupling matrix (Legendre/power residue symbols)
- **K⁽³⁾** = triadic coupling tensor (Rédei symbols)
- **K⁽ⁿ⁾** = higher-order Milnor invariants

### Complete Alexander Module

The A_ψ module captures the complete algebraic structure:

```
0 → N^ab → A_ψ → I_{Z[H]} → 0  (Crowell exact sequence)
```

The Fitting ideals E_d(A_ψ) generalize Alexander polynomials to arithmetic settings.

## Examples

### 01-legendre-symbol.js
Demonstrates the Legendre symbol (a/p) and quadratic reciprocity.

```javascript
import { LegendreSymbol } from '../../core/arithmetic-link-kernel.js';

const symbol = new LegendreSymbol(5, 7);
console.log(symbol.compute()); // +1 or -1
```

Key concepts:
- Quadratic residues: a is a square mod p iff (a/p) = +1
- Quadratic reciprocity: (p/q)(q/p) = (-1)^((p-1)/2 · (q-1)/2)
- Coupling matrix: J[i,j] = (p_i/p_j) · (p_j/p_i)

### 02-redei-symbol.js
Demonstrates the Rédei symbol and Borromean prime detection.

```javascript
import { RedeiSymbol } from '../../core/arithmetic-link-kernel.js';

const redei = new RedeiSymbol(5, 7, 11, 2);
console.log(redei.compute()); // ±1
```

Key concepts:
- Rédei symbol [p₁, p₂, p₃] ∈ {±1}: triadic interaction
- Borromean primes: J[i,j] = +1 pairwise but K³ ≠ 0
- Example: (5, 7, 11) with ℓ=2

### 03-alk-kuramoto.js
Demonstrates ALK-driven Kuramoto synchronization.

```javascript
import { createALKKuramotoModel } from '../../physics/alk-kuramoto.js';

const model = createALKKuramotoModel([5, 7, 11, 13], {
    K_pair: 1.0,
    K_triple: 0.5
});
model.evolve(100, 0.01);
console.log(model.orderParameter); // Complex amplitude
```

Key concepts:
- ALK-Kuramoto dynamics: dθᵢ/dt = ωᵢ + Σⱼ Jᵢⱼ sin(θⱼ - θᵢ) + Σⱼ<ₖ K³ᵢⱼₖ sin(θⱼ + θₖ - 2θᵢ)
- Order parameter R·e^{iψ} = (1/N) Σⱼ e^{iθⱼ}
- Borromean frustration: higher-order coupling prevents full sync

### 04-alexander-module.js
Demonstrates Alexander module construction and Fitting ideals.

```javascript
import { createAlexanderModule } from '../../core/alexander-module.js';

const module = createAlexanderModule([5, 7, 11, 13]);
console.log(module.alexanderPolynomial.toString());
console.log(module.computeFittingIdeal(0));
```

Key concepts:
- Crowell exact sequence and module splitting
- Fitting ideals E_d(A_ψ) as characteristic invariants
- Alexander polynomial as generator of E_0

### 05-signature-memory.js
Demonstrates signature-based content-addressable retrieval.

```javascript
import { SignatureMemory, createModuleSignature } from '../../core/alexander-module.js';

const memory = new SignatureMemory();
const sig = createModuleSignature([5, 7, 11]);
memory.store(sig, { label: 'my-config', data: {...} });

// Later retrieval
const result = memory.get(sig);
const similar = memory.findSimilar(sig, { topK: 5 });
```

Key concepts:
- Module signatures Σ_{k,S,ℓ,ψ} as unique fingerprints
- Exact and approximate retrieval
- Similarity search via characteristic polynomial comparison

## Running the Examples

```bash
# Individual example
node examples/arithmetic-topology/01-legendre-symbol.js

# All examples
for f in examples/arithmetic-topology/*.js; do
    echo "=== $f ==="
    node "$f"
done
```

## API Reference

### arithmetic-link-kernel.js

```javascript
// Residue symbols
LegendreSymbol(a, p)              // (a/p) Legendre symbol
PowerResidueSymbol(a, p, n)       // n-th power residue symbol
RedeiSymbol(p1, p2, p3, ell)      // [p1, p2, p3] Rédei symbol

// Milnor invariants
ArithmeticMilnorInvariant(primes, ell, order)  // μ(I) invariant

// Full ALK
ArithmeticLinkKernel(primes, options)
  .J                              // Coupling matrix
  .K3                             // Triadic tensor
  .getHigherOrder(n)              // n-th order tensor
  .isBorromean()                  // Check Borromean condition

// Factory
createALK(primes, options)
```

### alk-kuramoto.js

```javascript
// Single network
ALKKuramotoModel(primes, options)
  .evolve(steps, dt)              // Evolve dynamics
  .orderParameter                 // Complex order parameter
  .phases                         // Current phases
  .frequencies                    // Natural frequencies
  .getPhaseCoherence()            // Phase coherence metrics

// Network of networks
ALKNetworkKuramoto(primeSets, options)
  .evolve(steps, dt)
  .globalOrderParameter

// Factory
createALKKuramotoModel(primes, options)
```

### alexander-module.js

```javascript
// Laurent polynomials
LaurentPolynomial(coeffs, minPower)
  .add(other)
  .multiply(other)
  .evaluate(t)
  .evaluateOnCircle(theta)

// Fitting ideals
FittingIdeal(generators)
  .characteristicPolynomial
  .signatureHash

// Alexander module
AlexanderModule(primes, options)
  .crowellSequence                // Crowell exact sequence
  .alexanderPolynomial            // Δ_0(A_ψ)
  .computeFittingIdeal(d)         // E_d(A_ψ)
  .stats                          // Module statistics

// Signatures
ModuleSignature(primes, fittingData)
  .hash                           // Content hash
  .similarity(other)              // Similarity measure

// Memory
SignatureMemory()
  .store(sig, data)
  .get(sig)
  .findSimilar(sig, options)
  .query(predicate)

// Factories
createAlexanderModule(primes, options)
createModuleSignature(primes, options)
```

## Mathematical Details

### Legendre Symbol Computation

```
(a/p) = a^((p-1)/2) mod p
      = +1 if a is a quadratic residue mod p
      = -1 if a is a quadratic non-residue mod p
      =  0 if p divides a
```

### Rédei Symbol via Hilbert Symbols

```
[p₁, p₂, p₃]_ℓ = Π_{q∈{p₁,p₂,p₃,∞}} (α, β)_q
```

where (α, β)_q is the Hilbert symbol at prime q or at infinity.

### ALK-Kuramoto Equations

```
dθᵢ/dt = ωᵢ + Σⱼ Jᵢⱼ sin(θⱼ - θᵢ) + Σⱼ<ₖ K³ᵢⱼₖ sin(θⱼ + θₖ - 2θᵢ) + ...
```

The order parameter:
```
R·e^{iψ} = (1/N) Σⱼ e^{iθⱼ}
```

### Crowell Sequence and Splitting

```
0 → N^ab → A_ψ → I_{Z[H]} → 0

A_ψ ≅ N^ab ⊕ Λ̂  (as Λ-modules)

E_d(N^ab) = E_{d+1}(A_ψ)  (Fitting shift formula)
```

### Characteristic Polynomial from Presentation Matrix

For a module with presentation matrix M:
```
Δ_d(A_ψ) = gcd of (n-d)×(n-d) minors of M
```

## Integration with tinyaleph Core

The ALK and Alexander modules integrate with:

- **Resonance Engine**: ALK coupling matrices as resonance weights
- **Kuramoto Physics**: ALK-driven synchronization dynamics
- **Symbol Database**: Signatures as content-addressable keys
- **Prime Factorization**: Natural primes as ALK inputs

## References

1. Morishita, M. "Knots and Primes: An Introduction to Arithmetic Topology"
2. Rédei, L. "Ein neues zahlentheoretisches Symbol"
3. Hillman, J. "Algebraic Invariants of Links"
4. Milnor, J. "Link Groups"
5. Crowell, R. "The Derived Group of a Permutation Representation"

## License

Part of the tinyaleph project. See main LICENSE file.