# Cryptographic Examples

This directory contains examples demonstrating TinyAleph's cryptographic capabilities.

## Examples

### 01-password-hash.js
**Password Hashing** - Securely hash passwords with salt support and timing attack resistance.

```bash
node examples/crypto/01-password-hash.js
```

### 02-key-derivation.js
**Key Derivation** - Derive strong cryptographic keys from passwords using configurable work factor.

```bash
node examples/crypto/02-key-derivation.js
```

### 03-hmac.js
**HMAC (Message Authentication)** - Create and verify message authentication codes for API signing and webhooks.

```bash
node examples/crypto/03-hmac.js
```

### 04-file-integrity.js
**File Integrity** - Verify file integrity using cryptographic hashes and manifest files.

```bash
node examples/crypto/04-file-integrity.js
```

### 05-content-hash.js
**Content-Addressable Storage** - Use content hashes as addresses for automatic deduplication.

```bash
node examples/crypto/05-content-hash.js
```

## Key Concepts

### Cryptographic Hashing
One-way functions that produce fixed-size output from any input:
- Deterministic: same input always produces same output
- One-way: cannot reverse to get original input
- Collision-resistant: hard to find two inputs with same output
- Avalanche effect: small input changes cause large output changes

### Key Derivation
Creating strong cryptographic keys from potentially weak passwords:
- Uses salt to prevent rainbow table attacks
- Configurable iterations (work factor) for security/performance tradeoff
- Produces keys of specified length for various algorithms

### HMAC
Combining a secret key with a message for authentication:
- Verifies message integrity (not tampered)
- Verifies message authenticity (from expected sender)
- Uses a shared secret key known only to trusted parties

### Content Addressing
Using the hash of content as its address:
- Identical content always has the same address
- Enables automatic deduplication
- Used in Git, IPFS, blockchains, and more

## Usage Pattern

```javascript
const { CryptographicBackend } = require('../../modular');

// Create backend
const backend = new CryptographicBackend({ dimension: 32 });

// Hash data
const hash = backend.hash('input data', 32);
console.log(hash.toString('hex'));

// Derive key
const key = backend.deriveKey('password', 'salt', 32, 10000);
console.log(key.toString('hex'));
```

## Security Considerations

1. **Salt passwords** - Always use unique salts per user/purpose
2. **Constant-time comparison** - Prevent timing attacks when verifying
3. **Increase iterations** - Higher work factor = harder to brute force
4. **Keep keys secret** - Never expose secret keys in logs or responses
5. **Use appropriate key lengths** - 256 bits (32 bytes) for modern security

## Next Steps

After understanding cryptographic operations, explore:
- `../semantic/` - Semantic text processing
- `../scientific/` - Quantum computing simulation
- `../apps/` - Full application examples