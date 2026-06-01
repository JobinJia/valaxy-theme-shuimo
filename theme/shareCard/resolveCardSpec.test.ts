import { describe, expect, it } from 'vitest'
import { resolveCardSpec } from './resolveCardSpec'

const baseInput = {
  slug: '/posts/hello',
  frontmatter: { title: '寒山行', date: '2026-01-02', dateText: '2026年1月2日' },
  themeConfig: {
    colors: { primary: '#8B4513' },
    sidebar: { author: { name: '墨客' } },
    header: { title: '墨韵书斋' },
    shareCard: { portrait: { width: 1080, height: 1440 }, landscape: { width: 1200, height: 630 } },
  },
}

describe('resolveCardSpec', () => {
  it('maps title / author / siteName / dateText from inputs', () => {
    const spec = resolveCardSpec({ ...baseInput, variant: 'portrait' })
    expect(spec.title).toBe('寒山行')
    expect(spec.author).toBe('墨客')
    expect(spec.siteName).toBe('墨韵书斋')
    expect(spec.dateText).toBe('2026年1月2日')
    expect(spec.variant).toBe('portrait')
    expect(spec.width).toBe(1080)
    expect(spec.height).toBe(1440)
  })

  it('derives a stable seed from slug, independent of variant', () => {
    const a = resolveCardSpec({ ...baseInput, variant: 'portrait' })
    const b = resolveCardSpec({ ...baseInput, variant: 'landscape' })
    const c = resolveCardSpec({ ...baseInput, slug: '/posts/other', variant: 'portrait' })
    expect(a.seed).toBe(b.seed)
    expect(a.seed).not.toBe(c.seed)
    expect(a.seed).toBeGreaterThan(0)
  })

  it('falls back gracefully when optional fields are missing', () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'landscape',
      frontmatter: {},
      themeConfig: {},
    })
    expect(spec.title).toBe('')
    expect(spec.author).toBeUndefined()
    expect(spec.colors.primary).toBe('#8B4513')
    expect(spec.width).toBe(1200)
  })

  // --- FIX 1: date formatting unification ---

  it('derives dateText from raw date when dateText is absent', () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'portrait',
      frontmatter: { title: '测试', date: '2026-01-02' },
      themeConfig: {},
    })
    // Must be non-empty and contain the year
    expect(spec.dateText).toBeTruthy()
    expect(spec.dateText).toContain('2026')
  })

  it('explicit dateText overrides raw date', () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'portrait',
      frontmatter: { title: '测试', date: '2026-01-02', dateText: '手动日期' },
      themeConfig: {},
    })
    expect(spec.dateText).toBe('手动日期')
  })

  it('yields undefined dateText for invalid date string', () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'portrait',
      frontmatter: { title: '测试', date: 'not-a-date' },
      themeConfig: {},
    })
    expect(spec.dateText).toBeUndefined()
  })

  it('yields undefined dateText when neither date nor dateText is provided', () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'portrait',
      frontmatter: { title: '测试' },
      themeConfig: {},
    })
    expect(spec.dateText).toBeUndefined()
  })

  it('handles Date object passed as date field', () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'portrait',
      frontmatter: { title: '测试', date: new Date('2026-03-15') },
      themeConfig: {},
    })
    expect(spec.dateText).toBeTruthy()
    expect(spec.dateText).toContain('2026')
  })

  // --- scene / flowerType determinism ---

  it('scene is one of the allowed literals', () => {
    const spec = resolveCardSpec({ ...baseInput, variant: 'landscape' })
    expect(['landscape', 'flower']).toContain(spec.scene)
  })

  it('flowerType is one of the allowed literals', () => {
    const spec = resolveCardSpec({ ...baseInput, variant: 'landscape' })
    expect(['herbal', 'woody']).toContain(spec.flowerType)
  })

  it('same slug always yields the same scene and flowerType (stability)', () => {
    const a = resolveCardSpec({ ...baseInput, variant: 'portrait' })
    const b = resolveCardSpec({ ...baseInput, variant: 'landscape' })
    expect(a.scene).toBe(b.scene)
    expect(a.flowerType).toBe(b.flowerType)
  })

  it('different slugs can produce different scenes', () => {
    // Find two slugs that differ by checking enough variants.
    // '/posts/hello' and '/posts/other' already have different seeds (proven by
    // the seed stability test above); we just need at least one to differ in scene.
    const slugs = ['/posts/hello', '/posts/other', '/posts/abc', '/posts/xyz', '/posts/a', '/posts/b']
    const scenes = slugs.map(slug =>
      resolveCardSpec({ ...baseInput, slug, variant: 'landscape' }).scene,
    )
    // At least two distinct scene values must exist across these slugs.
    const unique = new Set(scenes)
    expect(unique.size).toBeGreaterThan(1)
  })

  it('scene is derived from seed (seed % 3 === 0 → flower)', () => {
    // Verify the derivation formula is consistent: spec.seed % 3 should match.
    const spec = resolveCardSpec({ ...baseInput, variant: 'landscape' })
    const expectedScene = spec.seed % 3 === 0 ? 'flower' : 'landscape'
    expect(spec.scene).toBe(expectedScene)
  })

  it('flowerType is derived from seed (seed % 2 === 0 → herbal)', () => {
    const spec = resolveCardSpec({ ...baseInput, variant: 'landscape' })
    const expectedFlowerType = spec.seed % 2 === 0 ? 'herbal' : 'woody'
    expect(spec.flowerType).toBe(expectedFlowerType)
  })
})
