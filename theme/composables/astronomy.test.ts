import { describe, expect, it } from 'vitest'
import { moonScreenPos } from './astronomy'

const D2R = Math.PI / 180

describe('moonScreenPos', () => {
  it('hides moon when altitude is below the horizon', () => {
    const pos = moonScreenPos(-5 * D2R, 0, 30)
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
