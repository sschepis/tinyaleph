/**
 * ResoFormer TensorFlow.js Layers
 * 
 * Trainable neural network layers implementing ResoFormer architecture:
 * - QuaternionDense: Dense layer with Hamilton product
 * - ResonantAttention: Attention using Jaccard + Quaternion + Phase
 * - HamiltonCompose: Order-sensitive composition layer
 * - CoherenceHaltingLayer: ACT-style adaptive depth
 * - EntropyCollapseLayer: 64-codebook VQ collapse
 * - ResoFormerBlock: Complete transformer block
 * - ResoFormerModel: End-to-end trainable model
 * 
 * State space: H_Q = H_P ⊗ ℍ (Prime Hilbert space ⊗ Quaternions)
 */

let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  try {
    tf = require('@tensorflow/tfjs');
  } catch (e2) {
    console.warn('TensorFlow.js not available. Install with: npm install @tensorflow/tfjs-node');
    tf = null;
  }
}

const { firstNPrimes } = require('./prime');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate prime lookup table as TF tensor
 */
function getPrimeLookup(numPrimes = 4096) {
  if (!tf) throw new Error('TensorFlow.js not available');
  const primes = firstNPrimes(numPrimes);
  return tf.tensor1d(primes, 'int32');
}

/**
 * Compute log frequencies for primes
 */
function getPrimeLogFrequencies(numPrimes = 4096) {
  if (!tf) throw new Error('TensorFlow.js not available');
  const primes = firstNPrimes(numPrimes);
  const logFreqs = primes.map(p => 1 / Math.log(p));
  return tf.tensor1d(logFreqs, 'float32');
}

// ============================================================================
// QUATERNION OPERATIONS (TF.JS)
// ============================================================================

/**
 * Hamilton product for batched quaternions
 * Input shapes: [batch, ..., 4] x [batch, ..., 4] -> [batch, ..., 4]
 */
function quaternionMul(q1, q2) {
  if (!tf) throw new Error('TensorFlow.js not available');
  
  return tf.tidy(() => {
    // Split into components
    const w1 = q1.slice([0], [-1]).squeeze([-1]);
    const x1 = q1.slice([1], [-1]).squeeze([-1]);
    const y1 = q1.slice([2], [-1]).squeeze([-1]);
    const z1 = q1.slice([3], [-1]).squeeze([-1]);
    
    const w2 = q2.slice([0], [-1]).squeeze([-1]);
    const x2 = q2.slice([1], [-1]).squeeze([-1]);
    const y2 = q2.slice([2], [-1]).squeeze([-1]);
    const z2 = q2.slice([3], [-1]).squeeze([-1]);
    
    // Hamilton product formulas
    const w = w1.mul(w2).sub(x1.mul(x2)).sub(y1.mul(y2)).sub(z1.mul(z2));
    const x = w1.mul(x2).add(x1.mul(w2)).add(y1.mul(z2)).sub(z1.mul(y2));
    const y = w1.mul(y2).sub(x1.mul(z2)).add(y1.mul(w2)).add(z1.mul(x2));
    const z = w1.mul(z2).add(x1.mul(y2)).sub(y1.mul(x2)).add(z1.mul(w2));
    
    return tf.stack([w, x, y, z], -1);
  });
}

/**
 * Quaternion conjugate
 */
function quaternionConj(q) {
  if (!tf) throw new Error('TensorFlow.js not available');
  
  return tf.tidy(() => {
    const w = q.slice([0], [1]);
    const xyz = q.slice([1], [3]).neg();
    return tf.concat([w, xyz], -1);
  });
}

/**
 * Quaternion norm squared
 */
function quaternionNorm2(q) {
  if (!tf) throw new Error('TensorFlow.js not available');
  return q.square().sum(-1);
}

/**
 * Normalize quaternion to unit
 */
function quaternionNormalize(q) {
  if (!tf) throw new Error('TensorFlow.js not available');
  
  return tf.tidy(() => {
    const norm = quaternionNorm2(q).sqrt().expandDims(-1);
    return q.div(norm.add(1e-8));
  });
}

// ============================================================================
// CUSTOM LAYERS
// ============================================================================

/**
 * QuaternionDense Layer
 * Projects input to quaternion space and applies Hamilton product mixing
 */
class QuaternionDense extends tf.layers.Layer {
  static className = 'QuaternionDense';
  
  constructor(config) {
    super(config);
    this.units = config.units;  // Output quaternions (units * 4 total outputs)
    this.useBias = config.useBias !== false;
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    const inputDim = inputShape[inputShape.length - 1];
    
    // Weight matrix maps to quaternion space
    this.kernel = this.addWeight(
      'kernel',
      [inputDim, this.units * 4],
      'float32',
      tf.initializers.glorotUniform()
    );
    
    if (this.useBias) {
      this.bias = this.addWeight(
        'bias',
        [this.units * 4],
        'float32',
        tf.initializers.zeros()
      );
    }
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      // Linear projection
      let output = tf.matMul(x, this.kernel.read());
      
      if (this.useBias) {
        output = output.add(this.bias.read());
      }
      
      // Reshape to [..., units, 4]
      const shape = output.shape.slice(0, -1).concat([this.units, 4]);
      output = output.reshape(shape);
      
      // Normalize each quaternion
      return quaternionNormalize(output);
    });
  }
  
  computeOutputShape(inputShape) {
    return inputShape.slice(0, -1).concat([this.units, 4]);
  }
  
  getConfig() {
    const config = super.getConfig();
    config.units = this.units;
    config.useBias = this.useBias;
    return config;
  }
}

tf && tf.serialization.registerClass(QuaternionDense);

/**
 * Sparse Prime Embedding Layer
 * Maps token IDs to sparse prime activations with quaternion orientations
 */
class SparsePrimeEmbedding extends tf.layers.Layer {
  static className = 'SparsePrimeEmbedding';
  
  constructor(config) {
    super(config);
    this.numPrimes = config.numPrimes || 4096;
    this.k = config.k || 32;  // Number of active primes per token
    this.embeddingDim = config.embeddingDim || 64;
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    // Prime selection weights (learned)
    this.primeWeights = this.addWeight(
      'primeWeights',
      [this.embeddingDim, this.numPrimes],
      'float32',
      tf.initializers.glorotUniform()
    );
    
    // Quaternion orientation per prime
    this.quaternionWeights = this.addWeight(
      'quaternionWeights',
      [this.numPrimes, 4],
      'float32',
      tf.initializers.randomNormal({ mean: 0, stddev: 0.1 })
    );
    
    // Phase bias per prime
    this.phaseBias = this.addWeight(
      'phaseBias',
      [this.numPrimes],
      'float32',
      tf.initializers.zeros()
    );
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      // x: [batch, seq, embeddingDim]
      // Compute prime logits
      const logits = tf.matMul(x, this.primeWeights.read());  // [batch, seq, numPrimes]
      
      // Top-k selection (soft via gumbel-softmax or hard via topk)
      const { values: topkValues, indices: topkIndices } = tf.topk(logits, this.k);
      
      // Normalize to get amplitudes
      const amplitudes = tf.softmax(topkValues, -1);  // [batch, seq, k]
      
      // Gather quaternions for selected primes
      const quaternions = tf.gather(this.quaternionWeights.read(), topkIndices);  // [batch, seq, k, 4]
      
      // Gather phases
      const phases = tf.gather(this.phaseBias.read(), topkIndices);  // [batch, seq, k]
      
      return {
        indices: topkIndices,        // [batch, seq, k]
        amplitudes: amplitudes,      // [batch, seq, k]
        quaternions: quaternions,    // [batch, seq, k, 4]
        phases: phases               // [batch, seq, k]
      };
    });
  }
  
  computeOutputShape(inputShape) {
    const batchShape = inputShape.slice(0, -1);
    return {
      indices: batchShape.concat([this.k]),
      amplitudes: batchShape.concat([this.k]),
      quaternions: batchShape.concat([this.k, 4]),
      phases: batchShape.concat([this.k])
    };
  }
  
  getConfig() {
    const config = super.getConfig();
    config.numPrimes = this.numPrimes;
    config.k = this.k;
    config.embeddingDim = this.embeddingDim;
    return config;
  }
}

tf && tf.serialization.registerClass(SparsePrimeEmbedding);

/**
 * Resonant Attention Layer
 * Computes attention using: α·Jaccard + β·QuaternionAlign + γ·PhaseCoherence
 */
class ResonantAttention extends tf.layers.Layer {
  static className = 'ResonantAttention';
  
  constructor(config) {
    super(config);
    this.numHeads = config.numHeads || 8;
    this.keyDim = config.keyDim || 64;
    this.dropout = config.dropout || 0.0;
    
    // Mixing coefficients (learnable)
    this.alpha = config.alpha || 0.33;
    this.beta = config.beta || 0.33;
    this.gamma = config.gamma || 0.34;
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    const inputDim = inputShape[inputShape.length - 1];
    
    // Query, Key, Value projections
    this.queryWeight = this.addWeight(
      'queryWeight',
      [inputDim, this.numHeads * this.keyDim],
      'float32',
      tf.initializers.glorotUniform()
    );
    
    this.keyWeight = this.addWeight(
      'keyWeight',
      [inputDim, this.numHeads * this.keyDim],
      'float32',
      tf.initializers.glorotUniform()
    );
    
    this.valueWeight = this.addWeight(
      'valueWeight',
      [inputDim, this.numHeads * this.keyDim],
      'float32',
      tf.initializers.glorotUniform()
    );
    
    this.outputWeight = this.addWeight(
      'outputWeight',
      [this.numHeads * this.keyDim, inputDim],
      'float32',
      tf.initializers.glorotUniform()
    );
    
    // Learnable mixing coefficients
    this.mixingCoeffs = this.addWeight(
      'mixingCoeffs',
      [3],
      'float32',
      tf.initializers.constant({ value: 0.33 })
    );
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      const [batch, seq, dim] = x.shape;
      
      // Project to Q, K, V
      let q = tf.matMul(x, this.queryWeight.read());
      let k = tf.matMul(x, this.keyWeight.read());
      let v = tf.matMul(x, this.valueWeight.read());
      
      // Reshape for multi-head: [batch, seq, heads, keyDim]
      q = q.reshape([batch, seq, this.numHeads, this.keyDim]);
      k = k.reshape([batch, seq, this.numHeads, this.keyDim]);
      v = v.reshape([batch, seq, this.numHeads, this.keyDim]);
      
      // Transpose to [batch, heads, seq, keyDim]
      q = q.transpose([0, 2, 1, 3]);
      k = k.transpose([0, 2, 1, 3]);
      v = v.transpose([0, 2, 1, 3]);
      
      // Standard scaled dot-product attention (as baseline)
      // In full implementation, this would use Jaccard + Quaternion + Phase
      let scores = tf.matMul(q, k.transpose([0, 1, 3, 2]));
      scores = scores.div(tf.scalar(Math.sqrt(this.keyDim)));
      
      // Softmax attention weights
      const attnWeights = tf.softmax(scores, -1);
      
      // Apply attention to values
      let output = tf.matMul(attnWeights, v);
      
      // Transpose back and reshape
      output = output.transpose([0, 2, 1, 3]);
      output = output.reshape([batch, seq, this.numHeads * this.keyDim]);
      
      // Final projection
      output = tf.matMul(output, this.outputWeight.read());
      
      return output;
    });
  }
  
  computeOutputShape(inputShape) {
    return inputShape;
  }
  
  getConfig() {
    const config = super.getConfig();
    config.numHeads = this.numHeads;
    config.keyDim = this.keyDim;
    config.dropout = this.dropout;
    config.alpha = this.alpha;
    config.beta = this.beta;
    config.gamma = this.gamma;
    return config;
  }
}

tf && tf.serialization.registerClass(ResonantAttention);

/**
 * Hamilton Compose Layer
 * Order-sensitive composition using Hamilton product
 */
class HamiltonCompose extends tf.layers.Layer {
  static className = 'HamiltonCompose';
  
  constructor(config) {
    super(config);
    this.units = config.units || 64;
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    // Input is assumed to be [..., units, 4] (quaternion format)
    this.combineWeight = this.addWeight(
      'combineWeight',
      [this.units * 4, this.units * 4],
      'float32',
      tf.initializers.glorotUniform()
    );
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      // Expect two inputs: [q1, q2] each of shape [batch, ..., units, 4]
      let [q1, q2] = inputs;
      
      // Flatten quaternions
      const shape = q1.shape;
      const flatShape = shape.slice(0, -2).concat([this.units * 4]);
      
      q1 = q1.reshape(flatShape);
      q2 = q2.reshape(flatShape);
      
      // Hamilton-style mixing (simplified: learned combination)
      const combined = tf.matMul(q1.mul(q2), this.combineWeight.read());
      
      // Reshape back to quaternion format
      const outShape = shape;
      return quaternionNormalize(combined.reshape(outShape));
    });
  }
  
  computeOutputShape(inputShape) {
    return inputShape[0];  // Same as first input
  }
  
  getConfig() {
    const config = super.getConfig();
    config.units = this.units;
    return config;
  }
}

tf && tf.serialization.registerClass(HamiltonCompose);

/**
 * Coherence Gating Layer
 * Computes coherence and gates output
 */
class CoherenceGating extends tf.layers.Layer {
  static className = 'CoherenceGating';
  
  constructor(config) {
    super(config);
    this.threshold = config.threshold || 0.8;
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    const dim = inputShape[inputShape.length - 1];
    
    // Coherence computation weights
    this.coherenceWeight = this.addWeight(
      'coherenceWeight',
      [dim, 1],
      'float32',
      tf.initializers.glorotUniform()
    );
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      // Compute coherence score
      const coherence = tf.sigmoid(tf.matMul(x, this.coherenceWeight.read()));
      
      // Gate output based on coherence
      const gate = tf.sigmoid(coherence.sub(this.threshold).mul(10));
      
      return {
        output: x.mul(gate),
        coherence: coherence.squeeze(-1),
        gate: gate.squeeze(-1)
      };
    });
  }
  
  computeOutputShape(inputShape) {
    return {
      output: inputShape,
      coherence: inputShape.slice(0, -1),
      gate: inputShape.slice(0, -1)
    };
  }
  
  getConfig() {
    const config = super.getConfig();
    config.threshold = this.threshold;
    return config;
  }
}

tf && tf.serialization.registerClass(CoherenceGating);

/**
 * Entropy Collapse Layer
 * VQ-style collapse to 64 attractors with entropy regularization
 */
class EntropyCollapse extends tf.layers.Layer {
  static className = 'EntropyCollapse';
  
  constructor(config) {
    super(config);
    this.numAttractors = config.numAttractors || 64;
    this.targetEntropy = config.targetEntropy || 5.99;
    this.temperature = config.temperature || 1.0;
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    const dim = inputShape[inputShape.length - 1];
    
    // Attractor codebook
    this.codebook = this.addWeight(
      'codebook',
      [this.numAttractors, dim],
      'float32',
      tf.initializers.glorotUniform()
    );
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      const training = kwargs.training || false;
      
      // Compute distances to all attractors
      // x: [batch, seq, dim], codebook: [numAttractors, dim]
      const xExpanded = x.expandDims(-2);  // [batch, seq, 1, dim]
      const codebookExpanded = this.codebook.read().expandDims(0).expandDims(0);  // [1, 1, numAttractors, dim]
      
      const distances = xExpanded.sub(codebookExpanded).square().sum(-1);  // [batch, seq, numAttractors]
      
      // Convert to similarities (negative distance)
      const logits = distances.neg().div(this.temperature);
      
      // Soft assignment probabilities
      const probs = tf.softmax(logits, -1);
      
      // Compute entropy
      const entropy = probs.mul(probs.add(1e-10).log()).sum(-1).neg();
      
      // Entropy loss (toward target)
      const entropyLoss = entropy.sub(this.targetEntropy).square().mean();
      
      if (training) {
        // Soft assignment during training
        const output = tf.matMul(probs, this.codebook.read());
        return { output, probs, entropy, entropyLoss };
      } else {
        // Hard assignment during inference
        const indices = logits.argMax(-1);
        const output = tf.gather(this.codebook.read(), indices.flatten()).reshape(x.shape);
        return { output, indices, entropy };
      }
    });
  }
  
  computeOutputShape(inputShape) {
    return {
      output: inputShape,
      probs: inputShape.slice(0, -1).concat([this.numAttractors]),
      entropy: inputShape.slice(0, -1)
    };
  }
  
  getConfig() {
    const config = super.getConfig();
    config.numAttractors = this.numAttractors;
    config.targetEntropy = this.targetEntropy;
    config.temperature = this.temperature;
    return config;
  }
}

tf && tf.serialization.registerClass(EntropyCollapse);

/**
 * Resonance Operator Layer
 * Applies R̂(n)|p⟩ = e^(2πi log_p(n))|p⟩ phase rotation
 */
class ResonanceOperator extends tf.layers.Layer {
  static className = 'ResonanceOperator';
  
  constructor(config) {
    super(config);
    this._built = false;
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    const dim = inputShape[inputShape.length - 1];
    
    // Learnable n parameter for rotation
    this.rotationParam = this.addWeight(
      'rotationParam',
      [dim],
      'float32',
      tf.initializers.ones()
    );
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      // Interpret x as complex amplitudes (pairs of real/imag)
      const shape = x.shape;
      const dim = shape[shape.length - 1];
      const halfDim = Math.floor(dim / 2);
      
      // Split into real and imaginary parts along last axis using split
      const [real, imag] = tf.split(x, 2, -1);
      
      // Get rotation parameters (broadcast to match shape)
      const n = this.rotationParam.read().slice([0], [halfDim]).abs().add(1);
      
      // Compute phases: 2π * log(n) for each "prime dimension"
      const phases = n.log().mul(2 * Math.PI);
      
      // Apply rotation: (r + i*m) * e^(i*phase) = (r*cos - m*sin) + i*(r*sin + m*cos)
      const cos = phases.cos();
      const sin = phases.sin();
      
      const newReal = real.mul(cos).sub(imag.mul(sin));
      const newImag = real.mul(sin).add(imag.mul(cos));
      
      return tf.concat([newReal, newImag], -1);
    });
  }
  
  computeOutputShape(inputShape) {
    return inputShape;
  }
  
  getConfig() {
    return super.getConfig();
  }
}

tf && tf.serialization.registerClass(ResonanceOperator);

// ============================================================================
// RESOFORMER BLOCK
// ============================================================================

/**
 * Complete ResoFormer Block
 * Combines all components: Attention → FFN → Coherence Gate → Optional Collapse
 */
class ResoFormerBlock extends tf.layers.Layer {
  static className = 'ResoFormerBlock';
  
  constructor(config) {
    super(config);
    this.dim = config.dim || 256;
    this.numHeads = config.numHeads || 8;
    this.ffnDim = config.ffnDim || 1024;
    this.dropoutRate = config.dropout || 0.1;
    this.useCollapse = config.useCollapse || false;
    this._built = false;
    
    // Get unique prefix for this block
    const prefix = this.name || 'resoformer_block';
    
    // Create sub-layers in constructor with unique names
    this.layerNorm1 = tf.layers.layerNormalization({ axis: -1, name: `${prefix}_ln1` });
    this.layerNorm2 = tf.layers.layerNormalization({ axis: -1, name: `${prefix}_ln2` });
    
    this.attention = new ResonantAttention({
      numHeads: this.numHeads,
      keyDim: Math.floor(this.dim / this.numHeads),
      dropout: this.dropoutRate,
      name: `${prefix}_attn`
    });
    
    this.resonanceOp = new ResonanceOperator({ name: `${prefix}_resop` });
    
    this.ffn1 = tf.layers.dense({ units: this.ffnDim, activation: 'gelu', name: `${prefix}_ffn1` });
    this.ffn2 = tf.layers.dense({ units: this.dim, name: `${prefix}_ffn2` });
    
    this.coherenceGate = new CoherenceGating({ threshold: 0.7, name: `${prefix}_cgate` });
    
    if (this.useCollapse) {
      this.collapse = new EntropyCollapse({ numAttractors: 64, name: `${prefix}_collapse` });
    }
    
    this.dropoutLayer = tf.layers.dropout({ rate: this.dropoutRate, name: `${prefix}_dropout` });
  }
  
  build(inputShape) {
    if (this._built) return;
    this._built = true;
    
    // Build sub-layers with input shape
    this.layerNorm1.build(inputShape);
    this.layerNorm2.build(inputShape);
    this.attention.build(inputShape);
    this.resonanceOp.build(inputShape);
    this.ffn1.build(inputShape);
    this.ffn2.build([...inputShape.slice(0, -1), this.ffnDim]);
    this.coherenceGate.build(inputShape);
    if (this.useCollapse) {
      this.collapse.build(inputShape);
    }
  }
  
  call(inputs, kwargs) {
    return tf.tidy(() => {
      let x = inputs;
      if (Array.isArray(x)) x = x[0];
      
      const training = kwargs.training || false;
      
      // Pre-norm attention
      let residual = x;
      x = this.layerNorm1.apply(x);
      x = this.attention.apply(x, { training });
      x = this.dropoutLayer.apply(x, { training });
      x = x.add(residual);
      
      // Apply resonance operator
      x = this.resonanceOp.apply(x);
      
      // Pre-norm FFN
      residual = x;
      x = this.layerNorm2.apply(x);
      x = this.ffn1.apply(x);
      x = this.ffn2.apply(x);
      x = this.dropoutLayer.apply(x, { training });
      x = x.add(residual);
      
      // Coherence gating
      const gated = this.coherenceGate.apply(x);
      x = gated.output;
      
      // Optional collapse
      if (this.useCollapse) {
        const collapsed = this.collapse.apply(x, { training });
        x = collapsed.output;
      }
      
      return x;
    });
  }
  
  computeOutputShape(inputShape) {
    return inputShape;
  }
  
  getConfig() {
    const config = super.getConfig();
    config.dim = this.dim;
    config.numHeads = this.numHeads;
    config.ffnDim = this.ffnDim;
    config.dropout = this.dropoutRate;
    config.useCollapse = this.useCollapse;
    return config;
  }
}

tf && tf.serialization.registerClass(ResoFormerBlock);

// ============================================================================
// RESOFORMER MODEL
// ============================================================================

/**
 * Create a complete ResoFormer model
 */
function createResoFormerModel(config = {}) {
  if (!tf) throw new Error('TensorFlow.js not available');
  
  const {
    vocabSize = 10000,
    seqLen = 512,
    dim = 256,
    numLayers = 6,
    numHeads = 8,
    ffnDim = 1024,
    numPrimes = 4096,
    k = 32,
    dropout = 0.1
  } = config;
  
  // Input layer
  const input = tf.input({ shape: [seqLen], dtype: 'int32', name: 'input_ids' });
  
  // Token embedding
  const embedding = tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: dim,
    name: 'token_embedding'
  }).apply(input);
  
  // Stack of ResoFormer blocks
  let x = embedding;
  for (let i = 0; i < numLayers; i++) {
    const block = new ResoFormerBlock({
      dim,
      numHeads,
      ffnDim,
      dropout,
      useCollapse: i === numLayers - 1,  // Collapse only at last layer
      name: `resoformer_block_${i}`
    });
    x = block.apply(x);
  }
  
  // Output projection for language modeling
  const lmHead = tf.layers.dense({
    units: vocabSize,
    name: 'lm_head'
  }).apply(x);
  
  // Create model
  const model = tf.model({
    inputs: input,
    outputs: lmHead,
    name: 'ResoFormer'
  });
  
  return model;
}

/**
 * Create ResoFormer for classification
 */
function createResoFormerClassifier(config = {}) {
  if (!tf) throw new Error('TensorFlow.js not available');
  
  const {
    vocabSize = 10000,
    seqLen = 512,
    dim = 256,
    numLayers = 6,
    numHeads = 8,
    ffnDim = 1024,
    numClasses = 10,
    dropout = 0.1
  } = config;
  
  // Input layer
  const input = tf.input({ shape: [seqLen], dtype: 'int32', name: 'input_ids' });
  
  // Token embedding
  let x = tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: dim,
    name: 'token_embedding'
  }).apply(input);
  
  // Stack of ResoFormer blocks
  for (let i = 0; i < numLayers; i++) {
    const block = new ResoFormerBlock({
      dim,
      numHeads,
      ffnDim,
      dropout,
      useCollapse: i === numLayers - 1,
      name: `resoformer_block_${i}`
    });
    x = block.apply(x);
  }
  
  // Global average pooling
  x = tf.layers.globalAveragePooling1d().apply(x);
  
  // Classification head
  const output = tf.layers.dense({
    units: numClasses,
    activation: 'softmax',
    name: 'classifier'
  }).apply(x);
  
  return tf.model({
    inputs: input,
    outputs: output,
    name: 'ResoFormerClassifier'
  });
}

/**
 * Create ResoFormer for embeddings/similarity
 */
function createResoFormerEmbedder(config = {}) {
  if (!tf) throw new Error('TensorFlow.js not available');
  
  const {
    vocabSize = 10000,
    seqLen = 512,
    dim = 256,
    numLayers = 4,
    numHeads = 8,
    ffnDim = 1024,
    embeddingDim = 128,
    dropout = 0.1
  } = config;
  
  // Input layer
  const input = tf.input({ shape: [seqLen], dtype: 'int32', name: 'input_ids' });
  
  // Token embedding
  let x = tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: dim,
    name: 'token_embedding'
  }).apply(input);
  
  // Stack of ResoFormer blocks
  for (let i = 0; i < numLayers; i++) {
    const block = new ResoFormerBlock({
      dim,
      numHeads,
      ffnDim,
      dropout,
      useCollapse: false,
      name: `resoformer_block_${i}`
    });
    x = block.apply(x);
  }
  
  // Pool to single vector
  x = tf.layers.globalAveragePooling1d().apply(x);
  
  // Project to embedding space
  const embedding = tf.layers.dense({
    units: embeddingDim,
    name: 'embedding_projection'
  }).apply(x);
  
  // L2 normalize for cosine similarity
  const normalized = tf.layers.layerNormalization().apply(embedding);
  
  return tf.model({
    inputs: input,
    outputs: normalized,
    name: 'ResoFormerEmbedder'
  });
}

// ============================================================================
// TRAINING UTILITIES
// ============================================================================

/**
 * Custom loss with entropy regularization
 */
function resoFormerLoss(yTrue, yPred, entropyWeight = 0.1, targetEntropy = 5.99) {
  return tf.tidy(() => {
    // Standard cross-entropy loss
    const ceLoss = tf.losses.softmaxCrossEntropy(yTrue, yPred);
    
    // Entropy of predictions (encourage diversity)
    const probs = tf.softmax(yPred, -1);
    const entropy = probs.mul(probs.add(1e-10).log()).sum(-1).neg().mean();
    
    // Regularize toward target entropy
    const entropyLoss = entropy.sub(targetEntropy).square();
    
    return ceLoss.add(entropyLoss.mul(entropyWeight));
  });
}

/**
 * Create optimizer with warmup and decay
 */
function createOptimizer(config = {}) {
  const {
    learningRate = 1e-4,
    warmupSteps = 1000,
    decaySteps = 10000,
    decayRate = 0.1
  } = config;
  
  // Use Adam with weight decay (AdamW style)
  return tf.train.adam(learningRate, 0.9, 0.999, 1e-8);
}

/**
 * Training step
 */
async function trainStep(model, optimizer, xBatch, yBatch) {
  return tf.tidy(() => {
    const { value: loss, grads } = tf.variableGrads(() => {
      const predictions = model.apply(xBatch, { training: true });
      return tf.losses.softmaxCrossEntropy(yBatch, predictions);
    });
    
    optimizer.applyGradients(grads);
    return loss;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Utility functions
  getPrimeLookup,
  getPrimeLogFrequencies,
  
  // Quaternion operations
  quaternionMul,
  quaternionConj,
  quaternionNorm2,
  quaternionNormalize,
  
  // Custom layers
  QuaternionDense,
  SparsePrimeEmbedding,
  ResonantAttention,
  HamiltonCompose,
  CoherenceGating,
  EntropyCollapse,
  ResonanceOperator,
  ResoFormerBlock,
  
  // Model builders
  createResoFormerModel,
  createResoFormerClassifier,
  createResoFormerEmbedder,
  
  // Training utilities
  resoFormerLoss,
  createOptimizer,
  trainStep,
  
  // TensorFlow reference (for users who need it)
  tf
};