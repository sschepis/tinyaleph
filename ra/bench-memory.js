/**
 * Memory Usage Benchmark for Resonant Attention
 * 
 * Measures heap memory allocation for:
 * - Sparse prime state storage
 * - Resonance score computation
 * - Full attention computation
 * 
 * Validates the O(7nk) space complexity.
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
// Utility Functions
// ============================================================================

function createRandomState(numPrimes, k) {
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

function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

function getMemoryUsage() {
  forceGC();
  return process.memoryUsage();
}

function bytesToMB(bytes) {
  return bytes / (1024 * 1024);
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
 * Measure memory for storing n states with sparsity k
 */
function benchStateStorage(n, k, numPrimes, trials) {
  const results = [];
  
  for (let t = 0; t < trials; t++) {
    if (config.gcBetweenTrials) forceGC();
    
    const baselineMemory = getMemoryUsage().heapUsed;
    
    // Create n states
    const states = [];
    for (let i = 0; i < n; i++) {
      states.push(createRandomState(numPrimes, k));
    }
    
    const finalMemory = getMemoryUsage().heapUsed;
    const usedMemory = finalMemory - baselineMemory;
    
    results.push({
      heapUsed: usedMemory,
      perState: usedMemory / n,
      perActivation: usedMemory / (n * k)
    });
    
    // Clear states
    states.length = 0;
  }
  
  return {
    heapUsed: {
      mean: mean(results.map(r => r.heapUsed)),
      stddev: stddev(results.map(r => r.heapUsed))
    },
    perState: {
      mean: mean(results.map(r => r.perState)),
      stddev: stddev(results.map(r => r.perState))
    },
    perActivation: {
      mean: mean(results.map(r => r.perActivation)),
      stddev: stddev(results.map(r => r.perActivation))
    }
  };
}

/**
 * Measure memory during attention computation
 */
function benchAttentionMemory(n, k, numPrimes, trials) {
  const results = [];
  
  for (let t = 0; t < trials; t++) {
    if (config.gcBetweenTrials) forceGC();
    
    // Pre-create states
    const query = createRandomState(numPrimes, k);
    const keys = Array.from({ length: n }, () => createRandomState(numPrimes, k));
    const values = keys;
    
    forceGC();
    const baselineMemory = getMemoryUsage().heapUsed;
    
    // Run attention
    const { result, weights, scores } = resonantAttention(query, keys, values, config.temperature);
    
    const peakMemory = getMemoryUsage().heapUsed;
    const additionalMemory = peakMemory - baselineMemory;
    
    results.push({
      additionalMemory,
      resultStateMemory: estimateStateMemory(result, k)
    });
  }
  
  return {
    additionalMemory: {
      mean: mean(results.map(r => r.additionalMemory)),
      stddev: stddev(results.map(r => r.additionalMemory))
    },
    resultStateMemory: {
      mean: mean(results.map(r => r.resultStateMemory)),
      stddev: stddev(results.map(r => r.resultStateMemory))
    }
  };
}

/**
 * Estimate theoretical memory for a state
 */
function estimateStateMemory(state, k) {
  // Per activation:
  // - 1 prime index (8 bytes, assuming number)
  // - 4 quaternion components (4 × 8 = 32 bytes)
  // - 2 complex amplitude components (2 × 8 = 16 bytes)
  // Total: ~56 bytes per activation
  // Plus Map overhead: ~40 bytes per entry
  
  const activations = state.getActivePrimes().length;
  const bytesPerActivation = 56 + 40; // 96 bytes
  return activations * bytesPerActivation;
}

/**
 * Compare actual vs theoretical memory usage
 */
function validateTheoretical(measurements) {
  const theoretical = [];
  
  for (const m of measurements) {
    const theoreticalBytes = m.n * m.k * 96; // 96 bytes per activation
    const actualBytes = m.heapUsed.mean;
    const ratio = actualBytes / theoreticalBytes;
    
    theoretical.push({
      n: m.n,
      k: m.k,
      theoretical: theoreticalBytes,
      actual: actualBytes,
      ratio
    });
  }
  
  return theoretical;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         RESONANT ATTENTION: MEMORY USAGE BENCHMARK');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (!global.gc) {
    console.log('⚠ Note: Run with --expose-gc for accurate measurements');
    console.log('  Example: node --expose-gc bench-memory.js\n');
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    benchmark: 'memory-usage',
    config: {
      numPrimes: config.numPrimes,
      trials: config.memoryTrials
    },
    stateStorage: [],
    attentionMemory: [],
    theoreticalValidation: []
  };
  
  // 1. State storage: vary k
  console.log('1. State Storage: Varying Sparsity (k)');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  k\t\tTotal (KB)\tPer State (B)\tPer Activation (B)');
  
  const fixedN = 100;
  for (const k of config.sparsityLevels) {
    const stats = benchStateStorage(fixedN, k, config.numPrimes, config.memoryTrials);
    results.stateStorage.push({ n: fixedN, k, ...stats });
    console.log(`  ${k}\t\t${(stats.heapUsed.mean / 1024).toFixed(1)}\t\t${stats.perState.mean.toFixed(0)}\t\t${stats.perActivation.mean.toFixed(0)}`);
  }
  
  // 2. State storage: vary n
  console.log('\n2. State Storage: Varying Sequence Length (n)');
  console.log('─────────────────────────────────────────────────────────────────');
  const fixedK = 32;
  console.log(`  (k = ${fixedK})`);
  console.log('  n\t\tTotal (KB)\tPer State (B)');
  
  for (const n of config.sequenceLengths) {
    const stats = benchStateStorage(n, fixedK, config.numPrimes, config.memoryTrials);
    results.stateStorage.push({ n, k: fixedK, ...stats });
    console.log(`  ${n}\t\t${(stats.heapUsed.mean / 1024).toFixed(1)}\t\t${stats.perState.mean.toFixed(0)}`);
  }
  
  // 3. Attention computation memory
  console.log('\n3. Attention Computation Memory');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n\t\tAdditional Memory (KB)');
  
  for (const n of [50, 100, 200, 500]) {
    const stats = benchAttentionMemory(n, fixedK, config.numPrimes, config.memoryTrials);
    results.attentionMemory.push({ n, k: fixedK, ...stats });
    console.log(`  ${n}\t\t${(stats.additionalMemory.mean / 1024).toFixed(1)}`);
  }
  
  // 4. Theoretical validation
  console.log('\n4. Theoretical vs Actual Memory');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  n × k\t\tTheoretical (KB)\tActual (KB)\tRatio');
  
  const storageData = results.stateStorage.map(s => ({
    n: s.n,
    k: s.k,
    heapUsed: s.heapUsed
  }));
  
  const validation = validateTheoretical(storageData);
  results.theoreticalValidation = validation;
  
  for (const v of validation.slice(0, 6)) {
    console.log(`  ${v.n}×${v.k}\t\t${(v.theoretical / 1024).toFixed(1)}\t\t\t${(v.actual / 1024).toFixed(1)}\t\t${v.ratio.toFixed(2)}x`);
  }
  
  // 5. Memory scaling analysis
  console.log('\n5. Memory Scaling Verification');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const nkProducts = results.stateStorage.map(s => s.n * s.k);
  const memories = results.stateStorage.map(s => s.heapUsed.mean);
  
  // Linear regression
  const n_pts = nkProducts.length;
  const sumX = nkProducts.reduce((a, b) => a + b, 0);
  const sumY = memories.reduce((a, b) => a + b, 0);
  const sumXY = nkProducts.reduce((sum, x, i) => sum + x * memories[i], 0);
  const sumX2 = nkProducts.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n_pts * sumXY - sumX * sumY) / (n_pts * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n_pts;
  
  const yMean = sumY / n_pts;
  const ssTot = memories.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssRes = memories.reduce((sum, y, i) => sum + (y - (slope * nkProducts[i] + intercept)) ** 2, 0);
  const rSquared = 1 - ssRes / ssTot;
  
  console.log(`  Linear fit: memory = ${slope.toFixed(2)} × nk + ${intercept.toFixed(0)}`);
  console.log(`  R² = ${rSquared.toFixed(4)}`);
  console.log(`  Bytes per nk = ${slope.toFixed(2)}`);
  console.log(`  → ${rSquared > 0.95 ? 'CONFIRMED' : 'PARTIAL'}: O(nk) space complexity`);
  
  results.linearFit = { slope, intercept, rSquared };
  
  // Save results
  const resultsDir = path.join(__dirname, config.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const outPath = path.join(resultsDir, 'memory-usage.json');
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

module.exports = { main, benchStateStorage, benchAttentionMemory };