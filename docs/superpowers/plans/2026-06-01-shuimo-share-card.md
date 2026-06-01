# 水墨分享卡片 / OG 图生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把每篇文章渲染成水墨风卡片——客户端按钮主动分享（竖版 3:4），构建时预生成 PNG 并注入 `og:image`（横版 1200×630），两端共用一套排版合成器。

**Architecture:** `shuimo-core` 已把场景生成（纯数据 `InkMountScene`）与渲染（`RenderBackend` 接口）解耦，`Canvas2DBackend` 吃任意 Canvas2D context。因此排版逻辑（`resolveCardSpec` + `composeShareCard`）只写一份，浏览器端喂 `OffscreenCanvas`、Node 端喂 `@napi-rs/canvas`。`shuimo-core` 是 optional peer dep，缺席时客户端入口隐藏、构建插件 no-op。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript（无 `any`、无分号、单引号、2 空格）、Vite 插件、vitest、`@jobinjia/shuimo-core`（动态 import）、`@napi-rs/canvas`（构建期 optional）。

**Design spec:** `docs/superpowers/specs/2026-06-01-shuimo-share-card-design.md`

**Repo conventions（必须遵守）:**
- ESLint antfu：无分号、单引号、2 空格缩进。每个 Task 末尾 `pnpm lint` 必须绿。
- 提交信息：conventional commits（`feat(share-card): ...` / `test(share-card): ...` / `chore: ...`），英文，无尾句号。结尾加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。
- 测试框架：vitest（仓库现有 `*.test.ts` 风格，无 vue-test-utils → 纯逻辑抽到 composable/纯函数测）。
- 命令在 repo 根跑：`pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build`。
- 禁止 setTimeout 兜底；禁止规则几何形状；不加未要求的装饰。

---

## File Structure

| 文件 | 职责 |
| --- | --- |
| `theme/shareCard/types.ts` | `CardSpec` / `CardVariant` / `ComposeDeps` 类型契约（客户端与构建时唯一共享面） |
| `theme/shareCard/resolveCardSpec.ts` | 纯函数：frontmatter + themeConfig + variant → 确定性 `CardSpec`（seed 由 slug 派生） |
| `theme/shareCard/composeShareCard.ts` | 环境无关合成器：宣纸底→山水→标题→印章→落款，只依赖 Canvas2D ctx + 注入的 core 函数 |
| `theme/composables/useShareCard.ts` | 客户端：动态 import core → OffscreenCanvas → composeShareCard → toBlob/download/copy |
| `theme/components/ShuimoShareCard.vue` | 文章页分享按钮 + 预览弹层 |
| `theme/node/buildShareCardPlugin.ts` | 构建期 Vite 插件：枚举文章 → napi canvas → 写 `share-cards/<slug>.png` |
| `theme/types/index.ts`（改） | 新增 `ShareCardConfig` 到 `ThemeConfig` |
| `theme/node/index.ts`（改） | default config + 注册 `buildShareCardPlugin` |
| `theme/layouts/post.vue`（改） | 挂 `ShuimoShareCard` + 注入 `og:image` head |
| `theme/valaxy.config.ts`（改，按需） | 把 `buildShareCardPlugin` 接入 `defineTheme` plugins |

测试文件：`resolveCardSpec.test.ts`、`composeShareCard.test.ts`（均放 `theme/shareCard/`，与现有 `composables/*.test.ts` 同仓内风格）。

---

## Phase 0：可行性验证（先做，决定后续分叉）

> 这些是一次性验证脚本，**不进 git**（放 `/tmp/`），目的是把设计 §11 的 4 个风险变成确定结论。每个 ~15 分钟。任一失败会改变对应 Phase 的实现细节，故必须前置。

### Task 0.1: 验证 `@napi-rs/canvas` 能喂给 `Canvas2DBackend`

**Files:**
- Create: `/tmp/spike-napi-backend.mjs`（throwaway）

- [ ] **Step 1: 安装并写验证脚本**

```bash
pnpm -w add -D @napi-rs/canvas
```

```js
// /tmp/spike-napi-backend.mjs
import { createCanvas } from '@napi-rs/canvas'
import { InkMount } from '@jobinjia/shuimo-core/drawing'

const canvas = createCanvas(1200, 630)
// shuimo-core 的 Canvas2DBackend 由 InkMount.generate 内部 createBackend 选择。
// 先确认能否传入 napi canvas / ctx。两种探法：
try {
  const scene = InkMount.generateScene({ width: 1200, height: 630, seed: 42 })
  console.log('scene ok, layers:', scene.layers?.length)
  // 关键：renderScene 需要一个 RenderBackend。检查 Canvas2DBackend 构造签名。
  const mod = await import('@jobinjia/shuimo-core/drawing')
  console.log('exports:', Object.keys(mod).filter(k => /Backend|Canvas/.test(k)))
}
catch (e) {
  console.error('FAIL:', e)
}
```

- [ ] **Step 2: 运行**

Run: `node /tmp/spike-napi-backend.mjs`
Expected: 打印 scene 与 backend 导出；确认 `Canvas2DBackend` 构造接受的参数类型（canvas 还是 ctx）。

- [ ] **Step 3: 实测渲染一张 PNG**

把 napi canvas 喂给 `new Canvas2DBackend(...)` → `InkMount.renderScene(scene, backend)` → `canvas.toBuffer('image/png')` 写 `/tmp/spike.png`，肉眼看有没有山。

Run: `node /tmp/spike-napi-backend.mjs && open /tmp/spike.png`
Expected: PNG 里有水墨山。

- [ ] **Step 4: 记录结论**

在本 plan 末尾「Spike Results」追加一行：napi context 是否可直接喂 `Canvas2DBackend`。
**若 core 对 canvas 有 `instanceof HTMLCanvasElement` 硬判断导致失败** → 停下，通过 `/orchestrate`（带 `--dangerously-skip-permissions`）派 sub-Claude 去 shuimo-core 仓库放宽该判断后重发 beta，**不直接改 core**。

### Task 0.2: 验证 Node 端 WASM noise 初始化

**Files:** Create `/tmp/spike-wasm.mjs`

- [ ] **Step 1: 写脚本**

```js
// /tmp/spike-wasm.mjs
import { initWasmNoiseEngine } from '@jobinjia/shuimo-core'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const wasmPath = fileURLToPath(new URL(
  '../node_modules/@jobinjia/shuimo-core/dist/wasm/shuimo_noise_bg.wasm',
  import.meta.url,
))
console.log('wasm exists:', fs.existsSync(wasmPath))
// 探 initWasmNoiseEngine 接受 path / buffer / url 哪种
await initWasmNoiseEngine({ wasmBinary: fs.readFileSync(wasmPath) }).catch(e => console.error('FAIL', e))
console.log('wasm init ok')
```

- [ ] **Step 2: 运行并记录**

Run: `node /tmp/spike-wasm.mjs`
Expected: `wasm init ok`。记录正确的初始化入参形态到「Spike Results」。
**若山水生成不依赖 WASM noise（纯 JS fallback 已够）** → 记录可跳过 WASM，Phase 6 据此简化。

### Task 0.3: 验证 Valaxy 构建钩子 + 文章产物目录

- [ ] **Step 1: 查 Valaxy 文档/类型**

Run: `node -e "const o=require('valaxy/package.json'); console.log(o.version)"` 并查 `node_modules/valaxy` 暴露的 hook/userRoot。确认：构建期在哪个 Vite 阶段能枚举全部文章、产物 public 目录的绝对路径。
Expected: 记录「枚举文章用 walk `userRoot/pages/**/*.md`（与 `collectStampChars` 同法）」「PNG 写到 `userRoot/public/share-cards/` 或 vite outDir」。

- [ ] **Step 2: 查 head 注入接口**

Run: `grep -rn "useHead\|head:" node_modules/valaxy/dist 2>/dev/null | head` 确认 Valaxy 是否透出 `useHead`（@unhead/vue）供 `post.vue` 按路由设 `og:image`。
Expected: 记录注入方式（`useHead` vs frontmatter `head`）到「Spike Results」。

### Task 0.4: 测客户端同步生成耗时（决定是否上 worker）

- [ ] **Step 1: 在 Phase 3 完成 `composeShareCard` 后**，在浏览器 console 跑一次 `performance.now()` 包裹的竖版生成，记录耗时。
Expected: < 100ms 则主线程同步即可（设计 §11.4）；> 一帧明显则在「Spike Results」标记需复用现有 worker 模式，新增 Phase 后续任务。

> Task 0.4 依赖 Phase 3，实际执行顺序在 Phase 3 之后；列在此处仅为集中说明 spike。

---

## Phase 1：类型契约 + 配置面

### Task 1: 定义 `CardSpec` / `CardVariant` / `ComposeDeps`

**Files:**
- Create: `theme/shareCard/types.ts`

- [ ] **Step 1: 写类型**

```ts
// theme/shareCard/types.ts

/** 卡片版式：竖版用于主动分享，横版用于 OG 链接预览。 */
export type CardVariant = 'portrait' | 'landscape'

/** 一张卡片的确定性规格，由 resolveCardSpec 产出，客户端与构建时共用。 */
export interface CardSpec {
  variant: CardVariant
  width: number
  height: number
  /** 由文章 slug 派生，保证同篇卡面稳定（区别于 useShuimoSeed 的 per-load 随机）。 */
  seed: number
  title: string
  subtitle?: string
  author?: string
  siteName?: string
  /** 已本地化的日期串，避免在合成器里依赖运行时 locale。 */
  dateText?: string
  /** 印章文案 + 渲染参数，复用 stamp-v2 SealOptions 子集。 */
  stamp?: {
    text: string
    mode: 'yin' | 'yang'
    color?: string
  }
  /** 配色（纸色 / 主色），缺省取 themeConfig.colors。 */
  colors: {
    primary: string
    paper: string
  }
}

/**
 * 注入给合成器的 shuimo-core 绘制函数集合。
 * 合成器不直接 import core，便于「core 缺席时不触发加载」。
 */
export interface ComposeDeps {
  drawMountain: (ctx: CanvasRenderingContext2D, spec: CardSpec, box: Box) => void
  drawStampPath: (ctx: CanvasRenderingContext2D, spec: CardSpec, box: Box) => void
  drawXuanPaper: (ctx: CanvasRenderingContext2D, spec: CardSpec) => void
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}
```

- [ ] **Step 2: 校验类型可编译**

Run: `pnpm typecheck`
Expected: PASS（新文件不破坏现有）。

- [ ] **Step 3: Commit**

```bash
git add theme/shareCard/types.ts
git commit -m "feat(share-card): define CardSpec / ComposeDeps type contract

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 2: 把 `ShareCardConfig` 加进 `ThemeConfig`

**Files:**
- Modify: `theme/types/index.ts`（在 `ThemeConfig` interface 内新增 `shareCard?`）

- [ ] **Step 1: 先看现有 ThemeConfig 形状**

Run: `grep -n "interface ThemeConfig\|stamp?\|imageCaption?" theme/types/index.ts`
Expected: 找到 `ThemeConfig` 定义位置与同级可选字段写法。

- [ ] **Step 2: 新增 ShareCardConfig 并挂到 ThemeConfig**

在 `theme/types/index.ts` 合适位置加：

```ts
export interface ShareCardConfig {
  /** 总开关。默认 true；shuimo-core 缺席时自动失效。 */
  enable?: boolean
  /** 文章页是否显示主动分享按钮。默认 true。 */
  button?: boolean
  /** 是否构建时生成 PNG 并注入 og:image。默认 true。 */
  og?: boolean
  /** 出哪些版式。默认 ['portrait', 'landscape']。 */
  variants?: CardVariant[]
  /** 横版尺寸，默认 1200×630（OG 标准）。 */
  landscape?: { width?: number, height?: number }
  /** 竖版尺寸，默认 1080×1440（3:4）。 */
  portrait?: { width?: number, height?: number }
}
```

并在 `ThemeConfig` 内加 `shareCard?: ShareCardConfig`，文件顶部 `import type { CardVariant } from '../shareCard/types'`。

- [ ] **Step 3: typecheck**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add theme/types/index.ts
git commit -m "feat(share-card): add ShareCardConfig to ThemeConfig

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 3: default config

**Files:**
- Modify: `theme/node/index.ts`（`defaultThemeConfig` 内新增 `shareCard`）

- [ ] **Step 1: 加默认值**

在 `defaultThemeConfig` 对象内（`stamp` 之后）加：

```ts
  shareCard: {
    enable: true,
    button: true,
    og: true,
    variants: ['portrait', 'landscape'],
    landscape: { width: 1200, height: 630 },
    portrait: { width: 1080, height: 1440 },
  },
```

- [ ] **Step 2: 现有 default config 测试同步**

Run: `pnpm test theme/node/index.test.ts`
Expected: 若 `index.test.ts` 对 `defaultThemeConfig` 做了快照/字段断言会 FAIL → 按现有断言风格补 `shareCard` 期望值，再跑通。

- [ ] **Step 3: Commit**

```bash
git add theme/node/index.ts theme/node/index.test.ts
git commit -m "feat(share-card): default shareCard config + test assertions

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2：`resolveCardSpec`（纯函数，完整 TDD）

### Task 4: resolveCardSpec — 基本字段映射

**Files:**
- Create: `theme/shareCard/resolveCardSpec.ts`
- Test: `theme/shareCard/resolveCardSpec.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// theme/shareCard/resolveCardSpec.test.ts
import { describe, expect, it } from 'vitest'
import { resolveCardSpec } from './resolveCardSpec'

const baseInput = {
  slug: '/posts/hello',
  frontmatter: { title: '寒山行', date: '2026-01-02', dateText: '2026年1月2日' },
  themeConfig: {
    colors: { primary: '#8B4513' },
    sidebar: { author: { name: '墨客' } },
    header: { title: '墨韵书斋' },
    shareCard: { portrait: { width: 1080, height: 1440 }, landscape: { width: 1200, height: 630 } },
  },
}

describe('resolveCardSpec', () => {
  it('maps title / author / siteName / dateText from inputs', () => {
    const spec = resolveCardSpec({ ...baseInput, variant: 'portrait' })
    expect(spec.title).toBe('寒山行')
    expect(spec.author).toBe('墨客')
    expect(spec.siteName).toBe('墨韵书斋')
    expect(spec.dateText).toBe('2026年1月2日')
    expect(spec.variant).toBe('portrait')
    expect(spec.width).toBe(1080)
    expect(spec.height).toBe(1440)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test theme/shareCard/resolveCardSpec.test.ts`
Expected: FAIL（`resolveCardSpec` 未定义）。

- [ ] **Step 3: 最小实现**

```ts
// theme/shareCard/resolveCardSpec.ts
import type { CardSpec, CardVariant } from './types'
import { hashString } from '../composables/useShuimoSeed'

export interface ResolveCardSpecInput {
  slug: string
  variant: CardVariant
  frontmatter: {
    title?: string
    subtitle?: string
    dateText?: string
    stamp?: { text?: string, author?: string, mode?: 'yin' | 'yang', color?: string }
  }
  themeConfig: {
    colors?: { primary?: string }
    sidebar?: { author?: { name?: string } }
    header?: { title?: string }
    stamp?: { author?: string, mode?: 'yin' | 'yang', color?: string }
    shareCard?: {
      portrait?: { width?: number, height?: number }
      landscape?: { width?: number, height?: number }
    }
  }
}

const DIM = {
  portrait: { width: 1080, height: 1440 },
  landscape: { width: 1200, height: 630 },
} as const

const DEFAULT_PAPER = '#f5efe1'

export function resolveCardSpec(input: ResolveCardSpecInput): CardSpec {
  const { slug, variant, frontmatter: fm, themeConfig: tc } = input
  const dimCfg = tc.shareCard?.[variant]
  const width = dimCfg?.width ?? DIM[variant].width
  const height = dimCfg?.height ?? DIM[variant].height

  return {
    variant,
    width,
    height,
    seed: hashString(slug),
    title: fm.title ?? '',
    subtitle: fm.subtitle,
    author: tc.sidebar?.author?.name,
    siteName: tc.header?.title,
    dateText: fm.dateText,
    stamp: {
      text: fm.stamp?.text ?? fm.stamp?.author ?? tc.stamp?.author ?? '',
      mode: fm.stamp?.mode ?? tc.stamp?.mode ?? 'yang',
      color: fm.stamp?.color ?? tc.stamp?.color,
    },
    colors: {
      primary: tc.colors?.primary ?? '#8B4513',
      paper: DEFAULT_PAPER,
    },
  }
}
```

- [ ] **Step 4: 运行通过**

Run: `pnpm test theme/shareCard/resolveCardSpec.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add theme/shareCard/resolveCardSpec.ts theme/shareCard/resolveCardSpec.test.ts
git commit -m "feat(share-card): resolveCardSpec maps frontmatter + config to spec

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 5: resolveCardSpec — seed 由 slug 派生且稳定

**Files:** Modify `theme/shareCard/resolveCardSpec.test.ts`

- [ ] **Step 1: 写测试**

```ts
it('derives a stable seed from slug, independent of variant', () => {
  const a = resolveCardSpec({ ...baseInput, variant: 'portrait' })
  const b = resolveCardSpec({ ...baseInput, variant: 'landscape' })
  const c = resolveCardSpec({ ...baseInput, slug: '/posts/other', variant: 'portrait' })
  expect(a.seed).toBe(b.seed) // 同篇文章两版式同 seed
  expect(a.seed).not.toBe(c.seed) // 不同文章不同 seed
  expect(a.seed).toBeGreaterThan(0)
})
```

- [ ] **Step 2: 运行**

Run: `pnpm test theme/shareCard/resolveCardSpec.test.ts`
Expected: PASS（Task 4 已用 `hashString(slug)`，本测试验证该决策）。

- [ ] **Step 3: Commit**

```bash
git add theme/shareCard/resolveCardSpec.test.ts
git commit -m "test(share-card): assert slug-derived stable seed

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 6: resolveCardSpec — 缺省与长标题边界

**Files:** Modify `theme/shareCard/resolveCardSpec.test.ts`

- [ ] **Step 1: 写测试**

```ts
it('falls back gracefully when optional fields are missing', () => {
  const spec = resolveCardSpec({
    slug: '/posts/x',
    variant: 'landscape',
    frontmatter: {},
    themeConfig: {},
  })
  expect(spec.title).toBe('')
  expect(spec.author).toBeUndefined()
  expect(spec.colors.primary).toBe('#8B4513') // 内置兜底主色
  expect(spec.width).toBe(1200) // variant 默认尺寸
})
```

- [ ] **Step 2: 运行**

Run: `pnpm test theme/shareCard/resolveCardSpec.test.ts`
Expected: PASS。

> **⚠️ 长标题截断策略（设计 §14.2）**：截断发生在 `composeShareCard` 绘制阶段（按可用宽度量字），**不在 spec 里截**，因为截断长度依赖字号/版式/canvas 度量。默认策略：竖排逐字排到列满后省略（末字加「…」），横排单行量宽超出则缩字号一档、再超则截断加「…」。该逻辑在 Task 9 实现并测试。

- [ ] **Step 3: Commit**

```bash
git add theme/shareCard/resolveCardSpec.test.ts
git commit -m "test(share-card): assert graceful fallback for missing fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3：`composeShareCard`（共享合成器，用 napi canvas 在 Node 测）

> 前置：Task 0.1 已确认 napi context 可喂 core backend。本 Phase 测试在 Node 用 `@napi-rs/canvas` 提供真实 Canvas2D context。

### Task 7: composeShareCard — 骨架 + 尺寸/纸底

**Files:**
- Create: `theme/shareCard/composeShareCard.ts`
- Test: `theme/shareCard/composeShareCard.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// theme/shareCard/composeShareCard.test.ts
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { composeShareCard } from './composeShareCard'
import { resolveCardSpec } from './resolveCardSpec'

function fakeDeps() {
  // 合成器骨架阶段只验证纸底/文字，mock core 绘制为可观测的 no-op 记录。
  const calls: string[] = []
  return {
    calls,
    deps: {
      drawXuanPaper: () => calls.push('paper'),
      drawMountain: () => calls.push('mountain'),
      drawStampPath: () => calls.push('stamp'),
    },
  }
}

describe('composeShareCard', () => {
  it('fills the full canvas with paper base and returns nothing (draws in place)', async () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'landscape',
      frontmatter: { title: '寒山' },
      themeConfig: {},
    })
    const canvas = createCanvas(spec.width, spec.height)
    const ctx = canvas.getContext('2d')
    const { deps, calls } = fakeDeps()
    await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
    expect(calls[0]).toBe('paper') // 纸底先画
    // 非空像素：取中心点 alpha > 0
    const px = ctx.getImageData(spec.width / 2, spec.height / 2, 1, 1).data
    expect(px[3]).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test theme/shareCard/composeShareCard.test.ts`
Expected: FAIL（`composeShareCard` 未定义）。

- [ ] **Step 3: 最小实现（纸底 + 调 deps 顺序）**

```ts
// theme/shareCard/composeShareCard.ts
import type { Box, CardSpec, ComposeDeps } from './types'

export async function composeShareCard(
  spec: CardSpec,
  ctx: CanvasRenderingContext2D,
  deps: ComposeDeps,
): Promise<void> {
  // 1. 纸底铺满
  deps.drawXuanPaper(ctx, spec)
  ctx.fillStyle = spec.colors.paper
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillRect(0, 0, spec.width, spec.height)
  ctx.globalCompositeOperation = 'source-over'

  // 2. 山水区域（版式相关 box，在后续 Task 细化）
  const mountainBox = mountainBoxFor(spec)
  deps.drawMountain(ctx, spec, mountainBox)

  // 3. 标题 / 落款 / 印章在后续 Task 加
}

function mountainBoxFor(spec: CardSpec): Box {
  // 竖版：山水占上 55%；横版：占右 50%。后续 Task 可调。
  if (spec.variant === 'portrait')
    return { x: 0, y: 0, w: spec.width, h: Math.round(spec.height * 0.55) }
  return { x: Math.round(spec.width * 0.5), y: 0, w: Math.round(spec.width * 0.5), h: spec.height }
}
```

- [ ] **Step 4: 运行通过**

Run: `pnpm test theme/shareCard/composeShareCard.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add theme/shareCard/composeShareCard.ts theme/shareCard/composeShareCard.test.ts
git commit -m "feat(share-card): composeShareCard skeleton with paper base

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 8: composeShareCard — 标题排版（竖排/横排 + 长标题处理）

**Files:**
- Modify: `theme/shareCard/composeShareCard.ts`
- Test: `theme/shareCard/composeShareCard.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('draws title text and truncates over-long titles with ellipsis', async () => {
  const longTitle = '寒'.repeat(60)
  const spec = resolveCardSpec({
    slug: '/posts/long',
    variant: 'landscape',
    frontmatter: { title: longTitle },
    themeConfig: {},
  })
  const canvas = createCanvas(spec.width, spec.height)
  const ctx = canvas.getContext('2d')
  const { deps } = fakeDeps()
  // drawTitle 内部应调用 ctx.fillText；spy fillText 收集绘制的字符串
  const drawn: string[] = []
  const orig = ctx.fillText.bind(ctx)
  ctx.fillText = (text: string, x: number, y: number) => { drawn.push(text); return orig(text, x, y) }
  await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
  const joined = drawn.join('')
  expect(joined.length).toBeLessThan(longTitle.length) // 截断了
  expect(joined).toContain('…')
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test theme/shareCard/composeShareCard.test.ts`
Expected: FAIL（标题未绘制 / 无截断）。

- [ ] **Step 3: 实现 drawTitle**

在 `composeShareCard.ts` 加（并在主流程「3.」处调用 `drawTitle(ctx, spec)`）：

```ts
function drawTitle(ctx: CanvasRenderingContext2D, spec: CardSpec): void {
  const fontPx = spec.variant === 'portrait' ? Math.round(spec.width * 0.075) : Math.round(spec.height * 0.11)
  ctx.fillStyle = '#1a1a1a'
  ctx.font = `${fontPx}px serif`
  ctx.textBaseline = 'top'

  if (spec.variant === 'portrait')
    drawVerticalTitle(ctx, spec, fontPx)
  else
    drawHorizontalTitle(ctx, spec, fontPx)
}

function drawVerticalTitle(ctx: CanvasRenderingContext2D, spec: CardSpec, fontPx: number): void {
  // 竖排：从右上往下排，列满换列，整体最多 2 列，超出末字加「…」
  const top = Math.round(spec.height * 0.6)
  const maxPerCol = Math.floor((spec.height - top - fontPx) / (fontPx * 1.1))
  const maxChars = maxPerCol * 2
  const chars = [...spec.title]
  const shown = chars.length > maxChars ? [...chars.slice(0, maxChars - 1), '…'] : chars
  let col = 0
  let row = 0
  const colX = spec.width - fontPx * 1.5
  for (const ch of shown) {
    if (row >= maxPerCol) { row = 0; col++ }
    ctx.fillText(ch, colX - col * fontPx * 1.3, top + row * fontPx * 1.1)
    row++
  }
}

function drawHorizontalTitle(ctx: CanvasRenderingContext2D, spec: CardSpec, fontPx: number): void {
  // 横排：左半区单行，量宽超出可用宽则截断加「…」
  const maxW = spec.width * 0.5 - fontPx
  const x = Math.round(spec.width * 0.06)
  const y = Math.round(spec.height * 0.4)
  let text = spec.title
  if (ctx.measureText(text).width > maxW) {
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxW)
      text = text.slice(0, -1)
    text = `${text}…`
  }
  ctx.fillText(text, x, y)
}
```

- [ ] **Step 4: 运行通过**

Run: `pnpm test theme/shareCard/composeShareCard.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add theme/shareCard/composeShareCard.ts theme/shareCard/composeShareCard.test.ts
git commit -m "feat(share-card): vertical/horizontal title layout with ellipsis truncation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 9: composeShareCard — 落款行 + 印章 + 山水调用

**Files:**
- Modify: `theme/shareCard/composeShareCard.ts`
- Test: `theme/shareCard/composeShareCard.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('invokes mountain + stamp deps and draws the colophon line', async () => {
  const spec = resolveCardSpec({
    slug: '/posts/x',
    variant: 'portrait',
    frontmatter: { title: '寒山', dateText: '2026年1月2日' },
    themeConfig: { sidebar: { author: { name: '墨客' } }, stamp: { author: '受命' } },
  })
  const canvas = createCanvas(spec.width, spec.height)
  const ctx = canvas.getContext('2d')
  const calls: string[] = []
  const drawn: string[] = []
  const orig = ctx.fillText.bind(ctx)
  ctx.fillText = (t: string, x: number, y: number) => { drawn.push(t); return orig(t, x, y) }
  const deps = {
    drawXuanPaper: () => calls.push('paper'),
    drawMountain: () => calls.push('mountain'),
    drawStampPath: () => calls.push('stamp'),
  }
  await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
  expect(calls).toContain('mountain')
  expect(calls).toContain('stamp') // 有 stamp.text 时才调
  expect(drawn.join('')).toContain('墨客') // 落款含作者
  expect(drawn.join('')).toContain('2026年1月2日')
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test theme/shareCard/composeShareCard.test.ts`
Expected: FAIL（落款/印章未画）。

- [ ] **Step 3: 实现落款 + 印章调用**

在 `composeShareCard` 主流程末尾加 `drawColophon(ctx, spec)` 与印章调用：

```ts
// 主流程「3.」之后：
  drawTitle(ctx, spec)
  drawColophon(ctx, spec)
  if (spec.stamp?.text) {
    const stampBox = stampBoxFor(spec)
    deps.drawStampPath(ctx, spec, stampBox)
  }
```

```ts
function drawColophon(ctx: CanvasRenderingContext2D, spec: CardSpec): void {
  const fontPx = Math.round((spec.variant === 'portrait' ? spec.width : spec.height) * 0.03)
  ctx.font = `${fontPx}px serif`
  ctx.fillStyle = '#4a4a4a'
  ctx.textBaseline = 'alphabetic'
  const parts = [spec.author, spec.siteName, spec.dateText].filter(Boolean) as string[]
  const line = parts.join('  ·  ')
  const x = Math.round(spec.width * 0.06)
  const y = Math.round(spec.height * 0.93)
  ctx.fillText(line, x, y)
}

function stampBoxFor(spec: CardSpec): Box {
  const size = Math.round((spec.variant === 'portrait' ? spec.width : spec.height) * 0.14)
  return {
    x: spec.width - size - Math.round(spec.width * 0.06),
    y: spec.height - size - Math.round(spec.height * 0.06),
    w: size,
    h: size,
  }
}
```

- [ ] **Step 4: 运行通过**

Run: `pnpm test theme/shareCard/composeShareCard.test.ts`
Expected: PASS。

- [ ] **Step 5: lint + 全测**

Run: `pnpm lint && pnpm test theme/shareCard/`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add theme/shareCard/composeShareCard.ts theme/shareCard/composeShareCard.test.ts
git commit -m "feat(share-card): colophon line + stamp + mountain composition

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4：客户端生成（`useShareCard`）

### Task 10: useShareCard — 动态加载 core + 可用性探测

**Files:**
- Create: `theme/composables/useShareCard.ts`

> 注：无 vue-test-utils + 依赖浏览器 OffscreenCanvas/import，本 composable 不做单测，靠 Task 0.4 浏览器实测 + Phase 8 `pnpm build`/demo 跑通验证。纯逻辑（spec 解析）已在 Phase 2 覆盖。

- [ ] **Step 1: 实现 buildCoreDeps（把 core 函数适配成 ComposeDeps）**

```ts
// theme/composables/useShareCard.ts
import type { ComposeDeps } from '../shareCard/types'
import { ref } from 'vue'
import { composeShareCard } from '../shareCard/composeShareCard'
import { resolveCardSpec } from '../shareCard/resolveCardSpec'

let depsPromise: Promise<ComposeDeps | null> | null = null

async function loadComposeDeps(): Promise<ComposeDeps | null> {
  if (depsPromise)
    return depsPromise
  depsPromise = (async () => {
    try {
      const core = await import('@jobinjia/shuimo-core')
      const drawing = await import('@jobinjia/shuimo-core/drawing')
      return adaptCoreToDeps(core, drawing)
    }
    catch {
      return null // optional peer dep 缺席
    }
  })()
  return depsPromise
}
```

> `adaptCoreToDeps(core, drawing)` 的精确实现依赖 **Task 0.1 spike 结论**（`InkMount.generate` / `renderScene` 的确切签名、`generateStampPath` 入参、`xuanPaper` 调用方式）。在写本步时填入 spike 验证过的真实调用。骨架：

```ts
function adaptCoreToDeps(
  core: typeof import('@jobinjia/shuimo-core'),
  drawing: typeof import('@jobinjia/shuimo-core/drawing'),
): ComposeDeps {
  return {
    drawXuanPaper: (ctx, spec) => {
      // 用 core.xuanPaper 把宣纸纹理画到 ctx 全幅（按 spike 验证的签名）
      core.xuanPaper(ctx, { width: spec.width, height: spec.height, seed: spec.seed })
    },
    drawMountain: (ctx, spec, box) => {
      const out = drawing.InkMount.generate({ width: box.w, height: box.h, seed: spec.seed })
      if (out.type === 'canvas')
        ctx.drawImage(out.canvas as unknown as CanvasImageSource, box.x, box.y)
    },
    drawStampPath: (ctx, spec, box) => {
      if (!spec.stamp?.text)
        return
      drawing.generateStampPath(/* 按 spike 的 StampOptions */)
      // 用 spec.stamp.color / mode 渲染到 box
    },
  }
}
```

- [ ] **Step 2: typecheck**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 3: Commit**

```bash
git add theme/composables/useShareCard.ts
git commit -m "feat(share-card): client core loader + ComposeDeps adapter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 11: useShareCard — 生成 / 下载 / 复制 API

**Files:**
- Modify: `theme/composables/useShareCard.ts`

- [ ] **Step 1: 实现公开 API**

```ts
export interface UseShareCardOptions {
  slug: string
  frontmatter: Record<string, unknown>
  themeConfig: Record<string, unknown>
}

export function useShareCard(opts: UseShareCardOptions) {
  const available = ref<boolean | null>(null) // null=未探测
  const generating = ref(false)
  const previewUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function render(variant: 'portrait' | 'landscape' = 'portrait'): Promise<Blob | null> {
    generating.value = true
    error.value = null
    try {
      const deps = await loadComposeDeps()
      available.value = deps != null
      if (!deps)
        return null
      const spec = resolveCardSpec({ slug: opts.slug, variant, frontmatter: opts.frontmatter as never, themeConfig: opts.themeConfig as never })
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(spec.width, spec.height)
        : Object.assign(document.createElement('canvas'), { width: spec.width, height: spec.height })
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      await composeShareCard(spec, ctx, deps)
      const blob = canvas instanceof OffscreenCanvas
        ? await canvas.convertToBlob({ type: 'image/png' })
        : await new Promise<Blob>((res, rej) => (canvas as HTMLCanvasElement).toBlob(b => b ? res(b) : rej(new Error('toBlob null')), 'image/png'))
      if (previewUrl.value)
        URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(blob)
      return blob
    }
    catch (e) {
      error.value = (e as Error).message
      return null
    }
    finally {
      generating.value = false
    }
  }

  async function download(variant?: 'portrait' | 'landscape') {
    const blob = await render(variant)
    if (!blob)
      return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${opts.slug.replace(/\W+/g, '-').replace(/^-|-$/g, '')}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function copyToClipboard(variant?: 'portrait' | 'landscape') {
    const blob = await render(variant)
    if (!blob || !navigator.clipboard?.write)
      return false
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  }

  return { available, generating, previewUrl, error, render, download, copyToClipboard }
}
```

> 注意（遵守 memory「带 revoke 生命周期的资源禁入共享 cache」）：`previewUrl` 是 blob URL，组件卸载时须 revoke（在 Task 12 的 `onScopeDispose`/`onUnmounted` 处理）。`depsPromise` 缓存的是「下层不可变的 core 函数」，不含 blob，符合约定。

- [ ] **Step 2: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。

- [ ] **Step 3: Commit**

```bash
git add theme/composables/useShareCard.ts
git commit -m "feat(share-card): useShareCard render/download/copy API

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5：文章页 UI

### Task 12: ShuimoShareCard.vue — 按钮 + 预览弹层

**Files:**
- Create: `theme/components/ShuimoShareCard.vue`

- [ ] **Step 1: 实现组件**

```vue
<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useShareCard } from '../composables/useShareCard'

const props = defineProps<{
  slug: string
  frontmatter: Record<string, unknown>
  themeConfig: Record<string, unknown>
}>()

const open = ref(false)
const { available, generating, previewUrl, error, render, download, copyToClipboard } = useShareCard({
  slug: props.slug,
  frontmatter: props.frontmatter,
  themeConfig: props.themeConfig,
})

async function onOpen() {
  open.value = true
  await render('portrait')
}

onUnmounted(() => {
  if (previewUrl.value)
    URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <!-- available === false（探测后确认无 core）时不渲染入口 -->
  <button
    v-if="available !== false"
    type="button"
    class="shuimo-share-card__trigger"
    :aria-label="'生成分享卡片'"
    @click="onOpen"
  >
    分享
  </button>

  <div v-if="open" class="shuimo-share-card__overlay" role="dialog" aria-modal="true" aria-label="分享卡片预览">
    <div class="shuimo-share-card__panel">
      <p v-if="generating">生成中…</p>
      <p v-else-if="error">生成失败</p>
      <img v-else-if="previewUrl" :src="previewUrl" alt="分享卡片预览" class="shuimo-share-card__preview">
      <div class="shuimo-share-card__actions">
        <button type="button" @click="download('portrait')">下载</button>
        <button type="button" @click="copyToClipboard('portrait')">复制</button>
        <button type="button" @click="open = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shuimo-share-card__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 50;
}
.shuimo-share-card__panel {
  background: var(--shuimo-paper, #f5efe1);
  padding: 1.5rem;
  max-width: min(92vw, 420px);
  border-radius: 4px;
}
.shuimo-share-card__preview {
  display: block;
  width: 100%;
  height: auto;
}
.shuimo-share-card__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: center;
}
</style>
```

> a11y：弹层加 `role="dialog"` `aria-modal`；焦点管理（打开时 focus 关闭按钮、Esc 关闭）按仓库现有 `ShuimoToc` 的 disclosure 模式补——见 Task 13。样式风格须对齐现有组件（毛笔/宣纸变量），不要规则几何（边框用现有 brush-line 风格而非纯直角，若加边框）。

- [ ] **Step 2: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoShareCard.vue
git commit -m "feat(share-card): ShuimoShareCard button + preview dialog

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 13: 挂载到 post.vue + Esc/焦点 a11y

**Files:**
- Modify: `theme/layouts/post.vue`

- [ ] **Step 1: 在 post.vue 引入并挂载**

在 `post.vue` `<script setup>` 已有 `frontmatter` / `themeConfig` / `route`。在模板里印章区域附近加：

```vue
<ShuimoShareCard
  v-if="themeConfig?.shareCard?.enable !== false && themeConfig?.shareCard?.button !== false"
  :slug="route?.path || '/'"
  :frontmatter="frontmatter"
  :theme-config="themeConfig || {}"
/>
```

（`ShuimoShareCard` 是全局注册的主题组件，无需显式 import — 与现有 `ShuimoReadingInfo` 等一致；若本仓用显式 import 则照搬该模式。）

- [ ] **Step 2: 给弹层加 Esc 关闭 + 打开聚焦**

在 `ShuimoShareCard.vue` 补：打开时 `nextTick` 后 focus 关闭按钮；`@keydown.esc` 关闭。参照 `theme/components/ShuimoToc.vue` 的移动端 disclosure 实现，保持一致。

- [ ] **Step 3: 跑 demo 手动验证（按 memory：demo 只读，不改 demo 源）**

Run: `pnpm dev`，打开任意文章页 → 点「分享」→ 看到竖版水墨卡 → 下载/复制/Esc 关闭。
Expected: 卡片正常生成；无 core 时按钮不出现（可临时在 demo 卸载 core 验证，验证后还原，**不提交 demo 改动**）。

- [ ] **Step 4: Commit（仅 theme）**

```bash
git add theme/layouts/post.vue theme/components/ShuimoShareCard.vue
git commit -m "feat(share-card): mount share card in post layout with esc/focus a11y

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 6：构建时 PNG 生成

### Task 14: buildShareCardPlugin — 枚举文章 + 生成 PNG

**Files:**
- Create: `theme/node/buildShareCardPlugin.ts`
- Modify: `theme/node/index.ts`（export + 接入）

> 前置：Task 0.1（napi backend）、0.2（wasm）、0.3（钩子+产物目录）的 spike 结论已知。

- [ ] **Step 1: 写插件（仿 buildShuimoFontSubsetPlugin 的 optional 懒加载）**

```ts
// theme/node/buildShareCardPlugin.ts
import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ThemeConfig } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import { resolveCardSpec } from '../shareCard/resolveCardSpec'
import { composeShareCard } from '../shareCard/composeShareCard'

// optional：@napi-rs/canvas + shuimo-core 任一缺席 → 插件 no-op
async function loadCanvas(): Promise<typeof import('@napi-rs/canvas') | null> {
  try {
    return await import('@napi-rs/canvas')
  }
  catch {
    return null
  }
}

interface PostMeta { slug: string, frontmatter: Record<string, unknown> }

// 复用 collectStampChars 同款 walk：读 pages/**/*.md 的 frontmatter title/date
function enumeratePosts(userRoot: string): PostMeta[] {
  const posts: PostMeta[] = []
  const walk = (dir: string): void => {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) }
    catch { return }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { walk(p); continue }
      if (!e.name.endsWith('.md'))
        continue
      const content = fs.readFileSync(p, 'utf8')
      const fm = content.match(/^---\n([\s\S]*?)\n---/)
      if (!fm)
        continue
      const frontmatter: Record<string, unknown> = {}
      for (const line of fm[1].split('\n')) {
        const m = line.match(/^([a-z]+):\s*(.+)$/i)
        if (m)
          frontmatter[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
      }
      const rel = path.relative(path.join(userRoot, 'pages'), p).replace(/\.md$/, '')
      posts.push({ slug: `/${rel}`, frontmatter })
    }
  }
  walk(path.join(userRoot, 'pages'))
  return posts
}

export function buildShareCardPlugin(
  options: ResolvedValaxyOptions<ThemeConfig>,
): Plugin {
  const themeConfig = options.config.themeConfig as ThemeConfig
  return {
    name: 'valaxy-theme-shuimo:share-card',
    apply: 'build',
    async closeBundle() {
      if (themeConfig.shareCard?.enable === false || themeConfig.shareCard?.og === false)
        return
      const napi = await loadCanvas()
      if (!napi) {
        console.warn('[shuimo:share-card] @napi-rs/canvas absent — skip OG image generation')
        return
      }
      // 按 Task 0.3 结论确定 outDir；默认写 public/share-cards
      const outDir = path.join(options.userRoot, 'public', 'share-cards')
      fs.mkdirSync(outDir, { recursive: true })

      // 按 Task 0.1/0.2 结论构建 Node 版 ComposeDeps（napi canvas + wasm init）
      const deps = await buildNodeDeps(napi)
      if (!deps) {
        console.warn('[shuimo:share-card] shuimo-core absent — skip OG image generation')
        return
      }

      const posts = enumeratePosts(options.userRoot)
      let ok = 0
      for (const post of posts) {
        try {
          const spec = resolveCardSpec({ slug: post.slug, variant: 'landscape', frontmatter: post.frontmatter as never, themeConfig: themeConfig as never })
          const canvas = napi.createCanvas(spec.width, spec.height)
          const ctx = canvas.getContext('2d')
          await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
          const file = path.join(outDir, `${post.slug.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index'}.png`)
          fs.writeFileSync(file, canvas.toBuffer('image/png'))
          ok++
        }
        catch (e) {
          console.warn(`[shuimo:share-card] skip ${post.slug}: ${(e as Error).message}`)
        }
      }
      console.log(`[shuimo:share-card] generated ${ok}/${posts.length} OG cards`)
    },
  }
}
```

> `buildNodeDeps(napi)`：动态 import shuimo-core，初始化 WASM noise（Task 0.2 结论），注册标题字体到 `napi.GlobalFonts.registerFromPath`（设计 §8，字体路径用 theme 自带 woff2 或 demo 字体），返回与客户端 `adaptCoreToDeps` 同构的 `ComposeDeps`。把 `adaptCoreToDeps` 的核心绘制逻辑抽成共享纯函数避免两端重复（DRY）。

- [ ] **Step 2: 在 node/index.ts export**

```ts
export { buildShareCardPlugin } from './buildShareCardPlugin'
```

- [ ] **Step 3: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add theme/node/buildShareCardPlugin.ts theme/node/index.ts
git commit -m "feat(share-card): build-time OG png generation plugin

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 15: 接入 defineTheme + 构建跑通

**Files:**
- Modify: `theme/valaxy.config.ts`

- [ ] **Step 1: 注册插件**

在 `theme/valaxy.config.ts` 的 `defineTheme` plugins 处加入 `buildShareCardPlugin(options)`（与现有 `buildShuimoFontSubsetPlugin` / `themePlugin` 注册方式一致；先 `grep -n "Plugin\|plugins" theme/valaxy.config.ts` 确认现有写法）。

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 构建成功；`demo` 产物里出现 `share-cards/*.png`；终端打印 `generated N/N OG cards`。肉眼开几张 PNG 确认是水墨卡。

- [ ] **Step 3: 验证无 napi 时降级**

临时 `pnpm -w remove @napi-rs/canvas` → `pnpm build`
Expected: 构建仍成功，打印 `@napi-rs/canvas absent — skip`，无 PNG。验证后 `pnpm -w add -D @napi-rs/canvas` 还原。

- [ ] **Step 4: Commit**

```bash
git add theme/valaxy.config.ts
git commit -m "feat(share-card): register build-time plugin in defineTheme

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 7：OG meta 注入

### Task 16: post.vue 注入 og:image / twitter:card

**Files:**
- Modify: `theme/layouts/post.vue`

> 前置：Task 0.3 已确认 Valaxy 的 head 注入接口（`useHead` 或 frontmatter head）。

- [ ] **Step 1: 在 post.vue 注入 head**

按 spike 结论，用 Valaxy/`@unhead/vue` 的 `useHead` 按路由设：

```ts
import { useHead } from '@unhead/vue' // 或 valaxy 透出的等价 API（按 Task 0.3）
// ...
const ogImage = computed(() => {
  if (themeConfig.value?.shareCard?.og === false)
    return undefined
  const slug = (route?.path || '/').replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index'
  return `/share-cards/${slug}.png` // 与 buildShareCardPlugin 文件名规则一致
})
useHead({
  meta: computed(() => ogImage.value
    ? [
        { property: 'og:image', content: ogImage.value },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: ogImage.value },
      ]
    : []),
})
```

> **一致性要点**：slug → 文件名的规则必须与 Task 14 `buildShareCardPlugin` 完全相同（同一个 `replace` 链）。把该转换抽成 `theme/shareCard/slugToFileName.ts` 纯函数，两端共用（DRY，避免 Task 14 / Task 16 规则漂移）。

- [ ] **Step 2: 抽共享 slugToFileName 并替换两处**

```ts
// theme/shareCard/slugToFileName.ts
export function slugToFileName(slug: string): string {
  return slug.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index'
}
```

在 Task 14 插件与本 Task 的 `ogImage` 里都改用 `slugToFileName`。

- [ ] **Step 3: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。

- [ ] **Step 4: 构建验证 head 注入**

Run: `pnpm build` → 查产物某篇文章 HTML
```bash
grep -l "og:image" demo/dist/**/index.html 2>/dev/null | head
```
Expected: 文章页 HTML 含 `og:image` 指向存在的 `/share-cards/<slug>.png`。

- [ ] **Step 5: Commit**

```bash
git add theme/layouts/post.vue theme/shareCard/slugToFileName.ts theme/node/buildShareCardPlugin.ts
git commit -m "feat(share-card): inject og:image meta + share slugToFileName helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 8：收口验证

### Task 17: 全量验证 + 文档

**Files:**
- Modify: `theme/README.md`（新增 shareCard 配置说明小节）

- [ ] **Step 1: 全套质量门**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: 全部 PASS；构建产物含 share-cards/*.png 且文章页含 og:image。

- [ ] **Step 2: README 补 shareCard 配置表**

在 `theme/README.md` 配置章节新增 `shareCard.*` 字段说明（enable/button/og/variants/portrait/landscape），与现有配置文档风格一致。

- [ ] **Step 3: Commit**

```bash
git add theme/README.md
git commit -m "docs(share-card): document shareCard config surface

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: 清理 spike 脚本**

```bash
rm -f /tmp/spike-napi-backend.mjs /tmp/spike-wasm.mjs /tmp/spike.png
```

---

## Spike Results（2026-06-01 隔离环境实测，/tmp/shuimo-spike）

- **Task 0.1（napi → core 渲染）**：
  - `InkMount.generateScene(...)` 纯数据生成 ✅（5 层山，Node 直接可用）
  - `generateStampPath(...)` 返回 `{ path, bounds }` 矢量 ✅（Node-safe，不碰 canvas）
  - ⚠️ **`InkMount.generate({ ctx })` / `Canvas2DBackend` / `xuanPaper({mode:'canvas'})` 直接调会 `document is not defined`** —— core 的 canvas 渲染路径内部用 `document.createElement('canvas')` 建离屏层，是浏览器专用。
  - ✅ **解法（无需改 core、无需 orchestrate）**：在 import core 之前给 Node 注入极简 DOM shim：
    ```js
    import { createCanvas } from '@napi-rs/canvas'
    globalThis.document = { createElement: tag => tag === 'canvas' ? createCanvas(300, 150) : (() => { throw new Error(`unsupported <${tag}>`) })() }
    globalThis.OffscreenCanvas = function (w, h) { return createCanvas(w, h) }
    ```
    加 shim 后 `InkMount.generate({ width, height, seed, ctx, backend: 'canvas2d' })` 与 `xuanPaper({mode:'canvas'})` 均成功渲染出真实水墨山 + 宣纸纹理（已肉眼验证 PNG）。
  - `InkMount.generate` 接受 `ctx?: CanvasRenderingContext2D` + `backend: 'canvas2d'`，直接喂 napi ctx 即可，输出 `RenderOutput { type: 'canvas' }`。
- **Task 0.2（WASM noise）**：**非阻塞**。`generateScene` 在 Node 成功本身证明 noise 引擎在 Node 可用（山脊 = FBM noise）；wasm 已 inline/JS-fallback，**无需手动 `initWasmNoiseEngine`、无需 wasm 文件**（published 包里也确实没有 dist/wasm）。
- **Task 0.3（钩子 + head）**：head 用 `import { useHead } from '@unhead/vue'`（valaxy 底层即 unhead，`@unhead/vue` 可解析）。文章枚举沿用 `collectStampChars` 的 `pages/**/*.md` walk。⚠️ 产物目录时机：closeBundle 在资源拷贝后，写 `public/` 可能赶不上 —— 实现时需解析真实 outDir 或在 build 早期生成；这是集成细节，可行性不受影响。
- **Task 0.4（客户端耗时）**：待 Phase 3 后在浏览器实测。

### 据 spike 修正的计划要点

1. **新增 `theme/node/domShim.ts`**（仅构建期用）：导出 `installNodeCanvasShim()`，在 `buildShareCardPlugin` 动态 import shuimo-core **之前**调用。Task 14 的 `buildNodeDeps` 必须先 `installNodeCanvasShim()`。
2. **客户端 `adaptCoreToDeps`（Task 10）**：`drawXuanPaper` 用 `xuanPaper({mode:'canvas'})` 拿 canvas 再 `ctx.drawImage`；`drawMountain` 用 `InkMount.generate({ ctx: 离屏ctx })` 或直接传目标 ctx + box 平移；`drawStampPath` 用 `generateStampPath` 拿 `{path,bounds}` 自己描到 ctx（矢量，两端一致）。
3. **Task 0.2 相关步骤删除**：`buildNodeDeps` 不需要 WASM 初始化逻辑。
4. **依赖**：构建时与 Phase 3 Node 单测都需 workspace 内 `@napi-rs/canvas`；当前被 `trustPolicy: no-downgrade` 拦截（chokidar@4.0.3 误报），**待用户决定安装方式**（见对话）。Phase 1-2 不需要它，可先行。

---

## Self-Review 备注

- **Spec 覆盖**：§2 架构→Phase 0+3；§4.1→T1；§4.2→T4-6；§4.3→T7-9；§4.4→T10-11；§4.5→T12-13；§4.6→T14-15；§4.7→T16；§5 配置→T2-3；§7 降级→T10/T13/T15；§8 字体→T14（GlobalFonts）；§9 错误→T9/T11/T14；§10 测试→各 Phase；§11 spikes→Phase 0；§12 依赖→T0.1。全部有落点。
- **Spike 依赖**：Task 10 的 `adaptCoreToDeps`、Task 14 的 `buildNodeDeps`、Task 16 的 head API 三处的**精确 core/valaxy 调用**依赖 Phase 0 结论 —— 这是有意的：core 的运行时签名只有跑过 spike 才能确定，强行在计划里写死会引入幻觉 API。执行者必须先做 Phase 0 再填这三处。
- **DRY**：`slugToFileName`（T16）、`ComposeDeps` 绘制逻辑（T10/T14 共享）已显式去重。
- **类型一致**：`CardSpec` / `ComposeDeps` / `Box` 全程同名；`render(variant)` 签名一致。
