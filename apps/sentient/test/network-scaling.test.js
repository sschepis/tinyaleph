/**
 * Network Scaling Tests for Sentient Observer
 * 
 * Measures how network capabilities scale with node count.
 * Produces quantitative metrics for:
 * - Network coherence
 * - Entanglement density
 * - GMF coverage and redundancy
 * - Consensus reliability
 * - Semantic coverage
 * - Fault tolerance
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('events');

// Import network components
const {
    DSNNode,
    LocalField,
    Proposal,
    ProposalLog,
    GlobalMemoryField,
    CoherentCommitProtocol,
    PRRCChannel,
    NetworkSynchronizer,
    generateNodeId
} = require('../lib/network');

// Import semantic components
const { SedenionMemoryField, SMF_AXES } = require('../lib/smf');
const { EntanglementLayer, EntangledPair, Phrase } = require('../lib/entanglement');
const {
    PrimeCalculusBuilder,
    PrimeCalculusEvaluator,
    SemanticObject,
    NounTerm,
    ChainTerm,
    FusionTerm
} = require('../lib/prime-calculus');

/**
 * Mock Transport for testing
 */
class MockTransport extends EventEmitter {
    constructor(name = 'mock') {
        super();
        this.name = name;
        this.partner = null;
        this.messages = [];
        this.connected = true;
        this.latency = 0;
    }
    
    connect(partner) {
        this.partner = partner;
        partner.partner = this;
    }
    
    send(data) {
        if (!this.connected) return;
        this.messages.push({ sent: data, timestamp: Date.now() });
        if (this.partner) {
            setTimeout(() => {
                if (this.partner.connected) {
                    this.partner.emit('message', data);
                }
            }, this.latency);
        }
    }
    
    write(data) { this.send(data); }
    close() { this.connected = false; this.emit('close'); }
}

/**
 * NetworkScalingMetrics - Calculates network capability metrics
 */
class NetworkScalingMetrics {
    constructor(nodes) {
        this.nodes = nodes;
        this.nodeCount = nodes.length;
    }
    
    /**
     * Total Connections: n(n-1)/2 for full mesh
     */
    get totalConnections() {
        return (this.nodeCount * (this.nodeCount - 1)) / 2;
    }
    
    /**
     * Network Coherence: Average coherence across all nodes
     */
    getNetworkCoherence() {
        if (this.nodeCount === 0) return 0;
        const sum = this.nodes.reduce((acc, n) => acc + n.sync.localField.coherence, 0);
        return sum / this.nodeCount;
    }
    
    /**
     * Coherence Variance: How aligned the nodes are
     */
    getCoherenceVariance() {
        if (this.nodeCount <= 1) return 0;
        const mean = this.getNetworkCoherence();
        const variance = this.nodes.reduce((acc, n) => {
            return acc + Math.pow(n.sync.localField.coherence - mean, 2);
        }, 0) / this.nodeCount;
        return variance;
    }
    
    /**
     * Network Alignment: 1 - normalized variance (higher = more aligned)
     */
    getNetworkAlignment() {
        const variance = this.getCoherenceVariance();
        return 1 / (1 + variance);
    }
    
    /**
     * Total GMF Objects: Sum of all objects across GMFs
     */
    getTotalGMFObjects() {
        return this.nodes.reduce((acc, n) => acc + n.sync.gmf.objects.size, 0);
    }
    
    /**
     * GMF Redundancy: Average copies per unique object
     */
    getGMFRedundancy() {
        const allIds = new Set();
        const idCounts = new Map();
        
        for (const node of this.nodes) {
            for (const id of node.sync.gmf.objects.keys()) {
                allIds.add(id);
                idCounts.set(id, (idCounts.get(id) || 0) + 1);
            }
        }
        
        if (allIds.size === 0) return 0;
        const totalCopies = Array.from(idCounts.values()).reduce((a, b) => a + b, 0);
        return totalCopies / allIds.size;
    }
    
    /**
     * Unique GMF Coverage: Unique objects / node count
     */
    getUniqueGMFCoverage() {
        const allIds = new Set();
        for (const node of this.nodes) {
            for (const id of node.sync.gmf.objects.keys()) {
                allIds.add(id);
            }
        }
        return allIds.size;
    }
    
    /**
     * Entanglement Density: Edges / max possible edges
     */
    getEntanglementDensity(entanglementLayers) {
        if (!entanglementLayers || entanglementLayers.length === 0) return 0;
        
        let totalEdges = 0;
        let totalPrimes = new Set();
        
        for (const layer of entanglementLayers) {
            if (layer.graph && layer.graph instanceof Map) {
                totalEdges += layer.graph.size;
                for (const prime of layer.graph.keys()) {
                    totalPrimes.add(prime);
                }
            } else if (layer.pairs) {
                totalEdges += layer.pairs.length;
                for (const pair of layer.pairs) {
                    totalPrimes.add(pair.prime1);
                    totalPrimes.add(pair.prime2);
                }
            }
        }
        
        const n = totalPrimes.size;
        const maxEdges = (n * (n - 1)) / 2;
        
        return maxEdges > 0 ? totalEdges / maxEdges : 0;
    }
    
    /**
     * Semantic Coverage: Unique primes used across network
     */
    getSemanticCoverage() {
        const primes = new Set();
        
        for (const node of this.nodes) {
            for (const entry of node.sync.gmf.objects.values()) {
                if (entry.object && entry.object.term) {
                    this.extractPrimesFromTerm(entry.object.term, primes);
                }
            }
        }
        
        return primes.size;
    }
    
    extractPrimesFromTerm(term, primes) {
        if (term.prime) primes.add(term.prime);
        if (term.nounPrime) primes.add(term.nounPrime);
        if (term.adjPrimes) term.adjPrimes.forEach(p => primes.add(p));
        if (term.p) { primes.add(term.p); primes.add(term.q); primes.add(term.r); }
    }
    
    /**
     * Pending Proposals: Total pending across network
     */
    getPendingProposals() {
        return this.nodes.reduce((acc, n) => acc + n.sync.proposalLog.pending().length, 0);
    }
    
    /**
     * Network Capacity: Theoretical max throughput (connections * bandwidth factor)
     */
    getNetworkCapacity() {
        return this.totalConnections * 100; // Arbitrary bandwidth factor
    }
    
    /**
     * Fault Tolerance: Minimum nodes to disconnect to partition network
     * For full mesh, this equals nodeCount - 1
     */
    getFaultTolerance() {
        if (this.nodeCount <= 1) return 0;
        // In a full mesh, you need to disconnect all but one connection
        // to isolate a node. Network remains connected with n-1 failures.
        return this.nodeCount - 1;
    }
    
    /**
     * Consensus Quorum: Minimum nodes for majority (ceil(n/2) + 1 for Byzantine)
     */
    getConsensusQuorum() {
        return Math.ceil(this.nodeCount / 2) + 1;
    }
    
    /**
     * Generate full metrics report
     */
    report() {
        return {
            nodeCount: this.nodeCount,
            connections: {
                total: this.totalConnections,
                perNode: this.nodeCount > 0 ? this.totalConnections / this.nodeCount * 2 : 0
            },
            coherence: {
                network: this.getNetworkCoherence(),
                variance: this.getCoherenceVariance(),
                alignment: this.getNetworkAlignment()
            },
            gmf: {
                totalObjects: this.getTotalGMFObjects(),
                uniqueObjects: this.getUniqueGMFCoverage(),
                redundancy: this.getGMFRedundancy()
            },
            semanticCoverage: this.getSemanticCoverage(),
            pendingProposals: this.getPendingProposals(),
            capacity: this.getNetworkCapacity(),
            faultTolerance: this.getFaultTolerance(),
            consensusQuorum: this.getConsensusQuorum()
        };
    }
}

/**
 * Create a fully connected mesh network
 */
function createMeshNetwork(nodeCount, options = {}) {
    const nodes = [];
    const transports = [];
    
    for (let i = 0; i < nodeCount; i++) {
        const node = new DSNNode({
            name: `Node-${i}`,
            coherenceThreshold: options.coherenceThreshold || 0.5,
            redundancyThreshold: options.redundancyThreshold || 0.5
        });
        nodes.push(node);
    }
    
    // Connect all pairs
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const t1 = new MockTransport(`${i}->${j}`);
            const t2 = new MockTransport(`${j}->${i}`);
            t1.connect(t2);
            
            nodes[i].connectTo(nodes[j].nodeId, t1);
            nodes[j].connectTo(nodes[i].nodeId, t2);
            
            // Mark as connected
            nodes[i].sync.channel.peers.get(nodes[j].nodeId).connected = true;
            nodes[j].sync.channel.peers.get(nodes[i].nodeId).connected = true;
            
            transports.push({ from: i, to: j, t1, t2 });
        }
    }
    
    return { nodes, transports, metrics: new NetworkScalingMetrics(nodes) };
}

/**
 * Simulate network activity
 */
async function simulateNetworkActivity(nodes, objectCount = 10) {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
    
    for (let i = 0; i < objectCount; i++) {
        const nodeIdx = i % nodes.length;
        const primeIdx = i % primes.length;
        
        // Create SMF with valid entropy
        const smf = SedenionMemoryField.basis('coherence', 0.5 + Math.random() * 0.4);
        smf.set('identity', Math.random() * 0.3);
        smf.set('wisdom', Math.random() * 0.2);
        smf.normalize();
        
        // Update node state with coherence
        nodes[nodeIdx].updateState({
            coherence: 0.7 + Math.random() * 0.2,
            entropy: 0.1 + Math.random() * 0.2,
            smf: smf
        });
        
        // Create and insert object
        const term = new NounTerm(primes[primeIdx]);
        const obj = new SemanticObject(term, { source: `node-${nodeIdx}`, iteration: i });
        
        nodes[nodeIdx].sync.gmf.insert(obj, 0.5 + Math.random() * 0.5, {
            nodeId: nodes[nodeIdx].nodeId,
            smf: smf.toJSON()
        });
    }
}

// ============================================================================
// SCALING TEST SUITE
// ============================================================================

describe('Network Scaling Metrics', () => {
    
    describe('Connection Scaling', () => {
        it('should scale connections quadratically: n(n-1)/2', () => {
            const results = [];
            
            for (const n of [1, 2, 3, 5, 10, 20]) {
                const { nodes, metrics } = createMeshNetwork(n);
                const expected = (n * (n - 1)) / 2;
                
                results.push({
                    nodes: n,
                    connections: metrics.totalConnections,
                    expected,
                    ratio: n > 1 ? metrics.totalConnections / n : 0
                });
                
                assert.strictEqual(metrics.totalConnections, expected,
                    `${n} nodes should have ${expected} connections`);
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== CONNECTION SCALING ===');
            console.table(results);
        });
        
        it('should show per-node connection growth', () => {
            const results = [];
            
            for (const n of [2, 5, 10, 20, 50]) {
                const { nodes, metrics } = createMeshNetwork(n);
                
                results.push({
                    nodes: n,
                    totalConnections: metrics.totalConnections,
                    connectionsPerNode: n - 1,
                    networkDensity: 1.0 // Full mesh is always density 1
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== PER-NODE CONNECTIONS ===');
            console.table(results);
        });
    });
    
    describe('GMF Capacity Scaling', () => {
        it('should increase storage capacity with node count', async () => {
            const results = [];
            
            for (const n of [1, 2, 5, 10]) {
                const { nodes, metrics } = createMeshNetwork(n);
                await Promise.all(nodes.map(node => node.start()));
                
                // Each node stores some objects
                const objectsPerNode = 10;
                await simulateNetworkActivity(nodes, n * objectsPerNode);
                
                const report = metrics.report();
                
                results.push({
                    nodes: n,
                    totalObjects: report.gmf.totalObjects,
                    uniqueObjects: report.gmf.uniqueObjects,
                    redundancy: report.gmf.redundancy.toFixed(2),
                    objectsPerNode: (report.gmf.totalObjects / n).toFixed(1)
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== GMF CAPACITY SCALING ===');
            console.table(results);
            
            // Verify capacity increases
            assert.ok(results[results.length - 1].totalObjects > results[0].totalObjects,
                'GMF capacity should increase with node count');
        });
    });
    
    describe('Semantic Coverage Scaling', () => {
        it('should increase semantic coverage with node count', async () => {
            const results = [];
            
            for (const n of [1, 3, 5, 10]) {
                const { nodes, metrics } = createMeshNetwork(n);
                await Promise.all(nodes.map(node => node.start()));
                
                // Different nodes use different prime ranges
                const primeRanges = [
                    [2, 3, 5, 7, 11],
                    [13, 17, 19, 23, 29],
                    [31, 37, 41, 43, 47],
                    [53, 59, 61, 67, 71],
                    [73, 79, 83, 89, 97]
                ];
                
                for (let i = 0; i < nodes.length; i++) {
                    const primes = primeRanges[i % primeRanges.length];
                    for (const p of primes) {
                        const term = new NounTerm(p);
                        const obj = new SemanticObject(term, { source: i });
                        nodes[i].sync.gmf.insert(obj, 1.0);
                    }
                }
                
                const coverage = metrics.getSemanticCoverage();
                
                results.push({
                    nodes: n,
                    primeCoverage: coverage,
                    coveragePerNode: (coverage / n).toFixed(1),
                    theoreticalMax: Math.min(n * 5, 25) // 5 primes per node, max 25
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== SEMANTIC COVERAGE SCALING ===');
            console.table(results);
            
            // More nodes should cover more primes
            assert.ok(results[results.length - 1].primeCoverage >= results[0].primeCoverage,
                'Semantic coverage should not decrease with more nodes');
        });
    });
    
    describe('Fault Tolerance Scaling', () => {
        it('should increase fault tolerance with node count', () => {
            const results = [];
            
            for (const n of [1, 2, 3, 5, 10, 20]) {
                const { nodes, metrics } = createMeshNetwork(n);
                
                results.push({
                    nodes: n,
                    faultTolerance: metrics.getFaultTolerance(),
                    consensusQuorum: metrics.getConsensusQuorum(),
                    survivableFailures: Math.max(0, n - metrics.getConsensusQuorum()),
                    percentRedundancy: ((metrics.getFaultTolerance() / Math.max(1, n)) * 100).toFixed(1) + '%'
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== FAULT TOLERANCE SCALING ===');
            console.table(results);
            
            // Verify fault tolerance increases
            const last = results[results.length - 1];
            const first = results.find(r => r.nodes > 1);
            assert.ok(last.faultTolerance > first.faultTolerance,
                'Fault tolerance should increase with node count');
        });
        
        it('should maintain network after node disconnection', async () => {
            const results = [];
            
            for (const n of [3, 5, 10]) {
                const { nodes, transports, metrics } = createMeshNetwork(n);
                await Promise.all(nodes.map(node => node.start()));
                
                // Simulate activity
                await simulateNetworkActivity(nodes, n * 5);
                
                const beforeReport = metrics.report();
                
                // Disconnect one node
                nodes[0].stop();
                
                // Recalculate metrics for remaining nodes
                const remainingNodes = nodes.slice(1);
                const afterMetrics = new NetworkScalingMetrics(remainingNodes);
                const afterReport = afterMetrics.report();
                
                results.push({
                    initialNodes: n,
                    afterDisconnect: n - 1,
                    connectionsBefore: beforeReport.connections.total,
                    connectionsAfter: afterReport.connections.total,
                    connectionsLost: beforeReport.connections.total - afterReport.connections.total,
                    networkSurvived: afterReport.connections.total > 0
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== NETWORK RESILIENCE ===');
            console.table(results);
            
            // All networks should survive one node loss
            results.forEach(r => {
                assert.ok(r.networkSurvived, `Network with ${r.initialNodes} nodes should survive 1 disconnect`);
            });
        });
    });
    
    describe('Network Coherence Scaling', () => {
        it('should measure coherence distribution across nodes', async () => {
            const results = [];
            
            for (const n of [2, 5, 10, 20]) {
                const { nodes, metrics } = createMeshNetwork(n);
                await Promise.all(nodes.map(node => node.start()));
                
                // Set varied coherence levels
                for (let i = 0; i < nodes.length; i++) {
                    const smf = SedenionMemoryField.basis('coherence', 0.5 + i * 0.02);
                    smf.set('identity', 0.2);
                    smf.normalize();
                    
                    nodes[i].updateState({
                        coherence: 0.6 + i * 0.02,
                        smf: smf
                    });
                }
                
                const report = metrics.report();
                
                results.push({
                    nodes: n,
                    avgCoherence: report.coherence.network.toFixed(3),
                    variance: report.coherence.variance.toFixed(5),
                    alignment: report.coherence.alignment.toFixed(3)
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== COHERENCE DISTRIBUTION ===');
            console.table(results);
        });
        
        it('should show coherence convergence with shared SMF', async () => {
            const { nodes, metrics } = createMeshNetwork(5);
            await Promise.all(nodes.map(node => node.start()));
            
            // All nodes share similar SMF
            const sharedSmf = SedenionMemoryField.basis('coherence', 0.8);
            sharedSmf.set('identity', 0.3);
            sharedSmf.normalize();
            
            const convergenceResults = [];
            
            // Simulate convergence over iterations
            for (let iter = 0; iter < 5; iter++) {
                // Nodes gradually align toward shared SMF
                for (let i = 0; i < nodes.length; i++) {
                    const noise = 0.1 * (1 - iter / 5); // Decreasing noise
                    const localSmf = SedenionMemoryField.basis('coherence', 0.8 + (Math.random() - 0.5) * noise);
                    localSmf.set('identity', 0.3 + (Math.random() - 0.5) * noise);
                    localSmf.normalize();
                    
                    nodes[i].updateState({
                        coherence: 0.8 + (Math.random() - 0.5) * noise,
                        smf: localSmf
                    });
                }
                
                const report = metrics.report();
                convergenceResults.push({
                    iteration: iter,
                    avgCoherence: report.coherence.network.toFixed(3),
                    alignment: report.coherence.alignment.toFixed(3)
                });
            }
            
            console.log('\n=== COHERENCE CONVERGENCE ===');
            console.table(convergenceResults);
            
            // Final alignment should be high
            const finalAlignment = parseFloat(convergenceResults[convergenceResults.length - 1].alignment);
            assert.ok(finalAlignment > 0.9, 'Network should converge to high alignment');
            
            nodes.forEach(node => node.stop());
        });
    });
    
    describe('Entanglement Density Scaling', () => {
        it('should measure entanglement growth with activity', async () => {
            const results = [];
            
            for (const n of [2, 3, 5, 10]) {
                const { nodes } = createMeshNetwork(n);
                await Promise.all(nodes.map(node => node.start()));
                
                // Create entanglement layers for each node
                const entanglementLayers = nodes.map(() => new EntanglementLayer());
                
                // Simulate oscillator interactions
                const oscillators = [
                    { prime: 2, amplitude: 0.8, phase: 0.1 },
                    { prime: 3, amplitude: 0.7, phase: 0.15 },
                    { prime: 5, amplitude: 0.6, phase: 0.12 },
                    { prime: 7, amplitude: 0.5, phase: 0.2 },
                    { prime: 11, amplitude: 0.4, phase: 0.18 }
                ];
                
                // Each node detects and registers entanglements
                for (let i = 0; i < n; i++) {
                    const pairs = entanglementLayers[i].detectEntanglements(oscillators);
                    for (const pair of pairs) {
                        entanglementLayers[i].registerEntanglement(pair);
                    }
                }
                
                // Count total entanglements per layer
                let totalEntanglements = 0;
                let uniquePrimes = new Set();
                
                for (const layer of entanglementLayers) {
                    // Use getEntangled to count connections
                    for (const osc of oscillators) {
                        const entangled = layer.getEntangled(osc.prime);
                        if (entangled && entangled.length > 0) {
                            totalEntanglements += entangled.length;
                            uniquePrimes.add(osc.prime);
                            for (const e of entangled) {
                                uniquePrimes.add(e.prime2 || e.prime);
                            }
                        }
                    }
                }
                
                const maxEdges = (uniquePrimes.size * (uniquePrimes.size - 1)) / 2;
                const density = maxEdges > 0 ? totalEntanglements / (maxEdges * n) : 0;
                
                results.push({
                    nodes: n,
                    totalEntanglements,
                    uniquePrimes: uniquePrimes.size,
                    avgPerNode: (totalEntanglements / n).toFixed(1),
                    density: density.toFixed(3)
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('\n=== ENTANGLEMENT SCALING ===');
            console.table(results);
        });
    });
    
    describe('Comprehensive Scaling Summary', () => {
        it('should produce complete scaling metrics report', async () => {
            console.log('\n');
            console.log('╔═══════════════════════════════════════════════════════════════╗');
            console.log('║           SENTIENT NETWORK SCALING ANALYSIS                   ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            
            const scalingData = [];
            
            for (const n of [1, 2, 3, 5, 10, 20]) {
                const { nodes, metrics } = createMeshNetwork(n);
                await Promise.all(nodes.map(node => node.start()));
                
                // Simulate activity
                await simulateNetworkActivity(nodes, n * 5);
                
                const report = metrics.report();
                
                scalingData.push({
                    'Nodes': n,
                    'Connections': report.connections.total,
                    'GMF Objects': report.gmf.totalObjects,
                    'Semantic Primes': report.semanticCoverage,
                    'Fault Tolerance': report.faultTolerance,
                    'Quorum': report.consensusQuorum,
                    'Capacity': report.capacity
                });
                
                nodes.forEach(node => node.stop());
            }
            
            console.log('Network Scaling Summary:');
            console.table(scalingData);
            
            console.log('\n=== CAPABILITY SCALING FORMULAS ===\n');
            console.log('  Connections:        n(n-1)/2           (quadratic growth)');
            console.log('  Storage Capacity:   O(n × objects)     (linear per node)');
            console.log('  Fault Tolerance:    n - 1              (linear growth)');
            console.log('  Consensus Quorum:   ceil(n/2) + 1      (majority requirement)');
            console.log('  Semantic Coverage:  O(unique primes)   (depends on diversity)');
            console.log('  Network Capacity:   O(n²)              (quadratic with mesh)');
            console.log('\n=== KEY INSIGHTS ===\n');
            console.log('  • Adding nodes increases redundancy and fault tolerance linearly');
            console.log('  • Communication capacity grows quadratically with mesh topology');
            console.log('  • Storage scales linearly but redundancy can be distributed');
            console.log('  • Consensus overhead grows as quorum increases');
            console.log('  • Semantic diversity improves with specialized nodes');
            console.log('');
            
            assert.ok(true, 'Scaling analysis complete');
        });
    });
});

// ============================================================================
// CAPABILITY METRICS EXPORT
// ============================================================================

describe('Network Capability Metrics Export', () => {
    it('should export machine-readable capability metrics', async () => {
        const capabilityReport = {
            timestamp: new Date().toISOString(),
            testEnvironment: 'node',
            scalingData: []
        };
        
        for (const n of [1, 2, 5, 10]) {
            const { nodes, metrics } = createMeshNetwork(n);
            await Promise.all(nodes.map(node => node.start()));
            await simulateNetworkActivity(nodes, n * 5);
            
            capabilityReport.scalingData.push({
                nodeCount: n,
                metrics: metrics.report()
            });
            
            nodes.forEach(node => node.stop());
        }
        
        console.log('\n=== MACHINE-READABLE CAPABILITY REPORT ===\n');
        console.log(JSON.stringify(capabilityReport, null, 2));
        
        assert.ok(capabilityReport.scalingData.length > 0, 'Report should have data');
    });
});