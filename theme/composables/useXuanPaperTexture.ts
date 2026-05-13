import { XUAN_PAPER_LIGHT_RGB } from './paperColor'
import { generateInXuanPaperWorker, generateTiledInWorkers } from './useXuanPaperWorker'

// 永远不走 tiled 路径：tiled 模式 worker 各生成一片 blob 后主线程要做
// createImageBitmap × N + drawImage × N + canvas.toBlob，1800×850 的 PNG
// 编码在主线程吃 500-1000ms，对 page + curtain 两份 paper 叠加 = 主线程
// 卡 2s+。trace 实测 RunMicrotasks 2.44s 全在跑 V8 native 的 canvas/PNG
// 编码。改走单 worker 全屏路径：worker 内部直接生成 blob，主线程仅
// createObjectURL，零合成开销。代价：单 tile 工作量大（1.5M pixels）但
// worker 内部跑无所谓，反正主线程不卡。
const TILE_THRESHOLD = Number.POSITIVE_INFINITY

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

export interface XuanPaperOptions {
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
  // 是否把生成结果持久化到 localStorage。LS 配额紧张（≈5MB）且单条纹理
  // dataURL ≈2-3MB，多个调用方都写会互相挤掉；curtain paper 仅首页瞬时
  // 显示，不值得占配额。默认 true（global paper 等都需要）；curtain
  // 调用侧传 false。
  persistToLocalStorage?: boolean
}

// 与 generateXuanPaperTexture 内部 cacheKey 计算一致——抽成纯函数让上层
// （useGlobalXuanPaper 写引导快照指针时）能用同一份 key 反向定位 LS 缓存
function buildCacheKey(options: XuanPaperOptions | undefined): string {
  const variant = options?.variant || 'processed'
  const width = options?.width || 256
  const height = options?.height || 256
  const seed = options?.seed || 42
  const isDark = options?.isDark === true
  const goldDensity = clampGoldDensity(options?.goldDensity)
  const fiberDensity = options?.fiberDensity ?? (isDark ? 0 : 0.4)
  const textureIntensity = options?.textureIntensity ?? (isDark ? 0 : 0.15)
  const grainDensity = options?.grainDensity ?? (isDark ? 0.3 : 0.2)
  const goldKey = variant === 'gold' ? goldDensity.toFixed(3) : ''
  const densityKey = `${fiberDensity.toFixed(2)}-${textureIntensity.toFixed(2)}-${grainDensity.toFixed(2)}`
  return `xuan-paper-${variant}-${width}-${height}-${seed}-${isDark ? 'dark' : 'light'}-${options?.baseColor || ''}-${goldKey}-${densityKey}`
}

// 上层（useGlobalXuanPaper）用这个返回值作为 LS 指针；head inline script
// 拿到指针后再 getItem 一次拿真正的 dataURL，避免重复占用 quota
export function buildXuanPaperLocalStorageKey(options: XuanPaperOptions | undefined): string {
  return `${LS_PREFIX}-${buildCacheKey(options)}`
}

export async function generateXuanPaperTexture(options?: XuanPaperOptions) {
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
  const cacheKey = buildCacheKey(options)

  // 不走内存 LRU 缓存：worker 输出的是 blob URL，consumer (urlA/urlB/curtainPaperUrl)
  // 拿到后会在被替换时 deferred revoke 释放。若同一 URL 被 LRU 缓存，二次命中会
  // 返回已 revoke 的死 URL → 4 个 curtain 元素同时 fetch 失败 (ERR_FILE_NOT_FOUND)。
  // 跨会话复用走 localStorage dataURL（字符串，无 revoke 生命周期），LS 命中也是
  // 同步 1ms 量级，几乎覆盖原 in-memory cache 的所有收益。
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
  // 当 persistToLocalStorage===false（curtain）时跳过，避免挤掉 global 的缓存
  if (options?.persistToLocalStorage !== false)
    blobUrlToDataURL(url).then(dataUrl => saveToLocalStorage(cacheKey, dataUrl)).catch(() => {})

  return url
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
