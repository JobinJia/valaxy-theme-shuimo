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
