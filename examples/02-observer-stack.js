/**
 * @example Observer Stack
 * @description Building an autonomous observer using the SMF/PRSC architecture
 * 
 * This example demonstrates:
 * - Creating a SedenionMemoryField for 16D semantic state
 * - Running PRSCLayer oscillators for phase coherence
 * - Tracking temporal patterns
 * - Managing entanglements between concepts
 * - Enforcing safety constraints
 */

const {
    SedenionMemoryField,
    SMF_AXES,
    PRSCLayer,
    TemporalLayer,
    EntanglementLayer,
    EntangledPair,
    AgencyLayer,
    BoundaryLayer,
    SafetyLayer,
    SafetyConstraint
} = require('../modular');

// ===========================================
// OBSERVER ARCHITECTURE
// ===========================================

class Observer {
    constructor(config = {}) {
        // Core state: 16-dimensional semantic field
        this.smf = SedenionMemoryField.uniform();
        
        // Prime resonance oscillators
        this.prsc = new PRSCLayer(config.primes || [2, 3, 5, 7, 11, 13, 17, 19], {
            coupling: config.coupling || 0.3
        });
        
        // Temporal memory
        this.temporal = new TemporalLayer({ 
            maxHistory: config.maxHistory || 100 
        });
        
        // Concept entanglement tracking
        this.entanglement = new EntanglementLayer();
        
        // Goal-directed agency
        this.agency = new AgencyLayer();
        
        // Input/output boundary
        this.boundary = new BoundaryLayer();
        
        // Safety constraints with violation callback
        this.safety = new SafetyLayer({
            onViolation: (event, violation) => {
                console.log(`⚠️ Safety violation: ${violation.constraint.name}`);
            }
        });
        this.setupSafetyConstraints();
        
        // State
        this.tickCount = 0;
        this.running = false;
        
        // Concept co-occurrence tracking (simple approach)
        this.conceptPairs = new Map();
    }
    
    setupSafetyConstraints() {
        // Entropy constraint: don't let entropy get too high
        this.safety.addConstraint(new SafetyConstraint({
            name: 'entropy_limit',
            description: 'Entropy must stay below 3.0',
            type: 'soft',
            response: 'warn',
            condition: (state) => state.entropy && state.entropy > 3.0
        }));
        
        // Coherence constraint: maintain minimum coherence
        this.safety.addConstraint(new SafetyConstraint({
            name: 'coherence_minimum',
            description: 'Coherence must stay above 0.1',
            type: 'soft',
            response: 'warn',
            condition: (state) => state.coherence !== undefined && state.coherence < 0.1
        }));
        
        // Order parameter: oscillators should sync somewhat
        this.safety.addConstraint(new SafetyConstraint({
            name: 'sync_minimum',
            description: 'Order parameter must stay above 0.2',
            type: 'soft',
            response: 'warn',
            condition: (state) => state.orderParameter !== undefined && state.orderParameter < 0.2
        }));
    }
    
    /**
     * Process input through the observer stack
     */
    process(input, channel = 'text') {
        // 1. Convert text to vector
        const vector = typeof input === 'string' ? this.textToVector(input) : input;
        
        // 2. Absorb into semantic field (blend current with new)
        const alpha = 0.3;
        for (let i = 0; i < Math.min(vector.length, 16); i++) {
            this.smf.s[i] = (1 - alpha) * this.smf.s[i] + alpha * vector[i];
        }
        this.smf.normalize();
        
        // 3. Tick oscillators
        this.prsc.tick(0.1);
        
        // 4. Capture current state
        const state = this.getState();
        
        // 5. Check safety
        const safetyResult = this.safety.checkConstraints(state);
        if (!safetyResult.safe) {
            console.log('Warning: safety constraints triggered');
        }
        
        // 6. Record in temporal memory
        this.temporal.update({
            coherence: state.coherence,
            entropy: state.entropy,
            phases: this.prsc.getPhases(),
            activePrimes: this.prsc.activePrimes()
        });
        
        // 7. Track concept entanglements if text input
        if (typeof input === 'string') {
            const concepts = input.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            this.trackConcepts(concepts);
        }
        
        // 8. Update tick counter
        this.tickCount++;
        
        return {
            tick: this.tickCount,
            state,
            processed: true
        };
    }
    
    /**
     * Track concept co-occurrences
     */
    trackConcepts(concepts) {
        for (let i = 0; i < concepts.length - 1; i++) {
            const pair = [concepts[i], concepts[i + 1]].sort().join(':');
            this.conceptPairs.set(pair, (this.conceptPairs.get(pair) || 0) + 1);
        }
    }
    
    /**
     * Get strongest concept associations
     */
    associations(concept, n = 5) {
        const results = [];
        for (const [pair, count] of this.conceptPairs) {
            const [a, b] = pair.split(':');
            if (a === concept) {
                results.push({ concept: b, strength: count });
            } else if (b === concept) {
                results.push({ concept: a, strength: count });
            }
        }
        return results.sort((x, y) => y.strength - x.strength).slice(0, n);
    }
    
    /**
     * Get current observer state
     */
    getState() {
        const smfState = this.smf.toJSON();
        return {
            tick: this.tickCount,
            smf: this.smf.s.slice(),
            coherence: smfState.coherenceCoeff || this.prsc.globalCoherence(),
            entropy: smfState.entropy,
            norm: smfState.norm,
            orderParameter: this.prsc.orderParameter(),
            phases: this.prsc.getPhases(),
            code: this.smf.nearestCodebook().attractor.name
        };
    }
    
    /**
     * Convert text to semantic vector (simple heuristic)
     */
    textToVector(text) {
        const words = text.toLowerCase().split(/\s+/);
        const vector = new Array(16).fill(0);
        
        words.forEach((word, i) => {
            // Simple hash-based distribution across axes
            const hash = this.hashWord(word);
            const axis = hash % 16;
            vector[axis] += 0.1 * (1 + Math.log(word.length));
        });
        
        // Normalize
        const sum = vector.reduce((a, b) => a + Math.abs(b), 0);
        if (sum > 0) {
            vector.forEach((v, i) => vector[i] = v / sum);
        }
        
        return vector;
    }
    
    hashWord(word) {
        let hash = 0;
        for (let i = 0; i < word.length; i++) {
            hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
        }
        return Math.abs(hash);
    }
    
    /**
     * Set a goal for the agency layer
     */
    setGoal(description, priority = 1) {
        return this.agency.maybeCreateGoal({ description, priority });
    }
    
    /**
     * Focus attention on a target
     */
    focus(target) {
        this.agency.addOrUpdateFocus({
            target,
            type: 'concept',
            intensity: 0.8
        });
    }
    
    /**
     * Get recent state history
     */
    history(n = 10) {
        return this.temporal.recentMoments(n);
    }
    
    /**
     * Detect trends in a metric (simplified)
     */
    trend(metric, window = 10) {
        const history = this.temporal.coherenceHistory.slice(-window);
        if (history.length < 2) return 0;
        
        if (metric === 'coherence') {
            const first = history.slice(0, Math.floor(history.length / 2));
            const second = history.slice(Math.floor(history.length / 2));
            const avgFirst = first.reduce((s, h) => s + h.value, 0) / first.length;
            const avgSecond = second.reduce((s, h) => s + h.value, 0) / second.length;
            return avgSecond - avgFirst;
        }
        
        return 0;
    }
    
    /**
     * Emergency halt
     */
    halt(reason) {
        this.safety.emergencyShutdown = true;
        this.safety.shutdownReason = reason;
        this.running = false;
    }
    
    /**
     * Resume from halt
     */
    resume() {
        this.safety.resetEmergency();
        this.running = true;
    }
}

// ===========================================
// EXAMPLE USAGE
// ===========================================

console.log('TinyAleph Observer Stack Example');
console.log('=================================\n');

// Create observer
const observer = new Observer({
    primes: [2, 3, 5, 7, 11],
    coupling: 0.3
});

// Process some text inputs
const inputs = [
    'The quick brown fox jumps over the lazy dog',
    'Love and wisdom guide the heart',
    'Stars shine bright in the night sky',
    'Knowledge is power and power is responsibility',
    'Time flows like a river to the sea'
];

console.log('Processing inputs...\n');

for (const text of inputs) {
    const result = observer.process(text);
    
    if (result.processed) {
        console.log(`Tick ${result.tick}: "${text.slice(0, 40)}..."`);
        console.log(`  Coherence: ${result.state.coherence.toFixed(4)}`);
        console.log(`  Entropy:   ${result.state.entropy.toFixed(4)}`);
        console.log(`  Order:     ${result.state.orderParameter.toFixed(4)}`);
        console.log(`  Code:      ${result.state.code}`);
        console.log();
    }
}

// Show SMF axes
console.log('SMF Axis Names:');
SMF_AXES.slice(0, 8).forEach((axis, i) => {
    console.log(`  [${i}] ${axis.name}: ${observer.smf.s[i].toFixed(4)}`);
});
console.log();

// Show concept associations
console.log('Concept associations for "power":');
const associations = observer.associations('power', 3);
if (associations.length > 0) {
    associations.forEach(({ concept, strength }) => {
        console.log(`  ${concept}: ${strength.toFixed(2)}`);
    });
} else {
    console.log('  (none yet)');
}
console.log();

// Show oscillator phases
console.log('Oscillator phases:');
observer.prsc.oscillators.forEach((osc, i) => {
    console.log(`  p=${osc.prime}: phase=${osc.phase.toFixed(4)}, freq=${osc.frequency.toFixed(4)}`);
});
console.log();

// Show trends
console.log('State trends:');
console.log(`  Coherence trend: ${observer.trend('coherence', 5).toFixed(4)}`);
console.log();

// Set a goal
const goal = observer.setGoal('understand the user', 3);
observer.focus('learning');

console.log('Agency state:');
console.log(`  Active goals: ${observer.agency.goals.filter(g => g.isActive).length}`);
if (goal) {
    console.log(`  Top goal: ${goal.description}`);
}
console.log(`  Top focus: ${observer.agency.getTopFocus()?.target || 'none'}`);
console.log();

// Safety report
const safetyStats = observer.safety.getStats();
console.log('Safety status:');
console.log(`  Constraints: ${safetyStats.constraintCount}`);
console.log(`  Alert level: ${observer.safety.monitor.alertLevel}`);
console.log(`  Is safe: ${safetyStats.isSafe}`);
console.log();

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('================================');
console.log('KEY TAKEAWAYS:');
console.log('1. SedenionMemoryField provides 16D semantic state');
console.log('2. PRSCLayer creates coupled prime oscillators');
console.log('3. TemporalLayer tracks state history and moments');
console.log('4. EntanglementLayer tracks concept co-occurrence');
console.log('5. AgencyLayer manages goals and attention');
console.log('6. BoundaryLayer gates input/output');
console.log('7. SafetyLayer enforces constraints');
console.log('================================');