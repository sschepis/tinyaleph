/**
 * Lyapunov exponent estimation from phase histories
 */

/**
 * Estimate Lyapunov exponent from time series or oscillators
 * @param {number[]|object[]} historyOrOscillators - Time series array or oscillator objects
 * @param {number} [windowSize=20] - Window size for computation
 * @returns {number} Estimated Lyapunov exponent
 */
function estimateLyapunov(historyOrOscillators, windowSize = 20) {
  // Handle both signatures: number[] (time series) or oscillator objects
  if (!historyOrOscillators || historyOrOscillators.length === 0) return 0;
  
  // Check if input is a raw number array (time series)
  if (typeof historyOrOscillators[0] === 'number') {
    return estimateLyapunovFromTimeSeries(historyOrOscillators, windowSize);
  }
  
  // Otherwise treat as oscillator objects
  const oscillators = historyOrOscillators;
  if (!oscillators[0] || !oscillators[0].phaseHistory) return 0;
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

/**
 * Estimate Lyapunov exponent from a time series (number array)
 * Uses the Rosenstein algorithm approximation
 * @param {number[]} history - Time series data
 * @param {number} [windowSize=20] - Window size
 * @returns {number} Estimated Lyapunov exponent
 */
function estimateLyapunovFromTimeSeries(history, windowSize = 20) {
  if (history.length < windowSize + 1) return 0;
  
  let sumLog = 0;
  let count = 0;
  
  // Compute average log divergence over window
  for (let i = 1; i < Math.min(history.length, windowSize); i++) {
    const d0 = Math.abs(history[i] - history[i - 1]);
    if (d0 > 1e-10) {
      // Find nearby point and track divergence
      const neighbors = [];
      for (let j = 0; j < history.length; j++) {
        if (Math.abs(j - i) > 1) {
          const dist = Math.abs(history[j] - history[i]);
          if (dist > 1e-10 && dist < 0.5) {
            neighbors.push({ j, dist });
          }
        }
      }
      
      if (neighbors.length > 0) {
        neighbors.sort((a, b) => a.dist - b.dist);
        const nearIdx = neighbors[0].j;
        const initialDist = neighbors[0].dist;
        
        // Track divergence
        const evolvedDist = Math.abs(
          history[Math.min(i + windowSize, history.length - 1)] -
          history[Math.min(nearIdx + windowSize, history.length - 1)]
        );
        
        if (evolvedDist > 1e-10) {
          sumLog += Math.log(evolvedDist / initialDist) / windowSize;
          count++;
        }
      }
    }
  }
  
  return count > 0 ? sumLog / count : 0;
}

/**
 * Classify stability based on Lyapunov exponent
 * @param {number} lyapunovExponent - The Lyapunov exponent
 * @returns {'stable'|'unstable'|'chaotic'|'collapsed'} Stability classification
 */
function classifyStability(lyapunovExponent) {
  if (lyapunovExponent < -0.1) return 'collapsed';  // Strong convergence
  if (lyapunovExponent < 0) return 'stable';         // Weak convergence
  if (lyapunovExponent < 0.5) return 'unstable';    // Weak divergence
  return 'chaotic';                                   // Strong divergence
}

/**
 * Compute adaptive coupling strength based on coherence or Lyapunov exponent
 * @param {number} coherenceOrBase - Coherence value (0-1) or base coupling strength
 * @param {number} [baseStrengthOrLyapunov=0.3] - Base strength (for coherence mode) or Lyapunov exponent
 * @param {number} [gain=0.5] - Gain factor for legacy mode
 * @returns {number} Adapted coupling strength
 */
function adaptiveCoupling(coherenceOrBase, baseStrengthOrLyapunov = 0.3, gain = 0.5) {
  // If first arg is between 0 and 1 and second is small, treat as coherence mode
  // adaptiveCoupling(coherence, baseStrength?)
  if (coherenceOrBase >= 0 && coherenceOrBase <= 1 &&
      (baseStrengthOrLyapunov >= 0.05 && baseStrengthOrLyapunov <= 1)) {
    const coherence = coherenceOrBase;
    const baseStrength = baseStrengthOrLyapunov;
    
    // High coherence = stronger coupling, low coherence = weaker coupling
    // Scale coupling between 0.5x and 1.5x base strength based on coherence
    return baseStrength * (0.5 + coherence);
  }
  
  // Legacy mode: adaptiveCoupling(baseCoupling, lyapunovExponent, gain?)
  const baseCoupling = coherenceOrBase;
  const lyapunovExponent = baseStrengthOrLyapunov;
  
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