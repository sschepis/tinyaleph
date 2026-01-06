# AI & Machine Learning Examples

This directory contains examples demonstrating how to use TinyAleph for AI and machine learning applications.

## Examples Overview

| # | File | Description |
|---|------|-------------|
| 01 | [`01-embeddings.js`](./01-embeddings.js) | Generate prime-based embeddings for text and concepts |
| 02 | [`02-semantic-memory.js`](./02-semantic-memory.js) | Build long-term semantic memory for AI agents |
| 03 | [`03-reasoning.js`](./03-reasoning.js) | Multi-step inference chains with transforms |
| 04 | [`04-knowledge-graph.js`](./04-knowledge-graph.js) | Build and query prime-based knowledge graphs |
| 05 | [`05-llm-integration.js`](./05-llm-integration.js) | Integrate TinyAleph with Large Language Models |
| 06 | [`06-agent.js`](./06-agent.js) | Build a goal-directed reasoning agent |
| 07 | [`07-hybrid-ai.js`](./07-hybrid-ai.js) | Combine symbolic primes with neural embeddings |
| 08 | [`08-entropy-reasoning.js`](./08-entropy-reasoning.js) | Use entropy minimization for inference |
| 09 | [`09-concept-learning.js`](./09-concept-learning.js) | Learn new concepts from examples (few-shot) |
| 10 | [`10-prompt-primes.js`](./10-prompt-primes.js) | Prime-based prompt engineering |
| 11 | [`11-rag.js`](./11-rag.js) | Retrieval Augmented Generation pipeline |
| 12 | [`12-neuro-symbolic.js`](./12-neuro-symbolic.js) | Bridge neural and symbolic representations |

## Running Examples

```bash
# Run any example
node examples/ai/01-embeddings.js

# Or from this directory
cd examples/ai
node 01-embeddings.js
```

## Key Concepts

### Prime Embeddings vs Neural Embeddings

TinyAleph's prime-based embeddings offer unique advantages:

| Feature | Prime Embeddings | Neural Embeddings |
|---------|------------------|-------------------|
| Deterministic | ✓ Always same output | ✗ Varies with model |
| Interpretable | ✓ Based on prime structure | ✗ Black box |
| Order-sensitive | ✓ Non-commutative algebra | △ Context window |
| Training required | ✗ No training needed | ✓ Requires large data |

### When to Use TinyAleph for AI

- **Semantic Memory**: Store and retrieve by meaning
- **Reasoning**: Build inference chains with confidence tracking
- **Grounding**: Anchor neural outputs to symbolic knowledge
- **Verification**: Check LLM outputs against known facts
- **Hybrid Systems**: Combine symbolic precision with neural flexibility

## Architecture Patterns

### 1. Memory-Augmented Agent
```javascript
const memory = new SemanticMemory(aleph);
const agent = new SemanticAgent(aleph, 'MyAgent');
// Agent uses memory for context
```

### 2. RAG Pipeline
```javascript
const store = new DocumentStore(aleph);
const rag = new RAGPipeline(store);
const result = rag.query('your question');
```

### 3. Hybrid Reasoning
```javascript
const hybrid = new HybridEmbedding(aleph, { symbolicWeight: 0.6 });
const embedding = hybrid.getHybrid('concept');
```

## See Also

- [Quickstart Examples](../) - Get started in 3 minutes
- [Semantic Examples](../semantic/) - NLP and text processing
- [Advanced Examples](../advanced/) - Custom backends and transforms