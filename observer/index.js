/**
 * tinyaleph Observer Module
 * 
 * Provides components for implementing sentient observer systems:
 * - PRSC: Prime Resonance Semantic Coherence (oscillator bank)
 * - HQE: Holographic Quaternion Engine (entropy dynamics)
 * - SMF: Sedenion Memory Field (16D semantic orientation)
 * - Temporal: Moment classification and time dilation
 * - Agency: Goals, attention, and intention
 * - Boundary: Self-other differentiation
 * - Entanglement: Semantic phrase coherence
 * - Safety: Constraint monitoring
 * - Symbolic: Symbol grounding and I-Ching classification
 * - Assays: Validation tests from whitepaper Section 15
 */

// Core observer components
import {
  PrimeOscillator, PRSCLayer, EntanglementDetector,
  computeHistogramCoherence, gaussianRandom, indexToPhase, intSin, phaseToIndex,
  INT_SINE_M, INT_SINE_SCALE, INT_SINE_TABLE
} from './prsc.js';

import {
  TickGate, StabilizationController, HolographicEncoder,
  HolographicMemory, HolographicSimilarity
} from './hqe.js';

import {
  SedenionMemoryField, SMF_AXES, AXIS_INDEX,
  SMF_CODEBOOK, CODEBOOK_SIZE, codebookTunnel, getTunnelingCandidates, nearestCodebookAttractor
} from './smf.js';

import { Moment, TemporalLayer, TemporalPatternDetector } from './temporal.js';

import { AttentionFocus, Goal, Action, AgencyLayer } from './agency.js';

import {
  SensoryChannel, MotorChannel, EnvironmentalModel, SelfModel,
  BoundaryLayer, ObjectivityGate
} from './boundary.js';

import { EntangledPair, Phrase, EntanglementLayer } from './entanglement.js';

import { SafetyConstraint, ViolationEvent, SafetyMonitor, SafetyLayer } from './safety.js';

// Symbolic processing extensions
import {
  SymbolicSMF, SMFSymbolMapper, smfMapper, AXIS_SYMBOL_MAPPING, TAG_TO_AXIS,
  createSymbolicSMF, fromSMF, symbolToSMF, symbolsToSMF
} from './symbolic-smf.js';

import {
  SymbolicMoment, SymbolicTemporalLayer, SymbolicPatternDetector,
  HEXAGRAM_ARCHETYPES, FIRST_64_PRIMES, PHI
} from './symbolic-temporal.js';

// Evaluation assays
import {
  TimeDilationAssay, MemoryContinuityAssay, AgencyConstraintAssay,
  NonCommutativeMeaningAssay, AssaySuite
} from './assays.js';

export {
  // PRSC - Prime Resonance Semantic Coherence
  PrimeOscillator,
  PRSCLayer,
  EntanglementDetector,
  computeHistogramCoherence,
  gaussianRandom,
  indexToPhase,
  intSin,
  phaseToIndex,
  INT_SINE_M,
  INT_SINE_SCALE,
  INT_SINE_TABLE,

  // HQE - Holographic Quaternion Engine
  TickGate,
  StabilizationController,
  HolographicEncoder,
  HolographicMemory,
  HolographicSimilarity,

  // SMF - Sedenion Memory Field
  SedenionMemoryField,
  SMF_AXES,
  AXIS_INDEX,
  SMF_CODEBOOK,
  CODEBOOK_SIZE,
  codebookTunnel,
  getTunnelingCandidates,
  nearestCodebookAttractor,

  // Temporal - Moment classification
  Moment,
  TemporalLayer,
  TemporalPatternDetector,

  // Agency - Goals and intentions
  AttentionFocus,
  Goal,
  Action,
  AgencyLayer,

  // Boundary - Self-other differentiation
  SensoryChannel,
  MotorChannel,
  EnvironmentalModel,
  SelfModel,
  BoundaryLayer,
  ObjectivityGate,

  // Entanglement - Semantic phrase coherence
  EntangledPair,
  Phrase,
  EntanglementLayer,

  // Safety - Constraint monitoring
  SafetyConstraint,
  ViolationEvent,
  SafetyMonitor,
  SafetyLayer,

  // Symbolic SMF - Symbol-grounded semantic field
  SymbolicSMF,
  SMFSymbolMapper,
  smfMapper,
  AXIS_SYMBOL_MAPPING,
  TAG_TO_AXIS,
  createSymbolicSMF,
  fromSMF,
  symbolToSMF,
  symbolsToSMF,

  // Symbolic Temporal - I-Ching moment classification
  SymbolicMoment,
  SymbolicTemporalLayer,
  SymbolicPatternDetector,
  HEXAGRAM_ARCHETYPES,
  FIRST_64_PRIMES,
  PHI,

  // Assays - Validation tests
  TimeDilationAssay,
  MemoryContinuityAssay,
  AgencyConstraintAssay,
  NonCommutativeMeaningAssay,
  AssaySuite
};

export default {
  // PRSC
  PrimeOscillator,
  PRSCLayer,
  EntanglementDetector,
  computeHistogramCoherence,

  // HQE
  TickGate,
  StabilizationController,
  HolographicEncoder,
  HolographicMemory,
  HolographicSimilarity,

  // SMF
  SedenionMemoryField,
  SMF_AXES,
  AXIS_INDEX,

  // Temporal
  Moment,
  TemporalLayer,
  TemporalPatternDetector,

  // Agency
  AttentionFocus,
  Goal,
  Action,
  AgencyLayer,

  // Boundary
  SensoryChannel,
  MotorChannel,
  EnvironmentalModel,
  SelfModel,
  BoundaryLayer,
  ObjectivityGate,

  // Entanglement
  EntangledPair,
  Phrase,
  EntanglementLayer,

  // Safety
  SafetyConstraint,
  ViolationEvent,
  SafetyMonitor,
  SafetyLayer,

  // Symbolic SMF
  SymbolicSMF,
  SMFSymbolMapper,
  smfMapper,
  AXIS_SYMBOL_MAPPING,
  TAG_TO_AXIS,
  createSymbolicSMF,
  fromSMF,
  symbolToSMF,
  symbolsToSMF,

  // Symbolic Temporal
  SymbolicMoment,
  SymbolicTemporalLayer,
  SymbolicPatternDetector,
  HEXAGRAM_ARCHETYPES,
  FIRST_64_PRIMES,
  PHI,

  // Assays
  TimeDilationAssay,
  MemoryContinuityAssay,
  AgencyConstraintAssay,
  NonCommutativeMeaningAssay,
  AssaySuite
};
