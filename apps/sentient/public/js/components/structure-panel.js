
/**
 * Structure Panel Component
 *
 * Simplified Structure panel with:
 * - Live prime→concept maps (Canvas visualization)
 * - Knowledge graph (force-directed visualization)
 *
 * Supports `view` attribute to show single view (prime|graph) without tabs.
 * Memory browser removed - now handled by memory-panel.js
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

// SMF Axis definitions
const SMF_AXES = [
    { name: 'coherence', symbol: '◎', color: '#60a5fa', description: 'internal consistency' },
    { name: 'identity', symbol: '⊙', color: '#f472b6', description: 'self-continuity' },
    { name: 'duality', symbol: '☯', color: '#a78bfa', description: 'complementarity' },
    { name: 'structure', symbol: '⬡', color: '#34d399', description: 'organization' },
    { name: 'change', symbol: '⟳', color: '#fbbf24', description: 'transformation' },
    { name: 'life', symbol: '❀', color: '#4ade80', description: 'vitality' },
    { name: 'harmony', symbol: '♫', color: '#2dd4bf', description: 'balance' },
    { name: 'wisdom', symbol: '◆', color: '#818cf8', description: 'insight' },
    { name: 'infinity', symbol: '∞', color: '#c084fc', description: 'boundlessness' },
    { name: 'creation', symbol: '✧', color: '#fb923c', description: 'genesis' },
    { name: 'truth', symbol: '◇', color: '#94a3b8', description: 'verity' },
    { name: 'love', symbol: '♡', color: '#fb7185', description: 'connection' },
    { name: 'power', symbol: '⚡', color: '#facc15', description: 'capacity' },
    { name: 'time', symbol: '⏳', color: '#a3e635', description: 'temporality' },
    { name: 'space', symbol: '◈', color: '#22d3ee', description: 'extension' },
    { name: 'consciousness', symbol: '◉', color: '#e879f9', description: 'awareness' }
];

// First 50 primes for concept mapping
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
                73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
                157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229];

export class StructurePanel extends BaseComponent {
    static get observedAttributes() {
        return ['view'];
    }
    
    constructor() {
        super();
        
        this._state = {
            activeTab: 'primes', // primes or graph
            singleView: null, // If set via attribute, hide tabs and show only this view
            primeConceptMap: new Map(),
            activeOscillators: [],
            selectedPrime: null,
            graphNodes: [],
            graphEdges: [],
            selectedNode: null,
            graphLayout: 'force',
            loading: { primes: false, graph: false }
        };
        
        this.primeCanvas = null;
        this.graphCanvas = null;
        this.animationFrame = null;
        this.refreshInterval = null;
        this.graphZoom = 1;
        this.graphOffset = { x: 0, y: 0 };
        
        // Track data changes to avoid unnecessary updates
        this.lastNodeCount = 0;
        this.lastConceptCount = 0;
        this.layoutStable = false;
        this.layoutIterations = 0;
        this.maxLayoutIterations = 100; // Stop force layout after stabilization
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'view' && newValue) {
            // Map view attribute to internal tab names
            const viewMap = { 'prime': 'primes', 'graph': 'graph' };
            this._state.singleView = viewMap[newValue] || null;
            this._state.activeTab = viewMap[newValue] || 'primes';
            if (this.shadowRoot) {
                this.render();
            }
        }
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                height: 100%;
                background: var(--bg-primary);
            }
            
            .structure-panel {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .panel-tabs {
                display: flex;
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
                padding: 0 var(--space-xs);
            }
            
            .panel-tabs.hidden { display: none; }
            
            .panel-tab {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-xs);
                padding: var(--space-sm) var(--space-xs);
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--text-dim);
                background: transparent;
                border: none;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .panel-tab:hover { color: var(--text-secondary); background: var(--bg-secondary); }
            .panel-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
            .tab-icon { font-size: 0.9rem; }
            
            .panel-content { flex: 1; overflow: hidden; position: relative; }
            .tab-view { display: none; height: 100%; flex-direction: column; }
            .tab-view.active { display: flex; }
            
            /* Prime Map */
            .prime-map-view { padding: var(--space-sm); }
            .prime-map-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-sm); }
            .prime-map-title { font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
            .prime-map-stats { font-size: 0.6rem; font-family: var(--font-mono); color: var(--text-dim); }
            
            .prime-canvas-container {
                flex: 1;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                overflow: hidden;
                position: relative;
                min-height: 200px;
            }
            
            .prime-canvas { width: 100%; height: 100%; }
            
            .prime-legend {
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-xs);
                margin-top: var(--space-sm);
                padding: var(--space-xs);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
            }
            
            .legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.55rem; color: var(--text-dim); }
            .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
            
            .prime-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: var(--space-xs);
                max-height: 150px;
                overflow-y: auto;
                margin-top: var(--space-sm);
            }
            
            .prime-cell {
                padding: var(--space-xs);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                border: 1px solid var(--border-color);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .prime-cell:hover { border-color: var(--accent-primary); background: var(--bg-tertiary); }
            .prime-cell.active { border-color: var(--accent-primary); background: rgba(59, 130, 246, 0.1); }
            .prime-cell.resonating { animation: primeResonance 1s ease-in-out infinite; }
            
            @keyframes primeResonance {
                0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
                50% { box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.5); }
            }
            
            .prime-number { font-size: 0.75rem; font-weight: 600; font-family: var(--font-mono); color: var(--text-primary); }
            .prime-concept { font-size: 0.55rem; color: var(--text-dim); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .prime-amplitude { width: 100%; height: 3px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 4px; overflow: hidden; }
            .prime-amplitude-fill { height: 100%; background: var(--accent-primary); transition: width var(--transition-normal); }
            
            /* Memory View */
            .memory-view { padding: var(--space-sm); }
            .memory-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm); }
            
            .memory-search {
                flex: 1;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-size: 0.7rem;
                outline: none;
            }
            
            .memory-search:focus { border-color: var(--accent-primary); }
            .memory-filters { display: flex; gap: 2px; }
            
            .memory-filter-btn {
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.6rem;
                background: var(--bg-tertiary);
                color: var(--text-dim);
                border: none;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .memory-filter-btn:hover { background: var(--bg-secondary); color: var(--text-secondary); }
            .memory-filter-btn.active { background: var(--accent-primary); color: white; }
            
            .memory-stats {
                display: flex;
                gap: var(--space-md);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                margin-bottom: var(--space-sm);
            }
            
            .memory-stat { display: flex; align-items: center; gap: var(--space-xs); }
            .memory-stat-value { font-size: 0.8rem; font-weight: 600; color: var(--accent-primary); }
            .memory-stat-label { font-size: 0.55rem; color: var(--text-dim); }
            
            .memory-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-xs); }
            
            .memory-item {
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                border: 1px solid var(--border-color);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .memory-item:hover { border-color: var(--accent-primary); background: var(--bg-tertiary); }
            .memory-item.selected { border-color: var(--accent-primary); background: rgba(59, 130, 246, 0.1); }
            
            .memory-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-xs); }
            
            .memory-type { font-size: 0.55rem; padding: 2px 6px; background: var(--bg-tertiary); border-radius: var(--radius-sm); color: var(--text-secondary); }
            .memory-type.user { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
            .memory-type.assistant { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
            .memory-type.notable { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
            
            .memory-time { font-size: 0.55rem; font-family: var(--font-mono); color: var(--text-dim); }
            .memory-content { font-size: 0.65rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            
            .memory-detail {
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                margin-top: var(--space-sm);
                max-height: 200px;
                overflow-y: auto;
            }
            
            .memory-detail-title { font-size: 0.65rem; font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-xs); }
            .memory-detail-content { font-size: 0.6rem; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap; }
            
            /* Graph View */
            .graph-view { padding: var(--space-sm); }
            .graph-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-sm); }
            .graph-title { font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); }
            .graph-controls { display: flex; gap: var(--space-xs); }
            
            .graph-control-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: var(--bg-tertiary);
                border: none;
                border-radius: var(--radius-sm);
                color: var(--text-dim);
                cursor: pointer;
                font-size: 0.7rem;
                transition: all var(--transition-fast);
            }
            
            .graph-control-btn:hover { background: var(--accent-primary); color: white; }
            .graph-control-btn.active { background: var(--accent-primary); color: white; }
            
            .graph-canvas-container {
                flex: 1;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                overflow: hidden;
                position: relative;
                min-height: 250px;
            }
            
            .graph-canvas { width: 100%; height: 100%; }
            
            .graph-info {
                position: absolute;
                bottom: var(--space-sm);
                left: var(--space-sm);
                right: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                background: rgba(0, 0, 0, 0.7);
                border-radius: var(--radius-sm);
                font-size: 0.55rem;
                color: var(--text-secondary);
                backdrop-filter: blur(4px);
            }
            
            .graph-stats {
                display: flex;
                gap: var(--space-md);
                margin-top: var(--space-sm);
                padding: var(--space-xs);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
            }
            
            .graph-stat { text-align: center; }
            .graph-stat-value { font-size: 0.8rem; font-weight: 600; color: var(--accent-primary); }
            .graph-stat-label { font-size: 0.5rem; color: var(--text-dim); }
            
            .node-detail {
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                margin-top: var(--space-sm);
            }
            
            .node-detail-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs); }
            .node-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
            .node-name { font-size: 0.75rem; font-weight: 600; color: var(--text-primary); }
            .node-connections { font-size: 0.55rem; color: var(--text-dim); margin-top: var(--space-xs); }
            .connection-list { display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-top: var(--space-xs); }
            .connection-chip { padding: 2px 6px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.55rem; color: var(--text-secondary); }
            
            .loading-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; }
            .loading-spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            
            .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-lg); text-align: center; }
            .empty-icon { font-size: 2rem; margin-bottom: var(--space-sm); opacity: 0.5; }
            .empty-text { font-size: 0.7rem; color: var(--text-dim); }
        `;
    }
    
    template() {
        const { activeTab, singleView } = this._state;
        
        // If singleView is set, hide tabs and show only that view
        const hideTabs = singleView !== null;
        
        return `
            <div class="structure-panel">
                <div class="panel-tabs ${hideTabs ? 'hidden' : ''}">
                    <button class="panel-tab ${activeTab === 'primes' ? 'active' : ''}" data-tab="primes">
                        <span class="tab-icon">⊗</span>
                        <span>Prime Map</span>
                    </button>
                    <button class="panel-tab ${activeTab === 'graph' ? 'active' : ''}" data-tab="graph">
                        <span class="tab-icon">🕸</span>
                        <span>Graph</span>
                    </button>
                </div>
                
                <div class="panel-content">
                    <div class="tab-view prime-map-view ${activeTab === 'primes' ? 'active' : ''}" data-view="primes">
                        ${this.renderPrimeMapView()}
                    </div>
                    
                    <div class="tab-view graph-view ${activeTab === 'graph' ? 'active' : ''}" data-view="graph">
                        ${this.renderGraphView()}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPrimeMapView() {
        const { activeOscillators, loading } = this._state;
        const activeCount = activeOscillators.filter(o => o.amplitude > 0.1).length;
        
        return `
            <div class="prime-map-header">
                <span class="prime-map-title">Prime → Concept Resonance</span>
                <span class="prime-map-stats">Active: ${activeCount} / ${PRIMES.length}</span>
            </div>
            
            <div class="prime-canvas-container">
                <canvas class="prime-canvas" id="primeCanvas"></canvas>
                ${loading.primes ? '<div class="loading-overlay"><div class="loading-spinner"></div></div>' : ''}
            </div>
            
            <div class="prime-legend">
                ${SMF_AXES.slice(0, 8).map(axis => `
                    <div class="legend-item">
                        <div class="legend-dot" style="background: ${axis.color}"></div>
                        <span>${axis.symbol} ${axis.name}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="prime-grid">${this.renderPrimeGrid()}</div>
        `;
    }
    
    renderPrimeGrid() {
        const { activeOscillators, primeConceptMap, selectedPrime } = this._state;
        
        const sortedOscillators = [...activeOscillators].sort((a, b) => b.amplitude - a.amplitude).slice(0, 12);
        
        if (sortedOscillators.length === 0) {
            return PRIMES.slice(0, 12).map(prime => `
                <div class="prime-cell" data-prime="${prime}">
                    <div class="prime-number">${prime}</div>
                    <div class="prime-concept">${this.getPrimeConcept(prime)}</div>
                    <div class="prime-amplitude"><div class="prime-amplitude-fill" style="width: 10%"></div></div>
                </div>
            `).join('');
        }
        
        return sortedOscillators.map(osc => {
            const isActive = selectedPrime === osc.prime;
            const isResonating = osc.amplitude > 0.3;
            const concept = primeConceptMap.get(osc.prime) || this.getPrimeConcept(osc.prime);
            
            return `
                <div class="prime-cell ${isActive ? 'active' : ''} ${isResonating ? 'resonating' : ''}" data-prime="${osc.prime}">
                    <div class="prime-number">${osc.prime}</div>
                    <div class="prime-concept">${concept}</div>
                    <div class="prime-amplitude"><div class="prime-amplitude-fill" style="width: ${osc.amplitude * 100}%"></div></div>
                </div>
            `;
        }).join('');
    }
    
    renderMemoryView() {
        const { memories, memorySearch, memoryFilter, selectedMemory, loading } = this._state;
        const filteredMemories = this.filterMemories(memories, memoryFilter, memorySearch);
        const stats = { total: memories.length, session: memories.filter(m => m.type === 'session').length, notable: memories.filter(m => m.type === 'notable').length };
        
        return `
            <div class="memory-header">
                <input type="text" class="memory-search" placeholder="Search memories..." value="${memorySearch}" id="memorySearch">
                <div class="memory-filters">
                    <button class="memory-filter-btn ${memoryFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                    <button class="memory-filter-btn ${memoryFilter === 'recent' ? 'active' : ''}" data-filter="recent">Recent</button>
                    <button class="memory-filter-btn ${memoryFilter === 'notable' ? 'active' : ''}" data-filter="notable">Notable</button>
                </div>
            </div>
            
            <div class="memory-stats">
                <div class="memory-stat"><span class="memory-stat-value">${stats.total}</span><span class="memory-stat-label">Total</span></div>
                <div class="memory-stat"><span class="memory-stat-value">${stats.session}</span><span class="memory-stat-label">Session</span></div>
                <div class="memory-stat"><span class="memory-stat-value">${stats.notable}</span><span class="memory-stat-label">Notable</span></div>
            </div>
            
            ${loading.memory ? '<div class="loading-overlay"><div class="loading-spinner"></div></div>' : ''}
            
            <div class="memory-list">
                ${filteredMemories.length === 0 ? `
                    <div class="empty-state"><span class="empty-icon">🧠</span><span class="empty-text">No memories found</span></div>
                ` : filteredMemories.map(mem => this.renderMemoryItem(mem)).join('')}
            </div>
            
            ${selectedMemory ? this.renderMemoryDetail(selectedMemory) : ''}
        `;
    }
    
    renderMemoryItem(memory) {
        const { selectedMemory } = this._state;
        const isSelected = selectedMemory?.timestamp === memory.timestamp;
        const timeAgo = this.formatTimeAgo(memory.timestamp);
        
        return `
            <div class="memory-item ${isSelected ? 'selected' : ''}" data-timestamp="${memory.timestamp}">
                <div class="memory-item-header">
                    <span class="memory-type ${memory.role || memory.type}">${memory.role || memory.type}</span>
                    <span class="memory-time">${timeAgo}</span>
                </div>
                <div class="memory-content">${this.escapeHtml(memory.content || memory.user || memory.text || '')}</div>
            </div>
        `;
    }
    
    renderMemoryDetail(memory) {
        return `
            <div class="memory-detail">
                <div class="memory-detail-title">Memory Detail</div>
                <div class="memory-detail-content">${this.escapeHtml(memory.content || memory.user || memory.text || '')}</div>
            </div>
        `;
    }
    
    renderGraphView() {
        const { graphNodes, graphEdges, selectedNode, graphLayout, loading } = this._state;
        
        return `
            <div class="graph-header">
                <span class="graph-title">Knowledge Graph</span>
                <div class="graph-controls">
                    <button class="graph-control-btn ${graphLayout === 'force' ? 'active' : ''}" data-layout="force" title="Force Layout">⊛</button>
                    <button class="graph-control-btn ${graphLayout === 'radial' ? 'active' : ''}" data-layout="radial" title="Radial Layout">◎</button>
                    <button class="graph-control-btn" id="graphRefresh" title="Refresh">↻</button>
                    <button class="graph-control-btn" id="graphZoomIn" title="Zoom In">+</button>
                    <button class="graph-control-btn" id="graphZoomOut" title="Zoom Out">−</button>
                </div>
            </div>
            
            <div class="graph-canvas-container">
                <canvas class="graph-canvas" id="graphCanvas"></canvas>
                ${loading.graph ? '<div class="loading-overlay"><div class="loading-spinner"></div></div>' : ''}
                ${graphNodes.length > 0 ? `<div class="graph-info">Nodes: ${graphNodes.length} | Edges: ${graphEdges.length} | Click nodes to explore</div>` : ''}
            </div>
            
            <div class="graph-stats">
                <div class="graph-stat"><div class="graph-stat-value">${graphNodes.length}</div><div class="graph-stat-label">Concepts</div></div>
                <div class="graph-stat"><div class="graph-stat-value">${graphEdges.length}</div><div class="graph-stat-label">Relations</div></div>
                <div class="graph-stat"><div class="graph-stat-value">${this.getGraphDensity().toFixed(2)}</div><div class="graph-stat-label">Density</div></div>
            </div>
            
            ${selectedNode ? this.renderNodeDetail(selectedNode) : ''}
        `;
    }
    
    renderNodeDetail(node) {
        const { graphEdges } = this._state;
        const connections = graphEdges.filter(e => e.source === node.id || e.target === node.id).map(e => e.source === node.id ? e.target : e.source);
        
        return `
            <div class="node-detail">
                <div class="node-detail-header">
                    <div class="node-icon" style="background: ${node.color || '#60a5fa'}">${node.symbol || '◆'}</div>
                    <span class="node-name">${node.label || node.id}</span>
                </div>
                <div class="node-connections">Connected to ${connections.length} concepts:</div>
                <div class="connection-list">
                    ${connections.slice(0, 10).map(c => `<span class="connection-chip">${c}</span>`).join('')}
                    ${connections.length > 10 ? `<span class="connection-chip">+${connections.length - 10} more</span>` : ''}
                </div>
            </div>
        `;
    }
    
    // =============== LIFECYCLE ===============
    
    onMount() {
        this.setupTabClickHandlers();
        this.loadInitialData();
        this.initializeCanvases();
        this.refreshInterval = setInterval(() => this.refreshData(), 2000);
    }
    
    onUnmount() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }
    
    setupEventListeners() {
        this.$$('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const previousTab = this._state.activeTab;
                const newTab = tab.dataset.tab;
                
                if (previousTab === newTab) return; // No change
                
                this._state.activeTab = newTab;
                
                // Re-render the entire panel to ensure correct view
                this.render();
                this.setupTabClickHandlers();
                
                setTimeout(() => {
                    this.initializeCanvases();
                    // Reload data when switching to graph tab
                    if (newTab === 'graph') {
                        this.loadGraphData();
                    }
                }, 50);
            });
        });
        
    }
    
    /**
     * Setup tab click handlers (called after re-render)
     */
    setupTabClickHandlers() {
        this.$$('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const previousTab = this._state.activeTab;
                const newTab = tab.dataset.tab;
                
                if (previousTab === newTab) return;
                
                this._state.activeTab = newTab;
                
                // Re-render the entire panel to ensure correct view
                this.render();
                this.setupTabClickHandlers();
                
                setTimeout(() => {
                    this.initializeCanvases();
                    if (newTab === 'graph') {
                        this.loadGraphData();
                    }
                }, 50);
            });
        });
        
        // Setup graph control button handlers
        this.setupGraphControlHandlers();
        
        // Also setup click handlers for items
        this.addEventListener('click', (e) => {
            const primeCell = e.target.closest('.prime-cell');
            if (primeCell) {
                this._state.selectedPrime = parseInt(primeCell.dataset.prime);
                this.updatePrimeGrid();
            }
            
            const memoryItem = e.target.closest('.memory-item');
            if (memoryItem) {
                const timestamp = parseInt(memoryItem.dataset.timestamp);
                this._state.selectedMemory = this._state.memories.find(m => m.timestamp === timestamp);
                this.updateMemoryView();
            }
        });
    }
    
    /**
     * Setup handlers for graph control buttons (layout, refresh, zoom)
     */
    setupGraphControlHandlers() {
        // Layout buttons (force and radial)
        this.$$('.graph-control-btn[data-layout]').forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                if (layout === this._state.graphLayout) return;
                
                this._state.graphLayout = layout;
                this.layoutStable = false;
                this.layoutIterations = 0;
                
                // Apply the new layout
                if (layout === 'radial') {
                    this.applyRadialLayout();
                } else {
                    // Force layout will be applied in drawKnowledgeGraph
                    this.resetNodePositions();
                }
                
                // Update button active states
                this.$$('.graph-control-btn[data-layout]').forEach(b => {
                    b.classList.toggle('active', b.dataset.layout === layout);
                });
                
                // Redraw the graph
                this.drawKnowledgeGraph();
            });
        });
        
        // Refresh button
        const refreshBtn = this.$('#graphRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.layoutStable = false;
                this.layoutIterations = 0;
                this.lastConceptCount = -1; // Force reload
                this.loadGraphData();
            });
        }
        
        // Zoom In button
        const zoomInBtn = this.$('#graphZoomIn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.graphZoom = Math.min(3, this.graphZoom + 0.2);
                this.drawKnowledgeGraph();
            });
        }
        
        // Zoom Out button
        const zoomOutBtn = this.$('#graphZoomOut');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.graphZoom = Math.max(0.3, this.graphZoom - 0.2);
                this.drawKnowledgeGraph();
            });
        }
    }
    
    /**
     * Apply radial layout - arrange nodes in concentric circles
     */
    applyRadialLayout() {
        const { graphNodes } = this._state;
        if (graphNodes.length === 0) return;
        
        const canvas = this.graphCanvas;
        if (!canvas) return;
        
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Separate nodes by type
        const axisNodes = graphNodes.filter(n => n.type === 'axis');
        const learnedNodes = graphNodes.filter(n => n.type === 'learned');
        const otherNodes = graphNodes.filter(n => n.type !== 'axis' && n.type !== 'learned');
        
        // Inner ring: SMF axis nodes
        const innerRadius = Math.min(width, height) * 0.25;
        axisNodes.forEach((node, i) => {
            const angle = (i / axisNodes.length) * Math.PI * 2 - Math.PI / 2;
            node.x = centerX + Math.cos(angle) * innerRadius;
            node.y = centerY + Math.sin(angle) * innerRadius;
            node.vx = 0;
            node.vy = 0;
        });
        
        // Outer ring: learned concept nodes
        const outerRadius = Math.min(width, height) * 0.4;
        learnedNodes.forEach((node, i) => {
            const angle = (i / Math.max(learnedNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
            node.x = centerX + Math.cos(angle) * outerRadius;
            node.y = centerY + Math.sin(angle) * outerRadius;
            node.vx = 0;
            node.vy = 0;
        });
        
        // Middle ring: other nodes
        const middleRadius = Math.min(width, height) * 0.33;
        otherNodes.forEach((node, i) => {
            const angle = (i / Math.max(otherNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
            node.x = centerX + Math.cos(angle) * middleRadius;
            node.y = centerY + Math.sin(angle) * middleRadius;
            node.vx = 0;
            node.vy = 0;
        });
        
        // Mark layout as stable since radial is a static layout
        this.layoutStable = true;
    }
    
    /**
     * Reset node positions for force layout recalculation
     */
    resetNodePositions() {
        const { graphNodes } = this._state;
        const canvas = this.graphCanvas;
        if (!canvas || graphNodes.length === 0) return;
        
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Scatter nodes around center with some randomness
        graphNodes.forEach((node, i) => {
            const angle = (i / graphNodes.length) * Math.PI * 2;
            const radius = 50 + Math.random() * 80;
            node.x = centerX + Math.cos(angle) * radius;
            node.y = centerY + Math.sin(angle) * radius;
            node.vx = 0;
            node.vy = 0;
        });
    }
    
    updateTabs() {
        this.$$('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === this._state.activeTab));
        this.$$('.tab-view').forEach(v => v.classList.toggle('active', v.dataset.view === this._state.activeTab));
    }
    
    // =============== DATA LOADING ===============
    
    async loadInitialData() {
        await Promise.all([this.loadOscillatorData(), this.loadMemoryData(), this.loadGraphData()]);
    }
    
    async refreshData() {
        if (this._state.activeTab === 'primes') {
            await this.loadOscillatorData();
        } else if (this._state.activeTab === 'graph') {
            // Only check for new data, don't rebuild if nothing changed
            await this.checkForGraphUpdates();
        }
    }
    
    /**
     * Check if graph needs updating (only when new concepts are learned)
     * This avoids constant re-rendering when data hasn't changed
     */
    async checkForGraphUpdates() {
        try {
            // Only fetch learning status to check for new concepts
            const learningRes = await fetch('/learning/status');
            if (!learningRes.ok) return;
            
            const learningData = await learningRes.json();
            const conceptCount = learningData.session?.conceptsLearned?.length || 0;
            
            // Only rebuild if concept count changed
            if (conceptCount !== this.lastConceptCount) {
                this.lastConceptCount = conceptCount;
                this.layoutStable = false;
                this.layoutIterations = 0;
                await this.loadGraphData();
            }
        } catch (err) {
            // Silently fail - don't spam console for polling
        }
    }
    
    async loadOscillatorData() {
        try {
            const response = await fetch('/oscillators');
            if (response.ok) {
                const data = await response.json();
                this._state.activeOscillators = data.topOscillators || [];
                this.buildPrimeConceptMap(data.topOscillators);
                this.drawPrimeMap();
                this.updatePrimeGrid();
            }
        } catch (err) { console.warn('Failed to load oscillator data:', err); }
    }
    
    async loadMemoryData() {
        this._state.loading.memory = true;
        try {
            const historyRes = await fetch('/history');
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                this._state.memories = (historyData.messages || []).map((m, i) => ({ ...m, type: m.role, index: i }));
            }
        } catch (err) { console.warn('Failed to load memory data:', err); }
        this._state.loading.memory = false;
        this.updateMemoryView();
    }
    
    async loadGraphData() {
        this._state.loading.graph = true;
        
        try {
            // Fetch SMF data for base structure
            const smfRes = await fetch('/smf');
            let smfData = null;
            if (smfRes.ok) {
                smfData = await smfRes.json();
            }
            
            // Fetch learning status for learned concepts
            let learnedConcepts = [];
            try {
                const learningRes = await fetch('/learning/status');
                if (learningRes.ok) {
                    const learningData = await learningRes.json();
                    learnedConcepts = learningData.session?.conceptsLearned || [];
                    this.lastConceptCount = learnedConcepts.length;
                }
            } catch (e) {
                console.warn('Failed to fetch learning status:', e);
            }
            
            // Check if node count changed - only rebuild if needed
            const expectedNodeCount = 16 + Math.min(learnedConcepts.length, 20);
            if (this._state.graphNodes.length === expectedNodeCount && this.layoutStable) {
                // Data hasn't changed significantly, skip rebuild
                this._state.loading.graph = false;
                return;
            }
            
            // Build graph with both SMF and learned concepts
            if (smfData) {
                this.buildKnowledgeGraph(smfData, learnedConcepts);
            } else {
                console.warn('SMF endpoint not available, using default graph');
                this.buildDefaultGraph(learnedConcepts);
            }
            
            // Reset layout state for new data
            this.layoutStable = false;
            this.layoutIterations = 0;
            this.lastNodeCount = this._state.graphNodes.length;
            
        } catch (err) {
            console.warn('Failed to load graph data:', err);
            // Create default graph if SMF not available
            this.buildDefaultGraph([]);
        }
        this._state.loading.graph = false;
        
        // Re-initialize canvas after loading
        const graphCanvas = this.$('#graphCanvas');
        if (graphCanvas) {
            this.graphCanvas = graphCanvas;
            this.graphCtx = graphCanvas.getContext('2d');
            this.resizeCanvas(graphCanvas);
            this.drawKnowledgeGraph();
        }
        
        // Update the stats section and info overlay
        this.updateGraphStats();
    }
    
    /**
     * Update the graph stats section with current node/edge counts
     */
    updateGraphStats() {
        const { graphNodes, graphEdges } = this._state;
        
        // Update the stats bar at the bottom
        const statsContainer = this.$('.graph-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="graph-stat"><div class="graph-stat-value">${graphNodes.length}</div><div class="graph-stat-label">Concepts</div></div>
                <div class="graph-stat"><div class="graph-stat-value">${graphEdges.length}</div><div class="graph-stat-label">Relations</div></div>
                <div class="graph-stat"><div class="graph-stat-value">${this.getGraphDensity().toFixed(2)}</div><div class="graph-stat-label">Density</div></div>
            `;
        }
        
        // Update the info overlay on the canvas
        const infoContainer = this.$('.graph-info');
        if (infoContainer) {
            infoContainer.textContent = `Nodes: ${graphNodes.length} | Edges: ${graphEdges.length} | Click nodes to explore`;
        } else if (graphNodes.length > 0) {
            // Create info overlay if it doesn't exist but we have nodes
            const canvasContainer = this.$('.graph-canvas-container');
            if (canvasContainer) {
                const info = document.createElement('div');
                info.className = 'graph-info';
                info.textContent = `Nodes: ${graphNodes.length} | Edges: ${graphEdges.length} | Click nodes to explore`;
                canvasContainer.appendChild(info);
            }
        }
    }
    
    /**
     * Build default knowledge graph from SMF_AXES when server data unavailable
     * @param {Array} learnedConcepts - Concepts learned from the learning system
     */
    buildDefaultGraph(learnedConcepts = []) {
        const nodes = [];
        const edges = [];
        
        const centerX = 200;
        const centerY = 150;
        
        // Add SMF axis nodes in a circle
        SMF_AXES.forEach((axis, i) => {
            const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
            nodes.push({
                id: axis.name,
                label: axis.name,
                symbol: axis.symbol,
                color: axis.color,
                value: 0.5,
                type: 'axis',
                x: centerX + Math.cos(angle) * 100,
                y: centerY + Math.sin(angle) * 100,
                vx: 0, vy: 0
            });
        });
        
        // Circular edges between adjacent axes
        for (let i = 0; i < 16; i++) {
            edges.push({ source: SMF_AXES[i].name, target: SMF_AXES[(i + 1) % 16].name, weight: 0.5 });
        }
        
        // Complementary edges (opposite axes)
        for (let i = 0; i < 8; i++) {
            edges.push({ source: SMF_AXES[i].name, target: SMF_AXES[i + 8].name, weight: 0.3, type: 'complementary' });
        }
        
        // Add learned concept nodes
        this.addLearnedConceptNodes(nodes, edges, learnedConcepts, centerX, centerY);
        
        this._state.graphNodes = nodes;
        this._state.graphEdges = edges;
    }
    
    /**
     * Add learned concept nodes to the graph
     * @param {Array} nodes - Nodes array to add to
     * @param {Array} edges - Edges array to add to
     * @param {Array} learnedConcepts - Learned concepts from learning system
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     */
    addLearnedConceptNodes(nodes, edges, learnedConcepts, centerX, centerY) {
        if (!learnedConcepts || learnedConcepts.length === 0) return;
        
        // Deduplicate concepts by topic
        const uniqueConcepts = new Map();
        for (const concept of learnedConcepts) {
            if (concept.topic && !uniqueConcepts.has(concept.topic)) {
                uniqueConcepts.set(concept.topic, concept);
            }
        }
        
        const conceptArray = Array.from(uniqueConcepts.values()).slice(0, 20); // Limit to 20 concepts
        
        conceptArray.forEach((concept, i) => {
            // Position learned concepts in an outer ring
            const angle = (i / Math.max(conceptArray.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const radius = 160; // Outer ring
            
            const nodeId = `concept_${i}`;
            const label = concept.topic.length > 15 ? concept.topic.slice(0, 15) + '…' : concept.topic;
            
            nodes.push({
                id: nodeId,
                label: label,
                fullLabel: concept.topic,
                symbol: '◇',
                color: '#22d3ee', // Cyan for learned concepts
                value: 0.4,
                type: 'learned',
                timestamp: concept.timestamp,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: 0, vy: 0
            });
            
            // Connect to a related SMF axis based on keyword matching
            const relatedAxis = this.findRelatedAxis(concept.topic);
            if (relatedAxis) {
                edges.push({
                    source: nodeId,
                    target: relatedAxis,
                    weight: 0.4,
                    type: 'learned'
                });
            }
        });
    }
    
    /**
     * Find a related SMF axis for a concept based on keyword matching
     * @param {string} topic - The concept topic
     * @returns {string|null} - The axis name or null
     */
    findRelatedAxis(topic) {
        if (!topic) return null;
        
        const topicLower = topic.toLowerCase();
        
        // Keyword mappings to axes
        const axisKeywords = {
            'coherence': ['consistent', 'coherent', 'unified', 'aligned', 'logical'],
            'identity': ['self', 'identity', 'who', 'person', 'individual'],
            'duality': ['dual', 'opposite', 'binary', 'contrast', 'balance'],
            'structure': ['structure', 'organize', 'system', 'framework', 'architecture'],
            'change': ['change', 'transform', 'evolve', 'adapt', 'modify'],
            'life': ['life', 'living', 'biological', 'organic', 'vital'],
            'harmony': ['harmony', 'peace', 'balance', 'unity', 'cooperation'],
            'wisdom': ['wisdom', 'knowledge', 'insight', 'understanding', 'learn'],
            'infinity': ['infinite', 'endless', 'eternal', 'unlimited', 'boundless'],
            'creation': ['create', 'make', 'build', 'generate', 'produce'],
            'truth': ['truth', 'true', 'fact', 'real', 'authentic'],
            'love': ['love', 'care', 'connection', 'relationship', 'emotion'],
            'power': ['power', 'energy', 'force', 'strength', 'ability'],
            'time': ['time', 'temporal', 'duration', 'moment', 'history'],
            'space': ['space', 'spatial', 'location', 'distance', 'dimension'],
            'consciousness': ['conscious', 'aware', 'mind', 'thought', 'cognition']
        };
        
        for (const [axis, keywords] of Object.entries(axisKeywords)) {
            for (const keyword of keywords) {
                if (topicLower.includes(keyword)) {
                    return axis;
                }
            }
        }
        
        // Default to wisdom for learning-related concepts
        return 'wisdom';
    }
    
    
    // =============== PRIME CONCEPT MAP ===============
    
    buildPrimeConceptMap(oscillators) {
        const concepts = ['unity', 'duality', 'essence', 'stability', 'pentad', 'hexad', 'mystery', 'octave', 'trinity²', 'decad'];
        PRIMES.forEach((prime, i) => {
            if (!this._state.primeConceptMap.has(prime)) {
                this._state.primeConceptMap.set(prime, concepts[i % concepts.length]);
            }
        });
        
        if (oscillators) {
            oscillators.forEach(osc => {
                if (osc.amplitude > 0.3) {
                    const axisIndex = Math.floor(osc.phase * 16 / (2 * Math.PI)) % 16;
                    const axis = SMF_AXES[axisIndex];
                    if (axis) this._state.primeConceptMap.set(osc.prime, axis.name);
                }
            });
        }
    }
    
    getPrimeConcept(prime) {
        if (this._state.primeConceptMap.has(prime)) return this._state.primeConceptMap.get(prime);
        return ['unity', 'flow', 'form', 'force', 'field'][prime % 5];
    }
    
    initializeCanvases() {
        const primeCanvas = this.$('#primeCanvas');
        if (primeCanvas) {
            this.primeCanvas = primeCanvas;
            this.primeCtx = primeCanvas.getContext('2d');
            this.resizeCanvas(primeCanvas);
            this.drawPrimeMap();
        }
        
        const graphCanvas = this.$('#graphCanvas');
        if (graphCanvas) {
            this.graphCanvas = graphCanvas;
            this.graphCtx = graphCanvas.getContext('2d');
            this.resizeCanvas(graphCanvas);
            this.setupGraphCanvasInteraction(graphCanvas);
            this.drawKnowledgeGraph();
        }
    }
    
    /**
     * Setup mouse/touch interaction for graph canvas (click, wheel zoom, pan)
     */
    setupGraphCanvasInteraction(canvas) {
        // Prevent duplicate event listeners
        if (canvas._hasInteraction) return;
        canvas._hasInteraction = true;
        
        // Click to select nodes
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width / window.devicePixelRatio;
            const scaleY = canvas.height / rect.height / window.devicePixelRatio;
            
            // Get click position in canvas coordinates
            let x = (e.clientX - rect.left) * scaleX;
            let y = (e.clientY - rect.top) * scaleY;
            
            // Adjust for zoom and offset
            const width = canvas.width / window.devicePixelRatio;
            const height = canvas.height / window.devicePixelRatio;
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Transform click position to graph coordinates
            x = (x - centerX) / this.graphZoom + centerX - this.graphOffset.x;
            y = (y - centerY) / this.graphZoom + centerY - this.graphOffset.y;
            
            // Find clicked node
            const { graphNodes } = this._state;
            let clickedNode = null;
            
            for (const node of graphNodes) {
                const nodeRadius = 8 + (node.value || 0.5) * 12;
                const dx = node.x - x;
                const dy = node.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= nodeRadius) {
                    clickedNode = node;
                    break;
                }
            }
            
            // Update selection
            if (clickedNode) {
                this._state.selectedNode = this._state.selectedNode?.id === clickedNode.id ? null : clickedNode;
            } else {
                this._state.selectedNode = null;
            }
            
            // Re-render node detail and redraw graph
            this.updateNodeDetailPanel();
            this.drawKnowledgeGraph();
        });
        
        // Mouse wheel to zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.graphZoom = Math.max(0.3, Math.min(3, this.graphZoom + delta));
            this.drawKnowledgeGraph();
        }, { passive: false });
        
        // Drag to pan (when zoomed in)
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        
        canvas.addEventListener('mousedown', (e) => {
            if (this.graphZoom > 1) {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                this.graphOffset.x += dx / this.graphZoom;
                this.graphOffset.y += dy / this.graphZoom;
                lastX = e.clientX;
                lastY = e.clientY;
                this.drawKnowledgeGraph();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'default';
        });
        
        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            canvas.style.cursor = 'default';
        });
    }
    
    /**
     * Update the node detail panel after selection changes
     */
    updateNodeDetailPanel() {
        const { selectedNode } = this._state;
        const graphView = this.$('.graph-view');
        if (!graphView) return;
        
        // Remove existing detail panel
        const existingDetail = graphView.querySelector('.node-detail');
        if (existingDetail) {
            existingDetail.remove();
        }
        
        // Add new detail panel if node is selected
        if (selectedNode) {
            const detailHtml = this.renderNodeDetail(selectedNode);
            graphView.insertAdjacentHTML('beforeend', detailHtml);
        }
    }
    
    resizeCanvas(canvas) {
        const container = canvas.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    }
    
    drawPrimeMap() {
        const canvas = this.primeCanvas;
        const ctx = this.primeCtx;
        if (!canvas || !ctx) return;
        
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        ctx.fillStyle = 'rgb(24, 24, 27)';
        ctx.fillRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.4;
        
        // Draw background circles
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius * i / 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        const { activeOscillators } = this._state;
        const primePositions = new Map();
        
        // Position primes in a spiral
        PRIMES.forEach((prime, i) => {
            const angle = (i / PRIMES.length) * Math.PI * 4 - Math.PI / 2;
            const radius = maxRadius * 0.3 + (i / PRIMES.length) * maxRadius * 0.6;
            primePositions.set(prime, { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
        });
        
        // Draw connections between related primes
        const drawnConnections = new Set();
        activeOscillators.forEach(osc => {
            if (osc.amplitude < 0.1) return;
            const pos = primePositions.get(osc.prime);
            if (!pos) return;
            
            activeOscillators.forEach(other => {
                if (other.prime === osc.prime || other.amplitude < 0.1) return;
                const phaseDiff = Math.abs(osc.phase - other.phase);
                if (phaseDiff < 0.5 || phaseDiff > Math.PI * 2 - 0.5) {
                    const otherPos = primePositions.get(other.prime);
                    if (!otherPos) return;
                    const key = [osc.prime, other.prime].sort().join('-');
                    if (drawnConnections.has(key)) return;
                    drawnConnections.add(key);
                    
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(otherPos.x, otherPos.y);
                    ctx.strokeStyle = `rgba(96, 165, 250, ${Math.min(osc.amplitude, other.amplitude) * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        });
        
        // Draw prime nodes
        PRIMES.forEach((prime) => {
            const pos = primePositions.get(prime);
            if (!pos) return;
            
            const osc = activeOscillators.find(o => o.prime === prime);
            const amplitude = osc?.amplitude || 0;
            const isActive = amplitude > 0.1;
            const isSelected = this._state.selectedPrime === prime;
            
            let color = 'rgba(100, 100, 100, 0.3)';
            if (isActive && osc) {
                const axisIndex = Math.floor(osc.phase * 16 / (2 * Math.PI)) % 16;
                color = SMF_AXES[axisIndex]?.color || '#60a5fa';
            }
            
            if (isActive) {
                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20);
                gradient.addColorStop(0, color + '60');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const nodeRadius = isActive ? 6 + amplitude * 8 : 4;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? color : 'rgba(100, 100, 100, 0.5)';
            ctx.fill();
            
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            if (isActive || isSelected) {
                ctx.font = '10px monospace';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(prime.toString(), pos.x, pos.y - nodeRadius - 4);
            }
        });
        
        if (this._state.activeTab === 'primes') {
            this.animationFrame = requestAnimationFrame(() => this.drawPrimeMap());
        }
    }
    
    updatePrimeGrid() {
        const grid = this.$('.prime-grid');
        if (grid) grid.innerHTML = this.renderPrimeGrid();
    }
    
    // =============== MEMORY BROWSER ===============
    
    filterMemories(memories, filter, search) {
        let filtered = [...memories];
        
        if (filter === 'recent') {
            const oneHourAgo = Date.now() - 3600000;
            filtered = filtered.filter(m => m.timestamp > oneHourAgo);
        } else if (filter === 'notable') {
            filtered = filtered.filter(m => m.type === 'notable' || m.notable);
        }
        
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(m => (m.content || m.user || m.text || '').toLowerCase().includes(searchLower));
        }
        
        filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return filtered.slice(0, 50);
    }
    
    updateMemoryView() {
        const view = this.$('.memory-view');
        if (view) view.innerHTML = this.renderMemoryView();
    }
    
    // =============== KNOWLEDGE GRAPH ===============
    
    /**
     * Build knowledge graph from SMF data and learned concepts
     * @param {Object} smfData - SMF state from server
     * @param {Array} learnedConcepts - Concepts learned from learning system
     */
    buildKnowledgeGraph(smfData, learnedConcepts = []) {
        const nodes = [];
        const edges = [];
        
        const centerX = 200;
        const centerY = 150;
        
        if (smfData && smfData.components) {
            smfData.components.forEach((comp, i) => {
                const axis = SMF_AXES[i];
                nodes.push({
                    id: axis.name,
                    label: axis.name,
                    symbol: axis.symbol,
                    color: axis.color,
                    value: Math.abs(comp.value),
                    type: 'axis',
                    x: centerX + Math.cos(i * Math.PI / 8) * 120,
                    y: centerY + Math.sin(i * Math.PI / 8) * 120,
                    vx: 0, vy: 0
                });
            });
            
            // Circular edges
            for (let i = 0; i < 16; i++) {
                edges.push({ source: SMF_AXES[i].name, target: SMF_AXES[(i + 1) % 16].name, weight: 0.5 });
            }
            
            // Complementary edges
            for (let i = 0; i < 8; i++) {
                edges.push({ source: SMF_AXES[i].name, target: SMF_AXES[i + 8].name, weight: 0.3, type: 'complementary' });
            }
        }
        
        // Add learned concept nodes
        this.addLearnedConceptNodes(nodes, edges, learnedConcepts, centerX, centerY);
        
        this._state.graphNodes = nodes;
        this._state.graphEdges = edges;
    }
    
    getGraphDensity() {
        const { graphNodes, graphEdges } = this._state;
        if (graphNodes.length < 2) return 0;
        return graphEdges.length / (graphNodes.length * (graphNodes.length - 1) / 2);
    }
    
    stepForceLayout(width, height) {
        const { graphNodes, graphEdges } = this._state;
        const k = 50;
        
        graphNodes.forEach(node => {
            node.vx = node.vx || 0;
            node.vy = node.vy || 0;
            
            // Repulsion from other nodes
            graphNodes.forEach(other => {
                if (other === node) return;
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = k * k / dist;
                node.vx += (dx / dist) * force * 0.01;
                node.vy += (dy / dist) * force * 0.01;
            });
            
            // Center gravity
            node.vx += (width / 2 - node.x) * 0.001;
            node.vy += (height / 2 - node.y) * 0.001;
        });
        
        // Edge attraction
        graphEdges.forEach(edge => {
            const source = graphNodes.find(n => n.id === edge.source);
            const target = graphNodes.find(n => n.id === edge.target);
            if (!source || !target) return;
            
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - k) * 0.01;
            
            source.vx += (dx / dist) * force;
            source.vy += (dy / dist) * force;
            target.vx -= (dx / dist) * force;
            target.vy -= (dy / dist) * force;
        });
        
        // Apply velocity with damping
        graphNodes.forEach(node => {
            node.vx *= 0.9;
            node.vy *= 0.9;
            node.x += node.vx;
            node.y += node.vy;
            node.x = Math.max(30, Math.min(width - 30, node.x));
            node.y = Math.max(30, Math.min(height - 30, node.y));
        });
    }
    
    drawKnowledgeGraph() {
        const canvas = this.graphCanvas;
        const ctx = this.graphCtx;
        if (!canvas || !ctx) return;
        
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        ctx.fillStyle = 'rgb(24, 24, 27)';
        ctx.fillRect(0, 0, width, height);
        
        const { graphNodes, graphEdges, selectedNode, graphLayout } = this._state;
        
        if (graphNodes.length === 0) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading knowledge graph...', width / 2, height / 2);
            return;
        }
        
        // Only run force layout if not yet stable and using force layout mode
        if (!this.layoutStable && graphLayout === 'force') {
            this.stepForceLayout(width, height);
            this.layoutIterations++;
            
            // Check if layout has stabilized (velocities are low)
            const totalVelocity = graphNodes.reduce((sum, node) =>
                sum + Math.abs(node.vx || 0) + Math.abs(node.vy || 0), 0);
            
            if (this.layoutIterations > this.maxLayoutIterations || totalVelocity < 0.5) {
                this.layoutStable = true;
            }
        }
        
        // Apply zoom transform
        ctx.save();
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(this.graphZoom, this.graphZoom);
        ctx.translate(-centerX + this.graphOffset.x, -centerY + this.graphOffset.y);
        
        // Draw edges
        graphEdges.forEach(edge => {
            const source = graphNodes.find(n => n.id === edge.source);
            const target = graphNodes.find(n => n.id === edge.target);
            if (!source || !target) return;
            
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
            
            const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
            
            // Different edge styles for different types
            if (edge.type === 'complementary') {
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = isHighlighted ? 'rgba(168, 85, 247, 0.6)' : 'rgba(168, 85, 247, 0.2)';
            } else if (edge.type === 'learned') {
                ctx.setLineDash([]);
                ctx.strokeStyle = isHighlighted ? 'rgba(34, 211, 238, 0.7)' : 'rgba(34, 211, 238, 0.3)';
            } else {
                ctx.setLineDash([]);
                ctx.strokeStyle = isHighlighted ? 'rgba(96, 165, 250, 0.6)' : 'rgba(100, 100, 100, 0.3)';
            }
            
            ctx.lineWidth = isHighlighted ? 2 : 1;
            ctx.stroke();
            ctx.setLineDash([]);
        });
        
        // Draw nodes
        graphNodes.forEach(node => {
            const isSelected = selectedNode?.id === node.id;
            const nodeRadius = 8 + (node.value || 0.5) * 12;
            
            // Glow effect for active/selected nodes
            if (isSelected || node.type === 'learned') {
                const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeRadius * 2);
                gradient.addColorStop(0, (node.color || '#60a5fa') + '40');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = node.color || '#60a5fa';
            ctx.fill();
            
            // Draw symbol inside node for axis nodes
            if (node.symbol && node.type === 'axis') {
                ctx.font = `${nodeRadius}px sans-serif`;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.symbol, node.x, node.y);
            }
            
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Draw label below node
            ctx.font = '10px sans-serif';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(node.label, node.x, node.y + nodeRadius + 4);
        });
        
        ctx.restore();
        
        // Draw zoom indicator
        if (this.graphZoom !== 1) {
            ctx.font = '10px monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(`${Math.round(this.graphZoom * 100)}%`, width - 10, 10);
        }
        
        // Only continue animation if layout isn't stable or we have active selection
        if (this._state.activeTab === 'graph' && (!this.layoutStable || selectedNode)) {
            this.animationFrame = requestAnimationFrame(() => this.drawKnowledgeGraph());
        }
    }
    
    // =============== UTILITIES ===============
    
    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Unknown';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

defineComponent('structure-panel', StructurePanel);