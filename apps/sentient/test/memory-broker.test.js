/**
 * MemoryBroker Unit Tests
 * 
 * Tests for the MemoryBroker interface and implementations.
 * Also verifies that PRSC is properly decoupled from SMF (uses MemoryBroker only).
 * 
 * @module test/memory-broker.test
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// ============================================================================
// IMPORT TESTS - Verify PRSC doesn't import SMF directly
// ============================================================================

describe('PRSC-SMF Decoupling', () => {
    it('PRSC should not import SMF directly', () => {
        // Read the PRSC source code
        const prscPath = path.join(__dirname, '../../../observer/prsc.js');
        const prscSource = fs.readFileSync(prscPath, 'utf-8');
        
        // Check that PRSC doesn't require SMF
        const smfImportPatterns = [
            /require\s*\(\s*['"].*smf['"]\s*\)/i,
            /from\s+['"].*smf['"]/i,
            /require\s*\(\s*['"]\.\.\/smf['"]\s*\)/i,
            /require\s*\(\s*['"]\.\/smf['"]\s*\)/i
        ];
        
        for (const pattern of smfImportPatterns) {
            const match = prscSource.match(pattern);
            assert.strictEqual(
                match, 
                null, 
                `PRSC should not import SMF directly. Found: ${match?.[0]}`
            );
        }
    });
    
    it('PRSC should import from core/hilbert and core/prime only', () => {
        const prscPath = path.join(__dirname, '../../../observer/prsc.js');
        const prscSource = fs.readFileSync(prscPath, 'utf-8');
        
        // Extract all require statements
        const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        const imports = [];
        let match;
        while ((match = requirePattern.exec(prscSource)) !== null) {
            imports.push(match[1]);
        }
        
        // Verify all imports are from allowed modules
        const allowedModules = [
            '../core/hilbert',
            '../core/prime',
            '../core/qprimes'
        ];
        
        for (const imp of imports) {
            const isAllowed = allowedModules.some(allowed => 
                imp === allowed || imp.startsWith(allowed)
            );
            assert.ok(
                isAllowed,
                `PRSC imports disallowed module: ${imp}. Allowed: ${allowedModules.join(', ')}`
            );
        }
    });
    
    it('sentient-core should use MemoryBroker for state operations', () => {
        const sentientCorePath = path.join(__dirname, '../lib/sentient-core.js');
        
        // Skip if file doesn't exist
        if (!fs.existsSync(sentientCorePath)) {
            console.log('  (skipped - sentient-core.js not found)');
            return;
        }
        
        const source = fs.readFileSync(sentientCorePath, 'utf-8');
        
        // Check for MemoryBroker import
        const hasBrokerImport = /memory-broker|MemoryBroker|createBroker|createSMFBroker/i.test(source);
        
        // This is a soft check - just verify the pattern exists if the file uses memory operations
        if (source.includes('smf') || source.includes('SMF')) {
            // If SMF is mentioned, MemoryBroker should be used
            assert.ok(
                hasBrokerImport || !source.includes("require('./smf')"),
                'sentient-core should use MemoryBroker for SMF operations'
            );
        }
    });
});

// ============================================================================
// MEMORY BROKER TESTS
// ============================================================================

describe('MemoryBroker Interface', () => {
    const { 
        MemoryBroker, 
        InMemoryBroker, 
        FileBroker, 
        CachingBroker,
        SMFBroker,
        createBroker,
        createSMFBroker
    } = require('../lib/memory-broker.js');
    
    describe('InMemoryBroker', () => {
        let broker;
        
        beforeEach(async () => {
            broker = new InMemoryBroker();
            await broker.connect();
        });
        
        after(async () => {
            if (broker && broker.connected) {
                await broker.disconnect();
            }
        });
        
        it('should connect successfully', () => {
            assert.strictEqual(broker.connected, true);
            assert.strictEqual(broker.type, 'memory');
        });
        
        it('should set and get values', async () => {
            await broker.set('test-key', { value: 42 });
            const result = await broker.get('test-key');
            assert.deepStrictEqual(result, { value: 42 });
        });
        
        it('should return undefined for missing keys', async () => {
            const result = await broker.get('nonexistent-key');
            assert.strictEqual(result, undefined);
        });
        
        it('should check key existence', async () => {
            await broker.set('exists', 'yes');
            assert.strictEqual(await broker.has('exists'), true);
            assert.strictEqual(await broker.has('not-exists'), false);
        });
        
        it('should delete keys', async () => {
            await broker.set('to-delete', 'value');
            assert.strictEqual(await broker.has('to-delete'), true);
            
            const deleted = await broker.delete('to-delete');
            assert.strictEqual(deleted, true);
            assert.strictEqual(await broker.has('to-delete'), false);
        });
        
        it('should clear all data', async () => {
            await broker.set('key1', 'value1');
            await broker.set('key2', 'value2');
            await broker.clear();
            
            assert.strictEqual(await broker.has('key1'), false);
            assert.strictEqual(await broker.has('key2'), false);
        });
        
        it('should list keys matching pattern', async () => {
            await broker.set('prefix:a', 1);
            await broker.set('prefix:b', 2);
            await broker.set('other:c', 3);
            
            const allKeys = await broker.keys('*');
            assert.strictEqual(allKeys.length, 3);
            
            const prefixKeys = await broker.keys('prefix:*');
            assert.strictEqual(prefixKeys.length, 2);
            assert.ok(prefixKeys.includes('prefix:a'));
            assert.ok(prefixKeys.includes('prefix:b'));
        });
        
        it('should handle TTL expiration', async () => {
            await broker.set('expiring', 'value', { ttl: 50 });
            
            // Value should exist immediately
            assert.strictEqual(await broker.get('expiring'), 'value');
            
            // Wait for expiration
            await new Promise(r => setTimeout(r, 100));
            
            // Value should be expired
            const result = await broker.get('expiring');
            assert.strictEqual(result, undefined);
        });
        
        it('should batch get multiple values', async () => {
            await broker.set('batch:1', 'a');
            await broker.set('batch:2', 'b');
            await broker.set('batch:3', 'c');
            
            const results = await broker.getMany(['batch:1', 'batch:2', 'batch:3', 'batch:missing']);
            
            assert.strictEqual(results.get('batch:1'), 'a');
            assert.strictEqual(results.get('batch:2'), 'b');
            assert.strictEqual(results.get('batch:3'), 'c');
            assert.strictEqual(results.get('batch:missing'), undefined);
        });
        
        it('should batch set multiple values', async () => {
            await broker.setMany({
                'multi:1': 'x',
                'multi:2': 'y',
                'multi:3': 'z'
            });
            
            assert.strictEqual(await broker.get('multi:1'), 'x');
            assert.strictEqual(await broker.get('multi:2'), 'y');
            assert.strictEqual(await broker.get('multi:3'), 'z');
        });
        
        it('should emit events on operations', async () => {
            const events = [];
            broker.on('set', e => events.push({ type: 'set', ...e }));
            broker.on('delete', e => events.push({ type: 'delete', ...e }));
            
            await broker.set('event-key', 'event-value');
            await broker.delete('event-key');
            
            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0].type, 'set');
            assert.strictEqual(events[0].key, 'event-key');
            assert.strictEqual(events[1].type, 'delete');
        });
        
        it('should provide stats', () => {
            const stats = broker.getStats();
            assert.strictEqual(stats.type, 'memory');
            assert.strictEqual(stats.connected, true);
            assert.ok('size' in stats);
        });
    });
    
    describe('CachingBroker', () => {
        let backend;
        let broker;
        
        beforeEach(async () => {
            backend = new InMemoryBroker();
            broker = new CachingBroker(backend, {
                maxCacheSize: 10,
                defaultTtl: 1000
            });
            await broker.connect();
        });
        
        after(async () => {
            if (broker && broker.connected) {
                await broker.disconnect();
            }
        });
        
        it('should cache values on get', async () => {
            // Set directly in backend
            await backend.set('cached-key', 'cached-value');
            
            // First get - reads from backend and caches
            const val1 = await broker.get('cached-key');
            assert.strictEqual(val1, 'cached-value');
            
            // Delete from backend - cache should still have it
            await backend.delete('cached-key');
            
            // Should get from cache
            const val2 = await broker.get('cached-key');
            assert.strictEqual(val2, 'cached-value');
        });
        
        it('should invalidate cache entries', async () => {
            await broker.set('to-invalidate', 'value');
            
            // Value is cached
            assert.strictEqual(await broker.get('to-invalidate'), 'value');
            
            // Invalidate
            broker.invalidate('to-invalidate');
            
            // Should read from backend
            const result = await broker.get('to-invalidate');
            assert.strictEqual(result, 'value');
        });
        
        it('should respect cache TTL', async () => {
            // Create broker with short TTL
            const shortTtlBroker = new CachingBroker(new InMemoryBroker(), {
                defaultTtl: 50
            });
            await shortTtlBroker.connect();
            
            await shortTtlBroker.set('ttl-key', 'ttl-value');
            
            // Immediately accessible
            assert.strictEqual(await shortTtlBroker.get('ttl-key'), 'ttl-value');
            
            // Wait for cache expiry
            await new Promise(r => setTimeout(r, 100));
            
            // Still accessible (from backend)
            assert.strictEqual(await shortTtlBroker.get('ttl-key'), 'ttl-value');
            
            await shortTtlBroker.disconnect();
        });
        
        it('should evict oldest entries when at capacity', async () => {
            // Create broker with small cache
            const smallBroker = new CachingBroker(new InMemoryBroker(), {
                maxCacheSize: 3
            });
            await smallBroker.connect();
            
            await smallBroker.set('evict:1', 'a');
            await smallBroker.set('evict:2', 'b');
            await smallBroker.set('evict:3', 'c');
            await smallBroker.set('evict:4', 'd'); // Should evict evict:1
            
            const stats = smallBroker.getStats();
            assert.strictEqual(stats.cacheSize, 3);
            
            await smallBroker.disconnect();
        });
    });
    
    describe('SMFBroker', () => {
        let smfBroker;
        
        beforeEach(async () => {
            smfBroker = createSMFBroker({ type: 'memory' });
            await smfBroker.connect();
        });
        
        after(async () => {
            if (smfBroker) {
                await smfBroker.disconnect();
            }
        });
        
        it('should store and retrieve full SMF state', async () => {
            const smfState = {
                s: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
                    0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6],
                entropy: 2.5,
                tick: 100
            };
            
            await smfBroker.setSMF(smfState);
            const retrieved = await smfBroker.getSMF();
            
            assert.deepStrictEqual(retrieved, smfState);
        });
        
        it('should get and set SMF axes', async () => {
            const axes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            
            await smfBroker.setAxes(axes);
            const retrieved = await smfBroker.getAxes();
            
            assert.deepStrictEqual(Array.from(retrieved), axes);
        });
        
        it('should get and set individual axis values', async () => {
            await smfBroker.setAxes(new Array(16).fill(0));
            
            await smfBroker.setAxis(5, 42);
            const value = await smfBroker.getAxis(5);
            
            assert.strictEqual(value, 42);
        });
        
        it('should rotate multiple axes atomically', async () => {
            await smfBroker.setAxes([10, 20, 30, 40, 50, 60, 70, 80,
                                     90, 100, 110, 120, 130, 140, 150, 160]);
            
            await smfBroker.rotateAxes({
                0: 5,   // 10 + 5 = 15
                5: -10, // 60 - 10 = 50
                15: 40  // 160 + 40 = 200
            });
            
            const axes = await smfBroker.getAxes();
            assert.strictEqual(axes[0], 15);
            assert.strictEqual(axes[5], 50);
            assert.strictEqual(axes[15], 200);
        });
        
        it('should store and retrieve codebook', async () => {
            const codebook = {
                primes: [2, 3, 5, 7, 11],
                meanings: ['unity', 'emergence', 'change', 'reflection', 'cycle']
            };
            
            await smfBroker.setCodebook(codebook);
            const retrieved = await smfBroker.getCodebook();
            
            assert.deepStrictEqual(retrieved, codebook);
        });
        
        it('should store and retrieve history snapshots', async () => {
            const snapshot = {
                axes: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
                       0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6],
                coherence: 0.85,
                entropy: 1.2
            };
            
            await smfBroker.storeHistory(100, snapshot);
            const retrieved = await smfBroker.getHistory(100);
            
            assert.deepStrictEqual(retrieved, snapshot);
        });
        
        it('should emit smf_updated event on setSMF', async () => {
            let emitted = null;
            smfBroker.on('smf_updated', data => { emitted = data; });
            
            const state = { s: new Array(16).fill(0), tick: 1 };
            await smfBroker.setSMF(state);
            
            assert.ok(emitted !== null);
            assert.deepStrictEqual(emitted, state);
        });
    });
    
    describe('Factory Functions', () => {
        it('should create InMemoryBroker by default', () => {
            const broker = createBroker();
            assert.strictEqual(broker.type, 'memory');
        });
        
        it('should create FileBroker when specified', () => {
            const broker = createBroker({ type: 'file', dataDir: '/tmp/test' });
            assert.strictEqual(broker.type, 'file');
        });
        
        it('should wrap with CachingBroker when cache option is true', () => {
            const broker = createBroker({ type: 'memory', cache: true });
            assert.strictEqual(broker.type, 'caching');
        });
        
        it('should create SMFBroker with createSMFBroker', () => {
            const broker = createSMFBroker({ type: 'memory' });
            assert.ok(broker instanceof SMFBroker);
        });
    });
});

// ============================================================================
// INTEGRATION: PRSC with MemoryBroker
// ============================================================================

describe('PRSC with MemoryBroker Integration', () => {
    const { PRSCLayer } = require('../../../observer/prsc.js');
    const { createSMFBroker } = require('../lib/memory-broker.js');
    
    it('should run PRSC oscillator without SMF import', () => {
        // Create a PRSC layer - it should work without any SMF dependency
        const prsc = new PRSCLayer(16);
        
        assert.ok(prsc.oscillators.length === 16);
        assert.ok(typeof prsc.globalCoherence === 'function');
        
        // Run several ticks
        for (let i = 0; i < 10; i++) {
            prsc.tick();
        }
        
        const coherence = prsc.globalCoherence();
        assert.ok(coherence >= 0 && coherence <= 1);
    });
    
    it('should store PRSC state through SMFBroker', async () => {
        const prsc = new PRSCLayer(16);
        const broker = createSMFBroker({ type: 'memory' });
        await broker.connect();
        
        // Run some ticks to evolve state
        prsc.excite([2, 3, 5], 0.8);
        for (let i = 0; i < 20; i++) {
            prsc.tick();
        }
        
        // Store PRSC state through broker
        const state = prsc.getState();
        await broker.setSMF({
            oscillators: state.oscillators,
            coherence: state.coherence,
            tick: Date.now()
        });
        
        // Retrieve and verify
        const retrieved = await broker.getSMF();
        assert.ok(retrieved.oscillators.length === 16);
        assert.ok(typeof retrieved.coherence === 'number');
        
        await broker.disconnect();
    });
    
    it('should restore PRSC state from SMFBroker', async () => {
        const broker = createSMFBroker({ type: 'memory' });
        await broker.connect();
        
        // Create and evolve original PRSC
        const original = new PRSCLayer(16);
        original.excite([7, 11, 13], 0.9);
        for (let i = 0; i < 30; i++) {
            original.tick();
        }
        
        // Store state
        const originalState = original.getState();
        await broker.setSMF({
            oscillators: originalState.oscillators,
            coherence: originalState.coherence
        });
        
        // Create new PRSC and load state
        const restored = new PRSCLayer(16);
        const storedState = await broker.getSMF();
        restored.loadState({ oscillators: storedState.oscillators });
        
        // Verify amplitudes match
        for (let i = 0; i < 16; i++) {
            assert.strictEqual(
                restored.oscillators[i].amplitude.toFixed(6),
                original.oscillators[i].amplitude.toFixed(6),
                `Amplitude mismatch at oscillator ${i}`
            );
        }
        
        await broker.disconnect();
    });
});

// ============================================================================
// MOCK MODE FOR CI
// ============================================================================

describe('Mock LLM Mode for CI', () => {
    const { MockLLMClient, fixtures } = require('./mocks/mock-llm.js');
    
    it('should provide echo mock', async () => {
        const client = fixtures.echo();
        const response = await client.generate('Hello world');
        
        assert.ok(response.content.includes('Hello world'));
    });
    
    it('should provide fixed response mock', async () => {
        const client = fixtures.fixed('Fixed response');
        const response = await client.generate('Any prompt');
        
        assert.strictEqual(response.content, 'Fixed response');
    });
    
    it('should provide deterministic queue-based mock', async () => {
        const client = fixtures.deterministic(['First', 'Second', 'Third']);
        
        const r1 = await client.generate('prompt1');
        const r2 = await client.generate('prompt2');
        const r3 = await client.generate('prompt3');
        
        assert.strictEqual(r1.content, 'First');
        assert.strictEqual(r2.content, 'Second');
        assert.strictEqual(r3.content, 'Third');
    });
    
    it('should track usage statistics', async () => {
        const client = new MockLLMClient();
        
        await client.generate('prompt1');
        await client.generate('prompt2');
        
        const usage = client.getUsage();
        assert.strictEqual(usage.totalRequests, 2);
        assert.strictEqual(usage.successfulRequests, 2);
    });
    
    it('should simulate errors at specified rate', async () => {
        const client = fixtures.flaky(1.0); // 100% error rate
        
        await assert.rejects(
            async () => client.generate('will fail'),
            { message: /Simulated error/i }
        );
    });
    
    it('should record requests for assertions', async () => {
        const client = new MockLLMClient({ recordRequests: true });
        
        await client.generate('Test prompt 1');
        await client.generate('Test prompt 2');
        
        const requests = client.getRequests();
        assert.strictEqual(requests.length, 2);
        assert.ok(requests[0].prompt.includes('Test prompt 1'));
    });
    
    it('should support pattern matching', async () => {
        const client = fixtures.pattern([
            { regex: 'hello', response: 'Hi there!' },
            { regex: 'bye', response: 'Goodbye!' }
        ]);
        
        const r1 = await client.generate('Say hello');
        const r2 = await client.generate('Say bye');
        
        assert.strictEqual(r1.content, 'Hi there!');
        assert.strictEqual(r2.content, 'Goodbye!');
    });
});

console.log('Memory Broker Tests Loaded');