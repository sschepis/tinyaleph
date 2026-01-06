/**
 * WebRTC Subsystem Tests
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { WebRTCCoordinator } = require('../apps/sentient/lib/webrtc/coordinator');
const { RoomManager } = require('../apps/sentient/lib/webrtc/room');

describe('WebRTC Subsystem', () => {
    describe('RoomManager', () => {
        let rooms;

        beforeEach(() => {
            rooms = new RoomManager({
                defaultRooms: ['default'],
                defaultMaxPeers: 10
            });
        });

        afterEach(() => {
            rooms.destroy();
        });

        it('should initialize with default rooms', () => {
            assert.ok(rooms.getRoom('default'));
            assert.strictEqual(rooms.getRoomList().length, 1);
            assert.strictEqual(rooms.getRoomList()[0], 'default');
        });

        it('should allow peers to join a room', () => {
            const result = rooms.joinRoom('peer1', 'default', { name: 'Peer 1' });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.room, 'default');
            
            const room = rooms.getRoom('default');
            assert.strictEqual(room.size, 1);
            assert.ok(room.hasPeer('peer1'));
            
            const peer = room.getPeer('peer1');
            assert.strictEqual(peer.metadata.name, 'Peer 1');
        });

        it('should track which rooms a peer is in', () => {
            rooms.joinRoom('peer1', 'default');
            rooms.joinRoom('peer1', 'room2');
            
            const peerRooms = rooms.getPeerRooms('peer1');
            assert.strictEqual(peerRooms.length, 2);
            assert.ok(peerRooms.includes('default'));
            assert.ok(peerRooms.includes('room2'));
        });

        it('should allow peers to leave a room', () => {
            rooms.joinRoom('peer1', 'default');
            const result = rooms.leaveRoom('peer1', 'default');
            
            assert.strictEqual(result, true);
            assert.strictEqual(rooms.getRoom('default').size, 0);
            assert.strictEqual(rooms.getPeerRooms('peer1').length, 0);
        });

        it('should remove peer from all rooms on leaveAllRooms', () => {
            rooms.joinRoom('peer1', 'default');
            rooms.joinRoom('peer1', 'room2');
            
            const left = rooms.leaveAllRooms('peer1');
            assert.strictEqual(left.length, 2);
            assert.strictEqual(rooms.getPeerRooms('peer1').length, 0);
        });

        it('should enforce max peers limit', () => {
            const smallRoomManager = new RoomManager({ defaultMaxPeers: 2 });
            smallRoomManager.joinRoom('p1', 'test');
            smallRoomManager.joinRoom('p2', 'test');
            
            const result = smallRoomManager.joinRoom('p3', 'test');
            assert.strictEqual(result.success, false);
            
            smallRoomManager.destroy();
        });
    });

    describe('WebRTCCoordinator', () => {
        let coordinator;

        beforeEach(() => {
            coordinator = new WebRTCCoordinator({
                stunServers: ['stun:test.com'],
                turnServers: []
            });
        });

        afterEach(() => {
            coordinator.destroy();
        });

        it('should provide correct info', () => {
            const info = coordinator.getInfo('http://localhost:3000');
            assert.strictEqual(info.enabled, true);
            assert.strictEqual(info.coordinatorUrl, 'http://localhost:3000/webrtc');
            assert.deepStrictEqual(info.stunServers, ['stun:test.com']);
        });

        it('should handle peer joining', () => {
            const result = coordinator.join('peer1', 'global', { type: 'test' });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.room, 'global');
            
            const peers = coordinator.getRoomPeers('global');
            assert.strictEqual(peers.length, 1);
            assert.strictEqual(peers[0].peerId, 'peer1');
        });

        it('should queue signals for offline peers', () => {
            // Join two peers
            coordinator.join('peer1', 'global');
            coordinator.join('peer2', 'global');
            
            // Send signal from peer1 to peer2
            const result = coordinator.queueSignal('peer1', 'peer2', 'offer', { sdp: 'test' });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.queued, true);
            
            // Check stats
            const stats = coordinator.getStats();
            assert.strictEqual(stats.signalQueues, 2); // Queues for peer1 and peer2 created
        });

        it('should retrieve signals via polling', async () => {
            coordinator.join('peer2', 'global');
            coordinator.queueSignal('peer1', 'peer2', 'offer', { sdp: 'test' });
            
            const signals = await coordinator.pollSignals('peer2', 100);
            assert.strictEqual(signals.length, 1);
            assert.strictEqual(signals[0].from, 'peer1');
            assert.strictEqual(signals[0].type, 'offer');
        });

        it('should clean up stale signals', async () => {
            // Override TTL for test
            coordinator.signalTTL = 50;
            coordinator.join('peer2', 'global');
            coordinator.queueSignal('peer1', 'peer2', 'offer', { sdp: 'test' });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            coordinator.cleanupStaleSignals();
            const queue = coordinator.signalQueues.get('peer2');
            // Queue should be deleted if empty, BUT join() creates an empty queue that persists
            // cleanupStaleSignals removes empty queues:
            // if (filtered.length === 0) { this.signalQueues.delete(peerId); }
            
            assert.ok(!coordinator.signalQueues.has('peer2'));
        });
    });
});