/**
 * Introspection Modal Component
 * 
 * Modal overlay showing detailed introspection data:
 * - Identity
 * - SMF Orientation
 * - Metacognition
 * - Current moment
 * - Attention foci
 * - Goals
 * - Recent moments
 * - Safety report
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class IntrospectionModal extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            visible: false,
            data: null,
            loading: false,
            error: null
        };
    }
    
    static get observedAttributes() {
        return ['visible'];
    }
    
    onAttributeChange(name, oldValue, newValue) {
        if (name === 'visible') {
            this._state.visible = newValue !== null;
            if (this._state.visible) {
                this.loadData();
            }
        }
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 2000;
                display: none;
            }
            
            :host([visible]) {
                display: block;
            }
            
            .overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--space-lg);
                animation: fadeIn var(--transition-fast);
            }
            
            .modal {
                width: 100%;
                max-width: 800px;
                max-height: 90vh;
                background: var(--bg-panel);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: slideIn var(--transition-normal);
            }
            
            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-md) var(--space-lg);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .modal-title {
                font-size: 1.1rem;
                font-weight: 600;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .close-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: var(--radius-md);
                color: var(--text-secondary);
                transition: all var(--transition-fast);
            }
            
            .close-btn:hover {
                background: var(--error);
                color: white;
            }
            
            .modal-content {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-lg);
            }
            
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-md);
                padding: var(--space-xl);
                color: var(--text-secondary);
            }
            
            .loading-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid var(--border-color);
                border-top-color: var(--accent-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .error {
                padding: var(--space-lg);
                text-align: center;
                color: var(--error);
            }
            
            /* Section styles */
            .introspect-section {
                margin-bottom: var(--space-md);
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                overflow: hidden;
            }
            
            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) var(--space-md);
                background: rgba(99, 102, 241, 0.1);
                cursor: pointer;
                user-select: none;
                transition: background var(--transition-fast);
            }
            
            .section-header:hover {
                background: rgba(99, 102, 241, 0.15);
            }
            
            .section-header h4 {
                margin: 0;
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .section-toggle {
                width: 16px;
                height: 16px;
                color: var(--text-secondary);
                transition: transform var(--transition-fast);
            }
            
            .introspect-section.collapsed .section-toggle {
                transform: rotate(-90deg);
            }
            
            .section-content {
                padding: var(--space-md);
                max-height: 500px;
                overflow: hidden;
                transition: max-height var(--transition-normal), padding var(--transition-normal);
            }
            
            .introspect-section.collapsed .section-content {
                max-height: 0;
                padding-top: 0;
                padding-bottom: 0;
            }
            
            /* Stats grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: var(--space-md);
            }
            
            .stat-item {
                text-align: center;
                padding: var(--space-md);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
            }
            
            .stat-value {
                font-size: 1.2rem;
                font-weight: 700;
                color: var(--accent-primary);
                font-family: var(--font-mono);
            }
            
            .stat-label {
                font-size: 0.7rem;
                color: var(--text-dim);
                margin-top: var(--space-xs);
            }
            
            /* JSON display */
            .json-display {
                background: var(--bg-primary);
                padding: var(--space-md);
                border-radius: var(--radius-sm);
                font-family: var(--font-mono);
                font-size: 0.75rem;
                color: var(--text-secondary);
                overflow-x: auto;
                white-space: pre-wrap;
                word-break: break-word;
                max-height: 200px;
                overflow-y: auto;
            }
            
            /* Axes display */
            .axes-list {
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-sm);
            }
            
            .axis-item {
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
            }
            
            .axis-name {
                font-weight: 600;
                color: var(--accent-primary);
            }
            
            .axis-value {
                color: var(--text-secondary);
                margin-left: var(--space-xs);
            }
        `;
    }
    
    template() {
        const { visible, data, loading, error } = this._state;
        
        return `
            <div class="overlay" id="overlay">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">◈ Introspection</div>
                        <button class="close-btn" id="closeBtn" title="Close (Esc)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-content" id="content">
                        ${loading ? this.renderLoading() : 
                          error ? this.renderError(error) :
                          data ? this.renderData(data) : this.renderLoading()}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderLoading() {
        return `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Loading introspection data...</span>
            </div>
        `;
    }
    
    renderError(error) {
        return `
            <div class="error">
                <p>Error loading introspection: ${this.escapeHtml(error)}</p>
            </div>
        `;
    }
    
    renderData(data) {
        const sections = [
            { key: 'identity', title: '🪪 Identity', data: data.identity },
            { key: 'smfOrientation', title: '◈ SMF Orientation', data: data.smfOrientation },
            { key: 'metacognition', title: '🧠 Metacognition', data: data.metacognition },
            { key: 'currentMoment', title: '◉ Current Moment', data: data.currentMoment },
            { key: 'attention', title: '🎯 Attention Foci', data: data.attention },
            { key: 'goals', title: '🎯 Active Goals', data: data.goals },
            { key: 'recentMoments', title: '📍 Recent Moments', data: data.recentMoments },
            { key: 'safetyReport', title: '🛡️ Safety Report', data: data.safetyReport }
        ];
        
        return sections.map(section => `
            <div class="introspect-section" data-section="${section.key}">
                <div class="section-header" onclick="this.parentElement.classList.toggle('collapsed')">
                    <h4>${section.title}</h4>
                    <svg class="section-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
                <div class="section-content">
                    ${this.renderSectionData(section.key, section.data)}
                </div>
            </div>
        `).join('');
    }
    
    renderSectionData(key, data) {
        if (!data) return '<span class="text-dim">No data</span>';
        
        switch (key) {
            case 'identity':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${data.name || 'Observer'}</div>
                            <div class="stat-label">Name</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${data.continuityMarkers?.length || 0}</div>
                            <div class="stat-label">Continuity Markers</div>
                        </div>
                    </div>
                `;
            
            case 'metacognition':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${((data.processingLoad || 0) * 100).toFixed(0)}%</div>
                            <div class="stat-label">Processing Load</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${(data.emotionalValence || 0).toFixed(2)}</div>
                            <div class="stat-label">Emotional Valence</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${((data.confidenceLevel || 0) * 100).toFixed(0)}%</div>
                            <div class="stat-label">Confidence</div>
                        </div>
                    </div>
                `;
            
            case 'smfOrientation':
                let axesHtml = '';
                if (data.dominantAxes) {
                    if (Array.isArray(data.dominantAxes)) {
                        axesHtml = '<div class="axes-list">' + data.dominantAxes.map(axis => `
                            <div class="axis-item">
                                <span class="axis-name">${typeof axis === 'object' ? (axis.name || JSON.stringify(axis)) : axis}</span>
                            </div>
                        `).join('') + '</div>';
                    } else if (typeof data.dominantAxes === 'object') {
                        axesHtml = '<div class="axes-list">' + Object.entries(data.dominantAxes).slice(0, 5).map(([k, v]) => `
                            <div class="axis-item">
                                <span class="axis-name">${k}</span>
                                <span class="axis-value">${typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                            </div>
                        `).join('') + '</div>';
                    }
                }
                
                return `
                    ${axesHtml || '<div class="stat-item"><div class="stat-value">--</div><div class="stat-label">No dominant axes</div></div>'}
                    ${data.components ? `<div class="json-display">${JSON.stringify(Array.isArray(data.components) ? data.components.slice(0, 8) : data.components, null, 2)}...</div>` : ''}
                `;
            
            default:
                return `<div class="json-display">${JSON.stringify(data, null, 2)}</div>`;
        }
    }
    
    setupEventListeners() {
        const overlay = this.$('#overlay');
        const closeBtn = this.$('#closeBtn');
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hide();
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._state.visible) {
                this.hide();
            }
        });
    }
    
    /**
     * Show modal
     */
    show() {
        this.setAttribute('visible', '');
        this._state.visible = true;
        this.loadData();
    }
    
    /**
     * Hide modal
     */
    hide() {
        this.removeAttribute('visible');
        this._state.visible = false;
        this.emit('modal-close');
    }
    
    /**
     * Toggle visibility
     */
    toggle() {
        if (this._state.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Load introspection data
     */
    async loadData() {
        this._state.loading = true;
        this._state.error = null;
        this.render();
        
        try {
            const response = await fetch('/introspect');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this._state.data = await response.json();
            this._state.loading = false;
            this.render();
        } catch (err) {
            this._state.loading = false;
            this._state.error = err.message;
            this.render();
        }
    }
}

defineComponent('introspection-modal', IntrospectionModal);