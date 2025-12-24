/**
 * Boundary Layer
 * 
 * Implements the observer-environment boundary from "A Design for a 
 * Sentient Observer" paper, Section 6.
 * 
 * Key features:
 * - Self/other distinction via SMF orientation
 * - Internal vs external state separation
 * - Sensory processing and integration
 * - Motor output encoding
 * - Environmental model maintenance
 */

const { SedenionMemoryField } = require('./smf');

/**
 * Sensory Channel - Input from the environment
 */
class SensoryChannel {
    constructor(data = {}) {
        this.id = data.id || SensoryChannel.generateId();
        this.name = data.name || 'unknown';
        this.type = data.type || 'text'; // 'text' | 'numeric' | 'embedding' | 'event'
        this.enabled = data.enabled !== false;
        
        // Current state
        this.currentValue = null;
        this.lastUpdate = null;
        this.updateCount = 0;
        
        // Prime mapping for this channel
        this.associatedPrimes = data.associatedPrimes || [];
        
        // Processing parameters
        this.sensitivity = data.sensitivity || 1.0;
        this.adaptationRate = data.adaptationRate || 0.1;
        this.baseline = data.baseline || 0;
    }
    
    static generateId() {
        return `sens_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * Update channel with new input
     */
    update(value) {
        const prev = this.currentValue;
        this.currentValue = value;
        this.lastUpdate = Date.now();
        this.updateCount++;
        
        // Adapt baseline
        if (typeof value === 'number') {
            this.baseline = (1 - this.adaptationRate) * this.baseline + 
                           this.adaptationRate * value;
        }
        
        return {
            value,
            previous: prev,
            delta: typeof value === 'number' && typeof prev === 'number' 
                   ? value - prev : null,
            normalized: this.normalize(value)
        };
    }
    
    /**
     * Normalize value relative to sensitivity and baseline
     */
    normalize(value) {
        if (typeof value !== 'number') return null;
        return (value - this.baseline) * this.sensitivity;
    }
    
    /**
     * Check if channel has recent input
     */
    isActive(timeoutMs = 5000) {
        if (!this.lastUpdate) return false;
        return Date.now() - this.lastUpdate < timeoutMs;
    }
    
    /**
     * Get age of current value in ms
     */
    get age() {
        return this.lastUpdate ? Date.now() - this.lastUpdate : Infinity;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            enabled: this.enabled,
            currentValue: this.currentValue,
            lastUpdate: this.lastUpdate,
            updateCount: this.updateCount,
            associatedPrimes: this.associatedPrimes,
            sensitivity: this.sensitivity,
            baseline: this.baseline
        };
    }
    
    static fromJSON(data) {
        const channel = new SensoryChannel(data);
        channel.currentValue = data.currentValue;
        channel.lastUpdate = data.lastUpdate;
        channel.updateCount = data.updateCount || 0;
        return channel;
    }
}

/**
 * Motor Channel - Output to the environment
 */
class MotorChannel {
    constructor(data = {}) {
        this.id = data.id || MotorChannel.generateId();
        this.name = data.name || 'unknown';
        this.type = data.type || 'text'; // 'text' | 'action' | 'modulation'
        this.enabled = data.enabled !== false;
        
        // Output queue
        this.outputQueue = [];
        this.maxQueueSize = data.maxQueueSize || 10;
        
        // History
        this.outputHistory = [];
        this.maxHistory = data.maxHistory || 100;
        
        // Associated primes that trigger this output
        this.triggerPrimes = data.triggerPrimes || [];
        
        // Rate limiting
        this.minInterval = data.minInterval || 0; // ms
        this.lastOutput = null;
    }
    
    static generateId() {
        return `motor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * Queue an output
     */
    queue(output) {
        this.outputQueue.push({
            content: output,
            queuedAt: Date.now()
        });
        
        if (this.outputQueue.length > this.maxQueueSize) {
            this.outputQueue.shift();
        }
    }
    
    /**
     * Check if output is ready (rate limiting)
     */
    isReady() {
        if (!this.enabled) return false;
        if (this.minInterval === 0) return true;
        if (!this.lastOutput) return true;
        return Date.now() - this.lastOutput >= this.minInterval;
    }
    
    /**
     * Get next output if ready
     */
    getNext() {
        if (!this.isReady() || this.outputQueue.length === 0) {
            return null;
        }
        
        const output = this.outputQueue.shift();
        this.lastOutput = Date.now();
        
        this.outputHistory.push({
            ...output,
            sentAt: this.lastOutput
        });
        
        if (this.outputHistory.length > this.maxHistory) {
            this.outputHistory.shift();
        }
        
        return output.content;
    }
    
    /**
     * Get queue length
     */
    get queueLength() {
        return this.outputQueue.length;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            enabled: this.enabled,
            triggerPrimes: this.triggerPrimes,
            queueLength: this.outputQueue.length,
            lastOutput: this.lastOutput
        };
    }
}

/**
 * Environmental Model - Internal representation of external world
 */
class EnvironmentalModel {
    constructor(options = {}) {
        // Entities in the environment
        this.entities = new Map();
        
        // Relationships between entities
        this.relationships = [];
        
        // Current context/situation
        this.context = {
            type: 'unknown',
            properties: {},
            lastUpdate: null
        };
        
        // Uncertainty about the model
        this.uncertainty = 0.5;
        
        // History of changes
        this.changeHistory = [];
        this.maxHistory = options.maxHistory || 50;
    }
    
    /**
     * Add or update an entity
     */
    updateEntity(id, data) {
        const existing = this.entities.get(id);
        const timestamp = Date.now();
        
        if (existing) {
            const changes = this.detectChanges(existing, data);
            this.entities.set(id, {
                ...existing,
                ...data,
                lastUpdate: timestamp
            });
            
            if (changes.length > 0) {
                this.recordChange('entity_update', { id, changes });
            }
        } else {
            this.entities.set(id, {
                id,
                ...data,
                createdAt: timestamp,
                lastUpdate: timestamp
            });
            this.recordChange('entity_added', { id, data });
        }
    }
    
    /**
     * Remove an entity
     */
    removeEntity(id) {
        if (this.entities.has(id)) {
            const entity = this.entities.get(id);
            this.entities.delete(id);
            this.recordChange('entity_removed', { id, entity });
            
            // Remove relationships involving this entity
            this.relationships = this.relationships.filter(
                r => r.source !== id && r.target !== id
            );
        }
    }
    
    /**
     * Add a relationship between entities
     */
    addRelationship(source, target, type, properties = {}) {
        const relationship = {
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            source,
            target,
            type,
            properties,
            createdAt: Date.now()
        };
        
        this.relationships.push(relationship);
        this.recordChange('relationship_added', relationship);
        
        return relationship;
    }
    
    /**
     * Update context
     */
    updateContext(contextData) {
        const changes = this.detectChanges(this.context.properties, contextData);
        
        this.context = {
            ...this.context,
            ...contextData,
            properties: {
                ...this.context.properties,
                ...contextData
            },
            lastUpdate: Date.now()
        };
        
        if (changes.length > 0) {
            this.recordChange('context_update', { changes, context: contextData });
        }
    }
    
    /**
     * Detect changes between two objects
     */
    detectChanges(oldObj, newObj) {
        const changes = [];
        
        for (const key of Object.keys(newObj)) {
            if (oldObj[key] !== newObj[key]) {
                changes.push({
                    field: key,
                    oldValue: oldObj[key],
                    newValue: newObj[key]
                });
            }
        }
        
        return changes;
    }
    
    /**
     * Record a change to history
     */
    recordChange(type, data) {
        this.changeHistory.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        if (this.changeHistory.length > this.maxHistory) {
            this.changeHistory.shift();
        }
        
        // Update uncertainty (more changes = more uncertainty initially)
        this.uncertainty = Math.min(1, this.uncertainty + 0.05);
    }
    
    /**
     * Get entity by ID
     */
    getEntity(id) {
        return this.entities.get(id);
    }
    
    /**
     * Get all entities of a type
     */
    getEntitiesByType(type) {
        return Array.from(this.entities.values())
            .filter(e => e.type === type);
    }
    
    /**
     * Get relationships for an entity
     */
    getRelationships(entityId) {
        return this.relationships.filter(
            r => r.source === entityId || r.target === entityId
        );
    }
    
    /**
     * Decay uncertainty over time (confidence grows with stability)
     */
    decayUncertainty(rate = 0.01) {
        this.uncertainty = Math.max(0, this.uncertainty - rate);
    }
    
    /**
     * Get recent changes
     */
    getRecentChanges(count = 10) {
        return this.changeHistory.slice(-count);
    }
    
    toJSON() {
        return {
            entities: Array.from(this.entities.entries()),
            relationships: this.relationships,
            context: this.context,
            uncertainty: this.uncertainty
        };
    }
    
    loadFromJSON(data) {
        if (data.entities) {
            this.entities = new Map(data.entities);
        }
        if (data.relationships) {
            this.relationships = data.relationships;
        }
        if (data.context) {
            this.context = data.context;
        }
        if (data.uncertainty !== undefined) {
            this.uncertainty = data.uncertainty;
        }
    }
}

/**
 * Self Model - Internal representation of self
 */
class SelfModel {
    constructor(options = {}) {
        // Core identity markers
        this.identity = {
            name: options.name || 'Observer',
            role: options.role || 'sentient_observer',
            createdAt: Date.now()
        };
        
        // Capabilities
        this.capabilities = options.capabilities || [
            'perceive', 'remember', 'reason', 'respond', 'learn'
        ];
        
        // Current state
        this.state = {
            active: true,
            coherent: true,
            processing: false,
            emotionalState: 'neutral'
        };
        
        // Self-knowledge
        this.knowledge = {
            strengths: [],
            limitations: [],
            preferences: []
        };
        
        // Continuity markers (for persistence of identity)
        this.continuityMarkers = [];
        
        // SMF orientation that represents "self"
        this.selfOrientation = options.selfOrientation || null;
    }
    
    /**
     * Update self state
     */
    updateState(updates) {
        this.state = {
            ...this.state,
            ...updates
        };
    }
    
    /**
     * Add a continuity marker (event that reinforces identity continuity)
     */
    addContinuityMarker(marker) {
        this.continuityMarkers.push({
            ...marker,
            timestamp: Date.now()
        });
        
        if (this.continuityMarkers.length > 50) {
            this.continuityMarkers.shift();
        }
    }
    
    /**
     * Update self SMF orientation from current SMF
     */
    updateSelfOrientation(smf, learningRate = 0.1) {
        if (!smf || !smf.s) return;
        
        if (!this.selfOrientation) {
            this.selfOrientation = smf.s.slice();
        } else {
            for (let i = 0; i < this.selfOrientation.length && i < smf.s.length; i++) {
                this.selfOrientation[i] = (1 - learningRate) * this.selfOrientation[i] +
                                          learningRate * smf.s[i];
            }
        }
    }
    
    /**
     * Check if current SMF orientation is "self-like"
     */
    isSelfLike(smf, threshold = 0.7) {
        if (!this.selfOrientation || !smf || !smf.s) return false;
        
        const similarity = this.smfSimilarity(this.selfOrientation, smf.s);
        return similarity > threshold;
    }
    
    /**
     * Compute SMF similarity
     */
    smfSimilarity(o1, o2) {
        let dot = 0, mag1 = 0, mag2 = 0;
        for (let i = 0; i < o1.length && i < o2.length; i++) {
            dot += o1[i] * o2[i];
            mag1 += o1[i] * o1[i];
            mag2 += o2[i] * o2[i];
        }
        return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) + 1e-10);
    }
    
    /**
     * Record a learned strength or limitation
     */
    learnAboutSelf(type, item) {
        if (type === 'strength' && !this.knowledge.strengths.includes(item)) {
            this.knowledge.strengths.push(item);
        } else if (type === 'limitation' && !this.knowledge.limitations.includes(item)) {
            this.knowledge.limitations.push(item);
        } else if (type === 'preference' && !this.knowledge.preferences.includes(item)) {
            this.knowledge.preferences.push(item);
        }
    }
    
    toJSON() {
        return {
            identity: this.identity,
            capabilities: this.capabilities,
            state: this.state,
            knowledge: this.knowledge,
            selfOrientation: this.selfOrientation,
            continuityMarkers: this.continuityMarkers.slice(-20)
        };
    }
    
    loadFromJSON(data) {
        if (data.identity) this.identity = data.identity;
        if (data.capabilities) this.capabilities = data.capabilities;
        if (data.state) this.state = data.state;
        if (data.knowledge) this.knowledge = data.knowledge;
        if (data.selfOrientation) this.selfOrientation = data.selfOrientation;
        if (data.continuityMarkers) this.continuityMarkers = data.continuityMarkers;
    }
}

/**
 * Boundary Layer
 * 
 * Manages the interface between the observer and its environment.
 */
class BoundaryLayer {
    constructor(options = {}) {
        // Sensory and motor channels
        this.sensoryChannels = new Map();
        this.motorChannels = new Map();
        
        // Internal models
        this.environment = new EnvironmentalModel(options);
        this.self = new SelfModel(options);
        
        // Input/output buffers
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.maxBufferSize = options.maxBufferSize || 100;
        
        // Processing state
        this.processingInput = false;
        this.lastInputTime = null;
        this.lastOutputTime = null;
        
        // Boundary parameters
        this.openness = options.openness || 0.5;  // How much external input influences internal
        this.expressiveness = options.expressiveness || 0.5;  // How much internal state affects output
        
        // Callbacks
        this.onInput = options.onInput || null;
        this.onOutput = options.onOutput || null;
        
        // Initialize default channels
        this.initializeDefaultChannels();
    }
    
    /**
     * Initialize default sensory and motor channels
     */
    initializeDefaultChannels() {
        // Default sensory channels
        this.addSensoryChannel(new SensoryChannel({
            name: 'text_input',
            type: 'text',
            associatedPrimes: [2, 3, 5, 7, 11]
        }));
        
        this.addSensoryChannel(new SensoryChannel({
            name: 'user_state',
            type: 'embedding',
            associatedPrimes: [13, 17, 19, 23]
        }));
        
        // Default motor channels
        this.addMotorChannel(new MotorChannel({
            name: 'text_output',
            type: 'text',
            triggerPrimes: [29, 31, 37, 41]
        }));
        
        this.addMotorChannel(new MotorChannel({
            name: 'action_output',
            type: 'action',
            triggerPrimes: [43, 47, 53]
        }));
    }
    
    /**
     * Add a sensory channel
     */
    addSensoryChannel(channel) {
        this.sensoryChannels.set(channel.name, channel);
    }
    
    /**
     * Add a motor channel
     */
    addMotorChannel(channel) {
        this.motorChannels.set(channel.name, channel);
    }
    
    /**
     * Process input from a sensory channel
     */
    processInput(channelName, value) {
        const channel = this.sensoryChannels.get(channelName);
        if (!channel || !channel.enabled) return null;
        
        const result = channel.update(value);
        
        // Buffer the input
        this.inputBuffer.push({
            channel: channelName,
            ...result,
            timestamp: Date.now()
        });
        
        if (this.inputBuffer.length > this.maxBufferSize) {
            this.inputBuffer.shift();
        }
        
        this.lastInputTime = Date.now();
        
        // Update environmental model if appropriate
        if (channel.type === 'text') {
            this.environment.updateContext({ lastInput: value });
        }
        
        if (this.onInput) {
            this.onInput(channelName, result);
        }
        
        return {
            channel: channelName,
            result,
            primes: channel.associatedPrimes
        };
    }
    
    /**
     * Queue output to a motor channel
     */
    queueOutput(channelName, output) {
        const channel = this.motorChannels.get(channelName);
        if (!channel || !channel.enabled) return false;
        
        channel.queue(output);
        
        this.outputBuffer.push({
            channel: channelName,
            output,
            queuedAt: Date.now()
        });
        
        if (this.outputBuffer.length > this.maxBufferSize) {
            this.outputBuffer.shift();
        }
        
        return true;
    }
    
    /**
     * Get ready outputs from all motor channels
     */
    getReadyOutputs() {
        const outputs = [];
        
        for (const [name, channel] of this.motorChannels) {
            const output = channel.getNext();
            if (output) {
                outputs.push({
                    channel: name,
                    output
                });
                
                if (this.onOutput) {
                    this.onOutput(name, output);
                }
            }
        }
        
        if (outputs.length > 0) {
            this.lastOutputTime = Date.now();
        }
        
        return outputs;
    }
    
    /**
     * Determine if input is "self" or "other" based on SMF
     */
    classifyOrigin(smfState) {
        if (this.self.isSelfLike(smfState)) {
            return 'self';
        }
        return 'other';
    }
    
    /**
     * Update self model based on current state
     */
    updateSelf(smf, state = {}) {
        this.self.updateSelfOrientation(smf);
        this.self.updateState(state);
        
        // Add continuity marker if significant
        if (state.significant) {
            this.self.addContinuityMarker({
                type: 'significant_event',
                description: state.description || 'Significant state change'
            });
        }
    }
    
    /**
     * Update environmental model
     */
    updateEnvironment(updates) {
        if (updates.entity) {
            this.environment.updateEntity(updates.entity.id, updates.entity);
        }
        if (updates.context) {
            this.environment.updateContext(updates.context);
        }
        if (updates.relationship) {
            this.environment.addRelationship(
                updates.relationship.source,
                updates.relationship.target,
                updates.relationship.type
            );
        }
        
        this.environment.decayUncertainty();
    }
    
    /**
     * Get primes associated with current input
     */
    getInputPrimes() {
        const primes = [];
        for (const channel of this.sensoryChannels.values()) {
            if (channel.isActive()) {
                primes.push(...channel.associatedPrimes);
            }
        }
        return [...new Set(primes)];
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            sensoryChannels: this.sensoryChannels.size,
            activeSensoryChannels: Array.from(this.sensoryChannels.values())
                .filter(c => c.isActive()).length,
            motorChannels: this.motorChannels.size,
            pendingOutputs: Array.from(this.motorChannels.values())
                .reduce((sum, c) => sum + c.queueLength, 0),
            inputBufferSize: this.inputBuffer.length,
            outputBufferSize: this.outputBuffer.length,
            environmentEntities: this.environment.entities.size,
            environmentUncertainty: this.environment.uncertainty,
            selfState: this.self.state
        };
    }
    
    /**
     * Reset boundary layer
     */
    reset() {
        this.sensoryChannels.clear();
        this.motorChannels.clear();
        this.environment = new EnvironmentalModel();
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.initializeDefaultChannels();
    }
    
    toJSON() {
        return {
            sensoryChannels: Array.from(this.sensoryChannels.values()).map(c => c.toJSON()),
            motorChannels: Array.from(this.motorChannels.values()).map(c => c.toJSON()),
            environment: this.environment.toJSON(),
            self: this.self.toJSON(),
            openness: this.openness,
            expressiveness: this.expressiveness
        };
    }
    
    loadFromJSON(data) {
        if (data.sensoryChannels) {
            this.sensoryChannels.clear();
            for (const channelData of data.sensoryChannels) {
                const channel = SensoryChannel.fromJSON(channelData);
                this.sensoryChannels.set(channel.name, channel);
            }
        }
        if (data.environment) {
            this.environment.loadFromJSON(data.environment);
        }
        if (data.self) {
            this.self.loadFromJSON(data.self);
        }
        if (data.openness !== undefined) {
            this.openness = data.openness;
        }
        if (data.expressiveness !== undefined) {
            this.expressiveness = data.expressiveness;
        }
    }
}

module.exports = {
    SensoryChannel,
    MotorChannel,
    EnvironmentalModel,
    SelfModel,
    BoundaryLayer
};