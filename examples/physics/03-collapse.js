/**
 * @example State Collapse
 * @description Explore quantum-inspired state collapse dynamics
 * 
 * TinyAleph models meaning as quantum-like state collapse:
 * - Superposition of possible meanings
 * - Context provides measurement
 * - Collapse to definite interpretation
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');
const Collapse = require('../../physics/collapse');

console.log('TinyAleph State Collapse Example');
console.log('=================================\n');

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// COLLAPSE BASICS
// ===========================================

console.log('State Collapse Basics:');
console.log('-'.repeat(50) + '\n');

console.log('In TinyAleph, meaning collapse is analogous to quantum measurement:');
console.log('  - Input text exists in superposition of interpretations');
console.log('  - Context acts as measurement operator');
console.log('  - Collapse produces definite meaning\n');

// Create a superposition state
var ambiguousWord = 'bank';  // Could mean financial or river
var state = backend.textToOrderedState(ambiguousWord);

console.log('Ambiguous word: "' + ambiguousWord + '"');
console.log('State norm: ' + state.norm().toFixed(4));
console.log('Components: [' + state.c.slice(0, 4).map(function(v) { return v.toFixed(3); }).join(', ') + '...]\n');

// ===========================================
// CONTEXT-DRIVEN COLLAPSE
// ===========================================

console.log('='.repeat(50));
console.log('Context-Driven Collapse:');
console.log('='.repeat(50) + '\n');

// Different contexts for "bank"
var contexts = [
    { text: 'money deposit account financial', meaning: 'financial institution' },
    { text: 'river water fish stream', meaning: 'river bank' },
    { text: 'airplane turn angle aircraft', meaning: 'banking turn' }
];

function similarity(s1, s2) {
    var dot = 0, m1 = 0, m2 = 0;
    for (var i = 0; i < s1.c.length; i++) {
        dot += s1.c[i] * s2.c[i];
        m1 += s1.c[i] * s1.c[i];
        m2 += s2.c[i] * s2.c[i];
    }
    return dot / (Math.sqrt(m1) * Math.sqrt(m2) || 1);
}

console.log('Context determines meaning collapse:\n');

for (var i = 0; i < contexts.length; i++) {
    var ctx = contexts[i];
    var contextState = backend.textToOrderedState(ctx.text);
    var combinedState = backend.textToOrderedState(ambiguousWord + ' ' + ctx.text);
    
    var sim = similarity(state, contextState);
    
    console.log('Context: "' + ctx.text + '"');
    console.log('  Collapsed meaning: ' + ctx.meaning);
    console.log('  Context-word similarity: ' + (sim * 100).toFixed(1) + '%\n');
}

// ===========================================
// COLLAPSE DYNAMICS
// ===========================================

console.log('='.repeat(50));
console.log('Collapse Dynamics:');
console.log('='.repeat(50) + '\n');

console.log('Collapse can be gradual or sudden depending on context strength.\n');

// Simulate gradual collapse
function interpolateStates(s1, s2, t) {
    var result = Hypercomplex.zero(s1.c.length);
    for (var i = 0; i < result.c.length; i++) {
        result.c[i] = (1 - t) * s1.c[i] + t * s2.c[i];
    }
    return result.normalize();
}

var initialState = backend.textToOrderedState('unclear ambiguous vague');
var finalState = backend.textToOrderedState('clear definite precise');

console.log('Collapse trajectory from unclear to clear:\n');

var ts = [0, 0.25, 0.5, 0.75, 1.0];
for (var i = 0; i < ts.length; i++) {
    var t = ts[i];
    var interpolated = interpolateStates(initialState, finalState, t);
    console.log('  t=' + t.toFixed(2) + ': norm=' + interpolated.norm().toFixed(4) + 
                ', similarity to final=' + (similarity(interpolated, finalState) * 100).toFixed(1) + '%');
}

// ===========================================
// ENTROPY AND COLLAPSE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Entropy and Collapse:');
console.log('='.repeat(50) + '\n');

console.log('Entropy measures uncertainty in the state:');
console.log('  - High entropy: many possible meanings');
console.log('  - Low entropy: definite meaning');
console.log('  - Collapse reduces entropy\n');

function computeEntropy(state) {
    // Treat squared components as probabilities
    var probs = [];
    var sum = 0;
    
    for (var i = 0; i < state.c.length; i++) {
        var p = state.c[i] * state.c[i];
        probs.push(p);
        sum += p;
    }
    
    // Normalize and compute entropy
    var entropy = 0;
    for (var i = 0; i < probs.length; i++) {
        var p = probs[i] / sum;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    }
    
    return entropy;
}

var vague = backend.textToOrderedState('something somewhere somehow');
var specific = backend.textToOrderedState('the cat sat on the mat');

console.log('Entropy comparison:');
console.log('  "something somewhere somehow": H=' + computeEntropy(vague).toFixed(3) + ' bits');
console.log('  "the cat sat on the mat": H=' + computeEntropy(specific).toFixed(3) + ' bits');

// ===========================================
// COLLAPSE REVERSIBILITY
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Collapse (Ir)reversibility:');
console.log('='.repeat(50) + '\n');

console.log('Unlike quantum measurement, semantic collapse can be partially reversed:');
console.log('  - New context can shift interpretation');
console.log('  - But original superposition is lost');
console.log('  - "Garden path" sentences demonstrate this\n');

var gardenPath = 'The horse raced past the barn fell';
console.log('Garden path: "' + gardenPath + '"');
console.log('Initial parse: The horse raced... (active)');
console.log('Reanalysis: The horse [that was] raced past the barn fell (passive)');
console.log('Context forces re-collapse of syntactic interpretation.');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Meaning exists in superposition before context');
console.log('2. Context acts as measurement operator');
console.log('3. Collapse produces definite interpretation');
console.log('4. Entropy measures uncertainty in meaning');
console.log('5. Collapse can be gradual or sudden');
console.log('6. Reanalysis allows partial reversal');