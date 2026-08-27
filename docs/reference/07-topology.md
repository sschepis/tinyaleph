# Topology Module Reference

The arithmetic topology layer implements link invariants and prime-resonant
coupling kernels derived from the "Twist Eigenstates and Topological
Morphogenesis" (108bio.pdf) paper.

> **Note:** The paper-specific helper objects (`TWIST_108`, `Knot`,
> `PhysicalConstants`, `GaugeSymmetry`, `OBSERVER_HIERARCHY`,
> `FreeEnergyDynamics`) live in the internal modules `core/prime.js` and
> `core/topology.js` and are **not part of the published package API**. This
> reference documents the public topology surface exported from
> `@aleph-ai/tinyaleph`.

## Core Concepts

### The 108 Invariant

The number 108 = 2² × 3³ plays a fundamental role as the minimal closed-form
twist configuration. The public API exposes the prime twist angles directly:

```javascript
import { primeToAngle } from '@aleph-ai/tinyaleph';

// Twist angle for a prime p is 2π/p radians:
console.log(primeToAngle(2) * 180 / Math.PI);  // 180 degrees
console.log(primeToAngle(3) * 180 / Math.PI);  // 120 degrees
console.log(primeToAngle(5) * 180 / Math.PI);  // 72 degrees

// 108 = 2² × 3³: the minimal closed twist configuration
const is108Resonant = (n) => n % 108 === 0;
console.log(is108Resonant(216)); // true (multiple of 108)
console.log(is108Resonant(100)); // false
```

### Arithmetic Link Invariants

The `AlexanderModule` computes Alexander polynomials, signatures, and fitting
ideals for prime sets (arithmetic links in restricted-ramification Galois
theory):

```javascript
import { AlexanderModule } from '@aleph-ai/tinyaleph';

// Prime set S = {2, 3, 5, 7} - the "arithmetic link"
const module = new AlexanderModule([2, 3, 5, 7]);

// Alexander polynomial (in t):
console.log(module.alexanderPolynomial);
// "1 + 2t - 4t^2 + 2t^3 + t^4"

// Signature and fitting degrees:
const signature = module.signature();
console.log(signature.primes);          // [2, 3, 5, 7]
console.log(signature.field);           // 'Q'
console.log(signature.fittingDegrees);  // per-degree Fitting ideal data

// Crowell sequence (group-theoretic data):
const seq = module.crowellSequence();

// Compute a Fitting ideal for a specific minor:
const ideal = module.computeFittingIdeal(0);
```

### Arithmetic Link Kernel (ALK)

The ALK packages arithmetic topology invariants as coupling tensors for
prime-resonant operator dynamics:

```javascript
import { ArithmeticLinkKernel } from '@aleph-ai/tinyaleph';

// ALK(S; ℓ, m) for prime set S
const alk = new ArithmeticLinkKernel([3, 5, 7], { ell: 2, e: 1 });

// Pairwise coupling matrix J:
const J = alk.J;

// Triadic coupling tensor K⁽³⁾:
const K3 = alk.K3;

// Higher-order couplings:
const Kn = alk.getKn(4);

// Borromean triples among the primes:
const triples = alk.findBorromeanTriples();

// Build the full Hamiltonian from the kernel:
const H = alk.buildHamiltonian();
```

### Borromean Detection

Primes form Borromean triples when pairwise Legendre symbols are all +1 but
the triple has no common quadratic residue pattern:

```javascript
import { findBorromeanPrimes, quickBorromeanCheck } from '@aleph-ai/tinyaleph';

// Quick check for a candidate triple:
const result = quickBorromeanCheck(3, 5, 7);
console.log(result.possible);       // false
console.log(result.reason);         // 'Pairwise Legendre not all +1'
console.log(result.legendreSymbols); // { l12, l23, l31 }

// Scan a prime set for Borromean triples:
const found = findBorromeanPrimes([3, 5, 7, 11, 13, 17], 10);
```

## API Reference

### `AlexanderModule(primes, options)`

| Member | Type | Description |
|--------|------|-------------|
| `alexanderPolynomial` | string | Alexander polynomial in t |
| `signature()` | object | Signature + Fitting degree data |
| `crowellSequence()` | array | Crowell sequence |
| `computeFittingIdeal(k)` | object | k-th Fitting ideal |
| `getAllFittingIdeals()` | Map | All computed Fitting ideals |
| `toJSON()` | object | Full invariant descriptor |

### `ArithmeticLinkKernel(primes, options)`

| Member | Type | Description |
|--------|------|-------------|
| `J` | matrix | Pairwise coupling |
| `getCoupling(i, j)` | number | Pair coupling value |
| `K3` | tensor | Triadic couplings |
| `getTriadicCoupling(i, j, k)` | number | Triple coupling value |
| `getKn(n)` | tensor | n-ary coupling |
| `findBorromeanTriples()` | array | Borromean triples in S |
| `isBorromean(triple)` | boolean | Borromean test |
| `buildHamiltonian()` | matrix | Full operator Hamiltonian |

### Borromean Helpers

| Function | Returns | Description |
|----------|---------|-------------|
| `quickBorromeanCheck(p1, p2, p3)` | object | Candidate triple test |
| `findBorromeanPrimes(primes, max)` | array | Scan set for triples |

## Internal Modules (not exported)

The following paper-derived helpers remain internal implementation details
(see `core/topology.js` and `core/prime.js` in the source repository):

- `TWIST_108` - the 108 invariant descriptor
- `Knot`, `TREFOIL`, `FIGURE_EIGHT`, `STANDARD_KNOTS` - knot descriptors
- `PhysicalConstants` - derived physical constants (e.g. 17 × 108 = 1836)
- `GaugeSymmetry` - Standard Model gauge decomposition
- `OBSERVER_HIERARCHY` - multi-scale observer table
- `FreeEnergyDynamics` - cubic free-energy dynamics

## Related Modules

- **[Core Prime](./01-core.md)** - Prime utilities
- **[Physics](./02-physics.md)** - Oscillator dynamics
- **[Observer](./08-observer.md)** - Observer hierarchy implementation
