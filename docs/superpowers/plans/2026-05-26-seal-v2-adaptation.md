# Seal V2 Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the theme's seal-stamp rendering from `@jobinjia/shuimo-core` V1 (`drawing` entry, `generateStampAsync`) to V2 (`stamp-v2` entry, `generateSealAsync`), with hard removal of obsolete V1-only fields and two narrow back-compat aliases (`type → mode`, `shape: 'rectangle' → 'rect'`).

**Architecture:** Replace the import path and option-shape in two call sites (`ShuimoStamp.vue`, `useCurtainStamp.ts`) via a single `buildSealOptions()` mapper per file. Rewrite the `ThemeConfig.stamp / .nav / .curtain` schema and `defaultThemeConfig.stamp` to the V2 surface (nested `border/carving/ink/notch/pressing` groups, flat top-level shortcuts). Drop the now-meaningless `fontFamily` wiring from `App.vue` and `ShuimoSolarSeal.vue`. Worker-offload (`useStampFontWorker.ts`) stays as-is — V2 reuses the same `@jobinjia/shuimo-core/stamp/font-worker` protocol.

**Tech Stack:** TypeScript, Vue 3 (Composition API + `<script setup>`), pnpm workspaces, `@jobinjia/shuimo-core` 2.0.x (linked locally via `pnpm-workspace.yaml` overrides per `project_shuimo_core_local_link` memory).

**Spec:** `docs/superpowers/specs/2026-05-26-seal-v2-adaptation-design.md`

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `theme/types/index.d.ts` | Modify | `ThemeConfig.stamp / .nav / .curtain` schema → V2 shape with `type/rectangle` aliases |
| `theme/node/index.ts` | Modify | `defaultThemeConfig.stamp` → V2 default values |
| `theme/composables/useCurtainStamp.ts` | Rewrite | Singleton curtain seal: import `stamp-v2`, `buildSealOptions`, read `result.svg` |
| `theme/components/ShuimoStamp.vue` | Rewrite | Per-instance seal component: V2 props, `buildSealOptions`, `result.svg`, drop V1 prop watchers, drop `toDataURL` branch |
| `theme/App.vue` | Modify (small) | Drop `curtainStampFont` computed and `fontFamily:` line in `curtainStampProps` |
| `theme/components/ShuimoSolarSeal.vue` | Modify (small) | Drop `:font-family` attribute on `<ShuimoStamp>` |
| `theme/composables/useStampFontWorker.ts` | **No change** | V2's `SealOptions.fontWorker` reuses same worker entry |
| `docs/superpowers/specs/_artifacts/` | Create directory | Reference V1 screenshots for visual baseline |

Demo is **not** touched (read-only per `feedback_demo_boundary` memory). The two back-compat aliases keep `demo/pages/posts/hello.md` (`shape: rectangle`, `type: yang`) and all other demo frontmatter working.

---

## Pre-flight

- [ ] **Pre-1: Confirm clean working tree**

Run: `git status`
Expected: only the pre-existing unrelated changes (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `theme/package.json`) — these are the local-link toggle, do NOT stage them in any task in this plan.

- [ ] **Pre-2: Confirm local link is active**

Run: `grep -A 1 'shuimo-core-local-link' pnpm-workspace.yaml`
Expected: an `overrides:` block pointing at `link:/Users/jiabinbin/myself/github/shuimo-core/packages/core`. If missing, ask the user to run `pnpm dev:local` before proceeding.

- [ ] **Pre-3: Confirm V2 entry exists in the linked build**

Run: `ls /Users/jiabinbin/myself/github/shuimo-core/packages/core/dist/stamp-v2.mjs`
Expected: file exists. If not, ask the user to rebuild shuimo-core (`pnpm build` in that repo) before continuing.

- [ ] **Pre-4: Baseline typecheck on `main`**

Run: `pnpm typecheck`
Expected: PASS. Anchor for "we did not regress typecheck". If it already fails on main, stop and report — do not try to fix unrelated typecheck failures in this plan.

---

## Task 0: Capture V1 visual baseline

**Files:**
- Create: `docs/superpowers/specs/_artifacts/seal-v1-curtain.png`
- Create: `docs/superpowers/specs/_artifacts/seal-v1-stamp-hello.png`

**Why first:** Once we start editing V2, the V1 curtain look is gone. We need a screenshot reference to tune V2 against (§7 of the spec).

- [ ] **Step 1: Create the artifacts directory**

Run: `mkdir -p docs/superpowers/specs/_artifacts`

- [ ] **Step 2: Start the V1 dev server**

Run: `pnpm dev` (in the project root, foreground or in a separate terminal — the dev server URL will be printed to stdout).

- [ ] **Step 3: Capture curtain seal screenshot**

Open the printed URL in a browser. The curtain pops on first paint. Screenshot the curtain seal (both desktop-left/right rendering and one mobile-top/bottom rendering if the viewport is narrow). Save as `docs/superpowers/specs/_artifacts/seal-v1-curtain.png`.

- [ ] **Step 4: Capture per-post seal screenshot**

Navigate to `/posts/hello` (or whichever URL maps to `demo/pages/posts/hello.md` — typically `/posts/hello`). Screenshot the rendered seal at the top of the post. Save as `docs/superpowers/specs/_artifacts/seal-v1-stamp-hello.png`.

- [ ] **Step 5: Stop the dev server**

Stop the dev server (Ctrl-C).

- [ ] **Step 6: Commit baseline screenshots**

```bash
git add docs/superpowers/specs/_artifacts/seal-v1-curtain.png \
        docs/superpowers/specs/_artifacts/seal-v1-stamp-hello.png
git commit -m "$(cat <<'EOF'
docs(specs): capture V1 seal baseline screenshots

Reference for Seal V2 adaptation visual-match step. Curtain seal at
home-route paint, per-post seal from /posts/hello (4-column "受命,
于天,既寿,永昌"). Used to tune V2 border/carving/ink params after the
shuimo-core stamp-v2 migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1: Rewrite `ThemeConfig.stamp` schema

**Files:**
- Modify: `theme/types/index.d.ts:67-198`

- [ ] **Step 1: Open the file and find the `stamp:` block**

Run: `grep -n "^  stamp: Partial" theme/types/index.d.ts`
Expected: one match (around line 67).

- [ ] **Step 2: Replace the `stamp: Partial<{...}>` block (lines 67 through the end of `curtain: Partial<{...}>` near line 197)**

Replace the entire `stamp: Partial<{ ... }>` block — `stamp` itself plus its nested `nav` and `curtain` — with:

```ts
  stamp: Partial<{
    /** @default true */
    enable: boolean
    /** 印章文字（传给 V2 的 `text`） */
    author: string
    /** 阴章/阳章 @default 'yang' */
    mode: 'yin' | 'yang'
    /** @deprecated 改用 `mode`；若两者都设，`mode` 优先 */
    type: 'yin' | 'yang'
    /** 印章形状 @default 'rect'；`'rectangle'` 为 `'rect'` 的兼容别名 */
    shape:
      | 'auto' | 'square' | 'rect' | 'rectangle'
      | 'circle' | 'ellipse' | 'polygon'
    /** shape='polygon' 时的边数 @default 6 */
    polygonSides: number
    /** shape='polygon' 时的顶/边朝向 @default 'flat-top' */
    polygonOrientation: 'flat-top' | 'point-top'
    /** 篆体几何 baseline（V2 新增） */
    script: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'
    /** 印泥色 @default '#C8102E' → V2 `ink.color` */
    color: string
    /** 随机种子 @default 69706 */
    seed: number
    /** 容器显示尺寸 + V2 `size`（px） @default 200 */
    size: number
    /** 文字水平偏移 -1~1 → V2 `layout.offsetX` @default 0 */
    offsetX: number
    /** 文字垂直偏移 -1~1 → V2 `layout.offsetY` @default 0 */
    offsetY: number
    /** → V2 `layout.padding` */
    padding: number
    /** → V2 `layout.gap`（行列共享） */
    gap: number
    /** → V2 `layout.columnGap` */
    columnGap: number
    /** → V2 `layout.rowGap` */
    rowGap: number
    /** → V2 `layout.stretch` */
    stretch: boolean
    /** → V2 `border.*` */
    border: Partial<{
      thickness: number
      cornerRadius: number
      corner: 'none' | 'round' | 'stone'
      /** 0..1 */
      roughness: number
    }>
    /** → V2 `carving.*` */
    carving: Partial<{
      intensity: number
      breakage: number
    }>
    /** → V2 `ink.*`（不含 color，color 走顶层） */
    ink: Partial<{
      density: number
      bleed: number
      grain: number
      aging: number
    }>
    /** → V2 `notch.*` */
    notch: {
      strategy: 'auto' | 'manual' | 'none'
      charIndex?: number
      strokeHint?: 'longest' | 'nearest'
      jitter?: number
    }
    /** → V2 `pressing.*` */
    pressing: Partial<{
      rotate: number
      pressure: number
      partialLoss: number
      offset: [number, number]
    }>

    /** 导航菜单印章配置 */
    nav: Partial<{
      /** 阴章/阳章 @default 'yang' */
      mode: 'yin' | 'yang'
      /** @deprecated 改用 `mode` */
      type: 'yin' | 'yang'
      /** 印章形状 @default 'rect' */
      shape: 'auto' | 'square' | 'rect' | 'rectangle' | 'circle' | 'ellipse' | 'polygon'
      polygonSides: number
      polygonOrientation: 'flat-top' | 'point-top'
      /** 是否显示菜单 icon @default false */
      showIcon: boolean
      /** 移动端菜单印章尺寸（px） @default 40 */
      mobileSize: number
      /** 桌面端菜单印章尺寸（px） @default 48 */
      desktopSize: number
    }>

    /** 开屏幕布印章配置（独立于主印章，不会继承 `stamp.*`） */
    curtain: Partial<{
      /** 印章文字 @default '受命,于天,既寿,永昌' */
      author: string
      /** 印章颜色 */
      color: string
      /** 阴章/阳章 @default 'yang' */
      mode: 'yin' | 'yang'
      /** @deprecated 改用 `mode` */
      type: 'yin' | 'yang'
      /** 印章形状 @default 'rect' */
      shape: 'auto' | 'square' | 'rect' | 'rectangle' | 'circle' | 'ellipse' | 'polygon'
      polygonSides: number
      polygonOrientation: 'flat-top' | 'point-top'
      script: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'
      seed: number
      /** 幕布印章容器尺寸（px）。未设置时由 App.vue 按文字列数自适应 */
      size: number
      offsetX: number
      offsetY: number
      padding: number
      gap: number
      columnGap: number
      rowGap: number
      stretch: boolean
      border: Partial<{
        thickness: number
        cornerRadius: number
        corner: 'none' | 'round' | 'stone'
        roughness: number
      }>
      carving: Partial<{ intensity: number; breakage: number }>
      ink: Partial<{ density: number; bleed: number; grain: number; aging: number }>
      notch: {
        strategy: 'auto' | 'manual' | 'none'
        charIndex?: number
        strokeHint?: 'longest' | 'nearest'
        jitter?: number
      }
      pressing: Partial<{
        rotate: number
        pressure: number
        partialLoss: number
        offset: [number, number]
      }>
    }>
  }>
```

- [ ] **Step 3: Stage and commit**

```bash
git add theme/types/index.d.ts
git commit -m "$(cat <<'EOF'
refactor(stamp): rewrite ThemeConfig.stamp schema for shuimo-core V2

Drop V1-only fields (fontFamily/fontSize/fontWeight/textCarving/borderScale*/
columnSpacing*/characterSpacing*/paddingX*/paddingY*/noiseAmountPx/
borderPointsPx/cornerRadiusPx/borderWidthPx/regularShape). Replace with V2
surface: top-level mode/shape/script/seed/size + grouped border/carving/ink/
notch/pressing/layout.

Back-compat: keep `type` as deprecated alias for `mode`, keep `'rectangle'`
in the shape union as alias for `'rect'`. demo and downstream blog
frontmatter (`type: yang`, `shape: rectangle`) remain valid.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Typecheck will fail after this commit (downstream files still reference old fields); that's expected — Task 7 runs typecheck after all edits land.

---

## Task 2: Rewrite `defaultThemeConfig.stamp`

**Files:**
- Modify: `theme/node/index.ts:48-...` (the `stamp:` block inside `defaultThemeConfig`)

- [ ] **Step 1: Locate the `stamp:` block**

Run: `grep -n "  stamp: {" theme/node/index.ts`
Expected: a single match (around line 48).

- [ ] **Step 2: Replace the entire `stamp: { ... }` block** (from `stamp: {` on its own line through the closing `},` of `curtain: { ... }`)

```ts
  stamp: {
    enable: true,
    author: '受命,于天,既寿,永昌',
    mode: 'yang',
    shape: 'rect',
    color: '#C8102E',
    seed: 69706,
    size: 200,
    offsetX: 0,
    offsetY: 0,
    border: { thickness: 4, cornerRadius: 10, corner: 'round', roughness: 0.05 },
    carving: { intensity: 0.4 },
    nav: {
      mode: 'yang',
      shape: 'rect',
      showIcon: false,
      mobileSize: 40,
      desktopSize: 48,
    },
    curtain: {
      author: '墨韵',
      mode: 'yin', // V1 默认是阴章；保留视觉一致
      shape: 'rect',
      seed: 69706,
      size: 200,
      border: { thickness: 4, cornerRadius: 10, corner: 'round', roughness: 0.05 },
      carving: { intensity: 0.4 },
      ink: { bleed: 1.0 },
    },
  },
```

- [ ] **Step 3: Stage and commit**

```bash
git add theme/node/index.ts
git commit -m "$(cat <<'EOF'
refactor(stamp): rewrite defaultThemeConfig.stamp for V2 surface

Drop V1-only defaults. Keep visual baseline approximated for curtain
(border.thickness 4 / cornerRadius 10 / corner 'round' / roughness 0.05;
carving.intensity 0.4; ink.bleed 1.0). Per-instance defaults match.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate `useCurtainStamp.ts` to V2

**Files:**
- Modify: `theme/composables/useCurtainStamp.ts` (full rewrite of the file body — top header comment intent preserved, internals re-targeted to V2)

- [ ] **Step 1: Replace the file contents with the V2 version**

Replace the entire file with:

```ts
// 单例化幕布印章生成：4 个挂载点（桌面 left/right + 移动 top/bottom）原本各跑
// 一次 generateSealAsync —— 主线程同步串行 + 1.2MB 字体 fontkit parse，4 倍冗余。
// 现在共享一份 SVG 字符串，挂载点只做轻量 ID 重命名后 v-html。
import type { SealOptions, SealShape } from '@jobinjia/shuimo-core/stamp-v2'
import type { ComputedRef, Ref } from 'vue'
import { onMounted, ref, watch } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { useThemeConfig } from './config'
import { getStampFontWorker } from './useStampFontWorker'
import { warnMissingShuimoCore } from './warnMissingShuimoCore'

type GenerateSealAsync = typeof import('@jobinjia/shuimo-core/stamp-v2').generateSealAsync

let cachedGenerateSealAsync: GenerateSealAsync | null = null
let stampV2ModulePromise: Promise<GenerateSealAsync> | null = null

function ensureStampV2Module(): Promise<GenerateSealAsync> {
  if (cachedGenerateSealAsync)
    return Promise.resolve(cachedGenerateSealAsync)
  if (stampV2ModulePromise)
    return stampV2ModulePromise
  stampV2ModulePromise = import('@jobinjia/shuimo-core/stamp-v2').then((mod) => {
    cachedGenerateSealAsync = mod.generateSealAsync
    return cachedGenerateSealAsync
  })
  return stampV2ModulePromise
}

// 模块加载时（App.vue import useCurtainStamp 即触发）立即并行预热 stamp-v2
// chunk + yishan woff2 fetch；fontWorker 由 useStampFontWorker 共享模块管理，
// 模块顶部 import 即 spawn，所有 stamp 调用点（curtain / theme toggle / 文章
// frontmatter stamp）共用一个 worker。
if (typeof window !== 'undefined') {
  ensureStampV2Module().catch(() => {})
  fetch(yishanFontUrl).catch(() => {})
}

type ShapeStr =
  | 'auto' | 'square' | 'rect' | 'rectangle'
  | 'circle' | 'ellipse' | 'polygon'

function mapShape(s: ShapeStr | undefined, sides?: number, orient?: 'flat-top' | 'point-top'): SealShape {
  switch (s) {
    case 'polygon':
      return { kind: 'polygon', sides: sides ?? 6, orientation: orient ?? 'flat-top' }
    case 'auto':    return { kind: 'auto' }
    case 'square':  return { kind: 'square' }
    case 'circle':  return { kind: 'circle' }
    case 'ellipse': return { kind: 'ellipse' }
    case 'rectangle': // alias
    case 'rect':
    default:
      return { kind: 'rect' }
  }
}

function parseStampText(text: string | string[]): string[] {
  if (Array.isArray(text))
    return text
  if (text.includes(',') || text.includes('，'))
    return text.split(/[,，]/).map(s => s.trim())
  return [text]
}

function pruneEmpty<T extends Record<string, any>>(obj: T): T | undefined {
  const out: Record<string, any> = {}
  let has = false
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) {
      out[k] = obj[k]
      has = true
    }
  }
  return has ? (out as T) : undefined
}

export function useCurtainStamp(input: ComputedRef<Record<string, any>> | Ref<Record<string, any>>) {
  const themeConfig = useThemeConfig()
  const svgRaw = ref<string | null>(null)
  const failed = ref(false)
  const ready = ref(false)
  // 防 stale 写入：watch 触发的二次 render 比一次 render 先完成时，旧 promise
  // 落地不能覆盖新结果
  let generation = 0

  function buildSealOptions(p: Record<string, any>): SealOptions {
    const stampColor = p.color || themeConfig.value?.colors?.stamp || '#C8102E'
    const mode = (p.mode ?? p.type ?? 'yang') as 'yin' | 'yang'
    return {
      text: parseStampText(p.text ?? p.author ?? ''),
      size: p.size,
      mode,
      shape: mapShape(p.shape, p.polygonSides, p.polygonOrientation),
      seed: p.seed ?? 69706,
      script: p.script,
      font: yishanFontUrl,
      // fontkit woff2 brotli 解压 offload 到 worker 主线程零成本（shuimo-core
      // 1.2.x+ 已支持，V2 走同一 worker 协议）。
      fontWorker: getStampFontWorker() ?? undefined,
      ink: { color: stampColor, ...(p.ink ?? {}) },
      border: p.border,
      carving: p.carving,
      notch: p.notch,
      pressing: p.pressing,
      layout: pruneEmpty({
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        padding: p.padding,
        gap: p.gap,
        columnGap: p.columnGap,
        rowGap: p.rowGap,
        stretch: p.stretch,
      }),
    }
  }

  async function render() {
    const id = ++generation
    failed.value = false
    try {
      const generateSealAsync = await ensureStampV2Module()
      const result = await generateSealAsync(buildSealOptions(input.value))
      if (id !== generation)
        return
      svgRaw.value = result.svg ?? null
    }
    catch (err) {
      if (id !== generation)
        return
      failed.value = true
      if (import.meta.env.DEV && !warnMissingShuimoCore.fired) {
        warnMissingShuimoCore.fired = true
        console.warn(
          '[valaxy-theme-shuimo] curtain stamp fallback in use. '
          + 'Install the optional peer dependency "@jobinjia/shuimo-core" to render SVG stamps.',
          err,
        )
      }
    }
    if (id === generation)
      ready.value = true
  }

  if (typeof window !== 'undefined') {
    onMounted(render)
    watch(input, render)
  }

  return { svgRaw, failed, ready }
}
```

- [ ] **Step 2: Stage and commit**

```bash
git add theme/composables/useCurtainStamp.ts
git commit -m "$(cat <<'EOF'
refactor(stamp): migrate useCurtainStamp to shuimo-core stamp-v2

Switch dynamic import to '@jobinjia/shuimo-core/stamp-v2' and call
generateSealAsync. Internal buildSealOptions maps the theme's flat
ShuimoStamp props onto V2's grouped SealOptions (mode/shape via
mapShape helper, ink/border/carving/notch/pressing pass-through,
layout pruned of undefined keys). type → mode and shape: 'rectangle'
→ { kind: 'rect' } aliases preserved. fontWorker integration
unchanged — V2 reuses the same stamp/font-worker protocol.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Migrate `ShuimoStamp.vue` to V2

**Files:**
- Rewrite: `theme/components/ShuimoStamp.vue`

- [ ] **Step 1: Replace the file with the V2 version**

```vue
<script setup lang="ts">
/**
 * ShuimoStamp — Chinese seal stamp component.
 *
 * Renders an SVG seal via @jobinjia/shuimo-core's stamp-v2 entry, with a CSS
 * fallback when the optional peer dependency is not installed.
 *
 * Per-post customization via frontmatter: text, color, mode (yin/yang),
 * shape, script, and any nested V2 group (border/carving/ink/notch/pressing).
 *
 * Text layout: use commas to split text into columns, e.g. "月下,独酌"
 * renders as a 2-column seal (right column "月下", left column "独酌").
 *
 * Default font: YiShanBeiZhuan (seal script / 篆书).
 */
import type {
  SealBorderOptions,
  SealCarvingOptions,
  SealInkOptions,
  SealNotchSpec,
  SealOptions,
  SealPressingOptions,
  SealScript,
  SealShape,
} from '@jobinjia/shuimo-core/stamp-v2'
import { computed, onMounted, ref, watch } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { useThemeConfig } from '../composables'
import { getStampFontWorker } from '../composables/useStampFontWorker'
import { warnMissingShuimoCore } from '../composables/warnMissingShuimoCore'

type ShapeStr =
  | 'auto' | 'square' | 'rect' | 'rectangle'
  | 'circle' | 'ellipse' | 'polygon'

const props = withDefaults(defineProps<{
  text?: string
  /** 阴章/阳章 */
  mode?: 'yin' | 'yang'
  /** @deprecated 改用 `mode`；若两者都设，`mode` 优先 */
  type?: 'yin' | 'yang'
  /** `'rectangle'` 为 `'rect'` 的兼容别名 */
  shape?: ShapeStr
  polygonSides?: number
  polygonOrientation?: 'flat-top' | 'point-top'
  script?: SealScript
  size?: number
  offsetX?: number
  offsetY?: number
  color?: string
  seed?: number
  padding?: number
  gap?: number
  columnGap?: number
  rowGap?: number
  stretch?: boolean
  border?: SealBorderOptions
  carving?: SealCarvingOptions
  ink?: Omit<SealInkOptions, 'color'>
  notch?: SealNotchSpec
  pressing?: SealPressingOptions
}>(), {
  text: '受命,于天,既寿,永昌',
  mode: 'yang',
  shape: 'rect',
  size: 200,
  offsetX: 0,
  offsetY: 0,
})

const emit = defineEmits<{
  rendered: []
}>()

const stampSvg = ref<string | null>(null)
const showFallback = ref(false)
const themeConfig = useThemeConfig()
let firstRenderEmitted = false

function emitFirstRender() {
  if (firstRenderEmitted)
    return
  firstRenderEmitted = true
  emit('rendered')
}

const resolvedMode = computed<'yin' | 'yang'>(() => props.mode ?? props.type ?? 'yang')

// stampUid 在 onMounted 才生成：setup 顶层走 SSR 会用 Math.random / crypto，
// 服务端和客户端值不同导致 hydration 警告 + 整 stamp 重渲。renderStamp 也是
// onMounted 才跑，stamp 在 SSR 阶段不可见，延后到 client 完全 OK
let stampUid = ''
function ensureStampUid() {
  if (stampUid)
    return
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    stampUid = crypto.randomUUID().slice(0, 8)
  else
    stampUid = Math.random().toString(36).slice(2, 10)
}

// Cache the dynamic import so we only load stamp-v2 once
type GenerateSealAsync = typeof import('@jobinjia/shuimo-core/stamp-v2').generateSealAsync
let generateSealAsync: GenerateSealAsync | null = null

function mapShape(s: ShapeStr): SealShape {
  switch (s) {
    case 'polygon':
      return { kind: 'polygon', sides: props.polygonSides ?? 6, orientation: props.polygonOrientation ?? 'flat-top' }
    case 'auto':    return { kind: 'auto' }
    case 'square':  return { kind: 'square' }
    case 'circle':  return { kind: 'circle' }
    case 'ellipse': return { kind: 'ellipse' }
    case 'rectangle': // alias
    case 'rect':
    default:
      return { kind: 'rect' }
  }
}

/** Split stamp text into columns by comma delimiter for multi-column layout. */
function parseStampText(text: string | string[]): string[] {
  if (Array.isArray(text))
    return text
  if (text.includes(',') || text.includes('，'))
    return text.split(/[,，]/).map(s => s.trim())
  return [text]
}

function pruneEmpty<T extends Record<string, any>>(obj: T): T | undefined {
  const out: Record<string, any> = {}
  let has = false
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) {
      out[k] = obj[k]
      has = true
    }
  }
  return has ? (out as T) : undefined
}

function buildSealOptions(): SealOptions {
  const stampColor = props.color || themeConfig.value?.colors?.stamp || '#C8102E'
  return {
    text: parseStampText(props.text),
    size: props.size,
    mode: resolvedMode.value,
    shape: mapShape(props.shape ?? 'rect'),
    seed: props.seed ?? 69706,
    script: props.script,
    font: yishanFontUrl,
    // fontWorker offload 让 fontkit woff2 brotli 解压离开主线程（shuimo-core
    // 1.2.x+；V2 走同一 worker 协议）。所有 stamp 共享一个 worker，二次调用
    // (fontUrl, chars) 命中 worker 内部缓存零成本。
    fontWorker: getStampFontWorker() ?? undefined,
    ink: { color: stampColor, ...(props.ink ?? {}) },
    border: props.border,
    carving: props.carving,
    notch: props.notch,
    pressing: props.pressing,
    layout: pruneEmpty({
      offsetX: props.offsetX,
      offsetY: props.offsetY,
      padding: props.padding,
      gap: props.gap,
      columnGap: props.columnGap,
      rowGap: props.rowGap,
      stretch: props.stretch,
    }),
  }
}

async function renderStamp() {
  ensureStampUid()
  try {
    if (!generateSealAsync) {
      const mod = await import('@jobinjia/shuimo-core/stamp-v2')
      generateSealAsync = mod.generateSealAsync
    }

    const result = await generateSealAsync(buildSealOptions())
    const svg = result.svg ?? ''

    stampSvg.value = svg
      .replace(/stamp-ink-texture/g, `stamp-ink-texture-${stampUid}`)
      .replace(/stamp-border-texture/g, `stamp-border-texture-${stampUid}`)
      .replace(/stamp-text-texture/g, `stamp-text-texture-${stampUid}`)
  }
  catch (err) {
    showFallback.value = true
    if (import.meta.env.DEV && !warnMissingShuimoCore.fired) {
      warnMissingShuimoCore.fired = true
      console.warn(
        '[valaxy-theme-shuimo] ShuimoStamp fallback in use. '
        + 'Install the optional peer dependency "@jobinjia/shuimo-core" to render SVG stamps.',
        err,
      )
    }
  }
  emitFirstRender()
}

onMounted(renderStamp)

// Re-render when stamp props change (e.g. SPA route navigation updates frontmatter)
watch(
  () => [
    props.text, props.mode, props.type, props.shape, props.polygonSides, props.polygonOrientation,
    props.script, props.color, props.size, props.seed,
    props.offsetX, props.offsetY,
    props.padding, props.gap, props.columnGap, props.rowGap, props.stretch,
    props.border, props.carving, props.ink, props.notch, props.pressing,
  ],
  renderStamp,
  { deep: true },
)
</script>

<template>
  <div
    v-if="stampSvg"
    class="shuimo-stamp"
    v-html="stampSvg"
  />
  <div
    v-else-if="showFallback"
    class="shuimo-stamp-fallback"
    :class="[`shuimo-stamp-fallback--${resolvedMode}`]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.4}px` }"
  >
    {{ text.slice(0, 2) }}
  </div>
</template>

<style lang="scss" scoped>
.shuimo-stamp {
  --shuimo-stamp-size: v-bind(`${size}px`);
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    max-width: var(--shuimo-stamp-size);
    max-height: var(--shuimo-stamp-size);
    width: auto;
    height: auto;
  }
}

.shuimo-stamp-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--va-font-family-base);
  font-weight: bold;
  border-radius: 3px;
  transform: rotate(-3deg);
  line-height: 1.2;

  &--yin {
    background: var(--sm-stamp);
    color: var(--sm-paper);
  }

  &--yang {
    background: transparent;
    color: var(--sm-stamp);
    border: 2px solid var(--sm-stamp);
  }
}
</style>
```

- [ ] **Step 2: Stage and commit**

```bash
git add theme/components/ShuimoStamp.vue
git commit -m "$(cat <<'EOF'
refactor(stamp): migrate ShuimoStamp to shuimo-core stamp-v2

Replace V1 prop surface (fontFamily/fontSize/fontWeight/textCarving/
borderScale*/columnSpacing*/characterSpacing*/paddingX*/paddingY*/
noiseAmountPx/borderPointsPx/cornerRadiusPx/borderWidthPx/regularShape)
with V2: top-level mode/shape/script/size/seed + grouped border/carving/
ink/notch/pressing.

Keep `type` and `shape: 'rectangle'` as back-compat aliases so existing
post frontmatter and blog content stays valid. Fallback template now
keys off the resolved mode (computed mode ?? type).

Switch dynamic import to '@jobinjia/shuimo-core/stamp-v2' and read
result.svg directly. Drop the v1 toDataURL fallback branch (V2 only
returns canvas under explicit output.format).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Trim `App.vue` curtain wiring

**Files:**
- Modify: `theme/App.vue:40-69`

- [ ] **Step 1: Edit — drop `curtainStampFont` and `fontFamily:` line**

Old (lines 40-69):
```ts
// --- Curtain stamp ---

const curtainStampConfig = computed(() => themeConfig.value?.stamp?.curtain || {})
const curtainStampText = computed(() => curtainStampConfig.value.author || '墨')
const curtainStampType = computed(() => curtainStampConfig.value.type || 'yin')
const curtainStampShape = computed(() => curtainStampConfig.value.shape || 'auto')
const curtainStampFont = computed(() =>
  curtainStampConfig.value.fontFamily
  || themeConfig.value?.fonts?.title
  || 'YiShanBeiZhuan, serif',
)
const curtainStampSize = computed(() => {
  const userSize = curtainStampConfig.value.size
  if (typeof userSize === 'number' && userSize > 0)
    return userSize
  const columns = curtainStampText.value.split(/[,，]/).filter(Boolean).length || 1
  if (columns >= 3)
    return 240
  if (columns === 2)
    return 180
  return 140
})
const curtainStampProps = computed(() => ({
  ...curtainStampConfig.value,
  text: curtainStampText.value,
  type: curtainStampType.value,
  shape: curtainStampShape.value,
  fontFamily: curtainStampFont.value,
  size: curtainStampSize.value,
}))
```

Replace with:
```ts
// --- Curtain stamp ---

const curtainStampConfig = computed(() => themeConfig.value?.stamp?.curtain || {})
const curtainStampText = computed(() => curtainStampConfig.value.author || '墨')
const curtainStampMode = computed(() => curtainStampConfig.value.mode ?? curtainStampConfig.value.type ?? 'yin')
const curtainStampShape = computed(() => curtainStampConfig.value.shape || 'auto')
const curtainStampSize = computed(() => {
  const userSize = curtainStampConfig.value.size
  if (typeof userSize === 'number' && userSize > 0)
    return userSize
  const columns = curtainStampText.value.split(/[,，]/).filter(Boolean).length || 1
  if (columns >= 3)
    return 240
  if (columns === 2)
    return 180
  return 140
})
const curtainStampProps = computed(() => ({
  ...curtainStampConfig.value,
  text: curtainStampText.value,
  mode: curtainStampMode.value,
  shape: curtainStampShape.value,
  size: curtainStampSize.value,
}))
```

Use the Edit tool to do this in one operation (the old block is a unique contiguous match).

- [ ] **Step 2: Check that no other references to `curtainStampFont` or `curtainStampType` remain**

Run: `grep -n "curtainStampFont\|curtainStampType" theme/App.vue`
Expected: no output.

- [ ] **Step 3: Verify `ShuimoCurtainStampSlot` template props still match**

Run: `grep -n ":svg\|:size\|:failed\|:fallback-" theme/App.vue | head`
Expected: existing bindings reference `curtainStampSvg`, `curtainStampSize`, `curtainStampFailed`, `curtainStampText`, `curtainStampType` for the fallback-type prop. The slot fallback prop is still named `fallback-type` (component contract); since `curtainStampType` no longer exists, update the four `:fallback-type` lines to `:fallback-type="curtainStampMode"`.

- [ ] **Step 4: Replace all `:fallback-type="curtainStampType"` with `:fallback-type="curtainStampMode"`**

Use Edit with `replace_all: true` on `theme/App.vue`:
- `old_string`: `:fallback-type="curtainStampType"`
- `new_string`: `:fallback-type="curtainStampMode"`

- [ ] **Step 5: Verify**

Run: `grep -n "curtainStampType\|fallback-type" theme/App.vue`
Expected: only the four updated `:fallback-type="curtainStampMode"` lines, no `curtainStampType` reference.

- [ ] **Step 6: Stage and commit**

```bash
git add theme/App.vue
git commit -m "$(cat <<'EOF'
refactor(stamp): drop fontFamily wiring from curtain stamp props

V2 SealOptions doesn't carry fontFamily — font geometry comes from the
font buffer itself. Remove curtainStampFont computed and the fontFamily:
field on curtainStampProps. Rename curtainStampType → curtainStampMode
to match the V2 surface name and read either mode or the deprecated type
alias from theme config. Update the four ShuimoCurtainStampSlot
fallback-type bindings to read the new ref.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Trim `ShuimoSolarSeal.vue`

**Files:**
- Modify: `theme/components/ShuimoSolarSeal.vue:1-23`

- [ ] **Step 1: Edit — drop `:font-family` and the unused `titleFont` computed**

Old (lines 1-23):
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables'
import { getSolarTerm, getTimeOfDay } from '../composables/useSolarTerm'

const themeConfig = useThemeConfig()
const titleFont = computed(() => themeConfig.value?.fonts?.title || 'YiShanBeiZhuan, serif')
const term = getSolarTerm()
const time = getTimeOfDay()
</script>

<template>
  <div class="shuimo-solar-seal" :title="`${term.name} · ${time.shichen}时`">
    <ShuimoStamp
      :text="term.name"
      type="yang"
      shape="ellipse"
      color="#8B2500"
      :font-family="titleFont"
      :size="80"
    />
  </div>
</template>
```

Replace with:
```vue
<script setup lang="ts">
import { getSolarTerm, getTimeOfDay } from '../composables/useSolarTerm'

const term = getSolarTerm()
const time = getTimeOfDay()
</script>

<template>
  <div class="shuimo-solar-seal" :title="`${term.name} · ${time.shichen}时`">
    <ShuimoStamp
      :text="term.name"
      mode="yang"
      shape="ellipse"
      color="#8B2500"
      :size="80"
    />
  </div>
</template>
```

(Also flipped `type="yang"` → `mode="yang"` since this is theme-internal source and we control it.)

- [ ] **Step 2: Verify**

Run: `grep -n "titleFont\|font-family\|useThemeConfig" theme/components/ShuimoSolarSeal.vue`
Expected: no output (all three are gone).

- [ ] **Step 3: Stage and commit**

```bash
git add theme/components/ShuimoSolarSeal.vue
git commit -m "$(cat <<'EOF'
refactor(stamp): drop font-family wiring in ShuimoSolarSeal

V2 SealOptions has no fontFamily. Remove the titleFont computed and
the :font-family attribute. Switch the literal type=yang to mode=yang
since this is theme-internal source we control.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Typecheck + lint

**Files:**
- None (verification only)

- [ ] **Step 1: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. If any error mentions a removed V1 field, the corresponding Task 1-6 left a reference behind — fix it. If it's an unrelated pre-existing failure, surface it; do not fix it in this plan.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: PASS or autofixed-only. If lint reports formatting issues, run `pnpm lint --fix` and inspect the diff.

- [ ] **Step 3: If lint required code changes, commit them**

```bash
git status
# only if there are lint-driven changes:
git add -p   # or named paths
git commit -m "$(cat <<'EOF'
chore(lint): satisfy eslint after seal V2 migration

Autofix output from `pnpm lint --fix`. No behavioral change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Skip this commit if `git status` shows nothing.

---

## Task 8: Run unit tests

**Files:**
- None (verification only)

- [ ] **Step 1: Run vitest**

Run: `pnpm test --run` (or `pnpm vitest run` — see `theme/package.json` for the exact script name; if there's no `test` script, run `pnpm -F @jobinjia/valaxy-theme-shuimo vitest run`).

Expected: existing tests in `theme/composables/useThemeCssVars.test.ts` pass. No new tests added in this plan — the migration is a 1:1 mapping with no new behavior to assert, and there is no infra for asserting on rendered SVG content. Visual acceptance is Task 9.

If `pnpm test` is not defined at the workspace root, fall back to `pnpm -C theme vitest run` (whichever matches the existing convention).

---

## Task 9: Visual acceptance + curtain tuning

**Files:**
- Possibly modify: `theme/node/index.ts` (only the `curtain.border` / `curtain.carving` / `curtain.ink` values)

This is an interactive loop. The goal: V2 curtain seal reads visually close to the V1 baseline screenshots from Task 0.

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`. Open the URL the CLI prints.

- [ ] **Step 2: Compare curtain seal to baseline**

The curtain pops on first paint. Compare to `docs/superpowers/specs/_artifacts/seal-v1-curtain.png`. Three things to look at:

1. **Edge profile**: V1 is mostly straight edges with subtle noise. If V2 looks too jagged/torn, lower `curtain.border.roughness` (try 0.02, 0.01, 0).
2. **Border thickness**: V1 default was 4px on a ~200-240px canvas. If V2 looks too thin, raise `curtain.border.thickness` (5, 6); too chunky, drop to 3.
3. **Ink texture inside the fill**: V1 had a moderate ink-texture stipple. If V2 looks flat/clean, raise `curtain.carving.intensity` (0.5, 0.6, 0.7); too noisy, drop (0.3, 0.2).

Tune one knob at a time in `theme/node/index.ts → defaultThemeConfig.stamp.curtain`. Vite HMR will rebuild on save; refresh the browser to re-trigger the curtain.

- [ ] **Step 3: Compare per-post seal to baseline**

Navigate to `/posts/hello`. Compare to `docs/superpowers/specs/_artifacts/seal-v1-stamp-hello.png`. Same three knobs apply, but tune the **top-level** `defaultThemeConfig.stamp.border / .carving` (not `.curtain`).

- [ ] **Step 4: Test at least two seal counts**

Visit `/posts/spring-rain` (2-column "润,无声") and `/posts/autumn-thoughts` (1-column "秋", custom color `#B8860B`). Confirm both render without distortion or missing characters.

- [ ] **Step 5: Stop the dev server**

- [ ] **Step 6: Commit tuned values (if any changed)**

If you changed `defaultThemeConfig.stamp.{border,carving,ink}` or `…curtain.{border,carving,ink}`:

```bash
git add theme/node/index.ts
git commit -m "$(cat <<'EOF'
chore(stamp): tune V2 curtain/per-post seal to match V1 visual baseline

Browser-verified against docs/superpowers/specs/_artifacts/seal-v1-*.png.
Adjusted border thickness/roughness and carving intensity in
defaultThemeConfig.stamp(.curtain) until the V2 silhouette and
edge profile read close to V1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Skip if no values changed.

---

## Task 10: SSG build sanity check

**Files:**
- None (verification only)

- [ ] **Step 1: Production build**

Run: `pnpm build`
Expected: build completes successfully. Watch the output for:
- `@jobinjia/shuimo-core/stamp-v2` resolved as an ES module (the linked dist exports it).
- No SSR-time call into `generateSealAsync` (it's `onMounted`-guarded and `typeof window` gated).
- No `Cannot find module 'fontkit'` or worker-related errors at build time.

If the build fails:
- `Cannot resolve '@jobinjia/shuimo-core/stamp-v2'`: confirm Pre-3 still passes and `pnpm install` was run after toggling the local link.
- SSR exception inside `generateSealAsync`: the `typeof window` guards in `useCurtainStamp.ts` and the `onMounted` in `ShuimoStamp.vue` are the existing pattern; verify both are intact.

- [ ] **Step 2: Verify SSG output references stamp-v2 chunk**

Run: `grep -r "stamp-v2" demo/dist/ 2>/dev/null | head -3`
Expected: at least one hit (a hashed chunk filename or a manifest reference). Confirms the V2 entry is in the production bundle.

- [ ] **Step 3: Final status check**

Run: `git status && git log --oneline -10`
Expected: working tree shows only the pre-existing local-link diffs (Pre-1). Recent commits include the spec, V1 screenshots, the schema/defaults/composable/component/App/SolarSeal commits, optionally a lint commit and a tuning commit.

---

## Done When

- [ ] All Pre-flight checks passed
- [ ] All Task 0-10 checkboxes ticked
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test --run`, `pnpm build` all pass on the new tip
- [ ] V2 curtain seal and per-post seal read visually close to the V1 baseline screenshots
- [ ] `demo/` is unchanged (`git diff --stat main demo/` is empty)
- [ ] `theme/composables/useStampFontWorker.ts` is unchanged
