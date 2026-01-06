/**
 * Sentient Sidebar Component
 * 
 * Container for sidebar panels with:
 * - Collapsible panels for moments, senses, nodes, learning
 * - Toggle visibility
 * - Responsive behavior
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';
import './sentient-panel.js';
import './oscillator-visualizer.js';
import './sedenion-visualizer.js';

export class SentientSidebar extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            visible: true,
            moments: [],
            senses: {},
            nodes: {},
            goals: null,
            learningActive: false,
            learningPaused: false
        };
    }
    
    static get observedAttributes() {
        return ['collapsed'];
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 340px;
                min-width: 280px;
                max-width: 600px;
                height: 100%;
                flex-shrink: 0;
                transition: width var(--transition-normal), margin var(--transition-normal);
            }
            
            :host([collapsed]) {
                width: 0 !important;
                min-width: 0 !important;
                margin-left: -1px;
                overflow: hidden;
            }
            
            .sidebar {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                height: 100%;
                padding: var(--space-sm);
                background: var(--bg-secondary);
                border-left: 1px solid var(--border-color);
                overflow-y: auto;
            }
            
            /* Oscillator full panel */
            .oscillator-full-container {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .oscillator-full-container oscillator-visualizer {
                height: 160px;
            }
            
            .osc-legend {
                display: flex;
                justify-content: center;
                gap: var(--space-md);
                font-size: 0.65rem;
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
            
            .legend-dot.high {
                background: var(--accent-secondary);
                box-shadow: 0 0 6px var(--accent-secondary);
            }
            
            .legend-dot.med {
                background: var(--accent-primary);
            }
            
            .legend-dot.low {
                background: var(--text-dim);
            }
            
            /* Sedenion full panel */
            .sedenion-full-container {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }
            
            .sedenion-full-container sedenion-visualizer {
                height: 150px;
            }
            
            .sedenion-axes-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 3px;
            }
            
            .sedenion-axis {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: var(--space-xs);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                font-size: 0.6rem;
            }
            
            .axis-name {
                color: var(--text-dim);
                text-transform: uppercase;
                font-size: 0.55rem;
            }
            
            .axis-value {
                font-family: var(--font-mono);
                color: var(--text-primary);
                font-size: 0.65rem;
            }
            
            .axis-value.positive { color: var(--success); }
            .axis-value.negative { color: var(--accent-tertiary); }
            
            .axis-bar-container {
                width: 100%;
                height: 3px;
                background: var(--bg-tertiary);
                border-radius: 2px;
                overflow: hidden;
                margin-top: 2px;
            }
            
            .axis-bar {
                height: 100%;
                background: var(--accent-primary);
                border-radius: 2px;
                transition: width var(--transition-fast);
            }
            
            .axis-bar.positive { background: var(--success); }
            .axis-bar.negative { background: var(--accent-tertiary); }
            
            /* Panel content styles */
            .moments-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .moment-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
                transition: background var(--transition-fast);
            }
            
            .moment-item:hover {
                background: rgba(99, 102, 241, 0.1);
            }
            
            .moment-item.coherence { border-left: 3px solid var(--success); }
            .moment-item.entropy_extreme { border-left: 3px solid var(--warning); }
            .moment-item.phase_transition { border-left: 3px solid var(--accent-primary); }
            
            .moment-icon { font-size: 1rem; }
            
            .moment-details {
                flex: 1;
            }
            
            .moment-trigger {
                font-weight: 500;
                color: var(--text-primary);
                text-transform: capitalize;
            }
            
            .moment-stats {
                font-size: 0.65rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .moment-placeholder {
                text-align: center;
                padding: var(--space-md);
                color: var(--text-dim);
                font-size: 0.8rem;
            }
            
            /* Goals */
            .goal-item {
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                margin-bottom: var(--space-xs);
            }
            
            .goal-description {
                font-size: 0.8rem;
                color: var(--text-primary);
                margin-bottom: var(--space-xs);
            }
            
            .goal-progress {
                height: 4px;
                background: var(--bg-primary);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .goal-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
                transition: width var(--transition-normal);
            }
            
            .focus-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            /* Senses - Compact Grid */
            .senses-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
                gap: 4px;
            }
            
            .sense-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4px;
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.65rem;
                min-height: 40px;
            }
            
            .sense-item.anomaly {
                background: rgba(245, 158, 11, 0.15);
            }
            
            .sense-icon {
                font-size: 1rem;
                margin-bottom: 2px;
            }
            
            .sense-value {
                font-family: var(--font-mono);
                color: var(--text-primary);
                font-size: 0.6rem;
                text-align: center;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .sense-status {
                display: none;
            }
            
            /* Nodes */
            .nodes-info {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }
            
            .node-self {
                display: flex;
                justify-content: space-between;
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
            }
            
            .node-id {
                font-family: var(--font-mono);
                color: var(--accent-primary);
            }
            
            .connections-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .connection-section {
                margin-bottom: var(--space-sm);
            }
            
            .connection-label {
                font-size: 0.65rem;
                font-weight: 600;
                color: var(--text-dim);
                text-transform: uppercase;
                margin-bottom: var(--space-xs);
            }
            
            .connection-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.7rem;
            }
            
            .connection-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .connection-item.connected .connection-status { color: var(--success); }
            .connection-item.disconnected .connection-status { color: var(--error); }
            .connection-item.connecting .connection-status { color: var(--warning); }
            
            .connection-url {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-family: var(--font-mono);
            }
            
            .node-placeholder {
                text-align: center;
                padding: var(--space-md);
                color: var(--text-dim);
                font-size: 0.8rem;
            }
            
            /* Learning */
            .learning-controls {
                display: flex;
                gap: var(--space-xs);
                margin-bottom: var(--space-sm);
            }
            
            .learning-btn {
                flex: 1;
                padding: var(--space-xs) var(--space-sm);
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                font-size: 0.75rem;
                transition: all var(--transition-fast);
            }
            
            .learning-btn:hover:not(:disabled) {
                background: var(--accent-primary);
                color: white;
            }
            
            .learning-btn:disabled {
                opacity: 0.5;
            }
            
            .learning-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--space-xs);
                margin-bottom: var(--space-sm);
            }
            
            .learning-stat {
                text-align: center;
                padding: var(--space-xs);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
            }
            
            .learning-stat-value {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--accent-primary);
            }
            
            .learning-stat-label {
                font-size: 0.6rem;
                color: var(--text-dim);
            }
            
            .eavesdrop-log {
                max-height: 150px;
                overflow-y: auto;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                padding: var(--space-xs);
            }
            
            .log-entry {
                display: flex;
                gap: var(--space-xs);
                padding: 2px var(--space-xs);
                font-size: 0.65rem;
                font-family: var(--font-mono);
                border-left: 2px solid transparent;
            }
            
            .log-entry.log-curiosity { border-left-color: var(--accent-primary); }
            .log-entry.log-question { border-left-color: var(--accent-secondary); }
            .log-entry.log-answer { border-left-color: var(--success); }
            .log-entry.log-error { border-left-color: var(--error); }
            
            .log-time {
                color: var(--text-dim);
            }
            
            .log-msg {
                color: var(--text-secondary);
                word-break: break-word;
            }
            
            .log-placeholder {
                text-align: center;
                padding: var(--space-md);
                color: var(--text-dim);
                font-size: 0.75rem;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                :host {
                    position: fixed;
                    top: 0;
                    right: 0;
                    height: 100vh;
                    z-index: 1000;
                    width: 280px;
                }
                
                :host([collapsed]) {
                    transform: translateX(100%);
                }
            }
        `;
    }
    
    template() {
        const { senses, nodes } = this._state;
        
        return `
            <aside class="sidebar">
                <!-- PRSC Oscillators Full Panel -->
                <sentient-panel title="PRSC Oscillators" icon="◎" collapsible expanded>
                    <div class="oscillator-full-container" id="oscillatorPanel">
                        <oscillator-visualizer id="sidebarOscViz"></oscillator-visualizer>
                        <div class="osc-legend">
                            <span class="legend-item"><span class="legend-dot high"></span> High</span>
                            <span class="legend-item"><span class="legend-dot med"></span> Med</span>
                            <span class="legend-item"><span class="legend-dot low"></span> Low</span>
                        </div>
                    </div>
                </sentient-panel>
                
                <!-- Sedenion Identity Full Panel -->
                <sentient-panel title="Sedenion Identity" icon="◈" collapsible expanded>
                    <div class="sedenion-full-container" id="sedenionPanel">
                        <sedenion-visualizer id="sidebarSedViz"></sedenion-visualizer>
                        <div class="sedenion-axes-grid" id="sedenionAxesGrid">
                            ${this.renderSedenionAxes()}
                        </div>
                    </div>
                </sentient-panel>
                
                <!-- Learning Panel -->
                <sentient-panel title="Autonomous Learning" icon="🎓" collapsible expanded>
                    <div class="learning-container" id="learningContainer">
                        ${this.renderLearning()}
                    </div>
                </sentient-panel>
                
                <!-- Network Panel -->
                <sentient-panel title="Network Nodes" icon="🌐" collapsible>
                    <div class="nodes-info" id="nodesInfo">
                        ${this.renderNodes(nodes)}
                    </div>
                </sentient-panel>
            </aside>
        `;
    }
    
    renderSedenionAxes() {
        const axes = ['coherence', 'identity', 'duality', 'structure', 'change',
                      'life', 'harmony', 'wisdom', 'infinity', 'creation',
                      'truth', 'love', 'power', 'time', 'space', 'consciousness'];
        
        return axes.map((name, i) => `
            <div class="sedenion-axis" data-index="${i}">
                <span class="axis-name">${name.slice(0, 4)}</span>
                <span class="axis-value" id="axisValue${i}">0.00</span>
                <div class="axis-bar-container">
                    <div class="axis-bar" id="axisBar${i}" style="width: 50%"></div>
                </div>
            </div>
        `).join('');
    }
    
    renderMoments(moments) {
        if (!moments || moments.length === 0) {
            return '<div class="moment-placeholder">Awaiting coherence...</div>';
        }
        
        const filtered = moments
            .filter(m => m.trigger !== 'entropy_extreme')
            .slice(0, 5);
        
        if (filtered.length === 0) {
            return '<div class="moment-placeholder">No significant moments</div>';
        }
        
        return filtered.map(m => {
            const icon = this.getMomentIcon(m.trigger);
            return `
                <div class="moment-item ${m.trigger}">
                    <span class="moment-icon">${icon}</span>
                    <div class="moment-details">
                        <div class="moment-trigger">${m.trigger.replace('_', ' ')}</div>
                        <div class="moment-stats">C=${(m.coherence * 100).toFixed(0)}% H=${(m.entropy * 100).toFixed(0)}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getMomentIcon(trigger) {
        switch (trigger) {
            case 'coherence': return '🎯';
            case 'entropy_extreme': return '⚡';
            case 'phase_transition': return '🌊';
            default: return '📍';
        }
    }
    
    renderGoals(goals) {
        if (!goals) {
            return '<div class="moment-placeholder">No active goals</div>';
        }
        
        let html = '';
        
        if (goals.topGoal) {
            const progress = (goals.topGoal.progress * 100).toFixed(0);
            html += `
                <div class="goal-item">
                    <div class="goal-description">${this.escapeHtml(goals.topGoal.description)}</div>
                    <div class="goal-progress">
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }
        
        if (goals.topFocus) {
            html += `
                <div class="focus-item">
                    <span class="focus-icon">🎯</span>
                    ${this.escapeHtml(goals.topFocus.target)} (${goals.topFocus.type})
                </div>
            `;
        }
        
        return html || '<div class="moment-placeholder">No active goals</div>';
    }
    
    renderSenses(senses) {
        if (!senses || Object.keys(senses).length === 0) {
            return '<div class="moment-placeholder">No sense data</div>';
        }
        
        const senseData = senses.senses || senses;
        
        const senseIcons = {
            chrono: '⏱',
            proprio: '🧠',
            filesystem: '📁',
            git: '🔀',
            process: '⚙️',
            network: '🌐',
            user: '👤',
            sight: '👁️'
        };
        
        return Object.entries(senseData).map(([name, sense]) => {
            const icon = senseIcons[name] || '📡';
            const anomalyClass = sense.error ? 'anomaly' : '';
            return `
                <div class="sense-item ${anomalyClass}" data-sense="${name}" title="${this.capitalize(name)}">
                    <span class="sense-icon">${icon}</span>
                    <span class="sense-value">${sense.summary || '--'}</span>
                </div>
            `;
        }).join('');
    }
    
    renderNodes(nodes) {
        if (!nodes || (!nodes.outbound?.length && !nodes.inbound?.length && !nodes.seeds?.length)) {
            return '<div class="node-placeholder">Standalone mode</div>';
        }
        
        let html = '';
        
        if (nodes.nodeId) {
            const shortId = nodes.nodeId.length > 25
                ? nodes.nodeId.slice(0, 12) + '...' + nodes.nodeId.slice(-8)
                : nodes.nodeId;
            html += `
                <div class="node-self">
                    <span>This Node:</span>
                    <span class="node-id" title="${nodes.nodeId}">${shortId}</span>
                </div>
            `;
        }
        
        html += '<div class="connections-list">';
        
        if (nodes.outbound?.length > 0) {
            html += '<div class="connection-section"><div class="connection-label">Outbound</div>';
            for (const conn of nodes.outbound) {
                const statusClass = conn.status === 'connected' ? 'connected' : 
                                    conn.status === 'connecting' ? 'connecting' : 'disconnected';
                const icon = conn.status === 'connected' ? '●' : conn.status === 'connecting' ? '◐' : '○';
                html += `
                    <div class="connection-item ${statusClass}">
                        <span class="connection-status">${icon}</span>
                        <span class="connection-url" title="${conn.url}">${this.truncateUrl(conn.url)}</span>
                    </div>
                `;
            }
            html += '</div>';
        }
        
        if (nodes.inbound?.length > 0) {
            html += '<div class="connection-section"><div class="connection-label">Inbound</div>';
            for (const conn of nodes.inbound) {
                html += `
                    <div class="connection-item connected">
                        <span class="connection-status">●</span>
                        <span class="connection-url">${conn.address || conn.ip || 'peer'}</span>
                    </div>
                `;
            }
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }
    
    renderLearning() {
        return `
            <div class="learning-controls">
                <button class="learning-btn" id="startLearning">▶ Start</button>
                <button class="learning-btn" id="pauseLearning" disabled>⏸ Pause</button>
                <button class="learning-btn" id="stopLearning" disabled>⏹ Stop</button>
            </div>
            <div class="learning-stats" id="learningStats">
                <div class="learning-stat">
                    <div class="learning-stat-value" id="learningIterations">0</div>
                    <div class="learning-stat-label">Iterations</div>
                </div>
                <div class="learning-stat">
                    <div class="learning-stat-value" id="learningQueries">0</div>
                    <div class="learning-stat-label">Queries</div>
                </div>
                <div class="learning-stat">
                    <div class="learning-stat-value" id="learningIngested">0</div>
                    <div class="learning-stat-label">Ingested</div>
                </div>
            </div>
            <div class="eavesdrop-log" id="eavesdropLog">
                <div class="log-placeholder">Start learning to see AI's thought process...</div>
            </div>
        `;
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    truncateUrl(url) {
        try {
            const u = new URL(url);
            const host = u.hostname.length > 20 ? u.hostname.slice(0, 17) + '...' : u.hostname;
            return `${host}:${u.port || (u.protocol === 'https:' ? 443 : 80)}`;
        } catch {
            return url.length > 25 ? url.slice(0, 22) + '...' : url;
        }
    }
    
    setupEventListeners() {
        // Learning controls
        const startBtn = this.$('#startLearning');
        const pauseBtn = this.$('#pauseLearning');
        const stopBtn = this.$('#stopLearning');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this._state.learningActive = true;
                this._state.learningPaused = false;
                this.updateLearningButtons();
                this.emit('learning-start');
            });
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this._state.learningPaused = !this._state.learningPaused;
                this.updateLearningButtons();
                this.emit('learning-pause');
            });
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this._state.learningActive = false;
                this._state.learningPaused = false;
                this.updateLearningButtons();
                this.emit('learning-stop');
            });
        }
    }
    
    /**
     * Update learning button states
     */
    updateLearningButtons() {
        const startBtn = this.$('#startLearning');
        const pauseBtn = this.$('#pauseLearning');
        const stopBtn = this.$('#stopLearning');
        
        if (startBtn) {
            startBtn.disabled = this._state.learningActive;
            startBtn.textContent = this._state.learningActive ? '⏳ Running' : '▶ Start';
        }
        if (pauseBtn) {
            pauseBtn.disabled = !this._state.learningActive;
            pauseBtn.textContent = this._state.learningPaused ? '▶ Resume' : '⏸ Pause';
        }
        if (stopBtn) {
            stopBtn.disabled = !this._state.learningActive;
        }
    }
    
    /**
     * Update moments data
     */
    updateMoments(moments) {
        this._state.moments = moments || [];
        const list = this.$('#momentsList');
        const badge = this.$('#momentCount');
        
        if (list) {
            list.innerHTML = this.renderMoments(this._state.moments);
        }
        if (badge) {
            badge.textContent = this._state.moments.length.toString();
        }
    }
    
    /**
     * Add a single moment
     */
    addMoment(moment) {
        if (moment.trigger === 'entropy_extreme') return;
        
        const now = Date.now();
        const recentSame = this._state.moments.find(m =>
            m.trigger === moment.trigger &&
            (now - (m.timestamp || now)) < 2000
        );
        
        if (recentSame) return;
        
        moment.timestamp = now;
        this._state.moments.unshift(moment);
        
        if (this._state.moments.length > 20) {
            this._state.moments = this._state.moments.slice(0, 20);
        }
        
        this.updateMoments(this._state.moments);
    }
    
    /**
     * Update goals data
     */
    updateGoals(goals) {
        this._state.goals = goals;
        const list = this.$('#goalsList');
        if (list) {
            list.innerHTML = this.renderGoals(goals);
        }
    }
    
    /**
     * Update senses data
     */
    updateSenses(senses) {
        this._state.senses = senses;
        const list = this.$('#sensesList');
        if (list) {
            list.innerHTML = this.renderSenses(senses);
        }
    }
    
    /**
     * Update nodes data
     */
    updateNodes(nodes) {
        this._state.nodes = nodes;
        const info = this.$('#nodesInfo');
        if (info) {
            info.innerHTML = this.renderNodes(nodes);
        }
    }
    
    /**
     * Update learning stats
     */
    updateLearningStats(stats) {
        const iterations = this.$('#learningIterations');
        const queries = this.$('#learningQueries');
        const ingested = this.$('#learningIngested');
        
        if (iterations) iterations.textContent = stats.iterations || 0;
        if (queries) queries.textContent = stats.queriesMade || 0;
        if (ingested) ingested.textContent = stats.contentIngested || 0;
        
        // Update learning state from stats
        if (stats.running !== undefined) {
            this._state.learningActive = stats.running;
            this._state.learningPaused = stats.paused || false;
            this.updateLearningButtons();
        }
    }
    
    /**
     * Add log entry to eavesdrop log
     */
    addLogEntry(type, message) {
        const log = this.$('#eavesdropLog');
        if (!log) return;
        
        // Remove placeholder if exists
        const placeholder = log.querySelector('.log-placeholder');
        if (placeholder) placeholder.remove();
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-msg">${this.escapeHtml(message)}</span>
        `;
        
        log.insertBefore(entry, log.firstChild);
        
        // Limit entries
        while (log.children.length > 25) {
            log.lastChild.remove();
        }
    }
    
    /**
     * Update oscillator data
     */
    updateOscillator(data) {
        const viz = this.$('#sidebarOscViz');
        if (!viz) return;
        
        if (data.oscillators && viz.setData) {
            viz.setData(data.oscillators, data.coherence || 0);
        }
        if (data.history && viz.setFieldHistory) {
            viz.setFieldHistory(data.history);
        }
    }
    
    /**
     * Update sedenion data
     */
    updateSedenion(data) {
        const viz = this.$('#sidebarSedViz');
        if (!viz) return;
        
        // Pass SMF data to visualizer
        if (data.axes && viz.setData) {
            viz.setData({
                components: data.axes.map((value, i) => ({
                    value: value,
                    name: this.getAxisName(i)
                })),
                norm: data.norm || 1
            });
        }
        if (data.history && viz.setFieldHistory) {
            viz.setFieldHistory(data.history);
        }
        
        // Update axis value elements in grid
        if (data.axes) {
            data.axes.forEach((value, i) => {
                const valEl = this.$(`#axisValue${i}`);
                const barEl = this.$(`#axisBar${i}`);
                
                if (valEl) {
                    valEl.textContent = value.toFixed(2);
                    valEl.classList.toggle('positive', value > 0);
                    valEl.classList.toggle('negative', value < 0);
                }
                
                if (barEl) {
                    // Map -1..1 to 0..100%
                    const percent = ((value + 1) / 2) * 100;
                    barEl.style.width = `${percent}%`;
                    barEl.classList.toggle('positive', value > 0.3);
                    barEl.classList.toggle('negative', value < -0.3);
                }
            });
        }
    }
    
    getAxisName(index) {
        const names = ['coherence', 'identity', 'duality', 'structure', 'change',
                       'life', 'harmony', 'wisdom', 'infinity', 'creation',
                       'truth', 'love', 'power', 'time', 'space', 'consciousness'];
        return names[index] || `axis${index}`;
    }
    
    /**
     * Toggle visibility
     */
    toggle() {
        if (this.hasAttribute('collapsed')) {
            this.removeAttribute('collapsed');
        } else {
            this.setAttribute('collapsed', '');
        }
        this.emit('sidebar-toggle', { collapsed: this.hasAttribute('collapsed') });
    }
    
    /**
     * Set width for resize
     */
    setWidth(width) {
        this.style.width = `${width}px`;
    }
}

defineComponent('sentient-sidebar', SentientSidebar);