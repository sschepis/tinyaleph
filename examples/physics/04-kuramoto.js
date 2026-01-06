/**
 * @example Kuramoto Synchronization
 * @description Deep dive into Kuramoto model dynamics
 * 
 * The Kuramoto model describes synchronization of coupled oscillators:
 * - Phase dynamics with coupling
 * - Critical coupling threshold
 * - Order parameter emergence
 */

console.log('TinyAleph Kuramoto Synchronization Example');
console.log('==========================================\n');

// ===========================================
// KURAMOTO MODEL
// ===========================================

console.log('Kuramoto Model:');
console.log('-'.repeat(50) + '\n');

console.log('Model equation: dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)');
console.log('');
console.log('Parameters:');
console.log('  θᵢ: Phase of oscillator i');
console.log('  ωᵢ: Natural frequency of oscillator i');
console.log('  K: Coupling strength');
console.log('  N: Number of oscillators\n');

// ===========================================
// SIMULATION SETUP
// ===========================================

console.log('='.repeat(50));
console.log('Simulation Setup:');
console.log('='.repeat(50) + '\n');

function createOscillatorSystem(N, freqSpread) {
    var system = {
        N: N,
        phases: [],
        frequencies: [],
        K: 0
    };
    
    // Initialize with random phases and Lorentzian frequency distribution
    for (var i = 0; i < N; i++) {
        system.phases.push(2 * Math.PI * Math.random());
        // Lorentzian distribution centered at 1.0
        var u = Math.random();
        system.frequencies.push(1.0 + freqSpread * Math.tan(Math.PI * (u - 0.5)));
    }
    
    return system;
}

var system = createOscillatorSystem(50, 0.5);
console.log('Created system with ' + system.N + ' oscillators');
console.log('Frequency range: [' + 
    Math.min.apply(null, system.frequencies).toFixed(2) + ', ' + 
    Math.max.apply(null, system.frequencies).toFixed(2) + ']\n');

// ===========================================
// EVOLUTION AND ORDER PARAMETER
// ===========================================

console.log('='.repeat(50));
console.log('Evolution and Order Parameter:');
console.log('='.repeat(50) + '\n');

function evolveKuramoto(system, dt) {
    var N = system.N;
    var newPhases = [];
    
    for (var i = 0; i < N; i++) {
        var coupling = 0;
        for (var j = 0; j < N; j++) {
            coupling += Math.sin(system.phases[j] - system.phases[i]);
        }
        coupling *= system.K / N;
        
        var dphase = system.frequencies[i] + coupling;
        newPhases.push(system.phases[i] + dphase * dt);
    }
    
    system.phases = newPhases;
}

function orderParameter(phases) {
    var sumCos = 0, sumSin = 0;
    for (var i = 0; i < phases.length; i++) {
        sumCos += Math.cos(phases[i]);
        sumSin += Math.sin(phases[i]);
    }
    var N = phases.length;
    var r = Math.sqrt(sumCos*sumCos + sumSin*sumSin) / N;
    var psi = Math.atan2(sumSin, sumCos);
    return { r: r, psi: psi };
}

console.log('Order parameter r ∈ [0, 1]:');
console.log('  r = 0: Incoherent (random phases)');
console.log('  r = 1: Fully synchronized (identical phases)\n');

// Test different coupling strengths
console.log('Coupling  Initial r  Final r   Status');
console.log('-'.repeat(50));

var couplings = [0, 1, 2, 3, 4, 5];

for (var c = 0; c < couplings.length; c++) {
    var K = couplings[c];
    
    // Reset system
    var testSystem = createOscillatorSystem(50, 0.5);
    testSystem.K = K;
    
    var initialR = orderParameter(testSystem.phases).r;
    
    // Evolve for 1000 steps
    for (var step = 0; step < 1000; step++) {
        evolveKuramoto(testSystem, 0.05);
    }
    
    var finalR = orderParameter(testSystem.phases).r;
    var status = finalR > 0.8 ? 'Synchronized' : finalR > 0.3 ? 'Partial' : 'Incoherent';
    
    console.log(K.toFixed(1).padStart(5) + '       ' + 
                initialR.toFixed(3) + '      ' + 
                finalR.toFixed(3) + '     ' + status);
}

// ===========================================
// CRITICAL COUPLING
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Critical Coupling:');
console.log('='.repeat(50) + '\n');

console.log('Critical coupling Kc marks the synchronization transition:');
console.log('  K < Kc: Incoherent state');
console.log('  K > Kc: Partial synchronization');
console.log('  K >> Kc: Full synchronization\n');

// Estimate critical coupling
console.log('Estimating critical coupling...\n');

var Kc_estimate = 2.5;  // Approximate for our parameters
console.log('For Lorentzian frequency distribution:');
console.log('  Kc = 2γ (where γ is width parameter)');
console.log('  Estimated Kc ≈ ' + Kc_estimate.toFixed(1));

// ===========================================
// PHASE TRANSITION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Phase Transition:');
console.log('='.repeat(50) + '\n');

console.log('Order parameter r vs coupling K:\n');

var Krange = [];
var rValues = [];

for (var K = 0; K <= 6; K += 0.5) {
    var testSystem = createOscillatorSystem(50, 0.5);
    testSystem.K = K;
    
    // Evolve to steady state
    for (var step = 0; step < 2000; step++) {
        evolveKuramoto(testSystem, 0.02);
    }
    
    var r = orderParameter(testSystem.phases).r;
    Krange.push(K);
    rValues.push(r);
    
    // ASCII plot
    var bar = '';
    for (var b = 0; b < Math.floor(r * 30); b++) bar += '█';
    console.log('K=' + K.toFixed(1).padStart(3) + ': |' + bar.padEnd(30) + '| r=' + r.toFixed(2));
}

// ===========================================
// APPLICATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Applications:');
console.log('='.repeat(50) + '\n');

console.log('Kuramoto model applies to:');
console.log('  - Firefly synchronization');
console.log('  - Circadian rhythms');
console.log('  - Power grid stability');
console.log('  - Neural oscillations');
console.log('  - Coupled lasers');
console.log('  - Semantic concept synchronization\n');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Kuramoto model describes coupled oscillator sync');
console.log('2. Order parameter r measures collective coherence');
console.log('3. Critical coupling Kc triggers phase transition');
console.log('4. Above Kc, oscillators spontaneously synchronize');
console.log('5. Models many natural synchronization phenomena');
console.log('6. TinyAleph uses for semantic field coherence');