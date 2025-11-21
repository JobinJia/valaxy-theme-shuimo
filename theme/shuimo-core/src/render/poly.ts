import type { Point } from './types'

/**
 * 将点列表转换为 svg 折线片段
 */
export function poly(plist: Point[], args: any = {}): string {
  const xof = args.xof ?? 0
  const yof = args.yof ?? 0
  const fil = args.fil ?? 'rgba(0,0,0,0)'
  const str = args.str ?? fil
  const wid = args.wid ?? 0

  let canv = '<polyline points=\''
  for (const pt of plist) {
    canv += ` ${(pt[0] + xof).toFixed(1)},${(pt[1] + yof).toFixed(1)}`
  }
  canv += `' style='fill:${fil};stroke:${str};stroke-width:${wid}'/>`
  return canv
}
