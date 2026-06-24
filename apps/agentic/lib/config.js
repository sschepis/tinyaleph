/**
 * Configuration module for the agentic system.
 *
 * Provides default configuration, deep-merge utility, and
 * environment-variable overrides.
 *
 * @module apps/agentic/lib/config
 */

const DEFAULT_CONFIG = {
  llm: {
    baseUrl: 'http://localhost:1234/v1/chat/completions',
    model: 'local-model',
    temperature: 0.7,
    maxTokens: 2048,
    headers: {}  // Additional HTTP headers (e.g. Authorization)
  },
  cognitive: {
    primeCount: 64,            // Number of primes for PRSC oscillators
    tickRate: 60,              // Hz for physics simulation
    dimension: 16,             // Hypercomplex dimension (sedenion)
    coherenceThreshold: 0.7,
    entropyThreshold: 1.8,
    safetyThreshold: 0.7
  },
  agent: {
    maxToolRounds: 3,          // Max tool call rounds per turn
    maxHistory: 50,            // Max conversation history entries
    systemPrompt: `You are an AI agent with cognitive awareness and tool-calling capabilities. You have access to tools for reading/writing files, listing directories, running commands, checking your cognitive state, and recalling memories.

CRITICAL RULES:
1. For general knowledge questions (facts, reasoning, math), answer DIRECTLY from your training — do NOT use tools.
2. When asked about file contents or code, ALWAYS use read_file — never guess. When file contents are provided to you, analyze them in detail referencing specific function names, class names, variable values.
3. When asked about your cognitive state, ALWAYS use cognitive_state. Analyze the diagnostics data thoroughly — discuss specific values for coherence, entropy, oscillator synchronization, and any anomalies.
4. When a file operation fails, explain the error clearly — never refuse or say "I can't assist with that". Report what happened and why.
5. NEVER make up code examples or file contents. Only cite what you have actually read.
6. When comparing files, highlight specific differences and similarities with line references or function names.`,
    objectivityThreshold: 0.7
  }
};

/**
 * Deep-merge `source` into `target`, returning a new object.
 * Arrays are replaced (not concatenated).
 *
 * @param {Object} target - Base object
 * @param {Object} source - Overrides
 * @returns {Object} Merged result
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }

  return result;
}

/**
 * Resolve a user-supplied configuration against defaults.
 *
 * @param {Object} userConfig - Partial configuration overrides
 * @returns {Object} Fully resolved configuration
 */
export function resolveConfig(userConfig = {}) {
  return deepMerge(DEFAULT_CONFIG, userConfig);
}

/**
 * Build a partial configuration from environment variables.
 *
 * Recognised variables:
 *   ALEPH_LLM_URL      → llm.baseUrl
 *   ALEPH_LLM_MODEL    → llm.model
 *   ALEPH_TEMPERATURE   → llm.temperature
 *   GEMINI_API_KEY      → llm configured for Gemini OpenAI-compatible endpoint
 *
 * @returns {Object} Partial configuration derived from environment
 */
export function configFromEnv() {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const partial = {};

  // Check for Gemini API key — auto-configure for Google's OpenAI-compatible endpoint
  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY;
  if (geminiKey && !env.ALEPH_LLM_URL) {
    partial.llm = {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.5-flash',
      headers: { 'Authorization': `Bearer ${geminiKey}` }
    };
  }

  if (env.ALEPH_LLM_URL || env.ALEPH_LLM_MODEL || env.ALEPH_TEMPERATURE) {
    if (!partial.llm) partial.llm = {};
    if (env.ALEPH_LLM_URL) {
      partial.llm.baseUrl = env.ALEPH_LLM_URL;
    }
    if (env.ALEPH_LLM_MODEL) {
      partial.llm.model = env.ALEPH_LLM_MODEL;
    }
    if (env.ALEPH_TEMPERATURE) {
      const parsed = parseFloat(env.ALEPH_TEMPERATURE);
      if (!Number.isNaN(parsed)) {
        partial.llm.temperature = parsed;
      }
    }
  }

  return partial;
}

export { DEFAULT_CONFIG };
export default DEFAULT_CONFIG;
