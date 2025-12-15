/**
 * @example Prime Factorization
 * @description Explore prime numbers and factorization
 * 
 * Prime numbers are fundamental to TinyAleph:
 * - Words map to primes
 * - Products encode ordered sequences
 * - Unique factorization enables decoding
 */

const { SemanticBackend } = require('../../modular');

console.log('TinyAleph Prime Factorization Example');
console.log('=====================================\n');

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// PRIME BASICS
// ===========================================

console.log('Prime Number Basics:');
console.log('-'.repeat(50) + '\n');

console.log('A prime number is divisible only by 1 and itself.');
console.log('Fundamental Theorem: Every integer > 1 has unique prime factorization.\n');

// Generate primes using sieve
function sieveOfEratosthenes(limit) {
    var sieve = new Array(limit + 1).fill(true);
    sieve[0] = sieve[1] = false;
    
    for (var i = 2; i * i <= limit; i++) {
        if (sieve[i]) {
            for (var j = i * i; j <= limit; j += i) {
                sieve[j] = false;
            }
        }
    }
    
    var primes = [];
    for (var i = 2; i <= limit; i++) {
        if (sieve[i]) primes.push(i);
    }
    return primes;
}

var primes = sieveOfEratosthenes(100);
console.log('Primes up to 100:');
console.log('  ' + primes.join(', '));
console.log('  Count: ' + primes.length + ' primes\n');

// ===========================================
// PRIME FACTORIZATION
// ===========================================

console.log('='.repeat(50));
console.log('Prime Factorization:');
console.log('='.repeat(50) + '\n');

function factorize(n) {
    var factors = [];
    var d = 2;
    
    while (n > 1) {
        while (n % d === 0) {
            factors.push(d);
            n = n / d;
        }
        d++;
        if (d * d > n && n > 1) {
            factors.push(n);
            break;
        }
    }
    
    return factors;
}

function factorizationToString(factors) {
    var counts = {};
    for (var i = 0; i < factors.length; i++) {
        counts[factors[i]] = (counts[factors[i]] || 0) + 1;
    }
    
    var parts = [];
    for (var prime in counts) {
        if (counts.hasOwnProperty(prime)) {
            if (counts[prime] === 1) {
                parts.push(prime);
            } else {
                parts.push(prime + '^' + counts[prime]);
            }
        }
    }
    return parts.join(' × ');
}

var numbers = [12, 60, 100, 1001, 9999];

console.log('Prime factorizations:');
for (var i = 0; i < numbers.length; i++) {
    var n = numbers[i];
    var factors = factorize(n);
    console.log('  ' + n + ' = ' + factorizationToString(factors));
}

// ===========================================
// PRIMES IN TEXT ENCODING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Primes in Text Encoding:');
console.log('='.repeat(50) + '\n');

console.log('TinyAleph assigns primes to words:');
console.log('  - Each word token gets a unique prime');
console.log('  - Position encoded by prime powers');
console.log('  - Product uniquely identifies sequence\n');

var words = ['the', 'quick', 'brown', 'fox'];

console.log('Word to prime mapping:');
for (var i = 0; i < words.length; i++) {
    var primeArr = backend.encode(words[i]);
    console.log('  "' + words[i] + '" → prime ' + primeArr[0]);
}

// Show ordered encoding
var sentence = 'the quick brown fox';
var ordered = backend.encodeOrdered(sentence);
console.log('\nOrdered encoding of "' + sentence + '":');
console.log('  Primes: [' + ordered.join(', ') + ']');

// ===========================================
// PRIME PROPERTIES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Prime Properties:');
console.log('='.repeat(50) + '\n');

// Check if prime
function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (var i = 3; i * i <= n; i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

console.log('Primality testing:');
var testNumbers = [17, 91, 97, 100, 101];
for (var i = 0; i < testNumbers.length; i++) {
    var n = testNumbers[i];
    console.log('  ' + n + ': ' + (isPrime(n) ? 'prime' : 'composite'));
}

// Twin primes
console.log('\nTwin primes (differ by 2):');
var twins = [];
for (var i = 0; i < primes.length - 1 && twins.length < 5; i++) {
    if (primes[i + 1] - primes[i] === 2) {
        twins.push('(' + primes[i] + ', ' + primes[i + 1] + ')');
    }
}
console.log('  ' + twins.join(', '));

// ===========================================
// GCD AND LCM
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('GCD and LCM:');
console.log('='.repeat(50) + '\n');

function gcd(a, b) {
    while (b !== 0) {
        var t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

var pairs = [[12, 18], [35, 49], [100, 60]];

console.log('GCD and LCM examples:');
for (var i = 0; i < pairs.length; i++) {
    var a = pairs[i][0];
    var b = pairs[i][1];
    console.log('  GCD(' + a + ', ' + b + ') = ' + gcd(a, b));
    console.log('  LCM(' + a + ', ' + b + ') = ' + lcm(a, b));
    console.log('');
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Primes are building blocks of integers');
console.log('2. Every integer has unique prime factorization');
console.log('3. TinyAleph maps words to primes');
console.log('4. Products encode ordered sequences');
console.log('5. Factorization enables structure analysis');
console.log('6. Prime properties underpin cryptography');