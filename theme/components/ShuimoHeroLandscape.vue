<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBlankSide } from '../composables'

const svgContainer = ref<HTMLDivElement>()
const { setBlankSide } = useBlankSide()

const emit = defineEmits<{
  ready: []
}>()

interface PlanItem {
  tag: string
  x: number
  y: number
  [key: string]: any
}

/**
 * 留白权重：控制画面元素的疏密分布
 * 留白侧上方完全空白，下方允许少量远山；实侧正常绘制
 *
 * @param x       元素 x 坐标
 * @param y       元素 y 坐标（SVG 坐标，0=顶部）
 * @param W       画布宽
 * @param H       画布高
 * @param side    留白方向 'left' | 'right'
 * @returns 0~1 的权重，0 = 完全留白，1 = 正常绘制
 */
/**
 * 留白权重：检查元素整体（含宽度）是否侵入留白区
 * @param x       元素中心 x
 * @param y       元素 y 坐标
 * @param W       画布宽
 * @param H       画布高
 * @param side    留白方向
 * @param halfW   元素半宽（默认 300，山的典型半宽）
 */
function blankWeight(x: number, y: number, W: number, H: number, side: 'left' | 'right', halfW = 0): number {
  // 取元素最靠近留白侧的边缘
  const edgeX = side === 'left' ? x - halfW : x + halfW
  const nx = side === 'left' ? edgeX / W : 1 - edgeX / W
  const ny = y / H

  const blankEdge = 0.38

  if (nx >= blankEdge)
    return 1

  // 题款安全区：留白侧内 25% × 上方 50%，绝对禁止（只保护文字区域）
  if (nx < 0.25 && ny < 0.5)
    return 0

  // 渐变过渡，让画面自然分布
  const xFade = nx / blankEdge
  const yFade = Math.max(0, (ny - 0.3) / 0.7)

  return xFade * xFade * yFade
}

/**
 * 场景规划器：移植自 shan-shui-inf 的 mountplanner
 * 用 Perlin 噪声自动编排山水元素位置，支持留白构图
 */
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

  // 主峰（留白侧抑制）
  for (let i = 0; i < W; i += xstep) {
    for (let j = 0; j < yr(i) * H * 0.6; j += 30) {
      if (locmax(i, j, 2)) {
        const xof = i + 2 * (Math.random() - 0.5) * W * 0.3
        const yof = j + H * 0.4
        // 留白权重过滤（山半宽约 300px）
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

  // 远山（留白侧抑制）
  for (let i = 0; i < W; i += W * 0.15) {
    const fx = i + (Math.random() - 0.5) * W * 0.1
    const fy = H * 0.3 + Math.random() * H * 0.1
    if (Math.random() < 0.5 && Math.random() < blankWeight(fx, fy, W, H, blankSide, 400)) {
      chadd({ tag: 'flatmount', x: fx, y: fy }, 150)
    }
  }

  // 空旷区域补平山（留白侧抑制）
  for (let i = 0; i < W; i += xstep) {
    if ((planmtx[Math.floor(i / xstep)] || 0) === 0) {
      if (Math.random() < 0.04) {
        for (let j = 0; j < 3 * Math.random(); j++) {
          const fx = i + 2 * (Math.random() - 0.5) * W * 0.4
          const fy = H * 0.55 + H * 0.15 - j * 50
          if (Math.random() > blankWeight(fx, fy, W, H, blankSide, 400))
            continue
          chadd({ tag: 'flatmount', x: fx, y: fy, h: ns(i, j) })
        }
      }
    }
  }

  // 船（放在留白侧的水面上，呼应留白意境）
  const maxBoats = 1 + Math.floor(Math.random() * 2)
  const boatPos: number[] = []
  for (let i = 0; i < maxBoats; i++) {
    // 船偏向留白侧下方的开阔水面
    const bx = blankSide === 'left'
      ? W * (0.1 + Math.random() * 0.35)
      : W * (0.55 + Math.random() * 0.35)
    if (!boatPos.some(p => Math.abs(p - bx) < W * 0.2)) {
      plan.push({ tag: 'boat', x: bx, y: H * 0.6 + Math.random() * H * 0.1 })
      boatPos.push(bx)
    }
  }

  // 建筑依附于山
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
 * 生成山水画 SVG 字符串
 * 直接注入 DOM，不经过 Canvas 转换（与 shan-shui-inf 同样做法）
 */
async function generateScene(W: number, H: number): Promise<string> {
  const { noise } = await import('@jobinjia/shuimo-core/foundation')
  const { Mount, Arch, water } = await import('@jobinjia/shuimo-core/elements')
  const seed = Math.floor(Math.random() * 99999)

  // 随机选择留白方向：左上或右上，并通知布局层
  const blankSide: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right'
  setBlankSide(blankSide)

  const noiseFn = (x: number, y: number, z?: number) => noise.noise(x, y, z ?? 0)
  const plan = planScene(W, H, seed, noiseFn, blankSide)

  const svgParts: string[] = []

  for (const item of plan) {
    const s = Math.random() * 100

    if (item.tag === 'mount') {
      svgParts.push(Mount.mountain(item.x, item.y, s, {
        hei: 100 + Math.random() * 400,
        wid: 400 + Math.random() * 200,
        tex: 200,
        veg: true,
      }))
      svgParts.push(water(item.x, item.y, s))
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
        hei: 8 + Math.random() * 4,
        wid: 35 + Math.random() * 20,
        sto: 4 + Math.floor(Math.random() * 4),
      }))
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;height:100%;mix-blend-mode:multiply"
    preserveAspectRatio="xMidYMid slice">
    ${svgParts.join('\n')}
  </svg>`
}

onMounted(async () => {
  const el = svgContainer.value
  if (!el)
    return

  try {
    const W = Math.min(window.innerWidth, 1920)
    const H = Math.min(window.innerHeight, 1080)
    el.innerHTML = await generateScene(W, H)
    // 通知父组件画面已就绪，可以开幕
    emit('ready')
  }
  catch (e) {
    console.error('[shuimo] 山水画生成失败', e)
  }

  // shuimo-core 文字测量临时 SVG 清理
  document.querySelectorAll('body > svg').forEach(s => s.remove())
})
</script>

<template>
  <div ref="svgContainer" class="shuimo-hero-landscape" />
</template>

<style scoped>
.shuimo-hero-landscape {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background: rgb(245, 232, 207);
}
</style>
