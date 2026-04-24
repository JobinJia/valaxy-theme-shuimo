# Hero Landscape — Guaranteed Boats + Water Surface

**Date:** 2026-04-24
**Status:** Approved, awaiting implementation plan
**Area:** `theme/composables/useHeroScene.ts` (+ optional helper file)

## Problem

Two issues with the hero landscape scene:

1. **Boats are unreliable.** `PaintingGenerator.landscape()` in `@jobinjia/shuimo-core` places boats via its own random planner; `minCounts.boat = 1` only guarantees a plan item, not on-screen visibility. Mountains and buildings with larger y values draw **on top** of boats under the painter's algorithm, so foreground mountains silently occlude them. At ultra-wide viewports boats can also end up visually negligible.
2. **Water surface is implicit.** The lower third of the scene reads as "water" only because paper is blank there. There is no ink articulation that says *this is water*, so boats look like they sit on paper rather than float.

## Goal

Every hero render shows **1 or 2 boats**, each with its fisherman visible, grounded in a legible water surface:

- **Local ripples** right under each boat (dense, full-strength ink).
- **Faint continuous baseline** spanning the lower scene (low opacity), reading as a horizon of water.

Determinism (same seed → same composition), dark mode, and blend behavior all preserved.

## Non-Goals

- No animation. Ripples are static ink.
- No new theme-config knobs for boat count or water styling. Defaults only; parameterize later if needed.
- No changes to `@jobinjia/shuimo-core`. All work is theme-side, using the library's public API.
- No changes to `ShuimoHeroLandscape.vue`, the worker protocol, or the caching layer.

## Architecture

Single composite SVG through the existing worker pipeline. No second DOM layer, no second image, no new async boundaries. The worker still returns one PNG blob per scene; cache, mix-blend-mode, and dark-mode filter all keep working unchanged.

```
buildHeroScene(W, H, seed) inside hero-scene worker
  │
  ├─ monkey-patch shuimo-core internals (reversible):
  │     Mount.distMount = () => ''          // already present
  │     Arch.boat01     = () => ''          // NEW: suppress library boats
  │
  ├─ PaintingGenerator.landscape({...})     // produces base SVG — mountains,
  │                                         // architecture, trees, no boats
  │
  ├─ restore Arch.boat01 to its original reference
  │
  ├─ buildWaterAndBoats(nativeW, seed)      // NEW: returns SVG fragment
  │     ├─ faint baseline Water.generate(...)  inside <g style="opacity:.35">
  │     ├─ 1 or 2 boat entries:
  │     │     ├─ local ripples Water.generate(...)  (full opacity)
  │     │     └─ Arch.boat01(x, y, seed', { len, sca, fli })
  │     └─ ordering matters: baseline first, then per-boat (ripples, boat)
  │
  └─ splice fragment in immediately before </svg>
```

Because our fragment is the last content in the SVG, its elements render on top of everything the painter already drew. Boats and their ripples can never be occluded by mountains, buildings, or trees.

## Detailed Design

### 1. Suppress the library's boats

Match the existing `Mount.distMount` override at `useHeroScene.ts:20`. Save the original reference before replacement and restore it immediately after the `PaintingGenerator.landscape()` call (not in a `finally`; the call is synchronous for our purposes but we want the real function back so our own fragment builder can invoke it).

```ts
const origBoat = Arch.boat01.bind(Arch)
;(Arch as any).boat01 = () => ''
try {
  result = PaintingGenerator.landscape({...})
} finally {
  ;(Arch as any).boat01 = origBoat
}
```

Rationale for monkey-patching rather than filtering SVG output: the generated SVG does not tag individual elements by kind, so identifying/removing only boat paths post-hoc would be fragile. Suppressing at the source matches the established `distMount` precedent in the same file.

### 2. Count decision

```
if (nativeW < 1200)           boatCount = 1
else if (prng() < 0.55)       boatCount = 2
else                          boatCount = 1
```

The 1200-px clamp prevents visibly crowded two-boat layouts at narrow hero widths. The 55% bias toward two boats gives scenes more visual interest without making single-boat scenes rare.

### 3. Boat positioning

Native scene coordinate system: x ∈ [0, nativeW], y ∈ [-200, 800] (viewBox from `useHeroScene.ts:56`). Water band: y = 590–610, inside shuimo-core's own boat y range (`yBase 300 + yJitter → 690`, per `MountPlanner`) but tightened so boats cluster in a single visual water zone. Z-order is not a concern — our fragment is spliced last, so boats render on top of everything regardless of y.

**Single boat:**
- `x = nativeW * (0.35 + prng() * 0.30)` — middle 30% of the canvas
- `y = 600 + (prng() - 0.5) * 20`
- `fli = prng() < 0.5` — free orientation since there's no "outward edge"

**Two boats:**
- `x_left  = nativeW * (0.22 + prng() * 0.10)` — ~22–32%
- `x_right = nativeW * (0.68 + prng() * 0.10)` — ~68–78%
- Each `y` independently at `600 ± 10`
- `fli_left = false` (fisherman faces right, into scene)
- `fli_right = true` (fisherman faces left, into scene)

Each boat consumes a derived sub-seed `(seed * 37 + i * 101) >>> 0` (or equivalent deterministic derivation) so that `Arch.boat01`'s internal RNG is stable per seed per slot.

### 4. Boat size

```
{ len: 140, sca: 1, fli }
```

`len = 140` is chosen to read clearly at viewports ≥ 1280px without dominating at smaller ones. No scaling with `nativeW`; the outer `<img object-fit:cover>` already handles viewport fit. A fixed native size keeps boats visually consistent across displays.

### 5. Water fragments

Using `Water.generate(xoff, yoff, seed, { hei, len, clu })` from shuimo-core:

**Faint baseline (always present):**
```ts
<g style="opacity:0.35">
  Water.generate(
    nativeW * 0.15,          // xoff — start 15% in
    625,                     // yoff — below boat line
    seed ^ 0xA17E,           // independent sub-seed
    { hei: 2, len: nativeW * 0.70, clu: 2 }
  )
</g>
```

Low amplitude, long span, sparse clusters, 35% opacity. Reads as a suggestive waterline, never competing with local ripples.

**Local ripples (per boat):**
```ts
Water.generate(
  boat.x - 70,
  boat.y + 8,                // slightly below hull
  boatSubSeed ^ 0xB0A7,
  { hei: 3, len: 140, clu: 2 }
)
```

Full opacity, amplitude `hei=3`, `len` matches the boat's native length, centered under the hull. Fragment order inside our splice: baseline `<g>` first, then for each boat `(ripples, boat)` in sequence — so the boat sits on top of its ripples, and all local ripples sit on top of the faint baseline.

### 6. Determinism

All randomness routes through one deterministic PRNG seeded from the outer `seed` (implementation can use shuimo-core's exported `PRNG` class or a tiny local mulberry32 — the implementation plan picks one). The decision sequence is fixed:

1. `prng()` for boat count
2. For each boat: position `prng()`s, then derive its sub-seed, then the ripple sub-seed
3. Baseline sub-seed is a direct XOR of `seed` (no PRNG consumption)

Same seed, same PRNG consumption order → same composition. Mirrors the determinism contract already guaranteed by `PaintingGenerator`.

### 7. SVG splicing

The post-processing block at `useHeroScene.ts:55–58` already does three `String.prototype.replace` calls on `result.svg`. Add a fourth:

```ts
.replace(/<\/svg>\s*$/, `${waterAndBoatsFragment}</svg>`)
```

The `\s*$` guards against trailing whitespace. Fragment is a plain string concatenation of `<g>...</g>` blocks — no XML parsing needed.

## File Changes

- `theme/composables/useHeroScene.ts` — add boat suppression, restore, fragment splice. Estimated +40 lines.
- `theme/composables/useHeroScene.water.ts` (new, conditional) — if `buildWaterAndBoats` grows past ~80 lines, split it out. Otherwise keep it as a private helper in `useHeroScene.ts`.

Nothing else in `theme/` changes. No `demo/` edits.

## Preserved Invariants

- **Worker safety.** All added code is pure — uses the same `@jobinjia/shuimo-core` imports already in the file, no DOM, no Vue. Runs inside `hero-scene.worker.ts` unchanged.
- **Cache key.** Seed alone still determines output. `ShuimoHeroLandscape.vue`'s in-memory cache remains correct.
- **Mix-blend-mode.** Single `<img>`, same `multiply`. New boats/water get the same paper-multiply as every other ink stroke.
- **Dark mode.** Inherits `html.dark .shuimo-hero-landscape__svg { filter: invert(.88) hue-rotate(180deg) }` automatically.
- **Ultra-wide support.** Recent fix (`f702a1b`) removed the 1920px cap. The boat narrow-width fallback kicks in at nativeW < 1200, which maps to small viewports, not ultra-wide ones.

## Risks & Open Questions

- **Risk: Arch.boat01 restore leaks across calls.** If a render throws between override and restore, subsequent calls to `Arch.boat01` stay no-op. Mitigation: wrap in `try/finally`.
- **Risk: Ripples at mount/boat boundary.** A boat placed at the extreme left (~22%) could have its ripple run off the left edge. `len=140` × 22% × typical nativeW (2000+) keeps us well inside, but verify visually.
- **Open: baseline on narrow viewports?** Currently always on. If narrow hero scenes feel crowded, can gate behind `nativeW >= 1400` in a follow-up. Not blocking.

## Verification

- Open demo in dev mode at multiple viewport widths (1280, 1920, 3440). At each, force several seeds via `themeConfig.hero.seed` and confirm every render shows 1–2 boats with visible fishermen and ripples beneath them.
- Reload a single seed 3× and confirm byte-identical PNG (or at least identical boat count/positions).
- Toggle dark mode and confirm boats + water invert cleanly with the rest of the scene.

## Out of Scope (Follow-ups)

- Theme config exposure for `boatCount`, `waterBaseline`, `rippleIntensity`.
- Wider variety of boat types (shuimo-core only ships `boat01` today).
- Animated ripples (would need a separate rendering path outside the PNG cache).
