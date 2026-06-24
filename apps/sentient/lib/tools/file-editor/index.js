// index.js - File Editor Tool
// Provides LLM-powered search/replace file editing

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEdits, generateEditsWithRetry, configureLLMBridge } from './llmBridge.js';
import { applyPatch } from './patchEngine.js';

const fsPromises = fs.promises;

/**
 * Edit a file using LLM-generated patches
 * @param {string} filePath - Path to the file to edit
 * @param {string} instruction - What changes to make
 * @param {Object} options - Options including llmClient
 * @returns {Promise<Object>} Result of the edit operation
 */
async function editFile(filePath, instruction, options = {}) {
    const resolvedPath = path.resolve(filePath);
    const fileName = path.basename(resolvedPath);
    
    // Read the original file content
    let originalContent;
    try {
        originalContent = await fsPromises.readFile(resolvedPath, 'utf-8');
    } catch (readError) {
        return {
            success: false,
            error: `Failed to read file: ${readError.message}`,
            filePath: resolvedPath
        };
    }
    
    // Generate edits using LLM
    const result = await generateEditsWithRetry(fileName, originalContent, instruction, {
        llmClient: options.llmClient,
        maxRetries: options.maxRetries || 2
    });
    
    if (result.error && (!result.edits || result.edits.length === 0)) {
        return {
            success: false,
            error: result.error,
            thoughtProcess: result.thoughtProcess,
            filePath: resolvedPath
        };
    }
    
    if (!result.edits || result.edits.length === 0) {
        return {
            success: true,
            noChanges: true,
            thoughtProcess: result.thoughtProcess,
            filePath: resolvedPath,
            message: 'No edits were necessary'
        };
    }
    
    // Apply edits sequentially
    let modifiedContent = originalContent;
    const appliedEdits = [];
    const failedEdits = [];
    
    for (const edit of result.edits) {
        try {
            modifiedContent = applyPatch(modifiedContent, edit);
            appliedEdits.push(edit);
        } catch (patchError) {
            failedEdits.push({
                edit,
                error: patchError.message
            });
        }
    }
    
    // Write back to disk if changes were made
    if (modifiedContent !== originalContent) {
        try {
            // Optionally create backup
            if (options.backup) {
                await fsPromises.writeFile(`${resolvedPath}.bak`, originalContent, 'utf-8');
            }
            
            await fsPromises.writeFile(resolvedPath, modifiedContent, 'utf-8');
            
            return {
                success: true,
                filePath: resolvedPath,
                thoughtProcess: result.thoughtProcess,
                editsApplied: appliedEdits.length,
                editsFailed: failedEdits.length,
                failedEdits: failedEdits.length > 0 ? failedEdits : undefined,
                message: `Applied ${appliedEdits.length} edit(s) to ${fileName}`
            };
        } catch (writeError) {
            return {
                success: false,
                error: `Failed to write file: ${writeError.message}`,
                filePath: resolvedPath
            };
        }
    } else {
        return {
            success: true,
            noChanges: true,
            thoughtProcess: result.thoughtProcess,
            filePath: resolvedPath,
            message: 'File content unchanged after applying edits'
        };
    }
}

/**
 * Preview edits without applying them
 * @param {string} filePath - Path to the file
 * @param {string} instruction - What changes to preview
 * @param {Object} options - Options
 * @returns {Promise<Object>} Preview of proposed edits
 */
async function previewEdits(filePath, instruction, options = {}) {
    const resolvedPath = path.resolve(filePath);
    const fileName = path.basename(resolvedPath);
    
    let originalContent;
    try {
        originalContent = await fsPromises.readFile(resolvedPath, 'utf-8');
    } catch (readError) {
        return {
            success: false,
            error: `Failed to read file: ${readError.message}`,
            filePath: resolvedPath
        };
    }
    
    const result = await generateEdits(fileName, originalContent, instruction, {
        llmClient: options.llmClient
    });
    
    return {
        success: !result.error,
        filePath: resolvedPath,
        thoughtProcess: result.thoughtProcess,
        edits: result.edits,
        error: result.error
    };
}

// CLI support
async function main() {
    const targetFile = process.argv[2];
    const instruction = process.argv[3];
    
    if (!targetFile || !instruction) {
        console.error('Usage: node index.js <file-path> "instruction"');
        process.exit(1);
    }
    
    console.log(`Editing ${targetFile}...`);
    console.log(`Instruction: ${instruction}\n`);
    
    // Note: When used via CLI, an LLM client must be configured
    // This is mainly for testing - production use goes through tools.js
    const result = await editFile(targetFile, instruction, {
        backup: true
    });
    
    if (result.success) {
        console.log(`\n✅ ${result.message}`);
        if (result.thoughtProcess) {
            console.log(`\nAI Thought Process: ${result.thoughtProcess}`);
        }
    } else {
        console.error(`\n❌ Error: ${result.error}`);
        if (result.thoughtProcess) {
            console.log(`\nAI Thought Process: ${result.thoughtProcess}`);
        }
        process.exit(1);
    }
}

// Run CLI if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    main().catch(console.error);
}

export {
    editFile,
    previewEdits,
    configureLLMBridge,
    applyPatch
};
