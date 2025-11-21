import type { Point } from './types'
import { noise } from './noise'
import { poly } from './poly'

/**
 * 根据点串生成带宽度的笔触
 */
export function stroke(ptlist: Point[], args: any = {}): string {
  const xof = args.xof ?? 0
  const yof = args.yof ?? 0
  const wid = args.wid ?? 2
  const col = args.col ?? 'rgba(200,200,200,0.9)'
  const noi = args.noi ?? 0.5
  const out = args.out ?? 1
  const fun = args.fun ?? ((x: number) => Math.sin(x * Math.PI))

  if (ptlist.length === 0)
    return ''

  const vtxlist0: Point[] = []
  const vtxlist1: Point[] = []
  const n0 = Math.random() * 10

  for (let i = 1; i < ptlist.length - 1; i++) {
    let w = wid * fun(i / ptlist.length)
    w = w * (1 - noi) + w * noi * noise.noise(i * 0.5, n0)

    const a1 = Math.atan2(ptlist[i][1] - ptlist[i - 1][1], ptlist[i][0] - ptlist[i - 1][0])
    const a2 = Math.atan2(ptlist[i][1] - ptlist[i + 1][1], ptlist[i][0] - ptlist[i + 1][0])
    let a = (a1 + a2) / 2
    if (a < a2)
      a += Math.PI

    vtxlist0.push([ptlist[i][0] + w * Math.cos(a), ptlist[i][1] + w * Math.sin(a)])
    vtxlist1.push([ptlist[i][0] - w * Math.cos(a), ptlist[i][1] - w * Math.sin(a)])
  }

  const vtxlist = [ptlist[0]]
    .concat(vtxlist0)
    .concat(vtxlist1.reverse())
    .concat([ptlist[ptlist.length - 1]])
    .concat([ptlist[0]])

  return poly(
    vtxlist.map(x => [x[0] + xof, x[1] + yof]),
    { fil: col, str: col, wid: out },
  )
}
