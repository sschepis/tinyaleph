/**
 * Symbol Database
 * 
 * Comprehensive database of 400+ symbols with:
 * - Unicode emoji representation
 * - Prime number assignment (unique per symbol)
 * - Category organization
 * - Cultural tags for cross-cultural mapping
 * - Rich, detailed meanings
 * 
 * Includes:
 * - Jungian archetypes and mythological figures
 * - Tarot Major and Minor Arcana
 * - I-Ching 64 hexagrams
 * - Egyptian hieroglyphs
 * - Natural elements, places, objects, abstracts
 * 
 * Refactored to use modular symbol definition files.
 */

// Re-export everything from the modular structure
module.exports = require('./symbols/index');