import { ref } from 'vue'
import { getSeasonFlora } from './useShuimoSeed'

/** 供跨组件通信：花 Canvas 是否已绘制完成（用于幕布 Gate） */
export const mobileFlowerReady = ref(false)
/** 供跨组件通信：当前花使用的 seed（用于 SeedControl 展示） */
export const mobileFlowerSeed = ref(0)

export interface MobileFlowerScene {
  canvas: HTMLCanvasElement
  seed: number
  width: number
  height: number
}

export interface MobileFlowerCache {
  seed: number
  canvas: HTMLCanvasElement
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
 * 最终输出 canvas 与当前屏幕 CSS 像素尺寸一致；宽高直接交给 shuimo-core 参与花卉绘制。
 */
export async function buildMobileFlower(
  width: number,
  height: number,
  seed: number,
  type: 'woody' | 'herbal' | 'random',
): Promise<MobileFlowerScene> {
  const { generateFlowerCanvas } = await import('@jobinjia/shuimo-core')
  const canvas = generateFlowerCanvas({
    seed,
    type,
    width,
    height,
  })

  await removeFlowerPaperBackground(canvas)
  return { canvas, seed, width, height }
}

// 全屏移动端 canvas（如 1080×2400 = 260 万像素）一次性扫描需 100-300ms 阻塞主线程，
// 直接卡首屏。改为分 chunk + rAF 让出：每帧只处理 64K 像素（~8ms），其它 UI 不被阻塞，
// 总耗时不变但分摊到几帧；视觉上花卉略有渐显效果，移动端体感优于一次性 freeze
const PIXEL_CHUNK = 64 * 1024 * 4 // 64K 像素 × RGBA = 256KB

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
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
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
