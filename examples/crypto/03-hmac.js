/**
 * @example HMAC (Hash-based Message Authentication Code)
 * @description Create message authentication codes with TinyAleph
 * 
 * HMAC combines a secret key with a message to create an authentication code:
 * - Verifies message integrity (not tampered)
 * - Verifies message authenticity (from expected sender)
 * - Uses a shared secret key
 */

const { CryptographicBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new CryptographicBackend({ dimension: 32 });

console.log('TinyAleph HMAC Example');
console.log('======================\n');

// ===========================================
// HMAC IMPLEMENTATION
// ===========================================

function hmac(key, message, outputLength) {
    outputLength = outputLength || 32;
    
    // HMAC uses two passes with padded keys
    var blockSize = 64;
    
    // If key is too long, hash it first
    if (key.length > blockSize) {
        key = backend.hash(key, blockSize).toString('hex');
    }
    
    // Pad key to block size
    while (key.length < blockSize) {
        key += '\x00';
    }
    
    // Create inner and outer padded keys
    var ipad = '';
    var opad = '';
    for (var i = 0; i < blockSize; i++) {
        var keyChar = key.charCodeAt(i);
        ipad += String.fromCharCode(keyChar ^ 0x36);
        opad += String.fromCharCode(keyChar ^ 0x5c);
    }
    
    // Inner hash: hash(ipad || message)
    var innerData = ipad + message;
    var innerHash = backend.hash(innerData, outputLength);
    
    // Outer hash: hash(opad || inner_hash)
    var outerData = opad + innerHash.toString('hex');
    var hmacResult = backend.hash(outerData, outputLength);
    
    return hmacResult;
}

// ===========================================
// BASIC HMAC
// ===========================================

console.log('Basic HMAC:');
console.log('-'.repeat(50) + '\n');

var secretKey = 'my_secret_key_123';
var message = 'Hello, this is a secret message.';

var mac = hmac(secretKey, message);

console.log('Key:     ' + secretKey);
console.log('Message: ' + message);
console.log('HMAC:    ' + mac.toString('hex'));

// ===========================================
// MESSAGE VERIFICATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Message Verification:');
console.log('='.repeat(50) + '\n');

function verifyMessage(key, message, expectedMac) {
    var computedMac = hmac(key, message);
    return computedMac.toString('hex') === expectedMac;
}

var originalMac = hmac(secretKey, message).toString('hex');

var testCases = [
    { msg: message, desc: 'Original message' },
    { msg: message + ' ', desc: 'Message with extra space' },
    { msg: 'Hello, this is a SECRET message.', desc: 'Modified message' },
    { msg: 'Completely different message', desc: 'Different message' }
];

console.log('Testing message integrity:\n');

for (var i = 0; i < testCases.length; i++) {
    var test = testCases[i];
    var isValid = verifyMessage(secretKey, test.msg, originalMac);
    console.log('  ' + test.desc + ': ' + (isValid ? 'VALID' : 'INVALID'));
}

// ===========================================
// KEY VERIFICATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Key Authentication:');
console.log('='.repeat(50) + '\n');

console.log('Only the correct key produces matching HMAC:\n');

var keys = [
    'my_secret_key_123',  // Correct
    'my_secret_key_124',  // One char different
    'wrong_key',          // Wrong
    ''                     // Empty
];

for (var i = 0; i < keys.length; i++) {
    var testKey = keys[i];
    var testMac = hmac(testKey, message);
    var matches = testMac.toString('hex') === originalMac;
    console.log('  Key "' + (testKey || '(empty)') + '": ' + (matches ? 'MATCHES' : 'No match'));
}

// ===========================================
// API REQUEST SIGNING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('API Request Signing:');
console.log('='.repeat(50) + '\n');

function signRequest(apiKey, method, path, body, timestamp) {
    var payload = method + '\n' + path + '\n' + timestamp + '\n' + (body || '');
    var signature = hmac(apiKey, payload);
    return signature.toString('hex');
}

function verifyRequest(apiKey, method, path, body, timestamp, signature) {
    var expectedSig = signRequest(apiKey, method, path, body, timestamp);
    return expectedSig === signature;
}

var apiKey = 'api_secret_abc123';
var method = 'POST';
var path = '/api/users';
var body = '{"name":"John","email":"john@example.com"}';
var timestamp = '2024-01-15T12:00:00Z';

var signature = signRequest(apiKey, method, path, body, timestamp);

console.log('Request Details:');
console.log('  Method: ' + method);
console.log('  Path: ' + path);
console.log('  Body: ' + body);
console.log('  Timestamp: ' + timestamp);
console.log('  Signature: ' + signature.substring(0, 32) + '...\n');

console.log('Verification:');
console.log('  Valid request: ' + verifyRequest(apiKey, method, path, body, timestamp, signature));
console.log('  Tampered body: ' + verifyRequest(apiKey, method, path, body + 'x', timestamp, signature));
console.log('  Wrong timestamp: ' + verifyRequest(apiKey, method, path, body, '2024-01-15T12:00:01Z', signature));

// ===========================================
// WEBHOOK VERIFICATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Webhook Signature Verification:');
console.log('='.repeat(50) + '\n');

// Simulate webhook delivery and verification
function createWebhook(secret, event, payload) {
    var payloadStr = JSON.stringify(payload);
    var signature = hmac(secret, payloadStr);
    
    return {
        headers: {
            'X-Webhook-Signature': signature.toString('hex'),
            'X-Webhook-Event': event
        },
        body: payloadStr
    };
}

function verifyWebhook(secret, webhook) {
    var expectedSig = hmac(secret, webhook.body).toString('hex');
    return expectedSig === webhook.headers['X-Webhook-Signature'];
}

var webhookSecret = 'whsec_mysecretkey';
var event = 'payment.completed';
var payload = { orderId: '12345', amount: 99.99, currency: 'USD' };

var webhook = createWebhook(webhookSecret, event, payload);

console.log('Webhook Received:');
console.log('  Event: ' + webhook.headers['X-Webhook-Event']);
console.log('  Signature: ' + webhook.headers['X-Webhook-Signature'].substring(0, 32) + '...');
console.log('  Body: ' + webhook.body);
console.log('  Valid: ' + verifyWebhook(webhookSecret, webhook));

// Tampered webhook
var tamperedWebhook = {
    headers: webhook.headers,
    body: '{"orderId":"12345","amount":0.01,"currency":"USD"}'
};
console.log('\n  Tampered Body: ' + tamperedWebhook.body);
console.log('  Tampered Valid: ' + verifyWebhook(webhookSecret, tamperedWebhook));

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. HMAC verifies both integrity and authenticity');
console.log('2. Only holders of the secret key can create valid MACs');
console.log('3. Any message change invalidates the MAC');
console.log('4. Use for API signing, webhooks, and data verification');
console.log('5. Keep the secret key secure and never expose it');
console.log('6. Use constant-time comparison for verification');