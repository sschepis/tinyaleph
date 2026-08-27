/**
 * Time Complexity Benchmark for Resonant Attention
 * 
 * Measures execution time as a function of:
 * - n: Number of key-value pairs (sequence length)
 * - k: Sparsity (active primes per state)
 * 
 * Validates the theoretical O(nk) complexity claim.
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

// ============================================================================
// Utility Functions
// ============================================================================

function createRandomState(numPrimes, k) {
  const allPrimes = firstNPrimes(numPrimes);
  const state = new SparsePrimeState(numPrimes, k);
  
  // Randomly select k primes
  const shuffled = [...allPrimes].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, k);
  
  for (let i = 0; i < selected.length; i++) {
    const p = selected[i];
    const phase = 2 * Math.PI * Math.random();
    const amplitude = { re: Math.cos(phase) / Math.sqrt(k), im: Math.sin(phase) / Math.sqrt(k) };
    const q = Quaternion.random();
    state.set(p, amplitude, q);
  }
  
  return state;
}

function hrToMs(hrtime) {
  return hrtime[0] * 1000 + hrtime[1] / 1e6;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length);
}

// ============================================================================
// Benchmarks
// ============================================================================

/**
 * Benchmark single resonance score computation
 */
function benchResonanceScore(n, k, numPrimes, trials) {
  // Create two random states
  const stateA = createRandomState(numPrimes, k);
  const stateB = createRandomState(numPrimes, k);
  
  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    resonanceScore(stateA, stateB, config.alpha, config.beta, config.gamma);
  }
  
  // Timed runs
  const times = [];
  for (let t = 0; t < trials; t++) {
    const start = process.hrtime();
    resonanceScore(stateA, stateB, config.alpha, config.beta, config.gamma);
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
 * Benchmark full resonant attention
 */
function benchResonantAttention(n, k, numPrimes, trials) {
  // Create query and n key-value pairs
  const query = createRandomState(numPrimes, k);
  const keys = Array.from({ length: n }, () => createRandomState(numPrimes, k));
  const values = keys; // Use same states as values
  
  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    resonantAttention(query, keys, values, config.temperature);
  }
  
  // Timed runs
  const times = [];
  for (let t = 0; t < trials; t++) {
    const start = process.hrtime();
    resonantAttention(query, keys, values, config.temperature);
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
  console.log('         RESONANT ATTENTION: TIME COMPLEXITY BENCHMARK');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    benchmark: 'time-complexity',
    config: {
      numPrimes: config.numPrimes,
      trials: config.trials,
      warmupIterations: config.warmupIterations
    },
    resonanceScore: [],
    resonantAttention: [],
    scaling: []
  };
  
  // 1. Resonance score: vary k
  console.log('1. Resonance Score: Varying Sparsity (k)');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  k\t\tMean (ms)\tStddev (ms)');
  
  for (const k of config.sparsityLevels) {
    const stats = benchResonanceScore(1, k, config.numPrimes, config.trials);
    results.resonanceScore.push({ k, ...stats });
    console.log(`  ${k}\t\t${stats.mean.toFixed(4)}\t\t${stats.stddev.toFixed(4)}`);
  }
  
  // 2. Full attention: vary n (fixed k)
  console.log('\n2. Resonant Attention: Varying Sequence Length (n)');
  console.log('─────────────────────────────────────────────────────────────────');
  const fixedK = 32;
  console.log(`  (k = ${fixedK})`);
  console.log('  n\t\tMean (ms)\tStddev (ms)');
  
  for (const n of config.sequenceLengths) {
    const stats = benchResonantAttention(n, fixedK, config.numPrimes, config.trials);
    results.resonantAttention.push({ n, k: fixedK, ...stats });
    console.log(`  ${n}\t\t${stats.mean.toFixed(4)}\t\t${stats.stddev.toFixed(4)}`);
  }
  
  // 3. Scaling analysis: n × k matrix
  console.log('\n3. Scaling Analysis: n × k');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n × k product vs time (should be linear)');
  
  const scalingSamples = [
    { n: 50, k: 16 },
    { n: 100, k: 32 },
    { n: 200, k: 64 },
    { n: 50, k: 64 },
    { n: 100, k: 64 },
    { n: 200, k: 32 }
  ];
  
  for (const { n, k } of scalingSamples) {
    const stats = benchResonantAttention(n, k, config.numPrimes, config.trials);
    const nk = n * k;
    results.scaling.push({ n, k, nk, ...stats });
    console.log(`  n=${n}, k=${k} (nk=${nk})\t\t${stats.mean.toFixed(4)} ms`);
  }
  
  // 4. Linear regression on scaling data
  console.log('\n4. Complexity Verification');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const xData = results.scaling.map(d => d.nk);
  const yData = results.scaling.map(d => d.mean);
  
  // Simple linear regression: y = mx + b
  const n_pts = xData.length;
  const sumX = xData.reduce((a, b) => a + b, 0);
  const sumY = yData.reduce((a, b) => a + b, 0);
  const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
  const sumX2 = xData.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n_pts * sumXY - sumX * sumY) / (n_pts * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n_pts;
  
  // R² calculation
  const yMean = sumY / n_pts;
  const ssTot = yData.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssRes = yData.reduce((sum, y, i) => sum + (y - (slope * xData[i] + intercept)) ** 2, 0);
  const rSquared = 1 - ssRes / ssTot;
  
  console.log(`  Linear fit: time = ${slope.toExponential(3)} × nk + ${intercept.toFixed(4)}`);
  console.log(`  R² = ${rSquared.toFixed(4)}`);
  console.log(`  → ${rSquared > 0.95 ? 'CONFIRMED' : 'PARTIAL'}: O(nk) complexity`);
  
  results.linearFit = { slope, intercept, rSquared };
  
  // Save results
  const resultsDir = path.join(__dirname, config.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const outPath = path.join(resultsDir, 'time-complexity.json');
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

module.exports = { main, benchResonanceScore, benchResonantAttention };