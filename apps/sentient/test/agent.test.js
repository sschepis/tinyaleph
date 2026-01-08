/**
 * Agent Module Tests
 * 
 * Tests for the agentic behavior system including:
 * - Task complexity analysis
 * - Task decomposition (planning)
 * - Step execution
 * - Full agent flow
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const {
    TaskStatus,
    StepStatus,
    ComplexityIndicators,
    TaskStep,
    Task,
    TaskPlanner,
    ComplexityAnalyzer,
    StepExecutor,
    Agent,
    createAgent
} = require('../lib/agent');

describe('Agent Module', () => {
    
    describe('TaskStep', () => {
        it('should create a step with default values', () => {
            const step = new TaskStep();
            
            assert.ok(step.id.startsWith('step_'));
            assert.strictEqual(step.status, StepStatus.PENDING);
            assert.strictEqual(step.retryCount, 0);
            assert.strictEqual(step.isComplete, false);
        });
        
        it('should track duration correctly', () => {
            const step = new TaskStep();
            
            assert.strictEqual(step.duration, 0);
            
            step.start();
            assert.ok(step.duration >= 0);
            
            step.complete({ success: true });
            assert.ok(step.duration >= 0);
        });
        
        it('should handle completion and failure', () => {
            const step1 = new TaskStep();
            step1.start();
            step1.complete({ data: 'result' });
            
            assert.strictEqual(step1.status, StepStatus.COMPLETED);
            assert.deepStrictEqual(step1.result, { data: 'result' });
            assert.strictEqual(step1.isComplete, true);
            
            const step2 = new TaskStep();
            step2.start();
            step2.fail('Something went wrong');
            
            assert.strictEqual(step2.status, StepStatus.FAILED);
            assert.strictEqual(step2.error, 'Something went wrong');
            assert.strictEqual(step2.retryCount, 1);
            assert.strictEqual(step2.isComplete, true);
        });
        
        it('should track retries correctly', () => {
            const step = new TaskStep({ maxRetries: 3 });
            
            step.start();
            step.fail('Error 1');
            assert.strictEqual(step.retryCount, 1);
            assert.strictEqual(step.canRetry, true);
            
            step.reset();
            step.start();
            step.fail('Error 2');
            assert.strictEqual(step.retryCount, 2);
            assert.strictEqual(step.canRetry, true);
            
            step.reset();
            step.start();
            step.fail('Error 3');
            assert.strictEqual(step.retryCount, 3);
            assert.strictEqual(step.canRetry, false);
        });
        
        it('should serialize to JSON', () => {
            const step = new TaskStep({
                description: 'Test step',
                action: 'tool',
                toolName: 'read_file',
                toolParams: { path: 'test.js' }
            });
            
            const json = step.toJSON();
            
            assert.strictEqual(json.description, 'Test step');
            assert.strictEqual(json.action, 'tool');
            assert.strictEqual(json.toolName, 'read_file');
            assert.deepStrictEqual(json.toolParams, { path: 'test.js' });
        });
    });
    
    describe('Task', () => {
        it('should create a task with default values', () => {
            const task = new Task();
            
            assert.ok(task.id.startsWith('task_'));
            assert.strictEqual(task.status, TaskStatus.PENDING);
            assert.strictEqual(task.steps.length, 0);
            assert.strictEqual(task.progress, 0);
        });
        
        it('should add steps correctly', () => {
            const task = new Task({ description: 'Main task' });
            
            const step1 = task.addStep({ description: 'Step 1' });
            const step2 = task.addStep({ description: 'Step 2' });
            
            assert.strictEqual(task.steps.length, 2);
            assert.strictEqual(step1.taskId, task.id);
            assert.strictEqual(step1.index, 0);
            assert.strictEqual(step2.index, 1);
        });
        
        it('should track progress correctly', () => {
            const task = new Task();
            task.addStep({ description: 'Step 1' });
            task.addStep({ description: 'Step 2' });
            task.addStep({ description: 'Step 3' });
            task.addStep({ description: 'Step 4' });
            
            assert.strictEqual(task.progress, 0);
            
            task.steps[0].complete({});
            assert.strictEqual(task.progress, 0.25);
            
            task.steps[1].complete({});
            assert.strictEqual(task.progress, 0.5);
            
            task.steps[2].complete({});
            assert.strictEqual(task.progress, 0.75);
            
            task.steps[3].complete({});
            assert.strictEqual(task.progress, 1);
        });
        
        it('should advance through steps', () => {
            const task = new Task();
            task.addStep({ description: 'Step 1' });
            task.addStep({ description: 'Step 2' });
            task.addStep({ description: 'Step 3' });
            
            assert.strictEqual(task.currentStep.description, 'Step 1');
            assert.strictEqual(task.currentStepIndex, 0);
            
            task.advanceStep();
            assert.strictEqual(task.currentStep.description, 'Step 2');
            assert.strictEqual(task.currentStepIndex, 1);
            
            task.advanceStep();
            assert.strictEqual(task.currentStep.description, 'Step 3');
            
            const result = task.advanceStep();
            assert.strictEqual(result, null);
        });
        
        it('should gather context from completed steps', () => {
            const task = new Task({ context: { initial: 'value' } });
            
            const step1 = task.addStep({ description: 'Step 1' });
            step1.complete({ key1: 'result1' });
            step1.context = { extra1: 'data1' };
            
            const step2 = task.addStep({ description: 'Step 2' });
            step2.complete({ key2: 'result2' });
            
            const ctx = task.gatherContext();
            
            assert.strictEqual(ctx.initial, 'value');
            assert.deepStrictEqual(ctx.step_0_result, { key1: 'result1' });
            assert.strictEqual(ctx.extra1, 'data1');
            assert.deepStrictEqual(ctx.step_1_result, { key2: 'result2' });
        });
        
        it('should handle task lifecycle', () => {
            const task = new Task({ description: 'Test task' });
            
            assert.strictEqual(task.status, TaskStatus.PENDING);
            assert.strictEqual(task.isComplete, false);
            
            task.startPlanning();
            assert.strictEqual(task.status, TaskStatus.PLANNING);
            assert.ok(task.startedAt);
            
            task.startExecution();
            assert.strictEqual(task.status, TaskStatus.IN_PROGRESS);
            
            task.complete({ finalResult: true });
            assert.strictEqual(task.status, TaskStatus.COMPLETED);
            assert.ok(task.completedAt);
            assert.strictEqual(task.isComplete, true);
            // Duration can be 0 if task completes very quickly
            assert.ok(task.duration >= 0);
        });
        
        it('should handle cancellation', () => {
            const task = new Task();
            task.startExecution();
            task.cancel('User cancelled');
            
            assert.strictEqual(task.status, TaskStatus.CANCELLED);
            assert.strictEqual(task.error, 'User cancelled');
            assert.strictEqual(task.isComplete, true);
        });
    });
    
    describe('ComplexityAnalyzer', () => {
        let analyzer;
        
        beforeEach(() => {
            analyzer = new ComplexityAnalyzer({ useQuickHeuristics: true });
        });
        
        it('should detect simple tasks', async () => {
            const simpleInputs = [
                'Hello',
                'What time is it?',
                'Hi there',
                'Thanks'
            ];
            
            for (const input of simpleInputs) {
                const result = await analyzer.analyze(input);
                assert.strictEqual(result.shouldDecompose, false, 
                    `"${input}" should be detected as simple`);
                assert.ok(result.score < 0.5, 
                    `"${input}" should have low complexity score`);
            }
        });
        
        it('should detect complex tasks', async () => {
            const complexInputs = [
                'Create a new React component that fetches data from an API and displays it in a table, then add filtering and sorting functionality',
                'First read the configuration file, then update the database schema, and finally run the migration scripts',
                'Analyze all the JavaScript files in the project, identify performance issues, and create a detailed report with recommendations',
                'Set up the development environment: 1. Install dependencies 2. Configure the database 3. Run initial migrations 4. Start the server'
            ];
            
            for (const input of complexInputs) {
                const result = await analyzer.analyze(input);
                assert.strictEqual(result.shouldDecompose, true, 
                    `"${input.slice(0, 50)}..." should be detected as complex`);
                assert.ok(result.score > 0.5, 
                    `"${input.slice(0, 50)}..." should have high complexity score`);
            }
        });
        
        it('should identify multi-step keywords', async () => {
            const result = await analyzer.analyze('implement a new feature for the application');
            
            assert.ok(result.reasons.some(r => r.includes('action keywords')));
        });
        
        it('should identify sequence connectors', async () => {
            const result = await analyzer.analyze('first do X and then do Y after that do Z');
            
            assert.ok(result.reasons.some(r => r.includes('sequence')));
        });
        
        it('should identify list items', async () => {
            const result = await analyzer.analyze(`
                1. First item
                2. Second item
                3. Third item
            `);
            
            assert.ok(result.reasons.some(r => r.includes('list')));
        });
    });
    
    describe('StepExecutor', () => {
        let executor;
        
        beforeEach(() => {
            executor = new StepExecutor();
        });
        
        it('should execute think steps without LLM', async () => {
            const step = new TaskStep({
                description: 'Think about the problem',
                action: 'think'
            });
            
            const result = await executor.execute(step, { key: 'value' });
            
            assert.strictEqual(step.status, StepStatus.COMPLETED);
            assert.ok(result.thought);
            assert.strictEqual(result.context.key, 'value');
        });
        
        it('should interpolate context into params', () => {
            const params = {
                path: '$filePath',
                content: 'Hello {{name}}',
                static: 'unchanged'
            };
            
            const context = {
                filePath: '/test/file.js',
                name: 'World'
            };
            
            const result = executor.interpolateParams(params, context);
            
            assert.strictEqual(result.path, '/test/file.js');
            assert.strictEqual(result.content, 'Hello World');
            assert.strictEqual(result.static, 'unchanged');
        });
        
        it('should emit events during execution', async () => {
            const events = [];
            
            executor.on('step:start', (data) => events.push({ type: 'start', data }));
            executor.on('step:complete', (data) => events.push({ type: 'complete', data }));
            
            const step = new TaskStep({
                description: 'Test step',
                action: 'think'
            });
            
            await executor.execute(step, {});
            
            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0].type, 'start');
            assert.strictEqual(events[1].type, 'complete');
        });
        
        it('should fail tool execution without executor', async () => {
            const step = new TaskStep({
                description: 'Run a tool',
                action: 'tool',
                toolName: 'read_file'
            });
            
            await assert.rejects(
                () => executor.execute(step, {}),
                /No tool executor configured/
            );
            
            assert.strictEqual(step.status, StepStatus.FAILED);
        });
    });
    
    describe('Agent', () => {
        let agent;
        
        beforeEach(() => {
            agent = createAgent({
                autoDecompose: true,
                minComplexityForDecomposition: 0.5
            });
        });
        
        afterEach(() => {
            agent.reset();
        });
        
        it('should create agent with createAgent factory', () => {
            assert.ok(agent instanceof Agent);
            assert.ok(agent.planner instanceof TaskPlanner);
            assert.ok(agent.analyzer instanceof ComplexityAnalyzer);
            assert.ok(agent.executor instanceof StepExecutor);
        });
        
        it('should emit events during task processing', async () => {
            const events = [];
            
            agent.on('task:created', (data) => events.push({ type: 'created', data }));
            agent.on('task:analyzed', (data) => events.push({ type: 'analyzed', data }));
            agent.on('task:started', (data) => events.push({ type: 'started', data }));
            
            // Process a simple task (no LLM needed for direct execution of think)
            try {
                await agent.process('Hello');
            } catch (e) {
                // Expected to fail without LLM, but events should fire
            }
            
            assert.ok(events.some(e => e.type === 'created'));
            assert.ok(events.some(e => e.type === 'analyzed'));
        });
        
        it('should get status correctly', () => {
            const status = agent.getStatus();
            
            assert.strictEqual(status.hasCurrentTask, false);
            assert.strictEqual(status.currentTask, null);
            assert.strictEqual(status.pendingTasks, 0);
            assert.strictEqual(status.completedTasks, 0);
        });
        
        it('should cancel current task', async () => {
            // Start a task
            const taskPromise = agent.process('Do something complex that takes time');
            
            // Cancel immediately
            agent.cancel('Testing cancellation');
            
            try {
                await taskPromise;
            } catch {
                // Expected
            }
            
            // Check that task was archived
            const status = agent.getStatus();
            assert.strictEqual(status.currentTask, null);
        });
        
        it('should reset all state', () => {
            // Add some state
            agent.taskHistory.push({ id: 'test' });
            
            agent.reset();
            
            assert.strictEqual(agent.taskHistory.length, 0);
            assert.strictEqual(agent.tasks.size, 0);
            assert.strictEqual(agent.currentTask, null);
        });
        
        it('should configure with external dependencies', () => {
            const mockLLM = { chat: async () => ({ content: 'response' }) };
            const mockToolExecutor = { execute: async () => ({ success: true }) };
            const mockTools = [{ function: { name: 'test' } }];
            
            agent.configure({
                llmClient: mockLLM,
                toolExecutor: mockToolExecutor,
                toolDefinitions: mockTools
            });
            
            assert.strictEqual(agent.llmClient, mockLLM);
            assert.strictEqual(agent.toolExecutor, mockToolExecutor);
            assert.deepStrictEqual(agent.toolDefinitions, mockTools);
        });
    });
    
    describe('Integration', () => {
        it('should handle simple task direct execution', async () => {
            // Create a mock LLM that returns a simple response
            const mockLLM = {
                async *streamChat(messages) {
                    yield 'This is a simple response';
                }
            };
            
            const agent = createAgent({
                llmClient: mockLLM,
                autoDecompose: true
            });
            
            const result = await agent.process('Hello');
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.mode, 'direct');
            assert.strictEqual(result.steps, 1);
        });
        
        it('should execute with mock tool executor', async () => {
            const toolCallLog = [];
            
            const mockToolExecutor = {
                async execute(toolCall) {
                    toolCallLog.push(toolCall);
                    return {
                        success: true,
                        content: 'File content here',
                        message: 'Read successfully'
                    };
                }
            };
            
            const executor = new StepExecutor({
                toolExecutor: mockToolExecutor
            });
            
            const step = new TaskStep({
                description: 'Read a file',
                action: 'tool',
                toolName: 'read_file',
                toolParams: { path: 'test.js' }
            });
            
            const result = await executor.execute(step, {});
            
            assert.strictEqual(step.status, StepStatus.COMPLETED);
            assert.strictEqual(toolCallLog.length, 1);
            assert.strictEqual(toolCallLog[0].tool, 'read_file');
        });
    });
});

describe('ComplexityIndicators', () => {
    it('should have multi-step keywords defined', () => {
        assert.ok(Array.isArray(ComplexityIndicators.MULTI_STEP_KEYWORDS));
        assert.ok(ComplexityIndicators.MULTI_STEP_KEYWORDS.length > 0);
        assert.ok(ComplexityIndicators.MULTI_STEP_KEYWORDS.includes('create'));
        assert.ok(ComplexityIndicators.MULTI_STEP_KEYWORDS.includes('implement'));
    });
    
    it('should have sequence connectors defined', () => {
        assert.ok(Array.isArray(ComplexityIndicators.SEQUENCE_CONNECTORS));
        assert.ok(ComplexityIndicators.SEQUENCE_CONNECTORS.length > 0);
        assert.ok(ComplexityIndicators.SEQUENCE_CONNECTORS.includes('and then'));
    });
    
    it('should have word count thresholds defined', () => {
        assert.strictEqual(typeof ComplexityIndicators.MIN_WORDS_FOR_COMPLEX, 'number');
        assert.strictEqual(typeof ComplexityIndicators.MAX_WORDS_FOR_SIMPLE, 'number');
        assert.ok(ComplexityIndicators.MIN_WORDS_FOR_COMPLEX > ComplexityIndicators.MAX_WORDS_FOR_SIMPLE);
    });
});