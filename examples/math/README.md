# Math Examples

This directory contains examples demonstrating TinyAleph's mathematical capabilities.

## Examples

### 01-quaternions.js
**Quaternion Algebra** - Explore 4D hypercomplex numbers for 3D rotations.

```bash
node examples/math/01-quaternions.js
```

### 02-octonions.js
**Octonion Algebra** - Explore 8D hypercomplex numbers and non-associative algebra.

```bash
node examples/math/02-octonions.js
```

### 03-prime-factorization.js
**Prime Factorization** - Explore prime numbers and unique factorization.

```bash
node examples/math/03-prime-factorization.js
```

### 04-vector-spaces.js
**Vector Spaces** - Explore vector space operations and linear algebra.

```bash
node examples/math/04-vector-spaces.js
```

### 05-gaussian-primes.js
**Gaussian Primes** - Explore primes in the complex number field.

```bash
node examples/math/05-gaussian-primes.js
```

## Key Concepts

### Hypercomplex Numbers
Extensions of complex numbers to higher dimensions:
- **Complex (2D)**: a + bi
- **Quaternions (4D)**: a + bi + cj + dk
- **Octonions (8D)**: 8 components, non-associative

### Properties Lost by Dimension
As dimensions increase, we lose mathematical properties:
| Algebra | Dim | Commutative | Associative | Ordered |
|---------|-----|-------------|-------------|---------|
| Real | 1 | ✓ | ✓ | ✓ |
| Complex | 2 | ✓ | ✓ | ✗ |
| Quaternion | 4 | ✗ | ✓ | ✗ |
| Octonion | 8 | ✗ | ✗ | ✗ |

### Prime Numbers
Fundamental to TinyAleph's encoding:
- Unique factorization theorem
- Words map to primes
- Gaussian primes extend to complex plane

### Vector Spaces
Hypercomplex numbers form vector spaces:
- Addition and scalar multiplication
- Basis vectors and dimension
- Inner products and orthogonality

## Usage Pattern

```javascript
const { Hypercomplex } = require('../../modular');

// Create hypercomplex number
const h = Hypercomplex.zero(4);  // Quaternion
h.c[0] = 1;  // Real part
h.c[1] = 2;  // i component
h.c[2] = 3;  // j component
h.c[3] = 4;  // k component

// Operations
console.log('Norm:', h.norm());
const normalized = h.normalize();
```

## Next Steps

After understanding the mathematics, explore:
- `../physics/` - Physics simulations
- `../scientific/` - Quantum computing
- `../semantic/` - Semantic processing