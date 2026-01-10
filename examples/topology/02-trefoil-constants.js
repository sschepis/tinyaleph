/**
 * Example 02: Trefoil Knot and Physical Constants
 * 
 * Demonstrates how the Trefoil knot's topological invariants
 * combine with the 108 invariant to derive physical constants.
 */

const {
    Knot,
    TREFOIL,
    FIGURE_EIGHT,
    CINQUEFOIL,
    STANDARD_KNOTS,
    PhysicalConstants
} = require('../../core/topology');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Trefoil Knot and Physical Constant Derivation');
console.log('═══════════════════════════════════════════════════════════════\n');

// Trefoil invariants
console.log('1. The Trefoil Knot (3₁) - Minimal Stable Structure\n');

console.log('   Topological Invariants:');
console.log(`   • Crossing number (c): ${TREFOIL.crossings}`);
console.log(`   • Stick number (s):    ${TREFOIL.sticks}`);
console.log(`   • Bridge number (b):   ${TREFOIL.bridge}`);
console.log(`   • Unknotting (u):      ${TREFOIL.unknotting}`);

console.log('\n   Complexity Calculation:');
console.log(`   T = s·c - b + u`);
console.log(`   T = ${TREFOIL.sticks}×${TREFOIL.crossings} - ${TREFOIL.bridge} + ${TREFOIL.unknotting}`);
console.log(`   T = ${TREFOIL.sticks * TREFOIL.crossings} - ${TREFOIL.bridge} + ${TREFOIL.unknotting}`);
console.log(`   T = ${TREFOIL.complexity()}`);

// Mass ratio derivation
console.log('\n2. Proton-Electron Mass Ratio\n');

const massRatio = PhysicalConstants.protonElectronRatio();
console.log(`   Formula: ${massRatio.formula}`);
console.log(`   Derived value:      ${massRatio.derived}`);
console.log(`   Experimental value: ${massRatio.experimental}`);
console.log(`   Relative error:     ${(massRatio.relativeError * 100).toFixed(4)}%`);
console.log(`   Interpretation: ${massRatio.interpretation}`);

// Fine structure constant
console.log('\n3. Fine Structure Constant Inverse\n');

const alpha = PhysicalConstants.fineStructureInverse();
console.log(`   Formula: ${alpha.formula}`);
console.log(`   Derived value:      ${alpha.derived}`);
console.log(`   Experimental value: ${alpha.experimental}`);
console.log(`   Relative error:     ${(alpha.relativeError * 100).toFixed(4)}%`);
console.log(`   Interpretation: ${alpha.interpretation}`);

// Higgs mass
console.log('\n4. Higgs Boson Mass\n');

const higgs = PhysicalConstants.higgsMass();
console.log(`   Formula: ${higgs.formula}`);
console.log(`   Derived value:      ${higgs.derived} ${higgs.unit}`);
console.log(`   Experimental value: ${higgs.experimental} ${higgs.unit}`);
console.log(`   Relative error:     ${(higgs.relativeError * 100).toFixed(4)}%`);
console.log(`   Interpretation: ${higgs.interpretation}`);

// Compare other knots
console.log('\n5. Comparing Different Knots\n');

const knots = [TREFOIL, FIGURE_EIGHT, CINQUEFOIL];

console.log('   ┌──────────────┬────────┬────────┬────────┬─────────────┐');
console.log('   │ Knot         │ T      │ Genus  │ Prime? │ Mass Ratio  │');
console.log('   ├──────────────┼────────┼────────┼────────┼─────────────┤');

for (const knot of knots) {
    const T = knot.complexity();
    const genus = knot.genusLowerBound();
    const prime = knot.isPrimeKnot() ? 'Yes' : 'No';
    const ratio = knot.deriveMassRatio();
    console.log(`   │ ${knot.name.padEnd(12)} │ ${T.toString().padEnd(6)} │ ${genus.toString().padEnd(6)} │ ${prime.padEnd(6)} │ ${ratio.toString().padEnd(11)} │`);
}

console.log('   └──────────────┴────────┴────────┴────────┴─────────────┘');

// Framework validation
console.log('\n6. Framework Validation\n');

const validation = PhysicalConstants.validate();
console.log('   Validation Results:');
console.log(`   • Proton/electron ratio: ${validation.protonElectron.matches ? '✓ PASS' : '✗ FAIL'} (${(validation.protonElectron.accuracy * 100).toFixed(2)}% accurate)`);
console.log(`   • Fine structure:        ${validation.fineStructure.matches ? '✓ PASS' : '✗ FAIL'} (${(validation.fineStructure.accuracy * 100).toFixed(2)}% accurate)`);
console.log(`   • Higgs mass:            ${validation.higgs.matches ? '✓ PASS' : '✗ FAIL'} (${(validation.higgs.accuracy * 100).toFixed(2)}% accurate)`);
console.log(`\n   Overall: ${validation.overallValid ? '✓ Framework validated!' : '✗ Some predictions failed'}`);

// Custom knot creation
console.log('\n7. Custom Knot Analysis\n');

const customKnot = new Knot({
    name: 'Torus(3,7)',
    notation: 'T(3,7)',
    crossings: 12,  // (p-1)(q-1) for torus knot
    sticks: 14,
    bridge: 3,
    unknotting: 4
});

console.log(`   ${customKnot.name}:`);
console.log(`   Complexity: ${customKnot.complexity()}`);
console.log(`   Mass ratio: ${customKnot.deriveMassRatio()}`);
console.log(`   Is prime: ${customKnot.isPrimeKnot()}`);

console.log('\n═══════════════════════════════════════════════════════════════\n');