# Topology Examples

These examples demonstrate the topological invariants and physical constant derivations from the 108bio.pdf paper "Twist Eigenstates and Topological Morphogenesis".

## Examples

### [01-108-invariant.js](./01-108-invariant.js)

The fundamental 108 = 2² × 3³ invariant:

- Basic properties and factorization
- Twist angles κ(p) = 360°/p
- Twist closure detection
- 108-resonance checking
- Finding closing prime sets

```bash
node examples/topology/01-108-invariant.js
```

### [02-trefoil-constants.js](./02-trefoil-constants.js)

Trefoil knot and physical constant derivation:

- Knot topological invariants (crossings, sticks, bridge, unknotting)
- Complexity calculation: T = s·c - b + u = 17
- Proton-electron mass ratio: 17 × 108 = 1836
- Fine structure constant: α⁻¹ = 108 + 29 = 137
- Higgs mass: 5³ = 125 GeV
- Framework validation

```bash
node examples/topology/02-trefoil-constants.js
```

### [03-gauge-symmetry.js](./03-gauge-symmetry.js)

Standard Model gauge group from 108:

- SU(3) color symmetry from 3³
- SU(2) weak isospin from 2²
- U(1) electromagnetic from full 108
- Complete Standard Model structure
- Gauge decomposition of numbers

```bash
node examples/topology/03-gauge-symmetry.js
```

### [04-free-energy-dynamics.js](./04-free-energy-dynamics.js)

Free Energy Principle (FEP) dynamics:

- Cubic dynamics: dψ/dt = αψ + βψ² + γψ³
- Fixed point analysis
- Trajectory simulation
- Parameter regime exploration
- Observer hierarchy
- Observer capacity calculation

```bash
node examples/topology/04-free-energy-dynamics.js
```

## Key Concepts

### The 108 Invariant

The number 108 = 2² × 3³ is the minimal closed-form twist configuration:

```javascript
const { TWIST_108 } = require('@aleph-ai/tinyaleph/core/prime');

// Check twist closure
console.log(TWIST_108.isTwistClosed([3, 3, 3]));  // true (360°)
console.log(TWIST_108.resonates(216));            // true (2 × 108)
```

### Trefoil Complexity

The Trefoil knot (3₁) is the minimal stable structure:

```javascript
const { TREFOIL, PhysicalConstants } = require('@aleph-ai/tinyaleph/core/topology');

console.log(TREFOIL.complexity());      // 17
console.log(TREFOIL.deriveMassRatio()); // 1836

const ratio = PhysicalConstants.protonElectronRatio();
console.log(ratio.relativeError);       // < 0.001
```

### Gauge Symmetry

108 generates the Standard Model gauge group:

```javascript
const { GaugeSymmetry } = require('@aleph-ai/tinyaleph/core/topology');

const sm = GaugeSymmetry.standardModel();
console.log(sm.name);  // 'SU(3) × SU(2) × U(1)'
```

### Free Energy Dynamics

Consciousness modeled as entropy minimization:

```javascript
const { FreeEnergyDynamics } = require('@aleph-ai/tinyaleph/core/topology');

const fep = new FreeEnergyDynamics(0.1, -0.5, -0.1);
const trajectory = fep.simulate(0.2, 10, 0.01);
const attractors = fep.fixedPoints();
```

## Running All Examples

```bash
# Run all topology examples
for f in examples/topology/*.js; do node "$f"; done
```

## References

- 108bio.pdf: "Twist Eigenstates and Topological Morphogenesis"
- Section 2: The 108 Invariant
- Section 3: Knot Invariants and Mass Ratios
- Section 4: Free Energy Dynamics
- Table 1: Observer Hierarchy