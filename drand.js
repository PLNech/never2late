/**
 * Deterministic random number generator
 * Adapted from Loren Schmidt's code via Everest Pipkin
 */

// Constants for the linear congruential generator
const a = 1664525;
const c = 1013904223;
const m = 982451497; // A large prime number for the modulus

// State
let seed = Math.floor(Date.now() % 1000000);
let initialized = false;

/**
 * Set the seed for the deterministic random number generator
 * @param {number} newSeed - The seed value
 */
function seedDRand(newSeed) {
  seed = newSeed;
  initialized = true;
  return seed;
}

/**
 * Generate a random number using the linear congruential generator
 * @returns {number} A deterministic "random" number
 */
function dRandom() {
  // Define the recurrence relationship
  seed = (a * seed + c) % m;
  return seed;
}

/**
 * Get a random integer from 0 to spread-1
 * @param {number} spread - The upper bound (exclusive)
 * @returns {number} A random integer
 */
function dRandomInt(spread) {
  return dRandom() % spread;
}

/**
 * Get a random integer in a range (inclusive)
 * @param {number} min - The lower bound
 * @param {number} max - The upper bound
 * @returns {number} A random integer in the range
 */
function dRandomInRange(min, max) {
  return min + dRandom() % (max - min + 1);
}

/**
 * Get a random float from 0 to 1
 * @returns {number} A random float
 */
function dRandomFloat() {
  return dRandom() / m;
}

/**
 * Get a random float in a range
 * @param {number} min - The lower bound
 * @param {number} max - The upper bound
 * @returns {number} A random float in the range
 */
function dRandomFloatInRange(min, max) {
  return min + (max - min) * dRandomFloat();
}

/**
 * Pick a random item from an array
 * @param {Array} array - The array to pick from
 * @returns {*} A random item from the array
 */
function pick(array) {
  if (!array || array.length === 0) return null;
  return array[dRandomInt(array.length)];
}

/**
 * Add some randomness to a value
 * @param {number} value - The base value
 * @param {number} amount - The maximum amount to jitter by
 * @returns {number} The jittered value
 */
function jitter(value, amount) {
  return value - amount + 2 * amount * dRandomFloat();
}

/**
 * Implement Fisher-Yates shuffle algorithm with our deterministic RNG
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
function dShuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = dRandomInt(i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Export functions to the window object
window.DRand = {
  seedDRand,
  dRandom,
  dRandomInt,
  dRandomInRange,
  dRandomFloat,
  dRandomFloatInRange,
  pick,
  jitter,
  dShuffle
};

// Auto-initialize with a time-based seed if not already initialized
if (!initialized) {
  seedDRand(Math.floor(Date.now() % 1000000));
}
