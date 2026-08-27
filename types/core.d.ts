/**
 * Type definitions for @aleph-ai/tinyaleph/core
 *
 * Declared against the runtime in core/index.js and its re-exported modules.
 * Every named export below is a named export of core/index.js; symbols that
 * live only on the default-export namespace object are members of
 * `enochian`, `enochianVocabulary` or the default export below.
 */

declare module '@aleph-ai/tinyaleph/core' {

  // ============================================
  // Hypercomplex Algebra (core/hypercomplex.js)
  // ============================================

  /**
   * Generic Cayley-Dickson algebra of dimension 2^n.
   * Dimension 2: complex, 4: quaternions, 8: octonions, 16: sedenions, ...
   */
  export class Hypercomplex {
    constructor(dim: number, components?: Float64Array | null);

    /** Dimension of the algebra (must be a power of 2). */
    dim: number;
    /** Component array. */
    c: Float64Array;
    /** Backwards-compatibility getter; returns `c`. */
    readonly components: Float64Array;

    // Static factory methods
    static zero(dim: number): Hypercomplex;
    static basis(dim: number, index: number, value?: number): Hypercomplex;
    static fromReal(dim: number, real: number): Hypercomplex;
    static fromArray(arr: ArrayLike<number>): Hypercomplex;
    static fromAxisAngle(dim: number, axis: number[], angle: number): Hypercomplex;
    static rotationBetween(dim: number, from: number[], to: number[]): Hypercomplex;

    // Arithmetic
    add(other: Hypercomplex): Hypercomplex;
    sub(other: Hypercomplex): Hypercomplex;
    subtract(other: Hypercomplex): Hypercomplex; // alias for sub()
    scale(k: number): Hypercomplex;
    mul(other: Hypercomplex): Hypercomplex; // Cayley-Dickson multiplication via table lookup
    conjugate(): Hypercomplex;

    /**
     * Multiplicative inverse. THROWS for dim >= 16 (sedenions and higher
     * Cayley-Dickson algebras have zero divisors).
     */
    inverse(): Hypercomplex;

    // Metrics
    norm(): number;
    normalize(): Hypercomplex;
    dot(other: Hypercomplex): number;

    // Information theory
    entropy(): number;
    coherence(other: Hypercomplex): number;
    isZeroDivisorWith(other: Hypercomplex): boolean;
    dominantAxes(n?: number): Array<{ i: number; v: number }>;

    // Advanced operations
    scalar(): number;
    vector(): Hypercomplex;
    vectorNorm(): number;
    exp(): Hypercomplex;
    log(): Hypercomplex;
    pow(n: number): Hypercomplex;
    powInt(n: number): Hypercomplex;
    sqrt(): Hypercomplex;
    slerp(other: Hypercomplex, t: number): Hypercomplex;
    nlerp(other: Hypercomplex, t: number): Hypercomplex;
    squad(a: Hypercomplex, b: Hypercomplex, q2: Hypercomplex, t: number): Hypercomplex;
    squadControlPoint(q0: Hypercomplex, q2: Hypercomplex): Hypercomplex;
    sandwich(v: Hypercomplex): Hypercomplex;
    rotateVector(vec: number[]): number[];
    toAxisAngle(): { axis: number[]; angle: number };
    angle(): number;
    isUnit(tolerance?: number): boolean;
    lerp(other: Hypercomplex, t: number): Hypercomplex;

    // Serialization
    toArray(): number[];
    clone(): Hypercomplex;
    toString(): string;
  }

  // ============================================
  // Prime Utilities (core/prime.js)
  // ============================================

  export function primeGenerator(start?: number): Generator<number>;
  export function nthPrime(n: number): number;
  export function primesUpTo(max: number): number[];
  export function isPrime(n: number): boolean;

  /** Prime factorization as { prime: exponent } (e.g. 12 -> { 2: 2, 3: 1 }). */
  export function factorize(n: number): Record<number, number>;

  /** Sorted, comma-joined prime signature string (e.g. "2,3,5"). */
  export function primeSignature(primes: number[]): string;

  export function firstNPrimes(n: number): number[];
  export function primeToFrequency(p: number, base?: number, logScale?: number): number;
  export function primeToAngle(p: number): number;
  export function sumOfTwoSquares(p: number): [number, number] | null;
  export const DEFAULT_PRIMES: number[]; // first 100 primes

  export class GaussianInteger {
    constructor(real: number, imag: number);
    real: number;
    imag: number;
    norm(): number;
    add(other: GaussianInteger): GaussianInteger;
    mul(other: GaussianInteger): GaussianInteger;
    conjugate(): GaussianInteger;
    isGaussianPrime(): boolean;
    toString(): string;
  }

  export class EisensteinInteger {
    constructor(a: number, b: number); // a + b*w, w = e^(2*pi*i/3)
    a: number;
    b: number;
    norm(): number;
    add(other: EisensteinInteger): EisensteinInteger;
    mul(other: EisensteinInteger): EisensteinInteger;
    conjugate(): EisensteinInteger;
    isEisensteinPrime(): boolean;
    toString(): string;
  }

  // ============================================
  // Fano Plane / Multiplication Tables (core/fano.js)
  // ============================================

  export const FANO_LINES: number[][];

  /** Returns an [index, sign] TUPLE. */
  export function octonionMultiplyIndex(i: number, j: number): [number, number];

  /** Returns an [index, sign] TUPLE. */
  export function sedenionMultiplyIndex(i: number, j: number): [number, number];

  /** Generic multiplication lookup. NOTE the argument order: (dim, i, j). */
  export function multiplyIndices(dim: number, i: number, j: number): [number, number];

  /** Full multiplication table of [index, sign] tuples. */
  export function buildMultiplicationTable(dim: number): [number, number][][];

  // ============================================
  // LLM Client (core/llm.js) — exported as a plain OBJECT, not a class
  // ============================================

  export interface LLMChatMessage {
    role: string;
    content: string;
  }

  export interface LLMChatOptions {
    temperature?: number;
    jsonSchema?: object | null;
    maxTokens?: number;
  }

  export interface LLMChatResult {
    content: string | unknown; // parsed object when jsonSchema requested
    usage: object;
    raw: object;
  }

  export interface LLMClient {
    chat(messages: LLMChatMessage[], options?: LLMChatOptions): Promise<LLMChatResult>;
    complete(prompt: string, options?: LLMChatOptions): Promise<string>;
    ask(system: string, user: string, options?: LLMChatOptions): Promise<string>;
    configure(cfg?: { baseUrl?: string; model?: string }): void;
    ping(): Promise<boolean>;
    getConfig(): { baseUrl: string; model: string };
  }

  export const LLM: LLMClient;

  // ============================================
  // Prime Hilbert Space (core/hilbert.js)
  // ============================================

  export class Complex {
    constructor(re?: number, im?: number);
    re: number;
    im: number;
    static fromPolar(magnitude: number, phase: number): Complex;
    static zero(): Complex;
    static one(): Complex;
    static i(): Complex;
    add(other: Complex): Complex;
    sub(other: Complex): Complex;
    mul(other: Complex): Complex;
    scale(k: number): Complex;
    conj(): Complex;
    norm2(): number;
    norm(): number;
    phase(): number;
    normalize(): Complex;
    exp(): Complex;
    toString(): string;
  }

  export class PrimeState {
    constructor(primes?: number[] | null, maxPrime?: number);
    primes: number[];
    maxPrime: number;
    primeToIndex: Map<number, number>;
    indexToPrime: Map<number, number>;
    amplitudes: Map<number, Complex>;
    static basis(p: number, primes?: number[] | null): PrimeState;
    static uniform(primes?: number[] | null): PrimeState;
    static composite(n: number, primes?: number[] | null): PrimeState;
    get(p: number): Complex;
    set(p: number, amplitude: Complex): this;
    add(other: PrimeState): PrimeState;
    scale(c: Complex | number): PrimeState;
    inner(other: PrimeState): Complex;
    norm(): number;
    normalize(): PrimeState;
    entropy(): number;
    /** |<φ|ψ>|² */
    coherence(other: PrimeState): number;
    /** Returns { p, amp } where amp is the amplitude NORM (a number). */
    dominant(n?: number): Array<{ p: number; amp: number }>;
    /** Born-rule measurement: returns { prime, probability }. */
    measure(): { prime: number; probability: number };
    toArray(): Array<{ prime: number; amplitude: Complex; probability: number }>;
    clone(): PrimeState;
  }

  /**
   * Resonance operators from the paper — a plain OBJECT of operator
   * functions, not a class.
   */
  export const ResonanceOperators: {
    /** Prime operator: P|p> = p|p>. */
    P(state: PrimeState): PrimeState;
    /** Factorization operator. */
    F(state: PrimeState): PrimeState;
    /** Resonance operator: R(n)|p> = e^(2*pi*i*log_p(n)) |p>. */
    R(n: number): (state: PrimeState) => PrimeState;
    /** Coupling operator: C(n) mixes amplitudes with phase coupling. */
    C(n: number): (state: PrimeState) => PrimeState;
    /** Hadamard-like superposition operator. */
    H(state: PrimeState): PrimeState;
  };

  export class EntropyDrivenEvolution {
    constructor(state: PrimeState, options?: { lambda?: number; rStable?: number; dt?: number });
    state: PrimeState;
    lambda: number;
    rStable: number;
    dt: number;
    time: number;
    entropyIntegral: number;
    history: Array<{ time: number; entropy: number; entropyIntegral: number; dominant: Array<{ p: number; amp: number }> }>;
    step(): PrimeState;
    evolveUntilCollapse(maxSteps?: number): PrimeState;
    getHistory(): Array<{ time: number; entropy: number; entropyIntegral: number }>;
  }

  export function encodeMemory(text: string, primes?: number[] | null): PrimeState;
  export function symbolicCompute(inputStates: PrimeState[], maxIterations?: number, coherenceThreshold?: number): {
    result: PrimeState;
    iterations: number;
    finalEntropy: number;
    dominant: Array<{ p: number; amp: number }>;
  } | null;

  // Extended classes
  export class QuaternionPrime {
    constructor(a?: number, b?: number, c?: number, d?: number);
    static fromPrime(p: number): QuaternionPrime;
    static fromAngle(angle: number): QuaternionPrime;
    add(other: QuaternionPrime): QuaternionPrime;
    mul(other: QuaternionPrime): QuaternionPrime;
    scale(k: number): QuaternionPrime;
    conj(): QuaternionPrime;
    norm(): number;
    normalize(): QuaternionPrime;
  }

  export class PrimeResonanceIdentity {
    constructor(signature: string, hash: string);
    static random(): PrimeResonanceIdentity;
    static fromSeed(seed: number): PrimeResonanceIdentity;
    entanglementStrength(other: PrimeResonanceIdentity): number;
    coherence(other: PrimeResonanceIdentity): number;
  }

  export class PhaseLockedRing {
    constructor(primes: number[]);
    tick(): void;
    orderParameter(): number;
    meanPhase(): number;
    toPrimeState(): PrimeState;
  }

  export class HolographicField {
    constructor(width: number, height: number);
    encodeState(state: PrimeState): void;
    maxIntensity(): number;
    findPeaks(): Array<{ x: number; y: number; intensity: number }>;
    decodeAt(x: number, y: number): number;
    clear(): void;
  }

  export class EntangledNode {
    constructor(id: number);
    entangleWith(other: EntangledNode, strength?: number): void;
    tick(): void;
    storeMemory(key: string, value: unknown): void;
    recallMemory(key: string): unknown;
    getEntanglementStrength(other: EntangledNode): number;
  }

  export class ResonantFragment {
    constructor(state: PrimeState);
    static fromText(text: string, primes?: number[] | null): ResonantFragment;
    static fromPrimes(primes: number[]): ResonantFragment;
    readonly entropy: number;
    dominant(k?: number): Array<{ p: number; amp: number }>;
    tensorWith(other: ResonantFragment): ResonantFragment;
    rotatePhase(angle: number): ResonantFragment;
    coherenceWith(other: ResonantFragment): number;
    clone(): ResonantFragment;
  }

  // Constants (PHI comes from core/resonance.js; DELTA_S from core/hilbert.js)
  export const PHI: number;    // golden ratio
  export const DELTA_S: number;

  // ============================================
  // Number Theory (core/hilbert.js re-exports)
  // ============================================

  export function vonMangoldt(n: number): number;
  export function liouvilleFunction(n: number): number;
  export function divisorCount(n: number): number;
  export function dirichletCharacter(n: number, d: number): number;
  export function jacobiSymbol(n: number, m: number): number;
  export function principalCharacter(n: number, d: number): number;
  export function generateDirichletCharacters(d: number): Array<(n: number) => number>;
  export function findPrimitiveRoot(p: number): number;
  export function modPow(a: number, b: number, n: number): number;
  export function discreteLog(n: number, g: number, p: number): number | null;
  /** Modular inverse from core/hilbert.js (re-exported as `hilbertModInverse`). */
  export function hilbertModInverse(a: number, m: number): number | null;
  export function gcd(a: number, b: number): number;

  // ============================================
  // Arithmetic Link Kernel (core/arithmetic-link-kernel.js)
  // ============================================

  export class LegendreSymbol {
    /** Legendre symbol (a/p): -1, 0, or +1. Throws for non-prime / even denominators. */
    static compute(a: number, p: number): number;
    static computeReciprocity(a: number, p: number): number;
    static toCoupling(symbol: number, encoding?: 'bipolar' | 'binary' | 'phase' | 'unit'): number;
    static computeCouplingMatrix(primes: number[], encoding?: 'bipolar' | 'binary' | 'phase' | 'unit'): number[][];
  }

  export class PowerResidueSymbol {
    static compute(a: number, p: number, n: number): number;
    static findPrimitiveRoot(p: number): number;
    static computeCouplingMatrix(primes: number[], n: number): number[][];
  }

  export interface RedeiSymbolResult {
    value: number;
    computed: boolean;
    directional: true;
    approximate: true;
    method?: string;
    reason?: string;
    sqrt_p1_mod_p2?: number;
    note?: string;
  }

  export class RedeiSymbol {
    static isComputable(p1: number, p2: number, p3: number): { computable: boolean; reason?: string };
    /**
     * Directional heuristic for the Redei symbol. Honest markers:
     * `computed: true`, `directional: true`, `approximate: true` on success;
     * `computed: false`, `reason`, `directional: true`, `approximate: true`
     * when not computable.
     */
    static redeiDirectionalSymbol(p1: number, p2: number, p3: number): RedeiSymbolResult;
    /** Deprecated alias for redeiDirectionalSymbol (adds `deprecated: true`). */
    static compute(p1: number, p2: number, p3: number): RedeiSymbolResult & { deprecated?: boolean };
    /** Tonelli-Shanks square root mod p; null if n is not a quadratic residue. */
    static sqrtMod(n: number, p: number): number | null;
    static computeCouplingTensor(primes: number[]): number[][][];
  }

  export class ArithmeticMilnorInvariant {
    constructor(primes: number[], ell?: number, e?: number);
    compute(indices: number[]): number;
    getAllInvariants(): Record<string, number>;
  }

  export class MultipleResidueSymbol {
    static compute(values: number[], p: number): number;
  }

  export class ArithmeticLinkKernel {
    constructor(primes: number[], options?: object);
    r: number;
    primes: number[];
    readonly J: number[][];
    readonly Jsym: number[][];
    readonly K3: number[][][];
    getCoupling(i: number, j: number): number;
    getTriadicCoupling(i: number, j: number, k: number): number;
    getKn(indices: number[]): number;
    findBorromeanTriples(): Array<[number, number, number]>;
    isBorromean(p1: number, p2: number, p3: number): boolean;
    buildHamiltonian(): unknown;
    toJSON(): object;
    static fromJSON(data: object): ArithmeticLinkKernel;
    readonly stats: object;
  }

  export const ALKOperators: object;
  export function findBorromeanPrimes(primes: number[], maxResults?: number): Array<[number, number, number]>;
  export function computeLegendreMatrix(primes: number[], encoding?: string): number[][];
  export function quickBorromeanCheck(p1: number, p2: number, p3: number): boolean;
  export function redeiDirectionalSymbol(p1: number, p2: number, p3: number): RedeiSymbolResult;

  // ============================================
  // Alexander Modules (core/alexander-module.js)
  // ============================================

  /** Laurent polynomial ring Z[t, t^-1]. Coefficients keyed by power. */
  export class LaurentPolynomial {
    constructor(coeffs?: Record<number, number>);
    get(power: number): number;
    set(power: number, value: number): void;
    readonly minPower: number;
    readonly maxPower: number;
    readonly degree: number;
    readonly isZero: boolean;
    add(other: LaurentPolynomial): LaurentPolynomial;
    subtract(other: LaurentPolynomial): LaurentPolynomial;
    multiply(other: LaurentPolynomial): LaurentPolynomial;
    scale(k: number): LaurentPolynomial;
    evaluate(t: number): number;
    evaluateOnCircle(theta: number): number;
    normalize(): LaurentPolynomial;
    clone(): LaurentPolynomial;
    toString(): string;
    static fromRoots(roots: number[]): LaurentPolynomial;
    static augmentationGenerator(): LaurentPolynomial;
  }

  export class FittingIdeal {
    constructor(degree: number, generators?: LaurentPolynomial[]);
    readonly isTrivial: boolean;
    readonly isZero: boolean;
    readonly primaryGenerator: LaurentPolynomial | null;
    readonly characteristicPolynomial: number[];
    evaluateOnCircle(theta: number): number;
    findCircleZeros(count?: number): number[];
    readonly signatureHash: string;
  }

  export class CrowellSequence {
    constructor(groupData: object);
    readonly NabelianModule: unknown;
    readonly alexanderModule: unknown;
    readonly augmentationIdeal: unknown;
    verifyExactness(): boolean;
    getSplitting(): boolean;
  }

  /**
   * Complete Alexander module.
   *
   * Approximate heuristic — NOT the standard Alexander invariant. The
   * "Alexander polynomial" and signature are prime-derived heuristics and
   * are marked `approximate: true` where returned.
   */
  export class AlexanderModule {
    constructor(primes: number[], options?: { ell?: number; field?: string });
    primes: number[];
    r: number;
    ell: number;
    field: string;
    readonly crowellSequence: CrowellSequence;
    readonly alexanderPolynomial: LaurentPolynomial & { approximate: true };
    readonly signature: ModuleSignature;
    computeFittingIdeal(degree: number): FittingIdeal;
    getAllFittingIdeals(): Map<number, FittingIdeal>;
    static equivalentSignatures(a: ModuleSignature, b: ModuleSignature): boolean;
    toJSON(): object;
    static fromJSON(data: object): AlexanderModule;
    readonly stats: object;
  }

  export class ModuleSignature {
    constructor(module: AlexanderModule);
    readonly data: object;
    readonly hash: string;
    readonly primes: number[];
    readonly alexanderPolynomial: object;
    readonly fingerprint: string;
    distanceTo(other: ModuleSignature): number;
    isEquivalentTo(other: ModuleSignature): boolean;
    toString(): string;
    toMemoryEntry(): object;
  }

  export class SignatureMemory {
    constructor();
    store(signature: ModuleSignature): void;
    get(hash: string): ModuleSignature | undefined;
    has(hash: string): boolean;
    findByPrime(prime: number): ModuleSignature[];
    findClosest(signature: ModuleSignature): ModuleSignature | null;
    findEquivalent(signature: ModuleSignature): ModuleSignature | null;
    getAll(): ModuleSignature[];
    readonly stats: object;
    clear(): void;
    toJSON(): object;
    static fromJSON(data: object): SignatureMemory;
  }

  export class SignatureExtractor {
    constructor(options?: object);
    extract(primes: number[], options?: object): ModuleSignature;
    extractBatch(primeSets: number[][], options?: object): ModuleSignature[];
    findResonant(primes: number[]): ModuleSignature | null;
    getAlignmentTarget(primes: number[]): unknown;
    clearCache(): void;
    readonly stats: object;
  }

  export function createAlexanderModule(primes: number[], options?: object): AlexanderModule;
  export function extractSignature(primes: number[], options?: object): ModuleSignature;
  export function createSignatureMemory(): SignatureMemory;
  export function createSignatureExtractor(options?: object): SignatureExtractor;

  // ============================================
  // Atlas of Resonance Classes (core/atlas)
  // ============================================

  export class Label {
    constructor(e1: number, e2: number, e3: number, d45: number, e6: number, e7: number);
    mirror(): Label;
    isUnity(): boolean;
    toString(): string;
    static fromString(s: string): Label;
  }

  export class Atlas {
    constructor();
    readonly numVertices: number;
    readonly numEdges: number;
    degree(v: number): number;
    neighbors(v: number): number[];
    getLabel(v: number): Label;
    getMirror(v: number): number;
    isAdjacent(a: number, b: number): boolean;
    isMirrorPair(a: number, b: number): boolean;
    getUnityPositions(): number[];
  }

  export const ATLAS: Atlas;

  export class E8RootSystem {
    constructor();
    readonly numRoots: number;
    getRoot(i: number): number[];
    getNegation(i: number): number;
    innerProduct(i: number, j: number): number;
    getSimpleRoots(): number[][];
  }

  export const E8: E8RootSystem;

  // ============================================
  // Formal Type System (core/types.js)
  // ============================================

  export class Term {
    constructor(type: string);
    type: string;
    isWellFormed(): boolean;
    signature(): string;
    clone(): Term;
    toString(): string;
  }

  export class NounTerm extends Term {
    constructor(prime: number);
    prime: number;
    interpret(): unknown;
    equals(other: Term): boolean;
    toJSON(): object;
    static fromJSON(data: object): NounTerm;
  }

  export class AdjTerm extends Term {
    constructor(prime: number);
    prime: number;
    canApplyTo(term: Term): boolean;
    apply(term: Term): Term;
    equals(other: Term): boolean;
    toJSON(): object;
    static fromJSON(data: object): AdjTerm;
  }

  export class ChainTerm extends Term {
    constructor(operators: PrimeOperator[], noun: Term);
    operators: PrimeOperator[];
    noun: Term;
    prepend(op: PrimeOperator): ChainTerm;
    readonly length: number;
    getAllPrimes(): number[];
    toJSON(): object;
    static fromJSON(data: object): ChainTerm;
  }

  export class FusionTerm extends Term {
    constructor(p: number, q: number, r: number);
    p: number;
    q: number;
    r: number;
    getFusedPrime(): number;
    toNounTerm(): NounTerm;
    canonical(): FusionTerm;
    toJSON(): object;
    static fromJSON(data: object): FusionTerm;
    static findTriads(primes: number[]): Array<[number, number, number]>;
  }

  export class SentenceTerm extends Term {}

  export class NounSentence extends SentenceTerm {
    constructor(nounExpr: Term);
    getDiscourseState(): unknown;
    toJSON(): object;
  }

  export class SeqSentence extends SentenceTerm {
    constructor(left: SentenceTerm, right: SentenceTerm);
  }

  export class ImplSentence extends SentenceTerm {
    constructor(antecedent: SentenceTerm, consequent: SentenceTerm);
  }

  export class TypingContext {
    constructor();
    bind(name: string, term: Term, type: Term): void;
    getType(name: string): Term | undefined;
    getTerm(name: string): Term | undefined;
    has(name: string): boolean;
    clone(): TypingContext;
    toString(): string;
  }

  export class TypingJudgment {
    constructor(context: TypingContext, term: Term, type: Term);
    isValid(): boolean;
    toString(): string;
  }

  export class TypeChecker {
    constructor();
    inferType(term: Term, context?: TypingContext): Term;
    checkType(term: Term, type: Term, context?: TypingContext): boolean;
    derive(term: Term, context?: TypingContext): Term;
    checkApplication(fn: Term, arg: Term): boolean;
    checkFusion(term: FusionTerm): boolean;
  }

  export function N(prime: number): NounTerm;
  export function A(prime: number): AdjTerm;
  export function FUSE(p: number, q: number, r: number): FusionTerm;
  export function CHAIN(operators: PrimeOperator[], noun: Term): ChainTerm;
  export function SENTENCE(expr: Term): SentenceTerm;
  export function SEQ(s1: SentenceTerm, s2: SentenceTerm): SeqSentence;
  export function IMPL(s1: SentenceTerm, s2: SentenceTerm): ImplSentence;

  // ============================================
  // Reduction Semantics (core/reduction.js)
  // ============================================

  export class PrimeOperator {
    canApply(term: Term): boolean;
    apply(term: Term): Term;
    readonly name: string;
  }

  export class NextPrimeOperator extends PrimeOperator {}
  export class ModularPrimeOperator extends PrimeOperator {}
  export class ResonancePrimeOperator extends PrimeOperator {}
  export class IdentityPrimeOperator extends PrimeOperator {}
  export const DEFAULT_OPERATOR: PrimeOperator;

  export class ReductionStep {
    toString(): string;
  }

  export class ReductionTrace {
    addStep(step: ReductionStep): void;
    readonly length: number;
    readonly normalized: boolean;
    toString(): string;
  }

  export class ReductionSystem {
    step(term: Term): ReductionStep | null;
    normalize(term: Term): Term;
    evaluate(term: Term): Term;
    equivalent(t1: Term, t2: Term): boolean;
  }

  export class FusionCanonicalizer {
    getTriads(primes: number[]): Array<[number, number, number]>;
    resonanceScore(p: number, q: number, r: number): number;
    selectCanonical(fusions: FusionTerm[]): FusionTerm | null;
    canonicalFusion(term: FusionTerm): FusionTerm;
  }

  export class NormalFormVerifier {
    verify(term: Term): boolean;
    certificate(term: Term): object;
  }

  export function isNormalForm(term: Term): boolean;
  export function isReducible(term: Term): boolean;
  export function termSize(term: Term): number;
  export function demonstrateStrongNormalization(term: Term, reducer?: ReductionSystem | null): object;
  export function testLocalConfluence(reducer?: ReductionSystem | null): boolean;

  // ============================================
  // Lambda Calculus (core/lambda.js)
  // ============================================

  export class LambdaExpr {
    getType(): string | null;
    toString(): string;
    isValue(): boolean;
    substitute(name: string, value: LambdaExpr): LambdaExpr;
    freeVars(): Set<string>;
    alphaEquals(other: LambdaExpr): boolean;
  }

  export class VarExpr extends LambdaExpr {
    constructor(name: string, type?: string | null);
    name: string;
  }

  export class ConstExpr extends LambdaExpr {
    constructor(value: unknown);
    value: unknown;
  }

  export class LamExpr extends LambdaExpr {
    constructor(param: string, body: LambdaExpr, paramType?: string | null);
    freshVar(avoid: Set<string>): string;
  }

  export class AppExpr extends LambdaExpr {
    constructor(func: LambdaExpr, arg: LambdaExpr);
  }

  export class PairExpr extends LambdaExpr {
    constructor(left: LambdaExpr, right: LambdaExpr);
  }

  export class ImplExpr extends LambdaExpr {
    constructor(antecedent: LambdaExpr, consequent: LambdaExpr);
  }

  export class PrimOpExpr extends LambdaExpr {
    constructor(op: string, left: LambdaExpr, right: LambdaExpr);
  }

  export class Translator {
    constructor(operator?: PrimeOperator);
    freshVar(avoid: Set<string>): string;
    translate(term: Term): LambdaExpr;
    translateWithTrace(term: Term): { expr: LambdaExpr; trace: string[] };
  }

  export class TypeDirectedTranslator extends Translator {
    translateTyped(term: Term): LambdaExpr;
    checkTypePreservation(term: Term): boolean;
  }

  export class LambdaEvaluator {
    constructor(operator?: PrimeOperator);
    step(expr: LambdaExpr): LambdaExpr | null;
    evaluate(expr: LambdaExpr): LambdaExpr;
  }

  export class Semantics {
    constructor(operator?: PrimeOperator);
    denote(expr: LambdaExpr): unknown;
    equivalent(e1: LambdaExpr, e2: LambdaExpr): boolean;
    verifySemanticEquivalence(t1: Term, t2: Term): boolean;
  }

  export class ConceptInterpreter {
    constructor(lexicon?: Record<string, unknown>);
    getCategory(prime: number): string;
    getRole(prime: number): string;
    interpretNoun(term: NounTerm): unknown;
    interpretNounFull(term: NounTerm): unknown;
    interpretAdj(term: AdjTerm): unknown;
    isIntensifier(term: AdjTerm): boolean;
    interpretChain(term: ChainTerm): unknown;
    interpret(term: Term): unknown;
    addNounConcept(word: string, prime: number): void;
    addAdjConcept(word: string, prime: number): void;
    getCorePrimes(): number[];
    analyzeCompatibility(t1: Term, t2: Term): unknown;
    interpretFusionSemantic(term: FusionTerm): unknown;
  }

  // ============================================
  // ResoFormer ML Primitives (core/rformer.js)
  // ============================================

  export class Quaternion {
    constructor(w?: number, x?: number, y?: number, z?: number);
    w: number;
    x: number;
    y: number;
    z: number;
    static zero(): Quaternion;
    static one(): Quaternion;
    static i(): Quaternion;
    static j(): Quaternion;
    static k(): Quaternion;
    static random(): Quaternion;
    static fromAxisAngle(axis: number[], angle: number): Quaternion;
    mul(other: Quaternion): Quaternion;
    add(other: Quaternion): Quaternion;
    scale(k: number): Quaternion;
    conjugate(): Quaternion;
    norm2(): number;
    norm(): number;
    normalize(): Quaternion;
    inverse(): Quaternion;
    dot(other: Quaternion): number;
    commutator(other: Quaternion): Quaternion;
    commutatorNorm(other: Quaternion): number;
    toArray(): number[];
    toString(): string;
  }

  export class SparsePrimeState {
    constructor(numPrimes?: number, activeK?: number);
    getActivePrimes(): number[];
    set(prime: number, amplitude: Complex): void;
    get(prime: number): Complex | undefined;
    static fromHash(input: string, numPrimes?: number, activeK?: number): SparsePrimeState;
    static fromPrimes(primes: number[], numPrimes?: number): SparsePrimeState;
    normalize(): SparsePrimeState;
    entropy(): number;
  }

  export function resonanceScore(stateI: SparsePrimeState, stateJ: SparsePrimeState, alpha?: number, beta?: number, gamma?: number): number;
  export function resonantAttention(query: SparsePrimeState, keys: SparsePrimeState[], values: SparsePrimeState[], temperature?: number): SparsePrimeState;
  export function hamiltonCompose(stateA: SparsePrimeState, stateB: SparsePrimeState): SparsePrimeState;
  export function measureNonCommutativity(stateA: SparsePrimeState, stateB: SparsePrimeState): number;
  export function computeCoherence(state: SparsePrimeState, weights?: number[] | null): number;
  export function haltingDecision(state: SparsePrimeState, threshold?: number, epsilon?: number): boolean;
  export function coherenceGatedCompute(initialState: SparsePrimeState, stepFn: (state: SparsePrimeState) => SparsePrimeState, maxSteps?: number, threshold?: number): { state: SparsePrimeState; steps: number; halted: boolean };
  export function generateAttractorCodebook(numPrimes?: number): Array<SparsePrimeState>;
  export function applyResonanceOperator(state: SparsePrimeState, n: number): SparsePrimeState;

  export class EntropyCollapseHead {
    constructor(targetEntropy?: number);
    computeLogits(state: SparsePrimeState): number[];
    softAssign(logits: number[]): number[];
    hardAssign(probs: number[]): number[];
    computeEntropyFromProbs(probs: number[]): number;
    entropyLoss(state: SparsePrimeState): number;
  }

  export class PRGraphMemory {
    constructor(numPrimes?: number, lockThreshold?: number);
    put(key: unknown, value: unknown): void;
    get(key: unknown): unknown;
    delete(key: unknown): void;
    getLockedMemories(): unknown[];
    reconstructFromResidues(residues: number[]): unknown;
    stats(): object;
  }

  // ============================================
  // ResoFormer Layers (core/rformer-layers.js)
  // ============================================

  export interface ResoFormerConfig {
    [key: string]: unknown;
  }

  export class ResonantMultiHeadAttention {
    constructor(config: ResoFormerConfig);
    setHeadWeights(weights: number[]): void;
    getParameters(): object;
  }

  export class PrimeFFN {
    constructor(config: ResoFormerConfig);
    train(): void;
    eval(): void;
  }

  export class PrimeLayerNorm {
    constructor(config?: ResoFormerConfig);
    getParameters(): object;
    setParameters(params: object): void;
  }

  export class PositionalPrimeEncoding {
    constructor(config?: ResoFormerConfig);
    getEncoding(): unknown;
    encode(positions: number[]): unknown;
    encodeSequence(length: number): unknown;
  }

  export class ResoFormerBlock {
    constructor(config?: ResoFormerConfig);
    train(): void;
    eval(): void;
  }

  export class ResoFormer {
    constructor(config?: ResoFormerConfig);
    train(): void;
    eval(): void;
    getParameterCount(): number;
  }

  // ============================================
  // CRT-enhanced ResoFormer (core/rformer-crt.js)
  // ============================================

  export class CRTResonantAttention {
    constructor(config: ResoFormerConfig);
    forward(input: unknown): unknown;
    setHeadWeights(weights: number[]): void;
    getParameters(): object;
  }

  export class HomologyRegularizedBlock {
    constructor(config: ResoFormerConfig);
    forward(input: unknown): unknown;
    train(): void;
    eval(): void;
  }

  export class CRTResoFormer {
    constructor(config: ResoFormerConfig);
    forward(input: unknown): unknown;
    train(): void;
    eval(): void;
    getParameterCount(): number;
    getCRTConfig(): object;
  }

  export function createCRTResoFormer(config?: ResoFormerConfig): CRTResoFormer;

  // ============================================
  // CRT-Homology (core/crt-homology.js)
  // ============================================

  export function extendedGCD(a: number, b: number): { gcd: number; x: number; y: number };
  export function modInverse(a: number, m: number): number | null;
  export function areCoprime(a: number, b: number): boolean;
  export function softmax(values: number[]): number[];
  export const DEFAULT_PRIMES_SMALL: number[];
  export const DEFAULT_PRIMES_MEDIUM: number[];
  export const DEFAULT_PRIMES_SEMANTIC: number[];

  export class ResidueEncoder {
    constructor(moduli: number[]);
    encode(value: number): number[];
    expectedResidue(value: number): number[];
    expectedResidues(value: number): number[];
    encodeFromPrimeState(state: PrimeState): unknown;
  }

  export class CRTReconstructor {
    constructor(moduli: number[]);
    reconstruct(residues: number[]): number;
    reconstructionError(residues: number[], value: number): number;
    detectKernel(residues: number[]): boolean;
    validate(residues: number[]): boolean;
  }

  export class BirkhoffProjector {
    constructor(size: number);
    project(matrix: number[][]): number[][];
    attention(query: number[], keys: number[][]): number[];
    validate(matrix: number[][]): boolean;
  }

  export class HomologyLoss {
    sigmoid(x: number): number;
    detectCycles(matrix: number[][]): number;
    cycleLoss(matrix: number[][]): number;
    compute(matrix: number[][]): number;
    cyclePersistence(matrices: number[][][]): number[];
    computeBettiNumbers(matrix: number[][]): number[];
  }

  export class CRTModularLayer {
    constructor(moduli: number[]);
    forward(input: unknown): unknown;
    forwardBatch(inputs: unknown[]): unknown[];
    forwardFromPrimeState(state: PrimeState): unknown;
  }

  export class CRTFusedAttention {
    constructor(moduli: number[]);
    projectHead(head: unknown, query: unknown): unknown;
    forward(input: unknown): unknown;
  }

  export class CoprimeSelector {
    constructor(moduli: number[]);
    selectMinimal(n: number): number[];
    selectForProduct(product: number): number[];
    selectForDomain(size: number): number[];
  }

  export function createCRTLayer(moduli: number[]): CRTModularLayer;
  export function createFusedAttention(moduli: number[]): CRTFusedAttention;

  // ============================================
  // Gravity (core/gravity.js) — simplified annotation
  // ============================================

  export class MetricEmergence {
    constructor(dim?: number);
    static fromFieldStates(states: unknown[]): MetricEmergence;
    determinant(): number;
    ricciScalar(): number;
    lineElement(): string;
    signature(): number[];
  }

  export class SymbolicGravity {
    constructor(options?: object);
    setEntropy(entropy: number): void;
    getEntropy(): number;
    computeTensor(): unknown;
    trace(): number;
    encodeState(state: unknown): unknown;
  }

  export class GravitonField {
    constructor(options?: object);
    static fromPrimeState(state: PrimeState): GravitonField;
    crossProduct(): unknown;
    step(dt?: number): unknown;
    evolve(steps?: number): unknown;
    norm(): number;
    spin2Content(): number;
  }

  export class PrimeHarmonicField {
    constructor(options?: object);
    static fromPrimeState(state: PrimeState): PrimeHarmonicField;
    compute(): unknown;
    computeGrid(): unknown;
    averageIntensity(): number;
    findPeaks(): unknown[];
    spectrum(): unknown;
  }

  export class ModifiedEinsteinEquations {
    constructor(options?: object);
    effectiveStressEnergy(): unknown;
    checkEnergyConditions(): unknown;
    symbolicPotential(): unknown;
  }

  // ============================================
  // Oracle (core/oracle.js)
  // ============================================

  export const HEXAGRAMS: Record<number, object>;

  export class HexagramAttractor {
    constructor(hexagramNumber: number);
    distance(state: unknown): number;
    project(state: unknown): unknown;
  }

  export class OracleSystem {
    constructor(options?: object);
    findNearestAttractor(state: unknown): HexagramAttractor;
    applyEntropyModulation(state: unknown): unknown;
    step(state: unknown): unknown;
    query(question: string): unknown;
    divine(question: string): unknown;
  }

  export class ClauseProjector {
    constructor(variables: unknown, literals: unknown);
    satisfies(assignment: unknown): boolean;
    project(state: unknown): unknown;
  }

  export class NPResonanceEncoder {
    constructor(variables: unknown);
    addClause(clause: unknown): void;
    static fromCNF(cnf: unknown): NPResonanceEncoder;
    createSuperposition(): unknown;
    collapseOperator(state: unknown): unknown;
    solve(): unknown;
  }

  export class SemanticCompressor {
    constructor(options?: object);
    compress(input: unknown): unknown;
    findSimilar(input: unknown): unknown[];
  }

  // ============================================
  // Non-local Communication (core/nonlocal.js)
  // ============================================

  export const SILVER_RATIO: number;

  export class PrimeEntangledPair {
    constructor(primeP: number, primeQ: number, options?: object);
    measureA(): number;
    measureB(): number;
    applyLocalA(op: unknown): void;
    applyLocalB(op: unknown): void;
    isEntangled(): boolean;
    getCorrelation(): number;
    reset(): void;
  }

  export class ResonanceStability {
    constructor(options?: object);
    primeResonance(p: number, q: number): number;
    entropyFactor(p: number, q: number): number;
    sameBasin(p: number, q: number): boolean;
    calculate(p: number, q: number): number;
    findStablePairs(primes: number[]): Array<[number, number]>;
  }

  export class GoldenChannel {
    constructor(tolerance?: number);
    select(primes: number[]): Array<[number, number]>;
    isGoldenPair(p: number, q: number): boolean;
    findAllGoldenPairs(primes: number[]): Array<[number, number]>;
  }

  export class SilverChannel {
    constructor(tolerance?: number);
    select(primes: number[]): Array<[number, number]>;
    isSilverPair(p: number, q: number): boolean;
  }

  export class SymbolicEntanglementComm {
    constructor(options?: object);
    selectChannel(primes: number[]): GoldenChannel | SilverChannel | null;
    encodeBit(bit: number, primes: number[]): unknown;
    decodeBit(message: unknown): number;
    sendMessage(bits: number[], primes: number[]): unknown;
    receiveMessage(message: unknown): number[];
    testCorrelation(primes: number[]): number;
    getStatistics(): object;
  }

  export class EntanglementWitness {
    constructor();
    chshTest(pair: PrimeEntangledPair): number;
    simpleTest(pair: PrimeEntangledPair): number;
  }

  // ============================================
  // Emotion (core/emotion.js)
  // ============================================

  export const EMOTIONAL_TEMPLATES: Record<string, object>;
  export function createEmotionalState(emotionName: string): unknown;

  export class FeelingOperator {
    constructor();
    measure(state: unknown): number;
    spectrum(state: unknown): unknown;
    apply(state: unknown): unknown;
    transition(state: unknown, target: string): unknown;
  }

  export class ConsciousnessPrimacy {
    constructor(weights?: number[] | null);
    calculate(state: unknown): number;
    trackEvolution(state: unknown): unknown;
  }

  export class EmotionalSpectrometer {
    constructor();
    analyze(state: unknown): unknown;
    compare(state1: unknown, state2: unknown): unknown;
  }

  // ============================================
  // Enochian Packet Layer (core/enochian.js)
  // Classes/constants below are members of the `enochian` namespace object
  // and the default export — NOT named exports of this subpath.
  // ============================================

  const ENOCHIAN_PRIMES: number[]; // [7, 11, 13, 17, 19, 23, 29]
  const MODES: string[]; // ['α', 'μ', 'ω']
  const MODE_INDEX: Record<string, number>;
  const CLOSED_SEQUENCES: number[][];
  function twistAngle(p: number): number;
  function totalTwist(primes: number[]): number;
  function isTwistClosed(primes: number[], epsilon?: number): boolean;
  function findClosedSequences(length: number, epsilon?: number, maxResults?: number): number[][];

  class EnochianSymbol {
    constructor(prime: number, mode?: string);
    encode(): object;
    static decode(data: object): EnochianSymbol;
    toString(): string;
    toJSON(): object;
  }

  class EnochianPacket {
    constructor(symbols?: EnochianSymbol[]);
    add(symbol: EnochianSymbol): void;
    readonly primes: number[];
    readonly totalTwist: number;
    isTwistClosed(epsilon?: number): boolean;
    closureError(): number;
    validate(): boolean;
    encode(): object;
    static decode(data: object): EnochianPacket;
    toBase64(): string;
    static fromBase64(b64: string): EnochianPacket;
    toString(): string;
    toJSON(): object;
  }

  class EnochianEncoder {
    constructor(options?: object);
    encode(symbols: EnochianSymbol[]): EnochianPacket;
    closeTwist(primes: number[]): EnochianSymbol | null;
    encodeText(text: string): EnochianPacket;
    encodeTerm(term: Term): EnochianPacket;
  }

  class EnochianDecoder {
    constructor(options?: object);
    decode(packet: EnochianPacket | object): unknown;
    validateOnly(packet: EnochianPacket | object): boolean;
  }

  class EnochianPacketBuilder {
    constructor();
    add(prime: number, mode?: string): this;
    alpha(prime: number): this;
    mu(prime: number): this;
    omega(prime: number): this;
    build(): EnochianPacket;
    readonly currentTwist: number;
    readonly isClosed: boolean;
    suggestClosing(): Array<{ prime: number; error: number }>;
    reset(): void;
  }

  class EnhancedEnochianEncoder extends EnochianEncoder {
    encodeWord(word: string): EnochianPacket;
    encodeFromPrimes(primes: number[]): EnochianPacket;
    findClosestEnochianPrime(p: number): number;
    encodeCall(call: unknown): EnochianPacket;
    getVocabularyEntry(word: string): unknown;
    toSedenion(primes: number[]): unknown;
  }

  class EnhancedEnochianDecoder extends EnochianDecoder {
    decodeWithVocabulary(packet: EnochianPacket | object): unknown;
    findMatchingWords(primes: number[]): unknown[];
    toSedenion(packet: EnochianPacket | object): unknown;
  }

  // ============================================
  // Enochian Vocabulary (core/enochian-vocabulary.js)
  // Members of the `enochianVocabulary` namespace object — NOT named exports.
  // ============================================

  const ENOCHIAN_ALPHABET: string[];
  function letterToPrime(letter: string): number;
  function primeToLetter(prime: number): string;
  function letterToData(letter: string): object;
  const PRIME_BASIS: number[];
  const BASIS_MEANINGS: Record<number, string>;
  const TWIST_MODES: Record<string, number>;
  function twistRadians(mode: string): number;
  function validateTwistClosure(primes: number[]): boolean;
  const CORE_VOCABULARY: Record<string, object>;
  function wordLookup(word: string): unknown;
  const THE_NINETEEN_CALLS: object[];
  const sedenionMultTable: number[][];

  class TwistOperator {
    constructor(mode: string);
    getRotationMatrix(): number[][];
    apply2D(x: number, y: number): [number, number];
    compose(other: TwistOperator): TwistOperator;
    toString(): string;
  }

  class EnochianWord {
    constructor(word: string);
    toPrimes(): number[];
    calculateProduct(): number;
    calculateTwistSum(): number;
    getTwistClosure(): number;
    toLetterPrimePairs(): Array<[string, number]>;
    usesBasisOnly(): boolean;
    resonanceWith(other: EnochianWord): number;
    toString(): string;
  }

  class EnochianCall {
    constructor(text: string);
    parseWords(): EnochianWord[];
    getAllPrimes(): number[];
    getTotalTwist(): number;
    getPrimeSignature(): string;
    toString(): string;
  }

  class SedenionElement {
    constructor(components: number[]);
    static fromWord(word: string): SedenionElement;
    static fromBasis(index: number): SedenionElement;
    real(): number;
    imaginary(): number[];
    conjugate(): SedenionElement;
    normSquared(): number;
    norm(): number;
    add(other: SedenionElement): SedenionElement;
    subtract(other: SedenionElement): SedenionElement;
    scale(k: number): SedenionElement;
    multiply(other: SedenionElement): SedenionElement;
    twist(mode: string): SedenionElement;
    toArray(): number[];
    isZero(): boolean;
    toString(): string;
  }

  class EnochianEngine {
    constructor();
    parse(text: string): unknown;
    primeSignature(text: string): number[];
    toSedenion(primes: number[]): SedenionElement;
    applyTwists(element: SedenionElement, primes: number[]): SedenionElement;
    resonance(text1: string, text2: string): number;
    hasTwistClosure(primes: number[]): boolean;
    getCall(index: number): EnochianCall;
    executeCall(index: number, primes: number[]): object;
    findResonantWords(prime: number): EnochianWord[];
    basisDecomposition(text: string): object;
  }

  /** Default export of core/enochian.js (module namespace object). */
  export const enochian: {
    ENOCHIAN_PRIMES: number[];
    MODES: string[];
    MODE_INDEX: Record<string, number>;
    CLOSED_SEQUENCES: number[][];
    twistAngle: typeof twistAngle;
    totalTwist: typeof totalTwist;
    isTwistClosed: typeof isTwistClosed;
    findClosedSequences: typeof findClosedSequences;
    EnochianSymbol: typeof EnochianSymbol;
    EnochianPacket: typeof EnochianPacket;
    EnochianEncoder: typeof EnochianEncoder;
    EnochianDecoder: typeof EnochianDecoder;
    EnochianPacketBuilder: typeof EnochianPacketBuilder;
    EnhancedEnochianEncoder: typeof EnhancedEnochianEncoder;
    EnhancedEnochianDecoder: typeof EnhancedEnochianDecoder;
    ENOCHIAN_ALPHABET: string[];
    PRIME_BASIS: number[];
    CORE_VOCABULARY: Record<string, object>;
    THE_NINETEEN_CALLS: object[];
    EnochianWord: typeof EnochianWord;
    EnochianCall: typeof EnochianCall;
    EnochianEngine: typeof EnochianEngine;
    SedenionElement: typeof SedenionElement;
    TwistOperator: typeof TwistOperator;
    validateTwistClosure: typeof validateTwistClosure;
  };

  /** Default export of core/enochian-vocabulary.js (module namespace object). */
  export const enochianVocabulary: {
    ENOCHIAN_ALPHABET: string[];
    letterToPrime: typeof letterToPrime;
    primeToLetter: typeof primeToLetter;
    letterToData: typeof letterToData;
    PRIME_BASIS: number[];
    BASIS_MEANINGS: Record<number, string>;
    TWIST_MODES: Record<string, number>;
    twistAngle: typeof twistAngle;
    twistRadians: typeof twistRadians;
    TwistOperator: typeof TwistOperator;
    validateTwistClosure: typeof validateTwistClosure;
    EnochianWord: typeof EnochianWord;
    CORE_VOCABULARY: Record<string, object>;
    wordLookup: typeof wordLookup;
    EnochianCall: typeof EnochianCall;
    THE_NINETEEN_CALLS: object[];
    SedenionElement: typeof SedenionElement;
    sedenionMultTable: number[][];
    EnochianEngine: typeof EnochianEngine;
  };

  // ============================================
  // Golden Ratio Resonance (core/resonance.js)
  // ============================================

  export const PHI_THRESHOLD: number;
  export const PHI_BONUS: number;

  export class ResonanceCalculator {
    constructor(cacheSize?: number);
    calculateResonance(p: number, q: number): number;
    isGoldenRatio(p: number, q: number): boolean;
    findGoldenPairs(primes: number[]): Array<[number, number]>;
    calculateMatrix(primes: number[]): number[][];
    calculateAverageResonance(primes: number[]): number;
    findMostResonant(primes: number[]): [number, number] | null;
    findClusters(primes: number[]): number[][];
    addToCache(p: number, q: number, value: number): void;
    clearCache(): void;
    getCacheStats(): object;
  }

  export function resonanceSignature(primes: number[], calc?: ResonanceCalculator): { mean: number; variance: number; goldenCount: number };
  export function findFibonacciSequences(primes: number[], minLength?: number): number[][];
  export function calculateResonance(p: number, q: number): number;
  export function findGoldenPairs(primes: number[]): Array<[number, number]>;
  export function findMostResonant(primes: number[]): [number, number] | null;

  // ============================================
  // Symbol Database (core/symbols)
  // ============================================

  export class SymbolDatabase {
    registerSymbols(symbols: object[]): void;
    getSymbol(id: string): unknown;
    getSymbolByPrime(prime: number): unknown;
    getSymbolsByCategory(category: unknown): unknown[];
    getSymbolsByTag(tag: string): unknown[];
    search(query: string): unknown[];
    encode(ids: unknown): unknown;
    decode(signature: unknown): unknown;
    getAllSymbols(): unknown[];
    getStats(): object;
  }

  export const SymbolCategory: Record<string, string>;
  export const PrimeGenerator: unknown;
  export const symbolDatabase: SymbolDatabase;
  export const getSymbol: (id: string) => unknown;
  export const getSymbolByPrime: (prime: number) => unknown;
  export const searchSymbols: (query: string) => unknown[];
  export const encodeSymbols: (ids: unknown) => unknown;
  export const decodeSymbols: (signature: unknown) => unknown;

  // ============================================
  // Semantic Inference (core/inference.js)
  // ============================================

  export const InferenceMethod: Record<string, string>;

  export class SemanticInference {
    inferSymbol(symbol: unknown): unknown;
    inferSymbols(symbols: unknown[]): unknown[];
    addPatternRule(rule: unknown): void;
    initializePatternRules(): void;
    matchPattern(symbol: unknown): unknown;
    semanticMatch(s1: unknown, s2: unknown): boolean;
    categoryFallback(symbol: unknown): unknown;
    symbolToState(symbol: unknown): PrimeState;
    calculateCandidateResonance(candidates: unknown[]): unknown[];
    resonanceSelect(candidates: unknown[]): unknown;
    inferWithResonance(symbol: unknown): unknown;
    inferMostResonant(symbols: unknown[]): unknown;
    getConfidenceStats(): object;
    getMethodStats(): object;
    getPatternRules(): unknown[];
    resetPatternRules(): void;
  }

  export class EntityExtractor {
    extract(text: string): unknown[];
    extractAndInfer(text: string): unknown;
  }

  export const semanticInference: SemanticInference;
  export const entityExtractor: EntityExtractor;
  export const inferSymbol: (symbol: unknown) => unknown;
  export const inferSymbols: (symbols: unknown[]) => unknown[];
  export const extractEntities: (text: string) => unknown[];
  export const extractAndInfer: (text: string) => unknown;
  export const inferWithResonance: (symbol: unknown) => unknown;
  export const inferMostResonant: (symbols: unknown[]) => unknown;

  // ============================================
  // Compound Builder (core/compound.js)
  // ============================================

  export class CompoundSymbol {
    constructor(symbols: unknown[]);
    calculatePrime(): number;
    toJSON(): object;
    toString(): string;
  }

  export class SymbolSequence {
    constructor(symbols: unknown[]);
    calculateSignature(): string;
    toJSON(): object;
  }

  export class CompoundBuilder {
    createCompound(symbols: unknown[]): CompoundSymbol;
    createCompoundFromSymbols(ids: unknown[]): CompoundSymbol;
    getCompound(prime: number): CompoundSymbol | undefined;
    hasCompound(prime: number): boolean;
    decompose(prime: number): unknown[];
    createSequence(symbols: unknown[]): SymbolSequence;
    getSequence(signature: string): SymbolSequence | undefined;
    mergeCompounds(c1: CompoundSymbol, c2: CompoundSymbol): CompoundSymbol;
    createCulturalVariant(compound: CompoundSymbol, culture: string): CompoundSymbol;
    initializeCommonCompounds(): void;
    findCompoundsContaining(symbolId: string): CompoundSymbol[];
    findSequencesContaining(symbolId: string): SymbolSequence[];
    calculateCompoundResonance(c1: CompoundSymbol, c2: CompoundSymbol): number;
    findResonantAddition(compound: CompoundSymbol): unknown;
    getAllCompounds(): CompoundSymbol[];
    getAllSequences(): SymbolSequence[];
    clearCompounds(): void;
    clearSequences(): void;
    getStats(): object;
    getCultureDistribution(): object;
  }

  export const compoundBuilder: CompoundBuilder;
  export const createCompound: (symbols: unknown[]) => CompoundSymbol;
  export const getCompound: (prime: number) => CompoundSymbol | undefined;
  export const createSequence: (symbols: unknown[]) => SymbolSequence;
  export const getSequence: (signature: string) => SymbolSequence | undefined;
  export const findCompoundsContaining: (symbolId: string) => CompoundSymbol[];

  // ============================================
  // Prime Entanglement Graph (core/entanglement.js)
  // ============================================

  export class EntanglementEdge {
    observe(): void;
    decay(rate: number): void;
    readonly age: number;
    readonly staleness: number;
    toJSON(): object;
  }

  export class PrimeEntanglementGraph {
    addPrime(prime: number): void;
    getEdge(p1: number, p2: number): EntanglementEdge | undefined;
    hasEdge(p1: number, p2: number): boolean;
    observe(p1: number, p2: number): void;
    neighbors(prime: number): number[];
    shortestPath(from: number, to: number): number[] | null;
    clusteringCoefficient(prime: number): number;
    averageClusteringCoefficient(): number;
    degreeCentrality(prime: number): number;
    topByDegree(k?: number): Array<{ prime: number; degree: number }>;
    weightedDegree(prime: number): number;
    decay(rate: number): void;
    prune(minStaleness: number): void;
    toAdjacencyMatrix(): number[][];
    toNetworkKuramoto(): unknown;
    toEdgeList(): Array<[number, number]>;
    static fromEdgeList(edges: Array<[number, number]>): PrimeEntanglementGraph;
    stats(): object;
    clone(): PrimeEntanglementGraph;
    merge(other: PrimeEntanglementGraph): void;
    findComponents(): number[][];
  }

  export function createEntanglementGraph(): PrimeEntanglementGraph;

  // ============================================
  // Event System (core/events.js)
  // ============================================

  export class AlephEventEmitter {
    on(event: string, listener: (...args: unknown[]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
    removeAllListeners(): void;
    emit(event: string, ...args: unknown[]): boolean;
    throttle(event: string, ms: number): void;
    unthrottle(event: string): void;
    pause(): void;
    resume(): void;
    isPaused(): boolean;
    listenerCount(event: string): number;
    eventNames(): string[];
    getHistory(): unknown[];
    clearHistory(): void;
    getStats(): object;
    resetStats(): void;
    filter(event: string, predicate: (...args: unknown[]) => boolean): unknown;
    map(event: string, transform: (...args: unknown[]) => unknown): unknown;
    waitFor(event: string, timeoutMs?: number): Promise<unknown[]>;
    batch(event: string, count: number, timeoutMs?: number): Promise<unknown[][]>;
    debounce(event: string, ms: number): void;
  }

  export class AlephMonitor {
    constructor(options?: object);
    getEmitter(): AlephEventEmitter;
    on(event: string, listener: (...args: unknown[]) => void): void;
    tick(state: unknown): void;
    emitCollapse(): void;
    emitResonance(): void;
    run(steps: number): void;
    getStats(): object;
    reset(): void;
  }

  export class EvolutionStream {
    static fromEvolvable(evolvable: unknown): EvolutionStream;
    stop(): void;
    batch(count: number): EvolutionStream;
    filter(predicate: (state: unknown) => boolean): EvolutionStream;
    take(count: number): EvolutionStream;
    collect(): unknown[];
    map(transform: (state: unknown) => unknown): EvolutionStream;
    skip(count: number): EvolutionStream;
    takeWhile(predicate: (state: unknown) => boolean): EvolutionStream;
  }

  export function createEvolutionStream(evolvable: unknown): EvolutionStream;
  export function createMonitor(options?: object): AlephMonitor;

  // ============================================
  // Default export namespace (matches core/index.js default)
  // ============================================

  const coreDefault: {
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
    LLM: LLMClient;
    Complex: typeof Complex;
    PrimeState: typeof PrimeState;
    ResonanceOperators: typeof ResonanceOperators;
    EntropyDrivenEvolution: typeof EntropyDrivenEvolution;
    encodeMemory: typeof encodeMemory;
    symbolicCompute: typeof symbolicCompute;
    QuaternionPrime: typeof QuaternionPrime;
    PrimeResonanceIdentity: typeof PrimeResonanceIdentity;
    PhaseLockedRing: typeof PhaseLockedRing;
    HolographicField: typeof HolographicField;
    EntangledNode: typeof EntangledNode;
    ResonantFragment: typeof ResonantFragment;
    DELTA_S: number;
    PHI: number;
    PHI_THRESHOLD: number;
    PHI_BONUS: number;
    ResonanceCalculator: typeof ResonanceCalculator;
    resonanceSignature: typeof resonanceSignature;
    findFibonacciSequences: typeof findFibonacciSequences;
    calculateResonance: typeof calculateResonance;
    findGoldenPairs: typeof findGoldenPairs;
    findMostResonant: typeof findMostResonant;
    SymbolDatabase: typeof SymbolDatabase;
    SymbolCategory: Record<string, string>;
    symbolDatabase: SymbolDatabase;
    getSymbol: typeof getSymbol;
    getSymbolByPrime: typeof getSymbolByPrime;
    searchSymbols: typeof searchSymbols;
    encodeSymbols: typeof encodeSymbols;
    decodeSymbols: typeof decodeSymbols;
    SemanticInference: typeof SemanticInference;
    EntityExtractor: typeof EntityExtractor;
    semanticInference: SemanticInference;
    entityExtractor: EntityExtractor;
    inferSymbol: typeof inferSymbol;
    inferSymbols: typeof inferSymbols;
    extractEntities: typeof extractEntities;
    extractAndInfer: typeof extractAndInfer;
    inferWithResonance: typeof inferWithResonance;
    inferMostResonant: typeof inferMostResonant;
    CompoundBuilder: typeof CompoundBuilder;
    CompoundSymbol: typeof CompoundSymbol;
    SymbolSequence: typeof SymbolSequence;
    compoundBuilder: CompoundBuilder;
    createCompound: typeof createCompound;
    getCompound: typeof getCompound;
    createSequence: typeof createSequence;
    getSequence: typeof getSequence;
    findCompoundsContaining: typeof findCompoundsContaining;
    Quaternion: typeof Quaternion;
    SparsePrimeState: typeof SparsePrimeState;
    resonanceScore: typeof resonanceScore;
    resonantAttention: typeof resonantAttention;
    hamiltonCompose: typeof hamiltonCompose;
    measureNonCommutativity: typeof measureNonCommutativity;
    computeCoherence: typeof computeCoherence;
    haltingDecision: typeof haltingDecision;
    coherenceGatedCompute: typeof coherenceGatedCompute;
    EntropyCollapseHead: typeof EntropyCollapseHead;
    generateAttractorCodebook: typeof generateAttractorCodebook;
    PRGraphMemory: typeof PRGraphMemory;
    applyResonanceOperator: typeof applyResonanceOperator;
    ResonantMultiHeadAttention: typeof ResonantMultiHeadAttention;
    PrimeFFN: typeof PrimeFFN;
    PrimeLayerNorm: typeof PrimeLayerNorm;
    PositionalPrimeEncoding: typeof PositionalPrimeEncoding;
    ResoFormerBlock: typeof ResoFormerBlock;
    ResoFormer: typeof ResoFormer;
    EntanglementEdge: typeof EntanglementEdge;
    PrimeEntanglementGraph: typeof PrimeEntanglementGraph;
    createEntanglementGraph: typeof createEntanglementGraph;
    AlephEventEmitter: typeof AlephEventEmitter;
    AlephMonitor: typeof AlephMonitor;
    EvolutionStream: typeof EvolutionStream;
    createEvolutionStream: typeof createEvolutionStream;
    createMonitor: typeof createMonitor;
    NounType: Term;
    AdjType: Term;
    SentenceType: Term;
    NounTerm: typeof NounTerm;
    AdjTerm: typeof AdjTerm;
    ChainTerm: typeof ChainTerm;
    FusionTerm: typeof FusionTerm;
    NounSentence: typeof NounSentence;
    SeqSentence: typeof SeqSentence;
    ImplSentence: typeof ImplSentence;
    TypingContext: typeof TypingContext;
    TypingJudgment: typeof TypingJudgment;
    TypeChecker: typeof TypeChecker;
    N: typeof N;
    A: typeof A;
    FUSE: typeof FUSE;
    CHAIN: typeof CHAIN;
    SENTENCE: typeof SENTENCE;
    SEQ: typeof SEQ;
    IMPL: typeof IMPL;
    PrimeOperator: typeof PrimeOperator;
    NextPrimeOperator: typeof NextPrimeOperator;
    ModularPrimeOperator: typeof ModularPrimeOperator;
    ResonancePrimeOperator: typeof ResonancePrimeOperator;
    IdentityPrimeOperator: typeof IdentityPrimeOperator;
    DEFAULT_OPERATOR: PrimeOperator;
    ReductionStep: typeof ReductionStep;
    ReductionTrace: typeof ReductionTrace;
    ReductionSystem: typeof ReductionSystem;
    isNormalForm: typeof isNormalForm;
    isReducible: typeof isReducible;
    termSize: typeof termSize;
    FusionCanonicalizer: typeof FusionCanonicalizer;
    NormalFormVerifier: typeof NormalFormVerifier;
    demonstrateStrongNormalization: typeof demonstrateStrongNormalization;
    testLocalConfluence: typeof testLocalConfluence;
    LambdaExpr: typeof LambdaExpr;
    VarExpr: typeof VarExpr;
    ConstExpr: typeof ConstExpr;
    LamExpr: typeof LamExpr;
    AppExpr: typeof AppExpr;
    PairExpr: typeof PairExpr;
    ImplExpr: typeof ImplExpr;
    PrimOpExpr: typeof PrimOpExpr;
    Translator: typeof Translator;
    TypeDirectedTranslator: typeof TypeDirectedTranslator;
    LambdaEvaluator: typeof LambdaEvaluator;
    Semantics: typeof Semantics;
    ConceptInterpreter: typeof ConceptInterpreter;
    enochian: typeof enochian;
    enochianVocabulary: typeof enochianVocabulary;
    ENOCHIAN_PRIMES: number[];
    ENOCHIAN_MODES: string[];
    twistAngle: typeof twistAngle;
    totalTwist: typeof totalTwist;
    isTwistClosed: typeof isTwistClosed;
    findClosedSequences: typeof findClosedSequences;
    EnochianSymbol: typeof EnochianSymbol;
    EnochianPacket: typeof EnochianPacket;
    EnochianEncoder: typeof EnochianEncoder;
    EnochianDecoder: typeof EnochianDecoder;
    EnochianPacketBuilder: typeof EnochianPacketBuilder;
    EnhancedEnochianEncoder: typeof EnhancedEnochianEncoder;
    EnhancedEnochianDecoder: typeof EnhancedEnochianDecoder;
    ENOCHIAN_ALPHABET: string[];
    PRIME_BASIS: number[];
    CORE_VOCABULARY: Record<string, object>;
    THE_NINETEEN_CALLS: object[];
    EnochianWord: typeof EnochianWord;
    EnochianCall: typeof EnochianCall;
    EnochianEngine: typeof EnochianEngine;
    SedenionElement: typeof SedenionElement;
    TwistOperator: typeof TwistOperator;
    validateTwistClosure: typeof validateTwistClosure;
    extendedGCD: typeof extendedGCD;
    modInverse: typeof modInverse;
    areCoprime: typeof areCoprime;
    softmax: typeof softmax;
    ResidueEncoder: typeof ResidueEncoder;
    CRTReconstructor: typeof CRTReconstructor;
    BirkhoffProjector: typeof BirkhoffProjector;
    HomologyLoss: typeof HomologyLoss;
    CRTModularLayer: typeof CRTModularLayer;
    CRTFusedAttention: typeof CRTFusedAttention;
    CoprimeSelector: typeof CoprimeSelector;
    createCRTLayer: typeof createCRTLayer;
    createFusedAttention: typeof createFusedAttention;
    DEFAULT_PRIMES_SMALL: number[];
    DEFAULT_PRIMES_MEDIUM: number[];
    DEFAULT_PRIMES_SEMANTIC: number[];
    CRTResonantAttention: typeof CRTResonantAttention;
    HomologyRegularizedBlock: typeof HomologyRegularizedBlock;
    CRTResoFormer: typeof CRTResoFormer;
    createCRTResoFormer: typeof createCRTResoFormer;
    LegendreSymbol: typeof LegendreSymbol;
    PowerResidueSymbol: typeof PowerResidueSymbol;
    RedeiSymbol: typeof RedeiSymbol;
    ArithmeticMilnorInvariant: typeof ArithmeticMilnorInvariant;
    MultipleResidueSymbol: typeof MultipleResidueSymbol;
    ArithmeticLinkKernel: typeof ArithmeticLinkKernel;
    ALKOperators: object;
    findBorromeanPrimes: typeof findBorromeanPrimes;
    computeLegendreMatrix: typeof computeLegendreMatrix;
    quickBorromeanCheck: typeof quickBorromeanCheck;
    LaurentPolynomial: typeof LaurentPolynomial;
    FittingIdeal: typeof FittingIdeal;
    CrowellSequence: typeof CrowellSequence;
    AlexanderModule: typeof AlexanderModule;
    ModuleSignature: typeof ModuleSignature;
    SignatureMemory: typeof SignatureMemory;
    SignatureExtractor: typeof SignatureExtractor;
    createAlexanderModule: typeof createAlexanderModule;
    extractSignature: typeof extractSignature;
    createSignatureMemory: typeof createSignatureMemory;
    createSignatureExtractor: typeof createSignatureExtractor;
    Label: typeof Label;
    Atlas: typeof Atlas;
    E8RootSystem: typeof E8RootSystem;
    ATLAS: Atlas;
    E8: E8RootSystem;
    MetricEmergence: typeof MetricEmergence;
    SymbolicGravity: typeof SymbolicGravity;
    GravitonField: typeof GravitonField;
    PrimeHarmonicField: typeof PrimeHarmonicField;
    ModifiedEinsteinEquations: typeof ModifiedEinsteinEquations;
    HEXAGRAMS: Record<number, object>;
    HexagramAttractor: typeof HexagramAttractor;
    OracleSystem: typeof OracleSystem;
    ClauseProjector: typeof ClauseProjector;
    NPResonanceEncoder: typeof NPResonanceEncoder;
    SemanticCompressor: typeof SemanticCompressor;
    EMOTIONAL_TEMPLATES: Record<string, object>;
    createEmotionalState: typeof createEmotionalState;
    FeelingOperator: typeof FeelingOperator;
    ConsciousnessPrimacy: typeof ConsciousnessPrimacy;
    EmotionalSpectrometer: typeof EmotionalSpectrometer;
    SILVER_RATIO: number;
    PrimeEntangledPair: typeof PrimeEntangledPair;
    ResonanceStability: typeof ResonanceStability;
    GoldenChannel: typeof GoldenChannel;
    SilverChannel: typeof SilverChannel;
    SymbolicEntanglementComm: typeof SymbolicEntanglementComm;
    EntanglementWitness: typeof EntanglementWitness;
    vonMangoldt: typeof vonMangoldt;
    liouvilleFunction: typeof liouvilleFunction;
    divisorCount: typeof divisorCount;
    dirichletCharacter: typeof dirichletCharacter;
    jacobiSymbol: typeof jacobiSymbol;
    principalCharacter: typeof principalCharacter;
    generateDirichletCharacters: typeof generateDirichletCharacters;
    findPrimitiveRoot: typeof findPrimitiveRoot;
    modPow: typeof modPow;
    discreteLog: typeof discreteLog;
    hilbertModInverse: typeof hilbertModInverse;
    gcd: typeof gcd;
    [key: string]: unknown;
  };

  export default coreDefault;
}
