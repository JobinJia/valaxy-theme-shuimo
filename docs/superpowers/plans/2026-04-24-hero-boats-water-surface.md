# Hero Landscape — Boats + Water Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guarantee 1–2 visible boats (each with its fisherman) plus a two-tier water surface (faint baseline + local ripples) in the hero landscape scene, via theme-side composition on top of `@jobinjia/shuimo-core`.

**Architecture:** Extract boat planning + water/boat SVG fragment composition into a new pure module `useHeroScene.boats.ts` (no shuimo-core imports — uses injectable renderers). Modify `useHeroScene.ts` to suppress `Arch.boat01` during `PaintingGenerator.landscape()`, then splice the theme-owned fragment in before `</svg>` so boats render on top of everything.

**Tech Stack:** TypeScript, Vitest (node env), `@jobinjia/shuimo-core` (`PaintingGenerator`, `Arch.boat01`, `Water.generate`, `Mount`), Vite worker pipeline (unchanged).

**Spec:** `docs/superpowers/specs/2026-04-24-hero-boats-water-surface-design.md`

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `theme/composables/useHeroScene.boats.ts` | Create | Pure planner + fragment builder. No shuimo-core imports. Exports `mulberry32`, `decideBoatCount`, `planBoats`, `buildWaterAndBoats`, and the `WaterPlan`/`Renderers` types. |
| `theme/composables/useHeroScene.boats.test.ts` | Create | Vitest unit tests for count, positions, determinism, fragment composition. No DOM/jsdom needed. |
| `theme/composables/useHeroScene.ts` | Modify | Add `Water` + `Arch` imports, wrap `PaintingGenerator.landscape()` in boat-suppress try/finally, call `planBoats` + `buildWaterAndBoats`, splice result before `</svg>`. |

No other files change. No `theme/types/`, `theme/components/`, `theme/workers/`, or `demo/` edits.

---

## Conventions

- **TDD:** each task writes failing tests first, verifies red, implements, verifies green, commits.
- **Commit messages:** conventional commits (the repo uses `feat/fix/refactor/perf/chore/docs` scopes — see `git log`).
- **Run tests from repo root:** `pnpm test -- theme/composables/useHeroScene.boats.test.ts` (vitest picks up the theme workspace).
- **Type-check before final commit:** `pnpm typecheck`.
- **Lint before final commit:** `pnpm lint`.

---

## Task 1: Planner module skeleton + `mulberry32` + `decideBoatCount`

**Files:**
- Create: `theme/composables/useHeroScene.boats.ts`
- Test: `theme/composables/useHeroScene.boats.test.ts`

- [ ] **Step 1.1: Write failing tests for `mulberry32` and `decideBoatCount`**

Create `theme/composables/useHeroScene.boats.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { decideBoatCount, mulberry32 } from './useHeroScene.boats'

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produces values in [0, 1)', () => {
    const rnd = mulberry32(1)
    for (let i = 0; i < 100; i++) {
      const v = rnd()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('diverges for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

describe('decideBoatCount', () => {
  it('clamps to 1 when nativeW < 1200', () => {
    const alwaysHigh = () => 0.99
    const alwaysLow = () => 0.01
    expect(decideBoatCount(800, alwaysHigh)).toBe(1)
    expect(decideBoatCount(1199, alwaysLow)).toBe(1)
  })

  it('returns 2 when nativeW >= 1200 and rnd() < 0.55', () => {
    expect(decideBoatCount(1200, () => 0.54)).toBe(2)
    expect(decideBoatCount(4000, () => 0.0)).toBe(2)
  })

  it('returns 1 when nativeW >= 1200 and rnd() >= 0.55', () => {
    expect(decideBoatCount(1200, () => 0.55)).toBe(1)
    expect(decideBoatCount(4000, () => 0.99)).toBe(1)
  })
})
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
pnpm test -- theme/composables/useHeroScene.boats.test.ts
```

Expected: FAIL with module-not-found error (`useHeroScene.boats` does not exist yet).

- [ ] **Step 1.3: Create the planner module with `mulberry32` + `decideBoatCount`**

Create `theme/composables/useHeroScene.boats.ts`:

```ts
// Pure boat planning + water/boat SVG fragment composition.
// No shuimo-core imports — actual rendering is injected via `Renderers` so
// this module is testable in a plain node env. Used by useHeroScene.ts
// (which runs in both the main thread and the hero-scene worker).

/**
 * Deterministic PRNG (mulberry32). Seed is coerced to uint32.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6D2B79F5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Decide boat count for the given scene width.
 *  - nativeW < 1200px   → always 1 (narrow viewports can't fit two legibly)
 *  - otherwise          → 2 with P=0.55, else 1
 */
export function decideBoatCount(nativeW: number, rnd: () => number): 1 | 2 {
  if (nativeW < 1200)
    return 1
  return rnd() < 0.55 ? 2 : 1
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
pnpm test -- theme/composables/useHeroScene.boats.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 1.5: Commit**

```bash
git add theme/composables/useHeroScene.boats.ts theme/composables/useHeroScene.boats.test.ts
git commit -m "feat(hero): add boat planner module with mulberry32 + count decision

Pure, shuimo-core-free module for deciding boat count per scene width.
Seeded mulberry32 PRNG gives deterministic per-seed composition."
```

---

## Task 2: `planBoats` — positions, orientation, sub-seeds

**Files:**
- Modify: `theme/composables/useHeroScene.boats.ts`
- Modify: `theme/composables/useHeroScene.boats.test.ts`

- [ ] **Step 2.1: Extend test file with `planBoats` tests**

Append to `theme/composables/useHeroScene.boats.test.ts`:

```ts
import { planBoats } from './useHeroScene.boats'

describe('planBoats', () => {
  it('returns 1 boat at narrow widths', () => {
    const plan = planBoats(1000, 42)
    expect(plan.boats).toHaveLength(1)
  })

  it('is fully deterministic for same (nativeW, seed)', () => {
    const a = planBoats(3000, 123)
    const b = planBoats(3000, 123)
    expect(a).toEqual(b)
  })

  it('produces baseline spanning 70% of nativeW starting at 15%', () => {
    const plan = planBoats(2000, 1)
    expect(plan.baseline.x).toBeCloseTo(300, 5)   // 2000 * 0.15
    expect(plan.baseline.len).toBeCloseTo(1400, 5) // 2000 * 0.70
    expect(plan.baseline.y).toBe(625)
  })

  it('baseline sub-seed is independent of boat seeds', () => {
    const plan = planBoats(3000, 777)
    for (const b of plan.boats) {
      expect(plan.baseline.seed).not.toBe(b.boatSeed)
      expect(plan.baseline.seed).not.toBe(b.rippleSeed)
    }
  })

  describe('single-boat case', () => {
    // Seed chosen so decideBoatCount returns 1 at nativeW=2000.
    // Verified by running mulberry32(seed)() and checking >= 0.55 or width < 1200.
    it('places boat in middle 30% of scene at y ~ 600', () => {
      // Use narrow width to force 1-boat outcome deterministically.
      const plan = planBoats(1000, 1)
      expect(plan.boats).toHaveLength(1)
      const b = plan.boats[0]
      expect(b.x).toBeGreaterThanOrEqual(1000 * 0.35)
      expect(b.x).toBeLessThanOrEqual(1000 * 0.65)
      expect(b.y).toBeGreaterThanOrEqual(590)
      expect(b.y).toBeLessThanOrEqual(610)
      expect(b.len).toBe(140)
    })
  })

  describe('two-boat case', () => {
    // Find a (nativeW, seed) that produces 2 boats.
    function findTwoBoatSeed(): { nativeW: number; seed: number } {
      for (let s = 0; s < 200; s++) {
        const p = planBoats(3000, s)
        if (p.boats.length === 2)
          return { nativeW: 3000, seed: s }
      }
      throw new Error('unable to find 2-boat seed in first 200 integers')
    }

    it('places left boat at 22–32% and right boat at 68–78% of nativeW', () => {
      const { nativeW, seed } = findTwoBoatSeed()
      const plan = planBoats(nativeW, seed)
      const [left, right] = plan.boats
      expect(left.x).toBeGreaterThanOrEqual(nativeW * 0.22)
      expect(left.x).toBeLessThanOrEqual(nativeW * 0.32)
      expect(right.x).toBeGreaterThanOrEqual(nativeW * 0.68)
      expect(right.x).toBeLessThanOrEqual(nativeW * 0.78)
    })

    it('orients fishermen inward (left fli=false, right fli=true)', () => {
      const { nativeW, seed } = findTwoBoatSeed()
      const plan = planBoats(nativeW, seed)
      expect(plan.boats[0].fli).toBe(false)
      expect(plan.boats[1].fli).toBe(true)
    })

    it('gives each boat a distinct sub-seed', () => {
      const { nativeW, seed } = findTwoBoatSeed()
      const plan = planBoats(nativeW, seed)
      const [a, b] = plan.boats
      expect(a.boatSeed).not.toBe(b.boatSeed)
      expect(a.rippleSeed).not.toBe(b.rippleSeed)
      expect(a.boatSeed).not.toBe(a.rippleSeed)
    })
  })
})
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
pnpm test -- theme/composables/useHeroScene.boats.test.ts
```

Expected: FAIL — `planBoats` is not exported yet.

- [ ] **Step 2.3: Implement `planBoats` and its types**

Append to `theme/composables/useHeroScene.boats.ts`:

```ts
/**
 * One boat placement + the seed inputs for its hull and ripple renderers.
 * `x`/`y` are in the native scene coordinate system (viewBox
 * `0 -200 nativeW 1000`, y ∈ [-200, 800]).
 */
export interface BoatPlacement {
  x: number
  y: number
  /** Horizontal flip — true means fisherman faces left. */
  fli: boolean
  /** Native boat length passed to Arch.boat01's `len` option. */
  len: number
  /** Sub-seed fed to Arch.boat01 for the hull. */
  boatSeed: number
  /** Sub-seed fed to Water.generate for the local ripples. */
  rippleSeed: number
}

/**
 * Faint long-baseline water stroke spanning the lower scene. Rendered
 * first with reduced opacity as a suggestive horizon.
 */
export interface BaselinePlan {
  x: number
  y: number
  len: number
  seed: number
}

export interface WaterPlan {
  baseline: BaselinePlan
  boats: BoatPlacement[]
}

const BOAT_Y_BASE = 600
const BOAT_Y_JITTER = 20 // full range → y ∈ [590, 610]
const BOAT_LEN = 140
const BASELINE_Y = 625

/**
 * Plan the theme-owned boat layer for one hero render. Fully deterministic
 * for a given (nativeW, seed) pair.
 */
export function planBoats(nativeW: number, seed: number): WaterPlan {
  const rnd = mulberry32(seed)
  const count = decideBoatCount(nativeW, rnd)

  const boats: BoatPlacement[] = []
  if (count === 1) {
    const x = nativeW * (0.35 + rnd() * 0.30)
    const y = BOAT_Y_BASE + (rnd() - 0.5) * BOAT_Y_JITTER
    const fli = rnd() < 0.5
    const boatSeed = (seed * 37 + 101) >>> 0
    boats.push({
      x,
      y,
      fli,
      len: BOAT_LEN,
      boatSeed,
      rippleSeed: (boatSeed ^ 0xB0A7) >>> 0,
    })
  }
  else {
    const xL = nativeW * (0.22 + rnd() * 0.10)
    const yL = BOAT_Y_BASE + (rnd() - 0.5) * BOAT_Y_JITTER
    const boatSeedL = (seed * 37 + 101) >>> 0
    boats.push({
      x: xL,
      y: yL,
      fli: false,
      len: BOAT_LEN,
      boatSeed: boatSeedL,
      rippleSeed: (boatSeedL ^ 0xB0A7) >>> 0,
    })

    const xR = nativeW * (0.68 + rnd() * 0.10)
    const yR = BOAT_Y_BASE + (rnd() - 0.5) * BOAT_Y_JITTER
    const boatSeedR = (seed * 37 + 202) >>> 0
    boats.push({
      x: xR,
      y: yR,
      fli: true,
      len: BOAT_LEN,
      boatSeed: boatSeedR,
      rippleSeed: (boatSeedR ^ 0xB0A7) >>> 0,
    })
  }

  const baseline: BaselinePlan = {
    x: nativeW * 0.15,
    y: BASELINE_Y,
    len: nativeW * 0.70,
    seed: (seed ^ 0xA17E) >>> 0,
  }

  return { baseline, boats }
}
```

- [ ] **Step 2.4: Run tests to verify they pass**

```bash
pnpm test -- theme/composables/useHeroScene.boats.test.ts
```

Expected: PASS (all tests across both describe blocks — 6 from Task 1 + 8 new).

- [ ] **Step 2.5: Commit**

```bash
git add theme/composables/useHeroScene.boats.ts theme/composables/useHeroScene.boats.test.ts
git commit -m "feat(hero): add planBoats for deterministic 1-or-2 boat layout

Plans boat positions (22-32% / 68-78% for pairs, 35-65% for singles),
orientation (fishermen face inward), and sub-seeds. Baseline water plan
lives alongside so rendering order is encoded in the plan itself."
```

---

## Task 3: `buildWaterAndBoats` — SVG fragment composition

**Files:**
- Modify: `theme/composables/useHeroScene.boats.ts`
- Modify: `theme/composables/useHeroScene.boats.test.ts`

- [ ] **Step 3.1: Extend test file with fragment tests**

Append to `theme/composables/useHeroScene.boats.test.ts`:

```ts
import type { Renderers, WaterPlan } from './useHeroScene.boats'
import { buildWaterAndBoats } from './useHeroScene.boats'

describe('buildWaterAndBoats', () => {
  // Spy-style renderers that record calls and return identifiable strings.
  interface Call { kind: 'boat' | 'water'; x: number; y: number; seed: number; opts: unknown }
  function makeRenderers(): { r: Renderers; calls: Call[] } {
    const calls: Call[] = []
    const r: Renderers = {
      boat: (x, y, seed, opts) => {
        calls.push({ kind: 'boat', x, y, seed, opts })
        return `<!--boat seed=${seed}-->`
      },
      water: (x, y, seed, opts) => {
        calls.push({ kind: 'water', x, y, seed, opts })
        return `<!--water seed=${seed}-->`
      },
    }
    return { r, calls }
  }

  const samplePlan: WaterPlan = {
    baseline: { x: 300, y: 625, len: 1400, seed: 0xA17E },
    boats: [
      { x: 600, y: 595, fli: false, len: 140, boatSeed: 11, rippleSeed: 22 },
      { x: 2200, y: 605, fli: true, len: 140, boatSeed: 33, rippleSeed: 44 },
    ],
  }

  it('wraps only the baseline in the 0.35-opacity group', () => {
    const { r } = makeRenderers()
    const out = buildWaterAndBoats(samplePlan, r)
    expect(out).toContain('<g style="opacity:0.35"><!--water seed=41342--></g>')
    // Local ripples are OUTSIDE any opacity wrapper.
    expect(out).toContain('<!--water seed=22-->')
    expect(out).not.toContain('<g style="opacity:0.35"><!--water seed=22-->')
  })

  it('calls water for baseline first, then (ripples, boat) per placement', () => {
    const { r, calls } = makeRenderers()
    buildWaterAndBoats(samplePlan, r)
    expect(calls.map(c => `${c.kind}:${c.seed}`)).toEqual([
      'water:41342',   // baseline (0xA17E)
      'water:22',      // boat 0 ripples
      'boat:11',       // boat 0 hull
      'water:44',      // boat 1 ripples
      'boat:33',       // boat 1 hull
    ])
  })

  it('offsets ripples to (x-70, y+8) and passes boat len', () => {
    const { r, calls } = makeRenderers()
    buildWaterAndBoats(samplePlan, r)
    const ripple0 = calls.find(c => c.kind === 'water' && c.seed === 22)!
    expect(ripple0.x).toBe(530)
    expect(ripple0.y).toBe(603)
    expect(ripple0.opts).toEqual({ hei: 3, len: 140, clu: 2 })
  })

  it('passes boat options including fli through untouched', () => {
    const { r, calls } = makeRenderers()
    buildWaterAndBoats(samplePlan, r)
    const boatCalls = calls.filter(c => c.kind === 'boat')
    expect(boatCalls[0].opts).toEqual({ len: 140, sca: 1, fli: false })
    expect(boatCalls[1].opts).toEqual({ len: 140, sca: 1, fli: true })
  })

  it('returns a concatenated string starting with the baseline and ending with the last boat', () => {
    const { r } = makeRenderers()
    const out = buildWaterAndBoats(samplePlan, r)
    // Pure concatenation — easy to splice into the SVG string.
    expect(out.startsWith('<g style="opacity:0.35">')).toBe(true)
    expect(out.endsWith('<!--boat seed=33-->')).toBe(true)
  })
})
```

- [ ] **Step 3.2: Run tests to verify they fail**

```bash
pnpm test -- theme/composables/useHeroScene.boats.test.ts
```

Expected: FAIL — `buildWaterAndBoats` / `Renderers` not exported yet.

- [ ] **Step 3.3: Implement `Renderers` + `buildWaterAndBoats`**

Append to `theme/composables/useHeroScene.boats.ts`:

```ts
/**
 * Injectable renderers — matches the signatures of shuimo-core's
 * `Arch.boat01` and `Water.generate`. Injected so this module stays
 * shuimo-core-free and can be unit-tested with spies.
 */
export interface Renderers {
  boat: (
    x: number,
    y: number,
    seed: number,
    opts: { len: number, sca: number, fli: boolean }
  ) => string
  water: (
    x: number,
    y: number,
    seed: number,
    opts: { hei: number, len: number, clu: number }
  ) => string
}

const RIPPLE_X_OFFSET = -70 // ripple cluster starts left of boat center
const RIPPLE_Y_OFFSET = 8 // ripple cluster sits just below hull
const BASELINE_HEI = 2
const BASELINE_CLU = 2
const RIPPLE_HEI = 3
const RIPPLE_CLU = 2
const BASELINE_OPACITY = 0.35

/**
 * Render the theme-owned water + boat layer as an SVG fragment. Designed
 * to be appended immediately before `</svg>` in the hero scene so boats
 * render on top of everything the painter generated.
 *
 * Output order (and therefore z-order from bottom to top):
 *   1. faint baseline wrapped in <g opacity=0.35>
 *   2. for each boat: local ripples, then boat hull
 */
export function buildWaterAndBoats(plan: WaterPlan, r: Renderers): string {
  const baseline = r.water(plan.baseline.x, plan.baseline.y, plan.baseline.seed, {
    hei: BASELINE_HEI,
    len: plan.baseline.len,
    clu: BASELINE_CLU,
  })
  const parts: string[] = [`<g style="opacity:${BASELINE_OPACITY}">${baseline}</g>`]
  for (const b of plan.boats) {
    parts.push(r.water(b.x + RIPPLE_X_OFFSET, b.y + RIPPLE_Y_OFFSET, b.rippleSeed, {
      hei: RIPPLE_HEI,
      len: b.len,
      clu: RIPPLE_CLU,
    }))
    parts.push(r.boat(b.x, b.y, b.boatSeed, { len: b.len, sca: 1, fli: b.fli }))
  }
  return parts.join('')
}
```

- [ ] **Step 3.4: Run tests to verify they pass**

```bash
pnpm test -- theme/composables/useHeroScene.boats.test.ts
```

Expected: PASS (all tests across all describe blocks).

- [ ] **Step 3.5: Commit**

```bash
git add theme/composables/useHeroScene.boats.ts theme/composables/useHeroScene.boats.test.ts
git commit -m "feat(hero): add buildWaterAndBoats fragment composer

Composes the theme-owned water+boat SVG fragment with injectable
renderers. Output order encodes z-order: faint opacity-0.35 baseline
first, then per-boat ripples + hull."
```

---

## Task 4: Integrate into `useHeroScene.ts`

**Files:**
- Modify: `theme/composables/useHeroScene.ts`

This task is integration — it wires shuimo-core's `Arch` and `Water` into the planner and splices the result into the SVG returned by `PaintingGenerator.landscape()`. No new unit tests here (the composition logic is already covered in Task 3; shuimo-core's own renderers are tested upstream). Verification is type-check, lint, and the manual dev check in Task 5.

- [ ] **Step 4.1: Add `Arch` and `Water` to the shuimo-core import**

Current code at `theme/composables/useHeroScene.ts:18`:

```ts
  const { PaintingGenerator, Mount } = await import('@jobinjia/shuimo-core')
```

Change to:

```ts
  const { Arch, Mount, PaintingGenerator, Water } = await import('@jobinjia/shuimo-core')
```

- [ ] **Step 4.2: Add the boat-suppress override + try/finally around `PaintingGenerator.landscape()`**

Current code at `theme/composables/useHeroScene.ts:20-48` (the `distMount` override through the end of the `PaintingGenerator.landscape(...)` call):

```ts
  ;(Mount as { distMount: (...args: unknown[]) => string }).distMount = () => ''
  // ... comments ...

  const blankSide: 'left' | 'right' = seed % 2 === 0 ? 'left' : 'right'

  const NATIVE_TOP = -200
  const NATIVE_HEIGHT = 1000
  const nativeW = Math.round((W * NATIVE_HEIGHT) / H)

  const result = PaintingGenerator.landscape({
    width: nativeW,
    height: NATIVE_HEIGHT,
    seed,
    onXuanPaper: false,
    blankPosition: 'none',
    minCounts: { mount: 6, flatmount: 3, arch01: 2, arch03: 1, boat: 1 },
  })
```

Rewrite the block so:
1. `Arch.boat01` is saved, replaced with `() => ''`, restored in `finally`.
2. `minCounts.boat` drops to 0 (we draw our own).

```ts
  ;(Mount as { distMount: (...args: unknown[]) => string }).distMount = () => ''
  // 注：人物由 shuimo-core 原生处理 —— Arch.arch01 内部 randChoice 0~2 个人。
  // 船由主题层自绘（见 useHeroScene.boats），保证 1~2 艘可见 + 水面涟漪，
  // 因此这里先把 Arch.boat01 替成 no-op，让 PaintingGenerator 不画船。

  const blankSide: 'left' | 'right' = seed % 2 === 0 ? 'left' : 'right'

  const NATIVE_TOP = -200
  const NATIVE_HEIGHT = 1000
  const nativeW = Math.round((W * NATIVE_HEIGHT) / H)

  const origBoat01 = Arch.boat01.bind(Arch)
  ;(Arch as { boat01: (...args: unknown[]) => string }).boat01 = () => ''

  let result
  try {
    result = PaintingGenerator.landscape({
      width: nativeW,
      height: NATIVE_HEIGHT,
      seed,
      onXuanPaper: false,
      blankPosition: 'none',
      // boat 不再由 PaintingGenerator 负责（被 no-op 掉了）。
      minCounts: { mount: 6, flatmount: 3, arch01: 2, arch03: 1 },
    })
  }
  finally {
    ;(Arch as { boat01: typeof origBoat01 }).boat01 = origBoat01
  }
```

- [ ] **Step 4.3: Add the `planBoats` + `buildWaterAndBoats` call and splice into SVG**

Current code at `theme/composables/useHeroScene.ts:50-60` (the post-processing regex block through `return`):

```ts
  const svg = result.svg
    .replace(/viewBox="0 0 [^"]+"/, `viewBox="0 ${NATIVE_TOP} ${nativeW} ${NATIVE_HEIGHT}"`)
    .replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ')
    .replace(/fill\s*:\s*white/gi, 'fill:#fcfaf0')

  return { svg, blankSide, seed }
```

Replace with a splice of the theme-owned fragment before `</svg>`:

```ts
  const plan = planBoats(nativeW, seed)
  const fragment = buildWaterAndBoats(plan, {
    boat: (x, y, s, opts) => Arch.boat01(x, y, s, opts),
    water: (x, y, s, opts) => Water.generate(x, y, s, opts),
  })

  const svg = result.svg
    .replace(/viewBox="0 0 [^"]+"/, `viewBox="0 ${NATIVE_TOP} ${nativeW} ${NATIVE_HEIGHT}"`)
    .replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ')
    .replace(/fill\s*:\s*white/gi, 'fill:#fcfaf0')
    .replace(/<\/svg>\s*$/, `${fragment}</svg>`)

  return { svg, blankSide, seed }
```

- [ ] **Step 4.4: Add the import for the planner module**

At the top of `theme/composables/useHeroScene.ts`, before `export interface HeroScene`:

```ts
import { buildWaterAndBoats, planBoats } from './useHeroScene.boats'
```

- [ ] **Step 4.5: Run the full test suite**

```bash
pnpm test
```

Expected: PASS — existing tests still green, new `useHeroScene.boats` tests still green.

- [ ] **Step 4.6: Run typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If the `as { boat01: ... }` casts complain, copy the exact shape from the `Mount.distMount` override already in the file.

- [ ] **Step 4.7: Run lint**

```bash
pnpm lint
```

Expected: no errors. If antfu rules flag the `;(Arch as ...)` leading semicolons, match the existing `;(Mount as ...)` style on line 20 — they coexist fine.

- [ ] **Step 4.8: Commit**

```bash
git add theme/composables/useHeroScene.ts
git commit -m "feat(hero): guarantee 1-2 boats with fishermen on a water surface

Suppresses shuimo-core's internal Arch.boat01 during PaintingGenerator
.landscape() (matching the existing Mount.distMount override pattern),
then splices a theme-owned fragment in before </svg>: a faint long
baseline water stroke (opacity 0.35) plus 1-2 boats each with their
own local ripple cluster. Boats render last so mountains/buildings
can never occlude them.

Refs: docs/superpowers/specs/2026-04-24-hero-boats-water-surface-design.md"
```

---

## Task 5: Manual dev verification

**Files:** none (verification only).

- [ ] **Step 5.1: Start the demo in dev mode**

```bash
pnpm dev
```

Open whatever URL it prints (usually `http://localhost:4859` — check output).

- [ ] **Step 5.2: Verify boats appear at default viewport**

On the home page:
- Scroll to / observe the hero landscape area.
- Confirm at least one boat with a visible seated figure and fishing rod.
- Confirm a faint continuous horizontal wavy line across the lower third.
- Confirm denser ripple strokes directly under each boat.

- [ ] **Step 5.3: Exercise several seeds**

Open `demo/valaxy.config.ts` (or `demo/site.config.ts` — whichever holds theme config) and temporarily force a seed:

```ts
// in the theme config block
hero: {
  seed: 1,
}
```

Reload, observe scene. Repeat for seeds `2, 7, 42, 100, 777`. For each:
- 1 or 2 boats rendered (never 0, never 3+).
- Fishermen visible on every boat.
- Ripples under each boat.
- Two-boat scenes have one boat in the left third, one in the right third, each fisherman facing inward.

After verification, revert the seed override.

- [ ] **Step 5.4: Resize to multiple widths**

With DevTools device toolbar:
- 1280 × 800
- 1920 × 1080
- 3440 × 1440 (or DevTools custom width)
- 800 × 600 (narrow — must show exactly 1 boat)

At each, reload and confirm the guarantees above. Narrow viewport must clamp to 1 boat.

- [ ] **Step 5.5: Toggle dark mode**

Click the theme toggle. Confirm boats and both water layers invert cleanly with the rest of the landscape (no light-colored ink blobs, no halos).

- [ ] **Step 5.6: Revert any demo tweaks and confirm git is clean**

```bash
git status
```

Expected: working tree clean (only the Task 4 commit should be new).

If verification failed at any step, STOP — file findings and return to the relevant task. Do **not** paper over rendering issues by loosening the planner thresholds without a design discussion first.

---

## Post-Completion Checklist

- [ ] All tests pass (`pnpm test`).
- [ ] `pnpm typecheck` clean.
- [ ] `pnpm lint` clean.
- [ ] Demo verified at 4+ widths and both color modes.
- [ ] Spec file is still the source of truth — no new requirements snuck into the plan without updating the spec.
- [ ] No changes outside `theme/composables/` and the committed spec/plan docs.
