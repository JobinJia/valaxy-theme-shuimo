import type { ThemeConfig } from 'valaxy-theme-shuimo'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'shuimo',

  siteConfig: {
    url: 'https://jobinjia.com/',
  },

  themeConfig: {
    colors: {
      primary: '#FF00AA',
      stamp: '#D4A017',
    },

    fonts: {
      serif: '"Songti SC", "Noto Serif SC", serif',
      body: '"PingFang SC", "Noto Serif SC", serif',
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
        icon: 'i-ant-design-book-outlined',
      },
      {
        text: '暗香阁',
        link: '/about',
        icon: 'i-ant-design-user-outlined',
      },
    ],

    footer: {
      since: 2020,
      powered: true,
      beian: {
        enable: true,
        icp: '沪ICP备20260000号-1',
      },
    },

    sidebar: {
      author: {
        name: '月牙',
        motto: '落梅听风雪，隔窗枕雨眠',
        avatar: '/assets/images/yueya.jpg',
        stamp: '听雨',
      },
      showCategories: true,
      showTags: true,
      showRecent: true,
    },

    stamp: {
      enable: true,
      author: '隔窗,听雨',
      type: 'yin',
      shape: 'ellipse',
    },

    decorations: {
      enable: true,
      seasonAware: false,
      heroLandscape: true,
      curtainColor: '#1F2937',
      curtainPaperColor: '#E8D7A5',
      opacity: 0.22,
    },

    xuanPaper: {
      enable: true,
      variant: 'gold',
    },

    brushStrokes: {
      enable: true,
    },
  },
})
