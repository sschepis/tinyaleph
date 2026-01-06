# Physics Module Reference

The physics module provides dynamical systems, synchronization, and information-theoretic primitives.

## Oscillator (`physics/oscillator.js`)

### createOscillator(options)

Create a phase-amplitude oscillator.

```javascript
createOscillator(options)
```

**Parameters:**
- `options` (Object):
  - `frequency` (number): Natural frequency ω (default 1.0)
  - `phase` (number): Initial phase θ in radians (default 0)
  - `amplitude` (number): Oscillation amplitude A (default 1.0)
  - `damping` (number): Damping coefficient γ (default 0)
  - `driving` (Object): External driving force (optional)
    - `frequency` (number): Driving frequency
    - `amplitude` (number): Driving amplitude

**Returns:** Oscillator object

**Example:**
```javascript
const osc = createOscillator({
  frequency: 1.0,
  phase: 0,
  amplitude: 1.0
});
```

---

### Oscillator Object

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `frequency` | number | Natural frequency ω |
| `phase` | number | Current phase θ |
| `amplitude` | number | Current amplitude A |
| `damping` | number | Damping coefficient |
| `driving` | Object | External driving parameters |
| `state` | SedenionState | Associated hypercomplex state |

---

#### step(dt)

Advance oscillator by time step.

```javascript
osc.step(dt)
```

**Parameters:**
- `dt` (number): Time step size

**Returns:** void (modifies oscillator in place)

**Notes:**
- Updates phase: `θ += ω * dt`
- Applies damping: `A *= exp(-γ * dt)`
- Applies driving if configured

---

#### getValue()

Get current oscillator value.

```javascript
osc.getValue()
```

**Returns:** number - `A * cos(θ)`

---

#### getComplexValue()

Get complex oscillator value.

```javascript
osc.getComplexValue()
```

**Returns:** Object - `{ real: A*cos(θ), imag: A*sin(θ) }`

---

#### excite(energy)

Add energy to the oscillator.

```javascript
osc.excite(energy)
```

**Parameters:**
- `energy` (number): Energy to add

**Returns:** void

**Notes:**
- Increases amplitude: `A = sqrt(A² + 2*energy)`

---

#### damp(factor)

Apply damping to amplitude.

```javascript
osc.damp(factor)
```

**Parameters:**
- `factor` (number): Damping factor (0-1)

**Returns:** void

**Notes:**
- Reduces amplitude: `A *= (1 - factor)`

---

#### synchronizeTo(targetPhase, coupling)

Move phase toward target.

```javascript
osc.synchronizeTo(targetPhase, coupling)
```

**Parameters:**
- `targetPhase` (number): Target phase in radians
- `coupling` (number): Coupling strength (0-1)

**Returns:** void

**Notes:**
- Phase update: `θ += coupling * sin(targetPhase - θ)`

---

#### attachState(state)

Associate a hypercomplex state with this oscillator.

```javascript
osc.attachState(state)
```

**Parameters:**
- `state` (SedenionState): State to attach

**Returns:** void

---

## Kuramoto Model (`physics/kuramoto.js`)

### kuramotoStep(oscillators, coupling, dt)

Advance a system of coupled oscillators by one time step.

```javascript
kuramotoStep(oscillators, coupling, dt)
```

**Parameters:**
- `oscillators` (Array<Oscillator>): Array of oscillators
- `coupling` (number): Global coupling strength K
- `dt` (number): Time step size

**Returns:** void (modifies oscillators in place)

**Notes:**
- Implements: `dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)`
- All-to-all coupling topology

**Example:**
```javascript
const oscillators = [];
for (let i = 0; i < 10; i++) {
  oscillators.push(createOscillator({
    frequency: 1.0 + 0.1 * Math.random(),
    phase: Math.random() * 2 * Math.PI
  }));
}

// Evolve system
for (let t = 0; t < 1000; t++) {
  kuramotoStep(oscillators, 0.5, 0.01);
}
```

---

### kuramotoOrderParameter(oscillators)

Calculate the Kuramoto order parameter measuring synchronization.

```javascript
kuramotoOrderParameter(oscillators)
```

**Parameters:**
- `oscillators` (Array<Oscillator>): Array of oscillators

**Returns:** Object - `{ r, psi }`
- `r` (number): Order parameter magnitude [0, 1]
- `psi` (number): Mean phase

**Notes:**
- `r = 0`: Complete desynchronization
- `r = 1`: Perfect synchronization
- Formula: `r * exp(i*ψ) = (1/N) Σⱼ exp(i*θⱼ)`

**Example:**
```javascript
const { r, psi } = kuramotoOrderParameter(oscillators);
console.log('Synchronization:', r);
console.log('Mean phase:', psi);
```

---

### setCouplingFunction(fn)

Set custom coupling function for Kuramoto dynamics.

```javascript
setCouplingFunction(fn)
```

**Parameters:**
- `fn` (Function): Coupling function `(oscI, oscJ, global) => number`

**Returns:** void

**Example:**
```javascript
// Distance-dependent coupling
setCouplingFunction((i, j, global) => {
  const distance = Math.abs(i.index - j.index);
  return Math.sin(j.phase - i.phase) / (1 + distance);
});
```

---

### criticalCoupling(oscillators)

Estimate critical coupling strength for synchronization transition.

```javascript
criticalCoupling(oscillators)
```

**Parameters:**
- `oscillators` (Array<Oscillator>): Array of oscillators

**Returns:** number - Estimated Kc

**Notes:**
- For identical oscillators: Kc ≈ 0
- For distributed frequencies: Kc depends on distribution width

---

## Entropy (`physics/entropy.js`)

### computeEntropy(state)

Calculate Shannon entropy of state distribution.

```javascript
computeEntropy(state)
```

**Parameters:**
- `state` (SedenionState): Hypercomplex state

**Returns:** number - Entropy in bits

**Notes:**
- Formula: `H = -Σ pᵢ log₂(pᵢ)`
- `pᵢ = |cᵢ|² / Σ|cⱼ|²`
- Range: [0, log₂(16)] for 16D

**Example:**
```javascript
const pureState = createBasisState(0);
console.log(computeEntropy(pureState));  // 0.0

const mixedState = new SedenionState([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]).normalize();
console.log(computeEntropy(mixedState));  // 4.0 (log₂(16))
```

---

### entropyRate(states)

Calculate entropy change rate over a sequence of states.

```javascript
entropyRate(states)
```

**Parameters:**
- `states` (Array<SedenionState>): Sequence of states

**Returns:** number - Average entropy change per step

**Example:**
```javascript
const trajectory = [state1, state2, state3, state4];
const rate = entropyRate(trajectory);
console.log('Entropy rate:', rate);
// Negative = entropy decreasing (convergence)
// Positive = entropy increasing (divergence)
```

---

### relativeEntropy(p, q)

Calculate Kullback-Leibler divergence D_KL(P || Q).

```javascript
relativeEntropy(p, q)
```

**Parameters:**
- `p` (SedenionState): Distribution P
- `q` (SedenionState): Distribution Q

**Returns:** number - KL divergence (non-negative)

**Notes:**
- Asymmetric: D_KL(P||Q) ≠ D_KL(Q||P)
- D_KL = 0 iff P = Q

---

### mutualInformation(joint, marginal1, marginal2)

Calculate mutual information I(X; Y).

```javascript
mutualInformation(joint, marginal1, marginal2)
```

**Parameters:**
- `joint` (SedenionState): Joint distribution P(X,Y)
- `marginal1` (SedenionState): Marginal P(X)
- `marginal2` (SedenionState): Marginal P(Y)

**Returns:** number - Mutual information

---

### conditionalEntropy(joint, marginal)

Calculate conditional entropy H(X|Y).

```javascript
conditionalEntropy(joint, marginal)
```

**Parameters:**
- `joint` (SedenionState): Joint distribution P(X,Y)
- `marginal` (SedenionState): Marginal P(Y)

**Returns:** number - Conditional entropy

---

## Lyapunov Exponents (`physics/lyapunov.js`)

### lyapunov(trajectory)

Estimate largest Lyapunov exponent from a trajectory.

```javascript
lyapunov(trajectory)
```

**Parameters:**
- `trajectory` (Array<number>): Time series of scalar values

**Returns:** number - Estimated Lyapunov exponent λ

**Notes:**
- λ < 0: Stable (converging)
- λ = 0: Marginally stable
- λ > 0: Chaotic (diverging)

**Example:**
```javascript
const entropies = states.map(s => s.entropy());
const lambda = lyapunov(entropies);

if (lambda < 0) {
  console.log('System is converging');
} else if (lambda > 0) {
  console.log('System is chaotic');
}
```

---

### lyapunovSpectrum(trajectories)

Estimate full Lyapunov spectrum from multiple trajectories.

```javascript
lyapunovSpectrum(trajectories)
```

**Parameters:**
- `trajectories` (Array<Array<number>>): Multiple time series

**Returns:** Array<number> - Sorted exponents (largest first)

---

### stabilityAnalysis(state, dynamics, epsilon)

Analyze local stability around a state.

```javascript
stabilityAnalysis(state, dynamics, epsilon)
```

**Parameters:**
- `state` (SedenionState): State to analyze
- `dynamics` (Function): Evolution function `state => newState`
- `epsilon` (number): Perturbation size (default 1e-6)

**Returns:** Object - `{ stable, exponents, eigenvalues }`

---

## Collapse (`physics/collapse.js`)

### collapse(state, target, strength)

Collapse a state toward a target.

```javascript
collapse(state, target, strength)
```

**Parameters:**
- `state` (SedenionState): State to collapse
- `target` (SedenionState): Target attractor
- `strength` (number): Collapse strength (0-1)

**Returns:** SedenionState - Collapsed state

**Notes:**
- `strength = 0`: No change
- `strength = 1`: Complete collapse to target
- Interpolates: `result = (1-s)*state + s*target` (normalized)

**Example:**
```javascript
const superposition = createRandomState();
const basis = createBasisState(0);

const partial = collapse(superposition, basis, 0.5);
const full = collapse(superposition, basis, 1.0);

console.log(full.coherence(basis));  // 1.0
```

---

### measurementCollapse(state, basis)

Perform measurement collapse with probabilistic outcome.

```javascript
measurementCollapse(state, basis)
```

**Parameters:**
- `state` (SedenionState): State to measure
- `basis` (Array<SedenionState>): Measurement basis states

**Returns:** Object - `{ outcome, probability, finalState }`

**Notes:**
- Outcome chosen probabilistically based on |⟨state|basis[i]⟩|²
- Final state is the chosen basis state

**Example:**
```javascript
const superposition = createRandomState();
const basis = [
  createBasisState(0),
  createBasisState(1),
  createBasisState(2)
];

const result = measurementCollapse(superposition, basis);
console.log('Measured:', result.outcome);
console.log('Probability:', result.probability);
```

---

### collapseThreshold(state)

Calculate entropy threshold for spontaneous collapse.

```javascript
collapseThreshold(state)
```

**Parameters:**
- `state` (SedenionState): State to evaluate

**Returns:** number - Entropy threshold

**Notes:**
- States with entropy below threshold are "collapsed"
- Threshold depends on state structure

---

### progressiveCollapse(state, target, steps)

Gradually collapse over multiple steps.

```javascript
progressiveCollapse(state, target, steps)
```

**Parameters:**
- `state` (SedenionState): Initial state
- `target` (SedenionState): Target state
- `steps` (number): Number of collapse steps

**Returns:** Array<SedenionState> - Trajectory from state to target

**Example:**
```javascript
const trajectory = progressiveCollapse(initial, final, 10);
for (const step of trajectory) {
  console.log('Entropy:', step.entropy());
}
```

---

## Integration Utilities

### rk4Step(state, derivative, dt)

Fourth-order Runge-Kutta integration step.

```javascript
rk4Step(state, derivative, dt)
```

**Parameters:**
- `state` (Object): Current state
- `derivative` (Function): Derivative function `state => dstate/dt`
- `dt` (number): Time step

**Returns:** Object - Updated state

---

### adaptiveStep(state, derivative, dt, tolerance)

Adaptive time step integration.

```javascript
adaptiveStep(state, derivative, dt, tolerance)
```

**Parameters:**
- `state` (Object): Current state
- `derivative` (Function): Derivative function
- `dt` (number): Initial time step
- `tolerance` (number): Error tolerance

**Returns:** Object - `{ state, dt, error }`

**Notes:**
- Automatically adjusts dt to maintain error below tolerance