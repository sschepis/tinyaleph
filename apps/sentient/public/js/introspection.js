/**
 * Sentient Observer - Introspection Modal
 */

import { fetchJSON } from './utils.js';

export class IntrospectionModal {
    constructor(elements) {
        this.overlay = elements.overlay;
        this.content = elements.content;
        this.closeBtn = elements.closeBtn;
        this.toggleBtn = elements.toggleBtn;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.show());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.hide();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        });
    }
    
    async show() {
        if (!this.overlay) return;
        
        this.overlay.classList.add('visible');
        if (this.toggleBtn) this.toggleBtn.classList.add('active');
        
        try {
            const data = await fetchJSON('/introspect');
            this.render(data);
        } catch (err) {
            this.content.innerHTML = `
                <div class="introspect-loading">
                    <span style="color: var(--error)">Error loading introspection: ${err.message}</span>
                </div>
            `;
        }
    }
    
    hide() {
        if (this.overlay) this.overlay.classList.remove('visible');
        if (this.toggleBtn) this.toggleBtn.classList.remove('active');
    }
    
    render(data) {
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
        
        this.content.innerHTML = sections.map(section => `
            <div class="introspect-section expanded" data-section="${section.key}">
                <div class="introspect-section-header" onclick="window.sentientUI?.toggleSection('${section.key}')">
                    <h4>${section.title}</h4>
                    <svg class="introspect-section-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
                <div class="introspect-section-content">
                    ${this.renderData(section.key, section.data)}
                </div>
            </div>
        `).join('');
    }
    
    renderData(key, data) {
        if (!data) return '<span style="color: var(--text-dim)">No data</span>';
        
        if (key === 'metacognition') {
            return `
                <div class="introspect-grid">
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${((data.processingLoad || 0) * 100).toFixed(0)}%</div>
                        <div class="introspect-stat-label">Processing Load</div>
                    </div>
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${(data.emotionalValence || 0).toFixed(2)}</div>
                        <div class="introspect-stat-label">Emotional Valence</div>
                    </div>
                    <div class="introspect-stat">
                        <div class="introspect-stat-value">${((data.confidenceLevel || 0) * 100).toFixed(0)}%</div>
                        <div class="introspect-stat-label">Confidence</div>
                    </div>
                </div>
            `;
        }
        
        if (key === 'smfOrientation') {
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
                    axesHtml = Object.entries(data.dominantAxes).slice(0, 5).map(([key, val]) => `
                        <div class="introspect-stat">
                            <div class="introspect-stat-value text-gradient">${key}</div>
                            <div class="introspect-stat-label">${typeof val === 'number' ? val.toFixed(2) : String(val)}</div>
                        </div>
                    `).join('');
                }
            }
            
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
        
        return `<div class="introspect-json">${JSON.stringify(data, null, 2)}</div>`;
    }
    
    toggleSection(key) {
        const section = document.querySelector(`[data-section="${key}"]`);
        if (section) {
            section.classList.toggle('expanded');
        }
    }
}