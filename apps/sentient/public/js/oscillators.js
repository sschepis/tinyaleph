/**
 * Sentient Observer - PRSC Oscillator Visualization
 */

export class OscillatorVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
        this.data = [];
        this.coherence = 0;
        
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
    
    setData(oscillators, coherence = 0) {
        this.data = oscillators || [];
        this.coherence = coherence;
    }
    
    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const time = Date.now() / 1000;
        
        // Clear canvas with slight fade for trail effect
        ctx.fillStyle = 'rgba(10, 10, 20, 0.15)';
        ctx.fillRect(0, 0, width, height);
        
        const oscillators = this.data.slice(0, 16);
        if (oscillators.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '12px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Awaiting oscillator data...', width/2, height/2);
            return;
        }
        
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(width, height) * 0.42;
        
        this.drawNetwork(ctx, cx, cy, maxRadius, oscillators, time);
        this.drawPhaseWheel(ctx, cx, cy, maxRadius * 0.3, oscillators, time);
        this.drawSpectrum(ctx, width, height, oscillators, time);
    }
    
    drawNetwork(ctx, cx, cy, maxRadius, oscillators, time) {
        const n = oscillators.length;
        
        // Draw coupling connections
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
        
        // Draw nodes
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
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 + this.coherence * 0.3})`;
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
            const frequency = osc.frequency || 1;
            const phase = osc.phase || 0;
            
            const animatedAmp = amplitude * (0.7 + 0.3 * Math.sin(time * frequency * 2 + phase));
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
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SPECTRUM', 5, y);
    }
}