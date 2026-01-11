/**
 * Transcription Operator - DNA → RNA
 * 
 * Implements the first step of the Central Dogma:
 * DNA is transcribed into messenger RNA.
 * 
 * In prime space: T(2) → U(5) substitution
 */

/**
 * TranscriptionOperator
 * 
 * Transforms DNA prime sequences to RNA prime sequences.
 * Models the biological process of transcription.
 */
import { NUCLEOTIDE_PRIMES, PRIME_COMPLEMENTS, PRIME_TO_NUCLEOTIDE } from './encoding.js';

class TranscriptionOperator {
  constructor(options = {}) {
    this.options = {
      senseStrand: true,  // If true, use sense strand (same as mRNA except T→U)
      ...options
    };
  }
  
  /**
   * Basic transcription: T → U substitution
   * @param {number[]} dnaPrimes - DNA sequence as prime array
   * @returns {number[]} RNA sequence as prime array
   */
  apply(dnaPrimes) {
    return dnaPrimes.map(p => p === 2 ? 5 : p);  // T(2) → U(5)
  }
  
  /**
   * Full transcription with promoter recognition
   */
  transcribe(dnaPrimes, options = {}) {
    const opts = { ...this.options, ...options };
    
    // Find promoter sequence (TATA box analog)
    const promoterPattern = [2, 7, 2, 7];  // TATA in primes
    const promoterPos = opts.force ? 0 : this.findPattern(dnaPrimes, promoterPattern);
    
    if (promoterPos === -1 && !opts.force) {
      return {
        success: false,
        error: 'No promoter sequence found',
        dnaPrimes
      };
    }
    
    // Determine which strand to transcribe
    let template = dnaPrimes;
    if (!opts.senseStrand) {
      template = this.complement(dnaPrimes);
    }
    
    // Find transcription start (+1) - typically ~25bp downstream of TATA
    const startPos = opts.startPos !== undefined ? opts.startPos :
      (promoterPos !== -1 ? Math.min(promoterPos + 8, dnaPrimes.length) : 0);
    
    // Find terminator (poly-A signal analog or end)
    const endPos = opts.endPos !== undefined ? opts.endPos :
      this.findTerminator(template, startPos) || template.length;
    
    // Transcribe the region
    const transcribedRegion = template.slice(startPos, endPos);
    const rnaPrimes = this.apply(transcribedRegion);
    
    return {
      success: true,
      rna: rnaPrimes,
      startPosition: startPos,
      endPosition: endPos,
      length: rnaPrimes.length,
      promoterPosition: promoterPos
    };
  }
  
  /**
   * Get complementary strand (template strand from sense strand)
   */
  complement(primes) {
    return primes.map(p => PRIME_COMPLEMENTS[p] || p);
  }
  
  /**
   * Get reverse complement
   */
  reverseComplement(primes) {
    return this.complement(primes).reverse();
  }
  
  /**
   * Find pattern in sequence
   */
  findPattern(sequence, pattern) {
    for (let i = 0; i <= sequence.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (sequence[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }
  
  /**
   * Find all occurrences of pattern
   */
  findAllPatterns(sequence, pattern) {
    const positions = [];
    for (let i = 0; i <= sequence.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (sequence[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) positions.push(i);
    }
    return positions;
  }
  
  /**
   * Find terminator sequence
   * Looks for poly-A signal analog (AATAAA → 7,7,2,7,7,7 in primes)
   */
  findTerminator(sequence, startFrom = 0) {
    const polyASignal = [7, 7, 2, 7, 7, 7];  // AATAAA
    
    for (let i = startFrom; i <= sequence.length - polyASignal.length; i++) {
      let match = true;
      for (let j = 0; j < polyASignal.length; j++) {
        if (sequence[i + j] !== polyASignal[j]) {
          match = false;
          break;
        }
      }
      if (match) return i + polyASignal.length + 20;  // Include poly-A tail region
    }
    return null;
  }
  
  /**
   * Calculate entropy change from transcription
   * Transcription slightly increases entropy (expansion of state space)
   */
  entropyDelta(dnaPrimes) {
    return 0.01 * dnaPrimes.length;  // Small positive entropy change
  }
  
  /**
   * Add 5' cap (methylated G)
   */
  addFivePrimeCap(rnaPrimes) {
    // 7-methylguanosine cap represented as modified G prime
    const cap = [111];  // Using a distinct prime for m7G
    return [...cap, ...rnaPrimes];
  }
  
  /**
   * Add 3' poly-A tail
   */
  addPolyATail(rnaPrimes, length = 200) {
    const tail = Array(length).fill(7);  // Poly-A
    return [...rnaPrimes, ...tail];
  }
  
  /**
   * Full mRNA processing: cap + splice + poly-A
   */
  processmRNA(rnaPrimes, options = {}) {
    let processed = [...rnaPrimes];
    
    // Add 5' cap
    if (options.addCap !== false) {
      processed = this.addFivePrimeCap(processed);
    }
    
    // Splice out introns (if splice sites provided)
    if (options.introns && options.introns.length > 0) {
      processed = this.splice(processed, options.introns);
    }
    
    // Add poly-A tail
    if (options.addPolyA !== false) {
      const tailLength = options.polyALength || 200;
      processed = this.addPolyATail(processed, tailLength);
    }
    
    return processed;
  }
  
  /**
   * Splice out introns
   * @param {number[]} rnaPrimes - Pre-mRNA
   * @param {Array<{start: number, end: number}>} introns - Intron positions
   */
  splice(rnaPrimes, introns) {
    // Sort introns by start position (descending) to splice from end first
    const sortedIntrons = [...introns].sort((a, b) => b.start - a.start);
    
    let spliced = [...rnaPrimes];
    for (const intron of sortedIntrons) {
      spliced = [
        ...spliced.slice(0, intron.start),
        ...spliced.slice(intron.end)
      ];
    }
    
    return spliced;
  }
}

export {
    TranscriptionOperator
};