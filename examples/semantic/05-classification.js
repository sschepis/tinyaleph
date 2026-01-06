/**
 * @example Text Classification
 * @description Classify texts into categories using embeddings
 * 
 * TinyAleph enables supervised text classification:
 * - Train category prototypes from labeled examples
 * - Classify new texts by similarity to prototypes
 * - Multi-class and multi-label classification support
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Text Classification Example');
console.log('=====================================\n');

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function similarity(state1, state2) {
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < state1.c.length; i++) {
        dot += state1.c[i] * state2.c[i];
        mag1 += state1.c[i] * state1.c[i];
        mag2 += state2.c[i] * state2.c[i];
    }
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}

// ===========================================
// PROTOTYPE-BASED CLASSIFIER
// ===========================================

console.log('Building Prototype-Based Classifier:');
console.log('─'.repeat(50) + '\n');

class PrototypeClassifier {
    constructor(backend) {
        this.backend = backend;
        this.prototypes = new Map();
    }

    // Train by averaging examples per class
    train(examples) {
        const classEmbeddings = new Map();
        
        // Group embeddings by class
        for (const { text, label } of examples) {
            const state = this.backend.textToOrderedState(text);
            if (!classEmbeddings.has(label)) {
                classEmbeddings.set(label, []);
            }
            classEmbeddings.get(label).push(state);
        }
        
        // Compute prototype for each class
        for (const [label, embeddings] of classEmbeddings) {
            const prototype = Hypercomplex.zero(16);
            for (const emb of embeddings) {
                for (let i = 0; i < 16; i++) {
                    prototype.c[i] += emb.c[i];
                }
            }
            for (let i = 0; i < 16; i++) {
                prototype.c[i] /= embeddings.length;
            }
            this.prototypes.set(label, prototype.normalize());
        }
        
        console.log(`Trained ${this.prototypes.size} class prototypes`);
        for (const [label, proto] of this.prototypes) {
            console.log(`  ${label}: norm=${proto.norm().toFixed(4)}`);
        }
    }

    // Classify a new text
    predict(text) {
        const state = this.backend.textToOrderedState(text);
        
        const scores = [];
        for (const [label, prototype] of this.prototypes) {
            const sim = similarity(state, prototype);
            scores.push({ label, score: sim });
        }
        
        scores.sort((a, b) => b.score - a.score);
        return scores;
    }

    // Classify with confidence threshold
    predictWithThreshold(text, threshold = 0.3) {
        const scores = this.predict(text);
        const prediction = scores[0];
        
        if (prediction.score < threshold) {
            return { label: 'unknown', score: prediction.score, confident: false };
        }
        
        return { ...prediction, confident: true };
    }
}

// ===========================================
// TRAINING DATA
// ===========================================

const trainingData = [
    // Positive sentiment
    { text: 'I love this product amazing quality', label: 'positive' },
    { text: 'Excellent service highly recommended', label: 'positive' },
    { text: 'Best purchase I ever made fantastic', label: 'positive' },
    { text: 'Wonderful experience great value', label: 'positive' },
    { text: 'Absolutely delighted very happy', label: 'positive' },
    
    // Negative sentiment
    { text: 'Terrible product complete waste', label: 'negative' },
    { text: 'Worst experience never again', label: 'negative' },
    { text: 'Very disappointed poor quality', label: 'negative' },
    { text: 'Horrible service would not recommend', label: 'negative' },
    { text: 'Awful broke immediately regret buying', label: 'negative' },
    
    // Neutral sentiment
    { text: 'Average product nothing special', label: 'neutral' },
    { text: 'Standard quality as expected', label: 'neutral' },
    { text: 'Okay for the price basic functionality', label: 'neutral' },
    { text: 'Normal delivery time acceptable', label: 'neutral' },
    { text: 'Regular product does the job', label: 'neutral' }
];

// ===========================================
// TRAIN AND TEST
// ===========================================

const classifier = new PrototypeClassifier(backend);
classifier.train(trainingData);

console.log('\n' + '═'.repeat(50));
console.log('Testing Classification:');
console.log('═'.repeat(50) + '\n');

const testTexts = [
    'This is the best thing ever I am so happy',
    'Terrible awful never buying this again',
    'It works I guess nothing remarkable',
    'Absolutely fantastic exceeded expectations',
    'Broken on arrival very frustrated',
    'Does what it says adequate performance'
];

for (const text of testTexts) {
    const scores = classifier.predict(text);
    const top = scores[0];
    
    console.log(`"${text.substring(0, 40)}..."`);
    console.log(`  Prediction: ${top.label.toUpperCase()} (${(top.score * 100).toFixed(1)}%)`);
    console.log(`  All scores: ${scores.map(s => `${s.label}:${(s.score*100).toFixed(0)}%`).join(', ')}\n`);
}

// ===========================================
// K-NEAREST NEIGHBORS CLASSIFIER
// ===========================================

console.log('═'.repeat(50));
console.log('K-Nearest Neighbors Classification:');
console.log('═'.repeat(50) + '\n');

class KNNClassifier {
    constructor(backend, k = 3) {
        this.backend = backend;
        this.k = k;
        this.trainingSet = [];
    }

    train(examples) {
        this.trainingSet = examples.map(ex => ({
            text: ex.text,
            label: ex.label,
            state: this.backend.textToOrderedState(ex.text)
        }));
        console.log(`Stored ${this.trainingSet.length} training examples`);
    }

    predict(text) {
        const state = this.backend.textToOrderedState(text);
        
        // Compute distances to all training examples
        const distances = this.trainingSet.map(ex => ({
            label: ex.label,
            similarity: similarity(state, ex.state)
        }));
        
        // Sort by similarity (descending)
        distances.sort((a, b) => b.similarity - a.similarity);
        
        // Take k nearest neighbors
        const neighbors = distances.slice(0, this.k);
        
        // Vote
        const votes = new Map();
        for (const n of neighbors) {
            votes.set(n.label, (votes.get(n.label) || 0) + 1);
        }
        
        // Find winner
        let winner = null;
        let maxVotes = 0;
        for (const [label, count] of votes) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = label;
            }
        }
        
        return {
            label: winner,
            votes: maxVotes,
            k: this.k,
            neighbors: neighbors.map(n => ({ label: n.label, sim: n.similarity.toFixed(3) }))
        };
    }
}

const knnClassifier = new KNNClassifier(backend, 3);
knnClassifier.train(trainingData);

console.log('\nKNN predictions:\n');
for (const text of testTexts.slice(0, 4)) {
    const result = knnClassifier.predict(text);
    console.log(`"${text.substring(0, 35)}..."`);
    console.log(`  Prediction: ${result.label.toUpperCase()} (${result.votes}/${result.k} votes)`);
    console.log(`  Neighbors: ${result.neighbors.map(n => n.label).join(', ')}\n`);
}

// ===========================================
// MULTI-LABEL CLASSIFICATION
// ===========================================

console.log('═'.repeat(50));
console.log('Multi-Label Classification:');
console.log('═'.repeat(50) + '\n');

class MultiLabelClassifier {
    constructor(backend, threshold = 0.4) {
        this.backend = backend;
        this.threshold = threshold;
        this.labelPrototypes = new Map();
    }

    train(examples) {
        // Each example can have multiple labels
        const labelEmbeddings = new Map();
        
        for (const { text, labels } of examples) {
            const state = this.backend.textToOrderedState(text);
            for (const label of labels) {
                if (!labelEmbeddings.has(label)) {
                    labelEmbeddings.set(label, []);
                }
                labelEmbeddings.get(label).push(state);
            }
        }
        
        // Compute prototypes
        for (const [label, embeddings] of labelEmbeddings) {
            const prototype = Hypercomplex.zero(16);
            for (const emb of embeddings) {
                for (let i = 0; i < 16; i++) {
                    prototype.c[i] += emb.c[i];
                }
            }
            for (let i = 0; i < 16; i++) {
                prototype.c[i] /= embeddings.length;
            }
            this.labelPrototypes.set(label, prototype.normalize());
        }
    }

    predict(text) {
        const state = this.backend.textToOrderedState(text);
        
        const matchedLabels = [];
        for (const [label, prototype] of this.labelPrototypes) {
            const sim = similarity(state, prototype);
            if (sim >= this.threshold) {
                matchedLabels.push({ label, score: sim });
            }
        }
        
        matchedLabels.sort((a, b) => b.score - a.score);
        return matchedLabels;
    }
}

const multiLabelData = [
    { text: 'breaking news politics election results', labels: ['news', 'politics'] },
    { text: 'celebrity gossip entertainment scandal', labels: ['entertainment', 'celebrity'] },
    { text: 'sports team wins championship title', labels: ['sports', 'news'] },
    { text: 'tech company announces new smartphone', labels: ['tech', 'business', 'news'] },
    { text: 'movie star interview red carpet', labels: ['entertainment', 'celebrity'] },
    { text: 'economic report market analysis', labels: ['business', 'finance'] },
    { text: 'athlete scandal controversy', labels: ['sports', 'celebrity', 'news'] },
    { text: 'startup funding investment round', labels: ['business', 'tech', 'finance'] }
];

const multiClassifier = new MultiLabelClassifier(backend, 0.35);
multiClassifier.train(multiLabelData);

const multiLabelTests = [
    'tech giant stock price soars',
    'famous actor premieres new film',
    'team player sets new record'
];

console.log('Multi-label predictions:\n');
for (const text of multiLabelTests) {
    const labels = multiClassifier.predict(text);
    console.log(`"${text}"`);
    if (labels.length > 0) {
        console.log(`  Labels: ${labels.map(l => `${l.label}(${(l.score*100).toFixed(0)}%)`).join(', ')}\n`);
    } else {
        console.log('  No labels above threshold\n');
    }
}

// ===========================================
// EVALUATION METRICS
// ===========================================

console.log('═'.repeat(50));
console.log('Classifier Evaluation:');
console.log('═'.repeat(50) + '\n');

// Create test set
const testSet = [
    { text: 'Absolutely love it perfect in every way', label: 'positive' },
    { text: 'Complete garbage do not buy', label: 'negative' },
    { text: 'Fine I suppose mediocre quality', label: 'neutral' },
    { text: 'Outstanding exceeded all expectations', label: 'positive' },
    { text: 'Worst thing I ever purchased', label: 'negative' }
];

let correct = 0;
const confusionMatrix = {};

for (const test of testSet) {
    const prediction = classifier.predict(test.text)[0].label;
    const actual = test.label;
    
    if (prediction === actual) correct++;
    
    if (!confusionMatrix[actual]) confusionMatrix[actual] = {};
    confusionMatrix[actual][prediction] = (confusionMatrix[actual][prediction] || 0) + 1;
}

const accuracy = correct / testSet.length;
console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}% (${correct}/${testSet.length})\n`);

console.log('Confusion Matrix:');
const labels = ['positive', 'negative', 'neutral'];
console.log('         ' + labels.map(l => l.substring(0, 5).padStart(8)).join(''));
for (const actual of labels) {
    process.stdout.write(actual.substring(0, 8).padEnd(9));
    for (const pred of labels) {
        const count = confusionMatrix[actual]?.[pred] || 0;
        process.stdout.write(String(count).padStart(8));
    }
    console.log();
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Prototype classifiers average training examples');
console.log('2. KNN uses nearest neighbors for voting');
console.log('3. Multi-label assigns multiple categories');
console.log('4. Threshold controls prediction confidence');
console.log('5. Confusion matrix reveals error patterns');