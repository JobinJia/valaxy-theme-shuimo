import type { Point } from '../render/types'
import { poly } from '../render/poly'
import { stroke } from '../render/stroke'
import { Man } from './man'

/**
 * 建筑物生成模块
 */
export const Arch = {
  /**
   * 小船
   */
  boat(xoff: number, yoff: number, _seed: number = 0, args: any = {}): string {
    const len = args.len ?? 120
    const sca = args.sca ?? 1
    const fli = args.fli ?? false
    let canv = ''

    const dir = fli ? -1 : 1
    canv += Man.man(xoff + 20 * sca * dir, yoff, {
      ite: Man.stick01,
      hat: Man.hat02,
      sca: 0.5 * sca,
      fli: !fli,
      len: [0, 30, 20, 30, 10, 30, 30, 30, 30],
    })

    const plist1: Point[] = []
    const plist2: Point[] = []
    const fun1 = (x: number) => {
      return (Math.sin(x * Math.PI) ** 0.5) * 7 * sca
    }
    const fun2 = (x: number) => {
      return (Math.sin(x * Math.PI) ** 0.5) * 10 * sca
    }
    for (let i = 0; i < len * sca; i += 5 * sca) {
      plist1.push([i * dir, fun1(i / len)])
      plist2.push([i * dir, fun2(i / len)])
    }
    const plist = plist1.concat(plist2.reverse())
    canv += poly(plist, { xof: xoff, yof: yoff, fil: 'url(#paperTexture)' })
    canv += stroke(
      plist.map(v => [xoff + v[0], yoff + v[1]]),
      {
        wid: 1,
        fun: (x: number) => {
          return Math.sin(x * Math.PI * 2)
        },
        col: 'rgba(100,100,100,0.4)',
      },
    )

    return canv
  },
}
