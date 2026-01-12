/**
 * Transport Layer for TinyAleph
 * 
 * Provides browser-compatible transport mechanisms:
 * - WebSocketTransport: Full-duplex communication via WebSocket
 * - SSETransport: Server-Sent Events for server push
 * - MemoryTransport: In-memory transport for testing
 * - PollingTransport: HTTP polling fallback
 * 
 * Browser-compatible: Uses native WebSocket and EventSource APIs.
 * Extracted from apps/sentient/lib/transport/index.js for library reuse.
 */

import { SimpleEventEmitter } from '../core/errors.js';

// ============================================================================
// TRANSPORT STATE
// ============================================================================

const TransportState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    CLOSED: 'closed'
};

// ============================================================================
// BASE TRANSPORT
// ============================================================================

/**
 * Base transport class - all transports extend this
 */
class Transport extends SimpleEventEmitter {
    constructor(options = {}) {
        super();
        this.state = TransportState.DISCONNECTED;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.reconnectBackoff = options.reconnectBackoff || 1.5;
        this.maxReconnectDelay = options.maxReconnectDelay || 30000;
        this._currentReconnectDelay = this.reconnectDelay;
    }
    
    /**
     * Connect to the transport
     * @returns {Promise<void>}
     */
    async connect() {
        throw new Error('connect() must be implemented');
    }
    
    /**
     * Disconnect from the transport
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('disconnect() must be implemented');
    }
    
    /**
     * Send a message
     * @param {*} message - Message to send
     * @returns {Promise<void>}
     */
    async send(message) {
        throw new Error('send() must be implemented');
    }
    
    /**
     * Check if transport is connected
     * @returns {boolean}
     */
    isConnected() {
        return this.state === TransportState.CONNECTED;
    }
    
    /**
     * Get current state
     * @returns {string}
     */
    getState() {
        return this.state;
    }
    
    /**
     * Set transport state
     * @param {string} state - New state
     */
    setState(state) {
        const oldState = this.state;
        this.state = state;
        this.emit('stateChange', { from: oldState, to: state });
    }
    
    /**
     * Calculate reconnect delay with exponential backoff
     * @returns {number}
     */
    getReconnectDelay() {
        const delay = this._currentReconnectDelay;
        this._currentReconnectDelay = Math.min(
            this._currentReconnectDelay * this.reconnectBackoff,
            this.maxReconnectDelay
        );
        return delay;
    }
    
    /**
     * Reset reconnect state
     */
    resetReconnect() {
        this.reconnectAttempts = 0;
        this._currentReconnectDelay = this.reconnectDelay;
    }
    
    /**
     * Attempt reconnection
     * @returns {Promise<boolean>}
     */
    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('maxReconnectAttemptsReached');
            return false;
        }
        
        this.setState(TransportState.RECONNECTING);
        this.reconnectAttempts++;
        
        const delay = this.getReconnectDelay();
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            await this.connect();
            this.resetReconnect();
            return true;
        } catch (error) {
            this.emit('reconnectFailed', { attempt: this.reconnectAttempts, error });
            return false;
        }
    }
}

// ============================================================================
// WEBSOCKET TRANSPORT
// ============================================================================

/**
 * WebSocket transport for full-duplex communication
 */
class WebSocketTransport extends Transport {
    constructor(url, options = {}) {
        super(options);
        this.url = url;
        this.protocols = options.protocols || [];
        this.socket = null;
        this.messageQueue = [];
        this.pingInterval = options.pingInterval || 30000;
        this.pingTimer = null;
    }
    
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.setState(TransportState.CONNECTING);
                
                // Use native WebSocket (works in browser and Node.js 22+)
                const WebSocketImpl = typeof WebSocket !== 'undefined' 
                    ? WebSocket 
                    : (typeof global !== 'undefined' && global.WebSocket) || null;
                
                if (!WebSocketImpl) {
                    throw new Error('WebSocket not available in this environment');
                }
                
                this.socket = new WebSocketImpl(this.url, this.protocols);
                
                this.socket.onopen = () => {
                    this.setState(TransportState.CONNECTED);
                    this.resetReconnect();
                    this.startPing();
                    this.flushQueue();
                    this.emit('connected');
                    resolve();
                };
                
                this.socket.onclose = (event) => {
                    this.stopPing();
                    this.setState(TransportState.DISCONNECTED);
                    this.emit('disconnected', { code: event.code, reason: event.reason });
                    
                    if (!event.wasClean && this.state !== TransportState.CLOSED) {
                        this.attemptReconnect();
                    }
                };
                
                this.socket.onerror = (error) => {
                    this.emit('error', error);
                    if (this.state === TransportState.CONNECTING) {
                        reject(error);
                    }
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const message = typeof event.data === 'string' 
                            ? JSON.parse(event.data) 
                            : event.data;
                        this.emit('message', message);
                    } catch (error) {
                        this.emit('error', { type: 'parseError', error, data: event.data });
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async disconnect() {
        this.setState(TransportState.CLOSED);
        this.stopPing();
        
        if (this.socket) {
            this.socket.close(1000, 'Normal closure');
            this.socket = null;
        }
    }
    
    async send(message) {
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        
        if (this.isConnected() && this.socket) {
            this.socket.send(data);
        } else {
            this.messageQueue.push(data);
        }
    }
    
    flushQueue() {
        while (this.messageQueue.length > 0 && this.isConnected()) {
            const message = this.messageQueue.shift();
            this.socket.send(message);
        }
    }
    
    startPing() {
        this.stopPing();
        this.pingTimer = setInterval(() => {
            if (this.isConnected()) {
                this.send({ type: 'ping', timestamp: Date.now() });
            }
        }, this.pingInterval);
    }
    
    stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
}

// ============================================================================
// SSE TRANSPORT
// ============================================================================

/**
 * Server-Sent Events transport for server push
 */
class SSETransport extends Transport {
    constructor(url, options = {}) {
        super(options);
        this.url = url;
        this.eventSource = null;
        this.withCredentials = options.withCredentials || false;
    }
    
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.setState(TransportState.CONNECTING);
                
                // Use native EventSource (works in browser)
                const EventSourceImpl = typeof EventSource !== 'undefined' 
                    ? EventSource 
                    : null;
                
                if (!EventSourceImpl) {
                    throw new Error('EventSource not available in this environment');
                }
                
                this.eventSource = new EventSourceImpl(this.url, {
                    withCredentials: this.withCredentials
                });
                
                this.eventSource.onopen = () => {
                    this.setState(TransportState.CONNECTED);
                    this.resetReconnect();
                    this.emit('connected');
                    resolve();
                };
                
                this.eventSource.onerror = (error) => {
                    if (this.eventSource.readyState === 2) { // CLOSED
                        this.setState(TransportState.DISCONNECTED);
                        this.emit('disconnected');
                        
                        if (this.state !== TransportState.CLOSED) {
                            this.attemptReconnect();
                        }
                    }
                    
                    this.emit('error', error);
                    
                    if (this.state === TransportState.CONNECTING) {
                        reject(error);
                    }
                };
                
                this.eventSource.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.emit('message', message);
                    } catch (error) {
                        this.emit('error', { type: 'parseError', error, data: event.data });
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async disconnect() {
        this.setState(TransportState.CLOSED);
        
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
    
    async send(message) {
        // SSE is unidirectional - server to client only
        // For sending, use a companion HTTP endpoint
        throw new Error('SSE transport is receive-only. Use HTTP for sending.');
    }
    
    /**
     * Add listener for specific event type
     * @param {string} eventType - Event type to listen for
     * @param {Function} handler - Event handler
     */
    addEventListener(eventType, handler) {
        if (this.eventSource) {
            this.eventSource.addEventListener(eventType, (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handler(message);
                } catch (error) {
                    handler(event.data);
                }
            });
        }
    }
}

// ============================================================================
// MEMORY TRANSPORT
// ============================================================================

/**
 * In-memory transport for testing and local communication
 */
class MemoryTransport extends Transport {
    constructor(options = {}) {
        super(options);
        this.peer = null;
        this.messageBuffer = [];
        this.delay = options.delay || 0; // Simulated network delay
    }
    
    /**
     * Create a pair of connected memory transports
     * @param {Object} options - Transport options
     * @returns {[MemoryTransport, MemoryTransport]}
     */
    static createPair(options = {}) {
        const t1 = new MemoryTransport(options);
        const t2 = new MemoryTransport(options);
        t1.peer = t2;
        t2.peer = t1;
        return [t1, t2];
    }
    
    async connect() {
        this.setState(TransportState.CONNECTED);
        this.emit('connected');
    }
    
    async disconnect() {
        this.setState(TransportState.DISCONNECTED);
        this.emit('disconnected');
    }
    
    async send(message) {
        if (!this.peer) {
            throw new Error('No peer connected');
        }
        
        const deliverMessage = () => {
            if (this.peer.state === TransportState.CONNECTED) {
                this.peer.emit('message', message);
            } else {
                this.peer.messageBuffer.push(message);
            }
        };
        
        if (this.delay > 0) {
            setTimeout(deliverMessage, this.delay);
        } else {
            deliverMessage();
        }
    }
    
    /**
     * Deliver buffered messages
     */
    flushBuffer() {
        while (this.messageBuffer.length > 0) {
            const message = this.messageBuffer.shift();
            this.emit('message', message);
        }
    }
}

// ============================================================================
// POLLING TRANSPORT
// ============================================================================

/**
 * HTTP polling transport as fallback
 */
class PollingTransport extends Transport {
    constructor(url, options = {}) {
        super(options);
        this.url = url;
        this.pollInterval = options.pollInterval || 5000;
        this.sendUrl = options.sendUrl || url;
        this.pollTimer = null;
        this.abortController = null;
    }
    
    async connect() {
        this.setState(TransportState.CONNECTED);
        this.startPolling();
        this.emit('connected');
    }
    
    async disconnect() {
        this.setState(TransportState.CLOSED);
        this.stopPolling();
        
        if (this.abortController) {
            this.abortController.abort();
        }
    }
    
    async send(message) {
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        
        try {
            await fetch(this.sendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: data
            });
        } catch (error) {
            this.emit('error', { type: 'sendError', error });
            throw error;
        }
    }
    
    startPolling() {
        this.stopPolling();
        this.poll();
        this.pollTimer = setInterval(() => this.poll(), this.pollInterval);
    }
    
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    
    async poll() {
        try {
            this.abortController = new AbortController();
            
            const response = await fetch(this.url, {
                signal: this.abortController.signal
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    for (const message of data) {
                        this.emit('message', message);
                    }
                } else if (data) {
                    this.emit('message', data);
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.emit('error', { type: 'pollError', error });
            }
        }
    }
}

// ============================================================================
// TRANSPORT MANAGER
// ============================================================================

/**
 * Manages transport connections with automatic fallback
 */
class TransportManager extends SimpleEventEmitter {
    constructor(options = {}) {
        super();
        this.transports = new Map();
        this.primary = null;
        this.fallbackOrder = options.fallbackOrder || ['websocket', 'sse', 'polling'];
    }
    
    /**
     * Register a transport
     * @param {string} name - Transport name
     * @param {Transport} transport - Transport instance
     */
    register(name, transport) {
        this.transports.set(name, transport);
        
        transport.on('message', (message) => {
            this.emit('message', { transport: name, message });
        });
        
        transport.on('error', (error) => {
            this.emit('error', { transport: name, error });
        });
        
        transport.on('disconnected', () => {
            if (this.primary === name) {
                this.fallback();
            }
        });
    }
    
    /**
     * Connect using the first available transport
     * @returns {Promise<string>} Connected transport name
     */
    async connect() {
        for (const name of this.fallbackOrder) {
            const transport = this.transports.get(name);
            if (!transport) continue;
            
            try {
                await transport.connect();
                this.primary = name;
                this.emit('connected', { transport: name });
                return name;
            } catch (error) {
                this.emit('transportFailed', { transport: name, error });
            }
        }
        
        throw new Error('All transports failed');
    }
    
    /**
     * Disconnect all transports
     */
    async disconnect() {
        for (const transport of this.transports.values()) {
            await transport.disconnect();
        }
        this.primary = null;
    }
    
    /**
     * Fallback to next available transport
     */
    async fallback() {
        const currentIndex = this.fallbackOrder.indexOf(this.primary);
        const remaining = this.fallbackOrder.slice(currentIndex + 1);
        
        for (const name of remaining) {
            const transport = this.transports.get(name);
            if (!transport) continue;
            
            try {
                await transport.connect();
                this.primary = name;
                this.emit('fallback', { transport: name });
                return;
            } catch (error) {
                // Continue to next transport
            }
        }
        
        this.emit('allTransportsFailed');
    }
    
    /**
     * Send message via primary transport
     * @param {*} message - Message to send
     */
    async send(message) {
        const transport = this.transports.get(this.primary);
        if (!transport) {
            throw new Error('No active transport');
        }
        
        await transport.send(message);
    }
    
    /**
     * Get primary transport
     * @returns {Transport}
     */
    getPrimary() {
        return this.transports.get(this.primary);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // State enum
    TransportState,
  // Transport classes
    Transport,
  WebSocketTransport,
  SSETransport,
  MemoryTransport,
  PollingTransport,
  // Manager
    TransportManager
};

export default {
  // State enum
    TransportState,
  // Transport classes
    Transport,
  WebSocketTransport,
  SSETransport,
  MemoryTransport,
  PollingTransport,
  // Manager
    TransportManager
};