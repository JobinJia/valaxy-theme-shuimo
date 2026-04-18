import type { ThemeConfig, ThemePreset } from '../types'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export const themePresets: Record<ThemePreset, DeepPartial<ThemeConfig>> = {
  classic: {},

  night: {
    colors: {
      primary: '#6B8E9B',
      stamp: '#B03A2E',
    },
    decorations: {
      curtainColor: { light: '#2C3E50', dark: '#0D1117' },
      curtainPaperColor: { light: '#2C3E50', dark: '#0D1117' },
      opacity: 0.18,
    },
    xuanPaper: {
      variant: 'aged',
    },
  },

  gold: {
    colors: {
      primary: '#B8860B',
      stamp: '#C8102E',
    },
    xuanPaper: {
      variant: 'gold',
      goldDensity: 0.4,
    },
    decorations: {
      curtainColor: { light: '#D4A017', dark: '#2A1F0E' },
      curtainPaperColor: { light: '#D4A017', dark: '#2A1F0E' },
      opacity: 0.15,
    },
  },

  minimal: {
    colors: {
      primary: '#555555',
      stamp: '#888888',
    },
    stamp: {
      enable: false,
    },
    decorations: {
      enable: false,
      heroLandscape: false,
      seasonAware: false,
    },
    xuanPaper: {
      enable: false,
    },
    brushStrokes: {
      enable: false,
    },
  },

  album: {
    colors: {
      primary: '#5B7553',
      stamp: '#C8102E',
    },
    decorations: {
      heroLandscape: true,
      seasonAware: true,
      opacity: 0.2,
    },
    xuanPaper: {
      variant: 'aged',
    },
    imageCaption: {
      enable: true,
      autoNumbering: true,
    },
  },
}

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = (target as any)[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      (result as any)[key] = deepMerge(tv, sv)
    }
    else {
      (result as any)[key] = sv
    }
  }
  return result
}

/**
 * 将预设值作为底层默认，用户显式配置覆盖预设
 */
export function applyPreset(defaultConfig: ThemeConfig, userConfig: Partial<ThemeConfig>): ThemeConfig {
  const preset = userConfig.preset
  if (!preset || !themePresets[preset])
    return deepMerge(defaultConfig, userConfig as Record<string, any>)

  const withPreset = deepMerge(defaultConfig, themePresets[preset] as Record<string, any>)
  return deepMerge(withPreset, userConfig as Record<string, any>)
}
