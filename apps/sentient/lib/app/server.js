/**
 * Server Mode for Sentient Observer
 * 
 * Contains the SentientServer class for HTTP API and web UI.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');

const { MIME_TYPES } = require('./constants');
const { initializeObserver, truncateToolContent } = require('./shared');

const { parseToolCalls, processToolCalls } = require('../tools');

/**
 * HTTP Server for Sentient Observer
 */
class SentientServer {
    constructor(options) {
        this.options = options;
        this.observer = null;
        this.chat = null;
        this.toolExecutor = null;
        this.senses = null;
        this.server = null;
        this.sseClients = new Set();
        this.conversationHistory = [];
        this.historyPath = path.join(options.dataPath, 'conversation-history.json');
    }
    
    /**
     * Load conversation history from disk
     */
    loadConversationHistory() {
        try {
            if (fs.existsSync(this.historyPath)) {
                this.conversationHistory = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
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
     * Broadcast moment to SSE clients
     */
    broadcastMoment(moment) {
        const data = JSON.stringify({
            type: 'moment',
            data: moment
        });
        for (const client of this.sseClients) {
            try {
                client.write(`data: ${data}\n\n`);
            } catch (e) {
                this.sseClients.delete(client);
            }
        }
    }
    
    /**
     * Initialize the server and observer
     */
    async init() {
        console.log(`Initializing Sentient Observer...`);
        console.log(`Connecting to LMStudio at ${this.options.url}...`);
        
        const result = await initializeObserver(this.options, {
            onMoment: (m) => this.broadcastMoment(m),
            onOutput: () => {},
            onStateChange: () => {}
        });
        
        if (!result.success) {
            console.error(`Error: ${result.error}`);
            return false;
        }
        
        this.observer = result.observer;
        this.chat = result.chat;
        this.toolExecutor = result.toolExecutor;
        this.senses = result.senses;
        
        this.loadConversationHistory();
        
        console.log('✓ Sentient Observer initialized');
        return true;
    }
    
    /**
     * Set CORS headers on response
     */
    setCorsHeaders(res) {
        if (this.options.cors) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }
    }
    
    /**
     * Send JSON response
     */
    sendJson(res, data, status = 200) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    
    /**
     * Handle incoming HTTP requests
     */
    async handleRequest(req, res) {
        this.setCorsHeaders(res);
        
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        
        // API Routes
        if (pathname === '/chat' && req.method === 'POST') {
            await this.handleChat(req, res);
            return;
        }
        
        // Streaming chat endpoint
        if (pathname === '/chat/stream' && req.method === 'POST') {
            await this.handleStreamingChat(req, res);
            return;
        }
        
        if (pathname === '/status' && req.method === 'GET') {
            this.sendJson(res, this.observer.getStatus());
            return;
        }
        
        // Debug endpoint to test LLM connection
        if (pathname === '/debug/llm' && req.method === 'GET') {
            try {
                const connected = await this.chat.connect();
                const modelName = await this.chat.llm.getCurrentModel();
                this.sendJson(res, {
                    connected,
                    modelName,
                    baseUrl: this.chat.llm.baseUrl,
                    host: this.chat.llm.host,
                    port: this.chat.llm.port
                });
            } catch (error) {
                this.sendJson(res, {
                    connected: false,
                    error: error.message,
                    baseUrl: this.chat.llm?.baseUrl
                }, 500);
            }
            return;
        }
        
        // Test endpoint for simple LLM ping
        if (pathname === '/debug/ping' && req.method === 'GET') {
            try {
                console.log('[Debug/Ping] Testing LLM connection...');
                const response = await this.chat.llm.complete('Say "pong" and nothing else.');
                console.log('[Debug/Ping] Response:', response);
                this.sendJson(res, {
                    success: true,
                    response,
                    message: 'LLM is responding'
                });
            } catch (error) {
                console.error('[Debug/Ping] Error:', error.message);
                this.sendJson(res, {
                    success: false,
                    error: error.message
                }, 500);
            }
            return;
        }
        
        if (pathname === '/introspect' && req.method === 'GET') {
            this.sendJson(res, this.observer.introspect());
            return;
        }
        
        if (pathname === '/history' && req.method === 'GET') {
            this.sendJson(res, { messages: this.conversationHistory });
            return;
        }
        
        if (pathname === '/history' && req.method === 'DELETE') {
            this.conversationHistory = [];
            this.saveConversationHistory();
            this.sendJson(res, { success: true });
            return;
        }
        
        if (pathname === '/senses' && req.method === 'GET') {
            const reading = await this.senses.read(true);
            
            // Format sense data for the UI
            const senseData = {};
            for (const [name, data] of Object.entries(reading.readings)) {
                const r = data.reading || {};
                senseData[name] = {
                    enabled: data.enabled !== false,
                    error: data.error || null,
                    summary: this.getSenseSummary(name, r),
                    active: !data.error && data.enabled !== false
                };
            }
            
            this.sendJson(res, {
                timestamp: reading.timestamp,
                senses: senseData,
                anomalies: reading.anomalies.map(a => ({
                    sense: a.sense,
                    message: a.message,
                    salience: a.salience
                })),
                config: this.senses.getConfig()
            });
            return;
        }
        
        // SMF orientation endpoint
        if (pathname === '/smf' && req.method === 'GET') {
            const smf = this.observer.smf;
            const axes = ['coherence', 'identity', 'duality', 'structure', 'change',
                          'life', 'harmony', 'wisdom', 'infinity', 'creation',
                          'truth', 'love', 'power', 'time', 'space', 'consciousness'];
            const axisDescriptions = [
                'internal consistency', 'self-continuity', 'complementarity', 'organization',
                'transformation', 'vitality', 'balance', 'insight', 'boundlessness', 'genesis',
                'verity', 'connection', 'capacity', 'temporality', 'extension', 'awareness'
            ];
            const orientation = {};
            const components = [];
            axes.forEach((axis, i) => {
                orientation[axis] = smf.s[i];
                components.push({
                    index: i,
                    name: axis,
                    value: smf.s[i],
                    absValue: Math.abs(smf.s[i]),
                    description: axisDescriptions[i]
                });
            });
            
            // Track SMF history for visualization
            if (!this.smfHistory) {
                this.smfHistory = [];
            }
            
            // Add current state to history (keep last 60 samples = ~2 minutes at 2s polling)
            this.smfHistory.push({
                timestamp: Date.now(),
                components: smf.s.slice()
            });
            if (this.smfHistory.length > 60) {
                this.smfHistory.shift();
            }
            
            this.sendJson(res, {
                orientation,
                axes,
                components,
                entropy: smf.smfEntropy(),
                norm: smf.norm(),
                dominant: smf.dominantAxes(5).map(a => ({ name: a.name, value: a.value, index: a.index })),
                history: this.smfHistory.slice(-20).map(h => ({
                    t: h.timestamp,
                    c: h.components
                }))
            });
            return;
        }
        
        // Oscillators endpoint
        if (pathname === '/oscillators' && req.method === 'GET') {
            const prsc = this.observer.prsc;
            const topOscillators = prsc.oscillators
                .filter(o => o.amplitude > 0.05)
                .sort((a, b) => b.amplitude - a.amplitude)
                .slice(0, 16)
                .map(o => ({
                    prime: o.prime,
                    amplitude: o.amplitude,
                    phase: o.phase,
                    frequency: o.frequency
                }));
            
            this.sendJson(res, {
                active: prsc.activeCount(0.1),
                energy: prsc.totalEnergy(),
                coherence: prsc.globalCoherence(),
                meanPhase: prsc.meanPhase(),
                amplitudeEntropy: prsc.amplitudeEntropy(),
                topOscillators
            });
            return;
        }
        
        // Moments endpoint
        if (pathname === '/moments' && req.method === 'GET') {
            const count = parseInt(url.searchParams.get('count')) || 10;
            const moments = this.observer.temporal.recentMoments(count);
            this.sendJson(res, {
                moments: moments.map(m => m.toJSON()),
                subjectiveTime: this.observer.temporal.getSubjectiveTime(),
                momentCount: this.observer.temporal.moments.length,
                stats: this.observer.temporal.getStats()
            });
            return;
        }
        
        // Goals endpoint
        if (pathname === '/goals' && req.method === 'GET') {
            const agency = this.observer.agency;
            this.sendJson(res, {
                topGoal: agency.getTopGoal()?.toJSON() || null,
                topFocus: agency.getTopFocus()?.toJSON() || null,
                activeGoals: agency.goals.filter(g => g.isActive).map(g => g.toJSON()),
                foci: agency.attentionFoci.map(f => f.toJSON()),
                stats: agency.getStats()
            });
            return;
        }
        
        // Safety endpoint
        if (pathname === '/safety' && req.method === 'GET') {
            this.sendJson(res, this.observer.safety.getStats());
            return;
        }
        
        // Memory endpoint
        if (pathname === '/memory' && req.method === 'GET') {
            const count = parseInt(url.searchParams.get('count')) || 5;
            this.sendJson(res, {
                recent: this.observer.memory.getRecent(count).map(t => t.toJSON()),
                stats: this.observer.memory.getStats()
            });
            return;
        }
        
        // Boundary/Identity endpoint
        if (pathname === '/identity' && req.method === 'GET') {
            this.sendJson(res, this.observer.boundary.getStats());
            return;
        }
        
        // HQE stabilization endpoint
        if (pathname === '/stabilization' && req.method === 'GET') {
            this.sendJson(res, this.observer.hqe.getStabilizationStats());
            return;
        }
        
        // Status SSE stream
        if (pathname === '/stream/status' && req.method === 'GET') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            
            // Send initial status
            const status = {
                coherence: this.observer.currentState.coherence,
                entropy: this.observer.currentState.entropy,
                momentCount: this.observer.temporal.moments.length
            };
            res.write(`data: ${JSON.stringify({ type: 'status', data: status })}\n\n`);
            
            // Set up periodic updates
            const interval = setInterval(() => {
                try {
                    const status = {
                        coherence: this.observer.currentState.coherence,
                        entropy: this.observer.currentState.entropy,
                        momentCount: this.observer.temporal.moments.length,
                        topFocus: this.observer.agency.getTopFocus()?.target,
                        safetyLevel: this.observer.currentState.safetyLevel
                    };
                    res.write(`data: ${JSON.stringify({ type: 'status', data: status })}\n\n`);
                } catch (e) {
                    clearInterval(interval);
                }
            }, 1000);
            
            req.on('close', () => {
                clearInterval(interval);
            });
            return;
        }
        
        if (pathname === '/stream/moments' && req.method === 'GET') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            this.sseClients.add(res);
            req.on('close', () => this.sseClients.delete(res));
            return;
        }
        
        // Static files
        await this.serveStatic(req, res, pathname);
    }
    
    /**
     * Handle chat API endpoint
     */
    async handleChat(req, res) {
        try {
            const body = await this.readBody(req);
            const { message } = JSON.parse(body);
            
            if (!message) {
                this.sendJson(res, { error: 'Message required' }, 400);
                return;
            }
            
            this.observer.processText(message);
            this.addToHistory('user', message);
            
            // Record to senses
            if (this.senses) {
                this.senses.recordUserInput(message);
            }
            
            const historyMessages = this.conversationHistory.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
            
            // Get sense readings for injection
            let enhancedMessage = message;
            if (this.senses) {
                const senseBlock = await this.senses.formatForPrompt();
                enhancedMessage = `${message}\n\n---\n${senseBlock}`;
            }
            
            let response = '';
            const llmStart = Date.now();
            for await (const chunk of this.chat.streamChat(enhancedMessage, null, { conversationHistory: historyMessages })) {
                if (typeof chunk === 'string') response += chunk;
            }
            
            // Record LLM call to senses
            if (this.senses) {
                this.senses.recordLLMCall(Date.now() - llmStart);
                this.senses.recordResponse(response);
            }
            
            // Process tool calls and get cleaned response (without tool call XML)
            const { hasTools, results, cleanedResponse } = await processToolCalls(response, this.toolExecutor);
            
            // Store the clean response in history (without tool call XML)
            this.addToHistory('assistant', cleanedResponse);
            
            // Format tool results for the response
            const toolResults = results.map(r => ({
                tool: r.toolCall.tool,
                success: r.result.success,
                content: truncateToolContent(r.result.content || r.result.error || r.result.message)
            }));
            
            this.sendJson(res, {
                response: cleanedResponse,
                toolResults,
                hasTools,
                state: {
                    coherence: this.observer.currentState.coherence,
                    entropy: this.observer.currentState.entropy
                }
            });
            
        } catch (error) {
            this.sendJson(res, { error: error.message }, 500);
        }
    }
    
    /**
     * Handle streaming chat API endpoint
     */
    async handleStreamingChat(req, res) {
        try {
            const body = await this.readBody(req);
            const { message } = JSON.parse(body);
            
            if (!message) {
                this.sendJson(res, { error: 'Message required' }, 400);
                return;
            }
            
            // Set up SSE response
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            
            this.observer.processText(message);
            this.addToHistory('user', message);
            
            // Record to senses
            if (this.senses) {
                this.senses.recordUserInput(message);
            }
            
            const historyMessages = this.conversationHistory.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
            
            // Get sense readings for injection
            let enhancedMessage = message;
            if (this.senses) {
                const senseBlock = await this.senses.formatForPrompt();
                enhancedMessage = `${message}\n\n---\n${senseBlock}`;
            }
            
            // Send initial thinking event
            res.write(`event: thinking\ndata: ${JSON.stringify({ status: 'starting' })}\n\n`);
            
            let fullResponse = '';
            let chunkCount = 0;
            let pendingToolCalls = null;
            const llmStart = Date.now();
            const MAX_TOOL_ITERATIONS = 5;
            
            console.log('[Stream] Starting stream for message:', message.substring(0, 50) + '...');
            console.log('[Stream] History messages:', historyMessages.length);
            console.log('[Stream] Enhanced message length:', enhancedMessage.length);
            console.log('[Stream] Chat connected:', this.chat.isConnected);
            console.log('[Stream] Model:', this.chat.modelName);
            
            // Build conversation messages for multi-turn tool use
            let conversationMessages = [...historyMessages];
            let currentUserMessage = enhancedMessage;
            let toolIteration = 0;
            
            try {
                // Loop to handle tool calls - LLM may need multiple rounds
                while (toolIteration < MAX_TOOL_ITERATIONS) {
                    toolIteration++;
                    console.log(`[Stream] Tool iteration ${toolIteration}`);
                    
                    const streamGenerator = this.chat.streamChat(currentUserMessage, null, {
                        conversationHistory: conversationMessages
                    });
                    console.log('[Stream] Got stream generator');
                    
                    let iterationResponse = '';
                    pendingToolCalls = null;
                    
                    for await (const chunk of streamGenerator) {
                        if (typeof chunk === 'string') {
                            iterationResponse += chunk;
                            fullResponse += chunk;
                            chunkCount++;
                            
                            // Log progress periodically
                            if (chunkCount % 10 === 1) {
                                console.log(`[Stream] Chunk #${chunkCount}, total: ${fullResponse.length} chars`);
                            }
                            
                            // Send chunk event
                            res.write(`event: chunk\ndata: ${JSON.stringify({
                                content: chunk,
                                total: fullResponse.length,
                                chunkNum: chunkCount
                            })}\n\n`);
                        } else if (chunk && typeof chunk === 'object' && chunk.type === 'tool_calls') {
                            console.log('[Stream] Tool calls detected:', chunk.toolCalls?.length);
                            pendingToolCalls = chunk.toolCalls;
                            
                            // Send tool call event to UI
                            res.write(`event: tool_call\ndata: ${JSON.stringify({
                                toolCalls: chunk.toolCalls
                            })}\n\n`);
                        } else {
                            console.log('[Stream] Unknown chunk type:', chunk);
                        }
                    }
                    
                    console.log(`[Stream] Iteration ${toolIteration} complete: ${iterationResponse.length} chars, tool calls: ${pendingToolCalls?.length || 0}`);
                    
                    // If we have tool calls, execute them and continue
                    if (pendingToolCalls && pendingToolCalls.length > 0) {
                        console.log('[Stream] Executing', pendingToolCalls.length, 'tool calls...');
                        
                        // Execute each tool call
                        const toolResults = [];
                        for (const toolCall of pendingToolCalls) {
                            const toolName = toolCall.function?.name;
                            let toolArgs = {};
                            
                            try {
                                toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
                            } catch (e) {
                                console.log('[Stream] Failed to parse tool args:', e.message);
                            }
                            
                            console.log('[Stream] Executing tool:', toolName, 'with args:', JSON.stringify(toolArgs).substring(0, 100));
                            
                            // Send tool execution event
                            res.write(`event: tool_exec\ndata: ${JSON.stringify({
                                tool: toolName,
                                status: 'executing'
                            })}\n\n`);
                            
                            let result;
                            try {
                                // ToolExecutor.execute expects object with tool property and args spread
                                result = await this.toolExecutor.execute({
                                    tool: toolName,
                                    ...toolArgs
                                });
                            } catch (toolError) {
                                result = { success: false, error: toolError.message };
                            }
                            
                            console.log('[Stream] Tool result:', toolName, 'success:', result.success);
                            
                            // Send tool result event
                            res.write(`event: tool_result\ndata: ${JSON.stringify({
                                tool: toolName,
                                success: result.success,
                                content: truncateToolContent(result.content || result.error || result.message || 'No output')
                            })}\n\n`);
                            
                            toolResults.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                content: JSON.stringify(result.success ? (result.content || result.message || 'Success') : (result.error || 'Failed'))
                            });
                        }
                        
                        // Build messages for next iteration
                        // Add assistant message with tool calls
                        conversationMessages.push({
                            role: 'assistant',
                            content: iterationResponse || null,
                            tool_calls: pendingToolCalls
                        });
                        
                        // Add tool results
                        for (const tr of toolResults) {
                            conversationMessages.push(tr);
                        }
                        
                        // Clear user message for continuation (use empty to continue)
                        currentUserMessage = '';
                        
                        console.log('[Stream] Continuing with tool results, conversation length:', conversationMessages.length);
                    } else {
                        // No more tool calls, we're done
                        console.log('[Stream] No more tool calls, finishing');
                        break;
                    }
                }
                
                console.log(`[Stream] Complete: ${chunkCount} chunks, ${fullResponse.length} chars after ${toolIteration} iterations`);
                
                // If no chunks received, log more details
                if (chunkCount === 0 && !pendingToolCalls) {
                    console.log('[Stream] WARNING: No chunks received from LLM');
                    console.log('[Stream] LLM client state:', {
                        baseUrl: this.chat.llm?.baseUrl,
                        model: this.chat.llm?.model,
                        connected: this.chat.isConnected
                    });
                }
            } catch (streamError) {
                console.error('[Stream] Error:', streamError);
                console.error('[Stream] Error stack:', streamError.stack);
                res.write(`event: error\ndata: ${JSON.stringify({ error: streamError.message })}\n\n`);
            }
            
            // Record LLM call to senses
            if (this.senses) {
                this.senses.recordLLMCall(Date.now() - llmStart);
                this.senses.recordResponse(fullResponse);
            }
            
            // Process any remaining tool calls in the text response (XML-based)
            const { hasTools, results, cleanedResponse } = await processToolCalls(fullResponse, this.toolExecutor);
            
            // Store the clean response in history
            this.addToHistory('assistant', cleanedResponse || fullResponse);
            
            // Format tool results for the response
            const toolResults = results.map(r => ({
                tool: r.toolCall.tool,
                success: r.result.success,
                content: truncateToolContent(r.result.content || r.result.error || r.result.message)
            }));
            
            // Send complete event with final data
            res.write(`event: complete\ndata: ${JSON.stringify({
                response: cleanedResponse || fullResponse,
                toolResults,
                hasTools,
                state: {
                    coherence: this.observer.currentState.coherence,
                    entropy: this.observer.currentState.entropy
                }
            })}\n\n`);
            
            res.end();
            
        } catch (error) {
            try {
                res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
                res.end();
            } catch (e) {
                // Connection already closed
            }
        }
    }
    
    /**
     * Read request body
     */
    readBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
    
    /**
     * Serve static files
     */
    async serveStatic(req, res, pathname) {
        const staticPath = path.resolve(this.options.staticPath);
        let filePath = path.join(staticPath, pathname === '/' ? 'index.html' : pathname);
        
        // Security: prevent directory traversal
        if (!filePath.startsWith(staticPath)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        try {
            const stat = await fs.promises.stat(filePath);
            
            if (stat.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
            
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            
            const content = await fs.promises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            
        } catch (error) {
            // SPA fallback
            if (error.code === 'ENOENT') {
                try {
                    const indexPath = path.join(staticPath, 'index.html');
                    const content = await fs.promises.readFile(indexPath);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                } catch (e) {
                    res.writeHead(404);
                    res.end('Not Found');
                }
            } else {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        }
    }
    
    /**
     * Get a summary string for a sense reading
     */
    getSenseSummary(name, reading) {
        switch (name) {
            case 'chrono':
                if (!reading.uptime) return 'Initializing...';
                const mins = Math.floor(reading.uptime / 60000);
                return mins > 0 ? `Up ${mins}m` : `Up ${Math.floor(reading.uptime / 1000)}s`;
            
            case 'proprio':
                if (!reading.coherence) return 'No data';
                return `C=${(reading.coherence * 100).toFixed(0)}% H=${(reading.entropy * 100).toFixed(0)}%`;
            
            case 'filesystem':
                if (!reading.files) return 'Scanning...';
                return `${reading.files} files`;
            
            case 'git':
                if (!reading.branch) return 'No repo';
                return reading.isDirty ? `${reading.branch} (dirty)` : reading.branch;
            
            case 'process':
                if (!reading.memory) return 'Loading...';
                const mb = Math.floor(reading.memory / (1024 * 1024));
                return `${mb}MB | CPU ${(reading.cpu * 100).toFixed(0)}%`;
            
            case 'network':
                if (reading.connected === false) return 'Disconnected';
                if (!reading.latency) return 'Connected';
                return `${reading.latency.toFixed(0)}ms`;
            
            case 'user':
                if (!reading.idleDuration) return 'Active';
                const idle = reading.idleDuration;
                if (idle < 60000) return `Idle ${Math.floor(idle / 1000)}s`;
                return `Idle ${Math.floor(idle / 60000)}m`;
            
            default:
                return 'Unknown';
        }
    }
    
    /**
     * Start the HTTP server
     */
    async start() {
        const ok = await this.init();
        if (!ok) process.exit(1);
        
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        this.server.listen(this.options.port, this.options.host, () => {
            console.log(`\n🌌 Sentient Observer Server`);
            console.log(`   Listening on http://${this.options.host}:${this.options.port}`);
            console.log(`   Static files: ${this.options.staticPath}`);
            console.log(`\n   API Endpoints:`);
            console.log(`   POST /chat              Send message`);
            console.log(`   GET  /status            Observer status`);
            console.log(`   GET  /introspect        Full introspection`);
            console.log(`   GET  /senses            Current sense readings`);
            console.log(`   GET  /history           Conversation history`);
            console.log(`   DELETE /history         Clear history`);
            console.log(`   GET  /stream/moments    SSE moment stream`);
            console.log(`\n   Press Ctrl+C to stop\n`);
        });
        
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            this.observer.stop();
            this.server.close();
            process.exit(0);
        });
    }
}

module.exports = {
    SentientServer
};