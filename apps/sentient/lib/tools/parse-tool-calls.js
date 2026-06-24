/**
 * Tool Call Parser
 *
 * Parses tool calls from LLM response text.
 * Supports multiple formats: Standard, Qwen/LLaMA, Function, and Inline.
 */

/**
 * Parse tool calls from LLM response
 * Supports multiple formats:
 * 1. Standard: <tool_call><tool>name</tool><param>value</param></tool_call>
 * 2. Qwen/LLaMA: <_call><>name</><param>value</param></_call>
 * 3. Function: <function_call><name>tool</name><arguments>...</arguments></function_call>
 *
 * @param {string} text - LLM response text
 * @returns {Array} Array of parsed tool calls
 */
export function parseToolCalls(text) {
    const toolCalls = [];
    
    // Pattern 1: Standard format <tool_call><tool>name</tool>...</tool_call>
    const standardRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    let match;
    
    while ((match = standardRegex.exec(text)) !== null) {
        const callContent = match[1];
        const toolCall = { raw: match[0] };
        
        // Extract tool name
        const toolMatch = callContent.match(/<tool>([^<]+)<\/tool>/);
        if (toolMatch) {
            toolCall.tool = toolMatch[1].trim();
        }
        
        // Extract all parameters
        const paramRegex = /<(\w+)>([^<]*(?:<(?!\/\1>)[^<]*)*)<\/\1>/g;
        let paramMatch;
        while ((paramMatch = paramRegex.exec(callContent)) !== null) {
            const paramName = paramMatch[1];
            const paramValue = paramMatch[2];
            if (paramName !== 'tool') {
                toolCall[paramName] = paramValue.trim();
            }
        }
        
        if (toolCall.tool) {
            toolCalls.push(toolCall);
        }
    }
    
    // Pattern 2: Qwen/LLaMA format <_call><>name</>...</_call> or <_call><>name</><param>value</param></_call>
    const qwenRegex = /<_call>([\s\S]*?)<\/_call>/g;
    
    while ((match = qwenRegex.exec(text)) !== null) {
        const callContent = match[1];
        const toolCall = { raw: match[0] };
        
        // Extract tool name from <> or <>name</>
        const toolMatch = callContent.match(/<>([^<]*)<\/>/);
        if (toolMatch) {
            toolCall.tool = toolMatch[1].trim();
        }
        
        // Extract all parameters
        const paramRegex = /<(\w+)>([^<]*(?:<(?!\/\1>)[^<]*)*)<\/\1>/g;
        let paramMatch;
        while ((paramMatch = paramRegex.exec(callContent)) !== null) {
            const paramName = paramMatch[1];
            const paramValue = paramMatch[2];
            toolCall[paramName] = paramValue.trim();
        }
        
        if (toolCall.tool) {
            toolCalls.push(toolCall);
        }
    }
    
    // Pattern 3: Function call format <function_call><name>tool</name><arguments>JSON</arguments></function_call>
    const funcRegex = /<function_call>([\s\S]*?)<\/function_call>/g;
    
    while ((match = funcRegex.exec(text)) !== null) {
        const callContent = match[1];
        const toolCall = { raw: match[0] };
        
        // Extract tool name
        const nameMatch = callContent.match(/<name>([^<]+)<\/name>/);
        if (nameMatch) {
            toolCall.tool = nameMatch[1].trim();
        }
        
        // Extract arguments (usually JSON)
        const argsMatch = callContent.match(/<arguments>([\s\S]*?)<\/arguments>/);
        if (argsMatch) {
            try {
                const args = JSON.parse(argsMatch[1].trim());
                Object.assign(toolCall, args);
            } catch (e) {
                // Not valid JSON, try to extract as key-value pairs
                const argContent = argsMatch[1];
                const kvRegex = /<(\w+)>([^<]*)<\/\1>/g;
                let kvMatch;
                while ((kvMatch = kvRegex.exec(argContent)) !== null) {
                    toolCall[kvMatch[1]] = kvMatch[2].trim();
                }
            }
        }
        
        if (toolCall.tool) {
            toolCalls.push(toolCall);
        }
    }
    
    // Pattern 4: Inline format like commentaryto=functions/tool_namejson{...}
    // This is a malformed pattern but we try to extract from it
    const inlineRegex = /functions\/(\w+)json(\{[^}]+\})/g;
    
    while ((match = inlineRegex.exec(text)) !== null) {
        const toolName = match[1];
        const argsJson = match[2];
        const toolCall = { raw: match[0], tool: toolName };
        
        try {
            const args = JSON.parse(argsJson);
            Object.assign(toolCall, args);
            toolCalls.push(toolCall);
        } catch (e) {
            // Skip malformed JSON
        }
    }
    
    return toolCalls;
}
