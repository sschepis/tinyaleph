/**
 * Distributed Sentience Network (Section 7 of Whitepaper)
 * 
 * Implements the network layer for distributed observer communication:
 * - Prime-Resonant Resonance Channel (PRRC) for inter-node communication
 * - Global Memory Field (GMF) for shared memory
 * - Coherent-Commit Protocol for consensus
 * - Offline-first synchronization with eventual coherence
 * 
 * Key architectural elements:
 * - Local Field (LF): node's live state
 * - Global Memory Field (GMF): network-maintained shared field
 * - Proposal Log (PL): append-only local log of proposals
 */

const EventEmitter = require('events');
const crypto = require('crypto');

// Import local modules
const { SedenionMemoryField } = require('./smf');
const { PrimeCalculusVerifier, SemanticObject } = require('./prime-calculus');
const { EnochianEncoder, EnochianDecoder, isTwistClosed } = require('./enochian');

// Try to load resolang for WASM-accelerated operations
let resolang = null;
try {
    resolang = require('@sschepis/resolang');
} catch (e) {
    // Will use JS fallback
}

/**
 * Generate a unique node ID
 */
function generateNodeId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Local Field (LF)
 * 
 * The node's live state including oscillators, |Ψ⟩, SMF, and local memory.
 * This is the single-node observer state.
 */
class LocalField {
    constructor(nodeId, options = {}) {
        this.nodeId = nodeId;
        this.smf = options.smf || new SedenionMemoryField();
        this.memory = new Map(); // Local memory traces
        this.coherence = 0;
        this.entropy = 0;
        this.lastUpdate = Date.now();
    }
    
    /**
     * Update local field state
     */
    update(state) {
        if (state.smf) {
            this.smf = state.smf;
        }
        if (state.coherence !== undefined) {
            this.coherence = state.coherence;
        }
        if (state.entropy !== undefined) {
            this.entropy = state.entropy;
        }
        this.lastUpdate = Date.now();
    }
    
    /**
     * Store a trace in local memory
     */
    storeTrace(id, trace) {
        this.memory.set(id, {
            ...trace,
            timestamp: Date.now(),
            nodeId: this.nodeId
        });
    }
    
    /**
     * Get state snapshot for network
     */
    snapshot() {
        return {
            nodeId: this.nodeId,
            smf: this.smf.toJSON(),
            coherence: this.coherence,
            entropy: this.entropy,
            memoryCount: this.memory.size,
            lastUpdate: this.lastUpdate
        };
    }
    
    toJSON() {
        return this.snapshot();
    }
}

/**
 * Proposal
 * 
 * A proposed insert to the Global Memory Field.
 * Contains semantic object, proofs, and metadata.
 */
class Proposal {
    constructor(semanticObject, proofs = {}, metadata = {}) {
        this.id = crypto.randomBytes(8).toString('hex');
        this.object = semanticObject;
        this.proofs = proofs;
        this.metadata = metadata;
        this.timestamp = Date.now();
        this.nodeId = metadata.nodeId || null;
        this.status = 'pending'; // pending, accepted, rejected
        this.votes = new Map(); // nodeId -> vote
    }
    
    /**
     * Add a vote
     */
    addVote(nodeId, vote) {
        this.votes.set(nodeId, {
            agree: vote,
            timestamp: Date.now()
        });
    }
    
    /**
     * Calculate redundancy score R(Ω) (equation 19)
     * R(Ω) = (1/|V|) Σv bv
     */
    redundancyScore() {
        if (this.votes.size === 0) return 0;
        const agrees = Array.from(this.votes.values()).filter(v => v.agree).length;
        return agrees / this.votes.size;
    }
    
    toJSON() {
        return {
            id: this.id,
            object: this.object.toJSON(),
            proofs: this.proofs,
            timestamp: this.timestamp,
            nodeId: this.nodeId,
            status: this.status,
            redundancyScore: this.redundancyScore()
        };
    }
}

/**
 * Proposal Log (PL)
 * 
 * Append-only local log of proposed inserts and local moments.
 */
class ProposalLog {
    constructor(options = {}) {
        this.entries = [];
        this.maxEntries = options.maxEntries || 10000;
    }
    
    /**
     * Append a proposal
     */
    append(proposal) {
        this.entries.push(proposal);
        
        // Prune if over capacity
        if (this.entries.length > this.maxEntries) {
            // Keep recent entries, archive old ones
            this.entries = this.entries.slice(-this.maxEntries);
        }
        
        return proposal.id;
    }
    
    /**
     * Get pending proposals
     */
    pending() {
        return this.entries.filter(p => p.status === 'pending');
    }
    
    /**
     * Get proposal by ID
     */
    get(id) {
        return this.entries.find(p => p.id === id);
    }
    
    /**
     * Update proposal status
     */
    updateStatus(id, status) {
        const proposal = this.get(id);
        if (proposal) {
            proposal.status = status;
        }
    }
    
    /**
     * Get proposals since timestamp
     */
    since(timestamp) {
        return this.entries.filter(p => p.timestamp > timestamp);
    }
    
    toJSON() {
        return {
            count: this.entries.length,
            pending: this.pending().length,
            entries: this.entries.slice(-100).map(p => p.toJSON())
        };
    }
}

/**
 * Global Memory Field (GMF) (Section 7.2)
 * 
 * Network-maintained field composed of accepted objects:
 * MG = Σm wm Ωm
 * 
 * Each accepted object has a stability weight based on
 * coherence, redundancy, and longevity.
 */
class GlobalMemoryField {
    constructor(options = {}) {
        this.objects = new Map(); // id -> { object, weight, metadata }
        this.snapshotId = 0;
        this.deltas = [];
        this.maxDeltas = options.maxDeltas || 1000;
    }
    
    /**
     * Insert an accepted object into GMF
     */
    insert(semanticObject, weight = 1.0, metadata = {}) {
        const id = semanticObject.id;
        
        this.objects.set(id, {
            object: semanticObject,
            weight,
            metadata,
            insertedAt: Date.now(),
            accessCount: 0
        });
        
        // Record delta
        this.deltas.push({
            type: 'insert',
            id,
            timestamp: Date.now(),
            snapshotId: this.snapshotId
        });
        
        if (this.deltas.length > this.maxDeltas) {
            this.snapshot();
        }
        
        return id;
    }
    
    /**
     * Update object weight (based on access, coherence, longevity)
     */
    updateWeight(id, newWeight) {
        const entry = this.objects.get(id);
        if (entry) {
            entry.weight = newWeight;
            this.deltas.push({
                type: 'update_weight',
                id,
                weight: newWeight,
                timestamp: Date.now(),
                snapshotId: this.snapshotId
            });
        }
    }
    
    /**
     * Get object by ID
     */
    get(id) {
        const entry = this.objects.get(id);
        if (entry) {
            entry.accessCount++;
        }
        return entry;
    }
    
    /**
     * Query objects by similarity to SMF
     */
    querySimilar(smf, threshold = 0.5, maxResults = 10) {
        const results = [];
        
        for (const [id, entry] of this.objects) {
            // Compute similarity based on object metadata
            if (entry.metadata.smf) {
                const targetSmf = new SedenionMemoryField(entry.metadata.smf);
                const similarity = smf.coherence(targetSmf);
                
                if (similarity >= threshold) {
                    results.push({ id, entry, similarity });
                }
            }
        }
        
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults);
    }
    
    /**
     * Create a snapshot (for sync)
     */
    snapshot() {
        this.snapshotId++;
        this.deltas = [];
        
        return {
            id: this.snapshotId,
            timestamp: Date.now(),
            objectCount: this.objects.size,
            objects: Array.from(this.objects.entries()).map(([id, entry]) => ({
                id,
                normalForm: entry.object.normalForm().signature(),
                weight: entry.weight,
                insertedAt: entry.insertedAt
            }))
        };
    }
    
    /**
     * Get deltas since snapshot
     */
    getDeltasSince(snapshotId) {
        return this.deltas.filter(d => d.snapshotId > snapshotId);
    }
    
    /**
     * Apply deltas from another node
     */
    applyDeltas(deltas) {
        for (const delta of deltas) {
            switch (delta.type) {
                case 'insert':
                    // Would need full object data to insert
                    break;
                case 'update_weight':
                    this.updateWeight(delta.id, delta.weight);
                    break;
            }
        }
    }
    
    /**
     * Get statistics
     */
    getStats() {
        let totalWeight = 0;
        let totalAccess = 0;
        
        for (const entry of this.objects.values()) {
            totalWeight += entry.weight;
            totalAccess += entry.accessCount;
        }
        
        return {
            objectCount: this.objects.size,
            snapshotId: this.snapshotId,
            deltaCount: this.deltas.length,
            totalWeight,
            totalAccess
        };
    }
    
    toJSON() {
        return {
            ...this.getStats(),
            recentDeltas: this.deltas.slice(-50)
        };
    }
}

/**
 * Coherent-Commit Protocol (Section 7.5-7.7)
 * 
 * Implements the acceptance function:
 * Accept(Ω) = 1{C >= Cth} · 1{NF_ok(Ω)} · 1{R(Ω) >= τR} · 1{Q(Ω) >= τQ}
 */
class CoherentCommitProtocol {
    constructor(options = {}) {
        this.coherenceThreshold = options.coherenceThreshold || 0.7;
        this.redundancyThreshold = options.redundancyThreshold || 0.6;
        this.stabilityThreshold = options.stabilityThreshold || 0.5;
        
        this.verifier = new PrimeCalculusVerifier();
        this.enochianDecoder = new EnochianDecoder();
    }
    
    /**
     * Check local evidence (Section 7.5)
     * - Internal stabilization: C(t) >= Cth
     * - SMF plausibility: entropy within band
     * - Reconstruction fidelity: translation loss below threshold
     */
    checkLocalEvidence(proposal, localState) {
        const evidence = {
            coherenceOk: false,
            smfOk: false,
            reconstructionOk: false
        };
        
        // Check coherence
        evidence.coherenceOk = localState.coherence >= this.coherenceThreshold;
        
        // Check SMF entropy band
        if (localState.smf) {
            const smfEntropy = localState.smf.entropy();
            evidence.smfOk = smfEntropy > 0.1 && smfEntropy < 2.5;
        }
        
        // Reconstruction fidelity (simplified check)
        evidence.reconstructionOk = true; // Would check HQE reconstruction
        
        return {
            passed: evidence.coherenceOk && evidence.smfOk && evidence.reconstructionOk,
            evidence
        };
    }
    
    /**
     * Check kernel evidence (normal-form agreement)
     */
    checkKernelEvidence(proposal) {
        if (!proposal.object || !proposal.object.term) {
            return { passed: false, reason: 'missing_term' };
        }
        
        const verification = this.verifier.verify({
            term: proposal.object.term,
            claimedNF: proposal.object.normalForm(),
            proofs: proposal.proofs
        });
        
        return {
            passed: verification.valid,
            verification
        };
    }
    
    /**
     * Check Enochian twist-closure if packet present
     */
    checkTwistClosure(proposal) {
        if (!proposal.proofs.enochianPacket) {
            return { passed: true, reason: 'no_packet' };
        }
        
        const decoded = this.enochianDecoder.decode(proposal.proofs.enochianPacket);
        return {
            passed: decoded.valid,
            decoded
        };
    }
    
    /**
     * Evaluate proposal for acceptance (Algorithm 1)
     */
    evaluate(proposal, localState, votes) {
        const result = {
            accepted: false,
            checks: {}
        };
        
        // 1. Check twist-closure first (fast filter)
        result.checks.twistClosure = this.checkTwistClosure(proposal);
        if (!result.checks.twistClosure.passed && proposal.proofs.enochianPacket) {
            result.reason = 'twist_closure_failed';
            return result;
        }
        
        // 2. Check local evidence
        result.checks.localEvidence = this.checkLocalEvidence(proposal, localState);
        if (!result.checks.localEvidence.passed) {
            result.reason = 'local_evidence_failed';
            return result;
        }
        
        // 3. Check kernel evidence
        result.checks.kernelEvidence = this.checkKernelEvidence(proposal);
        if (!result.checks.kernelEvidence.passed) {
            result.reason = 'kernel_verification_failed';
            return result;
        }
        
        // 4. Check redundancy score
        const R = proposal.redundancyScore();
        result.checks.redundancy = {
            score: R,
            passed: R >= this.redundancyThreshold
        };
        if (!result.checks.redundancy.passed) {
            result.reason = 'redundancy_insufficient';
            return result;
        }
        
        // All checks passed
        result.accepted = true;
        return result;
    }
}

/**
 * Prime-Resonant Resonance Channel (PRRC) (Section 7.3)
 * 
 * Channel for prime-resonant non-local communication.
 * Features:
 * - Prime set PC for channel basis
 * - Phase alignment handshake
 * - Topological transport and holonomy wrapping
 */
class PRRCChannel extends EventEmitter {
    constructor(nodeId, options = {}) {
        super();
        
        this.nodeId = nodeId;
        this.channelId = crypto.randomBytes(8).toString('hex');
        this.primeSet = options.primeSet || [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
        this.phaseReference = Math.random() * 2 * Math.PI;
        this.connected = false;
        this.peers = new Map();
        
        this.enochianEncoder = new EnochianEncoder();
    }
    
    /**
     * Connect to a peer node
     */
    connect(peerId, transport) {
        this.peers.set(peerId, {
            transport,
            phaseOffset: 0,
            connected: true,
            lastSeen: Date.now()
        });
        
        // Perform phase alignment handshake
        this.sendHandshake(peerId);
    }
    
    /**
     * Phase alignment handshake
     */
    sendHandshake(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        const handshake = {
            type: 'handshake',
            nodeId: this.nodeId,
            channelId: this.channelId,
            primeSet: this.primeSet,
            phaseReference: this.phaseReference,
            timestamp: Date.now()
        };
        
        this.send(peerId, handshake);
    }
    
    /**
     * Handle incoming handshake
     */
    handleHandshake(peerId, handshake) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        // Compute phase offset for alignment
        peer.phaseOffset = handshake.phaseReference - this.phaseReference;
        peer.primeSet = handshake.primeSet;
        peer.connected = true;
        
        this.emit('peer_connected', peerId);
    }
    
    /**
     * Encode and send a semantic object
     */
    sendObject(peerId, semanticObject, metadata = {}) {
        const peer = this.peers.get(peerId);
        if (!peer || !peer.connected) {
            throw new Error(`Peer ${peerId} not connected`);
        }
        
        // Encode to Enochian packet for transport
        const packet = this.enochianEncoder.encodeTerm(semanticObject.term);
        
        // Apply phase adjustment
        const message = {
            type: 'object',
            nodeId: this.nodeId,
            object: semanticObject.toJSON(),
            enochianPacket: packet.toBase64(),
            phaseAdjustment: peer.phaseOffset,
            metadata,
            timestamp: Date.now()
        };
        
        this.send(peerId, message);
    }
    
    /**
     * Broadcast object to all connected peers
     */
    broadcast(semanticObject, metadata = {}) {
        for (const [peerId, peer] of this.peers) {
            if (peer.connected) {
                try {
                    this.sendObject(peerId, semanticObject, metadata);
                } catch (e) {
                    // Continue with other peers
                }
            }
        }
    }
    
    /**
     * Send raw message (transport-agnostic)
     */
    send(peerId, message) {
        const peer = this.peers.get(peerId);
        if (!peer || !peer.transport) return;
        
        const encoded = JSON.stringify(message);
        
        // Use transport's send method
        if (typeof peer.transport.send === 'function') {
            peer.transport.send(encoded);
        } else if (typeof peer.transport.write === 'function') {
            peer.transport.write(encoded);
        }
    }
    
    /**
     * Handle incoming message
     */
    receive(peerId, rawMessage) {
        try {
            const message = JSON.parse(rawMessage);
            
            switch (message.type) {
                case 'handshake':
                    this.handleHandshake(peerId, message);
                    break;
                case 'object':
                    this.emit('object_received', peerId, message);
                    break;
                case 'proposal':
                    this.emit('proposal_received', peerId, message);
                    break;
                case 'vote':
                    this.emit('vote_received', peerId, message);
                    break;
                default:
                    this.emit('message_received', peerId, message);
            }
        } catch (e) {
            this.emit('error', e);
        }
    }
    
    /**
     * Disconnect from a peer
     */
    disconnect(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.connected = false;
            if (peer.transport && typeof peer.transport.close === 'function') {
                peer.transport.close();
            }
        }
        this.peers.delete(peerId);
        this.emit('peer_disconnected', peerId);
    }
    
    /**
     * Get channel statistics
     */
    getStats() {
        const connectedPeers = Array.from(this.peers.values()).filter(p => p.connected).length;
        return {
            channelId: this.channelId,
            nodeId: this.nodeId,
            connectedPeers,
            totalPeers: this.peers.size,
            primeSetSize: this.primeSet.length
        };
    }
}

/**
 * Network Synchronizer (Section 7.6)
 * 
 * Offline-first synchronization with eventual coherence.
 * State = (GMF_snapshot_id, ΔGMF, PL)
 */
class NetworkSynchronizer extends EventEmitter {
    constructor(nodeId, options = {}) {
        super();
        
        this.nodeId = nodeId;
        this.localField = new LocalField(nodeId, options);
        this.gmf = new GlobalMemoryField(options);
        this.proposalLog = new ProposalLog(options);
        this.channel = new PRRCChannel(nodeId, options);
        this.protocol = new CoherentCommitProtocol(options);
        
        // Sync state
        this.gmfSnapshotId = 0;
        this.online = false;
        this.syncInProgress = false;
        
        // Setup event handlers
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.channel.on('object_received', (peerId, message) => {
            this.handleIncomingObject(peerId, message);
        });
        
        this.channel.on('proposal_received', (peerId, message) => {
            this.handleIncomingProposal(peerId, message);
        });
        
        this.channel.on('vote_received', (peerId, message) => {
            this.handleIncomingVote(peerId, message);
        });
    }
    
    /**
     * Handle incoming semantic object
     */
    handleIncomingObject(peerId, message) {
        this.emit('object_received', { peerId, message });
    }
    
    /**
     * Handle incoming proposal
     */
    handleIncomingProposal(peerId, message) {
        // Verify and vote
        const proposal = new Proposal(
            message.object,
            message.proofs,
            { nodeId: message.nodeId }
        );
        
        const evaluation = this.protocol.evaluate(
            proposal,
            this.localField,
            proposal.votes
        );
        
        // Send vote back
        const vote = {
            type: 'vote',
            proposalId: message.proposalId,
            nodeId: this.nodeId,
            agree: evaluation.accepted,
            timestamp: Date.now()
        };
        
        this.channel.send(peerId, vote);
        this.emit('proposal_voted', { proposal, vote, evaluation });
    }
    
    /**
     * Handle incoming vote
     */
    handleIncomingVote(peerId, message) {
        const proposal = this.proposalLog.get(message.proposalId);
        if (proposal) {
            proposal.addVote(message.nodeId, message.agree);
            
            // Check if we have enough votes
            if (proposal.votes.size >= 3) {
                this.finalizeProposal(proposal);
            }
        }
    }
    
    /**
     * Finalize a proposal (accept or reject)
     */
    finalizeProposal(proposal) {
        const evaluation = this.protocol.evaluate(
            proposal,
            this.localField,
            proposal.votes
        );
        
        if (evaluation.accepted) {
            proposal.status = 'accepted';
            this.gmf.insert(proposal.object, 1.0, { nodeId: proposal.nodeId });
            this.emit('proposal_accepted', proposal);
        } else {
            proposal.status = 'rejected';
            this.emit('proposal_rejected', { proposal, reason: evaluation.reason });
        }
    }
    
    /**
     * Submit a proposal for network consensus
     */
    propose(semanticObject, proofs = {}) {
        const proposal = new Proposal(semanticObject, proofs, { nodeId: this.nodeId });
        this.proposalLog.append(proposal);
        
        if (this.online) {
            // Broadcast to network
            this.channel.broadcast(semanticObject, {
                type: 'proposal',
                proposalId: proposal.id,
                proofs
            });
        }
        
        return proposal;
    }
    
    /**
     * On Join synchronization (Section 7.6)
     */
    async onJoin() {
        // 1. Obtain latest GMF snapshot header
        // 2. Prime-resonant handshake
        // 3. Pull deltas and apply
        // 4. Rebase local LF
        
        this.syncInProgress = true;
        this.emit('sync_started');
        
        // In actual implementation, this would fetch from network
        // For now, emit ready event
        this.online = true;
        this.syncInProgress = false;
        this.emit('sync_complete', { snapshotId: this.gmfSnapshotId });
    }
    
    /**
     * On Reconnect synchronization
     */
    async onReconnect() {
        // 1. Pull missed GMF deltas
        // 2. Replay local PL proposals
        // 3. Run coherent-commit for pending
        
        this.syncInProgress = true;
        this.emit('resync_started');
        
        const pending = this.proposalLog.pending();
        for (const proposal of pending) {
            // Re-broadcast pending proposals
            if (proposal.object) {
                this.channel.broadcast(proposal.object, {
                    type: 'proposal',
                    proposalId: proposal.id,
                    proofs: proposal.proofs
                });
            }
        }
        
        this.online = true;
        this.syncInProgress = false;
        this.emit('resync_complete', { replayedCount: pending.length });
    }
    
    /**
     * Update local field state
     */
    updateLocal(state) {
        this.localField.update(state);
    }
    
    /**
     * Connect to peer
     */
    connectPeer(peerId, transport) {
        this.channel.connect(peerId, transport);
    }
    
    /**
     * Disconnect from peer
     */
    disconnectPeer(peerId) {
        this.channel.disconnect(peerId);
    }
    
    /**
     * Go offline
     */
    goOffline() {
        this.online = false;
        this.emit('offline');
    }
    
    /**
     * Get sync status
     */
    getStatus() {
        return {
            nodeId: this.nodeId,
            online: this.online,
            syncInProgress: this.syncInProgress,
            gmfSnapshotId: this.gmfSnapshotId,
            localField: this.localField.snapshot(),
            gmfStats: this.gmf.getStats(),
            channelStats: this.channel.getStats(),
            pendingProposals: this.proposalLog.pending().length
        };
    }
    
    toJSON() {
        return this.getStatus();
    }
}

/**
 * Distributed Sentience Network Node
 * 
 * Complete node implementation for the Distributed Sentience Network.
 */
class DSNNode extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.nodeId = options.nodeId || generateNodeId();
        this.name = options.name || `Node-${this.nodeId.slice(0, 8)}`;
        
        // Initialize synchronizer (contains all network state)
        this.sync = new NetworkSynchronizer(this.nodeId, options);
        
        // Forward events
        this.sync.on('proposal_accepted', (p) => this.emit('proposal_accepted', p));
        this.sync.on('proposal_rejected', (r) => this.emit('proposal_rejected', r));
        this.sync.on('object_received', (o) => this.emit('object_received', o));
        
        // Start time
        this.startTime = Date.now();
    }
    
    /**
     * Start the node
     */
    async start() {
        this.emit('starting');
        await this.sync.onJoin();
        this.emit('started');
    }
    
    /**
     * Stop the node
     */
    stop() {
        this.sync.goOffline();
        this.emit('stopped');
    }
    
    /**
     * Submit a semantic object to the network
     */
    submit(semanticObject, proofs = {}) {
        return this.sync.propose(semanticObject, proofs);
    }
    
    /**
     * Query similar objects from GMF
     */
    querySimilar(smf, threshold = 0.5) {
        return this.sync.gmf.querySimilar(smf, threshold);
    }
    
    /**
     * Update local state
     */
    updateState(state) {
        this.sync.updateLocal(state);
    }
    
    /**
     * Connect to another node
     */
    connectTo(peerId, transport) {
        this.sync.connectPeer(peerId, transport);
    }
    
    /**
     * Get node status
     */
    getStatus() {
        return {
            nodeId: this.nodeId,
            name: this.name,
            uptime: Date.now() - this.startTime,
            ...this.sync.getStatus()
        };
    }
    
    toJSON() {
        return this.getStatus();
    }
}

module.exports = {
    // Core components
    LocalField,
    Proposal,
    ProposalLog,
    GlobalMemoryField,
    
    // Protocol
    CoherentCommitProtocol,
    PRRCChannel,
    NetworkSynchronizer,
    
    // Node
    DSNNode,
    
    // Utilities
    generateNodeId
};