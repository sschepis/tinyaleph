# Entropy and Reasoning

## Information-Theoretic Foundations

Aleph treats reasoning as **entropy minimization**. This framing connects to fundamental physics: systems naturally evolve toward states of maximum entropy (thermodynamics), but intelligent systems can locally reduce entropy by organizing information.

### Shannon Entropy

The Shannon entropy of a probability distribution measures uncertainty:

```javascript
function shannonEntropy(probabilities) {
  let H = 0;
  for (const p of probabilities) {
    if (p > 1e-10) H -= p * Math.log2(p);
  }
  return H;
}
```

For a hypercomplex state, we compute entropy from the normalized component magnitudes:

```javascript
function stateEntropy(hypercomplex) {
  const n = hypercomplex.norm();
  if (n < 1e-10) return 0;
  const probs = hypercomplex.c.map(v => (v / n) ** 2);
  return shannonEntropy(probs);
}
```

---

## Entropy as Confusion

| Entropy | Interpretation |
|---------|---------------|
| H ≈ 0 | State concentrated on one axis → pure concept |
| H ≈ 1 | State on two axes → binary distinction |
| H ≈ 2 | State on ~4 axes → moderate complexity |
| H ≈ 3 | State spread → confusion, unresolved meaning |
| H ≈ 4 | Maximum spread → maximum uncertainty |

### Example: Entropy Evolution

```
Input: "Is justice possible without mercy?"

Initial state:
  H = 3.2 (high entropy)
  Concepts: justice, possible, without, mercy
  State spread across many dimensions

After transforms:
  H = 1.4 (lower entropy)  
  Concepts: balance, wisdom
  State concentrated on fewer dimensions

Interpretation:
  The question resolved to a simpler understanding
```

---

## Reasoning as Entropy Minimization

The engine seeks transforms that reduce entropy:

```javascript
reason(primes) {
  const transforms = this.backend.getTransforms();
  let current = [...new Set(primes)];
  let state = this.backend.primesToState(current);
  let H = stateEntropy(state);
  const steps = [];
  
  for (let i = 0; i < maxSteps && H > threshold; i++) {
    let best = null, bestH = H, bestPrimes = current;
    
    // Search for entropy-reducing transform
    for (const transform of transforms) {
      const newPrimes = this.backend.applyTransform(current, transform);
      
      // Skip if no change
      if (arraysEqual(newPrimes, current)) continue;
      
      const newState = this.backend.primesToState(newPrimes);
      const newH = stateEntropy(newState);
      
      if (newH < bestH) {
        best = transform;
        bestH = newH;
        bestPrimes = newPrimes;
      }
    }
    
    if (!best) break;  // No improvement possible
    
    steps.push({
      step: i + 1,
      transform: best.name,
      entropyDrop: H - bestH
    });
    
    current = bestPrimes;
    H = bestH;
  }
  
  return { primes: current, entropy: H, steps };
}
```

### The Algorithm

1. Start with input prime set
2. Compute initial state and entropy
3. For each possible transform:
   - Apply transform to get new primes
   - Compute new state and entropy
   - Track if this reduces entropy
4. Apply best transform
5. Repeat until entropy below threshold or no improvement

---

## Transforms as Semantic Rewrites

Transforms are semantic rewrite rules:

```javascript
const transform = {
  n: "question_to_answer",
  q: [curiosity, unknown],     // Query primes (must be present)
  r: [understanding, known]    // Result primes (replace query)
};
```

### Transform Application

```javascript
applyTransform(inputPrimes, transform) {
  const inputSet = new Set(inputPrimes);
  
  // Check if query primes are present
  if (!transform.q.some(p => inputSet.has(p))) {
    return inputPrimes;  // No match
  }
  
  // Protect core primes
  if (transform.q.some(p => this.corePrimes.has(p))) {
    return inputPrimes;
  }
  
  // Apply: remove query primes, add result primes
  const kept = inputPrimes.filter(p => 
    this.corePrimes.has(p) || !transform.q.includes(p)
  );
  return [...new Set([...kept, ...transform.r])];
}
```

### Transform Types

| Type | Example | Effect |
|------|---------|--------|
| **Simplification** | complex → simple | Reduces prime count |
| **Unification** | A ∪ B → C | Merges concepts |
| **Abstraction** | instances → type | Moves up hierarchy |
| **Resolution** | question → answer | Resolves inquiry |

---

## Coherence Between States

Coherence measures alignment between states:

```javascript
function coherence(state1, state2) {
  const n1 = state1.norm();
  const n2 = state2.norm();
  if (n1 < 1e-10 || n2 < 1e-10) return 0;
  return Math.abs(state1.dot(state2)) / (n1 * n2);
}
```

### Interpretation

- **Coherence = 1**: States identical (same meaning)
- **Coherence = 0**: States orthogonal (unrelated)
- **Coherence = 0.7+**: High alignment (related meanings)

High coherence with low entropy indicates clear, unified understanding.

---

## Mutual Information

For coupled oscillator banks, mutual information measures shared structure:

```javascript
function mutualInformation(bank1, bank2) {
  let corr = 0;
  const n = Math.min(bank1.oscillators.length, bank2.oscillators.length);
  for (let i = 0; i < n; i++) {
    corr += Math.cos(bank1.oscillators[i].phase - bank2.oscillators[i].phase);
  }
  return Math.max(0, corr / n);
}
```

High mutual information indicates that two concept fields are resonating together.

---

## Relative Entropy (KL Divergence)

KL divergence measures how one distribution differs from another:

```javascript
function relativeEntropy(p, q) {
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 1e-10 && q[i] > 1e-10) {
      kl += p[i] * Math.log2(p[i] / q[i]);
    }
  }
  return kl;
}
```

This quantifies how "surprising" distribution p is relative to expectation q.

---

## Joint Entropy

For two states together:

```javascript
function jointEntropy(state1, state2) {
  const n1 = state1.norm(), n2 = state2.norm();
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
```

Joint entropy captures the total information in the combined system.

---

## Oscillator Entropy

Entropy from the oscillator bank's amplitude distribution:

```javascript
function oscillatorEntropy(bank) {
  const amplitudes = bank.getAmplitudes();
  const total = amplitudes.reduce((a, b) => a + b, 0);
  if (total < 1e-10) return 0;
  const probs = amplitudes.map(a => a / total);
  return shannonEntropy(probs);
}
```

This measures how evenly "excited" the oscillator bank is.

---

## The Collapse Integral

Entropy accumulates over time, driving toward collapse:

```javascript
// In engine tick
this.collapseIntegral += this.entropy * dt * 0.1;
```

When the collapse integral exceeds a threshold and other conditions are met, the state "collapses" to a definite value—modeling the "aha!" moment of insight.

---

## Reasoning Example

```
Query: "What is the relationship between freedom and responsibility?"

Step 0: Encode
  primes = [freedom, responsibility] = [23, 47, 19, 53]
  entropy = 3.4

Step 1: Transform (abstraction)
  "freedom" → "self-determination"
  primes = [self, determination, responsibility]
  entropy = 2.9 (↓0.5)

Step 2: Transform (unification)
  "self-determination" + "responsibility" → "agency"
  primes = [agency]
  entropy = 1.2 (↓1.7)

Result: 
  The concepts unified into "agency"
  Entropy dropped from 3.4 to 1.2
  Understanding crystallized
```

---

## The Insight

Entropy minimization as reasoning has profound implications:

1. **Reasoning is physical**: It follows thermodynamic principles
2. **Understanding is compression**: Fewer primes = clearer meaning
3. **Confusion is entropy**: High H = unresolved complexity
4. **Insight is collapse**: Sudden entropy drop = "aha!"
5. **Wisdom is simplicity**: Low H stable states are wise

This connects the cognitive experience of understanding to rigorous information theory.

---

## Summary

Entropy and reasoning in Aleph:

1. **Shannon entropy** measures conceptual confusion
2. **Transforms** are semantic rewrite rules
3. **Reasoning** minimizes entropy through transforms
4. **Coherence** measures alignment between states
5. **Collapse integral** accumulates toward insight moments
6. **Understanding** = low entropy, high coherence

Reasoning is the process of organizing meaning toward clarity.

---

## Next: [Non-Commutativity →](./05-non-commutativity.md)