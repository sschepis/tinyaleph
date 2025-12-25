/**
 * CLI Mode for Sentient Observer
 * 
 * Contains the SentientCLI class for interactive terminal interface.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { colors: c } = require('./constants');
const { printHelp } = require('./args');
const { initializeObserver, truncateToolContent, clearScreen, Spinner } = require('./shared');

const { MarkdownRenderer } = require('../markdown');
const { parseToolCalls, executeOpenAIToolCall } = require('../tools');
const { AssaySuite } = require('../assays');

/**
 * CLI interface for Sentient Observer
 */
class SentientCLI {
    constructor(options) {
        this.options = options;
        this.observer = null;
        this.chat = null;
        this.toolExecutor = null;
        this.senses = null;
        this.rl = null;
        this.isRunning = false;
        this.isWaitingForInput = false;
        this.isProcessingLLM = false;
        this.useColor = !options.noColor;
        this.spinner = new Spinner();
        this.lastMomentDisplay = 0;
        this.momentDisplayThrottle = 3000;
        this.conversationHistory = [];
        this.historyPath = path.join(options.dataPath, 'conversation-history.json');
    }
    
    /**
     * Apply color formatting if enabled
     */
    color(code, text) {
        if (!this.useColor) return text;
        return `${code}${text}${c.reset}`;
    }
    
    /**
     * Print the startup banner
     */
    printBanner() {
        console.log(this.color(c.bold + c.magenta, `
╔════════════════════════════════════════════════════════════╗
║              🌌 Sentient Observer Interface                ║
║      Emergent Time • Holographic Memory • Prime Resonance  ║
╚════════════════════════════════════════════════════════════╝
`));
    }
    
    /**
     * Initialize the CLI and observer
     */
    async init() {
        if (!this.options.noClear) clearScreen();
        this.printBanner();
        console.log(this.color(c.dim, 'Initializing Sentient Observer...'));
        console.log(this.color(c.dim, `Connecting to LMStudio at ${this.options.url}...`));
        
        const result = await initializeObserver(this.options, {
            onMoment: (m) => {
                this.displayMoment(m);
                if (this.senses) this.senses.recordMoment();
            },
            onOutput: (o) => this.handleOutput(o),
            onStateChange: () => {}
        });
        
        if (!result.success) {
            console.log(this.color(c.red, `\n⚠️  ${result.error}\n\nMake sure LMStudio is running with a model loaded.`));
            return false;
        }
        
        this.observer = result.observer;
        this.chat = result.chat;
        this.toolExecutor = result.toolExecutor;
        this.senses = result.senses;
        
        console.log(this.color(c.green, '✓ Sentient Observer online'));
        console.log(this.color(c.dim, `  Tick rate: ${this.options.tickRate}Hz | Primes: 64 | SMF: 16D`));
        console.log(this.color(c.dim, '\nType /help for commands, /quit to exit\n'));
        
        this.loadConversationHistory();
        return true;
    }
    
    /**
     * Load conversation history from disk
     */
    loadConversationHistory() {
        try {
            if (fs.existsSync(this.historyPath)) {
                this.conversationHistory = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
                if (this.conversationHistory.length > 0) {
                    console.log(this.color(c.dim, `  Loaded ${this.conversationHistory.length} messages from history`));
                }
            }
        } catch (e) { this.conversationHistory = []; }
    }
    
    /**
     * Save conversation history to disk
     */
    saveConversationHistory() {
        try {
            const dir = path.dirname(this.historyPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.historyPath, JSON.stringify(this.conversationHistory, null, 2));
        } catch (e) {}
    }
    
    /**
     * Add a message to conversation history
     */
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content, timestamp: Date.now() });
        if (this.conversationHistory.length > 100) {
            this.conversationHistory = this.conversationHistory.slice(-100);
        }
        this.saveConversationHistory();
    }
    
    /**
     * Display a moment notification
     */
    displayMoment(moment) {
        if (this.isWaitingForInput || this.isProcessingLLM) return;
        const now = Date.now();
        if (now - this.lastMomentDisplay < this.momentDisplayThrottle) return;
        this.lastMomentDisplay = now;
        const trigger = moment.trigger === 'coherence' ? '🎯' : moment.trigger === 'entropy_extreme' ? '⚡' : '📍';
        console.log(this.color(c.dim, `  ${trigger} Moment: C=${moment.coherence.toFixed(2)}, H=${moment.entropy.toFixed(2)}`));
    }
    
    /**
     * Handle observer output events
     */
    handleOutput(output) {
        if (this.isWaitingForInput || this.isProcessingLLM) return;
    }
    
    /**
     * Handle slash commands
     */
    async handleCommand(input) {
        const parts = input.slice(1).split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (cmd) {
            case 'help': case '?': printHelp(); break;
            case 'status': this.showStatus(); break;
            case 'senses': await this.showSenses(); break;
            case 'focus': this.handleFocus(args); break;
            case 'aperture': this.handleAperture(args); break;
            case 'introspect': this.showIntrospection(); break;
            case 'moments': this.showMoments(); break;
            case 'goals': this.showGoals(); break;
            case 'memory': this.showMemory(); break;
            case 'safety': this.showSafety(); break;
            case 'smf': this.showSMF(); break;
            case 'oscillators': this.showOscillators(); break;
            case 'assay': await this.runAssay(args); break;
            case 'pause': this.observer.stop(); console.log(this.color(c.yellow, 'Observer paused')); break;
            case 'resume': this.observer.start(); console.log(this.color(c.green, 'Observer resumed')); break;
            case 'save': this.save(); break;
            case 'reset': this.observer.reset(); console.log(this.color(c.yellow, 'Observer reset')); break;
            case 'history': this.showHistory(); break;
            case 'clear': this.conversationHistory = []; this.saveConversationHistory(); console.log(this.color(c.green, '✓ History cleared')); break;
            case 'quit': case 'exit': case 'q': await this.quit(); break;
            default: console.log(this.color(c.yellow, `Unknown command: /${cmd}`));
        }
    }
    
    /**
     * Show current sense readings
     */
    async showSenses() {
        console.log(this.color(c.bold, '\n👁️ Senses'));
        console.log('─'.repeat(50));
        const prompt = await this.senses.formatForPrompt({ forceRefresh: true });
        console.log(prompt);
        console.log();
    }
    
    /**
     * Handle /focus command
     */
    handleFocus(args) {
        if (args.length < 2) {
            console.log(this.color(c.yellow, 'Usage: /focus <sense> <path>'));
            console.log(this.color(c.dim, '  Senses: filesystem, git'));
            return;
        }
        const [sense, ...pathParts] = args;
        const target = pathParts.join(' ');
        if (this.senses.setFocus(sense, target)) {
            console.log(this.color(c.green, `✓ ${sense} focus set to: ${target}`));
        } else {
            console.log(this.color(c.yellow, `Unknown sense: ${sense}`));
        }
    }
    
    /**
     * Handle /aperture command
     */
    handleAperture(args) {
        if (args.length < 2) {
            console.log(this.color(c.yellow, 'Usage: /aperture <sense> <level>'));
            console.log(this.color(c.dim, '  Levels: narrow, medium, wide'));
            return;
        }
        const [sense, level] = args;
        if (this.senses.setAperture(sense, level)) {
            console.log(this.color(c.green, `✓ ${sense} aperture set to: ${level}`));
        } else {
            console.log(this.color(c.yellow, `Unknown sense: ${sense}`));
        }
    }
    
    /**
     * Show observer status
     */
    showStatus() {
        const s = this.observer.getStatus();
        console.log(this.color(c.bold, '\n📊 Observer Status'));
        console.log('─'.repeat(40));
        console.log(`  Running: ${s.running ? '✓' : '✗'} | Uptime: ${(s.uptime/1000).toFixed(1)}s`);
        console.log(`  Coherence: ${(s.state.coherence*100).toFixed(1)}% | Entropy: ${(s.state.entropy*100).toFixed(1)}%`);
        console.log(`  Moments: ${s.temporal.momentCount} | Memory: ${s.memory.traceCount}`);
        console.log();
    }
    
    /**
     * Show introspection report
     */
    showIntrospection() {
        const intro = this.observer.introspect();
        console.log(this.color(c.bold, '\n🔮 Introspection'));
        console.log('─'.repeat(40));
        console.log(`  Name: ${intro.identity.identity.name}`);
        console.log(`  Processing: ${(intro.metacognition.processingLoad*100).toFixed(0)}%`);
        console.log(`  Confidence: ${(intro.metacognition.confidenceLevel*100).toFixed(0)}%`);
        console.log();
    }
    
    /**
     * Show recent moments
     */
    showMoments() {
        const moments = this.observer.temporal.recentMoments(10);
        console.log(this.color(c.bold, '\n⏰ Recent Moments'));
        console.log('─'.repeat(40));
        if (moments.length === 0) console.log(this.color(c.dim, '  No moments yet'));
        for (const m of moments) {
            console.log(`  ${m.id}: ${m.trigger} | C=${m.coherence.toFixed(2)} | ${((Date.now()-m.timestamp)/1000).toFixed(1)}s ago`);
        }
        console.log();
    }
    
    /**
     * Show goals
     */
    showGoals() {
        const stats = this.observer.agency.getStats();
        console.log(this.color(c.bold, '\n🎯 Goals'));
        console.log('─'.repeat(40));
        console.log(`  Active: ${stats.activeGoals} | Achieved: ${stats.achievedGoals}`);
        console.log();
    }
    
    /**
     * Show memory stats
     */
    showMemory() {
        const stats = this.observer.memory.getStats();
        console.log(this.color(c.bold, '\n🧠 Memory'));
        console.log('─'.repeat(40));
        console.log(`  Traces: ${stats.traceCount} | Holographic: ${stats.holographicCount}`);
        console.log(`  Avg strength: ${(stats.averageStrength*100).toFixed(0)}%`);
        console.log();
    }
    
    /**
     * Show safety report
     */
    showSafety() {
        const r = this.observer.safety.generateReport();
        console.log(this.color(c.bold, '\n🛡️ Safety'));
        console.log('─'.repeat(40));
        console.log(`  Status: ${r.overallStatus}`);
        console.log(`  Violations: ${r.stats.totalViolations}`);
        console.log();
    }
    
    /**
     * Show SMF orientation
     */
    showSMF() {
        const smf = this.observer.smf;
        const axes = smf.constructor.AXES;
        console.log(this.color(c.bold, '\n🌀 SMF Orientation'));
        console.log('─'.repeat(40));
        for (let i = 0; i < Math.min(8, axes.length); i++) {
            const val = smf.s[i];
            const bar = val >= 0 ? '█'.repeat(Math.round(val*5)) : '░'.repeat(Math.round(-val*5));
            console.log(`  ${axes[i].padEnd(12)} ${val >= 0 ? '+' : '-'}${bar} ${val.toFixed(2)}`);
        }
        console.log();
    }
    
    /**
     * Show oscillator status
     */
    showOscillators() {
        const prsc = this.observer.prsc;
        console.log(this.color(c.bold, '\n🎵 PRSC Oscillators'));
        console.log('─'.repeat(40));
        console.log(`  Total: ${prsc.oscillators.length} | Active: ${prsc.oscillators.filter(o => o.amplitude > 0.1).length}`);
        console.log(`  Coherence: ${prsc.globalCoherence().toFixed(3)} | Energy: ${prsc.totalEnergy().toFixed(3)}`);
        console.log();
    }
    
    /**
     * Run evaluation assays
     */
    async runAssay(args) {
        const suite = new AssaySuite(this.observer);
        const assayName = args[0]?.toUpperCase() || 'ALL';
        
        console.log(this.color(c.bold, '\n🧪 Evaluation Assays (Section 15)'));
        console.log('─'.repeat(50));
        
        try {
            if (assayName === 'ALL') {
                const results = await suite.runAll();
                console.log(this.color(c.bold, '\nResults Summary:'));
                for (const a of results.assays) {
                    const status = a.passed ? this.color(c.green, '✓ PASSED') : this.color(c.red, '✗ FAILED');
                    console.log(`  Assay ${a.assay}: ${a.name} - ${status}`);
                }
                console.log(`\nOverall: ${results.summary.passed}/${results.summary.total} passed`);
            } else if (['A', 'B', 'C', 'D'].includes(assayName)) {
                const result = await suite.runSingle(assayName);
                const status = result.passed ? this.color(c.green, '✓ PASSED') : this.color(c.red, '✗ FAILED');
                console.log(`\nAssay ${result.assay}: ${result.name}`);
                console.log(`Status: ${status}`);
                console.log(`Interpretation: ${result.interpretation}`);
            } else {
                console.log(this.color(c.yellow, 'Usage: /assay [A|B|C|D|all]'));
                console.log(this.color(c.dim, '  A - Emergent Time Dilation'));
                console.log(this.color(c.dim, '  B - Memory Continuity Under Perturbation'));
                console.log(this.color(c.dim, '  C - Agency Under Constraint'));
                console.log(this.color(c.dim, '  D - Non-Commutative Meaning'));
                console.log(this.color(c.dim, '  all - Run all assays'));
            }
        } catch (error) {
            console.log(this.color(c.red, `Assay error: ${error.message}`));
        }
        console.log();
    }
    
    /**
     * Show conversation history
     */
    showHistory() {
        console.log(this.color(c.bold, '\n📜 History'));
        console.log('─'.repeat(40));
        if (this.conversationHistory.length === 0) {
            console.log(this.color(c.dim, '  No messages'));
        } else {
            for (const msg of this.conversationHistory.slice(-10)) {
                const role = msg.role === 'user' ? 'You' : 'Observer';
                const preview = msg.content.slice(0, 60).replace(/\n/g, ' ');
                console.log(`  ${role}: ${preview}${msg.content.length > 60 ? '...' : ''}`);
            }
        }
        console.log();
    }
    
    /**
     * Save observer state
     */
    save() {
        const data = this.observer.toJSON();
        const savePath = path.join(this.options.dataPath, 'sentient-state.json');
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
        console.log(this.color(c.green, `💾 Saved to ${savePath}`));
    }
    
    /**
     * Process user input
     */
    async processInput(input) {
        const trimmed = input.trim();
        if (!trimmed) return;
        
        if (trimmed.startsWith('/')) {
            await this.handleCommand(trimmed);
            return;
        }
        
        console.log();
        this.spinner.start('Processing...');
        
        // Record user input to senses
        this.senses.recordUserInput(trimmed);
        
        try {
            this.observer.processText(trimmed);
            await new Promise(r => setTimeout(r, 200));
            
            this.spinner.stop();
            process.stdout.write(this.color(c.cyan + c.bold, 'Observer: '));
            
            const mdRenderer = new MarkdownRenderer({
                useColor: this.useColor,
                onLine: (line) => process.stdout.write(line)
            });
            
            let response = '';
            let pendingToolCalls = [];
            
            this.addToHistory('user', trimmed);
            const historyMessages = this.conversationHistory.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
            
            // Get sense readings for injection
            const senseBlock = await this.senses.formatForPrompt();
            const enhancedInput = `${trimmed}\n\n---\n${senseBlock}`;
            
            this.isProcessingLLM = true;
            const llmStart = Date.now();
            try {
                for await (const chunk of this.chat.streamChat(enhancedInput, null, { conversationHistory: historyMessages })) {
                    if (chunk && typeof chunk === 'object' && chunk.type === 'tool_calls') {
                        pendingToolCalls = chunk.toolCalls;
                        continue;
                    }
                    if (typeof chunk === 'string') {
                        response += chunk;
                        mdRenderer.write(chunk);
                    }
                }
            } finally {
                this.isProcessingLLM = false;
                // Record LLM call to senses
                this.senses.recordLLMCall(Date.now() - llmStart);
            }
            
            mdRenderer.flush();
            console.log();
            
            if (response.trim()) {
                this.addToHistory('assistant', response);
                this.senses.recordResponse(response);
            }
            if (pendingToolCalls.length > 0) await this.handleToolCalls(pendingToolCalls, trimmed);
            
            const xmlToolCalls = parseToolCalls(response);
            if (xmlToolCalls.length > 0) await this.handleXmlToolCalls(xmlToolCalls, trimmed);
            
            console.log(this.color(c.dim, `  [C=${this.observer.currentState.coherence.toFixed(2)} H=${this.observer.currentState.entropy.toFixed(2)}]`));
            
        } catch (error) {
            this.spinner.stop();
            console.log(this.color(c.red, `Error: ${error.message}`));
        }
        
        console.log();
    }
    
    /**
     * Handle OpenAI-style tool calls
     */
    async handleToolCalls(toolCalls, originalInput, depth = 0) {
        if (depth > 10) return;
        
        console.log(this.color(c.dim, '\n── Tool Execution ──'));
        
        const results = [];
        for (const tc of toolCalls) {
            const result = await executeOpenAIToolCall(tc, this.toolExecutor);
            results.push({ tc, result });
            console.log(this.toolExecutor.formatResult({ tool: tc.function?.name || tc.name }, result));
        }
        
        if (results.length > 0) {
            const msg = results.map(r => {
                const name = r.tc.function?.name || r.tc.name;
                if (r.result.success) {
                    return `Tool ${name}: ${r.result.message || 'Success'}\n${truncateToolContent(r.result.content || '')}`;
                }
                return `Tool ${name} failed: ${r.result.error}`;
            }).join('\n\n');
            
            console.log(this.color(c.dim, '── Continuing... ──\n'));
            process.stdout.write(this.color(c.cyan + c.bold, 'Observer: '));
            
            const mdRenderer = new MarkdownRenderer({
                useColor: this.useColor,
                onLine: (line) => process.stdout.write(line)
            });
            
            let followUp = '';
            let moreCalls = [];
            
            const historyMessages = this.conversationHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
            
            this.isProcessingLLM = true;
            try {
                for await (const chunk of this.chat.streamChat(`${originalInput}\n\n[Tool Results]\n${msg}\n\nContinue.`, null, { conversationHistory: historyMessages })) {
                    if (chunk && typeof chunk === 'object' && chunk.type === 'tool_calls') {
                        moreCalls = chunk.toolCalls;
                        continue;
                    }
                    if (typeof chunk === 'string') {
                        followUp += chunk;
                        mdRenderer.write(chunk);
                    }
                }
            } finally {
                this.isProcessingLLM = false;
            }
            
            mdRenderer.flush();
            console.log();
            
            if (followUp.trim()) this.addToHistory('assistant', followUp);
            if (moreCalls.length > 0) await this.handleToolCalls(moreCalls, originalInput, depth + 1);
            
            const xmlCalls = parseToolCalls(followUp);
            if (xmlCalls.length > 0) await this.handleXmlToolCalls(xmlCalls, originalInput, depth + 1);
        }
    }
    
    /**
     * Handle XML-style tool calls
     */
    async handleXmlToolCalls(toolCalls, originalInput, depth = 0) {
        if (depth > 10) return;
        
        console.log(this.color(c.dim, '\n── Tool Execution ──'));
        
        const results = [];
        for (const tc of toolCalls) {
            const result = await this.toolExecutor.execute(tc);
            results.push({ tc, result });
            console.log(this.toolExecutor.formatResult(tc, result));
        }
        
        if (results.length > 0) {
            const msg = results.map(r => {
                if (r.result.success) {
                    return `Tool ${r.tc.tool}: ${r.result.message || 'Success'}\n${truncateToolContent(r.result.content || '')}`;
                }
                return `Tool ${r.tc.tool} failed: ${r.result.error}`;
            }).join('\n\n');
            
            console.log(this.color(c.dim, '── Continuing... ──\n'));
            process.stdout.write(this.color(c.cyan + c.bold, 'Observer: '));
            
            const mdRenderer = new MarkdownRenderer({
                useColor: this.useColor,
                onLine: (line) => process.stdout.write(line)
            });
            
            let followUp = '';
            let moreCalls = [];
            
            const historyMessages = this.conversationHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
            
            this.isProcessingLLM = true;
            try {
                for await (const chunk of this.chat.streamChat(`${originalInput}\n\n[Tool Results]\n${msg}\n\nContinue.`, null, { conversationHistory: historyMessages })) {
                    if (chunk && typeof chunk === 'object' && chunk.type === 'tool_calls') {
                        moreCalls = chunk.toolCalls;
                        continue;
                    }
                    if (typeof chunk === 'string') {
                        followUp += chunk;
                        mdRenderer.write(chunk);
                    }
                }
            } finally {
                this.isProcessingLLM = false;
            }
            
            mdRenderer.flush();
            console.log();
            
            if (followUp.trim()) this.addToHistory('assistant', followUp);
            
            const xmlCalls = parseToolCalls(followUp);
            if (xmlCalls.length > 0) await this.handleXmlToolCalls(xmlCalls, originalInput, depth + 1);
        }
    }
    
    /**
     * Quit the CLI
     */
    async quit() {
        console.log(this.color(c.yellow, '\nSaving state...'));
        this.save();
        this.observer.stop();
        console.log(this.color(c.magenta, 'Goodbye! 🌌\n'));
        this.isRunning = false;
        if (this.rl) this.rl.close();
        process.exit(0);
    }
    
    /**
     * Run the CLI main loop
     */
    async run() {
        const ok = await this.init();
        if (!ok) process.exit(1);
        
        this.isRunning = true;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const prompt = () => {
            this.isWaitingForInput = true;
            this.rl.question(this.color(c.green + c.bold, 'You: '), async (input) => {
                this.isWaitingForInput = false;
                await this.processInput(input);
                if (this.isRunning) prompt();
            });
        };
        
        prompt();
        
        this.rl.on('close', () => {
            if (this.isRunning) this.quit();
        });
    }
}

module.exports = {
    SentientCLI
};