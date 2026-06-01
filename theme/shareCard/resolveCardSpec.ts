import type { CardSpec, CardVariant } from './types'
import { hashString } from '../composables/useShuimoSeed'

export interface ResolveCardSpecInput {
  slug: string
  variant: CardVariant
  frontmatter: {
    title?: string
    subtitle?: string
    /**
     * Pre-formatted date string (e.g. "2026年1月2日"). Takes precedence over
     * `date` when both are supplied. Kept for back-compat with callers that
     * already formatted the date themselves.
     */
    dateText?: string
    /**
     * Raw date value from post frontmatter. Accepted as string or Date object
     * (valaxy's frontmatter parser may return either). Formatted to zh-CN
     * locale string when `dateText` is not present.
     */
    date?: string | Date
    stamp?: { text?: string, author?: string, mode?: 'yin' | 'yang', color?: string }
  }
  themeConfig: {
    colors?: { primary?: string }
    sidebar?: { author?: { name?: string } }
    header?: { title?: string }
    stamp?: { author?: string, mode?: 'yin' | 'yang', color?: string }
    shareCard?: {
      portrait?: { width?: number, height?: number }
      landscape?: { width?: number, height?: number }
    }
  }
}

/**
 * Format a raw date value to a zh-CN locale date string.
 * Returns undefined when the value is absent or represents an invalid date.
 */
function formatDate(date?: string | Date): string | undefined {
  if (date === undefined || date === null || date === '')
    return undefined
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime()))
    return undefined
  return d.toLocaleDateString('zh-CN')
}

const DIM = {
  portrait: { width: 1080, height: 1440 },
  landscape: { width: 1200, height: 630 },
} as const

const DEFAULT_PAPER = '#f5efe1'

export function resolveCardSpec(input: ResolveCardSpecInput): CardSpec {
  const { slug, variant, frontmatter: fm, themeConfig: tc } = input
  const dimCfg = tc.shareCard?.[variant]
  const width = dimCfg?.width ?? DIM[variant].width
  const height = dimCfg?.height ?? DIM[variant].height

  // Explicit dateText wins; otherwise derive from raw date field.
  const dateText = fm.dateText ?? formatDate(fm.date)

  const seed = hashString(slug)

  // Deterministically derive scene type and flower variant from seed.
  // ~1/3 of posts get a flower; the rest render the ink landscape.
  const scene: CardSpec['scene'] = seed % 3 === 0 ? 'flower' : 'landscape'
  const flowerType: CardSpec['flowerType'] = seed % 2 === 0 ? 'herbal' : 'woody'

  return {
    variant,
    width,
    height,
    seed,
    title: fm.title ?? '',
    subtitle: fm.subtitle,
    author: tc.sidebar?.author?.name,
    siteName: tc.header?.title,
    dateText,
    stamp: {
      text: fm.stamp?.text ?? fm.stamp?.author ?? tc.stamp?.author ?? '',
      mode: fm.stamp?.mode ?? tc.stamp?.mode ?? 'yang',
      color: fm.stamp?.color ?? tc.stamp?.color,
    },
    colors: {
      primary: tc.colors?.primary ?? '#8B4513',
      paper: DEFAULT_PAPER,
    },
    scene,
    flowerType,
  }
}
