import { noise } from '../render/noise'

export interface MountPlanItem {
  tag: string
  x: number
  y: number
  h?: number
  [key: string]: any
}

export const Planner = {
  mountplanner(xmin: number, xmax: number, seed: number = 0): MountPlanItem[] {
    const reg: MountPlanItem[] = []
    const samp = 0.03

    // Noise functions
    const ns = (x: number, y: number) => {
      return Math.max(noise.noise(x * samp, y * samp, seed) - 0.55, 0) * 2
    }

    // Unused in original but present
    // const nns = (x: number) => 1 - noise.noise(x * samp, seed)
    // const nnns = (x: number, y: number) => Math.max(noise.noise(x * samp * 2, 2, seed) - 0.55, 0) * 2

    const yr = (x: number) => noise.noise(x * 0.01, Math.PI, seed)

    function locmax(x: number, y: number, f: (x: number, y: number) => number, r: number) {
      const z0 = f(x, y)
      if (z0 <= 0.2) {
        return false
      }
      for (let i = x - r; i < x + r; i++) {
        for (let j = y - r; j < y + r; j++) {
          if (f(i, j) > z0) {
            return false
          }
        }
      }
      return true
    }

    function chadd(r: MountPlanItem, mind: number = 10) {
      for (let k = 0; k < reg.length; k++) {
        if (Math.abs(reg[k].x - r.x) < mind) {
          return false
        }
      }
      reg.push(r)
      return true
    }

    const xstep = 5
    const mwid = 200

    // We don't need MEM.planmtx global state here as we are generating for a specific range
    // But to replicate the density logic, we might need to simulate it or simplify.
    // In original: MEM.planmtx tracks density of mountains to avoid overcrowding or empty spaces?
    // Actually MEM.planmtx seems to count mountains in x-buckets.

    const planmtx: Record<number, number> = {}

    for (let i = xmin; i < xmax; i += xstep) {
      const i1 = Math.floor(i / xstep)
      planmtx[i1] = planmtx[i1] || 0
    }

    for (let i = xmin; i < xmax; i += xstep) {
      for (let j = 0; j < yr(i) * 480; j += 30) {
        if (locmax(i, j, ns, 2)) {
          const xof = i + 2 * (Math.random() - 0.5) * 500
          const yof = j + 300
          const r: MountPlanItem = { tag: 'mount', x: xof, y: yof, h: ns(i, j) }
          const res = chadd(r)
          if (res) {
            for (let k = Math.floor((xof - mwid) / xstep); k < (xof + mwid) / xstep; k++) {
              planmtx[k] = (planmtx[k] || 0) + 1
            }
          }
        }
      }

      if (Math.abs(i) % 800 < Math.max(1, xstep - 1)) {
        const r: MountPlanItem = {
          tag: 'distmount',
          x: i,
          y: 280 - Math.random() * 50,
          h: ns(i, 0), // j is undefined here in original loop scope, assuming 0 or similar
        }
        chadd(r)
      }
    }

    for (let i = xmin; i < xmax; i += xstep) {
      if ((planmtx[Math.floor(i / xstep)] || 0) === 0) {
        if (Math.random() < 0.05) {
          for (let j = 0; j < 4 * Math.random(); j++) {
            const r: MountPlanItem = {
              tag: 'flatmount',
              x: i + 2 * (Math.random() - 0.5) * 700,
              y: 700 - j * 50,
              h: ns(i, j),
            }
            chadd(r)
          }
        }
      }
    }

    for (let i = xmin; i < xmax; i += xstep) {
      if (Math.random() < 0.3) {
        const r: MountPlanItem = { tag: 'boat', x: i, y: 300 + Math.random() * 390 }
        chadd(r, 400)
      }
    }

    return reg
  },
}
