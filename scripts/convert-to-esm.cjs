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

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Directories to convert
const CONVERT_DIRS = ['core', 'physics', 'backends', 'engine', 'telemetry'];

// Files at root level to convert
const ROOT_FILES = ['index.js', 'modular.js'];

function convertFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
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
    const mod = await import('${mod1}');
    ${varName} = mod.default || mod;
} catch (e) {
    try {
        const mod = await import('${mod2}');
        ${varName} = mod.default || mod;
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
        const lines = exportsBlock.trim().split(/\n/).map(l => l.trim().replace(/,\s*$/, ''));
        const varNames = [];
        let isSimple = true;
        
        for (const line of lines) {
            if (!line || line.startsWith('//')) continue;
            // Match simple variable name or "name: name" pattern
            const simpleMatch = line.match(/^(\w+)$/);
            const sameNameMatch = line.match(/^(\w+)\s*:\s*\1$/);
            const keyOnlyMatch = line.match(/^(\w+)\s*,?$/);
            
            if (simpleMatch) {
                varNames.push(simpleMatch[1]);
            } else if (sameNameMatch) {
                varNames.push(sameNameMatch[1]);
            } else if (keyOnlyMatch) {
                varNames.push(keyOnlyMatch[1]);
            } else {
                isSimple = false;
                break;
            }
        }
        
        if (isSimple && varNames.length > 0) {
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
    
    // Only write if changed
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Converted:', filePath);
        return true;
    }
    return false;
}

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
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
    const dirPath = path.join(rootDir, dir);
    try {
        walkDir(dirPath, (filePath) => {
            if (convertFile(filePath)) converted++;
        });
    } catch (e) {
        console.error(`Error processing ${dir}:`, e.message);
    }
}

// Convert root files
for (const file of ROOT_FILES) {
    const filePath = path.join(rootDir, file);
    try {
        if (convertFile(filePath)) converted++;
    } catch (e) {
        console.error(`Error processing ${file}:`, e.message);
    }
}

console.log(`\nConverted ${converted} files to ESM.`);