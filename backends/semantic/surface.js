/**
 * Surface Layer - Word Selection with Bias
 * 
 * This layer sits above the prime-based meaning core and handles:
 * - Mapping primes → words (with style/register preferences)
 * - Biasing word selection based on context
 * - Managing multiple vocabulary registers (formal, casual, technical, etc.)
 */

/**
 * A Surface represents a specific vocabulary/style mapping
 * Multiple words can map to the same prime signature with different biases
 */
class Surface {
  constructor(config = {}) {
    this.name = config.name || 'default';
    
    // Prime → [{ word, bias, context }]
    // Multiple words can share the same primes but with different biases
    this.primeToWords = new Map();
    
    // Word → primes (reverse lookup)
    this.wordToPrimes = new Map();
    
    // Default biases for this surface
    this.defaultBias = config.defaultBias || 1.0;
    
    // Context stack affects word selection
    this.contextStack = [];
    
    // Register vocabulary
    if (config.vocabulary) {
      this.loadVocabulary(config.vocabulary);
    }
  }
  
  /**
   * Load vocabulary with optional bias information
   * vocabulary: { word: { primes: [...], bias?: number, contexts?: [...] } }
   * or simple format: { word: [...primes] }
   */
  loadVocabulary(vocabulary) {
    for (const [word, value] of Object.entries(vocabulary)) {
      const entry = Array.isArray(value) 
        ? { primes: value, bias: this.defaultBias }
        : { primes: value.primes, bias: value.bias || this.defaultBias, contexts: value.contexts || [] };
      
      this.registerWord(word, entry.primes, entry.bias, entry.contexts);
    }
  }
  
  /**
   * Register a word with its prime signature and bias
   */
  registerWord(word, primes, bias = 1.0, contexts = []) {
    const signature = this.primeSignature(primes);
    
    if (!this.primeToWords.has(signature)) {
      this.primeToWords.set(signature, []);
    }
    
    this.primeToWords.get(signature).push({
      word,
      primes,
      bias,
      contexts
    });
    
    this.wordToPrimes.set(word, primes);
  }
  
  /**
   * Create canonical signature for prime lookup
   */
  primeSignature(primes) {
    return [...primes].sort((a, b) => a - b).join(',');
  }
  
  /**
   * Push a context that affects word selection
   */
  pushContext(context) {
    this.contextStack.push(context);
  }
  
  popContext() {
    return this.contextStack.pop();
  }
  
  clearContext() {
    this.contextStack = [];
  }
  
  /**
   * Select best word for given primes considering biases and context
   */
  selectWord(primes, options = {}) {
    const signature = this.primeSignature(primes);
    const candidates = this.primeToWords.get(signature);
    
    if (!candidates || candidates.length === 0) {
      // No exact match - find closest
      return this.selectClosestWord(primes, options);
    }
    
    if (candidates.length === 1) {
      return candidates[0].word;
    }
    
    // Score candidates by bias and context match
    const scored = candidates.map(c => ({
      ...c,
      score: this.scoreCandidate(c, options)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    // Option: deterministic (take best) or probabilistic (weighted random)
    if (options.deterministic) {
      return scored[0].word;
    }
    
    return this.weightedSelect(scored);
  }
  
  /**
   * Score a candidate word based on bias and context
   */
  scoreCandidate(candidate, options = {}) {
    let score = candidate.bias;
    
    // Boost if candidate's contexts match current context
    const currentContexts = [...this.contextStack, ...(options.contexts || [])];
    for (const ctx of candidate.contexts) {
      if (currentContexts.includes(ctx)) {
        score *= 1.5;  // Context match boost
      }
    }
    
    // Apply external bias if provided
    if (options.wordBiases && options.wordBiases[candidate.word]) {
      score *= options.wordBiases[candidate.word];
    }
    
    // Penalize if marked as avoid
    if (options.avoid && options.avoid.includes(candidate.word)) {
      score *= 0.1;
    }
    
    // Boost if marked as prefer
    if (options.prefer && options.prefer.includes(candidate.word)) {
      score *= 2.0;
    }
    
    return score;
  }
  
  /**
   * Weighted random selection based on scores
   */
  weightedSelect(scored) {
    const totalScore = scored.reduce((sum, c) => sum + c.score, 0);
    let random = Math.random() * totalScore;
    
    for (const candidate of scored) {
      random -= candidate.score;
      if (random <= 0) {
        return candidate.word;
      }
    }
    
    return scored[0].word;
  }
  
  /**
   * Find closest word when no exact prime match
   */
  selectClosestWord(targetPrimes, options = {}) {
    const targetSet = new Set(targetPrimes);
    let bestMatch = null;
    let bestScore = -1;
    
    for (const [signature, candidates] of this.primeToWords) {
      for (const candidate of candidates) {
        const candidateSet = new Set(candidate.primes);
        
        // Jaccard similarity
        const intersection = [...targetSet].filter(p => candidateSet.has(p)).length;
        const union = new Set([...targetSet, ...candidateSet]).size;
        const similarity = intersection / union;
        
        const score = similarity * candidate.bias;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = candidate.word;
        }
      }
    }
    
    return bestMatch || `[${targetPrimes.join(',')}]`;  // Fallback to raw primes
  }
  
  /**
   * Encode word to primes
   */
  encode(word) {
    return this.wordToPrimes.get(word.toLowerCase());
  }
  
  /**
   * Decode primes to word
   */
  decode(primes, options = {}) {
    return this.selectWord(primes, options);
  }
}

/**
 * SurfaceManager handles multiple vocabulary surfaces and switching between them
 */
class SurfaceManager {
  constructor() {
    this.surfaces = new Map();
    this.activeSurface = null;
    this.contextStack = [];
  }
  
  /**
   * Register a named surface
   */
  register(name, surface) {
    this.surfaces.set(name, surface);
    if (!this.activeSurface) {
      this.activeSurface = name;
    }
  }
  
  /**
   * Create and register a surface from config
   */
  create(name, config) {
    const surface = new Surface({ name, ...config });
    this.register(name, surface);
    return surface;
  }
  
  /**
   * Switch active surface
   */
  use(name) {
    if (!this.surfaces.has(name)) {
      throw new Error(`Unknown surface: ${name}`);
    }
    this.activeSurface = name;
    return this.surfaces.get(name);
  }
  
  /**
   * Get current surface
   */
  current() {
    return this.surfaces.get(this.activeSurface);
  }
  
  /**
   * Decode primes using current surface
   */
  decode(primes, options = {}) {
    return this.current().selectWord(primes, {
      ...options,
      contexts: this.contextStack
    });
  }
  
  /**
   * Encode word using current surface
   */
  encode(word) {
    return this.current().encode(word);
  }
  
  /**
   * Push global context affecting all surfaces
   */
  pushContext(context) {
    this.contextStack.push(context);
  }
  
  popContext() {
    return this.contextStack.pop();
  }
  
  /**
   * Translate word from one surface to another
   */
  translate(word, fromSurface, toSurface, options = {}) {
    const primes = this.surfaces.get(fromSurface).encode(word);
    if (!primes) return word;  // Unknown word
    return this.surfaces.get(toSurface).decode(primes, options);
  }
}

/**
 * BiasEngine provides dynamic bias adjustments
 */
class BiasEngine {
  constructor() {
    this.wordBiases = new Map();      // Persistent word biases
    this.contextBiases = new Map();   // Context → bias multiplier
    this.temporalDecay = 0.95;        // How fast temporary biases decay
    this.temporaryBiases = new Map(); // Temporary biases (decay over time)
  }
  
  /**
   * Set persistent bias for a word
   */
  setBias(word, bias) {
    this.wordBiases.set(word, bias);
  }
  
  /**
   * Set temporary bias (will decay)
   */
  setTemporaryBias(word, bias) {
    this.temporaryBiases.set(word, bias);
  }
  
  /**
   * Set context-based bias
   */
  setContextBias(context, bias) {
    this.contextBiases.set(context, bias);
  }
  
  /**
   * Get total bias for a word given current context
   */
  getBias(word, contexts = []) {
    let bias = 1.0;
    
    // Apply persistent bias
    if (this.wordBiases.has(word)) {
      bias *= this.wordBiases.get(word);
    }
    
    // Apply temporary bias
    if (this.temporaryBiases.has(word)) {
      bias *= this.temporaryBiases.get(word);
    }
    
    // Apply context biases
    for (const ctx of contexts) {
      if (this.contextBiases.has(ctx)) {
        bias *= this.contextBiases.get(ctx);
      }
    }
    
    return bias;
  }
  
  /**
   * Decay temporary biases (call periodically)
   */
  decay() {
    for (const [word, bias] of this.temporaryBiases) {
      const newBias = bias * this.temporalDecay;
      if (Math.abs(newBias - 1.0) < 0.01) {
        this.temporaryBiases.delete(word);
      } else {
        this.temporaryBiases.set(word, newBias);
      }
    }
  }
  
  /**
   * Boost words recently used (recency bias)
   */
  boostRecent(word, amount = 1.2) {
    const current = this.temporaryBiases.get(word) || 1.0;
    this.temporaryBiases.set(word, current * amount);
  }
  
  /**
   * Suppress words recently used (variety bias)
   */
  suppressRecent(word, amount = 0.8) {
    const current = this.temporaryBiases.get(word) || 1.0;
    this.temporaryBiases.set(word, current * amount);
  }
}

module.exports = { Surface, SurfaceManager, BiasEngine };