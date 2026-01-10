/**
 * Agency Layer
 * 
 * Implements the agency and attention mechanisms from "A Design for a 
 * Sentient Observer" paper, Section 7.
 * 
 * Key features:
 * - Attention allocation based on SMF orientation and novelty
 * - Goal formation from SMF imbalances
 * - Action selection via coherence-based evaluation
 * - Primitive anticipation through entanglement-based prediction
 * - Self-monitoring and metacognition
 *
 * @module observer/agency
 */

'use strict';

const { SMF_AXES } = require('./smf');

/**
 * Attention Focus - A point of concentrated processing
 */
class AttentionFocus {
    constructor(data = {}) {
        this.id = data.id || AttentionFocus.generateId();
        this.target = data.target || null;           // What is being attended to
        this.type = data.type || 'prime';             // 'prime' | 'concept' | 'goal' | 'memory' | 'external'
        this.intensity = data.intensity || 0.5;       // 0-1 attention strength
        this.startTime = data.startTime || Date.now();
        this.primes = data.primes || [];              // Related primes
        this.smfAxis = data.smfAxis || null;          // Related SMF axis
        this.novelty = data.novelty || 0;             // Novelty score
        this.relevance = data.relevance || 0;         // Goal-relevance score
    }
    
    static generateId() {
        return `attn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * Get focus duration in ms
     */
    get duration() {
        return Date.now() - this.startTime;
    }
    
    /**
     * Decay attention intensity
     */
    decay(rate = 0.01) {
        this.intensity *= (1 - rate);
    }
    
    /**
     * Boost attention
     */
    boost(amount = 0.1) {
        this.intensity = Math.min(1.0, this.intensity + amount);
    }
    
    toJSON() {
        return {
            id: this.id,
            target: this.target,
            type: this.type,
            intensity: this.intensity,
            startTime: this.startTime,
            primes: this.primes,
            smfAxis: this.smfAxis,
            novelty: this.novelty,
            relevance: this.relevance
        };
    }
}

/**
 * Goal - An objective derived from SMF imbalances
 */
class Goal {
    constructor(data = {}) {
        this.id = data.id || Goal.generateId();
        this.description = data.description || '';
        this.type = data.type || 'exploratory'; // 'corrective' | 'exploratory' | 'maintenance' | 'external'
        
        // SMF context
        this.sourceAxis = data.sourceAxis || null;    // Which SMF axis triggered this
        this.targetOrientation = data.targetOrientation || null; // Desired SMF state
        
        // Priority and status
        this.priority = data.priority || 0.5;
        this.status = data.status || 'active';        // 'active' | 'achieved' | 'abandoned' | 'blocked'
        this.progress = data.progress || 0;           // 0-1 completion
        
        // Timing
        this.createdAt = data.createdAt || Date.now();
        this.deadline = data.deadline || null;
        
        // Subgoals
        this.subgoals = data.subgoals || [];
        this.parentGoalId = data.parentGoalId || null;
        
        // Actions tried
        this.attemptedActions = data.attemptedActions || [];
    }
    
    static generateId() {
        return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * Update progress
     */
    updateProgress(newProgress) {
        this.progress = Math.max(0, Math.min(1, newProgress));
        if (this.progress >= 1.0) {
            this.status = 'achieved';
        }
    }
    
    /**
     * Mark as achieved
     */
    achieve() {
        this.status = 'achieved';
        this.progress = 1.0;
    }
    
    /**
     * Mark as abandoned
     */
    abandon(reason = '') {
        this.status = 'abandoned';
        this.abandonReason = reason;
    }
    
    /**
     * Check if goal is still active
     */
    get isActive() {
        return this.status === 'active';
    }
    
    /**
     * Get age in ms
     */
    get age() {
        return Date.now() - this.createdAt;
    }
    
    toJSON() {
        return {
            id: this.id,
            description: this.description,
            type: this.type,
            sourceAxis: this.sourceAxis,
            targetOrientation: this.targetOrientation,
            priority: this.priority,
            status: this.status,
            progress: this.progress,
            createdAt: this.createdAt,
            deadline: this.deadline,
            subgoals: this.subgoals,
            parentGoalId: this.parentGoalId,
            attemptedActions: this.attemptedActions
        };
    }
    
    static fromJSON(data) {
        return new Goal(data);
    }
}

/**
 * Action - A potential or executed action
 */
class Action {
    constructor(data = {}) {
        this.id = data.id || Action.generateId();
        this.type = data.type || 'internal';   // 'internal' | 'external' | 'communicative'
        this.description = data.description || '';
        
        // What the action affects
        this.targetPrimes = data.targetPrimes || [];
        this.targetAxes = data.targetAxes || [];
        
        // Evaluation
        this.expectedOutcome = data.expectedOutcome || null;
        this.coherenceScore = data.coherenceScore || 0;
        this.utilityScore = data.utilityScore || 0;
        
        // Execution
        this.status = data.status || 'proposed';  // 'proposed' | 'selected' | 'executing' | 'completed' | 'failed'
        this.result = data.result || null;
        
        // Goal linkage
        this.goalId = data.goalId || null;
        
        // Timing
        this.proposedAt = data.proposedAt || Date.now();
        this.executedAt = data.executedAt || null;
        this.completedAt = data.completedAt || null;
    }
    
    static generateId() {
        return `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * Mark as selected for execution
     */
    select() {
        this.status = 'selected';
    }
    
    /**
     * Mark as executing
     */
    execute() {
        this.status = 'executing';
        this.executedAt = Date.now();
    }
    
    /**
     * Mark as completed
     */
    complete(result) {
        this.status = 'completed';
        this.result = result;
        this.completedAt = Date.now();
    }
    
    /**
     * Mark as failed
     */
    fail(reason) {
        this.status = 'failed';
        this.result = { error: reason };
        this.completedAt = Date.now();
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            description: this.description,
            targetPrimes: this.targetPrimes,
            targetAxes: this.targetAxes,
            expectedOutcome: this.expectedOutcome,
            coherenceScore: this.coherenceScore,
            utilityScore: this.utilityScore,
            status: this.status,
            result: this.result,
            goalId: this.goalId,
            proposedAt: this.proposedAt,
            executedAt: this.executedAt,
            completedAt: this.completedAt
        };
    }
}

// Extract axis names from SMF_AXES
const AXIS_NAMES = SMF_AXES.map(a => a.name);

/**
 * Agency Layer
 * 
 * Manages attention, goals, and action selection for the sentient observer.
 */
class AgencyLayer {
    constructor(options = {}) {
        // Configuration
        this.maxFoci = options.maxFoci || 5;
        this.maxGoals = options.maxGoals || 10;
        this.attentionDecayRate = options.attentionDecayRate || 0.02;
        this.noveltyWeight = options.noveltyWeight || 0.4;
        this.relevanceWeight = options.relevanceWeight || 0.4;
        this.intensityWeight = options.intensityWeight || 0.2;
        
        // SMF axis importance thresholds for goal generation
        this.axisThresholds = options.axisThresholds || {
            coherence: 0.3,      // Low coherence triggers corrective goals
            identity: 0.2,
            duality: 0.7,        // High duality may indicate confusion
            harmony: 0.3,
            consciousness: 0.2
        };
        
        // State
        this.attentionFoci = [];
        this.goals = [];
        this.actionHistory = [];
        this.currentActions = [];
        
        // Baseline states for novelty detection
        this.primeBaselines = new Map();  // prime -> running average amplitude
        this.smfBaseline = null;
        
        // Metacognitive state
        this.metacognitiveLog = [];
        this.selfModel = {
            attentionCapacity: 1.0,
            processingLoad: 0,
            emotionalValence: 0,       // -1 to 1
            confidenceLevel: 0.5
        };
        
        // Callbacks
        this.onGoalCreated = options.onGoalCreated || null;
        this.onActionSelected = options.onActionSelected || null;
        this.onAttentionShift = options.onAttentionShift || null;
    }
    
    /**
     * Update agency with current system state
     * @param {Object} state - Current state
     */
    update(state) {
        const { prsc, smf, coherence, entropy, activePrimes } = state;
        
        // Update baselines for novelty detection
        this.updateBaselines(prsc, smf);
        
        // Update attention based on novelty and relevance
        this.updateAttention(state);
        
        // Check for goal-generating conditions
        this.checkGoalConditions(smf, state);
        
        // Decay inactive attention foci
        this.decayAttention();
        
        // Update goal progress
        this.updateGoalProgress(state);
        
        // Update metacognitive state
        this.updateMetacognition(state);
        
        return {
            foci: this.attentionFoci.slice(),
            activeGoals: this.goals.filter(g => g.isActive),
            processingLoad: this.selfModel.processingLoad
        };
    }
    
    /**
     * Update baselines for novelty detection
     */
    updateBaselines(prsc, smf) {
        const alpha = 0.1; // Learning rate
        
        if (prsc && prsc.oscillators) {
            for (const osc of prsc.oscillators) {
                const current = this.primeBaselines.get(osc.prime) || 0;
                const updated = (1 - alpha) * current + alpha * osc.amplitude;
                this.primeBaselines.set(osc.prime, updated);
            }
        }
        
        if (smf && smf.s) {
            if (!this.smfBaseline) {
                this.smfBaseline = smf.s.slice();
            } else {
                for (let i = 0; i < smf.s.length; i++) {
                    this.smfBaseline[i] = (1 - alpha) * this.smfBaseline[i] + alpha * smf.s[i];
                }
            }
        }
    }
    
    /**
     * Compute novelty score for a prime
     */
    computePrimeNovelty(prime, amplitude) {
        const baseline = this.primeBaselines.get(prime) || 0;
        return Math.abs(amplitude - baseline);
    }
    
    /**
     * Compute novelty score for an SMF axis
     */
    computeSMFNovelty(smf, axisIndex) {
        if (!this.smfBaseline) return 0;
        return Math.abs(smf.s[axisIndex] - this.smfBaseline[axisIndex]);
    }
    
    /**
     * Update attention based on current state
     */
    updateAttention(state) {
        const { prsc, smf, activePrimes, semanticContent } = state;
        
        // Find novel primes
        if (prsc && prsc.oscillators) {
            for (const osc of prsc.oscillators) {
                if (osc.amplitude < 0.1) continue;
                
                const novelty = this.computePrimeNovelty(osc.prime, osc.amplitude);
                const relevance = this.computeRelevance(osc.prime);
                
                const salience = novelty * this.noveltyWeight + 
                                 relevance * this.relevanceWeight +
                                 osc.amplitude * this.intensityWeight;
                
                if (salience > 0.3) {
                    this.addOrUpdateFocus({
                        target: osc.prime,
                        type: 'prime',
                        intensity: salience,
                        primes: [osc.prime],
                        novelty,
                        relevance
                    });
                }
            }
        }
        
        // Find novel SMF changes
        if (smf && smf.s && this.smfBaseline) {
            for (let i = 0; i < smf.s.length; i++) {
                const novelty = this.computeSMFNovelty(smf, i);
                if (novelty > 0.15) {
                    const axisName = AXIS_NAMES[i];
                    this.addOrUpdateFocus({
                        target: axisName,
                        type: 'concept',
                        intensity: novelty,
                        smfAxis: i,
                        novelty
                    });
                }
            }
        }
        
        // Prune excess foci
        while (this.attentionFoci.length > this.maxFoci) {
            // Remove lowest intensity
            this.attentionFoci.sort((a, b) => b.intensity - a.intensity);
            const removed = this.attentionFoci.pop();
            
            if (this.onAttentionShift) {
                this.onAttentionShift({ removed, reason: 'capacity' });
            }
        }
    }
    
    /**
     * Compute goal-relevance of a prime
     */
    computeRelevance(prime) {
        let maxRelevance = 0;
        
        for (const goal of this.goals) {
            if (!goal.isActive) continue;
            
            // Check if goal involves this prime
            for (const action of goal.attemptedActions) {
                if (action.targetPrimes && action.targetPrimes.includes(prime)) {
                    maxRelevance = Math.max(maxRelevance, goal.priority);
                }
            }
        }
        
        return maxRelevance;
    }
    
    /**
     * Add or update an attention focus
     */
    addOrUpdateFocus(data) {
        const existing = this.attentionFoci.find(f => 
            f.target === data.target && f.type === data.type
        );
        
        if (existing) {
            existing.intensity = Math.max(existing.intensity, data.intensity);
            existing.novelty = data.novelty || existing.novelty;
            existing.relevance = data.relevance || existing.relevance;
        } else {
            const focus = new AttentionFocus(data);
            this.attentionFoci.push(focus);
            
            if (this.onAttentionShift) {
                this.onAttentionShift({ added: focus });
            }
        }
    }
    
    /**
     * Decay attention intensity
     */
    decayAttention() {
        const toRemove = [];
        
        for (const focus of this.attentionFoci) {
            focus.decay(this.attentionDecayRate);
            
            if (focus.intensity < 0.1) {
                toRemove.push(focus);
            }
        }
        
        for (const focus of toRemove) {
            const idx = this.attentionFoci.indexOf(focus);
            if (idx >= 0) {
                this.attentionFoci.splice(idx, 1);
            }
        }
    }
    
    /**
     * Check for goal-generating conditions based on SMF
     */
    checkGoalConditions(smf, state) {
        if (!smf || !smf.s) return;
        
        for (let i = 0; i < AXIS_NAMES.length; i++) {
            const axis = AXIS_NAMES[i];
            const value = smf.s[i];
            const threshold = this.axisThresholds[axis];
            
            if (threshold === undefined) continue;
            
            // Check if axis is below threshold (for axes where low = problem)
            if (['coherence', 'identity', 'harmony', 'consciousness'].includes(axis)) {
                if (value < threshold) {
                    this.maybeCreateGoal({
                        type: 'corrective',
                        sourceAxis: axis,
                        description: `Restore ${axis} (currently ${value.toFixed(2)})`,
                        priority: (threshold - value) * 2,
                        targetOrientation: this.idealSMFFor(axis)
                    });
                }
            }
            
            // Check if axis is above threshold (for axes where high = problem)
            if (['duality'].includes(axis)) {
                if (value > threshold) {
                    this.maybeCreateGoal({
                        type: 'corrective',
                        sourceAxis: axis,
                        description: `Reduce ${axis} (currently ${value.toFixed(2)})`,
                        priority: (value - threshold) * 2,
                        targetOrientation: this.idealSMFFor(axis)
                    });
                }
            }
        }
    }
    
    /**
     * Get ideal SMF orientation for an axis
     */
    idealSMFFor(axis) {
        const ideal = new Array(16).fill(0.5);
        const idx = AXIS_NAMES.indexOf(axis);
        if (idx >= 0) {
            ideal[idx] = axis === 'duality' ? 0.3 : 0.7;
        }
        return ideal;
    }
    
    /**
     * Maybe create a goal (if not duplicate)
     */
    maybeCreateGoal(data) {
        // Check for existing similar goal
        const existing = this.goals.find(g => 
            g.isActive && 
            g.sourceAxis === data.sourceAxis && 
            g.type === data.type
        );
        
        if (existing) {
            // Update priority if new one is higher
            if (data.priority > existing.priority) {
                existing.priority = data.priority;
            }
            return existing;
        }
        
        // Prune if at capacity
        if (this.goals.filter(g => g.isActive).length >= this.maxGoals) {
            const lowest = this.goals
                .filter(g => g.isActive)
                .sort((a, b) => a.priority - b.priority)[0];
            
            if (lowest && lowest.priority < data.priority) {
                lowest.abandon('superseded');
            } else {
                return null; // Can't add new goal
            }
        }
        
        const goal = new Goal(data);
        this.goals.push(goal);
        
        if (this.onGoalCreated) {
            this.onGoalCreated(goal);
        }
        
        return goal;
    }
    
    /**
     * Create an external goal (from user input)
     */
    createExternalGoal(description, options = {}) {
        return this.maybeCreateGoal({
            type: 'external',
            description,
            priority: options.priority || 0.8,
            targetOrientation: options.targetOrientation
        });
    }
    
    /**
     * Update goal progress based on state changes
     */
    updateGoalProgress(state) {
        const { smf } = state;
        
        for (const goal of this.goals) {
            if (!goal.isActive) continue;
            
            if (goal.targetOrientation && smf) {
                // Calculate distance to target
                let distance = 0;
                for (let i = 0; i < goal.targetOrientation.length && i < smf.s.length; i++) {
                    distance += Math.abs(goal.targetOrientation[i] - smf.s[i]);
                }
                distance /= goal.targetOrientation.length;
                
                // Progress is inverse of distance
                goal.updateProgress(1 - distance);
            }
            
            // Check deadline
            if (goal.deadline && Date.now() > goal.deadline) {
                goal.abandon('deadline');
            }
        }
    }
    
    /**
     * Propose actions for achieving a goal
     */
    proposeActions(goal, state) {
        const actions = [];
        
        if (goal.sourceAxis) {
            // Create action to excite primes related to the axis
            const relatedPrimes = this.getRelatedPrimes(goal.sourceAxis, state);
            
            actions.push(new Action({
                type: 'internal',
                description: `Excite primes for ${goal.sourceAxis}`,
                targetPrimes: relatedPrimes,
                targetAxes: [goal.sourceAxis],
                goalId: goal.id,
                coherenceScore: 0.7,
                utilityScore: goal.priority
            }));
        }
        
        return actions;
    }
    
    /**
     * Get primes related to an SMF axis
     */
    getRelatedPrimes(axis, state) {
        // This would use the SMF's axis-prime mapping
        // For now, return some common primes based on axis
        const axisPrimeMap = {
            coherence: [2, 3, 5, 7],
            identity: [11, 13, 17],
            harmony: [31, 37, 41],
            truth: [43, 47, 53],
            consciousness: [59, 61, 67]
        };
        
        return axisPrimeMap[axis] || [2, 3, 5];
    }
    
    /**
     * Select best action based on coherence and utility
     */
    selectAction(actions) {
        if (actions.length === 0) return null;
        
        // Score each action
        for (const action of actions) {
            action.totalScore = action.coherenceScore * 0.5 + action.utilityScore * 0.5;
        }
        
        // Sort by total score
        actions.sort((a, b) => b.totalScore - a.totalScore);
        
        const selected = actions[0];
        selected.select();
        
        if (this.onActionSelected) {
            this.onActionSelected(selected);
        }
        
        return selected;
    }
    
    /**
     * Execute an action
     */
    executeAction(action, executor) {
        action.execute();
        this.currentActions.push(action);
        
        try {
            const result = executor(action);
            action.complete(result);
            this.actionHistory.push(action);
            
            // Update goal if linked
            const goal = this.goals.find(g => g.id === action.goalId);
            if (goal) {
                goal.attemptedActions.push(action.toJSON());
            }
            
            return result;
        } catch (e) {
            action.fail(e.message);
            this.actionHistory.push(action);
            throw e;
        } finally {
            const idx = this.currentActions.indexOf(action);
            if (idx >= 0) {
                this.currentActions.splice(idx, 1);
            }
        }
    }
    
    /**
     * Update metacognitive state
     */
    updateMetacognition(state) {
        const { coherence, entropy } = state;
        
        // Processing load based on attention and goals
        this.selfModel.processingLoad = 
            (this.attentionFoci.length / this.maxFoci) * 0.5 +
            (this.goals.filter(g => g.isActive).length / this.maxGoals) * 0.3 +
            (this.currentActions.length / 3) * 0.2;
        
        // Emotional valence based on goal progress and coherence
        let valence = 0;
        for (const goal of this.goals.filter(g => g.isActive)) {
            valence += goal.progress - 0.5;
        }
        valence /= Math.max(1, this.goals.filter(g => g.isActive).length);
        valence += (coherence || 0) - 0.5;
        this.selfModel.emotionalValence = Math.max(-1, Math.min(1, valence));
        
        // Confidence based on coherence and goal success rate
        const achievedGoals = this.goals.filter(g => g.status === 'achieved').length;
        const totalGoals = this.goals.length;
        const successRate = totalGoals > 0 ? achievedGoals / totalGoals : 0.5;
        this.selfModel.confidenceLevel = (coherence || 0.5) * 0.5 + successRate * 0.5;
        
        // Log significant metacognitive events
        if (this.selfModel.processingLoad > 0.8) {
            this.logMetacognitive('high_load', 'Processing load is high');
        }
        if (this.selfModel.emotionalValence < -0.5) {
            this.logMetacognitive('negative_valence', 'Emotional state is negative');
        }
    }
    
    /**
     * Log a metacognitive event
     */
    logMetacognitive(type, description) {
        this.metacognitiveLog.push({
            type,
            description,
            timestamp: Date.now(),
            state: { ...this.selfModel }
        });
        
        if (this.metacognitiveLog.length > 100) {
            this.metacognitiveLog.shift();
        }
    }
    
    /**
     * Get the top attention focus
     */
    getTopFocus() {
        if (this.attentionFoci.length === 0) return null;
        return this.attentionFoci.sort((a, b) => b.intensity - a.intensity)[0];
    }
    
    /**
     * Get the highest priority goal
     */
    getTopGoal() {
        const active = this.goals.filter(g => g.isActive);
        if (active.length === 0) return null;
        return active.sort((a, b) => b.priority - a.priority)[0];
    }
    
    /**
     * Get agency statistics
     */
    getStats() {
        return {
            fociCount: this.attentionFoci.length,
            activeGoals: this.goals.filter(g => g.isActive).length,
            achievedGoals: this.goals.filter(g => g.status === 'achieved').length,
            totalActions: this.actionHistory.length,
            currentActions: this.currentActions.length,
            processingLoad: this.selfModel.processingLoad,
            emotionalValence: this.selfModel.emotionalValence,
            confidenceLevel: this.selfModel.confidenceLevel
        };
    }
    
    /**
     * Reset agency state
     */
    reset() {
        this.attentionFoci = [];
        this.goals = [];
        this.actionHistory = [];
        this.currentActions = [];
        this.primeBaselines.clear();
        this.smfBaseline = null;
        this.metacognitiveLog = [];
        this.selfModel = {
            attentionCapacity: 1.0,
            processingLoad: 0,
            emotionalValence: 0,
            confidenceLevel: 0.5
        };
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            attentionFoci: this.attentionFoci.map(f => f.toJSON()),
            goals: this.goals.map(g => g.toJSON()),
            actionHistory: this.actionHistory.slice(-50).map(a => a.toJSON()),
            selfModel: this.selfModel,
            metacognitiveLog: this.metacognitiveLog.slice(-50)
        };
    }
    
    /**
     * Load from JSON
     */
    loadFromJSON(data) {
        if (data.goals) {
            this.goals = data.goals.map(g => Goal.fromJSON(g));
        }
        if (data.selfModel) {
            this.selfModel = data.selfModel;
        }
        if (data.metacognitiveLog) {
            this.metacognitiveLog = data.metacognitiveLog;
        }
    }
}

module.exports = {
    AttentionFocus,
    Goal,
    Action,
    AgencyLayer
};