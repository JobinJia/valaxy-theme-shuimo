export type MoonPhaseKey =
  | 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent'

interface PhaseRange {
  key: MoonPhaseKey
  /** [start, end) of suncalc.phase ∈ [0, 1) */
  range: [number, number]
}

const PHASES: PhaseRange[] = [
  { key: 'new',              range: [0,    0.04] },
  { key: 'waxing_crescent',  range: [0.04, 0.22] },
  { key: 'first_quarter',    range: [0.22, 0.28] },
  { key: 'waxing_gibbous',   range: [0.28, 0.47] },
  { key: 'full',             range: [0.47, 0.53] },
  { key: 'waning_gibbous',   range: [0.53, 0.72] },
  { key: 'last_quarter',     range: [0.72, 0.78] },
  { key: 'waning_crescent',  range: [0.78, 1] },
]

/** Map suncalc `illumination.phase` (0..1) to an i18n key. */
export function moonPhaseI18nKey(phase: number): MoonPhaseKey {
  if (phase >= 1)
    return 'new'
  const p = phase % 1 // wrap into [0, 1)
  for (const { key, range } of PHASES) {
    if (p >= range[0] && p < range[1])
      return key
  }
  return 'new'
}
