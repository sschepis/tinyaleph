/**
 * Command Palette Component
 * 
 * Shows available commands with:
 * - Filtering based on input
 * - Keyboard navigation
 * - Click selection
 * - Auto-complete on Tab
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

// Default commands
const DEFAULT_COMMANDS = [
    { command: '/help', description: 'Show available commands', icon: '❓' },
    { command: '/clear', description: 'Clear conversation history', icon: '🗑️' },
    { command: '/status', description: 'Show observer status', icon: '📊' },
    { command: '/introspect', description: 'Full introspection data', icon: '🔍' },
    { command: '/senses', description: 'Current sense readings', icon: '👁️' },
    { command: '/nodes', description: 'Show connected nodes (peers)', icon: '🌐' },
    { command: '/save', description: 'Save current state', icon: '💾' },
    { command: '/reset', description: 'Reset observer state', icon: '🔄' },
    { command: '/list', description: 'List files in directory', icon: '📁', hasArg: true, argHint: '[path]' },
    { command: '/read', description: 'Read a file', icon: '📄', hasArg: true, argHint: '<file>' },
    { command: '/run', description: 'Run a shell command', icon: '⚡', hasArg: true, argHint: '<command>' },
];

export class CommandPalette extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            visible: false,
            filter: '',
            selectedIndex: 0,
            filteredCommands: []
        };
        
        this.commands = [...DEFAULT_COMMANDS];
    }
    
    static get observedAttributes() {
        return ['visible'];
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                position: absolute;
                bottom: 100%;
                left: 0;
                right: 0;
                margin-bottom: var(--space-sm);
                z-index: 100;
            }
            
            .palette {
                background: var(--bg-panel);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                overflow: hidden;
                display: none;
                animation: slideIn var(--transition-fast);
            }
            
            .palette.visible {
                display: block;
            }
            
            .palette-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .palette-title {
                font-size: 0.7rem;
                font-weight: 600;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .palette-hint {
                font-size: 0.65rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            .palette-list {
                max-height: 250px;
                overflow-y: auto;
            }
            
            .command-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm) var(--space-md);
                cursor: pointer;
                transition: background var(--transition-fast);
            }
            
            .command-item:hover,
            .command-item.selected {
                background: rgba(99, 102, 241, 0.1);
            }
            
            .command-item.selected {
                border-left: 3px solid var(--accent-primary);
            }
            
            .command-icon {
                font-size: 1rem;
                width: 24px;
                text-align: center;
            }
            
            .command-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
            }
            
            .command-name {
                font-size: 0.85rem;
                font-weight: 500;
                color: var(--text-primary);
                font-family: var(--font-mono);
            }
            
            .command-desc {
                font-size: 0.7rem;
                color: var(--text-dim);
            }
            
            .command-arg {
                color: var(--accent-secondary);
                opacity: 0.7;
            }
            
            .no-results {
                padding: var(--space-md);
                text-align: center;
                color: var(--text-dim);
                font-size: 0.8rem;
            }
        `;
    }
    
    template() {
        const { visible, filteredCommands, selectedIndex } = this._state;
        
        const commandList = filteredCommands.length > 0
            ? filteredCommands.map((cmd, idx) => `
                <div class="command-item ${idx === selectedIndex ? 'selected' : ''}" data-index="${idx}">
                    <span class="command-icon">${cmd.icon}</span>
                    <div class="command-text">
                        <span class="command-name">
                            ${this.escapeHtml(cmd.command)}${cmd.hasArg ? ` <span class="command-arg">${cmd.argHint}</span>` : ''}
                        </span>
                        <span class="command-desc">${this.escapeHtml(cmd.description)}</span>
                    </div>
                </div>
            `).join('')
            : '<div class="no-results">No matching commands</div>';
        
        return `
            <div class="palette ${visible ? 'visible' : ''}">
                <div class="palette-header">
                    <span class="palette-title">Commands</span>
                    <span class="palette-hint">↑↓ Navigate • Enter Select • Esc Close</span>
                </div>
                <div class="palette-list">
                    ${commandList}
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        const items = this.$$('.command-item');
        items.forEach((item, idx) => {
            item.addEventListener('click', () => this.selectCommand(idx));
            item.addEventListener('mouseenter', () => this.highlightCommand(idx));
        });
    }
    
    /**
     * Set custom commands
     */
    setCommands(commands) {
        this.commands = commands;
        this.filter(this._state.filter);
    }
    
    /**
     * Show palette with optional filter
     */
    show(filter = '') {
        this.filter(filter);
        this._state.visible = true;
        this._state.selectedIndex = 0;
        this.render();
    }
    
    /**
     * Hide palette
     */
    hide() {
        this._state.visible = false;
        this.render();
    }
    
    /**
     * Check if visible
     */
    get isVisible() {
        return this._state.visible;
    }
    
    /**
     * Filter commands
     */
    filter(text) {
        this._state.filter = text;
        const filterLower = text.toLowerCase().replace(/^\//, '');
        
        this._state.filteredCommands = this.commands.filter(cmd =>
            cmd.command.toLowerCase().includes(filterLower) ||
            cmd.description.toLowerCase().includes(filterLower)
        );
        
        this._state.selectedIndex = 0;
        
        if (this._state.visible) {
            this.render();
        }
    }
    
    /**
     * Highlight command by index
     */
    highlightCommand(index) {
        this._state.selectedIndex = Math.max(0, Math.min(index, this._state.filteredCommands.length - 1));
        this.render();
    }
    
    /**
     * Move selection up
     */
    moveUp() {
        this.highlightCommand(this._state.selectedIndex - 1);
    }
    
    /**
     * Move selection down
     */
    moveDown() {
        this.highlightCommand(this._state.selectedIndex + 1);
    }
    
    /**
     * Select command by index
     */
    selectCommand(index) {
        const cmd = this._state.filteredCommands[index];
        if (!cmd) return;
        
        this.emit('command-select', {
            command: cmd.command,
            hasArg: cmd.hasArg,
            argHint: cmd.argHint
        });
        
        this.hide();
    }
    
    /**
     * Select currently highlighted command
     */
    selectCurrent() {
        this.selectCommand(this._state.selectedIndex);
    }
    
    /**
     * Handle keyboard navigation
     * @returns {boolean} true if event was handled
     */
    handleKeydown(e) {
        if (!this._state.visible) return false;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.moveDown();
                return true;
            case 'ArrowUp':
                e.preventDefault();
                this.moveUp();
                return true;
            case 'Enter':
                e.preventDefault();
                this.selectCurrent();
                return true;
            case 'Tab':
                e.preventDefault();
                this.selectCurrent();
                return true;
            case 'Escape':
                e.preventDefault();
                this.hide();
                return true;
            default:
                return false;
        }
    }
}

defineComponent('command-palette', CommandPalette);