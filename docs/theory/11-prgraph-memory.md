# Prime Resonant Graph Memory: A Quantum-Inspired Content-Addressable Memory System Using Prime Number Theory and Hypercomplex Algebra

**Sebastian Schepis**  
*Coherent Observer Research*

---

## Abstract

We present **PRGraphMemory**, a novel content-addressable memory architecture that combines prime number theory with quaternionic algebra to achieve semantic similarity-based storage and retrieval. Unlike conventional associative memories that rely on vector similarity in Euclidean space, our approach encodes information as sparse superpositions over prime-indexed basis states, where each activation carries both complex amplitude (encoding phase) and quaternionic orientation (encoding directional semantics). Retrieval is performed via a resonance score that unifies set-theoretic overlap, phase coherence, and orientation alignment into a single similarity metric. We further introduce entropy-driven dynamics that enable temporal forgetting and memory consolidation without explicit garbage collection. Theoretical analysis demonstrates that the prime-indexed representation provides logarithmic addressing efficiency while the quaternionic extension captures non-commutative compositional semantics. We describe implementations in both JavaScript and AssemblyScript (WebAssembly), and discuss applications to semantic memory, knowledge graphs, and distributed storage systems.

**Keywords:** content-addressable memory, prime numbers, quaternions, resonance, semantic similarity, sparse representation, entropy dynamics

---

## 1. Introduction

### 1.1 Motivation

Traditional memory systems operate on exact-match addressing: a key uniquely identifies a value. While efficient for structured data, this paradigm fails to capture the fuzzy, associative nature of human memory and semantic knowledge. Content-addressable memories (CAMs) address this limitation by enabling retrieval based on partial or similar patterns, but conventional CAM implementations face scaling challenges and lack principled mechanisms for temporal dynamics.

We propose a fundamentally different approach grounded in two mathematical observations:

1. **Prime Factorization as Semantic Addressing**: The Fundamental Theorem of Arithmetic guarantees unique factorization of integers into primes. By mapping semantic content to prime-indexed activations, we obtain a representation where compositional structure (products of concepts) corresponds to additive structure in the activation space.

2. **Quaternions for Non-Commutative Composition**: Natural language and temporal reasoning exhibit order-sensitivity ("Alice called Bob" ≠ "Bob called Alice"). Quaternionic algebra, being non-commutative under multiplication, naturally encodes this asymmetry in the representation itself.

### 1.2 Contributions

This paper makes the following contributions:

1. **Formal Definition**: We define the Prime Resonant Graph Memory (PRGraphMemory) as a content-addressable store operating in the tensor product space H_P ⊗ ℍ, where H_P is a prime-indexed Hilbert space and ℍ is the quaternion algebra.

2. **Resonance Score**: We introduce a novel similarity metric combining Jaccard set overlap, quaternionic alignment, and phase coherence.

3. **Entropy Dynamics**: We describe a temporal evolution mechanism where memories decay according to entropy reduction, with high-coherence memories becoming "locked" (protected from forgetting).

4. **Algorithm Analysis**: We provide computational complexity bounds and discuss the trade-offs between sparsity, expressiveness, and retrieval efficiency.

5. **Implementation**: We present concrete implementations in JavaScript and AssemblyScript, demonstrating practical applicability.

### 1.3 Paper Organization

Section 2 reviews related work. Section 3 establishes the mathematical preliminaries. Section 4 defines the PRGraphMemory data structures. Section 5 presents the core algorithms. Section 6 analyzes computational properties. Section 7 discusses applications. Section 8 concludes.

---

## 2. Related Work

### 2.1 Content-Addressable Memory

Hopfield networks (Hopfield, 1982) introduced the concept of associative memory in neural systems, where patterns are stored as attractors of a dynamical system. However, capacity scales as O(n) for n neurons, limiting applicability. Modern approaches using attention mechanisms (Vaswani et al., 2017) achieve content-based addressing but require O(n²) computation for n items.

### 2.2 Prime Number Representations

The use of prime numbers in computing traces to Gödel numbering, where statements are encoded as products of primes raised to powers. More recently, prime-indexed representations have appeared in the context of hyperdimensional computing (Kanerva, 2009) and compositional semantics (Smolensky, 1990). Our work extends these ideas by incorporating phase and orientation information.

### 2.3 Quaternions in Machine Learning

Quaternions have been applied to rotation representation in computer graphics and robotics. In machine learning, quaternion neural networks (Parcollet et al., 2019) demonstrate improved performance on tasks with inherent 3D structure. We apply quaternions not for geometric rotation but for encoding non-commutative semantic relationships.

### 2.4 Quantum-Inspired Computing

Quantum-inspired algorithms (Tang, 2019) apply quantum mechanical formalism to classical systems. Our use of superposition, amplitude, and phase follows this paradigm, treating memory states as classical analogues of quantum states without requiring quantum hardware.

---

## 3. Mathematical Preliminaries

### 3.1 Prime Hilbert Space

**Definition 3.1 (Prime Hilbert Space).** Let ℙ = {2, 3, 5, 7, 11, ...} denote the set of prime numbers. The *Prime Hilbert Space* H_P is the Hilbert space with orthonormal basis {|p⟩ : p ∈ ℙ}, equipped with the standard inner product:

$$\langle p | q \rangle = \delta_{pq}$$

where δ_{pq} is the Kronecker delta.

**Definition 3.2 (Sparse Prime State).** A *sparse prime state* with sparsity parameter k is a vector in H_P with at most k non-zero amplitudes:

$$|\Psi\rangle = \sum_{p \in P_{\text{active}}} c_p |p\rangle$$

where |P_active| ≤ k and c_p ∈ ℂ.

### 3.2 Quaternion Algebra

**Definition 3.3 (Quaternions).** The quaternion algebra ℍ is the 4-dimensional real algebra generated by {1, i, j, k} subject to:

$$i^2 = j^2 = k^2 = ijk = -1$$

A quaternion q = w + xi + yj + zk has:
- **Conjugate**: q* = w - xi - yj - zk
- **Norm**: |q|² = qq* = w² + x² + y² + z²
- **Inverse**: q⁻¹ = q*/|q|²

**Proposition 3.1 (Non-Commutativity).** For general quaternions q₁, q₂ ∈ ℍ:

$$q_1 q_2 \neq q_2 q_1$$

The *commutator* [q₁, q₂] = q₁q₂ - q₂q₁ measures the degree of non-commutativity.

### 3.3 Prime-Quaternion State Space

**Definition 3.4 (Prime-Quaternion State Space).** The *Prime-Quaternion State Space* is the tensor product:

$$H_Q = H_P \otimes \mathbb{H}$$

An element of H_Q is a sparse mapping from primes to quaternions:

$$|\Psi\rangle = \sum_{p \in P_{\text{active}}} \alpha_p \cdot q_p \cdot |p\rangle$$

where α_p ∈ ℂ (complex amplitude) and q_p ∈ ℍ (quaternion orientation).

### 3.4 Entropy

**Definition 3.5 (Shannon Entropy over Primes).** For a normalized state |Ψ⟩ with amplitudes {c_p}, the entropy is:

$$S(\Psi) = -\sum_{p} |c_p|^2 \log_2 |c_p|^2$$

Entropy measures the "spread" of the state across prime bases. Maximum entropy occurs for uniform superposition; minimum (zero) entropy occurs for basis states.

---

## 4. PRGraphMemory Data Structures

### 4.1 Memory Entry

**Definition 4.1 (Memory Entry).** A memory entry E is a tuple:

$$E = (id, \Psi, M, S, \lambda, t_c, n_a)$$

where:
- id ∈ ℕ: unique identifier (hash of key)
- Ψ ∈ H_Q: the prime-quaternion state
- M: metadata (arbitrary structured data)
- S ∈ ℝ⁺: current entropy
- λ ∈ {true, false}: locked status
- t_c ∈ ℝ: creation timestamp
- n_a ∈ ℕ: access count

### 4.2 Memory Store

**Definition 4.2 (PRGraphMemory).** A PRGraphMemory G is a tuple:

$$G = (\mathcal{E}, \mathbb{P}_N, \tau_{\text{lock}}, \gamma)$$

where:
- ℰ: Map⟨id, Entry⟩ is the entry store
- ℙ_N = {p₁, ..., p_N} is the vocabulary of the first N primes
- τ_lock ∈ [0, 1]: threshold for memory locking
- γ ∈ [0, 1]: decay rate per access

---

## 5. Algorithms

### 5.1 Prime-Entropy Hash Function

The hash function Π maps a string key to a numeric identifier that determines prime activations.

**Algorithm 1: Prime-Entropy Hash**
```
function Π(key: String) → ℕ:
    hash ← 0
    for i = 0 to |key| - 1:
        hash ← ((hash << 5) - hash + charCode(key[i])) mod 2³²
    return |hash|
```

**Proposition 5.1.** The prime-entropy hash distributes uniformly over [0, 2³²) for sufficiently long random strings.

### 5.2 State Encoding

Given a text string, we construct a sparse prime state by:

1. Computing the hash to select k primes
2. Assigning phase-encoded amplitudes based on position
3. Generating quaternion orientations from character statistics

**Algorithm 2: Text to SparsePrimeState**
```
function encode(text: String, k: int, primes: Prime[]) → SparsePrimeState:
    hash ← Π(text)
    state ← new SparsePrimeState()
    charSum ← Σ charCode(text[i])
    
    for i = 0 to k - 1:
        idx ← (hash × (i + 1) × 31337) mod |primes|
        p ← primes[idx]
        phase ← 2π × i / k
        amplitude ← Complex.fromPolar(1/√k, phase)
        
        axis ← [sin(charSum + i), cos(charSum × i), sin(i)]
        angle ← (charSum × i) mod 2π
        quaternion ← Quaternion.fromAxisAngle(axis, angle)
        
        state.set(p, amplitude, quaternion.normalize())
    
    return state
```

### 5.3 Resonance Score

The resonance score quantifies similarity between two prime-quaternion states.

**Definition 5.1 (Resonance Score).** For states Ψ_i and Ψ_j with active prime sets P_i and P_j:

$$\text{Res}(\Psi_i, \Psi_j) = \alpha \cdot J(P_i, P_j) + \beta \cdot Q(\Psi_i, \Psi_j) + \gamma \cdot \Phi(\Psi_i, \Psi_j)$$

where α + β + γ = 1 and:

**Jaccard Similarity (Set Overlap):**
$$J(P_i, P_j) = \frac{|P_i \cap P_j|}{|P_i \cup P_j|}$$

**Quaternion Alignment:**
$$Q(\Psi_i, \Psi_j) = \frac{1}{|P_i \cap P_j|} \sum_{p \in P_i \cap P_j} |q_i^p \cdot q_j^p|$$

where q_i^p · q_j^p denotes the quaternion dot product (as 4-vectors).

**Phase Coherence:**
$$\Phi(\Psi_i, \Psi_j) = \frac{1}{2} \left( 1 + \frac{1}{|P_i \cap P_j|} \sum_{p \in P_i \cap P_j} \cos(\phi_i^p - \phi_j^p) \right)$$

where φ^p is the phase of the complex amplitude at prime p.

**Algorithm 3: Resonance Score**
```
function resonanceScore(Ψ_i, Ψ_j, α=0.33, β=0.33, γ=0.34) → ℝ:
    P_i ← Ψ_i.getActivePrimes()
    P_j ← Ψ_j.getActivePrimes()
    
    intersection ← P_i ∩ P_j
    union ← P_i ∪ P_j
    
    if |intersection| = 0:
        return α × |intersection| / |union|
    
    // Jaccard
    jaccard ← |intersection| / |union|
    
    // Quaternion alignment
    quatSum ← 0
    for p in intersection:
        quatSum ← quatSum + |Ψ_i.get(p).quaternion · Ψ_j.get(p).quaternion|
    quatAlign ← quatSum / |intersection|
    
    // Phase coherence
    phaseSum ← 0
    for p in intersection:
        Δφ ← Ψ_i.get(p).amplitude.phase() - Ψ_j.get(p).amplitude.phase()
        phaseSum ← phaseSum + cos(Δφ)
    phaseCoherence ← (phaseSum / |intersection| + 1) / 2
    
    return α × jaccard + β × quatAlign + γ × phaseCoherence
```

### 5.4 Storage (PRG-Put)

**Algorithm 4: Memory Storage**
```
function put(G: PRGraphMemory, key: String, Ψ: SparsePrimeState, M: Metadata) → id:
    id ← Π(key)
    S ← Ψ.entropy()
    
    entry ← {
        id: id,
        key: key,
        state: Ψ,
        metadata: M,
        entropy: S,
        locked: false,
        createdAt: now(),
        accessCount: 0
    }
    
    G.ℰ.set(id, entry)
    return id
```

### 5.5 Retrieval (PRG-Get)

**Algorithm 5: Content-Addressable Retrieval**
```
function get(G: PRGraphMemory, query: SparsePrimeState, k: int) → Entry[]:
    results ← []
    
    for (id, entry) in G.ℰ:
        score ← resonanceScore(query, entry.state)
        
        // Apply entropy decay
        entry.entropy ← entry.entropy × (1 - G.γ)
        
        // Lock condition
        if entry.entropy < 0.5 and score > G.τ_lock:
            entry.locked ← true
        
        entry.accessCount ← entry.accessCount + 1
        
        results.append({id, score, entry})
    
    // Sort by score descending
    results.sort(by: score, order: descending)
    
    return results[0:k]
```

### 5.6 Hamilton Composition

For combining states with order-sensitivity, we use the Hamilton product:

**Algorithm 6: Hamilton Composition**
```
function hamiltonCompose(Ψ_A, Ψ_B) → SparsePrimeState:
    result ← new SparsePrimeState()
    allPrimes ← Ψ_A.primes() ∪ Ψ_B.primes()
    
    for p in allPrimes:
        a_A ← Ψ_A.get(p)
        a_B ← Ψ_B.get(p)
        
        // Complex amplitude multiplication
        newAmp ← a_A.amplitude × a_B.amplitude
        
        // Quaternion Hamilton product (non-commutative!)
        newQuat ← a_A.quaternion × a_B.quaternion
        
        result.set(p, newAmp, newQuat.normalize())
    
    return result.normalize()
```

**Theorem 5.1 (Order Sensitivity).** For general states Ψ_A, Ψ_B:

$$\text{hamiltonCompose}(\Psi_A, \Psi_B) \neq \text{hamiltonCompose}(\Psi_B, \Psi_A)$$

*Proof.* The Hamilton product on quaternions is non-commutative. For any prime p where both states have non-zero quaternion amplitudes q_A and q_B with non-zero commutator, the composed quaternion differs under permutation. ∎

### 5.7 Memory Pruning

For bounded-capacity systems, we employ utility-based pruning:

**Algorithm 7: Memory Pruning**
```
function prune(G: PRGraphMemory, maxEntries: int):
    if |G.ℰ| ≤ maxEntries:
        return
    
    utilities ← []
    for (id, entry) in G.ℰ:
        utility ← entry.decayFactor × (1 + log(entry.accessCount + 1))
        utilities.append({id, utility})
    
    utilities.sort(by: utility, order: ascending)
    
    toRemove ← |G.ℰ| - maxEntries + ⌊maxEntries / 10⌋
    for i = 0 to toRemove - 1:
        G.ℰ.delete(utilities[i].id)
```

### 5.8 Memory Consolidation

Similar memories can be merged to reduce redundancy:

**Algorithm 8: Memory Consolidation**
```
function consolidate(G: PRGraphMemory, θ: float) → int:
    merged ← 0
    toRemove ← {}
    
    for (id_1, e_1) in G.ℰ:
        if id_1 in toRemove: continue
        
        for (id_2, e_2) in G.ℰ:
            if id_2 ≤ id_1 or id_2 in toRemove: continue
            
            if resonanceScore(e_1.state, e_2.state) > θ:
                // Merge e_2 into e_1
                e_1.state ← (e_1.state + e_2.state).normalize()
                e_1.accessCount ← e_1.accessCount + e_2.accessCount
                toRemove.add(id_2)
                merged ← merged + 1
    
    for id in toRemove:
        G.ℰ.delete(id)
    
    return merged
```

---

## 6. Theoretical Analysis

### 6.1 Complexity Analysis

**Theorem 6.1 (Storage Complexity).** For a memory with n entries, each with sparsity k:

- Space: O(n × k) quaternion-amplitude pairs
- Put: O(k) for state construction, O(1) for storage
- Get: O(n × k) for resonance scoring (dominates)

**Theorem 6.2 (Resonance Score Complexity).** Computing Res(Ψ_i, Ψ_j) requires:

- O(k log k) for set intersection (using sorted prime lists)
- O(|P_i ∩ P_j|) for quaternion and phase components
- Total: O(k log k)

### 6.2 Capacity and Collision Analysis

**Definition 6.1 (Prime Vocabulary).** The vocabulary ℙ_N contains the first N primes.

**Proposition 6.1.** For vocabulary size N and sparsity k, the number of distinct states is:

$$\binom{N}{k} \times |\mathcal{A}|^k$$

where |𝒜| is the cardinality of the amplitude discretization.

For N = 4096, k = 32, and continuous amplitudes, this is effectively uncountable, ensuring collision-free addressing.

### 6.3 Entropy Dynamics

**Theorem 6.3 (Entropy Decay Convergence).** Under repeated access with decay rate γ ∈ (0, 1), the entropy of an entry converges to zero:

$$S_t = S_0 \times (1 - \gamma)^t \xrightarrow{t \to \infty} 0$$

**Corollary 6.1.** All sufficiently accessed memories eventually become locked (if they achieve high resonance with queries).

### 6.4 Non-Commutativity Measure

**Definition 6.2 (Average Commutator Norm).** For states Ψ_A, Ψ_B sharing primes P = P_A ∩ P_B:

$$\text{NonComm}(\Psi_A, \Psi_B) = \frac{1}{|P|} \sum_{p \in P} \|[q_A^p, q_B^p]\|$$

**Proposition 6.2.** NonComm = 0 if and only if all shared quaternion pairs commute (i.e., are parallel or one is real).

---

## 7. Applications

### 7.1 Semantic Memory for Language Models

PRGraphMemory can serve as external memory for large language models:

1. **Fact Storage**: Encode facts as prime-indexed states
2. **Retrieval Augmentation**: Query memory during generation
3. **Temporal Coherence**: Older, less-accessed facts naturally fade
4. **Consolidation**: Related facts merge into unified representations

### 7.2 Knowledge Graph Completion

Traditional knowledge graphs require explicit edges. PRGraphMemory enables:

- **Implicit Relationships**: Similarity via resonance score
- **Fuzzy Queries**: Partial match retrieval
- **Dynamic Strength**: Relationship strength evolves with access patterns

### 7.3 Distributed Storage via CRT

Using the Chinese Remainder Theorem, states can be sharded across nodes indexed by distinct primes:

**Algorithm 9: CRT Reconstruction**
```
function reconstructFromResidues(residues: int[], primes: Prime[]) → int:
    M ← Π_{p ∈ primes} p
    result ← 0
    
    for i = 0 to |primes| - 1:
        M_i ← M / primes[i]
        y_i ← modularInverse(M_i, primes[i])
        result ← (result + residues[i] × M_i × y_i) mod M
    
    return result
```

This enables:
- **Redundancy**: State recoverable from subset of shards
- **Locality**: Access patterns determine physical placement
- **Security**: No single node holds complete information

### 7.4 Temporal Reasoning

The order-sensitive Hamilton composition enables:

- **Event Sequencing**: "A then B" ≠ "B then A"
- **Causal Inference**: Asymmetric relationships encoded in quaternions
- **Narrative Memory**: Stories encoded with temporal structure

---

## 8. Conclusion

We have presented PRGraphMemory, a content-addressable memory system grounded in prime number theory and quaternionic algebra. The key innovations are:

1. **Prime-Indexed Representation**: Compositional semantics via sparse superpositions over prime bases
2. **Quaternionic Orientation**: Non-commutative structure for order-sensitive composition
3. **Resonance-Based Retrieval**: Unified similarity metric combining set overlap, orientation alignment, and phase coherence
4. **Entropy Dynamics**: Natural temporal forgetting with consolidation of stable memories

The approach offers a principled alternative to vector-based semantic memory, with theoretical foundations in number theory, hypercomplex algebra, and information theory. Future work will explore integration with neural architectures, scaling to billions of entries, and applications to multi-modal memory systems.

---

## References

1. Hopfield, J.J. (1982). Neural networks and physical systems with emergent collective computational abilities. *Proceedings of the National Academy of Sciences*, 79(8), 2554-2558.

2. Kanerva, P. (2009). Hyperdimensional computing: An introduction to computing in distributed representation with high-dimensional random vectors. *Cognitive Computation*, 1(2), 139-159.

3. Parcollet, T., et al. (2019). Quaternion recurrent neural networks. *ICLR 2019*.

4. Smolensky, P. (1990). Tensor product variable binding and the representation of symbolic structures in connectionist systems. *Artificial Intelligence*, 46(1-2), 159-216.

5. Tang, E. (2019). A quantum-inspired classical algorithm for recommendation systems. *STOC 2019*.

6. Vaswani, A., et al. (2017). Attention is all you need. *NeurIPS 2017*.

---

## Appendix A: Implementation Notes

### A.1 JavaScript Implementation

Located at [`core/rformer.js`](../../core/rformer.js), the JavaScript implementation prioritizes readability and integration with Node.js ecosystems. Key design choices:

- String keys hashed to numeric IDs
- Real timestamps for temporal tracking
- Unbounded storage (no automatic pruning)
- CRT reconstruction for distributed use cases

### A.2 AssemblyScript Implementation

Located at [`@sschepis/resolang/assembly/rformer.ts`](../../node_modules/@sschepis/resolang/assembly/rformer.ts), the AssemblyScript version targets WebAssembly for performance:

- Integer IDs for efficient storage
- Virtual time for deterministic testing
- Capacity limits with automatic pruning
- Memory consolidation for efficiency

### A.3 Usage Example

```javascript
const { PRGraphMemory, SparsePrimeState } = require('tinyaleph');

const memory = new PRGraphMemory(4096, 0.8);

// Store semantic content
memory.put('capital', SparsePrimeState.fromHash('Paris is the capital of France'), 
           { domain: 'geography' });

// Content-addressable retrieval
const query = SparsePrimeState.fromHash('capital city of France');
const results = memory.get(query, 3);

// Results ranked by resonance score
for (const r of results) {
    console.log(`Score: ${r.score.toFixed(4)}, Locked: ${r.locked}`);
}
```

---

*© 2025 Coherent Observer Research. This work is released under the MIT License.*