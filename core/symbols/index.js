/**
 * Symbol Database Index
 * 
 * Loads all symbol definition files and creates the unified SymbolDatabase
 * instance. This modular structure makes it easy to add new symbol collections
 * by simply creating new files and importing them here.
 */

const { SymbolDatabase, SymbolCategory, PrimeGenerator } = require('./base');

// Import all symbol definition files
const { archetypeSymbols } = require('./archetypes');
const { tarotSymbols } = require('./tarot');
const { ichingHexagrams } = require('./iching');
const { egyptianHieroglyphs } = require('./hieroglyphs');
const { allElementSymbols } = require('./elements');

// ═══════════════════════════════════════════════════════════════════
// Create and populate the singleton database
// ═══════════════════════════════════════════════════════════════════

let symbolDatabaseInstance = null;

function createSymbolDatabase() {
  if (symbolDatabaseInstance) {
    return symbolDatabaseInstance;
  }

  const db = new SymbolDatabase();

  // Register all symbol collections in order
  // Order matters for prime assignment consistency
  
  // Register all symbol collections in order
  // Order matters for prime assignment consistency
  db.registerSymbols(archetypeSymbols);
  db.registerSymbols(tarotSymbols);
  db.registerSymbols(ichingHexagrams);
  db.registerSymbols(egyptianHieroglyphs);
  db.registerSymbols(allElementSymbols);

  symbolDatabaseInstance = db;
  return db;
}

// Create instance on module load
const symbolDatabase = createSymbolDatabase();

// ═══════════════════════════════════════════════════════════════════
// Convenience exports
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Database instance and class
  symbolDatabase,
  SymbolDatabase,
  SymbolCategory,
  PrimeGenerator,
  
  // Raw symbol collections (for reference/extension)
  archetypeSymbols,
  tarotSymbols,
  ichingHexagrams,
  egyptianHieroglyphs,
  allElementSymbols,
  
  // Convenience functions
  getSymbol: (id) => symbolDatabase.getSymbol(id),
  getSymbolByPrime: (prime) => symbolDatabase.getSymbolByPrime(prime),
  getSymbolsByCategory: (category) => symbolDatabase.getSymbolsByCategory(category),
  getSymbolsByTag: (tag) => symbolDatabase.getSymbolsByTag(tag),
  search: (query) => symbolDatabase.search(query),
  encode: (ids) => symbolDatabase.encode(ids),
  decode: (sig) => symbolDatabase.decode(sig),
  getAllSymbols: () => symbolDatabase.getAllSymbols(),
  getStats: () => symbolDatabase.getStats()
};