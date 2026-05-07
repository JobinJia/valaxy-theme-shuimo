export type MoonPhaseKey
  = | 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
    | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent'

/** Map suncalc `illumination.phase` (0..1) to an i18n key. */
export function moonPhaseI18nKey(phase: number): MoonPhaseKey {
  if (phase >= 1)
    return 'new'
  const p = phase % 1 // wrap into [0, 1)
  // 升序 if-ladder：每个判断 1 次比较 + 早返回；之前是 for-of 8 项含对象解构
  if (p < 0.04)
    return 'new'
  if (p < 0.22)
    return 'waxing_crescent'
  if (p < 0.28)
    return 'first_quarter'
  if (p < 0.47)
    return 'waxing_gibbous'
  if (p < 0.53)
    return 'full'
  if (p < 0.72)
    return 'waning_gibbous'
  if (p < 0.78)
    return 'last_quarter'
  return 'waning_crescent'
}
