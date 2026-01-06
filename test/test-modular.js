/**
 * Test suite for TinyAleph Modular implementation
 * Tests all three backends: Semantic, Cryptographic, Scientific
 */

const {
  AlephEngine,
  createEngine,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend,
  Hypercomplex,
  isPrime,
  firstNPrimes,
  hash,
  deriveKey
} = require('../modular');

// Simple test framework
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

console.log('=== TinyAleph Modular Test Suite ===\n');

// ============================================
// CORE TESTS
// ============================================
console.log('--- Core Module Tests ---');

test('Hypercomplex creation (16D)', () => {
  const h = Hypercomplex.zero(16);
  assert(h.dim === 16, 'Dimension should be 16');
  assert(h.c.length === 16, 'Components array length should be 16');
});

test('Hypercomplex basis vector', () => {
  const h = Hypercomplex.basis(16, 3, 1.0);
  assert(h.c[3] === 1.0, 'Basis component should be 1.0');
  assert(h.c[0] === 0, 'Other components should be 0');
});

test('Hypercomplex addition', () => {
  const a = Hypercomplex.basis(8, 0, 1);
  const b = Hypercomplex.basis(8, 0, 2);
  const sum = a.add(b);
  assert(sum.c[0] === 3, 'Sum should be 3');
});

test('Hypercomplex multiplication', () => {
  const a = Hypercomplex.fromReal(4, 2);
  const b = Hypercomplex.fromReal(4, 3);
  const prod = a.mul(b);
  assert(prod.c[0] === 6, 'Real product should be 6');
});

test('Hypercomplex norm and normalize', () => {
  const h = Hypercomplex.basis(4, 0, 3);
  h.c[1] = 4;
  assert(h.norm() === 5, 'Norm should be 5 (3-4-5 triangle)');
  const normalized = h.normalize();
  assert(Math.abs(normalized.norm() - 1) < 0.0001, 'Normalized norm should be 1');
});

test('Hypercomplex entropy', () => {
  const h = Hypercomplex.basis(4, 0, 1);
  const entropy = h.entropy();
  assert(entropy === 0, 'Pure state entropy should be 0');
});

test('isPrime function', () => {
  assert(isPrime(2) === true, '2 should be prime');
  assert(isPrime(17) === true, '17 should be prime');
  assert(isPrime(4) === false, '4 should not be prime');
  assert(isPrime(1) === false, '1 should not be prime');
});

test('firstNPrimes function', () => {
  const primes = firstNPrimes(5);
  assert(primes.length === 5, 'Should return 5 primes');
  assert(primes[0] === 2, 'First prime is 2');
  assert(primes[4] === 11, 'Fifth prime is 11');
});

// ============================================
// SEMANTIC BACKEND TESTS
// ============================================
console.log('\n--- Semantic Backend Tests ---');

test('SemanticBackend creation', () => {
  const backend = new SemanticBackend({
    dimension: 16,
    vocabulary: { 'love': [2, 3, 5], 'truth': [7, 11, 13] }
  });
  assert(backend.dimension === 16, 'Dimension should be 16');
  assert(backend.getVocabularySize() === 2, 'Vocabulary size should be 2');
});

test('SemanticBackend encode/decode', () => {
  const backend = new SemanticBackend({
    dimension: 16,
    vocabulary: { 'love': [2, 3, 5], 'truth': [7, 11, 13] }
  });
  const primes = backend.encode('love');
  assert(primes.includes(2), 'Encoded primes should include 2');
  assert(primes.includes(3), 'Encoded primes should include 3');
});

test('SemanticBackend primesToState', () => {
  const backend = new SemanticBackend({ dimension: 16 });
  const state = backend.primesToState([2, 3, 5]);
  assert(state.dim === 16, 'State dimension should be 16');
  assert(Math.abs(state.norm() - 1) < 0.001, 'State should be normalized');
});

test('SemanticBackend tokenize', () => {
  const backend = new SemanticBackend({ dimension: 16 });
  const tokens = backend.tokenize('hello world');
  assert(tokens.length === 2, 'Should have 2 tokens');
  assert(tokens[0].word === 'hello', 'First word should be hello');
});

test('SemanticBackend stop word filtering', () => {
  const backend = new SemanticBackend({ dimension: 16 });
  const tokens = backend.tokenize('the quick brown fox', true);
  assert(!tokens.find(t => t.word === 'the'), 'Stop word "the" should be filtered');
});

test('SemanticBackend NON-COMMUTATIVITY (order matters)', () => {
  const backend = new SemanticBackend({
    dimension: 16,
    vocabulary: {
      'dog': [2, 3],
      'bites': [5, 7],
      'man': [11, 13]
    }
  });
  
  // "dog bites man" and "man bites dog" should produce DIFFERENT states
  const state1 = backend.textToOrderedState('dog bites man');
  const state2 = backend.textToOrderedState('man bites dog');
  
  const similarity = state1.coherence(state2);
  
  // They share the same words, so there will be some similarity
  // But if order is properly encoded, similarity should be < 0.95
  assert(similarity < 0.95,
    `Order not encoded! "dog bites man" too similar to "man bites dog" (${similarity.toFixed(3)})`);
  
  // Sanity check: same sentence should be identical
  const state1again = backend.textToOrderedState('dog bites man');
  const selfSimilarity = state1.coherence(state1again);
  assert(selfSimilarity > 0.99,
    `Same sentence should produce same state (${selfSimilarity.toFixed(3)})`);
});

test('SemanticBackend position tracking in tokens', () => {
  const backend = new SemanticBackend({ dimension: 16 });
  const tokens = backend.tokenize('one two three');
  assert(tokens[0].position === 0, 'First token should have position 0');
  assert(tokens[1].position === 1, 'Second token should have position 1');
  assert(tokens[2].position === 2, 'Third token should have position 2');
});

// ============================================
// CRYPTOGRAPHIC BACKEND TESTS
// ============================================
console.log('\n--- Cryptographic Backend Tests ---');

test('CryptographicBackend creation', () => {
  const backend = new CryptographicBackend({ dimension: 32 });
  assert(backend.dimension === 32, 'Dimension should be 32');
  assert(backend.keyPrimes.length === 256, 'Should have 256 key primes');
});

test('CryptographicBackend encode/decode', () => {
  const backend = new CryptographicBackend({ dimension: 32 });
  const input = 'Hello';
  const primes = backend.encode(input);
  assert(primes.length === 5, 'Should have 5 primes (one per char)');
  const decoded = backend.decode(primes);
  assert(decoded instanceof Buffer, 'Decoded should be Buffer');
});

test('CryptographicBackend hash', () => {
  const backend = new CryptographicBackend({ dimension: 32 });
  const hash1 = backend.hash('test');
  const hash2 = backend.hash('test');
  const hash3 = backend.hash('different');
  assert(hash1.length === 32, 'Hash should be 32 bytes');
  assert(hash1.equals(hash2), 'Same input should give same hash');
  assert(!hash1.equals(hash3), 'Different input should give different hash');
});

test('CryptographicBackend deriveKey', () => {
  const backend = new CryptographicBackend({ dimension: 32 });
  const key = backend.deriveKey('password', 'salt', 32, 100);
  assert(key.length === 32, 'Key should be 32 bytes');
});

test('Convenience hash function', () => {
  const h = hash('test message');
  assert(h.length === 32, 'Default hash length is 32');
  assert(Buffer.isBuffer(h), 'Should return Buffer');
});

// ============================================
// SCIENTIFIC BACKEND TESTS
// ============================================
console.log('\n--- Scientific Backend Tests ---');

test('ScientificBackend creation', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  assert(backend.dimension === 16, 'Dimension should be 16');
  assert(Object.keys(backend.quantumGates).length > 0, 'Should have quantum gates');
});

test('ScientificBackend qubit encoding', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  const primes0 = backend.encode('|0⟩');
  const primes1 = backend.encode('|1⟩');
  const primesPlus = backend.encode('|+⟩');
  assert(primes0.includes(2), '|0⟩ should encode to 2');
  assert(primes1.includes(3), '|1⟩ should encode to 3');
  assert(primesPlus.includes(2) && primesPlus.includes(3), '|+⟩ should include 2 and 3');
});

test('ScientificBackend qubit decoding', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  assert(backend.decode([2]) === '|0⟩', '[2] should decode to |0⟩');
  assert(backend.decode([3]) === '|1⟩', '[3] should decode to |1⟩');
  assert(backend.decode([2, 3]) === '|+⟩', '[2,3] should decode to |+⟩');
});

test('ScientificBackend quantum gate', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  const result = backend.applyGate([2], 'X');  // Apply X gate to |0⟩
  assert(result.includes(3), 'X gate should flip |0⟩ to |1⟩');
});

test('ScientificBackend measurement', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  const state = backend.primesToState([2]);  // |0⟩
  const result = backend.measure(state);
  assert('outcome' in result, 'Measurement should have outcome');
  assert('probability' in result, 'Measurement should have probability');
});

test('ScientificBackend particle interaction', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  const result = backend.interact([11], [13], 'electromagnetic');  // electron + positron
  assert(result.interaction === 'electromagnetic', 'Interaction type should match');
  assert(result.conserved > 0, 'Should have conserved quantity');
});

test('ScientificBackend Bell state creation', () => {
  const backend = new ScientificBackend({ dimension: 16 });
  const bell = backend.createEntangledPair('Φ+');
  assert(bell.length === 4, 'Bell state should have 4 primes');
});

// ============================================
// ENGINE TESTS
// ============================================
console.log('\n--- AlephEngine Tests ---');

test('AlephEngine creation with semantic backend', () => {
  const backend = new SemanticBackend({ dimension: 16 });
  const engine = new AlephEngine(backend);
  const info = engine.getBackendInfo();
  assert(info.name === 'SemanticBackend', 'Backend name should match');
  assert(info.dimension === 16, 'Dimension should be 16');
});

test('AlephEngine run with semantic input', () => {
  const backend = new SemanticBackend({
    dimension: 16,
    vocabulary: { 'hello': [2, 3], 'world': [5, 7] }
  });
  const engine = new AlephEngine(backend);
  const result = engine.run('hello');
  assert('output' in result, 'Result should have output');
  assert('entropy' in result, 'Result should have entropy');
  assert('inputPrimes' in result, 'Result should have inputPrimes');
});

test('AlephEngine physics state', () => {
  const backend = new SemanticBackend({ dimension: 16 });
  const engine = new AlephEngine(backend);
  engine.run('test');
  const state = engine.getPhysicsState();
  assert('entropy' in state, 'Physics state should have entropy');
  assert('lyapunov' in state, 'Physics state should have lyapunov');
  assert('orderParameter' in state, 'Physics state should have orderParameter');
});

test('AlephEngine backend switching', () => {
  const semanticBackend = new SemanticBackend({ dimension: 16 });
  const cryptoBackend = new CryptographicBackend({ dimension: 32 });
  
  const engine = new AlephEngine(semanticBackend);
  assert(engine.getBackendInfo().name === 'SemanticBackend', 'Initial backend');
  
  engine.setBackend(cryptoBackend);
  assert(engine.getBackendInfo().name === 'CryptographicBackend', 'Switched backend');
});

test('createEngine factory', () => {
  const semanticEngine = createEngine('semantic', { dimension: 16 });
  const cryptoEngine = createEngine('crypto', { dimension: 32 });
  const scienceEngine = createEngine('scientific', { dimension: 16 });
  
  assert(semanticEngine.getBackendInfo().name === 'SemanticBackend', 'Semantic engine');
  assert(cryptoEngine.getBackendInfo().name === 'CryptographicBackend', 'Crypto engine');
  assert(scienceEngine.getBackendInfo().name === 'ScientificBackend', 'Science engine');
});

test('AlephEngine evolve', () => {
  const engine = createEngine('semantic', { dimension: 16 });
  engine.run('test');
  const evolution = engine.evolve(5);
  assert(evolution.length === 5, 'Should have 5 evolution steps');
  assert('entropy' in evolution[0], 'Each step should have entropy');
});

test('AlephEngine batch run', () => {
  const engine = createEngine('semantic', { dimension: 16 });
  const results = engine.runBatch(['hello', 'world']);
  assert(results.length === 2, 'Should have 2 results');
});

test('AlephEngine history', () => {
  const engine = createEngine('semantic', { dimension: 16 });
  engine.run('first');
  engine.run('second');
  const history = engine.getHistory();
  assert(history.length === 2, 'History should have 2 entries');
});

// ============================================
// INTEGRATION TESTS
// ============================================
console.log('\n--- Integration Tests ---');

test('Full semantic pipeline', () => {
  const config = {
    dimension: 16,
    vocabulary: {
      'love': [2, 3, 5],
      'truth': [7, 11, 13],
      'wisdom': [2, 7, 11]
    },
    transforms: [
      { n: 'love_to_truth', q: [2, 3, 5], r: [7, 11, 13] }
    ]
  };
  const engine = createEngine('semantic', config);
  const result = engine.run('love truth wisdom');
  assert(result.entropy >= 0, 'Entropy should be non-negative');
  assert(result.resultPrimes.length > 0, 'Should have result primes');
});

test('Full crypto pipeline', () => {
  const engine = createEngine('crypto', { dimension: 32 });
  const result = engine.run('secret message');
  assert(result.output instanceof Buffer, 'Crypto output should be Buffer');
});

test('Full scientific pipeline', () => {
  const engine = createEngine('scientific', { dimension: 16 });
  const result = engine.run(['|0⟩', '|1⟩']);
  assert(typeof result.output === 'string', 'Scientific output should be string');
});

test('Cross-backend entropy comparison', () => {
  const semantic = createEngine('semantic', { dimension: 16 });
  const crypto = createEngine('crypto', { dimension: 16 });
  const science = createEngine('scientific', { dimension: 16 });
  
  const r1 = semantic.run('test input');
  const r2 = crypto.run('test input');
  const r3 = science.run('|0⟩');
  
  // All should produce valid entropy values
  assert(r1.entropy >= 0 && r1.entropy <= 4, 'Semantic entropy in range');
  assert(r2.entropy >= 0 && r2.entropy <= 5, 'Crypto entropy in range');
  assert(r3.entropy >= 0 && r3.entropy <= 4, 'Scientific entropy in range');
});

// ============================================
// SUMMARY
// ============================================
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n✗ ${failed} test(s) failed`);
  process.exit(1);
}