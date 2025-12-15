/**
 * Example 05: ResoFormer Language Model
 * 
 * This example demonstrates training a ResoFormer on actual language:
 * - Character-level language model
 * - Trains on sample text corpus
 * - Generates new text using the trained model
 * 
 * Run with: node examples/resonance/05-language-model.js
 */

const tf = require('@tensorflow/tfjs-node');
const {
  ResoFormerBlock
} = require('../../core/rformer-tf');

// ============================================================================
// SAMPLE TEXT CORPUS - More text for better training
// ============================================================================

const SAMPLE_TEXT = `
To be, or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles
And by opposing end them. To die, to sleep,
No more; and by a sleep to say we end
The heart-ache and the thousand natural shocks
That flesh is heir to. To die, to sleep;
To sleep, perchance to dream. For in that sleep of death 
what dreams may come when we have shuffled off this mortal coil,
Must give us pause. There is the respect
That makes calamity of so long life.

All the world is a stage,
And all the men and women merely players;
They have their exits and their entrances,
And one man in his time plays many parts,
His acts being seven ages. At first, the infant,
Then the whining schoolboy, with his satchel
And shining morning face, creeping like snail
Unwillingly to school. And then the lover,
Sighing like furnace, with a woeful ballad
Made to his mistress. Then a soldier,
Full of strange oaths and bearded like the pard,
Jealous in honour, sudden and quick in quarrel,
Seeking the bubble reputation
Even in the cannon mouth.

Now is the winter of our discontent
Made glorious summer by this sun of York;
And all the clouds that lowered upon our house
In the deep bosom of the ocean buried.
Now are our brows bound with victorious wreaths;
Our bruised arms hung up for monuments;
Our stern alarums changed to merry meetings,
Our dreadful marches to delightful measures.

The quality of mercy is not strained,
It droppeth as the gentle rain from heaven
Upon the place beneath. It is twice blest;
It blesseth him that gives and him that takes.
It is mightiest in the mightiest. It becomes
The throned monarch better than his crown;
His sceptre shows the force of temporal power,
The attribute to awe and majesty,
Wherein doth sit the dread and fear of kings;
But mercy is above this sceptred sway;
It is enthroned in the hearts of kings,
It is an attribute to God himself.

Friends, Romans, countrymen, lend me your ears;
I come to bury Caesar, not to praise him.
The evil that men do lives after them;
The good is oft interred with their bones;
So let it be with Caesar. The noble Brutus
Hath told you Caesar was ambitious.
If it were so, it was a grievous fault,
And grievously hath Caesar answered it.

Tomorrow, and tomorrow, and tomorrow,
Creeps in this petty pace from day to day,
To the last syllable of recorded time;
And all our yesterdays have lighted fools
The way to dusty death. Out, out, brief candle!
Life is but a walking shadow, a poor player,
That struts and frets his hour upon the stage,
And then is heard no more. It is a tale
Told by an idiot, full of sound and fury,
Signifying nothing.

We are such stuff as dreams are made on,
and our little life is rounded with a sleep.

Now is the winter of our discontent
made glorious summer by this son of York;
and all the clouds that lowered upon our house
in the deep bosom of the ocean buried.

The quality of mercy is not strained.
It droppeth as the gentle rain from heaven
upon the place beneath. It is twice blessed.
It blesseth him that gives and him that takes.

Is this a dagger which I see before me,
The handle toward my hand? Come, let me clutch thee.
I have thee not, and yet I see thee still.
Art thou not, fatal vision, sensible
To feeling as to sight? or art thou but
A dagger of the mind, a false creation,
Proceeding from the heat-oppressed brain?

If music be the food of love, play on;
Give me excess of it, that, surfeiting,
The appetite may sicken, and so die.
That strain again! it had a dying fall:
O, it came over my ear like the sweet sound.

Shall I compare thee to a summer day?
Thou art more lovely and more temperate.
Rough winds do shake the darling buds of May,
And summer lease hath all too short a date.

Now is the time for all good men to come to the aid.
The quick brown fox jumps over the lazy dog.
A stitch in time saves nine.
To be or not to be that is the question.
All that glitters is not gold.
Actions speak louder than words.
`.trim().toLowerCase();

// ============================================================================
// TOKENIZATION
// ============================================================================

class CharTokenizer {
  constructor() {
    this.charToId = new Map();
    this.idToChar = new Map();
    this.vocabSize = 0;
  }
  
  fit(text) {
    const chars = [...new Set(text)].sort();
    
    this.charToId.set('<pad>', 0);
    this.idToChar.set(0, '');
    
    let id = 1;
    for (const char of chars) {
      this.charToId.set(char, id);
      this.idToChar.set(id, char);
      id++;
    }
    
    this.vocabSize = id;
    console.log(`Vocabulary: ${this.vocabSize} tokens (${chars.length} unique chars)`);
    return this;
  }
  
  encode(text) {
    return [...text].map(c => this.charToId.get(c) || 0);
  }
  
  decode(ids) {
    return ids.map(id => this.idToChar.get(id) || '').join('');
  }
}

// ============================================================================
// DATA PREPARATION
// ============================================================================

function createTrainingData(text, tokenizer, seqLen = 32, stride = 4) {
  const encoded = tokenizer.encode(text);
  const sequences = [];
  const targets = [];
  
  // Create more overlapping sequences
  for (let i = 0; i < encoded.length - seqLen; i += stride) {
    const seq = encoded.slice(i, i + seqLen);
    const target = encoded.slice(i + 1, i + seqLen + 1);
    sequences.push(seq);
    targets.push(target);
  }
  
  console.log(`Created ${sequences.length} training sequences (stride=${stride})`);
  
  const x = tf.tensor2d(sequences, [sequences.length, seqLen], 'int32');
  const y = tf.tensor3d(
    targets.map(t => t.map(id => {
      const oneHot = new Array(tokenizer.vocabSize).fill(0);
      oneHot[id] = 1;
      return oneHot;
    })),
    [targets.length, seqLen, tokenizer.vocabSize]
  );
  
  return { x, y };
}

// ============================================================================
// SIMPLER MODEL (for better convergence)
// ============================================================================

function createSimpleLanguageModel(config = {}) {
  const {
    vocabSize,
    seqLen = 32,
    dim = 256,
    numHeads = 8,
    ffnDim = 512,
    dropout = 0.1
  } = config;
  
  const input = tf.input({ shape: [seqLen], dtype: 'int32', name: 'input_ids' });
  
  // Token + position embedding
  let x = tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: dim,
    name: 'token_embedding'
  }).apply(input);
  
  // Simple transformer-style blocks
  for (let i = 0; i < 3; i++) {
    // Pre-norm
    const normed = tf.layers.layerNormalization({ name: `ln1_${i}` }).apply(x);
    
    // Self-attention (using dense projections)
    const q = tf.layers.dense({ units: dim, name: `q_${i}` }).apply(normed);
    const k = tf.layers.dense({ units: dim, name: `k_${i}` }).apply(normed);
    const v = tf.layers.dense({ units: dim, name: `v_${i}` }).apply(normed);
    
    // Simple attention: softmax(QK^T / sqrt(d)) V
    // Use dot product attention
    let attn = tf.layers.dot({ axes: -1, name: `attn_dot_${i}` }).apply([q, k]);
    attn = tf.layers.activation({ activation: 'softmax', name: `attn_softmax_${i}` }).apply(attn);
    attn = tf.layers.dot({ axes: [2, 1], name: `attn_v_${i}` }).apply([attn, v]);
    
    // Residual
    x = tf.layers.add({ name: `res1_${i}` }).apply([x, attn]);
    
    // FFN
    const normed2 = tf.layers.layerNormalization({ name: `ln2_${i}` }).apply(x);
    let ffn = tf.layers.dense({ units: ffnDim, activation: 'relu', name: `ffn1_${i}` }).apply(normed2);
    ffn = tf.layers.dense({ units: dim, name: `ffn2_${i}` }).apply(ffn);
    
    x = tf.layers.add({ name: `res2_${i}` }).apply([x, ffn]);
  }
  
  // Final norm and output
  x = tf.layers.layerNormalization({ name: 'final_ln' }).apply(x);
  const output = tf.layers.dense({
    units: vocabSize,
    activation: 'softmax',
    name: 'lm_head'
  }).apply(x);
  
  return tf.model({
    inputs: input,
    outputs: output,
    name: 'SimpleLM'
  });
}

// ============================================================================
// ResoFormer-based Language Model
// ============================================================================

function createResoFormerLM(config = {}) {
  const {
    vocabSize,
    seqLen = 32,
    dim = 256,
    numLayers = 3,
    numHeads = 8,
    ffnDim = 512,
    dropout = 0.1
  } = config;
  
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
  
  // Final norm
  x = tf.layers.layerNormalization({ name: 'final_ln' }).apply(x);
  
  // LM head
  const output = tf.layers.dense({
    units: vocabSize,
    activation: 'softmax',
    name: 'lm_head'
  }).apply(x);
  
  return tf.model({
    inputs: input,
    outputs: output,
    name: 'ResoFormerLM'
  });
}

// ============================================================================
// TEXT GENERATION
// ============================================================================

async function generateText(model, tokenizer, prompt, maxLen = 100, temperature = 0.8) {
  const seqLen = model.inputs[0].shape[1];
  let context = tokenizer.encode(prompt);
  
  if (context.length > seqLen) {
    context = context.slice(-seqLen);
  } else if (context.length < seqLen) {
    context = new Array(seqLen - context.length).fill(0).concat(context);
  }
  
  let generated = prompt;
  
  for (let i = 0; i < maxLen; i++) {
    const inputTensor = tf.tensor2d([context], [1, seqLen], 'int32');
    const logits = model.predict(inputTensor);
    const lastLogits = logits.slice([0, seqLen - 1, 0], [1, 1, -1]).squeeze();
    
    // Temperature scaling
    const scaled = lastLogits.div(temperature);
    const probs = tf.softmax(scaled);
    
    // Sample
    const nextTokenId = tf.multinomial(probs.expandDims(0), 1).dataSync()[0];
    const nextChar = tokenizer.decode([nextTokenId]);
    generated += nextChar;
    
    // Shift context
    context = context.slice(1).concat([nextTokenId]);
    
    inputTensor.dispose();
    logits.dispose();
    lastLogits.dispose();
    scaled.dispose();
    probs.dispose();
  }
  
  return generated;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('ResoFormer Language Model - Shakespeare');
  console.log('='.repeat(70));
  console.log(`TensorFlow.js: ${tf.version.tfjs} (${tf.getBackend()})\n`);
  
  // Tokenize
  const tokenizer = new CharTokenizer();
  tokenizer.fit(SAMPLE_TEXT);
  
  // Create training data with more overlap
  const seqLen = 48;
  const { x, y } = createTrainingData(SAMPLE_TEXT, tokenizer, seqLen, 2);
  console.log(`Training data: ${x.shape[0]} sequences × ${seqLen} chars`);
  console.log(`Total chars: ${SAMPLE_TEXT.length}`);
  
  // Create model
  console.log('\nCreating ResoFormer Language Model...');
  const model = createResoFormerLM({
    vocabSize: tokenizer.vocabSize,
    seqLen,
    dim: 256,
    numLayers: 3,
    numHeads: 8,
    ffnDim: 512,
    dropout: 0.1
  });
  
  // Count params
  let totalParams = 0;
  model.layers.forEach(layer => totalParams += layer.countParams());
  console.log(`Parameters: ${totalParams.toLocaleString()}`);
  
  // Compile with lower learning rate
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  // Train
  const epochs = 50;
  const batchSize = 32;
  
  console.log(`\nTraining for ${epochs} epochs (batch size ${batchSize})...`);
  console.log('-'.repeat(60));
  
  let bestLoss = Infinity;
  
  await model.fit(x, y, {
    epochs,
    batchSize,
    validationSplit: 0.1,
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (logs.loss < bestLoss) {
          bestLoss = logs.loss;
        }
        
        if ((epoch + 1) % 10 === 0 || epoch === 0) {
          const acc = (logs.acc * 100).toFixed(1);
          const valAcc = (logs.val_acc * 100).toFixed(1);
          console.log(`Epoch ${epoch + 1}/${epochs} | loss: ${logs.loss.toFixed(3)} | acc: ${acc}% | val_acc: ${valAcc}%`);
          
          // Quick generation check
          if ((epoch + 1) % 20 === 0) {
            const sample = await generateText(model, tokenizer, 'to be ', 40, 0.7);
            console.log(`  Sample: "${sample}"`);
          }
        }
      }
    }
  });
  
  // Final generation
  console.log('\n' + '='.repeat(70));
  console.log('TEXT GENERATION');
  console.log('='.repeat(70));
  
  const prompts = [
    'to be or not',
    'the quality',
    'all the world',
    'now is the'
  ];
  
  for (const prompt of prompts) {
    console.log(`\nPrompt: "${prompt}"`);
    
    // Low temperature (more focused)
    const text1 = await generateText(model, tokenizer, prompt, 80, 0.5);
    console.log(`T=0.5: ${text1}`);
    
    // Higher temperature (more creative)
    const text2 = await generateText(model, tokenizer, prompt, 80, 0.9);
    console.log(`T=0.9: ${text2}`);
  }
  
  // Novel prompt
  console.log('\n--- Novel prompt ---');
  const novel = await generateText(model, tokenizer, 'in the beginning ', 120, 0.7);
  console.log(`T=0.7: ${novel}`);
  
  // Cleanup
  x.dispose();
  y.dispose();
  
  console.log('\n' + '='.repeat(70));
  console.log('Training complete!');
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
});