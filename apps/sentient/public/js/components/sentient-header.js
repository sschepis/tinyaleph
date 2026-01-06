/**
 * Sentient Header Component
 * 
 * Displays the application header with:
 * - Logo and title
 * - Connection status indicator
 * - Key metrics (coherence, entropy, λ, oscillators, moments)
 * - Action buttons
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class SentientHeader extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            connected: false,
            coherence: 0,
            entropy: 0,
            lambda: 0,
            oscillatorCount: 0,
            momentCount: 0,
            subjectiveTime: 0
        };
    }
    
    static get observedAttributes() {
        return ['title', 'subtitle'];
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 100%;
            }
            
            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-md) var(--space-lg);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
                flex-wrap: wrap;
                gap: var(--space-md);
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
                font-size: 1.5rem;
            }
            
            .logo-text {
                display: flex;
                flex-direction: column;
            }
            
            .logo-title {
                font-size: 1rem;
                font-weight: 600;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .logo-subtitle {
                font-size: 0.65rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .status {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.7rem;
                font-family: var(--font-mono);
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--error);
                transition: background var(--transition-normal);
            }
            
            .status-dot.connected {
                background: var(--success);
                box-shadow: 0 0 8px var(--success);
            }
            
            .status-text {
                color: var(--text-secondary);
            }
            
            .stats-strip {
                display: flex;
                align-items: center;
                gap: var(--space-lg);
                flex-wrap: wrap;
            }
            
            .stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
            }
            
            .stat-value {
                font-size: 0.85rem;
                font-weight: 600;
                font-family: var(--font-mono);
                color: var(--text-primary);
            }
            
            .stat-value.coherence-high { color: var(--success); }
            .stat-value.coherence-medium { color: var(--warning); }
            .stat-value.coherence-low { color: var(--error); }
            
            .stat-label {
                font-size: 0.6rem;
                color: var(--text-dim);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .header-right {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            
            .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: var(--radius-md);
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
                transition: all var(--transition-fast);
                cursor: pointer;
            }
            
            .action-btn:hover {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-primary);
            }
            
            .action-btn.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .action-btn svg {
                width: 18px;
                height: 18px;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .stats-strip {
                    order: 3;
                    width: 100%;
                    justify-content: space-around;
                }
                
                .stat {
                    flex: 1;
                    min-width: 60px;
                }
            }
        `;
    }
    
    template() {
        const { connected, coherence, entropy, lambda, oscillatorCount, momentCount, subjectiveTime } = this._state;
        const title = this.getAttr('title', 'Sentient Observer');
        const subtitle = this.getAttr('subtitle', 'Prime Resonance Consciousness');
        
        const coherenceClass = coherence > 0.7 ? 'coherence-high' : 
                               coherence > 0.4 ? 'coherence-medium' : 'coherence-low';
        
        return `
            <header class="header">
                <div class="header-left">
                    <div class="logo">
                        <span class="logo-icon">◈</span>
                        <div class="logo-text">
                            <span class="logo-title">${this.escapeHtml(title)}</span>
                            <span class="logo-subtitle">${this.escapeHtml(subtitle)}</span>
                        </div>
                    </div>
                    
                    <div class="status">
                        <span class="status-dot ${connected ? 'connected' : ''}"></span>
                        <span class="status-text">${connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>
                
                <div class="stats-strip">
                    <div class="stat">
                        <span class="stat-value ${coherenceClass}" id="coherenceValue">${(coherence * 100).toFixed(0)}%</span>
                        <span class="stat-label">Coherence</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="entropyValue">${entropy.toFixed(3)}</span>
                        <span class="stat-label">Entropy</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="lambdaValue">${lambda.toFixed(4)}</span>
                        <span class="stat-label">λ (Lyap)</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="oscCount">${oscillatorCount}</span>
                        <span class="stat-label">Oscillators</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="momentCount">${momentCount}</span>
                        <span class="stat-label">Moments</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="subjectiveTime">${subjectiveTime.toFixed(1)}s</span>
                        <span class="stat-label">τ (Subj)</span>
                    </div>
                </div>
                
                <div class="header-right">
                    <provider-selector></provider-selector>
                    <button class="action-btn" id="toggleIntrospect" title="Introspection">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="6"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                    </button>
                    <button class="action-btn" id="toggleSidebar" title="Toggle Sidebar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <line x1="15" y1="3" x2="15" y2="21"/>
                        </svg>
                    </button>
                    <slot name="actions"></slot>
                </div>
            </header>
        `;
    }
    
    setupEventListeners() {
        const introspectBtn = this.$('#toggleIntrospect');
        const sidebarBtn = this.$('#toggleSidebar');
        
        if (introspectBtn) {
            introspectBtn.addEventListener('click', () => {
                this.emit('toggle-introspect');
                introspectBtn.classList.toggle('active');
            });
        }
        
        if (sidebarBtn) {
            sidebarBtn.addEventListener('click', () => {
                this.emit('toggle-sidebar');
            });
        }
    }
    
    /**
     * Update status metrics
     */
    updateStatus(data) {
        this.setState({
            connected: data.connected ?? this._state.connected,
            coherence: data.coherence ?? this._state.coherence,
            entropy: data.entropy ?? this._state.entropy,
            lambda: data.lambda ?? this._state.lambda,
            oscillatorCount: data.oscillatorCount ?? this._state.oscillatorCount,
            momentCount: data.momentCount ?? this._state.momentCount,
            subjectiveTime: data.subjectiveTime ?? this._state.subjectiveTime
        });
    }
    
    /**
     * Set connection status
     */
    setConnected(connected) {
        this.setState({ connected });
    }
}

defineComponent('sentient-header', SentientHeader);