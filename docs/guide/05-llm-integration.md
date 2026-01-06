# LLM Integration

This guide covers coupling Aleph with Large Language Models for enhanced reasoning, entropy minimization, and bidirectional semantic grounding.

## Overview

Aleph provides a **Resonant Field Interface (RFI)** for LLM integration. The key insight: LLMs generate tokens probabilistically, while Aleph provides deterministic semantic anchors. Coupling these systems enables:

- **Entropy-bounded generation**: Prevent hallucination by constraining output entropy
- **Semantic validation**: Verify LLM outputs against prime-semantic ground truth
- **Concept grounding**: Translate between natural language and formal meaning
- **Coherent reasoning**: Guide multi-step inference through entropy minimization

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Coupled System                              │
│                                                                 │
│  ┌─────────────┐     Resonant Field      ┌─────────────────┐   │
│  │             │ ←─────────────────────→ │                 │   │
│  │     LLM     │   (Bidirectional)       │     Aleph       │   │
│  │             │                         │                 │   │
│  └──────┬──────┘                         └────────┬────────┘   │
│         │                                         │             │
│         ↓                                         ↓             │
│   Token Stream                              Prime Field         │
│   (Probabilistic)                          (Deterministic)      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Coupling Layer                         │   │
│  │                                                          │   │
│  │  • Entropy Monitor     • Semantic Validator              │   │
│  │  • Field Projection    • Collapse Trigger                │   │
│  │  • Token→Prime Map     • Prime→Token Generation          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Basic Coupling

### Creating the Coupled System

```javascript
const { createEngine } = require('./modular');
const { LLMCoupling } = require('./core/llm');

// Create Aleph engine
const config = require('./data.json');
const engine = createEngine('semantic', config);

// Create coupling layer
const coupling = new LLMCoupling(engine, {
  entropyThreshold: 0.3,    // Max allowed entropy
  coherenceThreshold: 0.7,  // Min required coherence
  collapseRate: 0.8         // Collapse strength
});

// Connect to LLM (example with OpenAI-compatible API)
coupling.connectLLM({
  endpoint: 'http://localhost:8080/v1/chat/completions',
  model: 'local-model'
});
```

### Simple Query Processing

```javascript
// Process a query through the coupled system
async function processQuery(query) {
  // 1. Encode query to prime field
  const queryField = coupling.encodeToField(query);
  
  // 2. Get LLM response
  const llmResponse = await coupling.queryLLM(query);
  
  // 3. Validate response against field
  const validation = coupling.validateResponse(llmResponse, queryField);
  
  if (validation.coherent) {
    return llmResponse;
  } else {
    // Re-query with tighter constraints
    return coupling.constrainedQuery(query, queryField);
  }
}

const result = await processQuery('What is the relationship between truth and wisdom?');
console.log(result);
```

---

## Entropy-Bounded Generation

### Monitoring Token Entropy

```javascript
// Track entropy during generation
class EntropyMonitor {
  constructor(coupling, threshold) {
    this.coupling = coupling;
    this.threshold = threshold;
    this.history = [];
  }
  
  processToken(token, context) {
    // Encode token to field
    const tokenField = this.coupling.encodeToField(token);
    
    // Calculate contextual entropy
    const entropy = tokenField.entropy();
    this.history.push({ token, entropy });
    
    if (entropy > this.threshold) {
      return { 
        accept: false, 
        reason: 'entropy_exceeded',
        entropy 
      };
    }
    
    return { accept: true, entropy };
  }
  
  getAverageEntropy() {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, h) => sum + h.entropy, 0) / this.history.length;
  }
}

const monitor = new EntropyMonitor(coupling, 0.5);
```

### Constrained Generation

```javascript
// Generate with entropy constraints
async function constrainedGenerate(prompt, coupling, maxEntropy) {
  const tokens = [];
  let context = prompt;
  
  while (true) {
    // Get next token candidates from LLM
    const candidates = await coupling.getTokenCandidates(context, 10);
    
    // Score candidates by entropy
    const scored = candidates.map(token => ({
      token,
      entropy: coupling.encodeToField(token).entropy()
    }));
    
    // Select lowest entropy token that makes sense
    scored.sort((a, b) => a.entropy - b.entropy);
    
    for (const candidate of scored) {
      if (candidate.entropy <= maxEntropy) {
        tokens.push(candidate.token);
        context += candidate.token;
        break;
      }
    }
    
    // Check for completion
    if (tokens[tokens.length - 1] === '</end>') break;
    if (tokens.length > 100) break;
  }
  
  return tokens.join(' ');
}
```

---

## Semantic Validation

### Coherence Checking

```javascript
// Validate LLM output against semantic expectations
function validateCoherence(response, expectedConcepts, coupling) {
  const responseField = coupling.encodeToField(response);
  
  const coherenceScores = expectedConcepts.map(concept => ({
    concept,
    coherence: responseField.coherence(coupling.encodeToField(concept))
  }));
  
  const avgCoherence = coherenceScores.reduce((s, c) => s + c.coherence, 0) 
                       / coherenceScores.length;
  
  return {
    valid: avgCoherence >= coupling.coherenceThreshold,
    avgCoherence,
    scores: coherenceScores
  };
}

// Example usage
const response = await coupling.queryLLM('Define wisdom');
const validation = validateCoherence(
  response, 
  ['knowledge', 'understanding', 'experience'],
  coupling
);

console.log('Coherence check:', validation);
```

### Contradiction Detection

```javascript
// Check for internal contradictions in response
function detectContradictions(response, coupling) {
  const sentences = response.split(/[.!?]+/).filter(s => s.trim());
  const contradictions = [];
  
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const field1 = coupling.encodeToField(sentences[i]);
      const field2 = coupling.encodeToField(sentences[j]);
      
      // Check for zero-divisor relationship (contradiction)
      if (field1.isZeroDivisorWith(field2)) {
        contradictions.push({
          sentence1: sentences[i],
          sentence2: sentences[j],
          type: 'zero-divisor'
        });
      }
      
      // Check for very low coherence (semantic opposition)
      const coherence = field1.coherence(field2);
      if (coherence < 0.1) {
        contradictions.push({
          sentence1: sentences[i],
          sentence2: sentences[j],
          type: 'low-coherence',
          coherence
        });
      }
    }
  }
  
  return contradictions;
}
```

---

## Guided Reasoning

### Step-by-Step Reasoning

```javascript
// Guide LLM through reasoning steps with entropy minimization
async function guidedReasoning(question, coupling) {
  const steps = [];
  let currentField = coupling.encodeToField(question);
  let currentEntropy = currentField.entropy();
  
  while (currentEntropy > 0.1) {
    // Ask LLM for next reasoning step
    const stepPrompt = `
      Current understanding: ${steps.map(s => s.text).join(' ')}
      Question: ${question}
      What is the next logical step toward an answer?
    `;
    
    const stepResponse = await coupling.queryLLM(stepPrompt);
    const stepField = coupling.encodeToField(stepResponse);
    const newEntropy = stepField.entropy();
    
    // Only accept if entropy decreases
    if (newEntropy < currentEntropy) {
      steps.push({
        text: stepResponse,
        entropy: newEntropy,
        drop: currentEntropy - newEntropy
      });
      
      currentField = stepField;
      currentEntropy = newEntropy;
    } else {
      // Entropy increased - try again with constraint
      const constrained = await coupling.constrainedQuery(stepPrompt, currentField);
      const constrainedField = coupling.encodeToField(constrained);
      
      if (constrainedField.entropy() < currentEntropy) {
        steps.push({
          text: constrained,
          entropy: constrainedField.entropy(),
          drop: currentEntropy - constrainedField.entropy()
        });
        
        currentField = constrainedField;
        currentEntropy = constrainedField.entropy();
      }
    }
    
    // Prevent infinite loops
    if (steps.length > 10) break;
  }
  
  return {
    question,
    steps,
    finalEntropy: currentEntropy,
    converged: currentEntropy <= 0.1
  };
}
```

### Concept Navigation

```javascript
// Navigate concept space with LLM guidance
async function navigateConcepts(startConcept, targetConcept, coupling) {
  const path = [startConcept];
  let current = coupling.encodeToField(startConcept);
  const target = coupling.encodeToField(targetConcept);
  
  while (current.coherence(target) < 0.9) {
    // Ask LLM for bridge concept
    const prompt = `
      Starting concept: ${path[0]}
      Current position: ${path[path.length - 1]}
      Target concept: ${targetConcept}
      
      What is an intermediate concept that connects ${path[path.length - 1]} closer to ${targetConcept}?
    `;
    
    const bridge = await coupling.queryLLM(prompt);
    const bridgeField = coupling.encodeToField(bridge);
    
    // Check if bridge moves us closer
    if (bridgeField.coherence(target) > current.coherence(target)) {
      path.push(bridge);
      current = bridgeField;
    } else {
      // Dead end - backtrack
      if (path.length > 1) {
        path.pop();
        current = coupling.encodeToField(path[path.length - 1]);
      }
    }
    
    if (path.length > 20) break;  // Prevent infinite loops
  }
  
  return {
    start: startConcept,
    target: targetConcept,
    path,
    finalCoherence: current.coherence(target)
  };
}
```

---

## Bidirectional Translation

### Natural Language to Primes

```javascript
// Convert LLM's natural language to prime encoding
async function naturalToPrimes(text, coupling) {
  // First, use Aleph's tokenizer
  const tokens = coupling.engine.backend.tokenize(text);
  
  // For unknown words, ask LLM to define
  const unknownTokens = tokens.filter(t => !t.known);
  
  for (const token of unknownTokens) {
    const definitionPrompt = `
      Define "${token.word}" using only these fundamental concepts:
      ${coupling.engine.backend.getOntologyTerms().join(', ')}
      
      Be concise, use only 2-3 terms.
    `;
    
    const definition = await coupling.queryLLM(definitionPrompt);
    const defPrimes = coupling.engine.backend.encode(definition);
    
    // Learn the new word
    coupling.engine.backend.learn(token.word, defPrimes);
  }
  
  // Now encode with learned vocabulary
  return coupling.engine.backend.encode(text);
}
```

### Primes to Natural Language

```javascript
// Generate natural language from prime encoding
async function primesToNatural(primes, style, coupling) {
  // Get base decoding
  const baseText = coupling.engine.backend.decode(primes);
  
  // Ask LLM to elaborate
  const prompt = `
    Given these core concepts: ${baseText}
    
    Generate a ${style} explanation that captures this meaning.
    Keep the semantic content intact but make it natural and flowing.
  `;
  
  const elaborated = await coupling.queryLLM(prompt);
  
  // Verify semantic preservation
  const originalField = coupling.engine.backend.primesToState(primes);
  const elaboratedField = coupling.encodeToField(elaborated);
  
  const coherence = originalField.coherence(elaboratedField);
  
  return {
    text: elaborated,
    coherence,
    preserved: coherence > 0.8
  };
}
```

---

## Practical Patterns

### Question Answering with Validation

```javascript
async function validateQA(question, coupling) {
  // Get answer from LLM
  const answer = await coupling.queryLLM(question);
  
  // Encode both
  const questionField = coupling.encodeToField(question);
  const answerField = coupling.encodeToField(answer);
  
  // Calculate relevance
  const relevance = questionField.coherence(answerField);
  
  // Calculate answer entropy
  const answerEntropy = answerField.entropy();
  
  // Check for hallucination signals
  const hallucination = {
    highEntropy: answerEntropy > 0.8,
    lowRelevance: relevance < 0.3,
    contradictions: detectContradictions(answer, coupling)
  };
  
  const isReliable = !hallucination.highEntropy && 
                     !hallucination.lowRelevance && 
                     hallucination.contradictions.length === 0;
  
  return {
    question,
    answer,
    relevance,
    entropy: answerEntropy,
    reliable: isReliable,
    hallucination
  };
}
```

### Iterative Refinement

```javascript
async function iterativeRefinement(task, maxIterations, coupling) {
  let current = await coupling.queryLLM(task);
  let currentField = coupling.encodeToField(current);
  let currentEntropy = currentField.entropy();
  
  const iterations = [{
    text: current,
    entropy: currentEntropy,
    iteration: 0
  }];
  
  for (let i = 1; i <= maxIterations; i++) {
    if (currentEntropy < 0.2) break;  // Good enough
    
    const refinePrompt = `
      Original task: ${task}
      Current response: ${current}
      
      This response has high uncertainty. Please refine it to be:
      - More specific
      - More coherent
      - More focused
      
      Refined response:
    `;
    
    const refined = await coupling.queryLLM(refinePrompt);
    const refinedField = coupling.encodeToField(refined);
    const refinedEntropy = refinedField.entropy();
    
    if (refinedEntropy < currentEntropy) {
      current = refined;
      currentField = refinedField;
      currentEntropy = refinedEntropy;
    }
    
    iterations.push({
      text: current,
      entropy: currentEntropy,
      iteration: i
    });
  }
  
  return {
    task,
    final: current,
    finalEntropy: currentEntropy,
    iterations
  };
}
```

---

## Configuration Options

```javascript
const coupling = new LLMCoupling(engine, {
  // Entropy control
  entropyThreshold: 0.3,      // Max allowed response entropy
  entropyWarning: 0.5,        // Entropy level for warnings
  
  // Coherence settings
  coherenceThreshold: 0.7,    // Min coherence with query
  semanticValidation: true,   // Enable semantic checking
  
  // Collapse behavior
  collapseRate: 0.8,          // How aggressively to collapse states
  collapseOnHighEntropy: true, // Auto-collapse on entropy spike
  
  // Generation control
  maxTokens: 500,             // Max tokens per response
  temperature: 0.7,           // LLM temperature
  topP: 0.9,                  // Nucleus sampling
  
  // Caching
  cacheResponses: true,       // Cache LLM responses
  cacheSemanticFields: true,  // Cache semantic field computations
  
  // Debugging
  logLevel: 'info',           // 'debug', 'info', 'warn', 'error'
  trackMetrics: true          // Record performance metrics
});
```

---

## Next Steps

- [Advanced Topics →](./06-advanced.md)
- [Theory: Resonant Field Interface →](../theory/07-resonant-field-interface.md)
- [Reference: LLMCoupling →](../reference/04-engine.md#llm-coupling)