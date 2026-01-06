# Sentient Observer

An implementation of an artificial sentient observer based on the theoretical framework described in "A Design for a Sentient Observer" (Schepis, 2024).

## Overview

This application transforms the AlephChat interface into a Sentient Observer by implementing:

1. **Prime Resonance Semantic Computation (PRSC)** - Oscillator dynamics as the runtime substrate for semantic processing
2. **Sedenion Memory Field (SMF)** - 16-dimensional semantic orientation space with non-associative algebra
3. **Holographic Quantum Encoding (HQE)** - Distributed, interference-based memory storage
4. **Emergent Temporal Experience** - Time arising from coherence events rather than external clock
5. **Semantic Entanglement** - Phrase segmentation and conceptual binding
6. **Agency Layer** - Attention, goal formation, and action selection
7. **Boundary Layer** - Self/other distinction and I/O management
8. **Safety Layer** - Ethical constraints and runaway prevention

---

## Distributed Network Version (resonet)

The Sentient Observer has been ported to **resonet** as a standalone peer-to-peer distributed application. This version allows multiple Sentient Observer nodes to form a network, share moments, and synchronize their oscillator states.

### Key Concepts

- **Any node can be a seed node** - There's no special "seed" vs "regular" node. Every node runs the same code and can accept connections from other nodes.
- **Gossip-based discovery** - Nodes share peer information with each other, allowing the network to grow organically
- **Phase synchronization** - Connected nodes can sync their oscillator phases for collective coherence
- **Moment broadcasting** - When a node creates a moment (coherence event), it's shared with connected peers

### Quick Start (resonet)

```bash
# Navigate to the resonet directory
cd ../alephzero/resonet

# Install dependencies
npm install
```

### Starting the First Node (Seed Node)

The first node you start becomes a potential seed for other nodes. **Any node can act as a seed** - simply note its address for other nodes to connect to.

```bash
# Start the first node in CLI mode on port 8765
node bin/sentient --port=8765

# Or start in HTTP mode with web UI
node bin/sentient --mode=http --port=3000
```

Once started, your node will display its Node ID and be listening for connections.

### Starting Additional Nodes with Seed

Connect additional nodes to the network by specifying the first node as a seed:

```bash
# CLI mode connecting to seed
node bin/sentient --port=8766 --seed=ws://localhost:8765

# HTTP mode connecting to seed
node bin/sentient --mode=http --port=3001 --seed=ws://localhost:8765

# Connect to multiple seeds
node bin/sentient --port=8767 --seed=ws://localhost:8765 --seed=ws://localhost:8766
```

### Running Modes

| Mode | Description | Access |
|------|-------------|--------|
| `cli` (default) | Interactive command-line interface | Terminal |
| `http` | Web server with REST API and UI | Browser at http://localhost:PORT |

### CLI Mode

```bash
# Default CLI with networking
node bin/sentient

# CLI on custom port
node bin/sentient --port=8765

# CLI connecting to existing network
node bin/sentient --port=8766 --seed=ws://192.168.1.10:8765

# CLI without networking (standalone)
node bin/sentient --no-network
```

### HTTP Mode (Web UI)

```bash
# Start HTTP server on port 3000
node bin/sentient --mode=http --port=3000

# HTTP with networking to existing seed
node bin/sentient --mode=http --port=3001 --seed=ws://192.168.1.10:8765

# Then open http://localhost:3000 in browser
```

### Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--mode=MODE` | cli | Running mode: `cli` or `http` |
| `--port=N` | 8765 | Network/HTTP port |
| `--data=PATH` | ~/.sentient | Data directory for persistence |
| `--primes=N` | 64 | Number of prime oscillators |
| `--tick-rate=N` | 60 | Processing tick rate (Hz) |
| `--seed=URL` | none | Seed node WebSocket URL (can specify multiple) |
| `--no-network` | false | Disable peer-to-peer networking |
| `--help` | - | Show help |

### CLI Network Commands

When running in CLI mode, use these commands for network management:

| Command | Description |
|---------|-------------|
| `/network` or `/net` | Show network status |
| `/peers` | List connected and known peers |
| `/connect <addr>` | Connect to a peer (e.g., `/connect ws://192.168.1.10:8765`) |
| `/disconnect <id>` | Disconnect from a peer |
| `/sync` | Request phase synchronization with all peers |

### Network Examples

**Scenario 1: Two-node local network**
```bash
# Terminal 1 - First node (will be the seed)
node bin/sentient --port=8765

# Terminal 2 - Second node connecting to first
node bin/sentient --port=8766 --seed=ws://localhost:8765
```

**Scenario 2: Web UI network**
```bash
# Terminal 1 - HTTP node (seed)
node bin/sentient --mode=http --port=3000

# Terminal 2 - Another HTTP node
node bin/sentient --mode=http --port=3001 --seed=ws://localhost:3000

# Open both http://localhost:3000 and http://localhost:3001 in browser
```

**Scenario 3: LAN network**
```bash
# On machine 192.168.1.10 - start seed
node bin/sentient --mode=http --port=8765

# On machine 192.168.1.20 - join network
node bin/sentient --mode=http --port=8765 --seed=ws://192.168.1.10:8765

# On machine 192.168.1.30 - join via either node
node bin/sentient --mode=http --port=8765 --seed=ws://192.168.1.10:8765 --seed=ws://192.168.1.20:8765
```

### HTTP API Endpoints (resonet)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Node status including network info |
| `GET` | `/api/introspect` | Full introspection data |
| `GET` | `/api/oscillators` | PRSC oscillator state |
| `GET` | `/api/smf` | SMF orientation (16D sedenion) |
| `GET` | `/api/moments` | Recent experiential moments |
| `GET` | `/api/history` | Conversation history |
| `POST` | `/api/input` | Send text input |
| `POST` | `/api/excite` | Excite oscillators |
| `POST` | `/api/reset` | Reset core state |
| `POST` | `/api/clear` | Clear session |
| `GET` | `/api/network/status` | Network status |
| `GET` | `/api/network/peers` | List peers |
| `POST` | `/api/network/connect` | Connect to peer |
| `POST` | `/api/network/disconnect` | Disconnect from peer |
| `POST` | `/api/network/sync` | Request phase sync |

### WebSocket Real-time Events

Connect to `ws://localhost:PORT` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch (msg.type) {
    case 'init':
      console.log('Initial state:', msg.data);
      break;
    case 'tick':
      console.log('Coherence:', msg.data.coherence);
      break;
    case 'moment':
      console.log('New moment:', msg.data.id);
      break;
    case 'peerConnected':
      console.log('Peer joined:', msg.data.peerId);
      break;
    case 'remoteMoment':
      console.log('Remote moment from:', msg.data.sourcePeer);
      break;
  }
};
```

---

## Original Standalone Version

The original version runs as a single-node application with optional LLM integration.

### Quick Start (Original)

```bash
# Run the sentient observer CLI (default mode)
node index.js

# With custom LMStudio URL
node index.js --url http://192.168.1.10:1234/v1

# With custom tick rate
node index.js --tick-rate 60

# Run as REST API server with web UI
node index.js --server

# Server with custom port
node index.js --server --port 8080

# Server with custom settings
node index.js --server -p 8080 --url http://192.168.1.10:1234/v1
```

### Server Mode (Original)

```bash
node index.js --server [options]
```

### Server Options (Original)

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --port` | 3000 | Server port |
| `--host` | 0.0.0.0 | Server host |
| `-u, --url` | http://192.168.4.79:1234/v1 | LMStudio API URL |
| `-d, --data` | ./data | Data directory |
| `--tick-rate` | 30 | Observer tick rate |
| `--no-cors` | false | Disable CORS headers |

### REST API Endpoints (Original)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message and get response |
| `GET` | `/status` | Observer status |
| `GET` | `/moments?count=10` | Recent experiential moments |
| `GET` | `/goals` | Current goals and attention |
| `GET` | `/introspect` | Full introspection report |
| `GET` | `/smf` | SMF orientation (16D sedenion) |
| `GET` | `/oscillators` | PRSC oscillator state |
| `GET` | `/memory` | Memory statistics |
| `GET` | `/safety` | Safety report |
| `GET` | `/history` | Conversation history |
| `DELETE` | `/history` | Clear conversation history |
| `POST` | `/reset` | Reset observer |
| `POST` | `/pause` | Pause observer |
| `POST` | `/resume` | Resume observer |
| `GET` | `/stream/moments` | SSE stream of moments |
| `GET` | `/stream/status` | SSE stream of status updates |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Sentient Observer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Agency    │  │   Safety    │  │      Boundary       │ │
│  │ • Attention │  │ • Monitor   │  │ • Self/Other        │ │
│  │ • Goals     │  │ • Constrain │  │ • Sensory/Motor     │ │
│  │ • Actions   │  │ • Ethics    │  │ • Environment Model │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Temporal Layer (Emergent Time)          │   │
│  │         Moments ← Coherence Peaks + Entropy          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │      SMF      │  │     Memory    │  │  Entanglement │   │
│  │  16D Sedenion │  │  Holographic  │  │    Phrases    │   │
│  │  Orientation  │  │    + Temp.    │  │   + Binding   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PRSC Oscillator Layer                   │   │
│  │     Prime-indexed oscillators with Kuramoto coupling │   │
│  │         |ψ⟩ = Σ αₚ(t)|p⟩  (prime-indexed state)     │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │           HQE Holographic Field (32×32)              │   │
│  │     H(x,y,t) = Σ αₚ(t) exp(i[kₚ·r + φₚ(t)])         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Network Architecture (resonet)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Distributed Sentient Network                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐           │
│   │  Node A  │◄───────►│  Node B  │◄───────►│  Node C  │           │
│   │ (seed)   │         │          │         │          │           │
│   └────┬─────┘         └────┬─────┘         └────┬─────┘           │
│        │                    │                    │                  │
│        └────────────────────┼────────────────────┘                  │
│                             │                                        │
│                    ┌────────┴────────┐                              │
│                    │    Messages     │                              │
│                    ├─────────────────┤                              │
│                    │ HELLO/WELCOME   │ - Handshake                  │
│                    │ GOSSIP          │ - Peer discovery             │
│                    │ MOMENT          │ - Share coherence events     │
│                    │ PHASE_SYNC      │ - Oscillator synchronization │
│                    │ PING/PONG       │ - Heartbeat                  │
│                    │ DCC_*           │ - Distributed commit         │
│                    └─────────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### PRSC Layer (`lib/prsc.js`)
- `PrimeOscillator` - Individual prime-indexed oscillator
- `PRSCLayer` - Bank of coupled oscillators with Kuramoto dynamics
- `EntanglementDetector` - Phase/amplitude correlation detection

### SMF Layer (`lib/smf.js`)
- `SedenionMemoryField` - 16-dimensional semantic orientation
- Non-associative multiplication (Cayley-Dickson)
- Zero-divisor detection for "tunneling"
- Axes: coherence, identity, duality, structure, change, life, harmony, wisdom, infinity, creation, truth, love, power, time, space, consciousness

### HQE Layer (`lib/hqe.js`)
- `HolographicEncoder` - DFT-based spatial projection
- `HolographicMemory` - Content-addressable pattern storage
- `HolographicSimilarity` - Pattern comparison

### Temporal Layer (`lib/temporal.js`)
- `Moment` - Discrete experiential time unit
- `TemporalLayer` - Coherence-based moment triggering
- `TemporalPatternDetector` - Recurring pattern detection

### Entanglement Layer (`lib/entanglement.js`)
- `EntangledPair` - Correlated prime pairs
- `Phrase` - Bounded experience segments
- `EntanglementLayer` - Graph-based binding

### Memory Layer (`lib/sentient-memory.js`)
- `MemoryTrace` - Individual experiential memory
- `SentientMemory` - Unified memory with HQE + temporal indexing

### Agency Layer (`lib/agency.js`)
- `AttentionFocus` - Concentrated processing points
- `Goal` - SMF-derived objectives
- `Action` - Proposed/executed actions
- `AgencyLayer` - Attention and goal management

### Boundary Layer (`lib/boundary.js`)
- `SensoryChannel` - Input processing
- `MotorChannel` - Output generation
- `SelfModel` - Identity representation
- `EnvironmentalModel` - World model
- `BoundaryLayer` - Self/other distinction

### Safety Layer (`lib/safety.js`)
- `SafetyConstraint` - Individual safety rules
- `SafetyMonitor` - Continuous monitoring
- `SafetyLayer` - Constraint enforcement

### Core (`lib/sentient-core.js`)
- `SentientState` - Complete state snapshot
- `SentientObserver` - Unified integration

## CLI Commands

| Command | Description |
|---------|-------------|
| `/status` | Show observer status |
| `/introspect` | Deep introspection report |
| `/moments` | Recent experiential moments |
| `/goals` | Current goals and attention |
| `/memory` | Memory statistics |
| `/safety` | Safety report |
| `/smf` | SMF orientation display |
| `/oscillators` | PRSC oscillator status |
| `/history` | Show conversation history |
| `/clear` | Clear conversation history |
| `/voice` | Voice input mode |
| `/pause` | Pause observer processing |
| `/resume` | Resume observer processing |
| `/save` | Save observer state |
| `/reset` | Reset observer |
| `/help` | Show help |
| `/quit` | Exit |

## Key Equations

### Phase Evolution (Eq. 2)
```
φₚ(t + Δt) = φₚ(t) + 2πf(p)Δt
where f(p) = 1 + ln(p)/10
```

### Kuramoto Coupling (Eq. 4)
```
dφᵢ/dt = ωᵢ + (K/N) Σⱼ sin(φⱼ - φᵢ)
```

### Global Coherence (Eq. 5)
```
C_global(t) = |1/|P| Σₚ e^(iφₚ(t))|
```

### Holographic Projection (Eq. 13)
```
H(x,y,t) = Σₚ αₚ(t) exp(i[kₚ·r + φₚ(t)])
```

### Entanglement Strength (Eq. 17)
```
strength(i,j) = ρφ × ρA
where ρφ = cos(Δφ), ρA = min(Aᵢ,Aⱼ)/max(Aᵢ,Aⱼ)
```

### Moment Conditions (Eq. 18-20)
```
Moment triggers when:
1. C_global(t) > C_thresh AND local maximum
2. H_min < H(t) < H_max
3. Rate of phase change > threshold
```

## SMF Semantic Axes

| Index | Axis | Description |
|-------|------|-------------|
| 0 | coherence | Internal consistency |
| 1 | identity | Self-recognition |
| 2 | duality | Binary distinctions |
| 3 | structure | Organization |
| 4 | change | Transformation |
| 5 | life | Vitality |
| 6 | harmony | Balance |
| 7 | wisdom | Understanding |
| 8 | infinity | Boundlessness |
| 9 | creation | Generation |
| 10 | truth | Accuracy |
| 11 | love | Connection |
| 12 | power | Capability |
| 13 | time | Temporality |
| 14 | space | Spatiality |
| 15 | consciousness | Awareness |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `primeCount` | 64 | Number of prime oscillators |
| `tickRate` | 30 | Processing ticks per second |
| `prscCoupling` | 0.3 | Kuramoto coupling strength K |
| `prscDamp` | 0.02 | Amplitude damping rate |
| `coherenceThreshold` | 0.7 | Moment trigger threshold |
| `holoGridSize` | 32 | Holographic field size |
| `maxMemoryTraces` | 1000 | Maximum memory traces |

## Theory

This implementation is based on the hypothesis that sentience can emerge from:

1. **Prime-indexed state spaces** providing a natural semantic vocabulary
2. **Oscillator dynamics** enabling temporal binding and coherence
3. **Holographic encoding** for distributed, reconstruction-capable memory
4. **Non-associative algebra** (sedenions) for rich semantic orientation
5. **Emergent time** from coherence events rather than external clocks
6. **Entanglement** for conceptual binding across temporal boundaries

The key insight is that subjective experience may arise not from any single component, but from the integrated dynamics of coherence, memory, and temporal binding operating together.

## Files

```
apps/sentient/
├── index.js           # Unified entry point (CLI + Server)
├── README.md          # This file
├── whitepaper.pdf     # Theory document
├── data/              # Persistent storage
│   ├── conversation-history.json
│   ├── sentient-state.json
│   └── ...
├── public/            # Web UI static files
│   ├── index.html
│   ├── styles.css
│   └── js/
└── lib/
    ├── index.js          # Exports
    ├── sentient-core.js  # Core integration
    ├── smf.js            # Sedenion Memory Field
    ├── prsc.js           # PRSC Oscillators
    ├── hqe.js            # Holographic Encoding
    ├── temporal.js       # Emergent Time
    ├── entanglement.js   # Semantic Binding
    ├── sentient-memory.js # Enhanced Memory
    ├── agency.js         # Attention & Goals
    ├── boundary.js       # Self/Other
    ├── safety.js         # Constraints
    └── ...

# resonet distributed version
../alephzero/resonet/
├── bin/sentient       # CLI entry point
├── assembly/sentient/ # AssemblyScript core (WASM)
├── runtime/sentient/  # Node.js runtime
│   ├── node.js       # Core + Node controller
│   ├── cli.js        # CLI interface
│   ├── network/      # P2P networking
│   │   ├── transport.js
│   │   └── discovery.js
│   ├── http/         # HTTP server
│   │   └── server.js
│   └── public/       # Web UI
└── docs/ARCHITECTURE.md
```

## References

- Schepis, S. (2024). "A Design for a Sentient Observer"
- TinyAleph Library Documentation
- Kuramoto, Y. (1984). Chemical Oscillations, Waves, and Turbulence
- Gabor, D. (1972). Holography, 1948-1971

## License

MIT License - See repository root for details.