/**
 * @example Semantic Search
 * @description Build a semantic search engine using TinyAleph
 * 
 * TinyAleph enables semantic search that finds results by meaning,
 * not just keyword matching:
 * - Index documents as hypercomplex embeddings
 * - Query using natural language
 * - Rank results by semantic similarity
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Semantic Search Example');
console.log('==================================\n');

// ===========================================
// SEARCH ENGINE CLASS
// ===========================================

class SemanticSearchEngine {
    constructor(backend) {
        this.backend = backend;
        this.documents = [];
        this.index = [];
    }

    // Add a document to the index
    addDocument(id, title, content, metadata) {
        var fullText = title + ' ' + content;
        var embedding = this.backend.textToOrderedState(fullText);
        
        this.documents.push({
            id: id,
            title: title,
            content: content,
            metadata: metadata || {}
        });
        
        this.index.push({
            docId: id,
            embedding: embedding
        });
    }

    // Compute similarity between two states
    similarity(state1, state2) {
        var dot = 0, mag1 = 0, mag2 = 0;
        for (var i = 0; i < state1.c.length; i++) {
            dot += state1.c[i] * state2.c[i];
            mag1 += state1.c[i] * state1.c[i];
            mag2 += state2.c[i] * state2.c[i];
        }
        return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
    }

    // Search for documents matching query
    search(query, topK) {
        topK = topK || 5;
        var queryEmbedding = this.backend.textToOrderedState(query);
        
        var self = this;
        var results = this.index.map(function(item) {
            return {
                docId: item.docId,
                score: self.similarity(queryEmbedding, item.embedding)
            };
        });
        
        results.sort(function(a, b) { return b.score - a.score; });
        
        var topResults = results.slice(0, topK);
        
        return topResults.map(function(result) {
            var doc = self.documents.find(function(d) { return d.id === result.docId; });
            return {
                id: result.docId,
                title: doc.title,
                content: doc.content.substring(0, 100) + '...',
                score: result.score,
                metadata: doc.metadata
            };
        });
    }

    // Search with filters
    searchWithFilters(query, filters, topK) {
        topK = topK || 5;
        var queryEmbedding = this.backend.textToOrderedState(query);
        
        var self = this;
        
        // Filter documents first
        var filteredIndices = this.index.filter(function(item) {
            var doc = self.documents.find(function(d) { return d.id === item.docId; });
            
            for (var key in filters) {
                if (filters.hasOwnProperty(key)) {
                    if (doc.metadata[key] !== filters[key]) {
                        return false;
                    }
                }
            }
            return true;
        });
        
        // Score filtered documents
        var results = filteredIndices.map(function(item) {
            return {
                docId: item.docId,
                score: self.similarity(queryEmbedding, item.embedding)
            };
        });
        
        results.sort(function(a, b) { return b.score - a.score; });
        
        return results.slice(0, topK).map(function(result) {
            var doc = self.documents.find(function(d) { return d.id === result.docId; });
            return {
                id: result.docId,
                title: doc.title,
                score: result.score,
                metadata: doc.metadata
            };
        });
    }
}

// ===========================================
// BUILD SAMPLE INDEX
// ===========================================

console.log('Building Document Index:');
console.log('-'.repeat(50) + '\n');

var engine = new SemanticSearchEngine(backend);

// Add sample documents
var sampleDocs = [
    {
        id: 'doc1',
        title: 'Introduction to Machine Learning',
        content: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming. It includes supervised learning, unsupervised learning, and reinforcement learning.',
        metadata: { category: 'tech', year: 2023 }
    },
    {
        id: 'doc2',
        title: 'Deep Learning Neural Networks',
        content: 'Deep learning uses neural networks with multiple layers to process complex patterns. Convolutional neural networks are used for image recognition, while recurrent networks handle sequential data.',
        metadata: { category: 'tech', year: 2023 }
    },
    {
        id: 'doc3',
        title: 'Natural Language Processing',
        content: 'NLP enables computers to understand human language. Techniques include tokenization, parsing, sentiment analysis, and machine translation. Modern NLP uses transformer architectures.',
        metadata: { category: 'tech', year: 2022 }
    },
    {
        id: 'doc4',
        title: 'Healthy Mediterranean Diet',
        content: 'The Mediterranean diet emphasizes fruits, vegetables, whole grains, and olive oil. It has been linked to reduced heart disease, improved cognitive function, and longevity.',
        metadata: { category: 'health', year: 2023 }
    },
    {
        id: 'doc5',
        title: 'Exercise and Mental Health',
        content: 'Regular physical exercise has been shown to reduce symptoms of depression and anxiety. It releases endorphins and promotes neuroplasticity in the brain.',
        metadata: { category: 'health', year: 2022 }
    },
    {
        id: 'doc6',
        title: 'Quantum Computing Fundamentals',
        content: 'Quantum computers use qubits that can exist in superposition. This allows them to solve certain problems exponentially faster than classical computers.',
        metadata: { category: 'tech', year: 2023 }
    },
    {
        id: 'doc7',
        title: 'Climate Change Solutions',
        content: 'Addressing climate change requires reducing carbon emissions, transitioning to renewable energy, and implementing carbon capture technologies. International cooperation is essential.',
        metadata: { category: 'environment', year: 2023 }
    },
    {
        id: 'doc8',
        title: 'Renewable Energy Sources',
        content: 'Solar, wind, and hydroelectric power are major renewable energy sources. They produce no direct carbon emissions and are becoming increasingly cost-competitive with fossil fuels.',
        metadata: { category: 'environment', year: 2022 }
    }
];

for (var i = 0; i < sampleDocs.length; i++) {
    var doc = sampleDocs[i];
    engine.addDocument(doc.id, doc.title, doc.content, doc.metadata);
    console.log('  Indexed: ' + doc.title);
}

console.log('\n  Total documents: ' + engine.documents.length);

// ===========================================
// BASIC SEARCH
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Basic Semantic Search:');
console.log('='.repeat(50) + '\n');

var queries = [
    'how do computers learn from data',
    'staying healthy with diet and exercise',
    'clean energy and sustainability',
    'understanding AI and neural networks'
];

for (var q = 0; q < queries.length; q++) {
    var query = queries[q];
    console.log('Query: "' + query + '"');
    var results = engine.search(query, 3);
    
    for (var r = 0; r < results.length; r++) {
        var result = results[r];
        console.log('  ' + (r + 1) + '. ' + result.title + ' (' + (result.score * 100).toFixed(1) + '%)');
    }
    console.log('');
}

// ===========================================
// FILTERED SEARCH
// ===========================================

console.log('='.repeat(50));
console.log('Filtered Search (by category):');
console.log('='.repeat(50) + '\n');

var filteredQueries = [
    { query: 'learning algorithms', filter: { category: 'tech' } },
    { query: 'wellness and longevity', filter: { category: 'health' } },
    { query: 'reducing emissions', filter: { category: 'environment' } }
];

for (var fq = 0; fq < filteredQueries.length; fq++) {
    var item = filteredQueries[fq];
    console.log('Query: "' + item.query + '" [category=' + item.filter.category + ']');
    var results = engine.searchWithFilters(item.query, item.filter, 3);
    
    for (var r = 0; r < results.length; r++) {
        var result = results[r];
        console.log('  ' + (r + 1) + '. ' + result.title + ' (' + (result.score * 100).toFixed(1) + '%)');
    }
    console.log('');
}

// ===========================================
// SEMANTIC VS KEYWORD
// ===========================================

console.log('='.repeat(50));
console.log('Semantic vs Keyword Search:');
console.log('='.repeat(50) + '\n');

// Queries that would fail keyword search but succeed semantically
var semanticQueries = [
    {
        query: 'teaching computers without programming them',
        expected: 'Machine Learning'
    },
    {
        query: 'brain patterns and mood improvement',
        expected: 'Exercise and Mental Health'
    },
    {
        query: 'alternative power generation',
        expected: 'Renewable Energy'
    }
];

console.log('Queries that work semantically but might fail keyword matching:\n');

for (var sq = 0; sq < semanticQueries.length; sq++) {
    var item = semanticQueries[sq];
    var results = engine.search(item.query, 1);
    var topResult = results[0];
    
    console.log('Query: "' + item.query + '"');
    console.log('  Expected: ' + item.expected);
    console.log('  Found: ' + topResult.title + ' (' + (topResult.score * 100).toFixed(1) + '%)');
    console.log('');
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Semantic search finds results by meaning, not keywords');
console.log('2. Documents are indexed as hypercomplex embeddings');
console.log('3. Queries are embedded and compared to document embeddings');
console.log('4. Filters can narrow results before ranking');
console.log('5. Works even when query words differ from document words');