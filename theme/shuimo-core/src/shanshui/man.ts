import type { Point } from '../render/types'
import { polyTools } from '../poly-tools'
import { noise } from '../render/noise'
import { poly } from '../render/poly'
import { stroke } from '../render/stroke'
import { utilTools } from '../util'

/**
 * 人物生成模块
 */
export const Man = {
  hat01(p0: Point, p1: Point, args: any = {}): string {
    const fli = args.fli ?? false
    let canv = ''
    const seed = Math.random()
    const f = fli ? (x: Point[]) => x.map(v => [-v[0], v[1]] as Point) : (x: Point[]) => x

    const tranpoly = (p0: Point, p1: Point, ptlist: Point[]) => {
      const plist = ptlist.map(v => [-v[0], v[1]] as Point)
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) - Math.PI / 2
      const scl = utilTools.distance(p0, p1)
      const qlist = plist.map((v) => {
        const d = utilTools.distance(v, [0, 0])
        const a = Math.atan2(v[1], v[0])
        return [p0[0] + d * scl * Math.cos(ang + a), p0[1] + d * scl * Math.sin(ang + a)] as Point
      })
      return qlist
    }

    canv += poly(
      tranpoly(
        p0,
        p1,
        f([
          [-0.3, 0.5],
          [0.3, 0.8],
          [0.2, 1],
          [0, 1.1],
          [-0.3, 1.15],
          [-0.55, 1],
          [-0.65, 0.5],
        ]),
      ),
      { fil: 'rgba(100,100,100,0.8)' },
    )

    const qlist1: Point[] = []
    for (let i = 0; i < 10; i++) {
      qlist1.push([-0.3 - noise.noise(i * 0.2, seed) * i * 0.1, 0.5 - i * 0.3])
    }
    canv += poly(tranpoly(p0, p1, f(qlist1)), {
      str: 'rgba(100,100,100,0.8)',
      wid: 1,
    })

    return canv
  },

  hat02(p0: Point, p1: Point, args: any = {}): string {
    const fli = args.fli ?? false
    let canv = ''
    // const seed = Math.random()
    const f = fli ? (x: Point[]) => x.map(v => [-v[0], v[1]] as Point) : (x: Point[]) => x

    const tranpoly = (p0: Point, p1: Point, ptlist: Point[]) => {
      const plist = ptlist.map(v => [-v[0], v[1]] as Point)
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) - Math.PI / 2
      const scl = utilTools.distance(p0, p1)
      const qlist = plist.map((v) => {
        const d = utilTools.distance(v, [0, 0])
        const a = Math.atan2(v[1], v[0])
        return [p0[0] + d * scl * Math.cos(ang + a), p0[1] + d * scl * Math.sin(ang + a)] as Point
      })
      return qlist
    }

    canv += poly(
      tranpoly(
        p0,
        p1,
        f([
          [-0.3, 0.5],
          [-1.1, 0.5],
          [-1.2, 0.6],
          [-1.1, 0.7],
          [-0.3, 0.8],
          [0.3, 0.8],
          [1.0, 0.7],
          [1.3, 0.6],
          [1.2, 0.5],
          [0.3, 0.5],
        ]),
      ),
      { fil: 'rgba(100,100,100,0.8)' },
    )
    return canv
  },

  stick01(p0: Point, p1: Point, args: any = {}): string {
    const fli = args.fli ?? false
    let canv = ''
    const seed = Math.random()
    const f = fli ? (x: Point[]) => x.map(v => [-v[0], v[1]] as Point) : (x: Point[]) => x

    const tranpoly = (p0: Point, p1: Point, ptlist: Point[]) => {
      const plist = ptlist.map(v => [-v[0], v[1]] as Point)
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) - Math.PI / 2
      const scl = utilTools.distance(p0, p1)
      const qlist = plist.map((v) => {
        const d = utilTools.distance(v, [0, 0])
        const a = Math.atan2(v[1], v[0])
        return [p0[0] + d * scl * Math.cos(ang + a), p0[1] + d * scl * Math.sin(ang + a)] as Point
      })
      return qlist
    }

    const qlist1: Point[] = []
    const l = 12
    for (let i = 0; i < l; i++) {
      qlist1.push([-noise.noise(i * 0.1, seed) * 0.1 * Math.sin((i / l) * Math.PI) * 5, 0 + i * 0.3])
    }
    canv += poly(tranpoly(p0, p1, f(qlist1)), {
      str: 'rgba(100,100,100,0.5)',
      wid: 1,
    })

    return canv
  },

  man(xoff: number, yoff: number, args: any = {}): string {
    const sca = args.sca ?? 0.5
    const hat = args.hat ?? Man.hat01
    const ite = args.ite ?? (() => '')
    const fli = args.fli ?? true
    const ang = args.ang ?? [
      0,
      -Math.PI / 2,
      utilTools.normRand(0, 0),
      (Math.PI / 4) * Math.random(),
      ((Math.PI * 3) / 4) * Math.random(),
      (Math.PI * 3) / 4,
      -Math.PI / 4,
      (-Math.PI * 3) / 4 - (Math.PI / 4) * Math.random(),
      -Math.PI / 4,
    ]
    let len = args.len ?? [0, 30, 20, 30, 30, 30, 30, 30, 30]

    len = len.map((v: number) => v * sca)
    let canv = ''
    const sct: any = {
      0: { 1: { 2: {}, 5: { 6: {} }, 7: { 8: {} } }, 3: { 4: {} } },
    }
    const toGlobal = (v: Point) => [(fli ? -1 : 1) * v[0] + xoff, v[1] + yoff] as Point

    function gpar(sct: any, ind: string): any[] | false {
      const keys = Object.keys(sct)
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] === ind) {
          return [ind]
        }
        else {
          const r = gpar(sct[keys[i]], ind)
          if (r !== false) {
            return [keys[i]].concat(r)
          }
        }
      }
      return false
    }

    function grot(sct: any, ind: string) {
      const par = gpar(sct, ind) as string[]
      let rot = 0
      for (let i = 0; i < par.length; i++) {
        rot += ang[Number.parseInt(par[i])]
      }
      return rot
    }

    function gpos(sct: any, ind: string) {
      const par = gpar(sct, ind) as string[]
      const pos = [0, 0]
      for (let i = 0; i < par.length; i++) {
        const a = grot(sct, par[i])
        pos[0] += len[Number.parseInt(par[i])] * Math.cos(a)
        pos[1] += len[Number.parseInt(par[i])] * Math.sin(a)
      }
      return pos
    }

    const pts: Point[] = []
    for (let i = 0; i < ang.length; i++) {
      pts.push(gpos(sct, i.toString()) as Point)
    }
    yoff -= pts[4][1]

    // for (let i = 1; i < pts.length; i++) {
    //   const par = gpar(sct, i.toString()) as string[]
    //   const p0 = gpos(sct, par[par.length - 2])
    //   // const s = utilTools.div([p0, pts[i]], 10)
    //   // canv += stroke(s.map(toGlobal))
    // }

    const cloth = (plist: Point[], fun: (x: number) => number) => {
      let canv = ''
      const tlist = polyTools.bezmh(plist, 2)

      // expand logic inline since it's not exported
      const expand = (ptlist: Point[], wfun: (x: number) => number) => {
        const vtxlist0: Point[] = []
        const vtxlist1: Point[] = []

        for (let i = 1; i < ptlist.length - 1; i++) {
          const w = wfun(i / ptlist.length)
          const a1 = Math.atan2(ptlist[i][1] - ptlist[i - 1][1], ptlist[i][0] - ptlist[i - 1][0])
          const a2 = Math.atan2(ptlist[i][1] - ptlist[i + 1][1], ptlist[i][0] - ptlist[i + 1][0])
          let a = (a1 + a2) / 2
          if (a < a2) {
            a += Math.PI
          }
          vtxlist0.push([ptlist[i][0] + w * Math.cos(a), ptlist[i][1] + w * Math.sin(a)])
          vtxlist1.push([ptlist[i][0] - w * Math.cos(a), ptlist[i][1] - w * Math.sin(a)])
        }
        const l = ptlist.length - 1
        const a0 = Math.atan2(ptlist[1][1] - ptlist[0][1], ptlist[1][0] - ptlist[0][0]) - Math.PI / 2
        const a1 = Math.atan2(ptlist[l][1] - ptlist[l - 1][1], ptlist[l][0] - ptlist[l - 1][0]) - Math.PI / 2
        const w0 = wfun(0)
        const w1 = wfun(1)
        vtxlist0.unshift([ptlist[0][0] + w0 * Math.cos(a0), ptlist[0][1] + w0 * Math.sin(a0)])
        vtxlist1.unshift([ptlist[0][0] - w0 * Math.cos(a0), ptlist[0][1] - w0 * Math.sin(a0)])
        vtxlist0.push([ptlist[l][0] + w1 * Math.cos(a1), ptlist[l][1] + w1 * Math.sin(a1)])
        vtxlist1.push([ptlist[l][0] - w1 * Math.cos(a1), ptlist[l][1] - w1 * Math.sin(a1)])
        return [vtxlist0, vtxlist1]
      }

      const [tlist1, tlist2] = expand(tlist, fun)
      canv += poly(tlist1.concat(tlist2.reverse()).map(toGlobal), {
        fil: 'url(#paperTexture)',
      })
      canv += stroke(tlist1.map(toGlobal), {
        wid: 1,
        col: 'rgba(100,100,100,0.5)',
      })
      canv += stroke(tlist2.map(toGlobal), {
        wid: 1,
        col: 'rgba(100,100,100,0.6)',
      })

      return canv
    }

    const fsleeve = (x: number) => {
      return sca * 8 * (Math.sin(0.5 * x * Math.PI) * (Math.sin(x * Math.PI) ** 0.1) + (1 - x) * 0.4)
    }
    const fbody = (x: number) => {
      return sca * 11 * (Math.sin(0.5 * x * Math.PI) * (Math.sin(x * Math.PI) ** 0.1) + (1 - x) * 0.5)
    }
    const fhead = (x: number) => {
      return sca * 7 * (0.25 - (x - 0.5) ** 2) ** 0.3
    }

    canv += ite(toGlobal(pts[8]), toGlobal(pts[6]), { fli })

    canv += cloth([pts[1], pts[7], pts[8]], fsleeve)
    canv += cloth([pts[1], pts[0], pts[3], pts[4]], fbody)
    canv += cloth([pts[1], pts[5], pts[6]], fsleeve)
    canv += cloth([pts[1], pts[2]], fhead)

    const hlist = polyTools.bezmh([pts[1], pts[2]], 2)

    // expand logic repeated
    const expand = (ptlist: Point[], wfun: (x: number) => number) => {
      const vtxlist0: Point[] = []
      const vtxlist1: Point[] = []

      for (let i = 1; i < ptlist.length - 1; i++) {
        const w = wfun(i / ptlist.length)
        const a1 = Math.atan2(ptlist[i][1] - ptlist[i - 1][1], ptlist[i][0] - ptlist[i - 1][0])
        const a2 = Math.atan2(ptlist[i][1] - ptlist[i + 1][1], ptlist[i][0] - ptlist[i + 1][0])
        let a = (a1 + a2) / 2
        if (a < a2) {
          a += Math.PI
        }
        vtxlist0.push([ptlist[i][0] + w * Math.cos(a), ptlist[i][1] + w * Math.sin(a)])
        vtxlist1.push([ptlist[i][0] - w * Math.cos(a), ptlist[i][1] - w * Math.sin(a)])
      }
      const l = ptlist.length - 1
      const a0 = Math.atan2(ptlist[1][1] - ptlist[0][1], ptlist[1][0] - ptlist[0][0]) - Math.PI / 2
      const a1 = Math.atan2(ptlist[l][1] - ptlist[l - 1][1], ptlist[l][0] - ptlist[l - 1][0]) - Math.PI / 2
      const w0 = wfun(0)
      const w1 = wfun(1)
      vtxlist0.unshift([ptlist[0][0] + w0 * Math.cos(a0), ptlist[0][1] + w0 * Math.sin(a0)])
      vtxlist1.unshift([ptlist[0][0] - w0 * Math.cos(a0), ptlist[0][1] - w0 * Math.sin(a0)])
      vtxlist0.push([ptlist[l][0] + w1 * Math.cos(a1), ptlist[l][1] + w1 * Math.sin(a1)])
      vtxlist1.push([ptlist[l][0] - w1 * Math.cos(a1), ptlist[l][1] - w1 * Math.sin(a1)])
      return [vtxlist0, vtxlist1]
    }

    const [hlist1, hlist2] = expand(hlist, fhead)
    hlist1.splice(0, Math.floor(hlist1.length * 0.1))
    hlist2.splice(0, Math.floor(hlist2.length * 0.95))
    canv += poly(hlist1.concat(hlist2.reverse()).map(toGlobal), {
      fil: 'rgba(100,100,100,0.6)',
    })

    canv += hat(toGlobal(pts[1]), toGlobal(pts[2]), { fli })

    return canv
  },
}
