import type { TileRegion, XuanPaperWorkerRequest } from '@jobinjia/shuimo-core/xuan-paper/worker-protocol'
import { isMobileViewport } from './useMediaQuery'
import { preheatXuanPaperPool, submitXuanPaperTask, xuanPaperPoolAvailable } from './useXuanPaperPool'

let nextId = 1

// shuimo-core ≥3 的请求里 options 变成可选（也可以改传预建好的 scene）；
// 主题这边总是传 options，这里收窄成必填。
type XuanPaperWorkerOptions = NonNullable<XuanPaperWorkerRequest['options']>

// ---------------------------------------------------------------------------
// 单 Worker 整图生成（小尺寸或 fallback）
// ---------------------------------------------------------------------------

export function generateInXuanPaperWorker(options: XuanPaperWorkerOptions): Promise<string> | null {
  const id = nextId++
  const task = submitXuanPaperTask({ id, options })
  if (!task)
    return null
  return task.then(bitmap => bitmapToObjectUrl(bitmap, paperImageType(options)))
}

// 编码格式：纸面没有透明区域时用 JPEG q0.9。shuimo-core 3 的宣纸带逐像素抖动，
// PNG（无损）压不动：1950×1100 实测 PNG 2781KB → dataURL 3.7MB，超过
// LS_MAX_ENTRY_SIZE(3MB) 被静默丢弃，每次访问都要重新跑 worker。JPEG q0.9 同图
// 117KB，肉眼和 PNG 无差（WebP q0.9 只有 32KB 但会把颗粒和纤维抹平，不用）。
// 开了毛边（deckleEdge）的纸边缘是透明的，JPEG 会把透明涂成黑色，只能继续用 PNG。
interface PaperImageType { type: 'image/jpeg' | 'image/png', quality?: number }

function paperImageType(options: XuanPaperWorkerOptions): PaperImageType {
  return options.deckleEdge ? { type: 'image/png' } : { type: 'image/jpeg', quality: 0.9 }
}

// worker 转移回来的是 ImageBitmap。bitmaprenderer 上下文直接接管位图（零拷贝），
// convertToBlob 异步编码，不在主线程上逐像素重绘。
// 返回 blob URL 而不是 dataURL：1800×850 的 PNG dataURL 约 1.6MB，
// useGlobalXuanPaper 后续 `await img.decode()` 在 prod 下对超大 dataURL
// 会永远 pending（既不 resolve 也不 reject），导致 globalPaperReady 永远
// false → 幕布永远不开。
async function bitmapToObjectUrl(bitmap: ImageBitmap, format: PaperImageType): Promise<string> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('bitmaprenderer')
  if (!ctx) {
    bitmap.close()
    throw new Error('bitmaprenderer context unavailable')
  }
  ctx.transferFromImageBitmap(bitmap)
  const blob = await canvas.convertToBlob(format)
  return URL.createObjectURL(blob)
}

// ---------------------------------------------------------------------------
// 多 tile 并行生成（大尺寸纹理）：tile 数受 Worker 池容量封顶（最多 2×2=4）
// ---------------------------------------------------------------------------

// tile 数对齐 worker pool 容量（MAX_SIZE=3）：4 tile 总有 1 个排队等 worker
// 释放，单批耗时 ≈ 2 × tile_time。改 3 tile 后 3 worker 全并发 ≈ 1 × tile_time，
// 单 tile 像素增 33% 但 wall clock 几近减半。trace 实测 4 tile 时第 4 tile
// 撞 cold-spawn worker 走 vite ESM 串行加载 2.7s，本身就是大头。
const MAX_TILES = 3

function buildTiles(fullWidth: number, fullHeight: number, tileCount: number): TileRegion[] {
  const cols = Math.ceil(Math.sqrt(tileCount))
  const rows = Math.ceil(tileCount / cols)
  const tileW = Math.ceil(fullWidth / cols)
  const tileH = Math.ceil(fullHeight / rows)
  const tiles: TileRegion[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW
      const y = r * tileH
      if (x >= fullWidth || y >= fullHeight)
        continue
      tiles.push({
        x,
        y,
        width: Math.min(tileW, fullWidth - x),
        height: Math.min(tileH, fullHeight - y),
      })
    }
  }
  return tiles
}

export async function generateTiledInWorkers(
  options: XuanPaperWorkerOptions,
): Promise<string | null> {
  if (!xuanPaperPoolAvailable())
    return null

  const fullWidth = options.width ?? 512
  const fullHeight = options.height ?? 512
  const tiles = buildTiles(fullWidth, fullHeight, MAX_TILES)

  const bitmaps = await Promise.all(
    tiles.map((tile) => {
      const id = nextId++
      const task = submitXuanPaperTask({ id, options, tile })
      if (!task)
        throw new Error('XuanPaper worker pool unavailable')
      return task
    }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = fullWidth
  canvas.height = fullHeight
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < tiles.length; i++) {
    ctx.drawImage(bitmaps[i]!, tiles[i]!.x, tiles[i]!.y)
    bitmaps[i]!.close()
  }

  // 同单 worker 路径，返回 blob URL，编码格式见 paperImageType 的说明。
  const format = paperImageType(options)
  return await new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob)
        resolve(URL.createObjectURL(blob))
      else
        reject(new Error('canvas.toBlob returned null'))
    }, format.type, format.quality)
  })
}

// ---------------------------------------------------------------------------
// 预热：进程启动时把 pool 直接 fill 到 MAX_SIZE 个 worker（spawn 不派任务）。
// tiled 模式下 4 tile 并行时，避免 3 个 worker 同时冷启动 + WASM init 阻塞。
// ---------------------------------------------------------------------------

// 移动端只会同时派 2 个任务（页面纸 + 幕布纸，都不分片），多预热的第 3 个
// worker 只是多一次下载解析 + WASM 初始化，和首屏抢 CPU。
export function preheatXuanPaperWorker(): void {
  preheatXuanPaperPool(isMobileViewport() ? 2 : undefined)
}

if (typeof window !== 'undefined')
  preheatXuanPaperWorker()
