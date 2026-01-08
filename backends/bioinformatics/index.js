/**
 * BioinformaticsBackend - Prime-based biological computation
 * 
 * A complete backend for bioinformatics within the tinyaleph framework.
 * Treats biological systems as prime-resonant information processors.
 * 
 * Features:
 * - DNA/RNA/Protein sequence encoding to primes
 * - Central Dogma transforms (transcription, translation)
 * - Protein folding via Kuramoto oscillator dynamics
 * - Molecular binding via prime resonance
 * - DNA computing (logic gates, strand displacement)
 */

const { Backend } = require('../interface');
const { Hypercomplex } = require('../../core/hypercomplex');
const { primeToFrequency } = require('../../core/prime');

// Import all submodules
const encoding = require('./encoding');
const geneticCode = require('./genetic-code');
const { TranscriptionOperator } = require('./transcription');
const { TranslationOperator } = require('./translation');
const { FoldingTransform } = require('./folding');
const dnaComputing = require('./dna-computing');
const binding = require('./binding');

/**
 * BioinformaticsBackend
 * 
 * Implements the Backend interface for biological computation.
 */
class BioinformaticsBackend extends Backend {
  constructor(config = {}) {
    super(config);
    
    this.dimension = config.dimension || 32;
    
    // Initialize encodings
    this.nucleotidePrimes = config.nucleotidePrimes || encoding.NUCLEOTIDE_PRIMES;
    this.aminoAcidPrimes = config.aminoAcidPrimes || encoding.AMINO_ACID_PRIMES;
    this.geneticCode = config.geneticCode || geneticCode.STANDARD_GENETIC_CODE;
    
    // Initialize operators
    this.transcription = new TranscriptionOperator(config.transcriptionOptions || {});
    this.translation = new TranslationOperator(this.geneticCode);
    this.folding = new FoldingTransform(config.foldingOptions || {});
    this.affinityCalculator = new binding.BindingAffinityCalculator(config.bindingOptions || {});
    this.docker = new binding.MolecularDocker(config.dockingOptions || {});
    
    // Build prime list (all biological primes)
    this.config.primes = this.buildPrimeList();
    
    // Build transform registry
    this.transforms = this.buildTransforms();
  }
  
  // ===========================================================================
  // Backend Interface Methods
  // ===========================================================================
  
  /**
   * Encode biological input to prime array
   * Accepts: DNA, RNA, Protein sequences, FASTA format
   */
  encode(input) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string sequence');
    }
    
    const inputType = encoding.detectSequenceType(input);
    
    switch (inputType) {
      case 'DNA':
        return encoding.encodeDNA(input);
      case 'RNA':
        return encoding.encodeRNA(input);
      case 'PROTEIN':
        return encoding.encodeProtein(input);
      case 'FASTA':
        return this.encodeFASTA(input);
      default:
        // Try each encoding and return first success
        const dna = encoding.encodeDNA(input);
        if (dna.length > 0) return dna;
        const protein = encoding.encodeProtein(input);
        if (protein.length > 0) return protein;
        throw new Error(`Cannot encode input: ${input.slice(0, 50)}...`);
    }
  }
  
  /**
   * Decode prime array back to biological sequence
   */
  decode(primes) {
    if (!primes || primes.length === 0) {
      return '';
    }
    
    // Detect sequence type from prime range
    const maxPrime = Math.max(...primes);
    const minPrime = Math.min(...primes);
    
    // Nucleotide range: 2, 3, 5, 7, 11
    if (maxPrime <= 11) {
      // Check if RNA (has U=5) or DNA
      if (primes.includes(5)) {
        return encoding.decodeRNA(primes);
      }
      return encoding.decodeDNA(primes);
    }
    
    // Amino acid range: 23-113
    if (minPrime >= 23) {
      return encoding.decodeProtein(primes);
    }
    
    // Mixed - try protein first
    return encoding.decodeProtein(primes);
  }
  
  /**
   * Convert primes to hypercomplex state vector
   */
  primesToState(primes) {
    const state = Hypercomplex.zero(this.dimension);
    
    if (!primes || primes.length === 0) {
      return state;
    }
    
    const n = primes.length;
    
    for (let i = 0; i < n; i++) {
      const p = primes[i];
      const idx = this.primeToIndex(p);
      
      // Phase encodes position in sequence
      const phase = (2 * Math.PI * i) / n;
      
      // Amplitude from prime value (normalized)
      const amplitude = 1 / Math.sqrt(p);
      
      // Distribute across components using phase encoding
      state.c[idx % this.dimension] += amplitude * Math.cos(phase);
      state.c[(idx + 1) % this.dimension] += amplitude * Math.sin(phase);
    }
    
    return state.normalize();
  }
  
  /**
   * Convert primes to oscillator frequencies
   */
  primesToFrequencies(primes) {
    return primes.map(p => primeToFrequency(p, 1, 10));
  }
  
  /**
   * Apply a biological transform
   */
  applyTransform(inputPrimes, transform) {
    switch (transform.type) {
      case 'transcription':
        return this.transcription.apply(inputPrimes);
        
      case 'translation':
        const translationResult = this.translation.apply(inputPrimes);
        return translationResult.success ? translationResult.protein : inputPrimes;
        
      case 'complement':
        return this.transcription.complement(inputPrimes);
        
      case 'reverse_complement':
        return this.transcription.reverseComplement(inputPrimes);
        
      case 'fold':
        const foldResult = this.folding.fold(inputPrimes);
        return foldResult.success ? foldResult.phases.map(p => Math.floor(p * 100)) : inputPrimes;
        
      case 'mutation':
        return this.applyMutation(inputPrimes, transform);
        
      default:
        return inputPrimes;
    }
  }
  
  /**
   * Get available transforms
   */
  getTransforms() {
    return this.transforms;
  }
  
  /**
   * Get prime list used by this backend
   */
  getPrimes() {
    return this.config.primes;
  }
  
  /**
   * Get backend name
   */
  getName() {
    return 'BioinformaticsBackend';
  }
  
  // ===========================================================================
  // Bioinformatics-Specific Methods
  // ===========================================================================
  
  /**
   * Full transcription: DNA → RNA
   */
  transcribe(dnaPrimes, options = {}) {
    return this.transcription.transcribe(dnaPrimes, options);
  }
  
  /**
   * Full translation: RNA → Protein
   */
  translate(rnaPrimes, options = {}) {
    return this.translation.apply(rnaPrimes, options);
  }
  
  /**
   * Express gene: DNA → RNA → Protein (full Central Dogma)
   */
  express(dnaPrimes, options = {}) {
    // Transcribe
    const rnaResult = this.transcription.transcribe(dnaPrimes, { force: true, ...options });
    const rnaPrimes = rnaResult.success ? rnaResult.rna : this.transcription.apply(dnaPrimes);
    
    // Translate
    const proteinResult = this.translation.apply(rnaPrimes, options);
    
    return {
      success: proteinResult.success,
      dna: dnaPrimes,
      rna: rnaPrimes,
      protein: proteinResult.protein,
      length: proteinResult.length,
      sequence: this.decode(proteinResult.protein)
    };
  }
  
  /**
   * Fold protein: Protein primes → 3D structure
   */
  foldProtein(proteinPrimes, options = {}) {
    return this.folding.fold(proteinPrimes);
  }
  
  /**
   * Compute binding affinity between two molecules
   */
  bindingAffinity(mol1Primes, mol2Primes) {
    return this.affinityCalculator.computeAffinity(mol1Primes, mol2Primes);
  }
  
  /**
   * Dock two molecules
   */
  dock(receptorPrimes, ligandPrimes) {
    return this.docker.dock(receptorPrimes, ligandPrimes);
  }
  
  /**
   * Screen ligand library
   */
  screenLigands(targetPrimes, ligandLibrary) {
    return this.affinityCalculator.screenLibrary(targetPrimes, ligandLibrary);
  }
  
  /**
   * Calculate sequence similarity using prime resonance
   */
  similarity(primes1, primes2) {
    const state1 = this.primesToState(primes1);
    const state2 = this.primesToState(primes2);
    
    // Coherence as similarity measure
    const n1 = state1.norm();
    const n2 = state2.norm();
    
    if (n1 < 1e-10 || n2 < 1e-10) return 0;
    
    return Math.abs(state1.dot(state2)) / (n1 * n2);
  }
  
  /**
   * Align two sequences using oscillator synchronization
   */
  align(primes1, primes2) {
    const freq1 = this.primesToFrequencies(primes1);
    const freq2 = this.primesToFrequencies(primes2);
    
    // Simple alignment score based on frequency overlap
    let alignmentScore = 0;
    const minLen = Math.min(freq1.length, freq2.length);
    
    for (let i = 0; i < minLen; i++) {
      const diff = Math.abs(freq1[i] - freq2[i]);
      alignmentScore += 1 / (1 + diff);
    }
    
    return {
      score: alignmentScore / minLen,
      length: minLen,
      similarity: this.similarity(primes1, primes2)
    };
  }
  
  // ===========================================================================
  // DNA Computing Methods
  // ===========================================================================
  
  /**
   * Create DNA strand
   */
  createDNAStrand(sequence, options = {}) {
    return new dnaComputing.DNAStrand(sequence, options);
  }
  
  /**
   * Create AND gate
   */
  createANDGate(options = {}) {
    return new dnaComputing.ANDGate(options);
  }
  
  /**
   * Create OR gate
   */
  createORGate(options = {}) {
    return new dnaComputing.ORGate(options);
  }
  
  /**
   * Create NOT gate
   */
  createNOTGate(options = {}) {
    return new dnaComputing.NOTGate(options);
  }
  
  /**
   * Create DNA circuit
   */
  createCircuit(name = 'circuit') {
    return new dnaComputing.DNACircuit(name);
  }
  
  /**
   * Simulate strand displacement
   */
  simulateStrandDisplacement(options) {
    const reaction = new dnaComputing.StrandDisplacementReaction(options);
    return reaction.simulate(options.time || 1.0, options.dt || 0.001);
  }
  
  // ===========================================================================
  // Helper Methods
  // ===========================================================================
  
  /**
   * Map prime to dimension index
   */
  primeToIndex(prime) {
    const primeList = this.config.primes;
    const idx = primeList.indexOf(prime);
    return idx >= 0 ? idx : prime % this.dimension;
  }
  
  /**
   * Build combined prime list
   */
  buildPrimeList() {
    const primes = new Set();
    
    // Add nucleotide primes
    Object.values(encoding.NUCLEOTIDE_PRIMES).forEach(p => primes.add(p));
    
    // Add amino acid primes
    Object.values(encoding.AMINO_ACID_PRIMES).forEach(p => primes.add(p));
    
    return [...primes].sort((a, b) => a - b);
  }
  
  /**
   * Build transform registry
   */
  buildTransforms() {
    return [
      { type: 'transcription', name: 'DNA→RNA', n: 'transcription' },
      { type: 'translation', name: 'RNA→Protein', n: 'translation' },
      { type: 'complement', name: 'DNA complement', n: 'complement' },
      { type: 'reverse_complement', name: 'Reverse complement', n: 'reverse_complement' },
      { type: 'fold', name: 'Protein folding', n: 'fold' },
      { type: 'mutation', mutationType: 'point', name: 'Point mutation', n: 'point_mutation' },
      { type: 'mutation', mutationType: 'insertion', name: 'Insertion', n: 'insertion' },
      { type: 'mutation', mutationType: 'deletion', name: 'Deletion', n: 'deletion' },
    ];
  }
  
  /**
   * Apply mutation transform
   */
  applyMutation(primes, transform) {
    const pos = transform.position || 0;
    
    switch (transform.mutationType) {
      case 'point':
        const newPrimes = [...primes];
        if (pos < newPrimes.length) {
          newPrimes[pos] = transform.value || this.nucleotidePrimes['A'];
        }
        return newPrimes;
        
      case 'insertion':
        const insertPrimes = transform.insertPrimes || [this.nucleotidePrimes['A']];
        return [
          ...primes.slice(0, pos),
          ...insertPrimes,
          ...primes.slice(pos)
        ];
        
      case 'deletion':
        const deleteLength = transform.length || 1;
        return [
          ...primes.slice(0, pos),
          ...primes.slice(pos + deleteLength)
        ];
        
      default:
        return primes;
    }
  }
  
  /**
   * Encode FASTA format
   */
  encodeFASTA(input) {
    const entries = encoding.parseFASTA(input);
    
    if (entries.length === 0) {
      throw new Error('Invalid FASTA format');
    }
    
    // Encode first entry
    const entry = entries[0];
    const type = encoding.detectSequenceType(entry.sequence);
    
    switch (type) {
      case 'DNA':
        return encoding.encodeDNA(entry.sequence);
      case 'RNA':
        return encoding.encodeRNA(entry.sequence);
      case 'PROTEIN':
        return encoding.encodeProtein(entry.sequence);
      default:
        return encoding.encodeDNA(entry.sequence);
    }
  }
  
  /**
   * Get amino acid properties
   */
  getAminoAcidProperties(aa) {
    return encoding.getAminoAcidProperties(aa);
  }
  
  /**
   * Get codon usage statistics
   */
  calculateCAI(sequence) {
    return geneticCode.calculateCAI(sequence);
  }
  
  /**
   * Get GC content
   */
  calculateGCContent(sequence) {
    return geneticCode.calculateGCContent(sequence);
  }
}

// Export everything
module.exports = {
  // Main backend
  BioinformaticsBackend,
  
  // Encoding
  ...encoding,
  
  // Genetic code
  ...geneticCode,
  
  // Operators
  TranscriptionOperator,
  TranslationOperator,
  FoldingTransform,
  
  // Binding
  BindingAffinityCalculator: binding.BindingAffinityCalculator,
  MolecularDocker: binding.MolecularDocker,
  ProteinProteinDocker: binding.ProteinProteinDocker,
  
  // DNA Computing
  DNAStrand: dnaComputing.DNAStrand,
  DNADuplex: dnaComputing.DNADuplex,
  ANDGate: dnaComputing.ANDGate,
  ORGate: dnaComputing.ORGate,
  NOTGate: dnaComputing.NOTGate,
  NANDGate: dnaComputing.NANDGate,
  SeesawGate: dnaComputing.SeesawGate,
  StrandDisplacementReaction: dnaComputing.StrandDisplacementReaction,
  DNACircuit: dnaComputing.DNACircuit,
  createHalfAdder: dnaComputing.createHalfAdder,
  createFullAdder: dnaComputing.createFullAdder,
};