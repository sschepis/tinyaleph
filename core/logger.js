/**
 * Structured Logger for TinyAleph
 * 
 * Provides structured logging with:
 * - Multiple log levels (TRACE through FATAL)
 * - JSON and text output formats
 * - Child logger namespaces
 * - Log history for analysis
 * - Event emission for log aggregation
 * 
 * Browser-compatible: Uses console API instead of Node.js streams.
 * Extracted from apps/sentient/lib/error-handler.js for library reuse.
 */

// ============================================================================
// LOGGER
// ============================================================================

/**
 * Structured Logger
 */
import { LogLevel, LogLevelNames, SimpleEventEmitter } from './errors.js';

class Logger extends SimpleEventEmitter {
    constructor(options = {}) {
        super();
        
        this.name = options.name || 'aleph';
        this.level = options.level ?? LogLevel.INFO;
        this.format = options.format || 'text'; // text, json
        this.colorize = options.colorize ?? true;
        this.includeTimestamp = options.includeTimestamp ?? true;
        this.includeLevel = options.includeLevel ?? true;
        
        // Custom output functions (defaults to console)
        this.output = options.output || {
            log: (...args) => console.log(...args),
            error: (...args) => console.error(...args),
            warn: (...args) => console.warn(...args),
            info: (...args) => console.info(...args),
            debug: (...args) => console.debug(...args)
        };
        
        // Log history for error aggregation
        this.history = [];
        this.maxHistory = options.maxHistory || 1000;
        
        // Child loggers
        this.children = new Map();
        
        // Colors (browser console supports CSS, Node uses ANSI)
        this.isBrowser = typeof window !== 'undefined';
        this.ansiColors = {
            trace: '\x1b[90m',
            debug: '\x1b[36m',
            info: '\x1b[32m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            fatal: '\x1b[35m',
            reset: '\x1b[0m'
        };
        this.cssColors = {
            trace: 'color: #888',
            debug: 'color: #0aa',
            info: 'color: #0a0',
            warn: 'color: #aa0',
            error: 'color: #a00',
            fatal: 'color: #a0a'
        };
    }
    
    /**
     * Create a child logger with a specific namespace
     * @param {string} namespace - Child namespace
     * @returns {Logger}
     */
    child(namespace) {
        if (this.children.has(namespace)) {
            return this.children.get(namespace);
        }
        
        const child = new Logger({
            name: `${this.name}:${namespace}`,
            level: this.level,
            format: this.format,
            colorize: this.colorize,
            output: this.output
        });
        
        // Forward events to parent
        child.on('log', (entry) => {
            this.history.push(entry);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
            this.emit('log', entry);
        });
        
        this.children.set(namespace, child);
        return child;
    }
    
    /**
     * Log at a specific level
     * @param {number} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     */
    log(level, message, data = {}) {
        if (level < this.level) return;
        
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevelNames[level].toLowerCase(),
            name: this.name,
            message,
            data: Object.keys(data).length > 0 ? data : undefined
        };
        
        // Add to history
        this.history.push(entry);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        // Format and output
        this.writeOutput(entry, level);
        
        // Emit event
        this.emit('log', entry);
        
        return entry;
    }
    
    /**
     * Write log entry to output
     * @param {Object} entry - Log entry
     * @param {number} level - Log level number
     */
    writeOutput(entry, level) {
        if (this.format === 'json') {
            const output = JSON.stringify(entry);
            if (level >= LogLevel.ERROR) {
                this.output.error(output);
            } else {
                this.output.log(output);
            }
            return;
        }
        
        // Text format
        if (this.isBrowser && this.colorize) {
            this.writeBrowserColorized(entry, level);
        } else if (this.colorize) {
            this.writeAnsiColorized(entry, level);
        } else {
            this.writePlain(entry, level);
        }
    }
    
    /**
     * Write colorized output for browser console
     */
    writeBrowserColorized(entry, level) {
        const parts = [];
        const styles = [];
        
        if (this.includeTimestamp) {
            parts.push(`%c[${entry.timestamp}]`);
            styles.push('color: #666');
        }
        
        if (this.includeLevel) {
            const levelStr = entry.level.toUpperCase().padEnd(5);
            parts.push(`%c${levelStr}`);
            styles.push(this.cssColors[entry.level] || '');
        }
        
        parts.push(`%c[${entry.name}]`);
        styles.push('color: #888');
        
        parts.push(`%c${entry.message}`);
        styles.push('color: inherit');
        
        const formatStr = parts.join(' ');
        const args = [formatStr, ...styles];
        
        if (entry.data) {
            args.push(entry.data);
        }
        
        if (level >= LogLevel.ERROR) {
            this.output.error(...args);
        } else if (level >= LogLevel.WARN) {
            this.output.warn(...args);
        } else if (level >= LogLevel.INFO) {
            this.output.info(...args);
        } else {
            this.output.debug(...args);
        }
    }
    
    /**
     * Write ANSI colorized output for Node.js terminal
     */
    writeAnsiColorized(entry, level) {
        const parts = [];
        
        if (this.includeTimestamp) {
            parts.push(`[${entry.timestamp}]`);
        }
        
        if (this.includeLevel) {
            const levelStr = entry.level.toUpperCase().padEnd(5);
            const color = this.ansiColors[entry.level] || '';
            parts.push(`${color}${levelStr}${this.ansiColors.reset}`);
        }
        
        parts.push(`[${entry.name}]`);
        parts.push(entry.message);
        
        if (entry.data) {
            parts.push(JSON.stringify(entry.data));
        }
        
        const output = parts.join(' ');
        
        if (level >= LogLevel.ERROR) {
            this.output.error(output);
        } else {
            this.output.log(output);
        }
    }
    
    /**
     * Write plain text output
     */
    writePlain(entry, level) {
        const parts = [];
        
        if (this.includeTimestamp) {
            parts.push(`[${entry.timestamp}]`);
        }
        
        if (this.includeLevel) {
            parts.push(entry.level.toUpperCase().padEnd(5));
        }
        
        parts.push(`[${entry.name}]`);
        parts.push(entry.message);
        
        if (entry.data) {
            parts.push(JSON.stringify(entry.data));
        }
        
        const output = parts.join(' ');
        
        if (level >= LogLevel.ERROR) {
            this.output.error(output);
        } else {
            this.output.log(output);
        }
    }
    
    // Convenience methods
    trace(message, data) { return this.log(LogLevel.TRACE, message, data); }
    debug(message, data) { return this.log(LogLevel.DEBUG, message, data); }
    info(message, data) { return this.log(LogLevel.INFO, message, data); }
    warn(message, data) { return this.log(LogLevel.WARN, message, data); }
    error(message, data) { return this.log(LogLevel.ERROR, message, data); }
    fatal(message, data) { return this.log(LogLevel.FATAL, message, data); }
    
    /**
     * Set log level
     * @param {number|string} level - New level
     */
    setLevel(level) {
        if (typeof level === 'string') {
            this.level = LogLevel[level.toUpperCase()] ?? LogLevel.INFO;
        } else {
            this.level = level;
        }
    }
    
    /**
     * Get recent log entries
     * @param {number} count - Number of entries
     * @param {string} level - Optional level filter
     * @returns {Array}
     */
    getRecent(count = 100, level = null) {
        let entries = this.history.slice(-count);
        if (level) {
            entries = entries.filter(e => e.level === level);
        }
        return entries;
    }
    
    /**
     * Get error summary
     * @returns {Object}
     */
    getErrorSummary() {
        const errors = this.history.filter(e => e.level === 'error' || e.level === 'fatal');
        const categories = {};
        
        for (const error of errors) {
            const cat = error.data?.category || 'unknown';
            categories[cat] = (categories[cat] || 0) + 1;
        }
        
        return {
            totalErrors: errors.length,
            byCategory: categories,
            recentErrors: errors.slice(-10)
        };
    }
    
    /**
     * Clear log history
     */
    clearHistory() {
        this.history = [];
    }
}

/**
 * Create a namespaced logger
 * @param {string} namespace - Logger namespace
 * @param {Object} options - Logger options
 * @returns {Logger}
 */
function createLogger(namespace, options = {}) {
    return new Logger({
        name: namespace,
        ...options
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    Logger,
    createLogger,
    LogLevel,
    LogLevelNames
};

// Default export for compatibility with modular.js
export default {
    Logger,
    createLogger,
    LogLevel,
    LogLevelNames
};