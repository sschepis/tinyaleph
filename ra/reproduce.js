/**
 * Reproduce Paper Results
 * 
 * Runs benchmarks with paper-quality settings and generates all figures.
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

// Override config with paper settings
function applyPaperSettings() {
  const ps = config.paperSettings;
  config.trials = ps.trials;
  config.sequenceLengths = ps.sequenceLengths;
  config.sparsityLevels = ps.sparsityLevels;
  config.numPrimes = ps.numPrimes;
  config.memoryTrials = 50;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     RESONANT ATTENTION: PAPER REPRODUCTION                    ║');
  console.log('║     High-quality benchmark settings for publication           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Apply paper settings
  applyPaperSettings();
  console.log('Applied paper settings:');
  console.log(`  trials: ${config.trials}`);
  console.log(`  numPrimes: ${config.numPrimes}`);
  console.log(`  sequenceLengths: [${config.sequenceLengths.join(', ')}]`);
  console.log(`  sparsityLevels: [${config.sparsityLevels.join(', ')}]`);
  console.log('');
  
  const startTime = Date.now();
  const results = {};
  
  // Ensure results directory exists
  const resultsDir = path.join(__dirname, config.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  try {
    // Run all benchmarks
    console.log('\n[1/5] Running time complexity benchmark...');
    results.timeComplexity = await timeBench.main();
    
    console.log('\n[2/5] Running memory usage benchmark...');
    results.memoryUsage = await memoryBench.main();
    
    console.log('\n[3/5] Running comparison benchmark...');
    results.comparison = await comparisonBench.main();
    
    console.log('\n[4/5] Running quality metrics benchmark...');
    results.quality = await qualityBench.main();
    
    console.log('\n[5/5] Generating plots...');
    await plot.main();
    
  } catch (error) {
    console.error('Error during paper reproduction:', error);
    throw error;
  }
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  // Generate paper figures summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    PAPER FIGURES SUMMARY                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  Figure 1: Time complexity O(nk) validation                   ║');
  console.log(`║    R² = ${results.timeComplexity?.linearFit?.rSquared?.toFixed(4) || 'N/A'}                                                ║`);
  console.log('║                                                               ║');
  console.log('║  Figure 2: Memory usage O(nk) validation                      ║');
  console.log(`║    R² = ${results.memoryUsage?.linearFit?.rSquared?.toFixed(4) || 'N/A'}                                                ║`);
  console.log('║                                                               ║');
  console.log('║  Figure 3: Resonant vs Dense Attention speedup                ║');
  console.log(`║    Break-even k ≈ ${results.comparison?.breakEven?.breakEvenK || 'N/A'}                                       ║`);
  console.log('║                                                               ║');
  console.log('║  Figure 4: Semantic retrieval quality                         ║');
  console.log(`║    MAP = ${((results.quality?.retrieval?.MAP || 0) * 100).toFixed(1)}%                                              ║`);
  console.log('║                                                               ║');
  console.log('║  Table 1: Speedup comparison                                  ║');
  console.log('║    (see results/tables.tex)                                   ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total reproduction time: ${totalTime} minutes                       ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Save paper-specific results
  const paperResultsPath = path.join(resultsDir, 'paper-results.json');
  fs.writeFileSync(paperResultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    settings: config.paperSettings,
    totalTimeMinutes: parseFloat(totalTime),
    figures: {
      fig1_time_complexity: {
        rSquared: results.timeComplexity?.linearFit?.rSquared,
        slope: results.timeComplexity?.linearFit?.slope,
        intercept: results.timeComplexity?.linearFit?.intercept
      },
      fig2_memory_usage: {
        rSquared: results.memoryUsage?.linearFit?.rSquared,
        slope: results.memoryUsage?.linearFit?.slope,
        intercept: results.memoryUsage?.linearFit?.intercept
      },
      fig3_speedup: {
        breakEvenK: results.comparison?.breakEven?.breakEvenK,
        maxSpeedup: Math.max(...(results.comparison?.speedup?.map(s => s.speedup) || [0]))
      },
      fig4_quality: {
        map: results.quality?.retrieval?.MAP,
        precision: results.quality?.retrieval?.meanPrecisionAtK,
        recall: results.quality?.retrieval?.meanRecallAtK
      }
    }
  }, null, 2));
  
  console.log(`Paper results saved to: ${paperResultsPath}`);
  console.log('LaTeX tables saved to: results/tables.tex');
  console.log('All data saved to: results/all-results.json');
  console.log('\nPaper reproduction complete!');
  
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