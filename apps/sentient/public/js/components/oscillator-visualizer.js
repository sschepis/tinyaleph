/**
 * Oscillator Visualizer Component
 * 
 * Canvas-based visualization of PRSC oscillators with:
 * - Network view (radial layout with coupling connections)
 * - Phase wheel (order parameter display)
 * - Spectrum bars
 * - Mini mode for dashboard strip
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class OscillatorVisualizer extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            oscillators: [],
            coherence: 0
        };
        
        // Field history for time-series visualization
        this.fieldHistory = [];
        this.maxHistory = 60;
        
        // Activity tracking
        this.lastActivityTime = Date.now();
        this.isActive = false;
        
        // Animation
        this.animationId = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    static get observedAttributes() {
        return ['mini', 'width', 'height'];
    }
    
    get isMini() {
        return this.hasAttribute('mini');
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
            
            .visualizer-container {
                width: 100%;
                height: 100%;
                position: relative;
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                overflow: hidden;
            }
            
            canvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            
            .activity-indicator {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--success);
                opacity: 0;
                transition: opacity var(--transition-fast);
            }
            
            .activity-indicator.active {
                opacity: 1;
                animation: pulse 1s infinite;
            }
        `;
    }
    
    template() {
        return `
            <div class="visualizer-container">
                <canvas id="oscCanvas"></canvas>
                <div class="activity-indicator" id="activityIndicator"></div>
            </div>
        `;
    }
    
    onMount() {
        this.canvas = this.$('#oscCanvas');
        this.ctx = this.canvas?.getContext('2d');
        
        this.setupResolution();
        this.startAnimation();
        
        // Handle resize
        this.resizeObserver = new ResizeObserver(() => this.setupResolution());
        this.resizeObserver.observe(this);
    }
    
    onUnmount() {
        this.stopAnimation();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    
    setupResolution() {
        if (!this.canvas) return;
        
        const rect = this.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }
    
    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Set oscillator data
     */
    setData(oscillators, coherence = 0) {
        this._state.oscillators = oscillators || [];
        this._state.coherence = coherence;
    }
    
    /**
     * Set field history from stream
     */
    setFieldHistory(history) {
        this.fieldHistory = history || [];
        
        // Check for activity
        if (history && history.length >= 2) {
            const recent = history.slice(-2);
            const cohDelta = Math.abs((recent[1]?.coherence || 0) - (recent[0]?.coherence || 0));
            if (cohDelta > 0.01) {
                this.lastActivityTime = Date.now();
                this.isActive = true;
            } else if (Date.now() - this.lastActivityTime > 2000) {
                this.isActive = false;
            }
        }
        
        // Update indicator
        const indicator = this.$('#activityIndicator');
        if (indicator) {
            indicator.classList.toggle('active', this.isActive);
        }
    }
    
    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        
        const rect = this.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        if (width <= 0 || height <= 0) return;
        
        const time = Date.now() / 1000;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(10, 10, 20, 1)';
        ctx.fillRect(0, 0, width, height);
        
        const oscillators = this._state.oscillators.slice(0, 16);
        
        if (oscillators.length === 0) {
            this.drawPlaceholder(ctx, width, height, time);
            return;
        }
        
        if (this.isMini) {
            this.drawMini(ctx, width, height, oscillators, time);
        } else {
            const cx = width / 2;
            const cy = height / 2;
            const maxRadius = Math.min(width, height) * 0.42;
            
            this.drawNetwork(ctx, cx, cy, maxRadius, oscillators, time);
            this.drawPhaseWheel(ctx, cx, cy, maxRadius * 0.3, oscillators, time);
            this.drawSpectrum(ctx, width, height, oscillators, time);
        }
    }
    
    drawPlaceholder(ctx, width, height, time) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, 'rgba(10, 10, 30, 1)');
        bgGrad.addColorStop(1, 'rgba(15, 15, 40, 1)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
        
        const pulse = 0.3 + 0.2 * Math.sin(time * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.font = this.isMini ? '9px JetBrains Mono, monospace' : '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Awaiting data...', width / 2, height / 2);
    }
    
    drawMini(ctx, width, height, oscillators, time) {
        const barWidth = width / oscillators.length;
        
        oscillators.forEach((osc, i) => {
            const amplitude = osc.amplitude || 0;
            const phase = osc.phase || 0;
            const animatedAmp = amplitude * (0.8 + 0.2 * Math.sin(phase));
            const h = animatedAmp * (height - 4);
            
            const x = i * barWidth + 1;
            const w = barWidth - 2;
            
            const hue = ((osc.prime || 2) * 137.5) % 360;
            
            const gradient = ctx.createLinearGradient(x, height - h, x, height);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.9)`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.4)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - h - 2, w, h);
            
            if (amplitude > 0.5) {
                const glowGrad = ctx.createLinearGradient(x, height - h - 10, x, height - h);
                glowGrad.addColorStop(0, 'transparent');
                glowGrad.addColorStop(1, `hsla(${hue}, 80%, 60%, ${amplitude * 0.3})`);
                ctx.fillStyle = glowGrad;
                ctx.fillRect(x, height - h - 10, w, 10);
            }
        });
        
        // Coherence history line
        if (this.fieldHistory.length > 1) {
            const historyLen = Math.min(this.fieldHistory.length, 40);
            const startIdx = this.fieldHistory.length - historyLen;
            
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (let i = 0; i < historyLen; i++) {
                const entry = this.fieldHistory[startIdx + i];
                const x = (i / (historyLen - 1)) * width;
                const y = height - (entry.coherence * (height - 4)) - 2;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    
    drawNetwork(ctx, cx, cy, maxRadius, oscillators, time) {
        const n = oscillators.length;
        
        // Coupling connections
        ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const osc1 = oscillators[i];
                const osc2 = oscillators[j];
                
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
                    
                    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i + j);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${coupling * 0.4 * pulse})`;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        }
        
        // Nodes
        oscillators.forEach((osc, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const amplitude = osc.amplitude || 0;
            const phase = osc.phase || 0;
            const frequency = osc.frequency || 1;
            
            const radialOsc = Math.sin(time * frequency + phase) * 5;
            const r = maxRadius * 0.8 + radialOsc;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            const nodeRadius = 4 + amplitude * 12;
            const hue = ((osc.prime || 2) * 137.5) % 360;
            const saturation = 60 + amplitude * 40;
            const lightness = 50 + amplitude * 20;
            
            // Glow
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 3);
            glowGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + amplitude * 0.4})`);
            glowGradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius * 3, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
            
            // Node
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fill();
            
            // Phase indicator
            const phaseX = x + Math.cos(phase + time * frequency) * nodeRadius * 1.5;
            const phaseY = y + Math.sin(phase + time * frequency) * nodeRadius * 1.5;
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(phaseX, phaseY);
            ctx.stroke();
            
            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelR = maxRadius * 0.95;
            const labelX = cx + Math.cos(angle) * labelR;
            const labelY = cy + Math.sin(angle) * labelR;
            ctx.fillText(osc.prime || '?', labelX, labelY);
        });
        
        // Outer ring
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 + this._state.coherence * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawPhaseWheel(ctx, cx, cy, radius, oscillators, time) {
        const n = oscillators.length;
        
        ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        let avgPhaseX = 0, avgPhaseY = 0;
        
        oscillators.forEach((osc) => {
            const phase = (osc.phase || 0) + time * (osc.frequency || 1);
            const amplitude = osc.amplitude || 0;
            
            const x = Math.cos(phase) * amplitude;
            const y = Math.sin(phase) * amplitude;
            
            avgPhaseX += x;
            avgPhaseY += y;
            
            const hue = ((osc.prime || 2) * 137.5) % 360;
            ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + x * radius * 0.8, cy + y * radius * 0.8);
            ctx.stroke();
        });
        
        avgPhaseX /= n;
        avgPhaseY /= n;
        
        const orderMag = Math.sqrt(avgPhaseX * avgPhaseX + avgPhaseY * avgPhaseY);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.5 + orderMag * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + avgPhaseX * radius * 0.8, cy + avgPhaseY * radius * 0.8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cx + avgPhaseX * radius * 0.8, cy + avgPhaseY * radius * 0.8, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`r=${orderMag.toFixed(2)}`, cx, cy);
    }
    
    drawSpectrum(ctx, width, height, oscillators, time) {
        const barHeight = 25;
        const y = height - barHeight - 5;
        const barWidth = width / oscillators.length;
        
        ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
        ctx.fillRect(0, y - 2, width, barHeight + 7);
        
        oscillators.forEach((osc, i) => {
            const amplitude = osc.amplitude || 0;
            const phase = osc.phase || 0;
            const animatedAmp = amplitude * (0.85 + 0.15 * Math.sin(phase));
            const h = animatedAmp * barHeight;
            
            const x = i * barWidth + 2;
            const w = barWidth - 4;
            
            const hue = ((osc.prime || 2) * 137.5) % 360;
            
            const gradient = ctx.createLinearGradient(x, y + barHeight - h, x, y + barHeight);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.9)`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.5)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y + barHeight - h, w, h);
        });
        
        // Status label
        const statusLabel = this.isActive ? '⚡ ACTIVE' : 'SPECTRUM';
        ctx.fillStyle = this.isActive ? 'rgba(34, 197, 94, 0.8)' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(statusLabel, 5, y);
        
        // Coherence trend
        if (this.fieldHistory.length >= 5) {
            const recent = this.fieldHistory.slice(-5);
            const trend = recent[4].coherence - recent[0].coherence;
            const trendArrow = trend > 0.01 ? '↗' : trend < -0.01 ? '↘' : '→';
            ctx.textAlign = 'right';
            ctx.fillStyle = trend > 0.01 ? 'rgba(34, 197, 94, 0.8)' :
                           trend < -0.01 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.4)';
            ctx.fillText(`${trendArrow} ${(this._state.coherence * 100).toFixed(0)}%`, width - 5, y);
        }
    }
}

defineComponent('oscillator-visualizer', OscillatorVisualizer);