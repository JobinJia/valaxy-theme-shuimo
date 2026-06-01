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
    mode: 'yang',
    shape: 'rect',
    color: '#C8102E',
    seed: 69706,
    size: 56,
    offsetX: 0,
    offsetY: 0,
    padding: 0,
    gap: 2,
    columnGap: 2,
    cellHeightMode: 'fit',
    border: { thickness: 3, cornerRadius: 8, corner: 'round', roughness: 0.2 },
    carving: { intensity: 0.9 },
    ink: { bleed: 1.0 },
    nav: {
      mode: 'yang',
      shape: 'rect',
      showIcon: false,
      mobileSize: 40,
      desktopSize: 48,
    },
    curtain: {
      author: '墨韵',
      mode: 'yin', // V1 默认是阴章；保留视觉一致
      shape: 'rect',
      seed: 69706,
      size: 200,
      padding: 0,
      gap: 2,
      columnGap: 2,
      cellHeightMode: 'fit',
      border: { thickness: 3, cornerRadius: 8, corner: 'round', roughness: 0.2 },
      carving: { intensity: 0.9 },
      ink: { bleed: 0.7 }, // 阴章 bleed 0.7（gallery 阴章值），阳章用 1.0
    },
  },

  shareCard: {
    enable: true,
    button: true,
    og: true,
    variants: ['portrait', 'landscape'],
    landscape: { width: 1200, height: 630 },
    portrait: { width: 1080, height: 1440 },
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
      mist: true,
      vignette: true,
      sun: true,
      glowMorning: true,
      glowDusk: true,
      skyTint: true,
    },
    moon: { size: 70, tiltByLatitude: true },
    sun: { size: 60, color: '#D9362E' },
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
//
// Scanning strategy:
//   篆体 only renders in stamps, the solar-term seal, the theme-toggle seal,
//   the site title, and the 404 page seal. Article BODY is rendered in Noto
//   Serif SC. Scanning every page body for the 篆体 subset over-collects by
//   ~10× and leaves the woff2 at ~270KB. Instead, we compute the char set
//   ourselves: post frontmatter `stamp.text`/`stamp.author`, the user's
//   `valaxy.config.{ts,js,mjs}` (themeConfig stamps + site title), plus the
//   theme's own hardcoded chars (defaults + 24 solar terms). Typical result:
//   ~80–120 chars → ~20–30KB woff2.
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

// CJK Unified Ideographs (U+4E00–U+9FFF) + CJK Extension A (U+3400–U+4DBF).
// Matches what `@jobinjia/vite-plugin-shuimo-font-subset` includes by default.
function isCjk(cp: number): boolean {
  return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF)
}

function addCjkChars(target: Set<string>, source: string): void {
  for (const c of source) {
    const cp = c.codePointAt(0)
    if (cp !== undefined && isCjk(cp))
      target.add(c)
  }
}

function collectStampChars(userRoot: string): Set<string> {
  const chars = new Set<string>()

  // Theme-internal hardcoded chars:
  //   受命于天既寿永昌 — ShuimoStamp default text
  //   墨韵书斋        — default site title / stamp
  //   日照月映        — ShuimoThemeToggle light/dark seals
  //   迷             — 404 layout seal
  addCjkChars(chars, '受命于天既寿永昌墨韵书斋日照月映迷')

  // Hardcoded static text rendered with title font in theme templates.
  // Sources: Shuimo{AboutPage,ArchivesPage,CategoryTagPage,ArticleCard,
  //   PostList,SeriesNav}.vue + layouts/404.vue + pages/index.vue.
  // 栖 in particular comes from "栖墨斋" (about/archives title) and was the
  // original miss that motivated this list. Re-audit whenever a new
  // hardcoded CJK string lands in any theme <template>.
  addCjkChars(chars, '不之全兮卷去寻尚山归录文无暂本来标栖此目章签篇类觅读路途通间阅需')

  // Locale message strings (theme/locales/*.yml) used via {{ t('shuimo.*') }}
  // bindings. These are interpolated at runtime so the static template scan
  // above can't see them.
  addCjkChars(chars, '上下主亏位作保凸切创到动博原取图在地字已弦我所换新更朔望档残气法渐由留盈相眉约置节获蛾视角近还钟题驱')

  // 24 solar terms — ShuimoSolarSeal swaps its text by the current term
  // (see composables/useSolarTerm.ts).
  addCjkChars(
    chars,
    '立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪冬至小寒大寒',
  )

  // Lunar calendar output (ShuimoMobileInscription renders the lunar date
  // line in 篆体). These chars come from @shuimo-design/lunar at runtime so
  // no static scan can catch them.
  addCjkChars(
    chars,
    '甲乙丙丁戊己庚辛壬癸' // 天干 10
    + '子丑寅卯辰巳午未申酉戌亥' // 地支 12
    + '初十廿正闰冬腊' // 农历日月前缀
    + '一二三四五六七八九零百' // 数字
    + '年月日时刻分秒半', // 时间单位
  )

  // Post frontmatter: only stamp.text / stamp.author / author fields, never
  // the article body. Walks pages/** for *.md files and reads the YAML
  // frontmatter block between leading `---` fences.
  const FRONTMATTER_FIELDS = /^[ \t]*(text|author):[ \t]*(\S.*)$/
  const walk = (dir: string): void => {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch {
      return
    }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) {
        walk(p)
        continue
      }
      if (!e.name.endsWith('.md'))
        continue
      let content: string
      try {
        content = fs.readFileSync(p, 'utf8')
      }
      catch {
        continue
      }
      const fm = content.match(/^---\n([\s\S]*?)\n---/)
      if (!fm)
        continue
      for (const line of fm[1].split('\n')) {
        const m = line.match(FRONTMATTER_FIELDS)
        if (m)
          addCjkChars(chars, m[2])
      }
    }
  }
  walk(path.join(userRoot, 'pages'))

  // User's valaxy.config — picks up themeConfig stamp.author / .curtain /
  // header.title / sidebar.author etc. Read as raw text so we don't care
  // whether it's TS / JS / MJS.
  for (const ext of ['ts', 'js', 'mjs']) {
    try {
      const content = fs.readFileSync(path.join(userRoot, `valaxy.config.${ext}`), 'utf8')
      addCjkChars(chars, content)
    }
    catch {}
  }

  return chars
}

export { buildShareCardPlugin } from './buildShareCardPlugin'

export function buildShuimoFontSubsetPlugin(
  options: ResolvedValaxyOptions<ThemeConfig>,
): Plugin | null {
  if (!fontSubsetFactory)
    return null

  const fontFile = fileURLToPath(new URL('../assets/fonts/yishanbeizhuanti.woff2', import.meta.url))
  const chars = collectStampChars(options.userRoot)

  return fontSubsetFactory({
    targetFonts: [fontFile],
    scanCwd: options.userRoot,
    // Empty: we deliberately do NOT scan article bodies. The narrow char set
    // is precomputed by `collectStampChars` and passed via `extraChars`.
    scanFiles: [],
    format: 'woff2',
    extraChars: [...chars].join(''),
  })
}
