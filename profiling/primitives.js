/**
 * Profiling Primitives for TinyAleph
 * 
 * Provides low-level profiling utilities:
 * - RingBuffer: Fixed-size circular buffer for samples
 * - Histogram: Value distribution analysis
 * - Timer: High-resolution timing with statistics
 * - Sampler: Periodic sampling with configurable rate
 * 
 * Browser-compatible: Uses performance.now() with Date.now() fallback.
 * Extracted from apps/sentient/lib/profiler.js for library reuse.
 */

const { SimpleEventEmitter } = require('../core/errors');

// ============================================================================
// HIGH-RESOLUTION TIME
// ============================================================================

/**
 * Get high-resolution time in milliseconds
 * Uses performance.now() in browser, with Date.now() fallback
 * @returns {number}
 */
function hrtime() {
    if (typeof performance !== 'undefined' && performance.now) {
        return performance.now();
    }
    return Date.now();
}

/**
 * Get high-resolution time in nanoseconds (approximate)
 * @returns {bigint}
 */
function hrtimeNs() {
    return BigInt(Math.round(hrtime() * 1e6));
}

// ============================================================================
// RING BUFFER
// ============================================================================

/**
 * Fixed-size circular buffer for storing samples
 */
class RingBuffer {
    constructor(size = 1000) {
        this.size = size;
        this.buffer = new Array(size);
        this.head = 0;
        this.count = 0;
    }
    
    /**
     * Push a value into the buffer
     * @param {*} value - Value to add
     */
    push(value) {
        this.buffer[this.head] = value;
        this.head = (this.head + 1) % this.size;
        if (this.count < this.size) {
            this.count++;
        }
    }
    
    /**
     * Get all values in insertion order
     * @returns {Array}
     */
    toArray() {
        if (this.count < this.size) {
            return this.buffer.slice(0, this.count);
        }
        
        return [
            ...this.buffer.slice(this.head),
            ...this.buffer.slice(0, this.head)
        ];
    }
    
    /**
     * Get the most recent N values
     * @param {number} n - Number of values
     * @returns {Array}
     */
    recent(n = 10) {
        const arr = this.toArray();
        return arr.slice(-n);
    }
    
    /**
     * Get value at index (0 = oldest)
     * @param {number} index - Index
     * @returns {*}
     */
    get(index) {
        if (index < 0 || index >= this.count) {
            return undefined;
        }
        
        if (this.count < this.size) {
            return this.buffer[index];
        }
        
        return this.buffer[(this.head + index) % this.size];
    }
    
    /**
     * Clear the buffer
     */
    clear() {
        this.buffer = new Array(this.size);
        this.head = 0;
        this.count = 0;
    }
    
    /**
     * Check if buffer is full
     * @returns {boolean}
     */
    isFull() {
        return this.count >= this.size;
    }
    
    /**
     * Get current count
     * @returns {number}
     */
    length() {
        return this.count;
    }
}

// ============================================================================
// HISTOGRAM
// ============================================================================

/**
 * Histogram for analyzing value distributions
 */
class Histogram {
    constructor(options = {}) {
        this.buckets = options.buckets || [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000];
        this.counts = new Map();
        this.sum = 0;
        this.count = 0;
        this.min = Infinity;
        this.max = -Infinity;
        this.samples = new RingBuffer(options.sampleSize || 1000);
        
        // Initialize bucket counts
        for (const bucket of this.buckets) {
            this.counts.set(bucket, 0);
        }
        this.counts.set(Infinity, 0);
    }
    
    /**
     * Record a value
     * @param {number} value - Value to record
     */
    record(value) {
        this.sum += value;
        this.count++;
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);
        this.samples.push(value);
        
        // Update bucket counts
        for (const bucket of this.buckets) {
            if (value <= bucket) {
                this.counts.set(bucket, this.counts.get(bucket) + 1);
                return;
            }
        }
        this.counts.set(Infinity, this.counts.get(Infinity) + 1);
    }
    
    /**
     * Get mean value
     * @returns {number}
     */
    mean() {
        return this.count > 0 ? this.sum / this.count : 0;
    }
    
    /**
     * Get percentile value
     * @param {number} p - Percentile (0-100)
     * @returns {number}
     */
    percentile(p) {
        const arr = this.samples.toArray().sort((a, b) => a - b);
        if (arr.length === 0) return 0;
        
        const index = Math.ceil((p / 100) * arr.length) - 1;
        return arr[Math.max(0, index)];
    }
    
    /**
     * Get standard deviation
     * @returns {number}
     */
    stddev() {
        if (this.count < 2) return 0;
        
        const m = this.mean();
        const arr = this.samples.toArray();
        const variance = arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / arr.length;
        return Math.sqrt(variance);
    }
    
    /**
     * Get statistics summary
     * @returns {Object}
     */
    stats() {
        return {
            count: this.count,
            sum: this.sum,
            min: this.count > 0 ? this.min : 0,
            max: this.count > 0 ? this.max : 0,
            mean: this.mean(),
            stddev: this.stddev(),
            p50: this.percentile(50),
            p90: this.percentile(90),
            p95: this.percentile(95),
            p99: this.percentile(99)
        };
    }
    
    /**
     * Get bucket distribution
     * @returns {Object}
     */
    distribution() {
        const dist = {};
        let prevBucket = 0;
        
        for (const bucket of this.buckets) {
            const label = `${prevBucket}-${bucket}`;
            dist[label] = this.counts.get(bucket);
            prevBucket = bucket;
        }
        
        dist[`>${this.buckets[this.buckets.length - 1]}`] = this.counts.get(Infinity);
        return dist;
    }
    
    /**
     * Reset histogram
     */
    reset() {
        this.sum = 0;
        this.count = 0;
        this.min = Infinity;
        this.max = -Infinity;
        this.samples.clear();
        
        for (const bucket of this.buckets) {
            this.counts.set(bucket, 0);
        }
        this.counts.set(Infinity, 0);
    }
}

// ============================================================================
// TIMER
// ============================================================================

/**
 * High-resolution timer with statistics
 */
class Timer {
    constructor(name = 'timer', options = {}) {
        this.name = name;
        this.histogram = new Histogram(options);
        this.running = new Map(); // id -> startTime
        this.nextId = 0;
    }
    
    /**
     * Start timing
     * @returns {number} Timer ID
     */
    start() {
        const id = this.nextId++;
        this.running.set(id, hrtime());
        return id;
    }
    
    /**
     * Stop timing and record duration
     * @param {number} id - Timer ID
     * @returns {number} Duration in ms
     */
    stop(id) {
        const startTime = this.running.get(id);
        if (startTime === undefined) {
            throw new Error(`Timer ${id} not found`);
        }
        
        const duration = hrtime() - startTime;
        this.running.delete(id);
        this.histogram.record(duration);
        return duration;
    }
    
    /**
     * Time a synchronous function
     * @param {Function} fn - Function to time
     * @returns {*} Function result
     */
    time(fn) {
        const id = this.start();
        try {
            return fn();
        } finally {
            this.stop(id);
        }
    }
    
    /**
     * Time an async function
     * @param {Function} fn - Async function to time
     * @returns {Promise<*>} Function result
     */
    async timeAsync(fn) {
        const id = this.start();
        try {
            return await fn();
        } finally {
            this.stop(id);
        }
    }
    
    /**
     * Create a time decorator
     * @returns {Function}
     */
    wrap(fn) {
        const timer = this;
        return function(...args) {
            return timer.time(() => fn.apply(this, args));
        };
    }
    
    /**
     * Create an async time decorator
     * @returns {Function}
     */
    wrapAsync(fn) {
        const timer = this;
        return async function(...args) {
            return timer.timeAsync(() => fn.apply(this, args));
        };
    }
    
    /**
     * Get timer statistics
     * @returns {Object}
     */
    stats() {
        return {
            name: this.name,
            active: this.running.size,
            ...this.histogram.stats()
        };
    }
    
    /**
     * Reset timer
     */
    reset() {
        this.histogram.reset();
        this.running.clear();
    }
}

// ============================================================================
// SAMPLER
// ============================================================================

/**
 * Periodic sampler for collecting values at intervals
 */
class Sampler extends SimpleEventEmitter {
    constructor(name, options = {}) {
        super();
        this.name = name;
        this.interval = options.interval || 1000;
        this.samples = new RingBuffer(options.bufferSize || 100);
        this.sampleFn = options.sampleFn || (() => 0);
        this.timer = null;
        this.running = false;
    }
    
    /**
     * Set the sampling function
     * @param {Function} fn - Function that returns a sample value
     */
    setSampleFn(fn) {
        this.sampleFn = fn;
    }
    
    /**
     * Start sampling
     */
    start() {
        if (this.running) return;
        
        this.running = true;
        this.collect();
        this.timer = setInterval(() => this.collect(), this.interval);
        this.emit('started');
    }
    
    /**
     * Stop sampling
     */
    stop() {
        if (!this.running) return;
        
        this.running = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.emit('stopped');
    }
    
    /**
     * Collect a sample
     */
    collect() {
        try {
            const value = this.sampleFn();
            const sample = {
                value,
                timestamp: Date.now()
            };
            this.samples.push(sample);
            this.emit('sample', sample);
        } catch (error) {
            this.emit('error', error);
        }
    }
    
    /**
     * Get recent samples
     * @param {number} n - Number of samples
     * @returns {Array}
     */
    recent(n = 10) {
        return this.samples.recent(n);
    }
    
    /**
     * Get all samples
     * @returns {Array}
     */
    all() {
        return this.samples.toArray();
    }
    
    /**
     * Clear samples
     */
    clear() {
        this.samples.clear();
    }
}

// ============================================================================
// RATE CALCULATOR
// ============================================================================

/**
 * Calculate rates over time windows
 */
class RateCalculator {
    constructor(windowMs = 60000) {
        this.windowMs = windowMs;
        this.events = new RingBuffer(1000);
    }
    
    /**
     * Record an event
     * @param {number} count - Event count (default 1)
     */
    mark(count = 1) {
        const now = Date.now();
        this.events.push({ timestamp: now, count });
    }
    
    /**
     * Get rate per second in the window
     * @returns {number}
     */
    rate() {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        
        const arr = this.events.toArray();
        const inWindow = arr.filter(e => e.timestamp >= cutoff);
        
        if (inWindow.length === 0) return 0;
        
        const total = inWindow.reduce((sum, e) => sum + e.count, 0);
        const windowSeconds = this.windowMs / 1000;
        
        return total / windowSeconds;
    }
    
    /**
     * Get total count in window
     * @returns {number}
     */
    count() {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        
        const arr = this.events.toArray();
        return arr
            .filter(e => e.timestamp >= cutoff)
            .reduce((sum, e) => sum + e.count, 0);
    }
    
    /**
     * Reset calculator
     */
    reset() {
        this.events.clear();
    }
}

// ============================================================================
// MOVING AVERAGE
// ============================================================================

/**
 * Exponentially weighted moving average
 */
class MovingAverage {
    constructor(alpha = 0.5) {
        this.alpha = alpha;
        this.value = null;
        this.count = 0;
    }
    
    /**
     * Add a value
     * @param {number} value - Value to add
     */
    add(value) {
        if (this.value === null) {
            this.value = value;
        } else {
            this.value = this.alpha * value + (1 - this.alpha) * this.value;
        }
        this.count++;
    }
    
    /**
     * Get current average
     * @returns {number}
     */
    get() {
        return this.value || 0;
    }
    
    /**
     * Reset average
     */
    reset() {
        this.value = null;
        this.count = 0;
    }
}

// ============================================================================
// PROFILER
// ============================================================================

/**
 * Simple profiler for performance analysis
 */
class Profiler {
    constructor(name = 'profiler') {
        this.name = name;
        this.timers = new Map();
        this.counters = new Map();
        this.gauges = new Map();
    }
    
    /**
     * Get or create a timer
     * @param {string} name - Timer name
     * @returns {Timer}
     */
    timer(name) {
        if (!this.timers.has(name)) {
            this.timers.set(name, new Timer(name));
        }
        return this.timers.get(name);
    }
    
    /**
     * Increment a counter
     * @param {string} name - Counter name
     * @param {number} value - Amount to increment
     */
    count(name, value = 1) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
    }
    
    /**
     * Set a gauge value
     * @param {string} name - Gauge name
     * @param {number} value - Value
     */
    gauge(name, value) {
        this.gauges.set(name, value);
    }
    
    /**
     * Get all statistics
     * @returns {Object}
     */
    stats() {
        const timers = {};
        for (const [name, timer] of this.timers) {
            timers[name] = timer.stats();
        }
        
        return {
            name: this.name,
            timers,
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges)
        };
    }
    
    /**
     * Reset all profiler data
     */
    reset() {
        for (const timer of this.timers.values()) {
            timer.reset();
        }
        this.counters.clear();
        this.gauges.clear();
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Time utilities
    hrtime,
    hrtimeNs,
    
    // Data structures
    RingBuffer,
    Histogram,
    
    // Timing
    Timer,
    Sampler,
    
    // Rate analysis
    RateCalculator,
    MovingAverage,
    
    // Profiling
    Profiler
};