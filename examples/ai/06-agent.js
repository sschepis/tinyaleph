/**
 * @example Agent Architecture
 * @description Build a simple reasoning agent using TinyAleph
 * 
 * This example demonstrates a basic AI agent architecture that uses
 * prime-based semantic computing for:
 * - Goal representation and tracking
 * - Action selection based on semantic matching
 * - State management and memory
 * - Plan generation and execution
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// AGENT CLASS
// ===========================================

class SemanticAgent {
    constructor(backend, name) {
        this.backend = backend;
        this.name = name;
        this.state = new Map();
        this.goals = [];
        this.actions = [];
        this.memory = [];
        this.currentPlan = [];
    }

    // Compute similarity
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Set agent state
    setState(key, value) {
        this.state.set(key, {
            value,
            embedding: this.backend.textToOrderedState(`${key}: ${value}`)
        });
    }

    // Get combined state embedding
    getStateEmbedding() {
        const combined = Hypercomplex.zero(16);
        for (const [key, data] of this.state) {
            for (let i = 0; i < 16; i++) {
                combined.c[i] += data.embedding.c[i];
            }
        }
        // Normalize
        return combined.normalize();
    }

    // Add a goal
    addGoal(description, priority = 1.0) {
        this.goals.push({
            description,
            embedding: this.backend.textToOrderedState(description),
            priority,
            achieved: false
        });
    }

    // Register an available action
    registerAction(name, description, preconditions, effects, executor) {
        this.actions.push({
            name,
            description,
            embedding: this.backend.textToOrderedState(description),
            preconditions, // Array of required state conditions
            effects, // What state changes this action causes
            executor // Function to run the action
        });
    }

    // Find best action for current state and goals
    selectAction() {
        const stateEmbed = this.getStateEmbedding();
        
        // Find highest priority unachieved goal
        const activeGoals = this.goals
            .filter(g => !g.achieved)
            .sort((a, b) => b.priority - a.priority);

        if (activeGoals.length === 0) return null;

        const currentGoal = activeGoals[0];

        // Score actions by how well they move toward the goal
        let bestAction = null;
        let bestScore = -Infinity;

        for (const action of this.actions) {
            // Check preconditions
            const preConditionsMet = action.preconditions.every(cond => {
                const stateVal = this.state.get(cond.key);
                return stateVal && stateVal.value === cond.value;
            });

            if (!preConditionsMet) continue;

            // Score: similarity of action to goal
            const goalAlignment = this.similarity(action.embedding, currentGoal.embedding);
            
            // Bonus for matching current state context
            const stateAlignment = this.similarity(action.embedding, stateEmbed);

            const score = goalAlignment * 0.7 + stateAlignment * 0.3;

            if (score > bestScore) {
                bestScore = score;
                bestAction = { action, score, goal: currentGoal };
            }
        }

        return bestAction;
    }

    // Execute selected action
    executeAction(selection) {
        if (!selection) return null;

        const { action, goal } = selection;
        
        // Run the action
        const result = action.executor(this);

        // Apply effects
        for (const effect of action.effects) {
            this.setState(effect.key, effect.value);
        }

        // Record in memory
        this.memory.push({
            action: action.name,
            goal: goal.description,
            timestamp: Date.now(),
            result
        });

        // Check if goal is now achieved
        const goalStateMatch = this.similarity(
            this.getStateEmbedding(),
            goal.embedding
        );
        if (goalStateMatch > 0.8) {
            goal.achieved = true;
        }

        return result;
    }

    // Run agent loop
    run(maxSteps = 10) {
        const log = [];

        for (let step = 0; step < maxSteps; step++) {
            const selection = this.selectAction();
            
            if (!selection) {
                log.push({ step: step + 1, status: 'NO_ACTION', reason: 'No valid action found' });
                break;
            }

            const result = this.executeAction(selection);
            
            log.push({
                step: step + 1,
                action: selection.action.name,
                score: selection.score.toFixed(3),
                goal: selection.goal.description,
                result
            });

            // Check if all goals achieved
            if (this.goals.every(g => g.achieved)) {
                log.push({ step: step + 2, status: 'COMPLETE', reason: 'All goals achieved' });
                break;
            }
        }

        return log;
    }
}

// ===========================================
// EXAMPLE: SIMPLE TASK AGENT
// ===========================================

console.log('TinyAleph Agent Architecture Example');
console.log('=====================================\n');

const agent = new SemanticAgent(backend, 'TaskBot');

// Set initial state
agent.setState('location', 'home');
agent.setState('has_coffee', 'no');
agent.setState('is_working', 'no');
agent.setState('task_complete', 'no');

// Add goals
agent.addGoal('Complete the work task successfully', 2.0);
agent.addGoal('Get energized with coffee', 1.0);

// Register actions
agent.registerAction(
    'go_to_office',
    'Travel to the office to start work',
    [{ key: 'location', value: 'home' }],
    [{ key: 'location', value: 'office' }],
    (self) => 'Arrived at office'
);

agent.registerAction(
    'make_coffee',
    'Prepare and drink coffee for energy',
    [{ key: 'location', value: 'office' }],
    [{ key: 'has_coffee', value: 'yes' }],
    (self) => 'Made and drank coffee'
);

agent.registerAction(
    'start_work',
    'Begin working on the assigned task',
    [{ key: 'location', value: 'office' }, { key: 'has_coffee', value: 'yes' }],
    [{ key: 'is_working', value: 'yes' }],
    (self) => 'Started working on task'
);

agent.registerAction(
    'finish_work',
    'Complete the work task',
    [{ key: 'is_working', value: 'yes' }],
    [{ key: 'task_complete', value: 'yes' }, { key: 'is_working', value: 'no' }],
    (self) => 'Task completed successfully!'
);

// Run the agent
console.log('Initial State:');
for (const [key, data] of agent.state) {
    console.log(`  ${key}: ${data.value}`);
}

console.log('\nGoals:');
for (const goal of agent.goals) {
    console.log(`  [Priority: ${goal.priority}] ${goal.description}`);
}

console.log('\n=====================================');
console.log('Agent Execution Log:');
console.log('=====================================\n');

const log = agent.run();

for (const entry of log) {
    if (entry.status) {
        console.log(`Step ${entry.step}: ${entry.status} - ${entry.reason}`);
    } else {
        console.log(`Step ${entry.step}: ${entry.action} [score: ${entry.score}]`);
        console.log(`  Result: ${entry.result}`);
        console.log(`  Working toward: "${entry.goal}"`);
    }
}

console.log('\nFinal State:');
for (const [key, data] of agent.state) {
    console.log(`  ${key}: ${data.value}`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n=====================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Agent state is embedded for semantic matching');
console.log('2. Goals are prioritized and tracked via embeddings');
console.log('3. Actions are selected by semantic alignment to goals');
console.log('4. Preconditions and effects enable planning');
console.log('5. Memory tracks action history for learning');
console.log('6. Extend with LLM integration for natural language');