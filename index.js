/**
 * @aleph-ai/tinyaleph
 * 
 * Prime-resonant semantic computing framework
 * 
 * Features:
 * - Hypercomplex algebra (quaternions, octonions, sedenions)
 * - Prime-based semantic encoding
 * - Kuramoto oscillator synchronization
 * - Entropy-minimizing reasoning
 * - Multiple backends (semantic, cryptographic, scientific)
 * 
 * @example
 * import {  createEngine  } from '@aleph-ai/tinyaleph';
 * 
 * const engine = createEngine('semantic', config);
 * const result = engine.run('What is wisdom?');
 * console.log(result.output);
 * 
 * @module @aleph-ai/tinyaleph
 */

import modular from './modular.js';

// Re-export all named exports from the default export object
export const {
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
  
  // Physics - Core oscillators
  Oscillator,
  OscillatorBank,
  KuramotoModel,
  // Extended sync models
  NetworkKuramoto,
  AdaptiveKuramoto,
  SakaguchiKuramoto,
  SmallWorldKuramoto,
  MultiSystemCoupling,
  createHierarchicalCoupling,
  createPeerCoupling,
  // Stochastic models
  StochasticKuramoto,
  ColoredNoiseKuramoto,
  ThermalKuramoto,
  gaussianRandom,
  // Primeon Z-Ladder
  PrimeonZLadderU,
  createPrimeonLadder,
  shannonEntropyNats,
  probsOf,
  normalizeComplex,
  // Multi-channel ladder
  ZChannel,
  PrimeonZLadderMulti,
  createMultiChannelLadder,
  createAdiabaticSchedule,
  // Kuramoto-coupled ladder
  KuramotoCoupledLadder,
  createKuramotoLadder,
  runCollapsePressureExperiment,
  kuramotoOrderParameter,
  getPhase,
  // Entropy & Information
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
  
  // ALK-Kuramoto models
  ALKKuramotoModel,
  ALKNetworkKuramoto,
  createALKKuramoto,
  createALKNetworkKuramoto,
  runBorromeanExperiment,
  
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
  createSignatureExtractor,
  
  // Sub-modules
  core,
  physics,
  backends,
  engine,
  
  // Browser-compatible utilities (extracted from apps/sentient)
  // Error handling
  errors,
  SimpleEventEmitter,
  AlephError,
  NetworkError,
  LLMError,
  ValidationError,
  TimeoutError,
  ErrorHandler,
  withErrorHandling,
  errorBoundary,
  withTimeout,
  LogLevel,
  ErrorCategory,
  
  // Logging
  logger,
  Logger,
  createLogger,
  
  // Metrics/Telemetry
  metrics,
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricRegistry,
  MetricType,
  
  // Observer Architecture (Sentient Observer core)
  // SMF - Sedenion Memory Field
  smf,
  SedenionMemoryField,
  SMF_AXES,
  AXIS_INDEX,
  SMF_CODEBOOK,
  CODEBOOK_SIZE,
  nearestCodebookAttractor,
  codebookTunnel,
  getTunnelingCandidates,
  
  // PRSC - Prime Resonance Semantic Computation
  prsc,
  PRSCLayer,
  PrimeOscillator,
  EntanglementDetector,
  
  // Temporal Layer
  temporal,
  TemporalLayer,
  Moment,
  TemporalPatternDetector,
  
  // Entanglement Layer
  entanglement,
  EntanglementLayer,
  EntangledPair,
  Phrase,
  
  // Agency Layer
  agency,
  AgencyLayer,
  AttentionFocus,
  Goal,
  Action,
  
  // Boundary Layer
  boundary,
  BoundaryLayer,
  SensoryChannel,
  MotorChannel,
  EnvironmentalModel,
  SelfModel,
  ObjectivityGate,
  
  // Safety Layer
  safety,
  SafetyLayer,
  SafetyConstraint,
  ViolationEvent,
  SafetyMonitor,
  
  // HQE - Holographic Quantum Encoding (discrete.pdf equations 12-15)
  hqe,
  TickGate,
  StabilizationController,
  HolographicEncoder,
  HolographicMemory,
  HolographicSimilarity,
  
  // Enochian Packet Layer (Section 7.4 - prime-indexed twist encoding)
  enochian,
  enochianVocabulary,
  ENOCHIAN_ALPHABET,
  ENOCHIAN_LETTER_PRIMES,
  ENOCHIAN_VOCABULARY,
  ENOCHIAN_CALLS,
  SedenionElement,
  TwistOperator,
  EnochianWord,
  EnochianCall,
  EnochianPacket,
  EnochianEncoder,
  EnochianDecoder,
  EnhancedEnochianEncoder,
  EnhancedEnochianDecoder
} = modular;

export default modular;
