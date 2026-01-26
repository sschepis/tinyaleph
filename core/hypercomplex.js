/**
 * @class Hypercomplex
 * @description Generic Cayley-Dickson algebra of dimension 2^n
 * 
 * Dimension 2:  Complex numbers
 * Dimension 4:  Quaternions (non-commutative)
 * Dimension 8:  Octonions (non-associative)
 * Dimension 16: Sedenions (zero-divisors exist)
 * Dimension 32: Pathions (further structure loss)
 */

import { multiplyIndices } from './fano.js';

class Hypercomplex {
  constructor(dim, components = null) {
    if (!Number.isInteger(Math.log2(dim))) {
      throw new Error('Dimension must be power of 2');
    }
    this.dim = dim;
    this.c = components instanceof Float64Array
      ? components
      : new Float64Array(dim);
  }

  // Backward compatibility getter
  get components() {
    return this.c;
  }

  // Factory methods
  static zero(dim) { return new Hypercomplex(dim); }
  
  static basis(dim, index, value = 1) {
    const h = new Hypercomplex(dim);
    h.c[index] = value;
    return h;
  }
  
  static fromReal(dim, real) {
    const h = new Hypercomplex(dim);
    h.c[0] = real;
    return h;
  }
  
  static fromArray(arr) { 
    return new Hypercomplex(arr.length, Float64Array.from(arr)); 
  }
  
  // Arithmetic operations
  add(other) {
    const r = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) r.c[i] = this.c[i] + other.c[i];
    return r;
  }
  
  sub(other) {
    const r = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) r.c[i] = this.c[i] - other.c[i];
    return r;
  }
  
  // Alias for sub()
  subtract(other) {
    return this.sub(other);
  }
  
  scale(k) {
    const r = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) r.c[i] = this.c[i] * k;
    return r;
  }
  
  mul(other) {
    // Cayley-Dickson multiplication via table lookup
    const r = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        const [k, s] = multiplyIndices(this.dim, i, j);
        r.c[k] += s * this.c[i] * other.c[j];
      }
    }
    return r;
  }
  
  conjugate() {
    const r = new Hypercomplex(this.dim);
    r.c[0] = this.c[0];
    for (let i = 1; i < this.dim; i++) r.c[i] = -this.c[i];
    return r;
  }
  
  inverse() {
    const n2 = this.dot(this);
    if (n2 < 1e-10) return Hypercomplex.zero(this.dim);
    return this.conjugate().scale(1 / n2);
  }
  
  // Metrics
  norm() { return Math.sqrt(this.dot(this)); }
  
  normalize() {
    const n = this.norm();
    return n > 1e-10 ? this.scale(1 / n) : Hypercomplex.zero(this.dim);
  }
  
  dot(other) {
    let s = 0;
    for (let i = 0; i < this.dim; i++) s += this.c[i] * other.c[i];
    return s;
  }
  
  // Information theory
  entropy() {
    const n = this.norm();
    if (n < 1e-10) return 0;
    let h = 0;
    for (let i = 0; i < this.dim; i++) {
      const p = (this.c[i] / n) ** 2;
      if (p > 1e-10) h -= p * Math.log2(p);
    }
    return h;
  }
  
  coherence(other) {
    const n1 = this.norm(), n2 = other.norm();
    return (n1 > 1e-10 && n2 > 1e-10) ? Math.abs(this.dot(other)) / (n1 * n2) : 0;
  }
  
  // Zero-divisor detection (for dim >= 16)
  isZeroDivisorWith(other) {
    const prod = this.mul(other);
    return this.norm() > 0.1 && other.norm() > 0.1 && prod.norm() < 0.01;
  }
  
  // Dominant axes
  dominantAxes(n = 3) {
    return [...this.c]
      .map((v, i) => ({ i, v: Math.abs(v) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, n);
  }
  
  // ============================================
  // ADVANCED OPERATIONS: exp, log, pow, slerp
  // ============================================
  
  /**
   * Get the scalar (real) part
   */
  scalar() {
    return this.c[0];
  }
  
  /**
   * Get the vector (imaginary) part as a new Hypercomplex with zero scalar
   */
  vector() {
    const v = new Hypercomplex(this.dim);
    for (let i = 1; i < this.dim; i++) {
      v.c[i] = this.c[i];
    }
    return v;
  }
  
  /**
   * Get the norm of the vector part only
   */
  vectorNorm() {
    let s = 0;
    for (let i = 1; i < this.dim; i++) {
      s += this.c[i] * this.c[i];
    }
    return Math.sqrt(s);
  }
  
  /**
   * Hypercomplex exponential: e^q
   *
   * For q = a + v (scalar a, vector v):
   *   exp(q) = e^a * (cos|v| + v̂·sin|v|)
   *
   * where v̂ = v/|v| is the unit vector direction.
   *
   * This generalizes:
   * - Complex: e^(a+bi) = e^a(cos b + i·sin b)
   * - Quaternion: e^(a+v) = e^a(cos|v| + v̂·sin|v|)
   *
   * @returns {Hypercomplex} The exponential
   */
  exp() {
    const a = this.c[0]; // scalar part
    const vNorm = this.vectorNorm();
    
    const ea = Math.exp(a);
    const result = new Hypercomplex(this.dim);
    
    if (vNorm < 1e-10) {
      // Pure scalar: exp(a) = e^a
      result.c[0] = ea;
      return result;
    }
    
    // exp(a + v) = e^a * (cos|v| + v̂·sin|v|)
    const cosV = Math.cos(vNorm);
    const sinV = Math.sin(vNorm);
    
    result.c[0] = ea * cosV;
    
    // Vector part: e^a * sin|v| * v̂ = e^a * sin|v| * v/|v|
    const scale = ea * sinV / vNorm;
    for (let i = 1; i < this.dim; i++) {
      result.c[i] = scale * this.c[i];
    }
    
    return result;
  }
  
  /**
   * Hypercomplex logarithm: log(q)
   *
   * For q = a + v (scalar a, vector v):
   *   log(q) = log|q| + v̂·arccos(a/|q|)
   *
   * where v̂ = v/|v| is the unit vector direction.
   *
   * Note: Like complex log, this has branch cuts. We return the principal value.
   *
   * @returns {Hypercomplex} The natural logarithm
   */
  log() {
    const qNorm = this.norm();
    const vNorm = this.vectorNorm();
    
    const result = new Hypercomplex(this.dim);
    
    if (qNorm < 1e-10) {
      // log(0) is undefined, return large negative scalar
      result.c[0] = -Infinity;
      return result;
    }
    
    // Scalar part: log|q|
    result.c[0] = Math.log(qNorm);
    
    if (vNorm < 1e-10) {
      // Pure scalar: log(a) = ln(|a|) + π if a < 0
      if (this.c[0] < 0) {
        // Add π in the "first imaginary" direction as convention
        result.c[1] = Math.PI;
      }
      return result;
    }
    
    // Vector part: arccos(a/|q|) * v̂
    const theta = Math.acos(Math.max(-1, Math.min(1, this.c[0] / qNorm)));
    const scale = theta / vNorm;
    
    for (let i = 1; i < this.dim; i++) {
      result.c[i] = scale * this.c[i];
    }
    
    return result;
  }
  
  /**
   * Hypercomplex power: q^n
   *
   * Computed as: q^n = exp(n * log(q))
   *
   * Works for integer and fractional exponents.
   *
   * @param {number} n - The exponent
   * @returns {Hypercomplex} q raised to power n
   */
  pow(n) {
    if (n === 0) {
      return Hypercomplex.basis(this.dim, 0, 1); // Return 1
    }
    
    if (n === 1) {
      return this.clone();
    }
    
    if (n === -1) {
      return this.inverse();
    }
    
    // General case: q^n = exp(n * log(q))
    return this.log().scale(n).exp();
  }
  
  /**
   * Integer power using repeated squaring (more numerically stable)
   * @param {number} n - Integer exponent
   * @returns {Hypercomplex} q raised to integer power n
   */
  powInt(n) {
    if (!Number.isInteger(n)) {
      return this.pow(n);
    }
    
    if (n === 0) {
      return Hypercomplex.basis(this.dim, 0, 1);
    }
    
    if (n < 0) {
      return this.inverse().powInt(-n);
    }
    
    // Repeated squaring
    let result = Hypercomplex.basis(this.dim, 0, 1);
    let base = this.clone();
    
    while (n > 0) {
      if (n & 1) {
        result = result.mul(base);
      }
      base = base.mul(base);
      n >>= 1;
    }
    
    return result;
  }
  
  /**
   * Square root: q^(1/2)
   * @returns {Hypercomplex} Principal square root
   */
  sqrt() {
    return this.pow(0.5);
  }
  
  /**
   * Spherical Linear Interpolation (SLERP)
   *
   * Interpolates along the shortest arc on the unit hypersphere.
   * Both this and other should be normalized for proper geometric interpretation.
   *
   * slerp(q1, q2, t) = q1 * (q1^-1 * q2)^t
   *
   * Or equivalently:
   * slerp(q1, q2, t) = (sin((1-t)θ)/sin(θ)) * q1 + (sin(tθ)/sin(θ)) * q2
   *
   * where θ = arccos(q1·q2)
   *
   * @param {Hypercomplex} other - Target hypercomplex
   * @param {number} t - Interpolation parameter [0, 1]
   * @returns {Hypercomplex} Interpolated value
   */
  slerp(other, t) {
    // Compute dot product
    let dot = this.dot(other);
    
    // Handle antipodal case (choose shorter path)
    let q2 = other;
    if (dot < 0) {
      q2 = other.scale(-1);
      dot = -dot;
    }
    
    // Clamp dot to valid range for acos
    dot = Math.min(1, Math.max(-1, dot));
    
    // If very close, use linear interpolation to avoid division by zero
    if (dot > 0.9995) {
      const result = new Hypercomplex(this.dim);
      for (let i = 0; i < this.dim; i++) {
        result.c[i] = this.c[i] + t * (q2.c[i] - this.c[i]);
      }
      return result.normalize();
    }
    
    // Standard slerp formula
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    
    const s1 = Math.sin((1 - t) * theta) / sinTheta;
    const s2 = Math.sin(t * theta) / sinTheta;
    
    const result = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) {
      result.c[i] = s1 * this.c[i] + s2 * q2.c[i];
    }
    
    return result;
  }
  
  /**
   * Normalized Linear Interpolation (NLERP)
   *
   * Faster but non-constant velocity interpolation.
   *
   * @param {Hypercomplex} other - Target hypercomplex
   * @param {number} t - Interpolation parameter [0, 1]
   * @returns {Hypercomplex} Interpolated value
   */
  nlerp(other, t) {
    const result = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) {
      result.c[i] = (1 - t) * this.c[i] + t * other.c[i];
    }
    return result.normalize();
  }
  
  /**
   * Spherical Quadrangle Interpolation (SQUAD)
   *
   * Smooth cubic interpolation through a sequence of rotations.
   * Uses De Casteljau construction with slerp.
   *
   * squad(q1, a, b, q2, t) = slerp(slerp(q1, q2, t), slerp(a, b, t), 2t(1-t))
   *
   * The control points a and b are typically computed as:
   *   a = q1 * exp(-(log(q1^-1 * q2) + log(q1^-1 * q0)) / 4)
   *   b = q2 * exp(-(log(q2^-1 * q3) + log(q2^-1 * q1)) / 4)
   *
   * @param {Hypercomplex} a - First control point
   * @param {Hypercomplex} b - Second control point
   * @param {Hypercomplex} q2 - End point
   * @param {number} t - Interpolation parameter [0, 1]
   * @returns {Hypercomplex} Interpolated value
   */
  squad(a, b, q2, t) {
    const slerp1 = this.slerp(q2, t);
    const slerp2 = a.slerp(b, t);
    return slerp1.slerp(slerp2, 2 * t * (1 - t));
  }
  
  /**
   * Compute SQUAD control point for smooth path through [q0, q1, q2]
   *
   * @param {Hypercomplex} q0 - Previous point
   * @param {Hypercomplex} q2 - Next point
   * @returns {Hypercomplex} Control point for q1
   */
  squadControlPoint(q0, q2) {
    const q1Inv = this.inverse();
    
    const log1 = q1Inv.mul(q2).log();
    const log2 = q1Inv.mul(q0).log();
    
    const sum = log1.add(log2).scale(-0.25);
    
    return this.mul(sum.exp());
  }
  
  /**
   * Sandwich product: q * v * q*
   *
   * This is the fundamental rotation/reflection operation.
   * For unit quaternions, this rotates a vector v by the rotation represented by q.
   *
   * @param {Hypercomplex} v - Vector to transform (can have any scalar part)
   * @returns {Hypercomplex} Transformed vector
   */
  sandwich(v) {
    return this.mul(v).mul(this.conjugate());
  }
  
  /**
   * Apply rotation to a pure vector (zero scalar part)
   *
   * For quaternions, this is the standard way to rotate 3D vectors:
   * v' = q * (0 + v) * q*
   *
   * @param {number[]} vec - Vector as array [x, y, z, ...] (length = dim - 1)
   * @returns {number[]} Rotated vector
   */
  rotateVector(vec) {
    // Create pure vector hypercomplex (zero scalar)
    const v = new Hypercomplex(this.dim);
    for (let i = 0; i < Math.min(vec.length, this.dim - 1); i++) {
      v.c[i + 1] = vec[i];
    }
    
    // Apply sandwich product
    const rotated = this.sandwich(v);
    
    // Extract vector part
    const result = new Array(this.dim - 1);
    for (let i = 0; i < this.dim - 1; i++) {
      result[i] = rotated.c[i + 1];
    }
    
    return result;
  }
  
  /**
   * Create a rotation hypercomplex from axis-angle representation
   *
   * For quaternions: q = cos(θ/2) + sin(θ/2) * (axis)
   *
   * @param {number} dim - Dimension
   * @param {number[]} axis - Rotation axis (will be normalized)
   * @param {number} angle - Rotation angle in radians
   * @returns {Hypercomplex} Rotation hypercomplex
   */
  static fromAxisAngle(dim, axis, angle) {
    const h = new Hypercomplex(dim);
    
    // Normalize axis
    let axisNorm = 0;
    for (const a of axis) axisNorm += a * a;
    axisNorm = Math.sqrt(axisNorm);
    
    if (axisNorm < 1e-10) {
      h.c[0] = 1;
      return h;
    }
    
    const halfAngle = angle / 2;
    const sinHalf = Math.sin(halfAngle);
    const cosHalf = Math.cos(halfAngle);
    
    h.c[0] = cosHalf;
    
    // Map axis to imaginary components
    const n = Math.min(axis.length, dim - 1);
    for (let i = 0; i < n; i++) {
      h.c[i + 1] = sinHalf * axis[i] / axisNorm;
    }
    
    return h;
  }
  
  /**
   * Extract axis and angle from a unit hypercomplex
   *
   * @returns {object} { axis: number[], angle: number }
   */
  toAxisAngle() {
    const h = this.normalize();
    
    // Clamp scalar part for acos
    const cosHalf = Math.max(-1, Math.min(1, h.c[0]));
    const angle = 2 * Math.acos(cosHalf);
    
    const sinHalf = Math.sin(angle / 2);
    
    const axis = new Array(this.dim - 1);
    if (Math.abs(sinHalf) < 1e-10) {
      // Near identity rotation, axis is arbitrary
      axis.fill(0);
      axis[0] = 1;
    } else {
      for (let i = 0; i < this.dim - 1; i++) {
        axis[i] = h.c[i + 1] / sinHalf;
      }
    }
    
    return { axis, angle };
  }
  
  /**
   * Create rotation between two vectors
   *
   * @param {number} dim - Dimension
   * @param {number[]} from - Source vector
   * @param {number[]} to - Target vector
   * @returns {Hypercomplex} Rotation hypercomplex
   */
  static rotationBetween(dim, from, to) {
    // Normalize inputs
    let fromNorm = 0, toNorm = 0;
    for (let i = 0; i < from.length; i++) fromNorm += from[i] * from[i];
    for (let i = 0; i < to.length; i++) toNorm += to[i] * to[i];
    fromNorm = Math.sqrt(fromNorm);
    toNorm = Math.sqrt(toNorm);
    
    const fromUnit = from.map(x => x / fromNorm);
    const toUnit = to.map(x => x / toNorm);
    
    // Compute cross product for axis (works in 3D, generalize for higher)
    // For now, assume 3D cross product
    if (fromUnit.length >= 3 && toUnit.length >= 3) {
      const axis = [
        fromUnit[1] * toUnit[2] - fromUnit[2] * toUnit[1],
        fromUnit[2] * toUnit[0] - fromUnit[0] * toUnit[2],
        fromUnit[0] * toUnit[1] - fromUnit[1] * toUnit[0]
      ];
      
      // Compute angle from dot product
      let dot = 0;
      for (let i = 0; i < 3; i++) dot += fromUnit[i] * toUnit[i];
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      
      return Hypercomplex.fromAxisAngle(dim, axis, angle);
    }
    
    // Fallback: identity rotation
    return Hypercomplex.basis(dim, 0, 1);
  }
  
  /**
   * Get the angle of rotation (for unit hypercomplex)
   * @returns {number} Rotation angle in radians
   */
  angle() {
    const cosHalf = Math.max(-1, Math.min(1, this.c[0] / this.norm()));
    return 2 * Math.acos(cosHalf);
  }
  
  /**
   * Check if this is a unit hypercomplex (norm ≈ 1)
   * @param {number} tolerance - Tolerance for comparison
   */
  isUnit(tolerance = 1e-6) {
    return Math.abs(this.norm() - 1) < tolerance;
  }
  
  /**
   * Linear interpolation (component-wise, not normalized)
   * @param {Hypercomplex} other - Target
   * @param {number} t - Interpolation parameter
   */
  lerp(other, t) {
    const result = new Hypercomplex(this.dim);
    for (let i = 0; i < this.dim; i++) {
      result.c[i] = (1 - t) * this.c[i] + t * other.c[i];
    }
    return result;
  }
  
  // Serialization
  toArray() { return [...this.c]; }
  
  clone() {
    return new Hypercomplex(this.dim, Float64Array.from(this.c));
  }
  
  /**
   * String representation
   */
  toString() {
    const parts = [];
    const labels = ['', 'i', 'j', 'k', 'e4', 'e5', 'e6', 'e7',
                    'e8', 'e9', 'e10', 'e11', 'e12', 'e13', 'e14', 'e15'];
    
    for (let i = 0; i < this.dim; i++) {
      if (Math.abs(this.c[i]) > 1e-10) {
        const label = labels[i] || `e${i}`;
        const sign = this.c[i] >= 0 && parts.length > 0 ? '+' : '';
        parts.push(`${sign}${this.c[i].toFixed(4)}${label}`);
      }
    }
    
    return parts.length > 0 ? parts.join('') : '0';
  }
}

export {
    Hypercomplex
};