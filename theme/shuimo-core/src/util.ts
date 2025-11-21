import { polyTools } from './poly-tools'

type Point = [number, number]

/**
 * 通用几何与随机工具类，封装原有 util 方法
 */
export class UtilTools {
  /**
   * 将嵌套列表中的 NaN/undefined/null 替换为 0
   */
  unNan(plist: any): any {
    if (typeof plist !== 'object' || plist === null) {
      return plist || 0
    }
    return (plist as any[]).map(v => this.unNan(v))
  }

  /**
   * 两点距离
   */
  distance(p0: Point, p1: Point): number {
    return Math.sqrt((p0[0] - p1[0]) ** 2 + (p0[1] - p1[1]) ** 2)
  }

  /**
   * 区间映射
   */
  mapVal(value: number, istart: number, istop: number, ostart: number, ostop: number): number {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart))
  }

  /**
   * 将噪声序列首尾衔接并归一化
   */
  loopNoise(nslist: number[]): void {
    const dif = nslist[nslist.length - 1] - nslist[0]
    const bds: [number, number] = [100, -100]
    for (let i = 0; i < nslist.length; i++) {
      nslist[i] += (dif * (nslist.length - 1 - i)) / (nslist.length - 1)
      if (nslist[i] < bds[0])
        bds[0] = nslist[i]
      if (nslist[i] > bds[1])
        bds[1] = nslist[i]
    }
    for (let i = 0; i < nslist.length; i++) {
      nslist[i] = this.mapVal(nslist[i], bds[0], bds[1], 0, 1)
    }
  }

  /**
   * 随机选择数组元素
   */
  randChoice<T>(arr: T[]): T {
    return arr[Math.floor(arr.length * Math.random())]
  }

  /**
   * 区间随机数
   */
  normRand(m: number, M: number): number {
    return this.mapVal(Math.random(), 0, 1, m, M)
  }

  /**
   * 权重函数随机（接受 f(x) 返回概率）
   */
  wtrand(func: (x: number) => number): number {
    const x = Math.random()
    const y = Math.random()
    if (y < func(x)) {
      return x
    }
    return this.wtrand(func)
  }

  /**
   * 高斯分布随机数
   */
  randGaussian(): number {
    return this.wtrand(x => Math.E ** (-24 * (x - 0.5) ** 2)) * 2 - 1
  }

  /**
   * 细分点列表（线性插值）
   * 将每两个相邻点之间插入若干新点
   */
  div(ptlist: Point[], reso: number): Point[] {
    const result: Point[] = []
    for (let j = 0; j < ptlist.length - 1; j++) {
      for (let i = 0; i < reso; i++) {
        const p = i / reso
        const nx = ptlist[j][0] * (1 - p) + ptlist[j + 1][0] * p
        const ny = ptlist[j][1] * (1 - p) + ptlist[j + 1][1] * p
        result.push([nx, ny])
      }
    }
    result.push(ptlist[ptlist.length - 1])
    return result
  }

  /**
   * 平滑贝塞尔插值
   */
  bezmh(P: Point[], w = 1): Point[] {
    let pts: Point[] = P
    if (pts.length === 2) {
      pts = [pts[0], polyTools.midPt(pts[0], pts[1]), pts[1]]
    }
    const plist: Point[] = []
    for (let j = 0; j < pts.length - 2; j++) {
      const p0 = j === 0 ? pts[j] : polyTools.midPt(pts[j], pts[j + 1])
      const p1 = pts[j + 1]
      const p2 = j === pts.length - 3 ? pts[j + 2] : polyTools.midPt(pts[j + 1], pts[j + 2])
      const pl = 20
      for (let i = 0; i < pl + (j === pts.length - 3 ? 1 : 0); i += 1) {
        const t = i / pl
        const u = (1 - t) ** 2 + 2 * t * (1 - t) * w + t * t
        plist.push([
          ((1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * p1[0] * w + t * t * p2[0]) / u,
          ((1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * p1[1] * w + t * t * p2[1]) / u,
        ])
      }
    }
    return plist
  }

  /**
   * 生成 polyline 片段
   */
  poly(plist: Point[], args: any = {}): string {
    const xof = args.xof ?? 0
    const yof = args.yof ?? 0
    const fil = args.fil ?? 'rgba(0,0,0,0)'
    const str = args.str ?? fil
    const wid = args.wid ?? 0

    let canv = '<polyline points=\''
    for (let i = 0; i < plist.length; i++) {
      canv += ` ${(plist[i][0] + xof).toFixed(1)},${(plist[i][1] + yof).toFixed(1)}`
    }
    canv += `' style='fill:${fil};stroke:${str};stroke-width:${wid}'/>`
    return canv
  }
}

/**
 * 便捷实例，直接 utilTools.xxx 调用
 */
export const utilTools = new UtilTools()
