/**
 * Provider Selector Component
 * 
 * Dropdown component for selecting and switching between LLM providers.
 * Displays current provider, available providers, and allows runtime switching.
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class ProviderSelector extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            isOpen: false,
            loading: false,
            activeProvider: null,
            providers: [],
            currentModel: null,
            error: null
        };
        
        // Close dropdown when clicking outside
        this._boundClickOutside = this._handleClickOutside.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this._boundClickOutside);
        this.loadProviders();
    }
    
    disconnectedCallback() {
        document.removeEventListener('click', this._boundClickOutside);
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: inline-block;
                position: relative;
            }
            
            .selector-container {
                position: relative;
            }
            
            .selector-button {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                font-size: 0.75rem;
                font-family: var(--font-mono);
                cursor: pointer;
                transition: all var(--transition-fast);
                min-width: 120px;
            }
            
            .selector-button:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: var(--border-glow);
            }
            
            .selector-button.loading {
                opacity: 0.6;
                cursor: wait;
            }
            
            .provider-icon {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .provider-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .provider-name {
                flex: 1;
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .dropdown-arrow {
                width: 10px;
                height: 10px;
                transition: transform var(--transition-fast);
            }
            
            .dropdown-arrow.open {
                transform: rotate(180deg);
            }
            
            .status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--text-dim);
            }
            
            .status-dot.connected {
                background: var(--success);
                box-shadow: 0 0 4px var(--success);
            }
            
            .status-dot.error {
                background: var(--error);
            }
            
            /* Dropdown menu */
            .dropdown {
                position: absolute;
                top: calc(100% + 4px);
                right: 0;
                min-width: 220px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px);
                transition: all var(--transition-fast);
            }
            
            .dropdown.open {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .dropdown-header {
                padding: var(--space-sm) var(--space-md);
                border-bottom: 1px solid var(--border-color);
                font-size: 0.7rem;
                color: var(--text-dim);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .provider-list {
                padding: var(--space-xs) 0;
            }
            
            .provider-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm) var(--space-md);
                cursor: pointer;
                transition: background var(--transition-fast);
            }
            
            .provider-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .provider-item.active {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .provider-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .provider-item-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
            }
            
            .provider-item-info {
                flex: 1;
            }
            
            .provider-item-name {
                font-size: 0.8rem;
                color: var(--text-primary);
            }
            
            .provider-item-desc {
                font-size: 0.65rem;
                color: var(--text-dim);
            }
            
            .provider-item-status {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .provider-item-status .status-text {
                font-size: 0.6rem;
                color: var(--text-dim);
            }
            
            .check-icon {
                width: 14px;
                height: 14px;
                color: var(--success);
            }
            
            /* Model section */
            .model-section {
                padding: var(--space-sm) var(--space-md);
                border-top: 1px solid var(--border-color);
            }
            
            .model-label {
                font-size: 0.65rem;
                color: var(--text-dim);
                margin-bottom: var(--space-xs);
            }
            
            .model-value {
                font-size: 0.75rem;
                font-family: var(--font-mono);
                color: var(--text-secondary);
            }
            
            /* Error message */
            .error-message {
                padding: var(--space-sm) var(--space-md);
                background: rgba(239, 68, 68, 0.1);
                border-top: 1px solid rgba(239, 68, 68, 0.3);
                font-size: 0.7rem;
                color: var(--error);
            }
            
            /* Loading spinner */
            .loading-spinner {
                width: 12px;
                height: 12px;
                border: 2px solid var(--border-color);
                border-top-color: var(--accent-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
    }
    
    template() {
        const { isOpen, loading, activeProvider, providers, currentModel, error } = this._state;
        
        const activeProviderInfo = providers.find(p => p.id === activeProvider);
        const displayName = activeProviderInfo?.name || activeProvider || 'Select Provider';
        const statusClass = activeProviderInfo?.status === 'connected' ? 'connected' : 
                           activeProviderInfo?.status === 'error' ? 'error' : '';
        
        return `
            <div class="selector-container">
                <button class="selector-button ${loading ? 'loading' : ''}" id="selectorBtn">
                    <span class="status-dot ${statusClass}"></span>
                    <span class="provider-name">${this.escapeHtml(displayName)}</span>
                    ${loading ? 
                        '<span class="loading-spinner"></span>' :
                        `<svg class="dropdown-arrow ${isOpen ? 'open' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>`
                    }
                </button>
                
                <div class="dropdown ${isOpen ? 'open' : ''}">
                    <div class="dropdown-header">LLM Providers</div>
                    <div class="provider-list">
                        ${providers.map(p => this._renderProviderItem(p)).join('')}
                    </div>
                    
                    ${currentModel ? `
                        <div class="model-section">
                            <div class="model-label">Current Model</div>
                            <div class="model-value">${this.escapeHtml(currentModel)}</div>
                        </div>
                    ` : ''}
                    
                    ${error ? `
                        <div class="error-message">${this.escapeHtml(error)}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    _renderProviderItem(provider) {
        const isActive = provider.id === this._state.activeProvider;
        const isConfigured = provider.isConfigured;
        const statusDot = provider.status === 'connected' ? 'connected' : 
                         provider.status === 'error' ? 'error' : '';
        
        const icons = {
            lmstudio: '🖥️',
            vertex: '☁️',
            openai: '🤖',
            anthropic: '🧠'
        };
        
        return `
            <div class="provider-item ${isActive ? 'active' : ''} ${!isConfigured ? 'disabled' : ''}"
                 data-provider="${provider.id}"
                 title="${provider.description}">
                <span class="provider-item-icon">${icons[provider.id] || '⚡'}</span>
                <div class="provider-item-info">
                    <div class="provider-item-name">${this.escapeHtml(provider.name)}</div>
                    <div class="provider-item-desc">
                        ${isConfigured ? provider.description : 'Not configured'}
                    </div>
                </div>
                <div class="provider-item-status">
                    ${isActive ? `
                        <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    ` : `
                        <span class="status-dot ${statusDot}"></span>
                    `}
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        const selectorBtn = this.$('#selectorBtn');
        
        if (selectorBtn) {
            selectorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        // Provider item clicks
        this.$$('.provider-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const providerId = item.dataset.provider;
                if (!item.classList.contains('disabled')) {
                    this.switchProvider(providerId);
                }
            });
        });
    }
    
    _handleClickOutside(e) {
        if (!this.contains(e.target) && this._state.isOpen) {
            this.setState({ isOpen: false });
        }
    }
    
    toggleDropdown() {
        this.setState({ isOpen: !this._state.isOpen });
    }
    
    async loadProviders() {
        try {
            this.setState({ loading: true, error: null });
            
            const response = await fetch('/providers/status');
            const data = await response.json();
            
            if (data.success) {
                this.setState({
                    activeProvider: data.activeProvider,
                    providers: data.providers || [],
                    currentModel: data.currentModel,
                    loading: false
                });
            } else {
                this.setState({
                    error: data.error || 'Failed to load providers',
                    loading: false
                });
            }
        } catch (error) {
            console.error('[ProviderSelector] Load error:', error);
            this.setState({
                error: 'Connection error',
                loading: false
            });
        }
    }
    
    async switchProvider(providerId) {
        if (providerId === this._state.activeProvider) {
            this.setState({ isOpen: false });
            return;
        }
        
        try {
            this.setState({ loading: true, error: null, isOpen: false });
            
            const response = await fetch('/providers/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.setState({
                    activeProvider: data.provider,
                    currentModel: data.model,
                    loading: false
                });
                
                // Emit event for other components
                this.emit('provider-changed', {
                    provider: data.provider,
                    model: data.model
                });
                
                // Refresh provider list to update statuses
                this.loadProviders();
            } else {
                this.setState({
                    error: data.error || 'Switch failed',
                    loading: false
                });
            }
        } catch (error) {
            console.error('[ProviderSelector] Switch error:', error);
            this.setState({
                error: 'Connection error',
                loading: false
            });
        }
    }
    
    /**
     * Get current provider info
     */
    getActiveProvider() {
        return {
            id: this._state.activeProvider,
            model: this._state.currentModel
        };
    }
}

defineComponent('provider-selector', ProviderSelector);