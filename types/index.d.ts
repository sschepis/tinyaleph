/**
 * Type definitions for @aleph-ai/tinyaleph
 */

declare module '@aleph-ai/tinyaleph' {
  // ============================================
  // Core Types
  // ============================================

  export interface HypercomplexState {
    dimension: number;
    components: number[];
    
    add(other: HypercomplexState): HypercomplexState;
    subtract(other: HypercomplexState): HypercomplexState;
    multiply(other: HypercomplexState): HypercomplexState;
    scale(scalar: number): HypercomplexState;
    
    norm(): number;
    normalize(): HypercomplexState;
    conjugate(): HypercomplexState;
    inverse(): HypercomplexState;
    entropy(): number;
    coherence(other: HypercomplexState): number;
    isZeroDivisorWith(other: HypercomplexState): boolean;
    clone(): HypercomplexState;
    toString(): string;
  }

  export class Hypercomplex implements HypercomplexState {
    constructor(dimension?: number);
    dimension: number;
    components: number[];
    
    add(other: HypercomplexState): Hypercomplex;
    subtract(other: HypercomplexState): Hypercomplex;
    multiply(other: HypercomplexState): Hypercomplex;
    scale(scalar: number): Hypercomplex;
    
    norm(): number;
    normalize(): Hypercomplex;
    conjugate(): Hypercomplex;
    inverse(): Hypercomplex;
    entropy(): number;
    coherence(other: HypercomplexState): number;
    isZeroDivisorWith(other: HypercomplexState): boolean;
    clone(): Hypercomplex;
    toString(): string;
    
    excite(primes: number[]): void;
    getState(): number[];
  }

  // ============================================
  // Prime Utilities
  // ============================================

  export function primeGenerator(): Generator<number>;
  export function nthPrime(n: number): number;
  export function primesUpTo(max: number): number[];
  export function isPrime(n: number): boolean;
  export function factorize(n: number): number[];
  export function primeSignature(n: number): Map<number, number>;
  export function firstNPrimes(n: number): number[];
  export function primeToFrequency(p: number): number;
  export function primeToAngle(p: number): number;
  export function sumOfTwoSquares(p: number): [number, number] | null;

  export class GaussianInteger {
    constructor(real: number, imag: number);
    real: number;
    imag: number;
    norm(): number;
    conjugate(): GaussianInteger;
    multiply(other: GaussianInteger): GaussianInteger;
    add(other: GaussianInteger): GaussianInteger;
  }

  export class EisensteinInteger {
    constructor(a: number, b: number);
    a: number;
    b: number;
    norm(): number;
    conjugate(): EisensteinInteger;
    multiply(other: EisensteinInteger): EisensteinInteger;
  }

  export const DEFAULT_PRIMES: number[];

  // ============================================
  // Fano Plane
  // ============================================

  export const FANO_LINES: number[][];
  export function octonionMultiplyIndex(i: number, j: number): { index: number; sign: number };
  export function sedenionMultiplyIndex(i: number, j: number): { index: number; sign: number };
  export function multiplyIndices(i: number, j: number, dim: number): { index: number; sign: number };
  export function buildMultiplicationTable(dim: number): number[][];

  // ============================================
  // Physics: Oscillators
  // ============================================

  export interface OscillatorOptions {
    frequency?: number;
    phase?: number;
    amplitude?: number;
    damping?: number;
  }

  export class Oscillator {
    constructor(options?: OscillatorOptions);
    frequency: number;
    phase: number;
    amplitude: number;
    damping: number;
    
    step(dt: number): void;
    getValue(): number;
    getComplexValue(): { real: number; imag: number };
    excite(energy: number): void;
    damp(factor: number): void;
    synchronizeTo(targetPhase: number, coupling: number): void;
  }

  export class OscillatorBank {
    constructor(size: number);
    oscillators: Oscillator[];
    
    excite(primes: number[]): void;
    step(dt: number): void;
    getPhases(): number[];
    getAmplitudes(): number[];
    orderParameter(): number;
  }

  // ============================================
  // Physics: Kuramoto
  // ============================================

  export interface KuramotoOptions {
    coupling?: number;
    dt?: number;
  }

  export class KuramotoModel {
    constructor(bank: OscillatorBank, options?: KuramotoOptions);
    bank: OscillatorBank;
    coupling: number;
    
    step(dt?: number): void;
    orderParameter(): number;
    meanPhase(): number;
  }

  // ============================================
  // Physics: Entropy
  // ============================================

  export function shannonEntropy(probabilities: number[]): number;
  export function stateEntropy(state: HypercomplexState): number;
  export function coherence(state1: HypercomplexState, state2: HypercomplexState): number;
  export function mutualInformation(joint: number[][], marginal1: number[], marginal2: number[]): number;
  export function relativeEntropy(p: number[], q: number[]): number;
  export function jointEntropy(joint: number[][]): number;
  export function oscillatorEntropy(bank: OscillatorBank): number;

  // ============================================
  // Physics: Lyapunov
  // ============================================

  export function estimateLyapunov(timeSeries: number[]): number;
  export function classifyStability(lambda: number): 'stable' | 'marginal' | 'chaotic';
  export function adaptiveCoupling(lambda: number, currentCoupling: number): number;
  export function localLyapunov(timeSeries: number[], windowSize: number): number[];
  export function delayEmbedding(timeSeries: number[], dim: number, delay: number): number[][];
  export function stabilityMargin(lambda: number): number;

  // ============================================
  // Physics: Collapse
  // ============================================

  export function collapseProbability(state: HypercomplexState, threshold?: number): number;
  export function shouldCollapse(state: HypercomplexState, threshold?: number): boolean;
  export function measureState(state: HypercomplexState): number;
  export function collapseToIndex(state: HypercomplexState, index: number): HypercomplexState;
  export function bornMeasurement(state: HypercomplexState): { index: number; probability: number };
  export function partialCollapse(state: HypercomplexState, target: HypercomplexState, strength: number): HypercomplexState;
  export function applyDecoherence(state: HypercomplexState, rate: number): HypercomplexState;

  // ============================================
  // Backend Interface
  // ============================================

  export interface BackendConfig {
    dimension?: number;
    vocabulary?: Record<string, number[]>;
    ontology?: Record<number, string>;
    stopWords?: string[];
    transforms?: Transform[];
    [key: string]: any;
  }

  export interface Token {
    word: string;
    primes: number[];
    known: boolean;
    isStop: boolean;
    position: number;
  }

  export interface Transform {
    n: string;
    q: number[];
    r: number[];
    priority?: number;
    condition?: (state: HypercomplexState) => boolean;
  }

  export interface TransformStep {
    step: number;
    transform: string;
    primesBefore: number[];
    primesAfter: number[];
    entropyBefore: number;
    entropyAfter: number;
    entropyDrop: number;
  }

  export interface ProcessResult {
    input: any;
    output: any;
    primes: number[];
    state: HypercomplexState;
    entropy: number;
    steps: TransformStep[];
  }

  export abstract class Backend {
    constructor(config: BackendConfig);
    config: BackendConfig;
    
    abstract encode(input: any): number[];
    abstract decode(primes: number[]): any;
    abstract process(input: any): ProcessResult;
    
    primesToState(primes: number[]): HypercomplexState;
  }

  // ============================================
  // Semantic Backend
  // ============================================

  /** Codon: a group of tokens processed as a unit (like DNA triplets) */
  export interface Codon {
    tokens: Token[];
    primes: number[];
    position: number;
  }

  /** Reading frame: a specific offset and direction for sequence reading */
  export interface ReadingFrame {
    direction: 'forward' | 'reverse';
    offset: number;
    state: HypercomplexState;
    tokens: Token[];
  }

  /** Dual representation: sense and antisense like DNA double helix */
  export interface DualRepresentation {
    sense: HypercomplexState;
    antisense: HypercomplexState;
    magnitude: number;
    coherence: number;
  }

  /** Complete DNA-inspired encoding result */
  export interface DNAEncoding {
    tokens: Token[];
    codons: Codon[];
    frames: ReadingFrame[];
    bidirectional: HypercomplexState;
    sixFrame: HypercomplexState;
    sense: HypercomplexState;
    antisense: HypercomplexState;
    magnitude: number;
    coherence: number;
  }

  /** DNA comparison result */
  export interface DNAComparisonResult {
    senseCoherence: number;
    crossCoherence: number;
    combinedScore: number;
  }

  export class SemanticBackend extends Backend {
    constructor(config: BackendConfig);
    
    tokenize(text: string, filterStopWords?: boolean): Token[];
    encode(text: string): number[];
    encodeAll(text: string): number[];
    encodeOrdered(text: string): Token[];
    decode(primes: number[]): string;
    
    primesToState(primes: number[]): HypercomplexState;
    orderedPrimesToState(tokens: Token[]): HypercomplexState;
    textToOrderedState(text: string): HypercomplexState;
    
    hasWord(word: string): boolean;
    getWordPrimes(word: string): number[] | null;
    learn(word: string, primes: number[]): void;
    getVocabularySize(): number;
    
    getOntologyMeaning(prime: number): string | null;
    getAxisPrimes(axis: number): number[];
    getOntologyTerms(): string[];
    
    applyTransform(primes: number[], transform: Transform): number[];
    process(text: string): ProcessResult;
    
    // ============================================
    // DNA-Inspired Processing Methods
    // ============================================
    
    /**
     * Bidirectional processing (Enochian boustrophedon)
     * Computes both forward and backward states, combines via conjugate multiplication
     */
    bidirectionalState(tokens: Token[]): HypercomplexState;
    
    /**
     * Group tokens into codons (triplets by default)
     * Like DNA triplets that encode amino acids
     */
    tokensToCodons(tokens: Token[], codonSize?: number): Codon[];
    
    /**
     * Process text using codon chunking
     */
    codonState(text: string, codonSize?: number): HypercomplexState;
    
    /**
     * Generate reading frame states (6 frames: 3 forward + 3 reverse)
     * Like DNA's 6 reading frames
     */
    readingFrameStates(tokens: Token[], numFrames?: number): ReadingFrame[];
    
    /**
     * Combine all 6 reading frames into unified state
     */
    sixFrameState(text: string): HypercomplexState;
    
    /**
     * Get sense/antisense dual representation (like DNA double helix)
     */
    dualRepresentation(tokens: Token[]): DualRepresentation;
    
    /**
     * Full DNA-inspired encoding combining all methods:
     * 1. Codon chunking (triplets)
     * 2. 6-frame processing
     * 3. Bidirectional (boustrophedon)
     * 4. Sense/Antisense duality
     */
    dnaEncode(text: string): DNAEncoding;
    
    /**
     * Compare two texts using their DNA encodings
     */
    dnaCompare(text1: string, text2: string): DNAComparisonResult;
  }

  // ============================================
  // Cryptographic Backend
  // ============================================

  export class CryptographicBackend extends Backend {
    constructor(config: BackendConfig);
    
    encode(text: string): number[];
    decode(primes: number[]): string;
    
    hash(input: string, length?: number): string;
    hashToState(input: string): HypercomplexState;
    deriveKey(password: string, salt: string, length?: number, iterations?: number): HypercomplexState;
    
    process(input: string): ProcessResult;
  }

  // ============================================
  // Scientific Backend
  // ============================================

  export class ScientificBackend extends Backend {
    constructor(config: BackendConfig);
    
    encode(input: number[]): number[];
    decode(primes: number[]): number[];
    
    createState(components: number[]): HypercomplexState;
    createRandomState(): HypercomplexState;
    createBasisState(index: number): HypercomplexState;
    
    superpose(state1: HypercomplexState, weight1: number, state2: HypercomplexState, weight2: number): HypercomplexState;
    evolve(state: HypercomplexState, hamiltonian: HypercomplexState, dt: number): HypercomplexState;
    collapse(state: HypercomplexState, target: HypercomplexState, strength: number): HypercomplexState;
    
    measureProbability(state: HypercomplexState, projector: HypercomplexState): number;
    measure(state: HypercomplexState, basis: HypercomplexState[]): { outcome: number; probability: number; finalState: HypercomplexState };
    
    process(input: any): ProcessResult;
  }

  // ============================================
  // Aleph Engine
  // ============================================

  export interface EngineOptions {
    oscillatorCount?: number;
    coupling?: number;
    entropyThreshold?: number;
    maxIterations?: number;
    collapseStrength?: number;
    dt?: number;
  }

  export interface EngineResult extends ProcessResult {
    oscillators: {
      orderParameter: number;
      phases: number[];
    };
    metrics: {
      totalTime: number;
      encodeTime: number;
      transformTime: number;
      decodeTime: number;
    };
  }

  export class AlephEngine {
    constructor(backend: Backend, options?: EngineOptions);
    backend: Backend;
    oscillators: Oscillator[];
    field: HypercomplexState;
    config: EngineOptions;
    
    run(input: any): EngineResult;
    runBatch(inputs: any[]): EngineResult[];
    step(state: HypercomplexState): { state: HypercomplexState; entropy: number; transform: Transform | null };
    
    initializeField(primes: number[]): void;
    exciteField(primes: number[]): void;
    collapseField(target: HypercomplexState): HypercomplexState;
    getFieldState(): HypercomplexState;
    getFieldEntropy(): number;
    
    stepOscillators(): void;
    synchronizeOscillators(target: number): void;
    getOrderParameter(): number;
    exciteOscillator(index: number, energy: number): void;
    
    selectTransform(primes: number[], state: HypercomplexState): Transform | null;
    applyTransform(primes: number[], transform: Transform): number[];
    addTransform(transform: Transform): void;
    removeTransform(name: string): boolean;
    
    getMetrics(): {
      runs: number;
      totalTime: number;
      avgTime: number;
      avgEntropy: number;
      avgSteps: number;
      transformCounts: Record<string, number>;
      cacheHits: number;
      cacheMisses: number;
    };
    resetMetrics(): void;
  }

  // ============================================
  // Factory Functions
  // ============================================

  export function createEngine(backendType: 'semantic' | 'cryptographic' | 'crypto' | 'scientific' | 'science' | 'quantum', config?: BackendConfig & { engineOptions?: EngineOptions }): AlephEngine;

  // ============================================
  // Convenience Functions
  // ============================================

  export function hash(input: string, length?: number): string;
  export function deriveKey(password: string, salt: string, length?: number, iterations?: number): HypercomplexState;

  // ============================================
  // LLM Client
  // ============================================

  export interface LLMOptions {
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }

  export class LLM {
    constructor(options?: LLMOptions);
    
    query(prompt: string): Promise<string>;
    embed(text: string): Promise<number[]>;
  }

  // ============================================
  // Sub-modules
  // ============================================

  export const core: {
    Hypercomplex: typeof Hypercomplex;
    FANO_LINES: number[][];
    octonionMultiplyIndex: typeof octonionMultiplyIndex;
    sedenionMultiplyIndex: typeof sedenionMultiplyIndex;
    multiplyIndices: typeof multiplyIndices;
    buildMultiplicationTable: typeof buildMultiplicationTable;
    primeGenerator: typeof primeGenerator;
    nthPrime: typeof nthPrime;
    primesUpTo: typeof primesUpTo;
    isPrime: typeof isPrime;
    factorize: typeof factorize;
    primeSignature: typeof primeSignature;
    firstNPrimes: typeof firstNPrimes;
    GaussianInteger: typeof GaussianInteger;
    EisensteinInteger: typeof EisensteinInteger;
    primeToFrequency: typeof primeToFrequency;
    primeToAngle: typeof primeToAngle;
    sumOfTwoSquares: typeof sumOfTwoSquares;
    DEFAULT_PRIMES: number[];
    LLM: typeof LLM;
  };

  export const physics: {
    Oscillator: typeof Oscillator;
    OscillatorBank: typeof OscillatorBank;
    KuramotoModel: typeof KuramotoModel;
    shannonEntropy: typeof shannonEntropy;
    stateEntropy: typeof stateEntropy;
    coherence: typeof coherence;
    mutualInformation: typeof mutualInformation;
    relativeEntropy: typeof relativeEntropy;
    jointEntropy: typeof jointEntropy;
    oscillatorEntropy: typeof oscillatorEntropy;
    estimateLyapunov: typeof estimateLyapunov;
    classifyStability: typeof classifyStability;
    adaptiveCoupling: typeof adaptiveCoupling;
    localLyapunov: typeof localLyapunov;
    delayEmbedding: typeof delayEmbedding;
    stabilityMargin: typeof stabilityMargin;
    collapseProbability: typeof collapseProbability;
    shouldCollapse: typeof shouldCollapse;
    measureState: typeof measureState;
    collapseToIndex: typeof collapseToIndex;
    bornMeasurement: typeof bornMeasurement;
    partialCollapse: typeof partialCollapse;
    applyDecoherence: typeof applyDecoherence;
  };

  export const backends: {
    Backend: typeof Backend;
    SemanticBackend: typeof SemanticBackend;
    CryptographicBackend: typeof CryptographicBackend;
    ScientificBackend: typeof ScientificBackend;
  };

  export const engine: {
    AlephEngine: typeof AlephEngine;
  };
}