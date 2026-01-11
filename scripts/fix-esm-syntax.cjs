#!/usr/bin/env node
/**
 * Fixes common ESM conversion issues:
 * - `import { x: y }` → `import { x as y }`
 * - Object exports with colons → proper named exports
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix import { x: y } → import { x as y }
    content = content.replace(
        /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g,
        (match, imports, modulePath) => {
            const fixedImports = imports.replace(/(\w+)\s*:\s*(\w+)/g, '$1 as $2');
            return `import { ${fixedImports} } from '${modulePath}'`;
        }
    );
    
    // Fix export default { x: y } → proper named exports
    // This is a complex case - we'll leave object exports as-is for now
    // and just fix the import syntax
    
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

// Directories to fix
const dirs = ['core', 'physics', 'backends', 'engine', 'telemetry', 'observer'];
let fixed = 0;

for (const dir of dirs) {
    walkDir(path.join(rootDir, dir), (filePath) => {
        if (fixFile(filePath)) fixed++;
    });
}

// Fix root files
['index.js', 'modular.js'].forEach(f => {
    const filePath = path.join(rootDir, f);
    if (fs.existsSync(filePath) && fixFile(filePath)) fixed++;
});

console.log(`\nFixed ${fixed} files.`);