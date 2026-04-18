import type { CSSProperties } from 'vue'
import type { ThemeConfig } from '../types'
import { computed } from 'vue'
import { useThemeConfig } from './config'

const DEFAULT_SERIF_FONT = '\'Noto Serif SC\', \'Source Han Serif SC\', \'SimSun\', Georgia, \'Times New Roman\', serif'

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, '')
  const full = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized

  if (!/^[\dA-F]{6}$/i.test(full))
    return null

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function toRgba(rgb: [number, number, number], alpha: number): string {
  const [r, g, b] = rgb
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 暗色模式专用：向白靠拢 `amount`，用于把偏暗的用户主色提亮到对比度可读的区间
function lighten(rgb: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ]
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`
}

/**
 * 把 ThemeConfig 映射成一组 CSS 自定义属性。纯函数，便于单测。
 */
export function buildThemeCssVars(themeConfig: Partial<ThemeConfig> | undefined | null): Record<string, string> {
  const colors = themeConfig?.colors
  const fonts = themeConfig?.fonts
  const cssVars: Record<string, string> = {}

  if (colors?.primary) {
    cssVars['--sm-c-brand'] = colors.primary
    const primaryRgb = hexToRgb(colors.primary)
    if (primaryRgb) {
      cssVars['--sm-primary-faint'] = toRgba(primaryRgb, 0.1)
      cssVars['--sm-primary-light'] = toRgba(primaryRgb, 0.15)
      cssVars['--sm-primary-medium'] = toRgba(primaryRgb, 0.3)

      // 暗色模式：主色向白靠 35%，保证 --sm-accent 在 #151210 底色上满足 WCAG AA（≥4.5:1）
      // 默认棕色 #8B4513 原始对比仅 2.63，提亮后 ~5.8；用户自定义深色主色（如青绿 #0F766E）同理受益
      const primaryDarkRgb = lighten(primaryRgb, 0.35)
      cssVars['--sm-c-brand-dark'] = toHex(primaryDarkRgb)
      cssVars['--sm-primary-faint-dark'] = toRgba(primaryDarkRgb, 0.15)
      cssVars['--sm-primary-light-dark'] = toRgba(primaryDarkRgb, 0.22)
      cssVars['--sm-primary-medium-dark'] = toRgba(primaryDarkRgb, 0.4)
    }
  }

  if (colors?.stamp)
    cssVars['--sm-c-stamp'] = colors.stamp

  cssVars['--va-font-family-base'] = fonts?.body || fonts?.serif || DEFAULT_SERIF_FONT

  if (fonts?.title)
    cssVars['--sm-font-title'] = fonts.title

  return cssVars
}

export function useThemeCssVars() {
  const themeConfig = useThemeConfig()
  return computed<CSSProperties>(() => buildThemeCssVars(themeConfig.value) as CSSProperties)
}
