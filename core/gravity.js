/**
 * Gravity Module - book.pdf Chapters 6 & 16
 * 
 * Implements metric emergence and symbolic gravity from:
 * "Resonant Foundations of Reality" by Sebastian Schepis
 * 
 * Key formalisms:
 * - Metric emergence: g_mn = Tr(Ψ_m Ψ_n)
 * - Symbolic curvature: G^(symbolic)_μν = ∇_μ∇_ν S - g_μν S
 * - Graviton formation: ∂_t Ψ₁ = γ(Ψ₁ × Ψ₁)
 * - Prime harmonic EM: E(x,t) = Σ E_p(x) e^(iω_p t), ω_p = log(p)
 */

import { PrimeState, Complex, PHI } from './hilbert.js';
import { firstNPrimes } from './prime.js';

// ============================================================================
// METRIC EMERGENCE (Chapter 6)
// ============================================================================

/**
 * MetricEmergence - Derive spacetime metric from symbolic fields
 * 
 * From book.pdf Eq. 6.1: g_mn = Tr(Ψ_m Ψ_n)
 * 
 * The metric tensor emerges from the inner product structure
 * of the Prime Hilbert Space.
 */
class MetricEmergence {
  constructor(dim = 4) {
    this.dim = dim;
    this.metric = new Array(dim).fill(null).map(() => 
      new Float64Array(dim)
    );
    // Initialize to Minkowski signature (-,+,+,+)
    this.metric[0][0] = -1;
    for (let i = 1; i < dim; i++) {
      this.metric[i][i] = 1;
    }
  }
  
  /**
   * Compute metric from array of field states
   * g_mn = Tr(Ψ_m · Ψ_n) = ⟨Ψ_m|Ψ_n⟩
   * 
   * @param {Array<PrimeState>} fieldStates - Array of dim PrimeStates
   * @returns {Array<Array<number>>} Emergent metric tensor
   */
  fromFieldStates(fieldStates) {
    if (fieldStates.length !== this.dim) {
      throw new Error(`Need ${this.dim} field states, got ${fieldStates.length}`);
    }
    
    for (let m = 0; m < this.dim; m++) {
      for (let n = m; n < this.dim; n++) {
        // g_mn = Re(⟨Ψ_m|Ψ_n⟩)
        const inner = fieldStates[m].inner(fieldStates[n]);
        this.metric[m][n] = inner.re;
        this.metric[n][m] = inner.re; // Symmetric
      }
    }
    
    return this.metric;
  }
  
  /**
   * Compute metric determinant
   */
  determinant() {
    // For 4x4, use explicit formula
    if (this.dim === 4) {
      const m = this.metric;
      return this._det4x4(m);
    }
    // General case: LU decomposition
    return this._luDeterminant();
  }
  
  _det4x4(m) {
    return (
      m[0][0] * (
        m[1][1] * (m[2][2] * m[3][3] - m[2][3] * m[3][2]) -
        m[1][2] * (m[2][1] * m[3][3] - m[2][3] * m[3][1]) +
        m[1][3] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])
      ) -
      m[0][1] * (
        m[1][0] * (m[2][2] * m[3][3] - m[2][3] * m[3][2]) -
        m[1][2] * (m[2][0] * m[3][3] - m[2][3] * m[3][0]) +
        m[1][3] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])
      ) +
      m[0][2] * (
        m[1][0] * (m[2][1] * m[3][3] - m[2][3] * m[3][1]) -
        m[1][1] * (m[2][0] * m[3][3] - m[2][3] * m[3][0]) +
        m[1][3] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])
      ) -
      m[0][3] * (
        m[1][0] * (m[2][1] * m[3][2] - m[2][2] * m[3][1]) -
        m[1][1] * (m[2][0] * m[3][2] - m[2][2] * m[3][0]) +
        m[1][2] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])
      )
    );
  }
  
  _luDeterminant() {
    // Simple LU for general dimension
    const n = this.dim;
    const a = this.metric.map(row => [...row]);
    let det = 1;
    
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
          maxRow = k;
        }
      }
      if (maxRow !== i) {
        [a[i], a[maxRow]] = [a[maxRow], a[i]];
        det *= -1;
      }
      
      if (Math.abs(a[i][i]) < 1e-10) return 0;
      
      det *= a[i][i];
      
      for (let k = i + 1; k < n; k++) {
        const factor = a[k][i] / a[i][i];
        for (let j = i; j < n; j++) {
          a[k][j] -= factor * a[i][j];
        }
      }
    }
    
    return det;
  }
  
  /**
   * Compute Ricci scalar (simplified 2D estimate)
   * R = (1/det g) * (curvature terms)
   */
  ricciScalar() {
    const det = this.determinant();
    if (Math.abs(det) < 1e-10) return 0;
    
    // Simplified: use trace of metric deviation from flat
    let trace = 0;
    for (let i = 0; i < this.dim; i++) {
      const flat = i === 0 ? -1 : 1;
      trace += (this.metric[i][i] - flat) ** 2;
    }
    
    return trace / Math.abs(det);
  }
  
  /**
   * Get line element ds² for given displacement
   */
  lineElement(dx) {
    let ds2 = 0;
    for (let m = 0; m < this.dim; m++) {
      for (let n = 0; n < this.dim; n++) {
        ds2 += this.metric[m][n] * dx[m] * dx[n];
      }
    }
    return ds2;
  }
  
  /**
   * Check signature (should be Lorentzian: one negative eigenvalue)
   */
  signature() {
    // Approximate eigenvalues via power iteration on diagonal
    const eigenSigns = [];
    for (let i = 0; i < this.dim; i++) {
      eigenSigns.push(Math.sign(this.metric[i][i]));
    }
    const negCount = eigenSigns.filter(s => s < 0).length;
    const posCount = eigenSigns.filter(s => s > 0).length;
    return { negative: negCount, positive: posCount, zeros: this.dim - negCount - posCount };
  }
}

// ============================================================================
// SYMBOLIC GRAVITY TENSOR (Chapter 16)
// ============================================================================

/**
 * SymbolicGravity - Gravitational effects from entropy gradients
 * 
 * From book.pdf Eq. 16.3:
 * G^(symbolic)_μν = ∇_μ∇_ν S(x,t) - g_μν S(x,t)
 * 
 * This represents the contribution of symbolic entropy
 * to the effective gravitational field.
 */
class SymbolicGravity {
  constructor(options = {}) {
    this.gridSize = options.gridSize || 10;
    this.dx = options.dx || 1.0;
    this.dt = options.dt || 0.1;
    
    // 4D grid of entropy values S(t, x, y, z)
    this.entropyField = this._createGrid();
    this.metric = new MetricEmergence(4);
  }
  
  _createGrid() {
    const size = this.gridSize;
    return new Array(size).fill(null).map(() =>
      new Array(size).fill(null).map(() =>
        new Array(size).fill(null).map(() =>
          new Float64Array(size).fill(0)
        )
      )
    );
  }
  
  /**
   * Set entropy at a spacetime point
   */
  setEntropy(t, x, y, z, S) {
    const ti = Math.floor(t / this.dt) % this.gridSize;
    const xi = Math.floor(x / this.dx) % this.gridSize;
    const yi = Math.floor(y / this.dx) % this.gridSize;
    const zi = Math.floor(z / this.dx) % this.gridSize;
    
    if (ti >= 0 && ti < this.gridSize &&
        xi >= 0 && xi < this.gridSize &&
        yi >= 0 && yi < this.gridSize &&
        zi >= 0 && zi < this.gridSize) {
      this.entropyField[ti][xi][yi][zi] = S;
    }
  }
  
  /**
   * Get entropy at a spacetime point
   */
  getEntropy(t, x, y, z) {
    const ti = Math.floor(t / this.dt) % this.gridSize;
    const xi = Math.floor(x / this.dx) % this.gridSize;
    const yi = Math.floor(y / this.dx) % this.gridSize;
    const zi = Math.floor(z / this.dx) % this.gridSize;
    
    if (ti >= 0 && ti < this.gridSize &&
        xi >= 0 && xi < this.gridSize &&
        yi >= 0 && yi < this.gridSize &&
        zi >= 0 && zi < this.gridSize) {
      return this.entropyField[ti][xi][yi][zi];
    }
    return 0;
  }
  
  /**
   * Compute symbolic gravity tensor at a point
   * G^(symbolic)_μν = ∇_μ∇_ν S - g_μν S
   * 
   * @param {number} t - Time coordinate
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {Array<Array<number>>} 4x4 symbolic gravity tensor
   */
  computeTensor(t, x, y, z) {
    const S = this.getEntropy(t, x, y, z);
    const g = this.metric.metric;
    
    // Compute second derivatives ∇_μ∇_ν S using finite differences
    const d2S = new Array(4).fill(null).map(() => new Float64Array(4));
    
    // Coordinate increments
    const h = [this.dt, this.dx, this.dx, this.dx];
    const coords = [t, x, y, z];
    
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = mu; nu < 4; nu++) {
        // Second derivative via central difference
        const plus_mu = [...coords];
        const minus_mu = [...coords];
        plus_mu[mu] += h[mu];
        minus_mu[mu] -= h[mu];
        
        if (mu === nu) {
          // ∂²S/∂x_μ²
          const Splus = this.getEntropy(...plus_mu);
          const Sminus = this.getEntropy(...minus_mu);
          d2S[mu][nu] = (Splus - 2 * S + Sminus) / (h[mu] * h[mu]);
        } else {
          // Mixed derivative ∂²S/∂x_μ∂x_ν
          const pp = [...coords]; pp[mu] += h[mu]; pp[nu] += h[nu];
          const pm = [...coords]; pm[mu] += h[mu]; pm[nu] -= h[nu];
          const mp = [...coords]; mp[mu] -= h[mu]; mp[nu] += h[nu];
          const mm = [...coords]; mm[mu] -= h[mu]; mm[nu] -= h[nu];
          
          d2S[mu][nu] = (
            this.getEntropy(...pp) - this.getEntropy(...pm) -
            this.getEntropy(...mp) + this.getEntropy(...mm)
          ) / (4 * h[mu] * h[nu]);
        }
        d2S[nu][mu] = d2S[mu][nu]; // Symmetric
      }
    }
    
    // G^(symbolic)_μν = ∇_μ∇_ν S - g_μν S
    const Gsym = new Array(4).fill(null).map(() => new Float64Array(4));
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        Gsym[mu][nu] = d2S[mu][nu] - g[mu][nu] * S;
      }
    }
    
    return Gsym;
  }
  
  /**
   * Compute trace of symbolic gravity tensor
   * Returns scalar curvature contribution from entropy
   */
  trace(t, x, y, z) {
    const G = this.computeTensor(t, x, y, z);
    const g = this.metric.metric;
    
    // Trace with inverse metric
    let tr = 0;
    for (let mu = 0; mu < 4; mu++) {
      tr += g[mu][mu] !== 0 ? G[mu][mu] / g[mu][mu] : 0;
    }
    return tr;
  }
  
  /**
   * Encode PrimeState as entropy distribution
   */
  encodeState(state, center = [0, 0, 0, 0]) {
    const [t0, x0, y0, z0] = center;
    const entropy = state.entropy();
    
    // Gaussian distribution of entropy around center
    const sigma = 2.0;
    for (let ti = 0; ti < this.gridSize; ti++) {
      for (let xi = 0; xi < this.gridSize; xi++) {
        for (let yi = 0; yi < this.gridSize; yi++) {
          for (let zi = 0; zi < this.gridSize; zi++) {
            const t = ti * this.dt;
            const x = xi * this.dx;
            const y = yi * this.dx;
            const z = zi * this.dx;
            
            const r2 = (t - t0) ** 2 + (x - x0) ** 2 + 
                       (y - y0) ** 2 + (z - z0) ** 2;
            const weight = Math.exp(-r2 / (2 * sigma * sigma));
            
            this.entropyField[ti][xi][yi][zi] += entropy * weight;
          }
        }
      }
    }
    
    return this;
  }
}

// ============================================================================
// GRAVITON FORMATION (Chapter 6)
// ============================================================================

/**
 * GravitonField - Spin-2 bosonic field from non-Abelian dynamics
 * 
 * From book.pdf Eq. 6.2:
 * ∂_t Ψ₁ = γ(Ψ₁ × Ψ₁)
 * 
 * The cross-product in field space generates spin-2 structure.
 */
class GravitonField {
  constructor(options = {}) {
    this.gamma = options.gamma || 0.1; // Coupling constant
    this.dt = options.dt || 0.01;
    this.time = 0;
    
    // Field components (3-vector in internal space)
    this.field = [
      new Complex(1, 0),
      new Complex(0, 0),
      new Complex(0, 0)
    ];
    
    this.history = [];
  }
  
  /**
   * Initialize from PrimeState
   */
  fromPrimeState(state) {
    const dom = state.dominant(3);
    for (let i = 0; i < 3 && i < dom.length; i++) {
      const amp = state.get(dom[i].p);
      this.field[i] = new Complex(amp.re, amp.im);
    }
    return this;
  }
  
  /**
   * Compute cross product in complex 3-space
   * a × b = (a₂b₃ - a₃b₂, a₃b₁ - a₁b₃, a₁b₂ - a₂b₁)
   */
  crossProduct(a, b) {
    return [
      a[1].mul(b[2]).sub(a[2].mul(b[1])),
      a[2].mul(b[0]).sub(a[0].mul(b[2])),
      a[0].mul(b[1]).sub(a[1].mul(b[0]))
    ];
  }
  
  /**
   * Single time step evolution
   * ∂_t Ψ = γ(Ψ × Ψ)
   */
  step() {
    const cross = this.crossProduct(this.field, this.field);
    
    for (let i = 0; i < 3; i++) {
      this.field[i] = this.field[i].add(cross[i].scale(this.gamma * this.dt));
    }
    
    this.time += this.dt;
    this.history.push({
      time: this.time,
      field: this.field.map(f => ({ re: f.re, im: f.im })),
      norm: this.norm()
    });
    
    return this;
  }
  
  /**
   * Evolve for multiple steps
   */
  evolve(steps = 100) {
    for (let i = 0; i < steps; i++) {
      this.step();
    }
    return this;
  }
  
  /**
   * Field norm
   */
  norm() {
    return Math.sqrt(
      this.field.reduce((sum, f) => sum + f.norm2(), 0)
    );
  }
  
  /**
   * Spin-2 projection (graviton content)
   * Approximated by quadrupole moment
   */
  spin2Content() {
    // Q_ij = Ψ_i Ψ_j - (1/3)δ_ij |Ψ|²
    const n2 = this.norm() ** 2;
    const Q = new Array(3).fill(null).map(() => new Float64Array(3));
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const prod = this.field[i].mul(this.field[j].conj()).re;
        Q[i][j] = prod - (i === j ? n2 / 3 : 0);
      }
    }
    
    // Trace should be zero (traceless quadrupole)
    let trace = 0;
    for (let i = 0; i < 3; i++) trace += Q[i][i];
    
    // Quadrupole magnitude
    let mag = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        mag += Q[i][j] ** 2;
      }
    }
    
    return {
      quadrupole: Q,
      trace,
      magnitude: Math.sqrt(mag)
    };
  }
}

// ============================================================================
// PRIME HARMONIC EM FIELD (Chapter 16)
// ============================================================================

/**
 * PrimeHarmonicField - EM fields at prime-logarithmic frequencies
 * 
 * From book.pdf Eq. 16.1:
 * E(x,t) = Σ_p E_p(x) e^(iω_p t), where ω_p = log(p)
 * 
 * Creates electromagnetic interference patterns that encode
 * prime resonance structure.
 */
class PrimeHarmonicField {
  constructor(options = {}) {
    this.primes = options.primes || firstNPrimes(15);
    this.gridSize = options.gridSize || 64;
    this.dx = options.dx || 0.1;
    
    // Amplitude and phase for each prime
    this.amplitudes = new Map();
    this.phases = new Map();
    
    for (const p of this.primes) {
      this.amplitudes.set(p, 1.0 / Math.sqrt(this.primes.length));
      this.phases.set(p, 0);
    }
  }
  
  /**
   * Set amplitude and phase from PrimeState
   */
  fromPrimeState(state) {
    for (const p of this.primes) {
      const amp = state.get(p);
      if (amp) {
        this.amplitudes.set(p, amp.norm());
        this.phases.set(p, amp.phase());
      }
    }
    return this;
  }
  
  /**
   * Compute E-field at position x and time t
   * E(x,t) = Σ_p E_p cos(k_p x) e^(iω_p t + φ_p)
   * where ω_p = log(p), k_p = 2π/λ_p = 2π log(p) / c
   */
  compute(x, t) {
    let real = 0;
    let imag = 0;
    
    for (const p of this.primes) {
      const omega = Math.log(p);
      const k = omega; // k = ω/c, assume c = 1
      const A = this.amplitudes.get(p);
      const phi = this.phases.get(p);
      
      // Spatial envelope: standing wave pattern
      const spatial = Math.cos(k * x);
      
      // Temporal oscillation
      const phase = omega * t + phi;
      
      real += A * spatial * Math.cos(phase);
      imag += A * spatial * Math.sin(phase);
    }
    
    return new Complex(real, imag);
  }
  
  /**
   * Compute field intensity |E|² on a 1D grid
   */
  computeGrid(t) {
    const grid = new Float64Array(this.gridSize);
    
    for (let i = 0; i < this.gridSize; i++) {
      const x = i * this.dx;
      const E = this.compute(x, t);
      grid[i] = E.norm2();
    }
    
    return grid;
  }
  
  /**
   * Time-averaged intensity
   */
  averageIntensity(x, T = 10, samples = 100) {
    let sum = 0;
    for (let i = 0; i < samples; i++) {
      const t = (i / samples) * T;
      const E = this.compute(x, t);
      sum += E.norm2();
    }
    return sum / samples;
  }
  
  /**
   * Find interference peaks (high intensity positions)
   */
  findPeaks(t, threshold = 0.5) {
    const grid = this.computeGrid(t);
    const maxIntensity = Math.max(...grid);
    const peaks = [];
    
    for (let i = 1; i < this.gridSize - 1; i++) {
      if (grid[i] > grid[i - 1] && grid[i] > grid[i + 1]) {
        if (grid[i] / maxIntensity > threshold) {
          peaks.push({
            position: i * this.dx,
            intensity: grid[i],
            relativeIntensity: grid[i] / maxIntensity
          });
        }
      }
    }
    
    return peaks;
  }
  
  /**
   * Spectral analysis - power at each prime frequency
   */
  spectrum(x, T = 10, samples = 256) {
    const spectrum = new Map();
    
    for (const p of this.primes) {
      const omega = Math.log(p);
      let power = 0;
      
      // Correlate with e^(-iωt)
      for (let i = 0; i < samples; i++) {
        const t = (i / samples) * T;
        const E = this.compute(x, t);
        power += E.re * Math.cos(omega * t) + E.im * Math.sin(omega * t);
      }
      
      spectrum.set(p, Math.abs(power) / samples);
    }
    
    return spectrum;
  }
}

// ============================================================================
// MODIFIED EINSTEIN EQUATIONS (Chapter 16)
// ============================================================================

/**
 * ModifiedEinsteinEquations - Unified field equations
 * 
 * From book.pdf Eq. 16.4:
 * G_μν = κT̃_μν + λG^(symbolic)_μν
 * 
 * Combines standard Einstein tensor with symbolic gravity contribution.
 */
class ModifiedEinsteinEquations {
  constructor(options = {}) {
    this.kappa = options.kappa || 1.0;  // Einstein coupling (8πG/c⁴)
    this.lambda = options.lambda || 0.1; // Symbolic coupling
    
    this.symbolicGravity = new SymbolicGravity(options);
    this.metricEmergence = new MetricEmergence(4);
  }
  
  /**
   * Compute effective stress-energy tensor
   * T_eff_μν = T̃_μν + (λ/κ) G^(symbolic)_μν
   */
  effectiveStressEnergy(T_matter, t, x, y, z) {
    const Gsym = this.symbolicGravity.computeTensor(t, x, y, z);
    const T_eff = new Array(4).fill(null).map(() => new Float64Array(4));
    
    const ratio = this.lambda / this.kappa;
    
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        T_eff[mu][nu] = (T_matter?.[mu]?.[nu] || 0) + ratio * Gsym[mu][nu];
      }
    }
    
    return T_eff;
  }
  
  /**
   * Check energy condition violations
   * Returns true if weak energy condition might be violated
   */
  checkEnergyConditions(T_eff) {
    // Weak energy condition: T_μν u^μ u^ν ≥ 0 for timelike u
    // Check with u = (1, 0, 0, 0)
    const rho_eff = T_eff[0][0]; // Energy density
    
    return {
      weakViolated: rho_eff < 0,
      effectiveDensity: rho_eff,
      trace: T_eff[0][0] - T_eff[1][1] - T_eff[2][2] - T_eff[3][3]
    };
  }
  
  /**
   * Compute symbolic gravitational potential
   * Φ = -∫ G^(symbolic)_00 / (4πr) d³x (simplified monopole)
   */
  symbolicPotential(t, r) {
    if (r < 0.01) r = 0.01;
    
    // Approximate by sampling entropy at center
    const S = this.symbolicGravity.getEntropy(t, 0, 0, 0);
    const G00 = this.symbolicGravity.computeTensor(t, 0, 0, 0)[0][0];
    
    return -this.lambda * G00 / (4 * Math.PI * r);
  }
}

// Export all classes
export {
  MetricEmergence,
  SymbolicGravity,
  GravitonField,
  PrimeHarmonicField,
  ModifiedEinsteinEquations
};
