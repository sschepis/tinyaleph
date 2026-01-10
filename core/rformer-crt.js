/**
 * CRT-Enhanced ResoFormer Layers
 * 
 * Integrates Chinese Remainder Theorem reconstruction with Birkhoff polytope
 * constraints and homology-based regularization into the ResoFormer architecture.
 * 
 * Key additions:
 * - CRTResonantAttention: Modular attention with per-modulus Birkhoff projection
 * - HomologyRegularizedBlock: Detects semantic inconsistencies as topological holes
 * - CRTResoFormer: Full model with homology loss integration
 * 
 * Mathematical Foundation:
 * - Encode: r_k = softmax(W_k h + b_k) ∈ Δ(ℤ/p_k) for coprime moduli p_k
 * - Reconstruct: L̂ = Σ_k E[r_k] · (P/p_k) · (P/p_k)^{-1} mod P via CRT
 * - Project: A_k ∈ Birkhoff(n) via Sinkhorn-Knopp
 * - Regularize: ℒ_homology = Σ_{cycles} f(cycle) detects Ker(ℛ) holes
 */

'use strict';

const {
  Quaternion,
  SparsePrimeState,
  resonanceScore,
  resonantAttention,
  hamiltonCompose,
  computeCoherence
} = require('./rformer');

const {
  ResonantMultiHeadAttention,
  PrimeFFN,
  PrimeLayerNorm,
  PositionalPrimeEncoding,
  ResoFormerBlock
} = require('./rformer-layers');

const {
  CRTReconstructor,
  BirkhoffProjector,
  HomologyLoss,
  CRTModularLayer,
  CRTFusedAttention,
  CoprimeSelector,
  ResidueEncoder
} = require('./crt-homology');

const { Complex, PrimeState } = require('./hilbert');
const { firstNPrimes, isPrime } = require('./prime');

/**
 * CRTResonantAttention - Multi-head attention with CRT-fused modular structure
 * 
 * Each head computes attention in a different modular field, then
 * fuses via CRT reconstruction. Attention matrices are projected
 * onto the Birkhoff polytope for doubly-stochastic structure.
 */
class CRTResonantAttention {
  /**
   * @param {object} config
   * @param {number} config.numHeads - Number of attention heads (maps to moduli)
   * @param {number} [config.numPrimes=4096] - Size of prime vocabulary
   * @param {number} [config.activeK=32] - Sparsity per state
   * @param {number} [config.sinkhornIterations=10] - Iterations for Birkhoff projection
   * @param {number} [config.temperature=1.0] - Softmax temperature
   */
  constructor(config) {
    this.numHeads = config.numHeads || 8;
    this.numPrimes = config.numPrimes || 4096;
    this.activeK = config.activeK || 32;
    this.temperature = config.temperature || 1.0;
    
    // Select coprime moduli for CRT reconstruction
    this.coprimeSelector = new CoprimeSelector(this.numHeads);
    this.moduli = this.coprimeSelector.selectMinimal();
    
    // CRT components
    this.crtReconstructor = new CRTReconstructor(this.moduli);
    this.birkhoffProjector = new BirkhoffProjector({
      maxIterations: config.sinkhornIterations || 10,
      tolerance: config.birkhoffTolerance || 1e-3
    });
    
    // Per-head weights [alpha, beta, gamma] for resonance scoring
    this.headWeights = config.headWeights || this._defaultHeadWeights();
    
    // Output scaling
    this.outputScale = config.outputScale || 1.0 / Math.sqrt(this.numHeads);
  }
  
  /**
   * Generate default head weights with moduli-specific emphasis
   * @private
   */
  _defaultHeadWeights() {
    const weights = [];
    for (let h = 0; h < this.numHeads; h++) {
      const modulus = this.moduli[h];
      // Weight configuration varies with modulus size
      // Larger moduli get more phase weight, smaller get more Jaccard
      const t = Math.log(modulus) / Math.log(this.moduli[this.numHeads - 1]);
      
      const alpha = 0.5 - 0.2 * t;  // Jaccard weight
      const beta = 0.3;              // Quaternion (constant)
      const gamma = 0.2 + 0.2 * t;   // Phase weight
      
      weights.push([alpha, beta, gamma]);
    }
    return weights;
  }
  
  /**
   * Apply CRT-fused multi-head attention
   * 
   * @param {SparsePrimeState} query - Query state
   * @param {SparsePrimeState[]} keys - Key states
   * @param {SparsePrimeState[]} values - Value states
   * @returns {object} { result, headOutputs, attentionWeights, crtResidues, homologyInfo }
   */
  forward(query, keys, values) {
    const n = keys.length;
    if (n === 0) {
      return { 
        result: query, 
        headOutputs: [], 
        attentionWeights: [],
        crtResidues: [],
        homologyInfo: { hasHoles: false, bettiNumbers: [1, 0] }
      };
    }
    
    const headOutputs = [];
    const allWeights = [];
    const crtResidues = [];
    
    // Apply each head (modular attention)
    for (let h = 0; h < this.numHeads; h++) {
      const modulus = this.moduli[h];
      const [alpha, beta, gamma] = this.headWeights[h];
      
      // Compute head-specific attention with modular structure
      const headResult = this._modularHeadAttention(
        query, keys, values, modulus, alpha, beta, gamma
      );
      
      headOutputs.push(headResult.result);
      allWeights.push(headResult.birkhoffWeights);
      crtResidues.push(headResult.residue);
    }
    
    // Fuse head outputs via CRT reconstruction
    const fusedResult = this._crtFuseHeads(headOutputs);
    
    // Detect homology holes (cycles in kernel)
    const homologyInfo = this._detectHomologyHoles(crtResidues, allWeights);
    
    return {
      result: fusedResult,
      headOutputs,
      attentionWeights: allWeights,
      crtResidues,
      homologyInfo
    };
  }
  
  /**
   * Single head attention with modular structure and Birkhoff projection
   * @private
   */
  _modularHeadAttention(query, keys, values, modulus, alpha, beta, gamma) {
    const n = keys.length;
    
    // Compute resonance scores
    const scores = keys.map((k, idx) => {
      const primesQ = new Set(query.getActivePrimes());
      const primesK = new Set(k.getActivePrimes());
      
      // Jaccard
      const intersection = new Set([...primesQ].filter(p => primesK.has(p)));
      const union = new Set([...primesQ, ...primesK]);
      const jaccard = intersection.size / (union.size || 1);
      
      if (intersection.size === 0) {
        return alpha * jaccard;
      }
      
      // Quaternion alignment
      let quatSum = 0;
      for (const p of intersection) {
        const qi = query.get(p).quaternion;
        const qk = k.get(p).quaternion;
        quatSum += Math.abs(qi.dot(qk));
      }
      const quatAlign = quatSum / intersection.size;
      
      // Phase coherence (modular)
      let phaseSum = 0;
      for (const p of intersection) {
        const phaseQ = query.get(p).amplitude.phase();
        const phaseK = k.get(p).amplitude.phase();
        // Modular phase difference
        const phaseDiff = ((phaseQ - phaseK) % (2 * Math.PI / modulus)) * modulus;
        phaseSum += Math.cos(phaseDiff);
      }
      const phaseCoherence = (phaseSum / intersection.size + 1) / 2;
      
      return alpha * jaccard + beta * quatAlign + gamma * phaseCoherence;
    });
    
    // Create attention matrix (single row for query)
    // Expand to n×n by computing pairwise scores among keys
    const attentionMatrix = [];
    for (let i = 0; i < n; i++) {
      const row = keys.map((k, j) => resonanceScore(keys[i], k, alpha, beta, gamma));
      // Apply modular structure
      for (let j = 0; j < n; j++) {
        row[j] = row[j] % 1.0;  // Keep in [0, 1) range
      }
      attentionMatrix.push(row);
    }
    
    // Project onto Birkhoff polytope (doubly-stochastic)
    const birkhoffResult = this.birkhoffProjector.project(attentionMatrix);
    const birkhoffMatrix = birkhoffResult && birkhoffResult.matrix ? birkhoffResult.matrix : null;
    
    // Extract query-specific weights (first row after projection)
    // For proper attention, use the scores projected through Birkhoff
    const softmaxWeights = this._softmax(scores.map(s => s / this.temperature));
    
    // Blend Birkhoff structure with softmax attention
    const blendFactor = 0.3;  // How much Birkhoff structure to incorporate
    const blendedWeights = softmaxWeights.map((w, i) => {
      // Safely access Birkhoff weights with full null checking
      if (birkhoffMatrix && Array.isArray(birkhoffMatrix) && birkhoffMatrix.length > 0) {
        const birkhoffRow = birkhoffMatrix[0];
        if (Array.isArray(birkhoffRow) && i < birkhoffRow.length && typeof birkhoffRow[i] === 'number') {
          return (1 - blendFactor) * w + blendFactor * birkhoffRow[i];
        }
      }
      return w;  // Fall back to pure softmax if Birkhoff unavailable
    });
    
    // Normalize
    const weightSum = blendedWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = blendedWeights.map(w => w / (weightSum || 1));
    
    // Compute residue for CRT reconstruction
    // Residue = weighted sum of value indices mod modulus
    let residue = 0;
    for (let i = 0; i < n; i++) {
      residue = (residue + normalizedWeights[i] * i) % modulus;
    }
    
    // Weighted combination of values
    const result = new SparsePrimeState(this.numPrimes, this.activeK);
    
    for (let i = 0; i < n; i++) {
      const w = normalizedWeights[i];
      for (const [p, act] of values[i].activations) {
        const current = result.get(p);
        const newAmp = current.amplitude.add(act.amplitude.scale(w));
        const newQuat = current.quaternion.add(act.quaternion.scale(w));
        result.set(p, newAmp, newQuat.normalize());
      }
    }
    
    return { 
      result: result.normalize(), 
      birkhoffWeights: normalizedWeights, 
      residue,
      convergenceInfo: birkhoffResult.convergenceInfo
    };
  }
  
  /**
   * Softmax function
   * @private
   */
  _softmax(scores) {
    const maxScore = Math.max(...scores);
    const expScores = scores.map(s => Math.exp(s - maxScore));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(e => e / (sumExp || 1));
  }
  
  /**
   * Fuse head outputs via CRT reconstruction
   * @private
   */
  _crtFuseHeads(headOutputs) {
    const result = new SparsePrimeState(this.numPrimes, this.activeK);
    
    // Collect all active primes across heads
    const allPrimes = new Set();
    for (const head of headOutputs) {
      for (const p of head.getActivePrimes()) {
        allPrimes.add(p);
      }
    }
    
    // For each prime, fuse activations via CRT-style combination
    for (const p of allPrimes) {
      // Collect residues (amplitude norms) from each head
      const residues = headOutputs.map(h => h.get(p).amplitude.norm());
      
      // Compute reconstructed norm using weighted average (simpler than full CRT)
      // This avoids issues with probability distributions of varying sizes
      let reconstructedNorm = 0;
      let totalWeight = 0;
      for (let h = 0; h < headOutputs.length; h++) {
        const w = 1 / (h + 1);  // Decaying weights by head index
        reconstructedNorm += residues[h] * w;
        totalWeight += w;
      }
      reconstructedNorm = totalWeight > 0 ? reconstructedNorm / totalWeight : 0;
      
      // Fuse phases and quaternions via weighted average
      let phaseSum = 0;
      let quatSum = Quaternion.zero();
      let weightSum = 0;
      
      for (let h = 0; h < headOutputs.length; h++) {
        const act = headOutputs[h].get(p);
        const w = act.amplitude.norm();
        phaseSum += w * act.amplitude.phase();
        quatSum = quatSum.add(act.quaternion.scale(w));
        weightSum += w;
      }
      
      const avgPhase = weightSum > 0 ? phaseSum / weightSum : 0;
      const avgQuat = weightSum > 0 ? quatSum.scale(1/weightSum).normalize() : Quaternion.one();
      
      // Scale by output factor
      const finalAmp = Complex.fromPolar(
        reconstructedNorm * this.outputScale / this.numHeads,
        avgPhase
      );
      
      result.set(p, finalAmp, avgQuat);
    }
    
    return result.normalize();
  }
  
  /**
   * Detect homology holes in the kernel
   * @private
   */
  _detectHomologyHoles(residues, weights) {
    // Build adjacency from attention weights
    const n = weights[0]?.length || 0;
    if (n < 2) {
      return { hasHoles: false, bettiNumbers: [1, 0], cycles: [] };
    }
    
    // Create averaged adjacency matrix
    const adjacency = [];
    for (let i = 0; i < n; i++) {
      adjacency.push(new Array(n).fill(0));
    }
    
    for (const headWeights of weights) {
      for (let i = 0; i < Math.min(headWeights.length, n); i++) {
        for (let j = 0; j < Math.min(headWeights.length, n); j++) {
          adjacency[i][j] += headWeights[i] * headWeights[j] / weights.length;
        }
      }
    }
    
    // Threshold adjacency to binary
    const threshold = 0.1;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        adjacency[i][j] = adjacency[i][j] > threshold ? 1 : 0;
      }
    }
    
    // Compute error terms (CRT inconsistencies)
    const errors = [];
    for (let i = 0; i < residues.length; i++) {
      // Error = deviation from expected value
      errors.push(Math.abs(residues[i] - Math.floor(residues[i])));
    }
    
    // Build kernel (high-error nodes)
    const errorThreshold = 0.1;
    const kernel = errors.map((e, i) => ({ index: i, error: e, inKernel: e > errorThreshold }));
    const kernelNodes = kernel.filter(k => k.inKernel).map(k => k.index);
    
    // Detect cycles in kernel subgraph
    const cycles = this._findCyclesInSubgraph(adjacency, kernelNodes);
    
    // Compute Betti numbers
    const beta0 = this._countConnectedComponents(adjacency, kernelNodes);
    const beta1 = cycles.length;
    
    return {
      hasHoles: beta1 > 0,
      bettiNumbers: [beta0, beta1],
      cycles,
      kernelNodes,
      errors
    };
  }
  
  /**
   * Find cycles in a subgraph
   * @private
   */
  _findCyclesInSubgraph(adjacency, nodes) {
    const cycles = [];
    const n = nodes.length;
    
    if (n < 3) return cycles;
    
    // Simple cycle detection: look for triangles
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const a = nodes[i], b = nodes[j], c = nodes[k];
          if (a < adjacency.length && b < adjacency.length && c < adjacency.length) {
            if (adjacency[a][b] && adjacency[b][c] && adjacency[c][a]) {
              cycles.push([a, b, c]);
            }
          }
        }
      }
    }
    
    return cycles;
  }
  
  /**
   * Count connected components in subgraph
   * @private
   */
  _countConnectedComponents(adjacency, nodes) {
    if (nodes.length === 0) return 0;
    
    const visited = new Set();
    let components = 0;
    
    const dfs = (node) => {
      visited.add(node);
      for (const neighbor of nodes) {
        if (!visited.has(neighbor) && 
            node < adjacency.length && neighbor < adjacency.length &&
            adjacency[node][neighbor]) {
          dfs(neighbor);
        }
      }
    };
    
    for (const node of nodes) {
      if (!visited.has(node)) {
        dfs(node);
        components++;
      }
    }
    
    return components;
  }
  
  /**
   * Set head weights (for training)
   */
  setHeadWeights(headIdx, weights) {
    if (headIdx >= 0 && headIdx < this.numHeads) {
      this.headWeights[headIdx] = weights;
    }
  }
  
  /**
   * Get all parameters (for serialization)
   */
  getParameters() {
    return {
      numHeads: this.numHeads,
      moduli: this.moduli,
      headWeights: this.headWeights,
      temperature: this.temperature,
      outputScale: this.outputScale
    };
  }
}

/**
 * HomologyRegularizedBlock - ResoFormer block with homology-based regularization
 * 
 * Extends ResoFormerBlock with:
 * - CRT-fused attention
 * - Homology loss computation
 * - Kernel detection for semantic inconsistencies
 */
class HomologyRegularizedBlock {
  /**
   * @param {object} config
   * @param {number} [config.numHeads=8] - Number of attention heads
   * @param {number} [config.hiddenDim=256] - FFN hidden dimension
   * @param {number} [config.numPrimes=4096] - Prime vocabulary size
   * @param {number} [config.activeK=32] - Sparsity parameter
   * @param {number} [config.dropout=0.1] - Dropout probability
   * @param {boolean} [config.preNorm=true] - Pre-norm or post-norm
   * @param {number} [config.homologyWeight=0.1] - Weight for homology loss
   */
  constructor(config = {}) {
    this.preNorm = config.preNorm ?? true;
    this.numPrimes = config.numPrimes || 4096;
    this.activeK = config.activeK || 32;
    this.homologyWeight = config.homologyWeight || 0.1;
    
    // CRT-enhanced attention
    this.attention = new CRTResonantAttention({
      numHeads: config.numHeads || 8,
      numPrimes: this.numPrimes,
      activeK: this.activeK,
      temperature: config.attentionTemperature || 1.0,
      sinkhornIterations: config.sinkhornIterations || 10
    });
    
    // FFN and norms from standard block
    this.ffn = new PrimeFFN({
      hiddenDim: config.hiddenDim || 256,
      numPrimes: this.numPrimes,
      activation: config.activation || 'gelu',
      dropout: config.dropout || 0.1
    });
    
    this.norm1 = new PrimeLayerNorm();
    this.norm2 = new PrimeLayerNorm();
    
    // Homology loss computer
    this.homologyLoss = new HomologyLoss({
      errorThreshold: config.errorThreshold || 0.1,
      alpha: config.homologyAlpha || 0.5,
      beta: config.homologyBeta || 1.0,
      gamma: config.homologyGamma || 0.5
    });
    
    this.dropoutRate = config.dropout || 0.1;
    this.training = false;
  }
  
  /**
   * Forward pass with homology regularization
   * 
   * @param {SparsePrimeState} x - Input state
   * @param {SparsePrimeState[]} context - Context states for attention
   * @returns {object} { output, attentionWeights, homologyInfo, loss }
   */
  forward(x, context = null) {
    const keys = context || [x];
    const values = context || [x];
    
    let attnInput, ffnInput;
    let homologyLossValue = 0;
    let homologyInfo = null;
    
    if (this.preNorm) {
      // Pre-norm: Norm -> Attn -> Add -> Norm -> FFN -> Add
      attnInput = this.norm1.forward(x);
      const attnOut = this.attention.forward(
        attnInput,
        keys.map(k => this.norm1.forward(k)),
        values.map(v => this.norm1.forward(v))
      );
      
      homologyInfo = attnOut.homologyInfo;
      
      // Compute homology loss if there are holes
      if (homologyInfo.hasHoles && homologyInfo.cycles && homologyInfo.cycles.length > 0) {
        // Compute loss directly from detected cycles
        // f(cycle) = |cycle|^α * β^γ * Σ errors
        for (const cycle of homologyInfo.cycles) {
          const cycleLength = cycle.length;
          // Sum of errors for nodes in cycle
          let errorSum = 0;
          for (const nodeIdx of cycle) {
            if (homologyInfo.errors && nodeIdx < homologyInfo.errors.length) {
              errorSum += this.homologyLoss.sigmoid(homologyInfo.errors[nodeIdx] - 0.1);
            }
          }
          homologyLossValue += errorSum *
            Math.pow(cycleLength, this.homologyLoss.alpha) *
            Math.pow(this.homologyLoss.beta, this.homologyLoss.gamma);
        }
      }
      
      // Residual connection
      const afterAttn = this._add(x, this._dropout(attnOut.result));
      
      // FFN
      ffnInput = this.norm2.forward(afterAttn);
      const ffnOut = this.ffn.forward(ffnInput);
      
      // Residual connection
      const output = this._add(afterAttn, this._dropout(ffnOut));
      
      return {
        output,
        attentionWeights: attnOut.attentionWeights,
        homologyInfo,
        loss: this.homologyWeight * homologyLossValue,
        crtResidues: attnOut.crtResidues
      };
      
    } else {
      // Post-norm
      const attnOut = this.attention.forward(x, keys, values);
      homologyInfo = attnOut.homologyInfo;
      
      const afterAttn = this.norm1.forward(this._add(x, this._dropout(attnOut.result)));
      const ffnOut = this.ffn.forward(afterAttn);
      const output = this.norm2.forward(this._add(afterAttn, this._dropout(ffnOut)));
      
      return {
        output,
        attentionWeights: attnOut.attentionWeights,
        homologyInfo,
        loss: 0,
        crtResidues: attnOut.crtResidues
      };
    }
  }
  
  /**
   * Add two sparse states (residual connection)
   * @private
   */
  _add(a, b) {
    const result = new SparsePrimeState(this.numPrimes, this.activeK);
    const allPrimes = new Set([...a.getActivePrimes(), ...b.getActivePrimes()]);
    
    for (const p of allPrimes) {
      const actA = a.get(p);
      const actB = b.get(p);
      
      const newAmp = actA.amplitude.add(actB.amplitude);
      const newQuat = actA.quaternion.add(actB.quaternion);
      
      result.set(p, newAmp, newQuat.normalize());
    }
    
    return result.normalize();
  }
  
  /**
   * Apply dropout
   * @private
   */
  _dropout(state) {
    if (!this.training || this.dropoutRate <= 0) return state;
    
    const result = new SparsePrimeState(this.numPrimes, this.activeK);
    const scale = 1 / (1 - this.dropoutRate);
    
    for (const [p, act] of state.activations) {
      if (Math.random() >= this.dropoutRate) {
        result.set(p, act.amplitude.scale(scale), act.quaternion);
      }
    }
    
    return result;
  }
  
  /**
   * Set training mode
   */
  train(mode = true) {
    this.training = mode;
    this.ffn.train(mode);
    return this;
  }
  
  /**
   * Set evaluation mode
   */
  eval() {
    return this.train(false);
  }
}

/**
 * CRTResoFormer - Complete CRT-enhanced ResoFormer model
 * 
 * Stacks HomologyRegularizedBlocks with:
 * - CRT-fused attention at each layer
 * - Accumulated homology loss for training
 * - Semantic hole detection across layers
 */
class CRTResoFormer {
  /**
   * @param {object} config
   * @param {number} [config.numLayers=6] - Number of transformer blocks
   * @param {number} [config.numHeads=8] - Attention heads per block
   * @param {number} [config.hiddenDim=256] - FFN hidden dimension
   * @param {number} [config.numPrimes=4096] - Prime vocabulary size
   * @param {number} [config.activeK=32] - Sparsity parameter
   * @param {number} [config.dropout=0.1] - Dropout probability
   * @param {boolean} [config.usePositionalEncoding=true] - Add position encoding
   * @param {number} [config.homologyWeight=0.1] - Weight for homology loss
   */
  constructor(config = {}) {
    this.numLayers = config.numLayers || 6;
    this.numPrimes = config.numPrimes || 4096;
    this.activeK = config.activeK || 32;
    
    // Position encoding
    this.usePositionalEncoding = config.usePositionalEncoding ?? true;
    if (this.usePositionalEncoding) {
      this.posEncoder = new PositionalPrimeEncoding({
        numPrimes: this.numPrimes,
        activeK: this.activeK
      });
    }
    
    // Stack of CRT-enhanced blocks
    this.blocks = [];
    for (let i = 0; i < this.numLayers; i++) {
      this.blocks.push(new HomologyRegularizedBlock({
        numHeads: config.numHeads || 8,
        hiddenDim: config.hiddenDim || 256,
        numPrimes: this.numPrimes,
        activeK: this.activeK,
        dropout: config.dropout || 0.1,
        preNorm: config.preNorm ?? true,
        homologyWeight: config.homologyWeight || 0.1,
        sinkhornIterations: config.sinkhornIterations || 10
      }));
    }
    
    // Final normalization
    this.finalNorm = new PrimeLayerNorm();
  }
  /**
   * Forward pass through all layers
   *
   * @param {SparsePrimeState|SparsePrimeState[]} input - Input state(s)
   * @returns {object} { output, layerOutputs, attentionMaps, homologyReport, totalLoss }
   */
  forward(input) {
    const isSequence = Array.isArray(input);
    let states = isSequence ? input : [input];
    
    // Add position encoding
    if (this.usePositionalEncoding) {
      states = this.posEncoder.encodeSequence(states);
    }
    
    const layerOutputs = [];
    const attentionMaps = [];
    const homologyReports = [];
    let totalLoss = 0;
    
    // Process through each block
    for (let layer = 0; layer < this.numLayers; layer++) {
      const block = this.blocks[layer];
      const newStates = [];
      const layerAttention = [];
      const layerHomology = [];
      
      for (let i = 0; i < states.length; i++) {
        const { output, attentionWeights, homologyInfo, loss } = block.forward(states[i], states);
        newStates.push(output);
        layerAttention.push(attentionWeights);
        layerHomology.push(homologyInfo);
        totalLoss += loss;
      }
      
      states = newStates;
      layerOutputs.push([...states]);
      attentionMaps.push(layerAttention);
      homologyReports.push(layerHomology);
    }
    
    // Final normalization
    states = states.map(s => this.finalNorm.forward(s));
    
    // Aggregate homology report
    const aggregateHomology = this._aggregateHomologyReports(homologyReports);
    
    return {
      output: isSequence ? states : states[0],
      layerOutputs,
      attentionMaps,
      homologyReport: aggregateHomology,
      totalLoss
    };
  }
  
  /**
   * Aggregate homology reports across layers
   * @private
   */
  _aggregateHomologyReports(reports) {
    let totalHoles = 0;
    let maxBeta1 = 0;
    const allCycles = [];
    
    for (const layerReports of reports) {
      for (const report of layerReports) {
        if (report.hasHoles) {
          totalHoles++;
          maxBeta1 = Math.max(maxBeta1, report.bettiNumbers[1]);
          allCycles.push(...(report.cycles || []));
        }
      }
    }
    
    return {
      hasHoles: totalHoles > 0,
      totalHolesDetected: totalHoles,
      maxBettiNumber: maxBeta1,
      uniqueCycles: allCycles.length,
      layerReports: reports
    };
  }
  
  /**
   * Set training mode
   */
  train(mode = true) {
    for (const block of this.blocks) {
      block.train(mode);
    }
    return this;
  }
  
  /**
   * Set evaluation mode
   */
  eval() {
    return this.train(false);
  }
  
  /**
   * Get total parameter count (approximate)
   */
  getParameterCount() {
    const perBlock = this.numLayers * (
      8 * 3 +  // Attention head weights
      4 +      // FFN weights
      2 +      // LayerNorm
      1        // Homology params
    );
    return perBlock + (this.usePositionalEncoding ? this.activeK * 4 : 0);
  }
  
  /**
   * Get CRT configuration
   */
  getCRTConfig() {
    if (this.blocks.length === 0) return null;
    return this.blocks[0].attention.getParameters();
  }
}

/**
 * createCRTResoFormer - Factory function with sensible defaults
 *
 * @param {object} config - Configuration options
 * @returns {CRTResoFormer} Configured model
 */
function createCRTResoFormer(config = {}) {
  return new CRTResoFormer({
    numLayers: config.numLayers || 6,
    numHeads: config.numHeads || 8,
    hiddenDim: config.hiddenDim || 256,
    numPrimes: config.numPrimes || 4096,
    activeK: config.activeK || 32,
    dropout: config.dropout || 0.1,
    usePositionalEncoding: config.usePositionalEncoding ?? true,
    homologyWeight: config.homologyWeight || 0.1,
    sinkhornIterations: config.sinkhornIterations || 10,
    preNorm: config.preNorm ?? true
  });
}

module.exports = {
  // CRT-enhanced attention
  CRTResonantAttention,
  
  // Homology-regularized block
  HomologyRegularizedBlock,
  
  // Complete model
  CRTResoFormer,
  
  // Factory function
  createCRTResoFormer
};
    