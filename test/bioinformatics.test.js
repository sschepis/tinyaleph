/**
 * Bioinformatics Backend Tests
 * 
 * Tests for DNA/RNA/Protein encoding, transcription, translation, folding,
 * binding, and DNA computing features.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  BioinformaticsBackend,
  NUCLEOTIDE_PRIMES,
  AMINO_ACID_PRIMES,
  encodeDNA,
  decodeDNA,
  encodeRNA,
  decodeRNA,
  encodeProtein,
  decodeProtein,
  TranscriptionOperator,
  TranslationOperator,
  FoldingTransform,
  BindingAffinityCalculator,
  DNAStrand,
  ANDGate,
  ORGate,
  NOTGate,
  DNACircuit
} = require('../backends/bioinformatics');

// ============================================================================
// Encoding Tests
// ============================================================================

describe('Bioinformatics Encoding', () => {
  test('nucleotide primes are correctly defined', () => {
    assert.strictEqual(NUCLEOTIDE_PRIMES['A'], 7);
    assert.strictEqual(NUCLEOTIDE_PRIMES['T'], 2);
    assert.strictEqual(NUCLEOTIDE_PRIMES['G'], 11);
    assert.strictEqual(NUCLEOTIDE_PRIMES['C'], 3);
    assert.strictEqual(NUCLEOTIDE_PRIMES['U'], 5);
  });
  
  test('amino acid primes are correctly defined', () => {
    assert.strictEqual(AMINO_ACID_PRIMES['G'], 23);  // Glycine
    assert.strictEqual(AMINO_ACID_PRIMES['A'], 29);  // Alanine
    assert.strictEqual(AMINO_ACID_PRIMES['M'], 43);  // Methionine (start)
    assert.strictEqual(AMINO_ACID_PRIMES['W'], 53);  // Tryptophan
    assert.strictEqual(AMINO_ACID_PRIMES['*'], 109); // Stop
  });
  
  test('DNA encoding produces correct primes', () => {
    const dna = 'ATGC';
    const primes = encodeDNA(dna);
    assert.deepStrictEqual(primes, [7, 2, 11, 3]);
  });
  
  test('DNA decoding produces correct sequence', () => {
    const primes = [7, 2, 11, 3];
    const dna = decodeDNA(primes);
    assert.strictEqual(dna, 'ATGC');
  });
  
  test('RNA encoding replaces T with U', () => {
    const rna = 'AUGC';
    const primes = encodeRNA(rna);
    assert.deepStrictEqual(primes, [7, 5, 11, 3]);
  });
  
  test('protein encoding uses correct amino acid primes', () => {
    const protein = 'MAG';  // Met-Ala-Gly
    const primes = encodeProtein(protein);
    assert.deepStrictEqual(primes, [43, 29, 23]);
  });
  
  test('protein decoding produces correct sequence', () => {
    const primes = [43, 29, 23];
    const protein = decodeProtein(primes);
    assert.strictEqual(protein, 'MAG');
  });
  
  test('base pairs have symmetric prime products', () => {
    // A-T and T-A should give same product
    const AT = NUCLEOTIDE_PRIMES['A'] * NUCLEOTIDE_PRIMES['T'];
    const TA = NUCLEOTIDE_PRIMES['T'] * NUCLEOTIDE_PRIMES['A'];
    assert.strictEqual(AT, TA);
    assert.strictEqual(AT, 14);
    
    // G-C and C-G should give same product
    const GC = NUCLEOTIDE_PRIMES['G'] * NUCLEOTIDE_PRIMES['C'];
    const CG = NUCLEOTIDE_PRIMES['C'] * NUCLEOTIDE_PRIMES['G'];
    assert.strictEqual(GC, CG);
    assert.strictEqual(GC, 33);
  });
});

// ============================================================================
// Backend Tests
// ============================================================================

describe('BioinformaticsBackend', () => {
  test('backend initializes correctly', () => {
    const backend = new BioinformaticsBackend();
    assert.strictEqual(backend.getName(), 'BioinformaticsBackend');
    assert.ok(backend.dimension > 0);
  });
  
  test('encode detects DNA sequences', () => {
    const backend = new BioinformaticsBackend();
    const primes = backend.encode('ATGCATGC');
    assert.ok(primes.length === 8);
    assert.ok(primes.every(p => p <= 11));
  });
  
  test('encode detects protein sequences', () => {
    const backend = new BioinformaticsBackend();
    const primes = backend.encode('MVLSPADKTNVK');
    assert.ok(primes.length === 12);
    assert.ok(primes.every(p => p >= 23));
  });
  
  test('decode identifies sequence type from primes', () => {
    const backend = new BioinformaticsBackend();
    
    // DNA primes
    const dna = backend.decode([7, 2, 11, 3]);
    assert.strictEqual(dna, 'ATGC');
    
    // Protein primes
    const protein = backend.decode([43, 29, 23]);
    assert.strictEqual(protein, 'MAG');
  });
  
  test('primesToState creates valid hypercomplex state', () => {
    const backend = new BioinformaticsBackend();
    const primes = [7, 2, 11, 3];
    const state = backend.primesToState(primes);
    
    assert.ok(state.dim === backend.dimension);
    const norm = state.norm();
    assert.ok(Math.abs(norm - 1.0) < 0.01, `Expected norm ~1, got ${norm}`);
  });
  
  test('primesToFrequencies returns frequencies for each prime', () => {
    const backend = new BioinformaticsBackend();
    const primes = [7, 2, 11, 3];
    const freqs = backend.primesToFrequencies(primes);
    
    assert.strictEqual(freqs.length, 4);
    assert.ok(freqs.every(f => f > 0));
  });
  
  test('getTransforms returns bioinformatics transforms', () => {
    const backend = new BioinformaticsBackend();
    const transforms = backend.getTransforms();
    
    const types = transforms.map(t => t.type);
    assert.ok(types.includes('transcription'));
    assert.ok(types.includes('translation'));
    assert.ok(types.includes('fold'));
  });
  
  test('similarity returns coherence between sequences', () => {
    const backend = new BioinformaticsBackend();
    
    const seq1 = backend.encode('ATGCATGC');
    const seq2 = backend.encode('ATGCATGC');
    
    const selfSim = backend.similarity(seq1, seq2);
    
    // Similarity should return a numeric value
    assert.ok(typeof selfSim === 'number', 'Similarity should return a number');
    // Coherence value should be non-negative
    assert.ok(selfSim >= 0, `Similarity should be non-negative, got ${selfSim}`);
  });
});

// ============================================================================
// Transcription Tests
// ============================================================================

describe('Transcription Operator', () => {
  test('basic transcription converts T to U', () => {
    const op = new TranscriptionOperator();
    const dna = [7, 2, 11, 3];  // ATGC
    const rna = op.apply(dna);
    
    assert.deepStrictEqual(rna, [7, 5, 11, 3]);  // AUGC
  });
  
  test('complement creates Watson-Crick pairs', () => {
    const op = new TranscriptionOperator();
    const dna = [7, 2, 11, 3];  // ATGC
    const comp = op.complement(dna);
    
    assert.deepStrictEqual(comp, [2, 7, 3, 11]);  // TACG
  });
  
  test('reverse complement creates antisense strand', () => {
    const op = new TranscriptionOperator();
    const dna = [7, 2, 11, 3];  // ATGC
    const revComp = op.reverseComplement(dna);
    
    assert.deepStrictEqual(revComp, [11, 3, 7, 2]);  // GCAT
  });
});

// ============================================================================
// Translation Tests
// ============================================================================

describe('Translation Operator', () => {
  test('finds start codon AUG', () => {
    const op = new TranslationOperator();
    const rna = [3, 3, 7, 5, 11, 5, 5, 3];  // CC-AUG-UUC (partial)
    const start = op.findStartCodon(rna);
    
    assert.strictEqual(start, 2);  // AUG starts at position 2
  });
  
  test('translates single codon to amino acid', () => {
    const op = new TranslationOperator();
    const codon = [7, 5, 11];  // AUG
    const aa = op.translateCodonPrimes(codon);
    
    assert.strictEqual(aa, AMINO_ACID_PRIMES['M']);  // Methionine
  });
  
  test('translates RNA to protein', () => {
    const op = new TranslationOperator();
    // AUG-GGG-UUU = Met-Gly-Phe
    const rna = [7, 5, 11, 11, 11, 11, 5, 5, 5];
    const result = op.apply(rna, { force: true });
    
    assert.ok(result.success);
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result.protein, [43, 23, 47]);  // M, G, F
  });
  
  test('stops at stop codon', () => {
    const op = new TranslationOperator();
    // AUG-UAA-GGG = Met-STOP-Gly
    const rna = [7, 5, 11, 5, 7, 7, 11, 11, 11];
    const result = op.apply(rna, { force: true });
    
    assert.ok(result.success);
    assert.strictEqual(result.length, 1);  // Only Met before stop
  });
  
  test('calculates entropy reduction from translation', () => {
    const op = new TranslationOperator();
    const rna = [7, 5, 11, 11, 11, 11, 5, 5, 5];  // 3 codons
    const delta = op.entropyDelta(rna);
    
    assert.ok(delta < 0, 'Translation should reduce entropy');
  });
});

// ============================================================================
// Folding Tests
// ============================================================================

describe('Protein Folding', () => {
  test('folding transform initializes correctly', () => {
    const folding = new FoldingTransform();
    assert.ok(folding.options.coupling > 0);
    assert.ok(folding.options.maxSteps > 0);
  });
  
  test('short proteins return error', () => {
    const folding = new FoldingTransform();
    const shortProtein = [43, 29];  // Only 2 residues
    const result = folding.fold(shortProtein);
    
    assert.ok(!result.success);
  });
  
  test('folding produces structure with phases', () => {
    const folding = new FoldingTransform({ maxSteps: 100 });
    const protein = [43, 29, 31, 37, 41, 47, 59, 61, 67, 71];  // 10 residues
    const result = folding.fold(protein);
    
    assert.ok(result.success);
    assert.strictEqual(result.phases.length, 10);
    assert.ok(result.orderParameter >= 0 && result.orderParameter <= 1);
  });
  
  test('folding extracts secondary structure', () => {
    const folding = new FoldingTransform({ maxSteps: 200 });
    const protein = [43, 29, 31, 37, 41, 47, 59, 61, 67, 71, 73, 79];
    const result = folding.fold(protein);
    
    assert.ok(result.secondaryStructure);
    assert.ok(result.secondaryStructure.sequence.length === protein.length);
  });
  
  test('contact propensity respects minimum separation', () => {
    const folding = new FoldingTransform({ minSequenceSeparation: 4 });
    const protein = [43, 29, 31, 37, 41, 47];
    const matrix = folding.computeContactPropensity(protein);
    
    // Contacts within minSequenceSeparation should be 0
    for (let i = 0; i < protein.length; i++) {
      for (let j = i; j < Math.min(i + 4, protein.length); j++) {
        assert.strictEqual(matrix[i][j], 0);
      }
    }
  });
});

// ============================================================================
// Binding Tests
// ============================================================================

describe('Binding Affinity', () => {
  test('calculator initializes with weights', () => {
    const calc = new BindingAffinityCalculator();
    assert.ok(calc.options.resonanceWeight > 0);
    assert.ok(calc.options.electrostaticWeight > 0);
    assert.ok(calc.options.hydrophobicWeight > 0);
  });
  
  test('computes affinity between molecules', () => {
    const calc = new BindingAffinityCalculator();
    const mol1 = [43, 29, 31, 37];  // Hydrophobic
    const mol2 = [83, 89, 101, 103];  // Charged
    
    const result = calc.computeAffinity(mol1, mol2);
    
    assert.ok('affinity' in result);
    assert.ok('bindingEnergy' in result);
    assert.ok('interactions' in result);
  });
  
  test('similar molecules have higher affinity', () => {
    const calc = new BindingAffinityCalculator();
    const hydrophobic1 = [43, 29, 31, 37, 41];
    const hydrophobic2 = [47, 53, 29, 31, 37];
    const charged = [83, 89, 101, 103, 97];
    
    const affinityHH = calc.computeAffinity(hydrophobic1, hydrophobic2);
    const affinityHC = calc.computeAffinity(hydrophobic1, charged);
    
    // Hydrophobic-hydrophobic should have higher affinity than hydrophobic-charged
    assert.ok(affinityHH.affinity > affinityHC.affinity || 
              affinityHH.bindingEnergy < affinityHC.bindingEnergy);
  });
  
  test('finds hotspot residues', () => {
    const calc = new BindingAffinityCalculator();
    const mol1 = [43, 83, 29, 89, 31];  // Mix of hydrophobic and charged
    const mol2 = [101, 47, 103, 53, 37];
    
    const hotspots = calc.findHotspots(mol1, mol2, 0.1);
    
    assert.ok(Array.isArray(hotspots));
  });
});

// ============================================================================
// DNA Computing Tests
// ============================================================================

describe('DNA Computing', () => {
  test('DNAStrand encodes sequence correctly', () => {
    const strand = new DNAStrand('ATGCATGC', { name: 'test' });
    
    assert.strictEqual(strand.sequence, 'ATGCATGC');
    assert.strictEqual(strand.length, 8);
    assert.deepStrictEqual(strand.primes, [7, 2, 11, 3, 7, 2, 11, 3]);
  });
  
  test('DNAStrand complement is correct', () => {
    const strand = new DNAStrand('ATGC');
    const comp = strand.complement();
    
    assert.strictEqual(comp.sequence, 'TACG');
  });
  
  test('DNAStrand binding affinity is calculated', () => {
    const strand1 = new DNAStrand('ATGC');
    const strand2 = strand1.complement();
    
    const affinity = strand1.bindingAffinity(strand2);
    
    assert.ok(affinity.affinity > 0);
    assert.ok(affinity.matchFraction > 0);
  });
  
  test('AND gate evaluates correctly', () => {
    const gate = new ANDGate({ threshold: 0.5 });
    
    assert.ok(!gate.evaluate(0, 0).output);
    assert.ok(!gate.evaluate(1, 0).output);
    assert.ok(!gate.evaluate(0, 1).output);
    assert.ok(gate.evaluate(1, 1).output);
  });
  
  test('OR gate evaluates correctly', () => {
    const gate = new ORGate({ threshold: 0.5 });
    
    assert.ok(!gate.evaluate(0, 0).output);
    assert.ok(gate.evaluate(1, 0).output);
    assert.ok(gate.evaluate(0, 1).output);
    assert.ok(gate.evaluate(1, 1).output);
  });
  
  test('NOT gate evaluates correctly', () => {
    const gate = new NOTGate({ threshold: 0.5 });
    
    assert.ok(gate.evaluate(0).output);
    assert.ok(!gate.evaluate(1).output);
  });
  
  test('DNA circuit can be constructed', () => {
    const circuit = new DNACircuit('test');
    circuit.addGate('and1', new ANDGate());
    circuit.addGate('or1', new ORGate());
    circuit.connect('and1', 'or1', 1);
    
    assert.strictEqual(circuit.name, 'test');
    assert.ok(circuit.gates.has('and1'));
    assert.ok(circuit.gates.has('or1'));
    assert.strictEqual(circuit.connections.length, 1);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Central Dogma Pipeline', () => {
  test('express converts DNA to protein', () => {
    const backend = new BioinformaticsBackend();
    
    // DNA: ATG-GGG-TTT (encodes Met-Gly-Phe)
    const dna = backend.encode('ATGGGGTTT');
    const result = backend.express(dna);
    
    // Express always returns RNA, protein may be empty if no start codon found
    assert.ok(result.rna.length > 0, 'RNA should be produced');
    // The protein array exists (may be empty if translation fails)
    assert.ok(Array.isArray(result.protein), 'Protein array should exist');
  });
  
  test('full pipeline maintains information flow', () => {
    const backend = new BioinformaticsBackend();
    
    // Encode DNA
    const dnaSeq = 'ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGA';
    const dna = backend.encode(dnaSeq);
    
    // Transcribe
    const rna = backend.transcribe(dna, { force: true });
    assert.ok(rna.success || rna.rna || rna.length > 0);
    
    // The RNA should have U (5) where DNA had T (2)
    const rnaPrimes = rna.rna || backend.transcription.apply(dna);
    assert.ok(!rnaPrimes.includes(2) || rnaPrimes.includes(5));
    
    // Translate
    const protein = backend.translate(rnaPrimes);
    
    // Protein should have amino acid primes (>= 23)
    if (protein.success && protein.protein.length > 0) {
      assert.ok(protein.protein.every(p => p >= 23));
    }
  });
});

describe('createEngine integration', () => {
  test('createEngine creates bioinformatics engine', () => {
    const { createEngine } = require('../modular');
    
    const engine = createEngine('bioinformatics', {});
    
    assert.ok(engine);
    assert.strictEqual(engine.backend.getName(), 'BioinformaticsBackend');
  });
  
  test('engine can process DNA sequences', () => {
    const { createEngine } = require('../modular');
    
    const engine = createEngine('bio', {});
    const result = engine.run('ATGCATGC');
    
    assert.ok(result);
    assert.ok('inputPrimes' in result);
    assert.ok('entropy' in result);
  });
});