/**
 * Tools Module
 *
 * Provides tool definitions and execution for the chat agent.
 * Tools enable file operations and command execution.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// ANSI colors for tool output
const ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bgGray: '\x1b[100m',
    white: '\x1b[37m'
};

/**
 * OpenAI-compatible tool definitions for API calls
 */
const OPENAI_TOOLS = [
    {
        type: "function",
        function: {
            name: "create_file",
            description: "Create a new file with the specified content. Creates parent directories if needed.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "File path relative to current directory"
                    },
                    content: {
                        type: "string",
                        description: "Content to write to the file"
                    }
                },
                required: ["path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read the contents of a file and return its text content.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "File path to read"
                    }
                },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "append_file",
            description: "Append content to the end of an existing file.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "File path to append to"
                    },
                    content: {
                        type: "string",
                        description: "Content to append"
                    }
                },
                required: ["path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "replace_text",
            description: "Replace text in a file. Can replace first occurrence or all occurrences.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "File path to modify"
                    },
                    search: {
                        type: "string",
                        description: "Text to search for"
                    },
                    replace: {
                        type: "string",
                        description: "Text to replace with"
                    },
                    all: {
                        type: "boolean",
                        description: "If true, replace all instances. Default: false (first only)"
                    }
                },
                required: ["path", "search", "replace"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "run_command",
            description: "Execute a shell command and return the output.",
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The command to execute"
                    },
                    cwd: {
                        type: "string",
                        description: "Working directory for the command (optional)"
                    }
                },
                required: ["command"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "read_pdf",
            description: "Extract text content from a PDF file.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Path to the PDF file"
                    },
                    pages: {
                        type: "string",
                        description: "Specific pages to extract, e.g., '1-3' or '1,3,5' (optional)"
                    }
                },
                required: ["path"]
            }
        }
    }
];

/**
 * Tool definitions for the system prompt (fallback for models without tool support)
 */
const TOOL_DEFINITIONS = `
## Available Tools

You have access to the following tools. To use a tool, wrap your tool call in XML tags like this:

<tool_call>
<tool>tool_name</tool>
<param_name>value</param_name>
</tool_call>

### Tools:

1. **create_file** - Create a new file with content
   Parameters:
   - path: File path (relative to current directory)
   - content: Content to write to the file
   
   Example:
   <tool_call>
   <tool>create_file</tool>
   <path>src/hello.js</path>
   <content>console.log('Hello World');</content>
   </tool_call>

2. **read_file** - Read the contents of a file
   Parameters:
   - path: File path to read
   
   Example:
   <tool_call>
   <tool>read_file</tool>
   <path>package.json</path>
   </tool_call>

3. **append_file** - Append content to the end of a file
   Parameters:
   - path: File path to append to
   - content: Content to append
   
   Example:
   <tool_call>
   <tool>append_file</tool>
   <path>log.txt</path>
   <content>New log entry</content>
   </tool_call>

4. **replace_text** - Replace text in a file
   Parameters:
   - path: File path to modify
   - search: Text to search for
   - replace: Text to replace with
   - all: (optional) "true" to replace all instances, default replaces first only
   
   Example:
   <tool_call>
   <tool>replace_text</tool>
   <path>config.json</path>
   <search>"debug": false</search>
   <replace>"debug": true</replace>
   </tool_call>

5. **run_command** - Execute a shell command
   Parameters:
   - command: The command to execute
   - cwd: (optional) Working directory for the command
   
   Example:
   <tool_call>
   <tool>run_command</tool>
   <command>npm test</command>
   </tool_call>

6. **read_pdf** - Extract text content from a PDF file
   Parameters:
   - path: Path to the PDF file
   - pages: (optional) Specific pages to extract, e.g., "1-3" or "1,3,5"
   
   Example:
   <tool_call>
   <tool>read_pdf</tool>
   <path>document.pdf</path>
   </tool_call>

When you need to perform an action, use the appropriate tool. Wait for the tool result before continuing.
`;

/**
 * Parse tool calls from LLM response
 * @param {string} text - LLM response text
 * @returns {Array} Array of parsed tool calls
 */
function parseToolCalls(text) {
    const toolCalls = [];
    const regex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
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
    
    return toolCalls;
}

/**
 * Tool executor class
 */
class ToolExecutor {
    constructor(options = {}) {
        this.workingDir = options.workingDir || process.cwd();
        this.homeDir = require('os').homedir();
        this.useColor = options.useColor !== false;
        this.onOutput = options.onOutput || console.log;
        this.maxFileSize = options.maxFileSize || 1024 * 1024; // 1MB limit
        this.commandTimeout = options.commandTimeout || 30000; // 30s timeout
        // Allow access to home directory files (for reading user's files)
        this.allowHomeDir = options.allowHomeDir !== false;
    }
    
    /**
     * Color helper
     */
    color(code, text) {
        if (!this.useColor) return text;
        return `${code}${text}${ANSI.reset}`;
    }
    
    /**
     * Resolve path - allows working directory, home directory, and absolute paths
     * But prevents dangerous traversal attacks
     */
    resolvePath(filePath, forWrite = false) {
        // Expand ~ to home directory
        let expandedPath = filePath;
        if (filePath.startsWith('~/') || filePath === '~') {
            expandedPath = path.join(this.homeDir, filePath.slice(1));
        }
        
        // Resolve to absolute path
        const resolved = path.resolve(this.workingDir, expandedPath);
        
        // Check if in working directory (always allowed)
        if (resolved.startsWith(this.workingDir)) {
            return resolved;
        }
        
        // Check if in home directory (allowed for reads if enabled)
        if (this.allowHomeDir && resolved.startsWith(this.homeDir)) {
            // For writes outside workdir, require explicit absolute path
            if (forWrite && !path.isAbsolute(filePath) && !filePath.startsWith('~')) {
                throw new Error(
                    `Write operations outside working directory require absolute paths.\n` +
                    `  Working directory: ${this.workingDir}\n` +
                    `  Use absolute path or ~ prefix to write to: ${resolved}`
                );
            }
            return resolved;
        }
        
        // Reject other paths (security)
        throw new Error(
            `Path not allowed: ${filePath}\n` +
            `  Resolved to: ${resolved}\n` +
            `  Allowed: ${this.workingDir} or ${this.homeDir}`
        );
    }
    
    /**
     * Execute a tool call
     * @param {Object} toolCall - Parsed tool call object
     * @returns {Promise<Object>} Result object
     */
    async execute(toolCall) {
        const startTime = Date.now();
        
        try {
            let result;
            
            switch (toolCall.tool) {
                case 'create_file':
                    result = await this.createFile(toolCall.path, toolCall.content);
                    break;
                case 'read_file':
                    result = await this.readFile(toolCall.path);
                    break;
                case 'append_file':
                    result = await this.appendFile(toolCall.path, toolCall.content);
                    break;
                case 'replace_text':
                    result = await this.replaceText(
                        toolCall.path, 
                        toolCall.search, 
                        toolCall.replace,
                        toolCall.all === 'true'
                    );
                    break;
                case 'run_command':
                    result = await this.runCommand(toolCall.command, toolCall.cwd);
                    break;
                case 'read_pdf':
                    result = await this.readPdf(toolCall.path, toolCall.pages);
                    break;
                default:
                    result = { success: false, error: `Unknown tool: ${toolCall.tool}` };
            }
            
            result.duration = Date.now() - startTime;
            return result;
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }
    
    /**
     * Create a new file
     */
    async createFile(filePath, content) {
        if (!filePath) throw new Error('Path is required');
        if (content === undefined) throw new Error('Content is required');
        
        const resolved = this.resolvePath(filePath, true); // forWrite = true
        const dir = path.dirname(resolved);
        
        // Create directory if needed
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Check if file exists
        const exists = fs.existsSync(resolved);
        
        fs.writeFileSync(resolved, content, 'utf-8');
        
        return {
            success: true,
            action: exists ? 'overwritten' : 'created',
            path: filePath,
            size: content.length,
            message: `${exists ? 'Overwrote' : 'Created'} file: ${filePath} (${content.length} bytes)`
        };
    }
    
    /**
     * Read file contents
     */
    async readFile(filePath) {
        if (!filePath) throw new Error('Path is required');
        
        const resolved = this.resolvePath(filePath);
        
        if (!fs.existsSync(resolved)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const stats = fs.statSync(resolved);
        if (stats.size > this.maxFileSize) {
            throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
        }
        
        const content = fs.readFileSync(resolved, 'utf-8');
        
        return {
            success: true,
            path: filePath,
            content,
            size: stats.size,
            lines: content.split('\n').length,
            message: `Read file: ${filePath} (${stats.size} bytes, ${content.split('\n').length} lines)`
        };
    }
    
    /**
     * Append to file
     */
    async appendFile(filePath, content) {
        if (!filePath) throw new Error('Path is required');
        if (content === undefined) throw new Error('Content is required');
        
        const resolved = this.resolvePath(filePath, true); // forWrite = true
        const exists = fs.existsSync(resolved);
        
        fs.appendFileSync(resolved, content, 'utf-8');
        
        return {
            success: true,
            path: filePath,
            appended: content.length,
            fileExisted: exists,
            message: `Appended ${content.length} bytes to: ${filePath}`
        };
    }
    
    /**
     * Replace text in file
     */
    async replaceText(filePath, search, replace, replaceAll = false) {
        if (!filePath) throw new Error('Path is required');
        if (!search) throw new Error('Search text is required');
        if (replace === undefined) throw new Error('Replace text is required');
        
        const resolved = this.resolvePath(filePath, true); // forWrite = true
        
        if (!fs.existsSync(resolved)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        let content = fs.readFileSync(resolved, 'utf-8');
        const originalContent = content;
        
        let count = 0;
        if (replaceAll) {
            // Count occurrences
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = content.match(regex);
            count = matches ? matches.length : 0;
            content = content.split(search).join(replace);
        } else {
            if (content.includes(search)) {
                content = content.replace(search, replace);
                count = 1;
            }
        }
        
        if (count > 0) {
            fs.writeFileSync(resolved, content, 'utf-8');
        }
        
        return {
            success: true,
            path: filePath,
            replacements: count,
            mode: replaceAll ? 'all' : 'first',
            message: count > 0 
                ? `Replaced ${count} occurrence(s) in: ${filePath}`
                : `No matches found for search text in: ${filePath}`
        };
    }
    
    /**
     * Run a shell command
     */
    async runCommand(command, cwd = null) {
        if (!command) throw new Error('Command is required');
        
        const workDir = cwd ? this.resolvePath(cwd) : this.workingDir;
        
        return new Promise((resolve) => {
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'cmd.exe' : '/bin/sh';
            const shellArg = isWindows ? '/c' : '-c';
            
            const child = spawn(shell, [shellArg, command], {
                cwd: workDir,
                env: process.env,
                timeout: this.commandTimeout
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                resolve({
                    success: false,
                    error: 'Command timed out',
                    command,
                    cwd: workDir,
                    stdout,
                    stderr
                });
            }, this.commandTimeout);
            
            child.on('close', (code) => {
                clearTimeout(timeout);
                resolve({
                    success: code === 0,
                    exitCode: code,
                    command,
                    cwd: workDir,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    message: code === 0 
                        ? `Command completed successfully`
                        : `Command exited with code ${code}`
                });
            });
            
            child.on('error', (err) => {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: err.message,
                    command,
                    cwd: workDir
                });
            });
        });
    }
    
    /**
     * Read PDF file and extract text
     */
    async readPdf(filePath, pages = null) {
        if (!filePath) throw new Error('Path is required');
        
        const resolved = this.resolvePath(filePath);
        
        if (!fs.existsSync(resolved)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        if (!filePath.toLowerCase().endsWith('.pdf')) {
            throw new Error('File must be a PDF');
        }
        
        const stats = fs.statSync(resolved);
        if (stats.size > 50 * 1024 * 1024) { // 50MB limit for PDFs
            throw new Error(`PDF too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: 50MB)`);
        }
        
        // Try different PDF extraction methods
        let content = null;
        let method = null;
        
        // Method 1: Try pdftotext (poppler-utils) - best quality
        try {
            let pdfArgs = ['-layout', `"${resolved}"`, '-'];
            if (pages) {
                // Parse pages like "1-3" or "1,3,5"
                if (pages.includes('-')) {
                    const [first, last] = pages.split('-');
                    pdfArgs = ['-f', first, '-l', last, '-layout', `"${resolved}"`, '-'];
                } else {
                    const firstPage = pages.split(',')[0];
                    pdfArgs = ['-f', firstPage, '-l', firstPage, '-layout', `"${resolved}"`, '-'];
                }
            }
            
            content = execSync(`pdftotext ${pdfArgs.join(' ')}`, {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024,
                timeout: 30000
            });
            method = 'pdftotext';
        } catch (e) {
            // pdftotext not available, try alternative
        }
        
        // Method 2: Try using strings command as fallback (basic text extraction)
        if (!content) {
            try {
                content = execSync(`strings "${resolved}"`, {
                    encoding: 'utf-8',
                    maxBuffer: 10 * 1024 * 1024,
                    timeout: 30000
                });
                // Filter out binary garbage
                content = content
                    .split('\n')
                    .filter(line => line.length > 3 && /[a-zA-Z]{3,}/.test(line))
                    .join('\n');
                method = 'strings (fallback)';
            } catch (e) {
                throw new Error(
                    'Could not read PDF. Install poppler-utils (pdftotext) for full PDF support: brew install poppler'
                );
            }
        }
        
        if (!content || content.trim().length === 0) {
            return {
                success: true,
                path: filePath,
                content: '',
                pages: pages || 'all',
                method,
                message: `PDF appears to be empty or contains only images: ${filePath}`
            };
        }
        
        // Clean up extracted text
        content = content
            .replace(/\f/g, '\n--- Page Break ---\n')  // Form feed to page break
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')  // Reduce excessive newlines
            .trim();
        
        const wordCount = content.split(/\s+/).length;
        const pageCount = (content.match(/--- Page Break ---/g) || []).length + 1;
        
        return {
            success: true,
            path: filePath,
            content,
            size: stats.size,
            wordCount,
            estimatedPages: pageCount,
            pagesRequested: pages || 'all',
            method,
            message: `Read PDF: ${filePath} (~${wordCount} words, ~${pageCount} pages, via ${method})`
        };
    }
    
    /**
     * Format tool result for display
     */
    formatResult(toolCall, result) {
        const lines = [];
        
        lines.push(this.color(ANSI.dim, '┌─ Tool: ') + 
                   this.color(ANSI.cyan + ANSI.bold, toolCall.tool));
        
        if (result.success) {
            lines.push(this.color(ANSI.green, '│ ✓ ') + result.message);
            
            // Show file content for read_file
            if (toolCall.tool === 'read_file' && result.content) {
                lines.push(this.color(ANSI.dim, '│'));
                const contentLines = result.content.split('\n').slice(0, 20);
                for (const line of contentLines) {
                    lines.push(this.color(ANSI.dim, '│ ') + line);
                }
                if (result.content.split('\n').length > 20) {
                    lines.push(this.color(ANSI.dim, '│ ... (' + 
                        (result.content.split('\n').length - 20) + ' more lines)'));
                }
            }
            
            // Show command output
            if (toolCall.tool === 'run_command') {
                if (result.stdout) {
                    lines.push(this.color(ANSI.dim, '│'));
                    const outputLines = result.stdout.split('\n').slice(0, 30);
                    for (const line of outputLines) {
                        lines.push(this.color(ANSI.dim, '│ ') + line);
                    }
                    if (result.stdout.split('\n').length > 30) {
                        lines.push(this.color(ANSI.dim, '│ ... (output truncated)'));
                    }
                }
                if (result.stderr) {
                    lines.push(this.color(ANSI.dim, '│ ') +
                               this.color(ANSI.yellow, 'stderr: ') + result.stderr);
                }
            }
            
            // Show PDF content preview
            if (toolCall.tool === 'read_pdf' && result.content) {
                lines.push(this.color(ANSI.dim, '│'));
                lines.push(this.color(ANSI.dim, '│ ') +
                           this.color(ANSI.cyan, `Method: ${result.method}`));
                lines.push(this.color(ANSI.dim, '│ ') +
                           this.color(ANSI.cyan, `Words: ~${result.wordCount}, Pages: ~${result.estimatedPages}`));
                lines.push(this.color(ANSI.dim, '│'));
                const contentLines = result.content.split('\n').slice(0, 15);
                for (const line of contentLines) {
                    lines.push(this.color(ANSI.dim, '│ ') + line.substring(0, 80));
                }
                if (result.content.split('\n').length > 15) {
                    lines.push(this.color(ANSI.dim, '│ ... (' +
                        (result.content.split('\n').length - 15) + ' more lines)'));
                }
            }
        } else {
            lines.push(this.color(ANSI.red, '│ ✗ Error: ') + result.error);
        }
        
        lines.push(this.color(ANSI.dim, '└─ ') + 
                   this.color(ANSI.dim, `(${result.duration}ms)`));
        
        return lines.join('\n');
    }
}

/**
 * Process LLM response for tool calls and execute them
 * @param {string} response - LLM response text
 * @param {ToolExecutor} executor - Tool executor instance
 * @returns {Promise<Object>} Processing result
 */
async function processToolCalls(response, executor) {
    const toolCalls = parseToolCalls(response);
    
    if (toolCalls.length === 0) {
        return { hasTools: false, results: [], cleanedResponse: response };
    }
    
    const results = [];
    let cleanedResponse = response;
    
    for (const toolCall of toolCalls) {
        const result = await executor.execute(toolCall);
        results.push({ toolCall, result });
        
        // Remove the tool call from response for cleaner display
        cleanedResponse = cleanedResponse.replace(toolCall.raw, '').trim();
    }
    
    return {
        hasTools: true,
        results,
        cleanedResponse
    };
}

/**
 * Execute a tool call from OpenAI format
 * @param {Object} toolCall - OpenAI format tool call
 * @param {ToolExecutor} executor - Tool executor instance
 * @returns {Promise<Object>} Result
 */
async function executeOpenAIToolCall(toolCall, executor) {
    const name = toolCall.function?.name || toolCall.name;
    let args = {};
    
    try {
        args = typeof toolCall.function?.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || toolCall.arguments || {};
    } catch (e) {
        return { success: false, error: 'Failed to parse tool arguments' };
    }
    
    return executor.execute({
        tool: name,
        ...args
    });
}

module.exports = {
    TOOL_DEFINITIONS,
    OPENAI_TOOLS,
    parseToolCalls,
    processToolCalls,
    executeOpenAIToolCall,
    ToolExecutor,
    ANSI
};