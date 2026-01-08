/**
 * Bioinformatics Prime Encoding
 * 
 * Maps biological molecules to prime numbers following the tinyaleph paradigm.
 * 
 * Design principles:
 * - Nucleotides use small primes (2, 3, 5, 7, 11)
 * - Base pairing has prime product symmetry
 * - Amino acids map to primes 23-109
 * - Hydrophobicity correlates with prime magnitude
 */

// ============================================================================
// Nucleotide Prime Basis
// ============================================================================

/**
 * DNA nucleotide to prime mapping
 * - Purines (A, G): larger primes (7, 11)
 * - Pyrimidines (T, C): smaller primes (2, 3)
 * - Watson-Crick pairs have symmetric products: A-T=14, G-C=33
 */
const NUCLEOTIDE_PRIMES = {
  'A': 7,   // Adenine (purine)
  'T': 2,   // Thymine (pyrimidine) - pairs with A
  'G': 11,  // Guanine (purine)
  'C': 3,   // Cytosine (pyrimidine) - pairs with G
  'U': 5,   // Uracil (RNA) - replaces Thymine
  'N': 1,   // Unknown nucleotide (identity element)
};

/**
 * Reverse mapping: prime to nucleotide
 */
const PRIME_TO_NUCLEOTIDE = {
  7: 'A',
  2: 'T',
  11: 'G',
  3: 'C',
  5: 'U',
  1: 'N',
};

/**
 * Complement mapping for DNA
 */
const DNA_COMPLEMENTS = {
  'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'N': 'N'
};

/**
 * Complement mapping in prime space
 */
const PRIME_COMPLEMENTS = {
  7: 2,   // A → T
  2: 7,   // T → A
  11: 3,  // G → C
  3: 11,  // C → G
  5: 7,   // U → A (RNA)
  1: 1,   // N → N
};

// ============================================================================
// Amino Acid Prime Basis
// ============================================================================

/**
 * Amino acid to prime mapping
 * 
 * Properties encoded by prime magnitude:
 * - Smaller primes (23-43): Hydrophobic/nonpolar
 * - Medium primes (47-79): Aromatic/Polar
 * - Larger primes (83-107): Charged
 */
const AMINO_ACID_PRIMES = {
  // Nonpolar, aliphatic (hydrophobic core formers)
  'G': 23,  // Glycine - simplest, flexible
  'A': 29,  // Alanine - small hydrophobic
  'V': 31,  // Valine - branched hydrophobic
  'L': 37,  // Leucine - branched hydrophobic
  'I': 41,  // Isoleucine - branched hydrophobic
  'M': 43,  // Methionine - sulfur-containing
  
  // Aromatic (ring structures)
  'F': 47,  // Phenylalanine - benzene ring
  'W': 53,  // Tryptophan - largest, indole ring
  'Y': 59,  // Tyrosine - phenol ring
  
  // Polar, uncharged (hydrogen bonding)
  'S': 61,  // Serine - hydroxyl group
  'T': 67,  // Threonine - hydroxyl group
  'C': 71,  // Cysteine - thiol, disulfide bonds
  'N': 73,  // Asparagine - amide group
  'Q': 79,  // Glutamine - amide group
  
  // Positively charged (basic)
  'K': 83,  // Lysine - amino group
  'R': 89,  // Arginine - guanidinium group
  'H': 97,  // Histidine - imidazole ring
  
  // Negatively charged (acidic)
  'D': 101, // Aspartic acid - carboxyl
  'E': 103, // Glutamic acid - carboxyl
  
  // Special
  'P': 107, // Proline - cyclic, helix breaker
  
  // Stop codon
  '*': 109, // Stop signal
  
  // Unknown
  'X': 113, // Unknown amino acid
};

/**
 * Reverse mapping: prime to amino acid
 */
const PRIME_TO_AMINO_ACID = Object.fromEntries(
  Object.entries(AMINO_ACID_PRIMES).map(([aa, p]) => [p, aa])
);

/**
 * Amino acid properties for physics calculations
 */
const AMINO_ACID_PROPERTIES = {
  'G': { hydrophobicity: 0.0, charge: 0, mass: 57.05, volume: 60.1 },
  'A': { hydrophobicity: 1.8, charge: 0, mass: 71.08, volume: 88.6 },
  'V': { hydrophobicity: 4.2, charge: 0, mass: 99.13, volume: 140.0 },
  'L': { hydrophobicity: 3.8, charge: 0, mass: 113.16, volume: 166.7 },
  'I': { hydrophobicity: 4.5, charge: 0, mass: 113.16, volume: 166.7 },
  'M': { hydrophobicity: 1.9, charge: 0, mass: 131.20, volume: 162.9 },
  'F': { hydrophobicity: 2.8, charge: 0, mass: 147.18, volume: 189.9 },
  'W': { hydrophobicity: -0.9, charge: 0, mass: 186.21, volume: 227.8 },
  'Y': { hydrophobicity: -1.3, charge: 0, mass: 163.18, volume: 193.6 },
  'S': { hydrophobicity: -0.8, charge: 0, mass: 87.08, volume: 89.0 },
  'T': { hydrophobicity: -0.7, charge: 0, mass: 101.11, volume: 116.1 },
  'C': { hydrophobicity: 2.5, charge: 0, mass: 103.14, volume: 108.5 },
  'N': { hydrophobicity: -3.5, charge: 0, mass: 114.10, volume: 114.1 },
  'Q': { hydrophobicity: -3.5, charge: 0, mass: 128.13, volume: 143.8 },
  'K': { hydrophobicity: -3.9, charge: 1, mass: 128.17, volume: 168.6 },
  'R': { hydrophobicity: -4.5, charge: 1, mass: 156.19, volume: 173.4 },
  'H': { hydrophobicity: -3.2, charge: 0.5, mass: 137.14, volume: 153.2 },
  'D': { hydrophobicity: -3.5, charge: -1, mass: 115.09, volume: 111.1 },
  'E': { hydrophobicity: -3.5, charge: -1, mass: 129.12, volume: 138.4 },
  'P': { hydrophobicity: -1.6, charge: 0, mass: 97.12, volume: 112.7 },
};

// ============================================================================
// Codon Encoding
// ============================================================================

/**
 * Encode a codon as a unique prime signature
 * Uses position-weighted scheme: p1 + p2*100 + p3*10000
 */
function encodeCodon(codon) {
  if (codon.length !== 3) {
    throw new Error(`Codon must be 3 nucleotides, got: ${codon}`);
  }
  
  const n1 = NUCLEOTIDE_PRIMES[codon[0].toUpperCase()];
  const n2 = NUCLEOTIDE_PRIMES[codon[1].toUpperCase()];
  const n3 = NUCLEOTIDE_PRIMES[codon[2].toUpperCase()];
  
  if (n1 === undefined || n2 === undefined || n3 === undefined) {
    throw new Error(`Invalid codon: ${codon}`);
  }
  
  return n1 + (n2 * 100) + (n3 * 10000);
}

/**
 * Decode a codon prime signature back to nucleotides
 */
function decodeCodon(signature) {
  const n3 = Math.floor(signature / 10000);
  const remainder = signature % 10000;
  const n2 = Math.floor(remainder / 100);
  const n1 = remainder % 100;
  
  return (PRIME_TO_NUCLEOTIDE[n1] || '?') +
         (PRIME_TO_NUCLEOTIDE[n2] || '?') +
         (PRIME_TO_NUCLEOTIDE[n3] || '?');
}

// ============================================================================
// Encoding Functions
// ============================================================================

/**
 * Encode DNA sequence to prime array
 */
function encodeDNA(sequence) {
  return sequence.toUpperCase().split('')
    .filter(c => NUCLEOTIDE_PRIMES[c] !== undefined)
    .map(c => NUCLEOTIDE_PRIMES[c]);
}

/**
 * Decode prime array to DNA sequence
 */
function decodeDNA(primes) {
  return primes.map(p => PRIME_TO_NUCLEOTIDE[p] || '?').join('');
}

/**
 * Encode RNA sequence to prime array
 */
function encodeRNA(sequence) {
  return sequence.toUpperCase().split('')
    .filter(c => c === 'A' || c === 'U' || c === 'G' || c === 'C')
    .map(c => NUCLEOTIDE_PRIMES[c]);
}

/**
 * Decode prime array to RNA sequence
 */
function decodeRNA(primes) {
  return primes.map(p => {
    if (p === 2) return 'U'; // T in DNA → U in RNA
    return PRIME_TO_NUCLEOTIDE[p] || '?';
  }).join('');
}

/**
 * Encode protein sequence to prime array
 */
function encodeProtein(sequence) {
  return sequence.toUpperCase().split('')
    .filter(c => AMINO_ACID_PRIMES[c] !== undefined)
    .map(c => AMINO_ACID_PRIMES[c]);
}

/**
 * Decode prime array to protein sequence
 */
function decodeProtein(primes) {
  return primes.map(p => PRIME_TO_AMINO_ACID[p] || '?').join('');
}

/**
 * Detect sequence type from content
 */
function detectSequenceType(sequence) {
  const clean = sequence.replace(/[\s\n>]/g, '').toUpperCase();
  
  // Check for FASTA header
  if (sequence.trim().startsWith('>')) return 'FASTA';
  
  // Pure DNA
  if (/^[ATGCN]+$/.test(clean)) return 'DNA';
  
  // RNA (has U)
  if (/^[AUGCN]+$/.test(clean) && clean.includes('U')) return 'RNA';
  
  // Protein (has amino acid letters not in DNA)
  if (/^[ACDEFGHIKLMNPQRSTVWYX\*]+$/.test(clean)) return 'PROTEIN';
  
  // Ambiguous
  return 'UNKNOWN';
}

/**
 * Parse FASTA format
 */
function parseFASTA(input) {
  const lines = input.split('\n');
  const entries = [];
  let current = null;
  
  for (const line of lines) {
    if (line.startsWith('>')) {
      if (current) entries.push(current);
      current = { header: line.slice(1).trim(), sequence: '' };
    } else if (current) {
      current.sequence += line.trim();
    }
  }
  
  if (current) entries.push(current);
  return entries;
}

/**
 * Get properties for an amino acid
 */
function getAminoAcidProperties(aa) {
  return AMINO_ACID_PROPERTIES[aa.toUpperCase()] || null;
}

/**
 * Get charge from amino acid prime
 */
function getChargeFromPrime(prime) {
  const aa = PRIME_TO_AMINO_ACID[prime];
  if (!aa) return 0;
  return AMINO_ACID_PROPERTIES[aa]?.charge || 0;
}

/**
 * Get hydrophobicity from amino acid prime
 */
function getHydrophobicityFromPrime(prime) {
  const aa = PRIME_TO_AMINO_ACID[prime];
  if (!aa) return 0;
  return AMINO_ACID_PROPERTIES[aa]?.hydrophobicity || 0;
}

module.exports = {
  // Nucleotide mappings
  NUCLEOTIDE_PRIMES,
  PRIME_TO_NUCLEOTIDE,
  DNA_COMPLEMENTS,
  PRIME_COMPLEMENTS,
  
  // Amino acid mappings
  AMINO_ACID_PRIMES,
  PRIME_TO_AMINO_ACID,
  AMINO_ACID_PROPERTIES,
  
  // Codon functions
  encodeCodon,
  decodeCodon,
  
  // Sequence encoding/decoding
  encodeDNA,
  decodeDNA,
  encodeRNA,
  decodeRNA,
  encodeProtein,
  decodeProtein,
  
  // Utilities
  detectSequenceType,
  parseFASTA,
  getAminoAcidProperties,
  getChargeFromPrime,
  getHydrophobicityFromPrime,
};