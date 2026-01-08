/**
 * Example: Compound Symbols
 * 
 * Demonstrates the compound builder for creating multi-symbol concepts,
 * cultural variants, and narrative sequences.
 */

const {
  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  compoundBuilder,
  createCompound,
  getCompound,
  createSequence,
  getSequence,
  symbolDatabase,
  resonanceSignature
} = require('../core');

console.log('='.repeat(60));
console.log('Compound Symbol Builder');
console.log('='.repeat(60));

// ─────────────────────────────────────────────────────────────────
// Pre-built Compounds
// ─────────────────────────────────────────────────────────────────

console.log('\n1. Pre-built Cultural Compounds');
console.log('-'.repeat(40));

const prebuilt = ['greek_warrior', 'viking_warrior', 'samurai_warrior', 'philosopher_king', 'shadow_self'];

for (const id of prebuilt) {
  const c = getCompound(id);
  if (c) {
    const components = c.components.map(s => s.unicode).join('');
    const resonance = compoundBuilder.calculateCompoundResonance(c);
    console.log(`  ${components} ${c.id}`);
    console.log(`    "${c.meaning}"`);
    console.log(`    prime: ${c.prime.toString().slice(0, 20)}...`);
    console.log(`    resonance: ${resonance.toFixed(4)}`);
    console.log(`    tags: [${c.culturalTags.join(', ')}]`);
    console.log();
  }
}

// ─────────────────────────────────────────────────────────────────
// Create Custom Compounds
// ─────────────────────────────────────────────────────────────────

console.log('\n2. Create Custom Compounds');
console.log('-'.repeat(40));

// Fire Mage
const fireMage = createCompound('fire_mage', 
  ['magician', 'fire', 'staff'],
  'Fire Mage - Wielder of flame magic',
  ['fantasy', 'magic', 'elemental']
);
console.log(`  Created: ${fireMage.unicode} ${fireMage.id}`);
console.log(`    "${fireMage.meaning}"`);

// Storm Lord
const stormLord = createCompound('storm_lord',
  ['ruler', 'thunder', 'lightning'],
  'Storm Lord - Master of the tempest',
  ['mythology', 'weather', 'power']
);
console.log(`  Created: ${stormLord.unicode} ${stormLord.id}`);
console.log(`    "${stormLord.meaning}"`);

// Guardian Spirit - using valid symbols
const guardianSpirit = createCompound('guardian_spirit',
  ['guardian', 'shadow', 'sanctuary'],
  'Guardian Spirit - Protective ancestor spirit',
  ['spiritual', 'protection', 'ancestors']
);
console.log(`  Created: ${guardianSpirit.unicode} ${guardianSpirit.id}`);
console.log(`    "${guardianSpirit.meaning}"`);

// ─────────────────────────────────────────────────────────────────
// Symbol Sequences (Narratives)
// ─────────────────────────────────────────────────────────────────

console.log('\n3. Pre-built Narrative Sequences');
console.log('-'.repeat(40));

const herosJourney = getSequence('heros_journey');
if (herosJourney) {
  const icons = herosJourney.symbols.map(s => s.unicode).join(' → ');
  console.log(`  ${herosJourney.id} (${herosJourney.type})`);
  console.log(`    ${icons}`);
  console.log(`    "${herosJourney.description}"`);
}

const alchemical = getSequence('alchemical_transformation');
if (alchemical) {
  const icons = alchemical.symbols.map(s => s.unicode).join(' → ');
  console.log(`\n  ${alchemical.id} (${alchemical.type})`);
  console.log(`    ${icons}`);
  console.log(`    "${alchemical.description}"`);
}

// ─────────────────────────────────────────────────────────────────
// Create Custom Sequences
// ─────────────────────────────────────────────────────────────────

console.log('\n4. Create Custom Sequences');
console.log('-'.repeat(40));

// Love story - using valid symbols
const loveStory = createSequence('love_story',
  ['lover', 'love', 'conflict', 'unity'],
  'narrative',
  'Classic love story arc'
);
const loveIcons = loveStory.symbols.map(s => s.unicode).join(' → ');
console.log(`  ${loveStory.id}: ${loveIcons}`);

// Quest for knowledge
const knowledgeQuest = createSequence('knowledge_quest',
  ['scholar', 'path', 'library', 'sage', 'wisdom_concept'],
  'journey',
  'The pursuit of wisdom'
);
if (knowledgeQuest) {
  const icons = knowledgeQuest.symbols.map(s => s.unicode).join(' → ');
  console.log(`  ${knowledgeQuest.id}: ${icons}`);
}

// ─────────────────────────────────────────────────────────────────
// Compound Analysis
// ─────────────────────────────────────────────────────────────────

console.log('\n5. Compound Resonance Analysis');
console.log('-'.repeat(40));

const compounds = compoundBuilder.getAllCompounds();
console.log(`  Total compounds: ${compounds.length}`);

// Sort by resonance
const ranked = compounds
  .map(c => ({ 
    compound: c, 
    resonance: compoundBuilder.calculateCompoundResonance(c) 
  }))
  .sort((a, b) => b.resonance - a.resonance);

console.log('\n  Top 5 by internal resonance:');
for (const { compound, resonance } of ranked.slice(0, 5)) {
  console.log(`    ${compound.unicode} ${compound.id}: ${resonance.toFixed(4)}`);
}

// ─────────────────────────────────────────────────────────────────
// Find Resonant Additions
// ─────────────────────────────────────────────────────────────────

console.log('\n6. Find Resonant Additions');
console.log('-'.repeat(40));

const base = getCompound('greek_warrior');
if (base) {
  const candidates = ['sun', 'moon_element', 'stars', 'thunder', 'gold', 'silver'];
  const best = compoundBuilder.findResonantAddition(base, candidates);
  
  console.log(`  Base: ${base.unicode} ${base.id}`);
  console.log(`  Candidates: [${candidates.join(', ')}]`);
  if (best) {
    console.log(`  Most resonant addition: ${best.symbol.unicode} ${best.symbol.id} (r=${best.resonance.toFixed(4)})`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Cultural Variants
// ─────────────────────────────────────────────────────────────────

console.log('\n7. Cultural Variants');
console.log('-'.repeat(40));

// Create variants of greek_warrior
const norseVariant = compoundBuilder.createCulturalVariant(
  'greek_warrior', 
  'norse', 
  ['ocean'],
  'Norse-influenced warrior of the seas'
);
console.log(`  ${norseVariant.unicode} ${norseVariant.id}`);
console.log(`    tags: [${norseVariant.culturalTags.join(', ')}]`);

const egyptianVariant = compoundBuilder.createCulturalVariant(
  'greek_warrior',
  'egyptian',
  ['pyramid', 'sun'],
  'Egyptian warrior under Ra'
);
console.log(`  ${egyptianVariant.unicode} ${egyptianVariant.id}`);
console.log(`    tags: [${egyptianVariant.culturalTags.join(', ')}]`);

// ─────────────────────────────────────────────────────────────────
// Statistics
// ─────────────────────────────────────────────────────────────────

console.log('\n8. Builder Statistics');
console.log('-'.repeat(40));

const stats = compoundBuilder.getStats();
console.log(`  Total compounds: ${stats.totalCompounds}`);
console.log(`  Total sequences: ${stats.totalSequences}`);
console.log(`  Avg components per compound: ${stats.avgComponentsPerCompound.toFixed(1)}`);
console.log(`  Avg symbols per sequence: ${stats.avgSymbolsPerSequence.toFixed(1)}`);
console.log('  Cultural distribution:');
for (const [tag, count] of Object.entries(stats.cultureTags)) {
  console.log(`    ${tag}: ${count}`);
}

console.log('\n' + '='.repeat(60));
console.log('Compounds multiply symbol primes; sequences order them narratively');
console.log('='.repeat(60));