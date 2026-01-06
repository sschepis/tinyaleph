# Phase Synchronization

## The Kuramoto Model

The **Kuramoto model** is a mathematical model for describing synchronization in systems of coupled oscillators. It captures a profound phenomenon: when oscillators interact, they tend to align their phases—to "agree" on a common rhythm.

### The Governing Equation

```
dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)
```

Where:
- θᵢ is the phase of oscillator i
- ωᵢ is its natural frequency
- K is the coupling strength
- N is the number of oscillators
- The sum is over all other oscillators

### Semantic Interpretation

| Kuramoto Concept | Semantic Meaning |
|-----------------|------------------|
| Oscillator | A concept with its prime frequency |
| Phase | Where the concept is in its "meaning cycle" |
| Frequency | The intrinsic nature of the concept |
| Coupling K | How strongly concepts influence each other |
| Synchronization | Conceptual agreement/understanding |

---

## The Oscillator Class

Individual oscillators start **quiescent** (amplitude = 0) and must be **excited** by input:

```javascript
class Oscillator {
  constructor(frequency, phase = 0, amplitude = 0) {
    this.freq = frequency;
    this.phase = phase;
    this.amplitude = amplitude;  // Starts quiescent!
    this.phaseHistory = [];
  }
  
  tick(dt, coupling = 0) {
    this.phase = (this.phase + 2 * Math.PI * this.freq * dt + coupling) % (2 * Math.PI);
    this.phaseHistory.push(this.phase);
    if (this.phaseHistory.length > 100) this.phaseHistory.shift();
  }
  
  excite(amount = 0.5) {
    this.amplitude = Math.min(1, this.amplitude + amount);
  }
  
  decay(rate = 0.02, dt = 1) {
    this.amplitude *= (1 - rate * dt);
  }
}
```

### Key Properties

- **Frequency**: Determined by the corresponding prime
- **Phase**: Evolves according to frequency + coupling
- **Amplitude**: Represents activation level (0 = inactive, 1 = fully active)
- **Phase History**: Enables Lyapunov stability analysis

---

## The Kuramoto Model Implementation

```javascript
class KuramotoModel extends OscillatorBank {
  constructor(frequencies, couplingStrength = 0.3) {
    super(frequencies);
    this.K = couplingStrength;
  }
  
  kuramotoCoupling(osc) {
    let coupling = 0;
    for (const other of this.oscillators) {
      if (other !== osc) {
        coupling += Math.sin(other.phase - osc.phase);
      }
    }
    return this.K * coupling / this.oscillators.length;
  }
  
  tick(dt) {
    // Each oscillator feels the pull of all others
    super.tick(dt, (osc) => this.kuramotoCoupling(osc) * dt);
    
    // Amplitudes decay over time
    for (const osc of this.oscillators) {
      osc.decay(0.02, dt);
    }
  }
}
```

### The Coupling Term

The coupling term `K × sin(θⱼ - θᵢ)` has beautiful properties:
- When θⱼ > θᵢ: positive, pulls oscillator i forward
- When θⱼ < θᵢ: negative, pulls oscillator i backward
- Net effect: phases move toward each other
- Strength proportional to K

---

## The Order Parameter

The **order parameter** r measures how synchronized the oscillators are:

```javascript
orderParameter() {
  let sx = 0, sy = 0;
  for (const osc of this.oscillators) {
    sx += osc.amplitude * Math.cos(osc.phase);
    sy += osc.amplitude * Math.sin(osc.phase);
  }
  const N = this.oscillators.length;
  return Math.sqrt((sx/N)**2 + (sy/N)**2);
}
```

### Interpretation

| Order Parameter | Meaning |
|-----------------|---------|
| r ≈ 0 | Desynchronized (incoherent, confused) |
| r ≈ 0.5 | Partially synchronized (emerging understanding) |
| r ≈ 1 | Fully synchronized (coherent understanding) |

The order parameter is Aleph's measure of **conceptual coherence**.

---

## Mean Phase

The **mean phase** represents the "average direction" of the oscillator ensemble:

```javascript
meanPhase() {
  let sx = 0, sy = 0, ta = 0;
  for (const osc of this.oscillators) {
    sx += osc.amplitude * Math.cos(osc.phase);
    sy += osc.amplitude * Math.sin(osc.phase);
    ta += osc.amplitude;
  }
  return ta > 0 ? Math.atan2(sy/ta, sx/ta) : 0;
}
```

When concepts synchronize, the mean phase indicates the dominant conceptual direction.

---

## Excitation by Primes

When input arrives, we excite the oscillators corresponding to input primes:

```javascript
exciteByPrimes(primes, primeList, amount = 0.5) {
  const primeSet = new Set(primes);
  for (let i = 0; i < this.oscillators.length && i < primeList.length; i++) {
    if (primeSet.has(primeList[i])) {
      this.oscillators[i].excite(amount);
    }
  }
}
```

### Excitation Flow

```
Input: "love and wisdom"

1. Tokenize → ["love", "wisdom"]
2. Encode → love = [2,3,5], wisdom = [2,7,11]
3. Primes → {2, 3, 5, 7, 11}
4. Excite oscillators for primes 2, 3, 5, 7, 11
5. Oscillators begin at different phases
6. Coupling causes synchronization
7. Order parameter rises as concepts unify
```

---

## Weighted Amplitudes

The engine uses amplitude-weighted phase values for state construction:

```javascript
getWeightedAmplitudes() {
  return this.oscillators.map(o => o.amplitude * Math.sin(o.phase));
}
```

This creates a state vector where:
- Excited oscillators contribute based on their current phase
- Quiescent oscillators contribute nothing
- The overall pattern reflects the dynamic state of the concept field

---

## Pairwise Coherence

Detailed coherence between oscillator pairs:

```javascript
pairwiseCoherence() {
  const N = this.oscillators.length;
  let total = 0, count = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      total += Math.cos(this.oscillators[i].phase - this.oscillators[j].phase);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}
```

High pairwise coherence indicates that concepts are aligning, even before full synchronization.

---

## Critical Coupling

There's a critical coupling strength Kc below which synchronization cannot occur:

```
Kc ≈ 2 / (π × g(0))
```

Where g(0) is the value of the frequency distribution at its center.

- **K < Kc**: Oscillators remain desynchronized
- **K > Kc**: Spontaneous synchronization emerges
- **K >> Kc**: Fast, complete synchronization

In Aleph, we use **adaptive coupling** that adjusts based on Lyapunov stability:

```javascript
function adaptiveCoupling(baseCoupling, lyapunovExponent, gain = 0.5) {
  if (lyapunovExponent < -0.1) return baseCoupling * (1 + gain);  // Stable: increase
  if (lyapunovExponent > 0.1) return baseCoupling * (1 - gain);   // Chaotic: decrease
  return baseCoupling;  // Marginal: maintain
}
```

---

## The Physics-Meaning Bridge

The oscillator dynamics create a bridge between physics and meaning:

```
                    PHYSICAL                         SEMANTIC
                    ========                         ========
                    
Oscillator          Resonating entity    ←→    Active concept
                    
Phase               Position in cycle    ←→    State of meaning
                    
Frequency           Natural rate         ←→    Concept identity
                    
Coupling            Interaction force    ←→    Semantic influence
                    
Synchronization     Phase alignment      ←→    Understanding
                    
Order parameter     Coherence measure    ←→    Clarity of thought
```

---

## Field-Based Computation

Aleph performs **field-based computation**—the answer emerges from oscillator dynamics:

```javascript
// Main processing loop
run(input) {
  // 1. Encode input to primes
  const inputPrimes = this.backend.encode(input);
  
  // 2. Excite corresponding oscillators
  this.excite(inputPrimes);
  
  // 3. Evolve the field
  for (let i = 0; i < maxSteps; i++) {
    this.tick(dt);
    
    // 4. Sample coherent frames
    if (orderParameter > threshold) {
      frames.push(currentState);
    }
    
    // 5. Check for stable coherence
    if (orderParameter > stableThreshold) {
      break;  // Coherent state reached
    }
  }
  
  // 6. Decode from best frame
  return this.decode(bestFrame);
}
```

The answer isn't calculated—it **crystallizes** from the dynamics.

---

## Transient vs. Steady State

Aleph captures the **transient response**, not just the steady state:

```javascript
// Track differential response
for (let i = 0; i < maxEvolutionSteps; i++) {
  this.tick(dt);
  
  // Compute input-weighted differential response
  let inputResponse = 0, otherResponse = 0;
  
  for (let j = 0; j < primeList.length; j++) {
    const diff = |current[j]| - |baseline[j]|;
    if (inputPrimes.has(primeList[j])) {
      inputResponse += diff;  // Input primes responding
    } else {
      otherResponse += |diff|;  // Other primes responding
    }
  }
  
  const differential = inputResponse - otherResponse * 0.3;
  
  // Sample frames with good differential (not just high order)
  if (differential > 0) {
    frames.push(currentFrame);
  }
}
```

This captures how the field **responds to input** rather than just its final state.

---

## Extended Synchronization Models

Beyond the basic Kuramoto model, TinyAleph provides five advanced synchronization models for complex dynamics:

### NetworkKuramoto - Topology-Aware Coupling

Instead of all-to-all coupling, uses an adjacency matrix A:

```
dθᵢ/dt = ωᵢ + K Σⱼ Aᵢⱼ sin(θⱼ - θᵢ)
```

This enables **modular synchronization** that respects semantic neighborhoods:

```javascript
const { NetworkKuramoto } = require('@aleph-ai/tinyaleph');

// Create with custom adjacency
const network = new NetworkKuramoto(frequencies, adjacency, 0.5);

// Or build from entanglement graph
network.setFromEntanglementGraph(entanglementGraph, primeList);

// Find synchronized clusters
const clusters = network.findClusters(0.5);
console.log('Found', clusters.length, 'clusters');

// Network metrics
console.log('Clustering coefficient:', network.averageClustering());
```

**Semantic Use**: Respects concept neighborhoods from the EntanglementLayer.

---

### AdaptiveKuramoto - Hebbian Plasticity

Coupling strengths evolve based on synchronization:

```
dθᵢ/dt = ωᵢ + (1/N) Σⱼ Kᵢⱼ sin(θⱼ - θᵢ)
dKᵢⱼ/dt = ε(cos(θⱼ - θᵢ) - Kᵢⱼ)
```

**"Concepts that sync together link together"**

```javascript
const { AdaptiveKuramoto } = require('@aleph-ai/tinyaleph');

// Create with learning rate
const adaptive = new AdaptiveKuramoto(frequencies, 0.3, 0.02);

// Evolve - coupling strengths change!
for (let i = 0; i < 1000; i++) {
  adaptive.tick(0.05);
}

// Check evolved coupling
console.log('Total coupling:', adaptive.totalCoupling());
console.log('K(0,1):', adaptive.adjacency[0][1]); // Strong if synced
console.log('K(0,7):', adaptive.adjacency[0][7]); // Weak if not synced
```

**Semantic Use**: Self-organizing semantic memory that learns relationships.

---

### SakaguchiKuramoto - Phase Frustration

Adds a phase lag parameter α that introduces frustration:

```
dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ - α)
```

Creates **chimera states**—where some oscillators synchronize while others don't:

```javascript
const { SakaguchiKuramoto } = require('@aleph-ai/tinyaleph');

// Create with phase lag
const sakaguchi = new SakaguchiKuramoto(frequencies, 0.5, Math.PI/4);

// Evolve
for (let i = 0; i < 500; i++) {
  sakaguchi.tick(0.05);
}

// Classify state
console.log('State:', sakaguchi.classifyState());
// 'synchronized' | 'chimera' | 'partial' | 'incoherent'

// Chimera ratio (fraction synchronized)
console.log('Chimera ratio:', sakaguchi.chimeraRatio());

// Critical phase lag for chimera formation
console.log('Critical α:', SakaguchiKuramoto.criticalPhaseLag(0.5));
```

**Semantic Use**: Models cognitive dissonance, competing interpretations, or partial understanding.

---

### SmallWorldKuramoto - Watts-Strogatz Topology

Creates small-world networks with:
- **High clustering** (local neighborhoods connected)
- **Short path length** (random long-range shortcuts)

```javascript
const { SmallWorldKuramoto } = require('@aleph-ai/tinyaleph');

// k = neighbors per side, p = rewiring probability
// p=0: ring lattice, p=1: random graph
const smallWorld = new SmallWorldKuramoto(frequencies, 4, 0.1, 0.5);

// Network metrics
console.log('Clustering:', smallWorld.averageClustering());
console.log('Avg path length:', smallWorld.averagePathLength());
console.log('Small-world σ:', smallWorld.smallWorldCoefficient());
// σ > 1 indicates small-world properties

// Regenerate with new parameters
smallWorld.regenerate(6, 0.2);
```

| Rewiring p | Clustering | Path Length | Character |
|------------|------------|-------------|-----------|
| 0.0        | High       | Long        | Regular lattice |
| 0.1        | High       | Short       | **Small-world** |
| 1.0        | Low        | Short       | Random |

**Semantic Use**: Balance between local semantic clusters and global conceptual reach.

---

### MultiSystemCoupling - Cross-System Synchronization

Couples multiple Kuramoto systems via their mean fields:

```
dθᵢ^(a)/dt = [internal coupling] + Σ_b G_ab r^(b) sin(ψ^(b) - θᵢ^(a))
```

Models multi-agent alignment or hierarchical organization:

```javascript
const {
  KuramotoModel,
  MultiSystemCoupling,
  createHierarchicalCoupling,
  createPeerCoupling
} = require('@aleph-ai/tinyaleph');

// Manual creation
const system1 = new KuramotoModel(frequencies, 0.4);
const system2 = new KuramotoModel(frequencies, 0.4);
const multi = new MultiSystemCoupling([system1, system2]);

// Or use factories
const hierarchy = createHierarchicalCoupling(frequencies, 3, 16);
const peers = createPeerCoupling(frequencies, 4, 0.15);

// Evolve
for (let i = 0; i < 800; i++) {
  multi.tick(0.05);
}

// Analyze
const state = multi.getState();
console.log('Global order:', state.globalOrder);
console.log('Inter-system coherence:', state.interSystemCoherence);
// Matrix showing phase alignment between systems
```

**Semantic Use**:
- Hierarchical: context/domain layers driving content layers
- Peer: multiple agents reaching consensus
- Cross-domain: knowledge transfer between fields

---

## Model Selection Guide

| Scenario | Model | Why |
|----------|-------|-----|
| Semantic neighborhood structure | NetworkKuramoto | Respects topology |
| Learning relationships | AdaptiveKuramoto | Self-organizing |
| Conflicting interpretations | SakaguchiKuramoto | Chimera states |
| Balance local/global | SmallWorldKuramoto | Optimal connectivity |
| Multi-agent consensus | MultiSystemCoupling | Cross-system |
| Hierarchical context | MultiSystemCoupling | Bottom-up flow |

---

## Summary

Phase synchronization provides:

1. **Dynamic representation** of concepts as oscillators
2. **Natural synchronization** through Kuramoto coupling
3. **Order parameter** as coherence measure
4. **Transient capture** of input-specific responses
5. **Adaptive coupling** for stability control
6. **Field-based computation** where answers emerge from dynamics
7. **Extended models** for topology, plasticity, frustration, and multi-system dynamics

The oscillator model is the heartbeat of semantic computation.

---

## Next: [Entropy and Reasoning →](./04-entropy-reasoning.md)