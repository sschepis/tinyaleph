/**
 * Type definitions for @aleph-ai/tinyaleph
 *
 * The root entry re-exports the curated flat names from modular.js plus the
 * namespace objects (`core`, `physics`, `backends`, `engine`, `smf`, ...).
 * Canonical declarations live in the subpath type files referenced below.
 */

/// <reference types="node" />
/// <reference path="./core.d.ts" />
/// <reference path="./physics.d.ts" />
/// <reference path="./backends.d.ts" />
/// <reference path="./engine.d.ts" />
/// <reference path="./observer.d.ts" />
/// <reference path="./telemetry.d.ts" />

declare module '@aleph-ai/tinyaleph' {

  import { enochian, enochianVocabulary } from '@aleph-ai/tinyaleph/core';
  import { bioinformatics } from '@aleph-ai/tinyaleph/backends';

  // ============================================
  // Re-exports from @aleph-ai/tinyaleph/core
  // (exactly the names modular.js destructures from core)
  // ============================================

  export {
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
    Complex,
    PrimeState,
    ResonanceOperators,
    EntropyDrivenEvolution,
    encodeMemory,
    symbolicCompute,
    PHI,
    DELTA_S,
    QuaternionPrime,
    PrimeResonanceIdentity,
    PhaseLockedRing,
    HolographicField,
    EntangledNode,
    ResonantFragment,
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
  } from '@aleph-ai/tinyaleph/core';

  // ============================================
  // Re-exports from @aleph-ai/tinyaleph/physics
  // ============================================

  export {
    Oscillator,
    OscillatorBank,
    KuramotoModel,
    NetworkKuramoto,
    AdaptiveKuramoto,
    SakaguchiKuramoto,
    SmallWorldKuramoto,
    MultiSystemCoupling,
    createHierarchicalCoupling,
    createPeerCoupling,
    StochasticKuramoto,
    ColoredNoiseKuramoto,
    ThermalKuramoto,
    gaussianRandom,
    PrimeonZLadderU,
    createPrimeonLadder,
    shannonEntropyNats,
    probsOf,
    normalizeComplex,
    ZChannel,
    PrimeonZLadderMulti,
    createMultiChannelLadder,
    createAdiabaticSchedule,
    KuramotoCoupledLadder,
    createKuramotoLadder,
    runCollapsePressureExperiment,
    kuramotoOrderParameter,
    getPhase,
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
    ALKKuramotoModel,
    ALKNetworkKuramoto,
    createALKKuramoto,
    createALKNetworkKuramoto,
    runBorromeanExperiment
  } from '@aleph-ai/tinyaleph/physics';

  // ============================================
  // Re-exports from @aleph-ai/tinyaleph/backends
  // (named exports plus the bioinformatics classes that modular.js
  // flattens out of the backends default export)
  // ============================================

  export {
    Backend,
    SemanticBackend,
    CryptographicBackend,
    ScientificBackend
  } from '@aleph-ai/tinyaleph/backends';

  export const BioinformaticsBackend: typeof bioinformatics.BioinformaticsBackend;
  export const TranscriptionOperator: typeof bioinformatics.TranscriptionOperator;
  export const TranslationOperator: typeof bioinformatics.TranslationOperator;
  export const FoldingTransform: typeof bioinformatics.FoldingTransform;
  export const BindingAffinityCalculator: typeof bioinformatics.BindingAffinityCalculator;
  export const MolecularDocker: typeof bioinformatics.MolecularDocker;
  export const DNAStrand: typeof bioinformatics.DNAStrand;
  export const DNACircuit: typeof bioinformatics.DNACircuit;
  export const ANDGate: typeof bioinformatics.ANDGate;
  export const ORGate: typeof bioinformatics.ORGate;
  export const NOTGate: typeof bioinformatics.NOTGate;

  // ============================================
  // Re-exports from @aleph-ai/tinyaleph/engine
  // ============================================

  export { AlephEngine, createEngine } from '@aleph-ai/tinyaleph/engine';

  // ============================================
  // Re-exports from @aleph-ai/tinyaleph/observer
  // (flat class/constant names only — see namespace objects below)
  // ============================================

  export {
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX,
    SMF_CODEBOOK,
    CODEBOOK_SIZE,
    nearestCodebookAttractor,
    codebookTunnel,
    getTunnelingCandidates,
    PRSCLayer,
    PrimeOscillator,
    EntanglementDetector,
    TemporalLayer,
    Moment,
    TemporalPatternDetector,
    EntanglementLayer,
    EntangledPair,
    Phrase,
    AgencyLayer,
    AttentionFocus,
    Goal,
    Action,
    BoundaryLayer,
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    ObjectivityGate,
    SafetyLayer,
    SafetyConstraint,
    ViolationEvent,
    SafetyMonitor,
    TickGate,
    StabilizationController,
    HolographicEncoder,
    HolographicMemory,
    HolographicSimilarity
  } from '@aleph-ai/tinyaleph/observer';

  // ============================================
  // Re-exports from @aleph-ai/tinyaleph/telemetry
  // ============================================

  export {
    Counter,
    Gauge,
    Histogram,
    Summary,
    MetricRegistry,
    MetricType
  } from '@aleph-ai/tinyaleph/telemetry';

  // ============================================
  // Enochian flat names (from the enochian module namespaces)
  // ============================================

  export { enochian, enochianVocabulary };
  export const ENOCHIAN_ALPHABET: typeof enochianVocabulary.ENOCHIAN_ALPHABET;
  export const SedenionElement: typeof enochianVocabulary.SedenionElement;
  export const TwistOperator: typeof enochianVocabulary.TwistOperator;
  export const EnochianWord: typeof enochianVocabulary.EnochianWord;
  export const EnochianCall: typeof enochianVocabulary.EnochianCall;
  export const EnochianPacket: typeof enochian.EnochianPacket;
  export const EnochianEncoder: typeof enochian.EnochianEncoder;
  export const EnochianDecoder: typeof enochian.EnochianDecoder;
  export const EnhancedEnochianEncoder: typeof enochian.EnhancedEnochianEncoder;
  export const EnhancedEnochianDecoder: typeof enochian.EnhancedEnochianDecoder;

  // ============================================
  // Convenience Functions (modular.js)
  // ============================================

  /** Quick hash via a CryptographicBackend({ dimension: 32 }). */
  export function hash(input: string, length?: number): Buffer;

  /** Quick key derivation via a CryptographicBackend({ dimension: 32 }). */
  export function deriveKey(password: string, salt: string, length?: number, iterations?: number): Buffer;

  // ============================================
  // Error Handling (core/errors.js — root-only exports)
  // ============================================

  export const LogLevel: {
    TRACE: 0;
    DEBUG: 1;
    INFO: 2;
    WARN: 3;
    ERROR: 4;
    FATAL: 5;
    SILENT: 6;
  };

  export const ErrorCategory: {
    NETWORK: 'network';
    AUTHENTICATION: 'auth';
    VALIDATION: 'validation';
    RESOURCE: 'resource';
    PERMISSION: 'permission';
    TIMEOUT: 'timeout';
    RATE_LIMIT: 'rate_limit';
    INTERNAL: 'internal';
    EXTERNAL: 'external';
    USER: 'user';
    CONFIGURATION: 'config';
    LLM: 'llm';
  };

  export class SimpleEventEmitter {
    constructor();
    on(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): boolean;
    removeAllListeners(): void;
  }

  export interface AlephErrorOptions {
    category?: string;
    code?: string;
    retryable?: boolean;
    metadata?: object;
    cause?: unknown;
    userMessage?: string;
  }

  export class AlephError extends Error {
    constructor(message: string, options?: AlephErrorOptions);
    name: string;
    category: string;
    code: string;
    retryable: boolean;
    metadata: object;
    originalError: unknown;
    timestamp: number;
    userMessage: string;
    getDefaultUserMessage(): string;
    toJSON(): object;
  }

  export class NetworkError extends AlephError {
    constructor(message: string, options?: AlephErrorOptions);
  }

  export class LLMError extends AlephError {
    constructor(message: string, options?: AlephErrorOptions);
  }

  export class ValidationError extends AlephError {
    constructor(message: string, options?: AlephErrorOptions);
  }

  export class TimeoutError extends AlephError {
    constructor(message: string, options?: TimeoutErrorOptions);
    timeout?: number;
    operation?: string;
  }

  export interface TimeoutErrorOptions extends AlephErrorOptions {
    timeout?: number;
    operation?: string;
  }

  export class ErrorHandler extends SimpleEventEmitter {
    constructor(options?: object);
    setLogger(logger: unknown): void;
    setupDefaultHandlers(): void;
    normalize(error: unknown): AlephError;
    recordError(error: AlephError): void;
    updateErrorRate(): void;
    getErrorRate(): number;
    registerRecoveryHandler(category: string, handler: (error: AlephError) => unknown): void;
    getStats(): object;
  }

  export function withErrorHandling<T>(fn: () => T, options?: object): T;
  export function errorBoundary<T>(fn: () => T, fallback?: T): T;
  export function withTimeout<T>(promise: Promise<T>, timeout: number, operation?: string): Promise<T>;

  // ============================================
  // Logging (core/logger.js — root-only exports)
  // ============================================

  export interface LoggerOptions {
    name?: string;
    level?: number;
    [key: string]: unknown;
  }

  export class Logger extends SimpleEventEmitter {
    constructor(options?: LoggerOptions);
    child(namespace: string): Logger;
    log(level: string, message: string, data?: object): void;
    trace(message: string, data?: object): void;
    debug(message: string, data?: object): void;
    info(message: string, data?: object): void;
    warn(message: string, data?: object): void;
    error(message: string, data?: object): void;
    fatal(message: string, data?: object): void;
    setLevel(level: number): void;
    getRecent(count?: number): unknown[];
    getErrorSummary(): object;
    clearHistory(): void;
  }

  export function createLogger(namespace: string, options?: LoggerOptions): Logger;

  // ============================================
  // Namespace objects (root-level module namespaces)
  // ============================================

  export const core: (typeof import('@aleph-ai/tinyaleph/core'))['default'];
  export const physics: (typeof import('@aleph-ai/tinyaleph/physics'))['default'];
  export const backends: (typeof import('@aleph-ai/tinyaleph/backends'))['default'];
  export const engine: (typeof import('@aleph-ai/tinyaleph/engine'))['default'];

  export const smf: {
    SedenionMemoryField: typeof import('@aleph-ai/tinyaleph/observer').SedenionMemoryField;
    SMF_AXES: typeof import('@aleph-ai/tinyaleph/observer').SMF_AXES;
    AXIS_INDEX: typeof import('@aleph-ai/tinyaleph/observer').AXIS_INDEX;
    SMF_CODEBOOK: typeof import('@aleph-ai/tinyaleph/observer').SMF_CODEBOOK;
    CODEBOOK_SIZE: typeof import('@aleph-ai/tinyaleph/observer').CODEBOOK_SIZE;
    nearestCodebookAttractor: typeof import('@aleph-ai/tinyaleph/observer').nearestCodebookAttractor;
    codebookTunnel: typeof import('@aleph-ai/tinyaleph/observer').codebookTunnel;
    getTunnelingCandidates: typeof import('@aleph-ai/tinyaleph/observer').getTunnelingCandidates;
  };

  export const prsc: {
    PrimeOscillator: typeof import('@aleph-ai/tinyaleph/observer').PrimeOscillator;
    PRSCLayer: typeof import('@aleph-ai/tinyaleph/observer').PRSCLayer;
    EntanglementDetector: typeof import('@aleph-ai/tinyaleph/observer').EntanglementDetector;
    INT_SINE_TABLE: typeof import('@aleph-ai/tinyaleph/observer').INT_SINE_TABLE;
    INT_SINE_M: typeof import('@aleph-ai/tinyaleph/observer').INT_SINE_M;
    INT_SINE_SCALE: typeof import('@aleph-ai/tinyaleph/observer').INT_SINE_SCALE;
    intSin: typeof import('@aleph-ai/tinyaleph/observer').intSin;
    phaseToIndex: typeof import('@aleph-ai/tinyaleph/observer').phaseToIndex;
    indexToPhase: typeof import('@aleph-ai/tinyaleph/observer').indexToPhase;
    computeHistogramCoherence: typeof import('@aleph-ai/tinyaleph/observer').computeHistogramCoherence;
    gaussianRandom: typeof import('@aleph-ai/tinyaleph/observer').gaussianRandom;
  };

  export const temporal: {
    Moment: typeof import('@aleph-ai/tinyaleph/observer').Moment;
    TemporalLayer: typeof import('@aleph-ai/tinyaleph/observer').TemporalLayer;
    TemporalPatternDetector: typeof import('@aleph-ai/tinyaleph/observer').TemporalPatternDetector;
  };

  export const entanglement: {
    EntangledPair: typeof import('@aleph-ai/tinyaleph/observer').EntangledPair;
    Phrase: typeof import('@aleph-ai/tinyaleph/observer').Phrase;
    EntanglementLayer: typeof import('@aleph-ai/tinyaleph/observer').EntanglementLayer;
  };

  export const agency: {
    AttentionFocus: typeof import('@aleph-ai/tinyaleph/observer').AttentionFocus;
    Goal: typeof import('@aleph-ai/tinyaleph/observer').Goal;
    Action: typeof import('@aleph-ai/tinyaleph/observer').Action;
    AgencyLayer: typeof import('@aleph-ai/tinyaleph/observer').AgencyLayer;
  };

  export const boundary: {
    SensoryChannel: typeof import('@aleph-ai/tinyaleph/observer').SensoryChannel;
    MotorChannel: typeof import('@aleph-ai/tinyaleph/observer').MotorChannel;
    EnvironmentalModel: typeof import('@aleph-ai/tinyaleph/observer').EnvironmentalModel;
    SelfModel: typeof import('@aleph-ai/tinyaleph/observer').SelfModel;
    BoundaryLayer: typeof import('@aleph-ai/tinyaleph/observer').BoundaryLayer;
    ObjectivityGate: typeof import('@aleph-ai/tinyaleph/observer').ObjectivityGate;
  };

  export const safety: {
    SafetyConstraint: typeof import('@aleph-ai/tinyaleph/observer').SafetyConstraint;
    ViolationEvent: typeof import('@aleph-ai/tinyaleph/observer').ViolationEvent;
    SafetyMonitor: typeof import('@aleph-ai/tinyaleph/observer').SafetyMonitor;
    SafetyLayer: typeof import('@aleph-ai/tinyaleph/observer').SafetyLayer;
  };

  export const hqe: {
    TickGate: typeof import('@aleph-ai/tinyaleph/observer').TickGate;
    StabilizationController: typeof import('@aleph-ai/tinyaleph/observer').StabilizationController;
    HolographicEncoder: typeof import('@aleph-ai/tinyaleph/observer').HolographicEncoder;
    HolographicMemory: typeof import('@aleph-ai/tinyaleph/observer').HolographicMemory;
    HolographicSimilarity: typeof import('@aleph-ai/tinyaleph/observer').HolographicSimilarity;
  };

  export const errors: {
    LogLevel: typeof LogLevel;
    LogLevelNames: Record<number, string>;
    ErrorCategory: typeof ErrorCategory;
    AlephError: typeof AlephError;
    NetworkError: typeof NetworkError;
    LLMError: typeof LLMError;
    ValidationError: typeof ValidationError;
    TimeoutError: typeof TimeoutError;
    SimpleEventEmitter: typeof SimpleEventEmitter;
    ErrorHandler: typeof ErrorHandler;
    withErrorHandling: typeof withErrorHandling;
    errorBoundary: typeof errorBoundary;
    withTimeout: typeof withTimeout;
  };

  export const logger: {
    Logger: typeof Logger;
    createLogger: typeof createLogger;
  };

  export const metrics: (typeof import('@aleph-ai/tinyaleph/telemetry'))['default'];

  // ============================================
  // Default export (index.js: `export default modular`)
  // ============================================

  const _default: {
    // Main engine
    AlephEngine: typeof import('@aleph-ai/tinyaleph/engine').AlephEngine;
    createEngine: typeof import('@aleph-ai/tinyaleph/engine').createEngine;
    // Backends
    Backend: typeof import('@aleph-ai/tinyaleph/backends').Backend;
    SemanticBackend: typeof import('@aleph-ai/tinyaleph/backends').SemanticBackend;
    CryptographicBackend: typeof import('@aleph-ai/tinyaleph/backends').CryptographicBackend;
    ScientificBackend: typeof import('@aleph-ai/tinyaleph/backends').ScientificBackend;
    BioinformaticsBackend: typeof BioinformaticsBackend;
    TranscriptionOperator: typeof TranscriptionOperator;
    TranslationOperator: typeof TranslationOperator;
    FoldingTransform: typeof FoldingTransform;
    BindingAffinityCalculator: typeof BindingAffinityCalculator;
    MolecularDocker: typeof MolecularDocker;
    DNAStrand: typeof DNAStrand;
    DNACircuit: typeof DNACircuit;
    ANDGate: typeof ANDGate;
    ORGate: typeof ORGate;
    NOTGate: typeof NOTGate;
    // Core math
    Hypercomplex: typeof import('@aleph-ai/tinyaleph/core').Hypercomplex;
    FANO_LINES: typeof import('@aleph-ai/tinyaleph/core').FANO_LINES;
    octonionMultiplyIndex: typeof import('@aleph-ai/tinyaleph/core').octonionMultiplyIndex;
    sedenionMultiplyIndex: typeof import('@aleph-ai/tinyaleph/core').sedenionMultiplyIndex;
    multiplyIndices: typeof import('@aleph-ai/tinyaleph/core').multiplyIndices;
    buildMultiplicationTable: typeof import('@aleph-ai/tinyaleph/core').buildMultiplicationTable;
    // Prime utilities
    primeGenerator: typeof import('@aleph-ai/tinyaleph/core').primeGenerator;
    nthPrime: typeof import('@aleph-ai/tinyaleph/core').nthPrime;
    primesUpTo: typeof import('@aleph-ai/tinyaleph/core').primesUpTo;
    isPrime: typeof import('@aleph-ai/tinyaleph/core').isPrime;
    factorize: typeof import('@aleph-ai/tinyaleph/core').factorize;
    primeSignature: typeof import('@aleph-ai/tinyaleph/core').primeSignature;
    firstNPrimes: typeof import('@aleph-ai/tinyaleph/core').firstNPrimes;
    GaussianInteger: typeof import('@aleph-ai/tinyaleph/core').GaussianInteger;
    EisensteinInteger: typeof import('@aleph-ai/tinyaleph/core').EisensteinInteger;
    primeToFrequency: typeof import('@aleph-ai/tinyaleph/core').primeToFrequency;
    primeToAngle: typeof import('@aleph-ai/tinyaleph/core').primeToAngle;
    sumOfTwoSquares: typeof import('@aleph-ai/tinyaleph/core').sumOfTwoSquares;
    DEFAULT_PRIMES: typeof import('@aleph-ai/tinyaleph/core').DEFAULT_PRIMES;
    // Physics
    Oscillator: typeof import('@aleph-ai/tinyaleph/physics').Oscillator;
    OscillatorBank: typeof import('@aleph-ai/tinyaleph/physics').OscillatorBank;
    KuramotoModel: typeof import('@aleph-ai/tinyaleph/physics').KuramotoModel;
    shannonEntropy: typeof import('@aleph-ai/tinyaleph/physics').shannonEntropy;
    stateEntropy: typeof import('@aleph-ai/tinyaleph/physics').stateEntropy;
    coherence: typeof import('@aleph-ai/tinyaleph/physics').coherence;
    mutualInformation: typeof import('@aleph-ai/tinyaleph/physics').mutualInformation;
    relativeEntropy: typeof import('@aleph-ai/tinyaleph/physics').relativeEntropy;
    jointEntropy: typeof import('@aleph-ai/tinyaleph/physics').jointEntropy;
    oscillatorEntropy: typeof import('@aleph-ai/tinyaleph/physics').oscillatorEntropy;
    estimateLyapunov: typeof import('@aleph-ai/tinyaleph/physics').estimateLyapunov;
    classifyStability: typeof import('@aleph-ai/tinyaleph/physics').classifyStability;
    adaptiveCoupling: typeof import('@aleph-ai/tinyaleph/physics').adaptiveCoupling;
    localLyapunov: typeof import('@aleph-ai/tinyaleph/physics').localLyapunov;
    delayEmbedding: typeof import('@aleph-ai/tinyaleph/physics').delayEmbedding;
    stabilityMargin: typeof import('@aleph-ai/tinyaleph/physics').stabilityMargin;
    collapseProbability: typeof import('@aleph-ai/tinyaleph/physics').collapseProbability;
    shouldCollapse: typeof import('@aleph-ai/tinyaleph/physics').shouldCollapse;
    measureState: typeof import('@aleph-ai/tinyaleph/physics').measureState;
    collapseToIndex: typeof import('@aleph-ai/tinyaleph/physics').collapseToIndex;
    bornMeasurement: typeof import('@aleph-ai/tinyaleph/physics').bornMeasurement;
    partialCollapse: typeof import('@aleph-ai/tinyaleph/physics').partialCollapse;
    applyDecoherence: typeof import('@aleph-ai/tinyaleph/physics').applyDecoherence;
    ALKKuramotoModel: typeof import('@aleph-ai/tinyaleph/physics').ALKKuramotoModel;
    ALKNetworkKuramoto: typeof import('@aleph-ai/tinyaleph/physics').ALKNetworkKuramoto;
    // Convenience
    hash: typeof hash;
    deriveKey: typeof deriveKey;
    // LLM
    LLM: typeof import('@aleph-ai/tinyaleph/core').LLM;
    // Sub-module namespaces
    core: typeof core;
    physics: typeof physics;
    backends: typeof backends;
    engine: typeof engine;
    // Error handling
    errors: typeof errors;
    SimpleEventEmitter: typeof SimpleEventEmitter;
    AlephError: typeof AlephError;
    NetworkError: typeof NetworkError;
    LLMError: typeof LLMError;
    ValidationError: typeof ValidationError;
    TimeoutError: typeof TimeoutError;
    ErrorHandler: typeof ErrorHandler;
    withErrorHandling: typeof withErrorHandling;
    errorBoundary: typeof errorBoundary;
    withTimeout: typeof withTimeout;
    LogLevel: typeof LogLevel;
    ErrorCategory: typeof ErrorCategory;
    // Logging
    logger: typeof logger;
    Logger: typeof Logger;
    createLogger: typeof createLogger;
    // Metrics
    metrics: typeof metrics;
    Counter: typeof import('@aleph-ai/tinyaleph/telemetry').Counter;
    Gauge: typeof import('@aleph-ai/tinyaleph/telemetry').Gauge;
    Histogram: typeof import('@aleph-ai/tinyaleph/telemetry').Histogram;
    Summary: typeof import('@aleph-ai/tinyaleph/telemetry').Summary;
    MetricRegistry: typeof import('@aleph-ai/tinyaleph/telemetry').MetricRegistry;
    MetricType: typeof import('@aleph-ai/tinyaleph/telemetry').MetricType;
    // Observer namespaces
    smf: typeof smf;
    prsc: typeof prsc;
    temporal: typeof temporal;
    entanglement: typeof entanglement;
    agency: typeof agency;
    boundary: typeof boundary;
    safety: typeof safety;
    hqe: typeof hqe;
    // Enochian
    enochian: typeof enochian;
    enochianVocabulary: typeof enochianVocabulary;
    ENOCHIAN_ALPHABET: typeof ENOCHIAN_ALPHABET;
    SedenionElement: typeof SedenionElement;
    TwistOperator: typeof TwistOperator;
    EnochianWord: typeof EnochianWord;
    EnochianCall: typeof EnochianCall;
    EnochianPacket: typeof EnochianPacket;
    EnochianEncoder: typeof EnochianEncoder;
    EnochianDecoder: typeof EnochianDecoder;
    EnhancedEnochianEncoder: typeof EnhancedEnochianEncoder;
    EnhancedEnochianDecoder: typeof EnhancedEnochianDecoder;
    [key: string]: unknown;
  };

  export default _default;
}
