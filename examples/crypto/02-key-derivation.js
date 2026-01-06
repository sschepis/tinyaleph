/**
 * @example Key Derivation
 * @description Derive cryptographic keys from passwords using TinyAleph
 * 
 * Key derivation functions (KDFs) create strong cryptographic keys from
 * potentially weak passwords. TinyAleph's deriveKey function:
 * - Uses salt to prevent rainbow table attacks
 * - Supports configurable iterations for work factor
 * - Produces keys of specified length
 */

const { CryptographicBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new CryptographicBackend({ dimension: 32 });

console.log('TinyAleph Key Derivation Example');
console.log('=================================\n');

// ===========================================
// BASIC KEY DERIVATION
// ===========================================

console.log('Basic Key Derivation:');
console.log('-'.repeat(50) + '\n');

var password = 'MySecretPassword123';
var salt = 'randomsalt12345678';
var keyLength = 32;
var iterations = 1000;

console.log('Input:');
console.log('  Password: ' + password);
console.log('  Salt: ' + salt);
console.log('  Key Length: ' + keyLength + ' bytes');
console.log('  Iterations: ' + iterations);

var derivedKey = backend.deriveKey(password, salt, keyLength, iterations);
console.log('\nDerived Key (hex): ' + derivedKey.toString('hex'));

// ===========================================
// SALT IMPORTANCE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Salt Importance:');
console.log('='.repeat(50) + '\n');

console.log('Same password with different salts produces different keys:\n');

var salts = ['salt_user_1', 'salt_user_2', 'salt_user_3'];

for (var i = 0; i < salts.length; i++) {
    var s = salts[i];
    var key = backend.deriveKey(password, s, 32, 1000);
    console.log('  Salt: "' + s + '"');
    console.log('  Key:  ' + key.toString('hex').substring(0, 40) + '...\n');
}

// ===========================================
// ITERATION COUNT
// ===========================================

console.log('='.repeat(50));
console.log('Iteration Count (Work Factor):');
console.log('='.repeat(50) + '\n');

console.log('Higher iterations = more secure but slower:\n');

var iterCounts = [100, 1000, 10000];

for (var i = 0; i < iterCounts.length; i++) {
    var count = iterCounts[i];
    var start = Date.now();
    var key = backend.deriveKey(password, salt, 32, count);
    var elapsed = Date.now() - start;
    
    console.log('  Iterations: ' + count);
    console.log('  Time: ' + elapsed + 'ms');
    console.log('  Key: ' + key.toString('hex').substring(0, 32) + '...\n');
}

// ===========================================
// KEY LENGTH VARIATIONS
// ===========================================

console.log('='.repeat(50));
console.log('Variable Key Lengths:');
console.log('='.repeat(50) + '\n');

console.log('Derive keys of different lengths for different purposes:\n');

var keyPurposes = [
    { name: 'AES-128', length: 16 },
    { name: 'AES-256', length: 32 },
    { name: 'HMAC-SHA256', length: 32 },
    { name: 'ChaCha20', length: 32 }
];

for (var i = 0; i < keyPurposes.length; i++) {
    var purpose = keyPurposes[i];
    var key = backend.deriveKey(password, salt, purpose.length, 1000);
    console.log('  ' + purpose.name + ' (' + purpose.length + ' bytes):');
    console.log('  ' + key.toString('hex'));
    console.log('');
}

// ===========================================
// MULTIPLE KEYS FROM ONE PASSWORD
// ===========================================

console.log('='.repeat(50));
console.log('Deriving Multiple Keys:');
console.log('='.repeat(50) + '\n');

console.log('Use different salts or purposes to derive multiple keys:\n');

function deriveMultipleKeys(password, masterSalt, keySpecs) {
    var keys = {};
    for (var i = 0; i < keySpecs.length; i++) {
        var spec = keySpecs[i];
        var specificSalt = masterSalt + ':' + spec.purpose;
        keys[spec.purpose] = backend.deriveKey(password, specificSalt, spec.length, 1000);
    }
    return keys;
}

var keySpecs = [
    { purpose: 'encryption', length: 32 },
    { purpose: 'authentication', length: 32 },
    { purpose: 'signing', length: 64 }
];

var keys = deriveMultipleKeys(password, 'master_salt', keySpecs);

for (var purpose in keys) {
    if (keys.hasOwnProperty(purpose)) {
        console.log('  ' + purpose + ': ' + keys[purpose].toString('hex').substring(0, 40) + '...');
    }
}

// ===========================================
// PASSWORD STRENGTH
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Password Strength Consideration:');
console.log('='.repeat(50) + '\n');

console.log('Even with KDF, use strong passwords:\n');

var testPasswords = [
    { pwd: '123456', strength: 'Very Weak' },
    { pwd: 'password', strength: 'Weak' },
    { pwd: 'MyP@ss!', strength: 'Medium' },
    { pwd: 'Tr0ub4dor&3', strength: 'Strong' },
    { pwd: 'correct-horse-battery-staple', strength: 'Very Strong' }
];

for (var i = 0; i < testPasswords.length; i++) {
    var test = testPasswords[i];
    var key = backend.deriveKey(test.pwd, salt, 32, 1000);
    console.log('  "' + test.pwd + '" (' + test.strength + ')');
    console.log('  Key: ' + key.toString('hex').substring(0, 32) + '...\n');
}

// ===========================================
// KEY VERIFICATION
// ===========================================

console.log('='.repeat(50));
console.log('Key Verification:');
console.log('='.repeat(50) + '\n');

console.log('Store salt and verify derived key matches:\n');

// "Store" the salt and a verification hash
var storedSalt = 'user_specific_salt_123';
var masterPassword = 'UserMasterPassword';
var storedVerifier = backend.deriveKey(masterPassword, storedSalt + ':verify', 16, 1000);

console.log('Stored Salt: ' + storedSalt);
console.log('Stored Verifier: ' + storedVerifier.toString('hex') + '\n');

// Attempt verification
var attempts = ['UserMasterPassword', 'WrongPassword', 'usermasterpassword'];

for (var i = 0; i < attempts.length; i++) {
    var attempt = attempts[i];
    var computedVerifier = backend.deriveKey(attempt, storedSalt + ':verify', 16, 1000);
    var isValid = computedVerifier.toString('hex') === storedVerifier.toString('hex');
    
    console.log('  "' + attempt + '" -> ' + (isValid ? 'VALID' : 'INVALID'));
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Always use a unique salt per user/purpose');
console.log('2. Increase iterations for stronger security');
console.log('3. Derive multiple keys using different salts');
console.log('4. Higher iterations = more time = harder to brute force');
console.log('5. Key derivation cannot fix weak passwords');
console.log('6. Store salt with derived key (salt is not secret)');