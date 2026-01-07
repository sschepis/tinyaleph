
/**
 * Sentient App Component - Simplified Layout
 *
 * Entropy-reduced UI with:
 * - Minimal header with consolidated metrics (single source of truth)
 * - Left sidebar with chat
 * - Center content with main visualization  
 * - Right panel with 6 flat tabs (no nesting)
 * 
 * Removed redundancies:
 * - Bottom panels (duplicate oscillator/sedenion views)
 * - Sidebar stats (duplicate metrics)
 * - Nested tab structure
 * - sentient-sidebar.js import (deleted)
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';
import './provider-selector.js';
import './sentient-chat.js';
import './introspection-modal.js';
import './field-panel.js';
import './sight-camera.js';
import './artifact-editor.js';
import './structure-panel.js';
import './learning-panel.js';
import './network-panel.js';
import './memory-panel.js';

export class SentientApp extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            connected: false,
            coherence: 0,
            entropy: 0,
            lambda: 0,
            activePrimes: 0,
            leftSidebarVisible: true,
            rightPanelVisible: true,
            rightPanelTab: 'prime', // prime, memory, graph, learn, network, field
            mainView: 'field', // field, artifact, camera
            artifactContent: null
        };
        
        // Stream connections
        this.statusStream = null;
        this.fieldStream = null;
        
        // Field history
        this.fieldHistory = [];
        this.maxFieldHistory = 120;
        
        // Resizer state
        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.leftSidebarWidth = 420;
        this.rightPanelWidth = 360;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 100%;
                height: 100vh;
                background: var(--bg-primary);
                overflow: hidden;
            }
            
            .app-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            /* ===== HEADER (Consolidated Metrics - Single Source of Truth) ===== */
            .app-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-md);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
                min-height: 40px;
            }
            
            .header-left {
                display: flex;
                align-items: center;
                gap: var(--space-md);
            }
            
            .logo {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .logo-icon { font-size: 1.1rem; }
            
            .logo-text {
                font-weight: 700;
                font-size: 0.9rem;
                background: linear-gradient(135deg, #f5f5f5, #a3a3a3);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            /* Unified Metrics Bar - THE single source of truth for metrics */
            .metrics-bar {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                padding: 4px var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-family: var(--font-mono);
                font-size: 0.7rem;
            }
            
            .metric-item {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 0 var(--space-xs);
                border-right: 1px solid var(--border-color);
            }
            
            .metric-item:last-child { border-right: none; }
            
            .metric-symbol { color: var(--text-dim); font-weight: 500; }
            .metric-val { font-weight: 600; }
            .metric-val.coherence { color: var(--accent-primary); }
            .metric-val.entropy { color: var(--warning); }
            .metric-val.lambda { color: var(--text-secondary); }
            .metric-val.primes { color: var(--success); }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                border-radius: var(--radius-sm);
                font-size: 0.65rem;
            }
            
            .status-indicator.connected {
                background: rgba(34, 197, 94, 0.15);
                color: var(--success);
            }
            
            .status-indicator.offline {
                background: var(--bg-tertiary);
                color: var(--text-dim);
            }
            
            .status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: currentColor;
            }
            
            .header-center {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .tool-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                font-size: 0.8rem;
                transition: all var(--transition-fast);
                cursor: pointer;
            }
            
            .tool-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .tool-btn.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .tool-divider {
                width: 1px;
                height: 18px;
                background: var(--border-color);
                margin: 0 2px;
            }
            
            /* ===== MAIN LAYOUT ===== */
            .main-layout {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            /* ===== LEFT SIDEBAR (Chat - Simplified) ===== */
            .left-sidebar {
                width: 420px;
                min-width: 320px;
                max-width: 600px;
                display: flex;
                flex-direction: column;
                background: var(--bg-secondary);
                border-right: 1px solid var(--border-color);
            }
            
            .left-sidebar.collapsed {
                width: 0 !important;
                min-width: 0 !important;
                overflow: hidden;
            }
            
            .chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
                min-height: 32px;
            }
            
            .chat-title {
                font-size: 0.7rem;
                font-weight: 600;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .mini-btn {
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                background: transparent;
                color: var(--text-dim);
                font-size: 0.75rem;
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .mini-btn:hover {
                background: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .chat-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }
            
            sentient-chat { flex: 1; }
            
            /* ===== RESIZERS ===== */
            .resizer {
                width: 4px;
                background: transparent;
                cursor: col-resize;
                flex-shrink: 0;
                transition: background var(--transition-fast);
                z-index: 10;
            }
            
            .resizer:hover,
            .resizer.resizing {
                background: var(--accent-primary);
            }
            
            .resizer.hidden { display: none; }
            
            /* ===== CENTER CONTENT ===== */
            .center-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 400px;
                background: var(--bg-primary);
            }
            
            /* Main Panel - Full Height, No Bottom Panels */
            .main-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
            }
            
            /* View Switcher */
            .view-switcher {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .view-tabs {
                display: flex;
                gap: 2px;
            }
            
            .view-tab {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--text-dim);
                background: transparent;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .view-tab:hover {
                color: var(--text-primary);
                background: var(--bg-tertiary);
            }
            
            .view-tab.active {
                color: var(--accent-primary);
                background: var(--bg-tertiary);
            }
            
            .view-tab-icon { font-size: 0.8rem; }
            
            .main-panel-content {
                flex: 1;
                display: flex;
                position: relative;
                overflow: hidden;
            }
            
            .view-content {
                display: none;
                width: 100%;
                height: 100%;
            }
            
            .view-content.active {
                display: flex;
                flex-direction: column;
            }
            
            .field-view {
                align-items: stretch;
                justify-content: stretch;
            }
            
            .field-view field-panel {
                flex: 1;
                width: 100%;
                height: 100%;
            }
            
            .artifact-view { padding: 0; }
            
            .artifact-view artifact-editor {
                flex: 1;
                height: 100%;
            }
            
            .camera-view {
                align-items: center;
                justify-content: center;
            }
            
            /* ===== RIGHT PANEL (6 Flat Tabs - No Nesting) ===== */
            .right-panel {
                width: 360px;
                min-width: 280px;
                max-width: 500px;
                display: flex;
                flex-direction: column;
                background: var(--bg-secondary);
                border-left: 1px solid var(--border-color);
            }
            
            .right-panel.collapsed {
                width: 0 !important;
                min-width: 0 !important;
                overflow: hidden;
            }
            
            /* 6 Flat Tabs - Single Level Navigation */
            .right-panel-tabs {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .right-tab {
                padding: var(--space-sm) var(--space-xs);
                font-size: 0.6rem;
                color: var(--text-dim);
                text-align: center;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all var(--transition-fast);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
            }
            
            .right-tab-icon { font-size: 0.85rem; }
            
            .right-tab:hover {
                color: var(--text-secondary);
                background: var(--bg-secondary);
            }
            
            .right-tab.active {
                color: var(--accent-primary);
                border-bottom-color: var(--accent-primary);
                background: var(--bg-secondary);
            }
            
            .right-panel-content {
                flex: 1;
                overflow-y: auto;
            }
            
            .tab-content {
                display: none;
                height: 100%;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Introspection Modal */
            introspection-modal { z-index: 2000; }
            
            /* Responsive */
            @media (max-width: 1200px) {
                .right-panel { width: 320px; }
                .right-tab { font-size: 0.55rem; }
            }
            
            @media (max-width: 1024px) {
                .left-sidebar { width: 350px; }
            }
            
            @media (max-width: 768px) {
                .right-panel { display: none; }
                .left-sidebar { width: 100%; max-width: none; }
            }
        `;
    }
    
    template() {
        const { leftSidebarVisible, rightPanelVisible, rightPanelTab, mainView, connected, coherence, entropy, lambda, activePrimes } = this._state;
        
        return `
            <div class="app-container">
                <!-- Header with Consolidated Metrics -->
                <header class="app-header">
                    <div class="header-left">
                        <div class="logo">
                            <span class="logo-icon">◈</span>
                            <span class="logo-text">SENTIENT</span>
                        </div>
                        
                        <!-- Unified Metrics Bar - Single Source of Truth -->
                        <div class="metrics-bar">
                            <div class="metric-item">
                                <span class="metric-symbol">κ</span>
                                <span class="metric-val coherence" id="metricCoherence">${coherence.toFixed(3)}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-symbol">H</span>
                                <span class="metric-val entropy" id="metricEntropy">${entropy.toFixed(3)}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-symbol">λ</span>
                                <span class="metric-val lambda" id="metricLambda">${lambda.toFixed(3)}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-symbol">P</span>
                                <span class="metric-val primes" id="metricPrimes">${activePrimes}</span>
                            </div>
                        </div>
                        
                        <div class="status-indicator ${connected ? 'connected' : 'offline'}">
                            <span class="status-dot"></span>
                            <span>${connected ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>
                    
                    <div class="header-center">
                        <provider-selector></provider-selector>
                        <span class="tool-divider"></span>
                        <button class="tool-btn" id="toggleIntrospect" title="Introspect">🔮</button>
                        <button class="tool-btn" id="toggleRightPanel" title="Toggle Panel">☰</button>
                    </div>
                </header>
                
                <!-- Main Layout -->
                <div class="main-layout">
                    <!-- Left Sidebar (Chat) -->
                    <aside class="left-sidebar ${leftSidebarVisible ? '' : 'collapsed'}" id="leftSidebar" style="width: ${this.leftSidebarWidth}px">
                        <div class="chat-header">
                            <span class="chat-title">Chat</span>
                            <button class="mini-btn" id="collapseChat" title="Collapse">◀</button>
                        </div>
                        <div class="chat-area">
                            <sentient-chat id="chat"></sentient-chat>
                        </div>
                    </aside>
                    
                    <div class="resizer ${leftSidebarVisible ? '' : 'hidden'}" id="leftResizer"></div>
                    
                    <!-- Center Content -->
                    <main class="center-content">
                        <div class="main-panel">
                            <!-- View Switcher -->
                            <div class="view-switcher">
                                <div class="view-tabs">
                                    <button class="view-tab ${mainView === 'field' ? 'active' : ''}" data-view="field">
                                        <span class="view-tab-icon">◈</span>
                                        <span>Field</span>
                                    </button>
                                    <button class="view-tab ${mainView === 'artifact' ? 'active' : ''}" data-view="artifact">
                                        <span class="view-tab-icon">◆</span>
                                        <span>Artifact</span>
                                    </button>
                                    <button class="view-tab ${mainView === 'camera' ? 'active' : ''}" data-view="camera">
                                        <span class="view-tab-icon">👁️</span>
                                        <span>Camera</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="main-panel-content">
                                <!-- Field Panel View -->
                                <div class="view-content field-view ${mainView === 'field' ? 'active' : ''}" data-view="field">
                                    <field-panel id="fieldPanel"></field-panel>
                                </div>
                                
                                <!-- Artifact Editor View -->
                                <div class="view-content artifact-view ${mainView === 'artifact' ? 'active' : ''}" data-view="artifact">
                                    <artifact-editor id="mainArtifact" title="AI Artifact" auto-run="true"></artifact-editor>
                                </div>
                                
                                <!-- Camera View -->
                                <div class="view-content camera-view ${mainView === 'camera' ? 'active' : ''}" data-view="camera">
                                    <sight-camera id="mainCamera"></sight-camera>
                                </div>
                            </div>
                        </div>
                    </main>
                    
                    <div class="resizer ${rightPanelVisible ? '' : 'hidden'}" id="rightResizer"></div>
                    
                    <!-- Right Panel (6 Flat Tabs) -->
                    <aside class="right-panel ${rightPanelVisible ? '' : 'collapsed'}" id="rightPanel" style="width: ${this.rightPanelWidth}px">
                        <div class="right-panel-tabs">
                            <button class="right-tab ${rightPanelTab === 'prime' ? 'active' : ''}" data-tab="prime">
                                <span class="right-tab-icon">⚛</span>
                                <span>Prime</span>
                            </button>
                            <button class="right-tab ${rightPanelTab === 'memory' ? 'active' : ''}" data-tab="memory">
                                <span class="right-tab-icon">🧠</span>
                                <span>Memory</span>
                            </button>
                            <button class="right-tab ${rightPanelTab === 'graph' ? 'active' : ''}" data-tab="graph">
                                <span class="right-tab-icon">🔗</span>
                                <span>Graph</span>
                            </button>
                            <button class="right-tab ${rightPanelTab === 'learn' ? 'active' : ''}" data-tab="learn">
                                <span class="right-tab-icon">📚</span>
                                <span>Learn</span>
                            </button>
                            <button class="right-tab ${rightPanelTab === 'network' ? 'active' : ''}" data-tab="network">
                                <span class="right-tab-icon">🌐</span>
                                <span>Network</span>
                            </button>
                            <button class="right-tab ${rightPanelTab === 'field' ? 'active' : ''}" data-tab="field">
                                <span class="right-tab-icon">◈</span>
                                <span>SMF</span>
                            </button>
                        </div>
                        
                        <div class="right-panel-content" id="rightPanelContent">
                            <!-- Prime Tab (from structure-panel Prime Map) -->
                            <div class="tab-content ${rightPanelTab === 'prime' ? 'active' : ''}" data-tab="prime">
                                <structure-panel id="structurePanel" view="prime"></structure-panel>
                            </div>
                            
                            <!-- Memory Tab (unified memory-panel) -->
                            <div class="tab-content ${rightPanelTab === 'memory' ? 'active' : ''}" data-tab="memory">
                                <memory-panel id="memoryPanel"></memory-panel>
                            </div>
                            
                            <!-- Graph Tab (from structure-panel Graph view) -->
                            <div class="tab-content ${rightPanelTab === 'graph' ? 'active' : ''}" data-tab="graph">
                                <structure-panel id="graphPanel" view="graph"></structure-panel>
                            </div>
                            
                            <!-- Learn Tab -->
                            <div class="tab-content ${rightPanelTab === 'learn' ? 'active' : ''}" data-tab="learn">
                                <learning-panel id="learningPanel"></learning-panel>
                            </div>
                            
                            <!-- Network Tab -->
                            <div class="tab-content ${rightPanelTab === 'network' ? 'active' : ''}" data-tab="network">
                                <network-panel id="networkPanel"></network-panel>
                            </div>
                            
                            <!-- SMF/Field Tab (sedenion axis detail) -->
                            <div class="tab-content ${rightPanelTab === 'field' ? 'active' : ''}" data-tab="field">
                                <field-panel id="smfPanel" mode="compact"></field-panel>
                            </div>
                        </div>
                    </aside>
                </div>
                
                <introspection-modal id="introspectionModal"></introspection-modal>
            </div>
        `;
    }
    
    onMount() {
        // Get component references
        this.chat = this.$('#chat');
        this.modal = this.$('#introspectionModal');
        this.fieldPanel = this.$('#fieldPanel');
        this.mainArtifact = this.$('#mainArtifact');
        this.mainCamera = this.$('#mainCamera');
        this.leftSidebar = this.$('#leftSidebar');
        this.rightPanel = this.$('#rightPanel');
        this.leftResizer = this.$('#leftResizer');
        this.rightResizer = this.$('#rightResizer');
        
        // Connect streams
        this.connectStreams();
        
        // Load initial data
        this.loadInitialData();
        
        // Load chat history
        this.chat?.loadHistory?.();
        
        // Setup resizers
        this.setupResizers();
        
        // Listen for artifact display events
        this.addEventListener('show-artifact', (e) => {
            this.showArtifact(e.detail);
        });
    }
    
    onUnmount() {
        this.disconnectStreams();
    }
    
    setupEventListeners() {
        // Introspect button
        const introspectBtn = this.$('#toggleIntrospect');
        if (introspectBtn) {
            introspectBtn.addEventListener('click', () => this.modal?.toggle());
        }
        
        // Right panel toggle
        const rightPanelBtn = this.$('#toggleRightPanel');
        if (rightPanelBtn) {
            rightPanelBtn.addEventListener('click', () => {
                this._state.rightPanelVisible = !this._state.rightPanelVisible;
                this.rightPanel?.classList.toggle('collapsed', !this._state.rightPanelVisible);
                this.rightResizer?.classList.toggle('hidden', !this._state.rightPanelVisible);
            });
        }
        
        // Chat collapse
        const collapseChat = this.$('#collapseChat');
        if (collapseChat) {
            collapseChat.addEventListener('click', () => {
                this._state.leftSidebarVisible = !this._state.leftSidebarVisible;
                this.leftSidebar?.classList.toggle('collapsed', !this._state.leftSidebarVisible);
                this.leftResizer?.classList.toggle('hidden', !this._state.leftSidebarVisible);
            });
        }
        
        // Main view switching
        const viewTabs = this.$$('.view-tab');
        viewTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const viewName = tab.dataset.view;
                this.switchMainView(viewName);
            });
        });
        
        // Right panel tab switching (6 flat tabs)
        const tabs = this.$$('.right-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this._state.rightPanelTab = tabName;
                
                // Update tab active states
                tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
                
                // Update content visibility
                const contents = this.$$('.tab-content');
                contents.forEach(c => c.classList.toggle('active', c.dataset.tab === tabName));
            });
        });
    }
    
    setupResizers() {
        // Left resizer
        if (this.leftResizer) {
            this.leftResizer.addEventListener('mousedown', (e) => {
                this.isResizingLeft = true;
                this.leftResizer.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                
                const startX = e.clientX;
                const startWidth = this.leftSidebar?.offsetWidth || this.leftSidebarWidth;
                
                const onMove = (e) => {
                    if (!this.isResizingLeft) return;
                    const delta = e.clientX - startX;
                    const newWidth = Math.max(320, Math.min(600, startWidth + delta));
                    if (this.leftSidebar) {
                        this.leftSidebar.style.width = `${newWidth}px`;
                        this.leftSidebarWidth = newWidth;
                    }
                };
                
                const onUp = () => {
                    this.isResizingLeft = false;
                    this.leftResizer.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }
        
        // Right resizer
        if (this.rightResizer) {
            this.rightResizer.addEventListener('mousedown', (e) => {
                this.isResizingRight = true;
                this.rightResizer.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                
                const startX = e.clientX;
                const startWidth = this.rightPanel?.offsetWidth || this.rightPanelWidth;
                
                const onMove = (e) => {
                    if (!this.isResizingRight) return;
                    const delta = startX - e.clientX;
                    const newWidth = Math.max(280, Math.min(500, startWidth + delta));
                    if (this.rightPanel) {
                        this.rightPanel.style.width = `${newWidth}px`;
                        this.rightPanelWidth = newWidth;
                    }
                };
                
                const onUp = () => {
                    this.isResizingRight = false;
                    this.rightResizer.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }
    }
    
    connectStreams() {
        // Status stream
        this.statusStream = new EventSource('/stream/status');
        this.statusStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'status') {
                    this.handleStatusUpdate(data.data);
                }
            } catch (err) {
                console.error('Status stream error:', err);
            }
        };
        
        this.statusStream.onopen = () => {
            this._state.connected = true;
            this.updateConnectionStatus();
        };
        
        this.statusStream.onerror = () => {
            this._state.connected = false;
            this.updateConnectionStatus();
            setTimeout(() => this.connectStreams(), 3000);
        };
        // Field stream
        this.fieldStream = new EventSource('/stream/field');
        this.fieldStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                this.handleFieldUpdate(data);
            } catch (err) {
                console.error('Field stream error:', err);
            }
        };
    }
    
    disconnectStreams() {
        if (this.statusStream) { this.statusStream.close(); this.statusStream = null; }
        if (this.fieldStream) { this.fieldStream.close(); this.fieldStream = null; }
    }
    
    updateConnectionStatus() {
        const indicator = this.$('.status-indicator');
        if (indicator) {
            indicator.classList.toggle('connected', this._state.connected);
            indicator.classList.toggle('offline', !this._state.connected);
            const label = indicator.querySelector('span:last-child');
            if (label) label.textContent = this._state.connected ? 'Live' : 'Offline';
        }
    }
    
    handleStatusUpdate(data) {
        // Update metrics in the unified metrics bar
        if (data.coherence !== undefined) {
            this._state.coherence = data.coherence;
            const el = this.$('#metricCoherence');
            if (el) el.textContent = data.coherence.toFixed(3);
        }
        if (data.entropy !== undefined) {
            this._state.entropy = data.entropy;
            const el = this.$('#metricEntropy');
            if (el) el.textContent = data.entropy.toFixed(3);
        }
        if (data.activePrimes !== undefined) {
            this._state.activePrimes = data.activePrimes;
            const el = this.$('#metricPrimes');
            if (el) el.textContent = data.activePrimes;
        }
    }
    
    handleFieldUpdate(data) {
        this.fieldHistory.push(data);
        if (this.fieldHistory.length > this.maxFieldHistory) {
            this.fieldHistory.shift();
        }
        
        // Update field panel
        if (data.smf && this.fieldPanel) {
            this.fieldPanel.setData(data.smf);
            this.fieldPanel.setFieldHistory(this.fieldHistory);
        }
        
        // Update lambda metric
        if (data.lambda !== undefined) {
            this._state.lambda = data.lambda;
            const el = this.$('#metricLambda');
            if (el) el.textContent = data.lambda.toFixed(3);
        }
    }
    
    async loadInitialData() {
        try {
            const statusRes = await fetch('/status');
            if (statusRes.ok) {
                const status = await statusRes.json();
                this.handleStatusUpdate(status);
            }
        } catch (err) {
            console.warn('Failed to load initial data:', err);
        }
    }
    
    switchMainView(viewName) {
        if (this._state.mainView === viewName) return;
        
        this._state.mainView = viewName;
        
        // Update view tab active states
        const viewTabs = this.$$('.view-tab');
        viewTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewName));
        
        // Update view content visibility
        const viewContents = this.$$('.view-content');
        viewContents.forEach(c => c.classList.toggle('active', c.dataset.view === viewName));
        
        this.emit('view-change', { view: viewName });
    }
    
    showArtifact(options = {}) {
        this.switchMainView('artifact');
        
        if (options.content && this.mainArtifact) {
            this.mainArtifact.setContent(options.content);
        }
        
        if (options.title && this.mainArtifact) {
            this.mainArtifact.setAttribute('title', options.title);
        }
    }
    
    getArtifactContent() {
        return this.mainArtifact?.getContent?.() || null;
    }
    
    getArtifactHTML() {
        return this.mainArtifact?.getCombinedHTML?.() || '';
    }
}

defineComponent('sentient-app', SentientApp);
    