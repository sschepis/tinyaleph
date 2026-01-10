/**
 * Example 03: Gauge Symmetry from 108
 * 
 * Demonstrates how 108 = 2² × 3³ generates the Standard Model
 * gauge group SU(3) × SU(2) × U(1).
 */

const { GaugeSymmetry } = require('../../core/topology');
const { TWIST_108, factorize } = require('../../core/prime');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Gauge Symmetry from the 108 Invariant');
console.log('═══════════════════════════════════════════════════════════════\n');

// The factorization
console.log('1. The Factorization 108 = 2² × 3³\n');
console.log(`   108 = ${TWIST_108.binary} × ${TWIST_108.ternary}`);
console.log('       = 2² × 3³');
console.log('       = 4 × 27\n');
console.log('   This generates the complete Standard Model gauge structure.');

// SU(3) - Color
console.log('\n2. SU(3) Color Symmetry (Strong Force)\n');

const su3 = GaugeSymmetry.su3();
console.log(`   Name: ${su3.name}`);
console.log(`   Generator: 3³ = ${su3.generator}`);
console.log(`   Twist angle: ${su3.twistAngle}° (ternary rotation)`);
console.log(`   Symmetry type: ${su3.symmetryType}`);
console.log(`   Description: ${su3.description}`);
console.log('\n   Physical interpretation:');
console.log('   • Three color charges: red, green, blue');
console.log('   • 120° rotation between color states');
console.log('   • Quarks carry color, gluons carry color pairs');

// SU(2) - Weak
console.log('\n3. SU(2) Weak Isospin (Weak Force)\n');

const su2 = GaugeSymmetry.su2();
console.log(`   Name: ${su2.name}`);
console.log(`   Generator: 2² = ${su2.generator}`);
console.log(`   Twist angle: ${su2.twistAngle}° (binary rotation)`);
console.log(`   Symmetry type: ${su2.symmetryType}`);
console.log(`   Description: ${su2.description}`);
console.log('\n   Physical interpretation:');
console.log('   • Two isospin states: up/down');
console.log('   • 180° rotation between weak eigenstates');
console.log('   • W±, Z⁰ bosons mediate weak interactions');

// U(1) - Electromagnetic
console.log('\n4. U(1) Electromagnetic (EM Force)\n');

const u1 = GaugeSymmetry.u1();
console.log(`   Name: ${u1.name}`);
console.log(`   Generator: ${u1.generator} (full 108)`);
console.log(`   Twist angle: ${u1.twistAngle}° (complete rotation)`);
console.log(`   Symmetry type: ${u1.symmetryType}`);
console.log(`   Description: ${u1.description}`);
console.log('\n   Physical interpretation:');
console.log('   • Phase symmetry of charged particles');
console.log('   • 360° rotation returns to same state');
console.log('   • Photon is the gauge boson');

// Full Standard Model
console.log('\n5. Complete Standard Model Gauge Group\n');

const sm = GaugeSymmetry.standardModel();
console.log(`   Name: ${sm.name}`);
console.log(`   Generator: ${sm.generator}`);
console.log(`   Factorization: ${sm.factorization}`);
console.log(`   Description: ${sm.description}`);

console.log('\n   Component Summary:');
console.log('   ┌─────────┬───────────────┬───────────┬──────────────┐');
console.log('   │ Group   │ Force         │ Generator │ Twist Angle  │');
console.log('   ├─────────┼───────────────┼───────────┼──────────────┤');
for (const comp of sm.components) {
    console.log(`   │ ${comp.name.padEnd(7)} │ ${comp.type.padEnd(13)} │ ${comp.generator.toString().padEnd(9)} │ ${comp.twistAngle.toString().padEnd(4)}°        │`);
}
console.log('   └─────────┴───────────────┴───────────┴──────────────┘');

// Decomposing other numbers
console.log('\n6. Gauge Decomposition of Numbers\n');

const testNumbers = [108, 216, 324, 54, 72, 36, 12, 1836, 137];

console.log('   Analyzing gauge structure of various numbers:\n');
console.log('   ┌────────┬────────┬────────┬────────┬──────────────┐');
console.log('   │ Number │ SU(3)  │ SU(2)  │ U(1)   │ 108-Resonant │');
console.log('   ├────────┼────────┼────────┼────────┼──────────────┤');

for (const n of testNumbers) {
    const decomp = GaugeSymmetry.decompose(n);
    const resonant = decomp.is108Resonant ? '✓' : '✗';
    console.log(`   │ ${n.toString().padEnd(6)} │ ${decomp.su3Strength.toString().padEnd(6)} │ ${decomp.su2Strength.toString().padEnd(6)} │ ${decomp.u1Strength.toString().padEnd(6)} │ ${resonant.padEnd(12)} │`);
}

console.log('   └────────┴────────┴────────┴────────┴──────────────┘');

// Physical implications
console.log('\n7. Physical Implications\n');

console.log('   The 108 factorization explains why:');
console.log('   • The strong force has 3 color charges (from 3³)');
console.log('   • The weak force has 2 isospin states (from 2²)');
console.log('   • EM has 1 charge type (from full 108)');
console.log('   • These forces unify at high energies (GUT scale)');
console.log('\n   The 2² × 3³ structure is the minimal configuration');
console.log('   that closes under twist operations while preserving');
console.log('   both binary (weak) and ternary (strong) symmetries.');

console.log('\n═══════════════════════════════════════════════════════════════\n');