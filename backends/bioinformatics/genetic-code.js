/**
 * Genetic Code - Codon to Amino Acid Translation
 * 
 * The universal genetic code mapping 64 codons to 20 amino acids + stop.
 * Also includes alternative genetic codes for mitochondria and other organisms.
 */

// ============================================================================
// Standard Genetic Code
// ============================================================================

/**
 * Standard (universal) genetic code
 * Maps RNA codons to single-letter amino acid codes
 */
const STANDARD_GENETIC_CODE = {
  // UUX codons
  'UUU': 'F', 'UUC': 'F',  // Phenylalanine
  'UUA': 'L', 'UUG': 'L',  // Leucine
  
  // UCX codons
  'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',  // Serine
  
  // UAX codons
  'UAU': 'Y', 'UAC': 'Y',  // Tyrosine
  'UAA': '*', 'UAG': '*',  // Stop (Ochre, Amber)
  
  // UGX codons
  'UGU': 'C', 'UGC': 'C',  // Cysteine
  'UGA': '*',              // Stop (Opal)
  'UGG': 'W',              // Tryptophan
  
  // CUX codons
  'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',  // Leucine
  
  // CCX codons
  'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',  // Proline
  
  // CAX codons
  'CAU': 'H', 'CAC': 'H',  // Histidine
  'CAA': 'Q', 'CAG': 'Q',  // Glutamine
  
  // CGX codons
  'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',  // Arginine
  
  // AUX codons
  'AUU': 'I', 'AUC': 'I', 'AUA': 'I',  // Isoleucine
  'AUG': 'M',                           // Methionine (START)
  
  // ACX codons
  'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',  // Threonine
  
  // AAX codons
  'AAU': 'N', 'AAC': 'N',  // Asparagine
  'AAA': 'K', 'AAG': 'K',  // Lysine
  
  // AGX codons
  'AGU': 'S', 'AGC': 'S',  // Serine
  'AGA': 'R', 'AGG': 'R',  // Arginine
  
  // GUX codons
  'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',  // Valine
  
  // GCX codons
  'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',  // Alanine
  
  // GAX codons
  'GAU': 'D', 'GAC': 'D',  // Aspartic acid
  'GAA': 'E', 'GAG': 'E',  // Glutamic acid
  
  // GGX codons
  'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',  // Glycine
};

/**
 * Vertebrate mitochondrial genetic code
 * Differs from standard in UGA=W, AGA/AGG=*, AUA=M
 */
const VERTEBRATE_MITOCHONDRIAL_CODE = {
  ...STANDARD_GENETIC_CODE,
  'UGA': 'W',  // Tryptophan instead of Stop
  'AGA': '*',  // Stop instead of Arginine
  'AGG': '*',  // Stop instead of Arginine
  'AUA': 'M',  // Methionine instead of Isoleucine
};

/**
 * Yeast mitochondrial genetic code
 */
const YEAST_MITOCHONDRIAL_CODE = {
  ...STANDARD_GENETIC_CODE,
  'UGA': 'W',
  'CUU': 'T', 'CUC': 'T', 'CUA': 'T', 'CUG': 'T',  // Threonine
  'AUA': 'M',
};

// ============================================================================
// Codon Properties
// ============================================================================

/**
 * Start codons by genetic code
 */
const START_CODONS = {
  standard: ['AUG'],
  vertebrate_mitochondrial: ['AUG', 'AUA', 'AUU'],
  bacterial: ['AUG', 'GUG', 'UUG'],
};

/**
 * Stop codons by genetic code
 */
const STOP_CODONS = {
  standard: ['UAA', 'UAG', 'UGA'],
  vertebrate_mitochondrial: ['UAA', 'UAG', 'AGA', 'AGG'],
};

/**
 * Codon usage frequency table (E. coli)
 * Values are relative frequencies (0-1)
 */
const CODON_USAGE_ECOLI = {
  'UUU': 0.58, 'UUC': 0.42, 'UUA': 0.14, 'UUG': 0.13,
  'UCU': 0.17, 'UCC': 0.15, 'UCA': 0.14, 'UCG': 0.14,
  'UAU': 0.59, 'UAC': 0.41, 'UAA': 0.61, 'UAG': 0.09,
  'UGU': 0.46, 'UGC': 0.54, 'UGA': 0.30, 'UGG': 1.00,
  'CUU': 0.12, 'CUC': 0.10, 'CUA': 0.04, 'CUG': 0.47,
  'CCU': 0.18, 'CCC': 0.13, 'CCA': 0.20, 'CCG': 0.49,
  'CAU': 0.57, 'CAC': 0.43, 'CAA': 0.34, 'CAG': 0.66,
  'CGU': 0.36, 'CGC': 0.36, 'CGA': 0.07, 'CGG': 0.11,
  'AUU': 0.49, 'AUC': 0.39, 'AUA': 0.11, 'AUG': 1.00,
  'ACU': 0.19, 'ACC': 0.40, 'ACA': 0.17, 'ACG': 0.25,
  'AAU': 0.49, 'AAC': 0.51, 'AAA': 0.74, 'AAG': 0.26,
  'AGU': 0.16, 'AGC': 0.25, 'AGA': 0.07, 'AGG': 0.04,
  'GUU': 0.28, 'GUC': 0.20, 'GUA': 0.15, 'GUG': 0.37,
  'GCU': 0.18, 'GCC': 0.26, 'GCA': 0.23, 'GCG': 0.33,
  'GAU': 0.63, 'GAC': 0.37, 'GAA': 0.68, 'GAG': 0.32,
  'GGU': 0.35, 'GGC': 0.37, 'GGA': 0.13, 'GGG': 0.15,
};

// ============================================================================
// Codon Functions
// ============================================================================

/**
 * Get amino acid from codon
 */
function translateCodon(codon, geneticCode = STANDARD_GENETIC_CODE) {
  const normalized = codon.toUpperCase().replace(/T/g, 'U');
  return geneticCode[normalized] || '?';
}

/**
 * Get all codons for an amino acid (degeneracy)
 */
function getCodonsForAminoAcid(aa, geneticCode = STANDARD_GENETIC_CODE) {
  return Object.entries(geneticCode)
    .filter(([_, aminoAcid]) => aminoAcid === aa.toUpperCase())
    .map(([codon, _]) => codon);
}

/**
 * Get degeneracy (number of codons) for amino acid
 */
function getCodonDegeneracy(aa, geneticCode = STANDARD_GENETIC_CODE) {
  return getCodonsForAminoAcid(aa, geneticCode).length;
}

/**
 * Check if codon is a start codon
 */
function isStartCodon(codon, codeType = 'standard') {
  const normalized = codon.toUpperCase().replace(/T/g, 'U');
  return START_CODONS[codeType]?.includes(normalized) || false;
}

/**
 * Check if codon is a stop codon
 */
function isStopCodon(codon, geneticCode = STANDARD_GENETIC_CODE) {
  const normalized = codon.toUpperCase().replace(/T/g, 'U');
  return geneticCode[normalized] === '*';
}

/**
 * Calculate GC content of a sequence
 */
function calculateGCContent(sequence) {
  const clean = sequence.toUpperCase();
  const gc = (clean.match(/[GC]/g) || []).length;
  return gc / clean.length;
}

/**
 * Calculate codon adaptation index (CAI)
 */
function calculateCAI(sequence, usageTable = CODON_USAGE_ECOLI) {
  const codons = [];
  const rna = sequence.toUpperCase().replace(/T/g, 'U');
  
  for (let i = 0; i < rna.length - 2; i += 3) {
    codons.push(rna.slice(i, i + 3));
  }
  
  // Calculate geometric mean of relative adaptiveness
  let sumLog = 0;
  let count = 0;
  
  for (const codon of codons) {
    const freq = usageTable[codon];
    if (freq && freq > 0) {
      sumLog += Math.log(freq);
      count++;
    }
  }
  
  return count > 0 ? Math.exp(sumLog / count) : 0;
}

/**
 * Synonymous codon substitution possibilities
 */
function getSynonymousCodons(codon, geneticCode = STANDARD_GENETIC_CODE) {
  const aa = translateCodon(codon, geneticCode);
  if (aa === '?' || aa === '*') return [];
  
  return getCodonsForAminoAcid(aa, geneticCode)
    .filter(c => c !== codon.toUpperCase().replace(/T/g, 'U'));
}

/**
 * Classify mutation effect
 */
function classifyMutation(originalCodon, mutatedCodon, geneticCode = STANDARD_GENETIC_CODE) {
  const original = originalCodon.toUpperCase().replace(/T/g, 'U');
  const mutated = mutatedCodon.toUpperCase().replace(/T/g, 'U');
  
  const originalAA = geneticCode[original];
  const mutatedAA = geneticCode[mutated];
  
  if (!originalAA || !mutatedAA) return 'unknown';
  if (originalAA === mutatedAA) return 'synonymous';
  if (mutatedAA === '*') return 'nonsense';
  if (originalAA === '*') return 'readthrough';
  return 'missense';
}

module.exports = {
  // Genetic codes
  STANDARD_GENETIC_CODE,
  VERTEBRATE_MITOCHONDRIAL_CODE,
  YEAST_MITOCHONDRIAL_CODE,
  
  // Codon lists
  START_CODONS,
  STOP_CODONS,
  CODON_USAGE_ECOLI,
  
  // Functions
  translateCodon,
  getCodonsForAminoAcid,
  getCodonDegeneracy,
  isStartCodon,
  isStopCodon,
  calculateGCContent,
  calculateCAI,
  getSynonymousCodons,
  classifyMutation,
};