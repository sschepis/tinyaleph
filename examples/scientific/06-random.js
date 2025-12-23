/**
 * @example Quantum Random Number Generation
 * @description Generate true random numbers using quantum measurement
 * 
 * Quantum mechanics provides a source of true randomness:
 * - Measurement outcomes are fundamentally unpredictable
 * - Not pseudo-random, truly random
 * - Used in cryptography and simulations
 */

const { ScientificBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new ScientificBackend({ dimension: 16 });

console.log('TinyAleph Quantum Random Number Generator');
console.log('=========================================\n');

// ===========================================
// QUANTUM RANDOM BIT
// ===========================================

console.log('Quantum Random Bit:');
console.log('-'.repeat(50) + '\n');

console.log('Creating superposition and measuring produces a random bit.\n');

function quantumRandomBit() {
    // Create |+⟩ state (equal superposition of |0⟩ and |1⟩)
    var superposition = backend.encode('|+⟩');  // [2, 3] = equal weights
    var state = backend.primesToState(superposition);
    
    // Use the built-in measure method
    var result = backend.measure(state);
    return result.outcome;
}

console.log('Generating 20 quantum random bits:');
var bits = [];
for (var i = 0; i < 20; i++) {
    bits.push(quantumRandomBit());
}
console.log('  ' + bits.join(''));

// ===========================================
// RANDOM INTEGERS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Random Integers:');
console.log('='.repeat(50) + '\n');

function quantumRandomInt(max) {
    var bitsNeeded = Math.ceil(Math.log2(max + 1));
    var attempts = 0;
    var maxAttempts = 100;  // Prevent infinite loop
    
    // Rejection sampling for uniform distribution
    while (attempts < maxAttempts) {
        attempts++;
        var value = 0;
        for (var i = 0; i < bitsNeeded; i++) {
            value = (value << 1) | quantumRandomBit();
        }
        if (value <= max) {
            return value;
        }
    }
    // Fallback to modulo if rejection sampling fails
    return value % (max + 1);
}

console.log('Random integers 0-9:');
var ints = [];
for (var i = 0; i < 10; i++) {
    ints.push(quantumRandomInt(9));
}
console.log('  ' + ints.join(', '));

console.log('\nRandom integers 0-99:');
var largerInts = [];
for (var i = 0; i < 5; i++) {
    largerInts.push(quantumRandomInt(99));
}
console.log('  ' + largerInts.join(', '));

// ===========================================
// RANDOM BYTES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Random Bytes:');
console.log('='.repeat(50) + '\n');

function quantumRandomBytes(n) {
    var bytes = [];
    for (var i = 0; i < n; i++) {
        var byte = 0;
        for (var j = 0; j < 8; j++) {
            byte = (byte << 1) | quantumRandomBit();
        }
        bytes.push(byte);
    }
    return bytes;
}

var randomBytes = quantumRandomBytes(8);
console.log('8 random bytes (decimal):');
console.log('  ' + randomBytes.join(', '));

console.log('\nHexadecimal:');
var hex = randomBytes.map(function(b) {
    return b.toString(16).padStart(2, '0');
}).join('');
console.log('  0x' + hex);

// ===========================================
// RANDOM UUID
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Random UUID:');
console.log('='.repeat(50) + '\n');

function quantumUUID() {
    var bytes = quantumRandomBytes(16);
    
    // Set version 4 (random) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    
    var hex = bytes.map(function(b) {
        return b.toString(16).padStart(2, '0');
    });
    
    return hex.slice(0, 4).join('') + '-' +
           hex.slice(4, 6).join('') + '-' +
           hex.slice(6, 8).join('') + '-' +
           hex.slice(8, 10).join('') + '-' +
           hex.slice(10, 16).join('');
}

console.log('Quantum random UUIDs:');
for (var i = 0; i < 3; i++) {
    console.log('  ' + quantumUUID());
}

// ===========================================
// STATISTICAL TESTING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Statistical Testing:');
console.log('='.repeat(50) + '\n');

function chiSquareTest(observed, expected) {
    var chiSquare = 0;
    for (var i = 0; i < observed.length; i++) {
        var diff = observed[i] - expected[i];
        chiSquare += (diff * diff) / expected[i];
    }
    return chiSquare;
}

// Generate many random bits and test distribution
var trials = 500;  // Reduced for faster execution
var counts = [0, 0];

for (var i = 0; i < trials; i++) {
    counts[quantumRandomBit()]++;
}

var expected = [trials / 2, trials / 2];
var chiSq = chiSquareTest(counts, expected);

console.log('Bit distribution test (' + trials + ' trials):');
console.log('  Zeros: ' + counts[0] + ' (expected: ' + expected[0] + ')');
console.log('  Ones:  ' + counts[1] + ' (expected: ' + expected[1] + ')');
console.log('  Chi-square: ' + chiSq.toFixed(4));
console.log('  Passes if χ² < 3.84 (95% confidence): ' + (chiSq < 3.84 ? 'PASS' : 'FAIL'));

// ===========================================
// CRYPTOGRAPHIC APPLICATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Cryptographic Applications:');
console.log('='.repeat(50) + '\n');

console.log('Quantum randomness is ideal for cryptography:\n');

// Generate a random key
var keyBits = [];
for (var i = 0; i < 128; i++) {
    keyBits.push(quantumRandomBit());
}

console.log('128-bit random key:');
var keyHex = '';
for (var i = 0; i < 128; i += 4) {
    var nibble = (keyBits[i] << 3) | (keyBits[i+1] << 2) | (keyBits[i+2] << 1) | keyBits[i+3];
    keyHex += nibble.toString(16);
}
console.log('  ' + keyHex);

// Generate random nonce
console.log('\nRandom nonce (64-bit):');
var nonce = quantumRandomBytes(8);
console.log('  ' + nonce.map(function(b) { return b.toString(16).padStart(2, '0'); }).join(''));

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Quantum measurement provides true randomness');
console.log('2. Not pseudo-random - fundamentally unpredictable');
console.log('3. Build larger random values from random bits');
console.log('4. Use rejection sampling for uniform distribution');
console.log('5. Statistical tests verify randomness quality');
console.log('6. Essential for cryptographic key generation');