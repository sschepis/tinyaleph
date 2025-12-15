/**
 * @example Gaussian Integers and Primes
 * @description Explore primes in the complex number field
 * 
 * Gaussian integers are complex numbers a + bi where a, b are integers:
 * - Form a unique factorization domain
 * - Gaussian primes differ from regular primes
 * - Related to sums of two squares
 */

const { Hypercomplex } = require('../../modular');

console.log('TinyAleph Gaussian Primes Example');
console.log('==================================\n');

// ===========================================
// GAUSSIAN INTEGER BASICS
// ===========================================

console.log('Gaussian Integer Basics:');
console.log('-'.repeat(50) + '\n');

console.log('Gaussian integers Z[i] = {a + bi : a, b ∈ Z}');
console.log('Form a ring with unique factorization.\n');

function createGaussian(a, b) {
    var g = Hypercomplex.zero(2);
    g.c[0] = a;
    g.c[1] = b;
    return g;
}

function gaussianToString(g) {
    var a = g.c[0];
    var b = g.c[1];
    
    if (b === 0) return a.toString();
    if (a === 0) return b === 1 ? 'i' : b === -1 ? '-i' : b + 'i';
    
    var sign = b > 0 ? ' + ' : ' - ';
    var bAbs = Math.abs(b);
    return a + sign + (bAbs === 1 ? '' : bAbs) + 'i';
}

var g1 = createGaussian(3, 4);
var g2 = createGaussian(2, -1);

console.log('Examples:');
console.log('  g1 = ' + gaussianToString(g1));
console.log('  g2 = ' + gaussianToString(g2));

// ===========================================
// GAUSSIAN OPERATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Gaussian Integer Operations:');
console.log('='.repeat(50) + '\n');

// Addition
function gaussianAdd(g1, g2) {
    return createGaussian(g1.c[0] + g2.c[0], g1.c[1] + g2.c[1]);
}

var sum = gaussianAdd(g1, g2);
console.log('Addition:');
console.log('  g1 + g2 = ' + gaussianToString(sum));

// Multiplication: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
function gaussianMul(g1, g2) {
    var a = g1.c[0], b = g1.c[1];
    var c = g2.c[0], d = g2.c[1];
    return createGaussian(a*c - b*d, a*d + b*c);
}

var prod = gaussianMul(g1, g2);
console.log('\nMultiplication:');
console.log('  g1 * g2 = ' + gaussianToString(prod));

// Conjugate
function gaussianConjugate(g) {
    return createGaussian(g.c[0], -g.c[1]);
}

var conj = gaussianConjugate(g1);
console.log('\nConjugate:');
console.log('  g1* = ' + gaussianToString(conj));

// Norm: N(a + bi) = a² + b²
function gaussianNorm(g) {
    return g.c[0] * g.c[0] + g.c[1] * g.c[1];
}

console.log('\nNorm:');
console.log('  N(g1) = ' + g1.c[0] + '² + ' + g1.c[1] + '² = ' + gaussianNorm(g1));
console.log('  N(g2) = ' + gaussianNorm(g2));

// ===========================================
// GAUSSIAN PRIMES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Gaussian Primes:');
console.log('='.repeat(50) + '\n');

console.log('A Gaussian integer π is prime if:');
console.log('  - It has norm > 1');
console.log('  - It cannot be written as αβ where N(α), N(β) > 1\n');

console.log('Three types of Gaussian primes:');
console.log('  1. 1 + i (and associates) - norm 2');
console.log('  2. a + bi where a² + b² = p (p ≡ 1 mod 4)');
console.log('  3. p (rational prime where p ≡ 3 mod 4)\n');

// Check if a Gaussian integer is prime
function isGaussianPrime(g) {
    var norm = gaussianNorm(g);
    
    if (norm < 2) return false;
    if (norm === 2) return true;  // 1 + i and associates
    
    // Check if norm is prime
    function isPrime(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (var i = 3; i * i <= n; i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    }
    
    if (isPrime(norm)) return true;
    
    // If on real axis, check if it's p with p ≡ 3 mod 4
    if (g.c[1] === 0) {
        var p = Math.abs(g.c[0]);
        return isPrime(p) && p % 4 === 3;
    }
    
    return false;
}

var testGaussians = [
    createGaussian(1, 1),   // Prime (norm 2)
    createGaussian(2, 1),   // Prime (norm 5)
    createGaussian(3, 0),   // Prime (3 ≡ 3 mod 4)
    createGaussian(2, 0),   // Not prime (2 = (1+i)(1-i))
    createGaussian(1, 2),   // Prime (norm 5)
    createGaussian(5, 0)    // Not prime (5 ≡ 1 mod 4)
];

console.log('Testing for Gaussian primality:');
for (var i = 0; i < testGaussians.length; i++) {
    var g = testGaussians[i];
    var isPrime = isGaussianPrime(g);
    console.log('  ' + gaussianToString(g).padEnd(8) + ' (norm ' + gaussianNorm(g) + '): ' + (isPrime ? 'PRIME' : 'composite'));
}

// ===========================================
// FACTORING IN Z[i]
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Factoring in Z[i]:');
console.log('='.repeat(50) + '\n');

console.log('Regular primes split differently in Z[i]:\n');

console.log('  2 = (1+i)(1-i) = -i(1+i)²   [ramified]');
console.log('  5 = (2+i)(2-i)              [splits]');
console.log('  13 = (3+2i)(3-2i)           [splits]');
console.log('  3 stays prime              [inert]');
console.log('  7 stays prime              [inert]\n');

// Factorize 5 in Z[i]
var factor1 = createGaussian(2, 1);
var factor2 = createGaussian(2, -1);
var product = gaussianMul(factor1, factor2);

console.log('Verification: (2+i)(2-i) = ' + gaussianToString(product));

// ===========================================
// SUMS OF TWO SQUARES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Sums of Two Squares:');
console.log('='.repeat(50) + '\n');

console.log('A positive integer n is a sum of two squares iff:');
console.log('  Every prime p ≡ 3 (mod 4) dividing n has even exponent.\n');

function sumOfTwoSquares(n) {
    var solutions = [];
    var limit = Math.floor(Math.sqrt(n));
    
    for (var a = 0; a <= limit; a++) {
        var bSquared = n - a * a;
        var b = Math.floor(Math.sqrt(bSquared));
        if (b * b === bSquared && a <= b) {
            solutions.push([a, b]);
        }
    }
    
    return solutions;
}

var numbers = [5, 10, 13, 25, 50, 65];

console.log('Expressing numbers as sums of two squares:');
for (var i = 0; i < numbers.length; i++) {
    var n = numbers[i];
    var solutions = sumOfTwoSquares(n);
    if (solutions.length > 0) {
        var strs = solutions.map(function(s) {
            return s[0] + '² + ' + s[1] + '²';
        });
        console.log('  ' + n + ' = ' + strs.join(' = '));
    }
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Gaussian integers extend primes to complex plane');
console.log('2. Norm N(a+bi) = a² + b² determines divisibility');
console.log('3. Regular primes split, ramify, or stay inert');
console.log('4. Related to expressing integers as sums of squares');
console.log('5. Unique factorization holds in Z[i]');
console.log('6. TinyAleph dimension=2 represents complex numbers');