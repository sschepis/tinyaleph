/**
 * Comparison Benchmark: Resonant Attention vs Standard Dot-Product Attention
 * 
 * Side-by-side comparison of:
 * - Resonant Attention (sparse, prime-indexed)
 * - Standard Dot-Product Attention (dense)
 * 
 * Measures speedup factor as sparsity varies.
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
// Dense Attention Implementation (Standard Transformer)
// ============================================================================

/**
 * Dense vector representation for comparison
 */
class DenseVector {
  constructor(dimension) {
    this.dimension = dimension;
    this.data = new Float64Array(dimension);
  }
  
  static random(dimension) {
    const v = new DenseVector(dimension);
    let normSq = 0;
    for (let i = 0; i < dimension; i++) {
      v.data[i] = Math.random() * 2 - 1;
      normSq += v.data[i] ** 2;
    }
    // Normalize
    const norm = Math.sqrt(normSq);
    for (let i = 0; i < dimension; i++) {
      v.data[i] /= norm;
    }
    return v;
  }
  
  dot(other) {
    let sum = 0;
    for (let i = 0; i < this.dimension; i++) {
      sum += this.data[i] * other.data[i];
    }
    return sum;
  }
  
  scale(k) {
    const v = new DenseVector(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      v.data[i] = this.data[i] * k;
    }
    return v;
  }
  
  add(other) {
    const v = new DenseVector(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      v.data[i] = this.data[i] + other.data[i];
    }
    return v;
  }
}

/**
 * Standard scaled dot-product attention
 * Attention(Q, K, V) = softmax(QK^T / sqrt(d)) V
 */
function dotProductAttention(query, keys, values, temperature = 1.0) {
  const n = keys.length;
  const d = query.dimension;
  const scaleFactor = Math.sqrt(d);
  
  // Compute scores
  const scores = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    scores[i] = query.dot(keys[i]) / scaleFactor;
  }
  
  // Softmax
  const maxScore = Math.max(...scores);
  const expScores = new Float64Array(n);
  let sumExp = 0;
  for (let i = 0; i < n; i++) {
    expScores[i] = Math.exp((scores[i] - maxScore) / temperature);
    sumExp += expScores[i];
  }
  
  const weights = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    weights[i] = expScores[i] / sumExp;
  }
  
  // Weighted sum of values
  const result = new DenseVector(d);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      result.data[j] += weights[i] * values[i].data[j];
    }
  }
  
  return { result, weights, scores: Array.from(scores) };
}

// ============================================================================
// Sparse State Creation
// ============================================================================

function createRandomSparseState(numPrimes, k) {
  const allPrimes = firstNPrimes(numPrimes);
  const state = new SparsePrimeState(numPrimes, k);
  
  const shuffled = [...allPrimes].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, k);
  
  for (let i = 0; i < selected.length; i++) {
    const p = selected[i];
    const phase = 2 * Math.PI * Math.random();
    const amplitude = Complex.fromPolar(1 / Math.sqrt(k), phase);
    const q = Quaternion.random();
    state.set(p, amplitude, q);
  }
  
  return state;
}

// ============================================================================
// Utility Functions
// ============================================================================

function hrToMs(hrtime) {
  return hrtime[0] * 1000 + hrtime[1] / 1e6;
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length);
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ============================================================================
// Benchmarks
// ============================================================================

/**
 * Benchmark dense dot-product attention
 */
function benchDenseAttention(n, d, trials) {
  const query = DenseVector.random(d);
  const keys = Array.from({ length: n }, () => DenseVector.random(d));
  const values = keys;
  
  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    dotProductAttention(query, keys, values);
  }
  
  // Timed runs
  const times = [];
  for (let t = 0; t < trials; t++) {
    const start = process.hrtime();
    dotProductAttention(query, keys, values);
    const end = process.hrtime(start);
    times.push(hrToMs(end));
  }
  
  return {
    mean: mean(times),
    median: median(times),
    stddev: stddev(times),
    min: Math.min(...times),
    max: Math.max(...times)
  };
}

/**
 * Benchmark sparse resonant attention
 */
function benchSparseAttention(n, k, numPrimes, trials) {
  const query = createRandomSparseState(numPrimes, k);
  const keys = Array.from({ length: n }, () => createRandomSparseState(numPrimes, k));
  const values = keys;
  
  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    resonantAttention(query, keys, values);
  }
  
  // Timed runs
  const times = [];
  for (let t = 0; t < trials; t++) {
    const start = process.hrtime();
    resonantAttention(query, keys, values);
    const end = process.hrtime(start);
    times.push(hrToMs(end));
  }
  
  return {
    mean: mean(times),
    median: median(times),
    stddev: stddev(times),
    min: Math.min(...times),
    max: Math.max(...times)
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    RESONANT vs DOT-PRODUCT ATTENTION: COMPARISON BENCHMARK');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    benchmark: 'comparison',
    config: {
      numPrimes: config.numPrimes,
      trials: config.trials
    },
    denseAttention: [],
    sparseAttention: [],
    speedup: []
  };
  
  // 1. Dense attention baseline
  console.log('1. Dense Dot-Product Attention Baseline');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n\t\td\t\tMean (ms)\tStddev (ms)');
  
  for (const d of config.denseDimensions) {
    for (const n of [100, 500, 1000]) {
      const stats = benchDenseAttention(n, d, config.trials);
      results.denseAttention.push({ n, d, ...stats });
      console.log(`  ${n}\t\t${d}\t\t${stats.mean.toFixed(4)}\t\t${stats.stddev.toFixed(4)}`);
    }
  }
  
  // 2. Sparse resonant attention
  console.log('\n2. Sparse Resonant Attention');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n\t\tk\t\tMean (ms)\tStddev (ms)');
  
  for (const k of config.sparsityLevels) {
    for (const n of [100, 500, 1000]) {
      const stats = benchSparseAttention(n, k, config.numPrimes, config.trials);
      results.sparseAttention.push({ n, k, ...stats });
      console.log(`  ${n}\t\t${k}\t\t${stats.mean.toFixed(4)}\t\t${stats.stddev.toFixed(4)}`);
    }
  }
  
  // 3. Speedup comparison (matching complexity: d vs k)
  console.log('\n3. Speedup Analysis: Sparse vs Dense (matched complexity)');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n\t\tk=d\t\tDense (ms)\tSparse (ms)\tSpeedup');
  
  const comparisonPoints = [
    { n: 100, k: 64, d: 64 },
    { n: 100, k: 128, d: 128 },
    { n: 100, k: 256, d: 256 },
    { n: 500, k: 64, d: 64 },
    { n: 500, k: 128, d: 128 },
    { n: 1000, k: 64, d: 64 },
    { n: 1000, k: 32, d: 256 } // Sparse advantage case
  ];
  
  for (const { n, k, d } of comparisonPoints) {
    const denseStats = benchDenseAttention(n, d, config.trials);
    const sparseStats = benchSparseAttention(n, k, config.numPrimes, config.trials);
    
    const speedup = denseStats.mean / sparseStats.mean;
    
    results.speedup.push({
      n, k, d,
      dense: denseStats,
      sparse: sparseStats,
      speedup
    });
    
    const speedupStr = speedup >= 1 ? `${speedup.toFixed(2)}×` : `${(1/speedup).toFixed(2)}× slower`;
    console.log(`  ${n}\t\t${k}=${d}\t\t${denseStats.mean.toFixed(4)}\t\t${sparseStats.mean.toFixed(4)}\t\t${speedupStr}`);
  }
  
  // 4. Break-even analysis
  console.log('\n4. Break-Even Analysis');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  Finding sparsity level k where sparse matches dense d=512...');
  
  const n_test = 500;
  const d_test = 512;
  const denseBaseline = benchDenseAttention(n_test, d_test, config.trials);
  
  let breakEvenK = null;
  for (const k of [32, 64, 128, 256, 512, 1024]) {
    const sparseStats = benchSparseAttention(n_test, k, config.numPrimes, config.trials);
    const speedup = denseBaseline.mean / sparseStats.mean;
    
    console.log(`  k=${k}: ${sparseStats.mean.toFixed(4)} ms (${speedup.toFixed(2)}× vs dense)`);
    
    if (speedup < 1 && breakEvenK === null) {
      breakEvenK = k;
    }
  }
  
  console.log(`\n  Break-even point: k ≈ ${breakEvenK || '> 1024'}`);
  console.log(`  → Resonant attention faster when k < ${breakEvenK || 1024}`);
  
  results.breakEven = { n: n_test, d: d_test, breakEvenK };
  
  // 5. Scaling summary
  console.log('\n5. Scaling Summary');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const sparseK32 = results.sparseAttention.filter(r => r.k === 32);
  const sparseK64 = results.sparseAttention.filter(r => r.k === 64);
  const denseD256 = results.denseAttention.filter(r => r.d === 256);
  
  console.log('  Sparse k=32 scaling:');
  for (const r of sparseK32) {
    console.log(`    n=${r.n}: ${r.mean.toFixed(4)} ms`);
  }
  
  console.log('  Dense d=256 scaling:');
  for (const r of denseD256) {
    console.log(`    n=${r.n}: ${r.mean.toFixed(4)} ms`);
  }
  
  // Calculate scaling exponent
  if (sparseK32.length >= 2) {
    const x1 = Math.log(sparseK32[0].n);
    const x2 = Math.log(sparseK32[sparseK32.length - 1].n);
    const y1 = Math.log(sparseK32[0].mean);
    const y2 = Math.log(sparseK32[sparseK32.length - 1].mean);
    const sparseExponent = (y2 - y1) / (x2 - x1);
    console.log(`\n  Sparse scaling exponent: O(n^${sparseExponent.toFixed(2)})`);
    results.sparseExponent = sparseExponent;
  }
  
  if (denseD256.length >= 2) {
    const x1 = Math.log(denseD256[0].n);
    const x2 = Math.log(denseD256[denseD256.length - 1].n);
    const y1 = Math.log(denseD256[0].mean);
    const y2 = Math.log(denseD256[denseD256.length - 1].mean);
    const denseExponent = (y2 - y1) / (x2 - x1);
    console.log(`  Dense scaling exponent: O(n^${denseExponent.toFixed(2)})`);
    results.denseExponent = denseExponent;
  }
  
  // Save results
  const resultsDir = path.join(__dirname, config.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const outPath = path.join(resultsDir, 'comparison.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results saved to ${outPath}`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    BENCHMARK COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return results;
}

// Run if main module
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, benchDenseAttention, benchSparseAttention, dotProductAttention };