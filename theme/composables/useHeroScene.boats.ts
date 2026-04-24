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

/**
 * One boat placement + the seed inputs for its hull and ripple renderers.
 * `x`/`y` are in the native scene coordinate system (viewBox
 * `0 -200 nativeW 1000`, y ∈ [-200, 800]).
 */
export interface BoatPlacement {
  x: number
  y: number
  /** Horizontal flip — true means fisherman faces left. */
  fli: boolean
  /** Native boat length passed to Arch.boat01's `len` option. */
  len: number
  /** Sub-seed fed to Arch.boat01 for the hull. */
  boatSeed: number
  /** Sub-seed fed to Water.generate for the local ripples. */
  rippleSeed: number
}

/**
 * Faint long-baseline water stroke spanning the lower scene. Rendered
 * first with reduced opacity as a suggestive horizon.
 */
export interface BaselinePlan {
  x: number
  y: number
  len: number
  seed: number
}

export interface WaterPlan {
  baseline: BaselinePlan
  boats: BoatPlacement[]
}

const BOAT_Y_BASE = 600
const BOAT_Y_JITTER = 20 // full range → y ∈ [590, 610]
const BOAT_LEN = 140
const BASELINE_Y = 625

/**
 * Plan the theme-owned boat layer for one hero render. Fully deterministic
 * for a given (nativeW, seed) pair.
 */
export function planBoats(nativeW: number, seed: number): WaterPlan {
  const rnd = mulberry32(seed)
  const count = decideBoatCount(nativeW, rnd)

  const boats: BoatPlacement[] = []
  if (count === 1) {
    const x = nativeW * (0.35 + rnd() * 0.30)
    const y = BOAT_Y_BASE + (rnd() - 0.5) * BOAT_Y_JITTER
    const fli = rnd() < 0.5
    const boatSeed = (seed * 37 + 101) >>> 0
    boats.push({
      x,
      y,
      fli,
      len: BOAT_LEN,
      boatSeed,
      rippleSeed: (boatSeed ^ 0xB0A7) >>> 0,
    })
  }
  else {
    const xL = nativeW * (0.22 + rnd() * 0.10)
    const yL = BOAT_Y_BASE + (rnd() - 0.5) * BOAT_Y_JITTER
    const boatSeedL = (seed * 37 + 101) >>> 0
    boats.push({
      x: xL,
      y: yL,
      fli: false,
      len: BOAT_LEN,
      boatSeed: boatSeedL,
      rippleSeed: (boatSeedL ^ 0xB0A7) >>> 0,
    })

    const xR = nativeW * (0.68 + rnd() * 0.10)
    const yR = BOAT_Y_BASE + (rnd() - 0.5) * BOAT_Y_JITTER
    const boatSeedR = (seed * 37 + 202) >>> 0
    boats.push({
      x: xR,
      y: yR,
      fli: true,
      len: BOAT_LEN,
      boatSeed: boatSeedR,
      rippleSeed: (boatSeedR ^ 0xB0A7) >>> 0,
    })
  }

  const baseline: BaselinePlan = {
    x: nativeW * 0.15,
    y: BASELINE_Y,
    len: nativeW * 0.70,
    seed: (seed ^ 0xA17E) >>> 0,
  }

  return { baseline, boats }
}
