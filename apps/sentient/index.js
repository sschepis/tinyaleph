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

const { parseArgs, printHelp, SentientCLI, SentientServer } = require('./lib/app');

/**
 * Main entry point
 */
async function main() {
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