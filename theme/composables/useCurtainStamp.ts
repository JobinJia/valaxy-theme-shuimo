// 单例化幕布印章生成：4 个挂载点（桌面 left/right + 移动 top/bottom）原本各跑
// 一次 generateSealAsync —— 主线程同步串行 + 1.2MB 字体 fontkit parse，4 倍冗余。
// 现在共享一份 SVG 字符串，挂载点只做轻量 ID 重命名后 v-html。
import type { SealOptions, SealShape } from '@jobinjia/shuimo-core/stamp-v2'
import type { ComputedRef, Ref } from 'vue'
import { onMounted, ref, watch } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { useThemeConfig } from './config'
import { getStampFontWorker } from './useStampFontWorker'
import { warnMissingShuimoCore } from './warnMissingShuimoCore'

type GenerateSealAsync = typeof import('@jobinjia/shuimo-core/stamp-v2').generateSealAsync

let cachedGenerateSealAsync: GenerateSealAsync | null = null
let stampV2ModulePromise: Promise<GenerateSealAsync> | null = null

function ensureStampV2Module(): Promise<GenerateSealAsync> {
  if (cachedGenerateSealAsync)
    return Promise.resolve(cachedGenerateSealAsync)
  if (stampV2ModulePromise)
    return stampV2ModulePromise
  stampV2ModulePromise = import('@jobinjia/shuimo-core/stamp-v2').then((mod) => {
    cachedGenerateSealAsync = mod.generateSealAsync
    return cachedGenerateSealAsync
  })
  return stampV2ModulePromise
}

// 模块加载时（App.vue import useCurtainStamp 即触发）立即并行预热 stamp-v2
// chunk + yishan woff2 fetch；fontWorker 由 useStampFontWorker 共享模块管理，
// 模块顶部 import 即 spawn，所有 stamp 调用点（curtain / theme toggle / 文章
// frontmatter stamp）共用一个 worker。
if (typeof window !== 'undefined') {
  ensureStampV2Module().catch(() => {})
  fetch(yishanFontUrl).catch(() => {})
}

type ShapeStr
  = | 'auto' | 'square' | 'rect' | 'rectangle'
    | 'circle' | 'ellipse' | 'polygon'

function mapShape(s: ShapeStr | undefined, sides?: number, orient?: 'flat-top' | 'point-top'): SealShape {
  switch (s) {
    case 'polygon':
      return { kind: 'polygon', sides: sides ?? 6, orientation: orient ?? 'flat-top' }
    case 'auto': return { kind: 'auto' }
    case 'square': return { kind: 'square' }
    case 'circle': return { kind: 'circle' }
    case 'ellipse': return { kind: 'ellipse' }
    case 'rectangle': // alias
    case 'rect':
    default:
      return { kind: 'rect' }
  }
}

function parseStampText(text: string | string[]): string[] {
  if (Array.isArray(text))
    return text
  if (text.includes(',') || text.includes('，'))
    return text.split(/[,，]/).map(s => s.trim())
  return [text]
}

function pruneEmpty<T extends Record<string, any>>(obj: T): T | undefined {
  const out: Record<string, any> = {}
  let has = false
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) {
      out[k] = obj[k]
      has = true
    }
  }
  return has ? (out as T) : undefined
}

export function useCurtainStamp(input: ComputedRef<Record<string, any>> | Ref<Record<string, any>>) {
  const themeConfig = useThemeConfig()
  const svgRaw = ref<string | null>(null)
  const failed = ref(false)
  const ready = ref(false)
  // 防 stale 写入：watch 触发的二次 render 比一次 render 先完成时，旧 promise
  // 落地不能覆盖新结果
  let generation = 0

  function buildSealOptions(p: Record<string, any>): SealOptions {
    const stampColor = p.color || themeConfig.value?.colors?.stamp || '#C8102E'
    const mode = (p.mode ?? p.type ?? 'yang') as 'yin' | 'yang'
    return {
      text: parseStampText(p.text ?? p.author ?? ''),
      size: p.size,
      mode,
      shape: mapShape(p.shape, p.polygonSides, p.polygonOrientation),
      seed: p.seed ?? 69706,
      script: p.script,
      // 默认使用主题自带的 yishanbeizhuanti.woff2；用户在 stamp.curtain.fontUrl
      // 配置自定义字体时覆盖。
      font: p.fontUrl ?? yishanFontUrl,
      // 仅在用户显式提供时才传 fallback —— 否则会触发 V2 内部 fallback 分支
      // 的额外开销与日志告警。
      fontFallbackUrl: p.fontFallbackUrl,
      harfbuzzSubsetWasmUrl: p.harfbuzzSubsetWasmUrl,
      // fontkit woff2 brotli 解压 offload 到 worker 主线程零成本（shuimo-core
      // 1.2.x+ 已支持，V2 走同一 worker 协议）。
      fontWorker: getStampFontWorker() ?? undefined,
      ink: { color: stampColor, ...(p.ink ?? {}) },
      border: p.border,
      carving: p.carving,
      notch: p.notch,
      pressing: p.pressing,
      layout: pruneEmpty({
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        padding: p.padding,
        gap: p.gap,
        columnGap: p.columnGap,
        rowGap: p.rowGap,
        stretch: p.stretch,
        cellHeightMode: p.cellHeightMode,
      }),
    }
  }

  async function render() {
    const id = ++generation
    failed.value = false
    try {
      const generateSealAsync = await ensureStampV2Module()
      const result = await generateSealAsync(buildSealOptions(input.value))
      if (id !== generation)
        return
      svgRaw.value = result.svg ?? null
    }
    catch (err) {
      if (id !== generation)
        return
      failed.value = true
      if (import.meta.env.DEV && !warnMissingShuimoCore.fired) {
        warnMissingShuimoCore.fired = true
        console.warn(
          '[valaxy-theme-shuimo] curtain stamp fallback in use. '
          + 'Install the optional peer dependency "@jobinjia/shuimo-core" to render SVG stamps.',
          err,
        )
      }
    }
    if (id === generation)
      ready.value = true
  }

  if (typeof window !== 'undefined') {
    onMounted(render)
    watch(input, render)
  }

  return { svgRaw, failed, ready }
}
