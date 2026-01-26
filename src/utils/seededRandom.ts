// Seeded Random Number Generator
// Provides deterministic random numbers for consistent mock data across page loads

/**
 * Create a seeded pseudo-random number generator (mulberry32 algorithm)
 * Returns a function that generates numbers between 0 and 1
 *
 * @param seed - Initial seed value (use a consistent value for deterministic output)
 * @returns Function that returns next random number (0-1)
 */
export function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded random generator with helper methods
 * More convenient API for common random operations
 *
 * @param seed - Initial seed value
 */
export function createRandomGenerator(seed: number) {
  const random = createSeededRandom(seed);

  return {
    /** Get next random float between 0 and 1 */
    next: random,

    /** Get random float in range [min, max) */
    float: (min: number, max: number): number => {
      return min + random() * (max - min);
    },

    /** Get random integer in range [min, max] (inclusive) */
    int: (min: number, max: number): number => {
      return Math.floor(min + random() * (max - min + 1));
    },

    /** Get random boolean with given probability of true */
    bool: (probability = 0.5): boolean => {
      return random() < probability;
    },

    /** Pick random element from array */
    pick: <T>(array: T[]): T => {
      return array[Math.floor(random() * array.length)];
    },

    /** Shuffle array (returns new array) */
    shuffle: <T>(array: T[]): T[] => {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },

    /** Get random date within range */
    date: (startDaysAgo: number, endDaysAgo: number = 0): Date => {
      const daysAgo = Math.floor(startDaysAgo + random() * (endDaysAgo - startDaysAgo + 1));
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date;
    },

    /** Get random variance around a value */
    variance: (value: number, maxVariance: number): number => {
      return value + (random() - 0.5) * 2 * maxVariance;
    },
  };
}

// ============================================
// PREDEFINED SEEDS FOR DIFFERENT DATA DOMAINS
// ============================================

/** Seeds for different data domains - ensures consistency within domain */
export const SEEDS = {
  COMMODITIES: 42,
  SUPPLIERS: 123,
  CATEGORIES: 456,
  INFLATION: 789,
  NEWS: 1011,
  EXPERTS: 1213,
  SCORES: 1415,
  GEMINI: 1617,
} as const;

// ============================================
// PRE-CREATED GENERATORS
// ============================================

/** Pre-created generators for each domain */
export const generators = {
  commodities: createRandomGenerator(SEEDS.COMMODITIES),
  suppliers: createRandomGenerator(SEEDS.SUPPLIERS),
  categories: createRandomGenerator(SEEDS.CATEGORIES),
  inflation: createRandomGenerator(SEEDS.INFLATION),
  news: createRandomGenerator(SEEDS.NEWS),
  experts: createRandomGenerator(SEEDS.EXPERTS),
  scores: createRandomGenerator(SEEDS.SCORES),
  gemini: createRandomGenerator(SEEDS.GEMINI),
};

// ============================================
// REFERENCE DATE FOR CONSISTENT TIMESTAMPS
// ============================================

/** Fixed reference date for generating consistent dates */
export const REFERENCE_DATE = new Date('2025-01-26T00:00:00Z');

/**
 * Get a date relative to reference date
 * @param daysAgo - Days before reference date
 */
export function getRelativeDate(daysAgo: number): Date {
  const date = new Date(REFERENCE_DATE);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Get ISO string for date relative to reference
 */
export function getRelativeDateISO(daysAgo: number): string {
  return getRelativeDate(daysAgo).toISOString();
}
