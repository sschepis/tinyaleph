/**
 * Semantic Backend - Natural language understanding and concept mapping
 *
 * IMPORTANT: Concepts are non-commutative. "dog bites man" ≠ "man bites dog"
 * We use sequential hypercomplex multiplication to preserve order.
 *
 * DNA-INSPIRED PROCESSING:
 * - Bidirectional (boustrophedon): Forward AND backward states combined
 * - Codon chunking: Triplet groupings for emergent meaning
 * - Reading frames: 6 frames (3 forward + 3 reverse offsets)
 * - Sense/Antisense: Dual representations via conjugation
 */

import { Backend } from '../interface.js';
import { Hypercomplex } from '../../core/hypercomplex.js';
import { primeToFrequency, primeToAngle, DEFAULT_PRIMES, nthPrime } from '../../core/prime.js';

class SemanticBackend extends Backend {
  constructor(config) {
    super(config);
    this.config.primes = config.primes || DEFAULT_PRIMES;
    this.vocabulary = new Map(Object.entries(config.vocabulary || {}));
    this.ontology = config.ontology || {};
    this.transforms = config.transforms || [];
    this.axes = config.axes || {};
    this.corePrimes = new Set(config.corePrimes || [
      2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
      53, 59, 61, 67, 71, 73, 79, 83, 89, 97
    ]);
    this.stopWords = new Set(config.stopWords || [
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'of', 'in', 'to',
      'for', 'with', 'on', 'at', 'by', 'from', 'and', 'or', 'but', 'if',
      'it', 'its', 'this', 'that', 'what', 'which', 'who', 'whom', 'whose',
      'how', 'when', 'where', 'why', 'can', 'could', 'would', 'should', 'will'
    ]);
  }
  
  tokenize(text, filterStopWords = false) {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const tokens = [];
    let position = 0;
    for (const word of words) {
      const clean = word.replace(/[^\w]/g, '');
      if (!clean) continue;
      const isStop = this.stopWords.has(clean);
      if (filterStopWords && isStop) continue;
      const primes = this.vocabulary.get(clean) || this.wordToPrimes(clean);
      tokens.push({
        word: clean,
        primes,
        known: this.vocabulary.has(clean),
        isStop,
        position: position++  // Track position for order preservation
      });
    }
    return tokens;
  }
  
  wordToPrimes(word) {
    // Hash unknown words to primes based on character codes
    const primes = this.config.primes;
    return [...word].map(c => primes[c.charCodeAt(0) % primes.length]);
  }
  
  encode(text) {
    const tokens = this.tokenize(text, true);
    return tokens.flatMap(t => t.primes);
  }
  
  /**
   * Encode text to primes WITHOUT filtering stop words
   * Use this when you need complete semantic content (e.g., for training/comparison)
   */
  encodeAll(text) {
    const tokens = this.tokenize(text, false);
    return tokens.flatMap(t => t.primes);
  }
  
  /**
   * Decode primes to text using greedy covering algorithm
   *
   * The key insight from TWO_LAYER_MEANING.md:
   * - Layer 1 (primes) = the actual meaning
   * - Layer 2 (words) = surface manifestation of that meaning
   *
   * We pick words that COVER the input primes with minimal noise,
   * ensuring different prime signatures produce different outputs.
   */
  decode(primes) {
    const primeSet = new Set(primes);
    const covered = new Set();
    const selected = [];
    const maxWords = 5;
    
    // Greedy covering: pick words that cover most NEW primes with least noise
    while (covered.size < primeSet.size && selected.length < maxWords) {
      let best = { word: null, wordPrimes: [], score: -Infinity };
      
      for (const [word, wordPrimes] of this.vocabulary) {
        if (this.stopWords.has(word)) continue;
        if (selected.includes(word)) continue;
        
        // Count primes this word would newly cover
        const newCoverage = wordPrimes.filter(p => primeSet.has(p) && !covered.has(p)).length;
        
        // Penalize words that introduce primes NOT in our target set (noise)
        const noise = wordPrimes.filter(p => !primeSet.has(p)).length;
        
        // Reward exact matches more highly
        const exactMatch = wordPrimes.every(p => primeSet.has(p)) ? 2 : 0;
        
        // Score: new coverage + exact match bonus - noise penalty
        const score = newCoverage + exactMatch - (noise * 0.4);
        
        if (score > best.score && newCoverage > 0) {
          best = { word, wordPrimes, score };
        }
      }
      
      if (best.word && best.score > 0) {
        selected.push(best.word);
        best.wordPrimes.forEach(p => covered.add(p));
      } else {
        break; // No more useful words found
      }
    }
    
    // Fallback: describe remaining uncovered primes via ontology
    const uncovered = [...primeSet].filter(p => !covered.has(p));
    for (const p of uncovered.slice(0, maxWords - selected.length)) {
      const meaning = this.ontology[p];
      if (meaning) {
        selected.push(meaning.split('/')[0]); // Take first part of "existence/being"
      } else if (p > 100) {
        // Large primes are from unknown words - skip them
        continue;
      } else {
        selected.push(`P${p}`);
      }
    }
    
    return selected.join(' ') || this.primesToMeaning(primes);
  }
  
  primesToMeaning(primes) {
    return [...new Set(primes)].map(p => this.ontology[p] || `P${p}`).join('·');
  }
  
  /**
   * DEPRECATED: Use orderedPrimesToState for proper non-commutative encoding
   * This method treats primes as unordered set (loses word order)
   */
  primesToState(primes) {
    const state = Hypercomplex.zero(this.dimension);
    for (const p of primes) {
      const angle = primeToAngle(p);
      for (let i = 0; i < this.dimension; i++) {
        state.c[i] += Math.cos(angle * (i + 1)) / Math.sqrt(primes.length || 1);
      }
    }
    return state.normalize();
  }
  
  /**
   * Encode ordered tokens to state using sequential multiplication (NON-COMMUTATIVE)
   * "dog bites man" will produce DIFFERENT state than "man bites dog"
   */
  orderedPrimesToState(orderedTokens) {
    // Start with identity element (1 + 0i + 0j + ...)
    let state = Hypercomplex.basis(this.dimension, 0, 1);
    
    for (let i = 0; i < orderedTokens.length; i++) {
      const token = orderedTokens[i];
      const primes = Array.isArray(token) ? token : token.primes;
      
      // Convert primes to hypercomplex rotation
      const tokenH = this.primesToHypercomplex(primes);
      
      // Apply position-dependent phase shift (breaks commutativity further)
      const positioned = this.applyPositionPhase(tokenH, i);
      
      // Sequential MULTIPLICATION (non-commutative!)
      // This is the key: mul(A,B) ≠ mul(B,A) for hypercomplex
      state = state.mul(positioned);
    }
    
    return state.normalize();
  }
  
  /**
   * Convert primes to a hypercomplex number (rotation in high-D space)
   */
  primesToHypercomplex(primes) {
    const h = Hypercomplex.basis(this.dimension, 0, 1);  // Start with 1
    
    for (const p of primes) {
      const angle = primeToAngle(p);
      const axis = (p % (this.dimension - 1)) + 1;  // Use prime to select axis (1 to dim-1)
      
      // Create rotation: cos(θ) + sin(θ)·eₐₓᵢₛ
      const rot = Hypercomplex.zero(this.dimension);
      rot.c[0] = Math.cos(angle);
      rot.c[axis] = Math.sin(angle);
      
      // Accumulate by multiplication
      const result = h.mul(rot);
      for (let i = 0; i < this.dimension; i++) {
        h.c[i] = result.c[i];
      }
    }
    
    return h.normalize();
  }
  
  /**
   * Apply position-dependent phase rotation
   * This ensures that position in sequence affects the final state
   */
  applyPositionPhase(h, position) {
    // Use position-th prime for phase shift
    const posPrime = nthPrime(position + 1);
    const angle = primeToAngle(posPrime) * 0.5;  // Half angle for subtler effect
    
    // Rotate in the position-dependent plane
    const posAxis = (position % (this.dimension - 2)) + 1;
    
    const rot = Hypercomplex.zero(this.dimension);
    rot.c[0] = Math.cos(angle);
    rot.c[posAxis] = Math.sin(angle);
    
    return h.mul(rot);
  }
  
  /**
   * Ordered encode: returns tokens with position information
   */
  encodeOrdered(text) {
    return this.tokenize(text, true);
  }
  
  /**
   * Full ordered processing: text → ordered tokens → non-commutative state
   */
  textToOrderedState(text) {
    const tokens = this.encodeOrdered(text);
    return this.orderedPrimesToState(tokens);
  }
  
  primesToFrequencies(primes) {
    return primes.map(p => primeToFrequency(p));
  }
  
  applyTransform(inputPrimes, transform) {
    const inputSet = new Set(inputPrimes);
    // Check if transform query primes are present
    if (!transform.q || !transform.q.some(p => inputSet.has(p))) return inputPrimes;
    // Don't transform core primes
    if (transform.q.some(p => this.corePrimes.has(p))) return inputPrimes;
    // Apply replacement
    const kept = inputPrimes.filter(p => this.corePrimes.has(p) || !transform.q.includes(p));
    return [...new Set([...kept, ...(transform.r || [])])];
  }
  
  learn(word, primes, confidence = 0.5) {
    this.vocabulary.set(word.toLowerCase().trim(), primes);
    return { word, primes, confidence };
  }
  
  getVocabularySize() {
    return this.vocabulary.size;
  }
  
  hasWord(word) {
    return this.vocabulary.has(word.toLowerCase().trim());
  }
  
  getWordPrimes(word) {
    return this.vocabulary.get(word.toLowerCase().trim());
  }
  
  getOntologyMeaning(prime) {
    return this.ontology[prime];
  }
  
  getAxisPrimes(axisIndex) {
    return this.axes[axisIndex];
  }
  
  // ============================================
  // DNA-INSPIRED SEMANTIC PROCESSING
  // ============================================
  
  /**
   * BIDIRECTIONAL PROCESSING (Enochian Boustrophedon)
   * Like Dee & Kelley's method: read forward AND backward, combine results
   *
   * The forward and backward states capture different semantic perspectives.
   * Combined via multiplication with conjugation for anti-symmetric blending.
   */
  bidirectionalState(tokens) {
    if (!tokens || tokens.length === 0) {
      return Hypercomplex.basis(this.dimension, 0, 1);
    }
    
    // Forward state (normal left-to-right)
    const stateF = this.orderedPrimesToState(tokens);
    
    // Backward state (reversed order - reveals hidden patterns)
    const tokensB = [...tokens].reverse();
    const stateB = this.orderedPrimesToState(tokensB);
    
    // Combine: forward ⊗ conjugate(backward)
    // The conjugate creates an antisymmetric relationship
    const combined = stateF.mul(stateB.conjugate());
    
    return combined.normalize();
  }
  
  /**
   * CODON-STYLE CHUNKING (DNA Triplets)
   * Group tokens into triplets - meaning emerges from 3-unit groups
   *
   * In DNA, codons (3 nucleotides) encode amino acids.
   * Similarly, semantic "codons" may carry emergent meaning.
   */
  tokensToCodons(tokens, codonSize = 3) {
    const codons = [];
    for (let i = 0; i < tokens.length; i += codonSize) {
      const chunk = tokens.slice(i, i + codonSize);
      // Merge primes from all tokens in the codon
      const codonPrimes = chunk.flatMap(t => Array.isArray(t) ? t : t.primes);
      codons.push({
        tokens: chunk,
        primes: codonPrimes,
        position: Math.floor(i / codonSize)
      });
    }
    return codons;
  }
  
  /**
   * Process text using codon chunking
   */
  codonState(text, codonSize = 3) {
    const tokens = this.tokenize(text, true);
    const codons = this.tokensToCodons(tokens, codonSize);
    
    // Each codon becomes a unit for ordered processing
    return this.orderedPrimesToState(codons);
  }
  
  /**
   * READING FRAME SHIFTS (DNA 6-Frame Translation)
   * DNA has 6 reading frames: 3 forward offsets + 3 reverse offsets
   *
   * Each frame yields a different interpretation of the same sequence.
   * Combined, they provide a richer semantic representation.
   */
  readingFrameStates(tokens, numFrames = 3) {
    const frames = [];
    
    // Forward frames (offset 0, 1, 2)
    for (let offset = 0; offset < numFrames && offset < tokens.length; offset++) {
      const frameTokens = tokens.slice(offset);
      const state = this.orderedPrimesToState(frameTokens);
      frames.push({
        direction: 'forward',
        offset,
        state,
        tokens: frameTokens
      });
    }
    
    // Reverse frames (reversed sequence with offsets)
    const reversed = [...tokens].reverse();
    for (let offset = 0; offset < numFrames && offset < reversed.length; offset++) {
      const frameTokens = reversed.slice(offset);
      const state = this.orderedPrimesToState(frameTokens);
      frames.push({
        direction: 'reverse',
        offset,
        state,
        tokens: frameTokens
      });
    }
    
    return frames;
  }
  
  /**
   * Combine all 6 reading frames into a unified state
   */
  sixFrameState(text) {
    const tokens = this.tokenize(text, true);
    const frames = this.readingFrameStates(tokens, 3);
    
    // Start with identity
    let combined = Hypercomplex.basis(this.dimension, 0, 1);
    
    // Multiply all frame states together
    for (const frame of frames) {
      combined = combined.mul(frame.state);
    }
    
    return combined.normalize();
  }
  
  /**
   * SENSE/ANTISENSE DUALITY (DNA Double Helix)
   * Like DNA's complementary strands, maintain dual representations
   *
   * - Sense: The primary interpretation (primes as-is)
   * - Antisense: The complementary interpretation (conjugate)
   *
   * Together they form a complete representation like the double helix.
   */
  dualRepresentation(tokens) {
    const state = this.orderedPrimesToState(tokens);
    
    return {
      sense: state,
      antisense: state.conjugate(),
      // The product of sense and antisense = |state|² scalar (real number)
      // This represents the "strength" of the semantic encoding
      magnitude: state.norm(),
      // Coherence between sense and antisense
      coherence: state.coherence ? state.coherence(state.conjugate()) : 1.0
    };
  }
  
  /**
   * FULL DNA-INSPIRED ENCODING
   * Combines all four methods for maximum semantic richness:
   * 1. Tokenize to codons (triplet chunking)
   * 2. Apply 6-frame processing
   * 3. Compute bidirectional state
   * 4. Return sense/antisense duality
   */
  dnaEncode(text) {
    const tokens = this.tokenize(text, true);
    
    if (tokens.length === 0) {
      const identity = Hypercomplex.basis(this.dimension, 0, 1);
      return {
        tokens: [],
        codons: [],
        frames: [],
        bidirectional: identity,
        sixFrame: identity,
        sense: identity,
        antisense: identity.conjugate(),
        magnitude: 1,
        coherence: 1
      };
    }
    
    // Codon chunking
    const codons = this.tokensToCodons(tokens, 3);
    
    // 6-frame processing
    const frames = this.readingFrameStates(tokens, 3);
    
    // Bidirectional (boustrophedon)
    const bidirectional = this.bidirectionalState(tokens);
    
    // Six-frame combined
    let sixFrame = Hypercomplex.basis(this.dimension, 0, 1);
    for (const frame of frames) {
      sixFrame = sixFrame.mul(frame.state);
    }
    sixFrame = sixFrame.normalize();
    
    // Final state combines bidirectional and six-frame
    const finalState = bidirectional.mul(sixFrame).normalize();
    
    // Sense/Antisense duality
    return {
      tokens,
      codons,
      frames,
      bidirectional,
      sixFrame,
      sense: finalState,
      antisense: finalState.conjugate(),
      magnitude: finalState.norm(),
      coherence: finalState.coherence ? finalState.coherence(finalState.conjugate()) : 1.0
    };
  }
  
  /**
   * DNA-inspired text comparison
   * Compare two texts using their DNA encodings
   */
  dnaCompare(text1, text2) {
    const enc1 = this.dnaEncode(text1);
    const enc2 = this.dnaEncode(text2);
    
    // Coherence between the two sense states
    const senseCoherence = enc1.sense.coherence
      ? enc1.sense.coherence(enc2.sense)
      : this.fallbackCoherence(enc1.sense, enc2.sense);
    
    // Cross-coherence: sense1 with antisense2 (complementary match)
    const crossCoherence = enc1.sense.coherence
      ? enc1.sense.coherence(enc2.antisense)
      : this.fallbackCoherence(enc1.sense, enc2.antisense);
    
    return {
      senseCoherence,
      crossCoherence,
      // Average of direct and complementary matching
      combinedScore: (senseCoherence + Math.abs(crossCoherence)) / 2
    };
  }
  
  /**
   * Fallback coherence calculation if not defined on Hypercomplex
   */
  fallbackCoherence(h1, h2) {
    let dot = 0;
    for (let i = 0; i < this.dimension; i++) {
      dot += h1.c[i] * h2.c[i];
    }
    return dot / (h1.norm() * h2.norm() || 1);
  }
}

export {
    SemanticBackend
};