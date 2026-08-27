/**
 * Type definitions for @aleph-ai/tinyaleph/physics
 *
 * Declared against the runtime in physics/index.js and its re-exported
 * modules. Signatures mirror the actual class bodies and functions.
 */

declare module '@aleph-ai/tinyaleph/physics' {

  import type { ArithmeticLinkKernel } from '@aleph-ai/tinyaleph/core';

  /**
   * Structural view of a hypercomplex state used by the entropy/collapse
   * functions (they duck-type against `.c`, `.dim`, `.norm()`, `.dot()`).
   */
  export interface HypercomplexLike {
    dim: number;
    c: Float64Array | number[];
    norm?(): number;
    dot?(other: HypercomplexLike): number;
  }

  // ============================================
  // Oscillators (physics/oscillator.js)
  // ============================================

  /**
   * Phase-amplitude oscillator. Starts QUIESCENT (amplitude = 0) and must
   * be excited by input to become active. POSITIONAL constructor:
   * (frequency, phase = 0, amplitude = 0).
   */
  export class Oscillator {
    constructor(frequency: number, phase?: number, amplitude?: number);
    freq: number;
    phase: number;
    amplitude: number;
    baseAmplitude: number;
    phaseHistory: number[];
    tick(dt: number, coupling?: number): void;
    excite(amount?: number): void;
    decay(rate?: number, dt?: number): void;
    getState(): { freq: number; phase: number; amplitude: number };
    reset(): void;
  }

  export class OscillatorBank {
    constructor(sizeOrFrequencies: number | number[], defaultPrimes?: number[] | null);
    oscillators: Oscillator[];
    primeList: number[];
    tick(dt: number, couplingFn?: (osc: Oscillator, all: Oscillator[]) => number): void;
    exciteByIndices(indices: number[], amount?: number): void;
    excite(primes: number[], amount?: number): void;
    decayAll(rate?: number, dt?: number): void;
    getState(): Array<{ freq: number; phase: number; amplitude: number }>;
    getAmplitudes(): number[];
    getPhases(): number[];
    reset(): void;
  }

  // ============================================
  // Kuramoto (physics/kuramoto.js)
  // ============================================

  export class KuramotoModel extends OscillatorBank {
    constructor(frequenciesOrBank: number[] | OscillatorBank, couplingOrOptions?: number | { coupling?: number });
    K: number;
    step(dt: number): void;
    /** r = |(1/N) Σ a_j e^{iθj}| (amplitude-weighted, normalized by N). */
    orderParameter(): number;
    /** Amplitude-weighted circular mean; normalizes by the amplitude sum. */
    meanPhase(): number;
    kuramotoCoupling(osc: Oscillator): number;
    tick(dt: number): void;
    exciteByPrimes(primes: number[], primeList: number[], amount?: number): void;
    getWeightedAmplitudes(): number[];
    /** Alias for orderParameter(). */
    synchronization(): number;
    pairwiseCoherence(): number;
  }

  // ============================================
  // Extended Synchronization Models (physics/sync-models.js)
  // ============================================

  export class NetworkKuramoto extends KuramotoModel {
    constructor(frequencies: number[], adjacency?: number[][] | null, couplingStrength?: number);
    setFromEntanglementGraph(graph: unknown): void;
    buildFromDistance(frequencies: number[], distanceFn: (i: number, j: number) => number, radius: number): void;
    kuramotoCoupling(osc: Oscillator): number;
    clusteringCoefficient(osc: Oscillator): number;
    averageClustering(): number;
    findClusters(): number[][];
  }

  export class AdaptiveKuramoto extends NetworkKuramoto {
    constructor(frequencies: number[], couplingStrength?: number, learningRate?: number);
    adaptCoupling(dt: number): void;
    tick(dt: number): void;
    totalCoupling(): number;
    getCouplingSnapshot(): unknown;
    recordCouplingHistory(): void;
    resetCoupling(): void;
  }

  export class SakaguchiKuramoto extends KuramotoModel {
    constructor(frequencies: number[], couplingStrength?: number, phaseLag?: number);
    setPhaseLag(lag: number): void;
    kuramotoCoupling(osc: Oscillator): number;
    chimeraRatio(): number;
    classifyState(): 'coherent' | 'chimera' | 'incoherent';
    static criticalPhaseLag(): number;
  }

  export class SmallWorldKuramoto extends NetworkKuramoto {
    constructor(frequencies: number[], k?: number, p?: number, couplingStrength?: number);
    static wattsStrogatz(n: number, k: number, p: number): number[][];
    regenerate(): void;
    averagePathLength(): number;
    smallWorldCoefficient(): number;
  }

  export class MultiSystemCoupling {
    constructor(systems: KuramotoModel[], coupling?: number | null);
    setInterCoupling(strength: number): void;
    orderParameters(): number[];
    interSystemCoupling(): number;
    tick(dt: number): void;
    globalOrderParameter(): number;
    interSystemCoherence(): number;
    exciteSystem(index: number, primes: number[]): void;
    exciteAll(primes: number[]): void;
    reset(): void;
    getState(): unknown;
  }

  export function createHierarchicalCoupling(frequencies: number[], levels?: number, oscPerLevel?: number): MultiSystemCoupling;
  export function createPeerCoupling(frequencies: number[], numPeers?: number, strength?: number): MultiSystemCoupling;

  // ============================================
  // Stochastic Kuramoto (physics/stochastic-kuramoto.js)
  // ============================================

  export interface StochasticKuramotoOptions {
    coupling?: number;
    noiseIntensity?: number;
    noiseType?: 'white' | 'colored';
    correlationTime?: number;
    temperature?: number;
    temperatureCoupling?: boolean;
  }

  export class StochasticKuramoto extends KuramotoModel {
    constructor(frequencies: number[], options?: StochasticKuramotoOptions);
    sigma: number;
    noiseType: 'white' | 'colored';
    tau: number;
    temperature: number;
    useTemperatureCoupling: boolean;
    noiseStats: { mean: number; variance: number; sampleCount: number };
    setNoiseIntensity(sigma: number): void;
    setTemperature(T: number): void;
    getEffectiveCoupling(): number;
    whiteNoiseIncrement(dt: number): number;
    updateColoredNoise(idx: number, dt: number): number;
    getNoiseIncrement(idx: number, dt: number): number;
    stochasticCoupling(osc: Oscillator, idx: number, dt: number): number;
    tick(dt?: number): void;
    evolve(steps: number, dt?: number): void;
    detectNoiseInducedSync(): unknown;
    orderParameterWithUncertainty(): unknown;
    orderParameterAutocorrelation(): unknown;
    estimateCorrelationTime(): number;
    resetNoise(): void;
    /** Object spread of the bank state array plus noise bookkeeping fields. */
    getState(): Array<{ freq: number; phase: number; amplitude: number }> & {
      noiseIntensity: number;
      noiseType: string;
      correlationTime: number;
      temperature: number;
      effectiveCoupling: number;
      noiseStats: { mean: number; variance: number; sampleCount: number };
      coloredNoiseState: number[];
    };
  }

  export class ColoredNoiseKuramoto extends StochasticKuramoto {
    constructor(frequencies: number[], options?: StochasticKuramotoOptions);
    setCorrelationTime(tau: number): void;
    getStationaryVariance(): number;
    isEquilibrated(): boolean;
    noisePowerSpectrum(): unknown;
  }

  export class ThermalKuramoto extends StochasticKuramoto {
    constructor(frequencies: number[], options?: StochasticKuramotoOptions);
    setTemperature(T: number): void;
    estimateCriticalTemperature(): number;
    temperatureSweep(Tmin?: number, Tmax?: number, steps?: number, equilibrationSteps?: number): Array<{ temperature: number; orderParameter: number; coherence: number }>;
    isOrdered(threshold?: number): boolean;
    isNearCritical(tolerance?: number): boolean;
  }

  /** Box-Muller Gaussian random number. */
  export function gaussianRandom(mean?: number, stddev?: number): number;

  // ============================================
  // Primeon Z-Ladder (physics/primeon_z_ladder_u.js)
  // ============================================

  export class Complex {
    constructor(re?: number, im?: number);
    re: number;
    im: number;
    static add(a: Complex, b: Complex): Complex;
    static sub(a: Complex, b: Complex): Complex;
    static mul(a: Complex, b: Complex): Complex;
    static scale(a: Complex, k: number): Complex;
    static conj(a: Complex): Complex;
    static abs2(a: Complex): number;
    static exp(a: Complex): Complex;
    static zero(): Complex;
    clone(): Complex;
  }

  export interface PrimeonZLadderUOptions {
    N: number;
    d?: number;
    dz?: number;
    J?: number;
    leak?: number;
    closeZ?: boolean;
    periodic?: boolean;
  }

  export class PrimeonZLadderU {
    constructor(opts: PrimeonZLadderUOptions);
    N: number;
    d: number;
    dz: number;
    J: number;
    leak: number;
    closeZ: boolean;
    periodic: boolean;
    psi: Complex[];
    z: Complex[];
    t: number;
    lastZFlux: number;
    totalZFlux: number;
    stepCount: number;
    reset(): void;
    exciteRung(n: number, amp?: Complex, k?: number): void;
    normalize(): void;
    exciteRungs(rungs: number[], ampScale?: number): void;
    excitePrimes(primes: number[], ampScale?: number): void;
    step(dt?: number): unknown;
    run(steps: number, dt?: number): unknown;
    metrics(): object;
    snapshot(): object;
    restore(snap: object): void;
    rungProbabilities(): number[];
    sampleRung(): number;
    collapseToRung(n: number): unknown;
    measure(): unknown;
  }

  export function createPrimeonLadder(primes: number[], opts?: Partial<PrimeonZLadderUOptions> & { N?: number }): PrimeonZLadderU;
  export function shannonEntropyNats(probs: number[]): number;
  export function probsOf(vec: Complex[]): number[];
  export function normalizeComplex(vec: Complex[]): Complex[];

  // ============================================
  // Multi-Channel Ladder (physics/primeon_z_ladder_multi.js)
  // ============================================

  export interface ZChannelConfig {
    name: string;
    dz: number;
    leak: number;
    decay?: number;
    crossCoupling?: number;
  }

  export class ZChannel {
    constructor(config: ZChannelConfig);
    name: string;
    dz: number;
    leak: number;
    decay: number;
    crossCoupling: number;
    N: number;
    z: Complex[] | null;
    totalFlux: number;
    lastFlux: number;
    init(N: number): void;
    reset(): void;
    metrics(): object;
    snapshot(): object;
    restore(snap: object): void;
  }

  export interface PrimeonZLadderMultiOptions {
    N: number;
    d?: number;
    J?: number;
    zChannels: ZChannelConfig[];
    periodic?: boolean;
    Jt?: ((t: number) => number) | null;
  }

  export class PrimeonZLadderMulti {
    constructor(opts: PrimeonZLadderMultiOptions);
    N: number;
    d: number;
    J: number;
    J0: number;
    periodic: boolean;
    getChannel(name: string): ZChannel | undefined;
    getChannelNames(): string[];
    reset(): void;
    getCurrentJ(): number;
    exciteRung(n: number, amp?: Complex, k?: number): void;
    normalize(): void;
    exciteRungs(rungs: number[], ampScale?: number): void;
    excitePrimes(primes: number[], ampScale?: number): void;
    gaussianPulse(rungs: number[], width: number): void;
    piPulse(rungs: number[]): void;
    step(dt?: number): unknown;
    run(steps: number, dt?: number): unknown;
    coreMetrics(): object;
    metrics(): object;
    channelMetrics(): object;
    rungProbabilities(): number[];
    sampleRung(): number;
    collapseToRung(n: number): unknown;
    measure(): unknown;
    entanglementEntropy(): number;
    snapshot(): object;
    restore(snap: object): void;
  }

  export function createMultiChannelLadder(primes: number[], opts?: Partial<PrimeonZLadderMultiOptions>): PrimeonZLadderMulti;
  export function createAdiabaticSchedule(J0: number, J1: number, T: number, schedule?: string): (t: number) => number;

  // ============================================
  // Kuramoto-Coupled Ladder (physics/kuramoto-coupled-ladder.js)
  // ============================================

  export function getPhase(z: Complex): number;
  export function kuramotoOrderParameter(phases: number[]): number;

  export class KuramotoCoupledLadder extends PrimeonZLadderMulti {
    constructor(opts: PrimeonZLadderMultiOptions);
    getRungPhases(): number[];
    getRungAmplitudes(): number[];
    orderParameter(): number;
    step(dt?: number): unknown;
    triggerCollapse(): unknown;
    syncMetrics(): object;
    collapseDynamics(): object;
    metrics(): object;
    reset(): void;
    runWithSync(steps: number, dt?: number): unknown;
    detectSyncTransition(): unknown;
    snapshot(): object;
    restore(snap: object): void;
  }

  export function createKuramotoLadder(primes: number[], opts?: Partial<PrimeonZLadderMultiOptions>): KuramotoCoupledLadder;
  export function runCollapsePressureExperiment(opts?: object): object;

  // ============================================
  // Entropy & Information (physics/entropy.js)
  // ============================================

  /** THROWS TypeError if any probability is not finite. */
  export function shannonEntropy(probabilities: number[]): number;
  export function stateEntropy(state: HypercomplexLike): number;
  export function coherence(state1: HypercomplexLike, state2: HypercomplexLike): number;
  /** Phase correlation between two oscillator banks. */
  export function mutualInformation(bank1: { oscillators: Array<{ phase: number }> }, bank2: { oscillators: Array<{ phase: number }> }): number;
  /** KL divergence; returns Infinity when p has support where q ~ 0. */
  export function relativeEntropy(p: number[], q: number[]): number;
  /** Joint entropy of two states (outer product of their probability distributions). */
  export function jointEntropy(state1: HypercomplexLike, state2: HypercomplexLike): number;
  export function oscillatorEntropy(bank: { getAmplitudes(): number[] }): number;

  // ============================================
  // Lyapunov (physics/lyapunov.js)
  // ============================================

  /** Accepts a plain time series (number[]) or an array of oscillator objects. */
  export function estimateLyapunov(historyOrOscillators: number[] | Array<{ phaseHistory: number[] }>, windowSize?: number): number;
  export function classifyStability(lambda: number): 'stable' | 'marginal' | 'chaotic';

  /**
   * Two calling conventions:
   * - 3 args (explicit legacy mode): adaptiveCoupling(baseCoupling, lyapunovExponent, gain)
   * - 2 args (coherence mode): adaptiveCoupling(coherence, baseStrength?)
   */
  export function adaptiveCoupling(coherenceOrBase: number, baseStrengthOrLyapunov?: number, gain?: number): number;

  /** Local Lyapunov exponent from a single oscillator's phase history. */
  export function localLyapunov(oscillator: { phaseHistory: number[] }, windowSize?: number): number;
  export function delayEmbedding(history: number[], embeddingDim?: number, delay?: number): number[][];
  export function stabilityMargin(lyapunovExponent: number, threshold?: number): number;

  // ============================================
  // Collapse (physics/collapse.js)
  // ============================================

  export interface CollapseState {
    entropy?: number;
    coherence?: number;
    lyapunov?: number;
  }

  /** Always returns a probability in [0, 1]. Accepts a state object, a hypercomplex state, or legacy (entropyIntegral, lyapunovFactor). */
  export function collapseProbability(state: HypercomplexLike | CollapseState | number, threshold?: number): number;
  export function shouldCollapse(state: HypercomplexLike | CollapseState | number, threshold?: number): boolean;

  /** Returns the collapsed index as a plain number (or dot product with an explicit basis). */
  export function measureState(hypercomplex: HypercomplexLike, basis?: HypercomplexLike | null): number;
  export function collapseToIndex(hypercomplex: HypercomplexLike, index: number): HypercomplexLike;
  /** Born-rule measurement; accepts a hypercomplex state or a raw amplitude array. */
  export function bornMeasurement(hypercomplexOrAmplitudes: HypercomplexLike | number[]): { index: number; probability: number };
  export function partialCollapse(state: HypercomplexLike, targetIndex: number, strength?: number): HypercomplexLike;
  export function applyDecoherence(state: HypercomplexLike, rate?: number): HypercomplexLike;

  // ============================================
  // ALK-Kuramoto Models (physics/alk-kuramoto.js)
  // ============================================

  export interface ALKKuramotoOptions {
    couplingScale?: number;
    triadicScale?: number;
    useTriadic?: boolean;
    useHigherOrder?: boolean;
    dt?: number;
    maxHistory?: number;
  }

  export class ALKKuramotoModel {
    constructor(oscillators: OscillatorBank | number[], alk: ArithmeticLinkKernel, options?: ALKKuramotoOptions);
    bank: OscillatorBank | null;
    N: number;
    omega: Float64Array;
    alk: ArithmeticLinkKernel;
    couplingScale: number;
    triadicScale: number;
    useTriadic: boolean;
    useHigherOrder: boolean;
    dt: number;
    theta: Float64Array;
    time: number;
    steps: number;
    history: unknown[];
    maxHistory: number;
    readonly J: number[][];
    readonly K3Entries: unknown[];
    step(dt?: number): void;
    stepRK4(dt?: number): void;
    evolve(steps: number, dt?: number): void;
    orderParameter(): number;
    meanPhase(): number;
    triadicCoherence(): number;
    phaseVariance(): number;
    findLockedPairs(threshold?: number): Array<[number, number]>;
    findLockedTriads(threshold?: number): Array<[number, number, number]>;
    getState(): unknown;
    setPhases(phases: ArrayLike<number>): void;
    reset(): void;
    clone(): ALKKuramotoModel;
  }

  export class ALKNetworkKuramoto extends ALKKuramotoModel {
    constructor(frequencies: number[], alk: ArithmeticLinkKernel, options?: ALKKuramotoOptions);
    readonly effectiveJ: number[][];
    clusteringCoefficient(): number;
    smallWorldCoefficient(): number;
  }

  export function createALKKuramoto(primes: number[], options?: ALKKuramotoOptions): ALKKuramotoModel;
  export function createALKNetworkKuramoto(primes: number[], options?: ALKKuramotoOptions): ALKNetworkKuramoto;
  export function runBorromeanExperiment(primes: number[], options?: object): object;

  // ============================================
  // Default export namespace (matches physics/index.js default)
  // ============================================

  const physicsDefault: {
    Oscillator: typeof Oscillator;
    OscillatorBank: typeof OscillatorBank;
    KuramotoModel: typeof KuramotoModel;
    NetworkKuramoto: typeof NetworkKuramoto;
    AdaptiveKuramoto: typeof AdaptiveKuramoto;
    SakaguchiKuramoto: typeof SakaguchiKuramoto;
    SmallWorldKuramoto: typeof SmallWorldKuramoto;
    MultiSystemCoupling: typeof MultiSystemCoupling;
    createHierarchicalCoupling: typeof createHierarchicalCoupling;
    createPeerCoupling: typeof createPeerCoupling;
    StochasticKuramoto: typeof StochasticKuramoto;
    ColoredNoiseKuramoto: typeof ColoredNoiseKuramoto;
    ThermalKuramoto: typeof ThermalKuramoto;
    gaussianRandom: typeof gaussianRandom;
    PrimeonZLadderU: typeof PrimeonZLadderU;
    createPrimeonLadder: typeof createPrimeonLadder;
    shannonEntropyNats: typeof shannonEntropyNats;
    probsOf: typeof probsOf;
    normalizeComplex: typeof normalizeComplex;
    Complex: typeof Complex;
    ZChannel: typeof ZChannel;
    PrimeonZLadderMulti: typeof PrimeonZLadderMulti;
    createMultiChannelLadder: typeof createMultiChannelLadder;
    createAdiabaticSchedule: typeof createAdiabaticSchedule;
    KuramotoCoupledLadder: typeof KuramotoCoupledLadder;
    createKuramotoLadder: typeof createKuramotoLadder;
    runCollapsePressureExperiment: typeof runCollapsePressureExperiment;
    kuramotoOrderParameter: typeof kuramotoOrderParameter;
    getPhase: typeof getPhase;
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
    ALKKuramotoModel: typeof ALKKuramotoModel;
    ALKNetworkKuramoto: typeof ALKNetworkKuramoto;
    createALKKuramoto: typeof createALKKuramoto;
    createALKNetworkKuramoto: typeof createALKNetworkKuramoto;
    runBorromeanExperiment: typeof runBorromeanExperiment;
    [key: string]: unknown;
  };

  export default physicsDefault;
}
