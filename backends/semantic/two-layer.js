/**
 * Two-Layer Semantic Engine
 * 
 * Layer 1 (Core): Works with prime-based meaning
 *   - Operates on invariant semantic structure
 *   - Performs reasoning via entropy minimization
 *   - Handles non-commutative concept ordering
 * 
 * Layer 2 (Surface): Biases word selection
 *   - Maps primes to specific words
 *   - Applies style/register preferences
 *   - Handles context-dependent vocabulary
 */

import { SemanticBackend } from './index.js';
import { Surface, SurfaceManager, BiasEngine } from './surface.js';

class TwoLayerEngine {
  constructor(config = {}) {
    // Layer 1: Core meaning engine
    this.core = new SemanticBackend(config.core || {
      dimension: 16
    });
    
    // Layer 2: Surface word selection
    this.surfaces = new SurfaceManager();
    this.biasEngine = new BiasEngine();
    
    // Initialize default surfaces
    this._initDefaultSurfaces(config.surfaces || {});
    
    // Track conversation history for context
    this.history = [];
    this.maxHistory = config.maxHistory || 10;
  }
  
  /**
   * Initialize default vocabulary surfaces
   */
  _initDefaultSurfaces(surfaceConfigs) {
    // Formal academic register
    this.surfaces.create('formal', {
      vocabulary: {
        // Same primes, different words, different biases
        'truth': { primes: [7, 11, 13], bias: 1.0, contexts: ['academic', 'philosophy'] },
        'verity': { primes: [7, 11, 13], bias: 0.8, contexts: ['literary', 'archaic'] },
        'veracity': { primes: [7, 11, 13], bias: 0.6, contexts: ['legal', 'formal'] },
        
        'love': { primes: [2, 3, 5], bias: 1.0, contexts: ['general'] },
        'affection': { primes: [2, 3, 5], bias: 0.9, contexts: ['formal'] },
        'devotion': { primes: [2, 3, 5], bias: 0.7, contexts: ['religious', 'romantic'] },
        
        'wisdom': { primes: [2, 7, 11], bias: 1.0, contexts: ['philosophy'] },
        'sagacity': { primes: [2, 7, 11], bias: 0.6, contexts: ['archaic', 'literary'] },
        'prudence': { primes: [2, 7, 11], bias: 0.8, contexts: ['practical', 'virtue'] },
        
        'knowledge': { primes: [3, 5, 7], bias: 1.0, contexts: ['academic'] },
        'erudition': { primes: [3, 5, 7], bias: 0.5, contexts: ['literary'] },
        'expertise': { primes: [3, 5, 7], bias: 0.8, contexts: ['professional'] },
        
        'think': { primes: [5, 7, 11], bias: 1.0, contexts: ['general'] },
        'contemplate': { primes: [5, 7, 11], bias: 0.7, contexts: ['philosophy', 'meditation'] },
        'cogitate': { primes: [5, 7, 11], bias: 0.4, contexts: ['archaic'] },
        'deliberate': { primes: [5, 7, 11], bias: 0.8, contexts: ['decision'] },
        
        'good': { primes: [2, 3], bias: 1.0, contexts: ['general'] },
        'virtuous': { primes: [2, 3], bias: 0.7, contexts: ['moral', 'religious'] },
        'beneficent': { primes: [2, 3], bias: 0.5, contexts: ['formal'] },
        
        'bad': { primes: [5, 13], bias: 1.0, contexts: ['general'] },
        'malevolent': { primes: [5, 13], bias: 0.6, contexts: ['literary'] },
        'pernicious': { primes: [5, 13], bias: 0.5, contexts: ['formal', 'medical'] }
      },
      defaultBias: 1.0
    });
    
    // Casual conversational register
    this.surfaces.create('casual', {
      vocabulary: {
        'truth': { primes: [7, 11, 13], bias: 0.5, contexts: [] },
        'real talk': { primes: [7, 11, 13], bias: 1.0, contexts: ['slang'] },
        'straight up': { primes: [7, 11, 13], bias: 0.8, contexts: ['slang'] },
        'no cap': { primes: [7, 11, 13], bias: 0.6, contexts: ['gen-z'] },
        
        'love': { primes: [2, 3, 5], bias: 1.0, contexts: ['general'] },
        'dig': { primes: [2, 3, 5], bias: 0.7, contexts: ['casual'] },
        'vibe with': { primes: [2, 3, 5], bias: 0.8, contexts: ['slang'] },
        
        'wisdom': { primes: [2, 7, 11], bias: 0.6, contexts: [] },
        'smarts': { primes: [2, 7, 11], bias: 1.0, contexts: ['casual'] },
        'big brain': { primes: [2, 7, 11], bias: 0.7, contexts: ['slang', 'internet'] },
        
        'think': { primes: [5, 7, 11], bias: 1.0, contexts: ['general'] },
        'figure': { primes: [5, 7, 11], bias: 0.9, contexts: ['casual'] },
        'reckon': { primes: [5, 7, 11], bias: 0.7, contexts: ['regional'] },
        
        'good': { primes: [2, 3], bias: 1.0, contexts: ['general'] },
        'awesome': { primes: [2, 3], bias: 0.9, contexts: ['casual'] },
        'fire': { primes: [2, 3], bias: 0.6, contexts: ['slang', 'gen-z'] },
        'lit': { primes: [2, 3], bias: 0.5, contexts: ['slang'] },
        
        'bad': { primes: [5, 13], bias: 1.0, contexts: ['general'] },
        'trash': { primes: [5, 13], bias: 0.7, contexts: ['slang'] },
        'wack': { primes: [5, 13], bias: 0.5, contexts: ['slang'] }
      },
      defaultBias: 1.0
    });
    
    // Technical/scientific register
    this.surfaces.create('technical', {
      vocabulary: {
        'truth': { primes: [7, 11, 13], bias: 0.8, contexts: [] },
        'validity': { primes: [7, 11, 13], bias: 1.0, contexts: ['logic', 'science'] },
        'accuracy': { primes: [7, 11, 13], bias: 0.9, contexts: ['measurement'] },
        
        'knowledge': { primes: [3, 5, 7], bias: 0.7, contexts: [] },
        'data': { primes: [3, 5, 7], bias: 1.0, contexts: ['science', 'computing'] },
        'information': { primes: [3, 5, 7], bias: 0.9, contexts: ['technical'] },
        
        'think': { primes: [5, 7, 11], bias: 0.6, contexts: [] },
        'compute': { primes: [5, 7, 11], bias: 1.0, contexts: ['computing'] },
        'process': { primes: [5, 7, 11], bias: 0.9, contexts: ['technical'] },
        'analyze': { primes: [5, 7, 11], bias: 0.85, contexts: ['science'] },
        
        'cause': { primes: [3, 7, 13], bias: 1.0, contexts: ['science'] },
        'induce': { primes: [3, 7, 13], bias: 0.8, contexts: ['technical'] },
        'effect': { primes: [3, 7, 13], bias: 0.7, contexts: ['result'] }
      },
      defaultBias: 1.0
    });
    
    // Poetic/literary register
    this.surfaces.create('poetic', {
      vocabulary: {
        'truth': { primes: [7, 11, 13], bias: 0.8, contexts: [] },
        'verity': { primes: [7, 11, 13], bias: 1.0, contexts: ['literary'] },
        'essence': { primes: [7, 11, 13], bias: 0.9, contexts: ['philosophical'] },
        
        'love': { primes: [2, 3, 5], bias: 0.8, contexts: [] },
        'ardor': { primes: [2, 3, 5], bias: 1.0, contexts: ['romantic'] },
        'passion': { primes: [2, 3, 5], bias: 0.95, contexts: ['intense'] },
        'devotion': { primes: [2, 3, 5], bias: 0.9, contexts: ['committed'] },
        
        'think': { primes: [5, 7, 11], bias: 0.6, contexts: [] },
        'ponder': { primes: [5, 7, 11], bias: 1.0, contexts: ['reflective'] },
        'muse': { primes: [5, 7, 11], bias: 0.9, contexts: ['artistic'] },
        'contemplate': { primes: [5, 7, 11], bias: 0.85, contexts: ['deep'] },
        
        'light': { primes: [2, 5, 11], bias: 0.8, contexts: [] },
        'radiance': { primes: [2, 5, 11], bias: 1.0, contexts: ['beautiful'] },
        'luminescence': { primes: [2, 5, 11], bias: 0.8, contexts: ['scientific-poetic'] },
        
        'dark': { primes: [3, 7, 13], bias: 0.8, contexts: [] },
        'shadow': { primes: [3, 7, 13], bias: 1.0, contexts: ['imagery'] },
        'void': { primes: [3, 7, 13], bias: 0.9, contexts: ['cosmic'] },
        'abyss': { primes: [3, 7, 13], bias: 0.85, contexts: ['dramatic'] }
      },
      defaultBias: 1.0
    });
    
    // Apply any custom surface configs
    for (const [name, config] of Object.entries(surfaceConfigs)) {
      this.surfaces.create(name, config);
    }
    
    // Default to formal
    this.surfaces.use('formal');
  }
  
  /**
   * Process input through both layers
   * Returns { meaning: <prime state>, words: <surface words> }
   */
  process(input, options = {}) {
    // Layer 1: Core meaning processing
    const tokens = this.core.encodeOrdered(input);
    const orderedPrimes = tokens.map(t => t.primes);
    const meaningState = this.core.orderedPrimesToState(tokens);
    
    // Record for history
    this.recordHistory(input, orderedPrimes);
    
    // Layer 2: Surface word selection
    const selectedWords = this.selectWords(orderedPrimes, options);
    
    return {
      input,
      tokens,
      meaning: {
        state: meaningState,
        primes: orderedPrimes.flat(),
        entropy: meaningState.entropy()
      },
      surface: {
        words: selectedWords,
        register: this.surfaces.activeSurface
      }
    };
  }
  
  /**
   * Select words for each prime group using surface layer
   */
  selectWords(orderedPrimes, options = {}) {
    const words = [];
    const usedWords = new Set();
    
    for (let i = 0; i < orderedPrimes.length; i++) {
      const primes = orderedPrimes[i];
      
      // Get bias from bias engine
      const biasOptions = {
        ...options,
        contexts: this.surfaces.contextStack,
        avoid: options.avoidRepetition ? [...usedWords] : []
      };
      
      const word = this.surfaces.decode(primes, biasOptions);
      words.push(word);
      usedWords.add(word);
      
      // Apply variety bias (suppress recently used)
      if (options.varietyBias) {
        this.biasEngine.suppressRecent(word, 0.7);
      }
    }
    
    // Decay temporary biases
    this.biasEngine.decay();
    
    return words;
  }
  
  /**
   * Transform meaning and express in target register
   */
  transform(input, targetRegister, options = {}) {
    // Get meaning from core
    const meaning = this.process(input);
    
    // Switch surface
    const originalSurface = this.surfaces.activeSurface;
    this.surfaces.use(targetRegister);
    
    // Generate in new register
    const transformed = this.selectWords(
      meaning.tokens.map(t => t.primes),
      options
    );
    
    // Restore original surface
    this.surfaces.use(originalSurface);
    
    return {
      original: input,
      originalRegister: originalSurface,
      transformed: transformed.join(' '),
      targetRegister,
      meaning: meaning.meaning
    };
  }
  
  /**
   * Translate between registers
   */
  translate(input, fromRegister, toRegister, options = {}) {
    this.surfaces.use(fromRegister);
    const meaning = this.process(input);
    
    this.surfaces.use(toRegister);
    const translated = this.selectWords(
      meaning.tokens.map(t => t.primes),
      options
    );
    
    return {
      original: input,
      from: fromRegister,
      translated: translated.join(' '),
      to: toRegister,
      meaning: meaning.meaning
    };
  }
  
  /**
   * Generate response biased toward specific style
   */
  generateWithStyle(primes, style, options = {}) {
    // Push style context
    this.surfaces.pushContext(style);
    
    // Select words with style bias
    const words = this.selectWords([primes], {
      ...options,
      contexts: [style]
    });
    
    // Pop context
    this.surfaces.popContext();
    
    return words.join(' ');
  }
  
  /**
   * Record interaction in history
   */
  recordHistory(input, primes) {
    this.history.push({
      time: Date.now(),
      input,
      primes: primes.flat()
    });
    
    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
  
  /**
   * Get primes that have been active recently
   */
  getRecentPrimes() {
    const recent = new Map();
    const decay = 0.8;
    
    for (let i = this.history.length - 1; i >= 0; i--) {
      const age = this.history.length - 1 - i;
      const weight = Math.pow(decay, age);
      
      for (const p of this.history[i].primes) {
        recent.set(p, (recent.get(p) || 0) + weight);
      }
    }
    
    return recent;
  }
  
  /**
   * Bias toward words related to recent conversation
   */
  applyConversationalBias() {
    const recentPrimes = this.getRecentPrimes();
    
    for (const [prime, weight] of recentPrimes) {
      // Find words with this prime and boost them slightly
      // This creates topical coherence
    }
  }
  
  /**
   * Set current register
   */
  useRegister(register) {
    this.surfaces.use(register);
  }
  
  /**
   * Get available registers
   */
  getRegisters() {
    return [...this.surfaces.surfaces.keys()];
  }
  
  /**
   * Add custom vocabulary to a surface
   */
  addVocabulary(register, vocabulary) {
    const surface = this.surfaces.surfaces.get(register);
    if (surface) {
      surface.loadVocabulary(vocabulary);
    }
  }
}

export {
    TwoLayerEngine
};