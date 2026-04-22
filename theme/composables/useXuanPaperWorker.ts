import type { TileRegion, XuanPaperWorkerRequest, XuanPaperWorkerResponse } from '@jobinjia/shuimo-core/xuan-paper/worker-protocol'

let initFailed = false
let nextId = 1

function canUseWorker(): boolean {
  return typeof window !== 'undefined'
    && typeof Worker !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined'
}

function createWorker(): Worker | null {
  if (initFailed || !canUseWorker())
    return null
  try {
    return new Worker(
      new URL('@jobinjia/shuimo-core/xuan-paper/worker', import.meta.url),
      { type: 'module' },
    )
  }
  catch (err) {
    initFailed = true
    console.warn('[shuimo] XuanPaper worker init failed:', err)
    return null
  }
}

function sendToWorker(w: Worker, req: XuanPaperWorkerRequest): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const handler = (e: MessageEvent<XuanPaperWorkerResponse>) => {
      if (e.data.id !== req.id)
        return
      w.removeEventListener('message', handler)
      if ('error' in e.data)
        reject(new Error(e.data.error))
      else
        resolve(e.data.blob)
    }
    w.addEventListener('message', handler)
    w.addEventListener('error', () => reject(new Error('Worker error')), { once: true })
    w.postMessage(req)
  })
}

// ---------------------------------------------------------------------------
// 单 Worker 整图生成（小尺寸或 fallback）
// ---------------------------------------------------------------------------

let singletonWorker: Worker | null = null

export function generateInXuanPaperWorker(options: XuanPaperWorkerRequest['options']): Promise<string> | null {
  if (!singletonWorker)
    singletonWorker = createWorker()
  if (!singletonWorker)
    return null

  const id = nextId++
  return sendToWorker(singletonWorker, { id, options })
    .then(blob => URL.createObjectURL(blob))
}

// ---------------------------------------------------------------------------
// 多 Worker 分片并行生成（大尺寸纹理）
// ---------------------------------------------------------------------------

function buildTiles(fullWidth: number, fullHeight: number, concurrency: number): TileRegion[] {
  const cols = Math.ceil(Math.sqrt(concurrency))
  const rows = Math.ceil(concurrency / cols)
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
  if (!canUseWorker())
    return null

  const fullWidth = options.width ?? 512
  const fullHeight = options.height ?? 512
  const concurrency = Math.min(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4, 8)
  const tiles = buildTiles(fullWidth, fullHeight, concurrency)

  const workers: Worker[] = []
  try {
    for (let i = 0; i < tiles.length; i++) {
      const w = createWorker()
      if (!w)
        throw new Error('Cannot create worker')
      workers.push(w)
    }

    const t0 = performance.now()
    const blobs = await Promise.all(
      tiles.map((tile, i) => {
        const id = nextId++
        return sendToWorker(workers[i]!, { id, options, tile })
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

    console.log(`[XuanPaper] ${tiles.length} 分片并行完成 ${(performance.now() - t0).toFixed(0)}ms`)
    return canvas.toDataURL('image/png')
  }
  finally {
    workers.forEach(w => w.terminate())
  }
}

// ---------------------------------------------------------------------------
// 预热
// ---------------------------------------------------------------------------

export function preheatXuanPaperWorker(): void {
  if (initFailed || !canUseWorker())
    return
  if (!singletonWorker)
    singletonWorker = createWorker()
  if (!singletonWorker)
    return

  const id = nextId++
  sendToWorker(singletonWorker, { id, options: { width: 32, height: 32, seed: 1 } }).catch(() => {})
}

if (typeof window !== 'undefined')
  preheatXuanPaperWorker()
