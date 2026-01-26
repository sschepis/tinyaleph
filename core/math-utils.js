/**
 * Shared Math Utilities for tinyaleph
 * 
 * This module provides common mathematical functions used across multiple
 * core modules to avoid duplicate definitions that cause bundler issues.
 * 
 * @module core/math-utils
 */

// ============================================================================
// EXTENDED EUCLIDEAN ALGORITHM
// ============================================================================

/**
 * Extended Euclidean Algorithm for regular numbers
 * Returns { gcd, x, y } such that gcd = a*x + b*y
 * 
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {{ gcd: number, x: number, y: number }}
 */
export function extendedGCD(a, b) {
  if (b === 0) {
    return { gcd: a, x: 1, y: 0 };
  }
  
  const result = extendedGCD(b, a % b);
  return {
    gcd: result.gcd,
    x: result.y,
    y: result.x - Math.floor(a / b) * result.y
  };
}

/**
 * Extended Euclidean Algorithm for BigInt
 * Returns { gcd, x, y } such that gcd = a*x + b*y
 * 
 * @param {bigint} a - First number
 * @param {bigint} b - Second number
 * @returns {{ gcd: bigint, x: bigint, y: bigint }}
 */
export function extendedGCDBigInt(a, b) {
  if (b === 0n) {
    return { gcd: a, x: 1n, y: 0n };
  }
  
  const result = extendedGCDBigInt(b, a % b);
  return {
    gcd: result.gcd,
    x: result.y,
    y: result.x - (a / b) * result.y
  };
}

// ============================================================================
// MODULAR INVERSE
// ============================================================================

/**
 * Compute modular inverse using Extended Euclidean Algorithm
 * Works with regular numbers
 * 
 * @param {number} a - Number to find inverse of
 * @param {number} m - Modulus
 * @returns {number|null} The modular inverse, or null if no inverse exists
 */
export function modInverse(a, m) {
  a = ((a % m) + m) % m;  // Normalize to positive
  const { gcd, x } = extendedGCD(a, m);
  
  if (gcd !== 1) {
    return null;  // No inverse exists (not coprime)
  }
  
  return ((x % m) + m) % m;
}

/**
 * Compute modular inverse for BigInt values
 * Uses Extended Euclidean Algorithm
 * 
 * @param {bigint} a - Number to find inverse of
 * @param {bigint} m - Modulus
 * @returns {bigint|null} The modular inverse, or null if no inverse exists
 */
export function modInverseBigInt(a, m) {
  a = BigInt(a);
  m = BigInt(m);
  
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  
  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }
  
  if (old_r > 1n) return null; // No inverse exists
  return ((old_s % m) + m) % m;
}

// ============================================================================
// MODULAR EXPONENTIATION
// ============================================================================

/**
 * Modular exponentiation for regular numbers
 * Computes (base^exp) mod m efficiently
 * 
 * @param {number} base - Base
 * @param {number} exp - Exponent
 * @param {number} m - Modulus
 * @returns {number} (base^exp) mod m
 */
export function modPow(base, exp, m) {
  if (m === 1) return 0;
  
  let result = 1;
  base = base % m;
  
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % m;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % m;
  }
  
  return result;
}

/**
 * Modular exponentiation for BigInt
 * Computes (base^exp) mod m efficiently
 * 
 * @param {bigint} base - Base
 * @param {bigint} exp - Exponent
 * @param {bigint} m - Modulus
 * @returns {bigint} (base^exp) mod m
 */
export function modPowBigInt(base, exp, m) {
  if (m === 1n) return 0n;
  
  let result = 1n;
  base = base % m;
  
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % m;
    }
    exp = exp / 2n;
    base = (base * base) % m;
  }
  
  return result;
}

// ============================================================================
// COPRIMALITY
// ============================================================================

/**
 * Check if two numbers are coprime (gcd = 1)
 * 
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {boolean} True if gcd(a, b) = 1
 */
export function areCoprime(a, b) {
  return extendedGCD(a, b).gcd === 1;
}

/**
 * Check if two BigInt numbers are coprime
 * 
 * @param {bigint} a - First number
 * @param {bigint} b - Second number
 * @returns {boolean} True if gcd(a, b) = 1
 */
export function areCoprimeBI(a, b) {
  return extendedGCDBigInt(a, b).gcd === 1n;
}

// ============================================================================
// GCD / LCM
// ============================================================================

/**
 * Greatest Common Divisor (regular numbers)
 * 
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} GCD of a and b
 */
export function gcd(a, b) {
  return extendedGCD(a, b).gcd;
}

/**
 * Greatest Common Divisor (BigInt)
 * 
 * @param {bigint} a - First number
 * @param {bigint} b - Second number
 * @returns {bigint} GCD of a and b
 */
export function gcdBigInt(a, b) {
  return extendedGCDBigInt(a, b).gcd;
}

/**
 * Least Common Multiple (regular numbers)
 * 
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} LCM of a and b
 */
export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Least Common Multiple (BigInt)
 * 
 * @param {bigint} a - First number
 * @param {bigint} b - Second number
 * @returns {bigint} LCM of a and b
 */
export function lcmBigInt(a, b) {
  const g = gcdBigInt(a, b);
  const product = a * b;
  return product < 0n ? -product / g : product / g;
}

// Default export with all functions
export default {
  // Extended GCD
  extendedGCD,
  extendedGCDBigInt,
  
  // Modular inverse
  modInverse,
  modInverseBigInt,
  
  // Modular exponentiation
  modPow,
  modPowBigInt,
  
  // Coprimality
  areCoprime,
  areCoprimeBI,
  
  // GCD/LCM
  gcd,
  gcdBigInt,
  lcm,
  lcmBigInt,
};
