import type { DefaultTheme } from 'valaxy'

export namespace ShuimoTheme {
  export type Config = ThemeConfig
  export type Sidebar = any
}

/**
 * 支持"单色"或"按主题模式区分"的颜色输入
 * - 字符串：亮/暗模式共用这个值
 * - 对象：可分别指定 light / dark，省略的模式走主题默认
 */
export type ThemeModeColor = string | {
  light?: string
  dark?: string
}

export interface ThemeConfig extends DefaultTheme.Config {
  colors: {
    /** 主色（古铜） @default '#8B4513' */
    primary: string
    /** 印章色（朱红） @default '#C8102E' */
    stamp: string
  }

  fonts: Partial<{
    /** 衬线字体 */
    serif: string
    /** 标题字体（如篆书） */
    title: string
    /** 正文字体 */
    body: string
    /** 外部字体 URL（如 Google Fonts） */
    url: string
  }>

  header: {
    /** 站名 */
    title: string
    /** 副标题 */
    subtitle: string
  }

  footer: Partial<{
    since: number
    powered: boolean
    beian: {
      enable: boolean
      icp: string
    }
  }>

  sidebar: Partial<{
    author: {
      name: string
      motto: string
      avatar?: string
    }
  }>

  nav: NavItem[]

  stamp: Partial<{
    /** @default true */
    enable: boolean
    /** 印章文字 */
    author: string
    /** 阴章/阳章 @default 'yin' */
    type: 'yin' | 'yang'
    /** 印章形状 @default 'auto' */
    shape: 'auto' | 'circle' | 'ellipse'
  }>

  /** 画面装饰配置 */
  decorations: Partial<{
    /** 总开关 @default true */
    enable: boolean
    /** 四季花卉自动切换 @default true */
    seasonAware: boolean
    /** 首页山水画 @default true */
    heroLandscape: boolean
    /**
     * 幕布底色，默认走内置的 `--sm-curtain-bg` CSS 变量
     * （亮色 `#E8D7A5` 金褐陈年纸、暗色 `#1D2230` 青黛夜幕）。
     * 支持字符串或 `{ light, dark }` 对象分别配置。
     * @example '#E8D7A5'
     * @example { light: '#E8D7A5', dark: '#1D2230' }
     */
    curtainColor: ThemeModeColor
    /**
     * 幕布宣纸纹理的 baseColor，默认亮色 `#E8D7A5` / 暗色 `#1D2230`。
     * 支持字符串或 `{ light, dark }` 对象分别配置。
     * @example '#E8D7A5'
     * @example { light: '#E8D7A5', dark: '#1D2230' }
     */
    curtainPaperColor: ThemeModeColor
    /** 装饰透明度 (0-1) @default 0.12 */
    opacity: number
  }>

  /** 宣纸背景配置 */
  xuanPaper: Partial<{
    /** 使用 shuimo-core 生成的宣纸纹理 @default true */
    enable: boolean
    /** 纸张变体 @default 'processed' */
    variant: 'processed' | 'aged' | 'gold'
    /** 洒金密度 (0-1)，仅 `variant: 'gold'` 生效 @default 0.3 */
    goldDensity: number
  }>

  /** 毛笔线条配置 */
  brushStrokes: Partial<{
    /** 用毛笔笔触替换 CSS 线条 @default true */
    enable: boolean
  }>

  /** 文章目录配置 */
  toc: Partial<{
    /** 总开关 @default true */
    enable: boolean
    /** 最大提取层级 (2=h2, 3=h2+h3) @default 3 */
    maxDepth: 2 | 3
  }>

  /** 阅读信息配置 */
  readingInfo: Partial<{
    /** 总开关 @default true */
    enable: boolean
    /** 显示字数 @default true */
    wordCount: boolean
    /** 显示阅读时长 @default true */
    readingTime: boolean
    /** 显示更新时间 @default false */
    updatedTime: boolean
    /** 显示原创标记 @default false */
    originalMark: boolean
    /** 中文阅读速度（字/分） @default 300 */
    wordsPerMinute: number
  }>

  /** 图片题注配置 */
  imageCaption: Partial<{
    /** 总开关 @default true */
    enable: boolean
    /** 自动编号 @default true */
    autoNumbering: boolean
    /** 编号前缀 @default '图' */
    prefix: string
  }>
}

export interface NavItem {
  text: string
  link: string
  icon?: string
}

export type ThemeUserConfig = Partial<ThemeConfig>
