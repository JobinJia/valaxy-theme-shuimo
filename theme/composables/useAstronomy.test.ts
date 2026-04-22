// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

vi.mock('suncalc', () => ({
  getMoonPosition: vi.fn(() => ({
    altitude: 0.5,
    azimuth: 0,
    distance: 384000,
    parallacticAngle: 0,
  })),
  getMoonIllumination: vi.fn(() => ({ fraction: 0.5, phase: 0.25, angle: 0 })),
  getPosition: vi.fn(() => ({ altitude: 0.4, azimuth: 0 })),
}))

// eslint-disable-next-line import/first
import * as suncalc from 'suncalc'
// eslint-disable-next-line import/first
import { _resetAstronomyForTests, useAstronomy } from './useAstronomy'

describe('useAstronomy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T22:00:00+08:00'))
    localStorage.clear()
    _resetAstronomyForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('exposes a reactive state with screen pos + phase key', () => {
    const { state } = useAstronomy({
      configLocation: { lat: 29.56, lng: 106.55, name: '重庆' },
      allowVisitorOverride: true,
    })
    expect(state.value.moon.hidden).toBe(false)
    expect(state.value.moon.phaseKey).toBe('first_quarter')
    expect(state.value.location.lat).toBe(29.56)
    expect(state.value.sun.hidden).toBe(false)
    expect(state.value.solarTermName).toBe('谷雨')
  })

  it('refreshes once per 60 s tick', async () => {
    useAstronomy({ allowVisitorOverride: true })
    const initialCalls = (suncalc.getMoonPosition as any).mock.calls.length
    const initialSunCalls = (suncalc.getPosition as any).mock.calls.length

    vi.advanceTimersByTime(60_000)
    await nextTick()

    expect((suncalc.getMoonPosition as any).mock.calls.length).toBe(initialCalls + 1)
    expect((suncalc.getPosition as any).mock.calls.length).toBe(initialSunCalls + 1)
  })

  it('shares one interval across multiple subscribers', async () => {
    useAstronomy({ allowVisitorOverride: true })
    useAstronomy({ allowVisitorOverride: true })
    const before = (suncalc.getMoonPosition as any).mock.calls.length
    const beforeSun = (suncalc.getPosition as any).mock.calls.length

    vi.advanceTimersByTime(60_000)
    await nextTick()

    // Only one extra call across both subscribers
    expect((suncalc.getMoonPosition as any).mock.calls.length).toBe(before + 1)
    expect((suncalc.getPosition as any).mock.calls.length).toBe(beforeSun + 1)
  })

  it('setVisitorLocation updates location and persists to localStorage', async () => {
    const { state, setVisitorLocation } = useAstronomy({
      configLocation: { lat: 29.56, lng: 106.55 },
      allowVisitorOverride: true,
    })
    setVisitorLocation({ lat: 30.27, lng: 120.15 })
    await nextTick()

    expect(state.value.location.lat).toBe(30.27)
    expect(localStorage.getItem('shuimo:astronomy:override'))
      .toBe(JSON.stringify({ lat: 30.27, lng: 120.15 }))
  })

  it('clearVisitorOverride restores blogger location', async () => {
    const { state, setVisitorLocation, clearVisitorOverride } = useAstronomy({
      configLocation: { lat: 29.56, lng: 106.55 },
      allowVisitorOverride: true,
    })
    setVisitorLocation({ lat: 1, lng: 2 })
    await nextTick()
    clearVisitorOverride()
    await nextTick()

    expect(state.value.location.lat).toBe(29.56)
    expect(localStorage.getItem('shuimo:astronomy:override')).toBeNull()
  })
})
