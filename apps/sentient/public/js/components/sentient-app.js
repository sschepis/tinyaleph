
/**
 * Sentient App Component
 *
 * Main application shell with Aleph.0-style layout:
 * - Header with tools and metrics
 * - Left sidebar with chat input
 * - Main content area with visualization panels (switchable views)
 * - Two side-by-side bottom panels
 * - Collapsible right panel with tabs
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';
import './sentient-header.js';
import './provider-selector.js';
import './sentient-chat.js';
import './sentient-sidebar.js';
import './introspection-modal.js';
import './oscillator-visualizer.js';
import './sedenion-visualizer.js';
import './field-panel.js';
import './sight-camera.js';
import './sentient-panel.js';
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
            oscillatorCount: 0,
            momentCount: 0,
            subjectiveTime: 0,
            leftSidebarVisible: true,
            rightPanelVisible: true,
            rightPanelTab: 'structure', // structure, learning, network, memory
            mainView: 'sedenion', // sedenion, artifact, camera
            artifactContent: null // content for artifact editor
        };
        
        // Stream connections
        this.statusStream = null;
        this.momentStream = null;
        this.fieldStream = null;
        this.learningStream = null;
        
        // Polling intervals
        this.nodesInterval = null;
        
        // Field history
        this.fieldHistory = [];
        this.maxFieldHistory = 120;
        
        // Resizer state
        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.leftSidebarWidth = 500;
        this.rightPanelWidth = 450;
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
            
            /* ===== HEADER ===== */
            .app-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-md);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
                min-height: 44px;
            }
            
            .header-left {
                display: flex;
                align-items: center;
                gap: var(--space-md);
            }
            
            .logo {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            
            .logo-icon {
                font-size: 1.3rem;
            }
            
            .logo-text {
                font-weight: 700;
                font-size: 1rem;
                background: linear-gradient(135deg, #f5f5f5, #a3a3a3);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .logo-sub {
                font-size: 0.6rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .status-badges {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                font-size: 0.65rem;
                font-family: var(--font-mono);
            }
            
            .status-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
            }
            
            .status-badge.listening {
                background: rgba(34, 197, 94, 0.15);
                color: var(--success);
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
                width: 32px;
                height: 32px;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                font-size: 0.85rem;
                transition: all var(--transition-fast);
                cursor: pointer;
                border: 1px solid transparent;
            }
            
            .tool-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .tool-btn.active {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-secondary);
            }
            
            .tool-divider {
                width: 1px;
                height: 20px;
                background: var(--border-color);
                margin: 0 var(--space-xs);
            }
            
            .header-right {
                display: flex;
                align-items: center;
                gap: var(--space-lg);
            }
            
            .metric-group {
                display: flex;
                align-items: center;
                gap: var(--space-lg);
            }
            
            .metric {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-family: var(--font-mono);
            }
            
            .metric-label {
                font-size: 0.5rem;
                color: var(--text-dim);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .metric-value {
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            .metric-value.entropy { color: var(--warning); }
            .metric-value.coherence { color: var(--accent-primary); }
            .metric-value.phrases { color: var(--text-primary); }
            
            /* ===== MAIN LAYOUT ===== */
            .main-layout {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            /* ===== LEFT SIDEBAR (Chat) ===== */
            .left-sidebar {
                width: 500px;
                min-width: 350px;
                max-width: 800px;
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
            
            .sidebar-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
                min-height: 32px;
            }
            
            .sidebar-controls {
                display: flex;
                gap: var(--space-xs);
            }
            
            .mini-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                background: transparent;
                color: var(--text-dim);
                font-size: 0.8rem;
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .mini-btn:hover {
                background: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .voice-indicator {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                color: var(--text-dim);
            }
            
            .tip-box {
                margin: var(--space-sm);
                padding: var(--space-sm) var(--space-md);
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: var(--radius-md);
                font-size: 0.75rem;
                color: var(--text-secondary);
                display: flex;
                align-items: flex-start;
                gap: var(--space-sm);
            }
            
            .tip-icon { font-size: 1rem; }
            
            .chat-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }
            
            sentient-chat {
                flex: 1;
            }
            
            .sidebar-stats {
                padding: var(--space-sm) var(--space-md);
                border-top: 1px solid var(--border-color);
                background: var(--bg-tertiary);
            }
            
            .stat-bar {
                margin-bottom: var(--space-xs);
            }
            
            .stat-bar:last-child { margin-bottom: 0; }
            
            .stat-bar-header {
                display: flex;
                justify-content: space-between;
                font-size: 0.6rem;
                color: var(--text-dim);
                margin-bottom: 2px;
                text-transform: uppercase;
            }
            
            .stat-bar-track {
                height: 4px;
                background: var(--bg-primary);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .stat-bar-fill {
                height: 100%;
                transition: width var(--transition-normal);
            }
            
            .stat-bar-fill.coherence { background: linear-gradient(90deg, #737373, var(--success)); }
            .stat-bar-fill.energy { background: linear-gradient(90deg, var(--warning), #a3a3a3); }
            
            .lang-selector {
                display: flex;
                gap: var(--space-xs);
                margin-top: var(--space-sm);
            }
            
            .lang-btn {
                padding: 2px 8px;
                font-size: 0.65rem;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                color: var(--text-dim);
                cursor: pointer;
            }
            
            .lang-btn.active {
                background: var(--accent-primary);
                color: white;
            }
            
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
            
            /* Main Visualization Panel */
            .main-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
                min-height: 300px;
            }
            
            /* View Switcher Bar */
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
                gap: var(--space-xs);
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
            
            .view-tab-icon {
                font-size: 0.85rem;
            }
            
            .view-actions {
                display: flex;
                gap: var(--space-xs);
            }
            
            .view-action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: var(--radius-sm);
                background: transparent;
                color: var(--text-dim);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .view-action-btn:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            .main-panel-content {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--space-lg);
                position: relative;
            }
            
            /* View content containers */
            .view-content {
                display: none;
                width: 100%;
                height: 100%;
            }
            
            .view-content.active {
                display: flex;
                flex-direction: column;
            }
            
            .sedenion-view {
                align-items: stretch;
                justify-content: stretch;
            }
            
            .sedenion-view field-panel {
                flex: 1;
                width: 100%;
                height: 100%;
            }
            
            .artifact-view {
                padding: 0;
            }
            
            .artifact-view artifact-editor {
                flex: 1;
                height: 100%;
            }
            
            .sedenion-main {
                width: 100%;
                max-width: 600px;
                aspect-ratio: 1;
            }
            
            .viz-status {
                position: absolute;
                bottom: var(--space-md);
                left: var(--space-md);
                font-size: 0.65rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            .primes-bar {
                position: absolute;
                top: var(--space-md);
                left: var(--space-md);
                font-size: 0.65rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            .dominant-info {
                position: absolute;
                bottom: var(--space-md);
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: var(--space-lg);
                font-size: 0.7rem;
                font-family: var(--font-mono);
            }
            
            .dominant-axis {
                display: flex;
                gap: var(--space-sm);
            }
            
            .axis-label { color: var(--text-dim); }
            .axis-value { color: var(--accent-primary); font-weight: 600; }
            
            /* Bottom Panels */
            .bottom-panels {
                display: flex;
                height: 250px;
                border-top: 1px solid var(--border-color);
            }
            
            .bottom-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            
            .bottom-panel + .bottom-panel {
                border-left: 1px solid var(--border-color);
            }
            
            .bottom-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .bottom-panel-title {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            
            .panel-icon {
                font-size: 0.7rem;
                color: var(--text-dim);
            }
            
            .panel-label {
                font-size: 0.65rem;
                font-weight: 600;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .panel-status {
                font-size: 0.6rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            .bottom-panel-content {
                flex: 1;
                overflow: auto;
                padding: var(--space-sm);
            }
            
            .osc-container {
                height: 100%;
            }
            
            .osc-container oscillator-visualizer {
                height: 100%;
            }
            
            /* ===== RIGHT PANEL ===== */
            .right-panel {
                width: 450px;
                min-width: 300px;
                max-width: 600px;
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
            
            .right-panel-tabs {
                display: flex;
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .right-tab {
                flex: 1;
                padding: var(--space-sm);
                font-size: 0.7rem;
                color: var(--text-dim);
                text-align: center;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all var(--transition-fast);
            }
            
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
                padding: var(--space-sm);
            }
            
            /* Tab Contents */
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Structure Tab - Matrix view */
            .matrix-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--space-sm);
            }
            
            .matrix-tabs {
                display: flex;
                gap: var(--space-xs);
            }
            
            .matrix-tab {
                padding: 2px 8px;
                font-size: 0.65rem;
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                color: var(--text-dim);
                cursor: pointer;
            }
            
            .matrix-tab.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .matrix-info {
                font-size: 0.6rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            .matrix-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
                gap: 4px;
            }
            
            .matrix-cell {
                padding: var(--space-xs);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.6rem;
                text-align: center;
            }
            
            .matrix-cell-label {
                color: var(--text-secondary);
                margin-bottom: 2px;
            }
            
            .matrix-cell-value {
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            /* Learning Tab */
            .learning-section {
                margin-bottom: var(--space-md);
            }
            
            .learning-controls {
                display: flex;
                gap: var(--space-xs);
                margin-bottom: var(--space-sm);
            }
            
            .learning-btn {
                flex: 1;
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .learning-btn:hover:not(:disabled) {
                background: var(--accent-primary);
                color: white;
            }
            
            .learning-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .learning-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--space-xs);
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
                font-size: 0.55rem;
                color: var(--text-dim);
            }
            
            .eavesdrop-log {
                max-height: 200px;
                overflow-y: auto;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                padding: var(--space-xs);
            }
            
            .log-entry {
                padding: 2px var(--space-xs);
                font-size: 0.6rem;
                font-family: var(--font-mono);
                border-left: 2px solid transparent;
            }
            
            .log-entry.log-curiosity { border-left-color: var(--accent-primary); }
            .log-entry.log-question { border-left-color: var(--accent-secondary); }
            .log-entry.log-answer { border-left-color: var(--success); }
            
            /* Network Tab */
            .nodes-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .node-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
            }
            
            .node-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--text-dim);
            }
            
            .node-status.connected { background: var(--success); }
            .node-status.connecting { background: var(--warning); }
            
            .node-info {
                flex: 1;
            }
            
            .node-url {
                font-size: 0.7rem;
                font-family: var(--font-mono);
                color: var(--text-primary);
            }
            
            .node-meta {
                font-size: 0.6rem;
                color: var(--text-dim);
            }
            
            /* Introspection Modal */
            introspection-modal {
                z-index: 2000;
            }
            
            /* Responsive */
            @media (max-width: 1200px) {
                .right-panel {
                    width: 350px;
                }
            }
            
            @media (max-width: 1024px) {
                .left-sidebar {
                    width: 400px;
                }
                
                .bottom-panels {
                    flex-direction: column;
                    height: auto;
                }
                
                .bottom-panel {
                    min-height: 200px;
                }
                
                .bottom-panel + .bottom-panel {
                    border-left: none;
                    border-top: 1px solid var(--border-color);
                }
            }
            
            @media (max-width: 768px) {
                .right-panel { display: none; }
                .left-sidebar { width: 100%; max-width: none; }
            }
        `;
    }
    
    template() {
        const { leftSidebarVisible, rightPanelVisible, rightPanelTab, coherence, entropy, connected } = this._state;
        
        return `
            <div class="app-container">
                <!-- Header -->
                <header class="app-header">
                    <div class="header-left">
                        <div class="logo">
                            <span class="logo-icon">◈</span>
                            <div>
                                <span class="logo-text">SENTIENT</span>
                                <span class="logo-sub">PRSC/SMF · τ<sub>s</sub> · 7700 words</span>
                            </div>
                        </div>
                        
                        <div class="status-badges">
                            <span class="status-badge ${connected ? 'listening' : ''}">
                                <span class="status-dot ${connected ? 'active' : ''}"></span>
                                ${connected ? 'Listening' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="header-center">
                        <button class="tool-btn" title="Visualization">🌌</button>
                        <button class="tool-btn" title="Analytics">📊</button>
                        <span class="tool-divider"></span>
                        <button class="tool-btn" title="Zoom In">🔍+</button>
                        <button class="tool-btn" title="Zoom Out">🔍-</button>
                        <span class="tool-divider"></span>
                        <provider-selector></provider-selector>
                        <span class="tool-divider"></span>
                        <button class="tool-btn" id="toggleIntrospect" title="Introspect">🔮</button>
                        <button class="tool-btn" id="toggleRightPanel" title="Toggle Panel">☰</button>
                    </div>
                    
                    <div class="header-right">
                        <div class="metric-group">
                            <div class="metric">
                                <span class="metric-label">Active Primes</span>
                                <span class="metric-value" id="headerActivePrimes">--</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Entropy</span>
                                <span class="metric-value entropy" id="headerEntropy">0.00↓</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coherence</span>
                                <span class="metric-value coherence" id="headerCoherence">0.00</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Phrases</span>
                                <span class="metric-value phrases" id="headerPhrases">0~</span>
                            </div>
                        </div>
                    </div>
                </header>
                
                <!-- Main Layout -->
                <div class="main-layout">
                    <!-- Left Sidebar (Chat) -->
                    <aside class="left-sidebar ${leftSidebarVisible ? '' : 'collapsed'}" id="leftSidebar" style="width: ${this.leftSidebarWidth}px">
                        <div class="sidebar-header">
                            <div class="sidebar-controls">
                                <button class="mini-btn" title="Refresh">↻</button>
                                <button class="mini-btn" title="Settings">⚙</button>
                            </div>
                            <div class="voice-indicator">
                                <span>🎤</span>
                                <span>SILENT</span>
                            </div>
                        </div>
                        
                        <div class="tip-box">
                            <span class="tip-icon">💡</span>
                            <span>For best results, try the interactive tutorial to learn how Sentient works.</span>
                        </div>
                        
                        <div class="chat-area">
                            <sentient-chat id="chat"></sentient-chat>
                        </div>
                        
                        <div class="sidebar-stats">
                            <div class="stat-bar">
                                <div class="stat-bar-header">
                                    <span>System Energy</span>
                                    <span id="systemEnergy">0.00</span>
                                </div>
                                <div class="stat-bar-track">
                                    <div class="stat-bar-fill energy" id="energyBar" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="stat-bar">
                                <div class="stat-bar-header">
                                    <span>Coherence (Alignment)</span>
                                    <span id="sidebarCoherence">0.000</span>
                                </div>
                                <div class="stat-bar-track">
                                    <div class="stat-bar-fill coherence" id="coherenceBar" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="lang-selector">
                                <button class="lang-btn active">English</button>
                                <button class="lang-btn">✦ Enochian</button>
                            </div>
                        </div>
                    </aside>
                    
                    <div class="resizer ${leftSidebarVisible ? '' : 'hidden'}" id="leftResizer"></div>
                    
                    <!-- Center Content -->
                    <main class="center-content">
                        <!-- Main Visualization Panel -->
                        <div class="main-panel">
                            <!-- View Switcher -->
                            <div class="view-switcher">
                                <div class="view-tabs">
                                    <button class="view-tab ${this._state.mainView === 'sedenion' ? 'active' : ''}" data-view="sedenion">
                                        <span class="view-tab-icon">◈</span>
                                        <span>Field</span>
                                    </button>
                                    <button class="view-tab ${this._state.mainView === 'artifact' ? 'active' : ''}" data-view="artifact">
                                        <span class="view-tab-icon">◆</span>
                                        <span>Artifact</span>
                                    </button>
                                    <button class="view-tab ${this._state.mainView === 'camera' ? 'active' : ''}" data-view="camera">
                                        <span class="view-tab-icon">👁️</span>
                                        <span>Camera</span>
                                    </button>
                                </div>
                                <div class="view-actions">
                                    <button class="view-action-btn" id="refreshView" title="Refresh">↻</button>
                                    <button class="view-action-btn" id="expandView" title="Expand">⛶</button>
                                </div>
                            </div>
                            
                            <div class="main-panel-content">
                                <!-- Field Panel View (Sedenion 16D with interactive exploration) -->
                                <div class="view-content sedenion-view ${this._state.mainView === 'sedenion' ? 'active' : ''}" data-view="sedenion">
                                    <field-panel id="fieldPanel"></field-panel>
                                </div>
                                
                                <!-- Artifact Editor View -->
                                <div class="view-content artifact-view ${this._state.mainView === 'artifact' ? 'active' : ''}" data-view="artifact">
                                    <artifact-editor
                                        id="mainArtifact"
                                        title="AI Artifact"
                                        auto-run="true"
                                    ></artifact-editor>
                                </div>
                                
                                <!-- Camera View -->
                                <div class="view-content camera-view ${this._state.mainView === 'camera' ? 'active' : ''}" data-view="camera">
                                    <sight-camera id="mainCamera"></sight-camera>
                                </div>
                            </div>
                        </div>
                        <!-- Bottom Panels -->
                        <div class="bottom-panels">
                            <!-- Oscillators Panel -->
                            <div class="bottom-panel">
                                <div class="bottom-panel-header">
                                    <div class="bottom-panel-title">
                                        <span class="panel-icon">Λ:</span>
                                        <span class="panel-label" id="lambdaLabel">0.000 • TRANSITIONAL</span>
                                    </div>
                                    <span class="panel-status" id="oscStatus">SEEKING · H: 1.50</span>
                                </div>
                                <div class="bottom-panel-content">
                                    <div class="osc-container">
                                        <oscillator-visualizer id="bottomOsc"></oscillator-visualizer>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sedenion Detail Panel -->
                            <div class="bottom-panel">
                                <div class="bottom-panel-header">
                                    <div class="bottom-panel-title">
                                        <span class="panel-label">SEDENION (16D) + ENLIGHTENMENT</span>
                                    </div>
                                    <span class="panel-status">Energy: <span id="smfEnergy">0.00</span> · Coherence: <span id="smfCoherence">0%</span></span>
                                </div>
                                <div class="bottom-panel-content">
                                    <div class="sedenion-axes" id="sedenionAxes">
                                        <!-- Axes grid will be rendered here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                    
                    <div class="resizer ${rightPanelVisible ? '' : 'hidden'}" id="rightResizer"></div>
                    
                    <!-- Right Panel -->
                    <aside class="right-panel ${rightPanelVisible ? '' : 'collapsed'}" id="rightPanel" style="width: ${this.rightPanelWidth}px">
                        <div class="right-panel-tabs">
                            <button class="right-tab ${rightPanelTab === 'structure' ? 'active' : ''}" data-tab="structure">Structure</button>
                            <button class="right-tab ${rightPanelTab === 'learning' ? 'active' : ''}" data-tab="learning">Learning</button>
                            <button class="right-tab ${rightPanelTab === 'network' ? 'active' : ''}" data-tab="network">Network</button>
                            <button class="right-tab ${rightPanelTab === 'memory' ? 'active' : ''}" data-tab="memory">Memory</button>
                        </div>
                        
                        <div class="right-panel-content" id="rightPanelContent">
                            <!-- Structure Tab -->
                            <div class="tab-content ${rightPanelTab === 'structure' ? 'active' : ''}" data-tab="structure" style="height: 100%;">
                                <structure-panel id="structurePanel"></structure-panel>
                            </div>
                            
                            <!-- Learning Tab -->
                            <div class="tab-content ${rightPanelTab === 'learning' ? 'active' : ''}" data-tab="learning" style="height: 100%;">
                                <learning-panel id="learningPanel"></learning-panel>
                            </div>
                            
                            <!-- Network Tab -->
                            <div class="tab-content ${rightPanelTab === 'network' ? 'active' : ''}" data-tab="network" style="height: 100%;">
                                <network-panel id="networkPanel"></network-panel>
                            </div>
                            
                            <!-- Memory Tab -->
                            <div class="tab-content ${rightPanelTab === 'memory' ? 'active' : ''}" data-tab="memory" style="height: 100%;">
                                <memory-panel id="memoryPanel"></memory-panel>
                            </div>
                        </div>
                    </aside>
                </div>
                
                <introspection-modal id="introspectionModal"></introspection-modal>
            </div>
        `;
    }
    
    renderMatrixGrid() {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 67];
        const concepts = ['Rhythm', 'Time', 'Flow', 'Time', 'Limitation', 'Temporal Will', 'Bifurcation', 'temporal Orb'];
        
        return primes.slice(0, 8).map((p, i) => `
            <div class="matrix-cell">
                <div class="matrix-cell-label">${p}</div>
                <div class="matrix-cell-value">${concepts[i] || '--'}</div>
            </div>
        `).join('');
    }
    
    onMount() {
        // Get component references
        this.chat = this.$('#chat');
        this.modal = this.$('#introspectionModal');
        this.fieldPanel = this.$('#fieldPanel');
        this.mainArtifact = this.$('#mainArtifact');
        this.mainCamera = this.$('#mainCamera');
        this.bottomOsc = this.$('#bottomOsc');
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
        
        // Listen for artifact display events from chat
        this.addEventListener('show-artifact', (e) => {
            this.showArtifact(e.detail);
        });
    }
    
    onUnmount() {
        this.disconnectStreams();
        if (this.nodesInterval) {
            clearInterval(this.nodesInterval);
            this.nodesInterval = null;
        }
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
        
        // Main view switching
        const viewTabs = this.$$('.view-tab');
        viewTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const viewName = tab.dataset.view;
                this.switchMainView(viewName);
            });
        });
        
        // Tab switching (right panel)
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
        
        // Learning controls are now handled by learning-panel component
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
                    const newWidth = Math.max(350, Math.min(800, startWidth + delta));
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
                    const newWidth = Math.max(300, Math.min(600, startWidth + delta));
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
        
        // Field stream (500ms updates)
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
        if (this.learningStream) { this.learningStream.close(); this.learningStream = null; }
    }
    
    updateConnectionStatus() {
        const badge = this.$('.status-badge');
        const dot = this.$('.status-dot');
        if (badge) badge.classList.toggle('listening', this._state.connected);
        if (dot) dot.classList.toggle('active', this._state.connected);
    }
    
    handleStatusUpdate(data) {
        // Update header metrics
        const entropyEl = this.$('#headerEntropy');
        const coherenceEl = this.$('#headerCoherence');
        
        if (entropyEl && data.entropy !== undefined) {
            entropyEl.textContent = data.entropy.toFixed(2) + '↓';
        }
        if (coherenceEl && data.coherence !== undefined) {
            coherenceEl.textContent = data.coherence.toFixed(2);
        }
        
        // Update sidebar stats
        const sidebarCoh = this.$('#sidebarCoherence');
        const cohBar = this.$('#coherenceBar');
        if (sidebarCoh && data.coherence !== undefined) {
            sidebarCoh.textContent = data.coherence.toFixed(3);
        }
        if (cohBar && data.coherence !== undefined) {
            cohBar.style.width = `${data.coherence * 100}%`;
        }
    }
    
    handleFieldUpdate(data) {
        this.fieldHistory.push(data);
        if (this.fieldHistory.length > this.maxFieldHistory) {
            this.fieldHistory.shift();
        }
        
        // Update oscillator viz
        if (data.osc && this.bottomOsc) {
            this.bottomOsc.setData(data.osc.top, data.coherence);
            this.bottomOsc.setFieldHistory(this.fieldHistory);
        }
        
        // Update field panel viz
        if (data.smf && this.fieldPanel) {
            this.fieldPanel.setData(data.smf);
            this.fieldPanel.setFieldHistory(this.fieldHistory);
        }
        
        // Update lambda label
        if (data.lambda !== undefined) {
            const label = this.$('#lambdaLabel');
            const state = data.lambda < -0.1 ? 'COLLAPSED' : data.lambda > 0.1 ? 'EXPANDING' : 'TRANSITIONAL';
            if (label) label.textContent = `${data.lambda.toFixed(3)} • ${state}`;
        }
    }
    
    async loadInitialData() {
        try {
            const statusRes = await fetch('/status');
            if (statusRes.ok) {
                const status = await statusRes.json();
                this.handleStatusUpdate(status);
            }
            
            // Node polling is now handled by network-panel component
            // Learning stream is now handled by learning-panel component
        } catch (err) {
            console.warn('Failed to load initial data:', err);
        }
    }
    
    // Node fetching and updating is now handled by network-panel component
    
    // Learning controls, stats, and log are now handled by learning-panel component
    
    /**
     * Switch the main panel view
     */
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
    
    /**
     * Show artifact editor with optional content
     * Can be called from chat responses or tools
     */
    showArtifact(options = {}) {
        // Switch to artifact view
        this.switchMainView('artifact');
        
        // Set content if provided
        if (options.content && this.mainArtifact) {
            this.mainArtifact.setContent(options.content);
        }
        
        // Set title if provided
        if (options.title && this.mainArtifact) {
            this.mainArtifact.setAttribute('title', options.title);
        }
    }
    
    /**
     * Get the artifact editor content
     */
    getArtifactContent() {
        return this.mainArtifact?.getContent?.() || null;
    }
    
    /**
     * Get the combined HTML from artifact editor
     */
    getArtifactHTML() {
        return this.mainArtifact?.getCombinedHTML?.() || '';
    }
}

defineComponent('sentient-app', SentientApp);
                