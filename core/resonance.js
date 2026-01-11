/**
 * Resonance Calculator
 * 
 * Implements Prime Resonance Theory from symprime:
 * Calculates "resonance" between prime numbers using golden ratio detection.
 * 
 * Theory: Primes whose ratio approximates the golden ratio (φ ≈ 1.618) 
 * have "natural harmony" - a mathematically grounded measure of affinity.
 * 
 * R(p1, p2) = 1/ratio + φ_bonus
 * where φ_bonus = 0.3 if |ratio - φ| < threshold
 */

// Golden ratio constant

const PHI = 1.618033988749895;
const PHI_THRESHOLD = 0.1;  // How close to φ counts as "golden"
const PHI_BONUS = 0.3;      // Bonus for golden ratio relationships

/**
 * ResonanceCalculator - Measures harmonic relationships between primes
 */
class ResonanceCalculator {
  constructor(cacheSize = 1000) {
    this.cacheSize = cacheSize;
    this.cache = new Map();
  }

  /**
   * Calculate resonance between two primes
   * R(p1, p2) = 1/ratio + φ_bonus
   * 
   * @param {number|bigint} p1 - First prime
   * @param {number|bigint} p2 - Second prime
   * @returns {number} Resonance value between 0 and ~1.3
   */
  calculateResonance(p1, p2) {
    // Convert to numbers for calculation
    const n1 = Number(p1);
    const n2 = Number(p2);
    
    // Check cache
    const cacheKey = n1 < n2 ? `${n1},${n2}` : `${n2},${n1}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Handle edge cases
    if (n1 === 0 || n2 === 0) return 0;
    if (n1 === n2) return 1.0;  // Self-resonance is perfect

    // Calculate ratio (larger / smaller)
    const [smaller, larger] = n1 < n2 ? [n1, n2] : [n2, n1];
    const ratio = larger / smaller;

    // Base resonance: inverse of ratio (closer primes resonate more)
    let resonance = 1.0 / ratio;

    // Add golden ratio bonus if applicable
    if (this.isGoldenRatio(ratio)) {
      resonance += PHI_BONUS;
    }

    // Cache result
    this.addToCache(cacheKey, resonance);

    return resonance;
  }

  /**
   * Check if a ratio is close to the golden ratio
   */
  isGoldenRatio(ratio) {
    return Math.abs(ratio - PHI) < PHI_THRESHOLD;
  }

  /**
   * Find prime pairs near the golden ratio
   * These are "naturally harmonic" pairs
   * 
   * @param {number[]} primes - Array of primes to search
   * @returns {Array<{p1: number, p2: number, ratio: number, resonance: number}>}
   */
  findGoldenPairs(primes) {
    const pairs = [];
    
    for (let i = 0; i < primes.length; i++) {
      for (let j = i + 1; j < primes.length; j++) {
        const p1 = primes[i];
        const p2 = primes[j];
        const ratio = p2 / p1;
        
        if (this.isGoldenRatio(ratio)) {
          pairs.push({
            p1,
            p2,
            ratio,
            resonance: this.calculateResonance(p1, p2)
          });
        }
      }
    }
    
    return pairs.sort((a, b) => 
      Math.abs(a.ratio - PHI) - Math.abs(b.ratio - PHI)
    );
  }

  /**
   * Calculate vectorized resonance matrix for multiple primes
   * 
   * @param {number[]} primes - Array of primes
   * @returns {number[][]} NxN matrix of resonance values
   */
  calculateMatrix(primes) {
    const n = primes.length;
    const matrix = [];

    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.calculateResonance(primes[i], primes[j]);
      }
    }

    return matrix;
  }

  /**
   * Calculate average resonance of a prime with a set
   * 
   * @param {number} prime - Target prime
   * @param {number[]} primes - Set of primes to compare
   * @returns {number} Average resonance
   */
  calculateAverageResonance(prime, primes) {
    if (primes.length === 0) return 0;
    
    let sum = 0;
    for (const p of primes) {
      sum += this.calculateResonance(prime, p);
    }
    
    return sum / primes.length;
  }

  /**
   * Find the most resonant prime from a set
   * 
   * @param {number} target - Target prime
   * @param {number[]} candidates - Candidate primes
   * @returns {{prime: number, resonance: number}|null}
   */
  findMostResonant(target, candidates) {
    if (candidates.length === 0) return null;

    let maxResonance = -1;
    let mostResonant = null;

    for (const candidate of candidates) {
      const resonance = this.calculateResonance(target, candidate);
      if (resonance > maxResonance) {
        maxResonance = resonance;
        mostResonant = candidate;
      }
    }

    return { prime: mostResonant, resonance: maxResonance };
  }

  /**
   * Find resonance clusters - groups of primes with high mutual resonance
   * 
   * @param {number[]} primes - Primes to cluster
   * @param {number} threshold - Minimum resonance for cluster membership
   * @returns {number[][]} Array of clusters
   */
  findClusters(primes, threshold = 0.5) {
    const clusters = [];
    const visited = new Set();

    for (const p of primes) {
      if (visited.has(p)) continue;

      const cluster = [p];
      visited.add(p);

      for (const q of primes) {
        if (visited.has(q)) continue;
        if (this.calculateResonance(p, q) >= threshold) {
          cluster.push(q);
          visited.add(q);
        }
      }

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Add entry to cache with LRU eviction
   */
  addToCache(key, value) {
    if (this.cache.size >= this.cacheSize) {
      // Remove oldest entry (first key)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Clear the resonance cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize
    };
  }
}

/**
 * Compute resonance signature for a set of primes
 * This is a composite measure of internal harmony
 * 
 * @param {number[]} primes - Set of primes
 * @param {ResonanceCalculator} calc - Calculator instance
 * @returns {{mean: number, variance: number, goldenCount: number}}
 */
function resonanceSignature(primes, calc = new ResonanceCalculator()) {
  if (primes.length < 2) {
    return { mean: 1, variance: 0, goldenCount: 0 };
  }

  const resonances = [];
  let goldenCount = 0;

  for (let i = 0; i < primes.length; i++) {
    for (let j = i + 1; j < primes.length; j++) {
      const r = calc.calculateResonance(primes[i], primes[j]);
      resonances.push(r);
      
      const ratio = Math.max(primes[i], primes[j]) / Math.min(primes[i], primes[j]);
      if (calc.isGoldenRatio(ratio)) {
        goldenCount++;
      }
    }
  }

  const mean = resonances.reduce((a, b) => a + b, 0) / resonances.length;
  const variance = resonances.reduce((sum, r) => sum + (r - mean) ** 2, 0) / resonances.length;

  return { mean, variance, goldenCount };
}

/**
 * Find Fibonacci-like sequences in primes (which approximate golden ratio)
 * These sequences have naturally high resonance
 * 
 * @param {number[]} primes - Sorted array of primes
 * @param {number} minLength - Minimum sequence length
 * @returns {number[][]} Fibonacci-like sequences
 */
function findFibonacciSequences(primes, minLength = 3) {
  const sequences = [];
  
  for (let i = 0; i < primes.length; i++) {
    for (let j = i + 1; j < primes.length; j++) {
      const seq = [primes[i], primes[j]];
      
      // Try to extend the sequence
      let next = primes[i] + primes[j];
      let k = j + 1;
      
      while (k < primes.length) {
        if (primes[k] === next) {
          seq.push(primes[k]);
          next = seq[seq.length - 2] + seq[seq.length - 1];
          k++;
        } else if (primes[k] > next) {
          break;
        } else {
          k++;
        }
      }
      
      if (seq.length >= minLength) {
        sequences.push(seq);
      }
    }
  }
  
  return sequences;
}

// Singleton instance for convenience
const defaultCalculator = new ResonanceCalculator();

// Named exports for ESM compatibility
export {
  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  PHI,
  PHI_THRESHOLD,
  PHI_BONUS
};

// Convenience functions using default calculator
export const calculateResonance = (p1, p2) => defaultCalculator.calculateResonance(p1, p2);
export const findGoldenPairs = (primes) => defaultCalculator.findGoldenPairs(primes);
export const findMostResonant = (target, candidates) => defaultCalculator.findMostResonant(target, candidates);

export default {
  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  PHI,
  PHI_THRESHOLD,
  PHI_BONUS,
  calculateResonance,
  findGoldenPairs,
  findMostResonant
};