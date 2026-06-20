// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FALLBACK_LOCATION,
  moonScreenPos,
  moonShadowPath,
  parseLocationFromUrl,
  readLocationOverride,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'

describe('moonScreenPos (suncalc v2: degrees, north-based clockwise azimuth)', () => {
  it('hides moon when altitude is below the horizon', () => {
    // altitude = -5 degrees
    const pos = moonScreenPos(-5, 180, 30)
    expect(pos.hidden).toBe(true)
  })

  it('hides moon when altitude is exactly at the horizon (0°)', () => {
    const pos = moonScreenPos(0, 180, 30)
    expect(pos.hidden).toBe(true)
  })

  it('places moon at south-center when azimuth=180° (north-based south)', () => {
    // v2: azimuth 180° = south
    const pos = moonScreenPos(30, 180, 30)
    expect(pos.hidden).toBe(false)
    expect(pos.x).toBeCloseTo(50, 1)
  })

  it('places moon to the right (east) when azimuth < 180° (east side)', () => {
    // v2: azimuth 120° = ESE (east of south)
    const pos = moonScreenPos(20, 120, 30)
    expect(pos.x).toBeGreaterThan(50)
  })

  it('places moon to the left (west) when azimuth > 180° (west side)', () => {
    // v2: azimuth 240° = WSW (west of south)
    const pos = moonScreenPos(20, 240, 30)
    expect(pos.x).toBeLessThan(50)
  })

  it('mirrors X for southern-hemisphere observers', () => {
    // v2: azimuth 120° = east of south
    const north = moonScreenPos(20, 120, 30)
    const south = moonScreenPos(20, 120, -30)
    expect(north.x + south.x).toBeCloseTo(100, 1)
  })

  it('places moon higher (smaller y) when nearer transit (south, az=180°) than near the edges', () => {
    // v2: azimuth 80° = ENE (far from south) vs 180° = south (transit)
    const nearEdge = moonScreenPos(20, 80, 30)
    const atTransit = moonScreenPos(20, 180, 30)
    expect(atTransit.y).toBeLessThan(nearEdge.y)
  })

  it('clamps azimuth outside the visible range to the nearest edge', () => {
    // v2: azimuth 30° = NNE (far east, well beyond ±120° from south)
    // azimuth 60° = ENE (also past the 120° clamp from south)
    const farEast = moonScreenPos(20, 30, 30)
    const justEast = moonScreenPos(20, 60, 30)
    expect(farEast.x).toBeCloseTo(justEast.x, 1)
  })
})

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

  it('url beats localStorage beats config beats fallback', () => {
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
