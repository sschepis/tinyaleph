/**
 * @example Vector Spaces
 * @description Explore vector space operations with hypercomplex numbers
 * 
 * Hypercomplex numbers form vector spaces where:
 * - Addition and scalar multiplication are defined
 * - Basis vectors span the space
 * - Linear combinations create new vectors
 */

const { Hypercomplex } = require('../../modular');

console.log('TinyAleph Vector Spaces Example');
console.log('================================\n');

// ===========================================
// VECTOR SPACE BASICS
// ===========================================

console.log('Vector Space Basics:');
console.log('-'.repeat(50) + '\n');

console.log('A vector space V over field F satisfies:');
console.log('  - Closed under addition: v + w ∈ V');
console.log('  - Closed under scalar multiplication: αv ∈ V');
console.log('  - Contains zero vector');
console.log('  - Additive inverses exist\n');

// Create vectors in R^4
function createVector(components) {
    var v = Hypercomplex.zero(components.length);
    for (var i = 0; i < components.length; i++) {
        v.c[i] = components[i];
    }
    return v;
}

function vectorToString(v) {
    return '[' + Array.from(v.c).map(function(x) { return x.toFixed(2); }).join(', ') + ']';
}

var v1 = createVector([1, 2, 3, 4]);
var v2 = createVector([2, -1, 0, 3]);

console.log('Vectors in R^4:');
console.log('  v1 = ' + vectorToString(v1));
console.log('  v2 = ' + vectorToString(v2));

// ===========================================
// VECTOR OPERATIONS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Vector Operations:');
console.log('='.repeat(50) + '\n');

// Addition
function vectorAdd(v1, v2) {
    var result = Hypercomplex.zero(v1.c.length);
    for (var i = 0; i < result.c.length; i++) {
        result.c[i] = v1.c[i] + v2.c[i];
    }
    return result;
}

var sum = vectorAdd(v1, v2);
console.log('Addition:');
console.log('  v1 + v2 = ' + vectorToString(sum));

// Scalar multiplication
function scalarMul(alpha, v) {
    var result = Hypercomplex.zero(v.c.length);
    for (var i = 0; i < result.c.length; i++) {
        result.c[i] = alpha * v.c[i];
    }
    return result;
}

var scaled = scalarMul(2.5, v1);
console.log('\nScalar multiplication:');
console.log('  2.5 * v1 = ' + vectorToString(scaled));

// Dot product
function dotProduct(v1, v2) {
    var sum = 0;
    for (var i = 0; i < v1.c.length; i++) {
        sum += v1.c[i] * v2.c[i];
    }
    return sum;
}

var dot = dotProduct(v1, v2);
console.log('\nDot product:');
console.log('  v1 · v2 = ' + dot.toFixed(2));

// ===========================================
// BASIS AND DIMENSION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Basis and Dimension:');
console.log('='.repeat(50) + '\n');

console.log('A basis is a set of linearly independent vectors that span V.');
console.log('Dimension = number of basis vectors.\n');

// Standard basis for R^4
var e1 = createVector([1, 0, 0, 0]);
var e2 = createVector([0, 1, 0, 0]);
var e3 = createVector([0, 0, 1, 0]);
var e4 = createVector([0, 0, 0, 1]);

console.log('Standard basis for R^4:');
console.log('  e1 = ' + vectorToString(e1));
console.log('  e2 = ' + vectorToString(e2));
console.log('  e3 = ' + vectorToString(e3));
console.log('  e4 = ' + vectorToString(e4));

// Express v1 in terms of basis
console.log('\nv1 = ' + v1.c[0] + '*e1 + ' + v1.c[1] + '*e2 + ' + v1.c[2] + '*e3 + ' + v1.c[3] + '*e4');

// ===========================================
// LINEAR INDEPENDENCE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Linear Independence:');
console.log('='.repeat(50) + '\n');

console.log('Vectors are linearly independent if:');
console.log('  α₁v₁ + α₂v₂ + ... = 0 implies all αᵢ = 0\n');

// Check if vectors are linearly dependent using Gram-Schmidt
function gramSchmidt(vectors) {
    var orthogonal = [];
    
    for (var i = 0; i < vectors.length; i++) {
        var v = createVector(Array.from(vectors[i].c));
        
        for (var j = 0; j < orthogonal.length; j++) {
            var proj = scalarMul(
                dotProduct(v, orthogonal[j]) / dotProduct(orthogonal[j], orthogonal[j]),
                orthogonal[j]
            );
            v = vectorAdd(v, scalarMul(-1, proj));
        }
        
        if (v.norm() > 0.0001) {
            orthogonal.push(v.normalize());
        }
    }
    
    return orthogonal;
}

var vectors = [v1, v2, createVector([3, 1, 3, 7])];
var orthogonalized = gramSchmidt(vectors);

console.log('Gram-Schmidt orthogonalization:');
console.log('  Input: ' + vectors.length + ' vectors');
console.log('  Output: ' + orthogonalized.length + ' orthogonal vectors');
console.log('  Rank: ' + orthogonalized.length);

// ===========================================
// INNER PRODUCT SPACE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Inner Product Space:');
console.log('='.repeat(50) + '\n');

console.log('An inner product space has:');
console.log('  - ⟨v, w⟩ = ⟨w, v⟩ (symmetry)');
console.log('  - ⟨αv, w⟩ = α⟨v, w⟩ (linearity)');
console.log('  - ⟨v, v⟩ ≥ 0 (positive definiteness)\n');

// Angle between vectors
function angleBetween(v1, v2) {
    var dot = dotProduct(v1, v2);
    var mag1 = v1.norm();
    var mag2 = v2.norm();
    return Math.acos(dot / (mag1 * mag2));
}

var angle = angleBetween(v1, v2);
console.log('Angle between v1 and v2:');
console.log('  θ = ' + (angle * 180 / Math.PI).toFixed(2) + '°');

// Projection
function project(v, onto) {
    var scalar = dotProduct(v, onto) / dotProduct(onto, onto);
    return scalarMul(scalar, onto);
}

var proj = project(v1, v2);
console.log('\nProjection of v1 onto v2:');
console.log('  proj = ' + vectorToString(proj));

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Hypercomplex numbers form vector spaces');
console.log('2. Addition and scalar multiplication are defined');
console.log('3. Basis vectors span the space');
console.log('4. Dimension = number of independent basis vectors');
console.log('5. Inner products enable angles and projections');
console.log('6. Gram-Schmidt produces orthogonal basis');