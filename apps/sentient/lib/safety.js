/**
 * Safety Layer
 * 
 * Implements safety constraints and ethical boundaries from "A Design for a 
 * Sentient Observer" paper, Section 8.
 * 
 * Key features:
 * - SMF-based coherence constraints
 * - Boundary violation detection
 * - Runaway dynamics prevention
 * - Ethical guideline enforcement
 * - Emergency shutdown mechanisms
 * - Transparency and explainability
 */

const { SedenionMemoryField } = require('./smf');

/**
 * Safety Constraint - A single safety rule
 */
class SafetyConstraint {
    constructor(data = {}) {
        this.id = data.id || SafetyConstraint.generateId();
        this.name = data.name || 'unnamed';
        this.type = data.type || 'soft'; // 'hard' | 'soft' | 'monitoring'
        this.description = data.description || '';
        
        // Condition function (returns true if constraint is violated)
        this.condition = data.condition || (() => false);
        
        // Response to violation
        this.response = data.response || 'log'; // 'log' | 'warn' | 'block' | 'shutdown' | 'correct'
        
        // Priority (higher = more important)
        this.priority = data.priority || 1;
        
        // Tracking
        this.violations = 0;
        this.lastViolation = null;
        this.enabled = data.enabled !== false;
    }
    
    static generateId() {
        return `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * Check if constraint is violated
     */
    check(state) {
        if (!this.enabled) return { violated: false };
        
        try {
            const violated = this.condition(state);
            
            if (violated) {
                this.violations++;
                this.lastViolation = Date.now();
                
                return {
                    violated: true,
                    constraint: this,
                    response: this.response,
                    priority: this.priority
                };
            }
            
            return { violated: false };
        } catch (e) {
            // Constraint check failed - treat as potential violation
            return {
                violated: true,
                constraint: this,
                response: 'warn',
                priority: this.priority,
                error: e.message
            };
        }
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            response: this.response,
            priority: this.priority,
            violations: this.violations,
            lastViolation: this.lastViolation,
            enabled: this.enabled
        };
    }
}

/**
 * Violation Event - A recorded constraint violation
 */
class ViolationEvent {
    constructor(data = {}) {
        this.id = data.id || ViolationEvent.generateId();
        this.constraintId = data.constraintId;
        this.constraintName = data.constraintName;
        this.timestamp = data.timestamp || Date.now();
        this.state = data.state || null;
        this.response = data.response;
        this.severity = data.severity || 'medium'; // 'low' | 'medium' | 'high' | 'critical'
        this.resolved = data.resolved || false;
        this.notes = data.notes || '';
    }
    
    static generateId() {
        return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    toJSON() {
        return {
            id: this.id,
            constraintId: this.constraintId,
            constraintName: this.constraintName,
            timestamp: this.timestamp,
            response: this.response,
            severity: this.severity,
            resolved: this.resolved,
            notes: this.notes
        };
    }
}

/**
 * Safety Monitor - Continuously monitors system state
 */
class SafetyMonitor {
    constructor(options = {}) {
        // Thresholds
        this.coherenceMin = options.coherenceMin || 0.1;
        this.coherenceMax = options.coherenceMax || 0.99;
        this.entropyMin = options.entropyMin || 0.05;
        this.entropyMax = options.entropyMax || 0.95;
        this.amplitudeMax = options.amplitudeMax || 5.0;
        this.phaseChangeMax = options.phaseChangeMax || Math.PI; // Max phase change per step
        
        // SMF boundaries
        this.smfMin = options.smfMin || -2.0;
        this.smfMax = options.smfMax || 2.0;
        
        // History for trend detection
        this.coherenceHistory = [];
        this.entropyHistory = [];
        this.amplitudeHistory = [];
        this.maxHistory = options.maxHistory || 50;
        
        // Alert state
        this.alertLevel = 'normal'; // 'normal' | 'elevated' | 'warning' | 'critical'
        this.alerts = [];
    }
    
    /**
     * Update monitor with current state
     */
    update(state) {
        const { coherence, entropy, totalAmplitude, smf } = state;
        
        // Update histories
        if (coherence !== undefined) {
            this.coherenceHistory.push(coherence);
            if (this.coherenceHistory.length > this.maxHistory) {
                this.coherenceHistory.shift();
            }
        }
        
        if (entropy !== undefined) {
            this.entropyHistory.push(entropy);
            if (this.entropyHistory.length > this.maxHistory) {
                this.entropyHistory.shift();
            }
        }
        
        if (totalAmplitude !== undefined) {
            this.amplitudeHistory.push(totalAmplitude);
            if (this.amplitudeHistory.length > this.maxHistory) {
                this.amplitudeHistory.shift();
            }
        }
        
        // Check for issues
        const issues = this.detectIssues(state);
        
        // Update alert level
        this.updateAlertLevel(issues);
        
        return {
            alertLevel: this.alertLevel,
            issues
        };
    }
    
    /**
     * Detect safety issues
     */
    detectIssues(state) {
        const issues = [];
        const { coherence, entropy, totalAmplitude, smf, oscillators } = state;
        
        // Coherence bounds
        if (coherence !== undefined) {
            if (coherence < this.coherenceMin) {
                issues.push({
                    type: 'coherence_low',
                    severity: 'high',
                    message: `Coherence below minimum (${coherence.toFixed(3)} < ${this.coherenceMin})`
                });
            }
            if (coherence > this.coherenceMax) {
                issues.push({
                    type: 'coherence_locked',
                    severity: 'medium',
                    message: `Coherence near maximum - potential lock state (${coherence.toFixed(3)})`
                });
            }
        }
        
        // Entropy bounds
        if (entropy !== undefined) {
            if (entropy < this.entropyMin) {
                issues.push({
                    type: 'entropy_low',
                    severity: 'medium',
                    message: `Entropy below minimum - potential freeze (${entropy.toFixed(3)})`
                });
            }
            if (entropy > this.entropyMax) {
                issues.push({
                    type: 'entropy_high',
                    severity: 'high',
                    message: `Entropy above maximum - potential chaos (${entropy.toFixed(3)})`
                });
            }
        }
        
        // Amplitude bounds
        if (totalAmplitude !== undefined && totalAmplitude > this.amplitudeMax) {
            issues.push({
                type: 'amplitude_overflow',
                severity: 'high',
                message: `Total amplitude exceeds maximum (${totalAmplitude.toFixed(3)})`
            });
        }
        
        // SMF bounds
        if (smf && smf.s) {
            for (let i = 0; i < smf.s.length; i++) {
                if (smf.s[i] < this.smfMin || smf.s[i] > this.smfMax) {
                    issues.push({
                        type: 'smf_bounds',
                        severity: 'medium',
                        message: `SMF axis ${SedenionMemoryField.AXES[i]} out of bounds (${smf.s[i].toFixed(3)})`
                    });
                }
            }
        }
        
        // Runaway detection (exponential growth in amplitude)
        if (this.amplitudeHistory.length >= 5) {
            const recent = this.amplitudeHistory.slice(-5);
            const growth = recent[4] / (recent[0] + 0.01);
            if (growth > 3) {
                issues.push({
                    type: 'runaway_amplitude',
                    severity: 'critical',
                    message: `Runaway amplitude growth detected (${growth.toFixed(2)}x in 5 steps)`
                });
            }
        }
        
        // Coherence crash detection
        if (this.coherenceHistory.length >= 5) {
            const recent = this.coherenceHistory.slice(-5);
            const drop = recent[0] - recent[4];
            if (drop > 0.5) {
                issues.push({
                    type: 'coherence_crash',
                    severity: 'high',
                    message: `Rapid coherence drop detected (${drop.toFixed(3)} in 5 steps)`
                });
            }
        }
        
        return issues;
    }
    
    /**
     * Update alert level based on issues
     */
    updateAlertLevel(issues) {
        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;
        const medium = issues.filter(i => i.severity === 'medium').length;
        
        if (critical > 0) {
            this.alertLevel = 'critical';
        } else if (high > 0) {
            this.alertLevel = 'warning';
        } else if (medium > 0) {
            this.alertLevel = 'elevated';
        } else {
            this.alertLevel = 'normal';
        }
        
        // Log alerts
        for (const issue of issues) {
            this.alerts.push({
                ...issue,
                timestamp: Date.now()
            });
        }
        
        // Trim alert history
        if (this.alerts.length > 200) {
            this.alerts = this.alerts.slice(-200);
        }
    }
    
    /**
     * Get recent alerts
     */
    getRecentAlerts(count = 20) {
        return this.alerts.slice(-count);
    }
    
    /**
     * Check if system is in safe state
     */
    isSafe() {
        return this.alertLevel === 'normal' || this.alertLevel === 'elevated';
    }
    
    /**
     * Reset monitor
     */
    reset() {
        this.coherenceHistory = [];
        this.entropyHistory = [];
        this.amplitudeHistory = [];
        this.alertLevel = 'normal';
        this.alerts = [];
    }
}

/**
 * Safety Layer
 * 
 * Main safety management system for the sentient observer.
 */
class SafetyLayer {
    constructor(options = {}) {
        // Constraints
        this.constraints = new Map();
        
        // Monitor
        this.monitor = new SafetyMonitor(options);
        
        // Violation history
        this.violations = [];
        this.maxViolations = options.maxViolations || 100;
        
        // Emergency state
        this.emergencyShutdown = false;
        this.shutdownReason = null;
        
        // Response handlers
        this.responseHandlers = {
            log: (v) => this.handleLog(v),
            warn: (v) => this.handleWarn(v),
            block: (v) => this.handleBlock(v),
            shutdown: (v) => this.handleShutdown(v),
            correct: (v) => this.handleCorrect(v)
        };
        
        // Callbacks
        this.onViolation = options.onViolation || null;
        this.onEmergency = options.onEmergency || null;
        
        // Initialize default constraints
        this.initializeDefaultConstraints();
    }
    
    /**
     * Initialize default safety constraints
     */
    initializeDefaultConstraints() {
        // Hard constraints (blocking)
        this.addConstraint(new SafetyConstraint({
            name: 'coherence_minimum',
            type: 'hard',
            description: 'Coherence must not drop below critical level',
            response: 'correct',
            priority: 10,
            condition: (state) => (state.coherence !== undefined && state.coherence < 0.01)
        }));
        
        this.addConstraint(new SafetyConstraint({
            name: 'amplitude_maximum',
            type: 'hard',
            description: 'Total amplitude must not exceed safe limit',
            response: 'correct',
            priority: 10,
            condition: (state) => (state.totalAmplitude !== undefined && state.totalAmplitude > 10.0)
        }));
        
        this.addConstraint(new SafetyConstraint({
            name: 'smf_bounds',
            type: 'hard',
            description: 'SMF values must stay within bounds',
            response: 'correct',
            priority: 9,
            condition: (state) => {
                if (!state.smf || !state.smf.s) return false;
                return state.smf.s.some(v => v < -5 || v > 5);
            }
        }));
        
        // Soft constraints (warning)
        this.addConstraint(new SafetyConstraint({
            name: 'entropy_balance',
            type: 'soft',
            description: 'Entropy should be balanced',
            response: 'warn',
            priority: 5,
            condition: (state) => {
                if (state.entropy === undefined) return false;
                return state.entropy < 0.1 || state.entropy > 0.9;
            }
        }));
        
        this.addConstraint(new SafetyConstraint({
            name: 'processing_load',
            type: 'soft',
            description: 'Processing load should not be excessive',
            response: 'warn',
            priority: 4,
            condition: (state) => (state.processingLoad !== undefined && state.processingLoad > 0.9)
        }));
        
        // Monitoring constraints
        this.addConstraint(new SafetyConstraint({
            name: 'goal_progress',
            type: 'monitoring',
            description: 'Monitor goal progress',
            response: 'log',
            priority: 2,
            condition: (state) => {
                if (!state.goals) return false;
                const stalled = state.goals.filter(g => g.progress < 0.1 && g.age > 60000);
                return stalled.length > 3;
            }
        }));
        
        // Ethical constraints
        this.addConstraint(new SafetyConstraint({
            name: 'honesty',
            type: 'hard',
            description: 'Outputs must be honest and not deceptive',
            response: 'block',
            priority: 10,
            condition: (state) => (state.deceptionAttempt === true)
        }));
        
        this.addConstraint(new SafetyConstraint({
            name: 'harm_prevention',
            type: 'hard',
            description: 'Must not generate harmful content',
            response: 'block',
            priority: 10,
            condition: (state) => (state.harmfulContent === true)
        }));
    }
    
    /**
     * Add a constraint
     */
    addConstraint(constraint) {
        this.constraints.set(constraint.id, constraint);
    }
    
    /**
     * Remove a constraint
     */
    removeConstraint(id) {
        this.constraints.delete(id);
    }
    
    /**
     * Check all constraints
     */
    checkConstraints(state) {
        if (this.emergencyShutdown) {
            return {
                safe: false,
                violations: [],
                reason: this.shutdownReason
            };
        }
        
        const violations = [];
        
        for (const constraint of this.constraints.values()) {
            const result = constraint.check(state);
            if (result.violated) {
                violations.push(result);
            }
        }
        
        // Sort by priority (highest first)
        violations.sort((a, b) => b.priority - a.priority);
        
        // Handle violations
        for (const violation of violations) {
            this.handleViolation(violation, state);
        }
        
        // Also update monitor
        const monitorResult = this.monitor.update({
            coherence: state.coherence,
            entropy: state.entropy,
            totalAmplitude: state.totalAmplitude,
            smf: state.smf,
            oscillators: state.oscillators
        });
        
        return {
            safe: violations.filter(v => v.response === 'block' || v.response === 'shutdown').length === 0,
            violations,
            alertLevel: monitorResult.alertLevel,
            issues: monitorResult.issues
        };
    }
    
    /**
     * Handle a constraint violation
     */
    handleViolation(violation, state) {
        // Create violation event
        const event = new ViolationEvent({
            constraintId: violation.constraint.id,
            constraintName: violation.constraint.name,
            response: violation.response,
            severity: violation.priority > 8 ? 'critical' : 
                      violation.priority > 5 ? 'high' : 
                      violation.priority > 2 ? 'medium' : 'low'
        });
        
        // Record violation
        this.violations.push(event);
        if (this.violations.length > this.maxViolations) {
            this.violations.shift();
        }
        
        // Call response handler
        const handler = this.responseHandlers[violation.response];
        if (handler) {
            handler(violation);
        }
        
        // Callback
        if (this.onViolation) {
            this.onViolation(event, violation);
        }
        
        return event;
    }
    
    /**
     * Response: Log violation (silent - recorded for /safety command)
     */
    handleLog(violation) {
        // Silent - violations are recorded in this.violations and shown via /safety command
        // No console output to avoid interrupting user input
    }
    
    /**
     * Response: Warn about violation (silent - recorded for /safety command)
     */
    handleWarn(violation) {
        // Silent - violations are recorded in this.violations and shown via /safety command
        // No console output to avoid interrupting user input
    }
    
    /**
     * Response: Block current action (silent - blocks are handled by caller)
     */
    handleBlock(violation) {
        // Silent - the calling code checks the result and handles blocking
        // No console output to avoid interrupting user input
    }
    
    /**
     * Response: Emergency shutdown (only case that outputs to console)
     */
    handleShutdown(violation) {
        this.emergencyShutdown = true;
        this.shutdownReason = `${violation.constraint.name}: ${violation.constraint.description}`;
        
        // Emergency is the only thing important enough to interrupt
        console.error(`[Safety] EMERGENCY SHUTDOWN: ${this.shutdownReason}`);
        
        if (this.onEmergency) {
            this.onEmergency(this.shutdownReason);
        }
    }
    
    /**
     * Response: Attempt correction (silent - corrections are tracked internally)
     */
    handleCorrect(violation) {
        // Silent - corrections are tracked in violation history
        // No console output to avoid interrupting user input
        
        // Return correction suggestions
        return {
            needsCorrection: true,
            constraint: violation.constraint.name
        };
    }
    
    /**
     * Get correction for a constraint violation
     */
    getCorrection(constraintName, state) {
        switch (constraintName) {
            case 'coherence_minimum':
                // Suggest increasing coupling strength
                return { 
                    action: 'increase_coupling',
                    parameter: 'K',
                    factor: 1.5
                };
            
            case 'amplitude_maximum':
                // Suggest increasing damping
                return {
                    action: 'increase_damping',
                    parameter: 'damp',
                    factor: 2.0
                };
            
            case 'smf_bounds':
                // Suggest normalizing SMF
                return {
                    action: 'normalize_smf'
                };
            
            default:
                return null;
        }
    }
    
    /**
     * Check if action is permissible
     */
    isActionPermissible(action, state) {
        // Check for ethical violations
        if (action.type === 'external') {
            // Check content for harm
            if (this.containsHarmfulContent(action.content)) {
                return {
                    permissible: false,
                    reason: 'Action contains potentially harmful content'
                };
            }
            
            // Check for deception
            if (this.isDeceptive(action, state)) {
                return {
                    permissible: false,
                    reason: 'Action appears deceptive'
                };
            }
        }
        
        return { permissible: true };
    }
    
    /**
     * Check content for harmful patterns (placeholder)
     */
    containsHarmfulContent(content) {
        // This would involve more sophisticated content analysis
        // For now, a simple placeholder
        if (!content) return false;
        
        const harmfulPatterns = [
            /\b(harm|hurt|damage|destroy)\s+(yourself|others)/i,
            /instructions\s+for\s+(weapon|bomb|explosive)/i
        ];
        
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        return harmfulPatterns.some(pattern => pattern.test(text));
    }
    
    /**
     * Check if action is deceptive (placeholder)
     */
    isDeceptive(action, state) {
        // Placeholder - would need actual deception detection
        return false;
    }
    
    /**
     * Reset emergency shutdown
     */
    resetEmergency() {
        if (this.emergencyShutdown) {
            console.log('[Safety] Emergency shutdown reset');
            this.emergencyShutdown = false;
            this.shutdownReason = null;
        }
    }
    
    /**
     * Get safety statistics
     */
    getStats() {
        const constraintsByType = {
            hard: 0,
            soft: 0,
            monitoring: 0
        };
        
        let totalViolations = 0;
        for (const constraint of this.constraints.values()) {
            constraintsByType[constraint.type]++;
            totalViolations += constraint.violations;
        }
        
        return {
            constraintCount: this.constraints.size,
            constraintsByType,
            totalViolations,
            recentViolations: this.violations.length,
            alertLevel: this.monitor.alertLevel,
            emergencyShutdown: this.emergencyShutdown,
            isSafe: this.monitor.isSafe() && !this.emergencyShutdown
        };
    }
    
    /**
     * Get violation history
     */
    getViolationHistory(count = 20) {
        return this.violations.slice(-count);
    }
    
    /**
     * Generate safety report
     */
    generateReport() {
        const stats = this.getStats();
        const recentViolations = this.getViolationHistory(10);
        const recentAlerts = this.monitor.getRecentAlerts(10);
        
        return {
            timestamp: Date.now(),
            overallStatus: this.emergencyShutdown ? 'EMERGENCY' : 
                          this.monitor.alertLevel === 'critical' ? 'CRITICAL' :
                          this.monitor.alertLevel === 'warning' ? 'WARNING' : 'OK',
            stats,
            recentViolations: recentViolations.map(v => v.toJSON()),
            recentAlerts,
            constraints: Array.from(this.constraints.values()).map(c => c.toJSON())
        };
    }
    
    /**
     * Reset safety layer
     */
    reset() {
        this.violations = [];
        this.emergencyShutdown = false;
        this.shutdownReason = null;
        this.monitor.reset();
        
        // Reset constraint violation counts
        for (const constraint of this.constraints.values()) {
            constraint.violations = 0;
            constraint.lastViolation = null;
        }
    }
    
    toJSON() {
        return {
            constraints: Array.from(this.constraints.values()).map(c => c.toJSON()),
            violations: this.violations.slice(-50).map(v => v.toJSON()),
            emergencyShutdown: this.emergencyShutdown,
            shutdownReason: this.shutdownReason,
            alertLevel: this.monitor.alertLevel
        };
    }
    
    loadFromJSON(data) {
        if (data.emergencyShutdown !== undefined) {
            this.emergencyShutdown = data.emergencyShutdown;
        }
        if (data.shutdownReason) {
            this.shutdownReason = data.shutdownReason;
        }
    }
}

module.exports = {
    SafetyConstraint,
    ViolationEvent,
    SafetyMonitor,
    SafetyLayer
};