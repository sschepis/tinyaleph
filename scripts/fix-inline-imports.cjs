#!/usr/bin/env node
/**
 * Fixes inline import statements that were incorrectly placed inside functions.
 * In ESM, imports must be at the top level.
 * 
 * Converts inline imports to dynamic imports or moves them to top.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Find import statements inside functions (i.e., preceded by a { on some previous line without closing })
    // Simple heuristic: import statement not at beginning of line after accounting for whitespace
    // or import inside a function body
    
    const lines = content.split('\n');
    const fixedLines = [];
    const topLevelImports = [];
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Track brace depth (very simplified)
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        
        // Check if this is an import statement
        if (line.match(/^\s+import\s+\{/) && braceDepth > 0) {
            // This is an import inside a function/block - it's invalid
            // Extract the import info and convert to a comment + add to top
            const importMatch = line.match(/import\s+\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/);
            if (importMatch) {
                const imports = importMatch[1].trim();
                const modulePath = importMatch[2];
                topLevelImports.push(`import { ${imports} } from '${modulePath}';`);
                // Comment out the inline import
                fixedLines.push(line.replace(/import\s+\{/, '// MOVED TO TOP: import {'));
            } else {
                fixedLines.push(line);
            }
        } else {
            fixedLines.push(line);
        }
        
        braceDepth += openBraces - closeBraces;
        if (braceDepth < 0) braceDepth = 0;
    }
    
    // Add collected imports to the top of the file (after existing imports)
    if (topLevelImports.length > 0) {
        const uniqueImports = [...new Set(topLevelImports)];
        
        // Find the last import statement at top level
        let lastImportIndex = -1;
        for (let i = 0; i < fixedLines.length; i++) {
            if (fixedLines[i].match(/^import\s/)) {
                lastImportIndex = i;
            } else if (fixedLines[i].match(/^(const|let|var|function|class|export|\/\*\*)/)) {
                break;
            }
        }
        
        // Insert after last import
        if (lastImportIndex >= 0) {
            fixedLines.splice(lastImportIndex + 1, 0, ...uniqueImports);
        } else {
            // No imports found, add after initial comments
            let insertIndex = 0;
            for (let i = 0; i < fixedLines.length; i++) {
                if (fixedLines[i].match(/^(\/\*\*|\/\/|\s*\*|'use strict'|\s*$)/)) {
                    insertIndex = i + 1;
                } else {
                    break;
                }
            }
            fixedLines.splice(insertIndex, 0, '', ...uniqueImports);
        }
        
        content = fixedLines.join('\n');
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed inline imports in:', filePath);
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

console.log(`\nFixed ${fixed} files with inline imports.`);