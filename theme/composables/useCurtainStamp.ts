// 单例化幕布印章生成：4 个挂载点（桌面 left/right + 移动 top/bottom）原本各跑
// 一次 generateStampAsync —— 主线程同步串行 + 1.2MB 字体 fontkit parse，4 倍冗余。
// 现在共享一份 SVG 字符串，挂载点只做轻量 ID 重命名后 v-html。
import type { StampOptions } from '@jobinjia/shuimo-core/drawing'
import type { ComputedRef, Ref } from 'vue'
import { onMounted, ref, watch } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { useThemeConfig } from './config'
import { getStampFontWorker } from './useStampFontWorker'
import { warnMissingShuimoCore } from './warnMissingShuimoCore'

// 运行时 generateStampAsync 在 textCarving='normal' 路径返回 SVG 字符串，
// 但保留对 { toDataURL } 形态的容错（未来 backend 可能换 canvas 路径）。
type GenerateStampAsync = (opts: StampOptions) => Promise<unknown>

let cachedGenerateStampAsync: GenerateStampAsync | null = null
let drawingModulePromise: Promise<GenerateStampAsync> | null = null

function ensureDrawingModule(): Promise<GenerateStampAsync> {
  if (cachedGenerateStampAsync)
    return Promise.resolve(cachedGenerateStampAsync)
  if (drawingModulePromise)
    return drawingModulePromise
  drawingModulePromise = import('@jobinjia/shuimo-core/drawing').then((mod) => {
    cachedGenerateStampAsync = mod.generateStampAsync as GenerateStampAsync
    return cachedGenerateStampAsync
  })
  return drawingModulePromise
}

// 模块加载时（App.vue import useCurtainStamp 即触发）立即并行预热 drawing
// chunk + yishan woff2 fetch；fontWorker 由 useStampFontWorker 共享模块管理，
// 模块顶部 import 即 spawn，所有 stamp 调用点（curtain / theme toggle / 文章
// frontmatter stamp）共用一个 worker。
if (typeof window !== 'undefined') {
  ensureDrawingModule().catch(() => {})
  fetch(yishanFontUrl).catch(() => {})
}

function parseStampText(text: string | string[]): string[] {
  if (Array.isArray(text))
    return text
  if (text.includes(',') || text.includes('，'))
    return text.split(/[,，]/).map(s => s.trim())
  return [text]
}

export function useCurtainStamp(input: ComputedRef<Record<string, any>> | Ref<Record<string, any>>) {
  const themeConfig = useThemeConfig()
  const svgRaw = ref<string | null>(null)
  const failed = ref(false)
  const ready = ref(false)
  // 防 stale 写入：watch 触发的二次 render 比一次 render 先完成时，旧 promise
  // 落地不能覆盖新结果
  let generation = 0

  function buildStampOptions(props: Record<string, any>): StampOptions {
    const stampColor = props.color || themeConfig.value?.colors?.stamp || '#C8102E'
    return {
      text: parseStampText(props.text),
      type: props.type,
      shape: props.shape,
      color: stampColor,
      textColor: props.type === 'yin' ? '#FFFFFF' : stampColor,
      fontFamily: props.fontFamily,
      fontSize: props.fontSize,
      fontWeight: props.fontWeight,
      textCarving: props.textCarving ?? 'normal',
      offsetX: props.offsetX,
      offsetY: props.offsetY,
      borderScale: props.borderScale,
      columnSpacing: props.columnSpacing,
      characterSpacing: props.characterSpacing,
      paddingX: props.paddingX,
      paddingY: props.paddingY,
      columnSpacingPx: props.columnSpacingPx,
      characterSpacingPx: props.characterSpacingPx,
      paddingXPx: props.paddingXPx,
      paddingYPx: props.paddingYPx,
      borderScaleX: props.borderScaleX,
      borderScaleY: props.borderScaleY,
      noiseAmountPx: props.noiseAmountPx,
      borderPointsPx: props.borderPointsPx,
      cornerRadiusPx: props.cornerRadiusPx,
      borderWidthPx: props.borderWidthPx,
      regularShape: props.regularShape,
      seed: props.seed ?? 69706,
      fontUrl: yishanFontUrl,
      // 把 fontkit 解 woff2 + 提取 glyph 路径全部 offload 到 worker，主线程零
      // brotli 解压。shuimo-core 1.2.x+ 支持。
      fontWorker: getStampFontWorker() ?? undefined,
    } as StampOptions
  }

  async function render() {
    const id = ++generation
    failed.value = false
    try {
      const generateStampAsync = await ensureDrawingModule()
      const result = await generateStampAsync(buildStampOptions(input.value))
      if (id !== generation)
        return
      if (typeof result === 'string')
        svgRaw.value = result
      else if (result && typeof (result as any).toDataURL === 'function')
        svgRaw.value = `<img src="${(result as any).toDataURL()}" width="100%" height="100%" />`
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
