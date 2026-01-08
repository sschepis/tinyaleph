/**
 * Protein Folding via Kuramoto Oscillator Dynamics
 * 
 * Models protein folding as entropy minimization through coupled oscillator synchronization.
 * Each amino acid residue is an oscillator with:
 * - Natural frequency derived from its prime value
 * - Coupling strength from contact propensity (hydrophobic, electrostatic, resonance)
 * 
 * Folded state = synchronized oscillators = low entropy configuration
 */

const { AMINO_ACID_PRIMES, AMINO_ACID_PROPERTIES, getChargeFromPrime, getHydrophobicityFromPrime } = require('./encoding');

// Import physics modules - with fallback for standalone testing
let KuramotoModel, NetworkKuramoto, AdaptiveKuramoto, shannonEntropy, primeToFrequency, calculateResonance;

try {
  const physics = require('../../physics');
  const core = require('../../core');
  
  KuramotoModel = physics.KuramotoModel;
  NetworkKuramoto = physics.NetworkKuramoto || physics.KuramotoModel;
  AdaptiveKuramoto = physics.AdaptiveKuramoto || physics.KuramotoModel;
  shannonEntropy = physics.shannonEntropy;
  primeToFrequency = core.primeToFrequency;
  calculateResonance = core.calculateResonance;
} catch (e) {
  // Fallback implementations for standalone testing
  primeToFrequency = (p, base = 1, logScale = 10) => base + Math.log(p) / logScale;
  calculateResonance = (p1, p2) => {
    const ratio = Math.max(p1, p2) / Math.min(p1, p2);
    const PHI = 1.618033988749895;
    return 1 / (1 + Math.abs(ratio - PHI));
  };
  shannonEntropy = (probs) => {
    let H = 0;
    for (const p of probs) {
      if (p > 1e-10) H -= p * Math.log2(p);
    }
    return H;
  };
}

/**
 * FoldingTransform
 * 
 * Protein folding modeled as entropy minimization via Kuramoto synchronization.
 */
class FoldingTransform {
  constructor(options = {}) {
    this.options = {
      coupling: options.coupling || 0.3,
      temperature: options.temperature || 1.0,
      maxSteps: options.maxSteps || 1000,
      dt: options.dt || 0.01,
      convergenceThreshold: options.convergenceThreshold || 0.95,
      minSequenceSeparation: options.minSequenceSeparation || 4,
      hydrophobicWeight: options.hydrophobicWeight || 0.4,
      electrostaticWeight: options.electrostaticWeight || 0.3,
      resonanceWeight: options.resonanceWeight || 0.3,
      ...options
    };
  }
  
  /**
   * Fold protein using Kuramoto oscillator dynamics
   * @param {number[]} proteinPrimes - Protein sequence as amino acid primes
   * @returns {object} Folding result with structure information
   */
  fold(proteinPrimes) {
    const n = proteinPrimes.length;
    
    if (n < 4) {
      return {
        success: false,
        error: 'Protein too short for folding simulation',
        length: n
      };
    }
    
    // Initialize oscillators with frequencies from primes
    const frequencies = proteinPrimes.map(p => primeToFrequency(p, 1, 10));
    
    // Build contact propensity matrix
    const contactMatrix = this.computeContactPropensity(proteinPrimes);
    
    // Initialize phases randomly
    const phases = new Array(n).fill(0).map(() => Math.random() * 2 * Math.PI);
    
    // Evolution tracking
    const history = {
      orderParameter: [],
      entropy: [],
      energyLandscape: []
    };
    
    // Kuramoto evolution
    let order = 0;
    let step = 0;
    
    for (step = 0; step < this.options.maxSteps; step++) {
      // Compute phase updates (Kuramoto equation)
      const dPhases = this.kuramotoStep(phases, frequencies, contactMatrix);
      
      // Apply thermal noise
      for (let i = 0; i < n; i++) {
        phases[i] += dPhases[i] * this.options.dt;
        phases[i] += this.thermalNoise() * Math.sqrt(this.options.dt);
        // Keep phases in [0, 2π]
        phases[i] = ((phases[i] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      }
      
      // Calculate order parameter
      order = this.calculateOrderParameter(phases);
      const entropy = this.calculatePhasesEntropy(phases);
      const energy = this.calculateFoldingEnergy(phases, proteinPrimes, contactMatrix);
      
      history.orderParameter.push(order);
      history.entropy.push(entropy);
      history.energyLandscape.push(energy);
      
      // Check convergence
      if (order > this.options.convergenceThreshold) {
        break;
      }
    }
    
    // Extract structure from final phases
    const structure = this.phasesToStructure(phases, proteinPrimes);
    const contacts = this.extractContacts(phases, this.options.minSequenceSeparation);
    
    return {
      success: true,
      phases: [...phases],
      structure,
      contacts,
      orderParameter: order,
      finalEntropy: history.entropy[history.entropy.length - 1],
      foldingFreeEnergy: this.estimateFreeEnergy(order, proteinPrimes),
      stepsToConverge: step,
      history,
      secondaryStructure: this.assignSecondaryStructure(structure),
      compactness: this.calculateCompactness(contacts, n)
    };
  }
  
  /**
   * Compute Kuramoto phase derivatives
   */
  kuramotoStep(phases, frequencies, coupling) {
    const n = phases.length;
    const dPhases = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      // Natural frequency term
      dPhases[i] = frequencies[i];
      
      // Coupling term (sum over all connected oscillators)
      for (let j = 0; j < n; j++) {
        if (i !== j && coupling[i][j] > 0) {
          dPhases[i] += coupling[i][j] * Math.sin(phases[j] - phases[i]);
        }
      }
    }
    
    return dPhases;
  }
  
  /**
   * Compute contact propensity matrix from amino acid properties
   */
  computeContactPropensity(proteinPrimes) {
    const n = proteinPrimes.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + this.options.minSequenceSeparation; j < n; j++) {
        const pi = proteinPrimes[i];
        const pj = proteinPrimes[j];
        
        // Resonance component (golden ratio proximity)
        const resonance = calculateResonance(pi, pj);
        
        // Hydrophobic interaction (smaller primes are more hydrophobic)
        const hi = getHydrophobicityFromPrime(pi);
        const hj = getHydrophobicityFromPrime(pj);
        const hydrophobic = this.hydrophobicPotential(hi, hj);
        
        // Electrostatic interaction
        const qi = getChargeFromPrime(pi);
        const qj = getChargeFromPrime(pj);
        const electrostatic = this.electrostaticPotential(qi, qj);
        
        // Combined contact propensity
        const propensity = 
          this.options.resonanceWeight * resonance +
          this.options.hydrophobicWeight * hydrophobic +
          this.options.electrostaticWeight * electrostatic;
        
        matrix[i][j] = matrix[j][i] = Math.max(0, propensity) * this.options.coupling;
      }
    }
    
    return matrix;
  }
  
  /**
   * Hydrophobic potential: like attracts like
   */
  hydrophobicPotential(h1, h2) {
    // Both hydrophobic (positive h): attract
    // Both hydrophilic (negative h): weak attract
    // Mixed: repel
    if (h1 > 0 && h2 > 0) {
      return Math.sqrt(h1 * h2) / 4;
    } else if (h1 < 0 && h2 < 0) {
      return Math.sqrt(-h1 * -h2) / 8;
    } else {
      return -0.1;
    }
  }
  
  /**
   * Electrostatic potential: opposites attract
   */
  electrostaticPotential(q1, q2) {
    if (q1 * q2 < 0) {
      return 0.5;  // Opposite charges attract
    } else if (q1 * q2 > 0) {
      return -0.3;  // Same charges repel
    }
    return 0;
  }
  
  /**
   * Generate thermal noise
   */
  thermalNoise() {
    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return gaussian * Math.sqrt(this.options.temperature) * 0.1;
  }
  
  /**
   * Calculate Kuramoto order parameter
   */
  calculateOrderParameter(phases) {
    const n = phases.length;
    let sumCos = 0, sumSin = 0;
    
    for (const phase of phases) {
      sumCos += Math.cos(phase);
      sumSin += Math.sin(phase);
    }
    
    return Math.sqrt(sumCos * sumCos + sumSin * sumSin) / n;
  }
  
  /**
   * Calculate entropy of phase distribution
   */
  calculatePhasesEntropy(phases) {
    const bins = 36;  // 10-degree bins
    const histogram = Array(bins).fill(0);
    
    for (const phase of phases) {
      const bin = Math.floor(phase / (2 * Math.PI) * bins);
      histogram[Math.min(bin, bins - 1)]++;
    }
    
    const probs = histogram.map(h => h / phases.length);
    return shannonEntropy(probs);
  }
  
  /**
   * Calculate folding energy from phases and contacts
   */
  calculateFoldingEnergy(phases, primes, contactMatrix) {
    let energy = 0;
    const n = phases.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = i + this.options.minSequenceSeparation; j < n; j++) {
        const phaseDiff = Math.abs(phases[i] - phases[j]);
        const inContact = phaseDiff < 0.5 || phaseDiff > 2 * Math.PI - 0.5;
        
        if (inContact && contactMatrix[i][j] > 0) {
          // Favorable contact
          energy -= contactMatrix[i][j];
        }
      }
    }
    
    return energy;
  }
  
  /**
   * Convert phases to structural information
   */
  phasesToStructure(phases, primes) {
    const structure = [];
    
    for (let i = 0; i < phases.length; i++) {
      // Phase determines backbone angles (phi, psi approximation)
      const phi = (phases[i] - Math.PI) * 180 / Math.PI;
      const nextPhase = phases[(i + 1) % phases.length];
      const psi = (nextPhase - phases[i]) * 180 / Math.PI;
      
      structure.push({
        residue: i,
        prime: primes[i],
        phase: phases[i],
        phi,
        psi,
        secondaryStructure: this.classifySecondaryStructure(phi, psi)
      });
    }
    
    return structure;
  }
  
  /**
   * Classify secondary structure from backbone angles
   */
  classifySecondaryStructure(phi, psi) {
    // Alpha helix: phi ≈ -60, psi ≈ -45
    if (phi > -100 && phi < -30 && psi > -70 && psi < 0) {
      return 'H';  // Helix
    }
    
    // Beta sheet: phi ≈ -120, psi ≈ +120
    if (phi > -180 && phi < -60 && (psi > 90 || psi < -90)) {
      return 'E';  // Extended (sheet)
    }
    
    // 3-10 helix: phi ≈ -49, psi ≈ -26
    if (phi > -70 && phi < -30 && psi > -50 && psi < 0) {
      return 'G';  // 3-10 helix
    }
    
    return 'C';  // Coil
  }
  
  /**
   * Extract residue-residue contacts from phases
   */
  extractContacts(phases, minSeparation = 4, threshold = 0.5) {
    const contacts = [];
    const n = phases.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = i + minSeparation; j < n; j++) {
        const phaseDiff = Math.abs(phases[i] - phases[j]);
        const normalized = Math.min(phaseDiff, 2 * Math.PI - phaseDiff);
        
        if (normalized < threshold) {
          contacts.push({
            i,
            j,
            distance: normalized,
            strength: 1 - normalized / threshold
          });
        }
      }
    }
    
    return contacts;
  }
  
  /**
   * Assign secondary structure elements
   */
  assignSecondaryStructure(structure) {
    const ssSequence = structure.map(s => s.secondaryStructure).join('');
    
    // Find helices (runs of H)
    const helices = [];
    const helixPattern = /H{4,}/g;
    let match;
    while ((match = helixPattern.exec(ssSequence)) !== null) {
      helices.push({ start: match.index, end: match.index + match[0].length - 1, type: 'helix' });
    }
    
    // Find sheets (runs of E)
    const sheets = [];
    const sheetPattern = /E{3,}/g;
    while ((match = sheetPattern.exec(ssSequence)) !== null) {
      sheets.push({ start: match.index, end: match.index + match[0].length - 1, type: 'sheet' });
    }
    
    return {
      sequence: ssSequence,
      helices,
      sheets,
      helixContent: (ssSequence.match(/H/g) || []).length / structure.length,
      sheetContent: (ssSequence.match(/E/g) || []).length / structure.length
    };
  }
  
  /**
   * Calculate compactness (contact order)
   */
  calculateCompactness(contacts, length) {
    if (contacts.length === 0) return 0;
    
    const totalSeparation = contacts.reduce((sum, c) => sum + (c.j - c.i), 0);
    return totalSeparation / (contacts.length * length);
  }
  
  /**
   * Estimate folding free energy
   */
  estimateFreeEnergy(orderParameter, primes) {
    // ΔG ∝ -kT * ln(order parameter) - hydrophobic contribution
    const kT = this.options.temperature;
    const entropyTerm = -kT * Math.log(Math.max(orderParameter, 0.01));
    
    // Hydrophobic burial contribution
    const hydrophobicPrimes = primes.filter(p => p <= 43);
    const hydrophobicFraction = hydrophobicPrimes.length / primes.length;
    const hydrophobicTerm = -hydrophobicFraction * 2.0;  // Favorable
    
    return entropyTerm + hydrophobicTerm;
  }
  
  /**
   * Simulated annealing for global minimum
   */
  anneal(proteinPrimes, options = {}) {
    const startTemp = options.startTemp || 10.0;
    const endTemp = options.endTemp || 0.1;
    const coolingRate = options.coolingRate || 0.99;
    
    let temp = startTemp;
    let bestResult = null;
    
    while (temp > endTemp) {
      this.options.temperature = temp;
      const result = this.fold(proteinPrimes);
      
      if (!bestResult || result.foldingFreeEnergy < bestResult.foldingFreeEnergy) {
        bestResult = result;
      }
      
      temp *= coolingRate;
    }
    
    return bestResult;
  }
}

module.exports = { FoldingTransform };