/**
 * @example Coupled Oscillators
 * @description Simulate coupled oscillator dynamics
 * 
 * TinyAleph's physics module includes oscillator simulations:
 * - Kuramoto model for synchronization
 * - Coupled phase dynamics
 * - Emergence of collective behavior
 */

const { Oscillator } = require('../../physics/oscillator');
const { KuramotoModel } = require('../../physics/kuramoto');

console.log('TinyAleph Coupled Oscillators Example');
console.log('=====================================\n');

// ===========================================
// SINGLE OSCILLATOR
// ===========================================

console.log('Single Oscillator:');
console.log('-'.repeat(50) + '\n');

var oscillator = new Oscillator(1.0, 0, 1.0);

console.log('Initial state:');
console.log('  Frequency: ' + oscillator.freq + ' Hz');
console.log('  Phase: ' + oscillator.phase.toFixed(4) + ' rad');
console.log('  Amplitude: ' + oscillator.amplitude);

// Evolve over time
console.log('\nTime evolution:');
var times = [0, 0.25, 0.5, 0.75, 1.0];
for (var i = 0; i < times.length; i++) {
    var t = times[i];
    var phase = oscillator.phase + 2 * Math.PI * oscillator.freq * t;
    var value = oscillator.amplitude * Math.sin(phase);
    console.log('  t=' + t.toFixed(2) + 's: phase=' + (phase % (2*Math.PI)).toFixed(3) + ', sin=' + value.toFixed(3));
}

// ===========================================
// KURAMOTO MODEL
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Kuramoto Model:');
console.log('='.repeat(50) + '\n');

console.log('Kuramoto model describes synchronization of coupled oscillators:');
console.log('  dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)\n');

var numOscillators = 5;
var naturalFreqs = [];
var phases = [];

// Initialize with random frequencies and phases
for (var i = 0; i < numOscillators; i++) {
    naturalFreqs.push(0.8 + 0.4 * Math.random());
    phases.push(2 * Math.PI * Math.random());
}

console.log('Initial state (5 oscillators):');
for (var i = 0; i < numOscillators; i++) {
    console.log('  Osc ' + i + ': ω=' + naturalFreqs[i].toFixed(3) + ', θ=' + phases[i].toFixed(3));
}

// Kuramoto evolution step
function kuramotoStep(phases, freqs, coupling, dt) {
    var N = phases.length;
    var newPhases = [];
    
    for (var i = 0; i < N; i++) {
        var interaction = 0;
        for (var j = 0; j < N; j++) {
            interaction += Math.sin(phases[j] - phases[i]);
        }
        interaction *= coupling / N;
        
        var dtheta = freqs[i] + interaction;
        newPhases.push(phases[i] + dtheta * dt);
    }
    
    return newPhases;
}

// Order parameter (measures synchronization)
function orderParameter(phases) {
    var sumCos = 0, sumSin = 0;
    for (var i = 0; i < phases.length; i++) {
        sumCos += Math.cos(phases[i]);
        sumSin += Math.sin(phases[i]);
    }
    return Math.sqrt(sumCos*sumCos + sumSin*sumSin) / phases.length;
}

// Simulate with different coupling strengths
console.log('\nSynchronization with coupling strength K:\n');

var couplings = [0, 0.5, 1.0, 2.0, 5.0];

for (var k = 0; k < couplings.length; k++) {
    var K = couplings[k];
    var currentPhases = phases.slice();
    
    // Evolve for 100 steps
    for (var step = 0; step < 100; step++) {
        currentPhases = kuramotoStep(currentPhases, naturalFreqs, K, 0.1);
    }
    
    var r = orderParameter(currentPhases);
    console.log('  K=' + K.toFixed(1) + ': order parameter r=' + r.toFixed(3) + ' (' + (r > 0.8 ? 'synchronized' : r > 0.5 ? 'partial' : 'desynchronized') + ')');
}

// ===========================================
// SYNCHRONIZATION DYNAMICS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Synchronization Dynamics:');
console.log('='.repeat(50) + '\n');

console.log('Evolution of order parameter over time (K=2.0):\n');

var K = 2.0;
var evolvePhases = phases.slice();

for (var step = 0; step <= 50; step += 10) {
    var r = orderParameter(evolvePhases);
    var bar = '';
    for (var b = 0; b < Math.floor(r * 20); b++) bar += '█';
    console.log('  Step ' + String(step).padStart(3) + ': r=' + r.toFixed(3) + ' |' + bar);
    
    // Evolve 10 steps
    for (var s = 0; s < 10; s++) {
        evolvePhases = kuramotoStep(evolvePhases, naturalFreqs, K, 0.1);
    }
}

// ===========================================
// PHASE DISTRIBUTION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Phase Distribution:');
console.log('='.repeat(50) + '\n');

// Show phase distribution at final state
console.log('Final phase distribution (mod 2π):');
var bins = new Array(8).fill(0);

for (var i = 0; i < evolvePhases.length; i++) {
    var normalizedPhase = ((evolvePhases[i] % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
    var bin = Math.floor(normalizedPhase / (2*Math.PI) * 8);
    if (bin >= 8) bin = 7;
    bins[bin]++;
}

for (var i = 0; i < 8; i++) {
    var start = (i * 45).toString().padStart(3);
    var end = ((i+1) * 45).toString().padStart(3);
    var bar = '';
    for (var b = 0; b < bins[i]; b++) bar += '█';
    console.log('  ' + start + '°-' + end + '°: ' + bar);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Oscillators evolve with characteristic frequency');
console.log('2. Kuramoto model couples oscillators via sine interaction');
console.log('3. Order parameter r measures synchronization level');
console.log('4. Above critical coupling, synchronization emerges');
console.log('5. Phase distribution narrows as system synchronizes');
console.log('6. Models fireflies, neurons, power grids, etc.');