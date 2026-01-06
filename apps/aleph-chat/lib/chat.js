/**
 * AlephChat
 *
 * Main chat client that combines all components:
 * - AlephSemanticCore for semantic processing
 * - LMStudioClient for LLM inference
 * - PromptEnhancer for context injection
 * - ResponseProcessor for learning extraction
 */

const { SemanticBackend } = require('../../../modular');
const { LMStudioClient } = require('./lmstudio');
const { AlephSemanticCore } = require('./core');
const { PromptEnhancer } = require('./enhancer');
const { ResponseProcessor } = require('./processor');
const { OPENAI_TOOLS } = require('./tools');

class AlephChat {
    /**
     * Create an AlephChat instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Initialize backend
        this.dimension = options.dimension || 16;
        this.backend = new SemanticBackend({ dimension: this.dimension });
        
        // Initialize LLM client
        this.llm = new LMStudioClient({
            baseUrl: options.lmstudioUrl || 'http://localhost:1234/v1',
            model: options.model || 'local-model',
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens || 32768
        });
        
        // Initialize semantic core
        this.core = new AlephSemanticCore(this.backend, {
            dataPath: options.dataPath || './data',
            dimension: this.dimension,
            learningRate: options.learningRate || 0.1
        });
        
        // Initialize enhancer and processor
        this.enhancer = new PromptEnhancer(this.core, {
            systemPrompt: options.systemPrompt,
            includeStyle: options.includeStyle !== false,
            includeTopics: options.includeTopics !== false,
            includeConcepts: options.includeConcepts !== false
        });
        
        this.processor = new ResponseProcessor(this.core, {
            coherenceThreshold: options.coherenceThreshold || 0.6,
            learnFromResponses: options.learnFromResponses !== false
        });
        
        // State
        this.isConnected = false;
        this.modelName = null;
        this.sessionStart = Date.now();
        this.exchangeCount = 0;
        
        // Tools
        this.tools = OPENAI_TOOLS;
        this.useTools = options.useTools !== false;
        
        // Callbacks for UI integration
        this.callbacks = {
            onNewWord: options.onNewWord || null,
            onTopicChange: options.onTopicChange || null,
            onCoherence: options.onCoherence || null,
            onStream: options.onStream || null,
            onToolCall: options.onToolCall || null
        };
    }

    /**
     * Connect to LMStudio
     * @returns {Promise<boolean>}
     */
    async connect() {
        this.isConnected = await this.llm.isConnected();
        if (this.isConnected) {
            this.modelName = await this.llm.getCurrentModel();
        }
        return this.isConnected;
    }

    /**
     * Send a message and get a response
     * @param {string} userMessage - User's message
     * @param {Object} options - Options
     * @returns {Promise<Object>} Response with metadata
     */
    async chat(userMessage, options = {}) {
        if (!this.isConnected) {
            const connected = await this.connect();
            if (!connected) {
                return {
                    success: false,
                    error: 'Not connected to LMStudio. Is it running?',
                    response: null
                };
            }
        }

        // Pre-process user input
        const inputResult = this.core.processUserInput(userMessage);
        
        // Notify about new words
        if (inputResult.newWords.length > 0 && this.callbacks.onNewWord) {
            for (const word of inputResult.newWords) {
                this.callbacks.onNewWord(word);
            }
        }
        
        // Notify about topic changes
        if (inputResult.topicUpdate.isNewTopic && this.callbacks.onTopicChange) {
            this.callbacks.onTopicChange(inputResult.topicUpdate);
        }

        // Enhance prompt with context
        const enhanced = options.autoEnhance !== false
            ? this.enhancer.autoEnhance(userMessage)
            : this.enhancer.enhance(userMessage);

        try {
            let response;
            
            if (options.stream && this.callbacks.onStream) {
                // Streaming mode
                response = '';
                for await (const chunk of this.llm.streamChat(enhanced.messages)) {
                    response += chunk;
                    this.callbacks.onStream(chunk);
                }
            } else {
                // Regular mode
                const result = await this.llm.chat(enhanced.messages);
                response = result.content;
            }

            // Process response
            const processed = this.processor.process(response, userMessage);
            
            // Notify about coherence
            if (this.callbacks.onCoherence) {
                this.callbacks.onCoherence(processed.coherence);
            }

            this.exchangeCount++;

            return {
                success: true,
                response,
                metadata: {
                    coherence: processed.coherence,
                    quality: processed.quality,
                    newWords: [...inputResult.newWords, ...processed.newWords],
                    concepts: processed.concepts,
                    warnings: processed.warnings,
                    contextUsed: enhanced.context.memoryUsed,
                    taskType: enhanced.taskType || null,
                    topics: inputResult.topicUpdate.topics
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                response: null
            };
        }
    }

    /**
     * Stream a chat response
     * @param {string} userMessage - User's message
     * @param {Function} onChunk - Callback for each chunk
     * @param {Object} options - Options including tools and conversationHistory
     * @returns {AsyncGenerator<string|Object>}
     */
    async *streamChat(userMessage, onChunk = null, options = {}) {
        if (!this.isConnected) {
            await this.connect();
        }

        const inputResult = this.core.processUserInput(userMessage);
        
        // Pass conversation history to the enhancer
        const enhanceOptions = {};
        if (options.conversationHistory) {
            enhanceOptions.conversationHistory = options.conversationHistory;
        }
        const enhanced = this.enhancer.autoEnhance(userMessage, enhanceOptions);

        // Add tools to the request if enabled
        const streamOptions = {};
        if (this.useTools && options.tools !== false) {
            streamOptions.tools = this.tools;
        }

        let fullResponse = '';
        for await (const chunk of this.llm.streamChat(enhanced.messages, streamOptions)) {
            // Handle tool calls object
            if (chunk && typeof chunk === 'object' && chunk.type === 'tool_calls') {
                if (this.callbacks.onToolCall) {
                    this.callbacks.onToolCall(chunk.toolCalls);
                }
                yield chunk;
                continue;
            }
            
            // Handle regular text chunks
            if (typeof chunk === 'string') {
                fullResponse += chunk;
                if (onChunk) onChunk(chunk);
                yield chunk;
            }
        }

        // Process complete response
        this.processor.process(fullResponse, userMessage);
        this.exchangeCount++;
    }

    /**
     * Get session statistics
     * @returns {Object}
     */
    getStats() {
        const coreStats = this.core.getStats();
        return {
            connected: this.isConnected,
            model: this.modelName,
            sessionDuration: Date.now() - this.sessionStart,
            exchangeCount: this.exchangeCount,
            ...coreStats
        };
    }

    /**
     * Get vocabulary statistics
     * @returns {Object}
     */
    getVocabStats() {
        return this.core.vocabulary.getStats();
    }

    /**
     * Get current topics
     * @returns {Array}
     */
    getTopics() {
        return this.core.topicTracker.getCurrentTopics();
    }

    /**
     * Get style profile
     * @returns {Object}
     */
    getStyleProfile() {
        return this.core.styleProfiler.getStyleHints();
    }

    /**
     * Find similar words
     * @param {string} word - Query word
     * @returns {Array}
     */
    findSimilarWords(word) {
        return this.core.vocabulary.findSimilar(word);
    }

    /**
     * Query concept graph
     * @param {string} concept - Query concept
     * @returns {Object}
     */
    queryConcepts(concept) {
        return this.core.conceptGraph.query(concept);
    }

    /**
     * Forget a word
     * @param {string} word - Word to forget
     * @returns {boolean}
     */
    forgetWord(word) {
        return this.core.vocabulary.forget(word);
    }

    /**
     * Save all data
     */
    save() {
        this.core.save();
    }

    /**
     * Clear session (keep persistent data)
     */
    clearSession() {
        this.core.clearSession();
        this.exchangeCount = 0;
        this.sessionStart = Date.now();
    }

    /**
     * Reset everything
     */
    reset() {
        this.core.reset();
        this.exchangeCount = 0;
        this.sessionStart = Date.now();
    }

    /**
     * End session and save
     */
    endSession() {
        const stats = this.getStats();
        this.core.memory.endSession({
            duration: stats.sessionDuration,
            exchanges: stats.exchangeCount,
            wordsLearned: stats.vocabulary.sessionWords,
            topics: this.getTopics()
        });
        this.save();
    }
}

module.exports = { AlephChat };