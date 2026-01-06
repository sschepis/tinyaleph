/**
 * Sedenion Visualizer Component
 * 
 * Canvas-based visualization of the 16-dimensional SMF identity field:
 * - Radial polygon showing all 16 axes
 * - History trails for temporal evolution
 * - Dominant axis highlighting
 * - Entropy ring indicator
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class SedenionVisualizer extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            smfData: null
        };
        
        // History for trails
        this.history = [];
        this.maxHistory = 30;
        
        // Field history from stream
        this.fieldHistory = [];
        
        // Activity tracking
        this.lastActivityTime = Date.now();
        this.isActive = false;
        
        // Animation
        this.animationId = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    static get observedAttributes() {
        return ['show-axes', 'width', 'height'];
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
            
            .visualizer-wrapper {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                gap: var(--space-sm);
            }
            
            .canvas-container {
                flex: 1;
                position: relative;
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                overflow: hidden;
                min-height: 150px;
            }
            
            canvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            
            .axes-container {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: var(--space-xs);
                max-height: 200px;
                overflow-y: auto;
                padding: var(--space-xs);
            }
            
            .sedenion-axis {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: var(--space-xs);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.65rem;
                font-family: var(--font-mono);
                border: 1px solid transparent;
                transition: all var(--transition-fast);
            }
            
            .sedenion-axis.dominant {
                border-color: var(--accent-primary);
                background: rgba(99, 102, 241, 0.1);
            }
            
            .sedenion-axis.active {
                border-color: var(--accent-secondary);
            }
            
            .axis-name {
                color: var(--text-secondary);
                font-weight: 500;
                text-transform: uppercase;
                font-size: 0.55rem;
            }
            
            .axis-value {
                font-weight: 600;
            }
            
            .axis-value.positive { color: var(--accent-primary); }
            .axis-value.negative { color: var(--accent-tertiary); }
            
            .axis-bar-container {
                height: 3px;
                background: var(--bg-primary);
                border-radius: 1.5px;
                overflow: hidden;
            }
            
            .axis-bar {
                height: 100%;
                border-radius: 1.5px;
                transition: width var(--transition-fast);
            }
            
            .axis-bar.positive { background: var(--accent-primary); }
            .axis-bar.negative { background: var(--accent-tertiary); }
            
            .activity-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                background: rgba(34, 197, 94, 0.2);
                border-radius: var(--radius-sm);
                font-size: 0.6rem;
                color: var(--success);
                opacity: 0;
                transition: opacity var(--transition-fast);
            }
            
            .activity-badge.active {
                opacity: 1;
            }
            
            .activity-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--success);
                animation: pulse 1s infinite;
            }
        `;
    }
    
    template() {
        const showAxes = this.hasAttribute('show-axes');
        
        return `
            <div class="visualizer-wrapper">
                <div class="canvas-container">
                    <canvas id="sedenionCanvas"></canvas>
                    <div class="activity-badge" id="activityBadge">
                        <span class="activity-dot"></span>
                        <span>EVOLVING</span>
                    </div>
                </div>
                ${showAxes ? '<div class="axes-container" id="axesContainer"></div>' : ''}
            </div>
        `;
    }
    
    onMount() {
        this.canvas = this.$('#sedenionCanvas');
        this.ctx = this.canvas?.getContext('2d');
        
        this.setupResolution();
        this.startAnimation();
        
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
        
        const container = this.$('.canvas-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
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
     * Set SMF data
     */
    setData(smfData) {
        this._state.smfData = smfData;
        
        if (smfData?.components) {
            this.history.push({
                t: Date.now(),
                components: smfData.components.map(c => c.value)
            });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
            
            // Update axes display
            if (this.hasAttribute('show-axes')) {
                this.renderAxes(smfData.components, smfData.dominant);
            }
        }
    }
    
    /**
     * Set field history from stream
     */
    setFieldHistory(history) {
        this.fieldHistory = history || [];
        
        if (history && history.length >= 2) {
            const recent = history.slice(-2);
            const normDelta = Math.abs((recent[1]?.smf?.norm || 0) - (recent[0]?.smf?.norm || 0));
            if (normDelta > 0.001) {
                this.lastActivityTime = Date.now();
                this.isActive = true;
            } else if (Date.now() - this.lastActivityTime > 2000) {
                this.isActive = false;
            }
        }
        
        const badge = this.$('#activityBadge');
        if (badge) {
            badge.classList.toggle('active', this.isActive);
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const smf = this._state.smfData;
        if (!ctx) return;
        
        const container = this.$('.canvas-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        if (width <= 0 || height <= 0) return;
        
        const cx = width / 2;
        const cy = height / 2;
        const time = Date.now() / 1000;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        
        if (!smf?.components) {
            this.drawPlaceholder(ctx, width, height, time);
            return;
        }
        
        // Grid
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
        
        // History trails
        this.drawHistoryTrails(ctx, cx, cy);
        
        // Axis lines
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
        
        // Circular guides
        [0.33, 0.66, 1].forEach(scale => {
            ctx.beginPath();
            ctx.arc(cx, cy, 20 + scale * 60, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 + scale * 0.05})`;
            ctx.stroke();
        });
        
        // Current state polygon
        this.drawStatePolygon(ctx, cx, cy, smf.components, smf.dominant, time);
        
        // Entropy ring
        this.drawEntropyRing(ctx, cx, cy, smf.entropy || 0);
        
        // Norm trend
        this.drawNormTrend(ctx, width, height, smf);
    }
    
    drawPlaceholder(ctx, width, height, time) {
        const pulse = 0.3 + 0.2 * Math.sin(time * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Awaiting SMF data...', width / 2, height / 2);
    }
    
    drawHistoryTrails(ctx, cx, cy) {
        if (this.history.length <= 1) return;
        
        for (let h = 0; h < this.history.length - 1; h++) {
            const alpha = (h / this.history.length) * 0.3;
            const histComponents = this.history[h].components;
            
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
    
    drawStatePolygon(ctx, cx, cy, components, dominant, time) {
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
        
        // Axis points
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
            const comp = components[i];
            const value = comp?.value || 0;
            const absValue = Math.abs(value);
            const r = 20 + absValue * 60;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            const isDominant = Array.isArray(dominant) && dominant.some(d => d.index === i);
            const pulse = isDominant ? 1 + 0.2 * Math.sin(time * 3 + i) : 1;
            const radius = (absValue > 0.3 ? 5 : 3) * pulse;
            
            const color = value >= 0 ? '#6366f1' : '#a855f7';
            const glowColor = value >= 0 ? 'rgba(99, 102, 241, 0.5)' : 'rgba(168, 85, 247, 0.5)';
            
            // Glow
            const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
            pointGradient.addColorStop(0, glowColor);
            pointGradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = pointGradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Label for dominant
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
        
        // Center point
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
    }
    
    drawEntropyRing(ctx, cx, cy, entropy) {
        const entropyRadius = 15;
        const entropyAngle = entropy * Math.PI;
        
        ctx.beginPath();
        ctx.arc(cx, cy, entropyRadius, -Math.PI / 2, -Math.PI / 2 + entropyAngle);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 + entropy * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawNormTrend(ctx, width, height, smf) {
        if (this.fieldHistory.length >= 5) {
            const recent = this.fieldHistory.slice(-5);
            const startNorm = recent[0]?.smf?.norm || 1;
            const endNorm = recent[4]?.smf?.norm || 1;
            const trend = endNorm - startNorm;
            
            ctx.fillStyle = trend > 0.01 ? 'rgba(34, 197, 94, 0.8)' :
                           trend < -0.01 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.5)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            const arrow = trend > 0.01 ? '↗' : trend < -0.01 ? '↘' : '→';
            ctx.fillText(`‖s‖ ${(smf.norm || 1).toFixed(3)} ${arrow}`, 5, height - 5);
        }
    }
    
    renderAxes(components, dominant) {
        const container = this.$('#axesContainer');
        if (!container || !components) return;
        
        const dominantIndices = new Set(Array.isArray(dominant) ? dominant.map(d => d.index) : []);
        
        container.innerHTML = components.map((comp, i) => {
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
}

defineComponent('sedenion-visualizer', SedenionVisualizer);