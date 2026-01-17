/**
 * Emotion Module - book.pdf Chapter 9
 * 
 * Implements Entropy Spectrometry & Emotional Mapping from:
 * "Resonant Foundations of Reality" by Sebastian Schepis
 * 
 * Key formalisms:
 * - Feeling Operator: F̂ = Σ_k w_k R_k where w_k ∈ ℝ⁺
 * - Emotional resonance: ⟨ψ|F̂|ψ⟩ = emotional alignment score
 * - Consciousness Primacy: P = 0.4F + 0.3R + 0.2C + 0.1Γ
 * - Emotional state templates with characteristic signatures
 */

import { PrimeState, Complex, encodeMemory, PHI } from './hilbert.js';
import { firstNPrimes } from './prime.js';

// ============================================================================
// EMOTIONAL STATE TEMPLATES (Chapter 9)
// ============================================================================

/**
 * Emotional Template - Archetypal resonance patterns for emotions
 * 
 * From book.pdf Chapter 9:
 * Each emotion has characteristic:
 * - Coherence level (phase alignment)
 * - Entropy profile (spread)
 * - Amplitude distribution (localization)
 * - Phase gradient (directional flow)
 */
const EMOTIONAL_TEMPLATES = {
  love: {
    name: 'Love',
    description: 'High coherence, low entropy, expansive amplitude',
    coherence: 0.9,      // High phase alignment
    entropy: 0.2,        // Low entropy - ordered
    localization: 0.3,   // Distributed across many primes
    phaseGradient: 0.1,  // Smooth, gradual phase transitions
    primes: [2, 3, 5],   // Fundamental harmonics
    basePhase: 0,        // Phase centered at 0
    amplitude: 1.0
  },
  
  fear: {
    name: 'Fear',
    description: 'Sharp phase gradient, localized collapse, high entropy',
    coherence: 0.3,      // Low phase alignment
    entropy: 0.8,        // High entropy - disordered
    localization: 0.9,   // Highly localized (collapsed)
    phaseGradient: 0.9,  // Sharp, erratic phase changes
    primes: [7, 11, 13], // Higher frequency dissonance
    basePhase: Math.PI,  // Inverted phase
    amplitude: 1.5       // Heightened intensity
  },
  
  joy: {
    name: 'Joy',
    description: 'High amplitude coherence, resonant harmonics, moderate entropy',
    coherence: 0.85,
    entropy: 0.35,
    localization: 0.4,
    phaseGradient: 0.2,
    primes: [2, 5, 13],  // Pleasant harmonic ratios
    basePhase: Math.PI / 4, // Positive phase offset
    amplitude: 1.2
  },
  
  grief: {
    name: 'Grief',
    description: 'Disrupted phase structure, entropy release, amplitude decay',
    coherence: 0.25,
    entropy: 0.75,
    localization: 0.6,
    phaseGradient: 0.7,
    primes: [17, 19, 23], // Minor-key primes
    basePhase: -Math.PI / 2,
    amplitude: 0.6       // Diminished intensity
  },
  
  awe: {
    name: 'Awe',
    description: 'Golden ratio resonance, maximal coherence spike, transcendent',
    coherence: 0.95,
    entropy: 0.15,
    localization: 0.5,
    phaseGradient: 0.05,
    primes: [5, 13, 89], // Fibonacci primes
    basePhase: 2 * Math.PI / PHI,
    amplitude: 1.618     // Golden ratio amplitude
  },
  
  anger: {
    name: 'Anger',
    description: 'High intensity, phase opposition, destructive interference',
    coherence: 0.4,
    entropy: 0.65,
    localization: 0.7,
    phaseGradient: 0.8,
    primes: [3, 7, 11],  // Tritone-like dissonance
    basePhase: Math.PI,
    amplitude: 1.8       // High intensity
  },
  
  peace: {
    name: 'Peace',
    description: 'Perfect equilibrium, minimal phase gradient, stable resonance',
    coherence: 0.8,
    entropy: 0.25,
    localization: 0.2,
    phaseGradient: 0.0,
    primes: [2, 3, 5, 7], // Perfect harmony
    basePhase: 0,
    amplitude: 0.9
  },
  
  curiosity: {
    name: 'Curiosity',
    description: 'Exploratory phase wandering, moderate entropy, seeking',
    coherence: 0.5,
    entropy: 0.55,
    localization: 0.4,
    phaseGradient: 0.5,
    primes: [11, 13, 17, 19],
    basePhase: Math.PI / 6,
    amplitude: 1.0
  }
};

/**
 * Create a PrimeState from an emotional template
 */
function createEmotionalState(emotionName) {
  const template = EMOTIONAL_TEMPLATES[emotionName.toLowerCase()];
  if (!template) {
    throw new Error(`Unknown emotion: ${emotionName}`);
  }
  
  const state = new PrimeState();
  const primes = state.primes;
  
  // Build amplitude pattern based on template
  for (let i = 0; i < primes.length; i++) {
    const p = primes[i];
    
    // Base amplitude with localization
    const isTemplatePrime = template.primes.includes(p);
    let amp = isTemplatePrime ? template.amplitude : template.amplitude * (1 - template.localization);
    
    // Apply decay for non-template primes
    if (!isTemplatePrime) {
      amp *= Math.exp(-0.1 * i);
    }
    
    // Phase from template with gradient
    const phase = template.basePhase + template.phaseGradient * Math.log(p);
    
    state.set(p, Complex.fromPolar(amp, phase));
  }
  
  return state.normalize();
}

// ============================================================================
// FEELING OPERATOR F̂ (Chapter 9)
// ============================================================================

/**
 * FeelingOperator - Measures emotional resonance with templates
 * 
 * From book.pdf Eq. 9.2:
 * F̂ = Σ_k w_k R_k where w_k ∈ ℝ⁺
 * ⟨ψ|F̂|ψ⟩ = emotional resonance score
 * 
 * The operator projects a state onto emotional eigenstates and
 * returns the emotional "charge" or intensity.
 */
class FeelingOperator {
  constructor() {
    // Pre-compute template states
    this.templates = {};
    for (const [name, template] of Object.entries(EMOTIONAL_TEMPLATES)) {
      this.templates[name] = {
        template,
        state: createEmotionalState(name)
      };
    }
  }
  
  /**
   * Measure emotional resonance: ⟨ψ|F̂_emotion|ψ⟩
   * 
   * @param {PrimeState} state - State to analyze
   * @param {string} emotionName - Emotion to measure against
   * @returns {number} Resonance score [0, 1]
   */
  measure(state, emotionName) {
    const entry = this.templates[emotionName.toLowerCase()];
    if (!entry) {
      throw new Error(`Unknown emotion: ${emotionName}`);
    }
    
    const overlap = state.inner(entry.state);
    return overlap.norm();
  }
  
  /**
   * Full emotional spectrum analysis
   * 
   * @param {PrimeState} state - State to analyze
   * @returns {Object} Scores for all emotions
   */
  spectrum(state) {
    const scores = {};
    let max = { emotion: null, score: 0 };
    
    for (const name of Object.keys(this.templates)) {
      const score = this.measure(state, name);
      scores[name] = score;
      if (score > max.score) {
        max = { emotion: name, score };
      }
    }
    
    return {
      scores,
      dominant: max.emotion,
      dominantScore: max.score,
      template: EMOTIONAL_TEMPLATES[max.emotion]
    };
  }
  
  /**
   * Apply F̂ operator to state (project onto emotional subspace)
   * 
   * @param {PrimeState} state - Input state
   * @param {string} emotionName - Target emotion
   * @param {number} strength - Projection strength [0, 1]
   * @returns {PrimeState} Transformed state
   */
  apply(state, emotionName, strength = 0.5) {
    const entry = this.templates[emotionName.toLowerCase()];
    if (!entry) {
      throw new Error(`Unknown emotion: ${emotionName}`);
    }
    
    const result = new PrimeState(state.primes);
    const templateState = entry.state;
    
    for (const p of state.primes) {
      const current = state.get(p);
      const target = templateState.get(p);
      
      // Interpolate toward template
      const newRe = current.re + strength * (target.re - current.re);
      const newIm = current.im + strength * (target.im - current.im);
      
      result.set(p, new Complex(newRe, newIm));
    }
    
    return result.normalize();
  }
  
  /**
   * Emotional transition: smoothly move between emotions
   * 
   * @param {PrimeState} state - Current state
   * @param {string} fromEmotion - Starting emotion
   * @param {string} toEmotion - Target emotion
   * @param {number} t - Transition parameter [0, 1]
   * @returns {PrimeState} Intermediate state
   */
  transition(state, fromEmotion, toEmotion, t) {
    const fromState = this.templates[fromEmotion.toLowerCase()].state;
    const toState = this.templates[toEmotion.toLowerCase()].state;
    
    const result = new PrimeState(state.primes);
    
    for (const p of state.primes) {
      const from = fromState.get(p);
      const to = toState.get(p);
      
      // Linear interpolation
      const newRe = from.re + t * (to.re - from.re);
      const newIm = from.im + t * (to.im - from.im);
      
      result.set(p, new Complex(newRe, newIm));
    }
    
    return result.normalize();
  }
}

// ============================================================================
// CONSCIOUSNESS PRIMACY METRIC (Chapter 9)
// ============================================================================

/**
 * ConsciousnessPrimacy - Composite measure of conscious state integrity
 * 
 * From book.pdf Eq. 9.5:
 * Primacy = 0.4·F + 0.3·R + 0.2·C + 0.1·Γ
 * 
 * Where:
 * - F = Feeling (dominant emotional resonance)
 * - R = Resonance (prime resonance strength)
 * - C = Coherence (phase alignment)
 * - Γ = Knowledge resonance (semantic network activation)
 */
class ConsciousnessPrimacy {
  constructor(weights = null) {
    this.weights = weights || {
      feeling: 0.4,
      resonance: 0.3,
      coherence: 0.2,
      knowledge: 0.1
    };
    
    this.feelingOp = new FeelingOperator();
  }
  
  /**
   * Calculate primacy metric for a state
   * 
   * @param {PrimeState} state - State to evaluate
   * @param {Object} context - Optional context for knowledge calculation
   * @returns {Object} Primacy score and components
   */
  calculate(state, context = {}) {
    // F - Feeling component (dominant emotional resonance)
    const spectrum = this.feelingOp.spectrum(state);
    const F = spectrum.dominantScore;
    
    // R - Resonance component (average prime resonance)
    const dominant = state.dominant(3);
    const R = dominant.length > 0 
      ? dominant.reduce((sum, d) => sum + d.amp, 0) / dominant.length
      : 0;
    
    // C - Coherence component (using phase alignment)
    let C = 0;
    try {
      // Calculate phase coherence directly
      let phaseSum = { re: 0, im: 0 };
      for (const p of state.primes) {
        const amp = state.get(p);
        const norm = amp.norm();
        if (norm > 0.001) {
          phaseSum.re += amp.re / norm;
          phaseSum.im += amp.im / norm;
        }
      }
      C = Math.sqrt(phaseSum.re * phaseSum.re + phaseSum.im * phaseSum.im) / state.primes.length;
    } catch {
      C = 0.5; // Default fallback
    }
    
    // Γ - Knowledge resonance (simplified: entropy-based)
    const entropy = state.entropy();
    const maxEntropy = Math.log(state.primes.length);
    const Gamma = 1 - (entropy / maxEntropy); // High order = high knowledge
    
    // Composite primacy
    const primacy = 
      this.weights.feeling * F +
      this.weights.resonance * R +
      this.weights.coherence * C +
      this.weights.knowledge * Gamma;
    
    return {
      primacy,
      components: { F, R, C, Gamma },
      dominant: spectrum.dominant,
      interpretation: this._interpret(primacy, spectrum.dominant)
    };
  }
  
  _interpret(primacy, dominantEmotion) {
    if (primacy > 0.8) {
      return `High consciousness primacy with dominant ${dominantEmotion}. Coherent, resonant state.`;
    } else if (primacy > 0.5) {
      return `Moderate primacy with ${dominantEmotion} influence. Stable conscious processing.`;
    } else if (primacy > 0.3) {
      return `Low primacy with ${dominantEmotion} tendency. Fragmented attention.`;
    } else {
      return `Minimal primacy. Dispersed, incoherent state.`;
    }
  }
  
  /**
   * Track primacy evolution over time
   * 
   * @param {PrimeState} state - Initial state
   * @param {Function} evolver - Evolution function (state) => state
   * @param {number} steps - Number of evolution steps
   * @returns {Array} Primacy trajectory
   */
  trackEvolution(state, evolver, steps) {
    const trajectory = [];
    let current = state.clone();
    
    for (let i = 0; i < steps; i++) {
      const primacyData = this.calculate(current);
      trajectory.push({
        step: i,
        primacy: primacyData.primacy,
        emotion: primacyData.dominant,
        components: primacyData.components
      });
      
      current = evolver(current);
    }
    
    return trajectory;
  }
}

// ============================================================================
// EMOTIONAL ENTROPY SPECTROMETRY (Chapter 9)
// ============================================================================

/**
 * EmotionalSpectrometer - Analyze emotional content through entropy lens
 * 
 * Maps entropy patterns to emotional signatures
 */
class EmotionalSpectrometer {
  constructor() {
    this.feelingOp = new FeelingOperator();
  }
  
  /**
   * Full spectrometric analysis
   * 
   * @param {PrimeState|string} input - State or text to analyze
   * @returns {Object} Complete emotional spectrum analysis
   */
  analyze(input) {
    const state = typeof input === 'string' ? encodeMemory(input) : input;
    
    const spectrum = this.feelingOp.spectrum(state);
    const entropy = state.entropy();
    
    // Calculate coherence locally to avoid cross-reference issues
    let coherence = 0;
    try {
      let phaseSum = { re: 0, im: 0 };
      for (const p of state.primes) {
        const amp = state.get(p);
        const norm = amp.norm();
        if (norm > 0.001) {
          phaseSum.re += amp.re / norm;
          phaseSum.im += amp.im / norm;
        }
      }
      coherence = Math.sqrt(phaseSum.re * phaseSum.re + phaseSum.im * phaseSum.im) / state.primes.length;
    } catch {
      coherence = 0.5;
    }
    
    // Entropy-based emotional classification
    const entropyClass = this._classifyEntropy(entropy);
    const coherenceClass = this._classifyCoherence(coherence);
    
    // Calculate emotional valence (positive/negative)
    const valence = this._calculateValence(spectrum.scores);
    
    // Calculate arousal (high/low energy)
    const arousal = this._calculateArousal(spectrum.scores);
    
    return {
      state,
      spectrum: spectrum.scores,
      dominant: spectrum.dominant,
      dominantTemplate: spectrum.template,
      entropy,
      coherence,
      entropyClass,
      coherenceClass,
      valence,      // -1 to 1 (negative to positive)
      arousal,      // 0 to 1 (calm to excited)
      quadrant: this._getQuadrant(valence, arousal)
    };
  }
  
  _classifyEntropy(S) {
    if (S < 0.5) return 'ordered';
    if (S < 1.5) return 'moderate';
    if (S < 2.5) return 'mixed';
    return 'disordered';
  }
  
  _classifyCoherence(C) {
    if (C > 0.8) return 'highly_coherent';
    if (C > 0.5) return 'coherent';
    if (C > 0.2) return 'partially_coherent';
    return 'incoherent';
  }
  
  _calculateValence(scores) {
    // Positive emotions
    const positive = (scores.love || 0) + (scores.joy || 0) + 
                     (scores.awe || 0) + (scores.peace || 0);
    // Negative emotions
    const negative = (scores.fear || 0) + (scores.grief || 0) + 
                     (scores.anger || 0);
    
    const total = positive + negative + 0.001; // Avoid division by zero
    return (positive - negative) / total;
  }
  
  _calculateArousal(scores) {
    // High arousal emotions
    const high = (scores.fear || 0) + (scores.joy || 0) + 
                 (scores.anger || 0) + (scores.awe || 0);
    // Low arousal emotions
    const low = (scores.peace || 0) + (scores.grief || 0) + 
                (scores.love || 0);
    
    const total = high + low + 0.001;
    return high / total;
  }
  
  _getQuadrant(valence, arousal) {
    if (valence >= 0 && arousal >= 0.5) return 'excited_positive'; // Joy, Awe
    if (valence >= 0 && arousal < 0.5) return 'calm_positive';     // Love, Peace
    if (valence < 0 && arousal >= 0.5) return 'excited_negative';  // Fear, Anger
    return 'calm_negative';                                         // Grief
  }
  
  /**
   * Compare emotional similarity between two inputs
   */
  compare(input1, input2) {
    const analysis1 = this.analyze(input1);
    const analysis2 = this.analyze(input2);
    
    // Compare spectra using cosine similarity
    let dot = 0, norm1 = 0, norm2 = 0;
    for (const emotion of Object.keys(EMOTIONAL_TEMPLATES)) {
      const s1 = analysis1.spectrum[emotion] || 0;
      const s2 = analysis2.spectrum[emotion] || 0;
      dot += s1 * s2;
      norm1 += s1 * s1;
      norm2 += s2 * s2;
    }
    
    const similarity = dot / (Math.sqrt(norm1 * norm2) + 0.001);
    
    return {
      similarity,
      analysis1,
      analysis2,
      sameQuadrant: analysis1.quadrant === analysis2.quadrant
    };
  }
}

// Export all
export {
  EMOTIONAL_TEMPLATES,
  createEmotionalState,
  FeelingOperator,
  ConsciousnessPrimacy,
  EmotionalSpectrometer
};
