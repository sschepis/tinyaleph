/**
 * Quantum-inspired state collapse mechanics
 */

import { Hypercomplex } from '../core/hypercomplex.js';

/**
 * Calculate collapse probability using Born rule approximation
 * @param {Hypercomplex|object} state - HypercomplexState or CollapseState object
 * @param {number} [threshold=0.5] - Collapse threshold
 * @returns {number} Probability value 0-1
 */
function collapseProbability(state, threshold = 0.5) {
  // Handle CollapseState object with entropy/coherence/lyapunov
  if (state && typeof state === 'object' && 'entropy' in state) {
    const { entropy = 0, coherence = 0.5, lyapunov = 0 } = state;
    const factor = lyapunov < 0 ? 1.5 : 0.5;
    return (1 - Math.exp(-entropy * coherence)) * factor;
  }
  
  // Handle Hypercomplex state
  if (state && state.c) {
    const n = state.norm ? state.norm() : Math.sqrt(state.c.reduce((s, v) => s + v * v, 0));
    if (n < 1e-10) return 0;
    
    // Compute Born-rule probability based on dominant component
    const probs = state.c.map(v => (v / n) ** 2);
    const maxProb = Math.max(...probs);
    return maxProb > threshold ? maxProb : 0;
  }
  
  // Legacy signature: collapseProbability(entropyIntegral, lyapunovFactor)
  if (typeof state === 'number') {
    const entropyIntegral = state;
    const lyapunovFactor = threshold;
    const factor = lyapunovFactor < 0 ? 1.5 : 0.5;
    return (1 - Math.exp(-entropyIntegral)) * factor;
  }
  
  return 0;
}

/**
 * Determine if state should collapse
 * @param {Hypercomplex|object} state - HypercomplexState or CollapseState
 * @param {number} threshold - Collapse threshold
 * @returns {boolean} True if collapse should occur
 */
function shouldCollapse(state, threshold = 0.5) {
  // Handle CollapseState with entropy/coherence
  if (state && typeof state === 'object' && 'entropy' in state) {
    const { entropy = 0, coherence = 0.5, lyapunov = 0 } = state;
    return coherence > threshold && entropy > 1.0 && lyapunov < 0.5;
  }
  
  // Handle Hypercomplex state
  if (state && state.c) {
    const prob = collapseProbability(state, threshold);
    return prob > threshold && Math.random() < prob;
  }
  
  // Legacy signature: shouldCollapse(coherence, entropy, probability, thresholds)
  if (typeof state === 'number') {
    const coherence = state;
    const entropy = threshold;
    const probability = arguments[2] || 0.5;
    const thresholds = arguments[3] || {};
    const { minCoherence = 0.7, minEntropy = 1.8 } = thresholds;
    return coherence > minCoherence && entropy > minEntropy && Math.random() < probability;
  }
  
  return false;
}

/**
 * Measure state and return collapsed index
 * @param {Hypercomplex} hypercomplex - State to measure
 * @param {Hypercomplex} [basis=null] - Optional measurement basis
 * @returns {number} Collapsed index (dominant component index)
 */
function measureState(hypercomplex, basis = null) {
  if (!hypercomplex || !hypercomplex.c) return 0;
  
  if (!basis) {
    let maxIdx = 0, maxVal = 0;
    for (let i = 0; i < hypercomplex.dim; i++) {
      const v = Math.abs(hypercomplex.c[i]);
      if (v > maxVal) { maxVal = v; maxIdx = i; }
    }
    return maxIdx;  // Return just the index as a number
  }
  return hypercomplex.dot(basis);
}

/**
 * Legacy measureState that returns full object
 */
function measureStateDetailed(hypercomplex, basis = null) {
  if (!basis) {
    let maxIdx = 0, maxVal = 0;
    for (let i = 0; i < hypercomplex.dim; i++) {
      const v = Math.abs(hypercomplex.c[i]);
      if (v > maxVal) { maxVal = v; maxIdx = i; }
    }
    return { index: maxIdx, value: hypercomplex.c[maxIdx] };
  }
  return hypercomplex.dot(basis);
}

/**
 * Collapse state to a specific basis vector
 */
function collapseToIndex(hypercomplex, index) {
  const collapsed = Hypercomplex.zero(hypercomplex.dim);
  collapsed.c[index] = hypercomplex.c[index] >= 0 ? 1 : -1;
  return collapsed;
}

/**
 * Probabilistic measurement with Born rule
 * @param {Hypercomplex|number[]} hypercomplexOrAmplitudes - State or amplitudes array
 * @returns {{ index: number, probability: number }} Measurement result
 */
function bornMeasurement(hypercomplexOrAmplitudes) {
  let probabilities;
  
  // Handle plain number array (amplitudes)
  if (Array.isArray(hypercomplexOrAmplitudes)) {
    const amplitudes = hypercomplexOrAmplitudes;
    const sumSq = amplitudes.reduce((s, v) => s + v * v, 0);
    if (sumSq < 1e-10) return { index: 0, probability: 1 };
    probabilities = amplitudes.map(v => (v * v) / sumSq);
  } else {
    // Handle Hypercomplex object
    const hypercomplex = hypercomplexOrAmplitudes;
    const n = hypercomplex.norm ? hypercomplex.norm() : Math.sqrt(hypercomplex.c.reduce((s, v) => s + v * v, 0));
    if (n < 1e-10) return { index: 0, probability: 1 };
    probabilities = hypercomplex.c.map(v => (v / n) ** 2);
  }
  
  const r = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (r < cumulative) {
      return { index: i, probability: probabilities[i] };
    }
  }
  return { index: probabilities.length - 1, probability: probabilities[probabilities.length - 1] };
}

/**
 * Partial collapse: mix between current state and collapsed state
 */
function partialCollapse(hypercomplex, targetIndex, strength = 0.5) {
  const collapsed = Hypercomplex.zero(hypercomplex.dim);
  const sign = hypercomplex.c[targetIndex] >= 0 ? 1 : -1;
  collapsed.c[targetIndex] = sign;
  
  // Linear interpolation between current and collapsed
  const result = Hypercomplex.zero(hypercomplex.dim);
  for (let i = 0; i < hypercomplex.dim; i++) {
    result.c[i] = (1 - strength) * hypercomplex.c[i] + strength * collapsed.c[i];
  }
  return result.normalize();
}

/**
 * Decoherence: gradual loss of quantum coherence
 */
function applyDecoherence(hypercomplex, rate = 0.1) {
  const result = Hypercomplex.zero(hypercomplex.dim);
  for (let i = 0; i < hypercomplex.dim; i++) {
    // Add small random noise proportional to rate
    result.c[i] = hypercomplex.c[i] * (1 - rate) + (Math.random() - 0.5) * rate;
  }
  return result.normalize();
}

export {
    collapseProbability,
    shouldCollapse,
    measureState,
    collapseToIndex,
    bornMeasurement,
    partialCollapse,
    applyDecoherence
};