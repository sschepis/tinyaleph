/**
 * Chaperone API
 * 
 * The trusted intermediary that handles ALL external requests from the autonomous learner.
 * 
 * Key responsibilities:
 * - Process learning queries (Q&A with chaperone LLM)
 * - Fetch and filter web content
 * - Read local files safely
 * - Summarize content
 * - Enforce whitelists and safety rules via SafetyFilter
 * - Log all interactions for eavesdropping
 * 
 * The Sentient Observer CANNOT make direct network requests - everything
 * must go through this Chaperone layer.
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

const { SafetyFilter } = require('./safety-filter');
const { LMStudioClient } = require('../lmstudio');
const config = require('./config');
const { createLogger } = require('../app/constants');

const log = createLogger('learning:chaperone');

/**
 * Clean LLM control tokens and structured output syntax from output
 * These tokens are used by some models (Qwen, LLaMA variants) for structured output
 * but should not appear in the final response
 */
function cleanControlTokens(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Pattern for control tokens like <|channel|>, <|constrain|>, <|message|>, <|im_start|>, etc.
    // Replace with a space to avoid merging adjacent words
    const controlTokenPattern = /<\|[^|>]+\|>/g;
    
    // Clean the tokens - replace with space to preserve word boundaries
    let cleaned = text.replace(controlTokenPattern, ' ');
    
    // Clean concatenated structured output patterns (tokens get joined together)
    // Pattern: "commentaryto=functions/..." or "systemto=..."
    cleaned = cleaned.replace(/\b(commentary|system|user|assistant|tool)to=\S*/gi, ' ');
    
    // Pattern: "channel_name to=target" with space
    cleaned = cleaned.replace(/\b(commentary|system|user|assistant|tool)\s+to=[^\s]+/gi, ' ');
    
    // Pattern: "json{" or "json[" - constrain type immediately before JSON
    cleaned = cleaned.replace(/\bjson\s*(?=[\[{])/gi, '');
    
    // Pattern: "to=functions/something" anywhere (standalone)
    cleaned = cleaned.replace(/\bto=\S+/g, ' ');
    
    // Pattern: standalone channel names at start of line or text (replace with space)
    cleaned = cleaned.replace(/^\s*(commentary|system|user|assistant|tool)\s*/gim, ' ');
    cleaned = cleaned.replace(/\b(commentary|system|user|assistant|tool)\b\s*/gi, ' ');
    
    // If the remaining content is primarily a JSON object (tool call), return empty
    const trimmed = cleaned.trim();
    if (/^\s*\{[\s\S]*\}\s*$/.test(trimmed)) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.path || parsed.command || parsed.arguments || parsed.function ||
                parsed.tool || parsed.name || parsed.input) {
                return '';
            }
        } catch (e) {
            // Not valid JSON, keep it
        }
    }
    
    // If content starts with JSON that looks like a tool call, remove it
    cleaned = cleaned.replace(/^\s*\{"path"\s*:\s*"[^"]*"\s*\}\s*/g, '');
    cleaned = cleaned.replace(/^\s*\{[^}]*"function"\s*:[^}]*\}\s*/g, '');
    
    // Clean up excessive newlines but PRESERVE internal spacing for markdown tables/code
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');  // Multiple newlines -> double
    
    return cleaned.trim();
}

class ChaperoneAPI {
    /**
     * Create a new ChaperoneAPI
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        const chaperoneConfig = { ...config.chaperone, ...options };
        
        // LLM client for Q&A
        this.llmClient = options.llmClient || new LMStudioClient({
            baseUrl: chaperoneConfig.llmUrl
        });
        
        // Safety filter for all requests
        this.safetyFilter = options.safetyFilter || new SafetyFilter(options.safetyConfig);
        
        // Event emitter for eavesdropping
        this.eventEmitter = new EventEmitter();
        
        // Configuration
        this.rateLimit = chaperoneConfig.rateLimit || 10;
        this.timeout = chaperoneConfig.timeout || 30000;
        this.maxLogEntries = chaperoneConfig.maxLogEntries || 1000;
        this.maxAnswerTokens = chaperoneConfig.maxAnswerTokens || 500;
        this.maxSummaryTokens = chaperoneConfig.maxSummaryTokens || 300;
        
        // Incoming directory for downloaded content
        this.incomingDir = options.incomingDir || path.join(os.homedir(), 'incoming');
        
        // Ensure incoming directory exists
        this._ensureIncomingDir();
        
        // Interaction log for eavesdropping
        this.interactionLog = [];
        
        // Request tracking
        this.requestTimes = [];
        
        log('Chaperone API initialized, LLM:', chaperoneConfig.llmUrl);
    }
    
    /**
     * Ensure the incoming directory exists
     * @private
     */
    async _ensureIncomingDir() {
        try {
            await fs.promises.mkdir(this.incomingDir, { recursive: true });
            log('Incoming directory ready:', this.incomingDir);
        } catch (error) {
            log.error('Failed to create incoming directory:', error.message);
        }
    }
    
    /**
     * Process a learning request from the observer
     * @param {Object} request - The request object
     * @returns {Promise<Object>} Response object
     */
    async processRequest(request) {
        // Rate limiting check
        const rateCheck = this.safetyFilter.checkRateLimit();
        if (!rateCheck.allowed) {
            const response = { 
                success: false, 
                error: rateCheck.reason, 
                retryAfter: rateCheck.retryAfter 
            };
            this._logInteraction('rate_limited', request, response);
            return response;
        }
        
        // Log the incoming request
        const logEntry = this._logInteraction('request', request);
        this.emit('request', logEntry);
        
        log('Processing request type:', request.type);
        
        try {
            let result;
            
            switch (request.type) {
                case 'question':
                    result = await this.handleQuestion(request);
                    break;
                    
                case 'fetch_content':
                    result = await this.handleFetchContent(request);
                    break;
                    
                case 'read_local':
                    result = await this.handleReadLocal(request);
                    break;
                    
                case 'summarize':
                    result = await this.handleSummarize(request);
                    break;
                    
                case 'search':
                    result = await this.handleSearch(request);
                    break;
                    
                default:
                    result = { 
                        success: false, 
                        error: `Unknown request type: ${request.type}. Valid types: question, fetch_content, read_local, summarize, search`
                    };
            }
            
            // Log the response
            const responseLog = this._logInteraction('response', request, result);
            this.emit('response', responseLog);
            
            return result;
            
        } catch (error) {
            log.error('Request processing error:', error.message);
            const errorResponse = { success: false, error: error.message };
            const errorLog = this._logInteraction('error', request, errorResponse);
            this.emit('error', errorLog);
            return errorResponse;
        }
    }
    
    /**
     * Handle a question to the chaperone LLM
     * @param {Object} request - { question, context? }
     */
    async handleQuestion(request) {
        const { question, context } = request;
        
        if (!question || typeof question !== 'string') {
            return { success: false, error: 'Question is required and must be a string' };
        }
        
        log('Handling question:', question.slice(0, 100));
        
        // Build the prompt
        const systemPrompt = `You are a knowledgeable research assistant helping an AI agent learn. 
Provide accurate, concise answers to questions. If you're uncertain, say so.
Focus on facts and explain concepts clearly.`;
        
        let fullPrompt = question;
        if (context) {
            fullPrompt = `Context: ${JSON.stringify(context)}\n\nQuestion: ${question}`;
        }
        
        try {
            const response = await this.llmClient.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: fullPrompt }
            ], {
                maxTokens: this.maxAnswerTokens,
                temperature: 0.7
            });
            
            // Clean control tokens from response
            const cleanedAnswer = cleanControlTokens(response.content);
            
            log('Question answered, tokens used:', response.usage?.total_tokens);
            
            // Emit answer event for immersive mode
            this.emit('answer', {
                question: question,
                answer: cleanedAnswer,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                type: 'answer',
                answer: cleanedAnswer,
                sources: [],
                usage: response.usage,
                timestamp: Date.now()
            };
            
        } catch (error) {
            log.error('LLM question error:', error.message);
            return { 
                success: false, 
                error: `LLM error: ${error.message}` 
            };
        }
    }
    
    /**
     * Handle content fetch request from URL
     * @param {Object} request - { url, format? }
     */
    async handleFetchContent(request) {
        const { url, format } = request;
        
        if (!url) {
            return { success: false, error: 'URL is required' };
        }
        
        // Safety check
        const urlCheck = this.safetyFilter.checkUrl(url);
        if (!urlCheck.allowed) {
            return { success: false, error: urlCheck.reason };
        }
        
        // Session file limit check
        const sessionCheck = this.safetyFilter.checkSessionFileLimit();
        if (!sessionCheck.allowed) {
            return { success: false, error: sessionCheck.reason };
        }
        
        log('Fetching content from:', url);
        
        try {
            const content = await this._fetchUrl(url);
            
            // Size check
            const sizeCheck = this.safetyFilter.checkContentSize(content.data.length);
            if (!sizeCheck.allowed) {
                return { success: false, error: sizeCheck.reason };
            }
            
            // Save to incoming directory
            const filename = this._generateFilename(url, content.mimeType);
            const filepath = path.join(this.incomingDir, filename);
            await fs.promises.writeFile(filepath, content.data);
            
            log('Content saved to:', filepath, 'size:', content.data.length);
            
            return {
                success: true,
                type: 'content',
                filepath,
                filename,
                url,
                contentType: content.mimeType,
                size: content.data.length,
                timestamp: Date.now()
            };
            
        } catch (error) {
            log.error('Fetch error:', error.message);
            return { 
                success: false, 
                error: `Fetch failed: ${error.message}` 
            };
        }
    }
    
    /**
     * Handle local file read request
     * @param {Object} request - { filepath, format? }
     */
    async handleReadLocal(request) {
        const { filepath, format } = request;
        
        if (!filepath) {
            return { success: false, error: 'Filepath is required' };
        }
        
        // Safety check
        const pathCheck = this.safetyFilter.checkPath(filepath);
        if (!pathCheck.allowed) {
            return { success: false, error: pathCheck.reason };
        }
        
        log('Reading local file:', filepath);
        
        try {
            // Check file exists
            await fs.promises.access(filepath, fs.constants.R_OK);
            
            // Read file
            const content = await fs.promises.readFile(filepath);
            
            // Size check
            const sizeCheck = this.safetyFilter.checkContentSize(content.length);
            if (!sizeCheck.allowed) {
                return { success: false, error: sizeCheck.reason };
            }
            
            // Parse based on format/extension
            const ext = path.extname(filepath).toLowerCase();
            let parsed;
            
            switch (format || ext) {
                case '.pdf':
                case 'pdf':
                    // For PDFs, we'll return raw content - actual parsing would need a library
                    parsed = content.toString('utf-8');
                    break;
                    
                case '.json':
                    parsed = JSON.parse(content.toString('utf-8'));
                    break;
                    
                case '.txt':
                case '.md':
                case '.markdown':
                case 'text':
                case 'markdown':
                    parsed = content.toString('utf-8');
                    break;
                    
                default:
                    parsed = content.toString('utf-8');
            }
            
            log('Local file read, size:', content.length);
            
            return {
                success: true,
                type: 'local_content',
                content: parsed,
                filepath,
                filename: path.basename(filepath),
                size: content.length,
                timestamp: Date.now()
            };
            
        } catch (error) {
            log.error('Local read error:', error.message);
            return { 
                success: false, 
                error: `File read failed: ${error.message}` 
            };
        }
    }
    
    /**
     * Handle summarization request
     * @param {Object} request - { content, maxLength?, focus? }
     */
    async handleSummarize(request) {
        const { content, maxLength, focus } = request;
        
        if (!content || typeof content !== 'string') {
            return { success: false, error: 'Content is required and must be a string' };
        }
        
        log('Summarizing content, length:', content.length, 'focus:', focus);
        
        const systemPrompt = 'You are a skilled summarizer. Create clear, accurate summaries that capture the key points.';
        
        const prompt = `Summarize the following content${focus ? ` focusing on ${focus}` : ''}. 
Keep the summary under ${maxLength || 200} words.

Content:
${content.slice(0, 4000)}

Summary:`;
        
        try {
            const response = await this.llmClient.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ], {
                maxTokens: this.maxSummaryTokens,
                temperature: 0.5
            });
            
            // Clean control tokens from summary
            const cleanedSummary = cleanControlTokens(response.content);
            
            log('Summary generated');
            
            return {
                success: true,
                type: 'summary',
                summary: cleanedSummary,
                originalLength: content.length,
                focus,
                timestamp: Date.now()
            };
            
        } catch (error) {
            log.error('Summarization error:', error.message);
            return { 
                success: false, 
                error: `Summarization failed: ${error.message}` 
            };
        }
    }
    
    /**
     * Handle search request (formulates search suggestions)
     * @param {Object} request - { query, type? }
     */
    async handleSearch(request) {
        const { query, type } = request;
        
        if (!query) {
            return { success: false, error: 'Search query is required' };
        }
        
        log('Handling search:', query);
        
        // Use LLM to formulate search URLs for whitelisted domains
        const systemPrompt = `You are a research assistant. Given a search query, suggest the best URLs from these domains:
- arxiv.org (for academic papers)
- github.com (for code and projects)
- wikipedia.org (for general knowledge)
- stackoverflow.com (for programming questions)
- docs.python.org (for Python documentation)
- developer.mozilla.org (for web documentation)

Return a JSON array of suggested URLs (maximum 3) that would be most relevant for the query.
Only suggest URLs, no explanations.`;
        
        try {
            const response = await this.llmClient.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Query: ${query}` }
            ], {
                maxTokens: 200,
                temperature: 0.3
            });
            
            // Try to parse URLs from response
            let suggestions = [];
            try {
                suggestions = JSON.parse(response.content);
            } catch {
                // Try to extract URLs with regex
                const urlRegex = /https?:\/\/[^\s"'\]]+/g;
                suggestions = response.content.match(urlRegex) || [];
            }
            
            // Validate all suggestions against safety filter
            const validSuggestions = suggestions.filter(url => 
                this.safetyFilter.checkUrl(url).allowed
            );
            
            log('Search suggestions:', validSuggestions.length);
            
            return {
                success: true,
                type: 'search_results',
                query,
                suggestions: validSuggestions,
                timestamp: Date.now()
            };
            
        } catch (error) {
            log.error('Search error:', error.message);
            return { 
                success: false, 
                error: `Search failed: ${error.message}` 
            };
        }
    }
    
    /**
     * Fetch content from a URL
     * @private
     */
    _fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'SentientObserver/1.0 (Autonomous Learning Agent)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml,text/plain,application/json,application/pdf'
                },
                timeout: this.timeout
            };
            
            const req = protocol.request(options, (res) => {
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Check redirect URL against safety filter
                    const redirectCheck = this.safetyFilter.checkUrl(res.headers.location);
                    if (!redirectCheck.allowed) {
                        reject(new Error(`Redirect blocked: ${redirectCheck.reason}`));
                        return;
                    }
                    
                    // Follow redirect
                    this._fetchUrl(res.headers.location)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                
                const chunks = [];
                let totalSize = 0;
                
                res.on('data', (chunk) => {
                    totalSize += chunk.length;
                    if (totalSize > this.safetyFilter.maxContentSize) {
                        req.destroy();
                        reject(new Error('Content size limit exceeded during download'));
                        return;
                    }
                    chunks.push(chunk);
                });
                
                res.on('end', () => {
                    resolve({
                        data: Buffer.concat(chunks),
                        mimeType: res.headers['content-type'] || 'application/octet-stream'
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }
    
    /**
     * Generate a unique filename for downloaded content
     * @private
     */
    _generateFilename(url, mimeType) {
        const parsedUrl = new URL(url);
        const baseName = path.basename(parsedUrl.pathname) || 'content';
        const timestamp = Date.now();
        
        // Determine extension from MIME type if not present
        let ext = path.extname(baseName);
        if (!ext) {
            const mimeToExt = {
                'text/html': '.html',
                'text/plain': '.txt',
                'text/markdown': '.md',
                'application/json': '.json',
                'application/pdf': '.pdf'
            };
            ext = mimeToExt[mimeType.split(';')[0]] || '.dat';
        }
        
        const nameWithoutExt = baseName.replace(ext, '');
        return `${nameWithoutExt}_${timestamp}${ext}`;
    }
    
    /**
     * Log an interaction for eavesdropping
     * @private
     */
    _logInteraction(type, request, response = null) {
        const entry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type,
            request: {
                type: request.type,
                topic: request.topic || request.question || request.url || request.filepath,
                timestamp: request.timestamp || Date.now()
            },
            response,
            timestamp: Date.now()
        };
        
        this.interactionLog.push(entry);
        
        // Keep only recent logs
        if (this.interactionLog.length > this.maxLogEntries) {
            this.interactionLog = this.interactionLog.slice(-this.maxLogEntries);
        }
        
        return entry;
    }
    
    /**
     * Get recent logs for eavesdropping
     * @param {number} count - Number of entries to return
     */
    getRecentLogs(count = 50) {
        return this.interactionLog.slice(-count);
    }
    
    /**
     * Get safety filter statistics
     */
    getSafetyStats() {
        return this.safetyFilter.getSessionStats();
    }
    
    /**
     * Get safety audit log
     */
    getSafetyAudit(count = 50) {
        return this.safetyFilter.getAuditLog(count);
    }
    
    /**
     * Reset session (clears rate limits and file counters)
     */
    resetSession() {
        this.safetyFilter.resetSession();
        log('Session reset');
    }
    
    /**
     * Subscribe to events
     */
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    
    /**
     * Emit an event
     */
    emit(event, data) {
        this.eventEmitter.emit(event, data);
    }
    
    /**
     * Remove event listener
     */
    off(event, callback) {
        this.eventEmitter.off(event, callback);
    }
    
    /**
     * Check if LLM is connected
     */
    async isConnected() {
        try {
            return await this.llmClient.isConnected();
        } catch {
            return false;
        }
    }
}

module.exports = { ChaperoneAPI };