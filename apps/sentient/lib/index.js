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
 *
 * Enhanced with formal semantics from core modules:
 * - TypeChecker: Formal type inference (Γ ⊢ e : T)
 * - ReductionSystem: Strong normalization with proofs
 * - Translator: λ-calculus model-theoretic semantics
 * - EnochianVocabulary: Full 21-letter alphabet and vocabulary
 */

// Sedenion Memory Field
import { SedenionMemoryField } from './smf.js';

// Prime Resonance Semantic Computation
import { 
    PrimeOscillator, 
    PRSCLayer, 
    EntanglementDetector 
} from './prsc.js';

// Holographic Quantum Encoding
import { 
    HolographicEncoder, 
    HolographicMemory, 
    HolographicSimilarity 
} from './hqe.js';

// Temporal Layer
import { 
    Moment, 
    TemporalLayer, 
    TemporalPatternDetector 
} from './temporal.js';

// Entanglement Layer
import { 
    EntangledPair, 
    Phrase, 
    EntanglementLayer 
} from './entanglement.js';

// Enhanced Memory
import { 
    MemoryTrace, 
    HolographicMemoryBank, 
    TemporalMemoryIndex, 
    EntanglementMemoryIndex, 
    SentientMemory 
} from './sentient-memory.js';

// Agency Layer
import { 
    AttentionFocus, 
    Goal, 
    Action, 
    AgencyLayer 
} from './agency.js';

// Boundary Layer
import {
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    ObjectivityGate,
    BoundaryLayer
} from './boundary.js';

// Safety Layer
import { 
    SafetyConstraint, 
    ViolationEvent, 
    SafetyMonitor, 
    SafetyLayer 
} from './safety.js';

// Sentient Core
import {
    SentientState,
    SentientObserver
} from './sentient-core.js';

// Symbolic Extensions (v1.3.0)
import {
    SymbolicSMF,
    SMFSymbolMapper,
    AXIS_SYMBOL_MAPPING,
    TAG_TO_AXIS
} from './symbolic-smf.js';

import {
    SymbolicMoment,
    SymbolicTemporalLayer,
    SymbolicPatternDetector,
    HEXAGRAM_ARCHETYPES
} from './symbolic-temporal.js';

import {
    SymbolicState,
    SymbolicObserver
} from './symbolic-observer.js';

// Evaluation Assays (Section 15)
import {
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite
} from './assays.js';

// Prime Calculus Kernel (Section 6) - Enhanced with formal semantics
import {
    TermType,
    NounTerm,
    AdjTerm,
    ChainTerm,
    FusionTerm,
    SeqTerm,
    ImplTerm,
    UndefinedTerm,
    PrimeCalculusEvaluator,
    PrimeCalculusVerifier,
    PrimeCalculusBuilder,
    SemanticObject,
    // Re-exported formal semantics
    TypeChecker,
    Types,
    ReductionSystem,
    ResonancePrimeOperator as ResonanceOperator,
    NextPrimeOperator,
    ModularPrimeOperator as ModularOperator,
    IdentityPrimeOperator as IdentityOperator,
    demonstrateStrongNormalization,
    testLocalConfluence,
    Translator,
    LambdaEvaluator,
    Semantics
} from './prime-calculus.js';

// Enochian Packet Layer (Section 7.4) - Enhanced with vocabulary
import {
    ENOCHIAN_PRIMES,
    MODES,
    twistAngle,
    totalTwist,
    isTwistClosed,
    EnochianSymbol,
    EnochianPacket,
    EnochianEncoder,
    EnochianDecoder,
    EnochianPacketBuilder,
    // Enhanced classes
    EnhancedEnochianEncoder,
    EnhancedEnochianDecoder,
    // Vocabulary re-exports
    EnochianVocabulary,
    ENOCHIAN_ALPHABET,
    PRIME_BASIS,
    CORE_VOCABULARY,
    THE_NINETEEN_CALLS,
    EnochianWord,
    EnochianCall,
    EnochianEngine,
    SedenionElement,
    TwistOperator,
    validateTwistClosure
} from './enochian.js';

// Distributed Sentience Network (Section 7)
import {
    LocalField,
    Proposal,
    ProposalLog,
    GlobalMemoryField,
    CoherentCommitProtocol,
    PRRCChannel,
    NetworkSynchronizer,
    DSNNode,
    generateNodeId,
    SEMANTIC_DOMAINS,
    FIRST_100_PRIMES
} from './network.js';

// Intelligence Scaling Modules
import {
    FusionDiscoveryEngine,
    ReinforcedEntanglementLayer,
    calculateAbstractionLevel,
    calculateReasoningDepth
} from './abstraction.js';

import {
    WisdomAggregator,
    ConceptFormation,
    CompositeIntelligenceScore,
    calculateAmplificationFactor,
    calculateCoherenceEfficiency
} from './collective.js';

// Legacy exports (for backwards compatibility)
import { AlephChat } from './chat.js';
import { ContextMemory, ImmediateBuffer, SessionMemory, PersistentMemory } from './memory.js';
import { ResponseProcessor } from './processor.js';
import { VocabularyManager as VocabularyTracker } from './vocabulary.js';
import { StyleProfiler as StyleProfile } from './style.js';
import { TopicTracker } from './topics.js';
import { ConceptGraph } from './concepts.js';
import { PromptEnhancer as ResponseEnhancer } from './enhancer.js';
import { AlephSemanticCore as AlephCore } from './core.js';
import { LMStudioClient } from './lmstudio.js';
import { MarkdownRenderer, formatMarkdown } from './markdown.js';
import { ToolExecutor, executeOpenAIToolCall, processToolCalls } from './tools.js';

// Resolang WASM Integration
import {
    ResolangLoader,
    ResolangPipeline,
    ResolangSMF,
    initResolang,
    createPipeline
} from './resolang.js';

// Agent Module (Agentic Behavior)
import {
    TaskStatus,
    StepStatus,
    ComplexityIndicators,
    TaskStep,
    Task,
    TaskPlanner,
    ComplexityAnalyzer,
    StepExecutor,
    Agent,
    createAgent
} from './agent.js';

export {
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
    
    // Symbolic Extensions (v1.3.0 - tinyaleph symbolic integration)
    SymbolicSMF,
    SMFSymbolMapper,
    AXIS_SYMBOL_MAPPING,
    TAG_TO_AXIS,
    
    SymbolicMoment,
    SymbolicTemporalLayer,
    SymbolicPatternDetector,
    HEXAGRAM_ARCHETYPES,
    
    SymbolicState,
    SymbolicObserver,
    
    // Evaluation Assays
    TimeDilationAssay,
    MemoryContinuityAssay,
    AgencyConstraintAssay,
    NonCommutativeMeaningAssay,
    AssaySuite,
    
    // Prime Calculus Kernel (Section 6)
    TermType,
    NounTerm,
    AdjTerm,
    ChainTerm,
    FusionTerm,
    SeqTerm,
    ImplTerm,
    UndefinedTerm,
    PrimeCalculusEvaluator,
    PrimeCalculusVerifier,
    PrimeCalculusBuilder,
    SemanticObject,
    
    // Formal Semantics (from core modules, re-exported via prime-calculus)
    TypeChecker,
    Types,
    ReductionSystem,
    ResonanceOperator,
    NextPrimeOperator,
    ModularOperator,
    IdentityOperator,
    demonstrateStrongNormalization,
    testLocalConfluence,
    Translator,
    LambdaEvaluator,
    Semantics,
    
    // Enochian Packet Layer (Section 7.4)
    ENOCHIAN_PRIMES,
    MODES,
    twistAngle,
    totalTwist,
    isTwistClosed,
    EnochianSymbol,
    EnochianPacket,
    EnochianEncoder,
    EnochianDecoder,
    EnochianPacketBuilder,
    
    // Enhanced Enochian with Vocabulary
    EnhancedEnochianEncoder,
    EnhancedEnochianDecoder,
    EnochianVocabulary,
    ENOCHIAN_ALPHABET,
    PRIME_BASIS,
    CORE_VOCABULARY,
    THE_NINETEEN_CALLS,
    EnochianWord,
    EnochianCall,
    EnochianEngine,
    SedenionElement,
    TwistOperator,
    validateTwistClosure,
    
    // Distributed Sentience Network (Section 7)
    LocalField,
    Proposal,
    ProposalLog,
    GlobalMemoryField,
    CoherentCommitProtocol,
    PRRCChannel,
    NetworkSynchronizer,
    DSNNode,
    generateNodeId,
    SEMANTIC_DOMAINS,
    FIRST_100_PRIMES,
    
    // Intelligence Scaling - Abstraction
    FusionDiscoveryEngine,
    ReinforcedEntanglementLayer,
    calculateAbstractionLevel,
    calculateReasoningDepth,
    
    // Intelligence Scaling - Collective
    WisdomAggregator,
    ConceptFormation,
    CompositeIntelligenceScore,
    calculateAmplificationFactor,
    calculateCoherenceEfficiency,
    
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
    processToolCalls,
    
    // Resolang WASM Integration
    ResolangLoader,
    ResolangPipeline,
    ResolangSMF,
    initResolang,
    createPipeline,
    
    // Agent Module (Agentic Behavior)
    TaskStatus,
    StepStatus,
    ComplexityIndicators,
    TaskStep,
    Task,
    TaskPlanner,
    ComplexityAnalyzer,
    StepExecutor,
    Agent,
    createAgent
};
