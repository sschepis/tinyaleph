/**
 * ResoFormer Layers - Complete Transformer-style Architecture
 * 
 * Building on the primitives in rformer.js, this module provides:
 * - ResonantMultiHeadAttention: Multiple attention heads with different weights
 * - PrimeFFN: Feed-forward network maintaining prime structure
 * - PrimeLayerNorm: Normalization preserving prime properties
 * - PositionalPrimeEncoding: Position encoded as prime phases
 * - ResoFormerBlock: Complete transformer block
 * 
 * These components enable building full ResoFormer models for
 * prime-resonant sequence processing.
 */

'use strict';

import { Complex, PrimeState } from './hilbert.js';
import { firstNPrimes, nthPrime, isPrime } from './prime.js';

import {  Quaternion,
  SparsePrimeState,
  resonanceScore,
  resonantAttention,
  hamiltonCompose,
  computeCoherence  } from './rformer.js';

/**
 * ResonantMultiHeadAttention
 * 
 * Multiple attention heads with different resonance weight configurations.
 * Each head can emphasize different aspects:
 * - Prime overlap (Jaccard)
 * - Quaternion alignment
 * - Phase coherence
 */
class ResonantMultiHeadAttention {
  /**
   * @param {object} config
   * @param {number} config.numHeads - Number of attention heads
   * @param {number} [config.numPrimes=4096] - Size of prime vocabulary
   * @param {number} [config.activeK=32] - Sparsity per state
   * @param {number[][]} [config.headWeights] - Per-head [alpha, beta, gamma]
   * @param {number} [config.temperature=1.0] - Softmax temperature
   */
  constructor(config) {
    this.numHeads = config.numHeads || 8;
    this.numPrimes = config.numPrimes || 4096;
    this.activeK = config.activeK || 32;
    this.temperature = config.temperature || 1.0;
    
    // Initialize per-head weights
    // Default: vary emphasis across heads
    this.headWeights = config.headWeights || this._defaultHeadWeights();
    
    // Output projection weights (learnable in training)
    this.outputScale = config.outputScale || 1.0 / Math.sqrt(this.numHeads);
  }
  
  /**
   * Generate default head weights with varying emphasis
   * @private
   */
  _defaultHeadWeights() {
    const weights = [];
    for (let h = 0; h < this.numHeads; h++) {
      const t = h / (this.numHeads - 1 || 1);
      
      // Interpolate between different emphasis patterns
      // Head 0: Prime overlap focus
      // Head numHeads-1: Phase coherence focus
      const alpha = 0.5 - 0.3 * t;  // Jaccard weight
      const beta = 0.3;              // Quaternion (constant)
      const gamma = 0.2 + 0.3 * t;   // Phase weight
      
      weights.push([alpha, beta, gamma]);
    }
    return weights;
  }
  
  /**
   * Apply multi-head attention
   * 
   * @param {SparsePrimeState} query - Query state
   * @param {SparsePrimeState[]} keys - Key states
   * @param {SparsePrimeState[]} values - Value states
   * @returns {object} { result, headOutputs, attentionWeights }
   */
  forward(query, keys, values) {
    const headOutputs = [];
    const allWeights = [];
    
    // Apply each head
    for (let h = 0; h < this.numHeads; h++) {
      const [alpha, beta, gamma] = this.headWeights[h];
      
      // Compute head-specific attention
      const headResult = this._headAttention(
        query, keys, values, alpha, beta, gamma
      );
      
      headOutputs.push(headResult.result);
      allWeights.push(headResult.weights);
    }
    
    // Combine head outputs
    const combined = this._combineHeads(headOutputs);
    
    return {
      result: combined,
      headOutputs,
      attentionWeights: allWeights
    };
  }
  
  /**
   * Single head attention with custom weights
   * @private
   */
  _headAttention(query, keys, values, alpha, beta, gamma) {
    const n = keys.length;
    if (n === 0) {
      return { result: query, weights: [], scores: [] };
    }
    
    // Compute resonance scores with head-specific weights
    const scores = keys.map(k => {
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
      
      // Phase coherence
      let phaseSum = 0;
      for (const p of intersection) {
        const phaseQ = query.get(p).amplitude.phase();
        const phaseK = k.get(p).amplitude.phase();
        phaseSum += Math.cos(phaseQ - phaseK);
      }
      const phaseCoherence = (phaseSum / intersection.size + 1) / 2;
      
      return alpha * jaccard + beta * quatAlign + gamma * phaseCoherence;
    });
    
    // Softmax
    const maxScore = Math.max(...scores);
    const expScores = scores.map(s => Math.exp((s - maxScore) / this.temperature));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    const weights = expScores.map(e => e / sumExp);
    
    // Weighted combination
    const result = new SparsePrimeState(this.numPrimes, this.activeK);
    
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      for (const [p, act] of values[i].activations) {
        const current = result.get(p);
        const newAmp = current.amplitude.add(act.amplitude.scale(w));
        const newQuat = current.quaternion.add(act.quaternion.scale(w));
        result.set(p, newAmp, newQuat.normalize());
      }
    }
    
    return { result: result.normalize(), weights, scores };
  }
  
  /**
   * Combine head outputs
   * @private
   */
  _combineHeads(headOutputs) {
    const result = new SparsePrimeState(this.numPrimes, this.activeK);
    
    for (const headOut of headOutputs) {
      for (const [p, act] of headOut.activations) {
        const current = result.get(p);
        const newAmp = current.amplitude.add(act.amplitude.scale(this.outputScale));
        const newQuat = current.quaternion.add(act.quaternion.scale(this.outputScale));
        result.set(p, newAmp, newQuat.normalize());
      }
    }
    
    return result.normalize();
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
      headWeights: this.headWeights,
      temperature: this.temperature,
      outputScale: this.outputScale
    };
  }
}

/**
 * PrimeFFN - Prime-Indexed Feed-Forward Network
 * 
 * Two-layer MLP that operates on sparse prime activations:
 * FFN(x) = activation(x·W1 + b1)·W2 + b2
 * 
 * Maintains sparsity by only operating on active primes.
 */
class PrimeFFN {
  /**
   * @param {object} config
   * @param {number} [config.hiddenDim=256] - Hidden layer dimension
   * @param {number} [config.numPrimes=4096] - Prime vocabulary size
   * @param {string} [config.activation='relu'] - Activation function
   * @param {number} [config.dropout=0.0] - Dropout probability
   */
  constructor(config) {
    this.hiddenDim = config.hiddenDim || 256;
    this.numPrimes = config.numPrimes || 4096;
    this.activation = config.activation || 'relu';
    this.dropout = config.dropout || 0.0;
    
    // Initialize weights (simplified: diagonal + bias)
    // In full implementation, these would be learned
    this.w1Scale = config.w1Scale || 2.0;
    this.w2Scale = config.w2Scale || 0.5;
    this.bias1 = config.bias1 || 0.1;
    this.bias2 = config.bias2 || 0.0;
  }
  
  /**
   * Apply feed-forward network
   * @param {SparsePrimeState} x - Input state
   * @returns {SparsePrimeState} Output state
   */
  forward(x) {
    const result = new SparsePrimeState(this.numPrimes, x.k);
    
    for (const [p, act] of x.activations) {
      // First layer: scale + bias
      let hidden = act.amplitude.scale(this.w1Scale);
      hidden = hidden.add(new Complex(this.bias1, 0));
      
      // Activation
      hidden = this._activate(hidden);
      
      // Dropout (training only)
      if (this.dropout > 0 && Math.random() < this.dropout) {
        continue;
      }
      
      // Second layer
      const output = hidden.scale(this.w2Scale);
      const finalAmp = output.add(new Complex(this.bias2, 0));
      
      // Quaternion passes through with slight rotation
      const quatRotation = Quaternion.fromAxisAngle(
        [1, 0, 0],
        0.1 * act.amplitude.phase()
      );
      const newQuat = act.quaternion.mul(quatRotation);
      
      result.set(p, finalAmp, newQuat.normalize());
    }
    
    return result.normalize();
  }
  
  /**
   * Apply activation function
   * @private
   */
  _activate(c) {
    switch (this.activation) {
      case 'relu':
        return new Complex(Math.max(0, c.re), Math.max(0, c.im));
      
      case 'gelu':
        // GELU approximation
        const x = c.re;
        const gelu = 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
        return new Complex(gelu, c.im * (c.im > 0 ? 1 : 0));
      
      case 'swish':
        const sigmoid = (v) => 1 / (1 + Math.exp(-v));
        return new Complex(c.re * sigmoid(c.re), c.im * sigmoid(c.im));
      
      case 'tanh':
        return new Complex(Math.tanh(c.re), Math.tanh(c.im));
      
      default:
        return c;
    }
  }
  
  /**
   * Set training mode (enables dropout)
   */
  train(mode = true) {
    this.training = mode;
    return this;
  }
  
  /**
   * Set evaluation mode (disables dropout)
   */
  eval() {
    return this.train(false);
  }
}

/**
 * PrimeLayerNorm - Layer Normalization for Sparse Prime States
 * 
 * Normalizes activations while preserving prime structure.
 * Computes per-prime mean and variance statistics.
 */
class PrimeLayerNorm {
  /**
   * @param {object} config
   * @param {number} [config.eps=1e-6] - Epsilon for numerical stability
   * @param {boolean} [config.elementwiseAffine=true] - Learn gamma/beta
   */
  constructor(config = {}) {
    this.eps = config.eps || 1e-6;
    this.elementwiseAffine = config.elementwiseAffine ?? true;
    
    // Learnable parameters (simplified: scalar)
    this.gamma = config.gamma || 1.0;
    this.beta = config.beta || 0.0;
  }
  
  /**
   * Apply layer normalization
   * @param {SparsePrimeState} x - Input state
   * @returns {SparsePrimeState} Normalized state
   */
  forward(x) {
    const activePrimes = x.getActivePrimes();
    if (activePrimes.length === 0) return x;
    
    // Compute mean amplitude
    let sum = 0;
    let count = 0;
    for (const p of activePrimes) {
      sum += x.get(p).amplitude.norm();
      count++;
    }
    const mean = sum / count;
    
    // Compute variance
    let varSum = 0;
    for (const p of activePrimes) {
      const diff = x.get(p).amplitude.norm() - mean;
      varSum += diff * diff;
    }
    const variance = varSum / count;
    const std = Math.sqrt(variance + this.eps);
    
    // Normalize
    const result = new SparsePrimeState(x.allPrimes.length, x.k);
    
    for (const p of activePrimes) {
      const act = x.get(p);
      const normAmp = act.amplitude.norm();
      const normalizedNorm = (normAmp - mean) / std;
      
      // Apply affine transform
      const scaledNorm = this.gamma * normalizedNorm + this.beta;
      
      // Preserve phase, scale magnitude
      const phase = act.amplitude.phase();
      const newAmp = Complex.fromPolar(Math.max(0, scaledNorm), phase);
      
      result.set(p, newAmp, act.quaternion);
    }
    
    return result.normalize();
  }
  
  /**
   * Get parameters
   */
  getParameters() {
    return { gamma: this.gamma, beta: this.beta };
  }
  
  /**
   * Set parameters
   */
  setParameters(params) {
    if (params.gamma !== undefined) this.gamma = params.gamma;
    if (params.beta !== undefined) this.beta = params.beta;
  }
}

/**
 * PositionalPrimeEncoding
 * 
 * Encodes position information using prime-based phases.
 * Each position activates a unique combination of primes with position-dependent phases.
 */
class PositionalPrimeEncoding {
  /**
   * @param {object} config
   * @param {number} [config.maxLength=512] - Maximum sequence length
   * @param {number} [config.numPrimes=4096] - Prime vocabulary size
   * @param {number} [config.activeK=32] - Sparsity per position
   * @param {string} [config.type='sinusoidal'] - Encoding type
   */
  constructor(config = {}) {
    this.maxLength = config.maxLength || 512;
    this.numPrimes = config.numPrimes || 4096;
    this.activeK = config.activeK || 32;
    this.type = config.type || 'sinusoidal';
    
    // Precompute position encodings
    this.encodings = this._precompute();
  }
  
  /**
   * Precompute position encodings
   * @private
   */
  _precompute() {
    const encodings = [];
    const primes = firstNPrimes(this.activeK);
    
    for (let pos = 0; pos < this.maxLength; pos++) {
      const state = new SparsePrimeState(this.numPrimes, this.activeK);
      
      for (let i = 0; i < primes.length; i++) {
        const p = primes[i];
        
        let phase;
        switch (this.type) {
          case 'sinusoidal':
            // Classic transformer-style
            const freq = 1 / Math.pow(10000, i / primes.length);
            phase = pos * freq;
            break;
          
          case 'prime':
            // Prime-based: use p-th prime for position
            phase = 2 * Math.PI * pos / nthPrime(i + 1);
            break;
          
          case 'golden':
            // Golden ratio based
            const phi = (1 + Math.sqrt(5)) / 2;
            phase = 2 * Math.PI * pos * Math.pow(phi, -i);
            break;
          
          default:
            phase = 2 * Math.PI * pos * i / primes.length;
        }
        
        const amplitude = Complex.fromPolar(1 / Math.sqrt(primes.length), phase);
        const quaternion = Quaternion.fromAxisAngle(
          [Math.sin(phase), Math.cos(phase), 0],
          phase / 2
        );
        
        state.set(p, amplitude, quaternion.normalize());
      }
      
      encodings.push(state.normalize());
    }
    
    return encodings;
  }
  
  /**
   * Get encoding for a position
   * @param {number} pos - Position index
   * @returns {SparsePrimeState} Position encoding
   */
  getEncoding(pos) {
    if (pos < 0) pos = 0;
    if (pos >= this.maxLength) pos = this.maxLength - 1;
    return this.encodings[pos];
  }
  
  /**
   * Add position encoding to a state
   * @param {SparsePrimeState} state - Input state
   * @param {number} pos - Position index
   * @returns {SparsePrimeState} State with position encoding added
   */
  encode(state, pos) {
    const posEnc = this.getEncoding(pos);
    return hamiltonCompose(state, posEnc);
  }
  
  /**
   * Encode a sequence of states
   * @param {SparsePrimeState[]} sequence - Input sequence
   * @returns {SparsePrimeState[]} Encoded sequence
   */
  encodeSequence(sequence) {
    return sequence.map((state, pos) => this.encode(state, pos));
  }
}

/**
 * ResoFormerBlock - Complete Transformer Block
 * 
 * Combines:
 * - Multi-head resonant attention
 * - Feed-forward network
 * - Layer normalization
 * - Residual connections
 */
class ResoFormerBlock {
  /**
   * @param {object} config
   * @param {number} [config.numHeads=8] - Number of attention heads
   * @param {number} [config.hiddenDim=256] - FFN hidden dimension
   * @param {number} [config.numPrimes=4096] - Prime vocabulary size
   * @param {number} [config.activeK=32] - Sparsity parameter
   * @param {number} [config.dropout=0.1] - Dropout probability
   * @param {boolean} [config.preNorm=true] - Pre-norm or post-norm
   */
  constructor(config = {}) {
    this.preNorm = config.preNorm ?? true;
    this.numPrimes = config.numPrimes || 4096;
    this.activeK = config.activeK || 32;
    
    // Sub-layers
    this.attention = new ResonantMultiHeadAttention({
      numHeads: config.numHeads || 8,
      numPrimes: this.numPrimes,
      activeK: this.activeK,
      temperature: config.attentionTemperature || 1.0
    });
    
    this.ffn = new PrimeFFN({
      hiddenDim: config.hiddenDim || 256,
      numPrimes: this.numPrimes,
      activation: config.activation || 'gelu',
      dropout: config.dropout || 0.1
    });
    
    this.norm1 = new PrimeLayerNorm();
    this.norm2 = new PrimeLayerNorm();
    
    this.dropoutRate = config.dropout || 0.1;
    this.training = false;
  }
  
  /**
   * Forward pass through the block
   * 
   * @param {SparsePrimeState} x - Input state
   * @param {SparsePrimeState[]} context - Context states for attention
   * @returns {object} { output, attentionWeights }
   */
  forward(x, context = null) {
    // Use self-attention if no context provided
    const keys = context || [x];
    const values = context || [x];
    
    let attnInput, ffnInput;
    
    if (this.preNorm) {
      // Pre-norm: Norm -> Attn -> Add -> Norm -> FFN -> Add
      attnInput = this.norm1.forward(x);
      const attnOut = this.attention.forward(attnInput, 
        keys.map(k => this.norm1.forward(k)),
        values.map(v => this.norm1.forward(v))
      );
      
      // Residual connection
      const afterAttn = this._add(x, this._dropout(attnOut.result));
      
      // FFN
      ffnInput = this.norm2.forward(afterAttn);
      const ffnOut = this.ffn.forward(ffnInput);
      
      // Residual connection
      const output = this._add(afterAttn, this._dropout(ffnOut));
      
      return { output, attentionWeights: attnOut.attentionWeights };
      
    } else {
      // Post-norm: Attn -> Add -> Norm -> FFN -> Add -> Norm
      const attnOut = this.attention.forward(x, keys, values);
      const afterAttn = this.norm1.forward(this._add(x, this._dropout(attnOut.result)));
      
      const ffnOut = this.ffn.forward(afterAttn);
      const output = this.norm2.forward(this._add(afterAttn, this._dropout(ffnOut)));
      
      return { output, attentionWeights: attnOut.attentionWeights };
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
 * ResoFormer - Complete Multi-Layer Model
 * 
 * Stacks multiple ResoFormerBlocks with optional position encoding.
 */
class ResoFormer {
  /**
   * @param {object} config
   * @param {number} [config.numLayers=6] - Number of transformer blocks
   * @param {number} [config.numHeads=8] - Attention heads per block
   * @param {number} [config.hiddenDim=256] - FFN hidden dimension
   * @param {number} [config.numPrimes=4096] - Prime vocabulary size
   * @param {number} [config.activeK=32] - Sparsity parameter
   * @param {number} [config.dropout=0.1] - Dropout probability
   * @param {boolean} [config.usePositionalEncoding=true] - Add position encoding
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
    
    // Stack of transformer blocks
    this.blocks = [];
    for (let i = 0; i < this.numLayers; i++) {
      this.blocks.push(new ResoFormerBlock({
        numHeads: config.numHeads || 8,
        hiddenDim: config.hiddenDim || 256,
        numPrimes: this.numPrimes,
        activeK: this.activeK,
        dropout: config.dropout || 0.1,
        preNorm: config.preNorm ?? true
      }));
    }
    
    // Final normalization
    this.finalNorm = new PrimeLayerNorm();
  }
  
  /**
   * Forward pass through all layers
   * 
   * @param {SparsePrimeState|SparsePrimeState[]} input - Input state(s)
   * @returns {object} { output, layerOutputs, attentionMaps }
   */
  forward(input) {
    // Handle single input or sequence
    const isSequence = Array.isArray(input);
    let states = isSequence ? input : [input];
    
    // Add position encoding
    if (this.usePositionalEncoding) {
      states = this.posEncoder.encodeSequence(states);
    }
    
    const layerOutputs = [];
    const attentionMaps = [];
    
    // Process through each block
    // For simplicity, process each state with all others as context
    for (let layer = 0; layer < this.numLayers; layer++) {
      const block = this.blocks[layer];
      const newStates = [];
      const layerAttention = [];
      
      for (let i = 0; i < states.length; i++) {
        const { output, attentionWeights } = block.forward(states[i], states);
        newStates.push(output);
        layerAttention.push(attentionWeights);
      }
      
      states = newStates;
      layerOutputs.push([...states]);
      attentionMaps.push(layerAttention);
    }
    
    // Final normalization
    states = states.map(s => this.finalNorm.forward(s));
    
    return {
      output: isSequence ? states : states[0],
      layerOutputs,
      attentionMaps
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
    // Simplified count
    const perBlock = this.numLayers * (
      8 * 3 +  // Attention head weights
      4 +      // FFN weights
      2        // LayerNorm
    );
    return perBlock + (this.usePositionalEncoding ? this.activeK * 4 : 0);
  }
}

export {
    ResonantMultiHeadAttention,
    PrimeFFN,
    PrimeLayerNorm,
    PositionalPrimeEncoding,
    ResoFormerBlock,
    ResoFormer
};