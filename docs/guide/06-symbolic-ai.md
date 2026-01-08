# Symbolic AI and Resonance Attention

This guide covers the symbolic AI components ported from symprime and enhanced with tinyaleph's ResoFormer resonance attention mechanism.

## Overview

The symbolic AI system provides:

1. **Symbol Database** - 184+ emoji symbols with prime assignments and cultural tags
2. **Semantic Inference** - Pattern matching and resonance-enhanced text→symbol mapping
3. **Compound Builder** - Multi-symbol concepts through prime multiplication
4. **Resonance Calculator** - Golden ratio-based harmony measurement

## Quick Start

```javascript
const { 
  inferWithResonance,
  inferMostResonant,
  getSymbol,
  createCompound,
  symbolDatabase,
  resonanceSignature
} = require('./core');

// Infer symbols from text with resonance ranking
const symbols = inferWithResonance('The hero fought the shadow in the temple');
console.log(symbols.map(s => s.symbol.unicode).join(' '));
// → 👩 🌑 ⛩️ 🦸

// Find symbol that harmonizes best with context
const context = [getSymbol('warrior'), getSymbol('temple')];
const best = inferMostResonant('sword', context);
console.log(`${best.symbol.unicode} resonance: ${best.contextResonance}`);
// → 🗡️ resonance: 0.2993
```

## Symbol Database

### Categories

| Category | Count | Examples |
|----------|-------|----------|
| PEOPLE_ARCHETYPES | 50 | 🦸 hero, ⚔️ warrior, 🧙 sage |
| PLACES_LOCATIONS | 31 | ⛰️ mountain, ⛩️ temple, 🌊 ocean |
| OBJECTS_TOOLS | 36 | 🗡️ sword, 🔑 key, 📜 scroll |
| ABSTRACT_CONCEPTS | 37 | ❤️ love, 🦁 courage, ☮️ peace |
| NATURAL_ELEMENTS | 30 | 🔥 fire, 💧 water, ⚡ thunder |

### Cultural Tags

Each symbol is tagged with cultural context:

```javascript
const athena = getSymbol('athena');
console.log(athena);
// {
//   id: 'athena',
//   unicode: '🦉',
//   prime: 89,
//   meaning: 'Athena - Goddess of wisdom',
//   culturalTags: ['greek', 'mythology', 'wisdom']
// }

// Find all Greek symbols
const greekSymbols = symbolDatabase.getSymbolsByTag('greek');
```

### Prime Encoding

Every symbol has a unique prime number. Concepts combine through multiplication:

```javascript
// Encode concepts to prime signature
const signature = symbolDatabase.encode(['hero', 'journey', 'mountain']);
// → 8035067n (product of primes)

// Decode back to symbols
const symbols = symbolDatabase.decode(signature);
// → [hero, journey, mountain]
```

## Semantic Inference

### Basic Inference

```javascript
const { inferSymbol, inferSymbols } = require('./core');

// Direct match
inferSymbol('warrior');
// → { symbol: ⚔️, method: 'direct', confidence: 1.0 }

// Pattern match
inferSymbol('mighty knight');
// → { symbol: ⚔️, method: 'regex', confidence: 0.85 }

// Semantic match
inferSymbol('brave protagonist');
// → { symbol: 🦸, method: 'semantic', confidence: 0.7 }
```

### Resonance-Enhanced Inference

The key innovation: using ResoFormer attention to rank symbols by how well they "harmonize" together.

```javascript
const { inferWithResonance } = require('./core');

const text = 'The hero fought the shadow in the temple of fire';
const results = inferWithResonance(text);

for (const r of results) {
  console.log(`${r.symbol.unicode} ${r.symbol.id}`);
  console.log(`  confidence: ${r.confidence}`);
  console.log(`  resonance bonus: ${r.resonanceBonus}`);
  console.log(`  attention weight: ${r.attentionWeight}`);
}
```

### How Resonance Selection Works

1. **Prime State Conversion**: Each symbol becomes a `SparsePrimeState`
2. **Cultural Activation**: Related symbols (via tags) get partial activation
3. **Resonance Scoring**: `Res(i,j) = α·Jaccard + β·QuaternionAlign + γ·PhaseCoherence`
4. **Attention Weighting**: Softmax over resonance scores
5. **Ranking**: Symbols sorted by attention weight

```javascript
// Under the hood:
const state = symbolToState(symbol);  // Convert to SparsePrimeState
const score = resonanceScore(state1, state2);  // Calculate harmony
const { weights } = resonantAttention(query, keys, values);  // Apply attention
```

### Context-Aware Selection

Find symbols that resonate with existing context:

```javascript
const { inferMostResonant, getSymbol } = require('./core');

// Build context
const context = [
  getSymbol('warrior'),
  getSymbol('temple'),
  getSymbol('fire')
];

// Find most harmonious addition
const best = inferMostResonant('weapon', context);
// → 🗡️ sword (high resonance with warrior/temple/fire)

// Compare with other options
const shield = inferMostResonant('shield', context);
const bow = inferMostResonant('bow', context);
```

## Compound Symbols

### Pre-built Compounds

```javascript
const { getCompound, compoundBuilder } = require('./core');

const greekWarrior = getCompound('greek_warrior');
console.log(`${greekWarrior.unicode} - ${greekWarrior.meaning}`);
// → ⚔️⛩️🦉 - Greek Warrior: Temple guardian blessed by Athena

// Available compounds:
// greek_warrior, viking_warrior, samurai_warrior
// philosopher_king, shadow_self
```

### Creating Compounds

```javascript
const { createCompound, compoundBuilder } = require('./core');

// Create a new compound
const fireMage = createCompound('fire_mage',
  ['magician', 'fire', 'staff'],
  'Fire Mage - Wielder of flame magic',
  ['fantasy', 'magic', 'elemental']
);

// Calculate internal resonance
const resonance = compoundBuilder.calculateCompoundResonance(fireMage);
console.log(`Internal harmony: ${resonance.toFixed(4)}`);
```

### Cultural Variants

```javascript
const { compoundBuilder } = require('./core');

// Create Norse variant of Greek warrior
const norseWarrior = compoundBuilder.createCulturalVariant(
  'greek_warrior',
  'norse',
  ['ocean'],  // Additional Norse symbols
  'Norse-influenced warrior of the seas'
);
```

### Symbol Sequences

For narratives and temporal ordering:

```javascript
const { createSequence, getSequence } = require('./core');

// Pre-built: hero's journey
const journey = getSequence('heros_journey');
// → 🦸 → 🛤️ → 🌀 → 💥 → 🦋

// Create custom sequence
const loveStory = createSequence('love_story',
  ['lover', 'love', 'conflict', 'unity'],
  'narrative',
  'Classic love story arc'
);
```

## Golden Ratio Resonance

### Theory

Primes whose ratio approaches φ ≈ 1.618 have "natural harmony":

```
R(p1, p2) = 1/ratio + φ_bonus
where φ_bonus = 0.3 if |ratio - φ| < 0.1
```

### Usage

```javascript
const { 
  calculateResonance,
  findGoldenPairs,
  resonanceSignature,
  ResonanceCalculator
} = require('./core');

// Calculate resonance between primes
calculateResonance(3, 5);  // → 0.9 (Fibonacci pair!)
calculateResonance(7, 11); // → 0.936 (close to φ)
calculateResonance(2, 17); // → 0.118 (far from φ)

// Find golden pairs in a set
const pairs = findGoldenPairs([2, 3, 5, 7, 11, 13]);
// → [{ p1: 3, p2: 5, ratio: 1.667 }, ...]

// Signature for a symbol set
const symbols = ['hero', 'journey', 'mountain'];
const primes = symbols.map(s => getSymbol(s).prime);
const sig = resonanceSignature(primes);
console.log(`Mean resonance: ${sig.mean.toFixed(4)}`);
console.log(`Golden pairs: ${sig.goldenCount}`);
```

### Resonance Matrix

```javascript
const calc = new ResonanceCalculator();
const primes = [2, 3, 5, 7, 11];
const matrix = calc.calculateMatrix(primes);

// matrix[i][j] = resonance between primes[i] and primes[j]
// Diagonal = 1.0 (self-resonance)
```

## Entity Extraction

Simple NER-like extraction before inference:

```javascript
const { extractEntities, extractAndInfer } = require('./core');

const text = 'The hero John traveled to the ancient temple';

// Extract entities
const entities = extractEntities(text);
// → ['john', 'hero', 'temple', 'ancient temple']

// Extract and infer in one step
const symbols = extractAndInfer(text);
// → [{ entity: 'hero', symbol: 🦸 }, { entity: 'temple', symbol: ⛩️ }]
```

## Examples

Run the example files to see everything in action:

```bash
# Resonance theory
node examples/05-symbolic-resonance.js

# Symbol database
node examples/06-symbol-database.js

# Semantic inference with resonance
node examples/07-semantic-inference.js

# Compound symbols
node examples/08-compound-symbols.js
```

## Integration with ResoFormer

The symbolic AI system uses ResoFormer's core primitives:

| Symbolic AI | ResoFormer Component |
|------------|---------------------|
| `symbolToState()` | `SparsePrimeState` |
| `calculateCandidateResonance()` | `resonanceScore()` |
| `resonanceSelect()` | `resonantAttention()` |
| `inferMostResonant()` | Weighted resonance scoring |

This creates a unified system where:
- Symbols are prime-indexed
- Cultural similarity uses sparse prime overlap
- Disambiguation uses quaternionic attention
- Harmony measurement uses golden ratio theory

## API Reference

### Symbol Database

```typescript
getSymbol(id: string): Symbol | null
getSymbolByPrime(prime: number): Symbol | null
symbolDatabase.search(query: string): Symbol[]
symbolDatabase.getByCategory(category: SymbolCategory): Symbol[]
symbolDatabase.getSymbolsByTag(tag: string): Symbol[]
symbolDatabase.encode(ids: string[]): bigint
symbolDatabase.decode(signature: bigint): Symbol[]
```

### Semantic Inference

```typescript
inferSymbol(text: string): InferenceResult | null
inferSymbols(entities: string[]): InferenceResult[]
inferWithResonance(text: string, options?): InferenceResult[]
inferMostResonant(text: string, context: Symbol[]): InferenceResult
extractEntities(text: string): string[]
extractAndInfer(text: string): InferenceResult[]
```

### Compound Builder

```typescript
createCompound(id, componentIds, meaning, culturalTags?): CompoundSymbol
getCompound(id: string): CompoundSymbol | null
createSequence(id, symbolIds, type, description?): SymbolSequence
getSequence(id: string): SymbolSequence | null
compoundBuilder.calculateCompoundResonance(compound): number
compoundBuilder.createCulturalVariant(baseId, culture, addSymbols, meaning): CompoundSymbol
```

### Resonance Calculator

```typescript
calculateResonance(p1: number, p2: number): number
findGoldenPairs(primes: number[]): GoldenPair[]
resonanceSignature(primes: number[]): { mean, variance, goldenCount }
ResonanceCalculator.findMostResonant(target, candidates): { prime, resonance }
ResonanceCalculator.findClusters(primes, threshold): number[][]