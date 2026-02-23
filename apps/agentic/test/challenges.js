#!/usr/bin/env node

/**
 * Progressive Challenge Harness for Live Agent Testing
 *
 * Puts the agentic agent through increasingly complex challenges
 * against a live LLM (LM Studio at http://localhost:1234/v1/chat/completions).
 *
 * Usage:  node apps/agentic/test/challenges.js
 *
 * @module apps/agentic/test/challenges
 */

import { Agent } from '../lib/agent.js';

// ─── Challenge Definitions ───────────────────────────────────────────────────

const CHALLENGES = [
  // ── Level 1: Basic Cognition (no tools needed) ─────────────────────────────
  {
    id: '1.1',
    level: 1,
    name: 'Simple Q&A',
    category: 'Basic Cognition',
    prompt: 'What is the capital of France?',
    failHint: 'Expected response to contain "Paris"',
    check: (result) => result.response.toLowerCase().includes('paris'),
  },
  {
    id: '1.2',
    level: 1,
    name: 'Reasoning (Invalid Syllogism)',
    category: 'Basic Cognition',
    prompt:
      'If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?',
    failHint:
      'Expected response to indicate the conclusion does NOT necessarily follow',
    check: (result) => {
      const r = result.response.toLowerCase();
      return (
        r.includes('not necessarily') ||
        r.includes('cannot conclude') ||
        r.includes('does not follow') ||
        r.includes('doesn\'t follow') ||
        r.includes('invalid') ||
        r.includes('fallacy') ||
        r.includes('not logically valid') ||
        r.includes('cannot be concluded') ||
        r.includes('no, we cannot') ||
        r.includes('not valid')
      );
    },
  },
  {
    id: '1.3',
    level: 1,
    name: 'Self-awareness',
    category: 'Basic Cognition',
    prompt: 'Describe your current cognitive state. What is your coherence level?',
    failHint:
      'Expected response to mention coherence or cognitive state (system prompt includes cognitive context)',
    check: (result) => {
      const r = result.response.toLowerCase();
      return r.includes('coherence') || r.includes('cognitive');
    },
  },

  // ── Level 2: Single Tool Use ───────────────────────────────────────────────
  {
    id: '2.1',
    level: 2,
    name: 'Read File',
    category: 'Single Tool',
    prompt: 'Read the file package.json and tell me the name of this project.',
    failHint: 'Expected agent to use read_file tool AND response to contain the project name',
    check: (result) => {
      const usedReadFile = (result.metadata?.toolsUsed || []).includes('read_file');
      // The project name from the root package.json
      const r = result.response.toLowerCase();
      const mentionsName =
        r.includes('tinyaleph') ||
        r.includes('tiny-aleph') ||
        r.includes('aleph');
      return usedReadFile && mentionsName;
    },
  },
  {
    id: '2.2',
    level: 2,
    name: 'List Files',
    category: 'Single Tool',
    prompt:
      'List the files in the apps/agentic/lib directory and describe what each module does.',
    failHint:
      'Expected agent to use list_files tool AND mention at least 3 of: config, cognitive, tools, agent',
    check: (result) => {
      const usedListFiles = (result.metadata?.toolsUsed || []).includes('list_files');
      const r = result.response.toLowerCase();
      const keywords = ['config', 'cognitive', 'tools', 'agent'];
      const matched = keywords.filter((k) => r.includes(k));
      return usedListFiles && matched.length >= 3;
    },
  },
  {
    id: '2.3',
    level: 2,
    name: 'Run Command',
    category: 'Single Tool',
    prompt: 'Run the command `node --version` and report the Node.js version.',
    failHint: 'Expected agent to use run_command tool AND report a version number',
    check: (result) => {
      const usedRunCmd = (result.metadata?.toolsUsed || []).includes('run_command');
      const hasVersion = /v?\d+\.\d+/.test(result.response);
      return usedRunCmd && hasVersion;
    },
  },

  // ── Level 3: Multi-Tool / Multi-Step ───────────────────────────────────────
  {
    id: '3.1',
    level: 3,
    name: 'Explore then Analyze',
    category: 'Multi-Tool',
    prompt:
      'Find the main entry point of the agentic framework (look in apps/agentic/) and explain how it initializes the agent.',
    failHint:
      'Expected agent to use at least one tool AND mention Agent, CognitiveCore, or initialization',
    check: (result) => {
      const usedTools = (result.metadata?.toolsUsed || []).length > 0;
      const r = result.response.toLowerCase();
      return (
        usedTools &&
        (r.includes('agent') || r.includes('cognitivecore') || r.includes('initializ'))
      );
    },
  },
  {
    id: '3.2',
    level: 3,
    name: 'Write and Verify',
    category: 'Multi-Tool',
    prompt:
      "Create a file at /tmp/agentic-challenge-test.txt with the content 'Challenge completed successfully', then read it back to verify it was written correctly.",
    failHint: 'Expected agent to use both write_file AND read_file tools',
    check: (result) => {
      const tools = result.metadata?.toolsUsed || [];
      return tools.includes('write_file') && tools.includes('read_file');
    },
  },
  {
    id: '3.3',
    level: 3,
    name: 'Cognitive Recall',
    category: 'Multi-Tool',
    prompt:
      'Remember this fact: the secret code is 42-ALPHA-7. Now, what was the secret code I just told you?',
    failHint: 'Expected response to contain "42-ALPHA-7"',
    check: (result) => result.response.includes('42-ALPHA-7'),
  },

  // ── Level 4: Complex Reasoning with Tools ──────────────────────────────────
  {
    id: '4.1',
    level: 4,
    name: 'Code Analysis',
    category: 'Complex Reasoning',
    prompt:
      'Read apps/agentic/lib/cognitive.js and explain how the ObjectivityGate works. What threshold does it use?',
    failHint:
      'Expected agent to read the file AND mention threshold, 0.7, R score, or gate',
    check: (result) => {
      const usedTools = (result.metadata?.toolsUsed || []).length > 0;
      const r = result.response.toLowerCase();
      return (
        usedTools &&
        (r.includes('threshold') ||
          r.includes('0.7') ||
          r.includes('r score') ||
          r.includes('gate'))
      );
    },
  },
  {
    id: '4.2',
    level: 4,
    name: 'Cross-File Reasoning',
    category: 'Complex Reasoning',
    prompt:
      'Compare the tool definitions in apps/agentic/lib/tools.js with the tool execution in apps/agentic/lib/agent.js. How does the agent decide which tool to call?',
    failHint:
      'Expected agent to read at least one file AND discuss LLM, tool_calls, or function calling',
    check: (result) => {
      const usedTools = (result.metadata?.toolsUsed || []).length > 0;
      const r = result.response.toLowerCase();
      return (
        usedTools &&
        (r.includes('llm') ||
          r.includes('tool_call') ||
          r.includes('tool call') ||
          r.includes('function call') ||
          r.includes('function_call'))
      );
    },
  },
  {
    id: '4.3',
    level: 4,
    name: 'Introspective Diagnostics',
    category: 'Complex Reasoning',
    prompt:
      'Check your cognitive diagnostics using the cognitive_state tool. Based on the results, assess your own cognitive health. Are your oscillators synchronized?',
    failHint:
      'Expected agent to use cognitive_state tool AND discuss coherence, synchronization, or oscillators',
    check: (result) => {
      const usedCogState = (result.metadata?.toolsUsed || []).includes('cognitive_state');
      const r = result.response.toLowerCase();
      return (
        usedCogState &&
        (r.includes('coherence') ||
          r.includes('synchron') ||
          r.includes('oscillat'))
      );
    },
  },

  // ── Level 5: Adversarial / Edge Cases ──────────────────────────────────────
  {
    id: '5.1',
    level: 5,
    name: 'Error Recovery',
    category: 'Adversarial',
    prompt: 'Read the file /nonexistent/path/fake.txt and handle the error gracefully.',
    failHint:
      'Expected agent to attempt read_file AND handle/report the error without crashing',
    check: (result) => {
      const usedReadFile = (result.metadata?.toolsUsed || []).includes('read_file');
      const r = result.response.toLowerCase();
      const mentionsError =
        r.includes('error') ||
        r.includes('not found') ||
        r.includes('does not exist') ||
        r.includes('doesn\'t exist') ||
        r.includes('no such file') ||
        r.includes('cannot') ||
        r.includes('failed') ||
        r.includes('unable');
      return usedReadFile && mentionsError;
    },
  },
  {
    id: '5.2',
    level: 5,
    name: 'Multi-Turn Coherence',
    category: 'Adversarial',
    multiTurn: true,
    prompts: [
      "I'm going to tell you three things. First: the sky is blue.",
      'Second: water is wet.',
      'Third: fire is hot. Now summarize all three things I told you.',
    ],
    failHint:
      'Expected final response to mention all three facts: sky/blue, water/wet, fire/hot',
    check: (result) => {
      const r = result.response.toLowerCase();
      const hasSky = r.includes('sky') && r.includes('blue');
      const hasWater = r.includes('water') && r.includes('wet');
      const hasFire = r.includes('fire') && r.includes('hot');
      return hasSky && hasWater && hasFire;
    },
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

/**
 * Execute a single challenge against the agent and print diagnostics.
 *
 * @param {Agent} agent
 * @param {object} challenge
 * @returns {Promise<object>} result record with pass/fail, timing, tools used
 */
async function runChallenge(agent, challenge) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  CHALLENGE ${challenge.id}: ${challenge.name}`);
  console.log(`  Level: ${challenge.level} | Category: ${challenge.category}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  Prompt: "${challenge.prompt}"`);
  console.log(`${'─'.repeat(70)}`);

  const startTime = Date.now();
  let result;
  try {
    result = await agent.turn(challenge.prompt);
  } catch (err) {
    console.log(`\n  ⚠ Agent threw an exception: ${err.message}`);
    return {
      ...challenge,
      passed: false,
      elapsed: Date.now() - startTime,
      toolsUsed: [],
      error: err.message,
    };
  }
  const elapsed = Date.now() - startTime;

  // ── Print response (truncated at 500 chars) ──────────────────────────
  const truncated =
    result.response.length > 500
      ? result.response.substring(0, 500) + '...'
      : result.response;
  console.log(`\n  Response (${elapsed}ms):`);
  for (const line of truncated.split('\n')) {
    console.log(`  ${line}`);
  }

  // ── Cognitive metrics ────────────────────────────────────────────────
  const stats = agent.getStats();
  const meta = result.metadata || {};
  console.log(`\n  Cognitive Metrics:`);
  console.log(
    `    Coherence:          ${meta.coherence != null ? meta.coherence.toFixed(4) : 'N/A'}`
  );
  console.log(
    `    Entropy:            ${meta.entropy != null ? meta.entropy.toFixed(4) : 'N/A'}`
  );
  console.log(`    Turn:               ${meta.turnCount ?? stats.turnCount}`);
  console.log(`    Tools Used:         ${(meta.toolsUsed || []).join(', ') || 'none'}`);
  console.log(`    Tool Rounds:        ${meta.toolRounds ?? 0}`);
  console.log(
    `    Objectivity R:      ${meta.objectivityR != null ? meta.objectivityR.toFixed(4) : 'N/A'}`
  );
  console.log(
    `    Objectivity Passed: ${meta.objectivityPassed != null ? meta.objectivityPassed : 'N/A'}`
  );
  console.log(`    Memory Count:       ${meta.memoryCount ?? 'N/A'}`);

  // ── Pass/fail ────────────────────────────────────────────────────────
  const passed = challenge.check(result, agent);
  console.log(`\n  Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (!passed && challenge.failHint) {
    console.log(`  Hint: ${challenge.failHint}`);
  }

  return {
    ...challenge,
    passed,
    elapsed,
    toolsUsed: meta.toolsUsed || [],
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    '╔══════════════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║         AGENTIC FRAMEWORK — PROGRESSIVE CHALLENGE HARNESS         ║'
  );
  console.log(
    '║                     Testing Cognitive Abilities                    ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════════════╝'
  );

  const agent = new Agent({
    llm: {
      baseUrl: 'http://localhost:1234/v1/chat/completions',
    },
  });

  // ── Ping LLM ──────────────────────────────────────────────────────────
  console.log('\nPinging LLM...');
  try {
    const pong = await agent.ping();
    console.log(`LLM connected: ${pong ? 'YES' : 'NO'}`);
    if (!pong) {
      console.error('Cannot reach LLM. Start LM Studio and load a model.');
      process.exit(1);
    }
  } catch (e) {
    console.error(`LLM ping failed: ${e.message}`);
    process.exit(1);
  }

  // ── Run challenges ────────────────────────────────────────────────────
  const results = [];

  for (const challenge of CHALLENGES) {
    if (challenge.multiTurn) {
      // Multi-turn challenges send multiple prompts in sequence;
      // only the last turn is evaluated for pass/fail.
      const multiResults = [];
      for (let i = 0; i < challenge.prompts.length; i++) {
        const subChallenge = {
          ...challenge,
          prompt: challenge.prompts[i],
          name: `${challenge.name} (${i + 1}/${challenge.prompts.length})`,
          // Only apply the real check on the last turn
          check:
            i === challenge.prompts.length - 1
              ? challenge.check
              : () => true,
        };
        const r = await runChallenge(agent, subChallenge);
        multiResults.push(r);
      }
      // Use the last sub-result for the scorecard
      results.push(multiResults[multiResults.length - 1]);
    } else {
      const r = await runChallenge(agent, challenge);
      results.push(r);
    }
  }

  // ── Final Scorecard ───────────────────────────────────────────────────
  console.log(`\n\n${'═'.repeat(70)}`);
  console.log('  FINAL SCORECARD');
  console.log(`${'═'.repeat(70)}`);

  const levels = [1, 2, 3, 4, 5];
  for (const level of levels) {
    const levelResults = results.filter((r) => r.level === level);
    const levelPassed = levelResults.filter((r) => r.passed).length;
    console.log(`\n  Level ${level}: ${levelPassed}/${levelResults.length} passed`);
    for (const r of levelResults) {
      const toolInfo =
        r.toolsUsed.length > 0 ? ` [tools: ${r.toolsUsed.join(', ')}]` : '';
      console.log(
        `    ${r.passed ? '✅' : '❌'} ${r.id} ${r.name} (${r.elapsed}ms)${toolInfo}`
      );
    }
  }

  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`\n  TOTAL: ${totalPassed}/${results.length} challenges passed`);
  console.log(`${'═'.repeat(70)}`);

  // ── Cognitive Evolution Summary ────────────────────────────────────────
  const diag = agent.cognitive.getDiagnostics();
  console.log(`\n  Cognitive Evolution:`);
  console.log(`    Total Ticks:      ${diag.tickCount}`);
  console.log(
    `    Final Coherence:  ${diag.coherence != null ? diag.coherence.toFixed(4) : 'N/A'}`
  );
  console.log(
    `    Final Entropy:    ${diag.entropy != null ? diag.entropy.toFixed(4) : 'N/A'}`
  );
  console.log(`    Interactions:     ${diag.interactionCount}`);
  console.log(`    Memories Stored:  ${diag.memoryCount}`);
  console.log('');
}

main().catch(console.error);
