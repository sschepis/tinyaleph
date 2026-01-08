#!/usr/bin/env node
/**
 * TinyAleph Examples Runner
 * Interactive menu-driven CLI to browse and run examples
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m'
};

// Example categories with metadata
const categories = {
    quickstart: {
        name: '🚀 Quickstart',
        description: 'Basic examples to get started',
        path: '.',
        examples: [
            { file: '01-hello-world.js', name: 'Hello World', desc: 'Your first TinyAleph embedding' },
            { file: '02-basic-hash.js', name: 'Basic Hash', desc: 'Cryptographic hashing basics' },
            { file: '03-quantum-coin.js', name: 'Quantum Coin', desc: 'Quantum coin flip simulation' }
        ]
    },
    ai: {
        name: '🤖 AI & Machine Learning',
        description: 'AI applications using semantic embeddings',
        path: 'ai',
        examples: [
            { file: '01-embeddings.js', name: 'Embeddings', desc: 'Text embeddings for ML' },
            { file: '02-semantic-memory.js', name: 'Semantic Memory', desc: 'Memory systems with recall' },
            { file: '03-reasoning.js', name: 'Reasoning', desc: 'Symbolic reasoning chains' },
            { file: '04-knowledge-graph.js', name: 'Knowledge Graph', desc: 'Graph construction & traversal' },
            { file: '05-llm-integration.js', name: 'LLM Integration', desc: 'Integrate with language models' },
            { file: '06-agent.js', name: 'AI Agent', desc: 'Agent implementation patterns' },
            { file: '07-hybrid-ai.js', name: 'Hybrid AI', desc: 'Neural-symbolic hybrid systems' },
            { file: '08-entropy-reasoning.js', name: 'Entropy Reasoning', desc: 'Entropy-guided inference' },
            { file: '09-concept-learning.js', name: 'Concept Learning', desc: 'Learning new concepts' },
            { file: '10-prompt-primes.js', name: 'Prompt Primes', desc: 'Prime-based prompting' },
            { file: '11-rag.js', name: 'RAG', desc: 'Retrieval-augmented generation' },
            { file: '12-neuro-symbolic.js', name: 'Neuro-Symbolic', desc: 'Neural-symbolic bridge' }
        ]
    },
    semantic: {
        name: '📝 Semantic Processing',
        description: 'Text analysis and NLP applications',
        path: 'semantic',
        examples: [
            { file: '01-vocabulary.js', name: 'Vocabulary', desc: 'Word-to-prime mapping' },
            { file: '02-similarity.js', name: 'Similarity', desc: 'Semantic similarity metrics' },
            { file: '03-word-algebra.js', name: 'Word Algebra', desc: 'Vector arithmetic on words' },
            { file: '04-clustering.js', name: 'Clustering', desc: 'Text clustering algorithms' },
            { file: '05-classification.js', name: 'Classification', desc: 'Text classification' },
            { file: '06-dna-encoding.js', name: 'DNA Encoding', desc: 'Bio-inspired encoding' },
            { file: '07-search.js', name: 'Search', desc: 'Semantic search engine' },
            { file: '08-qa-system.js', name: 'QA System', desc: 'Question answering' }
        ]
    },
    crypto: {
        name: '🔐 Cryptography',
        description: 'Cryptographic operations and security',
        path: 'crypto',
        examples: [
            { file: '01-password-hash.js', name: 'Password Hash', desc: 'Secure password hashing' },
            { file: '02-key-derivation.js', name: 'Key Derivation', desc: 'PBKDF key derivation' },
            { file: '03-hmac.js', name: 'HMAC', desc: 'Message authentication' },
            { file: '04-file-integrity.js', name: 'File Integrity', desc: 'File verification' },
            { file: '05-content-hash.js', name: 'Content Hash', desc: 'Content-addressable storage' }
        ]
    },
    scientific: {
        name: '⚛️ Scientific Computing',
        description: 'Quantum computing simulation',
        path: 'scientific',
        examples: [
            { file: '01-single-qubit.js', name: 'Single Qubit', desc: 'Qubit gates and operations' },
            { file: '02-two-qubit.js', name: 'Two Qubit', desc: 'Entanglement and CNOT' },
            { file: '03-quantum-circuits.js', name: 'Circuits', desc: 'Quantum circuit builder' },
            { file: '04-measurement.js', name: 'Measurement', desc: 'Quantum measurement' },
            { file: '05-algorithms.js', name: 'Algorithms', desc: 'Quantum algorithms' },
            { file: '06-random.js', name: 'Random', desc: 'Quantum random numbers' },
            { file: '07-wavefunction.js', name: 'Wavefunction', desc: 'Wavefunction simulation' }
        ]
    },
    bioinformatics: {
        name: '🧬 Bioinformatics',
        description: 'DNA computing and molecular biology',
        path: 'bioinformatics',
        examples: [
            { file: '01-dna-encoding.js', name: 'DNA Encoding', desc: 'Prime-encoded sequences' },
            { file: '02-central-dogma.js', name: 'Central Dogma', desc: 'DNA→RNA→Protein' },
            { file: '03-protein-folding.js', name: 'Protein Folding', desc: 'Kuramoto dynamics' },
            { file: '04-dna-computing.js', name: 'DNA Computing', desc: 'Logic gates with DNA' },
            { file: '05-molecular-binding.js', name: 'Molecular Binding', desc: 'Binding affinity' }
        ]
    },
    math: {
        name: '➗ Mathematics',
        description: 'Mathematical foundations',
        path: 'math',
        examples: [
            { file: '01-quaternions.js', name: 'Quaternions', desc: '4D rotation algebra' },
            { file: '02-octonions.js', name: 'Octonions', desc: '8D hypercomplex numbers' },
            { file: '03-prime-factorization.js', name: 'Primes', desc: 'Prime factorization' },
            { file: '04-vector-spaces.js', name: 'Vector Spaces', desc: 'Linear algebra' },
            { file: '05-gaussian-primes.js', name: 'Gaussian Primes', desc: 'Complex plane primes' }
        ]
    },
    physics: {
        name: '🌊 Physics Simulation',
        description: 'Physics and dynamics',
        path: 'physics',
        examples: [
            { file: '01-oscillator.js', name: 'Oscillator', desc: 'Coupled oscillators' },
            { file: '02-lyapunov.js', name: 'Lyapunov', desc: 'Chaos and stability' },
            { file: '03-collapse.js', name: 'Collapse', desc: 'State collapse dynamics' },
            { file: '04-kuramoto.js', name: 'Kuramoto', desc: 'Synchronization model' },
            { file: '05-entropy.js', name: 'Entropy', desc: 'Information entropy' }
        ]
    }
};

class ExampleRunner {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.currentCategory = null;
        this.examplesDir = __dirname;
    }

    clear() {
        console.clear();
    }

    print(text) {
        console.log(text);
    }

    printHeader() {
        this.print('');
        this.print(colors.bgBlue + colors.white + colors.bold + '                                                        ' + colors.reset);
        this.print(colors.bgBlue + colors.white + colors.bold + '          ✨ TinyAleph Examples Runner ✨                ' + colors.reset);
        this.print(colors.bgBlue + colors.white + colors.bold + '                                                        ' + colors.reset);
        this.print('');
    }

    printCategoryMenu() {
        this.print(colors.bold + 'Select a category:' + colors.reset);
        this.print('');
        
        const catKeys = Object.keys(categories);
        for (let i = 0; i < catKeys.length; i++) {
            const key = catKeys[i];
            const cat = categories[key];
            const num = String(i + 1).padStart(2, ' ');
            this.print(`  ${colors.cyan}[${num}]${colors.reset} ${cat.name}`);
            this.print(`       ${colors.dim}${cat.description}${colors.reset}`);
        }
        
        this.print('');
        this.print(`  ${colors.yellow}[a]${colors.reset}  Run all examples`);
        this.print(`  ${colors.red}[q]${colors.reset}  Quit`);
        this.print('');
    }

    printExampleMenu(categoryKey) {
        const cat = categories[categoryKey];
        this.print(colors.bold + `${cat.name}` + colors.reset);
        this.print(colors.dim + cat.description + colors.reset);
        this.print('');
        
        for (let i = 0; i < cat.examples.length; i++) {
            const ex = cat.examples[i];
            const num = String(i + 1).padStart(2, ' ');
            this.print(`  ${colors.cyan}[${num}]${colors.reset} ${ex.name}`);
            this.print(`       ${colors.dim}${ex.desc}${colors.reset}`);
        }
        
        this.print('');
        this.print(`  ${colors.green}[a]${colors.reset}  Run all in category`);
        this.print(`  ${colors.yellow}[b]${colors.reset}  Back to categories`);
        this.print(`  ${colors.red}[q]${colors.reset}  Quit`);
        this.print('');
    }

    prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(colors.bold + question + colors.reset, (answer) => {
                resolve(answer.trim().toLowerCase());
            });
        });
    }

    async runExample(categoryKey, exampleIndex) {
        const cat = categories[categoryKey];
        const example = cat.examples[exampleIndex];
        const filePath = path.join(this.examplesDir, cat.path, example.file);
        
        this.print('');
        this.print(colors.bgGreen + colors.white + colors.bold + ` Running: ${example.name} ` + colors.reset);
        this.print(colors.dim + filePath + colors.reset);
        this.print('─'.repeat(60));
        this.print('');
        
        return new Promise((resolve) => {
            const child = spawn('node', [filePath], {
                stdio: 'inherit',
                cwd: path.join(this.examplesDir, '..')
            });
            
            child.on('close', (code) => {
                this.print('');
                this.print('─'.repeat(60));
                if (code === 0) {
                    this.print(colors.green + '✓ Example completed successfully' + colors.reset);
                } else {
                    this.print(colors.red + `✗ Example exited with code ${code}` + colors.reset);
                }
                resolve();
            });
            
            child.on('error', (err) => {
                this.print(colors.red + `Error: ${err.message}` + colors.reset);
                resolve();
            });
        });
    }

    async runAllInCategory(categoryKey) {
        const cat = categories[categoryKey];
        this.print('');
        this.print(colors.bold + `Running all examples in ${cat.name}...` + colors.reset);
        
        for (let i = 0; i < cat.examples.length; i++) {
            await this.runExample(categoryKey, i);
            if (i < cat.examples.length - 1) {
                const cont = await this.prompt('\nPress Enter for next, or q to stop: ');
                if (cont === 'q') break;
            }
        }
    }

    async runAllExamples() {
        this.print('');
        this.print(colors.bold + 'Running ALL examples...' + colors.reset);
        
        const catKeys = Object.keys(categories);
        for (const catKey of catKeys) {
            await this.runAllInCategory(catKey);
            const cont = await this.prompt('\nPress Enter for next category, or q to stop: ');
            if (cont === 'q') break;
        }
    }

    async showCategoryMenu() {
        while (true) {
            this.clear();
            this.printHeader();
            this.printCategoryMenu();
            
            const choice = await this.prompt('Enter choice: ');
            
            if (choice === 'q') {
                this.print('\nGoodbye! 👋\n');
                this.rl.close();
                return;
            }
            
            if (choice === 'a') {
                await this.runAllExamples();
                await this.prompt('\nPress Enter to continue...');
                continue;
            }
            
            const num = parseInt(choice);
            const catKeys = Object.keys(categories);
            
            if (num >= 1 && num <= catKeys.length) {
                await this.showExampleMenu(catKeys[num - 1]);
            }
        }
    }

    async showExampleMenu(categoryKey) {
        const cat = categories[categoryKey];
        
        while (true) {
            this.clear();
            this.printHeader();
            this.printExampleMenu(categoryKey);
            
            const choice = await this.prompt('Enter choice: ');
            
            if (choice === 'q') {
                this.print('\nGoodbye! 👋\n');
                this.rl.close();
                process.exit(0);
            }
            
            if (choice === 'b') {
                return; // Back to category menu
            }
            
            if (choice === 'a') {
                await this.runAllInCategory(categoryKey);
                await this.prompt('\nPress Enter to continue...');
                continue;
            }
            
            const num = parseInt(choice);
            if (num >= 1 && num <= cat.examples.length) {
                await this.runExample(categoryKey, num - 1);
                await this.prompt('\nPress Enter to continue...');
            }
        }
    }

    async start() {
        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            this.print('\n\nGoodbye! 👋\n');
            this.rl.close();
            process.exit(0);
        });
        
        await this.showCategoryMenu();
    }
}

// Quick run mode for direct execution
async function quickRun(args) {
    if (args.length < 1) {
        console.log('Usage: node run-examples.js [category] [example]');
        console.log('       node run-examples.js --list');
        console.log('       node run-examples.js (interactive mode)');
        return;
    }
    
    if (args[0] === '--list' || args[0] === '-l') {
        console.log('\nAvailable examples:\n');
        for (const [key, cat] of Object.entries(categories)) {
            console.log(`${cat.name}:`);
            for (const ex of cat.examples) {
                console.log(`  ${key}/${ex.file.replace('.js', '')}`);
            }
            console.log('');
        }
        return;
    }
    
    // Parse category/example format
    const parts = args[0].split('/');
    const categoryKey = parts[0];
    const exampleName = parts[1];
    
    if (!categories[categoryKey]) {
        console.log(`Unknown category: ${categoryKey}`);
        console.log('Available: ' + Object.keys(categories).join(', '));
        return;
    }
    
    const cat = categories[categoryKey];
    
    if (!exampleName) {
        // Run all in category
        const runner = new ExampleRunner();
        await runner.runAllInCategory(categoryKey);
        process.exit(0);
    }
    
    // Find example
    const exIndex = cat.examples.findIndex(e => 
        e.file.replace('.js', '') === exampleName ||
        e.file === exampleName ||
        e.name.toLowerCase() === exampleName.toLowerCase()
    );
    
    if (exIndex === -1) {
        console.log(`Unknown example: ${exampleName}`);
        console.log('Available in ' + categoryKey + ':');
        for (const ex of cat.examples) {
            console.log('  ' + ex.file.replace('.js', ''));
        }
        return;
    }
    
    const runner = new ExampleRunner();
    await runner.runExample(categoryKey, exIndex);
    process.exit(0);
}

// Main entry point
const args = process.argv.slice(2);

if (args.length > 0) {
    quickRun(args);
} else {
    const runner = new ExampleRunner();
    runner.start();
}