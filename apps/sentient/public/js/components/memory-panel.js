
/**
 * Memory Panel Component
 * 
 * Comprehensive memory interface with:
 * - Thought traces browser with timeline
 * - Search functionality with filters
 * - Recall visualization showing memory associations
 * - Importance ranking by quaternion magnitude
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class MemoryPanel extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            // View mode
            viewMode: 'traces', // traces, search, recall, importance
            
            // Thought traces
            traces: [],
            selectedTrace: null,
            traceFilter: 'all', // all, input, output, reflection, imported
            
            // Search
            searchQuery: '',
            searchResults: [],
            searching: false,
            
            // Recall visualization
            recallNodes: [],
            recallEdges: [],
            recallCenter: null,
            
            // Importance ranking
            rankedTraces: [],
            rankSort: 'importance', // importance, recency, frequency
            
            // Loading states
            loading: false,
            error: null,
            
            // Stats
            stats: {
                total: 0,
                byType: {},
                avgImportance: 0
            }
        };
        
        this.pollInterval = null;
        this.recallCanvas = null;
        this.recallCtx = null;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--bg-primary);
            }
            
            .memory-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: var(--space-sm);
            }
            
            /* Header with view mode tabs */
            .memory-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
            }
            
            .view-tabs {
                display: flex;
                gap: 2px;
            }
            
            .view-tab {
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.65rem;
                background: transparent;
                color: var(--text-dim);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .view-tab:hover {
                color: var(--text-secondary);
            }
            
            .view-tab.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .view-tab-icon {
                font-size: 0.8rem;
            }
            
            .header-stats {
                display: flex;
                gap: var(--space-sm);
                font-size: 0.6rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            .stat-badge {
                padding: 2px 6px;
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
            }
            
            /* View content */
            .view-content {
                display: none;
                flex: 1;
                overflow: hidden;
            }
            
            .view-content.active {
                display: flex;
                flex-direction: column;
            }
            
            /* Traces View */
            .traces-view {
                gap: var(--space-sm);
            }
            
            .filter-bar {
                display: flex;
                gap: var(--space-xs);
                padding: var(--space-xs) 0;
            }
            
            .filter-chip {
                padding: 2px 8px;
                font-size: 0.6rem;
                background: var(--bg-tertiary);
                color: var(--text-dim);
                border-radius: var(--radius-full);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .filter-chip:hover {
                color: var(--text-secondary);
            }
            
            .filter-chip.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .traces-list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .trace-item {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
                border-left: 3px solid transparent;
            }
            
            .trace-item:hover {
                background: var(--bg-tertiary);
            }
            
            .trace-item.selected {
                border-left-color: var(--accent-primary);
                background: rgba(59, 130, 246, 0.1);
            }
            
            .trace-item.type-input { border-left-color: var(--success); }
            .trace-item.type-output { border-left-color: var(--accent-primary); }
            .trace-item.type-reflection { border-left-color: var(--warning); }
            .trace-item.type-imported { border-left-color: var(--text-dim); }
            
            .trace-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .trace-type {
                font-size: 0.55rem;
                text-transform: uppercase;
                font-weight: 600;
                padding: 1px 6px;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
            }
            
            .trace-type.input { color: var(--success); }
            .trace-type.output { color: var(--accent-primary); }
            .trace-type.reflection { color: var(--warning); }
            .trace-type.imported { color: var(--text-dim); }
            
            .trace-time {
                font-size: 0.55rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .trace-content {
                font-size: 0.7rem;
                color: var(--text-secondary);
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .trace-meta {
                display: flex;
                gap: var(--space-sm);
                font-size: 0.55rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .trace-importance {
                display: flex;
                align-items: center;
                gap: 2px;
            }
            
            .importance-bar {
                width: 40px;
                height: 4px;
                background: var(--bg-primary);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .importance-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--text-dim), var(--accent-primary));
                transition: width var(--transition-normal);
            }
            
            /* Search View */
            .search-view {
                gap: var(--space-sm);
            }
            
            .search-bar {
                display: flex;
                gap: var(--space-xs);
            }
            
            .search-input {
                flex: 1;
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-size: 0.75rem;
            }
            
            .search-input:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            
            .search-btn {
                padding: var(--space-sm) var(--space-md);
                background: var(--accent-primary);
                color: white;
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: 0.7rem;
            }
            
            .search-btn:hover {
                background: var(--accent-secondary);
            }
            
            .search-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .search-results {
                flex: 1;
                overflow-y: auto;
            }
            
            .result-item {
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                margin-bottom: var(--space-xs);
            }
            
            .result-score {
                font-size: 0.6rem;
                color: var(--accent-primary);
                font-family: var(--font-mono);
            }
            
            .result-highlight {
                background: rgba(251, 191, 36, 0.3);
                padding: 0 2px;
                border-radius: 2px;
            }
            
            /* Recall View */
            .recall-view {
                position: relative;
            }
            
            .recall-canvas {
                width: 100%;
                height: 100%;
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
            }
            
            .recall-controls {
                position: absolute;
                top: var(--space-sm);
                right: var(--space-sm);
                display: flex;
                gap: var(--space-xs);
            }
            
            .recall-btn {
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: 0.65rem;
            }
            
            .recall-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .recall-legend {
                position: absolute;
                bottom: var(--space-sm);
                left: var(--space-sm);
                display: flex;
                flex-direction: column;
                gap: 2px;
                font-size: 0.55rem;
                color: var(--text-dim);
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .legend-dot.input { background: var(--success); }
            .legend-dot.output { background: var(--accent-primary); }
            .legend-dot.reflection { background: var(--warning); }
            .legend-dot.center { background: white; }
            
            /* Importance View */
            .importance-view {
                gap: var(--space-sm);
            }
            
            .sort-bar {
                display: flex;
                gap: var(--space-xs);
            }
            
            .sort-option {
                padding: 2px 8px;
                font-size: 0.6rem;
                background: var(--bg-tertiary);
                color: var(--text-dim);
                border-radius: var(--radius-sm);
                cursor: pointer;
            }
            
            .sort-option.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .ranked-list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .ranked-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
            }
            
            .rank-number {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary);
                border-radius: 50%;
                font-size: 0.65rem;
                font-weight: 600;
                color: var(--text-secondary);
            }
            
            .rank-number.top-3 {
                background: var(--accent-primary);
                color: white;
            }
            
            .ranked-content {
                flex: 1;
                overflow: hidden;
            }
            
            .ranked-text {
                font-size: 0.7rem;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .ranked-meta {
                display: flex;
                gap: var(--space-sm);
                font-size: 0.55rem;
                color: var(--text-dim);
            }
            
            .ranked-score {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 2px;
            }
            
            .score-value {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--accent-primary);
                font-family: var(--font-mono);
            }
            
            .score-bar {
                width: 60px;
                height: 4px;
                background: var(--bg-primary);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .score-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
            }
            
            /* Trace Detail Modal */
            .trace-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .trace-modal.active {
                display: flex;
            }
            
            .trace-detail {
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                padding: var(--space-lg);
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .trace-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-md);
            }
            
            .trace-detail-title {
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .close-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                color: var(--text-dim);
                cursor: pointer;
            }
            
            .close-btn:hover {
                background: var(--error);
                color: white;
            }
            
            .trace-detail-content {
                font-size: 0.75rem;
                color: var(--text-secondary);
                line-height: 1.6;
                white-space: pre-wrap;
                margin-bottom: var(--space-md);
            }
            
            .trace-detail-quaternion {
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-family: var(--font-mono);
                font-size: 0.65rem;
                color: var(--text-dim);
            }
            
            .quaternion-component {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
            }
            
            .quaternion-label {
                color: var(--accent-primary);
            }
            
            /* Empty state */
            .empty-state {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: var(--text-dim);
                gap: var(--space-sm);
            }
            
            .empty-icon {
                font-size: 2rem;
                opacity: 0.5;
            }
            
            .empty-text {
                font-size: 0.75rem;
            }
            
            /* Loading */
            .loading-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid var(--bg-tertiary);
                border-top-color: var(--accent-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
    }
    
    template() {
        const { viewMode, stats, loading } = this._state;
        
        return `
            <div class="memory-container">
                <!-- Header -->
                <div class="memory-header">
                    <div class="view-tabs">
                        <button class="view-tab ${viewMode === 'traces' ? 'active' : ''}" data-view="traces">
                            <span class="view-tab-icon">📜</span>
                            <span>Traces</span>
                        </button>
                        <button class="view-tab ${viewMode === 'search' ? 'active' : ''}" data-view="search">
                            <span class="view-tab-icon">🔍</span>
                            <span>Search</span>
                        </button>
                        <button class="view-tab ${viewMode === 'recall' ? 'active' : ''}" data-view="recall">
                            <span class="view-tab-icon">🔗</span>
                            <span>Recall</span>
                        </button>
                        <button class="view-tab ${viewMode === 'importance' ? 'active' : ''}" data-view="importance">
                            <span class="view-tab-icon">⭐</span>
                            <span>Rank</span>
                        </button>
                    </div>
                    <div class="header-stats">
                        <span class="stat-badge">${stats.total} traces</span>
                        <span class="stat-badge">μ=${stats.avgImportance.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- Traces View -->
                <div class="view-content traces-view ${viewMode === 'traces' ? 'active' : ''}" data-view="traces">
                    ${this.renderTracesView()}
                </div>
                
                <!-- Search View -->
                <div class="view-content search-view ${viewMode === 'search' ? 'active' : ''}" data-view="search">
                    ${this.renderSearchView()}
                </div>
                
                <!-- Recall View -->
                <div class="view-content recall-view ${viewMode === 'recall' ? 'active' : ''}" data-view="recall">
                    ${this.renderRecallView()}
                </div>
                
                <!-- Importance View -->
                <div class="view-content importance-view ${viewMode === 'importance' ? 'active' : ''}" data-view="importance">
                    ${this.renderImportanceView()}
                </div>
                
                <!-- Trace Detail Modal -->
                <div class="trace-modal" id="traceModal">
                    <div class="trace-detail">
                        <div class="trace-detail-header">
                            <span class="trace-detail-title">Thought Trace</span>
                            <button class="close-btn" id="closeModal">✕</button>
                        </div>
                        <div class="trace-detail-content" id="traceDetailContent"></div>
                        <div class="trace-detail-quaternion" id="traceDetailQuaternion"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTracesView() {
        const { traces, traceFilter, loading, selectedTrace } = this._state;
        
        const filteredTraces = traces.filter(t => 
            traceFilter === 'all' || t.type === traceFilter
        );
        
        if (loading) {
            return `
                <div class="empty-state">
                    <div class="loading-spinner"></div>
                    <span class="empty-text">Loading traces...</span>
                </div>
            `;
        }
        
        return `
            <div class="filter-bar">
                <button class="filter-chip ${traceFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                <button class="filter-chip ${traceFilter === 'input' ? 'active' : ''}" data-filter="input">Input</button>
                <button class="filter-chip ${traceFilter === 'output' ? 'active' : ''}" data-filter="output">Output</button>
                <button class="filter-chip ${traceFilter === 'reflection' ? 'active' : ''}" data-filter="reflection">Reflection</button>
                <button class="filter-chip ${traceFilter === 'imported' ? 'active' : ''}" data-filter="imported">Imported</button>
            </div>
            <div class="traces-list">
                ${filteredTraces.length === 0 ? `
                    <div class="empty-state">
                        <span class="empty-icon">🧠</span>
                        <span class="empty-text">No thought traces yet</span>
                    </div>
                ` : filteredTraces.map(trace => `
                    <div class="trace-item type-${trace.type} ${selectedTrace?.id === trace.id ? 'selected' : ''}" data-trace-id="${trace.id}">
                        <div class="trace-header">
                            <span class="trace-type ${trace.type}">${trace.type}</span>
                            <span class="trace-time">${this.formatTime(trace.timestamp)}</span>
                        </div>
                        <div class="trace-content">${this.escapeHtml(trace.content)}</div>
                        <div class="trace-meta">
                            <span class="trace-importance">
                                Imp:
                                <div class="importance-bar">
                                    <div class="importance-fill" style="width: ${trace.importance * 100}%"></div>
                                </div>
                            </span>
                            <span>|Q|=${trace.quaternionMag?.toFixed(3) || '0.000'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderSearchView() {
        const { searchQuery, searchResults, searching } = this._state;
        
        return `
            <div class="search-bar">
                <input type="text" class="search-input" id="searchInput" 
                       placeholder="Search memories..." value="${searchQuery}">
                <button class="search-btn" id="searchBtn" ${searching ? 'disabled' : ''}>
                    ${searching ? '...' : 'Search'}
                </button>
            </div>
            <div class="search-results">
                ${searchResults.length === 0 ? `
                    <div class="empty-state">
                        <span class="empty-icon">🔍</span>
                        <span class="empty-text">Enter a query to search memories</span>
                    </div>
                ` : searchResults.map(result => `
                    <div class="result-item" data-trace-id="${result.id}">
                        <div class="trace-header">
                            <span class="trace-type ${result.type}">${result.type}</span>
                            <span class="result-score">Score: ${result.score.toFixed(3)}</span>
                        </div>
                        <div class="trace-content">${this.highlightMatch(result.content, searchQuery)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderRecallView() {
        const { recallCenter } = this._state;
        
        return `
            <canvas class="recall-canvas" id="recallCanvas"></canvas>
            <div class="recall-controls">
                <button class="recall-btn" id="refreshRecall">↻ Refresh</button>
                <button class="recall-btn" id="centerRecall">⊕ Center</button>
            </div>
            <div class="recall-legend">
                <div class="legend-item">
                    <div class="legend-dot center"></div>
                    <span>Selected</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot input"></div>
                    <span>Input</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot output"></div>
                    <span>Output</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot reflection"></div>
                    <span>Reflection</span>
                </div>
            </div>
        `;
    }
    
    renderImportanceView() {
        const { rankedTraces, rankSort, loading } = this._state;
        
        if (loading) {
            return `
                <div class="empty-state">
                    <div class="loading-spinner"></div>
                    <span class="empty-text">Ranking traces...</span>
                </div>
            `;
        }
        
        return `
            <div class="sort-bar">
                <button class="sort-option ${rankSort === 'importance' ? 'active' : ''}" data-sort="importance">By Importance</button>
                <button class="sort-option ${rankSort === 'recency' ? 'active' : ''}" data-sort="recency">By Recency</button>
                <button class="sort-option ${rankSort === 'frequency' ? 'active' : ''}" data-sort="frequency">By Frequency</button>
            </div>
            <div class="ranked-list">
                ${rankedTraces.length === 0 ? `
                    <div class="empty-state">
                        <span class="empty-icon">⭐</span>
                        <span class="empty-text">No traces to rank</span>
                    </div>
                ` : rankedTraces.slice(0, 20).map((trace, i) => `
                    <div class="ranked-item" data-trace-id="${trace.id}">
                        <div class="rank-number ${i < 3 ? 'top-3' : ''}">${i + 1}</div>
                        <div class="ranked-content">
                            <div class="ranked-text">${this.escapeHtml(trace.content)}</div>
                            <div class="ranked-meta">
                                <span class="trace-type ${trace.type}">${trace.type}</span>
                                <span>${this.formatTime(trace.timestamp)}</span>
                            </div>
                        </div>
                        <div class="ranked-score">
                            <span class="score-value">${trace.score.toFixed(3)}</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${Math.min(100, trace.score * 100)}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        // Convert to string if it's not already
        const text = typeof str === 'string' ? str : String(str);
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    
    highlightMatch(content, query) {
        if (!query || !content) return this.escapeHtml(content);
        
        const escaped = this.escapeHtml(content);
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escaped.replace(regex, '<span class="result-highlight">$1</span>');
    }
    
    onMount() {
        // Load initial data
        this.loadMemoryData();
        
        // Start polling for updates
        this.pollInterval = setInterval(() => this.loadMemoryData(), 5000);
    }
    
    onUnmount() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    setupEventListeners() {
        // View tabs
        this.$$('.view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this._state.viewMode = tab.dataset.view;
                this.render();
                
                // Initialize recall canvas if switching to recall view
                if (tab.dataset.view === 'recall') {
                    setTimeout(() => this.initRecallCanvas(), 100);
                }
            });
        });
        
        // Filter chips
        this.$$('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this._state.traceFilter = chip.dataset.filter;
                this.render();
            });
        });
        // Sort options
        this.$$('.sort-option').forEach(opt => {
            opt.addEventListener('click', () => {
                this._state.rankSort = opt.dataset.sort;
                this.sortRankedTraces();
                this.render();
            });
        });
        
        // Trace items
        this.$$('.trace-item, .result-item, .ranked-item').forEach(item => {
            item.addEventListener('click', () => {
                const traceId = item.dataset.traceId;
                this.showTraceDetail(traceId);
            });
        });
        
        // Search
        const searchInput = this.$('#searchInput');
        const searchBtn = this.$('#searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        // Modal close
        const closeModal = this.$('#closeModal');
        const traceModal = this.$('#traceModal');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }
        
        if (traceModal) {
            traceModal.addEventListener('click', (e) => {
                if (e.target === traceModal) this.hideModal();
            });
        }
        
        // Recall controls
        const refreshRecall = this.$('#refreshRecall');
        const centerRecall = this.$('#centerRecall');
        
        if (refreshRecall) {
            refreshRecall.addEventListener('click', () => this.refreshRecall());
        }
        
        if (centerRecall) {
            centerRecall.addEventListener('click', () => this.centerRecall());
        }
    }
    
    async loadMemoryData() {
        try {
            const res = await fetch('/memory?count=50');
            if (!res.ok) throw new Error('Failed to fetch memory');
            
            const data = await res.json();
            
            // Transform traces
            this._state.traces = (data.recent || []).map(t => ({
                id: t.id || Math.random().toString(36).substr(2, 9),
                type: t.type || 'output',
                content: t.content || t.text || '',
                timestamp: t.timestamp || Date.now(),
                importance: t.importance || Math.random() * 0.5 + 0.3,
                quaternionMag: t.quaternion ? Math.sqrt(
                    t.quaternion.w ** 2 + t.quaternion.x ** 2 +
                    t.quaternion.y ** 2 + t.quaternion.z ** 2
                ) : Math.random(),
                quaternion: t.quaternion || { w: 1, x: 0, y: 0, z: 0 }
            }));
            
            // Update stats
            const traces = this._state.traces;
            const byType = {};
            let totalImportance = 0;
            
            for (const t of traces) {
                byType[t.type] = (byType[t.type] || 0) + 1;
                totalImportance += t.importance;
            }
            
            this._state.stats = {
                total: traces.length,
                byType,
                avgImportance: traces.length > 0 ? totalImportance / traces.length : 0
            };
            
            // Update ranked traces
            this.sortRankedTraces();
            
            this.render();
        } catch (err) {
            console.warn('Failed to load memory data:', err);
            this._state.error = err.message;
        }
    }
    
    sortRankedTraces() {
        const { traces, rankSort } = this._state;
        
        const ranked = traces.map(t => ({
            ...t,
            score: this.computeScore(t, rankSort)
        }));
        
        ranked.sort((a, b) => b.score - a.score);
        
        this._state.rankedTraces = ranked;
    }
    
    computeScore(trace, sortType) {
        switch (sortType) {
            case 'importance':
                return trace.importance * trace.quaternionMag;
            case 'recency':
                const age = Date.now() - trace.timestamp;
                return 1 / (1 + age / 3600000); // Decay over hours
            case 'frequency':
                // Would need access count tracking - approximate with random for now
                return trace.importance * 0.5 + Math.random() * 0.5;
            default:
                return trace.importance;
        }
    }
    
    async performSearch() {
        const searchInput = this.$('#searchInput');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        if (!query) return;
        
        this._state.searchQuery = query;
        this._state.searching = true;
        this.render();
        
        try {
            // Search through local traces
            const results = this._state.traces
                .filter(t => t.content.toLowerCase().includes(query.toLowerCase()))
                .map(t => ({
                    ...t,
                    score: this.computeSearchScore(t.content, query)
                }))
                .sort((a, b) => b.score - a.score);
            
            this._state.searchResults = results;
        } catch (err) {
            console.warn('Search failed:', err);
        }
        
        this._state.searching = false;
        this.render();
    }
    
    computeSearchScore(content, query) {
        const lower = content.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // Count occurrences
        let count = 0;
        let pos = 0;
        while ((pos = lower.indexOf(queryLower, pos)) !== -1) {
            count++;
            pos++;
        }
        
        // Boost for exact match at start
        const startsWithBoost = lower.startsWith(queryLower) ? 0.5 : 0;
        
        return count * 0.3 + startsWithBoost;
    }
    
    showTraceDetail(traceId) {
        const trace = this._state.traces.find(t => t.id === traceId);
        if (!trace) return;
        
        this._state.selectedTrace = trace;
        
        const modal = this.$('#traceModal');
        const contentEl = this.$('#traceDetailContent');
        const quaternionEl = this.$('#traceDetailQuaternion');
        
        if (contentEl) {
            contentEl.textContent = trace.content;
        }
        
        if (quaternionEl && trace.quaternion) {
            const q = trace.quaternion;
            quaternionEl.innerHTML = `
                <div class="quaternion-component">
                    <span class="quaternion-label">w (real)</span>
                    <span>${q.w.toFixed(4)}</span>
                </div>
                <div class="quaternion-component">
                    <span class="quaternion-label">x (i)</span>
                    <span>${q.x.toFixed(4)}</span>
                </div>
                <div class="quaternion-component">
                    <span class="quaternion-label">y (j)</span>
                    <span>${q.y.toFixed(4)}</span>
                </div>
                <div class="quaternion-component">
                    <span class="quaternion-label">z (k)</span>
                    <span>${q.z.toFixed(4)}</span>
                </div>
                <div class="quaternion-component">
                    <span class="quaternion-label">|q| (magnitude)</span>
                    <span>${trace.quaternionMag.toFixed(4)}</span>
                </div>
            `;
        }
        
        if (modal) modal.classList.add('active');
    }
    
    hideModal() {
        const modal = this.$('#traceModal');
        if (modal) modal.classList.remove('active');
        this._state.selectedTrace = null;
    }
    
    initRecallCanvas() {
        const canvas = this.$('#recallCanvas');
        if (!canvas) return;
        
        this.recallCanvas = canvas;
        this.recallCtx = canvas.getContext('2d');
        
        // Set canvas size
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        this.drawRecall();
    }
    
    refreshRecall() {
        this.drawRecall();
    }
    
    centerRecall() {
        if (this._state.traces.length > 0) {
            // Pick the highest importance trace as center
            const sorted = [...this._state.traces].sort((a, b) => b.importance - a.importance);
            this._state.recallCenter = sorted[0];
            this.drawRecall();
        }
    }
    
    drawRecall() {
        const ctx = this.recallCtx;
        const canvas = this.recallCanvas;
        if (!ctx || !canvas) return;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear
        ctx.fillStyle = '#171717';
        ctx.fillRect(0, 0, width, height);
        
        const traces = this._state.traces;
        if (traces.length === 0) return;
        
        const center = this._state.recallCenter || traces[0];
        const cx = width / 2;
        const cy = height / 2;
        
        // Place nodes in a circular layout around center
        const nodes = traces.map((t, i) => {
            if (t.id === center.id) {
                return { trace: t, x: cx, y: cy, isCenter: true };
            }
            
            const angle = (i / traces.length) * Math.PI * 2;
            const radius = Math.min(width, height) * 0.35;
            return {
                trace: t,
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                isCenter: false
            };
        });
        
        // Draw edges based on similarity (quaternion distance)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        
        const centerNode = nodes.find(n => n.isCenter);
        for (const node of nodes) {
            if (node.isCenter) continue;
            
            // Compute similarity
            const similarity = this.computeSimilarity(center, node.trace);
            if (similarity > 0.3) {
                ctx.strokeStyle = `rgba(59, 130, 246, ${similarity * 0.5})`;
                ctx.beginPath();
                ctx.moveTo(centerNode.x, centerNode.y);
                ctx.lineTo(node.x, node.y);
                ctx.stroke();
            }
        }
        
        // Draw nodes
        for (const node of nodes) {
            const color = this.getTypeColor(node.trace.type);
            const size = node.isCenter ? 12 : 6 + node.trace.importance * 6;
            
            // Glow for center
            if (node.isCenter) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fill();
            }
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
    
    computeSimilarity(t1, t2) {
        // Compute quaternion distance as similarity measure
        const q1 = t1.quaternion || { w: 1, x: 0, y: 0, z: 0 };
        const q2 = t2.quaternion || { w: 1, x: 0, y: 0, z: 0 };
        
        const dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
        return Math.abs(dot);
    }
    
    getTypeColor(type) {
        switch (type) {
            case 'input': return '#22c55e';
            case 'output': return '#3b82f6';
            case 'reflection': return '#eab308';
            case 'imported': return '#737373';
            default: return '#a3a3a3';
        }
    }
}

defineComponent('memory-panel', MemoryPanel);
            