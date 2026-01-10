/**
 * Example 04: Free Energy Dynamics
 * 
 * Demonstrates the cubic FEP dynamics from 108bio.pdf Section 4.2:
 * dψ/dt = αψ + βψ² + γψ³
 * 
 * This models consciousness as minimization of epistemic surprise.
 */

const { FreeEnergyDynamics, OBSERVER_HIERARCHY, observerCapacity } = require('../../core/topology');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Free Energy Dynamics: Cubic FEP Model');
console.log('═══════════════════════════════════════════════════════════════\n');

// Create FEP dynamics
console.log('1. The Cubic Free Energy Model\n');
console.log('   dψ/dt = αψ + βψ² + γψ³\n');
console.log('   Where:');
console.log('   • ψ represents the "understanding" state');
console.log('   • α controls linear drift');
console.log('   • β controls bifurcation (quadratic)');
console.log('   • γ provides stabilization (cubic)\n');

const fep = new FreeEnergyDynamics(0.1, -0.5, -0.1);
console.log(`   Parameters: α=${fep.alpha}, β=${fep.beta}, γ=${fep.gamma}`);

// Find fixed points
console.log('\n2. Fixed Points (Attractors)\n');

const fixedPoints = fep.fixedPoints();
console.log('   Fixed points of the dynamics (where dψ/dt = 0):\n');
for (const fp of fixedPoints) {
    const potential = fep.potential(fp.value);
    console.log(`   ψ = ${fp.value.toFixed(4)} → ${fp.stability} (V = ${potential.toFixed(4)})`);
}

// Trajectory simulation
console.log('\n3. Trajectory Simulation\n');

const trajectory = fep.simulate(0.2, 5, 0.05);
console.log('   Starting from ψ₀ = 0.2, simulating for t = 5:\n');
console.log('   ┌────────┬──────────┬────────────┐');
console.log('   │ Time   │ ψ        │ V(ψ)       │');
console.log('   ├────────┼──────────┼────────────┤');

// Sample every 20 steps
for (let i = 0; i < trajectory.length; i += 20) {
    const pt = trajectory[i];
    console.log(`   │ ${pt.t.toFixed(2).padStart(6)} │ ${pt.psi.toFixed(6).padStart(8)} │ ${pt.potential.toFixed(6).padStart(10)} │`);
}
console.log('   └────────┴──────────┴────────────┘');

// Compare different parameter regimes
console.log('\n4. Parameter Regime Exploration\n');

const regimes = [
    { name: 'Stable focus', alpha: 0.05, beta: -0.3, gamma: -0.05 },
    { name: 'Saddle', alpha: 0.2, beta: -0.1, gamma: -0.1 },
    { name: 'Bistable', alpha: 0.1, beta: 0.3, gamma: -0.2 },
    { name: 'Monostable', alpha: -0.1, beta: -0.2, gamma: -0.05 },
];

for (const regime of regimes) {
    const dynamics = new FreeEnergyDynamics(regime.alpha, regime.beta, regime.gamma);
    const fps = dynamics.fixedPoints();
    const stableCount = fps.filter(fp => fp.stability === 'stable').length;
    
    console.log(`   ${regime.name}:`);
    console.log(`     Parameters: α=${regime.alpha}, β=${regime.beta}, γ=${regime.gamma}`);
    console.log(`     Fixed points: ${fps.length}, Stable: ${stableCount}\n`);
}

// Observer hierarchy
console.log('5. Observer Hierarchy (from Table 1)\n');

console.log('   Different scales of observers from 108bio.pdf:\n');
console.log('   ┌────────────┬─────────────────────┬──────────────────────────┐');
console.log('   │ Scale      │ Oscillators         │ Observable Behavior      │');
console.log('   ├────────────┼─────────────────────┼──────────────────────────┤');

for (const level of OBSERVER_HIERARCHY) {
    const scale = level.scale.padEnd(10);
    const oscillators = (level.constituentOscillators || 'N/A').padEnd(19);
    const behavior = (level.observableBehavior || 'N/A').slice(0, 24).padEnd(24);
    console.log(`   │ ${scale} │ ${oscillators} │ ${behavior} │`);
}
console.log('   └────────────┴─────────────────────┴──────────────────────────┘');

// Observer capacity
console.log('\n6. Observer Capacity Calculation\n');
console.log('   C_obs = α·N_osc·K̄·τ⁻¹\n');
console.log('   Where:');
console.log('   • N_osc = number of oscillators');
console.log('   • K̄ = mean coupling strength');
console.log('   • τ = characteristic coherence time');
console.log('   • α = scaling constant\n');

const examples = [
    { name: 'Neural ensemble', N: 1000, K: 0.3, tau: 0.05, alpha: 1.0 },
    { name: 'Cognitive network', N: 10000, K: 0.5, tau: 0.2, alpha: 1.0 },
    { name: 'Social group', N: 100, K: 0.1, tau: 10.0, alpha: 1.0 },
];

for (const ex of examples) {
    const capacity = observerCapacity(ex.N, ex.K, ex.tau, ex.alpha);
    console.log(`   ${ex.name}:`);
    console.log(`     N=${ex.N}, K̄=${ex.K}, τ=${ex.tau}`);
    console.log(`     C_obs = ${capacity.toFixed(2)}\n`);
}

// Interpretation
console.log('7. Interpretation: Consciousness as Entropy Minimization\n');

console.log('   The cubic FEP dynamics models consciousness as:');
console.log('   1. Modal superposition → ψ represents superposed possibilities');
console.log('   2. Entropy gradient → dψ/dt driven by surprise minimization');
console.log('   3. Collapse to "now" → stable attractor = present moment');
console.log('   4. Multi-scale nesting → observers at each scale');
console.log('\n   High ψ = exploring/uncertain state');
console.log('   Low ψ = exploiting/certain state');
console.log('   Attractors = stable conscious states');

console.log('\n═══════════════════════════════════════════════════════════════\n');