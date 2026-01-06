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
  symbolicCompute
} = require('./hilbert');

// Prime Resonance Network components
const {
  PHI, PHI_CONJ, DELTA_S,
  QuaternionPrime,
  PrimeResonanceIdentity,
  PhaseLockedRing,
  HolographicField,
  EntangledNode,
  ResonantFragment
} = require('./resonance');

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