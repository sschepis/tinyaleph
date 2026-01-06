/**
 * @example LLM Integration
 * @description Combine TinyAleph with LLM APIs for enhanced AI
 * 
 * This example shows how to integrate TinyAleph with Large Language Models:
 * - Pre-process inputs with prime embeddings
 * - Post-process LLM outputs for verification
 * - Use semantic memory for context management
 * - Hybrid reasoning with symbolic + neural
 * 
 * NOTE: This example simulates LLM responses. In production, replace
 * the simulateLLM function with actual API calls (OpenAI, Anthropic, etc.)
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// Simulated LLM for demonstration (replace with real API)
function simulateLLM(prompt) {
    const lower = prompt.toLowerCase();
    
    // Extract just the new question (after "New question:" if present)
    const hasContext = lower.includes('relevant context');
    const newQuestionMatch = prompt.match(/New question:\s*(.+)/is);
    const question = newQuestionMatch
        ? newQuestionMatch[1].toLowerCase().trim()
        : lower;
    
    // Summarization - check first since it's most specific
    if (question.includes('summarize') || question.includes('key points')) {
        if (hasContext) {
            return 'To summarize our AI discussion: (1) Machine learning enables systems to learn from data automatically, (2) Deep learning extends this with multi-layered neural networks for complex pattern recognition, (3) Both are subsets of AI that are transforming industries through data-driven decision making.';
        }
        return 'Key AI concepts: autonomous learning, pattern recognition, and data-driven decision making.';
    }
    
    // Deep learning comparison (with context awareness)
    if (question.includes('deep learning') || question.includes('compare')) {
        if (hasContext) {
            return 'Building on the previous discussion of machine learning, deep learning is a specialized subset that uses neural networks with many layers (hence "deep"). While classical ML algorithms like decision trees work well with smaller datasets, deep learning excels at processing unstructured data like images and text at scale.';
        }
        return 'Deep learning uses multi-layered neural networks to progressively extract higher-level features from raw input, enabling automatic feature learning without manual engineering.';
    }
    
    // Machine learning explanation
    if (question.includes('machine learning') && question.includes('explain')) {
        return 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves.';
    }
    
    // Neural networks
    if (question.includes('neural network')) {
        return 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers that process information using connectionist approaches to computation.';
    }
    
    // Ethics
    if (question.includes('ethics') || question.includes('ethical')) {
        return 'AI ethics encompasses fairness, transparency, privacy, and accountability. Key concerns include algorithmic bias, job displacement, and ensuring AI systems align with human values.';
    }
    
    // Default
    return 'I can help explain AI concepts, compare technologies, or summarize information. What would you like to know?';
}

// ===========================================
// SEMANTIC CONTEXT MANAGER
// ===========================================

class SemanticContextManager {
    constructor(backend, maxContext = 10) {
        this.backend = backend;
        this.maxContext = maxContext;
        this.history = [];
    }

    // Compute similarity
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Add exchange to history
    addExchange(query, response) {
        const queryEmbed = this.backend.textToOrderedState(query);
        const responseEmbed = this.backend.textToOrderedState(response);
        
        this.history.push({
            query,
            response,
            queryEmbed,
            responseEmbed,
            timestamp: Date.now()
        });

        // Trim to max context
        if (this.history.length > this.maxContext) {
            this.history = this.history.slice(-this.maxContext);
        }
    }

    // Get relevant context for a new query
    getRelevantContext(query, topK = 3) {
        const queryEmbed = this.backend.textToOrderedState(query);
        
        const scored = this.history.map(h => ({
            ...h,
            relevance: this.similarity(queryEmbed, h.queryEmbed)
        }));

        scored.sort((a, b) => b.relevance - a.relevance);
        return scored.slice(0, topK);
    }

    // Build context string for LLM
    buildContextString(query) {
        const relevant = this.getRelevantContext(query);
        if (relevant.length === 0) return '';

        const contextParts = relevant.map(h => 
            `Previous Q: ${h.query}\nPrevious A: ${h.response}`
        );

        return 'Relevant context from conversation:\n' + contextParts.join('\n\n');
    }
}

// ===========================================
// RESPONSE VERIFIER
// ===========================================

class ResponseVerifier {
    constructor(backend) {
        this.backend = backend;
        this.knownFacts = new Map();
    }

    // Compute similarity
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Add known facts for verification
    addFact(statement, confidence = 1.0) {
        this.knownFacts.set(statement, {
            embedding: this.backend.textToOrderedState(statement),
            confidence
        });
    }

    // Check if response aligns with known facts
    verify(response) {
        const responseEmbed = this.backend.textToOrderedState(response);
        
        let maxAlignment = 0;
        let mostRelated = null;

        for (const [statement, fact] of this.knownFacts) {
            const sim = this.similarity(responseEmbed, fact.embedding);
            if (sim > maxAlignment) {
                maxAlignment = sim;
                mostRelated = { statement, confidence: fact.confidence };
            }
        }

        return {
            alignment: maxAlignment,
            relatedFact: mostRelated,
            verified: maxAlignment > 0.7
        };
    }
}

// ===========================================
// LLM WRAPPER WITH TINYALEPH
// ===========================================

class EnhancedLLM {
    constructor(backend, llmFunction) {
        this.backend = backend;
        this.llm = llmFunction;
        this.context = new SemanticContextManager(backend);
        this.verifier = new ResponseVerifier(backend);
    }

    // Query with semantic enhancement
    query(userQuery) {
        // 1. Build context from relevant history
        const contextStr = this.context.buildContextString(userQuery);
        
        // 2. Create enhanced prompt
        const enhancedPrompt = contextStr 
            ? `${contextStr}\n\nNew question: ${userQuery}`
            : userQuery;

        // 3. Get LLM response
        const response = this.llm(enhancedPrompt);

        // 4. Verify response
        const verification = this.verifier.verify(response);

        // 5. Store in context
        this.context.addExchange(userQuery, response);

        return {
            response,
            verification,
            contextUsed: contextStr.length > 0
        };
    }

    // Add knowledge for verification
    addKnowledge(facts) {
        for (const fact of facts) {
            this.verifier.addFact(fact);
        }
    }
}

// ===========================================
// EXAMPLE USAGE
// ===========================================

console.log('TinyAleph LLM Integration Example');
console.log('==================================\n');

const enhancedLLM = new EnhancedLLM(backend, simulateLLM);

// Add some known facts for verification
enhancedLLM.addKnowledge([
    'Machine learning is a type of artificial intelligence',
    'Deep learning uses neural networks',
    'AI systems can learn from data',
    'Ethics in AI is an important consideration'
]);

console.log('Added knowledge base for verification.\n');

// ===========================================
// CONVERSATION WITH CONTEXT
// ===========================================

console.log('==================================');
console.log('Conversation with Semantic Context:');
console.log('==================================\n');

const queries = [
    'Please explain what machine learning is',
    'How does deep learning compare to traditional machine learning?',
    'Can you summarize the key points from our AI discussion?'
];

for (const query of queries) {
    console.log(`User: ${query}`);
    const result = enhancedLLM.query(query);
    console.log(`Assistant: ${result.response}`);
    console.log(`  [Context used: ${result.contextUsed ? 'YES' : 'NO'}]`);
    console.log(`  [Verification: ${result.verification.verified ? '✓ ALIGNED' : '? UNCERTAIN'}]`);
    if (result.verification.relatedFact) {
        console.log(`  [Related to: "${result.verification.relatedFact.statement.substring(0, 40)}..."]`);
    }
    console.log();
}

// ===========================================
// SEMANTIC PROMPT ENGINEERING
// ===========================================

console.log('==================================');
console.log('Semantic Prompt Engineering:');
console.log('==================================\n');

// Generate semantically-grounded prompts
function generateSemanticPrompt(topic, style) {
    const topicEmbed = backend.textToOrderedState(topic);
    const styleEmbed = backend.textToOrderedState(style);
    
    // Combine embeddings for prompt guidance
    const combined = Hypercomplex.zero(16);
    for (let i = 0; i < 16; i++) {
        combined.c[i] = (topicEmbed.c[i] + styleEmbed.c[i]) / 2;
    }
    
    // Use magnitude as complexity hint
    const complexity = combined.norm();
    
    return {
        topic,
        style,
        suggestedLength: complexity > 1 ? 'detailed' : 'concise',
        embedding: combined
    };
}

const prompts = [
    generateSemanticPrompt('quantum computing basics', 'beginner-friendly'),
    generateSemanticPrompt('neural network architecture', 'technical deep-dive'),
    generateSemanticPrompt('AI ethics', 'philosophical discussion')
];

for (const prompt of prompts) {
    console.log(`Topic: ${prompt.topic}`);
    console.log(`Style: ${prompt.style}`);
    console.log(`Suggested length: ${prompt.suggestedLength}`);
    console.log();
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('==================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Use SemanticContextManager for relevant history retrieval');
console.log('2. ResponseVerifier checks LLM outputs against known facts');
console.log('3. Prime embeddings provide deterministic semantic grounding');
console.log('4. Combine with real LLM APIs (OpenAI, Anthropic, etc.)');
console.log('5. Semantic prompts guide LLM behavior consistently');
console.log('6. Build hybrid systems: symbolic reasoning + neural generation');