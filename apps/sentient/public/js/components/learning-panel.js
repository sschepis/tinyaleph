
/**
 * Learning Panel Component
 * 
 * Enhanced Learning tab with immersive AI perspective:
 * - Immersive mode: First-person AI internal narrative
 * - Conversation topics panel (topics from user-AI exchanges)
 * - Curiosity queue (what the AI wants to explore)
 * - Topic focus selector (user can prioritize topics)
 * - Manual question input (user can add questions)
 * - Learning controls and log
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
            
            // Log
            logEntries: [],
            
            // Immersive mode - AI internal perspective
            immersiveStream: [],
            currentThought: null,
            mentalState: 'idle',
            emotionalTone: 'neutral',
            
            // UI state
            activeSection: 'topics',  // Default to Topics section - shows what agent is learning from user
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
            
            .controls-section { display: flex; flex-direction: column; gap: var(--space-sm); }
            .control-row { display: flex; gap: var(--space-xs); }
            
            .control-btn {
                flex: 1; padding: var(--space-xs) var(--space-sm); font-size: 0.7rem; font-weight: 500;
                background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);
                color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);
                display: flex; align-items: center; justify-content: center; gap: var(--space-xs);
            }
            .control-btn:hover:not(:disabled) { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }
            .control-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .control-btn.active { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }
            .control-btn.danger:hover:not(:disabled) { background: var(--error); border-color: var(--error); }
            
            .stats-row { display: flex; gap: var(--space-sm); padding: var(--space-xs) var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); }
            .stat-item { flex: 1; text-align: center; }
            .stat-value { font-size: 0.9rem; font-weight: 600; color: var(--accent-primary); font-family: var(--font-mono); }
            .stat-label { font-size: 0.5rem; color: var(--text-dim); text-transform: uppercase; }
            
            .section-tabs { display: flex; gap: 2px; background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 2px; }
            .section-tab { flex: 1; padding: var(--space-xs); font-size: 0.6rem; font-weight: 500; color: var(--text-dim); background: transparent; border: none; border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); }
            .section-tab:hover { color: var(--text-secondary); }
            .section-tab.active { background: var(--bg-secondary); color: var(--accent-primary); }
            .section-tab.immersive-tab { background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2)); }
            .section-tab.immersive-tab.active { background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4)); color: #a78bfa; }
            
            .content-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
            .section-content { display: none; flex: 1; flex-direction: column; overflow: hidden; }
            .section-content.active { display: flex; }
            
            /* Immersive Section */
            .immersive-section { gap: var(--space-sm); }
            .ai-state-indicator { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm); background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-md); }
            .ai-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; animation: pulse-glow 2s ease-in-out infinite; }
            .ai-avatar.thinking { animation: thinking-pulse 0.8s ease-in-out infinite; }
            @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.3); } 50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); } }
            @keyframes thinking-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
            .ai-status { flex: 1; }
            .ai-state-label { font-size: 0.7rem; font-weight: 600; color: var(--text-primary); text-transform: capitalize; }
            .ai-emotional-tone { font-size: 0.55rem; color: var(--text-dim); display: flex; align-items: center; gap: var(--space-xs); margin-top: 2px; }
            .tone-indicator { width: 6px; height: 6px; border-radius: 50%; }
            .tone-indicator.excited { background: #fbbf24; }
            .tone-indicator.puzzled { background: #f472b6; }
            .tone-indicator.enlightened { background: #34d399; }
            .tone-indicator.focused { background: #3b82f6; }
            .tone-indicator.neutral { background: #9ca3af; }
            .current-thought { margin-top: var(--space-xs); padding: var(--space-sm); background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border-left: 3px solid #8b5cf6; }
            .thought-text { font-size: 0.65rem; color: var(--text-secondary); font-style: italic; line-height: 1.5; }
            .immersive-stream { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-sm); padding: var(--space-xs); }
            .immersive-entry { padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 3px solid transparent; animation: fadeSlideIn 0.3s ease-out; }
            @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
            .immersive-entry.curiosity { border-left-color: #8b5cf6; background: rgba(139, 92, 246, 0.08); }
            .immersive-entry.question { border-left-color: #3b82f6; background: rgba(59, 130, 246, 0.08); }
            .immersive-entry.reflection { border-left-color: #e879f9; background: rgba(232, 121, 249, 0.08); }
            .immersive-entry.memory { border-left-color: #fbbf24; background: rgba(251, 191, 36, 0.08); }
            .immersive-entry.insight { border-left-color: #34d399; background: rgba(52, 211, 153, 0.08); }
            .immersive-entry.topic { border-left-color: #f472b6; background: rgba(244, 114, 182, 0.08); }
            .entry-header { display: flex; align-items: center; gap: var(--space-xs); margin-bottom: var(--space-xs); }
            .entry-icon { font-size: 0.8rem; }
            .entry-type { font-size: 0.55rem; text-transform: uppercase; font-weight: 600; color: var(--text-dim); }
            .entry-time { margin-left: auto; font-size: 0.5rem; color: var(--text-dim); font-family: var(--font-mono); }
            .entry-narrative { font-size: 0.7rem; color: var(--text-primary); line-height: 1.6; }
            .entry-narrative em { color: #a78bfa; font-style: normal; }
            .entry-meta { margin-top: var(--space-xs); font-size: 0.5rem; color: var(--text-dim); }
            
            /* Topics Section */
            .topics-section { gap: var(--space-sm); }
            .topics-summary { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm); background: linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(251, 146, 60, 0.1)); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: var(--radius-md); }
            .topics-summary.priority-banner { background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15)); border: 2px solid rgba(239, 68, 68, 0.4); animation: priority-pulse 2s ease-in-out infinite; }
            @keyframes priority-pulse { 0%, 100% { border-color: rgba(239, 68, 68, 0.4); } 50% { border-color: rgba(239, 68, 68, 0.7); } }
            .topics-icon { font-size: 1.5rem; }
            .topics-info { flex: 1; }
            .topics-headline { font-size: 0.75rem; font-weight: 600; color: var(--text-primary); }
            .topics-subtext { font-size: 0.55rem; color: var(--text-dim); }
            .topics-subtext strong { color: #ef4444; }
            .topics-badge { padding: 4px 8px; background: rgba(244, 114, 182, 0.3); border-radius: var(--radius-sm); font-size: 0.65rem; font-weight: 600; color: #f472b6; }
            .topics-badge.priority-5 { background: rgba(239, 68, 68, 0.3); color: #ef4444; font-weight: 700; }
            .recent-topics-bar { display: flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-sm); background: rgba(251, 191, 36, 0.1); border-radius: var(--radius-sm); flex-wrap: wrap; }
            .recent-label { font-size: 0.55rem; color: var(--text-dim); }
            .recent-topic { font-size: 0.6rem; padding: 2px 6px; background: rgba(251, 191, 36, 0.2); border-radius: var(--radius-sm); color: #fbbf24; }
            .priority-badge { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2)); color: #ef4444; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm); }
            .topics-header { display: flex; align-items: center; justify-content: space-between; }
            .topics-title { font-size: 0.65rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
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
            .topic-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-xs); }
            .topic-name { font-size: 0.75rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
            .topic-priority { font-size: 0.5rem; padding: 2px 6px; border-radius: 8px; font-weight: 600; margin-left: var(--space-xs); }
            .topic-priority.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
            .topic-priority.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
            .topic-priority.low { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
            .topic-mentions { font-size: 0.55rem; padding: 2px 6px; background: var(--bg-tertiary); border-radius: var(--radius-sm); color: var(--text-dim); }
            .topic-context { font-size: 0.6rem; color: var(--text-dim); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .topic-stats { display: flex; gap: var(--space-sm); margin-top: var(--space-xs); font-size: 0.5rem; color: var(--text-dim); }
            .topic-stat { display: flex; align-items: center; gap: 2px; }
            .topic-actions { display: flex; gap: var(--space-xs); margin-top: var(--space-xs); }
            .topic-action-btn { flex: 1; padding: 4px var(--space-sm); font-size: 0.55rem; background: var(--bg-tertiary); border: none; border-radius: var(--radius-sm); color: var(--text-dim); cursor: pointer; transition: all var(--transition-fast); }
            .topic-action-btn:hover { background: var(--accent-primary); color: white; }
            .topic-action-btn.focus-btn:hover { background: var(--success); }
            
            /* Queue Section */
            .queue-section { gap: var(--space-sm); }
            .current-curiosity { padding: var(--space-sm); background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-md); margin-bottom: var(--space-sm); }
            .curiosity-label { font-size: 0.55rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: var(--space-xs); }
            .curiosity-topic { font-size: 0.7rem; color: var(--text-primary); font-weight: 500; }
            .curiosity-meta { display: flex; gap: var(--space-md); margin-top: var(--space-xs); }
            .curiosity-meta-item { font-size: 0.5rem; color: var(--text-dim); }
            .intensity-bar { height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin-top: var(--space-xs); overflow: hidden; }
            .intensity-fill { height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); transition: width var(--transition-normal); }
            .queue-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-xs); }
            .queue-item { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); }
            .queue-position { font-size: 0.6rem; font-family: var(--font-mono); color: var(--text-dim); width: 18px; }
            .queue-content { flex: 1; font-size: 0.6rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .queue-source { font-size: 0.5rem; padding: 2px 4px; background: var(--bg-tertiary); border-radius: 2px; color: var(--text-dim); }
            
            /* Question Input */
            .question-input-section { padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); margin-top: var(--space-sm); }
            .question-label { font-size: 0.55rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: var(--space-xs); }
            .question-input-row { display: flex; gap: var(--space-xs); }
            .question-input { flex: 1; padding: var(--space-xs) var(--space-sm); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 0.65rem; outline: none; }
            .question-input:focus { border-color: var(--accent-primary); }
            .question-submit { padding: var(--space-xs) var(--space-sm); background: var(--accent-primary); border: none; border-radius: var(--radius-sm); color: white; font-size: 0.65rem; cursor: pointer; transition: all var(--transition-fast); }
            .question-submit:hover { background: var(--accent-secondary); }
            .question-submit:disabled { opacity: 0.5; cursor: not-allowed; }
            
            /* Log Section */
            .log-section { gap: var(--space-sm); }
            .log-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; background: var(--bg-secondary); border-radius: var(--radius-sm); padding: var(--space-xs); }
            .log-entry { padding: 2px var(--space-xs); font-size: 0.55rem; font-family: var(--font-mono); border-left: 2px solid transparent; }
            .log-entry.curiosity { border-left-color: var(--accent-primary); }
            .log-entry.question { border-left-color: var(--accent-secondary); }
            .log-entry.answer { border-left-color: var(--success); }
            .log-entry.memory { border-left-color: var(--warning); }
            .log-entry.reflection { border-left-color: #e879f9; }
            .log-entry.error { border-left-color: var(--error); }
            .log-time { color: var(--text-dim); margin-right: var(--space-xs); }
            .log-type { color: var(--text-secondary); font-weight: 500; margin-right: var(--space-xs); }
            .log-message { color: var(--text-secondary); }
            
            .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-lg); text-align: center; }
            .empty-icon { font-size: 2rem; margin-bottom: var(--space-sm); opacity: 0.5; }
            .empty-text { font-size: 0.7rem; color: var(--text-dim); }
            
            .status-indicator { display: flex; align-items: center; gap: var(--space-xs); font-size: 0.6rem; }
            .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-dim); }
            .status-dot.running { background: var(--success); animation: pulse 1.5s ease-in-out infinite; }
            .status-dot.paused { background: var(--warning); }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `;
    }
    
    template() {
        const { isRunning, isPaused, iterations, queriesMade, contentIngested, activeSection } = this._state;
        
        return `
            <div class="learning-panel">
                <div class="controls-section">
                    <div class="control-row">
                        <button class="control-btn ${isRunning && !isPaused ? 'active' : ''}" id="startBtn" ${isRunning && !isPaused ? 'disabled' : ''}>▶ Start</button>
                        <button class="control-btn" id="pauseBtn" ${!isRunning || isPaused ? 'disabled' : ''}>${isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                        <button class="control-btn danger" id="stopBtn" ${!isRunning ? 'disabled' : ''}>⏹ Stop</button>
                    </div>
                    <div class="stats-row">
                        <div class="stat-item"><div class="stat-value">${iterations}</div><div class="stat-label">Iterations</div></div>
                        <div class="stat-item"><div class="stat-value">${queriesMade}</div><div class="stat-label">Queries</div></div>
                        <div class="stat-item"><div class="stat-value">${contentIngested}</div><div class="stat-label">Ingested</div></div>
                        <div class="stat-item"><div class="status-indicator"><span class="status-dot ${isRunning ? (isPaused ? 'paused' : 'running') : ''}"></span><span>${isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}</span></div></div>
                    </div>
                </div>
                <div class="section-tabs">
                    <button class="section-tab immersive-tab ${activeSection === 'immersive' ? 'active' : ''}" data-section="immersive">🧠 Immersive</button>
                    <button class="section-tab ${activeSection === 'topics' ? 'active' : ''}" data-section="topics">💬 Topics</button>
                    <button class="section-tab ${activeSection === 'queue' ? 'active' : ''}" data-section="queue">🔮 Curiosity</button>
                    <button class="section-tab ${activeSection === 'log' ? 'active' : ''}" data-section="log">📝 Log</button>
                </div>
                <div class="content-area">
                    ${this.renderImmersiveSection()}
                    ${this.renderTopicsSection()}
                    ${this.renderQueueSection()}
                    ${this.renderLogSection()}
                </div>
                <div class="question-input-section">
                    <div class="question-label">Add Question for Exploration</div>
                    <div class="question-input-row">
                        <input type="text" class="question-input" placeholder="What should I learn about?" value="${this._state.questionInput}" id="questionInput">
                        <button class="question-submit" id="submitQuestion" ${!this._state.questionInput.trim() ? 'disabled' : ''}>Add</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderImmersiveSection() {
        const { activeSection, immersiveStream, currentThought, mentalState, emotionalTone, isRunning } = this._state;
        const stateEmoji = { idle: '😴', curious: '🤔', questioning: '❓', reflecting: '🪞', learning: '📚', satisfied: '✨' };
        const stateLabels = { idle: 'Resting', curious: 'Curious', questioning: 'Asking Questions', reflecting: 'Deep in Thought', learning: 'Absorbing Knowledge', satisfied: 'Insight Gained' };
        
        return `
            <div class="section-content immersive-section ${activeSection === 'immersive' ? 'active' : ''}">
                <div class="ai-state-indicator">
                    <div class="ai-avatar ${isRunning ? 'thinking' : ''}">${stateEmoji[mentalState] || '🧠'}</div>
                    <div class="ai-status">
                        <div class="ai-state-label">${stateLabels[mentalState] || 'Idle'}</div>
                        <div class="ai-emotional-tone"><span class="tone-indicator ${emotionalTone}"></span><span>${emotionalTone.charAt(0).toUpperCase() + emotionalTone.slice(1)}</span></div>
                    </div>
                </div>
                ${currentThought ? `<div class="current-thought"><div class="thought-text">"${this.escapeHtml(currentThought)}"</div></div>` : ''}
                <div class="immersive-stream" id="immersiveStream">
                    ${immersiveStream.length === 0 ? `<div class="empty-state"><span class="empty-icon">🧠</span><span class="empty-text">Start learning to see my internal perspective...<br>I'll share my thoughts, curiosity, and discoveries.</span></div>` : immersiveStream.map(entry => this.renderImmersiveEntry(entry)).join('')}
                </div>
            </div>
        `;
    }
    
    renderImmersiveEntry(entry) {
        const icons = { curiosity: '🔮', question: '❓', reflection: '🪞', memory: '💾', insight: '💡', topic: '💬' };
        return `
            <div class="immersive-entry ${entry.type}">
                <div class="entry-header">
                    <span class="entry-icon">${icons[entry.type] || '📝'}</span>
                    <span class="entry-type">${entry.type}</span>
                    <span class="entry-time">${this.formatTime(entry.timestamp)}</span>
                </div>
                <div class="entry-narrative">${entry.narrative}</div>
                ${entry.meta ? `<div class="entry-meta">${entry.meta}</div>` : ''}
            </div>
        `;
    }
    
    renderTopicsSection() {
        const { activeSection, conversationTopics, selectedTopic } = this._state;
        const sortedTopics = [...conversationTopics].sort((a, b) => (b.focused ? 1 : 0) - (a.focused ? 1 : 0) || (b.mentionCount || 0) - (a.mentionCount || 0));
        
        if (sortedTopics.length === 0) {
            return `
                <div class="section-content topics-section ${activeSection === 'topics' ? 'active' : ''}">
                    <div class="topics-summary priority-banner"><span class="topics-icon">🎯</span><div class="topics-info"><div class="topics-headline">What I'm Learning From You</div><div class="topics-subtext">Topics will appear as you chat with me - <strong>Priority 5 (Highest)</strong></div></div></div>
                    <div class="empty-state"><span class="empty-icon">💬</span><span class="empty-text">No conversation topics yet.<br>Chat with me and I'll learn from our discussions!<br><small>Your interests become my learning priorities.</small></span></div>
                </div>
            `;
        }
        
        const topTopic = sortedTopics[0];
        const recentTopics = sortedTopics.filter(t => Date.now() - (t.lastMentioned || 0) < 300000); // Last 5 min
        return `
            <div class="section-content topics-section ${activeSection === 'topics' ? 'active' : ''}">
                <div class="topics-summary priority-banner">
                    <span class="topics-icon">🎯</span>
                    <div class="topics-info">
                        <div class="topics-headline">Learning about: ${this.escapeHtml(topTopic.topic)}</div>
                        <div class="topics-subtext">${sortedTopics.length} topics from our conversations • <strong>Priority 5 (Highest)</strong></div>
                    </div>
                    <span class="topics-badge priority-5">${sortedTopics.length}</span>
                </div>
                ${recentTopics.length > 0 ? `<div class="recent-topics-bar"><span class="recent-label">⚡ Recently discussed:</span> ${recentTopics.slice(0, 3).map(t => `<span class="recent-topic">${this.escapeHtml(t.topic)}</span>`).join(' ')}</div>` : ''}
                <div class="topics-header"><span class="topics-title">Topics Being Tracked</span><span class="topics-count priority-badge">🔥 Priority 5</span></div>
                <div class="topics-list">
                    ${sortedTopics.map(topic => {
                        const priorityClass = (topic.mentionCount || 1) >= 3 ? 'high' : (topic.mentionCount || 1) >= 2 ? 'medium' : 'low';
                        const priorityLabel = (topic.mentionCount || 1) >= 3 ? 'HIGH' : (topic.mentionCount || 1) >= 2 ? 'MED' : 'LOW';
                        return `
                            <div class="topic-item priority-${priorityClass} ${selectedTopic?.id === topic.id ? 'selected' : ''} ${topic.focused ? 'focused' : ''}" data-topic-id="${topic.id}">
                                <div class="topic-header">
                                    <span class="topic-name">${this.escapeHtml(topic.topic)}</span>
                                    <span class="topic-priority ${priorityClass}">${priorityLabel}</span>
                                    <span class="topic-mentions">${topic.mentionCount || 1}x</span>
                                </div>
                                ${topic.context ? `<div class="topic-context">${this.escapeHtml(topic.context)}</div>` : ''}
                                <div class="topic-stats"><span class="topic-stat">📅 ${this.formatRelativeTime(topic.lastMentioned)}</span>${topic.focused ? '<span class="topic-stat">🎯 Focused</span>' : ''}</div>
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
    
    renderQueueSection() {
        const { activeSection, curiosityQueue, currentCuriosity } = this._state;
        return `
            <div class="section-content queue-section ${activeSection === 'queue' ? 'active' : ''}">
                ${currentCuriosity ? `
                    <div class="current-curiosity">
                        <div class="curiosity-label">🔮 Current Focus</div>
                        <div class="curiosity-topic">${this.escapeHtml(currentCuriosity.topic || 'Exploring...')}</div>
                        <div class="curiosity-meta"><span class="curiosity-meta-item">Source: ${currentCuriosity.source || 'unknown'}</span><span class="curiosity-meta-item">Intensity: ${((currentCuriosity.intensity || 0) * 100).toFixed(0)}%</span></div>
                        <div class="intensity-bar"><div class="intensity-fill" style="width: ${(currentCuriosity.intensity || 0) * 100}%"></div></div>
                    </div>
                ` : `<div class="current-curiosity" style="opacity: 0.5;"><div class="curiosity-label">🔮 Current Focus</div><div class="curiosity-topic">No active curiosity</div></div>`}
                <div class="topics-header"><span class="topics-title">Curiosity Queue</span><span class="topics-count">${curiosityQueue.length} items</span></div>
                <div class="queue-list">
                    ${curiosityQueue.length === 0 ? `<div class="empty-state"><span class="empty-text">Queue is empty. Start learning to generate curiosity.</span></div>` : curiosityQueue.map((item, i) => `<div class="queue-item"><span class="queue-position">#${i + 1}</span><span class="queue-content">${this.escapeHtml(item.topic || item.suggestedQuery || 'Unknown')}</span><span class="queue-source">${item.type || 'gap'}</span></div>`).join('')}
                </div>
            </div>
        `;
    }
    
    renderLogSection() {
        const { activeSection, logEntries } = this._state;
        return `
            <div class="section-content log-section ${activeSection === 'log' ? 'active' : ''}">
                <div class="log-list" id="logList">
                    ${logEntries.length === 0 ? `<div class="log-entry" style="opacity: 0.5;">Start learning to see AI's thought process...</div>` : logEntries.map(entry => `<div class="log-entry ${entry.type}"><span class="log-time">${this.formatTime(entry.timestamp)}</span><span class="log-type">[${entry.type}]</span><span class="log-message">${this.escapeHtml(entry.message)}</span></div>`).join('')}
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
        this.$$('.section-tab').forEach(tab => tab.addEventListener('click', () => { this._state.activeSection = tab.dataset.section; this.updateSectionTabs(); }));
        const questionInput = this.$('#questionInput');
        if (questionInput) {
            questionInput.addEventListener('input', (e) => { this._state.questionInput = e.target.value; this.updateSubmitButton(); });
            questionInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && this._state.questionInput.trim()) this.submitQuestion(); });
        }
        this.$('#submitQuestion')?.addEventListener('click', () => this.submitQuestion());
        this.addEventListener('click', (e) => {
            const topicItem = e.target.closest('.topic-item');
            if (topicItem && !e.target.closest('.topic-action-btn')) { this._state.selectedTopic = this._state.conversationTopics.find(t => t.id === topicItem.dataset.topicId); this.updateTopicsSection(); }
            const actionBtn = e.target.closest('.topic-action-btn');
            if (actionBtn) { if (actionBtn.dataset.action === 'focus') this.focusTopic(actionBtn.dataset.topic); else if (actionBtn.dataset.action === 'explore') this.exploreTopic(actionBtn.dataset.topic); }
        });
    }
    
    connectToLearningStream() {
        this.eventSource = new EventSource('/learning/stream');
        this.eventSource.addEventListener('status', (e) => { try { this.updateStatus(JSON.parse(e.data).data || JSON.parse(e.data)); } catch (err) {} });
        this.eventSource.addEventListener('curiosity', (e) => { try { const d = JSON.parse(e.data); this._state.currentCuriosity = d.data; this._state.mentalState = 'curious'; this._state.emotionalTone = 'excited'; this.addImmersiveEntry('curiosity', `I'm curious about <em>${d.data?.topic || 'something new'}</em>. Let me explore this...`, `Intensity: ${((d.data?.intensity || 0) * 100).toFixed(0)}%`); this.addLogEntry('curiosity', d.data?.topic || 'Exploring...'); this.updateQueueSection(); this.updateImmersiveSection(); } catch (err) {} });
        this.eventSource.addEventListener('question', (e) => { try { const d = JSON.parse(e.data); this._state.mentalState = 'questioning'; this._state.currentThought = d.data?.question || 'Formulating a question...'; this.addImmersiveEntry('question', `I wonder: <em>"${this.escapeHtml(d.data?.question || 'What should I learn next?')}"</em>`); this.addLogEntry('question', d.data?.question || 'Asking...'); this.updateImmersiveSection(); } catch (err) {} });
        this.eventSource.addEventListener('answer', (e) => { try { const d = JSON.parse(e.data); this._state.mentalState = 'learning'; this._state.emotionalTone = 'focused'; const a = (d.data?.answer || '').substring(0, 150); this.addImmersiveEntry('insight', `I learned: ${a}${a.length >= 150 ? '...' : ''}`); this.addLogEntry('answer', a); this.updateImmersiveSection(); } catch (err) {} });
        this.eventSource.addEventListener('memory', (e) => { try { const d = JSON.parse(e.data); this._state.emotionalTone = 'satisfied'; this.addImmersiveEntry('memory', `Storing knowledge: <em>${this.escapeHtml((d.data?.content || '').substring(0, 80))}...</em>`); this.addLogEntry('memory', d.data?.content?.substring(0, 80) || 'Memory stored'); this.updateImmersiveSection(); } catch (err) {} });
        this.eventSource.addEventListener('reflection', (e) => { try { const d = JSON.parse(e.data); this._state.mentalState = 'reflecting'; this._state.emotionalTone = 'enlightened'; this.addImmersiveEntry('reflection', `Reflecting... <em>${this.escapeHtml((d.data?.insight || 'Thinking deeply...').substring(0, 100))}</em>`); this.addLogEntry('reflection', d.data?.insight?.substring(0, 80) || 'Reflecting...'); this.updateImmersiveSection(); } catch (err) {} });
        this.eventSource.addEventListener('error', () => { this._state.emotionalTone = 'puzzled'; this.addLogEntry('error', 'Learning error occurred'); });
        
        // Listen for real-time topic updates from chat
        this.eventSource.addEventListener('topics', (e) => {
            try {
                const d = JSON.parse(e.data);
                if (d.topics && Array.isArray(d.topics)) {
                    // Update conversation topics with fresh data
                    this._state.conversationTopics = d.topics.map((t, i) => ({
                        id: t.id || `topic-${i}`,
                        topic: t.topic,
                        mentionCount: t.mentionCount || 1,
                        lastMentioned: t.lastMentioned || t.timestamp || Date.now(),
                        context: t.context || '',
                        focused: this._state.focusedTopics.has(t.topic)
                    }));
                    
                    // Add immersive entry for new topic detection
                    const newTopics = d.topics.filter(t => t.mentionCount === 1);
                    if (newTopics.length > 0) {
                        const topicNames = newTopics.slice(0, 3).map(t => t.topic).join(', ');
                        this.addImmersiveEntry('topic', `From our conversation, I noticed: <em>${topicNames}</em>. I want to understand this better.`, `Priority 5 - Learning from you`);
                    }
                }
                if (d.curiosityQueue) {
                    this._state.curiosityQueue = d.curiosityQueue.slice(0, 10);
                }
                
                this.updateTopicsSection();
                this.updateQueueSection();
                this.addLogEntry('topic', `Topics updated: ${d.topics?.length || 0} tracked`);
            } catch (err) {
                console.warn('Failed to parse topics event:', err);
            }
        });
        
        this.eventSource.onerror = () => { console.warn('Learning stream error, reconnecting...'); setTimeout(() => this.connectToLearningStream(), 3000); };
    }
    
    async loadInitialData() { await Promise.all([this.loadStatus(), this.loadTopicsAndQueue(), this.loadTopicsFromAPI()]); }
    async loadStatus() { try { const r = await fetch('/learning/status'); if (r.ok) this.updateStatus(await r.json()); } catch (err) {} }
    async loadTopicsFromAPI() {
        try {
            const r = await fetch('/learning/topics');
            if (r.ok) {
                const d = await r.json();
                if (d.topics && Array.isArray(d.topics)) {
                    this._state.conversationTopics = d.topics.map((t, i) => ({ id: t.id || `topic-${i}`, topic: t.topic, mentionCount: t.mentionCount || 1, lastMentioned: t.lastMentioned || Date.now(), context: t.context || '', focused: this._state.focusedTopics.has(t.topic) }));
                    if (d.topics.length > 0 && this._state.immersiveStream.length === 0) this.addImmersiveEntry('topic', `I've noticed you're interested in: <em>${d.topics.slice(0, 3).map(t => t.topic).join(', ')}</em>`, `${d.topics.length} topics tracked`);
                }
                if (d.curiosityQueue) this._state.curiosityQueue = d.curiosityQueue.slice(0, 10);
                this.updateTopicsSection(); this.updateQueueSection();
            }
        } catch (err) {}
    }
    async loadTopicsAndQueue() {
        try {
            const lr = await fetch('/learning/logs?count=20'); if (lr.ok) { const d = await lr.json(); if (d.session?.curiosityQueue) this._state.curiosityQueue = d.session.curiosityQueue.slice(0, 10); }
            const sr = await fetch('/learning/status'); if (sr.ok) { const d = await sr.json(); if (d.curiosityStatus?.conversationTopics) this._state.conversationTopics = d.curiosityStatus.conversationTopics.map(t => ({ ...t, focused: this._state.focusedTopics.has(t.topic) })); }
            this.updateTopicsSection(); this.updateQueueSection();
        } catch (err) {}
    }
    
    async startLearning() { try { const r = await fetch('/learning/start', { method: 'POST' }); const d = await r.json(); if (d.success) { this._state.isRunning = true; this._state.isPaused = false; this._state.mentalState = 'curious'; this._state.emotionalTone = 'excited'; this.addImmersiveEntry('curiosity', `Starting my learning session! I'm ready to explore and discover.`); this.addLogEntry('session', '🎓 Learning started'); this.update(); } } catch (err) { this.addLogEntry('error', 'Failed to start learning'); } }
    async togglePause() { try { if (this._state.isPaused) { await fetch('/learning/resume', { method: 'POST' }); this._state.isPaused = false; this._state.mentalState = 'curious'; this.addImmersiveEntry('curiosity', `Resuming exploration...`); this.addLogEntry('session', '▶ Resumed'); } else { await fetch('/learning/pause', { method: 'POST' }); this._state.isPaused = true; this._state.mentalState = 'idle'; this.addImmersiveEntry('reflection', `Taking a moment to consolidate...`); this.addLogEntry('session', '⏸ Paused'); } this.update(); } catch (err) {} }
    async stopLearning() { try { await fetch('/learning/stop', { method: 'POST' }); this._state.isRunning = false; this._state.isPaused = false; this._state.mentalState = 'satisfied'; this._state.emotionalTone = 'neutral'; this.addImmersiveEntry('reflection', `Learning session complete. I've gained new insights.`); this.addLogEntry('session', '⏹ Stopped'); this.update(); } catch (err) {} }
    async submitQuestion() { const q = this._state.questionInput.trim(); if (!q) return; try { const r = await fetch('/learning/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) }); if (r.ok) { this.addImmersiveEntry('question', `Adding to exploration: <em>"${this.escapeHtml(q)}"</em>`); this.addLogEntry('question', `Added: ${q.substring(0, 50)}...`); this._state.questionInput = ''; this.update(); } } catch (err) { this.addLogEntry('error', 'Failed to add question'); } }
    async focusTopic(topic) { const t = this._state.conversationTopics.find(x => x.topic === topic); if (t) { t.focused = !t.focused; if (t.focused) { this._state.focusedTopics.add(topic); try { await fetch('/learning/focus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic }) }); } catch (err) {} this.addImmersiveEntry('topic', `Now focusing on <em>${this.escapeHtml(topic)}</em>. This is a priority!`); this.addLogEntry('curiosity', `🎯 Focusing: ${topic}`); } else { this._state.focusedTopics.delete(topic); } this.updateTopicsSection(); this.updateImmersiveSection(); } }
    async exploreTopic(topic) { this._state.questionInput = `Explain ${topic} in detail with key concepts and applications.`; await this.submitQuestion(); }
    
    addImmersiveEntry(type, narrative, meta) { this._state.immersiveStream.unshift({ type, narrative, meta, timestamp: Date.now() }); if (this._state.immersiveStream.length > 50) this._state.immersiveStream = this._state.immersiveStream.slice(0, 50); if (this._state.activeSection === 'immersive') this.updateImmersiveSection(); }
    updateImmersiveSection() { const s = this.$('.immersive-section'); if (s) s.outerHTML = this.renderImmersiveSection(); }
    updateStatus(d) { this._state.isRunning = d.running || false; this._state.isPaused = d.paused || false; this._state.iterations = d.iterations || 0; this._state.queriesMade = d.queriesMade || 0; this._state.contentIngested = d.contentIngested || 0; if (d.currentCuriosity) this._state.currentCuriosity = d.currentCuriosity; if (!this._state.isRunning) this._state.mentalState = 'idle'; else if (this._state.isPaused) this._state.mentalState = 'reflecting'; this.updateControlButtons(); this.updateStats(); }
    updateControlButtons() { const { isRunning, isPaused } = this._state; const sb = this.$('#startBtn'), pb = this.$('#pauseBtn'), xb = this.$('#stopBtn'); if (sb) sb.disabled = isRunning && !isPaused; if (pb) { pb.disabled = !isRunning; pb.textContent = isPaused ? '▶ Resume' : '⏸ Pause'; } if (xb) xb.disabled = !isRunning; const sd = this.$('.status-dot'); if (sd) { sd.classList.toggle('running', isRunning && !isPaused); sd.classList.toggle('paused', isRunning && isPaused); } }
    updateStats() { const sv = this.$$('.stat-value'); if (sv.length >= 3) { sv[0].textContent = this._state.iterations; sv[1].textContent = this._state.queriesMade; sv[2].textContent = this._state.contentIngested; } }
    updateSectionTabs() { this.$$('.section-tab').forEach(t => t.classList.toggle('active', t.dataset.section === this._state.activeSection)); this.$$('.section-content').forEach(c => { const n = c.classList.contains('immersive-section') ? 'immersive' : c.classList.contains('topics-section') ? 'topics' : c.classList.contains('queue-section') ? 'queue' : 'log'; c.classList.toggle('active', n === this._state.activeSection); }); }
    updateTopicsSection() { const s = this.$('.topics-section'); if (s) s.outerHTML = this.renderTopicsSection(); }
    updateQueueSection() { const s = this.$('.queue-section'); if (s) s.outerHTML = this.renderQueueSection(); }
    updateSubmitButton() { const b = this.$('#submitQuestion'); if (b) b.disabled = !this._state.questionInput.trim(); }
    addLogEntry(type, message) { this._state.logEntries.unshift({ type, message, timestamp: Date.now() }); if (this._state.logEntries.length > 100) this._state.logEntries = this._state.logEntries.slice(0, 100); const ll = this.$('#logList'); if (ll && this._state.activeSection === 'log') { const e = document.createElement('div'); e.className = `log-entry ${type}`; e.innerHTML = `<span class="log-time">${this.formatTime(Date.now())}</span><span class="log-type">[${type}]</span><span class="log-message">${this.escapeHtml(message)}</span>`; ll.insertBefore(e, ll.firstChild); while (ll.children.length > 50) ll.lastChild.remove(); } }
    
    formatTime(ts) { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    formatRelativeTime(ts) { if (!ts) return 'Unknown'; const d = Date.now() - ts; if (d < 60000) return 'Just now'; if (d < 3600000) return `${Math.floor(d / 60000)}m ago`; if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`; return `${Math.floor(d / 86400000)}d ago`; }
    escapeHtml(str) { return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }
}

defineComponent('learning-panel', LearningPanel);