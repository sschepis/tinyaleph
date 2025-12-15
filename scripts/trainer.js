/**
 * Aleph Conversational Trainer v2 (The Mentor)
 * 
 * Role: A chaperone and teacher that identifies Aleph's weak spots
 * and engages in targeted conversation to strengthen them.
 * 
 * Updated to use modular architecture.
 */
const fs = require('fs');
const path = require('path');
const { createEngine, SemanticBackend, LLM } = require('../modular');

const DATA_FILE = path.join(__dirname, '../data.json');

// Load initial data
const data = require('../data.json');

// Create engine with semantic backend
const semanticConfig = {
  dimension: 16,
  vocabulary: data.vocabulary || {},
  ontology: data.ontology || {},
  transforms: data.transforms || []
};

const engine = createEngine('semantic', semanticConfig);
const backend = new SemanticBackend(semanticConfig);

// --- Helper Functions ---

function saveData() {
  data.vocabulary = Object.fromEntries(
    Object.entries(semanticConfig.vocabulary)
  );
  data.transforms = semanticConfig.transforms;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('💾 System state saved.');
}

const ontologyMap = Object.entries(semanticConfig.ontology)
  .map(([p, m]) => `${p}:${m}`)
  .join(', ');

// Seed Concepts from Science & Math for broad training
const SEED_CONCEPTS = [
  // Physics
  "energy", "entropy", "gravity", "quantum", "relativity", "particle", "wave", "field", "force", "velocity",
  // Mathematics
  "number", "zero", "infinity", "geometry", "logic", "algorithm", "variable", "function", "set", "probability",
  // Biology
  "cell", "evolution", "dna", "organism", "ecosystem", "neuron", "consciousness", "adaptation", "metabolism",
  // Chemistry
  "atom", "molecule", "reaction", "element", "bond", "catalyst", "solution", "acid", "base",
  // Astronomy
  "star", "planet", "galaxy", "orbit", "cosmos", "nebula", "blackhole", "lightyear"
];

/**
 * Identify Weak Spots in Aleph's Knowledge
 * Excludes stop words (grammatical particles) as these aren't conceptual weaknesses
 */
function identifyWeaknesses() {
  const weakWords = [];
  
  // Stop words are grammatical particles, not concepts to teach
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'of', 'in', 'to',
    'for', 'with', 'on', 'at', 'by', 'from', 'and', 'or', 'but', 'if',
    'it', 'its', 'this', 'that', 'what', 'which', 'who', 'whom', 'whose',
    'how', 'when', 'where', 'why', 'can', 'could', 'would', 'should', 'will',
    'i', 'you', 'we', 'they', 'he', 'she', 'me', 'us', 'them', 'my', 'your',
    'our', 'their', 'his', 'her', 'as', 'so', 'no', 'yes', 'not', 'do', 'does'
  ]);
  
  // Check for words with low prime diversity (excluding stop words)
  for (const [word, primes] of Object.entries(semanticConfig.vocabulary)) {
    if (stopWords.has(word)) continue;  // Skip grammatical particles
    if (!primes || primes.length < 2) {
      weakWords.push({ word, score: primes?.length || 0, reason: 'low_primes' });
    }
  }

  return weakWords.sort((a, b) => a.score - b.score).slice(0, 5);
}

// JSON Schemas for structured LLM responses
const LESSON_SCHEMA = {
  type: 'object',
  properties: {
    concept: { type: 'string', description: 'The target concept being taught' },
    question: { type: 'string', description: 'A question about the concept' },
    ideal_response_text: { type: 'string', description: 'The ideal answer to the question' }
  },
  required: ['concept', 'question', 'ideal_response_text'],
  additionalProperties: false
};

const RULE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'A short descriptive name for this rule' },
    q: {
      type: 'array',
      items: { type: 'integer' },
      description: 'Trigger primes - subset of input primes that identify context'
    },
    r: {
      type: 'array',
      items: { type: 'integer' },
      description: 'Response primes - subset of ideal primes to add'
    }
  },
  required: ['name', 'q', 'r'],
  additionalProperties: false
};

/**
 * The Mentor: Generates a targeted prompt based on weaknesses
 */
async function generateLesson(weaknesses) {
  const targetWord = weaknesses[0]?.word || SEED_CONCEPTS[Math.floor(Math.random() * SEED_CONCEPTS.length)];
  
  const prompt = `You are creating a lesson for an AI learning system.

Target concept to teach: "${targetWord}"

Create a simple question about "${targetWord}" and provide an ideal answer.

STRICT Requirements:
- Question must be a complete sentence ending with a question mark
- ideal_response_text must be a COMPLETE sentence (minimum 10 words)
- ideal_response_text MUST use the word "${targetWord}" and 3-5 related concepts
- Do NOT truncate or abbreviate - provide the FULL answer
- Example format: "Energy is the capacity to do work, and it exists in many forms including kinetic, potential, thermal, and chemical energy."`;

  try {
    const res = await LLM.chat([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      maxTokens: 500,
      jsonSchema: LESSON_SCHEMA
    });

    // Content should already be parsed JSON if schema was used
    if (typeof res.content === 'object' && res.content.concept) {
      return res.content;
    }
    
    // Fallback: try to parse if returned as string
    const parsed = typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
    return parsed;
  } catch (e) {
    console.error(`  ⚠️ Lesson generation failed: ${e.message}. Using fallback.`);
    return {
      concept: targetWord,
      question: `What is the nature of ${targetWord}?`,
      ideal_response_text: `${targetWord} is a fundamental aspect of existence and meaning.`
    };
  }
}

/**
 * The Critic: Evaluates response and synthesizes a correction rule
 */
async function critiqueAndTeach(lesson, alephResponse) {
  const inputPrimes = alephResponse.inputPrimes;
  const actualOutputPrimes = alephResponse.resultPrimes;
  
  // Validate ideal response isn't truncated
  const idealText = lesson.ideal_response_text || '';
  const wordCount = idealText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5 || idealText.includes('...')) {
    console.log(`  ⚠️ Ideal response too short or truncated (${wordCount} words). Skipping.`);
    return null;
  }
  
  // Get ideal primes - use encodeAll to include stop words for complete semantics
  const idealPrimes = backend.encodeAll(idealText);
  
  if (!idealPrimes || idealPrimes.length === 0) {
    console.log(`  ⚠️ Ideal response yielded no primes. Skipping critique.`);
    return null;
  }

  console.log(`\n  📝 Lesson: "${lesson.question}"`);
  console.log(`  Aleph thought: "${alephResponse.output}"`);
  console.log(`  Mentor wanted: "${lesson.ideal_response_text}"`);

  // Calculate semantic overlap
  const intersection = idealPrimes.filter(p => actualOutputPrimes.includes(p));
  const score = intersection.length / (idealPrimes.length || 1);
  
  stats.semanticScores.push(score);
  if (stats.semanticScores.length > 50) stats.semanticScores.shift();

  if (score > 0.6) {
    console.log(`  ✅ Aleph passed (Score: ${score.toFixed(2)}).`);
    stats.passes++;
    return null;
  }

  console.log('  ⚠️ Weakness confirmed. Synthesizing new mental model...');

  const sys = `You are a Cognitive Architect.
Aleph failed to respond correctly to a stimulus.
Create a Transform Rule to bridge the gap.

Ontology: ${ontologyMap}

Stimulus Primes: ${JSON.stringify(inputPrimes)}
Current Response Primes: ${JSON.stringify(actualOutputPrimes)}
Ideal Response Primes: ${JSON.stringify(idealPrimes)}

Create a rule "q -> r".
- q (Trigger): Select 2-4 primes from Stimulus Primes that identify the context
- r (Response): Select 2-4 primes from Ideal Primes that capture the missing meaning
- name: A short descriptive name for this rule`;

  try {
    const res = await LLM.chat([{ role: 'system', content: sys }], {
      temperature: 0.2,
      maxTokens: 200,
      jsonSchema: RULE_SCHEMA
    });

    // Content should already be parsed JSON if schema was used
    if (typeof res.content === 'object' && res.content.name) {
      return res.content;
    }
    
    // Fallback: try to parse if returned as string
    const parsed = typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
    return parsed;
  } catch (e) {
    console.error(`  ❌ Critique failed: ${e.message}`);
    return null;
  }
}

// --- Performance Tracking ---
const stats = {
  turns: 0,
  passes: 0,
  rulesSynthesized: 0,
  vocabStart: Object.keys(semanticConfig.vocabulary).length,
  semanticScores: []
};

function printStats() {
  const vocabGained = Object.keys(semanticConfig.vocabulary).length - stats.vocabStart;
  const avgScore = stats.semanticScores.length
    ? (stats.semanticScores.reduce((a,b)=>a+b,0) / stats.semanticScores.length).toFixed(2)
    : '0.00';
  const passRate = stats.turns ? ((stats.passes / stats.turns) * 100).toFixed(1) : '0.0';

  console.log('\n📊 ALEPH PERFORMANCE');
  console.log(`   Turns: ${stats.turns} | Pass Rate: ${passRate}% | Avg Alignment: ${avgScore}`);
  console.log(`   Vocab: ${Object.keys(semanticConfig.vocabulary).length} (+${vocabGained}) | Rules: ${semanticConfig.transforms.length}`);
  console.log('------------------------------------------------------------');
}

// --- Main Loop ---

async function startMentor() {
  console.log('🎓 Aleph Mentor v2.0 (Modular Architecture)');
  console.log('---------------------------');
  
  // Check if LLM is available
  const llmAvailable = await LLM.ping();
  if (!llmAvailable) {
    console.log('⚠️ LLM not available. Trainer requires LLM for lesson generation.');
    console.log(`   Configure LLM at ${LLM.getConfig().baseUrl}`);
    process.exit(1);
  }
  console.log('✓ LLM connected');

  while (true) {
    stats.turns++;
    printStats();

    try {
      // 1. Identify Weaknesses
      let weaknesses = identifyWeaknesses();
      
      if (weaknesses.length === 0) {
        console.log('  No structural weaknesses. Using seed concepts.');
        weaknesses = [{ word: SEED_CONCEPTS[Math.floor(Math.random() * SEED_CONCEPTS.length)] }];
      }
      
      console.log(`\n🔍 Focus: ${weaknesses.map(w => w.word).join(', ')}`);

      // 2. Generate Lesson
      const lesson = await generateLesson(weaknesses);
      console.log(`\n🗣️  Mentor: "${lesson.question}"`);

      // 3. Aleph Responds
      engine.reset();
      const r = engine.run(lesson.question);

      // 4. Critique and Teach
      const rule = await critiqueAndTeach(lesson, r);

      if (rule && rule.q && rule.r && rule.q.length > 0 && rule.r.length > 0) {
        console.log(`  ✨ New Rule: "${rule.name}"`);
        console.log(`     [${rule.q.join(',')}] -> [${rule.r.join(',')}]`);
        
        semanticConfig.transforms.push({
          n: rule.name,
          q: rule.q,
          r: rule.r
        });
        stats.rulesSynthesized++;
        saveData();
      }

      // Pause for reflection
      await new Promise(r => setTimeout(r, 2000));

    } catch (e) {
      console.error('Error in mentor loop:', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

startMentor().catch(console.error);