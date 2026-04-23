import type { TileRegion, XuanPaperWorkerRequest } from '@jobinjia/shuimo-core/xuan-paper/worker-protocol'
import { submitXuanPaperTask, xuanPaperPoolAvailable } from './useXuanPaperPool'

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

// 2×2 网格已够摊开算力；更多 tile 只会增加消息往返开销而不缩短 wall time
const MAX_TILES = 4

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

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// 预热：进程启动时派一个极小任务让池里产生第一个 Worker，后续请求无冷启动
// ---------------------------------------------------------------------------

export function preheatXuanPaperWorker(): void {
  const id = nextId++
  submitXuanPaperTask({ id, options: { width: 32, height: 32, seed: 1 } })?.catch(() => {})
}

if (typeof window !== 'undefined')
  preheatXuanPaperWorker()
