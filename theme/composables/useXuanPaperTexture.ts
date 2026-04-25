import { XUAN_PAPER_LIGHT_RGB } from './paperColor'
import { generateCached } from './useShuimoCache'
import { generateInXuanPaperWorker, generateTiledInWorkers } from './useXuanPaperWorker'

const TILE_THRESHOLD = 512 * 512

// localStorage 持久缓存：xuan paper 生成是确定性的（给定所有参数结果完全一致），
// 一次生成后所有后续访问（包括新 tab / 新会话）都零计算命中
const LS_PREFIX = 'shuimo-xuan-paper-v2'
const LS_MAX_ENTRY_SIZE = 3 * 1024 * 1024 // 3MB 单条上限，避免超大纹理吃光配额

function loadFromLocalStorage(key: string): string | null {
  if (typeof window === 'undefined')
    return null
  try {
    const v = localStorage.getItem(`${LS_PREFIX}-${key}`)
    return v && v.startsWith('data:image/') ? v : null
  }
  catch {
    return null
  }
}

function saveToLocalStorage(key: string, dataUrl: string): void {
  if (typeof window === 'undefined' || dataUrl.length > LS_MAX_ENTRY_SIZE)
    return
  try {
    localStorage.setItem(`${LS_PREFIX}-${key}`, dataUrl)
  }
  catch {
    // 配额满：清理旧版本 / 同前缀的其他条目后再试一次
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith(LS_PREFIX) && k !== `${LS_PREFIX}-${key}`)
          localStorage.removeItem(k)
      }
      localStorage.setItem(`${LS_PREFIX}-${key}`, dataUrl)
    }
    catch {}
  }
}

async function blobUrlToDataURL(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export type XuanPaperVariant = 'processed' | 'aged' | 'gold'

const lightColorPresets: Record<XuanPaperVariant, [number, number, number]> = {
  // processed 必须与 useHeroScene 条幅 fill 替换色保持一致（见 paperColor.ts）
  processed: [...XUAN_PAPER_LIGHT_RGB] as [number, number, number],
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
  goldDensity?: number
  // 下面三个允许为装饰性用途（如幕布）提供简化纹理以加速生成
  fiberDensity?: number
  textureIntensity?: number
  grainDensity?: number
}) {
  const variant = options?.variant || 'processed'
  const width = options?.width || 256
  const height = options?.height || 256
  const seed = options?.seed || 42
  const isDark = options?.isDark === true
  const goldDensity = clampGoldDensity(options?.goldDensity)
  // 默认纤维/颗粒/底噪密度减半（0.8 / 0.4 / 0.3 → 0.4 / 0.2 / 0.15）
  // 金屑才是视觉主体（通过 goldDensity 单独控），三层底纹只是 subtle 质感
  // 旧默认在 1920×1080 viewport 上生成要 1-2 秒，减半后 500ms 量级
  const fiberDensity = options?.fiberDensity ?? (isDark ? 0 : 0.4)
  const textureIntensity = options?.textureIntensity ?? (isDark ? 0 : 0.15)
  const grainDensity = options?.grainDensity ?? (isDark ? 0.3 : 0.2)
  const presets = isDark ? darkColorPresets : lightColorPresets
  const goldKey = variant === 'gold' ? goldDensity.toFixed(3) : ''
  const densityKey = `${fiberDensity.toFixed(2)}-${textureIntensity.toFixed(2)}-${grainDensity.toFixed(2)}`
  const cacheKey = `xuan-paper-${variant}-${width}-${height}-${seed}-${isDark ? 'dark' : 'light'}-${options?.baseColor || ''}-${goldKey}-${densityKey}`

  return generateCached(cacheKey, async () => {
    // localStorage 持久缓存（跨会话复用）—— 二次访问零计算返回 dataURL
    const persisted = loadFromLocalStorage(cacheKey)
    if (persisted)
      return persisted

    const customBaseColor = options?.baseColor ? hexToRgb(options.baseColor) : null

    const textureOptions: Record<string, any> = {
      width,
      height,
      baseColor: customBaseColor || presets[variant] || presets.processed,
      fiberDensity,
      textureIntensity,
      grainDensity,
      seed,
    }

    if (variant === 'aged')
      textureOptions.age = 0.4

    if (variant === 'gold') {
      textureOptions.goldFlecks = true
      textureOptions.goldDensity = goldDensity
    }

    let url: string | null = null
    const pixels = width * height

    if (pixels > TILE_THRESHOLD) {
      try {
        url = await generateTiledInWorkers(textureOptions)
      }
      catch (err) {
        console.warn('[shuimo] tiled worker failed, trying single worker:', err)
      }
    }

    if (!url) {
      const workerPromise = generateInXuanPaperWorker(textureOptions)
      if (workerPromise) {
        try {
          url = await workerPromise
        }
        catch (err) {
          console.warn('[shuimo] single worker failed, falling back to sync:', err)
        }
      }
    }

    if (!url) {
      const { XuanPaper } = await import('@jobinjia/shuimo-core/elements')
      url = XuanPaper.generateDataURL(textureOptions)
    }

    // 异步写 localStorage，不阻塞返回；下次访问秒出
    blobUrlToDataURL(url).then(dataUrl => saveToLocalStorage(cacheKey, dataUrl)).catch(() => {})

    return url
  })
}

function clampGoldDensity(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value))
    return 0.3
  if (value < 0)
    return 0
  if (value > 1)
    return 1
  return value
}
