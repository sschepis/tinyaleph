#!/usr/bin/env node
/**
 * ESM Conversion Script
 * Converts CommonJS files to ESM format
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Directories to process
const DIRS_TO_PROCESS = [
  'observer',
  'transport', 
  'telemetry',
  'profiling',
  'core',
  'physics',
  'engine',
  'backends',
  'storage'
];

// Files/dirs to skip
const SKIP = [
  'node_modules',
  '.git',
  'apps',      // Keep apps as CJS for now - they have their own entry points
  'examples',  // Examples can be CJS
  'test',      // Test files can be CJS  
  'ra',        // Benchmark scripts
  'scripts'    // Scripts themselves
];

/**
 * Convert require() to import
 */
function convertRequireToImport(content) {
  // Handle destructuring requires: const { A, B } = require('./module')
  content = content.replace(
    /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    (match, imports, modulePath) => {
      const cleanImports = imports.split(',').map(s => s.trim()).join(', ');
      const fixedPath = fixModulePath(modulePath);
      return `import { ${cleanImports} } from '${fixedPath}'`;
    }
  );

  // Handle simple requires: const X = require('./module')
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    (match, varName, modulePath) => {
      const fixedPath = fixModulePath(modulePath);
      return `import ${varName} from '${fixedPath}'`;
    }
  );

  // Handle let/var requires
  content = content.replace(
    /(let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    (match, keyword, varName, modulePath) => {
      const fixedPath = fixModulePath(modulePath);
      return `import ${varName} from '${fixedPath}'`;
    }
  );

  // Handle inline requires: require('./module').something
  content = content.replace(
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)\.(\w+)/g,
    (match, modulePath, prop) => {
      // This needs dynamic import - mark for manual review
      return `/* TODO: convert dynamic require */ ${match}`;
    }
  );

  return content;
}

/**
 * Convert module.exports to export
 */
function convertModuleExports(content) {
  // Handle module.exports = { A, B, C }
  content = content.replace(
    /module\.exports\s*=\s*\{([^}]+)\}/g,
    (match, exports) => {
      const items = exports.split(',').map(s => s.trim()).filter(Boolean);
      const named = items.join(',\n  ');
      return `export {\n  ${named}\n};\n\nexport default {\n  ${named}\n}`;
    }
  );

  // Handle module.exports = ClassName
  content = content.replace(
    /module\.exports\s*=\s*(\w+)\s*;?\s*$/gm,
    (match, name) => {
      return `export { ${name} };\nexport default ${name};`;
    }
  );

  // Handle module.exports.X = Y
  content = content.replace(
    /module\.exports\.(\w+)\s*=\s*([^;]+);/g,
    (match, name, value) => {
      return `export const ${name} = ${value};`;
    }
  );

  // Handle exports.X = Y
  content = content.replace(
    /exports\.(\w+)\s*=\s*([^;]+);/g,
    (match, name, value) => {
      return `export const ${name} = ${value};`;
    }
  );

  return content;
}

/**
 * Fix module path to include .js extension for relative imports
 */
function fixModulePath(modulePath) {
  // Skip node_modules
  if (!modulePath.startsWith('.') && !modulePath.startsWith('/')) {
    return modulePath;
  }
  
  // Already has extension
  if (extname(modulePath)) {
    return modulePath;
  }
  
  // Add .js extension
  return modulePath + '.js';
}

/**
 * Remove 'use strict' directive (implicit in ESM)
 */
function removeUseStrict(content) {
  return content.replace(/['"]use strict['"];\s*\n?/g, '');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  // Skip if already ESM
  if (content.includes('import ') && content.includes(' from ') && !content.includes('require(')) {
    return { skipped: true, reason: 'already ESM' };
  }
  
  // Skip if no CommonJS patterns
  if (!content.includes('require(') && !content.includes('module.exports') && !content.includes('exports.')) {
    return { skipped: true, reason: 'no CommonJS' };
  }

  let converted = content;
  
  // Apply conversions
  converted = removeUseStrict(converted);
  converted = convertRequireToImport(converted);
  converted = convertModuleExports(converted);
  
  // Only write if changed
  if (converted !== content) {
    writeFileSync(filePath, converted, 'utf-8');
    return { converted: true };
  }
  
  return { skipped: true, reason: 'no changes' };
}

/**
 * Walk directory recursively
 */
function walkDir(dir, callback) {
  if (!existsSync(dir)) return;
  
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!SKIP.includes(file)) {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.js')) {
      callback(filePath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('ESM Conversion Script');
  console.log('=====================\n');
  
  let converted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const dir of DIRS_TO_PROCESS) {
    const fullPath = join(ROOT, dir);
    if (!existsSync(fullPath)) {
      console.log(`  Skipping ${dir} (not found)`);
      continue;
    }
    
    console.log(`Processing ${dir}/...`);
    
    walkDir(fullPath, (filePath) => {
      const relativePath = filePath.replace(ROOT + '/', '');
      try {
        const result = processFile(filePath);
        if (result.converted) {
          console.log(`  ✓ ${relativePath}`);
          converted++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`  ✗ ${relativePath}: ${err.message}`);
        errors++;
      }
    });
  }
  
  console.log(`\n=====================`);
  console.log(`Converted: ${converted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main();