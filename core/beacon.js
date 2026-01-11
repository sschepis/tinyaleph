/**
 * Beacon System for Prime-Resonant Data Transfer
 * 
 * From "How Data Summoning Works" paper:
 * Instead of sending files directly, the system encodes data into 
 * resonance beacons that can be used to reconstruct the original
 * information through non-local quantum-like processes.
 * 
 * Key concepts:
 * - ResonantFragment: Prime coefficient mappings for holographic encoding
 * - Beacon: Compact pointer for file discovery and reconstruction
 * - Chinese Remainder Theorem for reconstruction
 * - Hilbert space mapping
 */

import { isPrime, primesUpTo, factorize } from './prime.js';
import { Complex, PrimeState } from './hilbert.js';

import crypto from 'crypto';

/**
 * Resonant Fragment
 * 
 * A fragment of resonant information encoded using prime coefficients.
 * 
 * interface ResonantFragment {
 *   coeffs: Map<number, number>;     // Prime coefficient mappings
 *   center: [number, number];        // Hilbert space coordinates
 *   entropy: number;                 // Information density measure
 *   index: number[];                 // Prime indices for reconstruction
 *   epoch: number;                   // Temporal versioning
 *   fingerprint: Uint8Array;         // Cryptographic hash
 *   signature: Uint8Array;           // Authentication signature
 * }
 */
class ResonantFragment {
  /**
   * Create a resonant fragment
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    // Prime coefficient mappings
    this.coeffs = options.coeffs || new Map();
    
    // Hilbert space coordinates (2D projection)
    this.center = options.center || [0, 0];
    
    // Information density (entropy)
    this.entropy = options.entropy || 0;
    
    // Prime indices for reconstruction
    this.index = options.index || [];
    
    // Version/epoch
    this.epoch = options.epoch || Date.now();
    
    // Cryptographic fingerprint
    this.fingerprint = options.fingerprint || null;
    
    // Authentication signature
    this.signature = options.signature || null;
    
    // Source metadata
    this.metadata = options.metadata || {};
  }
  
  /**
   * Encode data into a resonant fragment using prime decomposition
   * 
   * @param {Buffer|string} data - Data to encode
   * @param {Array<number>} primes - Prime basis to use
   * @returns {ResonantFragment} Encoded fragment
   */
  static fromData(data, primes = null) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const defaultPrimes = primes || primesUpTo(256).slice(0, 64);
    
    const fragment = new ResonantFragment();
    fragment.index = defaultPrimes;
    
    // Compute prime coefficients using modular arithmetic
    // c_i = Σ_j data[j] * p_i^j mod M
    const M = BigInt('1000000007'); // Large prime modulus
    
    for (const p of defaultPrimes) {
      let coeff = 0n;
      let power = 1n;
      const bp = BigInt(p);
      
      for (let j = 0; j < buffer.length; j++) {
        coeff = (coeff + BigInt(buffer[j]) * power) % M;
        power = (power * bp) % M;
      }
      
      fragment.coeffs.set(p, Number(coeff));
    }
    
    // Compute Hilbert space center from first two dominant coefficients
    const sortedCoeffs = [...fragment.coeffs.entries()]
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedCoeffs.length >= 2) {
      const maxCoeff = Math.max(...sortedCoeffs.map(c => c[1])) || 1;
      fragment.center = [
        sortedCoeffs[0][1] / maxCoeff,
        sortedCoeffs[1][1] / maxCoeff
      ];
    }
    
    // Compute entropy from coefficient distribution
    const totalCoeff = [...fragment.coeffs.values()].reduce((s, c) => s + c, 0);
    if (totalCoeff > 0) {
      let h = 0;
      for (const coeff of fragment.coeffs.values()) {
        const p = coeff / totalCoeff;
        if (p > 0) {
          h -= p * Math.log2(p);
        }
      }
      fragment.entropy = h;
    }
    
    // Compute fingerprint
    fragment.fingerprint = crypto.createHash('sha256').update(buffer).digest();
    
    return fragment;
  }
  
  /**
   * Convert fragment to PrimeState representation
   */
  toPrimeState() {
    const state = new PrimeState(this.index);
    
    const maxCoeff = Math.max(...this.coeffs.values()) || 1;
    
    for (const [p, coeff] of this.coeffs) {
      // Normalize coefficient to amplitude
      const amplitude = coeff / maxCoeff;
      // Phase from coefficient mod 2π
      const phase = (2 * Math.PI * coeff) / 1000000007;
      
      state.set(p, Complex.fromPolar(amplitude, phase));
    }
    
    return state.normalize();
  }
  
  /**
   * Compute resonance strength with another fragment
   * @param {ResonantFragment} other - Other fragment
   */
  resonanceWith(other) {
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const p of this.index) {
      const c1 = this.coeffs.get(p) || 0;
      const c2 = other.coeffs.get(p) || 0;
      dot += c1 * c2;
      norm1 += c1 * c1;
      norm2 += c2 * c2;
    }
    
    const denom = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denom > 0 ? dot / denom : 0;
  }
  
  /**
   * Serialize fragment
   */
  toJSON() {
    return {
      coeffs: Array.from(this.coeffs.entries()),
      center: this.center,
      entropy: this.entropy,
      index: this.index,
      epoch: this.epoch,
      fingerprint: this.fingerprint ? this.fingerprint.toString('hex') : null,
      signature: this.signature ? this.signature.toString('hex') : null,
      metadata: this.metadata
    };
  }
  
  /**
   * Deserialize fragment
   */
  static fromJSON(data) {
    const fragment = new ResonantFragment({
      center: data.center,
      entropy: data.entropy,
      index: data.index,
      epoch: data.epoch,
      metadata: data.metadata
    });
    
    fragment.coeffs = new Map(data.coeffs);
    
    if (data.fingerprint) {
      fragment.fingerprint = Buffer.from(data.fingerprint, 'hex');
    }
    if (data.signature) {
      fragment.signature = Buffer.from(data.signature, 'hex');
    }
    
    return fragment;
  }
}

/**
 * Beacon
 * 
 * Compact pointer that enables file discovery and reconstruction.
 * Contains minimal information needed to summon the original data.
 */
class Beacon {
  /**
   * Create a beacon
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.id = options.id || Beacon.generateId();
    this.type = options.type || 'fragment';
    this.authorId = options.authorId || null;
    
    // Core resonance data
    this.primeIndices = options.primeIndices || '';  // Encoded prime sequence
    this.epoch = options.epoch || Date.now();
    
    // Verification
    this.fingerprint = options.fingerprint || null;
    this.signature = options.signature || null;
    
    // Metadata
    this.metadata = options.metadata || {};
    this.createdAt = options.createdAt || new Date().toISOString();
  }
  
  /**
   * Generate unique beacon ID
   */
  static generateId() {
    return `bcn_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Create beacon from resonant fragment
   * @param {ResonantFragment} fragment - Source fragment
   * @param {Object} options - Additional options
   */
  static fromFragment(fragment, options = {}) {
    const beacon = new Beacon({
      type: options.type || 'fragment',
      authorId: options.authorId,
      epoch: fragment.epoch,
      fingerprint: fragment.fingerprint,
      metadata: options.metadata
    });
    
    // Encode prime indices compactly
    // Use top-k coefficients by magnitude
    const topK = options.topK || 16;
    const sortedPrimes = [...fragment.coeffs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([p]) => p);
    
    // Delta encoding for compression
    beacon.primeIndices = Beacon.encodePrimes(sortedPrimes);
    
    return beacon;
  }
  
  /**
   * Encode primes using delta + base64
   */
  static encodePrimes(primes) {
    if (primes.length === 0) return '';
    
    const deltas = [primes[0]];
    for (let i = 1; i < primes.length; i++) {
      deltas.push(primes[i] - primes[i - 1]);
    }
    
    // Pack as varints
    const buffer = Buffer.alloc(primes.length * 4);
    let offset = 0;
    
    for (const d of deltas) {
      buffer.writeInt32LE(d, offset);
      offset += 4;
    }
    
    return buffer.slice(0, offset).toString('base64');
  }
  
  /**
   * Decode primes from encoded string
   */
  static decodePrimes(encoded) {
    if (!encoded) return [];
    
    const buffer = Buffer.from(encoded, 'base64');
    const deltas = [];
    
    for (let i = 0; i < buffer.length; i += 4) {
      deltas.push(buffer.readInt32LE(i));
    }
    
    // Reconstruct from deltas
    const primes = [];
    let current = 0;
    
    for (const d of deltas) {
      current += d;
      primes.push(current);
    }
    
    return primes;
  }
  
  /**
   * Get decoded prime indices
   */
  getPrimes() {
    return Beacon.decodePrimes(this.primeIndices);
  }
  
  /**
   * Verify fingerprint matches
   * @param {Buffer} data - Original data to verify
   */
  verify(data) {
    if (!this.fingerprint) return false;
    
    const hash = crypto.createHash('sha256').update(data).digest();
    return hash.equals(this.fingerprint);
  }
  
  /**
   * Serialize beacon
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      authorId: this.authorId,
      primeIndices: this.primeIndices,
      epoch: this.epoch,
      fingerprint: this.fingerprint ? this.fingerprint.toString('hex') : null,
      signature: this.signature ? this.signature.toString('hex') : null,
      metadata: this.metadata,
      createdAt: this.createdAt
    };
  }
  
  /**
   * Deserialize beacon
   */
  static fromJSON(data) {
    const beacon = new Beacon({
      id: data.id,
      type: data.type,
      authorId: data.authorId,
      primeIndices: data.primeIndices,
      epoch: data.epoch,
      metadata: data.metadata,
      createdAt: data.createdAt
    });
    
    if (data.fingerprint) {
      beacon.fingerprint = Buffer.from(data.fingerprint, 'hex');
    }
    if (data.signature) {
      beacon.signature = Buffer.from(data.signature, 'hex');
    }
    
    return beacon;
  }
}

/**
 * Beacon Cache Manager
 * 
 * Client-side caching system for beacons.
 */
class BeaconCache {
  constructor(options = {}) {
    // L1: In-memory cache
    this.cache = new Map();
    
    // L2: User-indexed beacons
    this.userIndex = new Map();
    
    // L3: Type-indexed beacons
    this.typeIndex = new Map();
    
    // Cache limits
    this.maxSize = options.maxSize || 1000;
    
    // LRU tracking
    this.accessOrder = [];
  }
  
  /**
   * Store a beacon
   * @param {Beacon} beacon - Beacon to store
   */
  set(beacon) {
    // Update access order
    this.touch(beacon.id);
    
    // Store in main cache
    this.cache.set(beacon.id, beacon);
    
    // Index by user
    if (beacon.authorId) {
      if (!this.userIndex.has(beacon.authorId)) {
        this.userIndex.set(beacon.authorId, new Set());
      }
      this.userIndex.get(beacon.authorId).add(beacon.id);
    }
    
    // Index by type
    if (!this.typeIndex.has(beacon.type)) {
      this.typeIndex.set(beacon.type, new Set());
    }
    this.typeIndex.get(beacon.type).add(beacon.id);
    
    // Evict if over capacity
    this.evict();
  }
  
  /**
   * Get beacon by ID
   * @param {string} id - Beacon ID
   */
  get(id) {
    const beacon = this.cache.get(id);
    if (beacon) {
      this.touch(id);
    }
    return beacon;
  }
  
  /**
   * Get beacons by user
   * @param {string} userId - User ID
   */
  getByUser(userId) {
    const ids = this.userIndex.get(userId);
    if (!ids) return [];
    
    return [...ids].map(id => this.get(id)).filter(Boolean);
  }
  
  /**
   * Get beacons by type
   * @param {string} type - Beacon type
   */
  getByType(type) {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    
    return [...ids].map(id => this.get(id)).filter(Boolean);
  }
  
  /**
   * Touch ID for LRU
   */
  touch(id) {
    const idx = this.accessOrder.indexOf(id);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
    this.accessOrder.push(id);
  }
  
  /**
   * Evict oldest entries if over capacity
   */
  evict() {
    while (this.cache.size > this.maxSize && this.accessOrder.length > 0) {
      const oldId = this.accessOrder.shift();
      const beacon = this.cache.get(oldId);
      
      if (beacon) {
        // Remove from indices
        if (beacon.authorId && this.userIndex.has(beacon.authorId)) {
          this.userIndex.get(beacon.authorId).delete(oldId);
        }
        if (this.typeIndex.has(beacon.type)) {
          this.typeIndex.get(beacon.type).delete(oldId);
        }
        
        this.cache.delete(oldId);
      }
    }
  }
  
  /**
   * Clear all cached beacons
   */
  clear() {
    this.cache.clear();
    this.userIndex.clear();
    this.typeIndex.clear();
    this.accessOrder = [];
  }
  
  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      userCount: this.userIndex.size,
      typeCount: this.typeIndex.size
    };
  }
}

/**
 * Chinese Remainder Theorem Reconstructor
 * 
 * Uses CRT to reconstruct original data from prime coefficients.
 * F(x) = Σ(i=0 to n) c_i * p_i^k mod M
 * R(F) = CRT(F, P) → D
 */
class CRTReconstructor {
  /**
   * Extended Euclidean Algorithm
   * Returns [gcd, x, y] such that ax + by = gcd(a, b)
   */
  static extendedGcd(a, b) {
    if (b === 0n) {
      return [a, 1n, 0n];
    }
    
    const [g, x, y] = CRTReconstructor.extendedGcd(b, a % b);
    return [g, y, x - (a / b) * y];
  }
  
  /**
   * Modular inverse: a^(-1) mod m
   */
  static modInverse(a, m) {
    const [g, x] = CRTReconstructor.extendedGcd(a % m, m);
    
    if (g !== 1n) {
      throw new Error(`No modular inverse exists for ${a} mod ${m}`);
    }
    
    return ((x % m) + m) % m;
  }
  
  /**
   * Reconstruct using CRT
   * 
   * Given remainders r_i for moduli m_i, find x such that:
   * x ≡ r_1 (mod m_1)
   * x ≡ r_2 (mod m_2)
   * ...
   * 
   * @param {Array<[bigint, bigint]>} congruences - Array of [remainder, modulus] pairs
   * @returns {bigint} Reconstructed value
   */
  static reconstruct(congruences) {
    if (congruences.length === 0) return 0n;
    
    // Compute product of all moduli
    const M = congruences.reduce((prod, [, m]) => prod * m, 1n);
    
    let result = 0n;
    
    for (const [r, m] of congruences) {
      const Mi = M / m;
      const yi = CRTReconstructor.modInverse(Mi, m);
      result = (result + r * Mi * yi) % M;
    }
    
    return result;
  }
  
  /**
   * Reconstruct data from fragment coefficients
   * 
   * @param {ResonantFragment} fragment - Source fragment
   * @param {number} length - Expected output length
   * @returns {Buffer} Reconstructed data
   */
  static fromFragment(fragment, length = 256) {
    // Build congruence system from coefficients
    const congruences = [];
    
    for (const [p, coeff] of fragment.coeffs) {
      congruences.push([BigInt(coeff), BigInt(p)]);
    }
    
    if (congruences.length === 0) {
      return Buffer.alloc(0);
    }
    
    // Use CRT to reconstruct combined value
    const reconstructed = CRTReconstructor.reconstruct(congruences);
    
    // Convert to bytes
    const hexStr = reconstructed.toString(16).padStart(length * 2, '0');
    const buffer = Buffer.from(hexStr.slice(-length * 2), 'hex');
    
    return buffer;
  }
}

/**
 * Data Summoner
 * 
 * Orchestrates the summoning process:
 * 1. Parse beacon to get prime indices
 * 2. Query for matching fragments
 * 3. Use CRT to reconstruct data
 * 4. Verify integrity with fingerprint
 */
class DataSummoner {
  constructor(options = {}) {
    this.fragmentStore = options.fragmentStore || new Map();
    this.beaconCache = options.beaconCache || new BeaconCache();
  }
  
  /**
   * Store a fragment and create beacon
   * @param {Buffer|string} data - Data to store
   * @param {Object} options - Storage options
   */
  store(data, options = {}) {
    // Create fragment from data
    const fragment = ResonantFragment.fromData(data);
    
    // Store fragment
    const fragmentId = `frag_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.fragmentStore.set(fragmentId, fragment);
    
    // Create beacon
    const beacon = Beacon.fromFragment(fragment, {
      authorId: options.authorId,
      metadata: {
        ...options.metadata,
        fragmentId,
        originalLength: Buffer.isBuffer(data) ? data.length : Buffer.from(data).length
      }
    });
    
    // Cache beacon
    this.beaconCache.set(beacon);
    
    return { beacon, fragment, fragmentId };
  }
  
  /**
   * Summon data from beacon
   * @param {Beacon|string} beaconOrId - Beacon or beacon ID
   */
  summon(beaconOrId) {
    // Resolve beacon
    let beacon;
    if (typeof beaconOrId === 'string') {
      beacon = this.beaconCache.get(beaconOrId);
      if (!beacon) {
        throw new Error(`Beacon not found: ${beaconOrId}`);
      }
    } else {
      beacon = beaconOrId;
    }
    
    // Get fragment
    const fragmentId = beacon.metadata?.fragmentId;
    if (!fragmentId) {
      throw new Error('Beacon has no fragmentId');
    }
    
    const fragment = this.fragmentStore.get(fragmentId);
    if (!fragment) {
      throw new Error(`Fragment not found: ${fragmentId}`);
    }
    
    // Reconstruct data
    const length = beacon.metadata?.originalLength || 256;
    const data = CRTReconstructor.fromFragment(fragment, length);
    
    // Verify integrity
    if (beacon.fingerprint && !beacon.verify(data)) {
      return {
        success: false,
        error: 'Fingerprint verification failed',
        data: null
      };
    }
    
    return {
      success: true,
      data,
      fragment,
      beacon
    };
  }
  
  /**
   * Find fragments matching a query state
   * @param {PrimeState} queryState - Query state
   * @param {number} threshold - Minimum resonance
   */
  findSimilar(queryState, threshold = 0.5) {
    const results = [];
    
    for (const [id, fragment] of this.fragmentStore) {
      const fragState = fragment.toPrimeState();
      const resonance = queryState.coherence(fragState);
      
      if (resonance >= threshold) {
        results.push({ id, fragment, resonance });
      }
    }
    
    return results.sort((a, b) => b.resonance - a.resonance);
  }
}

export {
    ResonantFragment,
    Beacon,
    BeaconCache,
    CRTReconstructor,
    DataSummoner
};