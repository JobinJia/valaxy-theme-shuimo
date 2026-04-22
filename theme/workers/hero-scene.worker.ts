// Dedicated Worker 入口：生成 hero 山水画并栅格化成 PNG。
// 输出 PNG blob 而不是 SVG 字符串，避开浏览器每帧对超大矢量 (15MB+) 的重新光栅化，
// 让合成线程保持流畅。
// 消息协议:
//   in:  { id: number, W: number, H: number, seed: number }
//   out: { id: number, scene: HeroScene } | { id: number, error: string }

import { buildHeroScene } from '../composables/useHeroScene'

interface WorkerScope {
  onmessage: ((ev: MessageEvent<{ id: number, W: number, H: number, seed: number }>) => void) | null
  postMessage: (msg: unknown) => void
}

const workerScope = globalThis as unknown as WorkerScope

async function rasterizeSvgToPng(svg: string, W: number, H: number): Promise<Blob | null> {
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined')
    return null
  try {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
    const bitmap = await createImageBitmap(svgBlob)
    const canvas = new OffscreenCanvas(W, H)
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return null
    ctx.drawImage(bitmap, 0, 0, W, H)
    bitmap.close?.()
    return await canvas.convertToBlob({ type: 'image/png' })
  }
  catch {
    return null
  }
}

workerScope.onmessage = async (event) => {
  const { id, W, H, seed } = event.data
  try {
    const scene = await buildHeroScene(W, H, seed)
    const png = await rasterizeSvgToPng(scene.svg, W, H)
    // PNG 成功 → 只传 PNG（省掉 15MB SVG 的 structured-clone 开销）；失败则退回传 SVG
    const payload = png
      ? { blankSide: scene.blankSide, seed: scene.seed, png }
      : { blankSide: scene.blankSide, seed: scene.seed, svg: scene.svg }
    workerScope.postMessage({ id, scene: payload })
  }
  catch (err) {
    workerScope.postMessage({
      id,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
