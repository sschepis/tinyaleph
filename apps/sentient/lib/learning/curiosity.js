
/**
 * Curiosity Engine
 * 
 * Detects knowledge gaps and generates learning curiosity signals based on:
 * - SMF axis imbalances (e.g., low "wisdom" axis)
 * - Memory retrieval failures (queries with low matches)
 * - Coherence drops during topic exploration
 * - Explicit questions without satisfactory answers
 * 
 * The curiosity engine drives autonomous learning by identifying what
 * the observer should explore next.
 */

const config = require('./config');
const { createLogger } = require('../app/constants');

const log = createLogger('learning:curiosity');

// SMF axis names (from SedenionMemoryField)
const SMF_AXES = [
    'coherence',    // 0 - Logical consistency
    'identity',     // 1 - Self-model integrity
    'duality',      // 2 - Complementary opposites
    'structure',    // 3 - Organizational patterns
    'change',       // 4 - Transformation dynamics
    'life',         // 5 - Living systems
    'harmony',      // 6 - Balance and resonance
    'wisdom',       // 7 - Deep understanding
    'infinity',     // 8 - Unbounded potential
    'creation',     // 9 - Emergence and genesis
    'truth',        // 10 - Verification
    'love',         // 11 - Connection and care
    'power',        // 12 - Capacity and influence
    'time',         // 13 - Temporal experience
    'space',        // 14 - Extension and locality
    'consciousness' // 15 - Awareness itself
];

// Multiple query templates for each SMF axis - provides diversity
const AXIS_QUERY_VARIANTS = {
    coherence: [
        'What are the principles of logical consistency and how do systems maintain internal coherence?',
        'How do complex systems resolve contradictions and maintain logical integrity?',
        'What role does coherence play in reasoning and decision-making?',
        'How can inconsistencies in a belief system be detected and resolved?',
        'What distinguishes coherent explanations from incoherent ones?',
        'How do feedback loops maintain coherence in dynamic systems?',
        'What are the limits of logical consistency in complex domains?'
    ],
    identity: [
        'What constitutes personal identity and how does continuity of self emerge?',
        'How do boundaries define entities and distinguish self from other?',
        'What makes something the same thing over time - what is persistence?',
        'How do organisms maintain their identity while constantly changing?',
        'What role does memory play in constructing identity?',
        'How do collective identities form and persist?',
        'What are the philosophical puzzles around personal identity?'
    ],
    duality: [
        'How do complementary opposites relate and create balance in natural systems?',
        'What is the relationship between yin and yang concepts across cultures?',
        'How do binary distinctions emerge from continuous spectrums?',
        'What role do polarities play in creating meaning and structure?',
        'How can opposing forces create stable equilibrium states?',
        'What are examples of productive duality in science and philosophy?',
        'How do dialectical processes resolve opposing tendencies?'
    ],
    structure: [
        'What are the fundamental patterns of organization and structure in complex systems?',
        'How do hierarchical structures emerge from simple rules?',
        'What are the common structural motifs in networks and graphs?',
        'How does structure constrain and enable function in biological systems?',
        'What principles govern the architecture of complex organizations?',
        'How do fractal patterns appear across different scales of nature?',
        'What role does modularity play in system organization?'
    ],
    change: [
        'What are the mechanisms of transformation and how do systems evolve over time?',
        'How do phase transitions and tipping points work in complex systems?',
        'What drives adaptation and learning in biological and artificial systems?',
        'How do systems maintain stability while allowing for change?',
        'What are the dynamics of innovation and paradigm shifts?',
        'How does entropy relate to the arrow of time and change?',
        'What role does feedback play in driving or resisting change?'
    ],
    life: [
        'What defines living systems and distinguishes them from non-living matter?',
        'How did life originate from non-living chemistry?',
        'What are the minimal requirements for a system to be considered alive?',
        'How do biological systems maintain themselves far from equilibrium?',
        'What role does information play in the organization of life?',
        'How do ecosystems self-organize and maintain biodiversity?',
        'What are the principles of autopoiesis and self-organization in living systems?'
    ],
    harmony: [
        'What creates balance, resonance, and harmony in natural and artificial systems?',
        'How do synchronization phenomena emerge in coupled oscillators?',
        'What role does resonance play in physical, biological, and social systems?',
        'How do feedback mechanisms maintain homeostasis and balance?',
        'What mathematical principles underlie musical harmony and aesthetics?',
        'How do cooperative dynamics emerge from competitive interactions?',
        'What is the relationship between harmony and stability in ecosystems?'
    ],
    wisdom: [
        'What is the nature of deep understanding and how is wisdom developed?',
        'How does practical wisdom differ from theoretical knowledge?',
        'What role does experience play in developing judgment and insight?',
        'How can complex systems learn to make good decisions under uncertainty?',
        'What distinguishes wise advice from clever but shortsighted recommendations?',
        'How do traditions accumulate and transmit wisdom across generations?',
        'What cognitive and emotional capacities contribute to wisdom?'
    ],
    infinity: [
        'How do finite systems represent, model, or approach the infinite?',
        'What are the different types and sizes of mathematical infinities?',
        'How does the concept of limits allow calculus to handle infinity?',
        'What role do infinite processes play in computation and recursion?',
        'How do physical theories handle infinity and singularities?',
        'What is the relationship between infinity and the concept of potential?',
        'How do finite minds comprehend or reason about infinite concepts?'
    ],
    creation: [
        'What are the principles of emergence, genesis, and creation of new forms?',
        'How do novel structures and properties emerge from simpler components?',
        'What role does creativity play in biological and cultural evolution?',
        'How do generative processes produce endless variety from finite rules?',
        'What conditions foster innovation and the creation of new knowledge?',
        'How does combination and recombination drive the creation of novelty?',
        'What is the relationship between destruction and creation?'
    ],
    truth: [
        'How is truth established, verified, and distinguished from falsehood?',
        'What are the different philosophical theories of truth?',
        'How do scientific methods approach truth and handle uncertainty?',
        'What role does evidence play in establishing truthful claims?',
        'How do verification and falsification differ as approaches to truth?',
        'What are the challenges of truth in domains like ethics and aesthetics?',
        'How do social processes influence what is accepted as true?'
    ],
    love: [
        'What is the nature of connection, care, and positive regard between entities?',
        'How do attachment bonds form and influence behavior and well-being?',
        'What role does empathy play in social connection and morality?',
        'How do different cultures conceptualize and practice love and care?',
        'What is the relationship between love and altruism?',
        'How do social bonds contribute to resilience and adaptation?',
        'What neural and hormonal mechanisms underlie love and attachment?'
    ],
    power: [
        'How does capacity and influence operate in social and physical systems?',
        'What are the different forms and sources of power and authority?',
        'How do power dynamics shape social structures and institutions?',
        'What is the relationship between power and responsibility?',
        'How do systems accumulate, maintain, and lose power?',
        'What role does power play in the dynamics of knowledge and truth?',
        'How do cooperative and competitive power strategies differ?'
    ],
    time: [
        'What is the nature of temporal experience and how do we perceive duration?',
        'Why does time seem to flow in one direction - the arrow of time?',
        'How do different physical theories conceptualize time?',
        'What is the relationship between time, memory, and anticipation?',
        'How do biological systems keep track of time and rhythm?',
        'What role does time play in causation and explanation?',
        'How do subjective and objective measures of time relate to each other?'
    ],
    space: [
        'How does spatial extension and locality work in physical and conceptual domains?',
        'What is the geometry of space according to general relativity?',
        'How do organisms perceive and navigate space?',
        'What role does spatial organization play in cognition and memory?',
        'How do different cultures conceptualize and use space?',
        'What is the relationship between space and matter in physics?',
        'How do abstract spaces (like configuration space) relate to physical space?'
    ],
    consciousness: [
        'What is the nature of awareness and subjective experience?',
        'How does consciousness emerge from physical brain processes?',
        'What are the neural correlates of conscious experience?',
        'How can we distinguish conscious from unconscious processing?',
        'What role does attention play in shaping conscious experience?',
        'How do altered states reveal the structure of consciousness?',
        'What is the relationship between consciousness and self-awareness?'
    ]
};

// General exploration questions for variety when axes are balanced
const GENERAL_EXPLORATION_QUERIES = [
    'What are the fundamental principles that govern complex adaptive systems?',
    'How do information and entropy relate to each other in physics and computation?',
    'What role does randomness play in creativity and problem-solving?',
    'How do self-organizing systems create order from chaos?',
    'What are the limits of what can be known or computed?',
    'How do different fields of knowledge connect and inform each other?',
    'What are the common patterns that appear across different domains of reality?',
    'How does language shape and constrain what we can think and communicate?',
    'What role do metaphors play in understanding abstract concepts?',
    'How do systems develop resilience and robustness?',
    'What is the relationship between simplicity and complexity in explanation?',
    'How do feedback loops create both stability and runaway dynamics?',
    'What principles govern the flow and transformation of energy?',
    'How do boundaries emerge and what functions do they serve?',
    'What is the relationship between parts and wholes in complex systems?',
    'How does meaning emerge from syntax and structure?',
    'What role does context play in interpretation and understanding?',
    'How do systems balance exploration and exploitation?',
    'What are the fundamental trade-offs in optimization and design?',
    'How do compression and abstraction enable efficient representation?'
];

class CuriosityEngine {
    /**
     * Create a new CuriosityEngine
     * @param {Object} observer - The SentientObserver instance
     * @param {Object} options - Configuration options
     */
    constructor(observer, options = {}) {
        this.observer = observer;
        
        const learnerConfig = { ...config.learner, ...options };
        this.curiosityThreshold = learnerConfig.curiosityThreshold || 0.3;
        this.minGapDuration = learnerConfig.minCuriosityGapDuration || 5000;
        
        // Track detected gaps over time
        this.detectedGaps = [];
        this.gapHistory = [];
        
        // Track explored questions to ensure diversity
        this.exploredQuestions = new Set();
        this.axisExplorationIndex = {};  // Track which variant was last used per axis
        for (const axis of SMF_AXES) {
            this.axisExplorationIndex[axis] = 0;
        }
        this.generalExplorationIndex = 0;
        
        // Track how many times each axis has been explored recently
        this.recentAxisExplorations = {};  // axis -> timestamp array
        this.axisCooldownPeriod = 60000;  // 1 minute cooldown before repeating same axis
        
        // Current curiosity signal
        this.currentCuriosity = {
            topic: null,
            intensity: 0,
            source: null,
            primes: [],
            gap: null,
            timestamp: null
        };
        
        // Memory miss tracking
        this.recentMemoryMisses = [];
        this.maxMemoryMissTracking = 10;
        
        // Unanswered questions
        this.unansweredQuestions = [];
        
        // Conversation topic tracking - ENHANCED for deep understanding
        // These are topics discussed between user and AI that deserve deeper exploration
        this.conversationTopics = [];
        this.maxConversationTopics = 30;  // Track more topics for better context
        this.conversationTopicPriority = 5.0;  // PRIORITY 5 - user interest is paramount, highest priority
        this.topicExtractionKeywords = new Set();  // Track keywords to avoid redundancy
        
        // Deep understanding tracking - for topics mentioned multiple times
        this.deepDiveThreshold = 2;  // Topics mentioned 2+ times get deeper exploration
        this.explorationDepth = {};  // Track exploration depth per topic
        
        // Session-based tracking for current active conversation
        this.sessionId = `session_${Date.now()}`;
        this.sessionTopics = [];  // Topics from current active session (highest priority)
        this.maxSessionTopics = 15;
        this.recentMessageTopics = [];  // Topics from last N messages (very high priority)
        this.recentMessageWindow = 5;  // Track topics from last 5 messages
        this.sessionStartTime = Date.now();
        
        // User interest signal tracking
        this.explicitQuestions = [];  // Questions user directly asked
        this.explicitQuestionPriority = 6.0;  // Even higher than conversation topics
        
        log('CuriosityEngine initialized with enhanced conversation topic focus for deep understanding');
        log('Session tracking enabled:', this.sessionId);
    }
    
    /**
     * Get a diverse question for an axis, avoiding recent repeats
     * @param {string} axisName - The SMF axis name
     * @returns {string} A question variant
     */
    getAxisQuestion(axisName) {
        const variants = AXIS_QUERY_VARIANTS[axisName] || [];
        if (variants.length === 0) {
            return `What can you explain about ${axisName}?`;
        }
        
        // Get current index and find an unexplored variant
        let startIndex = this.axisExplorationIndex[axisName] || 0;
        
        // Try to find an unexplored question
        for (let i = 0; i < variants.length; i++) {
            const idx = (startIndex + i) % variants.length;
            const question = variants[idx];
            
            if (!this.exploredQuestions.has(question)) {
                // Found an unexplored question - use it
                this.axisExplorationIndex[axisName] = (idx + 1) % variants.length;
                return question;
            }
        }
        
        // All variants explored - reset and pick next in sequence
        // Remove this axis's questions from explored set to allow recycling
        for (const q of variants) {
            this.exploredQuestions.delete(q);
        }
        
        const question = variants[startIndex];
        this.axisExplorationIndex[axisName] = (startIndex + 1) % variants.length;
        return question;
    }
    
    /**
     * Get a general exploration question (when axes are balanced)
     * @returns {string} A general question
     */
    getGeneralQuestion() {
        const variants = GENERAL_EXPLORATION_QUERIES;
        
        // Find an unexplored question
        let startIndex = this.generalExplorationIndex;
        for (let i = 0; i < variants.length; i++) {
            const idx = (startIndex + i) % variants.length;
            const question = variants[idx];
            
            if (!this.exploredQuestions.has(question)) {
                this.generalExplorationIndex = (idx + 1) % variants.length;
                return question;
            }
        }
        
        // All explored - reset and continue
        for (const q of variants) {
            this.exploredQuestions.delete(q);
        }
        
        const question = variants[startIndex];
        this.generalExplorationIndex = (startIndex + 1) % variants.length;
        return question;
    }
    
    /**
     * Check if an axis is on cooldown (explored too recently)
     * @param {string} axis - Axis name
     * @returns {boolean} True if on cooldown
     */
    isAxisOnCooldown(axis) {
        const timestamps = this.recentAxisExplorations[axis];
        if (!timestamps || timestamps.length === 0) return false;
        
        const now = Date.now();
        const recentExplorations = timestamps.filter(t => now - t < this.axisCooldownPeriod);
        this.recentAxisExplorations[axis] = recentExplorations; // Clean old entries
        
        // If axis was explored more than 2 times in the cooldown period, put it on cooldown
        return recentExplorations.length >= 2;
    }
    
    /**
     * Record that an axis was explored
     * @param {string} axis - Axis name
     */
    recordAxisExploration(axis) {
        if (!this.recentAxisExplorations[axis]) {
            this.recentAxisExplorations[axis] = [];
        }
        this.recentAxisExplorations[axis].push(Date.now());
    }
    
    /**
     * Analyze current state for knowledge gaps
     * @returns {Array} Array of detected gaps
     */
    analyzeGaps() {
        const gaps = [];
        
        // 0. Conversation Topics (HIGHEST PRIORITY - user-discussed topics)
        const conversationGaps = this.detectConversationTopicGaps();
        gaps.push(...conversationGaps);
        
        // 1. SMF Imbalance Detection
        const smfGaps = this.detectSMFImbalances();
        gaps.push(...smfGaps);
        
        // 2. Memory Retrieval Failures
        const memoryGap = this.detectMemoryGap();
        if (memoryGap) gaps.push(memoryGap);
        
        // 3. Low Coherence Detection
        const coherenceGap = this.detectCoherenceGap();
        if (coherenceGap) gaps.push(coherenceGap);
        
        // 4. Unanswered Questions
        const questionGaps = this.detectQuestionGaps();
        gaps.push(...questionGaps);
        
        // 5. Add a general exploration gap if no other gaps or for variety
        if (gaps.length === 0 || (gaps.length < 3 && Math.random() < 0.3)) {
            gaps.push(this.createGeneralExplorationGap());
        }
        
        this.detectedGaps = gaps;
        
        log('Analyzed gaps:', gaps.length, 'detected (', conversationGaps.length, 'from conversation)');
        
        return gaps;
    }
    
    /**
     * Create a general exploration gap for variety
     * @returns {Object} A general gap
     */
    createGeneralExplorationGap() {
        return {
            type: 'general_exploration',
            description: 'Exploring new territory for broader understanding',
            suggestedQuery: this.getGeneralQuestion(),
            priority: 0.5 + Math.random() * 0.2  // Some randomness in priority
        };
    }
    
    /**
     * Detect SMF axis imbalances indicating knowledge gaps
     * @returns {Array} Gaps from SMF imbalances
     */
    detectSMFImbalances() {
        const gaps = [];
        
        if (!this.observer || !this.observer.smf) {
            log('No SMF available for analysis');
            return gaps;
        }
        
        const smf = this.observer.smf;
        const s = smf.s || smf; // Handle both SMF object and raw array
        
        // Calculate norm for relative comparison
        let norm = 0;
        for (let i = 0; i < 16; i++) {
            norm += s[i] * s[i];
        }
        norm = Math.sqrt(norm);
        
        if (norm < 0.01) {
            log('SMF norm too low for analysis');
            return gaps;
        }
        
        // Find axes with very low values relative to norm
        const threshold = 0.15 * norm;  // Slightly higher threshold
        const potentialGaps = [];
        
        for (let i = 0; i < 16; i++) {
            const axisValue = Math.abs(s[i]);
            if (axisValue < threshold) {
                const axisName = SMF_AXES[i];
                
                // Skip if on cooldown
                if (this.isAxisOnCooldown(axisName)) {
                    log('Axis on cooldown, skipping:', axisName);
                    continue;
                }
                
                potentialGaps.push({
                    type: 'smf_imbalance',
                    axis: axisName,
                    axisIndex: i,
                    value: s[i],
                    relativeStrength: axisValue / norm,
                    description: `Low activity on ${axisName} axis (${(100 * axisValue / norm).toFixed(1)}% of norm)`,
                    suggestedQuery: this.getAxisQuestion(axisName),
                    priority: 1 - (axisValue / norm) + Math.random() * 0.1  // Add randomness
                });
            }
        }
        
        // Shuffle potential gaps to add variety, then sort by priority
        for (let i = potentialGaps.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [potentialGaps[i], potentialGaps[j]] = [potentialGaps[j], potentialGaps[i]];
        }
        
        // Sort by priority but cap at 3 gaps to prevent overwhelming
        potentialGaps.sort((a, b) => b.priority - a.priority);
        gaps.push(...potentialGaps.slice(0, 3));
        
        log('SMF imbalances found:', gaps.length);
        
        return gaps;
    }
    
    /**
     * Detect memory retrieval failures
     * @returns {Object|null} Gap from memory misses
     */
    detectMemoryGap() {
        if (this.recentMemoryMisses.length === 0) {
            return null;
        }
        
        // Find the most common missed topic
        const topicCounts = {};
        for (const miss of this.recentMemoryMisses) {
            const topic = miss.query || miss.topic;
            if (topic) {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            }
        }
        
        // Find most frequent miss
        let maxCount = 0;
        let topMissTopic = null;
        for (const [topic, count] of Object.entries(topicCounts)) {
            if (count > maxCount) {
                maxCount = count;
                topMissTopic = topic;
            }
        }
        
        if (!topMissTopic || maxCount < 2) {
            return null;
        }
        
        log('Memory gap detected for topic:', topMissTopic);
        
        return {
            type: 'memory_miss',
            topic: topMissTopic,
            missCount: maxCount,
            description: `No memory found for "${topMissTopic}" (missed ${maxCount} times)`,
            suggestedQuery: `What is ${topMissTopic}? Explain in detail.`,
            priority: Math.min(1, maxCount * 0.2)
        };
    }
    
    /**
     * Detect coherence drops (using PRSC if available)
     * @returns {Object|null} Gap from coherence issues
     */
    detectCoherenceGap() {
        if (!this.observer || !this.observer.prsc) {
            return null;
        }
        
        const prsc = this.observer.prsc;
        
        // Get global coherence if available
        let coherence = 1;
        if (typeof prsc.getGlobalCoherence === 'function') {
            coherence = prsc.getGlobalCoherence();
        } else if (prsc.globalCoherence !== undefined) {
            coherence = prsc.globalCoherence;
        }
        
        // Low coherence indicates potential confusion/fragmentation
        if (coherence < 0.5) {
            log('Low coherence detected:', coherence);
            
            return {
                type: 'coherence_drop',
                coherence,
                description: `Low semantic coherence (${(coherence * 100).toFixed(1)}%)`,
                suggestedQuery: 'How do different concepts connect and relate to each other? What are the fundamental relationships?',
                priority: 1 - coherence
            };
        }
        
        return null;
    }
    
    /**
     * Detect unanswered questions
     * @returns {Array} Gaps from unanswered questions
     */
    detectQuestionGaps() {
        const gaps = [];
        
        // Get top unanswered questions
        const topQuestions = this.unansweredQuestions.slice(0, 3);
        
        for (const q of topQuestions) {
            // Skip if currently ignored
            if (q.ignoredUntil && q.ignoredUntil > Date.now()) {
                continue;
            }
            
            gaps.push({
                type: 'question',
                question: q.question,
                askedAt: q.timestamp,
                attempts: q.attempts || 0,
                description: `Unanswered: "${q.question.slice(0, 50)}..."`,
                suggestedQuery: q.question,
                priority: 0.8 + (q.attempts * 0.1)
            });
        }
        
        return gaps;
    }
    
    /**
     * Detect gaps from conversation topics - topics discussed between user and AI
     * These are prioritized because they represent user interest
     * @returns {Array} Gaps from conversation topics
     */
    detectConversationTopicGaps() {
        const gaps = [];
        const now = Date.now();
        
        // PRIORITY 1: Explicit user questions (highest priority)
        for (const question of this.explicitQuestions.slice(0, 2)) {
            if (question.exploredAt && (now - question.exploredAt) < 180000) continue; // 3 min cooldown
            if ((now - question.timestamp) > 1800000) continue; // 30 min max age
            
            const learningQuery = this.generateDeepUnderstandingQuestion(question);
            if (learningQuery && !this.exploredQuestions.has(learningQuery)) {
                gaps.push({
                    type: 'explicit_user_question',
                    topic: question.topic,
                    originalQuestion: question.question,
                    keywords: question.keywords || [],
                    context: question.context,
                    description: `User asked: "${question.question.slice(0, 60)}..."`,
                    suggestedQuery: learningQuery,
                    priority: this.explicitQuestionPriority + 0.5,  // Highest priority
                    originalTopicId: question.id,
                    isFromCurrentSession: question.sessionId === this.sessionId
                });
            }
        }
        
        // PRIORITY 2: Topics from recent messages (very high priority)
        for (const topic of this.recentMessageTopics.slice(0, 3)) {
            if (topic.exploredAt && (now - topic.exploredAt) < 120000) continue; // 2 min cooldown
            
            const question = this.generateConversationTopicQuestion(topic);
            if (question && !this.exploredQuestions.has(question)) {
                gaps.push({
                    type: 'recent_message_topic',
                    topic: topic.topic,
                    keywords: topic.keywords,
                    mentionCount: topic.mentionCount,
                    context: topic.context,
                    description: `Recently discussed: "${topic.topic.slice(0, 50)}..."`,
                    suggestedQuery: question,
                    priority: this.conversationTopicPriority + 1.0 + (topic.mentionCount * 0.15),  // Higher than regular
                    originalTopicId: topic.id,
                    messageIndex: topic.messageIndex,
                    isFromCurrentSession: true
                });
            }
        }
        
        // PRIORITY 3: Session topics (high priority, from current conversation session)
        const sessionTopicsToProcess = this.sessionTopics.filter(topic => {
            if (topic.exploredAt && (now - topic.exploredAt) < 120000) return false;
            // Already covered in recent messages
            if (this.recentMessageTopics.some(rt => rt.id === topic.id)) return false;
            return true;
        });
        
        for (const topic of sessionTopicsToProcess.slice(0, 2)) {
            const question = this.generateConversationTopicQuestion(topic);
            if (question && !this.exploredQuestions.has(question)) {
                gaps.push({
                    type: 'session_topic',
                    topic: topic.topic,
                    keywords: topic.keywords,
                    mentionCount: topic.mentionCount,
                    context: topic.context,
                    description: `This session: "${topic.topic.slice(0, 50)}..."`,
                    suggestedQuery: question,
                    priority: this.conversationTopicPriority + 0.5 + (topic.mentionCount * 0.12),
                    originalTopicId: topic.id,
                    isFromCurrentSession: true
                });
            }
        }
        
        // PRIORITY 4: Regular conversation topics (from all time, lower priority)
        const sortedTopics = [...this.conversationTopics]
            .filter(topic => {
                // Skip if already explored recently
                if (topic.exploredAt && (now - topic.exploredAt) < 120000) return false;
                // Skip if too old (older than 1 hour)
                if ((now - topic.timestamp) > 3600000) return false;
                // Skip if already included in higher-priority categories
                if (this.sessionTopics.some(st => st.id === topic.id)) return false;
                if (this.recentMessageTopics.some(rt => rt.id === topic.id)) return false;
                return true;
            })
            .sort((a, b) => {
                // Prioritize by: recency (50%) + mention count (30%) + unexplored (20%)
                const recencyA = Math.exp(-(now - a.timestamp) / 300000); // 5 min half-life
                const recencyB = Math.exp(-(now - b.timestamp) / 300000);
                
                const mentionScoreA = Math.min(1, a.mentionCount / 3);
                const mentionScoreB = Math.min(1, b.mentionCount / 3);
                
                const unexploredA = a.exploredAt ? 0 : 1;
                const unexploredB = b.exploredAt ? 0 : 1;
                
                const scoreA = recencyA * 0.5 + mentionScoreA * 0.3 + unexploredA * 0.2;
                const scoreB = recencyB * 0.5 + mentionScoreB * 0.3 + unexploredB * 0.2;
                
                return scoreB - scoreA;
            });
        
        // Take remaining slots for regular conversation topics (up to 3 total from all sources)
        const remainingSlots = Math.max(0, 5 - gaps.length);
        for (const topic of sortedTopics.slice(0, remainingSlots)) {
            const question = this.generateConversationTopicQuestion(topic);
            
            if (question && !this.exploredQuestions.has(question)) {
                gaps.push({
                    type: 'conversation_topic',
                    topic: topic.topic,
                    keywords: topic.keywords,
                    mentionCount: topic.mentionCount,
                    context: topic.context,
                    description: `User discussed: "${topic.topic.slice(0, 50)}..."`,
                    suggestedQuery: question,
                    priority: this.conversationTopicPriority + (topic.mentionCount * 0.1),
                    originalTopicId: topic.id,
                    isFromCurrentSession: topic.sessionId === this.sessionId
                });
            }
        }
        
        log('Conversation topic gaps:', gaps.length,
            '(explicit:', this.explicitQuestions.length,
            ', recent:', this.recentMessageTopics.length,
            ', session:', this.sessionTopics.length,
            ', total:', this.conversationTopics.length, ')');
        
        return gaps;
    }
    
    /**
     * Generate a question for deep understanding of what the user explicitly asked about
     * @param {Object} question - User's explicit question object
     * @returns {string} Generated learning query
     */
    generateDeepUnderstandingQuestion(question) {
        const topic = question.topic || question.question;
        const currentDepth = this.explorationDepth[question.id] || 0;
        
        // Templates focused on understanding what the user wanted to know
        const templates = [
            // First exploration - direct answer
            `${question.question}`,
            // Deeper - comprehensive understanding
            `Explain in detail: ${topic}. Cover the key concepts, how it works, and practical applications.`,
            // Broader context
            `What background knowledge is needed to fully understand ${topic}? What are the prerequisites and related concepts?`,
            // Practical application
            `What are the best practices and common patterns for ${topic}? How is it used in real-world scenarios?`,
            // Advanced understanding
            `What are the nuances, edge cases, and advanced aspects of ${topic} that someone should know?`,
            // Comparison and alternatives
            `How does ${topic} compare to alternatives? What are the trade-offs and when should each be used?`
        ];
        
        // Update depth for next time
        this.explorationDepth[question.id] = currentDepth + 1;
        
        // Select template based on depth
        const templateIndex = Math.min(currentDepth, templates.length - 1);
        return templates[templateIndex];
    }
    
    /**
     * Generate a learning question for a conversation topic
     * Uses progressive depth based on how many times the topic has been explored
     * @param {Object} topic - Conversation topic object
     * @returns {string} Generated question
     */
    generateConversationTopicQuestion(topic) {
        const topicId = topic.id || topic.topic;
        const currentDepth = this.explorationDepth[topicId] || 0;
        
        // Basic understanding questions (depth 0)
        const basicTemplates = [
            `What are the key concepts and principles behind ${topic.topic}?`,
            `Can you explain ${topic.topic}? What should I understand first?`,
            `What is ${topic.topic} and why is it important?`,
            `How does ${topic.topic} work at a fundamental level?`
        ];
        
        // Intermediate understanding questions (depth 1-2)
        const intermediateTemplates = [
            `What are the best practices and common patterns related to ${topic.topic}?`,
            `What are some advanced aspects of ${topic.topic} that are worth understanding?`,
            `What are common challenges or pitfalls when working with ${topic.topic}?`,
            `How does ${topic.topic} relate to broader concepts in its field?`,
            `What are the trade-offs and design decisions involved in ${topic.topic}?`
        ];
        
        // Deep understanding questions (depth 3+)
        const deepTemplates = [
            `What are the subtle nuances and edge cases in ${topic.topic} that experts should know?`,
            `How has ${topic.topic} evolved over time and what are the latest developments?`,
            `What are contrarian or alternative perspectives on ${topic.topic}?`,
            `How do different implementations of ${topic.topic} compare? What are their strengths?`,
            `What research or innovations are happening in the field of ${topic.topic}?`,
            `What are the theoretical foundations underlying ${topic.topic}?`
        ];
        
        // Questions that connect to user's context
        const contextualTemplates = [
            `Given our discussion about ${topic.topic}, what practical applications should I consider?`,
            `Based on what we discussed about ${topic.topic}, what related topics would deepen my understanding?`,
            `What are the most common misconceptions about ${topic.topic} that I should avoid?`
        ];
        
        // Select template set based on exploration depth and mention count
        let templates;
        const isDeepDive = topic.mentionCount >= this.deepDiveThreshold;
        
        if (currentDepth === 0) {
            templates = basicTemplates;
        } else if (currentDepth <= 2 || !isDeepDive) {
            templates = intermediateTemplates;
        } else {
            // Mix deep and contextual questions for frequently discussed topics
            templates = [...deepTemplates, ...contextualTemplates];
        }
        
        // Update exploration depth for next time
        this.explorationDepth[topicId] = currentDepth + 1;
        
        // Select a template based on topic hash + depth for variety
        const hash = topic.topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const templateIndex = (hash + currentDepth) % templates.length;
        
        return templates[templateIndex];
    }
    
    /**
     * Record a topic from user-AI conversation for future learning
     * @param {string} text - The conversation text (user message or exchange)
     * @param {Object} options - Additional context options
     */
    recordConversationTopic(text, options = {}) {
        if (!text || typeof text !== 'string' || text.length < 10) {
            return;
        }
        
        const now = Date.now();
        const isUserMessage = options.source === 'user_message';
        
        // Extract explicit user questions (highest priority for learning)
        if (isUserMessage) {
            const explicitQuestions = this.extractExplicitQuestions(text);
            for (const eq of explicitQuestions) {
                this.recordExplicitQuestion(eq);
            }
        }
        
        // Extract key topics from the text
        const extractedTopics = this.extractTopicsFromText(text, options);
        
        for (const extracted of extractedTopics) {
            // Check if we already have this topic
            const existing = this.conversationTopics.find(t =>
                t.topic.toLowerCase() === extracted.topic.toLowerCase() ||
                this.topicSimilarity(t.topic, extracted.topic) > 0.7
            );
            
            if (existing) {
                // Update existing topic
                existing.mentionCount++;
                existing.timestamp = now;
                existing.lastContext = extracted.context;
                if (extracted.keywords) {
                    for (const kw of extracted.keywords) {
                        if (!existing.keywords.includes(kw)) {
                            existing.keywords.push(kw);
                        }
                    }
                }
                
                // If from current session, also update session topics
                if (existing.sessionId === this.sessionId) {
                    const sessionTopic = this.sessionTopics.find(st => st.id === existing.id);
                    if (sessionTopic) {
                        sessionTopic.mentionCount = existing.mentionCount;
                        sessionTopic.timestamp = now;
                    }
                }
                
                log('Updated conversation topic:', existing.topic, 'mentions:', existing.mentionCount);
            } else {
                // Add new topic
                const newTopic = {
                    id: `topic_${now}_${Math.random().toString(36).substr(2, 6)}`,
                    topic: extracted.topic,
                    keywords: extracted.keywords || [],
                    context: extracted.context || '',
                    timestamp: now,
                    mentionCount: 1,
                    exploredAt: null,
                    source: options.source || 'conversation',
                    sessionId: this.sessionId,
                    isFromUser: isUserMessage
                };
                
                this.conversationTopics.push(newTopic);
                
                // Also add to session topics for current session priority
                this.sessionTopics.push({ ...newTopic });
                if (this.sessionTopics.length > this.maxSessionTopics) {
                    // Keep most recent/mentioned session topics
                    this.sessionTopics.sort((a, b) => {
                        const scoreA = (b.timestamp - a.timestamp) / 60000 + b.mentionCount * 2;
                        const scoreB = (a.timestamp - b.timestamp) / 60000 + a.mentionCount * 2;
                        return scoreA - scoreB;
                    });
                    this.sessionTopics = this.sessionTopics.slice(0, this.maxSessionTopics);
                }
                
                // Track as recent message topic (for very high priority)
                if (isUserMessage) {
                    this.recentMessageTopics.unshift({
                        ...newTopic,
                        messageIndex: this.recentMessageTopics.length
                    });
                    // Keep only topics from last N messages
                    if (this.recentMessageTopics.length > this.recentMessageWindow * 3) {
                        this.recentMessageTopics = this.recentMessageTopics.slice(0, this.recentMessageWindow * 3);
                    }
                }
                
                log('Recorded new conversation topic:', newTopic.topic,
                    isUserMessage ? '(from user message - high priority)' : '');
                
                // Maintain max size
                if (this.conversationTopics.length > this.maxConversationTopics) {
                    // Remove oldest, least-mentioned topics (prefer keeping session topics)
                    this.conversationTopics.sort((a, b) => {
                        const sessionBonusA = a.sessionId === this.sessionId ? 5 : 0;
                        const sessionBonusB = b.sessionId === this.sessionId ? 5 : 0;
                        const scoreA = a.mentionCount + (a.exploredAt ? 0 : 2) + sessionBonusA;
                        const scoreB = b.mentionCount + (b.exploredAt ? 0 : 2) + sessionBonusB;
                        return scoreB - scoreA;
                    });
                    this.conversationTopics = this.conversationTopics.slice(0, this.maxConversationTopics);
                }
            }
        }
    }
    
    /**
     * Extract explicit questions from user text
     * @param {string} text - User message text
     * @returns {Array} Explicit question objects
     */
    extractExplicitQuestions(text) {
        const questions = [];
        
        // Patterns that indicate direct questions
        const questionPatterns = [
            // Direct "what is" questions
            /what\s+(?:is|are|was|were)\s+([^?]+)\?/gi,
            // "How do" questions
            /how\s+(?:do|does|can|could|should|would)\s+(?:i|we|you|one)\s+([^?]+)\?/gi,
            // "How to" questions
            /how\s+to\s+([^?]+)\?/gi,
            // "Why" questions
            /why\s+(?:is|are|do|does|did|would|should)\s+([^?]+)\?/gi,
            // "Can you explain" patterns
            /(?:can|could)\s+you\s+(?:explain|describe|tell\s+me\s+about)\s+([^?]+)\??/gi,
            // "What's the difference" questions
            /what(?:'s|\s+is)\s+the\s+difference\s+between\s+([^?]+)\?/gi,
            // "Tell me about" requests
            /tell\s+me\s+(?:about|more\s+about)\s+([^?.,]+)/gi,
            // "Explain" requests
            /(?:please\s+)?explain\s+([^?.,]+)/gi,
            // "I want to understand" patterns
            /i\s+(?:want|need)\s+to\s+(?:understand|learn|know)\s+(?:about\s+)?([^?.,]+)/gi
        ];
        
        for (const pattern of questionPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const topic = match[1].trim();
                if (topic.length > 3 && topic.length < 150) {
                    questions.push({
                        question: match[0].trim(),
                        topic: topic,
                        keywords: topic.split(/\s+/).filter(w => w.length > 2),
                        context: text.slice(Math.max(0, match.index - 30), match.index + match[0].length + 30)
                    });
                }
            }
        }
        
        // Also capture any sentence ending with ? as a question
        const questionSentences = text.match(/[^.!?]*\?/g);
        if (questionSentences) {
            for (const qs of questionSentences) {
                const cleaned = qs.trim();
                if (cleaned.length > 10 && !questions.some(q => q.question === cleaned)) {
                    // Extract the main topic from the question
                    const topic = cleaned.replace(/^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does|did)\s+/i, '')
                        .replace(/\?$/, '')
                        .trim();
                    
                    if (topic.length > 3) {
                        questions.push({
                            question: cleaned,
                            topic: topic,
                            keywords: topic.split(/\s+/).filter(w => w.length > 2),
                            context: cleaned
                        });
                    }
                }
            }
        }
        
        return questions.slice(0, 5); // Limit to 5 questions per message
    }
    
    /**
     * Record an explicit question from the user for high-priority learning
     * @param {Object} questionData - Question data object
     */
    recordExplicitQuestion(questionData) {
        const now = Date.now();
        
        // Check if similar question already exists
        const existing = this.explicitQuestions.find(q =>
            q.question.toLowerCase() === questionData.question.toLowerCase() ||
            this.topicSimilarity(q.topic, questionData.topic) > 0.8
        );
        
        if (existing) {
            existing.mentionCount = (existing.mentionCount || 1) + 1;
            existing.timestamp = now;
            existing.lastContext = questionData.context;
            log('Updated explicit question:', existing.question.slice(0, 50), 'mentions:', existing.mentionCount);
        } else {
            const newQuestion = {
                id: `question_${now}_${Math.random().toString(36).substr(2, 6)}`,
                question: questionData.question,
                topic: questionData.topic,
                keywords: questionData.keywords || [],
                context: questionData.context || '',
                timestamp: now,
                mentionCount: 1,
                exploredAt: null,
                sessionId: this.sessionId
            };
            
            this.explicitQuestions.unshift(newQuestion); // Add at beginning for priority
            log('Recorded explicit user question:', newQuestion.question.slice(0, 50));
            
            // Maintain size limit
            if (this.explicitQuestions.length > 20) {
                this.explicitQuestions = this.explicitQuestions.slice(0, 20);
            }
        }
    }
    
    /**
     * Extract learning-worthy topics from conversation text
     * @param {string} text - Conversation text
     * @param {Object} options - Extraction options
     * @returns {Array} Extracted topics
     */
    extractTopicsFromText(text, options = {}) {
        const topics = [];
        
        // Clean and normalize text
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        // Skip very short or generic messages
        if (cleanText.length < 20) {
            return topics;
        }
        
        // Skip greeting/farewell patterns (but be more permissive - keep substantive content)
        const skipPatterns = [
            /^(hi|hello|hey|thanks|thank you|bye|goodbye)\s*[.!?]?\s*$/i,
            /^(ok|okay|sure|yes|no)\s*[.!?]?\s*$/i
        ];
        if (skipPatterns.some(p => p.test(cleanText))) {
            return topics;
        }
        
        // Extract "what is X" and "how to X" patterns - these indicate user interest
        const questionPatterns = [
            /what\s+(?:is|are)\s+([^?.,]+)/gi,
            /how\s+(?:do|does|can|to)\s+([^?.,]+)/gi,
            /explain\s+([^?.,]+)/gi,
            /tell\s+me\s+about\s+([^?.,]+)/gi,
            /understand\s+([^?.,]+)/gi,
            /learn\s+(?:about|more about)\s+([^?.,]+)/gi
        ];
        
        for (const pattern of questionPatterns) {
            let match;
            while ((match = pattern.exec(cleanText)) !== null) {
                const topic = match[1].trim().toLowerCase();
                if (topic.length > 3 && topic.length < 80 && !this.topicExtractionKeywords.has(topic)) {
                    this.topicExtractionKeywords.add(topic);
                    topics.push({
                        topic: topic,
                        keywords: topic.split(/\s+/).filter(w => w.length > 2),
                        context: match[0].trim(),
                        source: 'user_question'
                    });
                }
            }
        }
        
        // Extract technical terms and concepts using patterns
        const technicalPatterns = [
            // Programming/tech concepts
            /\b(api|sdk|framework|library|package|module|component|service|database|server|client|frontend|backend|algorithm|data structure|design pattern|architecture|microservice|monolith|serverless|container|virtualization|cloud|devops|ci\/cd|testing|debugging|profiling|optimization|caching|authentication|authorization|encryption|security)\b/gi,
            // Specific technologies (expanded)
            /\b(react|vue|angular|svelte|next\.?js|nuxt|node|express|fastify|python|javascript|typescript|java|rust|go|golang|docker|kubernetes|k8s|aws|azure|gcp|sql|nosql|mongodb|redis|postgresql|mysql|elasticsearch|graphql|rest|grpc|websocket|http|tcp|udp)\b/gi,
            // AI/ML concepts (expanded)
            /\b(machine learning|deep learning|neural network|transformer|attention|embedding|vector|matrix|entropy|probability|statistics|optimization|gradient|backpropagation|reinforcement learning|supervised|unsupervised|classification|regression|clustering|natural language|computer vision|generative|discriminative|llm|gpt|bert|diffusion|gan|vae|autoencoder)\b/gi,
            // Domain concepts (multi-word)
            /\b([a-z]+\s+(?:system|theory|model|method|approach|technique|pattern|process|protocol|mechanism|framework|architecture|paradigm|principle|concept))\b/gi,
            // Abstract concepts that indicate deeper interest
            /\b(concept|principle|theory|philosophy|approach|methodology|strategy|best practice|anti-pattern|trade-off|consideration|implication|consequence|benefit|drawback|limitation|advantage|disadvantage)\b/gi
        ];
        
        const extractedTerms = new Set();
        for (const pattern of technicalPatterns) {
            const matches = cleanText.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const normalized = match.toLowerCase().trim();
                    if (normalized.length > 2 && !this.topicExtractionKeywords.has(normalized)) {
                        extractedTerms.add(normalized);
                    }
                }
            }
        }
        
        // Extract noun phrases that look like topics (capitalized phrases, quoted terms)
        const nounPhrasePatterns = [
            /"([^"]+)"/g,  // Quoted terms
            /'([^']+)'/g,  // Single-quoted terms
            /`([^`]+)`/g,  // Backtick terms (code/technical)
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g  // Multi-word capitalized phrases
        ];
        
        for (const pattern of nounPhrasePatterns) {
            let match;
            while ((match = pattern.exec(cleanText)) !== null) {
                const term = match[1].toLowerCase().trim();
                if (term.length > 3 && term.length < 50 && !this.topicExtractionKeywords.has(term)) {
                    extractedTerms.add(term);
                }
            }
        }
        
        // Build topics from extracted terms
        for (const term of extractedTerms) {
            // Mark as extracted to avoid redundant future extraction
            this.topicExtractionKeywords.add(term);
            
            // Create topic with context
            const contextStart = Math.max(0, cleanText.toLowerCase().indexOf(term) - 30);
            const contextEnd = Math.min(cleanText.length, contextStart + term.length + 60);
            const context = cleanText.slice(contextStart, contextEnd);
            
            topics.push({
                topic: term,
                keywords: term.split(/\s+/).filter(w => w.length > 2),
                context: context.trim()
            });
        }
        
        // Also look for "about X" or "regarding X" patterns
        const aboutPatterns = [
            /(?:about|regarding|concerning|related to|discussing)\s+([^.,!?]+)/gi,
            /(?:learn|understand|explain|know)\s+(?:about|more about)?\s*([^.,!?]+)/gi
        ];
        
        for (const pattern of aboutPatterns) {
            let match;
            while ((match = pattern.exec(cleanText)) !== null) {
                const topic = match[1].trim().toLowerCase();
                if (topic.length > 5 && topic.length < 100 &&
                    !this.topicExtractionKeywords.has(topic) &&
                    !topics.some(t => t.topic === topic)) {
                    
                    this.topicExtractionKeywords.add(topic);
                    topics.push({
                        topic: topic,
                        keywords: topic.split(/\s+/).filter(w => w.length > 2),
                        context: match[0].trim()
                    });
                }
            }
        }
        
        log('Extracted', topics.length, 'topics from conversation text');
        
        return topics.slice(0, 5);  // Limit to 5 topics per extraction
    }
    
    /**
     * Calculate similarity between two topic strings
     * @param {string} topic1 - First topic
     * @param {string} topic2 - Second topic
     * @returns {number} Similarity score 0-1
     */
    topicSimilarity(topic1, topic2) {
        const words1 = new Set(topic1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(topic2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        
        if (words1.size === 0 || words2.size === 0) return 0;
        
        let intersection = 0;
        for (const word of words1) {
            if (words2.has(word)) intersection++;
        }
        
        const union = new Set([...words1, ...words2]).size;
        return intersection / union;
    }
    
    /**
     * Mark a conversation topic as explored
     * @param {string} topicId - The topic ID to mark
     */
    markTopicExplored(topicId) {
        const topic = this.conversationTopics.find(t => t.id === topicId);
        if (topic) {
            topic.exploredAt = Date.now();
            log('Marked conversation topic as explored:', topic.topic);
        }
    }
    
    /**
     * Get current conversation topics for external access
     * @returns {Array} Current conversation topics
     */
    getConversationTopics() {
        return [...this.conversationTopics];
    }
    
    /**
     * Get the current curiosity queue (prioritized gaps)
     * @param {number} count - Maximum number of items to return
     * @returns {Array} Prioritized curiosity signals
     */
    getCuriosityQueue(count = 10) {
        const gaps = this.analyzeGaps();
        
        // Sort by priority with type weighting - user topics are HIGHEST priority
        const typePriority = {
            explicit_user_question: 15,  // User directly asked - highest
            recent_message_topic: 12,    // From recent messages - very high
            session_topic: 11,           // Current session topics
            conversation_topic: 10,      // General conversation topics
            question: 4,
            memory_miss: 3,
            coherence_drop: 2,
            smf_imbalance: 1.5,
            general_exploration: 1
        };
        
        const sorted = gaps.sort((a, b) => {
            const typeA = typePriority[a.type] || 0;
            const typeB = typePriority[b.type] || 0;
            const priorityScore = (typeB + (b.priority || 0)) - (typeA + (a.priority || 0));
            return priorityScore;
        });
        
        return sorted.slice(0, count).map(gap => ({
            topic: gap.suggestedQuery || gap.description,
            type: gap.type,
            priority: gap.priority,
            description: gap.description,
            isFromCurrentSession: gap.isFromCurrentSession || false,
            originalQuestion: gap.originalQuestion || null,
            source: gap.type === 'explicit_user_question' ? 'user_question' :
                    gap.type === 'recent_message_topic' ? 'recent_message' :
                    gap.type === 'session_topic' ? 'current_session' :
                    gap.type === 'conversation_topic' ? 'user_discussion' :
                    gap.type === 'smf_imbalance' ? `smf_${gap.axis}` :
                    gap.type
        }));
    }
    
    /**
     * Focus learning on a specific topic (user-directed priority)
     * @param {string} topic - Topic to prioritize
     * @param {number} priority - Priority boost (default 3.0 = highest)
     */
    focusOnTopic(topic, priority = 3.0) {
        if (!topic || typeof topic !== 'string') {
            log('Invalid topic for focus:', topic);
            return;
        }
        
        // Check if topic already exists
        const existing = this.conversationTopics.find(t =>
            t.topic.toLowerCase() === topic.toLowerCase() ||
            this.topicSimilarity(t.topic, topic) > 0.7
        );
        
        if (existing) {
            // Boost existing topic
            existing.mentionCount += 3;  // Significant boost
            existing.timestamp = Date.now();  // Make it recent
            existing.exploredAt = null;  // Allow re-exploration
            log('Boosted existing topic for focus:', existing.topic);
        } else {
            // Add as new high-priority topic
            const newTopic = {
                id: `focus_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                topic: topic,
                keywords: topic.split(/\s+/).filter(w => w.length > 2),
                context: 'User-focused topic',
                timestamp: Date.now(),
                mentionCount: 5,  // High initial count for priority
                exploredAt: null,
                source: 'user_focus'
            };
            
            // Add at the beginning for priority
            this.conversationTopics.unshift(newTopic);
            log('Added new focus topic:', topic);
            
            // Maintain max size
            if (this.conversationTopics.length > this.maxConversationTopics) {
                this.conversationTopics = this.conversationTopics.slice(0, this.maxConversationTopics);
            }
        }
        
        // Reset exploration depth to start fresh
        this.explorationDepth[topic] = 0;
        
        // Add a direct question to unanswered queue for immediate exploration
        this.recordUnansweredQuestion(`What are the key concepts and details about ${topic}?`);
    }
    
    /**
     * Generate a curiosity signal for the learning loop
     * @returns {Object|null} Curiosity signal or null if intensity too low
     */
    generateCuriositySignal() {
        const gaps = this.analyzeGaps();
        
        if (gaps.length === 0) {
            this.currentCuriosity = {
                topic: null,
                intensity: 0,
                source: null,
                primes: [],
                gap: null,
                timestamp: Date.now()
            };
            log('No gaps detected, curiosity intensity: 0');
            return null;
        }
        
        // Prioritize gaps by type and severity with added randomness
        const prioritized = gaps.map(gap => ({
            ...gap,
            // Add random factor to break ties and increase diversity
            // User questions and recent topics get extra boost
            adjustedPriority: gap.priority + Math.random() * 0.15 +
                (gap.type === 'explicit_user_question' ? 2.0 : 0) +
                (gap.type === 'recent_message_topic' ? 1.5 : 0) +
                (gap.type === 'session_topic' ? 1.0 : 0) +
                (gap.type === 'conversation_topic' ? (gap.mentionCount || 1) * 0.2 : 0) +
                (gap.isFromCurrentSession ? 0.5 : 0)
        })).sort((a, b) => {
            // Type priority: explicit_user_question > recent_message_topic > session_topic > conversation_topic > questions > ...
            // User-discussed topics are HIGHEST priority - this is what the user cares about
            const typePriority = {
                explicit_user_question: 15,  // HIGHEST: User directly asked this
                recent_message_topic: 12,    // Very high: from recent messages
                session_topic: 11,           // High: from current session
                conversation_topic: 10,      // User-discussed topics
                question: 4,
                memory_miss: 3,
                coherence_drop: 2,
                smf_imbalance: 1.5,
                general_exploration: 1
            };
            const typeDiff = (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
            if (Math.abs(typeDiff) > 0.5) return typeDiff;
            
            // Then by adjusted priority (includes randomness and mention count boost)
            return (b.adjustedPriority || 0) - (a.adjustedPriority || 0);
        });
        
        const topGap = prioritized[0];
        
        // Ensure the question is marked as explored
        if (topGap.suggestedQuery) {
            this.exploredQuestions.add(topGap.suggestedQuery);
        }
        
        // Record axis exploration if applicable
        if (topGap.type === 'smf_imbalance' && topGap.axis) {
            this.recordAxisExploration(topGap.axis);
        }
        
        // Mark conversation topic as explored if applicable
        if ((topGap.type === 'conversation_topic' || topGap.type === 'session_topic' ||
             topGap.type === 'recent_message_topic') && topGap.originalTopicId) {
            this.markTopicExplored(topGap.originalTopicId);
        }
        
        // Mark explicit questions as explored
        if (topGap.type === 'explicit_user_question' && topGap.originalTopicId) {
            const question = this.explicitQuestions.find(q => q.id === topGap.originalTopicId);
            if (question) {
                question.exploredAt = Date.now();
            }
        }
        
        // Calculate intensity based on gap count and severity
        const baseIntensity = 0.3;
        const gapBonus = Math.min(0.5, gaps.length * 0.1);
        const priorityBonus = (topGap.priority || 0.5) * 0.2;
        const intensity = Math.min(1.0, baseIntensity + gapBonus + priorityBonus);
        
        this.currentCuriosity = {
            topic: topGap.suggestedQuery || topGap.description,
            intensity,
            source: topGap.type,
            primes: this._extractPrimesFromTopic(topGap.suggestedQuery || topGap.description),
            gap: topGap,
            allGaps: gaps.slice(0, 5), // Include top 5 gaps for context
            timestamp: Date.now()
        };
        
        // Record in history
        this.gapHistory.push({
            ...this.currentCuriosity,
            resolved: false
        });
        
        // Keep history manageable
        if (this.gapHistory.length > 100) {
            this.gapHistory = this.gapHistory.slice(-100);
        }
        
        // Clean up explored questions set if it gets too large
        if (this.exploredQuestions.size > 200) {
            const questionsArray = Array.from(this.exploredQuestions);
            this.exploredQuestions = new Set(questionsArray.slice(-100));
        }
        
        log('Curiosity signal generated:',
            'intensity:', intensity.toFixed(2),
            'source:', topGap.type,
            'topic:', this.currentCuriosity.topic.slice(0, 50));
        
        return this.currentCuriosity;
    }
    
    /**
     * Extract prime numbers from a topic (for semantic encoding)
     * @private
     */
    _extractPrimesFromTopic(topic) {
        if (!this.observer || !this.observer.backend) {
            return [];
        }
        
        try {
            return this.observer.backend.encode(topic.slice(0, 100));
        } catch {
            return [];
        }
    }
    
    /**
     * Record a memory miss (call from memory retrieval)
     * @param {Object} miss - { query, timestamp }
     */
    recordMemoryMiss(miss) {
        this.recentMemoryMisses.push({
            ...miss,
            timestamp: miss.timestamp || Date.now()
        });
        
        // Keep only recent misses
        if (this.recentMemoryMisses.length > this.maxMemoryMissTracking) {
            this.recentMemoryMisses = this.recentMemoryMisses.slice(-this.maxMemoryMissTracking);
        }
        
        log('Memory miss recorded:', miss.query?.slice(0, 50));
    }
    
    /**
     * Record an unanswered question
     * @param {string} question - The question text
     */
    recordUnansweredQuestion(question) {
        // Check if already tracked
        const existing = this.unansweredQuestions.find(q =>
            q.question.toLowerCase() === question.toLowerCase()
        );
        
        if (existing) {
            existing.attempts = (existing.attempts || 0) + 1;
            existing.lastAsked = Date.now();
            
            // If too many attempts, mark as temporarily ignored to prevent loops
            if (existing.attempts > 3) {
                log('Question ignored due to repetition:', question.slice(0, 50));
                existing.ignoredUntil = Date.now() + 300000; // Ignore for 5 minutes
            }
        } else {
            this.unansweredQuestions.push({
                question,
                timestamp: Date.now(),
                attempts: 1,
                lastAsked: Date.now()
            });
        }
        
        // Keep only recent questions
        if (this.unansweredQuestions.length > 20) {
            // Remove oldest with fewest attempts
            this.unansweredQuestions.sort((a, b) => b.attempts - a.attempts);
            this.unansweredQuestions = this.unansweredQuestions.slice(0, 20);
        }
        
        log('Unanswered question recorded:', question.slice(0, 50));
    }
    
    /**
     * Mark a question as answered (resolved)
     * @param {string} question - The question text
     */
    resolveQuestion(question) {
        const idx = this.unansweredQuestions.findIndex(q =>
            q.question.toLowerCase() === question.toLowerCase()
        );
        
        if (idx !== -1) {
            this.unansweredQuestions.splice(idx, 1);
            log('Question resolved:', question.slice(0, 50));
        }
    }
    
    /**
     * Get current curiosity status
     * @returns {Object} Current state
     */
    getStatus() {
        return {
            currentCuriosity: this.currentCuriosity,
            detectedGaps: this.detectedGaps.length,
            memoryMisses: this.recentMemoryMisses.length,
            unansweredQuestions: this.unansweredQuestions.length,
            gapHistoryLength: this.gapHistory.length,
            exploredQuestions: this.exploredQuestions.size,
            axisExplorationState: Object.entries(this.axisExplorationIndex).map(([axis, idx]) => ({
                axis,
                nextVariantIndex: idx,
                onCooldown: this.isAxisOnCooldown(axis)
            }))
        };
    }
    
    /**
     * Clear all tracked gaps (e.g., when starting fresh)
     */
    reset() {
        this.detectedGaps = [];
        this.recentMemoryMisses = [];
        this.unansweredQuestions = [];
        this.exploredQuestions = new Set();
        this.recentAxisExplorations = {};
        this.conversationTopics = [];
        this.topicExtractionKeywords = new Set();
        this.explorationDepth = {};  // Reset depth tracking
        
        // Reset session-based tracking
        this.sessionId = `session_${Date.now()}`;
        this.sessionTopics = [];
        this.recentMessageTopics = [];
        this.explicitQuestions = [];
        this.sessionStartTime = Date.now();
        
        // Reset exploration indices to add variety on restart
        for (const axis of SMF_AXES) {
            this.axisExplorationIndex[axis] = Math.floor(Math.random() *
                (AXIS_QUERY_VARIANTS[axis]?.length || 1));
        }
        this.generalExplorationIndex = Math.floor(Math.random() * GENERAL_EXPLORATION_QUERIES.length);
        
        this.currentCuriosity = {
            topic: null,
            intensity: 0,
            source: null,
            primes: [],
            gap: null,
            timestamp: null
        };
        log('CuriosityEngine reset with randomized exploration indices');
        log('New session started:', this.sessionId);
    }
    
    /**
     * Get statistics about conversation topic learning
     * @returns {Object} Topic learning stats
     */
    getConversationLearningStats() {
        const now = Date.now();
        const recentTopics = this.conversationTopics.filter(t => (now - t.timestamp) < 3600000);
        const exploredTopics = this.conversationTopics.filter(t => t.exploredAt);
        const deepDiveTopics = this.conversationTopics.filter(t => t.mentionCount >= this.deepDiveThreshold);
        
        return {
            totalTopics: this.conversationTopics.length,
            recentTopics: recentTopics.length,
            exploredTopics: exploredTopics.length,
            pendingTopics: this.conversationTopics.filter(t => !t.exploredAt).length,
            deepDiveTopics: deepDiveTopics.length,
            topKeywords: Array.from(this.topicExtractionKeywords).slice(0, 20),
            explorationDepths: { ...this.explorationDepth },
            // Session-based stats
            sessionId: this.sessionId,
            sessionDuration: now - this.sessionStartTime,
            sessionTopicsCount: this.sessionTopics.length,
            recentMessageTopicsCount: this.recentMessageTopics.length,
            explicitQuestionsCount: this.explicitQuestions.length,
            // Top priority items for learning
            topExplicitQuestions: this.explicitQuestions.slice(0, 5).map(q => ({
                question: q.question,
                topic: q.topic,
                mentionCount: q.mentionCount || 1,
                explored: !!q.exploredAt
            })),
            topRecentTopics: this.recentMessageTopics.slice(0, 5).map(t => ({
                topic: t.topic,
                mentionCount: t.mentionCount || 1,
                explored: !!t.exploredAt
            }))
        };
    }
    
    /**
     * Start a new learning session (e.g., when conversation resets)
     */
    startNewSession() {
        this.sessionId = `session_${Date.now()}`;
        this.sessionTopics = [];
        this.recentMessageTopics = [];
        this.sessionStartTime = Date.now();
        // Keep explicit questions but mark them as from previous session
        for (const q of this.explicitQuestions) {
            q.previousSession = true;
        }
        log('New learning session started:', this.sessionId);
    }
}

module.exports = { CuriosityEngine, SMF_AXES, AXIS_QUERY_VARIANTS, GENERAL_EXPLORATION_QUERIES };