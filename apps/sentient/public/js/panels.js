/**
 * Sentient Observer - Sidebar Panel Renderers
 */

import { escapeHtml, capitalize, getMomentIcon } from './utils.js';

export class PanelManager {
    constructor(elements) {
        this.elements = elements;
        this.momentsData = [];
    }
    
    // Moments Panel
    renderMoments(data) {
        const list = this.elements.momentsList;
        if (!list) return;
        
        if (!data.moments || data.moments.length === 0) {
            list.innerHTML = '<div class="moment-placeholder">No moments yet</div>';
            return;
        }
        
        const filtered = data.moments
            .filter(m => m.trigger !== 'entropy_extreme')
            .slice(0, 5);
        
        if (filtered.length === 0) {
            list.innerHTML = '<div class="moment-placeholder">Awaiting coherence...</div>';
            return;
        }
        
        list.innerHTML = filtered.map(m => `
            <div class="moment-item ${m.trigger}">
                <span class="moment-icon">${getMomentIcon(m.trigger)}</span>
                <div class="moment-details">
                    <div class="moment-trigger">${m.trigger.replace('_', ' ')}</div>
                    <div class="moment-stats">C=${(m.coherence * 100).toFixed(0)}% H=${(m.entropy * 100).toFixed(0)}%</div>
                </div>
            </div>
        `).join('');
        
        if (data.subjectiveTime !== undefined && this.elements.subjectiveTime) {
            this.elements.subjectiveTime.textContent = data.subjectiveTime.toFixed(1);
        }
    }
    
    addMoment(moment) {
        if (moment.trigger === 'entropy_extreme') {
            return;
        }
        
        const now = Date.now();
        const recentSame = this.momentsData.find(m =>
            m.trigger === moment.trigger &&
            (now - (m.timestamp || now)) < 2000
        );
        
        if (recentSame) {
            return;
        }
        
        moment.timestamp = now;
        this.momentsData.unshift(moment);
        
        if (this.momentsData.length > 20) {
            this.momentsData = this.momentsData.slice(0, 20);
        }
        
        this.renderMoments({ moments: this.momentsData });
    }
    
    // Goals Panel
    renderGoals(goals) {
        const list = this.elements.goalsList;
        if (!list || !goals) return;
        
        let html = '';
        
        if (goals.topGoal) {
            const progress = (goals.topGoal.progress * 100).toFixed(0);
            html += `
                <div class="goal-item">
                    <div class="goal-description">${escapeHtml(goals.topGoal.description)}</div>
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
                    ${escapeHtml(goals.topFocus.target)} (${goals.topFocus.type})
                </div>
            `;
        }
        
        if (!html) {
            html = '<div class="goal-placeholder">No active goals</div>';
        }
        
        list.innerHTML = html;
    }
    
    // Senses Panel
    renderSenses(data) {
        const list = this.elements.sensesList;
        if (!list || !data?.senses) return;
        
        for (const [name, sense] of Object.entries(data.senses)) {
            const valueEl = document.getElementById(`sense${capitalize(name)}Value`);
            const statusEl = document.getElementById(`sense${capitalize(name)}Status`);
            const itemEl = list.querySelector(`[data-sense="${name}"]`);
            
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
        
        if (this.elements.anomalyCount) {
            this.elements.anomalyCount.textContent = data.anomalies?.length || 0;
        }
        
        if (this.elements.sensesAnomalies && data.anomalies) {
            if (data.anomalies.length === 0) {
                this.elements.sensesAnomalies.innerHTML = '';
            } else {
                this.elements.sensesAnomalies.innerHTML = data.anomalies.map(a => `
                    <div class="anomaly-item">
                        <span class="anomaly-sense">${a.sense}</span>
                        <span class="anomaly-msg">${escapeHtml(a.message)}</span>
                    </div>
                `).join('');
            }
        }
    }
    
    // SMF Dominant Axes
    renderSMFDominant(dominant) {
        const el = this.elements.smfDominant;
        if (!el || !dominant || !Array.isArray(dominant)) return;
        
        el.innerHTML = dominant.slice(0, 5).map((axis, i) => `
            <div class="dominant-axis">
                <span class="rank">${i + 1}</span>
                <span class="name">${axis.name}</span>
                <span class="value">${axis.value.toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    // Oscillator Stats
    renderOscillatorStats(osc) {
        if (osc.active !== undefined && this.elements.activeOsc) {
            this.elements.activeOsc.textContent = osc.active;
        }
        if (osc.energy !== undefined && this.elements.oscEnergy) {
            this.elements.oscEnergy.textContent = osc.energy.toFixed(2);
        }
    }
    
    // SMF Stats
    renderSMFStats(smf) {
        if (smf.entropy !== undefined && this.elements.smfEntropy) {
            this.elements.smfEntropy.textContent = smf.entropy.toFixed(3);
        }
        if (smf.norm !== undefined && this.elements.smfNorm) {
            this.elements.smfNorm.textContent = smf.norm.toFixed(3);
        }
    }
}