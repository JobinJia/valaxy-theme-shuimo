import type { ThemeConfig } from 'valaxy-theme-shuimo1'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'shuimo1',

  themeConfig: {
    colors: {
      primary: '#8B4513',
      stamp: '#C8102E',
    },

    header: {
      title: '墨韵书斋',
      subtitle: '以墨会友 · 以文载道',
    },

    nav: [
      {
        text: '首页',
        link: '/',
      },
      {
        text: '归档',
        link: '/archives/',
      },
      {
        text: '关于',
        link: '/about/',
      },
    ],

    footer: {
      since: 2024,
      powered: true,
    },

    sidebar: {
      author: {
        name: '墨客',
        motto: '以码为墨，以屏为纸',
      },
    },

    stamp: {
      enable: true,
      author: '墨',
      type: 'yin',
    },
  },
})
