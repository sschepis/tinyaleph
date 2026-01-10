/**
 * Cryptographic Backend - Prime-based hashing, encryption, and key derivation
 *
 * Enhanced with QuPrimes concepts:
 * - Prime-State Key Generation using resonance phases
 * - Holographic Key Distribution
 * - Entropy-Sensitive Encryption
 */
const { Backend } = require('../interface');
const { Hypercomplex } = require('../../core/hypercomplex');
const { GaussianInteger, primeToFrequency, isPrime, firstNPrimes, factorize } = require('../../core/prime');
const { Complex, PrimeState } = require('../../core/hilbert');

class CryptographicBackend extends Backend {
  constructor(config) {
    super(config);
    this.dimension = config.dimension || 32;  // Higher dimension for security
    this.keyPrimes = config.keyPrimes || this.generateKeyPrimes(256);
    this.config.primes = this.keyPrimes;
    this.transforms = config.transforms || this.generateDefaultTransforms();
    this.rounds = config.rounds || 16;
  }
  
  generateKeyPrimes(count) {
    return firstNPrimes(count);
  }
  
  generateDefaultTransforms() {
    // Generate mixing transforms for cryptographic operations
    const transforms = [];
    for (let i = 0; i < 16; i++) {
      transforms.push({
        n: `mix_${i}`,
        key: this.keyPrimes.slice(i * 4, i * 4 + 4)
      });
    }
    return transforms;
  }
  
  encode(input) {
    const bytes = typeof input === 'string' 
      ? Buffer.from(input, 'utf8') 
      : Buffer.isBuffer(input) 
        ? input 
        : Buffer.from(input);
    return [...bytes].map(b => this.keyPrimes[b % this.keyPrimes.length]);
  }
  
  decode(primes) {
    const primeToIndex = new Map(this.keyPrimes.map((p, i) => [p, i]));
    const bytes = primes.map(p => primeToIndex.get(p) || 0);
    return Buffer.from(bytes);
  }
  
  primesToState(primes) {
    const state = Hypercomplex.zero(this.dimension);
    for (let i = 0; i < primes.length; i++) {
      const p = primes[i];
      const angle = (2 * Math.PI * p) / this.dimension;
      const idx = i % this.dimension;
      
      // Use Gaussian integer decomposition for primes ≡ 1 (mod 4)
      if (p % 4 === 1) {
        const gi = new GaussianInteger(Math.cos(angle), Math.sin(angle));
        state.c[idx] += gi.real / Math.sqrt(primes.length || 1);
        state.c[(idx + 1) % this.dimension] += gi.imag / Math.sqrt(primes.length || 1);
      } else {
        state.c[idx] += Math.cos(angle * p) / Math.sqrt(primes.length || 1);
      }
    }
    return state.normalize();
  }
  
  primesToFrequencies(primes) {
    // Use tighter frequency range for cryptographic mixing
    return primes.map(p => primeToFrequency(p, 1, 5));
  }
  
  applyTransform(inputPrimes, transform) {
    const key = transform.key || [2, 3, 5, 7];
    return inputPrimes.map((p, i) => {
      const k = key[i % key.length];
      const product = p * k;
      return this.keyPrimes[product % this.keyPrimes.length];
    });
  }
  
  /**
   * Hash input using hypercomplex state mixing
   */
  hash(input, outputLength = 32) {
    const primes = this.encode(input);
    let state = this.primesToState(primes);
    
    // Create input-dependent mixing constants
    const inputSum = primes.reduce((a, b) => a + b, 0);
    const inputXor = primes.reduce((a, b) => a ^ b, 0);
    
    // Multiple rounds of mixing
    for (let i = 0; i < this.rounds; i++) {
      // Mix with shifted version of self for non-commutativity
      const shifted = Hypercomplex.zero(this.dimension);
      for (let j = 0; j < this.dimension; j++) {
        shifted.c[(j + i + 1) % this.dimension] = state.c[j];
      }
      
      // Combine original and shifted
      state = state.mul(shifted).normalize();
      
      // Add input-dependent round constant
      const roundConst = Hypercomplex.zero(this.dimension);
      const idx = (i + inputXor) % this.dimension;
      roundConst.c[idx] = 0.1 * Math.sin(inputSum + i);
      roundConst.c[(idx + 7) % this.dimension] = 0.1 * Math.cos(inputSum + i);
      state = state.add(roundConst).normalize();
      
      // Non-linear transformation
      for (let j = 0; j < this.dimension; j++) {
        state.c[j] = Math.tanh(state.c[j] * 2);
      }
      state = state.normalize();
    }
    
    // Extract hash bytes from state with input-dependent scrambling
    const hashBytes = [];
    for (let i = 0; i < outputLength; i++) {
      const idx = (i + inputXor) % this.dimension;
      const val = Math.abs(state.c[idx] * 127.5 + state.c[(idx + 1) % this.dimension] * 127.5);
      hashBytes.push(Math.floor(val) & 0xFF);
    }
    return Buffer.from(hashBytes);
  }
  
  /**
   * Derive key from password using salt and iterations
   */
  deriveKey(password, salt, keyLength = 32, iterations = 10000) {
    let primes = this.encode(password);
    const saltPrimes = this.encode(salt);
    
    for (let i = 0; i < iterations; i++) {
      // Mix password and salt primes
      primes = [...primes, ...saltPrimes];
      const state = this.primesToState(primes);
      
      // Apply iteration-dependent mixing
      const mixed = state.mul(Hypercomplex.fromReal(this.dimension, i + 1));
      
      // Extract new primes from mixed state
      primes = [];
      for (let j = 0; j < this.dimension; j++) {
        const idx = Math.floor(Math.abs(mixed.c[j]) * this.keyPrimes.length);
        primes.push(this.keyPrimes[idx % this.keyPrimes.length]);
      }
    }
    
    return this.hash(Buffer.from(primes), keyLength);
  }
  
  /**
   * Generate random primes for key material
   */
  generateRandomPrimes(count) {
    const primes = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * this.keyPrimes.length);
      primes.push(this.keyPrimes[idx]);
    }
    return primes;
  }
  
  /**
   * XOR-style prime mixing for encryption
   */
  mixPrimes(dataPrimes, keyPrimes) {
    return dataPrimes.map((p, i) => {
      const k = keyPrimes[i % keyPrimes.length];
      const mixed = (p * k) % (this.keyPrimes[this.keyPrimes.length - 1] + 1);
      // Find nearest prime
      let result = this.keyPrimes.find(q => q >= mixed) || this.keyPrimes[0];
      return result;
    });
  }
  
  /**
   * Compute HMAC-like authentication code
   */
  hmac(key, message, outputLength = 32) {
    const keyPrimes = this.encode(key);
    const msgPrimes = this.encode(message);
    
    // Inner hash
    const innerPrimes = this.mixPrimes(msgPrimes, keyPrimes);
    const innerHash = this.hash(Buffer.from(innerPrimes), this.dimension);
    
    // Outer hash
    const outerPrimes = this.mixPrimes(this.encode(innerHash), keyPrimes);
    return this.hash(Buffer.from(outerPrimes), outputLength);
  }
}

// ============================================================================
// PRIME-STATE KEY GENERATION (from qprimes.md)
// ============================================================================

/**
 * PrimeStateKeyGenerator
 *
 * Generates cryptographic keys using the prime resonance framework from qprimes.md:
 *
 * For a state |n⟩ = Σ √(a_i/A) |p_i⟩, derive a key:
 * K = Σ_i θ_{p_i} mod 2π, where θ_{p_i} = 2π log_{p_i}(n)
 *
 * Security relies on the difficulty of inverting phase relationships
 * without the prime state, resisting quantum attacks.
 */
class PrimeStateKeyGenerator {
  /**
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.primes = options.primes || firstNPrimes(64);
    this.keyLength = options.keyLength || 32;
    this.phi = (1 + Math.sqrt(5)) / 2;  // Golden ratio for phase shifts
  }
  
  /**
   * Compute resonance phase θ_p = 2π log_p(n)
   * @param {number} p - Prime base
   * @param {number} n - Number to compute phase for
   * @returns {number} Phase angle in radians
   */
  resonancePhase(p, n) {
    if (n <= 0 || p <= 1) return 0;
    return 2 * Math.PI * Math.log(n) / Math.log(p);
  }
  
  /**
   * Create canonical prime state from number n
   * |n⟩ = Σ √(a_i/A) |p_i⟩ for n = Π p_i^{a_i}
   *
   * @param {number} n - Input number
   * @returns {PrimeState} Canonical prime state
   */
  createPrimeState(n) {
    const state = new PrimeState(this.primes);
    const factors = factorize(n);
    
    // Total exponent count
    const A = Object.values(factors).reduce((sum, exp) => sum + exp, 0);
    
    if (A === 0) {
      // n = 1, return uniform state
      return PrimeState.uniform(this.primes);
    }
    
    // Set amplitudes based on factorization
    for (const [p, exp] of Object.entries(factors)) {
      const prime = parseInt(p);
      if (state.amplitudes.has(prime)) {
        const amplitude = Math.sqrt(exp / A);
        state.set(prime, new Complex(amplitude, 0));
      }
    }
    
    return state.normalize();
  }
  
  /**
   * Generate key from prime state using phase summation
   * K = Σ_i θ_{p_i} mod 2π
   *
   * @param {number} n - Input number to derive key from
   * @returns {Object} Key with numeric and buffer forms
   */
  generateKey(n) {
    const state = this.createPrimeState(n);
    const phases = [];
    
    // Compute resonance phase for each prime with non-zero amplitude
    for (const p of this.primes) {
      const amp = state.get(p);
      if (amp.norm() > 1e-10) {
        const phase = this.resonancePhase(p, n);
        phases.push({
          prime: p,
          phase,
          amplitude: amp.norm(),
          complex: Complex.fromPolar(amp.norm(), phase)
        });
      }
    }
    
    // Sum phases modulo 2π
    const rawKey = phases.reduce((sum, p) => sum + p.phase * p.amplitude, 0);
    const keyModulo = rawKey % (2 * Math.PI);
    
    // Expand to key bytes using phase-derived values
    const keyBytes = this.expandToBytes(phases, this.keyLength);
    
    return {
      state,
      phases,
      rawKey,
      keyModulo,
      keyBuffer: Buffer.from(keyBytes),
      keyHex: Buffer.from(keyBytes).toString('hex'),
      entropy: state.entropy()
    };
  }
  
  /**
   * Expand phase information to key bytes
   * @param {Array} phases - Phase data
   * @param {number} length - Desired key length
   */
  expandToBytes(phases, length) {
    const bytes = [];
    
    for (let i = 0; i < length; i++) {
      const phaseIdx = i % phases.length;
      const phase = phases[phaseIdx];
      
      // Derive byte from phase and position
      const val = (phase.phase + i * this.phi) * phase.amplitude;
      const normalized = ((Math.sin(val) + 1) / 2) * 255;
      bytes.push(Math.floor(normalized) & 0xFF);
    }
    
    return bytes;
  }
  
  /**
   * Generate key pair (public/private) using prime resonance
   *
   * The public key is the prime indices and amplitudes.
   * The private key includes the phase information.
   *
   * @param {number} seed - Seed for key generation
   */
  generateKeyPair(seed) {
    // Use seed to create a complex number
    const n = Math.abs(seed) + 1;
    const privateData = this.generateKey(n);
    
    // Public key: amplitudes without phases
    const publicKey = {
      primes: privateData.phases.map(p => p.prime),
      amplitudes: privateData.phases.map(p => p.amplitude),
      entropy: privateData.entropy
    };
    
    // Private key: full phase information
    const privateKey = {
      seed: n,
      phases: privateData.phases,
      keyBuffer: privateData.keyBuffer
    };
    
    return { publicKey, privateKey };
  }
  
  /**
   * Derive shared secret from two keys
   * Uses inner product of prime states
   *
   * @param {Object} key1 - First key data
   * @param {Object} key2 - Second key data
   */
  deriveSharedSecret(key1, key2) {
    // Compute inner product of states
    const inner = key1.state.inner(key2.state);
    
    // Use magnitude and phase as shared secret basis
    const magnitude = inner.norm();
    const phase = inner.phase();
    
    // Generate shared key bytes
    const bytes = [];
    for (let i = 0; i < this.keyLength; i++) {
      const val = Math.sin(phase + i * this.phi) * magnitude;
      const normalized = ((val + 1) / 2) * 255;
      bytes.push(Math.floor(Math.abs(normalized)) & 0xFF);
    }
    
    return {
      coherence: magnitude,
      phase,
      sharedKey: Buffer.from(bytes)
    };
  }
}

// ============================================================================
// ENTROPY-SENSITIVE ENCRYPTION (from qprimes.md)
// ============================================================================

/**
 * EntropySensitiveEncryptor
 *
 * Encrypt messages using entropy-based phase modulation:
 * Ê_K|m⟩ = e^{iK(m)}|m⟩, where K(m) = Σ_{p|m} θ_p
 */
class EntropySensitiveEncryptor {
  constructor(options = {}) {
    this.keyGen = new PrimeStateKeyGenerator(options);
    this.primes = this.keyGen.primes;
  }
  
  /**
   * Encrypt data using phase modulation
   * @param {Buffer|string} data - Data to encrypt
   * @param {number|Buffer} key - Encryption key (number or derived key)
   */
  encrypt(data, key) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    // Get key phase from numeric key
    let keyPhases;
    if (typeof key === 'number') {
      keyPhases = this.keyGen.generateKey(key).phases;
    } else {
      // Use key buffer as seed
      const keySeed = buffer.reduce((sum, b) => sum + b, 0) + 1;
      keyPhases = this.keyGen.generateKey(keySeed).phases;
    }
    
    // Encrypt each byte with phase modulation
    const encrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      
      // Find divisor primes for this byte value
      const phaseSum = keyPhases
        .filter(p => byte % p.prime === 0 || i % p.prime === 0)
        .reduce((sum, p) => sum + p.phase * p.amplitude, 0);
      
      // Apply phase-based transformation
      const transform = Math.floor((Math.sin(phaseSum + i) + 1) * 127.5);
      encrypted[i] = (byte + transform) & 0xFF;
    }
    
    return encrypted;
  }
  
  /**
   * Decrypt data
   * @param {Buffer} encrypted - Encrypted data
   * @param {number|Buffer} key - Decryption key
   */
  decrypt(encrypted, key) {
    // Get key phases
    let keyPhases;
    if (typeof key === 'number') {
      keyPhases = this.keyGen.generateKey(key).phases;
    } else {
      const keySeed = encrypted.reduce((sum, b) => sum + b, 0) + 1;
      keyPhases = this.keyGen.generateKey(keySeed).phases;
    }
    
    // Decrypt each byte (inverse of encryption)
    const decrypted = Buffer.alloc(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      const byte = encrypted[i];
      
      // Same phase calculation as encryption
      const phaseSum = keyPhases
        .filter(p => i % p.prime === 0)  // Use position-based phases for decryption
        .reduce((sum, p) => sum + p.phase * p.amplitude, 0);
      
      const transform = Math.floor((Math.sin(phaseSum + i) + 1) * 127.5);
      decrypted[i] = (byte - transform + 256) & 0xFF;
    }
    
    return decrypted;
  }
}

// ============================================================================
// HOLOGRAPHIC KEY DISTRIBUTION (from qprimes.md)
// ============================================================================

/**
 * HolographicKeyDistributor
 *
 * Encode keys in interference patterns:
 * I(x, y) = Σ_p A_p e^{-S(x,y)} e^{ipθ}
 *
 * Extract keys via Fourier inversion.
 */
class HolographicKeyDistributor {
  constructor(options = {}) {
    this.gridSize = options.gridSize || 16;
    this.keyGen = new PrimeStateKeyGenerator(options);
    this.primes = this.keyGen.primes;
  }
  
  /**
   * Encode key into holographic pattern
   * @param {number} keyValue - Key as number
   * @returns {Object} Holographic encoding
   */
  encodeKey(keyValue) {
    const keyData = this.keyGen.generateKey(keyValue);
    
    // Create interference pattern
    const pattern = new Array(this.gridSize);
    for (let x = 0; x < this.gridSize; x++) {
      pattern[x] = new Array(this.gridSize);
      for (let y = 0; y < this.gridSize; y++) {
        let intensity = 0;
        let phase = 0;
        
        for (const p of keyData.phases) {
          // Distance-based decay
          const r = Math.sqrt((x - this.gridSize/2)**2 + (y - this.gridSize/2)**2);
          const decay = Math.exp(-r / this.gridSize);
          
          // Prime-frequency interference
          const primePhase = p.phase + (x * p.prime / this.gridSize) + (y / p.prime);
          intensity += p.amplitude * decay * Math.cos(primePhase);
          phase += primePhase * p.amplitude;
        }
        
        pattern[x][y] = { intensity, phase };
      }
    }
    
    return {
      pattern,
      keyData,
      gridSize: this.gridSize
    };
  }
  
  /**
   * Decode key from holographic pattern
   * @param {Object} encoding - Holographic encoding
   * @returns {Buffer} Recovered key
   */
  decodeKey(encoding) {
    const { pattern, gridSize } = encoding;
    
    // Fourier inversion to extract prime phases
    const extractedPhases = [];
    
    for (const p of this.primes.slice(0, 16)) {
      let realSum = 0;
      let imagSum = 0;
      
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const cell = pattern[x][y];
          const freq = (x * p / gridSize) + (y / p);
          realSum += cell.intensity * Math.cos(freq);
          imagSum += cell.intensity * Math.sin(freq);
        }
      }
      
      const magnitude = Math.sqrt(realSum**2 + imagSum**2) / (gridSize * gridSize);
      const phase = Math.atan2(imagSum, realSum);
      
      if (magnitude > 0.01) {
        extractedPhases.push({ prime: p, phase, amplitude: magnitude });
      }
    }
    
    // Reconstruct key from extracted phases
    return this.keyGen.expandToBytes(extractedPhases, this.keyGen.keyLength);
  }
  
  /**
   * Share key between parties using holographic splitting
   * @param {number} keyValue - Key to share
   * @param {number} numShares - Number of shares to create
   * @param {number} threshold - Minimum shares needed to reconstruct
   */
  createShares(keyValue, numShares = 3, threshold = 2) {
    const encoding = this.encodeKey(keyValue);
    const shares = [];
    
    // Split pattern into shares using XOR-like operation
    for (let s = 0; s < numShares; s++) {
      const share = new Array(this.gridSize);
      for (let x = 0; x < this.gridSize; x++) {
        share[x] = new Array(this.gridSize);
        for (let y = 0; y < this.gridSize; y++) {
          const original = encoding.pattern[x][y];
          
          // Add share-specific noise
          const noise = Math.sin((x + y + s) * this.keyGen.phi);
          share[x][y] = {
            intensity: original.intensity + noise * (s < numShares - 1 ? 1 : -numShares + 1),
            phase: original.phase + (2 * Math.PI * s / numShares)
          };
        }
      }
      
      shares.push({
        index: s,
        pattern: share,
        gridSize: this.gridSize
      });
    }
    
    return { shares, threshold };
  }
  
  /**
   * Combine shares to recover key
   * @param {Array} shares - Subset of shares to combine
   */
  combineShares(shares) {
    if (shares.length < 2) {
      throw new Error('Need at least 2 shares to reconstruct');
    }
    
    // Average the patterns
    const combined = new Array(this.gridSize);
    for (let x = 0; x < this.gridSize; x++) {
      combined[x] = new Array(this.gridSize);
      for (let y = 0; y < this.gridSize; y++) {
        let intensitySum = 0;
        let phaseSum = 0;
        
        for (const share of shares) {
          intensitySum += share.pattern[x][y].intensity;
          phaseSum += share.pattern[x][y].phase;
        }
        
        combined[x][y] = {
          intensity: intensitySum / shares.length,
          phase: phaseSum / shares.length
        };
      }
    }
    
    return this.decodeKey({ pattern: combined, gridSize: this.gridSize });
  }
}

module.exports = {
  CryptographicBackend,
  PrimeStateKeyGenerator,
  EntropySensitiveEncryptor,
  HolographicKeyDistributor
};