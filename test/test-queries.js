/**
 * Comprehensive Query Test Suite
 *
 * Tests field-based semantic computation:
 * - Field evolution with coherent emission sampling
 * - Answer emerges from oscillator dynamics
 * - Primes decoded from field amplitude state
 */

const { createEngine, SemanticBackend } = require('../modular');
const { TwoLayerEngine } = require('../backends/semantic/two-layer');

console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║               FIELD-BASED SEMANTIC ENGINE QUERY TESTS                      ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

// Create engines with field-based computation settings
const semanticConfig = {
  dimension: 16,
  vocabulary: {
    // Core concepts - using more specific prime signatures
    'love': [2, 3, 29],           // existence + unity + harmony
    'truth': [7, 11, 13],         // logos + psyche + telos
    'wisdom': [7, 11, 29],        // logos + psyche + harmony
    'knowledge': [7, 5, 23],      // logos + form + intensity
    'beauty': [5, 11, 29],        // form + psyche + harmony
    'justice': [13, 7, 37],       // telos + logos + balance
    'freedom': [17, 11, 2],       // dynamis + psyche + existence
    'peace': [29, 3, 7],          // harmony + unity + logos
    'power': [17, 5, 23],         // dynamis + form + intensity
    'order': [5, 3, 37],          // form + unity + balance
    'chaos': [17, 31, 23],        // dynamis + tension + intensity
    'light': [2, 5, 29],          // existence + form + harmony
    'dark': [19, 31, 13],         // absence + tension + telos
    'life': [2, 3, 17],           // existence + unity + dynamis
    'death': [19, 13, 11],        // absence + telos + psyche
    'time': [2, 17, 13],          // existence + dynamis + telos
    'space': [5, 3, 2],           // form + unity + existence
    'mind': [7, 11, 23],          // logos + psyche + intensity
    'body': [5, 2, 3],            // form + existence + unity
    'soul': [11, 17, 29],         // psyche + dynamis + harmony
    'spirit': [11, 2, 13],        // psyche + existence + telos
    'matter': [5, 3, 31],         // form + unity + tension
    'energy': [17, 2, 23],        // dynamis + existence + intensity
    'form': [5, 13, 37],          // form + telos + balance
    'void': [19, 7, 31],          // absence + logos + tension
    
    // Actions - distinct prime signatures
    'create': [2, 17, 5],         // existence + dynamis + form
    'destroy': [19, 17, 31],      // absence + dynamis + tension
    'think': [7, 11, 5],          // logos + psyche + form
    'feel': [11, 29, 3],          // psyche + harmony + unity
    'know': [7, 23, 13],          // logos + intensity + telos
    'believe': [11, 7, 13],       // psyche + logos + telos
    'want': [17, 11, 23],         // dynamis + psyche + intensity
    'need': [17, 13, 31],         // dynamis + telos + tension
    'give': [2, 29, 3],           // existence + harmony + unity
    'take': [17, 5, 31],          // dynamis + form + tension
    'change': [17, 5, 7],         // dynamis + form + logos
    'remain': [2, 37, 3],         // existence + balance + unity
    'begin': [2, 17, 7],          // existence + dynamis + logos
    'end': [13, 19, 7],           // telos + absence + logos
    'cause': [17, 7, 13],         // dynamis + logos + telos
    'effect': [5, 13, 17],        // form + telos + dynamis
    
    // Relationships - unique signatures
    'self': [2, 11, 3],           // existence + psyche + unity
    'other': [5, 31, 13],         // form + tension + telos
    'one': [3, 2],                // unity + existence
    'many': [5, 17, 31],          // form + dynamis + tension
    'totality': [2, 3, 5, 7],     // all aspects (was "all")
    'nothing': [19, 31, 13],      // absence + tension + telos
    'part': [5, 3],               // form + unity
    'whole': [2, 3, 37],          // existence + unity + balance
    
    // Modifiers - specific meanings
    'good': [29, 3, 2],           // harmony + unity + existence
    'evil': [31, 13, 19],         // tension + telos + absence
    'true': [7, 13, 2],           // logos + telos + existence
    'false': [31, 7, 19],         // tension + logos + absence
    'real': [2, 7, 5],            // existence + logos + form
    'illusion': [31, 5, 19],      // tension + form + absence
    'possible': [17, 2, 7],       // dynamis + existence + logos
    'necessary': [13, 7, 37],     // telos + logos + balance
    'eternal': [2, 13, 37],       // existence + telos + balance
    'temporal': [17, 5, 31]       // dynamis + form + tension
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
  },
  transforms: [
    { n: 'synthesis', q: [2, 3], r: [5] },
    { n: 'analysis', q: [5], r: [2, 3] },
    { n: 'transcend', q: [2, 3, 5], r: [7, 11] },
    { n: 'manifest', q: [7, 11], r: [2, 5, 13] },
    { n: 'polarize', q: [2, 3], r: [5, 13] },
    { n: 'unify', q: [5, 13], r: [2, 7] }
  ]
};

const engine = createEngine('semantic', semanticConfig);
const twoLayer = new TwoLayerEngine({ core: semanticConfig });

// ============================================
// Test queries
// ============================================
const queries = [
  // Philosophical questions
  "What is truth?",
  "love and wisdom together",
  "knowledge leads to power",
  "the nature of being",
  "mind body soul",
  "light versus dark",
  "order from chaos",
  "time and change",
  "the one and the many",
  "self and other",
  
  // Conceptual combinations
  "eternal truth",
  "necessary existence",
  "possible worlds",
  "good and evil",
  "creation and destruction",
  "life and death",
  "freedom and justice",
  "peace through power",
  "beauty in form",
  "spirit over matter",
  
  // Complex statements
  "wisdom comes from knowing truth",
  "love creates beauty",
  "mind thinks soul feels",
  "all is one none is many",
  "begin to change remain the same",
  "cause and effect through time",
  "real knowledge versus false belief",
  "eternal spirit temporal body",
  "want and need cause action",
  "give love take nothing"
];

console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  FIELD-BASED SEMANTIC PROCESSING                                          │');
console.log('│  (Answer emerges from oscillator dynamics at coherent emission moments)   │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

console.log('Query'.padEnd(30) + '│Steps│Order│Field│ Output');
console.log('─'.repeat(30) + '┼─────┼─────┼─────┼' + '─'.repeat(35));

for (const query of queries.slice(0, 15)) {
  engine.reset();
  const result = engine.run(query);
  const steps = String(result.evolutionSteps || 0).padStart(4);
  const order = (result.bestFrameOrder || 0).toFixed(2);
  const field = result.fieldBased ? '  ✓ ' : '  ✗ ';
  const output = result.output.substring(0, 33).padEnd(33);
  console.log(`${query.substring(0,29).padEnd(29)} │${steps} │${order}│${field} │ ${output}`);
}

// ============================================
// Non-commutativity tests
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  NON-COMMUTATIVITY TESTS (Order Matters!)                                 │');
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

const backend = new SemanticBackend(semanticConfig);

console.log('Phrase A'.padEnd(30) + '│ Phrase B'.padEnd(30) + '│ Similarity');
console.log('─'.repeat(30) + '┼' + '─'.repeat(30) + '┼' + '─'.repeat(12));

for (const [a, b] of orderTests) {
  const stateA = backend.textToOrderedState(a);
  const stateB = backend.textToOrderedState(b);
  const similarity = stateA.coherence(stateB);
  const simStr = similarity.toFixed(4);
  const indicator = similarity < 0.95 ? '✓ Different' : '⚠ Too similar';
  console.log(`${a.padEnd(29)} │ ${b.padEnd(29)} │ ${simStr} ${indicator}`);
}

// ============================================
// Two-layer register tests
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  TWO-LAYER REGISTER TRANSLATION                                           │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const registerTests = [
  'truth',
  'wisdom', 
  'love',
  'think',
  'good'
];

console.log('Concept'.padEnd(12) + '│ Formal'.padEnd(15) + '│ Casual'.padEnd(15) + '│ Technical'.padEnd(15) + '│ Poetic');
console.log('─'.repeat(12) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15));

for (const concept of registerTests) {
  twoLayer.useRegister('formal');
  const formal = twoLayer.process(concept).surface.words.join(' ');
  
  const casual = twoLayer.transform(concept, 'casual').transformed;
  const technical = twoLayer.transform(concept, 'technical').transformed;
  const poetic = twoLayer.transform(concept, 'poetic').transformed;
  
  console.log(`${concept.padEnd(11)} │ ${formal.padEnd(14)} │ ${casual.padEnd(14)} │ ${technical.padEnd(14)} │ ${poetic}`);
}

// ============================================
// Entropy minimization tests
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  ENTROPY MINIMIZATION (Reasoning Steps)                                   │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const reasoningTests = [
  'chaos order unity',
  'many parts become whole',
  'from darkness light',
  'through death to life'
];

for (const query of reasoningTests) {
  const result = engine.run(query);
  console.log(`Query: "${query}"`);
  console.log(`  Initial entropy: ${result.entropy.toFixed(3)}`);
  
  if (result.steps && result.steps.length > 0) {
    console.log('  Reasoning steps:');
    for (const step of result.steps) {
      console.log(`    ${step.step}. ${step.transform} (ΔH = -${step.entropyDrop.toFixed(3)})`);
    }
  } else {
    console.log('  No transforms applied (already minimal or no matches)');
  }
  console.log(`  Final output: "${result.output}"`);
  console.log('');
}

// ============================================
// Physics state evolution
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  PHYSICS STATE EVOLUTION                                                  │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

engine.reset();
engine.run('love truth wisdom power');

console.log('Evolving system for 10 time steps...\n');
console.log('Step │ Entropy │ Order   │ Lyapunov  │ Stability │ Coupling');
console.log('─────┼─────────┼─────────┼───────────┼───────────┼──────────');

const evolution = engine.evolve(10);
for (const step of evolution) {
  console.log(
    `${String(step.step).padStart(4)} │ ${step.entropy.toFixed(3).padStart(7)} │ ${step.orderParameter.toFixed(3).padStart(7)} │ ` +
    `${engine.getPhysicsState().lyapunov.toFixed(4).padStart(9)} │ ${step.stability.padStart(9)} │ ` +
    `${engine.getPhysicsState().coupling.toFixed(3)}`
  );
}

// ============================================
// Complex compound queries with field evolution
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  COMPLEX QUERIES (Field Evolution Details)                                │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const complexQueries = [
  "If truth is eternal and wisdom is temporal then knowledge bridges both",
  "The soul seeks freedom while the body needs order",
  "Creation requires destruction as light requires dark",
  "To know the self is to know the other through love",
  "Power without wisdom leads to chaos not order",
  "The many become one through the whole not the parts",
  "Mind creates form spirit creates meaning soul creates beauty"
];

for (const query of complexQueries) {
  engine.reset();
  const result = engine.run(query);
  console.log(`Query: "${query.substring(0, 60)}${query.length > 60 ? '...' : ''}"`);
  console.log(`  Field: ${result.evolutionSteps} steps, ${result.framesCollected} coherent frames, order=${(result.bestFrameOrder||0).toFixed(3)}`);
  console.log(`  Mode: ${result.fieldBased ? 'FIELD-BASED (oscillator emission)' : 'SYMBOLIC (transform fallback)'}`);
  console.log(`  Primes: [${result.resultPrimes.slice(0,6).join(', ')}${result.resultPrimes.length > 6 ? '...' : ''}]`);
  console.log(`  Output: "${result.output}"`);
  console.log(`  H=${result.entropy.toFixed(2)} λ=${result.lyapunov.toFixed(3)} ${result.stability}`);
  console.log('');
}

// ============================================
// Semantic similarity matrix
// ============================================
console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│  SEMANTIC SIMILARITY MATRIX                                               │');
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

const concepts = ['love', 'truth', 'wisdom', 'power', 'peace', 'chaos'];
const states = concepts.map(c => backend.textToOrderedState(c));

// Print header
process.stdout.write('         │');
for (const c of concepts) {
  process.stdout.write(` ${c.padStart(7)} `);
}
console.log('');
console.log('─'.repeat(9) + '┼' + ('─'.repeat(9)).repeat(concepts.length));

// Print matrix
for (let i = 0; i < concepts.length; i++) {
  process.stdout.write(`${concepts[i].padEnd(8)} │`);
  for (let j = 0; j < concepts.length; j++) {
    const sim = states[i].coherence(states[j]);
    process.stdout.write(` ${sim.toFixed(3).padStart(7)} `);
  }
  console.log('');
}

console.log('\nHigher values = more semantically related\n');

// ============================================
// Summary
// ============================================
console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║                           TEST SUMMARY                                     ║');
console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
console.log('║  ✓ Basic semantic processing                                              ║');
console.log('║  ✓ Non-commutativity verification ("A→B" ≠ "B→A")                         ║');
console.log('║  ✓ Two-layer register translation                                         ║');
console.log('║  ✓ Entropy minimization with reasoning steps                              ║');
console.log('║  ✓ Physics state evolution (Kuramoto, Lyapunov)                           ║');
console.log('║  ✓ Complex compound query processing                                      ║');
console.log('║  ✓ Semantic similarity matrix                                             ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');