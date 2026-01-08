/**
 * @example Molecular Binding
 * @description Analyze molecular binding affinity using spectral coherence
 * 
 * This example demonstrates how TinyAleph calculates binding affinity
 * between molecules using spectral coherence of their hypercomplex states.
 * Higher coherence = stronger binding affinity.
 */

const { BioinformaticsBackend } = require('../../modular');

// Import encoding functions directly for protein encoding
const encoding = require('../../backends/bioinformatics/encoding');

// ===========================================
// SETUP
// ===========================================

const backend = new BioinformaticsBackend();

// ===========================================
// SEQUENCE SIMILARITY
// ===========================================

console.log('TinyAleph Molecular Binding Example');
console.log('====================================\n');

console.log('SEQUENCE SIMILARITY ANALYSIS');
console.log('----------------------------\n');

// Compare similar and different sequences
const sequences = [
    { name: 'Seq A', seq: 'ATGCATGC' },
    { name: 'Seq B', seq: 'ATGCATGC' },  // Identical to A
    { name: 'Seq C', seq: 'ATGGATGC' },  // One mutation from A
    { name: 'Seq D', seq: 'TACGTACG' },  // Complement of A
    { name: 'Seq E', seq: 'GGGGCCCC' },  // Completely different
];

// Encode all sequences
const states = sequences.map(s => ({
    ...s,
    primes: backend.encode(s.seq),
    state: backend.primesToState(backend.encode(s.seq))
}));

console.log('Sequences:');
sequences.forEach(s => console.log(`  ${s.name}: ${s.seq}`));

console.log('\nSimilarity Matrix (based on sequence similarity):');
console.log('         ' + sequences.map(s => s.name.padEnd(7)).join(''));
console.log('         ' + sequences.map(() => '-------').join(''));

for (let i = 0; i < states.length; i++) {
    let row = states[i].name + ': ';
    for (let j = 0; j < states.length; j++) {
        const sim = backend.similarity(states[i].primes, states[j].primes);
        row += (typeof sim === 'number' ? Math.abs(sim).toFixed(3) : 'N/A').padEnd(8);
    }
    console.log(row);
}

// ===========================================
// PROTEIN-DNA BINDING
// ===========================================

console.log('\n\nPROTEIN-DNA BINDING AFFINITY');
console.log('----------------------------\n');

// Define a DNA binding site and different proteins
const dnaBindingSite = 'ATGCATGC';

// Proteins with different binding preferences (simplified)
const proteins = [
    { name: 'Protein 1', seq: 'MHLA' },   // Hypothetical DNA-binding protein
    { name: 'Protein 2', seq: 'WFIV' },   // Hydrophobic - unlikely to bind DNA
    { name: 'Protein 3', seq: 'KRKR' },   // Positively charged - binds DNA backbone
];

console.log('DNA Binding Site:', dnaBindingSite);
console.log('\nProtein Binding Affinities:');

const dnaPrimes = backend.encode(dnaBindingSite);

for (const protein of proteins) {
    // Encode protein using the encoding module
    const proteinPrimes = encoding.encodeProtein(protein.seq);
    const result = backend.bindingAffinity(dnaPrimes, proteinPrimes);
    const affinity = result.affinity || result;
    
    // Classify affinity
    let classification;
    const absAffinity = Math.abs(affinity);
    if (absAffinity > 0.5) classification = 'Strong';
    else if (absAffinity > 0.2) classification = 'Moderate';
    else classification = 'Weak';
    
    console.log(`\n  ${protein.name} (${protein.seq}):`);
    console.log(`    Affinity score: ${(typeof affinity === 'number' ? affinity : 0).toFixed(4)}`);
    console.log(`    Classification: ${classification}`);
    if (result.goldenPairs) {
        console.log(`    Golden pairs: ${result.goldenPairs}`);
    }
}

// ===========================================
// COMPLEMENTARY STRAND BINDING
// ===========================================

console.log('\n\nCOMPLEMENTARY STRAND BINDING');
console.log('-----------------------------\n');

const strand1 = 'ATGCATGC';
const COMPLEMENT = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
const complement = strand1.split('').map(b => COMPLEMENT[b]).join('');
const mismatch = 'TACGAAAA';  // Partial mismatch

console.log('Template strand:    ', strand1);
console.log('True complement:    ', complement);
console.log('Mismatched strand:  ', mismatch);

const templatePrimes = backend.encode(strand1);
const complementPrimes = backend.encode(complement);
const mismatchPrimes = backend.encode(mismatch);

const perfectResult = backend.bindingAffinity(templatePrimes, complementPrimes);
const imperfectResult = backend.bindingAffinity(templatePrimes, mismatchPrimes);

const perfectBinding = perfectResult.affinity || perfectResult;
const imperfectBinding = imperfectResult.affinity || imperfectResult;

console.log('\nBinding affinities:');
console.log(`  Perfect complement: ${(typeof perfectBinding === 'number' ? perfectBinding : 0).toFixed(4)}`);
console.log(`  Mismatched strand:  ${(typeof imperfectBinding === 'number' ? imperfectBinding : 0).toFixed(4)}`);

// ===========================================
// DRUG-TARGET INTERACTION (CONCEPTUAL)
// ===========================================

console.log('\n\nDRUG-TARGET INTERACTION MODEL');
console.log('------------------------------\n');

// Model a drug molecule as a short peptide
const targetProtein = 'MWLKFVIER';
const drugs = [
    { name: 'Drug A', seq: 'FW' },   // Aromatic - may bind hydrophobic pocket
    { name: 'Drug B', seq: 'KR' },   // Charged - binds surface
    { name: 'Drug C', seq: 'LI' },   // Hydrophobic - binds core
];

console.log('Target protein:', targetProtein);
console.log('\nDrug screening results:');

const targetPrimes = encoding.encodeProtein(targetProtein);

for (const drug of drugs) {
    const drugPrimes = encoding.encodeProtein(drug.seq);
    const result = backend.bindingAffinity(targetPrimes, drugPrimes);
    const score = result.affinity || result;
    
    let verdict;
    const absScore = Math.abs(typeof score === 'number' ? score : 0);
    if (absScore > 0.4) verdict = '★★★ Lead candidate';
    else if (absScore > 0.2) verdict = '★★  Further study';
    else verdict = '★   Low priority';
    
    console.log(`\n  ${drug.name} (${drug.seq}):`);
    console.log(`    Binding score: ${(typeof score === 'number' ? score : 0).toFixed(4)}`);
    console.log(`    Verdict: ${verdict}`);
    if (result.interactions) {
        console.log(`    Interactions: ${result.interactions.length}`);
    }
}

// ===========================================
// BINDING MECHANICS
// ===========================================

console.log('\n\nBINDING MECHANICS (Prime Resonance)');
console.log('------------------------------------\n');

console.log('How binding affinity is calculated:');
console.log('');
console.log('  1. Each molecule encoded as hypercomplex state');
console.log('     - Nucleotides/amino acids → prime numbers');
console.log('     - Primes → oscillator frequencies');
console.log('     - Frequencies → sedenion components');
console.log('');
console.log('  2. Binding affinity = spectral coherence');
console.log('     - Inner product of normalized states');
console.log('     - Higher coherence = more resonance');
console.log('     - Resonance implies favorable interaction');
console.log('');
console.log('  3. Physical interpretation:');
console.log('     - Shape complementarity → frequency matching');
console.log('     - Electrostatic fit → prime product harmony');
console.log('     - Hydrophobic matching → low-frequency resonance');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n====================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Binding affinity modeled as spectral coherence');
console.log('2. Complementary sequences show high coherence');
console.log('3. Can screen for protein-DNA and drug-target interactions');
console.log('4. Prime resonance captures molecular compatibility');
console.log('5. Simple model captures key binding principles');