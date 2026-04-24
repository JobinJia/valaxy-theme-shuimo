import { describe, expect, it } from 'vitest'
import { decideBoatCount, mulberry32 } from './useHeroScene.boats'

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produces values in [0, 1)', () => {
    const rnd = mulberry32(1)
    for (let i = 0; i < 100; i++) {
      const v = rnd()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('diverges for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

describe('decideBoatCount', () => {
  it('clamps to 1 when nativeW < 1200', () => {
    const alwaysHigh = () => 0.99
    const alwaysLow = () => 0.01
    expect(decideBoatCount(800, alwaysHigh)).toBe(1)
    expect(decideBoatCount(1199, alwaysLow)).toBe(1)
  })

  it('returns 2 when nativeW >= 1200 and rnd() < 0.55', () => {
    expect(decideBoatCount(1200, () => 0.54)).toBe(2)
    expect(decideBoatCount(4000, () => 0.0)).toBe(2)
  })

  it('returns 1 when nativeW >= 1200 and rnd() >= 0.55', () => {
    expect(decideBoatCount(1200, () => 0.55)).toBe(1)
    expect(decideBoatCount(4000, () => 0.99)).toBe(1)
  })
})

import { planBoats } from './useHeroScene.boats'

describe('planBoats', () => {
  it('returns 1 boat at narrow widths', () => {
    const plan = planBoats(1000, 42)
    expect(plan.boats).toHaveLength(1)
  })

  it('is fully deterministic for same (nativeW, seed)', () => {
    const a = planBoats(3000, 123)
    const b = planBoats(3000, 123)
    expect(a).toEqual(b)
  })

  it('produces baseline spanning 70% of nativeW starting at 15%', () => {
    const plan = planBoats(2000, 1)
    expect(plan.baseline.x).toBeCloseTo(300, 5)   // 2000 * 0.15
    expect(plan.baseline.len).toBeCloseTo(1400, 5) // 2000 * 0.70
    expect(plan.baseline.y).toBe(625)
  })

  it('baseline sub-seed is independent of boat seeds', () => {
    const plan = planBoats(3000, 777)
    for (const b of plan.boats) {
      expect(plan.baseline.seed).not.toBe(b.boatSeed)
      expect(plan.baseline.seed).not.toBe(b.rippleSeed)
    }
  })

  describe('single-boat case', () => {
    // Seed chosen so decideBoatCount returns 1 at nativeW=2000.
    // Verified by running mulberry32(seed)() and checking >= 0.55 or width < 1200.
    it('places boat in middle 30% of scene at y ~ 600', () => {
      // Use narrow width to force 1-boat outcome deterministically.
      const plan = planBoats(1000, 1)
      expect(plan.boats).toHaveLength(1)
      const b = plan.boats[0]
      expect(b.x).toBeGreaterThanOrEqual(1000 * 0.35)
      expect(b.x).toBeLessThanOrEqual(1000 * 0.65)
      expect(b.y).toBeGreaterThanOrEqual(590)
      expect(b.y).toBeLessThanOrEqual(610)
      expect(b.len).toBe(140)
    })
  })

  describe('two-boat case', () => {
    // Find a (nativeW, seed) that produces 2 boats.
    function findTwoBoatSeed(): { nativeW: number, seed: number } {
      for (let s = 0; s < 200; s++) {
        const p = planBoats(3000, s)
        if (p.boats.length === 2)
          return { nativeW: 3000, seed: s }
      }
      throw new Error('unable to find 2-boat seed in first 200 integers')
    }

    it('places left boat at 22–32% and right boat at 68–78% of nativeW', () => {
      const { nativeW, seed } = findTwoBoatSeed()
      const plan = planBoats(nativeW, seed)
      const [left, right] = plan.boats
      expect(left.x).toBeGreaterThanOrEqual(nativeW * 0.22)
      expect(left.x).toBeLessThanOrEqual(nativeW * 0.32)
      expect(right.x).toBeGreaterThanOrEqual(nativeW * 0.68)
      expect(right.x).toBeLessThanOrEqual(nativeW * 0.78)
    })

    it('orients fishermen inward (left fli=false, right fli=true)', () => {
      const { nativeW, seed } = findTwoBoatSeed()
      const plan = planBoats(nativeW, seed)
      expect(plan.boats[0].fli).toBe(false)
      expect(plan.boats[1].fli).toBe(true)
    })

    it('gives each boat a distinct sub-seed', () => {
      const { nativeW, seed } = findTwoBoatSeed()
      const plan = planBoats(nativeW, seed)
      const [a, b] = plan.boats
      expect(a.boatSeed).not.toBe(b.boatSeed)
      expect(a.rippleSeed).not.toBe(b.rippleSeed)
      expect(a.boatSeed).not.toBe(a.rippleSeed)
    })
  })
})
