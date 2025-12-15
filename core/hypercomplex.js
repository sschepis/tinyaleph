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

const { multiplyIndices } = require('./fano');

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
  
  // Serialization
  toArray() { return [...this.c]; }
  
  clone() {
    return new Hypercomplex(this.dim, Float64Array.from(this.c));
  }
}

module.exports = { Hypercomplex };