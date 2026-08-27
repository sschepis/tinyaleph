/**
 * Run All Benchmarks
 * 
 * Executes all benchmark suites in sequence and generates plots.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Import benchmark modules
const timeBench = require('./bench-time');
const memoryBench = require('./bench-memory');
const comparisonBench = require('./bench-comparison');
const qualityBench = require('./bench-quality');
const plot = require('./plot');

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     RESONANT ATTENTION: FULL BENCHMARK SUITE                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  const results = {};
  
  // Ensure results directory exists
  const resultsDir = path.join(__dirname, config.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  try {
    // 1. Time complexity benchmark
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│  [1/4] TIME COMPLEXITY BENCHMARK                            │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    results.timeComplexity = await timeBench.main();
    
    // 2. Memory usage benchmark
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│  [2/4] MEMORY USAGE BENCHMARK                               │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    results.memoryUsage = await memoryBench.main();
    
    // 3. Comparison benchmark
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│  [3/4] COMPARISON BENCHMARK                                 │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    results.comparison = await comparisonBench.main();
    
    // 4. Quality metrics benchmark
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│  [4/4] QUALITY METRICS BENCHMARK                            │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    results.quality = await qualityBench.main();
    
    // Generate plots
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│  GENERATING PLOTS                                           │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    await plot.main();
    
  } catch (error) {
    console.error('Error during benchmark execution:', error);
    throw error;
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    BENCHMARK SUMMARY                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  
  if (results.timeComplexity) {
    const tc = results.timeComplexity;
    console.log(`║  Time Complexity:                                             ║`);
    console.log(`║    Linear fit R² = ${tc.linearFit?.rSquared?.toFixed(4) || 'N/A'}                                    ║`);
  }
  
  if (results.memoryUsage) {
    const mu = results.memoryUsage;
    console.log(`║  Memory Usage:                                                ║`);
    console.log(`║    Linear fit R² = ${mu.linearFit?.rSquared?.toFixed(4) || 'N/A'}                                    ║`);
  }
  
  if (results.comparison) {
    const cp = results.comparison;
    console.log(`║  Comparison:                                                  ║`);
    console.log(`║    Break-even k ≈ ${cp.breakEven?.breakEvenK || 'N/A'}                                         ║`);
  }
  
  if (results.quality) {
    const ql = results.quality;
    console.log(`║  Quality:                                                     ║`);
    console.log(`║    Overall Score = ${((ql.qualityScore || 0) * 100).toFixed(1)}%                                     ║`);
  }
  
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total time: ${totalTime}s                                             ║`);
  console.log(`║  Results saved to: ${config.resultsDir}/                               ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Save combined results
  const combinedPath = path.join(resultsDir, 'combined-results.json');
  fs.writeFileSync(combinedPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTimeSeconds: parseFloat(totalTime),
    results
  }, null, 2));
  
  return results;
}

// Run if main module
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { main };