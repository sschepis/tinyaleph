/**
 * Quantum-inspired state collapse mechanics
 */

import { Hypercomplex } from '../core/hypercomplex.js';

function collapseProbability(entropyIntegral, lyapunovFactor = 1) {
  const factor = lyapunovFactor < 0 ? 1.5 : 0.5;
  return (1 - Math.exp(-entropyIntegral)) * factor;
}

function shouldCollapse(coherence, entropy, probability, thresholds) {
  const { minCoherence = 0.7, minEntropy = 1.8 } = thresholds;
  return coherence > minCoherence && entropy > minEntropy && Math.random() < probability;
}

function measureState(hypercomplex, basis = null) {
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
 */
function bornMeasurement(hypercomplex) {
  const n = hypercomplex.norm();
  if (n < 1e-10) return { index: 0, probability: 1 };
  
  const probabilities = hypercomplex.c.map(v => (v / n) ** 2);
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