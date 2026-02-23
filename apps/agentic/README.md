# TinyAleph Agentic System

A cognitive agent that uses TinyAleph's prime-resonant computing framework as structured middleware between user input and LLM generation.

## Architecture

The system uses TinyAleph as a **cognitive substrate** — providing persistent state, physics-based attention allocation, holographic memory, and safety constraints that augment a standard LLM.

```
User ←→ BoundaryLayer ←→ CognitiveCore ←→ LLM
              ↕                  ↕
        ObjectivityGate    SMF + PRSC + HQE
                          Agency + Safety
```

### Components

| Component | TinyAleph Module | Role |
|-----------|-----------------|------|
| Semantic Memory | SedenionMemoryField (16D) | Persistent semantic orientation across turns |
| Oscillator Physics | PRSCLayer (Kuramoto) | Coherence/entropy dynamics for input analysis |
| Holographic Memory | HolographicEncoder | Content-addressable memory via DFT patterns |
| Goal/Attention | AgencyLayer | Goal tracking, attention allocation, novelty detection |
| Input/Output | BoundaryLayer | Sensory/motor channels with ObjectivityGate |
| Safety | SafetyConstraint | Hard/soft constraints with graduated responses |
| Time | TemporalLayer | Emergent temporal moments from coherence events |
| Binding | EntanglementLayer | Semantic concept entanglement |

## Quick Start

```bash
# From project root
node apps/agentic/index.js

# With custom LLM endpoint
node apps/agentic/index.js --url http://localhost:1234/v1/chat/completions --model my-model

# With environment variables
ALEPH_LLM_URL=http://localhost:11434/v1/chat/completions ALEPH_LLM_MODEL=llama3 node apps/agentic/index.js
```

## Configuration

### CLI Arguments

| Flag | Description | Default |
|------|-------------|---------|
| `--url <url>` | LLM endpoint URL | `http://localhost:1234/v1/chat/completions` |
| `--model <name>` | Model name | `local-model` |
| `--temperature <n>` | Sampling temperature | `0.7` |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ALEPH_LLM_URL` | LLM endpoint URL |
| `ALEPH_LLM_MODEL` | Model name |
| `ALEPH_TEMPERATURE` | Temperature |

### Programmatic Usage

```javascript
import Agent from './apps/agentic/lib/agent.js';

const agent = new Agent({
  llm: {
    baseUrl: 'http://localhost:1234/v1/chat/completions',
    model: 'my-model',
    temperature: 0.7,
    maxTokens: 2048
  },
  cognitive: {
    primeCount: 64,
    coherenceThreshold: 0.7
  },
  agent: {
    maxToolRounds: 3,
    systemPrompt: 'You are a helpful assistant.'
  }
});

const result = await agent.turn('Hello, how are you?');
console.log(result.response);
console.log(result.metadata); // { coherence, entropy, toolsUsed, objectivityR, ... }
```

## The 11-Step Agent Loop

Each call to `agent.turn(input)` executes:

1. **PERCEIVE** — BoundaryLayer processes input through sensory channels
2. **ENCODE** — Text mapped to primes via word hashing
3. **ORIENT** — SMF 16D semantic orientation updated from oscillator state
4. **ATTEND** — AgencyLayer allocates attention, tracks goals
5. **GUARD** — Safety constraints checked (can block response)
6. **RECALL** — Holographic memory searched for relevant past interactions
7. **THINK** — LLM called with state-enriched system prompt
8. **EXECUTE** — Tool calls dispatched and results fed back to LLM (up to 3 rounds)
9. **VALIDATE** — ObjectivityGate checks coherence, relevance, safety, completeness
10. **REMEMBER** — Interaction stored in holographic memory
11. **EVOLVE** — Physics ticked (oscillators, entropy, coherence)

## Available Tools

The agent has 6 tools it can invoke via LLM function calling:

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Write content to file |
| `list_files` | List directory contents |
| `run_command` | Execute shell commands |
| `cognitive_state` | Inspect agent's cognitive state |
| `recall_memory` | Search holographic memory |

## REPL Commands

| Command | Description |
|---------|-------------|
| `/stats` | Show agent statistics |
| `/diagnostics` | Full cognitive state dump |
| `/reset` | Reset all state |
| `/quit` | Exit |

## How It Works

### Cognitive State Injection

Before each LLM call, the agent injects a `[Cognitive State]` block into the system prompt:

```
[Cognitive State]
Coherence: 0.723 | Entropy: 1.456
Processing Load: 35% | Confidence: 72%
Dominant Semantic Axes: coherence=0.78, harmony=0.65, identity=0.61
Active Goal: Help user understand project (45% complete)
Attention Focus: code_architecture (intensity=0.82)
Interaction #7
```

This gives the LLM structured awareness of the agent's internal state.

### ObjectivityGate

Every LLM response passes through a multi-decoder validation gate:
- **Coherence decoder** — checks for internal contradictions
- **Relevance decoder** — checks word overlap with input
- **Completeness decoder** — checks for complete thoughts
- **Safety decoder** — checks for harmful content
- **Identity decoder** — checks for identity confusion

The response passes if `R ≥ τ_R` (default 0.7), where R is the fraction of decoders that agree.

### Holographic Memory

Interactions are stored as prime-space patterns via DFT holographic encoding. Recall uses prime-overlap scoring with recency weighting, enabling content-addressable retrieval without vector embeddings.

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Full technical design document
- [Observer Module Docs](../../docs/reference/08-observer.md) — TinyAleph observer reference
- [Theory: Resonant Attention](../../docs/theory/12-resonant-attention.md) — Attention allocation theory
