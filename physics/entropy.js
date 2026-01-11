/**
 * Information-theoretic measures for hypercomplex states
 */

function shannonEntropy(probabilities) {
  let H = 0;
  for (const p of probabilities) {
    if (p > 1e-10) H -= p * Math.log2(p);
  }
  return H;
}

function stateEntropy(hypercomplex) {
  const n = hypercomplex.norm();
  if (n < 1e-10) return 0;
  const probs = hypercomplex.c.map(v => (v / n) ** 2);
  return shannonEntropy(probs);
}

function coherence(state1, state2) {
  const n1 = state1.norm();
  const n2 = state2.norm();
  if (n1 < 1e-10 || n2 < 1e-10) return 0;
  return Math.abs(state1.dot(state2)) / (n1 * n2);
}

function mutualInformation(bank1, bank2) {
  let corr = 0;
  const n = Math.min(bank1.oscillators.length, bank2.oscillators.length);
  for (let i = 0; i < n; i++) {
    corr += Math.cos(bank1.oscillators[i].phase - bank2.oscillators[i].phase);
  }
  return Math.max(0, corr / n);
}

/**
 * Relative entropy (KL divergence) between two probability distributions
 */
function relativeEntropy(p, q) {
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 1e-10 && q[i] > 1e-10) {
      kl += p[i] * Math.log2(p[i] / q[i]);
    }
  }
  return kl;
}

/**
 * Joint entropy of two hypercomplex states
 */
function jointEntropy(state1, state2) {
  const n1 = state1.norm();
  const n2 = state2.norm();
  if (n1 < 1e-10 || n2 < 1e-10) return 0;
  
  // Create joint probability distribution
  const probs = [];
  for (let i = 0; i < state1.dim; i++) {
    for (let j = 0; j < state2.dim; j++) {
      const p1 = (state1.c[i] / n1) ** 2;
      const p2 = (state2.c[j] / n2) ** 2;
      probs.push(p1 * p2);
    }
  }
  return shannonEntropy(probs);
}

/**
 * Entropy rate from oscillator bank
 */
function oscillatorEntropy(bank) {
  const amplitudes = bank.getAmplitudes();
  const total = amplitudes.reduce((a, b) => a + b, 0);
  if (total < 1e-10) return 0;
  const probs = amplitudes.map(a => a / total);
  return shannonEntropy(probs);
}

export {
    shannonEntropy,
    stateEntropy,
    coherence,
    mutualInformation,
    relativeEntropy,
    jointEntropy,
    oscillatorEntropy
};