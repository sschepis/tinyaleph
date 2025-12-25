/**
 * Sentient Observer - Enhanced Web UI
 * 
 * Main application orchestrator using ES6 modules
 */

import { fetchJSON, getCoherenceClass } from './utils.js';
import { OscillatorVisualizer } from './oscillators.js';
import { SedenionVisualizer } from './sedenion.js';
import { ChatHandler } from './chat.js';
import { StreamManager } from './streams.js';
import { PanelManager } from './panels.js';
import { IntrospectionModal } from './introspection.js';

class SentientUI {
    constructor() {
        this.isConnected = false;
        this.sidebarVisible = true;
        
        // Animation
        this.animationFrame = null;
        this.lastRenderTime = 0;
        
        // Initialize when DOM is ready
        this.init();
    }
    
    async init() {
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize modules
        this.initModules();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Connect to streams
        this.streams.connect();
        
        // Load initial data
        await this.loadInitialData();
        
        // Start animation loop
        this.startAnimationLoop();
        
        // Start polling for updates
        this.startPolling();
    }
    
    cacheElements() {
        // Header elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.headerCoherence = document.getElementById('headerCoherence');
        this.headerEntropy = document.getElementById('headerEntropy');
        this.headerMoments = document.getElementById('headerMoments');
        this.headerLambda = document.getElementById('headerLambda');
        
        // Sidebar
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
    }
    
    initModules() {
        // Oscillator visualizer
        const oscCanvas = document.getElementById('oscillatorCanvas');
        this.oscillators = new OscillatorVisualizer(oscCanvas);
        
        // Sedenion visualizer
        const sedCanvas = document.getElementById('sedenionCanvas');
        const sedAxes = document.getElementById('sedenionAxes');
        this.sedenion = new SedenionVisualizer(sedCanvas, sedAxes);
        
        // Chat handler
        this.chat = new ChatHandler({
            messagesContainer: document.getElementById('chatMessages'),
            form: document.getElementById('chatForm'),
            input: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            clearButton: document.getElementById('clearHistory'),
            onStateUpdate: (state) => this.updateStatusDisplay(state),
            onError: (title, msg) => this.showToast(title, msg, 'error')
        });
        
        // Stream manager
        this.streams = new StreamManager({
            onStatusUpdate: (data) => this.updateStatusDisplay(data),
            onMoment: (moment) => this.panels.addMoment(moment),
            onConnected: () => this.setConnected(true),
            onDisconnected: () => this.setConnected(false)
        });
        
        // Panel manager
        this.panels = new PanelManager({
            momentsList: document.getElementById('momentsList'),
            subjectiveTime: document.getElementById('subjectiveTime'),
            goalsList: document.getElementById('goalsList'),
            sensesList: document.getElementById('sensesList'),
            sensesAnomalies: document.getElementById('sensesAnomalies'),
            anomalyCount: document.getElementById('anomalyCount'),
            smfDominant: document.getElementById('smfDominant'),
            smfEntropy: document.getElementById('smfEntropy'),
            smfNorm: document.getElementById('smfNorm'),
            activeOsc: document.getElementById('activeOsc'),
            oscEnergy: document.getElementById('oscEnergy')
        });
        
        // Introspection modal
        this.introspection = new IntrospectionModal({
            overlay: document.getElementById('introspectOverlay'),
            content: document.getElementById('introspectContent'),
            closeBtn: document.getElementById('closeIntrospect'),
            toggleBtn: document.getElementById('toggleIntrospect')
        });
    }
    
    setupEventListeners() {
        // Toggle sidebar
        if (this.toggleSidebarBtn) {
            this.toggleSidebarBtn.addEventListener('click', () => this.handleToggleSidebar());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && e.ctrlKey) {
                e.preventDefault();
                document.getElementById('messageInput')?.focus();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.oscillators?.setupResolution();
            this.sedenion?.setupResolution();
        });
    }
    
    setConnected(connected) {
        this.isConnected = connected;
        if (this.statusIndicator) {
            this.statusIndicator.className = 'status-indicator ' + (connected ? 'connected' : 'disconnected');
        }
        if (this.statusText) {
            this.statusText.textContent = connected ? 'Connected' : 'Disconnected';
        }
    }
    
    updateStatusDisplay(data) {
        if (data.coherence !== undefined && this.headerCoherence) {
            this.headerCoherence.textContent = (data.coherence * 100).toFixed(0) + '%';
            this.headerCoherence.className = 'metric-value ' + getCoherenceClass(data.coherence);
            this.oscillators.coherence = data.coherence;
        }
        if (data.entropy !== undefined && this.headerEntropy) {
            this.headerEntropy.textContent = (data.entropy * 100).toFixed(0) + '%';
        }
        if (data.momentCount !== undefined && this.headerMoments) {
            this.headerMoments.textContent = data.momentCount;
        }
    }
    
    updateLambda(stabilization) {
        if (stabilization?.current !== undefined && this.headerLambda) {
            const lambda = stabilization.current;
            this.headerLambda.textContent = lambda.toFixed(3);
            
            let cls = 'lambda-stable';
            if (lambda < -0.1) cls = 'lambda-collapsed';
            else if (lambda > 0.1) cls = 'lambda-unstable';
            this.headerLambda.className = 'metric-value ' + cls;
        }
    }
    
    async loadInitialData() {
        const results = await Promise.allSettled([
            fetchJSON('/smf'),
            fetchJSON('/oscillators'),
            fetchJSON('/moments?count=5'),
            fetchJSON('/goals'),
            fetchJSON('/stabilization'),
            fetchJSON('/senses')
        ]);
        
        const [smf, osc, moments, goals, stabilization, senses] = results.map(r =>
            r.status === 'fulfilled' ? r.value : null
        );
        
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn('Some initial data endpoints failed:', failures.map(f => f.reason?.message || f.reason));
        }
        
        if (smf) {
            this.sedenion.setData(smf);
            this.sedenion.renderAxes(smf.components, smf.dominant);
            this.panels.renderSMFDominant(smf.dominant);
            this.panels.renderSMFStats(smf);
        }
        
        if (osc) {
            this.oscillators.setData(osc.topOscillators || [], parseFloat(this.headerCoherence?.textContent) / 100 || 0);
            this.panels.renderOscillatorStats(osc);
        }
        
        if (moments) {
            this.panels.momentsData = moments.moments || [];
            this.panels.renderMoments(moments);
        }
        
        if (goals) {
            this.panels.renderGoals(goals);
        }
        
        if (stabilization) {
            this.updateLambda(stabilization);
        }
        
        if (senses) {
            this.panels.renderSenses(senses);
        }
        
        // Load chat history
        await this.chat.loadHistory();
    }
    
    startAnimationLoop() {
        const animate = (time) => {
            if (time - this.lastRenderTime > 33) { // ~30fps
                this.oscillators?.draw();
                this.sedenion?.draw();
                this.lastRenderTime = time;
            }
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    startPolling() {
        // Poll main data every 2 seconds
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const [smf, osc, goals, stabilization] = await Promise.all([
                    fetchJSON('/smf'),
                    fetchJSON('/oscillators'),
                    fetchJSON('/goals'),
                    fetchJSON('/stabilization')
                ]);
                
                this.sedenion.setData(smf);
                this.sedenion.renderAxes(smf.components, smf.dominant);
                this.panels.renderSMFDominant(smf.dominant);
                this.panels.renderSMFStats(smf);
                
                this.oscillators.setData(osc.topOscillators || [], parseFloat(this.headerCoherence?.textContent) / 100 || 0);
                this.panels.renderOscillatorStats(osc);
                
                this.panels.renderGoals(goals);
                this.updateLambda(stabilization);
                
            } catch (err) {
                // Silent fail on polling
            }
        }, 2000);
        
        // Poll moments less frequently
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const moments = await fetchJSON('/moments?count=5');
                this.panels.momentsData = moments.moments || [];
                this.panels.renderMoments(moments);
            } catch (err) {
                // Silent fail
            }
        }, 5000);
        
        // Poll senses every 3 seconds
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const senses = await fetchJSON('/senses');
                this.panels.renderSenses(senses);
            } catch (err) {
                // Silent fail
            }
        }, 3000);
    }
    
    handleToggleSidebar() {
        this.sidebarVisible = !this.sidebarVisible;
        this.sidebar?.classList.toggle('hidden', !this.sidebarVisible);
        this.toggleSidebarBtn?.classList.toggle('active', this.sidebarVisible);
    }
    
    showToast(title, message, type = 'info') {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message"><strong>${title}:</strong> ${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    // Expose section toggle for introspection modal
    toggleSection(key) {
        this.introspection?.toggleSection(key);
    }
}

// Initialize when DOM is ready
let sentientUI;
document.addEventListener('DOMContentLoaded', () => {
    sentientUI = new SentientUI();
    window.sentientUI = sentientUI;
});