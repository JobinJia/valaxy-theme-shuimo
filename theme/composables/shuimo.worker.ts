/// <reference lib="webworker" />

let elementsModule: any = null
let drawingModule: any = null
let foundationModule: any = null

async function loadElements() {
  if (!elementsModule)
    elementsModule = await import('@jobinjia/shuimo-core/elements')
  return elementsModule
}

async function loadDrawing() {
  if (!drawingModule)
    drawingModule = await import('@jobinjia/shuimo-core/drawing')
  return drawingModule
}

async function loadFoundation() {
  if (!foundationModule)
    foundationModule = await import('@jobinjia/shuimo-core/foundation')
  return foundationModule
}

/**
 * 轻量版远山：用简单 SVG path + stroke 画轮廓，不用三角化
 * 仿照老版本 shuimo-core 的实现方式
 */
function lightDistMount(xoff: number, yoff: number, seed: number, noiseFn: any, strokeFn: any, opts: any = {}) {
  const hei = opts.hei ?? 100
  const len = opts.len ?? 400
  let svg = ''

  const reso = 50
  const points: [number, number][] = []

  for (let i = 0; i <= reso; i++) {
    const x = (i / reso - 0.5) * Math.PI
    let y = Math.cos(x)
    y *= noiseFn(x + 10, 0.15, seed)
    points.push([(x / Math.PI) * len + xoff, -y * hei + yoff])
  }

  // 封闭多边形填充底色（用原生 SVG polygon）
  const fillPts = [
    ...points,
    [points[points.length - 1][0], yoff + 20],
    [points[0][0], yoff + 20],
  ]
  const c = 200 + Math.floor(Math.abs(noiseFn(seed * 0.1, 0)) * 30)
  const pointsStr = fillPts.map(p => `${p[0]},${p[1]}`).join(' ')
  svg += `<polygon points="${pointsStr}" fill="rgb(${c},${c},${c})" stroke="none" />`

  // 轮廓线
  svg += strokeFn(points, { col: `rgba(100,100,100,0.3)`, noi: 1, wid: 1.5 })

  return svg
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, params } = e.data
  try {
    let result: string | undefined

    if (type === 'landscape') {
      const { noise } = await loadFoundation()
      const { stroke } = await loadDrawing()
      const elements = await loadElements()
      const { W, H, seed } = params
      let content = ''

      // 远山 — 用轻量版，不触发三角化
      content += lightDistMount(0, H * 0.4, seed, noise.noise, stroke, { hei: H * 0.2, len: W })
      // 中景山
      content += lightDistMount(W * 0.2, H * 0.55, seed + 1, noise.noise, stroke, { hei: H * 0.25, len: W * 0.6 })
      // 松树
      content += elements.Tree.tree05(W * 0.1, H * 0.65, { hei: H * 0.2 })
      content += elements.Tree.tree05(W * 0.82, H * 0.68, { hei: H * 0.15 })
      // 水面
      content += elements.Water.generate(0, H * 0.85, seed + 2, { len: W, hei: 8, clu: 5 })

      result = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g>${content}</g></svg>`
    }
    else if (type === 'decoration') {
      const elements = await loadElements()
      const { actualType, cx, cy, w, h, seed: s } = params
      let svg = ''

      switch (actualType) {
        case 'bamboo':
          svg = elements.Bamboo.generate(cx, h, s, { hei: h * 0.8, stalks: 2, leaves: true, leafDensity: 0.6 })
          break
        case 'orchid':
          svg = elements.Orchid.generate(cx, cy, s, { leafCount: 4, hasFlower: true, flowerCount: 2 })
          break
        case 'plum':
          svg = elements.WinterPlum.generate(cx * 0.3, cy, s, { hei: h * 0.6, branches: 2, flowerDensity: 0.5, flowerColor: '#C8102E' })
          break
        case 'chrysanthemum':
          svg = elements.Chrysanthemum.generate(cx, cy, s, { size: w * 0.25, withStem: true, withLeaves: true })
          break
        case 'mountain': {
          const { noise } = await loadFoundation()
          const { stroke } = await loadDrawing()
          svg = lightDistMount(0, h * 0.6, s, noise.noise, stroke, { hei: h * 0.4, len: w })
          break
        }
        case 'water':
          svg = elements.Water.generate(0, cy, s, { len: w, hei: 20 })
          break
        case 'tree':
          svg = elements.Tree.tree05(cx, h * 0.9, { hei: h * 0.7 })
          break
        case 'rock':
          svg = elements.Mount.rock(cx, h * 0.7, s, { hei: h * 0.3 })
          break
      }
      result = svg
    }
    else if (type === 'brushline') {
      const drawing = await loadDrawing()
      const { variant, points, width, color } = params

      if (variant === 'brush') {
        result = drawing.naturalBrushStroke(points, {
          width,
          color,
          pressure: (t: number) => Math.sin(t * Math.PI),
        })
      }
      else if (variant === 'ink') {
        result = drawing.stroke(points, { wid: width, col: color, noi: 0.3 })
      }
      else {
        result = drawing.stroke(points, { wid: 1, col: color, noi: 0.1 })
      }
    }

    ;(self as any).postMessage({ id, result })
  }
  catch (err: any) {
    ;(self as any).postMessage({ id, error: err?.message || 'Worker error' })
  }
}
