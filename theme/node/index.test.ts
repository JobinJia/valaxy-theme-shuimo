import type { ThemeConfig } from '../types'
import { describe, expect, it } from 'vitest'
import { defaultThemeConfig, generateSafelist } from './index'
import { applyPreset } from './presets'

describe('defaultThemeConfig', () => {
  it('exposes brand colors', () => {
    expect(defaultThemeConfig.colors?.primary).toBeTruthy()
    expect(defaultThemeConfig.colors?.stamp).toBeTruthy()
  })

  it('enables the default stamp with author text', () => {
    expect(defaultThemeConfig.stamp?.enable).toBe(true)
    expect(defaultThemeConfig.stamp?.author).toBeTruthy()
    expect(defaultThemeConfig.stamp?.mode).toBe('yang')
    expect(defaultThemeConfig.stamp?.shape).toBe('rect')
    expect(defaultThemeConfig.stamp?.size).toBe(200)
    expect(defaultThemeConfig.stamp?.color).toBe('#C8102E')
    expect(defaultThemeConfig.stamp?.border).toEqual({
      thickness: 3,
      cornerRadius: 8,
      corner: 'round',
      roughness: 0.2,
    })
    expect(defaultThemeConfig.stamp?.carving).toEqual({ intensity: 0.9 })
  })

  it('ships curtain stamp defaults aligned with V1 visual (yin / rect / bleed)', () => {
    expect(defaultThemeConfig.stamp?.curtain?.mode).toBe('yin')
    expect(defaultThemeConfig.stamp?.curtain?.shape).toBe('rect')
    expect(defaultThemeConfig.stamp?.curtain?.ink).toEqual({ bleed: 0.7 })
  })

  it('enables core visual subsystems by default', () => {
    expect(defaultThemeConfig.decorations?.enable).toBe(true)
    expect(defaultThemeConfig.decorations?.heroLandscape).toBe(true)
    expect(defaultThemeConfig.decorations?.seasonAware).toBe(true)
    expect(defaultThemeConfig.xuanPaper?.enable).toBe(true)
    expect(defaultThemeConfig.brushStrokes?.enable).toBe(true)
  })

  it('ships a numeric footer since', () => {
    expect(typeof defaultThemeConfig.footer?.since).toBe('number')
  })

  it('leaves nav empty by default', () => {
    expect(defaultThemeConfig.nav).toEqual([])
  })
})

describe('generateSafelist', () => {
  it('returns an empty list when nav is empty', () => {
    const safelist = generateSafelist({ nav: [] } as unknown as ThemeConfig)
    expect(safelist).toEqual([])
  })

  it('tolerates a missing nav array', () => {
    const safelist = generateSafelist({} as unknown as ThemeConfig)
    expect(safelist).toEqual([])
  })

  it('extracts icon names from nav items that declare one', () => {
    const safelist = generateSafelist({
      nav: [
        { text: '首页', link: '/', icon: 'i-ri-home-line' },
        { text: '归档', link: '/archives/' },
        { text: '分类', link: '/categories/', icon: 'i-ri-folder-line' },
      ],
    } as unknown as ThemeConfig)
    expect(safelist).toEqual(['i-ri-home-line', 'i-ri-folder-line'])
  })

  it('skips nav items without an icon', () => {
    const safelist = generateSafelist({
      nav: [
        { text: '关于', link: '/about/' },
        { text: '标签', link: '/tags/' },
      ],
    } as unknown as ThemeConfig)
    expect(safelist).toEqual([])
  })
})

describe('applyPreset', () => {
  it('applies preset values as defaults', () => {
    const merged = applyPreset(defaultThemeConfig, { preset: 'gold' })
    expect(merged.colors.primary).toBe('#B8860B')
    expect(merged.xuanPaper?.variant).toBe('gold')
    expect(merged.xuanPaper?.goldDensity).toBe(0.4)
  })

  it('lets user config override preset values', () => {
    const merged = applyPreset(defaultThemeConfig, {
      preset: 'gold',
      colors: {
        primary: '#123456',
        stamp: '#654321',
      },
      xuanPaper: {
        goldDensity: 0.1,
      },
    })

    expect(merged.colors.primary).toBe('#123456')
    expect(merged.colors.stamp).toBe('#654321')
    expect(merged.xuanPaper?.variant).toBe('gold')
    expect(merged.xuanPaper?.goldDensity).toBe(0.1)
  })

  it('translates V1 stamp aliases (type → mode, shape: rectangle → rect)', () => {
    // Without this normalization, user `type: 'yin'` would coexist with
    // default `mode: 'yang'` in the merged config, and downstream readers
    // doing `mode ?? type` would keep returning 'yang'.
    const merged = applyPreset(defaultThemeConfig, {
      stamp: {
        type: 'yin',
        shape: 'rectangle',
        nav: { type: 'yang', shape: 'rectangle' },
        curtain: { type: 'yin', shape: 'rectangle' },
      } as any,
    })

    expect(merged.stamp?.mode).toBe('yin')
    expect(merged.stamp?.shape).toBe('rect')
    expect(merged.stamp?.nav?.mode).toBe('yang')
    expect(merged.stamp?.nav?.shape).toBe('rect')
    expect(merged.stamp?.curtain?.mode).toBe('yin')
    expect(merged.stamp?.curtain?.shape).toBe('rect')
  })

  it('prefers V2 `mode` over V1 `type` when both are set', () => {
    const merged = applyPreset(defaultThemeConfig, {
      stamp: {
        mode: 'yin',
        type: 'yang', // ignored; mode wins
      } as any,
    })

    expect(merged.stamp?.mode).toBe('yin')
  })
})
