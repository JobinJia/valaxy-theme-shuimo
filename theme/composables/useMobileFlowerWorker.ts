export interface MobileFlowerWorkerResult {
  bitmap: ImageBitmap
  width: number
  height: number
}

interface MobileFlowerInMsg {
  id: number
  width: number
  height: number
  seed: number
  type: 'woody' | 'herbal' | 'random'
}

let worker: Worker | null = null
let initFailed = false
let nextId = 1
const pending = new Map<number, {
  resolve: (r: MobileFlowerWorkerResult) => void
  reject: (err: Error) => void
}>()

// in-flight 去重：同 (w, h, seed, type) 已有 promise 时直接复用，
// resize 风暴期间避免 worker 串行队列堆同样输入的请求
const inflight = new Map<string, Promise<MobileFlowerWorkerResult>>()
function inflightKey(w: number, h: number, seed: number, type: string): string {
  return `${w}x${h}@${seed}/${type}`
}

function canUseWorker(): boolean {
  return typeof window !== 'undefined'
    && typeof Worker !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined'
}

function ensureWorker(): Worker | null {
  if (worker || initFailed)
    return worker
  if (!canUseWorker()) {
    initFailed = true
    return null
  }
  try {
    worker = new Worker(
      new URL('../workers/mobile-flower.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = (e: MessageEvent<{ id: number, bitmap?: ImageBitmap, width?: number, height?: number, error?: string }>) => {
      const { id, bitmap, width, height, error } = e.data
      const p = pending.get(id)
      if (!p)
        return
      pending.delete(id)
      if (error)
        p.reject(new Error(error))
      else if (bitmap && width && height)
        p.resolve({ bitmap, width, height })
      else
        p.reject(new Error('Mobile flower worker returned no bitmap'))
    }
    worker.onerror = (e) => {
      const err = new Error(`Mobile flower worker error: ${e.message || 'unknown'}`)
      pending.forEach(p => p.reject(err))
      pending.clear()
      inflight.clear()
      worker?.terminate()
      worker = null
      initFailed = true
    }
    return worker
  }
  catch (err) {
    initFailed = true
    console.warn('[shuimo] Mobile flower worker init failed, falling back to sync:', err)
    return null
  }
}

/**
 * 尝试在 Worker 里生成 mobile flower。失败返回 null，调用方走同步 fallback。
 * 同 (w, h, seed, type) 的 in-flight 请求会复用同一 promise。
 */
export function buildMobileFlowerInWorker(
  width: number,
  height: number,
  seed: number,
  type: 'woody' | 'herbal' | 'random',
): Promise<MobileFlowerWorkerResult> | null {
  const w = ensureWorker()
  if (!w)
    return null

  const key = inflightKey(width, height, seed, type)
  const existing = inflight.get(key)
  if (existing)
    return existing

  const promise = new Promise<MobileFlowerWorkerResult>((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    const msg: MobileFlowerInMsg = { id, width, height, seed, type }
    w.postMessage(msg)
  }).finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, promise)
  return promise
}

/**
 * 预热 worker —— 提前 new Worker() 让 Vite 开始加载 worker 代码 + shuimo-core
 * （未发真实请求；首屏请求到来时 worker 通常已就绪）
 */
export function preheatMobileFlowerWorker(): void {
  ensureWorker()
}

// 模块 import 时立即预热
if (typeof window !== 'undefined')
  preheatMobileFlowerWorker()
