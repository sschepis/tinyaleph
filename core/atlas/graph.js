import { Label } from './label.js';

const ATLAS_VERTEX_COUNT = 96;

/**
 * Atlas of Resonance Classes
 * 
 * A 96-vertex graph representing the stationary configuration of the 
 * action functional. It is the initial object for exceptional Lie groups.
 */
export class Atlas {
  constructor() {
    this.labels = [];           // Array<Label>
    this.labelIndex = new Map(); // Map<string, number> (label.toString() -> index)
    this.adjacency = [];        // Array<Set<number>>
    this.tau = [];              // Array<number> (mirror pairs)
    this.unityIndices = [];     // Array<number>

    this._initialize();
  }

  _initialize() {
    this.labels = this._generateLabels();
    this.labelIndex = new Map(this.labels.map((l, i) => [l.toString(), i]));
    this.adjacency = this._buildAdjacency();
    this.tau = this._computeTau();
    this.unityIndices = this._findUnityPositions();

    this._verifyInvariants();
  }

  /**
   * Generate all 96 canonical labels.
   */
  _generateLabels() {
    const labels = [];
    for (let e1 = 0; e1 <= 1; e1++) {
      for (let e2 = 0; e2 <= 1; e2++) {
        for (let e3 = 0; e3 <= 1; e3++) {
          for (let e6 = 0; e6 <= 1; e6++) {
            for (let e7 = 0; e7 <= 1; e7++) {
              for (let d45 = -1; d45 <= 1; d45++) {
                labels.push(new Label(e1, e2, e3, d45, e6, e7));
              }
            }
          }
        }
      }
    }
    return labels;
  }

  /**
   * Build adjacency list based on Hamming-1 flips.
   */
  _buildAdjacency() {
    const adjacency = new Array(this.labels.length).fill(null).map(() => new Set());

    this.labels.forEach((label, i) => {
      const neighbors = this._computeNeighbors(label);
      for (const neighbor of neighbors) {
        const key = neighbor.toString();
        if (this.labelIndex.has(key)) {
          const j = this.labelIndex.get(key);
          if (i !== j) {
            adjacency[i].add(j);
          }
        }
      }
    });

    return adjacency;
  }

  /**
   * Compute neighbors for a single label.
   * Flips e1, e2, e3, e6, or e4/e5 (via d45). e7 is NOT flipped (mirror).
   */
  _computeNeighbors(label) {
    const { e1, e2, e3, d45, e6, e7 } = label;
    const neighbors = [];

    // Flip e1, e2, e3, e6
    neighbors.push(new Label(1 - e1, e2, e3, d45, e6, e7));
    neighbors.push(new Label(e1, 1 - e2, e3, d45, e6, e7));
    neighbors.push(new Label(e1, e2, 1 - e3, d45, e6, e7));
    neighbors.push(new Label(e1, e2, e3, d45, 1 - e6, e7));

    // Flip e4 or e5 (canonical d45 transformation)
    neighbors.push(new Label(e1, e2, e3, this._flipD45ByE4(d45), e6, e7));
    neighbors.push(new Label(e1, e2, e3, this._flipD45ByE5(d45), e6, e7));

    return neighbors;
  }

  _flipD45ByE4(d) {
    // -1 -> 0, 0 -> 1, 1 -> 0
    if (d === -1 || d === 1) return 0;
    if (d === 0) return 1;
    throw new Error(`Invalid d45: ${d}`);
  }

  _flipD45ByE5(d) {
    // -1 -> 0, 0 -> -1, 1 -> 0
    if (d === -1 || d === 1) return 0;
    if (d === 0) return -1;
    throw new Error(`Invalid d45: ${d}`);
  }

  _computeTau() {
    return this.labels.map(label => {
      const mirror = label.mirror();
      return this.labelIndex.get(mirror.toString());
    });
  }

  _findUnityPositions() {
    return this.labels
      .map((l, i) => l.isUnity() ? i : -1)
      .filter(i => i !== -1);
  }

  _verifyInvariants() {
    if (this.labels.length !== ATLAS_VERTEX_COUNT) {
      throw new Error(`Atlas must have ${ATLAS_VERTEX_COUNT} vertices, got ${this.labels.length}`);
    }
    if (this.unityIndices.length !== 2) {
      throw new Error(`Must have exactly 2 unity positions, got ${this.unityIndices.length}`);
    }
    // Check degrees
    this.adjacency.forEach((neighbors, i) => {
        const deg = neighbors.size;
        if (deg !== 5 && deg !== 6) {
            throw new Error(`Vertex ${i} has invalid degree ${deg}`);
        }
    });
  }

  // Public API

  get numVertices() { return this.labels.length; }
  
  get numEdges() {
    let sum = 0;
    for (const set of this.adjacency) sum += set.size;
    return sum / 2;
  }

  degree(v) { return this.adjacency[v].size; }
  
  neighbors(v) { return Array.from(this.adjacency[v]); }
  
  getLabel(v) { return this.labels[v]; }
  
  getMirror(v) { return this.tau[v]; }
  
  isAdjacent(v1, v2) { return this.adjacency[v1].has(v2); }
  
  isMirrorPair(v1, v2) { return this.tau[v1] === v2; }

  getUnityPositions() { return this.unityIndices; }
}
