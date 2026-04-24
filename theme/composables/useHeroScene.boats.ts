// Pure boat planning module for the hero landscape water layer. No
// shuimo-core imports — rendering is injected, keeping this module testable
// in a plain node env and safe to import from the hero-scene worker.

/**
 * Deterministic PRNG (mulberry32). Seed is coerced to uint32.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6D2B79F5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Decide boat count for the given scene width.
 *  - nativeW < 1200px   → always 1 (narrow viewports can't fit two legibly)
 *  - otherwise          → 2 with P=0.55, else 1
 */
export function decideBoatCount(nativeW: number, rnd: () => number): 1 | 2 {
  if (nativeW < 1200)
    return 1
  return rnd() < 0.55 ? 2 : 1
}
