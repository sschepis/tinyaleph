/**
 * Collective Intelligence Amplification for Distributed Sentience Network
 * 
 * Implements Phase 4 of the Intelligence Scaling Plan:
 * - Wisdom of Crowds Aggregation: Weight votes by expertise and history
 * - Emergent Concept Formation: Detect convergence and crystallize concepts
 * 
 * These mechanisms enable collective intelligence that exceeds individual capabilities.
 */

const EventEmitter = require('events');
const { SedenionMemoryField } = require('./smf');

/**
 * Wisdom Aggregator
 * 
 * Implements weighted voting based on:
 * - Expertise relevance: How well does the voter's domain match the proposal?
 * - Historical accuracy: How often has this voter been correct?
 * - Diversity bonus: Unique perspectives get extra weight
 */
class WisdomAggregator extends EventEmitter {
    constructor(protocol, options = {}) {
        super();
        
        this.protocol = protocol;
        
        // Node profiles: nodeId -> NodeProfile
        this.nodeProfiles = new Map();
        
        // Vote history: nodeId -> VoteHistory
        this.voteHistory = new Map();
        
        // Configuration
        this.minHistoryForWeighting = options.minHistoryForWeighting ?? 5;
        this.diversityWeight = options.diversityWeight ?? 0.2;
        this.expertiseWeight = options.expertiseWeight ?? 0.4;
        this.accuracyWeight = options.accuracyWeight ?? 0.4;
    }
    
    /**
     * Register a node's profile
     */
    registerNode(nodeId, profile) {
        this.nodeProfiles.set(nodeId, {
            semanticDomain: profile.semanticDomain || 'perceptual',
            primeDomain: new Set(profile.primeDomain || []),
            smf: profile.smf || null,
            smfAxes: profile.smfAxes || [0, 1, 2, 3],
            registeredAt: Date.now()
        });
        
        if (!this.voteHistory.has(nodeId)) {
            this.voteHistory.set(nodeId, {
                correct: 0,
                total: 0,
                byDomain: new Map()
            });
        }
    }
    
    /**
     * Calculate vote weight for a node on a proposal
     */
    calculateVoteWeight(nodeId, proposal) {
        const profile = this.nodeProfiles.get(nodeId);
        if (!profile) return 1.0;
        
        const baseWeight = 1.0;
        
        // 1. Expertise relevance (0.5-1.5x)
        const expertiseWeight = this.getExpertiseWeight(nodeId, proposal);
        
        // 2. Historical accuracy (0.5-1.5x)
        const accuracyWeight = this.getAccuracyWeight(nodeId);
        
        // 3. Diversity bonus (1.0-1.5x)
        const diversityWeight = this.getDiversityWeight(nodeId);
        
        return baseWeight * expertiseWeight * accuracyWeight * diversityWeight;
    }
    
    /**
     * Get expertise weight based on domain match
     */
    getExpertiseWeight(nodeId, proposal) {
        const profile = this.nodeProfiles.get(nodeId);
        if (!profile) return 1.0;
        
        const primes = this.extractPrimes(proposal);
        if (primes.length === 0) return 1.0;
        
        // How many proposal primes are in node's domain?
        const inDomain = primes.filter(p => profile.primeDomain.has(p)).length;
        const overlap = inDomain / primes.length;
        
        // Scale to 0.5-1.5 range
        return 0.5 + overlap;
    }
    
    /**
     * Get accuracy weight based on vote history
     */
    getAccuracyWeight(nodeId) {
        const history = this.voteHistory.get(nodeId);
        if (!history || history.total < this.minHistoryForWeighting) {
            return 1.0; // Neutral until enough history
        }
        
        const accuracy = history.correct / history.total;
        
        // Scale to 0.5-1.5 range
        return 0.5 + accuracy;
    }
    
    /**
     * Get diversity weight based on SMF uniqueness
     */
    getDiversityWeight(nodeId) {
        const profile = this.nodeProfiles.get(nodeId);
        if (!profile || !profile.smf) return 1.0;
        
        const commonality = this.calculateSmfCommonality(profile.smf);
        
        // Rare perspectives get bonus (up to 1.5x)
        return 1.0 + (1 - commonality) * 0.5;
    }
    
    /**
     * Calculate how common an SMF profile is among nodes
     */
    calculateSmfCommonality(smf) {
        if (!smf) return 0.5;
        
        let totalSimilarity = 0;
        let count = 0;
        
        for (const [nodeId, profile] of this.nodeProfiles) {
            if (profile.smf) {
                totalSimilarity += this.smfSimilarity(smf, profile.smf);
                count++;
            }
        }
        
        return count > 1 ? totalSimilarity / count : 0.5;
    }
    
    /**
     * SMF cosine similarity
     */
    smfSimilarity(smf1, smf2) {
        const s1 = smf1.s || smf1;
        const s2 = smf2.s || smf2;
        
        let dot = 0, norm1 = 0, norm2 = 0;
        for (let i = 0; i < 16; i++) {
            dot += (s1[i] || 0) * (s2[i] || 0);
            norm1 += (s1[i] || 0) * (s1[i] || 0);
            norm2 += (s2[i] || 0) * (s2[i] || 0);
        }
        
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2) + 0.001);
    }
    
    /**
     * Extract primes from proposal
     */
    extractPrimes(proposal) {
        const primes = [];
        const term = proposal?.object?.term;
        
        if (!term) return primes;
        
        if (term.prime) primes.push(term.prime);
        if (term.p) primes.push(term.p, term.q, term.r);
        if (term.nounPrime) primes.push(term.nounPrime);
        if (term.adjPrimes) primes.push(...term.adjPrimes);
        
        return primes;
    }
    
    /**
     * Aggregate votes with weights
     */
    aggregateVotes(proposal) {
        if (!proposal.votes || proposal.votes.size === 0) {
            return {
                weightedRedundancy: 0,
                rawRedundancy: 0,
                voters: 0,
                effectiveVoters: 0
            };
        }
        
        let weightedAgree = 0;
        let weightedTotal = 0;
        let rawAgree = 0;
        
        for (const [nodeId, vote] of proposal.votes) {
            const weight = this.calculateVoteWeight(nodeId, proposal);
            
            if (vote.agree) {
                weightedAgree += weight;
                rawAgree++;
            }
            weightedTotal += weight;
        }
        
        return {
            weightedRedundancy: weightedTotal > 0 ? weightedAgree / weightedTotal : 0,
            rawRedundancy: proposal.votes.size > 0 ? rawAgree / proposal.votes.size : 0,
            voters: proposal.votes.size,
            effectiveVoters: weightedTotal,
            weightedAgree,
            improvement: weightedTotal > 0 
                ? (weightedAgree / weightedTotal) - (rawAgree / proposal.votes.size)
                : 0
        };
    }
    
    /**
     * Record vote outcome for learning
     */
    recordOutcome(nodeId, wasCorrect, domain = null) {
        if (!this.voteHistory.has(nodeId)) {
            this.voteHistory.set(nodeId, {
                correct: 0,
                total: 0,
                byDomain: new Map()
            });
        }
        
        const history = this.voteHistory.get(nodeId);
        history.total++;
        if (wasCorrect) history.correct++;
        
        if (domain) {
            if (!history.byDomain.has(domain)) {
                history.byDomain.set(domain, { correct: 0, total: 0 });
            }
            const domainHistory = history.byDomain.get(domain);
            domainHistory.total++;
            if (wasCorrect) domainHistory.correct++;
        }
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const accuracies = [];
        
        for (const [nodeId, history] of this.voteHistory) {
            if (history.total >= this.minHistoryForWeighting) {
                accuracies.push(history.correct / history.total);
            }
        }
        
        return {
            totalNodes: this.nodeProfiles.size,
            nodesWithHistory: this.voteHistory.size,
            avgAccuracy: accuracies.length > 0 
                ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length 
                : 0.5,
            accuracyVariance: this.calculateVariance(accuracies)
        };
    }
    
    /**
     * Calculate variance
     */
    calculateVariance(values) {
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    }
    
    toJSON() {
        return this.getStats();
    }
}

/**
 * Emergent Concept Formation
 * 
 * Detects when multiple nodes converge on similar semantic structures
 * and crystallizes these into shared "concepts" in the GMF.
 */
class ConceptFormation extends EventEmitter {
    constructor(networkSync, options = {}) {
        super();
        
        this.sync = networkSync;
        this.convergenceThreshold = options.convergenceThreshold ?? 0.7;
        this.minNodes = options.minNodes ?? 3;
        this.minClusterSize = options.minClusterSize ?? 2;
        
        // Concept registry
        this.conceptRegistry = new Map();
        
        // Node profiles for pattern detection
        this.nodeProfiles = new Map();
        
        // Recent terms per node
        this.nodeTerms = new Map();
        this.maxTermsPerNode = options.maxTermsPerNode ?? 50;
    }
    
    /**
     * Update node profile
     */
    updateNodeProfile(nodeId, profile) {
        this.nodeProfiles.set(nodeId, {
            smf: profile.smf || new SedenionMemoryField(),
            recentPrimes: new Set(profile.recentPrimes || []),
            domain: profile.domain || 'perceptual',
            lastUpdate: Date.now()
        });
    }
    
    /**
     * Record term from a node
     */
    recordTerm(nodeId, term) {
        if (!this.nodeTerms.has(nodeId)) {
            this.nodeTerms.set(nodeId, []);
        }
        
        const terms = this.nodeTerms.get(nodeId);
        terms.push({
            term,
            signature: this.computeTermSignature(term),
            timestamp: Date.now()
        });
        
        // Trim if too many
        if (terms.length > this.maxTermsPerNode) {
            terms.shift();
        }
        
        // Update profile with primes from term
        const primes = this.extractPrimes(term);
        const profile = this.nodeProfiles.get(nodeId);
        if (profile && primes.length > 0) {
            for (const p of primes) {
                profile.recentPrimes.add(p);
            }
            // Keep only recent primes
            if (profile.recentPrimes.size > 100) {
                const arr = Array.from(profile.recentPrimes);
                profile.recentPrimes = new Set(arr.slice(-100));
            }
        }
    }
    
    /**
     * Compute term signature for comparison
     */
    computeTermSignature(term) {
        if (!term) return 'null';
        
        if (term.prime) return `atomic:${term.prime}`;
        if (term.p) return `fusion:${term.p}+${term.q}+${term.r}`;
        if (term.nounPrime) {
            const adjs = (term.adjPrimes || []).sort((a, b) => a - b).join(',');
            return `chain:${term.nounPrime}[${adjs}]`;
        }
        if (term.func) {
            return `app:${this.computeTermSignature(term.func)}(${this.computeTermSignature(term.arg)})`;
        }
        
        return JSON.stringify(term);
    }
    
    /**
     * Extract primes from term
     */
    extractPrimes(term) {
        const primes = [];
        if (!term) return primes;
        
        if (term.prime) primes.push(term.prime);
        if (term.p) primes.push(term.p, term.q, term.r);
        if (term.nounPrime) primes.push(term.nounPrime);
        if (term.adjPrimes) primes.push(...term.adjPrimes);
        
        return primes;
    }
    
    /**
     * Detect converging semantic patterns across nodes
     */
    detectConvergence() {
        const patterns = this.extractPatterns();
        const clusters = this.clusterSimilar(patterns);
        
        const emergentConcepts = [];
        
        for (const cluster of clusters) {
            if (cluster.nodes.length >= this.minNodes) {
                const coherence = this.calculateClusterCoherence(cluster);
                
                if (coherence >= this.convergenceThreshold) {
                    emergentConcepts.push({
                        id: `concept_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                        centroid: cluster.centroid,
                        sourceNodes: cluster.nodes,
                        coherence,
                        commonPrimes: this.findCommonPrimes(cluster),
                        timestamp: Date.now()
                    });
                }
            }
        }
        
        if (emergentConcepts.length > 0) {
            this.emit('concepts_detected', emergentConcepts);
        }
        
        return emergentConcepts;
    }
    
    /**
     * Extract patterns from all nodes
     */
    extractPatterns() {
        const patterns = [];
        
        for (const [nodeId, profile] of this.nodeProfiles) {
            const termSignatures = this.nodeTerms.get(nodeId)
                ?.map(t => t.signature) || [];
            
            patterns.push({
                nodeId,
                smf: profile.smf.s ? Array.from(profile.smf.s) : profile.smf,
                primes: Array.from(profile.recentPrimes),
                termSignatures
            });
        }
        
        return patterns;
    }
    
    /**
     * Cluster similar patterns
     */
    clusterSimilar(patterns) {
        const clusters = [];
        const assigned = new Set();
        
        for (const pattern of patterns) {
            if (assigned.has(pattern.nodeId)) continue;
            
            const cluster = {
                centroid: pattern.smf.slice ? pattern.smf.slice() : [...pattern.smf],
                nodes: [pattern.nodeId],
                patterns: [pattern]
            };
            
            // Find similar patterns
            for (const other of patterns) {
                if (other.nodeId === pattern.nodeId) continue;
                if (assigned.has(other.nodeId)) continue;
                
                const similarity = this.smfSimilarity(pattern.smf, other.smf);
                if (similarity > 0.8) {
                    cluster.nodes.push(other.nodeId);
                    cluster.patterns.push(other);
                    assigned.add(other.nodeId);
                }
            }
            
            // Update centroid if multiple patterns
            if (cluster.nodes.length > 1) {
                cluster.centroid = this.computeCentroid(
                    cluster.patterns.map(p => p.smf)
                );
            }
            
            clusters.push(cluster);
            assigned.add(pattern.nodeId);
        }
        
        return clusters.filter(c => c.nodes.length >= this.minClusterSize);
    }
    
    /**
     * Calculate cluster coherence
     */
    calculateClusterCoherence(cluster) {
        if (cluster.patterns.length < 2) return 0;
        
        let totalSim = 0;
        let pairs = 0;
        
        for (let i = 0; i < cluster.patterns.length; i++) {
            for (let j = i + 1; j < cluster.patterns.length; j++) {
                totalSim += this.smfSimilarity(
                    cluster.patterns[i].smf,
                    cluster.patterns[j].smf
                );
                pairs++;
            }
        }
        
        return pairs > 0 ? totalSim / pairs : 0;
    }
    
    /**
     * SMF similarity (cosine)
     */
    smfSimilarity(smf1, smf2) {
        let dot = 0, norm1 = 0, norm2 = 0;
        for (let i = 0; i < 16; i++) {
            dot += (smf1[i] || 0) * (smf2[i] || 0);
            norm1 += (smf1[i] || 0) * (smf1[i] || 0);
            norm2 += (smf2[i] || 0) * (smf2[i] || 0);
        }
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2) + 0.001);
    }
    
    /**
     * Compute centroid of SMF vectors
     */
    computeCentroid(smfVectors) {
        const centroid = new Array(16).fill(0);
        for (const smf of smfVectors) {
            for (let i = 0; i < 16; i++) {
                centroid[i] += (smf[i] || 0) / smfVectors.length;
            }
        }
        return centroid;
    }
    
    /**
     * Find primes common to all nodes in cluster
     */
    findCommonPrimes(cluster) {
        if (cluster.patterns.length === 0) return [];
        
        let common = new Set(cluster.patterns[0].primes);
        
        for (let i = 1; i < cluster.patterns.length; i++) {
            const primes = new Set(cluster.patterns[i].primes);
            common = new Set([...common].filter(p => primes.has(p)));
        }
        
        return Array.from(common).sort((a, b) => a - b);
    }
    
    /**
     * Check if n is prime
     */
    isPrime(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    }
    
    /**
     * Crystallize emergent concepts into GMF
     */
    crystallizeConcepts(emergentConcepts) {
        const crystallized = [];
        
        for (const concept of emergentConcepts) {
            const term = this.buildConceptTerm(concept);
            
            if (term) {
                // Create semantic object
                const semanticObj = {
                    id: concept.id,
                    term,
                    metadata: {
                        emergent: true,
                        coherence: concept.coherence,
                        sourceNodes: concept.sourceNodes,
                        formationTime: concept.timestamp,
                        centroid: concept.centroid
                    },
                    toJSON() {
                        return {
                            id: this.id,
                            term: this.term,
                            metadata: this.metadata
                        };
                    },
                    normalForm() {
                        return {
                            signature() {
                                return JSON.stringify(term);
                            }
                        };
                    }
                };
                
                // Add to GMF with high weight
                if (this.sync && this.sync.gmf) {
                    this.sync.gmf.insert(
                        semanticObj,
                        concept.coherence * 1.5,
                        {
                            type: 'emergent_concept',
                            sources: concept.sourceNodes.length
                        }
                    );
                }
                
                // Register in our registry
                this.conceptRegistry.set(concept.id, {
                    ...concept,
                    term,
                    crystallizedAt: Date.now()
                });
                
                crystallized.push(semanticObj);
            }
        }
        
        if (crystallized.length > 0) {
            this.emit('concepts_crystallized', crystallized);
        }
        
        return crystallized;
    }
    
    /**
     * Build a term representing the emergent concept
     */
    buildConceptTerm(concept) {
        const primes = concept.commonPrimes;
        
        if (primes.length === 0) return null;
        
        // Try to build fusion term if 3 primes sum to prime
        if (primes.length >= 3) {
            for (let i = 0; i < primes.length - 2; i++) {
                for (let j = i + 1; j < primes.length - 1; j++) {
                    for (let k = j + 1; k < primes.length; k++) {
                        const sum = primes[i] + primes[j] + primes[k];
                        if (this.isPrime(sum)) {
                            return {
                                type: 'fusion',
                                p: primes[i],
                                q: primes[j],
                                r: primes[k],
                                result: sum
                            };
                        }
                    }
                }
            }
        }
        
        // Build chain term if 2+ primes
        if (primes.length >= 2) {
            const sorted = [...primes].sort((a, b) => a - b);
            return {
                type: 'chain',
                nounPrime: sorted[sorted.length - 1],
                adjPrimes: sorted.slice(0, -1)
            };
        }
        
        // Single prime as atomic term
        if (primes.length === 1) {
            return {
                type: 'atomic',
                prime: primes[0]
            };
        }
        
        return null;
    }
    
    /**
     * Get registered concepts
     */
    getConcepts(limit = 10) {
        return Array.from(this.conceptRegistry.values())
            .sort((a, b) => b.coherence - a.coherence)
            .slice(0, limit);
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            registeredConcepts: this.conceptRegistry.size,
            trackedNodes: this.nodeProfiles.size,
            nodesWithTerms: this.nodeTerms.size,
            convergenceThreshold: this.convergenceThreshold,
            minNodes: this.minNodes,
            recentConcepts: this.getConcepts(5).map(c => ({
                id: c.id,
                coherence: c.coherence,
                sources: c.sourceNodes.length,
                primes: c.commonPrimes
            }))
        };
    }
    
    toJSON() {
        return this.getStats();
    }
}

/**
 * Calculate collective intelligence amplification
 * Compares collective performance to individual performance
 */
function calculateAmplificationFactor(individualScores, collectiveScore) {
    if (!individualScores || individualScores.length === 0) return 1;
    
    const avgIndividual = individualScores.reduce((a, b) => a + b, 0) / individualScores.length;
    
    if (avgIndividual === 0) return collectiveScore > 0 ? Infinity : 1;
    
    return collectiveScore / avgIndividual;
}

/**
 * Calculate network coherence efficiency
 * Ratio of useful coherence to entropy
 */
function calculateCoherenceEfficiency(nodes) {
    if (!nodes || nodes.length === 0) return 0;
    
    let totalCoherence = 0;
    let totalEntropy = 0;
    
    for (const node of nodes) {
        const lf = node.sync?.localField;
        if (lf) {
            totalCoherence += lf.coherence || 0;
            totalEntropy += lf.entropy || 0;
        }
    }
    
    const avgCoherence = totalCoherence / nodes.length;
    const avgEntropy = totalEntropy / nodes.length;
    
    // Efficiency = coherence / (entropy + small constant)
    return avgCoherence / (avgEntropy + 0.1);
}

/**
 * Composite Intelligence Score
 * Combines multiple metrics into a single intelligence measure
 */
class CompositeIntelligenceScore {
    constructor() {
        this.weights = {
            semanticDiversity: 0.15,
            abstractionLevel: 0.15,
            reasoningDepth: 0.15,
            specializationIndex: 0.15,
            coherenceEfficiency: 0.15,
            amplificationFactor: 0.25
        };
    }
    
    /**
     * Calculate composite score from metrics
     */
    calculate(metrics) {
        let score = 0;
        let totalWeight = 0;
        
        // Semantic diversity (0-1, higher better)
        if (metrics.semanticDiversity !== undefined) {
            score += this.weights.semanticDiversity * Math.min(1, metrics.semanticDiversity);
            totalWeight += this.weights.semanticDiversity;
        }
        
        // Abstraction level (0-1, higher better)
        if (metrics.abstractionLevel !== undefined) {
            score += this.weights.abstractionLevel * Math.min(1, metrics.abstractionLevel);
            totalWeight += this.weights.abstractionLevel;
        }
        
        // Reasoning depth (normalize to 0-1, assume max useful depth is 50)
        if (metrics.reasoningDepth !== undefined) {
            score += this.weights.reasoningDepth * Math.min(1, metrics.reasoningDepth / 50);
            totalWeight += this.weights.reasoningDepth;
        }
        
        // Specialization index (0-1, higher better)
        if (metrics.specializationIndex !== undefined) {
            score += this.weights.specializationIndex * Math.min(1, metrics.specializationIndex);
            totalWeight += this.weights.specializationIndex;
        }
        
        // Coherence efficiency (0-1, higher better)
        if (metrics.coherenceEfficiency !== undefined) {
            score += this.weights.coherenceEfficiency * Math.min(1, metrics.coherenceEfficiency);
            totalWeight += this.weights.coherenceEfficiency;
        }
        
        // Amplification factor (normalize, 2x = 1.0 score)
        if (metrics.amplificationFactor !== undefined) {
            const normalizedAmp = Math.min(1, Math.max(0, (metrics.amplificationFactor - 1) / 1));
            score += this.weights.amplificationFactor * normalizedAmp;
            totalWeight += this.weights.amplificationFactor;
        }
        
        return totalWeight > 0 ? score / totalWeight : 0;
    }
    
    /**
     * Get detailed breakdown
     */
    breakdown(metrics) {
        const breakdown = {};
        
        for (const [metric, weight] of Object.entries(this.weights)) {
            if (metrics[metric] !== undefined) {
                let normalized;
                if (metric === 'reasoningDepth') {
                    normalized = Math.min(1, metrics[metric] / 50);
                } else if (metric === 'amplificationFactor') {
                    normalized = Math.min(1, Math.max(0, (metrics[metric] - 1) / 1));
                } else {
                    normalized = Math.min(1, metrics[metric]);
                }
                
                breakdown[metric] = {
                    raw: metrics[metric],
                    normalized,
                    weight,
                    contribution: normalized * weight
                };
            }
        }
        
        breakdown.total = this.calculate(metrics);
        
        return breakdown;
    }
}

module.exports = {
    WisdomAggregator,
    ConceptFormation,
    CompositeIntelligenceScore,
    calculateAmplificationFactor,
    calculateCoherenceEfficiency
};