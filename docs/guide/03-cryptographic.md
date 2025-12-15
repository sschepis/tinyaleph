# Cryptographic Applications

This guide covers using Aleph for semantic hashing, key derivation, and verification.

## Overview

Aleph's cryptographic backend leverages **hypercomplex arithmetic** to create semantically-aware cryptographic primitives. Unlike traditional hashing where similar inputs produce wildly different outputs, semantic hashing preserves relationships—similar meanings produce similar hashes.

---

## Creating a Cryptographic Engine

```javascript
const { createEngine, CryptographicBackend } = require('./modular');

// Load configuration
const config = require('./data.json');

// Create engine
const engine = createEngine('cryptographic', config);

// Or create backend directly
const backend = new CryptographicBackend(config);
```

---

## Semantic Hashing

### Basic Hashing

```javascript
const backend = new CryptographicBackend(config);

// Hash a phrase
const hash = backend.hash('truth and wisdom');
console.log('Hash:', hash);
// Returns a compact string representation of the hypercomplex state

// Hash is deterministic
console.log(backend.hash('truth and wisdom') === hash);  // true
```

### Hash Properties

```javascript
// Get full hash state (not just string)
const hashState = backend.hashToState('love and light');

console.log('Entropy:', hashState.entropy());
console.log('Norm:', hashState.norm());
console.log('Dimension:', hashState.dimension);

// Access components
console.log('Components:', hashState.components);
```

### Similarity-Preserving Hashes

```javascript
const backend = new CryptographicBackend(config);

// Similar meanings → similar hashes
const hash1 = backend.hashToState('truth and wisdom');
const hash2 = backend.hashToState('truth and knowledge');
const hash3 = backend.hashToState('cats and dogs');

console.log('truth+wisdom vs truth+knowledge:', hash1.coherence(hash2));
// High coherence (~0.7-0.9)

console.log('truth+wisdom vs cats+dogs:', hash1.coherence(hash3));
// Low coherence (~0.1-0.3)
```

---

## Key Derivation

### Deriving Keys from Phrases

```javascript
const backend = new CryptographicBackend(config);

// Derive a key from a passphrase
const key = backend.deriveKey('my secret passphrase');

console.log('Key type:', typeof key);  // object (SedenionState)
console.log('Key dimension:', key.dimension);
console.log('Key entropy:', key.entropy());

// Keys are deterministic
const key2 = backend.deriveKey('my secret passphrase');
console.log('Same key:', key.coherence(key2) === 1.0);  // true
```

### Key Strengthening

```javascript
// Multiple rounds increase security
function strengthenKey(phrase, rounds, backend) {
  let key = backend.deriveKey(phrase);
  
  for (let i = 0; i < rounds; i++) {
    // Use key to modify itself
    key = key.multiply(backend.deriveKey(key.toString()));
  }
  
  return key;
}

const weakKey = backend.deriveKey('password');
const strongKey = strengthenKey('password', 1000, backend);

console.log('Weak entropy:', weakKey.entropy());
console.log('Strong entropy:', strongKey.entropy());
```

### Salted Keys

```javascript
function deriveSaltedKey(phrase, salt, backend) {
  const phraseKey = backend.deriveKey(phrase);
  const saltKey = backend.deriveKey(salt);
  return phraseKey.multiply(saltKey);
}

const key1 = deriveSaltedKey('password', 'user123', backend);
const key2 = deriveSaltedKey('password', 'user456', backend);

console.log('Same password, different salt:', key1.coherence(key2));
// Low coherence - effectively different keys
```

---

## Verification

### Content Verification

```javascript
const backend = new CryptographicBackend(config);

// Create a verification hash for content
const content = 'This is the original message';
const verificationHash = backend.hash(content);

// Later, verify content hasn't changed
function verifyContent(content, expectedHash, backend) {
  const actualHash = backend.hash(content);
  return actualHash === expectedHash;
}

console.log('Verified:', verifyContent(content, verificationHash, backend));
// true

console.log('Modified:', verifyContent('This is a modified message', verificationHash, backend));
// false
```

### Signature Verification

```javascript
// Sign with private key
function sign(message, privateKey, backend) {
  const messageState = backend.hashToState(message);
  return messageState.multiply(privateKey);
}

// Verify with public key
function verify(message, signature, publicKey, backend) {
  const messageState = backend.hashToState(message);
  const expectedSig = messageState.multiply(publicKey);
  return signature.coherence(expectedSig) > 0.99;
}

const privateKey = backend.deriveKey('my private key seed');
const publicKey = privateKey.conjugate();  // Simplified example

const message = 'Transfer 100 coins to Alice';
const sig = sign(message, privateKey, backend);

console.log('Valid signature:', verify(message, sig, publicKey, backend));
console.log('Tampered:', verify('Transfer 1000 coins to Alice', sig, publicKey, backend));
```

---

## Semantic Security Features

### Meaning-Aware Access Control

```javascript
const backend = new CryptographicBackend(config);

// Create capability based on meaning
function createCapability(intent, secretKey, backend) {
  const intentState = backend.hashToState(intent);
  return intentState.multiply(secretKey);
}

// Check if capability grants access
function checkCapability(capability, requiredIntent, secretKey, backend) {
  const expected = createCapability(requiredIntent, secretKey, backend);
  return capability.coherence(expected) > 0.8;  // Allow semantic similarity
}

const secretKey = backend.deriveKey('master secret');
const readCap = createCapability('read documents', secretKey, backend);

console.log('Read access:', checkCapability(readCap, 'read documents', secretKey, backend));
// true

console.log('View access:', checkCapability(readCap, 'view documents', secretKey, backend));
// true (semantically similar)

console.log('Delete access:', checkCapability(readCap, 'delete documents', secretKey, backend));
// false (semantically different)
```

### Fuzzy Password Matching

```javascript
function createFuzzyPassword(phrase, backend) {
  return backend.hashToState(phrase);
}

function checkFuzzyPassword(attempt, stored, threshold = 0.9) {
  return attempt.coherence(stored) >= threshold;
}

const backend = new CryptographicBackend(config);
const stored = createFuzzyPassword('my secret phrase', backend);

// Exact match
const attempt1 = createFuzzyPassword('my secret phrase', backend);
console.log('Exact:', checkFuzzyPassword(attempt1, stored));  // true

// Close match (typo-tolerant if using semantic encoding)
const attempt2 = createFuzzyPassword('my secret phrases', backend);
console.log('Close:', checkFuzzyPassword(attempt2, stored, 0.8));  // might be true

// Wrong password
const attempt3 = createFuzzyPassword('wrong password', backend);
console.log('Wrong:', checkFuzzyPassword(attempt3, stored));  // false
```

---

## Practical Applications

### Semantic Document Fingerprinting

```javascript
function fingerprintDocument(text, backend) {
  // Split into chunks
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  // Hash each chunk
  const chunkHashes = sentences.map(s => backend.hashToState(s.trim()));
  
  // Combine all hashes
  let fingerprint = chunkHashes[0];
  for (let i = 1; i < chunkHashes.length; i++) {
    fingerprint = fingerprint.multiply(chunkHashes[i]);
  }
  
  return fingerprint;
}

// Detect similar documents
function documentSimilarity(doc1, doc2, backend) {
  const fp1 = fingerprintDocument(doc1, backend);
  const fp2 = fingerprintDocument(doc2, backend);
  return fp1.coherence(fp2);
}

const backend = new CryptographicBackend(config);
const doc1 = 'Truth leads to wisdom. Wisdom leads to peace.';
const doc2 = 'Truth guides us to knowledge. Knowledge brings tranquility.';
const doc3 = 'Cats are fluffy. Dogs are loyal.';

console.log('doc1 vs doc2:', documentSimilarity(doc1, doc2, backend));  // High
console.log('doc1 vs doc3:', documentSimilarity(doc1, doc3, backend));  // Low
```

### Commitment Schemes

```javascript
// Commit to a value without revealing it
function commit(value, nonce, backend) {
  const valueState = backend.hashToState(value);
  const nonceState = backend.hashToState(nonce);
  return valueState.multiply(nonceState);
}

// Reveal and verify commitment
function reveal(commitment, value, nonce, backend) {
  const expected = commit(value, nonce, backend);
  return commitment.coherence(expected) > 0.99;
}

const backend = new CryptographicBackend(config);
const secret = 'my secret vote';
const nonce = 'random_string_12345';

const commitment = commit(secret, nonce, backend);
console.log('Commitment created');

// Later...
console.log('Valid reveal:', reveal(commitment, secret, nonce, backend));  // true
console.log('Wrong value:', reveal(commitment, 'other vote', nonce, backend));  // false
```

### Secure Semantic Search

```javascript
// Create searchable encryption index
function createSecureIndex(documents, key, backend) {
  return documents.map((doc, i) => ({
    id: i,
    encryptedHash: backend.hashToState(doc).multiply(key)
  }));
}

// Search without revealing query
function secureSearch(query, index, key, backend) {
  const queryHash = backend.hashToState(query).multiply(key);
  
  return index
    .map(entry => ({
      id: entry.id,
      score: queryHash.coherence(entry.encryptedHash)
    }))
    .filter(r => r.score > 0.5)
    .sort((a, b) => b.score - a.score);
}

const backend = new CryptographicBackend(config);
const key = backend.deriveKey('index encryption key');

const docs = [
  'Love and happiness',
  'Truth and wisdom',
  'Dogs and cats'
];

const index = createSecureIndex(docs, key, backend);
const results = secureSearch('knowledge and understanding', index, key, backend);

console.log('Search results:', results);
// Documents semantically similar to query will rank higher
```

---

## Security Considerations

### Entropy Requirements

```javascript
function checkKeyStrength(key, minEntropy = 4.0) {
  const entropy = key.entropy();
  return {
    entropy,
    sufficient: entropy >= minEntropy,
    recommendation: entropy < minEntropy 
      ? 'Use longer passphrase or key strengthening'
      : 'Key entropy is adequate'
  };
}

const backend = new CryptographicBackend(config);

console.log(checkKeyStrength(backend.deriveKey('hi')));
// Low entropy warning

console.log(checkKeyStrength(backend.deriveKey('correct horse battery staple')));
// Adequate entropy
```

### Collision Resistance

```javascript
// Hypercomplex hashes have 16 dimensions
// Collision probability depends on component precision

function estimateCollisionProbability(dimension, precision) {
  const space = Math.pow(2, precision * dimension);
  return 1 / space;
}

console.log('16D with 64-bit precision:');
console.log('Collision probability:', estimateCollisionProbability(16, 64));
// Astronomically small
```

### Side-Channel Considerations

```javascript
// Use constant-time comparison for security-critical code
function constantTimeCompare(state1, state2) {
  let diff = 0;
  const c1 = state1.components;
  const c2 = state2.components;
  
  for (let i = 0; i < c1.length; i++) {
    diff |= (c1[i] !== c2[i]) ? 1 : 0;
  }
  
  return diff === 0;
}
```

---

## Next Steps

- [Scientific Applications →](./04-scientific.md)
- [Theory: Entropy and Information →](../theory/04-entropy-reasoning.md)
- [Reference: CryptographicBackend →](../reference/03-backends.md#cryptographic-backend)