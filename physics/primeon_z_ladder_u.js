/**
 * Primeon Z-Ladder with Canonical U Evolution
 * 
 * Minimal canonical U implementation representing a ladder with:
 * - core sector ψ ∈ ℂ^d (quantum state)
 * - Z sector z ∈ ℂ^dz (closure/sink/bookkeeping channel)
 * 
 * Provides reproducible stepping, measurable Z-flux signal,
 * and stable hooks for entropy and coherence metrics.
 */
'use strict';

/**
 * Minimal Complex number helpers (intentionally tiny for predictable perf).
 */

class C {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }

  static add(a, b) {
    return new C(a.re + b.re, a.im + b.im);
  }

  static sub(a, b) {
    return new C(a.re - b.re, a.im - b.im);
  }

  static mul(a, b) {
    return new C(
      a.re * b.re - a.im * b.im,
      a.re * b.im + a.im * b.re
    );
  }

  static scale(a, s) {
    return new C(a.re * s, a.im * s);
  }

  static conj(a) {
    return new C(a.re, -a.im);
  }

  static abs2(a) {
    return a.re * a.re + a.im * a.im;
  }

  static exp(theta) {
    return new C(Math.cos(theta), Math.sin(theta));
  }

  static zero() {
    return new C(0, 0);
  }

  clone() {
    return new C(this.re, this.im);
  }
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Shannon entropy on probabilities (base e).
 * @param {number[]} probs - Array of probabilities
 * @returns {number} Entropy in nats
 */
function shannonEntropyNats(probs) {
  let h = 0;
  for (const p of probs) {
    if (p > 1e-15) h -= p * Math.log(p);
  }
  return h;
}

/**
 * Normalize complex vector in-place; returns norm.
 * @param {C[]} vec - Complex vector
 * @returns {number} The norm before normalization
 */
function normalize(vec) {
  let s = 0;
  for (const v of vec) s += C.abs2(v);
  const n = Math.sqrt(s) || 1;
  const inv = 1 / n;
  for (let i = 0; i < vec.length; i++) {
    vec[i] = C.scale(vec[i], inv);
  }
  return n;
}

/**
 * Computes probabilities |amp|^2 normalized.
 * @param {C[]} vec - Complex vector
 * @returns {number[]} Probability distribution
 */
function probsOf(vec) {
  let s = 0;
  const p = new Array(vec.length);
  for (let i = 0; i < vec.length; i++) {
    const a2 = C.abs2(vec[i]);
    p[i] = a2;
    s += a2;
  }
  const inv = 1 / (s || 1);
  for (let i = 0; i < p.length; i++) p[i] *= inv;
  return p;
}

/**
 * Compute total norm of complex vector.
 * @param {C[]} vec - Complex vector
 * @returns {number} L2 norm
 */
function normOf(vec) {
  let s = 0;
  for (const v of vec) s += C.abs2(v);
  return Math.sqrt(s);
}

/**
 * PrimeonZLadderU - A minimal "canonical U" for a ladder system.
 * 
 * - Core ψ is coupled to nearest neighbors via a hopping term
 * - Z channel receives controlled leakage from core each step
 * 
 * Designed to be:
 * - Easy to simulate
 * - Easy to measure
 * - Easy to integrate with tinyaleph's existing entropy tooling
 */
class PrimeonZLadderU {
  /**
   * @param {object} opts
   * @param {number} opts.N             Number of ladder rungs
   * @param {number} [opts.d=1]         Core internal dimension per rung
   * @param {number} [opts.dz=1]        Z internal dimension per rung
   * @param {number} [opts.J=0.25]      Nearest-neighbor coupling strength (core)
   * @param {number} [opts.leak=0.05]   Fraction of amplitude leaked core->Z per step (0..1)
   * @param {boolean} [opts.closeZ=true]   If true, Z is projected out each step (closure)
   * @param {boolean} [opts.periodic=true] Periodic boundary conditions
   */
  constructor(opts) {
    this.N = opts.N;
    this.d = opts.d ?? 1;
    this.dz = opts.dz ?? 1;
    this.J = opts.J ?? 0.25;
    this.leak = clamp01(opts.leak ?? 0.05);
    this.closeZ = opts.closeZ ?? true;
    this.periodic = opts.periodic ?? true;

    // State arrays: ψ and z as [N][d] and [N][dz] flattened
    this.psi = Array.from({ length: this.N * this.d }, () => C.zero());
    this.z = Array.from({ length: this.N * this.dz }, () => C.zero());

    // Metrics
    this.t = 0;
    this.lastZFlux = 0;   // "how much moved into Z this step"
    this.totalZFlux = 0;  // accumulated over all steps
    this.stepCount = 0;
  }

  /**
   * Reset state to vacuum (all zeros).
   */
  reset() {
    for (let i = 0; i < this.psi.length; i++) {
      this.psi[i] = C.zero();
    }
    for (let i = 0; i < this.z.length; i++) {
      this.z[i] = C.zero();
    }
    this.t = 0;
    this.lastZFlux = 0;
    this.totalZFlux = 0;
    this.stepCount = 0;
  }

  /**
   * Initialize ψ with a localized excitation at rung n.
   * @param {number} n - Rung index
   * @param {C} [amp] - Complex amplitude (default: 1+0i)
   * @param {number} [k=0] - Internal index within rung
   */
  exciteRung(n, amp = new C(1, 0), k = 0) {
    const i = ((n % this.N) + this.N) % this.N * this.d + (k % this.d);
    this.psi[i] = amp;
    normalize(this.psi);
  }

  /**
   * Excite multiple rungs uniformly.
   * @param {number[]} rungs - Array of rung indices
   * @param {number} [ampScale=1] - Amplitude scale
   */
  exciteRungs(rungs, ampScale = 1) {
    for (const n of rungs) {
      const idx = ((n % this.N) + this.N) % this.N;
      const i = idx * this.d;
      this.psi[i] = C.add(this.psi[i], new C(ampScale, 0));
    }
    normalize(this.psi);
  }

  /**
   * Prime-friendly helper: excite multiple rungs from a prime list.
   * Map primes -> rung index via mod N (simple, deterministic).
   * @param {number[]} primes - Array of prime numbers
   * @param {number} [ampScale=1] - Amplitude scale for each excitation
   */
  excitePrimes(primes, ampScale = 1) {
    for (const p of primes) {
      const idx = ((p % this.N) + this.N) % this.N;
      const i = idx * this.d;
      this.psi[i] = C.add(this.psi[i], new C(ampScale, 0));
    }
    normalize(this.psi);
  }

  /**
   * One time step using a simple split operator:
   * 1) Core hopping (discrete Schrödinger-like update)
   * 2) Leak core->Z
   * 3) Closure rule (optional)
   * 
   * @param {number} [dt=0.01] - Time step size
   * @returns {object} Current metrics
   */
  step(dt = 0.01) {
    const N = this.N;
    const d = this.d;

    // --- 1) Core hopping: ψ_i <- ψ_i - i dt J (ψ_{i+1} + ψ_{i-1} - 2ψ_i)
    // Minimal stable discretization (not "perfect unitary", but well-behaved for small dt).
    const next = Array.from({ length: N * d }, () => C.zero());

    for (let n = 0; n < N; n++) {
      const nL = (n === 0) ? (this.periodic ? N - 1 : 0) : n - 1;
      const nR = (n === N - 1) ? (this.periodic ? 0 : N - 1) : n + 1;

      for (let k = 0; k < d; k++) {
        const i = n * d + k;
        const iL = nL * d + k;
        const iR = nR * d + k;

        const psi = this.psi[i];
        const psiL = this.psi[iL];
        const psiR = this.psi[iR];

        // Discrete Laplacian: (psiL - psi) + (psiR - psi) = psiL + psiR - 2*psi
        const lap = C.add(
          C.sub(psiL, psi),
          C.sub(psiR, psi)
        );

        // -i * (dt*J) * lap  == multiply lap by (0, -dt*J)
        const delta = C.mul(lap, new C(0, -dt * this.J));
        next[i] = C.add(psi, delta);
      }
    }

    this.psi = next;

    // --- 2) Leak core->Z (explicit Z-sector coupling)
    let zFlux = 0;
    const leak = this.leak;

    for (let i = 0; i < this.psi.length; i++) {
      const a = this.psi[i];
      const moved = C.scale(a, leak);

      // Subtract moved from core
      this.psi[i] = C.sub(a, moved);

      // Add moved into Z (fold core index into Z index)
      const zi = i % (this.N * this.dz);
      this.z[zi] = C.add(this.z[zi], moved);

      zFlux += C.abs2(moved);
    }

    // --- 3) Closure rule
    // If closeZ: project out Z (record flux), renormalize core.
    // If keep Z: Z acts as persistent "closure memory".
    if (this.closeZ) {
      // Optionally wipe Z after recording:
      // for (let i = 0; i < this.z.length; i++) this.z[i] = C.zero();
      normalize(this.psi);
    } else {
      // Normalize combined energy lightly to avoid blowup
      normalize(this.psi);
    }

    this.lastZFlux = zFlux;
    this.totalZFlux += zFlux;
    this.t += dt;
    this.stepCount++;

    return this.metrics();
  }

  /**
   * Run multiple steps.
   * @param {number} steps - Number of steps to run
   * @param {number} [dt=0.01] - Time step size
   * @returns {object[]} Array of metrics for each step
   */
  run(steps, dt = 0.01) {
    const trajectory = [];
    for (let i = 0; i < steps; i++) {
      trajectory.push(this.step(dt));
    }
    return trajectory;
  }

  /**
   * Coherence proxy: inverse entropy of |ψ|^2 distribution.
   * Low entropy => localized / coherent; high entropy => spread / incoherent
   * @returns {object} Current metrics
   */
  metrics() {
    const p = probsOf(this.psi);
    const H = shannonEntropyNats(p);

    // "Coherence" as 1/(1+H) for a stable 0..1-ish number
    const coherence = 1 / (1 + H);

    // Z sector metrics
    const pZ = probsOf(this.z);
    const HZ = shannonEntropyNats(pZ);
    const zNorm = normOf(this.z);

    // Compute order parameter (mean field amplitude)
    let meanRe = 0, meanIm = 0;
    for (const v of this.psi) {
      meanRe += v.re;
      meanIm += v.im;
    }
    const orderParameter = Math.sqrt(meanRe * meanRe + meanIm * meanIm) / this.psi.length;

    return {
      t: this.t,
      stepCount: this.stepCount,
      coherence,
      entropy: H,
      orderParameter,
      zFlux: this.lastZFlux,
      zFluxTotal: this.totalZFlux,
      zEntropy: HZ,
      zNorm
    };
  }

  /**
   * Get full state snapshot for serialization/inspection.
   * @returns {object} Complete state snapshot
   */
  snapshot() {
    return {
      t: this.t,
      stepCount: this.stepCount,
      N: this.N,
      d: this.d,
      dz: this.dz,
      J: this.J,
      leak: this.leak,
      closeZ: this.closeZ,
      periodic: this.periodic,
      psi: this.psi.map(v => ({ re: v.re, im: v.im })),
      z: this.z.map(v => ({ re: v.re, im: v.im })),
      ...this.metrics()
    };
  }

  /**
   * Restore state from a snapshot.
   * @param {object} snap - Snapshot object from snapshot()
   */
  restore(snap) {
    this.t = snap.t;
    this.stepCount = snap.stepCount;
    this.psi = snap.psi.map(v => new C(v.re, v.im));
    this.z = snap.z.map(v => new C(v.re, v.im));
    this.totalZFlux = snap.zFluxTotal;
    this.lastZFlux = snap.zFlux;
  }

  /**
   * Get probability distribution over rungs.
   * @returns {number[]} Probability for each rung
   */
  rungProbabilities() {
    const probs = new Array(this.N).fill(0);
    for (let n = 0; n < this.N; n++) {
      for (let k = 0; k < this.d; k++) {
        const i = n * this.d + k;
        probs[n] += C.abs2(this.psi[i]);
      }
    }
    const total = probs.reduce((a, b) => a + b, 0) || 1;
    return probs.map(p => p / total);
  }

  /**
   * Sample a rung index according to |ψ|^2 distribution.
   * @returns {number} Sampled rung index
   */
  sampleRung() {
    const probs = this.rungProbabilities();
    const r = Math.random();
    let cumulative = 0;
    for (let n = 0; n < this.N; n++) {
      cumulative += probs[n];
      if (r <= cumulative) return n;
    }
    return this.N - 1;
  }

  /**
   * Collapse state to a specific rung (measurement).
   * @param {number} n - Rung index to collapse to
   */
  collapseToRung(n) {
    const idx = ((n % this.N) + this.N) % this.N;
    
    // Zero out all rungs except the collapsed one
    for (let i = 0; i < this.psi.length; i++) {
      const rungIdx = Math.floor(i / this.d);
      if (rungIdx !== idx) {
        this.psi[i] = C.zero();
      }
    }
    normalize(this.psi);
  }

  /**
   * Perform a measurement: sample and collapse.
   * @returns {object} Measurement result
   */
  measure() {
    const probsBefore = this.rungProbabilities();
    const sampledRung = this.sampleRung();
    const probability = probsBefore[sampledRung];
    
    this.collapseToRung(sampledRung);
    
    return {
      outcome: sampledRung,
      probability,
      probsBefore,
      metricsAfter: this.metrics()
    };
  }
}

/**
 * Factory function for creating ladder with prime-based configuration.
 * @param {number[]} primes - Prime numbers to use for initialization
 * @param {object} [opts={}] - Additional options
 * @returns {PrimeonZLadderU} Configured ladder instance
 */
function createPrimeonLadder(primes, opts = {}) {
  const N = opts.N ?? Math.max(16, Math.max(...primes) + 1);
  const ladder = new PrimeonZLadderU({
    N,
    d: opts.d ?? 1,
    dz: opts.dz ?? 1,
    J: opts.J ?? 0.25,
    leak: opts.leak ?? 0.05,
    closeZ: opts.closeZ ?? true,
    periodic: opts.periodic ?? true
  });
  
  if (primes.length > 0) {
    ladder.excitePrimes(primes, opts.ampScale ?? 1);
  }
  
  return ladder;
}

export {
    PrimeonZLadderU,
    createPrimeonLadder,
    shannonEntropyNats,
    probsOf,
    normalize,
    C
};