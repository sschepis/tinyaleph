/**
 * Mock LLM Service for Testing
 * 
 * Provides a configurable mock LLM client for unit and integration testing.
 * Features:
 * - Configurable response generation
 * - Response templates with variable substitution
 * - Delay simulation for latency testing
 * - Request recording for assertion
 * - Error injection for error handling tests
 * - Token counting simulation
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ============================================================================
// MOCK RESPONSE GENERATORS
// ============================================================================

/**
 * Default response generators for different request types
 */
const defaultGenerators = {
    // Simple echo response
    echo: (prompt) => ({
        content: `Echo: ${prompt}`,
        model: 'mock-model',
        finishReason: 'stop'
    }),
    
    // Fixed response
    fixed: (prompt, config) => ({
        content: config.response || 'Default mock response',
        model: 'mock-model',
        finishReason: 'stop'
    }),
    
    // JSON response
    json: (prompt, config) => ({
        content: JSON.stringify(config.jsonTemplate || { result: 'success' }),
        model: 'mock-model',
        finishReason: 'stop'
    }),
    
    // Regex-based pattern matching
    pattern: (prompt, config) => {
        const patterns = config.patterns || [];
        for (const { regex, response } of patterns) {
            const re = new RegExp(regex, 'i');
            if (re.test(prompt)) {
                return {
                    content: typeof response === 'function' ? response(prompt) : response,
                    model: 'mock-model',
                    finishReason: 'stop'
                };
            }
        }
        return {
            content: config.defaultResponse || 'No pattern matched',
            model: 'mock-model',
            finishReason: 'stop'
        };
    },
    
    // Random response from list
    random: (prompt, config) => {
        const responses = config.responses || ['Response A', 'Response B', 'Response C'];
        const idx = Math.floor(Math.random() * responses.length);
        return {
            content: responses[idx],
            model: 'mock-model',
            finishReason: 'stop'
        };
    },
    
    // Streaming-style response (split by sentences)
    streaming: (prompt, config) => {
        const content = config.response || 'This is a streaming response. It has multiple sentences. Each will be a chunk.';
        const chunks = content.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
        return {
            content,
            chunks,
            model: 'mock-model',
            finishReason: 'stop',
            isStreaming: true
        };
    },
    
    // Semantic analysis mock (returns fake SMF-like analysis)
    semantic: (prompt, config) => {
        const axes = new Array(16).fill(0).map(() => Math.random());
        const sum = Math.sqrt(axes.reduce((a, b) => a + b * b, 0));
        const normalized = axes.map(v => v / sum);
        
        return {
            content: JSON.stringify({
                analysis: {
                    coherence: Math.random() * 0.5 + 0.5,
                    entropy: Math.random() * 2,
                    smfAxes: normalized,
                    topics: ['topic1', 'topic2'],
                    sentiment: Math.random() > 0.5 ? 'positive' : 'neutral'
                }
            }),
            model: 'mock-model',
            finishReason: 'stop'
        };
    },
    
    // Code editing mock
    codeEdit: (prompt, config) => {
        // Parse instruction to generate plausible edit response
        const match = prompt.match(/file[:\s]+([^\n]+)/i);
        const fileName = match ? match[1].trim() : 'unknown.js';
        
        return {
            content: JSON.stringify({
                thoughtProcess: 'Analyzed the code and identified necessary changes.',
                edits: [
                    {
                        filePath: fileName,
                        searchBlock: '// TODO: implement',
                        replaceBlock: '// Implementation complete'
                    }
                ]
            }),
            model: 'mock-model',
            finishReason: 'stop'
        };
    }
};

// ============================================================================
// MOCK LLM CLIENT
// ============================================================================

/**
 * MockLLMClient
 * 
 * A configurable mock implementation of the LLM client interface.
 */
class MockLLMClient extends EventEmitter {
    /**
     * Create a MockLLMClient
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        super();
        
        this.model = options.model || 'mock-model';
        this.connected = true;
        this.delay = options.delay || 0; // Simulated response delay (ms)
        
        // Response generation
        this.generator = options.generator || 'echo';
        this.generatorConfig = options.generatorConfig || {};
        this.customGenerators = options.customGenerators || {};
        
        // Request recording
        this.recordRequests = options.recordRequests ?? true;
        this.requests = [];
        this.maxRecordedRequests = options.maxRecordedRequests || 1000;
        
        // Error injection
        this.errorRate = options.errorRate || 0; // 0-1 probability of error
        this.errorMessages = options.errorMessages || ['Simulated error'];
        
        // Token simulation
        this.tokenMultiplier = options.tokenMultiplier || 1.3; // tokens per character
        this.maxTokens = options.maxTokens || 4096;
        
        // Usage tracking
        this.usage = {
            promptTokens: 0,
            completionTokens: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0
        };
        
        // Specific response queue (for deterministic testing)
        this.responseQueue = [];
        
        // Callbacks
        this.onRequest = options.onRequest || null;
        this.onResponse = options.onResponse || null;
    }
    
    /**
     * Check if client is connected
     * @returns {Promise<boolean>}
     */
    async isConnected() {
        return this.connected;
    }
    
    /**
     * Get current model name
     * @returns {Promise<string>}
     */
    async getCurrentModel() {
        return this.model;
    }
    
    /**
     * List available models
     * @returns {Promise<Array>}
     */
    async listModels() {
        return [
            { id: 'mock-model', name: 'Mock Model' },
            { id: 'mock-model-fast', name: 'Mock Model (Fast)' },
            { id: 'mock-model-smart', name: 'Mock Model (Smart)' }
        ];
    }
    
    /**
     * Estimate token count for text
     * @param {string} text - Text to count
     * @returns {number}
     */
    estimateTokens(text) {
        return Math.ceil((text?.length || 0) * this.tokenMultiplier / 4);
    }
    
    /**
     * Queue a specific response for next request (FIFO)
     * @param {*} response - Response to return
     */
    queueResponse(response) {
        this.responseQueue.push(response);
    }
    
    /**
     * Queue multiple responses
     * @param {Array} responses - Responses to queue
     */
    queueResponses(responses) {
        this.responseQueue.push(...responses);
    }
    
    /**
     * Clear response queue
     */
    clearQueue() {
        this.responseQueue = [];
    }
    
    /**
     * Generate a response
     * @param {string} prompt - The prompt text
     * @param {Object} options - Generation options
     * @returns {Promise<Object>}
     */
    async generate(prompt, options = {}) {
        this.usage.totalRequests++;
        
        // Record request
        const requestRecord = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            prompt,
            options,
            response: null,
            error: null,
            duration: 0
        };
        
        if (this.recordRequests) {
            this.requests.push(requestRecord);
            if (this.requests.length > this.maxRecordedRequests) {
                this.requests.shift();
            }
        }
        
        if (this.onRequest) {
            this.onRequest(requestRecord);
        }
        
        const startTime = Date.now();
        
        try {
            // Simulate delay
            if (this.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
            
            // Check for error injection
            if (this.errorRate > 0 && Math.random() < this.errorRate) {
                const errorMsg = this.errorMessages[
                    Math.floor(Math.random() * this.errorMessages.length)
                ];
                throw new Error(errorMsg);
            }
            
            // Check for queued response
            let response;
            if (this.responseQueue.length > 0) {
                response = this.responseQueue.shift();
                if (typeof response === 'function') {
                    response = response(prompt, options);
                }
                if (typeof response === 'string') {
                    response = { content: response, model: this.model, finishReason: 'stop' };
                }
            } else {
                // Use generator
                const generator = this.customGenerators[this.generator] || 
                                  defaultGenerators[this.generator] ||
                                  defaultGenerators.echo;
                
                response = generator(prompt, this.generatorConfig);
            }
            
            // Update usage stats
            const promptTokens = this.estimateTokens(prompt);
            const completionTokens = this.estimateTokens(response.content);
            
            this.usage.promptTokens += promptTokens;
            this.usage.completionTokens += completionTokens;
            this.usage.successfulRequests++;
            
            // Enrich response
            const fullResponse = {
                ...response,
                model: this.model,
                usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens
                }
            };
            
            requestRecord.response = fullResponse;
            requestRecord.duration = Date.now() - startTime;
            
            if (this.onResponse) {
                this.onResponse(requestRecord);
            }
            
            this.emit('response', fullResponse, requestRecord);
            
            return fullResponse;
        } catch (error) {
            this.usage.failedRequests++;
            requestRecord.error = error.message;
            requestRecord.duration = Date.now() - startTime;
            
            this.emit('error', error, requestRecord);
            throw error;
        }
    }
    
    /**
     * Generate with streaming
     * @param {string} prompt - The prompt text
     * @param {Object} options - Generation options
     * @returns {AsyncGenerator<string>}
     */
    async *generateStream(prompt, options = {}) {
        // Force streaming generator
        const originalGenerator = this.generator;
        const originalConfig = this.generatorConfig;
        
        this.generator = 'streaming';
        this.generatorConfig = {
            ...this.generatorConfig,
            response: options.mockResponse || 'This is a streaming response. Each sentence is a chunk.'
        };
        
        try {
            const response = await this.generate(prompt, options);
            
            if (response.chunks) {
                for (const chunk of response.chunks) {
                    if (this.delay > 0) {
                        await new Promise(r => setTimeout(r, this.delay / response.chunks.length));
                    }
                    yield chunk;
                }
            } else {
                yield response.content;
            }
        } finally {
            this.generator = originalGenerator;
            this.generatorConfig = originalConfig;
        }
    }
    
    /**
     * Complete a prompt (alias for generate, for compatibility with CachedLLMProvider)
     * @param {string} prompt - The prompt text
     * @param {Object} options - Generation options
     * @returns {Promise<Object>}
     */
    async complete(prompt, options = {}) {
        return this.generate(prompt, options);
    }
    
    /**
     * Chat completion (array of messages)
     * @param {Array} messages - Chat messages
     * @param {Object} options - Options
     * @returns {Promise<Object>}
     */
    async chat(messages, options = {}) {
        // Convert messages to single prompt
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        return this.generate(prompt, options);
    }
    
    // ========================================================================
    // TEST UTILITIES
    // ========================================================================
    
    /**
     * Get all recorded requests
     * @returns {Array}
     */
    getRequests() {
        return [...this.requests];
    }
    
    /**
     * Get last N requests
     * @param {number} n - Number of requests
     * @returns {Array}
     */
    getLastRequests(n = 1) {
        return this.requests.slice(-n);
    }
    
    /**
     * Find requests matching a pattern
     * @param {RegExp|string} pattern - Pattern to match prompts
     * @returns {Array}
     */
    findRequests(pattern) {
        const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
        return this.requests.filter(r => re.test(r.prompt));
    }
    
    /**
     * Assert a specific request was made
     * @param {Object} assertion - Assertion criteria
     * @returns {boolean}
     */
    assertRequest(assertion) {
        return this.requests.some(r => {
            if (assertion.prompt && !r.prompt.includes(assertion.prompt)) return false;
            if (assertion.promptRegex && !assertion.promptRegex.test(r.prompt)) return false;
            if (assertion.afterTimestamp && r.timestamp <= assertion.afterTimestamp) return false;
            if (assertion.beforeTimestamp && r.timestamp >= assertion.beforeTimestamp) return false;
            return true;
        });
    }
    
    /**
     * Clear recorded requests
     */
    clearRequests() {
        this.requests = [];
    }
    
    /**
     * Get usage statistics
     * @returns {Object}
     */
    getUsage() {
        return { ...this.usage };
    }
    
    /**
     * Reset usage statistics
     */
    resetUsage() {
        this.usage = {
            promptTokens: 0,
            completionTokens: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0
        };
    }
    
    /**
     * Set error rate
     * @param {number} rate - Error probability (0-1)
     */
    setErrorRate(rate) {
        this.errorRate = Math.max(0, Math.min(1, rate));
    }
    
    /**
     * Set delay
     * @param {number} delay - Delay in ms
     */
    setDelay(delay) {
        this.delay = Math.max(0, delay);
    }
    
    /**
     * Disconnect (for testing connection handling)
     */
    disconnect() {
        this.connected = false;
    }
    
    /**
     * Reconnect
     */
    reconnect() {
        this.connected = true;
    }
    
    /**
     * Get mock client status
     * @returns {Object}
     */
    getStatus() {
        return {
            connected: this.connected,
            model: this.model,
            generator: this.generator,
            delay: this.delay,
            errorRate: this.errorRate,
            queuedResponses: this.responseQueue.length,
            recordedRequests: this.requests.length,
            usage: this.usage
        };
    }
}

// ============================================================================
// MOCK PROVIDER FOR PROVIDER MANAGER
// ============================================================================

/**
 * Create a mock provider configuration for the ProviderManager
 */
function createMockProvider(options = {}) {
    return {
        name: 'Mock LLM',
        description: 'Mock LLM for testing',
        clientClass: MockLLMClient,
        requiresCredentials: false,
        defaultConfig: {
            model: 'mock-model',
            delay: options.delay || 0,
            generator: options.generator || 'echo',
            ...options
        }
    };
}

/**
 * Inject mock provider into PROVIDER_REGISTRY
 * Call this before creating ProviderManager for testing
 */
function injectMockProvider(registry, options = {}) {
    registry.mock = createMockProvider(options);
    return registry;
}

// ============================================================================
// FIXTURES AND HELPERS
// ============================================================================

/**
 * Create a preconfigured mock client for common test scenarios
 */
const fixtures = {
    // Simple echo client
    echo: () => new MockLLMClient({ generator: 'echo' }),
    
    // Fixed response client
    fixed: (response) => new MockLLMClient({
        generator: 'fixed',
        generatorConfig: { response }
    }),
    
    // JSON response client
    json: (template) => new MockLLMClient({
        generator: 'json',
        generatorConfig: { jsonTemplate: template }
    }),
    
    // Semantic analysis client
    semantic: () => new MockLLMClient({ generator: 'semantic' }),
    
    // Code editing client
    codeEdit: () => new MockLLMClient({ generator: 'codeEdit' }),
    
    // Error-prone client
    flaky: (errorRate = 0.5) => new MockLLMClient({ errorRate }),
    
    // Slow client
    slow: (delay = 1000) => new MockLLMClient({ delay }),
    
    // Pattern-based client
    pattern: (patterns) => new MockLLMClient({
        generator: 'pattern',
        generatorConfig: { patterns }
    }),
    
    // Deterministic queue-based client
    deterministic: (responses) => {
        const client = new MockLLMClient();
        client.queueResponses(responses);
        return client;
    }
};

/**
 * Wait for a specific number of requests
 * @param {MockLLMClient} client - Mock client
 * @param {number} count - Number of requests to wait for
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Array>}
 */
function waitForRequests(client, count, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startCount = client.usage.totalRequests;
        const target = startCount + count;
        
        const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for ${count} requests`));
        }, timeout);
        
        const check = () => {
            if (client.usage.totalRequests >= target) {
                clearTimeout(timer);
                resolve(client.getLastRequests(count));
            } else {
                setTimeout(check, 10);
            }
        };
        
        check();
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Main class
    MockLLMClient,
    
    // Generators
    defaultGenerators,
    
    // Provider integration
    createMockProvider,
    injectMockProvider,
    
    // Fixtures
    fixtures,
    
    // Helpers
    waitForRequests
};