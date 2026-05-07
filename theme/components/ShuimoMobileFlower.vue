<script setup lang="ts">
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { buildMobileFlower, getCachedMobileFlower, getSessionSeed, resolveFlowerType, scheduleShuimoTask, setCachedMobileFlower, useThemeConfig } from '../composables'

const emit = defineEmits<{
  ready: []
  seedGenerated: [seed: number]
}>()

const themeConfig = useThemeConfig()
const canvasRef = useTemplateRef<HTMLCanvasElement>('flowerCanvas')
let currentFlowerCanvas: HTMLCanvasElement | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let disposed = false

const flowerType = computed(() =>
  themeConfig.value?.hero?.mobileFlower?.type ?? 'season',
)
const flowerOpacity = computed(() =>
  themeConfig.value?.hero?.mobileFlower?.opacity ?? 0.8,
)

onMounted(async () => {
  if (typeof window === 'undefined')
    return

  window.addEventListener('resize', scheduleRegenerate)
  regenerateFlower()
})

onUnmounted(() => {
  disposed = true
  if (resizeTimer)
    clearTimeout(resizeTimer)
  window.removeEventListener('resize', scheduleRegenerate)
})

function scheduleRegenerate() {
  if (resizeTimer)
    clearTimeout(resizeTimer)
  resizeTimer = setTimeout(regenerateFlower, 150)
}

async function regenerateFlower() {
  const { width, height } = getViewportSize()
  const seed = themeConfig.value?.hero?.mobileFlower?.seed ?? getSessionSeed()
  const type = resolveFlowerType(flowerType.value as 'woody' | 'herbal' | 'random' | 'season')
  const cachedFlower = getCachedMobileFlower()
  if (cachedFlower
    && cachedFlower.width === width
    && cachedFlower.height === height
    && cachedFlower.seed === seed
    && cachedFlower.type === type) {
    currentFlowerCanvas = cachedFlower.canvas
    drawCurrentFlower()
    return
  }

  try {
    const scene = await scheduleShuimoTask(() => buildMobileFlower(width, height, seed, type))
    if (disposed)
      return
    currentFlowerCanvas = scene.canvas
    setCachedMobileFlower({ canvas: scene.canvas, seed, type, width: scene.width, height: scene.height })
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
  const source = currentFlowerCanvas
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
.shuimo-mobile-flower {
  position: absolute;
  inset: 0;
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
