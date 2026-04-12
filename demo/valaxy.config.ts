import type { ThemeConfig } from 'valaxy-theme-shuimo1'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'shuimo1',

  themeConfig: {
    colors: {
      primary: '#8B4513',
      stamp: '#C8102E',
    },

    fonts: {
      title: 'YiShanBeiZhuan',
    },

    header: {
      title: '落梅听雪阁',
      subtitle: '落梅听风雪，隔窗枕雨眠',
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
      author: '隔窗,听雨',
      type: 'yin',
      shape: 'ellipse',
    },
  },
})
