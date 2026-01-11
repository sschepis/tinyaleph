#!/usr/bin/env node
/**
 * Fixes various module.export issues from incomplete ESM conversion
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix: module.export const X → export const X
    content = content.replace(/module\.export\s+const\s+/g, 'export const ');
    
    // Fix: module.exports const X → export const X
    content = content.replace(/module\.exports\s+const\s+/g, 'export const ');
    
    // Fix: exports. patterns that shouldn't exist in ESM
    content = content.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');
    
    // Fix double exports
    content = content.replace(/export const export const/g, 'export const');
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
        return true;
    }
    return false;
}

function walkDir(dir, callback) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory() && !['node_modules', '.git'].includes(file)) {
                walkDir(filePath, callback);
            } else if (file.endsWith('.js')) {
                callback(filePath);
            }
        }
    } catch (e) {
        // Skip
    }
}

const dirs = ['core', 'physics', 'backends', 'engine', 'telemetry'];
let fixed = 0;

for (const dir of dirs) {
    walkDir(path.join(rootDir, dir), (filePath) => {
        if (fixFile(filePath)) fixed++;
    });
}

console.log(`\nFixed ${fixed} files.`);