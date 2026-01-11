/**
 * Centralized Error Handling for TinyAleph
 *
 * Provides a unified error handling system with:
 * - Error categorization and classification
 * - Automatic retry logic for transient errors
 * - Error aggregation and reporting
 * - User-friendly error messages
 * - Async error boundary wrappers
 *
 * Browser-compatible: No Node.js-specific dependencies.
 * Extracted from apps/sentient/lib/error-handler.js for library reuse.
 */

// Simple EventEmitter that works in both browser and Node.js

class SimpleEventEmitter {
    constructor() {
        this._events = new Map();
    }
    
    on(event, listener) {
        if (!this._events.has(event)) {
            this._events.set(event, []);
        }
        this._events.get(event).push(listener);
        return this;
    }
    
    off(event, listener) {
        if (!this._events.has(event)) return this;
        const listeners = this._events.get(event);
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
        return this;
    }
    
    emit(event, ...args) {
        if (!this._events.has(event)) return false;
        for (const listener of this._events.get(event)) {
            listener(...args);
        }
        return true;
    }
    
    removeAllListeners(event) {
        if (event) {
            this._events.delete(event);
        } else {
            this._events.clear();
        }
        return this;
    }
}

// ============================================================================
// LOG LEVELS
// ============================================================================

const LogLevel = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
    SILENT: 6
};

const LogLevelNames = Object.fromEntries(
    Object.entries(LogLevel).map(([k, v]) => [v, k])
);

// ============================================================================
// ERROR CATEGORIES
// ============================================================================

const ErrorCategory = {
    NETWORK: 'network',           // Network/transport errors
    AUTHENTICATION: 'auth',       // Auth/credential errors
    VALIDATION: 'validation',     // Input validation errors
    RESOURCE: 'resource',         // Resource not found/unavailable
    PERMISSION: 'permission',     // Permission denied
    TIMEOUT: 'timeout',           // Operation timeouts
    RATE_LIMIT: 'rate_limit',     // Rate limiting
    INTERNAL: 'internal',         // Internal/unexpected errors
    EXTERNAL: 'external',         // External service errors
    USER: 'user',                 // User-caused errors
    CONFIGURATION: 'config',      // Configuration errors
    LLM: 'llm',                   // LLM-specific errors
    MEMORY: 'memory',             // Memory/state errors
    OSCILLATOR: 'oscillator'      // Oscillator/dynamics errors
};

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base error class with category and metadata
 */
class AlephError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'AlephError';
        this.category = options.category || ErrorCategory.INTERNAL;
        this.code = options.code || 'UNKNOWN_ERROR';
        this.retryable = options.retryable ?? false;
        this.metadata = options.metadata || {};
        this.originalError = options.cause || null;
        this.timestamp = Date.now();
        this.userMessage = options.userMessage || this.getDefaultUserMessage();
        
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AlephError);
        }
    }
    
    getDefaultUserMessage() {
        switch (this.category) {
            case ErrorCategory.NETWORK:
                return 'Network connection error. Please check your connection.';
            case ErrorCategory.AUTHENTICATION:
                return 'Authentication failed. Please check your credentials.';
            case ErrorCategory.RATE_LIMIT:
                return 'Too many requests. Please wait a moment.';
            case ErrorCategory.TIMEOUT:
                return 'Operation timed out. Please try again.';
            case ErrorCategory.LLM:
                return 'AI service error. Please try again later.';
            default:
                return 'An unexpected error occurred.';
        }
    }
    
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            category: this.category,
            code: this.code,
            retryable: this.retryable,
            metadata: this.metadata,
            userMessage: this.userMessage,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Network-related errors
 */
class NetworkError extends AlephError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            category: ErrorCategory.NETWORK,
            retryable: options.retryable ?? true
        });
        this.name = 'NetworkError';
        this.statusCode = options.statusCode;
    }
}

/**
 * LLM-related errors
 */
class LLMError extends AlephError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            category: ErrorCategory.LLM
        });
        this.name = 'LLMError';
        this.provider = options.provider;
        this.model = options.model;
    }
}

/**
 * Validation errors
 */
class ValidationError extends AlephError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            category: ErrorCategory.VALIDATION,
            retryable: false
        });
        this.name = 'ValidationError';
        this.fields = options.fields || [];
    }
}

/**
 * Timeout errors
 */
class TimeoutError extends AlephError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            category: ErrorCategory.TIMEOUT,
            retryable: true
        });
        this.name = 'TimeoutError';
        this.timeout = options.timeout;
        this.operation = options.operation;
    }
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Centralized Error Handler
 */
class ErrorHandler extends SimpleEventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = options.logger || null;
        
        // Error aggregation
        this.errors = [];
        this.maxErrors = options.maxErrors || 1000;
        
        // Error rate tracking
        this.errorRates = new Map(); // category -> count in window
        this.rateWindow = options.rateWindow || 60000; // 1 minute
        
        // User message handlers
        this.userMessageHandlers = new Map();
        
        // Recovery handlers
        this.recoveryHandlers = new Map();
        
        // Setup default handlers
        this.setupDefaultHandlers();
    }
    
    /**
     * Set the logger instance
     * @param {Object} logger - Logger instance with error(), warn(), info() methods
     */
    setLogger(logger) {
        this.logger = logger;
    }
    
    setupDefaultHandlers() {
        // Register recovery handlers for retryable errors
        this.registerRecoveryHandler(ErrorCategory.NETWORK, async (error, context) => {
            // Default: wait and retry
            await new Promise(r => setTimeout(r, 1000));
            return { retry: true };
        });
        
        this.registerRecoveryHandler(ErrorCategory.RATE_LIMIT, async (error, context) => {
            // Wait for rate limit reset
            const waitTime = error.metadata?.retryAfter || 5000;
            await new Promise(r => setTimeout(r, waitTime));
            return { retry: true };
        });
    }
    
    /**
     * Handle an error
     * @param {Error} error - Error to handle
     * @param {Object} context - Error context
     * @returns {Object} Handler result
     */
    async handle(error, context = {}) {
        // Normalize to AlephError
        const alephError = this.normalize(error);
        
        // Log the error
        if (this.logger) {
            this.logger.error(alephError.message, {
                category: alephError.category,
                code: alephError.code,
                retryable: alephError.retryable,
                metadata: alephError.metadata,
                stack: alephError.stack
            });
        }
        
        // Record error
        this.recordError(alephError);
        
        // Update error rate
        this.updateErrorRate(alephError.category);
        
        // Emit event
        this.emit('error', alephError, context);
        
        // Try recovery if retryable
        if (alephError.retryable && context.canRetry !== false) {
            const recovery = await this.attemptRecovery(alephError, context);
            if (recovery.retry) {
                return { handled: true, retry: true, error: alephError };
            }
        }
        
        return {
            handled: true,
            retry: false,
            error: alephError,
            userMessage: alephError.userMessage
        };
    }
    
    /**
     * Normalize any error to AlephError
     * @param {Error} error - Error to normalize
     * @returns {AlephError}
     */
    normalize(error) {
        if (error instanceof AlephError) {
            return error;
        }
        
        // Classify based on error properties
        let category = ErrorCategory.INTERNAL;
        let retryable = false;
        let code = 'UNKNOWN_ERROR';
        
        // Check for network errors
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
            error.code === 'ECONNRESET' || error.message.includes('network')) {
            category = ErrorCategory.NETWORK;
            retryable = true;
            code = error.code || 'NETWORK_ERROR';
        }
        
        // Check for timeout errors
        if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT' ||
            error.message.includes('timeout')) {
            category = ErrorCategory.TIMEOUT;
            retryable = true;
            code = 'TIMEOUT';
        }
        
        // Check for rate limit errors
        if (error.status === 429 || error.message.includes('rate limit')) {
            category = ErrorCategory.RATE_LIMIT;
            retryable = true;
            code = 'RATE_LIMITED';
        }
        
        // Check for auth errors
        if (error.status === 401 || error.status === 403 ||
            error.message.includes('unauthorized') || error.message.includes('forbidden')) {
            category = ErrorCategory.AUTHENTICATION;
            code = 'AUTH_FAILED';
        }
        
        return new AlephError(error.message, {
            category,
            code,
            retryable,
            cause: error,
            metadata: { originalName: error.name, originalCode: error.code }
        });
    }
    
    /**
     * Record error for aggregation
     * @param {AlephError} error - Error to record
     */
    recordError(error) {
        this.errors.push({
            ...error.toJSON(),
            handledAt: Date.now()
        });
        
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
    }
    
    /**
     * Update error rate tracking
     * @param {string} category - Error category
     */
    updateErrorRate(category) {
        const now = Date.now();
        const key = `${category}:${Math.floor(now / this.rateWindow)}`;
        
        this.errorRates.set(key, (this.errorRates.get(key) || 0) + 1);
        
        // Clean old windows
        for (const [k] of this.errorRates) {
            const windowTime = parseInt(k.split(':')[1]) * this.rateWindow;
            if (now - windowTime > this.rateWindow * 2) {
                this.errorRates.delete(k);
            }
        }
    }
    
    /**
     * Get current error rate for a category
     * @param {string} category - Error category
     * @returns {number}
     */
    getErrorRate(category) {
        const now = Date.now();
        const currentWindow = Math.floor(now / this.rateWindow);
        const key = `${category}:${currentWindow}`;
        return this.errorRates.get(key) || 0;
    }
    
    /**
     * Register a recovery handler for a category
     * @param {string} category - Error category
     * @param {Function} handler - Recovery handler
     */
    registerRecoveryHandler(category, handler) {
        this.recoveryHandlers.set(category, handler);
    }
    
    /**
     * Attempt recovery for an error
     * @param {AlephError} error - Error to recover from
     * @param {Object} context - Error context
     * @returns {Promise<Object>}
     */
    async attemptRecovery(error, context) {
        const handler = this.recoveryHandlers.get(error.category);
        
        if (!handler) {
            return { retry: false };
        }
        
        try {
            return await handler(error, context);
        } catch (recoveryError) {
            if (this.logger) {
                this.logger.warn('Recovery failed', { 
                    originalError: error.code,
                    recoveryError: recoveryError.message 
                });
            }
            return { retry: false };
        }
    }
    
    /**
     * Get error statistics
     * @returns {Object}
     */
    getStats() {
        const categories = {};
        for (const error of this.errors) {
            categories[error.category] = (categories[error.category] || 0) + 1;
        }
        
        return {
            totalErrors: this.errors.length,
            byCategory: categories,
            recentErrors: this.errors.slice(-10),
            errorRates: Object.fromEntries(this.errorRates)
        };
    }
}

// ============================================================================
// ASYNC WRAPPERS
// ============================================================================

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {ErrorHandler} handler - Error handler
 * @param {Object} options - Options
 * @returns {Function}
 */
function withErrorHandling(fn, handler, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const context = options.context || {};
    
    return async function(...args) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                lastError = error;
                
                const result = await handler.handle(error, {
                    ...context,
                    attempt,
                    maxRetries,
                    canRetry: attempt < maxRetries
                });
                
                if (!result.retry) {
                    throw handler.normalize(error);
                }
                
                // Apply backoff
                const backoff = options.backoff || ((a) => Math.pow(2, a) * 100);
                await new Promise(r => setTimeout(r, backoff(attempt)));
            }
        }
        
        throw handler.normalize(lastError);
    };
}

/**
 * Create an async error boundary
 * @param {Function} fn - Async function
 * @param {Object} options - Options
 * @returns {Promise}
 */
async function errorBoundary(fn, options = {}) {
    const handler = options.handler;
    const fallback = options.fallback;
    
    if (!handler) {
        throw new Error('errorBoundary requires an error handler');
    }
    
    try {
        return await fn();
    } catch (error) {
        const result = await handler.handle(error, options.context);
        
        if (fallback !== undefined) {
            return typeof fallback === 'function' ? fallback(error) : fallback;
        }
        
        throw result.error;
    }
}

/**
 * Wrap a promise with timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeout - Timeout in ms
 * @param {string} operation - Operation name
 * @returns {Promise}
 */
function withTimeout(promise, timeout, operation = 'operation') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new TimeoutError(`${operation} timed out after ${timeout}ms`, {
                    timeout,
                    operation
                }));
            }, timeout);
        })
    ]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    LogLevel,
    LogLevelNames,
    ErrorCategory,
    AlephError,
    NetworkError,
    LLMError,
    ValidationError,
    TimeoutError,
    SimpleEventEmitter,
    ErrorHandler,
    withErrorHandling,
    errorBoundary,
    withTimeout
};