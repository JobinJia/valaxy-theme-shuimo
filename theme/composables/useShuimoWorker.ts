/**
 * 在 Web Worker 中执行 shuimo-core 的重计算
 * 避免阻塞主线程导致浏览器崩溃
 */

let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (workerInstance)
    return workerInstance

  workerInstance = new Worker(
    new URL('./shuimo.worker.ts', import.meta.url),
    { type: 'module' },
  )
  return workerInstance
}

let msgId = 0
const pending = new Map<number, { resolve: (v: any) => void, reject: (e: any) => void }>()

function initListener(worker: Worker) {
  if ((worker as any).__listenerInit)
    return
  ;(worker as any).__listenerInit = true
  worker.onmessage = (e) => {
    const { id, result, error } = e.data
    const p = pending.get(id)
    if (!p)
      return
    pending.delete(id)
    if (error)
      p.reject(new Error(error))
    else
      p.resolve(result)
  }
  worker.onerror = (e) => {
    for (const [, p] of pending) {
      p.reject(new Error(e.message || 'Worker failed'))
    }
    pending.clear()
  }
}

export function runInWorker<T = string>(type: string, params: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    initListener(worker)
    const id = ++msgId
    pending.set(id, { resolve, reject })
    worker.postMessage({ id, type, params })
  })
}

export function terminateWorker() {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
  }
}
