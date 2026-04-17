# 当前分析结论

## 架构现状

- 项目是 `pnpm workspace`，根目录负责 lint、typecheck 与 demo 构建。
- `theme/` 是主题包主体，`demo/` 用于本地预览与展示。
- 主题已经具备明显产品化特征，不只是样式覆盖，还包含运行时生成的山水、宣纸与笔触效果。

## 主要发现

### 1. 配置承诺大于实际实现

- `theme/types/index.d.ts` 中声明的若干配置项，当前没有完整接入运行时。
- 风险是 README、类型与用户预期高于实际能力。
- 已建立 `planning/config-support-matrix.md`，用于逐项追踪配置兑现状态。
- 第一轮高优先问题集中在：`colors.*`、`fonts.serif/body`、`footer.since`、`decorations.*`。
- 已完成第一轮兑现：
  - 主题颜色与基础字体已映射到 CSS 变量
  - `footer.since` 已接入版权年份展示
  - `decorations.heroLandscape` 已接入首页山水与幕布开关
  - `decorations.curtainColor` 已接入首页幕布颜色控制
  - `decorations.opacity` 已接入装饰组件默认透明度
  - `decorations.seasonAware` 已接入自动季节切换控制
  - `sidebar.author.stamp` 与统一 `stamp.shape` 已接线
  - `nav[].icon` 已在 Header 与 VerticalNav 中渲染
  - `xuanPaper.enable/variant` 已接入主布局与默认布局
- `P0-1` 可视为完成，后续重点转入文章页渲染收敛。

### 1.1 人工验证补充结论

- `colors.primary` 与 `colors.stamp` 均已通过 demo 人工验证。
- 为了降低观察成本，已在 `demo/pages/about.md` 加入主题色测试块。
- 首页幕布新增了可配置颜色、中央裂印章动画，以及篆书字体优先加载，当前表现符合预期。
- 首页幕布与首页底纸都已接入宣纸纹理，且支持深色模式下的纸纹重生成。
- `decorations.curtainColor` 与 `decorations.curtainPaperColor` 已支持按亮/暗模式分别配置。
- 首页印章新增 `offsetX` 能力，可继续作为首页视觉微调入口。

### 2. 文章渲染链路已收敛

- 文章页只剩一条主渲染路径：`theme/layouts/post.vue`。
- 回收自旧组件 `ShuimoArticle.vue` 的有价值片段：
  - 文末落款印章（受 `stamp.enable` / `stamp.author` / `stamp.type` / `stamp.shape` 控制）
  - 上一篇 / 下一篇导航（基于 valaxy `usePrevNext`）
- `theme/components/ShuimoArticle.vue` 已删除，避免后续修改样式时两处同步。
- 关联 P0-2 可视为完成，日期文案与标题读取保持现状以降低风险。

### 2.1 文档与实现的轻微漂移已修正

- `README.md` 的配置表已把 `decorations.curtainColor` / `decorations.curtainPaperColor` 更正为 `ThemeModeColor`。
- README 新增 `ThemeModeColor` 小节，说明字符串写法与 `{ light, dark }` 对象写法，并给出用例。
- 类型声明、默认配置与 README 的说法现在一致，文档与实现不再错位。

### 2.2 README 与运行时的三处"承诺但不可达"已处理

- `ShuimoSidebar.vue` 是死路径，删除；并从 types / 默认配置 / demo / README 下线 `sidebar.author.stamp` 与 `sidebar.showCategories/showTags/showRecent` 这 4 个只在死组件里被读的字段。保留 `sidebar.author.{name,motto,avatar}`（主题其他组件真的在用）。
- i18n：接入 `vue-i18n` `useI18n()`，把 `shuimo.prev_post` / `shuimo.next_post` / `shuimo.back` 在 `post.vue` / `default.vue` / `404.vue` 落地。README 对应 Feature 条目改为"UI 基础文案随语言切换；主题其余文案仍以中文书写"。
- 四季花卉装饰：在 `default.vue` 的 about / 归档 / 分类标签 三个分支挂 `<ShuimoDecoration type="season" ... />`，并给 `.shuimo-page` 加 `position: relative; overflow: hidden`。这也同时让 `decorations.enable` / `decorations.seasonAware` / `decorations.opacity` 真正作用到常用浏览页面。

### 3. 首页视觉生成的性能风险已收敛

- `ShuimoLayout` 新增 `heroLandscape` prop（默认关），`home.vue` 与 `default.vue` 的首页分支显式开启。
- post / 404 / default-other 不再挂 `ShuimoHeroLandscape`，也不再渲染开屏幕布，避免非首页重复跑场景生成与动画重播。
- `ShuimoHeroLandscape` 的 `buildScene` 改由 `scheduleShuimoTask` 调度，保证执行前先 `yieldToMain`。
- 场景 SVG 新增会话级缓存，按 `{W, H}` 命中；`setBlankSide` 不再在生成器内部副作用，改为从缓存结果显式应用。
- `generateXuanPaperTexture` 原本已经走 `generateCached`，此轮未改动。

### 4. 工程验证闭环已初步建立

- 根 `package.json` 现在暴露 `pnpm test` / `pnpm test:watch`（底层均为 vitest）。
- `theme/node/index.test.ts` 覆盖 `defaultThemeConfig` 关键不变量与 `generateSafelist` 行为（空、缺失、带图标、不带图标）。
- 发布前最小回归链路因此变为：`pnpm lint` + `pnpm typecheck` + `pnpm build` + `pnpm test`。
- 人工验证仍然是视觉层的兜底，但核心配置与 safelist 回归不再依赖肉眼检查。

## 现在最值得继续做的事

1. 进入 `P1-2 动效降级与可访问性`：
   - 路由切换时幕布动画仍会重播（目前已收敛到首页），需要接 `prefers-reduced-motion` 做降级
   - 月光 pulse、主题切换动画、click petals 等也需要在 reduced-motion 下关停或简化
   - 导航、按钮、印章链接补键盘焦点样式；检查暗色模式对比度
2. 后续如需扩展测试，可以考虑补：
   - `useThemeCssVars` 在不同 `ThemeConfig` 下生成的 CSS 变量映射
   - `useShuimoSeed` 的确定性行为
3. `ShuimoHeroLandscape.vue` 里的 SCSS 月亮样式存在先于本轮的 4 个 `format/prettier` 报错，适合在下一轮格式统一时顺手清理。

## 功能机会

- 主题预设系统
- 固定 seed 与可复现首页
- 阅读增强功能
- demo 实时配置面板
