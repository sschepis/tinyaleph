
/**
 * Chat Message Component
 *
 * Individual chat message with:
 * - User/Assistant/System styling
 * - Message actions (copy, edit, delete, re-run)
 * - Markdown rendering support
 * - Runnable JavaScript code blocks with output display
 * - Syntax highlighting
 * - Streaming state
 * - Tool results display
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class ChatMessage extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            isEditing: false,
            isStreaming: false
        };
        
        this._codeBlocks = {};
    }
    
    static get observedAttributes() {
        return ['role', 'content', 'timestamp', 'streaming', 'server-index'];
    }
    
    get role() {
        return this.getAttr('role', 'user');
    }
    
    get content() {
        return this.getAttr('content', '');
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 100%;
                animation: slideIn var(--transition-normal);
            }
            
            .message {
                display: flex;
                gap: var(--space-md);
                padding: var(--space-md);
                border-radius: var(--radius-md);
                transition: background var(--transition-fast);
            }
            
            .message:hover {
                background: rgba(255, 255, 255, 0.02);
            }
            
            .message.user {
                background: rgba(99, 102, 241, 0.05);
            }
            
            .message.assistant {
                background: rgba(139, 92, 246, 0.05);
            }
            
            .message.system {
                background: rgba(245, 158, 11, 0.05);
                font-style: italic;
            }
            
            .message.ai-internal {
                background: rgba(168, 85, 247, 0.08);
                border-left: 3px solid var(--accent-tertiary);
            }
            
            .message.editing {
                background: rgba(99, 102, 241, 0.1);
                border: 1px solid var(--accent-primary);
            }
            
            .message-avatar {
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: var(--bg-tertiary);
                font-size: 1rem;
            }
            
            .message.user .message-avatar { background: rgba(99, 102, 241, 0.2); }
            .message.assistant .message-avatar { background: rgba(139, 92, 246, 0.2); }
            
            .message-body {
                flex: 1;
                min-width: 0;
            }
            
            .message-content {
                font-size: 0.9rem;
                line-height: 1.6;
                color: var(--text-primary);
                word-break: break-word;
            }
            
            .message-content.streaming::after {
                content: '▌';
                animation: pulse 0.5s infinite;
                color: var(--accent-primary);
            }
            
            /* Markdown styles */
            .message-content code {
                background: var(--bg-tertiary);
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                font-family: var(--font-mono);
                font-size: 0.85em;
            }
            
            .message-content pre {
                background: var(--bg-tertiary);
                padding: var(--space-md);
                border-radius: var(--radius-md);
                overflow-x: auto;
                margin: var(--space-sm) 0;
            }
            
            .message-content pre code {
                padding: 0;
                background: transparent;
            }
            
            /* Runnable code block styles */
            .code-block-container {
                position: relative;
                margin: var(--space-md) 0;
                border-radius: var(--radius-lg);
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .code-block-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 4px 8px;
                background: rgba(99, 102, 241, 0.12);
                border-bottom: 1px solid rgba(99, 102, 241, 0.2);
            }
            
            .code-block-lang {
                font-size: 0.65rem;
                font-weight: 600;
                color: var(--accent-primary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .code-block-lang::before {
                content: '';
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--accent-primary);
            }
            
            .code-block-actions {
                display: flex;
                gap: var(--space-sm);
            }
            
            .code-action-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 3px 8px;
                font-size: 0.65rem;
                font-weight: 500;
                color: var(--text-dim);
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            
            .code-action-btn:hover {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-primary);
            }
            
            .code-action-btn.run-btn {
                color: var(--success);
                border-color: rgba(34, 197, 94, 0.3);
            }
            
            .code-action-btn.run-btn:hover {
                background: var(--success);
                color: white;
                border-color: var(--success);
            }
            
            .code-action-btn.run-btn.running {
                color: var(--warning);
                cursor: wait;
            }
            
            .code-block-pre {
                margin: 0 !important;
                padding: var(--space-sm) var(--space-md) !important;
                background: #0d1117 !important;
                border-radius: 0 !important;
                border: none !important;
                font-size: 0.8rem;
                line-height: 1.5;
            }
            
            .code-block-pre code {
                font-family: var(--font-mono);
                color: #e6edf3;
            }
            
            /* Syntax highlighting */
            .token-keyword { color: #ff7b72; }
            .token-string { color: #a5d6ff; }
            .token-number { color: #79c0ff; }
            .token-comment { color: #8b949e; font-style: italic; }
            .token-function { color: #d2a8ff; }
            .token-operator { color: #ff7b72; }
            .token-punctuation { color: #c9d1d9; }
            .token-property { color: #7ee787; }
            .token-builtin { color: #ffa657; }
            .token-boolean { color: #79c0ff; }
            .token-null { color: #79c0ff; }
            .token-regex { color: #7ee787; }
            
            /* Code output styles */
            .code-output {
                margin: 0;
                border-top: 1px solid rgba(139, 92, 246, 0.3);
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
            }
            
            .code-output-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) var(--space-md);
                background: rgba(139, 92, 246, 0.1);
                border-bottom: 1px solid rgba(139, 92, 246, 0.2);
            }
            
            .code-output-title {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--accent-secondary);
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            
            .code-output-title svg {
                opacity: 0.7;
            }
            
            .code-output-clear {
                font-size: 0.7rem;
                color: var(--text-dim);
                cursor: pointer;
                padding: 2px 8px;
                border-radius: var(--radius-sm);
                transition: all var(--transition-fast);
            }
            
            .code-output-clear:hover {
                color: var(--error);
                background: rgba(239, 68, 68, 0.1);
            }
            
            .code-output-content {
                padding: var(--space-md);
                background: rgba(0, 0, 0, 0.2);
                font-family: var(--font-mono);
                font-size: 0.8rem;
                max-height: 250px;
                overflow-y: auto;
            }
            
            .output-line {
                padding: 3px 0;
                white-space: pre-wrap;
                word-break: break-word;
                display: flex;
                align-items: flex-start;
                gap: var(--space-xs);
            }
            
            .output-line.log { color: var(--text-primary); }
            .output-line.info { color: var(--accent-primary); }
            .output-line.warn { color: var(--warning); background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: var(--radius-sm); margin: 2px 0; }
            .output-line.error { color: var(--error); background: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: var(--radius-sm); margin: 2px 0; }
            .output-line.result { color: var(--success); font-weight: 600; }
            
            .output-line .output-prefix {
                font-weight: 700;
                flex-shrink: 0;
            }
            
            .output-empty {
                color: var(--text-dim);
                font-style: italic;
                opacity: 0.7;
            }
            
            .output-time {
                color: var(--text-dim);
                font-size: 0.7rem;
                padding-top: var(--space-sm);
                margin-top: var(--space-sm);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .message-content strong { font-weight: 600; }
            .message-content em { font-style: italic; }
            
            .message-content a {
                color: var(--accent-primary);
                text-decoration: none;
            }
            
            .message-content a:hover {
                text-decoration: underline;
            }
            
            .message-content ul, .message-content ol {
                margin: var(--space-sm) 0;
                padding-left: var(--space-lg);
            }
            
            .message-content li {
                margin: var(--space-xs) 0;
            }
            
            /* Headers */
            .message-content h1, .message-content h2, .message-content h3,
            .message-content h4, .message-content h5, .message-content h6 {
                margin: var(--space-md) 0 var(--space-sm) 0;
                font-weight: 600;
                color: var(--text-primary);
                line-height: 1.3;
            }
            
            .message-content h1 {
                font-size: 1.5rem;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: var(--space-sm);
            }
            
            .message-content h2 {
                font-size: 1.3rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: var(--space-xs);
            }
            
            .message-content h3 {
                font-size: 1.15rem;
            }
            
            .message-content h4 {
                font-size: 1.05rem;
            }
            
            .message-content h5, .message-content h6 {
                font-size: 1rem;
                color: var(--text-secondary);
            }
            
            /* Horizontal rule */
            .message-content hr {
                border: none;
                height: 1px;
                background: linear-gradient(90deg, transparent, var(--border-color), transparent);
                margin: var(--space-md) 0;
            }
            
            /* Math expressions */
            .math-inline {
                display: inline;
                font-family: var(--font-mono);
                font-size: 0.9em;
                color: var(--accent-secondary);
                background: rgba(139, 92, 246, 0.1);
                padding: 2px 6px;
                border-radius: var(--radius-sm);
            }
            
            .math-block {
                display: block;
                font-family: var(--font-mono);
                font-size: 0.95rem;
                color: var(--accent-secondary);
                background: rgba(139, 92, 246, 0.1);
                padding: var(--space-md);
                border-radius: var(--radius-md);
                margin: var(--space-md) 0;
                text-align: center;
                overflow-x: auto;
                border-left: 3px solid var(--accent-secondary);
            }
            
            /* Blockquote */
            .message-content blockquote {
                border-left: 3px solid var(--accent-primary);
                margin: var(--space-sm) 0;
                padding: var(--space-sm) var(--space-md);
                background: rgba(99, 102, 241, 0.05);
                color: var(--text-secondary);
                font-style: italic;
            }
            
            .message-actions {
                display: flex;
                gap: var(--space-xs);
                margin-top: var(--space-sm);
                opacity: 0;
                transition: opacity var(--transition-fast);
            }
            
            .message:hover .message-actions {
                opacity: 1;
            }
            
            .msg-action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                transition: all var(--transition-fast);
            }
            
            .msg-action-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .msg-action-btn.msg-action-delete:hover {
                background: var(--error);
            }
            
            .message-meta {
                display: flex;
                gap: var(--space-md);
                margin-top: var(--space-xs);
                font-size: 0.65rem;
                color: var(--text-dim);
                font-family: var(--font-mono);
            }
            
            /* Streaming status */
            .streaming-status {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-xs) 0;
                font-size: 0.75rem;
                color: var(--accent-primary);
            }
            
            .streaming-icon {
                animation: spin 1s linear infinite;
            }
            
            /* Tool results */
            .tool-results-container {
                margin-top: var(--space-sm);
            }
            
            .tool-result {
                margin: var(--space-xs) 0;
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                border-left: 3px solid var(--accent-primary);
            }
            
            .tool-result.success { border-left-color: var(--success); }
            .tool-result.error { border-left-color: var(--error); }
            
            .tool-header {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .tool-icon { font-size: 0.9rem; }
            
            .tool-content {
                margin-top: var(--space-xs);
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            .tool-content pre {
                margin: 0;
                padding: var(--space-sm);
                max-height: 150px;
                overflow: auto;
            }
            
            /* Edit mode */
            .edit-textarea {
                width: 100%;
                min-height: 80px;
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 0.9rem;
                resize: vertical;
            }
            
            .edit-textarea:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            
            .edit-actions {
                display: flex;
                gap: var(--space-sm);
                margin-top: var(--space-sm);
            }
            
            .edit-btn {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                padding: var(--space-xs) var(--space-sm);
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
                transition: all var(--transition-fast);
            }
            
            .edit-save {
                background: var(--accent-primary);
                color: white;
            }
            
            .edit-save:hover { background: var(--accent-secondary); }
            
            .edit-cancel {
                background: var(--bg-tertiary);
                color: var(--text-secondary);
            }
            
            .edit-cancel:hover {
                background: var(--error);
                color: white;
            }
            
            /* Message type label for AI internal */
            .message-type-label {
                font-size: 0.7rem;
                font-weight: 600;
                color: var(--accent-tertiary);
                margin-bottom: var(--space-xs);
            }
            
            .immersive-badge {
                background: rgba(168, 85, 247, 0.2);
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                color: var(--accent-tertiary);
            }
        `;
    }
    
    template() {
        const role = this.role;
        const content = this.content;
        const timestamp = this.getAttr('timestamp', '');
        const isStreaming = this.hasAttribute('streaming');
        const serverIndex = this.getAttr('server-index', '');
        
        const avatar = role === 'user' ? '👤' : role === 'system' ? '⚙️' : '🌌';
        const classes = [
            'message',
            role,
            isStreaming ? 'streaming' : '',
            this._state.isEditing ? 'editing' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${classes}" data-content="${this.escapeHtml(content)}" ${serverIndex ? `data-server-index="${serverIndex}"` : ''}>
                <div class="message-avatar">${avatar}</div>
                <div class="message-body">
                    ${isStreaming ? `
                        <div class="streaming-status">
                            <span class="streaming-icon">◐</span>
                            <span class="streaming-label">Processing...</span>
                        </div>
                        <div class="message-content streaming" id="responseContent"></div>
                        <div class="tool-results-container" id="toolResults"></div>
                    ` : `
                        <div class="message-content" id="messageContent">${this.renderMarkdown(content)}</div>
                        <div class="message-actions">
                            ${this.buildActions(role)}
                        </div>
                        ${timestamp ? `
                            <div class="message-meta">
                                <span>${timestamp}</span>
                            </div>
                        ` : ''}
                    `}
                </div>
            </div>
        `;
    }
    
    buildActions(role) {
        const actions = [];
        
        // Copy button for all
        actions.push(`
            <button class="msg-action-btn" data-action="copy" title="Copy message">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
            </button>
        `);
        
        if (role === 'user') {
            // Edit
            actions.push(`
                <button class="msg-action-btn" data-action="edit" title="Edit message">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            `);
            
            // Re-run
            actions.push(`
                <button class="msg-action-btn" data-action="rerun" title="Re-send this message">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 4v6h6"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                </button>
            `);
        }
        
        // Delete
        actions.push(`
            <button class="msg-action-btn msg-action-delete" data-action="delete" title="Delete message">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
            </button>
        `);
        
        return actions.join('');
    }
    
    setupEventListeners() {
        const actionBtns = this.$$('.msg-action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Setup code block actions
        const runBtns = this.$$('.code-action-btn.run-btn');
        runBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                this.runCodeBlock(blockId);
            });
        });
        
        const copyCodeBtns = this.$$('.code-action-btn.copy-btn');
        copyCodeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                this.copyCodeBlock(blockId);
            });
        });
        
        const clearOutputBtns = this.$$('.code-output-clear');
        clearOutputBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                this.clearCodeOutput(blockId);
            });
        });
    }
    
    handleAction(action) {
        switch (action) {
            case 'copy':
                this.copyContent();
                break;
            case 'edit':
                this.enterEditMode();
                break;
            case 'rerun':
                this.emit('message-rerun', { content: this.content, element: this });
                break;
            case 'delete':
                this.emit('message-delete', { element: this, serverIndex: this.getAttr('server-index') });
                break;
        }
    }
    
    async copyContent() {
        try {
            await navigator.clipboard.writeText(this.content);
            this.emit('toast', { message: 'Copied to clipboard' });
        } catch (err) {
            this.emit('error', { message: 'Copy failed' });
        }
    }
    
    enterEditMode() {
        if (this.role !== 'user') return;
        
        this._state.isEditing = true;
        const contentEl = this.$('#messageContent');
        const actionsEl = this.$('.message-actions');
        
        if (contentEl) {
            contentEl.innerHTML = `
                <textarea class="edit-textarea" id="editTextarea">${this.escapeHtml(this.content)}</textarea>
                <div class="edit-actions">
                    <button class="edit-btn edit-save" id="editSave">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Save
                    </button>
                    <button class="edit-btn edit-cancel" id="editCancel">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Cancel
                    </button>
                </div>
            `;
            
            if (actionsEl) actionsEl.style.display = 'none';
            
            const textarea = this.$('#editTextarea');
            const saveBtn = this.$('#editSave');
            const cancelBtn = this.$('#editCancel');
            
            if (textarea) {
                textarea.focus();
                textarea.select();
                
                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.saveEdit(textarea.value);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        this.cancelEdit();
                    }
                });
            }
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveEdit(textarea.value));
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.cancelEdit());
            }
        }
        
        this.$('.message').classList.add('editing');
    }
    
    saveEdit(newContent) {
        const trimmed = newContent.trim();
        if (!trimmed || trimmed === this.content.trim()) {
            this.cancelEdit();
            return;
        }
        
        this.emit('message-edit', { 
            element: this, 
            oldContent: this.content, 
            newContent: trimmed 
        });
    }
    
    cancelEdit() {
        this._state.isEditing = false;
        this.render();
    }
    
    /**
     * Update streaming content
     */
    updateStreamingContent(content) {
        const contentEl = this.$('#responseContent');
        if (contentEl) {
            contentEl.innerHTML = this.renderMarkdown(content);
        }
    }
    
    /**
     * Update streaming status
     */
    updateStreamingStatus(status) {
        const label = this.$('.streaming-label');
        if (label) {
            label.textContent = status;
        }
    }
    
    /**
     * Add tool result
     */
    addToolResult(tool, success, content) {
        const container = this.$('#toolResults');
        if (!container) return;
        
        const el = document.createElement('div');
        el.className = `tool-result ${success ? 'success' : 'error'}`;
        el.innerHTML = `
            <div class="tool-header">
                <span class="tool-icon">${success ? '✓' : '✗'}</span>
                <span class="tool-name">${this.escapeHtml(tool)}</span>
            </div>
            ${content ? `<div class="tool-content"><pre>${this.escapeHtml(content)}</pre></div>` : ''}
        `;
        container.appendChild(el);
    }
    
    /**
     * Finish streaming
     */
    finishStreaming(finalContent, meta = {}) {
        this.removeAttribute('streaming');
        this.setAttribute('content', finalContent);
        this.render();
        
        // Add meta info
        if (Object.keys(meta).length > 0) {
            const body = this.$('.message-body');
            if (body) {
                const metaEl = document.createElement('div');
                metaEl.className = 'message-meta';
                
                const parts = [];
                parts.push(`<span>${new Date().toLocaleTimeString()}</span>`);
                if (meta.coherence !== undefined) {
                    parts.push(`<span>C: ${(meta.coherence * 100).toFixed(0)}%</span>`);
                }
                if (meta.toolCount > 0) {
                    parts.push(`<span>🔧 ${meta.toolCount} tool${meta.toolCount > 1 ? 's' : ''}</span>`);
                }
                
                metaEl.innerHTML = parts.join('');
                body.appendChild(metaEl);
            }
        }
    }
    
    /**
     * Simple syntax highlighter for JavaScript/TypeScript
     * Uses single-pass tokenization to avoid regex overlap issues
     */
    highlightJS(escapedCode) {
        const keywords = new Set([
            'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
            'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
            'throw', 'class', 'extends', 'new', 'this', 'super', 'import', 'export',
            'default', 'from', 'as', 'async', 'await', 'yield', 'of', 'in', 'typeof',
            'instanceof', 'void', 'delete'
        ]);
        
        const builtins = new Set([
            'console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean',
            'Date', 'JSON', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'setTimeout',
            'setInterval', 'clearTimeout', 'clearInterval', 'fetch', 'window', 'document'
        ]);
        
        const literals = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
        
        const result = [];
        let i = 0;
        const len = escapedCode.length;
        
        while (i < len) {
            const ch = escapedCode[i];
            
            // HTML entity check - skip already-escaped content
            if (ch === '&') {
                // Read until ; or max 8 chars
                let entity = '&';
                let j = i + 1;
                while (j < len && j < i + 10 && escapedCode[j] !== ';') {
                    entity += escapedCode[j];
                    j++;
                }
                if (escapedCode[j] === ';') {
                    entity += ';';
                    result.push(entity);
                    i = j + 1;
                    continue;
                }
            }
            
            // Single-line comment: //
            if (ch === '/' && escapedCode[i + 1] === '/') {
                let comment = '';
                while (i < len && escapedCode[i] !== '\n') {
                    comment += escapedCode[i];
                    i++;
                }
                result.push(`<span class="token-comment">${comment}</span>`);
                continue;
            }
            
            // Multi-line comment: /* */
            if (ch === '/' && escapedCode[i + 1] === '*') {
                let comment = '/*';
                i += 2;
                while (i < len && !(escapedCode[i] === '*' && escapedCode[i + 1] === '/')) {
                    comment += escapedCode[i];
                    i++;
                }
                if (i < len) {
                    comment += '*/';
                    i += 2;
                }
                result.push(`<span class="token-comment">${comment}</span>`);
                continue;
            }
            
            // Strings: ", ', `
            if (ch === '"' || ch === "'" || ch === '`') {
                const quote = ch;
                let str = ch;
                i++;
                while (i < len) {
                    const c = escapedCode[i];
                    str += c;
                    if (c === '\\' && i + 1 < len) {
                        // Escape sequence
                        i++;
                        str += escapedCode[i];
                        i++;
                        continue;
                    }
                    if (c === quote) {
                        i++;
                        break;
                    }
                    i++;
                }
                result.push(`<span class="token-string">${str}</span>`);
                continue;
            }
            
            // Numbers
            if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(escapedCode[i + 1] || ''))) {
                let num = '';
                while (i < len && /[0-9.eExX_a-fA-F]/.test(escapedCode[i])) {
                    num += escapedCode[i];
                    i++;
                }
                result.push(`<span class="token-number">${num}</span>`);
                continue;
            }
            
            // Identifiers and keywords
            if (/[a-zA-Z_$]/.test(ch)) {
                let ident = '';
                while (i < len && /[a-zA-Z0-9_$]/.test(escapedCode[i])) {
                    ident += escapedCode[i];
                    i++;
                }
                
                // Check what follows for function call
                let isFunction = false;
                let j = i;
                while (j < len && /\s/.test(escapedCode[j])) j++;
                if (escapedCode[j] === '(') isFunction = true;
                
                if (keywords.has(ident)) {
                    result.push(`<span class="token-keyword">${ident}</span>`);
                } else if (builtins.has(ident)) {
                    result.push(`<span class="token-builtin">${ident}</span>`);
                } else if (literals.has(ident)) {
                    result.push(`<span class="token-${ident === 'true' || ident === 'false' ? 'boolean' : 'null'}">${ident}</span>`);
                } else if (isFunction) {
                    result.push(`<span class="token-function">${ident}</span>`);
                } else {
                    result.push(ident);
                }
                continue;
            }
            
            // Property access after dot
            if (ch === '.') {
                result.push('.');
                i++;
                // Check for property name
                if (i < len && /[a-zA-Z_$]/.test(escapedCode[i])) {
                    let prop = '';
                    while (i < len && /[a-zA-Z0-9_$]/.test(escapedCode[i])) {
                        prop += escapedCode[i];
                        i++;
                    }
                    result.push(`<span class="token-property">${prop}</span>`);
                }
                continue;
            }
            
            // Default: just push the character
            result.push(ch);
            i++;
        }
        
        return result.join('');
    }
    
    /**
     * Render LaTeX math expression to readable format
     * Converts LaTeX to a more readable form without requiring MathJax
     */
    renderMath(latex) {
        let result = latex;
        
        // Greek letters
        const greekLetters = {
            '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
            '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
            '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
            '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
            '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
            '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
            '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
            '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ',
            '\\Psi': 'Ψ', '\\Omega': 'Ω'
        };
        
        for (const [tex, char] of Object.entries(greekLetters)) {
            result = result.replace(new RegExp(tex.replace(/\\/g, '\\\\'), 'g'), char);
        }
        
        // Math symbols
        const mathSymbols = {
            '\\infty': '∞', '\\pm': '±', '\\mp': '∓',
            '\\times': '×', '\\div': '÷', '\\cdot': '·',
            '\\leq': '≤', '\\geq': '≥', '\\neq': '≠',
            '\\approx': '≈', '\\equiv': '≡', '\\propto': '∝',
            '\\sum': 'Σ', '\\prod': 'Π', '\\int': '∫',
            '\\partial': '∂', '\\nabla': '∇',
            '\\forall': '∀', '\\exists': '∃',
            '\\in': '∈', '\\notin': '∉', '\\subset': '⊂',
            '\\cup': '∪', '\\cap': '∩',
            '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
            '\\Rightarrow': '⇒', '\\Leftarrow': '⇐',
            '\\to': '→', '\\gets': '←',
            '\\sqrt': '√', '\\angle': '∠',
            '\\circ': '°', '\\prime': '′',
            '\\ldots': '…', '\\cdots': '⋯',
        };
        
        for (const [tex, char] of Object.entries(mathSymbols)) {
            result = result.replace(new RegExp(tex.replace(/\\/g, '\\\\'), 'g'), char);
        }
        
        // Superscripts
        result = result.replace(/\^{([^}]+)}/g, (_, exp) => {
            const superMap = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
                             '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'};
            return exp.split('').map(c => superMap[c] || `^${c}`).join('');
        });
        result = result.replace(/\^([0-9n])/g, (_, c) => {
            const superMap = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','n':'ⁿ'};
            return superMap[c] || `^${c}`;
        });
        
        // Subscripts
        result = result.replace(/_{([^}]+)}/g, (_, sub) => {
            const subMap = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
                           '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎','a':'ₐ','e':'ₑ','i':'ᵢ','j':'ⱼ',
                           'k':'ₖ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'};
            return sub.split('').map(c => subMap[c] || `_${c}`).join('');
        });
        result = result.replace(/_([0-9])/g, (_, c) => {
            const subMap = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
            return subMap[c] || `_${c}`;
        });
        
        // Fractions
        result = result.replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1/$2)');
        
        // Text and mathbf
        result = result.replace(/\\text{([^}]+)}/g, '$1');
        result = result.replace(/\\mathbf{([^}]+)}/g, '<strong>$1</strong>');
        result = result.replace(/\\mathrm{([^}]+)}/g, '$1');
        
        // Square root
        result = result.replace(/\\sqrt{([^}]+)}/g, '√($1)');
        
        // Remove remaining backslash commands
        result = result.replace(/\\[a-zA-Z]+/g, '');
        
        // Clean up braces
        result = result.replace(/[{}]/g, '');
        
        return result;
    }
    
    /**
     * Render markdown content
     * Extracts code blocks BEFORE HTML escaping to preserve raw code for execution
     */
    renderMarkdown(text) {
        if (!text) return '';
        
        // Store code blocks with raw code BEFORE any escaping
        const codeBlockPlaceholders = [];
        const mathBlockPlaceholders = [];
        let blockCounter = 0;
        let mathCounter = 0;
        
        // Extract code blocks first, storing raw code
        let processedText = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const placeholder = `__CODE_BLOCK_${blockCounter}__`;
            const blockId = `code-${Date.now()}-${blockCounter}`;
            const rawCode = code.trim();
            
            // Store raw code for execution
            this._codeBlocks[blockId] = {
                code: rawCode,
                lang: lang || 'text',
                output: null
            };
            
            codeBlockPlaceholders.push({
                placeholder,
                blockId,
                lang: lang || 'text',
                code: rawCode
            });
            
            blockCounter++;
            return placeholder;
        });
        
        // Extract display math ($$...$$) before escaping
        processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
            const placeholder = `__MATH_BLOCK_${mathCounter}__`;
            mathBlockPlaceholders.push({
                placeholder,
                math: math.trim(),
                display: true
            });
            mathCounter++;
            return placeholder;
        });
        
        // Extract inline math (\(...\)) before escaping
        processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
            const placeholder = `__MATH_INLINE_${mathCounter}__`;
            mathBlockPlaceholders.push({
                placeholder,
                math: math.trim(),
                display: false
            });
            mathCounter++;
            return placeholder;
        });
        
        // Extract inline math ($...$) - but be careful with currency
        processedText = processedText.replace(/\$([^$\n]+)\$/g, (match, math) => {
            // Skip if it looks like currency
            if (/^\d+(\.\d{2})?$/.test(math.trim())) {
                return match;
            }
            const placeholder = `__MATH_INLINE_${mathCounter}__`;
            mathBlockPlaceholders.push({
                placeholder,
                math: math.trim(),
                display: false
            });
            mathCounter++;
            return placeholder;
        });
        
        // Now escape the rest of the text (but placeholders are safe)
        let html = this.escapeHtml(processedText);
        
        // Headers (must come before line breaks) - match at start of line
        html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Horizontal rule (must come before line breaks)
        html = html.replace(/^---+$/gm, '<hr>');
        html = html.replace(/^\*\*\*+$/gm, '<hr>');
        html = html.replace(/^___+$/gm, '<hr>');
        
        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Replace placeholders with rendered code blocks
        for (const block of codeBlockPlaceholders) {
            const isJS = ['javascript', 'js', 'typescript', 'ts'].includes(block.lang.toLowerCase());
            const escapedCode = this.escapeHtml(block.code);
            const highlightedCode = isJS ? this.highlightJS(escapedCode) : escapedCode;
            
            const codeBlockHtml = `
                <div class="code-block-container" data-block-id="${block.blockId}">
                    <div class="code-block-header">
                        <span class="code-block-lang">${block.lang || 'code'}</span>
                        <div class="code-block-actions">
                            <button class="code-action-btn copy-btn" data-block-id="${block.blockId}" title="Copy code">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                Copy
                            </button>
                            ${isJS ? `
                                <button class="code-action-btn run-btn" data-block-id="${block.blockId}" title="Run code">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    Run
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <pre class="code-block-pre"><code>${highlightedCode}</code></pre>
                    <div class="code-output" id="output-${block.blockId}" style="display: none;"></div>
                </div>
            `;
            
            html = html.replace(block.placeholder, codeBlockHtml);
        }
        
        // Replace math placeholders
        for (const mathBlock of mathBlockPlaceholders) {
            const renderedMath = this.renderMath(mathBlock.math);
            if (mathBlock.display) {
                html = html.replace(mathBlock.placeholder, `<div class="math-block">${renderedMath}</div>`);
            } else {
                html = html.replace(mathBlock.placeholder, `<span class="math-inline">${renderedMath}</span>`);
            }
        }
        
        // Inline code (after we've handled block code)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Line breaks (but not for block elements that already have breaks)
        html = html.replace(/\n/g, '<br>');
        
        // Clean up extra line breaks around block elements
        html = html.replace(/<br>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<br>/g, '$1');
        html = html.replace(/<br>(<hr>)/g, '$1');
        html = html.replace(/(<hr>)<br>/g, '$1');
        html = html.replace(/<br>(<div class="code-block)/g, '$1');
        html = html.replace(/(<\/div>)<br>(<div class="code-block)/g, '$1$2');
        html = html.replace(/<br>(<div class="math-block)/g, '$1');
        html = html.replace(/(<\/div>)<br>/g, '$1');
        html = html.replace(/<br>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<br>/g, '$1');
        
        return html;
    }
    
    /**
     * Run a code block
     */
    runCodeBlock(blockId) {
        const block = this._codeBlocks[blockId];
        if (!block) {
            console.error('Code block not found:', blockId);
            return;
        }
        
        const runBtn = this.$(`.run-btn[data-block-id="${blockId}"]`);
        if (runBtn) {
            runBtn.classList.add('running');
            runBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Running...
            `;
        }
        
        const startTime = performance.now();
        const output = [];
        
        // Create sandboxed console
        const sandboxedConsole = {
            log: (...args) => output.push({ type: 'log', content: args.map(this.formatOutput).join(' ') }),
            info: (...args) => output.push({ type: 'info', content: args.map(this.formatOutput).join(' ') }),
            warn: (...args) => output.push({ type: 'warn', content: args.map(this.formatOutput).join(' ') }),
            error: (...args) => output.push({ type: 'error', content: args.map(this.formatOutput).join(' ') }),
            dir: (...args) => output.push({ type: 'log', content: args.map(a => JSON.stringify(a, null, 2)).join('\n') }),
            table: (data) => output.push({ type: 'log', content: JSON.stringify(data, null, 2) }),
            clear: () => { output.length = 0; }
        };
        
        let result;
        let error = null;
        
        try {
            // Create a function with sandboxed console
            const fn = new Function('console', `
                "use strict";
                ${block.code}
            `);
            result = fn(sandboxedConsole);
            
            if (result !== undefined) {
                output.push({ type: 'result', content: `→ ${this.formatOutput(result)}` });
            }
        } catch (e) {
            error = e;
            output.push({ type: 'error', content: `${e.name}: ${e.message}` });
        }
        
        const duration = performance.now() - startTime;
        
        // Store output
        block.output = output;
        block.duration = duration;
        block.error = error;
        
        // Render output
        this.renderCodeOutput(blockId, output, duration);
        
        // Reset run button
        if (runBtn) {
            runBtn.classList.remove('running');
            runBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Run
            `;
        }
    }
    
    /**
     * Format output value for display
     */
    formatOutput(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch {
                return String(value);
            }
        }
        return String(value);
    }
    
    /**
     * Render code execution output
     */
    renderCodeOutput(blockId, output, duration) {
        const outputEl = this.$(`#output-${blockId}`);
        if (!outputEl) return;
        
        outputEl.style.display = 'block';
        
        const outputLines = output.length > 0
            ? output.map(o => `
                <div class="output-line ${o.type}">
                    ${o.type === 'result' ? '' : `<span class="output-prefix">${this.getOutputPrefix(o.type)}</span>`}
                    <span>${this.escapeHtml(o.content)}</span>
                </div>
            `).join('')
            : '<div class="output-empty">No output</div>';
        
        outputEl.innerHTML = `
            <div class="code-output-header">
                <span class="code-output-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="4 17 10 11 4 5"/>
                        <line x1="12" y1="19" x2="20" y2="19"/>
                    </svg>
                    Output
                </span>
                <span class="code-output-clear" data-block-id="${blockId}">Clear</span>
            </div>
            <div class="code-output-content">
                ${outputLines}
                <div class="output-time">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Completed in ${duration.toFixed(2)}ms
                </div>
            </div>
        `;
        
        // Re-attach clear button listener
        const clearBtn = outputEl.querySelector('.code-output-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearCodeOutput(blockId);
            });
        }
    }
    
    /**
     * Get output prefix icon
     */
    getOutputPrefix(type) {
        switch (type) {
            case 'info': return 'ℹ';
            case 'warn': return '⚠';
            case 'error': return '✗';
            case 'result': return '→';
            default: return '›';
        }
    }
    
    /**
     * Clear code output
     */
    clearCodeOutput(blockId) {
        const outputEl = this.$(`#output-${blockId}`);
        if (outputEl) {
            outputEl.style.display = 'none';
            outputEl.innerHTML = '';
        }
        
        if (this._codeBlocks[blockId]) {
            this._codeBlocks[blockId].output = null;
        }
    }
    
    /**
     * Copy code block content
     */
    async copyCodeBlock(blockId) {
        const block = this._codeBlocks[blockId];
        if (!block) return;
        
        try {
            await navigator.clipboard.writeText(block.code);
            
            // Visual feedback
            const btn = this.$(`.copy-btn[data-block-id="${blockId}"]`);
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                `;
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 1500);
            }
            
            this.emit('toast', { message: 'Code copied to clipboard' });
        } catch (err) {
            this.emit('error', { message: 'Failed to copy code' });
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

defineComponent('chat-message', ChatMessage);