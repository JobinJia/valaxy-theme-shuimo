// theme/shareCard/types.ts

/** 卡片版式：竖版用于主动分享，横版用于 OG 链接预览。 */
export type CardVariant = 'portrait' | 'landscape'

/** 一张卡片的确定性规格，由 resolveCardSpec 产出，客户端与构建时共用。 */
export interface CardSpec {
  variant: CardVariant
  width: number
  height: number
  /** 由文章 slug 派生，保证同篇卡面稳定（区别于 useShuimoSeed 的 per-load 随机）。 */
  seed: number
  title: string
  subtitle?: string
  author?: string
  siteName?: string
  /** 已本地化的日期串，避免在合成器里依赖运行时 locale。 */
  dateText?: string
  /** 印章文案 + 渲染参数，复用 stamp-v2 SealOptions 子集。 */
  stamp?: {
    text: string
    mode: 'yin' | 'yang'
    color?: string
  }
  /** 配色（纸色 / 主色），缺省取 themeConfig.colors。 */
  colors: {
    primary: string
    paper: string
  }
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * 注入给合成器的 shuimo-core 绘制函数集合。
 * 合成器不直接 import core，便于「core 缺席时不触发加载」。
 */
export interface ComposeDeps {
  drawMountain: (ctx: CanvasRenderingContext2D, spec: CardSpec, box: Box) => void
  // Async: the seal renders via shuimo-core's generateCanvasStampAsync, which
  // loads the woff2 stamp font before rasterizing the carved glyphs.
  drawStampPath: (ctx: CanvasRenderingContext2D, spec: CardSpec, box: Box) => void | Promise<void>
  drawXuanPaper: (ctx: CanvasRenderingContext2D, spec: CardSpec) => void
}
