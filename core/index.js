/**
 * Core mathematical foundation - exports all core modules
 */

// CRT-Homology Module (Chinese Remainder Theorem + Birkhoff Attention + Homology Loss)
import { Hypercomplex } from './hypercomplex.js';

import {  extendedGCD,
  modInverse,
  areCoprime,
  softmax,
  ResidueEncoder,
  CRTReconstructor,
  BirkhoffProjector,
  HomologyLoss,
  CRTModularLayer,
  CRTFusedAttention,
  CoprimeSelector,
  createCRTLayer,
  createFusedAttention,
  DEFAULT_PRIMES_SMALL,
  DEFAULT_PRIMES_MEDIUM,
  DEFAULT_PRIMES_SEMANTIC  } from './crt-homology.js';

// Formal Type System (mtspbc.pdf implementation)
import {  NounType, AdjType, SentenceType,
  NounTerm, AdjTerm, ChainTerm, FusionTerm,
  NounSentence, SeqSentence, ImplSentence,
  TypingContext, TypingJudgment, TypeChecker,
  N, A, FUSE, CHAIN, SENTENCE, SEQ, IMPL  } from './types.js';

// Reduction Semantics (ncpsc.pdf implementation)
import {  PrimeOperator, NextPrimeOperator, ModularPrimeOperator,
  ResonancePrimeOperator, IdentityPrimeOperator, DEFAULT_OPERATOR,
  ReductionStep, ReductionTrace, ReductionSystem,
  isNormalForm, isReducible, termSize,
  FusionCanonicalizer, NormalFormVerifier,
  demonstrateStrongNormalization, testLocalConfluence  } from './reduction.js';

// Lambda Calculus Translation (Section 4 from mtspbc.pdf)
import {  LambdaExpr, VarExpr, ConstExpr, LamExpr, AppExpr,
  PairExpr, ImplExpr, PrimOpExpr,
  Translator, TypeDirectedTranslator,
  LambdaEvaluator, Semantics, ConceptInterpreter  } from './lambda.js';

// Enochian Packet Layer (Section 7.4)
import enochian from './enochian.js';
import enochianVocabulary from './enochian-vocabulary.js';

// Arithmetic Link Kernel (ArithmeticLinkKernels.pdf)
import {
  LegendreSymbol,
  PowerResidueSymbol,
  RedeiSymbol,
  ArithmeticMilnorInvariant,
  MultipleResidueSymbol,
  ArithmeticLinkKernel,
  ALKOperators,
  findBorromeanPrimes,
  computeLegendreMatrix,
  quickBorromeanCheck
} from './arithmetic-link-kernel.js';

// Alexander Modules (CompleteAlexanderModules.pdf)
import {
  LaurentPolynomial,
  FittingIdeal,
  CrowellSequence,
  AlexanderModule,
  ModuleSignature,
  SignatureMemory,
  SignatureExtractor,
  createAlexanderModule,
  extractSignature,
  createSignatureMemory,
  createSignatureExtractor
} from './alexander-module.js';

import {  FANO_LINES,
  octonionMultiplyIndex,
  sedenionMultiplyIndex,
  multiplyIndices,
  buildMultiplicationTable  } from './fano.js';
import {  primeGenerator, nthPrime, primesUpTo, isPrime,
  factorize, primeSignature, firstNPrimes,
  GaussianInteger, EisensteinInteger,
  primeToFrequency, primeToAngle, sumOfTwoSquares,
  DEFAULT_PRIMES  } from './prime.js';
import LLM from './llm.js';

// Prime Hilbert Space (complex amplitudes, quantum-like)
import {  Complex,
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
  DELTA_S  } from './hilbert.js';

// Golden Ratio Resonance (from symprime symbolic AI)
import {  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  PHI,
  PHI_THRESHOLD,
  PHI_BONUS,
  calculateResonance,
  findGoldenPairs,
  findMostResonant  } from './resonance.js';

// Symbol Database (200+ emoji symbols from symprime)
import {  SymbolDatabase,
  SymbolCategory,
  PrimeGenerator,
  symbolDatabase,
  getSymbol,
  getSymbolByPrime,
  search as searchSymbols,
  encode as encodeSymbols,
  decode as decodeSymbols  } from './symbols/index.js';

// Semantic Inference Engine (from symprime)
import {  SemanticInference,
  EntityExtractor,
  InferenceMethod,
  semanticInference,
  entityExtractor,
  inferSymbol,
  inferSymbols,
  extractEntities,
  extractAndInfer,
  inferWithResonance,
  inferMostResonant  } from './inference.js';

// Compound Builder (multi-symbol concepts from symprime)
import {  CompoundBuilder,
  CompoundSymbol,
  SymbolSequence,
  compoundBuilder,
  createCompound,
  getCompound,
  createSequence,
  getSequence,
  findCompoundsContaining  } from './compound.js';

// ResoFormer ML primitives
import {  Quaternion,
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
  applyResonanceOperator  } from './rformer.js';

// ResoFormer complete layers
import {  ResonantMultiHeadAttention,
  PrimeFFN,
  PrimeLayerNorm,
  PositionalPrimeEncoding,
  ResoFormerBlock,
  ResoFormer  } from './rformer-layers.js';

// CRT-enhanced ResoFormer layers
import {  CRTResonantAttention,
  HomologyRegularizedBlock,
  CRTResoFormer,
  createCRTResoFormer  } from './rformer-crt.js';

// Prime Entanglement Graph
import {  EntanglementEdge,
  PrimeEntanglementGraph,
  createEntanglementGraph  } from './entanglement.js';

// Event system and streaming
import {  AlephEventEmitter,
  AlephMonitor,
  EvolutionStream,
  createEvolutionStream,
  createMonitor  } from './events.js';

// TensorFlow.js layers (lazy load - may not be available)
let rformerTF = null;
// Dynamic import for optional TensorFlow.js support
// Use: const tf = await import('./rformer-tf.js') when needed

// Named exports for ESM compatibility
export {
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
  
  // Prime Hilbert Space
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
  DELTA_S,
  
  // Golden Ratio Resonance
  PHI,
  PHI_THRESHOLD,
  PHI_BONUS,
  ResonanceCalculator,
  resonanceSignature,
  findFibonacciSequences,
  calculateResonance,
  findGoldenPairs,
  findMostResonant,
  
  // Symbol Database
  SymbolDatabase,
  SymbolCategory,
  PrimeGenerator,
  symbolDatabase,
  getSymbol,
  getSymbolByPrime,
  searchSymbols,
  encodeSymbols,
  decodeSymbols,
  
  // Semantic Inference
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
  
  // Compound Builder
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
  
  // CRT-enhanced ResoFormer
  CRTResonantAttention,
  HomologyRegularizedBlock,
  CRTResoFormer,
  createCRTResoFormer,
  
  // Prime Entanglement Graph
  EntanglementEdge,
  PrimeEntanglementGraph,
  createEntanglementGraph,
  
  // Event System
  AlephEventEmitter,
  AlephMonitor,
  EvolutionStream,
  createEvolutionStream,
  createMonitor,
  
  // Formal Type System
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
  
  // Reduction Semantics
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
  
  // Lambda Calculus
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
  ConceptInterpreter,
  
  // Enochian
  enochian,
  enochianVocabulary,
  
  // CRT-Homology
  extendedGCD,
  modInverse,
  areCoprime,
  softmax,
  ResidueEncoder,
  CRTReconstructor,
  BirkhoffProjector,
  HomologyLoss,
  CRTModularLayer,
  CRTFusedAttention,
  CoprimeSelector,
  createCRTLayer,
  createFusedAttention,
  DEFAULT_PRIMES_SMALL,
  DEFAULT_PRIMES_MEDIUM,
  DEFAULT_PRIMES_SEMANTIC,
  
  // Arithmetic Link Kernel (ArithmeticLinkKernels.pdf)
  LegendreSymbol,
  PowerResidueSymbol,
  RedeiSymbol,
  ArithmeticMilnorInvariant,
  MultipleResidueSymbol,
  ArithmeticLinkKernel,
  ALKOperators,
  findBorromeanPrimes,
  computeLegendreMatrix,
  quickBorromeanCheck,
  
  // Alexander Modules (CompleteAlexanderModules.pdf)
  LaurentPolynomial,
  FittingIdeal,
  CrowellSequence,
  AlexanderModule,
  ModuleSignature,
  SignatureMemory,
  SignatureExtractor,
  createAlexanderModule,
  extractSignature,
  createSignatureMemory,
  createSignatureExtractor
};

export default {
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
  ConceptInterpreter,
  
  // Enochian Packet Layer (Section 7.4 - twist-based validation)
  enochian,
  enochianVocabulary,
  ENOCHIAN_PRIMES: enochian.ENOCHIAN_PRIMES,
  ENOCHIAN_MODES: enochian.MODES,
  twistAngle: enochian.twistAngle,
  totalTwist: enochian.totalTwist,
  isTwistClosed: enochian.isTwistClosed,
  findClosedSequences: enochian.findClosedSequences,
  EnochianSymbol: enochian.EnochianSymbol,
  EnochianPacket: enochian.EnochianPacket,
  EnochianEncoder: enochian.EnochianEncoder,
  EnochianDecoder: enochian.EnochianDecoder,
  EnochianPacketBuilder: enochian.EnochianPacketBuilder,
  EnhancedEnochianEncoder: enochian.EnhancedEnochianEncoder,
  EnhancedEnochianDecoder: enochian.EnhancedEnochianDecoder,
  // Enochian Vocabulary
  ENOCHIAN_ALPHABET: enochianVocabulary.ENOCHIAN_ALPHABET,
  PRIME_BASIS: enochianVocabulary.PRIME_BASIS,
  CORE_VOCABULARY: enochianVocabulary.CORE_VOCABULARY,
  THE_NINETEEN_CALLS: enochianVocabulary.THE_NINETEEN_CALLS,
  EnochianWord: enochianVocabulary.EnochianWord,
  EnochianCall: enochianVocabulary.EnochianCall,
  EnochianEngine: enochianVocabulary.EnochianEngine,
  SedenionElement: enochianVocabulary.SedenionElement,
  TwistOperator: enochianVocabulary.TwistOperator,
  validateTwistClosure: enochianVocabulary.validateTwistClosure,
  
  // CRT-Homology Module (Coprime Modular Algebra + Birkhoff Polytope + Homology Loss)
  extendedGCD,
  modInverse,
  areCoprime,
  softmax,
  ResidueEncoder,
  CRTReconstructor,
  BirkhoffProjector,
  HomologyLoss,
  CRTModularLayer,
  CRTFusedAttention,
  CoprimeSelector,
  createCRTLayer,
  createFusedAttention,
  DEFAULT_PRIMES_SMALL,
  DEFAULT_PRIMES_MEDIUM,
  DEFAULT_PRIMES_SEMANTIC,
  
  // CRT-enhanced ResoFormer (Birkhoff attention + Homology regularization)
  CRTResonantAttention,
  HomologyRegularizedBlock,
  CRTResoFormer,
  createCRTResoFormer,
  
  // Arithmetic Link Kernel (ArithmeticLinkKernels.pdf)
  // Pairwise coupling via Legendre/power-residue symbols
  LegendreSymbol,
  PowerResidueSymbol,
  // Triadic coupling via Rédei symbol
  RedeiSymbol,
  // Higher-order coupling via arithmetic Milnor invariants
  ArithmeticMilnorInvariant,
  MultipleResidueSymbol,
  // Main ALK kernel class
  ArithmeticLinkKernel,
  // Integration with PrimeState/Hilbert dynamics
  ALKOperators,
  // Utility functions
  findBorromeanPrimes,
  computeLegendreMatrix,
  quickBorromeanCheck,
  
  // Alexander Modules (CompleteAlexanderModules.pdf)
  // Laurent polynomial ring Z[t, t⁻¹]
  LaurentPolynomial,
  // Fitting ideals E_d(A_ψ)
  FittingIdeal,
  // Crowell exact sequence: 0 → N^ab → A_ψ → I_{Z[H]} → 0
  CrowellSequence,
  // Complete Alexander module A_ψ
  AlexanderModule,
  // Module signature Σ_{k,S,ℓ,ψ} for content-addressable memory
  ModuleSignature,
  // Content-addressable signature memory store
  SignatureMemory,
  // Signature extraction pipeline
  SignatureExtractor,
  // Factory functions
  createAlexanderModule,
  extractSignature,
  createSignatureMemory,
  createSignatureExtractor
};