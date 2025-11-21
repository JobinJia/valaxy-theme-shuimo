import type { Point } from '../render/types'
import { blob } from '../render/blob'
import { noise } from '../render/noise'
import { poly } from '../render/poly'
import { stroke } from '../render/stroke'
import { utilTools } from '../util'

/**
 * 山脚纹理（左右两侧的山脚轮廓）
 */
export function foot(ptlist: Point[][], args: any = {}): string {
  const xof = args.xof ?? 0
  const yof = args.yof ?? 0

  const ftlist: Point[][] = []
  const span = 10
  let ni = 0

  for (let i = 0; i < ptlist.length - 2; i += 1) {
    if (i === ni) {
      ni = Math.min(ni + utilTools.randChoice([1, 2]), ptlist.length - 1)

      ftlist.push([])
      ftlist.push([])

      for (let j = 0; j < Math.min(ptlist[i].length / 8, 10); j++) {
        ftlist[ftlist.length - 2].push([ptlist[i][j][0] + noise.noise(j * 0.1, i) * 10, ptlist[i][j][1]])
        ftlist[ftlist.length - 1].push([
          ptlist[i][ptlist[i].length - 1 - j][0] - noise.noise(j * 0.1, i) * 10,
          ptlist[i][ptlist[i].length - 1 - j][1],
        ])
      }

      ftlist[ftlist.length - 2] = ftlist[ftlist.length - 2].reverse()
      ftlist[ftlist.length - 1] = ftlist[ftlist.length - 1].reverse()

      for (let j = 0; j < span; j++) {
        const p = j / span
        const x1 = ptlist[i][0][0] * (1 - p) + ptlist[ni][0][0] * p
        const y1 = ptlist[i][0][1] * (1 - p) + ptlist[ni][0][1] * p

        const x2 = ptlist[i][ptlist[i].length - 1][0] * (1 - p) + ptlist[ni][ptlist[i].length - 1][0] * p
        const y2 = ptlist[i][ptlist[i].length - 1][1] * (1 - p) + ptlist[ni][ptlist[i].length - 1][1] * p

        const vib = -1.7 * (p - 1) * (p ** (1 / 5))
        const y1Offset = vib * 5 + noise.noise(xof * 0.05, i) * 5
        const y2Offset = vib * 5 + noise.noise(xof * 0.05, i) * 5

        ftlist[ftlist.length - 2].push([x1, y1 + y1Offset])
        ftlist[ftlist.length - 1].push([x2, y2 + y2Offset])
      }
    }
  }

  let canv = ''

  for (let i = 0; i < ftlist.length; i++) {
    canv += poly(ftlist[i], {
      xof,
      yof,
      fil: 'url(#paperTexture)',
      str: 'none',
    })
  }

  for (let j = 0; j < ftlist.length; j++) {
    canv += stroke(
      ftlist[j].map(x => [x[0] + xof, x[1] + yof]),
      {
        col: `rgba(100,100,100,${(0.1 + Math.random() * 0.1).toFixed(3)})`,
        wid: 1,
      },
    )
  }

  return canv
}

/**
 * 树枝生成函数
 * 生成树的主干和分支结构
 */
export function branch(args: any = {}): [Point[], Point[]] {
  const hei = args.hei ?? 300
  const wid = args.wid ?? 6
  const ang = args.ang ?? 0
  const det = args.det ?? 10
  const ben = args.ben ?? Math.PI * 0.2

  let nx = 0
  let ny = 0
  const tlist: Point[] = [[nx, ny]]
  let a0 = 0
  const g = 3

  for (let i = 0; i < g; i++) {
    a0 += (ben / 2 + (Math.random() * ben) / 2) * utilTools.randChoice([-1, 1])
    nx += (Math.cos(a0) * hei) / g
    ny -= (Math.sin(a0) * hei) / g
    tlist.push([nx, ny])
  }

  const ta = Math.atan2(tlist[tlist.length - 1][1], tlist[tlist.length - 1][0])

  for (let i = 0; i < tlist.length; i++) {
    const a = Math.atan2(tlist[i][1], tlist[i][0])
    const d = Math.sqrt(tlist[i][0] * tlist[i][0] + tlist[i][1] * tlist[i][1])
    tlist[i][0] = d * Math.cos(a - ta + ang)
    tlist[i][1] = d * Math.sin(a - ta + ang)
  }

  const trlist1: Point[] = []
  const trlist2: Point[] = []
  const span = det
  const tl = (tlist.length - 1) * span
  let lx = 0
  let ly = 0

  for (let i = 0; i < tl; i += 1) {
    const lastp = tlist[Math.floor(i / span)]
    const nextp = tlist[Math.ceil(i / span)]
    const p = (i % span) / span
    nx = lastp[0] * (1 - p) + nextp[0] * p
    ny = lastp[1] * (1 - p) + nextp[1] * p

    const ang = Math.atan2(ny - ly, nx - lx)
    const woff = ((noise.noise(i * 0.3) - 0.5) * wid * hei) / 80

    let b = 0
    if (p === 0) {
      b = Math.random() * wid
    }

    const nw = wid * (((tl - i) / tl) * 0.5 + 0.5)
    trlist1.push([
      nx + Math.cos(ang + Math.PI / 2) * (nw + woff + b),
      ny + Math.sin(ang + Math.PI / 2) * (nw + woff + b),
    ])
    trlist2.push([
      nx + Math.cos(ang - Math.PI / 2) * (nw - woff + b),
      ny + Math.sin(ang - Math.PI / 2) * (nw - woff + b),
    ])
    lx = nx
    ly = ny
  }

  return [trlist1, trlist2]
}

/**
 * 小树枝（细枝）生成函数
 * 递归生成细小的树枝和树叶
 */
export function twig(tx: number, ty: number, dep: number, args: any = {}): string {
  const dir = args.dir ?? 1
  const sca = args.sca ?? 1
  const wid = args.wid ?? 1
  const ang = args.ang ?? 0
  const lea = args.lea ?? [true, 12]

  let canv = ''
  const twlist: Point[] = []
  const tl = 10
  const hs = Math.random() * 0.5 + 0.5

  const fun2 = (i: number) => -1 / (i / tl + 1) ** 5 + 1
  const tfun = fun2

  const a0 = ((Math.random() * Math.PI) / 6) * dir + ang

  for (let i = 0; i < tl; i++) {
    const mx = dir * tfun(i) * 50 * sca * hs
    const my = -i * 5 * sca

    const a = Math.atan2(my, mx)
    const d = (mx * mx + my * my) ** 0.5

    const nx = Math.cos(a + a0) * d
    const ny = Math.sin(a + a0) * d

    twlist.push([nx + tx, ny + ty])

    if ((i === Math.floor(tl / 3) || i === Math.floor((tl * 2) / 3)) && dep > 0) {
      canv += twig(nx + tx, ny + ty, dep - 1, {
        ang,
        sca: sca * 0.8,
        wid,
        dir: dir * utilTools.randChoice([-1, 1]),
        lea,
      })
    }

    if (i === tl - 1 && lea[0] === true) {
      for (let j = 0; j < 5; j++) {
        const dj = (j - 2.5) * 5
        canv += blob(
          nx + tx + Math.cos(ang) * dj * wid,
          ny + ty + (Math.sin(ang) * dj - lea[1] / (dep + 1)) * wid,
          {
            wid: (6 + 3 * Math.random()) * wid,
            len: (15 + 12 * Math.random()) * wid,
            ang: ang / 2 + Math.PI / 2 + Math.PI * 0.2 * (Math.random() - 0.5),
            col: `rgba(100,100,100,${(0.5 + dep * 0.2).toFixed(3)})`,
            fun: (x: number) => {
              return x <= 1
                ? (Math.sin(x * Math.PI) * x) ** 0.5
                : -(Math.sin((x - 2) * Math.PI * (x - 2)) ** 0.5)
            },
          },
        )
      }
    }
  }

  canv += stroke(twlist, {
    wid: 1,
    fun: (x: number) => Math.cos((x * Math.PI) / 2),
    col: 'rgba(100,100,100,0.5)',
  })

  return canv
}

/**
 * 树皮纹理生成函数
 * 为树干添加树皮纹理
 */
export function barkify(x: number, y: number, trlist: [Point[], Point[]]): string {
  function bark(x: number, y: number, wid: number, ang: number): string {
    const len = 10 + 10 * Math.random()
    const noi = 0.5
    const fun = (x: number) => {
      return x <= 1
        ? Math.sin(x * Math.PI) ** 0.5
        : -(Math.sin((x + 1) * Math.PI) ** 0.5)
    }
    const reso = 20.0
    let canv = ''

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

    utilTools.loopNoise(nslist)

    const brklist: Point[] = []
    for (let i = 0; i < lalist.length; i++) {
      const ns = nslist[i] * noi + (1 - noi)
      const nx = x + Math.cos(lalist[i][1] + ang) * lalist[i][0] * ns
      const ny = y + Math.sin(lalist[i][1] + ang) * lalist[i][0] * ns
      brklist.push([nx, ny])
    }

    const fr = Math.random()
    canv += stroke(brklist, {
      wid: 0.8,
      noi: 0,
      col: 'rgba(100,100,100,0.4)',
      out: 0,
      fun: (x: number) => Math.sin((x + fr) * Math.PI * 3),
    })

    return canv
  }

  let canv = ''

  for (let i = 2; i < trlist[0].length - 1; i++) {
    const a0 = Math.atan2(
      trlist[0][i][1] - trlist[0][i - 1][1],
      trlist[0][i][0] - trlist[0][i - 1][0],
    )
    const a1 = Math.atan2(
      trlist[1][i][1] - trlist[1][i - 1][1],
      trlist[1][i][0] - trlist[1][i - 1][0],
    )
    const p = Math.random()
    const nx = trlist[0][i][0] * (1 - p) + trlist[1][i][0] * p
    const ny = trlist[0][i][1] * (1 - p) + trlist[1][i][1] * p

    if (Math.random() < 0.2) {
      canv += blob(nx + x, ny + y, {
        noi: 1,
        len: 15,
        wid: 6 - Math.abs(p - 0.5) * 10,
        ang: (a0 + a1) / 2,
        col: 'rgba(100,100,100,0.6)',
      })
    }
    else {
      canv += bark(nx + x, ny + y, 5 - Math.abs(p - 0.5) * 10, (a0 + a1) / 2)
    }

    if (Math.random() < 0.05) {
      const jl = Math.random() * 2 + 2
      const xya = utilTools.randChoice([
        [trlist[0][i][0], trlist[0][i][1], a0],
        [trlist[1][i][0], trlist[1][i][1], a1],
      ])
      for (let j = 0; j < jl; j++) {
        canv += blob(
          xya[0] + x + Math.cos(xya[2]) * (j - jl / 2) * 4,
          xya[1] + y + Math.sin(xya[2]) * (j - jl / 2) * 4,
          {
            wid: 4,
            len: 4 + 6 * Math.random(),
            ang: a0 + Math.PI / 2,
            col: 'rgba(100,100,100,0.6)',
          },
        )
      }
    }
  }

  return canv
}
