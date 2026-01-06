/**
 * Test script for the JavaScript code runner feature
 * 
 * Tests the CodeRunner class that executes JavaScript code blocks
 * from chat responses.
 */

const { MarkdownRenderer, CodeRunner, ANSI } = require('./lib/markdown');

console.log('\n🧪 Testing Code Runner Feature\n');
console.log('='.repeat(50));

// Test 1: CodeRunner basic execution
console.log('\n1. Testing CodeRunner basic execution');
console.log('-'.repeat(40));

const runner = new CodeRunner({ useColor: true });

// Simple console.log
const result1 = runner.run('console.log("Hello from code block!");');
console.log(runner.formatOutput(result1));

// Test 2: Return value capture
console.log('\n2. Testing return value capture');
console.log('-'.repeat(40));

const result2 = runner.run('const x = 5; const y = 10; x + y');
console.log(runner.formatOutput(result2));

// Test 3: Multiple console outputs
console.log('\n3. Testing multiple console outputs');
console.log('-'.repeat(40));

const result3 = runner.run(`
console.log("Line 1");
console.info("Info message");
console.warn("Warning message");
console.log("Result:", 42 * 2);
`);
console.log(runner.formatOutput(result3));

// Test 4: Error handling
console.log('\n4. Testing error handling');
console.log('-'.repeat(40));

const result4 = runner.run('throw new Error("Test error");');
console.log(runner.formatOutput(result4));

// Test 5: Object output
console.log('\n5. Testing object output');
console.log('-'.repeat(40));

const result5 = runner.run(`
const data = { name: "Test", values: [1, 2, 3] };
console.log(data);
data;
`);
console.log(runner.formatOutput(result5));

// Test 6: MarkdownRenderer code block detection
console.log('\n6. Testing MarkdownRenderer code block detection');
console.log('-'.repeat(40));

const md = new MarkdownRenderer({ 
    useColor: true, 
    enableCodeExecution: true,
    onLine: (line) => process.stdout.write(line)
});

const testMarkdown = `
Here's a simple JavaScript example:

\`\`\`javascript
// Calculate fibonacci
function fib(n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}
console.log("Fib(10):", fib(10));
\`\`\`

And here's some Python (not runnable):

\`\`\`python
print("Hello from Python")
\`\`\`

Another JS block:

\`\`\`js
const arr = [1, 2, 3, 4, 5];
console.log("Sum:", arr.reduce((a, b) => a + b, 0));
arr;
\`\`\`
`;

md.write(testMarkdown);
md.flush();

// Show captured blocks
console.log('\n\n7. Captured code blocks:');
console.log('-'.repeat(40));
const blocks = md.getCodeBlocks();
console.log(`Found ${blocks.length} runnable block(s):`);
for (const block of blocks) {
    console.log(`  [${block.id}] ${block.language}: ${block.code.split('\n')[0]}...`);
}

// Run captured blocks
console.log('\n8. Running captured blocks:');
console.log('-'.repeat(40));
for (const block of blocks) {
    console.log(`\n${ANSI.cyan}Running block [${block.id}] (${block.language}):${ANSI.reset}`);
    const result = runner.run(block.code);
    console.log(runner.formatOutput(result));
}

// Test 9: Sandbox security
console.log('\n9. Testing sandbox security');
console.log('-'.repeat(40));

const securityTests = [
    { name: 'require() blocked', code: 'require("fs")' },
    { name: 'setTimeout blocked', code: 'setTimeout(() => {}, 100)' },
    { name: 'process access limited', code: 'console.log(process.env.PATH)' }
];

for (const test of securityTests) {
    console.log(`\n${test.name}:`);
    const result = runner.run(test.code);
    console.log(runner.formatOutput(result));
}

console.log('\n' + '='.repeat(50));
console.log('✅ Code Runner tests completed!\n');