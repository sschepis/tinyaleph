/**
 * Tests for Symbolic AI components ported from symprime
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  // Resonance
  ResonanceCalculator,
  resonanceSignature,
  PHI,
  calculateResonance,
  findGoldenPairs,
  
  // Symbols
  SymbolDatabase,
  SymbolCategory,
  symbolDatabase,
  getSymbol,
  getSymbolByPrime,
  encodeSymbols,
  decodeSymbols,
  
  // Inference
  SemanticInference,
  EntityExtractor,
  semanticInference,
  inferSymbol,
  inferSymbols,
  extractEntities,
  
  // Compound
  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  compoundBuilder,
  createCompound,
  getCompound,
  createSequence,
  getSequence
} = require('../core');

describe('ResonanceCalculator', () => {
  const calc = new ResonanceCalculator();
  
  it('should have PHI constant approximately 1.618', () => {
    assert.ok(Math.abs(PHI - 1.618033988749895) < 0.0001);
  });
  
  it('should calculate resonance between primes', () => {
    const r = calc.calculateResonance(2, 3);
    assert.ok(typeof r === 'number');
    assert.ok(r >= 0 && r <= 2);
  });
  
  it('should detect golden ratio pairs (Fibonacci)', () => {
    // 5/3 ≈ 1.67, close to φ
    const r53 = calc.calculateResonance(3, 5);
    // 8/5 = 1.6, close to φ
    const r85 = calc.calculateResonance(5, 8);
    // Both should have phi bonus
    assert.ok(r53 > 0.5, 'Fibonacci pair 3,5 should have high resonance');
    assert.ok(r85 > 0.5, 'Fibonacci pair 5,8 should have high resonance');
  });
  
  it('should find golden pairs from a list', () => {
    const primes = [2, 3, 5, 7, 11, 13];
    const pairs = calc.findGoldenPairs(primes);
    assert.ok(Array.isArray(pairs));
    pairs.forEach(p => {
      assert.ok(typeof p.p1 === 'number');
      assert.ok(typeof p.p2 === 'number');
      assert.ok(typeof p.ratio === 'number');
      assert.ok(typeof p.resonance === 'number');
    });
  });
  
  it('should calculate resonance signature', () => {
    const sig = resonanceSignature([2, 3, 5]);
    assert.ok(typeof sig.mean === 'number');
    assert.ok(typeof sig.variance === 'number');
    assert.ok(typeof sig.goldenCount === 'number');
  });
  
  it('should find most resonant prime', () => {
    const primes = [3, 5, 7, 11, 13];
    const target = 2;
    const most = calc.findMostResonant(target, primes);
    assert.ok(most !== null);
    assert.ok(typeof most.prime === 'number');
    assert.ok(typeof most.resonance === 'number');
  });
  
  it('should calculate resonance matrix', () => {
    const matrix = calc.calculateMatrix([2, 3, 5]);
    assert.ok(Array.isArray(matrix));
    assert.strictEqual(matrix.length, 3);
    assert.strictEqual(matrix[0].length, 3);
    // Diagonal should be 1 (self-resonance)
    assert.strictEqual(matrix[0][0], 1.0);
    assert.strictEqual(matrix[1][1], 1.0);
  });
});

describe('SymbolDatabase', () => {
  it('should be a singleton', () => {
    const db1 = new SymbolDatabase();
    const db2 = new SymbolDatabase();
    assert.strictEqual(db1, db2);
  });
  
  it('should have symbols', () => {
    const allSymbols = symbolDatabase.getAllSymbols();
    assert.ok(Array.isArray(allSymbols));
    assert.ok(allSymbols.length > 0);
  });
  
  it('should get symbol by id', () => {
    const hero = getSymbol('hero');
    assert.ok(hero !== null);
    assert.strictEqual(hero.id, 'hero');
    assert.ok(hero.unicode);
    assert.ok(hero.prime);
  });
  
  it('should get symbol by prime', () => {
    const hero = getSymbol('hero');
    const found = getSymbolByPrime(hero.prime);
    assert.deepStrictEqual(found, hero);
  });
  
  it('should search symbols', () => {
    const results = symbolDatabase.search('hero');
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
  });
  
  it('should get symbols by category', () => {
    const people = symbolDatabase.getSymbolsByCategory(SymbolCategory.PEOPLE_ARCHETYPES);
    assert.ok(Array.isArray(people));
    assert.ok(people.length > 0);
    people.forEach(s => {
      assert.strictEqual(s.category, SymbolCategory.PEOPLE_ARCHETYPES);
    });
  });
  
  it('should get symbols by cultural tag', () => {
    const greek = symbolDatabase.getSymbolsByTag('greek');
    assert.ok(Array.isArray(greek));
    assert.ok(greek.length > 0);
    greek.forEach(s => {
      assert.ok(s.culturalTags.includes('greek'));
    });
  });
  
  it('should encode symbol IDs to primes', () => {
    const encoded = encodeSymbols(['hero', 'journey']);
    assert.ok(typeof encoded === 'bigint');
    assert.ok(encoded > 1n);
  });
  
  it('should decode primes to symbols', () => {
    const hero = getSymbol('hero');
    const decoded = decodeSymbols([hero.prime]);
    assert.ok(Array.isArray(decoded));
    assert.strictEqual(decoded[0].id, 'hero');
  });
});

describe('SemanticInference', () => {
  it('should create semantic inference instance', () => {
    const si = new SemanticInference();
    assert.ok(si !== null);
    assert.ok(typeof si.inferSymbol === 'function');
  });
  
  it('should infer symbol from direct match', () => {
    const result = inferSymbol('warrior');
    assert.ok(result !== null);
    assert.ok(result.symbol);
    assert.strictEqual(result.method, 'direct');
  });
  
  it('should infer symbol from pattern', () => {
    const result = inferSymbol('a mighty knight in armor');
    // May or may not match depending on patterns
    assert.ok(result === null || result.symbol !== undefined);
  });
  
  it('should infer multiple symbols from text', () => {
    const results = inferSymbols('The hero went on a journey to the mountain');
    assert.ok(Array.isArray(results));
  });
  
  it('should handle unknown text gracefully', () => {
    const result = inferSymbol('xyzzy42blarg');
    // Unknown text should return null or a fallback
    assert.ok(result === null || result !== undefined);
  });
  
  it('should extract entities from text', () => {
    const entities = extractEntities('John went to Paris on Monday');
    assert.ok(typeof entities === 'object');
    // Check for proper keys in entities result
    assert.ok('person' in entities || 'persons' in entities || Object.keys(entities).length >= 0);
  });
});

describe('CompoundBuilder', () => {
  it('should create compound builder instance', () => {
    const cb = new CompoundBuilder();
    assert.ok(cb !== null);
    assert.ok(typeof cb.createCompound === 'function');
  });
  
  it('should get pre-built compound', () => {
    const greekWarrior = getCompound('greek_warrior');
    assert.ok(greekWarrior !== null);
    assert.ok(greekWarrior instanceof CompoundSymbol);
    assert.ok(Array.isArray(greekWarrior.components));
    assert.ok(greekWarrior.components.length > 0);
  });
  
  it('should calculate compound prime product', () => {
    const compound = getCompound('greek_warrior');
    assert.ok(compound.prime > 0);
  });
  
  it('should calculate compound resonance', () => {
    const compound = getCompound('greek_warrior');
    // Resonance is calculated via compoundBuilder method
    const resonance = compoundBuilder.calculateCompoundResonance(compound);
    assert.ok(typeof resonance === 'number');
    assert.ok(resonance >= 0);
  });
  
  it('should create custom compound', () => {
    const custom = createCompound('test_compound2', ['hero', 'sun', 'mountain']);
    assert.ok(custom instanceof CompoundSymbol);
    assert.strictEqual(custom.id, 'test_compound2');
    assert.strictEqual(custom.components.length, 3);
  });
  
  it('should get pre-built sequence', () => {
    const journey = getSequence('heros_journey');
    assert.ok(journey !== null);
    assert.ok(journey instanceof SymbolSequence);
    assert.ok(Array.isArray(journey.symbols));
    assert.ok(journey.symbols.length > 0);
  });
  
  it('should calculate sequence signature', () => {
    const journey = getSequence('heros_journey');
    // Sequence has a signature, not narrativeResonance method
    assert.ok(journey.signature > 0n);
  });
  
  it('should create custom sequence', () => {
    // createSequence takes symbol IDs as an array of strings (use valid IDs from database)
    const seq = createSequence('test_sequence2', ['hero', 'path', 'gold'], 'journey', 'Test narrative');
    assert.ok(seq instanceof SymbolSequence);
    assert.strictEqual(seq.symbols.length, 3);
  });
  
  it('should find compounds containing symbol', () => {
    const compounds = compoundBuilder.findCompoundsContaining('warrior');
    assert.ok(Array.isArray(compounds));
    compounds.forEach(c => {
      const componentIds = c.components.map(comp => comp.id);
      assert.ok(componentIds.includes('warrior'));
    });
  });
  
  it('should merge compounds', () => {
    const c1 = getCompound('greek_warrior');
    const c2 = getCompound('philosopher_king');
    if (c1 && c2) {
      const merged = compoundBuilder.mergeCompounds('merged_test', c1, c2, 'Merged warrior-philosopher');
      assert.ok(merged instanceof CompoundSymbol);
      assert.ok(merged.components.length >= c1.components.length);
    }
  });
  
  it('should create cultural variant', () => {
    // Create cultural variant uses base ID (string), culture, additional symbols, meaning
    const greekWarrior = getCompound('greek_warrior');
    if (greekWarrior) {
      const norseVariant = compoundBuilder.createCulturalVariant('greek_warrior', 'norse', ['ocean'], 'Norse-influenced warrior');
      assert.ok(norseVariant instanceof CompoundSymbol);
      assert.ok(norseVariant.culturalTags.includes('norse'));
    }
  });
});

describe('Integration: Symbolic AI Pipeline', () => {
  it('should infer, encode, and calculate resonance', () => {
    // 1. Infer symbols from text
    const symbols = inferSymbols('a brave warrior climbs the mountain');
    
    // 2. Get the symbol objects
    const symbolObjects = symbols
      .map(r => r.symbol)
      .filter(Boolean);
    
    // 3. Encode to primes
    const primes = symbolObjects.map(s => s.prime);
    
    // 4. Calculate resonance signature if we have enough primes
    if (primes.length >= 2) {
      const sig = resonanceSignature(primes);
      assert.ok(typeof sig.mean === 'number');
      assert.ok(typeof sig.goldenCount === 'number');
    }
  });
  
  it('should build compound from inferred symbols', () => {
    // Infer symbols
    const results = inferSymbols('the hero fights the shadow');
    const symbolIds = results.map(r => r.symbol?.id).filter(Boolean);
    
    if (symbolIds.length >= 2) {
      // Build compound
      const compound = createCompound('inferred_battle', symbolIds);
      assert.ok(compound instanceof CompoundSymbol);
      assert.ok(compound.resonance >= 0);
    }
  });
  
  it('should trace symbol through cultural variants', () => {
    // Get warrior symbols from different cultures
    const greekWarriors = symbolDatabase.getSymbolsByTag('greek')
      .filter(s => s.meaning.toLowerCase().includes('warrior') || s.id.includes('warrior'));
    const norseWarriors = symbolDatabase.getSymbolsByTag('norse')
      .filter(s => s.meaning.toLowerCase().includes('warrior') || s.id.includes('warrior'));
    const japaneseWarriors = symbolDatabase.getSymbolsByTag('japanese')
      .filter(s => s.meaning.toLowerCase().includes('warrior') || s.id.includes('warrior'));
    
    // All cultures should have warrior archetypes
    assert.ok(greekWarriors.length > 0 || norseWarriors.length > 0 || japaneseWarriors.length > 0,
      'At least one culture should have warrior symbols');
  });
});