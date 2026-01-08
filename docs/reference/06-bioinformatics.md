# Bioinformatics Backend Reference

The Bioinformatics Backend provides DNA computing, protein folding simulation, and molecular biology operations through the tinyaleph prime-resonant computing framework.

## Overview

The bioinformatics module encodes biological sequences (DNA, RNA, proteins) as prime number signatures, enabling:

- **DNA/RNA/Protein encoding** as prime sequences
- **Central Dogma transforms** (transcription, translation)
- **Protein folding** via Kuramoto oscillator dynamics
- **DNA computing** with logic gates and circuits
- **Molecular binding** affinity calculations

## Installation

```javascript
const { 
    BioinformaticsBackend,
    DNACircuit,
    ANDGate, ORGate, NOTGate, NANDGate
} = require('@aleph-ai/tinyaleph');
```

## BioinformaticsBackend

Main class implementing the Backend interface for biological computation.

### Constructor

```javascript
const backend = new BioinformaticsBackend(options);
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `couplingStrength` | number | 0.1 | Kuramoto coupling for folding |
| `foldingSteps` | number | 100 | Oscillator evolution steps |
| `foldingDt` | number | 0.01 | Integration timestep |

### Core Methods

#### `encode(input)`

Encode a biological sequence to prime numbers.

```javascript
const primes = backend.encode('ATGCGATC');
// Returns: [7, 2, 11, 3, 11, 7, 2, 3]
```

**Input types:**
- DNA string (A, T, G, C)
- RNA string (A, U, G, C)  
- Protein string (single-letter amino acid codes)
- Array of nucleotides or amino acids

**Nucleotide Prime Mapping:**
| Base | Prime | Meaning |
|------|-------|---------|
| A | 7 | Adenine |
| T | 2 | Thymine |
| U | 5 | Uracil (RNA) |
| G | 11 | Guanine |
| C | 3 | Cytosine |

#### `decode(primes)`

Decode prime numbers back to a biological sequence.

```javascript
const seq = backend.decode([7, 2, 11, 3]);
// Returns: 'ATGC'
```

#### `primesToState(primes)`

Convert primes to a Hypercomplex (sedenion) state.

```javascript
const state = backend.primesToState([7, 2, 11, 3]);
console.log(state.norm());  // State magnitude
```

#### `primesToFrequencies(primes)`

Convert primes to oscillator frequencies.

```javascript
const freqs = backend.primesToFrequencies([7, 2, 11]);
// Returns: [Math.log(7), Math.log(2), Math.log(11)]
```

#### `applyTransform(state, transform)`

Apply a named transform to a state.

```javascript
const rnaState = backend.applyTransform(dnaState, 'transcription');
const proteinState = backend.applyTransform(rnaState, 'translation');
```

**Available transforms:** `transcription`, `translation`, `folding`

#### `getTransforms()`

Get list of available transforms.

```javascript
const transforms = backend.getTransforms();
// Returns: ['transcription', 'translation', 'folding', 'complementation']
```

### Biological Operations

#### `transcribe(dnaPrimes, options)`

Transcribe DNA to RNA (T → U substitution).

```javascript
const result = backend.transcribe(dnaPrimes);
// Returns: { rna: [...], success: boolean, message: string }
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `force` | boolean | false | Process even without promoter |

#### `translate(rnaPrimes, options)`

Translate RNA to protein using the genetic code.

```javascript
const result = backend.translate(rnaPrimes);
// Returns: { protein: [...], sequence: string, success: boolean }
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeStop` | boolean | false | Include stop codon in output |

#### `express(dnaPrimes, options)`

Full gene expression: DNA → RNA → Protein.

```javascript
const result = backend.express(dnaPrimes);
// Returns: { protein: [...], sequence: string, rna: [...], ... }
```

#### `foldProtein(proteinPrimes, options)`

Simulate protein folding using Kuramoto oscillators.

```javascript
const result = backend.foldProtein(proteinPrimes, {
    steps: 200,
    coupling: 0.2
});
// Returns: { 
//   phases: [...],          // Final oscillator phases
//   orderParameter: 0.85,   // Synchronization (0-1)
//   contactMap: [...],      // Residue-residue contacts
//   state: Hypercomplex,    // Final sedenion state
//   entropy: number         // Final entropy
// }
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `steps` | number | 100 | Evolution steps |
| `coupling` | number | 0.1 | Coupling strength |
| `dt` | number | 0.01 | Timestep |
| `threshold` | number | 0.5 | Contact threshold |

#### `bindingAffinity(primes1, primes2)`

Calculate molecular binding affinity between two sequences.

```javascript
const result = backend.bindingAffinity(dnaSeq, proteinSeq);
// Returns: {
//   affinity: 0.75,      // Affinity score
//   coherence: 0.82,     // Spectral coherence
//   complementarity: 0.6 // Sequence complementarity
// }
```

#### `dock(ligandPrimes, receptorPrimes, options)`

Perform molecular docking simulation.

```javascript
const result = backend.dock(ligand, receptor);
// Returns: {
//   affinity: number,
//   bindingSite: [...],
//   score: number
// }
```

## Amino Acid Encoding

20 standard amino acids are mapped to primes ordered by hydrophobicity:

| Amino Acid | Code | Prime | Property |
|------------|------|-------|----------|
| Leucine | L | 23 | Hydrophobic |
| Isoleucine | I | 29 | Hydrophobic |
| Valine | V | 31 | Hydrophobic |
| Phenylalanine | F | 37 | Hydrophobic |
| Methionine | M | 41 | Hydrophobic |
| Alanine | A | 43 | Hydrophobic |
| Glycine | G | 47 | Small |
| Cysteine | C | 53 | Sulfur |
| Tyrosine | Y | 59 | Aromatic |
| Tryptophan | W | 61 | Aromatic |
| Proline | P | 67 | Rigid |
| Threonine | T | 71 | Polar |
| Serine | S | 73 | Polar |
| Histidine | H | 79 | Charged+ |
| Asparagine | N | 83 | Polar |
| Glutamine | Q | 89 | Polar |
| Aspartic Acid | D | 97 | Charged- |
| Lysine | K | 101 | Charged+ |
| Arginine | R | 103 | Charged+ |
| Glutamic Acid | E | 107 | Charged- |

## Genetic Code

The complete 64-codon genetic code is implemented:

```javascript
const { GENETIC_CODE } = require('@aleph-ai/tinyaleph/backends/bioinformatics/genetic-code');

console.log(GENETIC_CODE['AUG']); // 'M' (Methionine - Start)
console.log(GENETIC_CODE['UAA']); // '*' (Stop)
```

## DNA Computing

### Logic Gates

All gates implement a standard interface:

```javascript
class DNAGate {
    evaluate(...inputs)  // Evaluate gate with concentration inputs
    truthTable()         // Get complete truth table
}
```

#### ANDGate

Both inputs must be present (concentration ≥ threshold).

```javascript
const gate = new ANDGate({ name: 'and1' });
gate.evaluate(1, 1);  // { output: true, ... }
gate.evaluate(0, 1);  // { output: false, ... }
```

#### ORGate

Either input triggers output.

```javascript
const gate = new ORGate({ name: 'or1' });
gate.evaluate(0, 1);  // { output: true, ... }
gate.evaluate(0, 0);  // { output: false, ... }
```

#### NOTGate

Inverts input signal.

```javascript
const gate = new NOTGate({ name: 'not1' });
gate.evaluate(0);  // { output: true, ... }
gate.evaluate(1);  // { output: false, ... }
```

#### NANDGate

NAND operation (NOT AND).

```javascript
const gate = new NANDGate({ name: 'nand1' });
gate.evaluate(1, 1);  // { output: false, ... }
gate.evaluate(0, 1);  // { output: true, ... }
```

### DNACircuit

Build complex circuits from gates.

```javascript
const circuit = new DNACircuit('my-circuit');

// Add gates
circuit.addGate('and1', new ANDGate({ name: 'and1' }));
circuit.addGate('not1', new NOTGate({ name: 'not1' }));
circuit.addGate('or1', new ORGate({ name: 'or1' }));

// Connect gates (source → target, input number)
circuit.connect('and1', 'or1', 1);
circuit.connect('not1', 'or1', 2);

// Set inputs and evaluate
circuit.setInput('and1', 1, 1);  // Gate, input#, value
circuit.setInput('and1', 2, 0);
circuit.setInput('not1', 1, 1);

const result = circuit.evaluate();
```

### DNA Strand Classes

```javascript
const { DNAStrand, DNADuplex, StrandDisplacementReaction } = require('@aleph-ai/tinyaleph');

// Create strands
const strand1 = new DNAStrand('ATGC', { toehold: 'AAA' });
const strand2 = new DNAStrand('GCAT');

// Create duplex (hybridized strands)
const duplex = new DNADuplex(strand1, strand2);

// Strand displacement reaction
const invader = new DNAStrand('AAAGCAT');
const reaction = new StrandDisplacementReaction(duplex, invader);
const result = reaction.react();
```

### SeesawGate

Advanced seesaw-style DNA logic gate.

```javascript
const { SeesawGate } = require('@aleph-ai/tinyaleph');

const gate = new SeesawGate({
    name: 'seesaw1',
    threshold: 0.5,
    gain: 2.0
});

const result = gate.evaluate(0.3, 0.7);
```

## Folding Dynamics

The folding system uses Kuramoto oscillators with biologically-motivated coupling:

### Contact Propensity

Residue-residue interaction strength is computed from:

1. **Hydrophobic interaction**: Hydrophobic residues (low primes) attract
2. **Electrostatic interaction**: Opposite charges attract (K, R, H vs D, E)
3. **Prime resonance**: Similar prime factors resonate

```javascript
// Contact propensity between residues i and j
propensity(i, j) = hydrophobic(i,j) + electrostatic(i,j) + resonance(i,j)
```

### Order Parameter

The Kuramoto order parameter measures folding completion:

```
r = |1/N Σ exp(i·θⱼ)|
```

- `r ≈ 0`: Disordered (unfolded)
- `r ≈ 1`: Synchronized (folded)

### Contact Map

The contact map records which residues are in proximity:

```javascript
result.contactMap[i][j] = true;  // Residues i,j in contact
```

## Integration with AlephEngine

Create a bioinformatics-configured engine:

```javascript
const { createEngine } = require('@aleph-ai/tinyaleph');

// These all work:
const engine = createEngine('bioinformatics');
const engine = createEngine('bio');
const engine = createEngine('dna');
const engine = createEngine('protein');

// Process biological sequences
const result = engine.run('ATGCGATCGATCGATCG');
```

## Examples

### DNA Encoding

```javascript
const backend = new BioinformaticsBackend();

// Encode DNA
const dna = 'ATGCGATCG';
const primes = backend.encode(dna);
console.log(primes);  // [7, 2, 11, 3, 11, 7, 2, 3, 11]

// Get hypercomplex state
const state = backend.primesToState(primes);
console.log('Norm:', state.norm());
console.log('Entropy:', backend.stateEntropy(state));

// Decode back
const decoded = backend.decode(primes);
console.log(decoded);  // 'ATGCGATCG'
```

### Central Dogma

```javascript
const backend = new BioinformaticsBackend();

// DNA sequence with start codon
const dna = 'ATGAAAGGG';  // ATG = start, AAA = Lys, GGG = Gly
const dnaPrimes = backend.encode(dna);

// Transcription: DNA → RNA
const rnaResult = backend.transcribe(dnaPrimes, { force: true });
console.log('mRNA:', backend.decode(rnaResult.rna));  // 'AUGAAAGGG'

// Translation: RNA → Protein
const proteinResult = backend.translate(rnaResult.rna);
console.log('Protein:', proteinResult.sequence);  // 'MKG'

// Or full expression
const expressed = backend.express(dnaPrimes);
console.log('Protein:', expressed.sequence);
```

### Protein Folding

```javascript
const backend = new BioinformaticsBackend();

// Small peptide
const peptide = 'MWLKFVIER';  // Mix of hydrophobic and charged
const primes = backend.encode(peptide);

// Fold with custom parameters
const result = backend.foldProtein(primes, {
    steps: 200,
    coupling: 0.15,
    dt: 0.01
});

console.log('Order parameter:', result.orderParameter);
console.log('Contact count:', result.contactMap.filter(row => 
    row.some(x => x)).length);
```

### DNA Circuit

```javascript
const { DNACircuit, ANDGate, ORGate, NOTGate } = require('@aleph-ai/tinyaleph');

// Build (A AND B) OR (NOT C)
const circuit = new DNACircuit('logic');

circuit.addGate('and1', new ANDGate({ name: 'and1' }));
circuit.addGate('not1', new NOTGate({ name: 'not1' }));
circuit.addGate('or1', new ORGate({ name: 'or1' }));

circuit.connect('and1', 'or1', 1);
circuit.connect('not1', 'or1', 2);

// Test
for (const [a, b, c] of [[0,0,0], [1,1,0], [1,1,1]]) {
    const result = (a && b) || !c;
    console.log(`${a} AND ${b} OR NOT ${c} = ${result ? 1 : 0}`);
}
```

### Binding Affinity

```javascript
const backend = new BioinformaticsBackend();

// DNA binding site
const dna = backend.encode('ATGCGATC');

// Transcription factor
const protein = backend.encode('MKVLR');

// Check affinity
const result = backend.bindingAffinity(dna, protein);
console.log('Affinity:', result.affinity.toFixed(4));
console.log('Coherence:', result.coherence.toFixed(4));
```

## Theory

### Prime Encoding Rationale

Primes are chosen for biological molecules based on:

1. **Uniqueness**: Each molecule maps to a unique prime signature
2. **Factorization**: Composite information decomposes into primes
3. **Resonance**: Related primes (e.g., base pairs) have harmonic relationships
4. **Ordering**: Hydrophobicity ordering creates meaningful prime relationships

### Folding as Synchronization

Protein folding is modeled as Kuramoto synchronization because:

1. Residues are oscillators with characteristic frequencies
2. Interactions create coupling between oscillators
3. Folding = synchronization to a coherent phase pattern
4. Native state = high order parameter (r → 1)

### DNA Computing as Prime Operations

DNA computation maps to prime arithmetic:

1. **Strand hybridization** = prime compatibility check
2. **Strand displacement** = prime sequence comparison
3. **Logic gates** = prime threshold operations
4. **Circuits** = composed prime transformations

## See Also

- [Core Module](./01-core.md) - Hypercomplex algebra
- [Physics Module](./02-physics.md) - Kuramoto oscillators
- [Backends](./03-backends.md) - Backend interface
- [Design Document](../design/BIOINFORMATICS_BACKEND_DESIGN.md) - Full architecture