/**
 * @example Basic Hashing
 * @description Hash a password or message in 3 lines
 * 
 * This example shows how to use TinyAleph's cryptographic backend
 * for secure hashing. The hypercomplex hash is:
 * - Deterministic (same input = same output)
 * - One-way (cannot reverse to get original)
 * - Collision-resistant (different inputs = different outputs)
 */

const { CryptographicBackend, hash } = require('../modular');

// ===========================================
// SETUP
// ===========================================

// Use the convenience hash function (quickest way)
// Or create a backend for more control
const backend = new CryptographicBackend({ dimension: 32 });

// ===========================================
// EXAMPLE CODE
// ===========================================

// Hash a password in 3 lines using convenience function
const password = "MySecretPassword123!";
const quickHash = hash(password, 32);

// Or use backend directly for more control
const hashBuffer = backend.hash(password, 64);
const hashHex = hashBuffer.toString('hex');

// ===========================================
// OUTPUT
// ===========================================

console.log('TinyAleph Basic Hashing Example');
console.log('================================\n');

console.log('Password:', password);
console.log('\nQuick hash (convenience function):');
console.log(' ', quickHash.toString('hex').substring(0, 64) + '...');

console.log('\nHash (from backend, 64 bytes):');
console.log(' ', hashHex.substring(0, 64) + '...');
console.log('  Length:', hashHex.length, 'hex characters');

// Verify: same password produces same hash
const hashAgain = backend.hash(password, 64).toString('hex');
console.log('\nVerification (hash same password again):');
console.log('  Match:', hashAgain === hashHex ? 'YES ✓' : 'NO ✗');

// Different password produces different hash
const differentHash = backend.hash("DifferentPassword", 64).toString('hex');
console.log('\nDifferent password produces different hash:');
console.log('  Match:', differentHash === hashHex ? 'YES (bad!)' : 'NO ✓');

// ===========================================
// PASSWORD VERIFICATION PATTERN
// ===========================================

console.log('\n================================');
console.log('PASSWORD VERIFICATION PATTERN:');
console.log('================================\n');

// Store this hash (not the password!)
const storedHash = backend.hash("UserPassword123", 64).toString('hex');
console.log('Stored hash:', storedHash.substring(0, 32) + '...');

// Later, verify login attempt
function verifyPassword(attempt) {
    const attemptHash = backend.hash(attempt, 64).toString('hex');
    return attemptHash === storedHash;
}

console.log('Verify "UserPassword123":', verifyPassword("UserPassword123") ? 'PASS ✓' : 'FAIL');
console.log('Verify "WrongPassword":', verifyPassword("WrongPassword") ? 'PASS' : 'FAIL ✓');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n================================');
console.log('KEY TAKEAWAYS:');
console.log('1. hash() convenience function for quick hashing');
console.log('2. CryptographicBackend for more control');
console.log('3. Same input always produces the same hash (deterministic)');
console.log('4. Different inputs produce different hashes (collision-resistant)');
console.log('5. Store hashes, never plaintext passwords!');