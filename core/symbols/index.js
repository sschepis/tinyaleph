/**
 * Symbol Database Index
 * 
 * Loads all symbol definition files and creates the unified SymbolDatabase
 * instance. This modular structure makes it easy to add new symbol collections
 * by simply creating new files and importing them here.
 */

// Import all symbol definition files

// ═══════════════════════════════════════════════════════════════════
// Create and populate the singleton database
// ═══════════════════════════════════════════════════════════════════

import { SymbolDatabase, SymbolCategory, PrimeGenerator } from './base.js';
import { archetypeSymbols } from './archetypes.js';
import { tarotSymbols } from './tarot.js';
import { ichingHexagrams } from './iching.js';
import { egyptianHieroglyphs } from './hieroglyphs.js';
import { allElementSymbols } from './elements.js';

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

// Convenience functions
const getSymbol = (id) => symbolDatabase.getSymbol(id);
const getSymbolByPrime = (prime) => symbolDatabase.getSymbolByPrime(prime);
const getSymbolsByCategory = (category) => symbolDatabase.getSymbolsByCategory(category);
const getSymbolsByTag = (tag) => symbolDatabase.getSymbolsByTag(tag);
const search = (query) => symbolDatabase.search(query);
const encode = (ids) => symbolDatabase.encode(ids);
const decode = (sig) => symbolDatabase.decode(sig);
const getAllSymbols = () => symbolDatabase.getAllSymbols();
const getStats = () => symbolDatabase.getStats();

export {
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
  getSymbol,
  getSymbolByPrime,
  getSymbolsByCategory,
  getSymbolsByTag,
  search,
  encode,
  decode,
  getAllSymbols,
  getStats
};

// Default export for backward compatibility
export default symbolDatabase;