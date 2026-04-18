import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentSeason, getSeasonFlora, hashString } from './useShuimoSeed'

describe('hashString', () => {
  it('is deterministic for the same input', () => {
    expect(hashString('hero-landscape')).toBe(hashString('hero-landscape'))
  })

  it('returns different values for different inputs (no trivial collisions)', () => {
    const a = hashString('shuimo-xuan-paper')
    const b = hashString('shuimo-hero')
    const c = hashString('shuimo-footer')
    expect(new Set([a, b, c]).size).toBe(3)
  })

  it('always returns a non-negative integer', () => {
    const values = ['', 'a', 'shuimo', '\u4E2D\u6587\u79CD\u5B50', 'x'.repeat(256)]
      .map(hashString)
    for (const v of values) {
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('season helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['2026-03-15', 'spring', 'orchid'],
    ['2026-06-01', 'summer', 'bamboo'],
    ['2026-09-30', 'autumn', 'chrysanthemum'],
    ['2026-12-25', 'winter', 'plum'],
    ['2026-01-15', 'winter', 'plum'],
  ] as const)('maps %s to %s / %s', (iso, expectedSeason, expectedFlora) => {
    vi.setSystemTime(new Date(iso))
    expect(getCurrentSeason()).toBe(expectedSeason)
    expect(getSeasonFlora()).toBe(expectedFlora)
  })
})
