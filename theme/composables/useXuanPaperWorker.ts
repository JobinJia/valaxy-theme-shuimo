import type { XuanPaperWorkerRequest, XuanPaperWorkerResponse } from '@jobinjia/shuimo-core/xuan-paper/worker-protocol'

// 单例 worker + 请求队列：XuanPaper 生成 CPU-bound，多实例并发无收益，单 worker 串行即可
let worker: Worker | null = null
let initAttempted = false
let initFailed = false
let nextId = 1
const pending = new Map<number, {
  resolve: (blob: Blob) => void
  reject: (err: Error) => void
}>()

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
      new URL('@jobinjia/shuimo-core/xuan-paper/worker', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = (e: MessageEvent<XuanPaperWorkerResponse>) => {
      const { id } = e.data
      const p = pending.get(id)
      if (!p)
        return
      pending.delete(id)
      if ('error' in e.data)
        p.reject(new Error(e.data.error))
      else
        p.resolve(e.data.blob)
    }
    worker.onerror = (e) => {
      const err = new Error(`XuanPaper worker error: ${e.message || 'unknown'}`)
      pending.forEach(p => p.reject(err))
      pending.clear()
      worker?.terminate()
      worker = null
      initFailed = true
    }
    initAttempted = true
    return worker
  }
  catch (err) {
    initFailed = true
    console.warn('[shuimo] XuanPaper worker init failed, falling back to sync:', err)
    return null
  }
}

/**
 * 尝试在 Web Worker 里生成宣纸纹理，返回 blob URL。
 * 失败（老浏览器 / Worker 加载失败 / SSR）返回 null，调用方需走同步 fallback。
 */
export function generateInXuanPaperWorker(options: XuanPaperWorkerRequest['options']): Promise<string> | null {
  const w = ensureWorker()
  if (!w)
    return null
  return new Promise<Blob>((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    const req: XuanPaperWorkerRequest = { id, options }
    w.postMessage(req)
  }).then(blob => URL.createObjectURL(blob))
}

/**
 * 主动预热 worker —— 不仅 new Worker() 还发一个微型 dummy 请求，
 * 触发 worker 内的 shuimo-core 模块加载 + JIT 编译，让真实请求走热路径
 */
export function preheatXuanPaperWorker(): void {
  if (initAttempted || initFailed || !canUseWorker())
    return
  const w = ensureWorker()
  if (!w)
    return
  const id = nextId++
  // dummy 请求结果会走 onmessage 路径，只是没人在 pending 里等所以丢弃
  // 关键是触发 worker 内部实际执行代码（模块导入 + XuanPaper.generate），之后真实请求快
  pending.set(id, {
    resolve: (blob) => { URL.revokeObjectURL(URL.createObjectURL(blob)) },
    reject: () => {},
  })
  w.postMessage({ id, options: { width: 32, height: 32, seed: 1 } })
}

// 模块被 import 时（尽可能早，比组件 onMounted 早数十/上百毫秒）立刻预热
// 争取在 hero/curtain/content 发真实请求时 worker 已经热起来
if (typeof window !== 'undefined')
  preheatXuanPaperWorker()
