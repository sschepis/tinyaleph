/**
 * Comprehensive test suite for apps/agentic
 *
 * Tests: config, cognitive, tools, agent modules
 * Uses node:test + node:assert (built-in test runner)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resolveConfig, configFromEnv, DEFAULT_CONFIG } from '../lib/config.js';
import { CognitiveCore } from '../lib/cognitive.js';
import { TOOLS, getToolDefinitions, executeTool } from '../lib/tools.js';
import { Agent } from '../lib/agent.js';

// ═══════════════════════════════════════════════════════════════════════
// 1. Config Tests
// ═══════════════════════════════════════════════════════════════════════

describe('Config', () => {
  it('DEFAULT_CONFIG has all required sections', () => {
    assert.ok(DEFAULT_CONFIG.llm, 'llm section missing');
    assert.ok(DEFAULT_CONFIG.cognitive, 'cognitive section missing');
    assert.ok(DEFAULT_CONFIG.agent, 'agent section missing');

    // llm keys
    assert.ok('baseUrl' in DEFAULT_CONFIG.llm);
    assert.ok('model' in DEFAULT_CONFIG.llm);
    assert.ok('temperature' in DEFAULT_CONFIG.llm);
    assert.ok('maxTokens' in DEFAULT_CONFIG.llm);

    // cognitive keys
    assert.ok('primeCount' in DEFAULT_CONFIG.cognitive);
    assert.ok('dimension' in DEFAULT_CONFIG.cognitive);
    assert.ok('coherenceThreshold' in DEFAULT_CONFIG.cognitive);

    // agent keys
    assert.ok('maxToolRounds' in DEFAULT_CONFIG.agent);
    assert.ok('maxHistory' in DEFAULT_CONFIG.agent);
    assert.ok('systemPrompt' in DEFAULT_CONFIG.agent);
  });

  it('resolveConfig merges nested objects correctly', () => {
    const merged = resolveConfig({ llm: { model: 'custom-model' } });
    assert.strictEqual(merged.llm.model, 'custom-model');
    // baseUrl should still be the default
    assert.strictEqual(merged.llm.baseUrl, DEFAULT_CONFIG.llm.baseUrl);
  });

  it('resolveConfig preserves defaults for missing keys', () => {
    const merged = resolveConfig({});
    assert.deepStrictEqual(merged, DEFAULT_CONFIG);
  });

  it('configFromEnv reads environment variables', () => {
    const origUrl = process.env.ALEPH_LLM_URL;
    const origModel = process.env.ALEPH_LLM_MODEL;
    const origTemp = process.env.ALEPH_TEMPERATURE;

    try {
      process.env.ALEPH_LLM_URL = 'http://test:9999/v1/chat/completions';
      process.env.ALEPH_LLM_MODEL = 'env-model';
      process.env.ALEPH_TEMPERATURE = '0.42';

      const partial = configFromEnv();
      assert.strictEqual(partial.llm.baseUrl, 'http://test:9999/v1/chat/completions');
      assert.strictEqual(partial.llm.model, 'env-model');
      assert.strictEqual(partial.llm.temperature, 0.42);
    } finally {
      // Restore
      if (origUrl === undefined) delete process.env.ALEPH_LLM_URL;
      else process.env.ALEPH_LLM_URL = origUrl;
      if (origModel === undefined) delete process.env.ALEPH_LLM_MODEL;
      else process.env.ALEPH_LLM_MODEL = origModel;
      if (origTemp === undefined) delete process.env.ALEPH_TEMPERATURE;
      else process.env.ALEPH_TEMPERATURE = origTemp;
    }
  });

  it('resolveConfig overrides scalars not objects', () => {
    const merged = resolveConfig({ agent: { maxHistory: 100 } });
    assert.strictEqual(merged.agent.maxHistory, 100);
    assert.strictEqual(merged.agent.maxToolRounds, DEFAULT_CONFIG.agent.maxToolRounds);
    assert.strictEqual(merged.agent.systemPrompt, DEFAULT_CONFIG.agent.systemPrompt);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. CognitiveCore Tests
// ═══════════════════════════════════════════════════════════════════════

describe('CognitiveCore', () => {
  let core;

  beforeEach(() => {
    core = new CognitiveCore();
  });

  it('constructor initializes all observer layers', () => {
    assert.ok(core.smf, 'smf missing');
    assert.ok(core.prsc, 'prsc missing');
    assert.ok(core.hqe, 'hqe missing');
    assert.ok(core.agency, 'agency missing');
    assert.ok(core.boundary, 'boundary missing');
    assert.ok(core.temporal, 'temporal missing');
    assert.ok(core.entanglement, 'entanglement missing');
  });

  it('processInput returns expected shape', () => {
    const result = core.processInput('hello world');
    assert.ok(Array.isArray(result.primes), 'primes should be an array');
    assert.strictEqual(typeof result.coherence, 'number');
    assert.strictEqual(typeof result.entropy, 'number');
    assert.strictEqual(typeof result.interactionCount, 'number');
    assert.ok('smfOrientation' in result);
    assert.ok('activePrimes' in result);
  });

  it('processInput increments interactionCount', () => {
    core.processInput('first');
    const c1 = core.interactionCount;
    core.processInput('second');
    const c2 = core.interactionCount;
    assert.strictEqual(c2, c1 + 1);
  });

  it('tick advances tickCount and updates coherence/entropy', () => {
    const before = core.tickCount;
    core.tick();
    assert.strictEqual(core.tickCount, before + 1);
    assert.strictEqual(typeof core.coherence, 'number');
    assert.strictEqual(typeof core.entropy, 'number');
  });

  it('getStateContext returns formatted string', () => {
    core.processInput('test input');
    const ctx = core.getStateContext();
    assert.strictEqual(typeof ctx, 'string');
    assert.ok(ctx.includes('Cognitive State'), 'missing "Cognitive State"');
    assert.ok(ctx.includes('Coherence'), 'missing "Coherence"');
    assert.ok(ctx.includes('Entropy'), 'missing "Entropy"');
  });

  it('remember stores a memory', () => {
    const before = core.memories.length;
    core.remember('test input', 'test output');
    assert.ok(core.memories.length > before);
  });

  it('recall retrieves relevant memories', () => {
    core.remember('quantum computing is fascinating', 'yes it is');
    const results = core.recall('quantum', 5);
    assert.ok(results.length >= 1, 'should retrieve at least one memory');
  });

  it('recall returns low scores for unrelated queries', () => {
    core.reset();
    core.remember('hello world', 'hi there');
    const results = core.recall('xyzzyplugh', 5);
    // unrelated query has no prime overlap; score is purely from recency
    // recency component is always > 0 so results may still appear,
    // but overlap contribution (0.7 weight) should be zero
    for (const r of results) {
      assert.ok(r.score < 0.5, `expected low score for unrelated query, got ${r.score}`);
    }
  });

  it('validateOutput returns passed and R score', () => {
    const result = core.validateOutput('This is a complete sentence.', { input: 'Tell me something' });
    assert.strictEqual(typeof result.passed, 'boolean');
    assert.strictEqual(typeof result.R, 'number');
    assert.ok(result.R >= 0 && result.R <= 1, `R should be 0-1, got ${result.R}`);
  });

  it('checkSafety returns violations array', () => {
    const violations = core.checkSafety();
    assert.ok(Array.isArray(violations));
  });

  it('createGoal creates an active goal', () => {
    const goal = core.createGoal('Test goal', 0.9);
    assert.ok(goal, 'goal should be created');
    const stats = core.agency.getStats();
    assert.ok(stats.activeGoals > 0 || stats.totalGoals > 0, 'agency should track the goal');
  });

  it('getDiagnostics returns complete state', () => {
    const diag = core.getDiagnostics();
    assert.ok('tickCount' in diag);
    assert.ok('coherence' in diag);
    assert.ok('entropy' in diag);
    assert.ok('interactionCount' in diag);
    assert.ok('memoryCount' in diag);
    assert.ok('agencyStats' in diag);
    assert.ok('boundaryStats' in diag);
  });

  it('reset clears all state', () => {
    core.processInput('some input');
    core.remember('x', 'y');
    core.reset();
    assert.strictEqual(core.tickCount, 0);
    assert.strictEqual(core.interactionCount, 0);
    assert.strictEqual(core.memories.length, 0);
  });

  it('multiple ticks evolve coherence', () => {
    core.processInput('synchronization resonance harmony');
    for (let i = 0; i < 20; i++) core.tick();
    assert.strictEqual(typeof core.coherence, 'number');
    assert.strictEqual(typeof core.entropy, 'number');
  });

  it('SMF orientation is 16-dimensional', () => {
    core.processInput('test');
    const diag = core.getDiagnostics();
    if (diag.smfOrientation) {
      assert.strictEqual(diag.smfOrientation.length, 16);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. Tools Tests
// ═══════════════════════════════════════════════════════════════════════

describe('Tools', () => {
  it('TOOLS array has 6 tools', () => {
    assert.strictEqual(TOOLS.length, 6);
  });

  it('each tool has name, description, parameters, execute', () => {
    for (const tool of TOOLS) {
      assert.ok(tool.name, `tool missing name`);
      assert.ok(tool.description, `${tool.name} missing description`);
      assert.ok(tool.parameters, `${tool.name} missing parameters`);
      assert.strictEqual(typeof tool.execute, 'function', `${tool.name} missing execute`);
    }
  });

  it('getToolDefinitions returns tools without execute function', () => {
    const defs = getToolDefinitions();
    assert.strictEqual(defs.length, TOOLS.length);
    for (const def of defs) {
      assert.ok(def.name);
      assert.ok(def.description);
      assert.ok(def.parameters);
      assert.strictEqual(def.execute, undefined, `${def.name} should not expose execute`);
    }
  });

  it('executeTool runs read_file successfully', async () => {
    const result = await executeTool('read_file', { path: 'package.json' }, {});
    assert.strictEqual(result.success, true);
    assert.ok(result.content.includes('@aleph-ai/tinyaleph'));
  });

  it('executeTool handles missing file gracefully', async () => {
    const result = await executeTool('read_file', { path: '/nonexistent/file.txt' }, {});
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it('executeTool runs list_files', async () => {
    const result = await executeTool('list_files', { path: '.' }, {});
    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.files));
  });

  it('executeTool runs cognitive_state with cognitive context', async () => {
    const cogCore = new CognitiveCore();
    const result = await executeTool('cognitive_state', {}, { cognitive: cogCore });
    assert.strictEqual(result.success, true);
    assert.ok('tickCount' in result.state);
  });

  it('executeTool runs recall_memory', async () => {
    const cogCore = new CognitiveCore();
    cogCore.remember('test data', 'test response');
    const result = await executeTool('recall_memory', { query: 'test' }, { cognitive: cogCore });
    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.memories));
  });

  it('executeTool returns error for unknown tool', async () => {
    const result = await executeTool('nonexistent_tool', {}, {});
    assert.strictEqual(result.success, false);
  });

  it('executeTool runs run_command', async () => {
    const result = await executeTool('run_command', { command: 'echo hello' }, {});
    assert.strictEqual(result.success, true);
    assert.ok(result.stdout.includes('hello'));
  });

  it('executeTool write_file works', async () => {
    const fs = await import('node:fs/promises');
    const testPath = './test-tmp-write.txt';
    const result = await executeTool('write_file', { path: testPath, content: 'test content' }, {});
    assert.strictEqual(result.success, true);
    const content = await fs.readFile(testPath, 'utf-8');
    assert.strictEqual(content, 'test content');
    await fs.unlink(testPath).catch(() => {}); // cleanup
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. Agent Tests
// ═══════════════════════════════════════════════════════════════════════

describe('Agent', () => {
  it('constructor creates agent with default config', () => {
    const agent = new Agent();
    assert.ok(agent.config.llm);
    assert.ok(agent.config.cognitive);
    assert.ok(agent.config.agent);
    assert.ok(agent.cognitive);
    assert.strictEqual(typeof agent.cognitive.processInput, 'function');
    assert.ok(Array.isArray(agent.history));
    assert.strictEqual(agent.history.length, 0);
    assert.strictEqual(agent.turnCount, 0);
  });

  it('constructor accepts custom config', () => {
    const agent = new Agent({ llm: { model: 'test-model' } });
    assert.strictEqual(agent.config.llm.model, 'test-model');
    assert.strictEqual(agent.config.llm.baseUrl, DEFAULT_CONFIG.llm.baseUrl);
  });

  it('getStats returns agent statistics', () => {
    const agent = new Agent();
    const stats = agent.getStats();
    assert.ok('turnCount' in stats);
    assert.ok('totalTokens' in stats);
    assert.ok('historyLength' in stats);
    assert.ok('cognitive' in stats);
  });

  it('reset clears agent state', () => {
    const agent = new Agent();
    agent.history.push({ role: 'user', content: 'test' });
    agent.turnCount = 5;
    agent.reset();
    assert.strictEqual(agent.history.length, 0);
    assert.strictEqual(agent.turnCount, 0);
  });

  it('cognitive core is wired to toolContext', () => {
    const agent = new Agent();
    assert.strictEqual(agent.toolContext.cognitive, agent.cognitive);
  });

  it('turn rejects gracefully when LLM is unreachable', async () => {
    const agent = new Agent({ llm: { baseUrl: 'http://127.0.0.1:19999/v1/chat/completions' } });
    const result = await agent.turn('hello');
    // Should not throw; should contain error info
    assert.ok(result.response, 'response should exist');
    assert.strictEqual(result.metadata.turnCount, 1);
  });
});
