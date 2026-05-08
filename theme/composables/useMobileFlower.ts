import { ref } from 'vue'
import { buildMobileFlowerInWorker } from './useMobileFlowerWorker'
import { getSeasonFlora } from './useShuimoSeed'

/** 供跨组件通信：花 Canvas 是否已绘制完成（用于幕布 Gate） */
export const mobileFlowerReady = ref(false)
/** 供跨组件通信：当前花使用的 seed（用于 SeedControl 展示） */
export const mobileFlowerSeed = ref(0)

/**
 * 花卉绘制源：worker 路径下是 ImageBitmap，主线程 fallback 下是 HTMLCanvasElement。
 * 两者都可作为 drawImage 的输入，且都暴露 width/height。
 */
export type FlowerSource = HTMLCanvasElement | ImageBitmap

export interface MobileFlowerScene {
  source: FlowerSource
  seed: number
  width: number
  height: number
}

export interface MobileFlowerCache {
  seed: number
  source: FlowerSource
  width: number
  height: number
  type: string
}

let cachedMobileFlower: MobileFlowerCache | null = null

export function getCachedMobileFlower() {
  return cachedMobileFlower
}

export function setCachedMobileFlower(cache: MobileFlowerCache) {
  cachedMobileFlower = cache
}

/**
 * 生成移动端花卉 Canvas。
 * 优先在 Web Worker 里跑（消除主线程 ~1.3s 长任务）；
 * worker 不可用 / 出错时回退到主线程同步绘制，视觉等价。
 */
export async function buildMobileFlower(
  width: number,
  height: number,
  seed: number,
  type: 'woody' | 'herbal' | 'random',
): Promise<MobileFlowerScene> {
  const workerPromise = buildMobileFlowerInWorker(width, height, seed, type)
  if (workerPromise) {
    try {
      const { bitmap, width: w, height: h } = await workerPromise
      return { source: bitmap, seed, width: w, height: h }
    }
    catch (err) {
      // worker 失败：log 并 fallthrough 到同步路径，保证视觉始终落地
      console.warn('[shuimo] mobile flower worker failed, falling back to main thread:', err)
    }
  }

  const { generateFlowerCanvas } = await import('@jobinjia/shuimo-core')
  const canvas = generateFlowerCanvas({
    seed,
    type,
    width,
    height,
  })

  await removeFlowerPaperBackground(canvas)
  return { source: canvas, seed, width, height }
}

// 全屏移动端 canvas（如 1080×2400 = 260 万像素）一次性扫描需 100-300ms 阻塞主线程，
// 直接卡首屏。改为分 chunk + 让出 event loop：每片只处理 64K 像素（~8ms），其它 UI 不被阻塞，
// 视觉上花卉略有渐显效果，移动端体感优于一次性 freeze
const PIXEL_CHUNK = 64 * 1024 * 4 // 64K 像素 × RGBA = 256KB

// 用 rAF 让出会在以下场景死锁：tab 后台 / 失焦 / Chrome Energy Saver / occluded —— 这些状态下 rAF 被
// throttle 到接近 0Hz，await 永不 resolve，整个 fallback 路径卡死 → mobileFlowerReady 永远 false →
// 帷幕永远不退。MessageChannel postMessage 走 event loop tick，与 paint frame 解耦，任何 tab 状态都稳定
// 在 ms 级 fire；浏览器仍会在 tick 间自由 paint，渐显视觉保留，总耗时反而比 rAF 节奏低（chunk 间隔 ~1ms vs 16ms）。
function yieldToTick(): Promise<void> {
  return new Promise<void>((resolve) => {
    const ch = new MessageChannel()
    ch.port1.onmessage = () => resolve()
    ch.port2.postMessage(null)
  })
}

async function removeFlowerPaperBackground(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const { width, height } = canvas
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  const total = data.length

  let i = 0
  while (i < total) {
    const end = Math.min(i + PIXEL_CHUNK, total)
    for (; i < end; i += 4) {
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!
      const brightness = (r + g + b) / 3
      const saturation = Math.max(r, g, b) - Math.min(r, g, b)

      if (brightness > 248 && saturation < 10) {
        data[i + 3] = 0
      }
      else if (brightness > 236 && saturation < 16) {
        data[i + 3] = Math.round(data[i + 3]! * ((248 - brightness) / 12))
      }
    }
    if (i < total)
      await yieldToTick()
  }
  ctx.putImageData(image, 0, 0)
}

/**
 * 将 'season' 映射为具体花卉类型。
 * 春兰 / 夏竹 / 秋菊 → herbal，冬梅 → woody
 */
export function resolveFlowerType(
  type: 'woody' | 'herbal' | 'random' | 'season',
): 'woody' | 'herbal' | 'random' {
  if (type !== 'season')
    return type

  const flora = getSeasonFlora()
  const seasonMap: Record<string, 'woody' | 'herbal'> = {
    orchid: 'herbal',
    bamboo: 'herbal',
    chrysanthemum: 'herbal',
    plum: 'woody',
  }
  return seasonMap[flora] || 'herbal'
}
