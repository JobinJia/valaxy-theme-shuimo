<script setup lang="ts">
/**
 * ShuimoStamp — Chinese seal stamp component.
 *
 * Renders an SVG seal stamp via @jobinjia/shuimo-core, with a CSS fallback
 * when the optional peer dependency is not installed.
 *
 * Supports per-post customization: text, color, type (yin/yang), shape,
 * and size can all be overridden via props (driven by frontmatter).
 *
 * Text layout: use commas to split text into columns, e.g. "月下,独酌"
 * renders as a 2×2 grid (right column "月下", left column "独酌").
 *
 * Default font: YiShanBeiZhuan (seal script / 篆书).
 */
import { onMounted, ref, watch } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { useThemeConfig } from '../composables'
import { warnMissingShuimoCore } from '../composables/warnMissingShuimoCore'

const props = withDefaults(defineProps<{
  text?: string
  type?: 'yin' | 'yang'
  shape?: 'auto' | 'circle' | 'ellipse' | 'rectangle' | 'square'
  fontFamily?: string
  size?: number
  fontSize?: number
  fontWeight?: string
  offsetX?: number
  offsetY?: number
  color?: string
  textCarving?: 'normal' | 'strong' | 'stone-cut'
  seed?: number
  borderScale?: number
  columnSpacing?: number
  characterSpacing?: number
  paddingX?: number
  paddingY?: number
  columnSpacingPx?: number
  characterSpacingPx?: number
  paddingXPx?: number
  paddingYPx?: number
  borderScaleX?: number
  borderScaleY?: number
  noiseAmountPx?: number
  borderPointsPx?: number
  cornerRadiusPx?: number
  borderWidthPx?: number
  regularShape?: boolean
}>(), {
  text: '受命,于天,既寿,永昌',
  type: 'yang',
  shape: 'rectangle',
  fontFamily: '峄山碑篆体',
  size: 200,
  fontSize: 70,
  fontWeight: 'normal',
  offsetX: 0,
  offsetY: 0,
  borderScale: 1,
  columnSpacing: undefined,
  characterSpacing: undefined,
  paddingX: undefined,
  paddingY: undefined,
  columnSpacingPx: 0.35,
  characterSpacingPx: 3.2,
  paddingXPx: 1.5,
  paddingYPx: 1.5,
  borderScaleX: undefined,
  borderScaleY: undefined,
  noiseAmountPx: 10,
  borderPointsPx: 24,
  cornerRadiusPx: 10,
  borderWidthPx: 4,
  regularShape: true,
})

const emit = defineEmits<{
  rendered: []
}>()

const stampSvg = ref<string | null>(null)
const showFallback = ref(false)
const themeConfig = useThemeConfig()
let firstRenderEmitted = false

function emitFirstRender() {
  if (firstRenderEmitted)
    return
  firstRenderEmitted = true
  emit('rendered')
}

// stampUid 在 onMounted 才生成：setup 顶层走 SSR 会用 Math.random / crypto，
// 服务端和客户端值不同导致 hydration 警告 + 整 stamp 重渲。renderStamp 也是
// onMounted 才跑，stamp 在 SSR 阶段不可见，延后到 client 完全 OK
let stampUid = ''
function ensureStampUid() {
  if (stampUid)
    return
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    stampUid = crypto.randomUUID().slice(0, 8)
  else
    stampUid = Math.random().toString(36).slice(2, 10)
}

// Cache the dynamic import so we only load shuimo-core once
let generateStampAsync: any = null

/** Split stamp text into columns by comma delimiter for multi-column layout. */
function parseStampText(text: string | string[]): string[] {
  if (Array.isArray(text))
    return text
  if (text.includes(',') || text.includes('，'))
    return text.split(/[,，]/).map(s => s.trim())
  return [text]
}

/** Generate the stamp SVG via shuimo-core. Called on mount and when props change. */
async function renderStamp() {
  ensureStampUid()
  try {
    if (!generateStampAsync) {
      const mod = await import('@jobinjia/shuimo-core/drawing')
      generateStampAsync = mod.generateStampAsync
    }

    // 不等 document.fonts.ready —— 它会等正文/标题等所有 webfont 一起到位，
    // 最慢可能 1-2s。stamp 实际只需要 yishan 字体，shuimo-core 通过 fontUrl
    // 接收并在内部 FontFace.load 自己 await，所以这里不需要再等全局字体。

    const textArray = parseStampText(props.text)
    const stampColor = props.color || themeConfig.value?.colors?.stamp || '#C8102E'
    const stampOptions: Record<string, any> = {
      text: textArray,
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
    }
    const result = await generateStampAsync(stampOptions)

    if (typeof result === 'string') {
      stampSvg.value = result
        .replace(/stamp-ink-texture/g, `stamp-ink-texture-${stampUid}`)
        .replace(/stamp-border-texture/g, `stamp-border-texture-${stampUid}`)
        .replace(/stamp-text-texture/g, `stamp-text-texture-${stampUid}`)
    }
    else if (result?.toDataURL) {
      stampSvg.value = `<img src="${result.toDataURL()}" width="100%" height="100%" />`
    }
  }
  catch (err) {
    showFallback.value = true
    if (import.meta.env.DEV && !warnMissingShuimoCore.fired) {
      warnMissingShuimoCore.fired = true
      console.warn(
        '[valaxy-theme-shuimo] ShuimoStamp fallback in use. '
        + 'Install the optional peer dependency "@jobinjia/shuimo-core" to render SVG stamps.',
        err,
      )
    }
  }
  emitFirstRender()
}

onMounted(renderStamp)

// Re-render when stamp props change (e.g. SPA route navigation updates frontmatter)
watch(
  () => [props.text, props.type, props.shape, props.color, props.size, props.fontSize, props.fontWeight, props.offsetX, props.offsetY, props.textCarving, props.seed, props.borderScale, props.columnSpacing, props.characterSpacing, props.paddingX, props.paddingY, props.columnSpacingPx, props.characterSpacingPx, props.paddingXPx, props.paddingYPx, props.borderScaleX, props.borderScaleY, props.noiseAmountPx, props.borderPointsPx, props.cornerRadiusPx, props.borderWidthPx, props.regularShape],
  renderStamp,
)
</script>

<template>
  <div
    v-if="stampSvg"
    class="shuimo-stamp"
    v-html="stampSvg"
  />
  <div
    v-else-if="showFallback"
    class="shuimo-stamp-fallback"
    :class="[`shuimo-stamp-fallback--${type}`]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.4}px` }"
  >
    {{ text.slice(0, 2) }}
  </div>
</template>

<style lang="scss" scoped>
.shuimo-stamp {
  --shuimo-stamp-size: v-bind(`${size}px`);
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    max-width: var(--shuimo-stamp-size);
    max-height: var(--shuimo-stamp-size);
    width: auto;
    height: auto;
  }
}

.shuimo-stamp-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--va-font-family-base);
  font-weight: bold;
  border-radius: 3px;
  transform: rotate(-3deg);
  line-height: 1.2;

  &--yin {
    background: var(--sm-stamp);
    color: var(--sm-paper);
  }

  &--yang {
    background: transparent;
    color: var(--sm-stamp);
    border: 2px solid var(--sm-stamp);
  }
}
</style>
