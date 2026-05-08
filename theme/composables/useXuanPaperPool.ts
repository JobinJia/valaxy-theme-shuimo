import type { XuanPaperWorkerRequest, XuanPaperWorkerResponse } from '@jobinjia/shuimo-core/xuan-paper/worker-protocol'

// Module-level Worker pool for xuan paper generation.
// Before: each generateTiledInWorkers call spawned N fresh Workers and
// terminated them — a 1800×1008 first load meant ~28 Worker instantiations
// across preheat + initial + isDark-watch + resize triggers.
// After: up to MAX_SIZE long-lived Workers fed by a FIFO task queue,
// reused across every call and across every trigger.

interface Task {
  req: XuanPaperWorkerRequest
  resolve: (blob: Blob) => void
  reject: (err: Error) => void
}

interface Slot {
  worker: Worker
  busy: boolean
}

const MAX_SIZE = typeof navigator !== 'undefined'
  ? Math.min(navigator.hardwareConcurrency || 4, 3)
  : 3

let slots: Slot[] = []
const queue: Task[] = []
let initFailed = false

function canUseWorker(): boolean {
  return typeof window !== 'undefined'
    && typeof Worker !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined'
}

function createSlot(): Slot | null {
  if (initFailed || !canUseWorker())
    return null
  try {
    const worker = new Worker(
      new URL('@jobinjia/shuimo-core/xuan-paper/worker', import.meta.url),
      { type: 'module' },
    )
    return { worker, busy: false }
  }
  catch (err) {
    initFailed = true
    console.warn('[shuimo] XuanPaper worker init failed:', err)
    return null
  }
}

function dispatch(slot: Slot, task: Task): void {
  slot.busy = true

  const onMessage = (e: MessageEvent<XuanPaperWorkerResponse>) => {
    if (e.data.id !== task.req.id)
      return
    cleanup()
    slot.busy = false
    if ('error' in e.data)
      task.reject(new Error(e.data.error))
    else
      task.resolve(e.data.blob)
    drain()
  }

  const onError = (ev: ErrorEvent) => {
    cleanup()
    // Crashed worker: terminate and drop from pool so drain() spawns a fresh one.
    slot.worker.terminate()
    slots = slots.filter(s => s !== slot)
    task.reject(new Error(ev.message || 'Worker error'))
    drain()
  }

  function cleanup() {
    slot.worker.removeEventListener('message', onMessage)
    slot.worker.removeEventListener('error', onError as EventListener)
  }

  slot.worker.addEventListener('message', onMessage)
  slot.worker.addEventListener('error', onError as EventListener)
  slot.worker.postMessage(task.req)
}

function drain(): void {
  while (queue.length > 0) {
    let slot = slots.find(s => !s.busy)
    if (!slot && slots.length < MAX_SIZE) {
      const fresh = createSlot()
      if (!fresh)
        break
      slots.push(fresh)
      slot = fresh
    }
    if (!slot)
      break
    const task = queue.shift()!
    dispatch(slot, task)
  }
}

export function submitXuanPaperTask(req: XuanPaperWorkerRequest): Promise<Blob> | null {
  if (!canUseWorker() || initFailed)
    return null
  return new Promise<Blob>((resolve, reject) => {
    queue.push({ req, resolve, reject })
    drain()
  })
}

export function xuanPaperPoolAvailable(): boolean {
  return canUseWorker() && !initFailed
}

/**
 * 预先把 pool fill 到 MAX_SIZE 个 worker（仅 spawn 不发任务）。
 * 同时跑 page paper（4 tile）+ curtain paper（4 tile）共 8 个 task，撞上
 * pool 容量后必须冷 spawn 新 worker。dev 模式新 worker 走 vite ESM 串行
 * transform 整条 shuimo-core 模块链耗时 1-3s（trace 实测最差 2.73s 的
 * RunMicrotasks 内部全是 URLLoader::OnCompletedRequest + v8.compileModule）。
 * 提前 fill 到上限把这部分 cold-start 推到 page load 早期分摊。
 */
export function preheatXuanPaperPool(count: number = MAX_SIZE): void {
  if (!canUseWorker() || initFailed)
    return
  const target = Math.min(count, MAX_SIZE)
  while (slots.length < target) {
    const slot = createSlot()
    if (!slot)
      break
    slots.push(slot)
  }
}
