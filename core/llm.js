/**
 * LMStudio LLM Client
 * Calls LMStudio's OpenAI-compatible chat endpoint
 */

const DEFAULT_URL = 'http://192.168.4.79:1234/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

let _baseUrl = DEFAULT_URL;
let _model = DEFAULT_MODEL;

/**
 * Configure LMStudio connection
 * @param {Object} cfg - Configuration
 * @param {string} cfg.baseUrl - Base URL (default: http://localhost:1234/v1/chat/completions)
 * @param {string} cfg.model - Model name (default: local-model)
 */
const configure = (cfg = {}) => {
  if (cfg.baseUrl) _baseUrl = cfg.baseUrl;
  if (cfg.model) _model = cfg.model;
};

/**
 * Call LMStudio chat endpoint
 * @param {Array<{role: string, content: string}>} messages - Conversation messages
 * @param {Object} options - Generation options
 * @param {number} options.temperature - Sampling temperature (0-2)
 * @param {Object} options.jsonSchema - JSON schema for structured output
 * @param {number} options.maxTokens - Maximum tokens to generate
 * @returns {Promise<{content: string, usage: Object, raw: Object}>}
 */
async function chat(messages, options = {}) {
  const { temperature = 0.7, jsonSchema = null, maxTokens = 1024 } = options;

  const body = {
    model: _model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false
  };

  // Add JSON schema if provided (structured output)
  if (jsonSchema) {
    // Adapt to LMStudio/OpenAI Structured Outputs requirement
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'response',
        schema: jsonSchema
      }
    };
  }

  const res = await fetch(_baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`LMStudio error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  
  if (!choice) throw new Error('No response from LMStudio');

  let content = choice.message?.content || '';
  
  // Parse JSON if schema was requested
  if (jsonSchema && content) {
    try {
      content = JSON.parse(content);
    } catch (e) {
      // Return raw string if JSON parse fails
    }
  }

  return {
    content,
    usage: data.usage || {},
    raw: data
  };
}

/**
 * Simple completion helper
 * @param {string} prompt - User prompt
 * @param {Object} options - Generation options
 * @returns {Promise<string>}
 */
async function complete(prompt, options = {}) {
  const r = await chat([{ role: 'user', content: prompt }], options);
  return r.content;
}

/**
 * System + user message helper
 * @param {string} system - System prompt
 * @param {string} user - User message
 * @param {Object} options - Generation options
 * @returns {Promise<string>}
 */
async function ask(system, user, options = {}) {
  const r = await chat([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ], options);
  return r.content;
}

/**
 * Check if LMStudio is running
 * @returns {Promise<boolean>}
 */
async function ping() {
  try {
    const r = await fetch(_baseUrl.replace('/chat/completions', '/models'));
    return r.ok;
  } catch { return false; }
}

/**
 * Get current configuration
 * @returns {{baseUrl: string, model: string}}
 */
const getConfig = () => ({ baseUrl: _baseUrl, model: _model });

module.exports = { chat, complete, ask, configure, ping, getConfig };