
/**
 * Sentient Observer - Enhanced Web UI
 * 
 * A beautiful, real-time interface for the Sentient Observer system.
 */

class SentientUI {
    constructor() {
        // State
        this.isConnected = false;
        this.isProcessing = false;
        this.sidebarVisible = true;
        this.oscillatorData = [];
        this.smfData = null;
        this.momentsData = [];
        this.goalsData = null;
        this.sensesData = null;
        
        // Streams
        this.statusStream = null;
        this.momentStream = null;
        
        // Animation
        this.animationFrame = null;
        this.lastRenderTime = 0;
        
        // Initialize when DOM is ready
        this.init();
    }
    
    async init() {
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Connect to SSE streams
        this.connectStatusStream();
        this.connectMomentStream();
        
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
        
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearHistory = document.getElementById('clearHistory');
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.oscillatorCanvas = document.getElementById('oscillatorCanvas');
        this.oscillatorCtx = this.oscillatorCanvas?.getContext('2d');
        this.activeOsc = document.getElementById('activeOsc');
        this.oscEnergy = document.getElementById('oscEnergy');
        this.sedenionCanvas = document.getElementById('sedenionCanvas');
        this.sedenionCtx = this.sedenionCanvas?.getContext('2d');
        this.sedenionAxes = document.getElementById('sedenionAxes');
        this.smfDominant = document.getElementById('smfDominant');
        this.smfEntropy = document.getElementById('smfEntropy');
        this.smfNorm = document.getElementById('smfNorm');
        
        // Sedenion history for trail visualization
        this.sedenionHistory = [];
        this.subjectiveTime = document.getElementById('subjectiveTime');
        this.momentsList = document.getElementById('momentsList');
        this.goalsList = document.getElementById('goalsList');
        this.sensesList = document.getElementById('sensesList');
        this.sensesAnomalies = document.getElementById('sensesAnomalies');
        this.anomalyCount = document.getElementById('anomalyCount');
        
        // Buttons
        this.toggleSidebar = document.getElementById('toggleSidebar');
        this.toggleIntrospect = document.getElementById('toggleIntrospect');
        
        // Modal elements
        this.introspectOverlay = document.getElementById('introspectOverlay');
        this.introspectContent = document.getElementById('introspectContent');
        this.closeIntrospect = document.getElementById('closeIntrospect');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
    }
    
    setupEventListeners() {
        // Chat form submission
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        
        // Enter to send (Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.chatForm.dispatchEvent(new Event('submit'));
            }
        });
        
        // Clear history
        this.clearHistory.addEventListener('click', () => this.handleClearHistory());
        
        // Toggle sidebar
        this.toggleSidebar.addEventListener('click', () => this.handleToggleSidebar());
        
        // Toggle introspection
        this.toggleIntrospect.addEventListener('click', () => this.showIntrospection());
        this.closeIntrospect.addEventListener('click', () => this.hideIntrospection());
        this.introspectOverlay.addEventListener('click', (e) => {
            if (e.target === this.introspectOverlay) this.hideIntrospection();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideIntrospection();
            if (e.key === '/' && e.ctrlKey) {
                e.preventDefault();
                this.messageInput.focus();
            }
        });
        
        // High DPI canvas handling
        this.setupCanvasResolution();
        this.setupSedenionCanvasResolution();
        window.addEventListener('resize', () => {
            this.setupCanvasResolution();
            this.setupSedenionCanvasResolution();
        });
        
        // Start sedenion animation loop
        this.startSedenionAnimation();
    }
    
    startSedenionAnimation() {
        // Animate sedenion visualization at 30fps for smooth transitions
        const animate = () => {
            if (this.currentSMFData) {
                this.drawSedenion3D(this.currentSMFData);
            }
            this.sedenionAnimationFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    setupCanvasResolution() {
        if (!this.oscillatorCanvas) return;
        
        const rect = this.oscillatorCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.oscillatorCanvas.width = rect.width * dpr;
        this.oscillatorCanvas.height = rect.height * dpr;
        
        if (this.oscillatorCtx) {
            this.oscillatorCtx.scale(dpr, dpr);
        }
    }
    
    setupSedenionCanvasResolution() {
        if (!this.sedenionCanvas) return;
        
        const rect = this.sedenionCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.sedenionCanvas.width = rect.width * dpr;
        this.sedenionCanvas.height = rect.height * dpr;
        
        if (this.sedenionCtx) {
            this.sedenionCtx.scale(dpr, dpr);
        }
    }
    
    autoResizeTextarea() {
        const textarea = this.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    // =========================================================================
    // SSE Stream Connections
    // =========================================================================
    
    connectStatusStream() {
        if (this.statusStream) {
            this.statusStream.close();
        }
        
        this.statusStream = new EventSource('/stream/status');
        
        this.statusStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'status') {
                    this.updateStatusDisplay(data.data);
                }
            } catch (err) {
                console.error('Status stream parse error:', err);
            }
        };
        
        this.statusStream.onopen = () => {
            this.setConnected(true);
        };
        
        this.statusStream.onerror = () => {
            this.setConnected(false);
            setTimeout(() => this.connectStatusStream(), 3000);
        };
    }
    
    connectMomentStream() {
        if (this.momentStream) {
            this.momentStream.close();
        }
        
        this.momentStream = new EventSource('/stream/moments');
        this.lastMomentTime = {};  // Track last time per trigger type
        
        this.momentStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'moment') {
                    const moment = data.data;
                    const now = Date.now();
                    
                    // Throttle by trigger type - skip if same trigger within 5 seconds
                    const lastTime = this.lastMomentTime[moment.trigger] || 0;
                    if (now - lastTime < 5000) {
                        return; // Skip - too soon after same trigger type
                    }
                    
                    this.lastMomentTime[moment.trigger] = now;
                    this.addMoment(moment);
                    
                    // No toasts for moments - the moments panel is sufficient
                }
            } catch (err) {
                console.error('Moment stream parse error:', err);
            }
        };
    }
    
    setConnected(connected) {
        this.isConnected = connected;
        this.statusIndicator.className = 'status-indicator ' + (connected ? 'connected' : 'disconnected');
        this.statusText.textContent = connected ? 'Connected' : 'Disconnected';
    }
    
    updateStatusDisplay(data) {
        if (data.coherence !== undefined) {
            this.headerCoherence.textContent = (data.coherence * 100).toFixed(0) + '%';
            this.headerCoherence.className = 'metric-value ' + this.getCoherenceClass(data.coherence);
        }
        if (data.entropy !== undefined) {
            this.headerEntropy.textContent = (data.entropy * 100).toFixed(0) + '%';
        }
        if (data.momentCount !== undefined) {
            this.headerMoments.textContent = data.momentCount;
        }
    }
    
    getCoherenceClass(coherence) {
        if (coherence > 0.7) return 'coherence-high';
        if (coherence > 0.4) return 'coherence-medium';
        return 'coherence-low';
    }
    
    // =========================================================================
    // Data Loading
    // =========================================================================
    
    async loadInitialData() {
        // Use allSettled so individual endpoint failures don't break everything
        const results = await Promise.allSettled([
            this.fetchJSON('/smf'),
            this.fetchJSON('/oscillators'),
            this.fetchJSON('/moments?count=5'),
            this.fetchJSON('/goals'),
            this.fetchJSON('/history'),
            this.fetchJSON('/stabilization'),
            this.fetchJSON('/senses')
        ]);
        
        // Extract values, using null for failed requests
        const [smf, osc, moments, goals, history, stabilization, senses] = results.map(r =>
            r.status === 'fulfilled' ? r.value : null
        );
        
        // Track any failures for logging
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn('Some initial data endpoints failed:', failures.map(f => f.reason?.message || f.reason));
        }
        
        // Render whatever data we successfully loaded
        if (smf) {
            this.smfData = smf;
            this.renderSMF(smf);
        }
        
        if (osc) {
            this.oscillatorData = osc.topOscillators || [];
            this.renderOscillators(osc);
        }
        
        if (moments) {
            this.momentsData = moments.moments || [];
            this.renderMoments(moments);
        }
        
        if (goals) {
            this.goalsData = goals;
            this.renderGoals(goals);
        }
        
        if (history) {
            this.renderHistory(history.messages || []);
        }
        
        if (stabilization) {
            this.updateLambda(stabilization);
        }
        
        if (senses) {
            this.sensesData = senses;
            this.renderSenses(senses);
        }
    }
    
    async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }
    
    startPolling() {
        // Poll for updates every 2 seconds
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const [smf, osc, goals, stabilization] = await Promise.all([
                    this.fetchJSON('/smf'),
                    this.fetchJSON('/oscillators'),
                    this.fetchJSON('/goals'),
                    this.fetchJSON('/stabilization')
                ]);
                
                this.smfData = smf;
                this.oscillatorData = osc.topOscillators || [];
                this.goalsData = goals;
                
                this.renderSMF(smf);
                this.renderOscillators(osc);
                this.renderGoals(goals);
                this.updateLambda(stabilization);
                
            } catch (err) {
                // Silent fail on polling
            }
        }, 2000);
        
        // Poll moments less frequently
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const moments = await this.fetchJSON('/moments?count=5');
                this.momentsData = moments.moments || [];
                this.renderMoments(moments);
            } catch (err) {
                // Silent fail
            }
        }, 5000);
        
        // Poll senses every 3 seconds
        setInterval(async () => {
            if (!this.isConnected) return;
            
            try {
                const senses = await this.fetchJSON('/senses');
                this.sensesData = senses;
                this.renderSenses(senses);
            } catch (err) {
                // Silent fail
            }
        }, 3000);
    }
    
    updateLambda(stabilization) {
        if (stabilization && stabilization.current !== undefined) {
            const lambda = stabilization.current;
            this.headerLambda.textContent = lambda.toFixed(3);
            
            // Interpret lambda
            let cls = 'lambda-stable';
            if (lambda < -0.1) cls = 'lambda-collapsed';
            else if (lambda > 0.1) cls = 'lambda-unstable';
            this.headerLambda.className = 'metric-value ' + cls;
        }
    }
    
    // =========================================================================
    // Oscillator Visualization (Canvas) - Enhanced PRSC View
    // =========================================================================
    
    startAnimationLoop() {
        const animate = (time) => {
            if (time - this.lastRenderTime > 33) { // ~30fps for smoother animation
                this.drawOscillators();
                this.lastRenderTime = time;
            }
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    drawOscillators() {
        const ctx = this.oscillatorCtx;
        if (!ctx) return;
        
        const rect = this.oscillatorCanvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const time = Date.now() / 1000;
        
        // Clear canvas with slight fade for trail effect
        ctx.fillStyle = 'rgba(10, 10, 20, 0.15)';
        ctx.fillRect(0, 0, width, height);
        
        const oscillators = this.oscillatorData.slice(0, 16);
        if (oscillators.length === 0) {
            // Draw placeholder
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '12px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Awaiting oscillator data...', width/2, height/2);
            return;
        }
        
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(width, height) * 0.42;
        const coherence = parseFloat(this.headerCoherence?.textContent) / 100 || 0;
        
        // Draw the circular ring network
        this.drawOscillatorNetwork(ctx, cx, cy, maxRadius, oscillators, time, coherence);
        
        // Draw phase wheel in center
        this.drawPhaseWheel(ctx, cx, cy, maxRadius * 0.3, oscillators, time, coherence);
        
        // Draw frequency spectrum at bottom
        this.drawFrequencySpectrum(ctx, width, height, oscillators, time);
    }
    
    drawOscillatorNetwork(ctx, cx, cy, maxRadius, oscillators, time, coherence) {
        const n = oscillators.length;
        
        // Draw coupling connections first (behind nodes)
        ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const osc1 = oscillators[i];
                const osc2 = oscillators[j];
                
                // Calculate coupling strength based on amplitude similarity and phase difference
                const phaseDiff = Math.abs((osc1.phase || 0) - (osc2.phase || 0)) % (2 * Math.PI);
                const normalizedPhaseDiff = phaseDiff > Math.PI ? 2 * Math.PI - phaseDiff : phaseDiff;
                const coupling = (1 - normalizedPhaseDiff / Math.PI) * Math.min(osc1.amplitude || 0, osc2.amplitude || 0);
                
                if (coupling > 0.1) {
                    const angle1 = (i / n) * 2 * Math.PI - Math.PI / 2;
                    const angle2 = (j / n) * 2 * Math.PI - Math.PI / 2;
                    
                    const x1 = cx + Math.cos(angle1) * maxRadius * 0.8;
                    const y1 = cy + Math.sin(angle1) * maxRadius * 0.8;
                    const x2 = cx + Math.cos(angle2) * maxRadius * 0.8;
                    const y2 = cy + Math.sin(angle2) * maxRadius * 0.8;
                    
                    // Animate coupling lines
                    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i + j);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${coupling * 0.4 * pulse})`;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        }
        
        // Draw oscillator nodes on the ring
        oscillators.forEach((osc, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const amplitude = osc.amplitude || 0;
            const phase = osc.phase || 0;
            const frequency = osc.frequency || 1;
            
            // Oscillator position with slight radial oscillation
            const radialOsc = Math.sin(time * frequency + phase) * 5;
            const r = maxRadius * 0.8 + radialOsc;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            // Node size based on amplitude
            const nodeRadius = 4 + amplitude * 12;
            
            // Color based on prime (use golden ratio for nice distribution)
            const hue = ((osc.prime || 2) * 137.5) % 360;
            const saturation = 60 + amplitude * 40;
            const lightness = 50 + amplitude * 20;
            
            // Draw glow
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 3);
            glowGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + amplitude * 0.4})`);
            glowGradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius * 3, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
            
            // Draw node
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fill();
            
            // Draw phase indicator (small line from center)
            const phaseX = x + Math.cos(phase + time * frequency) * nodeRadius * 1.5;
            const phaseY = y + Math.sin(phase + time * frequency) * nodeRadius * 1.5;
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(phaseX, phaseY);
            ctx.stroke();
            
            // Draw prime label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelR = maxRadius * 0.95;
            const labelX = cx + Math.cos(angle) * labelR;
            const labelY = cy + Math.sin(angle) * labelR;
            ctx.fillText(osc.prime || '?', labelX, labelY);
        });
        
        // Draw outer ring
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 + coherence * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawPhaseWheel(ctx, cx, cy, radius, oscillators, time, coherence) {
        // Draw phase coherence wheel in center
        const n = oscillators.length;
        
        // Background circle
        ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw phase vectors from each oscillator
        let avgPhaseX = 0, avgPhaseY = 0;
        
        oscillators.forEach((osc, i) => {
            const phase = (osc.phase || 0) + time * (osc.frequency || 1);
            const amplitude = osc.amplitude || 0;
            
            const x = Math.cos(phase) * amplitude;
            const y = Math.sin(phase) * amplitude;
            
            avgPhaseX += x;
            avgPhaseY += y;
            
            // Draw individual phase vector
            const hue = ((osc.prime || 2) * 137.5) % 360;
            ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + x * radius * 0.8, cy + y * radius * 0.8);
            ctx.stroke();
        });
        
        // Normalize average phase
        avgPhaseX /= n;
        avgPhaseY /= n;
        
        // Draw resultant (order parameter)
        const orderMag = Math.sqrt(avgPhaseX * avgPhaseX + avgPhaseY * avgPhaseY);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.5 + orderMag * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + avgPhaseX * radius * 0.8, cy + avgPhaseY * radius * 0.8);
        ctx.stroke();
        
        // Draw order parameter dot
        ctx.beginPath();
        ctx.arc(cx + avgPhaseX * radius * 0.8, cy + avgPhaseY * radius * 0.8, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
        
        // Draw center coherence value
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`r=${orderMag.toFixed(2)}`, cx, cy);
    }
    
    drawFrequencySpectrum(ctx, width, height, oscillators, time) {
        const barHeight = 25;
        const y = height - barHeight - 5;
        const barWidth = width / oscillators.length;
        
        // Background
        ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
        ctx.fillRect(0, y - 2, width, barHeight + 7);
        
        // Draw frequency bars
        oscillators.forEach((osc, i) => {
            const amplitude = osc.amplitude || 0;
            const frequency = osc.frequency || 1;
            const phase = osc.phase || 0;
            
            // Animate bar height
            const animatedAmp = amplitude * (0.7 + 0.3 * Math.sin(time * frequency * 2 + phase));
            const h = animatedAmp * barHeight;
            
            const x = i * barWidth + 2;
            const w = barWidth - 4;
            
            // Color based on prime
            const hue = ((osc.prime || 2) * 137.5) % 360;
            
            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(x, y + barHeight - h, x, y + barHeight);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.9)`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.5)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y + barHeight - h, w, h);
        });
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SPECTRUM', 5, y);
    }
    
    renderOscillators(osc) {
        if (osc.active !== undefined) {
            this.activeOsc.textContent = osc.active;
        }
        if (osc.energy !== undefined) {
            this.oscEnergy.textContent = osc.energy.toFixed(2);
        }
        this.oscillatorData = osc.topOscillators || [];
    }
    
    // =========================================================================
    // Sedenion Identity Field Visualization
    // =========================================================================
    
    renderSMF(smf) {
        if (!smf || !smf.orientation) return;
        
        // Store for animation loop
        this.currentSMFData = smf;
        
        // Store history for trail visualization
        if (smf.components) {
            this.sedenionHistory.push({
                t: Date.now(),
                components: smf.components.map(c => c.value)
            });
            // Keep last 30 samples for trail
            if (this.sedenionHistory.length > 30) {
                this.sedenionHistory.shift();
            }
        }
        
        // Draw the 3D-style sedenion visualization
        this.drawSedenion3D(smf);
        
        // Render the 16-axis grid
        this.renderSedenionAxes(smf.components, smf.dominant);
        
        // Render dominant axes summary
        this.renderSMFDominant(smf.dominant);
        
        // Update stats
        if (smf.entropy !== undefined && this.smfEntropy) {
            this.smfEntropy.textContent = smf.entropy.toFixed(3);
        }
        if (smf.norm !== undefined && this.smfNorm) {
            this.smfNorm.textContent = smf.norm.toFixed(3);
        }
    }
    
    drawSedenion3D(smf) {
        const ctx = this.sedenionCtx;
        if (!ctx || !smf.components) return;
        
        const rect = this.sedenionCanvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const cx = width / 2;
        const cy = height / 2;
        const time = Date.now() / 1000;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw historical trails first (fading)
        if (this.sedenionHistory.length > 1) {
            for (let h = 0; h < this.sedenionHistory.length - 1; h++) {
                const alpha = (h / this.sedenionHistory.length) * 0.3;
                const histComponents = this.sedenionHistory[h].components;
                
                ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
                    const value = Math.abs(histComponents[i] || 0);
                    const r = 20 + value * 60;
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
        
        // Draw axis lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
            const x = cx + Math.cos(angle) * 85;
            const y = cy + Math.sin(angle) * 85;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        // Draw circular guides
        [0.33, 0.66, 1].forEach(scale => {
            ctx.beginPath();
            ctx.arc(cx, cy, 20 + scale * 60, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 + scale * 0.05})`;
            ctx.stroke();
        });
        
        // Draw current sedenion state as filled polygon
        const components = smf.components;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
        
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
            const value = Math.abs(components[i]?.value || 0);
            const r = 20 + value * 60;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw animated points at each axis
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
            const comp = components[i];
            const value = comp?.value || 0;
            const absValue = Math.abs(value);
            const r = 20 + absValue * 60;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            // Pulsing effect for dominant axes
            const isDominant = smf.dominant?.some(d => d.index === i);
            const pulse = isDominant ? 1 + 0.2 * Math.sin(time * 3 + i) : 1;
            const radius = (absValue > 0.3 ? 5 : 3) * pulse;
            
            // Color based on sign
            const color = value >= 0 ? '#6366f1' : '#a855f7';
            const glowColor = value >= 0 ? 'rgba(99, 102, 241, 0.5)' : 'rgba(168, 85, 247, 0.5)';
            
            // Draw glow
            const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
            pointGradient.addColorStop(0, glowColor);
            pointGradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = pointGradient;
            ctx.fill();
            
            // Draw point
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Draw axis label for dominant axes
            if (isDominant && absValue > 0.2) {
                ctx.font = '9px JetBrains Mono, monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                const labelX = cx + Math.cos(angle) * (r + 12);
                const labelY = cy + Math.sin(angle) * (r + 12);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(comp.name?.slice(0, 3).toUpperCase() || '', labelX, labelY);
            }
        }
        
        // Draw center point
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        
        // Draw entropy indicator ring
        const entropy = smf.entropy || 0;
        const entropyRadius = 15;
        const entropyAngle = entropy * Math.PI; // 0 to π for entropy 0 to 1
        
        ctx.beginPath();
        ctx.arc(cx, cy, entropyRadius, -Math.PI / 2, -Math.PI / 2 + entropyAngle);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 + entropy * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    renderSedenionAxes(components, dominant) {
        if (!this.sedenionAxes || !components) return;
        
        const dominantIndices = new Set(dominant?.map(d => d.index) || []);
        
        this.sedenionAxes.innerHTML = components.map((comp, i) => {
            const value = comp.value;
            const absValue = Math.abs(value);
            const isPositive = value >= 0;
            const isDominant = dominantIndices.has(i);
            const isActive = absValue > 0.1;
            
            return `
                <div class="sedenion-axis ${isDominant ? 'dominant' : ''} ${isActive ? 'active' : ''}"
                     title="${comp.description || comp.name}">
                    <span class="axis-name">${comp.name}</span>
                    <span class="axis-value ${isPositive ? 'positive' : 'negative'}">${value.toFixed(2)}</span>
                    <div class="axis-bar-container">
                        <div class="axis-bar ${isPositive ? 'positive' : 'negative'}"
                             style="width: ${absValue * 100}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderSMFDominant(dominant) {
        if (!dominant || !this.smfDominant) return;
        
        this.smfDominant.innerHTML = dominant.slice(0, 5).map((axis, i) => `
            <div class="dominant-axis">
                <span class="rank">${i + 1}</span>
                <span class="name">${axis.name}</span>
                <span class="value">${axis.value.toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    // =========================================================================
    // Moments Timeline
    // =========================================================================
    
    renderMoments(data) {
        if (!data.moments || data.moments.length === 0) {
            this.momentsList.innerHTML = '<div class="moment-placeholder">No moments yet</div>';
            return;
        }
        
        // Filter out entropy_extreme entirely - they're too noisy
        // Only show coherence and phase_transition moments
        const filtered = data.moments
            .filter(m => m.trigger !== 'entropy_extreme')
            .slice(0, 5);
        
        if (filtered.length === 0) {
            this.momentsList.innerHTML = '<div class="moment-placeholder">Awaiting coherence...</div>';
            return;
        }
        
        this.momentsList.innerHTML = filtered.map(m => `
            <div class="moment-item ${m.trigger}">
                <span class="moment-icon">${this.getMomentIcon(m.trigger)}</span>
                <div class="moment-details">
                    <div class="moment-trigger">${m.trigger.replace('_', ' ')}</div>
                    <div class="moment-stats">C=${(m.coherence * 100).toFixed(0)}% H=${(m.entropy * 100).toFixed(0)}%</div>
                </div>
            </div>
        `).join('');
        
        if (data.subjectiveTime !== undefined) {
            this.subjectiveTime.textContent = data.subjectiveTime.toFixed(1);
        }
    }
    
    addMoment(moment) {
        // Skip entropy_extreme entirely from SSE stream
        if (moment.trigger === 'entropy_extreme') {
            return;
        }
        
        // Deduplicate: don't add if same trigger within last 2 seconds
        const now = Date.now();
        const recentSame = this.momentsData.find(m =>
            m.trigger === moment.trigger &&
            (now - (m.timestamp || now)) < 2000
        );
        
        if (recentSame) {
            return; // Skip duplicate
        }
        
        moment.timestamp = now;
        this.momentsData.unshift(moment);
        
        // Keep more moments but only display filtered set
        if (this.momentsData.length > 20) {
            this.momentsData = this.momentsData.slice(0, 20);
        }
        
        this.renderMoments({ moments: this.momentsData });
    }
    
    getMomentIcon(trigger) {
        switch (trigger) {
            case 'coherence': return '🎯';
            case 'entropy_extreme': return '⚡';
            case 'phase_transition': return '🌊';
            default: return '📍';
        }
    }
    
    // =========================================================================
    // Goals & Attention
    // =========================================================================
    
    renderGoals(goals) {
        if (!goals) return;
        
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
                    <span class="focus-icon">🎯</span>
                    ${this.escapeHtml(goals.topFocus.target)} (${goals.topFocus.type})
                </div>
            `;
        }
        
        if (!html) {
            html = '<div class="goal-placeholder">No active goals</div>';
        }
        
        this.goalsList.innerHTML = html;
    }
    
    // =========================================================================
    // Senses Panel
    // =========================================================================
    
    renderSenses(data) {
        if (!data || !data.senses || !this.sensesList) return;
        
        const senseIcons = {
            chrono: '⏰',
            proprio: '🧭',
            filesystem: '📁',
            git: '🌿',
            process: '⚙️',
            network: '🌐',
            user: '👤'
        };
        
        // Update each sense item
        for (const [name, sense] of Object.entries(data.senses)) {
            const valueEl = document.getElementById(`sense${this.capitalize(name)}Value`);
            const statusEl = document.getElementById(`sense${this.capitalize(name)}Status`);
            const itemEl = this.sensesList.querySelector(`[data-sense="${name}"]`);
            
            if (valueEl) {
                valueEl.textContent = sense.summary || '--';
            }
            
            if (statusEl) {
                statusEl.className = 'sense-status';
                if (sense.error) {
                    statusEl.classList.add('error');
                } else if (sense.active) {
                    statusEl.classList.add('active');
                }
            }
            
            if (itemEl) {
                itemEl.classList.toggle('anomaly', data.anomalies?.some(a => a.sense === name));
            }
        }
        
        // Update anomaly count
        if (this.anomalyCount) {
            this.anomalyCount.textContent = data.anomalies?.length || 0;
        }
        
        // Render anomalies
        if (this.sensesAnomalies && data.anomalies) {
            if (data.anomalies.length === 0) {
                this.sensesAnomalies.innerHTML = '';
            } else {
                this.sensesAnomalies.innerHTML = data.anomalies.map(a => `
                    <div class="anomaly-item">
                        <span class="anomaly-sense">${a.sense}</span>
                        <span class="anomaly-msg">${this.escapeHtml(a.message)}</span>
                    </div>
                `).join('');
            }
        }
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // =========================================================================
    // Chat Handling
    // =========================================================================
    
    renderHistory(messages) {
        if (!messages || messages.length === 0) return;
        
        // Clear welcome message first
        const welcome = this.chatMessages.querySelector('.welcome');
        
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
        this.messageInput.style.height = 'auto';
        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        // Add user message
        this.addMessage('user', message);
        
        // Add assistant placeholder with typing indicator
        const assistantMsg = this.addMessage('assistant', '', true);
        const contentEl = assistantMsg.querySelector('.message-content');
        contentEl.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, stream: true })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle case where response is empty but we have tool results
            const hasContent = data.response && data.response.trim().length > 0;
            const hasToolResults = data.toolResults && data.toolResults.length > 0;
            
            if (hasContent) {
                // Render response with markdown
                contentEl.innerHTML = this.renderMarkdown(data.response);
            } else if (hasToolResults) {
                // Response was only tool calls, show a summary
                contentEl.innerHTML = '<span class="tool-summary">Executed tools:</span>';
            } else {
                // No response at all - show placeholder
                contentEl.innerHTML = '<span style="color: var(--text-dim)">No response received</span>';
            }
            
            // Show tool results inline if any
            if (hasToolResults) {
                const toolsContainer = document.createElement('div');
                toolsContainer.className = 'tool-results';
                
                data.toolResults.forEach(result => {
                    const toolEl = document.createElement('div');
                    toolEl.className = `tool-result ${result.success ? 'success' : 'error'}`;
                    
                    toolEl.innerHTML = `
                        <div class="tool-header">
                            <span class="tool-icon">${result.success ? '✓' : '✗'}</span>
                            <span class="tool-name">${this.escapeHtml(result.tool)}</span>
                        </div>
                        ${result.content ? `<div class="tool-content"><pre>${this.escapeHtml(result.content)}</pre></div>` : ''}
                    `;
                    
                    toolsContainer.appendChild(toolEl);
                });
                
                contentEl.appendChild(toolsContainer);
            }
            
            // Add meta info
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.innerHTML = `<span>${new Date().toLocaleTimeString()}</span>`;
            if (data.state) {
                meta.innerHTML += `<span>C: ${(data.state.coherence * 100).toFixed(0)}%</span>`;
            }
            if (data.hasTools) {
                meta.innerHTML += `<span>🔧 ${data.toolResults.length} tool${data.toolResults.length > 1 ? 's' : ''}</span>`;
            }
            assistantMsg.querySelector('.message-body').appendChild(meta);
            
            // Update status
            if (data.state) {
                this.updateStatusDisplay({
                    coherence: data.state.coherence,
                    entropy: data.state.entropy
                });
            }
            
        } catch (err) {
            contentEl.innerHTML = `<span style="color: var(--error)">Error: ${err.message}</span>`;
            this.showToast('Error', err.message, 'error');
        }
        
        this.isProcessing = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
        this.scrollToBottom();
    }
    
    addMessage(role, content, isStreaming = false) {
        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        
        const avatar = role === 'user' ? '👤' : '🌌';
        
        msg.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-body">
                <div class="message-content">${isStreaming ? '' : this.renderMarkdown(content)}</div>
            </div>
        `;
        
        if (!isStreaming && content) {
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.innerHTML = `<span>${new Date().toLocaleTimeString()}</span>`;
            msg.querySelector('.message-body').appendChild(meta);
        }
        
        this.chatMessages.appendChild(msg);
        this.scrollToBottom();
        
        return msg;
    }
    
    // Simple markdown renderer
    renderMarkdown(text) {
        if (!text) return '';
        
        let html = text
            // Escape HTML first
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        // Lists (simple)
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return html;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    async handleClearHistory() {
        if (!confirm('Clear all conversation history?')) return;
        
        try {
            await fetch('/history', { method: 'DELETE' });
            
            // Keep only the welcome message
            const welcome = this.chatMessages.querySelector('.welcome');
            this.chatMessages.innerHTML = '';
            if (welcome) {
                this.chatMessages.appendChild(welcome);
            }
            
            this.showToast('Success', 'History cleared', 'success');
        } catch (err) {
            this.showToast('Error', 'Failed to clear history', 'error');
        }
    }
    
    // =========================================================================
    // Sidebar Toggle
    // =========================================================================
    
    handleToggleSidebar() {
        this.sidebarVisible = !this.sidebarVisible;
        this.sidebar.classList.toggle('hidden', !this.sidebarVisible);
        this.toggleSidebar.classList.toggle('active', this.sidebarVisible);
    }
    
    // =========================================================================
    // Introspection Modal
    // =========================================================================
    
    async showIntrospection() {
        this.introspectOverlay.classList.add('visible');
        this.toggleIntrospect.classList.add('active');
        
        try {
            const data = await this.fetchJSON('/introspect');
            this.renderIntrospection(data);
        } catch (err) {
            this.introspectContent.innerHTML = `
                <div class="introspect-loading">
                    <span style="color: var(--error)">Error loading introspection: ${err.message}</span>
                </div>
            `;
        }
    }
    
    hideIntrospection() {
        this.introspectOverlay.classList.remove('visible');
        this.toggleIntrospect.classList.remove('active');
    }
    
    renderIntrospection(data) {
        const sections = [
            { key: 'identity', title: '🪪 Identity', data: data.identity },
            { key: 'smfOrientation', title: '◈ SMF Orientation', data: data.smfOrientation },
            { key: 'metacognition', title: '🧠 Metacognition', data: data.metacognition },
            { key: 'currentMoment', title: '◉ Current Moment', data: data.currentMoment },
            { key: 'attention', title: '🎯 Attention Foci', data: data.attention },
            { key: 'goals', title: '🎯 Active Goals', data: data.goals },
            { key: 'recentMoments', title: '📍 Recent Moments', data: data.recentMoments },
            { key: 'safetyReport', title: '🛡️ Safety Report', data: data.safetyReport }
        ];
        
        this.introspectContent.innerHTML = sections.map(section => `
            <div class="introspect-section expanded" data-section="${section.key}">
                <div class="introspect-section-header" onclick="sentientUI.toggleSection('${section.key}')">
                    <h4>${section.title}</h4>
                    <svg class="introspect-section-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
                <div class="introspect-section-content">
                    ${this.renderIntrospectData(section.key, section.data)}
                </div>
            </div>
        `).join('');
    }
    
    renderIntrospectData(key, data) {
        if (!data) return '<span style="color: var(--text-dim)">No data</span>';
        
        // Custom rendering for specific sections
        if (key === 'metacognition') {
            return `
                <div class="introspect-grid">
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${(data.processingLoad * 100).toFixed(0)}%</div>
                        <div class="introspect-stat-label">Processing Load</div>
                    </div>
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${data.emotionalValence.toFixed(2)}</div>
                        <div class="introspect-stat-label">Emotional Valence</div>
                    </div>
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${(data.confidenceLevel * 100).toFixed(0)}%</div>
                        <div class="introspect-stat-label">Confidence</div>
                    </div>
                </div>
            `;
        }
        
        if (key === 'smfOrientation') {
            // Handle dominantAxes that might be array, object, or missing
            let axesHtml = '';
            if (data.dominantAxes) {
                if (Array.isArray(data.dominantAxes)) {
                    axesHtml = data.dominantAxes.map(axis => `
                        <div class="introspect-stat">
                            <div class="introspect-stat-value text-gradient">${typeof axis === 'object' ? (axis.name || JSON.stringify(axis)) : axis}</div>
                            <div class="introspect-stat-label">Dominant Axis</div>
                        </div>
                    `).join('');
                } else if (typeof data.dominantAxes === 'object') {
                    // It might be an object with named properties
                    axesHtml = Object.entries(data.dominantAxes).slice(0, 5).map(([key, val]) => `
                        <div class="introspect-stat">
                            <div class="introspect-stat-value text-gradient">${key}</div>
                            <div class="introspect-stat-label">${typeof val === 'number' ? val.toFixed(2) : String(val)}</div>
                        </div>
                    `).join('');
                }
            }
            
            // Handle components that might have slice or not
            let componentsJson = 'No components';
            if (data.components) {
                if (Array.isArray(data.components)) {
                    componentsJson = JSON.stringify(data.components.slice(0, 8), null, 2) + '...';
                } else {
                    componentsJson = JSON.stringify(data.components, null, 2);
                }
            }
            
            return `
                <div class="introspect-grid">
                    ${axesHtml || '<div class="introspect-stat"><div class="introspect-stat-value">--</div><div class="introspect-stat-label">No dominant axes</div></div>'}
                </div>
                <div class="introspect-json">${componentsJson}</div>
            `;
        }
        
        if (key === 'identity') {
            return `
                <div class="introspect-grid">
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${data.name || 'Observer'}</div>
                        <div class="introspect-stat-label">Name</div>
                    </div>
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${data.continuityMarkers?.length || 0}</div>
                        <div class="introspect-stat-label">Continuity Markers</div>
                    </div>
                </div>
            `;
        }
        
        // Default: JSON display
        return `<div class="introspect-json">${JSON.stringify(data, null, 2)}</div>`;
    }
    
    toggleSection(key) {
        const section = document.querySelector(`[data-section="${key}"]`);
        if (section) {
            section.classList.toggle('expanded');
        }
    }
    
    // =========================================================================
    // Toast Notifications
    // =========================================================================
    
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message"><strong>${title}:</strong> ${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    // =========================================================================
    // Utilities
    // =========================================================================
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
let sentientUI;
document.addEventListener('DOMContentLoaded', () => {
    sentientUI = new SentientUI();
    window.sentientUI = sentientUI;
});