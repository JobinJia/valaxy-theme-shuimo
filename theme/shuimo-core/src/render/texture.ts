import { noise } from './noise'
import { stroke } from './stroke'
import type { Point } from './types'

type TextureArgs = {
  xof?: number
  yof?: number
  tex?: number
  wid?: number
  len?: number
  sha?: number
  ret?: number
  noi?: (layer: number) => number
  col?: (ratio: number) => string
  dis?: () => number
}

/**
 * 为分层山体生成笔触纹理
 */
export function texture(ptlist: Point[][], args: TextureArgs = {}): string | Point[][] {
  if (ptlist.length === 0 || ptlist[0].length === 0) return args.ret ? [] : ''

  const xof = args.xof ?? 0
  const yof = args.yof ?? 0
  const tex = args.tex ?? 400
  const wid = args.wid ?? 1.5
  const len = args.len ?? 0.2
  const sha = args.sha ?? 0
  const ret = args.ret ?? 0
  const noi = args.noi ?? ((layer: number) => 30 / layer)
  const col = args.col ?? ((ratio: number) => `rgba(100,100,100,${(Math.random() * 0.3).toFixed(3)})`)
  const dis = args.dis ?? (() => (Math.random() > 0.5 ? (Math.random() / 3) : (2 / 3 + Math.random() / 3)))

  const reso: [number, number] = [ptlist.length, ptlist[0].length]
  const texlist: Point[][] = []

  for (let i = 0; i < tex; i++) {
    const mid = (dis() * reso[1]) | 0
    const hlen = Math.floor(Math.random() * (reso[1] * len))
    let start = mid - hlen
    let end = mid + hlen

    start = Math.min(Math.max(start, 0), reso[1])
    end = Math.min(Math.max(end, 0), reso[1])

    const layer = (i / tex) * (reso[0] - 1)

    texlist.push([])
    for (let j = start; j < end; j++) {
      const p = layer - Math.floor(layer)
      const x = ptlist[Math.floor(layer)][j][0] * p + ptlist[Math.ceil(layer)][j][0] * (1 - p)
      const y = ptlist[Math.floor(layer)][j][1] * p + ptlist[Math.ceil(layer)][j][1] * (1 - p)

      const ns: [number, number] = [
        noi(layer + 1) * (noise.noise(x, j * 0.5) - 0.5),
        noi(layer + 1) * (noise.noise(y, j * 0.5) - 0.5),
      ]

      texlist[texlist.length - 1].push([x + ns[0], y + ns[1]])
    }
  }

  let canv = ''
  if (sha) {
    const shadeStep = 1 + (sha !== 0 ? 1 : 0)
    for (let j = 0; j < texlist.length; j += shadeStep) {
      canv += stroke(
        texlist[j].map(pt => [pt[0] + xof, pt[1] + yof]),
        { col: 'rgba(100,100,100,0.1)', wid: sha },
      )
    }
  }

  for (let j = 0 + sha; j < texlist.length; j += 1 + sha) {
    canv += stroke(
      texlist[j].map(pt => [pt[0] + xof, pt[1] + yof]),
      { col: col(j / texlist.length), wid },
    )
  }

  return ret ? texlist : canv
}
