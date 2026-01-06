/**
 * @example Neural-Symbolic Bridge
 * @description Map neural embeddings to prime-based representations
 * 
 * This example shows how to create a bridge between:
 * - Neural embeddings (from transformers, word2vec, etc.)
 * - Symbolic prime representations (TinyAleph)
 * 
 * Use cases:
 * - Interpretability: understand what neural embeddings encode
 * - Grounding: anchor neural representations to symbolic knowledge
 * - Hybrid reasoning: combine neural flexibility with symbolic precision
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// Simulate neural embeddings (in production, use actual transformer outputs)
function simulateNeuralEmbedding(text, dim = 384) {
    // Simulates BERT-like embeddings with higher dimensionality
    const embedding = new Array(dim).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    for (let w = 0; w < words.length; w++) {
        const word = words[w];
        for (let i = 0; i < word.length; i++) {
            const idx = (word.charCodeAt(i) * (w + 1) * (i + 1)) % dim;
            embedding[idx] += Math.cos(word.charCodeAt(i) * 0.1);
        }
    }
    
    // Normalize
    const mag = Math.sqrt(embedding.reduce((s, x) => s + x * x, 0));
    return embedding.map(x => x / (mag || 1));
}

// ===========================================
// NEURAL-SYMBOLIC BRIDGE
// ===========================================

class NeuroSymbolicBridge {
    constructor(backend, options = {}) {
        this.backend = backend;
        this.neuralDim = options.neuralDim || 384;
        this.symbolicDim = options.symbolicDim || 16;
        
        // Projection matrices (learned in real systems, random here)
        this.projectionMatrix = this.initProjection();
        
        // Symbol grounding table
        this.groundings = new Map();
    }

    // Initialize projection matrix
    initProjection() {
        // Create a random but fixed projection
        const matrix = [];
        for (let i = 0; i < this.symbolicDim; i++) {
            const row = [];
            for (let j = 0; j < this.neuralDim; j++) {
                // Deterministic pseudo-random based on position
                row.push(Math.sin(i * 7 + j * 13) * Math.cos(i * 11 + j * 17) * 0.1);
            }
            matrix.push(row);
        }
        return matrix;
    }

    // Project neural embedding to symbolic space
    projectToSymbolic(neuralEmbedding) {
        const symbolic = Hypercomplex.zero(this.symbolicDim);
        
        for (let i = 0; i < this.symbolicDim; i++) {
            let sum = 0;
            for (let j = 0; j < this.neuralDim; j++) {
                sum += this.projectionMatrix[i][j] * neuralEmbedding[j];
            }
            symbolic.c[i] = sum;
        }
        
        // Normalize
        return symbolic.normalize();
    }

    // Get symbolic embedding directly from backend
    getSymbolic(text) {
        return this.backend.textToOrderedState(text);
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

    // Ground a neural embedding with a symbolic concept
    ground(name, neuralEmbedding) {
        const projected = this.projectToSymbolic(neuralEmbedding);
        const symbolic = this.getSymbolic(name);
        
        this.groundings.set(name, {
            neural: neuralEmbedding,
            projected,
            symbolic,
            alignment: this.similarity(projected, symbolic)
        });
        
        return this.groundings.get(name);
    }

    // Find the best symbolic grounding for a neural embedding
    findGrounding(neuralEmbedding) {
        const projected = this.projectToSymbolic(neuralEmbedding);
        
        let best = null;
        let bestScore = -1;
        
        for (const [name, data] of this.groundings) {
            const score = this.similarity(projected, data.symbolic);
            if (score > bestScore) {
                bestScore = score;
                best = { name, score, data };
            }
        }
        
        return best;
    }

    // Analyze the relationship between neural and symbolic
    analyze(text) {
        const neural = simulateNeuralEmbedding(text, this.neuralDim);
        const projected = this.projectToSymbolic(neural);
        const symbolic = this.getSymbolic(text);
        
        return {
            text,
            projectedFromNeural: projected,
            directSymbolic: symbolic,
            alignment: this.similarity(projected, symbolic),
            neuralMagnitude: Math.sqrt(neural.reduce((s, x) => s + x * x, 0)),
            symbolicMagnitude: symbolic.norm()
        };
    }
}

// ===========================================
// EXAMPLE: BRIDGING NEURAL AND SYMBOLIC
// ===========================================

console.log('TinyAleph Neural-Symbolic Bridge Example');
console.log('========================================\n');

const bridge = new NeuroSymbolicBridge(backend);

// Ground some concepts
console.log('Grounding neural embeddings to symbolic concepts:');
console.log('─'.repeat(50) + '\n');

const concepts = ['cat', 'dog', 'animal', 'vehicle', 'computer'];

for (const concept of concepts) {
    const neural = simulateNeuralEmbedding(concept);
    const grounding = bridge.ground(concept, neural);
    console.log(`${concept.padEnd(12)} alignment: ${(grounding.alignment * 100).toFixed(1)}%`);
}

// ===========================================
// CONCEPT RECOGNITION
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Recognizing concepts from neural embeddings:');
console.log('═'.repeat(50) + '\n');

const testPhrases = [
    'a furry feline pet',
    'a barking canine friend',
    'living creatures in nature',
    'a car driving on the road',
    'a laptop processing data'
];

for (const phrase of testPhrases) {
    const neural = simulateNeuralEmbedding(phrase);
    const grounding = bridge.findGrounding(neural);
    
    console.log(`"${phrase}"`);
    if (grounding) {
        console.log(`  → Best match: ${grounding.name} (${(grounding.score * 100).toFixed(1)}%)\n`);
    } else {
        console.log(`  → No grounding found\n`);
    }
}

// ===========================================
// ALIGNMENT ANALYSIS
// ===========================================

console.log('═'.repeat(50));
console.log('Neural-Symbolic Alignment Analysis:');
console.log('═'.repeat(50) + '\n');

const analysisTargets = [
    'The quick brown fox jumps over the lazy dog',
    'Machine learning algorithms process data',
    'Abstract concepts are hard to ground',
    'Simple words are easy'
];

for (const text of analysisTargets) {
    const analysis = bridge.analyze(text);
    console.log(`"${text.substring(0, 40)}..."`);
    console.log(`  Alignment: ${(analysis.alignment * 100).toFixed(1)}%`);
    console.log(`  Symbolic magnitude: ${analysis.symbolicMagnitude.toFixed(3)}`);
    console.log();
}

// ===========================================
// HYBRID REASONING EXAMPLE
// ===========================================

console.log('═'.repeat(50));
console.log('Hybrid Reasoning (Neural + Symbolic):');
console.log('═'.repeat(50) + '\n');

class HybridReasoner {
    constructor(bridge) {
        this.bridge = bridge;
        this.rules = [];
    }

    // Add a symbolic rule
    addRule(name, condition, conclusion) {
        this.rules.push({
            name,
            conditionEmbed: this.bridge.getSymbolic(condition),
            conclusionEmbed: this.bridge.getSymbolic(conclusion),
            conclusion
        });
    }

    // Reason from a neural input
    reason(neuralEmbedding, text = '') {
        // Project to symbolic
        const symbolic = this.bridge.projectToSymbolic(neuralEmbedding);
        
        // Find matching rules
        const matches = [];
        for (const rule of this.rules) {
            const score = this.bridge.similarity(symbolic, rule.conditionEmbed);
            if (score > 0.3) {
                matches.push({ rule, score });
            }
        }
        
        matches.sort((a, b) => b.score - a.score);
        
        return {
            input: text,
            symbolicProjection: symbolic,
            matchedRules: matches.map(m => ({
                rule: m.rule.name,
                score: m.score,
                conclusion: m.rule.conclusion
            }))
        };
    }
}

const reasoner = new HybridReasoner(bridge);

// Add symbolic rules
reasoner.addRule('living-mortal', 'living creature that breathes', 'It will eventually die');
reasoner.addRule('vehicle-fuel', 'vehicle with engine', 'It needs fuel to operate');
reasoner.addRule('computer-power', 'electronic computing device', 'It requires electricity');

// Test reasoning
const reasoningTests = [
    'a breathing animal in the wild',
    'a truck with a powerful engine',
    'a smartphone with a processor'
];

for (const test of reasoningTests) {
    const neural = simulateNeuralEmbedding(test);
    const result = reasoner.reason(neural, test);
    
    console.log(`Input: "${test}"`);
    if (result.matchedRules.length > 0) {
        for (const match of result.matchedRules) {
            console.log(`  Rule: ${match.rule} (${(match.score * 100).toFixed(0)}%)`);
            console.log(`  → ${match.conclusion}`);
        }
    } else {
        console.log('  No rules matched');
    }
    console.log();
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Projection maps neural → symbolic space');
console.log('2. Grounding anchors neural representations');
console.log('3. Alignment measures neural-symbolic consistency');
console.log('4. Hybrid reasoning combines flexibility + precision');
console.log('5. Replace simulated embeddings with real transformers');
console.log('6. Learn projection matrices from paired data');