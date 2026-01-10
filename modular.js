/**
 * TinyAleph Modular - Main entry point
 *
 * A backend-agnostic prime-based computing framework supporting:
 * - Semantic Computing (NLP, concept mapping)
 * - Cryptographic Applications (hashing, key derivation)
 * - Scientific Computing (quantum simulation, particle physics)
 *
 * Browser-compatible utilities:
 * - Error Handling (custom errors, error boundary, event emitter)
 * - Logging (structured logging with console API)
 * - Metrics (Prometheus/OTLP compatible telemetry)
 * - Transport (WebSocket, SSE, polling)
 * - Profiling (timers, histograms, sampling)
 *
 * Observer Architecture (Sentient Observer core):
 * - SMF (Sedenion Memory Field) - 16-dimensional semantic orientation
 * - PRSC (Prime Resonance Semantic Computation) - Kuramoto oscillator dynamics
 * - Temporal Layer - Emergent time from coherence dynamics
 * - Entanglement Layer - Semantic binding between concepts
 * - Agency Layer - Attention and goal-directed behavior
 * - Boundary Layer - Self/environment distinction (objectivity gate)
 * - Safety Layer - Ethical constraints and emergency shutdown
 */

// Core mathematical foundation
const core = require('./core');

// Enochian Packet Layer (Section 7.4 of whitepaper)
const enochian = require('./core/enochian');
const enochianVocabulary = require('./core/enochian-vocabulary');

// Browser-compatible utilities (extracted from apps/sentient)
const errors = require('./core/errors');
const logger = require('./core/logger');
const metrics = require('./telemetry/metrics');
const transport = require('./transport');
const profiling = require('./profiling/primitives');

// Observer architecture (Sentient Observer core modules)
const smf = require('./observer/smf');
const prsc = require('./observer/prsc');
const temporal = require('./observer/temporal');
const entanglement = require('./observer/entanglement');
const agency = require('./observer/agency');
const boundary = require('./observer/boundary');
const safety = require('./observer/safety');
const hqe = require('./observer/hqe');
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
  engine,
  
  // Browser-compatible utilities (extracted from apps/sentient)
  // Error handling
  errors,
  SimpleEventEmitter: errors.SimpleEventEmitter,
  AlephError: errors.AlephError,
  NetworkError: errors.NetworkError,
  LLMError: errors.LLMError,
  ValidationError: errors.ValidationError,
  TimeoutError: errors.TimeoutError,
  ErrorHandler: errors.ErrorHandler,
  withErrorHandling: errors.withErrorHandling,
  errorBoundary: errors.errorBoundary,
  withTimeout: errors.withTimeout,
  LogLevel: errors.LogLevel,
  ErrorCategory: errors.ErrorCategory,
  
  // Logging
  logger,
  Logger: logger.Logger,
  createLogger: logger.createLogger,
  
  // Metrics/Telemetry
  metrics,
  Counter: metrics.Counter,
  Gauge: metrics.Gauge,
  Histogram: metrics.Histogram,
  Summary: metrics.Summary,
  MetricRegistry: metrics.MetricRegistry,
  MetricType: metrics.MetricType,
  
  // Transport
  transport,
  Transport: transport.Transport,
  WebSocketTransport: transport.WebSocketTransport,
  SSETransport: transport.SSETransport,
  MemoryTransport: transport.MemoryTransport,
  PollingTransport: transport.PollingTransport,
  TransportManager: transport.TransportManager,
  TransportState: transport.TransportState,
  
  // Profiling primitives
  profiling,
  RingBuffer: profiling.RingBuffer,
  Timer: profiling.Timer,
  Sampler: profiling.Sampler,
  RateCalculator: profiling.RateCalculator,
  MovingAverage: profiling.MovingAverage,
  Profiler: profiling.Profiler,
  hrtime: profiling.hrtime,
  hrtimeNs: profiling.hrtimeNs,
  
  // Observer Architecture (Sentient Observer core)
  // SMF - Sedenion Memory Field
  smf,
  SedenionMemoryField: smf.SedenionMemoryField,
  SMF_AXES: smf.SMF_AXES,
  AXIS_INDEX: smf.AXIS_INDEX,
  SMF_CODEBOOK: smf.SMF_CODEBOOK,
  CODEBOOK_SIZE: smf.CODEBOOK_SIZE,
  nearestCodebookAttractor: smf.nearestCodebookAttractor,
  codebookTunnel: smf.codebookTunnel,
  getTunnelingCandidates: smf.getTunnelingCandidates,
  
  // PRSC - Prime Resonance Semantic Computation
  prsc,
  PRSCLayer: prsc.PRSCLayer,
  PrimeOscillator: prsc.PrimeOscillator,
  EntanglementDetector: prsc.EntanglementDetector,
  
  // Temporal Layer
  temporal,
  TemporalLayer: temporal.TemporalLayer,
  Moment: temporal.Moment,
  TemporalPatternDetector: temporal.TemporalPatternDetector,
  
  // Entanglement Layer
  entanglement,
  EntanglementLayer: entanglement.EntanglementLayer,
  EntangledPair: entanglement.EntangledPair,
  Phrase: entanglement.Phrase,
  
  // Agency Layer
  agency,
  AgencyLayer: agency.AgencyLayer,
  AttentionFocus: agency.AttentionFocus,
  Goal: agency.Goal,
  Action: agency.Action,
  
  // Boundary Layer
  boundary,
  BoundaryLayer: boundary.BoundaryLayer,
  SensoryChannel: boundary.SensoryChannel,
  MotorChannel: boundary.MotorChannel,
  EnvironmentalModel: boundary.EnvironmentalModel,
  SelfModel: boundary.SelfModel,
  ObjectivityGate: boundary.ObjectivityGate,
  
  // Safety Layer
  safety,
  SafetyLayer: safety.SafetyLayer,
  SafetyConstraint: safety.SafetyConstraint,
  ViolationEvent: safety.ViolationEvent,
  SafetyMonitor: safety.SafetyMonitor,
  
  // HQE - Holographic Quantum Encoding (discrete.pdf equations 12-15)
  hqe,
  TickGate: hqe.TickGate,
  StabilizationController: hqe.StabilizationController,
  HolographicEncoder: hqe.HolographicEncoder,
  HolographicMemory: hqe.HolographicMemory,
  HolographicSimilarity: hqe.HolographicSimilarity,
  
  // Enochian Packet Layer (Section 7.4 - prime-indexed twist encoding)
  enochian,
  enochianVocabulary,
  ENOCHIAN_ALPHABET: enochianVocabulary.ENOCHIAN_ALPHABET,
  ENOCHIAN_LETTER_PRIMES: enochianVocabulary.ENOCHIAN_LETTER_PRIMES,
  ENOCHIAN_VOCABULARY: enochianVocabulary.ENOCHIAN_VOCABULARY,
  ENOCHIAN_CALLS: enochianVocabulary.ENOCHIAN_CALLS,
  SedenionElement: enochianVocabulary.SedenionElement,
  TwistOperator: enochianVocabulary.TwistOperator,
  EnochianWord: enochianVocabulary.EnochianWord,
  EnochianCall: enochianVocabulary.EnochianCall,
  EnochianPacket: enochian.EnochianPacket,
  EnochianEncoder: enochian.EnochianEncoder,
  EnochianDecoder: enochian.EnochianDecoder,
  EnhancedEnochianEncoder: enochian.EnhancedEnochianEncoder,
  EnhancedEnochianDecoder: enochian.EnhancedEnochianDecoder
};