/**
 * Common interface for all domain backends
 */
class Backend {
  constructor(config) {
    this.config = config;
    this.dimension = config.dimension || 16;
  }
  
  /**
   * Encode domain-specific input into prime representation
   * @param {*} input - Domain-specific input
   * @returns {number[]} Array of primes
   */
  encode(input) { 
    throw new Error('Backend.encode() must be implemented'); 
  }
  
  /**
   * Decode prime representation back to domain-specific output
   * @param {number[]} primes - Array of primes
   * @returns {*} Domain-specific output
   */
  decode(primes) { 
    throw new Error('Backend.decode() must be implemented'); 
  }
  
  /**
   * Convert primes to hypercomplex state vector
   * @param {number[]} primes - Array of primes
   * @returns {Hypercomplex} State vector
   */
  primesToState(primes) { 
    throw new Error('Backend.primesToState() must be implemented'); 
  }
  
  /**
   * Convert primes to oscillator frequencies
   * @param {number[]} primes - Array of primes
   * @returns {number[]} Array of frequencies
   */
  primesToFrequencies(primes) { 
    throw new Error('Backend.primesToFrequencies() must be implemented'); 
  }
  
  /**
   * Apply a domain-specific transform to primes
   * @param {number[]} inputPrimes - Input primes
   * @param {object} transform - Transform specification
   * @returns {number[]} Transformed primes
   */
  applyTransform(inputPrimes, transform) { 
    throw new Error('Backend.applyTransform() must be implemented'); 
  }
  
  /**
   * Get available transforms
   * @returns {object[]} Array of transform specifications
   */
  getTransforms() { 
    return this.config.transforms || []; 
  }
  
  /**
   * Get prime list used by this backend
   * @returns {number[]} Array of primes
   */
  getPrimes() { 
    return this.config.primes; 
  }
  
  /**
   * Get semantic axes (for backends that use them)
   * @returns {object} Axes mapping
   */
  getAxes() { 
    return this.config.axes; 
  }
  
  /**
   * Get backend name/type
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }
}

module.exports = { Backend };