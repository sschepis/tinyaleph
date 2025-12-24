/**
 * PromptEnhancer
 *
 * Enhances user prompts with semantic context before sending to LLM.
 * Injects relevant history, topic context, and style hints.
 */

const { TOOL_DEFINITIONS } = require('./tools');

class PromptEnhancer {
    /**
     * Create a PromptEnhancer
     * @param {Object} core - AlephSemanticCore instance
     * @param {Object} options - Configuration options
     */
    constructor(core, options = {}) {
        this.core = core;
        this.systemPromptTemplate = options.systemPrompt || this._defaultSystemPrompt();
        this.includeStyle = options.includeStyle !== false;
        this.includeTopics = options.includeTopics !== false;
        this.includeConcepts = options.includeConcepts !== false;
        this.includeTools = options.includeTools !== false;
        this.maxContextLength = options.maxContextLength || 2000;
    }

    /**
     * Default system prompt
     * @private
     */
    _defaultSystemPrompt() {
        return `You are a helpful, knowledgeable assistant with the ability to read and write files, and execute commands. You provide clear, accurate, and thoughtful responses. You remember context from the conversation and build upon previous discussions when relevant.

When the user asks you to perform file operations or run commands, use the appropriate tools. Always explain what you're doing before using a tool.`;
    }

    /**
     * Enhance user input with semantic context
     * @param {string} userInput - User's message
     * @param {Object} options - Enhancement options
     * @returns {Object} Enhanced prompt data
     */
    enhance(userInput, options = {}) {
        const context = this.core.getSemanticContext(userInput);
        const messages = [];
        
        // Build system prompt with dynamic hints
        let systemPrompt = this.systemPromptTemplate;
        
        if (this.includeStyle && context.styleHints.hints.length > 0) {
            systemPrompt += '\n\nUser communication style: ' +
                context.styleHints.hints.join('. ') + '.';
        }
        
        if (this.includeTopics && context.topicSummary) {
            systemPrompt += '\n\n' + context.topicSummary;
        }
        
        // Add tool definitions
        if (this.includeTools) {
            systemPrompt += '\n\n' + TOOL_DEFINITIONS;
        }
        
        messages.push({ role: 'system', content: systemPrompt });
        
        // IMPORTANT: Add explicit conversation history first (if provided)
        // This is the actual chat history that ensures continuity
        if (options.conversationHistory && options.conversationHistory.length > 0) {
            // Limit to most recent messages to avoid context overflow
            const maxHistoryMessages = options.maxHistoryMessages || 20;
            const recentHistory = options.conversationHistory.slice(-maxHistoryMessages);
            
            for (const msg of recentHistory) {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messages.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            }
        }
        
        // Add semantic memory context (related concepts, similar past exchanges)
        // Only if no explicit history was provided
        if (!options.conversationHistory || options.conversationHistory.length === 0) {
            const memoryMessages = this.core.memory.buildContextMessages(userInput, {
                immediateCount: options.immediateCount || 5,
                similarCount: options.similarCount || 2
            });
            
            // Truncate context if too long
            let contextLength = 0;
            const filteredMemory = [];
            for (const msg of memoryMessages) {
                contextLength += msg.content.length;
                if (contextLength > this.maxContextLength) break;
                filteredMemory.push(msg);
            }
            
            messages.push(...filteredMemory);
        }
        
        // Add concept context if relevant
        if (this.includeConcepts && context.relevantConcepts.length > 0) {
            const topConcepts = context.relevantConcepts
                .filter(c => c.similarity > 0.5)
                .slice(0, 3)
                .map(c => c.concept);
            
            if (topConcepts.length > 0) {
                const lastSystemIdx = messages.findIndex(m => m.role === 'system');
                if (lastSystemIdx >= 0) {
                    messages[lastSystemIdx].content +=
                        `\n\nRelated concepts from knowledge: ${topConcepts.join(', ')}`;
                }
            }
        }
        
        // Add the current user message
        messages.push({ role: 'user', content: userInput });
        
        return {
            messages,
            context: {
                topics: context.topics,
                styleConfidence: context.styleHints.confidence,
                memoryUsed: options.conversationHistory ? options.conversationHistory.length > 0 : false,
                conceptsUsed: this.includeConcepts && context.relevantConcepts.length > 0
            }
        };
    }

    /**
     * Build a focused prompt for specific task types
     * @param {string} userInput - User's message
     * @param {string} taskType - Type of task (explain, compare, summarize, etc.)
     * @param {Object} options - Options including conversationHistory
     * @returns {Object} Enhanced prompt data
     */
    enhanceForTask(userInput, taskType, options = {}) {
        const taskPrompts = {
            explain: 'Provide a clear, detailed explanation. Use examples where helpful.',
            compare: 'Compare and contrast the items mentioned. Highlight key similarities and differences.',
            summarize: 'Provide a concise summary of the key points.',
            analyze: 'Analyze the topic thoroughly, considering multiple perspectives.',
            code: 'Provide working code with clear comments and explanations.',
            debug: 'Help identify and fix the issue. Explain the root cause.',
            creative: 'Be creative and engaging in your response.'
        };
        
        const taskHint = taskPrompts[taskType] || '';
        const enhanced = this.enhance(userInput, options);
        
        if (taskHint && enhanced.messages.length > 0) {
            const sysIdx = enhanced.messages.findIndex(m => m.role === 'system');
            if (sysIdx >= 0) {
                enhanced.messages[sysIdx].content += `\n\nTask guidance: ${taskHint}`;
            }
        }
        
        enhanced.taskType = taskType;
        return enhanced;
    }

    /**
     * Detect task type from user input
     * @param {string} input - User input
     * @returns {string|null} Detected task type
     */
    detectTaskType(input) {
        const lower = input.toLowerCase();
        
        if (/\b(explain|what is|tell me about|describe)\b/.test(lower)) {
            return 'explain';
        }
        if (/\b(compare|versus|vs|difference|differ)\b/.test(lower)) {
            return 'compare';
        }
        if (/\b(summarize|summary|tldr|brief)\b/.test(lower)) {
            return 'summarize';
        }
        if (/\b(analyze|analysis|evaluate|assess)\b/.test(lower)) {
            return 'analyze';
        }
        if (/\b(code|function|implement|write.*program)\b/.test(lower)) {
            return 'code';
        }
        if (/\b(debug|fix|error|bug|issue|problem)\b/.test(lower)) {
            return 'debug';
        }
        if (/\b(creative|story|poem|imagine)\b/.test(lower)) {
            return 'creative';
        }
        
        return null;
    }

    /**
     * Auto-enhance with task detection
     * @param {string} userInput - User's message
     * @param {Object} options - Options including conversationHistory
     * @returns {Object} Enhanced prompt data
     */
    autoEnhance(userInput, options = {}) {
        const taskType = this.detectTaskType(userInput);
        if (taskType) {
            return this.enhanceForTask(userInput, taskType, options);
        }
        return this.enhance(userInput, options);
    }

    /**
     * Set custom system prompt
     * @param {string} prompt - New system prompt
     */
    setSystemPrompt(prompt) {
        this.systemPromptTemplate = prompt;
    }

    /**
     * Get current configuration
     * @returns {Object}
     */
    getConfig() {
        return {
            includeStyle: this.includeStyle,
            includeTopics: this.includeTopics,
            includeConcepts: this.includeConcepts,
            maxContextLength: this.maxContextLength
        };
    }
}

module.exports = { PromptEnhancer };