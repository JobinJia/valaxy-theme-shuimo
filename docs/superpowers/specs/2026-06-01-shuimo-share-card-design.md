# 水墨分享卡片 / OG 图生成 — 设计文档

- 日期：2026-06-01
- 主题：`@jobinjia/valaxy-theme-shuimo`
- 状态：待 review（请在 zed 里过一遍，下面所有标 ⚠️ 的是我替你定的默认值/待确认项）

## 1. 背景与目标

主题已经成熟，老路线图（2026-04-18）基本清空。下一条最值得做的线是 **水墨分享卡片 / OG 图生成**：把每篇文章渲染成一张水墨风格的图片。

它的独占优势在于直接复用 `@jobinjia/shuimo-core` 的 canvas 绘制能力——这是别的 Valaxy 主题做不出来的东西，而搜索、RSS、文档站换个主题都能做。

### 已锁定的决策（来自前期澄清）

| 维度               | 决策                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 核心目标           | **两者都要**：① 作者主动分享（文章页按钮 → 客户端生成 → 下载/复制）② 链接预览美化（构建时预生成 PNG + 注入 `og:image`） |
| 卡片版式           | **两种都出**：竖版 3:4（主动分享用）+ 横版 1200×630（OG 链接预览用）                                                    |
| `shuimo-core` 缺席 | **优雅隐藏**：未安装这个 optional peer dep 时，分享卡入口不出现，不报错，与现有山水/宣纸的降级策略一致                  |

## 2. 关键架构洞察（决定整套设计可行性）

`shuimo-core` 已经把**场景生成**和**渲染**解耦：

```
InkMount.generateScene(options): InkMountScene   // 纯数据：山脊、皴法、雾、墨填，无 canvas
InkMount.renderScene(scene, backend: RenderBackend): void   // 渲染到任意后端
```

`RenderBackend` 是一个接口（`clear / drawMountainFill / drawCunFaStrokes / drawMist / drawRidgeLine / toOutput`），`Canvas2DBackend` 是其官方实现，构造时吃一个 `HTMLCanvasElement | OffscreenCanvas` 的 2D context。

**这带来的结论：构建时不需要 headless 浏览器。** 只要在 Node 里给 `Canvas2DBackend` 喂一个 Canvas2D 兼容的 context（`@napi-rs/canvas`），就能在构建期把同一份场景渲染成 PNG。

**佐证**：主题现有的 `@jobinjia/vite-plugin-shuimo-font-subset` 已经在构建期通过动态 import 跑 shuimo-core 的 Node 逻辑（fontkit + harfbuzz wasm 子集化字体）。"core 能在 Node 跑"已有先例。

由此得到核心设计原则：**合成逻辑（卡片排版）完全共享，只有最底层的「canvas 从哪来」在浏览器端和 Node 端不同。**

## 3. 架构总览

```
                ┌──────────────────────────────────────────────┐
                │  CardSpec（纯数据）                            │
                │  resolveCardSpec(post, themeConfig, variant)   │
                │  标题 / 副标题 / 作者 / 站名 / 日期 / 印章文案  │
                │  / seed / 版式(portrait|landscape) / 配色      │
                └───────────────────────┬──────────────────────┘
                                        │
                ┌───────────────────────▼──────────────────────┐
                │  composeShareCard(spec, ctx2d, deps)           │
                │  纯排版合成器（主题自有，不在 core 里）：       │
                │  宣纸底 → 山水 → 标题竖排/横排 → 印章 → 落款    │
                │  只依赖一个 Canvas2D context + core 的绘制函数  │
                └──────────┬───────────────────────┬────────────┘
                           │                       │
        ┌──────────────────▼─────┐      ┌──────────▼────────────────────┐
        │ 客户端后端              │      │ 构建时后端                      │
        │ OffscreenCanvas/Canvas │      │ @napi-rs/canvas → toBuffer PNG │
        │ → toBlob → 下载/复制   │      │ → 写 public → 注入 og:image    │
        └────────────────────────┘      └────────────────────────────────┘
```

## 4. 组件清单（每个单元：做什么 / 怎么用 / 依赖什么）

### 4.1 `theme/shareCard/types.ts` — 卡片规格类型

- **做什么**：定义 `CardSpec`、`CardVariant = 'portrait' | 'landscape'`、`ComposeDeps`（注入的 core 绘制函数集合）。
- **依赖**：仅类型，无运行时依赖。这是客户端与构建时之间的唯一契约。

### 4.2 `theme/shareCard/resolveCardSpec.ts` — 规格解析（纯函数）

- **做什么**：输入「一篇文章的 frontmatter + `themeConfig.shareCard` + variant」，输出确定性的 `CardSpec`。seed 由文章 slug 派生（复用 `useShuimoSeed` 的种子策略），保证同一篇文章卡面稳定。
- **怎么用**：客户端和构建时各调一次，传同样的入参得到同样的 spec。
- **依赖**：`useShuimoSeed` 的纯算法部分、`resolveStampSize` 同类的 resolver 风格（不在 `.vue` 里 inline）。
- **测试**：纯函数，快照测试不同 frontmatter/variant 组合。

### 4.3 `theme/shareCard/composeShareCard.ts` — 合成器（环境无关）

- **做什么**：拿 `CardSpec` + 一个 Canvas2D context，把卡片画出来。这是**主题的核心增值**，不属于 core：
  - 宣纸底（复用 core 的 `xuanPaper` / 现有纸色逻辑）
  - 山水（`InkMount.generateScene` + `renderScene`，离屏渲染后贴到卡片区域）
  - 标题：竖版走竖排、横版走横排；长标题截断策略 ⚠️
  - 印章（`generateStampPath` 矢量路径渲染，复用 stamp-v2 配置）
  - 落款行：作者 / 站名 / 日期
- **怎么用**：`await composeShareCard(spec, ctx, deps)`，`deps` 注入 core 的绘制函数（避免合成器直接 import core，便于降级时不触发加载）。
- **依赖**：通过 `deps` 间接依赖 shuimo-core；直接依赖仅 Canvas2D API。
- **不变量**：同一 `(spec, deps)` 在浏览器与 Node 下应产出视觉一致的结果（字体差异除外，见 §8）。

### 4.4 `theme/composables/useShareCard.ts` — 客户端生成

- **做什么**：在浏览器里 `resolveCardSpec` → 建 `OffscreenCanvas`（降级 `HTMLCanvasElement`）→ `composeShareCard` → `toBlob`。提供 `download()`、`copyToClipboard()`、`previewUrl`。
- **怎么用**：被 `ShuimoShareCard.vue` 调用。
- **依赖**：动态 `import('@jobinjia/shuimo-core')`——缺席时返回 `available: false`，UI 据此隐藏（§7）。
- **性能**：复用现有 `useShuimoScheduler` / worker 模式 ⚠️（是否上 worker 见 §11 待确认）。

### 4.5 `theme/components/ShuimoShareCard.vue` — 文章页入口 UI

- **做什么**：文章页一个水墨风「分享」按钮 → 点开预览弹层 → 显示生成的竖版卡 → 下载 / 复制 / 关闭。
- **怎么用**：在 `post.vue` 挂载；`themeConfig.shareCard.enable === false` 或 core 缺席时不渲染。
- **依赖**：`useShareCard`。a11y 按现有标准（`type` + `aria-label` + 弹层 focus 管理）。

### 4.6 `theme/node/buildShareCardPlugin.ts` — 构建时 PNG 生成（Vite 插件）

- **做什么**：构建期枚举所有文章 → 对每篇用 `resolveCardSpec('landscape')` + `composeShareCard` + `@napi-rs/canvas` → `toBuffer('image/png')` → 写到产物 `public/share-cards/<slug>.png`。
- **怎么用**：在 `node/index.ts` 的 `themePlugin` 旁注册；仿 `buildShuimoFontSubsetPlugin` 用动态 import 懒加载 core 与 `@napi-rs/canvas`，二者任一缺席则插件静默 no-op（§7）。
- **挂载钩子** ⚠️：倾向 Valaxy/vite-ssg 的构建后钩子或 Vite `closeBundle`，需在实现前做小验证（§11）。
- **依赖**：`@napi-rs/canvas`（新增，构建期可选）、shuimo-core、Node WASM 初始化（noise + 字体）。

### 4.7 OG meta 注入

- **做什么**：每篇文章页 `<head>` 注入 `og:image` / `twitter:card` 指向 `/share-cards/<slug>.png`。
- **怎么做** ⚠️：倾向在 `post.vue` 通过 Valaxy 的 head API（`useHead` / frontmatter head）按路由设置，URL = 站点 base + slug。比改 `transformIndexHtml` 更贴合 SSG 的按页注入。需确认 Valaxy 暴露的 head 接口。

## 5. 配置面（`ThemeConfig.shareCard`）

```ts
interface ShareCardConfig {
  enable?: boolean; // 默认 true；core 缺席时自动失效
  button?: boolean; // 文章页是否显示主动分享按钮，默认 true
  og?: boolean; // 是否构建时生成 + 注入 og:image，默认 true
  variants?: ("portrait" | "landscape")[]; // 默认 ['portrait','landscape']
  landscape?: { width?: number; height?: number }; // 默认 1200×630
  portrait?: { width?: number; height?: number }; // 默认 ⚠️ 1080×1440 (3:4)
  // 卡面文案默认取 footer/sidebar/stamp 现有配置，不新增重复字段
}
```

YAGNI：不做卡片模板系统、不做用户自定义布局槽位、不做二维码（除非你点名要）。

## 6. 数据流

**客户端（主动分享）**：点击按钮 → `useShareCard` → `resolveCardSpec(post, cfg, 'portrait')` → OffscreenCanvas → `composeShareCard` → toBlob → 预览/下载/复制。

**构建时（OG）**：`pnpm build` → `buildShareCardPlugin` 枚举文章 → 每篇 `resolveCardSpec(post, cfg, 'landscape')` → napi canvas → PNG 写盘；`post.vue` 注入 `og:image` 指向该 PNG。

两条流共用 §4.2 / §4.3，差异只在 canvas 来源与输出方式。

## 7. 优雅降级（无 shuimo-core）

- 客户端：`useShareCard` 动态 import 失败 → `available=false` → `ShuimoShareCard` 不渲染按钮。
- 构建时：`buildShareCardPlugin` 懒加载 core 或 `@napi-rs/canvas` 失败 → 插件 no-op，不写 PNG，不注入 og:image，构建照常成功（仅 `log` 一行说明被跳过——遵循"不静默吞掉降级"的约定）。
- 不引入纯 CSS 降级卡（你已选"优雅隐藏"）。

## 8. 字体处理

- **标题/落款文字**：客户端用页面已加载的衬线字体；Node 端需 `@napi-rs/canvas` 的 `GlobalFonts.registerFromPath` 注册同款字体，否则 fallback 字形不一致 ⚠️（构建产物字体路径待定）。
- **印章文字**：走 core 的矢量字形路径（`generateStampPath`），不依赖系统字体，两端天然一致。

## 9. 错误处理

- 客户端生成失败（canvas/core 异常）：弹层显示「生成失败」并保留关闭，不抛到控制台之外。
- 构建时单篇失败：捕获、`log` 该 slug、跳过该篇、继续其余，绝不让一篇文章炸掉整个 build。
- 不给 `toBlob` / 字体加载加 setTimeout 兜底（遵循项目"禁止 timeout 兜底"约定），有问题修根因。

## 10. 测试

- `resolveCardSpec.test.ts`：纯函数快照，覆盖 frontmatter 缺省、长标题、两种 variant。
- `composeShareCard`：在 Node 下用 `@napi-rs/canvas` 渲染一张，断言输出尺寸 + 非空像素（不做逐像素比对，避免脆弱）。
- 降级：mock core import 失败，断言客户端 `available=false`、构建插件 no-op。
- `pnpm lint` / `pnpm typecheck` / `pnpm test` 全绿。

## 11. 实现前需要先验证的小风险（feasibility spikes）

这些不影响设计成立，但应在写实现计划的第一步各花 ~15 分钟验证：

1. **`@napi-rs/canvas` 的 context 能否直接喂给 `Canvas2DBackend`**：core 是否对 canvas 做了 `instanceof HTMLCanvasElement` 之类的硬判断。若有，需通过 `/orchestrate` 派 sub-Claude 去 shuimo-core 仓库放宽（**不直接改 core** —— 遵守项目约定）。
2. **WASM noise 引擎在 Node 的初始化**：山水生成依赖 `initWasmNoiseEngine`，需用 dist/wasm 下的文件路径在 Node 端初始化。
3. **构建钩子时机**：确认 Valaxy/vite-ssg 在哪个阶段能拿到完整文章列表 + 写产物目录，以及 `og:image` 的按页 head 注入接口。
4. **是否需要 worker**：客户端山水渲染较重，先测主线程同步生成一张竖版卡的耗时，再决定要不要复用现有 worker 模式。

## 12. 新增依赖

- `@napi-rs/canvas`：构建期 Node 渲染。作为 `optionalDependencies` 或 `devDependencies` ⚠️——倾向 optional，缺席时 OG 路径降级，主动分享（纯浏览器）不受影响。

## 13. 明确不做（YAGNI）

- 卡片模板/主题市场化、二维码、用户自定义布局槽位
- 横版的主动下载入口（横版只服务 OG；如需再加）
- 把山水做成卡片专属新画风（复用现有山水即可）

## 14. 待你在 zed 确认的点（汇总所有 ⚠️）

1. 竖版默认尺寸 1080×1440 (3:4) 是否合适。
   合适
2. 长标题截断策略（截断 + 省略 vs 自动缩字号）。
   可以
3. `@napi-rs/canvas` 放 optionalDependencies 还是 devDependencies。
   你推荐
4. 是否接受"构建时单篇失败仅 log 跳过"的容错策略。
   不接受
5. 客户端是否一开始就上 worker，还是先同步、按 spike 结果再说。
   可以
