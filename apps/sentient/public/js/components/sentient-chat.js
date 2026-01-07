/**
 * Sentient Chat Component
 * 
 * Full chat container with:
 * - Message list with scrolling
 * - Input form with auto-resize
 * - Command palette integration
 * - Streaming support
 * - History loading
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';
import './chat-message.js';
import './command-palette.js';

export class SentientChat extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            isProcessing: false,
            messages: []
        };
        
        this.nextServerIndex = 0;
        this.abortController = null;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--bg-primary);
            }
            
            .chat-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .messages-container {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-md);
            }
            
            .welcome-message {
                text-align: center;
                padding: var(--space-xl);
                color: var(--text-secondary);
            }
            
            .welcome-title {
                font-size: 1.2rem;
                font-weight: 600;
                margin-bottom: var(--space-sm);
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .welcome-subtitle {
                font-size: 0.85rem;
                color: var(--text-dim);
            }
            
            .input-container {
                position: relative;
                padding: var(--space-md);
                background: var(--bg-secondary);
                border-top: 1px solid var(--border-color);
            }
            
            .chat-form {
                display: flex;
                gap: var(--space-sm);
            }
            
            .chat-textarea {
                flex: 1;
                min-height: 44px;
                max-height: 200px;
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 0.9rem;
                resize: none;
                transition: border-color var(--transition-fast);
            }
            
            .chat-textarea:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            
            .chat-textarea::placeholder {
                color: var(--text-dim);
            }
            
            .chat-actions {
                display: flex;
                gap: var(--space-xs);
            }
            
            .chat-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                border-radius: var(--radius-md);
                background: var(--accent-primary);
                color: white;
                transition: all var(--transition-fast);
            }
            
            .chat-btn:hover:not(:disabled) {
                background: var(--accent-secondary);
                transform: translateY(-1px);
            }
            
            .chat-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .chat-btn svg {
                width: 20px;
                height: 20px;
            }
            
            .clear-btn {
                background: var(--bg-tertiary);
                color: var(--text-secondary);
            }
            
            .clear-btn:hover:not(:disabled) {
                background: var(--error);
                color: white;
            }
            
            .send-btn.stop-mode {
                background: var(--error);
            }
            
            .send-btn.stop-mode:hover:not(:disabled) {
                background: #dc2626;
            }
            
            /* Toast container */
            .toast-container {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }
            
            .toast {
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-panel);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 0.8rem;
                animation: slideIn var(--transition-fast);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
        `;
    }
    
    template() {
        return `
            <div class="chat-container">
                <div class="messages-container" id="messagesContainer">
                    <div class="welcome-message" id="welcome">
                        <div class="welcome-title">◈ Sentient Observer</div>
                        <div class="welcome-subtitle">Type a message or use / for commands</div>
                    </div>
                </div>
                
                <div class="input-container">
                    <command-palette id="commandPalette"></command-palette>
                    <form class="chat-form" id="chatForm">
                        <textarea
                            class="chat-textarea"
                            id="chatInput"
                            placeholder="Type a message or / for commands..."
                            rows="1"
                        ></textarea>
                        <div class="chat-actions">
                            <button type="button" class="chat-btn clear-btn" id="clearBtn" title="Clear history">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                            </button>
                            <button type="submit" class="chat-btn send-btn" id="sendBtn" title="Send message">
                                <svg class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                                <svg class="stop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
                
                <div class="toast-container" id="toastContainer"></div>
            </div>
        `;
    }
    
    onMount() {
        // Cache element references
        this.cacheElements();
    }
    
    cacheElements() {
        this.messagesContainer = this.$('#messagesContainer');
        this.chatForm = this.$('#chatForm');
        this.chatInput = this.$('#chatInput');
        this.sendBtn = this.$('#sendBtn');
        this.clearBtn = this.$('#clearBtn');
        this.commandPalette = this.$('#commandPalette');
        this.toastContainer = this.$('#toastContainer');
    }
    
    setupEventListeners() {
        // Ensure elements are cached before setting up listeners
        this.cacheElements();
        
        // Form submission
        if (this.chatForm) {
            this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Send button click handler - handles both send and stop
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this._state.isProcessing) {
                    this.handleStop();
                } else {
                    this.handleSubmit(new Event('submit'));
                }
            });
        }
        
        // Input handling
        if (this.chatInput) {
            this.chatInput.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.handleInputChange();
            });
            
            this.chatInput.addEventListener('keydown', (e) => {
                // Let command palette handle if visible
                if (this.commandPalette?.isVisible) {
                    if (this.commandPalette.handleKeydown(e)) {
                        return;
                    }
                }
                
                // Enter without shift submits
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSubmit(new Event('submit'));
                }
            });
            
            // Hide palette on blur
            this.chatInput.addEventListener('blur', () => {
                setTimeout(() => this.commandPalette?.hide(), 200);
            });
        }
        
        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.handleClear());
        }
        
        // Command palette selection
        if (this.commandPalette) {
            this.commandPalette.addEventListener('command-select', (e) => {
                const { command, hasArg } = e.detail;
                if (this.chatInput) {
                    this.chatInput.value = hasArg ? command + ' ' : command;
                    this.chatInput.focus();
                    
                    if (!hasArg) {
                        this.handleSubmit(new Event('submit'));
                    }
                }
            });
        }
        
        // Listen for message events from child components
        this.addEventListener('message-delete', (e) => this.handleMessageDelete(e.detail));
        this.addEventListener('message-edit', (e) => this.handleMessageEdit(e.detail));
        this.addEventListener('message-rerun', (e) => this.handleMessageRerun(e.detail));
        this.addEventListener('toast', (e) => this.showToast(e.detail.message));
        
        // Listen for next step button clicks
        this.addEventListener('next-step-click', (e) => this.handleNextStepClick(e.detail));
    }
    
    handleInputChange() {
        const value = this.chatInput?.value || '';
        
        if (value.startsWith('/')) {
            this.commandPalette?.show(value);
        } else {
            this.commandPalette?.hide();
        }
    }
    
    autoResizeTextarea() {
        if (!this.chatInput) return;
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 200) + 'px';
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    /**
     * Add a message to the chat
     */
    addMessage(role, content, streaming = false, serverIndex = null) {
        const msg = document.createElement('chat-message');
        msg.setAttribute('role', role);
        msg.setAttribute('content', content);
        msg.setAttribute('timestamp', new Date().toLocaleTimeString());
        
        if (streaming) {
            msg.setAttribute('streaming', '');
        }
        
        if (serverIndex !== null) {
            msg.setAttribute('server-index', serverIndex.toString());
        }
        
        this.messagesContainer?.appendChild(msg);
        this.scrollToBottom();
        
        return msg;
    }
    
    /**
     * Update send button appearance based on processing state
     */
    updateSendButton() {
        if (!this.sendBtn) return;
        
        const sendIcon = this.sendBtn.querySelector('.send-icon');
        const stopIcon = this.sendBtn.querySelector('.stop-icon');
        
        if (this._state.isProcessing) {
            this.sendBtn.classList.add('stop-mode');
            this.sendBtn.title = 'Stop generating';
            if (sendIcon) sendIcon.style.display = 'none';
            if (stopIcon) stopIcon.style.display = 'block';
        } else {
            this.sendBtn.classList.remove('stop-mode');
            this.sendBtn.title = 'Send message';
            if (sendIcon) sendIcon.style.display = 'block';
            if (stopIcon) stopIcon.style.display = 'none';
        }
    }
    
    /**
     * Handle stop button click
     */
    handleStop() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            this.showToast('Generation stopped');
        }
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.chatInput?.value.trim();
        if (!message || this._state.isProcessing) return;
        
        // Hide command palette
        this.commandPalette?.hide();
        
        // Check for command
        if (message.startsWith('/')) {
            this.chatInput.value = '';
            this.chatInput.style.height = 'auto';
            await this.handleCommand(message);
            return;
        }
        
        // Clear input
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
        this._state.isProcessing = true;
        this.updateSendButton();
        
        // Add user message
        const userServerIndex = this.nextServerIndex++;
        this.addMessage('user', message, false, userServerIndex);
        
        // Add streaming assistant message
        const assistantServerIndex = this.nextServerIndex++;
        const assistantMsg = this.addMessage('assistant', '', true, assistantServerIndex);
        
        try {
            await this.streamResponse(message, assistantMsg);
        } catch (err) {
            if (err.name === 'AbortError') {
                assistantMsg.finishStreaming(assistantMsg.getAttribute('content') || '[Stopped]', { stopped: true });
            } else {
                assistantMsg.finishStreaming(`Error: ${err.message}`, {});
                this.emit('chat-error', { error: err.message });
            }
        }
        
        this._state.isProcessing = false;
        this.abortController = null;
        this.updateSendButton();
        this.chatInput?.focus();
        this.scrollToBottom();
    }
    
    /**
     * Stream response from server
     */
    async streamResponse(message, msgElement) {
        // Create abort controller for this request
        this.abortController = new AbortController();
        
        const response = await fetch('/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
            signal: this.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        let finalState = null;
        let toolCount = 0;
        let currentEventType = null;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                // Handle named event type (e.g., "event: chunk")
                if (line.startsWith('event: ')) {
                    currentEventType = line.slice(7).trim();
                    continue;
                }
                
                // Handle data line
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        // Process based on event type or data content
                        this.handleSSEEvent(currentEventType, data, msgElement, {
                            fullResponse: () => fullResponse,
                            setFullResponse: (val) => { fullResponse = val; },
                            addToResponse: (val) => { fullResponse += val; },
                            setFinalState: (state) => { finalState = state; },
                            incrementToolCount: () => { toolCount++; },
                            getToolCount: () => toolCount
                        });
                        
                    } catch (parseError) {
                        console.warn('SSE parse error:', parseError, 'line:', line);
                    }
                    
                    // Reset event type after processing
                    currentEventType = null;
                }
            }
        }
    }
    
    /**
     * Handle SSE event based on event type
     */
    handleSSEEvent(eventType, data, msgElement, ctx) {
        // Route by event type first (if we have named events)
        switch (eventType) {
            case 'thinking':
                msgElement.updateStreamingStatus('Connecting to LLM...');
                return;
                
            case 'status':
                if (data.status === 'iteration_start') {
                    msgElement.updateStreamingStatus(data.message || `Step ${data.iteration}...`);
                }
                return;
                
            case 'heartbeat':
                // Keep-alive, update status
                if (data.status === 'executing_tools') {
                    msgElement.updateStreamingStatus(`🔧 Executing tools... (${data.elapsed}s)`);
                }
                return;
                
            case 'chunk':
                const content = data.content || '';
                ctx.addToResponse(content);
                msgElement.updateStreamingContent(ctx.fullResponse());
                const iterInfo = data.iteration > 1 ? ` (step ${data.iteration})` : '';
                msgElement.updateStreamingStatus(`Generating${iterInfo}... (${ctx.fullResponse().length} chars)`);
                this.scrollToBottom();
                return;
                
            case 'tool_call':
                if (data.toolCalls && data.toolCalls.length > 0) {
                    const toolNames = data.toolCalls.map(tc => tc.function?.name || 'unknown').join(', ');
                    msgElement.updateStreamingStatus(`🔧 Calling: ${toolNames}...`);
                }
                return;
                
            case 'tool_exec':
                msgElement.updateStreamingStatus(`🔧 Executing: ${data.tool}...`);
                return;
                
            case 'tool_result':
                ctx.incrementToolCount();
                msgElement.addToolResult(data.tool, data.success, data.content);
                this.scrollToBottom();
                return;
                
            case 'next_steps':
                // Store next steps for later use
                if (data.suggestions) {
                    this._nextSteps = data.suggestions;
                }
                return;
                
            case 'complete':
                ctx.setFinalState(data.state);
                const finalContent = data.response || ctx.fullResponse();
                
                // Get stored next steps and clear them
                const nextSteps = this._nextSteps || [];
                this._nextSteps = null;
                
                msgElement.finishStreaming(finalContent, {
                    coherence: data.state?.coherence,
                    toolCount: ctx.getToolCount(),
                    nextSteps: nextSteps
                });
                
                if (data.state) {
                    this.emit('state-update', { state: data.state });
                }
                return;
                
            case 'error':
                throw new Error(data.error || 'Unknown error');
        }
        
        // Fallback: handle by data content (backward compatibility with non-named events)
        if (data.status === 'starting') {
            msgElement.updateStreamingStatus('Connecting to LLM...');
        } else if (data.status === 'iteration_start') {
            msgElement.updateStreamingStatus(data.message || `Step ${data.iteration}...`);
        } else if (data.content) {
            ctx.addToResponse(data.content);
            msgElement.updateStreamingContent(ctx.fullResponse());
            const iterInfo = data.iteration > 1 ? ` (step ${data.iteration})` : '';
            msgElement.updateStreamingStatus(`Generating${iterInfo}... (${ctx.fullResponse().length} chars)`);
            this.scrollToBottom();
        } else if (data.tool && data.status === 'executing') {
            msgElement.updateStreamingStatus(`🔧 Executing: ${data.tool}...`);
        } else if (data.success !== undefined && data.tool) {
            ctx.incrementToolCount();
            msgElement.addToolResult(data.tool, data.success, data.content);
            this.scrollToBottom();
        } else if (data.response !== undefined) {
            ctx.setFinalState(data.state);
            const finalContent = data.response || ctx.fullResponse();
            
            // Get stored next steps and clear them
            const nextSteps = this._nextSteps || [];
            this._nextSteps = null;
            
            msgElement.finishStreaming(finalContent, {
                coherence: data.state?.coherence,
                toolCount: ctx.getToolCount(),
                nextSteps: nextSteps
            });
            
            if (data.state) {
                this.emit('state-update', { state: data.state });
            }
        } else if (data.error) {
            throw new Error(data.error);
        }
    }
    
    /**
     * Handle command
     */
    async handleCommand(command) {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');
        
        // Add command message
        this.addMessage('system', `Command: ${command}`);
        
        this.emit('command', { command: cmd, args });
    }
    
    /**
     * Handle clear
     */
    async handleClear() {
        if (!confirm('Clear all conversation history?')) return;
        
        try {
            await fetch('/history', { method: 'DELETE' });
            
            // Clear messages except welcome
            const messages = this.messagesContainer?.querySelectorAll('chat-message');
            messages?.forEach(msg => msg.remove());
            
            this.nextServerIndex = 0;
            this.showToast('History cleared');
        } catch (err) {
            this.showToast('Failed to clear history');
        }
    }
    
    /**
     * Handle message deletion
     */
    async handleMessageDelete(detail) {
        const { element, serverIndex } = detail;
        
        try {
            if (serverIndex !== undefined) {
                await fetch('/history/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index: parseInt(serverIndex), count: 1 })
                });
            }
            
            element.remove();
            this.showToast('Message deleted');
        } catch (err) {
            this.showToast('Delete failed');
        }
    }
    
    /**
     * Handle message edit
     */
    async handleMessageEdit(detail) {
        const { element, newContent } = detail;
        
        // Remove all messages after this one
        let sibling = element.nextElementSibling;
        while (sibling) {
            const next = sibling.nextElementSibling;
            sibling.remove();
            sibling = next;
        }
        
        // Remove the edited message
        element.remove();
        
        // Submit new content
        if (this.chatInput) {
            this.chatInput.value = newContent;
            this.chatForm?.dispatchEvent(new Event('submit'));
        }
    }
    
    /**
     * Handle message rerun
     */
    async handleMessageRerun(detail) {
        const { element, content } = detail;
        
        if (this._state.isProcessing) return;
        
        // Remove messages after this one
        let sibling = element.nextElementSibling;
        while (sibling) {
            const next = sibling.nextElementSibling;
            sibling.remove();
            sibling = next;
        }
        
        // Generate new response
        this._state.isProcessing = true;
        this.updateSendButton();
        
        const assistantServerIndex = this.nextServerIndex++;
        const assistantMsg = this.addMessage('assistant', '', true, assistantServerIndex);
        
        try {
            await this.streamResponse(content, assistantMsg);
        } catch (err) {
            if (err.name === 'AbortError') {
                assistantMsg.finishStreaming(assistantMsg.getAttribute('content') || '[Stopped]', { stopped: true });
            } else {
                assistantMsg.finishStreaming(`Error: ${err.message}`, {});
            }
        }
        
        this._state.isProcessing = false;
        this.abortController = null;
        this.updateSendButton();
        this.chatInput?.focus();
    }
    
    /**
     * Handle next step button click - sends the step text as a new message
     */
    handleNextStepClick(detail) {
        if (this._state.isProcessing) return;
        
        const { step } = detail;
        if (!step) return;
        
        // Put the step text into the input and submit
        if (this.chatInput) {
            this.chatInput.value = step;
            this.handleSubmit(new Event('submit'));
        }
    }
    
    /**
     * Load history from server
     */
    async loadHistory() {
        try {
            const response = await fetch('/history');
            if (!response.ok) return;
            
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
                const displayMessages = data.messages.slice(-20);
                const startIndex = data.messages.length - displayMessages.length;
                
                displayMessages.forEach((msg, i) => {
                    // Skip messages with empty content
                    if (!msg.content || !msg.content.trim()) {
                        return;
                    }
                    const serverIndex = startIndex + i;
                    this.addMessage(msg.role, msg.content, false, serverIndex);
                });
                
                this.nextServerIndex = data.messages.length;
            }
        } catch (err) {
            console.warn('Failed to load history:', err);
        }
    }
    
    /**
     * Show toast message
     */
    showToast(message) {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }
}

defineComponent('sentient-chat', SentientChat);