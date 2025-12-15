/**
 * TinyAleph Modular Demo
 * 
 * Demonstrates the three backend types:
 * 1. Semantic - Natural language processing
 * 2. Cryptographic - Hashing and key derivation
 * 3. Scientific - Quantum simulation
 */

const {
  createEngine,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend,
  AlephEngine,
  hash,
  deriveKey
} = require('../modular');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║         TinyAleph Modular Architecture Demo                  ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// ============================================
// 1. SEMANTIC COMPUTING
// ============================================
console.log('┌───────────────────────────────────────────────────────────────┐');
console.log('│  SEMANTIC BACKEND - Natural Language Understanding           │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const semanticConfig = {
  dimension: 16,
  vocabulary: {
    'love': [2, 3, 5],
    'truth': [7, 11, 13],
    'wisdom': [2, 7, 11],
    'knowledge': [3, 5, 7],
    'beauty': [2, 5, 11],
    'justice': [3, 7, 13],
    'freedom': [5, 11, 17],
    'peace': [2, 3, 7]
  },
  ontology: {
    2: 'existence',
    3: 'unity',
    5: 'form',
    7: 'logos',
    11: 'psyche',
    13: 'telos',
    17: 'dynamis'
  },
  transforms: [
    { n: 'synthesis', q: [2, 3], r: [5] },
    { n: 'analysis', q: [5], r: [2, 3] },
    { n: 'transcend', q: [2, 3, 5], r: [7, 11] }
  ]
};

const semanticEngine = createEngine('semantic', semanticConfig);

console.log('Processing: "love and truth lead to wisdom"\n');
const semanticResult = semanticEngine.run('love and truth lead to wisdom');

console.log(`  Input primes:  [${semanticResult.inputPrimes.slice(0, 8).join(', ')}...]`);
console.log(`  Output:        "${semanticResult.output}"`);
console.log(`  Entropy:       ${semanticResult.entropy.toFixed(3)}`);
console.log(`  Coherence:     ${semanticResult.coherence.toFixed(3)}`);
console.log(`  Stability:     ${semanticResult.stability}`);

if (semanticResult.steps.length > 0) {
  console.log('\n  Reasoning steps:');
  for (const step of semanticResult.steps) {
    console.log(`    ${step.step}. ${step.transform} (ΔH = -${step.entropyDrop.toFixed(3)})`);
  }
}

// ============================================
// 2. CRYPTOGRAPHIC APPLICATIONS
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  CRYPTOGRAPHIC BACKEND - Hashing & Key Derivation            │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const cryptoBackend = new CryptographicBackend({ dimension: 32 });

// Hashing demonstration
console.log('Hashing demonstration:');
const message1 = 'Hello, World!';
const message2 = 'Hello, World?';

const hash1 = cryptoBackend.hash(message1);
const hash2 = cryptoBackend.hash(message2);

console.log(`  Input 1: "${message1}"`);
console.log(`  Hash 1:  ${hash1.toString('hex').slice(0, 32)}...`);
console.log(`  Input 2: "${message2}"`);
console.log(`  Hash 2:  ${hash2.toString('hex').slice(0, 32)}...`);
console.log(`  Different: ${!hash1.equals(hash2)}`);

// Key derivation
console.log('\nKey derivation (PBKDF-like):');
const password = 'my-secret-password';
const salt = 'random-salt-value';
const key = cryptoBackend.deriveKey(password, salt, 32, 1000);
console.log(`  Password: "${password}"`);
console.log(`  Salt:     "${salt}"`);
console.log(`  Key:      ${key.toString('hex').slice(0, 32)}...`);

// HMAC
console.log('\nHMAC computation:');
const hmacKey = 'secret-key';
const hmacMsg = 'authenticate this message';
const hmac = cryptoBackend.hmac(hmacKey, hmacMsg);
console.log(`  Key:     "${hmacKey}"`);
console.log(`  Message: "${hmacMsg}"`);
console.log(`  HMAC:    ${hmac.toString('hex').slice(0, 32)}...`);

// ============================================
// 3. SCIENTIFIC COMPUTING
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  SCIENTIFIC BACKEND - Quantum Simulation                     │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const scientificBackend = new ScientificBackend({ dimension: 16 });

// Quantum state manipulation
console.log('Quantum state encoding:');
console.log(`  |0⟩ encodes to: [${scientificBackend.encode('|0⟩').join(', ')}]`);
console.log(`  |1⟩ encodes to: [${scientificBackend.encode('|1⟩').join(', ')}]`);
console.log(`  |+⟩ encodes to: [${scientificBackend.encode('|+⟩').join(', ')}]`);
console.log(`  |Φ+⟩ (Bell) encodes to: [${scientificBackend.createEntangledPair('Φ+').join(', ')}]`);

// Quantum gates
console.log('\nQuantum gate application:');
const qubit0 = [2];  // |0⟩
console.log(`  Initial: |0⟩ = [${qubit0.join(', ')}]`);

const afterX = scientificBackend.applyGate(qubit0, 'X');
console.log(`  After X gate: [${afterX.join(', ')}] → ${scientificBackend.decode(afterX)}`);

const afterH = scientificBackend.applyGate(qubit0, 'H');
console.log(`  After H gate: [${afterH.join(', ')}] → ${scientificBackend.decode(afterH)}`);

// Measurement
console.log('\nQuantum measurement (10 samples from |+⟩ state):');
const plusState = scientificBackend.primesToState([2, 3]);
const outcomes = { '|0⟩': 0, '|1⟩': 0 };
for (let i = 0; i < 10; i++) {
  const result = scientificBackend.measure(plusState);
  outcomes[result.state]++;
}
console.log(`  |0⟩ outcomes: ${outcomes['|0⟩']}`);
console.log(`  |1⟩ outcomes: ${outcomes['|1⟩']}`);

// Particle interaction
console.log('\nParticle interaction simulation:');
const electron = [11];  // electron prime
const positron = [13];  // positron prime
const interaction = scientificBackend.interact(electron, positron, 'electromagnetic');
console.log(`  Particles: electron [${electron}] + positron [${positron}]`);
console.log(`  Interaction: ${interaction.interaction}`);
console.log(`  Conserved quantity: ${interaction.conserved}`);

// ============================================
// 4. BACKEND SWITCHING AT RUNTIME
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  RUNTIME BACKEND SWITCHING                                   │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const engine = createEngine('semantic', semanticConfig);
console.log(`Starting backend: ${engine.getBackendInfo().name}`);

engine.setBackend(new CryptographicBackend({ dimension: 32 }));
console.log(`Switched to:      ${engine.getBackendInfo().name}`);

engine.setBackend(new ScientificBackend({ dimension: 16 }));
console.log(`Switched to:      ${engine.getBackendInfo().name}`);

// ============================================
// 5. PHYSICS ENGINE DEMONSTRATION
// ============================================
console.log('\n┌───────────────────────────────────────────────────────────────┐');
console.log('│  PHYSICS ENGINE - Oscillator Dynamics                        │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

const physicsEngine = createEngine('semantic', semanticConfig);
physicsEngine.run('test input to excite oscillators');

console.log('Evolving system for 20 time steps:');
const evolution = physicsEngine.evolve(20);

console.log('\n  Step | Entropy | Order | Stability');
console.log('  -----+---------+-------+----------');
for (let i = 0; i < evolution.length; i += 4) {
  const e = evolution[i];
  console.log(`   ${String(e.step).padStart(2)}  |  ${e.entropy.toFixed(3)}  | ${e.orderParameter.toFixed(3)} | ${e.stability}`);
}

const finalState = physicsEngine.getPhysicsState();
console.log(`\n  Final Lyapunov exponent: ${finalState.lyapunov.toFixed(4)}`);
console.log(`  Final coupling strength: ${finalState.coupling.toFixed(3)}`);
console.log(`  Collapse probability:    ${finalState.collapseProbability.toFixed(3)}`);

// ============================================
// SUMMARY
// ============================================
console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                     Demo Complete                             ║');
console.log('╠═══════════════════════════════════════════════════════════════╣');
console.log('║  Backends demonstrated:                                       ║');
console.log('║    ✓ SemanticBackend     - NLP, concept mapping               ║');
console.log('║    ✓ CryptographicBackend - hash, PBKDF, HMAC                 ║');
console.log('║    ✓ ScientificBackend   - quantum gates, measurement         ║');
console.log('║                                                               ║');
console.log('║  Features shown:                                              ║');
console.log('║    ✓ Unified AlephEngine with backend-agnostic API            ║');
console.log('║    ✓ Runtime backend switching                                ║');
console.log('║    ✓ Kuramoto oscillator physics simulation                   ║');
console.log('║    ✓ Lyapunov stability analysis                              ║');
console.log('║    ✓ Entropy-minimizing reasoning                             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');