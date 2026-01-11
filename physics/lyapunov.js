/**
 * Lyapunov exponent estimation from phase histories
 */

function estimateLyapunov(oscillators, windowSize = 20) {
  if (oscillators[0].phaseHistory.length < windowSize) return 0;
  
  let sumLog = 0, count = 0;
  for (let i = 0; i < oscillators.length - 1; i++) {
    const h1 = oscillators[i].phaseHistory;
    const h2 = oscillators[i + 1].phaseHistory;
    const d0 = Math.abs(h1[0] - h2[0]);
    const dN = Math.abs(h1[h1.length - 1] - h2[h2.length - 1]);
    if (d0 > 1e-10 && dN > 1e-10) {
      sumLog += Math.log(dN / d0) / windowSize;
      count++;
    }
  }
  return count > 0 ? sumLog / count : 0;
}

function classifyStability(lyapunovExponent) {
  if (lyapunovExponent < -0.1) return 'STABLE';
  if (lyapunovExponent > 0.1) return 'CHAOTIC';
  return 'MARGINAL';
}

function adaptiveCoupling(baseCoupling, lyapunovExponent, gain = 0.5) {
  if (lyapunovExponent < -0.1) return baseCoupling * (1 + gain);
  if (lyapunovExponent > 0.1) return baseCoupling * (1 - gain);
  return baseCoupling;
}

/**
 * Compute local Lyapunov exponent for a specific oscillator
 */
function localLyapunov(oscillator, windowSize = 20) {
  const history = oscillator.phaseHistory;
  if (history.length < windowSize + 1) return 0;
  
  let sumLog = 0;
  for (let i = 1; i < windowSize; i++) {
    const d0 = Math.abs(history[i] - history[i - 1]);
    if (d0 > 1e-10) {
      sumLog += Math.log(d0);
    }
  }
  return sumLog / windowSize;
}

/**
 * Phase space reconstruction using delay embedding
 */
function delayEmbedding(history, embeddingDim = 3, delay = 1) {
  const embedded = [];
  for (let i = 0; i < history.length - (embeddingDim - 1) * delay; i++) {
    const point = [];
    for (let d = 0; d < embeddingDim; d++) {
      point.push(history[i + d * delay]);
    }
    embedded.push(point);
  }
  return embedded;
}

/**
 * Stability margin: how far from instability threshold
 */
function stabilityMargin(lyapunovExponent, threshold = 0.1) {
  return threshold - lyapunovExponent;
}

export {
    estimateLyapunov,
    classifyStability,
    adaptiveCoupling,
    localLyapunov,
    delayEmbedding,
    stabilityMargin
};