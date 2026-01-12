/**
 * Molecular Binding - Protein-Ligand and Protein-Protein Interactions
 *
 * Models molecular binding using prime resonance:
 * - Binding affinity correlates with golden ratio resonance
 * - Docking uses multi-system Kuramoto coupling
 * - Affinity scoring combines electrostatic, hydrophobic, and resonance terms
 */

import { AMINO_ACID_PRIMES,
  getChargeFromPrime,
  getHydrophobicityFromPrime } from './encoding.js';

// Golden ratio constant
const PHI = 1.618033988749895;

// Fallback implementations (used if core modules don't provide these)
const fallbackCalculateResonance = (p1, p2) => {
  const ratio = Math.max(p1, p2) / Math.min(p1, p2);
  return 1 / (1 + Math.abs(ratio - PHI));
};

const fallbackFindGoldenPairs = (primes) => {
  const pairs = [];
  for (let i = 0; i < primes.length; i++) {
    for (let j = i + 1; j < primes.length; j++) {
      if (fallbackCalculateResonance(primes[i], primes[j]) > 0.8) {
        pairs.push([primes[i], primes[j]]);
      }
    }
  }
  return pairs;
};

const fallbackResonanceSignature = (primes) => {
  let sum = 0, count = 0;
  for (let i = 0; i < primes.length; i++) {
    for (let j = i + 1; j < primes.length; j++) {
      sum += fallbackCalculateResonance(primes[i], primes[j]);
      count++;
    }
  }
  return { mean: sum / Math.max(count, 1), count };
};

const fallbackPrimeToFrequency = (p, base = 1, logScale = 10) => base + Math.log(p) / logScale;

// Export calculation functions - fallbacks are used directly
// Core module integration can be done by consumers if needed
const calculateResonance = fallbackCalculateResonance;
const findGoldenPairs = fallbackFindGoldenPairs;
const resonanceSignature = fallbackResonanceSignature;
const primeToFrequency = fallbackPrimeToFrequency;

/**
 * BindingAffinityCalculator
 * 
 * Computes molecular binding using prime resonance scoring
 */
class BindingAffinityCalculator {
  constructor(options = {}) {
    this.options = {
      resonanceWeight: options.resonanceWeight || 0.4,
      electrostaticWeight: options.electrostaticWeight || 0.3,
      hydrophobicWeight: options.hydrophobicWeight || 0.3,
      goldenBonus: options.goldenBonus || 0.1,
      ...options
    };
  }
  
  /**
   * Compute binding affinity between two molecules
   * @param {number[]} mol1Primes - First molecule as prime array
   * @param {number[]} mol2Primes - Second molecule as prime array
   * @returns {object} Binding affinity result
   */
  computeAffinity(mol1Primes, mol2Primes) {
    const interactions = [];
    let totalScore = 0;
    
    for (let i = 0; i < mol1Primes.length; i++) {
      for (let j = 0; j < mol2Primes.length; j++) {
        const p1 = mol1Primes[i];
        const p2 = mol2Primes[j];
        
        // Calculate interaction components
        const resonance = calculateResonance(p1, p2);
        const electrostatic = this.electrostaticInteraction(p1, p2);
        const hydrophobic = this.hydrophobicInteraction(p1, p2);
        
        const pairScore = 
          this.options.resonanceWeight * resonance +
          this.options.electrostaticWeight * electrostatic +
          this.options.hydrophobicWeight * hydrophobic;
        
        if (pairScore > 0.2) {
          interactions.push({
            residue1: i,
            residue2: j,
            prime1: p1,
            prime2: p2,
            score: pairScore,
            resonance,
            electrostatic,
            hydrophobic
          });
          totalScore += pairScore;
        }
      }
    }
    
    // Golden ratio bonus
    const allPrimes = [...mol1Primes, ...mol2Primes];
    const goldenPairs = findGoldenPairs(allPrimes);
    const goldenBonus = goldenPairs.length * this.options.goldenBonus;
    
    // Normalize by interface size
    const interfaceSize = mol1Primes.length * mol2Primes.length;
    const normalizedAffinity = (totalScore / interfaceSize) + goldenBonus;
    
    // Convert to binding energy (kcal/mol approximation)
    const bindingEnergy = -1.98 * 300 * Math.log(Math.max(normalizedAffinity, 0.01)) / 1000;
    
    // Resonance signature of the complex
    const signature = resonanceSignature(allPrimes);
    
    return {
      affinity: normalizedAffinity,
      bindingEnergy,
      interactions: interactions.sort((a, b) => b.score - a.score),
      goldenPairs: goldenPairs.length,
      interfaceSize,
      resonanceSignature: signature
    };
  }
  
  /**
   * Electrostatic interaction between two primes
   */
  electrostaticInteraction(p1, p2) {
    const q1 = getChargeFromPrime(p1);
    const q2 = getChargeFromPrime(p2);
    
    if (q1 * q2 < 0) return 1.0;   // Opposite charges attract
    if (q1 * q2 > 0) return -0.5;  // Same charges repel
    return 0;
  }
  
  /**
   * Hydrophobic interaction
   */
  hydrophobicInteraction(p1, p2) {
    const h1 = getHydrophobicityFromPrime(p1);
    const h2 = getHydrophobicityFromPrime(p2);
    
    // Like attracts like in hydrophobic effect
    if (h1 > 0 && h2 > 0) {
      return Math.sqrt(h1 * h2) / 5;  // Both hydrophobic
    }
    if (h1 < 0 && h2 < 0) {
      return Math.sqrt(-h1 * -h2) / 10;  // Both hydrophilic
    }
    return -0.1;  // Mixed - unfavorable
  }
  
  /**
   * Screen a library of ligands against a target
   */
  screenLibrary(targetPrimes, ligandLibrary) {
    return ligandLibrary
      .map(ligand => ({
        id: ligand.id,
        name: ligand.name,
        ...this.computeAffinity(targetPrimes, ligand.primes)
      }))
      .sort((a, b) => b.affinity - a.affinity);
  }
  
  /**
   * Find hotspot residues (key binding determinants)
   */
  findHotspots(mol1Primes, mol2Primes, threshold = 0.5) {
    const affinity = this.computeAffinity(mol1Primes, mol2Primes);
    
    // Count interactions per residue
    const residueScores = {};
    for (const int of affinity.interactions) {
      const key1 = `mol1_${int.residue1}`;
      const key2 = `mol2_${int.residue2}`;
      
      residueScores[key1] = (residueScores[key1] || 0) + int.score;
      residueScores[key2] = (residueScores[key2] || 0) + int.score;
    }
    
    // Filter hotspots above threshold
    const hotspots = Object.entries(residueScores)
      .filter(([_, score]) => score > threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([residue, score]) => ({ residue, score }));
    
    return hotspots;
  }
}

/**
 * MolecularDocker
 * 
 * Docks molecules using Kuramoto oscillator synchronization
 */
class MolecularDocker {
  constructor(options = {}) {
    this.options = {
      coupling: options.coupling || 0.2,
      steps: options.steps || 500,
      dt: options.dt || 0.01,
      ...options
    };
    
    this.affinityCalculator = new BindingAffinityCalculator(options);
  }
  
  /**
   * Dock two molecules using oscillator dynamics
   */
  dock(receptorPrimes, ligandPrimes) {
    const n1 = receptorPrimes.length;
    const n2 = ligandPrimes.length;
    
    // Initialize oscillator phases
    const receptorPhases = new Array(n1).fill(0).map(() => Math.random() * 2 * Math.PI);
    const ligandPhases = new Array(n2).fill(0).map(() => Math.random() * 2 * Math.PI);
    
    // Frequencies from primes
    const receptorFreqs = receptorPrimes.map(p => primeToFrequency(p, 1, 10));
    const ligandFreqs = ligandPrimes.map(p => primeToFrequency(p, 1, 10));
    
    // Cross-coupling matrix
    const crossCoupling = this.computeCrossCoupling(receptorPrimes, ligandPrimes);
    
    // Evolution
    const trajectory = [];
    
    for (let step = 0; step < this.options.steps; step++) {
      // Update receptor phases
      for (let i = 0; i < n1; i++) {
        let dPhase = receptorFreqs[i];
        
        // Internal coupling (within receptor)
        for (let j = 0; j < n1; j++) {
          if (i !== j) {
            dPhase += this.options.coupling * 0.5 * 
              Math.sin(receptorPhases[j] - receptorPhases[i]);
          }
        }
        
        // Cross coupling (receptor-ligand)
        for (let j = 0; j < n2; j++) {
          dPhase += crossCoupling[i][j] * 
            Math.sin(ligandPhases[j] - receptorPhases[i]);
        }
        
        receptorPhases[i] += dPhase * this.options.dt;
      }
      
      // Update ligand phases
      for (let i = 0; i < n2; i++) {
        let dPhase = ligandFreqs[i];
        
        // Internal coupling (within ligand)
        for (let j = 0; j < n2; j++) {
          if (i !== j) {
            dPhase += this.options.coupling * 0.5 * 
              Math.sin(ligandPhases[j] - ligandPhases[i]);
          }
        }
        
        // Cross coupling (ligand-receptor)
        for (let j = 0; j < n1; j++) {
          dPhase += crossCoupling[j][i] * 
            Math.sin(receptorPhases[j] - ligandPhases[i]);
        }
        
        ligandPhases[i] += dPhase * this.options.dt;
      }
      
      // Record trajectory
      if (step % 10 === 0) {
        trajectory.push({
          step,
          interSystemCoherence: this.calculateCoherence(receptorPhases, ligandPhases),
          receptorOrder: this.calculateOrder(receptorPhases),
          ligandOrder: this.calculateOrder(ligandPhases)
        });
      }
    }
    
    // Extract final pose from phases
    const pose = this.phasesToPose(receptorPhases, ligandPhases);
    
    // Calculate final binding score
    const bindingScore = this.calculateBindingFromPhases(
      receptorPhases, ligandPhases, crossCoupling
    );
    
    return {
      success: true,
      receptorPhases: [...receptorPhases],
      ligandPhases: [...ligandPhases],
      pose,
      dockingScore: bindingScore,
      finalCoherence: trajectory[trajectory.length - 1]?.interSystemCoherence || 0,
      trajectory
    };
  }
  
  /**
   * Compute cross-coupling between two molecules
   */
  computeCrossCoupling(primes1, primes2) {
    const matrix = [];
    
    for (let i = 0; i < primes1.length; i++) {
      const row = [];
      for (let j = 0; j < primes2.length; j++) {
        const resonance = calculateResonance(primes1[i], primes2[j]);
        row.push(resonance * this.options.coupling);
      }
      matrix.push(row);
    }
    
    return matrix;
  }
  
  /**
   * Calculate inter-system coherence
   */
  calculateCoherence(phases1, phases2) {
    let coherence = 0;
    let count = 0;
    
    for (const p1 of phases1) {
      for (const p2 of phases2) {
        coherence += Math.cos(p1 - p2);
        count++;
      }
    }
    
    return Math.abs(coherence / count);
  }
  
  /**
   * Calculate order parameter for one system
   */
  calculateOrder(phases) {
    let sumCos = 0, sumSin = 0;
    for (const p of phases) {
      sumCos += Math.cos(p);
      sumSin += Math.sin(p);
    }
    return Math.sqrt(sumCos * sumCos + sumSin * sumSin) / phases.length;
  }
  
  /**
   * Convert phases to binding pose
   */
  phasesToPose(receptorPhases, ligandPhases) {
    // Phase differences indicate relative orientations
    const meanReceptorPhase = receptorPhases.reduce((a, b) => a + b, 0) / receptorPhases.length;
    const meanLigandPhase = ligandPhases.reduce((a, b) => a + b, 0) / ligandPhases.length;
    
    return {
      rotation: (meanLigandPhase - meanReceptorPhase) * 180 / Math.PI,
      bindingMode: Math.abs(meanLigandPhase - meanReceptorPhase) < 0.5 ? 'aligned' : 'rotated'
    };
  }
  
  /**
   * Calculate binding from final phases
   */
  calculateBindingFromPhases(phases1, phases2, coupling) {
    let score = 0;
    
    for (let i = 0; i < phases1.length; i++) {
      for (let j = 0; j < phases2.length; j++) {
        const phaseDiff = Math.abs(phases1[i] - phases2[j]);
        const inPhase = Math.cos(phaseDiff);
        score += coupling[i][j] * (1 + inPhase) / 2;
      }
    }
    
    return score / (phases1.length * phases2.length);
  }
}

/**
 * ProteinProteinDocker
 * Specialized docker for protein-protein interactions
 */
class ProteinProteinDocker extends MolecularDocker {
  constructor(options = {}) {
    super({
      ...options,
      coupling: options.coupling || 0.15,
      steps: options.steps || 1000
    });
  }
  
  /**
   * Dock with interface prediction
   */
  dockWithInterface(protein1Primes, protein2Primes) {
    // First, predict interface residues
    const interface1 = this.predictInterface(protein1Primes);
    const interface2 = this.predictInterface(protein2Primes);
    
    // Dock using interface residues
    const dockResult = this.dock(
      interface1.map(i => protein1Primes[i]),
      interface2.map(i => protein2Primes[i])
    );
    
    return {
      ...dockResult,
      interface1,
      interface2,
      contactMap: this.buildContactMap(
        dockResult.receptorPhases, 
        dockResult.ligandPhases,
        interface1,
        interface2
      )
    };
  }
  
  /**
   * Predict interface residues (surface exposed, interactive)
   */
  predictInterface(primes) {
    // Interface residues tend to be:
    // 1. Charged (for electrostatic interactions)
    // 2. Aromatic (for stacking interactions)
    // 3. At certain sequence positions
    
    const candidates = [];
    
    for (let i = 0; i < primes.length; i++) {
      const p = primes[i];
      const charge = getChargeFromPrime(p);
      const isAromatic = [47, 53, 59, 97].includes(p);  // F, W, Y, H
      
      let interfaceScore = 0;
      if (Math.abs(charge) > 0) interfaceScore += 0.5;
      if (isAromatic) interfaceScore += 0.3;
      
      // Check neighbors for hydrophobic patches
      const neighbors = primes.slice(Math.max(0, i - 2), i + 3);
      const hydrophobicPatch = neighbors.filter(p => p >= 23 && p <= 43).length >= 3;
      if (hydrophobicPatch) interfaceScore += 0.2;
      
      if (interfaceScore > 0.3) {
        candidates.push(i);
      }
    }
    
    return candidates;
  }
  
  /**
   * Build contact map from docking
   */
  buildContactMap(phases1, phases2, indices1, indices2) {
    const contacts = [];
    
    for (let i = 0; i < phases1.length; i++) {
      for (let j = 0; j < phases2.length; j++) {
        const phaseDiff = Math.abs(phases1[i] - phases2[j]);
        if (phaseDiff < 0.5 || phaseDiff > 2 * Math.PI - 0.5) {
          contacts.push({
            residue1: indices1[i],
            residue2: indices2[j],
            strength: 1 - Math.min(phaseDiff, 2 * Math.PI - phaseDiff) / 0.5
          });
        }
      }
    }
    
    return contacts;
  }
}

export {
    BindingAffinityCalculator,
    MolecularDocker,
    ProteinProteinDocker
};

export default {
    BindingAffinityCalculator,
    MolecularDocker,
    ProteinProteinDocker
};