# Resonant Attention Benchmarks

Empirical benchmarks for the Resonant Attention paper. These scripts measure time complexity, memory usage, and compare performance against standard dot-product attention.

## Prerequisites

```bash
cd ra
npm install
```

## Running Benchmarks

### Full Benchmark Suite

```bash
npm run benchmark
```

### Individual Benchmarks

```bash
# Time complexity analysis
node bench-time.js

# Memory usage analysis
node bench-memory.js

# Comparison with dot-product attention
node bench-comparison.js

# Accuracy/quality metrics
node bench-quality.js
```

### Generate Plots

```bash
npm run plot
```

This generates publication-ready plots in `./results/`.

## Benchmark Descriptions

### 1. Time Complexity (`bench-time.js`)

Measures execution time as a function of:
- **n**: Number of key-value pairs (sequence length)
- **k**: Sparsity (active primes per state)
- **d**: Dimension for dense attention comparison

Validates the theoretical O(nk) complexity claim.

### 2. Memory Usage (`bench-memory.js`)

Measures heap memory allocation for:
- Sparse prime state storage
- Resonance score computation
- Full attention computation

Validates the O(7nk) space complexity.

### 3. Comparison (`bench-comparison.js`)

Side-by-side comparison of:
- Resonant Attention (sparse, prime-indexed)
- Standard Dot-Product Attention (dense)

Measures speedup factor as sparsity varies.

### 4. Quality Metrics (`bench-quality.js`)

Evaluates attention quality on:
- Semantic similarity retrieval
- Text classification
- Word analogy tasks

## Output Format

Results are saved as JSON in `./results/`:

```json
{
  "timestamp": "2024-01-07T12:00:00Z",
  "benchmark": "time-complexity",
  "data": [
    { "n": 100, "k": 32, "time_ms": 5.2 },
    { "n": 200, "k": 32, "time_ms": 10.1 }
  ]
}
```

## Configuration

Edit `config.js` to customize:
- Number of trials per measurement
- Warmup iterations
- Prime vocabulary size
- Sparsity levels to test

## Reproducing Paper Results

To reproduce all figures in the paper:

```bash
npm run reproduce
```

This runs the full benchmark suite with paper settings and generates all figures.