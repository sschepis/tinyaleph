/**
 * @example Concept Learning
 * @description Learn new concepts from examples
 * 
 * This example shows how to use TinyAleph for few-shot concept learning:
 * - Define concepts from positive/negative examples
 * - Generalize to new instances
 * - Build concept hierarchies
 * - Handle edge cases
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// CONCEPT LEARNER
// ===========================================

class ConceptLearner {
    constructor(backend) {
        this.backend = backend;
        this.concepts = new Map();
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

    // Learn a concept from examples
    learnConcept(name, positiveExamples, negativeExamples = []) {
        // Encode all examples
        const posEmbeddings = positiveExamples.map(ex => this.backend.textToOrderedState(ex));
        const negEmbeddings = negativeExamples.map(ex => this.backend.textToOrderedState(ex));

        // Compute centroid of positive examples
        const centroid = Hypercomplex.zero(16);
        for (const emb of posEmbeddings) {
            for (let i = 0; i < 16; i++) {
                centroid.c[i] += emb.c[i] / posEmbeddings.length;
            }
        }

        // Compute variance (how spread out the examples are)
        let variance = 0;
        for (const emb of posEmbeddings) {
            const dist = 1 - this.similarity(emb, centroid);
            variance += dist * dist;
        }
        variance = Math.sqrt(variance / posEmbeddings.length);

        // Compute boundary (based on negative examples)
        let threshold = 0.5;
        if (negEmbeddings.length > 0) {
            const negSims = negEmbeddings.map(emb => this.similarity(emb, centroid));
            const maxNegSim = Math.max(...negSims);
            const minPosSim = Math.min(...posEmbeddings.map(emb => this.similarity(emb, centroid)));
            threshold = (maxNegSim + minPosSim) / 2;
        }

        this.concepts.set(name, {
            name,
            centroid,
            variance,
            threshold,
            positiveExamples,
            negativeExamples
        });

        return { variance, threshold };
    }

    // Classify a new instance
    classify(instance) {
        const embedding = this.backend.textToOrderedState(instance);
        const results = [];

        for (const [name, concept] of this.concepts) {
            const sim = this.similarity(embedding, concept.centroid);
            const isMember = sim > concept.threshold;
            const confidence = isMember 
                ? (sim - concept.threshold) / (1 - concept.threshold)
                : (concept.threshold - sim) / concept.threshold;

            results.push({
                concept: name,
                similarity: sim,
                threshold: concept.threshold,
                isMember,
                confidence: Math.abs(confidence)
            });
        }

        results.sort((a, b) => b.similarity - a.similarity);
        return results;
    }

    // Find the best matching concept
    bestMatch(instance) {
        const results = this.classify(instance);
        const members = results.filter(r => r.isMember);
        return members.length > 0 ? members[0] : null;
    }

    // Generate prototype (most typical instance description)
    getPrototype(conceptName) {
        const concept = this.concepts.get(conceptName);
        if (!concept) return null;

        // The centroid represents the prototype
        // Return the most similar positive example
        let bestExample = null;
        let bestSim = -1;

        for (const ex of concept.positiveExamples) {
            const sim = this.similarity(this.backend.textToOrderedState(ex), concept.centroid);
            if (sim > bestSim) {
                bestSim = sim;
                bestExample = ex;
            }
        }

        return { prototype: bestExample, typicality: bestSim };
    }
}

// ===========================================
// EXAMPLE: LEARNING ANIMALS
// ===========================================

console.log('TinyAleph Concept Learning Example');
console.log('===================================\n');

const learner = new ConceptLearner(backend);

// Learn "bird" concept
console.log('Learning concept: BIRD');
const birdStats = learner.learnConcept('bird', [
    'a small feathered creature that flies',
    'an animal with wings and a beak',
    'a creature that lays eggs and has feathers',
    'a flying animal that sings in trees'
], [
    'a furry animal with four legs',
    'a fish that swims in water',
    'an insect with six legs'
]);
console.log(`  Variance: ${birdStats.variance.toFixed(3)}, Threshold: ${birdStats.threshold.toFixed(3)}`);

// Learn "mammal" concept
console.log('Learning concept: MAMMAL');
const mammalStats = learner.learnConcept('mammal', [
    'a warm-blooded animal with fur',
    'a creature that gives live birth and nurses young',
    'an animal with hair that feeds milk to babies'
], [
    'a cold-blooded reptile',
    'an animal that lays eggs',
    'a fish with scales'
]);
console.log(`  Variance: ${mammalStats.variance.toFixed(3)}, Threshold: ${mammalStats.threshold.toFixed(3)}`);

// Learn "vehicle" concept
console.log('Learning concept: VEHICLE');
const vehicleStats = learner.learnConcept('vehicle', [
    'a machine used for transportation',
    'a car that drives on roads',
    'a truck that carries cargo',
    'an automobile with wheels and engine'
], [
    'a bicycle powered by pedaling',
    'a horse that carries riders',
    'a boat that floats on water'
]);
console.log(`  Variance: ${vehicleStats.variance.toFixed(3)}, Threshold: ${vehicleStats.threshold.toFixed(3)}\n`);

// ===========================================
// CLASSIFY NEW INSTANCES
// ===========================================

console.log('===================================');
console.log('Classifying new instances:');
console.log('===================================\n');

const testInstances = [
    'a sparrow with colorful feathers',
    'a dog with soft fur',
    'a sedan automobile',
    'a penguin that cannot fly',  // Edge case!
    'a bat that flies at night',  // Tricky!
    'a robot car that drives itself'
];

for (const instance of testInstances) {
    const results = learner.classify(instance);
    const best = results[0];
    
    console.log(`"${instance}"`);
    console.log(`  Best match: ${best.concept} (sim: ${best.similarity.toFixed(3)}, member: ${best.isMember ? 'YES' : 'NO'})`);
    
    // Show all matches
    for (const r of results) {
        const status = r.isMember ? '✓' : '✗';
        console.log(`    ${status} ${r.concept}: ${(r.similarity * 100).toFixed(1)}%`);
    }
    console.log();
}

// ===========================================
// CONCEPT PROTOTYPES
// ===========================================

console.log('===================================');
console.log('Concept Prototypes:');
console.log('===================================\n');

for (const [name, _] of learner.concepts) {
    const proto = learner.getPrototype(name);
    console.log(`${name.toUpperCase()}:`);
    console.log(`  Most typical: "${proto.prototype}"`);
    console.log(`  Typicality: ${(proto.typicality * 100).toFixed(1)}%\n`);
}

// ===========================================
// INCREMENTAL LEARNING
// ===========================================

console.log('===================================');
console.log('Incremental Learning:');
console.log('===================================\n');

// Add more examples to refine the concept
console.log('Adding more bird examples...');
learner.learnConcept('bird', [
    ...learner.concepts.get('bird').positiveExamples,
    'an eagle soaring in the sky',
    'a parrot that can mimic speech',
    'a penguin that swims but cannot fly'
], [
    ...learner.concepts.get('bird').negativeExamples,
    'a bat that uses echolocation'
]);

// Re-test penguin
const penguinResult = learner.classify('a penguin that cannot fly');
console.log(`Re-classifying "penguin that cannot fly":`);
console.log(`  Bird similarity: ${(penguinResult.find(r => r.concept === 'bird').similarity * 100).toFixed(1)}%`);

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n===================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Concepts are learned from positive/negative examples');
console.log('2. Centroids represent the "prototype" of a concept');
console.log('3. Thresholds separate members from non-members');
console.log('4. Variance indicates how tightly defined a concept is');
console.log('5. Edge cases (penguin, bat) reveal concept boundaries');
console.log('6. Incremental learning refines concepts over time');