/**
 * Aleph Event System
 * 
 * Event-driven monitoring for real-time applications.
 * 
 * Features:
 * - EventEmitter-based for Node.js compatibility
 * - Named events for different state changes
 * - Subscription management
 * - Throttling and debouncing
 * - Event history buffer
 * 
 * Events:
 * - 'tick': Each time step {t, state, entropy, coherence}
 * - 'collapse': State collapse {from, to, probability}
 * - 'resonance': Strong resonance {primes, strength}
 * - 'sync': Synchronization crossed {orderParameter, clusters}
 * - 'entropy:low': Entropy below threshold {value, threshold}
 * - 'entropy:high': Entropy above threshold {value, threshold}
 */

'use strict';

/**
 * AlephEventEmitter - Core event system
 * 
 * Compatible with Node.js EventEmitter pattern but standalone.
 */

class AlephEventEmitter {
  constructor(options = {}) {
    this._listeners = new Map();
    this._onceListeners = new Map();
    this._history = [];
    this._maxHistoryLength = options.maxHistory ?? 1000;
    this._throttleIntervals = new Map();
    this._lastEmitTime = new Map();
    this._paused = false;
    
    // Statistics
    this._stats = {
      totalEmitted: 0,
      eventCounts: new Map()
    };
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {AlephEventEmitter} this for chaining
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return this;
  }
  
  /**
   * Add one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {AlephEventEmitter} this for chaining
   */
  once(event, callback) {
    if (!this._onceListeners.has(event)) {
      this._onceListeners.set(event, new Set());
    }
    this._onceListeners.get(event).add(callback);
    return this;
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Handler function to remove
   * @returns {AlephEventEmitter} this for chaining
   */
  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
    if (this._onceListeners.has(event)) {
      this._onceListeners.get(event).delete(callback);
    }
    return this;
  }
  
  /**
   * Remove all listeners for an event (or all events if no event specified)
   * @param {string} [event] - Event name (optional)
   */
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
      this._onceListeners.delete(event);
    } else {
      this._listeners.clear();
      this._onceListeners.clear();
    }
    return this;
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @returns {boolean} Whether any listeners were called
   */
  emit(event, data) {
    if (this._paused) return false;
    
    // Check throttling
    if (this._throttleIntervals.has(event)) {
      const interval = this._throttleIntervals.get(event);
      const lastTime = this._lastEmitTime.get(event) || 0;
      const now = Date.now();
      
      if (now - lastTime < interval) {
        return false; // Throttled
      }
      this._lastEmitTime.set(event, now);
    }
    
    const eventData = {
      event,
      data,
      timestamp: Date.now()
    };
    
    // Add to history
    this._history.push(eventData);
    if (this._history.length > this._maxHistoryLength) {
      this._history.shift();
    }
    
    // Update stats
    this._stats.totalEmitted++;
    this._stats.eventCounts.set(
      event,
      (this._stats.eventCounts.get(event) || 0) + 1
    );
    
    let called = false;
    
    // Call regular listeners
    if (this._listeners.has(event)) {
      for (const callback of this._listeners.get(event)) {
        try {
          callback(data);
          called = true;
        } catch (err) {
          console.error(`Error in event listener for '${event}':`, err);
        }
      }
    }
    
    // Call and remove once listeners
    if (this._onceListeners.has(event)) {
      const onceCallbacks = this._onceListeners.get(event);
      this._onceListeners.delete(event);
      
      for (const callback of onceCallbacks) {
        try {
          callback(data);
          called = true;
        } catch (err) {
          console.error(`Error in once listener for '${event}':`, err);
        }
      }
    }
    
    // Emit wildcard event
    if (event !== '*' && this._listeners.has('*')) {
      for (const callback of this._listeners.get('*')) {
        try {
          callback(eventData);
          called = true;
        } catch (err) {
          console.error(`Error in wildcard listener:`, err);
        }
      }
    }
    
    return called;
  }
  
  /**
   * Set throttle interval for an event
   * @param {string} event - Event name
   * @param {number} interval - Minimum ms between emissions
   */
  throttle(event, interval) {
    this._throttleIntervals.set(event, interval);
    return this;
  }
  
  /**
   * Remove throttling for an event
   * @param {string} event - Event name
   */
  unthrottle(event) {
    this._throttleIntervals.delete(event);
    this._lastEmitTime.delete(event);
    return this;
  }
  
  /**
   * Pause all event emissions
   */
  pause() {
    this._paused = true;
    return this;
  }
  
  /**
   * Resume event emissions
   */
  resume() {
    this._paused = false;
    return this;
  }
  
  /**
   * Check if paused
   */
  isPaused() {
    return this._paused;
  }
  
  /**
   * Get listener count for an event
   * @param {string} event - Event name
   */
  listenerCount(event) {
    const regular = this._listeners.get(event)?.size || 0;
    const once = this._onceListeners.get(event)?.size || 0;
    return regular + once;
  }
  
  /**
   * Get all registered event names
   */
  eventNames() {
    const names = new Set([
      ...this._listeners.keys(),
      ...this._onceListeners.keys()
    ]);
    return Array.from(names);
  }
  
  /**
   * Get event history
   * @param {string} [event] - Filter by event name
   * @param {number} [limit] - Maximum entries to return
   */
  getHistory(event = null, limit = 100) {
    let history = this._history;
    
    if (event) {
      history = history.filter(h => h.event === event);
    }
    
    return history.slice(-limit);
  }
  
  /**
   * Clear event history
   */
  clearHistory() {
    this._history = [];
    return this;
  }
  
  /**
   * Get event statistics
   */
  getStats() {
    return {
      totalEmitted: this._stats.totalEmitted,
      eventCounts: Object.fromEntries(this._stats.eventCounts),
      historyLength: this._history.length,
      listenerCounts: Object.fromEntries(
        this.eventNames().map(e => [e, this.listenerCount(e)])
      )
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this._stats.totalEmitted = 0;
    this._stats.eventCounts.clear();
    return this;
  }
  
  /**
   * Create a filtered emitter that only emits matching events
   * @param {Function} predicate - Filter function (eventData) => boolean
   */
  filter(predicate) {
    const filtered = new AlephEventEmitter();
    
    this.on('*', (eventData) => {
      if (predicate(eventData)) {
        filtered.emit(eventData.event, eventData.data);
      }
    });
    
    return filtered;
  }
  
  /**
   * Create a mapped emitter that transforms event data
   * @param {Function} transform - Transform function (data) => newData
   */
  map(transform) {
    const mapped = new AlephEventEmitter();
    
    this.on('*', (eventData) => {
      mapped.emit(eventData.event, transform(eventData.data));
    });
    
    return mapped;
  }
  
  /**
   * Promise-based wait for next event
   * @param {string} event - Event name
   * @param {number} [timeout] - Timeout in ms
   */
  waitFor(event, timeout = null) {
    return new Promise((resolve, reject) => {
      const handler = (data) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(data);
      };
      
      let timeoutId = null;
      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(event, handler);
          reject(new Error(`Timeout waiting for event '${event}'`));
        }, timeout);
      }
      
      this.once(event, handler);
    });
  }
  
  /**
   * Collect events into batches
   * @param {string} event - Event name
   * @param {number} size - Batch size
   * @param {Function} callback - Handler for batch
   */
  batch(event, size, callback) {
    const buffer = [];
    
    this.on(event, (data) => {
      buffer.push(data);
      
      if (buffer.length >= size) {
        callback([...buffer]);
        buffer.length = 0;
      }
    });
    
    return this;
  }
  
  /**
   * Debounce an event (emit only after silence)
   * @param {string} event - Event name
   * @param {number} delay - Delay in ms
   * @param {Function} callback - Handler function
   */
  debounce(event, delay, callback) {
    let timeoutId = null;
    let lastData = null;
    
    this.on(event, (data) => {
      lastData = data;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        callback(lastData);
        timeoutId = null;
      }, delay);
    });
    
    return this;
  }
}

/**
 * AlephMonitor - High-level monitoring for AlephEngine
 * 
 * Wraps an AlephEngine and emits structured events.
 */
class AlephMonitor {
  /**
   * @param {object} engine - AlephEngine instance
   * @param {object} options - Configuration
   */
  constructor(engine, options = {}) {
    this.engine = engine;
    this.emitter = new AlephEventEmitter({
      maxHistory: options.maxHistory ?? 1000
    });
    
    // Thresholds
    this.thresholds = {
      entropyLow: options.entropyLow ?? 1.0,
      entropyHigh: options.entropyHigh ?? 3.0,
      coherenceHigh: options.coherenceHigh ?? 0.8,
      resonanceStrong: options.resonanceStrong ?? 0.7,
      syncThreshold: options.syncThreshold ?? 0.7
    };
    
    // State tracking
    this._lastState = null;
    this._stepCount = 0;
    this._startTime = Date.now();
  }
  
  /**
   * Get event emitter for subscribing
   */
  getEmitter() {
    return this.emitter;
  }
  
  /**
   * Convenience method to subscribe to events
   */
  on(event, callback) {
    this.emitter.on(event, callback);
    return this;
  }
  
  /**
   * Wrap engine.tick() with monitoring
   * @param {number} dt - Time step
   */
  tick(dt) {
    const prevState = this._lastState;
    
    // Call engine tick
    this.engine.tick(dt);
    
    // Get current state
    const state = this.engine.getPhysicsState();
    this._lastState = state;
    this._stepCount++;
    
    // Emit tick event
    this.emitter.emit('tick', {
      t: this._stepCount,
      dt,
      entropy: state.entropy,
      coherence: state.coherence,
      orderParameter: state.orderParameter,
      stability: state.stability,
      coupling: state.coupling
    });
    
    // Check for threshold crossings
    this._checkThresholds(state, prevState);
    
    return state;
  }
  
  /**
   * Check threshold crossings and emit events
   * @private
   */
  _checkThresholds(state, prevState) {
    // Entropy crossings
    if (state.entropy < this.thresholds.entropyLow) {
      if (!prevState || prevState.entropy >= this.thresholds.entropyLow) {
        this.emitter.emit('entropy:low', {
          value: state.entropy,
          threshold: this.thresholds.entropyLow
        });
      }
    }
    
    if (state.entropy > this.thresholds.entropyHigh) {
      if (!prevState || prevState.entropy <= this.thresholds.entropyHigh) {
        this.emitter.emit('entropy:high', {
          value: state.entropy,
          threshold: this.thresholds.entropyHigh
        });
      }
    }
    
    // Synchronization
    if (state.orderParameter > this.thresholds.syncThreshold) {
      if (!prevState || prevState.orderParameter <= this.thresholds.syncThreshold) {
        this.emitter.emit('sync', {
          orderParameter: state.orderParameter,
          threshold: this.thresholds.syncThreshold
        });
      }
    }
    
    // Coherence
    if (state.coherence > this.thresholds.coherenceHigh) {
      if (!prevState || prevState.coherence <= this.thresholds.coherenceHigh) {
        this.emitter.emit('coherence:high', {
          value: state.coherence,
          threshold: this.thresholds.coherenceHigh
        });
      }
    }
  }
  
  /**
   * Emit collapse event
   * @param {object} from - State before collapse
   * @param {object} to - State after collapse
   * @param {number} probability - Collapse probability
   */
  emitCollapse(from, to, probability) {
    this.emitter.emit('collapse', { from, to, probability });
  }
  
  /**
   * Emit resonance event
   * @param {number[]} primes - Resonating primes
   * @param {number} strength - Resonance strength
   */
  emitResonance(primes, strength) {
    if (strength > this.thresholds.resonanceStrong) {
      this.emitter.emit('resonance', { primes, strength });
    }
  }
  
  /**
   * Wrap engine.run() with monitoring
   * @param {string} input - Input to process
   */
  run(input) {
    const startTime = Date.now();
    
    this.emitter.emit('run:start', { input, startTime });
    
    const result = this.engine.run(input);
    
    const endTime = Date.now();
    
    this.emitter.emit('run:complete', {
      input,
      output: result.output,
      entropy: result.entropy,
      coherence: result.coherence,
      fieldBased: result.fieldBased,
      duration: endTime - startTime
    });
    
    // Check for collapse
    if (result.collapsed) {
      this.emitCollapse(
        { entropy: result.entropy, primes: result.inputPrimes },
        { primes: result.resultPrimes },
        result.collapseProbability || 1.0
      );
    }
    
    return result;
  }
  
  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      stepCount: this._stepCount,
      runTime: Date.now() - this._startTime,
      events: this.emitter.getStats()
    };
  }
  
  /**
   * Reset monitor state
   */
  reset() {
    this._lastState = null;
    this._stepCount = 0;
    this._startTime = Date.now();
    this.emitter.clearHistory();
    this.emitter.resetStats();
    return this;
  }
}

/**
 * EvolutionStream - Async iterator for engine evolution
 * 
 * Enables for-await-of loops over engine state.
 */
class EvolutionStream {
  /**
   * @param {object} engine - AlephEngine instance or evolvable object
   * @param {object} options - Configuration
   */
  constructor(engine, options = {}) {
    this.engine = engine;
    this.dt = options.dt ?? 0.01;
    this.maxSteps = options.maxSteps ?? Infinity;
    this.stopCondition = options.stopCondition ?? null;
    this._step = 0;
    this._stopped = false;
    
    // Adapter functions for different engine types
    this._tick = options.tickFn ?? ((dt) => {
      if (typeof this.engine.tick === 'function') {
        this.engine.tick(dt);
      }
    });
    
    this._getState = options.getStateFn ?? (() => {
      if (typeof this.engine.getPhysicsState === 'function') {
        return this.engine.getPhysicsState();
      }
      // Try common patterns
      const state = {};
      if (typeof this.engine.orderParameter === 'function') {
        state.orderParameter = this.engine.orderParameter();
      }
      if (typeof this.engine.synchronization === 'function') {
        state.synchronization = this.engine.synchronization();
      }
      if (typeof this.engine.entropy === 'function') {
        state.entropy = this.engine.entropy();
      }
      if (this.engine.oscillators) {
        state.oscillators = this.engine.oscillators.length;
      }
      return state;
    });
  }
  
  /**
   * Create stream from any evolvable object
   * @param {object} evolvable - Object with tick-like method
   * @param {object} options - Configuration
   */
  static fromEvolvable(evolvable, options = {}) {
    return new EvolutionStream(evolvable, options);
  }
  
  /**
   * Stop the stream
   */
  stop() {
    this._stopped = true;
  }
  
  /**
   * Make stream async iterable
   */
  async *[Symbol.asyncIterator]() {
    while (!this._stopped && this._step < this.maxSteps) {
      this._tick(this.dt);
      
      const state = this._getState();
      const data = {
        step: this._step,
        t: this._step * this.dt,
        ...state
      };
      
      yield data;
      
      // Check stop condition
      if (this.stopCondition && this.stopCondition(data)) {
        this._stopped = true;
      }
      
      this._step++;
      
      // Yield to event loop
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  /**
   * Collect stream into array
   * @param {number} maxItems - Maximum items to collect
   */
  async collect(maxItems = 1000) {
    const items = [];
    
    for await (const state of this) {
      items.push(state);
      if (items.length >= maxItems) break;
    }
    
    return items;
  }
  
  /**
   * Batch items into groups
   * @param {number} size - Batch size
   */
  batch(size) {
    const source = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        let batch = [];
        for await (const state of source) {
          batch.push(state);
          if (batch.length >= size) {
            yield batch;
            batch = [];
          }
        }
        if (batch.length > 0) {
          yield batch;
        }
      }
    };
  }
  
  /**
   * Apply filter to stream
   * @param {Function} predicate - Filter function
   */
  filter(predicate) {
    const source = this;
    
    const result = {
      async *[Symbol.asyncIterator]() {
        for await (const state of source) {
          if (predicate(state)) {
            yield state;
          }
        }
      },
      take(n) {
        return EvolutionStream.prototype.take.call({ [Symbol.asyncIterator]: result[Symbol.asyncIterator] }, n);
      },
      collect(max) {
        return EvolutionStream.prototype.collect.call({ [Symbol.asyncIterator]: result[Symbol.asyncIterator] }, max);
      }
    };
    return result;
  }
  
  /**
   * Apply transform to stream
   * @param {Function} transform - Transform function
   */
  map(transform) {
    const source = this;
    
    const result = {
      async *[Symbol.asyncIterator]() {
        for await (const state of source) {
          yield transform(state);
        }
      },
      take(n) {
        return EvolutionStream.prototype.take.call({ [Symbol.asyncIterator]: result[Symbol.asyncIterator] }, n);
      },
      collect(max) {
        return EvolutionStream.prototype.collect.call({ [Symbol.asyncIterator]: result[Symbol.asyncIterator] }, max);
      }
    };
    return result;
  }
  
  /**
   * Take first n items
   * @param {number} n - Number of items
   */
  take(n) {
    const source = this;
    
    const result = {
      async *[Symbol.asyncIterator]() {
        let count = 0;
        for await (const state of source) {
          yield state;
          count++;
          if (count >= n) break;
        }
      },
      async collect(max) {
        const items = [];
        for await (const state of this) {
          items.push(state);
          if (max && items.length >= max) break;
        }
        return items;
      },
      async reduce(reducer, initial) {
        let acc = initial;
        for await (const state of this) {
          acc = reducer(acc, state);
        }
        return acc;
      }
    };
    return result;
  }
  
  /**
   * Skip first n items
   * @param {number} n - Number of items to skip
   */
  skip(n) {
    const source = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        let count = 0;
        for await (const state of source) {
          if (count >= n) {
            yield state;
          }
          count++;
        }
      }
    };
  }
  
  /**
   * Take while condition is true
   * @param {Function} predicate - Condition function
   */
  takeWhile(predicate) {
    const source = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        for await (const state of source) {
          if (!predicate(state)) break;
          yield state;
        }
      }
    };
  }
  
  /**
   * Reduce stream to single value
   * @param {Function} reducer - Reducer function
   * @param {*} initial - Initial value
   */
  async reduce(reducer, initial) {
    let acc = initial;
    
    for await (const state of this) {
      acc = reducer(acc, state);
    }
    
    return acc;
  }
  
  /**
   * Find first matching item
   * @param {Function} predicate - Match function
   */
  async find(predicate) {
    for await (const state of this) {
      if (predicate(state)) {
        this.stop();
        return state;
      }
    }
    return null;
  }
}

/**
 * Create monitored evolution stream
 * @param {object} engine - AlephEngine instance
 * @param {object} options - Configuration
 */
function createEvolutionStream(engine, options = {}) {
  return new EvolutionStream(engine, options);
}

/**
 * Create monitor for engine
 * @param {object} engine - AlephEngine instance
 * @param {object} options - Configuration
 */
function createMonitor(engine, options = {}) {
  return new AlephMonitor(engine, options);
}

export {
    AlephEventEmitter,
    AlephMonitor,
    EvolutionStream,
    createEvolutionStream,
    createMonitor
};