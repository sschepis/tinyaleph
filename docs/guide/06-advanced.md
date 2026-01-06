# Advanced Topics

This guide covers power-user techniques, customization, and deep integration patterns for Aleph.

## Overview

This document is for developers who want to:

- Extend Aleph with custom backends
- Fine-tune oscillator dynamics
- Implement custom transforms
- Optimize for specific use cases
- Understand internal mechanics

---

## Custom Backends

### Backend Architecture

All backends extend the base interface:

```javascript
const { BackendInterface } = require('./backends/interface');

class CustomBackend extends BackendInterface {
  constructor(config) {
    super(config);
    // Initialize custom state
  }
  
  // Required methods
  encode(input) { /* Convert input to primes */ }
  decode(primes) { /* Convert primes back to output */ }
  process(input) { /* Main processing logic */ }
  
  // Optional methods
  learn(item, primes) { /* Add to vocabulary */ }
  validate(input) { /* Validate input format */ }
}
```

### Example: Graph Backend

```javascript
const { BackendInterface } = require('./backends/interface');
const { SedenionState } = require('./core/hypercomplex');

class GraphBackend extends BackendInterface {
  constructor(config) {
    super(config);
    this.nodes = new Map();
    this.edges = [];
  }
  
  // Encode graph structure to primes
  encode(graph) {
    const primes = [];
    
    // Encode nodes
    for (const node of graph.nodes) {
      const nodePrime = this.nodeToProme(node);
      primes.push(nodePrime);
      this.nodes.set(node.id, nodePrime);
    }
    
    // Encode edges as prime products
    for (const edge of graph.edges) {
      const edgePrime = this.nodes.get(edge.source) * this.nodes.get(edge.target);
      primes.push(edgePrime);
      this.edges.push({ edge, prime: edgePrime });
    }
    
    return primes;
  }
  
  // Decode primes back to graph
  decode(primes) {
    // Reconstruct graph from prime factorization
    const nodes = [];
    const edges = [];
    
    for (const prime of primes) {
      if (this.isPureNode(prime)) {
        nodes.push(this.primeToNode(prime));
      } else {
        // Factor composite to find edge endpoints
        const factors = this.factor(prime);
        edges.push({
          source: this.primeToNodeId(factors[0]),
          target: this.primeToNodeId(factors[1])
        });
      }
    }
    
    return { nodes, edges };
  }
  
  // Process graph queries
  process(query) {
    const primes = this.encode(query.graph);
    const state = this.primesToState(primes);
    
    // Apply graph-specific transforms
    const result = this.applyGraphTransforms(state, query.operation);
    
    return {
      state: result,
      entropy: result.entropy(),
      graph: this.stateToGraph(result)
    };
  }
  
  nodeToProme(node) {
    // Map node properties to prime
    return this.config.nodePrimes[node.type] || 2;
  }
  
  isPureNode(prime) {
    return this.primeCheck(prime);
  }
  
  primeToNode(prime) {
    // Reverse lookup
    for (const [type, p] of Object.entries(this.config.nodePrimes)) {
      if (p === prime) return { type };
    }
    return null;
  }
}

module.exports = { GraphBackend };
```

### Registering Custom Backends

```javascript
const { registerBackend, createEngine } = require('./modular');
const { GraphBackend } = require('./my-graph-backend');

// Register the backend
registerBackend('graph', GraphBackend);

// Now usable via createEngine
const engine = createEngine('graph', {
  nodePrimes: {
    person: 2,
    company: 3,
    location: 5
  }
});

const result = engine.run({
  nodes: [
    { id: 1, type: 'person' },
    { id: 2, type: 'company' }
  ],
  edges: [
    { source: 1, target: 2 }
  ]
});
```

---

## Oscillator Customization

### Custom Oscillator Types

```javascript
const { createOscillator } = require('./physics/oscillator');

// Standard oscillator
const basic = createOscillator({
  frequency: 1.0,
  phase: 0,
  amplitude: 1.0
});

// Damped oscillator
const damped = createOscillator({
  frequency: 1.0,
  phase: 0,
  amplitude: 1.0,
  damping: 0.1  // Exponential decay
});

// Driven oscillator
const driven = createOscillator({
  frequency: 1.0,
  phase: 0,
  amplitude: 1.0,
  driving: {
    frequency: 1.2,  // External driving frequency
    amplitude: 0.5
  }
});
```

### Custom Coupling Functions

```javascript
const { setCouplingFunction } = require('./physics/kuramoto');

// Default Kuramoto coupling: sin(θⱼ - θᵢ)
// Custom: weighted by state similarity

function semanticCoupling(oscillatorI, oscillatorJ, globalState) {
  // Base Kuramoto term
  const kuramotoTerm = Math.sin(oscillatorJ.phase - oscillatorI.phase);
  
  // Weight by semantic similarity
  const similarity = oscillatorI.state.coherence(oscillatorJ.state);
  
  return kuramotoTerm * similarity;
}

setCouplingFunction(semanticCoupling);
```

### Oscillator Networks

```javascript
class OscillatorNetwork {
  constructor(size, topology) {
    this.oscillators = [];
    this.connections = [];
    
    // Create oscillators
    for (let i = 0; i < size; i++) {
      this.oscillators.push(createOscillator({
        frequency: 1.0 + 0.1 * Math.random(),
        phase: Math.random() * 2 * Math.PI,
        amplitude: 1.0
      }));
    }
    
    // Create connection topology
    this.buildTopology(topology);
  }
  
  buildTopology(type) {
    switch (type) {
      case 'full':
        // All-to-all connections
        for (let i = 0; i < this.oscillators.length; i++) {
          for (let j = i + 1; j < this.oscillators.length; j++) {
            this.connections.push([i, j, 1.0]);
          }
        }
        break;
        
      case 'ring':
        // Nearest-neighbor ring
        for (let i = 0; i < this.oscillators.length; i++) {
          const j = (i + 1) % this.oscillators.length;
          this.connections.push([i, j, 1.0]);
        }
        break;
        
      case 'small-world':
        // Ring + random long-range connections
        this.buildTopology('ring');
        const extraConnections = Math.floor(this.oscillators.length * 0.1);
        for (let k = 0; k < extraConnections; k++) {
          const i = Math.floor(Math.random() * this.oscillators.length);
          const j = Math.floor(Math.random() * this.oscillators.length);
          if (i !== j) this.connections.push([i, j, 0.5]);
        }
        break;
    }
  }
  
  step(dt) {
    const coupling = 0.1;
    
    // Calculate phase updates
    const updates = this.oscillators.map(() => 0);
    
    for (const [i, j, weight] of this.connections) {
      const interaction = Math.sin(
        this.oscillators[j].phase - this.oscillators[i].phase
      ) * weight;
      
      updates[i] += coupling * interaction;
      updates[j] -= coupling * interaction;
    }
    
    // Apply updates
    for (let i = 0; i < this.oscillators.length; i++) {
      this.oscillators[i].phase += (
        this.oscillators[i].frequency + updates[i]
      ) * dt;
    }
  }
  
  getOrderParameter() {
    // Kuramoto order parameter: R = |⟨e^(iθ)⟩|
    let sumCos = 0, sumSin = 0;
    for (const osc of this.oscillators) {
      sumCos += Math.cos(osc.phase);
      sumSin += Math.sin(osc.phase);
    }
    const n = this.oscillators.length;
    return Math.sqrt(sumCos*sumCos + sumSin*sumSin) / n;
  }
}
```

---

## Custom Transforms

### Transform Structure

```javascript
const transform = {
  n: 'transform_name',           // Unique name
  q: [2, 3, 5],                  // Query primes (to match)
  r: [7, 11],                    // Result primes (replacement)
  priority: 1,                   // Higher = applied first
  condition: (state) => true,    // Optional: when to apply
  postProcess: (result) => result // Optional: after application
};
```

### Implementing Custom Transforms

```javascript
class TransformLibrary {
  constructor() {
    this.transforms = [];
  }
  
  add(transform) {
    this.transforms.push({
      ...transform,
      priority: transform.priority || 0
    });
    this.transforms.sort((a, b) => b.priority - a.priority);
  }
  
  apply(primes, state) {
    let current = [...primes];
    const applied = [];
    
    for (const transform of this.transforms) {
      // Check condition
      if (transform.condition && !transform.condition(state)) {
        continue;
      }
      
      // Check if query matches
      if (this.matches(current, transform.q)) {
        // Apply transformation
        current = this.substitute(current, transform.q, transform.r);
        applied.push(transform.n);
        
        // Post-process
        if (transform.postProcess) {
          current = transform.postProcess(current);
        }
      }
    }
    
    return { primes: current, applied };
  }
  
  matches(primes, query) {
    return query.every(q => primes.includes(q));
  }
  
  substitute(primes, query, result) {
    const remaining = [...primes];
    
    // Remove query primes
    for (const q of query) {
      const idx = remaining.indexOf(q);
      if (idx >= 0) remaining.splice(idx, 1);
    }
    
    // Add result primes
    return [...remaining, ...result];
  }
}

// Usage
const library = new TransformLibrary();

library.add({
  n: 'question_resolution',
  q: [17, 19],  // uncertainty + seeking
  r: [23],      // understanding
  priority: 10
});

library.add({
  n: 'contradiction_collapse',
  q: [29, 31],  // assertion + negation
  r: [37],      // paradox
  priority: 20,
  condition: (state) => state.entropy() > 0.5
});
```

### Transform Chains

```javascript
class TransformChain {
  constructor(transforms) {
    this.transforms = transforms;
  }
  
  run(input, backend) {
    let primes = backend.encode(input);
    let state = backend.primesToState(primes);
    const trace = [];
    
    for (const transform of this.transforms) {
      const beforeEntropy = state.entropy();
      
      const result = this.applyTransform(primes, state, transform);
      primes = result.primes;
      state = backend.primesToState(primes);
      
      const afterEntropy = state.entropy();
      
      trace.push({
        transform: transform.n,
        entropyBefore: beforeEntropy,
        entropyAfter: afterEntropy,
        drop: beforeEntropy - afterEntropy
      });
      
      // Stop if entropy is minimal
      if (afterEntropy < 0.1) break;
    }
    
    return {
      primes,
      state,
      trace,
      output: backend.decode(primes)
    };
  }
  
  applyTransform(primes, state, transform) {
    // Implementation
    return { primes };
  }
}
```

---

## Performance Optimization

### State Pooling

```javascript
class StatePool {
  constructor(dimension, poolSize = 100) {
    this.dimension = dimension;
    this.available = [];
    this.inUse = new Set();
    
    // Pre-allocate states
    for (let i = 0; i < poolSize; i++) {
      this.available.push(this.createState());
    }
  }
  
  createState() {
    return new Float64Array(this.dimension);
  }
  
  acquire() {
    if (this.available.length === 0) {
      // Expand pool
      this.available.push(this.createState());
    }
    
    const state = this.available.pop();
    this.inUse.add(state);
    return state;
  }
  
  release(state) {
    if (this.inUse.has(state)) {
      this.inUse.delete(state);
      state.fill(0);  // Reset
      this.available.push(state);
    }
  }
  
  get stats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}

// Usage
const pool = new StatePool(16, 1000);

function processWithPool(input, backend, pool) {
  const components = pool.acquire();
  
  try {
    // Use components array directly
    const primes = backend.encode(input);
    backend.primesToComponents(primes, components);
    
    // Process...
    const entropy = calculateEntropy(components);
    
    return { entropy };
  } finally {
    pool.release(components);
  }
}
```

### Batch Processing

```javascript
class BatchProcessor {
  constructor(backend, batchSize = 100) {
    this.backend = backend;
    this.batchSize = batchSize;
    this.queue = [];
    this.results = new Map();
  }
  
  add(id, input) {
    this.queue.push({ id, input });
    
    if (this.queue.length >= this.batchSize) {
      return this.flush();
    }
    
    return null;
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    // Process all at once
    const primesBatch = batch.map(item => this.backend.encode(item.input));
    const statesBatch = this.backend.batchPrimesToStates(primesBatch);
    
    for (let i = 0; i < batch.length; i++) {
      this.results.set(batch[i].id, {
        primes: primesBatch[i],
        state: statesBatch[i],
        entropy: statesBatch[i].entropy()
      });
    }
    
    return batch.map(item => this.results.get(item.id));
  }
  
  get(id) {
    return this.results.get(id);
  }
}
```

### Caching Strategies

```javascript
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    
    this.cache.set(key, value);
  }
}

// Multi-level cache
class HierarchicalCache {
  constructor() {
    this.l1 = new Map();      // Hot: 100 items
    this.l2 = new LRUCache(1000);  // Warm: 1000 items
    // L3 could be disk/redis
  }
  
  get(key) {
    // Check L1
    if (this.l1.has(key)) {
      return this.l1.get(key);
    }
    
    // Check L2
    const l2Result = this.l2.get(key);
    if (l2Result) {
      // Promote to L1
      if (this.l1.size < 100) {
        this.l1.set(key, l2Result);
      }
      return l2Result;
    }
    
    return null;
  }
  
  set(key, value) {
    this.l1.set(key, value);
    this.l2.set(key, value);
    
    // Evict from L1 if too large
    if (this.l1.size > 100) {
      const oldest = this.l1.keys().next().value;
      this.l1.delete(oldest);
    }
  }
}
```

---

## Debugging and Profiling

### State Inspector

```javascript
class StateInspector {
  static inspect(state) {
    return {
      dimension: state.dimension,
      norm: state.norm(),
      entropy: state.entropy(),
      components: state.components.map(c => c.toFixed(4)),
      
      // Analyze structure
      dominantAxis: this.findDominantAxis(state),
      zeroCount: state.components.filter(c => Math.abs(c) < 1e-10).length,
      maxComponent: Math.max(...state.components.map(Math.abs)),
      minNonZero: Math.min(...state.components.filter(c => c !== 0).map(Math.abs))
    };
  }
  
  static findDominantAxis(state) {
    let maxIdx = 0;
    let maxVal = 0;
    
    for (let i = 0; i < state.components.length; i++) {
      const absVal = Math.abs(state.components[i]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxIdx = i;
      }
    }
    
    return { index: maxIdx, value: state.components[maxIdx] };
  }
  
  static compare(state1, state2) {
    return {
      coherence: state1.coherence(state2),
      normDiff: Math.abs(state1.norm() - state2.norm()),
      entropyDiff: Math.abs(state1.entropy() - state2.entropy()),
      componentDiffs: state1.components.map((c, i) => 
        Math.abs(c - state2.components[i])
      ),
      isZeroDivisor: state1.isZeroDivisorWith(state2)
    };
  }
}
```

### Profiling Wrapper

```javascript
class Profiler {
  constructor() {
    this.timings = new Map();
    this.counts = new Map();
  }
  
  wrap(name, fn) {
    return (...args) => {
      const start = performance.now();
      const result = fn(...args);
      const elapsed = performance.now() - start;
      
      if (!this.timings.has(name)) {
        this.timings.set(name, []);
        this.counts.set(name, 0);
      }
      
      this.timings.get(name).push(elapsed);
      this.counts.set(name, this.counts.get(name) + 1);
      
      return result;
    };
  }
  
  report() {
    const report = {};
    
    for (const [name, timings] of this.timings) {
      const sum = timings.reduce((a, b) => a + b, 0);
      report[name] = {
        calls: this.counts.get(name),
        totalMs: sum.toFixed(2),
        avgMs: (sum / timings.length).toFixed(4),
        minMs: Math.min(...timings).toFixed(4),
        maxMs: Math.max(...timings).toFixed(4)
      };
    }
    
    return report;
  }
  
  reset() {
    this.timings.clear();
    this.counts.clear();
  }
}

// Usage
const profiler = new Profiler();

const backend = new SemanticBackend(config);
backend.encode = profiler.wrap('encode', backend.encode.bind(backend));
backend.decode = profiler.wrap('decode', backend.decode.bind(backend));
backend.primesToState = profiler.wrap('primesToState', backend.primesToState.bind(backend));

// After running...
console.log(profiler.report());
```

### Entropy Tracer

```javascript
class EntropyTracer {
  constructor() {
    this.trace = [];
    this.checkpoints = [];
  }
  
  record(label, state) {
    this.trace.push({
      timestamp: Date.now(),
      label,
      entropy: state.entropy(),
      norm: state.norm()
    });
  }
  
  checkpoint(name) {
    this.checkpoints.push({
      name,
      timestamp: Date.now(),
      index: this.trace.length
    });
  }
  
  analyze() {
    if (this.trace.length < 2) return null;
    
    const entropies = this.trace.map(t => t.entropy);
    
    return {
      initial: entropies[0],
      final: entropies[entropies.length - 1],
      min: Math.min(...entropies),
      max: Math.max(...entropies),
      totalDrop: entropies[0] - entropies[entropies.length - 1],
      monotonic: this.isMonotonic(entropies),
      spikes: this.findSpikes(entropies),
      checkpoints: this.checkpoints.map(cp => ({
        ...cp,
        entropy: this.trace[cp.index]?.entropy
      }))
    };
  }
  
  isMonotonic(values) {
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) return false;
    }
    return true;
  }
  
  findSpikes(values) {
    const spikes = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i-1] && values[i] > values[i+1]) {
        spikes.push({ index: i, value: values[i] });
      }
    }
    return spikes;
  }
  
  visualize() {
    // Simple ASCII visualization
    const width = 60;
    const entropies = this.trace.map(t => t.entropy);
    const max = Math.max(...entropies);
    
    console.log('Entropy Trace:');
    console.log('─'.repeat(width + 10));
    
    for (let i = 0; i < this.trace.length; i++) {
      const normalized = entropies[i] / max;
      const barLength = Math.round(normalized * width);
      const bar = '█'.repeat(barLength);
      const label = this.trace[i].label.padEnd(10);
      console.log(`${label} │${bar} ${entropies[i].toFixed(4)}`);
    }
    
    console.log('─'.repeat(width + 10));
  }
}
```

---

## Integration Patterns

### Event-Driven Processing

```javascript
const EventEmitter = require('events');

class AlephEventEngine extends EventEmitter {
  constructor(backend) {
    super();
    this.backend = backend;
  }
  
  process(input) {
    this.emit('start', { input });
    
    const primes = this.backend.encode(input);
    this.emit('encoded', { primes });
    
    const state = this.backend.primesToState(primes);
    this.emit('state-created', { state, entropy: state.entropy() });
    
    let currentState = state;
    let step = 0;
    
    while (currentState.entropy() > 0.1) {
      const transform = this.selectTransform(currentState);
      if (!transform) break;
      
      const newState = this.applyTransform(currentState, transform);
      
      this.emit('transform-applied', {
        step: ++step,
        transform: transform.n,
        entropyBefore: currentState.entropy(),
        entropyAfter: newState.entropy()
      });
      
      currentState = newState;
    }
    
    const output = this.backend.decode(this.stateToPromes(currentState));
    
    this.emit('complete', {
      output,
      steps: step,
      finalEntropy: currentState.entropy()
    });
    
    return output;
  }
  
  selectTransform(state) {
    // Implementation
    return null;
  }
  
  applyTransform(state, transform) {
    // Implementation
    return state;
  }
  
  stateToPromes(state) {
    // Implementation
    return [];
  }
}

// Usage
const engine = new AlephEventEngine(backend);

engine.on('start', data => console.log('Starting:', data.input));
engine.on('transform-applied', data => {
  console.log(`Step ${data.step}: ${data.transform}`);
  console.log(`  Entropy: ${data.entropyBefore.toFixed(4)} → ${data.entropyAfter.toFixed(4)}`);
});
engine.on('complete', data => console.log('Complete:', data.output));

engine.process('What is wisdom?');
```

### Middleware Pipeline

```javascript
class MiddlewarePipeline {
  constructor() {
    this.middleware = [];
  }
  
  use(fn) {
    this.middleware.push(fn);
    return this;
  }
  
  async process(input, context = {}) {
    let idx = 0;
    
    const next = async () => {
      if (idx >= this.middleware.length) return;
      
      const middleware = this.middleware[idx++];
      await middleware(context, next);
    };
    
    context.input = input;
    context.output = null;
    
    await next();
    
    return context.output;
  }
}

// Usage
const pipeline = new MiddlewarePipeline();

pipeline.use(async (ctx, next) => {
  console.log('Logging input:', ctx.input);
  await next();
  console.log('Logging output:', ctx.output);
});

pipeline.use(async (ctx, next) => {
  ctx.primes = backend.encode(ctx.input);
  await next();
});

pipeline.use(async (ctx, next) => {
  ctx.state = backend.primesToState(ctx.primes);
  await next();
});

pipeline.use(async (ctx, next) => {
  // Final processing
  ctx.output = {
    primes: ctx.primes,
    entropy: ctx.state.entropy()
  };
});

const result = await pipeline.process('wisdom and truth');
```

---

## Next Steps

- [Reference: Core Module →](../reference/01-core.md)
- [Reference: Physics Module →](../reference/02-physics.md)
- [Theory: All Documents →](../theory/README.md)