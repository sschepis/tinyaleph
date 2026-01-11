/**
 * Fano plane structure for octonion/sedenion multiplication
 */

// Standard Fano plane lines (7 lines of 3 points each)

const FANO_LINES = [
  [1, 2, 3],
  [1, 4, 5],
  [1, 6, 7],
  [2, 4, 6],
  [2, 5, 7],
  [3, 4, 7],
  [3, 5, 6]
];

/**
 * Octonion multiplication using Fano plane
 */
function octonionMultiplyIndex(i, j) {
  if (i === 0) return [j, 1];
  if (j === 0) return [i, 1];
  if (i === j) return [0, -1];
  
  for (const line of FANO_LINES) {
    const xi = line.indexOf(i);
    if (xi >= 0 && line.includes(j)) {
      const xj = line.indexOf(j);
      const k = line[3 - xi - xj];
      const sign = (xj - xi + 3) % 3 === 1 ? 1 : -1;
      return [k, sign];
    }
  }
  return [i ^ j, 1];
}

/**
 * Sedenion multiplication (Cayley-Dickson extension of octonions)
 */
function sedenionMultiplyIndex(i, j) {
  if (i === 0) return [j, 1];
  if (j === 0) return [i, 1];
  if (i === j) return [0, -1];
  
  const hi = i >= 8, hj = j >= 8;
  const li = i & 7, lj = j & 7;
  
  if (!hi && !hj) return octonionMultiplyIndex(li, lj);
  if (hi && hj) {
    const [k, s] = octonionMultiplyIndex(li, lj);
    return [k, -s];
  }
  if (!hi) {
    const [k, s] = octonionMultiplyIndex(lj, li);
    return [k + 8, s];
  }
  const [k, s] = octonionMultiplyIndex(li, lj);
  return [k + 8, -s];
}

/**
 * Generic multiplication index lookup
 */
function multiplyIndices(dim, i, j) {
  if (dim <= 2) {
    // Complex numbers
    if (i === 0) return [j, 1];
    if (j === 0) return [i, 1];
    if (i === 1 && j === 1) return [0, -1];
    return [i ^ j, 1];
  }
  if (dim <= 4) {
    // Quaternions
    if (i === 0) return [j, 1];
    if (j === 0) return [i, 1];
    if (i === j) return [0, -1];
    // i*j=k, j*k=i, k*i=j (and negatives for reverse)
    const quat = [[0,0,0,0], [0,0,3,-2], [0,-3,0,1], [0,2,-1,0]];
    const k = quat[i][j];
    const sign = k > 0 ? 1 : -1;
    return [Math.abs(k), sign];
  }
  if (dim <= 8) return octonionMultiplyIndex(i % 8, j % 8);
  if (dim <= 16) return sedenionMultiplyIndex(i, j);
  
  // Pathion (32D) and beyond: recursive Cayley-Dickson
  if (i === 0) return [j, 1];
  if (j === 0) return [i, 1];
  if (i === j) return [0, -1];
  
  const half = dim / 2;
  const hi = i >= half, hj = j >= half;
  const li = i % half, lj = j % half;
  
  if (!hi && !hj) return multiplyIndices(half, li, lj);
  if (hi && hj) {
    const [k, s] = multiplyIndices(half, li, lj);
    return [k, -s];
  }
  if (!hi) {
    const [k, s] = multiplyIndices(half, lj, li);
    return [k + half, s];
  }
  const [k, s] = multiplyIndices(half, li, lj);
  return [k + half, -s];
}

/**
 * Build full multiplication table for a given dimension
 */
function buildMultiplicationTable(dim) {
  const table = [];
  for (let i = 0; i < dim; i++) {
    table[i] = [];
    for (let j = 0; j < dim; j++) {
      table[i][j] = multiplyIndices(dim, i, j);
    }
  }
  return table;
}

export {
    FANO_LINES,
    octonionMultiplyIndex,
    sedenionMultiplyIndex,
    multiplyIndices,
    buildMultiplicationTable
};