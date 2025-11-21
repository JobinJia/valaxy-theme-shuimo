import type { Point } from '../render/types'
import { poly } from '../render/poly'
import { stroke } from '../render/stroke'
import { texture } from '../render/texture'
import { noise } from '../render/noise'
import { utilTools } from '../util'
import { Tree } from './tree'
import { foot } from './helpers'

/**
 * 山峰生成模块
 */
export const Mount = {
  /**
   * 主峰：完整的山峰，带纹理和植被
   * 使用 vegetate 函数实现植被分布系统
   */
  mountain(xoff: number, yoff: number, seed: number, args: any = {}): string {
    const hei = args.hei ?? 100 + Math.random() * 400
    const wid = args.wid ?? 400 + Math.random() * 200
    const tex = args.tex ?? 200
    const veg = args.veg ?? true
    const col = args.col

    let canv = ''
    const ptlist: Point[][] = []
    const h = hei
    const w = wid
    const reso = [10, 50]

    let hoff = 0
    for (let j = 0; j < reso[0]; j++) {
      hoff += (Math.random() * yoff) / 100
      ptlist.push([])
      for (let i = 0; i < reso[1]; i++) {
        const x = (i / reso[1] - 0.5) * Math.PI
        let y = Math.cos(x)
        y *= noise.noise(x + 10, j * 0.15, seed)
        const p = 1 - j / reso[0]
        ptlist[ptlist.length - 1].push([(x / Math.PI) * w * p, -y * h * p + hoff])
      }
    }

    /**
     * 植被分布函数 - 控制树木在山上的生长
     */
    function vegetate(
      treeFunc: (x: number, y: number) => string,
      growthRule: (i: number, j: number) => boolean,
      proofRule: (veglist: Point[], i: number) => boolean,
    ) {
      const veglist: Point[] = []
      for (let i = 0; i < ptlist.length; i += 1) {
        for (let j = 0; j < ptlist[i].length; j += 1) {
          if (growthRule(i, j)) {
            veglist.push([ptlist[i][j][0], ptlist[i][j][1]])
          }
        }
      }
      for (let i = 0; i < veglist.length; i++) {
        if (proofRule(veglist, i)) {
          canv += treeFunc(veglist[i][0], veglist[i][1])
        }
      }
    }

    // RIM Trees (山脊边缘的树)
    vegetate(
      (x: number, y: number) => {
        return Tree.tree02(x + xoff, y + yoff - 5, {
          col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.5).toFixed(3)})`,
          clu: 2,
        })
      },
      (i: number, j: number) => {
        const ns = noise.noise(j * 0.1, seed)
        return i === 0 && ns * ns * ns < 0.1 && Math.abs(ptlist[i][j][1]) / h > 0.2
      },
      () => true,
    )

    // Mountain base (transparent)
    canv += poly(
      ptlist[0].concat([[0, reso[0] * 4]]).map(pt => [pt[0] + xoff, pt[1] + yoff]),
      {
        fil: 'none',
        str: 'none',
      },
    )

    // OUTLINE
    canv += stroke(
      ptlist[0].map(x => [x[0] + xoff, x[1] + yoff]),
      { col: 'rgba(100,100,100,0.3)', noi: 1, wid: 3 },
    )

    canv += foot(ptlist, { xof: xoff, yof: yoff })
    canv += texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex,
      sha: utilTools.randChoice([0, 0, 0, 0, 5]),
      col,
    })

    // TOP Trees (山顶的树)
    vegetate(
      (x: number, y: number) => {
        return Tree.tree02(x + xoff, y + yoff, {
          col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.5).toFixed(3)})`,
        })
      },
      (i: number, j: number) => {
        const ns = noise.noise(i * 0.1, j * 0.1, seed + 2)
        return ns * ns * ns < 0.1 && Math.abs(ptlist[i][j][1]) / h > 0.5
      },
      () => true,
    )

    if (veg) {
      // MIDDLE Trees - Type 1 (中层树 - 细树)
      vegetate(
        (x: number, y: number) => {
          const ht = ((h + y) / h) * 70
          const finalHt = ht * 0.3 + Math.random() * ht * 0.7
          return Tree.tree01(x + xoff, y + yoff, {
            hei: finalHt,
            wid: Math.random() * 3 + 1,
            col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.3).toFixed(3)})`,
          })
        },
        (i: number, j: number) => {
          const ns = noise.noise(i * 0.2, j * 0.05, seed)
          return j % 2 === 1 && ns * ns * ns * ns < 0.012 && Math.abs(ptlist[i][j][1]) / h < 0.3
        },
        (veglist: Point[], i: number) => {
          let counter = 0
          for (let j = 0; j < veglist.length; j++) {
            if (
              i !== j
              && Math.pow(veglist[i][0] - veglist[j][0], 2) + Math.pow(veglist[i][1] - veglist[j][1], 2) < 30 * 30
            ) {
              counter++
            }
            if (counter > 2) {
              return true
            }
          }
          return false
        },
      )

      // MIDDLE Trees - Type 4 (中层树 - 树枝树)
      vegetate(
        (x: number, y: number) => {
          return Tree.tree04(x + xoff, y + yoff, {
            hei: 50 + Math.random() * 80,
            wid: 3 + Math.random() * 3,
            col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.3).toFixed(3)})`,
          })
        },
        (i: number, j: number) => {
          const ns = noise.noise(i * 0.15, j * 0.08, seed + 5)
          return ns * ns * ns * ns < 0.005 && Math.abs(ptlist[i][j][1]) / h < 0.4 && Math.abs(ptlist[i][j][1]) / h > 0.1
        },
        () => true,
      )

      // MIDDLE Trees - Type 5 (中层松树)
      vegetate(
        (x: number, y: number) => {
          return Tree.tree05(x + xoff, y + yoff, {
            hei: 60 + Math.random() * 100,
            wid: 4 + Math.random() * 2,
            col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.35).toFixed(3)})`,
          })
        },
        (i: number, j: number) => {
          const ns = noise.noise(i * 0.18, j * 0.07, seed + 6)
          return ns * ns * ns * ns < 0.004 && Math.abs(ptlist[i][j][1]) / h < 0.45 && Math.abs(ptlist[i][j][1]) / h > 0.15
        },
        () => true,
      )

      // BOTTOM Trees - Type 3 (底部大树)
      vegetate(
        (x: number, y: number) => {
          const ht = ((h + y) / h) * 120
          const finalHt = ht * 0.5 + Math.random() * ht * 0.5
          const bc = Math.random() * 0.1
          const bp = 1
          return Tree.tree03(x + xoff, y + yoff, {
            hei: finalHt,
            ben: (x: number) => Math.pow(x * bc, bp),
            col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.3).toFixed(3)})`,
          })
        },
        (i: number, j: number) => {
          const ns = noise.noise(i * 0.2, j * 0.05, seed)
          return (j === 0 || j === ptlist[i].length - 1) && ns * ns * ns * ns < 0.012
        },
        () => true,
      )

      // BOTTOM Trees - Type 6 (底部分形树)
      vegetate(
        (x: number, y: number) => {
          return Tree.tree06(x + xoff, y + yoff, {
            hei: 40 + Math.random() * 60,
            wid: 4 + Math.random() * 2,
            col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.3 + 0.35).toFixed(3)})`,
          })
        },
        (i: number, j: number) => {
          const ns = noise.noise(i * 0.25, j * 0.06, seed + 7)
          return (j === 0 || j === ptlist[i].length - 1) && ns * ns * ns < 0.02
        },
        () => true,
      )

      // SCATTERED Trees - Type 8 (零散细枝树)
      vegetate(
        (x: number, y: number) => {
          return Tree.tree08(x + xoff, y + yoff, {
            hei: 30 + Math.random() * 50,
            wid: 1 + Math.random(),
            col: `rgba(100,100,100,${(noise.noise(0.01 * x, 0.01 * y) * 0.5 * 0.2 + 0.3).toFixed(3)})`,
          })
        },
        (i: number, j: number) => {
          const ns = noise.noise(i * 0.3, j * 0.1, seed + 8)
          return ns * ns * ns < 0.015 && Math.abs(ptlist[i][j][1]) / h < 0.6
        },
        () => true,
      )

      // BOTTOM Rocks (底部岩石)
      vegetate(
        (x: number, y: number) => {
          return Mount.rock(x + xoff, y + yoff, seed, {
            wid: 20 + Math.random() * 20,
            hei: 20 + Math.random() * 20,
            sha: 2,
          })
        },
        (i: number, j: number) => {
          return (j === 0 || j === ptlist[i].length - 1) && Math.random() < 0.1
        },
        () => true,
      )
    }

    return canv
  },

  /**
   * 平顶山：台地样的山峰
   */
  flatMount(xoff: number, yoff: number, seed: number, args: any = {}): string {
    const hei = args.hei ?? 40 + Math.random() * 400
    const wid = args.wid ?? 400 + Math.random() * 200
    const tex = args.tex ?? 80
    const cho = args.cho ?? 0.5

    let canv = ''
    const ptlist: Point[][] = []
    const reso = [5, 50]
    let hoff = 0
    const flat: Point[][] = []

    for (let j = 0; j < reso[0]; j++) {
      hoff += (Math.random() * yoff) / 100
      ptlist.push([])
      flat.push([])
      for (let i = 0; i < reso[1]; i++) {
        const x = (i / reso[1] - 0.5) * Math.PI
        let y = Math.cos(x * 2) + 1
        y *= noise.noise(x + 10, j * 0.1, seed)
        const p = 1 - (j / reso[0]) * 0.6
        const nx = (x / Math.PI) * wid * p
        let ny = -y * hei * p + hoff
        const h = 100
        if (ny < -h * cho + hoff) {
          ny = -h * cho + hoff
          if (flat[flat.length - 1].length % 2 === 0) {
            flat[flat.length - 1].push([nx, ny])
          }
        }
        else {
          if (flat[flat.length - 1].length % 2 === 1) {
            flat[flat.length - 1].push(ptlist[ptlist.length - 1][ptlist[ptlist.length - 1].length - 1])
          }
        }

        ptlist[ptlist.length - 1].push([nx, ny])
      }
    }

    // Mountain base (transparent)
    canv += poly(ptlist[0].concat([[0, reso[0] * 4]]), {
      xof: xoff,
      yof: yoff,
      fil: 'none',
      str: 'none',
    })

    // OUTLINE
    canv += stroke(
      ptlist[0].map(x => [x[0] + xoff, x[1] + yoff]),
      { col: 'rgba(100,100,100,0.4)', noi: 1, wid: 2.5 },
    )

    canv += texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex,
      wid: 2,
      dis: () => {
        if (Math.random() > 0.5) {
          return 0.1 + 0.4 * Math.random()
        }
        else {
          return 0.9 - 0.4 * Math.random()
        }
      },
    })

    return canv
  },

  /**
   * 远山：低对比度的远处山峰
   */
  distMount(xoff: number, yoff: number, seed: number, args: any = {}): string {
    const hei = args.hei ?? 50 + Math.random() * 100
    const wid = args.wid ?? 300 + Math.random() * 200
    const tex = args.tex ?? 50

    let canv = ''
    const ptlist: Point[][] = []
    const reso = [5, 50]

    let hoff = 0
    for (let j = 0; j < reso[0]; j++) {
      hoff += (Math.random() * yoff) / 100
      ptlist.push([])
      for (let i = 0; i < reso[1]; i++) {
        const x = (i / reso[1] - 0.5) * Math.PI
        let y = Math.cos(x)
        y *= noise.noise(x + 10, j * 0.15, seed)
        const p = 1 - j / reso[0]
        ptlist[ptlist.length - 1].push([(x / Math.PI) * wid * p, -y * hei * p + hoff])
      }
    }

    // Mountain base (transparent)
    canv += poly(ptlist[0].concat([[0, reso[0] * 4]]), {
      xof: xoff,
      yof: yoff,
      fil: 'none',
      str: 'none',
    })

    // OUTLINE (more visible for distant mountains)
    canv += stroke(
      ptlist[0].map(x => [x[0] + xoff, x[1] + yoff]),
      { col: 'rgba(100,100,100,0.25)', noi: 1, wid: 2 },
    )

    canv += texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex,
      sha: 0,
      wid: 1.5,
      col: () => `rgba(100,100,100,${(Math.random() * 0.1).toFixed(3)})`,
    })

    return canv
  },

  /**
   * 岩石：小石块
   */
  rock(xoff: number, yoff: number, seed: number, args: any = {}): string {
    const wid = args.wid ?? 20
    const hei = args.hei ?? 20
    const sha = args.sha ?? 0

    const ptlist: Point[][] = []
    const reso = [5, 25]

    for (let j = 0; j < reso[0]; j++) {
      ptlist.push([])
      for (let i = 0; i < reso[1]; i++) {
        const x = (i / reso[1] - 0.5) * Math.PI
        let y = Math.cos(x)
        y *= noise.noise(x + 10, j * 0.15, seed)
        const p = 1 - j / reso[0]
        ptlist[ptlist.length - 1].push([(x / Math.PI) * wid * p, -y * hei * p])
      }
    }

    let canv = ''

    // Rock base (transparent)
    canv += poly(ptlist[0], {
      xof: xoff,
      yof: yoff,
      fil: 'none',
      str: 'none',
    })

    // OUTLINE
    canv += stroke(
      ptlist[0].map(x => [x[0] + xoff, x[1] + yoff]),
      { col: 'rgba(100,100,100,0.5)', noi: 1, wid: 2 },
    )

    canv += texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex: 20,
      sha,
    })

    return canv
  },
}
