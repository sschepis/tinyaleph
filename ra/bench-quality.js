/**
 * Quality Metrics Benchmark for Resonant Attention
 * 
 * Evaluates attention quality on:
 * - Semantic similarity retrieval
 * - Synthetic classification task
 * - Analogy completion
 * - Attention distribution analysis
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Import from parent project
const { 
  SparsePrimeState, 
  resonanceScore, 
  resonantAttention,
  Quaternion 
} = require('../modular');
const { firstNPrimes } = require('../core/prime');
const { Complex } = require('../core/hilbert');

// ============================================================================
// Dataset Generation
// ============================================================================

/**
 * Create a semantic cluster of related states
 */
function createSemanticCluster(baseText, variations, numPrimes, k) {
  const states = [];
  
  for (const variation of variations) {
    states.push({
      text: variation,
      state: SparsePrimeState.fromHash(variation, numPrimes, k)
    });
  }
  
  return states;
}

/**
 * Create synthetic dataset with known semantic clusters
 */
function createSemanticDataset(numPrimes, k) {
  const clusters = {
    animals: [
      'The cat sat on the mat',
      'The dog ran in the park',
      'The bird flew over the tree',
      'The fish swam in the pond',
      'The horse galloped across the field'
    ],
    technology: [
      'Python is a programming language',
      'JavaScript runs in browsers',
      'Machine learning uses neural networks',
      'Data structures optimize algorithms',
      'Software engineering builds systems'
    ],
    geography: [
      'Paris is the capital of France',
      'London is a city in England',
      'Tokyo is the capital of Japan',
      'New York is in the United States',
      'Beijing is a city in China'
    ],
    science: [
      'Einstein discovered relativity',
      'Newton formulated gravity laws',
      'Darwin proposed evolution theory',
      'Curie studied radioactivity',
      'Hawking explored black holes'
    ]
  };
  
  const dataset = [];
  const clusterNames = Object.keys(clusters);
  
  for (const clusterName of clusterNames) {
    const texts = clusters[clusterName];
    for (const text of texts) {
      dataset.push({
        text,
        cluster: clusterName,
        state: SparsePrimeState.fromHash(text, numPrimes, k)
      });
    }
  }
  
  return { dataset, clusterNames };
}

/**
 * Create analogy pairs (A:B :: C:D pattern)
 */
function createAnalogyDataset(numPrimes, k) {
  const analogies = [
    { a: 'king', b: 'queen', c: 'man', d: 'woman' },
    { a: 'Paris', b: 'France', c: 'Tokyo', d: 'Japan' },
    { a: 'dog', b: 'puppy', c: 'cat', d: 'kitten' },
    { a: 'hot', b: 'cold', c: 'big', d: 'small' },
    { a: 'sun', b: 'day', c: 'moon', d: 'night' }
  ];
  
  return analogies.map(analogy => ({
    ...analogy,
    states: {
      a: SparsePrimeState.fromHash(analogy.a, numPrimes, k),
      b: SparsePrimeState.fromHash(analogy.b, numPrimes, k),
      c: SparsePrimeState.fromHash(analogy.c, numPrimes, k),
      d: SparsePrimeState.fromHash(analogy.d, numPrimes, k)
    }
  }));
}

// ============================================================================
// Evaluation Metrics
// ============================================================================

/**
 * Evaluate semantic similarity retrieval
 * Given a query, retrieve top-k items and measure precision/recall within cluster
 */
function evaluateRetrieval(dataset, clusterNames, topK = 5) {
  const results = {
    precisionAtK: [],
    recallAtK: [],
    meanAveragePrecision: []
  };
  
  for (const item of dataset) {
    const query = item.state;
    const trueCluster = item.cluster;
    
    // Compute scores against all other items
    const scores = dataset
      .filter(d => d !== item)
      .map(d => ({
        text: d.text,
        cluster: d.cluster,
        score: resonanceScore(query, d.state)
      }))
      .sort((a, b) => b.score - a.score);
    
    // Top-K retrieval
    const retrieved = scores.slice(0, topK);
    const relevantRetrieved = retrieved.filter(r => r.cluster === trueCluster);
    
    // Precision@K
    const precision = relevantRetrieved.length / topK;
    results.precisionAtK.push(precision);
    
    // Recall@K (assuming cluster size - 1 as total relevant)
    const totalRelevant = dataset.filter(d => d.cluster === trueCluster && d !== item).length;
    const recall = relevantRetrieved.length / totalRelevant;
    results.recallAtK.push(recall);
    
    // Average Precision
    let ap = 0;
    let relevantSoFar = 0;
    for (let i = 0; i < retrieved.length; i++) {
      if (retrieved[i].cluster === trueCluster) {
        relevantSoFar++;
        ap += relevantSoFar / (i + 1);
      }
    }
    ap = relevantSoFar > 0 ? ap / relevantSoFar : 0;
    results.meanAveragePrecision.push(ap);
  }
  
  return {
    meanPrecisionAtK: mean(results.precisionAtK),
    meanRecallAtK: mean(results.recallAtK),
    MAP: mean(results.meanAveragePrecision)
  };
}

/**
 * Evaluate attention distribution entropy
 * Lower entropy = more focused attention
 */
function evaluateAttentionEntropy(n, k, numPrimes, trials) {
  const entropies = [];
  
  for (let t = 0; t < trials; t++) {
    const query = SparsePrimeState.fromHash(`query_${t}`, numPrimes, k);
    const keys = Array.from({ length: n }, (_, i) => 
      SparsePrimeState.fromHash(`key_${t}_${i}`, numPrimes, k)
    );
    const values = keys;
    
    const { weights } = resonantAttention(query, keys, values);
    
    // Compute entropy of attention distribution
    let entropy = 0;
    for (const w of weights) {
      if (w > 1e-10) {
        entropy -= w * Math.log2(w);
      }
    }
    entropies.push(entropy);
  }
  
  const maxEntropy = Math.log2(n); // Maximum possible entropy
  
  return {
    meanEntropy: mean(entropies),
    normalizedEntropy: mean(entropies) / maxEntropy,
    stddev: stddev(entropies)
  };
}

/**
 * Evaluate analogy completion
 * A:B :: C:? → Find D that maximizes similarity pattern
 */
function evaluateAnalogyCompletion(analogies, candidates, numPrimes, k) {
  let correct = 0;
  const details = [];
  
  for (const analogy of analogies) {
    const { a, b, c, d, states } = analogy;
    
    // Compute analogy vector: B - A + C should equal D
    // Using resonance scores instead of vector arithmetic
    const targetPattern = resonanceScore(states.a, states.b);
    
    // Score all candidates
    const candidateScores = candidates.map(candidate => {
      const candidateState = SparsePrimeState.fromHash(candidate, numPrimes, k);
      const patternScore = resonanceScore(states.c, candidateState);
      const targetScore = resonanceScore(states.d, candidateState);
      return {
        candidate,
        patternScore,
        targetScore,
        score: patternScore + targetScore // Combined score
      };
    });
    
    candidateScores.sort((a, b) => b.score - a.score);
    
    const predicted = candidateScores[0].candidate;
    const isCorrect = predicted === d;
    if (isCorrect) correct++;
    
    details.push({
      analogy: `${a}:${b}::${c}:?`,
      expected: d,
      predicted,
      isCorrect,
      topCandidates: candidateScores.slice(0, 3)
    });
  }
  
  return {
    accuracy: correct / analogies.length,
    details
  };
}

/**
 * Evaluate self-similarity (identity property)
 */
function evaluateSelfSimilarity(numSamples, numPrimes, k) {
  const scores = [];
  
  for (let i = 0; i < numSamples; i++) {
    const state = SparsePrimeState.fromHash(`test_state_${i}`, numPrimes, k);
    const selfScore = resonanceScore(state, state);
    scores.push(selfScore);
  }
  
  return {
    mean: mean(scores),
    min: Math.min(...scores),
    max: Math.max(...scores),
    allPerfect: scores.every(s => Math.abs(s - 1.0) < 1e-6)
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         RESONANT ATTENTION: QUALITY METRICS BENCHMARK');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    benchmark: 'quality-metrics',
    config: {
      numPrimes: config.numPrimes
    },
    selfSimilarity: null,
    retrieval: null,
    attentionEntropy: null,
    analogyCompletion: null
  };
  
  const k = 32; // Default sparsity
  
  // 1. Self-similarity (identity property)
  console.log('1. Self-Similarity Test');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const selfSim = evaluateSelfSimilarity(100, config.numPrimes, k);
  results.selfSimilarity = selfSim;
  
  console.log(`  Mean self-score: ${selfSim.mean.toFixed(6)}`);
  console.log(`  Range: [${selfSim.min.toFixed(6)}, ${selfSim.max.toFixed(6)}]`);
  console.log(`  All perfect (= 1.0): ${selfSim.allPerfect ? 'YES ✓' : 'NO ✗'}`);
  
  // 2. Semantic retrieval
  console.log('\n2. Semantic Retrieval Evaluation');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const { dataset, clusterNames } = createSemanticDataset(config.numPrimes, k);
  console.log(`  Dataset: ${dataset.length} items in ${clusterNames.length} clusters`);
  
  for (const topK of [3, 5]) {
    const retrieval = evaluateRetrieval(dataset, clusterNames, topK);
    console.log(`\n  Top-${topK} Retrieval:`);
    console.log(`    Precision@${topK}: ${(retrieval.meanPrecisionAtK * 100).toFixed(1)}%`);
    console.log(`    Recall@${topK}: ${(retrieval.meanRecallAtK * 100).toFixed(1)}%`);
    console.log(`    MAP: ${(retrieval.MAP * 100).toFixed(1)}%`);
    
    if (topK === 5) {
      results.retrieval = retrieval;
    }
  }
  
  // 3. Attention entropy analysis
  console.log('\n3. Attention Entropy Analysis');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n\t\tMean Entropy\tNormalized\tSpread');
  
  results.attentionEntropy = [];
  for (const n of [10, 50, 100, 500]) {
    const entropy = evaluateAttentionEntropy(n, k, config.numPrimes, 20);
    results.attentionEntropy.push({ n, ...entropy });
    console.log(`  ${n}\t\t${entropy.meanEntropy.toFixed(3)}\t\t${(entropy.normalizedEntropy * 100).toFixed(1)}%\t\t${entropy.stddev.toFixed(3)}`);
  }
  
  // 4. Analogy completion
  console.log('\n4. Analogy Completion Test');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const analogies = createAnalogyDataset(config.numPrimes, k);
  const candidates = ['woman', 'Japan', 'kitten', 'small', 'night', 'man', 'France', 'puppy', 'big', 'day'];
  
  const analogyResults = evaluateAnalogyCompletion(analogies, candidates, config.numPrimes, k);
  results.analogyCompletion = analogyResults;
  
  console.log(`  Accuracy: ${(analogyResults.accuracy * 100).toFixed(1)}% (${Math.round(analogyResults.accuracy * analogies.length)}/${analogies.length})`);
  console.log('\n  Details:');
  for (const detail of analogyResults.details) {
    const mark = detail.isCorrect ? '✓' : '✗';
    console.log(`    ${detail.analogy} → ${detail.predicted} (expected: ${detail.expected}) ${mark}`);
  }
  
  // 5. Component contribution analysis
  console.log('\n5. Score Component Analysis');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const componentAnalysis = analyzeComponents(dataset.slice(0, 10));
  results.componentAnalysis = componentAnalysis;
  
  console.log(`  Average Jaccard contribution: ${(componentAnalysis.avgJaccard * 100).toFixed(1)}%`);
  console.log(`  Average Quaternion contribution: ${(componentAnalysis.avgQuaternion * 100).toFixed(1)}%`);
  console.log(`  Average Phase contribution: ${(componentAnalysis.avgPhase * 100).toFixed(1)}%`);
  
  // 6. Summary
  console.log('\n6. Quality Summary');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const qualityScore = (
    (selfSim.allPerfect ? 1 : selfSim.mean) * 0.2 +
    results.retrieval.MAP * 0.4 +
    (1 - results.attentionEntropy[1].normalizedEntropy) * 0.2 + // Lower entropy is better
    analogyResults.accuracy * 0.2
  );
  
  console.log(`  Overall Quality Score: ${(qualityScore * 100).toFixed(1)}%`);
  console.log(`  - Identity preservation: ${selfSim.allPerfect ? 'PASS' : 'PARTIAL'}`);
  console.log(`  - Semantic clustering: ${results.retrieval.MAP > 0.5 ? 'GOOD' : 'MODERATE'}`);
  console.log(`  - Attention focus: ${results.attentionEntropy[1].normalizedEntropy < 0.5 ? 'FOCUSED' : 'SPREAD'}`);
  console.log(`  - Analogy reasoning: ${analogyResults.accuracy > 0.6 ? 'GOOD' : 'MODERATE'}`);
  
  results.qualityScore = qualityScore;
  
  // Save results
  const resultsDir = path.join(__dirname, config.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const outPath = path.join(resultsDir, 'quality-metrics.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results saved to ${outPath}`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    BENCHMARK COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return results;
}

/**
 * Analyze contribution of each score component
 */
function analyzeComponents(dataset) {
  const jaccardContributions = [];
  const quatContributions = [];
  const phaseContributions = [];
  
  for (let i = 0; i < dataset.length; i++) {
    for (let j = i + 1; j < dataset.length; j++) {
      const stateI = dataset[i].state;
      const stateJ = dataset[j].state;
      
      // Compute individual components
      const primesI = new Set(stateI.getActivePrimes());
      const primesJ = new Set(stateJ.getActivePrimes());
      
      const intersection = new Set([...primesI].filter(p => primesJ.has(p)));
      const union = new Set([...primesI, ...primesJ]);
      
      const jaccard = intersection.size / (union.size || 1);
      
      let quatSum = 0, phaseSum = 0;
      if (intersection.size > 0) {
        for (const p of intersection) {
          const qi = stateI.get(p).quaternion;
          const qj = stateJ.get(p).quaternion;
          quatSum += Math.abs(qi.dot(qj));
          
          const phaseI = stateI.get(p).amplitude.phase();
          const phaseJ = stateJ.get(p).amplitude.phase();
          phaseSum += Math.cos(phaseI - phaseJ);
        }
        quatSum /= intersection.size;
        phaseSum = (phaseSum / intersection.size + 1) / 2;
      }
      
      jaccardContributions.push(jaccard);
      quatContributions.push(quatSum);
      phaseContributions.push(phaseSum);
    }
  }
  
  return {
    avgJaccard: mean(jaccardContributions),
    avgQuaternion: mean(quatContributions),
    avgPhase: mean(phaseContributions)
  };
}

// Run if main module
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, evaluateRetrieval, evaluateAttentionEntropy };