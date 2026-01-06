/**
 * Example: Enochian Formal Language System
 *
 * Demonstrates the Enochian language system:
 * - 21-letter alphabet with prime mappings
 * - Prime basis PE = {7, 11, 13, 17, 19, 23, 29}
 * - Twist operations κ(p) = 360/p
 * - Core vocabulary and The 19 Calls
 * - Sedenion (16D) integration
 */

const {
    ENOCHIAN_ALPHABET,
    letterToPrime,
    primeToLetter,
    PRIME_BASIS,
    BASIS_MEANINGS,
    TWIST_MODES,
    twistAngle,
    twistRadians,
    TwistOperator,
    validateTwistClosure,
    EnochianWord,
    CORE_VOCABULARY,
    wordLookup,
    EnochianCall,
    THE_NINETEEN_CALLS,
    SedenionElement,
    EnochianEngine
} = require('../../apps/sentient/lib/enochian-vocabulary');

console.log('=== Enochian Formal Language System ===\n');

// ============================================================================
// 1. The Enochian Alphabet
// ============================================================================

console.log('1. THE ENOCHIAN ALPHABET (21 Letters)\n');

console.log('Letter | Name    | Prime | Meaning');
console.log('-------|---------|-------|-------------');
for (const entry of ENOCHIAN_ALPHABET.slice(0, 10)) {
    console.log(`   ${entry.letter}   | ${entry.name.padEnd(7)} | ${String(entry.prime).padStart(5)} | ${entry.meaning}`);
}
console.log('   ... (11 more letters)\n');

console.log('Letter → Prime mappings:');
console.log(`  A → ${letterToPrime.get('A')} (beginning)`);
console.log(`  D → ${letterToPrime.get('D')} (foundation)`);
console.log(`  E → ${letterToPrime.get('E')} (light)`);
console.log(`  Z → ${letterToPrime.get('Z')} (completion)`);

// ============================================================================
// 2. Prime Basis PE
// ============================================================================

console.log('\n2. PRIME BASIS PE = {7, 11, 13, 17, 19, 23, 29}\n');

console.log('The seven foundational primes and their meanings:');
for (const p of PRIME_BASIS) {
    console.log(`  ${p}: ${BASIS_MEANINGS.get(p)}`);
}

// ============================================================================
// 3. Twist Operations
// ============================================================================

console.log('\n3. TWIST OPERATIONS\n');

console.log('Twist angle κ(p) = 360°/p:\n');

const twistPrimes = [7, 11, 13, 17, 19, 23, 29];
for (const p of twistPrimes) {
    const angle = twistAngle(p);
    const radians = twistRadians(p);
    console.log(`  κ(${p.toString().padStart(2)}) = ${angle.toFixed(2)}° = ${radians.toFixed(4)} rad`);
}

// Twist operators
console.log('\nTwist operators:');
const twist7 = new TwistOperator(7);
const twist11 = new TwistOperator(11, TWIST_MODES.MU);

console.log(`  ${twist7.toString()}`);
console.log(`  ${twist11.toString()}`);

// 2D rotation
const rotated = twist7.apply2D(1, 0);
console.log(`\n  Applying twist(7) to (1, 0):`);
console.log(`    Result: (${rotated.x.toFixed(4)}, ${rotated.y.toFixed(4)})`);

// Twist closure validation
console.log('\nTwist closure validation:');
const closure1 = validateTwistClosure([7, 11, 13, 17, 19, 23, 29]);
console.log(`  PE basis total angle: ${closure1.totalAngle.toFixed(2)}°`);
console.log(`  Revolutions: ${closure1.revolutions}`);
console.log(`  Is closed: ${closure1.valid}`);

// ============================================================================
// 4. Enochian Words
// ============================================================================

console.log('\n4. ENOCHIAN WORDS\n');

// Create some words
const zacar = new EnochianWord('ZACAR', 'Move', { category: 'command' });
const zorge = new EnochianWord('ZORGE', 'Be friendly unto me', { category: 'invocation' });

console.log('Word: ZACAR (Move)');
console.log(`  Primes: [${zacar.primes.join(', ')}]`);
console.log(`  Product: ${zacar.primeProduct}`);
console.log(`  Twist sum: ${zacar.twistSum.toFixed(2)}°`);
console.log(`  Closure: ${JSON.stringify(zacar.getTwistClosure())}`);

console.log('\nWord: ZORGE (Be friendly unto me)');
console.log(`  Primes: [${zorge.primes.join(', ')}]`);
console.log(`  Product: ${zorge.primeProduct}`);
console.log(`  Twist sum: ${zorge.twistSum.toFixed(2)}°`);

// Resonance between words
const resonance = zacar.resonanceWith(zorge);
console.log('\nResonance between ZACAR and ZORGE:');
console.log(`  Shared primes: [${resonance.sharedPrimes.join(', ')}]`);
console.log(`  Resonance score: ${resonance.resonanceScore.toFixed(4)}`);
console.log(`  Harmonic ratio: ${resonance.harmonicRatio.toFixed(4)}`);

// ============================================================================
// 5. Core Vocabulary
// ============================================================================

console.log('\n5. CORE VOCABULARY\n');

console.log(`Total words in vocabulary: ${CORE_VOCABULARY.length}\n`);

console.log('Sample words by category:');
const categories = ['command', 'invocation', 'noun', 'verb', 'element'];
for (const cat of categories) {
    const words = CORE_VOCABULARY.filter(w => w.category === cat).slice(0, 2);
    if (words.length > 0) {
        console.log(`  ${cat}:`);
        for (const w of words) {
            console.log(`    ${w.word} - "${w.meaning}"`);
        }
    }
}

// ============================================================================
// 6. The 19 Calls
// ============================================================================

console.log('\n6. THE 19 CALLS (Keys)\n');

console.log(`Total calls: ${THE_NINETEEN_CALLS.length}\n`);

console.log('The 19 Calls:');
for (const call of THE_NINETEEN_CALLS.slice(0, 5)) {
    console.log(`  ${call.number}. ${call.name}`);
    console.log(`     Purpose: ${call.purpose}`);
}
console.log('  ... (14 more calls)\n');

// Call analysis
const call1 = THE_NINETEEN_CALLS[0];
console.log(`Analysis of Call 1 (${call1.name}):`);
console.log(`  Words: [${call1.words.join(', ')}]`);
console.log(`  Total primes: ${call1.getAllPrimes().length}`);
const callTwist = call1.getTotalTwist();
console.log(`  Total twist: ${callTwist.totalAngle.toFixed(2)}°`);
console.log(`  Signature: ${call1.getPrimeSignature()}`);

// ============================================================================
// 7. Sedenion Integration (16D)
// ============================================================================

console.log('\n7. SEDENION INTEGRATION (16D)\n');

// Create sedenion from word
const wordSed = SedenionElement.fromWord(zacar);
console.log('Sedenion from "ZACAR":');
console.log(`  Norm: ${wordSed.norm().toFixed(4)}`);
console.log(`  Components: [${wordSed.components.slice(0, 4).map(c => c.toFixed(4)).join(', ')}, ...]`);

// Sedenion operations
const sed1 = new SedenionElement([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const sed2 = new SedenionElement([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

console.log('\nSedenion operations:');
console.log(`  s1 = 1 (real unit)`);
console.log(`  s2 = e₁ (first imaginary unit)`);

const sum = sed1.add(sed2);
console.log(`  s1 + s2 = ${sum.toString()}`);

const conj = sed2.conjugate();
console.log(`  conj(s2) = ${conj.toString()}`);

// Twist in 16D
const twisted = wordSed.twist(7);
console.log('\nTwisting sedenion by prime 7:');
console.log(`  Original norm: ${wordSed.norm().toFixed(4)}`);
console.log(`  Twisted norm: ${twisted.norm().toFixed(4)}`);
console.log(`  Norm preserved: ${Math.abs(wordSed.norm() - twisted.norm()) < 0.0001}`);

// ============================================================================
// 8. Enochian Engine
// ============================================================================

console.log('\n8. ENOCHIAN ENGINE\n');

const engine = new EnochianEngine();

// Parse text
console.log('Parsing Enochian text:');
const parsed = engine.parse('OL SONF VORS GOHE');
console.log(`  Input: "OL SONF VORS GOHE"`);
console.log(`  Parsed words: ${parsed.length}`);
for (const word of parsed) {
    console.log(`    ${word.word} - "${word.meaning}"`);
}

// Prime signature
console.log('\nPrime signature:');
const sig = engine.primeSignature('ZACAR ZAMRAN');
console.log(`  "ZACAR ZAMRAN" → [${sig.join(', ')}]`);

// Convert to sedenion
console.log('\nSedenion representation:');
const sed = engine.toSedenion('ZACAR');
console.log(`  "ZACAR" → sedenion with norm ${sed.norm().toFixed(4)}`);

// Resonance between texts
console.log('\nResonance computation:');
const res = engine.resonance('ZACAR', 'ZORGE');
console.log(`  resonance("ZACAR", "ZORGE") = ${res.toFixed(4)}`);

// Execute a call
console.log('\nExecuting Call 1:');
const callResult = engine.executeCall(1);
console.log(`  Sedenion norm: ${callResult.norm.toFixed(4)}`);
console.log(`  Twist closure valid: ${callResult.twistClosure.valid}`);

// Basis decomposition
console.log('\nBasis decomposition:');
const decomp = engine.basisDecomposition('ZACAR ZORGE');
console.log(`  Basis counts: ${JSON.stringify(decomp.basisCounts)}`);
console.log(`  Basis ratio: ${(decomp.basisRatio * 100).toFixed(1)}%`);
console.log(`  Non-basis primes: [${decomp.nonBasisPrimes.join(', ')}]`);

// Find resonant words
console.log('\nFinding words resonant with prime 7:');
const resonant = engine.findResonantWords(7);
console.log(`  Found ${resonant.length} words containing prime 7`);
if (resonant.length > 0) {
    console.log(`  Examples: ${resonant.slice(0, 3).map(w => w.word).join(', ')}`);
}

console.log('\n=== Done ===');