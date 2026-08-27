/**
 * Type definitions for @aleph-ai/tinyaleph/backends
 *
 * Declared against the runtime in backends/index.js and its re-exported
 * modules. There is NO `process()` method anywhere — the engine drives
 * encode → excite → evolve → decode itself.
 */

/// <reference types="node" />

declare module '@aleph-ai/tinyaleph/backends' {

  import type { Hypercomplex } from '@aleph-ai/tinyaleph/core';

  // ============================================
  // Backend Interface (backends/interface.js)
  // ============================================

  export interface Transform {
    n: string;
    q: number[];
    r: number[];
    name?: string;
    key?: number[];
    priority?: number;
    [key: string]: unknown;
  }

  export interface Token {
    word: string;
    primes: number[];
    known: boolean;
    isStop: boolean;
    position: number;
  }

  export interface BackendConfig {
    dimension?: number;
    vocabulary?: Record<string, number[]>;
    ontology?: Record<number, string>;
    stopWords?: string[];
    transforms?: Transform[];
    axes?: Record<number, number[]>;
    primes?: number[];
    corePrimes?: number[];
    [key: string]: unknown;
  }

  export interface SemanticBackendConfig extends BackendConfig {
    dimension?: number;
    vocabulary?: Record<string, number[]>;
    ontology?: Record<number, string>;
    stopWords?: string[];
    transforms?: Transform[];
    axes?: Record<number, number[]>;
    primes?: number[];
    corePrimes?: number[];
  }

  export class Backend {
    constructor(config: BackendConfig);
    config: BackendConfig;
    dimension: number;

    /** Throws in the base class ('must be implemented'). */
    encode(input: unknown): number[];
    /** Throws in the base class ('must be implemented'). */
    decode(primes: number[]): unknown;
    /** Throws in the base class ('must be implemented'). */
    primesToState(primes: number[]): Hypercomplex;
    /** Throws in the base class ('must be implemented'). */
    primesToFrequencies(primes: number[]): number[];
    /** Throws in the base class ('must be implemented'). */
    applyTransform(inputPrimes: number[], transform: Transform): number[];

    getTransforms(): Transform[];
    getPrimes(): number[];
    getDimension(): number;
    getAxes(): Record<number, number[]> | undefined;
    getName(): string;
    /** Shallow-merges config overrides; returns this (chainable). */
    configure(overrides?: Partial<BackendConfig>): this;
  }

  // ============================================
  // Semantic Backend (backends/semantic/index.js)
  // ============================================

  export interface Codon {
    tokens: Array<Token | number[]>;
    primes: number[];
    position: number;
  }

  export interface ReadingFrame {
    direction: 'forward' | 'reverse';
    offset: number;
    state: Hypercomplex;
    tokens: Token[];
  }

  export interface DualRepresentation {
    sense: Hypercomplex;
    antisense: Hypercomplex;
    magnitude: number;
    coherence: number;
  }

  export interface DNAEncoding {
    tokens: Token[];
    codons: Codon[];
    frames: ReadingFrame[];
    bidirectional: Hypercomplex;
    sixFrame: Hypercomplex;
    sense: Hypercomplex;
    antisense: Hypercomplex;
    magnitude: number;
    coherence: number;
  }

  export interface DNAComparisonResult {
    senseCoherence: number;
    crossCoherence: number;
    combinedScore: number;
  }

  export class SemanticBackend extends Backend {
    constructor(config: SemanticBackendConfig);
    vocabulary: Map<string, number[]>;
    ontology: Record<number, string>;
    transforms: Transform[];
    axes: Record<number, number[]>;
    corePrimes: Set<number>;
    stopWords: Set<string>;

    tokenize(text: string, filterStopWords?: boolean): Token[];
    wordToPrimes(word: string): number[];
    encode(text: string): number[];
    /** Encode WITHOUT stop-word filtering. */
    encodeAll(text: string): number[];
    /** Greedy covering decode. */
    decode(primes: number[]): string;
    primesToMeaning(primes: number[]): string;
    /** Unordered set-based state (DEPRECATED; loses word order). */
    primesToState(primes: number[]): Hypercomplex;
    /** Order-preserving sequential multiplication state. */
    orderedPrimesToState(orderedTokens: Array<Token | number[]>): Hypercomplex;
    primesToHypercomplex(primes: number[]): Hypercomplex;
    applyPositionPhase(h: Hypercomplex, position: number): Hypercomplex;
    encodeOrdered(text: string): Token[];
    textToOrderedState(text: string): Hypercomplex;
    primesToFrequencies(primes: number[]): number[];
    applyTransform(inputPrimes: number[], transform: Transform): number[];
    learn(word: string, primes: number[], confidence?: number): { word: string; primes: number[]; confidence: number };
    getVocabularySize(): number;
    hasWord(word: string): boolean;
    getWordPrimes(word: string): number[] | undefined;
    getOntologyMeaning(prime: number): string | undefined;
    getAxisPrimes(axisIndex: number): number[] | undefined;

    // DNA-inspired processing
    bidirectionalState(tokens: Token[]): Hypercomplex;
    tokensToCodons(tokens: Token[], codonSize?: number): Codon[];
    codonState(text: string, codonSize?: number): Hypercomplex;
    readingFrameStates(tokens: Token[], numFrames?: number): ReadingFrame[];
    sixFrameState(text: string): Hypercomplex;
    dualRepresentation(tokens: Token[]): DualRepresentation;
    dnaEncode(text: string): DNAEncoding;
    dnaCompare(text1: string, text2: string): DNAComparisonResult;
    fallbackCoherence(h1: Hypercomplex, h2: Hypercomplex): number;
  }

  // ============================================
  // Scientific Backend (backends/scientific/index.js)
  // ============================================

  export class ScientificBackend extends Backend {
    constructor(config: BackendConfig);
    physicalConstants: Record<number, string>;
    quantumGates: Record<string, Transform>;
    qubitMap: Record<string, number[]>;

    /** Accepts a qubit-state string ('|0>', '|+>', '|00>', '|Phi+>', ...), |n> ket notation, a number, or an array of qubit states. */
    encode(input: string | number | Array<string | number>): number[];
    /** Returns a qubit-state string like '|0>' (exact inverse of the encoding map). */
    decode(primes: number[]): string;
    qubitToPrimes(qubit: string): number[];
    integerToPrimes(n: number): number[];
    primesToState(primes: number[]): Hypercomplex;
    primesToFrequencies(primes: number[]): number[];
    applyTransform(inputPrimes: number[], transform: Transform): number[];
    applyGate(inputPrimes: number[], gateName: string): number[];
    measure(state: Hypercomplex): { outcome: number; state: string; probability: number };
    interact(particle1Primes: number[], particle2Primes: number[], interactionType?: string): {
      inputParticles: number[][];
      interaction: string;
      outputState: Hypercomplex;
      conserved: number;
    };
    identifyParticle(primes: number[]): string;
    createEntangledPair(type?: string): number[];
    tensorProduct(state1Primes: number[], state2Primes: number[]): number[];
    rotate(inputPrimes: number[], axis: 'x' | 'y' | 'z', angle: number): Hypercomplex;
    rotateState(state: Hypercomplex, axis: 'x' | 'y' | 'z', angle: number): Hypercomplex;
  }

  // ============================================
  // Cryptographic Backend (backends/cryptographic/index.js)
  // ============================================

  export class CryptographicBackend extends Backend {
    constructor(config: BackendConfig);
    keyPrimes: number[];
    transforms: Array<{ n: string; key: number[] }>;
    rounds: number;

    generateKeyPrimes(count: number): number[];
    generateDefaultTransforms(): Array<{ n: string; key: number[] }>;
    encode(input: string | Buffer | Uint8Array): number[];
    decode(primes: number[]): Buffer;
    primesToState(primes: number[]): Hypercomplex;
    primesToFrequencies(primes: number[]): number[];
    applyTransform(inputPrimes: number[], transform: { key?: number[] }): number[];
    hash(input: string | Buffer | Uint8Array, outputLength?: number): Buffer;
    deriveKey(password: string, salt: string, keyLength?: number, iterations?: number): Buffer;
    generateRandomPrimes(count: number): number[];
    mixPrimes(dataPrimes: number[], keyPrimes: number[]): number[];
    hmac(key: string | Buffer | Uint8Array, message: string | Buffer | Uint8Array, outputLength?: number): Buffer;
  }

  // ============================================
  // Bioinformatics Backend (backends/bioinformatics/index.js)
  // ============================================

  const NUCLEOTIDE_PRIMES: Record<string, number>;
  const PRIME_TO_NUCLEOTIDE: Record<number, string>;
  const DNA_COMPLEMENTS: Record<string, string>;
  const PRIME_COMPLEMENTS: Record<number, number>;
  const AMINO_ACID_PRIMES: Record<string, number>;
  const PRIME_TO_AMINO_ACID: Record<number, string>;
  const AMINO_ACID_PROPERTIES: Record<string, object>;
  function encodeCodon(codon: string): number[];
  function decodeCodon(primes: number[]): string;
  function encodeDNA(sequence: string): number[];
  function decodeDNA(primes: number[]): string;
  function encodeRNA(sequence: string): number[];
  function decodeRNA(primes: number[]): string;
  function encodeProtein(sequence: string): number[];
  function decodeProtein(primes: number[]): string;
  function detectSequenceType(sequence: string): string;
  function parseFASTA(text: string): Array<{ header: string; sequence: string }>;
  function getAminoAcidProperties(aa: string): object;
  function getChargeFromPrime(prime: number): number;
  function getHydrophobicityFromPrime(prime: number): number;

  const STANDARD_GENETIC_CODE: Record<string, string>;
  const VERTEBRATE_MITOCHONDRIAL_CODE: Record<string, string>;
  const YEAST_MITOCHONDRIAL_CODE: Record<string, string>;
  const START_CODONS: Record<string, string>;
  const STOP_CODONS: Record<string, string>;
  const CODON_USAGE_ECOLI: Record<string, number>;
  function translateCodon(codon: string): string;
  function getCodonsForAminoAcid(aa: string): string[];
  function getCodonDegeneracy(aa: string): number;
  function isStartCodon(codon: string): boolean;
  function isStopCodon(codon: string): boolean;
  function calculateGCContent(sequence: string): number;
  function calculateCAI(sequence: string): number;
  function getSynonymousCodons(aa: string): string[];
  function classifyMutation(ref: string, mut: string): unknown;

  class BioinformaticsBackend extends Backend {
    constructor(config?: BackendConfig);
    encode(input: string | string[]): number[];
    decode(primes: number[]): string;
    primesToState(primes: number[]): Hypercomplex;
    primesToFrequencies(primes: number[]): number[];
    applyTransform(inputPrimes: number[], transform: Transform): number[];
    getTransforms(): Transform[];
    getPrimes(): number[];
    getName(): string;
    transcribe(sequence: string): string;
    translate(sequence: string): string;
    express(gene: string): string;
    foldProtein(sequence: string): unknown;
    bindingAffinity(protein: string, ligand: string): number;
    dock(protein: string, ligand: string): unknown;
    screenLigands(protein: string, ligands: string[]): unknown[];
    similarity(seq1: string, seq2: string): number;
    align(seq1: string, seq2: string): unknown;
    createDNAStrand(sequence: string): DNAStrand;
    createANDGate(input1: string, input2: string): ANDGate;
    createORGate(input1: string, input2: string): ORGate;
    createNOTGate(input: string): NOTGate;
    createCircuit(gates: unknown[]): DNACircuit;
    simulateStrandDisplacement(reaction: unknown, steps: number): unknown;
    primeToIndex(prime: number): number;
    buildPrimeList(): number[];
    buildTransforms(): Transform[];
    applyMutation(sequence: string, position: number, base: string): string;
    encodeFASTA(fasta: string): unknown;
    getAminoAcidProperties(aa: string): object;
    calculateCAI(sequence: string): number;
    calculateGCContent(sequence: string): number;
  }

  class TranscriptionOperator {
    constructor(options?: object);
    apply(primes: number[]): number[];
    transcribe(dna: string): string;
    complement(seq: string): string;
    reverseComplement(seq: string): string;
    findPattern(seq: string, pattern: string): number;
    findAllPatterns(seq: string, pattern: string): number[];
    findTerminator(seq: string): number;
    entropyDelta(primes: number[]): number;
    addFivePrimeCap(rna: string): string;
    addPolyATail(rna: string): string;
    processmRNA(preMrna: string): string;
    splice(preMrna: string): string;
  }

  class TranslationOperator {
    constructor(options?: object);
    apply(primes: number[]): number[];
    translateCodonPrimes(primes: number[]): string;
    findStartCodon(rna: string): number;
    findAllStartCodons(rna: string): number[];
    isStopCodonPrimes(primes: number[]): boolean;
    entropyDelta(primes: number[]): number;
    translateAllFrames(rna: string): string[];
    findLongestORF(rna: string): string;
    calculateMolecularWeight(protein: string): number;
    calculateIsoelectricPoint(protein: string): number;
    hasSignalPeptide(protein: string): boolean;
  }

  class FoldingTransform {
    constructor(options?: object);
    fold(sequence: string): unknown;
    kuramotoStep(phases: number[], coupling: number): number[];
    computeContactPropensity(residues: string[]): unknown;
    hydrophobicPotential(residues: string[]): unknown;
    electrostaticPotential(residues: string[]): unknown;
    thermalNoise(scale: number): number;
    calculateOrderParameter(phases: number[]): number;
    calculatePhasesEntropy(phases: number[]): number;
    calculateFoldingEnergy(structure: unknown): number;
    phasesToStructure(phases: number[]): unknown;
    classifySecondaryStructure(phases: number[]): string;
    extractContacts(structure: unknown): unknown[];
    assignSecondaryStructure(sequence: string): unknown;
    calculateCompactness(structure: unknown): number;
    estimateFreeEnergy(structure: unknown): number;
    anneal(sequence: string, options?: object): unknown;
  }

  class BindingAffinityCalculator {
    constructor(options?: object);
    computeAffinity(protein: string, ligand: string): number;
    electrostaticInteraction(p1: number, p2: number): number;
    hydrophobicInteraction(p1: number, p2: number): number;
    screenLibrary(protein: string, library: string[]): unknown[];
    findHotspots(protein: string): unknown[];
  }

  class MolecularDocker {
    constructor(options?: object);
    dock(protein: string, ligand: string): unknown;
    computeCrossCoupling(proteinPrimes: number[], ligandPrimes: number[]): number;
    calculateCoherence(phases: number[]): number;
    calculateOrder(phases: number[]): number;
    phasesToPose(phases: number[]): unknown;
    calculateBindingFromPhases(phases: number[]): number;
  }

  class DNAStrand {
    constructor(sequence: string);
    complement(): string;
    reverseComplement(): string;
    bindingAffinity(other: DNAStrand): number;
    estimateMeltingTemp(): number;
    canDisplace(other: DNAStrand): boolean;
    primeProduct(): number;
    readonly length: number;
    toString(): string;
  }

  class DNADuplex {
    constructor(strand1: DNAStrand, strand2: DNAStrand);
    isStable(): boolean;
    readonly primeSignature: string;
  }

  class ANDGate {
    constructor(input1: unknown, input2: unknown);
    evaluate(): boolean;
    evaluatePrimes(inputs: number[][]): boolean;
    primesMatch(primes: number[], target: number[]): boolean;
  }

  class ORGate {
    constructor(input1: unknown, input2: unknown);
    evaluate(): boolean;
    evaluatePrimes(inputs: number[][]): boolean;
    primesMatch(primes: number[], target: number[]): boolean;
  }

  class NOTGate {
    constructor(input: unknown);
    evaluate(): boolean;
    evaluatePrimes(inputs: number[][]): boolean;
    primesMatch(primes: number[], target: number[]): boolean;
  }

  class NANDGate {
    constructor(input1: unknown, input2: unknown);
    evaluate(): boolean;
  }

  class StrandDisplacementReaction {
    constructor(options?: object);
    calculateRate(input: unknown, fuel: unknown): number;
    simulate(steps: number, dt?: number): unknown;
  }

  class DNACircuit {
    constructor();
    addGate(gate: unknown): void;
    connect(from: unknown, to: unknown): void;
    setInput(name: string, value: unknown): void;
    evaluate(): unknown;
    getGateInputs(gate: unknown): unknown[];
    topologicalSort(): unknown[];
    toPrimeCircuit(): unknown;
  }

  class SeesawGate {
    constructor(options?: object);
    evaluate(): boolean;
  }

  /** Default export of backends/bioinformatics/index.js (module namespace object). */
  export const bioinformatics: {
    BioinformaticsBackend: typeof BioinformaticsBackend;
    TranscriptionOperator: typeof TranscriptionOperator;
    TranslationOperator: typeof TranslationOperator;
    FoldingTransform: typeof FoldingTransform;
    BindingAffinityCalculator: typeof BindingAffinityCalculator;
    MolecularDocker: typeof MolecularDocker;
    ProteinProteinDocker: typeof MolecularDocker;
    DNAStrand: typeof DNAStrand;
    DNADuplex: typeof DNADuplex;
    ANDGate: typeof ANDGate;
    ORGate: typeof ORGate;
    NOTGate: typeof NOTGate;
    NANDGate: typeof NANDGate;
    SeesawGate: typeof SeesawGate;
    StrandDisplacementReaction: typeof StrandDisplacementReaction;
    DNACircuit: typeof DNACircuit;
    NUCLEOTIDE_PRIMES: Record<string, number>;
    PRIME_TO_NUCLEOTIDE: Record<number, string>;
    DNA_COMPLEMENTS: Record<string, string>;
    PRIME_COMPLEMENTS: Record<number, number>;
    AMINO_ACID_PRIMES: Record<string, number>;
    PRIME_TO_AMINO_ACID: Record<number, string>;
    AMINO_ACID_PROPERTIES: Record<string, object>;
    encodeCodon: (codon: string) => number[];
    decodeCodon: (primes: number[]) => string;
    encodeDNA: (sequence: string) => number[];
    decodeDNA: (primes: number[]) => string;
    encodeRNA: (sequence: string) => number[];
    decodeRNA: (primes: number[]) => string;
    encodeProtein: (sequence: string) => number[];
    decodeProtein: (primes: number[]) => string;
    detectSequenceType: (sequence: string) => string;
    parseFASTA: (text: string) => Array<{ header: string; sequence: string }>;
    getAminoAcidProperties: (aa: string) => object;
    getChargeFromPrime: (prime: number) => number;
    getHydrophobicityFromPrime: (prime: number) => number;
    STANDARD_GENETIC_CODE: Record<string, string>;
    VERTEBRATE_MITOCHONDRIAL_CODE: Record<string, string>;
    YEAST_MITOCHONDRIAL_CODE: Record<string, string>;
    START_CODONS: Record<string, string>;
    STOP_CODONS: Record<string, string>;
    CODON_USAGE_ECOLI: Record<string, number>;
    translateCodon: (codon: string) => string;
    getCodonsForAminoAcid: (aa: string) => string[];
    getCodonDegeneracy: (aa: string) => number;
    isStartCodon: (codon: string) => boolean;
    isStopCodon: (codon: string) => boolean;
    calculateGCContent: (sequence: string) => number;
    calculateCAI: (sequence: string) => number;
    getSynonymousCodons: (aa: string) => string[];
    classifyMutation: (ref: string, mut: string) => unknown;
    [key: string]: unknown;
  };

  // ============================================
  // Default export namespace (matches backends/index.js default)
  // ============================================

  const backendsDefault: {
    Backend: typeof Backend;
    SemanticBackend: typeof SemanticBackend;
    CryptographicBackend: typeof CryptographicBackend;
    ScientificBackend: typeof ScientificBackend;
    BioinformaticsBackend: typeof BioinformaticsBackend;
    TranscriptionOperator: typeof TranscriptionOperator;
    TranslationOperator: typeof TranslationOperator;
    FoldingTransform: typeof FoldingTransform;
    BindingAffinityCalculator: typeof BindingAffinityCalculator;
    MolecularDocker: typeof MolecularDocker;
    DNAStrand: typeof DNAStrand;
    DNADuplex: typeof DNADuplex;
    ANDGate: typeof ANDGate;
    ORGate: typeof ORGate;
    NOTGate: typeof NOTGate;
    NANDGate: typeof NANDGate;
    DNACircuit: typeof DNACircuit;
    StrandDisplacementReaction: typeof StrandDisplacementReaction;
    bioinformatics: typeof bioinformatics;
    [key: string]: unknown;
  };

  export default backendsDefault;
}
