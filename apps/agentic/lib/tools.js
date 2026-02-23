/**
 * Tool Registry - defines tools available to the agent
 * Each tool has: name, description, parameters (JSON Schema), execute function
 */

const TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the given path',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' }
      },
      required: ['path']
    },
    async execute({ path }) {
      // Safety: prevent reading outside the working directory
      const pathMod = await import('node:path');
      const resolved = pathMod.resolve(path);
      const cwd = process.cwd();
      if (!resolved.startsWith(cwd + pathMod.sep) && resolved !== cwd) {
        return { success: false, error: `Cannot read outside working directory: ${path}` };
      }
      const fs = await import('node:fs/promises');
      try {
        const content = await fs.readFile(path, 'utf-8');
        return { success: true, content: content.substring(0, 10000) }; // Limit output
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file, creating it if it doesn\'t exist',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    },
    async execute({ path, content }) {
      // Safety: prevent writing outside the working directory
      const pathMod = await import('node:path');
      const resolved = pathMod.resolve(path);
      const cwd = process.cwd();
      if (!resolved.startsWith(cwd + pathMod.sep) && resolved !== cwd) {
        return { success: false, error: `Cannot write outside working directory: ${path}` };
      }
      const fs = await import('node:fs/promises');
      try {
        await fs.writeFile(path, content, 'utf-8');
        return { success: true, message: `Wrote ${content.length} chars to ${path}` };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
        recursive: { type: 'boolean', description: 'List recursively', default: false }
      },
      required: ['path']
    },
    async execute({ path, recursive = false }) {
      const fs = await import('node:fs/promises');
      const pathMod = await import('node:path');
      // Safety: prevent listing outside the working directory
      const resolved = pathMod.resolve(path);
      const cwd = process.cwd();
      if (!resolved.startsWith(cwd + pathMod.sep) && resolved !== cwd) {
        return { success: false, error: `Cannot list outside working directory: ${path}` };
      }
      try {
        if (recursive) {
          const results = [];
          async function walk(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              const full = pathMod.join(dir, entry.name);
              if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                  await walk(full);
                }
              } else {
                results.push(full);
              }
            }
          }
          await walk(path);
          return { success: true, files: results.slice(0, 200) };
        } else {
          const entries = await fs.readdir(path, { withFileTypes: true });
          const files = entries.map(e => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file'
          }));
          return { success: true, files };
        }
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'run_command',
    description: 'Execute a shell command and return the output',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory (optional)' }
      },
      required: ['command']
    },
    async execute({ command, cwd }) {
      // Safety: block dangerous command patterns
      // Denylist for common destructive or exfiltration patterns
      const BLOCKED = [
        /rm\s+-r/i,                       // rm -r, rm -rf, rm -Rf, etc.
        /mkfs/i,                          // filesystem formatting
        /dd\s+if=/i,                      // raw disk operations
        />\s*\/etc\//,                     // overwrite system files
        /curl.*\|\s*(sh|bash|zsh)/i,      // pipe-to-shell
        /wget.*\|\s*(sh|bash|zsh)/i,      // pipe-to-shell
        /\|\s*(sh|bash|zsh)\b/,           // any pipe to shell interpreter
        /\bsudo\b/,                       // privilege escalation
        /\bchmod\s+[0-7]*[2367]/,         // making files world-writable
        /\bchown\b/,                      // ownership changes
        /\beval\b/,                       // eval execution
        /\bbase64\b.*\|\s*(sh|bash|zsh)/, // base64-decode-to-shell
        /;\s*rm\b/,                       // command chaining with rm
        /&&\s*rm\b/,                      // command chaining with rm
      ];
      if (BLOCKED.some(p => p.test(command))) {
        return { success: false, error: 'Command blocked by safety filter' };
      }
      // Safety: restrict cwd to within the working directory
      if (cwd) {
        const pathMod = await import('node:path');
        const resolvedCwd = pathMod.resolve(cwd);
        const processCwd = process.cwd();
        if (!resolvedCwd.startsWith(processCwd + pathMod.sep) && resolvedCwd !== processCwd) {
          return { success: false, error: `Cannot run commands outside working directory: ${cwd}` };
        }
      }
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);
      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: cwd || process.cwd(),
          timeout: 30000,
          maxBuffer: 1024 * 1024
        });
        return {
          success: true,
          stdout: stdout.substring(0, 5000),
          stderr: stderr.substring(0, 2000)
        };
      } catch (e) {
        return {
          success: false,
          error: e.message,
          stdout: e.stdout?.substring(0, 2000) || '',
          stderr: e.stderr?.substring(0, 2000) || ''
        };
      }
    }
  },
  {
    name: 'cognitive_state',
    description: 'Get your current cognitive state including coherence, entropy, and oscillator synchronization',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    async execute(params, { cognitive }) {
      // This tool gets injected with the cognitive core
      if (!cognitive) return { success: false, error: 'No cognitive core available' };
      return { success: true, state: cognitive.getDiagnostics() };
    }
  },
  {
    name: 'recall_memory',
    description: 'Search your memory for relevant past interactions',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 5)' }
      },
      required: ['query']
    },
    async execute({ query, limit = 5 }, { cognitive }) {
      if (!cognitive) return { success: false, error: 'No cognitive core available' };
      const memories = cognitive.recall(query, limit);
      return {
        success: true,
        memories: memories.map(m => ({
          input: m.input,
          output: m.output,
          coherence: m.coherence,
          age: Date.now() - m.timestamp
        }))
      };
    }
  }
];

/**
 * Returns tool definitions in OpenAI function-calling format
 * (name, description, parameters only — no execute function)
 * @returns {Array<{name: string, description: string, parameters: object}>}
 */
export function getToolDefinitions() {
  return TOOLS.map(({ name, description, parameters }) => ({
    name,
    description,
    parameters
  }));
}

/**
 * Find a tool by name and execute it
 * @param {string} name - Tool name
 * @param {object} params - Parameters to pass to the tool
 * @param {object} context - Context object (e.g. { cognitive }) for tools that need it
 * @returns {Promise<object>} Tool execution result
 */
export async function executeTool(name, params, context = {}) {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` };
  }
  try {
    return await tool.execute(params || {}, context);
  } catch (e) {
    return { success: false, error: `Tool execution error: ${e.message}` };
  }
}

export { TOOLS };
