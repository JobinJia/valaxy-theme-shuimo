<script setup lang="ts">
/**
 * ShuimoStamp — Chinese seal stamp component.
 *
 * Renders an SVG seal via @jobinjia/shuimo-core's stamp-v2 entry, with a CSS
 * fallback when the optional peer dependency is not installed.
 *
 * Per-post customization via frontmatter: text, color, mode (yin/yang),
 * shape, script, and any nested V2 group (border/carving/ink/notch/pressing).
 *
 * Text layout: use commas to split text into columns, e.g. "月下,独酌"
 * renders as a 2-column seal (right column "月下", left column "独酌").
 *
 * Default font: YiShanBeiZhuan (seal script / 篆书).
 */
import type {
  SealBorderOptions,
  SealCarvingOptions,
  SealInkOptions,
  SealNotchSpec,
  SealOptions,
  SealPressingOptions,
  SealScript,
  SealShape,
} from '@jobinjia/shuimo-core/stamp-v2'
import { computed, onMounted, ref, watch } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { useThemeConfig } from '../composables'
import { getStampFontWorker } from '../composables/useStampFontWorker'
import { warnMissingShuimoCore } from '../composables/warnMissingShuimoCore'

type ShapeStr
  = | 'auto' | 'square' | 'rect' | 'rectangle'
    | 'circle' | 'ellipse' | 'polygon'

const props = withDefaults(defineProps<{
  text?: string
  /** 阴章/阳章 */
  mode?: 'yin' | 'yang'
  /** @deprecated 改用 `mode`；若两者都设，`mode` 优先 */
  type?: 'yin' | 'yang'
  /** `'rectangle'` 为 `'rect'` 的兼容别名 */
  shape?: ShapeStr
  polygonSides?: number
  polygonOrientation?: 'flat-top' | 'point-top'
  script?: SealScript
  size?: number
  offsetX?: number
  offsetY?: number
  color?: string
  seed?: number
  padding?: number
  gap?: number
  columnGap?: number
  rowGap?: number
  stretch?: boolean
  border?: SealBorderOptions
  carving?: SealCarvingOptions
  ink?: Omit<SealInkOptions, 'color'>
  notch?: SealNotchSpec
  pressing?: SealPressingOptions
}>(), {
  text: '受命,于天,既寿,永昌',
  mode: 'yang',
  shape: 'rect',
  size: 200,
  offsetX: 0,
  offsetY: 0,
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

const resolvedMode = computed<'yin' | 'yang'>(() => props.mode ?? props.type ?? 'yang')

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

// Cache the dynamic import so we only load stamp-v2 once
type GenerateSealAsync = typeof import('@jobinjia/shuimo-core/stamp-v2').generateSealAsync
let generateSealAsync: GenerateSealAsync | null = null

function mapShape(s: ShapeStr): SealShape {
  switch (s) {
    case 'polygon':
      return { kind: 'polygon', sides: props.polygonSides ?? 6, orientation: props.polygonOrientation ?? 'flat-top' }
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

/** Split stamp text into columns by comma delimiter for multi-column layout. */
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

function buildSealOptions(): SealOptions {
  const stampColor = props.color || themeConfig.value?.colors?.stamp || '#C8102E'
  return {
    text: parseStampText(props.text),
    size: props.size,
    mode: resolvedMode.value,
    shape: mapShape(props.shape ?? 'rect'),
    seed: props.seed ?? 69706,
    script: props.script,
    font: yishanFontUrl,
    // fontWorker offload 让 fontkit woff2 brotli 解压离开主线程（shuimo-core
    // 1.2.x+；V2 走同一 worker 协议）。所有 stamp 共享一个 worker，二次调用
    // (fontUrl, chars) 命中 worker 内部缓存零成本。
    fontWorker: getStampFontWorker() ?? undefined,
    ink: { color: stampColor, ...(props.ink ?? {}) },
    border: props.border,
    carving: props.carving,
    notch: props.notch,
    pressing: props.pressing,
    layout: pruneEmpty({
      offsetX: props.offsetX,
      offsetY: props.offsetY,
      padding: props.padding,
      gap: props.gap,
      columnGap: props.columnGap,
      rowGap: props.rowGap,
      stretch: props.stretch,
    }),
  }
}

async function renderStamp() {
  ensureStampUid()
  try {
    if (!generateSealAsync) {
      const mod = await import('@jobinjia/shuimo-core/stamp-v2')
      generateSealAsync = mod.generateSealAsync
    }

    const result = await generateSealAsync(buildSealOptions())
    const svg = result.svg ?? ''

    stampSvg.value = svg
      .replace(/stamp-ink-texture/g, `stamp-ink-texture-${stampUid}`)
      .replace(/stamp-border-texture/g, `stamp-border-texture-${stampUid}`)
      .replace(/stamp-text-texture/g, `stamp-text-texture-${stampUid}`)
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
  () => [
    props.text,
    props.mode,
    props.type,
    props.shape,
    props.polygonSides,
    props.polygonOrientation,
    props.script,
    props.color,
    props.size,
    props.seed,
    props.offsetX,
    props.offsetY,
    props.padding,
    props.gap,
    props.columnGap,
    props.rowGap,
    props.stretch,
    props.border,
    props.carving,
    props.ink,
    props.notch,
    props.pressing,
  ],
  renderStamp,
  { deep: true },
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
    :class="[`shuimo-stamp-fallback--${resolvedMode}`]"
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
