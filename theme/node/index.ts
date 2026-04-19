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
  },

  nav: [],

  stamp: {
    enable: true,
    author: '受命,于天,既寿,永昌',
    type: 'yang',
    shape: 'rectangle',
    fontFamily: '峄山碑篆体',
    fontSize: 70,
    fontWeight: 'normal',
    textCarving: 'normal',
    offsetX: 0,
    offsetY: 0,
    borderScale: 1,
    columnSpacingPx: 0.35,
    characterSpacingPx: 3.2,
    paddingXPx: 1.5,
    paddingYPx: 1.5,
    borderScaleX: 1,
    borderScaleY: 1,
    noiseAmountPx: 10,
    borderPointsPx: 24,
    cornerRadiusPx: 10,
    borderWidthPx: 4,
    regularShape: true,
    seed: 69706,
    nav: {
      type: 'yang',
      shape: 'rectangle',
      showIcon: false,
      mobileSize: 40,
      desktopSize: 48,
    },
  },

  decorations: {
    enable: true,
    seasonAware: true,
    heroLandscape: true,
    curtainColor: '',
    curtainPaperColor: '',
    opacity: 0.12,
  },

  xuanPaper: {
    enable: true,
    variant: 'processed',
  },

  brushStrokes: {
    enable: true,
  },

  toc: {
    enable: true,
    maxDepth: 3,
  },

  readingInfo: {
    enable: true,
    wordCount: true,
    readingTime: true,
    updatedTime: false,
    originalMark: false,
    wordsPerMinute: 300,
  },

  hero: {
    showSeedControl: false,
  },

  imageCaption: {
    enable: true,
    autoNumbering: true,
    prefix: '图',
  },

  preface: {},
}

export function themePlugin(_options: ResolvedValaxyOptions<ThemeConfig>): Plugin {
  return {
    name: 'valaxy-theme-shuimo',

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

  themeConfig.nav?.forEach((item) => {
    if (item.icon)
      safelist.push(item.icon)
  })

  return safelist
}
