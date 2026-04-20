# Astronomy Day Sky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light-mode day sky that mirrors the night sky — 赤日盘 sun at real astronomical position, subtle sky tint driven by sun altitude, 朝霞 / 晚霞 horizon glow at dawn / dusk, and a single ink-stroke flying bird per session.

**Architecture:** A new `ShuimoDaySky` component mounts inside `ShuimoHeroLandscape` only in light mode. It composes 5 layers (sky tint, horizon glow, vignette, `ShuimoSun`, `ShuimoFlyingBird`). Sun + moon share the same singleton `useAstronomy` composable (one 60 s interval, both bodies updated together). `moonScreenPos` is renamed to `celestialScreenPos` (day/night agnostic). Moon-specific state is nested under `state.moon.*` to keep the interface clean.

**Tech Stack:** Vue 3 (`<script setup>`) · Vitest · `suncalc` (already present) · `@shuimo-design/lunar` (already present) · SVG + CSS.

**Spec:** `docs/superpowers/specs/2026-04-20-astronomy-day-sky-design.md`

**Branch:** Continuing on `feat/astronomy-night-sky` (both features ship together).

---

## Task 1: Rename `moonScreenPos` → `celestialScreenPos`; keep alias

**Files:**
- Modify: `theme/composables/astronomy.ts`

- [ ] **Step 1: Rename the function**

In `theme/composables/astronomy.ts`, find:

```ts
export function moonScreenPos(altitudeRad: number, azimuthRad: number, lat: number): ScreenPos {
```

Change to:

```ts
export function celestialScreenPos(altitudeRad: number, azimuthRad: number, lat: number): ScreenPos {
```

- [ ] **Step 2: Add backward-compat alias**

Immediately below the renamed function (before the next export), add:

```ts
/** @deprecated use `celestialScreenPos` — alias kept for compatibility */
export const moonScreenPos = celestialScreenPos
```

- [ ] **Step 3: Update the docstring block above the function**

Replace:

```ts
/**
 * Map (altitude, azimuth) → screen position inside Hero.
 * Northern-hemisphere observer faces south; southern-hemisphere mirrored.
 * ...
 */
```

with:

```ts
/**
 * Map (altitude, azimuth) → screen position inside Hero for any celestial
 * body (moon, sun, …). Northern-hemisphere observer faces south;
 * southern-hemisphere mirrored.
 * ...
 */
```

(Keep the rest of the docstring unchanged.)

- [ ] **Step 4: Run all tests**

```bash
pnpm test theme/composables/astronomy.test.ts
```
Expected: 24 PASS (the existing `moonScreenPos` tests still work via the alias).

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add theme/composables/astronomy.ts
git commit -m "refactor(astronomy): rename moonScreenPos → celestialScreenPos (alias kept)"
```

---

## Task 2: Extend `ThemeConfig` types for sun + new layer flags

**Files:**
- Modify: `theme/types/index.d.ts`

- [ ] **Step 1: Expand the `layers` block inside `astronomy`**

In `theme/types/index.d.ts`, find the existing `layers` block inside `astronomy`:

```ts
    /** 各视觉层独立开关 */
    layers: Partial<{
      moon: boolean
      stars: boolean
      mist: boolean
      vignette: boolean
    }>
```

Replace with:

```ts
    /** 各视觉层独立开关（moon/stars/mist 为夜空；sun/glowMorning/glowDusk/bird/skyTint 为白昼；vignette 共享） */
    layers: Partial<{
      moon: boolean
      stars: boolean
      mist: boolean
      vignette: boolean
      sun: boolean
      glowMorning: boolean
      glowDusk: boolean
      bird: boolean
      skyTint: boolean
    }>
```

- [ ] **Step 2: Add `sun` tweak block after the `stars` block**

Find the existing `stars` block:

```ts
    /** 星点调节 */
    stars: Partial<{
      count: number
      moonLinked: boolean
    }>
```

Immediately below it (and before `mist: Partial<...>`), insert:

```ts
    /** 太阳调节 */
    sun: Partial<{
      /** 直径 px @default 60 */
      size: number
      /** 朱红色 @default '#D9362E' */
      color: string
    }>
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add theme/types/index.d.ts
git commit -m "feat(types): add sun config + day-sky layer flags"
```

---

## Task 3: Default values for sun + new layers

**Files:**
- Modify: `theme/node/index.ts`

- [ ] **Step 1: Extend the default `layers` object**

Find:

```ts
    layers: { moon: true, stars: true, mist: true, vignette: true },
```

Replace with:

```ts
    layers: {
      moon: true, stars: true, mist: true, vignette: true,
      sun: true, glowMorning: true, glowDusk: true, bird: true, skyTint: true,
    },
```

- [ ] **Step 2: Add sun defaults**

Find the existing `moon: { size: 70, tiltByLatitude: true },` line, and immediately after it (before `stars: {...}`), add:

```ts
    sun: { size: 60, color: '#D9362E' },
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add theme/node/index.ts
git commit -m "feat(node): default sun + day-sky layer config"
```

---

## Task 4: i18n — `label_solar_term`

**Files:**
- Modify: `theme/locales/zh-CN.yml`
- Modify: `theme/locales/en.yml`

- [ ] **Step 1: Add to `zh-CN.yml`**

Inside the `shuimo: astronomy:` block, after the `label_phase` line, add:

```yaml
    label_solar_term: '节气：{name}'
```

- [ ] **Step 2: Add to `en.yml`**

Inside the `shuimo: astronomy:` block, after the `label_phase` line, add:

```yaml
    label_solar_term: 'Solar term: {name}'
```

- [ ] **Step 3: Commit**

```bash
git add theme/locales/zh-CN.yml theme/locales/en.yml
git commit -m "i18n(astronomy): add label_solar_term"
```

---

## Task 5: Restructure `useAstronomy` state — nest `moon`, add `sun` + `solarTermName`

This is a coordinated breaking change affecting `useAstronomy.ts`, its tests, and `ShuimoMoon.vue`. Do all three in one commit.

**Files:**
- Modify: `theme/composables/useAstronomy.ts`
- Modify: `theme/composables/useAstronomy.test.ts`
- Modify: `theme/components/ShuimoMoon.vue`

- [ ] **Step 1: Rewrite the `AstronomyState` interface in `useAstronomy.ts`**

Find:

```ts
export interface AstronomyState {
  location: Location
  hidden: boolean
  x: number
  y: number
  illumination: number
  phase: number
  phaseKey: MoonPhaseKey
  parallacticAngleDeg: number
  shichen: string
  updatedAt: number
}
```

Replace with:

```ts
export interface MoonState {
  hidden: boolean
  x: number
  y: number
  illumination: number
  phase: number
  phaseKey: MoonPhaseKey
  parallacticAngleDeg: number
}

export interface SunState {
  hidden: boolean
  x: number
  y: number
  altitudeDeg: number
  azimuthDeg: number
  isRising: boolean
}

export interface AstronomyState {
  location: Location
  updatedAt: number
  shichen: string
  solarTermName: string
  moon: MoonState
  sun: SunState
}
```

- [ ] **Step 2: Update imports and `compute()` in `useAstronomy.ts`**

At the top of the file, update the `useSolarTerm` import to also bring in `getSolarTerm`:

```ts
import { getSolarTerm, getTimeOfDay } from './useSolarTerm'
```

Replace `celestialScreenPos` import — replace the `moonScreenPos` name in the existing import block from `./astronomy`:

```ts
import {
  FALLBACK_LOCATION,
  celestialScreenPos,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'
```

Rewrite the `compute()` function body:

```ts
function compute(opts: Required<AstronomyOptions>): AstronomyState {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const location = resolveLocation({
    configLocation: opts.configLocation,
    allowVisitorOverride: opts.allowVisitorOverride,
    search,
  })
  const now = new Date()

  const moonPos = suncalc.getMoonPosition(now, location.lat, location.lng)
  const illum = suncalc.getMoonIllumination(now)
  const moonScreen = celestialScreenPos(moonPos.altitude, moonPos.azimuth, location.lat)

  const sunPos = suncalc.getSunPosition(now, location.lat, location.lng)
  const sunScreen = celestialScreenPos(sunPos.altitude, sunPos.azimuth, location.lat)

  const R2D = 180 / Math.PI
  return {
    location,
    updatedAt: now.getTime(),
    shichen: getTimeOfDay(now).shichen,
    solarTermName: getSolarTerm(now).name,
    moon: {
      hidden: moonScreen.hidden,
      x: moonScreen.x,
      y: moonScreen.y,
      illumination: illum.fraction,
      phase: illum.phase,
      phaseKey: moonPhaseI18nKey(illum.phase),
      parallacticAngleDeg: moonPos.parallacticAngle * R2D,
    },
    sun: {
      hidden: sunScreen.hidden,
      x: sunScreen.x,
      y: sunScreen.y,
      altitudeDeg: sunPos.altitude * R2D,
      azimuthDeg: sunPos.azimuth * R2D,
      isRising: sunPos.azimuth < 0,
    },
  }
}
```

- [ ] **Step 3: Update `useAstronomy.test.ts`**

Update the `vi.mock('suncalc', …)` at the top to include `getSunPosition`:

```ts
vi.mock('suncalc', () => ({
  default: {
    getMoonPosition: vi.fn(() => ({
      altitude: 0.5, azimuth: 0, distance: 384000, parallacticAngle: 0,
    })),
    getMoonIllumination: vi.fn(() => ({ fraction: 0.5, phase: 0.25, angle: 0 })),
    getSunPosition: vi.fn(() => ({ altitude: 0.4, azimuth: 0 })),
  },
}))
```

Update the 5 existing assertions. Specifically:

In the test `it('exposes a reactive state with screen pos + phase key', …)`:

```ts
it('exposes a reactive state with screen pos + phase key', () => {
  const { state } = useAstronomy({
    configLocation: { lat: 29.56, lng: 106.55, name: '重庆' },
    allowVisitorOverride: true,
  })
  expect(state.value.moon.hidden).toBe(false)
  expect(state.value.moon.phaseKey).toBe('first_quarter')
  expect(state.value.location.lat).toBe(29.56)
  expect(state.value.sun.hidden).toBe(false)
  expect(typeof state.value.solarTermName).toBe('string')
})
```

In `it('setVisitorLocation updates location and persists to localStorage', …)`:

```ts
setVisitorLocation({ lat: 30.27, lng: 120.15 })
await nextTick()

expect(state.value.location.lat).toBe(30.27)
// (localStorage assertion unchanged)
```

(`state.value.location.lat` is still at the top level — no path change needed there.)

In `it('clearVisitorOverride restores blogger location', …)`:

```ts
// Same — state.value.location.lat still top-level; no path change needed.
```

The other two tests (refresh tick, shared interval) don't assert state shape — they should pass unchanged.

- [ ] **Step 4: Update `ShuimoMoon.vue`**

In `theme/components/ShuimoMoon.vue`, update all `state.value.*` accesses to use the new nested paths:

Find `state.value.phase` → change to `state.value.moon.phase`
Find `state.value.hidden` → change to `state.value.moon.hidden`
Find `state.value.x` → change to `state.value.moon.x`
Find `state.value.y` → change to `state.value.moon.y`
Find `state.value.phaseKey` → change to `state.value.moon.phaseKey`
Find `state.value.parallacticAngleDeg` → change to `state.value.moon.parallacticAngleDeg`

Leave `state.value.shichen` and `state.value.location.*` unchanged (they stay top-level).

Also update the template `v-if="!state.hidden"` and `{{ state.shichen }}时`:

```vue
<div v-if="!state.moon.hidden" class="shuimo-moon-astro" :style="moonStyle">
...
<span class="shuimo-moon-astro__shichen">{{ state.shichen }}时</span>
```

(The `state.shichen` stays; only `state.hidden` → `state.moon.hidden`.)

- [ ] **Step 5: Run tests**

```bash
pnpm test
```
Expected: all PASS (66 total, with the updated assertions).

- [ ] **Step 6: Typecheck + lint**

```bash
pnpm typecheck
pnpm exec eslint theme/composables/useAstronomy.ts theme/composables/useAstronomy.test.ts theme/components/ShuimoMoon.vue
```
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add theme/composables/useAstronomy.ts theme/composables/useAstronomy.test.ts theme/components/ShuimoMoon.vue
git commit -m "refactor(astronomy): nest moon state + add sun state and solarTermName"
```

---

## Task 6: Extract `ShuimoCelestialPill` component — refactor `ShuimoMoon` to use it

The hover pill UI is shared by Moon and Sun (same structure, different dynamic labels). Extract it as a child component for reuse.

**Files:**
- Create: `theme/components/ShuimoCelestialPill.vue`
- Modify: `theme/components/ShuimoMoon.vue`

- [ ] **Step 1: Create `ShuimoCelestialPill.vue`**

Create the new file:

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  /** Display string like "重庆" or "N29.56° E106.55°". */
  locationLabel: string
  /** Already-formatted dynamic label like "月相：望" or "节气：谷雨". */
  dynamicLabel: string
  /** Chinese shichen character, e.g. "子". */
  shichen: string
  /** Whether to show the toggle button. Usually `astronomy.allowVisitorOverride`. */
  showToggle: boolean
  /** True if currently overridden to visitor location. */
  isVisitorOverride: boolean
  /** Transient message (null when none). */
  message: string | null
}>()

defineEmits<{
  toggle: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="shuimo-celestial-pill">
    <span class="shuimo-celestial-pill__loc">{{ locationLabel }}</span>
    <span class="shuimo-celestial-pill__sep">·</span>
    <span class="shuimo-celestial-pill__dyn">{{ dynamicLabel }}</span>
    <span class="shuimo-celestial-pill__sep">·</span>
    <span class="shuimo-celestial-pill__shichen">{{ shichen }}时</span>
    <button
      v-if="showToggle"
      class="shuimo-celestial-pill__btn"
      type="button"
      @click="$emit('toggle')"
    >
      {{ isVisitorOverride ? t('shuimo.astronomy.restore_blogger_view') : t('shuimo.astronomy.switch_to_my_location') }}
    </button>
    <span v-if="message" class="shuimo-celestial-pill__msg">{{ message }}</span>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-celestial-pill {
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

- [ ] **Step 2: Refactor `ShuimoMoon.vue` template to use the pill component**

Replace the existing `<div class="shuimo-moon-astro__pill">...</div>` block in the template with:

```vue
    <ShuimoCelestialPill
      :location-label="locationLabel"
      :dynamic-label="phaseLabel"
      :shichen="state.shichen"
      :show-toggle="allowVisitorOverride"
      :is-visitor-override="isVisitorOverride"
      :message="message"
      @toggle="isVisitorOverride ? clearVisitorOverride() : requestVisitorLocation()"
    />
```

- [ ] **Step 3: Remove pill-specific SCSS from `ShuimoMoon.vue`**

In the `<style scoped>` block of `ShuimoMoon.vue`, delete:

- The entire `&__pill` block
- The entire `&__btn` block
- The entire `&__msg` block
- The existing `&:hover &__pill, &:focus-within &__pill { ... }` block

Then rewrite the hover rule so it targets the child pill via its own class:

```scss
&:hover :deep(.shuimo-celestial-pill),
&:focus-within :deep(.shuimo-celestial-pill) {
  opacity: 1;
  pointer-events: auto;
}
```

Keep everything else in the `.shuimo-moon-astro` block: the `::after` hover bridge (unchanged), the `&__svg` drop-shadow, the container transforms.

- [ ] **Step 4: Run tests**

```bash
pnpm test
```
Expected: 66 PASS.

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck
pnpm exec eslint theme/components/ShuimoMoon.vue theme/components/ShuimoCelestialPill.vue
```
Expected: clean. Run `--fix` if minor style issues.

- [ ] **Step 6: Commit**

```bash
git add theme/components/ShuimoMoon.vue theme/components/ShuimoCelestialPill.vue
git commit -m "refactor(moon): extract ShuimoCelestialPill for day/night reuse"
```

---

## Task 7: `ShuimoSun` component

**Files:**
- Create: `theme/components/ShuimoSun.vue`

- [ ] **Step 1: Create the file**

```vue
<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FALLBACK_LOCATION } from '../composables/astronomy'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'

const props = withDefaults(defineProps<{
  size?: number
}>(), { size: 60 })

const themeConfig = useThemeConfig()
const { t } = useI18n()

const astronomyConfig = computed(() => themeConfig.value?.astronomy ?? {})
const sunColor = computed(() => astronomyConfig.value.sun?.color ?? '#D9362E')
const allowVisitorOverride = computed(() => astronomyConfig.value.allowVisitorOverride ?? true)

const { state, setVisitorLocation, clearVisitorOverride } = useAstronomy({
  configLocation: astronomyConfig.value.location,
  allowVisitorOverride: allowVisitorOverride.value,
})

const R = computed(() => props.size / 2 - 2)

const solarTermLabel = computed(() => t('shuimo.astronomy.label_solar_term', { name: state.value.solarTermName }))

const locationLabel = computed(() => {
  const { location } = state.value
  if (location.name)
    return location.name
  const lat = `${location.lat >= 0 ? 'N' : 'S'}${Math.abs(location.lat).toFixed(2)}°`
  const lng = `${location.lng >= 0 ? 'E' : 'W'}${Math.abs(location.lng).toFixed(2)}°`
  return `${lat} ${lng}`
})

const sunStyle = computed(() => ({
  left: `${state.value.sun.x}%`,
  top: `${state.value.sun.y}%`,
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

const isVisitorOverride = computed(() => {
  const cfg = astronomyConfig.value.location ?? FALLBACK_LOCATION
  return state.value.location.lat !== cfg.lat || state.value.location.lng !== cfg.lng
})

const message = ref<string | null>(null)
let messageTimer: ReturnType<typeof setTimeout> | null = null
function flashMessage(text: string, ms = 3000) {
  message.value = text
  if (messageTimer)
    clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = null
  }, ms)
}

onUnmounted(() => {
  if (messageTimer) {
    clearTimeout(messageTimer)
    messageTimer = null
  }
})

function requestVisitorLocation() {
  if (!allowVisitorOverride.value)
    return
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

function handleToggle() {
  if (isVisitorOverride.value)
    clearVisitorOverride()
  else
    requestVisitorLocation()
}

const gradId = computed(() => `sun-grad-${props.size}`)
const haloId = computed(() => `sun-halo-${props.size}`)

// Darker edge for the sun body. Derived from the configured sun color.
// For simplicity we just use the same color for both stops — the radial
// gradient provides the fade — but callers may override via `color`.
</script>

<template>
  <div v-if="!state.sun.hidden" class="shuimo-sun-astro" :style="sunStyle">
    <svg
      class="shuimo-sun-astro__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
    >
      <defs>
        <radialGradient :id="gradId" cx="50%" cy="50%" r="50%">
          <stop offset="0%" :stop-color="sunColor" />
          <stop offset="70%" :stop-color="sunColor" stop-opacity="0.9" />
          <stop offset="100%" :stop-color="sunColor" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="haloId" cx="50%" cy="50%" r="50%">
          <stop offset="0%" :stop-color="sunColor" stop-opacity="0.35" />
          <stop offset="100%" :stop-color="sunColor" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle :cx="size / 2" :cy="size / 2" :r="size * 0.75" :fill="`url(#${haloId})`" />
      <circle :cx="size / 2" :cy="size / 2" :r="R" :fill="`url(#${gradId})`" />
    </svg>

    <ShuimoCelestialPill
      :location-label="locationLabel"
      :dynamic-label="solarTermLabel"
      :shichen="state.shichen"
      :show-toggle="allowVisitorOverride"
      :is-visitor-override="isVisitorOverride"
      :message="message"
      @toggle="handleToggle"
    />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-sun-astro {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;

  // Invisible hover bridge so the cursor stays inside :hover when crossing
  // the 8px gap to the pill — same pattern as ShuimoMoon.
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 360px;
    height: 8px;
  }

  &__svg {
    display: block;
    filter: drop-shadow(0 0 20px rgba(217, 54, 46, 0.25));
  }

  &:hover :deep(.shuimo-celestial-pill),
  &:focus-within :deep(.shuimo-celestial-pill) {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck
pnpm exec eslint theme/components/ShuimoSun.vue
```
Expected: clean. Run `--fix` for minor style issues.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoSun.vue
git commit -m "feat(components): ShuimoSun — 赤日盘 with shared celestial pill"
```

---

## Task 8: `ShuimoFlyingBird` component

**Files:**
- Create: `theme/components/ShuimoFlyingBird.vue`

- [ ] **Step 1: Create the file**

```vue
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useComponentSeed } from '../composables/useShuimoSeed'

const seed = useComponentSeed('flying-bird')

// Seeded mulberry32 PRNG — same helper pattern as ShuimoNightSky
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

// Compute flight parameters once at setup time.
const rand = mulberry32(seed.value)
const directionLtoR = rand() < 0.5 // left→right if true
const startTopPct = 15 + rand() * 20 // 15–35 % of height
const delayMs = 10_000 + rand() * 50_000 // 10–60 s
const durationMs = 8_000 + rand() * 7_000 // 8–15 s

const phase = ref<'waiting' | 'flying' | 'done'>('waiting')

let startTimer: ReturnType<typeof setTimeout> | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  startTimer = setTimeout(() => {
    phase.value = 'flying'
    endTimer = setTimeout(() => {
      phase.value = 'done'
    }, durationMs)
  }, delayMs)
})

onUnmounted(() => {
  if (startTimer)
    clearTimeout(startTimer)
  if (endTimer)
    clearTimeout(endTimer)
})

const style = computed(() => ({
  top: `${startTopPct}%`,
  animationDuration: `${durationMs}ms`,
  animationDirection: directionLtoR ? 'normal' : 'reverse',
}))
</script>

<template>
  <svg
    v-if="phase === 'flying'"
    class="shuimo-flying-bird"
    :style="style"
    viewBox="0 0 12 10"
    aria-hidden="true"
  >
    <path
      d="M0 5 Q 3 0, 6 5 M 6 5 Q 9 0, 12 5"
      stroke="rgba(40, 40, 40, 0.55)"
      stroke-width="1"
      fill="none"
      stroke-linecap="round"
    />
  </svg>
</template>

<style lang="scss" scoped>
.shuimo-flying-bird {
  position: absolute;
  left: 0;
  width: 18px;
  height: 15px;
  pointer-events: none;
  animation-name: shuimo-bird-fly;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

@keyframes shuimo-bird-fly {
  from {
    transform: translateX(-10vw);
  }
  to {
    transform: translateX(110vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shuimo-flying-bird {
    animation: none;
    display: none;
  }
}
</style>
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck
pnpm exec eslint theme/components/ShuimoFlyingBird.vue
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoFlyingBird.vue
git commit -m "feat(components): ShuimoFlyingBird — single ink-stroke bird per session"
```

---

## Task 9: `ShuimoDaySky` container

**Files:**
- Create: `theme/components/ShuimoDaySky.vue`

- [ ] **Step 1: Create the file**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'

const themeConfig = useThemeConfig()
const astronomy = computed(() => themeConfig.value?.astronomy ?? {})
const layers = computed(() => astronomy.value.layers ?? {})

const { state } = useAstronomy({
  configLocation: astronomy.value.location,
  allowVisitorOverride: astronomy.value.allowVisitorOverride ?? true,
})

const sunSize = computed(() => astronomy.value.sun?.size ?? 60)

const showSun = computed(() => layers.value.sun !== false)
const showGlowMorning = computed(() => layers.value.glowMorning !== false)
const showGlowDusk = computed(() => layers.value.glowDusk !== false)
const showBird = computed(() => layers.value.bird !== false)
const showSkyTint = computed(() => layers.value.skyTint !== false)
const showVignette = computed(() => layers.value.vignette !== false)

// ---------- tint / glow opacity math (pure CSS-driven) ----------

/** Bell curve with peak 1 at center, 0 at center ± halfWidth. */
function bell(x: number, center: number, halfWidth: number): number {
  const d = (x - center) / halfWidth
  return Math.max(0, 1 - d * d)
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const sunAlt = computed(() => state.value.sun.altitudeDeg)
const isRising = computed(() => state.value.sun.isRising)

/** Morning pink tint opacity (only when rising, alt 0..15°). */
const morningTintOpacity = computed(() =>
  isRising.value ? 0.05 * bell(sunAlt.value, 7.5, 7.5) : 0,
)

/** Dusk orange tint opacity (only when setting, alt -2..15°). */
const duskTintOpacity = computed(() =>
  isRising.value ? 0 : 0.06 * bell(sunAlt.value, 6.5, 8.5),
)

/** Noon warm white tint opacity (ramps up as alt passes 15°). */
const noonTintOpacity = computed(() => 0.03 * smoothstep(15, 30, sunAlt.value))

/** Morning red glow (rising, alt 0..10°). */
const morningGlowOpacity = computed(() =>
  isRising.value ? 0.25 * bell(sunAlt.value, 5, 5) : 0,
)

/** Dusk orange glow (setting, alt -5..10°). */
const duskGlowOpacity = computed(() =>
  isRising.value ? 0 : 0.3 * bell(sunAlt.value, 2.5, 7.5),
)

const sunX = computed(() => state.value.sun.x)
</script>

<template>
  <div class="shuimo-day-sky" aria-hidden="true">
    <!-- 1. sky tint (three overlays, additive) -->
    <template v-if="showSkyTint">
      <div class="shuimo-day-sky__tint shuimo-day-sky__tint--morning" :style="{ opacity: morningTintOpacity }" />
      <div class="shuimo-day-sky__tint shuimo-day-sky__tint--dusk" :style="{ opacity: duskTintOpacity }" />
      <div class="shuimo-day-sky__tint shuimo-day-sky__tint--noon" :style="{ opacity: noonTintOpacity }" />
    </template>

    <!-- 2. horizon glow -->
    <div
      v-if="showGlowMorning && morningGlowOpacity > 0"
      class="shuimo-day-sky__glow shuimo-day-sky__glow--morning"
      :style="{ opacity: morningGlowOpacity, left: `calc(${sunX}% - 40%)` }"
    />
    <div
      v-if="showGlowDusk && duskGlowOpacity > 0"
      class="shuimo-day-sky__glow shuimo-day-sky__glow--dusk"
      :style="{ opacity: duskGlowOpacity, left: `calc(${sunX}% - 40%)` }"
    />

    <!-- 3. vignette -->
    <div v-if="showVignette" class="shuimo-day-sky__vignette" />

    <!-- 4. sun -->
    <ShuimoSun v-if="showSun" :size="sunSize" />

    <!-- 5. bird -->
    <ShuimoFlyingBird v-if="showBird" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-day-sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.shuimo-day-sky__tint {
  position: absolute;
  inset: 0;
  transition: opacity 1s ease;

  &--morning {
    background: rgba(255, 210, 210, 1);
  }
  &--dusk {
    background: rgba(255, 180, 130, 1);
  }
  &--noon {
    background: rgba(255, 250, 235, 1);
  }
}

.shuimo-day-sky__glow {
  position: absolute;
  bottom: 0;
  width: 80%;
  height: 60%;
  transition: opacity 1s ease;

  &--morning {
    background: radial-gradient(ellipse at 50% 100%, rgba(220, 110, 90, 1) 0%, transparent 70%);
  }
  &--dusk {
    background: radial-gradient(ellipse at 50% 100%, rgba(200, 120, 70, 1) 0%, transparent 70%);
  }
}

.shuimo-day-sky__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(8, 12, 24, 0.4) 100%);
  opacity: 0.15;
}

@media (prefers-reduced-motion: reduce) {
  .shuimo-day-sky__tint,
  .shuimo-day-sky__glow {
    transition: none;
  }
}

@media (max-width: 767px) {
  .shuimo-day-sky {
    display: none;
  }
}
</style>
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck
pnpm exec eslint theme/components/ShuimoDaySky.vue
```
Expected: clean. Run `--fix` for minor style issues.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoDaySky.vue
git commit -m "feat(components): ShuimoDaySky container with tint/glow/vignette/sun/bird layers"
```

---

## Task 10: Mount `ShuimoDaySky` inside Hero

**Files:**
- Modify: `theme/components/ShuimoHeroLandscape.vue`

- [ ] **Step 1: Add `daySkyEnabled` computed and `ShuimoDaySky` render**

In the `<script setup>` block, find the existing line:

```ts
const nightSkyEnabled = computed(() => themeConfig.value?.astronomy?.enable !== false)
```

Add a parallel line immediately below:

```ts
const daySkyEnabled = computed(() => themeConfig.value?.astronomy?.enable !== false)
```

(Same predicate — the `astronomy.enable` flag governs both sides.)

In the template, find the existing line:

```vue
    <ShuimoNightSky v-if="isDark && nightSkyEnabled" />
```

Immediately below it (still inside the same wrapper div), add:

```vue
    <!-- 亮色模式：天文驱动的白昼（包含日 / 朝霞 / 晚霞 / 飞鸟） -->
    <ShuimoDaySky v-if="!isDark && daySkyEnabled" />
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck
pnpm exec eslint theme/components/ShuimoHeroLandscape.vue
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ShuimoHeroLandscape.vue
git commit -m "feat(hero): mount ShuimoDaySky in light mode"
```

---

## Task 11: Manual demo verification

This is manual — verify the visual result in the demo site.

- [ ] **Step 1: Start the demo server**

```bash
pnpm dev
```

Open the printed URL.

- [ ] **Step 2: Verify light mode rendering**

Toggle to light mode. Visit `/`, `/about/`, `/archives/`, `/categories/`, `/tags/`.

For each, confirm:
- Sun appears at a sensible position for the current local time (for Chongqing default)
- Hovering the sun reveals a pill with `重庆 · 节气：XXX · 时辰 · [切换到我所在地]`
- Sun's colour is 朱红 (#D9362E), with soft halo around it
- At dawn / dusk there's a visible warm tint + horizon glow
- Mountains occlude the sun when it overlaps a peak

- [ ] **Step 3: Verify dark mode is unchanged**

Toggle to dark mode. The moon and night sky should look identical to before this feature.

- [ ] **Step 4: Verify article pages are clean**

Visit `/posts/...` in both light and dark mode. No day sky / night sky should appear.

- [ ] **Step 5: Verify visitor-location toggle**

Click `切换到我所在地` on the sun pill. Geolocation flow should work the same as for the moon.

- [ ] **Step 6: Verify URL override**

Visit `/?loc=39.9,116.4` (Beijing). Sun position should reflect Beijing.

- [ ] **Step 7: Verify mobile hides day sky**

Resize below 768 px. Day sky disappears; Hero landscape remains.

- [ ] **Step 8: Wait for the flying bird**

Keep the light-mode home page open for up to 60 seconds. A small ink-stroke bird should drift across the screen once. If it doesn't appear, refresh to roll a new seed and try again.

- [ ] **Step 9: Verify glow only at dawn / dusk**

Temporarily set system time (or use the earlier demo-mode if you re-enable it) so the sun is at low altitude. Confirm horizon glow appears. Then at high altitude (noon) confirm glow is absent.

(If testing at real time and it happens to be noon, you can skip this and trust the bell-curve formula — covered by spec §2.)

- [ ] **Step 10: Verify config disable**

In `demo/valaxy.config.ts`, temporarily add:

```ts
themeConfig: {
  astronomy: { layers: { sun: false } },
}
```

Restart dev. Confirm the sun disc disappears but glow/tint/bird remain. **Revert this change.**

- [ ] **Step 11: No commit needed (verification step)**

---

## Task 12: Lint, typecheck, full test pass

- [ ] **Step 1: Lint**

```bash
pnpm lint
```
Expected: no errors.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: All tests**

```bash
pnpm test
```
Expected: all 66 PASS (no new tests added; existing tests cover the rename + state restructure).

- [ ] **Step 4: If any fixes were needed, commit them**

```bash
git add -A
git commit -m "chore(day-sky): lint + typecheck cleanup"
```

(Skip if not needed.)

---

## Task 13: Final wrap-up

- [ ] **Step 1: Push branch (ask user first)**

Do not push autonomously. Ask the user: "Push `feat/astronomy-night-sky` to origin? Open a PR?"

- [ ] **Step 2: Upon approval, push + PR**

```bash
git push -u origin feat/astronomy-night-sky
```

Ask the user before running `gh pr create`.

---

## Open follow-ups (out of scope for this plan)

- Auto day/night switching based on sun altitude (currently respects user's light/dark choice)
- Reverse-geocoding so `location.name` shows city names rather than raw lat/lng (shared with night sky TODO)
- Weather integration (rain / snow / cloud overlays)
- Animated bird variants (flocks, wing-flap keyframes, clickable poetic quotes)
