/**
 * Sight Camera Component
 * 
 * Camera input with:
 * - Video preview
 * - Entropy calculation
 * - Toggle controls
 * - Server integration
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

export class SightCamera extends BaseComponent {
    constructor() {
        super();
        
        this._state = {
            active: false,
            entropy: 0
        };
        
        this.stream = null;
        this.captureInterval = null;
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
            }
            
            .camera-container {
                position: relative;
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                overflow: hidden;
            }
            
            .video-wrapper {
                position: relative;
                width: 100%;
                aspect-ratio: 4/3;
                background: var(--bg-primary);
            }
            
            video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            canvas {
                display: none;
            }
            
            .camera-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.6);
                opacity: 1;
                transition: opacity var(--transition-normal);
            }
            
            .camera-container.active .camera-overlay {
                opacity: 0;
                pointer-events: none;
            }
            
            .camera-controls {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm);
                background: var(--bg-tertiary);
            }
            
            .toggle-btn {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm) var(--space-md);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                color: var(--text-secondary);
                font-size: 0.8rem;
                transition: all var(--transition-fast);
            }
            
            .toggle-btn:hover {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-primary);
            }
            
            .toggle-btn.active {
                background: var(--error);
                color: white;
                border-color: var(--error);
            }
            
            .entropy-display {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                font-size: 0.75rem;
                font-family: var(--font-mono);
            }
            
            .entropy-label {
                color: var(--text-dim);
            }
            
            .entropy-value {
                color: var(--accent-primary);
                font-weight: 600;
            }
            
            .entropy-bar {
                width: 60px;
                height: 6px;
                background: var(--bg-primary);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .entropy-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--success), var(--warning), var(--error));
                transition: width var(--transition-fast);
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                font-size: 0.7rem;
                color: var(--text-dim);
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--text-dim);
            }
            
            .status-dot.active {
                background: var(--success);
                box-shadow: 0 0 8px var(--success);
                animation: pulse 1s infinite;
            }
            
            .placeholder-icon {
                font-size: 2rem;
                opacity: 0.5;
            }
        `;
    }
    
    template() {
        const { active, entropy } = this._state;
        
        return `
            <div class="camera-container ${active ? 'active' : ''}">
                <div class="video-wrapper">
                    <video id="video" autoplay muted playsinline></video>
                    <canvas id="canvas"></canvas>
                    <div class="camera-overlay">
                        <span class="placeholder-icon">📷</span>
                    </div>
                </div>
                <div class="camera-controls">
                    <button class="toggle-btn ${active ? 'active' : ''}" id="toggleBtn">
                        ${active ? '⏹ Stop Camera' : '▶ Start Camera'}
                    </button>
                    <div class="entropy-display">
                        <span class="entropy-label">Entropy:</span>
                        <span class="entropy-value" id="entropyValue">${entropy.toFixed(2)}</span>
                        <div class="entropy-bar">
                            <div class="entropy-fill" style="width: ${entropy * 100}%"></div>
                        </div>
                    </div>
                    <div class="status-indicator">
                        <span class="status-dot ${active ? 'active' : ''}"></span>
                        <span>${active ? 'Recording' : 'Idle'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    onMount() {
        this.video = this.$('#video');
        this.canvas = this.$('#canvas');
        this.ctx = this.canvas?.getContext('2d');
    }
    
    setupEventListeners() {
        const toggleBtn = this.$('#toggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
    
    /**
     * Toggle camera on/off
     */
    async toggle() {
        if (this._state.active) {
            this.stop();
        } else {
            await this.start();
        }
    }
    
    /**
     * Start camera
     */
    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 }
            });
            
            if (this.video) {
                this.video.srcObject = this.stream;
            }
            
            this._state.active = true;
            this.render();
            
            // Start capture loop
            this.captureInterval = setInterval(() => this.processFrame(), 1000);
            
            this.emit('camera-start');
            console.log('[SightCamera] Started');
        } catch (err) {
            console.error('[SightCamera] Failed to access camera:', err);
            this.emit('camera-error', { error: err.message });
            alert('Could not access camera. Please ensure permissions are granted.');
        }
    }
    
    /**
     * Stop camera
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this._state.active = false;
        this.render();
        
        this.emit('camera-stop');
        console.log('[SightCamera] Stopped');
    }
    
    /**
     * Process a video frame
     */
    processFrame() {
        if (!this._state.active || !this.video?.videoWidth) return;
        
        // Draw to canvas
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0);
        
        // Calculate entropy
        const entropy = this.calculateEntropy();
        this._state.entropy = entropy;
        
        // Update display
        const entropyValue = this.$('#entropyValue');
        const entropyFill = this.$('.entropy-fill');
        if (entropyValue) entropyValue.textContent = entropy.toFixed(2);
        if (entropyFill) entropyFill.style.width = `${entropy * 100}%`;
        
        // Send to server
        this.sendToServer(entropy);
        
        this.emit('entropy-update', { entropy });
    }
    
    /**
     * Calculate visual entropy using compression ratio
     */
    calculateEntropy() {
        const rawData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const rawSize = rawData.data.length;
        
        // Get JPEG blob size
        const jpegData = this.canvas.toDataURL('image/jpeg', 0.5);
        const jpegSize = (jpegData.length - 22) * 0.75;
        
        const compressionRatio = jpegSize / rawSize;
        
        // Normalize to 0-1 scale
        return Math.min(1, compressionRatio * 5);
    }
    
    /**
     * Send entropy data to server
     */
    async sendToServer(entropy) {
        try {
            await fetch('/senses/sight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entropy,
                    description: `Visual input (entropy: ${entropy.toFixed(2)})`,
                    timestamp: Date.now()
                })
            });
        } catch (err) {
            // Silent fail
        }
    }
    
    onUnmount() {
        this.stop();
    }
}

defineComponent('sight-camera', SightCamera);