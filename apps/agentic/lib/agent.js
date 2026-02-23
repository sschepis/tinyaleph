/**
 * Agent — main orchestrator for the agentic system.
 *
 * Coordinates LLM calls (with tool/function-calling support) with
 * the CognitiveCore middleware, implementing the 11-step agent loop
 * described in ARCHITECTURE.md.
 *
 * @module apps/agentic/lib/agent
 */

import LLM from '../../../core/llm.js';
import { CognitiveCore } from './cognitive.js';
import { getToolDefinitions, executeTool } from './tools.js';
import { resolveConfig, configFromEnv, DEFAULT_CONFIG } from './config.js';

class Agent {
  /**
   * @param {Object} userConfig - Partial configuration overrides
   */
  constructor(userConfig = {}) {
    // Merge configs: env → user → defaults
    const envConfig = configFromEnv();
    this.config = resolveConfig({ ...envConfig, ...userConfig });

    // Configure LLM module (used only for ping)
    LLM.configure({
      baseUrl: this.config.llm.baseUrl,
      model: this.config.llm.model
    });

    // Initialize cognitive core
    this.cognitive = new CognitiveCore(this.config.cognitive);

    // Conversation history
    this.history = [];
    this.maxHistory = this.config.agent.maxHistory;

    // System prompt
    this.systemPrompt = this.config.agent.systemPrompt;

    // Tool context (passed to tool executors that need cognitive access)
    this.toolContext = { cognitive: this.cognitive };

    // Stats
    this.turnCount = 0;
    this.totalTokens = 0;
  }

  /**
   * Process a single user turn through the full agent loop.
   *
   * The 11-step loop from ARCHITECTURE.md:
   *  1. PERCEIVE  — BoundaryLayer processes input
   *  2. ENCODE    — Map text to primes
   *  3. ORIENT    — SMF updates
   *  4. ATTEND    — AgencyLayer allocates attention
   *  5. GUARD     — Safety check
   *  6. RECALL    — Holographic memory retrieval
   *  7. THINK     — LLM generates response
   *  8. EXECUTE   — Tool calls (up to maxToolRounds)
   *  9. VALIDATE  — ObjectivityGate
   * 10. REMEMBER  — Store in holographic memory
   * 11. EVOLVE    — Tick physics
   *
   * @param {string} input - User message
   * @returns {Promise<{response: string, metadata: Object}>}
   */
  async turn(input) {
    this.turnCount++;

    // ── Steps 1-4: Process input through cognitive core ────────────────
    const inputAnalysis = this.cognitive.processInput(input);

    // ── Step 5: Safety check ──────────────────────────────────────────
    const violations = this.cognitive.checkSafety();
    if (violations.some(v => v.constraint?.response === 'block')) {
      return {
        response: 'I need to pause — my cognitive state indicates unsafe conditions. Please try rephrasing.',
        metadata: { blocked: true, violations }
      };
    }

    // ── Step 6: Recall relevant memories ──────────────────────────────
    const memories = this.cognitive.recall(input, 3);

    // Build system prompt with cognitive state
    const stateContext = this.cognitive.getStateContext();
    let systemMessage = this.systemPrompt + '\n\n' + stateContext;

    // Append available tool names so the model knows what's at its disposal
    const toolDefs = getToolDefinitions();
    const toolNames = toolDefs.map(t => t.name).join(', ');
    systemMessage += `\n[Available Tools: ${toolNames}]\n`;

    if (memories.length > 0) {
      systemMessage += '\n[Relevant Past Interactions]\n';
      for (const mem of memories) {
        systemMessage += `- User: "${mem.input}" → Agent: "${mem.output}"\n`;
      }
    }

    if (violations.length > 0) {
      systemMessage += '\n[Safety Warnings]\n';
      for (const v of violations) {
        systemMessage += `- ${v.constraint?.name}: ${v.constraint?.description}\n`;
      }
    }

    // Add user message to history
    this.history.push({ role: 'user', content: input });

    // Trim history if needed
    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // ── Steps 7-8: LLM call with tool loop ────────────────────────────
    const messages = [
      { role: 'system', content: systemMessage },
      ...this.history
    ];

    // Pre-route: automatically fetch data the user is asking about
    const toolsUsed = [];
    const preRouted = await this._preRoute(input);
    if (preRouted.length > 0) {
      const toolContext = preRouted.map(r => {
        if (r.tool === 'read_file' && r.content) {
          return `[Auto-retrieved file ${r.path}]:\n${r.content}`;
        } else if (r.tool === 'read_file' && r.error) {
          return `[Attempted to read ${r.path} but got error: ${r.error}]`;
        } else if (r.tool === 'list_files') {
          return `[Files in ${r.path}]: ${Array.isArray(r.files) ? r.files.map(f => typeof f === 'string' ? f : f.name).join(', ') : JSON.stringify(r.files)}`;
        } else if (r.tool === 'cognitive_state') {
          return `[Your current cognitive state]: ${JSON.stringify(r.state, null, 2)}`;
        }
        return '';
      }).filter(Boolean).join('\n\n');

      // Add as a system message with the pre-fetched context
      messages.push({ role: 'system', content: `I have already retrieved the requested information for you. Here is the data — use it to answer the user's question directly:\n\n${toolContext}\n\nYou may still call additional tools if needed.` });

      // Track pre-routed tools in metadata
      toolsUsed.push(...preRouted.map(r => r.tool));
    }

    let response;
    let toolResults = [];
    let toolRounds = 0;

    try {
      // Initial LLM call (toolDefs already fetched above for the system message)
      response = await this._callLLM(messages, toolDefs);

      // Tool call loop
      while (
        response.toolCalls &&
        response.toolCalls.length > 0 &&
        toolRounds < this.config.agent.maxToolRounds
      ) {
        toolRounds++;

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          const result = await executeTool(
            toolCall.name,
            toolCall.arguments,
            this.toolContext
          );
          toolResults.push({ tool: toolCall.name, result });

          // Add tool result to messages
          messages.push({
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: toolCall.id || `call_${toolRounds}_${toolCall.name}`,
              type: 'function',
              function: {
                name: toolCall.name,
                arguments: JSON.stringify(toolCall.arguments)
              }
            }]
          });
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id || `call_${toolRounds}_${toolCall.name}`,
            content: JSON.stringify(result)
          });
        }

        // Call LLM again with tool results
        response = await this._callLLM(messages, toolDefs);
      }
    } catch (e) {
      // LLM call failed — return error with cognitive state
      response = {
        content: `I encountered an error communicating with the LLM: ${e.message}. My cognitive state: coherence=${inputAnalysis.coherence.toFixed(3)}, entropy=${inputAnalysis.entropy.toFixed(3)}`,
        toolCalls: null
      };
    }

    const responseText = response.content || '';

    // ── Step 9: Validate through ObjectivityGate ──────────────────────
    const validation = this.cognitive.validateOutput(responseText, { input });

    let finalResponse = responseText;
    if (!validation.passed) {
      // Gate failed — add caveat
      finalResponse +=
        '\n\n[Note: This response scored below the objectivity threshold. R=' +
        validation.R.toFixed(2) +
        ']';
    }

    // Add assistant response to history
    this.history.push({ role: 'assistant', content: finalResponse });

    // ── Step 10: Remember interaction ─────────────────────────────────
    this.cognitive.remember(input, finalResponse);

    // ── Step 11: Evolve physics ───────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      this.cognitive.tick();
    }

    return {
      response: finalResponse,
      metadata: {
        turnCount: this.turnCount,
        coherence: inputAnalysis.coherence,
        entropy: inputAnalysis.entropy,
        toolsUsed: [...toolsUsed, ...toolResults.map(t => t.tool)],
        toolRounds,
        objectivityR: validation.R,
        objectivityPassed: validation.passed,
        memoryCount: this.cognitive.memories.length,
        processingLoad: inputAnalysis.processingLoad
      }
    };
  }

  /**
   * Check whether a string looks like a real file path (contains a `/` or has
   * a recognised file extension).  Used by _preRoute to reject false-positive
   * regex matches on ordinary words that happen to contain a dot.
   *
   * @param {string} str
   * @returns {boolean}
   * @private
   */
  static _isLikelyFilePath(str) {
    if (str.includes('/')) return true;
    const ext = str.split('.').pop()?.toLowerCase();
    const knownExts = [
      'js','ts','json','md','txt','py','html','css','yml','yaml',
      'toml','xml','sh','jsx','tsx','mjs','cjs','env','cfg','ini',
      'log','csv',
    ];
    return knownExts.includes(ext);
  }

  /**
   * Pre-route: detect file/directory/cognitive queries and auto-fetch data
   * before sending to the LLM, so it has context without needing to call tools.
   *
   * @param {string} input - User message
   * @returns {Promise<Array>} Pre-routed tool results
   * @private
   */
  async _preRoute(input) {
    const lower = input.toLowerCase();
    const results = [];

    // Detect file read requests
    const filePatterns = [
      /read\s+(?:the\s+)?file\s+([^\s,]+)/i,
      /(?:look at|examine|analyze|check|open)\s+(?:the\s+)?(?:file\s+)?([a-zA-Z0-9_./-]+\.[a-zA-Z]+)/i,
      /(?:contents?\s+of|what's\s+in)\s+([a-zA-Z0-9_./-]+\.[a-zA-Z]+)/i,
    ];

    for (const pattern of filePatterns) {
      const match = input.match(pattern);
      if (match && Agent._isLikelyFilePath(match[1])) {
        const filePath = match[1];
        const result = await executeTool('read_file', { path: filePath }, this.toolContext);
        if (result.success) {
          results.push({ tool: 'read_file', path: filePath, content: result.content.substring(0, 4000) });
        } else {
          results.push({ tool: 'read_file', path: filePath, error: result.error });
        }
      }
    }

    // Detect directory listing requests
    const dirPatterns = [
      /list\s+(?:the\s+)?files\s+(?:in\s+)?(?:the\s+)?([a-zA-Z0-9_./-]+)/i,
      /(?:what(?:'s| is| are)\s+(?:in|inside))\s+(?:the\s+)?([a-zA-Z0-9_./-]+(?:\/[a-zA-Z0-9_./-]*)?)(?:\s+(?:directory|folder|dir))?/i,
      /(?:what(?:'s| is)\s+in|contents?\s+of)\s+(?:the\s+)?(?:directory|folder|dir)\s+([a-zA-Z0-9_./-]+)/i,
    ];

    for (const pattern of dirPatterns) {
      const match = input.match(pattern);
      if (match && !results.some(r => r.tool === 'list_files')) {
        const dirPath = match[1].replace(/['"]/g, '');
        const result = await executeTool('list_files', { path: dirPath }, this.toolContext);
        if (result.success) {
          results.push({ tool: 'list_files', path: dirPath, files: result.files });
        }
      }
    }

    // Detect cognitive state requests
    if (/cognitive\s+(?:state|diagnostics|health|metrics)/i.test(lower) ||
        /(?:your|my)\s+(?:coherence|entropy|oscillator)/i.test(lower) ||
        /introspect/i.test(lower)) {
      const result = await executeTool('cognitive_state', {}, this.toolContext);
      if (result.success) {
        results.push({ tool: 'cognitive_state', state: result.state });
      }
    }

    return results;
  }

  /**
   * Call the LLM with optional tool definitions.
   *
   * Uses direct `fetch()` instead of `LLM.chat()` because the core
   * LLM module does not support the `tools` / `tool_choice` fields
   * required for OpenAI-style function calling.
   *
   * @param {Array<{role: string, content: string|null}>} messages
   * @param {Array<{name: string, description: string, parameters: object}>} tools
   * @returns {Promise<{content: string, toolCalls: Array|null, usage: object}>}
   * @private
   */
  async _callLLM(messages, tools) {
    // Build the request body
    const body = {
      model: this.config.llm.model,
      messages,
      temperature: this.config.llm.temperature,
      max_tokens: this.config.llm.maxTokens,
      stream: false
    };

    // Add tools if available
    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      }));
      body.tool_choice = 'auto';
    }

    const res = await fetch(this.config.llm.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`LLM error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    if (!choice) throw new Error('No response from LLM');

    // Track usage
    if (data.usage) {
      this.totalTokens += data.usage.total_tokens || 0;
    }

    // Extract tool calls if present
    const toolCalls =
      choice.message?.tool_calls?.map(tc => {
        let args = {};
        if (typeof tc.function?.arguments === 'string') {
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }
        } else {
          args = tc.function?.arguments || {};
        }
        return {
          id: tc.id,
          name: tc.function?.name,
          arguments: args
        };
      }) || null;

    return {
      content: choice.message?.content || '',
      toolCalls,
      usage: data.usage
    };
  }

  /**
   * Check if the LLM endpoint is reachable.
   * @returns {Promise<boolean>}
   */
  async ping() {
    return LLM.ping();
  }

  /**
   * Get agent statistics.
   * @returns {Object}
   */
  getStats() {
    return {
      turnCount: this.turnCount,
      totalTokens: this.totalTokens,
      historyLength: this.history.length,
      cognitive: this.cognitive.getDiagnostics()
    };
  }

  /**
   * Reset all agent state (history, counters, cognitive core).
   */
  reset() {
    this.history = [];
    this.turnCount = 0;
    this.totalTokens = 0;
    this.cognitive.reset();
  }
}

export { Agent };
export default Agent;
