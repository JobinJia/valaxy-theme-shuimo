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
