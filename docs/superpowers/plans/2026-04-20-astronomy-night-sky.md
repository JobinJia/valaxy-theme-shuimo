# Astronomy Night Sky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark-mode night sky to Hero pages — moon position + real lunar phase driven by `suncalc`, plus ink-wash mist/stars/vignette. Default to blogger coordinates (Chongqing) with optional visitor override.

**Architecture:** A new `ShuimoNightSky` component mounts inside `ShuimoHeroLandscape` only in dark mode. It composes 5 layers (bg, vignette, mist, stars, `ShuimoMoon`). Existing mountain SVG sits above the night sky in z-order, naturally producing "moon rises behind the ridge". A singleton `useAstronomy` composable provides reactive `{x, y, hidden, phaseName, ...}` derived from `suncalc` + `@shuimo-design/lunar`, refreshed every 60 s.

**Tech Stack:** Vue 3 (`<script setup>`) · Vitest · `suncalc` (~7 KB) · `@shuimo-design/lunar` (already in deps) · SVG + CSS (no Canvas).

**Spec:** `docs/superpowers/specs/2026-04-20-astronomy-night-sky-design.md`

---

## Task 1: Add `suncalc` dependency

**Files:**
- Modify: `pnpm-workspace.yaml` (catalog)
- Modify: `theme/package.json` (theme deps)

- [ ] **Step 1: Add `suncalc` to the workspace catalog**

Edit `pnpm-workspace.yaml`. Insert under the `catalog:` key, alphabetical order between `'@shuimo-design/lunar'` and `'@unocss/eslint-plugin'`:

```yaml
  suncalc: ^1.9.0
```

- [ ] **Step 2: Reference the catalog version in `theme/package.json`**

Edit `theme/package.json` `dependencies` block to add (alphabetical order):

```json
  "dependencies": {
    "@iconify-json/ant-design": "catalog:",
    "@iconify-json/simple-icons": "catalog:",
    "@shuimo-design/lunar": "catalog:",
    "suncalc": "catalog:"
  },
```

- [ ] **Step 3: Install**

Run from repo root:
```bash
pnpm install
```
Expected: install completes; `theme/node_modules/suncalc/` exists.

- [ ] **Step 4: Add `@types/suncalc` as devDependency in theme**

`suncalc` ships no types. Add `@types/suncalc` to the catalog and to theme devDeps:

`pnpm-workspace.yaml` (under `catalog:`):
```yaml
  '@types/suncalc': ^1.9.2
```

`theme/package.json` (`devDependencies`):
```json
  "devDependencies": {
    "@types/suncalc": "catalog:",
    "valaxy": "catalog:"
  }
```

Then re-run `pnpm install`.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml theme/package.json pnpm-lock.yaml
git commit -m "build(deps): add suncalc for astronomy night sky"
```

---

## Task 2: Extend `ThemeConfig` with `astronomy` block

**Files:**
- Modify: `theme/types/index.d.ts`

- [ ] **Step 1: Append new `astronomy` field to `ThemeConfig` interface**

Add immediately before the closing `}` of `ThemeConfig` (after the `imageCaption` field):

```ts
  /** 天文驱动的暗色夜空（仅 dark mode 生效，且仅在显示 Hero 的页面） */
  astronomy: Partial<{
    /** 总开关 @default true */
    enable: boolean

    /** 博主默认坐标。未设置时兜底 = 重庆 N29.56° E106.55° */
    location: {
      lat: number
      lng: number
      /** 可选，仅用于 hover 提示展示。不填时显示原始坐标。
       *  TODO: 后续接入反向地理编码自动获取 */
      name?: string
    }

    /** 是否允许访客切换到自己的位置 @default true */
    allowVisitorOverride: boolean

    /** 各视觉层独立开关 */
    layers: Partial<{
      moon: boolean
      stars: boolean
      mist: boolean
      vignette: boolean
    }>

    /** 月亮调节 */
    moon: Partial<{
      /** 月亮直径 px @default 70 */
      size: number
      /** 月相是否随纬度倾斜 @default true */
      tiltByLatitude: boolean
    }>

    /** 星点调节 */
    stars: Partial<{
      /** 星点数量 @default 16 */
      count: number
      /** 是否随月相联动（月明星稀） @default true */
      moonLinked: boolean
    }>

    /** 烟雾调节 */
    mist: Partial<{
      /** 烟雾透明度 @default 0.12 */
      opacity: number
      /** 漂移周期秒 @default 120 */
      driftDuration: number
    }>
  }>
```

- [ ] **Step 2: Typecheck**

Run from repo root:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add theme/types/index.d.ts
git commit -m "feat(types): add astronomy config to ThemeConfig"
```

---

## Task 3: Default config for `astronomy`

**Files:**
- Modify: `theme/node/index.ts`

- [ ] **Step 1: Insert default `astronomy` block in `defaultThemeConfig`**

Insert before `preface: {}` at the end of the config object:

```ts
  astronomy: {
    enable: true,
    location: { lat: 29.56, lng: 106.55, name: '重庆' },
    allowVisitorOverride: true,
    layers: { moon: true, stars: true, mist: true, vignette: true },
    moon: { size: 70, tiltByLatitude: true },
    stars: { count: 16, moonLinked: true },
    mist: { opacity: 0.12, driftDuration: 120 },
  },
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add theme/node/index.ts
git commit -m "feat(node): default astronomy config (Chongqing fallback)"
```

---

## Task 4: i18n strings

**Files:**
- Modify: `theme/locales/zh-CN.yml`
- Modify: `theme/locales/en.yml`

- [ ] **Step 1: Append astronomy keys to `zh-CN.yml`**

Add at the end of the `shuimo:` block (preserve indentation = 2 spaces):

```yaml
  astronomy:
    phase:
      new: 朔
      waxing_crescent: 蛾眉
      first_quarter: 上弦
      waxing_gibbous: 渐盈凸
      full: 望
      waning_gibbous: 渐亏凸
      last_quarter: 下弦
      waning_crescent: 残月
    label_phase: '月相：{name}'
    switch_to_my_location: 切换到我所在地
    restore_blogger_view: 还原博主视角
    location_failed: 无法获取位置，已保留博主视角
    locating: 正在获取位置…
```

- [ ] **Step 2: Append astronomy keys to `en.yml`**

```yaml
  astronomy:
    phase:
      new: New Moon
      waxing_crescent: Waxing Crescent
      first_quarter: First Quarter
      waxing_gibbous: Waxing Gibbous
      full: Full Moon
      waning_gibbous: Waning Gibbous
      last_quarter: Last Quarter
      waning_crescent: Waning Crescent
    label_phase: 'Phase: {name}'
    switch_to_my_location: Use my location
    restore_blogger_view: Restore default
    location_failed: Could not get location; staying on default view.
    locating: Locating…
```

- [ ] **Step 3: Commit**

```bash
git add theme/locales/zh-CN.yml theme/locales/en.yml
git commit -m "i18n(astronomy): add phase names and tooltip strings"
```

---

## Task 5: Pure utility — coordinate mapping (`astronomy.ts`)

**Files:**
- Create: `theme/composables/astronomy.ts`
- Test: `theme/composables/astronomy.test.ts`

The pure utilities are split conceptually but live in one file: coordinate mapping, location parsing, moon shadow path. We TDD them in three tasks (5/6/7), each adding code to the same file.

- [ ] **Step 1: Write failing tests for `moonScreenPos`**

Create `theme/composables/astronomy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { moonScreenPos } from './astronomy'

const D2R = Math.PI / 180

describe('moonScreenPos', () => {
  it('hides moon when altitude is below the horizon', () => {
    const pos = moonScreenPos(-5 * D2R, 0, 30)
    expect(pos.hidden).toBe(true)
  })

  it('places moon at south-center when azimuth=0 (suncalc south=0)', () => {
    const pos = moonScreenPos(30 * D2R, 0, 30)
    expect(pos.hidden).toBe(false)
    expect(pos.x).toBeCloseTo(50, 1)
  })

  it('places moon to the right (east) when azimuth is negative', () => {
    const pos = moonScreenPos(20 * D2R, -60 * D2R, 30)
    expect(pos.x).toBeGreaterThan(50)
  })

  it('places moon to the left (west) when azimuth is positive', () => {
    const pos = moonScreenPos(20 * D2R, 60 * D2R, 30)
    expect(pos.x).toBeLessThan(50)
  })

  it('mirrors X for southern-hemisphere observers', () => {
    const north = moonScreenPos(20 * D2R, -60 * D2R, 30)
    const south = moonScreenPos(20 * D2R, -60 * D2R, -30)
    expect(north.x + south.x).toBeCloseTo(100, 1)
  })

  it('places moon higher (smaller y) for higher altitudes', () => {
    const low = moonScreenPos(5 * D2R, 0, 30)
    const high = moonScreenPos(50 * D2R, 0, 30)
    expect(high.y).toBeLessThan(low.y)
  })

  it('clamps azimuth outside [-90°, 90°] to the nearest edge', () => {
    const farEast = moonScreenPos(20 * D2R, -120 * D2R, 30)
    const justEast = moonScreenPos(20 * D2R, -90 * D2R, 30)
    expect(farEast.x).toBeCloseTo(justEast.x, 1)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: all FAIL with `Cannot find module './astronomy'` or similar.

- [ ] **Step 3: Implement `moonScreenPos` in `theme/composables/astronomy.ts`**

Create the file:

```ts
/**
 * Pure utilities for astronomy-driven night sky.
 *
 * suncalc convention:
 *   - altitude: radians, positive above horizon
 *   - azimuth:  radians, measured from south, positive west, negative east
 *
 * Screen convention here:
 *   - x: 0–100 (% of container width)
 *   - y: 0–100 (% of container height; 0 = top)
 */

const R2D = 180 / Math.PI

export interface ScreenPos {
  x: number
  y: number
  hidden: boolean
}

/**
 * Map (altitude, azimuth) → screen position inside Hero.
 * Northern-hemisphere observer faces south; southern-hemisphere mirrored.
 */
export function moonScreenPos(altitudeRad: number, azimuthRad: number, lat: number): ScreenPos {
  if (altitudeRad <= 0)
    return { x: 0, y: 0, hidden: true }

  const azDeg = Math.max(-90, Math.min(90, azimuthRad * R2D))
  // azDeg = -90 → east → x = 100
  // azDeg =   0 → south → x = 50
  // azDeg = +90 → west → x = 0
  let xPct = 50 - (azDeg / 90) * 50

  if (lat < 0)
    xPct = 100 - xPct

  // Altitude curve: 0° → bottom of sky band (y=65), 60°+ → top (y=15)
  const altDeg = Math.min(60, altitudeRad * R2D)
  const yPct = 65 - 50 * Math.sqrt(altDeg / 60)

  return { x: xPct, y: yPct, hidden: false }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/composables/astronomy.ts theme/composables/astronomy.test.ts
git commit -m "feat(astronomy): coordinate mapping (alt/az → screen %)"
```

---

## Task 6: Pure utility — location resolution

**Files:**
- Modify: `theme/composables/astronomy.ts`
- Modify: `theme/composables/astronomy.test.ts`

- [ ] **Step 1: Write failing tests for location parsing**

Append to `theme/composables/astronomy.test.ts`:

```ts
import {
  FALLBACK_LOCATION,
  parseLocationFromUrl,
  readLocationOverride,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'
import { afterEach, beforeEach } from 'vitest'

describe('parseLocationFromUrl', () => {
  it('parses well-formed lat,lng', () => {
    expect(parseLocationFromUrl('?loc=29.56,106.55')).toEqual({ lat: 29.56, lng: 106.55 })
  })

  it('returns null for missing param', () => {
    expect(parseLocationFromUrl('')).toBeNull()
    expect(parseLocationFromUrl('?other=1')).toBeNull()
  })

  it('returns null for non-numeric / out-of-range values', () => {
    expect(parseLocationFromUrl('?loc=abc,123')).toBeNull()
    expect(parseLocationFromUrl('?loc=99,0')).toBeNull()
    expect(parseLocationFromUrl('?loc=0,200')).toBeNull()
  })

  it('tolerates whitespace and signs', () => {
    expect(parseLocationFromUrl('?loc= -30 , -75 ')).toEqual({ lat: -30, lng: -75 })
  })
})

describe('localStorage override', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a location', () => {
    writeLocationOverride({ lat: 1, lng: 2 })
    expect(readLocationOverride()).toEqual({ lat: 1, lng: 2 })
  })

  it('writeLocationOverride(null) clears the override', () => {
    writeLocationOverride({ lat: 1, lng: 2 })
    writeLocationOverride(null)
    expect(readLocationOverride()).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem('shuimo:astronomy:override', '{not json')
    expect(readLocationOverride()).toBeNull()
  })
})

describe('resolveLocation priority', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('URL beats localStorage beats config beats fallback', () => {
    writeLocationOverride({ lat: 10, lng: 20 })
    const out = resolveLocation({
      configLocation: { lat: 30, lng: 40 },
      allowVisitorOverride: true,
      search: '?loc=50,60',
    })
    expect(out).toEqual({ lat: 50, lng: 60 })
  })

  it('localStorage used when URL absent', () => {
    writeLocationOverride({ lat: 10, lng: 20 })
    const out = resolveLocation({
      configLocation: { lat: 30, lng: 40 },
      allowVisitorOverride: true,
      search: '',
    })
    expect(out).toEqual({ lat: 10, lng: 20 })
  })

  it('config used when URL + localStorage absent', () => {
    const out = resolveLocation({
      configLocation: { lat: 30, lng: 40, name: '杭州' },
      allowVisitorOverride: true,
      search: '',
    })
    expect(out).toEqual({ lat: 30, lng: 40, name: '杭州' })
  })

  it('fallback (Chongqing) used when nothing is set', () => {
    const out = resolveLocation({ allowVisitorOverride: true, search: '' })
    expect(out).toEqual(FALLBACK_LOCATION)
  })

  it('skips URL + localStorage when allowVisitorOverride=false', () => {
    writeLocationOverride({ lat: 10, lng: 20 })
    const out = resolveLocation({
      configLocation: { lat: 30, lng: 40 },
      allowVisitorOverride: false,
      search: '?loc=50,60',
    })
    expect(out).toEqual({ lat: 30, lng: 40 })
  })
})
```

Vitest provides a JSDOM-like `localStorage` shim by default — confirm `vitest.config` (if present) uses `environment: 'jsdom'` or `'happy-dom'`. If tests run in `node` env, add a `// @vitest-environment jsdom` directive at the top of the test file.

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: location-related tests FAIL with missing exports.

- [ ] **Step 3: Implement location helpers in `astronomy.ts`**

Append to `theme/composables/astronomy.ts`:

```ts
export interface Location {
  lat: number
  lng: number
  name?: string
}

export const FALLBACK_LOCATION: Location = { lat: 29.56, lng: 106.55, name: '重庆' }
const STORAGE_KEY = 'shuimo:astronomy:override'

function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
}

export function parseLocationFromUrl(search: string): Location | null {
  if (!search)
    return null
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const raw = params.get('loc')
  if (!raw)
    return null
  const parts = raw.split(',').map(s => Number.parseFloat(s.trim()))
  if (parts.length !== 2)
    return null
  const [lat, lng] = parts
  if (!isValidLatLng(lat, lng))
    return null
  return { lat, lng }
}

export function readLocationOverride(): Location | null {
  if (typeof localStorage === 'undefined')
    return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw)
      return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object')
      return null
    if (!isValidLatLng(parsed.lat, parsed.lng))
      return null
    return { lat: parsed.lat, lng: parsed.lng }
  }
  catch {
    return null
  }
}

export function writeLocationOverride(loc: Location | null): void {
  if (typeof localStorage === 'undefined')
    return
  if (loc === null) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: loc.lat, lng: loc.lng }))
}

export function resolveLocation(opts: {
  configLocation?: Location
  allowVisitorOverride: boolean
  search?: string
}): Location {
  if (opts.allowVisitorOverride) {
    const fromUrl = parseLocationFromUrl(opts.search ?? '')
    if (fromUrl)
      return fromUrl
    const fromStorage = readLocationOverride()
    if (fromStorage)
      return fromStorage
  }
  return opts.configLocation ?? FALLBACK_LOCATION
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/composables/astronomy.ts theme/composables/astronomy.test.ts
git commit -m "feat(astronomy): location resolution (URL > storage > config > Chongqing)"
```

---

## Task 7: Pure utility — moon shadow SVG path

**Files:**
- Modify: `theme/composables/astronomy.ts`
- Modify: `theme/composables/astronomy.test.ts`

- [ ] **Step 1: Write failing tests for `moonShadowPath`**

Append to `theme/composables/astronomy.test.ts`:

```ts
import { moonShadowPath } from './astronomy'

describe('moonShadowPath', () => {
  it('returns a non-empty SVG path string', () => {
    const path = moonShadowPath(0.3, 50, 50, 30)
    expect(path).toMatch(/^M /)
    expect(path).toContain('Z')
  })

  it('shadow is a full disc at new moon (phase=0)', () => {
    // At phase=0 the terminator ellipse rx == R, so the shadow path
    // describes the entire moon disc.
    const path = moonShadowPath(0, 50, 50, 30)
    expect(path).toMatch(/A 30,30 /)
  })

  it('terminator becomes a vertical line at first quarter (phase=0.25)', () => {
    // At phase=0.25, cos(2π·0.25) = 0 → rx ≈ 0 → terminator is
    // the diameter (vertical line).
    const path = moonShadowPath(0.25, 50, 50, 30)
    expect(path).toMatch(/A 0,30 /)
  })

  it('different phases produce different paths', () => {
    const a = moonShadowPath(0.1, 50, 50, 30)
    const b = moonShadowPath(0.4, 50, 50, 30)
    expect(a).not.toEqual(b)
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: shadow tests FAIL.

- [ ] **Step 3: Implement `moonShadowPath` in `astronomy.ts`**

Append to `theme/composables/astronomy.ts`:

```ts
/**
 * Build the SVG path describing the unlit (shadow) portion of the moon disc
 * at a given lunar phase.
 *
 *   phase ∈ [0, 1):
 *     0      → new moon (full shadow)
 *     0.25   → first quarter, lit on right
 *     0.5    → full moon (no shadow)
 *     0.75   → last quarter, lit on left
 *
 * Standard 2-arc construction: half-circle of the dark side + half-ellipse
 * of width R·|cos(2π·phase)| acting as the terminator.
 */
export function moonShadowPath(phase: number, cx: number, cy: number, R: number): string {
  const cos = Math.cos(2 * Math.PI * phase)
  const rx = Math.abs(cos) * R

  // shadowOnLeft when phase ∈ [0, 0.5) (waxing → light grows from right)
  const shadowOnLeft = phase < 0.5

  // SVG arc sweep flag: 0 = ccw, 1 = cw.  Going from top (cx, cy-R) to
  // bottom (cx, cy+R) at center (cx, cy):
  //   sweep=1 traces the right side, sweep=0 traces the left.
  let outerSweep: 0 | 1
  let innerSweep: 0 | 1

  if (shadowOnLeft) {
    outerSweep = 0 // half-circle on the left
    innerSweep = cos >= 0 ? 0 : 1 // terminator extends right (more shadow) vs carves left (crescent)
  }
  else {
    outerSweep = 1 // half-circle on the right
    innerSweep = cos >= 0 ? 1 : 0
  }

  const top = `${cx},${cy - R}`
  const bot = `${cx},${cy + R}`
  return `M ${top} A ${R},${R} 0 0,${outerSweep} ${bot} A ${rx},${R} 0 0,${innerSweep} ${top} Z`
}
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/composables/astronomy.ts theme/composables/astronomy.test.ts
git commit -m "feat(astronomy): moon shadow SVG path generator"
```

---

## Task 8: `useMoonPhase` — Chinese phase name

**Files:**
- Create: `theme/composables/useMoonPhase.ts`
- Test: `theme/composables/useMoonPhase.test.ts`

- [ ] **Step 1: Write failing tests**

Create `theme/composables/useMoonPhase.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { moonPhaseI18nKey } from './useMoonPhase'

describe('moonPhaseI18nKey', () => {
  it.each([
    [0,    'new'],
    [0.02, 'new'],
    [0.1,  'waxing_crescent'],
    [0.25, 'first_quarter'],
    [0.4,  'waxing_gibbous'],
    [0.5,  'full'],
    [0.6,  'waning_gibbous'],
    [0.75, 'last_quarter'],
    [0.9,  'waning_crescent'],
    [0.99, 'waning_crescent'],
  ] as const)('phase=%s → %s', (phase, expected) => {
    expect(moonPhaseI18nKey(phase)).toBe(expected)
  })

  it('clamps phase ≥ 1 back to "new"', () => {
    expect(moonPhaseI18nKey(1)).toBe('new')
    expect(moonPhaseI18nKey(1.5)).toBe('new')
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test theme/composables/useMoonPhase.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `theme/composables/useMoonPhase.ts`:

```ts
export type MoonPhaseKey =
  | 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent'

interface PhaseRange {
  key: MoonPhaseKey
  /** [start, end) of suncalc.phase ∈ [0, 1) */
  range: [number, number]
}

const PHASES: PhaseRange[] = [
  { key: 'new',              range: [0,    0.04] },
  { key: 'waxing_crescent',  range: [0.04, 0.22] },
  { key: 'first_quarter',    range: [0.22, 0.28] },
  { key: 'waxing_gibbous',   range: [0.28, 0.47] },
  { key: 'full',             range: [0.47, 0.53] },
  { key: 'waning_gibbous',   range: [0.53, 0.72] },
  { key: 'last_quarter',     range: [0.72, 0.78] },
  { key: 'waning_crescent',  range: [0.78, 1] },
]

/** Map suncalc `illumination.phase` (0..1) to an i18n key. */
export function moonPhaseI18nKey(phase: number): MoonPhaseKey {
  const p = ((phase % 1) + 1) % 1 // wrap into [0, 1)
  for (const { key, range } of PHASES) {
    if (p >= range[0] && p < range[1])
      return key
  }
  return 'new'
}
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test theme/composables/useMoonPhase.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/composables/useMoonPhase.ts theme/composables/useMoonPhase.test.ts
git commit -m "feat(astronomy): moonPhaseI18nKey (suncalc.phase → i18n key)"
```

---

## Task 9: `useAstronomy` composable

**Files:**
- Create: `theme/composables/useAstronomy.ts`
- Test: `theme/composables/useAstronomy.test.ts`

The composable provides reactive `{x, y, hidden, phase, illumination, parallacticAngle, location}` from a singleton 60 s-refreshed source. Tests use `vi.useFakeTimers` + a mocked `suncalc` module.

- [ ] **Step 1: Write failing tests**

Create `theme/composables/useAstronomy.test.ts`:

```ts
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

vi.mock('suncalc', () => ({
  default: {
    getMoonPosition: vi.fn(() => ({
      altitude: 0.5, azimuth: 0, distance: 384000, parallacticAngle: 0,
    })),
    getMoonIllumination: vi.fn(() => ({ fraction: 0.5, phase: 0.25, angle: 0 })),
  },
}))

import suncalc from 'suncalc'
import { useAstronomy, _resetAstronomyForTests } from './useAstronomy'

describe('useAstronomy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T22:00:00+08:00'))
    localStorage.clear()
    _resetAstronomyForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('exposes a reactive state with screen pos + phase key', () => {
    const { state } = useAstronomy({
      configLocation: { lat: 29.56, lng: 106.55, name: '重庆' },
      allowVisitorOverride: true,
    })
    expect(state.value.hidden).toBe(false)
    expect(state.value.phaseKey).toBe('first_quarter')
    expect(state.value.location.lat).toBe(29.56)
  })

  it('refreshes once per 60 s tick', async () => {
    useAstronomy({ allowVisitorOverride: true })
    const initialCalls = (suncalc.getMoonPosition as any).mock.calls.length

    vi.advanceTimersByTime(60_000)
    await nextTick()

    expect((suncalc.getMoonPosition as any).mock.calls.length).toBe(initialCalls + 1)
  })

  it('shares one interval across multiple subscribers', async () => {
    useAstronomy({ allowVisitorOverride: true })
    useAstronomy({ allowVisitorOverride: true })
    const before = (suncalc.getMoonPosition as any).mock.calls.length

    vi.advanceTimersByTime(60_000)
    await nextTick()

    // Only one extra call across both subscribers
    expect((suncalc.getMoonPosition as any).mock.calls.length).toBe(before + 1)
  })

  it('setVisitorLocation updates location and persists to localStorage', async () => {
    const { state, setVisitorLocation } = useAstronomy({
      configLocation: { lat: 29.56, lng: 106.55 },
      allowVisitorOverride: true,
    })
    setVisitorLocation({ lat: 30.27, lng: 120.15 })
    await nextTick()

    expect(state.value.location.lat).toBe(30.27)
    expect(localStorage.getItem('shuimo:astronomy:override'))
      .toBe(JSON.stringify({ lat: 30.27, lng: 120.15 }))
  })

  it('clearVisitorOverride restores blogger location', async () => {
    const { state, setVisitorLocation, clearVisitorOverride } = useAstronomy({
      configLocation: { lat: 29.56, lng: 106.55 },
      allowVisitorOverride: true,
    })
    setVisitorLocation({ lat: 1, lng: 2 })
    await nextTick()
    clearVisitorOverride()
    await nextTick()

    expect(state.value.location.lat).toBe(29.56)
    expect(localStorage.getItem('shuimo:astronomy:override')).toBeNull()
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test theme/composables/useAstronomy.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement composable**

Create `theme/composables/useAstronomy.ts`:

```ts
import suncalc from 'suncalc'
import { computed, onUnmounted, ref } from 'vue'
import type { ComputedRef } from 'vue'
import {
  FALLBACK_LOCATION,
  type Location,
  moonScreenPos,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'
import { getTimeOfDay } from './useSolarTerm'
import { type MoonPhaseKey, moonPhaseI18nKey } from './useMoonPhase'

const REFRESH_MS = 60_000

export interface AstronomyOptions {
  configLocation?: Location
  allowVisitorOverride?: boolean
}

export interface AstronomyState {
  location: Location
  hidden: boolean
  x: number          // % of width
  y: number          // % of height
  illumination: number // 0..1
  phase: number        // 0..1
  phaseKey: MoonPhaseKey
  parallacticAngleDeg: number
  shichen: string      // 子 / 丑 / 寅 / ...
  updatedAt: number
}

/* ---------- module-level singleton state ---------- */
let intervalId: ReturnType<typeof setInterval> | null = null
let subscriberCount = 0
let currentOptions: Required<AstronomyOptions> = {
  configLocation: FALLBACK_LOCATION,
  allowVisitorOverride: true,
}
const stateRef = ref<AstronomyState>(compute(currentOptions))

function compute(opts: Required<AstronomyOptions>): AstronomyState {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const location = resolveLocation({
    configLocation: opts.configLocation,
    allowVisitorOverride: opts.allowVisitorOverride,
    search,
  })
  const now = new Date()
  const pos = suncalc.getMoonPosition(now, location.lat, location.lng)
  const illum = suncalc.getMoonIllumination(now)
  const screen = moonScreenPos(pos.altitude, pos.azimuth, location.lat)

  return {
    location,
    hidden: screen.hidden,
    x: screen.x,
    y: screen.y,
    illumination: illum.fraction,
    phase: illum.phase,
    phaseKey: moonPhaseI18nKey(illum.phase),
    parallacticAngleDeg: pos.parallacticAngle * (180 / Math.PI),
    shichen: getTimeOfDay(now).shichen,
    updatedAt: now.getTime(),
  }
}

function refresh() {
  stateRef.value = compute(currentOptions)
}

/** TEST-ONLY: reset singleton between tests. */
export function _resetAstronomyForTests() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  subscriberCount = 0
  currentOptions = {
    configLocation: FALLBACK_LOCATION,
    allowVisitorOverride: true,
  }
  stateRef.value = compute(currentOptions)
}

/* ---------- public composable ---------- */

export function useAstronomy(opts: AstronomyOptions = {}): {
  state: ComputedRef<AstronomyState>
  setVisitorLocation: (loc: Location) => void
  clearVisitorOverride: () => void
} {
  // Most-recent caller wins for option merging — intentional & simple.
  currentOptions = {
    configLocation: opts.configLocation ?? currentOptions.configLocation ?? FALLBACK_LOCATION,
    allowVisitorOverride: opts.allowVisitorOverride ?? currentOptions.allowVisitorOverride ?? true,
  }
  refresh()

  subscriberCount++
  if (intervalId === null && typeof window !== 'undefined')
    intervalId = setInterval(refresh, REFRESH_MS)

  onUnmounted(() => {
    subscriberCount--
    if (subscriberCount <= 0 && intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
      subscriberCount = 0
    }
  })

  function setVisitorLocation(loc: Location) {
    if (!currentOptions.allowVisitorOverride)
      return
    writeLocationOverride(loc)
    refresh()
  }

  function clearVisitorOverride() {
    writeLocationOverride(null)
    refresh()
  }

  return {
    state: computed(() => stateRef.value),
    setVisitorLocation,
    clearVisitorOverride,
  }
}
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test theme/composables/useAstronomy.test.ts
```
Expected: 5 PASS.

- [ ] **Step 5: Re-export from `composables/index.ts`**

Edit `theme/composables/index.ts` to add (alphabetical):

```ts
export * from './astronomy'
export * from './useAstronomy'
export * from './useMoonPhase'
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add theme/composables/useAstronomy.ts theme/composables/useAstronomy.test.ts theme/composables/index.ts
git commit -m "feat(astronomy): useAstronomy composable with shared 60s refresh"
```

---

## Task 10: `ShuimoMoon` component

**Files:**
- Create: `theme/components/ShuimoMoon.vue`

No unit tests — visual component, validated in Task 13 (manual demo).

- [ ] **Step 1: Create the component**

Create `theme/components/ShuimoMoon.vue`:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { moonShadowPath } from '../composables/astronomy'
import { useAstronomy } from '../composables/useAstronomy'
import { useThemeConfig } from '../composables/config'

const props = withDefaults(defineProps<{
  size?: number
}>(), { size: 70 })

const themeConfig = useThemeConfig()
const { t } = useI18n()

const astronomyConfig = computed(() => themeConfig.value?.astronomy ?? {})
const tiltByLatitude = computed(() => astronomyConfig.value.moon?.tiltByLatitude ?? true)
const allowVisitorOverride = computed(() => astronomyConfig.value.allowVisitorOverride ?? true)

const { state, setVisitorLocation, clearVisitorOverride } = useAstronomy({
  configLocation: astronomyConfig.value.location,
  allowVisitorOverride: allowVisitorOverride.value,
})

const R = computed(() => props.size / 2 - 2)
const shadowPath = computed(() => moonShadowPath(state.value.phase, props.size / 2, props.size / 2, R.value))
const tiltDeg = computed(() => tiltByLatitude.value ? state.value.parallacticAngleDeg : 0)

const phaseLabel = computed(() => t(`shuimo.astronomy.label_phase`, { name: t(`shuimo.astronomy.phase.${state.value.phaseKey}`) }))
const locationLabel = computed(() => {
  const { location } = state.value
  if (location.name)
    return location.name
  const lat = `${location.lat >= 0 ? 'N' : 'S'}${Math.abs(location.lat).toFixed(2)}°`
  const lng = `${location.lng >= 0 ? 'E' : 'W'}${Math.abs(location.lng).toFixed(2)}°`
  return `${lat} ${lng}`
})

const moonStyle = computed(() => ({
  left: `${state.value.x}%`,
  top: `${state.value.y}%`,
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

const isVisitorOverride = computed(() => {
  const cfg = astronomyConfig.value.location ?? { lat: 29.56, lng: 106.55 }
  return state.value.location.lat !== cfg.lat || state.value.location.lng !== cfg.lng
})

const message = ref<string | null>(null)
let messageTimer: ReturnType<typeof setTimeout> | null = null
function flashMessage(text: string, ms = 3000) {
  message.value = text
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => { message.value = null }, ms)
}

function requestVisitorLocation() {
  if (!allowVisitorOverride.value) return
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    flashMessage(t('shuimo.astronomy.location_failed'))
    return
  }
  flashMessage(t('shuimo.astronomy.locating'), 60000)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setVisitorLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      message.value = null
    },
    () => flashMessage(t('shuimo.astronomy.location_failed')),
    { timeout: 5000 },
  )
}
</script>

<template>
  <div v-if="!state.hidden" class="shuimo-moon-astro" :style="moonStyle">
    <svg
      class="shuimo-moon-astro__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
    >
      <defs>
        <radialGradient :id="`moon-grad-${size}`" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#f5f0e0" />
          <stop offset="50%" stop-color="#e8e0c8" />
          <stop offset="100%" stop-color="#d5c8a0" />
        </radialGradient>
        <filter :id="`moon-blur-${size}`">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="R"
        :fill="`url(#moon-grad-${size})`"
      />
      <g :transform="`rotate(${tiltDeg} ${size / 2} ${size / 2})`" :filter="`url(#moon-blur-${size})`">
        <path :d="shadowPath" fill="rgba(20, 22, 30, 0.85)" />
      </g>
    </svg>

    <div class="shuimo-moon-astro__pill">
      <span class="shuimo-moon-astro__loc">{{ locationLabel }}</span>
      <span class="shuimo-moon-astro__sep">·</span>
      <span class="shuimo-moon-astro__phase">{{ phaseLabel }}</span>
      <span class="shuimo-moon-astro__sep">·</span>
      <span class="shuimo-moon-astro__shichen">{{ state.shichen }}时</span>
      <button
        v-if="allowVisitorOverride"
        class="shuimo-moon-astro__btn"
        type="button"
        @click="isVisitorOverride ? clearVisitorOverride() : requestVisitorLocation()"
      >
        {{ isVisitorOverride ? t('shuimo.astronomy.restore_blogger_view') : t('shuimo.astronomy.switch_to_my_location') }}
      </button>
      <span v-if="message" class="shuimo-moon-astro__msg">{{ message }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-moon-astro {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;

  &__svg {
    display: block;
    filter: drop-shadow(0 0 18px rgba(240, 230, 200, 0.18));
  }

  &__pill {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translate(-50%, 8px);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    font-family: var(--sm-font-kai);
    font-size: 11px;
    color: var(--sm-ink-light);
    background: rgba(0, 0, 0, 0.25);
    border-radius: 999px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease 0.15s;
    pointer-events: none;
  }

  &:hover &__pill {
    opacity: 1;
    pointer-events: auto;
  }

  &__btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: inherit;
    border-radius: 999px;
    padding: 1px 6px;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
  }

  &__msg {
    color: var(--sm-accent, #c8102e);
  }
}
</style>
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoMoon.vue
git commit -m "feat(components): ShuimoMoon — phase-rendered SVG + hover pill"
```

---

## Task 11: `ShuimoNightSky` container (5 layers)

**Files:**
- Create: `theme/components/ShuimoNightSky.vue`

- [ ] **Step 1: Create the component**

Create `theme/components/ShuimoNightSky.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'
import { useComponentSeed } from '../composables/useShuimoSeed'

const themeConfig = useThemeConfig()
const seed = useComponentSeed('night-sky')
const astronomy = computed(() => themeConfig.value?.astronomy ?? {})
const layers = computed(() => astronomy.value.layers ?? {})

const { state } = useAstronomy({
  configLocation: astronomy.value.location,
  allowVisitorOverride: astronomy.value.allowVisitorOverride ?? true,
})

const moonSize = computed(() => astronomy.value.moon?.size ?? 70)
const starsCount = computed(() => astronomy.value.stars?.count ?? 16)
const starsLinked = computed(() => astronomy.value.stars?.moonLinked ?? true)
const mistOpacity = computed(() => astronomy.value.mist?.opacity ?? 0.12)
const mistDuration = computed(() => astronomy.value.mist?.driftDuration ?? 120)

const showMoon = computed(() => layers.value.moon !== false)
const showStars = computed(() => layers.value.stars !== false)
const showMist = computed(() => layers.value.mist !== false)
const showVignette = computed(() => layers.value.vignette !== false)

/* Background tint: full-moon nights microscopically lighter. */
const bgOverlayOpacity = computed(() => 0.04 * state.value.illumination)

/* Stars: deterministic positions from seed; opacity = 0.6 - 0.4·illumination. */
function mulberry32(s: number) {
  let a = s
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Star { cx: number, cy: number, r: number }

const stars = computed<Star[]>(() => {
  const rand = mulberry32(seed.value)
  const out: Star[] = []
  for (let i = 0; i < starsCount.value; i++) {
    const roll = rand()
    const r = roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3
    out.push({
      cx: rand() * 100,    // %
      cy: rand() * 55,     // % (top 55% of sky band)
      r,
    })
  }
  return out
})

const starsOpacity = computed(() => starsLinked.value ? 0.6 - 0.4 * state.value.illumination : 0.5)

/* Mist drift direction from seed — left or right */
const mistDir = computed(() => seed.value % 2 === 0 ? 1 : -1)
const mistAnimStyle = computed(() => ({
  '--mist-duration': `${mistDuration.value}s`,
  '--mist-direction': mistDir.value === 1 ? 'normal' : 'reverse',
  'opacity': mistOpacity.value,
}))
</script>

<template>
  <div class="shuimo-night-sky" aria-hidden="true">
    <!-- 1. background tint -->
    <div class="shuimo-night-sky__bg" :style="{ opacity: bgOverlayOpacity }" />

    <!-- 2. vignette -->
    <div v-if="showVignette" class="shuimo-night-sky__vignette" />

    <!-- 3. mist -->
    <div v-if="showMist" class="shuimo-night-sky__mist" :style="mistAnimStyle">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <filter id="shuimo-mist-turb">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.024" numOctaves="2" seed="3" />
            <feColorMatrix
              values="0 0 0 0 0.55
                      0 0 0 0 0.6
                      0 0 0 0 0.7
                      0 0 0 0.5 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#shuimo-mist-turb)" />
      </svg>
    </div>

    <!-- 4. stars -->
    <svg v-if="showStars" class="shuimo-night-sky__stars" :style="{ opacity: starsOpacity }" preserveAspectRatio="none" viewBox="0 0 100 100">
      <circle
        v-for="(s, i) in stars"
        :key="i"
        :cx="s.cx"
        :cy="s.cy"
        :r="s.r * 0.15"
        fill="rgba(240, 235, 215, 0.9)"
      />
    </svg>

    <!-- 5. moon -->
    <ShuimoMoon v-if="showMoon" :size="moonSize" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-night-sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0; // mountains in parent should be z-index ≥ 1
}

.shuimo-night-sky__bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 1);
  transition: opacity 1s ease;
}

.shuimo-night-sky__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(8, 12, 24, 0.4) 100%);
  pointer-events: none;
}

.shuimo-night-sky__mist {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: 0;
  height: 33%;
  pointer-events: none;
  mask-image: linear-gradient(to top, black 60%, transparent);
  -webkit-mask-image: linear-gradient(to top, black 60%, transparent);
  animation: shuimo-mist-drift var(--mist-duration, 120s) ease-in-out infinite alternate;
  animation-direction: var(--mist-direction, normal);
}

@keyframes shuimo-mist-drift {
  from { transform: translateX(-3%); }
  to   { transform: translateX(3%); }
}

@media (prefers-reduced-motion: reduce) {
  .shuimo-night-sky__mist { animation: none; }
}

.shuimo-night-sky__stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 1s ease;
}

@media (max-width: 767px) {
  .shuimo-night-sky { display: none; }
}
</style>
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoNightSky.vue
git commit -m "feat(components): ShuimoNightSky container with bg/vignette/mist/stars/moon layers"
```

---

## Task 12: Mount `ShuimoNightSky` inside Hero, retire static moon

**Files:**
- Modify: `theme/components/ShuimoHeroLandscape.vue`

- [ ] **Step 1: Replace the static moon with the new night sky**

In `theme/components/ShuimoHeroLandscape.vue` template:

(a) Replace the existing `<!-- 暗色模式：月亮 + 月光 --> <div class="shuimo-moon">…</div>` block with:

```vue
    <!-- 暗色模式：天文驱动的夜空（包含月亮 / 星点 / 烟雾 / 暗角） -->
    <ShuimoNightSky v-if="isDark && nightSkyEnabled" />
```

(b) Add `nightSkyEnabled` to the script. Insert near the top of `<script setup>` after `themeConfig` is created:

```ts
const nightSkyEnabled = computed(() => themeConfig.value?.astronomy?.enable !== false)
```

Add `computed` to the existing `vue` import if not already present.

(c) Update z-index so mountains sit above the night sky. In the scoped style, find `.shuimo-hero-landscape__svg` and add `position: relative; z-index: 1;`:

```scss
.shuimo-hero-landscape__svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}
```

(d) Remove the now-unused `.shuimo-moon`, `.shuimo-moon__body`, `.shuimo-moon__glow`, `@keyframes moon-pulse`, and the global `html.dark .shuimo-moon` rule from the `<style>` blocks.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoHeroLandscape.vue
git commit -m "feat(hero): mount ShuimoNightSky in dark mode; retire static moon"
```

---

## Task 13: Manual demo verification

This task is manual — verify the visual result in the demo site.

- [ ] **Step 1: Start the demo server**

```bash
pnpm dev
```

Open the printed URL (usually `http://localhost:4859/`).

- [ ] **Step 2: Verify dark mode rendering**

Toggle the theme switch to dark mode. Visit:
- `/` (home)
- `/about/`
- `/archives/`
- `/categories/`
- `/tags/`

For each, confirm:
- Moon appears at a position that makes sense for current local time
- Hovering the moon reveals a pill with `重庆 · 月相：xxx · [切换到我所在地]`
- Stars are subtly visible above the mountains
- Mist drifts slowly along the bottom
- Mountains appear ABOVE the moon (i.e., if the moon is behind a mountain peak, the peak occludes it)

- [ ] **Step 3: Verify light mode is unchanged**

Toggle to light mode. Confirm there is no moon, no mist, no stars; the original Hero landscape is intact.

- [ ] **Step 4: Verify article pages are clean**

Visit any post `/posts/...` in dark mode. Confirm the night sky does NOT appear in the article reading area.

- [ ] **Step 5: Verify visitor-location toggle**

Click `切换到我所在地`. Either grant geolocation (moon position should jump) or deny it (a "无法获取位置…" message should appear briefly).

After granting, refresh the page — visitor location should persist (`localStorage`).

Click `还原博主视角` — moon should jump back to Chongqing.

- [ ] **Step 6: Verify URL override**

Visit `/?loc=39.9,116.4` (Beijing). Moon position should reflect Beijing.

- [ ] **Step 7: Verify mobile hides night sky**

Resize browser below 768 px or use device emulation. Night sky should disappear; only the static Hero landscape remains.

- [ ] **Step 8: Verify config disable**

In `demo/valaxy.config.ts`, temporarily add:
```ts
themeConfig: {
  astronomy: { enable: false },
}
```
Restart dev server. Confirm dark mode shows no night sky at all (Hero landscape only). **Revert this change before committing anything else.**

- [ ] **Step 9: No commit needed (verification step)**

If all checks pass, proceed to Task 14.

---

## Task 14: Lint, typecheck, full test pass

- [ ] **Step 1: Lint**

```bash
pnpm lint
```
Expected: no errors. Fix any issues (most likely import ordering or trailing commas).

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: All tests**

```bash
pnpm test
```
Expected: all PASS, including pre-existing tests for `useShuimoSeed`, `useThemeCssVars`, plus new `astronomy`, `useMoonPhase`, `useAstronomy` tests.

- [ ] **Step 4: If any fixes were needed, commit them**

```bash
git add -A
git commit -m "chore(astronomy): lint + typecheck cleanup"
```

(Skip this step if no fixes were needed.)

---

## Task 15: Final wrap-up — push branch & open PR (optional, ask user)

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/astronomy-night-sky
```

- [ ] **Step 2: Ask the user whether to open a PR**

Do not create a PR autonomously. Ask the user before invoking `gh pr create`.

---

## Open follow-ups (out of scope for this plan)

These are tracked in spec §6 and should be raised after merge:

- 60 s refresh interval — re-evaluate after seeing it live; possibly drop to 30 s for visible motion.
- Reverse-geocoding so `location.name` can show city names rather than raw lat/lng.
- Smooth per-second moon drift animation.
- Light-mode daytime sky (sun, blue glow, dusk orange glow).
