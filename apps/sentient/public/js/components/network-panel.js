/**
 * Network Panel Component (Simplified)
 * 
 * Streamlined network view with 2 sections:
 * - Status + Rooms: Combined WebRTC status and room viewer
 * - Topology: Collapsible network graph
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
            stats: { websocketConnections: 0, signalQueues: 0, pollWaiters: 0 },
            memorySyncStatus: { lastSync: null, syncedPeers: 0, pendingSync: 0, conflicts: 0 },
            selectedRoom: 'global',
            showTopology: false,
            showSync: false
        };
        
        this.pollInterval = null;
        this.topologyCanvas = null;
        this.topologyCtx = null;
        this.animationFrame = null;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host { display: block; height: 100%; overflow-y: auto; }
            
            .network-panel { padding: var(--space-sm); display: flex; flex-direction: column; gap: var(--space-sm); }
            
            /* Compact header with status */
            .status-header {
                display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm);
                background: var(--bg-secondary); border-radius: var(--radius-sm);
            }
            .status-badge {
                padding: 2px 6px; font-size: 0.55rem; font-weight: 600; border-radius: var(--radius-sm);
                background: var(--success); color: white;
            }
            .status-badge.offline { background: var(--text-dim); }
            .status-stats {
                display: flex; gap: var(--space-sm); margin-left: auto; font-size: 0.55rem; color: var(--text-dim);
            }
            .status-stat { display: flex; align-items: center; gap: 2px; }
            .status-stat .val { color: var(--accent-primary); font-weight: 600; font-family: var(--font-mono); }
            .node-id { font-size: 0.5rem; font-family: var(--font-mono); color: var(--text-dim); margin-top: var(--space-xs); }
            
            /* Room tabs */
            .room-tabs {
                display: flex; flex-wrap: wrap; gap: 4px; padding: var(--space-xs) 0;
            }
            .room-tab {
                display: flex; align-items: center; gap: 4px; padding: 4px 8px;
                font-size: 0.6rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);
                color: var(--text-dim); cursor: pointer; transition: all var(--transition-fast);
            }
            .room-tab:hover { color: var(--text-primary); background: var(--bg-secondary); }
            .room-tab.active { background: var(--accent-primary); color: white; }
            .room-count { font-family: var(--font-mono); padding: 1px 4px; background: rgba(255,255,255,0.2); border-radius: 3px; }
            
            /* Peer list */
            .peer-list { display: flex; flex-direction: column; gap: var(--space-xs); flex: 1; overflow-y: auto; }
            .peer-item {
                display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary); border-radius: var(--radius-sm);
            }
            .peer-status { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); }
            .peer-status.online { background: var(--success); }
            .peer-status.connecting { background: var(--warning); }
            .peer-info { flex: 1; min-width: 0; }
            .peer-name { font-size: 0.65rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .peer-meta { font-size: 0.5rem; color: var(--text-dim); }
            
            /* Collapsible sections */
            .collapsible-header {
                display: flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary); border-radius: var(--radius-sm); cursor: pointer;
                font-size: 0.6rem; color: var(--text-dim); margin-top: var(--space-sm);
            }
            .collapsible-header:hover { color: var(--text-secondary); }
            .collapsible-header .arrow { transition: transform var(--transition-fast); }
            .collapsible-header.expanded .arrow { transform: rotate(90deg); }
            .collapsible-content { display: none; padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); margin-top: var(--space-xs); }
            .collapsible-content.show { display: block; }
            
            /* Sync status */
            .sync-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-xs) 0; font-size: 0.55rem; }
            .sync-label { color: var(--text-dim); }
            .sync-value { font-family: var(--font-mono); color: var(--text-primary); }
            .sync-bar { width: 100%; height: 3px; background: var(--bg-tertiary); border-radius: 2px; margin-bottom: var(--space-xs); }
            .sync-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--success)); }
            
            /* Topology graph */
            .topology-container { position: relative; height: 150px; background: var(--bg-primary); border-radius: var(--radius-sm); overflow: hidden; }
            .topology-canvas { width: 100%; height: 100%; }
            .topology-legend { position: absolute; bottom: var(--space-xs); left: var(--space-xs); display: flex; gap: var(--space-sm); font-size: 0.5rem; color: var(--text-dim); }
            .legend-item { display: flex; align-items: center; gap: 3px; }
            .legend-dot { width: 5px; height: 5px; border-radius: 50%; }
            .legend-dot.self { background: var(--accent-primary); }
            .legend-dot.peer { background: var(--success); }
            .legend-dot.seed { background: var(--warning); }
            
            /* Connection list */
            .connection-list { display: flex; flex-direction: column; gap: 2px; margin-top: var(--space-xs); max-height: 80px; overflow-y: auto; }
            .connection-item { display: flex; align-items: center; gap: var(--space-xs); padding: 2px var(--space-xs); font-size: 0.5rem; background: var(--bg-primary); border-radius: 2px; }
            .connection-direction { color: var(--text-dim); font-family: var(--font-mono); }
            .connection-url { flex: 1; color: var(--accent-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .connection-status { padding: 1px 4px; border-radius: 2px; font-size: 0.45rem; }
            .connection-status.connected { background: rgba(34, 197, 94, 0.2); color: var(--success); }
            .connection-status.connecting { background: rgba(234, 179, 8, 0.2); color: var(--warning); }
            .connection-status.failed { background: rgba(239, 68, 68, 0.2); color: var(--error); }
            
            .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-md); color: var(--text-dim); text-align: center; }
            .empty-icon { font-size: 1.5rem; margin-bottom: var(--space-xs); opacity: 0.5; }
            .empty-text { font-size: 0.6rem; }
        `;
    }
    
    template() {
        const { webrtcEnabled, nodeId, uptime, rooms, stats, selectedRoom, memorySyncStatus, outbound, inbound, seeds, showTopology, showSync } = this._state;
        
        const roomList = Object.entries(rooms);
        const selectedRoomPeers = rooms[selectedRoom] || [];
        const totalPeers = Object.values(rooms).reduce((sum, peers) => sum + (typeof peers === 'number' ? peers : peers.length || 0), 0);
        const syncPercent = memorySyncStatus.syncedPeers > 0 ? Math.round((memorySyncStatus.syncedPeers / (memorySyncStatus.syncedPeers + memorySyncStatus.pendingSync)) * 100) : 0;
        
        return `
            <div class="network-panel">
                <!-- Compact status header -->
                <div class="status-header">
                    <span class="status-badge ${webrtcEnabled ? '' : 'offline'}">${webrtcEnabled ? 'ONLINE' : 'OFFLINE'}</span>
                    <span style="font-size: 0.6rem; color: var(--text-secondary);">WebRTC</span>
                    <div class="status-stats">
                        <span class="status-stat"><span class="val">${stats.websocketConnections}</span> WS</span>
                        <span class="status-stat"><span class="val">${roomList.length}</span> rooms</span>
                        <span class="status-stat"><span class="val">${totalPeers}</span> peers</span>
                    </div>
                </div>
                <div class="node-id">Node: ${nodeId || 'Generating...'} · Uptime: ${this.formatUptime(uptime)}</div>
                
                <!-- Room tabs -->
                ${roomList.length > 0 ? `
                    <div class="room-tabs">
                        ${roomList.map(([name, count]) => `
                            <div class="room-tab ${selectedRoom === name ? 'active' : ''}" data-room="${name}">
                                <span>${name}</span>
                                <span class="room-count">${typeof count === 'number' ? count : Array.isArray(count) ? count.length : 0}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Peer list -->
                <div class="peer-list" id="peerList">
                    ${this.renderPeerList(selectedRoomPeers)}
                </div>
                
                <!-- Collapsible Sync Status -->
                <div class="collapsible-header ${showSync ? 'expanded' : ''}" id="syncToggle">
                    <span class="arrow">▶</span>
                    <span>🔄 Memory Sync</span>
                    <span style="margin-left: auto; font-family: var(--font-mono);">${syncPercent}%</span>
                </div>
                <div class="collapsible-content ${showSync ? 'show' : ''}" id="syncContent">
                    <div class="sync-bar"><div class="sync-bar-fill" style="width: ${syncPercent}%"></div></div>
                    <div class="sync-row"><span class="sync-label">Last Sync</span><span class="sync-value">${memorySyncStatus.lastSync ? this.formatTime(memorySyncStatus.lastSync) : 'Never'}</span></div>
                    <div class="sync-row"><span class="sync-label">Synced</span><span class="sync-value">${memorySyncStatus.syncedPeers} peers</span></div>
                    <div class="sync-row"><span class="sync-label">Pending</span><span class="sync-value">${memorySyncStatus.pendingSync}</span></div>
                </div>
                
                <!-- Collapsible Topology -->
                <div class="collapsible-header ${showTopology ? 'expanded' : ''}" id="topologyToggle">
                    <span class="arrow">▶</span>
                    <span>🕸️ Network Topology</span>
                    <span style="margin-left: auto;">${outbound.length + inbound.length} connections</span>
                </div>
                <div class="collapsible-content ${showTopology ? 'show' : ''}" id="topologyContent">
                    <div class="topology-container">
                        <canvas class="topology-canvas" id="topologyCanvas"></canvas>
                        <div class="topology-legend">
                            <div class="legend-item"><span class="legend-dot self"></span><span>Self</span></div>
                            <div class="legend-item"><span class="legend-dot peer"></span><span>Peer</span></div>
                            <div class="legend-item"><span class="legend-dot seed"></span><span>Seed</span></div>
                        </div>
                    </div>
                    <div class="connection-list">
                        ${outbound.length === 0 && inbound.length === 0 ? '<div class="empty-state" style="padding: var(--space-xs);"><span class="empty-text">Standalone mode</span></div>' : ''}
                        ${outbound.map(conn => `<div class="connection-item"><span class="connection-direction">→</span><span class="connection-url">${conn.url}</span><span class="connection-status ${conn.status}">${conn.status}</span></div>`).join('')}
                        ${inbound.map(conn => `<div class="connection-item"><span class="connection-direction">←</span><span class="connection-url">${conn.url || conn.nodeId}</span><span class="connection-status ${conn.status}">${conn.status}</span></div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPeerList(peers) {
        if (!peers || peers.length === 0) {
            return `<div class="empty-state"><span class="empty-icon">👥</span><span class="empty-text">No peers in room</span></div>`;
        }
        if (typeof peers === 'number') {
            return `<div class="empty-state"><span class="empty-icon">👥</span><span class="empty-text">${peers} peer(s)</span></div>`;
        }
        return peers.map(peer => `
            <div class="peer-item">
                <span class="peer-status ${peer.online ? 'online' : peer.status === 'connecting' ? 'connecting' : ''}"></span>
                <div class="peer-info">
                    <div class="peer-name">${peer.name || peer.peerId?.slice(0, 20) || 'Unknown'}</div>
                    <div class="peer-meta">${peer.metadata?.type || 'peer'} · ${this.formatTime(peer.lastSeen || peer.joinedAt)}</div>
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
        const diff = Date.now() - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }
    
    onMount() {
        this.startPolling();
        this.loadNetworkData();
    }
    
    onUnmount() {
        this.stopPolling();
        if (this.animationFrame) { cancelAnimationFrame(this.animationFrame); this.animationFrame = null; }
    }
    
    setupEventListeners() {
        // Room tabs
        this.$$('.room-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this._state.selectedRoom = tab.dataset.room;
                this.loadRoomPeers(tab.dataset.room);
            });
        });
        
        // Collapsible toggles
        this.$('#syncToggle')?.addEventListener('click', () => {
            this._state.showSync = !this._state.showSync;
            this.requestUpdate();
        });
        
        this.$('#topologyToggle')?.addEventListener('click', () => {
            this._state.showTopology = !this._state.showTopology;
            this.requestUpdate();
            if (this._state.showTopology) {
                setTimeout(() => this.initTopology(), 50);
            }
        });
    }
    
    initTopology() {
        this.topologyCanvas = this.$('#topologyCanvas');
        if (this.topologyCanvas) {
            this.topologyCtx = this.topologyCanvas.getContext('2d');
            this.resizeCanvas();
            this.startTopologyAnimation();
        }
    }
    
    startPolling() {
        this.pollInterval = setInterval(() => this.loadNetworkData(), 3000);
    }
    
    stopPolling() {
        if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
    }
    
    async loadNetworkData() {
        try {
            const nodesRes = await fetch('/nodes');
            if (nodesRes.ok) {
                const nodes = await nodesRes.json();
                this._state.nodeId = nodes.nodeId;
                this._state.uptime = nodes.uptime;
                this._state.seeds = nodes.seeds || [];
                this._state.outbound = nodes.outbound || [];
                this._state.inbound = nodes.inbound || [];
                
                if (nodes.webrtc) {
                    this._state.webrtcEnabled = nodes.webrtc.enabled;
                    this._state.rooms = nodes.webrtc.rooms?.reduce((acc, name) => { acc[name] = 0; return acc; }, {}) || {};
                }
            }
            
            if (this._state.webrtcEnabled) {
                const statsRes = await fetch('/webrtc/stats');
                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    this._state.stats = {
                        websocketConnections: stats.websocketConnections || 0,
                        signalQueues: stats.signalQueues || 0,
                        pollWaiters: stats.pollWaiters || 0
                    };
                    if (stats.rooms?.rooms) this._state.rooms = stats.rooms.rooms;
                }
            }
            
            await this.loadRoomPeers(this._state.selectedRoom);
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
                const peerList = this.$('#peerList');
                if (peerList) peerList.innerHTML = this.renderPeerList(data.peers || []);
            }
        } catch (err) {}
    }
    
    updateMemorySyncStatus() {
        const connectedPeers = this._state.outbound.filter(c => c.status === 'connected').length +
                               this._state.inbound.filter(c => c.status === 'connected').length;
        this._state.memorySyncStatus = {
            lastSync: connectedPeers > 0 ? Date.now() - Math.random() * 60000 : null,
            syncedPeers: connectedPeers,
            pendingSync: Math.max(0, this._state.seeds.length - connectedPeers),
            conflicts: 0
        };
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
        if (this.topologyCtx) this.topologyCtx.scale(dpr, dpr);
    }
    
    startTopologyAnimation() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        const animate = () => {
            if (this._state.showTopology) {
                this.drawTopology();
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    drawTopology() {
        if (!this.topologyCtx || !this.topologyCanvas) return;
        const ctx = this.topologyCtx;
        const container = this.topologyCanvas.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        
        const nodes = [{ id: this._state.nodeId || 'this', x: centerX, y: centerY, type: 'self', label: 'This Node' }];
        
        this._state.outbound.forEach((conn, i) => {
            const angle = (Math.PI * 2 * i / Math.max(1, this._state.outbound.length)) - Math.PI / 2;
            nodes.push({ id: conn.nodeId || conn.url, x: centerX + Math.cos(angle) * radius * 0.8, y: centerY + Math.sin(angle) * radius * 0.8, type: 'seed', status: conn.status, label: conn.url?.replace(/https?:\/\//, '').slice(0, 15) || 'Seed' });
        });
        
        this._state.inbound.forEach((conn, i) => {
            const angle = (Math.PI * 2 * i / Math.max(1, this._state.inbound.length)) + Math.PI / 4;
            nodes.push({ id: conn.nodeId || `peer-${i}`, x: centerX + Math.cos(angle) * radius * 0.6, y: centerY + Math.sin(angle) * radius * 0.6, type: 'peer', status: conn.status, label: conn.nodeId?.slice(0, 10) || 'Peer' });
        });
        
        // Draw connections
        ctx.lineWidth = 1.5;
        nodes.forEach((node, i) => {
            if (i === 0) return;
            const gradient = ctx.createLinearGradient(centerX, centerY, node.x, node.y);
            if (node.status === 'connected') { gradient.addColorStop(0, 'rgba(34, 197, 94, 0.5)'); gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)'); }
            else if (node.status === 'connecting') { gradient.addColorStop(0, 'rgba(234, 179, 8, 0.5)'); gradient.addColorStop(1, 'rgba(234, 179, 8, 0.1)'); }
            else { gradient.addColorStop(0, 'rgba(115, 115, 115, 0.3)'); gradient.addColorStop(1, 'rgba(115, 115, 115, 0.05)'); }
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
        });
        
        // Draw nodes
        nodes.forEach(node => {
            let color, size;
            switch (node.type) {
                case 'self': color = '#3b82f6'; size = 10; break;
                case 'seed': color = node.status === 'connected' ? '#22c55e' : node.status === 'connecting' ? '#eab308' : '#737373'; size = 7; break;
                case 'peer': color = node.status === 'connected' ? '#22c55e' : '#737373'; size = 5; break;
                default: color = '#737373'; size = 5;
            }
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '8px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.label, node.x, node.y + size + 10);
        });
        
        if (nodes.length === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Standalone mode', centerX, centerY + 40);
        }
    }
    
    requestUpdate() {
        this.render();
        this.setupEventListeners();
        if (this._state.showTopology) {
            setTimeout(() => this.initTopology(), 50);
        }
    }
}

defineComponent('network-panel', NetworkPanel);