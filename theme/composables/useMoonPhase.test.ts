import { describe, expect, it } from 'vitest'
import { moonPhaseI18nKey } from './useMoonPhase'

describe('moonPhaseI18nKey', () => {
  it.each([
    [0,    'new'],
    [0.02, 'new'],
    [0.1,  'waxing_crescent'],
    [0.25, 'first_quarter'],
    [0.4,  'waxing_gibbous'],
    [0.5,  'full'],
    [0.6,  'waning_gibbous'],
    [0.75, 'last_quarter'],
    [0.9,  'waning_crescent'],
    [0.99, 'waning_crescent'],
  ] as const)('phase=%s → %s', (phase, expected) => {
    expect(moonPhaseI18nKey(phase)).toBe(expected)
  })

  it('clamps phase ≥ 1 back to "new"', () => {
    expect(moonPhaseI18nKey(1)).toBe('new')
    expect(moonPhaseI18nKey(1.5)).toBe('new')
  })
})
