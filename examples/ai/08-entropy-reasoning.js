/**
 * @example Entropy-Based Reasoning
 * @description Use entropy minimization for inference
 * 
 * TinyAleph's physics module provides entropy calculations that can
 * guide reasoning. Low entropy indicates certainty; high entropy
 * indicates confusion. This example shows:
 * - Measuring reasoning uncertainty
 * - Guiding inference toward clarity
 * - Detecting when more information is needed
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// ENTROPY CALCULATOR
// ===========================================

class EntropyReasoner {
    constructor(backend) {
        this.backend = backend;
    }

    // Calculate Shannon entropy of hypercomplex state
    calculateEntropy(state) {
        const components = state.c.map(c => Math.abs(c));
        const sum = components.reduce((s, c) => s + c, 0);
        if (sum === 0) return 0;

        const probs = components.map(c => c / sum);
        let entropy = 0;
        for (const p of probs) {
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    // Maximum possible entropy for this dimension
    maxEntropy(dim = 16) {
        return Math.log2(dim);
    }

    // Normalized entropy (0 = certain, 1 = maximum confusion)
    normalizedEntropy(state) {
        return this.calculateEntropy(state) / this.maxEntropy(state.c.length);
    }

    // Interpret entropy level
    interpret(entropy) {
        if (entropy < 0.3) return { level: 'LOW', meaning: 'High certainty', action: 'Proceed with confidence' };
        if (entropy < 0.6) return { level: 'MEDIUM', meaning: 'Some uncertainty', action: 'Consider alternatives' };
        if (entropy < 0.8) return { level: 'HIGH', meaning: 'Significant confusion', action: 'Gather more information' };
        return { level: 'VERY_HIGH', meaning: 'Maximum uncertainty', action: 'Cannot make reliable inference' };
    }
}

// ===========================================
// ENTROPY-GUIDED INFERENCE
// ===========================================

class EntropyGuidedInference {
    constructor(backend) {
        this.backend = backend;
        this.reasoner = new EntropyReasoner(backend);
        this.hypotheses = [];
        this.evidence = [];
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

    // Add a hypothesis
    addHypothesis(description, prior = 0.5) {
        this.hypotheses.push({
            description,
            embedding: this.backend.textToOrderedState(description),
            probability: prior
        });
    }

    // Add evidence
    addEvidence(observation) {
        const embedding = this.backend.textToOrderedState(observation);
        this.evidence.push({ observation, embedding });

        // Update hypothesis probabilities based on evidence
        this.updateProbabilities(embedding);
    }

    // Bayesian-like update of probabilities
    updateProbabilities(evidenceEmbed) {
        const likelihoods = this.hypotheses.map(h => 
            Math.max(0.1, this.similarity(h.embedding, evidenceEmbed))
        );

        const totalLikelihood = likelihoods.reduce((s, l) => s + l, 0);

        for (let i = 0; i < this.hypotheses.length; i++) {
            const likelihood = likelihoods[i] / totalLikelihood;
            this.hypotheses[i].probability = 
                (this.hypotheses[i].probability * likelihood) /
                (this.hypotheses[i].probability * likelihood + 
                 (1 - this.hypotheses[i].probability) * (1 - likelihood));
        }

        // Normalize
        const total = this.hypotheses.reduce((s, h) => s + h.probability, 0);
        for (const h of this.hypotheses) {
            h.probability /= total;
        }
    }

    // Get current belief state as hypercomplex
    getBeliefState() {
        const state = Hypercomplex.zero(16);
        for (let i = 0; i < this.hypotheses.length && i < 16; i++) {
            state.c[i] = this.hypotheses[i].probability;
        }
        return state;
    }

    // Get entropy of current beliefs
    getBeliefEntropy() {
        const state = this.getBeliefState();
        return this.reasoner.normalizedEntropy(state);
    }

    // Recommend action based on entropy
    recommend() {
        const entropy = this.getBeliefEntropy();
        const interpretation = this.reasoner.interpret(entropy);

        // Find best hypothesis
        const sorted = [...this.hypotheses].sort((a, b) => b.probability - a.probability);
        const best = sorted[0];
        const secondBest = sorted[1];

        return {
            entropy,
            interpretation,
            bestHypothesis: best,
            confidence: best ? (best.probability - (secondBest?.probability || 0)) : 0
        };
    }
}

// ===========================================
// EXAMPLE: DIAGNOSTIC REASONING
// ===========================================

console.log('TinyAleph Entropy-Based Reasoning Example');
console.log('==========================================\n');

const inference = new EntropyGuidedInference(backend);

// Scenario: Diagnosing a car problem
console.log('Scenario: Car won\'t start. What\'s wrong?\n');

// Add hypotheses
inference.addHypothesis('Dead battery - no electrical power', 0.25);
inference.addHypothesis('Empty fuel tank - no gas', 0.25);
inference.addHypothesis('Failed starter motor - mechanical issue', 0.25);
inference.addHypothesis('Electrical system failure - wiring problem', 0.25);

console.log('Initial hypotheses (equal probability):');
for (const h of inference.hypotheses) {
    console.log(`  [${(h.probability * 100).toFixed(0)}%] ${h.description}`);
}

let rec = inference.recommend();
console.log(`\nInitial entropy: ${rec.entropy.toFixed(3)} (${rec.interpretation.level})`);
console.log(`Action: ${rec.interpretation.action}\n`);

// Add evidence
console.log('─'.repeat(50));
console.log('Adding evidence: "Dashboard lights don\'t turn on"\n');
inference.addEvidence('Dashboard lights and electronics are not working');

console.log('Updated probabilities:');
for (const h of inference.hypotheses) {
    console.log(`  [${(h.probability * 100).toFixed(0)}%] ${h.description}`);
}

rec = inference.recommend();
console.log(`\nEntropy: ${rec.entropy.toFixed(3)} (${rec.interpretation.level})`);
console.log(`Action: ${rec.interpretation.action}`);

// Add more evidence
console.log('\n' + '─'.repeat(50));
console.log('Adding evidence: "Headlights also don\'t work"\n');
inference.addEvidence('Headlights and all lights are dead');

console.log('Updated probabilities:');
for (const h of inference.hypotheses) {
    console.log(`  [${(h.probability * 100).toFixed(0)}%] ${h.description}`);
}

rec = inference.recommend();
console.log(`\nEntropy: ${rec.entropy.toFixed(3)} (${rec.interpretation.level})`);
console.log(`Best hypothesis: "${rec.bestHypothesis.description}"`);
console.log(`Confidence margin: ${(rec.confidence * 100).toFixed(0)}%`);
console.log(`Action: ${rec.interpretation.action}`);

// ===========================================
// ENTROPY COMPARISON
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Entropy Analysis of Different States:');
console.log('═'.repeat(50) + '\n');

const reasoner = new EntropyReasoner(backend);

// Different semantic states
const states = [
    { name: 'Certain answer', text: 'The answer is definitely 42' },
    { name: 'Uncertain', text: 'The answer might be 42 or possibly 43 or maybe something else' },
    { name: 'Question', text: 'What is the meaning of life?' },
    { name: 'Contradiction', text: 'It is both true and false simultaneously' }
];

for (const { name, text } of states) {
    const embedding = backend.textToOrderedState(text);
    const entropy = reasoner.normalizedEntropy(embedding);
    const interp = reasoner.interpret(entropy);
    console.log(`${name}:`);
    console.log(`  Text: "${text}"`);
    console.log(`  Entropy: ${entropy.toFixed(3)} (${interp.level})`);
    console.log();
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Entropy measures uncertainty in beliefs/states');
console.log('2. Low entropy = high certainty = proceed confidently');
console.log('3. High entropy = confusion = gather more evidence');
console.log('4. Evidence updates shift probability distribution');
console.log('5. Use entropy to decide when to stop reasoning');
console.log('6. Combine with Bayesian updates for powerful inference');