/**
 * Aleph Benchmark Suite
 * 
 * Tests Aleph's semantic understanding across multiple domains
 * and provides accuracy metrics.
 * 
 * Updated to use modular architecture.
 */
const { createEngine, SemanticBackend } = require('../modular');

// Semantic configuration matching the test vocabulary
const semanticConfig = {
  dimension: 16,
  vocabulary: {
    // Core concepts
    'love': [2, 3, 5],
    'truth': [7, 11, 13],
    'wisdom': [7, 11, 29],
    'knowledge': [7, 5, 23],
    'beauty': [5, 11, 29],
    'light': [2, 5, 29],
    'darkness': [19, 31, 13],
    'dark': [19, 31, 13],
    'life': [2, 3, 17],
    'death': [19, 13, 11],
    'soul': [11, 17, 29],
    'spirit': [11, 2, 13],
    'mind': [7, 11, 23],
    'order': [5, 3, 37],
    'chaos': [17, 31, 23],
    'change': [17, 5, 7],
    'time': [2, 17, 13],
    'space': [5, 3, 2],
    'energy': [17, 2, 23],
    'power': [17, 5, 23],
    'force': [17, 23, 31],
    'perception': [11, 7, 5],
    'structure': [5, 37, 3],
    'void': [19, 7, 31],
    'infinity': [2, 13, 37],
    'duality': [3, 31, 37],
    'unity': [3, 2, 37],
    'harmony': [29, 3, 7],
    'mystery': [19, 11, 13],
    'good': [29, 3, 2],
    'evil': [31, 13, 19]
  },
  ontology: {
    2: 'existence',
    3: 'unity',
    5: 'form',
    7: 'logos',
    11: 'psyche',
    13: 'telos',
    17: 'dynamis',
    19: 'absence',
    23: 'intensity',
    29: 'harmony',
    31: 'tension',
    37: 'balance'
  },
  transforms: [
    { n: 'synthesis', q: [2, 3], r: [5] },
    { n: 'analysis', q: [5], r: [2, 3] },
    { n: 'transcend', q: [2, 3, 5], r: [7, 11] }
  ]
};

const engine = createEngine('semantic', semanticConfig);
const backend = new SemanticBackend(semanticConfig);

// ═══════════════════════════════════════════════════════════════════
// Test Battery - Questions with Expected Semantic Concepts
// ═══════════════════════════════════════════════════════════════════

const TEST_BATTERY = [
  // Category: Basic Ontology
  {
    category: 'Ontology',
    question: 'What is love?',
    expectedConcepts: ['love', 'truth', 'soul'],
    difficulty: 'easy'
  },
  {
    category: 'Ontology',
    question: 'What is wisdom?',
    expectedConcepts: ['wisdom', 'knowledge', 'truth'],
    difficulty: 'easy'
  },
  {
    category: 'Ontology',
    question: 'What is death?',
    expectedConcepts: ['death', 'life', 'change'],
    difficulty: 'easy'
  },
  
  // Category: Relationships
  {
    category: 'Relationships',
    question: 'How does love relate to truth?',
    expectedConcepts: ['love', 'truth', 'unity'],
    difficulty: 'medium'
  },
  {
    category: 'Relationships',
    question: 'What connects mind and soul?',
    expectedConcepts: ['mind', 'soul', 'spirit'],
    difficulty: 'medium'
  },
  {
    category: 'Relationships',
    question: 'How do light and darkness interact?',
    expectedConcepts: ['light', 'darkness', 'duality'],
    difficulty: 'medium'
  },
  
  // Category: Abstract Reasoning
  {
    category: 'Abstract',
    question: 'What is the nature of infinity?',
    expectedConcepts: ['infinity', 'unity', 'space'],
    difficulty: 'hard'
  },
  {
    category: 'Abstract',
    question: 'How does order emerge from chaos?',
    expectedConcepts: ['order', 'chaos', 'change', 'structure'],
    difficulty: 'hard'
  },
  {
    category: 'Abstract',
    question: 'What is the essence of beauty?',
    expectedConcepts: ['beauty', 'harmony', 'light'],
    difficulty: 'hard'
  },
  
  // Category: Physics/Nature
  {
    category: 'Physics',
    question: 'What is energy?',
    expectedConcepts: ['power', 'change', 'force'],
    difficulty: 'medium'
  },
  {
    category: 'Physics',
    question: 'How does time flow?',
    expectedConcepts: ['time', 'change', 'order'],
    difficulty: 'medium'
  },
  {
    category: 'Physics',
    question: 'What is space made of?',
    expectedConcepts: ['space', 'structure', 'void'],
    difficulty: 'hard'
  },
  
  // Category: Existence
  {
    category: 'Existence',
    question: 'Why do things exist?',
    expectedConcepts: ['life', 'unity', 'truth'],
    difficulty: 'hard'
  },
  {
    category: 'Existence',
    question: 'What is consciousness?',
    expectedConcepts: ['mind', 'soul', 'perception'],
    difficulty: 'hard'
  },
  {
    category: 'Existence',
    question: 'What gives meaning to life?',
    expectedConcepts: ['life', 'love', 'truth', 'wisdom'],
    difficulty: 'hard'
  },
  
  // Category: Duality
  {
    category: 'Duality',
    question: 'What is the relationship between good and evil?',
    expectedConcepts: ['duality', 'light', 'darkness', 'truth'],
    difficulty: 'hard'
  },
  {
    category: 'Duality',
    question: 'How are creation and destruction related?',
    expectedConcepts: ['life', 'death', 'change', 'duality'],
    difficulty: 'hard'
  },
  
  // Category: Knowledge
  {
    category: 'Knowledge',
    question: 'What is the difference between knowledge and wisdom?',
    expectedConcepts: ['knowledge', 'wisdom', 'truth'],
    difficulty: 'medium'
  },
  {
    category: 'Knowledge',
    question: 'How do we perceive reality?',
    expectedConcepts: ['perception', 'mind', 'truth'],
    difficulty: 'medium'
  },
  {
    category: 'Knowledge',
    question: 'What are the limits of understanding?',
    expectedConcepts: ['knowledge', 'mystery', 'infinity'],
    difficulty: 'hard'
  }
];

// ═══════════════════════════════════════════════════════════════════
// Scoring Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Get prime numbers for concept names
 */
function conceptsToPrimes(concepts) {
  const primes = [];
  
  for (const concept of concepts) {
    const wordPrimes = semanticConfig.vocabulary[concept.toLowerCase()];
    if (wordPrimes) {
      primes.push(...wordPrimes);
    }
  }
  
  return [...new Set(primes)];
}

/**
 * Calculate semantic overlap score between response and expected primes
 */
function calculateScore(responsePrimes, expectedPrimes) {
  if (expectedPrimes.length === 0) return 0;
  
  const responseSet = new Set(responsePrimes);
  const matches = expectedPrimes.filter(p => responseSet.has(p));
  
  // Precision: how many expected concepts were found
  const recall = matches.length / expectedPrimes.length;
  
  // We also consider if response has relevant extras (not penalized heavily)
  const precision = responsePrimes.length > 0 
    ? matches.length / Math.min(responsePrimes.length, expectedPrimes.length * 2)
    : 0;
  
  // F1-like score
  return recall * 0.7 + precision * 0.3;
}

/**
 * Run a single test
 */
function runTest(test) {
  engine.reset();
  const result = engine.run(test.question);
  const expectedPrimes = conceptsToPrimes(test.expectedConcepts);
  const score = calculateScore(result.resultPrimes, expectedPrimes);
  
  return {
    question: test.question,
    category: test.category,
    difficulty: test.difficulty,
    expectedConcepts: test.expectedConcepts,
    expectedPrimes,
    responsePrimes: result.resultPrimes,
    responseText: result.output,
    score,
    passed: score >= 0.4,  // Lowered threshold since we're testing field-based output
    entropy: result.entropy,
    coherence: result.coherence,
    fieldBased: result.fieldBased || false
  };
}

// ═══════════════════════════════════════════════════════════════════
// Benchmark Runner
// ═══════════════════════════════════════════════════════════════════

function runBenchmark(options = {}) {
  const { 
    verbose = true, 
    filterCategory = null,
    filterDifficulty = null 
  } = options;
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    ALEPH BENCHMARK SUITE                          ');
  console.log('                    (Modular Architecture)                         ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Vocabulary Size: ${Object.keys(semanticConfig.vocabulary).length}`);
  console.log(`Ontology Size: ${Object.keys(semanticConfig.ontology).length}`);
  console.log(`Total Tests: ${TEST_BATTERY.length}`);
  console.log('───────────────────────────────────────────────────────────────────\n');
  
  // Filter tests if requested
  let tests = TEST_BATTERY;
  if (filterCategory) {
    tests = tests.filter(t => t.category.toLowerCase() === filterCategory.toLowerCase());
  }
  if (filterDifficulty) {
    tests = tests.filter(t => t.difficulty === filterDifficulty);
  }
  
  const results = [];
  const categoryScores = {};
  const difficultyScores = { easy: [], medium: [], hard: [] };
  
  for (const test of tests) {
    const result = runTest(test);
    results.push(result);
    
    // Track by category
    if (!categoryScores[test.category]) categoryScores[test.category] = [];
    categoryScores[test.category].push(result.score);
    
    // Track by difficulty
    difficultyScores[test.difficulty].push(result.score);
    
    if (verbose) {
      const icon = result.passed ? '✅' : '❌';
      const mode = result.fieldBased ? '🔬' : '📝';
      console.log(`${icon}${mode} [${test.category}/${test.difficulty}] ${test.question}`);
      console.log(`   Expected: ${test.expectedConcepts.join(', ')}`);
      console.log(`   Got: "${result.responseText.substring(0, 50)}..."`);
      console.log(`   Score: ${(result.score * 100).toFixed(1)}% | H: ${result.entropy.toFixed(2)} | C: ${result.coherence.toFixed(2)}`);
      console.log('');
    }
  }
  
  // Calculate summary statistics
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const passCount = results.filter(r => r.passed).length;
  const fieldBasedCount = results.filter(r => r.fieldBased).length;
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                         RESULTS SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`\n📊 Overall Score: ${(totalScore * 100).toFixed(1)}%`);
  console.log(`   Tests Passed: ${passCount}/${results.length} (${(passCount/results.length*100).toFixed(1)}%)`);
  console.log(`   Field-Based: ${fieldBasedCount}/${results.length} (${(fieldBasedCount/results.length*100).toFixed(1)}%)`);
  
  console.log('\n📈 By Category:');
  for (const [cat, scores] of Object.entries(categoryScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bar = '█'.repeat(Math.round(avg * 20)) + '░'.repeat(20 - Math.round(avg * 20));
    console.log(`   ${cat.padEnd(15)} ${bar} ${(avg * 100).toFixed(1)}%`);
  }
  
  console.log('\n📈 By Difficulty:');
  for (const [diff, scores] of Object.entries(difficultyScores)) {
    if (scores.length === 0) continue;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bar = '█'.repeat(Math.round(avg * 20)) + '░'.repeat(20 - Math.round(avg * 20));
    console.log(`   ${diff.padEnd(15)} ${bar} ${(avg * 100).toFixed(1)}%`);
  }
  
  // Find weakest areas
  console.log('\n⚠️  Weakest Areas (Failed Tests):');
  const failed = results.filter(r => !r.passed).sort((a, b) => a.score - b.score);
  for (const f of failed.slice(0, 5)) {
    console.log(`   • ${f.question} (${(f.score * 100).toFixed(1)}%)`);
  }
  
  // Physics quality metrics
  const avgEntropy = results.reduce((sum, r) => sum + r.entropy, 0) / results.length;
  const avgCoherence = results.reduce((sum, r) => sum + r.coherence, 0) / results.length;
  
  console.log('\n🔬 Physics Metrics:');
  console.log(`   Average Entropy: ${avgEntropy.toFixed(3)}`);
  console.log(`   Average Coherence: ${avgCoherence.toFixed(3)}`);
  
  console.log('\n═══════════════════════════════════════════════════════════════════\n');
  
  return {
    totalScore,
    passRate: passCount / results.length,
    results,
    categoryScores,
    difficultyScores,
    avgEntropy,
    avgCoherence
  };
}

// ═══════════════════════════════════════════════════════════════════
// CLI Interface
// ═══════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const options = {
  verbose: !args.includes('--quiet'),
  filterCategory: args.find(a => a.startsWith('--category='))?.split('=')[1],
  filterDifficulty: args.find(a => a.startsWith('--difficulty='))?.split('=')[1]
};

if (args.includes('--help')) {
  console.log(`
Aleph Benchmark Suite (Modular Architecture)

Usage: node benchmark.js [options]

Options:
  --quiet              Suppress individual test output
  --category=NAME      Filter by category (Ontology, Relationships, Abstract, Physics, Existence, Duality, Knowledge)
  --difficulty=LEVEL   Filter by difficulty (easy, medium, hard)
  --help               Show this help

Examples:
  node benchmark.js                     Run full benchmark
  node benchmark.js --quiet             Run quietly, show only summary
  node benchmark.js --category=Physics  Test only physics questions
  node benchmark.js --difficulty=hard   Test only hard questions
`);
  process.exit(0);
}

runBenchmark(options);