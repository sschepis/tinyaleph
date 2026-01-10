# Topology Module Reference

The topology module implements topological invariants and physical constant derivations from the 108bio.pdf paper "Twist Eigenstates and Topological Morphogenesis".

## Core Concepts

### The 108 Invariant

The number 108 = 2² × 3³ plays a fundamental role as the minimal closed-form twist configuration:

```javascript
const { TWIST_108 } = require('@aleph-ai/tinyaleph/core/prime');

console.log(TWIST_108.value);      // 108
console.log(TWIST_108.binary);     // 4 (2²)
console.log(TWIST_108.ternary);    // 27 (3³)
console.log(TWIST_108.mod30Boundary); // 29 (prime sieve)

// Check if a number resonates with 108
console.log(TWIST_108.resonates(216)); // true (multiple of 108)
console.log(TWIST_108.resonates(100)); // false

// Get twist angle for a prime
console.log(TWIST_108.twistAngle(2));  // 180 degrees
console.log(TWIST_108.twistAngle(3));  // 120 degrees
console.log(TWIST_108.twistAngle(5));  // 72 degrees
```

### Knot Invariants

Mathematical knots with topological invariants for deriving physical constants:

```javascript
const { Knot, TREFOIL, FIGURE_EIGHT, STANDARD_KNOTS } = require('@aleph-ai/tinyaleph/core/topology');

// The Trefoil knot (3₁) - fundamental stable structure
console.log(TREFOIL.name);        // 'Trefoil'
console.log(TREFOIL.notation);    // '3_1'
console.log(TREFOIL.crossings);   // 3
console.log(TREFOIL.sticks);      // 6
console.log(TREFOIL.bridge);      // 2
console.log(TREFOIL.unknotting);  // 1

// Trefoil complexity: T = s·c - b + u = 6×3 - 2 + 1 = 17
console.log(TREFOIL.complexity()); // 17

// Mass ratio derivation: 17 × 108 = 1836
console.log(TREFOIL.deriveMassRatio()); // 1836

// Create custom knot
const myKnot = new Knot({
    name: 'Custom',
    notation: 'X_1',
    crossings: 5,
    sticks: 8,
    bridge: 2,
    unknotting: 2
});
console.log(myKnot.complexity()); // 8×5 - 2 + 2 = 40
```

## Physical Constants

### Derived Constants

The `PhysicalConstants` class derives fundamental constants from topological invariants:

```javascript
const { PhysicalConstants } = require('@aleph-ai/tinyaleph/core/topology');

// Proton-electron mass ratio
const massRatio = PhysicalConstants.protonElectronRatio();
console.log(massRatio.derived);        // 1836
console.log(massRatio.experimental);   // 1836.15267343
console.log(massRatio.relativeError);  // ~0.00008
console.log(massRatio.formula);        // '17 × 108 = 1836'

// Fine structure constant inverse
const alpha = PhysicalConstants.fineStructureInverse();
console.log(alpha.derived);        // 137
console.log(alpha.experimental);   // 137.035999084
console.log(alpha.relativeError);  // ~0.00026
console.log(alpha.formula);        // '108 + 29 = 137'

// Higgs mass
const higgs = PhysicalConstants.higgsMass();
console.log(higgs.derived);        // 125 (GeV)
console.log(higgs.experimental);   // 125.25
console.log(higgs.formula);        // '5³ = 125'

// Get all constants
const all = PhysicalConstants.all();

// Validate framework
const validation = PhysicalConstants.validate();
console.log(validation.overallValid); // true
```

## Gauge Symmetry

### Standard Model from 108

The factorization 108 = 2² × 3³ generates the Standard Model gauge group:

```javascript
const { GaugeSymmetry } = require('@aleph-ai/tinyaleph/core/topology');

// SU(3) color symmetry from 3³ = 27
const su3 = GaugeSymmetry.su3();
console.log(su3.name);        // 'SU(3)'
console.log(su3.type);        // 'Color'
console.log(su3.generator);   // 27
console.log(su3.twistAngle);  // 120 (degrees)

// SU(2) weak symmetry from 2² = 4
const su2 = GaugeSymmetry.su2();
console.log(su2.twistAngle);  // 180 (degrees)

// U(1) electromagnetic from full 108
const u1 = GaugeSymmetry.u1();
console.log(u1.twistAngle);   // 360 (degrees)

// Full Standard Model
const sm = GaugeSymmetry.standardModel();
console.log(sm.name);         // 'SU(3) × SU(2) × U(1)'

// Decompose any number
const decomp = GaugeSymmetry.decompose(216);
console.log(decomp.su3Strength);    // 27
console.log(decomp.su2Strength);    // 8
console.log(decomp.is108Resonant);  // true
```

## Observer Hierarchy

### Multi-Scale Observers

From the paper's Table 1, observers at different scales:

```javascript
const { OBSERVER_HIERARCHY, getObserverLevel, observerCapacity } = require('@aleph-ai/tinyaleph/core/topology');

// Access hierarchy
console.log(OBSERVER_HIERARCHY);
// [
//   { scale: 'Quantum', constituentOscillators: 'Wavefunctions', ... },
//   { scale: 'Molecular', ... },
//   { scale: 'Biological', ... },
//   { scale: 'Cognitive', ... },
//   { scale: 'Planetary', ... },
//   { scale: 'Cosmic', ... }
// ]

// Get specific level
const cognitive = getObserverLevel('cognitive');
console.log(cognitive.typicalComplexity);  // 1000
console.log(cognitive.observableBehavior); // 'Awareness and thought'

// Calculate observer capacity
// C_obs = α·N_osc·K̄·τ⁻¹
const capacity = observerCapacity(
    1000,   // oscillator count
    0.5,    // mean coupling
    0.1,    // coherence time
    1.0     // scaling constant
);
console.log(capacity); // 5000
```

## Free Energy Dynamics

### Cubic FEP Dynamics

The consciousness model from Section 4.2:

```javascript
const { FreeEnergyDynamics } = require('@aleph-ai/tinyaleph/core/topology');

// Create dynamics: dψ/dt = αψ + βψ² + γψ³
const fep = new FreeEnergyDynamics(0.1, -0.5, -0.1);

// Compute derivative at state ψ
console.log(fep.derivative(0.5));  // Rate of change

// Single step evolution
const newPsi = fep.step(0.5, 0.01);

// Find fixed points (attractors)
const fixedPts = fep.fixedPoints();
for (const pt of fixedPts) {
    console.log(`ψ=${pt.value}: ${pt.stability}`);
}

// Compute potential V(ψ)
const potential = fep.potential(0.5);

// Simulate trajectory
const trajectory = fep.simulate(0.3, 10, 0.01);
for (const point of trajectory.slice(0, 5)) {
    console.log(`t=${point.t.toFixed(2)}: ψ=${point.psi.toFixed(3)}`);
}

// Check stability at a point
console.log(fep.stabilityAt(0.5)); // 'stable' | 'unstable' | 'marginal'
```

## API Reference

### TWIST_108

| Property | Type | Description |
|----------|------|-------------|
| `value` | number | 108 |
| `binary` | number | 4 (2²) |
| `ternary` | number | 27 (3³) |
| `mod30Boundary` | number | 29 |
| `resonates(n)` | function | Check if n is multiple of 108 |
| `twistAngle(p)` | function | Get 360/p degrees |
| `totalTwist(primes)` | function | Sum of twist angles |
| `isTwistClosed(primes)` | function | Check if total twist is multiple of 360 |

### Knot Class

| Method | Returns | Description |
|--------|---------|-------------|
| `complexity()` | number | T = s·c - b + u |
| `deriveMassRatio()` | number | T × 108 |
| `isPrimeKnot()` | boolean | True if knot is prime |
| `genusLowerBound()` | number | (c - b + 1) / 2 |
| `toJSON()` | object | Full knot descriptor |

### PhysicalConstants

| Method | Returns | Description |
|--------|---------|-------------|
| `protonElectronRatio()` | object | 17 × 108 = 1836 |
| `fineStructureInverse()` | object | 108 + 29 = 137 |
| `higgsMass()` | object | 5³ = 125 GeV |
| `all()` | object | All derived constants |
| `validate()` | object | Validation results |

### FreeEnergyDynamics

| Method | Returns | Description |
|--------|---------|-------------|
| `derivative(psi)` | number | dψ/dt at psi |
| `step(psi, dt)` | number | Euler step |
| `fixedPoints()` | array | Fixed point analysis |
| `potential(psi)` | number | V(ψ) |
| `simulate(psi0, duration, dt)` | array | Full trajectory |
| `stabilityAt(psi)` | string | Stability classification |

## Related Modules

- **[Core Prime](./01-core.md)** - Prime utilities including TWIST_108
- **[Physics](./02-physics.md)** - Oscillator dynamics
- **[Collective Intelligence](./08-collective.md)** - Observer Scale Manager