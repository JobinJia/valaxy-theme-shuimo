# 配置支持矩阵

> 目标：对齐 `README`、`theme/types/index.d.ts`、`theme/node/index.ts` 与实际运行时行为。  
> 状态说明：`已实现` / `部分实现` / `未实现`

| 配置项 | 默认值来源 | 运行时状态 | 当前实现位置 | 说明 |
|------|------|------|------|------|
| `colors.primary` | `theme/node/index.ts` | 已实现 | `theme/composables/useThemeCssVars.ts` | 已映射到品牌色与主色透明度变量 |
| `colors.stamp` | `theme/node/index.ts` | 已实现 | `theme/composables/useThemeCssVars.ts` | 已映射到印章色变量 |
| `fonts.serif` | `theme/node/index.ts` | 已实现 | `theme/composables/useThemeCssVars.ts` | 已作为基础字体 fallback 接入 |
| `fonts.title` | 用户配置 | 已实现 | 多个页面与组件内联 `fontFamily` | 已用于竖排标题、关于页、归档页等 |
| `fonts.body` | 用户配置 | 已实现 | `theme/composables/useThemeCssVars.ts` | 已优先映射到全局基础字体变量 |
| `fonts.url` | 用户配置 | 已实现 | `theme/components/ShuimoLayout.vue` | 通过 `useHead` 注入外部字体链接 |
| `header.title` | `theme/node/index.ts` | 已实现 | Header / Footer / VerticalNav 等 | 主题站名正常生效 |
| `header.subtitle` | `theme/node/index.ts` | 已实现 | Header / VerticalNav | 正常生效 |
| `footer.since` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoFooter.vue` | 已用于版权年份区间展示 |
| `footer.powered` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoFooter.vue` | 可开关 |
| `footer.beian.enable` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoFooter.vue` | 可开关 |
| `footer.beian.icp` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoFooter.vue` | 可显示备案号 |
| `sidebar.author.name` | `theme/node/index.ts` | 已实现 | Sidebar / VerticalNav / About / 分类标签页 | 正常生效 |
| `sidebar.author.motto` | `theme/node/index.ts` | 已实现 | Sidebar / About 等 | 正常生效 |
| `sidebar.author.avatar` | 用户配置 | 已实现 | Sidebar / VerticalNav / post 布局 | 正常生效 |
| `sidebar.author.stamp` | README / 类型声明 | 已实现 | `theme/components/ShuimoSidebar.vue` | 已优先作为侧边栏印章文案来源 |
| `sidebar.showCategories` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoSidebar.vue` | 可开关 |
| `sidebar.showTags` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoSidebar.vue` | 可开关 |
| `sidebar.showRecent` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoSidebar.vue` | 可开关 |
| `nav[].text` | 用户配置 | 已实现 | Header / VerticalNav | 正常生效 |
| `nav[].link` | 用户配置 | 已实现 | Header / VerticalNav | 正常生效 |
| `nav[].icon` | 用户配置 | 已实现 | Header / VerticalNav + Uno safelist | 图标已在横向导航与首页竖排导航中渲染 |
| `stamp.enable` | `theme/node/index.ts` | 已实现 | Article / VerticalNav 等 | 可开关 |
| `stamp.author` | `theme/node/index.ts` | 已实现 | Sidebar / Article / VerticalNav | 正常生效 |
| `stamp.type` | `theme/node/index.ts` | 已实现 | Sidebar / Article / VerticalNav | 正常生效 |
| `stamp.shape` | README / 类型声明 | 已实现 | Sidebar / Article / About / VerticalNav | 主题主要印章场景已统一透传 |
| `decorations.enable` | `theme/node/index.ts` | 部分实现 | `theme/components/ShuimoDecoration.vue` | 组件支持，但需确认页面是否稳定挂载 |
| `decorations.seasonAware` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoDecoration.vue` | 关闭后回退到固定 `plum` 装饰，不再自动切季 |
| `decorations.heroLandscape` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoLayout.vue` | 首页山水与幕布动画已受配置开关控制 |
| `decorations.opacity` | `theme/node/index.ts` | 已实现 | `theme/components/ShuimoDecoration.vue` | 未显式传入 `opacity` 时回落到主题配置 |
| `xuanPaper.enable` | `theme/node/index.ts` | 已实现 | `ShuimoLayout` / `default` 布局 + `ShuimoXuanPaper` | 可关闭主题宣纸纹理 |
| `xuanPaper.variant` | `theme/node/index.ts` | 已实现 | `ShuimoLayout` / `default` 布局 + `ShuimoXuanPaper` | 可切换纸张变体 |
| `brushStrokes.enable` | `theme/node/index.ts` | 已实现 | `ShuimoBrushLine` / `useBrushStyles` | 主体已接入，Markdown 笔触变量仍需二次核对 |

## 第一轮处理建议

### 当前剩余说明

- `decorations.enable` 仍属于“组件已支持，页面使用面有待继续扩展”的状态，但不影响 `P0-1` 的配置兑现目标。

## 结论

- 当前最核心的问题不是“配置项少”，而是“配置声明与运行时能力不完全一致”。
- `P0-1` 完成标准应当是：用户在 README 里看到的每个主要配置项，都能在 demo 中直观看到效果，或者被明确标记为暂不支持。
