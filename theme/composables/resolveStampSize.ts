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
 * 2-layer fallback for "author-identity" 印章 (about page, post 落款 兜底, etc):
 *   stamp.size > componentDefault
 *
 * Lets blog authors set a single `stamp.size` to scale every author-identity
 * seal at once. Decorative seals (theme toggle / mobile inscription / solar
 * seal) use `resolveDecorStampSize` instead so a giant author seal doesn't
 * also blow up the UI chrome.
 */
export function resolveStampSize(
  stamp: ThemeConfig['stamp'] | undefined | null,
  componentDefault: number,
): number {
  return stamp?.size ?? componentDefault
}

/**
 * 2-layer fallback for decorative / utility seals (theme toggle, mobile
 * inscription, solar seal):
 *   stamp.decor.size > componentDefault
 *
 * Independent from `stamp.size` (which is for author-identity seals) so blog
 * authors can scale "the giant author seal" without dragging every small
 * decorative seal along, and vice-versa. Each component still wins with its
 * own explicit override.
 */
export function resolveDecorStampSize(
  stamp: ThemeConfig['stamp'] | undefined | null,
  componentDefault: number,
): number {
  return stamp?.decor?.size ?? componentDefault
}
