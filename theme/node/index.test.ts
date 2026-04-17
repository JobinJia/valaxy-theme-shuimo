import type { ThemeConfig } from '../types'
import { describe, expect, it } from 'vitest'
import { defaultThemeConfig, generateSafelist } from './index'

describe('defaultThemeConfig', () => {
  it('exposes brand colors', () => {
    expect(defaultThemeConfig.colors?.primary).toBeTruthy()
    expect(defaultThemeConfig.colors?.stamp).toBeTruthy()
  })

  it('enables the default stamp with author text', () => {
    expect(defaultThemeConfig.stamp?.enable).toBe(true)
    expect(defaultThemeConfig.stamp?.author).toBeTruthy()
    expect(defaultThemeConfig.stamp?.type).toBe('yin')
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
