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
    maxTokens: 2048
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

IMPORTANT: When asked about file contents or code, ALWAYS use read_file — never guess. When asked about your cognitive state, ALWAYS use cognitive_state. Always attempt operations even if they might fail — report errors rather than refusing.`,
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
 *
 * @returns {Object} Partial configuration derived from environment
 */
export function configFromEnv() {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const partial = {};

  if (env.ALEPH_LLM_URL || env.ALEPH_LLM_MODEL || env.ALEPH_TEMPERATURE) {
    partial.llm = {};
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
