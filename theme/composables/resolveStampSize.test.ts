import type { ThemeConfig } from '../types'
import { describe, expect, it } from 'vitest'
import { resolveDecorStampSize, resolveStampSize, resolveVnavMainStampSize } from './resolveStampSize'

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

  it('ignores stamp.decor.size — author-identity helper only reads stamp.size', () => {
    // Cross-scope isolation: setting decor.size MUST NOT change author seal sizing.
    expect(resolveStampSize({ decor: { size: 56 } } as Stamp, 64)).toBe(64)
    expect(resolveStampSize({ size: 200, decor: { size: 56 } } as Stamp, 64)).toBe(200)
  })
})

describe('resolveDecorStampSize', () => {
  it('returns the component default when stamp / decor / decor.size is missing', () => {
    expect(resolveDecorStampSize(undefined, 32)).toBe(32)
    expect(resolveDecorStampSize(null, 40)).toBe(40)
    expect(resolveDecorStampSize({} as Stamp, 80)).toBe(80)
    expect(resolveDecorStampSize({ decor: {} } as Stamp, 48)).toBe(48)
  })

  it('returns stamp.decor.size when configured', () => {
    expect(resolveDecorStampSize({ decor: { size: 56 } } as Stamp, 32)).toBe(56)
    expect(resolveDecorStampSize({ decor: { size: 24 } } as Stamp, 80)).toBe(24)
  })

  it('ignores stamp.size — decor helper is independent of author-identity sizing', () => {
    // The whole point of decor.size: a giant author seal must not balloon UI chrome.
    expect(resolveDecorStampSize({ size: 200 } as Stamp, 32)).toBe(32)
    expect(resolveDecorStampSize({ size: 200, decor: { size: 56 } } as Stamp, 32)).toBe(56)
  })

  it('treats stamp.decor.size=0 as a valid override (?? semantics)', () => {
    expect(resolveDecorStampSize({ decor: { size: 0 } } as Stamp, 32)).toBe(0)
  })
})
