#!/usr/bin/env node
/**
 * Converts CommonJS modules to ESM syntax
 * 
 * Transformations:
 * - const X = require('...') → import X from '...'
 * - const { a, b } = require('...') → import { a, b } from '...'
 * - module.exports = X → export default X
 * - module.exports = { ... } → export { ... } or export default { ... }
 * - exports.X = ... → export const X = ...
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Directories to convert
const CONVERT_DIRS = ['core', 'physics', 'backends', 'engine', 'telemetry'];

// Files at root level to convert
const ROOT_FILES = ['index.js', 'modular.js'];

function convertFile(filePath) {
    let content = readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Track imports and exports for restructuring
    const imports = [];
    const namedExports = [];
    let hasDefaultExport = false;
    
    // Pattern 1: const X = require('module')
    content = content.replace(
        /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);?/g,
        (match, varName, modulePath) => {
            // Add .js extension for local modules if missing
            let fixedPath = modulePath;
            if (modulePath.startsWith('.') && !modulePath.endsWith('.js') && !modulePath.endsWith('.json')) {
                fixedPath = modulePath + '.js';
            }
            return `import ${varName} from '${fixedPath}';`;
        }
    );
    
    // Pattern 2: const { a, b } = require('module')
    content = content.replace(
        /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);?/g,
        (match, vars, modulePath) => {
            let fixedPath = modulePath;
            if (modulePath.startsWith('.') && !modulePath.endsWith('.js') && !modulePath.endsWith('.json')) {
                fixedPath = modulePath + '.js';
            }
            return `import { ${vars.trim()} } from '${fixedPath}';`;
        }
    );
    
    // Pattern 3: let X; try { X = require() } catch - TensorFlow pattern
    content = content.replace(
        /let\s+(\w+);\s*try\s*\{\s*\1\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);?\s*\}\s*catch\s*\([^)]*\)\s*\{\s*try\s*\{\s*\1\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);?\s*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\1\s*=\s*null;?\s*\}\s*\}/gs,
        (match, varName, mod1, mod2) => {
            return `let ${varName} = null;
try {
    ${varName} = await import('${mod1}');
} catch (e) {
    try {
        ${varName} = await import('${mod2}');
    } catch (e2) {
        console.warn('${varName} not available');
        ${varName} = null;
    }
}`;
        }
    );
    
    // Pattern 4: module.exports = { ... } at end of file
    const moduleExportsMatch = content.match(/module\.exports\s*=\s*\{([^;]*)\};?\s*$/s);
    if (moduleExportsMatch) {
        const exportsBlock = moduleExportsMatch[1];
        // Check if it's just listing variable names (named exports)
        const varNames = exportsBlock.trim().split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
        const isSimpleNamedExports = varNames.every(v => /^\w+$/.test(v));
        
        if (isSimpleNamedExports && varNames.length > 0) {
            content = content.replace(
                /module\.exports\s*=\s*\{[^;]*\};?\s*$/s,
                `export {\n    ${varNames.join(',\n    ')}\n};`
            );
        } else {
            content = content.replace(
                /module\.exports\s*=\s*(\{[^;]*\});?\s*$/s,
                'export default $1;'
            );
        }
    }
    
    // Pattern 5: module.exports = X (single default export)
    content = content.replace(
        /module\.exports\s*=\s*(\w+);?\s*$/,
        'export default $1;'
    );
    
    // Pattern 6: exports.X = Y (named exports scattered through file)
    content = content.replace(
        /exports\.(\w+)\s*=\s*([^;]+);/g,
        'export const $1 = $2;'
    );
    
    // Pattern 7: Inline require() calls - convert to static imports at top
    const inlineRequires = [];
    content = content.replace(
        /(?<!import\s.*)require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        (match, modulePath) => {
            // Skip if already handled
            if (content.includes(`import`) && content.includes(`from '${modulePath}'`)) {
                return match;
            }
            
            let fixedPath = modulePath;
            if (modulePath.startsWith('.') && !modulePath.endsWith('.js') && !modulePath.endsWith('.json')) {
                fixedPath = modulePath + '.js';
            }
            
            // Generate a unique import name
            const safeName = '_' + modulePath.replace(/[^a-zA-Z0-9]/g, '_') + '_' + inlineRequires.length;
            inlineRequires.push({ name: safeName, path: fixedPath });
            return safeName;
        }
    );
    
    // Add inline require imports at the top
    if (inlineRequires.length > 0) {
        const inlineImports = inlineRequires.map(r => `import ${r.name} from '${r.path}';`).join('\n');
        // Find first import or start of file
        const firstImportMatch = content.match(/^(import\s)/m);
        if (firstImportMatch) {
            content = content.replace(/^(import\s)/m, inlineImports + '\n$1');
        } else {
            // Add after any leading comments
            const commentMatch = content.match(/^((?:\/\*[\s\S]*?\*\/|\/\/[^\n]*\n|['"]use strict['"];?\n)*)/);
            if (commentMatch) {
                const preamble = commentMatch[1];
                content = preamble + inlineImports + '\n' + content.slice(preamble.length);
            } else {
                content = inlineImports + '\n' + content;
            }
        }
    }
    
    // Only write if changed
    if (content !== originalContent) {
        writeFileSync(filePath, content, 'utf8');
        console.log('Converted:', filePath);
        return true;
    }
    return false;
}

function walkDir(dir, callback) {
    const files = readdirSync(dir);
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else if (file.endsWith('.js')) {
            callback(filePath);
        }
    }
}

// Main
let converted = 0;

// Convert directories
for (const dir of CONVERT_DIRS) {
    const dirPath = join(rootDir, dir);
    walkDir(dirPath, (filePath) => {
        if (convertFile(filePath)) converted++;
    });
}

// Convert root files
for (const file of ROOT_FILES) {
    const filePath = join(rootDir, file);
    if (convertFile(filePath)) converted++;
}

console.log(`\nConverted ${converted} files to ESM.`);