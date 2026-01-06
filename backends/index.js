/**
 * Backends - exports all domain backends
 */

const { Backend } = require('./interface');
const { SemanticBackend } = require('./semantic');
const { CryptographicBackend } = require('./cryptographic');
const { ScientificBackend } = require('./scientific');

module.exports = {
  Backend,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend
};