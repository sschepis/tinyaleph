# @aleph-ai/tinyaleph

**Prime-resonant semantic computing framework**

A novel computational paradigm that encodes meaning as prime number signatures, embeds them in hypercomplex space, and performs reasoning through entropy minimization and oscillator synchronization.

[![npm version](https://badge.fury.io/js/@sschepis%2Ftinyaleph.svg)](https://www.npmjs.com/package/@aleph-ai/tinyaleph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Prime Semantics**: Encode concepts as unique prime number signatures
- **Hypercomplex Algebra**: 16-dimensional sedenion space with non-commutative multiplication, exp/log/slerp
- **Oscillator Dynamics**: Kuramoto-model synchronization for coherent reasoning
- **Stochastic Dynamics**: Noise-robust Kuramoto with Langevin, colored, and thermal noise models
- **Prime Entanglement**: Graph-based tracking of prime relationships and co-occurrences
- **Event Streaming**: Real-time monitoring with EventEmitter pattern and async iteration
- **Entropy Minimization**: Reasoning as reduction of semantic uncertainty
- **Multiple Backends**: Semantic (NLP), Cryptographic (hashing), Scientific (quantum-inspired), Bioinformatics (DNA/protein)
- **Formal Type System**: Typed term calculus with N(p)/A(p)/S types and ordering constraints
- **Reduction Semantics**: Strong normalization with prime-preserving operators
- **Lambda Translation**: Model-theoretic semantics via λ-calculus embedding
- **Enochian Vocabulary**: 21-letter angelic alphabet with prime basis and sedenion operations
- **ResoFormer Architecture**: Complete prime-indexed transformer with multi-head attention
- **Multi-Z Memory**: Hierarchical memory with fast/slow/permanent channels
- **Symbolic AI**: 184+ emoji symbols with cultural tags, resonance-enhanced inference
- **Golden Ratio Resonance**: Harmony measurement using φ ≈ 1.618 ratio detection
- **Topological Invariants**: 108 invariant (2²×3³), Trefoil complexity, physical constant derivation
- **Gauge Symmetry**: Standard Model SU(3)×SU(2)×U(1) from 108 factorization
- **Observer Hierarchy**: Multi-scale observers from quantum to cosmic
- **Free Energy Dynamics**: Cubic FEP model for consciousness and curiosity
- **Discrete Dynamics**: Integer sine tables, histogram coherence, tick-based gating
- **Codebook Tunneling**: 64-attractor SMF codebook for controlled state transitions
- **Canonical Fusion**: Deterministic FUSE(p,q,r) triad selection
- **CRT-Homology**: Chinese Remainder Theorem for semantic reconstruction with homology-based consistency detection
- **Birkhoff Attention**: Doubly-stochastic attention via Sinkhorn-Knopp projection

## Installation

```bash
npm install @aleph-ai/tinyaleph
```

## Quick Start

```javascript
const { createEngine, SemanticBackend } = require('@aleph-ai/tinyaleph');

// Load configuration
const config = require('@aleph-ai/tinyaleph/data.json');

// Create a semantic engine
const engine = createEngine('semantic', config);

// Process a query
const result = engine.run('What is the relationship between wisdom and truth?');

console.log('Output:', result.output);
console.log('Entropy:', result.entropy);
console.log('Steps:', result.steps.length);
```

## Core Concepts

### Prime Encoding

Every concept maps to a unique set of prime numbers:

```javascript
const backend = new SemanticBackend(config);

const primes = backend.encode('love and wisdom');
console.log(primes);  // [2, 3, 5, 7, 11, ...]
```

### Hypercomplex States

Primes embed into 16-dimensional sedenion space:

```javascript
const { Hypercomplex } = require('@aleph-ai/tinyaleph');

// Create a state
const state = new Hypercomplex(16);
state.excite([2, 3, 5]);  // Excite with primes

// States support multiplication (non-commutative!)
const combined = state1.multiply(state2);
console.log(state1.multiply(state2) !== state2.multiply(state1));  // true
```

### Entropy-Based Reasoning

Reasoning reduces entropy through semantic transforms:

```javascript
const engine = createEngine('semantic', config);
const result = engine.run('Confused question here');

// Watch entropy decrease through reasoning steps
for (const step of result.steps) {
  console.log(`Step ${step.step}: entropy ${step.entropyAfter.toFixed(3)}`);
}
```

## Backends

### Semantic Backend

Natural language understanding and concept mapping:

```javascript
const { SemanticBackend } = require('@aleph-ai/tinyaleph');

const backend = new SemanticBackend(config);

// Tokenize
const tokens = backend.tokenize('Love is truth');

// Encode to primes
const primes = backend.encode('Love is truth');

// Decode back
const text = backend.decode(primes);

// Compare concepts
const state1 = backend.textToOrderedState('wisdom');
const state2 = backend.textToOrderedState('knowledge');
console.log('Similarity:', state1.coherence(state2));
```

### Cryptographic Backend

Semantic hashing and key derivation:

```javascript
const { CryptographicBackend, hash, deriveKey } = require('@aleph-ai/tinyaleph');

// Quick hash
const h = hash('my secret data');

// Key derivation
const key = deriveKey('password', 'salt', 32, 10000);

// Full backend
const crypto = new CryptographicBackend(config);
const semanticHash = crypto.hash('similar meanings produce similar hashes');
```

### Scientific Backend

Quantum-inspired computation:

```javascript
const { ScientificBackend } = require('@aleph-ai/tinyaleph');

const backend = new ScientificBackend(config);

// Create quantum-like states
const state = backend.createRandomState();
const basis = backend.createBasisState(0);

// Superposition
const superposition = backend.superpose(state, 0.5, basis, 0.5);

// Measurement
const result = backend.measure(superposition, [basis]);
```

### Bioinformatics Backend

DNA computing, protein folding, and molecular biology:

```javascript
const { BioinformaticsBackend, DNACircuit, ANDGate, ORGate } = require('@aleph-ai/tinyaleph');

const backend = new BioinformaticsBackend();

// Encode DNA sequence
const dnaPrimes = backend.encode('ATGCGATCG');

// Transcribe DNA to RNA
const transcribed = backend.transcribe(dnaPrimes, { force: true });
console.log('mRNA primes:', transcribed.rna);

// Translate RNA to Protein
const translated = backend.translate(transcribed.rna);
console.log('Protein:', backend.decode(translated.protein));

// Full gene expression (DNA → RNA → Protein)
const expressed = backend.express(dnaPrimes);
console.log('Protein sequence:', expressed.sequence);

// Protein folding via Kuramoto oscillators
const proteinPrimes = backend.encode('MWLKFVIER');
const foldResult = backend.foldProtein(proteinPrimes);
console.log('Folding order parameter:', foldResult.orderParameter);

// Molecular binding affinity
const affinity = backend.bindingAffinity(dnaPrimes, proteinPrimes);
console.log('Binding affinity:', affinity.affinity);
```

### DNA Computing

Build logic gates and circuits using DNA strands:

```javascript
const { DNACircuit, ANDGate, ORGate, NOTGate } = require('@aleph-ai/tinyaleph');

// Create logic gates
const andGate = new ANDGate({ name: 'and1' });
const orGate = new ORGate({ name: 'or1' });
const notGate = new NOTGate({ name: 'not1' });

// Evaluate gates (concentration-based)
console.log(andGate.evaluate(1, 1));  // { output: true, ... }
console.log(orGate.evaluate(0, 1));   // { output: true, ... }
console.log(notGate.evaluate(0));     // { output: true, ... }

// Build a circuit
const circuit = new DNACircuit('logic-circuit');
circuit.addGate('and1', new ANDGate({ name: 'and1' }));
circuit.addGate('not1', new NOTGate({ name: 'not1' }));
circuit.addGate('or1', new ORGate({ name: 'or1' }));
circuit.connect('and1', 'or1', 1);
circuit.connect('not1', 'or1', 2);

// Evaluate circuit
const result = circuit.evaluate();
```

## Physics Engine

### Oscillators

```javascript
const { Oscillator, OscillatorBank, KuramotoModel } = require('@aleph-ai/tinyaleph');

// Create oscillator bank
const bank = new OscillatorBank(16);

// Excite with primes
bank.excite([2, 3, 5, 7]);

// Kuramoto synchronization
const kuramoto = new KuramotoModel(bank, { coupling: 0.1 });
kuramoto.step(0.01);

console.log('Order parameter:', kuramoto.orderParameter());
```

### Extended Synchronization Models

Five advanced Kuramoto-family models for complex synchronization dynamics:

```javascript
const {
  NetworkKuramoto,      // Topology-aware coupling
  AdaptiveKuramoto,     // Hebbian plasticity
  SakaguchiKuramoto,    // Phase frustration (chimera states)
  SmallWorldKuramoto,   // Watts-Strogatz topology
  MultiSystemCoupling   // Cross-system synchronization
} = require('@aleph-ai/tinyaleph');

// Network Kuramoto with custom topology
const network = new NetworkKuramoto(frequencies, adjacencyMatrix, 0.5);
network.setFromEntanglementGraph(entanglementGraph, primeList);

// Adaptive Kuramoto with Hebbian learning
const adaptive = new AdaptiveKuramoto(frequencies, 0.3, 0.02);
// Coupling evolves: "concepts that sync together link together"

// Sakaguchi-Kuramoto with phase frustration
const sakaguchi = new SakaguchiKuramoto(frequencies, 0.5, Math.PI/4);
console.log('State:', sakaguchi.classifyState()); // synchronized/chimera/incoherent

// Small-world topology
const smallWorld = new SmallWorldKuramoto(frequencies, 4, 0.1, 0.5);
console.log('Small-world coefficient:', smallWorld.smallWorldCoefficient());

// Multi-system coupling (hierarchical or peer-to-peer)
const multi = new MultiSystemCoupling([system1, system2, system3]);
console.log('Inter-system coherence:', multi.interSystemCoherence());
```

### Stochastic Kuramoto Models

Noise-robust synchronization with Langevin dynamics:

```javascript
const {
  StochasticKuramoto,      // White noise Langevin dynamics
  ColoredNoiseKuramoto,    // Ornstein-Uhlenbeck noise
  ThermalKuramoto          // Temperature-dependent coupling
} = require('@aleph-ai/tinyaleph');

// White noise model
const stochastic = new StochasticKuramoto(frequencies, {
  coupling: 0.5,
  noiseIntensity: 0.1
});

stochastic.evolve(100, 0.01);
const { mean, stdDev } = stochastic.orderParameterWithUncertainty(50, 0.01);

// Colored noise (Ornstein-Uhlenbeck process)
const colored = new ColoredNoiseKuramoto(frequencies, {
  correlationTime: 2.0,
  noiseIntensity: 0.1
});

// Thermal model with temperature-dependent noise
const thermal = new ThermalKuramoto(frequencies, { temperature: 2.0 });
thermal.setTemperature(4.0);  // Higher temp = more noise
const Tc = thermal.estimateCriticalTemperature();
```

### Prime Entanglement Graph

Track prime relationships from co-occurrence and resonance:

```javascript
const { PrimeEntanglementGraph } = require('@aleph-ai/tinyaleph');

const graph = new PrimeEntanglementGraph([2, 3, 5, 7, 11]);

// Record co-occurrences
graph.observe([2, 3], [5, 7], 0.8);
graph.observe([5, 7], [11], 0.6);

// Query relationships
const neighbors = graph.neighbors(7, 2);  // 2-hop neighborhood
const path = graph.shortestPath(2, 11);

// Graph metrics
const cc = graph.clusteringCoefficient(5);
const stats = graph.stats();

// Convert to Kuramoto network
const adjacency = graph.toAdjacencyMatrix([2, 3, 5, 7, 11]);
```

### Event-Driven Streaming

Real-time monitoring and async iteration:

```javascript
const {
  AlephEventEmitter,
  AlephMonitor,
  EvolutionStream
} = require('@aleph-ai/tinyaleph');

// Event emitter with throttling
const emitter = new AlephEventEmitter();
emitter.throttle('tick', 100);  // Max once per 100ms

emitter.on('collapse', ({ from, to, probability }) => {
  console.log(`Collapsed with p=${probability}`);
});

emitter.on('sync', ({ orderParameter }) => {
  console.log(`Synchronized: r=${orderParameter}`);
});

// Promise-based waiting
const data = await emitter.waitFor('ready', 5000);

// Async iteration over evolution
const stream = EvolutionStream.fromEvolvable(kuramoto);

for await (const state of stream.take(100)) {
  console.log(state.orderParameter);
}

// Stream operators
const filtered = stream
  .filter(s => s.entropy < 2.0)
  .map(s => s.orderParameter)
  .take(50);
```

### Entropy and Stability

```javascript
const { shannonEntropy, estimateLyapunov, stateEntropy } = require('@aleph-ai/tinyaleph');

// Calculate entropy
const entropy = stateEntropy(state);

// Estimate Lyapunov exponent for stability
const lambda = estimateLyapunov(entropyTimeSeries);
console.log('Stable:', lambda < 0);
```

### Hypercomplex Algebra Extensions

Extended operations for smooth interpolation and rotations:

```javascript
const { Hypercomplex } = require('@aleph-ai/tinyaleph');

const q1 = Hypercomplex.fromArray([1, 0, 0, 0]);
const q2 = Hypercomplex.fromAxisAngle(4, [0, 0, 1], Math.PI/2);

// Exponential and logarithm
const expQ = q1.exp();
const logQ = q2.log();

// Smooth interpolation (slerp)
for (let t = 0; t <= 1; t += 0.1) {
  const interpolated = q1.slerp(q2, t);
}

// Rotation operations
const rotated = q2.sandwich(vector);
const axis = q2.toAxisAngle();

// Power operations
const squared = q1.pow(2);
const cubed = q1.powInt(3);
```

### Multi-Z Channel Primeon Ladder

Hierarchical memory with different decay rates:

```javascript
const { PrimeonZLadderMulti, createAdiabaticSchedule } = require('@aleph-ai/tinyaleph');

const ladder = new PrimeonZLadderMulti({
  N: 32,
  zChannels: [
    { name: 'fast', dz: 1, leak: 0.2, decay: 0.1 },
    { name: 'slow', dz: 1, leak: 0.01, decay: 0.001 },
    { name: 'permanent', dz: 1, leak: 0.0, decay: 0.0 }
  ],
  J: 0.25
});

// Per-channel metrics
const metrics = ladder.channelMetrics();
console.log('Fast entropy:', metrics.fast.entropy);
console.log('Slow Z-flux:', metrics.slow.totalFlux);

// Adiabatic parameter schedules
const Jt = createAdiabaticSchedule(0.1, 0.5, 100, 'sinusoidal');
const ladder2 = new PrimeonZLadderMulti({ N: 16, Jt });
```

### Topological Physics

The 108 Invariant from 108bio.pdf provides deep connections between number theory and physics:

```javascript
const {
  TWIST_108,
  Knot,
  TREFOIL,
  PhysicalConstants,
  GaugeSymmetry,
  FreeEnergyDynamics,
  OBSERVER_HIERARCHY
} = require('@aleph-ai/tinyaleph/core/topology');

// 108 Invariant: 2² × 3³ = 108
console.log(TWIST_108.value);           // 108
console.log(TWIST_108.factorization);   // { twos: 2, threes: 3 }

// Twist angle κ(p) = 360°/p
const twistAngle = TWIST_108.twistAngle(7);  // 51.43°

// Find minimum primes for closed twist (sum to 360°)
const closingPrimes = TWIST_108.findClosingPrimes(3);

// Trefoil Knot with complexity T = s·c - b + u = 17
console.log(TREFOIL.strands);      // 1
console.log(TREFOIL.crossings);    // 3
console.log(TREFOIL.bridges);      // 2
console.log(TREFOIL.unknotting);   // 1
console.log(TREFOIL.complexity);   // 17

// Physical constants from 108 + Trefoil
console.log(PhysicalConstants.PROTON_ELECTRON_RATIO);  // 1836 (17 × 108)
console.log(PhysicalConstants.FINE_STRUCTURE_INV);     // 137 (108 + 29)
console.log(PhysicalConstants.ALPHA);                  // 1/137

// Gauge symmetry from 108 factorization
const gauge = new GaugeSymmetry();
console.log(gauge.generators);       // { SU3: 8, SU2: 3, U1: 1 }
console.log(gauge.totalDimension);   // 12
console.log(gauge.isStandardModel);  // true

// Free Energy Dynamics (cubic FEP)
// dψ/dt = αψ + βψ² + γψ³
const fep = new FreeEnergyDynamics({ alpha: 0.1, beta: -0.3, gamma: 0.2 });
const energy = fep.freeEnergy(0.5);   // F(ψ)
const gradient = fep.gradient(0.5);   // dF/dψ
const minima = fep.findMinima();      // Stable states

// Observer Hierarchy (quantum to cosmic scales)
OBSERVER_HIERARCHY.forEach(level => {
  console.log(`${level.name}: scale=${level.scale}, capacity=${level.capacity}`);
});
// cellular: scale=1e-6, capacity=1e6
// neural: scale=1e-3, capacity=1e9
// cognitive: scale=1, capacity=1e12
// collective: scale=1e6, capacity=1e15
// cosmic: scale=1e26, capacity=1e21
```

### Discrete Dynamics

Integer-domain computation from discrete.pdf:

```javascript
const { INT_SINE_TABLE, computeHistogramCoherence } = require('@aleph-ai/tinyaleph/apps/sentient/lib/prsc');
const { SMF_CODEBOOK, nearestCodebookAttractor, codebookTunnel } = require('@aleph-ai/tinyaleph/apps/sentient/lib/smf');
const { canonicalTriad, canonicalFusion, verifyCanonical } = require('@aleph-ai/tinyaleph/apps/sentient/lib/prime-calculus');
const { TickGate } = require('@aleph-ai/tinyaleph/apps/sentient/lib/hqe');

// Integer Sine Table (M=256 discretization)
console.log(INT_SINE_TABLE.M);            // 256
const sinValue = INT_SINE_TABLE.sin(64);  // Integer sine at phase 64
const cosValue = INT_SINE_TABLE.cos(128); // Integer cosine at phase 128

// Histogram Coherence C_bin(t) = max_k(b_k(t))/|P|
const phases = [10, 12, 11, 50, 52, 51, 100, 102, 101];
const coherence = computeHistogramCoherence(phases, { numBins: 16 });
// coherence ≈ 0.33 (three clusters of 3 phases each)

// 64-Attractor SMF Codebook
console.log(SMF_CODEBOOK.length);         // 64
console.log(SMF_CODEBOOK[0]);             // { index: 0, phase: 0, label: '0x00' }

// Find nearest codebook attractor
const nearest = nearestCodebookAttractor(130);  // phase 130
console.log(nearest.index);               // Nearest codebook index
console.log(nearest.distance);            // Distance to attractor

// Controlled tunneling to codebook attractor
const tunneled = codebookTunnel(130, { force: 0.5 });
console.log(tunneled.original);           // 130
console.log(tunneled.target);             // Nearest attractor phase
console.log(tunneled.result);             // Tunneled phase (interpolated)

// Canonical Fusion FUSE(p,q,r) selection
const triad = canonicalTriad(19);  // Find canonical triad for sum 19
console.log(triad);                // [3, 5, 11] (lexicographically first)

// Verify canonical property
console.log(verifyCanonical(3, 5, 11, 19));  // true

// Fuse with automatic triad selection
const fused = canonicalFusion(19);
console.log(fused.triad);          // [3, 5, 11]
console.log(fused.sum);            // 19

// Tick-Only HQE Gate
const tickGate = new TickGate({ threshold: 0.7 });
const gateResult = tickGate.evaluate({ coherence: 0.8, tickValid: true });
console.log(gateResult.passed);    // true (coherence > threshold && tick valid)
console.log(gateResult.reason);    // 'TICK_VALID'
```

### Observer Capacity

Calculate observer capacity from 108bio.pdf's C_obs = α·N_osc·K̄·τ⁻¹:

```javascript
const { SymbolicObserver } = require('@aleph-ai/tinyaleph/apps/sentient/lib/symbolic-observer');

const observer = new SymbolicObserver();

// Add oscillator bank for N_osc
observer.addOscillatorBank(bank);

// Calculate observer capacity
const capacity = observer.calculateObserverCapacity({
  alpha: 1/137,           // Fine structure constant
  meanCoupling: 0.5,      // K̄ average coupling
  coherenceTime: 0.1      // τ coherence time
});

console.log(capacity.value);       // Capacity in bits/second
console.log(capacity.numOscillators);
console.log(capacity.formula);     // 'α × N_osc × K̄ × τ⁻¹'
```

### Free Energy Curiosity

Cubic FEP-based curiosity for learning systems:

```javascript
const { FreeEnergyCuriosity } = require('@aleph-ai/tinyaleph/apps/sentient/lib/learning/curiosity');

const curiosity = new FreeEnergyCuriosity({
  alpha: 0.1,    // Linear coefficient
  beta: -0.3,    // Quadratic coefficient
  gamma: 0.2     // Cubic coefficient
});

// Evaluate free energy at belief state ψ
const energy = curiosity.freeEnergy(0.5);

// Get gradient for belief update
const grad = curiosity.gradient(0.5);

// Find stable belief states (local minima)
const stableStates = curiosity.findMinima();

// Check if current state is at equilibrium
const isStable = curiosity.isStable(0.5, { tolerance: 0.01 });
```

### Observer Scale Management

Multi-scale observer hierarchy from 108bio.pdf:

```javascript
const { ObserverScaleManager } = require('@aleph-ai/tinyaleph/apps/sentient/lib/collective');

const manager = new ObserverScaleManager();

// Assign node to appropriate hierarchy level based on capacity
const level = manager.assignNode(nodeId, observerCapacity);
console.log(level.name);       // 'neural', 'cognitive', etc.
console.log(level.scale);      // Physical scale
console.log(level.capacity);   // Information capacity

// Get all nodes at a level
const cognitiveNodes = manager.getNodesAtLevel('cognitive');

// Get hierarchy statistics
const stats = manager.getHierarchyStats();
console.log(stats.totalNodes);
console.log(stats.levelDistribution);
```

### ResoFormer Architecture

Complete prime-indexed transformer:

```javascript
const {
  ResoFormer,
  ResoFormerBlock,
  ResonantMultiHeadAttention,
  PrimeFFN,
  SparsePrimeState
} = require('@aleph-ai/tinyaleph');

// Create sparse prime states
const state1 = SparsePrimeState.fromPrimes([2, 3, 5]);
const state2 = SparsePrimeState.fromPrimes([7, 11, 13]);

// Multi-head attention
const attention = new ResonantMultiHeadAttention({
  numHeads: 8,
  numPrimes: 4096
});

const result = attention.forward(state1, [state2], [state2]);

// Full ResoFormer model
const model = new ResoFormer({
  numLayers: 6,
  numHeads: 8,
  hiddenDim: 256
});

const outputs = model.forward([state1, state2]);
```

### CRT-Enhanced ResoFormer

Integrates Chinese Remainder Theorem reconstruction with homology-based regularization:

```javascript
const {
    CRTResonantAttention,
    HomologyRegularizedBlock,
    CRTResoFormer,
    createCRTResoFormer
} = require('@aleph-ai/tinyaleph');

// Create CRT-enhanced model
const model = createCRTResoFormer({
    numLayers: 3,
    numHeads: 4,        // Maps to coprime moduli [2, 3, 5, 7]
    homologyWeight: 0.1
});

// Process sequence with homology detection
const sequence = [
    SparsePrimeState.fromHash('the'),
    SparsePrimeState.fromHash('quick'),
    SparsePrimeState.fromHash('fox')
];

const result = model.forward(sequence);

console.log('Total homology loss:', result.totalLoss);
console.log('Holes detected:', result.homologyReport.hasHoles);
console.log('Betti numbers:', result.homologyReport.maxBettiNumber);
```

### CRT Residue Encoding

Encode semantic states as residue distributions over coprime moduli:

```javascript
const {
    ResidueEncoder,
    CRTReconstructor,
    BirkhoffProjector,
    HomologyLoss,
    DEFAULT_PRIMES_SMALL
} = require('@aleph-ai/tinyaleph');

// Use first 4 primes: [2, 3, 5, 7], P = 210
const primes = DEFAULT_PRIMES_SMALL;
const encoder = new ResidueEncoder(primes, 16);
const crt = new CRTReconstructor(primes);

// Encode hidden vector to residue distributions
const h = new Float64Array(16).fill(0.5);
const residues = encoder.encode(h);
const expectedResidues = encoder.expectedResidues(residues);

// CRT reconstruction
const L = crt.reconstruct(expectedResidues);
console.log('Reconstructed:', L);

// Detect kernel (consistency failures)
const inKernel = crt.detectKernel(expectedResidues, 0.1);
console.log('In kernel:', inKernel);

// Birkhoff attention (doubly-stochastic)
const birkhoff = new BirkhoffProjector(20);
const attentionMatrix = [[0.8, 0.2], [0.3, 0.7]];
const projected = birkhoff.project(attentionMatrix);
// Row sums ≈ 1, column sums ≈ 1
```

### Homology Loss

Detect semantic inconsistencies as topological holes:

```javascript
const { HomologyLoss, CRTReconstructor } = require('@aleph-ai/tinyaleph');

const crt = new CRTReconstructor([2, 3, 5, 7]);
const homology = new HomologyLoss({ tau: 0.1 });

// Batch of residue tuples
const residueBatch = [
    [0.5, 1.2, 2.8, 4.1],
    [0.99, 0.01, 2.5, 3.99],
    [0.1, 0.2, 0.3, 0.4]
];

// Compute homology loss
const result = homology.compute(residueBatch, crt);
console.log('Homology loss:', result.loss);
console.log('Cycles detected:', result.cycles);

// Betti numbers (topological invariants)
const betti = homology.computeBettiNumbers(residueBatch, crt);
console.log('β₀ (components):', betti.beta0);
console.log('β₁ (holes):', betti.beta1);
```

## Symbolic AI

### Symbol Database

184+ emoji symbols with prime assignments and cultural tags:

```javascript
const { getSymbol, symbolDatabase } = require('@aleph-ai/tinyaleph');

// Get a symbol
const hero = getSymbol('hero');
console.log(hero);
// { id: 'hero', unicode: '🦸', prime: 1013, meaning: 'Hero archetype', culturalTags: ['universal'] }

// Find Greek mythology symbols
const greekSymbols = symbolDatabase.getSymbolsByTag('greek');

// Encode/decode concepts to prime signatures
const signature = symbolDatabase.encode(['hero', 'journey', 'mountain']);
const symbols = symbolDatabase.decode(signature);
```

### Semantic Inference

Pattern matching with resonance-enhanced disambiguation:

```javascript
const { inferSymbol, inferWithResonance, inferMostResonant } = require('@aleph-ai/tinyaleph');

// Basic inference
const result = inferSymbol('brave knight');
// { symbol: ⚔️, method: 'regex', confidence: 0.85 }

// Resonance-enhanced inference - symbols ranked by harmony
const symbols = inferWithResonance('The hero fought the shadow in the temple');
// Symbols sorted by attention weight based on resonance scores

// Context-aware selection
const context = [getSymbol('warrior'), getSymbol('temple')];
const best = inferMostResonant('weapon', context);
// → 🗡️ sword (high resonance with warrior/temple context)
```

### Compound Symbols

Build multi-symbol concepts through prime multiplication:

```javascript
const { createCompound, getCompound, compoundBuilder } = require('@aleph-ai/tinyaleph');

// Pre-built compound
const greekWarrior = getCompound('greek_warrior');
// { unicode: '⚔️⛩️🦉', meaning: 'Greek Warrior: Temple guardian blessed by Athena' }

// Create custom compound
const fireMage = createCompound('fire_mage',
  ['magician', 'fire', 'staff'],
  'Fire Mage - Wielder of flame magic'
);

// Calculate internal harmony
const harmony = compoundBuilder.calculateCompoundResonance(fireMage);
```

### Golden Ratio Resonance

Primes whose ratio approaches φ ≈ 1.618 have natural harmony:

```javascript
const { calculateResonance, findGoldenPairs, resonanceSignature } = require('@aleph-ai/tinyaleph');

// Check resonance between primes
calculateResonance(3, 5);   // 0.9 (Fibonacci pair!)
calculateResonance(7, 11);  // 0.936 (close to φ)

// Find golden pairs
const pairs = findGoldenPairs([2, 3, 5, 7, 11, 13]);

// Get signature for symbol set
const sig = resonanceSignature([2, 3, 5, 7]);
console.log(`Mean resonance: ${sig.mean}, Golden pairs: ${sig.goldenCount}`);
```

## Formal Semantics

### Typed Term Calculus

The library implements a formal type system for prime-based compositional semantics:

```javascript
const { N, A, FUSE, CHAIN, SENTENCE, TypeChecker } = require('@aleph-ai/tinyaleph');

// Create typed terms
const noun7 = N(7);      // N(7) - noun indexed by prime 7
const adj3 = A(3);       // A(3) - adjective indexed by prime 3

// Adjective application with ordering constraint (p < q)
const chain = adj3.apply(noun7);  // A(3)N(7) is valid since 3 < 7

// Triadic fusion where p+q+r is prime
const fused = FUSE(3, 5, 11);  // 3+5+11 = 19 (prime) ✓

// Sentence composition
const s1 = SENTENCE(7);
const s2 = SENTENCE(11);
const compound = SEQ(s1, s2);  // s₁ ◦ s₂

// Type checking
const checker = new TypeChecker();
console.log(checker.inferType(noun7));  // 'N'
console.log(checker.checkApplication(adj3, noun7));  // { valid: true }
```

### Reduction Semantics

Strong normalization with prime-preserving operators:

```javascript
const {
    ReductionSystem,
    ResonanceOperator,
    NextPrimeOperator,
    demonstrateStrongNormalization
} = require('@aleph-ai/tinyaleph');

// Create reduction system
const reduction = new ReductionSystem();

// Add prime-preserving operators
reduction.addOperator(new ResonanceOperator(2));    // Resonance at p=2
reduction.addOperator(new NextPrimeOperator());      // Map to next prime

// Normalize a term sequence
const result = reduction.normalize([7, 11, 13]);
console.log(result.normalForm);    // Canonical form
console.log(result.steps);         // Reduction trace

// Demonstrate strong normalization
const proof = demonstrateStrongNormalization([3, 5, 7], reduction);
console.log(proof.terminates);     // true (guaranteed!)
```

### Lambda Calculus Translation

Model-theoretic semantics via τ translation:

```javascript
const {
    Translator,
    LambdaEvaluator,
    Semantics
} = require('@aleph-ai/tinyaleph');

// Translate prime terms to λ-expressions
const translator = new Translator();
const lambda = translator.translateNoun(N(7));  // Constant 7
const appLambda = translator.translateChain(chain);

// Evaluate λ-expressions
const evaluator = new LambdaEvaluator();
const normal = evaluator.normalize(appLambda);

// Model-theoretic interpretation
const semantics = new Semantics();
semantics.domain = [2, 3, 5, 7, 11, 13];  // Prime domain
const value = semantics.interpret(N(7));   // 7
```

### Enochian Vocabulary

The 21-letter angelic alphabet with prime basis and sedenion operations:

```javascript
const {
    EnochianEngine,
    ENOCHIAN_ALPHABET,
    PRIME_BASIS,
    CORE_VOCABULARY,
    SedenionElement
} = require('@aleph-ai/tinyaleph/apps/sentient/lib/enochian-vocabulary');

// 21-letter alphabet with prime mappings
console.log(ENOCHIAN_ALPHABET['A']);  // { prime: 3, value: 1, angle: 51.43 }
console.log(PRIME_BASIS);  // [7, 11, 13, 17, 19, 23, 29]

// Enochian engine for word processing
const engine = new EnochianEngine();

// Parse and compute word prime value
const parsed = engine.parseWord('MADRIAX');  // "O ye heavens"
console.log(parsed.primeValue);
console.log(parsed.letters);

// Sedenion operations (16-dimensional)
const s1 = new SedenionElement([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const s2 = new SedenionElement([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const product = s1.multiply(s2);  // Non-commutative!

// Access core vocabulary (35+ Enochian words)
console.log(CORE_VOCABULARY['OL']);     // "I" (first person)
console.log(CORE_VOCABULARY['ZORGE']);  // "be friendly unto"
```

## API Overview

### Main Exports

| Export | Description |
|--------|-------------|
| `createEngine(type, config)` | Create engine with backend |
| `AlephEngine` | Unified computation engine |
| `SemanticBackend` | Natural language processing |
| `CryptographicBackend` | Hashing and key derivation |
| `ScientificBackend` | Quantum-inspired computation |
| `BioinformaticsBackend` | DNA/RNA/Protein computation |
| `DNACircuit` | DNA logic circuit builder |
| `ANDGate` / `ORGate` / `NOTGate` | DNA logic gates |
| `Hypercomplex` | Sedenion algebra with exp/log/slerp |
| `Oscillator` / `OscillatorBank` | Phase-amplitude oscillators |
| `KuramotoModel` | Coupled oscillator synchronization |
| `NetworkKuramoto` | Topology-aware coupling |
| `AdaptiveKuramoto` | Hebbian plasticity |
| `SakaguchiKuramoto` | Phase frustration / chimera states |
| `SmallWorldKuramoto` | Watts-Strogatz topology |
| `MultiSystemCoupling` | Cross-system synchronization |
| `StochasticKuramoto` | Langevin noise dynamics |
| `ColoredNoiseKuramoto` | Ornstein-Uhlenbeck noise |
| `ThermalKuramoto` | Temperature-dependent coupling |
| `PrimeEntanglementGraph` | Prime relationship tracking |
| `AlephEventEmitter` | Event-driven monitoring |
| `AlephMonitor` | Engine state monitoring |
| `EvolutionStream` | Async iteration over evolution |
| `PrimeonZLadderMulti` | Multi-channel Z memory |
| `ResoFormer` | Prime-indexed transformer |
| `SparsePrimeState` | Sparse prime activations |
| `getSymbol(id)` | Get symbol by ID |
| `symbolDatabase` | Symbol database singleton |
| `inferSymbol(text)` | Infer symbol from text |
| `inferWithResonance(text)` | Resonance-ranked inference |
| `inferMostResonant(text, ctx)` | Context-aware selection |
| `createCompound(...)` | Build compound symbol |
| `compoundBuilder` | Compound builder instance |
| `calculateResonance(p1, p2)` | Prime pair resonance |
| `findGoldenPairs(primes)` | Find φ-ratio pairs |
| `resonanceSignature(primes)` | Resonance statistics |
| `hash(input)` | Quick semantic hash |
| `deriveKey(pass, salt)` | Quick key derivation |

### Observer Exports

The observer module provides components for building sentient observer systems:

```javascript
const observer = require('@aleph-ai/tinyaleph/observer');
// Or destructure specific exports:
const {
    SedenionMemoryField,
    PRSCLayer,
    TemporalLayer,
    SymbolicSMF,
    SymbolicTemporalLayer,
    AssaySuite
} = require('@aleph-ai/tinyaleph/observer');
```

| Export | Description |
|--------|-------------|
| `PrimeOscillator` | Single prime-indexed oscillator |
| `PRSCLayer` | Prime Resonance Semantic Coherence oscillator bank |
| `coherenceKernel` | Phase coherence calculation |
| `TickGate` | Tick-based activation gating |
| `HQE` | Holographic Quaternion Engine |
| `SedenionMemoryField` | 16D semantic orientation field |
| `SMF_AXES` | Named axes for 16D space |
| `Moment` | Discrete temporal moment |
| `TemporalLayer` | Moment classification and time tracking |
| `AttentionFocus` | Attention target with decay |
| `Goal` | Goal representation with progress |
| `AgencyLayer` | Goals, attention, and intention management |
| `BoundaryLayer` | Self-other differentiation |
| `EntanglementLayer` | Semantic phrase coherence |
| `SafetyMonitor` | Constraint monitoring |
| `SymbolicSMF` | Symbol-grounded Sedenion field |
| `SMFSymbolMapper` | Maps SMF axes to symbols |
| `AXIS_SYMBOL_MAPPING` | 16 axes → symbol mappings |
| `SymbolicMoment` | Moment with I-Ching classification |
| `SymbolicTemporalLayer` | 64-attractor hexagram classification |
| `HEXAGRAM_ARCHETYPES` | 64 hexagram → archetype mappings |
| `SymbolicPatternDetector` | Narrative pattern detection |
| `TimeDilationAssay` | Assay A: Time dilation test |
| `MemoryContinuityAssay` | Assay B: Memory continuity test |
| `AgencyConstraintAssay` | Assay C: Agency under constraint test |
| `NonCommutativeMeaningAssay` | Assay D: Non-commutative meaning test |
| `AssaySuite` | Run all four validation assays |

### Topology Exports

| Export | Description |
|--------|-------------|
| `TWIST_108` | 108 invariant with twist angle calculations |
| `Knot` | General knot class with invariant computation |
| `TREFOIL` | Pre-configured trefoil knot (T=17) |
| `PhysicalConstants` | Derived constants (α, proton/electron ratio) |
| `GaugeSymmetry` | Standard Model gauge group from 108 |
| `FreeEnergyDynamics` | Cubic FEP model dψ/dt = αψ + βψ² + γψ³ |
| `OBSERVER_HIERARCHY` | 5-level observer scale hierarchy |

### Discrete Dynamics Exports

| Export | Description |
|--------|-------------|
| `INT_SINE_TABLE` | M=256 integer sine/cosine table |
| `computeHistogramCoherence` | C_bin(t) = max_k(b_k)/\|P\| |
| `SMF_CODEBOOK` | 64-attractor codebook array |
| `nearestCodebookAttractor` | Find nearest attractor for phase |
| `codebookTunnel` | Controlled tunneling to attractor |
| `canonicalTriad` | Find lexicographically first triad for sum |
| `canonicalFusion` | FUSE(p,q,r) with automatic triad |
| `verifyCanonical` | Verify triad is canonical |
| `TickGate` | Tick-only HQE gating class |

### Formal Semantics Exports

| Export | Description |
|--------|-------------|
| `N(prime)` | Create noun term N(p) |
| `A(prime)` | Create adjective term A(p) |
| `FUSE(p, q, r)` | Create triadic fusion |
| `CHAIN(ops, noun)` | Create operator chain |
| `SENTENCE(expr)` | Create sentence from noun |
| `SEQ(s1, s2)` | Sequential composition |
| `IMPL(s1, s2)` | Implication |
| `TypeChecker` | Type inference and checking |
| `ReductionSystem` | Reduction semantics engine |
| `ResonanceOperator` | Prime resonance operator |
| `NextPrimeOperator` | Next prime mapping |
| `ModularOperator` | Modular arithmetic |
| `Translator` | λ-calculus translation |
| `LambdaEvaluator` | β-reduction evaluator |
| `Semantics` | Model-theoretic interpretation |
| `EnochianEngine` | Enochian language processing |
| `SedenionElement` | 16D hypercomplex operations |

### Sub-modules

```javascript
// Direct module access
const { core, physics, backends, engine } = require('@aleph-ai/tinyaleph');

// Or import sub-modules directly
const core = require('@aleph-ai/tinyaleph/core');
const physics = require('@aleph-ai/tinyaleph/physics');
const backends = require('@aleph-ai/tinyaleph/backends');
const engine = require('@aleph-ai/tinyaleph/engine');
```

### New Physics Exports

| Export | Description |
|--------|-------------|
| `StochasticKuramoto` | White noise Langevin dynamics |
| `ColoredNoiseKuramoto` | Ornstein-Uhlenbeck colored noise |
| `ThermalKuramoto` | Temperature-dependent coupling |
| `PrimeonZLadderMulti` | Hierarchical Z memory channels |
| `createAdiabaticSchedule` | Parameter sweep schedules |

### New Core Exports

| Export | Description |
|--------|-------------|
| `PrimeEntanglementGraph` | Prime co-occurrence tracking |
| `AlephEventEmitter` | Event pub/sub system |
| `AlephMonitor` | Engine monitoring wrapper |
| `EvolutionStream` | Async iteration for dynamics |
| `ResoFormer` | Full transformer model |
| `ResoFormerBlock` | Single transformer block |
| `ResonantMultiHeadAttention` | Multi-head attention |
| `PrimeFFN` | Feed-forward network |
| `PrimeLayerNorm` | Prime-preserving normalization |
| `PositionalPrimeEncoding` | Position as prime phases |
| `SparsePrimeState` | Sparse activation storage |
| `CRTResonantAttention` | Multi-head CRT-fused attention |
| `HomologyRegularizedBlock` | Block with homology loss |
| `CRTResoFormer` | Complete CRT-enhanced model |
| `ResidueEncoder` | Encode to residue distributions |
| `CRTReconstructor` | Chinese Remainder Theorem |
| `BirkhoffProjector` | Doubly-stochastic projection |
| `HomologyLoss` | Cycle-based regularization |
| `CoprimeSelector` | Optimal moduli selection |

## Documentation

Full documentation is available in the `docs/` directory:

- **[Theory](./docs/theory/README.md)**: Mathematical foundations
  - Prime semantics, hypercomplex algebra, oscillator dynamics
  - Entropy minimization, non-commutativity, temporal emergence
  
- **[Guide](./docs/guide/README.md)**: Practical tutorials
  - Quick start, semantic computing, cryptographic applications
  - Scientific computing, LLM integration, symbolic AI, advanced topics
  
- **[Reference](./docs/reference/README.md)**: Complete API documentation
  - Core module, physics module, backends, engine
  - [Topology module](./docs/reference/07-topology.md): 108 invariant, knots, gauge symmetry
  
- **[CRT-Homology Reference](./docs/reference/09-crt-homology.md)**: CRT reconstruction and homology
  
- **[Topology Examples](./examples/topology/README.md)**: 108 invariant and physical constants
  - 108 invariant and twist angles
  - Trefoil complexity and mass ratios
  - Gauge symmetry from factorization
  - Free energy dynamics

- **[Discrete Dynamics Examples](./examples/discrete/README.md)**: Integer-domain computation
  - Integer sine tables
  - Codebook tunneling
  - Canonical fusion selection
  - Tick-based gating

- **[Formal Semantics Examples](./examples/formal-semantics/README.md)**: New formal system demos
  - Typed terms and type checking
  - Reduction and normalization
  - Lambda translation
  - Enochian language

## Examples

Run the included demos:

```bash
# Basic modular demo
npm run demo

# Two-layer meaning demo
npm run demo:two-layer

# Performance benchmark
npm run benchmark

# Interactive chat
npm run chat

# Formal semantics examples
node examples/formal-semantics/01-typed-terms.js
node examples/formal-semantics/02-reduction.js
node examples/formal-semantics/03-lambda-translation.js
node examples/formal-semantics/04-enochian-language.js

# Topology examples (108 invariant, physical constants)
node examples/topology/01-108-invariant.js
node examples/topology/02-trefoil-constants.js
node examples/topology/03-gauge-symmetry.js
node examples/topology/04-free-energy-dynamics.js

# Discrete dynamics examples (integer tables, codebooks)
node examples/discrete/01-integer-sine-table.js
node examples/discrete/02-codebook-tunneling.js
node examples/discrete/03-canonical-fusion.js
node examples/discrete/04-tick-gate.js

# CRT-Homology examples
node examples/crt-homology/01-residue-encoding.js
node examples/crt-homology/02-birkhoff-attention.js
node examples/crt-homology/03-homology-loss.js
node examples/crt-homology/04-crt-resoformer.js

# Bioinformatics examples
node examples/bioinformatics/01-dna-encoding.js
node examples/bioinformatics/02-central-dogma.js
node examples/bioinformatics/03-protein-folding.js
node examples/bioinformatics/04-dna-computing.js
node examples/bioinformatics/05-molecular-binding.js

# Symbolic AI examples
node examples/05-symbolic-resonance.js
node examples/06-symbol-database.js
node examples/07-semantic-inference.js
node examples/08-compound-symbols.js
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AlephEngine                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Oscillators │◄─┤   Field     │◄─┤      Transform          │  │
│  │  (Kuramoto) │  │  (Sedenion) │  │      Pipeline           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ SemanticBackend │ │CryptographicBack│ │ScientificBackend│
│                 │ │                 │ │                 │
│ • Tokenization  │ │ • Hash          │ │ • Quantum sim   │
│ • Prime encode  │ │ • Key derive    │ │ • Wave collapse │
│ • Transforms    │ │ • Verify        │ │ • Measurement   │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Formal Semantics Layer                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Type System   │   Reduction     │   Lambda Translation        │
│                 │                 │                             │
│ • N(p), A(p), S │ • Small-step →  │ • τ: Terms → λ-expressions  │
│ • FUSE(p,q,r)   │ • ⊕ operators   │ • β-reduction               │
│ • ◦ composition │ • Normal forms  │ • Model interpretation      │
│ • ⇒ implication │ • Confluence    │ • Semantic domains          │
└─────────────────┴─────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Symbolic AI Layer                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Symbol DB      │  Inference      │   Resonance                 │
│                 │                 │                             │
│ • 184+ emojis   │ • Pattern match │ • Golden ratio φ            │
│ • Cultural tags │ • Semantic sim  │ • Prime pair harmony        │
│ • Prime index   │ • ResoFormer    │ • Cluster detection         │
│ • Categories    │ • Context-aware │ • Compound scoring          │
└─────────────────┴─────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Enochian Language Module                    │
├─────────────────────────────────────────────────────────────────┤
│ • 21-letter alphabet with prime mappings                        │
│ • Prime basis PE = {7, 11, 13, 17, 19, 23, 29}                  │
│ • Twist angles κ(p) = 360/p degrees                             │
│ • 16-dimensional sedenion operations                            │
│ • Core vocabulary (35+ words)                                   │
│ • The Nineteen Calls (traditional invocations)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Requirements

- Node.js >= 14.0.0

## License

MIT © Sebastian Schepis

## Contributing

Contributions welcome! Please read the documentation in `docs/` before submitting PRs.