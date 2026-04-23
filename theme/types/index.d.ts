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

export type ThemePreset = 'classic' | 'night' | 'gold' | 'minimal' | 'album'

export interface ThemeConfig extends DefaultTheme.Config {
  /** 主题预设，一键套用风格 */
  preset?: ThemePreset
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
    /** 印章颜色 @default '#C8102E' */
    color: string
    /** 阴章/阳章 @default 'yang' */
    type: 'yin' | 'yang'
    /** 印章形状 @default 'rectangle' */
    shape: 'auto' | 'circle' | 'ellipse' | 'rectangle' | 'square'
    /** 字体族 */
    fontFamily: string
    /** 字体大小（px） @default 70 */
    fontSize: number
    /** 字体粗细 @default 'normal' */
    fontWeight: string
    /** 文字刻法 @default 'normal' */
    textCarving: 'normal' | 'strong' | 'stone-cut'
    /** 文字水平偏移 -1~1 @default 0 */
    offsetX: number
    /** 文字垂直偏移 -1~1 @default 0 */
    offsetY: number
    /** 总体边框缩放 @default 1 */
    borderScale: number
    /** 列间距比例 @default 0.01 */
    columnSpacing: number
    /** 字间距比例 @default 0.045 */
    characterSpacing: number
    /** 水平内边距比例 @default 0.015 */
    paddingX: number
    /** 垂直内边距比例 @default 0.02 */
    paddingY: number
    /** 绝对列间距（px），优先级高于 columnSpacing */
    columnSpacingPx: number
    /** 绝对字间距（px），优先级高于 characterSpacing */
    characterSpacingPx: number
    /** 绝对水平内边距（px），优先级高于 paddingX */
    paddingXPx: number
    /** 绝对垂直内边距（px），优先级高于 paddingY */
    paddingYPx: number
    /** 水平边框缩放 @default 1 */
    borderScaleX: number
    /** 垂直边框缩放 @default 1 */
    borderScaleY: number
    /** 噪点量（px） @default 10 */
    noiseAmountPx: number
    /** 边框采样点数 @default 24 */
    borderPointsPx: number
    /** 圆角半径（px） @default 10 */
    cornerRadiusPx: number
    /** 边框宽度（px） @default 4 */
    borderWidthPx: number
    /** 是否规则形状 @default true */
    regularShape: boolean
    /** 随机种子，用于可复现的生成 @default 69706 */
    seed: number
    /** 容器显示尺寸（px） */
    size: number
    /** 导航菜单印章配置 */
    nav: Partial<{
      /** 阴章/阳章 @default 'yang' */
      type: 'yin' | 'yang'
      /** 印章形状 @default 'rectangle' */
      shape: 'auto' | 'circle' | 'ellipse' | 'rectangle' | 'square'
      /** 是否显示菜单 icon @default false */
      showIcon: boolean
      /** 移动端菜单印章尺寸（px） @default 40 */
      mobileSize: number
      /** 桌面端菜单印章尺寸（px） @default 48 */
      desktopSize: number
    }>
    /** 开屏幕布印章配置（独立于主印章，不会继承 `stamp.*`） */
    curtain: Partial<{
      /** 印章文字 @default '受命,于天,既寿,永昌' */
      author: string
      /** 印章颜色 */
      color: string
      /** 阴章/阳章 @default 'yang' */
      type: 'yin' | 'yang'
      /** 印章形状 @default 'rectangle' */
      shape: 'auto' | 'circle' | 'ellipse' | 'rectangle' | 'square'
      /** 字体族，缺省时走 `fonts.title` */
      fontFamily: string
      /** 字体大小（px） @default 70 */
      fontSize: number
      /** 字体粗细 @default 'normal' */
      fontWeight: string
      /** 文字刻法 @default 'normal' */
      textCarving: 'normal' | 'strong' | 'stone-cut'
      /** 文字水平偏移 -1~1 @default 0 */
      offsetX: number
      /** 文字垂直偏移 -1~1 @default 0 */
      offsetY: number
      /** 总体边框缩放 @default 1 */
      borderScale: number
      /** 列间距比例 */
      columnSpacing: number
      /** 字间距比例 */
      characterSpacing: number
      /** 水平内边距比例 */
      paddingX: number
      /** 垂直内边距比例 */
      paddingY: number
      /** 绝对列间距（px） @default 0.35 */
      columnSpacingPx: number
      /** 绝对字间距（px） @default 3.2 */
      characterSpacingPx: number
      /** 绝对水平内边距（px） @default 1.5 */
      paddingXPx: number
      /** 绝对垂直内边距（px） @default 1.5 */
      paddingYPx: number
      /** 水平边框缩放 @default 1 */
      borderScaleX: number
      /** 垂直边框缩放 @default 1 */
      borderScaleY: number
      /** 噪点量（px） @default 10 */
      noiseAmountPx: number
      /** 边框采样点数 @default 24 */
      borderPointsPx: number
      /** 圆角半径（px） @default 10 */
      cornerRadiusPx: number
      /** 边框宽度（px） @default 4 */
      borderWidthPx: number
      /** 是否规则形状 @default true */
      regularShape: boolean
      /** 随机种子 @default 69706 */
      seed: number
      /** 幕布印章容器尺寸（px）。未设置时根据文字长度自适应 */
      size: number
    }>
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

  /** 卷首语/题词配置（首页） */
  preface: Partial<{
    /** 引言文字 */
    quote: string
    /** 出处 / 署名，如 "—— 李白《静夜思》" */
    source: string
  }>

  /** 首页组件显隐配置 */
  home: Partial<{
    /** 文章列表 @default true */
    postList: boolean
  }>

  /** 首页山水 seed 配置 */
  hero: Partial<{
    /** 固定 seed（设置后每次加载画面相同） */
    seed: number
    /** 显示 seed 控制面板（复制 / 随机） @default false */
    showSeedControl: boolean
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

  /** 天文驱动的暗色夜空（仅 dark mode 生效，且仅在显示 Hero 的页面） */
  astronomy?: Partial<{
    /** 总开关 @default true */
    enable: boolean

    /** 博主默认坐标。未设置时兜底 = 重庆 N29.56° E106.55° */
    location: {
      lat: number
      lng: number
      /**
       * 可选，仅用于 hover 提示展示。不填时显示原始坐标。
       * TODO: 后续接入反向地理编码自动获取
       */
      name?: string
    }

    /** 是否允许访客切换到自己的位置 @default true */
    allowVisitorOverride: boolean

    /** 各视觉层独立开关（moon/stars/mist 为夜空；sun/glowMorning/glowDusk/skyTint 为白昼；vignette 共享） */
    layers: Partial<{
      moon: boolean
      stars: boolean
      mist: boolean
      vignette: boolean
      sun: boolean
      glowMorning: boolean
      glowDusk: boolean
      skyTint: boolean
    }>

    /** 月亮调节 */
    moon: Partial<{
      /** 月亮直径 px @default 70 */
      size: number
      /** 月相是否随纬度倾斜 @default true */
      tiltByLatitude: boolean
    }>

    /** 星点调节 */
    stars: Partial<{
      /** 星点数量 @default 16 */
      count: number
      /** 是否随月相联动（月明星稀） @default true */
      moonLinked: boolean
    }>

    /** 太阳调节 */
    sun: Partial<{
      /** 直径 px @default 60 */
      size: number
      /** 朱红色 @default '#D9362E' */
      color: string
    }>

    /** 烟雾调节 */
    mist: Partial<{
      /** 烟雾透明度 @default 0.12 */
      opacity: number
      /** 漂移周期秒 @default 120 */
      driftDuration: number
    }>
  }>
}

export interface NavItem {
  text: string
  link: string
  icon?: string
}

export type ThemeUserConfig = Partial<ThemeConfig>
