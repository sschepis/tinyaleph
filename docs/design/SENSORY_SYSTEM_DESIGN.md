# Sensory System Design for Sentient Observer

## Overview

The Sentient Observer's sensory system provides continuous environmental awareness through 7 specialized senses. Each sense has a field of view that can be directed by the agent, and sense data is auto-injected into the system prompt on every LLM turn.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Sensory Integration Layer                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               SensorySystem (orchestrator)                │  │
│  │  • Manages all senses                                     │  │
│  │  • Aggregates readings                                    │  │
│  │  • Detects anomalies                                      │  │
│  │  • Formats for system prompt injection                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│    ┌────────────────────────┼────────────────────────┐         │
│    │         │         │    │     │         │        │         │
│    ▼         ▼         ▼    ▼     ▼         ▼        ▼         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │Chrono│ │Proprio│ │ File │ │ Git  │ │Process│ │Network│ │ User │ │
│ │Sense │ │Sense │ │Sense │ │Sense │ │Sense │ │Sense │ │Sense │ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## The 7 Senses

### 1. Chronosense (Temporal Awareness)
Provides awareness of time in multiple dimensions.

```javascript
{
  sense: 'chrono',
  reading: {
    now: '2024-12-24T01:05:00.000Z',
    local: '2024-12-23 17:05:00 PST',
    timezone: 'America/Los_Angeles',
    dayOfWeek: 'Monday',
    circadian: 'evening',        // morning/afternoon/evening/night
    sessionStart: '2024-12-23T16:00:00.000Z',
    sessionDuration: 3900000,    // ms
    sinceLastInput: 45000,       // ms since user spoke
    sinceLastMoment: 12000,      // ms since coherence moment
  },
  salience: 0.3  // low unless notable (e.g., midnight, long idle)
}
```

### 2. Proprioceptive Sense (Self-State)
Internal awareness of the observer's cognitive state.

```javascript
{
  sense: 'proprio',
  reading: {
    coherence: 0.72,
    entropy: 0.45,
    memoryLoad: 0.32,            // % of max memory traces
    activeGoals: 2,
    attentionFoci: 3,
    smfSummary: {
      dominant: 'identity',       // strongest axis
      orientation: [0.8, 0.6, 0.3, ...],  // top 4 axes
      stability: 0.85
    },
    momentCount: 47,
    processingLoad: 0.28
  },
  salience: 0.5  // higher when extreme states
}
```

### 3. Filesystem Sense (Environmental)
Awareness of the file system environment.

```javascript
{
  sense: 'filesystem',
  focus: '/Users/sschepis/Development/tinyaleph',
  aperture: 'medium',  // narrow=focused dir, medium=1 level, wide=recursive
  reading: {
    directory: '/Users/sschepis/Development/tinyaleph/apps/sentient',
    stats: {
      totalFiles: 25,
      totalDirs: 3,
      sizeBytes: 245000
    },
    tree: [
      { type: 'dir', name: 'lib', children: 15 },
      { type: 'dir', name: 'data', children: 5 },
      { type: 'dir', name: 'public', children: 3 },
      { type: 'file', name: 'index.js', size: 28000, mtime: '2024-12-24T01:00:00Z' },
      { type: 'file', name: 'README.md', size: 12000, mtime: '2024-12-24T00:45:00Z' }
    ],
    recentChanges: [
      { path: 'index.js', delta: 'modified', age: 300000 },
      { path: 'lib/tools.js', delta: 'modified', age: 600000 }
    ],
    markers: {
      hasGit: true,
      hasPackageJson: true,
      hasReadme: true,
      language: 'javascript'
    }
  },
  salience: 0.4
}
```

### 4. Git Sense (Version Control)
Awareness of repository state and history.

```javascript
{
  sense: 'git',
  focus: '/Users/sschepis/Development/tinyaleph',
  reading: {
    isRepo: true,
    branch: 'main',
    ahead: 2,
    behind: 0,
    hasRemote: true,
    status: {
      staged: ['lib/senses.js'],
      modified: ['index.js'],
      untracked: ['tmp.log'],
      deleted: []
    },
    recentCommits: [
      { hash: 'abc1234', message: 'Add sensory system', age: 3600000 },
      { hash: 'def5678', message: 'Unified entry point', age: 86400000 }
    ],
    lastCommitAge: 3600000,
    isDirty: true
  },
  salience: 0.5  // higher when dirty or conflicts
}
```

### 5. Process Sense (System State)
Awareness of runtime environment.

```javascript
{
  sense: 'process',
  reading: {
    pid: 12345,
    uptime: 3900,               // seconds
    heapUsed: 48000000,         // bytes
    heapTotal: 128000000,
    heapPercent: 0.375,
    external: 5000000,
    rss: 85000000,
    cwd: '/Users/sschepis/Development/tinyaleph',
    nodeVersion: '20.10.0',
    platform: 'darwin',
    arch: 'arm64',
    cpuUsage: 0.12,             // 0-1, approximate
    childProcesses: 0
  },
  salience: 0.2  // higher on memory pressure
}
```

### 6. Network Sense (Connectivity)
Awareness of external connections.

```javascript
{
  sense: 'network',
  reading: {
    llm: {
      connected: true,
      url: 'http://192.168.4.79:1234/v1',
      latencyMs: 85,
      model: 'qwen2.5-coder-32b',
      lastCall: '2024-12-24T01:04:55.000Z',
      callsThisSession: 47,
      tokensIn: 125000,
      tokensOut: 45000
    },
    internet: {
      reachable: true,           // optional ping check
      latencyMs: 25
    }
  },
  salience: 0.3  // higher on connection issues
}
```

### 7. User Presence Sense (Social)
Awareness of user engagement.

```javascript
{
  sense: 'user',
  reading: {
    isIdle: false,
    idleDuration: 0,
    lastInputTime: '2024-12-24T01:04:45.000Z',
    inputsThisSession: 23,
    avgInputInterval: 120000,    // ms between messages
    recentInputRate: 0.8,        // relative to average
    engagement: 'high',          // low/medium/high
    conversationTurns: 47,
    avgResponseLength: 350,      // user message chars
  },
  salience: 0.4  // higher on idle or engagement changes
}
```

## Sense Configuration

Each sense has configurable parameters:

```javascript
class Sense {
  constructor(options) {
    this.name = options.name;
    this.focus = options.focus || null;      // Where to look
    this.aperture = options.aperture || 'medium';  // narrow/medium/wide
    this.refreshRate = options.refreshRate || 5000;  // ms
    this.salienceThreshold = options.salienceThreshold || 0.3;
    this.enabled = options.enabled !== false;
  }
  
  read() { /* Returns reading */ }
  setFocus(target) { /* Redirect attention */ }
  setAperture(level) { /* Adjust scope */ }
}
```

## Salience Computation

Each sense computes salience based on:
1. **Deviation from baseline**: Unusual readings score higher
2. **Rate of change**: Rapid changes score higher  
3. **Relevance to current context**: Related to active goals/topics
4. **Anomaly detection**: Unexpected patterns

```javascript
computeSalience(reading, baseline) {
  const deviation = this.measureDeviation(reading, baseline);
  const rateOfChange = this.measureChangeRate(reading);
  const contextRelevance = this.measureRelevance(reading);
  const anomalyScore = this.detectAnomalies(reading);
  
  return Math.min(1, (deviation * 0.3 + rateOfChange * 0.3 + 
                      contextRelevance * 0.2 + anomalyScore * 0.2));
}
```

## Anomaly Detection

The sensory system maintains baselines and flags anomalies:

```javascript
{
  anomalies: [
    { sense: 'filesystem', type: 'change', message: 'New file: config.json', salience: 0.8 },
    { sense: 'process', type: 'threshold', message: 'Memory usage > 80%', salience: 0.9 },
    { sense: 'user', type: 'pattern', message: 'Unusually long idle period', salience: 0.6 },
    { sense: 'git', type: 'state', message: 'Uncommitted changes for 2 hours', salience: 0.5 }
  ]
}
```

## System Prompt Injection Format

On each turn, sense data is formatted and injected:

```markdown
## Current Senses

**Time**: Mon Dec 23 17:05 PST | Session: 1h 5m | Idle: 45s
**Self**: C=0.72 H=0.45 | Memory: 32% | Goals: 2 active | SMF: identity-dominant
**Env**: ./apps/sentient (25 files) | Recent: index.js (5m ago)
**Git**: main +2 | Modified: index.js | Staged: senses.js
**System**: Heap 48MB/128MB | Uptime 1h 5m
**Network**: LLM ✓ 85ms | 47 calls, 170k tokens
**User**: Active | High engagement | 23 inputs this session

⚠️ Git: uncommitted changes for 2 hours
```

## Focus Commands

The agent can direct sensory attention via commands:

| Command | Effect |
|---------|--------|
| `/focus filesystem ./src` | Change FS sense focus directory |
| `/focus git /other/repo` | Change Git sense focus repository |
| `/aperture filesystem wide` | Expand FS sense to recursive |
| `/aperture filesystem narrow` | Narrow FS sense to single directory |
| `/sense refresh` | Force immediate re-read of all senses |
| `/sense disable network` | Disable network sense |
| `/sense enable network` | Re-enable network sense |

## Integration Points

### 1. SentientObserver Integration
```javascript
class SentientObserver {
  constructor(backend, options) {
    // ... existing ...
    this.senses = new SensorySystem({
      basePath: process.cwd(),
      refreshRate: 5000
    });
  }
  
  getSenseReading() {
    return this.senses.read();
  }
  
  getSensePromptBlock() {
    return this.senses.formatForPrompt();
  }
}
```

### 2. Chat Stream Integration
```javascript
async *streamChat(message, options) {
  // Get current sense reading
  const senses = this.observer.getSensePromptBlock();
  
  // Inject into system prompt
  const enhancedSystemPrompt = this.systemPrompt + '\n\n' + senses;
  
  // ... rest of chat logic ...
}
```

### 3. Moment Integration
Sense readings are captured with each experiential moment:

```javascript
class TemporalLayer {
  createMoment() {
    return {
      // ... existing moment data ...
      senses: this.observer.senses.read()
    };
  }
}
```

## File Structure

```
apps/sentient/lib/
├── senses/
│   ├── index.js          # SensorySystem orchestrator
│   ├── base.js           # Base Sense class
│   ├── chrono.js         # Chronosense
│   ├── proprio.js        # Proprioceptive sense
│   ├── filesystem.js     # Filesystem sense
│   ├── git.js            # Git sense
│   ├── process.js        # Process sense
│   ├── network.js        # Network sense
│   └── user.js           # User presence sense
```

## Implementation Priority

1. **Core framework**: SensorySystem, base Sense class
2. **Essential senses**: Chrono, Proprio, Filesystem
3. **Extended senses**: Git, Process, Network, User
4. **Integration**: Prompt injection, focus commands
5. **Polish**: Anomaly detection, baseline tracking

## Performance Considerations

- Senses read on demand, not continuously polling
- Heavy operations (git status, dir scan) cached with TTL
- Salience filtering reduces prompt bloat
- Aperture control limits scope of expensive operations