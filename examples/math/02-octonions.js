/**
 * @example Octonions
 * @description Explore 8-dimensional hypercomplex algebra
 * 
 * Octonions are 8-dimensional hypercomplex numbers:
 * - Extension of quaternions
 * - Non-associative multiplication
 * - Related to exceptional Lie groups
 */

const { Hypercomplex } = require('../../modular');

console.log('TinyAleph Octonion Example');
console.log('==========================\n');

// ===========================================
// OCTONION BASICS
// ===========================================

console.log('Octonion Basics:');
console.log('-'.repeat(50) + '\n');

console.log('Octonions: o = a₀ + a₁e₁ + a₂e₂ + a₃e₃ + a₄e₄ + a₅e₅ + a₆e₆ + a₇e₇');
console.log('8-dimensional hypercomplex numbers with 7 imaginary units.\n');

console.log('Hierarchy of hypercomplex numbers:');
console.log('  Real (1D) → Complex (2D) → Quaternions (4D) → Octonions (8D)\n');

// Create octonion using Hypercomplex with dimension 8
function createOctonion(components) {
    var o = Hypercomplex.zero(8);
    for (var i = 0; i < Math.min(components.length, 8); i++) {
        o.c[i] = components[i];
    }
    return o;
}

function octonionToString(o) {
    var parts = [];
    var labels = ['', 'e₁', 'e₂', 'e₃', 'e₄', 'e₅', 'e₆', 'e₇'];
    
    for (var i = 0; i < 8; i++) {
        if (Math.abs(o.c[i]) > 0.0001) {
            if (i === 0) {
                parts.push(o.c[i].toFixed(2));
            } else {
                parts.push(o.c[i].toFixed(2) + labels[i]);
            }
        }
    }
    return parts.length > 0 ? parts.join(' + ').replace(/\+ -/g, '- ') : '0';
}

var o1 = createOctonion([1, 2, 0, 0, 1, 0, 0, 0]);
var o2 = createOctonion([0, 1, 1, 0, 0, 1, 0, 1]);

console.log('o1 = ' + octonionToString(o1));
console.log('o2 = ' + octonionToString(o2));

// ===========================================
// OCTONION OPERATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Octonion Operations:');
console.log('='.repeat(50) + '\n');

// Addition
function octonionAdd(o1, o2) {
    var result = Hypercomplex.zero(8);
    for (var i = 0; i < 8; i++) {
        result.c[i] = o1.c[i] + o2.c[i];
    }
    return result;
}

var sum = octonionAdd(o1, o2);
console.log('Addition:');
console.log('  o1 + o2 = ' + octonionToString(sum));

// Conjugate
function octonionConjugate(o) {
    var result = Hypercomplex.zero(8);
    result.c[0] = o.c[0];
    for (var i = 1; i < 8; i++) {
        result.c[i] = -o.c[i];
    }
    return result;
}

var conj = octonionConjugate(o1);
console.log('\nConjugate:');
console.log('  o1* = ' + octonionToString(conj));

// Norm
function octonionNorm(o) {
    var sum = 0;
    for (var i = 0; i < 8; i++) {
        sum += o.c[i] * o.c[i];
    }
    return Math.sqrt(sum);
}

console.log('\nNorm:');
console.log('  |o1| = ' + octonionNorm(o1).toFixed(4));
console.log('  |o2| = ' + octonionNorm(o2).toFixed(4));

// ===========================================
// OCTONION MULTIPLICATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Octonion Multiplication:');
console.log('='.repeat(50) + '\n');

console.log('Octonion multiplication is:');
console.log('  - Non-commutative: o1 * o2 ≠ o2 * o1');
console.log('  - Non-associative: (o1 * o2) * o3 ≠ o1 * (o2 * o3)');
console.log('  - Alternative: o * (o * x) = o² * x\n');

// Fano plane multiplication table for octonions
// This encodes the multiplication rules for e1...e7
var fanoMul = [
    [1, 2, 3, 4, 5, 6, 7],  // e1 * en
    [2, -1, 4, -3, 6, -5, -8],
    [3, -4, -1, 2, 7, 8, -5],
    [4, 3, -2, -1, 8, -7, 6],
    [5, -6, -7, -8, -1, 2, 3],
    [6, 5, -8, 7, -2, -1, -4],
    [7, 8, 5, -6, -3, 4, -1]
];

console.log('Octonion multiplication uses the Fano plane structure.');
console.log('This defines the relationships between the 7 imaginary units.\n');

// Simplified multiplication (demonstrating non-associativity)
var e1 = createOctonion([0, 1, 0, 0, 0, 0, 0, 0]);
var e2 = createOctonion([0, 0, 1, 0, 0, 0, 0, 0]);
var e4 = createOctonion([0, 0, 0, 0, 1, 0, 0, 0]);

console.log('Basis elements:');
console.log('  e1 = ' + octonionToString(e1));
console.log('  e2 = ' + octonionToString(e2));
console.log('  e4 = ' + octonionToString(e4));

// ===========================================
// NORMED DIVISION ALGEBRAS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Normed Division Algebras:');
console.log('='.repeat(50) + '\n');

console.log('There are only 4 normed division algebras:');
console.log('  1. Real numbers (R) - 1D');
console.log('  2. Complex numbers (C) - 2D');
console.log('  3. Quaternions (H) - 4D');
console.log('  4. Octonions (O) - 8D\n');

console.log('As dimensions increase, we lose properties:');
console.log('  R: commutative, associative, ordered');
console.log('  C: commutative, associative, not ordered');
console.log('  H: not commutative, associative');
console.log('  O: not commutative, not associative');

// ===========================================
// APPLICATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Octonion Applications:');
console.log('='.repeat(50) + '\n');

console.log('Despite being exotic, octonions appear in:');
console.log('  - String theory and M-theory');
console.log('  - Exceptional Lie groups (G2, F4, E6, E7, E8)');
console.log('  - Bott periodicity theorem');
console.log('  - Supersymmetry');
console.log('  - Some approaches to quantum gravity\n');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Octonions are 8D hypercomplex numbers');
console.log('2. Multiplication is non-associative');
console.log('3. Last of the normed division algebras');
console.log('4. Related to exceptional mathematical structures');
console.log('5. Applications in theoretical physics');
console.log('6. TinyAleph dimension=8 represents octonions');