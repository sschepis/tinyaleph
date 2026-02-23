/**
 * Atlas canonical label: (e1, e2, e3, d45, e6, e7)
 * 
 * - e1, e2, e3, e6, e7 ∈ {0, 1}
 * - d45 ∈ {-1, 0, +1}
 * 
 * Represents the position in the Atlas of Resonance Classes.
 */
export class Label {
  /**
   * Create a new Label.
   * @param {number} e1 - 0 or 1
   * @param {number} e2 - 0 or 1
   * @param {number} e3 - 0 or 1
   * @param {number} d45 - -1, 0, or 1 (Difference e4 - e5)
   * @param {number} e6 - 0 or 1
   * @param {number} e7 - 0 or 1
   */
  constructor(e1, e2, e3, d45, e6, e7) {
    if (![0, 1].includes(e1)) throw new Error(`Invalid e1: ${e1}`);
    if (![0, 1].includes(e2)) throw new Error(`Invalid e2: ${e2}`);
    if (![0, 1].includes(e3)) throw new Error(`Invalid e3: ${e3}`);
    if (![-1, 0, 1].includes(d45)) throw new Error(`Invalid d45: ${d45}`);
    if (![0, 1].includes(e6)) throw new Error(`Invalid e6: ${e6}`);
    if (![0, 1].includes(e7)) throw new Error(`Invalid e7: ${e7}`);

    this.e1 = e1;
    this.e2 = e2;
    this.e3 = e3;
    this.d45 = d45;
    this.e6 = e6;
    this.e7 = e7;
  }

  /**
   * Apply mirror transformation (flip e7).
   * @returns {Label} New mirrored label
   */
  mirror() {
    return new Label(
      this.e1,
      this.e2,
      this.e3,
      this.d45,
      this.e6,
      1 - this.e7
    );
  }

  /**
   * Check if this is a unity position.
   * Unity requires d45=0 and e1=e2=e3=e6=0.
   * @returns {boolean}
   */
  isUnity() {
    return (
      this.d45 === 0 &&
      this.e1 === 0 &&
      this.e2 === 0 &&
      this.e3 === 0 &&
      this.e6 === 0
    );
  }

  /**
   * Create a unique string key for this label (for Map/Set keys).
   * Format: "e1,e2,e3,d45,e6,e7"
   * @returns {string}
   */
  toString() {
    return `${this.e1},${this.e2},${this.e3},${this.d45},${this.e6},${this.e7}`;
  }

  /**
   * Parse a label string back to object.
   * @param {string} str 
   * @returns {Label}
   */
  static fromString(str) {
    const [e1, e2, e3, d45, e6, e7] = str.split(',').map(Number);
    return new Label(e1, e2, e3, d45, e6, e7);
  }
}
