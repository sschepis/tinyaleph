/**
 * Prime Resonance Semantic Computation (PRSC)
 * 
 * Re-exports from tinyaleph core library.
 * @see ../../observer/prsc.js for implementation
 * 
 * @module apps/sentient/lib/prsc
 */

// Re-export from library
export {
    PrimeOscillator,
    PRSCLayer,
    EntanglementDetector,
    // Discrete phase dynamics exports
    INT_SINE_TABLE,
    INT_SINE_M,
    INT_SINE_SCALE,
    intSin,
    phaseToIndex,
    indexToPhase,
    computeHistogramCoherence,
    // Stochastic utilities
    gaussianRandom
} from '../../../observer/prsc.js';
