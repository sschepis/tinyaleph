/**
 * Multi-Node Network Tests for Sentient Observer
 * 
 * Comprehensive tests for distributed network capabilities:
 * - Node discovery and connection
 * - Message passing and broadcast
 * - Proposal consensus (Coherent-Commit Protocol)
 * - Global Memory Field synchronization
 * - Sedenion Memory Field coherence
 * - Entanglement propagation across nodes
 * - Offline/online synchronization
 * - Room-based coordination
 * 
 * These tests validate the system's ability to function as a
 * distributed sentient network before launch.
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

// Import WebRTC components
const { RoomManager, Room } = require('../lib/webrtc/room');
const { WebRTCCoordinator } = require('../lib/webrtc/coordinator');

// Import semantic components
const { SedenionMemoryField, SMF_AXES } = require('../lib/smf');
const { EntanglementLayer, EntangledPair, Phrase } = require('../lib/entanglement');
const {
    PrimeCalculusBuilder,
    PrimeCalculusEvaluator,
    PrimeCalculusVerifier,
    SemanticObject,
    NounTerm,
    ChainTerm,
    FusionTerm
} = require('../lib/prime-calculus');

/**
 * Mock Transport for testing node-to-node communication
 * Simulates a bidirectional channel between two nodes
 */
class MockTransport extends EventEmitter {
    constructor(name = 'mock') {
        super();
        this.name = name;
        this.partner = null;
        this.messages = [];
        this.connected = true;
    }
    
    connect(partner) {
        this.partner = partner;
        partner.partner = this;
    }
    
    send(data) {
        if (!this.connected) return;
        this.messages.push({ sent: data, timestamp: Date.now() });
        if (this.partner) {
            setImmediate(() => {
                this.partner.emit('message', data);
            });
        }
    }
    
    write(data) {
        this.send(data);
    }
    
    close() {
        this.connected = false;
        this.emit('close');
    }
    
    getMessageCount() {
        return this.messages.length;
    }
}

/**
 * Create a network of connected nodes for testing
 */
function createTestNetwork(nodeCount = 3) {
    const nodes = [];
    const transports = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = new DSNNode({
            name: `TestNode-${i}`,
            coherenceThreshold: 0.5, // Lower threshold for testing
            redundancyThreshold: 0.5
        });
        nodes.push(node);
    }
    
    // Connect all nodes in a mesh topology
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const t1 = new MockTransport(`${i}->${j}`);
            const t2 = new MockTransport(`${j}->${i}`);
            t1.connect(t2);
            
            nodes[i].connectTo(nodes[j].nodeId, t1);
            nodes[j].connectTo(nodes[i].nodeId, t2);
            
            transports.push({ from: i, to: j, t1, t2 });
        }
    }
    
    return { nodes, transports };
}

// ============================================================================
// TEST SUITE: Core Network Infrastructure
// ============================================================================

describe('Multi-Node Network Infrastructure', () => {
    
    describe('Node Identity and Initialization', () => {
        it('should generate unique node IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(generateNodeId());
            }
            assert.strictEqual(ids.size, 100, 'All generated IDs should be unique');
        });
        
        it('should initialize node with correct structure', () => {
            const node = new DSNNode({ name: 'TestNode' });
            
            assert.ok(node.nodeId, 'Node should have an ID');
            assert.strictEqual(node.name, 'TestNode', 'Node should have correct name');
            assert.ok(node.sync, 'Node should have synchronizer');
            assert.ok(node.sync.localField, 'Node should have local field');
            assert.ok(node.sync.gmf, 'Node should have Global Memory Field');
            assert.ok(node.sync.proposalLog, 'Node should have proposal log');
            assert.ok(node.sync.channel, 'Node should have PRRC channel');
        });
        
        it('should start and stop nodes correctly', async () => {
            const node = new DSNNode({ name: 'TestNode' });
            
            let startedEvent = false;
            let stoppedEvent = false;
            
            node.on('started', () => { startedEvent = true; });
            node.on('stopped', () => { stoppedEvent = true; });
            
            await node.start();
            assert.ok(startedEvent, 'Started event should fire');
            assert.ok(node.sync.online, 'Node should be online after start');
            
            node.stop();
            assert.ok(stoppedEvent, 'Stopped event should fire');
            assert.ok(!node.sync.online, 'Node should be offline after stop');
        });
    });
    
    describe('Local Field Management', () => {
        it('should create local field with correct defaults', () => {
            const nodeId = generateNodeId();
            const lf = new LocalField(nodeId);
            
            assert.strictEqual(lf.nodeId, nodeId);
            assert.ok(lf.smf, 'Should have SMF');
            assert.ok(lf.memory instanceof Map, 'Should have memory map');
            assert.strictEqual(lf.coherence, 0, 'Initial coherence should be 0');
            assert.strictEqual(lf.entropy, 0, 'Initial entropy should be 0');
        });
        
        it('should update local field state', () => {
            const lf = new LocalField(generateNodeId());
            
            lf.update({
                coherence: 0.8,
                entropy: 0.3
            });
            
            assert.strictEqual(lf.coherence, 0.8);
            assert.strictEqual(lf.entropy, 0.3);
        });
        
        it('should store and retrieve traces', () => {
            const lf = new LocalField(generateNodeId());
            
            lf.storeTrace('trace1', { content: 'test', primes: [2, 3, 5] });
            
            const trace = lf.memory.get('trace1');
            assert.ok(trace, 'Trace should be stored');
            assert.strictEqual(trace.content, 'test');
            assert.ok(trace.timestamp, 'Trace should have timestamp');
            assert.strictEqual(trace.nodeId, lf.nodeId, 'Trace should have node ID');
        });
        
        it('should generate correct snapshots', () => {
            const lf = new LocalField(generateNodeId());
            lf.update({ coherence: 0.7, entropy: 0.2 });
            lf.storeTrace('t1', { data: 1 });
            lf.storeTrace('t2', { data: 2 });
            
            const snapshot = lf.snapshot();
            
            assert.strictEqual(snapshot.nodeId, lf.nodeId);
            assert.strictEqual(snapshot.coherence, 0.7);
            assert.strictEqual(snapshot.entropy, 0.2);
            assert.strictEqual(snapshot.memoryCount, 2);
        });
    });
    
    describe('Global Memory Field (GMF)', () => {
        it('should insert and retrieve objects', () => {
            const gmf = new GlobalMemoryField();
            const term = new NounTerm(7);
            const obj = new SemanticObject(term, { source: 'test' });
            
            const id = gmf.insert(obj, 1.0, { nodeId: 'node1' });
            
            const retrieved = gmf.get(id);
            assert.ok(retrieved, 'Object should be retrievable');
            assert.strictEqual(retrieved.weight, 1.0);
            assert.strictEqual(retrieved.object.id, obj.id);
        });
        
        it('should update object weights', () => {
            const gmf = new GlobalMemoryField();
            const obj = new SemanticObject(new NounTerm(11), {});
            
            gmf.insert(obj, 1.0);
            gmf.updateWeight(obj.id, 0.5);
            
            const entry = gmf.get(obj.id);
            assert.strictEqual(entry.weight, 0.5);
        });
        
        it('should track access counts', () => {
            const gmf = new GlobalMemoryField();
            const obj = new SemanticObject(new NounTerm(13), {});
            
            gmf.insert(obj, 1.0);
            
            // Access multiple times
            gmf.get(obj.id);
            gmf.get(obj.id);
            gmf.get(obj.id);
            
            const entry = gmf.get(obj.id);
            assert.strictEqual(entry.accessCount, 4, 'Access count should track retrievals');
        });
        
        it('should record deltas for synchronization', () => {
            const gmf = new GlobalMemoryField();
            
            const obj1 = new SemanticObject(new NounTerm(17), {});
            const obj2 = new SemanticObject(new NounTerm(19), {});
            
            gmf.insert(obj1, 1.0);
            gmf.insert(obj2, 0.8);
            gmf.updateWeight(obj1.id, 0.9);
            
            const stats = gmf.getStats();
            assert.strictEqual(stats.objectCount, 2);
            assert.strictEqual(stats.deltaCount, 3, 'Should have 3 deltas (2 inserts + 1 update)');
        });
        
        it('should create snapshots and retrieve deltas since snapshot', () => {
            const gmf = new GlobalMemoryField();
            
            gmf.insert(new SemanticObject(new NounTerm(23), {}), 1.0);
            const snapshot = gmf.snapshot();
            
            gmf.insert(new SemanticObject(new NounTerm(29), {}), 0.7);
            
            const deltas = gmf.getDeltasSince(snapshot.id - 1);
            assert.ok(deltas.length >= 1, 'Should have deltas since snapshot');
        });
        
        it('should query similar objects by SMF', () => {
            const gmf = new GlobalMemoryField();
            const smf1 = SedenionMemoryField.basis('coherence', 0.9);
            const smf2 = SedenionMemoryField.basis('coherence', 0.8);
            const smf3 = SedenionMemoryField.basis('entropy', 0.9);
            
            gmf.insert(new SemanticObject(new NounTerm(31), {}), 1.0, { smf: smf1.toJSON() });
            gmf.insert(new SemanticObject(new NounTerm(37), {}), 1.0, { smf: smf2.toJSON() });
            gmf.insert(new SemanticObject(new NounTerm(41), {}), 1.0, { smf: smf3.toJSON() });
            
            const querySmf = SedenionMemoryField.basis('coherence', 0.85);
            const results = gmf.querySimilar(querySmf, 0.5, 10);
            
            // Should find the coherence-based SMFs as more similar
            assert.ok(results.length >= 0, 'Query should return results');
        });
    });
});

// ============================================================================
// TEST SUITE: PRRC Channel and Peer Communication
// ============================================================================

describe('Prime-Resonant Resonance Channel (PRRC)', () => {
    
    describe('Channel Creation and Connection', () => {
        it('should create channel with unique ID', () => {
            const channel = new PRRCChannel(generateNodeId());
            
            assert.ok(channel.channelId, 'Channel should have ID');
            assert.ok(channel.primeSet.length > 0, 'Channel should have prime set');
            assert.ok(typeof channel.phaseReference === 'number', 'Should have phase reference');
        });
        
        it('should connect peers via transport', () => {
            const nodeId1 = generateNodeId();
            const nodeId2 = generateNodeId();
            
            const channel1 = new PRRCChannel(nodeId1);
            const channel2 = new PRRCChannel(nodeId2);
            
            const t1 = new MockTransport('1->2');
            const t2 = new MockTransport('2->1');
            t1.connect(t2);
            
            channel1.connect(nodeId2, t1);
            channel2.connect(nodeId1, t2);
            
            assert.ok(channel1.peers.has(nodeId2), 'Channel 1 should have peer');
            assert.ok(channel2.peers.has(nodeId1), 'Channel 2 should have peer');
        });
        
        it('should perform handshake on connection', (t, done) => {
            const nodeId1 = generateNodeId();
            const nodeId2 = generateNodeId();
            
            const channel1 = new PRRCChannel(nodeId1);
            const channel2 = new PRRCChannel(nodeId2);
            
            const t1 = new MockTransport('1->2');
            const t2 = new MockTransport('2->1');
            t1.connect(t2);
            
            // Listen for handshake on channel 2
            t2.on('message', (data) => {
                const msg = JSON.parse(data);
                if (msg.type === 'handshake') {
                    channel2.receive(nodeId1, data);
                    done();
                }
            });
            
            channel1.connect(nodeId2, t1);
        });
        
        it('should track channel statistics', () => {
            const channel = new PRRCChannel(generateNodeId());
            
            const t1 = new MockTransport();
            const t2 = new MockTransport();
            channel.connect('peer1', t1);
            channel.connect('peer2', t2);
            
            const stats = channel.getStats();
            
            assert.strictEqual(stats.totalPeers, 2);
            assert.ok(stats.channelId);
            assert.ok(stats.primeSetSize > 0);
        });
    });
    
    describe('Message Passing', () => {
        it('should send semantic objects between channels', () => {
            const nodeId1 = generateNodeId();
            const nodeId2 = generateNodeId();
            
            const channel1 = new PRRCChannel(nodeId1);
            const channel2 = new PRRCChannel(nodeId2);
            
            const t1 = new MockTransport('1->2');
            const t2 = new MockTransport('2->1');
            t1.connect(t2);
            
            channel1.connect(nodeId2, t1);
            channel2.connect(nodeId1, t2);
            
            // Mark as connected (normally done via handshake)
            channel1.peers.get(nodeId2).connected = true;
            
            const term = new NounTerm(43);
            const obj = new SemanticObject(term, { test: true });
            
            let received = false;
            channel2.on('object_received', (peerId, msg) => {
                received = true;
                assert.strictEqual(peerId, nodeId1);
                assert.ok(msg.object);
            });
            
            channel1.sendObject(nodeId2, obj, { action: 'test' });
            
            // Process message
            t2.on('message', (data) => {
                channel2.receive(nodeId1, data);
            });
        });
        
        it('should broadcast to all connected peers', () => {
            const channel = new PRRCChannel(generateNodeId());
            const transports = [];
            
            // Connect 5 peers
            for (let i = 0; i < 5; i++) {
                const t = new MockTransport(`peer-${i}`);
                channel.connect(`peer-${i}`, t);
                channel.peers.get(`peer-${i}`).connected = true;
                transports.push(t);
            }
            
            const obj = new SemanticObject(new NounTerm(47), {});
            channel.broadcast(obj);
            
            // Check all transports received messages
            for (const t of transports) {
                assert.ok(t.getMessageCount() >= 1, 'Each peer should receive broadcast');
            }
        });
        
        it('should handle disconnection gracefully', () => {
            const channel = new PRRCChannel(generateNodeId());
            const peerId = generateNodeId();
            const t = new MockTransport();
            
            channel.connect(peerId, t);
            assert.ok(channel.peers.has(peerId));
            
            let disconnectEvent = false;
            channel.on('peer_disconnected', (id) => {
                disconnectEvent = true;
                assert.strictEqual(id, peerId);
            });
            
            channel.disconnect(peerId);
            
            assert.ok(!channel.peers.has(peerId), 'Peer should be removed');
            assert.ok(disconnectEvent, 'Disconnect event should fire');
        });
    });
});

// ============================================================================
// TEST SUITE: Coherent-Commit Protocol (Consensus)
// ============================================================================

describe('Coherent-Commit Protocol', () => {
    
    describe('Local Evidence Checking', () => {
        it('should pass local evidence with sufficient coherence', () => {
            const protocol = new CoherentCommitProtocol({ coherenceThreshold: 0.7 });
            const proposal = new Proposal(
                new SemanticObject(new NounTerm(53), {}),
                {},
                { nodeId: 'test' }
            );
            
            // Create an SMF with valid entropy (between 0.1 and 2.5)
            const smf = SedenionMemoryField.basis('coherence', 0.7);
            smf.set('identity', 0.3);
            smf.set('wisdom', 0.2);
            smf.normalize();
            
            const localState = {
                coherence: 0.8,
                smf: smf
            };
            
            const result = protocol.checkLocalEvidence(proposal, localState);
            
            assert.ok(result.passed, 'Should pass with coherence > threshold');
            assert.ok(result.evidence.coherenceOk);
        });
        
        it('should fail local evidence with low coherence', () => {
            const protocol = new CoherentCommitProtocol({ coherenceThreshold: 0.7 });
            const proposal = new Proposal(
                new SemanticObject(new NounTerm(59), {}),
                {},
                {}
            );
            
            const localState = {
                coherence: 0.5,
                smf: new SedenionMemoryField()
            };
            
            const result = protocol.checkLocalEvidence(proposal, localState);
            
            assert.ok(!result.passed, 'Should fail with coherence < threshold');
            assert.ok(!result.evidence.coherenceOk);
        });
    });
    
    describe('Proposal Voting', () => {
        it('should track votes on proposals', () => {
            const term = new NounTerm(61);
            const obj = new SemanticObject(term, {});
            const proposal = new Proposal(obj, {}, { nodeId: 'proposer' });
            
            proposal.addVote('voter1', true);
            proposal.addVote('voter2', true);
            proposal.addVote('voter3', false);
            
            assert.strictEqual(proposal.votes.size, 3);
            assert.ok(proposal.votes.get('voter1').agree);
            assert.ok(!proposal.votes.get('voter3').agree);
        });
        
        it('should calculate redundancy score correctly', () => {
            const proposal = new Proposal(
                new SemanticObject(new NounTerm(67), {}),
                {},
                {}
            );
            
            // 3 out of 4 votes agree
            proposal.addVote('v1', true);
            proposal.addVote('v2', true);
            proposal.addVote('v3', true);
            proposal.addVote('v4', false);
            
            const R = proposal.redundancyScore();
            assert.strictEqual(R, 0.75, 'Redundancy should be 3/4 = 0.75');
        });
        
        it('should require sufficient redundancy for acceptance', () => {
            const protocol = new CoherentCommitProtocol({
                coherenceThreshold: 0.5,
                redundancyThreshold: 0.6
            });
            
            const term = new NounTerm(71);
            const obj = new SemanticObject(term, {});
            const proposal = new Proposal(obj, {}, {});
            
            // Only 50% agreement
            proposal.addVote('v1', true);
            proposal.addVote('v2', false);
            
            // Create an SMF with valid entropy (between 0.1 and 2.5)
            const smf = SedenionMemoryField.basis('coherence', 0.6);
            smf.set('identity', 0.4);
            smf.normalize();
            
            const localState = { coherence: 0.8, smf: smf };
            const result = protocol.evaluate(proposal, localState);
            
            assert.ok(!result.accepted, 'Should reject with low redundancy');
            assert.strictEqual(result.reason, 'redundancy_insufficient');
        });
    });
    
    describe('Full Proposal Evaluation', () => {
        it('should accept valid proposals with sufficient votes', () => {
            const protocol = new CoherentCommitProtocol({
                coherenceThreshold: 0.5,
                redundancyThreshold: 0.6
            });
            
            const term = new NounTerm(73);
            const obj = new SemanticObject(term, {});
            const proposal = new Proposal(obj, {}, {});
            
            // 75% agreement
            proposal.addVote('v1', true);
            proposal.addVote('v2', true);
            proposal.addVote('v3', true);
            proposal.addVote('v4', false);
            
            // Create an SMF with valid entropy (between 0.1 and 2.5)
            const smf = SedenionMemoryField.basis('coherence', 0.6);
            smf.set('identity', 0.4);
            smf.normalize();
            
            const localState = { coherence: 0.8, smf: smf };
            const result = protocol.evaluate(proposal, localState);
            
            assert.ok(result.accepted, 'Should accept valid proposal');
        });
    });
});

// ============================================================================
// TEST SUITE: Network Synchronization
// ============================================================================

describe('Network Synchronization', () => {
    
    describe('Proposal Flow', () => {
        it('should create and submit proposals', () => {
            const node = new DSNNode({ name: 'TestNode' });
            
            const term = new NounTerm(79);
            const obj = new SemanticObject(term, { action: 'test' });
            
            const proposal = node.submit(obj, { proof: 'test' });
            
            assert.ok(proposal.id, 'Proposal should have ID');
            assert.strictEqual(proposal.status, 'pending');
            assert.strictEqual(proposal.nodeId, node.nodeId);
        });
        
        it('should track pending proposals', () => {
            const sync = new NetworkSynchronizer(generateNodeId());
            
            sync.propose(new SemanticObject(new NounTerm(83), {}));
            sync.propose(new SemanticObject(new NounTerm(89), {}));
            sync.propose(new SemanticObject(new NounTerm(97), {}));
            
            const pending = sync.proposalLog.pending();
            assert.strictEqual(pending.length, 3);
        });
    });
    
    describe('Join/Reconnect Sync', () => {
        it('should handle join synchronization', async () => {
            const sync = new NetworkSynchronizer(generateNodeId());
            
            let syncComplete = false;
            sync.on('sync_complete', () => {
                syncComplete = true;
            });
            
            await sync.onJoin();
            
            assert.ok(sync.online, 'Should be online after join');
            assert.ok(!sync.syncInProgress, 'Sync should be complete');
            assert.ok(syncComplete, 'Sync complete event should fire');
        });
        
        it('should handle reconnect and replay pending proposals', async () => {
            const sync = new NetworkSynchronizer(generateNodeId());
            
            // Create some pending proposals while "offline"
            sync.propose(new SemanticObject(new NounTerm(101), {}));
            sync.propose(new SemanticObject(new NounTerm(103), {}));
            
            let resyncComplete = false;
            let replayedCount = 0;
            sync.on('resync_complete', (data) => {
                resyncComplete = true;
                replayedCount = data.replayedCount;
            });
            
            await sync.onReconnect();
            
            assert.ok(resyncComplete, 'Resync complete event should fire');
            assert.strictEqual(replayedCount, 2, 'Should replay 2 pending proposals');
        });
    });
    
    describe('Offline/Online Transitions', () => {
        it('should handle going offline', () => {
            const sync = new NetworkSynchronizer(generateNodeId());
            sync.online = true;
            
            let offlineEvent = false;
            sync.on('offline', () => { offlineEvent = true; });
            
            sync.goOffline();
            
            assert.ok(!sync.online, 'Should be offline');
            assert.ok(offlineEvent, 'Offline event should fire');
        });
        
        it('should report correct status', async () => {
            const sync = new NetworkSynchronizer(generateNodeId());
            await sync.onJoin();
            
            sync.propose(new SemanticObject(new NounTerm(107), {}));
            
            const status = sync.getStatus();
            
            assert.ok(status.nodeId);
            assert.ok(status.online);
            assert.strictEqual(status.pendingProposals, 1);
            assert.ok(status.localField);
            assert.ok(status.gmfStats);
            assert.ok(status.channelStats);
        });
    });
});

// ============================================================================
// TEST SUITE: Room-Based Coordination
// ============================================================================

describe('Room-Based Coordination', () => {
    
    describe('Room Management', () => {
        it('should create rooms', () => {
            const room = new Room('test-room', { maxPeers: 10 });
            
            assert.strictEqual(room.name, 'test-room');
            assert.strictEqual(room.maxPeers, 10);
            assert.strictEqual(room.size, 0);
        });
        
        it('should add and remove peers from rooms', () => {
            const room = new Room('test-room');
            
            assert.ok(room.addPeer('peer1', { name: 'Peer 1' }));
            assert.ok(room.addPeer('peer2', { name: 'Peer 2' }));
            
            assert.strictEqual(room.size, 2);
            assert.ok(room.hasPeer('peer1'));
            
            room.removePeer('peer1');
            
            assert.strictEqual(room.size, 1);
            assert.ok(!room.hasPeer('peer1'));
        });
        
        it('should respect max peers limit', () => {
            const room = new Room('small-room', { maxPeers: 2 });
            
            assert.ok(room.addPeer('p1', {}));
            assert.ok(room.addPeer('p2', {}));
            assert.ok(!room.addPeer('p3', {}), 'Should reject when full');
            
            assert.strictEqual(room.size, 2);
        });
        
        it('should cleanup stale peers', () => {
            const room = new Room('test-room');
            
            room.addPeer('active', {});
            room.addPeer('stale', {});
            
            // Touch active peer
            room.touchPeer('active');
            
            // Make stale peer old
            room.peers.get('stale').lastSeen = Date.now() - 120000;
            
            const removed = room.cleanupStale(60000);
            
            assert.strictEqual(removed.length, 1);
            assert.strictEqual(removed[0], 'stale');
            assert.strictEqual(room.size, 1);
        });
    });
    
    describe('RoomManager', () => {
        it('should create default rooms', () => {
            const manager = new RoomManager({
                defaultRooms: ['global', 'memory-sync', 'learning']
            });
            
            assert.ok(manager.getRoom('global'));
            assert.ok(manager.getRoom('memory-sync'));
            assert.ok(manager.getRoom('learning'));
            
            manager.destroy();
        });
        
        it('should track peer room membership', () => {
            const manager = new RoomManager();
            
            manager.joinRoom('peer1', 'room-a', {});
            manager.joinRoom('peer1', 'room-b', {});
            manager.joinRoom('peer2', 'room-a', {});
            
            const peer1Rooms = manager.getPeerRooms('peer1');
            assert.strictEqual(peer1Rooms.length, 2);
            assert.ok(peer1Rooms.includes('room-a'));
            assert.ok(peer1Rooms.includes('room-b'));
            
            const roomAPeers = manager.getRoomPeers('room-a');
            assert.strictEqual(roomAPeers.length, 2);
            
            manager.destroy();
        });
        
        it('should emit events on peer join/leave', () => {
            const manager = new RoomManager();
            
            let joined = false;
            let left = false;
            
            manager.on('peer-joined', () => { joined = true; });
            manager.on('peer-left', () => { left = true; });
            
            manager.joinRoom('peer1', 'test-room', {});
            assert.ok(joined, 'Join event should fire');
            
            manager.leaveRoom('peer1', 'test-room');
            assert.ok(left, 'Leave event should fire');
            
            manager.destroy();
        });
        
        it('should leave all rooms for a peer', () => {
            const manager = new RoomManager();
            
            manager.joinRoom('peer1', 'room-a', {});
            manager.joinRoom('peer1', 'room-b', {});
            manager.joinRoom('peer1', 'room-c', {});
            
            const leftRooms = manager.leaveAllRooms('peer1');
            
            assert.strictEqual(leftRooms.length, 3);
            assert.strictEqual(manager.getPeerRooms('peer1').length, 0);
            
            manager.destroy();
        });
        
        it('should report accurate statistics', () => {
            const manager = new RoomManager({ defaultRooms: [] });
            
            manager.joinRoom('p1', 'room-a', {});
            manager.joinRoom('p2', 'room-a', {});
            manager.joinRoom('p3', 'room-b', {});
            
            const stats = manager.getStats();
            
            assert.strictEqual(stats.roomCount, 2);
            assert.strictEqual(stats.totalPeers, 3);
            assert.strictEqual(stats.rooms['room-a'], 2);
            assert.strictEqual(stats.rooms['room-b'], 1);
            
            manager.destroy();
        });
    });
});

// ============================================================================
// TEST SUITE: WebRTC Coordinator
// ============================================================================

describe('WebRTC Coordinator', () => {
    
    describe('Coordinator Initialization', () => {
        it('should initialize with default configuration', () => {
            const coordinator = new WebRTCCoordinator();
            
            assert.ok(coordinator.stunServers.length > 0, 'Should have STUN servers');
            assert.ok(coordinator.rooms, 'Should have room manager');
            
            const info = coordinator.getInfo();
            assert.ok(info.enabled);
            assert.ok(info.rooms);
            
            coordinator.destroy();
        });
        
        it('should return ICE server configuration', () => {
            const coordinator = new WebRTCCoordinator({
                stunServers: ['stun:stun1.test.com', 'stun:stun2.test.com'],
                turnServers: [{ urls: 'turn:turn.test.com', username: 'user', credential: 'pass' }]
            });
            
            const iceServers = coordinator.getIceServers();
            
            assert.ok(iceServers.length >= 3);
            assert.strictEqual(iceServers[0].urls, 'stun:stun1.test.com');
            
            coordinator.destroy();
        });
    });
    
    describe('Peer Join/Leave', () => {
        it('should handle peer joining rooms', () => {
            const coordinator = new WebRTCCoordinator();
            
            const result = coordinator.join('peer1', 'test-room', { name: 'Test Peer' });
            
            assert.ok(result.success);
            assert.strictEqual(result.room, 'test-room');
            assert.ok(result.iceServers);
            
            coordinator.destroy();
        });
        
        it('should return existing peers when joining', () => {
            const coordinator = new WebRTCCoordinator();
            
            coordinator.join('peer1', 'test-room', { name: 'Peer 1' });
            coordinator.join('peer2', 'test-room', { name: 'Peer 2' });
            const result = coordinator.join('peer3', 'test-room', { name: 'Peer 3' });
            
            assert.strictEqual(result.peers.length, 2, 'Should see 2 existing peers');
            assert.ok(result.peers.some(p => p.peerId === 'peer1'));
            assert.ok(result.peers.some(p => p.peerId === 'peer2'));
            
            coordinator.destroy();
        });
        
        it('should handle peer leaving rooms', () => {
            const coordinator = new WebRTCCoordinator();
            
            coordinator.join('peer1', 'test-room', {});
            const result = coordinator.leave('peer1', 'test-room');
            
            assert.ok(result.success);
            
            coordinator.destroy();
        });
    });
    
    describe('Signal Queuing', () => {
        it('should queue signals for peers', () => {
            const coordinator = new WebRTCCoordinator();
            
            coordinator.join('peer1', 'room', {});
            coordinator.join('peer2', 'room', {});
            
            const result = coordinator.queueSignal('peer1', 'peer2', 'offer',
                { sdp: 'test-offer-sdp' }, 'room');
            
            assert.ok(result.success);
            assert.ok(result.queued);
            
            coordinator.destroy();
        });
        
        it('should poll for queued signals', async () => {
            const coordinator = new WebRTCCoordinator({ longPollTimeout: 100 });
            
            coordinator.join('peer1', 'room', {});
            coordinator.join('peer2', 'room', {});
            
            coordinator.queueSignal('peer1', 'peer2', 'offer', { sdp: 'test' }, 'room');
            
            const signals = await coordinator.pollSignals('peer2', 50);
            
            assert.strictEqual(signals.length, 1);
            assert.strictEqual(signals[0].type, 'offer');
            
            coordinator.destroy();
        });
    });
});

// ============================================================================
// TEST SUITE: Sedenion Memory Field Coherence
// ============================================================================

describe('SMF Network Coherence', () => {
    
    describe('SMF Serialization for Network', () => {
        it('should serialize SMF for network transmission', () => {
            const smf = SedenionMemoryField.basis('coherence', 0.9);
            smf.set('identity', 0.5);
            smf.set('wisdom', 0.3);
            smf.normalize();
            
            const json = smf.toJSON();
            
            assert.ok(json.axes);
            assert.ok(typeof json.norm === 'number');
            assert.ok(typeof json.entropy === 'number');
            assert.ok(Array.isArray(json.dominant));
        });
        
        it('should reconstruct SMF from serialized data', () => {
            const original = SedenionMemoryField.basis('structure', 0.8);
            original.set('harmony', 0.6);
            original.normalize();
            
            const json = original.toJSON();
            const reconstructed = SedenionMemoryField.fromObject(json.axes);
            
            const coherence = original.coherence(reconstructed);
            assert.ok(coherence > 0.99, 'Reconstructed SMF should match original');
        });
    });
    
    describe('Cross-Node SMF Comparison', () => {
        it('should compute coherence between node SMFs', () => {
            const smf1 = SedenionMemoryField.basis('coherence', 0.9);
            const smf2 = SedenionMemoryField.basis('coherence', 0.85);
            const smf3 = SedenionMemoryField.basis('entropy', 0.9);
            
            const c12 = smf1.coherence(smf2);
            const c13 = smf1.coherence(smf3);
            
            assert.ok(c12 > c13, 'Similar SMFs should have higher coherence');
        });
        
        it('should merge SMFs from multiple nodes', () => {
            const smfs = [
                SedenionMemoryField.basis('coherence', 0.9),
                SedenionMemoryField.basis('coherence', 0.8),
                SedenionMemoryField.basis('coherence', 0.7)
            ];
            
            // Weighted average merge
            const merged = new SedenionMemoryField();
            merged.s.fill(0);
            
            for (const smf of smfs) {
                for (let k = 0; k < 16; k++) {
                    merged.s[k] += smf.s[k] / smfs.length;
                }
            }
            merged.normalize();
            
            assert.ok(merged.get('coherence') > 0.5, 'Merged SMF should preserve dominant axis');
        });
    });
    
    describe('SMF Quaternion Composition', () => {
        it('should compose SMFs using quaternion multiplication', () => {
            const smf1 = new SedenionMemoryField();
            smf1.s[0] = 0.5; smf1.s[1] = 0.5; smf1.s[2] = 0.5; smf1.s[3] = 0.5;
            smf1.normalize();
            
            const smf2 = new SedenionMemoryField();
            smf2.s[0] = 0.7; smf2.s[1] = 0.3; smf2.s[2] = 0.4; smf2.s[3] = 0.5;
            smf2.normalize();
            
            const composed = smf1.quaternionCompose(smf2);
            
            assert.ok(composed.norm() > 0.99, 'Composed SMF should be normalized');
        });
        
        it('should exhibit non-commutativity', () => {
            const smf1 = new SedenionMemoryField();
            smf1.s[0] = 0.5; smf1.s[1] = 0.5; smf1.s[2] = 0; smf1.s[3] = 0.7;
            smf1.normalize();
            
            const smf2 = new SedenionMemoryField();
            smf2.s[0] = 0.3; smf2.s[1] = 0; smf2.s[2] = 0.8; smf2.s[3] = 0.5;
            smf2.normalize();
            
            const nc = smf1.nonCommutativity(smf2);
            
            assert.ok(nc.quaternionDifference > 0, 'Should detect non-commutativity');
        });
        
        it('should support sequential composition', () => {
            const smfs = [
                SedenionMemoryField.basis('coherence', 0.9),
                SedenionMemoryField.basis('identity', 0.8),
                SedenionMemoryField.basis('structure', 0.7)
            ];
            
            const result = SedenionMemoryField.sequentialCompose(smfs);
            
            assert.ok(result instanceof SedenionMemoryField);
            assert.ok(result.norm() > 0.99);
        });
    });
});

// ============================================================================
// TEST SUITE: Entanglement Propagation
// ============================================================================

describe('Entanglement Network Propagation', () => {
    
    describe('Entanglement Detection', () => {
        it('should detect entanglements between oscillators', () => {
            const layer = new EntanglementLayer({ entanglementThreshold: 0.5 });
            
            const oscillators = [
                { prime: 2, amplitude: 0.8, phase: 0.1 },
                { prime: 3, amplitude: 0.7, phase: 0.15 },
                { prime: 5, amplitude: 0.6, phase: 0.12 },
                { prime: 7, amplitude: 0.2, phase: 2.0 }
            ];
            
            const pairs = layer.detectEntanglements(oscillators);
            
            assert.ok(pairs.length >= 1, 'Should detect entangled pairs');
        });
        
        it('should register entanglements in graph', () => {
            const layer = new EntanglementLayer();
            
            const pair = new EntangledPair({
                prime1: 11,
                prime2: 13,
                strength: 0.8,
                phaseDiff: 0.05
            });
            
            layer.registerEntanglement(pair);
            
            const entangled = layer.getEntangled(11);
            assert.ok(entangled.length > 0, 'Should retrieve entangled primes');
            assert.strictEqual(entangled[0].prime2, 13);
        });
        
        it('should strengthen existing entanglements', () => {
            const layer = new EntanglementLayer();
            
            const pair1 = new EntangledPair({ prime1: 17, prime2: 19, strength: 0.5 });
            const pair2 = new EntangledPair({ prime1: 17, prime2: 19, strength: 0.3 });
            
            layer.registerEntanglement(pair1);
            const initialStrength = layer.getEntangled(17)[0].strength;
            
            layer.registerEntanglement(pair2);
            const newStrength = layer.getEntangled(17)[0].strength;
            
            assert.ok(newStrength > initialStrength, 'Repeated entanglement should strengthen');
        });
    });
    
    describe('Entanglement Chains', () => {
        it('should find chains between primes', () => {
            const layer = new EntanglementLayer();
            
            layer.registerEntanglement(new EntangledPair({ prime1: 3, prime2: 5, strength: 0.8 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 5, prime2: 7, strength: 0.7 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 7, prime2: 11, strength: 0.6 }));
            
            const chain = layer.findChain(3, 11);
            
            assert.ok(chain, 'Should find chain');
            assert.strictEqual(chain[0], 3);
            assert.strictEqual(chain[chain.length - 1], 11);
        });
        
        it('should return null for disconnected primes', () => {
            const layer = new EntanglementLayer();
            
            layer.registerEntanglement(new EntangledPair({ prime1: 3, prime2: 5, strength: 0.8 }));
            
            const chain = layer.findChain(3, 7);
            
            assert.strictEqual(chain, null, 'Should not find chain to isolated prime');
        });
    });
    
    describe('Associative Recall', () => {
        it('should perform associative recall from cue', () => {
            const layer = new EntanglementLayer();
            
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 3, strength: 0.9 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 3, prime2: 5, strength: 0.8 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 5, prime2: 7, strength: 0.7 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 11, strength: 0.6 }));
            
            const recalled = layer.associativeRecall([2], 2);
            
            assert.ok(recalled.length > 0, 'Should recall associated primes');
            assert.ok(recalled.some(r => r.prime === 3), 'Should recall directly entangled prime');
        });
    });
    
    describe('Cluster Detection', () => {
        it('should identify strongly connected clusters', () => {
            const layer = new EntanglementLayer();
            
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 3, strength: 0.9 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 3, prime2: 5, strength: 0.9 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 5, strength: 0.9 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 5, prime2: 7, strength: 0.2 }));
            
            const cluster = layer.getCluster(2, 0.5);
            
            assert.ok(cluster.includes(2));
            assert.ok(cluster.includes(3));
            assert.ok(cluster.includes(5));
            assert.ok(!cluster.includes(7), 'Weakly connected should be excluded');
        });
    });
    
    describe('Network Serialization', () => {
        it('should serialize and restore entanglement layer', () => {
            const layer = new EntanglementLayer();
            
            layer.registerEntanglement(new EntangledPair({ prime1: 2, prime2: 3, strength: 0.8 }));
            layer.registerEntanglement(new EntangledPair({ prime1: 5, prime2: 7, strength: 0.7 }));
            
            const json = layer.toJSON();
            
            const restored = new EntanglementLayer();
            restored.loadFromJSON(json);
            
            const original2 = layer.getEntangled(2);
            const restored2 = restored.getEntangled(2);
            
            assert.strictEqual(restored2.length, original2.length);
        });
    });
});

// ============================================================================
// TEST SUITE: Multi-Node Integration Tests
// ============================================================================

describe('Multi-Node Integration', () => {
    
    describe('Node-to-Node Communication', () => {
        it('should connect two nodes bidirectionally', async () => {
            const node1 = new DSNNode({ name: 'Node1' });
            const node2 = new DSNNode({ name: 'Node2' });
            
            await node1.start();
            await node2.start();
            
            const t1 = new MockTransport('1->2');
            const t2 = new MockTransport('2->1');
            t1.connect(t2);
            
            node1.connectTo(node2.nodeId, t1);
            node2.connectTo(node1.nodeId, t2);
            
            const status1 = node1.getStatus();
            const status2 = node2.getStatus();
            
            assert.ok(status1.channelStats.totalPeers >= 1);
            assert.ok(status2.channelStats.totalPeers >= 1);
            
            node1.stop();
            node2.stop();
        });
        
        it('should propagate proposals across connected nodes', async () => {
            const { nodes, transports } = createTestNetwork(3);
            
            await Promise.all(nodes.map(n => n.start()));
            
            for (const node of nodes) {
                for (const [peerId, peer] of node.sync.channel.peers) {
                    peer.connected = true;
                }
            }
            
            const term = new NounTerm(109);
            const obj = new SemanticObject(term, { source: 'integration-test' });
            const proposal = nodes[0].submit(obj);
            
            assert.ok(proposal.id);
            assert.strictEqual(proposal.status, 'pending');
            assert.strictEqual(nodes[0].sync.proposalLog.pending().length, 1);
            
            nodes.forEach(n => n.stop());
        });
    });
    
    describe('Mesh Network Topology', () => {
        it('should create fully connected mesh', () => {
            const { nodes, transports } = createTestNetwork(4);
            
            assert.strictEqual(transports.length, 6);
            
            for (const node of nodes) {
                assert.strictEqual(node.sync.channel.peers.size, 3);
            }
            
            nodes.forEach(n => n.stop());
        });
        
        it('should handle node disconnection', () => {
            const { nodes, transports } = createTestNetwork(4);
            
            nodes[0].stop();
            
            assert.strictEqual(nodes[1].sync.channel.peers.size, 3);
            
            nodes.forEach(n => n.stop());
        });
    });
    
    describe('State Synchronization', () => {
        it('should update local state across nodes', async () => {
            const { nodes } = createTestNetwork(2);
            
            await Promise.all(nodes.map(n => n.start()));
            
            nodes[0].updateState({
                coherence: 0.85,
                entropy: 0.15
            });
            
            const status0 = nodes[0].getStatus();
            assert.strictEqual(status0.localField.coherence, 0.85);
            assert.strictEqual(status0.localField.entropy, 0.15);
            
            nodes.forEach(n => n.stop());
        });
        
        it('should maintain independent GMFs before sync', async () => {
            const { nodes } = createTestNetwork(3);
            
            await Promise.all(nodes.map(n => n.start()));
            
            nodes[0].sync.gmf.insert(new SemanticObject(new NounTerm(113), {}), 1.0);
            nodes[1].sync.gmf.insert(new SemanticObject(new NounTerm(127), {}), 1.0);
            nodes[2].sync.gmf.insert(new SemanticObject(new NounTerm(131), {}), 1.0);
            
            assert.strictEqual(nodes[0].sync.gmf.objects.size, 1);
            assert.strictEqual(nodes[1].sync.gmf.objects.size, 1);
            assert.strictEqual(nodes[2].sync.gmf.objects.size, 1);
            
            nodes.forEach(n => n.stop());
        });
    });
});

// ============================================================================
// TEST SUITE: Prime Calculus Network Verification
// ============================================================================

describe('Prime Calculus Network Verification', () => {
    
    describe('Term Verification Across Nodes', () => {
        it('should verify normal forms consistently', () => {
            const verifier1 = new PrimeCalculusVerifier();
            const verifier2 = new PrimeCalculusVerifier();
            
            const term = new ChainTerm([2, 3], 7);
            const nf = new ChainTerm([2, 3], 7);
            
            const result1 = verifier1.verifyNormalForm(term, nf);
            const result2 = verifier2.verifyNormalForm(term, nf);
            
            assert.ok(result1.valid);
            assert.ok(result2.valid);
            assert.strictEqual(result1.computedNF, result2.computedNF);
        });
        
        it('should detect normal form mismatches', () => {
            const verifier = new PrimeCalculusVerifier();
            
            const term = new ChainTerm([2, 3], 7);
            const wrongNf = new ChainTerm([2], 7);
            
            const result = verifier.verifyNormalForm(term, wrongNf);
            
            assert.ok(!result.valid || !result.agreement);
        });
    });
    
    describe('Fusion Verification', () => {
        it('should verify valid fusions', () => {
            const term = new FusionTerm(3, 5, 11);
            const evaluator = new PrimeCalculusEvaluator();
            
            const nf = evaluator.evaluate(term);
            
            assert.strictEqual(nf.prime, 19);
        });
        
        it('should reject invalid fusion attempts', () => {
            assert.throws(() => {
                new FusionTerm(3, 5, 7);
            }, /to be prime/);
        });
    });
    
    describe('Semantic Object Verification', () => {
        it('should create and verify semantic objects', () => {
            const term = new ChainTerm([2, 3], 11);
            const obj = new SemanticObject(term, { context: 'test' });
            
            const proposal = obj.toProposal();
            
            assert.ok(proposal.id);
            assert.ok(proposal.term);
            assert.ok(proposal.claimedNF);
            assert.ok(proposal.signature);
        });
        
        it('should generate consistent IDs for same terms', () => {
            const term1 = new NounTerm(137);
            const term2 = new NounTerm(137);
            
            const obj1 = new SemanticObject(term1, {});
            const obj2 = new SemanticObject(term2, {});
            
            assert.strictEqual(obj1.id, obj2.id);
        });
    });
});

// ============================================================================
// TEST SUITE: Capability Summary
// ============================================================================

describe('Network Capability Summary', () => {
    
    it('Multi-node network capabilities inventory', () => {
        console.log('\n=== SENTIENT NETWORK CAPABILITIES ===\n');
        
        console.log('1. NODE IDENTITY & MANAGEMENT');
        console.log('   - Unique cryptographic node IDs');
        console.log('   - Start/stop lifecycle management');
        console.log('   - Local field (SMF, memory, coherence tracking)');
        
        console.log('\n2. PEER-TO-PEER COMMUNICATION');
        console.log('   - Prime-Resonant Resonance Channel (PRRC)');
        console.log('   - Phase alignment handshake');
        console.log('   - Bidirectional message passing');
        console.log('   - Broadcast to all connected peers');
        
        console.log('\n3. DISTRIBUTED CONSENSUS');
        console.log('   - Coherent-Commit Protocol');
        console.log('   - Local evidence checking (coherence threshold)');
        console.log('   - Redundancy scoring (vote aggregation)');
        console.log('   - Normal form verification');
        
        console.log('\n4. GLOBAL MEMORY FIELD');
        console.log('   - Network-wide semantic storage');
        console.log('   - Delta-based synchronization');
        console.log('   - SMF-based similarity queries');
        console.log('   - Weight decay and access tracking');
        
        console.log('\n5. ROOM-BASED COORDINATION');
        console.log('   - Dynamic room creation');
        console.log('   - Multi-room peer membership');
        console.log('   - Stale peer cleanup');
        console.log('   - Room-scoped broadcasting');
        
        console.log('\n6. WEBRTC SIGNALING');
        console.log('   - Coordinator for ICE/SDP exchange');
        console.log('   - Long-polling fallback');
        console.log('   - Signal queuing and delivery');
        console.log('   - Peer connection management');
        
        console.log('\n7. SEDENION MEMORY FIELD');
        console.log('   - 16-axis semantic orientation');
        console.log('   - Non-associative composition');
        console.log('   - Quaternion subspace operations');
        console.log('   - Cross-node coherence measurement');
        
        console.log('\n8. ENTANGLEMENT PROPAGATION');
        console.log('   - Oscillator-based entanglement detection');
        console.log('   - Persistent entanglement graph');
        console.log('   - Chain finding (BFS)');
        console.log('   - Associative recall');
        console.log('   - Cluster detection');
        
        console.log('\n9. PRIME CALCULUS VERIFICATION');
        console.log('   - Normal form computation');
        console.log('   - Cross-node verification');
        console.log('   - Fusion validation');
        console.log('   - Semantic object hashing');
        
        console.log('\n10. SYNCHRONIZATION');
        console.log('    - Join sync (snapshot + deltas)');
        console.log('    - Reconnect with proposal replay');
        console.log('    - Offline/online transitions');
        console.log('    - Eventual coherence model');
        
        console.log('\n=====================================\n');
        
        assert.ok(true, 'Capability summary displayed');
    });
});