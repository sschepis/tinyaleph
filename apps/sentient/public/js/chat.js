/**
 * Sentient Observer - Chat Handler with Streaming Support
 */

import { renderMarkdown, escapeHtml } from './utils.js';

export class ChatHandler {
    constructor(options = {}) {
        this.messagesContainer = options.messagesContainer;
        this.form = options.form;
        this.input = options.input;
        this.sendButton = options.sendButton;
        this.clearButton = options.clearButton;
        
        this.isProcessing = false;
        this.onStateUpdate = options.onStateUpdate || (() => {});
        this.onError = options.onError || (() => {});
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        if (this.input) {
            this.input.addEventListener('input', () => this.autoResizeTextarea());
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.form?.dispatchEvent(new Event('submit'));
                }
            });
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.handleClear());
        }
    }
    
    autoResizeTextarea() {
        if (!this.input) return;
        this.input.style.height = 'auto';
        this.input.style.height = Math.min(this.input.scrollHeight, 200) + 'px';
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    addMessage(role, content, isStreaming = false) {
        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        
        const avatar = role === 'user' ? '👤' : '🌌';
        
        msg.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-body">
                <div class="message-content">${isStreaming ? '' : renderMarkdown(content)}</div>
            </div>
        `;
        
        if (!isStreaming && content) {
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.innerHTML = `<span>${new Date().toLocaleTimeString()}</span>`;
            msg.querySelector('.message-body').appendChild(meta);
        }
        
        this.messagesContainer?.appendChild(msg);
        this.scrollToBottom();
        
        return msg;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.input?.value.trim();
        if (!message || this.isProcessing) return;
        
        this.input.value = '';
        this.input.style.height = 'auto';
        this.isProcessing = true;
        if (this.sendButton) this.sendButton.disabled = true;
        
        // Add user message
        this.addMessage('user', message);
        
        // Add assistant placeholder with streaming structure
        const assistantMsg = this.addMessage('assistant', '', true);
        const contentEl = assistantMsg.querySelector('.message-content');
        
        // Create streaming display structure
        contentEl.innerHTML = `
            <div class="streaming-status">
                <span class="streaming-icon">◐</span>
                <span class="streaming-label">Processing...</span>
            </div>
            <div class="response-content streaming"></div>
            <div class="tool-results-container"></div>
        `;
        
        const streamingStatus = contentEl.querySelector('.streaming-status');
        const streamingIcon = contentEl.querySelector('.streaming-icon');
        const streamingLabel = contentEl.querySelector('.streaming-label');
        const responseContent = contentEl.querySelector('.response-content');
        const toolResultsContainer = contentEl.querySelector('.tool-results-container');
        
        // Spinner animation
        const spinnerFrames = ['◐', '◓', '◑', '◒'];
        let spinnerIndex = 0;
        const spinnerInterval = setInterval(() => {
            spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
            streamingIcon.textContent = spinnerFrames[spinnerIndex];
        }, 150);
        
        try {
            // Use streaming endpoint
            const response = await fetch('/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';
            let chunkCount = 0;
            let toolResults = [];
            let hasTools = false;
            let finalState = null;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete events in buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        const eventType = line.slice(7);
                        continue;
                    }
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.status === 'starting') {
                                streamingLabel.textContent = 'Connecting to LLM...';
                            } else if (data.content) {
                                // Streaming chunk - update response progressively
                                fullResponse += data.content;
                                chunkCount++;
                                
                                // Render markdown progressively
                                responseContent.innerHTML = renderMarkdown(fullResponse);
                                
                                // Update streaming status
                                streamingLabel.textContent = `Generating... (${fullResponse.length} chars)`;
                                
                                // Scroll to see new content
                                this.scrollToBottom();
                            } else if (data.tool) {
                                // Tool execution status
                                if (data.status === 'executing') {
                                    streamingLabel.textContent = `Executing tool: ${data.tool}...`;
                                    hasTools = true;
                                }
                            } else if (data.toolCalls) {
                                // Tool call event (LLM wants to use a tool)
                                streamingLabel.textContent = `Tool requested: ${data.toolCalls.map(tc => tc.function?.name || 'unknown').join(', ')}`;
                                hasTools = true;
                            } else if (data.success !== undefined && data.tool) {
                                // Tool result from server
                                toolResults.push({
                                    tool: data.tool,
                                    success: data.success,
                                    content: data.content
                                });
                                
                                // Display tool result immediately
                                const toolEl = document.createElement('div');
                                toolEl.className = `tool-result ${data.success ? 'success' : 'error'}`;
                                toolEl.innerHTML = `
                                    <div class="tool-header">
                                        <span class="tool-icon">${data.success ? '✓' : '✗'}</span>
                                        <span class="tool-name">${escapeHtml(data.tool)}</span>
                                    </div>
                                    ${data.content ? `<div class="tool-content"><pre>${escapeHtml(data.content)}</pre></div>` : ''}
                                `;
                                toolResultsContainer.appendChild(toolEl);
                                this.scrollToBottom();
                            } else if (data.response !== undefined) {
                                // Complete event - final response
                                if (data.toolResults) toolResults = data.toolResults;
                                if (data.hasTools !== undefined) hasTools = data.hasTools;
                                finalState = data.state;
                                
                                // Use final cleaned response
                                const finalContent = data.response || fullResponse;
                                const hasContent = finalContent && finalContent.trim().length > 0;
                                
                                if (hasContent) {
                                    responseContent.innerHTML = renderMarkdown(finalContent);
                                } else if (toolResults.length > 0) {
                                    responseContent.innerHTML = '<span class="tool-summary">Tools executed successfully.</span>';
                                } else {
                                    responseContent.innerHTML = '<span style="color: var(--text-dim)">No response</span>';
                                }
                                
                                // Show any additional tool results from complete event
                                if (data.toolResults && data.toolResults.length > 0) {
                                    data.toolResults.forEach(result => {
                                        // Only add if not already shown
                                        if (!toolResultsContainer.querySelector(`[data-tool="${result.tool}"]`)) {
                                            const toolEl = document.createElement('div');
                                            toolEl.className = `tool-result ${result.success ? 'success' : 'error'}`;
                                            toolEl.setAttribute('data-tool', result.tool);
                                            toolEl.innerHTML = `
                                                <div class="tool-header">
                                                    <span class="tool-icon">${result.success ? '✓' : '✗'}</span>
                                                    <span class="tool-name">${escapeHtml(result.tool)}</span>
                                                </div>
                                                ${result.content ? `<div class="tool-content"><pre>${escapeHtml(result.content)}</pre></div>` : ''}
                                            `;
                                            toolResultsContainer.appendChild(toolEl);
                                        }
                                    });
                                }
                                
                                // Remove streaming indicator
                                responseContent.classList.remove('streaming');
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (parseError) {
                            console.warn('SSE parse error:', parseError);
                        }
                    }
                }
            }
            
            // Stop spinner
            clearInterval(spinnerInterval);
            
            // Hide streaming status
            streamingStatus.style.display = 'none';
            
            // Add meta info
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.innerHTML = `<span>${new Date().toLocaleTimeString()}</span>`;
            if (finalState) {
                meta.innerHTML += `<span>C: ${(finalState.coherence * 100).toFixed(0)}%</span>`;
            }
            if (hasTools) {
                meta.innerHTML += `<span>🔧 ${toolResults.length} tool${toolResults.length > 1 ? 's' : ''}</span>`;
            }
            assistantMsg.querySelector('.message-body').appendChild(meta);
            
            // Update status
            if (finalState) {
                this.onStateUpdate(finalState);
            }
            
        } catch (err) {
            clearInterval(spinnerInterval);
            responseContent.innerHTML = `<span style="color: var(--error)">Error: ${err.message}</span>`;
            streamingStatus.style.display = 'none';
            this.onError('Chat Error', err.message);
        }
        
        this.isProcessing = false;
        if (this.sendButton) this.sendButton.disabled = false;
        this.input?.focus();
        this.scrollToBottom();
    }
    
    async handleClear() {
        if (!confirm('Clear all conversation history?')) return;
        
        try {
            await fetch('/history', { method: 'DELETE' });
            
            const welcome = this.messagesContainer?.querySelector('.welcome');
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = '';
                if (welcome) {
                    this.messagesContainer.appendChild(welcome);
                }
            }
        } catch (err) {
            this.onError('Error', 'Failed to clear history');
        }
    }
    
    async loadHistory() {
        try {
            const response = await fetch('/history');
            if (!response.ok) return;
            
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
                data.messages.slice(-20).forEach(msg => {
                    this.addMessage(msg.role, msg.content, false);
                });
            }
        } catch (err) {
            console.warn('Failed to load history:', err);
        }
    }
}