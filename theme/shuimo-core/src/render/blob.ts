import type { Point } from './types'
import { loopNoise } from './loop-noise'
import { noise } from './noise'
import { poly } from './poly'

/**
 * 生成叶片/墨团形状，可返回路径或点序列
 */
export function blob(x: number, y: number, args: any = {}): string | Point[] {
  const len = args.len ?? 20
  const wid = args.wid ?? 5
  const ang = args.ang ?? 0
  const col = args.col ?? 'rgba(200,200,200,0.9)'
  const noi = args.noi ?? 0.5
  const ret = args.ret ?? 0
  const fun = args.fun ?? ((v: number) => {
    return v <= 1
      ? Math.sin(v * Math.PI) ** 0.5
      : -(Math.sin((v + 1) * Math.PI) ** 0.5)
  })

  const reso = 20.0
  const lalist: [number, number][] = []

  for (let i = 0; i < reso + 1; i++) {
    const p = (i / reso) * 2
    const xo = len / 2 - Math.abs(p - 1) * len
    const yo = (fun(p) * wid) / 2
    const a = Math.atan2(yo, xo)
    const l = Math.sqrt(xo * xo + yo * yo)
    lalist.push([l, a])
  }

  const nslist: number[] = []
  const n0 = Math.random() * 10

  for (let i = 0; i < reso + 1; i++) {
    nslist.push(noise.noise(i * 0.05, n0))
  }

  loopNoise(nslist)

  const plist: Point[] = []
  for (let i = 0; i < lalist.length; i++) {
    const ns = nslist[i] * noi + (1 - noi)
    const nx = x + Math.cos(lalist[i][1] + ang) * lalist[i][0] * ns
    const ny = y + Math.sin(lalist[i][1] + ang) * lalist[i][0] * ns
    plist.push([nx, ny])
  }

  if (ret === 0) {
    return poly(plist, { fil: col, str: col, wid: 0 })
  }
  return plist
}
