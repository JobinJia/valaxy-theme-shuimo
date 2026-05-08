// 必须先于 @jobinjia/shuimo-core 的 import 求值：在 worker 里给 shuimo-core 的
// `document.createElement('canvas')` 调用提供一个返回 OffscreenCanvas 的 stub。
// flower 路径（背景默认 'none'）只摸 createElement('canvas')，不会落进任何 SVG / body 路径。
//
// 本文件被 mobile-flower.worker.ts 用 `import './mobile-flower-document-shim'` 在最顶部引入，
// 利用 ESM 静态依赖图保证它的求值早于同 worker 中所有 `import { ... } from '@jobinjia/shuimo-core'`。

const documentShim = {
  createElement(tagName: string): OffscreenCanvas {
    if (tagName === 'canvas')
      return new OffscreenCanvas(1, 1)
    throw new Error(`[shuimo flower worker] document.createElement(${JSON.stringify(tagName)}) 不应被 flower 路径触发`)
  },
  createElementNS(): never {
    throw new Error(`[shuimo flower worker] document.createElementNS 不应被 flower 路径触发`)
  },
  body: {
    appendChild(): void {
      throw new Error(`[shuimo flower worker] document.body.appendChild 不应被 flower 路径触发`)
    },
    removeChild(): void {
      throw new Error(`[shuimo flower worker] document.body.removeChild 不应被 flower 路径触发`)
    },
    contains(): boolean {
      return false
    },
  },
}
;(globalThis as unknown as { document: typeof documentShim }).document = documentShim

export {}
