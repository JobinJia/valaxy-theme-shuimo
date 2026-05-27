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
    /** 印章文字（传给 V2 的 `text`） */
    author: string
    /** 阴章/阳章 @default 'yang' */
    mode: 'yin' | 'yang'
    /** @deprecated 改用 `mode`；若两者都设，`mode` 优先 */
    type: 'yin' | 'yang'
    /** 印章形状 @default 'rect'；`'rectangle'` 为 `'rect'` 的兼容别名 */
    shape:
      | 'auto' | 'square' | 'rect' | 'rectangle'
      | 'circle' | 'ellipse' | 'polygon'
    /** shape='polygon' 时的边数 @default 6 */
    polygonSides: number
    /** shape='polygon' 时的顶/边朝向 @default 'flat-top' */
    polygonOrientation: 'flat-top' | 'point-top'
    /** 篆体几何 baseline（V2 新增） */
    script: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'
    /** 印泥色 @default '#C8102E' → V2 `ink.color` */
    color: string
    /** 随机种子 @default 69706 */
    seed: number
    /**
     * 顶层"作者落款类"印章 (vnav 主印章、about 页、post 落款) 的默认尺寸（px）。
     * 各组件自己的 size override 优先。vnav 主印章另有 `stamp.nav.mainSize` 单独
     * 覆盖；post 落款印章走 frontmatter；curtain 走 `stamp.curtain.size`；装饰/
     * 功能类小印章 (theme toggle / mobile inscription / solar seal) 走
     * `stamp.decor.size`。
     * @default 200
     */
    size: number
    /**
     * 装饰/功能类小印章 (theme toggle、mobile inscription、solar seal) 的默认
     * 尺寸（px）。独立于 `size` (那是给作者落款类印章的)，便于在"巨大的作者印章"
     * 和"恒定小尺寸的装饰挂件"之间分开调，避免一改 `stamp.size` 把 toggle 撑成
     * 200px。各组件自己的 size override 仍优先。
     *
     * 字段名故意叫 `decor` 而非 `decorations`，避免和顶层 `themeConfig.decorations`
     * (画面装饰：花卉/山水/幕布) 视觉混淆。
     *
     * @default 由各组件决定 (toggle 32/48, inscription 40, solar 80)
     */
    decor: Partial<{
      size: number
    }>
    /** 文字水平偏移 -1~1 → V2 `layout.offsetX` @default 0 */
    offsetX: number
    /** 文字垂直偏移 -1~1 → V2 `layout.offsetY` @default 0 */
    offsetY: number
    /** → V2 `layout.padding` */
    padding: number
    /** → V2 `layout.gap`（行列共享） */
    gap: number
    /** → V2 `layout.columnGap` */
    columnGap: number
    /** → V2 `layout.rowGap` */
    rowGap: number
    /** → V2 `layout.stretch` */
    stretch: boolean
    /** → V2 `layout.cellHeightMode`：'fit' 按每行最高字 ink height 分配行高，避免短字 cell 视觉空缺；'uniform'（默认）所有 cell 等高 */
    cellHeightMode: 'uniform' | 'fit'
    /**
     * 印章字形字体的 URL（woff2/ttf/otf；shuimo-core V2 用 fontkit 抽取矢量路径）。
     * 不填则用主题自带的 yishanbeizhuanti.woff2。注意这不是 CSS font-family，
     * 是真实字节流的网络地址。
     * @example '/fonts/mySeal.woff2'
     */
    fontUrl: string
    /**
     * 缺字补全字体 URL（必须 TTF/OTF，不支持 woff2）。当主 `fontUrl` 加载的
     * 字体里没有 `text` 中的某些字时，V2 会用 harfbuzz-subset 对该 URL 做
     * 运行时子集化补字。需配合 `harfbuzzSubsetWasmUrl`。
     */
    fontFallbackUrl: string
    /**
     * harfbuzz-subset.wasm 的 URL，配合 `fontFallbackUrl` 使用。wasm 文件随
     * `harfbuzzjs` npm 包发布，位于 `harfbuzzjs/dist/harfbuzz-subset.wasm`。
     */
    harfbuzzSubsetWasmUrl: string
    /** → V2 `border.*` */
    border: Partial<{
      thickness: number
      cornerRadius: number
      corner: 'none' | 'round' | 'stone'
      /** 0..1 */
      roughness: number
    }>
    /** → V2 `carving.*` */
    carving: Partial<{
      intensity: number
      breakage: number
    }>
    /** → V2 `ink.*`（不含 color，color 走顶层） */
    ink: Partial<{
      density: number
      bleed: number
      grain: number
      aging: number
    }>
    /** → V2 `notch.*` */
    notch: {
      strategy: 'auto' | 'manual' | 'none'
      charIndex?: number
      strokeHint?: 'longest' | 'nearest'
      jitter?: number
    }
    /** → V2 `pressing.*` */
    pressing: Partial<{
      rotate: number
      pressure: number
      partialLoss: number
      offset: [number, number]
    }>

    /** 导航菜单印章配置 */
    nav: Partial<{
      /** 阴章/阳章 @default 'yang' */
      mode: 'yin' | 'yang'
      /** @deprecated 改用 `mode` */
      type: 'yin' | 'yang'
      /** 印章形状 @default 'rect' */
      shape: 'auto' | 'square' | 'rect' | 'rectangle' | 'circle' | 'ellipse' | 'polygon'
      polygonSides: number
      polygonOrientation: 'flat-top' | 'point-top'
      /** 是否显示菜单 icon @default false */
      showIcon: boolean
      /**
       * vnav 区域的主"作者印章"尺寸（与 mobile/desktop menu 印章不同）。
       * 未设置时回退到顶层 `stamp.size`，再回退到 56。
       * @default 56
       */
      mainSize: number
      /** 移动端菜单印章尺寸（px） @default 40 */
      mobileSize: number
      /** 桌面端菜单印章尺寸（px） @default 48 */
      desktopSize: number
      /** 印章字形字体的 URL（woff2/ttf/otf）。不填走主题自带的 yishanbeizhuanti.woff2。 */
      fontUrl: string
      /** 缺字补全字体 URL（仅 TTF/OTF），配合 `harfbuzzSubsetWasmUrl` 在运行时子集化补字 */
      fontFallbackUrl: string
      /** harfbuzz-subset.wasm 的 URL，配合 `fontFallbackUrl` 使用 */
      harfbuzzSubsetWasmUrl: string
    }>

    /** 开屏幕布印章配置（独立于主印章，不会继承 `stamp.*`） */
    curtain: Partial<{
      /** 印章文字 @default '受命,于天,既寿,永昌' */
      author: string
      /** 印章颜色 */
      color: string
      /** 阴章/阳章 @default 'yin'（V1 默认就是 yin，保留视觉一致） */
      mode: 'yin' | 'yang'
      /** @deprecated 改用 `mode` */
      type: 'yin' | 'yang'
      /** 印章形状 @default 'rect' */
      shape: 'auto' | 'square' | 'rect' | 'rectangle' | 'circle' | 'ellipse' | 'polygon'
      polygonSides: number
      polygonOrientation: 'flat-top' | 'point-top'
      /** 篆体几何 baseline（V2 新增） */
      script: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'
      /** @default 69706 */
      seed: number
      /** 幕布印章容器尺寸（px）。未设置时由 App.vue 按文字列数自适应 */
      size: number
      offsetX: number
      offsetY: number
      padding: number
      gap: number
      columnGap: number
      rowGap: number
      stretch: boolean
      cellHeightMode: 'uniform' | 'fit'
      border: Partial<{
        thickness: number
        cornerRadius: number
        corner: 'none' | 'round' | 'stone'
        roughness: number
      }>
      carving: Partial<{ intensity: number, breakage: number }>
      ink: Partial<{ density: number, bleed: number, grain: number, aging: number }>
      notch: {
        strategy: 'auto' | 'manual' | 'none'
        charIndex?: number
        strokeHint?: 'longest' | 'nearest'
        jitter?: number
      }
      pressing: Partial<{
        rotate: number
        pressure: number
        partialLoss: number
        offset: [number, number]
      }>
      /** 印章字形字体的 URL（woff2/ttf/otf）。不填走主题自带的 yishanbeizhuanti.woff2。 */
      fontUrl: string
      /** 缺字补全字体 URL（仅 TTF/OTF），配合 `harfbuzzSubsetWasmUrl` 在运行时子集化补字 */
      fontFallbackUrl: string
      /** harfbuzz-subset.wasm 的 URL，配合 `fontFallbackUrl` 使用 */
      harfbuzzSubsetWasmUrl: string
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
    /**
     * 场景画布高度（SVG viewBox 高度）。和 shuimo-core MountPlanner 的 y 坐标系对齐，
     * 800 是元素原生分布最自然的高度；调小会压缩上下留白，调大会拉高天空 / 露出水面。
     * 视口适配由 preserveAspectRatio=slice 处理，改这个值不影响宽度。
     * @default 800
     */
    sceneHeight: number

    /** 移动端花卉背景（替换移动端山水画） */
    mobileFlower: Partial<{
      /** 开关 @default true */
      enable: boolean
      /**
       * 花卉类型
       * - 'woody': 木本
       * - 'herbal': 草本
       * - 'random': 每次随机
       * - 'season': 根据季节自动（春兰/夏竹/秋菊/冬梅 → herbal/woody）
       * @default 'season'
       */
      type: 'woody' | 'herbal' | 'random' | 'season'
      /** 固定种子，不设则每次刷新随机 */
      seed: number
      /** 透明度 0-1 @default 0.8 */
      opacity: number
    }>
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

    /** 各视觉层独立开关（moon/mist 为夜空；sun/glowMorning/glowDusk/skyTint 为白昼；vignette 共享） */
    layers: Partial<{
      moon: boolean
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
