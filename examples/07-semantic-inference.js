/**
 * Example: Semantic Inference with Resonance Attention
 *
 * Demonstrates the semantic inference engine that maps natural language
 * to symbols through patterns, direct matching, semantic similarity,
 * AND resonance-based disambiguation using ResoFormer attention.
 */

const {
  SemanticInference,
  EntityExtractor,
  semanticInference,
  inferSymbol,
  inferSymbols,
  extractEntities,
  symbolDatabase,
  inferWithResonance,
  inferMostResonant,
  getSymbol
} = require('../core');

console.log('='.repeat(60));
console.log('Semantic Inference Engine');
console.log('='.repeat(60));

// ─────────────────────────────────────────────────────────────────
// Direct Symbol Inference
// ─────────────────────────────────────────────────────────────────

console.log('\n1. Direct Symbol Inference');
console.log('-'.repeat(40));

const directQueries = ['warrior', 'hero', 'fire', 'mountain', 'wisdom'];
for (const query of directQueries) {
  const result = inferSymbol(query);
  if (result) {
    console.log(`  "${query}" → ${result.symbol.unicode} ${result.symbol.id} [${result.method}]`);
  } else {
    console.log(`  "${query}" → (no match)`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Multi-Word Inference
// ─────────────────────────────────────────────────────────────────

console.log('\n2. Multi-Word Text Inference');
console.log('-'.repeat(40));

const texts = [
  'The hero climbs the mountain',
  'A brave warrior fights in battle',
  'The sage seeks wisdom in the temple',
  'Fire and water combine in transformation',
  'The king rules from his throne'
];

for (const text of texts) {
  console.log(`\n  "${text}"`);
  const symbols = inferSymbols(text);
  if (symbols.length > 0) {
    const icons = symbols.map(s => s.symbol.unicode).join(' ');
    const ids = symbols.map(s => s.symbol.id).join(', ');
    console.log(`    → ${icons}`);
    console.log(`    → [${ids}]`);
  } else {
    console.log('    → (no symbols matched)');
  }
}

// ─────────────────────────────────────────────────────────────────
// Pattern Matching
// ─────────────────────────────────────────────────────────────────

console.log('\n3. Pattern-Based Inference');
console.log('-'.repeat(40));

const patternTests = [
  'a mighty knight in shining armor',
  'the old wizard with a long beard',
  'flames dancing in the night',
  'deep underground caverns',
  'stormy seas and crashing waves'
];

for (const text of patternTests) {
  const result = inferSymbol(text);
  if (result) {
    console.log(`  "${text.slice(0, 30)}..." → ${result.symbol.unicode} ${result.symbol.id} [${result.method}]`);
  } else {
    console.log(`  "${text.slice(0, 30)}..." → (no match)`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Entity Extraction
// ─────────────────────────────────────────────────────────────────

console.log('\n4. Entity Extraction');
console.log('-'.repeat(40));

const entityTexts = [
  'John traveled to Paris on Monday',
  'Dr. Smith discovered the ancient temple in 1985',
  'The battle occurred at Mount Olympus during summer'
];

for (const text of entityTexts) {
  console.log(`\n  "${text}"`);
  const entities = extractEntities(text);
  if (entities) {
    for (const [type, values] of Object.entries(entities)) {
      if (Array.isArray(values) && values.length > 0) {
        console.log(`    ${type}: [${values.join(', ')}]`);
      } else if (typeof values === 'string') {
        console.log(`    ${type}: ${values}`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Symbolic Narrative
// ─────────────────────────────────────────────────────────────────

console.log('\n5. Symbolic Narrative');
console.log('-'.repeat(40));

const narrative = `
The young hero left his village and traveled through the dark forest.
He crossed the great river and climbed the sacred mountain.
There he found the ancient sage who revealed the hidden truth.
Armed with wisdom, he descended to face the shadow within.
Through fire and transformation, he emerged victorious.
`;

console.log('  Input narrative:');
console.log('  ' + narrative.trim().split('\n').map(l => l.trim()).join('\n  '));

const storySymbols = inferSymbols(narrative);
console.log(`\n  Extracted symbols (${storySymbols.length}):`);

// Group by method
const byMethod = {};
for (const s of storySymbols) {
  if (!byMethod[s.method]) byMethod[s.method] = [];
  byMethod[s.method].push(s.symbol);
}

for (const [method, symbols] of Object.entries(byMethod)) {
  const icons = symbols.map(s => s.unicode).join(' ');
  console.log(`    ${method}: ${icons}`);
}

// Calculate resonance of the narrative
const { resonanceSignature } = require('../core');
const primes = storySymbols.map(s => s.symbol.prime);
if (primes.length >= 2) {
  const sig = resonanceSignature(primes);
  console.log(`\n  Narrative resonance: mean=${sig.mean.toFixed(4)}, goldenPairs=${sig.goldenCount}`);
}

// ─────────────────────────────────────────────────────────────────
// Resonance-Enhanced Inference
// ─────────────────────────────────────────────────────────────────

console.log('\n6. Resonance-Enhanced Inference (ResoFormer Attention)');
console.log('-'.repeat(40));

const resonanceText = 'The brave hero fought the shadow in the temple of fire';
console.log(`  Text: "${resonanceText}"`);

const resonanceResults = inferWithResonance(resonanceText);
console.log('\n  Symbols ranked by resonance harmony:');
for (const r of resonanceResults.slice(0, 5)) {
  const bonus = r.resonanceBonus ? `, resonance: ${r.resonanceBonus.toFixed(3)}` : '';
  console.log(`    ${r.symbol.unicode} ${r.symbol.id} (confidence: ${r.confidence.toFixed(2)}${bonus})`);
}

// ─────────────────────────────────────────────────────────────────
// Context-Aware Symbol Selection
// ─────────────────────────────────────────────────────────────────

console.log('\n7. Context-Aware Symbol Selection');
console.log('-'.repeat(40));

const contextSymbols = [getSymbol('warrior'), getSymbol('temple')];
console.log('  Context:', contextSymbols.map(s => `${s.unicode} ${s.id}`).join(', '));

const testWords = ['sword', 'fire', 'shadow', 'wisdom'];
console.log('\n  Finding most resonant symbols for context:');

for (const word of testWords) {
  const best = inferMostResonant(word, contextSymbols);
  if (best) {
    const contextR = best.contextResonance ? best.contextResonance.toFixed(4) : 'N/A';
    console.log(`    "${word}" → ${best.symbol.unicode} ${best.symbol.id} (context resonance: ${contextR})`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Resonance Attention for Disambiguation
// ─────────────────────────────────────────────────────────────────

console.log('\n8. Resonance Attention for Disambiguation');
console.log('-'.repeat(40));

console.log('  When multiple symbols could match, resonance picks');
console.log('  the one that "harmonizes" best with context.\n');

const ambiguousText = 'The warrior king held the sacred ring of power';
console.log(`  Text: "${ambiguousText}"`);

const disambiguated = inferWithResonance(ambiguousText);
console.log('\n  Disambiguated symbols (using resonance attention):');
for (const r of disambiguated) {
  const weight = r.attentionWeight ? `, attention: ${r.attentionWeight.toFixed(3)}` : '';
  console.log(`    ${r.symbol.unicode} ${r.symbol.id}${weight}`);
}

console.log('\n' + '='.repeat(60));
console.log('Resonance attention: Symbols that harmonize together resonate');
console.log('='.repeat(60));