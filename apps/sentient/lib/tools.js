/**
 * Tools Module
 *
 * Provides tool definitions and execution for the chat agent.
 * Tools enable file operations and command execution.
 *
 * This is a barrel re-export module. The implementation is split across:
 * - tools/definitions.js    — OPENAI_TOOLS, TOOL_DEFINITIONS, ANSI
 * - tools/summary-cache.js  — SummaryCache, getSummaryCache
 * - tools/parse-tool-calls.js — parseToolCalls
 * - tools/tool-executor.js  — ToolExecutor
 */

import { TOOL_DEFINITIONS, OPENAI_TOOLS, ANSI } from './tools/definitions.js';
import { SummaryCache, getSummaryCache } from './tools/summary-cache.js';
import { parseToolCalls } from './tools/parse-tool-calls.js';
import { ToolExecutor } from './tools/tool-executor.js';

/**
 * Process LLM response for tool calls and execute them
 * @param {string} response - LLM response text
 * @param {ToolExecutor} executor - Tool executor instance
 * @returns {Promise<Object>} Processing result
 */
async function processToolCalls(response, executor) {
    const toolCalls = parseToolCalls(response);
    
    if (toolCalls.length === 0) {
        return { hasTools: false, results: [], cleanedResponse: response };
    }
    
    const results = [];
    let cleanedResponse = response;
    
    for (const toolCall of toolCalls) {
        const result = await executor.execute(toolCall);
        results.push({ toolCall, result });
        
        // Remove the tool call from response for cleaner display
        cleanedResponse = cleanedResponse.replace(toolCall.raw, '').trim();
    }
    
    return {
        hasTools: true,
        results,
        cleanedResponse
    };
}

/**
 * Execute a tool call from OpenAI format
 * @param {Object} toolCall - OpenAI format tool call
 * @param {ToolExecutor} executor - Tool executor instance
 * @returns {Promise<Object>} Result
 */
async function executeOpenAIToolCall(toolCall, executor) {
    const name = toolCall.function?.name || toolCall.name;
    let args = {};
    
    try {
        // Handle various argument formats
        const rawArgs = toolCall.function?.arguments || toolCall.arguments;
        
        if (!rawArgs) {
            args = {};
        } else if (typeof rawArgs === 'string') {
            // Try to parse as JSON
            try {
                args = JSON.parse(rawArgs);
            } catch (jsonErr) {
                // Not valid JSON - might be a simple path string
                // Try to infer the parameter based on tool type
                if (name === 'read_file' || name === 'read_pdf' || name === 'list_directory' || name === 'summarize_file') {
                    args = { path: rawArgs.trim() };
                } else if (name === 'summarize_text') {
                    args = { content: rawArgs.trim() };
                } else {
                    return {
                        success: false,
                        error: `Failed to parse tool arguments: ${rawArgs.substring(0, 100)}`,
                        rawArgs: rawArgs
                    };
                }
            }
        } else if (typeof rawArgs === 'object') {
            args = rawArgs;
        }
    } catch (e) {
        return {
            success: false,
            error: `Failed to parse tool arguments: ${e.message}`,
            rawToolCall: JSON.stringify(toolCall).substring(0, 200)
        };
    }
    
    return executor.execute({
        tool: name,
        ...args
    });
}

export {
    TOOL_DEFINITIONS,
    OPENAI_TOOLS,
    parseToolCalls,
    processToolCalls,
    executeOpenAIToolCall,
    ToolExecutor,
    SummaryCache,
    getSummaryCache,
    ANSI
};
