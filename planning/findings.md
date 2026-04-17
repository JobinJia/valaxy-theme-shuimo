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

### 2. 文章渲染链路重复

- `theme/layouts/post.vue` 与 `theme/components/ShuimoArticle.vue` 都承担文章展示职责。
- 后续维护容易出现样式和行为分叉。

### 3. 首页视觉生成有性能风险

- 山水生成逻辑较重，但当前挂载与调度策略还有优化空间。
- 已经存在 scheduler 方向的基础设施，说明这条路径可行。

### 4. 工程验证不足

- 仓库中已有 `vitest` 依赖，但没有最小测试闭环和统一 `test` 入口。
- 当前更偏人工验证。

## 功能机会

- 主题预设系统
- 固定 seed 与可复现首页
- 阅读增强功能
- demo 实时配置面板
