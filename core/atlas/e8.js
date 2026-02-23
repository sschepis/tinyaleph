/**
 * E8 Root System
 * 
 * 240 roots in 8D Euclidean space.
 * Uses scaled coordinates (x2) to avoid floating point issues.
 * - Integer roots: coordinates are ±2 or 0.
 * - Half-integer roots: coordinates are ±1.
 * 
 * All roots have squared norm 8 (in scaled units), which corresponds to 2 in standard units.
 */
export class E8RootSystem {
  constructor() {
    this.roots = []; // Array<Int8Array(8)>
    this.rootIndex = new Map(); // Map<string, number>
    this.negationTable = [];

    this._initialize();
  }

  _initialize() {
    this.roots = this._generateAllRoots();
    this.rootIndex = new Map(this.roots.map((r, i) => [r.join(','), i]));
    this.negationTable = this._computeNegationTable();
    this._verifyInvariants();
  }

  _generateAllRoots() {
    const roots = [];
    
    // Type I: Integer roots (±e_i ±e_j) -> Scaled: ±2 at two positions
    // C(8, 2) * 4 = 28 * 4 = 112
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        for (const si of [2, -2]) {
          for (const sj of [2, -2]) {
            const v = new Int8Array(8);
            v[i] = si;
            v[j] = sj;
            roots.push(v);
          }
        }
      }
    }

    // Type II: Half-integer roots (±1/2) -> Scaled: ±1 everywhere
    // Must have even number of negative signs.
    // 2^8 = 256 combinations. Half are even -> 128.
    for (let i = 0; i < 256; i++) {
      const v = new Int8Array(8);
      let negCount = 0;
      for (let bit = 0; bit < 8; bit++) {
        if ((i >> bit) & 1) {
          v[bit] = -1;
          negCount++;
        } else {
          v[bit] = 1;
        }
      }
      if (negCount % 2 === 0) {
        roots.push(v);
      }
    }

    return roots;
  }

  _computeNegationTable() {
    return this.roots.map(r => {
      const neg = r.map(x => -x);
      const key = neg.join(',');
      if (!this.rootIndex.has(key)) {
        throw new Error(`Negation of root ${r} not found`);
      }
      return this.rootIndex.get(key);
    });
  }

  _verifyInvariants() {
    if (this.roots.length !== 240) {
      throw new Error(`E8 must have 240 roots, got ${this.roots.length}`);
    }
    // Verify norms
    for (const r of this.roots) {
      const sqNorm = r.reduce((acc, x) => acc + x * x, 0);
      if (sqNorm !== 8) {
        throw new Error(`Root ${r} has invalid squared norm ${sqNorm} (expected 8)`);
      }
    }
  }

  // Public API

  get numRoots() { return this.roots.length; }

  getRoot(i) { return this.roots[i]; }

  getNegation(i) { return this.negationTable[i]; }

  innerProduct(i, j) {
    const r1 = this.roots[i];
    const r2 = this.roots[j];
    let sum = 0;
    for (let k = 0; k < 8; k++) sum += r1[k] * r2[k];
    // Scale down: real inner product is sum / 4 (since each vec is scaled by 2)
    return sum / 4; 
  }

  /**
   * Get the 8 simple roots (Standard basis).
   * Scaled by 2.
   */
  getSimpleRoots() {
    const simple = [];
    
    // α₁ through α₆: e_i - e_{i+1} (scaled by 2)
    for (let i = 0; i < 6; i++) {
        const v = new Int8Array(8);
        v[i] = 2;
        v[i+1] = -2;
        simple.push(v);
    }
    
    // α₇ = e₆ - e₇ (scaled by 2)
    const v6 = new Int8Array(8);
    v6[5] = 2;
    v6[6] = -2;
    simple.push(v6);
    
    // α₈ = e₇ + e₈ (scaled by 2)
    const a7 = new Int8Array(8);
    a7[6] = 2;
    a7[7] = 2;
    simple.push(a7);
    
    // α₉ = ½(-1, -1, ..., -1) (scaled by 2 → all -1)
    const a8 = new Int8Array(8).fill(-1);
    simple.push(a8);
    
    return simple;
  }
}
