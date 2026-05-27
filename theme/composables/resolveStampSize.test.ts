import type { ThemeConfig } from '../types'
import { describe, expect, it } from 'vitest'
import { resolveStampSize, resolveVnavMainStampSize } from './resolveStampSize'

type Stamp = ThemeConfig['stamp']

describe('resolveVnavMainStampSize', () => {
  it('falls back to 56 when neither nav.mainSize nor stamp.size is set', () => {
    expect(resolveVnavMainStampSize(undefined)).toBe(56)
    expect(resolveVnavMainStampSize(null)).toBe(56)
    expect(resolveVnavMainStampSize({} as Stamp)).toBe(56)
    expect(resolveVnavMainStampSize({ nav: {} } as Stamp)).toBe(56)
  })

  it('uses top-level stamp.size when only stamp.size is set', () => {
    expect(resolveVnavMainStampSize({ size: 200 } as Stamp)).toBe(200)
    expect(resolveVnavMainStampSize({ size: 480, nav: {} } as Stamp)).toBe(480)
  })

  it('prefers stamp.nav.mainSize over stamp.size', () => {
    expect(resolveVnavMainStampSize({ size: 200, nav: { mainSize: 80 } } as Stamp)).toBe(80)
  })

  it('honors mainSize even without top-level stamp.size', () => {
    expect(resolveVnavMainStampSize({ nav: { mainSize: 96 } } as Stamp)).toBe(96)
  })

  it('treats mainSize=0 as a valid override (?? semantics)', () => {
    // 0 is a real choice (hide the seal via zero size); only null/undefined fall through.
    expect(resolveVnavMainStampSize({ nav: { mainSize: 0 } } as Stamp)).toBe(0)
  })
})

describe('resolveStampSize', () => {
  it('returns the component default when stamp is missing', () => {
    expect(resolveStampSize(undefined, 64)).toBe(64)
    expect(resolveStampSize(null, 80)).toBe(80)
    expect(resolveStampSize({} as Stamp, 40)).toBe(40)
  })

  it('returns stamp.size when configured', () => {
    expect(resolveStampSize({ size: 200 } as Stamp, 64)).toBe(200)
    expect(resolveStampSize({ size: 480 } as Stamp, 80)).toBe(480)
  })

  it('treats stamp.size=0 as a valid override (?? semantics)', () => {
    expect(resolveStampSize({ size: 0 } as Stamp, 64)).toBe(0)
  })
})
