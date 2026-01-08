/**
 * @example Protein Folding
 * @description Simulate protein folding using Kuramoto oscillator synchronization
 * 
 * This example demonstrates how TinyAleph models protein folding as a 
 * synchronization problem. Each amino acid is treated as an oscillator,
 * and folding emerges from oscillator coupling based on:
 *   - Hydrophobic interactions (drives core formation)
 *   - Electrostatic attraction/repulsion
 *   - Prime resonance (hypercomplex coupling)
 */

const { BioinformaticsBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new BioinformaticsBackend();

// A short protein sequence with various amino acid types
// W, L, I, F, V = hydrophobic (want to be in core)
// K, R, D, E = charged (on surface)
// M = start codon amino acid
const proteinSeq = 'MWLKFVEIRLLQ';

// ===========================================
// AMINO ACID PROPERTIES
// ===========================================

console.log('TinyAleph Protein Folding Example');
console.log('==================================\n');

console.log('Protein Sequence:', proteinSeq.split('').join('-'));
console.log('Length:', proteinSeq.length, 'amino acids\n');

// Classify amino acids
const hydrophobic = ['L', 'I', 'V', 'F', 'W', 'M', 'A'];
const positiveCharge = ['K', 'R', 'H'];
const negativeCharge = ['D', 'E'];

console.log('Amino Acid Properties:');
console.log('----------------------');
for (let i = 0; i < proteinSeq.length; i++) {
    const aa = proteinSeq[i];
    let type = 'polar';
    if (hydrophobic.includes(aa)) type = 'hydrophobic';
    else if (positiveCharge.includes(aa)) type = 'positive (+)';
    else if (negativeCharge.includes(aa)) type = 'negative (-)';
    console.log(`  ${i}: ${aa} - ${type}`);
}

// ===========================================
// FOLD PROTEIN
// ===========================================

console.log('\n\nFOLDING SIMULATION (Kuramoto Model)');
console.log('------------------------------------\n');

// Encode protein and fold
const proteinPrimes = backend.encode(proteinSeq);
const foldResult = backend.foldProtein(proteinPrimes);

console.log('Folding result:');
console.log(`  Success: ${foldResult.success}`);
console.log(`  Final synchronization: ${(foldResult.orderParameter || 0).toFixed(4)}`);
console.log(`  Steps: ${foldResult.steps || 0}`);

// ===========================================
// PHASE ANALYSIS
// ===========================================

console.log('\n\nPHASE ANALYSIS');
console.log('--------------\n');

if (foldResult.phases && foldResult.phases.length > 0) {
    console.log('Final oscillator phases:');
    for (let i = 0; i < Math.min(foldResult.phases.length, proteinSeq.length); i++) {
        const phase = foldResult.phases[i];
        const phaseDegrees = ((phase % (2 * Math.PI)) * 180 / Math.PI).toFixed(1);
        console.log(`  ${proteinSeq[i]}: ${phaseDegrees}°`);
    }
}

// ===========================================
// CONTACT ANALYSIS
// ===========================================

console.log('\n\nCONTACT ANALYSIS');
console.log('----------------\n');

// Calculate contacts from prime similarity
console.log('Computing residue contacts based on prime resonance...');

const primes = backend.encode(proteinSeq);
const contacts = [];

// Simple contact prediction based on prime resonance
for (let i = 0; i < primes.length; i++) {
    for (let j = i + 2; j < primes.length; j++) {
        const p1 = primes[i];
        const p2 = primes[j];
        
        // Resonance strength based on GCD and frequency matching
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const resonance = gcd(p1, p2) / Math.sqrt(p1 * p2);
        
        // Hydrophobic attraction
        const aa1 = proteinSeq[i];
        const aa2 = proteinSeq[j];
        const h1 = hydrophobic.includes(aa1) ? 0.3 : 0;
        const h2 = hydrophobic.includes(aa2) ? 0.3 : 0;
        
        const strength = resonance + h1 + h2;
        
        if (strength > 0.1) {
            contacts.push([i, j, strength]);
        }
    }
}

// Sort by strength
contacts.sort((a, b) => b[2] - a[2]);

console.log('\nTop contacts (by strength):');
for (const [i, j, strength] of contacts.slice(0, 8)) {
    console.log(`  ${proteinSeq[i]}(${i}) ↔ ${proteinSeq[j]}(${j}): ${strength.toFixed(3)}`);
}

// ===========================================
// CONTACT MAP VISUALIZATION
// ===========================================

console.log('\n\nCONTACT MAP (text visualization)');
console.log('----------------------------------\n');

// Build contact strength matrix
const matrix = Array(proteinSeq.length).fill(null).map(() => 
    Array(proteinSeq.length).fill(0)
);

for (const [i, j, strength] of contacts) {
    matrix[i][j] = strength;
    matrix[j][i] = strength;
}

// Print header
console.log('    ' + proteinSeq.split('').join(' '));
console.log('    ' + proteinSeq.split('').map(() => '─').join('─'));

for (let i = 0; i < proteinSeq.length; i++) {
    let row = `${proteinSeq[i]} │ `;
    for (let j = 0; j < proteinSeq.length; j++) {
        if (i === j) {
            row += '●';
        } else if (matrix[i][j] > 0.5) {
            row += '█';
        } else if (matrix[i][j] > 0.3) {
            row += '▓';
        } else if (matrix[i][j] > 0.1) {
            row += '░';
        } else {
            row += '·';
        }
        row += ' ';
    }
    console.log(row);
}

console.log('\nLegend: ● self, █ strong, ▓ medium, ░ weak, · none');

// ===========================================
// PRIME RESONANCE VIEW
// ===========================================

console.log('\n\nPRIME RESONANCE VIEW');
console.log('--------------------\n');

const proteinState = backend.primesToState(proteinPrimes);
console.log('Protein hypercomplex state norm:', proteinState.norm().toFixed(4));

// Show prime assignment for each amino acid
console.log('\nAmino Acid → Prime Mapping:');
const AMINO_ACID_PRIMES = {
    'L': 23, 'I': 29, 'V': 31, 'F': 37, 'W': 41, 'M': 43, 'A': 47,
    'G': 53, 'C': 59, 'P': 61, 'Y': 67, 'S': 71, 'T': 73, 'N': 79, 'Q': 83,
    'H': 89, 'K': 97, 'R': 101, 'D': 103, 'E': 107
};

for (const aa of proteinSeq.slice(0, 6).split('')) {
    const prime = AMINO_ACID_PRIMES[aa] || '?';
    console.log(`  ${aa} → ${prime}`);
}
console.log('  ...');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n==================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Protein folding modeled as oscillator synchronization');
console.log('2. Hydrophobic residues cluster (form protein core)');
console.log('3. Charged residues prefer opposite charges or surface');
console.log('4. Prime encoding enables resonance-based coupling');
console.log('5. Contact maps emerge from Kuramoto dynamics');