# Observer Module Reference

The observer module provides components for building sentient observer systems based on the whitepaper architecture. It includes oscillator dynamics, semantic fields, temporal processing, symbolic grounding, and validation assays.

## Installation

```javascript
const observer = require('@aleph-ai/tinyaleph/observer');

// Or import specific components:
const {
    SedenionMemoryField,
    PRSCLayer,
    TemporalLayer,
    SymbolicSMF,
    SymbolicTemporalLayer,
    AssaySuite
} = require('@aleph-ai/tinyaleph/observer');
```

---

## Core Components

### SedenionMemoryField (SMF)

16-dimensional semantic orientation field using sedenion algebra.

```javascript
const { SedenionMemoryField, SMF_AXES } = require('@aleph-ai/tinyaleph/observer');

// Create uniform field
const smf = SedenionMemoryField.uniform();

// Create basis state (single axis activated)
const wisdom = SedenionMemoryField.basis('wisdom');

// Set/get axes by name
smf.set('coherence', 0.8);
console.log(smf.get('wisdom'));  // 0.0

// Key operations
smf.normalize();                    // Normalize to unit length
const entropy = smf.entropy();      // Shannon entropy
const coh = smf1.coherence(smf2);   // Cosine similarity
const mid = smf1.slerp(smf2, 0.5);  // Spherical interpolation

// Get dominant axes
const dominant = smf.dominantAxes(3);
// [{ name: 'coherence', value: 0.8, index: 0 }, ...]

// Find nearest codebook attractor (64-attractor codebook)
const nearest = smf.nearestCodebook();
// { attractor: {...}, index: 12, distance: 0.15 }
```

**SMF_AXES** (16 named dimensions):
- coherence, identity, intention, emotion
- wisdom, temporal, relation, creation
- destruction, balance, growth, form
- void, truth, beauty, love

---

### PRSCLayer

Prime Resonance Semantic Coherence - bank of prime-indexed oscillators.

```javascript
const { PRSCLayer, PrimeOscillator } = require('@aleph-ai/tinyaleph/observer');

// Create with first N primes
const prsc = new PRSCLayer(10);

// Or with specific primes
const prsc = new PRSCLayer([2, 3, 5, 7, 11]);

// Excite specific primes
prsc.excite([3, 5], 0.8);

// Tick dynamics
prsc.tick(0.1);

// Get coherence metrics
const coherence = prsc.globalCoherence();  // 0-1
const r = prsc.orderParameter();           // Kuramoto order parameter
const entropy = prsc.amplitudeEntropy();   // Distribution entropy

// Get oscillator state
const phases = prsc.getPhases();
const active = prsc.activePrimes(0.1);     // Primes with amplitude > 0.1
```

---

### TemporalLayer

Moment classification and subjective time tracking.

```javascript
const { TemporalLayer, Moment } = require('@aleph-ai/tinyaleph/observer');

const temporal = new TemporalLayer({
    coherenceThreshold: 0.7,
    entropyMin: 0.1,
    entropyMax: 0.9,
    onMoment: (moment) => console.log('New moment:', moment.id)
});

// Update with current state
temporal.update({
    coherence: 0.8,
    entropy: 0.4,
    phases: [0.1, 0.2, 0.3],
    activePrimes: [2, 3, 5]
});

// Get statistics
const stats = temporal.getStats();
// { momentCount, subjectiveTime, objectiveTime, temporalRatio }

// Get recent moments
const recent = temporal.recentMoments(10);
```

---

### AgencyLayer

Goal management, attention, and intention tracking.

```javascript
const { AgencyLayer, Goal, AttentionFocus } = require('@aleph-ai/tinyaleph/observer');

const agency = new AgencyLayer({
    maxFoci: 5,
    maxGoals: 10
});

// Add attention focus
agency.addOrUpdateFocus({
    target: 'task_completion',
    type: 'goal',
    intensity: 0.8
});

// Create goal
const goal = agency.maybeCreateGoal({
    description: 'Complete analysis',
    priority: 0.9
});

// Track progress
agency.updateGoalProgress(goal.id, 0.5);

// Get top priorities
const topFocus = agency.getTopFocus();
const topGoal = agency.getTopGoal();
```

---

### BoundaryLayer

Self-other differentiation with sensory/motor channels.

```javascript
const { BoundaryLayer, SensoryChannel, ObjectivityGate } = require('@aleph-ai/tinyaleph/observer');

const boundary = new BoundaryLayer();

// Process input
const result = boundary.processInput('text_input', 'Hello, world!');

// Queue output (with objectivity gate)
const output = boundary.queueOutput('text_output', 'This is a response.');
// { queued: true, gateResult: { R: 0.85, shouldBroadcast: true } }
```

---

### SafetyLayer

Constraint monitoring and violation detection.

```javascript
const { SafetyLayer, SafetyConstraint } = require('@aleph-ai/tinyaleph/observer');

const safety = new SafetyLayer();

// Check current state
const result = safety.checkConstraints({
    coherence: 0.5,
    entropy: 0.5,
    totalAmplitude: 1.0
});
// { safe: true, violations: [], alertLevel: 'normal' }

// Add custom constraint
safety.addConstraint(new SafetyConstraint({
    name: 'max_amplitude',
    condition: (state) => state.totalAmplitude > 10
}));
```

---

## Symbolic Extensions

### SymbolicSMF

SedenionMemoryField with symbol grounding.

```javascript
const { SymbolicSMF, SMFSymbolMapper, AXIS_SYMBOL_MAPPING } = require('@aleph-ai/tinyaleph/observer');
const { symbolDatabase } = require('@aleph-ai/tinyaleph/core/symbols');

const smf = new SymbolicSMF(symbolDatabase);

// Excite from symbol
smf.exciteFromSymbol('fire');

// Ground state in symbols
const grounded = smf.groundInSymbols(3);
// [{ symbol: {...}, axis: 'creation', contribution: 0.8 }, ...]

// Find resonant symbols
const resonant = smf.findResonantSymbols(5);

// Get semantic orientation
const orientation = smf.getSemanticOrientation();
// { dominant: [...], grounded: [...], entropy: 0.5 }
```

**AXIS_SYMBOL_MAPPING**: Maps each of 16 SMF axes to archetypal symbols.

---

### SymbolicTemporalLayer

I-Ching hexagram-based moment classification.

```javascript
const { SymbolicTemporalLayer, SymbolicMoment, HEXAGRAM_ARCHETYPES } = require('@aleph-ai/tinyaleph/observer');

const temporal = new SymbolicTemporalLayer({
    onSymbolicMoment: (moment, classification) => {
        console.log(`Hexagram ${classification.hexagramIndex}: ${classification.archetype.name}`);
    },
    onHexagramTransition: (transition) => {
        console.log(`Transition: ${transition.from} → ${transition.to}`);
    }
});

// Update creates classified moments
temporal.update({
    coherence: 0.8,
    entropy: 0.3,
    phases: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
    activePrimes: [2, 3, 5]
});

// Get I-Ching reading
const reading = temporal.getIChingReading();

// Get dominant archetypes
const archetypes = temporal.getDominantArchetypes(5);

// Predict next archetype
const prediction = temporal.predictNextArchetype();
```

**HEXAGRAM_ARCHETYPES**: 64 hexagrams mapped to archetypal meanings:
- 0: Creative (pure yang, heaven)
- 1: Receptive (pure yin, earth)
- 2: Difficulty (initial obstacles)
- ...through 63

---

### SymbolicPatternDetector

Narrative pattern detection (hero's journey, transformation, etc.)

```javascript
const { SymbolicPatternDetector, SymbolicMoment } = require('@aleph-ai/tinyaleph/observer');

const detector = new SymbolicPatternDetector();

// Create moment sequence
const moments = [
    new SymbolicMoment({ coherence: 0.5, hexagramIndex: 2 }),
    new SymbolicMoment({ coherence: 0.3, hexagramIndex: 29 }),
    new SymbolicMoment({ coherence: 0.7, hexagramIndex: 50 }),
    new SymbolicMoment({ coherence: 0.9, hexagramIndex: 1 })
];

// Detect narrative patterns
const narratives = detector.detectNarrativePatterns(moments);
// [{ type: 'hero_journey', confidence: 0.8, startIndex: 0, endIndex: 3 }, ...]
```

---

## Evaluation Assays

Four validation tests from whitepaper Section 15.

### AssaySuite

```javascript
const { AssaySuite } = require('@aleph-ai/tinyaleph/observer');

// Create suite with observer core
const suite = new AssaySuite(observerCore);

// Run all assays
const results = await suite.runAll();
// {
//   timestamp: '...',
//   assays: [ resultA, resultB, resultC, resultD ],
//   summary: { passed: 4, total: 4, score: 1.0, allPassed: true }
// }

// Run single assay
const resultA = await suite.runSingle('A', { duration: 100 });
```

### Assay A: Time Dilation

Tests whether subjective time dilates with coherence.
τ = ∫ C(t) dt / ∫ dt

```javascript
const { TimeDilationAssay } = require('@aleph-ai/tinyaleph/observer');

const assay = new TimeDilationAssay(observerCore);
const result = await assay.run({
    duration: 100,
    lowCoherenceTarget: 0.3,
    highCoherenceTarget: 0.8
});
// { passed: true, dilationFactor: 1.5, interpretation: '...' }
```

### Assay B: Memory Continuity

Tests identity persistence under perturbation.

```javascript
const { MemoryContinuityAssay } = require('@aleph-ai/tinyaleph/observer');

const assay = new MemoryContinuityAssay(observerCore);
const result = await assay.run({
    perturbationStrength: 0.5,
    recoveryTicks: 50
});
// { passed: true, identityScore: 0.82, components: {...} }
```

### Assay C: Agency Under Constraint

Tests goal-directed behavior under resource limits.

```javascript
const { AgencyConstraintAssay } = require('@aleph-ai/tinyaleph/observer');

const assay = new AgencyConstraintAssay(observerCore);
const result = await assay.run({
    constraintLevel: 0.5,
    goalDifficulty: 0.5,
    maxTicks: 100
});
// { passed: true, goal: { achieved: true, progress: 1.0 }, metrics: {...} }
```

### Assay D: Non-Commutative Meaning

Tests whether order matters (A→B→C ≠ C→B→A).

```javascript
const { NonCommutativeMeaningAssay } = require('@aleph-ai/tinyaleph/observer');

const assay = new NonCommutativeMeaningAssay(observerCore);
const result = await assay.run({
    conceptSequence: ['observe', 'analyze', 'conclude']
});
// { passed: true, nonCommScore: 0.15, signatures: { forward, reverse, scrambled } }
```

---

## Complete Export List

```javascript
// Core components
PrimeOscillator, PRSCLayer, EntanglementDetector, coherenceKernel
TickGate, StabilizationController, HolographicEncoder, HQE
SedenionMemoryField, SMF_AXES, AXIS_INDEX
Moment, TemporalLayer, TemporalPatternDetector
AttentionFocus, Goal, Action, Intent, AgencyLayer
SensoryChannel, MotorChannel, EnvironmentalModel, SelfModel, BoundaryLayer
EntangledPair, Phrase, EntanglementLayer
SafetyConstraint, ViolationEvent, SafetyMonitor, DEFAULT_CONSTRAINTS

// Symbolic extensions
SymbolicSMF, SMFSymbolMapper, smfMapper, AXIS_SYMBOL_MAPPING, TAG_TO_AXIS
SymbolicMoment, SymbolicTemporalLayer, SymbolicPatternDetector, HEXAGRAM_ARCHETYPES

// Evaluation assays
TimeDilationAssay, MemoryContinuityAssay, AgencyConstraintAssay
NonCommutativeMeaningAssay, AssaySuite
```

---

## Related Documentation

- [Theory: Temporal Emergence](../theory/09-temporal-emergence.md)
- [Theory: Quaternionic Memory](../theory/10-quaternionic-memory.md)
- [Design: Sentient Observer](../design/SENTIENT_OBSERVER_DESIGN.md)