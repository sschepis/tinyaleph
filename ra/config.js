/**
 * Benchmark Configuration
 */

module.exports = {
  // Number of warmup iterations before timing
  warmupIterations: 10,
  
  // Number of trials for each measurement (for averaging)
  trials: 50,
  
  // Prime vocabulary size
  numPrimes: 4096,
  
  // Sparsity levels to test (k = active primes per state)
  sparsityLevels: [8, 16, 32, 64, 128, 256],
  
  // Sequence lengths to test (n = number of key-value pairs)
  sequenceLengths: [10, 25, 50, 100, 200, 500, 1000],
  
  // Dense dimension sizes to test (for comparison)
  denseDimensions: [64, 128, 256, 512, 1024],
  
  // Temperature for attention softmax
  temperature: 1.0,
  
  // Mixing coefficients for resonance score
  alpha: 0.33,  // Jaccard weight
  beta: 0.33,   // Quaternion alignment weight
  gamma: 0.34,  // Phase coherence weight
  
  // Memory benchmark settings
  memoryTrials: 20,
  gcBetweenTrials: true,
  
  // Quality benchmark settings
  qualityDatasetSize: 1000,
  similarityThreshold: 0.5,
  
  // Output settings
  resultsDir: './results',
  plotFormat: 'svg',
  precision: 4,
  
  // Paper reproduction settings
  paperSettings: {
    trials: 100,
    sequenceLengths: [10, 25, 50, 100, 200, 500, 1000, 2000],
    sparsityLevels: [16, 32, 64, 128, 256, 512],
    numPrimes: 8192
  }
};