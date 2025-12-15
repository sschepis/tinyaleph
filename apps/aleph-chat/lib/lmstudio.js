/**
 * LMStudio API Client
 * 
 * Connects to LMStudio's OpenAI-compatible API for local LLM inference.
 * Supports both regular and streaming chat completions.
 */

const http = require('http');
const https = require('https');

class LMStudioClient {
    /**
     * Create a new LMStudio client
     * @param {Object} options - Configuration options
     * @param {string} options.baseUrl - LMStudio API URL (default: http://localhost:1234/v1)
     * @param {string} options.model - Model identifier (default: 'local-model')
     * @param {number} options.temperature - Sampling temperature (default: 0.7)
     * @param {number} options.maxTokens - Maximum response tokens (default: 2048)
     * @param {number} options.timeout - Request timeout in ms (default: 60000)
     */
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:1234/v1';
        this.model = options.model || 'local-model';
        this.temperature = options.temperature ?? 0.7;
        this.maxTokens = options.maxTokens || 2048;
        this.timeout = options.timeout || 60000;
        
        // Parse base URL
        const url = new URL(this.baseUrl);
        this.protocol = url.protocol === 'https:' ? https : http;
        this.host = url.hostname;
        this.port = url.port || (url.protocol === 'https:' ? 443 : 80);
        this.basePath = url.pathname.replace(/\/$/, '');
    }

    /**
     * Make an HTTP request
     * @private
     */
    _request(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.host,
                port: this.port,
                path: `${this.basePath}${path}`,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: this.timeout
            };

            const req = this.protocol.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(json);
                        } else {
                            reject(new Error(json.error?.message || `HTTP ${res.statusCode}`));
                        }
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }

    /**
     * List available models
     * @returns {Promise<Array>} Array of model objects
     */
    async listModels() {
        const response = await this._request('GET', '/models');
        return response.data || [];
    }

    /**
     * Check if LMStudio is connected and responding
     * @returns {Promise<boolean>}
     */
    async isConnected() {
        try {
            await this.listModels();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the current model name (or first available)
     * @returns {Promise<string|null>}
     */
    async getCurrentModel() {
        try {
            const models = await this.listModels();
            if (models.length > 0) {
                return models[0].id;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Send a chat completion request
     * @param {Array<Object>} messages - Array of message objects
     * @param {Object} options - Override options for this request
     * @returns {Promise<Object>} Completion response
     */
    async chat(messages, options = {}) {
        const body = {
            model: options.model || this.model,
            messages,
            temperature: options.temperature ?? this.temperature,
            max_tokens: options.maxTokens || this.maxTokens,
            stream: false
        };

        if (options.stop) body.stop = options.stop;
        if (options.topP !== undefined) body.top_p = options.topP;
        if (options.presencePenalty !== undefined) body.presence_penalty = options.presencePenalty;
        if (options.frequencyPenalty !== undefined) body.frequency_penalty = options.frequencyPenalty;

        const response = await this._request('POST', '/chat/completions', body);
        
        return {
            content: response.choices?.[0]?.message?.content || '',
            role: response.choices?.[0]?.message?.role || 'assistant',
            finishReason: response.choices?.[0]?.finish_reason,
            usage: response.usage
        };
    }

    /**
     * Stream a chat completion
     * @param {Array<Object>} messages - Array of message objects
     * @param {Object} options - Override options
     * @returns {AsyncGenerator<string>} Yields content chunks
     */
    async *streamChat(messages, options = {}) {
        const body = {
            model: options.model || this.model,
            messages,
            temperature: options.temperature ?? this.temperature,
            max_tokens: options.maxTokens || this.maxTokens,
            stream: true
        };

        if (options.stop) body.stop = options.stop;

        const requestOptions = {
            hostname: this.host,
            port: this.port,
            path: `${this.basePath}/chat/completions`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            timeout: this.timeout
        };

        yield* await new Promise((resolve, reject) => {
            const req = this.protocol.request(requestOptions, (res) => {
                if (res.statusCode !== 200) {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            reject(new Error(json.error?.message || `HTTP ${res.statusCode}`));
                        } catch {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    });
                    return;
                }

                // Create async generator from stream
                const generator = (async function* () {
                    let buffer = '';
                    
                    for await (const chunk of res) {
                        buffer += chunk.toString();
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') {
                                    return;
                                }
                                try {
                                    const json = JSON.parse(data);
                                    const content = json.choices?.[0]?.delta?.content;
                                    if (content) {
                                        yield content;
                                    }
                                } catch {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }
                })();

                resolve(generator);
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Stream request timeout'));
            });

            req.write(JSON.stringify(body));
            req.end();
        });
    }

    /**
     * Simple completion (convenience method)
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System prompt
     * @returns {Promise<string>} Response content
     */
    async complete(prompt, systemPrompt = 'You are a helpful assistant.') {
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];
        const response = await this.chat(messages);
        return response.content;
    }
}

module.exports = { LMStudioClient };