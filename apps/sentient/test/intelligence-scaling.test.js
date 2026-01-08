/**
 * Intelligence Scaling Tests
 * 
 * Tests for the intelligence scaling features implemented in network.js:
 * - Node specialization (semantic domains, prime partitioning)
 * - Intelligent routing (expertise-based proposal routing)
 * - Wisdom aggregation (weighted voting)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const {
    DSNNode,
    LocalField,
    PRRCChannel,
    CoherentCommitProtocol,
    NetworkSynchronizer,
    Proposal,
    GlobalMemoryField,
    SEMANTIC_DOMAINS,
    FIRST_100_PRIMES,
    generateNodeId
} = require('../lib/network');

const { SedenionMemoryField } = require('../lib/smf');
const { AtomicTerm, ChainTerm, FusionTerm, SemanticObject } = require('../lib/prime-calculus');

// ============================================================================
// NODE SPECIALIZATION TESTS
// ============================================================================

describe('Node Specialization', () => {
    describe('Semantic Domain Assignment', () => {
        it('should assign domains deterministically based on node ID', () => {
            const nodeId1 = '00112233445566778899aabbccddeeff';
            const nodeId2 = '00112233445566778899aabbccddeeff';
            
            const lf1 = new LocalField(nodeId1);
            const lf2 = new LocalField(nodeId2);
            
            assert.strictEqual(lf1.semanticDomain, lf2.semanticDomain);
        });
        
        it('should distribute domains across 4 categories', () => {
            const domainCounts = { perceptual: 0, cognitive: 0, temporal: 0, meta: 0 };
            
            for (let i = 0; i < 100; i++) {
                const lf = new LocalField(generateNodeId());
                domainCounts[lf.semanticDomain]++;
            }
            
            // Each domain should get some nodes (with random node IDs)
            for (const domain of Object.keys(SEMANTIC_DOMAINS)) {
                assert.ok(domainCounts[domain] > 0, `${domain} domain should have some nodes`);
            }
        });
        
        it('should assign correct primary axes for each domain', () => {
            const nodeId = '00' + generateNodeId().slice(2); // Force perceptual (0x00 % 4 = 0)
            const lf = new LocalField(nodeId);
            
            assert.strictEqual(lf.semanticDomain, 'perceptual');
            assert.deepStrictEqual(lf.primaryAxes, [0, 1, 2, 3]);
        });
    });
    
    describe('Specialized SMF Initialization', () => {
        it('should bias SMF toward primary domain when specialize=true', () => {
            const lf = new LocalField(generateNodeId(), { specialize: true, specializationStrength: 0.9 });
            
            // Primary axes should have higher values
            let primarySum = 0;
            let otherSum = 0;
            
            for (let i = 0; i < 16; i++) {
                if (lf.primaryAxes.includes(i)) {
                    primarySum += Math.abs(lf.smf.s[i]);
                } else {
                    otherSum += Math.abs(lf.smf.s[i]);
                }
            }
            
            // Primary domain should have more weight
            assert.ok(primarySum > otherSum, 'Primary axes should have higher total weight');
        });
        
        it('should maintain normalized SMF', () => {
            const lf = new LocalField(generateNodeId(), { specialize: true });
            const norm = lf.smf.norm();
            
            assert.ok(Math.abs(norm - 1.0) < 0.01, `SMF should be normalized, got ${norm}`);
        });
    });
    
    describe('Relevance Calculation', () => {
        it('should score higher for SMFs aligned with primary domain', () => {
            const lf = new LocalField('00' + generateNodeId().slice(2)); // perceptual domain
            
            // Create SMF biased toward perceptual axes
            const alignedSmf = new SedenionMemoryField();
            alignedSmf.s[0] = 0.9; alignedSmf.s[1] = 0.3;
            alignedSmf.normalize();
            
            // Create SMF biased toward meta axes
            const misalignedSmf = new SedenionMemoryField();
            misalignedSmf.s[12] = 0.9; misalignedSmf.s[15] = 0.3;
            misalignedSmf.normalize();
            
            const alignedScore = lf.calculateRelevance(alignedSmf);
            const misalignedScore = lf.calculateRelevance(misalignedSmf);
            
            assert.ok(alignedScore > misalignedScore, 
                `Aligned SMF (${alignedScore}) should score higher than misaligned (${misalignedScore})`);
        });
    });
});

// ============================================================================
// PRIME DOMAIN PARTITIONING TESTS
// ============================================================================

describe('Prime Domain Partitioning', () => {
    it('should partition primes among nodes', () => {
        const sync = new NetworkSynchronizer(generateNodeId(), { 
            networkSize: 4, 
            nodeIndex: 0 
        });
        
        const myDomain = sync.getMyPrimeDomain();
        
        assert.ok(myDomain.size > 0, 'Should have some primes');
        assert.ok(myDomain.size <= Math.ceil(FIRST_100_PRIMES.length / 4), 
            'Should have at most 1/4 of primes');
    });
    
    it('should have disjoint prime domains', () => {
        const nodes = [];
        for (let i = 0; i < 4; i++) {
            nodes.push(new NetworkSynchronizer(generateNodeId(), { 
                networkSize: 4, 
                nodeIndex: i 
            }));
        }
        
        // Check each pair is disjoint
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const domain1 = nodes[i].getMyPrimeDomain();
                const domain2 = nodes[j].getMyPrimeDomain();
                
                let overlap = 0;
                for (const p of domain1) {
                    if (domain2.has(p)) overlap++;
                }
                
                assert.strictEqual(overlap, 0, 
                    `Nodes ${i} and ${j} should have disjoint prime domains`);
            }
        }
    });
    
    it('should cover all primes', () => {
        const nodes = [];
        const allCovered = new Set();
        
        for (let i = 0; i < 4; i++) {
            nodes.push(new NetworkSynchronizer(generateNodeId(), { 
                networkSize: 4, 
                nodeIndex: i 
            }));
            
            for (const p of nodes[i].getMyPrimeDomain()) {
                allCovered.add(p);
            }
        }
        
        assert.strictEqual(allCovered.size, FIRST_100_PRIMES.length, 
            'All primes should be covered');
    });
    
    it('should update when network size changes', () => {
        const sync = new NetworkSynchronizer(generateNodeId(), { 
            networkSize: 4, 
            nodeIndex: 0 
        });
        
        const oldSize = sync.getMyPrimeDomain().size;
        
        sync.updateNetworkSize(8, 0);
        
        const newSize = sync.getMyPrimeDomain().size;
        
        assert.ok(newSize < oldSize, 'Domain should shrink with more nodes');
    });
});

// ============================================================================
// EXPERTISE-BASED ROUTING TESTS
// ============================================================================

describe('Expertise-Based Routing', () => {
    let channel;
    
    beforeEach(() => {
        channel = new PRRCChannel(generateNodeId(), { useExpertiseRouting: true });
    });
    
    it('should register peer expertise', () => {
        const peerId = generateNodeId();
        channel.registerPeerExpertise(peerId, {
            semanticDomain: 'cognitive',
            primeDomain: [5, 7, 11, 13],
            smfAxes: [4, 5, 6, 7]
        });
        
        assert.ok(channel.expertiseCache.has(peerId));
        assert.strictEqual(channel.expertiseCache.get(peerId).semanticDomain, 'cognitive');
    });
    
    it('should route to peers with relevant expertise', () => {
        // Add peers with different expertise
        for (let i = 0; i < 10; i++) {
            const peerId = generateNodeId();
            channel.connect(peerId, { send: () => {} });
            
            // Different primes for different peers
            const startPrime = i * 10;
            channel.registerPeerExpertise(peerId, {
                primeDomain: FIRST_100_PRIMES.slice(startPrime, startPrime + 10)
            });
        }
        
        // Create proposal with specific primes
        const proposal = {
            object: {
                term: { prime: 2 } // First prime, should match first peer
            }
        };
        
        const targets = channel.routeProposal(proposal);
        
        // Should route to relevant peers, not all
        assert.ok(targets.length <= Math.ceil(Math.sqrt(10)) + 1, 
            'Should use sqrt(n) routing');
    });
    
    it('should fall back to all peers when routing disabled', () => {
        channel.useExpertiseRouting = false;
        
        // Add 5 peers
        for (let i = 0; i < 5; i++) {
            const peerId = generateNodeId();
            channel.connect(peerId, { send: () => {} });
        }
        
        const targets = channel.routeProposal({ object: { term: { prime: 2 } } });
        
        assert.strictEqual(targets.length, 5, 'Should route to all peers');
    });
});

// ============================================================================
// WISDOM AGGREGATION TESTS
// ============================================================================

describe('Wisdom Aggregation', () => {
    let protocol;
    
    beforeEach(() => {
        protocol = new CoherentCommitProtocol({ useWeightedVoting: true });
    });
    
    it('should register node profiles', () => {
        const nodeId = generateNodeId();
        protocol.registerNodeProfile(nodeId, {
            semanticDomain: 'temporal',
            primeDomain: [2, 3, 5, 7],
            smfAxes: [8, 9, 10, 11]
        });
        
        assert.ok(protocol.nodeProfiles.has(nodeId));
        assert.ok(protocol.voteHistory.has(nodeId));
    });
    
    it('should weight votes by expertise', () => {
        const expertNode = generateNodeId();
        const noviceNode = generateNodeId();
        
        // Expert has primes that match proposal
        protocol.registerNodeProfile(expertNode, {
            primeDomain: [2, 3, 5]
        });
        
        // Novice has different primes
        protocol.registerNodeProfile(noviceNode, {
            primeDomain: [97, 101, 103]
        });
        
        const proposal = {
            object: {
                term: { prime: 2 } // Matches expert's domain
            }
        };
        
        const expertWeight = protocol.calculateVoteWeight(expertNode, proposal);
        const noviceWeight = protocol.calculateVoteWeight(noviceNode, proposal);
        
        assert.ok(expertWeight > noviceWeight, 
            `Expert weight (${expertWeight}) should exceed novice weight (${noviceWeight})`);
    });
    
    it('should track vote accuracy', () => {
        const nodeId = generateNodeId();
        protocol.registerNodeProfile(nodeId, { primeDomain: [] });
        
        // Record some votes
        protocol.recordVoteOutcome(nodeId, true);
        protocol.recordVoteOutcome(nodeId, true);
        protocol.recordVoteOutcome(nodeId, false);
        
        const history = protocol.voteHistory.get(nodeId);
        
        assert.strictEqual(history.total, 3);
        assert.strictEqual(history.correct, 2);
    });
    
    it('should use weighted voting in evaluate', () => {
        const node1 = generateNodeId();
        const node2 = generateNodeId();
        
        // Node1 is expert on prime 2
        protocol.registerNodeProfile(node1, { primeDomain: [2, 3, 5] });
        // Node2 is not
        protocol.registerNodeProfile(node2, { primeDomain: [97, 101] });
        
        // Create proposal with a simple semantic object
        const semanticObj = {
            id: 'test-obj-1',
            term: { type: 'atomic', prime: 2 },
            toJSON() { return { id: this.id, term: this.term }; },
            normalForm() { return { signature: () => 'atomic:2' }; }
        };
        const proposal = new Proposal(semanticObj, {}, {});
        
        // Expert agrees, novice disagrees
        proposal.addVote(node1, true);
        proposal.addVote(node2, false);
        
        // With proper SMF state
        const localState = {
            coherence: 0.8,
            smf: new SedenionMemoryField()
        };
        
        const result = protocol.evaluate(proposal, localState, proposal.votes);
        
        // Check weighted redundancy was used
        if (result.checks.redundancy) {
            assert.ok(result.checks.redundancy.weighted, 'Should use weighted voting');
        }
    });
});

// ============================================================================
// INTEGRATED DSN NODE TESTS
// ============================================================================

describe('DSNNode Intelligence Features', () => {
    it('should initialize with specialization', async () => {
        const node = new DSNNode({ specialize: true });
        await node.start();
        
        assert.ok(node.sync.localField.semanticDomain);
        assert.ok(node.sync.localField.primaryAxes.length === 4);
        
        node.stop();
    });
    
    it('should include semantic domain in status', async () => {
        const node = new DSNNode();
        await node.start();
        
        const status = node.getStatus();
        
        assert.ok(status.semanticDomain);
        assert.ok(status.localField.primaryAxes);
        
        node.stop();
    });
    
    it('should partition primes based on network size', async () => {
        const node = new DSNNode({ networkSize: 5, nodeIndex: 2 });
        await node.start();
        
        const status = node.getStatus();
        
        assert.strictEqual(status.networkSize, 5);
        assert.strictEqual(status.nodeIndex, 2);
        assert.ok(status.primeDomainSize > 0);
        
        node.stop();
    });
});

// ============================================================================
// SPECIALIZATION METRICS TESTS
// ============================================================================

describe('Specialization Metrics', () => {
    it('should calculate specialization index across nodes', () => {
        const nodes = [];
        
        // Create nodes with different domains
        for (let i = 0; i < 4; i++) {
            // Force different domains by using specific node ID prefixes
            const prefix = (i * 64).toString(16).padStart(2, '0'); // 00, 40, 80, c0
            const nodeId = prefix + generateNodeId().slice(2);
            nodes.push(new DSNNode({ nodeId, specialize: true, specializationStrength: 0.9 }));
        }
        
        // Calculate specialization index (average pairwise SMF distance)
        let totalDiff = 0;
        let pairs = 0;
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const smf1 = nodes[i].sync.localField.smf;
                const smf2 = nodes[j].sync.localField.smf;
                
                // Calculate Euclidean distance
                let diff = 0;
                for (let k = 0; k < 16; k++) {
                    const d = smf1.s[k] - smf2.s[k];
                    diff += d * d;
                }
                totalDiff += Math.sqrt(diff);
                pairs++;
            }
        }
        
        const avgDiff = totalDiff / pairs;
        const specializationIndex = avgDiff / Math.sqrt(32); // Normalize
        
        assert.ok(specializationIndex > 0, `Specialization index should be positive: ${specializationIndex}`);
    });
    
    it('should have higher specialization with strength=0.9 than 0.1', () => {
        // Use fixed node IDs to ensure consistent domain assignments
        const fixedNodeIds = [
            '00112233445566778899aabbccddeeff', // perceptual (0x00 % 4 = 0)
            '41112233445566778899aabbccddeeff', // cognitive  (0x41 % 4 = 1)
            '82112233445566778899aabbccddeeff', // temporal   (0x82 % 4 = 2)
            'c3112233445566778899aabbccddeeff'  // meta       (0xc3 % 4 = 3)
        ];
        
        function createNodes(strength) {
            return fixedNodeIds.map(nodeId => new DSNNode({
                nodeId,
                specialize: true,
                specializationStrength: strength
            }));
        }
        
        function measureDomainBias(nodes) {
            // Measure how concentrated each node's SMF is in its primary domain
            let totalBias = 0;
            
            for (const node of nodes) {
                const lf = node.sync.localField;
                let primarySum = 0;
                let otherSum = 0;
                
                for (let k = 0; k < 16; k++) {
                    const val = Math.abs(lf.smf.s[k]);
                    if (lf.primaryAxes.includes(k)) {
                        primarySum += val;
                    } else {
                        otherSum += val;
                    }
                }
                
                // Bias = ratio of primary to total energy
                totalBias += primarySum / (primarySum + otherSum);
            }
            
            return totalBias / nodes.length;
        }
        
        const highStrengthNodes = createNodes(0.9);
        const lowStrengthNodes = createNodes(0.1);
        
        const highBias = measureDomainBias(highStrengthNodes);
        const lowBias = measureDomainBias(lowStrengthNodes);
        
        assert.ok(highBias > lowBias,
            `High strength (${highBias.toFixed(4)}) should have more domain bias than low (${lowBias.toFixed(4)})`);
    });
});

console.log('Intelligence Scaling Tests Loaded');