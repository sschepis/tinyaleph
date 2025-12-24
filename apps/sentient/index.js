#!/usr/bin/env node

/**
 * AlephChat CLI
 *
 * Interactive chat client with semantic learning and LMStudio integration.
 */

const readline = require('readline');
const { emitKeypressEvents } = require('readline');
const fs = require('fs');
const path = require('path');
const { AlephChat } = require('./lib/chat');
const { MarkdownRenderer, formatMarkdown } = require('./lib/markdown');
const { ToolExecutor, executeOpenAIToolCall, processToolCalls } = require('./lib/tools');

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

// Clear screen
function clearScreen() {
    process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Simple terminal spinner
 */
class Spinner {
    constructor(options = {}) {
        this.frames = options.frames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.interval = options.interval || 80;
        this.text = options.text || 'Thinking...';
        this.color = options.color || '\x1b[36m'; // cyan
        this.frameIndex = 0;
        this.timer = null;
        this.isSpinning = false;
    }
    
    start(text) {
        if (this.isSpinning) return this;
        if (text) this.text = text;
        
        this.isSpinning = true;
        this.frameIndex = 0;
        
        // Hide cursor
        process.stdout.write('\x1b[?25l');
        
        this.timer = setInterval(() => {
            const frame = this.frames[this.frameIndex];
            process.stdout.write(`\r${this.color}${frame}\x1b[0m ${this.text}`);
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }, this.interval);
        
        return this;
    }
    
    stop(finalMessage = null) {
        if (!this.isSpinning) return this;
        
        clearInterval(this.timer);
        this.isSpinning = false;
        
        // Clear the line
        process.stdout.write('\r\x1b[K');
        
        // Show cursor
        process.stdout.write('\x1b[?25h');
        
        if (finalMessage) {
            process.stdout.write(finalMessage);
        }
        
        return this;
    }
    
    succeed(text) {
        return this.stop(`\x1b[32m✓\x1b[0m ${text || this.text}\n`);
    }
    
    fail(text) {
        return this.stop(`\x1b[31m✗\x1b[0m ${text || this.text}\n`);
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        url: 'http://192.168.4.79:1234/v1',
        dataPath: './data',
        noColor: false,
        help: false,
        noClear: false
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
        } else if (args[i] === '--no-clear') {
            options.noClear = true;
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
  --no-clear          Don't clear screen on startup
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

// Chat history manager
class ChatHistory {
    constructor(historyPath) {
        this.historyPath = historyPath;
        this.messages = [];
        this.load();
    }
    
    add(role, content, metadata = {}) {
        this.messages.push({
            role,
            content,
            timestamp: Date.now(),
            ...metadata
        });
        this.save();
    }
    
    getAll() {
        return this.messages;
    }
    
    clear() {
        this.messages = [];
        this.save();
    }
    
    save() {
        if (!this.historyPath) return;
        
        const dir = path.dirname(this.historyPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(this.historyPath, JSON.stringify(this.messages, null, 2));
    }
    
    load() {
        if (!this.historyPath || !fs.existsSync(this.historyPath)) return;
        
        try {
            this.messages = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
        } catch (e) {
            this.messages = [];
        }
    }
}

// Main CLI class
class AlephChatCLI {
    constructor(options) {
        this.options = options;
        this.chat = null;
        this.rl = null;
        this.isRunning = false;
        this.isStreaming = false;
        this.streamAborted = false;
        this.useColor = !options.noColor;
        this.toolExecutor = new ToolExecutor({
            workingDir: process.cwd(),
            useColor: !options.noColor
        });
        
        // Initialize chat history
        const historyPath = path.join(options.dataPath || './data', 'chat-history.json');
        this.history = new ChatHistory(historyPath);
        
        // Initialize spinner for loading states
        this.spinner = new Spinner({ text: 'Thinking...' });
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
        // Clear screen if not disabled
        if (!this.options.noClear) {
            clearScreen();
        }
        
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
        
        // Display chat history if exists
        this.displayHistory();

        return true;
    }
    
    // Display saved chat history
    displayHistory() {
        const messages = this.history.getAll();
        if (messages.length === 0) return;
        
        console.log(this.color(c.dim, '─── Previous conversation ───'));
        console.log();
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                console.log(this.color(c.bold, 'You: ') + msg.content);
            } else if (msg.role === 'assistant') {
                process.stdout.write(this.color(c.cyan + c.bold, 'Aleph: '));
                console.log(formatMarkdown(msg.content, this.useColor));
            } else if (msg.role === 'tool') {
                console.log(this.color(c.dim, `  [Tool: ${msg.tool}]`));
            }
            console.log();
        }
        
        console.log(this.color(c.dim, '─── End of history ───'));
        console.log();
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
                this.history.clear();
                console.log(this.color(c.green, 'Session cleared (learned data preserved)'));
                break;
            
            case 'history':
                this.displayHistory();
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

        // Save user message to history
        this.history.add('user', trimmed);

        // Chat
        console.log();
        
        // Show spinner while waiting for first response
        this.spinner.start('Thinking...');
        
        try {
            let response = '';
            let pendingToolCalls = null;
            let firstChunk = true;
            
            // Create markdown renderer for streaming output
            const mdRenderer = new MarkdownRenderer({
                useColor: this.useColor,
                onLine: (line) => {
                    if (!this.streamAborted) {
                        process.stdout.write(line);
                    }
                }
            });
            
            // Mark streaming state
            this.isStreaming = true;
            this.streamAborted = false;
            
            // Pass conversation history to the LLM
            const conversationHistory = this.history.getAll();
            
            for await (const chunk of this.chat.streamChat(trimmed, null, { conversationHistory })) {
                // Stop spinner on first content and show prefix
                if (firstChunk && typeof chunk === 'string' && chunk.length > 0) {
                    this.spinner.stop();
                    process.stdout.write(this.color(c.cyan + c.bold, 'Aleph: '));
                    firstChunk = false;
                }
                
                // Check if stream was aborted
                if (this.streamAborted) {
                    break;
                }
                
                // Handle OpenAI-format tool calls
                if (chunk && typeof chunk === 'object' && chunk.type === 'tool_calls') {
                    pendingToolCalls = chunk.toolCalls;
                    continue;
                }
                
                // Handle regular text
                if (typeof chunk === 'string') {
                    response += chunk;
                    mdRenderer.write(chunk);
                }
            }
            
            // Mark streaming done
            this.isStreaming = false;
            
            // Stop spinner if still running (e.g., no response)
            this.spinner.stop();
            
            // Handle aborted stream
            if (this.streamAborted) {
                mdRenderer.reset();
                console.log(this.color(c.yellow, '\n  [Interrupted]'));
                console.log();
                this.streamAborted = false;
                return;
            }
            
            // Flush any remaining buffered content
            mdRenderer.flush();
            if (response.trim()) {
                console.log();
            }
            
            // Save assistant response to history (if any)
            if (response.trim()) {
                this.history.add('assistant', response);
            }
            
            // Handle OpenAI-format tool calls
            if (pendingToolCalls && pendingToolCalls.length > 0) {
                console.log();
                console.log(this.color(c.dim, '  [Executing tools...]'));
                console.log();
                
                for (const toolCall of pendingToolCalls) {
                    const toolName = toolCall.function?.name || 'unknown';
                    let args = {};
                    try {
                        args = JSON.parse(toolCall.function?.arguments || '{}');
                    } catch (e) {
                        args = {};
                    }
                    
                    // Execute the tool
                    const result = await executeOpenAIToolCall(toolCall, this.toolExecutor);
                    
                    // Format and display result
                    console.log(this.toolExecutor.formatResult({ tool: toolName, ...args }, result));
                    console.log();
                    
                    // Save tool execution to history
                    this.history.add('tool', result.message || 'Tool executed', {
                        tool: toolName,
                        success: result.success
                    });
                    
                    // Send the result back to the LLM for analysis
                    if (result.success) {
                        let toolResultMessage = `Tool "${toolName}" result:\n`;
                        if (result.content) {
                            toolResultMessage += `\nContent:\n\`\`\`\n${result.content}\n\`\`\``;
                        }
                        if (result.stdout) {
                            toolResultMessage += `\nOutput:\n\`\`\`\n${result.stdout}\n\`\`\``;
                        }
                        if (result.message) {
                            toolResultMessage += `\n${result.message}`;
                        }
                        
                        // Continue conversation with tool result
                        console.log(this.color(c.dim, '  [Analyzing result...]'));
                        console.log();
                        
                        // Show spinner while analyzing
                        this.spinner.start('Analyzing...');
                        let continueFirstChunk = true;
                        
                        let continueResponse = '';
                        const continueRenderer = new MarkdownRenderer({
                            useColor: this.useColor,
                            onLine: (line) => process.stdout.write(line)
                        });
                        
                        // Pass tool result back to LLM (without tools to prevent loop, but with history)
                        for await (const chunk of this.chat.streamChat(toolResultMessage, null, { tools: false, conversationHistory })) {
                            // Stop spinner on first chunk
                            if (continueFirstChunk && typeof chunk === 'string' && chunk.length > 0) {
                                this.spinner.stop();
                                process.stdout.write(this.color(c.cyan + c.bold, 'Aleph: '));
                                continueFirstChunk = false;
                            }
                            
                            if (typeof chunk === 'string') {
                                continueResponse += chunk;
                                continueRenderer.write(chunk);
                            }
                        }
                        this.spinner.stop(); // Ensure spinner stopped
                        continueRenderer.flush();
                        console.log();
                        
                        // Save continuation to history
                        if (continueResponse.trim()) {
                            this.history.add('assistant', continueResponse);
                        }
                    }
                }
            } else {
                // Fallback: Check for XML-style tool calls in response (for models that don't use OpenAI format)
                const toolResult = await processToolCalls(response, this.toolExecutor);
                
                if (toolResult.hasTools) {
                    console.log();
                    for (const { toolCall, result } of toolResult.results) {
                        console.log(this.toolExecutor.formatResult(toolCall, result));
                        console.log();
                        
                        this.history.add('tool', result.message || 'Tool executed', {
                            tool: toolCall.tool,
                            success: result.success
                        });
                        
                        if (result.success) {
                            let toolContext = `Tool "${toolCall.tool}" executed successfully.\n`;
                            if (result.content) {
                                toolContext += `\nFile contents:\n\`\`\`\n${result.content}\n\`\`\``;
                            }
                            if (result.stdout) {
                                toolContext += `\nCommand output:\n\`\`\`\n${result.stdout}\n\`\`\``;
                            }
                            if (result.message) {
                                toolContext += `\n${result.message}`;
                            }
                            
                            console.log(this.color(c.dim, '  [Analyzing result...]'));
                            console.log();
                            
                            // Show spinner while analyzing
                            this.spinner.start('Analyzing...');
                            let xmlContinueFirstChunk = true;
                            
                            let continueResponse = '';
                            const continueRenderer = new MarkdownRenderer({
                                useColor: this.useColor,
                                onLine: (line) => process.stdout.write(line)
                            });
                            
                            for await (const chunk of this.chat.streamChat(toolContext, null, { tools: false, conversationHistory })) {
                                // Stop spinner on first chunk
                                if (xmlContinueFirstChunk && typeof chunk === 'string' && chunk.length > 0) {
                                    this.spinner.stop();
                                    process.stdout.write(this.color(c.cyan + c.bold, 'Aleph: '));
                                    xmlContinueFirstChunk = false;
                                }
                                
                                if (typeof chunk === 'string') {
                                    continueResponse += chunk;
                                    continueRenderer.write(chunk);
                                }
                            }
                            this.spinner.stop(); // Ensure spinner stopped
                            continueRenderer.flush();
                            console.log();
                            
                            if (continueResponse.trim()) {
                                this.history.add('assistant', continueResponse);
                            }
                        }
                    }
                }
            }
            
            // Show metadata
            if (response.trim()) {
                const metadata = this.chat.processor.scoreResponse(response, trimmed);
                console.log(this.color(c.dim, `  [Coherence: ${(metadata.coherence * 100).toFixed(0)}%]`));
            }
            
        } catch (error) {
            this.spinner.stop();
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
        
        // Track readline state
        let rlClosed = false;
        this.rl.on('close', () => {
            rlClosed = true;
        });

        const prompt = () => {
            if (rlClosed || !this.isRunning) return;
            
            this.rl.question(this.color(c.bold, 'You: '), async (input) => {
                if (rlClosed) return;
                await this.processInput(input);
                if (this.isRunning && !rlClosed) prompt();
            });
        };

        prompt();
        
        // Show interrupt hint
        console.log(this.color(c.dim, '  Tip: Press Ctrl+C during AI response to interrupt'));
        console.log();

        // Handle Ctrl+C - interrupt streaming or quit
        process.on('SIGINT', async () => {
            if (this.isStreaming) {
                // If streaming, abort the stream
                this.streamAborted = true;
            } else {
                // Otherwise, quit
                console.log();
                await this.quit();
            }
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