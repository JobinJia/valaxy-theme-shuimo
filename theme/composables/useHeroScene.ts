// Pure hero-scene builder — worker-safe (no Vue / DOM deps).
// Main-thread fallback 和 Web Worker 共用同一实现。

export interface HeroScene {
  svg: string
  blankSide: 'left' | 'right'
  seed: number
}

interface PlanItem {
  tag: string
  x: number
  y: number
  [key: string]: any
}

function blankWeight(x: number, y: number, W: number, H: number, side: 'left' | 'right', halfW = 0): number {
  const edgeX = side === 'left' ? x - halfW : x + halfW
  const nx = side === 'left' ? edgeX / W : 1 - edgeX / W
  const ny = y / H

  const blankEdge = 0.38

  if (nx >= blankEdge)
    return 1

  if (nx < 0.25 && ny < 0.5)
    return 0

  const xFade = nx / blankEdge
  const yFade = Math.max(0, (ny - 0.3) / 0.7)

  return xFade * xFade * yFade
}

function planScene(
  W: number,
  H: number,
  seed: number,
  noiseFn: (x: number, y: number, z?: number) => number,
  blankSide: 'left' | 'right',
): PlanItem[] {
  const plan: PlanItem[] = []
  const samp = 0.03

  const ns = (x: number, y: number) =>
    Math.max(noiseFn(x * samp, y * samp, seed) - 0.55, 0) * 2

  const yr = (x: number) => noiseFn(x * 0.01, Math.PI, seed)

  function locmax(x: number, y: number, r: number) {
    const z0 = ns(x, y)
    if (z0 <= 0.2)
      return false
    for (let i = x - r; i < x + r; i++) {
      for (let j = y - r; j < y + r; j++) {
        if (ns(i, j) > z0)
          return false
      }
    }
    return true
  }

  function chadd(item: PlanItem, mind = 10) {
    for (const existing of plan) {
      if (Math.abs(existing.x - item.x) < mind)
        return false
    }
    plan.push(item)
    return true
  }

  const xstep = 5
  const mwid = 200

  const planmtx: Record<number, number> = {}
  for (let i = 0; i < W; i += xstep) {
    planmtx[Math.floor(i / xstep)] = 0
  }

  for (let i = 0; i < W; i += xstep) {
    for (let j = 0; j < yr(i) * H * 0.3; j += 30) {
      if (locmax(i, j, 2)) {
        const xof = i + 2 * (Math.random() - 0.5) * W * 0.2
        const yof = H * 0.55 + j * 0.5
        if (Math.random() > blankWeight(xof, yof, W, H, blankSide, 300))
          continue
        const res = chadd({ tag: 'mount', x: xof, y: yof, h: ns(i, j) })
        if (res) {
          for (let k = Math.floor((xof - mwid) / xstep); k < (xof + mwid) / xstep; k++) {
            planmtx[k] = (planmtx[k] || 0) + 1
          }
        }
      }
    }
  }

  const minMounts = 3
  const currentMounts = plan.filter(p => p.tag === 'mount').length
  if (currentMounts < minMounts) {
    for (let n = 0; n < minMounts - currentMounts; n++) {
      const fx = W * (0.2 + n * 0.3) + (Math.random() - 0.5) * W * 0.1
      const fy = H * 0.58 + Math.random() * H * 0.1
      chadd({ tag: 'mount', x: fx, y: fy, h: 0.5 + Math.random() * 0.5 }, 80)
    }
  }

  for (let i = 0; i < W; i += W * 0.12) {
    const fx = i + (Math.random() - 0.5) * W * 0.1
    const fy = H * 0.45 + Math.random() * H * 0.08
    if (Math.random() < 0.7 && Math.random() < blankWeight(fx, fy, W, H, blankSide, 400)) {
      chadd({ tag: 'flatmount', x: fx, y: fy }, 120)
    }
  }

  for (let i = 0; i < W; i += xstep) {
    if ((planmtx[Math.floor(i / xstep)] || 0) === 0) {
      if (Math.random() < 0.08) {
        for (let j = 0; j < 2 + Math.random() * 2; j++) {
          const fx = i + 2 * (Math.random() - 0.5) * W * 0.25
          const fy = H * 0.62 + H * 0.1 - j * 25
          if (Math.random() > blankWeight(fx, fy, W, H, blankSide, 400))
            continue
          chadd({ tag: 'flatmount', x: fx, y: fy, h: ns(i, j) })
        }
      }
    }
  }

  const flatCount = plan.filter(p => p.tag === 'flatmount').length
  if (flatCount < 2) {
    for (let n = 0; n < 2 - flatCount; n++) {
      const fx = W * (0.15 + n * 0.5) + (Math.random() - 0.5) * W * 0.1
      const fy = H * 0.48 + Math.random() * H * 0.06
      chadd({ tag: 'flatmount', x: fx, y: fy }, 100)
    }
  }

  const maxBoats = 1 + Math.floor(Math.random() * 2)
  const boatPos: number[] = []
  for (let i = 0; i < maxBoats; i++) {
    const bx = blankSide === 'left'
      ? W * (0.1 + Math.random() * 0.35)
      : W * (0.55 + Math.random() * 0.35)
    if (!boatPos.some(p => Math.abs(p - bx) < W * 0.2)) {
      plan.push({ tag: 'boat', x: bx, y: H * 0.75 + Math.random() * H * 0.05 })
      boatPos.push(bx)
    }
  }

  const mountItems = plan.filter(p => p.tag === 'mount')
  if (mountItems.length > 0) {
    const m = mountItems[Math.floor(Math.random() * mountItems.length)]
    plan.push({
      tag: 'arch01',
      x: m.x + (Math.random() - 0.5) * 100,
      y: m.y - 5,
    })
  }
  if (mountItems.length > 1) {
    const m = mountItems[Math.floor(Math.random() * (mountItems.length - 1)) + 1]
    plan.push({
      tag: 'arch03',
      x: m.x + (Math.random() - 0.5) * 80,
      y: m.y - 30 - Math.random() * 40,
    })
  }

  return plan
}

/**
 * 生成山水画 SVG。可在主线程或 Worker 中运行。
 */
export async function buildHeroScene(W: number, H: number, seed: number): Promise<HeroScene> {
  const { noise } = await import('@jobinjia/shuimo-core/foundation')
  const { Mount, Arch } = await import('@jobinjia/shuimo-core/elements')

  const blankSide: 'left' | 'right' = seed % 2 === 0 ? 'left' : 'right'
  const noiseFn = (x: number, y: number, z?: number) => noise.noise(x, y, z ?? 0)
  const plan = planScene(W, H, seed, noiseFn, blankSide)

  const svgParts: string[] = []

  for (const item of plan) {
    const s = Math.random() * 100

    if (item.tag === 'mount') {
      const result = Mount.mountain(item.x, item.y, s, {
        hei: 80 + Math.random() * 250,
        wid: 350 + Math.random() * 200,
        tex: 180,
        veg: true,
      })
      if (typeof result === 'string')
        svgParts.push(result)
    }
    else if (item.tag === 'flatmount') {
      svgParts.push(Mount.flatMount(item.x, item.y, s, {
        wid: 500 + Math.random() * 300,
        hei: 80 + Math.random() * 60,
        cho: 0.5 + Math.random() * 0.2,
        tex: 60,
      }))
    }
    else if (item.tag === 'boat') {
      svgParts.push(Arch.boat01(item.x, item.y, s, {
        sca: item.y / (H * 1.2),
        fli: Math.random() > 0.5,
      }))
    }
    else if (item.tag === 'arch01') {
      svgParts.push(Arch.arch01(item.x, item.y, s, {
        hei: 50 + Math.random() * 30,
        wid: 120 + Math.random() * 60,
      }))
    }
    else if (item.tag === 'arch03') {
      svgParts.push(Arch.arch03(item.x, item.y, s, {
        wid: 35 + Math.random() * 20,
        sto: 4 + Math.floor(Math.random() * 4),
      }))
    }
  }

  // 显式 width/height 是 worker 内 createImageBitmap(svgBlob) 能栅格化的前提
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="mix-blend-mode:multiply"
    preserveAspectRatio="xMidYMid slice">
    ${svgParts.join('\n')}
  </svg>`

  return { svg, blankSide, seed }
}
