#!/usr/bin/env node
/**
 * Fixes duplicate import statements by merging them.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    const lines = content.split('\n');
    const importsByModule = new Map(); // modulePath -> Set of imported names
    const nonImportLines = [];
    const commentedImports = [];
    
    for (const line of lines) {
        // Check for import statement
        const importMatch = line.match(/^import\s+\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/);
        if (importMatch) {
            const imports = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
            const modulePath = importMatch[2];
            
            if (!importsByModule.has(modulePath)) {
                importsByModule.set(modulePath, new Set());
            }
            for (const imp of imports) {
                importsByModule.get(modulePath).add(imp);
            }
        } else if (line.match(/^\s*\/\/\s*MOVED TO TOP:/)) {
            // Skip these comment lines
            commentedImports.push(line);
        } else {
            nonImportLines.push(line);
        }
    }
    
    // Reconstruct file with deduplicated imports
    const mergedImports = [];
    for (const [modulePath, imports] of importsByModule) {
        const importList = Array.from(imports).join(', ');
        mergedImports.push(`import { ${importList} } from '${modulePath}';`);
    }
    
    // Find where to insert imports (after initial comments, before first non-import code)
    let insertIndex = 0;
    for (let i = 0; i < nonImportLines.length; i++) {
        const line = nonImportLines[i];
        if (line.match(/^(\/\*\*|\s*\*|\/\/|\s*$|'use strict')/)) {
            insertIndex = i + 1;
        } else {
            break;
        }
    }
    
    const result = [
        ...nonImportLines.slice(0, insertIndex),
        ...mergedImports,
        '',
        ...nonImportLines.slice(insertIndex)
    ].join('\n');
    
    // Remove duplicate empty lines
    const cleanedResult = result.replace(/\n{3,}/g, '\n\n');
    
    if (cleanedResult !== originalContent) {
        fs.writeFileSync(filePath, cleanedResult, 'utf8');
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

console.log(`\nFixed ${fixed} files with duplicate imports.`);