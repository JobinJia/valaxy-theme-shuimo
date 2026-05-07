import type { ComputedRef } from 'vue'
import type { Location } from './astronomy'
import type { MoonPhaseKey } from './useMoonPhase'
import type { TimedCallbackHandle } from './useTimedCallback'
import * as SunCalcNs from 'suncalc'
import { computed, getCurrentInstance, onUnmounted, ref } from 'vue'
import {
  celestialScreenPos,
  FALLBACK_LOCATION,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'
import { moonPhaseI18nKey } from './useMoonPhase'
import { getSolarTerm, getTimeOfDay } from './useSolarTerm'
import { intervalCallback } from './useTimedCallback'

// suncalc ships as UMD/CJS (`module.exports = SunCalc`) and surfaces under
// several shapes depending on the consumer's bundler state:
//   1. top-level namespace — native ESM / Vitest mocks
//   2. ns.default — Vite dep-optimized CJS
//   3. ns.default.default — Vite 8 + rolldown when the dep-scan phase crashes
//      and falls through to the runtime CJS→ESM shim
// Probe each layer for the real methods instead of guessing based on `.default`.
export function _pickSunCalc(ns: any): typeof SunCalcNs {
  const candidates = [ns, ns?.default, ns?.default?.default]
  for (const c of candidates) {
    if (c && typeof c.getMoonPosition === 'function')
      return c
  }
  const keys = ns && typeof ns === 'object' ? Object.keys(ns).join(',') : typeof ns
  throw new TypeError(`[shuimo-theme] Failed to unwrap suncalc module; shape: ${keys}`)
}
const SunCalc = _pickSunCalc(SunCalcNs)
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
let intervalHandle: TimedCallbackHandle | null = null
let subscriberCount = 0
let currentOptions: Required<AstronomyOptions> = {
  configLocation: FALLBACK_LOCATION,
  allowVisitorOverride: true,
}
// location 缓存：parseLocationFromUrl + readLocationOverride 各一次解析+读 localStorage，
// 没必要每分钟 refresh 都重做。仅在 options/visitor override 变化时显式 invalidate
let cachedLocation: Location | null = null
function invalidateLocation() {
  cachedLocation = null
}
function getLocation(opts: Required<AstronomyOptions>): Location {
  if (cachedLocation)
    return cachedLocation
  const search = typeof window !== 'undefined' ? window.location.search : ''
  cachedLocation = resolveLocation({
    configLocation: opts.configLocation,
    allowVisitorOverride: opts.allowVisitorOverride,
    search,
  })
  return cachedLocation
}

// stateRef lazy 初始化：模块顶层 compute 会触发 SunCalc 计算，SSR 进入此模块也会跑，
// 而 SSR 的快照马上会被客户端 hydrate 后的首次 refresh 覆盖，是浪费
const stateRef = ref<AstronomyState | null>(null)

function compute(opts: Required<AstronomyOptions>): AstronomyState {
  const location = getLocation(opts)
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
  if (intervalHandle) {
    intervalHandle.cancel()
    intervalHandle = null
  }
  subscriberCount = 0
  currentOptions = {
    configLocation: FALLBACK_LOCATION,
    allowVisitorOverride: true,
  }
  invalidateLocation()
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
  const newOptions = {
    configLocation: opts.configLocation ?? currentOptions.configLocation ?? FALLBACK_LOCATION,
    allowVisitorOverride: opts.allowVisitorOverride ?? currentOptions.allowVisitorOverride ?? true,
  }
  // options 变才需要 invalidate location 缓存（不 invalidate 会用旧 cached location）
  if (newOptions.configLocation !== currentOptions.configLocation
    || newOptions.allowVisitorOverride !== currentOptions.allowVisitorOverride) {
    invalidateLocation()
  }
  currentOptions = newOptions
  refresh()

  subscriberCount++
  if (intervalHandle === null && typeof window !== 'undefined')
    intervalHandle = intervalCallback(REFRESH_MS, refresh)

  // 只在组件 setup 内才挂 onUnmounted，否则（router guard / module top-level 调用）
  // Vue 会警告且永远不会减计数，导致 subscriberCount 单调上涨、interval 永不释放
  if (getCurrentInstance()) {
    onUnmounted(() => {
      subscriberCount--
      if (subscriberCount <= 0 && intervalHandle !== null) {
        intervalHandle.cancel()
        intervalHandle = null
        subscriberCount = 0
      }
    })
  }

  function setVisitorLocation(loc: Location) {
    if (!currentOptions.allowVisitorOverride)
      return
    writeLocationOverride(loc)
    invalidateLocation()
    refresh()
  }

  function clearVisitorOverride() {
    writeLocationOverride(null)
    invalidateLocation()
    refresh()
  }

  return {
    // stateRef lazy 初始化后第一次 refresh 已经填好；模板访问时 stateRef.value 必然 truthy
    state: computed(() => stateRef.value!),
    setVisitorLocation,
    clearVisitorOverride,
  }
}
