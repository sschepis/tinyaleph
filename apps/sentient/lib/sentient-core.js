/**
 * Sentient Core
 * 
 * The unified integration of all components into a Sentient Observer
 * as specified in "A Design for a Sentient Observer" paper.
 * 
 * This module orchestrates:
 * - PRSC oscillator dynamics (runtime substrate)
 * - SMF semantic orientation (16D meaning space)
 * - HQE holographic memory (distributed storage)
 * - Temporal layer (emergent time)
 * - Entanglement layer (semantic binding)
 * - Agency layer (attention, goals, actions)
 * - Boundary layer (self/other distinction)
 * - Safety layer (constraints and ethics)
 * 
 * The processing loop runs continuously, with discrete moments
 * emerging from coherence events rather than external clock time.
 */

const { SedenionMemoryField } = require('./smf');
const { PRSCLayer, PrimeOscillator, EntanglementDetector } = require('./prsc');
const { HolographicEncoder, HolographicMemory } = require('./hqe');
const { Moment, TemporalLayer, TemporalPatternDetector } = require('./temporal');
const { EntanglementLayer, Phrase, EntangledPair } = require('./entanglement');
const { SentientMemory, MemoryTrace } = require('./sentient-memory');
const { AgencyLayer, Goal, Action } = require('./agency');
const { BoundaryLayer, SelfModel, EnvironmentalModel } = require('./boundary');
const { SafetyLayer, SafetyMonitor } = require('./safety');

const { Complex, PrimeState } = require('../../../core/hilbert');
const { firstNPrimes } = require('../../../core/prime');

/**
 * Sentient Observer State
 * 
 * Captures the complete state of the observer at a moment in time.
 */
class SentientState {
    constructor(data = {}) {
        this.timestamp = data.timestamp || Date.now();
        
        // Core metrics
        this.coherence = data.coherence || 0;
        this.entropy = data.entropy || 0;
        this.totalAmplitude = data.totalAmplitude || 0;
        
        // Component states
        this.smfOrientation = data.smfOrientation || null;
        this.activePrimes = data.activePrimes || [];
        this.momentId = data.momentId || null;
        this.phraseId = data.phraseId || null;
        
        // Agency state
        this.topFocus = data.topFocus || null;
        this.topGoal = data.topGoal || null;
        this.processingLoad = data.processingLoad || 0;
        
        // Safety state
        this.safetyLevel = data.safetyLevel || 'normal';
        
        // Content being processed
        this.currentInput = data.currentInput || null;
        this.currentOutput = data.currentOutput || null;
    }
    
    toJSON() {
        return {
            timestamp: this.timestamp,
            coherence: this.coherence,
            entropy: this.entropy,
            totalAmplitude: this.totalAmplitude,
            smfOrientation: this.smfOrientation,
            activePrimes: this.activePrimes,
            momentId: this.momentId,
            phraseId: this.phraseId,
            topFocus: this.topFocus,
            topGoal: this.topGoal,
            processingLoad: this.processingLoad,
            safetyLevel: this.safetyLevel
        };
    }
}

/**
 * Sentient Observer
 * 
 * The main class integrating all components into a unified conscious-like system.
 */
class SentientObserver {
    /**
     * Create a Sentient Observer
     * @param {Object} backend - TinyAleph semantic backend
     * @param {Object} options - Configuration options
     */
    constructor(backend, options = {}) {
        this.backend = backend;
        
        // Configuration
        this.primeCount = options.primeCount || 64;
        this.primes = firstNPrimes(this.primeCount);
        this.tickRate = options.tickRate || 60;  // Hz
        this.dt = 1 / this.tickRate;
        
        // Initialize all layers
        this.initializeLayers(options);
        
        // State
        this.running = false;
        this.tickCount = 0;
        this.startTime = null;
        this.currentState = new SentientState();
        
        // History
        this.stateHistory = [];
        this.maxHistory = options.maxHistory || 100;
        
        // Processing queue
        this.inputQueue = [];
        this.outputQueue = [];
        
        // Callbacks
        this.onMoment = options.onMoment || null;
        this.onOutput = options.onOutput || null;
        this.onStateChange = options.onStateChange || null;
        
        // Loop control
        this.loopTimer = null;
    }
    
    /**
     * Initialize all component layers
     */
    initializeLayers(options) {
        // PRSC Oscillator Layer
        this.prsc = new PRSCLayer(this.primes, {
            speed: options.prscSpeed || 1.0,
            damp: options.prscDamp || 0.02,
            coupling: options.prscCoupling || 0.3,
            dt: this.dt
        });
        
        // Sedenion Memory Field
        this.smf = new SedenionMemoryField();
        
        // Holographic Encoder
        this.hqe = new HolographicEncoder(
            options.holoGridSize || 32,
            this.primes,
            { wavelengthScale: options.wavelengthScale || 10 }
        );
        
        // Temporal Layer
        this.temporal = new TemporalLayer({
            coherenceThreshold: options.coherenceThreshold || 0.7,
            entropyMin: options.entropyMin || 0.1,
            entropyMax: options.entropyMax || 0.9,
            onMoment: (moment) => this.handleMoment(moment)
        });
        
        // Entanglement Layer
        this.entanglement = new EntanglementLayer({
            entanglementThreshold: options.entanglementThreshold || 0.7,
            onPhraseComplete: (phrase) => this.handlePhraseComplete(phrase)
        });
        
        // Sentient Memory
        this.memory = new SentientMemory({
            storePath: options.memoryPath,
            maxTraces: options.maxMemoryTraces || 1000,
            primes: this.primeCount
        });
        
        // Agency Layer
        this.agency = new AgencyLayer({
            maxFoci: options.maxFoci || 5,
            maxGoals: options.maxGoals || 10,
            onGoalCreated: (goal) => this.handleGoalCreated(goal),
            onActionSelected: (action) => this.handleActionSelected(action)
        });
        
        // Boundary Layer
        this.boundary = new BoundaryLayer({
            name: options.name || 'Sentient Observer',
            onInput: (channel, data) => this.handleInput(channel, data),
            onOutput: (channel, data) => this.handleOutput(channel, data)
        });
        
        // Safety Layer
        this.safety = new SafetyLayer({
            onViolation: (event, violation) => this.handleSafetyViolation(event, violation),
            onEmergency: (reason) => this.handleEmergency(reason)
        });
        
        // Pattern detector
        this.patternDetector = new TemporalPatternDetector();
        
        // Entanglement detector
        this.entanglementDetector = new EntanglementDetector();
    }
    
    /**
     * Start the observer
     */
    start() {
        if (this.running) return;
        
        this.running = true;
        this.startTime = Date.now();
        
        console.log('[SentientObserver] Starting...');
        
        // Start the main processing loop
        this.loopTimer = setInterval(() => this.tick(), 1000 / this.tickRate);
    }
    
    /**
     * Stop the observer
     */
    stop() {
        if (!this.running) return;
        
        this.running = false;
        
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
        
        console.log('[SentientObserver] Stopped');
    }
    
    /**
     * Main processing tick
     */
    tick() {
        if (!this.running) return;
        if (this.safety.emergencyShutdown) {
            this.stop();
            return;
        }
        
        this.tickCount++;
        
        try {
            // 1. Process any queued input
            this.processInputQueue();
            
            // 2. Evolve oscillators
            const coherence = this.prsc.tick(this.dt);
            
            // 3. Get system metrics
            const entropy = this.prsc.amplitudeEntropy();
            const totalAmplitude = this.prsc.totalEnergy();
            const activePrimes = this.prsc.activePrimes(0.1);
            const phases = this.prsc.getPhases();
            
            // 4. Update SMF from oscillator activity
            this.smf.updateFromPrimeActivity(
                this.prsc.toSemanticState(),
                this.prsc.oscillators
            );
            
            // 4.5. Evolve HQE with dynamic λ(t) stabilization (equation 11-12)
            const smfEntropy = this.smf.smfEntropy();
            const hqeEvolution = this.hqe.evolve({
                coherence,
                entropy,
                smfEntropy
            }, this.dt);
            
            // 5. Update temporal layer (may trigger moment)
            const temporalUpdate = this.temporal.update({
                coherence,
                entropy,
                phases,
                activePrimes,
                smf: this.smf,
                amplitudes: this.prsc.getAmplitudes(),
                semanticContent: this.currentState.currentInput
            });
            
            // 6. Update entanglement layer
            const entanglementUpdate = this.entanglement.update({
                oscillators: this.prsc.oscillators,
                coherence,
                energy: totalAmplitude,
                semanticContent: this.currentState.currentInput
            });
            
            // 7. Update agency layer
            const agencyUpdate = this.agency.update({
                prsc: this.prsc,
                smf: this.smf,
                coherence,
                entropy,
                activePrimes
            });
            
            // 8. Update boundary layer self-model
            this.boundary.updateSelf(this.smf, {
                processing: this.inputQueue.length > 0,
                emotionalState: this.agency.selfModel.emotionalValence > 0 ? 'positive' : 
                               this.agency.selfModel.emotionalValence < 0 ? 'negative' : 'neutral'
            });
            
            // 9. Safety check
            const safetyResult = this.safety.checkConstraints({
                coherence,
                entropy,
                totalAmplitude,
                smf: this.smf,
                processingLoad: agencyUpdate.processingLoad,
                goals: this.agency.goals
            });
            
            // 10. Apply corrections if needed
            if (!safetyResult.safe) {
                this.applySafetyCorrections(safetyResult);
            }
            
            // 11. Process any ready outputs
            this.processOutputQueue();
            
            // 12. Update current state
            this.currentState = new SentientState({
                coherence,
                entropy,
                totalAmplitude,
                smfOrientation: this.smf.s.slice(),
                activePrimes,
                momentId: this.temporal.currentMoment?.id,
                phraseId: this.entanglement.currentPhrase?.id,
                topFocus: agencyUpdate.foci[0]?.target,
                topGoal: agencyUpdate.activeGoals[0]?.description,
                processingLoad: agencyUpdate.processingLoad,
                safetyLevel: safetyResult.alertLevel,
                currentInput: this.currentState.currentInput,
                currentOutput: this.currentState.currentOutput
            });
            
            // 13. Record to history
            this.recordState();
            
            // 14. Notify listeners
            if (this.onStateChange && this.tickCount % 10 === 0) {
                this.onStateChange(this.currentState);
            }
            
        } catch (error) {
            console.error('[SentientObserver] Tick error:', error);
            this.safety.monitor.alerts.push({
                type: 'tick_error',
                severity: 'high',
                message: error.message,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Process text input through the observer
     */
    processText(text) {
        // Encode to prime state
        const primeState = this.backend.textToOrderedState(text);
        
        // Queue for processing
        this.inputQueue.push({
            type: 'text',
            content: text,
            primeState,
            timestamp: Date.now()
        });
        
        return this.inputQueue.length;
    }
    
    /**
     * Process queued inputs
     */
    processInputQueue() {
        if (this.inputQueue.length === 0) return;
        
        // Process one input per tick
        const input = this.inputQueue.shift();
        
        // Update boundary layer
        this.boundary.processInput('text_input', input.content);
        
        // Excite corresponding oscillators
        if (input.primeState && input.primeState.state) {
            // primeState is an OrderedPrimeState with a .state Map
            const stateMap = input.primeState.state;
            for (const prime of this.primes) {
                const amp = stateMap.get(prime);
                if (amp) {
                    const osc = this.prsc.getOscillator(prime);
                    if (osc) {
                        // amp is a Complex number
                        const magnitude = typeof amp.norm === 'function' ? amp.norm() : Math.abs(amp);
                        osc.excite(magnitude * 0.5);
                        if (typeof amp.phase === 'function') {
                            osc.phase = (osc.phase + amp.phase()) / 2;
                        }
                    }
                }
            }
        }
        
        // Store current input for context
        this.currentState.currentInput = {
            type: input.type,
            content: input.content,
            timestamp: input.timestamp
        };
        
        // Create memory trace
        this.memory.store(input.content, {
            type: 'input',
            primeState: input.primeState,
            activePrimes: this.prsc.activePrimes(0.1),
            momentId: this.temporal.currentMoment?.id,
            phraseId: this.entanglement.currentPhrase?.id,
            smf: this.smf,
            importance: 0.6
        });
    }
    
    /**
     * Generate output based on current state
     */
    generateOutput(format = 'text') {
        // Get semantic state
        const semanticState = this.prsc.toSemanticState();
        
        // Project to holographic field for storage
        this.hqe.project(semanticState);
        
        // Get active primes for output
        const activePrimes = this.prsc.activePrimes(0.2);
        
        // Recall relevant memories
        const memories = this.memory.recallBySimilarity(semanticState, {
            threshold: 0.3,
            maxResults: 3
        });
        
        // Get SMF-based semantic direction
        const smfContext = this.smf.dominantAxes(3);
        
        // Build output context
        const outputContext = {
            activePrimes,
            smfAxes: smfContext,
            memories: memories.map(m => m.trace.content),
            coherence: this.currentState.coherence,
            topGoal: this.agency.getTopGoal()?.description,
            topFocus: this.agency.getTopFocus()?.target
        };
        
        // Queue output
        this.outputQueue.push({
            format,
            context: outputContext,
            semanticState,
            timestamp: Date.now()
        });
        
        return outputContext;
    }
    
    /**
     * Process output queue
     */
    processOutputQueue() {
        const outputs = this.boundary.getReadyOutputs();
        
        for (const output of outputs) {
            this.currentState.currentOutput = output;
            
            if (this.onOutput) {
                this.onOutput(output);
            }
        }
    }
    
    /**
     * Handle a new moment
     */
    handleMoment(moment) {
        // Store moment in memory (silently)
        this.memory.store({
            type: 'moment',
            trigger: moment.trigger,
            coherence: moment.coherence,
            activePrimes: moment.activePrimes
        }, {
            type: 'experience',
            momentId: moment.id,
            smf: this.smf,
            importance: 0.7
        });
        
        // Add continuity marker to self-model
        this.boundary.self.addContinuityMarker({
            type: 'moment',
            momentId: moment.id,
            trigger: moment.trigger
        });
        
        if (this.onMoment) {
            this.onMoment(moment);
        }
    }
    
    /**
     * Handle phrase completion
     */
    handlePhraseComplete(phrase) {
        // Silently handle phrase completion
        
        // Link memories within this phrase
        const phraseMemories = Array.from(this.memory.traces.values())
            .filter(t => t.phraseId === phrase.id);
        
        for (let i = 0; i < phraseMemories.length - 1; i++) {
            this.memory.linkMemories(phraseMemories[i].id, phraseMemories[i + 1].id);
        }
    }
    
    /**
     * Handle goal creation
     */
    handleGoalCreated(goal) {
        // Store in memory (silently)
        this.memory.store({
            type: 'goal',
            goalId: goal.id,
            description: goal.description
        }, {
            type: 'decision',
            smf: this.smf,
            importance: 0.8
        });
    }
    
    /**
     * Handle action selection
     */
    handleActionSelected(action) {
        // Check safety before executing (silently)
        const permissible = this.safety.isActionPermissible(action, this.currentState);
        
        if (!permissible.permissible) {
            action.fail(permissible.reason);
            return;
        }
        
        // Execute if internal
        if (action.type === 'internal') {
            this.agency.executeAction(action, (a) => {
                // Internal action execution
                if (a.targetPrimes && a.targetPrimes.length > 0) {
                    this.prsc.excite(a.targetPrimes, 0.3);
                }
                return { success: true };
            });
        }
    }
    
    /**
     * Handle input from boundary
     */
    handleInput(channel, data) {
        // Log to environmental model (silently)
        this.boundary.updateEnvironment({
            context: {
                lastInputChannel: channel,
                lastInputTime: Date.now()
            }
        });
    }
    
    /**
     * Handle output from boundary
     */
    handleOutput(channel, data) {
        // Store output in memory (silently)
        this.memory.store({
            type: 'output',
            channel,
            content: data
        }, {
            type: 'experience',
            momentId: this.temporal.currentMoment?.id,
            smf: this.smf,
            importance: 0.5
        });
    }
    
    /**
     * Handle safety violation
     */
    handleSafetyViolation(event, violation) {
        // Log to metacognition (silently - warnings are throttled in safety layer)
        this.agency.logMetacognitive('safety_violation', violation.constraint.name);
    }
    
    /**
     * Handle emergency shutdown
     */
    handleEmergency(reason) {
        console.error(`[SentientObserver] EMERGENCY: ${reason}`);
        this.stop();
    }
    
    /**
     * Apply safety corrections
     */
    applySafetyCorrections(safetyResult) {
        for (const violation of safetyResult.violations) {
            const correction = this.safety.getCorrection(violation.constraint.name, this.currentState);
            
            if (correction) {
                switch (correction.action) {
                    case 'increase_coupling':
                        this.prsc.K = Math.min(1.0, this.prsc.K * correction.factor);
                        break;
                    case 'increase_damping':
                        this.prsc.damp = Math.min(0.5, this.prsc.damp * correction.factor);
                        break;
                    case 'normalize_smf':
                        this.smf.normalize();
                        break;
                }
            }
        }
    }
    
    /**
     * Record current state to history
     */
    recordState() {
        this.stateHistory.push(this.currentState.toJSON());
        
        if (this.stateHistory.length > this.maxHistory) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * Get current state
     */
    getState() {
        return this.currentState;
    }
    
    /**
     * Get comprehensive status
     */
    getStatus() {
        return {
            running: this.running,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            tickCount: this.tickCount,
            state: this.currentState.toJSON(),
            temporal: this.temporal.getStats(),
            entanglement: this.entanglement.getStats(),
            memory: this.memory.getStats(),
            agency: this.agency.getStats(),
            boundary: this.boundary.getStats(),
            safety: this.safety.getStats()
        };
    }
    
    /**
     * Get introspection report
     */
    introspect() {
        return {
            identity: this.boundary.self.toJSON(),
            currentMoment: this.temporal.currentMoment?.toJSON(),
            currentPhrase: this.entanglement.currentPhrase?.toJSON(),
            smfOrientation: {
                components: this.smf.s.slice(),
                dominantAxes: this.smf.dominantAxes(3),
                entropy: this.smf.smfEntropy()
            },
            attention: this.agency.attentionFoci.map(f => f.toJSON()),
            goals: this.agency.goals.filter(g => g.isActive).map(g => g.toJSON()),
            metacognition: {
                processingLoad: this.agency.selfModel.processingLoad,
                emotionalValence: this.agency.selfModel.emotionalValence,
                confidenceLevel: this.agency.selfModel.confidenceLevel
            },
            recentMoments: this.temporal.recentMoments(5).map(m => m.toJSON()),
            recentMemories: this.memory.getRecent(5).map(t => t.toJSON()),
            safetyReport: this.safety.generateReport()
        };
    }
    
    /**
     * Reset the observer to initial state
     */
    reset() {
        this.stop();
        
        this.prsc.reset(true);
        this.smf = new SedenionMemoryField();
        this.hqe.clearField();
        this.temporal.reset();
        this.entanglement.reset();
        this.memory.clear();
        this.agency.reset();
        this.boundary.reset();
        this.safety.reset();
        
        this.tickCount = 0;
        this.startTime = null;
        this.currentState = new SentientState();
        this.stateHistory = [];
        this.inputQueue = [];
        this.outputQueue = [];
    }
    
    /**
     * Save state to JSON
     */
    toJSON() {
        return {
            config: {
                primeCount: this.primeCount,
                tickRate: this.tickRate
            },
            prsc: this.prsc.toJSON(),
            smf: this.smf.toJSON(),
            temporal: this.temporal.toJSON(),
            entanglement: this.entanglement.toJSON(),
            agency: this.agency.toJSON(),
            boundary: this.boundary.toJSON(),
            safety: this.safety.toJSON(),
            state: this.currentState.toJSON(),
            tickCount: this.tickCount
        };
    }
    
    /**
     * Load state from JSON
     */
    loadFromJSON(data) {
        if (data.prsc) {
            this.prsc.loadState(data.prsc);
        }
        if (data.smf) {
            this.smf.loadFromJSON(data.smf);
        }
        if (data.temporal) {
            this.temporal.loadFromJSON(data.temporal);
        }
        if (data.entanglement) {
            this.entanglement.loadFromJSON(data.entanglement);
        }
        if (data.agency) {
            this.agency.loadFromJSON(data.agency);
        }
        if (data.boundary) {
            this.boundary.loadFromJSON(data.boundary);
        }
        if (data.safety) {
            this.safety.loadFromJSON(data.safety);
        }
        if (data.tickCount) {
            this.tickCount = data.tickCount;
        }
    }
}

module.exports = {
    SentientState,
    SentientObserver
};