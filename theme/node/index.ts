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
    mobileFlower: {
      enable: true,
      type: 'season',
      opacity: 0.8,
    },
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

// 启动期"刷新即出真版宣纸"的三段：
// 1) head-prepend script: 同步读 bootstrap pointer 拿到 v2 key 名，再用它
//    读出 dataURL；不能写到 CSS variable —— `setProperty` 对 ~3MB 字符串
//    会静默失败 —— 而是 createElement('style') 在 head 里多挂一条
//    `#shuimo-paper-boot{background-image:url(...)}` 让浏览器解析到 body
//    的 boot div 时 CSS 已就位。两层间接 = 零额外 quota（之前直接复制
//    dataURL 在大尺寸 viewport 下 QuotaExceededError 被静默吞）。
// 2) head base style: boot div 的 fixed 定位等版式
// 3) body-prepend div: HTML 解析即在 DOM 中，独立于 Vue mount。Vue 起
//    来后 App.vue 的 .shuimo-paper-bg 后挂入 DOM，相同 z-index 下后入者绘
//    在上层，自然替换静态层。写入侧见 useGlobalXuanPaper.ts 的
//    persistBootstrapPointer。
const PAPER_BOOTSTRAP_INLINE_SCRIPT = `(function(){try{var s=localStorage.getItem('vueuse-color-scheme')||'auto';var d=s==='dark'||(s==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var p=localStorage.getItem('shuimo-paper-bootstrap-'+(d?'dark':'light'));if(!p)return;var v=localStorage.getItem(p);if(!(v&&v.lastIndexOf('data:image/',0)===0))return;var st=document.createElement('style');st.textContent='#shuimo-paper-boot{background-image:url("'+v+'")}';document.head.appendChild(st);}catch(_){}})();`

const PAPER_BOOTSTRAP_STYLE = `#shuimo-paper-boot{position:fixed;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;}`

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

    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            injectTo: 'head-prepend',
            children: PAPER_BOOTSTRAP_INLINE_SCRIPT,
          },
          {
            tag: 'style',
            injectTo: 'head',
            children: PAPER_BOOTSTRAP_STYLE,
          },
          {
            tag: 'div',
            injectTo: 'body-prepend',
            attrs: { id: 'shuimo-paper-boot' },
          },
        ]
      },
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

// Optionally load @jobinjia/vite-plugin-shuimo-font-subset to subset the
// shipped woff2 to characters actually used by the consumer's site at build
// time. When the plugin is not installed, end users still get the default
// ~280KB top-1000-hanzi subset shipped with the theme.
//
// The factory is resolved at module load via top-level await so we don't need
// the consumer to await before configuring `defineTheme`. The actual plugin
// instance is built lazily inside `buildShuimoFontSubsetPlugin` once we know
// the user's site root (valaxy's `userRoot`, which is more reliable than
// vite's `config.root` because valaxy rewrites the latter to its own virtual
// directory).
type FontSubsetFactory = (opts: {
  targetFonts: string[]
  scanCwd?: string
  scanFiles: string[]
  format?: 'woff2' | 'woff' | 'truetype'
  extraChars?: string
}) => Plugin

async function loadFontSubsetFactory(): Promise<FontSubsetFactory | null> {
  try {
    const mod = await import('@jobinjia/vite-plugin-shuimo-font-subset')
    return ((mod as { default?: FontSubsetFactory }).default
      ?? (mod as unknown as FontSubsetFactory))
  }
  catch {
    return null
  }
}

// eslint-disable-next-line antfu/no-top-level-await -- intentional: defineTheme requires sync callback, so the factory must be resolved at module load
const fontSubsetFactory: FontSubsetFactory | null = await loadFontSubsetFactory()

export function buildShuimoFontSubsetPlugin(
  options: ResolvedValaxyOptions<ThemeConfig>,
): Plugin | null {
  if (!fontSubsetFactory)
    return null

  const fontFile = fileURLToPath(new URL('../assets/fonts/yishanbeizhuanti.woff2', import.meta.url))
  return fontSubsetFactory({
    targetFonts: [fontFile],
    scanCwd: options.userRoot,
    scanFiles: [
      'pages/**/*.{md,mdx,vue}',
      'valaxy.config.{ts,js,mjs}',
    ],
    format: 'woff2',
    // 兜底字符：默认配置里写死的印章/标题字，扫描覆盖不到的运行时字符
    // - 受命于天既寿永昌：ShuimoStamp 默认 text
    // - 墨韵书斋：默认站点标题/印章
    // - 日照月映：ShuimoThemeToggle 亮/暗模式印章
    // - 迷：404 layout 印章
    extraChars: '受命于天既寿永昌墨韵书斋日照月映迷',
  })
}
