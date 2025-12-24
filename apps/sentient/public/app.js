/**
 * Sentient Observer Web UI
 */

class SentientUI {
    constructor() {
        // Elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.coherenceEl = document.getElementById('coherence');
        this.entropyEl = document.getElementById('entropy');
        this.momentsEl = document.getElementById('moments');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.smfAxes = document.getElementById('smfAxes');
        this.oscillatorViz = document.getElementById('oscillatorViz');
        this.activeOsc = document.getElementById('activeOsc');
        this.oscEnergy = document.getElementById('oscEnergy');
        this.momentsList = document.getElementById('momentsList');
        this.goalsList = document.getElementById('goalsList');
        
        // State
        this.isConnected = false;
        this.isProcessing = false;
        this.statusStream = null;
        this.momentStream = null;
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Set up form handler
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Connect to streams
        this.connectStatusStream();
        this.connectMomentStream();
        
        // Load initial data
        await this.loadInitialData();
        
        // Poll for updates
        this.startPolling();
    }
    
    connectStatusStream() {
        this.statusStream = new EventSource('/stream/status');
        
        this.statusStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'status') {
                    this.updateStatus(data.data);
                }
            } catch (err) {
                console.error('Status stream error:', err);
            }
        };
        
        this.statusStream.onopen = () => {
            this.setConnected(true);
        };
        
        this.statusStream.onerror = () => {
            this.setConnected(false);
            // Reconnect after 3 seconds
            setTimeout(() => this.connectStatusStream(), 3000);
        };
    }
    
    connectMomentStream() {
        this.momentStream = new EventSource('/stream/moments');
        
        this.momentStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'moment') {
                    this.addMoment(data.data);
                }
            } catch (err) {
                console.error('Moment stream error:', err);
            }
        };
    }
    
    setConnected(connected) {
        this.isConnected = connected;
        this.statusIndicator.className = 'status-indicator ' + (connected ? 'connected' : 'disconnected');
        this.statusText.textContent = connected ? 'Connected' : 'Disconnected';
    }
    
    updateStatus(data) {
        this.coherenceEl.textContent = (data.coherence * 100).toFixed(1) + '%';
        this.entropyEl.textContent = (data.entropy * 100).toFixed(1) + '%';
        this.momentsEl.textContent = data.momentCount;
    }
    
    async loadInitialData() {
        try {
            // Load SMF
            const smfRes = await fetch('/smf');
            const smf = await smfRes.json();
            this.renderSMF(smf);
            
            // Load oscillators
            const oscRes = await fetch('/oscillators');
            const osc = await oscRes.json();
            this.renderOscillators(osc);
            
            // Load moments
            const momRes = await fetch('/moments?count=5');
            const mom = await momRes.json();
            this.renderMoments(mom.moments);
            
            // Load goals
            const goalsRes = await fetch('/goals');
            const goals = await goalsRes.json();
            this.renderGoals(goals);
            
            // Load chat history
            const histRes = await fetch('/history');
            const hist = await histRes.json();
            this.renderHistory(hist.messages);
            
        } catch (err) {
            console.error('Failed to load initial data:', err);
        }
    }
    
    startPolling() {
        // Poll for SMF, oscillators, goals every 2 seconds
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const [smf, osc, goals] = await Promise.all([
                    fetch('/smf').then(r => r.json()),
                    fetch('/oscillators').then(r => r.json()),
                    fetch('/goals').then(r => r.json())
                ]);
                
                this.renderSMF(smf);
                this.renderOscillators(osc);
                this.renderGoals(goals);
            } catch (err) {
                // Ignore polling errors
            }
        }, 2000);
    }
    
    renderSMF(smf) {
        if (!smf.orientation) return;
        
        const axes = smf.axes || Object.keys(smf.orientation);
        const html = axes.map(axis => {
            const value = smf.orientation[axis] || 0;
            const absValue = Math.abs(value);
            const isPositive = value >= 0;
            const width = Math.min(50, absValue * 50);
            
            return `
                <div class="smf-axis">
                    <span class="smf-axis-name" title="${axis}">${axis}</span>
                    <div class="smf-axis-bar">
                        <div class="smf-axis-bar-fill ${isPositive ? 'positive' : 'negative'}" 
                             style="width: ${width}%"></div>
                    </div>
                    <span class="smf-axis-value">${value.toFixed(3)}</span>
                </div>
            `;
        }).join('');
        
        this.smfAxes.innerHTML = html;
    }
    
    renderOscillators(osc) {
        // Create 64 dots for oscillators
        const dots = [];
        const topOsc = new Map();
        
        if (osc.topOscillators) {
            osc.topOscillators.forEach(o => topOsc.set(o.prime, o.amplitude));
        }
        
        for (let i = 0; i < 64; i++) {
            const prime = this.nthPrime(i);
            const amp = topOsc.get(prime) || 0;
            let cls = 'oscillator-dot';
            if (amp > 0.5) cls += ' high';
            else if (amp > 0.1) cls += ' active';
            dots.push(`<div class="${cls}" title="p=${prime}, A=${amp.toFixed(2)}"></div>`);
        }
        
        this.oscillatorViz.innerHTML = dots.join('');
        this.activeOsc.textContent = osc.active || '--';
        this.oscEnergy.textContent = osc.energy?.toFixed(2) || '--';
    }
    
    nthPrime(n) {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
                       73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
                       157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
                       239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311];
        return primes[n] || 2;
    }
    
    renderMoments(moments) {
        if (!moments || moments.length === 0) {
            this.momentsList.innerHTML = '<div class="moment-item"><span class="moment-details">No moments yet</span></div>';
            return;
        }
        
        const html = moments.slice(0, 5).map(m => {
            const icon = m.trigger === 'coherence' ? '🎯' :
                        m.trigger === 'entropy_extreme' ? '⚡' :
                        m.trigger === 'phase_transition' ? '🌊' : '📍';
            
            return `
                <div class="moment-item">
                    <span class="moment-icon">${icon}</span>
                    <div class="moment-details">
                        <div class="moment-trigger">${m.trigger}</div>
                        <div class="moment-stats">C=${(m.coherence * 100).toFixed(0)}% H=${(m.entropy * 100).toFixed(0)}%</div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.momentsList.innerHTML = html;
    }
    
    addMoment(moment) {
        const icon = moment.trigger === 'coherence' ? '🎯' :
                    moment.trigger === 'entropy_extreme' ? '⚡' :
                    moment.trigger === 'phase_transition' ? '🌊' : '📍';
        
        const item = document.createElement('div');
        item.className = 'moment-item';
        item.innerHTML = `
            <span class="moment-icon">${icon}</span>
            <div class="moment-details">
                <div class="moment-trigger">${moment.trigger}</div>
                <div class="moment-stats">C=${(moment.coherence * 100).toFixed(0)}% H=${(moment.entropy * 100).toFixed(0)}%</div>
            </div>
        `;
        
        this.momentsList.insertBefore(item, this.momentsList.firstChild);
        
        // Keep only 5 items
        while (this.momentsList.children.length > 5) {
            this.momentsList.removeChild(this.momentsList.lastChild);
        }
    }
    
    renderGoals(goals) {
        let html = '';
        
        if (goals.topGoal) {
            const progress = (goals.topGoal.progress * 100).toFixed(0);
            html += `
                <div class="goal-item">
                    <div class="goal-description">${this.escapeHtml(goals.topGoal.description)}</div>
                    <div class="goal-progress">
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }
        
        if (goals.topFocus) {
            html += `
                <div class="focus-item">
                    🎯 ${this.escapeHtml(goals.topFocus.target)} (${goals.topFocus.type})
                </div>
            `;
        }
        
        if (!html) {
            html = '<div class="focus-item">No active goals</div>';
        }
        
        this.goalsList.innerHTML = html;
    }
    
    renderHistory(messages) {
        if (!messages || messages.length === 0) return;
        
        // Show last 20 messages
        messages.slice(-20).forEach(msg => {
            this.addMessage(msg.role, msg.content, false);
        });
        
        this.scrollToBottom();
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;
        
        this.messageInput.value = '';
        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        // Add user message
        this.addMessage('user', message);
        
        // Add assistant placeholder
        const assistantMsg = this.addMessage('assistant', '', true);
        const contentEl = assistantMsg.querySelector('.message-content');
        
        try {
            // Stream response
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, stream: true })
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete events
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.chunk) {
                                fullResponse += data.chunk;
                                contentEl.textContent = fullResponse;
                                this.scrollToBottom();
                            }
                            
                            if (data.done && data.observer) {
                                // Update status from response
                                this.updateStatus({
                                    coherence: data.observer.coherence,
                                    entropy: data.observer.entropy,
                                    momentCount: data.observer.momentCount
                                });
                            }
                        } catch (parseErr) {
                            // Ignore parse errors
                        }
                    }
                }
            }
            
            // Add meta info
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.innerHTML = `<span>${new Date().toLocaleTimeString()}</span>`;
            assistantMsg.appendChild(meta);
            
        } catch (err) {
            contentEl.textContent = `Error: ${err.message}`;
        }
        
        this.isProcessing = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
    }
    
    addMessage(role, content, isStreaming = false) {
        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        
        const avatar = role === 'user' ? '👤' : '🌌';
        
        msg.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${isStreaming ? '' : this.escapeHtml(content)}</div>
        `;
        
        if (!isStreaming && content) {
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.innerHTML = `<span>${new Date().toLocaleTimeString()}</span>`;
            msg.appendChild(meta);
        }
        
        this.chatMessages.appendChild(msg);
        this.scrollToBottom();
        
        return msg;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sentientUI = new SentientUI();
});