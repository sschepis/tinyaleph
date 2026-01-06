/**
 * @example Entropy Analysis
 * @description Analyze information entropy in semantic states
 * 
 * Entropy measures uncertainty and information content:
 * - Shannon entropy for discrete distributions
 * - Differential entropy for continuous
 * - Connects to thermodynamics and information theory
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');
const Entropy = require('../../physics/entropy');

console.log('TinyAleph Entropy Analysis Example');
console.log('===================================\n');

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// ENTROPY BASICS
// ===========================================

console.log('Entropy Basics:');
console.log('-'.repeat(50) + '\n');

console.log('Shannon entropy: H(X) = -Σ p(x) log₂ p(x)');
console.log('');
console.log('Properties:');
console.log('  - H ≥ 0 (always non-negative)');
console.log('  - H = 0 for certainty (single outcome)');
console.log('  - H = log₂(n) for uniform distribution over n outcomes');
console.log('');

// ===========================================
// COMPUTING ENTROPY
// ===========================================

console.log('='.repeat(50));
console.log('Computing Entropy:');
console.log('='.repeat(50) + '\n');

function shannonEntropy(probs) {
    var H = 0;
    for (var i = 0; i < probs.length; i++) {
        if (probs[i] > 0) {
            H -= probs[i] * Math.log2(probs[i]);
        }
    }
    return H;
}

// Examples
var certain = [1, 0, 0, 0];
var uniform = [0.25, 0.25, 0.25, 0.25];
var biased = [0.7, 0.2, 0.07, 0.03];
var binary = [0.5, 0.5];

console.log('Distribution            Entropy');
console.log('-'.repeat(40));
console.log('Certain [1,0,0,0]:      ' + shannonEntropy(certain).toFixed(3) + ' bits');
console.log('Uniform [.25,.25,.25,.25]: ' + shannonEntropy(uniform).toFixed(3) + ' bits');
console.log('Biased [.7,.2,.07,.03]: ' + shannonEntropy(biased).toFixed(3) + ' bits');
console.log('Binary [.5,.5]:         ' + shannonEntropy(binary).toFixed(3) + ' bits');

// ===========================================
// SEMANTIC STATE ENTROPY
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Semantic State Entropy:');
console.log('='.repeat(50) + '\n');

function stateEntropy(state) {
    // Treat squared normalized components as probabilities
    var probs = [];
    var sum = 0;
    
    for (var i = 0; i < state.c.length; i++) {
        var p = state.c[i] * state.c[i];
        probs.push(p);
        sum += p;
    }
    
    // Normalize
    for (var i = 0; i < probs.length; i++) {
        probs[i] /= sum;
    }
    
    return shannonEntropy(probs);
}

var texts = [
    'a',
    'the cat',
    'the quick brown fox jumps over the lazy dog',
    'asjdkfh qwerty zxcvbn random nonsense words gibberish'
];

console.log('Text entropy (16-dimensional state):\n');

for (var i = 0; i < texts.length; i++) {
    var text = texts[i];
    var state = backend.textToOrderedState(text);
    var H = stateEntropy(state);
    console.log('  "' + text.substring(0, 35) + (text.length > 35 ? '...' : '') + '"');
    console.log('    Entropy: ' + H.toFixed(3) + ' bits\n');
}

// ===========================================
// ENTROPY AND MEANING
// ===========================================

console.log('='.repeat(50));
console.log('Entropy and Meaning:');
console.log('='.repeat(50) + '\n');

console.log('Low entropy states:');
console.log('  - Concentrated, specific meaning');
console.log('  - Few active dimensions');
console.log('  - Clear, unambiguous\n');

console.log('High entropy states:');
console.log('  - Distributed, general meaning');
console.log('  - Many active dimensions');
console.log('  - Vague, ambiguous\n');

// Compare specific vs general texts
var specific = backend.textToOrderedState('hydrogen atom electron orbital');
var general = backend.textToOrderedState('thing stuff entity concept');

console.log('Comparison:');
console.log('  "hydrogen atom electron orbital": H=' + stateEntropy(specific).toFixed(3) + ' bits');
console.log('  "thing stuff entity concept": H=' + stateEntropy(general).toFixed(3) + ' bits');

// ===========================================
// CONDITIONAL ENTROPY
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Conditional Entropy:');
console.log('='.repeat(50) + '\n');

console.log('H(Y|X): Uncertainty in Y given knowledge of X');
console.log('H(Y|X) ≤ H(Y): Conditioning reduces entropy\n');

function conditionalEntropy(stateY, stateX) {
    // Simplified: measure how much Y's entropy decreases given X
    var Hy = stateEntropy(stateY);
    
    // Combine states
    var combined = Hypercomplex.zero(stateY.c.length);
    for (var i = 0; i < combined.c.length; i++) {
        combined.c[i] = (stateY.c[i] + stateX.c[i]) / 2;
    }
    var Hxy = stateEntropy(combined.normalize());
    
    // H(Y|X) ≈ H(X,Y) - H(X)
    return Math.max(0, Hxy);
}

var y = backend.textToOrderedState('animal');
var x1 = backend.textToOrderedState('cat');  // Specific context
var x2 = backend.textToOrderedState('thing');  // Vague context

console.log('Uncertainty about "animal" given context:\n');
console.log('  H(animal): ' + stateEntropy(y).toFixed(3) + ' bits');
console.log('  H(animal|cat): ' + conditionalEntropy(y, x1).toFixed(3) + ' bits');
console.log('  H(animal|thing): ' + conditionalEntropy(y, x2).toFixed(3) + ' bits');

// ===========================================
// RELATIVE ENTROPY (KL DIVERGENCE)
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Relative Entropy (KL Divergence):');
console.log('='.repeat(50) + '\n');

console.log('D_KL(P||Q) = Σ P(x) log(P(x)/Q(x))');
console.log('Measures "distance" between distributions.\n');

function klDivergence(state1, state2) {
    var probs1 = [], probs2 = [];
    var sum1 = 0, sum2 = 0;
    
    for (var i = 0; i < state1.c.length; i++) {
        var p1 = state1.c[i] * state1.c[i];
        var p2 = state2.c[i] * state2.c[i];
        probs1.push(p1);
        probs2.push(p2);
        sum1 += p1;
        sum2 += p2;
    }
    
    var kl = 0;
    for (var i = 0; i < probs1.length; i++) {
        var p = probs1[i] / sum1;
        var q = probs2[i] / sum2 + 1e-10;  // Avoid log(0)
        if (p > 0) {
            kl += p * Math.log2(p / q);
        }
    }
    
    return kl;
}

var cat = backend.textToOrderedState('cat');
var dog = backend.textToOrderedState('dog');
var car = backend.textToOrderedState('car');

console.log('KL divergence between concepts:\n');
console.log('  D(cat||dog) = ' + klDivergence(cat, dog).toFixed(3) + ' bits');
console.log('  D(cat||car) = ' + klDivergence(cat, car).toFixed(3) + ' bits');
console.log('  D(dog||car) = ' + klDivergence(dog, car).toFixed(3) + ' bits');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Entropy measures uncertainty in a state');
console.log('2. Low entropy = specific, high entropy = vague');
console.log('3. Context reduces conditional entropy');
console.log('4. KL divergence measures state divergence');
console.log('5. Entropy connects information and thermodynamics');
console.log('6. TinyAleph uses entropy for semantic analysis');