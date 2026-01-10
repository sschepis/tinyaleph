#!/usr/bin/env node
/**
 * Migration Script: Legacy JSON State to Binary Checkpoint
 * 
 * Migrates data/sentient-state.json (302MB) to efficient binary format:
 * - Reads legacy JSON state
 * - Converts to MessagePack binary format with compression (~40-60% reduction)
 * - Creates SHA-256 hash for integrity verification
 * - Stores checkpoint in ~/.sentient/hqe/checkpoints/
 * - Creates checkpoint.meta.json with hash and metadata
 * - Backs up legacy JSON before deletion
 * 
 * Usage:
 *   node scripts/migrate-state.js [options]
 * 
 * Options:
 *   --dry-run          Show what would be done without making changes
 *   --keep-json        Don't delete the legacy JSON after migration
 *   --no-backup        Skip backup creation (not recommended)
 *   --output-dir DIR   Custom output directory for checkpoints
 *   --verbose          Show detailed progress
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const readline = require('readline');

// Import binary serializer from lib
const { BinarySerializer } = require('../lib/binary-serializer');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
    legacyPath: path.join(__dirname, '../data/sentient-state.json'),
    checkpointDir: path.join(os.homedir(), '.sentient', 'hqe', 'checkpoints'),
    backupDir: path.join(os.homedir(), '.sentient', 'backup'),
    dryRun: false,
    keepJson: false,
    noBackup: false,
    verbose: false
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const config = { ...DEFAULT_CONFIG };
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--dry-run':
                config.dryRun = true;
                break;
            case '--keep-json':
                config.keepJson = true;
                break;
            case '--no-backup':
                config.noBackup = true;
                break;
            case '--verbose':
            case '-v':
                config.verbose = true;
                break;
            case '--output-dir':
                config.checkpointDir = args[++i];
                break;
            case '--input':
                config.legacyPath = args[++i];
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                if (!args[i].startsWith('-')) {
                    config.legacyPath = args[i];
                }
        }
    }
    
    return config;
}

function printHelp() {
    console.log(`
Migration Script: Legacy JSON State to Binary Checkpoint

Usage:
  node scripts/migrate-state.js [options] [input-file]

Options:
  --dry-run          Show what would be done without making changes
  --keep-json        Don't delete the legacy JSON after migration
  --no-backup        Skip backup creation (not recommended)
  --output-dir DIR   Custom output directory for checkpoints
  --input FILE       Specify input JSON file (alternative to positional arg)
  --verbose, -v      Show detailed progress
  --help, -h         Show this help message

Examples:
  node scripts/migrate-state.js
  node scripts/migrate-state.js --dry-run
  node scripts/migrate-state.js --keep-json --verbose
  node scripts/migrate-state.js custom-state.json --output-dir ./my-checkpoints
`);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Compute SHA-256 hash
 */
function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Prompt user for confirmation
 */
async function confirm(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise(resolve => {
        rl.question(`${question} [y/N] `, answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Log with verbosity control
 */
function log(config, ...args) {
    if (config.verbose) {
        console.log(...args);
    }
}

// ============================================================================
// STREAMING JSON PARSER (for large files)
// ============================================================================

/**
 * Read JSON file in chunks to avoid memory issues with 300MB+ files
 * This is a simplified approach - for truly massive files, use a streaming parser
 */
async function readLargeJSON(filePath, config) {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    console.log(`📄 Reading ${formatBytes(fileSize)} JSON file...`);
    
    // For files under 500MB, read directly (Node can handle it)
    if (fileSize < 500 * 1024 * 1024) {
        const startTime = Date.now();
        const content = fs.readFileSync(filePath, 'utf-8');
        log(config, `   Read file in ${Date.now() - startTime}ms`);
        
        const parseStart = Date.now();
        const data = JSON.parse(content);
        log(config, `   Parsed JSON in ${Date.now() - parseStart}ms`);
        
        return data;
    }
    
    // For larger files, we'd need a streaming parser
    throw new Error('File too large (>500MB). Consider splitting the state or using a streaming parser.');
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

/**
 * Analyze state structure for optimization hints
 */
function analyzeState(state) {
    const analysis = {
        sections: Object.keys(state),
        sizes: {},
        arrayFields: [],
        largeFields: []
    };
    
    function estimateSize(obj, path = '') {
        if (obj === null || obj === undefined) return 0;
        if (typeof obj === 'string') return obj.length * 2;
        if (typeof obj === 'number') return 8;
        if (typeof obj === 'boolean') return 1;
        
        if (Array.isArray(obj)) {
            let size = 0;
            for (const item of obj) {
                size += estimateSize(item, path);
            }
            if (obj.length > 100) {
                analysis.arrayFields.push({ path, length: obj.length });
            }
            return size;
        }
        
        if (typeof obj === 'object') {
            let size = 0;
            for (const [key, value] of Object.entries(obj)) {
                const fieldPath = path ? `${path}.${key}` : key;
                const fieldSize = estimateSize(value, fieldPath);
                size += key.length * 2 + fieldSize;
                
                if (fieldSize > 1024 * 1024) { // > 1MB
                    analysis.largeFields.push({ path: fieldPath, size: fieldSize });
                }
            }
            return size;
        }
        
        return 0;
    }
    
    for (const section of analysis.sections) {
        analysis.sizes[section] = estimateSize(state[section], section);
    }
    
    return analysis;
}

/**
 * Migrate state from JSON to binary checkpoint
 */
async function migrate(config) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Sentient State Migration: JSON → Binary Checkpoint     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // Check input file exists
    if (!fs.existsSync(config.legacyPath)) {
        console.error(`❌ Legacy state file not found: ${config.legacyPath}`);
        process.exit(1);
    }
    
    const inputStats = fs.statSync(config.legacyPath);
    console.log(`📂 Input:  ${config.legacyPath}`);
    console.log(`   Size:   ${formatBytes(inputStats.size)}`);
    console.log(`📂 Output: ${config.checkpointDir}`);
    console.log(`🔧 Mode:   ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);
    
    // Step 1: Read legacy JSON
    console.log('Step 1/5: Reading legacy JSON state...');
    let state;
    try {
        state = await readLargeJSON(config.legacyPath, config);
    } catch (err) {
        console.error(`❌ Failed to read JSON: ${err.message}`);
        process.exit(1);
    }
    console.log(`   ✓ Loaded state with ${Object.keys(state).length} top-level sections\n`);
    
    // Analyze state
    if (config.verbose) {
        const analysis = analyzeState(state);
        console.log('   State analysis:');
        console.log(`   Sections: ${analysis.sections.join(', ')}`);
        for (const [section, size] of Object.entries(analysis.sizes)) {
            console.log(`     - ${section}: ~${formatBytes(size)}`);
        }
        if (analysis.largeFields.length > 0) {
            console.log(`   Large fields (>1MB): ${analysis.largeFields.length}`);
        }
        console.log('');
    }
    
    // Step 2: Serialize to binary format
    console.log('Step 2/5: Converting to binary format...');
    const serializer = new BinarySerializer({ compress: true, checksum: true });
    
    let binaryBuffer;
    const serializeStart = Date.now();
    try {
        binaryBuffer = serializer.serialize(state);
    } catch (err) {
        console.error(`❌ Failed to serialize: ${err.message}`);
        process.exit(1);
    }
    
    const compressionRatio = ((1 - binaryBuffer.length / inputStats.size) * 100).toFixed(1);
    console.log(`   ✓ Serialized in ${Date.now() - serializeStart}ms`);
    console.log(`   Binary size: ${formatBytes(binaryBuffer.length)} (${compressionRatio}% reduction)\n`);
    
    // Step 3: Compute SHA-256 hash
    console.log('Step 3/5: Computing SHA-256 hash...');
    const contentHash = sha256(binaryBuffer);
    console.log(`   ✓ Hash: ${contentHash}\n`);
    
    if (config.dryRun) {
        console.log('🔸 DRY RUN - No files will be written\n');
        console.log('Would create:');
        console.log(`   ${path.join(config.checkpointDir, `checkpoint-${Date.now()}.bin`)}`);
        console.log(`   ${path.join(config.checkpointDir, 'checkpoint.meta.json')}`);
        if (!config.noBackup) {
            console.log(`   ${path.join(config.backupDir, 'sentient-state.json.bak')}`);
        }
        if (!config.keepJson) {
            console.log(`Would delete: ${config.legacyPath}`);
        }
        console.log('\n✅ Dry run complete');
        return;
    }
    
    // Step 4: Write binary checkpoint
    console.log('Step 4/5: Writing binary checkpoint...');
    ensureDir(config.checkpointDir);
    
    const timestamp = Date.now();
    const checkpointPath = path.join(config.checkpointDir, `checkpoint-${timestamp}.bin`);
    const metaPath = path.join(config.checkpointDir, 'checkpoint.meta.json');
    const latestPath = path.join(config.checkpointDir, 'checkpoint-latest.bin');
    
    try {
        // Write checkpoint
        fs.writeFileSync(checkpointPath, binaryBuffer);
        log(config, `   ✓ Wrote ${checkpointPath}`);
        
        // Write "latest" symlink or copy
        if (fs.existsSync(latestPath)) {
            fs.unlinkSync(latestPath);
        }
        // Use copy instead of symlink for portability
        fs.copyFileSync(checkpointPath, latestPath);
        log(config, `   ✓ Created checkpoint-latest.bin`);
        
        // Write metadata
        const metadata = {
            version: 1,
            format: 'smfb', // Sentient Memory Field Binary
            created: new Date().toISOString(),
            timestamp,
            originalPath: config.legacyPath,
            originalSize: inputStats.size,
            binarySize: binaryBuffer.length,
            compressionRatio: parseFloat(compressionRatio),
            hash: {
                algorithm: 'sha256',
                value: contentHash
            },
            sections: Object.keys(state),
            checkpoints: [
                {
                    path: path.basename(checkpointPath),
                    timestamp,
                    hash: contentHash,
                    size: binaryBuffer.length
                }
            ]
        };
        
        fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
        log(config, `   ✓ Wrote checkpoint.meta.json`);
        
        console.log(`   ✓ Checkpoint written successfully\n`);
    } catch (err) {
        console.error(`❌ Failed to write checkpoint: ${err.message}`);
        process.exit(1);
    }
    
    // Step 5: Backup and cleanup
    console.log('Step 5/5: Backup and cleanup...');
    
    // Backup
    if (!config.noBackup) {
        ensureDir(config.backupDir);
        const backupPath = path.join(config.backupDir, `sentient-state-${timestamp}.json`);
        
        try {
            fs.copyFileSync(config.legacyPath, backupPath);
            console.log(`   ✓ Backed up to ${backupPath}`);
        } catch (err) {
            console.warn(`   ⚠ Failed to create backup: ${err.message}`);
            if (!config.keepJson) {
                console.log('   Keeping original JSON due to backup failure');
                config.keepJson = true;
            }
        }
    }
    
    // Delete legacy JSON
    if (!config.keepJson) {
        const confirmed = await confirm('Delete the legacy JSON file?');
        if (confirmed) {
            try {
                fs.unlinkSync(config.legacyPath);
                console.log(`   ✓ Deleted ${config.legacyPath}`);
            } catch (err) {
                console.warn(`   ⚠ Failed to delete legacy file: ${err.message}`);
            }
        } else {
            console.log('   ⊘ Keeping legacy JSON file');
        }
    } else {
        console.log('   ⊘ Keeping legacy JSON file (--keep-json)');
    }
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Migration Complete!                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Summary:');
    console.log(`   Original size:   ${formatBytes(inputStats.size)}`);
    console.log(`   Binary size:     ${formatBytes(binaryBuffer.length)}`);
    console.log(`   Reduction:       ${compressionRatio}%`);
    console.log(`   Hash:            ${contentHash.slice(0, 16)}...`);
    console.log(`   Checkpoint:      ${checkpointPath}`);
    console.log(`   Metadata:        ${metaPath}`);
    
    console.log('\n✅ Migration successful!');
}

/**
 * Verify an existing checkpoint
 */
async function verify(checkpointPath) {
    console.log('Verifying checkpoint...');
    
    if (!fs.existsSync(checkpointPath)) {
        console.error(`❌ Checkpoint not found: ${checkpointPath}`);
        return false;
    }
    
    const buffer = fs.readFileSync(checkpointPath);
    const hash = sha256(buffer);
    
    // Try to load and verify
    const serializer = new BinarySerializer({ compress: true, checksum: true });
    try {
        const state = serializer.deserialize(buffer);
        console.log(`✓ Checkpoint valid`);
        console.log(`  Size: ${formatBytes(buffer.length)}`);
        console.log(`  Hash: ${hash}`);
        console.log(`  Sections: ${Object.keys(state).join(', ')}`);
        return true;
    } catch (err) {
        console.error(`❌ Checkpoint verification failed: ${err.message}`);
        return false;
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    try {
        const config = parseArgs();
        
        // Check if we have --verify flag
        if (process.argv.includes('--verify')) {
            const idx = process.argv.indexOf('--verify');
            const checkpointPath = process.argv[idx + 1] || path.join(DEFAULT_CONFIG.checkpointDir, 'checkpoint-latest.bin');
            const valid = await verify(checkpointPath);
            process.exit(valid ? 0 : 1);
        }
        
        await migrate(config);
    } catch (err) {
        console.error(`\n❌ Migration failed: ${err.message}`);
        if (process.env.DEBUG) {
            console.error(err.stack);
        }
        process.exit(1);
    }
}

main();