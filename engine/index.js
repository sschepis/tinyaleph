/**
 * Engine - exports unified AlephEngine with createEngine factory
 */

import { AlephEngine } from './aleph.js';

// Import all backends for factory
import { SemanticBackend } from '../backends/semantic/index.js';
import { ScientificBackend } from '../backends/scientific/index.js';
import { CryptographicBackend } from '../backends/cryptographic/index.js';
import bioinformatics from '../backends/bioinformatics/index.js';

/**
 * Factory function to create an AlephEngine with specified backend
 * @param {string} backendType - Backend type: 'semantic', 'quantum', 'scientific',
 *   'science', 'cryptographic', 'crypto', 'bioinformatics', 'bio', 'dna', 'protein'
 * @param {object} [config={}] - Flat backend config (engine options via config.engineOptions)
 * @returns {AlephEngine} Configured engine instance
 * @throws {Error} If backendType is unknown
 */
function createEngine(backendType, config = {}) {
  let backend;
  
  switch (backendType.toLowerCase()) {
    case 'semantic':
      backend = new SemanticBackend(config);
      break;
    case 'quantum':
    case 'scientific':
    case 'science':
      backend = new ScientificBackend(config);
      break;
    case 'cryptographic':
    case 'crypto':
      backend = new CryptographicBackend(config);
      break;
    case 'bioinformatics':
    case 'bio':
    case 'dna':
    case 'protein':
      backend = new bioinformatics.BioinformaticsBackend(config);
      break;
    default:
      throw new Error(`Unknown backend type: ${backendType}`);
  }
  
  return new AlephEngine(backend, config.engineOptions || {});
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