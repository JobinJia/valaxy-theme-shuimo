// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FALLBACK_LOCATION,
  moonScreenPos,
  parseLocationFromUrl,
  readLocationOverride,
  resolveLocation,
  writeLocationOverride,
} from './astronomy'

const D2R = Math.PI / 180

describe('moonScreenPos', () => {
  it('hides moon when altitude is below the horizon', () => {
    const pos = moonScreenPos(-5 * D2R, 0, 30)
    expect(pos.hidden).toBe(true)
  })

  it('hides moon when altitude is exactly at the horizon (0°)', () => {
    const pos = moonScreenPos(0, 0, 30)
    expect(pos.hidden).toBe(true)
  })

  it('places moon at south-center when azimuth=0 (suncalc south=0)', () => {
    const pos = moonScreenPos(30 * D2R, 0, 30)
    expect(pos.hidden).toBe(false)
    expect(pos.x).toBeCloseTo(50, 1)
  })

  it('places moon to the right (east) when azimuth is negative', () => {
    const pos = moonScreenPos(20 * D2R, -60 * D2R, 30)
    expect(pos.x).toBeGreaterThan(50)
  })

  it('places moon to the left (west) when azimuth is positive', () => {
    const pos = moonScreenPos(20 * D2R, 60 * D2R, 30)
    expect(pos.x).toBeLessThan(50)
  })

  it('mirrors X for southern-hemisphere observers', () => {
    const north = moonScreenPos(20 * D2R, -60 * D2R, 30)
    const south = moonScreenPos(20 * D2R, -60 * D2R, -30)
    expect(north.x + south.x).toBeCloseTo(100, 1)
  })

  it('places moon higher (smaller y) for higher altitudes', () => {
    const low = moonScreenPos(5 * D2R, 0, 30)
    const high = moonScreenPos(50 * D2R, 0, 30)
    expect(high.y).toBeLessThan(low.y)
  })

  it('clamps azimuth outside [-90°, 90°] to the nearest edge', () => {
    const farEast = moonScreenPos(20 * D2R, -120 * D2R, 30)
    const justEast = moonScreenPos(20 * D2R, -90 * D2R, 30)
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

  it('URL beats localStorage beats config beats fallback', () => {
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
