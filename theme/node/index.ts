import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ThemeConfig } from '../types'

/**
 * 水墨主题默认配置 | Shuimo Theme Default Config
 */
export const defaultThemeConfig: ThemeConfig = {
  valaxyDarkOptions: {
    circleTransition: true,
  },

  colors: {
    primary: '#2C2C2C', // 墨色 | Ink color
    paper: '#FAF9F6', // 宣纸色 | Rice paper color
    ink: {
      dark: '#1a1a1a', // 浓墨 | Dark ink
      medium: '#4a4a4a', // 中墨 | Medium ink
      light: '#8a8a8a', // 淡墨 | Light ink
    },
    accent: '#C8161D', // 朱砂红 | Cinnabar red
  },

  font: {
    heading: 'serif',
    body: 'serif',
  },

  decoration: {
    inkTexture: true,
    seal: true,
    sealPosition: 'footer',
    inkBorder: false,
    bamboo: false,
  },

  animation: {
    inkDiffusion: true,
    pageTransition: 'ink',
    parallax: false,
  },

  layout: {
    style: 'classic',
    verticalText: false,
    showHeaderDecoration: true,
  },

  footer: {
    since: 2024,
    icon: {
      name: 'i-ri-ink-bottle-line', // 墨瓶图标 | Ink bottle icon
      animated: true,
      color: 'var(--va-c-primary)',
      url: 'https://github.com/YunYouJun/valaxy-theme-shuimo',
      title: 'Shuimo Theme',
    },

    powered: true,

    beian: {
      enable: false,
      icp: '',
    },
  },

  nav: [],
}

// write a vite plugin
// https://vitejs.dev/guide/api-plugin.html
export function themePlugin(options: ResolvedValaxyOptions<ThemeConfig>): Plugin {
  const themeConfig = options.config.themeConfig || {}

  return {
    name: 'valaxy-theme-shuimo',

    config() {
      return {
        css: {
          preprocessorOptions: {
            scss: {
              additionalData: `$c-primary: ${themeConfig.colors?.primary || '#0078E7'} !default;`,
            },
          },
        },

        valaxy: {},
      }
    },
  }
}

/**
 * generateSafelist by config
 * @param themeConfig
 */
export function generateSafelist(themeConfig: ThemeConfig) {
  const safelist: string[] = []

  const footerIcon = themeConfig.footer?.icon?.name
  if (footerIcon)
    safelist.push(footerIcon)

  return safelist
}
