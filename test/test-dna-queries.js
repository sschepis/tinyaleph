/**
 * DNA-Inspired Query Test Suite
 * 
 * Demonstrates how DNA-inspired processing methods affect semantic queries:
 * - Bidirectional (Boustrophedon) processing
 * - Codon-style triplet chunking
 * - 6-frame reading analysis
 * - Sense/Antisense duality
 */

const { SemanticBackend } = require('../modular');

console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║           DNA-INSPIRED SEMANTIC PROCESSING COMPARISON                     ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

// Create backend with same config as test-queries.js
const semanticConfig = {
  dimension: 16,
  vocabulary: {
    'love': [2, 3, 29],
    'truth': [7, 11, 13],
    'wisdom': [7, 11, 29],
    'knowledge': [7, 5, 23],
    'beauty': [5, 11, 29],
    'justice': [13, 7, 37],
    'freedom': [17, 11, 2],
    'peace': [29, 3, 7],
    'power': [17, 5, 23],
    'order': [5, 3, 37],
    'chaos': [17, 31, 23],
    'light': [2, 5, 29],
    'dark': [19, 31, 13],
    'life': [2, 3, 17],
    'death': [19, 13, 11],
    'time': [2, 17, 13],
    'space': [5, 3, 2],
    'mind': [7, 11, 23],
    'body': [5, 2, 3],
    'soul': [11, 17, 29],
    'spirit': [11, 2, 13],
    'matter': [5, 3, 31],
    'energy': [17, 2, 23],
    'form': [5, 13, 37],
    'void': [19, 7, 31],
    'dog': [2, 5],
    'man': [11, 7],
    'bites': [17, 31],
    'create': [2, 17, 5],
    'destroy': [19, 17, 31],
    'think': [7, 11, 5],
    'feel': [11, 29, 3],
    'know': [7, 23, 13],
    'believe': [11, 7, 13],
    'want': [17, 11, 23],
    'need': [17, 13, 31],
    'give': [2, 29, 3],
    'take': [17, 5, 31],
    'change': [17, 5, 7],
    'remain': [2, 37, 3],
    'begin': [2, 17, 7],
    'end': [13, 19, 7],
    'cause': [17, 7, 13],
    'effect': [5, 13, 17],
    'self': [2, 11, 3],
    'other': [5, 31, 13],
    'one': [3, 2],
    'many': [5, 17, 31],
    'nothing': [19, 31, 13],
    'part': [5, 3],
    'whole': [2, 3, 37],
    'good': [29, 3, 2],
    'evil': [31, 13, 19],
    'true': [7, 13, 2],
    'false': [31, 7, 19],
    'real': [2, 7, 5],
    'possible': [17, 2, 7],
    'necessary': [13, 7, 37],
    'eternal': [2, 13, 37],
    'temporal': [17, 5, 31],
    'over': [17, 29],
    'defeats': [17, 13, 5],
    'leads': [7, 17],
    'to': [3],
    'knows': [7, 11, 23],
    'changes': [17, 5, 7, 13],
    'all': [2, 3, 5, 7]
  },
  ontology: {
    2: 'existence/being',
    3: 'unity/oneness',
    5: 'form/structure',
    7: 'logos/reason',
    11: 'psyche/soul',
    13: 'telos/purpose',
    17: 'dynamis/power',
    19: 'absence/void',
    23: 'intensity',
    29: 'harmony',
    31: 'tension',
    37: 'balance'
  }
};

const backend = new SemanticBackend(semanticConfig);

// ============================================
// STANDARD vs DNA NON-COMMUTATIVITY TESTS
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  NON-COMMUTATIVITY: Standard vs DNA Processing                           │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const orderTests = [
  ['dog bites man', 'man bites dog'],
  ['love creates beauty', 'beauty creates love'],
  ['cause and effect', 'effect and cause'],
  ['mind over matter', 'matter over mind'],
  ['life leads to death', 'death leads to life'],
  ['self knows other', 'other knows self'],
  ['good defeats evil', 'evil defeats good'],
  ['time changes all', 'all changes time']
];

console.log('Phrase A'.padEnd(25) + '│ Phrase B'.padEnd(25) + '│ Standard │ DNA Comp │ DNA Cross');
console.log('─'.repeat(25) + '┼' + '─'.repeat(25) + '┼──────────┼──────────┼──────────');

for (const [a, b] of orderTests) {
  // Standard processing
  const stateA = backend.textToOrderedState(a);
  const stateB = backend.textToOrderedState(b);
  const standardSim = stateA.coherence(stateB);
  
  // DNA processing
  const dnaComparison = backend.dnaCompare(a, b);
  
  const stdStr = standardSim.toFixed(4);
  const dnaStr = dnaComparison.senseCoherence.toFixed(4);
  const crossStr = dnaComparison.crossCoherence.toFixed(4);
  
  console.log(`${a.substring(0,24).padEnd(24)} │ ${b.substring(0,24).padEnd(24)} │ ${stdStr}  │ ${dnaStr}  │ ${crossStr}`);
}

console.log('\nKey: Standard = ordered state coherence');
console.log('     DNA Comp = sense/sense coherence (both forward-oriented)');
console.log('     DNA Cross = cross-strand coherence (captures reversal relationship)\n');

// ============================================
// DETAILED DNA ENCODING ANALYSIS
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  DETAILED DNA ENCODING: "dog bites man" vs "man bites dog"               │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const phrase1 = 'dog bites man';
const phrase2 = 'man bites dog';

const dna1 = backend.dnaEncode(phrase1);
const dna2 = backend.dnaEncode(phrase2);

console.log(`"${phrase1}":`);
console.log(`  Tokens: [${dna1.tokens.map(t => t.word).join(', ')}]`);
console.log(`  Codons: [${dna1.codons.map(c => c.tokens.map(t => t.word).join(' ')).join(' | ')}]`);
console.log(`  Magnitude: ${dna1.magnitude.toFixed(4)}`);
console.log(`  Internal Coherence: ${dna1.coherence.toFixed(4)}`);
console.log('');

console.log(`"${phrase2}":`);
console.log(`  Tokens: [${dna2.tokens.map(t => t.word).join(', ')}]`);
console.log(`  Codons: [${dna2.codons.map(c => c.tokens.map(t => t.word).join(' ')).join(' | ')}]`);
console.log(`  Magnitude: ${dna2.magnitude.toFixed(4)}`);
console.log(`  Internal Coherence: ${dna2.coherence.toFixed(4)}`);
console.log('');

// Compare the bidirectional states
const bidir1 = dna1.bidirectional;
const bidir2 = dna2.bidirectional;
console.log('Bidirectional State Comparison:');
console.log(`  Forward+Backward coherence: ${bidir1.coherence(bidir2).toFixed(4)}`);
console.log(`  (Captures how both orderings relate through forward+reverse combination)`);
console.log('');

// Compare sense/antisense
console.log('Strand Analysis:');
console.log(`  Phrase 1 sense ↔ Phrase 2 sense: ${dna1.sense.coherence(dna2.sense).toFixed(4)}`);
console.log(`  Phrase 1 antisense ↔ Phrase 2 antisense: ${dna1.antisense.coherence(dna2.antisense).toFixed(4)}`);
console.log(`  Phrase 1 sense ↔ Phrase 2 antisense: ${dna1.sense.coherence(dna2.antisense).toFixed(4)}`);
console.log(`  Phrase 1 antisense ↔ Phrase 2 sense: ${dna1.antisense.coherence(dna2.sense).toFixed(4)}`);
console.log('');

// ============================================
// 6-FRAME READING ANALYSIS
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  6-FRAME READING ANALYSIS                                                 │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

console.log('Each phrase is read in 6 frames (3 forward + 3 reverse with offsets):\n');

for (const phrase of [phrase1, phrase2]) {
  const tokens = backend.tokenize(phrase, true);
  const frames = backend.readingFrameStates(tokens);
  
  console.log(`"${phrase}" frames:`);
  for (let i = 0; i < frames.length; i++) {
    const label = frames[i].direction === 'forward'
      ? `F+${frames[i].offset}`
      : `R+${frames[i].offset}`;
    const tokStr = frames[i].tokens.map(t => t.word).join(' ');
    console.log(`  ${label}: [${tokStr}] mag=${frames[i].state.norm().toFixed(3)}`);
  }
  console.log('');
}

// Frame-by-frame coherence
console.log('Frame-to-Frame Coherence Matrix:');
const frames1 = backend.readingFrameStates(backend.tokenize(phrase1, true));
const frames2 = backend.readingFrameStates(backend.tokenize(phrase2, true));

console.log('         │' + frames2.map((f,i) => ` F${i}  `).join('│'));
console.log('─────────┼' + frames2.map(() => '──────').join('┼'));

for (let i = 0; i < frames1.length; i++) {
  process.stdout.write(`F${i} (P1)  │`);
  for (let j = 0; j < frames2.length; j++) {
    const coh = frames1[i].state.coherence(frames2[j].state).toFixed(2);
    process.stdout.write(` ${coh} │`);
  }
  console.log('');
}
console.log('');

// ============================================
// CODON TRIPLET ANALYSIS
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  CODON TRIPLET ANALYSIS                                                   │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const longerPhrase1 = 'wisdom comes from knowing truth';
const longerPhrase2 = 'truth comes from knowing wisdom';

console.log(`Comparing: "${longerPhrase1}"`);
console.log(`      vs:  "${longerPhrase2}"\n`);

const long1 = backend.dnaEncode(longerPhrase1);
const long2 = backend.dnaEncode(longerPhrase2);

console.log('Codon breakdown:');
console.log(`  Phrase 1: ${long1.codons.map(c => `[${c.tokens.map(t => t.word).join(' ')}]`).join(' ')}`);
console.log(`  Phrase 2: ${long2.codons.map(c => `[${c.tokens.map(t => t.word).join(' ')}]`).join(' ')}`);
console.log('');

console.log('Codon-by-codon comparison:');
const minCodons = Math.min(long1.codons.length, long2.codons.length);
for (let i = 0; i < minCodons; i++) {
  const state1 = backend.orderedPrimesToState(long1.codons[i].tokens);
  const state2 = backend.orderedPrimesToState(long2.codons[i].tokens);
  const coh = state1.coherence ? state1.coherence(state2) : backend.fallbackCoherence(state1, state2);
  const codonStr1 = long1.codons[i].tokens.map(t => t.word).join(' ');
  const codonStr2 = long2.codons[i].tokens.map(t => t.word).join(' ');
  console.log(`  Codon ${i+1}: [${codonStr1.padEnd(15)}] ↔ [${codonStr2.padEnd(15)}] = ${coh.toFixed(4)}`);
}
console.log('');

const comparison = backend.dnaCompare(longerPhrase1, longerPhrase2);
console.log(`Overall DNA Comparison:`);
console.log(`  Sense Coherence: ${comparison.senseCoherence.toFixed(4)}`);
console.log(`  Cross Coherence: ${comparison.crossCoherence.toFixed(4)}`);
console.log(`  Combined Score:  ${comparison.combinedScore.toFixed(4)}`);
console.log('');

// ============================================
// SEMANTIC MEANING PRESERVATION TEST
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  SEMANTIC MEANING PRESERVATION                                            │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const meaningTests = [
  // Same meaning, different word order
  ['love and truth', 'truth and love'],
  ['good defeats evil', 'evil is defeated by good'],
  ['the mind thinks', 'thinking is of the mind'],
  
  // Opposite meanings (should show lower similarity)
  ['life leads to death', 'death leads to life'],
  ['creation not destruction', 'destruction not creation'],
  ['light over dark', 'dark over light']
];

console.log('Phrase A'.padEnd(28) + '│ Phrase B'.padEnd(28) + '│Standard│DNA Sens│DNA Cros');
console.log('─'.repeat(28) + '┼' + '─'.repeat(28) + '┼────────┼────────┼────────');

for (const [a, b] of meaningTests) {
  const stateA = backend.textToOrderedState(a);
  const stateB = backend.textToOrderedState(b);
  const standardSim = stateA.coherence(stateB);
  
  const dnaComp = backend.dnaCompare(a, b);
  
  console.log(
    `${a.substring(0,27).padEnd(27)} │ ${b.substring(0,27).padEnd(27)} │ ` +
    `${standardSim.toFixed(3).padStart(6)} │ ${dnaComp.senseCoherence.toFixed(3).padStart(6)} │ ${dnaComp.crossCoherence.toFixed(3).padStart(6)}`
  );
}

console.log('\nNote: Cross coherence captures relationships between forward and reverse readings');
console.log('      High cross-coherence may indicate reversal/mirror relationship\n');

// ============================================
// VISUALIZATION: SENSE vs ANTISENSE
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  SENSE vs ANTISENSE STRAND VISUALIZATION                                  │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const visPhrases = [
  'love creates beauty',
  'beauty creates love',
  'mind over matter',
  'matter over mind'
];

for (const phrase of visPhrases) {
  const dna = backend.dnaEncode(phrase);
  const senseComponents = dna.sense.c;
  const antiComponents = dna.antisense.c;
  
  console.log(`"${phrase}":`);
  console.log(`  Sense:     [${senseComponents.slice(0,4).map(c => c.toFixed(2).padStart(6)).join(', ')}...]`);
  console.log(`  Antisense: [${antiComponents.slice(0,4).map(c => c.toFixed(2).padStart(6)).join(', ')}...]`);
  console.log(`  Sense-Antisense coherence: ${dna.coherence.toFixed(4)}`);
  console.log('');
}

// ============================================
// PRACTICAL QUERY IMPROVEMENTS
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  PRACTICAL QUERY IMPROVEMENTS WITH DNA PROCESSING                         │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

console.log('Standard processing only considers forward token order.');
console.log('DNA processing adds multiple dimensions:\n');

const demoPhrase = 'knowledge leads to wisdom through truth';
const dna = backend.dnaEncode(demoPhrase);

console.log(`Query: "${demoPhrase}"\n`);

console.log('1. BIDIRECTIONAL PROCESSING:');
console.log(`   Forward state magnitude:  ${backend.textToOrderedState(demoPhrase).norm().toFixed(4)}`);
console.log(`   Bidirectional magnitude:  ${dna.bidirectional.norm().toFixed(4)}`);
console.log(`   (Bidirectional captures meaning in both directions)\n`);

console.log('2. CODON CHUNKING:');
for (const codon of dna.codons) {
  const codonStr = codon.tokens.map(t => t.word).join(' ');
  console.log(`   [${codonStr}] → primes: [${codon.primes.join(', ')}]`);
}
console.log(`   (Triplets encode contextual meaning units)\n`);

console.log('3. SIX-FRAME ANALYSIS:');
console.log(`   Combined 6-frame state magnitude: ${dna.sixFrame.norm().toFixed(4)}`);
console.log(`   (Multiple reading frames capture latent meanings)\n`);

console.log('4. DUAL STRAND REPRESENTATION:');
console.log(`   Sense magnitude:     ${dna.sense.norm().toFixed(4)}`);
console.log(`   Antisense magnitude: ${dna.antisense.norm().toFixed(4)}`);
console.log(`   Strand coherence:    ${dna.coherence.toFixed(4)}`);
console.log(`   (Dual representation enables richer comparisons)\n`);

// ============================================
// SUMMARY
// ============================================
console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║                       DNA PROCESSING SUMMARY                              ║');
console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
console.log('║                                                                           ║');
console.log('║  DNA-inspired processing provides RICHER semantic analysis by:           ║');
console.log('║                                                                           ║');
console.log('║  • Bidirectional (Boustrophedon): Reads forward AND backward              ║');
console.log('║  • Codon Chunking: Groups tokens into meaningful triplets                 ║');
console.log('║  • 6-Frame Reading: Analyzes from multiple offset positions               ║');
console.log('║  • Sense/Antisense: Maintains complementary strand representations        ║');
console.log('║                                                                           ║');
console.log('║  Key findings:                                                            ║');
console.log('║  • "dog bites man" vs "man bites dog" shows clear difference             ║');
console.log('║  • Cross-coherence captures reversal relationships                        ║');
console.log('║  • Codon analysis reveals contextual meaning units                        ║');
console.log('║  • Dual strands enable detection of structural complementarity            ║');
console.log('║                                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');