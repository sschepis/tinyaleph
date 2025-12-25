/**
 * Sentient Observer - Sedenion (16D) Visualization
 */

export class SedenionVisualizer {
    constructor(canvas, axesContainer, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
        this.axesContainer = axesContainer;
        this.history = [];
        this.currentData = null;
        
        this.setupResolution();
        window.addEventListener('resize', () => this.setupResolution());
    }
    
    setupResolution() {
        if (!this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }
    
    setData(smfData) {
        this.currentData = smfData;
        
        if (smfData?.components) {
            this.history.push({
                t: Date.now(),
                components: smfData.components.map(c => c.value)
            });
            if (this.history.length > 30) {
                this.history.shift();
            }
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const smf = this.currentData;
        if (!ctx || !smf?.components) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const cx = width / 2;
        const cy = height / 2;
        const time = Date.now() / 1000;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        
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
        if (this.history.length > 1) {
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
        
        // Axis points
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
            const comp = components[i];
            const value = comp?.value || 0;
            const absValue = Math.abs(value);
            const r = 20 + absValue * 60;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            const isDominant = smf.dominant?.some(d => d.index === i);
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
            
            // Label
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
        
        // Entropy ring
        const entropy = smf.entropy || 0;
        const entropyRadius = 15;
        const entropyAngle = entropy * Math.PI;
        
        ctx.beginPath();
        ctx.arc(cx, cy, entropyRadius, -Math.PI / 2, -Math.PI / 2 + entropyAngle);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 + entropy * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    renderAxes(components, dominant) {
        if (!this.axesContainer || !components) return;
        
        const dominantIndices = new Set(Array.isArray(dominant) ? dominant.map(d => d.index) : []);
        
        this.axesContainer.innerHTML = components.map((comp, i) => {
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