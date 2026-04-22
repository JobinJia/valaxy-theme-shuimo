import type { ComputedRef } from 'vue'
import type { Location } from './astronomy'
import type { MoonPhaseKey } from './useMoonPhase'
import * as SunCalcNs from 'suncalc'
import { computed, onUnmounted, ref } from 'vue'
import {
  celestialScreenPos,
  FALLBACK_LOCATION,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'
import { moonPhaseI18nKey } from './useMoonPhase'
import { getSolarTerm, getTimeOfDay } from './useSolarTerm'

// suncalc ships as UMD/CJS (`module.exports = SunCalc`). Consumer Vite
// dep-optimizes it with only a `default` export; native ESM / Vitest mocks
// expose named members directly. Unwrap both shapes so destructuring works.
const SunCalc = ((SunCalcNs as any).default ?? SunCalcNs) as typeof SunCalcNs
const { getMoonIllumination, getMoonPosition, getPosition } = SunCalc

const REFRESH_MS = 60_000

export interface AstronomyOptions {
  configLocation?: Location
  allowVisitorOverride?: boolean
}

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

  const moonPos = getMoonPosition(now, location.lat, location.lng)
  const illum = getMoonIllumination(now)
  const moonScreen = celestialScreenPos(moonPos.altitude, moonPos.azimuth, location.lat)

  const sunPos = getPosition(now, location.lat, location.lng)
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
