/**
 * Sentient Observer Library
 * 
 * Exports all components for the Sentient Observer implementation
 * based on "A Design for a Sentient Observer" paper.
 * 
 * Components:
 * - SMF: Sedenion Memory Field (16D semantic orientation)
 * - PRSC: Prime Resonance Semantic Computation (oscillator dynamics)
 * - HQE: Holographic Quantum Encoding (distributed memory)
 * - Temporal: Emergent time via coherence events
 * - Entanglement: Semantic binding and phrase segmentation
 * - Memory: Enhanced memory with HQE and temporal indexing
 * - Agency: Attention, goals, and action selection
 * - Boundary: Self/other distinction and I/O
 * - Safety: Constraints, ethics, and monitoring
 * - Core: Unified SentientObserver integration
 */

// Sedenion Memory Field
const { SedenionMemoryField } = require('./smf');

// Prime Resonance Semantic Computation
const { 
    PrimeOscillator, 
    PRSCLayer, 
    EntanglementDetector 
} = require('./prsc');

// Holographic Quantum Encoding
const { 
    HolographicEncoder, 
    HolographicMemory, 
    HolographicSimilarity 
} = require('./hqe');

// Temporal Layer
const { 
    Moment, 
    TemporalLayer, 
    TemporalPatternDetector 
} = require('./temporal');

// Entanglement Layer
const { 
    EntangledPair, 
    Phrase, 
    EntanglementLayer 
} = require('./entanglement');

// Enhanced Memory
const { 
    MemoryTrace, 
    HolographicMemoryBank, 
    TemporalMemoryIndex, 
    EntanglementMemoryIndex, 
    SentientMemory 
} = require('./sentient-memory');

// Agency Layer
const { 
    AttentionFocus, 
    Goal, 
    Action, 
    AgencyLayer 
} = require('./agency');

// Boundary Layer
const {
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    ObjectivityGate,
    BoundaryLayer
} = require('./boundary');

// Safety Layer
const { 
    SafetyConstraint, 
    ViolationEvent, 
    SafetyMonitor, 
    SafetyLayer 
} = require('./safety');

// Sentient Core
const {
    SentientState,
    SentientObserver
} = require('./sentient-core');

// Evaluation Assays (Section 15)
const {
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite
} = require('./assays');

// Legacy exports (for backwards compatibility)
const { AlephChat } = require('./chat');
const { ContextMemory, ImmediateBuffer, SessionMemory, PersistentMemory } = require('./memory');
const { ResponseProcessor } = require('./processor');
const { VocabularyTracker } = require('./vocabulary');
const { StyleProfile } = require('./style');
const { TopicTracker } = require('./topics');
const { ConceptGraph } = require('./concepts');
const { ResponseEnhancer } = require('./enhancer');
const { AlephCore } = require('./core');
const { LMStudioClient } = require('./lmstudio');
const { MarkdownRenderer, formatMarkdown } = require('./markdown');
const { ToolExecutor, executeOpenAIToolCall, processToolCalls } = require('./tools');

module.exports = {
    // Sentient Observer Components
    SedenionMemoryField,
    
    PrimeOscillator,
    PRSCLayer,
    EntanglementDetector,
    
    HolographicEncoder,
    HolographicMemory,
    HolographicSimilarity,
    
    Moment,
    TemporalLayer,
    TemporalPatternDetector,
    
    EntangledPair,
    Phrase,
    EntanglementLayer,
    
    MemoryTrace,
    HolographicMemoryBank,
    TemporalMemoryIndex,
    EntanglementMemoryIndex,
    SentientMemory,
    
    AttentionFocus,
    Goal,
    Action,
    AgencyLayer,
    
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    ObjectivityGate,
    BoundaryLayer,
    
    SafetyConstraint,
    ViolationEvent,
    SafetyMonitor,
    SafetyLayer,
    
    SentientState,
    SentientObserver,
    
    // Evaluation Assays
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite,
    
    // Legacy Components (backwards compatibility)
    AlephChat,
    ContextMemory,
    ImmediateBuffer,
    SessionMemory,
    PersistentMemory,
    ResponseProcessor,
    VocabularyTracker,
    StyleProfile,
    TopicTracker,
    ConceptGraph,
    ResponseEnhancer,
    AlephCore,
    LMStudioClient,
    MarkdownRenderer,
    formatMarkdown,
    ToolExecutor,
    executeOpenAIToolCall,
    processToolCalls
};