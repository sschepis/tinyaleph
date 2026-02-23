import { ATLAS, E8 } from '../core/atlas/index.js';
import assert from 'assert';

console.log('Testing Atlas...');
assert.strictEqual(ATLAS.numVertices, 96, 'Atlas should have 96 vertices');
assert.strictEqual(ATLAS.getUnityPositions().length, 2, 'Should have 2 unity positions');

const v0 = ATLAS.getUnityPositions()[0];
const v0_mirror = ATLAS.getMirror(v0);
assert.ok(ATLAS.isMirrorPair(v0, v0_mirror), 'Unity positions should be mirror pairs');
assert.ok(!ATLAS.isAdjacent(v0, v0_mirror), 'Mirror pairs should not be adjacent');

console.log('Testing E8...');
assert.strictEqual(E8.numRoots, 240, 'E8 should have 240 roots');

const roots = E8.roots;
let intRoots = 0;
let halfIntRoots = 0;

for (const r of roots) {
    let allEven = true;
    let allOdd = true;
    for (const c of r) {
        if (c % 2 !== 0) allEven = false;
        if (c % 2 === 0) allOdd = false;
    }
    if (allEven) intRoots++;
    else if (allOdd) halfIntRoots++;
    else throw new Error('Root is neither int nor half-int');
}

assert.strictEqual(intRoots, 112, '112 integer roots');
assert.strictEqual(halfIntRoots, 128, '128 half-integer roots');

console.log('All tests passed!');
