/**
 * CognitiveCore — unified cognitive middleware for the agentic system.
 *
 * Wraps all tinyaleph observer layers (SMF, PRSC, HQE, Agency, Boundary,
 * Safety, Temporal, Entanglement) into a single coherent object that
 * provides structured state for LLM interactions.
 *
 * @module apps/agentic/lib/cognitive
 */

import { SedenionMemoryField, SMF_AXES } from '../../../observer/smf.js';
import { PRSCLayer } from '../../../observer/prsc.js';
import { HolographicEncoder } from '../../../observer/hqe.js';
import { AgencyLayer, Goal, Action } from '../../../observer/agency.js';
import { BoundaryLayer } from '../../../observer/boundary.js';
import { SafetyConstraint } from '../../../observer/safety.js';
import { TemporalLayer } from '../../../observer/temporal.js';
import { EntanglementLayer } from '../../../observer/entanglement.js';
import { firstNPrimes } from '../../../core/prime.js';
import { PrimeState, Complex } from '../../../core/hilbert.js';

class CognitiveCore {
  /**
   * @param {Object} config - Cognitive configuration (typically from resolveConfig().cognitive)
   */
  constructor(config = {}) {
    // Store config
    this.config = config;
    this.primeCount = config.primeCount || 64;
    this.primes = firstNPrimes(this.primeCount);

    // ── Observer layers ────────────────────────────────────────────────

    this.smf = new SedenionMemoryField();

    // PRSCLayer(primes, options) — first arg is Array|number
    this.prsc = new PRSCLayer(this.primes);

    // HolographicEncoder(gridSize, primes, options)
    this.hqe = new HolographicEncoder(32, this.primes);

    this.agency = new AgencyLayer({
      maxGoals: 10,
      maxFoci: 5,
      onGoalCreated: (goal) => this._onGoalCreated(goal)
    });

    this.boundary = new BoundaryLayer({
      objectivityGate: { threshold: config.safetyThreshold || 0.7 }
    });

    this.temporal = new TemporalLayer();
    this.entanglement = new EntanglementLayer();

    // ── Internal state ─────────────────────────────────────────────────

    this.tickCount = 0;
    this.coherence = 0;
    this.entropy = 0;
    this.lastInputPrimes = [];
    this.interactionCount = 0;

    // Holographic memory store
    this.memories = [];
    this.maxMemories = 200;

    // Safety constraints
    this._setupSafetyConstraints();
  }

  // ════════════════════════════════════════════════════════════════════
  // Core Methods
  // ════════════════════════════════════════════════════════════════════

  /**
   * Process input text, returning semantic analysis.
   *
   * @param {string} text - Input text
   * @returns {Object} Analysis result
   */
  processInput(text) {
    // 1. Map text → primes
    const primes = this._textToPrimes(text);
    this.lastInputPrimes = primes;

    // 2. Excite oscillators
    this.prsc.excite(primes);

    // 3. Let oscillators respond
    for (let i = 0; i < 5; i++) {
      this.tick();
    }

    // 4. Map oscillator state → SMF orientation
    this._oscillatorsToSMF();

    // 5. Boundary layer input
    this.boundary.processInput('text_input', text);

    // 6. Agency update
    const agencyState = this.agency.update({
      prsc: this.prsc,
      smf: this.smf,
      coherence: this.coherence,
      entropy: this.entropy,
      activePrimes: primes
    });

    this.interactionCount++;

    return {
      primes,
      coherence: this.coherence,
      entropy: this.entropy,
      smfOrientation: this.smf.s ? Array.from(this.smf.s) : null,
      activePrimes: primes.slice(0, 10),
      topFocus: agencyState.foci?.[0] || null,
      activeGoals: agencyState.activeGoals?.length || 0,
      processingLoad: agencyState.processingLoad || 0,
      interactionCount: this.interactionCount
    };
  }

  /**
   * Validate LLM output through the ObjectivityGate.
   *
   * @param {string} output - LLM response text
   * @param {Object} context - Context including input
   * @returns {Object} Validation result
   */
  validateOutput(output, context = {}) {
    const gateResult = this.boundary.objectivityGate.check(output, context);
    return {
      passed: gateResult.shouldBroadcast,
      R: gateResult.R,
      reason: gateResult.reason,
      decoderResults: gateResult.decoderResults
    };
  }

  /**
   * Build a human-readable cognitive-state summary suitable for
   * injection into the LLM system prompt.
   *
   * @returns {string}
   */
  getStateContext() {
    const smfAxes = SMF_AXES || [];
    const orientation = this.smf.s
      ? Array.from(this.smf.s)
      : new Array(16).fill(0.5);

    // Pick the five axes whose value deviates most from 0.5
    const topAxes = orientation
      .map((v, i) => ({ axis: smfAxes[i]?.name || `axis_${i}`, value: v }))
      .sort((a, b) => Math.abs(b.value - 0.5) - Math.abs(a.value - 0.5))
      .slice(0, 5);

    const topGoal = this.agency.getTopGoal();
    const topFocus = this.agency.getTopFocus();
    const metacog = this.agency.selfModel;

    let context = `[Cognitive State]\n`;
    context += `Coherence: ${this.coherence.toFixed(3)} | Entropy: ${this.entropy.toFixed(3)}\n`;
    context += `Processing Load: ${(metacog.processingLoad * 100).toFixed(0)}% | Confidence: ${(metacog.confidenceLevel * 100).toFixed(0)}%\n`;
    context += `Dominant Semantic Axes: ${topAxes.map(a => `${a.axis}=${a.value.toFixed(2)}`).join(', ')}\n`;

    if (topGoal) {
      context += `Active Goal: ${topGoal.description} (${(topGoal.progress * 100).toFixed(0)}% complete)\n`;
    }
    if (topFocus) {
      context += `Attention Focus: ${topFocus.target} (intensity=${topFocus.intensity.toFixed(2)})\n`;
    }

    context += `Interaction #${this.interactionCount}\n`;

    return context;
  }

  /**
   * Store an interaction in holographic memory.
   *
   * @param {string} input  - User input
   * @param {string} output - Agent output
   */
  remember(input, output) {
    const primes = this._textToPrimes(input + ' ' + output);

    // Attempt holographic encoding
    try {
      const state = new PrimeState(this.primes.slice(0, 16));
      for (const p of primes.slice(0, 8)) {
        const idx = this.primes.indexOf(p);
        if (idx >= 0 && idx < state.amplitudes.length) {
          state.amplitudes[idx] = new Complex(0.5, 0);
        }
      }

      // HolographicEncoder.project(state) returns the field; we snapshot it
      const field = this.hqe.project(state);
      const pattern = this.hqe.getState();

      this.memories.push({
        timestamp: Date.now(),
        input: input.substring(0, 200),
        output: output.substring(0, 200),
        pattern,
        primes: primes.slice(0, 10),
        coherence: this.coherence,
        interactionId: this.interactionCount
      });

      if (this.memories.length > this.maxMemories) {
        this.memories.shift();
      }
    } catch (_e) {
      // Fall back: store without holographic pattern
      this.memories.push({
        timestamp: Date.now(),
        input: input.substring(0, 200),
        output: output.substring(0, 200),
        primes: primes.slice(0, 10),
        coherence: this.coherence,
        interactionId: this.interactionCount
      });

      if (this.memories.length > this.maxMemories) {
        this.memories.shift();
      }
    }

    // Record temporal moment
    try {
      this.temporal.forceMoment({
        coherence: this.coherence,
        entropy: this.entropy,
        activePrimes: primes.slice(0, 5)
      }, 'interaction');
    } catch (_e) {
      // TemporalLayer may not support this call — skip
    }
  }

  /**
   * Recall relevant memories by text query.
   *
   * @param {string} query - Search text
   * @param {number} limit - Max results
   * @returns {Array} Matching memories sorted by score
   */
  recall(query, limit = 5) {
    const queryPrimes = new Set(this._textToPrimes(query));

    const scored = this.memories.map(mem => {
      const overlap = mem.primes.filter(p => queryPrimes.has(p)).length;
      const recency = 1 / (1 + (Date.now() - mem.timestamp) / (1000 * 60 * 60));
      return { ...mem, score: overlap * 0.7 + recency * 0.3 };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(m => m.score > 0);
  }

  /**
   * Create a goal from user intent.
   *
   * @param {string} description
   * @param {number} priority - 0–1
   * @returns {Goal|null}
   */
  createGoal(description, priority = 0.8) {
    return this.agency.createExternalGoal(description, { priority });
  }

  /**
   * Advance physics simulation by one timestep.
   */
  tick() {
    this.tickCount++;

    // Tick PRSC oscillators
    try {
      this.prsc.tick(1 / 60);
    } catch (_e) {
      try { this.prsc.step(); } catch (_e2) { /* skip */ }
    }

    // Update coherence from PRSC order parameter
    try {
      const order = this.prsc.orderParameter
        ? this.prsc.orderParameter()
        : 0.5;
      this.coherence = typeof order === 'number' ? order : (order?.r || 0.5);
    } catch (_e) {
      this.coherence = 0.5;
    }

    // Update entropy from phase distribution
    try {
      const phases = this.prsc.getPhases ? this.prsc.getPhases() : [];
      if (phases.length > 0) {
        const bins = new Array(8).fill(0);
        for (const phase of phases) {
          const idx = Math.min(
            7,
            Math.floor(
              (((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) /
                (Math.PI / 4)
            )
          );
          bins[idx]++;
        }
        const total = phases.length;
        this.entropy = bins.reduce((H, count) => {
          if (count === 0) return H;
          const p = count / total;
          return H - p * Math.log2(p);
        }, 0);
      }
    } catch (_e) {
      this.entropy = 1.5;
    }
  }

  /**
   * Return full diagnostic state.
   *
   * @returns {Object}
   */
  getDiagnostics() {
    return {
      tickCount: this.tickCount,
      coherence: this.coherence,
      entropy: this.entropy,
      interactionCount: this.interactionCount,
      memoryCount: this.memories.length,
      agencyStats: this.agency.getStats(),
      boundaryStats: this.boundary.getStats(),
      smfOrientation: this.smf.s ? Array.from(this.smf.s) : null
    };
  }

  /**
   * Reset all state to initial conditions.
   */
  reset() {
    this.tickCount = 0;
    this.coherence = 0;
    this.entropy = 0;
    this.lastInputPrimes = [];
    this.interactionCount = 0;
    this.memories = [];
    this.agency.reset();
    this.boundary.reset();
  }

  // ════════════════════════════════════════════════════════════════════
  // Private Methods
  // ════════════════════════════════════════════════════════════════════

  /**
   * Convert text to a unique set of primes using word-level hashing.
   *
   * @param {string} text
   * @returns {number[]} Unique primes
   */
  _textToPrimes(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const primes = [];

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff;
      }
      const primeIdx = hash % this.primes.length;
      primes.push(this.primes[primeIdx]);
    }

    return [...new Set(primes)];
  }

  /**
   * Map PRSC oscillator phases into the 16-axis SMF orientation.
   *
   * @returns {SedenionMemoryField}
   */
  _oscillatorsToSMF() {
    try {
      const phases = this.prsc.getPhases ? this.prsc.getPhases() : [];
      if (phases.length >= 16 && this.smf.s) {
        for (let i = 0; i < 16; i++) {
          const phase = phases[i] || 0;
          const normalized = (Math.sin(phase) + 1) / 2;
          // Blend slowly with existing orientation
          this.smf.s[i] = 0.9 * this.smf.s[i] + 0.1 * normalized;
        }
      }
    } catch (_e) {
      // SMF update failed — keep current values
    }
    return this.smf;
  }

  /**
   * Install default safety constraints.
   */
  _setupSafetyConstraints() {
    try {
      const coherenceFloor = new SafetyConstraint({
        name: 'coherence_floor',
        type: 'soft',
        description: 'Warn when coherence drops too low',
        condition: (state) => (state.coherence || 0) < 0.1,
        response: 'warn',
        priority: 5
      });

      const entropyCeiling = new SafetyConstraint({
        name: 'entropy_ceiling',
        type: 'soft',
        description: 'Warn when entropy is too high',
        condition: (state) => (state.entropy || 0) > 3.5,
        response: 'warn',
        priority: 3
      });

      this.safetyConstraints = [coherenceFloor, entropyCeiling];
    } catch (_e) {
      this.safetyConstraints = [];
    }
  }

  /**
   * Check all safety constraints against current state.
   *
   * @returns {Array} Violations
   */
  checkSafety() {
    const state = {
      coherence: this.coherence,
      entropy: this.entropy,
      smf: this.smf
    };

    return this.safetyConstraints
      .map(c => c.check(state))
      .filter(r => r.violated);
  }

  /**
   * Callback when a goal is created.
   * @param {Goal} _goal
   */
  _onGoalCreated(_goal) {
    // Could log or emit events
  }
}

export { CognitiveCore };
export default CognitiveCore;
