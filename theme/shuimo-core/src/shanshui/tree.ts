import type { Point } from '../render/types'
import { blob } from '../render/blob'
import { poly } from '../render/poly'
import { stroke } from '../render/stroke'
import { noise } from '../render/noise'
import { utilTools } from '../util'
import { branch, twig, barkify } from './helpers'

/**
 * 树木生成模块
 */
export const Tree = {
  /**
   * 树型1: 带叶片的细树
   */
  tree01(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 50
    const wid = args.wid ?? 3
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    const reso = 10
    const nslist: [number, number][] = []
    for (let i = 0; i < reso; i++) {
      nslist.push([noise.noise(i * 0.5), noise.noise(i * 0.5, 0.5)])
    }

    let leafcol: string[]
    if (col.includes('rgba(')) {
      leafcol = col.replace('rgba(', '').replace(')', '').split(',')
    }
    else {
      leafcol = ['100', '100', '100', '0.5']
    }

    let canv = ''
    const line1: Point[] = []
    const line2: Point[] = []

    for (let i = 0; i < reso; i++) {
      const nx = x
      const ny = y - (i * hei) / reso
      if (i >= reso / 4) {
        for (let j = 0; j < (reso - i) / 5; j++) {
          canv += blob(nx + (Math.random() - 0.5) * wid * 1.2 * (reso - i), ny + (Math.random() - 0.5) * wid, {
            len: Math.random() * 20 * (reso - i) * 0.2 + 10,
            wid: Math.random() * 6 + 3,
            ang: ((Math.random() - 0.5) * Math.PI) / 6,
            col: `rgba(${leafcol[0]},${leafcol[1]},${leafcol[2]},${(Math.random() * 0.2 + Number.parseFloat(leafcol[3])).toFixed(1)})`,
          })
        }
      }
      line1.push([nx + (nslist[i][0] - 0.5) * wid - wid / 2, ny])
      line2.push([nx + (nslist[i][1] - 0.5) * wid + wid / 2, ny])
    }
    canv += poly(line1, { fil: 'none', str: col, wid: 1.5 }) + poly(line2, { fil: 'none', str: col, wid: 1.5 })
    return canv
  },

  /**
   * 树型2: 簇状灌木
   */
  tree02(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 16
    const wid = args.wid ?? 8
    const clu = args.clu ?? 5
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    let canv = ''
    for (let i = 0; i < clu; i++) {
      canv += blob(x + utilTools.randGaussian() * clu * 4, y + utilTools.randGaussian() * clu * 4, {
        ang: Math.PI / 2,
        fun: (x: number) => {
          return x <= 1
            ? (Math.sin(x * Math.PI) * x) ** 0.5
            : -((Math.sin((x - 2) * Math.PI) * (x - 2)) ** 0.5)
        },
        wid: Math.random() * wid * 0.75 + wid * 0.5,
        len: Math.random() * hei * 0.75 + hei * 0.5,
        col,
      })
    }
    return canv
  },

  /**
   * 树型3: 大树（扇形树冠）
   */
  tree03(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 50
    const wid = args.wid ?? 5
    const ben = args.ben ?? ((x: number) => 0)
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    const reso = 10
    const nslist: [number, number][] = []
    for (let i = 0; i < reso; i++) {
      nslist.push([noise.noise(i * 0.5), noise.noise(i * 0.5, 0.5)])
    }

    let leafcol: string[]
    if (col.includes('rgba(')) {
      leafcol = col.replace('rgba(', '').replace(')', '').split(',')
    }
    else {
      leafcol = ['100', '100', '100', '0.5']
    }

    let canv = ''
    let blobs = ''
    const line1: Point[] = []
    const line2: Point[] = []

    for (let i = 0; i < reso; i++) {
      const nx = x + ben(i / reso) * 100
      const ny = y - (i * hei) / reso
      if (i >= reso / 5) {
        for (let j = 0; j < (reso - i) * 2; j++) {
          const shape = (x: number) => Math.log(50 * x + 1) / 3.95
          const ox = Math.random() * wid * 2 * shape((reso - i) / reso)
          blobs += blob(nx + ox * utilTools.randChoice([-1, 1]), ny + (Math.random() - 0.5) * wid * 2, {
            len: ox * 2,
            wid: Math.random() * 6 + 3,
            ang: ((Math.random() - 0.5) * Math.PI) / 6,
            col: `rgba(${leafcol[0]},${leafcol[1]},${leafcol[2]},${(Math.random() * 0.2 + Number.parseFloat(leafcol[3])).toFixed(3)})`,
          })
        }
      }
      line1.push([nx + (((nslist[i][0] - 0.5) * wid - wid / 2) * (reso - i)) / reso, ny])
      line2.push([nx + (((nslist[i][1] - 0.5) * wid + wid / 2) * (reso - i)) / reso, ny])
    }
    const lc = line1.concat(line2.reverse())
    canv += poly(lc, { fil: 'none', str: col, wid: 1.5 })
    canv += blobs
    return canv
  },

  /**
   * 树型4: 树枝树（带树皮纹理和小枝）
   */
  tree04(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 300
    const wid = args.wid ?? 6
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    let canv = ''
    let txcanv = ''
    let twcanv = ''

    let trlist = branch({ hei, wid, ang: -Math.PI / 2 })
    txcanv += barkify(x, y, trlist)
    const trmlist: Point[] = trlist[0].concat(trlist[1].reverse())

    canv += poly(trmlist, { xof: x, yof: y, fil: 'none', str: col, wid: 0 })

    // Add branches
    for (let i = 0; i < trmlist.length; i++) {
      if (
        (i >= trmlist.length * 0.3 && i <= trmlist.length * 0.7 && Math.random() < 0.1)
        || i === Math.floor(trmlist.length / 2) - 1
      ) {
        const ba = Math.PI * 0.2 - Math.PI * 1.4 * Number(i > trmlist.length / 2)
        const brlist = branch({
          hei: hei * (Math.random() + 1) * 0.3,
          wid: wid * 0.5,
          ang: ba,
        })

        brlist[0].splice(0, 1)
        brlist[1].splice(0, 1)
        const foff = (v: Point): Point => [v[0] + trmlist[i][0], v[1] + trmlist[i][1]]
        txcanv += barkify(x, y, [brlist[0].map(foff), brlist[1].map(foff)])

        for (let j = 0; j < brlist[0].length; j++) {
          if (Math.random() < 0.2 || j === brlist[0].length - 1) {
            twcanv += twig(
              brlist[0][j][0] + trmlist[i][0] + x,
              brlist[0][j][1] + trmlist[i][1] + y,
              1,
              {
                wid: hei / 300,
                ang: ba > -Math.PI / 2 ? ba : ba + Math.PI,
                sca: (0.5 * hei) / 300,
                dir: ba > -Math.PI / 2 ? 1 : -1,
              },
            )
          }
        }
      }
    }

    canv += stroke(
      trmlist.map(v => [v[0] + x, v[1] + y]),
      {
        col: `rgba(100,100,100,${(0.4 + Math.random() * 0.1).toFixed(3)})`,
        wid: 2.5,
        fun: () => Math.sin(1),
        noi: 0.9,
        out: 0,
      },
    )

    canv += txcanv
    canv += twcanv
    return canv
  },

  /**
   * 树型5: 松树（细长笔直）
   */
  tree05(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 300
    const wid = args.wid ?? 5
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    let canv = ''
    let txcanv = ''
    let twcanv = ''

    let trlist = branch({ hei, wid, ang: -Math.PI / 2, ben: 0 })
    txcanv += barkify(x, y, trlist)
    const trmlist: Point[] = trlist[0].concat(trlist[1].reverse())

    canv += poly(trmlist, { xof: x, yof: y, fil: 'none', str: col, wid: 0 })

    for (let i = 0; i < trmlist.length; i++) {
      const p = Math.abs(i - trmlist.length * 0.5) / (trmlist.length * 0.5)
      if (
        (i >= trmlist.length * 0.2 && i <= trmlist.length * 0.8 && i % 3 === 0 && Math.random() > p)
        || i === Math.floor(trmlist.length / 2) - 1
      ) {
        const bar = Math.random() * 0.2
        const ba = -bar * Math.PI - (1 - bar * 2) * Math.PI * Number(i > trmlist.length / 2)
        const brlist = branch({
          hei: hei * (0.3 * p - Math.random() * 0.05),
          wid: wid * 0.5,
          ang: ba,
          ben: 0.5,
        })

        brlist[0].splice(0, 1)
        brlist[1].splice(0, 1)

        for (let j = 0; j < brlist[0].length; j++) {
          if (j % 20 === 0 || j === brlist[0].length - 1) {
            twcanv += twig(
              brlist[0][j][0] + trmlist[i][0] + x,
              brlist[0][j][1] + trmlist[i][1] + y,
              0,
              {
                wid: hei / 300,
                ang: ba > -Math.PI / 2 ? ba : ba + Math.PI,
                sca: (0.2 * hei) / 300,
                dir: ba > -Math.PI / 2 ? 1 : -1,
                lea: [true, 5],
              },
            )
          }
        }
      }
    }

    canv += stroke(
      trmlist.map(v => [v[0] + x, v[1] + y]),
      {
        col: `rgba(100,100,100,${(0.4 + Math.random() * 0.1).toFixed(3)})`,
        wid: 2.5,
        fun: () => Math.sin(1),
        noi: 0.9,
        out: 0,
      },
    )

    canv += txcanv
    canv += twcanv
    return canv
  },

  /**
   * 树型6: 分形树（递归生成）
   */
  tree06(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 100
    const wid = args.wid ?? 6
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    let canv = ''
    let txcanv = ''
    let twcanv = ''

    function fracTree(xoff: number, yoff: number, dep: number, fracArgs: any = {}): Point[] {
      const hei = fracArgs.hei ?? 300
      const wid = fracArgs.wid ?? 5
      const ang = fracArgs.ang ?? 0
      const ben = fracArgs.ben ?? Math.PI * 0.2

      const trlist = branch({
        hei,
        wid,
        ang,
        ben,
        det: hei / 20,
      })
      txcanv += barkify(xoff, yoff, trlist)
      const trmlist: Point[] = trlist[0].concat(trlist[1].reverse())

      const resultList: Point[] = []

      for (let i = 0; i < trmlist.length; i++) {
        if (
          ((Math.random() < 0.025 && i >= trmlist.length * 0.2 && i <= trmlist.length * 0.8)
            || i === Math.floor(trmlist.length / 2) - 1
            || i === Math.floor(trmlist.length / 2) + 1)
          && dep > 0
        ) {
          const bar = 0.02 + Math.random() * 0.08
          const ba = bar * Math.PI - bar * 2 * Math.PI * Number(i > trmlist.length / 2)

          const brlist = fracTree(trmlist[i][0] + xoff, trmlist[i][1] + yoff, dep - 1, {
            hei: hei * (0.7 + Math.random() * 0.2),
            wid: wid * 0.6,
            ang: ang + ba,
            ben: 0.55,
          })

          for (let j = 0; j < brlist.length; j++) {
            if (Math.random() < 0.03) {
              twcanv += twig(
                brlist[j][0] + trmlist[i][0] + xoff,
                brlist[j][1] + trmlist[i][1] + yoff,
                2,
                {
                  ang: ba * (Math.random() * 0.5 + 0.75),
                  sca: 0.3,
                  dir: ba > 0 ? 1 : -1,
                  lea: [false, 0],
                },
              )
            }
          }

          resultList.push(...brlist.map(v => [v[0] + trmlist[i][0], v[1] + trmlist[i][1]] as Point))
        }
        else {
          resultList.push(trmlist[i])
        }
      }
      return resultList
    }

    const trmlist = fracTree(x, y, 3, {
      hei,
      wid,
      ang: -Math.PI / 2,
      ben: 0,
    })

    canv += poly(trmlist, { xof: x, yof: y, fil: 'none', str: col, wid: 0 })

    canv += stroke(
      trmlist.map(v => [v[0] + x, v[1] + y]),
      {
        col: `rgba(100,100,100,${(0.4 + Math.random() * 0.1).toFixed(3)})`,
        wid: 2.5,
        fun: () => Math.sin(1),
        noi: 0.9,
        out: 0,
      },
    )

    canv += txcanv
    canv += twcanv
    return canv
  },

  /**
   * 树型7: 竹子（简单直立）
   */
  tree07(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 60
    const wid = args.wid ?? 4
    const ben = args.ben ?? ((x: number) => Math.sqrt(x) * 0.2)
    const col = args.col ?? 'rgba(100,100,100,1)'

    const reso = 10
    const nslist: [number, number][] = []
    for (let i = 0; i < reso; i++) {
      nslist.push([noise.noise(i * 0.5), noise.noise(i * 0.5, 0.5)])
    }

    let leafcol: string[]
    if (col.includes('rgba(')) {
      leafcol = col.replace('rgba(', '').replace(')', '').split(',')
    }
    else {
      leafcol = ['100', '100', '100', '1']
    }

    let canv = ''
    const line1: Point[] = []
    const line2: Point[] = []

    for (let i = 0; i < reso; i++) {
      const nx = x + ben(i / reso) * 100
      const ny = y - (i * hei) / reso
      if (i >= reso / 4) {
        for (let j = 0; j < 1; j++) {
          const bpl = blob(
            nx + (Math.random() - 0.5) * wid * 1.2 * (reso - i) * 0.5,
            ny + (Math.random() - 0.5) * wid * 0.5,
            {
              len: Math.random() * 50 + 20,
              wid: Math.random() * 12 + 12,
              ang: (-Math.random() * Math.PI) / 6,
              col: `rgba(${leafcol[0]},${leafcol[1]},${leafcol[2]},${Number.parseFloat(leafcol[3]).toFixed(3)})`,
              fun: (x: number) => {
                return x <= 1
                  ? 2.75 * x * Math.pow(1 - x, 1 / 1.8)
                  : 2.75 * (x - 2) * Math.pow(x - 1, 1 / 1.8)
              },
              ret: 1,
            },
          )

          // Could triangulate here if needed (PolyTools.triangulate)
          canv += poly([...bpl] as Point[], { fil: col, wid: 0 })
        }
      }
      line1.push([nx + (nslist[i][0] - 0.5) * wid - wid / 2, ny])
      line2.push([nx + (nslist[i][1] - 0.5) * wid + wid / 2, ny])
    }

    canv += poly(line1.concat(line2.reverse()), { fil: col, wid: 0 })
    return canv
  },

  /**
   * 树型8: 细枝树（递归分形小枝）
   */
  tree08(x: number, y: number, args: any = {}): string {
    const hei = args.hei ?? 80
    const wid = args.wid ?? 1
    const col = args.col ?? 'rgba(100,100,100,0.5)'

    let canv = ''
    let twcanv = ''

    const ang = utilTools.normRand(-1, 1) * Math.PI * 0.2

    let trlist = branch({
      hei,
      wid,
      ang: -Math.PI / 2 + ang,
      ben: Math.PI * 0.2,
      det: hei / 20,
    })

    const trmlist: Point[] = trlist[0].concat(trlist[1].reverse())

    function fracTree(xoff: number, yoff: number, dep: number, fracArgs: any = {}): string {
      const ang = fracArgs.ang ?? -Math.PI / 2
      const len = fracArgs.len ?? 15
      const ben = fracArgs.ben ?? 0

      const fun = dep === 0
        ? (x: number) => Math.cos(0.5 * Math.PI * x)
        : () => 1

      const spt: Point = [xoff, yoff]
      const ept: Point = [xoff + Math.cos(ang) * len, yoff + Math.sin(ang) * len]

      let fracTrmlist: Point[] = [[xoff, yoff], [xoff + len, yoff]]

      const bfun = utilTools.randChoice([
        (x: number) => Math.sin(x * Math.PI),
        (x: number) => -Math.sin(x * Math.PI),
      ])

      fracTrmlist = utilTools.div(fracTrmlist, 10)

      for (let i = 0; i < fracTrmlist.length; i++) {
        fracTrmlist[i][1] += bfun(i / fracTrmlist.length) * 2
      }

      for (let i = 0; i < fracTrmlist.length; i++) {
        const d = utilTools.distance(fracTrmlist[i], spt)
        const a = Math.atan2(fracTrmlist[i][1] - spt[1], fracTrmlist[i][0] - spt[0])
        fracTrmlist[i][0] = spt[0] + d * Math.cos(a + ang)
        fracTrmlist[i][1] = spt[1] + d * Math.sin(a + ang)
      }

      let tcanv = ''
      tcanv += stroke(fracTrmlist, {
        fun,
        wid: 0.8,
        col: 'rgba(100,100,100,0.5)',
      })

      if (dep !== 0) {
        const nben = ben + utilTools.randChoice([-1, 1]) * Math.PI * 0.001 * dep * dep
        if (Math.random() < 0.5) {
          tcanv += fracTree(ept[0], ept[1], dep - 1, {
            ang: ang + ben + Math.PI * utilTools.randChoice([utilTools.normRand(-1, 0.5), utilTools.normRand(0.5, 1)]) * 0.2,
            len: len * utilTools.normRand(0.8, 0.9),
            ben: nben,
          })
          tcanv += fracTree(ept[0], ept[1], dep - 1, {
            ang: ang + ben + Math.PI * utilTools.randChoice([utilTools.normRand(-1, -0.5), utilTools.normRand(0.5, 1)]) * 0.2,
            len: len * utilTools.normRand(0.8, 0.9),
            ben: nben,
          })
        }
        else {
          tcanv += fracTree(ept[0], ept[1], dep - 1, {
            ang: ang + ben,
            len: len * utilTools.normRand(0.8, 0.9),
            ben: nben,
          })
        }
      }
      return tcanv
    }

    for (let i = 0; i < trmlist.length; i++) {
      if (Math.random() < 0.2) {
        twcanv += fracTree(x + trmlist[i][0], y + trmlist[i][1], Math.floor(4 * Math.random()), {
          hei: 20,
          ang: -Math.PI / 2 - ang * Math.random(),
        })
      }
      else if (i === Math.floor(trmlist.length / 2)) {
        twcanv += fracTree(x + trmlist[i][0], y + trmlist[i][1], 3, {
          hei: 25,
          ang: -Math.PI / 2 + ang,
        })
      }
    }

    canv += poly(trmlist, { xof: x, yof: y, fil: 'none', str: col, wid: 1 })
    canv += twcanv
    return canv
  },
}
