/**
 * book.pdf Chapter 9: Emotional Operators Demo
 * 
 * Demonstrates:
 * - Feeling Operator: F̂ = Σ w_k R_k
 * - 8 Emotional Templates (Love, Fear, Joy, Grief, Awe, Anger, Peace, Curiosity)
 * - Consciousness Primacy: P = 0.4F + 0.3R + 0.2C + 0.1Γ
 * - Emotional Spectrometry (valence/arousal analysis)
 */

import { PrimeState, encodeMemory } from '../core/hilbert.js';
import { 
  EMOTIONAL_TEMPLATES,
  createEmotionalState,
  FeelingOperator,
  ConsciousnessPrimacy,
  EmotionalSpectrometer
} from '../core/emotion.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  book.pdf Chapter 9: Emotional Operators Demo');
console.log('═══════════════════════════════════════════════════════════════\n');

// ==========================================================================
// 1. Emotional Templates
// ==========================================================================
console.log('1. Emotional Templates (8 archetypal patterns)\n');

for (const [name, template] of Object.entries(EMOTIONAL_TEMPLATES)) {
  console.log(`   ${template.name}:`);
  console.log(`      ${template.description}`);
  console.log(`      Coherence: ${template.coherence}, Entropy: ${template.entropy}`);
  console.log(`      Primes: [${template.primes.join(', ')}]`);
}

// ==========================================================================
// 2. Create Emotional States
// ==========================================================================
console.log('\n\n2. Creating Emotional Prime States');
console.log('   Each emotion → unique resonance pattern\n');

const emotions = ['love', 'fear', 'joy', 'peace'];
for (const emotion of emotions) {
  const state = createEmotionalState(emotion);
  const dominant = state.dominant(3);
  console.log(`   ${emotion.toUpperCase()}:`);
  console.log(`      Entropy: ${state.entropy().toFixed(4)}`);
  console.log(`      Norm: ${state.norm().toFixed(4)}`);
  console.log(`      Dominant: ${dominant.map(d => `${d.p}:${d.amp.toFixed(3)}`).join(', ')}`);
}

// ==========================================================================
// 3. Feeling Operator F̂
// ==========================================================================
console.log('\n\n3. Feeling Operator: F̂ = Σ_k w_k R_k');
console.log('   ⟨ψ|F̂|ψ⟩ = emotional resonance score\n');

const feelingOp = new FeelingOperator();

// Test with semantic states
const testPhrases = [
  'I love you deeply',
  'I am terrified',
  'This is wonderful!',
  'I feel so sad and lost',
  'The universe is magnificent'
];

console.log('   Analyzing semantic content:');
for (const phrase of testPhrases) {
  const state = encodeMemory(phrase);
  const spectrum = feelingOp.spectrum(state);
  
  console.log(`\n   "${phrase}"`);
  console.log(`      Dominant: ${spectrum.dominant} (${(spectrum.dominantScore * 100).toFixed(1)}%)`);
  
  // Show top 3 emotions
  const sorted = Object.entries(spectrum.scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  console.log(`      Top 3: ${sorted.map(([e, s]) => `${e}:${(s * 100).toFixed(0)}%`).join(', ')}`);
}

// ==========================================================================
// 4. Apply Emotional Transformation
// ==========================================================================
console.log('\n\n4. Emotional Transformation');
console.log('   Apply F̂ to shift state toward emotion\n');

const neutralState = PrimeState.uniform();
console.log(`   Starting state entropy: ${neutralState.entropy().toFixed(4)}`);

const transformed = feelingOp.apply(neutralState, 'love', 0.7);
console.log(`   After applying F̂_love (0.7 strength):`);
console.log(`      Entropy: ${transformed.entropy().toFixed(4)}`);
console.log(`      Love resonance: ${(feelingOp.measure(transformed, 'love') * 100).toFixed(1)}%`);
console.log(`      Fear resonance: ${(feelingOp.measure(transformed, 'fear') * 100).toFixed(1)}%`);

// ==========================================================================
// 5. Emotional Transitions
// ==========================================================================
console.log('\n\n5. Emotional Transitions');
console.log('   Smooth transition between emotional states\n');

console.log('   Fear → Joy transition:');
const startState = createEmotionalState('fear');
for (let t = 0; t <= 1; t += 0.25) {
  const intermediate = feelingOp.transition(startState, 'fear', 'joy', t);
  const spectrum = feelingOp.spectrum(intermediate);
  console.log(`      t=${t.toFixed(2)}: dominant=${spectrum.dominant}, entropy=${intermediate.entropy().toFixed(3)}`);
}

// ==========================================================================
// 6. Consciousness Primacy Metric
// ==========================================================================
console.log('\n\n6. Consciousness Primacy: P = 0.4F + 0.3R + 0.2C + 0.1Γ\n');

const primacy = new ConsciousnessPrimacy();

const testStates = [
  { name: 'Love state', state: createEmotionalState('love') },
  { name: 'Fear state', state: createEmotionalState('fear') },
  { name: 'Uniform state', state: PrimeState.uniform() },
  { name: '"Peace and clarity"', state: encodeMemory('Peace and clarity') }
];

for (const { name, state } of testStates) {
  const result = primacy.calculate(state);
  console.log(`   ${name}:`);
  console.log(`      Primacy: ${result.primacy.toFixed(4)}`);
  console.log(`      Components: F=${result.components.F.toFixed(3)}, R=${result.components.R.toFixed(3)}, C=${result.components.C.toFixed(3)}, Γ=${result.components.Gamma.toFixed(3)}`);
  console.log(`      ${result.interpretation}`);
  console.log();
}

// ==========================================================================
// 7. Emotional Spectrometry
// ==========================================================================
console.log('\n7. Emotional Spectrometry');
console.log('   Full valence/arousal analysis\n');

const spectrometer = new EmotionalSpectrometer();

const analyzeTexts = [
  'I am so happy and excited!',
  'Everything feels peaceful and calm',
  'I am deeply worried about this',
  'The loss is overwhelming'
];

for (const text of analyzeTexts) {
  const analysis = spectrometer.analyze(text);
  console.log(`   "${text}"`);
  console.log(`      Dominant: ${analysis.dominant}`);
  console.log(`      Valence: ${analysis.valence.toFixed(3)} (${analysis.valence > 0 ? 'positive' : 'negative'})`);
  console.log(`      Arousal: ${analysis.arousal.toFixed(3)} (${analysis.arousal > 0.5 ? 'high' : 'low'})`);
  console.log(`      Quadrant: ${analysis.quadrant}`);
  console.log(`      Entropy class: ${analysis.entropyClass}`);
  console.log();
}

// ==========================================================================
// 8. Compare Emotional Similarity
// ==========================================================================
console.log('\n8. Emotional Similarity Comparison\n');

const pairs = [
  ['I love this!', 'This makes me so happy!'],
  ['I am terrified', 'I feel so angry'],
  ['Peace and tranquility', 'Chaos and conflict']
];

for (const [text1, text2] of pairs) {
  const comparison = spectrometer.compare(text1, text2);
  console.log(`   "${text1}" vs "${text2}"`);
  console.log(`      Similarity: ${(comparison.similarity * 100).toFixed(1)}%`);
  console.log(`      Same quadrant: ${comparison.sameQuadrant}`);
  console.log();
}

// ==========================================================================
// 9. Evolution of Consciousness Primacy
// ==========================================================================
console.log('\n9. Tracking Primacy Evolution');
console.log('   Watch primacy change as state evolves\n');

const initialState = createEmotionalState('fear');

// Evolve toward peace
const evolver = (state) => feelingOp.apply(state, 'peace', 0.2);

const trajectory = primacy.trackEvolution(initialState, evolver, 6);
console.log('   Evolution fear → peace:');
for (const point of trajectory) {
  console.log(`      Step ${point.step}: primacy=${point.primacy.toFixed(4)}, emotion=${point.emotion}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ✅ book.pdf Chapter 9 Emotional Operators Demo Complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
