#!/usr/bin/env node

/**
 * AlephChat CLI
 * 
 * Interactive chat client with semantic learning and LMStudio integration.
 */

const readline = require('readline');
const { AlephChat } = require('./lib/chat');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgMagenta: '\x1b[45m'
};

const c = colors;

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        url: 'http://192.168.4.79:1234/v1',
        dataPath: './data',
        noColor: false,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--url' || args[i] === '-u') {
            options.url = args[++i];
        } else if (args[i] === '--data' || args[i] === '-d') {
            options.dataPath = args[++i];
        } else if (args[i] === '--no-color') {
            options.noColor = true;
        } else if (args[i] === '--help' || args[i] === '-h') {
            options.help = true;
        }
    }
    
    return options;
}

// Print help
function printHelp() {
    console.log(`
${c.bold}AlephChat${c.reset} - Semantic LLM Chat Client

${c.bold}Usage:${c.reset}
  node index.js [options]

${c.bold}Options:${c.reset}
  -u, --url <url>     LMStudio API URL (default: http://localhost:1234/v1)
  -d, --data <path>   Data directory path (default: ./data)
  --no-color          Disable colored output
  -h, --help          Show this help message

${c.bold}Commands:${c.reset}
  /status             Show session statistics
  /topics             List current topics
  /vocab              Show vocabulary statistics
  /style              Display style profile
  /concepts <word>    Query concept graph
  /similar <word>     Find similar words
  /forget <word>      Remove word from vocabulary
  /save               Save all data
  /clear              Clear session (keep learned data)
  /reset              Reset everything
  /help               Show this help
  /quit, /exit        Exit and save

${c.bold}Examples:${c.reset}
  Start chatting:     node index.js
  Custom URL:         node index.js --url http://192.168.1.10:1234/v1
`);
}

// Format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Main CLI class
class AlephChatCLI {
    constructor(options) {
        this.options = options;
        this.chat = null;
        this.rl = null;
        this.isRunning = false;
        this.useColor = !options.noColor;
    }

    // Color helper
    color(code, text) {
        if (!this.useColor) return text;
        return `${code}${text}${c.reset}`;
    }

    // Print banner
    printBanner() {
        console.log(this.color(c.bold + c.cyan, `
╔═══════════════════════════════════════════════════════╗
║                    🌟 AlephChat                       ║
║      Semantic LLM Chat with TinyAleph Learning        ║
╚═══════════════════════════════════════════════════════╝
`));
    }

    // Initialize
    async init() {
        this.printBanner();
        
        console.log(this.color(c.dim, 'Initializing...'));
        
        this.chat = new AlephChat({
            lmstudioUrl: this.options.url,
            dataPath: this.options.dataPath,
            onNewWord: (word) => {
                console.log(this.color(c.green, `  📚 Learned: "${word}"`));
            },
            onTopicChange: (update) => {
                if (update.isNewTopic) {
                    console.log(this.color(c.blue, `  🎯 New topic: ${update.matchedTopic}`));
                }
            }
        });

        // Connect to LMStudio
        console.log(this.color(c.dim, `Connecting to LMStudio at ${this.options.url}...`));
        const connected = await this.chat.connect();
        
        if (!connected) {
            console.log(this.color(c.red, `
⚠️  Could not connect to LMStudio at ${this.options.url}
    
    Make sure LMStudio is running with:
    1. A model loaded
    2. Local server enabled (Settings → Local Server)
    3. Default port 1234 or specify with --url
`));
            return false;
        }

        const stats = this.chat.getStats();
        console.log(this.color(c.green, `✓ Connected to LMStudio`));
        console.log(this.color(c.dim, `  Model: ${stats.model || 'Unknown'}`));
        console.log(this.color(c.dim, `  Vocabulary: ${stats.vocabulary.totalWords} words`));
        console.log();
        console.log(this.color(c.dim, 'Type /help for commands, /quit to exit'));
        console.log();

        return true;
    }

    // Handle commands
    async handleCommand(input) {
        const parts = input.slice(1).split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
            case '?':
                printHelp();
                break;

            case 'status':
                this.showStatus();
                break;

            case 'topics':
                this.showTopics();
                break;

            case 'vocab':
                this.showVocab();
                break;

            case 'style':
                this.showStyle();
                break;

            case 'concepts':
                if (args.length === 0) {
                    console.log(this.color(c.yellow, 'Usage: /concepts <word>'));
                } else {
                    this.showConcepts(args.join(' '));
                }
                break;

            case 'similar':
                if (args.length === 0) {
                    console.log(this.color(c.yellow, 'Usage: /similar <word>'));
                } else {
                    this.showSimilar(args.join(' '));
                }
                break;

            case 'forget':
                if (args.length === 0) {
                    console.log(this.color(c.yellow, 'Usage: /forget <word>'));
                } else {
                    const word = args.join(' ');
                    if (this.chat.forgetWord(word)) {
                        console.log(this.color(c.green, `Forgot: "${word}"`));
                    } else {
                        console.log(this.color(c.yellow, `Word not found: "${word}"`));
                    }
                }
                break;

            case 'save':
                this.chat.save();
                console.log(this.color(c.green, '💾 Saved!'));
                break;

            case 'clear':
                this.chat.clearSession();
                console.log(this.color(c.green, 'Session cleared (learned data preserved)'));
                break;

            case 'reset':
                console.log(this.color(c.yellow, 'Are you sure? This will delete all learned data.'));
                console.log(this.color(c.dim, 'Type /reset-confirm to confirm'));
                break;

            case 'reset-confirm':
                this.chat.reset();
                console.log(this.color(c.green, 'All data reset'));
                break;

            case 'quit':
            case 'exit':
            case 'q':
                await this.quit();
                break;

            default:
                console.log(this.color(c.yellow, `Unknown command: /${cmd}`));
                console.log(this.color(c.dim, 'Type /help for available commands'));
        }
    }

    // Show status
    showStatus() {
        const stats = this.chat.getStats();
        
        console.log(this.color(c.bold, '\n📊 Session Status'));
        console.log('─'.repeat(40));
        console.log(`  Model:         ${stats.model || 'Unknown'}`);
        console.log(`  Duration:      ${formatDuration(stats.sessionDuration)}`);
        console.log(`  Exchanges:     ${stats.exchangeCount}`);
        console.log(`  Words learned: ${stats.vocabulary.sessionWords} (session) / ${stats.vocabulary.totalWords} (total)`);
        console.log(`  Topics:        ${stats.topics.length} active`);
        console.log(`  Concepts:      ${stats.concepts.nodeCount} nodes, ${stats.concepts.edgeCount} edges`);
        console.log(`  Memory:        ${stats.memory.sessionCount} indexed, ${stats.memory.immediateCount} in buffer`);
        console.log();
    }

    // Show topics
    showTopics() {
        const topics = this.chat.getTopics();
        
        console.log(this.color(c.bold, '\n🎯 Current Topics'));
        console.log('─'.repeat(40));
        
        if (topics.length === 0) {
            console.log(this.color(c.dim, '  No topics yet. Start chatting!'));
        } else {
            for (const t of topics) {
                const bar = '█'.repeat(Math.round(t.weight * 10)) + '░'.repeat(10 - Math.round(t.weight * 10));
                console.log(`  ${t.topic.padEnd(20)} ${bar} (${t.mentions} mentions)`);
            }
        }
        console.log();
    }

    // Show vocabulary stats
    showVocab() {
        const stats = this.chat.getVocabStats();
        
        console.log(this.color(c.bold, '\n📚 Vocabulary'));
        console.log('─'.repeat(40));
        console.log(`  Total words:     ${stats.totalWords}`);
        console.log(`  Session words:   ${stats.sessionWords}`);
        console.log(`  Avg frequency:   ${stats.avgFrequency.toFixed(1)}`);
        console.log(`  Recent:          ${stats.recentWords.slice(0, 5).join(', ')}`);
        console.log();
    }

    // Show style profile
    showStyle() {
        const style = this.chat.getStyleProfile();
        
        console.log(this.color(c.bold, '\n🎨 Style Profile'));
        console.log('─'.repeat(40));
        console.log(`  Confidence:    ${style.confidence}`);
        
        if (style.hints.length > 0) {
            console.log(`  Observations:`);
            for (const hint of style.hints) {
                console.log(`    • ${hint}`);
            }
        } else {
            console.log(this.color(c.dim, '  Still learning your style...'));
        }
        
        if (style.metrics) {
            console.log(`  Metrics:`);
            console.log(`    Avg length:      ${style.metrics.avgLength.toFixed(0)} chars`);
            console.log(`    Technical level: ${(style.metrics.technicalLevel * 100).toFixed(0)}%`);
            console.log(`    Formality:       ${(style.metrics.formalityScore * 100).toFixed(0)}%`);
            console.log(`    Question ratio:  ${(style.metrics.questionRatio * 100).toFixed(0)}%`);
        }
        console.log();
    }

    // Show concepts
    showConcepts(query) {
        const result = this.chat.queryConcepts(query);
        
        console.log(this.color(c.bold, `\n🔗 Concepts: "${query}"`));
        console.log('─'.repeat(40));
        
        if (result.exact) {
            console.log(`  Found: "${result.exact.concept}" (${result.exact.mentions} mentions)`);
            
            if (Object.keys(result.outgoing).length > 0) {
                console.log(`  Outgoing:`);
                for (const [rel, targets] of Object.entries(result.outgoing)) {
                    console.log(`    ${rel}: ${targets.map(t => t.concept).join(', ')}`);
                }
            }
            
            if (Object.keys(result.incoming).length > 0) {
                console.log(`  Incoming:`);
                for (const [rel, sources] of Object.entries(result.incoming)) {
                    console.log(`    ${rel}: ${sources.map(s => s.concept).join(', ')}`);
                }
            }
        }
        
        if (result.similar && result.similar.length > 0) {
            console.log(`  Similar:`);
            for (const s of result.similar.slice(0, 5)) {
                console.log(`    ${s.concept} (${(s.similarity * 100).toFixed(0)}%)`);
            }
        }
        console.log();
    }

    // Show similar words
    showSimilar(word) {
        const similar = this.chat.findSimilarWords(word);
        
        console.log(this.color(c.bold, `\n🔍 Similar to "${word}"`));
        console.log('─'.repeat(40));
        
        if (similar.length === 0) {
            console.log(this.color(c.dim, '  No similar words found'));
        } else {
            for (const s of similar) {
                console.log(`  ${s.word.padEnd(20)} ${(s.similarity * 100).toFixed(0)}%`);
            }
        }
        console.log();
    }

    // Process user input
    async processInput(input) {
        const trimmed = input.trim();
        
        if (!trimmed) return;
        
        // Handle commands
        if (trimmed.startsWith('/')) {
            await this.handleCommand(trimmed);
            return;
        }

        // Chat
        console.log();
        process.stdout.write(this.color(c.cyan + c.bold, 'Aleph: '));
        
        try {
            let response = '';
            for await (const chunk of this.chat.streamChat(trimmed)) {
                process.stdout.write(chunk);
                response += chunk;
            }
            console.log();
            
            // Show metadata
            const metadata = this.chat.processor.scoreResponse(response, trimmed);
            console.log(this.color(c.dim, `  [Coherence: ${(metadata.coherence * 100).toFixed(0)}%]`));
            
        } catch (error) {
            console.log(this.color(c.red, `Error: ${error.message}`));
        }
        
        console.log();
    }

    // Quit
    async quit() {
        console.log(this.color(c.dim, '\nSaving session...'));
        this.chat.endSession();
        
        const stats = this.chat.getStats();
        console.log(this.color(c.green, '✓ Session saved'));
        console.log(this.color(c.dim, `  ${stats.exchangeCount} exchanges, ${stats.vocabulary.sessionWords} new words`));
        console.log(this.color(c.cyan, '\n👋 Goodbye!\n'));
        
        this.isRunning = false;
        this.rl.close();
        process.exit(0);
    }

    // Run main loop
    async run() {
        const initialized = await this.init();
        if (!initialized) {
            process.exit(1);
        }

        this.isRunning = true;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const prompt = () => {
            this.rl.question(this.color(c.bold, 'You: '), async (input) => {
                await this.processInput(input);
                if (this.isRunning) prompt();
            });
        };

        prompt();

        // Handle Ctrl+C
        process.on('SIGINT', async () => {
            console.log();
            await this.quit();
        });
    }
}

// Main
async function main() {
    const options = parseArgs();
    
    if (options.help) {
        printHelp();
        process.exit(0);
    }

    const cli = new AlephChatCLI(options);
    await cli.run();
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});