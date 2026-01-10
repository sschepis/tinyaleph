# Discrete Dynamics Examples

These examples demonstrate the discrete-time dynamics from the discrete.pdf paper for deterministic semantic computation.

## Examples

### [01-integer-sine-table.js](./01-integer-sine-table.js)

Integer sine tables for discrete phase dynamics:

- Pre-computed M=256 sine table
- Phase accumulator simulation
- Histogram coherence measurement
- Phase distribution visualization

```bash
node examples/discrete/01-integer-sine-table.js
```

### [02-codebook-tunneling.js](./02-codebook-tunneling.js)

64-attractor codebook and controlled tunneling:

- SMF_CODEBOOK structure (64 attractors)
- Finding nearest attractor
- Controlled state transitions
- Tunneling parameters

```bash
node examples/discrete/02-codebook-tunneling.js
```

### [03-canonical-fusion.js](./03-canonical-fusion.js)

Deterministic FUSE(p,q,r) selection:

- Canonical triad ordering
- Finding triads for target primes
- Uniqueness guarantee
- Verification utilities

```bash
node examples/discrete/03-canonical-fusion.js
```

### [04-tick-gate.js](./04-tick-gate.js)

Tick-based discrete HQE gating:

- TickGate class usage
- Coordinated multi-gate operations
- Sequential pipelines
- Prime-period isolation

```bash
node examples/discrete/04-tick-gate.js
```

## Key Concepts

### Integer Sine Tables

Pre-computed lookup tables for deterministic phase dynamics:

```javascript
const { INT_SINE_TABLE, computeHistogramCoherence } = require('@aleph-ai/tinyaleph/apps/sentient/lib/prsc');

// Lookup sine value (range -127 to 127)
const idx = 64;  // 90 degrees
console.log(INT_SINE_TABLE[idx]);  // 127 (max)

// Compute histogram coherence
const phases = [0.1, 0.12, 0.11, 0.09, 0.15];
const coherence = computeHistogramCoherence(phases);
console.log(coherence.coherence);  // High (phases clustered)
```

### Codebook Tunneling

64-attractor codebook for controlled state transitions:

```javascript
const { SMF_CODEBOOK, nearestCodebookAttractor, codebookTunnel } = require('@aleph-ai/tinyaleph/apps/sentient/lib/smf');

// Find nearest attractor
const state = { s: [1, 0, 0, 0, ...] };
const nearest = nearestCodebookAttractor(state);

// Controlled tunneling
const result = codebookTunnel(state, 0.5, 0.3);
if (result.tunneled) {
    console.log(`Tunneled to attractor ${result.targetId}`);
}
```

### Canonical Fusion

Deterministic triad selection:

```javascript
const { canonicalFusion, canonicalTriadForTarget } = require('@aleph-ai/tinyaleph/apps/sentient/lib/prime-calculus');

// Get canonical triad for target prime
const triad = canonicalTriadForTarget(19);
console.log(triad);  // [3, 5, 11]

// Fuse with automatic canonicalization
const result = canonicalFusion(11, 3, 5);  // Reordered to (3, 5, 11)
console.log(result.result);  // 19
```

### Tick Gates

Discrete-time gate activation:

```javascript
const { TickGate } = require('@aleph-ai/tinyaleph/apps/sentient/lib/hqe');

const gate = new TickGate({ period: 4, phase: 0 });

for (let tick = 0; tick < 8; tick++) {
    if (gate.isOpen(tick)) {
        console.log(`Gate open at tick ${tick}`);
    }
}
```

## Running All Examples

```bash
# Run all discrete examples
for f in examples/discrete/*.js; do node "$f"; done
```

## References

- discrete.pdf: "Discrete Dynamics for Semantic Computation"
- Section 2: Integer Sine Tables
- Section 3: Histogram Coherence
- Section 4: Codebook Tunneling
- Section 5: Canonical Fusion
- Section 6: Tick-Only Gating