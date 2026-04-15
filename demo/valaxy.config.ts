import type { ThemeConfig } from 'valaxy-theme-shuimo'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'shuimo',

  siteConfig: {
    url: 'https://jobinjia.com/',
  },

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
        text: '栖墨斋',
        link: '/archives',
      },
      {
        text: '暗香阁',
        link: '/about',
      },
    ],

    footer: {
      since: 2026,
      powered: true,
    },

    sidebar: {
      author: {
        name: '月牙',
        motto: '落梅听风雪，隔窗枕雨眠',
        avatar: '/assets/images/yueya.jpg',
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
