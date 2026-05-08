import type { TileRegion, XuanPaperWorkerRequest } from '@jobinjia/shuimo-core/xuan-paper/worker-protocol'
import { preheatXuanPaperPool, submitXuanPaperTask, xuanPaperPoolAvailable } from './useXuanPaperPool'

let nextId = 1

// ---------------------------------------------------------------------------
// 单 Worker 整图生成（小尺寸或 fallback）
// ---------------------------------------------------------------------------

export function generateInXuanPaperWorker(options: XuanPaperWorkerRequest['options']): Promise<string> | null {
  const id = nextId++
  const task = submitXuanPaperTask({ id, options })
  if (!task)
    return null
  return task.then(blob => URL.createObjectURL(blob))
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
  options: XuanPaperWorkerRequest['options'],
): Promise<string | null> {
  if (!xuanPaperPoolAvailable())
    return null

  const fullWidth = options.width ?? 512
  const fullHeight = options.height ?? 512
  const tiles = buildTiles(fullWidth, fullHeight, MAX_TILES)

  const blobs = await Promise.all(
    tiles.map((tile) => {
      const id = nextId++
      const task = submitXuanPaperTask({ id, options, tile })
      if (!task)
        throw new Error('XuanPaper worker pool unavailable')
      return task
    }),
  )
  const bitmaps = await Promise.all(blobs.map(blob => createImageBitmap(blob)))

  const canvas = document.createElement('canvas')
  canvas.width = fullWidth
  canvas.height = fullHeight
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < tiles.length; i++) {
    ctx.drawImage(bitmaps[i]!, tiles[i]!.x, tiles[i]!.y)
    bitmaps[i]!.close()
  }

  // 返回 blob URL 而不是 dataURL：1800×850 的 PNG dataURL 约 1.6MB，
  // useGlobalXuanPaper 后续 `await img.decode()` 在 prod 下对超大 dataURL
  // 会永远 pending（既不 resolve 也不 reject），导致 globalPaperReady 永远
  // false → 幕布永远不开。toBlob + createObjectURL 与单 worker 路径一致。
  return await new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob)
        resolve(URL.createObjectURL(blob))
      else
        reject(new Error('canvas.toBlob returned null'))
    }, 'image/png')
  })
}

// ---------------------------------------------------------------------------
// 预热：进程启动时把 pool 直接 fill 到 MAX_SIZE 个 worker（spawn 不派任务）。
// tiled 模式下 4 tile 并行时，避免 3 个 worker 同时冷启动 + WASM init 阻塞。
// ---------------------------------------------------------------------------

export function preheatXuanPaperWorker(): void {
  preheatXuanPaperPool()
}

if (typeof window !== 'undefined')
  preheatXuanPaperWorker()
