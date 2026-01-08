/**
 * @example Central Dogma
 * @description DNA → RNA → Protein: The molecular biology central dogma
 * 
 * This example demonstrates how TinyAleph models the central dogma
 * of molecular biology as entropy-reducing transforms:
 *   1. Transcription: DNA → mRNA (T→U substitution)
 *   2. Translation: mRNA → Protein (codon→amino acid)
 * 
 * Each step reduces entropy by collapsing possibility space.
 */

const { BioinformaticsBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new BioinformaticsBackend();

// A sample gene: Start codon (ATG) + coding sequence + Stop codon (TAA)
const gene = 'ATGCATGCATACTAA';

// ===========================================
// TRANSCRIPTION: DNA → mRNA
// ===========================================

console.log('TinyAleph Central Dogma Example');
console.log('================================\n');

console.log('STEP 1: TRANSCRIPTION (DNA → mRNA)');
console.log('----------------------------------\n');

console.log('DNA Template: 5\'-' + gene + '-3\'');

// Encode DNA to primes
const dnaPrimes = backend.encode(gene);

// Transcribe using the backend's transcription operator
const transcribeResult = backend.transcribe(dnaPrimes, { force: true });
const mRNAPrimes = transcribeResult.success ? transcribeResult.rna : dnaPrimes;

// Decode mRNA back to sequence
const mRNA = backend.decode(mRNAPrimes);

console.log('mRNA Strand:  5\'-' + mRNA + '-3\'');
console.log('\nTransform: T (Thymine) → U (Uracil)');

// Show the substitution
let changes = [];
for (let i = 0; i < gene.length; i++) {
    if (gene[i] === 'T' && mRNA[i] === 'U') {
        changes.push(i);
    }
}
console.log('Substitutions at positions:', changes.join(', '));

// ===========================================
// TRANSLATION: mRNA → Protein
// ===========================================

console.log('\n\nSTEP 2: TRANSLATION (mRNA → Protein)');
console.log('-------------------------------------\n');

// Extract codons from mRNA
const codons = [];
for (let i = 0; i < mRNA.length - 2; i += 3) {
    codons.push(mRNA.slice(i, i + 3));
}
console.log('Codons:', codons.join(' | '));

// Translate mRNA to protein using the backend
const translateResult = backend.translate(mRNAPrimes);
const proteinPrimes = translateResult.success ? translateResult.protein : [];
const protein = backend.decode(proteinPrimes);

console.log('Amino Acids:', protein.split('').join(' | '));

console.log('\nCodon → Amino Acid mapping:');
for (let i = 0; i < codons.length; i++) {
    const aa = protein[i] || '*';
    const aaName = {
        'M': 'Methionine (Start)',
        'H': 'Histidine',
        'A': 'Alanine', 
        'Y': 'Tyrosine',
        '*': 'Stop'
    }[aa] || aa;
    console.log(`  ${codons[i]} → ${aa} (${aaName})`);
}

// ===========================================
// GENE EXPRESSION: Full Pipeline
// ===========================================

console.log('\n\nFULL GENE EXPRESSION');
console.log('--------------------\n');

// Use the express() function to go from DNA directly to protein
const expressResult = backend.express(dnaPrimes);
const expressedProtein = expressResult.success ? expressResult.sequence : '';

console.log('DNA:', gene);
console.log('        ↓ (transcription)');
console.log('mRNA:', mRNA);
console.log('        ↓ (translation)');
console.log('Protein:', expressedProtein || '[No protein - no start codon found]');

// ===========================================
// ENTROPY ANALYSIS
// ===========================================

console.log('\n\nENTROPY REDUCTION ANALYSIS');
console.log('--------------------------\n');

// Calculate effective entropy at each step
const dnaEntropy = gene.length * Math.log2(4);  // 4 possible nucleotides
const rnaEntropy = mRNA.length * Math.log2(4);  // 4 possible nucleotides
const proteinLength = expressedProtein ? expressedProtein.length : 0;
const proteinEntropy = proteinLength * Math.log2(20);  // 20 amino acids

console.log('Information content:');
console.log(`  DNA:     ${gene.length} nucleotides × 2 bits = ${dnaEntropy.toFixed(1)} bits`);
console.log(`  mRNA:    ${mRNA.length} nucleotides × 2 bits = ${rnaEntropy.toFixed(1)} bits`);
console.log(`  Protein: ${proteinLength} amino acids × 4.32 bits = ${proteinEntropy.toFixed(1)} bits`);

if (proteinLength > 0) {
    const compression = (1 - proteinEntropy / dnaEntropy) * 100;
    console.log(`\nEffective compression: ${compression.toFixed(1)}%`);
    console.log('Translation reduces entropy by mapping 64 codons → 20 amino acids');
}

// ===========================================
// PRIME ENCODING VIEW
// ===========================================

console.log('\n\nPRIME ENCODING VIEW');
console.log('-------------------\n');

const dnaState = backend.primesToState(dnaPrimes);
const rnaState = backend.primesToState(mRNAPrimes);

console.log('Hypercomplex state norms:');
console.log(`  DNA:     ${dnaState.norm().toFixed(4)}`);
console.log(`  mRNA:    ${rnaState.norm().toFixed(4)}`);

if (proteinPrimes.length > 0) {
    const proteinState = backend.primesToState(proteinPrimes);
    console.log(`  Protein: ${proteinState.norm().toFixed(4)}`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Transcription: DNA→mRNA is a T→U substitution transform');
console.log('2. Translation: mRNA→Protein is codon→amino acid mapping');
console.log('3. Each step is entropy-reducing (collapses possibility space)');
console.log('4. 64 codons encode 20 amino acids + stop (redundancy)');
console.log('5. Prime encoding preserves information through transforms');