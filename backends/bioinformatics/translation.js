/**
 * Translation Operator - RNA → Protein
 * 
 * Implements the second step of the Central Dogma:
 * mRNA is translated into protein by ribosomes.
 * 
 * Key insight: Translation is an entropy-reducing transform
 * (64 codons → 21 amino acids = significant information compression)
 */

const { NUCLEOTIDE_PRIMES, AMINO_ACID_PRIMES, PRIME_TO_NUCLEOTIDE } = require('./encoding');
const { STANDARD_GENETIC_CODE, isStartCodon, isStopCodon, translateCodon } = require('./genetic-code');

/**
 * TranslationOperator
 * 
 * Transforms RNA prime sequences to protein prime sequences.
 * Models ribosome-mediated translation.
 */
class TranslationOperator {
  constructor(geneticCode = STANDARD_GENETIC_CODE) {
    this.geneticCode = geneticCode;
    
    // Prime-based start codon: AUG → [7, 5, 11]
    this.startCodonPrimes = [7, 5, 11];
    
    // Prime-based stop codons
    this.stopCodonPrimes = [
      [5, 7, 7],   // UAA (Ochre)
      [5, 7, 11],  // UAG (Amber)
      [5, 11, 7],  // UGA (Opal)
    ];
  }
  
  /**
   * Translate RNA primes to protein primes
   * @param {number[]} rnaPrimes - RNA sequence as prime array
   * @param {object} options - Translation options
   * @returns {object} Translation result
   */
  apply(rnaPrimes, options = {}) {
    const aminoAcids = [];
    
    // Find start codon
    const startPos = options.start !== undefined ? options.start : 
      this.findStartCodon(rnaPrimes);
    
    if (startPos === -1 && !options.force) {
      return {
        success: false,
        error: 'No start codon (AUG) found',
        protein: [],
        length: 0
      };
    }
    
    const start = startPos === -1 ? 0 : startPos;
    
    // Translate codon by codon
    let stoppedAt = -1;
    for (let i = start; i <= rnaPrimes.length - 3; i += 3) {
      const codon = rnaPrimes.slice(i, i + 3);
      
      // Check for stop codon
      if (this.isStopCodonPrimes(codon)) {
        stoppedAt = i;
        break;
      }
      
      const aa = this.translateCodonPrimes(codon);
      if (aa !== null) {
        aminoAcids.push(aa);
      }
    }
    
    return {
      success: true,
      protein: aminoAcids,
      length: aminoAcids.length,
      startPosition: start,
      stopPosition: stoppedAt,
      readingFrame: start % 3
    };
  }
  
  /**
   * Translate a single codon (3 primes) to amino acid prime
   */
  translateCodonPrimes(codonPrimes) {
    if (codonPrimes.length !== 3) return null;
    
    // Convert primes to nucleotide string
    const nucMap = { 7: 'A', 5: 'U', 11: 'G', 3: 'C' };
    const codonStr = codonPrimes.map(p => nucMap[p] || '?').join('');
    
    if (codonStr.includes('?')) return null;
    
    const aa = this.geneticCode[codonStr];
    if (!aa || aa === '*') return null;
    
    return AMINO_ACID_PRIMES[aa];
  }
  
  /**
   * Find start codon (AUG) position
   */
  findStartCodon(rnaPrimes) {
    for (let i = 0; i <= rnaPrimes.length - 3; i++) {
      if (rnaPrimes[i] === 7 &&      // A
          rnaPrimes[i + 1] === 5 &&  // U
          rnaPrimes[i + 2] === 11) { // G
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Find all start codons (for alternative translation initiation)
   */
  findAllStartCodons(rnaPrimes) {
    const positions = [];
    for (let i = 0; i <= rnaPrimes.length - 3; i++) {
      if (rnaPrimes[i] === 7 &&
          rnaPrimes[i + 1] === 5 &&
          rnaPrimes[i + 2] === 11) {
        positions.push(i);
      }
    }
    return positions;
  }
  
  /**
   * Check if codon primes represent a stop codon
   */
  isStopCodonPrimes(codonPrimes) {
    for (const stop of this.stopCodonPrimes) {
      if (codonPrimes[0] === stop[0] &&
          codonPrimes[1] === stop[1] &&
          codonPrimes[2] === stop[2]) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Calculate entropy reduction from translation
   * Translation compresses 64 states to 21 states per codon
   */
  entropyDelta(rnaPrimes) {
    const codons = Math.floor(rnaPrimes.length / 3);
    // Entropy reduction: log2(64) - log2(21) ≈ 1.6 bits per codon
    return -codons * Math.log2(64 / 21);
  }
  
  /**
   * Translate all three reading frames
   */
  translateAllFrames(rnaPrimes) {
    return [0, 1, 2].map(frame => ({
      frame,
      ...this.apply(rnaPrimes.slice(frame), { force: true })
    }));
  }
  
  /**
   * Find longest open reading frame (ORF)
   */
  findLongestORF(rnaPrimes) {
    let longestORF = null;
    
    for (let frame = 0; frame < 3; frame++) {
      const startCodons = this.findAllStartCodons(rnaPrimes.slice(frame));
      
      for (const start of startCodons) {
        const result = this.apply(rnaPrimes.slice(frame), { start });
        if (!longestORF || result.length > longestORF.length) {
          longestORF = {
            ...result,
            frame,
            absoluteStart: frame + start
          };
        }
      }
    }
    
    return longestORF;
  }
  
  /**
   * Calculate molecular weight of protein
   */
  calculateMolecularWeight(proteinPrimes) {
    const massMap = {
      23: 57.05,   // G
      29: 71.08,   // A
      31: 99.13,   // V
      37: 113.16,  // L
      41: 113.16,  // I
      43: 131.20,  // M
      47: 147.18,  // F
      53: 186.21,  // W
      59: 163.18,  // Y
      61: 87.08,   // S
      67: 101.11,  // T
      71: 103.14,  // C
      73: 114.10,  // N
      79: 128.13,  // Q
      83: 128.17,  // K
      89: 156.19,  // R
      97: 137.14,  // H
      101: 115.09, // D
      103: 129.12, // E
      107: 97.12,  // P
    };
    
    // Sum residue masses and subtract water for each peptide bond
    const residueMass = proteinPrimes.reduce((sum, p) => sum + (massMap[p] || 0), 0);
    const waterLoss = (proteinPrimes.length - 1) * 18.015;
    
    return residueMass - waterLoss;
  }
  
  /**
   * Calculate isoelectric point (pI) estimate
   */
  calculateIsoelectricPoint(proteinPrimes) {
    // Count charged residues
    const chargedResidues = {
      positive: 0,  // K, R, H
      negative: 0,  // D, E
    };
    
    for (const p of proteinPrimes) {
      if (p === 83 || p === 89 || p === 97) chargedResidues.positive++;
      if (p === 101 || p === 103) chargedResidues.negative++;
    }
    
    // Simple pI estimate based on charge balance
    // Real pI calculation requires pKa values and Henderson-Hasselbalch
    const netCharge = chargedResidues.positive - chargedResidues.negative;
    
    if (netCharge > 0) return 8.0 + Math.log(netCharge + 1);
    if (netCharge < 0) return 6.0 - Math.log(-netCharge + 1);
    return 7.0;
  }
  
  /**
   * Check for signal peptide (N-terminal hydrophobic region)
   */
  hasSignalPeptide(proteinPrimes, windowSize = 15) {
    if (proteinPrimes.length < windowSize) return false;
    
    // Signal peptides have hydrophobic N-terminus
    // Small primes (23-43) are hydrophobic
    const nTerminal = proteinPrimes.slice(0, windowSize);
    const hydrophobicCount = nTerminal.filter(p => p >= 23 && p <= 43).length;
    
    return hydrophobicCount >= windowSize * 0.6;
  }
}

module.exports = { TranslationOperator };