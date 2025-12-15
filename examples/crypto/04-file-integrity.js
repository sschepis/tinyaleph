/**
 * @example File Integrity Verification
 * @description Verify file integrity using cryptographic hashes
 * 
 * File integrity verification ensures files haven't been modified:
 * - Compute hash of original file
 * - Store hash securely
 * - Recompute and compare to detect changes
 */

const { CryptographicBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new CryptographicBackend({ dimension: 32 });

console.log('TinyAleph File Integrity Example');
console.log('=================================\n');

// ===========================================
// SIMULATED FILE SYSTEM
// ===========================================

// Simulate files (in real use, you'd read actual files)
var files = {
    'config.json': '{"version":"1.0","debug":false,"timeout":30}',
    'script.js': 'function main() { console.log("Hello"); }\nmain();',
    'data.txt': 'Important data that must not be modified.\nLine 2.',
    'readme.md': '# Project\n\nThis is the readme file.'
};

// ===========================================
// COMPUTE FILE HASHES
// ===========================================

console.log('Computing File Hashes:');
console.log('-'.repeat(50) + '\n');

function hashFile(content) {
    return backend.hash(content, 32).toString('hex');
}

var manifest = {};

for (var filename in files) {
    if (files.hasOwnProperty(filename)) {
        var hash = hashFile(files[filename]);
        manifest[filename] = {
            hash: hash,
            size: files[filename].length,
            timestamp: new Date().toISOString()
        };
        console.log('  ' + filename.padEnd(15) + ' ' + hash.substring(0, 40) + '...');
    }
}

// ===========================================
// VERIFY FILE INTEGRITY
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Verifying File Integrity:');
console.log('='.repeat(50) + '\n');

function verifyFile(filename, content, manifest) {
    if (!manifest[filename]) {
        return { valid: false, reason: 'File not in manifest' };
    }
    
    var currentHash = hashFile(content);
    var expectedHash = manifest[filename].hash;
    
    if (currentHash === expectedHash) {
        return { valid: true, reason: 'Hash matches' };
    } else {
        return { valid: false, reason: 'Hash mismatch', expected: expectedHash, actual: currentHash };
    }
}

console.log('Verification of unchanged files:\n');

for (var filename in files) {
    if (files.hasOwnProperty(filename)) {
        var result = verifyFile(filename, files[filename], manifest);
        console.log('  ' + filename + ': ' + (result.valid ? 'OK' : 'FAILED'));
    }
}

// ===========================================
// DETECT MODIFICATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Detecting Modifications:');
console.log('='.repeat(50) + '\n');

// Simulate file modifications
var modifiedFiles = {
    'config.json': '{"version":"1.0","debug":true,"timeout":30}',  // Changed debug to true
    'script.js': 'function main() { console.log("Hello"); }\nmain();',  // Unchanged
    'data.txt': 'Important data that WAS modified.\nLine 2.',  // Modified
    'readme.md': '# Project\n\nThis is the readme file.'  // Unchanged
};

console.log('After modifications:\n');

for (var filename in modifiedFiles) {
    if (modifiedFiles.hasOwnProperty(filename)) {
        var result = verifyFile(filename, modifiedFiles[filename], manifest);
        var status = result.valid ? 'UNCHANGED' : 'MODIFIED';
        console.log('  ' + filename + ': ' + status);
    }
}

// ===========================================
// DETAILED CHANGE DETECTION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Detailed Change Analysis:');
console.log('='.repeat(50) + '\n');

function analyzeChanges(originalFiles, currentFiles, manifest) {
    var report = {
        unchanged: [],
        modified: [],
        added: [],
        deleted: []
    };
    
    // Check existing files
    for (var filename in manifest) {
        if (manifest.hasOwnProperty(filename)) {
            if (!currentFiles[filename]) {
                report.deleted.push(filename);
            } else {
                var result = verifyFile(filename, currentFiles[filename], manifest);
                if (result.valid) {
                    report.unchanged.push(filename);
                } else {
                    report.modified.push({
                        filename: filename,
                        originalHash: manifest[filename].hash.substring(0, 16) + '...',
                        currentHash: hashFile(currentFiles[filename]).substring(0, 16) + '...'
                    });
                }
            }
        }
    }
    
    // Check for new files
    for (var filename in currentFiles) {
        if (currentFiles.hasOwnProperty(filename)) {
            if (!manifest[filename]) {
                report.added.push(filename);
            }
        }
    }
    
    return report;
}

// Add a new file and delete one
var scenario = Object.assign({}, modifiedFiles);
scenario['new-file.txt'] = 'This is a new file';
delete scenario['readme.md'];

var report = analyzeChanges(files, scenario, manifest);

console.log('Change Report:');
console.log('  Unchanged: ' + (report.unchanged.length > 0 ? report.unchanged.join(', ') : 'none'));
console.log('  Modified:  ' + (report.modified.length > 0 ? report.modified.map(function(m) { return m.filename; }).join(', ') : 'none'));
console.log('  Added:     ' + (report.added.length > 0 ? report.added.join(', ') : 'none'));
console.log('  Deleted:   ' + (report.deleted.length > 0 ? report.deleted.join(', ') : 'none'));

if (report.modified.length > 0) {
    console.log('\nModified file details:');
    for (var i = 0; i < report.modified.length; i++) {
        var mod = report.modified[i];
        console.log('  ' + mod.filename + ':');
        console.log('    Original: ' + mod.originalHash);
        console.log('    Current:  ' + mod.currentHash);
    }
}

// ===========================================
// MANIFEST FILE FORMAT
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Manifest File Format:');
console.log('='.repeat(50) + '\n');

function createManifest(files) {
    var manifest = {
        version: '1.0',
        created: new Date().toISOString(),
        algorithm: 'tinyaleph-hash-32',
        files: {}
    };
    
    for (var filename in files) {
        if (files.hasOwnProperty(filename)) {
            manifest.files[filename] = {
                hash: hashFile(files[filename]),
                size: files[filename].length
            };
        }
    }
    
    // Sign the manifest itself
    var manifestContent = JSON.stringify(manifest.files);
    manifest.signature = hashFile(manifestContent);
    
    return manifest;
}

var fullManifest = createManifest(files);
console.log(JSON.stringify(fullManifest, null, 2));

// ===========================================
// INCREMENTAL UPDATES
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Incremental Manifest Updates:');
console.log('='.repeat(50) + '\n');

function updateManifest(manifest, filename, content) {
    var newManifest = JSON.parse(JSON.stringify(manifest));
    newManifest.files[filename] = {
        hash: hashFile(content),
        size: content.length
    };
    newManifest.updated = new Date().toISOString();
    
    // Re-sign
    var manifestContent = JSON.stringify(newManifest.files);
    newManifest.signature = hashFile(manifestContent);
    
    return newManifest;
}

console.log('Updating manifest after file change:\n');
var updatedManifest = updateManifest(fullManifest, 'config.json', '{"version":"2.0"}');
console.log('  Old config.json hash: ' + fullManifest.files['config.json'].hash.substring(0, 32) + '...');
console.log('  New config.json hash: ' + updatedManifest.files['config.json'].hash.substring(0, 32) + '...');
console.log('  New signature: ' + updatedManifest.signature.substring(0, 32) + '...');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Hash files to create integrity fingerprints');
console.log('2. Store hashes in a manifest file');
console.log('3. Recompute and compare to detect changes');
console.log('4. Sign manifests to protect against tampering');
console.log('5. Track added, modified, and deleted files');
console.log('6. Use incremental updates for efficiency');