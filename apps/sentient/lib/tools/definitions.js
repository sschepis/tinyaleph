/**
 * Tool Definitions Module
 *
 * Static tool definitions for OpenAI-compatible APIs and system prompt fallback.
 */

// ANSI colors for tool output
export const ANSI = {
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
export const OPENAI_TOOLS = [
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
    },
    {
        type: "function",
        function: {
            name: "list_directory",
            description: "List files and directories in a given path. Returns file names, sizes, and types.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Directory path to list"
                    },
                    recursive: {
                        type: "boolean",
                        description: "If true, list recursively (default: false)"
                    },
                    pattern: {
                        type: "string",
                        description: "Optional glob pattern to filter files (e.g., '*.pdf', '*.md')"
                    }
                },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "summarize_file",
            description: "Read a file (text, PDF, etc.) and return a concise summary. Summaries are cached for faster repeat access. Use this instead of read_file when you only need to understand the content without full text.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Path to the file to summarize"
                    },
                    focus: {
                        type: "string",
                        description: "Optional focus area for the summary (e.g., 'technical details', 'main arguments', 'key findings')"
                    },
                    max_length: {
                        type: "number",
                        description: "Maximum summary length in words (default: 300)"
                    }
                },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "summarize_text",
            description: "Summarize a block of text content. Useful for condensing large text before further processing.",
            parameters: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "The text content to summarize"
                    },
                    focus: {
                        type: "string",
                        description: "Optional focus area for the summary"
                    },
                    max_length: {
                        type: "number",
                        description: "Maximum summary length in words (default: 300)"
                    }
                },
                required: ["content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ask_chaperone",
            description: "Query an external knowledge oracle (chaperone LLM) for factual information, verification, or complex reasoning. Use this when you need to verify facts, look up information you're uncertain about, or get a second opinion on a complex topic. The chaperone is more focused on accuracy than creativity.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The question or request to send to the chaperone"
                    },
                    context: {
                        type: "string",
                        description: "Optional context to help the chaperone understand the query better"
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "quantum_scan",
            description: "Scan a range of numbers for prime candidates using the Quantum Neural Network and Riemann Zeta waveforms.",
            parameters: {
                type: "object",
                properties: {
                    start: {
                        type: "number",
                        description: "Start of the range to scan"
                    },
                    end: {
                        type: "number",
                        description: "End of the range to scan"
                    }
                },
                required: ["start", "end"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "quantum_predict",
            description: "Predict the primality of a specific number using the Quantum Neural Network.",
            parameters: {
                type: "object",
                properties: {
                    number: {
                        type: "number",
                        description: "Number to check"
                    }
                },
                required: ["number"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "edit_file",
            description: "Intelligently edit a file using natural language instructions. The AI will analyze the file, determine what changes are needed, and apply precise search/replace patches. Use this for code modifications, refactoring, adding features, or fixing bugs. More precise than replace_text for complex changes.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Path to the file to edit"
                    },
                    instruction: {
                        type: "string",
                        description: "Natural language description of the changes to make (e.g., 'Add error handling to the main function', 'Refactor to use async/await')"
                    },
                    backup: {
                        type: "boolean",
                        description: "If true, create a .bak backup file before editing (default: false)"
                    }
                },
                required: ["path", "instruction"]
            }
        }
    }
];

/**
 * Tool definitions for the system prompt (fallback for models without tool support)
 */
export const TOOL_DEFINITIONS = `
## Available Tools

You have access to the following tools. To use a tool, wrap your tool call in XML tags like this:

<tool_call>
<tool>tool_name</tool>
<param_name>value</param_name>
</tool_call>

**IMPORTANT PATH RULES:**
- Always use FULL ABSOLUTE PATHS for all file operations
- Use ~ for home directory (e.g., ~/Documents/file.pdf, ~/Desktop/image.png)
- If user mentions a file without path, ASK for the full path or use the list_directory tool to find it
- Never use just a filename like "file.pdf" - always include the directory path

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

7. **list_directory** - List files and directories in a path
   Parameters:
   - path: Directory path to list
   - recursive: (optional) "true" to list recursively
   - pattern: (optional) Glob pattern to filter files (e.g., "*.pdf")
   
   Example:
   <tool_call>
   <tool>list_directory</tool>
   <path>/Users/username/Documents</path>
   </tool_call>

8. **summarize_file** - Read and summarize a file (faster than reading full content)
   Parameters:
   - path: Path to the file to summarize
   - focus: (optional) Focus area for summary (e.g., "technical details", "main arguments")
   - max_length: (optional) Maximum summary length in words (default: 300)
   
   Example:
   <tool_call>
   <tool>summarize_file</tool>
   <path>/path/to/large-document.pdf</path>
   <focus>key findings</focus>
   </tool_call>

9. **summarize_text** - Summarize provided text content
   Parameters:
   - content: The text to summarize
   - focus: (optional) Focus area for summary
   - max_length: (optional) Maximum summary length in words (default: 300)
   
   Example:
   <tool_call>
   <tool>summarize_text</tool>
   <content>Long text content here...</content>
   <focus>main arguments</focus>
   </tool_call>

10. **ask_chaperone** - Query an external knowledge oracle for facts or verification
   Parameters:
   - query: The question to ask the chaperone
   - context: (optional) Additional context to help with the query
   
   Example:
   <tool_call>
   <tool>ask_chaperone</tool>
   <query>What is the current stable version of Node.js?</query>
   </tool_call>

11. **edit_file** - Intelligently edit a file using natural language instructions
   Parameters:
   - path: Path to the file to edit
   - instruction: Natural language description of the changes (e.g., "Add error handling", "Refactor to async/await")
   - backup: (optional) "true" to create a .bak backup file before editing
   
   Example:
   <tool_call>
   <tool>edit_file</tool>
   <path>src/utils.js</path>
   <instruction>Add input validation to the parseConfig function</instruction>
   </tool_call>

**IMPORTANT**: Only use tools when the user EXPLICITLY asks you to perform file operations, read files, list directories, or run commands. Do NOT use tools for general greetings or questions. If the user just says "hello" or asks a question, respond conversationally without using any tools.

**Tip**: Use summarize_file for large documents instead of read_file. Summaries are cached, so repeated access is instant.
**Tip**: Use ask_chaperone when you need to verify facts or get information you're uncertain about.
**Tip**: Use edit_file for complex code changes - it's smarter than replace_text for multi-line edits.
`;
