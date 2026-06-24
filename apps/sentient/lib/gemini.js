/**
 * Google Gemini API Client (API Key authentication)
 *
 * Connects to Google's Gemini API using a simple API key for authentication.
 * This is the lightweight alternative to VertexAIClient which requires
 * service account credentials or gcloud CLI setup.
 *
 * Supports both regular and streaming chat completions, function calling,
 * and model listing.
 *
 * Environment variables:
 * - GEMINI_API_KEY: Your Google Gemini API key
 * - GOOGLE_GEMINI_API_KEY: Alternative env var name
 */

import https from 'https';
import crypto from 'crypto';

const API_HOST = 'generativelanguage.googleapis.com';
const API_BASE = '/v1beta';

class GeminiClient {
    /**
     * Create a new Gemini API client
     * @param {Object} options - Configuration options
     * @param {string} options.apiKey - Gemini API key (or set GEMINI_API_KEY env var)
     * @param {string} options.model - Model identifier (default: 'gemini-2.5-flash')
     * @param {number} options.temperature - Sampling temperature (default: 0.7)
     * @param {number} options.maxTokens - Maximum response tokens (default: 8192)
     * @param {number} options.timeout - Request timeout in ms (default: 120000)
     * @param {number} options.topP - Top-p sampling (default: 0.95)
     * @param {number} options.topK - Top-k sampling (default: 40)
     */
    constructor(options = {}) {
        this.apiKey = options.apiKey
            || process.env.GEMINI_API_KEY
            || process.env.GOOGLE_GEMINI_API_KEY
            || '';
        this.model = options.model || 'gemini-2.5-flash';
        this.temperature = options.temperature ?? 0.7;
        this.maxTokens = options.maxTokens || 8192;
        this.timeout = options.timeout || 120000;
        this.topP = options.topP ?? 0.95;
        this.topK = options.topK ?? 40;

        if (!this.apiKey) {
            console.warn('[Gemini] No API key provided. Set GEMINI_API_KEY env var or pass apiKey option.');
        }
    }

    /**
     * Make an HTTPS request to the Gemini API
     * @private
     * @param {string} method - HTTP method
     * @param {string} path - API path (appended to API_BASE)
     * @param {Object|null} body - Request body
     * @param {boolean} stream - Whether to return the raw response for streaming
     * @returns {Promise<Object|import('http').IncomingMessage>}
     */
    _request(method, path, body = null, stream = false) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: API_HOST,
                port: 443,
                path: `${API_BASE}${path}`,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey,
                    'Accept': stream ? 'text/event-stream' : 'application/json'
                },
                timeout: this.timeout
            };

            const req = https.request(options, (res) => {
                if (stream) {
                    // For streaming, return the raw response so the caller
                    // can iterate over chunks via async iteration
                    if (res.statusCode !== 200) {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                reject(new Error(
                                    json.error?.message
                                    || json.error?.status
                                    || `HTTP ${res.statusCode}`
                                ));
                            } catch {
                                reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                            }
                        });
                        return;
                    }
                    resolve(res);
                    return;
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(json);
                        } else {
                            const errorMsg = json.error?.message
                                || json.error?.status
                                || `HTTP ${res.statusCode}`;
                            reject(new Error(errorMsg));
                        }
                    } catch (e) {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({ raw: data });
                        } else {
                            reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
                        }
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

    // ─── Message Format Conversion ───────────────────────────────────

    /**
     * Convert OpenAI-style messages to Gemini API format.
     *
     * OpenAI format:
     *   { role: 'system'|'user'|'assistant'|'tool', content, tool_calls?, tool_call_id? }
     *
     * Gemini format:
     *   contents: [{ role: 'user'|'model', parts: [{ text }|{ functionCall }|{ functionResponse }] }]
     *   system_instruction: { parts: [{ text }] }
     *
     * @private
     * @param {Array<Object>} messages - OpenAI-format messages
     * @returns {{ contents: Array, systemInstruction: Object|null }}
     */
    _convertMessages(messages) {
        const contents = [];
        let systemInstruction = null;

        for (const msg of messages) {
            if (msg.role === 'system') {
                // Gemini uses system_instruction at the top level
                systemInstruction = {
                    parts: [{ text: msg.content }]
                };
            } else if (msg.role === 'tool') {
                // Tool result → functionResponse
                contents.push({
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: msg.tool_call_id || 'tool_result',
                            response: { content: msg.content }
                        }
                    }]
                });
            } else if (msg.tool_calls) {
                // Assistant message with tool calls → functionCall parts
                const parts = [];
                if (msg.content) {
                    parts.push({ text: msg.content });
                }
                for (const tc of msg.tool_calls) {
                    let parsedArgs = {};
                    try {
                        parsedArgs = JSON.parse(tc.function?.arguments || '{}');
                    } catch {
                        // Malformed JSON from prior LLM response — fall back to empty args
                        parsedArgs = {};
                    }
                    parts.push({
                        functionCall: {
                            name: tc.function?.name,
                            args: parsedArgs
                        }
                    });
                }
                contents.push({ role: 'model', parts });
            } else {
                // Regular user or assistant message
                const role = msg.role === 'assistant' ? 'model' : 'user';
                contents.push({
                    role,
                    parts: [{ text: msg.content || '' }]
                });
            }
        }

        return { contents, systemInstruction };
    }

    /**
     * Convert OpenAI-style tool definitions to Gemini functionDeclarations
     * @private
     * @param {Array<Object>|undefined} tools - OpenAI-format tools
     * @returns {Array|null} Gemini-format tools array or null
     */
    _convertTools(tools) {
        if (!tools || tools.length === 0) return null;

        const functionDeclarations = tools.map(tool => {
            const fn = tool.function || tool;
            return {
                name: fn.name,
                description: fn.description,
                parameters: fn.parameters
            };
        });

        return [{ functionDeclarations }];
    }

    // ─── Public Interface ────────────────────────────────────────────

    /**
     * Check if the Gemini API is reachable
     * @returns {Promise<boolean>}
     */
    async isConnected() {
        if (!this.apiKey) return false;
        try {
            await this.listModels();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the current model name
     * @returns {Promise<string>}
     */
    async getCurrentModel() {
        return this.model;
    }

    /**
     * List available Gemini models
     * @returns {Promise<Array<{ id: string, name: string }>>}
     */
    async listModels() {
        const response = await this._request('GET', '/models');
        const models = response.models || [];
        return models.map(m => ({
            id: m.name?.replace('models/', '') || m.name,
            name: m.displayName || m.name
        }));
    }

    /**
     * Send a chat completion request (non-streaming)
     *
     * @param {Array<Object>} messages - OpenAI-format message array
     * @param {Object} options - Override options for this request
     * @param {string} [options.model] - Model override
     * @param {number} [options.temperature] - Temperature override
     * @param {number} [options.maxTokens] - Max tokens override
     * @param {number} [options.topP] - Top-p override
     * @param {number} [options.topK] - Top-k override
     * @param {Array}  [options.tools] - OpenAI-format tool definitions
     * @param {string} [options.toolChoice] - Tool choice mode
     * @returns {Promise<{ content: string, role: string, toolCalls: Array|null, finishReason: string, usage: Object }>}
     */
    async chat(messages, options = {}) {
        const model = options.model || this.model;
        const endpoint = `/models/${model}:generateContent`;

        const { contents, systemInstruction } = this._convertMessages(messages);

        const body = {
            contents,
            generationConfig: {
                temperature: options.temperature ?? this.temperature,
                maxOutputTokens: options.maxTokens || this.maxTokens,
                topP: options.topP ?? this.topP,
                topK: options.topK ?? this.topK
            }
        };

        if (systemInstruction) {
            body.system_instruction = systemInstruction;
        }

        // Add tools if provided
        const tools = this._convertTools(options.tools);
        if (tools) {
            body.tools = tools;
        }

        // Safety settings — permissive defaults
        body.safetySettings = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ];

        const response = await this._request('POST', endpoint, body);

        // Parse response
        const candidate = response.candidates?.[0];
        const content = candidate?.content;

        let textContent = '';
        let toolCalls = null;

        if (content?.parts) {
            for (const part of content.parts) {
                if (part.text) {
                    textContent += part.text;
                }
                if (part.functionCall) {
                    if (!toolCalls) toolCalls = [];
                    toolCalls.push({
                        id: crypto.randomUUID(),
                        type: 'function',
                        function: {
                            name: part.functionCall.name,
                            arguments: JSON.stringify(part.functionCall.args || {})
                        }
                    });
                }
            }
        }

        return {
            content: textContent,
            role: 'assistant',
            toolCalls,
            finishReason: candidate?.finishReason?.toLowerCase() || 'stop',
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount,
                completionTokens: response.usageMetadata?.candidatesTokenCount,
                totalTokens: response.usageMetadata?.totalTokenCount
            }
        };
    }

    /**
     * Stream a chat completion via SSE
     *
     * Yields strings (text chunks) and, at the end, an object
     * `{ type: 'tool_calls', toolCalls: [...] }` if any function calls
     * were returned by the model.
     *
     * @param {Array<Object>} messages - OpenAI-format message array
     * @param {Object} options - Override options
     * @returns {AsyncGenerator<string|Object>}
     */
    async *streamChat(messages, options = {}) {
        const model = options.model || this.model;
        const endpoint = `/models/${model}:streamGenerateContent?alt=sse`;

        const { contents, systemInstruction } = this._convertMessages(messages);

        const body = {
            contents,
            generationConfig: {
                temperature: options.temperature ?? this.temperature,
                maxOutputTokens: options.maxTokens || this.maxTokens,
                topP: options.topP ?? this.topP,
                topK: options.topK ?? this.topK
            }
        };

        if (systemInstruction) {
            body.system_instruction = systemInstruction;
        }

        const tools = this._convertTools(options.tools);
        if (tools) {
            body.tools = tools;
        }

        body.safetySettings = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ];

        const res = await this._request('POST', endpoint, body, true);

        let buffer = '';
        let toolCallsBuffer = [];

        for await (const chunk of res) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                // SSE format: "data: {json}"
                let jsonData = null;
                if (trimmed.startsWith('data:')) {
                    const dataContent = trimmed.slice(5).trim();
                    if (dataContent === '[DONE]' || !dataContent) continue;
                    jsonData = dataContent;
                } else if (trimmed.startsWith('{')) {
                    jsonData = trimmed;
                }

                if (!jsonData) continue;

                try {
                    const json = JSON.parse(jsonData);
                    const candidate = json.candidates?.[0];
                    const content = candidate?.content;

                    if (content?.parts) {
                        for (const part of content.parts) {
                            if (part.text) {
                                yield part.text;
                            }
                            if (part.functionCall) {
                                toolCallsBuffer.push({
                                    id: crypto.randomUUID(),
                                    type: 'function',
                                    function: {
                                        name: part.functionCall.name,
                                        arguments: JSON.stringify(part.functionCall.args || {})
                                    }
                                });
                            }
                        }
                    }
                } catch {
                    // Partial JSON or non-JSON line — skip
                }
            }
        }

        // Handle any remaining data in the buffer
        if (buffer.trim()) {
            let jsonData = null;
            const trimmedBuf = buffer.trim();
            if (trimmedBuf.startsWith('data:')) {
                jsonData = trimmedBuf.slice(5).trim();
            } else if (trimmedBuf.startsWith('{')) {
                jsonData = trimmedBuf;
            }

            if (jsonData && jsonData !== '[DONE]') {
                try {
                    const json = JSON.parse(jsonData);
                    const content = json.candidates?.[0]?.content;
                    if (content?.parts) {
                        for (const part of content.parts) {
                            if (part.text) {
                                yield part.text;
                            }
                        }
                    }
                } catch {
                    // Ignore final parse errors
                }
            }
        }

        // Yield accumulated tool calls at the end
        if (toolCallsBuffer.length > 0) {
            yield { type: 'tool_calls', toolCalls: toolCallsBuffer };
        }
    }

    /**
     * Simple completion (convenience method)
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System prompt
     * @returns {Promise<string>} Response text
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

export { GeminiClient };
