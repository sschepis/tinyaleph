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
const {
    PrimeOscillator,
    PRSCLayer,
    EntanglementDetector,
    coherenceKernel
} = require('./prsc');

const {
    TickGate,
    StabilizationController,
    HolographicEncoder,
    HQE
} = require('./hqe');

const {
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX
} = require('./smf');

const {
    Moment,
    TemporalLayer,
    TemporalPatternDetector
} = require('./temporal');

const {
    AttentionFocus,
    Goal,
    Action,
    Intent,
    AgencyLayer
} = require('./agency');

const {
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    BoundaryLayer
} = require('./boundary');

const {
    EntangledPair,
    Phrase,
    EntanglementLayer
} = require('./entanglement');

const {
    SafetyConstraint,
    ViolationEvent,
    SafetyMonitor,
    DEFAULT_CONSTRAINTS
} = require('./safety');

// Symbolic processing extensions
const {
    SymbolicSMF,
    SMFSymbolMapper,
    smfMapper,
    AXIS_SYMBOL_MAPPING,
    TAG_TO_AXIS
} = require('./symbolic-smf');

const {
    SymbolicMoment,
    SymbolicTemporalLayer,
    SymbolicPatternDetector,
    HEXAGRAM_ARCHETYPES
} = require('./symbolic-temporal');

// Evaluation assays
const {
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite
} = require('./assays');

module.exports = {
    // PRSC - Prime Resonance Semantic Coherence
    PrimeOscillator,
    PRSCLayer,
    EntanglementDetector,
    coherenceKernel,
    
    // HQE - Holographic Quaternion Engine
    TickGate,
    StabilizationController,
    HolographicEncoder,
    HQE,
    
    // SMF - Sedenion Memory Field
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX,
    
    // Temporal - Moment classification
    Moment,
    TemporalLayer,
    TemporalPatternDetector,
    
    // Agency - Goals and intentions
    AttentionFocus,
    Goal,
    Action,
    Intent,
    AgencyLayer,
    
    // Boundary - Self-other differentiation
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    BoundaryLayer,
    
    // Entanglement - Semantic phrase coherence
    EntangledPair,
    Phrase,
    EntanglementLayer,
    
    // Safety - Constraint monitoring
    SafetyConstraint,
    ViolationEvent,
    SafetyMonitor,
    DEFAULT_CONSTRAINTS,
    
    // Symbolic SMF - Symbol-grounded semantic field
    SymbolicSMF,
    SMFSymbolMapper,
    smfMapper,
    AXIS_SYMBOL_MAPPING,
    TAG_TO_AXIS,
    
    // Symbolic Temporal - I-Ching moment classification
    SymbolicMoment,
    SymbolicTemporalLayer,
    SymbolicPatternDetector,
    HEXAGRAM_ARCHETYPES,
    
    // Assays - Validation tests
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite
};