
/**
 * Learning Panel Component (Simplified)
 * 
 * Streamlined learning interface with 2 tabs:
 * - Topics: Conversation topics with integrated AI state and curiosity queue
 * - Log: Learning process log for debugging
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class LearningPanel extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            // Learning status
            isRunning: false,
            isPaused: false,
            iterations: 0,
            queriesMade: 0,
            contentIngested: 0,
            
            // Conversation topics
            conversationTopics: [],
            selectedTopic: null,
            focusedTopics: new Set(),
            
            // Curiosity queue
            curiosityQueue: [],
            currentCuriosity: null,
            showCuriosityQueue: false,
            
            // Log
            logEntries: [],
            
            // AI state (inline display)
            mentalState: 'idle',
            emotionalTone: 'neutral',
            
            // UI state - only 2 tabs now
            activeSection: 'topics',
            questionInput: '',
            loading: false
        };
        
        this.eventSource = null;
        this.refreshInterval = null;
        this.topicsRefreshInterval = null;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host { display: block; height: 100%; background: var(--bg-primary); }
            
            .learning-panel { display: flex; flex-direction: column; height: 100%; padding: var(--space-sm); gap: var(--space-sm); }
            
            /* Compact header with controls and stats */
            .header-row { display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap; }
            .control-row { display: flex; gap: var(--space-xs); }
            
            .control-btn {
                padding: var(--space-xs) var(--space-sm); font-size: 0.65rem; font-weight: 500;
                background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);
                color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);
            }
            .control-btn:hover:not(:disabled) { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }
            .control-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .control-btn.active { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }
            .control-btn.danger:hover:not(:disabled) { background: var(--error); border-color: var(--error); }
            
            .stats-inline { display: flex; gap: var(--space-sm); font-size: 0.55rem; color: var(--text-dim); margin-left: auto; }
            .stat-inline { display: flex; align-items: center; gap: 2px; }
            .stat-inline .val { color: var(--accent-primary); font-weight: 600; font-family: var(--font-mono); }
            
            /* Two tabs only */
            .section-tabs { display: flex; gap: 2px; background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 2px; }
            .section-tab { flex: 1; padding: var(--space-xs); font-size: 0.65rem; font-weight: 500; color: var(--text-dim); background: transparent; border: none; border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); text-align: center; }
            .section-tab:hover { color: var(--text-secondary); }
            .section-tab.active { background: var(--bg-secondary); color: var(--accent-primary); }
            
            .content-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
            .section-content { display: none; flex: 1; flex-direction: column; overflow: hidden; }
            .section-content.active { display: flex; }
            
            /* Inline AI state indicator */
            .ai-state-inline { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) var(--space-sm); background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08)); border-radius: var(--radius-sm); margin-bottom: var(--space-sm); }
            .ai-avatar-small { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
            .ai-avatar-small.thinking { animation: thinking-pulse 0.8s ease-in-out infinite; }
            @keyframes thinking-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
            .ai-state-text { flex: 1; font-size: 0.6rem; color: var(--text-secondary); }
            .ai-state-label { font-weight: 600; text-transform: capitalize; }
            .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); }
            .status-dot.running { background: var(--success); animation: pulse 1.5s ease-in-out infinite; }
            .status-dot.paused { background: var(--warning); }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            
            /* Topics Section */
            .topics-section { gap: var(--space-sm); overflow: hidden; }
            .topics-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-xs); }
            .topics-title { font-size: 0.65rem; font-weight: 600; color: var(--text-secondary); }
            .topics-count { font-size: 0.55rem; font-family: var(--font-mono); color: var(--text-dim); }
            .topics-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-xs); }
            
            .topic-item { padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer; transition: all var(--transition-fast); position: relative; }
            .topic-item::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: transparent; border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
            .topic-item.priority-high::before { background: #ef4444; }
            .topic-item.priority-medium::before { background: #f59e0b; }
            .topic-item.priority-low::before { background: #22c55e; }
            .topic-item:hover { border-color: var(--accent-primary); background: var(--bg-tertiary); }
            .topic-item.selected { border-color: var(--accent-primary); background: rgba(59, 130, 246, 0.1); }
            .topic-item.focused { border-color: var(--success); background: rgba(34, 197, 94, 0.1); }
            
            .topic-header { display: flex; align-items: center; gap: var(--space-xs); }
            .topic-name { font-size: 0.7rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
            .topic-priority { font-size: 0.5rem; padding: 2px 6px; border-radius: 8px; font-weight: 600; }
            .topic-priority.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
            .topic-priority.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
            .topic-priority.low { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
            .topic-mentions { font-size: 0.5rem; color: var(--text-dim); }
            
            .topic-actions { display: flex; gap: var(--space-xs); margin-top: var(--space-xs); }
            .topic-action-btn { flex: 1; padding: 3px var(--space-xs); font-size: 0.5rem; background: var(--bg-tertiary); border: none; border-radius: var(--radius-sm); color: var(--text-dim); cursor: pointer; transition: all var(--transition-fast); }
            .topic-action-btn:hover { background: var(--accent-primary); color: white; }
            .topic-action-btn.focus-btn:hover { background: var(--success); }
            
            /* Collapsible Curiosity Queue */
            .curiosity-toggle { display: flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-sm); background: var(--bg-tertiary); border: none; border-radius: var(--radius-sm); color: var(--text-dim); cursor: pointer; font-size: 0.6rem; width: 100%; margin-bottom: var(--space-sm); }
            .curiosity-toggle:hover { color: var(--text-secondary); }
            .curiosity-toggle .arrow { transition: transform var(--transition-fast); }
            .curiosity-toggle.expanded .arrow { transform: rotate(90deg); }
            
            .curiosity-section { display: none; padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: var(--space-sm); }
            .curiosity-section.show { display: block; }
            .curiosity-current { padding: var(--space-xs); background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border-radius: var(--radius-sm); margin-bottom: var(--space-xs); }
            .curiosity-label { font-size: 0.5rem; color: var(--text-dim); text-transform: uppercase; }
            .curiosity-topic { font-size: 0.65rem; color: var(--text-primary); }
            .queue-list { display: flex; flex-direction: column; gap: 2px; max-height: 100px; overflow-y: auto; }
            .queue-item { display: flex; align-items: center; gap: var(--space-xs); padding: 2px var(--space-xs); font-size: 0.55rem; color: var(--text-dim); }
            .queue-position { font-family: var(--font-mono); width: 16px; }
            .queue-content { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            
            /* Question Input */
            .question-input-section { padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); }
            .question-input-row { display: flex; gap: var(--space-xs); }
            .question-input { flex: 1; padding: var(--space-xs) var(--space-sm); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 0.6rem; outline: none; }
            .question-input:focus { border-color: var(--accent-primary); }
            .question-input::placeholder { color: var(--text-dim); }
            .question-submit { padding: var(--space-xs) var(--space-sm); background: var(--accent-primary); border: none; border-radius: var(--radius-sm); color: white; font-size: 0.6rem; cursor: pointer; }
            .question-submit:hover { background: var(--accent-secondary); }
            .question-submit:disabled { opacity: 0.5; cursor: not-allowed; }
            
            /* Log Section */
            .log-section { gap: var(--space-sm); }
            .log-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; background: var(--bg-secondary); border-radius: var(--radius-sm); padding: var(--space-xs); }
            .log-entry { padding: 2px var(--space-xs); font-size: 0.5rem; font-family: var(--font-mono); border-left: 2px solid transparent; }
            .log-entry.curiosity { border-left-color: var(--accent-primary); }
            .log-entry.question { border-left-color: var(--accent-secondary); }
            .log-entry.answer { border-left-color: var(--success); }
            .log-entry.memory { border-left-color: var(--warning); }
            .log-entry.reflection { border-left-color: #e879f9; }
            .log-entry.error { border-left-color: var(--error); }
            .log-entry.session { border-left-color: var(--accent-primary); }
            .log-entry.topic { border-left-color: #f472b6; }
            .log-time { color: var(--text-dim); margin-right: var(--space-xs); }
            .log-type { color: var(--text-secondary); font-weight: 500; margin-right: var(--space-xs); }
            .log-message { color: var(--text-secondary); }
            
            .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-md); text-align: center; }
            .empty-icon { font-size: 1.5rem; margin-bottom: var(--space-xs); opacity: 0.5; }
            .empty-text { font-size: 0.6rem; color: var(--text-dim); }
        `;
    }
    
    template() {
        const { isRunning, isPaused, iterations, queriesMade, contentIngested, activeSection, mentalState } = this._state;
        const stateEmoji = { idle: '😴', curious: '🤔', questioning: '❓', reflecting: '🪞', learning: '📚', satisfied: '✨' };
        const stateLabels = { idle: 'Idle', curious: 'Curious', questioning: 'Questioning', reflecting: 'Reflecting', learning: 'Learning', satisfied: 'Satisfied' };
        
        return `
            <div class="learning-panel">
                <!-- Compact header row -->
                <div class="header-row">
                    <div class="control-row">
                        <button class="control-btn ${isRunning && !isPaused ? 'active' : ''}" id="startBtn" ${isRunning ? 'disabled' : ''}>▶</button>
                        <button class="control-btn ${isPaused ? 'active' : ''}" id="pauseBtn" ${!isRunning ? 'disabled' : ''}>${isPaused ? '▶' : '⏸'}</button>
                        <button class="control-btn danger" id="stopBtn" ${!isRunning ? 'disabled' : ''}>⏹</button>
                    </div>
                    <div class="ai-avatar-small ${isRunning ? 'thinking' : ''}">${stateEmoji[mentalState] || '🧠'}</div>
                    <span class="ai-state-label">${stateLabels[mentalState] || 'Idle'}</span>
                    <div class="status-dot ${isRunning ? (isPaused ? 'paused' : 'running') : ''}"></div>
                    <div class="stats-inline">
                        <span class="stat-inline"><span class="val">${iterations}</span> iter</span>
                        <span class="stat-inline"><span class="val">${queriesMade}</span> Q</span>
                        <span class="stat-inline"><span class="val">${contentIngested}</span> 📥</span>
                    </div>
                </div>
                
                <!-- Two tabs only -->
                <div class="section-tabs">
                    <button class="section-tab ${activeSection === 'topics' ? 'active' : ''}" data-section="topics">💬 Topics</button>
                    <button class="section-tab ${activeSection === 'log' ? 'active' : ''}" data-section="log">📝 Log</button>
                </div>
                
                <div class="content-area">
                    ${this.renderTopicsSection()}
                    ${this.renderLogSection()}
                </div>
                
                <!-- Question input always visible -->
                <div class="question-input-section">
                    <div class="question-input-row">
                        <input type="text" class="question-input" placeholder="Add question to explore..." value="${this._state.questionInput}" id="questionInput">
                        <button class="question-submit" id="submitQuestion" ${!this._state.questionInput.trim() ? 'disabled' : ''}>Add</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTopicsSection() {
        const { activeSection, conversationTopics, selectedTopic, curiosityQueue, currentCuriosity, showCuriosityQueue } = this._state;
        const sortedTopics = [...conversationTopics].sort((a, b) => (b.focused ? 1 : 0) - (a.focused ? 1 : 0) || (b.mentionCount || 0) - (a.mentionCount || 0));
        
        return `
            <div class="section-content topics-section ${activeSection === 'topics' ? 'active' : ''}">
                <!-- Collapsible curiosity queue -->
                <button class="curiosity-toggle ${showCuriosityQueue ? 'expanded' : ''}" id="curiosityToggle">
                    <span class="arrow">▶</span>
                    <span>🔮 Curiosity Queue (${curiosityQueue.length})</span>
                    ${currentCuriosity ? `<span style="margin-left: auto; color: var(--accent-primary);">Active: ${this.escapeHtml((currentCuriosity.topic || '').substring(0, 20))}...</span>` : ''}
                </button>
                
                <div class="curiosity-section ${showCuriosityQueue ? 'show' : ''}" id="curiositySection">
                    ${currentCuriosity ? `
                        <div class="curiosity-current">
                            <div class="curiosity-label">🔮 Current Focus</div>
                            <div class="curiosity-topic">${this.escapeHtml(currentCuriosity.topic || 'Exploring...')}</div>
                        </div>
                    ` : ''}
                    <div class="queue-list">
                        ${curiosityQueue.length === 0 ? '<div class="queue-item" style="opacity:0.5;">No items in queue</div>' : 
                            curiosityQueue.slice(0, 5).map((item, i) => `
                                <div class="queue-item">
                                    <span class="queue-position">#${i + 1}</span>
                                    <span class="queue-content">${this.escapeHtml(item.topic || item.suggestedQuery || 'Unknown')}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
                
                <!-- Topics header -->
                <div class="topics-header">
                    <span class="topics-title">Conversation Topics</span>
                    <span class="topics-count">${sortedTopics.length} tracked</span>
                </div>
                
                <!-- Topics list -->
                <div class="topics-list">
                    ${sortedTopics.length === 0 ? `
                        <div class="empty-state">
                            <span class="empty-icon">💬</span>
                            <span class="empty-text">Chat to discover topics</span>
                        </div>
                    ` : sortedTopics.map(topic => {
                        const priorityClass = (topic.mentionCount || 1) >= 3 ? 'high' : (topic.mentionCount || 1) >= 2 ? 'medium' : 'low';
                        const priorityLabel = (topic.mentionCount || 1) >= 3 ? 'HIGH' : (topic.mentionCount || 1) >= 2 ? 'MED' : 'LOW';
                        return `
                            <div class="topic-item priority-${priorityClass} ${selectedTopic?.id === topic.id ? 'selected' : ''} ${topic.focused ? 'focused' : ''}" data-topic-id="${topic.id}">
                                <div class="topic-header">
                                    <span class="topic-name">${this.escapeHtml(topic.topic)}</span>
                                    <span class="topic-priority ${priorityClass}">${priorityLabel}</span>
                                    <span class="topic-mentions">${topic.mentionCount || 1}x</span>
                                </div>
                                <div class="topic-actions">
                                    <button class="topic-action-btn focus-btn" data-action="focus" data-topic="${this.escapeHtml(topic.topic)}">${topic.focused ? '✓ Focused' : '🎯 Focus'}</button>
                                    <button class="topic-action-btn" data-action="explore" data-topic="${this.escapeHtml(topic.topic)}">🔍 Explore</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    renderLogSection() {
        const { activeSection, logEntries } = this._state;
        return `
            <div class="section-content log-section ${activeSection === 'log' ? 'active' : ''}">
                <div class="log-list" id="logList">
                    ${logEntries.length === 0 ? 
                        '<div class="log-entry" style="opacity: 0.5;">Start learning to see activity...</div>' : 
                        logEntries.slice(0, 50).map(entry => `
                            <div class="log-entry ${entry.type}">
                                <span class="log-time">${this.formatTime(entry.timestamp)}</span>
                                <span class="log-type">[${entry.type}]</span>
                                <span class="log-message">${this.escapeHtml(entry.message)}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }
    
    onMount() {
        this.setupEventListeners();
        this.connectToLearningStream();
        this.loadInitialData();
        this.refreshInterval = setInterval(() => this.loadTopicsAndQueue(), 5000);
        this.topicsRefreshInterval = setInterval(() => { if (this._state.isRunning) this.loadTopicsFromAPI(); }, 2000);
    }
    
    onUnmount() {
        if (this.eventSource) { this.eventSource.close(); this.eventSource = null; }
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        if (this.topicsRefreshInterval) clearInterval(this.topicsRefreshInterval);
    }
    
    setupEventListeners() {
        this.$('#startBtn')?.addEventListener('click', () => this.startLearning());
        this.$('#pauseBtn')?.addEventListener('click', () => this.togglePause());
        this.$('#stopBtn')?.addEventListener('click', () => this.stopLearning());
        
        // Tab switching
        this.$$('.section-tab').forEach(tab => tab.addEventListener('click', () => { 
            this._state.activeSection = tab.dataset.section; 
            this.updateSectionTabs(); 
        }));
        
        // Curiosity toggle
        this.$('#curiosityToggle')?.addEventListener('click', () => {
            this._state.showCuriosityQueue = !this._state.showCuriosityQueue;
            this.updateTopicsSection();
        });
        
        // Question input
        const questionInput = this.$('#questionInput');
        if (questionInput) {
            questionInput.addEventListener('input', (e) => { this._state.questionInput = e.target.value; this.updateSubmitButton(); });
            questionInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && this._state.questionInput.trim()) this.submitQuestion(); });
        }
        this.$('#submitQuestion')?.addEventListener('click', () => this.submitQuestion());
        
        // Topic actions
        this.addEventListener('click', (e) => {
            const topicItem = e.target.closest('.topic-item');
            if (topicItem && !e.target.closest('.topic-action-btn')) { 
                this._state.selectedTopic = this._state.conversationTopics.find(t => t.id === topicItem.dataset.topicId); 
                this.updateTopicsSection(); 
            }
            const actionBtn = e.target.closest('.topic-action-btn');
            if (actionBtn) { 
                if (actionBtn.dataset.action === 'focus') this.focusTopic(actionBtn.dataset.topic); 
                else if (actionBtn.dataset.action === 'explore') this.exploreTopic(actionBtn.dataset.topic); 
            }
        });
    }
    
    connectToLearningStream() {
        this.eventSource = new EventSource('/learning/stream');
        
        this.eventSource.addEventListener('status', (e) => { 
            try { this.updateStatus(JSON.parse(e.data).data || JSON.parse(e.data)); } catch (err) {} 
        });
        
        this.eventSource.addEventListener('curiosity', (e) => { 
            try { 
                const d = JSON.parse(e.data); 
                this._state.currentCuriosity = d.data; 
                this._state.mentalState = 'curious'; 
                this.addLogEntry('curiosity', d.data?.topic || 'Exploring...'); 
                this.updateHeader();
                this.updateTopicsSection(); 
            } catch (err) {} 
        });
        
        this.eventSource.addEventListener('question', (e) => { 
            try { 
                const d = JSON.parse(e.data); 
                this._state.mentalState = 'questioning'; 
                this.addLogEntry('question', d.data?.question || 'Asking...'); 
                this.updateHeader(); 
            } catch (err) {} 
        });
        
        this.eventSource.addEventListener('answer', (e) => { 
            try { 
                const d = JSON.parse(e.data); 
                this._state.mentalState = 'learning'; 
                const a = (d.data?.answer || '').substring(0, 100); 
                this.addLogEntry('answer', a); 
                this.updateHeader(); 
            } catch (err) {} 
        });
        
        this.eventSource.addEventListener('memory', (e) => { 
            try { 
                const d = JSON.parse(e.data); 
                this.addLogEntry('memory', (d.data?.content || '').substring(0, 80)); 
            } catch (err) {} 
        });
        
        this.eventSource.addEventListener('reflection', (e) => { 
            try { 
                const d = JSON.parse(e.data); 
                this._state.mentalState = 'reflecting'; 
                this.addLogEntry('reflection', (d.data?.insight || '').substring(0, 80)); 
                this.updateHeader(); 
            } catch (err) {} 
        });
        
        this.eventSource.addEventListener('error', () => { 
            this.addLogEntry('error', 'Learning error occurred'); 
        });
        
        this.eventSource.addEventListener('iteration', (e) => {
            try { this.loadStatus(); } catch (err) {}
        });
        
        this.eventSource.addEventListener('step', (e) => {
            try {
                const d = JSON.parse(e.data);
                const step = d.data || d;
                if (step.phase === 'curiosity') this._state.mentalState = 'curious';
                else if (step.phase === 'query') this._state.mentalState = 'questioning';
                else if (step.phase === 'chaperone' || step.phase === 'ingest') this._state.mentalState = 'learning';
                else if (step.phase === 'integrate') this._state.mentalState = 'satisfied';
                else if (step.phase === 'reflect') this._state.mentalState = 'reflecting';
                this.updateHeader();
            } catch (err) {}
        });
        
        this.eventSource.addEventListener('session_start', (e) => {
            this._state.isRunning = true;
            this._state.isPaused = false;
            this._state.iterations = 0;
            this._state.queriesMade = 0;
            this._state.contentIngested = 0;
            this._state.mentalState = 'curious';
            this.addLogEntry('session', '🎓 Learning session started');
            this.addLogEntry('curiosity', '🔍 Detecting curiosity signals...');
            this.updateHeader();
            this.updateLogSection();
        });
        
        this.eventSource.addEventListener('session_end', (e) => {
            this._state.isRunning = false;
            this._state.isPaused = false;
            this.updateHeader();
        });
        
        this.eventSource.addEventListener('topics', (e) => {
            try {
                const d = JSON.parse(e.data);
                if (d.topics && Array.isArray(d.topics)) {
                    this._state.conversationTopics = d.topics.map((t, i) => ({
                        id: t.id || `topic-${i}`,
                        topic: t.topic,
                        mentionCount: t.mentionCount || 1,
                        lastMentioned: t.lastMentioned || t.timestamp || Date.now(),
                        context: t.context || '',
                        focused: this._state.focusedTopics.has(t.topic)
                    }));
                }
                if (d.curiosityQueue) {
                    this._state.curiosityQueue = d.curiosityQueue.slice(0, 10);
                }
                this.updateTopicsSection();
                this.addLogEntry('topic', `Topics updated: ${d.topics?.length || 0} tracked`);
            } catch (err) {}
        });
        
        this.eventSource.onerror = () => {
            console.warn('Learning stream error, reconnecting...');
            setTimeout(() => this.connectToLearningStream(), 3000);
        };
    }
    
    async loadInitialData() {
        await Promise.all([this.loadStatus(), this.loadTopicsAndQueue(), this.loadTopicsFromAPI()]);
    }
    
    async loadStatus() {
        try {
            const r = await fetch('/learning/status');
            if (r.ok) this.updateStatus(await r.json());
        } catch (err) {}
    }
    
    async loadTopicsFromAPI() {
        try {
            const r = await fetch('/learning/topics');
            if (r.ok) {
                const d = await r.json();
                if (d.topics && Array.isArray(d.topics)) {
                    this._state.conversationTopics = d.topics.map((t, i) => ({
                        id: t.id || `topic-${i}`,
                        topic: t.topic,
                        mentionCount: t.mentionCount || 1,
                        lastMentioned: t.lastMentioned || Date.now(),
                        context: t.context || '',
                        focused: this._state.focusedTopics.has(t.topic)
                    }));
                }
                if (d.curiosityQueue) this._state.curiosityQueue = d.curiosityQueue.slice(0, 10);
                this.updateTopicsSection();
            }
        } catch (err) {}
    }
    
    async loadTopicsAndQueue() {
        try {
            const lr = await fetch('/learning/logs?count=20');
            if (lr.ok) {
                const d = await lr.json();
                if (d.session?.curiosityQueue) this._state.curiosityQueue = d.session.curiosityQueue.slice(0, 10);
            }
            const sr = await fetch('/learning/status');
            if (sr.ok) {
                const d = await sr.json();
                if (d.curiosityStatus?.conversationTopics) {
                    this._state.conversationTopics = d.curiosityStatus.conversationTopics.map(t => ({
                        ...t,
                        focused: this._state.focusedTopics.has(t.topic)
                    }));
                }
            }
            this.updateTopicsSection();
        } catch (err) {}
    }
    
    async startLearning() {
        try {
            const r = await fetch('/learning/start', { method: 'POST' });
            const d = await r.json();
            if (d.success) {
                this._state.isRunning = true;
                this._state.isPaused = false;
                this._state.mentalState = 'curious';
                this.addLogEntry('session', '🎓 Learning started');
                this.updateHeader();
            }
        } catch (err) {
            this.addLogEntry('error', 'Failed to start learning');
        }
    }
    
    async togglePause() {
        try {
            if (this._state.isPaused) {
                await fetch('/learning/resume', { method: 'POST' });
                this._state.isPaused = false;
                this._state.mentalState = 'curious';
                this.addLogEntry('session', '▶ Resumed');
            } else {
                await fetch('/learning/pause', { method: 'POST' });
                this._state.isPaused = true;
                this._state.mentalState = 'idle';
                this.addLogEntry('session', '⏸ Paused');
            }
            this.updateHeader();
        } catch (err) {}
    }
    
    async stopLearning() {
        try {
            await fetch('/learning/stop', { method: 'POST' });
            this._state.isRunning = false;
            this._state.isPaused = false;
            this._state.mentalState = 'satisfied';
            this.addLogEntry('session', '⏹ Stopped');
            this.updateHeader();
        } catch (err) {}
    }
    
    async submitQuestion() {
        const q = this._state.questionInput.trim();
        if (!q) return;
        try {
            const r = await fetch('/learning/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: q })
            });
            if (r.ok) {
                this.addLogEntry('question', `Added: ${q.substring(0, 50)}...`);
                this._state.questionInput = '';
                const input = this.$('#questionInput');
                if (input) input.value = '';
                this.updateSubmitButton();
            }
        } catch (err) {
            this.addLogEntry('error', 'Failed to add question');
        }
    }
    
    async focusTopic(topic) {
        const t = this._state.conversationTopics.find(x => x.topic === topic);
        if (t) {
            t.focused = !t.focused;
            if (t.focused) {
                this._state.focusedTopics.add(topic);
                try {
                    await fetch('/learning/focus', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topic })
                    });
                } catch (err) {}
                this.addLogEntry('curiosity', `🎯 Focusing: ${topic}`);
            } else {
                this._state.focusedTopics.delete(topic);
            }
            this.updateTopicsSection();
        }
    }
    
    async exploreTopic(topic) {
        this._state.questionInput = `Explain ${topic} in detail with key concepts and applications.`;
        const input = this.$('#questionInput');
        if (input) input.value = this._state.questionInput;
        this.updateSubmitButton();
        await this.submitQuestion();
    }
    
    updateHeader() {
        // Update control buttons
        const { isRunning, isPaused, iterations, queriesMade, contentIngested, mentalState } = this._state;
        const stateEmoji = { idle: '😴', curious: '🤔', questioning: '❓', reflecting: '🪞', learning: '📚', satisfied: '✨' };
        const stateLabels = { idle: 'Idle', curious: 'Curious', questioning: 'Questioning', reflecting: 'Reflecting', learning: 'Learning', satisfied: 'Satisfied' };
        
        const sb = this.$('#startBtn'), pb = this.$('#pauseBtn'), xb = this.$('#stopBtn');
        if (sb) { sb.disabled = isRunning; sb.classList.toggle('active', isRunning && !isPaused); }
        if (pb) { pb.disabled = !isRunning; pb.textContent = isPaused ? '▶' : '⏸'; pb.classList.toggle('active', isPaused); }
        if (xb) xb.disabled = !isRunning;
        
        const avatar = this.$('.ai-avatar-small');
        if (avatar) { avatar.textContent = stateEmoji[mentalState] || '🧠'; avatar.classList.toggle('thinking', isRunning); }
        
        const stateLabel = this.$('.ai-state-label');
        if (stateLabel) stateLabel.textContent = stateLabels[mentalState] || 'Idle';
        
        const sd = this.$('.status-dot');
        if (sd) { sd.classList.toggle('running', isRunning && !isPaused); sd.classList.toggle('paused', isRunning && isPaused); }
        
        const stats = this.$$('.stat-inline .val');
        if (stats.length >= 3) { stats[0].textContent = iterations; stats[1].textContent = queriesMade; stats[2].textContent = contentIngested; }
    }
    
    updateStatus(d) {
        this._state.isRunning = d.running || false;
        this._state.isPaused = d.paused || false;
        const session = d.session || {};
        this._state.iterations = session.iterations || d.iterations || 0;
        this._state.queriesMade = session.queriesMade || d.queriesMade || 0;
        this._state.contentIngested = session.contentIngested || d.contentIngested || 0;
        if (d.currentCuriosity) this._state.currentCuriosity = d.currentCuriosity;
        if (!this._state.isRunning) this._state.mentalState = 'idle';
        else if (this._state.isPaused) this._state.mentalState = 'reflecting';
        this.updateHeader();
    }
    
    updateSectionTabs() {
        this.$$('.section-tab').forEach(t => t.classList.toggle('active', t.dataset.section === this._state.activeSection));
        this.$$('.section-content').forEach(c => {
            const n = c.classList.contains('topics-section') ? 'topics' : 'log';
            c.classList.toggle('active', n === this._state.activeSection);
        });
        // Re-render the log section when switching to it to ensure fresh content
        if (this._state.activeSection === 'log') {
            this.updateLogSection();
        }
    }
    
    updateLogSection() {
        const s = this.$('.log-section');
        if (s) {
            s.outerHTML = this.renderLogSection();
        }
    }
    
    updateTopicsSection() {
        const s = this.$('.topics-section');
        if (s) s.outerHTML = this.renderTopicsSection();
        // Re-attach curiosity toggle listener
        this.$('#curiosityToggle')?.addEventListener('click', () => {
            this._state.showCuriosityQueue = !this._state.showCuriosityQueue;
            this.updateTopicsSection();
        });
    }
    
    updateSubmitButton() {
        const b = this.$('#submitQuestion');
        if (b) b.disabled = !this._state.questionInput.trim();
    }
    
    addLogEntry(type, message) {
        this._state.logEntries.unshift({ type, message, timestamp: Date.now() });
        if (this._state.logEntries.length > 100) this._state.logEntries = this._state.logEntries.slice(0, 100);
        
        // Always try to update the log list if visible
        const ll = this.$('#logList');
        if (ll && this._state.activeSection === 'log') {
            // Clear the empty state message if it exists
            const emptyState = ll.querySelector('.log-entry[style*="opacity"]');
            if (emptyState) {
                ll.innerHTML = '';
            }
            
            const e = document.createElement('div');
            e.className = `log-entry ${type}`;
            e.innerHTML = `<span class="log-time">${this.formatTime(Date.now())}</span><span class="log-type">[${type}]</span><span class="log-message">${this.escapeHtml(message)}</span>`;
            ll.insertBefore(e, ll.firstChild);
            while (ll.children.length > 50) ll.lastChild.remove();
        }
    }
    
    formatTime(ts) {
        return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    
    escapeHtml(str) {
        return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
    }
}

defineComponent('learning-panel', LearningPanel);