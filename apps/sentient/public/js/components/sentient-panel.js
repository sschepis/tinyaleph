/**
 * Sentient Panel Component
 * 
 * Generic collapsible panel with:
 * - Header with title and icon
 * - Collapse/expand functionality
 * - Optional footer
 * - Slot-based content
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class SentientPanel extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            collapsed: false
        };
    }
    
    static get observedAttributes() {
        return ['title', 'icon', 'collapsed', 'collapsible', 'expanded'];
    }
    
    connectedCallback() {
        // Check for expanded attribute before calling parent
        if (this.hasAttribute('expanded') && !this.hasAttribute('collapsed')) {
            this._state.collapsed = false;
        } else if (this.hasAttribute('collapsed')) {
            this._state.collapsed = true;
        }
        
        super.connectedCallback();
    }
    
    onAttributeChange(name, oldValue, newValue) {
        if (name === 'collapsed') {
            this._state.collapsed = newValue !== null;
        } else if (name === 'expanded') {
            if (newValue !== null) {
                this._state.collapsed = false;
            }
        }
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 100%;
            }
            
            .panel {
                background: var(--bg-panel);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                overflow: hidden;
                transition: all var(--transition-normal);
            }
            
            .panel.collapsed .panel-content {
                max-height: 0;
                padding-top: 0;
                padding-bottom: 0;
                opacity: 0;
                overflow: hidden;
            }
            
            .panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
                user-select: none;
            }
            
            .panel.collapsed .panel-header {
                border-bottom: none;
            }
            
            .panel-header.clickable {
                cursor: pointer;
            }
            
            .panel-header.clickable:hover {
                background: rgba(99, 102, 241, 0.1);
            }
            
            .panel-title {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--text-primary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .panel-icon {
                font-size: 0.9rem;
            }
            
            .panel-actions {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .panel-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                transition: all var(--transition-fast);
            }
            
            .panel-toggle:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .panel-toggle svg {
                width: 14px;
                height: 14px;
                transition: transform var(--transition-normal);
            }
            
            .panel.collapsed .panel-toggle svg {
                transform: rotate(-90deg);
            }
            
            .panel-content {
                padding: var(--space-md);
                max-height: 1000px;
                opacity: 1;
                transition: all var(--transition-normal);
            }
            
            .panel-footer {
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-tertiary);
                border-top: 1px solid var(--border-color);
            }
            
            /* Variants */
            :host([variant="compact"]) .panel-content {
                padding: var(--space-sm);
            }
            
            :host([variant="borderless"]) .panel {
                border: none;
                background: transparent;
            }
            
            :host([variant="borderless"]) .panel-header {
                background: transparent;
                border-bottom: 1px solid var(--border-color);
            }
        `;
    }
    
    template() {
        const title = this.getAttr('title', 'Panel');
        const icon = this.getAttr('icon', '');
        const isCollapsible = this.hasAttribute('collapsible');
        const isCollapsed = this._state.collapsed;
        
        return `
            <div class="panel ${isCollapsed ? 'collapsed' : ''}">
                <div class="panel-header ${isCollapsible ? 'clickable' : ''}" id="panelHeader">
                    <div class="panel-title">
                        ${icon ? `<span class="panel-icon">${icon}</span>` : ''}
                        <span>${this.escapeHtml(title)}</span>
                        <slot name="badge"></slot>
                    </div>
                    <div class="panel-actions">
                        <slot name="actions"></slot>
                        ${isCollapsible ? `
                            <button class="panel-toggle" id="toggleBtn" title="${isCollapsed ? 'Expand' : 'Collapse'}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 9l6 6 6-6"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="panel-content">
                    <slot></slot>
                </div>
                <slot name="footer"></slot>
            </div>
        `;
    }
    
    setupEventListeners() {
        const header = this.$('#panelHeader');
        const toggleBtn = this.$('#toggleBtn');
        
        if (this.hasAttribute('collapsible') && header) {
            header.addEventListener('click', (e) => {
                // Only toggle if clicking header directly, not child buttons
                if (e.target === header || e.target.closest('.panel-title')) {
                    this.toggle();
                }
            });
        }
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
    }
    
    /**
     * Toggle collapsed state
     */
    toggle() {
        this._state.collapsed = !this._state.collapsed;
        
        if (this._state.collapsed) {
            this.setAttribute('collapsed', '');
        } else {
            this.removeAttribute('collapsed');
        }
        
        this.render();
        this.emit('panel-toggle', { collapsed: this._state.collapsed });
    }
    
    /**
     * Expand panel
     */
    expand() {
        if (this._state.collapsed) {
            this.toggle();
        }
    }
    
    /**
     * Collapse panel
     */
    collapse() {
        if (!this._state.collapsed) {
            this.toggle();
        }
    }
}

defineComponent('sentient-panel', SentientPanel);