/**
 * @example Lyapunov Exponents
 * @description Analyze system stability using Lyapunov exponents
 * 
 * Lyapunov exponents measure sensitivity to initial conditions:
 * - Positive: chaotic, trajectories diverge
 * - Zero: marginally stable
 * - Negative: stable, trajectories converge
 */

const Lyapunov = require('../../physics/lyapunov');

console.log('TinyAleph Lyapunov Exponents Example');
console.log('====================================\n');

// ===========================================
// LYAPUNOV BASICS
// ===========================================

console.log('Lyapunov Exponent Basics:');
console.log('-'.repeat(50) + '\n');

console.log('Lyapunov exponent λ measures exponential separation:');
console.log('  |δx(t)| ≈ |δx(0)| e^(λt)');
console.log('');
console.log('  λ > 0: Chaotic (butterfly effect)');
console.log('  λ = 0: Marginally stable');
console.log('  λ < 0: Stable (perturbations decay)\n');

// ===========================================
// COMPUTING LYAPUNOV EXPONENTS
// ===========================================

console.log('='.repeat(50));
console.log('Computing Lyapunov Exponents:');
console.log('='.repeat(50) + '\n');

// Simple 1D map: f(x) = rx(1-x) (logistic map)
function logisticMap(x, r) {
    return r * x * (1 - x);
}

function logisticMapDerivative(x, r) {
    return r * (1 - 2 * x);
}

function computeLyapunov(r, x0, iterations, transient) {
    transient = transient || 100;
    
    var x = x0;
    
    // Skip transient
    for (var i = 0; i < transient; i++) {
        x = logisticMap(x, r);
    }
    
    // Compute Lyapunov exponent
    var sumLog = 0;
    for (var i = 0; i < iterations; i++) {
        var derivative = Math.abs(logisticMapDerivative(x, r));
        if (derivative > 0) {
            sumLog += Math.log(derivative);
        }
        x = logisticMap(x, r);
    }
    
    return sumLog / iterations;
}

// Test different r values for logistic map
var rValues = [2.5, 3.0, 3.5, 3.8, 4.0];

console.log('Logistic map: x_{n+1} = r * x_n * (1 - x_n)\n');
console.log('r      λ          Behavior');
console.log('-'.repeat(40));

for (var i = 0; i < rValues.length; i++) {
    var r = rValues[i];
    var lambda = computeLyapunov(r, 0.5, 1000);
    var behavior = lambda > 0 ? 'Chaotic' : lambda < -0.1 ? 'Stable fixed point' : 'Period doubling';
    console.log(r.toFixed(1) + '    ' + lambda.toFixed(4).padStart(7) + '    ' + behavior);
}

// ===========================================
// CHAOS IN LOGISTIC MAP
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Chaos in Logistic Map:');
console.log('='.repeat(50) + '\n');

console.log('At r=4.0, the logistic map is fully chaotic.\n');

// Show sensitive dependence
var x1 = 0.5;
var x2 = 0.5 + 1e-10;  // Tiny perturbation

console.log('Sensitivity to initial conditions (r=4.0):');
console.log('  x1(0) = 0.5');
console.log('  x2(0) = 0.5 + 10^(-10)\n');

console.log('Step    x1          x2          |x1-x2|');
console.log('-'.repeat(50));

for (var step = 0; step <= 50; step += 10) {
    var diff = Math.abs(x1 - x2);
    console.log(String(step).padStart(4) + '    ' + x1.toFixed(6).padStart(10) + '  ' + x2.toFixed(6).padStart(10) + '  ' + diff.toExponential(2));
    
    // Evolve 10 steps
    for (var s = 0; s < 10; s++) {
        x1 = logisticMap(x1, 4.0);
        x2 = logisticMap(x2, 4.0);
    }
}

console.log('\nNote: Tiny initial difference grows exponentially!');

// ===========================================
// STABILITY ANALYSIS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Stability Analysis:');
console.log('='.repeat(50) + '\n');

// Linear system stability
function linearSystemLyapunov(A) {
    // For 2x2 matrix, find eigenvalues
    var a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
    var trace = a + d;
    var det = a * d - b * c;
    
    var discriminant = trace * trace - 4 * det;
    
    if (discriminant >= 0) {
        var lambda1 = (trace + Math.sqrt(discriminant)) / 2;
        var lambda2 = (trace - Math.sqrt(discriminant)) / 2;
        return Math.max(Math.log(Math.abs(lambda1)), Math.log(Math.abs(lambda2)));
    } else {
        // Complex eigenvalues, magnitude is sqrt(det)
        return Math.log(Math.sqrt(det));
    }
}

var systems = [
    { name: 'Stable node', matrix: [[0.5, 0], [0, 0.3]] },
    { name: 'Saddle point', matrix: [[2, 0], [0, 0.25]] },
    { name: 'Stable spiral', matrix: [[0.9, 0.4], [-0.4, 0.9]] },
    { name: 'Unstable', matrix: [[1.1, 0], [0, 1.2]] }
];

console.log('Linear systems dx/dt = Ax:\n');
console.log('System          λ_max      Stability');
console.log('-'.repeat(45));

for (var i = 0; i < systems.length; i++) {
    var sys = systems[i];
    var lambda = linearSystemLyapunov(sys.matrix);
    var stability = lambda < 0 ? 'Stable' : lambda > 0 ? 'Unstable' : 'Marginal';
    console.log(sys.name.padEnd(16) + lambda.toFixed(4).padStart(7) + '      ' + stability);
}

// ===========================================
// PRACTICAL APPLICATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Practical Applications:');
console.log('='.repeat(50) + '\n');

console.log('Lyapunov exponents are used in:');
console.log('  - Weather prediction (limits of predictability)');
console.log('  - Cardiac dynamics (detecting arrhythmias)');
console.log('  - Financial markets (risk assessment)');
console.log('  - Neural networks (edge of chaos)');
console.log('  - Encryption (chaos-based cryptography)\n');

// Predictability horizon
console.log('Predictability horizon:');
console.log('  For λ > 0, prediction error doubles every T = ln(2)/λ time units.\n');

var lambda_weather = 1.0;  // Approximate for atmosphere
var initial_error = 1e-6;
var acceptable_error = 0.1;

var predictability = Math.log(acceptable_error / initial_error) / lambda_weather;
console.log('  Example: λ=' + lambda_weather + ', initial error=10^-6');
console.log('  Time until error reaches 0.1: ' + predictability.toFixed(1) + ' time units');

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Lyapunov exponents measure chaos');
console.log('2. λ > 0 indicates sensitive dependence');
console.log('3. Computed from derivative along trajectory');
console.log('4. Determines predictability horizon');
console.log('5. Used in stability analysis of dynamical systems');
console.log('6. TinyAleph uses λ to characterize semantic states');