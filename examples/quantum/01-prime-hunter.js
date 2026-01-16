/**
 * Quantum Prime Hunter
 * 
 * Demonstrates the use of the WaveformAnalyzer to scan for prime candidates
 * using quantum resonance patterns derived from the Riemann Zeta function.
 */

const { WaveformAnalyzer } = require('../../apps/sentient/lib/quantum/analyzer');
const { calculateWaveform } = require('../../apps/sentient/lib/quantum/math');

// ANSI colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

console.log(colors.bright + 'Quantum Prime Hunter' + colors.reset);
console.log('Scanning for prime resonance using Riemann Zeta zeros...\n');

const analyzer = new WaveformAnalyzer();

// Configuration
const START = 100;
const END = 200;
const THRESHOLD = 0.5;

console.log(`Range: [${START}, ${END}]`);
console.log(`Resonance Threshold: ${THRESHOLD}\n`);

// Perform analysis
const results = analyzer.analyzeRange(START, END);

console.log('ID | Value | Resonance | Actual Prime? | Status');
console.log('---|-------|-----------|---------------|-------');

let hits = 0;
let falsePositives = 0;
let primesFound = 0;

results.forEach((r, index) => {
    // Only show results with significant resonance
    if (r.resonance > THRESHOLD) {
        const isPrimeStr = r.isPrime ? colors.green + 'YES' + colors.reset : colors.red + 'NO ' + colors.reset;
        const resonanceStr = r.resonance.toFixed(4);
        
        let status = '';
        if (r.isPrime) {
            status = colors.green + '✓ MATCH' + colors.reset;
            hits++;
            primesFound++;
        } else {
            status = colors.yellow + '? GHOST' + colors.reset;
            falsePositives++;
        }

        console.log(`${String(index).padStart(2)} | ${String(r.x).padStart(5)} | ${resonanceStr}    | ${isPrimeStr}           | ${status}`);
    } else if (r.isPrime) {
        // Missed prime (shouldn't happen often with good threshold)
        primesFound++;
    }
});

console.log('\nAnalysis Summary:');
console.log(`Total Primes in Range: ${primesFound}`);
console.log(`Quantum Hits: ${hits}`);
console.log(`False Positives (Ghost Resonance): ${falsePositives}`);

// Show a specific detailed waveform for the highest resonance found
const bestMatch = results.reduce((prev, current) => (prev.resonance > current.resonance) ? prev : current);

if (bestMatch) {
    console.log(`\nDetailed analysis for highest resonance at x=${bestMatch.x}:`);
    console.log(`Waveform Amplitude: ${calculateWaveform(bestMatch.x).toFixed(4)}`);
    console.log('Note: High negative amplitude in the explicit formula corresponds to prime locations.');
}
