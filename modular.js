/**
 * TinyAleph Modular - Main entry point
 * 
 * A backend-agnostic prime-based computing framework supporting:
 * - Semantic Computing (NLP, concept mapping)
 * - Cryptographic Applications (hashing, key derivation)
 * - Scientific Computing (quantum simulation, particle physics)
 */

// Core mathematical foundation
const core = require('./core');
const {
  Hypercomplex,
  FANO_LINES,
  octonionMultiplyIndex,
  sedenionMultiplyIndex,
  multiplyIndices,
  buildMultiplicationTable,
  primeGenerator,
  nthPrime,
  primesUpTo,
  isPrime,
  factorize,
  primeSignature,
  firstNPrimes,
  GaussianInteger,
  EisensteinInteger,
  primeToFrequency,
  primeToAngle,
  sumOfTwoSquares,
  DEFAULT_PRIMES,
  LLM,
  // Prime Hilbert Space (HP)
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  // Prime Resonance Network
  PHI,
  PHI_CONJ,
  DELTA_S,
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  // ResoFormer ML primitives
  Quaternion,
  SparsePrimeState,
  resonanceScore,
  resonantAttention,
  hamiltonCompose,
  measureNonCommutativity,
  computeCoherence,
  haltingDecision,
  coherenceGatedCompute,
  EntropyCollapseHead,
  generateAttractorCodebook,
  PRGraphMemory,
  applyResonanceOperator
} = core;

// Physics engine
const physics = require('./physics');
const {
  Oscillator,
  OscillatorBank,
  KuramotoModel,
  shannonEntropy,
  stateEntropy,
  coherence,
  mutualInformation,
  relativeEntropy,
  jointEntropy,
  oscillatorEntropy,
  estimateLyapunov,
  classifyStability,
  adaptiveCoupling,
  localLyapunov,
  delayEmbedding,
  stabilityMargin,
  collapseProbability,
  shouldCollapse,
  measureState,
  collapseToIndex,
  bornMeasurement,
  partialCollapse,
  applyDecoherence
} = physics;

// Domain backends
const backends = require('./backends');
const {
  Backend,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend,
  BioinformaticsBackend,
  TranscriptionOperator,
  TranslationOperator,
  FoldingTransform,
  BindingAffinityCalculator,
  MolecularDocker,
  DNAStrand,
  DNACircuit,
  ANDGate,
  ORGate,
  NOTGate
} = backends;

// Unified engine
const engine = require('./engine');
const { AlephEngine } = engine;

/**
 * Factory function to create an engine with a specific backend
 */
function createEngine(backendType, config = {}) {
  let backend;
  
  switch (backendType.toLowerCase()) {
    case 'semantic':
      backend = new SemanticBackend(config);
      break;
    case 'cryptographic':
    case 'crypto':
      backend = new CryptographicBackend(config);
      break;
    case 'scientific':
    case 'science':
    case 'quantum':
      backend = new ScientificBackend(config);
      break;
    case 'bioinformatics':
    case 'bio':
    case 'dna':
    case 'protein':
      backend = new BioinformaticsBackend(config);
      break;
    default:
      throw new Error(`Unknown backend type: ${backendType}`);
  }
  
  return new AlephEngine(backend, config.engineOptions || {});
}

/**
 * Quick hash function using cryptographic backend
 */
function hash(input, length = 32) {
  const backend = new CryptographicBackend({ dimension: 32 });
  return backend.hash(input, length);
}

/**
 * Quick key derivation
 */
function deriveKey(password, salt, length = 32, iterations = 10000) {
  const backend = new CryptographicBackend({ dimension: 32 });
  return backend.deriveKey(password, salt, length, iterations);
}

module.exports = {
  // Main engine
  AlephEngine,
  createEngine,
  
  // Backends
  Backend,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend,
  BioinformaticsBackend,
  
  // Bioinformatics operators
  TranscriptionOperator,
  TranslationOperator,
  FoldingTransform,
  BindingAffinityCalculator,
  MolecularDocker,
  
  // DNA Computing
  DNAStrand,
  DNACircuit,
  ANDGate,
  ORGate,
  NOTGate,
  
  // Core math
  Hypercomplex,
  FANO_LINES,
  octonionMultiplyIndex,
  sedenionMultiplyIndex,
  multiplyIndices,
  buildMultiplicationTable,
  
  // Prime utilities
  primeGenerator,
  nthPrime,
  primesUpTo,
  isPrime,
  factorize,
  primeSignature,
  firstNPrimes,
  GaussianInteger,
  EisensteinInteger,
  primeToFrequency,
  primeToAngle,
  sumOfTwoSquares,
  DEFAULT_PRIMES,
  
  // Physics
  Oscillator,
  OscillatorBank,
  KuramotoModel,
  shannonEntropy,
  stateEntropy,
  coherence,
  mutualInformation,
  relativeEntropy,
  jointEntropy,
  oscillatorEntropy,
  estimateLyapunov,
  classifyStability,
  adaptiveCoupling,
  localLyapunov,
  delayEmbedding,
  stabilityMargin,
  collapseProbability,
  shouldCollapse,
  measureState,
  collapseToIndex,
  bornMeasurement,
  partialCollapse,
  applyDecoherence,
  
  // Convenience functions
  hash,
  deriveKey,
  
  // LLM client
  LLM,
  
  // Prime Hilbert Space (HP) - Quantum-like prime states
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  
  // Prime Resonance Network - Non-local symbolic computing
  PHI,
  PHI_CONJ,
  DELTA_S,
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  
  // ResoFormer ML Primitives (H_Q = H_P ⊗ ℍ)
  Quaternion,
  SparsePrimeState,
  resonanceScore,
  resonantAttention,
  hamiltonCompose,
  measureNonCommutativity,
  computeCoherence,
  haltingDecision,
  coherenceGatedCompute,
  EntropyCollapseHead,
  generateAttractorCodebook,
  PRGraphMemory,
  applyResonanceOperator,
  
  // Sub-modules
  core,
  physics,
  backends,
  engine
};