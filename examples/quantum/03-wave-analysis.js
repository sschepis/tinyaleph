/**
 * Waveform Analysis Visualization
 * 
 * Generates and visualizes the quantum waveform derived from Riemann Zeta zeros.
 * This script outputs an ASCII-art style chart to the console.
 */

const { generateWaveformRange } = require('../../apps/sentient/lib/quantum/math');

// Configuration
const START = 10;
const END = 40;
const STEP = 0.5;
const WIDTH = 60; // Width of ASCII chart

console.log('Quantum Waveform Analysis');
console.log('Visualizing Riemann Zeta zero interference pattern...\n');

const data = generateWaveformRange(START, END, STEP);

// Find min/max for scaling
let minVal = Infinity;
let maxVal = -Infinity;

data.forEach(p => {
    if (p.y < minVal) minVal = p.y;
    if (p.y > maxVal) maxVal = p.y;
});

console.log(`Range: [${START}, ${END}]`);
console.log(`Amplitude Range: [${minVal.toFixed(2)}, ${maxVal.toFixed(2)}]\n`);

// Draw Chart
data.forEach(p => {
    const x = p.x;
    const y = p.y;
    
    // Normalize y to 0..1
    const normalized = (y - minVal) / (maxVal - minVal);
    
    // Map to character position
    const pos = Math.round(normalized * WIDTH);
    
    // Create bar
    let line = '';
    const center = Math.round((0 - minVal) / (maxVal - minVal) * WIDTH);
    
    if (pos > center) {
        line = ' '.repeat(center) + '|' + '+'.repeat(pos - center);
    } else {
        line = ' '.repeat(pos) + '-'.repeat(center - pos) + '|';
    }
    
    // Label x-axis
    const label = x % 5 === 0 ? String(x).padEnd(3) : '   ';
    
    console.log(`${label} ${line}`);
});

console.log('\nLegend:');
console.log(' (+) Positive Interference (Constructive)');
console.log(' (-) Negative Interference (Destructive)');
console.log(' Note: Primes often correlate with specific interference patterns.');
