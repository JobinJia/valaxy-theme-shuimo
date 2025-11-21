/**
 * 多边形工具类，封装边长、面积、三角化等计算
 */
export class PolyTools {
  /**
   * 计算多个点的中点
   */
  midPt(...plist: [number, number][]): [number, number] {
    const first = plist[0] as unknown
    const points = plist.length === 1 && Array.isArray(first) && Array.isArray((first as any)[0])
      ? first as [number, number][]
      : plist
    return points.reduce<[number, number]>(
      (acc, v, _idx, arr) => [v[0] / arr.length + acc[0], v[1] / arr.length + acc[1]],
      [0, 0],
    )
  }

  triangulate(plist: [number, number][], args: any = {}): [number, number][][] {
    const area = args.area ?? 100
    const convex = args.convex ?? false
    const optimize = args.optimize ?? true

    const lineExpr = (pt0: [number, number], pt1: [number, number]): [number, number] => {
      const den = pt1[0] - pt0[0]
      const m = den === 0 ? Infinity : (pt1[1] - pt0[1]) / den
      const k = pt0[1] - m * pt0[0]
      return [m, k]
    }

    const intersect = (ln0: [[number, number], [number, number]], ln1: [[number, number], [number, number]]):
      | false
      | [number, number] => {
      const le0 = lineExpr(...ln0)
      const le1 = lineExpr(...ln1)
      const den = le0[0] - le1[0]
      if (den === 0)
        return false
      const x = (le1[1] - le0[1]) / den
      const y = le0[0] * x + le0[1]
      const onSeg = (p: [number, number], ln: [[number, number], [number, number]]) => {
        return (
          Math.min(ln[0][0], ln[1][0]) <= p[0]
          && p[0] <= Math.max(ln[0][0], ln[1][0])
          && Math.min(ln[0][1], ln[1][1]) <= p[1]
          && p[1] <= Math.max(ln[0][1], ln[1][1])
        )
      }
      if (onSeg([x, y], ln0) && onSeg([x, y], ln1))
        return [x, y]
      return false
    }

    const ptInPoly = (pt: [number, number], list: [number, number][]) => {
      let scount = 0
      for (let i = 0; i < list.length; i++) {
        const np = list[i !== list.length - 1 ? i + 1 : 0]
        const sect = intersect([list[i], np], [pt, [pt[0] + 999, pt[1] + 999]])
        if (sect !== false)
          scount++
      }
      return scount % 2 === 1
    }

    const lnInPoly = (ln: [[number, number], [number, number]], list: [number, number][]) => {
      const lnc: [[number, number], [number, number]] = [
        [0, 0],
        [0, 0],
      ]
      const ep = 0.01

      lnc[0][0] = ln[0][0] * (1 - ep) + ln[1][0] * ep
      lnc[0][1] = ln[0][1] * (1 - ep) + ln[1][1] * ep
      lnc[1][0] = ln[0][0] * ep + ln[1][0] * (1 - ep)
      lnc[1][1] = ln[0][1] * ep + ln[1][1] * (1 - ep)

      for (let i = 0; i < list.length; i++) {
        const pt = list[i]
        const np = list[i !== list.length - 1 ? i + 1 : 0]
        if (intersect(lnc, [pt, np]) !== false)
          return false
      }
      const mid = this.midPt(...ln)
      if (!ptInPoly(mid, list))
        return false
      return true
    }

    const sidesOf = (list: [number, number][]) => {
      const slist: number[] = []
      for (let i = 0; i < list.length; i++) {
        const pt = list[i]
        const np = list[i !== list.length - 1 ? i + 1 : 0]
        const s = Math.sqrt((np[0] - pt[0]) ** 2 + (np[1] - pt[1]) ** 2)
        slist.push(s)
      }
      return slist
    }

    const areaOf = (list: [number, number][]) => {
      const slist = sidesOf(list)
      const [a, b, c] = slist
      const s = (a + b + c) / 2
      return Math.sqrt(s * (s - a) * (s - b) * (s - c))
    }

    const sliverRatio = (list: [number, number][]) => {
      const A = areaOf(list)
      const P = sidesOf(list).reduce((m, n) => m + n, 0)
      return A / P
    }

    const bestEar = (list: [number, number][]) => {
      const cuts: [[number, number][], [number, number][]][] = []
      for (let i = 0; i < list.length; i++) {
        const pt = list[i]
        const lp = list[i !== 0 ? i - 1 : list.length - 1]
        const np = list[i !== list.length - 1 ? i + 1 : 0]
        const qlist = list.slice()
        qlist.splice(i, 1)
        if (convex || lnInPoly([lp, np], list)) {
          const c: [[number, number][], [number, number][]] = [[lp, pt, np], qlist]
          if (!optimize)
            return c
          cuts.push(c)
        }
      }
      let best: [[number, number][], [number, number][]] = [list, []]
      let bestRatio = 0
      for (let i = 0; i < cuts.length; i++) {
        const r = sliverRatio(cuts[i][0])
        if (r >= bestRatio) {
          best = cuts[i]
          bestRatio = r
        }
      }
      return best
    }

    const shatter = (list: [number, number][], a: number): [number, number][][] => {
      if (list.length === 0)
        return []
      if (areaOf(list) < a) {
        return [list]
      }

      const slist = sidesOf(list)
      const ind = slist.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0)
      const nind = (ind + 1) % list.length
      const lind = (ind + 2) % list.length
      let mid: [number, number]
      try {
        mid = this.midPt(list[ind], list[nind])
      }
      catch (err) {
        console.log(list)
        console.log(err)
        return []
      }
      return shatter([list[ind], mid, list[lind]], a).concat(shatter([list[lind], list[nind], mid], a))
    }

    if (plist.length <= 3) {
      return shatter(plist, area)
    }
    else {
      const cut = bestEar(plist)
      return shatter(cut[0], area).concat(this.triangulate(cut[1], args))
    }
  }

  /**
   * Bezier Curve with Midpoints (Rational Bezier)
   */
  bezmh(P: [number, number][], w: number = 1): [number, number][] {
    if (P.length === 2) {
      P = [P[0], this.midPt(P[0], P[1]), P[1]]
    }
    const plist: [number, number][] = []
    for (let j = 0; j < P.length - 2; j++) {
      let p0: [number, number]
      let p1: [number, number]
      let p2: [number, number]
      if (j === 0) {
        p0 = P[j]
      }
      else {
        p0 = this.midPt(P[j], P[j + 1])
      }
      p1 = P[j + 1]
      if (j === P.length - 3) {
        p2 = P[j + 2]
      }
      else {
        p2 = this.midPt(P[j + 1], P[j + 2])
      }
      const pl = 20
      for (let i = 0; i < pl + (j === P.length - 3 ? 1 : 0); i += 1) {
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
}

/**
 * 便捷实例，便于直接调用 polyTools.midPt 等方法
 */
export const polyTools = new PolyTools()
