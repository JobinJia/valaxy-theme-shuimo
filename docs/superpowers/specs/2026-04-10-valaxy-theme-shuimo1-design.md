# valaxy-theme-shuimo1 设计文档

## 概述

为 Valaxy 博客框架创建一个传统中国水墨画风格的主题，名为 `valaxy-theme-shuimo1`。主题以「古卷暖棕」为基调，融合传统水墨美学与现代 Web 技术，核心视觉用 CSS 实现，少量亮点功能（印章生成）按需引入 `@jobinjia/shuimo-core`。

## 项目结构

基于 [valaxy-theme-starter](https://github.com/valaxyjs/valaxy-theme-starter) 的标准 Valaxy 主题 monorepo 结构：

```
valaxy-theme-shuimo1/
├── theme/
│   ├── client/
│   │   └── index.ts                # 客户端入口，导出 composables
│   ├── components/
│   │   ├── ShuimoLayout.vue        # 主布局壳（卷轴动画 + 路由视图）
│   │   ├── ShuimoHeader.vue        # 题字牌匾式导航
│   │   ├── ShuimoSidebar.vue       # 右侧边栏（印章头像/分类/标签/近作）
│   │   ├── ShuimoArticle.vue       # 文章页布局（宣纸古卷风）
│   │   ├── ShuimoArticleCard.vue   # 文章列表卡片
│   │   ├── ShuimoPostList.vue      # 文章列表容器
│   │   ├── ShuimoFooter.vue        # 页脚
│   │   ├── ShuimoDate.vue          # 日期显示（支持天干地支格式）
│   │   ├── ShuimoScrollReveal.vue  # 卷轴展开入场动画
│   │   ├── ShuimoStamp.vue         # 印章组件（按需引入 shuimo-core）
│   │   ├── ShuimoHelper.vue        # 回到顶部按钮
│   │   └── ValaxyMain.vue          # 主内容包装器
│   ├── composables/
│   │   ├── config.ts               # useThemeConfig
│   │   └── index.ts                # 导出桶
│   ├── layouts/
│   │   ├── default.vue             # 默认布局
│   │   ├── home.vue                # 首页布局
│   │   ├── post.vue                # 文章布局
│   │   └── 404.vue                 # 404 页面
│   ├── pages/
│   │   └── index.vue               # 首页
│   ├── locales/
│   │   ├── en.yml
│   │   └── zh-CN.yml
│   ├── node/
│   │   └── index.ts                # 服务端主题配置
│   ├── styles/
│   │   ├── index.ts                # 样式入口
│   │   ├── vars.scss               # SCSS 变量（配色、字体）
│   │   ├── css-vars.scss           # CSS 自定义属性
│   │   ├── main.scss               # 全局样式汇总
│   │   ├── layout.scss             # 布局样式
│   │   ├── markdown.scss           # Markdown 内容样式（宣纸风）
│   │   ├── scroll-reveal.scss      # 卷轴展开动画
│   │   └── xuan-paper.scss         # 宣纸纹理 CSS 实现
│   ├── types/
│   │   └── index.d.ts              # ThemeConfig 类型定义
│   ├── package.json
│   └── valaxy.config.ts            # 主题配置（Vite 插件 + 默认配置）
├── demo/
│   ├── pages/
│   │   ├── index.md
│   │   └── posts/
│   │       └── hello.md            # 示例文章
│   ├── package.json
│   └── valaxy.config.ts            # Demo 站点配置
├── package.json                    # 根 monorepo
├── pnpm-workspace.yaml
├── tsconfig.json
├── uno.config.ts
└── eslint.config.js
```

## 设计决策

### 1. 配色系统（古卷暖棕）

```scss
// 主色调
$ink-dark: #2a2520; // 焦墨 — 标题、强调
$ink-medium: #6b5e50; // 赭石 — 正文
$ink-light: #8a7e70; // 淡墨 — 辅助文字、日期
$accent: #8b4513; // 古铜 — 链接、强调色
$stamp-red: #c8102e; // 朱红 — 仅印章使用

// 背景
$paper-bg: #f5f0e6; // 古宣纸底
$paper-light: #faf7f0; // 浅宣纸（文章内容区）
$paper-card: #ece6d8; // 卡片/标签背景

// 边框/分隔
$border-subtle: rgba(107, 94, 80, 0.15);
$border-medium: rgba(107, 94, 80, 0.25);
```

### 2. 字体

```scss
$font-serif: 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', Georgia, serif;
$font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

- 标题：衬线体，大字距 `letter-spacing: 4-10px`
- 正文：衬线体，行高 1.9-2.0，首行缩进 2em
- 代码：等宽字体，古宣纸底色代码块

### 3. 布局结构（主副双栏）

- **题字牌匾式导航**：居中大字站名 + 副标题 + 笔触装饰线 + 水平导航链接
- **主内容区**：max-width 800px 居中，左侧文章列表/内容
- **右侧边栏**（~180px）：印章头像、分类、标签、近作
- **页脚**：居中，细线分隔

### 4. 卷轴展开入场动画

页面加载时，显示一个卷轴从屏幕中间向两边展开的 CSS 动画：

- 初始状态：两个卷轴轴心并拢在屏幕中央，中间露出一条缝
- 动画过程：两个卷轴向左右分离，中间的"纸面"逐渐展开露出
- 完成后：卷轴淡出，页面内容完全显示
- 持续时间：约 1.5-2s
- 仅首次访问触发（sessionStorage 标记）

实现方式：纯 CSS animation + Vue transition，不依赖外部库。

### 5. 文章页（宣纸古卷风）

- 背景：CSS 模拟宣纸纤维纹理（repeating-linear-gradient 叠加 + 微噪点）
- 标题：居中，大字距，下方朱红细线
- 日期：天干地支格式显示（如"癸卯年三月十五"）+ 标准日期 fallback
- 正文：text-indent 2em，line-height 2，text-align justify
- 落款：文末右下角印章组件（调用 shuimo-core 的 Stamp）
- 标题装饰：h2/h3 左侧墨色渐变竖线

### 6. shuimo-core 集成（混合方案）

**CSS 实现（不依赖 shuimo-core）：**

- 宣纸纹理背景（CSS gradient + filter 模拟）
- 笔触装饰线（CSS gradient）
- 墨色渐变效果
- 所有排版和布局

**按需引入 shuimo-core：**

- `ShuimoStamp.vue`：使用 `generateStampAsync()` 生成印章图片
  - 作者落款印章（文章末尾）
  - 侧边栏头像印章
- 未来可扩展：动态水墨背景装饰

引入方式：`@jobinjia/shuimo-core` 作为 optional peerDependency，印章组件内部动态 import，无 shuimo-core 时 fallback 为 CSS 方块印章。

### 7. ThemeConfig 类型

```ts
interface ThemeConfig {
  colors: {
    primary: string // 默认 #8B4513（古铜）
    stamp: string // 默认 #C8102E（朱红）
  }
  fonts: {
    serif: string // 自定义衬线字体
  }
  header: {
    title: string // 站名
    subtitle: string // 副标题
  }
  footer: {
    since: number
    powered: boolean
    beian: { enable: boolean, icp: string }
  }
  sidebar: {
    author: { name: string, motto: string, stamp?: string }
    showCategories: boolean
    showTags: boolean
    showRecent: boolean
  }
  nav: NavItem[]
  scrollReveal: {
    enable: boolean // 默认 true
    duration: number // 默认 1800（ms）
  }
  stamp: {
    enable: boolean // 默认 true
    author: string // 印章文字
    type: 'yin' | 'yang' // 阴章/阳章
  }
}
```

### 8. 页面类型

- **home**：文章列表 + 侧边栏
- **post**：文章详情（宣纸风）+ 侧边栏
- **default**：通用页面
- **404**：水墨风格 404（可考虑程序化生成远山迷雾意象）

### 9. 响应式设计

- **Desktop（≥1024px）**：双栏，完整侧边栏
- **Tablet（768-1023px）**：侧边栏收起为底部折叠区
- **Mobile（<768px）**：单栏，汉堡菜单，侧边栏移至页底

### 10. 不在 v1 范围内

- 暗色模式（v2）
- WebGPU 动态水墨效果
- 评论系统样式定制
- 搜索功能
- RSS 样式定制
