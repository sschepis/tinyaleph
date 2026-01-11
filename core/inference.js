/**
 * Semantic Inference Engine
 *
 * Pattern-based inference for mapping text entities to symbols.
 * Uses multiple strategies:
 * 1. Direct lookup in symbol database
 * 2. Regex pattern matching
 * 3. Semantic word overlap
 * 4. Category-based fallback
 * 5. Resonance-enhanced disambiguation (uses ResoFormer attention)
 *
 * Ported from symprime's SemanticInference system.
 * Enhanced with resonance attention from tinyaleph's rformer.
 */

// ═══════════════════════════════════════════════════════════════════
// Inference Result Types
// ═══════════════════════════════════════════════════════════════════

import { Complex } from './hilbert.js';
import { symbolDatabase, SymbolCategory } from './symbols.js';
import { SparsePrimeState, resonanceScore, resonantAttention } from './rformer.js';
import { ResonanceCalculator } from './resonance.js';

const InferenceMethod = {
  DIRECT: 'direct',           // Exact match in database
  REGEX: 'regex',             // Pattern rule match
  SEMANTIC: 'semantic',       // Word overlap match
  CATEGORY_FALLBACK: 'category_fallback'  // Category-based guess
};

// ═══════════════════════════════════════════════════════════════════
// Semantic Inference Engine
// ═══════════════════════════════════════════════════════════════════

class SemanticInference {
  constructor(database = symbolDatabase) {
    this.database = database;
    this.patternRules = [];
    this.initializePatternRules();
  }

  /**
   * Infer a symbol from entity text
   * Returns { symbol, confidence, method } or null
   */
  inferSymbol(entityText) {
    const normalized = entityText.toLowerCase().trim();

    // 1. Direct entity lookup
    const direct = this.database.getSymbol(normalized);
    if (direct) {
      return { symbol: direct, confidence: 1.0, method: InferenceMethod.DIRECT };
    }

    // 2. Regex pattern matching
    const patternResult = this.matchPattern(normalized);
    if (patternResult) {
      return patternResult;
    }

    // 3. Semantic similarity (word matching)
    const semanticResult = this.semanticMatch(normalized);
    if (semanticResult) {
      return semanticResult;
    }

    // 4. Category-based fallback
    const categoryResult = this.categoryFallback(normalized);
    if (categoryResult) {
      return categoryResult;
    }

    return null;
  }

  /**
   * Batch infer symbols from multiple entities
   */
  inferSymbols(entities) {
    const results = [];
    for (const entity of entities) {
      const result = this.inferSymbol(entity);
      if (result) {
        results.push({ entity, ...result });
      }
    }
    return results;
  }

  /**
   * Add a custom pattern rule
   */
  addPatternRule(pattern, symbolId, confidence = 0.85) {
    this.patternRules.push({ pattern, symbolId, confidence });
  }

  /**
   * Initialize common pattern rules
   */
  initializePatternRules() {
    // Warrior patterns
    this.addPatternRule(/\b(warrior|fighter|soldier|combatant)\b/i, 'warrior', 0.85);
    this.addPatternRule(/\b(samurai|ronin)\b/i, 'samurai', 0.9);
    this.addPatternRule(/\b(knight|paladin)\b/i, 'warrior', 0.85);
    this.addPatternRule(/\b(ninja|shinobi)\b/i, 'ninja', 0.9);

    // Leader patterns
    this.addPatternRule(/\b(king|queen|monarch|royalty)\b/i, 'king', 0.85);
    this.addPatternRule(/\b(emperor|empress)\b/i, 'emperor', 0.85);
    this.addPatternRule(/\b(ruler|sovereign|leader)\b/i, 'ruler', 0.8);
    this.addPatternRule(/\b(pharaoh)\b/i, 'pharaoh', 0.95);

    // Spiritual patterns
    this.addPatternRule(/\b(monk|meditation|zen)\b/i, 'monk', 0.85);
    this.addPatternRule(/\b(sage|wise\s+one|mentor)\b/i, 'sage', 0.85);
    this.addPatternRule(/\b(shaman|medicine\s+man)\b/i, 'shaman', 0.9);
    this.addPatternRule(/\b(guru|teacher|master)\b/i, 'guru', 0.85);
    this.addPatternRule(/\b(buddha|enlighten)\b/i, 'buddha', 0.9);
    this.addPatternRule(/\b(prophet|messenger)\b/i, 'prophet', 0.85);

    // Place patterns
    this.addPatternRule(/\b(mountain|peak|summit)\b/i, 'mountain', 0.85);
    this.addPatternRule(/\b(ocean|sea|waters)\b/i, 'ocean', 0.85);
    this.addPatternRule(/\b(forest|woods|jungle)\b/i, 'forest', 0.85);
    this.addPatternRule(/\b(desert|wasteland|dunes)\b/i, 'desert', 0.85);
    this.addPatternRule(/\b(temple|shrine|sanctuary)\b/i, 'temple', 0.85);
    this.addPatternRule(/\b(castle|fortress|citadel)\b/i, 'fortress', 0.85);
    this.addPatternRule(/\b(cave|cavern|grotto)\b/i, 'cave', 0.85);
    this.addPatternRule(/\b(river|stream|creek)\b/i, 'river', 0.85);
    this.addPatternRule(/\b(garden|orchard|paradise)\b/i, 'garden', 0.85);
    this.addPatternRule(/\b(tower|spire|minaret)\b/i, 'tower', 0.85);
    this.addPatternRule(/\b(bridge|crossing|span)\b/i, 'bridge', 0.85);
    this.addPatternRule(/\b(labyrinth|maze)\b/i, 'labyrinth', 0.9);

    // Object patterns
    this.addPatternRule(/\b(sword|blade|katana)\b/i, 'sword', 0.85);
    this.addPatternRule(/\b(shield|buckler)\b/i, 'shield', 0.85);
    this.addPatternRule(/\b(bow|arrow|archery)\b/i, 'bow', 0.85);
    this.addPatternRule(/\b(hammer|mallet)\b/i, 'hammer_tool', 0.85);
    this.addPatternRule(/\b(book|tome|grimoire)\b/i, 'book', 0.85);
    this.addPatternRule(/\b(key|unlock)\b/i, 'key', 0.85);
    this.addPatternRule(/\b(mirror|reflection)\b/i, 'mirror', 0.85);
    this.addPatternRule(/\b(ring|band)\b/i, 'ring', 0.8);
    this.addPatternRule(/\b(crown|tiara|diadem)\b/i, 'crown', 0.85);
    this.addPatternRule(/\b(scroll|parchment)\b/i, 'scroll', 0.85);
    this.addPatternRule(/\b(lamp|lantern)\b/i, 'lamp', 0.85);
    this.addPatternRule(/\b(candle|taper)\b/i, 'candle', 0.85);
    this.addPatternRule(/\b(chain|shackle|fetter)\b/i, 'chain', 0.85);
    this.addPatternRule(/\b(bell|chime)\b/i, 'bell', 0.85);
    this.addPatternRule(/\b(chalice|grail|goblet)\b/i, 'chalice', 0.85);
    this.addPatternRule(/\b(crystal|gem|jewel)\b/i, 'crystal', 0.85);

    // Concept patterns
    this.addPatternRule(/\b(love|affection|romance)\b/i, 'love', 0.85);
    this.addPatternRule(/\b(death|mortality|end)\b/i, 'death', 0.85);
    this.addPatternRule(/\b(birth|beginning|origin)\b/i, 'birth', 0.85);
    this.addPatternRule(/\b(wisdom|knowledge|insight)\b/i, 'wisdom_concept', 0.85);
    this.addPatternRule(/\b(courage|bravery|valor)\b/i, 'courage', 0.85);
    this.addPatternRule(/\b(justice|fairness|equity)\b/i, 'justice', 0.85);
    this.addPatternRule(/\b(peace|tranquility|harmony)\b/i, 'peace', 0.85);
    this.addPatternRule(/\b(war|conflict|battle)\b/i, 'war', 0.85);
    this.addPatternRule(/\b(fear|terror|dread)\b/i, 'fear', 0.85);
    this.addPatternRule(/\b(joy|happiness|bliss)\b/i, 'joy', 0.85);
    this.addPatternRule(/\b(sorrow|grief|sadness)\b/i, 'sorrow', 0.85);
    this.addPatternRule(/\b(truth|reality|fact)\b/i, 'truth', 0.85);
    this.addPatternRule(/\b(chaos|disorder|entropy)\b/i, 'chaos', 0.85);
    this.addPatternRule(/\b(order|structure|pattern)\b/i, 'order', 0.85);
    this.addPatternRule(/\b(unity|oneness|wholeness)\b/i, 'unity', 0.85);
    this.addPatternRule(/\b(duality|polarity|opposition)\b/i, 'duality', 0.85);
    this.addPatternRule(/\b(infinity|eternal|endless)\b/i, 'infinity', 0.85);
    this.addPatternRule(/\b(void|emptiness|nothing)\b/i, 'void', 0.85);
    this.addPatternRule(/\b(transform|change|metamorph)\b/i, 'transformation', 0.85);
    this.addPatternRule(/\b(creat|mak|build)\b/i, 'creation', 0.75);
    this.addPatternRule(/\b(destroy|break|ruin)\b/i, 'destruction', 0.75);
    this.addPatternRule(/\b(freedom|liberty|liberation)\b/i, 'freedom', 0.85);

    // Element patterns
    this.addPatternRule(/\b(fire|flame|blaze)\b/i, 'fire', 0.9);
    this.addPatternRule(/\b(water|aqua|liquid)\b/i, 'water', 0.9);
    this.addPatternRule(/\b(earth|ground|soil)\b/i, 'earth_element', 0.9);
    this.addPatternRule(/\b(air|wind|breeze)\b/i, 'air', 0.9);
    this.addPatternRule(/\b(sun|solar|sunlight)\b/i, 'sun', 0.9);
    this.addPatternRule(/\b(moon|lunar|moonlight)\b/i, 'moon_element', 0.9);
    this.addPatternRule(/\b(star|stellar|constellation)\b/i, 'stars', 0.85);
    this.addPatternRule(/\b(thunder|thunderbolt)\b/i, 'thunder', 0.9);
    this.addPatternRule(/\b(lightning|bolt)\b/i, 'lightning', 0.85);
    this.addPatternRule(/\b(rain|rainfall|shower)\b/i, 'rain', 0.85);
    this.addPatternRule(/\b(snow|frost|ice)\b/i, 'snow', 0.85);
    this.addPatternRule(/\b(storm|tempest|hurricane)\b/i, 'storm', 0.9);
    this.addPatternRule(/\b(rainbow|spectrum)\b/i, 'rainbow', 0.9);
    this.addPatternRule(/\b(tree|oak|pine|elm)\b/i, 'tree', 0.85);
    this.addPatternRule(/\b(flower|blossom|bloom)\b/i, 'flower', 0.85);
    this.addPatternRule(/\b(stone|rock|boulder)\b/i, 'stone', 0.85);
    this.addPatternRule(/\b(gold|golden)\b/i, 'gold', 0.85);
    this.addPatternRule(/\b(silver|silvery)\b/i, 'silver', 0.85);

    // Archetype patterns
    this.addPatternRule(/\b(hero|protagonist|champion)\b/i, 'hero', 0.85);
    this.addPatternRule(/\b(trickster|deceiver|jester)\b/i, 'trickster', 0.85);
    this.addPatternRule(/\b(mother|maternal|nurturer)\b/i, 'mother', 0.85);
    this.addPatternRule(/\b(father|paternal|protector)\b/i, 'father', 0.85);
    this.addPatternRule(/\b(child|innocent|youth)\b/i, 'child', 0.85);
    this.addPatternRule(/\b(explorer|adventurer|seeker)\b/i, 'explorer', 0.85);
    this.addPatternRule(/\b(magician|wizard|sorcerer)\b/i, 'magician', 0.85);
    this.addPatternRule(/\b(guardian|protector|defender)\b/i, 'guardian', 0.85);
    this.addPatternRule(/\b(creator|maker|artist)\b/i, 'creator', 0.8);
    this.addPatternRule(/\b(destroyer|annihilator)\b/i, 'destroyer', 0.85);
    this.addPatternRule(/\b(shadow|dark\s+side)\b/i, 'shadow', 0.85);

    // Mythology patterns
    this.addPatternRule(/\b(zeus|jupiter)\b/i, 'zeus', 0.95);
    this.addPatternRule(/\b(athena|minerva)\b/i, 'athena', 0.95);
    this.addPatternRule(/\b(thor|thunder\s+god)\b/i, 'thor', 0.95);
    this.addPatternRule(/\b(odin|allfather)\b/i, 'odin', 0.95);
    this.addPatternRule(/\b(anubis|jackal)\b/i, 'anubis', 0.95);
    this.addPatternRule(/\b(shiva|nataraja)\b/i, 'shiva', 0.95);
    this.addPatternRule(/\b(ganesh|ganesha|elephant\s+god)\b/i, 'ganesh', 0.95);
    this.addPatternRule(/\b(quetzalcoatl|feathered\s+serpent)\b/i, 'quetzalcoatl', 0.95);
  }

  /**
   * Match entity against pattern rules
   */
  matchPattern(text) {
    for (const rule of this.patternRules) {
      if (rule.pattern.test(text)) {
        const symbol = this.database.getSymbol(rule.symbolId);
        if (symbol) {
          return {
            symbol,
            confidence: rule.confidence,
            method: InferenceMethod.REGEX
          };
        }
      }
    }
    return null;
  }

  /**
   * Semantic similarity matching using word overlap
   */
  semanticMatch(text) {
    const words = text.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    const candidates = this.database.search(text);
    
    for (const symbol of candidates) {
      const symbolWords = symbol.meaning.toLowerCase().split(/[\s\-]+/);
      const overlapCount = words.filter(word =>
        symbolWords.some(sw => sw.includes(word) || word.includes(sw))
      ).length;

      const score = overlapCount / Math.max(words.length, symbolWords.length);

      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = {
          symbol,
          confidence: Math.min(0.75, score),
          method: InferenceMethod.SEMANTIC
        };
      }
    }

    return bestMatch;
  }

  /**
   * Category-based fallback mapping
   */
  categoryFallback(text) {
    const categoryKeywords = {
      person: 'everyman',
      people: 'everyman',
      human: 'everyman',
      place: 'path',
      location: 'path',
      object: 'crystal',
      thing: 'crystal',
      tool: 'key',
      concept: 'light',
      idea: 'light',
      element: 'ether',
      nature: 'tree',
      animal: 'hero',
      creature: 'hero'
    };

    for (const [keyword, symbolId] of Object.entries(categoryKeywords)) {
      if (text.includes(keyword)) {
        const symbol = this.database.getSymbol(symbolId);
        if (symbol) {
          return {
            symbol,
            confidence: 0.5,
            method: InferenceMethod.CATEGORY_FALLBACK
          };
        }
      }
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // Resonance-Enhanced Inference Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Convert a symbol to SparsePrimeState for resonance calculations
   */
  symbolToState(symbol) {
    const state = new SparsePrimeState(4096, 8);
    
    // Primary prime activation
    state.set(symbol.prime, new Complex(1.0, 0), null);
    
    // Add related primes based on cultural tags
    let idx = 0;
    for (const tag of symbol.culturalTags.slice(0, 7)) {
      const related = this.database.getSymbolsByTag(tag);
      if (related && related.length > 1) {
        const relatedSymbol = related.find(s => s.id !== symbol.id);
        if (relatedSymbol) {
          const phase = (2 * Math.PI * idx) / 8;
          state.set(relatedSymbol.prime, new Complex(0.3 * Math.cos(phase), 0.3 * Math.sin(phase)), null);
          idx++;
        }
      }
    }
    
    return state;
  }

  /**
   * Calculate resonance between candidate symbols
   * Returns weighted scores based on how well symbols "harmonize"
   */
  calculateCandidateResonance(candidates) {
    if (candidates.length <= 1) {
      return candidates.map(c => ({ ...c, resonanceBonus: 0 }));
    }

    const resonanceCalc = new ResonanceCalculator();
    const resonances = [];

    for (let i = 0; i < candidates.length; i++) {
      let totalResonance = 0;
      for (let j = 0; j < candidates.length; j++) {
        if (i !== j) {
          totalResonance += resonanceCalc.calculateResonance(
            candidates[i].symbol.prime,
            candidates[j].symbol.prime
          );
        }
      }
      resonances.push({
        ...candidates[i],
        resonanceBonus: totalResonance / (candidates.length - 1),
        avgResonance: totalResonance / (candidates.length - 1)
      });
    }

    return resonances;
  }

  /**
   * Use resonance attention to select the best symbol set
   * This finds symbols that "harmonize" together
   */
  resonanceSelect(candidates, context = null) {
    if (candidates.length === 0) return [];
    if (candidates.length === 1) return candidates;

    // Convert all candidates to states
    const states = candidates.map(c => this.symbolToState(c.symbol));
    
    // Create context state or use first candidate
    let queryState;
    if (context) {
      queryState = this.symbolToState(context);
    } else {
      queryState = states[0];
    }

    // Apply resonant attention
    const result = resonantAttention(queryState, states, states);
    if (!result) return candidates;

    // Rank candidates by attention weight
    const ranked = candidates.map((c, i) => ({
      ...c,
      attentionWeight: result.weights[i],
      resonanceScore: result.scores[i]
    }));

    return ranked.sort((a, b) => b.attentionWeight - a.attentionWeight);
  }

  /**
   * Infer symbols with resonance-based disambiguation
   * This finds the most harmonious set of symbols for the text
   */
  inferWithResonance(text, options = {}) {
    const { maxCandidates = 10, useAttention = true } = options;
    
    // Extract entities and infer candidates
    const extractor = new EntityExtractor();
    const entities = extractor.extract(text);
    const candidates = this.inferSymbols(entities);
    
    if (candidates.length <= 1) {
      return candidates;
    }

    // Calculate resonance between candidates
    const withResonance = this.calculateCandidateResonance(candidates);
    
    if (useAttention) {
      // Use resonant attention for final selection
      const selected = this.resonanceSelect(withResonance);
      return selected.slice(0, maxCandidates);
    }
    
    // Sort by combined confidence + resonance
    withResonance.sort((a, b) => {
      const scoreA = a.confidence + (a.resonanceBonus * 0.3);
      const scoreB = b.confidence + (b.resonanceBonus * 0.3);
      return scoreB - scoreA;
    });
    
    return withResonance.slice(0, maxCandidates);
  }

  /**
   * Find the most resonant symbol for a given context
   * Uses resonance attention to find what "fits best"
   */
  inferMostResonant(text, contextSymbols = []) {
    const candidates = this.inferSymbols([text]);
    if (candidates.length === 0) return null;
    
    if (contextSymbols.length === 0) {
      return candidates[0];
    }
    
    const resonanceCalc = new ResonanceCalculator();
    
    // Score each candidate by resonance with context
    let bestCandidate = null;
    let bestScore = -Infinity;
    
    for (const candidate of candidates) {
      let totalResonance = 0;
      for (const contextSymbol of contextSymbols) {
        totalResonance += resonanceCalc.calculateResonance(
          candidate.symbol.prime,
          contextSymbol.prime
        );
      }
      const avgResonance = totalResonance / contextSymbols.length;
      
      if (avgResonance > bestScore) {
        bestScore = avgResonance;
        bestCandidate = {
          ...candidate,
          contextResonance: avgResonance
        };
      }
    }
    
    return bestCandidate;
  }

  /**
   * Get confidence statistics for a batch of inferences
   */
  getConfidenceStats(results) {
    if (results.length === 0) {
      return { average: 0, high: 0, medium: 0, low: 0 };
    }

    const confidences = results.map(r => r.confidence);
    const sum = confidences.reduce((a, b) => a + b, 0);
    
    return {
      average: sum / results.length,
      high: results.filter(r => r.confidence >= 0.8).length,
      medium: results.filter(r => r.confidence >= 0.5 && r.confidence < 0.8).length,
      low: results.filter(r => r.confidence < 0.5).length
    };
  }

  /**
   * Get method distribution for a batch of inferences
   */
  getMethodStats(results) {
    const methods = {};
    for (const method of Object.values(InferenceMethod)) {
      methods[method] = 0;
    }
    
    for (const result of results) {
      if (result.method) {
        methods[result.method]++;
      }
    }
    
    return methods;
  }

  /**
   * Get all pattern rules (for inspection)
   */
  getPatternRules() {
    return this.patternRules.map(r => ({
      pattern: r.pattern.toString(),
      symbolId: r.symbolId,
      confidence: r.confidence
    }));
  }

  /**
   * Clear all custom pattern rules (keeps defaults)
   */
  resetPatternRules() {
    this.patternRules = [];
    this.initializePatternRules();
  }
}

// ═══════════════════════════════════════════════════════════════════
// Entity Extractor (Simple NER-like extraction)
// ═══════════════════════════════════════════════════════════════════

class EntityExtractor {
  constructor() {
    // Patterns for extracting entities from text
    this.entityPatterns = [
      // Capitalized words (potential proper nouns)
      { pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g, type: 'proper_noun' },
      // Quoted strings
      { pattern: /"([^"]+)"/g, type: 'quoted' },
      // The X, A X
      { pattern: /\b(?:the|a|an)\s+([a-z]+(?:\s+[a-z]+)?)\b/gi, type: 'definite' },
    ];
  }

  /**
   * Extract entities from text
   */
  extract(text) {
    const entities = new Set();
    
    for (const { pattern, type } of this.entityPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const entity = match[1] || match[0];
        if (entity.length > 2) {
          entities.add(entity.toLowerCase().trim());
        }
      }
    }
    
    return Array.from(entities);
  }

  /**
   * Extract and infer symbols from text
   */
  extractAndInfer(text, inference) {
    const entities = this.extract(text);
    return inference.inferSymbols(entities);
  }
}

// Singleton instances
const defaultInference = new SemanticInference();
const defaultExtractor = new EntityExtractor();

export default {
  SemanticInference,
  EntityExtractor,
  InferenceMethod,
  
  // Singleton instances
  semanticInference: defaultInference,
  entityExtractor: defaultExtractor,
  
  // Convenience functions
  inferSymbol: (text) => defaultInference.inferSymbol(text),
  inferSymbols: (entities) => defaultInference.inferSymbols(entities),
  
  // Resonance-enhanced inference
  inferWithResonance: (text, options) => defaultInference.inferWithResonance(text, options),
  inferMostResonant: (text, contextSymbols) => defaultInference.inferMostResonant(text, contextSymbols),
  extractEntities: (text) => defaultExtractor.extract(text),
  extractAndInfer: (text) => defaultExtractor.extractAndInfer(text, defaultInference)
};