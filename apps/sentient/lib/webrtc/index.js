/**
 * WebRTC Module for Sentient Observer
 * 
 * Provides WebRTC coordination for peer-to-peer communication between nodes.
 * - Coordinator: Server-side signaling coordination
 * - Peer: Client-side WebRTC peer connections
 * - Transport: PRRCChannel-compatible transport layer
 */

import { WebRTCCoordinator } from './coordinator.js';
import { WebRTCPeer } from './peer.js';
import { RoomManager } from './room.js';
import { WebRTCTransport } from './transport.js';

export {
    WebRTCCoordinator,
    WebRTCPeer,
    RoomManager,
    WebRTCTransport
};
