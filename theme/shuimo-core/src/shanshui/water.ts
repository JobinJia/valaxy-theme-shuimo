import type { Point } from '../render/types'
import { stroke } from '../render/stroke'
import { noise } from '../render/noise'

/**
 * 水面效果 - 表现江河湖面的波纹
 *
 * 在传统中国山水画中，水面常用横向的波浪线条来表现
 * 线条疏密有致，由近及远逐渐变淡
 */
export function water(xoff: number, yoff: number, seed: number, args: any = {}): string {
  const wid = args.wid ?? 800

  let canv = ''
  const reso = 35

  // 绘制 3-4 层水波纹，由近及远
  const waveCount = 3 + Math.floor(Math.random() * 2)

  for (let i = 0; i < waveCount; i++) {
    const wavelist: Point[] = []

    // 每层波纹的垂直间距
    const layerSpacing = 15

    for (let j = 0; j < reso; j++) {
      const x = (j / (reso - 1) - 0.5) * wid

      // 使用噪声生成自然的波浪形状
      const noiseVal = noise.noise(j * 0.1, i * 0.5, seed)
      const waveHeight = noiseVal * 8 // 波浪起伏高度
      const y = waveHeight + i * layerSpacing

      wavelist.push([x + xoff, y + yoff])
    }

    // 由近及远，透明度逐渐降低
    const alpha = 0.2 + i * 0.1

    canv += stroke(wavelist, {
      col: `rgba(100,100,100,${alpha.toFixed(2)})`,
      wid: 1,
      noi: 0.6,
    })
  }

  return canv
}
