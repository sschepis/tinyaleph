/**
 * Plot Generator for Resonant Attention Benchmarks
 * 
 * Generates ASCII plots and data files for publication.
 * For high-quality figures, export JSON to Python/matplotlib.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// ============================================================================
// ASCII Plotting Utilities
// ============================================================================

/**
 * Simple ASCII bar chart
 */
function barChart(data, labelKey, valueKey, options = {}) {
  const { width = 50, title = '' } = options;
  
  const maxValue = Math.max(...data.map(d => d[valueKey]));
  const maxLabelLen = Math.max(...data.map(d => String(d[labelKey]).length));
  
  let output = '';
  if (title) {
    output += `\n  ${title}\n`;
    output += '  ' + '─'.repeat(width + maxLabelLen + 15) + '\n';
  }
  
  for (const item of data) {
    const label = String(item[labelKey]).padStart(maxLabelLen);
    const value = item[valueKey];
    const barLen = Math.round((value / maxValue) * width);
    const bar = '█'.repeat(barLen);
    output += `  ${label} │${bar} ${value.toFixed(4)}\n`;
  }
  
  return output;
}

/**
 * ASCII scatter/line plot
 */
function linePlot(xData, yData, options = {}) {
  const { width = 60, height = 20, title = '', xLabel = 'x', yLabel = 'y' } = options;
  
  const minX = Math.min(...xData);
  const maxX = Math.max(...xData);
  const minY = Math.min(...yData);
  const maxY = Math.max(...yData);
  
  // Create grid
  const grid = Array.from({ length: height }, () => Array(width).fill(' '));
  
  // Plot points
  for (let i = 0; i < xData.length; i++) {
    const x = Math.round(((xData[i] - minX) / (maxX - minX || 1)) * (width - 1));
    const y = height - 1 - Math.round(((yData[i] - minY) / (maxY - minY || 1)) * (height - 1));
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = '●';
    }
  }
  
  // Connect points with lines (simple)
  for (let i = 0; i < xData.length - 1; i++) {
    const x1 = Math.round(((xData[i] - minX) / (maxX - minX || 1)) * (width - 1));
    const y1 = height - 1 - Math.round(((yData[i] - minY) / (maxY - minY || 1)) * (height - 1));
    const x2 = Math.round(((xData[i + 1] - minX) / (maxX - minX || 1)) * (width - 1));
    const y2 = height - 1 - Math.round(((yData[i + 1] - minY) / (maxY - minY || 1)) * (height - 1));
    
    // Simple line drawing
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const steps = Math.max(dx, dy);
    
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x1 + (x2 - x1) * s / (steps || 1));
      const y = Math.round(y1 + (y2 - y1) * s / (steps || 1));
      if (x >= 0 && x < width && y >= 0 && y < height && grid[y][x] === ' ') {
        grid[y][x] = '·';
      }
    }
  }
  
  // Build output
  let output = '';
  if (title) {
    output += `\n  ${title}\n\n`;
  }
  
  // Y axis
  output += `  ${maxY.toFixed(2).padStart(8)} ┤\n`;
  for (let row = 0; row < height; row++) {
    if (row === 0 || row === height - 1) {
      output += '           │';
    } else {
      output += '           │';
    }
    output += grid[row].join('') + '\n';
  }
  output += `  ${minY.toFixed(2).padStart(8)} ┤\n`;
  output += '           └' + '─'.repeat(width) + '\n';
  output += `            ${minX.toFixed(0)}${' '.repeat(width - 10)}${maxX.toFixed(0)}\n`;
  output += `            ${' '.repeat(Math.floor(width / 2) - xLabel.length / 2)}${xLabel}\n`;
  
  return output;
}

/**
 * Generate comparison table
 */
function comparisonTable(data, columns, options = {}) {
  const { title = '' } = options;
  
  const colWidths = columns.map(col => 
    Math.max(col.label.length, ...data.map(d => String(col.format ? col.format(d[col.key]) : d[col.key]).length))
  );
  
  let output = '';
  if (title) {
    output += `\n  ${title}\n`;
  }
  
  // Header
  output += '  ┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐\n';
  output += '  │' + columns.map((col, i) => ` ${col.label.padEnd(colWidths[i])} `).join('│') + '│\n';
  output += '  ├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤\n';
  
  // Data rows
  for (const row of data) {
    output += '  │';
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const value = col.format ? col.format(row[col.key]) : String(row[col.key]);
      output += ` ${value.padEnd(colWidths[i])} │`;
    }
    output += '\n';
  }
  
  output += '  └' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘\n';
  
  return output;
}

// ============================================================================
// Plot Generators
// ============================================================================

/**
 * Plot time complexity results
 */
function plotTimeComplexity(results) {
  let output = '\n══════════════════════════════════════════════════════════════\n';
  output += '                TIME COMPLEXITY PLOTS\n';
  output += '══════════════════════════════════════════════════════════════\n';
  
  // 1. Resonance score vs k
  const resScoreData = results.resonanceScore;
  output += barChart(resScoreData, 'k', 'mean', { title: 'Resonance Score Time vs Sparsity (k)' });
  
  // 2. Attention time vs n
  const attnData = results.resonantAttention;
  output += '\n';
  output += linePlot(
    attnData.map(d => d.n),
    attnData.map(d => d.mean),
    { title: 'Resonant Attention Time vs Sequence Length (n)', xLabel: 'n', yLabel: 'time (ms)' }
  );
  
  // 3. Scaling analysis (nk vs time)
  if (results.scaling) {
    output += '\n';
    output += linePlot(
      results.scaling.map(d => d.nk),
      results.scaling.map(d => d.mean),
      { title: 'Time vs n×k Product (Linear = O(nk) confirmed)', xLabel: 'n×k', yLabel: 'time (ms)' }
    );
    
    if (results.linearFit) {
      output += `\n  Linear Fit: time = ${results.linearFit.slope.toExponential(3)} × nk + ${results.linearFit.intercept.toFixed(4)}\n`;
      output += `  R² = ${results.linearFit.rSquared.toFixed(4)}\n`;
    }
  }
  
  return output;
}

/**
 * Plot memory usage results
 */
function plotMemoryUsage(results) {
  let output = '\n══════════════════════════════════════════════════════════════\n';
  output += '                MEMORY USAGE PLOTS\n';
  output += '══════════════════════════════════════════════════════════════\n';
  
  // 1. Memory vs k
  const byK = results.stateStorage.filter(d => d.n === 100);
  if (byK.length > 0) {
    output += barChart(
      byK.map(d => ({ k: d.k, mem: d.heapUsed.mean / 1024 })),
      'k', 'mem',
      { title: 'Memory (KB) vs Sparsity (k) [n=100]' }
    );
  }
  
  // 2. Memory vs n
  const byN = results.stateStorage.filter(d => d.k === 32);
  if (byN.length > 0) {
    output += '\n';
    output += linePlot(
      byN.map(d => d.n),
      byN.map(d => d.heapUsed.mean / 1024),
      { title: 'Memory (KB) vs Sequence Length (n) [k=32]', xLabel: 'n', yLabel: 'memory (KB)' }
    );
  }
  
  // 3. Theoretical vs actual
  if (results.theoreticalValidation) {
    output += '\n';
    output += comparisonTable(
      results.theoreticalValidation.slice(0, 6),
      [
        { key: 'n', label: 'n' },
        { key: 'k', label: 'k' },
        { key: 'theoretical', label: 'Theoretical (B)', format: v => (v).toFixed(0) },
        { key: 'actual', label: 'Actual (B)', format: v => (v).toFixed(0) },
        { key: 'ratio', label: 'Ratio', format: v => v.toFixed(2) + '×' }
      ],
      { title: 'Theoretical vs Actual Memory' }
    );
  }
  
  return output;
}

/**
 * Plot comparison results
 */
function plotComparison(results) {
  let output = '\n══════════════════════════════════════════════════════════════\n';
  output += '            RESONANT vs DOT-PRODUCT COMPARISON\n';
  output += '══════════════════════════════════════════════════════════════\n';
  
  // 1. Speedup table
  if (results.speedup) {
    output += comparisonTable(
      results.speedup,
      [
        { key: 'n', label: 'n' },
        { key: 'k', label: 'k' },
        { key: 'd', label: 'd' },
        { key: 'dense', label: 'Dense (ms)', format: v => v.mean.toFixed(4) },
        { key: 'sparse', label: 'Sparse (ms)', format: v => v.mean.toFixed(4) },
        { key: 'speedup', label: 'Speedup', format: v => v >= 1 ? v.toFixed(2) + '×' : (1/v).toFixed(2) + '× slower' }
      ],
      { title: 'Speedup Analysis' }
    );
  }
  
  // 2. Dense scaling
  const denseD256 = results.denseAttention.filter(d => d.d === 256);
  if (denseD256.length > 0) {
    output += '\n';
    output += linePlot(
      denseD256.map(d => d.n),
      denseD256.map(d => d.mean),
      { title: 'Dense Attention (d=256) vs n', xLabel: 'n', yLabel: 'time (ms)' }
    );
  }
  
  // 3. Sparse scaling
  const sparseK32 = results.sparseAttention.filter(d => d.k === 32);
  if (sparseK32.length > 0) {
    output += '\n';
    output += linePlot(
      sparseK32.map(d => d.n),
      sparseK32.map(d => d.mean),
      { title: 'Sparse Attention (k=32) vs n', xLabel: 'n', yLabel: 'time (ms)' }
    );
  }
  
  return output;
}

/**
 * Plot quality metrics
 */
function plotQuality(results) {
  let output = '\n══════════════════════════════════════════════════════════════\n';
  output += '                QUALITY METRICS PLOTS\n';
  output += '══════════════════════════════════════════════════════════════\n';
  
  // 1. Retrieval metrics
  if (results.retrieval) {
    output += '\n  Semantic Retrieval Performance:\n';
    output += '  ─────────────────────────────────────────\n';
    output += `  Precision@5: ${(results.retrieval.meanPrecisionAtK * 100).toFixed(1)}%\n`;
    output += `  Recall@5:    ${(results.retrieval.meanRecallAtK * 100).toFixed(1)}%\n`;
    output += `  MAP:         ${(results.retrieval.MAP * 100).toFixed(1)}%\n`;
  }
  
  // 2. Attention entropy
  if (results.attentionEntropy) {
    output += '\n';
    output += barChart(
      results.attentionEntropy.map(d => ({ n: d.n, entropy: d.normalizedEntropy * 100 })),
      'n', 'entropy',
      { title: 'Normalized Attention Entropy (%) vs n' }
    );
  }
  
  // 3. Component analysis
  if (results.componentAnalysis) {
    output += '\n  Score Component Contributions:\n';
    output += '  ─────────────────────────────────────────\n';
    
    const components = [
      { name: 'Jaccard', value: results.componentAnalysis.avgJaccard },
      { name: 'Quaternion', value: results.componentAnalysis.avgQuaternion },
      { name: 'Phase', value: results.componentAnalysis.avgPhase }
    ];
    
    output += barChart(components, 'name', 'value', {});
  }
  
  // 4. Overall quality score
  if (results.qualityScore) {
    output += `\n  Overall Quality Score: ${(results.qualityScore * 100).toFixed(1)}%\n`;
  }
  
  return output;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export data for matplotlib
 */
function exportForMatplotlib(results, filename) {
  const data = {
    timeComplexity: results.timeComplexity,
    memoryUsage: results.memoryUsage,
    comparison: results.comparison,
    quality: results.quality
  };
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`  Exported data for matplotlib: ${filename}`);
}

/**
 * Generate LaTeX table
 */
function generateLatexTable(data, columns, caption) {
  let latex = '\\begin{table}[h]\n';
  latex += '\\centering\n';
  latex += '\\begin{tabular}{' + 'c'.repeat(columns.length) + '}\n';
  latex += '\\hline\n';
  latex += columns.map(c => c.label).join(' & ') + ' \\\\\n';
  latex += '\\hline\n';
  
  for (const row of data) {
    latex += columns.map(c => c.format ? c.format(row[c.key]) : row[c.key]).join(' & ') + ' \\\\\n';
  }
  
  latex += '\\hline\n';
  latex += '\\end{tabular}\n';
  latex += `\\caption{${caption}}\n`;
  latex += '\\end{table}\n';
  
  return latex;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         RESONANT ATTENTION: PLOT GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const resultsDir = path.join(__dirname, config.resultsDir);
  
  // Check for result files
  const resultFiles = {
    timeComplexity: path.join(resultsDir, 'time-complexity.json'),
    memoryUsage: path.join(resultsDir, 'memory-usage.json'),
    comparison: path.join(resultsDir, 'comparison.json'),
    quality: path.join(resultsDir, 'quality-metrics.json')
  };
  
  const results = {};
  
  for (const [key, file] of Object.entries(resultFiles)) {
    if (fs.existsSync(file)) {
      results[key] = JSON.parse(fs.readFileSync(file, 'utf-8'));
      console.log(`  ✓ Loaded ${key} results`);
    } else {
      console.log(`  ✗ Missing ${key} results (run benchmark first)`);
    }
  }
  
  // Generate plots
  let allPlots = '';
  
  if (results.timeComplexity) {
    allPlots += plotTimeComplexity(results.timeComplexity);
  }
  
  if (results.memoryUsage) {
    allPlots += plotMemoryUsage(results.memoryUsage);
  }
  
  if (results.comparison) {
    allPlots += plotComparison(results.comparison);
  }
  
  if (results.quality) {
    allPlots += plotQuality(results.quality);
  }
  
  console.log(allPlots);
  
  // Save plots to file
  const plotPath = path.join(resultsDir, 'plots.txt');
  fs.writeFileSync(plotPath, allPlots);
  console.log(`\n✓ Plots saved to ${plotPath}`);
  
  // Export for external plotting
  const exportPath = path.join(resultsDir, 'all-results.json');
  exportForMatplotlib(results, exportPath);
  
  // Generate LaTeX tables if comparison data exists
  if (results.comparison && results.comparison.speedup) {
    const latexPath = path.join(resultsDir, 'tables.tex');
    let latex = '% Auto-generated LaTeX tables for Resonant Attention paper\n\n';
    
    latex += generateLatexTable(
      results.comparison.speedup,
      [
        { key: 'n', label: 'n' },
        { key: 'k', label: 'k' },
        { key: 'd', label: 'd' },
        { key: 'speedup', label: 'Speedup', format: v => v.toFixed(2) + '$\\times$' }
      ],
      'Speedup of Resonant Attention over Standard Dot-Product Attention'
    );
    
    fs.writeFileSync(latexPath, latex);
    console.log(`  ✓ LaTeX tables saved to ${latexPath}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    PLOTTING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run if main module
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, barChart, linePlot, comparisonTable };