/**
 * Type definitions for @aleph-ai/tinyaleph/observer
 *
 * Declared against the runtime in observer/index.js and its re-exported
 * modules (smf, prsc, temporal, entanglement, agency, boundary, safety,
 * hqe, symbolic-smf, symbolic-temporal, assays).
 */

declare module '@aleph-ai/tinyaleph/observer' {

  import type { Hypercomplex, PrimeState } from '@aleph-ai/tinyaleph/core';

  // ============================================
  // SMF — Sedenion Memory Field (observer/smf.js)
  // ============================================

  export interface SMFAxis {
    index: number;
    name: string;
    description: string;
  }

  export interface CodebookAttractor {
    id: number;
    type: 'primary' | 'secondary' | 'cross-domain';
    axes: number[];
    state: Float64Array;
  }

  export const SMF_AXES: SMFAxis[];
  export const AXIS_INDEX: Record<string, number>;
  export const SMF_CODEBOOK: CodebookAttractor[];
  export const CODEBOOK_SIZE: 64;

  export function nearestCodebookAttractor(smfState: Float64Array | number[] | { s: Float64Array }): {
    attractor: CodebookAttractor | null;
    index: number;
    similarity: number;
    distance: number;
    axes: number[];
    type: string;
  };
  export function codebookTunnel(smfState: Float64Array | number[] | { s: Float64Array }, targetIdx: number, mixFactor?: number): Float64Array;
  export function getTunnelingCandidates(smfState: Float64Array | number[] | { s: Float64Array }, maxDistance?: number): Array<{
    index: number;
    attractor: CodebookAttractor;
    similarity: number;
    distance: number;
    axes: number[];
    type: string;
  }>;

  export class SedenionMemoryField {
    constructor(components?: Float64Array | number[] | null);
    /** 16-component state (normalized on construction). */
    s: Float64Array;
    static get AXES(): SMFAxis[];
    static get AXIS_INDEX(): Record<string, number>;
    static basis(axis: number | string, value?: number): SedenionMemoryField;
    static uniform(): SedenionMemoryField;
    static fromHypercomplex(hypercomplex: Hypercomplex): SedenionMemoryField;
    static fromSparsePrimeState(sparseState: unknown, options?: object): SedenionMemoryField;
    static fromObject(obj: Record<string, number>): SedenionMemoryField;
    static sequentialCompose(smfs: SedenionMemoryField[], options?: object): SedenionMemoryField;
    toHypercomplex(): Hypercomplex;
    get(axis: number | string): number;
    set(axis: number | string, value: number): this;
    norm(): number;
    normalize(epsilon?: number): this;
    entropy(epsilon?: number): number;
    smfEntropy(epsilon?: number): number;
    multiply(other: SedenionMemoryField): SedenionMemoryField;
    quaternionCompose(other: SedenionMemoryField, options?: { propagation?: number }): SedenionMemoryField;
    extractQuaternion(): { w: number; x: number; y: number; z: number };
    setQuaternion(q: { w: number; x: number; y: number; z: number }, normalizeAfter?: boolean): this;
    nonCommutativity(other: SedenionMemoryField): object;
    conjugate(): SedenionMemoryField;
    inverse(): SedenionMemoryField | null;
    dot(other: SedenionMemoryField): number;
    add(other: SedenionMemoryField): SedenionMemoryField;
    scale(scalar: number): SedenionMemoryField;
    canTunnelTo(other: SedenionMemoryField, threshold?: number): boolean;
    slerp(other: SedenionMemoryField, t: number): SedenionMemoryField;
    updateFromPrimeActivity(primeState: unknown, oscillators: unknown[], options?: { couplingRate?: number }): this;
    computeAxisDeltas(primeState: unknown, oscillators: unknown[], options?: object): Float64Array;
    dominantAxes(n?: number): Array<{ index: number; name: string; value: number; absValue: number }>;
    coherence(other: SedenionMemoryField): number;
    clone(): SedenionMemoryField;
    toArray(): number[];
    toObject(): Record<string, number>;
    toJSON(): object;
    toString(): string;
    nearestCodebook(): object;
    tunnelTo(targetIdx: number, mixFactor?: number): this;
    getTunnelingOptions(maxDistance?: number): object[];
    collapseToNearest(mixFactor?: number): object;
    isNearAttractor(threshold?: number): boolean;
    getCodebookState(): object;
  }

  // ============================================
  // PRSC — Prime Resonance Semantic Computation (observer/prsc.js)
  // ============================================

  export function gaussianRandom(mean?: number, stddev?: number): number;
  export const INT_SINE_M: 256;
  export const INT_SINE_SCALE: 10000;
  export const INT_SINE_TABLE: Int32Array;
  export function intSin(phaseIndex: number): number;
  export function phaseToIndex(phase: number): number;
  export function indexToPhase(index: number): number;
  export function computeHistogramCoherence(phases: number[], numBins?: number): {
    coherence: number;
    maxCount: number;
    maxBin: number;
    maxBinPhase: number;
    entropy: number;
    meanPhase: number;
    binCounts: number[];
    numBins: number;
    numPhases: number;
  };

  export interface PrimeOscillatorOptions {
    frequency?: number;
    phase?: number;
    amplitude?: number;
  }

  export class PrimeOscillator {
    constructor(prime: number, options?: PrimeOscillatorOptions);
    prime: number;
    frequency: number;
    phase: number;
    amplitude: number;
    naturalPhase: number;
    static primeToFrequency(p: number): number;
    excite(amount?: number): void;
    damp(dampRate: number, dt: number): void;
    complexAmplitude(): unknown;
    weightedAmplitude(): number;
    clone(): PrimeOscillator;
    toJSON(): object;
  }

  export interface PRSCLayerOptions {
    speed?: number;
    damp?: number;
    coupling?: number;
    dt?: number;
    thermal?: boolean;
    temperature?: number;
    noiseIntensity?: number;
    noiseType?: 'white' | 'colored';
    correlationTime?: number;
    randomPhase?: boolean;
    initialAmplitude?: number;
    maxHistoryLength?: number;
  }

  export class PRSCLayer {
    constructor(primes: number[] | number, options?: PRSCLayerOptions);
    primes: number[];
    speed: number;
    damp: number;
    K: number;
    dt: number;
    thermal: boolean;
    temperature: number;
    noiseIntensity: number;
    noiseType: string;
    correlationTime: number;
    oscillators: PrimeOscillator[];
    primeToIndex: Map<number, number>;
    coherenceHistory: unknown[];
    maxHistoryLength: number;
    noiseStats: { mean: number; variance: number; sampleCount: number };
    phaseTransitionHistory: unknown[];
    getOscillator(prime: number): PrimeOscillator | null;
    tick(dt?: number | null): number;
    thermalCoupling(osc: PrimeOscillator, idx: number, dt: number): number;
    getNoiseIncrement(idx: number, dt: number): number;
    updateColoredNoise(idx: number, dt: number): number;
    setTemperature(T: number): void;
    orderParameter(): number;
    estimateCriticalTemperature(): number;
    isOrdered(threshold?: number): boolean;
    isNearCritical(tolerance?: number): boolean;
    temperatureSweep(Tmin?: number, Tmax?: number, steps?: number, equilibrationSteps?: number): Array<{ temperature: number; orderParameter: number; coherence: number }>;
    setThermal(enabled: boolean): void;
    getThermalState(): object;
    kuramotoCoupling(osc: PrimeOscillator): number;
    globalCoherence(): number;
    graphCoherence(weights: number[][] | ((i: number, j: number) => number)): number;
    meanPhase(): number;
    excite(primes: number[], amount?: number): void;
    exciteByIndex(indices: number[], amount?: number): void;
    activeCount(threshold?: number): number;
    activePrimes(threshold?: number): number[];
    getAmplitudes(): number[];
    getPhases(): number[];
    getWeightedAmplitudes(): number[];
    toSemanticState(): PrimeState;
    fromSemanticState(state: PrimeState): void;
    totalEnergy(): number;
    amplitudeEntropy(): number;
    reset(randomPhase?: boolean): void;
    getState(): object;
    loadState(state: object): void;
    coherenceTrend(): number;
    clone(): PRSCLayer;
    toJSON(): object;
    resetThermal(): void;
    discreteKuramotoCoupling(osc: PrimeOscillator): number;
    discreteTick(dt?: number | null): object;
    getHistogramCoherence(numBins?: number): object;
    getDiscreteState(): object;
  }

  export class EntanglementDetector {
    constructor(threshold?: number);
    threshold: number;
    strength(osc1: PrimeOscillator, osc2: PrimeOscillator): number;
    isEntangled(osc1: PrimeOscillator, osc2: PrimeOscillator): boolean;
    findEntangledPairs(prsc: PRSCLayer): Array<{ i: number; j: number; primes: [number, number]; strength: number; phaseDiff: number }>;
    buildEntanglementGraph(prsc: PRSCLayer): Map<number, Array<{ prime: number; strength: number }>>;
    detectCoherencePeaks(history: Array<{ coherence: number; time?: number }>, windowSize?: number): Array<{ index: number; time?: number; coherence: number }>;
    detectEnergyTrough(prsc: PRSCLayer, threshold?: number): boolean;
  }

  // ============================================
  // HQE — Holographic Quantum Encoding (observer/hqe.js)
  // ============================================

  export class TickGate {
    constructor(options?: { minTickInterval?: number; coherenceThreshold?: number; maxTickHistory?: number; mode?: 'strict' | 'adaptive' | 'free' });
    tick(): void;
    shouldProcess(coherence: number): boolean;
    getTickRate(): number;
    getStats(): object;
    reset(): void;
    setMode(mode: 'strict' | 'adaptive' | 'free'): void;
  }

  export class StabilizationController {
    constructor(options?: object);
    sigmoid(x: number): number;
    computeHomologyPenalty(state: unknown): number;
    stateToResidues(state: unknown): number[];
    computeLambda(coherence: number): number;
    interpret(lambda: number): string;
    getTrend(): number;
    getStats(): object;
    getHomologyState(): object;
    detectKernel(residues: number[]): boolean;
    reset(): void;
    toJSON(): object;
  }

  export class HolographicEncoder {
    constructor(gridSize?: number, primes?: number, options?: object);
    createField(): unknown;
    computeSpatialFrequencies(): unknown;
    project(state: unknown): unknown;
    reconstruct(field: unknown): unknown;
    reconstructToState(field: unknown): unknown;
    intensity(field: unknown): unknown;
    realPart(field: unknown): unknown;
    phasePattern(field: unknown): unknown;
    clearField(): void;
    superpose(field: unknown): unknown;
    scale(field: unknown, k: number): unknown;
    clone(): HolographicEncoder;
    totalEnergy(field: unknown): number;
    fieldEntropy(field: unknown): number;
    getState(): object;
    loadState(state: object): void;
    evolve(steps: number): unknown;
    tick(): unknown;
    getTickStats(): object;
    setTickMode(mode: string): void;
    getStabilizationStats(): object;
  }

  export class HolographicMemory {
    constructor(gridSize?: number, primes?: number, options?: object);
    store(data: unknown): unknown;
    recall(query: unknown): unknown;
    correlate(query: unknown): unknown[];
    decay(rate: number): void;
    prune(threshold: number): void;
    findSimilar(query: unknown, k?: number): unknown[];
    readonly count: number;
    clear(): void;
    toJSON(): object;
    static fromJSON(data: object): HolographicMemory;
  }

  export class HolographicSimilarity {
    constructor(gridSize?: number, primes?: number);
    similarity(field1: unknown, field2: unknown): number;
    difference(field1: unknown, field2: unknown): number;
  }

  // ============================================
  // Temporal Layer (observer/temporal.js)
  // ============================================

  export class Moment {
    constructor(data?: object);
    id: string;
    timestamp: number;
    clockTime: number;
    trigger: string;
    coherence: number;
    entropy: number;
    phaseTransitionRate: number;
    activePrimes: number[];
    smfSnapshot: unknown;
    semanticContent: unknown;
    subjectiveDuration: number;
    previousMomentId: string | null;
    entangledMomentIds: string[];
    notes: string;
    static generateId(): string;
    toJSON(): object;
    static fromJSON(data: object): Moment;
  }

  export interface TemporalLayerOptions {
    coherenceThreshold?: number;
    entropyMin?: number;
    entropyMax?: number;
    phaseTransitionThreshold?: number;
    beta?: number;
    minMomentInterval?: number;
    maxHistory?: number;
    onMoment?: ((moment: Moment) => void) | null;
  }

  export class TemporalLayer {
    constructor(options?: TemporalLayerOptions);
    coherenceThreshold: number;
    entropyMin: number;
    entropyMax: number;
    phaseTransitionThreshold: number;
    beta: number;
    minMomentInterval: number;
    moments: Moment[];
    currentMoment: Moment | null;
    subjectiveTime: number;
    update(state: object): Moment | null;
    checkMomentConditions(state: object): { triggered: boolean; trigger?: string };
    isCoherencePeak(coherence: number): boolean;
    phaseTransitionRate(): number;
    createMoment(trigger: string, state: object): Moment;
    calculateSubjectiveDuration(state: object): number;
    trimHistories(): void;
    forceMoment(state: object, note?: string): Moment;
    recentMoments(count?: number): Moment[];
    getMoment(id: string): Moment | undefined;
    getMomentChain(startId: string, maxDepth?: number): Moment[];
    getSubjectiveTime(): number;
    timeRatio(): number;
    averageMomentDuration(): number;
    getStats(): object;
    reset(): void;
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  export class TemporalPatternDetector {
    constructor(options?: { windowSize?: number; minPatternLength?: number; maxPatternLength?: number; similarityThreshold?: number });
    patterns: unknown[];
    detectPatterns(moments: Moment[]): unknown[];
    momentSignature(moment: Moment): object;
    matchPattern(pattern: unknown[], other: unknown[]): boolean;
    signaturesMatch(sig1: object, sig2: object): boolean;
    patternStrength(pattern: unknown[], repetition: unknown[]): number;
    deduplicatePatterns(patterns: unknown[]): unknown[];
    predictNext(moments: Moment[]): unknown;
  }

  // ============================================
  // Entanglement Layer (observer/entanglement.js)
  // ============================================

  export class EntangledPair {
    constructor(data?: object);
    prime1: number;
    prime2: number;
    strength: number;
    phaseDiff: number;
    formationTime: number;
    accessCount: number;
    context: unknown;
    readonly tuple: [number, number];
    readonly key: string;
    contains(prime: number): boolean;
    other(prime: number): number | null;
    toJSON(): object;
    static fromJSON(data: object): EntangledPair;
  }

  export class Phrase {
    constructor(data?: object);
    id: string;
    startTime: number;
    endTime: number | null;
    primes: number[];
    entangledPairs: EntangledPair[];
    coherencePeak: number;
    energyAtEnd: number;
    momentIds: string[];
    semanticContent: unknown;
    static generateId(): string;
    readonly duration: number;
    close(energyAtEnd?: number): void;
    addPrime(prime: number): void;
    addEntanglement(pair: EntangledPair): void;
    toJSON(): object;
    static fromJSON(data: object): Phrase;
  }

  export interface EntanglementLayerOptions {
    entanglementThreshold?: number;
    coherencePeakThreshold?: number;
    energyTroughThreshold?: number;
    strengthDecay?: number;
    minStrength?: number;
    maxHistory?: number;
    onPhraseComplete?: ((phrase: Phrase) => void) | null;
    onEntanglement?: ((pair: EntangledPair) => void) | null;
  }

  export class EntanglementLayer {
    constructor(options?: EntanglementLayerOptions);
    entanglementThreshold: number;
    coherencePeakThreshold: number;
    energyTroughThreshold: number;
    strengthDecay: number;
    minStrength: number;
    currentPhrase: Phrase | null;
    phrases: Phrase[];
    entanglementGraph: Map<number, Map<number, EntangledPair>>;
    update(state: object): object;
    startPhrase(coherence: number): void;
    endPhrase(energy: number, semanticContent?: unknown): Phrase | null;
    isCoherencePeak(coherence: number): boolean;
    isEnergyTrough(energy: number): boolean;
    detectEntanglements(oscillators: unknown[]): EntangledPair[];
    computeStrength(osc1: unknown, osc2: unknown): number;
    registerEntanglement(pair: EntangledPair): void;
    decayEntanglements(): void;
    getEntangled(prime: number): EntangledPair[];
    findChain(sourcePrime: number, targetPrime: number, maxDepth?: number): number[] | null;
    getCluster(prime: number, minStrength?: number): number[];
    getMostEntangled(): { prime: number | null; totalStrength: number };
    associativeRecall(cuePrimes: number[], depth?: number): Array<{ prime: number; strength: number }>;
    getStats(): object;
    recentPhrases(count?: number): Phrase[];
    reset(): void;
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  // ============================================
  // Agency Layer (observer/agency.js)
  // ============================================

  export class AttentionFocus {
    constructor(data?: object);
    id: string;
    target: unknown;
    type: string;
    intensity: number;
    startTime: number;
    primes: number[];
    smfAxis: number | null;
    novelty: number;
    relevance: number;
    static generateId(): string;
    readonly duration: number;
    decay(rate?: number): void;
    boost(amount?: number): void;
    toJSON(): object;
  }

  export class Goal {
    constructor(data?: object);
    id: string;
    description: string;
    type: string;
    sourceAxis: string | null;
    targetOrientation: number[] | null;
    priority: number;
    status: string;
    progress: number;
    createdAt: number;
    deadline: number | null;
    subgoals: unknown[];
    parentGoalId: string | null;
    attemptedActions: unknown[];
    static generateId(): string;
    updateProgress(newProgress: number): void;
    achieve(): void;
    abandon(reason?: string): void;
    readonly isActive: boolean;
    readonly age: number;
    toJSON(): object;
    static fromJSON(data: object): Goal;
  }

  export class Action {
    constructor(data?: object);
    id: string;
    type: string;
    description: string;
    targetPrimes: number[];
    targetAxes: string[];
    expectedOutcome: unknown;
    coherenceScore: number;
    utilityScore: number;
    status: string;
    result: unknown;
    goalId: string | null;
    proposedAt: number;
    executedAt: number | null;
    completedAt: number | null;
    static generateId(): string;
    select(): void;
    execute(): void;
    complete(result: unknown): void;
    fail(reason: string): void;
    toJSON(): object;
  }

  export interface AgencyLayerOptions {
    maxFoci?: number;
    maxGoals?: number;
    attentionDecayRate?: number;
    noveltyWeight?: number;
    relevanceWeight?: number;
    intensityWeight?: number;
    axisThresholds?: Record<string, number>;
    onGoalCreated?: ((goal: Goal) => void) | null;
    onActionSelected?: ((action: Action) => void) | null;
    onAttentionShift?: ((event: object) => void) | null;
  }

  export class AgencyLayer {
    constructor(options?: AgencyLayerOptions);
    attentionFoci: AttentionFocus[];
    goals: Goal[];
    actionHistory: Action[];
    currentActions: Action[];
    update(state: object): object;
    updateBaselines(prsc: unknown, smf: unknown): void;
    computePrimeNovelty(prime: number, amplitude: number): number;
    computeSMFNovelty(smf: unknown, axisIndex: number): number;
    updateAttention(state: object): void;
    computeRelevance(prime: number): number;
    addOrUpdateFocus(data: object): void;
    decayAttention(): void;
    checkGoalConditions(smf: unknown, state: object): void;
    idealSMFFor(axis: string): number[];
    maybeCreateGoal(data: object): Goal | null;
    createExternalGoal(description: string, options?: object): Goal | null;
    updateGoalProgress(state: object): void;
    proposeActions(goal: Goal, state: object): Action[];
    getRelatedPrimes(axis: string, state: object): number[];
    selectAction(actions: Action[]): Action | null;
    executeAction(action: Action, executor: (action: Action) => unknown): unknown;
    updateMetacognition(state: object): void;
    logMetacognitive(type: string, description: string): void;
    getTopFocus(): AttentionFocus | null;
    getTopGoal(): Goal | null;
    getStats(): object;
    reset(): void;
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  // ============================================
  // Boundary Layer (observer/boundary.js)
  // ============================================

  export class SensoryChannel {
    constructor(data?: object);
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    currentValue: unknown;
    lastUpdate: number | null;
    updateCount: number;
    associatedPrimes: number[];
    sensitivity: number;
    adaptationRate: number;
    baseline: number;
    static generateId(): string;
    update(value: unknown): object;
    normalize(value: unknown): number | null;
    isActive(timeoutMs?: number): boolean;
    readonly age: number;
    toJSON(): object;
    static fromJSON(data: object): SensoryChannel;
  }

  export class MotorChannel {
    constructor(data?: object);
    static generateId(): string;
    queue(command: unknown): void;
    isReady(): boolean;
    getNext(): unknown;
    readonly queueLength: number;
    toJSON(): object;
  }

  export class EnvironmentalModel {
    constructor(options?: object);
    updateEntity(entity: unknown): void;
    removeEntity(id: unknown): void;
    addRelationship(from: unknown, to: unknown, type: string): void;
    updateContext(context: object): void;
    detectChanges(state: object): unknown[];
    recordChange(change: unknown): void;
    getEntity(id: unknown): unknown;
    getEntitiesByType(type: string): unknown[];
    getRelationships(from: unknown): unknown[];
    decayUncertainty(rate: number): void;
    getRecentChanges(count?: number): unknown[];
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  export class SelfModel {
    constructor(options?: object);
    updateState(state: object): void;
    addContinuityMarker(marker: unknown): void;
    updateSelfOrientation(smf: unknown): void;
    isSelfLike(smf: unknown): boolean;
    smfSimilarity(smf1: unknown, smf2: unknown): number;
    learnAboutSelf(observation: unknown): void;
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  export class ObjectivityGate {
    constructor(options?: object);
    check(origin: string, content: unknown): unknown;
    addDecoder(decoder: unknown): void;
    getStats(): object;
    reset(): void;
    toJSON(): object;
  }

  export class BoundaryLayer {
    constructor(options?: object);
    initializeDefaultChannels(): void;
    addSensoryChannel(channel: SensoryChannel): void;
    addMotorChannel(channel: MotorChannel): void;
    processInput(channelName: string, value: unknown): object;
    queueOutput(channelName: string, command: unknown): void;
    getReadyOutputs(): unknown[];
    classifyOrigin(content: unknown): string;
    updateSelf(state: object): void;
    updateEnvironment(state: object): void;
    getInputPrimes(): number[];
    getStats(): object;
    reset(): void;
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  // ============================================
  // Safety Layer (observer/safety.js)
  // ============================================

  export class SafetyConstraint {
    constructor(data?: object);
    static generateId(): string;
    check(content: unknown): unknown;
    toJSON(): object;
  }

  export class ViolationEvent {
    constructor(data?: object);
    static generateId(): string;
    toJSON(): object;
  }

  export class SafetyMonitor {
    constructor(options?: object);
    update(state: object): void;
    detectIssues(state: object): unknown[];
    updateAlertLevel(level: string): void;
    getRecentAlerts(count?: number): unknown[];
    isSafe(): boolean;
    reset(): void;
  }

  export class SafetyLayer {
    constructor(options?: object);
    initializeDefaultConstraints(): void;
    addConstraint(constraint: SafetyConstraint): void;
    removeConstraint(id: string): void;
    checkConstraints(content: unknown): unknown;
    handleViolation(violation: ViolationEvent): unknown;
    handleLog(violation: ViolationEvent): void;
    handleWarn(violation: ViolationEvent): void;
    handleBlock(violation: ViolationEvent): void;
    handleShutdown(violation: ViolationEvent): void;
    handleCorrect(violation: ViolationEvent): unknown;
    getCorrection(violation: ViolationEvent): unknown;
    isActionPermissible(action: unknown): boolean;
    containsHarmfulContent(text: string): boolean;
    isDeceptive(text: string): boolean;
    resetEmergency(): void;
    getStats(): object;
    getViolationHistory(count?: number): unknown[];
    generateReport(): object;
    reset(): void;
    toJSON(): object;
    loadFromJSON(data: object): void;
  }

  // ============================================
  // Symbolic SMF (observer/symbolic-smf.js)
  // ============================================

  export const AXIS_SYMBOL_MAPPING: Record<string, string[]>;
  export const TAG_TO_AXIS: Record<string, string>;

  export class SymbolicSMF extends SedenionMemoryField {
    constructor(components?: Float64Array | number[] | null, options?: object);
    static fromSMF(smf: SedenionMemoryField, options?: object): SymbolicSMF;
    tagToAxis(tag: string): string | undefined;
    getAxisArchetype(axis: number | string): unknown;
    groundInSymbols(count?: number, category?: string | null): unknown[];
    exciteFromSymbol(symbol: unknown, amount?: number): this;
    categoryToAxis(category: string): number;
    exciteFromSymbols(symbols: unknown[], amount?: number): this;
    exciteFromText(text: string, amount?: number): this;
    createCompoundFromState(): unknown;
    resonanceWithSymbol(symbol: unknown): number;
    findResonantSymbols(count?: number, category?: string | null): unknown[];
    getSymbolStats(): object;
    clearHistory(): void;
    toJSON(): object;
    toString(): string;
  }

  export class SMFSymbolMapper {
    constructor();
    symbolToSMF(symbol: unknown): SymbolicSMF;
    symbolsToSMF(symbols: unknown[]): SymbolicSMF;
    compoundToSMF(compound: unknown): SymbolicSMF;
    sequenceToSMF(sequence: unknown): SymbolicSMF;
    findBestMatch(smf: SedenionMemoryField, category?: string | null): unknown;
    symbolicDistance(smf1: SedenionMemoryField, smf2: SedenionMemoryField): number;
  }

  export const smfMapper: SMFSymbolMapper;
  export function createSymbolicSMF(components?: Float64Array | number[] | null, options?: object): SymbolicSMF;
  export function fromSMF(smf: SedenionMemoryField, options?: object): SymbolicSMF;
  export function symbolToSMF(symbol: unknown): SymbolicSMF;
  export function symbolsToSMF(symbols: unknown[]): SymbolicSMF;

  // ============================================
  // Symbolic Temporal (observer/symbolic-temporal.js)
  // ============================================

  export const PHI: number; // golden ratio
  export const FIRST_64_PRIMES: number[];
  export const HEXAGRAM_ARCHETYPES: Record<string, object>;

  export class SymbolicMoment extends Moment {
    constructor(data?: object);
    toJSON(): object;
    static fromJSON(data: object): SymbolicMoment;
  }

  export class SymbolicTemporalLayer extends TemporalLayer {
    constructor(options?: TemporalLayerOptions);
    createMoment(trigger: string, state: object): SymbolicMoment;
    classifyMoment(moment: SymbolicMoment): string;
    calculateResonances(moment: SymbolicMoment): unknown;
    isPrime(n: number): boolean;
    findRelatedSymbols(primes: number[]): unknown[];
    getHexagramDistribution(moments?: SymbolicMoment[]): unknown;
    getDominantArchetypes(moments?: SymbolicMoment[]): unknown[];
    detectArchetypeSequences(moments?: SymbolicMoment[]): unknown[];
    predictNextArchetype(moments?: SymbolicMoment[]): unknown;
    getIChingReading(moment: SymbolicMoment): unknown;
    getStats(): object;
    reset(): void;
  }

  export class SymbolicPatternDetector extends TemporalPatternDetector {
    constructor(options?: object);
    momentSignature(moment: SymbolicMoment): object;
    signaturesMatch(sig1: object, sig2: object): boolean;
    detectNarrativePatterns(moments: SymbolicMoment[]): unknown[];
    findSequence(moments: SymbolicMoment[], archetype: string): unknown[];
  }

  // ============================================
  // Assays (observer/assays.js)
  // ============================================

  export class TimeDilationAssay {
    constructor(observerCore: unknown);
  }

  export class MemoryContinuityAssay {
    constructor(observerCore: unknown);
  }

  export class AgencyConstraintAssay {
    constructor(observerCore: unknown);
  }

  export class NonCommutativeMeaningAssay {
    constructor(observerCore: unknown);
  }

  export class AssaySuite {
    constructor(observerCore: unknown);
  }

  // ============================================
  // Default export namespace (matches observer/index.js default)
  // ============================================

  const observerDefault: {
    PrimeOscillator: typeof PrimeOscillator;
    PRSCLayer: typeof PRSCLayer;
    EntanglementDetector: typeof EntanglementDetector;
    computeHistogramCoherence: typeof computeHistogramCoherence;
    TickGate: typeof TickGate;
    StabilizationController: typeof StabilizationController;
    HolographicEncoder: typeof HolographicEncoder;
    HolographicMemory: typeof HolographicMemory;
    HolographicSimilarity: typeof HolographicSimilarity;
    SedenionMemoryField: typeof SedenionMemoryField;
    SMF_AXES: SMFAxis[];
    AXIS_INDEX: Record<string, number>;
    Moment: typeof Moment;
    TemporalLayer: typeof TemporalLayer;
    TemporalPatternDetector: typeof TemporalPatternDetector;
    AttentionFocus: typeof AttentionFocus;
    Goal: typeof Goal;
    Action: typeof Action;
    AgencyLayer: typeof AgencyLayer;
    SensoryChannel: typeof SensoryChannel;
    MotorChannel: typeof MotorChannel;
    EnvironmentalModel: typeof EnvironmentalModel;
    SelfModel: typeof SelfModel;
    BoundaryLayer: typeof BoundaryLayer;
    ObjectivityGate: typeof ObjectivityGate;
    EntangledPair: typeof EntangledPair;
    Phrase: typeof Phrase;
    EntanglementLayer: typeof EntanglementLayer;
    SafetyConstraint: typeof SafetyConstraint;
    ViolationEvent: typeof ViolationEvent;
    SafetyMonitor: typeof SafetyMonitor;
    SafetyLayer: typeof SafetyLayer;
    SymbolicSMF: typeof SymbolicSMF;
    SMFSymbolMapper: typeof SMFSymbolMapper;
    smfMapper: SMFSymbolMapper;
    AXIS_SYMBOL_MAPPING: Record<string, string[]>;
    TAG_TO_AXIS: Record<string, string>;
    createSymbolicSMF: typeof createSymbolicSMF;
    fromSMF: typeof fromSMF;
    symbolToSMF: typeof symbolToSMF;
    symbolsToSMF: typeof symbolsToSMF;
    SymbolicMoment: typeof SymbolicMoment;
    SymbolicTemporalLayer: typeof SymbolicTemporalLayer;
    SymbolicPatternDetector: typeof SymbolicPatternDetector;
    HEXAGRAM_ARCHETYPES: Record<string, object>;
    FIRST_64_PRIMES: number[];
    PHI: number;
    TimeDilationAssay: typeof TimeDilationAssay;
    MemoryContinuityAssay: typeof MemoryContinuityAssay;
    AgencyConstraintAssay: typeof AgencyConstraintAssay;
    NonCommutativeMeaningAssay: typeof NonCommutativeMeaningAssay;
    AssaySuite: typeof AssaySuite;
    [key: string]: unknown;
  };

  export default observerDefault;
}
