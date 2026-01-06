/**
 * @example DNA-Inspired Encoding
 * @description Explore biological-inspired text processing
 * 
 * TinyAleph implements DNA-like text processing inspired by molecular biology:
 * - Bidirectional processing (boustrophedon reading)
 * - Codon-style triplet chunking
 * - 6-frame reading (like DNA translation)
 * - Sense/antisense duality
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph DNA-Inspired Encoding Example');
console.log('=======================================\n');

// ===========================================
// BIDIRECTIONAL PROCESSING
// ===========================================

console.log('Bidirectional Processing (Boustrophedon):');
console.log('-'.repeat(50) + '\n');

const text = 'The quick brown fox jumps over the lazy dog';

// Tokenize first
const tokens = backend.encodeOrdered(text);

// Standard forward encoding
const forwardState = backend.textToOrderedState(text);

// Bidirectional encoding (alternating direction per line)
const bidirectionalState = backend.bidirectionalState(tokens);

console.log('Input: "' + text + '"\n');

// Show how bidirectional differs
console.log('Forward state (first 4 components):');
console.log('  [' + forwardState.c.slice(0, 4).map(function(v) { return v.toFixed(4); }).join(', ') + ']');

console.log('\nBidirectional state (first 4 components):');
console.log('  [' + bidirectionalState.c.slice(0, 4).map(function(v) { return v.toFixed(4); }).join(', ') + ']');

// Similarity between approaches
function similarity(s1, s2) {
    var dot = 0, m1 = 0, m2 = 0;
    for (var i = 0; i < s1.c.length; i++) {
        dot += s1.c[i] * s2.c[i];
        m1 += s1.c[i] * s1.c[i];
        m2 += s2.c[i] * s2.c[i];
    }
    return dot / (Math.sqrt(m1) * Math.sqrt(m2) || 1);
}

var simValue = similarity(forwardState, bidirectionalState) * 100;
console.log('\nSimilarity between approaches: ' + simValue.toFixed(1) + '%');

// ===========================================
// CODON-STYLE TRIPLET CHUNKING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Codon-Style Triplet Chunking:');
console.log('='.repeat(50) + '\n');

// Tokenize first (reuse tokens from above)
console.log('Tokens: [' + tokens.slice(0, 6).map(function(t) { return t.word; }).join(', ') + '...] (' + tokens.length + ' total)\n');

// Create codons (triplets)
var codons = backend.tokensToCodons(tokens);
console.log('Codons (triplets of primes):');
for (var i = 0; i < Math.min(4, codons.length); i++) {
    var codonPrimes = codons[i].primes || codons[i];
    console.log('  Codon ' + (i + 1) + ': [' + codonPrimes.join(', ') + ']');
}
console.log('  ... (' + codons.length + ' codons total)');

// ===========================================
// 6-FRAME READING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('6-Frame Reading (Like DNA Translation):');
console.log('='.repeat(50) + '\n');

console.log('DNA has 6 reading frames:');
console.log('  Forward:  +1 (start at 0), +2 (start at 1), +3 (start at 2)');
console.log('  Reverse:  -1 (reverse, start at 0), -2 (reverse, start at 1), -3 (reverse, start at 2)');
console.log('');

var frames = backend.readingFrameStates(tokens);

console.log('Reading frame embeddings:');
for (var i = 0; i < frames.length; i++) {
    var frame = frames[i];
    var state = frame.state;
    var norm = state.norm();
    var firstComp = state.c[0].toFixed(4);
    var frameName = frame.direction + '_' + frame.offset;
    console.log('  ' + frameName + ': norm=' + norm.toFixed(4) + ', c[0]=' + firstComp);
}

// Compare frame similarities
console.log('\nFrame similarity matrix:');
var frameNames = frames.map(function(f) { return f.direction + '_' + f.offset; });
var frameStates = frames.map(function(f) { return f.state; });

process.stdout.write('     ');
for (var n = 0; n < frameNames.length; n++) {
    process.stdout.write(frameNames[n].padStart(6));
}
console.log();

for (var i = 0; i < frameNames.length; i++) {
    process.stdout.write(frameNames[i].padEnd(5));
    for (var j = 0; j < frameNames.length; j++) {
        var sim = similarity(frameStates[i], frameStates[j]) * 100;
        process.stdout.write(sim.toFixed(0).padStart(5) + '%');
    }
    console.log();
}

// ===========================================
// SENSE/ANTISENSE DUALITY
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Sense/Antisense Duality:');
console.log('='.repeat(50) + '\n');

console.log('In DNA, each strand has a complement:');
console.log('  - Sense strand: carries the coding information');
console.log('  - Antisense strand: complementary, reversed');
console.log('');
console.log('TinyAleph creates dual representations by:');
console.log('  1. Sense: forward prime encoding');
console.log('  2. Antisense: reversed token sequence');
console.log('');

var dual = backend.dualRepresentation(tokens);

console.log('Sense strand (forward):');
console.log('  First 4: [' + dual.sense.c.slice(0, 4).map(function(v) { return v.toFixed(3); }).join(', ') + ']');

console.log('\nAntisense strand (reversed):');
console.log('  First 4: [' + dual.antisense.c.slice(0, 4).map(function(v) { return v.toFixed(3); }).join(', ') + ']');

var dualSim = similarity(dual.sense, dual.antisense) * 100;
console.log('\nSense-Antisense similarity: ' + dualSim.toFixed(1) + '%');

// ===========================================
// DNA ENCODING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Full DNA Encoding:');
console.log('='.repeat(50) + '\n');

var dnaResult = backend.dnaEncode(text);

console.log('DNA encoding produces:');
console.log('  - Combined state (all frames merged)');
console.log('  - Dual representation (sense + antisense)');
console.log('  - Reading frames (6 offset encodings)');
console.log('  - Codons (triplet groupings)');

console.log('\nCombined state norm: ' + dnaResult.combined.norm().toFixed(4));
console.log('Number of codons: ' + dnaResult.codons.length);
console.log('Frames available: ' + Object.keys(dnaResult.frames).join(', '));

// ===========================================
// PRACTICAL APPLICATION: ROBUST MATCHING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Practical Application: Robust Text Matching');
console.log('='.repeat(50) + '\n');

var documents = [
    'The quick brown fox jumps over the lazy dog',
    'A fast brown fox leaps over a sleepy dog',
    'The lazy dog was jumped over by a quick fox',
    'Machine learning algorithms process data'
];

console.log('Using DNA encoding for robust similarity:\n');

var query = 'brown fox jumps lazy dog';
var queryDna = backend.dnaEncode(query);

for (var d = 0; d < documents.length; d++) {
    var doc = documents[d];
    var docDna = backend.dnaEncode(doc);
    
    // Compare using combined states
    var combinedSim = similarity(queryDna.combined, docDna.combined);
    
    // Compare sense-to-sense
    var senseSim = similarity(queryDna.dual.sense, docDna.dual.sense);
    
    // Compare sense-to-antisense (for reversed order matches)
    var crossSim = similarity(queryDna.dual.sense, docDna.dual.antisense);
    
    var maxSim = Math.max(combinedSim, senseSim, crossSim);
    
    console.log('"' + doc.substring(0, 45) + '..."');
    console.log('  Combined: ' + (combinedSim * 100).toFixed(1) + '%, Sense: ' + (senseSim * 100).toFixed(1) + '%, Cross: ' + (crossSim * 100).toFixed(1) + '%');
    console.log('  Best match: ' + (maxSim * 100).toFixed(1) + '%\n');
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Bidirectional encoding captures reading patterns');
console.log('2. Codon triplets group related tokens');
console.log('3. 6 reading frames provide multiple perspectives');
console.log('4. Sense/antisense handles word order variation');
console.log('5. DNA encoding enables robust text matching');
console.log('6. Combined representations merge all frames');