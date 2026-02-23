#!/usr/bin/env node

import { createInterface } from 'node:readline';
import Agent from './lib/agent.js';

// Parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.llm = config.llm || {};
        config.llm.baseUrl = args[++i];
        break;
      case '--model':
        config.llm = config.llm || {};
        config.llm.model = args[++i];
        break;
      case '--temperature':
      case '--temp':
        config.llm = config.llm || {};
        config.llm.temperature = parseFloat(args[++i]);
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return config;
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════╗
║  TinyAleph Agentic System                    ║
║  Prime-Resonant Cognitive Middleware + LLM    ║
╚══════════════════════════════════════════════╝

Usage: node apps/agentic/index.js [options]

Options:
  --url <url>         LLM endpoint URL (default: http://localhost:1234/v1/chat/completions)
  --model <name>      Model name (default: local-model)
  --temperature <n>   Sampling temperature (default: 0.7)
  --help, -h          Show this help

Environment Variables:
  ALEPH_LLM_URL       LLM endpoint URL
  ALEPH_LLM_MODEL     Model name
  ALEPH_TEMPERATURE   Temperature

Special Commands:
  /stats              Show agent statistics
  /diagnostics        Show full cognitive diagnostics
  /reset              Reset agent state
  /quit, /exit        Exit
`);
}

async function main() {
  const config = parseArgs();
  
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  TinyAleph Agentic System                    ║');
  console.log('║  Prime-Resonant Cognitive Middleware + LLM    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();
  
  const agent = new Agent(config);
  
  // Show config
  console.log(`LLM: ${agent.config.llm.baseUrl}`);
  console.log(`Model: ${agent.config.llm.model}`);
  console.log(`Temperature: ${agent.config.llm.temperature}`);
  console.log(`Prime Count: ${agent.config.cognitive.primeCount}`);
  console.log();
  
  // Check LLM connectivity
  process.stdout.write('Checking LLM connectivity... ');
  try {
    const reachable = await agent.ping();
    if (reachable) {
      console.log('✓ Connected');
    } else {
      console.log('✗ Not reachable (will try anyway)');
    }
  } catch (e) {
    console.log('✗ Error:', e.message);
  }
  console.log();
  
  // Initialize cognitive state with a few ticks
  for (let i = 0; i < 10; i++) {
    agent.cognitive.tick();
  }
  console.log(`Cognitive state initialized (coherence=${agent.cognitive.coherence.toFixed(3)}, entropy=${agent.cognitive.entropy.toFixed(3)})`);
  console.log();
  console.log('Type your message or /help for commands. Press Ctrl+C to exit.');
  console.log();
  
  // REPL
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '🧠 > '
  });
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    // Handle special commands
    if (input.startsWith('/')) {
      const cmd = input.toLowerCase();
      
      if (cmd === '/quit' || cmd === '/exit') {
        console.log('\nGoodbye!');
        process.exit(0);
      }
      
      if (cmd === '/stats') {
        const stats = agent.getStats();
        console.log('\n📊 Agent Stats:');
        console.log(`  Turns: ${stats.turnCount}`);
        console.log(`  Total Tokens: ${stats.totalTokens}`);
        console.log(`  History: ${stats.historyLength} messages`);
        console.log(`  Memories: ${stats.cognitive.memoryCount}`);
        console.log(`  Coherence: ${stats.cognitive.coherence.toFixed(3)}`);
        console.log(`  Entropy: ${stats.cognitive.entropy.toFixed(3)}`);
        console.log(`  Tick Count: ${stats.cognitive.tickCount}`);
        console.log();
        rl.prompt();
        return;
      }
      
      if (cmd === '/diagnostics' || cmd === '/diag') {
        const diag = agent.cognitive.getDiagnostics();
        console.log('\n🔬 Full Diagnostics:');
        console.log(JSON.stringify(diag, null, 2));
        console.log();
        rl.prompt();
        return;
      }
      
      if (cmd === '/reset') {
        agent.reset();
        console.log('\n🔄 Agent state reset.');
        console.log();
        rl.prompt();
        return;
      }
      
      if (cmd === '/help') {
        showHelp();
        rl.prompt();
        return;
      }
      
      console.log(`Unknown command: ${cmd}. Type /help for available commands.`);
      rl.prompt();
      return;
    }
    
    // Process through agent
    console.log();
    process.stdout.write('🤔 Thinking...');
    
    try {
      const result = await agent.turn(input);
      
      // Clear "Thinking..."
      process.stdout.clearLine?.(0);
      process.stdout.cursorTo?.(0);
      
      // Show response
      console.log(`\n${result.response}`);
      
      // Show metadata bar
      const m = result.metadata;
      let metaLine = `\n  ⚡ coherence=${m.coherence.toFixed(3)} entropy=${m.entropy.toFixed(3)}`;
      metaLine += ` gate=${m.objectivityPassed ? '✓' : '✗'}(R=${m.objectivityR.toFixed(2)})`;
      if (m.toolsUsed.length > 0) {
        metaLine += ` tools=[${m.toolsUsed.join(',')}]`;
      }
      metaLine += ` turn=#${m.turnCount} mem=${m.memoryCount}`;
      console.log(metaLine);
      
    } catch (e) {
      process.stdout.clearLine?.(0);
      process.stdout.cursorTo?.(0);
      console.error(`\n❌ Error: ${e.message}`);
    }
    
    console.log();
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
