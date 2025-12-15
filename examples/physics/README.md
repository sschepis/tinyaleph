# Physics Simulation Examples

This directory contains examples demonstrating TinyAleph's physics simulation capabilities.

## Examples

### 01-oscillator.js
**Coupled Oscillators** - Simulate coupled oscillator dynamics and synchronization.

```bash
node examples/physics/01-oscillator.js
```

### 02-lyapunov.js
**Lyapunov Exponents** - Analyze system stability and chaos using Lyapunov exponents.

```bash
node examples/physics/02-lyapunov.js
```

### 03-collapse.js
**State Collapse** - Explore quantum-inspired state collapse dynamics for semantic meaning.

```bash
node examples/physics/03-collapse.js
```

### 04-kuramoto.js
**Kuramoto Synchronization** - Deep dive into the Kuramoto model and phase transitions.

```bash
node examples/physics/04-kuramoto.js
```

### 05-entropy.js
**Entropy Analysis** - Analyze information entropy in semantic states.

```bash
node examples/physics/05-entropy.js
```

## Key Concepts

### Oscillators
Periodic systems with phase and frequency:
- Natural frequency ω determines oscillation rate
- Coupling enables synchronization
- Order parameter measures coherence

### Kuramoto Model
Mathematical model for synchronization:
```
dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)
```
- K > Kc triggers synchronization
- Order parameter r ∈ [0,1]
- Phase transition at critical coupling

### Lyapunov Exponents
Measure sensitivity to initial conditions:
- λ > 0: Chaotic (trajectories diverge)
- λ = 0: Marginally stable
- λ < 0: Stable (trajectories converge)

### State Collapse
Quantum-inspired meaning resolution:
- Superposition of interpretations
- Context provides measurement
- Collapse to definite meaning

### Entropy
Information content and uncertainty:
- H = 0: Complete certainty
- H = log₂(n): Maximum uncertainty
- Context reduces conditional entropy

## Usage Pattern

```javascript
const Entropy = require('../../physics/entropy');
const Collapse = require('../../physics/collapse');
const Kuramoto = require('../../physics/kuramoto');
const Lyapunov = require('../../physics/lyapunov');
const Oscillator = require('../../physics/oscillator');

// Create oscillator
const osc = new Oscillator({
    frequency: 1.0,
    phase: 0,
    amplitude: 1.0
});

// Analyze entropy
const state = backend.textToOrderedState('text');
const H = Entropy.computeEntropy(state);
```

## Applications

These physics concepts apply to:
- **Semantic coherence**: Measuring text consistency
- **Meaning resolution**: Disambiguation through collapse
- **Stability analysis**: Detecting chaotic vs stable states
- **Synchronization**: Aligning semantic representations
- **Information content**: Quantifying text complexity

## Next Steps

After understanding physics simulations, explore:
- `../scientific/` - Quantum computing simulation
- `../math/` - Mathematical foundations
- `../apps/` - Full application examples