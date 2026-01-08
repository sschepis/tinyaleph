# Symbolic AI Module API Reference

The symbolic AI module provides symbol inference, cultural tagging, compound building, and golden ratio resonance measurement.

## Symbol Database

### SymbolDatabase

Singleton database containing 184+ emoji symbols with prime assignments.

```javascript
const { symbolDatabase, SymbolDatabase } = require('./core');
```

#### Symbol Structure

```typescript
interface Symbol {
  id: string;           // Unique identifier (e.g., 'hero', 'fire')
  unicode: string;      // Emoji character (e.g., '🦸', '🔥')
  category: SymbolCategory;
  meaning: string;      // Human-readable description
  culturalTags: string[];  // ['greek', 'norse', 'universal', etc.]
  prime: number;        // Unique prime number
}

enum SymbolCategory {
  PEOPLE_ARCHETYPES = 'PEOPLE_ARCHETYPES',
  PLACES_LOCATIONS = 'PLACES_LOCATIONS',
  OBJECTS_TOOLS = 'OBJECTS_TOOLS',
  ABSTRACT_CONCEPTS = 'ABSTRACT_CONCEPTS',
  NATURAL_ELEMENTS = 'NATURAL_ELEMENTS'
}
```

#### Methods

##### `getSymbol(id: string): Symbol | null`

Get a symbol by its ID.

```javascript
const hero = symbolDatabase.getSymbol('hero');
// { id: 'hero', unicode: '🦸', prime: 1013, ... }
```

##### `getSymbolByPrime(prime: number): Symbol | null`

Get a symbol by its prime number.

```javascript
const symbol = symbolDatabase.getSymbolByPrime(1013);
// { id: 'hero', ... }
```

##### `search(query: string): Symbol[]`

Search symbols by ID, meaning, or cultural tags.

```javascript
const results = symbolDatabase.search('fire');
// [{ id: 'fire', ... }, { id: 'phoenix', ... }, ...]
```

##### `getByCategory(category: SymbolCategory): Symbol[]`

Get all symbols in a category.

```javascript
const archetypes = symbolDatabase.getByCategory(SymbolCategory.PEOPLE_ARCHETYPES);
// 50 symbols
```

##### `getSymbolsByTag(tag: string): Symbol[]`

Get symbols with a specific cultural tag.

```javascript
const greekSymbols = symbolDatabase.getSymbolsByTag('greek');
// [{ id: 'zeus', ... }, { id: 'athena', ... }, ...]
```

##### `encode(ids: string[]): bigint`

Encode symbol IDs to a prime signature (product of primes).

```javascript
const signature = symbolDatabase.encode(['hero', 'journey', 'mountain']);
// 8035067n (bigint)
```

##### `decode(signature: bigint): Symbol[]`

Decode a prime signature back to symbols.

```javascript
const symbols = symbolDatabase.decode(8035067n);
// [{ id: 'hero', ... }, { id: 'journey', ... }, { id: 'mountain', ... }]
```

##### `getAllSymbols(): Symbol[]`

Get all symbols in the database.

```javascript
const all = symbolDatabase.getAllSymbols();
// 184 symbols
```

##### `getCategoryStats(): Map<SymbolCategory, number>`

Get count of symbols per category.

```javascript
const stats = symbolDatabase.getCategoryStats();
// Map { 'PEOPLE_ARCHETYPES' => 50, 'PLACES_LOCATIONS' => 31, ... }
```

---

## Semantic Inference

### SemanticInference

Engine for inferring symbols from natural language text.

```javascript
const { semanticInference, SemanticInference } = require('./core');
```

#### InferenceResult Structure

```typescript
interface InferenceResult {
  symbol: Symbol;
  method: 'direct' | 'regex' | 'semantic' | 'category';
  confidence: number;  // 0.0 - 1.0
  resonanceBonus?: number;
  attentionWeight?: number;
  contextResonance?: number;
}
```

#### Methods

##### `inferSymbol(text: string): InferenceResult | null`

Infer a single symbol from text.

```javascript
const result = semanticInference.inferSymbol('brave warrior');
// { symbol: { id: 'warrior', ... }, method: 'regex', confidence: 0.85 }
```

Inference methods (in priority order):
1. **direct**: Exact match on symbol ID
2. **regex**: Pattern matching (100+ rules)
3. **semantic**: Word overlap with meaning
4. **category**: Fallback to category keywords

##### `inferSymbols(entities: string[]): InferenceResult[]`

Infer symbols for multiple entities.

```javascript
const results = semanticInference.inferSymbols(['hero', 'temple', 'fire']);
// [{ symbol: hero, ... }, { symbol: temple, ... }, { symbol: fire, ... }]
```

##### `extractEntities(text: string): string[]`

Extract potential entities from text.

```javascript
const entities = semanticInference.extractEntities('The hero John went to the temple');
// ['hero', 'john', 'temple']
```

##### `extractAndInfer(text: string): InferenceResult[]`

Extract entities and infer symbols in one call.

```javascript
const results = semanticInference.extractAndInfer('The hero fought the shadow');
// [{ entity: 'hero', symbol: ... }, { entity: 'shadow', symbol: ... }]
```

##### `inferWithResonance(text: string, options?): InferenceResult[]`

Infer symbols with resonance-based ranking using ResoFormer attention.

```javascript
const results = semanticInference.inferWithResonance(
  'The hero fought the shadow in the temple of fire',
  { topK: 5 }
);

for (const r of results) {
  console.log(`${r.symbol.unicode} ${r.symbol.id}`);
  console.log(`  confidence: ${r.confidence}`);
  console.log(`  resonance bonus: ${r.resonanceBonus}`);
  console.log(`  attention weight: ${r.attentionWeight}`);
}
```

Options:
- `topK?: number` - Maximum results to return (default: all)

##### `inferMostResonant(text: string, contextSymbols: Symbol[]): InferenceResult`

Find the symbol that best resonates with an existing context.

```javascript
const context = [
  symbolDatabase.getSymbol('warrior'),
  symbolDatabase.getSymbol('temple'),
  symbolDatabase.getSymbol('fire')
];

const best = semanticInference.inferMostResonant('weapon', context);
// { symbol: sword, contextResonance: 0.2993, ... }
```

This uses ResoFormer's attention mechanism:
1. Convert symbols to `SparsePrimeState`
2. Calculate resonance scores using Jaccard + quaternion alignment
3. Apply softmax attention
4. Return highest-weighted candidate

---

## Compound Builder

### CompoundBuilder

Build multi-symbol concepts through composition.

```javascript
const { compoundBuilder, CompoundBuilder } = require('./core');
```

#### CompoundSymbol Structure

```typescript
interface CompoundSymbol {
  id: string;
  components: Symbol[];
  unicode: string;        // Concatenated emoji
  meaning: string;
  culturalTags: string[];
  primeSignature: bigint; // Product of component primes
}
```

#### SymbolSequence Structure

```typescript
interface SymbolSequence {
  id: string;
  symbols: Symbol[];
  type: 'narrative' | 'transformation' | 'progression';
  description: string;
}
```

#### Methods

##### `createCompound(id, componentIds, meaning, culturalTags?): CompoundSymbol`

Create a new compound symbol.

```javascript
const fireMage = compoundBuilder.createCompound(
  'fire_mage',
  ['magician', 'fire', 'staff'],
  'Fire Mage - Wielder of flame magic',
  ['fantasy', 'magic']
);
```

##### `getCompound(id: string): CompoundSymbol | null`

Get a pre-built compound.

```javascript
const greekWarrior = compoundBuilder.getCompound('greek_warrior');
// { unicode: '⚔️⛩️🦉', meaning: 'Greek Warrior: Temple guardian...', ... }
```

Pre-built compounds:
- `greek_warrior` - Temple guardian blessed by Athena
- `viking_warrior` - Norse warrior of the sea
- `samurai_warrior` - Japanese warrior path
- `philosopher_king` - Platonic ruler ideal
- `shadow_self` - Jungian shadow archetype

##### `createSequence(id, symbolIds, type, description?): SymbolSequence`

Create an ordered symbol sequence.

```javascript
const loveStory = compoundBuilder.createSequence(
  'love_story',
  ['lover', 'love', 'conflict', 'unity'],
  'narrative',
  'Classic love story arc'
);
```

##### `getSequence(id: string): SymbolSequence | null`

Get a pre-built sequence.

```javascript
const journey = compoundBuilder.getSequence('heros_journey');
// 🦸 → 🛤️ → 🌀 → 💥 → 🦋
```

Pre-built sequences:
- `heros_journey` - Campbell's monomyth
- `alchemical_transformation` - Nigredo → Albedo → Rubedo

##### `calculateCompoundResonance(compound: CompoundSymbol): number`

Calculate internal harmony of a compound.

```javascript
const harmony = compoundBuilder.calculateCompoundResonance(fireMage);
// 0.234 (average pairwise resonance)
```

##### `mergeCompounds(compound1, compound2, newId, meaning): CompoundSymbol`

Merge two compounds into one.

```javascript
const merged = compoundBuilder.mergeCompounds(
  greekWarrior,
  fireMage,
  'greek_fire_mage',
  'Greek fire warrior'
);
```

##### `createCulturalVariant(baseId, culture, additionalSymbols, meaning): CompoundSymbol`

Create a cultural variant of an existing compound.

```javascript
const norseWarrior = compoundBuilder.createCulturalVariant(
  'greek_warrior',
  'norse',
  ['ocean'],
  'Norse sea warrior'
);
```

---

## Resonance Calculator

### ResonanceCalculator

Calculate prime pair resonance based on golden ratio theory.

```javascript
const { ResonanceCalculator, calculateResonance } = require('./core');
```

#### Theory

Primes whose ratio approaches φ ≈ 1.618 have "natural harmony":

```
R(p1, p2) = 1/ratio + φ_bonus
where φ_bonus = 0.3 if |ratio - φ| < 0.1
```

Fibonacci pairs (3/5, 5/8, etc.) naturally achieve high resonance.

#### Methods

##### `calculateResonance(p1: number, p2: number): number`

Calculate resonance between two primes.

```javascript
calculateResonance(3, 5);   // 0.9 (Fibonacci pair)
calculateResonance(7, 11);  // 0.936 (close to φ)
calculateResonance(2, 17);  // 0.118 (far from φ)
```

##### `findGoldenPairs(primes: number[]): GoldenPair[]`

Find all pairs with ratio close to φ.

```javascript
const pairs = resonanceCalculator.findGoldenPairs([2, 3, 5, 7, 11, 13]);
// [{ p1: 3, p2: 5, ratio: 1.667, resonance: 0.9 }, ...]
```

```typescript
interface GoldenPair {
  p1: number;
  p2: number;
  ratio: number;
  resonance: number;
}
```

##### `resonanceSignature(primes: number[]): ResonanceSignature`

Calculate resonance statistics for a prime set.

```javascript
const sig = resonanceCalculator.resonanceSignature([2, 3, 5, 7, 11]);
// { mean: 0.456, variance: 0.032, goldenCount: 2 }
```

```typescript
interface ResonanceSignature {
  mean: number;      // Average pairwise resonance
  variance: number;  // Variance of resonances
  goldenCount: number;  // Pairs within 0.1 of φ
}
```

##### `calculateMatrix(primes: number[]): number[][]`

Calculate full resonance matrix.

```javascript
const matrix = resonanceCalculator.calculateMatrix([2, 3, 5, 7]);
// matrix[i][j] = resonance(primes[i], primes[j])
// Diagonal = 1.0
```

##### `findMostResonant(target: number, candidates: number[]): { prime, resonance }`

Find the candidate most resonant with target.

```javascript
const best = resonanceCalculator.findMostResonant(7, [2, 3, 5, 11, 13]);
// { prime: 11, resonance: 0.936 }
```

##### `findClusters(primes: number[], threshold?: number): number[][]`

Find clusters of mutually resonant primes.

```javascript
const clusters = resonanceCalculator.findClusters([2, 3, 5, 7, 11, 13], 0.5);
// [[3, 5], [7, 11], ...]
```

---

## Convenience Functions

### Exported from `core/index.js`

```javascript
const {
  // Symbol Database
  getSymbol,
  getSymbolByPrime,
  symbolDatabase,
  SymbolDatabase,
  SymbolCategory,
  
  // Semantic Inference
  inferSymbol,
  inferSymbols,
  inferWithResonance,
  inferMostResonant,
  extractEntities,
  extractAndInfer,
  semanticInference,
  SemanticInference,
  
  // Compound Builder
  createCompound,
  getCompound,
  createSequence,
  getSequence,
  compoundBuilder,
  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  
  // Resonance Calculator
  calculateResonance,
  findGoldenPairs,
  resonanceSignature,
  ResonanceCalculator,
  GOLDEN_RATIO
} = require('./core');
```

---

## Integration with ResoFormer

The symbolic AI uses ResoFormer primitives for resonance attention:

```javascript
const { SparsePrimeState, resonantAttention, resonanceScore } = require('./core/rformer');

// Convert symbol to sparse prime state
function symbolToState(symbol) {
  const state = new SparsePrimeState();
  state.activations.set(symbol.prime, 1.0);
  
  // Add cultural tag activations
  for (const tag of symbol.culturalTags) {
    const tagPrime = hashTag(tag);
    state.activations.set(tagPrime, 0.3);
  }
  
  return state;
}

// Calculate resonance score
const score = resonanceScore(state1, state2);
// Uses: Jaccard(primes) + QuaternionAlign + PhaseCoherence

// Apply attention
const { output, weights } = resonantAttention(query, keys, values);
```

---

## Examples

### Full Pipeline Example

```javascript
const {
  inferWithResonance,
  inferMostResonant,
  createCompound,
  calculateResonance,
  getSymbol
} = require('./core');

// 1. Infer symbols from narrative
const text = 'The hero descended into the dark cave seeking the golden treasure';
const symbols = inferWithResonance(text);
console.log('Symbols:', symbols.map(s => s.symbol.unicode).join(' '));

// 2. Find complementary symbol
const context = symbols.map(s => s.symbol);
const weapon = inferMostResonant('weapon', context);
console.log('Suggested weapon:', weapon.symbol.unicode);

// 3. Build compound
const questGroup = createCompound(
  'quest_group',
  [...symbols.map(s => s.symbol.id), weapon.symbol.id],
  'Complete quest party'
);

// 4. Measure harmony
const primes = questGroup.components.map(c => c.prime);
for (let i = 0; i < primes.length; i++) {
  for (let j = i + 1; j < primes.length; j++) {
    const r = calculateResonance(primes[i], primes[j]);
    console.log(`${questGroup.components[i].id} ↔ ${questGroup.components[j].id}: ${r.toFixed(3)}`);
  }
}