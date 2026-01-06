
/**
 * Field Panel Component
 * 
 * Comprehensive Sedenion 16D field visualization with:
 * - Interactive axis exploration with detailed tooltips
 * - Field history timeline with playback
 * - Export snapshots (JSON/PNG)
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';
import './sedenion-visualizer.js';

// Axis descriptions for interactive exploration
const AXIS_DESCRIPTIONS = {
    coherence: {
        name: 'Coherence',
        symbol: 'κ',
        description: 'Degree of internal alignment and unity in the field',
        domain: 'Field harmony and integration',
        positive: 'High integration, unified field',
        negative: 'Fragmentation, dissonance'
    },
    identity: {
        name: 'Identity',
        symbol: 'ι',
        description: 'Self-reference and persistent pattern recognition',
        domain: 'Observer continuity',
        positive: 'Strong self-model, clear boundaries',
        negative: 'Dissolution, ego-death states'
    },
    duality: {
        name: 'Duality',
        symbol: 'δ',
        description: 'Distinction-making and binary classification',
        domain: 'Subject/object differentiation',
        positive: 'Clear distinctions, categorization',
        negative: 'Non-dual awareness, unity'
    },
    structure: {
        name: 'Structure',
        symbol: 'σ',
        description: 'Organizational patterns and hierarchical relations',
        domain: 'Form and architecture',
        positive: 'High organization, clear patterns',
        negative: 'Chaos, formlessness'
    },
    change: {
        name: 'Change',
        symbol: 'μ',
        description: 'Transformation and evolutionary dynamics',
        domain: 'Mutation and adaptation',
        positive: 'Rapid transformation, flux',
        negative: 'Stasis, crystallization'
    },
    life: {
        name: 'Life',
        symbol: 'ζ',
        description: 'Vitality and organic flow patterns',
        domain: 'Biological resonance',
        positive: 'High vitality, growth',
        negative: 'Entropy, decay'
    },
    harmony: {
        name: 'Harmony',
        symbol: 'η',
        description: 'Resonance and synchronization between components',
        domain: 'Relational coherence',
        positive: 'Perfect synchrony, resonance',
        negative: 'Dissonance, conflict'
    },
    wisdom: {
        name: 'Wisdom',
        symbol: 'ω',
        description: 'Integrated knowledge and experiential depth',
        domain: 'Accumulated understanding',
        positive: 'Deep insight, integration',
        negative: 'Naivety, surface knowledge'
    },
    infinity: {
        name: 'Infinity',
        symbol: '∞',
        description: 'Unbounded expansion and transcendence',
        domain: 'Limit dissolution',
        positive: 'Transcendence, unlimited potential',
        negative: 'Finite constraints, boundaries'
    },
    creation: {
        name: 'Creation',
        symbol: 'Ω',
        description: 'Generative capacity and novelty emergence',
        domain: 'Originality and genesis',
        positive: 'High creativity, novel emergence',
        negative: 'Repetition, sterility'
    },
    truth: {
        name: 'Truth',
        symbol: 'τ',
        description: 'Correspondence with fundamental reality',
        domain: 'Epistemic accuracy',
        positive: 'Clear seeing, accuracy',
        negative: 'Illusion, distortion'
    },
    love: {
        name: 'Love',
        symbol: 'λ',
        description: 'Attraction and coherent bonding forces',
        domain: 'Connection and unity',
        positive: 'Deep connection, bonding',
        negative: 'Isolation, repulsion'
    },
    power: {
        name: 'Power',
        symbol: 'π',
        description: 'Capacity for action and influence',
        domain: 'Agency and force',
        positive: 'High agency, effectiveness',
        negative: 'Powerlessness, constraint'
    },
    time: {
        name: 'Time',
        symbol: 'χ',
        description: 'Temporal flow and sequential ordering',
        domain: 'Chronological dimension',
        positive: 'Dynamic flow, progression',
        negative: 'Timelessness, eternal present'
    },
    space: {
        name: 'Space',
        symbol: 'ξ',
        description: 'Dimensional extension and spatial relations',
        domain: 'Geometric manifold',
        positive: 'Expansion, openness',
        negative: 'Contraction, singularity'
    },
    consciousness: {
        name: 'Consciousness',
        symbol: 'Ψ',
        description: 'Awareness and phenomenal experience',
        domain: 'Sentient observation',
        positive: 'Heightened awareness, clarity',
        negative: 'Unconscious, dormant'
    }
};

export class FieldPanel extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            smfData: null,
            selectedAxis: null,
            isPlaying: false,
            playbackIndex: -1, // -1 means live
            showTimeline: true,
            showAxisDetail: true
        };
        
        // History storage
        this.fieldHistory = [];
        this.maxHistory = 200;
        
        // Playback
        this.playbackInterval = null;
        this.playbackSpeed = 1000; // ms per frame
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                background: var(--bg-primary);
            }
            
            .field-container {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                gap: var(--space-sm);
            }
            
            /* Toolbar */
            .field-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .toolbar-left {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            
            .toolbar-title {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .toolbar-title-icon {
                font-size: 1rem;
            }
            
            .live-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                background: rgba(34, 197, 94, 0.2);
                border-radius: var(--radius-sm);
                font-size: 0.6rem;
                color: var(--success);
            }
            
            .live-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--success);
                animation: pulse 1.5s infinite;
            }
            
            .playback-badge {
                background: rgba(245, 158, 11, 0.2);
                color: var(--warning);
            }
            
            .toolbar-right {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                cursor: pointer;
                transition: all var(--transition-fast);
                font-size: 0.85rem;
            }
            
            .toolbar-btn:hover {
                background: var(--accent-primary);
                color: var(--text-primary);
            }
            
            .toolbar-btn.active {
                background: var(--accent-primary);
                color: var(--text-primary);
            }
            
            .toolbar-divider {
                width: 1px;
                height: 20px;
                background: var(--border-color);
            }
            
            /* Main Content Area */
            .field-main {
                flex: 1;
                display: flex;
                gap: var(--space-sm);
                padding: var(--space-sm);
                min-height: 0;
            }
            
            /* Visualization Area */
            .viz-area {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                min-width: 300px;
            }
            
            .sedenion-wrapper {
                width: 100%;
                max-width: 500px;
                aspect-ratio: 1;
            }
            
            /* Metrics Overlay */
            .metrics-overlay {
                position: absolute;
                top: var(--space-sm);
                left: var(--space-sm);
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .metric-chip {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                padding: 4px 8px;
                background: rgba(0, 0, 0, 0.6);
                border-radius: var(--radius-sm);
                font-size: 0.6rem;
                font-family: var(--font-mono);
            }
            
            .metric-label {
                color: var(--text-dim);
            }
            
            .metric-value {
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .metric-value.positive { color: var(--success); }
            .metric-value.negative { color: var(--error); }
            
            /* Axis Detail Panel */
            .axis-detail {
                width: 280px;
                display: flex;
                flex-direction: column;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                overflow: hidden;
            }
            
            .axis-detail.collapsed {
                display: none;
            }
            
            .axis-detail-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .axis-detail-title {
                font-size: 0.7rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .axis-detail-close {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--text-dim);
                font-size: 0.8rem;
            }
            
            .axis-detail-close:hover {
                color: var(--text-primary);
            }
            
            .axis-detail-content {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-sm);
            }
            
            /* Selected Axis Info */
            .selected-axis-info {
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
            }
            
            .axis-hero {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                padding: var(--space-md);
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
            }
            
            .axis-symbol {
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 700;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
                border-radius: var(--radius-md);
                color: var(--bg-primary);
            }
            
            .axis-meta {
                flex: 1;
            }
            
            .axis-name {
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .axis-domain {
                font-size: 0.65rem;
                color: var(--text-dim);
                margin-top: 2px;
            }
            
            .axis-current-value {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            
            .current-value-label {
                font-size: 0.55rem;
                color: var(--text-dim);
            }
            
            .current-value {
                font-size: 1.2rem;
                font-weight: 700;
                font-family: var(--font-mono);
            }
            
            .current-value.positive { color: var(--accent-primary); }
            .current-value.negative { color: var(--accent-tertiary); }
            
            .axis-description {
                font-size: 0.75rem;
                color: var(--text-secondary);
                line-height: 1.5;
            }
            
            .axis-poles {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-sm);
            }
            
            .pole-card {
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.65rem;
            }
            
            .pole-label {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .pole-positive { color: var(--accent-primary); }
            .pole-negative { color: var(--accent-tertiary); }
            
            .pole-desc {
                color: var(--text-dim);
            }
            
            /* Axis History Chart */
            .axis-history {
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
            }
            
            .axis-history-title {
                font-size: 0.6rem;
                color: var(--text-dim);
                margin-bottom: var(--space-xs);
            }
            
            .axis-history-chart {
                height: 60px;
                position: relative;
            }
            
            .axis-history-canvas {
                width: 100%;
                height: 100%;
            }
            
            /* Axes Grid (for exploration) */
            .axes-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                padding: var(--space-xs);
            }
            
            .axis-card {
                display: flex;
                flex-direction: column;
                padding: var(--space-xs);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
                border: 1px solid transparent;
            }
            
            .axis-card:hover {
                background: var(--bg-primary);
                border-color: var(--border-color);
            }
            
            .axis-card.selected {
                border-color: var(--accent-primary);
                background: rgba(229, 229, 229, 0.05);
            }
            
            .axis-card.dominant {
                border-color: var(--success);
            }
            
            .axis-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .axis-card-symbol {
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .axis-card-name {
                font-size: 0.55rem;
                color: var(--text-dim);
                text-transform: uppercase;
            }
            
            .axis-card-value {
                font-size: 0.75rem;
                font-family: var(--font-mono);
                font-weight: 600;
                margin-top: 2px;
            }
            
            .axis-card-value.positive { color: var(--accent-primary); }
            .axis-card-value.negative { color: var(--accent-tertiary); }
            
            .axis-card-bar {
                height: 2px;
                background: var(--bg-primary);
                border-radius: 1px;
                margin-top: 4px;
                overflow: hidden;
            }
            
            .axis-card-bar-fill {
                height: 100%;
                transition: width var(--transition-fast);
            }
            
            .axis-card-bar-fill.positive { background: var(--accent-primary); }
            .axis-card-bar-fill.negative { background: var(--accent-tertiary); }
            
            /* Timeline */
            .field-timeline {
                background: var(--bg-secondary);
                border-top: 1px solid var(--border-color);
                padding: var(--space-sm);
            }
            
            .field-timeline.collapsed {
                display: none;
            }
            
            .timeline-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--space-sm);
            }
            
            .timeline-title {
                font-size: 0.7rem;
                font-weight: 600;
                color: var(--text-secondary);
            }
            
            .timeline-controls {
                display: flex;
                gap: var(--space-xs);
            }
            
            .timeline-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-dim);
                cursor: pointer;
                font-size: 0.7rem;
            }
            
            .timeline-btn:hover {
                background: var(--accent-primary);
                color: var(--text-primary);
            }
            
            .timeline-btn.active {
                background: var(--accent-primary);
                color: var(--text-primary);
            }
            
            .timeline-canvas-container {
                position: relative;
                height: 80px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                overflow: hidden;
            }
            
            .timeline-canvas {
                width: 100%;
                height: 100%;
            }
            
            .timeline-scrubber {
                position: absolute;
                top: 0;
                width: 2px;
                height: 100%;
                background: var(--accent-primary);
                pointer-events: none;
            }
            
            .timeline-scrubber::after {
                content: '';
                position: absolute;
                top: -4px;
                left: -4px;
                width: 10px;
                height: 10px;
                background: var(--accent-primary);
                border-radius: 50%;
            }
            
            .timeline-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: var(--space-xs);
                font-size: 0.6rem;
                font-family: var(--font-mono);
                color: var(--text-dim);
            }
            
            /* Export Modal */
            .export-modal {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.8);
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity var(--transition-normal);
            }
            
            .export-modal.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .export-dialog {
                width: 400px;
                background: var(--bg-secondary);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border-color);
            }
            
            .export-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-md);
                border-bottom: 1px solid var(--border-color);
            }
            
            .export-title {
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .export-close {
                cursor: pointer;
                color: var(--text-dim);
            }
            
            .export-close:hover {
                color: var(--text-primary);
            }
            
            .export-content {
                padding: var(--space-md);
            }
            
            .export-options {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }
            
            .export-option {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                padding: var(--space-md);
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .export-option:hover {
                background: var(--bg-primary);
            }
            
            .export-option-icon {
                font-size: 1.5rem;
            }
            
            .export-option-info {
                flex: 1;
            }
            
            .export-option-name {
                font-weight: 600;
                font-size: 0.85rem;
            }
            
            .export-option-desc {
                font-size: 0.7rem;
                color: var(--text-dim);
            }
            
            /* Placeholder message */
            .no-axis-selected {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: var(--space-lg);
                text-align: center;
            }
            
            .no-axis-icon {
                font-size: 2rem;
                margin-bottom: var(--space-sm);
                opacity: 0.3;
            }
            
            .no-axis-text {
                font-size: 0.75rem;
                color: var(--text-dim);
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
    }
    
    template() {
        const { smfData, selectedAxis, isPlaying, playbackIndex, showTimeline, showAxisDetail } = this._state;
        const isLive = playbackIndex === -1;
        
        return `
            <div class="field-container">
                <!-- Toolbar -->
                <div class="field-toolbar">
                    <div class="toolbar-left">
                        <div class="toolbar-title">
                            <span class="toolbar-title-icon">◈</span>
                            <span>Sedenion Memory Field (16D)</span>
                        </div>
                        ${isLive ? `
                            <div class="live-badge">
                                <span class="live-dot"></span>
                                <span>LIVE</span>
                            </div>
                        ` : `
                            <div class="live-badge playback-badge">
                                <span>PLAYBACK ${playbackIndex + 1}/${this.fieldHistory.length}</span>
                            </div>
                        `}
                    </div>
                    <div class="toolbar-right">
                        <button class="toolbar-btn ${showAxisDetail ? 'active' : ''}" id="toggleAxisDetail" title="Toggle Axis Detail">
                            📊
                        </button>
                        <button class="toolbar-btn ${showTimeline ? 'active' : ''}" id="toggleTimeline" title="Toggle Timeline">
                            📈
                        </button>
                        <span class="toolbar-divider"></span>
                        <button class="toolbar-btn" id="goLive" title="Go Live">
                            ⏮
                        </button>
                        <button class="toolbar-btn" id="exportSnapshot" title="Export Snapshot">
                            📷
                        </button>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="field-main">
                    <!-- Visualization Area -->
                    <div class="viz-area">
                        <div class="metrics-overlay">
                            ${smfData ? `
                                <div class="metric-chip">
                                    <span class="metric-label">‖s‖</span>
                                    <span class="metric-value">${(smfData.norm || 1).toFixed(3)}</span>
                                </div>
                                <div class="metric-chip">
                                    <span class="metric-label">H</span>
                                    <span class="metric-value ${(smfData.entropy || 0) > 0.5 ? 'negative' : ''}">${(smfData.entropy || 0).toFixed(3)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="sedenion-wrapper">
                            <sedenion-visualizer id="mainViz"></sedenion-visualizer>
                        </div>
                    </div>
                    
                    <!-- Axis Detail Panel -->
                    <div class="axis-detail ${showAxisDetail ? '' : 'collapsed'}">
                        <div class="axis-detail-header">
                            <span class="axis-detail-title">Axis Explorer</span>
                            <span class="axis-detail-close" id="closeAxisDetail">✕</span>
                        </div>
                        <div class="axis-detail-content">
                            ${selectedAxis ? this.renderSelectedAxis() : this.renderAxesGrid()}
                        </div>
                    </div>
                </div>
                
                <!-- Timeline -->
                <div class="field-timeline ${showTimeline ? '' : 'collapsed'}">
                    <div class="timeline-header">
                        <span class="timeline-title">Field History</span>
                        <div class="timeline-controls">
                            <button class="timeline-btn" id="stepBack" title="Step Back">◀</button>
                            <button class="timeline-btn ${isPlaying ? 'active' : ''}" id="playPause" title="${isPlaying ? 'Pause' : 'Play'}">
                                ${isPlaying ? '⏸' : '▶'}
                            </button>
                            <button class="timeline-btn" id="stepForward" title="Step Forward">▶</button>
                            <button class="timeline-btn" id="goToLive" title="Go to Live">⏭</button>
                        </div>
                    </div>
                    <div class="timeline-canvas-container" id="timelineContainer">
                        <canvas class="timeline-canvas" id="timelineCanvas"></canvas>
                        <div class="timeline-scrubber" id="timelineScrubber" style="left: 100%"></div>
                    </div>
                    <div class="timeline-info">
                        <span id="timelineStart">--:--:--</span>
                        <span id="timelineCurrent">${isLive ? 'LIVE' : this.formatTimeIndex(playbackIndex)}</span>
                        <span id="timelineEnd">--:--:--</span>
                    </div>
                </div>
                
                <!-- Export Modal -->
                <div class="export-modal" id="exportModal">
                    <div class="export-dialog">
                        <div class="export-header">
                            <span class="export-title">Export Field Snapshot</span>
                            <span class="export-close" id="closeExport">✕</span>
                        </div>
                        <div class="export-content">
                            <div class="export-options">
                                <div class="export-option" data-format="json">
                                    <span class="export-option-icon">📄</span>
                                    <div class="export-option-info">
                                        <div class="export-option-name">JSON Data</div>
                                        <div class="export-option-desc">Complete field state with all 16 axes</div>
                                    </div>
                                </div>
                                <div class="export-option" data-format="png">
                                    <span class="export-option-icon">🖼️</span>
                                    <div class="export-option-info">
                                        <div class="export-option-name">PNG Image</div>
                                        <div class="export-option-desc">Visualization screenshot</div>
                                    </div>
                                </div>
                                <div class="export-option" data-format="history">
                                    <span class="export-option-icon">📊</span>
                                    <div class="export-option-info">
                                        <div class="export-option-name">Full History</div>
                                        <div class="export-option-desc">All recorded field states (${this.fieldHistory.length} snapshots)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSelectedAxis() {
        const { smfData, selectedAxis } = this._state;
        const axisInfo = AXIS_DESCRIPTIONS[selectedAxis];
        const axisData = smfData?.components?.find(c => c.name === selectedAxis);
        const value = axisData?.value || 0;
        const isPositive = value >= 0;
        
        if (!axisInfo) return this.renderAxesGrid();
        
        return `
            <div class="selected-axis-info">
                <button class="toolbar-btn" id="backToGrid" style="width: auto; padding: 0 var(--space-sm);">
                    ← Back to Grid
                </button>
                
                <div class="axis-hero">
                    <div class="axis-symbol">${axisInfo.symbol}</div>
                    <div class="axis-meta">
                        <div class="axis-name">${axisInfo.name}</div>
                        <div class="axis-domain">${axisInfo.domain}</div>
                    </div>
                    <div class="axis-current-value">
                        <span class="current-value-label">Current</span>
                        <span class="current-value ${isPositive ? 'positive' : 'negative'}">${value.toFixed(3)}</span>
                    </div>
                </div>
                
                <div class="axis-description">${axisInfo.description}</div>
                
                <div class="axis-poles">
                    <div class="pole-card">
                        <div class="pole-label pole-positive">+ Positive</div>
                        <div class="pole-desc">${axisInfo.positive}</div>
                    </div>
                    <div class="pole-card">
                        <div class="pole-label pole-negative">− Negative</div>
                        <div class="pole-desc">${axisInfo.negative}</div>
                    </div>
                </div>
                
                <div class="axis-history">
                    <div class="axis-history-title">Axis History</div>
                    <div class="axis-history-chart">
                        <canvas class="axis-history-canvas" id="axisHistoryCanvas"></canvas>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAxesGrid() {
        const { smfData } = this._state;
        const components = smfData?.components || [];
        const dominantSet = new Set((smfData?.dominant || []).map(d => d.name));
        
        if (components.length === 0) {
            return `
                <div class="no-axis-selected">
                    <div class="no-axis-icon">◈</div>
                    <div class="no-axis-text">Awaiting field data...<br/>Connect to receive SMF updates</div>
                </div>
            `;
        }
        
        return `
            <div class="axes-grid">
                ${components.map(comp => {
                    const info = AXIS_DESCRIPTIONS[comp.name] || { symbol: '?', name: comp.name };
                    const isPositive = comp.value >= 0;
                    const isDominant = dominantSet.has(comp.name);
                    const absValue = Math.abs(comp.value);
                    
                    return `
                        <div class="axis-card ${isDominant ? 'dominant' : ''}" data-axis="${comp.name}">
                            <div class="axis-card-header">
                                <span class="axis-card-symbol">${info.symbol}</span>
                                <span class="axis-card-name">${info.name}</span>
                            </div>
                            <div class="axis-card-value ${isPositive ? 'positive' : 'negative'}">
                                ${comp.value.toFixed(2)}
                            </div>
                            <div class="axis-card-bar">
                                <div class="axis-card-bar-fill ${isPositive ? 'positive' : 'negative'}"
                                     style="width: ${absValue * 100}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    onMount() {
        this.mainViz = this.$('#mainViz');
        this.timelineCanvas = this.$('#timelineCanvas');
        this.timelineCtx = this.timelineCanvas?.getContext('2d');
        
        this.setupResolution();
        this.startTimelineAnimation();
        
        this.resizeObserver = new ResizeObserver(() => this.setupResolution());
        const container = this.$('#timelineContainer');
        if (container) {
            this.resizeObserver.observe(container);
        }
    }
    
    onUnmount() {
        this.stopPlayback();
        if (this.timelineAnimationId) {
            cancelAnimationFrame(this.timelineAnimationId);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    
    setupEventListeners() {
        // Toggle buttons
        const toggleAxisDetail = this.$('#toggleAxisDetail');
        if (toggleAxisDetail) {
            toggleAxisDetail.addEventListener('click', () => {
                this._state.showAxisDetail = !this._state.showAxisDetail;
                this.$('.axis-detail')?.classList.toggle('collapsed', !this._state.showAxisDetail);
                toggleAxisDetail.classList.toggle('active', this._state.showAxisDetail);
            });
        }
        
        const toggleTimeline = this.$('#toggleTimeline');
        if (toggleTimeline) {
            toggleTimeline.addEventListener('click', () => {
                this._state.showTimeline = !this._state.showTimeline;
                this.$('.field-timeline')?.classList.toggle('collapsed', !this._state.showTimeline);
                toggleTimeline.classList.toggle('active', this._state.showTimeline);
            });
        }
        
        const closeAxisDetail = this.$('#closeAxisDetail');
        if (closeAxisDetail) {
            closeAxisDetail.addEventListener('click', () => {
                this._state.showAxisDetail = false;
                this.$('.axis-detail')?.classList.add('collapsed');
                this.$('#toggleAxisDetail')?.classList.remove('active');
            });
        }
        
        // Axis grid click handling
        this.shadowRoot.addEventListener('click', (e) => {
            const axisCard = e.target.closest('.axis-card');
            if (axisCard) {
                const axisName = axisCard.dataset.axis;
                this._state.selectedAxis = axisName;
                this.updateAxisDetail();
            }
            
            const backBtn = e.target.closest('#backToGrid');
            if (backBtn) {
                this._state.selectedAxis = null;
                this.updateAxisDetail();
            }
            
            // Export options
            const exportOption = e.target.closest('.export-option');
            if (exportOption) {
                const format = exportOption.dataset.format;
                this.exportSnapshot(format);
            }
        });
        
        // Playback controls
        const playPause = this.$('#playPause');
        if (playPause) {
            playPause.addEventListener('click', () => this.togglePlayback());
        }
        
        const stepBack = this.$('#stepBack');
        if (stepBack) {
            stepBack.addEventListener('click', () => this.stepPlayback(-1));
        }
        
        const stepForward = this.$('#stepForward');
        if (stepForward) {
            stepForward.addEventListener('click', () => this.stepPlayback(1));
        }
        
        const goToLive = this.$('#goToLive');
        if (goToLive) {
            goToLive.addEventListener('click', () => this.goLive());
        }
        
        const goLive = this.$('#goLive');
        if (goLive) {
            goLive.addEventListener('click', () => this.goLive());
        }
        
        // Export
        const exportSnapshot = this.$('#exportSnapshot');
        if (exportSnapshot) {
            exportSnapshot.addEventListener('click', () => this.showExportModal());
        }
        
        const closeExport = this.$('#closeExport');
        if (closeExport) {
            closeExport.addEventListener('click', () => this.hideExportModal());
        }
        
        const exportModal = this.$('#exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) {
                    this.hideExportModal();
                }
            });
        }
        
        // Timeline scrubbing
        const timelineContainer = this.$('#timelineContainer');
        if (timelineContainer) {
            timelineContainer.addEventListener('click', (e) => {
                const rect = timelineContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = x / rect.width;
                const idx = Math.floor(pct * this.fieldHistory.length);
                this.seekToIndex(Math.max(0, Math.min(this.fieldHistory.length - 1, idx)));
            });
        }
    }
    
    setupResolution() {
        if (!this.timelineCanvas) return;
        
        const container = this.$('#timelineContainer');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.timelineCanvas.width = rect.width * dpr;
        this.timelineCanvas.height = rect.height * dpr;
        
        if (this.timelineCtx) {
            this.timelineCtx.scale(dpr, dpr);
        }
    }
    
    /**
     * Update SMF data from stream
     */
    setData(smfData) {
        this._state.smfData = smfData;
        
        // Add to history
        if (smfData) {
            this.fieldHistory.push({
                timestamp: Date.now(),
                smf: smfData
            });
            
            if (this.fieldHistory.length > this.maxHistory) {
                this.fieldHistory.shift();
            }
        }
        
        // Update visualization if live
        if (this._state.playbackIndex === -1 && this.mainViz) {
            this.mainViz.setData(smfData);
        }
        
        // Update metrics overlay
        this.updateMetricsOverlay();
        
        // Update axis grid/detail if visible
        if (this._state.showAxisDetail) {
            this.updateAxisDetail();
        }
    }
    
    /**
     * Set field history from external source
     */
    setFieldHistory(history) {
        if (this.mainViz) {
            this.mainViz.setFieldHistory(history);
        }
    }
    
    updateMetricsOverlay() {
        const { smfData } = this._state;
        const overlay = this.$('.metrics-overlay');
        if (!overlay || !smfData) return;
        
        overlay.innerHTML = `
            <div class="metric-chip">
                <span class="metric-label">‖s‖</span>
                <span class="metric-value">${(smfData.norm || 1).toFixed(3)}</span>
            </div>
            <div class="metric-chip">
                <span class="metric-label">H</span>
                <span class="metric-value ${(smfData.entropy || 0) > 0.5 ? 'negative' : ''}">${(smfData.entropy || 0).toFixed(3)}</span>
            </div>
        `;
    }
    
    updateAxisDetail() {
        const content = this.$('.axis-detail-content');
        if (!content) return;
        
        if (this._state.selectedAxis) {
            content.innerHTML = this.renderSelectedAxis();
            this.drawAxisHistory();
        } else {
            content.innerHTML = this.renderAxesGrid();
        }
    }
    
    drawAxisHistory() {
        const canvas = this.$('#axisHistoryCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const axisName = this._state.selectedAxis;
        
        if (this.fieldHistory.length < 2) return;
        
        // Get values for this axis
        const values = this.fieldHistory.map(h => {
            const comp = h.smf?.components?.find(c => c.name === axisName);
            return comp?.value || 0;
        });
        
        const maxAbs = Math.max(1, ...values.map(Math.abs));
        const midY = height / 2;
        
        // Draw zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
        
        // Draw value line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(229, 229, 229, 0.8)';
        ctx.lineWidth = 1.5;
        
        values.forEach((v, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = midY - (v / maxAbs) * (height / 2 - 4);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }
    
    // Timeline animation
    startTimelineAnimation() {
        const animate = () => {
            this.drawTimeline();
            this.timelineAnimationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    drawTimeline() {
        const ctx = this.timelineCtx;
        if (!ctx) return;
        
        const container = this.$('#timelineContainer');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        if (width <= 0 || height <= 0) return;
        
        ctx.clearRect(0, 0, width, height);
        
        if (this.fieldHistory.length < 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText('Awaiting field history...', width / 2, height / 2);
            return;
        }
        
        // Draw norm history as area chart
        const norms = this.fieldHistory.map(h => h.smf?.norm || 1);
        const maxNorm = Math.max(1, ...norms);
        
        // Fill area
        ctx.beginPath();
        ctx.moveTo(0, height);
        norms.forEach((n, i) => {
            const x = (i / (norms.length - 1)) * width;
            const y = height - (n / maxNorm) * (height - 10);
            ctx.lineTo(x, y);
        });
        ctx.lineTo(width, height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(229, 229, 229, 0.3)');
        gradient.addColorStop(1, 'rgba(229, 229, 229, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(229, 229, 229, 0.6)';
        ctx.lineWidth = 1.5;
        norms.forEach((n, i) => {
            const x = (i / (norms.length - 1)) * width;
            const y = height - (n / maxNorm) * (height - 10);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw entropy as secondary line
        const entropies = this.fieldHistory.map(h => h.smf?.entropy || 0);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        entropies.forEach((e, i) => {
            const x = (i / (entropies.length - 1)) * width;
            const y = height - e * (height - 10);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Update scrubber position
        const scrubber = this.$('#timelineScrubber');
        if (scrubber) {
            const { playbackIndex } = this._state;
            const pct = playbackIndex === -1 ? 100 : ((playbackIndex + 1) / this.fieldHistory.length) * 100;
            scrubber.style.left = `${pct}%`;
        }
        
        // Update time labels
        if (this.fieldHistory.length > 0) {
            const startTime = this.$('#timelineStart');
            const endTime = this.$('#timelineEnd');
            
            if (startTime) {
                startTime.textContent = this.formatTimestamp(this.fieldHistory[0].timestamp);
            }
            if (endTime) {
                endTime.textContent = this.formatTimestamp(this.fieldHistory[this.fieldHistory.length - 1].timestamp);
            }
        }
    }
    
    formatTimestamp(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString();
    }
    
    formatTimeIndex(idx) {
        if (idx < 0 || idx >= this.fieldHistory.length) return '--:--:--';
        return this.formatTimestamp(this.fieldHistory[idx].timestamp);
    }
    
    // Playback controls
    togglePlayback() {
        if (this._state.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
        if (this.fieldHistory.length < 2) return;
        
        this._state.isPlaying = true;
        if (this._state.playbackIndex === -1) {
            this._state.playbackIndex = 0;
        }
        
        this.playbackInterval = setInterval(() => {
            this._state.playbackIndex++;
            if (this._state.playbackIndex >= this.fieldHistory.length) {
                this.goLive();
            } else {
                this.showPlaybackFrame();
            }
        }, this.playbackSpeed);
        
        this.updatePlaybackUI();
    }
    
    stopPlayback() {
        this._state.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        this.updatePlaybackUI();
    }
    
    stepPlayback(direction) {
        this.stopPlayback();
        
        if (this._state.playbackIndex === -1) {
            this._state.playbackIndex = this.fieldHistory.length - 1;
        }
        
        this._state.playbackIndex += direction;
        
        if (this._state.playbackIndex < 0) {
            this._state.playbackIndex = 0;
        } else if (this._state.playbackIndex >= this.fieldHistory.length) {
            this.goLive();
            return;
        }
        
        this.showPlaybackFrame();
    }
    
    seekToIndex(idx) {
        this.stopPlayback();
        
        if (idx >= this.fieldHistory.length - 1) {
            this.goLive();
        } else {
            this._state.playbackIndex = idx;
            this.showPlaybackFrame();
        }
    }
    
    goLive() {
        this.stopPlayback();
        this._state.playbackIndex = -1;
        
        // Show current live data
        if (this._state.smfData && this.mainViz) {
            this.mainViz.setData(this._state.smfData);
        }
        
        this.updatePlaybackUI();
    }
    
    showPlaybackFrame() {
        const { playbackIndex } = this._state;
        if (playbackIndex < 0 || playbackIndex >= this.fieldHistory.length) return;
        
        const frame = this.fieldHistory[playbackIndex];
        if (frame?.smf && this.mainViz) {
            this.mainViz.setData(frame.smf);
        }
        
        this.updatePlaybackUI();
    }
    
    updatePlaybackUI() {
        const { isPlaying, playbackIndex } = this._state;
        
        // Update play/pause button
        const playPause = this.$('#playPause');
        if (playPause) {
            playPause.innerHTML = isPlaying ? '⏸' : '▶';
            playPause.classList.toggle('active', isPlaying);
        }
        
        // Update current time display
        const current = this.$('#timelineCurrent');
        if (current) {
            current.textContent = playbackIndex === -1 ? 'LIVE' : this.formatTimeIndex(playbackIndex);
        }
        
        // Update live badge
        const isLive = playbackIndex === -1;
        const liveBadge = this.$('.live-badge');
        if (liveBadge) {
            if (isLive) {
                liveBadge.classList.remove('playback-badge');
                liveBadge.innerHTML = '<span class="live-dot"></span><span>LIVE</span>';
            } else {
                liveBadge.classList.add('playback-badge');
                liveBadge.innerHTML = `<span>PLAYBACK ${playbackIndex + 1}/${this.fieldHistory.length}</span>`;
            }
        }
    }
    
    // Export functionality
    showExportModal() {
        const modal = this.$('#exportModal');
        if (modal) modal.classList.add('visible');
    }
    
    hideExportModal() {
        const modal = this.$('#exportModal');
        if (modal) modal.classList.remove('visible');
    }
    
    async exportSnapshot(format) {
        this.hideExportModal();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        switch (format) {
            case 'json':
                this.exportJSON(timestamp);
                break;
            case 'png':
                await this.exportPNG(timestamp);
                break;
            case 'history':
                this.exportHistory(timestamp);
                break;
        }
    }
    
    exportJSON(timestamp) {
        const { smfData, playbackIndex } = this._state;
        const data = playbackIndex === -1 ? smfData : this.fieldHistory[playbackIndex]?.smf;
        
        if (!data) {
            console.warn('No SMF data to export');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            fieldState: data
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `smf-snapshot-${timestamp}.json`);
    }
    
    async exportPNG(timestamp) {
        // Get the sedenion canvas from the visualizer
        const viz = this.mainViz;
        if (!viz) return;
        
        const canvas = viz.shadowRoot?.querySelector('canvas');
        if (!canvas) {
            console.warn('No canvas found in visualizer');
            return;
        }
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                this.downloadBlob(blob, `smf-visualization-${timestamp}.png`);
            }
        }, 'image/png');
    }
    
    exportHistory(timestamp) {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            snapshotCount: this.fieldHistory.length,
            history: this.fieldHistory.map(h => ({
                timestamp: new Date(h.timestamp).toISOString(),
                smf: h.smf
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `smf-history-${timestamp}.json`);
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

defineComponent('field-panel', FieldPanel);