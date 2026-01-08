/**
 * Core mathematical foundation - exports all core modules
 */

const { Hypercomplex } = require('./hypercomplex');

// Formal Type System (mtspbc.pdf implementation)
const {
  NounType, AdjType, SentenceType,
  NounTerm, AdjTerm, ChainTerm, FusionTerm,
  NounSentence, SeqSentence, ImplSentence,
  TypingContext, TypingJudgment, TypeChecker,
  N, A, FUSE, CHAIN, SENTENCE, SEQ, IMPL
} = require('./types');

// Reduction Semantics (ncpsc.pdf implementation)
const {
  PrimeOperator, NextPrimeOperator, ModularPrimeOperator,
  ResonancePrimeOperator, IdentityPrimeOperator, DEFAULT_OPERATOR,
  ReductionStep, ReductionTrace, ReductionSystem,
  isNormalForm, isReducible, termSize,
  FusionCanonicalizer, NormalFormVerifier,
  demonstrateStrongNormalization, testLocalConfluence
} = require('./reduction');

// Lambda Calculus Translation (Section 4 from mtspbc.pdf)
const {
  LambdaExpr, VarExpr, ConstExpr, LamExpr, AppExpr,
  PairExpr, ImplExpr, PrimOpExpr,
  Translator, TypeDirectedTranslator,
  LambdaEvaluator, Semantics, ConceptInterpreter
} = require('./lambda');
const {
  FANO_LINES,
  octonionMultiplyIndex,
  sedenionMultiplyIndex,
  multiplyIndices,
  buildMultiplicationTable
} = require('./fano');
const {
  primeGenerator, nthPrime, primesUpTo, isPrime,
  factorize, primeSignature, firstNPrimes,
  GaussianInteger, EisensteinInteger,
  primeToFrequency, primeToAngle, sumOfTwoSquares,
  DEFAULT_PRIMES
} = require('./prime');
const LLM = require('./llm');

// Prime Hilbert Space (complex amplitudes, quantum-like)
const {
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  DELTA_S
} = require('./hilbert');

// Golden Ratio Resonance (from symprime symbolic AI)
const {
  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  PHI,
  PHI_THRESHOLD,
  PHI_BONUS,
  calculateResonance,
  findGoldenPairs,
  findMostResonant
} = require('./resonance');

// Symbol Database (200+ emoji symbols from symprime)
const {
  SymbolDatabase,
  SymbolCategory,
  PrimeGenerator,
  symbolDatabase,
  getSymbol,
  getSymbolByPrime,
  search: searchSymbols,
  encode: encodeSymbols,
  decode: decodeSymbols
} = require('./symbols');

// Semantic Inference Engine (from symprime)
const {
  SemanticInference,
  EntityExtractor,
  InferenceMethod,
  semanticInference,
  entityExtractor,
  inferSymbol,
  inferSymbols,
  extractEntities,
  extractAndInfer,
  inferWithResonance,
  inferMostResonant
} = require('./inference');

// Compound Builder (multi-symbol concepts from symprime)
const {
  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  compoundBuilder,
  createCompound,
  getCompound,
  createSequence,
  getSequence,
  findCompoundsContaining
} = require('./compound');

// ResoFormer ML primitives
const {
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
} = require('./rformer');

// ResoFormer complete layers
const {
  ResonantMultiHeadAttention,
  PrimeFFN,
  PrimeLayerNorm,
  PositionalPrimeEncoding,
  ResoFormerBlock,
  ResoFormer
} = require('./rformer-layers');

// Prime Entanglement Graph
const {
  EntanglementEdge,
  PrimeEntanglementGraph,
  createEntanglementGraph
} = require('./entanglement');

// Event system and streaming
const {
  AlephEventEmitter,
  AlephMonitor,
  EvolutionStream,
  createEvolutionStream,
  createMonitor
} = require('./events');

// TensorFlow.js layers (lazy load - may not be available)
let rformerTF = null;
try {
  rformerTF = require('./rformer-tf');
} catch (e) {
  // TensorFlow.js not available, skip
}

module.exports = {
  // Hypercomplex algebra
  Hypercomplex,
  
  // Fano plane / multiplication
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
  
  // LLM client
  LLM,
  
  // Prime Hilbert Space (HP)
  Complex,
  PrimeState,
  ResonanceOperators,
  EntropyDrivenEvolution,
  encodeMemory,
  symbolicCompute,
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment,
  
  // Constants
  DELTA_S,
  
  // Golden Ratio Resonance (symprime symbolic AI)
  PHI,
  PHI_THRESHOLD,
  PHI_BONUS,
  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  calculateResonance,
  findGoldenPairs,
  findMostResonant,
  
  // Symbol Database (symprime symbolic AI)
  SymbolDatabase,
  SymbolCategory,
  PrimeGenerator,
  symbolDatabase,
  getSymbol,
  getSymbolByPrime,
  searchSymbols,
  encodeSymbols,
  decodeSymbols,
  
  // Semantic Inference (symprime symbolic AI)
  SemanticInference,
  EntityExtractor,
  InferenceMethod,
  semanticInference,
  entityExtractor,
  inferSymbol,
  inferSymbols,
  extractEntities,
  extractAndInfer,
  inferWithResonance,
  inferMostResonant,
  
  // Compound Builder (symprime symbolic AI)
  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  compoundBuilder,
  createCompound,
  getCompound,
  createSequence,
  getSequence,
  findCompoundsContaining,
  
  // ResoFormer ML Primitives
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
  
  // ResoFormer Complete Layers
  ResonantMultiHeadAttention,
  PrimeFFN,
  PrimeLayerNorm,
  PositionalPrimeEncoding,
  ResoFormerBlock,
  ResoFormer,
  
  // Prime Entanglement Graph
  EntanglementEdge,
  PrimeEntanglementGraph,
  createEntanglementGraph,
  
  // Event System and Streaming
  AlephEventEmitter,
  AlephMonitor,
  EvolutionStream,
  createEvolutionStream,
  createMonitor,
  
  // TensorFlow.js ResoFormer layers (if available)
  ...(rformerTF || {}),
  
  // Formal Type System (mtspbc.pdf)
  NounType,
  AdjType,
  SentenceType,
  NounTerm,
  AdjTerm,
  ChainTerm,
  FusionTerm,
  NounSentence,
  SeqSentence,
  ImplSentence,
  TypingContext,
  TypingJudgment,
  TypeChecker,
  N,
  A,
  FUSE,
  CHAIN,
  SENTENCE,
  SEQ,
  IMPL,
  
  // Reduction Semantics (ncpsc.pdf)
  PrimeOperator,
  NextPrimeOperator,
  ModularPrimeOperator,
  ResonancePrimeOperator,
  IdentityPrimeOperator,
  DEFAULT_OPERATOR,
  ReductionStep,
  ReductionTrace,
  ReductionSystem,
  isNormalForm,
  isReducible,
  termSize,
  FusionCanonicalizer,
  NormalFormVerifier,
  demonstrateStrongNormalization,
  testLocalConfluence,
  
  // Lambda Calculus Translation
  LambdaExpr,
  VarExpr,
  ConstExpr,
  LamExpr,
  AppExpr,
  PairExpr,
  ImplExpr,
  PrimOpExpr,
  Translator,
  TypeDirectedTranslator,
  LambdaEvaluator,
  Semantics,
  ConceptInterpreter
};