import type { Point } from './types'

/**
 * 将折线按分辨率插值细分
 */
export function divide(plist: Point[], reso: number): Point[] {
  const tl = (plist.length - 1) * reso
  let lx = 0
  let ly = 0
  const rlist: Point[] = []

  for (let i = 0; i < tl; i += 1) {
    const lastp = plist[Math.floor(i / reso)]
    const nextp = plist[Math.ceil(i / reso)]
    const p = (i % reso) / reso
    const nx = lastp[0] * (1 - p) + nextp[0] * p
    const ny = lastp[1] * (1 - p) + nextp[1] * p

    const _angle = Math.atan2(ny - ly, nx - lx) // 保留原逻辑中的角度计算，保持行为一致
    void _angle
    rlist.push([nx, ny])
    lx = nx
    ly = ny
  }

  if (plist.length > 0) {
    rlist.push(plist[plist.length - 1])
  }
  return rlist
}
