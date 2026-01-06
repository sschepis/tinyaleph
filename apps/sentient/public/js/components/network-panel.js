
/**
 * Network Panel Component
 * 
 * Displays network topology, WebRTC status, room viewer, and memory sync indicators:
 * - WebRTC coordinator status and signaling stats
 * - Room viewer with peer lists
 * - Memory sync indicators showing replication status
 * - Interactive topology graph with node connections
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class NetworkPanel extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            webrtcEnabled: false,
            connected: false,
            nodeId: null,
            uptime: 0,
            rooms: {},
            peers: [],
            seeds: [],
            outbound: [],
            inbound: [],
            stats: {
                websocketConnections: 0,
                signalQueues: 0,
                pollWaiters: 0
            },
            memorySyncStatus: {
                lastSync: null,
                syncedPeers: 0,
                pendingSync: 0,
                conflicts: 0
            },
            selectedRoom: 'global'
        };
        
        // Polling interval
        this.pollInterval = null;
        
        // Topology graph
        this.topologyCanvas = null;
        this.topologyCtx = null;
        this.nodePositions = new Map();
        this.animationFrame = null;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                height: 100%;
                overflow-y: auto;
            }
            
            .network-panel {
                padding: var(--space-sm);
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
            }
            
            .section {
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                overflow: hidden;
            }
            
            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-primary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .section-title {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .section-icon {
                font-size: 0.9rem;
            }
            
            .section-badge {
                font-size: 0.6rem;
                font-family: var(--font-mono);
                padding: 2px 6px;
                background: var(--accent-primary);
                color: white;
                border-radius: var(--radius-sm);
            }
            
            .section-badge.offline {
                background: var(--text-dim);
            }
            
            .section-badge.syncing {
                background: var(--warning);
            }
            
            .section-content {
                padding: var(--space-sm);
            }
            
            /* Status Grid */
            .status-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--space-xs);
            }
            
            .status-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: var(--space-sm);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
            }
            
            .status-value {
                font-size: 1.1rem;
                font-weight: 600;
                font-family: var(--font-mono);
                color: var(--accent-primary);
            }
            
            .status-value.warning {
                color: var(--warning);
            }
            
            .status-value.success {
                color: var(--success);
            }
            
            .status-label {
                font-size: 0.6rem;
                color: var(--text-dim);
                text-transform: uppercase;
                margin-top: 2px;
            }
            
            /* Room Tabs */
            .room-tabs {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-bottom: var(--space-sm);
            }
            
            .room-tab {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                font-size: 0.65rem;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                color: var(--text-dim);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .room-tab:hover {
                color: var(--text-primary);
                background: var(--bg-secondary);
            }
            
            .room-tab.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .room-count {
                font-family: var(--font-mono);
                padding: 1px 4px;
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
            }
            
            .room-tab.active .room-count {
                background: rgba(255,255,255,0.3);
            }
            
            /* Peer List */
            .peer-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
                max-height: 200px;
                overflow-y: auto;
            }
            
            .peer-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
            }
            
            .peer-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--text-dim);
            }
            
            .peer-status.online {
                background: var(--success);
                box-shadow: 0 0 6px var(--success);
            }
            
            .peer-status.connecting {
                background: var(--warning);
            }
            
            .peer-info {
                flex: 1;
                min-width: 0;
            }
            
            .peer-name {
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .peer-meta {
                font-size: 0.6rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .peer-actions {
                display: flex;
                gap: 4px;
            }
            
            .peer-action {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-dim);
                font-size: 0.7rem;
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .peer-action:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            /* Memory Sync */
            .sync-status {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .sync-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
            }
            
            .sync-label {
                font-size: 0.65rem;
                color: var(--text-dim);
            }
            
            .sync-value {
                font-size: 0.7rem;
                font-family: var(--font-mono);
                color: var(--text-primary);
            }
            
            .sync-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .sync-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--success);
            }
            
            .sync-dot.syncing {
                background: var(--warning);
                animation: pulse 1s ease-in-out infinite;
            }
            
            .sync-dot.error {
                background: var(--error);
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .sync-bar {
                width: 100%;
                height: 4px;
                background: var(--bg-primary);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .sync-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary), var(--success));
                transition: width var(--transition-normal);
            }
            
            /* Topology Graph */
            .topology-container {
                position: relative;
                height: 200px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                overflow: hidden;
            }
            
            .topology-canvas {
                width: 100%;
                height: 100%;
            }
            
            .topology-legend {
                position: absolute;
                bottom: var(--space-xs);
                left: var(--space-xs);
                display: flex;
                gap: var(--space-sm);
                font-size: 0.55rem;
                color: var(--text-dim);
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .legend-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }
            
            .legend-dot.self { background: var(--accent-primary); }
            .legend-dot.peer { background: var(--success); }
            .legend-dot.seed { background: var(--warning); }
            
            /* Node Details */
            .node-details {
                margin-top: var(--space-sm);
                padding: var(--space-sm);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
            }
            
            .node-id {
                font-size: 0.6rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
                word-break: break-all;
            }
            
            .connection-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
                margin-top: var(--space-sm);
            }
            
            .connection-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.65rem;
            }
            
            .connection-direction {
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .connection-url {
                flex: 1;
                color: var(--accent-primary);
                text-decoration: none;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .connection-status {
                padding: 1px 6px;
                border-radius: var(--radius-sm);
                font-size: 0.55rem;
                font-weight: 500;
            }
            
            .connection-status.connected {
                background: rgba(34, 197, 94, 0.2);
                color: var(--success);
            }
            
            .connection-status.connecting {
                background: rgba(234, 179, 8, 0.2);
                color: var(--warning);
            }
            
            .connection-status.failed {
                background: rgba(239, 68, 68, 0.2);
                color: var(--error);
            }
            
            /* Empty State */
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--space-lg);
                color: var(--text-dim);
                text-align: center;
            }
            
            .empty-icon {
                font-size: 2rem;
                margin-bottom: var(--space-sm);
                opacity: 0.5;
            }
            
            .empty-text {
                font-size: 0.75rem;
            }
            
            .empty-hint {
                font-size: 0.65rem;
                margin-top: var(--space-xs);
                color: var(--text-dim);
            }
            
            /* Action Buttons */
            .action-row {
                display: flex;
                gap: var(--space-xs);
                margin-top: var(--space-sm);
            }
            
            .action-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.65rem;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .action-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .action-btn.primary {
                background: var(--accent-primary);
                color: white;
            }
            
            .action-btn.primary:hover {
                background: var(--accent-secondary);
            }
        `;
    }
    
    template() {
        const { webrtcEnabled, nodeId, uptime, rooms, stats, selectedRoom, memorySyncStatus, outbound, inbound, seeds } = this._state;
        
        const roomList = Object.entries(rooms);
        const selectedRoomPeers = rooms[selectedRoom] || [];
        const totalPeers = Object.values(rooms).reduce((sum, peers) => sum + peers, 0);
        const syncPercent = memorySyncStatus.syncedPeers > 0 ? 
            Math.round((memorySyncStatus.syncedPeers / (memorySyncStatus.syncedPeers + memorySyncStatus.pendingSync)) * 100) : 0;
        
        return `
            <div class="network-panel">
                <!-- WebRTC Status Section -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon">🌐</span>
                            <span>WebRTC Coordinator</span>
                        </div>
                        <span class="section-badge ${webrtcEnabled ? '' : 'offline'}">${webrtcEnabled ? 'ENABLED' : 'DISABLED'}</span>
                    </div>
                    <div class="section-content">
                        <div class="status-grid">
                            <div class="status-item">
                                <div class="status-value ${stats.websocketConnections > 0 ? 'success' : ''}">${stats.websocketConnections}</div>
                                <div class="status-label">WebSocket</div>
                            </div>
                            <div class="status-item">
                                <div class="status-value">${roomList.length}</div>
                                <div class="status-label">Rooms</div>
                            </div>
                            <div class="status-item">
                                <div class="status-value ${totalPeers > 0 ? 'success' : ''}">${totalPeers}</div>
                                <div class="status-label">Peers</div>
                            </div>
                            <div class="status-item">
                                <div class="status-value ${stats.signalQueues > 5 ? 'warning' : ''}">${stats.signalQueues}</div>
                                <div class="status-label">Signals</div>
                            </div>
                        </div>
                        
                        <div class="node-details">
                            <div class="node-id">Node: ${nodeId || 'Generating...'}</div>
                            <div class="node-id" style="margin-top: 4px;">Uptime: ${this.formatUptime(uptime)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Room Viewer Section -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon">🚪</span>
                            <span>Rooms</span>
                        </div>
                    </div>
                    <div class="section-content">
                        <div class="room-tabs">
                            ${roomList.map(([name, count]) => `
                                <div class="room-tab ${selectedRoom === name ? 'active' : ''}" data-room="${name}">
                                    <span>${name}</span>
                                    <span class="room-count">${typeof count === 'number' ? count : Array.isArray(count) ? count.length : 0}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="peer-list" id="peerList">
                            ${this.renderPeerList(selectedRoomPeers)}
                        </div>
                    </div>
                </div>
                
                <!-- Memory Sync Section -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon">🔄</span>
                            <span>Memory Sync</span>
                        </div>
                        <span class="section-badge ${memorySyncStatus.pendingSync > 0 ? 'syncing' : ''}">${syncPercent}%</span>
                    </div>
                    <div class="section-content">
                        <div class="sync-bar">
                            <div class="sync-bar-fill" style="width: ${syncPercent}%"></div>
                        </div>
                        
                        <div class="sync-status">
                            <div class="sync-row">
                                <span class="sync-label">Last Sync</span>
                                <div class="sync-indicator">
                                    <span class="sync-dot ${memorySyncStatus.pendingSync > 0 ? 'syncing' : ''}"></span>
                                    <span class="sync-value">${memorySyncStatus.lastSync ? this.formatTime(memorySyncStatus.lastSync) : 'Never'}</span>
                                </div>
                            </div>
                            <div class="sync-row">
                                <span class="sync-label">Synced Peers</span>
                                <span class="sync-value">${memorySyncStatus.syncedPeers}</span>
                            </div>
                            <div class="sync-row">
                                <span class="sync-label">Pending</span>
                                <span class="sync-value ${memorySyncStatus.pendingSync > 0 ? 'warning' : ''}">${memorySyncStatus.pendingSync}</span>
                            </div>
                            <div class="sync-row">
                                <span class="sync-label">Conflicts</span>
                                <span class="sync-value ${memorySyncStatus.conflicts > 0 ? 'warning' : ''}">${memorySyncStatus.conflicts}</span>
                            </div>
                        </div>
                        
                        <div class="action-row">
                            <button class="action-btn" id="forceSync">🔄 Force Sync</button>
                            <button class="action-btn" id="resolveConflicts">⚠️ Resolve</button>
                        </div>
                    </div>
                </div>
                
                <!-- Topology Graph Section -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon">🕸️</span>
                            <span>Network Topology</span>
                        </div>
                    </div>
                    <div class="section-content">
                        <div class="topology-container">
                            <canvas class="topology-canvas" id="topologyCanvas"></canvas>
                            <div class="topology-legend">
                                <div class="legend-item">
                                    <span class="legend-dot self"></span>
                                    <span>This Node</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-dot peer"></span>
                                    <span>Peer</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-dot seed"></span>
                                    <span>Seed</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="connection-list">
                            ${seeds.length === 0 && outbound.length === 0 && inbound.length === 0 ? `
                                <div class="empty-state" style="padding: var(--space-sm);">
                                    <span class="empty-text">Running as standalone node</span>
                                    <span class="empty-hint">Connect to seed nodes to join the network</span>
                                </div>
                            ` : ''}
                            
                            ${outbound.map(conn => `
                                <div class="connection-item">
                                    <span class="connection-direction">→</span>
                                    <span class="connection-url">${conn.url}</span>
                                    <span class="connection-status ${conn.status}">${conn.status}</span>
                                </div>
                            `).join('')}
                            
                            ${inbound.map(conn => `
                                <div class="connection-item">
                                    <span class="connection-direction">←</span>
                                    <span class="connection-url">${conn.url || conn.nodeId}</span>
                                    <span class="connection-status ${conn.status}">${conn.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPeerList(peers) {
        if (!peers || peers.length === 0) {
            return `
                <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <span class="empty-text">No peers in this room</span>
                </div>
            `;
        }
        
        // Handle both array of peer objects and just count
        if (typeof peers === 'number') {
            return `
                <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <span class="empty-text">${peers} peer(s) in room</span>
                </div>
            `;
        }
        
        return peers.map(peer => `
            <div class="peer-item">
                <span class="peer-status ${peer.online ? 'online' : peer.status === 'connecting' ? 'connecting' : ''}"></span>
                <div class="peer-info">
                    <div class="peer-name">${peer.name || peer.peerId?.slice(0, 20) || 'Unknown'}</div>
                    <div class="peer-meta">${peer.metadata?.type || 'peer'} · ${this.formatTime(peer.lastSeen || peer.joinedAt)}</div>
                </div>
                <div class="peer-actions">
                    <button class="peer-action" title="Ping" data-action="ping" data-peer="${peer.peerId}">📡</button>
                    <button class="peer-action" title="Info" data-action="info" data-peer="${peer.peerId}">ℹ️</button>
                </div>
            </div>
        `).join('');
    }
    
    formatUptime(seconds) {
        if (!seconds) return '0s';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) return `${hours}h ${mins}m`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    }
    
    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }
    
    onMount() {
        // Get canvas reference
        this.topologyCanvas = this.$('#topologyCanvas');
        if (this.topologyCanvas) {
            this.topologyCtx = this.topologyCanvas.getContext('2d');
            this.resizeCanvas();
        }
        
        // Start polling for network status
        this.startPolling();
        
        // Initial data load
        this.loadNetworkData();
        
        // Start topology animation
        this.startTopologyAnimation();
    }
    
    onUnmount() {
        this.stopPolling();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    setupEventListeners() {
        // Room tab clicks
        this.$$('.room-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const room = tab.dataset.room;
                this._state.selectedRoom = room;
                this.loadRoomPeers(room);
            });
        });
        
        // Force sync button
        const forceSyncBtn = this.$('#forceSync');
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', () => this.forceSync());
        }
        
        // Resolve conflicts button
        const resolveBtn = this.$('#resolveConflicts');
        if (resolveBtn) {
            resolveBtn.addEventListener('click', () => this.resolveConflicts());
        }
        
        // Peer action buttons
        this.$$('.peer-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const peerId = e.target.dataset.peer;
                this.handlePeerAction(action, peerId);
            });
        });
        
        // Resize handler for canvas
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    startPolling() {
        // Poll every 3 seconds
        this.pollInterval = setInterval(() => {
            this.loadNetworkData();
        }, 3000);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    async loadNetworkData() {
        try {
            // Load nodes/network topology
            const nodesRes = await fetch('/nodes');
            if (nodesRes.ok) {
                const nodes = await nodesRes.json();
                this._state.nodeId = nodes.nodeId;
                this._state.uptime = nodes.uptime;
                this._state.seeds = nodes.seeds || [];
                this._state.outbound = nodes.outbound || [];
                this._state.inbound = nodes.inbound || [];
                
                // WebRTC info
                if (nodes.webrtc) {
                    this._state.webrtcEnabled = nodes.webrtc.enabled;
                    this._state.rooms = nodes.webrtc.rooms?.reduce((acc, name) => {
                        acc[name] = 0; // Will be populated by stats
                        return acc;
                    }, {}) || {};
                    
                    if (nodes.webrtc.peerCount !== undefined) {
                        // If we have stats, use them
                    }
                }
            }
            
            // Load WebRTC stats if enabled
            if (this._state.webrtcEnabled) {
                const statsRes = await fetch('/webrtc/stats');
                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    this._state.stats = {
                        websocketConnections: stats.websocketConnections || 0,
                        signalQueues: stats.signalQueues || 0,
                        pollWaiters: stats.pollWaiters || 0
                    };
                    
                    if (stats.rooms?.rooms) {
                        this._state.rooms = stats.rooms.rooms;
                    }
                }
            }
            
            // Load room peers for selected room
            await this.loadRoomPeers(this._state.selectedRoom);
            
            // Simulate memory sync status (would come from a real sync system)
            this.updateMemorySyncStatus();
            
            this.requestUpdate();
        } catch (err) {
            console.warn('Failed to load network data:', err);
        }
    }
    
    async loadRoomPeers(roomName) {
        if (!this._state.webrtcEnabled) return;
        
        try {
            const res = await fetch(`/webrtc/peers?room=${encodeURIComponent(roomName)}`);
            if (res.ok) {
                const data = await res.json();
                // Update the peer list for this room
                const peerList = this.$('#peerList');
                if (peerList) {
                    peerList.innerHTML = this.renderPeerList(data.peers || []);
                }
            }
        } catch (err) {
            console.warn('Failed to load room peers:', err);
        }
    }
    
    updateMemorySyncStatus() {
        // Simulate memory sync status based on peer connections
        const connectedPeers = this._state.outbound.filter(c => c.status === 'connected').length +
                               this._state.inbound.filter(c => c.status === 'connected').length;
        
        this._state.memorySyncStatus = {
            lastSync: connectedPeers > 0 ? Date.now() - Math.random() * 60000 : null,
            syncedPeers: connectedPeers,
            pendingSync: Math.max(0, this._state.seeds.length - connectedPeers),
            conflicts: 0
        };
    }
    
    async forceSync() {
        // Trigger a force sync
        console.log('Force sync triggered');
        
        // Visual feedback
        const btn = this.$('#forceSync');
        if (btn) {
            btn.textContent = '🔄 Syncing...';
            btn.disabled = true;
        }
        
        try {
            // Attempt to sync with all seeds
            for (const seed of this._state.seeds) {
                try {
                    await fetch(`${seed}/memory?count=10`);
                } catch (e) {
                    console.warn('Sync failed for:', seed);
                }
            }
            
            // Refresh data
            await this.loadNetworkData();
        } finally {
            if (btn) {
                btn.textContent = '🔄 Force Sync';
                btn.disabled = false;
            }
        }
    }
    
    resolveConflicts() {
        console.log('Resolving conflicts...');
        this._state.memorySyncStatus.conflicts = 0;
        this.requestUpdate();
    }
    
    handlePeerAction(action, peerId) {
        console.log('Peer action:', action, 'for', peerId);
        
        switch (action) {
            case 'ping':
                this.pingPeer(peerId);
                break;
            case 'info':
                this.showPeerInfo(peerId);
                break;
        }
    }
    
    async pingPeer(peerId) {
        console.log('Pinging peer:', peerId);
        // Would send a ping signal via WebRTC
    }
    
    showPeerInfo(peerId) {
        console.log('Showing info for peer:', peerId);
        // Would show a modal or tooltip with peer details
    }
    
    resizeCanvas() {
        if (!this.topologyCanvas) return;
        
        const container = this.topologyCanvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.topologyCanvas.width = rect.width * dpr;
        this.topologyCanvas.height = rect.height * dpr;
        this.topologyCanvas.style.width = `${rect.width}px`;
        this.topologyCanvas.style.height = `${rect.height}px`;
        
        if (this.topologyCtx) {
            this.topologyCtx.scale(dpr, dpr);
        }
    }
    
    startTopologyAnimation() {
        const animate = () => {
            this.drawTopology();
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        // Start after a short delay to ensure canvas is ready
        setTimeout(animate, 100);
    }
    
    drawTopology() {
        if (!this.topologyCtx || !this.topologyCanvas) return;
        
        const ctx = this.topologyCtx;
        const container = this.topologyCanvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate node positions
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        
        // Build node list
        const nodes = [];
        
        // This node (center)
        nodes.push({
            id: this._state.nodeId || 'this',
            x: centerX,
            y: centerY,
            type: 'self',
            label: 'This Node'
        });
        
        // Outbound connections
        this._state.outbound.forEach((conn, i) => {
            const angle = (Math.PI * 2 * i / Math.max(1, this._state.outbound.length)) - Math.PI / 2;
            nodes.push({
                id: conn.nodeId || conn.url,
                x: centerX + Math.cos(angle) * radius * 0.8,
                y: centerY + Math.sin(angle) * radius * 0.8,
                type: 'seed',
                status: conn.status,
                label: conn.url?.replace(/https?:\/\//, '').slice(0, 20) || 'Seed'
            });
        });
        
        // Inbound connections (if any)
        this._state.inbound.forEach((conn, i) => {
            const angle = (Math.PI * 2 * i / Math.max(1, this._state.inbound.length)) + Math.PI / 4;
            nodes.push({
                id: conn.nodeId || `peer-${i}`,
                x: centerX + Math.cos(angle) * radius * 0.6,
                y: centerY + Math.sin(angle) * radius * 0.6,
                type: 'peer',
                status: conn.status,
                label: conn.nodeId?.slice(0, 12) || 'Peer'
            });
        });
        
        // Draw connections first (behind nodes)
        ctx.lineWidth = 2;
        
        nodes.forEach((node, i) => {
            if (i === 0) return; // Skip self
            
            // Draw connection to center
            const gradient = ctx.createLinearGradient(centerX, centerY, node.x, node.y);
            
            if (node.status === 'connected') {
                gradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
                gradient.addColorStop(1, 'rgba(34, 197, 94, 0.2)');
            } else if (node.status === 'connecting') {
                gradient.addColorStop(0, 'rgba(234, 179, 8, 0.6)');
                gradient.addColorStop(1, 'rgba(234, 179, 8, 0.2)');
            } else {
                gradient.addColorStop(0, 'rgba(115, 115, 115, 0.4)');
                gradient.addColorStop(1, 'rgba(115, 115, 115, 0.1)');
            }
            
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
            
            // Animated pulse for active connections
            if (node.status === 'connected') {
                const time = Date.now() / 1000;
                const pulsePos = (time * 0.5 + i * 0.1) % 1;
                const pulseX = centerX + (node.x - centerX) * pulsePos;
                const pulseY = centerY + (node.y - centerY) * pulsePos;
                
                ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw nodes
        nodes.forEach(node => {
            let color;
            let size;
            
            switch (node.type) {
                case 'self':
                    color = '#3b82f6'; // Blue
                    size = 12;
                    break;
                case 'seed':
                    color = node.status === 'connected' ? '#22c55e' :
                           node.status === 'connecting' ? '#eab308' : '#737373';
                    size = 8;
                    break;
                case 'peer':
                    color = node.status === 'connected' ? '#22c55e' : '#737373';
                    size = 6;
                    break;
                default:
                    color = '#737373';
                    size = 6;
            }
            
            // Node glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            
            // Node circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Node label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '9px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.label, node.x, node.y + size + 12);
        });
        
        // Draw "no connections" message if alone
        if (nodes.length === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '11px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Standalone mode', centerX, centerY + 50);
            ctx.font = '9px system-ui, sans-serif';
            ctx.fillText('Add --seed <url> to connect', centerX, centerY + 65);
        }
    }
    
    requestUpdate() {
        // Re-render the component
        this.render();
        this.setupEventListeners();
        
        // Re-get canvas reference after re-render
        this.topologyCanvas = this.$('#topologyCanvas');
        if (this.topologyCanvas) {
            this.topologyCtx = this.topologyCanvas.getContext('2d');
            this.resizeCanvas();
        }
    }
}

defineComponent('network-panel', NetworkPanel);