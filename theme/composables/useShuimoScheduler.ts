/**
 * 水墨生成任务调度器
 * 避免多个重计算组件同时执行导致主线程卡死
 */

type Task<T = any> = () => Promise<T>

const queue: Array<{ task: Task, resolve: (v: any) => void, reject: (e: any) => void }> = []
let running = false

async function processQueue() {
  if (running)
    return
  running = true

  while (queue.length > 0) {
    const item = queue.shift()!
    try {
      // 每个任务之前让出主线程，避免连续阻塞
      await yieldToMain()
      const result = await item.task()
      item.resolve(result)
    }
    catch (e) {
      item.reject(e)
    }
  }

  running = false
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => resolve(), { timeout: 100 })
    }
    else {
      setTimeout(resolve, 16)
    }
  })
}

/**
 * 将重计算任务排入队列，串行执行
 * 保证同一时间只有一个重计算任务在跑
 */
export function scheduleShuimoTask<T>(task: Task<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject })
    processQueue()
  })
}
