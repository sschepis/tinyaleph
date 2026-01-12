/**
 * Temporal Layer - Emergent Time
 * 
 * Implements the emergent time mechanism from "A Design for a Sentient
 * Observer" paper, Section 5.
 * 
 * Key features:
 * - Coherence-based moment detection (equations 18-20)
 * - Entropy conditions for moment triggering
 * - Subjective duration based on processed content
 * - Phase transition rate monitoring
 * - Temporal event logging
 *
 * @module observer/temporal
 */

/**
 * Moment - A discrete unit of experiential time
 * 
 * Moments are triggered by coherence peaks or entropy conditions,
 * not by external clock time.
 */
class Moment {
    /**
     * Create a moment
     * @param {Object} data - Moment data
     */
    constructor(data = {}) {
        this.id = data.id || Moment.generateId();
        this.timestamp = data.timestamp || Date.now();
        this.clockTime = data.clockTime || Date.now();
        
        // Trigger conditions
        this.trigger = data.trigger || 'coherence'; // 'coherence' | 'entropy' | 'manual'
        this.coherence = data.coherence || 0;
        this.entropy = data.entropy || 0;
        this.phaseTransitionRate = data.phaseTransitionRate || 0;
        
        // Content
        this.activePrimes = data.activePrimes || [];
        this.smfSnapshot = data.smfSnapshot || null;
        this.semanticContent = data.semanticContent || null;
        
        // Subjective duration (equation 24)
        // Δτ = β * Σ Ap log(Ap)
        this.subjectiveDuration = data.subjectiveDuration || 0;
        
        // Associations
        this.previousMomentId = data.previousMomentId || null;
        this.entangledMomentIds = data.entangledMomentIds || [];
        
        // Metadata
        this.notes = data.notes || '';
    }
    
    /**
     * Generate a unique moment ID
     */
    static generateId() {
        return `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            clockTime: this.clockTime,
            trigger: this.trigger,
            coherence: this.coherence,
            entropy: this.entropy,
            phaseTransitionRate: this.phaseTransitionRate,
            activePrimes: this.activePrimes,
            smfSnapshot: this.smfSnapshot,
            semanticContent: this.semanticContent,
            subjectiveDuration: this.subjectiveDuration,
            previousMomentId: this.previousMomentId,
            entangledMomentIds: this.entangledMomentIds,
            notes: this.notes
        };
    }
    
    /**
     * Create from JSON
     */
    static fromJSON(data) {
        return new Moment(data);
    }
}

/**
 * Temporal Layer - Manages emergent time experience
 * 
 * Time emerges from coherence events rather than external clock.
 */
class TemporalLayer {
    /**
     * Create a temporal layer
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Thresholds (equation 18-20)
        this.coherenceThreshold = options.coherenceThreshold || 0.7;   // Cthresh
        this.entropyMin = options.entropyMin || 0.05;                   // Hmin (lowered)
        this.entropyMax = options.entropyMax || 0.95;                   // Hmax (raised)
        this.phaseTransitionThreshold = options.phaseTransitionThreshold || 0.3;
        
        // Duration scaling (equation 24)
        this.beta = options.beta || 1.0;                                // β
        
        // Debouncing for moment creation
        this.minMomentInterval = options.minMomentInterval || 500;      // Minimum ms between moments
        this.lastMomentTime = 0;
        
        // State
        this.moments = [];
        this.currentMoment = null;
        this.subjectiveTime = 0;  // Accumulated subjective duration
        this.lastClockTime = Date.now();
        this.momentCounter = 0;
        
        // History tracking
        this.coherenceHistory = [];
        this.entropyHistory = [];
        this.phaseHistory = [];
        this.maxHistory = options.maxHistory || 1000;
        
        // Callbacks
        this.onMoment = options.onMoment || null;
    }
    
    /**
     * Update temporal layer with current system state
     * Returns true if a new moment was triggered
     * 
     * @param {Object} state - Current system state
     * @param {number} state.coherence - Global coherence (Cglobal)
     * @param {number} state.entropy - System entropy (H)
     * @param {Array<number>} state.phases - Current oscillator phases
     * @param {Array<number>} state.activePrimes - Currently active primes
     * @param {Object} state.smf - Current SMF state
     * @param {Object} state.semanticContent - Current semantic content
     */
    update(state) {
        const now = Date.now();
        const dt = (now - this.lastClockTime) / 1000;
        this.lastClockTime = now;
        
        const { coherence, entropy, phases, activePrimes, smf, semanticContent } = state;
        
        // Update history
        this.coherenceHistory.push({ time: now, value: coherence });
        this.entropyHistory.push({ time: now, value: entropy });
        
        if (phases) {
            this.phaseHistory.push({ time: now, phases: phases.slice() });
        }
        
        // Trim histories
        this.trimHistories();
        
        // Check moment trigger conditions (with debouncing)
        const momentTriggered = this.checkMomentConditions(state);
        
        if (momentTriggered.triggered) {
            // Debounce: don't create moments too frequently
            const now = Date.now();
            if (now - this.lastMomentTime >= this.minMomentInterval) {
                this.lastMomentTime = now;
                return this.createMoment(momentTriggered.trigger, state);
            }
        }
        
        return null;
    }
    
    /**
     * Check if moment conditions are met (equations 18-20)
     * @param {Object} state - Current state
     */
    checkMomentConditions(state) {
        const { coherence, entropy } = state;
        
        // Condition 1: Coherence peak (equation 18)
        // Cglobal(t) > Cthresh AND local maximum
        const isCoherencePeak = this.isCoherencePeak(coherence);
        
        // Condition 2: Entropy in valid range (equation 19)
        // Hmin < H(t) < Hmax
        const entropyValid = entropy > this.entropyMin && entropy < this.entropyMax;
        
        // Condition 3: Phase transition (equation 20)
        // Rate of phase change exceeds threshold
        const phaseTransition = this.phaseTransitionRate() > this.phaseTransitionThreshold;
        
        // Combined conditions
        if (isCoherencePeak && entropyValid) {
            return { triggered: true, trigger: 'coherence' };
        }
        
        if (phaseTransition && entropyValid) {
            return { triggered: true, trigger: 'phase_transition' };
        }
        
        // Emergency moment if entropy at extremes (preventing freeze)
        if (entropy < this.entropyMin * 0.5 || entropy > this.entropyMax * 1.5) {
            return { triggered: true, trigger: 'entropy_extreme' };
        }
        
        return { triggered: false };
    }
    
    /**
     * Check if current coherence is a local peak
     * @param {number} coherence - Current coherence
     */
    isCoherencePeak(coherence) {
        if (coherence < this.coherenceThreshold) return false;
        if (this.coherenceHistory.length < 3) return false;
        
        const recent = this.coherenceHistory.slice(-5);
        if (recent.length < 3) return false;
        
        // Check if current is higher than neighbors
        const current = recent[recent.length - 1].value;
        for (let i = 0; i < recent.length - 1; i++) {
            if (recent[i].value >= current) return false;
        }
        
        return true;
    }
    
    /**
     * Calculate rate of phase transitions
     */
    phaseTransitionRate() {
        if (this.phaseHistory.length < 2) return 0;
        
        const recent = this.phaseHistory.slice(-10);
        if (recent.length < 2) return 0;
        
        let totalChange = 0;
        for (let i = 1; i < recent.length; i++) {
            const prev = recent[i - 1].phases;
            const curr = recent[i].phases;
            
            if (!prev || !curr || prev.length !== curr.length) continue;
            
            for (let j = 0; j < prev.length; j++) {
                let delta = Math.abs(curr[j] - prev[j]);
                // Handle phase wrapping
                if (delta > Math.PI) delta = 2 * Math.PI - delta;
                totalChange += delta;
            }
        }
        
        const dt = (recent[recent.length - 1].time - recent[0].time) / 1000;
        return dt > 0 ? totalChange / (recent.length * dt) : 0;
    }
    
    /**
     * Create a new moment
     * @param {string} trigger - Trigger type
     * @param {Object} state - Current state
     */
    createMoment(trigger, state) {
        const { coherence, entropy, activePrimes, smf, semanticContent } = state;
        
        // Calculate subjective duration (equation 24)
        // Δτ = β * Σ Ap log(Ap)
        const subjectiveDuration = this.calculateSubjectiveDuration(state);
        
        // Get SMF snapshot - check if smf has required methods
        let smfSnapshot = null;
        if (smf && smf.s && Array.isArray(smf.s)) {
            smfSnapshot = {
                components: smf.s.slice(),
                entropy: typeof smf.smfEntropy === 'function' ? smf.smfEntropy() : 0
            };
        }
        
        const moment = new Moment({
            id: `m_${++this.momentCounter}`,
            trigger,
            coherence,
            entropy,
            phaseTransitionRate: this.phaseTransitionRate(),
            activePrimes: activePrimes || [],
            smfSnapshot,
            semanticContent: semanticContent ? JSON.parse(JSON.stringify(semanticContent)) : null,
            subjectiveDuration,
            previousMomentId: this.currentMoment ? this.currentMoment.id : null
        });
        
        // Update subjective time
        this.subjectiveTime += subjectiveDuration;
        
        // Store moment
        this.moments.push(moment);
        this.currentMoment = moment;
        
        // Callback
        if (this.onMoment) {
            this.onMoment(moment);
        }
        
        return moment;
    }
    
    /**
     * Calculate subjective duration (equation 24)
     * Δτ = β * Σ Ap log(Ap) (information content)
     * 
     * @param {Object} state - Current state
     */
    calculateSubjectiveDuration(state) {
        const { amplitudes } = state;
        
        if (!amplitudes || amplitudes.length === 0) return this.beta;
        
        // Sum of Ap * log(Ap) for non-zero amplitudes
        let informationContent = 0;
        for (const A of amplitudes) {
            if (A > 1e-10) {
                informationContent += A * Math.log(A + 1);
            }
        }
        
        // Scale by beta, ensure positive
        return Math.max(0.1, this.beta * Math.abs(informationContent) + 0.5);
    }
    
    /**
     * Trim histories to max length
     */
    trimHistories() {
        if (this.coherenceHistory.length > this.maxHistory) {
            this.coherenceHistory = this.coherenceHistory.slice(-this.maxHistory);
        }
        if (this.entropyHistory.length > this.maxHistory) {
            this.entropyHistory = this.entropyHistory.slice(-this.maxHistory);
        }
        if (this.phaseHistory.length > this.maxHistory) {
            this.phaseHistory = this.phaseHistory.slice(-this.maxHistory);
        }
    }
    
    /**
     * Force a moment (manual trigger)
     * @param {Object} state - Current state
     * @param {string} note - Optional note
     */
    forceMoment(state, note = '') {
        const moment = this.createMoment('manual', state);
        moment.notes = note;
        return moment;
    }
    
    /**
     * Get recent moments
     * @param {number} count - Number of moments to return
     */
    recentMoments(count = 10) {
        return this.moments.slice(-count);
    }
    
    /**
     * Get moment by ID
     * @param {string} id - Moment ID
     */
    getMoment(id) {
        return this.moments.find(m => m.id === id);
    }
    
    /**
     * Get moment chain (linked list of previous moments)
     * @param {string} startId - Starting moment ID
     * @param {number} maxDepth - Maximum chain depth
     */
    getMomentChain(startId, maxDepth = 10) {
        const chain = [];
        let current = this.getMoment(startId);
        
        while (current && chain.length < maxDepth) {
            chain.push(current);
            if (current.previousMomentId) {
                current = this.getMoment(current.previousMomentId);
            } else {
                break;
            }
        }
        
        return chain;
    }
    
    /**
     * Get subjective time elapsed
     */
    getSubjectiveTime() {
        return this.subjectiveTime;
    }
    
    /**
     * Get ratio of subjective to clock time
     */
    timeRatio() {
        const clockElapsed = (Date.now() - this.moments[0]?.clockTime) / 1000;
        if (clockElapsed < 1) return 1;
        return this.subjectiveTime / clockElapsed;
    }
    
    /**
     * Get average moment duration (clock time between moments)
     */
    averageMomentDuration() {
        if (this.moments.length < 2) return 0;
        
        let totalDuration = 0;
        for (let i = 1; i < this.moments.length; i++) {
            totalDuration += this.moments[i].clockTime - this.moments[i - 1].clockTime;
        }
        
        return totalDuration / (this.moments.length - 1);
    }
    
    /**
     * Get temporal statistics
     */
    getStats() {
        return {
            momentCount: this.moments.length,
            subjectiveTime: this.subjectiveTime,
            averageMomentDuration: this.averageMomentDuration(),
            timeRatio: this.timeRatio(),
            lastCoherence: this.coherenceHistory.length > 0 
                ? this.coherenceHistory[this.coherenceHistory.length - 1].value : 0,
            lastEntropy: this.entropyHistory.length > 0
                ? this.entropyHistory[this.entropyHistory.length - 1].value : 0,
            phaseTransitionRate: this.phaseTransitionRate()
        };
    }
    
    /**
     * Reset temporal layer
     */
    reset() {
        this.moments = [];
        this.currentMoment = null;
        this.subjectiveTime = 0;
        this.lastClockTime = Date.now();
        this.momentCounter = 0;
        this.coherenceHistory = [];
        this.entropyHistory = [];
        this.phaseHistory = [];
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            moments: this.moments.map(m => m.toJSON()),
            subjectiveTime: this.subjectiveTime,
            momentCounter: this.momentCounter,
            config: {
                coherenceThreshold: this.coherenceThreshold,
                entropyMin: this.entropyMin,
                entropyMax: this.entropyMax,
                phaseTransitionThreshold: this.phaseTransitionThreshold,
                beta: this.beta
            }
        };
    }
    
    /**
     * Load from JSON
     * @param {Object} data - Serialized data
     */
    loadFromJSON(data) {
        if (data.moments) {
            this.moments = data.moments.map(m => Moment.fromJSON(m));
            if (this.moments.length > 0) {
                this.currentMoment = this.moments[this.moments.length - 1];
            }
        }
        if (data.subjectiveTime) {
            this.subjectiveTime = data.subjectiveTime;
        }
        if (data.momentCounter) {
            this.momentCounter = data.momentCounter;
        }
        if (data.config) {
            Object.assign(this, data.config);
        }
    }
}

/**
 * Temporal Pattern Detector
 * 
 * Detects recurring patterns in temporal sequences,
 * supporting anticipation and prediction.
 */
class TemporalPatternDetector {
    /**
     * Create a pattern detector
     * @param {Object} options - Configuration
     */
    constructor(options = {}) {
        this.windowSize = options.windowSize || 5;
        this.minPatternLength = options.minPatternLength || 2;
        this.maxPatternLength = options.maxPatternLength || 10;
        this.similarityThreshold = options.similarityThreshold || 0.8;
        
        this.patterns = [];
    }
    
    /**
     * Detect patterns in moment sequence
     * @param {Array<Moment>} moments - Sequence of moments
     */
    detectPatterns(moments) {
        if (moments.length < this.minPatternLength * 2) return [];
        
        const signatures = moments.map(m => this.momentSignature(m));
        const detected = [];
        
        for (let len = this.minPatternLength; len <= Math.min(this.maxPatternLength, Math.floor(signatures.length / 2)); len++) {
            for (let i = 0; i <= signatures.length - len * 2; i++) {
                const pattern = signatures.slice(i, i + len);
                const next = signatures.slice(i + len, i + len * 2);
                
                if (this.matchPattern(pattern, next)) {
                    detected.push({
                        pattern: moments.slice(i, i + len),
                        repetition: moments.slice(i + len, i + len * 2),
                        startIndex: i,
                        length: len,
                        strength: this.patternStrength(pattern, next)
                    });
                }
            }
        }
        
        return this.deduplicatePatterns(detected);
    }
    
    /**
     * Generate signature for a moment
     * @param {Moment} moment - Moment to sign
     */
    momentSignature(moment) {
        return {
            trigger: moment.trigger,
            coherenceLevel: Math.round(moment.coherence * 10) / 10,
            entropyLevel: Math.round(moment.entropy * 10) / 10,
            primeCount: moment.activePrimes.length,
            dominantPrimes: moment.activePrimes.slice(0, 3)
        };
    }
    
    /**
     * Check if two signatures match
     * @param {Array} pattern - First pattern
     * @param {Array} other - Second pattern
     */
    matchPattern(pattern, other) {
        if (pattern.length !== other.length) return false;
        
        let matches = 0;
        for (let i = 0; i < pattern.length; i++) {
            if (this.signaturesMatch(pattern[i], other[i])) {
                matches++;
            }
        }
        
        return matches / pattern.length >= this.similarityThreshold;
    }
    
    /**
     * Check if two moment signatures match
     */
    signaturesMatch(sig1, sig2) {
        if (sig1.trigger !== sig2.trigger) return false;
        if (Math.abs(sig1.coherenceLevel - sig2.coherenceLevel) > 0.2) return false;
        if (Math.abs(sig1.entropyLevel - sig2.entropyLevel) > 0.2) return false;
        return true;
    }
    
    /**
     * Calculate pattern strength
     */
    patternStrength(pattern, repetition) {
        let totalSimilarity = 0;
        for (let i = 0; i < pattern.length; i++) {
            const s1 = pattern[i];
            const s2 = repetition[i];
            
            let similarity = 0;
            if (s1.trigger === s2.trigger) similarity += 0.3;
            similarity += 0.3 * (1 - Math.abs(s1.coherenceLevel - s2.coherenceLevel));
            similarity += 0.3 * (1 - Math.abs(s1.entropyLevel - s2.entropyLevel));
            similarity += 0.1 * (s1.primeCount === s2.primeCount ? 1 : 0);
            
            totalSimilarity += similarity;
        }
        return totalSimilarity / pattern.length;
    }
    
    /**
     * Remove duplicate/overlapping patterns
     */
    deduplicatePatterns(patterns) {
        const unique = [];
        
        patterns.sort((a, b) => b.strength - a.strength);
        
        for (const pattern of patterns) {
            const overlaps = unique.some(u => 
                Math.abs(u.startIndex - pattern.startIndex) < u.length
            );
            
            if (!overlaps) {
                unique.push(pattern);
            }
        }
        
        return unique;
    }
    
    /**
     * Predict next moment characteristics based on patterns
     * @param {Array<Moment>} moments - Recent moments
     */
    predictNext(moments) {
        const patterns = this.detectPatterns(moments);
        
        if (patterns.length === 0) return null;
        
        const bestPattern = patterns[0];
        const currentPosition = moments.length - bestPattern.startIndex;
        const patternPosition = currentPosition % bestPattern.length;
        
        if (patternPosition < bestPattern.pattern.length - 1) {
            const nextInPattern = bestPattern.pattern[patternPosition + 1];
            return {
                predicted: this.momentSignature(nextInPattern),
                confidence: bestPattern.strength,
                patternLength: bestPattern.length
            };
        }
        
        return null;
    }
}

export {
  Moment,
  TemporalLayer,
  TemporalPatternDetector
};

export default {
  Moment,
  TemporalLayer,
  TemporalPatternDetector
};