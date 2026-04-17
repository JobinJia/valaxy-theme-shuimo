import type { CSSProperties } from 'vue'
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

export function useThemeCssVars() {
  const themeConfig = useThemeConfig()

  return computed<CSSProperties>(() => {
    const colors = themeConfig.value?.colors
    const fonts = themeConfig.value?.fonts
    const cssVars: Record<string, string> = {}

    if (colors?.primary) {
      cssVars['--sm-c-brand'] = colors.primary
      const primaryRgb = hexToRgb(colors.primary)
      if (primaryRgb) {
        cssVars['--sm-primary-faint'] = toRgba(primaryRgb, 0.1)
        cssVars['--sm-primary-light'] = toRgba(primaryRgb, 0.15)
        cssVars['--sm-primary-medium'] = toRgba(primaryRgb, 0.3)
      }
    }

    if (colors?.stamp)
      cssVars['--sm-c-stamp'] = colors.stamp

    cssVars['--va-font-family-base'] = fonts?.body || fonts?.serif || DEFAULT_SERIF_FONT

    if (fonts?.title)
      cssVars['--sm-font-title'] = fonts.title

    return cssVars
  })
}
