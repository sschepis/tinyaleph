/**
 * @example Hybrid AI (Symbolic + Neural)
 * @description Combine symbolic primes with neural embeddings
 * 
 * This example shows how to create a hybrid AI system that combines:
 * - TinyAleph's deterministic prime embeddings (symbolic)
 * - Neural embeddings (simulated here, real from transformers)
 * - Best of both: interpretability + flexibility
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// Simulate neural embeddings (in production, use transformers)
function simulateNeuralEmbedding(text, dim = 16) {
    // This simulates a neural embedding by hashing text to floats
    const embedding = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        embedding[i % dim] += Math.sin(charCode * (i + 1) * 0.1);
    }
    // Normalize
    const mag = Math.sqrt(embedding.reduce((s, x) => s + x * x, 0));
    return embedding.map(x => x / (mag || 1));
}

// ===========================================
// HYBRID EMBEDDING SYSTEM
// ===========================================

class HybridEmbedding {
    constructor(backend, options = {}) {
        this.backend = backend;
        this.symbolicWeight = options.symbolicWeight || 0.5;
        this.neuralWeight = 1 - this.symbolicWeight;
    }

    // Get symbolic (prime-based) embedding
    getSymbolic(text) {
        return this.backend.textToOrderedState(text);
    }

    // Get neural embedding (simulated)
    getNeural(text) {
        const components = simulateNeuralEmbedding(text);
        const h = Hypercomplex.zero(16);
        h.c = new Float64Array(components);
        return h;
    }

    // Get hybrid embedding (weighted combination)
    getHybrid(text) {
        const symbolic = this.getSymbolic(text);
        const neural = this.getNeural(text);
        
        const hybrid = Hypercomplex.zero(16);
        for (let i = 0; i < 16; i++) {
            hybrid.c[i] = 
                this.symbolicWeight * symbolic.c[i] +
                this.neuralWeight * neural.c[i];
        }
        
        return {
            hybrid,
            symbolic,
            neural,
            weights: { symbolic: this.symbolicWeight, neural: this.neuralWeight }
        };
    }

    // Compare using hybrid similarity
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Analyze embedding breakdown
    analyze(text1, text2) {
        const emb1 = this.getHybrid(text1);
        const emb2 = this.getHybrid(text2);

        return {
            hybrid: this.similarity(emb1.hybrid, emb2.hybrid),
            symbolic: this.similarity(emb1.symbolic, emb2.symbolic),
            neural: this.similarity(emb1.neural, emb2.neural)
        };
    }
}

// ===========================================
// EXAMPLE: COMPARING APPROACHES
// ===========================================

console.log('TinyAleph Hybrid AI Example');
console.log('===========================\n');

const hybrid = new HybridEmbedding(backend, { symbolicWeight: 0.6 });

// Test pairs
const pairs = [
    ['The cat sat on the mat', 'The dog sat on the rug'],
    ['Machine learning is great', 'Deep learning is awesome'],
    ['The quick brown fox', 'A fast red wolf'],
    ['Hello world', 'Goodbye universe'], // Opposites
];

console.log('Comparing embedding approaches:');
console.log('(Symbolic weight: 60%, Neural weight: 40%)\n');
console.log('─'.repeat(60));

for (const [text1, text2] of pairs) {
    const analysis = hybrid.analyze(text1, text2);
    
    console.log(`\n"${text1}"`);
    console.log(`"${text2}"`);
    console.log(`  Symbolic similarity: ${analysis.symbolic.toFixed(4)}`);
    console.log(`  Neural similarity:   ${analysis.neural.toFixed(4)}`);
    console.log(`  Hybrid similarity:   ${analysis.hybrid.toFixed(4)}`);
}

// ===========================================
// WEIGHT TUNING
// ===========================================

console.log('\n' + '═'.repeat(60));
console.log('Weight Tuning Analysis:');
console.log('═'.repeat(60) + '\n');

const testText1 = 'Artificial intelligence research';
const testText2 = 'AI development work';

console.log(`Text 1: "${testText1}"`);
console.log(`Text 2: "${testText2}"\n`);

const weights = [0.0, 0.25, 0.5, 0.75, 1.0];

console.log('Symbolic% | Neural% | Similarity');
console.log('─'.repeat(35));

for (const w of weights) {
    const h = new HybridEmbedding(backend, { symbolicWeight: w });
    const analysis = h.analyze(testText1, testText2);
    console.log(`  ${(w * 100).toFixed(0).padStart(3)}%    |  ${((1 - w) * 100).toFixed(0).padStart(3)}%   |   ${analysis.hybrid.toFixed(4)}`);
}

// ===========================================
// HYBRID RETRIEVAL SYSTEM
// ===========================================

console.log('\n' + '═'.repeat(60));
console.log('Hybrid Retrieval System:');
console.log('═'.repeat(60) + '\n');

class HybridRetriever {
    constructor(hybridEmbedding) {
        this.hybrid = hybridEmbedding;
        this.documents = [];
    }

    add(id, text, metadata = {}) {
        const embedding = this.hybrid.getHybrid(text);
        this.documents.push({ id, text, embedding, metadata });
    }

    search(query, topK = 3) {
        const queryEmb = this.hybrid.getHybrid(query);
        
        const scored = this.documents.map(doc => ({
            ...doc,
            score: this.hybrid.similarity(queryEmb.hybrid, doc.embedding.hybrid)
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
}

const retriever = new HybridRetriever(new HybridEmbedding(backend, { symbolicWeight: 0.5 }));

// Add documents
const docs = [
    { id: 1, text: 'Python is a popular programming language' },
    { id: 2, text: 'JavaScript runs in web browsers' },
    { id: 3, text: 'Machine learning uses statistical methods' },
    { id: 4, text: 'Deep neural networks have many layers' },
    { id: 5, text: 'Cats are popular household pets' }
];

for (const doc of docs) {
    retriever.add(doc.id, doc.text);
}

const query = 'AI and neural networks';
console.log(`Query: "${query}"\n`);

const results = retriever.search(query);
console.log('Results:');
for (const result of results) {
    console.log(`  [${result.score.toFixed(3)}] ${result.text}`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '═'.repeat(60));
console.log('KEY TAKEAWAYS:');
console.log('1. Symbolic embeddings: deterministic, interpretable');
console.log('2. Neural embeddings: flexible, context-aware');
console.log('3. Hybrid combines strengths of both approaches');
console.log('4. Weight tuning adapts to different use cases');
console.log('5. Use symbolic for precision, neural for flexibility');
console.log('6. Replace simulated neural with real transformers');