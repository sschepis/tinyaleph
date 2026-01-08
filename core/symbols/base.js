/**
 * Symbol Database Base Infrastructure
 * 
 * Provides the core SymbolDatabase class and utilities for loading
 * symbol definition files. Symbol definitions are stored in separate
 * files for easy maintenance and extension.
 */

// ═══════════════════════════════════════════════════════════════════
// Symbol Categories
// ═══════════════════════════════════════════════════════════════════

const SymbolCategory = {
  // Original categories
  PEOPLE_ARCHETYPES: 'people_archetypes',
  PLACES_LOCATIONS: 'places_locations',
  OBJECTS_TOOLS: 'objects_tools',
  ABSTRACT_CONCEPTS: 'abstract_concepts',
  NATURAL_ELEMENTS: 'natural_elements',
  
  // Divination systems
  ICHING_HEXAGRAMS: 'iching_hexagrams',
  TAROT_MAJOR_ARCANA: 'tarot_major_arcana',
  TAROT_MINOR_ARCANA: 'tarot_minor_arcana',
  
  // Ancient writing systems
  EGYPTIAN_HIEROGLYPHS: 'egyptian_hieroglyphs',
  
  // Alchemical
  ALCHEMICAL_SYMBOLS: 'alchemical_symbols',
  
  // Astrological
  ZODIAC_SIGNS: 'zodiac_signs',
  PLANETARY_SYMBOLS: 'planetary_symbols'
};

// ═══════════════════════════════════════════════════════════════════
// Prime Generator (Sieve of Eratosthenes)
// ═══════════════════════════════════════════════════════════════════

class PrimeGenerator {
  constructor(limit = 20000) {
    this.primes = [];
    this.generatePrimes(limit);
  }

  generatePrimes(limit) {
    const sieve = new Array(limit + 1).fill(true);
    sieve[0] = sieve[1] = false;

    for (let i = 2; i * i <= limit; i++) {
      if (sieve[i]) {
        for (let j = i * i; j <= limit; j += i) {
          sieve[j] = false;
        }
      }
    }

    for (let i = 2; i <= limit; i++) {
      if (sieve[i]) {
        this.primes.push(i);
      }
    }
  }

  getNthPrime(n) {
    if (n < this.primes.length) {
      return this.primes[n];
    }
    let candidate = this.primes[this.primes.length - 1] + 1;
    while (this.primes.length <= n) {
      if (this.isPrime(candidate)) {
        this.primes.push(candidate);
      }
      candidate++;
    }
    return this.primes[n];
  }

  isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    const sqrt = Math.sqrt(n);
    for (let i = 3; i <= sqrt; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Symbol Database (Singleton)
// ═══════════════════════════════════════════════════════════════════

let singletonInstance = null;

class SymbolDatabase {
  constructor() {
    // Singleton pattern - return existing instance if already created
    if (singletonInstance) {
      return singletonInstance;
    }
    
    this.symbols = new Map();
    this.primeToSymbol = new Map();
    this.unicodeToSymbol = new Map();
    this.categoryIndex = new Map();
    this.tagIndex = new Map();
    this.primeGenerator = new PrimeGenerator();
    this.nextPrimeIndex = 0;
    
    singletonInstance = this;
  }

  // ─────────────────────────────────────────────────────────────────
  // Symbol Registration
  // ─────────────────────────────────────────────────────────────────

  /**
   * Register a batch of symbols from a definition file
   * @param {Array} symbolDefs - Array of symbol definitions
   */
  registerSymbols(symbolDefs) {
    for (const def of symbolDefs) {
      this.registerSymbol(def);
    }
  }

  /**
   * Register a single symbol
   * @param {Object} symbolDef - Symbol definition
   * @returns {Object} - Registered symbol with prime
   */
  registerSymbol(symbolDef) {
    // Check for duplicate
    if (this.symbols.has(symbolDef.id)) {
      return this.symbols.get(symbolDef.id);
    }

    const prime = this.primeGenerator.getNthPrime(this.nextPrimeIndex++);
    const symbol = {
      ...symbolDef,
      prime,
      category: symbolDef.category || SymbolCategory.ABSTRACT_CONCEPTS,
      culturalTags: symbolDef.culturalTags || ['custom']
    };

    this.symbols.set(symbol.id, symbol);
    this.primeToSymbol.set(prime, symbol);
    
    // Handle compound unicode (multiple emoji)
    if (symbol.unicode) {
      this.unicodeToSymbol.set(symbol.unicode, symbol);
    }

    // Category index
    if (!this.categoryIndex.has(symbol.category)) {
      this.categoryIndex.set(symbol.category, []);
    }
    this.categoryIndex.get(symbol.category).push(symbol);

    // Tag index
    for (const tag of symbol.culturalTags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, []);
      }
      this.tagIndex.get(tag).push(symbol);
    }

    return symbol;
  }

  // ─────────────────────────────────────────────────────────────────
  // Lookup Methods
  // ─────────────────────────────────────────────────────────────────

  getSymbol(id) {
    return this.symbols.get(id);
  }

  getSymbolByPrime(prime) {
    return this.primeToSymbol.get(prime);
  }

  getSymbolByUnicode(unicode) {
    return this.unicodeToSymbol.get(unicode);
  }

  getSymbolsByCategory(category) {
    return this.categoryIndex.get(category) || [];
  }

  getSymbolsByTag(tag) {
    return this.tagIndex.get(tag) || [];
  }

  getAllSymbols() {
    return Array.from(this.symbols.values());
  }

  getSymbolCount() {
    return this.symbols.size;
  }

  getAllCategories() {
    return Array.from(this.categoryIndex.keys());
  }

  getAllTags() {
    return Array.from(this.tagIndex.keys());
  }

  // ─────────────────────────────────────────────────────────────────
  // Search Methods
  // ─────────────────────────────────────────────────────────────────

  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllSymbols().filter(symbol =>
      symbol.meaning.toLowerCase().includes(lowerQuery) ||
      symbol.culturalTags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      symbol.id.toLowerCase().includes(lowerQuery)
    );
  }

  findByMeaning(text) {
    const words = text.toLowerCase().split(/\s+/);
    const results = [];
    
    for (const symbol of this.symbols.values()) {
      const meaningWords = symbol.meaning.toLowerCase().split(/\s+/);
      const matches = words.filter(w => meaningWords.some(m => m.includes(w)));
      if (matches.length > 0) {
        results.push({ symbol, score: matches.length / words.length });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  // ─────────────────────────────────────────────────────────────────
  // Encoding/Decoding
  // ─────────────────────────────────────────────────────────────────

  encode(symbolIds) {
    let product = 1n;
    for (const id of symbolIds) {
      const symbol = this.symbols.get(id);
      if (symbol) {
        product *= BigInt(symbol.prime);
      }
    }
    return product;
  }

  decode(signature) {
    const symbols = [];
    let remaining = typeof signature === 'bigint' ? signature : BigInt(signature);
    
    for (const [prime, symbol] of this.primeToSymbol) {
      const bigPrime = BigInt(prime);
      while (remaining % bigPrime === 0n) {
        symbols.push(symbol);
        remaining /= bigPrime;
      }
      if (remaining === 1n) break;
    }
    
    return symbols;
  }

  // ─────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────

  getStats() {
    const stats = {
      totalSymbols: this.symbols.size,
      byCategory: {},
      topTags: []
    };

    for (const [category, symbols] of this.categoryIndex) {
      stats.byCategory[category] = symbols.length;
    }

    const tagCounts = [];
    for (const [tag, symbols] of this.tagIndex) {
      tagCounts.push({ tag, count: symbols.length });
    }
    stats.topTags = tagCounts.sort((a, b) => b.count - a.count).slice(0, 20);

    return stats;
  }
}

module.exports = {
  SymbolDatabase,
  SymbolCategory,
  PrimeGenerator
};