/**
 * @example Hello World
 * @description Minimal example: encode text and get semantic state
 * 
 * This is the simplest possible TinyAleph example. It demonstrates:
 * - Loading the library
 * - Encoding text into hypercomplex semantic space
 * - Inspecting the resulting state
 */

const { createEngine, SemanticBackend, Hypercomplex } = require('../modular');

// ===========================================
// SETUP
// ===========================================

// Create a semantic backend directly for low-level access
const backend = new SemanticBackend({ dimension: 16 });

// Or create an engine for full pipeline processing
const engine = createEngine('semantic');

// ===========================================
// EXAMPLE CODE
// ===========================================

// Encode a simple phrase into hypercomplex space
const phrase = "Hello, TinyAleph!";

// Method 1: Using backend directly for state
const state = backend.textToOrderedState(phrase);

// Method 2: Using engine for full processing
const result = engine.run(phrase);

// ===========================================
// OUTPUT
// ===========================================

console.log('TinyAleph Hello World Example');
console.log('==============================\n');

console.log('Input phrase:', phrase);
console.log('\nSemantic state (from backend):');
console.log('  Dimension:', state.c.length);
console.log('  First 4 components:', state.c.slice(0, 4).map(c => c.toFixed(4)));
console.log('  Magnitude:', state.norm().toFixed(6));

console.log('\nEngine result:');
console.log('  Output:', result.output);
console.log('  Iterations:', result.iterations);

// Show tokens
const tokens = backend.tokenize(phrase, true);
console.log('\nTokens:');
for (const token of tokens) {
    console.log(`  "${token.word}" → [${token.primes.join(', ')}]`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n==============================');
console.log('KEY TAKEAWAYS:');
console.log('1. Text is encoded into hypercomplex space (16 dimensions by default)');
console.log('2. Each phrase produces a unique semantic signature');
console.log('3. The magnitude and state indicate semantic coherence');
console.log('4. Use backend for direct state access, engine for full pipeline');