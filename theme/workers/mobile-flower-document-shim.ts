// 必须先于 @jobinjia/shuimo-core 的 import 求值：在 worker 里给 shuimo-core 的
// `document.createElement('canvas')` 调用提供一个返回 OffscreenCanvas 的 stub。
// flower 路径（背景默认 'none'）只摸 createElement('canvas')，不会落进任何 SVG / body 路径。
//
// 本文件被 mobile-flower.worker.ts 用 `import './mobile-flower-document-shim'` 在最顶部引入，
// 利用 ESM 静态依赖图保证它的求值早于同 worker 中所有 `import { ... } from '@jobinjia/shuimo-core'`。
//
// 旁路消费者：dev 模式下 Vite 会把 `@vite/client` 注入到本 worker 里做 HMR；该模块顶层有
// `"document" in globalThis ? document.querySelector("meta[property=csp-nonce]") : void 0`，
// 因为我们装了 shim，`"document" in globalThis` 命中 truthy 分支 → 调到 shim 上不存在的方法
// 抛 TypeError。下面的 querySelector / 事件 / visibilityState stub 就是给 @vite/client 兜底用的，
// 与 shuimo-core flower 路径无关；prod build 里 @vite/client 不会被注入，这些 stub 等于 dead code。

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
  // 仅供 @vite/client (dev HMR) 使用：cspNonce 顶层读取 + CSS HMR / overlay / visibilitychange 路径。
  querySelector(): null {
    return null
  },
  querySelectorAll(): [] {
    return []
  },
  addEventListener(): void {},
  removeEventListener(): void {},
  get visibilityState(): 'visible' {
    return 'visible'
  },
}
;(globalThis as unknown as { document: typeof documentShim }).document = documentShim

export {}
