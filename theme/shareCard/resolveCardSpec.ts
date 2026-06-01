import type { CardSpec, CardVariant } from './types'
import { hashString } from '../composables/useShuimoSeed'

export interface ResolveCardSpecInput {
  slug: string
  variant: CardVariant
  frontmatter: {
    title?: string
    subtitle?: string
    dateText?: string
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

  return {
    variant,
    width,
    height,
    seed: hashString(slug),
    title: fm.title ?? '',
    subtitle: fm.subtitle,
    author: tc.sidebar?.author?.name,
    siteName: tc.header?.title,
    dateText: fm.dateText,
    stamp: {
      text: fm.stamp?.text ?? fm.stamp?.author ?? tc.stamp?.author ?? '',
      mode: fm.stamp?.mode ?? tc.stamp?.mode ?? 'yang',
      color: fm.stamp?.color ?? tc.stamp?.color,
    },
    colors: {
      primary: tc.colors?.primary ?? '#8B4513',
      paper: DEFAULT_PAPER,
    },
  }
}
