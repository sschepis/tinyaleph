/**
 * Extended Synchronization Models
 * 
 * Advanced Kuramoto-family models extending the base KuramotoModel:
 * - NetworkKuramoto: Topology-aware coupling via adjacency matrix
 * - AdaptiveKuramoto: Hebbian plasticity with evolving coupling
 * - SakaguchiKuramoto: Phase frustration with lag parameter α
 * - SmallWorldKuramoto: Watts-Strogatz small-world topology
 * - MultiSystemCoupling: Cross-system synchronization
 */

const { KuramotoModel } = require('./kuramoto');
const { OscillatorBank } = require('./oscillator');

/**
 * NetworkKuramoto - Topology-Aware Coupling
 * 
 * Uses adjacency matrix A for coupling:
 *   dθᵢ/dt = ωᵢ + K Σⱼ Aᵢⱼ sin(θⱼ - θᵢ)
 * 
 * Enables modular synchronization respecting semantic neighborhoods.
 */
class NetworkKuramoto extends KuramotoModel {
  /**
   * @param {number[]} frequencies - Natural frequencies
   * @param {number[][]} adjacency - NxN adjacency matrix (weights or 0/1)
   * @param {number} couplingStrength - Global coupling multiplier
   */
  constructor(frequencies, adjacency = null, couplingStrength = 0.3) {
    super(frequencies, couplingStrength);
    
    const N = frequencies.length;
    
    // Default to all-to-all if no adjacency provided
    if (adjacency) {
      this.adjacency = adjacency;
    } else {
      this.adjacency = Array(N).fill(null).map(() => Array(N).fill(1));
      // Remove self-connections
      for (let i = 0; i < N; i++) {
        this.adjacency[i][i] = 0;
      }
    }
    
    // Precompute degree for normalization
    this.degree = this.adjacency.map(row => row.reduce((a, b) => a + b, 0));
  }
  
  /**
   * Set adjacency from entanglement graph
   * @param {Map} entanglementGraph - Map<prime, Map<prime, {strength}>>
   * @param {number[]} primeList - Ordered list of primes for indexing
   */
  setFromEntanglementGraph(entanglementGraph, primeList) {
    const N = this.oscillators.length;
    const primeToIdx = new Map(primeList.map((p, i) => [p, i]));
    
    // Reset adjacency
    this.adjacency = Array(N).fill(null).map(() => Array(N).fill(0));
    
    for (const [prime, neighbors] of entanglementGraph) {
      const i = primeToIdx.get(prime);
      if (i === undefined || i >= N) continue;
      
      for (const [otherPrime, pair] of neighbors) {
        const j = primeToIdx.get(otherPrime);
        if (j === undefined || j >= N) continue;
        
        this.adjacency[i][j] = pair.strength;
      }
    }
    
    // Recompute degrees
    this.degree = this.adjacency.map(row => row.reduce((a, b) => a + b, 0));
  }
  
  /**
   * Build adjacency from a distance function
   * @param {Function} distFn - (i, j) => distance
   * @param {number} threshold - Connect if distance < threshold
   * @param {boolean} weighted - Use 1/distance as weight
   */
  buildFromDistance(distFn, threshold = Infinity, weighted = false) {
    const N = this.oscillators.length;
    this.adjacency = Array(N).fill(null).map(() => Array(N).fill(0));
    
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const d = distFn(i, j);
        if (d < threshold) {
          const weight = weighted ? 1 / (1 + d) : 1;
          this.adjacency[i][j] = weight;
          this.adjacency[j][i] = weight;
        }
      }
    }
    
    this.degree = this.adjacency.map(row => row.reduce((a, b) => a + b, 0));
  }
  
  /**
   * Network-aware coupling term
   */
  kuramotoCoupling(osc) {
    const idx = this.oscillators.indexOf(osc);
    if (idx < 0) return 0;
    
    let coupling = 0;
    for (let j = 0; j < this.oscillators.length; j++) {
      if (j !== idx && this.adjacency[idx][j] > 0) {
        const other = this.oscillators[j];
        coupling += this.adjacency[idx][j] * Math.sin(other.phase - osc.phase);
      }
    }
    
    // Normalize by degree (if nonzero)
    const norm = this.degree[idx] > 0 ? this.degree[idx] : 1;
    return this.K * coupling / norm;
  }
  
  /**
   * Get clustering coefficient for a node
   */
  clusteringCoefficient(idx) {
    const neighbors = [];
    for (let j = 0; j < this.oscillators.length; j++) {
      if (this.adjacency[idx][j] > 0) neighbors.push(j);
    }
    
    if (neighbors.length < 2) return 0;
    
    let triangles = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (this.adjacency[neighbors[i]][neighbors[j]] > 0) {
          triangles++;
        }
      }
    }
    
    const possible = neighbors.length * (neighbors.length - 1) / 2;
    return triangles / possible;
  }
  
  /**
   * Average clustering coefficient
   */
  averageClustering() {
    let sum = 0;
    for (let i = 0; i < this.oscillators.length; i++) {
      sum += this.clusteringCoefficient(i);
    }
    return sum / this.oscillators.length;
  }
  
  /**
   * Network modularity based on synchronization
   * Returns array of synchronized clusters
   */
  findClusters(phaseThreshold = 0.3) {
    const N = this.oscillators.length;
    const visited = new Array(N).fill(false);
    const clusters = [];
    
    for (let i = 0; i < N; i++) {
      if (visited[i]) continue;
      
      const cluster = [i];
      visited[i] = true;
      const queue = [i];
      
      while (queue.length > 0) {
        const current = queue.shift();
        
        for (let j = 0; j < N; j++) {
          if (!visited[j] && this.adjacency[current][j] > 0) {
            const phaseDiff = Math.abs(this.oscillators[current].phase - this.oscillators[j].phase);
            const wrapped = Math.min(phaseDiff, 2 * Math.PI - phaseDiff);
            
            if (wrapped < phaseThreshold) {
              visited[j] = true;
              cluster.push(j);
              queue.push(j);
            }
          }
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }
}

/**
 * AdaptiveKuramoto - Hebbian Plasticity
 * 
 * Coupling strengths evolve based on synchronization:
 *   dθᵢ/dt = ωᵢ + (1/N) Σⱼ Kᵢⱼ sin(θⱼ - θᵢ)
 *   dKᵢⱼ/dt = ε(cos(θⱼ - θᵢ) - Kᵢⱼ)
 * 
 * "Concepts that sync together link together"
 */
class AdaptiveKuramoto extends NetworkKuramoto {
  /**
   * @param {number[]} frequencies - Natural frequencies
   * @param {number} couplingStrength - Initial global coupling
   * @param {number} learningRate - Plasticity rate ε
   */
  constructor(frequencies, couplingStrength = 0.3, learningRate = 0.01) {
    // Start with all-to-all small initial coupling
    const N = frequencies.length;
    const initialAdjacency = Array(N).fill(null).map((_, i) => 
      Array(N).fill(null).map((_, j) => i === j ? 0 : couplingStrength)
    );
    
    super(frequencies, initialAdjacency, 1.0); // K=1 since coupling is in adjacency
    
    this.epsilon = learningRate;
    this.minCoupling = 0.01;
    this.maxCoupling = 2.0;
    
    // Track coupling history for analysis
    this.couplingHistory = [];
  }
  
  /**
   * Update coupling strengths based on phase alignment
   */
  adaptCoupling(dt) {
    const N = this.oscillators.length;
    
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const phaseDiff = this.oscillators[j].phase - this.oscillators[i].phase;
        const correlation = Math.cos(phaseDiff);
        
        // Hebbian update: dK/dt = ε(correlation - K)
        const delta = this.epsilon * (correlation - this.adjacency[i][j]) * dt;
        
        // Apply with bounds
        const newK = Math.max(this.minCoupling, 
                     Math.min(this.maxCoupling, this.adjacency[i][j] + delta));
        
        this.adjacency[i][j] = newK;
        this.adjacency[j][i] = newK;
      }
    }
    
    // Recompute degrees
    this.degree = this.adjacency.map(row => row.reduce((a, b) => a + b, 0));
  }
  
  tick(dt) {
    // First evolve phases
    super.tick(dt);
    
    // Then adapt coupling
    this.adaptCoupling(dt);
  }
  
  /**
   * Get total coupling strength (sum of all edge weights)
   */
  totalCoupling() {
    let sum = 0;
    const N = this.oscillators.length;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        sum += this.adjacency[i][j];
      }
    }
    return sum;
  }
  
  /**
   * Get coupling matrix snapshot
   */
  getCouplingSnapshot() {
    return this.adjacency.map(row => [...row]);
  }
  
  /**
   * Record coupling state for analysis
   */
  recordCouplingHistory() {
    this.couplingHistory.push({
      time: Date.now(),
      totalCoupling: this.totalCoupling(),
      orderParameter: this.orderParameter(),
      snapshot: this.getCouplingSnapshot()
    });
    
    // Limit history size
    if (this.couplingHistory.length > 1000) {
      this.couplingHistory.shift();
    }
  }
  
  /**
   * Reset coupling to uniform initial state
   */
  resetCoupling(value = 0.3) {
    const N = this.oscillators.length;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        this.adjacency[i][j] = i === j ? 0 : value;
      }
    }
    this.degree = this.adjacency.map(row => row.reduce((a, b) => a + b, 0));
    this.couplingHistory = [];
  }
}

/**
 * SakaguchiKuramoto - Phase Frustration
 * 
 * Adds phase lag parameter α:
 *   dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ - α)
 * 
 * Creates chimera states where some oscillators sync while others don't.
 * Models cognitive dissonance, competing interpretations.
 */
class SakaguchiKuramoto extends KuramotoModel {
  /**
   * @param {number[]} frequencies - Natural frequencies
   * @param {number} couplingStrength - Coupling K
   * @param {number} phaseLag - Frustration parameter α (radians)
   */
  constructor(frequencies, couplingStrength = 0.3, phaseLag = 0) {
    super(frequencies, couplingStrength);
    this.alpha = phaseLag;
  }
  
  /**
   * Set phase lag dynamically
   */
  setPhaseLag(alpha) {
    this.alpha = alpha;
  }
  
  /**
   * Frustrated coupling term
   */
  kuramotoCoupling(osc) {
    let coupling = 0;
    for (const other of this.oscillators) {
      if (other !== osc) {
        // sin(θⱼ - θᵢ - α) = sin(θⱼ - θᵢ)cos(α) - cos(θⱼ - θᵢ)sin(α)
        const diff = other.phase - osc.phase;
        coupling += Math.sin(diff - this.alpha);
      }
    }
    return this.K * coupling / this.oscillators.length;
  }
  
  /**
   * Check for chimera state (partial synchronization)
   * Returns ratio of synchronized oscillators
   */
  chimeraRatio(syncThreshold = 0.3) {
    const meanPh = this.meanPhase();
    let syncCount = 0;
    
    for (const osc of this.oscillators) {
      const diff = Math.abs(osc.phase - meanPh);
      const wrapped = Math.min(diff, 2 * Math.PI - diff);
      if (wrapped < syncThreshold) {
        syncCount++;
      }
    }
    
    return syncCount / this.oscillators.length;
  }
  
  /**
   * Classify the system state
   */
  classifyState() {
    const r = this.orderParameter();
    const chimera = this.chimeraRatio();
    
    if (r > 0.8) return 'synchronized';
    if (r < 0.2) return 'incoherent';
    if (chimera > 0.3 && chimera < 0.7) return 'chimera';
    return 'partial';
  }
  
  /**
   * Find critical phase lag for chimera formation
   * (Approximate - depends on frequency distribution)
   */
  static criticalPhaseLag(couplingStrength) {
    // For Lorentzian distribution, chimera appears around α ≈ π/2 - arctan(1/K)
    return Math.PI / 2 - Math.atan(1 / couplingStrength);
  }
}

/**
 * SmallWorldKuramoto - Watts-Strogatz Topology
 * 
 * Creates small-world network with:
 * - High clustering (local neighborhoods)
 * - Short average path length (long-range shortcuts)
 * 
 * Ideal for modular semantic synchronization.
 */
class SmallWorldKuramoto extends NetworkKuramoto {
  /**
   * @param {number[]} frequencies - Natural frequencies
   * @param {number} k - Each node connected to k nearest neighbors
   * @param {number} p - Rewiring probability (0 = ring, 1 = random)
   * @param {number} couplingStrength - Coupling K
   */
  constructor(frequencies, k = 4, p = 0.1, couplingStrength = 0.3) {
    const N = frequencies.length;
    const adjacency = SmallWorldKuramoto.wattsStrogatz(N, k, p);
    
    super(frequencies, adjacency, couplingStrength);
    
    this.k = k;
    this.p = p;
  }
  
  /**
   * Generate Watts-Strogatz small-world graph
   */
  static wattsStrogatz(N, k, p) {
    // Start with ring lattice
    const adj = Array(N).fill(null).map(() => Array(N).fill(0));
    
    // Connect each node to k/2 neighbors on each side
    const halfK = Math.floor(k / 2);
    for (let i = 0; i < N; i++) {
      for (let j = 1; j <= halfK; j++) {
        const neighbor = (i + j) % N;
        adj[i][neighbor] = 1;
        adj[neighbor][i] = 1;
      }
    }
    
    // Rewire edges with probability p
    for (let i = 0; i < N; i++) {
      for (let j = 1; j <= halfK; j++) {
        if (Math.random() < p) {
          const oldNeighbor = (i + j) % N;
          
          // Remove old edge
          adj[i][oldNeighbor] = 0;
          adj[oldNeighbor][i] = 0;
          
          // Add new random edge (avoiding self and duplicates)
          let newNeighbor;
          do {
            newNeighbor = Math.floor(Math.random() * N);
          } while (newNeighbor === i || adj[i][newNeighbor] > 0);
          
          adj[i][newNeighbor] = 1;
          adj[newNeighbor][i] = 1;
        }
      }
    }
    
    return adj;
  }
  
  /**
   * Regenerate the network with new parameters
   */
  regenerate(k = this.k, p = this.p) {
    this.k = k;
    this.p = p;
    this.adjacency = SmallWorldKuramoto.wattsStrogatz(this.oscillators.length, k, p);
    this.degree = this.adjacency.map(row => row.reduce((a, b) => a + b, 0));
  }
  
  /**
   * Estimate average path length (BFS from each node)
   */
  averagePathLength() {
    const N = this.oscillators.length;
    let totalPath = 0;
    let pairs = 0;
    
    for (let source = 0; source < N; source++) {
      const dist = this._bfs(source);
      for (let target = 0; target < N; target++) {
        if (source !== target && dist[target] < Infinity) {
          totalPath += dist[target];
          pairs++;
        }
      }
    }
    
    return pairs > 0 ? totalPath / pairs : Infinity;
  }
  
  _bfs(source) {
    const N = this.oscillators.length;
    const dist = Array(N).fill(Infinity);
    dist[source] = 0;
    const queue = [source];
    
    while (queue.length > 0) {
      const current = queue.shift();
      for (let j = 0; j < N; j++) {
        if (this.adjacency[current][j] > 0 && dist[j] === Infinity) {
          dist[j] = dist[current] + 1;
          queue.push(j);
        }
      }
    }
    
    return dist;
  }
  
  /**
   * Small-world coefficient σ = (C/C_random) / (L/L_random)
   * σ > 1 indicates small-world properties
   */
  smallWorldCoefficient() {
    const C = this.averageClustering();
    const L = this.averagePathLength();
    
    // Random graph approximations
    const N = this.oscillators.length;
    const avgDegree = this.degree.reduce((a, b) => a + b, 0) / N;
    const C_random = avgDegree / N;
    const L_random = Math.log(N) / Math.log(avgDegree);
    
    if (C_random === 0 || L_random === 0) return 0;
    
    return (C / C_random) / (L / L_random);
  }
}

/**
 * MultiSystemCoupling - Cross-System Synchronization
 * 
 * Couples multiple KuramotoModel systems together:
 *   dθᵢ^(a)/dt = ... + Σ_b G_ab (r^(b) sin(ψ^(b) - θᵢ^(a)))
 * 
 * Models:
 * - Multi-agent semantic alignment
 * - Hierarchical concept organization
 * - Cross-domain knowledge transfer
 */
class MultiSystemCoupling {
  /**
   * @param {KuramotoModel[]} systems - Array of Kuramoto systems
   * @param {number[][]} coupling - System coupling matrix G
   */
  constructor(systems, coupling = null) {
    this.systems = systems;
    
    // Default: weak uniform inter-system coupling
    if (coupling) {
      this.G = coupling;
    } else {
      const M = systems.length;
      this.G = Array(M).fill(null).map(() => Array(M).fill(0.1));
      for (let i = 0; i < M; i++) {
        this.G[i][i] = 0; // No self-coupling
      }
    }
  }
  
  /**
   * Set inter-system coupling strength
   */
  setInterCoupling(i, j, strength) {
    this.G[i][j] = strength;
    this.G[j][i] = strength;
  }
  
  /**
   * Get global order parameters for each system
   */
  orderParameters() {
    return this.systems.map(sys => ({
      r: sys.orderParameter(),
      psi: sys.meanPhase()
    }));
  }
  
  /**
   * Inter-system coupling force on oscillator
   */
  interSystemCoupling(systemIdx, osc) {
    let coupling = 0;
    
    for (let b = 0; b < this.systems.length; b++) {
      if (b === systemIdx || this.G[systemIdx][b] === 0) continue;
      
      const other = this.systems[b];
      const r_b = other.orderParameter();
      const psi_b = other.meanPhase();
      
      // Mean-field coupling from system b
      coupling += this.G[systemIdx][b] * r_b * Math.sin(psi_b - osc.phase);
    }
    
    return coupling;
  }
  
  /**
   * Tick all systems with inter-system coupling
   */
  tick(dt) {
    // Store inter-system coupling terms for each oscillator
    const interCouplings = this.systems.map((sys, sIdx) => 
      sys.oscillators.map(osc => this.interSystemCoupling(sIdx, osc) * dt)
    );
    
    // Tick each system with combined coupling
    for (let s = 0; s < this.systems.length; s++) {
      const sys = this.systems[s];
      
      // Custom tick that includes inter-system coupling
      for (let i = 0; i < sys.oscillators.length; i++) {
        const osc = sys.oscillators[i];
        const intra = sys.kuramotoCoupling(osc) * dt;
        const inter = interCouplings[s][i];
        
        osc.tick(dt, intra + inter);
        osc.decay(0.02, dt);
      }
    }
  }
  
  /**
   * Global synchronization across all systems
   */
  globalOrderParameter() {
    let sx = 0, sy = 0, total = 0;
    
    for (const sys of this.systems) {
      for (const osc of sys.oscillators) {
        sx += osc.amplitude * Math.cos(osc.phase);
        sy += osc.amplitude * Math.sin(osc.phase);
        total++;
      }
    }
    
    return total > 0 ? Math.sqrt((sx/total)**2 + (sy/total)**2) : 0;
  }
  
  /**
   * Inter-system synchronization matrix
   * Returns phase coherence between each pair of systems
   */
  interSystemCoherence() {
    const M = this.systems.length;
    const coherence = Array(M).fill(null).map(() => Array(M).fill(0));
    
    for (let a = 0; a < M; a++) {
      const psi_a = this.systems[a].meanPhase();
      for (let b = a + 1; b < M; b++) {
        const psi_b = this.systems[b].meanPhase();
        const c = Math.cos(psi_a - psi_b);
        coherence[a][b] = c;
        coherence[b][a] = c;
      }
      coherence[a][a] = 1;
    }
    
    return coherence;
  }
  
  /**
   * Excite oscillators in a specific system
   */
  exciteSystem(systemIdx, primes, primeList, amount = 0.5) {
    if (systemIdx >= 0 && systemIdx < this.systems.length) {
      this.systems[systemIdx].exciteByPrimes(primes, primeList, amount);
    }
  }
  
  /**
   * Excite corresponding oscillators across all systems
   */
  exciteAll(primes, primeList, amount = 0.5) {
    for (const sys of this.systems) {
      sys.exciteByPrimes(primes, primeList, amount);
    }
  }
  
  /**
   * Reset all systems
   */
  reset() {
    for (const sys of this.systems) {
      sys.reset();
    }
  }
  
  /**
   * Get state summary
   */
  getState() {
    return {
      systemCount: this.systems.length,
      orderParameters: this.orderParameters(),
      globalOrder: this.globalOrderParameter(),
      interSystemCoherence: this.interSystemCoherence()
    };
  }
}

/**
 * Create a hierarchical multi-system coupling
 * Lower systems feed into higher ones (bottom-up)
 */
function createHierarchicalCoupling(frequencies, levels = 3, oscPerLevel = 16) {
  const systems = [];
  
  for (let level = 0; level < levels; level++) {
    const levelFreqs = frequencies.slice(0, oscPerLevel).map(f => f * (1 + level * 0.1));
    systems.push(new KuramotoModel(levelFreqs, 0.3 + level * 0.1));
  }
  
  // Asymmetric coupling: lower -> higher is stronger
  const G = Array(levels).fill(null).map(() => Array(levels).fill(0));
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      if (i < j) {
        G[i][j] = 0.2; // Bottom-up
      } else if (i > j) {
        G[i][j] = 0.05; // Top-down (weaker)
      }
    }
  }
  
  return new MultiSystemCoupling(systems, G);
}

/**
 * Create a peer-to-peer multi-system coupling
 * All systems have equal symmetric coupling
 */
function createPeerCoupling(frequencies, numPeers = 3, strength = 0.15) {
  const systems = [];
  
  for (let i = 0; i < numPeers; i++) {
    // Each peer has slightly different frequencies (individuality)
    const peerFreqs = frequencies.map(f => f * (1 + (Math.random() - 0.5) * 0.1));
    systems.push(new KuramotoModel(peerFreqs, 0.3));
  }
  
  const G = Array(numPeers).fill(null).map(() => Array(numPeers).fill(strength));
  for (let i = 0; i < numPeers; i++) {
    G[i][i] = 0;
  }
  
  return new MultiSystemCoupling(systems, G);
}

module.exports = {
  // Core extended models
  NetworkKuramoto,
  AdaptiveKuramoto,
  SakaguchiKuramoto,
  SmallWorldKuramoto,
  MultiSystemCoupling,
  
  // Factory functions
  createHierarchicalCoupling,
  createPeerCoupling
};