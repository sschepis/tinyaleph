/**
 * Aleph Chat Client
 * Command-line interface to converse with Aleph
 * 
 * Updated to use modular architecture.
 */
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { createEngine, SemanticBackend } = require('../modular');

// Configuration
const semanticConfig = {
  dimension: 16,
  vocabulary: require('../data.json').vocabulary,
  ontology: require('../data.json').ontology || {},
  transforms: require('../data.json').transforms || []
};

const engine = createEngine('semantic', semanticConfig);

// Watch for changes in data.json
const DATA_FILE = path.join(__dirname, '../data.json');
fs.watchFile(DATA_FILE, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('\n[System] data.json changed. Reloading...');
    try {
      delete require.cache[require.resolve('../data.json')];
      const newData = require('../data.json');
      
      // Create new backend with updated vocabulary
      const newBackend = new SemanticBackend({
        dimension: 16,
        vocabulary: newData.vocabulary,
        ontology: newData.ontology || {},
        transforms: newData.transforms || []
      });
      engine.setBackend(newBackend);
      
      console.log(`[System] Reloaded. Vocabulary size: ${Object.keys(newData.vocabulary).length}`);
      rl.prompt();
    } catch (e) {
      console.error(`[System] Failed to reload: ${e.message}`);
    }
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Aleph> '
});

console.log('🔮 Aleph Chat v2.0 (Modular Architecture)');
console.log('Type "exit" to quit, "info" for system stats.');
console.log('-------------------------------------------');

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  
  if (!input) {
    rl.prompt();
    return;
  }

  if (input === 'exit') {
    console.log('Goodbye.');
    process.exit(0);
  }

  if (input === 'info') {
    const state = engine.getPhysicsState();
    const info = engine.getBackendInfo();
    console.log(`H=${state.entropy.toFixed(3)} C=${state.coherence.toFixed(3)} λ=${state.lyapunov.toFixed(3)}`);
    console.log(`Backend: ${info.name} | Dim: ${info.dimension} | Order: ${state.orderParameter.toFixed(3)}`);
    rl.prompt();
    return;
  }

  try {
    // Process input through engine
    const r = engine.run(input);
    displayResponse(r);
  } catch (e) {
    console.error('Error:', e.message);
  }

  rl.prompt();
});

function displayResponse(r) {
  // Show internal state
  const primes = r.inputPrimes.slice(0, 5).join(',');
  console.log(`  [${primes}...]`);
  console.log(`  H=${r.entropy.toFixed(2)} C=${r.coherence.toFixed(2)} ${r.stability}`);
  
  if (r.fieldBased) {
    console.log(`  🔬 Field-based (${r.evolutionSteps} steps, order=${r.bestFrameOrder.toFixed(2)})`);
  }
  
  // Show output
  console.log(`\n${r.output}\n`);
}