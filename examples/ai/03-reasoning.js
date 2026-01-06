/**
 * @example Reasoning Chains
 * @description Multi-step inference using semantic transforms
 * 
 * TinyAleph supports symbolic reasoning through transforms that
 * manipulate hypercomplex states. This example demonstrates:
 * - Building reasoning chains
 * - Applying logical transformations
 * - Tracking confidence through inference
 * - Combining multiple evidence sources
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// REASONING ENGINE
// ===========================================

class ReasoningEngine {
    constructor(backend) {
        this.backend = backend;
        this.facts = new Map();
        this.rules = [];
    }

    // Add a fact with its embedding
    addFact(name, statement, confidence = 1.0) {
        this.facts.set(name, {
            statement,
            embedding: this.backend.textToOrderedState(statement),
            confidence
        });
    }

    // Add an inference rule
    addRule(name, premises, conclusion, transform = 'identity') {
        this.rules.push({
            name,
            premises, // Array of fact names required
            conclusion, // What we can conclude
            transform // How to transform the embedding
        });
    }

    // Compute similarity between embeddings
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Apply a reasoning step
    reason() {
        const newFacts = [];

        for (const rule of this.rules) {
            // Check if all premises are satisfied
            const premisesFacts = rule.premises.map(p => this.facts.get(p));
            if (premisesFacts.some(f => !f)) continue;

            // Calculate combined confidence
            const confidence = premisesFacts.reduce((c, f) => c * f.confidence, 1.0);
            if (confidence < 0.1) continue; // Too uncertain

            // Combine premise embeddings
            const combined = Hypercomplex.zero(16);
            for (const fact of premisesFacts) {
                for (let i = 0; i < 16; i++) {
                    combined.c[i] += fact.embedding.c[i] / premisesFacts.length;
                }
            }

            // Create conclusion fact
            const conclusionName = `${rule.name}_conclusion`;
            if (!this.facts.has(conclusionName)) {
                newFacts.push({
                    name: conclusionName,
                    statement: rule.conclusion,
                    embedding: combined.normalize(),
                    confidence: confidence * 0.9, // Slight confidence decay
                    derivedFrom: rule.name
                });
            }
        }

        // Add new facts
        for (const fact of newFacts) {
            this.facts.set(fact.name, fact);
        }

        return newFacts;
    }

    // Query: find facts similar to a question
    query(question, threshold = 0.5) {
        const queryEmbed = this.backend.textToOrderedState(question);
        const results = [];

        for (const [name, fact] of this.facts) {
            const sim = this.similarity(queryEmbed, fact.embedding);
            if (sim > threshold) {
                results.push({
                    name,
                    statement: fact.statement,
                    similarity: sim,
                    confidence: fact.confidence,
                    derivedFrom: fact.derivedFrom
                });
            }
        }

        results.sort((a, b) => (b.similarity * b.confidence) - (a.similarity * a.confidence));
        return results;
    }

    // Run complete reasoning chain
    runChain(maxSteps = 5) {
        const history = [];
        for (let step = 0; step < maxSteps; step++) {
            const newFacts = this.reason();
            if (newFacts.length === 0) break;
            history.push({ step: step + 1, derived: newFacts.map(f => f.name) });
        }
        return history;
    }
}

// ===========================================
// EXAMPLE: SIMPLE SYLLOGISM
// ===========================================

console.log('TinyAleph Reasoning Chains Example');
console.log('===================================\n');

const engine = new ReasoningEngine(backend);

// Add base facts
console.log('Adding facts...');
engine.addFact('all_men_mortal', 'All men are mortal');
engine.addFact('socrates_man', 'Socrates is a man');
engine.addFact('plato_man', 'Plato is a man');
engine.addFact('cats_animals', 'Cats are animals');

// Add inference rules
console.log('Adding rules...\n');
engine.addRule(
    'socrates_mortality',
    ['all_men_mortal', 'socrates_man'],
    'Socrates is mortal'
);
engine.addRule(
    'plato_mortality',
    ['all_men_mortal', 'plato_man'],
    'Plato is mortal'
);

// Run reasoning
console.log('===================================');
console.log('Running Reasoning Chain:');
console.log('===================================\n');

const history = engine.runChain();
for (const step of history) {
    console.log(`Step ${step.step}: Derived ${step.derived.join(', ')}`);
}

// ===========================================
// QUERYING THE KNOWLEDGE BASE
// ===========================================

console.log('\n===================================');
console.log('Querying the Knowledge Base:');
console.log('===================================\n');

const queries = [
    'Is Socrates mortal?',
    'What do we know about Plato?',
    'Are cats mortal?', // Should be uncertain
];

for (const q of queries) {
    console.log(`Q: "${q}"`);
    const results = engine.query(q, 0.3);
    if (results.length === 0) {
        console.log('  No relevant facts found.\n');
    } else {
        for (const r of results.slice(0, 2)) {
            console.log(`  [sim: ${r.similarity.toFixed(2)}, conf: ${r.confidence.toFixed(2)}] ${r.statement}`);
            if (r.derivedFrom) console.log(`    (derived from: ${r.derivedFrom})`);
        }
        console.log();
    }
}

// ===========================================
// CONFIDENCE PROPAGATION
// ===========================================

console.log('===================================');
console.log('Confidence Propagation:');
console.log('===================================\n');

const engine2 = new ReasoningEngine(backend);

// Facts with varying confidence
engine2.addFact('birds_fly', 'Birds can fly', 0.9); // Most, not all
engine2.addFact('penguin_bird', 'A penguin is a bird', 1.0);
engine2.addFact('sparrow_bird', 'A sparrow is a bird', 1.0);

engine2.addRule('penguin_flies', ['birds_fly', 'penguin_bird'], 'A penguin can fly');
engine2.addRule('sparrow_flies', ['birds_fly', 'sparrow_bird'], 'A sparrow can fly');

engine2.runChain();

console.log('Derived facts with confidence:');
for (const [name, fact] of engine2.facts) {
    if (fact.derivedFrom) {
        console.log(`  ${fact.statement}: ${(fact.confidence * 100).toFixed(0)}% confidence`);
    }
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n===================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Facts are stored as hypercomplex embeddings');
console.log('2. Rules combine premise embeddings to derive conclusions');
console.log('3. Confidence propagates and decays through inference');
console.log('4. Queries find semantically similar facts');
console.log('5. Multi-step reasoning chains build complex knowledge');
console.log('6. Transforms can modify meaning during inference');