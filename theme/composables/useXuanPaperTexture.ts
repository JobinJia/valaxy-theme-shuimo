import { generateCached } from './useShuimoCache'

export type XuanPaperVariant = 'processed' | 'aged' | 'gold'

const colorPresets: Record<XuanPaperVariant, [number, number, number]> = {
  processed: [252, 248, 230],
  aged: [235, 220, 190],
  gold: [250, 245, 225],
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, '')
  const full = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized

  if (!/^[\dA-F]{6}$/i.test(full))
    return null

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

export async function generateXuanPaperTexture(options?: {
  variant?: XuanPaperVariant
  width?: number
  height?: number
  seed?: number
  baseColor?: string
}) {
  const variant = options?.variant || 'processed'
  const width = options?.width || 256
  const height = options?.height || 256
  const seed = options?.seed || 42
  const cacheKey = `xuan-paper-${variant}-${width}-${height}-${seed}-${options?.baseColor || ''}`

  return generateCached(cacheKey, async () => {
    const { XuanPaper } = await import('@jobinjia/shuimo-core/elements')
    const customBaseColor = options?.baseColor ? hexToRgb(options.baseColor) : null

    const textureOptions: Record<string, any> = {
      width,
      height,
      baseColor: customBaseColor || colorPresets[variant] || colorPresets.processed,
      fiberDensity: 0.8,
      textureIntensity: 0.3,
      grainDensity: 0.4,
      seed,
    }

    if (variant === 'aged')
      textureOptions.age = 0.4

    if (variant === 'gold') {
      textureOptions.goldFlecks = true
      textureOptions.goldDensity = 0.3
    }

    return XuanPaper.generateDataURL(textureOptions)
  })
}
