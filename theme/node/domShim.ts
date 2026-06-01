import { createCanvas } from '@napi-rs/canvas'

/**
 * Install a minimal DOM shim so shuimo-core's canvas paths (xuanPaper,
 * InkMount.generate) run in Node. They call `document.createElement('canvas')`
 * / `new OffscreenCanvas(w, h)` internally; back both with @napi-rs/canvas.
 * Idempotent. Build-time only.
 */
export function installNodeCanvasShim(): void {
  const g = globalThis as Record<string, unknown>
  if (!g.document) {
    g.document = {
      createElement(tag: string) {
        if (tag === 'canvas')
          return createCanvas(300, 150)
        throw new Error(`shuimo share-card shim: unsupported element <${tag}>`)
      },
    }
  }
  if (!g.OffscreenCanvas)
    g.OffscreenCanvas = function OffscreenCanvas(w: number, h: number) { return createCanvas(w, h) }
}
