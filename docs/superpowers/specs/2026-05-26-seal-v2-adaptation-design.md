# Seal V2 Adaptation — Design

Date: 2026-05-26
Scope: `theme/` package only (per CLAUDE.md memory: demo is a read-only consumer)
Trigger: `@jobinjia/shuimo-core` 2.0.x (local link) ships a new `stamp-v2` entry point with a restructured API. The current theme code targets the V1 `drawing` entry. This spec adapts the theme to V2 with a hard cut on legacy props, narrow back-compat aliases for the two field names that appear in the public config / demo frontmatter (`type` → `mode`, `shape: 'rectangle'` → `'rect'`).

## 1. API delta — V1 vs V2 (reference)

V1: `import { generateStampAsync, type StampOptions } from '@jobinjia/shuimo-core/drawing'` returns an SVG string.

V2: `import { generateSealAsync, type SealOptions } from '@jobinjia/shuimo-core/stamp-v2'` returns `SealResult = { svg?, canvas?, width, height, seed, layers }`.

**Removed in V2** (will be dropped from theme surface): `fontFamily`, `fontWeight`, `fontSize`, `borderScale`, `borderScaleX`, `borderScaleY`, `columnSpacing`, `characterSpacing`, `paddingX`, `paddingY`, `columnSpacingPx`, `characterSpacingPx`, `paddingXPx`, `paddingYPx`, `noiseAmountPx`, `borderPointsPx`, `cornerRadiusPx`, `borderWidthPx`, `regularShape`, `textCarving`.

**Renamed / restructured**:

| V1 | V2 |
|---|---|
| `type: 'yin'\|'yang'` | `mode: 'yin'\|'yang'` |
| `shape: 'rectangle'` (et al, flat string) | `shape: SealShape` (judgement union, `{ kind: 'rect' }` etc.) |
| `color` | `ink.color` |
| `fontUrl` | `font` (SealFontInput = URL string / ArrayBuffer / Uint8Array) |
| `fontWorker` | `fontWorker` (unchanged; same `@jobinjia/shuimo-core/stamp/font-worker` protocol) |
| `cornerRadiusPx` | `border.cornerRadius` |
| `borderWidthPx` | `border.thickness` |
| `regularShape: true` | `border.corner: 'round'` + `border.roughness: 0` |
| `columnSpacingPx` | `layout.columnGap` |
| `characterSpacingPx` | `layout.rowGap` |
| `paddingXPx` / `paddingYPx` | `layout.padding` (single axis only) |
| `offsetX` / `offsetY` | `layout.offsetX` / `layout.offsetY` |

**New optional in V2** (exposed to theme config):

- `script: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'` — glyph geometry baseline
- `shape: { kind: 'polygon', sides, orientation }` — hex/octagon seals
- `notch: { strategy, charIndex?, strokeHint?, jitter? }`
- `ink: { density?, bleed?, grain?, aging? }`
- `carving: { intensity?, breakage? }`
- `pressing: { rotate?, pressure?, partialLoss?, offset? }`
- `layout: { stretch?, gap?, padding?, direction?, columns? }`
- `border: { roughness?, corner: 'none'|'round'|'stone' }`

## 2. Affected files

| File | Change |
|---|---|
| `theme/types/index.d.ts` | Rewrite `stamp` / `stamp.nav` / `stamp.curtain` to V2 schema (see §3). |
| `theme/node/index.ts` | Rewrite `defaultThemeConfig.stamp` defaults; preserve current visual feel. |
| `theme/components/ShuimoStamp.vue` | Re-declare props, import `stamp-v2`, `buildSealOptions` helper, `shape` → V2 union, read `result.svg`. |
| `theme/composables/useCurtainStamp.ts` | Same surface migration; preserve singleton SVG + ID rewrite behavior. |
| `theme/components/ShuimoSolarSeal.vue` | Drop `:font-family="titleFont"` (V2 has no `fontFamily`); rest unchanged. |
| `theme/App.vue` | Drop `curtainStampFont` computed and the `fontFamily:` field it feeds into `curtainStampProps`. |
| `theme/composables/useStampFontWorker.ts` | **No change.** V2's `SealOptions.fontWorker` reuses the same worker entry `@jobinjia/shuimo-core/stamp/font-worker`. |

Demo (`demo/pages/posts/hello.md` etc.) is not edited. Compatibility for its existing frontmatter is provided by the back-compat aliases below.

## 3. New `ThemeConfig.stamp` schema

```ts
stamp: Partial<{
  enable: boolean                    // @default true
  author: string                     // seal text — kept name for back-compat; passed to V2 as `text`
  mode: 'yin' | 'yang'               // @default 'yang' — was `type`
  /** @deprecated use `mode` */
  type?: 'yin' | 'yang'              // back-compat alias; if both set, `mode` wins
  shape:                             // @default 'rect'
    | 'auto' | 'square' | 'rect' | 'rectangle'   // 'rectangle' is a deprecated alias for 'rect'
    | 'circle' | 'ellipse' | 'polygon'
  polygonSides?: number              // only used when shape === 'polygon'; @default 6
  polygonOrientation?: 'flat-top' | 'point-top'   // @default 'flat-top'
  script?: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'
  color: string                      // @default '#C8102E' → maps to ink.color
  seed: number                       // @default 69706
  size: number                       // both V2 canvas size AND container max-width
  offsetX: number                    // @default 0
  offsetY: number                    // @default 0
  padding?: number                   // → layout.padding
  gap?: number                       // → layout.gap (shared row + column)
  columnGap?: number                 // → layout.columnGap
  rowGap?: number                    // → layout.rowGap
  stretch?: boolean                  // → layout.stretch
  border?: Partial<{
    thickness: number                // → border.thickness
    cornerRadius: number             // → border.cornerRadius
    corner: 'none' | 'round' | 'stone'
    roughness: number                // 0..1
  }>
  carving?: Partial<{ intensity: number; breakage: number }>
  ink?: Partial<{ density: number; bleed: number; grain: number; aging: number }>
  notch?: { strategy: 'auto' | 'manual' | 'none'; charIndex?: number; strokeHint?: 'longest' | 'nearest'; jitter?: number }
  pressing?: Partial<{ rotate: number; pressure: number; partialLoss: number; offset: [number, number] }>

  nav: Partial<{
    mode: 'yin' | 'yang'
    /** @deprecated use `mode` */
    type?: 'yin' | 'yang'
    shape: 'auto' | 'square' | 'rect' | 'rectangle' | 'circle' | 'ellipse' | 'polygon'
    polygonSides?: number
    polygonOrientation?: 'flat-top' | 'point-top'
    showIcon: boolean
    mobileSize: number
    desktopSize: number
  }>

  curtain: Partial<{   // independent — does NOT inherit `stamp.*`
    author: string
    color: string
    mode: 'yin' | 'yang'
    /** @deprecated */ type?: 'yin' | 'yang'
    shape: 'auto' | 'square' | 'rect' | 'rectangle' | 'circle' | 'ellipse' | 'polygon'
    polygonSides?: number
    polygonOrientation?: 'flat-top' | 'point-top'
    script?: 'jinwen' | 'dazhuan' | 'xiaozhuan' | 'jiudiezhuan' | 'custom'
    seed: number
    size: number
    offsetX: number
    offsetY: number
    padding?: number
    gap?: number
    columnGap?: number
    rowGap?: number
    stretch?: boolean
    border?: Partial<{ thickness: number; cornerRadius: number; corner: 'none'|'round'|'stone'; roughness: number }>
    carving?: Partial<{ intensity: number; breakage: number }>
    ink?: Partial<{ density: number; bleed: number; grain: number; aging: number }>
    notch?: { strategy: 'auto'|'manual'|'none'; charIndex?: number; strokeHint?: 'longest'|'nearest'; jitter?: number }
    pressing?: Partial<{ rotate: number; pressure: number; partialLoss: number; offset: [number, number] }>
  }>
}>
```

## 4. Back-compat aliases (narrow surface)

Only **two** legacy field names are honored as aliases — everything else from V1 is hard-deleted:

1. `type` → `mode` (because demo + blog frontmatter use `type`).
2. `shape: 'rectangle'` → `{ kind: 'rect' }` (because demo `hello.md` uses `rectangle`).

Implementation lives **inside the option builder** (single mapping function in `ShuimoStamp.vue` and `useCurtainStamp.ts`); the public TS type declares both names so user code doesn't fail typechecking, but `mode` and `'rect'` are the canonical forms in defaults and docs.

No runtime deprecation warning is emitted (per user decision: avoid noise).

Other V1 props that disappear (`fontSize` / `textCarving` / `borderScale*` / etc.) are not declared and will fall through to Vue's `$attrs` as inert HTML attributes on the root `<div>`. Cosmetic only; no functional break. Demo's `hello.md` ships four such fields; we accept the noise rather than edit demo.

## 5. Internal mapping (`buildSealOptions`)

```ts
function mapShape(s: ShapeStr, sides?: number, orient?: 'flat-top'|'point-top'): SealShape {
  switch (s) {
    case 'rectangle': return { kind: 'rect' }
    case 'polygon':   return { kind: 'polygon', sides: sides ?? 6, orientation: orient ?? 'flat-top' }
    case 'auto':      return { kind: 'auto' }
    case 'square':    return { kind: 'square' }
    case 'rect':      return { kind: 'rect' }
    case 'circle':    return { kind: 'circle' }
    case 'ellipse':   return { kind: 'ellipse' }
  }
}

function buildSealOptions(p: Props): SealOptions {
  const opts: SealOptions = {
    text: parseStampText(p.author ?? p.text),
    size: p.size,
    mode: p.mode ?? p.type ?? 'yang',
    shape: mapShape(p.shape ?? 'rect', p.polygonSides, p.polygonOrientation),
    seed: p.seed ?? 69706,
    font: yishanFontUrl,
    fontWorker: getStampFontWorker() ?? undefined,
    ink:    { color: p.color || themeConfig.value?.colors?.stamp || '#C8102E',
              ...(p.ink ?? {}) },
    border: p.border,
    carving: p.carving,
    layout: pruneUndefined({
      offsetX:   p.offsetX,
      offsetY:   p.offsetY,
      padding:   p.padding,
      gap:       p.gap,
      columnGap: p.columnGap,
      rowGap:    p.rowGap,
      stretch:   p.stretch,
    }),
    notch:    p.notch,
    pressing: p.pressing,
    script:   p.script,
  }
  return opts
}
```

Notes:

- `pruneUndefined` is a small inline helper added to both files: strips keys whose value is `undefined`, returns `undefined` when the resulting object would be empty so V2 falls through to its own layout defaults instead of receiving `layout: {}`.
- `ink.color` always set (since theme has a default seal color); other ink fields only if user provided.
- `border` / `carving` / `notch` / `pressing` only forwarded when user supplied them — never construct empty.
- Legacy V1 fields that the demo frontmatter still ships (`fontSize`, `textCarving`, `borderScale`, `borderScaleY`) are not declared as props and not read by `buildSealOptions`. With Vue 3's type-only `defineProps`, undeclared keys silently land in `$attrs` and get rendered as HTML attributes on the chosen root `<div>` (a `v-if/v-else-if` chain still inherits $attrs). No dev warning, no functional break — cosmetic noise only. Acceptable per the demo read-only boundary.

Then in render:

```ts
const result = await generateSealAsync(buildSealOptions(props))
let svg = result.svg ?? ''
if (svg) {
  svg = svg
    .replace(/stamp-ink-texture/g,    `stamp-ink-texture-${stampUid}`)
    .replace(/stamp-border-texture/g, `stamp-border-texture-${stampUid}`)
    .replace(/stamp-text-texture/g,   `stamp-text-texture-${stampUid}`)
}
stampSvg.value = svg
```

The old `result.toDataURL` branch is removed — V2 only returns canvas when `output.format` is `'canvas'`/`'both'`, which we don't set.

## 6. Default config values

`defaultThemeConfig.stamp` rewritten:

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
    mode: 'yang',
    shape: 'rect',
    seed: 69706,
    size: 200,           // baseline; App.vue still computes dynamic size from text length
    border: { thickness: 4, cornerRadius: 10, corner: 'round', roughness: 0.05 },
    carving: { intensity: 0.4 },
    ink: { bleed: 1.0 },
  },
},
```

Removed default fields (no longer in schema): `fontFamily`, `fontSize`, `fontWeight`, `textCarving`, `borderScale`, `columnSpacingPx`, `characterSpacingPx`, `paddingXPx`, `paddingYPx`, `borderScaleX`, `borderScaleY`, `noiseAmountPx`, `borderPointsPx`, `cornerRadiusPx`, `borderWidthPx`, `regularShape`.

## 7. Curtain visual-match plan

The V1 curtain seal uses `regularShape: true / borderWidthPx: 4 / cornerRadiusPx: 10 / noiseAmountPx: 10 / textCarving: 'normal'`. The V2 candidate parameter set is:

```ts
border:  { thickness: 4, cornerRadius: 10, corner: 'round', roughness: 0.05 }
carving: { intensity: 0.4 }
ink:     { bleed: 1.0 }
```

Acceptance check (must run before claiming done):

1. **Before any code change** — start the V1 dev server (`pnpm dev` on `main`), screenshot the curtain seal (both the desktop left/right pair and the 4-column author seal). Save under `docs/superpowers/specs/_artifacts/seal-v1-curtain.png` and `_artifacts/seal-v1-stamp.png`. These are the visual reference for §7 step 3.
2. After implementation: `pnpm dev`, open the URL the valaxy CLI prints, and load the home route.
3. Compare against the V1 screenshots from step 1.
4. Tune three knobs (`border.thickness`, `border.roughness`, `carving.intensity`) until the V2 seal reads as the "same regular-with-edge-noise" silhouette. Wide visual divergence (very rough edges, distorted glyphs, missing 朱文/白文 contrast) means stop and revisit.
5. Verify on at least two seal counts: short (1-column "墨") and the default 4-column "受命,于天,既寿,永昌".

If visual match cannot be achieved with the V2 surface alone, fall back to filing a question for shuimo-core rather than reaching into the underlying library (per CLAUDE.md memory: `feedback_shuimo_core_boundary`).

## 8. Migration steps (numbered, for the implementation plan)

0. **Visual baseline first**: with the working tree clean on `main`, run `pnpm dev` and capture V1 screenshots per §7 step 1 into `docs/superpowers/specs/_artifacts/`.
1. Update `theme/types/index.d.ts` — rewrite `stamp / stamp.nav / stamp.curtain` per §3.
2. Update `theme/node/index.ts` — replace `defaultThemeConfig.stamp` per §6.
3. Rewrite `theme/composables/useCurtainStamp.ts` — import `stamp-v2`, new `buildSealOptions`, read `result.svg`, drop V1-only prop wiring.
4. Rewrite `theme/components/ShuimoStamp.vue` — new prop list, import `stamp-v2`, new `buildSealOptions`, read `result.svg`, drop `toDataURL` branch, drop V1-only props from the `watch` array.
5. Update `theme/App.vue` — drop `curtainStampFont` computed and the `fontFamily:` field in `curtainStampProps`.
6. Update `theme/components/ShuimoSolarSeal.vue` — remove `:font-family` binding line.
7. Run `pnpm typecheck` — must pass.
8. Run `pnpm dev` and execute the §7 acceptance check.
9. Run `pnpm lint`.
10. Run `pnpm build` to ensure SSR/SSG paths still resolve `stamp-v2`.

## 9. Risk / out-of-scope

- **Not in scope**: editing `demo/` (`hello.md` keeps its inert V1 fields), bumping the catalog version of `@jobinjia/shuimo-core` (still 2.0.2 in catalog; local link via `pnpm-workspace.yaml` overrides is the dev path per memory `project_shuimo_core_local_link`).
- **Risk: catalog version**. Before publishing the theme, the catalog `@jobinjia/shuimo-core` version must reach a release that exports `stamp-v2`. If 2.0.2 already does (it does, dist files confirm), nothing to do; otherwise bump the peer dep range. **Action**: verify `2.0.2` published artifact carries `dist/stamp-v2.mjs` before any `pnpm release`.
- **Risk: blog repo**. Per `project_blog_consumes_npm_theme`, the user's blog installs the **npm** theme. Any new V2 frontmatter fields (`mode`, `polygonSides`, `border.thickness`, etc.) only become usable once a theme version with this adaptation is published. `type` and `shape: rectangle` continue to work via aliases — so existing blog frontmatter does not break on upgrade.
- **Risk: SSR**. `generateSealAsync` is browser-only (uses `fetch` / Worker / `getBBox`). Existing code already guards with `if (typeof window !== 'undefined')` in `useCurtainStamp.ts` and uses `onMounted` in `ShuimoStamp.vue`. Migration preserves both guards.

## 10. Non-goals

- New seal designs for individual posts. (Frontmatter can already opt into V2 features like `script: 'jiudiezhuan'`; demo updates are left to the user.)
- Performance refactor. The existing `useStampFontWorker` + shared-singleton-SVG-for-curtain optimizations are preserved verbatim.
- Exposing the V2 `output.format / output.pixelRatio` or the `layers` result split. Default `svg` is sufficient for the current use case.
