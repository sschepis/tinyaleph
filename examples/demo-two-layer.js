/**
 * Demo: Two-Layer Semantic System
 * 
 * Shows how the same MEANING (primes) can be expressed 
 * with different WORDS based on register/style biases
 */

const { TwoLayerEngine } = require('../backends/semantic/two-layer');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       Two-Layer Semantic System Demo                          ║');
console.log('║       Layer 1: Prime-Based Meaning (Invariant)               ║');
console.log('║       Layer 2: Word Selection with Bias (Variable)           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const engine = new TwoLayerEngine({
  core: { dimension: 16 }
});

// ============================================
// 1. Same Meaning, Different Registers
// ============================================
console.log('┌───────────────────────────────────────────────────────────────┐');
console.log('│  SAME MEANING, DIFFERENT REGISTERS                           │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const input1 = 'truth wisdom knowledge';
console.log(`Input: "${input1}"\n`);

// Process in formal register
engine.useRegister('formal');
const formal = engine.process(input1);
console.log(`  Formal:   "${formal.surface.words.join(' ')}"`);

// Transform to casual
const toCasual = engine.transform(input1, 'casual');
console.log(`  Casual:   "${toCasual.transformed}"`);

// Transform to technical
const toTechnical = engine.transform(input1, 'technical');
console.log(`  Technical: "${toTechnical.transformed}"`);

// Transform to poetic
const toPoetic = engine.transform(input1, 'poetic');
console.log(`  Poetic:   "${toPoetic.transformed}"`);

console.log(`\n  Same meaning primes: [${formal.meaning.primes.slice(0,8).join(', ')}...]`);
console.log(`  Meaning entropy: ${formal.meaning.entropy.toFixed(3)}`);

// ============================================
// 2. Cross-Register Translation
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  CROSS-REGISTER TRANSLATION                                   │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

// Casual to Formal
const casualInput = 'love';
console.log(`Translating casual → formal:`);
console.log(`  "${casualInput}" → `, engine.translate(casualInput, 'casual', 'formal').translated);

// Formal to Casual  
const formalInput = 'contemplate';
console.log(`\nTranslating formal → casual:`);
console.log(`  "${formalInput}" → `, engine.translate(formalInput, 'formal', 'casual').translated);

// Technical to Poetic
const techInput = 'analyze';
console.log(`\nTranslating technical → poetic:`);
console.log(`  "${techInput}" → `, engine.translate(techInput, 'technical', 'poetic').translated);

// ============================================
// 3. Context-Sensitive Selection
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  CONTEXT-SENSITIVE WORD SELECTION                             │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

// Set context and see how it affects word choice
engine.useRegister('formal');

console.log('Same primes [7, 11, 13] ("truth") in different contexts:\n');

engine.surfaces.pushContext('academic');
const academic = engine.surfaces.decode([7, 11, 13], { deterministic: true });
engine.surfaces.popContext();
console.log(`  Context: academic   → "${academic}"`);

engine.surfaces.pushContext('legal');
const legal = engine.surfaces.decode([7, 11, 13], { deterministic: true });
engine.surfaces.popContext();
console.log(`  Context: legal      → "${legal}"`);

engine.surfaces.pushContext('archaic');
const archaic = engine.surfaces.decode([7, 11, 13], { deterministic: true });
engine.surfaces.popContext();
console.log(`  Context: archaic    → "${archaic}"`);

// ============================================
// 4. The Two-Layer Architecture
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  THE TWO-LAYER ARCHITECTURE                                   │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

console.log(`
            INPUT TEXT
                │
                ▼
    ┌─────────────────────┐
    │   LAYER 1: CORE     │
    │   ─────────────     │
    │  Tokenize → Primes  │
    │  Non-commutative    │
    │  multiplication     │   ← INVARIANT MEANING
    │        ↓            │
    │  Hypercomplex       │
    │  State Vector       │
    └──────────┬──────────┘
               │
               │ [primes]
               ▼
    ┌─────────────────────┐
    │   LAYER 2: SURFACE  │
    │   ───────────────   │
    │  Prime → Word       │
    │  candidates         │
    │        ↓            │
    │  Apply biases:      │   ← VARIABLE EXPRESSION
    │  • Register         │
    │  • Context          │
    │  • Recency          │
    │  • User preference  │
    │        ↓            │
    │  Select best word   │
    └──────────┬──────────┘
               │
               ▼
          OUTPUT TEXT
`);

// ============================================
// 5. Probabilistic vs Deterministic Selection
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  PROBABILISTIC WORD SELECTION                                 │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

console.log('10 samples of [2, 3, 5] ("love") in casual register:');
engine.useRegister('casual');

const samples = [];
for (let i = 0; i < 10; i++) {
  samples.push(engine.surfaces.decode([2, 3, 5], { deterministic: false }));
}
console.log(`  ${samples.join(', ')}\n`);

console.log('(Probabilistic selection adds natural variety)');

// ============================================
// 6. Available Registers
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  AVAILABLE REGISTERS                                          │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const registers = engine.getRegisters();
console.log(`  Registers: ${registers.join(', ')}\n`);

for (const reg of registers) {
  const example = engine.transform('good think', reg);
  console.log(`  ${reg.padEnd(12)} → "${example.transformed}"`);
}

// ============================================
// Summary
// ============================================
console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                     KEY INSIGHTS                               ║');
console.log('╠═══════════════════════════════════════════════════════════════╣');
console.log('║                                                               ║');
console.log('║  1. MEANING (primes) is universal and invariant               ║');
console.log('║     - Same [7,11,13] = "truth" in all registers               ║');
console.log('║                                                               ║');
console.log('║  2. WORDS are local and variable                              ║');
console.log('║     - "truth", "verity", "real talk" = same primes            ║');
console.log('║                                                               ║');
console.log('║  3. BIAS controls word selection                              ║');
console.log('║     - Register (formal/casual/technical/poetic)               ║');
console.log('║     - Context (academic, legal, romantic, etc.)               ║');
console.log('║     - Recency (variety vs. consistency)                       ║');
console.log('║                                                               ║');
console.log('║  4. This is how TRANSLATION should work:                      ║');
console.log('║     Word₁ → Primes → Word₂ (meaning-preserving)               ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');