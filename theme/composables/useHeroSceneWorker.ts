export interface HeroSceneResult {
  blankSide: 'left' | 'right'
  seed: number
  png?: Blob
  svg?: string
}

// 单例 worker + 请求队列
let worker: Worker | null = null
let initFailed = false
let nextId = 1
const pending = new Map<number, {
  resolve: (scene: HeroSceneResult) => void
  reject: (err: Error) => void
}>()

// in-flight 去重：同 (W, H, seed) 已有 promise 时直接复用，resize 风暴期间避免
// worker 串行队列堆积同样输入的请求
const inflight = new Map<string, Promise<HeroSceneResult>>()
function inflightKey(W: number, H: number, seed: number): string {
  return `${W}x${H}@${seed}`
}

function canUseWorker(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined'
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
      new URL('../workers/hero-scene.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = (e: MessageEvent<{ id: number, scene?: HeroSceneResult, error?: string }>) => {
      const { id, scene, error } = e.data
      const p = pending.get(id)
      if (!p)
        return
      pending.delete(id)
      if (error)
        p.reject(new Error(error))
      else if (scene)
        p.resolve(scene)
      else
        p.reject(new Error('Hero scene worker returned no result'))
    }
    worker.onerror = (e) => {
      const err = new Error(`Hero scene worker error: ${e.message || 'unknown'}`)
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
    console.warn('[shuimo] Hero scene worker init failed, falling back to sync:', err)
    return null
  }
}

/**
 * 尝试在 Worker 里生成 hero 山水画。失败返回 null，调用方走同步 fallback。
 * 同 (W, H, seed) 的 in-flight 请求会复用同一 promise。
 */
export function buildHeroSceneInWorker(W: number, H: number, seed: number): Promise<HeroSceneResult> | null {
  const w = ensureWorker()
  if (!w)
    return null

  const key = inflightKey(W, H, seed)
  const existing = inflight.get(key)
  if (existing)
    return existing

  const promise = new Promise<HeroSceneResult>((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    w.postMessage({ id, W, H, seed })
  }).finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, promise)
  return promise
}

/**
 * 预热 worker —— 提前 new Worker() 让 Vite 开始加载 worker 代码
 * （未发真实请求，因为 dummy 请求也要全量执行一次场景生成，成本高）
 */
export function preheatHeroSceneWorker(): void {
  ensureWorker()
}

// 模块 import 时立即预热，争取比真实请求早数十毫秒
if (typeof window !== 'undefined')
  preheatHeroSceneWorker()
