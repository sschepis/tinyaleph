/**
 * Entanglement Layer
 * 
 * Implements semantic entanglement from "A Design for a Sentient Observer"
 * paper, Section 4.3 and equations 16-17.
 * 
 * Key features:
 * - Phrase segmentation via coherence peaks and energy troughs
 * - Intra-phrase entanglement detection
 * - Entanglement graph building and traversal
 * - Persistent conceptual bindings
 * - Associative recall via entanglement chains
 *
 * @module observer/entanglement
 */

/**
 * Entangled Pair - Two primes with strong correlation
 */
class EntangledPair {
    constructor(data = {}) {
        this.prime1 = data.prime1;
        this.prime2 = data.prime2;
        this.strength = data.strength || 0;
        this.phaseDiff = data.phaseDiff || 0;
        this.formationTime = data.formationTime || Date.now();
        this.accessCount = data.accessCount || 0;
        this.context = data.context || null;
    }
    
    /**
     * Get pair as sorted tuple
     */
    get tuple() {
        return this.prime1 < this.prime2 
            ? [this.prime1, this.prime2] 
            : [this.prime2, this.prime1];
    }
    
    /**
     * Get unique key for this pair
     */
    get key() {
        const [a, b] = this.tuple;
        return `${a}:${b}`;
    }
    
    /**
     * Check if this pair contains a prime
     */
    contains(prime) {
        return this.prime1 === prime || this.prime2 === prime;
    }
    
    /**
     * Get the other prime in the pair
     */
    other(prime) {
        if (this.prime1 === prime) return this.prime2;
        if (this.prime2 === prime) return this.prime1;
        return null;
    }
    
    toJSON() {
        return {
            prime1: this.prime1,
            prime2: this.prime2,
            strength: this.strength,
            phaseDiff: this.phaseDiff,
            formationTime: this.formationTime,
            accessCount: this.accessCount,
            context: this.context
        };
    }
    
    static fromJSON(data) {
        return new EntangledPair(data);
    }
}

/**
 * Phrase - A bounded segment of experience
 * 
 * Phrases are delimited by coherence peaks or energy troughs,
 * representing coherent units of meaning.
 */
class Phrase {
    constructor(data = {}) {
        this.id = data.id || Phrase.generateId();
        this.startTime = data.startTime || Date.now();
        this.endTime = data.endTime || null;
        this.primes = data.primes || [];
        this.entangledPairs = data.entangledPairs || [];
        this.coherencePeak = data.coherencePeak || 0;
        this.energyAtEnd = data.energyAtEnd || 0;
        this.momentIds = data.momentIds || [];
        this.semanticContent = data.semanticContent || null;
    }
    
    static generateId() {
        return `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Duration in milliseconds
     */
    get duration() {
        if (!this.endTime) return Date.now() - this.startTime;
        return this.endTime - this.startTime;
    }
    
    /**
     * Close this phrase
     */
    close(energyAtEnd = 0) {
        this.endTime = Date.now();
        this.energyAtEnd = energyAtEnd;
    }
    
    /**
     * Add a prime to this phrase
     */
    addPrime(prime) {
        if (!this.primes.includes(prime)) {
            this.primes.push(prime);
        }
    }
    
    /**
     * Add an entangled pair
     */
    addEntanglement(pair) {
        this.entangledPairs.push(pair);
    }
    
    toJSON() {
        return {
            id: this.id,
            startTime: this.startTime,
            endTime: this.endTime,
            primes: this.primes,
            entangledPairs: this.entangledPairs.map(p => p.toJSON()),
            coherencePeak: this.coherencePeak,
            energyAtEnd: this.energyAtEnd,
            momentIds: this.momentIds,
            semanticContent: this.semanticContent
        };
    }
    
    static fromJSON(data) {
        const phrase = new Phrase(data);
        phrase.entangledPairs = (data.entangledPairs || []).map(p => EntangledPair.fromJSON(p));
        return phrase;
    }
}

/**
 * Entanglement Layer
 * 
 * Manages semantic entanglement, phrase segmentation, and
 * associative bindings between primes.
 */
class EntanglementLayer {
    /**
     * Create an entanglement layer
     * @param {Object} options - Configuration
     */
    constructor(options = {}) {
        // Thresholds (equation 17)
        this.entanglementThreshold = options.entanglementThreshold || 0.7;
        this.coherencePeakThreshold = options.coherencePeakThreshold || 0.75;
        this.energyTroughThreshold = options.energyTroughThreshold || 0.15;
        
        // Decay parameters
        this.strengthDecay = options.strengthDecay || 0.01;
        this.minStrength = options.minStrength || 0.1;
        
        // Current phrase
        this.currentPhrase = null;
        this.phrases = [];
        
        // Persistent entanglement graph
        // Map from prime -> Map of (otherPrime -> EntangledPair)
        this.entanglementGraph = new Map();
        
        // History for phrase segmentation
        this.coherenceHistory = [];
        this.energyHistory = [];
        this.maxHistory = options.maxHistory || 100;
        
        // Callbacks
        this.onPhraseComplete = options.onPhraseComplete || null;
        this.onEntanglement = options.onEntanglement || null;
    }
    
    /**
     * Update entanglement layer with current oscillator state
     * @param {Object} state - Current state
     * @param {Array} state.oscillators - Array of oscillator objects
     * @param {number} state.coherence - Global coherence
     * @param {number} state.energy - Total energy
     * @param {Object} state.semanticContent - Current semantic content
     */
    update(state) {
        const { oscillators, coherence, energy, semanticContent } = state;
        
        // Update histories
        this.coherenceHistory.push(coherence);
        this.energyHistory.push(energy);
        
        if (this.coherenceHistory.length > this.maxHistory) {
            this.coherenceHistory.shift();
        }
        if (this.energyHistory.length > this.maxHistory) {
            this.energyHistory.shift();
        }
        
        // Check for phrase boundaries
        const isPeak = this.isCoherencePeak(coherence);
        const isTrough = this.isEnergyTrough(energy);
        
        if ((isPeak || isTrough) && this.currentPhrase) {
            // End current phrase
            this.endPhrase(energy, semanticContent);
            
            // Start new phrase if coherence peak (continuing flow)
            if (isPeak) {
                this.startPhrase(coherence);
            }
        } else if (!this.currentPhrase && oscillators && oscillators.length > 0) {
            // Start first phrase
            this.startPhrase(coherence);
        }
        
        // Detect new entanglements
        if (oscillators && this.currentPhrase) {
            const newPairs = this.detectEntanglements(oscillators);
            
            for (const pair of newPairs) {
                this.registerEntanglement(pair);
                this.currentPhrase.addEntanglement(pair);
            }
            
            // Add active primes to current phrase
            for (const osc of oscillators) {
                if (osc.amplitude > 0.1) {
                    this.currentPhrase.addPrime(osc.prime);
                }
            }
        }
        
        // Decay old entanglements
        this.decayEntanglements();
        
        return {
            currentPhrase: this.currentPhrase,
            newPairs: this.currentPhrase ? this.currentPhrase.entangledPairs.slice(-5) : []
        };
    }
    
    /**
     * Start a new phrase
     * @param {number} coherence - Initial coherence
     */
    startPhrase(coherence) {
        this.currentPhrase = new Phrase({
            coherencePeak: coherence
        });
    }
    
    /**
     * End current phrase
     * @param {number} energy - Ending energy
     * @param {Object} semanticContent - Semantic content
     */
    endPhrase(energy, semanticContent = null) {
        if (!this.currentPhrase) return null;
        
        this.currentPhrase.close(energy);
        this.currentPhrase.semanticContent = semanticContent;
        
        this.phrases.push(this.currentPhrase);
        
        if (this.onPhraseComplete) {
            this.onPhraseComplete(this.currentPhrase);
        }
        
        const completed = this.currentPhrase;
        this.currentPhrase = null;
        
        return completed;
    }
    
    /**
     * Check if coherence is a local peak
     */
    isCoherencePeak(coherence) {
        if (coherence < this.coherencePeakThreshold) return false;
        if (this.coherenceHistory.length < 3) return false;
        
        const h = this.coherenceHistory;
        const n = h.length;
        
        // Check if current is higher than recent values
        for (let i = Math.max(0, n - 5); i < n - 1; i++) {
            if (h[i] >= coherence) return false;
        }
        
        return true;
    }
    
    /**
     * Check if energy is at a local trough
     */
    isEnergyTrough(energy) {
        return energy < this.energyTroughThreshold;
    }
    
    /**
     * Detect entanglements between oscillators (equation 16-17)
     * @param {Array} oscillators - Array of oscillators
     */
    detectEntanglements(oscillators) {
        const pairs = [];
        
        for (let i = 0; i < oscillators.length; i++) {
            for (let j = i + 1; j < oscillators.length; j++) {
                const osc1 = oscillators[i];
                const osc2 = oscillators[j];
                
                // Both must be active
                if (osc1.amplitude < 0.1 || osc2.amplitude < 0.1) continue;
                
                // Compute entanglement strength (equation 17)
                const strength = this.computeStrength(osc1, osc2);
                
                if (strength > this.entanglementThreshold) {
                    pairs.push(new EntangledPair({
                        prime1: osc1.prime,
                        prime2: osc2.prime,
                        strength,
                        phaseDiff: Math.abs(osc1.phase - osc2.phase)
                    }));
                }
            }
        }
        
        return pairs;
    }
    
    /**
     * Compute entanglement strength (equation 17)
     * strength(i,j) = ρφ * ρA
     * where ρφ = cos(Δφ) and ρA = min(Ai,Aj) / max(Ai,Aj)
     */
    computeStrength(osc1, osc2) {
        // Phase correlation
        const deltaPhi = Math.abs(osc1.phase - osc2.phase);
        const rhoPhase = Math.cos(deltaPhi);
        
        // Amplitude correlation
        const minA = Math.min(osc1.amplitude, osc2.amplitude);
        const maxA = Math.max(osc1.amplitude, osc2.amplitude);
        const rhoAmplitude = minA / (maxA + 1e-10);
        
        return Math.max(0, rhoPhase * rhoAmplitude);
    }
    
    /**
     * Register an entanglement in the persistent graph
     */
    registerEntanglement(pair) {
        // Ensure both primes have entries
        if (!this.entanglementGraph.has(pair.prime1)) {
            this.entanglementGraph.set(pair.prime1, new Map());
        }
        if (!this.entanglementGraph.has(pair.prime2)) {
            this.entanglementGraph.set(pair.prime2, new Map());
        }
        
        const existing1 = this.entanglementGraph.get(pair.prime1).get(pair.prime2);
        const existing2 = this.entanglementGraph.get(pair.prime2).get(pair.prime1);
        
        if (existing1) {
            // Strengthen existing entanglement
            existing1.strength = Math.min(1.0, existing1.strength + pair.strength * 0.1);
            existing1.accessCount++;
            existing2.strength = existing1.strength;
            existing2.accessCount = existing1.accessCount;
        } else {
            // Create new entanglement
            this.entanglementGraph.get(pair.prime1).set(pair.prime2, pair);
            
            // Create symmetric entry
            const reversePair = new EntangledPair({
                prime1: pair.prime2,
                prime2: pair.prime1,
                strength: pair.strength,
                phaseDiff: pair.phaseDiff,
                formationTime: pair.formationTime
            });
            this.entanglementGraph.get(pair.prime2).set(pair.prime1, reversePair);
            
            if (this.onEntanglement) {
                this.onEntanglement(pair);
            }
        }
    }
    
    /**
     * Decay old entanglements
     */
    decayEntanglements() {
        for (const [prime, neighbors] of this.entanglementGraph) {
            const toRemove = [];
            
            for (const [otherPrime, pair] of neighbors) {
                pair.strength *= (1 - this.strengthDecay);
                
                if (pair.strength < this.minStrength) {
                    toRemove.push(otherPrime);
                }
            }
            
            for (const other of toRemove) {
                neighbors.delete(other);
            }
        }
    }
    
    /**
     * Get all primes entangled with a given prime
     */
    getEntangled(prime) {
        const neighbors = this.entanglementGraph.get(prime);
        if (!neighbors) return [];
        
        return Array.from(neighbors.values())
            .sort((a, b) => b.strength - a.strength);
    }
    
    /**
     * Find entanglement chain from source to target
     * Uses BFS to find shortest path
     */
    findChain(sourcePrime, targetPrime, maxDepth = 5) {
        if (sourcePrime === targetPrime) return [sourcePrime];
        
        const queue = [[sourcePrime]];
        const visited = new Set([sourcePrime]);
        
        while (queue.length > 0) {
            const path = queue.shift();
            if (path.length > maxDepth) continue;
            
            const current = path[path.length - 1];
            const neighbors = this.entanglementGraph.get(current);
            
            if (!neighbors) continue;
            
            for (const [neighbor, pair] of neighbors) {
                if (neighbor === targetPrime) {
                    return [...path, neighbor];
                }
                
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        
        return null; // No path found
    }
    
    /**
     * Get strongly connected cluster around a prime
     */
    getCluster(prime, minStrength = 0.3) {
        const cluster = new Set([prime]);
        const queue = [prime];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = this.entanglementGraph.get(current);
            
            if (!neighbors) continue;
            
            for (const [neighbor, pair] of neighbors) {
                if (!cluster.has(neighbor) && pair.strength >= minStrength) {
                    cluster.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return Array.from(cluster);
    }
    
    /**
     * Get the most strongly entangled prime
     */
    getMostEntangled() {
        let maxPrime = null;
        let maxTotal = 0;
        
        for (const [prime, neighbors] of this.entanglementGraph) {
            let total = 0;
            for (const pair of neighbors.values()) {
                total += pair.strength;
            }
            
            if (total > maxTotal) {
                maxTotal = total;
                maxPrime = prime;
            }
        }
        
        return { prime: maxPrime, totalStrength: maxTotal };
    }
    
    /**
     * Trigger associative recall from a cue
     */
    associativeRecall(cuePrimes, depth = 2) {
        const recalled = new Map();
        let frontier = new Set(cuePrimes);
        
        for (let d = 0; d < depth; d++) {
            const newFrontier = new Set();
            
            for (const prime of frontier) {
                const neighbors = this.entanglementGraph.get(prime);
                if (!neighbors) continue;
                
                for (const [neighbor, pair] of neighbors) {
                    if (!cuePrimes.includes(neighbor)) {
                        const currentStrength = recalled.get(neighbor) || 0;
                        // Decay by depth
                        const addedStrength = pair.strength * Math.pow(0.7, d);
                        recalled.set(neighbor, currentStrength + addedStrength);
                        newFrontier.add(neighbor);
                    }
                }
            }
            
            frontier = newFrontier;
        }
        
        return Array.from(recalled.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([prime, strength]) => ({ prime, strength }));
    }
    
    /**
     * Get statistics about the entanglement graph
     */
    getStats() {
        let totalPairs = 0;
        let totalStrength = 0;
        let maxDegree = 0;
        
        for (const neighbors of this.entanglementGraph.values()) {
            const degree = neighbors.size;
            if (degree > maxDegree) maxDegree = degree;
            
            for (const pair of neighbors.values()) {
                totalPairs++;
                totalStrength += pair.strength;
            }
        }
        
        // Each pair is counted twice (symmetric)
        totalPairs = Math.floor(totalPairs / 2);
        
        return {
            nodeCount: this.entanglementGraph.size,
            edgeCount: totalPairs,
            averageStrength: totalPairs > 0 ? totalStrength / (totalPairs * 2) : 0,
            maxDegree,
            phraseCount: this.phrases.length,
            currentPhraseActive: this.currentPhrase !== null
        };
    }
    
    /**
     * Get recent phrases
     */
    recentPhrases(count = 10) {
        return this.phrases.slice(-count);
    }
    
    /**
     * Clear all entanglements and phrases
     */
    reset() {
        this.entanglementGraph.clear();
        this.phrases = [];
        this.currentPhrase = null;
        this.coherenceHistory = [];
        this.energyHistory = [];
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        // Convert entanglement graph to serializable form
        const graphData = [];
        const seen = new Set();
        
        for (const [prime, neighbors] of this.entanglementGraph) {
            for (const [otherPrime, pair] of neighbors) {
                const key = pair.key;
                if (!seen.has(key)) {
                    seen.add(key);
                    graphData.push(pair.toJSON());
                }
            }
        }
        
        return {
            entanglements: graphData,
            phrases: this.phrases.map(p => p.toJSON()),
            currentPhrase: this.currentPhrase ? this.currentPhrase.toJSON() : null,
            config: {
                entanglementThreshold: this.entanglementThreshold,
                coherencePeakThreshold: this.coherencePeakThreshold,
                energyTroughThreshold: this.energyTroughThreshold
            }
        };
    }
    
    /**
     * Load from JSON
     */
    loadFromJSON(data) {
        this.reset();
        
        // Restore entanglements
        if (data.entanglements) {
            for (const pairData of data.entanglements) {
                const pair = EntangledPair.fromJSON(pairData);
                this.registerEntanglement(pair);
            }
        }
        
        // Restore phrases
        if (data.phrases) {
            this.phrases = data.phrases.map(p => Phrase.fromJSON(p));
        }
        
        if (data.currentPhrase) {
            this.currentPhrase = Phrase.fromJSON(data.currentPhrase);
        }
        
        if (data.config) {
            Object.assign(this, data.config);
        }
    }
}

export {
  EntangledPair,
  Phrase,
  EntanglementLayer
};

export default {
  EntangledPair,
  Phrase,
  EntanglementLayer
};