/**
 * @example Semantic Memory
 * @description Long-term memory for AI agents using prime embeddings
 * 
 * This example shows how to build a semantic memory system that:
 * - Stores experiences/facts with timestamps
 * - Retrieves by semantic similarity (not just keywords)
 * - Supports memory decay and consolidation
 * - Maintains associative connections between memories
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// SEMANTIC MEMORY CLASS
// ===========================================

class SemanticMemory {
    constructor(backend, options = {}) {
        this.backend = backend;
        this.memories = [];
        this.decayRate = options.decayRate || 0.01;
        this.similarityThreshold = options.similarityThreshold || 0.7;
    }

    // Store a new memory
    store(content, metadata = {}) {
        const embedding = this.backend.textToOrderedState(content);
        const memory = {
            id: Date.now() + Math.random(),
            content,
            embedding,
            timestamp: Date.now(),
            accessCount: 0,
            strength: 1.0,
            metadata
        };
        this.memories.push(memory);
        return memory.id;
    }

    // Compute cosine similarity
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Retrieve memories by semantic query
    recall(query, topK = 5) {
        const queryEmbedding = this.backend.textToOrderedState(query);
        
        // Score all memories
        const scored = this.memories.map(mem => ({
            memory: mem,
            score: this.similarity(queryEmbedding, mem.embedding) * mem.strength
        }));

        // Sort by score, return top K
        scored.sort((a, b) => b.score - a.score);
        const results = scored.slice(0, topK);

        // Update access counts (strengthens recalled memories)
        for (const { memory } of results) {
            memory.accessCount++;
            memory.strength = Math.min(2.0, memory.strength * 1.1);
        }

        return results;
    }

    // Find associated memories (memories that are similar to each other)
    findAssociations(memoryId, topK = 3) {
        const target = this.memories.find(m => m.id === memoryId);
        if (!target) return [];

        const scored = this.memories
            .filter(m => m.id !== memoryId)
            .map(mem => ({
                memory: mem,
                score: this.similarity(target.embedding, mem.embedding)
            }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    // Apply memory decay (forgetting)
    decay() {
        const now = Date.now();
        for (const memory of this.memories) {
            const age = (now - memory.timestamp) / 1000 / 60; // Age in minutes
            memory.strength *= Math.exp(-this.decayRate * age / (memory.accessCount + 1));
        }
        // Remove very weak memories
        this.memories = this.memories.filter(m => m.strength > 0.1);
    }

    // Consolidate similar memories
    consolidate() {
        const consolidated = [];
        const merged = new Set();

        for (let i = 0; i < this.memories.length; i++) {
            if (merged.has(i)) continue;

            const similar = [];
            for (let j = i + 1; j < this.memories.length; j++) {
                if (merged.has(j)) continue;
                const sim = this.similarity(
                    this.memories[i].embedding,
                    this.memories[j].embedding
                );
                if (sim > this.similarityThreshold) {
                    similar.push(j);
                    merged.add(j);
                }
            }

            if (similar.length > 0) {
                // Merge similar memories
                const contents = [this.memories[i].content];
                for (const j of similar) {
                    contents.push(this.memories[j].content);
                }
                const mergedContent = `[Consolidated: ${contents.join(' | ')}]`;
                const mergedEmbedding = this.backend.textToOrderedState(mergedContent);
                consolidated.push({
                    ...this.memories[i],
                    content: mergedContent,
                    embedding: mergedEmbedding,
                    strength: this.memories[i].strength * 1.5
                });
            } else {
                consolidated.push(this.memories[i]);
            }
        }

        this.memories = consolidated;
    }

    // Get memory stats
    stats() {
        return {
            total: this.memories.length,
            avgStrength: this.memories.reduce((s, m) => s + m.strength, 0) / (this.memories.length || 1),
            oldestAge: this.memories.length > 0 
                ? (Date.now() - Math.min(...this.memories.map(m => m.timestamp))) / 1000
                : 0
        };
    }
}

// ===========================================
// EXAMPLE USAGE
// ===========================================

console.log('TinyAleph Semantic Memory Example');
console.log('==================================\n');

const memory = new SemanticMemory(backend);

// Store some experiences
console.log('Storing memories...');
memory.store('The user asked about machine learning algorithms', { type: 'conversation' });
memory.store('We discussed neural networks and deep learning', { type: 'conversation' });
memory.store('The user is interested in AI applications', { type: 'preference' });
memory.store('Last meeting was about natural language processing', { type: 'event' });
memory.store('The user mentioned working on a chatbot project', { type: 'project' });
memory.store('We talked about weather and weekend plans', { type: 'casual' });

console.log(`Stored ${memory.stats().total} memories\n`);

// ===========================================
// SEMANTIC RECALL
// ===========================================

console.log('==================================');
console.log('Semantic Recall:');
console.log('==================================\n');

const query = 'artificial intelligence topics';
console.log(`Query: "${query}"\n`);

const recalled = memory.recall(query, 3);
for (const { memory: mem, score } of recalled) {
    console.log(`  [${score.toFixed(3)}] ${mem.content.substring(0, 50)}...`);
}

// ===========================================
// ASSOCIATIVE MEMORY
// ===========================================

console.log('\n==================================');
console.log('Associative Recall:');
console.log('==================================\n');

const mlMemory = memory.memories.find(m => m.content.includes('machine learning'));
console.log(`Finding associations for: "${mlMemory.content.substring(0, 40)}..."\n`);

const associations = memory.findAssociations(mlMemory.id, 3);
for (const { memory: mem, score } of associations) {
    console.log(`  [${score.toFixed(3)}] ${mem.content.substring(0, 50)}...`);
}

// ===========================================
// MEMORY CONSOLIDATION
// ===========================================

console.log('\n==================================');
console.log('Memory Consolidation:');
console.log('==================================\n');

// Add some similar memories
memory.store('Neural networks are a key AI technique', { type: 'fact' });
memory.store('Deep learning uses neural network architectures', { type: 'fact' });

console.log(`Before consolidation: ${memory.stats().total} memories`);
memory.consolidate();
console.log(`After consolidation: ${memory.stats().total} memories`);

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n==================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Semantic memory retrieves by meaning, not keywords');
console.log('2. Memory strength increases with access (spaced repetition)');
console.log('3. Decay removes unused memories over time');
console.log('4. Consolidation merges similar memories');
console.log('5. Associations reveal hidden connections');
console.log('6. Use this for chatbots, agents, and knowledge systems');