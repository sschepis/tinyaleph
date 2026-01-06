/**
 * @example Quaternions
 * @description Explore quaternion algebra using hypercomplex numbers
 * 
 * Quaternions are 4-dimensional hypercomplex numbers:
 * - q = a + bi + cj + dk
 * - Used for 3D rotations without gimbal lock
 * - Non-commutative multiplication
 */

const { Hypercomplex } = require('../../modular');

console.log('TinyAleph Quaternion Example');
console.log('============================\n');

// ===========================================
// QUATERNION BASICS
// ===========================================

console.log('Quaternion Basics:');
console.log('-'.repeat(50) + '\n');

console.log('Quaternions: q = a + bi + cj + dk');
console.log('Where: i² = j² = k² = ijk = -1\n');

// Create quaternions using Hypercomplex with dimension 4
function createQuaternion(a, b, c, d) {
    var q = Hypercomplex.zero(4);
    q.c[0] = a;  // Real part
    q.c[1] = b;  // i component
    q.c[2] = c;  // j component
    q.c[3] = d;  // k component
    return q;
}

function quaternionToString(q) {
    var parts = [];
    if (q.c[0] !== 0) parts.push(q.c[0].toFixed(3));
    if (q.c[1] !== 0) parts.push(q.c[1].toFixed(3) + 'i');
    if (q.c[2] !== 0) parts.push(q.c[2].toFixed(3) + 'j');
    if (q.c[3] !== 0) parts.push(q.c[3].toFixed(3) + 'k');
    return parts.length > 0 ? parts.join(' + ').replace(/\+ -/g, '- ') : '0';
}

var q1 = createQuaternion(1, 2, 3, 4);
var q2 = createQuaternion(2, -1, 1, 3);

console.log('q1 = ' + quaternionToString(q1));
console.log('q2 = ' + quaternionToString(q2));

// ===========================================
// QUATERNION OPERATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Quaternion Operations:');
console.log('='.repeat(50) + '\n');

// Addition
function quaternionAdd(q1, q2) {
    var result = Hypercomplex.zero(4);
    for (var i = 0; i < 4; i++) {
        result.c[i] = q1.c[i] + q2.c[i];
    }
    return result;
}

var sum = quaternionAdd(q1, q2);
console.log('Addition:');
console.log('  q1 + q2 = ' + quaternionToString(sum));

// Quaternion multiplication (Hamilton product)
function quaternionMul(q1, q2) {
    var a1 = q1.c[0], b1 = q1.c[1], c1 = q1.c[2], d1 = q1.c[3];
    var a2 = q2.c[0], b2 = q2.c[1], c2 = q2.c[2], d2 = q2.c[3];
    
    var result = Hypercomplex.zero(4);
    result.c[0] = a1*a2 - b1*b2 - c1*c2 - d1*d2;
    result.c[1] = a1*b2 + b1*a2 + c1*d2 - d1*c2;
    result.c[2] = a1*c2 - b1*d2 + c1*a2 + d1*b2;
    result.c[3] = a1*d2 + b1*c2 - c1*b2 + d1*a2;
    
    return result;
}

var prod = quaternionMul(q1, q2);
console.log('\nMultiplication:');
console.log('  q1 * q2 = ' + quaternionToString(prod));

// Non-commutativity
var prod2 = quaternionMul(q2, q1);
console.log('  q2 * q1 = ' + quaternionToString(prod2));
console.log('  Non-commutative: q1*q2 ≠ q2*q1');

// Conjugate
function quaternionConjugate(q) {
    var result = Hypercomplex.zero(4);
    result.c[0] = q.c[0];
    result.c[1] = -q.c[1];
    result.c[2] = -q.c[2];
    result.c[3] = -q.c[3];
    return result;
}

var conj = quaternionConjugate(q1);
console.log('\nConjugate:');
console.log('  q1* = ' + quaternionToString(conj));

// Norm
function quaternionNorm(q) {
    return Math.sqrt(q.c[0]*q.c[0] + q.c[1]*q.c[1] + q.c[2]*q.c[2] + q.c[3]*q.c[3]);
}

console.log('\nNorm:');
console.log('  |q1| = ' + quaternionNorm(q1).toFixed(4));

// ===========================================
// UNIT QUATERNIONS AND ROTATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Unit Quaternions and 3D Rotations:');
console.log('='.repeat(50) + '\n');

console.log('Unit quaternions (|q| = 1) represent 3D rotations.');
console.log('Rotation by angle θ around axis (x, y, z):');
console.log('  q = cos(θ/2) + sin(θ/2)(xi + yj + zk)\n');

function rotationQuaternion(axis, angle) {
    // Normalize axis
    var mag = Math.sqrt(axis[0]*axis[0] + axis[1]*axis[1] + axis[2]*axis[2]);
    var x = axis[0] / mag;
    var y = axis[1] / mag;
    var z = axis[2] / mag;
    
    var halfAngle = angle / 2;
    var s = Math.sin(halfAngle);
    
    return createQuaternion(
        Math.cos(halfAngle),
        x * s,
        y * s,
        z * s
    );
}

// 90 degree rotation around Z axis
var rotation = rotationQuaternion([0, 0, 1], Math.PI / 2);
console.log('90° rotation around Z axis:');
console.log('  q = ' + quaternionToString(rotation));
console.log('  |q| = ' + quaternionNorm(rotation).toFixed(4) + ' (unit quaternion)');

// Rotate a vector
function rotateVector(v, q) {
    // v' = q * v * q*
    var vQuat = createQuaternion(0, v[0], v[1], v[2]);
    var qConj = quaternionConjugate(q);
    
    var result = quaternionMul(quaternionMul(q, vQuat), qConj);
    return [result.c[1], result.c[2], result.c[3]];
}

var original = [1, 0, 0];
var rotated = rotateVector(original, rotation);

console.log('\nRotating vector [1, 0, 0]:');
console.log('  Original: [' + original.join(', ') + ']');
console.log('  Rotated:  [' + rotated.map(function(v) { return v.toFixed(4); }).join(', ') + ']');
console.log('  Expected: [0, 1, 0] (90° around Z)');

// ===========================================
// QUATERNION INTERPOLATION (SLERP)
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Quaternion Interpolation (SLERP):');
console.log('='.repeat(50) + '\n');

console.log('SLERP smoothly interpolates between rotations.\n');

function slerp(q1, q2, t) {
    // Compute dot product
    var dot = q1.c[0]*q2.c[0] + q1.c[1]*q2.c[1] + q1.c[2]*q2.c[2] + q1.c[3]*q2.c[3];
    
    // If negative dot, negate one quaternion
    if (dot < 0) {
        q2 = createQuaternion(-q2.c[0], -q2.c[1], -q2.c[2], -q2.c[3]);
        dot = -dot;
    }
    
    // Clamp
    dot = Math.min(dot, 1);
    
    var theta = Math.acos(dot);
    var sinTheta = Math.sin(theta);
    
    var result = Hypercomplex.zero(4);
    
    if (sinTheta < 0.001) {
        // Linear interpolation for small angles
        for (var i = 0; i < 4; i++) {
            result.c[i] = (1 - t) * q1.c[i] + t * q2.c[i];
        }
    } else {
        var a = Math.sin((1 - t) * theta) / sinTheta;
        var b = Math.sin(t * theta) / sinTheta;
        for (var i = 0; i < 4; i++) {
            result.c[i] = a * q1.c[i] + b * q2.c[i];
        }
    }
    
    return result;
}

var q_start = rotationQuaternion([0, 0, 1], 0);
var q_end = rotationQuaternion([0, 0, 1], Math.PI);

console.log('Interpolating 0° to 180° rotation around Z:');
var ts = [0, 0.25, 0.5, 0.75, 1.0];
for (var i = 0; i < ts.length; i++) {
    var t = ts[i];
    var interp = slerp(q_start, q_end, t);
    console.log('  t=' + t.toFixed(2) + ': ' + quaternionToString(interp));
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Quaternions are 4D hypercomplex numbers');
console.log('2. Multiplication is non-commutative');
console.log('3. Unit quaternions represent 3D rotations');
console.log('4. No gimbal lock unlike Euler angles');
console.log('5. SLERP provides smooth rotation interpolation');
console.log('6. Used in 3D graphics, robotics, aerospace');