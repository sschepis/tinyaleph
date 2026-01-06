# Formal Semantics Examples

These examples demonstrate the formal semantic systems for prime-indexed computation.

## Examples

### 1. Typed Terms (`01-typed-terms.js`)

Demonstrates the type system:
- N(p): Noun terms indexed by prime
- A(p): Adjective/operator terms with p < q constraint
- ChainTerm: Operator chains A(p₁)...A(pₖ)N(q)
- FusionTerm: Triadic fusion FUSE(p,q,r)
- Sentence composition (◦) and implication (⇒)

```bash
node examples/formal-semantics/01-typed-terms.js
```

### 2. Reduction Semantics (`02-reduction.js`)

Demonstrates the operational semantics:
- Small-step reduction (→)
- Prime-preserving operators (⊕)
- Strong normalization proof
- Confluence via Newman's Lemma
- Fusion canonicalization

```bash
node examples/formal-semantics/02-reduction.js
```

### 3. Lambda Translation (`03-lambda-translation.js`)

Demonstrates the τ translation:
- τ: Term → λ-expression
- Compositional semantics
- Type preservation
- Operational/denotational agreement
- Concept interpretation

```bash
node examples/formal-semantics/03-lambda-translation.js
```

### 4. Enochian Language (`04-enochian-language.js`)

Demonstrates the Enochian formal system:
- 21-letter alphabet with prime mappings
- Prime basis PE = {7, 11, 13, 17, 19, 23, 29}
- Twist operations κ(p) = 360/p
- The 19 Calls
- Sedenion (16D) integration

```bash
node examples/formal-semantics/04-enochian-language.js
```

## Running All Examples

```bash
cd examples/formal-semantics
for f in *.js; do echo "=== $f ==="; node "$f"; echo; done
```

## Key Concepts

### Type System

| Type | Description | Example |
|------|-------------|---------|
| N(p) | Noun indexed by prime p | N(7) = "truth" |
| A(p) | Adjective with constraint p < q | A(3) = "triple" modifier |
| S | Sentence-level proposition | [N(7)] = statement |

### Reduction Rules 

| Rule | Reduction | Description |
|------|-----------|-------------|
| FUSE | FUSE(p,q,r) → N(p+q+r) | Triadic fusion |
| APPLY | A(p)N(q) → N(q⊕p) | Operator application |

### Enochian Primes

| Letter | Prime | Meaning |
|--------|-------|---------|
| A | 2 | Beginning |
| D | 7 | Foundation |
| E | 11 | Light |
| G | 17 | Spirit |
| Z | 73 | Completion |

## Related Files

- `core/types.js` - Type system implementation
- `core/reduction.js` - Reduction semantics
- `core/lambda.js` - Lambda calculus translation
- `apps/sentient/lib/enochian-vocabulary.js` - Enochian language