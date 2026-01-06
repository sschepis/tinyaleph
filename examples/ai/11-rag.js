/**
 * @example RAG with Primes
 * @description Retrieval Augmented Generation using prime embeddings
 * 
 * This example demonstrates a complete RAG system using TinyAleph:
 * - Document chunking and embedding
 * - Semantic retrieval
 * - Context assembly for LLM
 * - Answer generation with grounding
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// DOCUMENT STORE
// ===========================================

class DocumentStore {
    constructor(backend, chunkSize = 100) {
        this.backend = backend;
        this.chunkSize = chunkSize;
        this.chunks = [];
        this.documents = new Map();
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

    // Chunk text into smaller pieces
    chunkText(text, overlap = 20) {
        const words = text.split(/\s+/);
        const chunks = [];
        
        for (let i = 0; i < words.length; i += this.chunkSize - overlap) {
            const chunk = words.slice(i, i + this.chunkSize).join(' ');
            if (chunk.trim()) chunks.push(chunk);
        }
        
        return chunks;
    }

    // Add a document
    addDocument(id, title, content, metadata = {}) {
        const chunks = this.chunkText(content);
        
        this.documents.set(id, { id, title, content, metadata });
        
        for (let i = 0; i < chunks.length; i++) {
            this.chunks.push({
                documentId: id,
                chunkIndex: i,
                text: chunks[i],
                embedding: this.backend.textToOrderedState(chunks[i])
            });
        }

        return chunks.length;
    }

    // Retrieve relevant chunks
    retrieve(query, topK = 3) {
        const queryEmbed = this.backend.textToOrderedState(query);
        
        const scored = this.chunks.map(chunk => ({
            ...chunk,
            score: this.similarity(queryEmbed, chunk.embedding)
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    // Get full document
    getDocument(id) {
        return this.documents.get(id);
    }
}

// ===========================================
// RAG PIPELINE
// ===========================================

class RAGPipeline {
    constructor(documentStore, options = {}) {
        this.store = documentStore;
        this.contextWindow = options.contextWindow || 3;
        this.minScore = options.minScore || 0.3;
    }

    // Build context from retrieved chunks
    buildContext(chunks) {
        // Group by document
        const byDoc = new Map();
        for (const chunk of chunks) {
            if (!byDoc.has(chunk.documentId)) {
                byDoc.set(chunk.documentId, []);
            }
            byDoc.get(chunk.documentId).push(chunk);
        }

        // Build context string
        const contextParts = [];
        for (const [docId, docChunks] of byDoc) {
            const doc = this.store.getDocument(docId);
            contextParts.push(`Source: ${doc.title}`);
            
            // Sort chunks by index for coherent reading
            docChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
            for (const chunk of docChunks) {
                contextParts.push(`[Score: ${chunk.score.toFixed(2)}] ${chunk.text}`);
            }
            contextParts.push('');
        }

        return contextParts.join('\n');
    }

    // Generate prompt with retrieved context
    generatePrompt(query, context) {
        return `You are a helpful assistant. Answer the question based on the provided context.

Context:
${context}

Question: ${query}

Answer based only on the information provided in the context. If the context doesn't contain enough information, say so.

Answer:`;
    }

    // Full RAG query
    query(question) {
        // 1. Retrieve relevant chunks
        const chunks = this.store.retrieve(question, this.contextWindow);
        
        // Filter by minimum score
        const relevantChunks = chunks.filter(c => c.score >= this.minScore);

        if (relevantChunks.length === 0) {
            return {
                answer: 'I could not find relevant information to answer this question.',
                context: null,
                chunks: [],
                prompt: null
            };
        }

        // 2. Build context
        const context = this.buildContext(relevantChunks);

        // 3. Generate prompt
        const prompt = this.generatePrompt(question, context);

        // 4. In production, send prompt to LLM
        // For this example, we return the prompt and context
        return {
            answer: '[Would be generated by LLM]',
            context,
            chunks: relevantChunks,
            prompt
        };
    }
}

// ===========================================
// EXAMPLE: TECHNICAL DOCUMENTATION RAG
// ===========================================

console.log('TinyAleph RAG Example');
console.log('=====================\n');

const store = new DocumentStore(backend, 50); // 50 words per chunk

// Add some documents
console.log('Loading documents...\n');

store.addDocument('doc1', 'Introduction to Machine Learning', `
Machine learning is a subset of artificial intelligence that enables systems to learn 
and improve from experience without being explicitly programmed. Machine learning focuses 
on developing computer programs that can access data and use it to learn for themselves.
The process begins with observations or data, such as examples, direct experience, or 
instruction. It looks for patterns in data and makes better decisions in the future.
The primary aim is to allow computers to learn automatically without human intervention.
`);

store.addDocument('doc2', 'Deep Learning Fundamentals', `
Deep learning is a machine learning technique that teaches computers to do what comes 
naturally to humans: learn by example. In deep learning, a computer model learns to 
perform classification tasks directly from images, text, or sound. Deep learning models 
can achieve state-of-the-art accuracy, sometimes exceeding human-level performance.
Models are trained by using a large set of labeled data and neural network architectures 
that contain many layers. Most deep learning methods use neural network architectures.
`);

store.addDocument('doc3', 'Neural Network Architecture', `
A neural network is a series of algorithms that attempts to recognize relationships 
in data through a process that mimics how the human brain operates. Neural networks 
consist of layers of interconnected nodes or neurons. Each node is designed to perform 
specific mathematical operations. The input layer receives raw data, hidden layers 
process the information, and the output layer produces the final result.
Weights and biases are adjusted during training to minimize prediction errors.
`);

console.log(`Loaded ${store.documents.size} documents with ${store.chunks.length} chunks\n`);

// ===========================================
// RAG QUERIES
// ===========================================

console.log('═'.repeat(60));
console.log('RAG Queries:');
console.log('═'.repeat(60) + '\n');

const rag = new RAGPipeline(store, { contextWindow: 3, minScore: 0.3 });

const questions = [
    'What is machine learning?',
    'How do neural networks work?',
    'What is deep learning and how is it different?',
    'What is quantum computing?' // Should find no relevant context
];

for (const question of questions) {
    console.log(`Question: "${question}"\n`);
    
    const result = rag.query(question);
    
    if (result.chunks.length > 0) {
        console.log('Retrieved chunks:');
        for (const chunk of result.chunks) {
            const doc = store.getDocument(chunk.documentId);
            console.log(`  [${chunk.score.toFixed(2)}] From "${doc.title}": "${chunk.text.substring(0, 60)}..."`);
        }
        console.log('\nGenerated prompt preview:');
        console.log(result.prompt.substring(0, 200) + '...');
    } else {
        console.log('No relevant context found.');
        console.log(`Response: ${result.answer}`);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
}

// ===========================================
// ADVANCED: SEMANTIC RERANKING
// ===========================================

console.log('═'.repeat(60));
console.log('Advanced: Semantic Reranking');
console.log('═'.repeat(60) + '\n');

class SemanticReranker {
    constructor(backend) {
        this.backend = backend;
    }

    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    rerank(query, chunks, expectedAnswer = null) {
        const queryEmbed = this.backend.textToOrderedState(query);
        const answerEmbed = expectedAnswer ? this.backend.textToOrderedState(expectedAnswer) : null;

        return chunks.map(chunk => {
            const queryScore = this.similarity(queryEmbed, chunk.embedding);
            const answerScore = answerEmbed 
                ? this.similarity(answerEmbed, chunk.embedding) 
                : 0;
            
            return {
                ...chunk,
                queryScore,
                answerScore,
                combinedScore: answerEmbed 
                    ? queryScore * 0.5 + answerScore * 0.5 
                    : queryScore
            };
        }).sort((a, b) => b.combinedScore - a.combinedScore);
    }
}

const reranker = new SemanticReranker(backend);

const testQuery = 'How do computers learn from data?';
const expectedAnswer = 'Machine learning allows computers to learn patterns from examples';

const initialChunks = store.retrieve(testQuery, 5);
const rerankedChunks = reranker.rerank(testQuery, initialChunks, expectedAnswer);

console.log(`Query: "${testQuery}"`);
console.log(`Expected answer hint: "${expectedAnswer}"\n`);

console.log('Reranked results:');
for (const chunk of rerankedChunks.slice(0, 3)) {
    console.log(`  [Q: ${chunk.queryScore.toFixed(2)}, A: ${chunk.answerScore.toFixed(2)}, Combined: ${chunk.combinedScore.toFixed(2)}]`);
    console.log(`  "${chunk.text.substring(0, 60)}..."\n`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('═'.repeat(60));
console.log('KEY TAKEAWAYS:');
console.log('1. Chunk documents for granular retrieval');
console.log('2. Prime embeddings enable semantic search');
console.log('3. Build context from top-scoring chunks');
console.log('4. Generate prompts with retrieved context');
console.log('5. Reranking improves retrieval quality');
console.log('6. Connect to LLM API for full RAG pipeline');