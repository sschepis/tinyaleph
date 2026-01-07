/**
 * Prime Entanglement Graph
 * 
 * Explicit representation of prime relationships that emerge from:
 * - Co-occurrence in semantic contexts
 * - Phase resonance in Kuramoto dynamics
 * - Coherence in hypercomplex states
 * 
 * Structure:
 * - Nodes: Prime numbers
 * - Edges: Weighted by resonance strength, phase alignment, co-occurrence
 * 
 * Applications:
 * - Semantic relationship tracking
 * - Adaptive coupling for synchronization
 * - Memory consolidation patterns
 */

'use strict';

const { isPrime, firstNPrimes } = require('./prime');

/**
 * Edge data for entanglement between two primes
 */
class EntanglementEdge {
  constructor(source, target) {
    this.source = source;
    this.target = target;
    this.weight = 0;
    this.phaseAlignment = 0;
    this.cooccurrenceCount = 0;
    this.resonanceStrength = 0;
    this.lastUpdated = Date.now();
    this.createdAt = Date.now();
  }
  
  /**
   * Update edge from observation
   * @param {number} strength - Observation strength (0-1)
   * @param {number} phaseCorrelation - Phase correlation (-1 to 1)
   */
  observe(strength, phaseCorrelation = 0) {
    this.cooccurrenceCount++;
    
    // Exponential moving average for weight
    const alpha = 0.1;
    this.weight = (1 - alpha) * this.weight + alpha * strength;
    this.phaseAlignment = (1 - alpha) * this.phaseAlignment + alpha * phaseCorrelation;
    this.resonanceStrength = Math.sqrt(this.weight * Math.abs(this.phaseAlignment));
    
    this.lastUpdated = Date.now();
  }
  
  /**
   * Apply decay to edge weight
   * @param {number} rate - Decay rate (0-1)
   */
  decay(rate) {
    this.weight *= (1 - rate);
    this.resonanceStrength *= (1 - rate);
  }
  
  /**
   * Get age in milliseconds
   */
  age() {
    return Date.now() - this.createdAt;
  }
  
  /**
   * Get time since last update in milliseconds
   */
  staleness() {
    return Date.now() - this.lastUpdated;
  }
  
  toJSON() {
    return {
      source: this.source,
      target: this.target,
      weight: this.weight,
      phaseAlignment: this.phaseAlignment,
      cooccurrenceCount: this.cooccurrenceCount,
      resonanceStrength: this.resonanceStrength,
      age: this.age(),
      staleness: this.staleness()
    };
  }
}

/**
 * PrimeEntanglementGraph - Main graph class
 * 
 * Tracks relationships between primes using adjacency list representation.
 */
class PrimeEntanglementGraph {
  /**
   * @param {number[]} primes - Initial set of primes (or number for first N primes)
   * @param {object} options - Configuration
   * @param {number} [options.decayRate=0.01] - Edge weight decay per decay() call
   * @param {number} [options.pruneThreshold=0.01] - Minimum weight to keep edges
   * @param {number} [options.maxEdgesPerNode=50] - Maximum neighbors per prime
   */
  constructor(primes = 100, options = {}) {
    // Handle number input as "first N primes"
    if (typeof primes === 'number') {
      this.primes = new Set(firstNPrimes(primes));
    } else {
      this.primes = new Set(primes.filter(p => isPrime(p)));
    }
    
    this.decayRate = options.decayRate ?? 0.01;
    this.pruneThreshold = options.pruneThreshold ?? 0.01;
    this.maxEdgesPerNode = options.maxEdgesPerNode ?? 50;
    
    // Adjacency list: Map<prime, Map<prime, EntanglementEdge>>
    this.adjacency = new Map();
    
    // Initialize empty adjacency lists
    for (const p of this.primes) {
      this.adjacency.set(p, new Map());
    }
    
    // Statistics
    this.totalObservations = 0;
    this.edgeCount = 0;
  }
  
  /**
   * Add a prime to the graph
   * @param {number} p - Prime to add
   */
  addPrime(p) {
    if (!isPrime(p)) return false;
    if (this.primes.has(p)) return false;
    
    this.primes.add(p);
    this.adjacency.set(p, new Map());
    return true;
  }
  
  /**
   * Get edge between two primes (creates if doesn't exist)
   * @param {number} p1 - First prime
   * @param {number} p2 - Second prime
   * @returns {EntanglementEdge|null} Edge or null if primes not in graph
   */
  getEdge(p1, p2) {
    if (!this.primes.has(p1) || !this.primes.has(p2)) return null;
    if (p1 === p2) return null;
    
    // Ensure consistent ordering
    const [source, target] = p1 < p2 ? [p1, p2] : [p2, p1];
    
    const neighbors = this.adjacency.get(source);
    if (!neighbors.has(target)) {
      const edge = new EntanglementEdge(source, target);
      neighbors.set(target, edge);
      this.adjacency.get(target).set(source, edge); // Bidirectional reference
      this.edgeCount++;
    }
    
    return neighbors.get(target);
  }
  
  /**
   * Check if edge exists
   * @param {number} p1 - First prime
   * @param {number} p2 - Second prime
   */
  hasEdge(p1, p2) {
    if (!this.primes.has(p1) || !this.primes.has(p2)) return false;
    const [source, target] = p1 < p2 ? [p1, p2] : [p2, p1];
    return this.adjacency.get(source)?.has(target) ?? false;
  }
  
  /**
   * Observe co-occurrence of primes
   * 
   * @param {number[]} primes1 - First set of primes
   * @param {number[]} primes2 - Second set of primes (or same as first)
   * @param {number} strength - Observation strength (0-1)
   * @param {Map<number, number>} phases - Optional phase map for correlation
   */
  observe(primes1, primes2 = null, strength = 1.0, phases = null) {
    primes2 = primes2 || primes1;
    
    // Filter to known primes
    const set1 = primes1.filter(p => this.primes.has(p));
    const set2 = primes2.filter(p => this.primes.has(p));
    
    // Create/update edges for all pairs
    for (const p1 of set1) {
      for (const p2 of set2) {
        if (p1 === p2) continue;
        
        const edge = this.getEdge(p1, p2);
        if (edge) {
          // Compute phase correlation if phases provided
          let phaseCorr = 0;
          if (phases && phases.has(p1) && phases.has(p2)) {
            const phase1 = phases.get(p1);
            const phase2 = phases.get(p2);
            phaseCorr = Math.cos(phase1 - phase2);
          }
          
          edge.observe(strength, phaseCorr);
        }
      }
    }
    
    this.totalObservations++;
  }
  
  /**
   * Get neighbors of a prime within k hops
   * @param {number} prime - Source prime
   * @param {number} depth - Maximum hop distance (default 1)
   * @param {number} minWeight - Minimum edge weight to follow
   * @returns {Map<number, {distance: number, pathWeight: number}>}
   */
  neighbors(prime, depth = 1, minWeight = 0) {
    if (!this.primes.has(prime)) return new Map();
    
    const result = new Map();
    const visited = new Set([prime]);
    const queue = [{ node: prime, distance: 0, pathWeight: 1 }];
    
    while (queue.length > 0) {
      const { node, distance, pathWeight } = queue.shift();
      
      if (distance >= depth) continue;
      
      const neighbors = this.adjacency.get(node);
      if (!neighbors) continue;
      
      for (const [neighbor, edge] of neighbors) {
        if (visited.has(neighbor)) continue;
        if (edge.weight < minWeight) continue;
        
        visited.add(neighbor);
        const newPathWeight = pathWeight * edge.weight;
        
        result.set(neighbor, {
          distance: distance + 1,
          pathWeight: newPathWeight,
          edge: edge.toJSON()
        });
        
        queue.push({
          node: neighbor,
          distance: distance + 1,
          pathWeight: newPathWeight
        });
      }
    }
    
    return result;
  }
  
  /**
   * Find shortest path between two primes (Dijkstra with inverse weights)
   * @param {number} source - Start prime
   * @param {number} target - End prime
   * @returns {object|null} Path info or null if no path
   */
  shortestPath(source, target) {
    if (!this.primes.has(source) || !this.primes.has(target)) return null;
    if (source === target) return { path: [source], totalWeight: 1, hops: 0 };
    
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.primes);
    
    for (const p of this.primes) {
      distances.set(p, Infinity);
    }
    distances.set(source, 0);
    
    while (unvisited.size > 0) {
      // Find minimum distance node
      let current = null;
      let minDist = Infinity;
      for (const p of unvisited) {
        const d = distances.get(p);
        if (d < minDist) {
          minDist = d;
          current = p;
        }
      }
      
      if (current === null || minDist === Infinity) break;
      if (current === target) break;
      
      unvisited.delete(current);
      
      // Update neighbors
      const neighbors = this.adjacency.get(current);
      if (!neighbors) continue;
      
      for (const [neighbor, edge] of neighbors) {
        if (!unvisited.has(neighbor)) continue;
        
        // Distance = inverse of weight (stronger = shorter)
        const edgeDist = edge.weight > 0.001 ? 1 / edge.weight : 1000;
        const alt = distances.get(current) + edgeDist;
        
        if (alt < distances.get(neighbor)) {
          distances.set(neighbor, alt);
          previous.set(neighbor, current);
        }
      }
    }
    
    // Reconstruct path
    if (!previous.has(target) && source !== target) return null;
    
    const path = [target];
    let current = target;
    let totalWeight = 1;
    
    while (previous.has(current)) {
      const prev = previous.get(current);
      const edge = this.getEdge(prev, current);
      totalWeight *= edge.weight;
      path.unshift(prev);
      current = prev;
    }
    
    return {
      path,
      totalWeight,
      hops: path.length - 1,
      distance: distances.get(target)
    };
  }
  
  /**
   * Compute clustering coefficient for a prime
   * Ratio of edges between neighbors to possible edges
   * 
   * @param {number} prime - Prime to analyze
   */
  clusteringCoefficient(prime) {
    if (!this.primes.has(prime)) return 0;
    
    const neighbors = Array.from(this.adjacency.get(prime)?.keys() || []);
    const k = neighbors.length;
    
    if (k < 2) return 0;
    
    let triangles = 0;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        if (this.hasEdge(neighbors[i], neighbors[j])) {
          triangles++;
        }
      }
    }
    
    const possibleTriangles = k * (k - 1) / 2;
    return triangles / possibleTriangles;
  }
  
  /**
   * Compute average clustering coefficient
   */
  averageClusteringCoefficient() {
    let sum = 0;
    let count = 0;
    
    for (const p of this.primes) {
      const cc = this.clusteringCoefficient(p);
      if (!isNaN(cc)) {
        sum += cc;
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }
  
  /**
   * Compute degree centrality for a prime
   */
  degreeCentrality(prime) {
    if (!this.primes.has(prime)) return 0;
    const degree = this.adjacency.get(prime)?.size || 0;
    return degree / (this.primes.size - 1);
  }
  
  /**
   * Get top primes by degree centrality
   * @param {number} k - Number of top primes
   */
  topByDegree(k = 10) {
    const centralities = [];
    
    for (const p of this.primes) {
      centralities.push({
        prime: p,
        centrality: this.degreeCentrality(p),
        degree: this.adjacency.get(p)?.size || 0
      });
    }
    
    return centralities
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, k);
  }
  
  /**
   * Get weighted degree (sum of edge weights) for a prime
   */
  weightedDegree(prime) {
    if (!this.primes.has(prime)) return 0;
    
    let sum = 0;
    const neighbors = this.adjacency.get(prime);
    if (!neighbors) return 0;
    
    for (const edge of neighbors.values()) {
      sum += edge.weight;
    }
    
    return sum;
  }
  
  /**
   * Apply decay to all edges
   * @param {number} rate - Decay rate (uses this.decayRate if not specified)
   */
  decay(rate = null) {
    const decayRate = rate ?? this.decayRate;
    
    for (const neighbors of this.adjacency.values()) {
      for (const edge of neighbors.values()) {
        edge.decay(decayRate);
      }
    }
  }
  
  /**
   * Prune edges below threshold
   * @param {number} threshold - Minimum weight (uses this.pruneThreshold if not specified)
   * @returns {number} Number of edges pruned
   */
  prune(threshold = null) {
    const pruneThreshold = threshold ?? this.pruneThreshold;
    let pruned = 0;
    
    for (const [prime, neighbors] of this.adjacency) {
      const toRemove = [];
      
      for (const [neighbor, edge] of neighbors) {
        if (edge.weight < pruneThreshold) {
          toRemove.push(neighbor);
        }
      }
      
      for (const neighbor of toRemove) {
        neighbors.delete(neighbor);
        this.adjacency.get(neighbor)?.delete(prime);
        pruned++;
      }
    }
    
    // Each edge counted twice (bidirectional)
    this.edgeCount -= pruned / 2;
    return pruned / 2;
  }
  
  /**
   * Convert to adjacency matrix for NetworkKuramoto
   * @param {number[]} primeOrder - Ordering of primes (indices)
   * @returns {number[][]} Adjacency matrix
   */
  toAdjacencyMatrix(primeOrder = null) {
    const order = primeOrder || Array.from(this.primes).sort((a, b) => a - b);
    const n = order.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    const primeToIdx = new Map(order.map((p, i) => [p, i]));
    
    for (const [source, neighbors] of this.adjacency) {
      const i = primeToIdx.get(source);
      if (i === undefined) continue;
      
      for (const [target, edge] of neighbors) {
        const j = primeToIdx.get(target);
        if (j === undefined) continue;
        
        matrix[i][j] = edge.weight;
      }
    }
    
    return matrix;
  }
  
  /**
   * Create NetworkKuramoto model from this graph
   * @param {number[]} frequencies - Oscillator frequencies
   * @param {number} coupling - Global coupling multiplier
   * @returns {object} NetworkKuramoto-compatible object
   */
  toNetworkKuramoto(frequencies, coupling = 0.3) {
    // Import dynamically to avoid circular dependency
    const { NetworkKuramoto } = require('../physics/sync-models');
    
    const primeOrder = Array.from(this.primes).sort((a, b) => a - b);
    const adjacency = this.toAdjacencyMatrix(primeOrder);
    
    // Ensure frequencies match prime count
    const freqs = frequencies.slice(0, primeOrder.length);
    while (freqs.length < primeOrder.length) {
      freqs.push(1.0);
    }
    
    return new NetworkKuramoto(freqs, adjacency, coupling);
  }
  
  /**
   * Export to edge list format
   * @param {number} minWeight - Minimum weight to include
   */
  toEdgeList(minWeight = 0) {
    const edges = [];
    const seen = new Set();
    
    for (const [source, neighbors] of this.adjacency) {
      for (const [target, edge] of neighbors) {
        const key = `${Math.min(source, target)}-${Math.max(source, target)}`;
        if (seen.has(key)) continue;
        
        if (edge.weight >= minWeight) {
          edges.push(edge.toJSON());
          seen.add(key);
        }
      }
    }
    
    return edges;
  }
  
  /**
   * Import from edge list
   * @param {object[]} edges - Array of edge objects
   */
  fromEdgeList(edges) {
    for (const e of edges) {
      this.addPrime(e.source);
      this.addPrime(e.target);
      
      const edge = this.getEdge(e.source, e.target);
      if (edge) {
        edge.weight = e.weight || 0;
        edge.phaseAlignment = e.phaseAlignment || 0;
        edge.cooccurrenceCount = e.cooccurrenceCount || 0;
        edge.resonanceStrength = e.resonanceStrength || 0;
      }
    }
  }
  
  /**
   * Get graph statistics
   */
  stats() {
    let totalWeight = 0;
    let maxWeight = 0;
    let totalDegree = 0;
    
    const seen = new Set();
    
    for (const [prime, neighbors] of this.adjacency) {
      totalDegree += neighbors.size;
      
      for (const [neighbor, edge] of neighbors) {
        const key = `${Math.min(prime, neighbor)}-${Math.max(prime, neighbor)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        totalWeight += edge.weight;
        maxWeight = Math.max(maxWeight, edge.weight);
      }
    }
    
    return {
      nodeCount: this.primes.size,
      edgeCount: seen.size,
      totalObservations: this.totalObservations,
      averageDegree: totalDegree / this.primes.size,
      averageWeight: seen.size > 0 ? totalWeight / seen.size : 0,
      maxWeight,
      averageClustering: this.averageClusteringCoefficient(),
      density: seen.size / (this.primes.size * (this.primes.size - 1) / 2)
    };
  }
  
  /**
   * Clone the graph
   */
  clone() {
    const copy = new PrimeEntanglementGraph(Array.from(this.primes), {
      decayRate: this.decayRate,
      pruneThreshold: this.pruneThreshold,
      maxEdgesPerNode: this.maxEdgesPerNode
    });
    
    copy.fromEdgeList(this.toEdgeList());
    copy.totalObservations = this.totalObservations;
    
    return copy;
  }
  
  /**
   * Merge another graph into this one
   * @param {PrimeEntanglementGraph} other - Graph to merge
   * @param {number} weight - Weight for other graph's edges
   */
  merge(other, weight = 0.5) {
    for (const p of other.primes) {
      this.addPrime(p);
    }
    
    for (const e of other.toEdgeList()) {
      const edge = this.getEdge(e.source, e.target);
      if (edge) {
        edge.weight = (1 - weight) * edge.weight + weight * e.weight;
        edge.phaseAlignment = (1 - weight) * edge.phaseAlignment + weight * e.phaseAlignment;
        edge.cooccurrenceCount += e.cooccurrenceCount;
      }
    }
  }
  
  /**
   * Find strongly connected components
   * Uses Tarjan's algorithm
   */
  findComponents(minWeight = 0.1) {
    const index = new Map();
    const lowlink = new Map();
    const onStack = new Set();
    const stack = [];
    const components = [];
    let idx = 0;
    
    const strongConnect = (v) => {
      index.set(v, idx);
      lowlink.set(v, idx);
      idx++;
      stack.push(v);
      onStack.add(v);
      
      const neighbors = this.adjacency.get(v);
      if (neighbors) {
        for (const [w, edge] of neighbors) {
          if (edge.weight < minWeight) continue;
          
          if (!index.has(w)) {
            strongConnect(w);
            lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
          } else if (onStack.has(w)) {
            lowlink.set(v, Math.min(lowlink.get(v), index.get(w)));
          }
        }
      }
      
      if (lowlink.get(v) === index.get(v)) {
        const component = [];
        let w;
        do {
          w = stack.pop();
          onStack.delete(w);
          component.push(w);
        } while (w !== v);
        components.push(component);
      }
    };
    
    for (const v of this.primes) {
      if (!index.has(v)) {
        strongConnect(v);
      }
    }
    
    return components.filter(c => c.length > 1);
  }
}

/**
 * Factory function for common graph configurations
 */
function createEntanglementGraph(config = {}) {
  const {
    numPrimes = 100,
    primes = null,
    decayRate = 0.01,
    pruneThreshold = 0.01
  } = config;
  
  return new PrimeEntanglementGraph(primes || numPrimes, {
    decayRate,
    pruneThreshold
  });
}

module.exports = {
  EntanglementEdge,
  PrimeEntanglementGraph,
  createEntanglementGraph
};