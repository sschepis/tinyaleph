#!/usr/bin/env node

/**
 * Sentient Observer
 *
 * Unified entry point for the Sentient Observer system.
 * Runs as CLI by default, or as HTTP server with --server flag.
 *
 * Usage:
 *   node index.js                    # Run CLI mode
 *   node index.js --server           # Run as HTTP server with web UI
 *   node index.js --server -p 8080   # Run server on port 8080
 * 
 * This file is now a thin wrapper around modular components in lib/app/
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Use dynamic import for the app library to handle ESM/CJS interop
const appPath = './lib/app/index.js';

/**
 * Main entry point
 */
async function main() {
    // Dynamic import handles both ESM and CJS exports
    const app = await import(appPath);
    
    // Handle both default export and named exports pattern
    const { parseArgs, printHelp, SentientCLI, SentientServer } = app.default || app;
    
    const options = parseArgs();
    
    if (options.help) {
        printHelp();
        process.exit(0);
    }
    
    if (options.server) {
        const server = new SentientServer(options);
        await server.start();
    } else {
        const cli = new SentientCLI(options);
        await cli.run();
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
