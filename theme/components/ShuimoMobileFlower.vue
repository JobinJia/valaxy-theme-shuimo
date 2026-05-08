<script setup lang="ts">
import type { FlowerSource } from '../composables/useMobileFlower'
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { buildMobileFlower, getCachedMobileFlower, getSessionSeed, mobileFlowerReady, mobileFlowerSeed, resolveFlowerType, scheduleShuimoTask, setCachedMobileFlower, useThemeConfig } from '../composables'
import { rafDebounce } from '../composables/useRafDebounce'

const emit = defineEmits<{
  ready: []
  seedGenerated: [seed: number]
}>()

const themeConfig = useThemeConfig()
const canvasRef = useTemplateRef<HTMLCanvasElement>('flowerCanvas')
let currentFlowerSource: FlowerSource | null = null
let disposed = false

const flowerType = computed(() =>
  themeConfig.value?.hero?.mobileFlower?.type ?? 'season',
)
const flowerOpacity = computed(() =>
  themeConfig.value?.hero?.mobileFlower?.opacity ?? 0.8,
)

const regen = rafDebounce(regenerateFlower)

onMounted(async () => {
  if (typeof window === 'undefined')
    return

  window.addEventListener('resize', regen.schedule)
  regenerateFlower()
})

onUnmounted(() => {
  disposed = true
  regen.cancel()
  window.removeEventListener('resize', regen.schedule)
})

async function regenerateFlower() {
  const { width, height } = getViewportSize()
  const seed = themeConfig.value?.hero?.mobileFlower?.seed ?? getSessionSeed()
  mobileFlowerSeed.value = seed
  const type = resolveFlowerType(flowerType.value as 'woody' | 'herbal' | 'random' | 'season')
  const cachedFlower = getCachedMobileFlower()
  if (cachedFlower
    && cachedFlower.width === width
    && cachedFlower.height === height
    && cachedFlower.seed === seed
    && cachedFlower.type === type) {
    currentFlowerSource = cachedFlower.source
    drawCurrentFlower()
    return
  }

  try {
    const scene = await scheduleShuimoTask(() => buildMobileFlower(width, height, seed, type))
    if (disposed)
      return
    currentFlowerSource = scene.source
    setCachedMobileFlower({ source: scene.source, seed, type, width: scene.width, height: scene.height })
    emit('seedGenerated', seed)
    drawCurrentFlower()
  }
  catch (e) {
    console.error('[shuimo] 移动端花卉背景生成失败', e)
    emit('ready')
  }
}

function drawCurrentFlower() {
  const output = canvasRef.value
  const source = currentFlowerSource
  if (!output || !source)
    return

  output.width = source.width
  output.height = source.height

  const ctx = output.getContext('2d')
  if (!ctx)
    return

  ctx.clearRect(0, 0, source.width, source.height)
  ctx.drawImage(source, 0, 0)
  emit('ready')
  mobileFlowerReady.value = true
}

function getViewportSize() {
  return {
    width: Math.max(1, Math.round(window.innerWidth)),
    height: Math.max(1, Math.round(window.innerHeight)),
  }
}
</script>

<template>
  <div
    class="shuimo-mobile-flower"
    :style="{ opacity: flowerOpacity }"
  >
    <canvas ref="flowerCanvas" class="shuimo-mobile-flower__canvas" aria-hidden="true" />
  </div>
</template>

<style lang="scss" scoped>
// 容器高度锁定到 viewport（dvh 优先匹配地址栏动态收缩，回退 vh），
// 否则父容器 .shuimo-app 是 min-height 100vh + flex 内容，全文档高度可达数千 px，
// canvas 的 height:100% 会把按 viewport 大小生成的花卉在 Y 方向拉伸到全文档高度，
// 视觉上花就远超手机可视范围。
.shuimo-mobile-flower {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  height: 100dvh;
  pointer-events: none;
  z-index: auto;
  overflow: hidden;
}

.shuimo-mobile-flower__canvas {
  width: 100%;
  height: 100%;
  display: block;
  mix-blend-mode: multiply;
}
</style>

<style>
html.dark .shuimo-mobile-flower__canvas {
  filter: invert(0.88) hue-rotate(180deg);
}
</style>
