/**
 * Engine - exports unified AlephEngine with createEngine factory
 */

import { AlephEngine } from './aleph.js';

// Import all backends for factory
import SemanticBackend from '../backends/semantic/index.js';
import ScientificBackend from '../backends/scientific/index.js';
import CryptographicBackend from '../backends/cryptographic/index.js';

/**
 * Factory function to create an AlephEngine with specified backend
 * @param {string} backendType - Backend type: 'semantic', 'quantum', 'scientific', 'cryptographic'
 * @param {object} [options={}] - Engine and backend options
 * @returns {AlephEngine} Configured engine instance
 */
function createEngine(backendType, options = {}) {
  let backend;
  
  const defaultConfig = {
    dimension: 16,
    primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53],
    ...options.backendConfig
  };
  
  switch (backendType.toLowerCase()) {
    case 'semantic':
      backend = new SemanticBackend(defaultConfig);
      break;
    case 'quantum':
    case 'scientific':
      backend = new ScientificBackend(defaultConfig);
      break;
    case 'cryptographic':
    case 'crypto':
      backend = new CryptographicBackend(defaultConfig);
      break;
    default:
      // Default to semantic backend
      backend = new SemanticBackend(defaultConfig);
  }
  
  return new AlephEngine(backend, options.engineConfig || options);
}

export {
    AlephEngine,
    createEngine
};

// Default export for compatibility with modular.js
export default {
    AlephEngine,
    createEngine
};