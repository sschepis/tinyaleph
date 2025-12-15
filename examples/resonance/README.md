# Prime Resonance Examples

This directory contains examples demonstrating the Prime Resonance framework
from the TinyAleph library. These examples implement concepts from the
"Programming Reality" paper and the ResoFormer architecture specification.

## Examples

### 01-prime-hilbert-space.js
Demonstrates the mathematical foundation:
- Complex amplitudes in Prime Hilbert Space (HP)
- Resonance Operators: P̂ (projection), F̂ (Fourier), R̂ (rotation), Ĉ (collapse)
- Entropy-driven Hamiltonian evolution
- Memory encoding via prime factorization

Run: `node examples/resonance/01-prime-hilbert-space.js`

### 02-prime-resonance-network.js
Demonstrates resonance network structures:
- Prime Resonance Identity (PRI)
- Phase-locked prime rings
- Holographic field encoding
- ResoLang-style fragments and entangled nodes

Run: `node examples/resonance/02-prime-resonance-network.js`

### 03-resoformer.js
Demonstrates ResoFormer ML primitives (pure JavaScript):
- Quaternion-valued states: H_Q = H_P ⊗ ℍ
- Sparse prime state representations
- Resonance score: α·Jaccard + β·QuaternionAlign + γ·PhaseCoherence
- Resonant attention with top-k selection
- Hamilton product composition (non-commutative!)
- Coherence-gated adaptive computation (ACT-style)
- Entropy collapse to 64 attractors
- PR-Graph memory (put/get operations)

Run: `node examples/resonance/03-resoformer.js`

### 04-resoformer-training.js
Demonstrates TensorFlow.js trainable ResoFormer:
- Custom TensorFlow.js layers for all ResoFormer components
- QuaternionDense, ResonantAttention, CoherenceGating layers
- EntropyCollapse layer with 64-attractor codebook
- ResoFormerBlock (complete transformer block)
- Model builders: createResoFormerClassifier, createResoFormerEmbedder
- Training on synthetic prime pattern classification task

**Requires:** `npm install @tensorflow/tfjs-node`

Run: `node examples/resonance/04-resoformer-training.js`

## Key Concepts

### State Space: H_Q = H_P ⊗ ℍ

The fundamental state space combines:
- **H_P**: Prime Hilbert Space with complex amplitudes on prime basis states
- **ℍ**: Quaternions for order-sensitive, non-commutative composition

### Resonance Score

Attention weights computed from three components:
```
score(q,k) = α·Jaccard(π_q, π_k) + β·QuatAlign(ĥ_q, ĥ_k) + γ·PhaseCoherence(φ_q, φ_k)
```

Where:
- Jaccard: Prime overlap (shared structure)
- QuatAlign: Quaternion alignment via q^(-1)·k (orientation compatibility)
- PhaseCoherence: cos(φ_q - φ_k) (temporal alignment)

### Entropy Collapse

VQ-style collapse to 64 attractors with target entropy ~5.99 bits (log₂64).
This acts as an information bottleneck enforcing discrete structure.

### Coherence-Gated Computation

ACT-style adaptive depth where layers halt when coherence exceeds threshold:
```
if C(t) ≥ τ: halt
else: continue
```

## Architecture Diagram

```
Input Tokens
     │
     ▼
┌─────────────────┐
│ Token Embedding │ → Standard embedding
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          ResoFormer Block ×N            │
│  ┌─────────────────────────────────┐    │
│  │ LayerNorm → ResonantAttention   │    │
│  │     │                           │    │
│  │     ▼                           │    │
│  │ ResonanceOperator (R̂)          │    │
│  │     │                           │    │
│  │     ▼                           │    │
│  │ LayerNorm → FFN (GELU)          │    │
│  │     │                           │    │
│  │     ▼                           │    │
│  │ CoherenceGating (halt if C≥τ)   │    │
│  │     │                           │    │
│  │     ▼                           │    │
│  │ EntropyCollapse (last layer)    │    │
│  └─────────────────────────────────┘    │
└────────────────────┬────────────────────┘
                     │
                     ▼
              Task Head (LM/Classifier/Embedder)
```

## Performance

On synthetic prime pattern classification (5 classes, 1000 samples):
- **Train accuracy**: 100% after 3 epochs
- **Test accuracy**: 100%
- **Training time**: ~11 seconds (TensorFlow.js on Node.js)

The model learns to distinguish sequences based on their prime structure
(multiples of 2, 3, 5, prime indices, alternating patterns).

This folder contains examples demonstrating the concepts from the paper:

**"Programming Reality: Prime Resonance Systems for Memory, Computation, and Probability Control"**

## Examples

### 01-prime-hilbert-space.js

Demonstrates the formal Prime Hilbert Space (HP):

- **Prime Basis States** `|p⟩` - Orthonormal basis indexed by primes
- **Complex Amplitudes** `αp ∈ ℂ` - Full quantum-like representation
- **Superposition** - Uniform and weighted superpositions
- **Composite States** - Factorization into prime components
- **Resonance Operators**:
  - `P̂`: Eigenvalue operator (`P̂|p⟩ = p|p⟩`)
  - `R̂(n)`: Phase rotation (`e^(2πi log_p(n))`)
  - `Ĉ(n)`: Coupling operator
  - `Ĥ`: Hadamard-like superposition
- **Born Measurement** - Probabilistic collapse
- **Entropy-Driven Evolution** - Equation (7) dynamics

### 02-prime-resonance-network.js

Demonstrates the Prime Resonance Network (PRN) specification:

- **Prime Resonance Identity (PRI)** - Triadic identity `(P_G, P_E, P_Q)`:
  - Gaussian primes
  - Eisenstein primes  
  - Quaternionic primes
- **Phase-Locked Rings** - Irrational phase locks (φ, √2)
- **Holographic Memory** - 2D spatial encoding `I(x,y) = Σ A_p e^(-S) e^(ipθ)`
- **Entangled Nodes** - Network nodes with coherence and memory
- **Resonant Fragments** - Portable memory patterns
- **Memory Teleportation** - Conceptual demonstration

## Running the Examples

```bash
node examples/resonance/01-prime-hilbert-space.js
node examples/resonance/02-prime-resonance-network.js
```

## Key Concepts from the Paper

### Prime Hilbert Space (Equation 1)
```
HP = {|ψ⟩ = Σ αp|p⟩ : Σ|αp|² = 1, αp ∈ ℂ}
```

### Entropy-Driven Evolution (Equation 7)
```
d|Ψ(t)⟩/dt = iĤ|Ψ(t)⟩ - λ(R̂ - r_stable)|Ψ(t)⟩
```

### Collapse Probability (Equation 8)
```
P_collapse = 1 - e^(-∫S(t)dt)
```

### Holographic Encoding (Equation 11)
```
I(x,y) = Σ A_p e^(-S(x,y)) e^(ipθ)
```

## API Reference

### Core Hilbert Space

```javascript
const { Complex, PrimeState, ResonanceOperators, EntropyDrivenEvolution } = require('tinyaleph');

// Create basis state
const state = PrimeState.basis(7);

// Create superposition
const uniform = PrimeState.uniform();

// Apply operators
const R5 = ResonanceOperators.R(5);
const rotated = R5(state);

// Evolve with entropy dynamics
const evolution = new EntropyDrivenEvolution(state, { lambda: 0.1 });
evolution.evolveUntilCollapse(1000);
```

### Resonance Network

```javascript
const { 
  PrimeResonanceIdentity, 
  PhaseLockedRing, 
  EntangledNode,
  ResonantFragment 
} = require('tinyaleph');

// Create node with PRI
const node = new EntangledNode('observer');

// Establish entanglement
const strength = nodeA.entangleWith(nodeB);

// Store memory fragment
const fragment = ResonantFragment.fromText('important concept');
node.storeMemory(fragment.state, 16, 16);

// Create phase-locked ring
const ring = new PhaseLockedRing([2, 3, 5, 7, 11], 'phi');