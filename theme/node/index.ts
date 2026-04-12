import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ThemeConfig } from '../types'

/**
 * Default Config
 */
export const defaultThemeConfig: ThemeConfig = {
  valaxyDarkOptions: {
    circleTransition: true,
  },

  colors: {
    primary: '#8B4513',
    stamp: '#C8102E',
  },

  fonts: {
    serif: '\'Noto Serif SC\', \'Source Han Serif SC\', \'SimSun\', Georgia, serif',
  },

  header: {
    title: '墨韵书斋',
    subtitle: '以墨会友 · 以文载道',
  },

  footer: {
    since: 2024,
    powered: true,
    beian: {
      enable: false,
      icp: '',
    },
  },

  sidebar: {
    author: {
      name: '墨客',
      motto: '以码为墨，以屏为纸',
    },
    showCategories: true,
    showTags: true,
    showRecent: true,
  },

  nav: [],

  stamp: {
    enable: true,
    author: '墨',
    type: 'yin',
  },

  decorations: {
    enable: true,
    seasonAware: true,
    heroLandscape: true,
    opacity: 0.12,
  },

  xuanPaper: {
    enable: true,
    variant: 'processed',
  },

  brushStrokes: {
    enable: true,
  },
}

export function themePlugin(options: ResolvedValaxyOptions<ThemeConfig>): Plugin {
  const themeConfig = options.config.themeConfig || {}

  return {
    name: 'valaxy-theme-shuimo1',

    config() {
      return {
        optimizeDeps: {
          include: ['@jobinjia/shuimo-core', '@jobinjia/shuimo-core/drawing', '@jobinjia/shuimo-core/elements'],
        },
      }
    },
  }
}

export function generateSafelist(themeConfig: ThemeConfig) {
  const safelist: string[] = []

  const footerIcon = themeConfig.footer?.icon?.name
  if (footerIcon)
    safelist.push(footerIcon)

  themeConfig.nav?.forEach((item) => {
    if (item.icon)
      safelist.push(item.icon)
  })

  return safelist
}
