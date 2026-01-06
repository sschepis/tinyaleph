/**
 * Cryptographic Backend - Prime-based hashing, encryption, and key derivation
 */
const { Backend } = require('../interface');
const { Hypercomplex } = require('../../core/hypercomplex');
const { GaussianInteger, primeToFrequency, isPrime, firstNPrimes } = require('../../core/prime');

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

module.exports = { CryptographicBackend };