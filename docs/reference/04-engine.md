# Engine Module Reference

The engine module provides high-level orchestration for Aleph computations.

## AlephEngine (`engine/aleph.js`)

The unified computation engine that coordinates backends, oscillators, and transforms.

### Constructor

```javascript
new AlephEngine(backend, config)
```

**Parameters:**
- `backend` (BackendInterface): Backend instance
- `config` (Object):
  - `oscillatorCount` (number): Number of oscillators (default 16)
  - `coupling` (number): Kuramoto coupling strength (default 0.1)
  - `entropyThreshold` (number): Target entropy (default 0.1)
  - `maxIterations` (number): Max transform iterations (default 100)
  - `collapseStrength` (number): State collapse strength (default 0.8)
  - `dt` (number): Time step for dynamics (default 0.01)

**Example:**
```javascript
const { AlephEngine, SemanticBackend } = require('./modular');

const backend = new SemanticBackend(config);
const engine = new AlephEngine(backend, {
  oscillatorCount: 16,
  coupling: 0.2,
  entropyThreshold: 0.05
});
```

---

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `backend` | BackendInterface | Associated backend |
| `oscillators` | Array<Oscillator> | Field oscillator array |
| `field` | SedenionState | Current field state |
| `config` | Object | Engine configuration |
| `metrics` | Object | Performance metrics |

---

### Core Methods

#### run(input)

Execute full computation pipeline.

```javascript
engine.run(input)
```

**Parameters:**
- `input` (any): Backend-specific input

**Returns:** EngineResult
```javascript
{
  input: any,              // Original input
  output: any,             // Decoded output
  primes: number[],        // Final prime encoding
  state: SedenionState,    // Final hypercomplex state
  entropy: number,         // Final entropy
  steps: TransformStep[],  // Applied transforms
  oscillators: {           // Oscillator final state
    orderParameter: number,
    phases: number[]
  },
  metrics: {               // Performance data
    totalTime: number,
    encodeTime: number,
    transformTime: number,
    decodeTime: number
  }
}
```

**Example:**
```javascript
const result = engine.run('What is wisdom?');
console.log('Answer:', result.output);
console.log('Final entropy:', result.entropy);
console.log('Steps taken:', result.steps.length);
```

---

#### runBatch(inputs)

Process multiple inputs in sequence.

```javascript
engine.runBatch(inputs)
```

**Parameters:**
- `inputs` (Array): Array of inputs

**Returns:** Array<EngineResult>

**Notes:**
- Oscillators carry state between items
- Can show emergence of patterns across batch

---

#### step(state)

Perform single computation step.

```javascript
engine.step(state)
```

**Parameters:**
- `state` (SedenionState): Current state

**Returns:** Object - `{ state, entropy, transform }`

**Notes:**
- Applies best available transform
- Updates oscillator phases
- Returns new state

---

### Field Operations

#### initializeField(primes)

Initialize field from prime encoding.

```javascript
engine.initializeField(primes)
```

**Parameters:**
- `primes` (Array<number>): Prime encoding

**Returns:** void

**Notes:**
- Converts primes to hypercomplex state
- Excites oscillators based on prime distribution
- Sets initial field state

---

#### exciteField(primes)

Add excitation to existing field.

```javascript
engine.exciteField(primes)
```

**Parameters:**
- `primes` (Array<number>): Additional primes

**Returns:** void

**Notes:**
- Adds to current field state
- Increases oscillator energy
- Does not reset existing state

---

#### collapseField(target)

Collapse field toward target state.

```javascript
engine.collapseField(target)
```

**Parameters:**
- `target` (SedenionState): Target attractor

**Returns:** SedenionState - Collapsed field state

---

#### getFieldState()

Get current field state.

```javascript
engine.getFieldState()
```

**Returns:** SedenionState

---

#### getFieldEntropy()

Get current field entropy.

```javascript
engine.getFieldEntropy()
```

**Returns:** number

---

### Oscillator Control

#### stepOscillators()

Advance oscillator dynamics by one time step.

```javascript
engine.stepOscillators()
```

**Returns:** void

**Notes:**
- Applies Kuramoto coupling
- Updates all oscillator phases

---

#### synchronizeOscillators(target)

Force synchronization toward target phase.

```javascript
engine.synchronizeOscillators(target)
```

**Parameters:**
- `target` (number): Target phase in radians

**Returns:** void

---

#### getOrderParameter()

Get Kuramoto order parameter.

```javascript
engine.getOrderParameter()
```

**Returns:** number - Synchronization measure [0, 1]

---

#### exciteOscillator(index, energy)

Add energy to specific oscillator.

```javascript
engine.exciteOscillator(index, energy)
```

**Parameters:**
- `index` (number): Oscillator index (0-15)
- `energy` (number): Energy to add

**Returns:** void

---

### Transform Management

#### selectTransform(primes, state)

Choose best transform to apply.

```javascript
engine.selectTransform(primes, state)
```

**Parameters:**
- `primes` (Array<number>): Current primes
- `state` (SedenionState): Current state

**Returns:** Transform | null

**Notes:**
- Selection based on entropy reduction potential
- Considers transform priorities and conditions

---

#### applyTransform(primes, transform)

Apply a transform to primes.

```javascript
engine.applyTransform(primes, transform)
```

**Parameters:**
- `primes` (Array<number>): Current primes
- `transform` (Transform): Transform to apply

**Returns:** Array<number> - Transformed primes

---

#### addTransform(transform)

Add transform to engine.

```javascript
engine.addTransform(transform)
```

**Parameters:**
- `transform` (Transform): New transform

**Returns:** void

---

#### removeTransform(name)

Remove transform by name.

```javascript
engine.removeTransform(name)
```

**Parameters:**
- `name` (string): Transform name

**Returns:** boolean - True if removed

---

### Metrics

#### getMetrics()

Get performance metrics.

```javascript
engine.getMetrics()
```

**Returns:** Object
```javascript
{
  runs: number,           // Total runs
  totalTime: number,      // Total processing time
  avgTime: number,        // Average per run
  avgEntropy: number,     // Average final entropy
  avgSteps: number,       // Average steps per run
  transformCounts: {},    // Usage per transform
  cacheHits: number,      // Cache hit count
  cacheMisses: number     // Cache miss count
}
```

---

#### resetMetrics()

Reset all metrics.

```javascript
engine.resetMetrics()
```

**Returns:** void

---

## Factory Functions

### createEngine(type, config)

Create engine with specified backend.

```javascript
const { createEngine } = require('./modular');

const engine = createEngine(type, config);
```

**Parameters:**
- `type` (string): Backend type ('semantic', 'cryptographic', 'scientific')
- `config` (Object): Configuration object

**Returns:** AlephEngine

**Example:**
```javascript
const semanticEngine = createEngine('semantic', {
  vocabulary: { ... },
  ontology: { ... },
  oscillatorCount: 16
});

const cryptoEngine = createEngine('cryptographic', {
  hashRounds: 1000
});

const scienceEngine = createEngine('scientific', {
  dimension: 16
});
```

---

### createEngineWithBackend(backend, config)

Create engine with pre-built backend.

```javascript
const { createEngineWithBackend, SemanticBackend } = require('./modular');

const backend = new SemanticBackend(fullConfig);
const engine = createEngineWithBackend(backend, {
  coupling: 0.2
});
```

**Parameters:**
- `backend` (BackendInterface): Backend instance
- `config` (Object): Engine configuration

**Returns:** AlephEngine

---

## Configuration Reference

### Full Configuration Object

```javascript
const fullConfig = {
  // Backend selection
  backend: 'semantic',  // or 'cryptographic', 'scientific'
  
  // State dimension
  dimension: 16,
  
  // Semantic backend options
  vocabulary: {
    'love': [2, 3, 5],
    'truth': [7, 11, 13]
    // ...
  },
  ontology: {
    2: 'existence',
    3: 'unity',
    5: 'life',
    7: 'logos'
    // ...
  },
  stopWords: ['the', 'a', 'an', 'is', 'are'],
  
  // Transform configuration
  transforms: [
    {
      n: 'simplify',
      q: [2, 3],
      r: [5],
      priority: 10
    }
  ],
  
  // Engine dynamics
  oscillatorCount: 16,
  coupling: 0.1,
  dt: 0.01,
  
  // Convergence control
  entropyThreshold: 0.1,
  maxIterations: 100,
  
  // Collapse behavior
  collapseStrength: 0.8,
  collapseOnConvergence: true,
  
  // Caching
  enableCache: true,
  cacheSize: 1000,
  
  // Debugging
  debug: false,
  trackMetrics: true
};
```

---

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALEPH_DIMENSION` | State dimension | 16 |
| `ALEPH_COUPLING` | Kuramoto coupling | 0.1 |
| `ALEPH_ENTROPY_THRESHOLD` | Target entropy | 0.1 |
| `ALEPH_DEBUG` | Enable debug output | false |

---

## Events

The engine emits events during processing (when configured with EventEmitter):

| Event | Data | Description |
|-------|------|-------------|
| `start` | `{ input }` | Processing started |
| `encoded` | `{ primes, state }` | Input encoded |
| `step` | `{ step, transform, entropy }` | Transform applied |
| `converged` | `{ steps, entropy }` | Entropy threshold reached |
| `complete` | `{ output, entropy, steps }` | Processing complete |
| `error` | `{ error }` | Error occurred |

**Example:**
```javascript
engine.on('step', (data) => {
  console.log(`Step ${data.step}: ${data.transform} → entropy ${data.entropy}`);
});

engine.on('converged', (data) => {
  console.log(`Converged after ${data.steps} steps`);
});
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `UnknownBackendError` | Invalid backend type | Use registered backend |
| `EncodingError` | Input cannot be encoded | Check input format |
| `ConvergenceError` | Max iterations reached | Increase maxIterations |
| `DimensionMismatchError` | State dimensions differ | Ensure consistent dimension |

**Example:**
```javascript
try {
  const result = engine.run(input);
} catch (error) {
  if (error.name === 'ConvergenceError') {
    console.log('Failed to converge, trying with more iterations');
    engine.config.maxIterations *= 2;
    const result = engine.run(input);
  }
}
```

---

## Integration Patterns

### Streaming Processing

```javascript
async function* streamProcess(inputs, engine) {
  for (const input of inputs) {
    const result = engine.run(input);
    yield result;
    
    // Allow oscillators to influence next input
    await new Promise(r => setTimeout(r, 10));
  }
}

// Usage
for await (const result of streamProcess(inputs, engine)) {
  console.log(result.output);
}
```

### Parallel Engines

```javascript
const engines = [
  createEngine('semantic', config),
  createEngine('semantic', config),
  createEngine('semantic', config)
];

async function parallelProcess(inputs) {
  const chunks = chunkArray(inputs, engines.length);
  
  const results = await Promise.all(
    chunks.map((chunk, i) => 
      Promise.resolve(engines[i].runBatch(chunk))
    )
  );
  
  return results.flat();
}
```

### Persistent State

```javascript
// Save engine state
function saveState(engine) {
  return {
    field: engine.getFieldState().components,
    oscillators: engine.oscillators.map(o => ({
      phase: o.phase,
      amplitude: o.amplitude,
      frequency: o.frequency
    }))
  };
}

// Restore engine state
function restoreState(engine, saved) {
  engine.field = new SedenionState(saved.field);
  saved.oscillators.forEach((o, i) => {
    engine.oscillators[i].phase = o.phase;
    engine.oscillators[i].amplitude = o.amplitude;
    engine.oscillators[i].frequency = o.frequency;
  });
}