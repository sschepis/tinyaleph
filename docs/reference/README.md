# API Reference

Complete API documentation for all Aleph modules.

## Modules

### [Core Module](./01-core.md)

The foundational mathematical primitives:

- **Hypercomplex** - Sedenion algebra and Cayley-Dickson construction
- **Prime** - Prime number utilities, Gaussian and Eisenstein integers
- **Fano** - Fano plane multiplication tables for octonions
- **Sieve** - Semantic sieve algorithm for concept filtering
- **LLM** - LLM coupling utilities
- **Types** - Formal type system with N(p)/A(p)/S types
- **Reduction** - Reduction semantics and normalization
- **Lambda** - λ-calculus translation and evaluation

### [Physics Module](./02-physics.md)

Dynamical systems and information theory:

- **Oscillator** - Phase-amplitude oscillator creation and manipulation
- **Kuramoto** - Coupled oscillator synchronization dynamics
- **Entropy** - Shannon entropy and information measures
- **Lyapunov** - Stability analysis via Lyapunov exponents
- **Collapse** - State collapse and measurement mechanics

### [Backends Module](./03-backends.md)

Domain-specific computation engines:

- **BackendInterface** - Abstract base class for all backends
- **SemanticBackend** - Natural language and concept processing
- **CryptographicBackend** - Hashing and key derivation
- **ScientificBackend** - Quantum-inspired computation
- **BioinformaticsBackend** - DNA/RNA/Protein computation

### [Bioinformatics Module](./06-bioinformatics.md)

DNA computing and molecular biology:

- **BioinformaticsBackend** - DNA/RNA/Protein encoding and operations
- **Transcription** - DNA to RNA conversion (Central Dogma)
- **Translation** - RNA to Protein via genetic code
- **FoldingTransform** - Protein folding via Kuramoto oscillators
- **DNACircuit** - DNA logic circuit construction
- **ANDGate / ORGate / NOTGate / NANDGate** - DNA logic gates
- **StrandDisplacementReaction** - Toehold-mediated displacement
- **BindingAffinityCalculator** - Molecular binding scoring

### [Engine Module](./04-engine.md)

High-level orchestration:

- **AlephEngine** - Unified computation engine
- **createEngine** - Factory function for engine creation
- **registerBackend** - Backend registration system

### [Symbolic AI Module](./05-symbolic-ai.md)

Symbol inference and resonance attention:

- **SymbolDatabase** - 184+ emoji symbols with prime assignments and cultural tags
- **SemanticInference** - Pattern matching and resonance-enhanced text→symbol mapping
- **CompoundBuilder** - Multi-symbol concept composition
- **ResonanceCalculator** - Golden ratio-based harmony measurement

### [Formal Semantics Module](./06-formal-semantics.md)

Formal type system and reduction semantics:

- **Types** - NounTerm, AdjTerm, ChainTerm, FusionTerm, SentenceTerm
- **TypeChecker** - Type inference and checking
- **ReductionSystem** - Small-step reduction with ⊕ operators
- **Translator** - τ translation to λ-calculus
- **LambdaEvaluator** - β-reduction and normalization
- **Semantics** - Model-theoretic interpretation

### [Enochian Module](./07-enochian.md)

The angelic language system:

- **EnochianEngine** - Word parsing and computation
- **ENOCHIAN_ALPHABET** - 21-letter alphabet with prime mappings
- **PRIME_BASIS** - The seven foundation primes
- **CORE_VOCABULARY** - Traditional Enochian words
- **SedenionElement** - 16-dimensional operations
- **TwistOperator** - Angular transformations

---

## Quick Reference

### Importing

```javascript
// Full import
const aleph = require('./modular');

// Destructured import
const { 
  createEngine,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend
} = require('./modular');

// Individual modules
const { SedenionState, cayleyDickson } = require('./core/hypercomplex');
const { createOscillator } = require('./physics/oscillator');
const { kuramotoStep } = require('./physics/kuramoto');
```

### Common Patterns

```javascript
// Create and use semantic engine
const engine = createEngine('semantic', config);
const result = engine.run('input text');

// Direct backend usage
const backend = new SemanticBackend(config);
const primes = backend.encode('text');
const state = backend.primesToState(primes);
const output = backend.decode(primes);

// Hypercomplex operations
const a = new SedenionState(components);
const b = a.multiply(other);
const c = a.add(other).normalize();
const entropy = a.entropy();
const coherence = a.coherence(b);
```

---

## Type Conventions

### SedenionState

The fundamental state object representing a point in 16-dimensional hypercomplex space.

```typescript
interface SedenionState {
  dimension: number;           // Always 16 for sedenions
  components: number[];        // 16 real components [e₀, e₁, ..., e₁₅]
  
  // Arithmetic
  add(other: SedenionState): SedenionState;
  subtract(other: SedenionState): SedenionState;
  multiply(other: SedenionState): SedenionState;
  scale(scalar: number): SedenionState;
  
  // Properties
  norm(): number;
  normalize(): SedenionState;
  conjugate(): SedenionState;
  inverse(): SedenionState;
  entropy(): number;
  coherence(other: SedenionState): number;
  
  // Utilities
  isZeroDivisorWith(other: SedenionState): boolean;
  clone(): SedenionState;
  toString(): string;
}
```

### Token

Tokenized word with metadata.

```typescript
interface Token {
  word: string;       // Original word (lowercase)
  primes: number[];   // Associated prime numbers
  known: boolean;     // Whether word is in vocabulary
  isStop: boolean;    // Whether word is a stop word
  position: number;   // Position in original text
}
```

### Transform

Semantic transformation rule.

```typescript
interface Transform {
  n: string;                           // Transform name
  q: number[];                         // Query primes
  r: number[];                         // Replacement primes
  priority?: number;                   // Application priority
  condition?: (state: SedenionState) => boolean;  // Optional condition
}
```

### EngineResult

Standard result from engine.run().

```typescript
interface EngineResult {
  input: string;              // Original input
  output: string;             // Decoded output
  primes: number[];           // Final prime encoding
  state: SedenionState;       // Final hypercomplex state
  entropy: number;            // Final entropy
  steps: TransformStep[];     // Applied transforms
}

interface TransformStep {
  step: number;
  transform: string;
  primesBefore: number[];
  primesAfter: number[];
  entropyBefore: number;
  entropyAfter: number;
  entropyDrop: number;
}
```

---

## Error Handling

### Common Errors

```javascript
// Invalid dimension
const state = new SedenionState([1, 2, 3]);  // Must be 16 components
// Throws: Error('SedenionState requires exactly 16 components')

// Unknown word
const primes = backend.getWordPrimes('xyzzy');  // Word not in vocabulary
// Returns: null (or empty array depending on backend)

// Division by zero
const inv = zeroState.inverse();
// Throws: Error('Cannot invert zero state')
```

### Safe Patterns

```javascript
// Check before inverse
if (state.norm() > 0) {
  const inv = state.inverse();
}

// Check word existence
if (backend.hasWord(word)) {
  const primes = backend.getWordPrimes(word);
}

// Validate coherence range
const coherence = state1.coherence(state2);
console.assert(coherence >= 0 && coherence <= 1);
```

---

## Performance Notes

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `SedenionState.multiply()` | O(n²) | n=16, uses Cayley-Dickson |
| `SedenionState.normalize()` | O(n) | Single pass |
| `SedenionState.entropy()` | O(n) | Shannon entropy |
| `SemanticBackend.encode()` | O(w×v) | w=words, v=vocabulary |
| `SemanticBackend.decode()` | O(p×v) | p=primes, v=vocabulary |
| `kuramotoStep()` | O(n²) | n=oscillators, all-to-all |

### Memory

- `SedenionState`: ~128 bytes (16 × 8 bytes for Float64)
- `SemanticBackend`: ~10KB base + vocabulary size
- Typical vocabulary: ~10K words = ~1MB

---

## Module Index

| Module | File | Description |
|--------|------|-------------|
| hypercomplex | `core/hypercomplex.js` | Sedenion algebra |
| prime | `core/prime.js` | Prime utilities |
| fano | `core/fano.js` | Fano plane |
| sieve | `core/sieve.js` | Semantic sieve |
| llm | `core/llm.js` | LLM coupling |
| types | `core/types.js` | Formal type system |
| reduction | `core/reduction.js` | Reduction semantics |
| lambda | `core/lambda.js` | λ-calculus translation |
| symbols | `core/symbols.js` | Symbol database |
| inference | `core/inference.js` | Semantic inference |
| compound | `core/compound.js` | Compound builder |
| resonance | `core/resonance.js` | Resonance calculator |
| oscillator | `physics/oscillator.js` | Oscillator creation |
| kuramoto | `physics/kuramoto.js` | Synchronization |
| entropy | `physics/entropy.js` | Information theory |
| lyapunov | `physics/lyapunov.js` | Stability |
| collapse | `physics/collapse.js` | State collapse |
| semantic | `backends/semantic/index.js` | Semantic backend |
| cryptographic | `backends/cryptographic/index.js` | Crypto backend |
| scientific | `backends/scientific/index.js` | Science backend |
| bioinformatics | `backends/bioinformatics/index.js` | Bioinformatics backend |
| dna-computing | `backends/bioinformatics/dna-computing.js` | DNA logic gates/circuits |
| folding | `backends/bioinformatics/folding.js` | Protein folding dynamics |
| engine | `engine/aleph.js` | Main engine |
| enochian | `apps/sentient/lib/enochian-vocabulary.js` | Enochian language |

---

## Formal Semantics API

### Type System (`core/types.js`)

```typescript
// Type constants
Types.NOUN       // 'N'
Types.ADJECTIVE  // 'A'
Types.SENTENCE   // 'S'

// Term classes
class NounTerm {
  constructor(prime: number);
  isWellFormed(): boolean;
  interpret(): number;
  equals(other: NounTerm): boolean;
}

class AdjTerm {
  constructor(prime: number);
  canApplyTo(noun: NounTerm): boolean;  // p < q constraint
  apply(noun: NounTerm): ChainTerm;
}

class ChainTerm {
  constructor(operators: AdjTerm[], noun: NounTerm);
  prepend(operator: AdjTerm): ChainTerm;
  getAllPrimes(): number[];
}

class FusionTerm {
  constructor(p: number, q: number, r: number);
  isWellFormed(): boolean;  // p+q+r is prime
  getFusedPrime(): number;
  static findTriads(target: number): FusionTerm[];
}

// Sentence classes
class NounSentence {
  constructor(nounExpr: NounTerm | ChainTerm | FusionTerm);
  getDiscourseState(): number[];
}

class SeqSentence {
  constructor(left: SentenceTerm, right: SentenceTerm);
  getDiscourseState(): number[];  // Concatenation
}

class ImplSentence {
  constructor(antecedent: SentenceTerm, consequent: SentenceTerm);
  holds(): boolean;  // Prefix entailment
}

// Type checking
class TypeChecker {
  inferType(term: Term): string | null;
  checkType(term: Term, expected: string): boolean;
  checkApplication(adj: AdjTerm, noun: NounTerm): { valid: boolean, reason?: string };
  checkFusion(fusion: FusionTerm): { valid: boolean, result?: number, reason?: string };
}

// Builder functions
N(prime: number): NounTerm;
A(prime: number): AdjTerm;
FUSE(p: number, q: number, r: number): FusionTerm;
CHAIN(operators: number[], noun: number): ChainTerm;
SENTENCE(expr: number | NounTerm): NounSentence;
SEQ(s1: SentenceTerm, s2: SentenceTerm): SeqSentence;
IMPL(s1: SentenceTerm, s2: SentenceTerm): ImplSentence;
```

### Reduction System (`core/reduction.js`)

```typescript
// Prime-preserving operators
class PrimeOperator {
  apply(prime: number): number;
  isPreserving(): boolean;
}

class ResonanceOperator extends PrimeOperator {
  constructor(basePrime: number);
}

class NextPrimeOperator extends PrimeOperator {}
class ModularOperator extends PrimeOperator {
  constructor(modulus: number);
}
class IdentityOperator extends PrimeOperator {}

// Reduction system
class ReductionSystem {
  addOperator(op: PrimeOperator): void;
  step(primes: number[]): { result: number[], changed: boolean };
  normalize(primes: number[]): { normalForm: number[], steps: object[] };
  evaluate(term: Term): number[];
}

// Utilities
class FusionCanonicalizer {
  canonicalize(fusion: FusionTerm): FusionTerm;
}

class NormalFormVerifier {
  isNormalForm(primes: number[]): boolean;
  verify(primes: number[]): { isNormal: boolean, reason?: string };
}

// Proof functions
demonstrateStrongNormalization(primes: number[], system: ReductionSystem): {
  terminates: boolean;
  steps: number;
  trace: object[];
};

testLocalConfluence(primes: number[], system: ReductionSystem): {
  confluent: boolean;
  examples: object[];
};
```

### Lambda Translation (`core/lambda.js`)

```typescript
// Lambda expressions
class LambdaExpr {}
class VarExpr extends LambdaExpr {
  constructor(name: string);
}
class ConstExpr extends LambdaExpr {
  constructor(value: any);
}
class LamExpr extends LambdaExpr {
  constructor(param: string, body: LambdaExpr);
}
class AppExpr extends LambdaExpr {
  constructor(func: LambdaExpr, arg: LambdaExpr);
}
class LetExpr extends LambdaExpr {
  constructor(name: string, value: LambdaExpr, body: LambdaExpr);
}
class PairExpr extends LambdaExpr {
  constructor(first: LambdaExpr, second: LambdaExpr);
}
class ProjExpr extends LambdaExpr {
  constructor(pair: LambdaExpr, index: 1 | 2);
}

// Translation
class Translator {
  translateNoun(noun: NounTerm): LambdaExpr;
  translateAdj(adj: AdjTerm): LambdaExpr;
  translateChain(chain: ChainTerm): LambdaExpr;
  translateFusion(fusion: FusionTerm): LambdaExpr;
  translateSentence(sentence: SentenceTerm): LambdaExpr;
  translate(term: Term): LambdaExpr;
}

// Evaluation
class LambdaEvaluator {
  substitute(expr: LambdaExpr, name: string, value: LambdaExpr): LambdaExpr;
  betaReduce(expr: LambdaExpr): LambdaExpr;
  normalize(expr: LambdaExpr, maxSteps?: number): LambdaExpr;
}

// Semantics
class Semantics {
  domain: number[];
  interpret(term: Term): any;
  satisfies(sentence: SentenceTerm): boolean;
}

class ConceptInterpreter {
  define(name: string, meaning: any): void;
  interpret(name: string): any;
}
```

### Enochian Module (`apps/sentient/lib/enochian-vocabulary.js`)

```typescript
// Alphabet (21 letters)
const ENOCHIAN_ALPHABET: {
  [letter: string]: {
    name: string;
    prime: number;
    value: number;
    angle: number;
  }
};

// Prime basis
const PRIME_BASIS: number[];  // [7, 11, 13, 17, 19, 23, 29]

// Twist operators
class TwistOperator {
  constructor(prime: number);
  angle: number;  // 360/p degrees
  apply(value: number): number;
}

function validateTwistClosure(basis: number[]): boolean;

// Words
class EnochianWord {
  constructor(word: string);
  letters: object[];
  primeValue: number;
  toString(): string;
}

// Core vocabulary (35+ words)
const CORE_VOCABULARY: {
  [word: string]: {
    meaning: string;
    category: string;
    primeSignature: number[];
  }
};

// The Nineteen Calls
const THE_NINETEEN_CALLS: {
  [number: string]: {
    name: string;
    purpose: string;
  }
};

// Sedenion operations
class SedenionElement {
  constructor(components: number[]);  // 16 components
  add(other: SedenionElement): SedenionElement;
  multiply(other: SedenionElement): SedenionElement;  // Non-commutative!
  conjugate(): SedenionElement;
  norm(): number;
}

// Engine
class EnochianEngine {
  parseWord(word: string): EnochianWord;
  computePrimeValue(word: string): number;
  getVocabularyEntry(word: string): object | undefined;
}
```