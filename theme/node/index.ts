import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ThemeConfig } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
    curtain: {
      author: '墨韵',
      type: 'yin',
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
    sceneHeight: 800,
  },

  imageCaption: {
    enable: true,
    autoNumbering: true,
    prefix: '图',
  },

  astronomy: {
    enable: true,
    location: { lat: 29.56, lng: 106.55, name: '重庆' },
    allowVisitorOverride: true,
    layers: {
      moon: true,
      stars: true,
      mist: true,
      vignette: true,
      sun: true,
      glowMorning: true,
      glowDusk: true,
      skyTint: true,
    },
    moon: { size: 70, tiltByLatitude: true },
    sun: { size: 60, color: '#D9362E' },
    stars: { count: 16, moonLinked: true },
    mist: { opacity: 0.12, driftDuration: 120 },
  },

  preface: {},

  home: {
    postList: true,
  },
}

// shuimo-core 的 XuanPaper worker chunk 走 Vite 的 `?worker_file` 路径，
// 该路径对 server.fs.allow 的检查比普通模块路径更严（不享受 pnpm 符号链接的宽松），
// 本地联调（pnpm dev:local → link: 到仓库外）会 403。这里把 shuimo-core 的真实
// 目录显式加进白名单。Production build 下 fs.allow 不生效，无副作用。
// 用 node_modules 符号链接解真实路径 —— 比 require.resolve 更稳（后者对严格 exports
// 的包会因 'package.json' 不在 exports 中而失败）
function resolveShuimoCoreRealDir(): string | null {
  try {
    let dir = path.dirname(fileURLToPath(import.meta.url))
    while (dir !== path.dirname(dir)) {
      const candidate = path.join(dir, 'node_modules', '@jobinjia', 'shuimo-core')
      if (fs.existsSync(candidate))
        return fs.realpathSync(candidate)
      dir = path.dirname(dir)
    }
    return null
  }
  catch {
    return null
  }
}

export function themePlugin(_options: ResolvedValaxyOptions<ThemeConfig>): Plugin {
  const shuimoCoreDir = resolveShuimoCoreRealDir()

  return {
    name: 'valaxy-theme-shuimo',

    config() {
      return {
        optimizeDeps: {
          include: ['@jobinjia/shuimo-core', '@jobinjia/shuimo-core/drawing', '@jobinjia/shuimo-core/elements'],
        },
        server: shuimoCoreDir
          ? {
              fs: {
                allow: [shuimoCoreDir],
              },
            }
          : undefined,
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
