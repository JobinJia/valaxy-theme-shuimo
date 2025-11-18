import type { DefaultTheme } from 'valaxy'

export namespace ShuimoTheme {
  export type Config = ThemeConfig
  export type Sidebar = any
}

/**
 * 水墨主题配置 | Shuimo Theme Config
 */
export interface ThemeConfig extends DefaultTheme.Config {
  /**
   * 色彩配置 | Color Configuration
   */
  colors: {
    /**
     * 主色调 - 墨色
     * Primary color - Ink color
     * @default '#2C2C2C'
     */
    primary: string

    /**
     * 纸张色 - 背景色
     * Paper color - Background color
     * @default '#FAF9F6'
     */
    paper?: string

    /**
     * 墨色深浅配置
     * Ink shade variations
     */
    ink?: {
      /**
       * 浓墨 | Dark ink
       * @default '#1a1a1a'
       */
      dark?: string
      /**
       * 中墨 | Medium ink
       * @default '#4a4a4a'
       */
      medium?: string
      /**
       * 淡墨 | Light ink
       * @default '#8a8a8a'
       */
      light?: string
    }

    /**
     * 强调色 - 朱砂红（用于重要元素）
     * Accent color - Cinnabar red
     * @default '#C8161D'
     */
    accent?: string
  }

  /**
   * 字体配置 | Font Configuration
   */
  font?: {
    /**
     * 标题字体 | Heading font
     * 可选：'serif' | 'kaishu' | 'songti' | 'custom'
     * @default 'serif'
     */
    heading?: 'serif' | 'kaishu' | 'songti' | 'custom'

    /**
     * 正文字体 | Body font
     * @default 'serif'
     */
    body?: 'serif' | 'sans-serif' | 'songti' | 'custom'

    /**
     * 自定义字体名称 | Custom font family
     */
    customFont?: string
  }

  /**
   * 水墨装饰元素配置 | Ink Decoration Configuration
   */
  decoration?: {
    /**
     * 启用水墨纹理背景 | Enable ink texture background
     * @default true
     */
    inkTexture?: boolean

    /**
     * 启用印章元素 | Enable seal stamp
     * @default true
     */
    seal?: boolean

    /**
     * 印章位置 | Seal position
     * @default 'footer'
     */
    sealPosition?: 'header' | 'footer' | 'both' | 'none'

    /**
     * 启用水墨边框 | Enable ink border
     * @default false
     */
    inkBorder?: boolean

    /**
     * 启用竹子装饰 | Enable bamboo decoration
     * @default false
     */
    bamboo?: boolean
  }

  /**
   * 动画效果配置 | Animation Configuration
   */
  animation?: {
    /**
     * 启用墨迹扩散效果 | Enable ink diffusion effect
     * @default true
     */
    inkDiffusion?: boolean

    /**
     * 页面切换动画 | Page transition animation
     * 'fade' | 'slide' | 'ink' | 'none'
     * @default 'ink'
     */
    pageTransition?: 'fade' | 'slide' | 'ink' | 'none'

    /**
     * 启用滚动视差效果 | Enable scroll parallax
     * @default false
     */
    parallax?: boolean
  }

  /**
   * 布局配置 | Layout Configuration
   */
  layout?: {
    /**
     * 布局风格 | Layout style
     * 'classic' - 经典布局 | Classic layout
     * 'scroll' - 卷轴风格 | Scroll style
     * 'book' - 书籍风格 | Book style
     * @default 'classic'
     */
    style?: 'classic' | 'scroll' | 'book'

    /**
     * 启用竖排文字（仅在支持的布局中）| Enable vertical text
     * @default false
     */
    verticalText?: boolean

    /**
     * 显示页眉装饰 | Show header decoration
     * @default true
     */
    showHeaderDecoration?: boolean
  }

  /**
   * footer
   */
  footer: Partial<{
    /**
     * 建站于
     */
    since: number

    /**
     * Icon between year and copyright info.
     */
    icon: {
      /**
       * icon name, i-xxx
       */
      name: string
      animated: boolean
      color: string
      url: string
      title: string
    }

    /**
     * Powered by valaxy & valaxy-theme-${name}, default is yun
     */
    powered: boolean

    /**
     * Chinese Users | 中国用户
     * 备案 ICP
     * 国内用户需要在网站页脚展示备案 ICP 号
     * https://beian.miit.gov.cn/
     */
    beian: {
      enable: boolean
      /**
       * 苏ICP备xxxxxxxx号
       */
      icp: string
    }
  }>

  /**
   * navbar
   */
  nav: NavItem[]
}

export interface NavItem {
  text: string
  link: string
  icon?: string
}

export type ThemeUserConfig = Partial<ThemeConfig>
