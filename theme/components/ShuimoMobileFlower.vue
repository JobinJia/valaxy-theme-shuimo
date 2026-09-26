<script setup lang="ts">
import type { FlowerSource } from '../composables/useMobileFlower'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
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
// 每次生成递增；await 回来发现不是最新一次就丢弃，避免旧尺寸的花晚到后覆盖新花
let generation = 0
// 上一次触发生成时的视口宽度。只有宽度变化才重画：手机上地址栏收起 / 弹出、
// 软键盘开合只改高度，每帧都会触发 resize，逐帧重画会排队好几个秒级任务。
// 高度变化由 canvas 的 object-fit: cover 承接（底部对齐，不拉伸）。
let lastWidth = -1
/** 花第一次画上去之后才显示（淡入），避免幕布先开时花"啪"一下冒出来 */
const drawn = ref(false)

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

  window.addEventListener('resize', onResize)
  regenerateFlower()
})

onUnmounted(() => {
  disposed = true
  regen.cancel()
  window.removeEventListener('resize', onResize)
})

function onResize() {
  if (Math.round(window.innerWidth) !== lastWidth)
    regen.schedule()
}

// 高度差在这个比例以内时复用已有的花（cover 裁一点底部以外的区域），
// 超过了（例如横竖屏切换后又切回宽度相同但高度差很多）才重新生成
const HEIGHT_REUSE_RATIO = 0.3

async function regenerateFlower() {
  const { width, height } = getViewportSize()
  lastWidth = width
  const myGeneration = ++generation
  const seed = themeConfig.value?.hero?.mobileFlower?.seed ?? getSessionSeed()
  mobileFlowerSeed.value = seed
  const type = resolveFlowerType(flowerType.value as 'woody' | 'herbal' | 'random' | 'season')
  const cachedFlower = getCachedMobileFlower()
  if (cachedFlower
    && cachedFlower.width === width
    && Math.abs(cachedFlower.height - height) <= cachedFlower.height * HEIGHT_REUSE_RATIO
    && cachedFlower.seed === seed
    && cachedFlower.type === type) {
    currentFlowerSource = cachedFlower.source
    drawCurrentFlower()
    return
  }

  try {
    const scene = await scheduleShuimoTask(() => buildMobileFlower(width, height, seed, type))
    if (disposed || myGeneration !== generation)
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
  drawn.value = true
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
    <canvas ref="flowerCanvas" class="shuimo-mobile-flower__canvas" :class="{ 'is-drawn': drawn }" aria-hidden="true" />
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
  // 视口高度变化（地址栏 / 键盘）不重画，按比例裁切、底部对齐，花不会被拉伸
  object-fit: cover;
  object-position: center bottom;
  opacity: 0;
  transition: opacity 0.6s ease;

  &.is-drawn {
    opacity: 1;
  }
}
</style>

<style>
html.dark .shuimo-mobile-flower__canvas {
  filter: invert(0.88) hue-rotate(180deg);
}
</style>
