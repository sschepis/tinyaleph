/**
 * Command Line Argument Parsing for Sentient Observer
 * 
 * Handles parsing CLI arguments and displaying help.
 */

const { colors: c } = require('./constants');

/**
 * Parse command line arguments
 * @returns {Object} Parsed options
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        // Common options
        url: 'http://192.168.4.79:1234/v1',
        dataPath: './data',
        tickRate: 30,
        help: false,
        
        // Mode selection
        server: false,
        
        // CLI-specific
        noColor: false,
        noClear: false,
        
        // Server-specific
        port: 3000,
        host: '0.0.0.0',
        staticPath: './public',
        cors: true
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        // Mode selection
        if (arg === '--server' || arg === '-s') {
            options.server = true;
        }
        // Common options
        else if (arg === '--url' || arg === '-u') {
            options.url = args[++i];
        } else if (arg === '--data' || arg === '-d') {
            options.dataPath = args[++i];
        } else if (arg === '--tick-rate') {
            options.tickRate = parseInt(args[++i]) || 30;
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        }
        // CLI options
        else if (arg === '--no-color') {
            options.noColor = true;
        } else if (arg === '--no-clear') {
            options.noClear = true;
        }
        // Server options
        else if (arg === '--port' || arg === '-p') {
            options.port = parseInt(args[++i]) || 3000;
        } else if (arg === '--host') {
            options.host = args[++i];
        } else if (arg === '--static') {
            options.staticPath = args[++i];
        } else if (arg === '--no-cors') {
            options.cors = false;
        }
    }
    
    return options;
}

/**
 * Print help message
 */
function printHelp() {
    console.log(`
${c.bold}Sentient Observer${c.reset}
Emergent Time • Holographic Memory • Prime Resonance

${c.bold}Usage:${c.reset}
  node index.js [options]              # Run in CLI mode (default)
  node index.js --server [options]     # Run as HTTP server

${c.bold}Common Options:${c.reset}
  -u, --url <url>       LMStudio API URL (default: http://192.168.4.79:1234/v1)
  -d, --data <path>     Data directory (default: ./data)
  --tick-rate <hz>      Observer tick rate (default: 30)
  -h, --help            Show this help

${c.bold}CLI Options:${c.reset}
  --no-color            Disable colored output
  --no-clear            Don't clear screen on startup

${c.bold}Server Options:${c.reset}
  -s, --server          Run as HTTP server instead of CLI
  -p, --port <port>     Server port (default: 3000)
  --host <host>         Server host (default: 0.0.0.0)
  --static <path>       Static files directory (default: ./public)
  --no-cors             Disable CORS headers

${c.bold}CLI Commands:${c.reset}
  /status               Show observer status
  /senses               Show current sense readings
  /focus <sense> <path> Direct sense attention (filesystem, git)
  /aperture <sense> <level>  Set aperture (narrow/medium/wide)
  /introspect           Deep introspection report
  /moments              Recent experiential moments
  /goals                Current goals and attention
  /memory               Memory statistics
  /safety               Safety report
  /smf                  SMF orientation display
  /oscillators          PRSC oscillator status
  /assay [A|B|C|D|all]  Run evaluation assays (Section 15)
  /history              Show conversation history
  /clear                Clear conversation history
  /pause                Pause observer processing
  /resume               Resume observer processing
  /save                 Save observer state
  /reset                Reset observer
  /help                 Show this help
  /quit                 Exit

${c.bold}Server API Endpoints:${c.reset}
  GET  /                Web UI (static files)
  POST /chat            Send message, get response
  GET  /status          Observer status
  GET  /introspect      Full introspection
  GET  /stream/moments  SSE for real-time moments

${c.bold}Examples:${c.reset}
  node index.js                        # Start CLI
  node index.js --url http://localhost:1234/v1
  node index.js --server               # Start server on port 3000
  node index.js --server -p 8080       # Start server on port 8080
`);
}

module.exports = {
    parseArgs,
    printHelp
};