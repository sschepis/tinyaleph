/**
 * Compound Builder
 * 
 * Creates and manages multi-symbol concepts through prime multiplication.
 * Enables cultural modulation - the same base concept with different cultural overlays.
 * 
 * Example: 
 *   greek_warrior = warrior × temple × eagle
 *   viking_warrior = warrior × ocean × shield
 *   samurai_warrior = warrior × garden × monk
 * 
 * All share the warrior archetype but with cultural differentiation.
 * 
 * Ported from symprime's CompoundBuilder system.
 */

const { symbolDatabase, SymbolCategory } = require('./symbols');
const { ResonanceCalculator } = require('./resonance');

// ═══════════════════════════════════════════════════════════════════
// Compound Symbol Type
// ═══════════════════════════════════════════════════════════════════

/**
 * A compound symbol is a combination of multiple base symbols
 * with a unified meaning and cultural context.
 */
class CompoundSymbol {
  constructor(id, components, meaning, culturalTags = []) {
    this.id = id;
    this.components = components;  // Array of base symbols
    this.meaning = meaning;
    this.culturalTags = culturalTags;
    
    // Calculate combined prime signature (product of primes)
    this.prime = this.calculatePrime();
    
    // Combined unicode representation
    this.unicode = components.map(c => c.unicode).join('');
    
    // Metadata
    this.metadata = {
      componentCount: components.length,
      componentIds: components.map(c => c.id),
      createdAt: Date.now()
    };
  }

  calculatePrime() {
    let product = 1n;
    for (const component of this.components) {
      product *= BigInt(component.prime);
    }
    return product;
  }

  toJSON() {
    return {
      id: this.id,
      unicode: this.unicode,
      prime: this.prime.toString(),
      meaning: this.meaning,
      culturalTags: this.culturalTags,
      components: this.components.map(c => c.id),
      metadata: this.metadata
    };
  }

  toString() {
    return `${this.unicode} (${this.id}): ${this.meaning}`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Symbol Sequence Type
// ═══════════════════════════════════════════════════════════════════

/**
 * A symbol sequence represents a narrative or temporal ordering
 * of symbols (e.g., hero's journey stages).
 */
class SymbolSequence {
  constructor(id, symbols, type, description = '') {
    this.id = id;
    this.symbols = symbols;  // Ordered array of symbols
    this.type = type;        // 'narrative', 'journey', 'transformation', etc.
    this.description = description;
    
    // Combined signature (product of primes)
    this.signature = this.calculateSignature();
    
    // Temporal metadata
    this.temporal = {
      order: symbols.map((_, i) => i),
      duration: null,
      startTime: null
    };
  }

  calculateSignature() {
    let product = 1n;
    for (const symbol of this.symbols) {
      product *= BigInt(symbol.prime);
    }
    return product;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      symbols: this.symbols.map(s => s.id),
      signature: this.signature.toString(),
      temporal: this.temporal
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Compound Builder
// ═══════════════════════════════════════════════════════════════════

class CompoundBuilder {
  constructor(database = symbolDatabase) {
    this.database = database;
    this.compounds = new Map();     // id → CompoundSymbol
    this.sequences = new Map();     // id → SymbolSequence
    this.resonanceCalc = new ResonanceCalculator();
    
    this.initializeCommonCompounds();
  }

  /**
   * Create a compound symbol from multiple base symbols
   */
  createCompound(id, componentIds, meaning, culturalTags = []) {
    const components = [];
    for (const cid of componentIds) {
      const symbol = this.database.getSymbol(cid);
      if (!symbol) {
        throw new Error(`Unknown symbol: ${cid}`);
      }
      components.push(symbol);
    }

    if (components.length === 0) {
      throw new Error('Compound must have at least one component');
    }

    const compound = new CompoundSymbol(id, components, meaning, culturalTags);
    this.compounds.set(id, compound);
    return compound;
  }

  /**
   * Create compound from symbol objects directly
   */
  createCompoundFromSymbols(id, components, meaning, culturalTags = []) {
    if (!components || components.length === 0) {
      throw new Error('Compound must have at least one component');
    }

    const compound = new CompoundSymbol(id, components, meaning, culturalTags);
    this.compounds.set(id, compound);
    return compound;
  }

  /**
   * Get a compound by ID
   */
  getCompound(id) {
    return this.compounds.get(id);
  }

  /**
   * Check if compound exists
   */
  hasCompound(id) {
    return this.compounds.has(id);
  }

  /**
   * Decompose a compound into its components
   */
  decompose(compound) {
    return [...compound.components];
  }

  /**
   * Create a symbol sequence (narrative)
   */
  createSequence(id, symbolIds, type, description = '') {
    const symbols = [];
    for (const sid of symbolIds) {
      const symbol = this.database.getSymbol(sid);
      if (!symbol) {
        throw new Error(`Unknown symbol: ${sid}`);
      }
      symbols.push(symbol);
    }

    if (symbols.length === 0) {
      throw new Error('Sequence must have at least one symbol');
    }

    const sequence = new SymbolSequence(id, symbols, type, description);
    this.sequences.set(id, sequence);
    return sequence;
  }

  /**
   * Get a sequence by ID
   */
  getSequence(id) {
    return this.sequences.get(id);
  }

  /**
   * Merge two compounds into a larger compound
   */
  mergeCompounds(id, compound1, compound2, meaning) {
    const allComponents = [...compound1.components, ...compound2.components];
    const allTags = [...new Set([...compound1.culturalTags, ...compound2.culturalTags])];
    
    return this.createCompoundFromSymbols(
      id,
      allComponents,
      meaning || `${compound1.meaning} + ${compound2.meaning}`,
      allTags
    );
  }

  /**
   * Create cultural variant of a base compound
   */
  createCulturalVariant(baseId, culture, additionalSymbolIds, meaning) {
    const base = this.getCompound(baseId);
    if (!base) {
      throw new Error(`Unknown base compound: ${baseId}`);
    }

    const additionalSymbols = additionalSymbolIds.map(id => {
      const s = this.database.getSymbol(id);
      if (!s) throw new Error(`Unknown symbol: ${id}`);
      return s;
    });

    const allComponents = [...base.components, ...additionalSymbols];
    const variantId = `${baseId}_${culture}`;

    return this.createCompoundFromSymbols(
      variantId,
      allComponents,
      meaning,
      [culture, ...base.culturalTags]
    );
  }

  /**
   * Initialize common compound archetypes
   */
  initializeCommonCompounds() {
    try {
      // Greek Warrior
      const warrior = this.database.getSymbol('warrior');
      const temple = this.database.getSymbol('temple');
      const athena = this.database.getSymbol('athena');
      
      if (warrior && temple && athena) {
        this.createCompoundFromSymbols(
          'greek_warrior',
          [warrior, temple, athena],
          'Greek Warrior - Temple guardian blessed by Athena',
          ['greek', 'warrior', 'mythology']
        );
      }

      // Viking Warrior
      const ocean = this.database.getSymbol('ocean');
      const shield = this.database.getSymbol('shield');
      
      if (warrior && ocean && shield) {
        this.createCompoundFromSymbols(
          'viking_warrior',
          [warrior, ocean, shield],
          'Viking Warrior - Sea raider with shield',
          ['norse', 'warrior', 'mythology']
        );
      }

      // Samurai Warrior
      const samurai = this.database.getSymbol('samurai');
      const garden = this.database.getSymbol('garden');
      const monk = this.database.getSymbol('monk');
      
      if (samurai && garden && monk) {
        this.createCompoundFromSymbols(
          'samurai_warrior',
          [samurai, garden, monk],
          'Samurai Warrior - Disciplined warrior of the cherry blossoms',
          ['japanese', 'warrior', 'honor']
        );
      }

      // Philosopher King
      const king = this.database.getSymbol('king');
      const sage = this.database.getSymbol('sage');
      const book = this.database.getSymbol('book');
      
      if (king && sage && book) {
        this.createCompoundFromSymbols(
          'philosopher_king',
          [king, sage, book],
          'Philosopher King - Wise ruler guided by knowledge',
          ['greek', 'leadership', 'wisdom']
        );
      }

      // Shadow Self
      const shadow = this.database.getSymbol('shadow');
      const mirror = this.database.getSymbol('mirror');
      
      if (shadow && mirror) {
        this.createCompoundFromSymbols(
          'shadow_self',
          [shadow, mirror],
          'Shadow Self - The dark reflection within',
          ['universal', 'psychology', 'jungian']
        );
      }

      // Hero's Journey (sequence)
      const hero = this.database.getSymbol('hero');
      const path = this.database.getSymbol('path');
      const labyrinth = this.database.getSymbol('labyrinth');
      const destroyer = this.database.getSymbol('destroyer');
      const transformation = this.database.getSymbol('transformation');
      
      if (hero && path && labyrinth && destroyer && transformation) {
        this.createSequence(
          'heros_journey',
          ['hero', 'path', 'labyrinth', 'destroyer', 'transformation'],
          'journey',
          'The monomyth pattern of departure, trials, and return'
        );
      }

      // Alchemy Transformation (sequence)
      const fire = this.database.getSymbol('fire');
      const water = this.database.getSymbol('water');
      const gold = this.database.getSymbol('gold');
      
      if (fire && water && gold) {
        this.createSequence(
          'alchemical_transformation',
          ['fire', 'water', 'gold'],
          'transformation',
          'Base elements transmuted to gold through fire and water'
        );
      }

    } catch (error) {
      console.debug('Some compound symbols could not be initialized:', error.message);
    }
  }

  /**
   * Find compounds containing a specific symbol
   */
  findCompoundsContaining(symbolId) {
    const results = [];
    for (const compound of this.compounds.values()) {
      if (compound.components.some(c => c.id === symbolId)) {
        results.push(compound);
      }
    }
    return results;
  }

  /**
   * Find sequences containing a specific symbol
   */
  findSequencesContaining(symbolId) {
    const results = [];
    for (const sequence of this.sequences.values()) {
      if (sequence.symbols.some(s => s.id === symbolId)) {
        results.push(sequence);
      }
    }
    return results;
  }

  /**
   * Calculate internal resonance of a compound
   * (How harmoniously do its components relate?)
   */
  calculateCompoundResonance(compound) {
    if (compound.components.length < 2) {
      return 1.0;  // Single component has perfect self-resonance
    }

    let totalResonance = 0;
    let pairCount = 0;

    for (let i = 0; i < compound.components.length; i++) {
      for (let j = i + 1; j < compound.components.length; j++) {
        const r = this.resonanceCalc.calculateResonance(
          compound.components[i].prime,
          compound.components[j].prime
        );
        totalResonance += r;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalResonance / pairCount : 0;
  }

  /**
   * Find the most resonant addition to a compound
   */
  findResonantAddition(compound, candidateIds) {
    let bestSymbol = null;
    let bestResonance = -1;

    for (const cid of candidateIds) {
      const symbol = this.database.getSymbol(cid);
      if (!symbol) continue;

      // Calculate average resonance with existing components
      let totalR = 0;
      for (const comp of compound.components) {
        totalR += this.resonanceCalc.calculateResonance(symbol.prime, comp.prime);
      }
      const avgR = totalR / compound.components.length;

      if (avgR > bestResonance) {
        bestResonance = avgR;
        bestSymbol = symbol;
      }
    }

    return bestSymbol ? { symbol: bestSymbol, resonance: bestResonance } : null;
  }

  /**
   * Get all registered compounds
   */
  getAllCompounds() {
    return Array.from(this.compounds.values());
  }

  /**
   * Get all registered sequences
   */
  getAllSequences() {
    return Array.from(this.sequences.values());
  }

  /**
   * Clear all compounds (keeps defaults on next init)
   */
  clearCompounds() {
    this.compounds.clear();
    this.initializeCommonCompounds();
  }

  /**
   * Clear all sequences
   */
  clearSequences() {
    this.sequences.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    const compounds = this.getAllCompounds();
    const sequences = this.getAllSequences();

    const avgComponents = compounds.length > 0
      ? compounds.reduce((sum, c) => sum + c.components.length, 0) / compounds.length
      : 0;

    const avgSymbols = sequences.length > 0
      ? sequences.reduce((sum, s) => sum + s.symbols.length, 0) / sequences.length
      : 0;

    return {
      totalCompounds: compounds.length,
      totalSequences: sequences.length,
      avgComponentsPerCompound: avgComponents,
      avgSymbolsPerSequence: avgSymbols,
      cultureTags: this.getCultureDistribution()
    };
  }

  /**
   * Get distribution of cultural tags across compounds
   */
  getCultureDistribution() {
    const dist = {};
    for (const compound of this.compounds.values()) {
      for (const tag of compound.culturalTags) {
        dist[tag] = (dist[tag] || 0) + 1;
      }
    }
    return dist;
  }
}

// Singleton instance
const defaultBuilder = new CompoundBuilder();

module.exports = {
  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  compoundBuilder: defaultBuilder,
  
  // Convenience functions
  createCompound: (id, components, meaning, tags) => 
    defaultBuilder.createCompound(id, components, meaning, tags),
  getCompound: (id) => defaultBuilder.getCompound(id),
  createSequence: (id, symbols, type, desc) => 
    defaultBuilder.createSequence(id, symbols, type, desc),
  getSequence: (id) => defaultBuilder.getSequence(id),
  findCompoundsContaining: (symbolId) => 
    defaultBuilder.findCompoundsContaining(symbolId)
};