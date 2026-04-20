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
