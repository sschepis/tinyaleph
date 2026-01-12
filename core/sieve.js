/**
 * The Semantic Sieve
 * Implements the "Sieve of Distinction" algorithm to ensure Prime Uniqueness Invariant.
 *
 * See: docs/sieve.md
 */

import { createEngine, SemanticBackend, LLM } from '../modular.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// ═══════════════════════════════════════════════════════════════════
// Prime Registry & Utilities
// ═══════════════════════════════════════════════════════════════════

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

class PrimeRegistry {
  constructor(existingPrimes) {
    this.used = new Set(existingPrimes);
    this.max = existingPrimes.length > 0 ? Math.max(...existingPrimes) : 1;
  }

  next() {
    let candidate = this.max + 1;
    while (true) {
      if (isPrime(candidate) && !this.used.has(candidate)) {
        this.used.add(candidate);
        this.max = candidate;
        return candidate;
      }
      candidate++;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// The Semantic Sieve Engine
// ═══════════════════════════════════════════════════════════════════

class Sieve {
  constructor() {
    // Load data.json using ESM-compatible approach (fs already imported)
    this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // Initialize Prime Registry with all currently used primes
    const usedPrimes = [
      ...this.data.primes,
      ...Object.keys(this.data.ontology).map(Number),
      ...Object.values(this.data.vocabulary).flat()
    ];
    this.primes = new PrimeRegistry(usedPrimes);
    
    // Initialize Concept Map (Name -> Prime)
    this.conceptToPrime = new Map();
    for (const [p, label] of Object.entries(this.data.ontology)) {
      this.conceptToPrime.set(label.toLowerCase(), Number(p));
    }

    this.stats = {
      collisionsResolved: 0,
      conceptsCreated: 0,
      primesMinted: 0
    };
  }

  getOntologyString() {
    return Object.entries(this.data.ontology)
      .map(([p, label]) => `${label}`)
      .join(', ');
  }

  save() {
    // Update data object with current state
    this.data.vocabulary = Object.fromEntries(V);
    
    // Update ontology reverse map
    const newOntology = {};
    // Keep existing
    Object.assign(newOntology, this.data.ontology);
    // Add new from conceptToPrime if missing (though we usually update data.ontology directly)
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    console.log('💾 System state saved.');
  }

  getOrMintPrime(concept) {
    const k = concept.toLowerCase().trim();
    if (this.conceptToPrime.has(k)) {
      return this.conceptToPrime.get(k);
    }

    const newPrime = this.primes.next();
    this.conceptToPrime.set(k, newPrime);
    this.data.ontology[newPrime] = concept; // Update ontology
    if (!this.data.primes.includes(newPrime)) {
      this.data.primes.push(newPrime);
    }
    
    console.log(`    ✨ Minted Prime ${newPrime} for concept "${concept}"`);
    this.stats.primesMinted++;
    this.stats.conceptsCreated++;
    return newPrime;
  }

  analyzeCollisions() {
    const map = new Map();
    for (const [word, primes] of V) {
      // Signature is sorted primes to ignore order for collision detection
      // (Though user previously mentioned order matters, the Sieve doc implies set-based collision first)
      // We will use sorted signature for the "Sieve" logic as described in sieve.md Phase 1.
      const sig = [...primes].sort((a, b) => a - b).join(',');
      if (!map.has(sig)) map.set(sig, []);
      map.get(sig).push(word);
    }

    return [...map.entries()]
      .filter(([sig, words]) => words.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // Sort by cluster size DESC
  }

  async resolveCluster(signature, words) {
    const currentPrimes = signature ? signature.split(',').map(Number) : [];
    const existingConcepts = currentPrimes.map(p => this.data.ontology[p] || `P${p}`).join(', ');
    
    console.log(`\n🔍 Resolving Cluster [${existingConcepts}]: ${words.length} words`);
    console.log(`   Words: ${words.slice(0, 10).join(', ')}${words.length > 10 ? '...' : ''}`);

    // Strategy A: Macro (> 10 words)
    if (words.length > 10) {
      console.log('   👉 Strategy A: Macro Categorization');
      
      // Limit to 50 words to avoid context window issues and improve focus
      const batchWords = words.slice(0, 50);
      const remaining = words.length - batchWords.length;
      console.log(`      Processing batch of ${batchWords.length} words (${remaining} remaining)...`);

      // Create numbered word list to avoid LLM truncating words
      const numberedWords = batchWords.map((w, i) => `${i}:${w}`).join(', ');
      
      const sys = `You are a semantic ontologist. Categorize words by their INDEX NUMBERS only.

RULES:
1. Categorize ALL word indices (0 to ${batchWords.length - 1})
2. Create exactly 4 distinct sub-categories
3. Category names must be DIFFERENT from: ${existingConcepts}
4. Use single-word category names: Nature, Motion, Emotion, Abstract, Physical, Temporal, Spiritual, etc.
5. Return word INDICES (numbers), not the words themselves`;

      const user = `Words to categorize:
${numberedWords}

Return JSON with indices: {"categories":{"CategoryName":[0,1,2],"OtherCategory":[3,4,5],...}}
Every index from 0 to ${batchWords.length - 1} must appear exactly once.`;

      try {
        const res = await LLM.chat([
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ], {
          temperature: 0,
          maxTokens: 65535
        });

        // Extract JSON from response
        let jsonStr = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
        
        // Try multiple extraction patterns
        let result = null;
        
        // Pattern 1: Full object match
        const jsonMatch = jsonStr.match(/\{[\s\S]*"categories"\s*:\s*\{[\s\S]*\}\s*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Try to fix truncated JSON by closing brackets
            let fixed = jsonMatch[0];
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;
            fixed += '}'.repeat(Math.max(0, openBraces - closeBraces));
            try {
              result = JSON.parse(fixed);
            } catch (e2) {
              // Continue to other patterns
            }
          }
        }
        
        // Pattern 2: Try to find categories object directly
        if (!result) {
          const catMatch = jsonStr.match(/"categories"\s*:\s*(\{[^]*)/);
          if (catMatch) {
            let catJson = catMatch[1];
            // Count brackets to find end
            let depth = 0;
            let end = 0;
            for (let i = 0; i < catJson.length; i++) {
              if (catJson[i] === '{') depth++;
              else if (catJson[i] === '}') {
                depth--;
                if (depth === 0) { end = i + 1; break; }
              }
            }
            if (end > 0) {
              try {
                result = { categories: JSON.parse(catJson.slice(0, end)) };
              } catch (e) {
                // Continue
              }
            }
          }
        }
        
        if (!result || !result.categories) {
          throw new Error('No valid categories JSON found in response');
        }
        
        // Convert indices back to words
        const categoriesWithWords = {};
        for (const [catName, indices] of Object.entries(result.categories)) {
          if (!Array.isArray(indices)) continue;
          categoriesWithWords[catName] = indices
            .filter(i => typeof i === 'number' && i >= 0 && i < batchWords.length)
            .map(i => batchWords[i]);
        }
        
        const totalAssigned = Object.values(categoriesWithWords).flat().length;
        console.log(`      LLM assigned ${totalAssigned}/${batchWords.length} words to ${Object.keys(categoriesWithWords).length} categories`);

        for (const [catName, wordList] of Object.entries(categoriesWithWords)) {
          if (!wordList || !wordList.length) continue;
          const p = this.getOrMintPrime(catName);
          
          // Apply to words
          let appliedCount = 0;
          for (const rawW of wordList) {
            const w = rawW.toLowerCase().trim(); // Normalize
            if (V.has(w)) {
              const ps = V.get(w);
              if (!ps.includes(p)) {
                ps.push(p);
                V.set(w, ps);
                appliedCount++;
              }
            } else {
                // Debugging: why wasn't it found?
                // console.log(`        ⚠️ Word "${w}" not found in V`);
            }
          }
          console.log(`      Applied concept "${catName}" (${p}) to ${appliedCount} words.`);
        }
        this.stats.collisionsResolved++;

      } catch (e) {
        console.error('   ❌ Macro Strategy failed:', e.message);
      }
    } 
    // Strategy B: Micro (<= 10 words)
    else {
      console.log('   👉 Strategy B: Discriminator');
      // Pick the first two words to differentiate
      const wordA = words[0];
      const wordB = words[1];

      const sys = `Compare the words "${wordA}" and "${wordB}".
They currently share the concepts: [${existingConcepts}].
The current Ontology contains: ${this.getOntologyString()}

Provide ONE single semantic concept that is TRUE for "${wordA}" but FALSE for "${wordB}".
- Prefer using an existing concept from the Ontology if applicable.
- If not, define a new one.

Return JSON: { "concept": "string", "reasoning": "string" }`;

      try {
        const res = await LLM.chat([{ role: 'system', content: sys }], {
          temperature: 0.2,
          jsonSchema: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              reasoning: { type: 'string' }
            },
            required: ['concept']
          }
        });

        const result = typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
        
        const p = this.getOrMintPrime(result.concept);
        
        // Apply ONLY to Word A
        const ps = V.get(wordA);
        if (!ps.includes(p)) {
          ps.push(p);
          V.set(wordA, ps);
          console.log(`      ✅ Differentiated "${wordA}" from "${wordB}" with concept "${result.concept}" (${p})`);
          this.stats.collisionsResolved++;
        }

      } catch (e) {
        console.error('   ❌ Micro Strategy failed:', e.message);
      }
    }
  }

  async run(maxIterations = 25) {
    console.log('🕸️  Semantic Sieve Initialized');
    console.log('----------------------------');

    for (let i = 0; i < maxIterations; i++) {
      const collisions = this.analyzeCollisions();
      
      if (collisions.length === 0) {
        console.log('\n🎉 Prime Uniqueness Invariant Satisfied! No collisions detected.');
        break;
      }

      console.log(`\nPass ${i + 1}/${maxIterations}: ${collisions.length} clusters detected.`);
      
      // Pick largest cluster
      const [sig, cluster] = collisions[0];
      
      await this.resolveCluster(sig, cluster);
      this.save();
      
      // Small pause to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n📊 Sieve Session Complete');
    console.log(`   Collisions Resolved: ${this.stats.collisionsResolved}`);
    console.log(`   New Concepts: ${this.stats.conceptsCreated}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Execution
// ═══════════════════════════════════════════════════════════════════

const sieve = new Sieve();
sieve.run().catch(console.error);