// Dedicated Worker：把 generateFlowerCanvas 整段移出主线程，消掉 mobile 首屏 1.3s 长任务。
//
// shuimo-core flower 路径只摸 document.createElement('canvas')（背景默认 'none'，不会落进 paper()），
// 故 worker 里只需把 createElement 'canvas' 路由到 OffscreenCanvas，即可让整条 herbal/woody 链路跑在 worker 里。
// 输出 ImageBitmap（transferable，零拷贝），主线程一次 drawImage 上屏，无 PNG encode。
//
// 模块结构：
//   import './mobile-flower-document-shim' 必须在 import shuimo-core 之前求值，
//   利用 ESM 静态依赖序：先 shim → 再 shuimo-core，保证 shuimo-core 模块体内任何
//   `document.createElement('canvas')` 调用都拿到我们的 stub。
//
// 消息协议:
//   in:  { id: number, width: number, height: number, seed: number, type: 'woody'|'herbal'|'random' }
//   out: { id: number, bitmap: ImageBitmap, width: number, height: number } | { id: number, error: string }

// 顺序敏感：shim 必须在 shuimo-core import 之前求值，因此关闭 import 排序规则
/* eslint-disable perfectionist/sort-imports */
import './mobile-flower-document-shim'
import { generateFlowerCanvas } from '@jobinjia/shuimo-core'
/* eslint-enable perfectionist/sort-imports */

interface FlowerInMsg {
  id: number
  width: number
  height: number
  seed: number
  type: 'woody' | 'herbal' | 'random'
}

interface WorkerScope {
  onmessage: ((ev: MessageEvent<FlowerInMsg>) => void) | null
  postMessage: (msg: unknown, transfer?: Transferable[]) => void
}

const workerScope = globalThis as unknown as WorkerScope

// 与主线程 fallback 中的 removeFlowerPaperBackground 像素级等价；
// worker 里无需 rAF chunk，整段同步跑完更快。
function stripPaperBackground(canvas: OffscreenCanvas): void {
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return
  const { width, height } = canvas
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  for (let i = 0, n = data.length; i < n; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const brightness = (r + g + b) / 3
    const saturation = Math.max(r, g, b) - Math.min(r, g, b)

    if (brightness > 248 && saturation < 10) {
      data[i + 3] = 0
    }
    else if (brightness > 236 && saturation < 16) {
      data[i + 3] = Math.round(data[i + 3]! * ((248 - brightness) / 12))
    }
  }
  ctx.putImageData(image, 0, 0)
}

workerScope.onmessage = (event) => {
  const { id, width, height, seed, type } = event.data
  try {
    // shim 让返回的实际是 OffscreenCanvas；shuimo-core 类型签名是 HTMLCanvasElement，cast 即可
    const canvas = generateFlowerCanvas({ seed, type, width, height }) as unknown as OffscreenCanvas
    stripPaperBackground(canvas)
    const bitmap = canvas.transferToImageBitmap()
    workerScope.postMessage({ id, bitmap, width, height }, [bitmap])
  }
  catch (err) {
    workerScope.postMessage({
      id,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
