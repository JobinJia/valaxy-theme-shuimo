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
 * Map (altitude, azimuth) → screen position inside Hero for any celestial
 * body (moon, sun, …). Northern-hemisphere observer faces south;
 * southern-hemisphere mirrored.
 *
 * Y is a parabolic function of azimuth (purely visual arc), NOT of altitude.
 * Altitude is only consulted to decide visibility (hidden when below horizon).
 * This trades astronomical purity for a smooth elegant arc shape — the
 * moon enters at one screen edge near the bottom, traces an arc up through
 * the centre, and exits at the other edge. No "vertical drop at horizon".
 */
const AZIMUTH_RANGE_DEG = 120 // wider than ±90° so seasonal arcs (high/low declination) don't pin to edges

export function celestialScreenPos(altitudeRad: number, azimuthRad: number, lat: number): ScreenPos {
  if (altitudeRad <= 0)
    return { x: 0, y: 0, hidden: true }

  const azDeg = Math.max(-AZIMUTH_RANGE_DEG, Math.min(AZIMUTH_RANGE_DEG, azimuthRad * R2D))
  // azNorm: 0 = east edge, 0.5 = south, 1 = west edge
  const azNorm = (azDeg + AZIMUTH_RANGE_DEG) / (AZIMUTH_RANGE_DEG * 2)

  let xPct = 100 - azNorm * 100

  if (lat < 0)
    xPct = 100 - xPct

  // Parabolic arc: Y peaks at the centre, drops to the bottom of the sky band at both edges.
  // Horizon at y=25% (sky band sits above the mountains — 山遮日/月 mostly gone, trade-off
  // for a consistently-high celestial body).
  // Peak at y=5% so the sun / moon still clearly rise toward the top at transit.
  const arcHeight = 1 - (2 * azNorm - 1) ** 2 // 1 at centre, 0 at edges
  const yPct = 25 - 20 * arcHeight

  return { x: xPct, y: yPct, hidden: false }
}

/** @deprecated use `celestialScreenPos` — alias kept for compatibility */
export const moonScreenPos = celestialScreenPos

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
  let rx = Math.abs(cos) * R
  // Round to avoid floating-point artifacts (e.g., 1.8e-15 → 0)
  rx = Math.round(rx * 1e10) / 1e10

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
