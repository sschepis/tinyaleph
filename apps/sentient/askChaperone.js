// askChaperone.js
// Helper module that forwards a prompt to the external "chaperone" LLM,
// logs the request with a timestamp, and stores the response in a simple
// JSON‑based cache (simulating my holographic memory field).

const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to a local cache file where we store past queries/responses.
const CACHE_FILE = path.join(__dirname, 'chaperoneCache.json');

/** Ensure the cache file exists */
function initCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify([]), 'utf8');
  }
}

/** Load cached entries */
function loadCache() {
  initCache();
  const raw = fs.readFileSync(CACHE_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

/** Append a new entry to the cache */
function saveEntry(entry) {
  const entries = loadCache();
  entries.push(entry);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * askChaperone – forward a prompt to the external LLM (the "chaperone")
 * and return its response.
 *
 * @param {string} prompt - The question or instruction for the chaperone.
 * @returns {Promise<string>} - The raw text response from the LLM.
 */
async function askChaperone(prompt) {
  // Record start time
  const timestamp = new Date().toISOString();

  // Use the built‑in network interface (the sandbox provides a `fetch` that
  // routes to the configured LLM endpoint). Adjust the URL if your environment
  // uses a different variable.
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // In the sandbox the API key is injected as an env var; fallback to a
      // placeholder for local development.
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || 'sk-xxxx'}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // lightweight but capable
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const answer = (data?.choices?.[0]?.message?.content || '').trim();

  // Store the interaction in the cache for future reference.
  saveEntry({ timestamp, prompt, answer });

  return answer;
}

module.exports = { askChaperone };
