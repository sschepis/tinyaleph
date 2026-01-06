/**
 * Example 04: TensorFlow.js ResoFormer Training
 * 
 * This example demonstrates training a ResoFormer model using TensorFlow.js.
 * The model uses:
 *   - Quaternion-valued embeddings (H_Q = H_P ⊗ ℍ)
 *   - Sparse prime state representations
 *   - Resonant attention with phase coherence
 *   - Coherence-gated adaptive computation
 *   - Entropy collapse to 64 attractors
 * 
 * Run with: node examples/resonance/04-resoformer-training.js
 */

const tf = require('@tensorflow/tfjs-node');
const {
  QuaternionDense,
  SparsePrimeEmbedding,
  ResonantAttention,
  ResoFormerBlock,
  createResoFormerModel,
  createResoFormerClassifier,
  createResoFormerEmbedder
} = require('../../core/rformer-tf');

// ============================================================================
// SYNTHETIC DATA GENERATION
// ============================================================================

/**
 * Generate synthetic sequence classification data
 * Task: Classify sequences by their "prime pattern"
 */
function generatePrimePatternData(numSamples = 1000, seqLen = 32, vocabSize = 100, numClasses = 5) {
  console.log(`\nGenerating ${numSamples} synthetic sequences...`);
  
  // Simple primes for pattern creation
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  
  const sequences = [];
  const labels = [];
  
  for (let i = 0; i < numSamples; i++) {
    const classIdx = i % numClasses;
    const seq = [];
    
    // Each class has a different "prime signature"
    // Class 0: multiples of 2
    // Class 1: multiples of 3
    // Class 2: multiples of 5
    // Class 3: prime indices
    // Class 4: alternating pattern
    
    for (let j = 0; j < seqLen; j++) {
      let token;
      
      switch (classIdx) {
        case 0:
          // Multiples of 2 with noise
          token = (j * 2 + Math.floor(Math.random() * 3)) % vocabSize;
          break;
        case 1:
          // Multiples of 3 with noise
          token = (j * 3 + Math.floor(Math.random() * 3)) % vocabSize;
          break;
        case 2:
          // Multiples of 5 with noise
          token = (j * 5 + Math.floor(Math.random() * 3)) % vocabSize;
          break;
        case 3:
          // Prime sequence
          token = primes[j % primes.length] % vocabSize;
          break;
        case 4:
          // Alternating 2-3-5-7 pattern
          token = primes[j % 4] * (j + 1) % vocabSize;
          break;
        default:
          token = Math.floor(Math.random() * vocabSize);
      }
      
      seq.push(token);
    }
    
    sequences.push(seq);
    labels.push(classIdx);
  }
  
  // Convert to tensors
  const xData = tf.tensor2d(sequences, [numSamples, seqLen], 'int32');
  const yData = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);
  
  return { x: xData, y: yData, numClasses };
}

/**
 * Split data into train/test sets
 */
function splitData(x, y, trainRatio = 0.8) {
  const numSamples = x.shape[0];
  const numTrain = Math.floor(numSamples * trainRatio);
  
  const xTrain = x.slice([0, 0], [numTrain, -1]);
  const yTrain = y.slice([0, 0], [numTrain, -1]);
  const xTest = x.slice([numTrain, 0], [-1, -1]);
  const yTest = y.slice([numTrain, 0], [-1, -1]);
  
  return { xTrain, yTrain, xTest, yTest };
}

// ============================================================================
// MODEL INSPECTION
// ============================================================================

function inspectModel(model) {
  console.log('\n=== Model Architecture ===');
  console.log(`Name: ${model.name}`);
  console.log(`Layers: ${model.layers.length}`);
  
  let totalParams = 0;
  model.layers.forEach((layer, i) => {
    const numParams = layer.countParams();
    totalParams += numParams;
    console.log(`  [${i}] ${layer.name}: ${layer.getClassName()} (${numParams} params)`);
  });
  
  console.log(`Total parameters: ${totalParams.toLocaleString()}`);
  console.log('');
}

// ============================================================================
// TRAINING LOOP
// ============================================================================

async function trainResoFormer() {
  console.log('='.repeat(60));
  console.log('TensorFlow.js ResoFormer Training Example');
  console.log('='.repeat(60));
  
  // Configuration
  const config = {
    vocabSize: 100,
    seqLen: 32,
    dim: 64,           // Smaller for demo
    numLayers: 2,      // Fewer layers for demo
    numHeads: 4,
    ffnDim: 128,
    numClasses: 5,
    dropout: 0.1
  };
  
  // Generate synthetic data
  const { x, y, numClasses } = generatePrimePatternData(
    1000,           // samples
    config.seqLen,
    config.vocabSize,
    config.numClasses
  );
  
  // Split into train/test
  const { xTrain, yTrain, xTest, yTest } = splitData(x, y, 0.8);
  console.log(`Train samples: ${xTrain.shape[0]}`);
  console.log(`Test samples: ${xTest.shape[0]}`);
  
  // Create model
  console.log('\nCreating ResoFormer classifier...');
  const model = createResoFormerClassifier(config);
  
  // Inspect architecture
  inspectModel(model);
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  // Training configuration
  const epochs = 10;
  const batchSize = 32;
  
  console.log(`\nTraining for ${epochs} epochs with batch size ${batchSize}...`);
  console.log('-'.repeat(50));
  
  // Train with callbacks
  await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationData: [xTest, yTest],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        const acc = (logs.acc * 100).toFixed(1);
        const valAcc = (logs.val_acc * 100).toFixed(1);
        const loss = logs.loss.toFixed(4);
        const valLoss = logs.val_loss.toFixed(4);
        console.log(`Epoch ${epoch + 1}/${epochs} - loss: ${loss}, acc: ${acc}% | val_loss: ${valLoss}, val_acc: ${valAcc}%`);
      }
    }
  });
  
  // Final evaluation
  console.log('\n=== Final Evaluation ===');
  const evalResult = model.evaluate(xTest, yTest);
  const [finalLoss, finalAcc] = await Promise.all([
    evalResult[0].data(),
    evalResult[1].data()
  ]);
  console.log(`Test Loss: ${finalLoss[0].toFixed(4)}`);
  console.log(`Test Accuracy: ${(finalAcc[0] * 100).toFixed(2)}%`);
  
  // Demonstrate inference
  console.log('\n=== Inference Demo ===');
  const sampleBatch = xTest.slice([0, 0], [5, -1]);
  const predictions = model.predict(sampleBatch);
  const predClasses = predictions.argMax(-1);
  const trueClasses = yTest.slice([0, 0], [5, -1]).argMax(-1);
  
  const predData = await predClasses.data();
  const trueData = await trueClasses.data();
  
  console.log('Sample predictions:');
  for (let i = 0; i < 5; i++) {
    const match = predData[i] === trueData[i] ? '✓' : '✗';
    console.log(`  Sample ${i + 1}: Predicted=${predData[i]}, True=${trueData[i]} ${match}`);
  }
  
  // Cleanup
  x.dispose();
  y.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xTest.dispose();
  yTest.dispose();
  model.dispose();
  
  console.log('\n' + '='.repeat(60));
  console.log('Training complete!');
  console.log('='.repeat(60));
}

// ============================================================================
// EMBEDDER DEMO
// ============================================================================

async function demoEmbedder() {
  console.log('\n' + '='.repeat(60));
  console.log('ResoFormer Embedder Demo');
  console.log('='.repeat(60));
  
  const config = {
    vocabSize: 100,
    seqLen: 32,
    dim: 64,
    numLayers: 2,
    numHeads: 4,
    ffnDim: 128,
    embeddingDim: 32
  };
  
  console.log('\nCreating ResoFormer embedder...');
  const embedder = createResoFormerEmbedder(config);
  inspectModel(embedder);
  
  // Create sample sequences
  const seq1 = tf.tensor2d([[2, 4, 6, 8, 10, 12, 14, 16, ...Array(24).fill(0)]], [1, 32], 'int32');
  const seq2 = tf.tensor2d([[3, 6, 9, 12, 15, 18, 21, 24, ...Array(24).fill(0)]], [1, 32], 'int32');
  const seq3 = tf.tensor2d([[2, 4, 6, 8, 10, 12, 14, 16, ...Array(24).fill(0)]], [1, 32], 'int32');
  
  // Get embeddings
  const emb1 = embedder.predict(seq1);
  const emb2 = embedder.predict(seq2);
  const emb3 = embedder.predict(seq3);
  
  // Compute cosine similarities
  function cosineSimilarity(a, b) {
    return tf.tidy(() => {
      const dot = tf.sum(a.mul(b));
      const normA = tf.sqrt(tf.sum(a.square()));
      const normB = tf.sqrt(tf.sum(b.square()));
      return dot.div(normA.mul(normB));
    });
  }
  
  const sim12 = await cosineSimilarity(emb1, emb2).data();
  const sim13 = await cosineSimilarity(emb1, emb3).data();
  const sim23 = await cosineSimilarity(emb2, emb3).data();
  
  console.log('\nSequence similarities:');
  console.log(`  Seq1 (2x) vs Seq2 (3x): ${sim12[0].toFixed(4)}`);
  console.log(`  Seq1 (2x) vs Seq3 (2x identical): ${sim13[0].toFixed(4)}`);
  console.log(`  Seq2 (3x) vs Seq3 (2x): ${sim23[0].toFixed(4)}`);
  
  // Cleanup
  seq1.dispose();
  seq2.dispose();
  seq3.dispose();
  emb1.dispose();
  emb2.dispose();
  emb3.dispose();
  embedder.dispose();
  
  console.log('\nEmbedder demo complete!');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Show TensorFlow backend info
    console.log(`TensorFlow.js backend: ${tf.getBackend()}`);
    console.log(`TensorFlow.js version: ${tf.version.tfjs}`);
    
    // Run training demo
    await trainResoFormer();
    
    // Run embedder demo
    await demoEmbedder();
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();