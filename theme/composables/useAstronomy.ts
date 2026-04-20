import type { ComputedRef } from 'vue'
import type { Location } from './astronomy'
import type { MoonPhaseKey } from './useMoonPhase'
import suncalc from 'suncalc'
import { computed, onUnmounted, ref } from 'vue'
import {
  FALLBACK_LOCATION,

  moonScreenPos,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'
import { moonPhaseI18nKey } from './useMoonPhase'
import { getTimeOfDay } from './useSolarTerm'

const REFRESH_MS = 60_000

export interface AstronomyOptions {
  configLocation?: Location
  allowVisitorOverride?: boolean
}

export interface AstronomyState {
  location: Location
  hidden: boolean
  x: number // % of width
  y: number // % of height
  illumination: number // 0..1
  phase: number // 0..1
  phaseKey: MoonPhaseKey
  parallacticAngleDeg: number
  shichen: string // 子 / 丑 / 寅 / ...
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
  // Module-level options state — most-recent caller wins. In practice
  // ShuimoMoon and ShuimoNightSky both pass the same astronomyConfig from
  // the shared themeConfig, so this can't diverge. If a future caller passes
  // different options (especially `allowVisitorOverride`), the new value will
  // affect setVisitorLocation/clearVisitorOverride behavior for ALL active
  // subscribers — not just the new one.
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
