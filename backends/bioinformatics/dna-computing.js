/**
 * DNA Computing Module
 * 
 * Implements DNA-based computation using strand displacement reactions
 * and molecular logic gates. Based on the prime-resonance paradigm where:
 * 
 * - DNA strands are prime sequences
 * - Hybridization = prime product (complementary bases multiply)
 * - Strand displacement = prime substitution transform
 * - Logic gates = prime-based conditional operations
 * 
 * References:
 * - Seelig et al. (2006) - DNA logic circuits
 * - Zhang & Winfree (2009) - Strand displacement cascades
 * - Qian & Winfree (2011) - Seesaw gates
 */

import {  NUCLEOTIDE_PRIMES, 
  PRIME_COMPLEMENTS, 
  encodeDNA, 
  decodeDNA  } from './encoding.js';

// ============================================================================
// DNA Strand Representation
// ============================================================================

/**
 * DNAStrand - represents a single-stranded DNA molecule
 */
class DNAStrand {
  constructor(sequence, options = {}) {
    this.sequence = sequence.toUpperCase();
    this.primes = encodeDNA(this.sequence);
    this.name = options.name || '';
    this.concentration = options.concentration || 1.0;
    this.toehold = options.toehold || null;  // Toehold region for strand displacement
  }
  
  /**
   * Get the Watson-Crick complement
   */
  complement() {
    const compSeq = this.sequence.split('').map(n => {
      const comps = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
      return comps[n] || n;
    }).join('');
    
    return new DNAStrand(compSeq, { name: `${this.name}'` });
  }
  
  /**
   * Get the reverse complement (for double helix formation)
   */
  reverseComplement() {
    return new DNAStrand(
      this.complement().sequence.split('').reverse().join(''),
      { name: `${this.name}*` }
    );
  }
  
  /**
   * Calculate binding affinity (free energy) with another strand
   * Uses prime resonance for thermodynamic estimation
   */
  bindingAffinity(other) {
    const minLen = Math.min(this.primes.length, other.primes.length);
    let affinity = 0;
    let matches = 0;
    
    for (let i = 0; i < minLen; i++) {
      const p1 = this.primes[i];
      const p2 = other.primes[i];
      
      // Perfect complement: product is fixed (14 for A-T, 33 for G-C)
      if (PRIME_COMPLEMENTS[p1] === p2) {
        affinity += 1.0;
        matches++;
      } else if (p1 === p2) {
        // Same base: mismatch penalty
        affinity -= 0.5;
      }
    }
    
    return {
      affinity,
      matchFraction: matches / minLen,
      meltingTemp: this.estimateMeltingTemp(matches, minLen)
    };
  }
  
  /**
   * Estimate melting temperature using nearest-neighbor model
   */
  estimateMeltingTemp(matches, length) {
    // Simplified Tm estimation
    // Real calculation would use ΔH and ΔS from nearest-neighbor parameters
    const gcContent = (this.sequence.match(/[GC]/g) || []).length / length;
    const Tm = 64.9 + 41 * (gcContent - 0.5) + 16.6 * Math.log10(0.05);
    return Tm * (matches / length);  // Adjust for mismatches
  }
  
  /**
   * Check if this strand can displace another from a duplex
   */
  canDisplace(incumbent, template) {
    // Strand displacement requires:
    // 1. A toehold region on the template
    // 2. Higher affinity than incumbent
    
    const myAffinity = this.bindingAffinity(template);
    const theirAffinity = incumbent.bindingAffinity(template);
    
    return myAffinity.affinity > theirAffinity.affinity;
  }
  
  /**
   * Prime product representation (for hybridized duplex)
   */
  primeProduct(other) {
    const minLen = Math.min(this.primes.length, other.primes.length);
    return this.primes.slice(0, minLen).map((p, i) => p * other.primes[i]);
  }
  
  /**
   * Get length
   */
  get length() {
    return this.sequence.length;
  }
  
  toString() {
    return `5'-${this.sequence}-3'`;
  }
}

/**
 * DNADuplex - represents a double-stranded DNA molecule
 */
class DNADuplex {
  constructor(strand1, strand2, options = {}) {
    this.strand1 = strand1;  // Top strand (5' → 3')
    this.strand2 = strand2;  // Bottom strand (3' → 5')
    this.name = options.name || '';
    this.toeholdRegion = options.toehold || null;
  }
  
  /**
   * Check if duplex is stable (complementary)
   */
  isStable() {
    const affinity = this.strand1.bindingAffinity(this.strand2.reverseComplement());
    return affinity.matchFraction > 0.8;
  }
  
  /**
   * Prime signature of the duplex
   */
  get primeSignature() {
    return this.strand1.primeProduct(this.strand2.reverseComplement());
  }
}

// ============================================================================
// DNA Logic Gates
// ============================================================================

/**
 * AND Gate
 * Output is high only when both inputs are present
 * 
 * Implementation: Two-input strand displacement
 * Input1 + Input2 + Gate → Output + Waste
 */
class ANDGate {
  constructor(options = {}) {
    this.name = options.name || 'AND';
    this.threshold = options.threshold || 0.5;
    
    // Gate strands (templates)
    this.input1Binding = options.input1Binding || 'ATCGATCG';
    this.input2Binding = options.input2Binding || 'GCTAGCTA';
    this.outputSequence = options.output || 'TTCCAAGG';
    
    // Convert to prime representation
    this.input1Primes = encodeDNA(this.input1Binding);
    this.input2Primes = encodeDNA(this.input2Binding);
    this.outputPrimes = encodeDNA(this.outputSequence);
  }
  
  /**
   * Evaluate gate with given input concentrations
   */
  evaluate(input1Conc, input2Conc) {
    // Both inputs must exceed threshold
    const active = input1Conc >= this.threshold && input2Conc >= this.threshold;
    const outputConc = active ? Math.min(input1Conc, input2Conc) : 0;
    
    return {
      output: active,
      concentration: outputConc,
      outputPrimes: active ? this.outputPrimes : []
    };
  }
  
  /**
   * Prime-based evaluation
   */
  evaluatePrimes(input1Primes, input2Primes) {
    // Check if inputs match expected patterns
    const match1 = this.primesMatch(input1Primes, this.input1Primes);
    const match2 = this.primesMatch(input2Primes, this.input2Primes);
    
    return {
      output: match1 && match2,
      outputPrimes: (match1 && match2) ? this.outputPrimes : [],
      matchScores: { input1: match1, input2: match2 }
    };
  }
  
  primesMatch(primes1, primes2, threshold = 0.8) {
    if (primes1.length !== primes2.length) return false;
    const matches = primes1.filter((p, i) => p === primes2[i]).length;
    return matches / primes1.length >= threshold;
  }
}

/**
 * OR Gate
 * Output is high when either input is present
 */
class ORGate {
  constructor(options = {}) {
    this.name = options.name || 'OR';
    this.threshold = options.threshold || 0.5;
    
    this.input1Binding = options.input1Binding || 'ATCGATCG';
    this.input2Binding = options.input2Binding || 'GCTAGCTA';
    this.outputSequence = options.output || 'TTCCAAGG';
    
    this.input1Primes = encodeDNA(this.input1Binding);
    this.input2Primes = encodeDNA(this.input2Binding);
    this.outputPrimes = encodeDNA(this.outputSequence);
  }
  
  evaluate(input1Conc, input2Conc) {
    const active = input1Conc >= this.threshold || input2Conc >= this.threshold;
    const outputConc = active ? Math.max(input1Conc, input2Conc) : 0;
    
    return {
      output: active,
      concentration: outputConc,
      outputPrimes: active ? this.outputPrimes : []
    };
  }
  
  evaluatePrimes(input1Primes, input2Primes) {
    const match1 = this.primesMatch(input1Primes, this.input1Primes);
    const match2 = this.primesMatch(input2Primes, this.input2Primes);
    
    return {
      output: match1 || match2,
      outputPrimes: (match1 || match2) ? this.outputPrimes : [],
      matchScores: { input1: match1, input2: match2 }
    };
  }
  
  primesMatch(primes1, primes2, threshold = 0.8) {
    if (primes1.length !== primes2.length) return false;
    const matches = primes1.filter((p, i) => p === primes2[i]).length;
    return matches / primes1.length >= threshold;
  }
}

/**
 * NOT Gate (Inverter)
 * Output is high when input is absent
 */
class NOTGate {
  constructor(options = {}) {
    this.name = options.name || 'NOT';
    this.threshold = options.threshold || 0.5;
    this.decayRate = options.decayRate || 0.1;
    
    this.inputBinding = options.inputBinding || 'ATCGATCG';
    this.outputSequence = options.output || 'TTCCAAGG';
    
    this.inputPrimes = encodeDNA(this.inputBinding);
    this.outputPrimes = encodeDNA(this.outputSequence);
    
    // NOT gate has a constitutive output that gets suppressed by input
    this.constitutiveOutput = 1.0;
  }
  
  evaluate(inputConc) {
    const active = inputConc < this.threshold;
    const outputConc = active ? this.constitutiveOutput * (1 - inputConc) : 0;
    
    return {
      output: active,
      concentration: outputConc,
      outputPrimes: active ? this.outputPrimes : []
    };
  }
  
  evaluatePrimes(inputPrimes) {
    const match = this.primesMatch(inputPrimes, this.inputPrimes);
    
    return {
      output: !match,
      outputPrimes: !match ? this.outputPrimes : [],
      matchScore: match
    };
  }
  
  primesMatch(primes1, primes2, threshold = 0.8) {
    if (!primes1 || primes1.length === 0) return false;
    if (primes1.length !== primes2.length) return false;
    const matches = primes1.filter((p, i) => p === primes2[i]).length;
    return matches / primes1.length >= threshold;
  }
}

/**
 * NAND Gate (Universal gate)
 */
class NANDGate {
  constructor(options = {}) {
    this.andGate = new ANDGate(options);
    this.notGate = new NOTGate({ ...options, inputBinding: options.output });
    this.name = options.name || 'NAND';
  }
  
  evaluate(input1Conc, input2Conc) {
    const andResult = this.andGate.evaluate(input1Conc, input2Conc);
    return this.notGate.evaluate(andResult.concentration);
  }
}

// ============================================================================
// Strand Displacement Reactions
// ============================================================================

/**
 * StrandDisplacementReaction
 * Models toehold-mediated strand displacement
 */
class StrandDisplacementReaction {
  constructor(options = {}) {
    this.template = options.template;        // The template strand
    this.incumbent = options.incumbent;      // Currently bound strand
    this.invader = options.invader;          // Displacing strand
    this.toehold = options.toehold || 6;     // Toehold length in nucleotides
    this.rate = options.rate || 1e6;         // Rate constant (M^-1 s^-1)
  }
  
  /**
   * Calculate displacement rate based on toehold binding
   */
  calculateRate() {
    // Rate depends on toehold binding strength
    const toeholdPrimes = this.template.primes.slice(0, this.toehold);
    const invaderToeholPrimes = this.invader.primes.slice(-this.toehold);
    
    let bindingStrength = 0;
    for (let i = 0; i < this.toehold; i++) {
      if (PRIME_COMPLEMENTS[toeholdPrimes[i]] === invaderToeholPrimes[i]) {
        bindingStrength += 1;
      }
    }
    
    // Rate scales exponentially with toehold binding
    return this.rate * Math.exp(bindingStrength - this.toehold);
  }
  
  /**
   * Simulate displacement reaction
   */
  simulate(time, dt = 0.001) {
    const rate = this.calculateRate();
    const steps = Math.floor(time / dt);
    
    let invaderConc = this.invader.concentration;
    let incumbentConc = this.incumbent.concentration;
    let templateConc = this.template.concentration;
    
    const history = [];
    
    for (let i = 0; i < steps; i++) {
      // Displacement kinetics (simplified second-order)
      const dDisplacement = rate * invaderConc * templateConc * dt;
      
      invaderConc -= dDisplacement;
      incumbentConc += dDisplacement;
      
      history.push({
        time: i * dt,
        invader: invaderConc,
        incumbent: incumbentConc,
        displaced: this.incumbent.concentration - incumbentConc
      });
    }
    
    return {
      finalInvaderConc: invaderConc,
      finalIncumbentConc: incumbentConc,
      displacementFraction: 1 - invaderConc / this.invader.concentration,
      history
    };
  }
}

// ============================================================================
// DNA Circuit
// ============================================================================

/**
 * DNACircuit - A network of connected DNA logic gates
 */
class DNACircuit {
  constructor(name = 'circuit') {
    this.name = name;
    this.gates = new Map();
    this.connections = [];
    this.inputs = new Map();
    this.outputs = new Map();
  }
  
  /**
   * Add a gate to the circuit
   */
  addGate(id, gate) {
    this.gates.set(id, gate);
    return this;
  }
  
  /**
   * Connect gate output to another gate input
   */
  connect(fromGateId, toGateId, inputSlot = 1) {
    this.connections.push({
      from: fromGateId,
      to: toGateId,
      slot: inputSlot
    });
    return this;
  }
  
  /**
   * Set circuit input
   */
  setInput(inputId, value) {
    this.inputs.set(inputId, value);
    return this;
  }
  
  /**
   * Evaluate the circuit
   */
  evaluate() {
    const gateOutputs = new Map();
    
    // Topological sort to determine evaluation order
    const order = this.topologicalSort();
    
    // Evaluate gates in order
    for (const gateId of order) {
      const gate = this.gates.get(gateId);
      
      // Get inputs for this gate
      const inputs = this.getGateInputs(gateId, gateOutputs);
      
      // Evaluate gate
      let result;
      if (gate instanceof ANDGate || gate instanceof ORGate || gate instanceof NANDGate) {
        result = gate.evaluate(inputs[0] || 0, inputs[1] || 0);
      } else if (gate instanceof NOTGate) {
        result = gate.evaluate(inputs[0] || 0);
      }
      
      gateOutputs.set(gateId, result);
    }
    
    return {
      outputs: Object.fromEntries(gateOutputs),
      finalOutput: gateOutputs.get([...this.gates.keys()].pop())
    };
  }
  
  /**
   * Get inputs for a gate from circuit inputs or upstream gate outputs
   */
  getGateInputs(gateId, gateOutputs) {
    const inputs = [
      this.inputs.get(`${gateId}_in1`),
      this.inputs.get(`${gateId}_in2`)
    ];
    
    // Check for connections from other gates
    for (const conn of this.connections) {
      if (conn.to === gateId) {
        const upstreamOutput = gateOutputs.get(conn.from);
        if (upstreamOutput) {
          inputs[conn.slot - 1] = upstreamOutput.concentration;
        }
      }
    }
    
    return inputs;
  }
  
  /**
   * Topological sort for gate evaluation order
   */
  topologicalSort() {
    const visited = new Set();
    const order = [];
    const gateIds = [...this.gates.keys()];
    
    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      // Visit dependencies first
      for (const conn of this.connections) {
        if (conn.to === id) {
          visit(conn.from);
        }
      }
      
      order.push(id);
    };
    
    for (const id of gateIds) {
      visit(id);
    }
    
    return order;
  }
  
  /**
   * Convert circuit to prime sequence representation
   */
  toPrimeCircuit() {
    return {
      gates: Object.fromEntries(
        [...this.gates.entries()].map(([id, gate]) => [
          id,
          {
            type: gate.constructor.name,
            inputPrimes: gate.input1Primes || gate.inputPrimes,
            outputPrimes: gate.outputPrimes
          }
        ])
      ),
      connections: this.connections
    };
  }
}

/**
 * Create common circuits
 */
function createHalfAdder() {
  const circuit = new DNACircuit('half-adder');
  
  // Sum = A XOR B = (A AND NOT B) OR (NOT A AND B)
  // Carry = A AND B
  
  circuit.addGate('and1', new ANDGate({ name: 'carry' }));
  circuit.addGate('not_a', new NOTGate({ name: 'not_a' }));
  circuit.addGate('not_b', new NOTGate({ name: 'not_b' }));
  circuit.addGate('and2', new ANDGate({ name: 'a_and_notb' }));
  circuit.addGate('and3', new ANDGate({ name: 'nota_and_b' }));
  circuit.addGate('or1', new ORGate({ name: 'sum' }));
  
  // XOR construction
  circuit.connect('not_a', 'and3', 1);
  circuit.connect('not_b', 'and2', 2);
  circuit.connect('and2', 'or1', 1);
  circuit.connect('and3', 'or1', 2);
  
  return circuit;
}

function createFullAdder() {
  const halfAdder1 = createHalfAdder();
  const halfAdder2 = createHalfAdder();
  
  const circuit = new DNACircuit('full-adder');
  
  // Full adder uses two half adders
  // S = A XOR B XOR Cin
  // Cout = (A AND B) OR (Cin AND (A XOR B))
  
  // This is a simplified representation
  circuit.addGate('xor1', new ANDGate({ name: 'xor1' }));  // Simplified
  circuit.addGate('xor2', new ANDGate({ name: 'xor2' }));
  circuit.addGate('and1', new ANDGate({ name: 'and1' }));
  circuit.addGate('and2', new ANDGate({ name: 'and2' }));
  circuit.addGate('or1', new ORGate({ name: 'cout' }));
  
  return circuit;
}

// ============================================================================
// Seesaw Gate (Qian & Winfree)
// ============================================================================

/**
 * SeesawGate - DNA strand displacement seesaw gate
 * Universal gate for digital circuit computation
 */
class SeesawGate {
  constructor(options = {}) {
    this.name = options.name || 'seesaw';
    this.threshold = options.threshold || 0.6;
    this.gain = options.gain || 1.0;
    
    // Gate state
    this.inputWeights = options.weights || [1.0];
    this.gateStrand = options.gateStrand || 'ATCGATCGATCG';
  }
  
  /**
   * Evaluate seesaw gate
   * Output = gain * (sum(weights * inputs) - threshold)
   */
  evaluate(inputs) {
    const weightedSum = inputs.reduce((sum, inp, i) => {
      return sum + (this.inputWeights[i] || 1.0) * inp;
    }, 0);
    
    const output = Math.max(0, this.gain * (weightedSum - this.threshold));
    
    return {
      output: Math.min(1, output),
      active: weightedSum > this.threshold,
      weightedSum
    };
  }
}

export {
    DNAStrand,
    DNADuplex,
    ANDGate,
    ORGate,
    NOTGate,
    NANDGate,
    SeesawGate,
    StrandDisplacementReaction,
    DNACircuit,
    createHalfAdder,
    createFullAdder
};

export default {
    DNAStrand,
    DNADuplex,
    ANDGate,
    ORGate,
    NOTGate,
    NANDGate,
    SeesawGate,
    StrandDisplacementReaction,
    DNACircuit,
    createHalfAdder,
    createFullAdder
};