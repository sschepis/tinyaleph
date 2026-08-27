/**
 * Type definitions for @aleph-ai/tinyaleph/engine
 *
 * Declared against the runtime in engine/aleph.js and engine/index.js.
 */

declare module '@aleph-ai/tinyaleph/engine' {

  import type { Backend } from '@aleph-ai/tinyaleph/backends';
  import type { Hypercomplex } from '@aleph-ai/tinyaleph/core';
  import type { KuramotoModel } from '@aleph-ai/tinyaleph/physics';

  // ============================================
  // Engine Options (engine/aleph.js constructor)
  // ============================================

  /**
   * The real engine options. The former `dampingRate`, `stableCoherence`,
   * `oscillatorCount` and `maxIterations` options were dead (never read)
   * and no longer exist.
   */
  export interface EngineOptions {
    /** Kuramoto coupling strength (default 0.3). */
    baseCoupling?: number;
    /** Collapse coherence threshold (default 0.7). */
    collapseCoherence?: number;
    /** Collapse entropy threshold (default 1.8). */
    collapseEntropy?: number;
    /** Symbolic reasoning search depth (default 5). */
    maxTransformSteps?: number;
    /** Reasoning termination threshold (default 0.5). */
    entropyThreshold?: number;
    /** Max field evolution timesteps (default 100). */
    maxEvolutionSteps?: number;
    /** Min order parameter for coherent emission (default 0.6). */
    coherenceThreshold?: number;
    /** Min amplitude to consider a prime "active" (default 0.1). */
    amplitudeThreshold?: number;
    /** Keep best N coherent frames (default 10). */
    sampleWindow?: number;
    /** Timestep (default 0.016). */
    dt?: number;
    /** Cap on recorded run history (default 200). */
    maxHistory?: number;
  }

  export interface ReasonStep {
    step: number;
    transform: string;
    entropyDrop: number;
    primes: number[];
  }

  export interface ReasonResult {
    primes: number[];
    state: Hypercomplex;
    entropy: number;
    steps: ReasonStep[];
  }

  /**
   * The real shape returned by AlephEngine.run().
   */
  export interface EngineResult {
    input: unknown;
    inputPrimes: number[];
    resultPrimes: number[];
    output: unknown;
    entropy: number;
    coherence: number;
    lyapunov: number;
    stability: 'stable' | 'marginal' | 'chaotic';
    collapsed: boolean;
    steps: ReasonStep[];
    evolutionSteps: number;
    framesCollected: number;
    bestFrameOrder: number;
    bestDifferential: number;
    fieldBased: boolean;
    orderParameter: number;
  }

  export interface Frame {
    step: number;
    order: number;
    differential: number;
    amplitudes: number[];
    entropy: number;
    stability: string;
  }

  export interface HistoryEntry {
    time: number;
    input: unknown;
    output: unknown;
    entropy: number;
    fieldBased: boolean;
  }

  export interface PhysicsState {
    state: Hypercomplex;
    entropy: number;
    coherence: number;
    lyapunov: number;
    stability: string;
    coupling: number;
    orderParameter: number;
    oscillators: Array<{ freq: number; phase: number; amplitude: number }>;
    collapseProbability: number;
  }

  export interface BackendInfo {
    name: string;
    dimension: number;
    transformCount: number;
    primeCount: number;
  }

  export interface EvolveStep {
    step: number;
    entropy: number;
    orderParameter: number;
    stability: string;
  }

  export class AlephEngine {
    constructor(backend: Backend, options?: EngineOptions);

    backend: Backend;
    options: Required<EngineOptions>;
    oscillators: KuramotoModel;
    primeList: number[];
    state: Hypercomplex;
    entropy: number;
    coherenceValue: number;
    lyapunov: number;
    collapseIntegral: number;
    stability: string;
    history: HistoryEntry[];
    frames: Frame[];

    /** encode → excite → evolve → sample → decode pipeline. */
    run(input: unknown): EngineResult;
    /** Convert oscillator amplitudes to primes, prioritizing input-excited oscillators. */
    amplitudesToPrimes(amplitudes: number[], inputPrimes?: Set<number>): number[];
    /** Excite oscillators corresponding to given primes. */
    excite(primes: number[]): void;
    /** Advance the physics simulation by one timestep; returns the new state. */
    tick(dt?: number): Hypercomplex;
    /** Entropy-minimizing symbolic reasoning via transform search. */
    reason(primes: number[]): ReasonResult;
    /** Check whether the state should collapse (resets the collapse integral on collapse). */
    checkCollapse(): boolean;
    getPhysicsState(): PhysicsState;
    setBackend(backend: Backend): void;
    getBackendInfo(): BackendInfo;
    /** Born-rule measurement of the current state. */
    measure(): { index: number; probability: number };
    reset(): void;
    getHistory(limit?: number): HistoryEntry[];
    runBatch(inputs: unknown[]): EngineResult[];
    /** Continuously evolve state without new input. */
    evolve(steps?: number): EvolveStep[];
  }

  export type BackendType =
    | 'semantic'
    | 'cryptographic'
    | 'crypto'
    | 'scientific'
    | 'science'
    | 'quantum'
    | 'bioinformatics'
    | 'bio'
    | 'dna'
    | 'protein';

  /**
   * Factory function. THROWS on unknown backend type.
   * Config is FLAT; engine options live under config.engineOptions.
   */
  export function createEngine(backendType: BackendType, config?: Record<string, unknown> & { engineOptions?: EngineOptions }): AlephEngine;

  // ============================================
  // Default export namespace (matches engine/index.js default)
  // ============================================

  const engineDefault: {
    AlephEngine: typeof AlephEngine;
    createEngine: typeof createEngine;
  };

  export default engineDefault;
}
