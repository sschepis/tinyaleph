/**
 * @example Password Hashing
 * @description Securely hash passwords using TinyAleph's cryptographic backend
 * 
 * TinyAleph provides cryptographic hashing that:
 * - Creates deterministic hashes from input
 * - Is one-way (cannot reverse to get original)
 * - Has configurable output length
 */

const { CryptographicBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new CryptographicBackend({ dimension: 32 });

console.log('TinyAleph Password Hashing Example');
console.log('===================================\n');

// ===========================================
// BASIC PASSWORD HASHING
// ===========================================

console.log('Basic Password Hashing:');
console.log('-'.repeat(50) + '\n');

var passwords = [
    'password123',
    'SecureP@ss!',
    'MySecret2024',
    'hunter2'
];

console.log('Password                 Hash (first 32 chars)');
console.log('-'.repeat(60));

for (var i = 0; i < passwords.length; i++) {
    var password = passwords[i];
    var hash = backend.hash(password);
    var hashHex = hash.toString('hex');
    console.log(password.padEnd(25) + hashHex.substring(0, 32) + '...');
}

// ===========================================
// HASH VERIFICATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Password Verification:');
console.log('='.repeat(50) + '\n');

function verifyPassword(password, storedHash) {
    var computedHash = backend.hash(password);
    return computedHash.toString('hex') === storedHash;
}

// Store a password hash
var originalPassword = 'MySecretPassword';
var storedHash = backend.hash(originalPassword).toString('hex');

console.log('Stored hash: ' + storedHash.substring(0, 40) + '...\n');

// Test verification
var testPasswords = [
    'MySecretPassword',  // Correct
    'mysecretpassword',  // Wrong case
    'MySecretPassword ', // Trailing space
    'WrongPassword'      // Completely wrong
];

console.log('Verification results:');
for (var i = 0; i < testPasswords.length; i++) {
    var testPwd = testPasswords[i];
    var isValid = verifyPassword(testPwd, storedHash);
    var status = isValid ? 'VALID' : 'INVALID';
    console.log('  "' + testPwd + '" -> ' + status);
}

// ===========================================
// HASH PROPERTIES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Hash Properties:');
console.log('='.repeat(50) + '\n');

// Determinism
console.log('1. Determinism (same input = same output):');
var hash1 = backend.hash('test').toString('hex');
var hash2 = backend.hash('test').toString('hex');
console.log('   Hash 1: ' + hash1.substring(0, 32));
console.log('   Hash 2: ' + hash2.substring(0, 32));
console.log('   Equal: ' + (hash1 === hash2));

// Avalanche effect
console.log('\n2. Avalanche Effect (small change = big difference):');
var similar1 = backend.hash('password').toString('hex');
var similar2 = backend.hash('Password').toString('hex');
var similar3 = backend.hash('password1').toString('hex');

console.log('   "password"  -> ' + similar1.substring(0, 24));
console.log('   "Password"  -> ' + similar2.substring(0, 24));
console.log('   "password1" -> ' + similar3.substring(0, 24));

// Count differing characters
function countDiff(a, b) {
    var diff = 0;
    for (var i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) diff++;
    }
    return diff;
}

console.log('   Difference (p vs P): ' + countDiff(similar1, similar2) + ' chars');
console.log('   Difference (p vs p1): ' + countDiff(similar1, similar3) + ' chars');

// ===========================================
// CONFIGURABLE OUTPUT LENGTH
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Configurable Hash Length:');
console.log('='.repeat(50) + '\n');

var input = 'SampleInput';
var lengths = [16, 32, 64, 128];

for (var l = 0; l < lengths.length; l++) {
    var len = lengths[l];
    var hash = backend.hash(input, len);
    console.log(len + ' bytes: ' + hash.toString('hex').substring(0, 40) + (len > 20 ? '...' : ''));
}

// ===========================================
// TIMING ATTACK RESISTANCE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Constant-Time Comparison:');
console.log('='.repeat(50) + '\n');

// Use constant-time comparison to prevent timing attacks
function constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;
    
    var result = 0;
    for (var i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

var storedHashStr = backend.hash('secret').toString('hex');
var correctAttempt = backend.hash('secret').toString('hex');
var wrongAttempt = backend.hash('wrong').toString('hex');

console.log('Constant-time comparison prevents timing attacks:');
console.log('  Correct password: ' + constantTimeCompare(storedHashStr, correctAttempt));
console.log('  Wrong password:   ' + constantTimeCompare(storedHashStr, wrongAttempt));

// ===========================================
// SALT USAGE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Using Salts:');
console.log('='.repeat(50) + '\n');

function hashWithSalt(password, salt) {
    return backend.hash(salt + password);
}

function generateSalt() {
    // In production, use crypto.randomBytes
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var salt = '';
    for (var i = 0; i < 16; i++) {
        salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
}

var password = 'CommonPassword';
var salt1 = generateSalt();
var salt2 = generateSalt();

var salted1 = hashWithSalt(password, salt1).toString('hex');
var salted2 = hashWithSalt(password, salt2).toString('hex');

console.log('Same password with different salts:');
console.log('  Salt 1: ' + salt1);
console.log('  Hash 1: ' + salted1.substring(0, 32) + '...');
console.log('  Salt 2: ' + salt2);
console.log('  Hash 2: ' + salted2.substring(0, 32) + '...');
console.log('  Different: ' + (salted1 !== salted2));

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Hash passwords before storing them');
console.log('2. Use salts to prevent rainbow table attacks');
console.log('3. Use constant-time comparison for security');
console.log('4. Hashes are deterministic but one-way');
console.log('5. Small input changes cause large hash changes');
console.log('6. Configure output length based on security needs');