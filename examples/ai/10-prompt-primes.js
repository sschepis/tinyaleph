/**
 * @example Prompt Engineering with Primes
 * @description Prime-based prompt construction for LLMs
 * 
 * This example shows how to use prime embeddings to:
 * - Structure prompts semantically
 * - Measure prompt consistency
 * - Generate variations
 * - Optimize prompt effectiveness
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// PROMPT ANALYZER
// ===========================================

class PromptAnalyzer {
    constructor(backend) {
        this.backend = backend;
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

    // Analyze prompt structure
    analyzePrompt(prompt) {
        const embedding = this.backend.textToOrderedState(prompt);
        
        // Break into sentences for coherence analysis
        const sentences = prompt.split(/[.!?]+/).filter(s => s.trim());
        const sentenceEmbeddings = sentences.map(s => this.backend.textToOrderedState(s.trim()));

        // Measure internal coherence
        let coherence = 0;
        let pairCount = 0;
        for (let i = 0; i < sentenceEmbeddings.length; i++) {
            for (let j = i + 1; j < sentenceEmbeddings.length; j++) {
                coherence += this.similarity(sentenceEmbeddings[i], sentenceEmbeddings[j]);
                pairCount++;
            }
        }
        coherence = pairCount > 0 ? coherence / pairCount : 1;

        // Calculate specificity (inverse of entropy)
        const components = embedding.c.map(c => Math.abs(c));
        const sum = components.reduce((s, c) => s + c, 0);
        const probs = components.map(c => c / (sum || 1));
        let entropy = 0;
        for (const p of probs) {
            if (p > 0) entropy -= p * Math.log2(p);
        }
        const maxEntropy = Math.log2(16);
        const specificity = 1 - (entropy / maxEntropy);

        return {
            embedding,
            sentenceCount: sentences.length,
            wordCount: prompt.split(/\s+/).length,
            coherence,
            specificity,
            magnitude: embedding.norm()
        };
    }

    // Compare two prompts
    comparePrompts(prompt1, prompt2) {
        const analysis1 = this.analyzePrompt(prompt1);
        const analysis2 = this.analyzePrompt(prompt2);

        return {
            similarity: this.similarity(analysis1.embedding, analysis2.embedding),
            coherenceDiff: analysis1.coherence - analysis2.coherence,
            specificityDiff: analysis1.specificity - analysis2.specificity
        };
    }

    // Score prompt quality
    scorePrompt(prompt, criteria = {}) {
        const analysis = this.analyzePrompt(prompt);
        
        // Default criteria weights
        const weights = {
            coherence: criteria.coherenceWeight || 0.3,
            specificity: criteria.specificityWeight || 0.3,
            length: criteria.lengthWeight || 0.2,
            magnitude: criteria.magnitudeWeight || 0.2
        };

        // Optimal length (not too short, not too long)
        const optimalWords = criteria.optimalWords || 50;
        const lengthScore = 1 - Math.abs(analysis.wordCount - optimalWords) / optimalWords;

        // Magnitude indicates semantic richness
        const magnitudeScore = Math.min(1, analysis.magnitude / 2);

        const score = 
            weights.coherence * analysis.coherence +
            weights.specificity * analysis.specificity +
            weights.length * Math.max(0, lengthScore) +
            weights.magnitude * magnitudeScore;

        return {
            score,
            breakdown: {
                coherence: analysis.coherence,
                specificity: analysis.specificity,
                lengthScore,
                magnitudeScore
            },
            analysis
        };
    }
}

// ===========================================
// PROMPT GENERATOR
// ===========================================

class PromptGenerator {
    constructor(backend) {
        this.backend = backend;
        this.templates = new Map();
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

    // Register a prompt template
    addTemplate(name, template, intentDescription) {
        this.templates.set(name, {
            template,
            intentEmbedding: this.backend.textToOrderedState(intentDescription),
            intentDescription
        });
    }

    // Find best template for an intent
    findTemplate(intent) {
        const intentEmbed = this.backend.textToOrderedState(intent);
        let best = null;
        let bestScore = -1;

        for (const [name, data] of this.templates) {
            const score = this.similarity(intentEmbed, data.intentEmbedding);
            if (score > bestScore) {
                bestScore = score;
                best = { name, ...data, score };
            }
        }

        return best;
    }

    // Generate prompt from template
    generate(intent, variables = {}) {
        const template = this.findTemplate(intent);
        if (!template) return null;

        let prompt = template.template;
        for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        return {
            prompt,
            template: template.name,
            matchScore: template.score
        };
    }
}

// ===========================================
// EXAMPLE: ANALYZING PROMPTS
// ===========================================

console.log('TinyAleph Prompt Engineering Example');
console.log('=====================================\n');

const analyzer = new PromptAnalyzer(backend);

const prompts = [
    {
        name: 'Vague',
        text: 'Tell me about AI.'
    },
    {
        name: 'Specific',
        text: 'Explain how transformer neural networks use attention mechanisms to process sequential data. Focus on the self-attention layer and its mathematical foundation.'
    },
    {
        name: 'Structured',
        text: 'You are an expert in machine learning. Given the following context about neural networks, answer the question concisely. Context: Neural networks learn patterns from data. Question: How do they learn?'
    },
    {
        name: 'Incoherent',
        text: 'Tell me about cats. What is the weather today? Calculate 2+2. Write a poem about flowers.'
    }
];

console.log('Prompt Analysis:');
console.log('─'.repeat(60) + '\n');

for (const { name, text } of prompts) {
    const score = analyzer.scorePrompt(text, { optimalWords: 30 });
    console.log(`${name}: "${text.substring(0, 50)}..."`);
    console.log(`  Overall Score: ${(score.score * 100).toFixed(1)}%`);
    console.log(`  Coherence: ${(score.breakdown.coherence * 100).toFixed(1)}%`);
    console.log(`  Specificity: ${(score.breakdown.specificity * 100).toFixed(1)}%`);
    console.log(`  Words: ${score.analysis.wordCount}, Sentences: ${score.analysis.sentenceCount}`);
    console.log();
}

// ===========================================
// PROMPT COMPARISON
// ===========================================

console.log('═'.repeat(60));
console.log('Prompt Comparison:');
console.log('═'.repeat(60) + '\n');

const prompt1 = 'Explain machine learning algorithms for beginners';
const prompt2 = 'Describe ML algorithms in simple terms for newcomers';
const prompt3 = 'Tell me about cooking recipes';

console.log(`Prompt A: "${prompt1}"`);
console.log(`Prompt B: "${prompt2}"`);
console.log(`Prompt C: "${prompt3}"\n`);

const compAB = analyzer.comparePrompts(prompt1, prompt2);
const compAC = analyzer.comparePrompts(prompt1, prompt3);

console.log(`A vs B similarity: ${(compAB.similarity * 100).toFixed(1)}% (should be high)`);
console.log(`A vs C similarity: ${(compAC.similarity * 100).toFixed(1)}% (should be low)`);

// ===========================================
// TEMPLATE-BASED GENERATION
// ===========================================

console.log('\n' + '═'.repeat(60));
console.log('Template-Based Prompt Generation:');
console.log('═'.repeat(60) + '\n');

const generator = new PromptGenerator(backend);

// Add templates
generator.addTemplate(
    'explanation',
    'You are an expert in {topic}. Explain {concept} in simple terms that a beginner can understand. Use concrete examples.',
    'explain something clearly for beginners'
);

generator.addTemplate(
    'comparison',
    'Compare and contrast {item1} and {item2}. List their similarities, differences, and when to use each one.',
    'compare two things or concepts'
);

generator.addTemplate(
    'code',
    'Write a {language} function that {task}. Include comments explaining each step. Handle edge cases appropriately.',
    'write code or programming solution'
);

// Generate prompts
const intents = [
    { intent: 'help me understand something new', vars: { topic: 'physics', concept: 'quantum entanglement' } },
    { intent: 'show me the differences between options', vars: { item1: 'React', item2: 'Vue.js' } },
    { intent: 'create a programming function', vars: { language: 'JavaScript', task: 'sorts an array of numbers' } }
];

for (const { intent, vars } of intents) {
    const result = generator.generate(intent, vars);
    console.log(`Intent: "${intent}"`);
    console.log(`Template matched: ${result.template} (${(result.matchScore * 100).toFixed(0)}%)`);
    console.log(`Generated: "${result.prompt.substring(0, 80)}..."\n`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('═'.repeat(60));
console.log('KEY TAKEAWAYS:');
console.log('1. Coherence measures how well prompt parts relate');
console.log('2. Specificity indicates clarity of intent');
console.log('3. Compare prompts semantically to find duplicates');
console.log('4. Templates with semantic matching enable flexible generation');
console.log('5. Score prompts to optimize before sending to LLM');
console.log('6. Prime embeddings provide deterministic prompt analysis');