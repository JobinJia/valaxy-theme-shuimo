import { generateCached } from './useShuimoCache'

export type XuanPaperVariant = 'processed' | 'aged' | 'gold'

const lightColorPresets: Record<XuanPaperVariant, [number, number, number]> = {
  processed: [252, 248, 230],
  aged: [235, 220, 190],
  gold: [250, 245, 225],
}

// 暗色模式：乌金笺效果 — 纯黑底 + 稀疏颗粒/金屑（纤维因 shuimo-core 内部写死浅色 + 低 alpha
// 在纯黑上几乎不可见，属预期牺牲）
const darkColorPresets: Record<XuanPaperVariant, [number, number, number]> = {
  processed: [0, 0, 0],
  aged: [0, 0, 0],
  gold: [0, 0, 0],
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
  isDark?: boolean
}) {
  const variant = options?.variant || 'processed'
  const width = options?.width || 256
  const height = options?.height || 256
  const seed = options?.seed || 42
  const isDark = options?.isDark === true
  const presets = isDark ? darkColorPresets : lightColorPresets
  const cacheKey = `xuan-paper-${variant}-${width}-${height}-${seed}-${isDark ? 'dark' : 'light'}-${options?.baseColor || ''}`

  return generateCached(cacheKey, async () => {
    const { XuanPaper } = await import('@jobinjia/shuimo-core/elements')
    const customBaseColor = options?.baseColor ? hexToRgb(options.baseColor) : null

    const textureOptions: Record<string, any> = {
      width,
      height,
      baseColor: customBaseColor || presets[variant] || presets.processed,
      // 暗色：纤维/亮度变化都贴近 0（黑底上看不见），只留颗粒沙点做"星尘"质感
      fiberDensity: isDark ? 0 : 0.8,
      textureIntensity: isDark ? 0 : 0.3,
      grainDensity: isDark ? 0.5 : 0.4,
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
