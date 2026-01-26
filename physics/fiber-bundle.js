/**
 * Quantum Fiber Bundle Theory
 * 
 * Implements the geometric structure for state evolution and protection:
 * - Principal Bundle Framework (Base manifold M, Total space P)
 * - Berry Connection & Curvature
 * - Holonomy Operator for path-dependent memory
 * - Chern Classes for topological invariants
 * 
 * Based on 01_FIBER_BUNDLES.md
 */

import { Complex, normalizeComplex } from './primeon_z_ladder_u.js';

/**
 * Represents a point in the Base Manifold M (Configuration Space)
 */
class ManifoldPoint {
  constructor(coordinates) {
    this.coordinates = coordinates; // Array of numbers
  }

  distance(other) {
    return Math.sqrt(this.coordinates.reduce((sum, val, i) => sum + Math.pow(val - other.coordinates[i], 2), 0));
  }
}

/**
 * Geometric Phase Tracker using Berry Connection
 */
class BerryConnection {
  constructor(dimension) {
    this.dimension = dimension;
    this.history = [];
  }

  /**
   * Calculate local connection 1-form: A = i⟨ψ|d|ψ⟩
   * @param {Complex[]} psi Current state vector
   * @param {Complex[]} d_psi Change in state vector
   * @returns {Complex} Connection value
   */
  calculateConnection(psi, d_psi) {
    // Inner product ⟨ψ|d|ψ⟩
    let inner = new Complex(0, 0);
    for (let i = 0; i < psi.length; i++) {
      // ⟨ψ| is conjugate
      const bra = Complex.conj(psi[i]);
      const term = Complex.mul(bra, d_psi[i]);
      inner = Complex.add(inner, term);
    }
    
    // A = i * inner
    return Complex.mul(new Complex(0, 1), inner);
  }

  /**
   * Calculate Berry Curvature 2-form: F_μν = ∂_μA_ν - ∂_νA_μ - i[A_μ,A_ν]
   * Simplified for abelian U(1) case: F = dA
   * @param {Complex} A_mu Connection in direction mu
   * @param {Complex} A_nu Connection in direction nu
   * @param {number} d_mu Step size in mu
   * @param {number} d_nu Step size in nu
   */
  calculateCurvature(A_mu, A_nu, d_mu, d_nu) {
    // Approximation of dA
    const dA = Complex.sub(A_nu, A_mu);
    return Complex.scale(dA, 1 / (d_mu * d_nu)); // Simplified numerical derivative
  }
}

/**
 * Holonomy Operator for Path-Dependent Memory
 * U(C) = P exp(-i∮_C A_μdR^μ)
 */
class HolonomyOperator {
  constructor() {
    this.phase = new Complex(1, 0); // Start with identity
    this.pathIntegral = new Complex(0, 0);
  }

  /**
   * Update holonomy along a path segment
   * @param {Complex} connection Local Berry connection A
   * @param {number} stepSize Path segment length dR
   */
  transport(connection, stepSize) {
    // Integral accumulation: ∫ A dR
    const term = Complex.scale(connection, stepSize);
    this.pathIntegral = Complex.add(this.pathIntegral, term);
    
    // U = exp(-i * integral)
    const phaseArg = -1 * this.pathIntegral.re; // simplified for U(1) real phase
    // In full SU(N) this would be matrix exponential
    
    // Update phase factor
    // Note: A is imaginary-valued for normalized states, so -i*A is real
    // If A = i*a, then -i*A = a.
    // For general complex A:
    const exponent = Complex.mul(new Complex(0, -1), term);
    this.phase = Complex.mul(this.phase, Complex.exp(exponent.re)); // Approximation
  }
  
  /**
   * Get current holonomy factor
   */
  getFactor() {
    return this.phase;
  }
  
  reset() {
    this.phase = new Complex(1, 0);
    this.pathIntegral = new Complex(0, 0);
  }
}

/**
 * Topological Protection via Chern Classes
 */
class TopologicalProtection {
  constructor() {
    this.chernNumber = 0;
  }

  /**
   * Calculate First Chern Class c1 = 1/2π tr(F)
   * @param {Complex} curvature Berry curvature F
   */
  calculateChernClass(curvature) {
    // For U(1), trace is just the value
    // c1 = F / 2π
    // Taking imaginary part as F should be purely imaginary for unitary evolution
    return curvature.im / (2 * Math.PI);
  }

  /**
   * Integrate Chern class over manifold to get Chern number
   * @param {Complex[]} curvatures Array of curvature values over the manifold
   */
  computeChernNumber(curvatures) {
    let sum = 0;
    for (const F of curvatures) {
      sum += this.calculateChernClass(F);
    }
    // Chern number should be an integer for closed manifolds
    this.chernNumber = Math.round(sum);
    return this.chernNumber;
  }

  /**
   * Check if state is topologically protected (non-zero Chern number)
   */
  isProtected() {
    return this.chernNumber !== 0;
  }
}

/**
 * Fiber Bundle Manager
 * Orchestrates the geometric components
 */
class FiberBundle {
  constructor(dimension) {
    this.dimension = dimension;
    this.connection = new BerryConnection(dimension);
    this.holonomy = new HolonomyOperator();
    this.topology = new TopologicalProtection();
    this.currentState = null;
  }

  /**
   * Evolve state and update geometric factors
   * @param {Complex[]} newState New state vector
   * @param {number} stepSize Distance moved in parameter space
   */
  evolve(newState, stepSize = 0.01) {
    if (!this.currentState) {
      this.currentState = newState;
      return;
    }

    // Calculate change d|ψ⟩
    const d_psi = newState.map((v, i) => Complex.sub(v, this.currentState[i]));
    
    // Calculate Connection A
    const A = this.connection.calculateConnection(this.currentState, d_psi);
    
    // Update Holonomy
    this.holonomy.transport(A, stepSize);
    
    // Update state
    this.currentState = newState;
    
    return {
      connection: A,
      holonomy: this.holonomy.getFactor()
    };
  }
}

export {
  ManifoldPoint,
  BerryConnection,
  HolonomyOperator,
  TopologicalProtection,
  FiberBundle
};
