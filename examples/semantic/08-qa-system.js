/**
 * @example Question-Answering System
 * @description Build a QA system using semantic embeddings
 * 
 * TinyAleph can power question-answering systems:
 * - Embed knowledge base passages
 * - Match questions to relevant passages
 * - Extract and rank answers
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Question-Answering System Example');
console.log('============================================\n');

// ===========================================
// KNOWLEDGE BASE
// ===========================================

var knowledgeBase = [
    {
        id: 'kb1',
        topic: 'Solar System',
        passage: 'The Solar System consists of the Sun and the objects that orbit it, including eight planets, dwarf planets, moons, asteroids, and comets. The four inner planets are Mercury, Venus, Earth, and Mars. The four outer planets are Jupiter, Saturn, Uranus, and Neptune.'
    },
    {
        id: 'kb2',
        topic: 'Earth',
        passage: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has one natural satellite called the Moon. Earth is about 4.5 billion years old and has a diameter of approximately 12,742 kilometers.'
    },
    {
        id: 'kb3',
        topic: 'Moon',
        passage: 'The Moon is Earth\'s only natural satellite. It is the fifth-largest satellite in the Solar System. The Moon orbits Earth at an average distance of 384,400 kilometers. It takes about 27.3 days to complete one orbit around Earth.'
    },
    {
        id: 'kb4',
        topic: 'Photosynthesis',
        passage: 'Photosynthesis is the process by which plants and other organisms convert sunlight, water, and carbon dioxide into glucose and oxygen. Chlorophyll, the green pigment in plants, absorbs light energy for this process.'
    },
    {
        id: 'kb5',
        topic: 'Water Cycle',
        passage: 'The water cycle describes how water evaporates from oceans and land, rises into the atmosphere, condenses into clouds, and falls back as precipitation. This cycle continuously moves water around the Earth.'
    },
    {
        id: 'kb6',
        topic: 'DNA',
        passage: 'DNA (deoxyribonucleic acid) is the molecule that carries genetic information in all living organisms. It consists of two strands that form a double helix structure. DNA is made up of four nucleotide bases: adenine, thymine, guanine, and cytosine.'
    },
    {
        id: 'kb7',
        topic: 'Gravity',
        passage: 'Gravity is a fundamental force that attracts any two objects with mass. On Earth, gravity gives objects weight and causes them to fall toward the ground. The gravitational force between objects depends on their masses and the distance between them.'
    },
    {
        id: 'kb8',
        topic: 'Evolution',
        passage: 'Evolution is the process by which species change over time through natural selection. Organisms with traits better suited to their environment are more likely to survive and reproduce, passing those traits to offspring.'
    }
];

// ===========================================
// QA SYSTEM CLASS
// ===========================================

function similarity(state1, state2) {
    var dot = 0, mag1 = 0, mag2 = 0;
    for (var i = 0; i < state1.c.length; i++) {
        dot += state1.c[i] * state2.c[i];
        mag1 += state1.c[i] * state1.c[i];
        mag2 += state2.c[i] * state2.c[i];
    }
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}

function QASystem(backend) {
    this.backend = backend;
    this.passages = [];
    this.embeddings = [];
}

QASystem.prototype.loadKnowledge = function(passages) {
    var self = this;
    this.passages = passages;
    this.embeddings = passages.map(function(p) {
        return {
            id: p.id,
            embedding: self.backend.textToOrderedState(p.passage)
        };
    });
    console.log('Loaded ' + passages.length + ' knowledge passages');
};

QASystem.prototype.findRelevantPassages = function(question, topK) {
    topK = topK || 3;
    var questionEmb = this.backend.textToOrderedState(question);
    
    var self = this;
    var scored = this.embeddings.map(function(e) {
        return {
            id: e.id,
            score: similarity(questionEmb, e.embedding)
        };
    });
    
    scored.sort(function(a, b) { return b.score - a.score; });
    
    return scored.slice(0, topK).map(function(item) {
        var passage = self.passages.find(function(p) { return p.id === item.id; });
        return {
            passage: passage,
            score: item.score
        };
    });
};

QASystem.prototype.answer = function(question) {
    var relevantPassages = this.findRelevantPassages(question, 2);
    
    if (relevantPassages.length === 0 || relevantPassages[0].score < 0.2) {
        return {
            answer: 'I don\'t have enough information to answer that question.',
            confidence: 0,
            sources: []
        };
    }
    
    // In a real system, you'd use NLP to extract the answer
    // Here we return the most relevant passage as the answer
    var topPassage = relevantPassages[0];
    
    return {
        answer: topPassage.passage.passage,
        confidence: topPassage.score,
        topic: topPassage.passage.topic,
        sources: relevantPassages.map(function(r) {
            return { topic: r.passage.topic, score: r.score };
        })
    };
};

// ===========================================
// BUILD QA SYSTEM
// ===========================================

console.log('Building QA System:');
console.log('-'.repeat(50) + '\n');

var qaSystem = new QASystem(backend);
qaSystem.loadKnowledge(knowledgeBase);

// ===========================================
// TEST QUESTIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Testing Questions:');
console.log('='.repeat(50) + '\n');

var questions = [
    'How many planets are in our solar system?',
    'What is the Moon and how far is it from Earth?',
    'How do plants make their food?',
    'What is DNA made of?',
    'Why do things fall down?',
    'How do species change over time?',
    'What is the water cycle?'
];

for (var q = 0; q < questions.length; q++) {
    var question = questions[q];
    console.log('Q: ' + question);
    
    var result = qaSystem.answer(question);
    
    console.log('Topic: ' + result.topic);
    console.log('Confidence: ' + (result.confidence * 100).toFixed(1) + '%');
    console.log('Answer: ' + result.answer.substring(0, 120) + '...');
    console.log('');
}

// ===========================================
// MULTI-HOP QUESTIONS
// ===========================================

console.log('='.repeat(50));
console.log('Multi-Hop Question Answering:');
console.log('='.repeat(50) + '\n');

console.log('For complex questions, combine multiple passages:\n');

var complexQuestion = 'What orbits Earth and how does gravity affect it?';
console.log('Q: ' + complexQuestion + '\n');

var passages = qaSystem.findRelevantPassages(complexQuestion, 3);
console.log('Relevant passages found:');
for (var p = 0; p < passages.length; p++) {
    var passage = passages[p];
    console.log('  ' + (p + 1) + '. ' + passage.passage.topic + ' (' + (passage.score * 100).toFixed(1) + '%)');
}

console.log('\nCombined answer would draw from:');
console.log('  - Moon passage (for what orbits Earth)');
console.log('  - Gravity passage (for gravitational effects)');

// ===========================================
// QUESTION TYPES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Handling Different Question Types:');
console.log('='.repeat(50) + '\n');

var questionTypes = [
    { type: 'What', question: 'What is photosynthesis?' },
    { type: 'How', question: 'How does water cycle work?' },
    { type: 'Why', question: 'Why do organisms evolve?' },
    { type: 'When', question: 'When did Earth form?' },
    { type: 'How many', question: 'How many bases are in DNA?' }
];

for (var qt = 0; qt < questionTypes.length; qt++) {
    var item = questionTypes[qt];
    var result = qaSystem.answer(item.question);
    
    console.log('[' + item.type + '] ' + item.question);
    console.log('  Found: ' + result.topic + ' (' + (result.confidence * 100).toFixed(1) + '%)');
    console.log('');
}

// ===========================================
// CONFIDENCE THRESHOLDING
// ===========================================

console.log('='.repeat(50));
console.log('Confidence Thresholding:');
console.log('='.repeat(50) + '\n');

var outOfDomainQuestions = [
    'What is the capital of France?',
    'How do I bake a cake?',
    'What is the stock price today?'
];

console.log('Questions outside the knowledge base:\n');

for (var odq = 0; odq < outOfDomainQuestions.length; odq++) {
    var question = outOfDomainQuestions[odq];
    var result = qaSystem.answer(question);
    
    console.log('Q: ' + question);
    console.log('  Best match: ' + (result.topic || 'None') + ' (' + (result.confidence * 100).toFixed(1) + '%)');
    
    if (result.confidence < 0.3) {
        console.log('  Status: LOW CONFIDENCE - may not be answerable');
    }
    console.log('');
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Embed knowledge passages for semantic retrieval');
console.log('2. Questions are matched to passages by similarity');
console.log('3. Confidence scores indicate answer reliability');
console.log('4. Multi-hop questions need multiple passages');
console.log('5. Low confidence indicates out-of-domain queries');
console.log('6. Combine with NLP for answer extraction');