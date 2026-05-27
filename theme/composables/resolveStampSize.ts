import type { ThemeConfig } from '../types'

/**
 * Resolve the vnav 主"作者印章" 尺寸 with the documented 3-layer fallback:
 *   stamp.nav.mainSize > stamp.size > 56 (vnav-specific historical value)
 *
 * Extracted so the priority chain is unit-testable without mounting
 * ShuimoVerticalNav.vue (no vue-test-utils in this repo).
 */
export function resolveVnavMainStampSize(stamp: ThemeConfig['stamp'] | undefined | null): number {
  return stamp?.nav?.mainSize ?? stamp?.size ?? 56
}

/**
 * Generic 2-layer fallback for非-vnav 非-curtain 非-post 的印章 (about page,
 * solar seal, theme toggle, mobile inscription):
 *   stamp.size > componentDefault
 *
 * Lets blog authors set a single `stamp.size` to scale every non-specialized
 * seal at once, without forcing them to also remember per-component overrides.
 */
export function resolveStampSize(
  stamp: ThemeConfig['stamp'] | undefined | null,
  componentDefault: number,
): number {
  return stamp?.size ?? componentDefault
}
