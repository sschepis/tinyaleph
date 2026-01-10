/**
 * Unit Tests for Sentient Enhancements
 * 
 * Tests for:
 * - Generator back-pressure in streaming operations
 * - Snapshot integrity and corruption recovery
 * - Memory broker operations
 * - Transport abstraction
 * - Mock LLM behavior
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// TEST UTILITIES
// ============================================================================

let tempDir;

async function setupTempDir() {
    tempDir = path.join(os.tmpdir(), `sentient-test-${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
}

async function cleanupTempDir() {
    if (tempDir) {
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

// ============================================================================
// BINARY SERIALIZER TESTS
// ============================================================================

describe('BinarySerializer', async () => {
    const { BinarySerializer, MsgPackEncoder, MsgPackDecoder } = require('../lib/binary-serializer');
    
    it('should encode and decode primitive types', () => {
        // Test various types
        const testCases = [
            null,
            true,
            false,
            42,
            -123,
            3.14159,
            'hello world',
            '',
            [1, 2, 3],
            { a: 1, b: 'test' }
        ];
        
        for (const value of testCases) {
            const encoder = new MsgPackEncoder();
            encoder.write(value);
            const encoded = encoder.getBuffer();
            const decoder = new MsgPackDecoder(encoded);
            const decoded = decoder.read();
            assert.deepStrictEqual(decoded, value, `Failed for ${JSON.stringify(value)}`);
        }
    });
    
    it('should handle nested objects', () => {
        const nested = {
            level1: {
                level2: {
                    level3: {
                        value: [1, 2, { deep: true }]
                    }
                }
            },
            array: [[1, 2], [3, 4]]
        };
        
        const encoder = new MsgPackEncoder();
        encoder.write(nested);
        const encoded = encoder.getBuffer();
        const decoder = new MsgPackDecoder(encoded);
        const decoded = decoder.read();
        assert.deepStrictEqual(decoded, nested);
    });
    
    it('should serialize with compression', async () => {
        const serializer = new BinarySerializer({ compress: true });
        
        const largeData = {
            items: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `item-${i}`,
                data: 'x'.repeat(100)
            }))
        };
        
        const serialized = await serializer.serialize(largeData);
        const deserialized = await serializer.deserialize(serialized);
        
        assert.deepStrictEqual(deserialized, largeData);
        // Compressed should be smaller than uncompressed JSON
        assert.ok(serialized.length < JSON.stringify(largeData).length);
    });
    
    it('should verify checksum on deserialize', async () => {
        const serializer = new BinarySerializer({ compress: false });
        
        const data = { test: 'data' };
        const serialized = serializer.serialize(data);
        
        // Corrupt the payload (after header, before checksum)
        const corrupted = Buffer.from(serialized);
        // Header is 12 bytes, corrupt byte 15 (in the payload)
        if (corrupted.length > 15) {
            corrupted[15] ^= 0xFF;
        }
        
        assert.throws(
            () => serializer.deserialize(corrupted),
            /checksum|invalid|mismatch/i
        );
    });
});

// ============================================================================
// SNAPSHOT INTEGRITY TESTS
// ============================================================================

describe('SnapshotIntegrity', async () => {
    const { SnapshotIntegrityManager } = require('../lib/snapshot-integrity');
    let manager;
    
    beforeEach(async () => {
        await setupTempDir();
        manager = new SnapshotIntegrityManager({
            snapshotDir: path.join(tempDir, 'snapshots'),
            backupDir: path.join(tempDir, 'backups'),
            compress: false
        });
        await manager.initialize();
    });
    
    afterEach(async () => {
        await cleanupTempDir();
    });
    
    it('should create and load snapshot with integrity', async () => {
        const testData = {
            smf: { s: Array(16).fill(0.5) },
            tick: 100,
            coherence: 0.75
        };
        
        const result = await manager.createSnapshot(testData, { name: 'test1' });
        
        assert.ok(result.hash, 'Should have hash');
        assert.ok(result.path, 'Should have path');
        
        const loaded = await manager.loadSnapshot(result.path);
        assert.deepStrictEqual(loaded.data, testData);
    });
    
    it('should detect corrupted snapshot', async () => {
        const testData = { value: 'test' };
        const result = await manager.createSnapshot(testData, { name: 'corrupt-test' });
        
        // Corrupt the file by modifying bytes
        const content = await fs.promises.readFile(result.path);
        const corrupted = Buffer.from(content);
        corrupted[100] ^= 0xFF; // Flip bits in middle
        await fs.promises.writeFile(result.path, corrupted);
        
        const verification = await manager.verifySnapshot(result.path);
        assert.strictEqual(verification.valid, false);
        assert.ok(verification.error.includes('mismatch') || verification.error.includes('Hash'));
    });
    
    it('should recover from backup on corruption', async () => {
        const data1 = { version: 1 };
        const data2 = { version: 2 };
        
        // Create first snapshot (will become backup)
        await manager.createSnapshot(data1, { name: 'v1' });
        
        // Create second snapshot (triggers backup of first)
        const result2 = await manager.createSnapshot(data2, { name: 'v2' });
        
        // Corrupt latest snapshot
        const content = await fs.promises.readFile(result2.path);
        const corrupted = Buffer.from(content);
        corrupted[100] ^= 0xFF;
        await fs.promises.writeFile(result2.path, corrupted);
        
        // Attempt recovery
        const recovered = await manager.recoverFromBackup();
        assert.ok(recovered, 'Should recover from backup');
        assert.ok(recovered.path, 'Should have recovered path');
        
        // Load recovered data
        const loaded = await manager.loadSnapshot(recovered.path);
        assert.strictEqual(loaded.data.version, 1); // Should be first version
    });
    
    it('should maintain snapshot history', async () => {
        for (let i = 0; i < 5; i++) {
            await manager.createSnapshot({ iteration: i }, { name: `iter-${i}` });
        }
        
        const snapshots = await manager.listSnapshots();
        assert.strictEqual(snapshots.length, 5);
        assert.ok(snapshots.every(s => s.valid));
    });
});

// ============================================================================
// MEMORY BROKER TESTS
// ============================================================================

describe('MemoryBroker', async () => {
    const { InMemoryBroker, FileBroker, CachingBroker, SMFBroker } = require('../lib/memory-broker');
    
    describe('InMemoryBroker', () => {
        let broker;
        
        beforeEach(async () => {
            broker = new InMemoryBroker();
            await broker.connect();
        });
        
        afterEach(async () => {
            await broker.disconnect();
        });
        
        it('should get and set values', async () => {
            await broker.set('key1', 'value1');
            const value = await broker.get('key1');
            assert.strictEqual(value, 'value1');
        });
        
        it('should handle TTL expiration', async () => {
            await broker.set('temp', 'value', { ttl: 50 });
            
            // Should exist immediately
            assert.strictEqual(await broker.get('temp'), 'value');
            
            // Wait for expiration
            await new Promise(r => setTimeout(r, 100));
            
            // Should be expired
            assert.strictEqual(await broker.get('temp'), undefined);
        });
        
        it('should list keys with pattern', async () => {
            await broker.set('user:1', { name: 'Alice' });
            await broker.set('user:2', { name: 'Bob' });
            await broker.set('item:1', { type: 'widget' });
            
            const userKeys = await broker.keys('user:*');
            assert.strictEqual(userKeys.length, 2);
            assert.ok(userKeys.includes('user:1'));
            assert.ok(userKeys.includes('user:2'));
        });
    });
    
    describe('FileBroker', () => {
        let broker;
        
        beforeEach(async () => {
            await setupTempDir();
            broker = new FileBroker({ dataDir: path.join(tempDir, 'filebroker') });
            await broker.connect();
        });
        
        afterEach(async () => {
            await broker.disconnect();
            await cleanupTempDir();
        });
        
        it('should persist data to files', async () => {
            await broker.set('persistent', { data: 'test' });
            
            // Disconnect and reconnect
            await broker.disconnect();
            
            const newBroker = new FileBroker({ dataDir: path.join(tempDir, 'filebroker') });
            await newBroker.connect();
            
            const value = await newBroker.get('persistent');
            assert.deepStrictEqual(value, { data: 'test' });
            
            await newBroker.disconnect();
        });
    });
    
    describe('SMFBroker', () => {
        let broker;
        
        beforeEach(async () => {
            const backend = new InMemoryBroker();
            await backend.connect();
            broker = new SMFBroker(backend);
        });
        
        it('should handle SMF-specific operations', async () => {
            const smfState = {
                s: Array(16).fill(0.5),
                coherence: 0.75
            };
            
            await broker.setSMF(smfState);
            const loaded = await broker.getSMF();
            assert.deepStrictEqual(loaded, smfState);
        });
        
        it('should get and set individual axes', async () => {
            await broker.setSMF({ s: Array(16).fill(0) });
            
            await broker.setAxis(5, 0.8);
            const axis5 = await broker.getAxis(5);
            assert.strictEqual(axis5, 0.8);
        });
        
        it('should rotate multiple axes atomically', async () => {
            await broker.setSMF({ s: Array(16).fill(0.5) });
            
            await broker.rotateAxes({ 0: 0.1, 1: -0.2, 2: 0.3 });
            
            const axes = await broker.getAxes();
            assert.strictEqual(axes[0], 0.6);
            assert.strictEqual(axes[1], 0.3);
            assert.strictEqual(axes[2], 0.8);
        });
    });
});

// ============================================================================
// TRANSPORT TESTS
// ============================================================================

describe('Transport', async () => {
    const { MemoryTransport, TransportFactory, TransportState } = require('../lib/transport/index');
    
    it('should create paired memory transports', async () => {
        const [a, b] = TransportFactory.createMemoryPair();
        
        await a.connect();
        
        assert.strictEqual(a.state, TransportState.CONNECTED);
        assert.strictEqual(b.state, TransportState.CONNECTED);
    });
    
    it('should exchange messages between transports', async () => {
        const [a, b] = TransportFactory.createMemoryPair();
        await a.connect();
        
        const received = [];
        b.on('message', (data) => received.push(data));
        
        await a.send({ type: 'test', value: 42 });
        
        // Wait for async delivery
        await new Promise(r => setImmediate(r));
        
        assert.strictEqual(received.length, 1);
        assert.deepStrictEqual(received[0], { type: 'test', value: 42 });
    });
    
    it('should queue messages when disconnected', async () => {
        const transport = new MemoryTransport();
        
        // Send while disconnected - should queue
        transport.send({ msg: 1 });
        
        // Check that message was queued
        assert.strictEqual(transport.messageQueue.length, 1);
    });
    
    it('should track statistics', async () => {
        const [a, b] = TransportFactory.createMemoryPair();
        await a.connect();
        
        await a.send('hello');
        await new Promise(r => setImmediate(r));
        
        const stats = a.getStats();
        assert.strictEqual(stats.messagesSent, 1);
        assert.ok(stats.bytesSent > 0);
    });
});

// ============================================================================
// MOCK LLM TESTS
// ============================================================================

describe('MockLLM', async () => {
    const { MockLLMClient, fixtures, waitForRequests } = require('./mocks/mock-llm');
    
    it('should echo prompts', async () => {
        const client = fixtures.echo();
        
        const response = await client.generate('Hello world');
        assert.ok(response.content.includes('Hello world'));
    });
    
    it('should return fixed responses', async () => {
        const client = fixtures.fixed('This is the answer');
        
        const response = await client.generate('What is the answer?');
        assert.strictEqual(response.content, 'This is the answer');
    });
    
    it('should use queued responses deterministically', async () => {
        const client = fixtures.deterministic([
            'Response 1',
            'Response 2',
            'Response 3'
        ]);
        
        const r1 = await client.generate('q1');
        const r2 = await client.generate('q2');
        const r3 = await client.generate('q3');
        
        assert.strictEqual(r1.content, 'Response 1');
        assert.strictEqual(r2.content, 'Response 2');
        assert.strictEqual(r3.content, 'Response 3');
    });
    
    it('should simulate errors with configured rate', async () => {
        const client = new MockLLMClient({ errorRate: 1.0 }); // Always error
        
        await assert.rejects(client.generate('test'));
        assert.strictEqual(client.usage.failedRequests, 1);
    });
    
    it('should record requests for assertions', async () => {
        const client = new MockLLMClient({ recordRequests: true });
        
        await client.generate('First prompt');
        await client.generate('Second prompt');
        
        const requests = client.getRequests();
        assert.strictEqual(requests.length, 2);
        assert.ok(client.assertRequest({ prompt: 'First' }));
        assert.ok(!client.assertRequest({ prompt: 'Third' }));
    });
    
    it('should generate streaming responses', async () => {
        const client = fixtures.fixed('Hello. World. Test.');
        
        const chunks = [];
        for await (const chunk of client.generateStream('test')) {
            chunks.push(chunk);
        }
        
        assert.ok(chunks.length >= 1);
    });
    
    it('should track token usage', async () => {
        const client = new MockLLMClient();
        
        await client.generate('Hello world');
        
        const usage = client.getUsage();
        assert.ok(usage.promptTokens > 0);
        assert.ok(usage.completionTokens > 0);
        assert.strictEqual(usage.totalRequests, 1);
    });
});

// ============================================================================
// PROMPT CACHE TESTS
// ============================================================================

describe('PromptCache', async () => {
    const { PromptCache, CachedLLMProvider } = require('../lib/learning/prompt-cache');
    const { MockLLMClient } = require('./mocks/mock-llm');
    
    it('should cache identical prompts', async () => {
        const cache = new PromptCache({ maxSize: 100 });
        const mockLLM = new MockLLMClient();
        const provider = new CachedLLMProvider(mockLLM, cache);
        
        // First call - cache miss
        await provider.complete('What is 2+2?');
        assert.strictEqual(mockLLM.usage.totalRequests, 1);
        
        // Second call - cache hit
        await provider.complete('What is 2+2?');
        assert.strictEqual(mockLLM.usage.totalRequests, 1); // No new request
    });
    
    it('should deduplicate concurrent identical requests', async () => {
        const cache = new PromptCache({ maxSize: 100 });
        const mockLLM = new MockLLMClient({ delay: 50 });
        const provider = new CachedLLMProvider(mockLLM, cache);
        
        // Fire 5 identical requests concurrently
        const promises = Array(5).fill().map(() =>
            provider.complete('Same question')
        );
        
        await Promise.all(promises);
        
        // Should only make one actual request
        assert.strictEqual(mockLLM.usage.totalRequests, 1);
    });
    
    it('should respect TTL', async () => {
        const cache = new PromptCache({ maxSize: 100, defaultTTL: 50 });
        const mockLLM = new MockLLMClient();
        const provider = new CachedLLMProvider(mockLLM, cache);
        
        await provider.complete('Test prompt');
        assert.strictEqual(mockLLM.usage.totalRequests, 1);
        
        // Wait for TTL expiration
        await new Promise(r => setTimeout(r, 100));
        
        // Should make new request
        await provider.complete('Test prompt');
        assert.strictEqual(mockLLM.usage.totalRequests, 2);
    });
});

// ============================================================================
// ERROR HANDLER TESTS
// ============================================================================

describe('ErrorHandler', async () => {
    const { ErrorHandler, SentientError, NetworkError, withErrorHandling } = require('../lib/error-handler');
    
    it('should normalize errors to SentientError', () => {
        const handler = new ErrorHandler();
        
        const normalized = handler.normalize(new Error('Test error'));
        
        assert.ok(normalized instanceof SentientError);
        assert.ok(normalized.timestamp);
        assert.ok(normalized.userMessage);
    });
    
    it('should classify network errors', async () => {
        const handler = new ErrorHandler();
        
        const networkErr = new Error('Connection refused');
        networkErr.code = 'ECONNREFUSED';
        
        const normalized = handler.normalize(networkErr);
        
        assert.strictEqual(normalized.category, 'network');
        assert.strictEqual(normalized.retryable, true);
    });
    
    it('should track error rates', () => {
        const handler = new ErrorHandler({ rateWindow: 1000 });
        
        // Handle errors (normalize and track)
        handler.normalize(new NetworkError('Error 1'));
        handler.normalize(new NetworkError('Error 2'));
        handler.normalize(new NetworkError('Error 3'));
        
        // Track manually since normalize doesn't track
        handler.trackError('network');
        handler.trackError('network');
        handler.trackError('network');
        
        const rate = handler.getErrorRate('network');
        assert.strictEqual(rate, 3);
    });
    
    it('should wrap functions with retry logic', async () => {
        const handler = new ErrorHandler();
        let attempts = 0;
        
        const flaky = async () => {
            attempts++;
            if (attempts < 3) {
                const err = new Error('Transient error');
                err.retryable = true; // Mark as retryable
                throw err;
            }
            return 'success';
        };
        
        const wrapped = withErrorHandling(flaky, handler, { maxRetries: 5, retryDelay: 10 });
        const result = await wrapped();
        
        assert.strictEqual(result, 'success');
        assert.strictEqual(attempts, 3);
    });
});

// ============================================================================
// PROFILER TESTS
// ============================================================================

describe('Profiler', async () => {
    const { OscillatorProfiler, Timer, Histogram } = require('../lib/profiler');
    
    it('should record tick timing', () => {
        const profiler = new OscillatorProfiler();
        
        profiler.startTick();
        // Simulate work
        let sum = 0;
        for (let i = 0; i < 10000; i++) sum += Math.random();
        profiler.endTick({ coherence: 0.75, entropy: 1.5 });
        
        assert.strictEqual(profiler.counters.ticks, 1);
        assert.strictEqual(profiler.gauges.coherence, 0.75);
    });
    
    it('should compute histogram statistics', () => {
        const hist = new Histogram([1, 5, 10, 50, 100]);
        
        // Add samples
        for (let i = 0; i < 100; i++) {
            hist.observe(i % 20);
        }
        
        const stats = hist.getStats();
        assert.strictEqual(stats.count, 100);
        assert.ok(stats.p50 <= stats.p90);
        assert.ok(stats.p90 <= stats.p99);
    });
    
    it('should detect bottlenecks', () => {
        const profiler = new OscillatorProfiler({
            enabled: true
        });
        profiler.bottleneckThresholds.tick = 1; // Very low threshold
        
        const bottlenecks = [];
        profiler.on('bottleneck', (e) => bottlenecks.push(e));
        
        profiler.startTick();
        // Force slow tick
        const start = Date.now();
        while (Date.now() - start < 5) {} // Busy wait 5ms
        profiler.endTick({});
        
        assert.ok(bottlenecks.length > 0);
        assert.strictEqual(bottlenecks[0].component, 'tick');
    });
    
    it('should generate formatted report', () => {
        const profiler = new OscillatorProfiler();
        
        for (let i = 0; i < 10; i++) {
            profiler.startTick();
            profiler.endTick({ coherence: 0.5 + i * 0.05, entropy: 1.0 });
        }
        
        const report = profiler.formatReport();
        
        assert.ok(report.includes('OSCILLATOR DYNAMICS PROFILE'));
        assert.ok(report.includes('Total Ticks: 10'));
        assert.ok(report.includes('Coherence'));
    });
});

// ============================================================================
// FILE TRANSACTION TESTS
// ============================================================================

describe('FileTransaction', async () => {
    const { FileTransaction, TransactionState, executeAtomic } = require('../lib/tools/file-editor/transaction');
    
    beforeEach(async () => {
        await setupTempDir();
    });
    
    afterEach(async () => {
        await cleanupTempDir();
    });
    
    it('should stage and validate edits', async () => {
        // Create test file
        const testFile = path.join(tempDir, 'test.js');
        await fs.promises.writeFile(testFile, 'function hello() {\n  return "world";\n}');
        
        const tx = new FileTransaction({ baseDir: tempDir });
        
        tx.stage(testFile, {
            searchBlock: 'return "world"',
            replaceBlock: 'return "universe"'
        });
        
        const validation = await tx.validate();
        assert.ok(validation.valid);
    });
    
    it('should commit changes atomically', async () => {
        const file1 = path.join(tempDir, 'file1.txt');
        const file2 = path.join(tempDir, 'file2.txt');
        
        await fs.promises.writeFile(file1, 'original1');
        await fs.promises.writeFile(file2, 'original2');
        
        const tx = new FileTransaction({ baseDir: tempDir, createBackups: false });
        
        tx.stage(file1, { searchBlock: 'original1', replaceBlock: 'modified1' });
        tx.stage(file2, { searchBlock: 'original2', replaceBlock: 'modified2' });
        
        const result = await tx.commit();
        
        assert.ok(result.success);
        assert.strictEqual(result.filesCommitted, 2);
        
        const content1 = await fs.promises.readFile(file1, 'utf-8');
        const content2 = await fs.promises.readFile(file2, 'utf-8');
        
        assert.strictEqual(content1, 'modified1');
        assert.strictEqual(content2, 'modified2');
    });
    
    it('should rollback on failure', async () => {
        const file1 = path.join(tempDir, 'rollback1.txt');
        const file2 = path.join(tempDir, 'rollback2.txt');
        
        await fs.promises.writeFile(file1, 'original1');
        await fs.promises.writeFile(file2, 'original2');
        
        const tx = new FileTransaction({ baseDir: tempDir, createBackups: true });
        
        tx.stage(file1, { searchBlock: 'original1', replaceBlock: 'modified1' });
        tx.stage(file2, { searchBlock: 'NOT_FOUND', replaceBlock: 'modified2' }); // This will fail
        
        const result = await tx.commit();
        
        assert.ok(!result.success);
        assert.ok(result.validationErrors);
    });
});

// ============================================================================
// SECURE CONFIG TESTS
// ============================================================================

describe('SecureConfig', async () => {
    const { SecureConfig, encryptCredential, decryptCredential } = require('../lib/secure-config');
    
    beforeEach(async () => {
        await setupTempDir();
    });
    
    afterEach(async () => {
        await cleanupTempDir();
    });
    
    it('should load from multiple sources with priority', () => {
        const config = new SecureConfig({
            baseDir: tempDir,
            schema: {
                TEST_VAR: { type: 'string', default: 'default_value' }
            }
        });
        
        config.load();
        
        assert.strictEqual(config.get('TEST_VAR'), 'default_value');
    });
    
    it('should mask secrets in output', () => {
        const config = new SecureConfig({
            schema: {
                API_KEY: { type: 'secret' }
            }
        });
        
        config.set('API_KEY', 'sk_1234567890abcdef');
        
        const masked = config.maskValue('API_KEY', config.get('API_KEY'));
        assert.ok(masked.includes('***'));
        assert.ok(!masked.includes('567890'));
    });
    
    it('should encrypt and decrypt credentials', () => {
        const secret = 'my-secret-api-key';
        const password = 'encryption-password';
        
        const encrypted = encryptCredential(secret, password);
        const decrypted = decryptCredential(encrypted, password);
        
        assert.strictEqual(decrypted, secret);
        assert.notStrictEqual(encrypted, secret);
    });
    
    it('should detect configured providers', () => {
        const config = new SecureConfig({ baseDir: tempDir });
        config.set('OPENAI_API_KEY', 'sk-test');
        
        assert.ok(config.isProviderConfigured('openai'));
        assert.ok(!config.isProviderConfigured('anthropic'));
    });
});

console.log('Running enhancement tests...');