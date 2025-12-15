/**
 * Tests for backend implementations
 * Covers Semantic, Cryptographic, and Scientific backends
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { SemanticBackend } = require('../backends/semantic');
const { CryptographicBackend } = require('../backends/cryptographic');
const { ScientificBackend } = require('../backends/scientific');

describe('SemanticBackend', () => {
  let backend;

  beforeEach(() => {
    backend = new SemanticBackend({
      dimension: 8,
      vocabulary: {
        hello: [2, 3],
        world: [5, 7],
        dog: [11, 13],
        bites: [17, 19],
        man: [23, 29]
      },
      ontology: {
        2: 'existence/being',
        3: 'relation/connection',
        5: 'space/location',
        7: 'time/duration'
      }
    });
  });

  describe('construction', () => {
    it('should create with vocabulary', () => {
      assert.ok(backend);
      assert.strictEqual(backend.getVocabularySize(), 5);
    });

    it('should check word existence', () => {
      assert.strictEqual(backend.hasWord('hello'), true);
      assert.strictEqual(backend.hasWord('unknown'), false);
    });

    it('should get word primes', () => {
      const primes = backend.getWordPrimes('hello');
      assert.deepStrictEqual(primes, [2, 3]);
    });
  });

  describe('tokenization', () => {
    it('should tokenize text', () => {
      const tokens = backend.tokenize('hello world');
      assert.strictEqual(tokens.length, 2);
      assert.strictEqual(tokens[0].word, 'hello');
      assert.strictEqual(tokens[1].word, 'world');
    });

    it('should mark known words', () => {
      const tokens = backend.tokenize('hello unknown');
      assert.strictEqual(tokens[0].known, true);
      assert.strictEqual(tokens[1].known, false);
    });

    it('should track positions', () => {
      const tokens = backend.tokenize('hello world');
      assert.strictEqual(tokens[0].position, 0);
      assert.strictEqual(tokens[1].position, 1);
    });

    it('should filter stop words when requested', () => {
      const tokens = backend.tokenize('the hello is world', true);
      // 'the' and 'is' are stop words
      const words = tokens.map(t => t.word);
      assert.ok(!words.includes('the'));
      assert.ok(!words.includes('is'));
    });
  });

  describe('encoding', () => {
    it('should encode text to primes', () => {
      const primes = backend.encode('hello world');
      assert.ok(Array.isArray(primes));
      assert.ok(primes.includes(2));
      assert.ok(primes.includes(5));
    });

    it('should generate primes for unknown words', () => {
      const primes = backend.encode('xyz');
      assert.ok(Array.isArray(primes));
      assert.ok(primes.length > 0);
    });
  });

  describe('decoding', () => {
    it('should decode primes to text', () => {
      const text = backend.decode([2, 3]);
      assert.strictEqual(typeof text, 'string');
      assert.ok(text.length > 0);
    });

    it('should use vocabulary for decoding', () => {
      const text = backend.decode([2, 3, 5, 7]);
      assert.ok(text.includes('hello') || text.includes('world'));
    });
  });

  describe('state conversion', () => {
    it('should convert primes to state', () => {
      const state = backend.primesToState([2, 3, 5]);
      assert.strictEqual(state.dim, 8);
      assert.ok(Math.abs(state.norm() - 1) < 0.0001);
    });

    it('should handle ordered primes to state', () => {
      const tokens = backend.tokenize('dog bites man', true);
      const state = backend.orderedPrimesToState(tokens);
      assert.strictEqual(state.dim, 8);
    });

    it('should be non-commutative for word order', () => {
      const state1 = backend.textToOrderedState('dog bites man');
      const state2 = backend.textToOrderedState('man bites dog');
      // States should be different
      let diff = 0;
      for (let i = 0; i < state1.dim; i++) {
        diff += Math.abs(state1.c[i] - state2.c[i]);
      }
      assert.ok(diff > 0.001);
    });
  });

  describe('learning', () => {
    it('should learn new words', () => {
      backend.learn('newword', [31, 37]);
      assert.strictEqual(backend.hasWord('newword'), true);
      assert.deepStrictEqual(backend.getWordPrimes('newword'), [31, 37]);
    });
  });

  describe('ontology', () => {
    it('should get ontology meaning', () => {
      const meaning = backend.getOntologyMeaning(2);
      assert.strictEqual(meaning, 'existence/being');
    });
  });

  // ============================================
  // DNA-INSPIRED PROCESSING TESTS
  // ============================================

  describe('bidirectional processing (Enochian boustrophedon)', () => {
    it('should compute bidirectional state', () => {
      const tokens = backend.tokenize('dog bites man', true);
      const state = backend.bidirectionalState(tokens);
      assert.strictEqual(state.dim, 8);
      assert.ok(Math.abs(state.norm() - 1) < 0.001);
    });

    it('should combine forward and backward states', () => {
      const tokens = backend.tokenize('hello world', true);
      const biState = backend.bidirectionalState(tokens);
      const forwardState = backend.orderedPrimesToState(tokens);
      
      // Bidirectional should be different from forward-only
      let diff = 0;
      for (let i = 0; i < biState.dim; i++) {
        diff += Math.abs(biState.c[i] - forwardState.c[i]);
      }
      assert.ok(diff > 0.001);
    });

    it('should handle empty tokens', () => {
      const state = backend.bidirectionalState([]);
      assert.strictEqual(state.dim, 8);
      assert.ok(Math.abs(state.c[0] - 1) < 0.001); // Identity
    });
  });

  describe('codon chunking (DNA triplets)', () => {
    it('should group tokens into codons', () => {
      const tokens = backend.tokenize('hello world dog bites man', true);
      const codons = backend.tokensToCodons(tokens, 3);
      
      // 5 tokens -> 2 codons (3 + 2)
      assert.strictEqual(codons.length, 2);
      assert.strictEqual(codons[0].tokens.length, 3);
      assert.strictEqual(codons[1].tokens.length, 2);
    });

    it('should merge primes from codon tokens', () => {
      const tokens = backend.tokenize('hello world', true);
      const codons = backend.tokensToCodons(tokens, 2);
      
      // Single codon with primes from both words
      assert.strictEqual(codons.length, 1);
      assert.ok(codons[0].primes.includes(2)); // from hello
      assert.ok(codons[0].primes.includes(5)); // from world
    });

    it('should compute codon state', () => {
      const state = backend.codonState('dog bites man', 3);
      assert.strictEqual(state.dim, 8);
      assert.ok(Math.abs(state.norm() - 1) < 0.001);
    });
  });

  describe('reading frame shifts (DNA 6-frame)', () => {
    it('should generate 6 reading frames', () => {
      const tokens = backend.tokenize('dog bites man hello world', true);
      const frames = backend.readingFrameStates(tokens, 3);
      
      assert.strictEqual(frames.length, 6);
      
      // 3 forward, 3 reverse
      const forwardFrames = frames.filter(f => f.direction === 'forward');
      const reverseFrames = frames.filter(f => f.direction === 'reverse');
      assert.strictEqual(forwardFrames.length, 3);
      assert.strictEqual(reverseFrames.length, 3);
    });

    it('should have different states for different frames', () => {
      const tokens = backend.tokenize('dog bites man hello world', true);
      const frames = backend.readingFrameStates(tokens, 3);
      
      // Forward frame 0 vs frame 1 should be different
      const state0 = frames[0].state;
      const state1 = frames[1].state;
      let diff = 0;
      for (let i = 0; i < state0.dim; i++) {
        diff += Math.abs(state0.c[i] - state1.c[i]);
      }
      assert.ok(diff > 0.001);
    });

    it('should compute six-frame combined state', () => {
      const state = backend.sixFrameState('dog bites man');
      assert.strictEqual(state.dim, 8);
      assert.ok(Math.abs(state.norm() - 1) < 0.001);
    });
  });

  describe('sense/antisense duality (DNA double helix)', () => {
    it('should return dual representation', () => {
      const tokens = backend.tokenize('hello world', true);
      const dual = backend.dualRepresentation(tokens);
      
      assert.ok(dual.sense);
      assert.ok(dual.antisense);
      assert.ok(typeof dual.magnitude === 'number');
      assert.ok(typeof dual.coherence === 'number');
    });

    it('should have antisense as conjugate of sense', () => {
      const tokens = backend.tokenize('hello world', true);
      const dual = backend.dualRepresentation(tokens);
      
      // Antisense should be the conjugate
      const conjugate = dual.sense.conjugate();
      for (let i = 0; i < dual.sense.dim; i++) {
        assert.ok(Math.abs(dual.antisense.c[i] - conjugate.c[i]) < 0.0001);
      }
    });
  });

  describe('full DNA encoding', () => {
    it('should return complete DNA encoding', () => {
      const result = backend.dnaEncode('dog bites man');
      
      assert.ok(result.tokens);
      assert.ok(result.codons);
      assert.ok(result.frames);
      assert.ok(result.bidirectional);
      assert.ok(result.sixFrame);
      assert.ok(result.sense);
      assert.ok(result.antisense);
      assert.ok(typeof result.magnitude === 'number');
      assert.ok(typeof result.coherence === 'number');
    });

    it('should handle empty text', () => {
      const result = backend.dnaEncode('');
      
      assert.deepStrictEqual(result.tokens, []);
      assert.deepStrictEqual(result.codons, []);
      assert.deepStrictEqual(result.frames, []);
    });

    it('should produce different encodings for different texts', () => {
      const enc1 = backend.dnaEncode('dog bites man');
      const enc2 = backend.dnaEncode('man bites dog');
      
      let diff = 0;
      for (let i = 0; i < enc1.sense.dim; i++) {
        diff += Math.abs(enc1.sense.c[i] - enc2.sense.c[i]);
      }
      assert.ok(diff > 0.001);
    });
  });

  describe('DNA comparison', () => {
    it('should compare two texts', () => {
      const result = backend.dnaCompare('hello world', 'world hello');
      
      assert.ok(typeof result.senseCoherence === 'number');
      assert.ok(typeof result.crossCoherence === 'number');
      assert.ok(typeof result.combinedScore === 'number');
    });

    it('should have high coherence for identical texts', () => {
      const result = backend.dnaCompare('hello world', 'hello world');
      
      assert.ok(result.senseCoherence > 0.99);
    });

    it('should have lower coherence for different texts', () => {
      const same = backend.dnaCompare('hello world', 'hello world');
      const different = backend.dnaCompare('hello world', 'dog bites man');
      
      assert.ok(same.senseCoherence > different.senseCoherence);
    });
  });
});

describe('CryptographicBackend', () => {
  let backend;

  beforeEach(() => {
    backend = new CryptographicBackend({
      dimension: 32,
      rounds: 4
    });
  });

  describe('construction', () => {
    it('should create with key primes', () => {
      assert.ok(backend);
      assert.ok(backend.keyPrimes.length > 0);
    });
  });

  describe('encoding', () => {
    it('should encode string to primes', () => {
      const primes = backend.encode('hello');
      assert.ok(Array.isArray(primes));
      assert.strictEqual(primes.length, 5); // 5 chars
    });

    it('should encode buffer to primes', () => {
      const buf = Buffer.from([1, 2, 3, 4]);
      const primes = backend.encode(buf);
      assert.strictEqual(primes.length, 4);
    });
  });

  describe('decoding', () => {
    it('should decode primes to buffer', () => {
      const primes = backend.encode('test');
      const decoded = backend.decode(primes);
      assert.ok(Buffer.isBuffer(decoded));
    });
  });

  describe('hashing', () => {
    it('should produce hash of specified length', () => {
      const hash = backend.hash('test', 16);
      assert.ok(Buffer.isBuffer(hash));
      assert.strictEqual(hash.length, 16);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = backend.hash('test1');
      const hash2 = backend.hash('test2');
      assert.notDeepStrictEqual(hash1, hash2);
    });

    it('should be deterministic', () => {
      const hash1 = backend.hash('test');
      const hash2 = backend.hash('test');
      assert.deepStrictEqual(hash1, hash2);
    });
  });

  describe('key derivation', () => {
    it('should derive key from password', () => {
      const key = backend.deriveKey('password', 'salt', 32, 100);
      assert.ok(Buffer.isBuffer(key));
      assert.strictEqual(key.length, 32);
    });

    it('should produce different keys for different passwords', () => {
      const key1 = backend.deriveKey('password1', 'salt', 32, 100);
      const key2 = backend.deriveKey('password2', 'salt', 32, 100);
      assert.notDeepStrictEqual(key1, key2);
    });

    it('should produce different keys for different salts', () => {
      const key1 = backend.deriveKey('password', 'salt1', 32, 100);
      const key2 = backend.deriveKey('password', 'salt2', 32, 100);
      assert.notDeepStrictEqual(key1, key2);
    });
  });

  describe('HMAC', () => {
    it('should compute HMAC', () => {
      const hmac = backend.hmac('key', 'message');
      assert.ok(Buffer.isBuffer(hmac));
    });

    it('should be different for different keys', () => {
      const hmac1 = backend.hmac('key1', 'message');
      const hmac2 = backend.hmac('key2', 'message');
      assert.notDeepStrictEqual(hmac1, hmac2);
    });
  });

  describe('prime operations', () => {
    it('should generate random primes', () => {
      const primes = backend.generateRandomPrimes(10);
      assert.strictEqual(primes.length, 10);
      for (const p of primes) {
        assert.ok(backend.keyPrimes.includes(p));
      }
    });

    it('should mix primes', () => {
      const data = [2, 3, 5, 7];
      const key = [11, 13];
      const mixed = backend.mixPrimes(data, key);
      assert.strictEqual(mixed.length, 4);
    });
  });
});

describe('ScientificBackend', () => {
  let backend;

  beforeEach(() => {
    backend = new ScientificBackend({
      dimension: 16
    });
  });

  describe('construction', () => {
    it('should create with default settings', () => {
      assert.ok(backend);
      assert.strictEqual(backend.dimension, 16);
    });

    it('should have quantum gates defined', () => {
      assert.ok(backend.quantumGates);
      assert.ok(backend.quantumGates.X);
      assert.ok(backend.quantumGates.H);
    });
  });

  describe('encoding', () => {
    it('should encode ket notation', () => {
      const primes = backend.encode('|0⟩');
      assert.deepStrictEqual(primes, [2]);
    });

    it('should encode |1⟩', () => {
      const primes = backend.encode('|1⟩');
      assert.deepStrictEqual(primes, [3]);
    });

    it('should encode superposition states', () => {
      const primes = backend.encode('|+⟩');
      assert.deepStrictEqual(primes, [2, 3]);
    });

    it('should encode Bell states', () => {
      const primes = backend.encode('|Φ+⟩');
      assert.deepStrictEqual(primes, [2, 3, 5, 7]);
    });

    it('should encode integers via factorization', () => {
      const primes = backend.encode(12);
      // 12 = 2² × 3
      assert.ok(primes.includes(2));
      assert.ok(primes.includes(3));
    });
  });

  describe('decoding', () => {
    it('should decode to |0⟩', () => {
      const state = backend.decode([2]);
      assert.strictEqual(state, '|0⟩');
    });

    it('should decode to |1⟩', () => {
      const state = backend.decode([3]);
      assert.strictEqual(state, '|1⟩');
    });

    it('should decode superposition', () => {
      const state = backend.decode([2, 3]);
      assert.strictEqual(state, '|+⟩');
    });
  });

  describe('quantum gates', () => {
    it('should apply X gate', () => {
      const input = [2]; // |0⟩
      const output = backend.applyGate(input, 'X');
      assert.ok(Array.isArray(output));
    });

    it('should apply H gate', () => {
      const input = [2]; // |0⟩
      const output = backend.applyGate(input, 'H');
      assert.ok(Array.isArray(output));
    });

    it('should throw for unknown gate', () => {
      assert.throws(() => backend.applyGate([2], 'UNKNOWN'), /Unknown gate/);
    });
  });

  describe('measurement', () => {
    it('should measure state', () => {
      const state = backend.primesToState([2, 3]);
      const result = backend.measure(state);
      
      assert.ok('outcome' in result);
      assert.ok('probability' in result);
      assert.ok(result.outcome === 0 || result.outcome === 1);
    });
  });

  describe('particle physics', () => {
    it('should identify particles', () => {
      const particle = backend.identifyParticle([11]);
      assert.strictEqual(particle, 'electron');
    });

    it('should simulate interactions', () => {
      const result = backend.interact([11], [13], 'electromagnetic');
      assert.ok(result.inputParticles);
      assert.ok(result.interaction);
      assert.ok(result.outputState);
    });
  });

  describe('entanglement', () => {
    it('should create Bell state', () => {
      const primes = backend.createEntangledPair('Φ+');
      assert.deepStrictEqual(primes, [2, 3, 5, 7]);
    });

    it('should compute tensor product', () => {
      const result = backend.tensorProduct([2], [3]);
      assert.ok(result.includes(2));
      assert.ok(result.includes(3));
    });
  });

  describe('rotation', () => {
    it('should apply rotation gate', () => {
      const result = backend.rotate([2], 'x', Math.PI / 2);
      assert.strictEqual(result.dim, 16);
    });
  });
});