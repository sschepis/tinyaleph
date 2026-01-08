/**
 * Example: Symbol Database
 * 
 * Demonstrates the symbolic AI database with 200+ emoji symbols,
 * their prime assignments, and cultural tagging.
 */

const {
  SymbolDatabase,
  SymbolCategory,
  symbolDatabase,
  getSymbol,
  getSymbolByPrime
} = require('../core');

console.log('='.repeat(60));
console.log('Symbolic AI Database');
console.log('='.repeat(60));

// ─────────────────────────────────────────────────────────────────
// Database Overview
// ─────────────────────────────────────────────────────────────────

console.log('\n1. Database Statistics');
console.log('-'.repeat(40));

const stats = symbolDatabase.getStats();
console.log(`  Total symbols: ${stats.totalSymbols}`);
console.log('\n  By category:');
for (const [category, count] of Object.entries(stats.byCategory)) {
  console.log(`    ${category}: ${count} symbols`);
}
console.log('\n  Top cultural tags:');
for (const { tag, count } of stats.topTags) {
  console.log(`    ${tag}: ${count} symbols`);
}

// ─────────────────────────────────────────────────────────────────
// Symbol Lookup
// ─────────────────────────────────────────────────────────────────

console.log('\n2. Symbol Lookup');
console.log('-'.repeat(40));

const examples = ['hero', 'warrior', 'mountain', 'fire', 'athena', 'samurai'];
for (const id of examples) {
  const s = getSymbol(id);
  if (s) {
    console.log(`  ${s.unicode} ${s.id} (prime: ${s.prime})`);
    console.log(`     "${s.meaning}"`);
    console.log(`     tags: [${s.culturalTags.join(', ')}]`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Reverse Lookup by Prime
// ─────────────────────────────────────────────────────────────────

console.log('\n3. Reverse Lookup (by Prime)');
console.log('-'.repeat(40));

const testPrimes = [2, 3, 5, 7, 11, 13];
for (const p of testPrimes) {
  const s = getSymbolByPrime(p);
  if (s) {
    console.log(`  Prime ${p} → ${s.unicode} ${s.id}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Category Browsing
// ─────────────────────────────────────────────────────────────────

console.log('\n4. Browse by Category');
console.log('-'.repeat(40));

for (const category of Object.values(SymbolCategory)) {
  const symbols = symbolDatabase.getSymbolsByCategory(category);
  const sample = symbols.slice(0, 5).map(s => s.unicode).join(' ');
  console.log(`  ${category}: ${sample}... (${symbols.length} total)`);
}

// ─────────────────────────────────────────────────────────────────
// Cultural Filtering
// ─────────────────────────────────────────────────────────────────

console.log('\n5. Cultural Symbols');
console.log('-'.repeat(40));

const cultures = ['greek', 'norse', 'japanese', 'egyptian', 'hindu'];
for (const culture of cultures) {
  const symbols = symbolDatabase.getSymbolsByTag(culture);
  if (symbols.length > 0) {
    const sample = symbols.slice(0, 5).map(s => s.unicode).join(' ');
    console.log(`  ${culture}: ${sample} (${symbols.length} symbols)`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────

console.log('\n6. Symbol Search');
console.log('-'.repeat(40));

const queries = ['warrior', 'wisdom', 'fire'];
for (const query of queries) {
  const results = symbolDatabase.search(query);
  console.log(`  "${query}": ${results.length} results`);
  for (const r of results.slice(0, 3)) {
    console.log(`    ${r.unicode} ${r.id}: ${r.meaning.slice(0, 40)}...`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Prime Encoding
// ─────────────────────────────────────────────────────────────────

console.log('\n7. Prime Encoding');
console.log('-'.repeat(40));

const concept1 = ['hero', 'journey', 'mountain'];
const encoded1 = symbolDatabase.encode(concept1);
console.log(`  Concept: [${concept1.join(', ')}]`);
console.log(`  Encoded: ${encoded1.toString()}`);
console.log(`  Decoded: ${symbolDatabase.decode(encoded1).map(s => s.id).join(', ')}`);

const concept2 = ['fire', 'water', 'earth_element'];
const encoded2 = symbolDatabase.encode(concept2);
console.log(`\n  Concept: [${concept2.join(', ')}]`);
console.log(`  Encoded: ${encoded2.toString()}`);
console.log(`  Decoded: ${symbolDatabase.decode(encoded2).map(s => s.id).join(', ')}`);

// ─────────────────────────────────────────────────────────────────
// Universal vs Cultural Archetypes
// ─────────────────────────────────────────────────────────────────

console.log('\n8. Universal Archetypes');
console.log('-'.repeat(40));

const universal = symbolDatabase.getSymbolsByTag('universal');
console.log(`  Total universal symbols: ${universal.length}`);
console.log('  Sample archetypes:');
for (const s of universal.slice(0, 10)) {
  console.log(`    ${s.unicode} ${s.id}: ${s.meaning}`);
}

console.log('\n' + '='.repeat(60));
console.log('Each symbol has a unique prime - concepts combine via multiplication');
console.log('='.repeat(60));