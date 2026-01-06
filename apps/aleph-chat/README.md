# AlephChat

A hybrid LLM/TinyAleph chat client with semantic memory and transparent learning.

## Features

- **Semantic Core**: TinyAleph-powered hypercomplex embeddings for semantic processing
- **Vocabulary Learning**: Automatically learns new words with prime encodings
- **Style Profiling**: Adapts to your communication style over time
- **Topic Tracking**: Maintains conversation context and detects topic shifts
- **Concept Graph**: Builds a knowledge graph from conversations
- **Multi-tier Memory**: Immediate buffer, session memory, and persistent storage
- **LMStudio Integration**: Works with any local LLM via LMStudio

## Requirements

- Node.js 14+
- LMStudio with a model loaded and local server enabled

## Quick Start

```bash
# From the tinyaleph root directory
npm run aleph-chat

# Or directly
node apps/aleph-chat/index.js
```

## Usage

### Starting a Chat

```bash
# Default (localhost:1234)
node apps/aleph-chat/index.js

# Custom LMStudio URL
node apps/aleph-chat/index.js --url http://192.168.1.10:1234/v1

# Custom data directory
node apps/aleph-chat/index.js --data ./my-data
```

### Commands

| Command | Description |
|---------|-------------|
| `/status` | Show session statistics |
| `/topics` | List current conversation topics |
| `/vocab` | Show vocabulary statistics |
| `/style` | Display style profile |
| `/concepts <word>` | Query concept graph |
| `/similar <word>` | Find similar words |
| `/forget <word>` | Remove word from vocabulary |
| `/save` | Save all data |
| `/clear` | Clear session (keep learned data) |
| `/reset` | Reset everything |
| `/help` | Show help |
| `/quit` | Exit and save |

## Example Session

```
╔═══════════════════════════════════════════════════════╗
║                    🌟 AlephChat                       ║
║      Semantic LLM Chat with TinyAleph Learning        ║
╚═══════════════════════════════════════════════════════╝

Connecting to LMStudio at http://localhost:1234/v1...
✓ Connected to LMStudio
  Model: mistral-7b-instruct
  Vocabulary: 1,247 words

You: What is machine learning?
  📚 Learned: "machine"
  🎯 New topic: machine learning

Aleph: Machine learning is a subset of artificial intelligence that 
enables systems to learn from data...
  [Coherence: 87%]

You: /status

📊 Session Status
────────────────────────────────────
  Model:         mistral-7b-instruct
  Duration:      5m 23s
  Exchanges:     3
  Words learned: 5 (session) / 1,252 (total)
  Topics:        2 active
  Concepts:      47 nodes, 89 edges
  Memory:        3 indexed, 3 in buffer

You: /quit

Saving session...
✓ Session saved
  3 exchanges, 5 new words

👋 Goodbye!
```

## How It Works

### Transparent Learning

1. **New Words**: When you use words not in the vocabulary, AlephChat automatically learns them with TinyAleph's prime encoding
2. **Style Profiling**: Your communication patterns (length, formality, technical level) are tracked over time
3. **Concept Extraction**: Key concepts are extracted and connected in a knowledge graph
4. **Topic Tracking**: Conversation topics are detected and maintained for context

### Context Enhancement

Before each LLM call, AlephChat:

1. Retrieves semantically similar past exchanges
2. Injects relevant topic context
3. Adds style hints to match your preferences
4. Includes related concepts from the knowledge graph

### Response Processing

After each LLM response, AlephChat:

1. Checks semantic coherence with your query
2. Extracts new vocabulary
3. Updates the concept graph
4. Refines your style profile

## Configuration

Create `aleph-chat.config.js` for custom settings:

```javascript
module.exports = {
    lmstudioUrl: 'http://localhost:1234/v1',
    model: 'local-model',
    temperature: 0.7,
    maxTokens: 2048,
    
    dataPath: './data',
    dimension: 16,
    learningRate: 0.1,
    coherenceThreshold: 0.6,
    
    includeStyle: true,
    includeTopics: true,
    includeConcepts: true
};
```

## Data Storage

AlephChat stores learned data in the `data/` directory:

- `vocabulary.json` - Learned words with prime encodings
- `style-profile.json` - Your communication style
- `concepts.json` - Concept knowledge graph
- `memory.json` - Notable exchanges and summaries

## API Usage

You can also use AlephChat programmatically:

```javascript
const { AlephChat } = require('./lib/chat');

const chat = new AlephChat({
    lmstudioUrl: 'http://localhost:1234/v1',
    dataPath: './data',
    onNewWord: (word) => console.log(`Learned: ${word}`),
    onTopicChange: (update) => console.log(`Topic: ${update.matchedTopic}`)
});

await chat.connect();

const result = await chat.chat('What is quantum computing?');
console.log(result.response);
console.log('Coherence:', result.metadata.coherence);
console.log('New words:', result.metadata.newWords);

// Streaming
for await (const chunk of chat.streamChat('Explain neural networks')) {
    process.stdout.write(chunk);
}

// Get stats
console.log(chat.getStats());

// Save and exit
chat.endSession();
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AlephChat                            │
├─────────────────────────────────────────────────────────┤
│  AlephSemanticCore                                       │
│  ├── VocabularyManager (prime encoding, learning)        │
│  ├── StyleProfiler (communication patterns)              │
│  ├── TopicTracker (conversation context)                 │
│  ├── ConceptGraph (knowledge relationships)              │
│  └── ContextMemory (multi-tier storage)                  │
├─────────────────────────────────────────────────────────┤
│  PromptEnhancer → LMStudioClient → ResponseProcessor     │
└─────────────────────────────────────────────────────────┘
```

## License

MIT - See the main TinyAleph LICENSE file.