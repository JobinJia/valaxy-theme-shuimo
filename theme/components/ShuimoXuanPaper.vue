<script setup lang="ts">
import { useValaxyDark } from 'valaxy'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useThemeConfig } from '../composables/config'
import { generateXuanPaperTexture } from '../composables/useXuanPaperTexture'

const props = withDefaults(defineProps<{
  variant?: 'processed' | 'aged' | 'gold'
  seed?: number
}>(), {
  variant: 'processed',
  seed: 42,
})

const emit = defineEmits<{
  loaded: []
}>()

const themeConfig = useThemeConfig()
const { isDark } = useValaxyDark()
const rootEl = ref<HTMLElement | null>(null)
const paperUrl = ref<string | null>(null)
const loaded = ref(false)

// 按元素实际尺寸生成一张覆盖全部内容的宣纸，不平铺
// 用 50px 分桶避免内容微调导致的频繁重绘
let lastBucketW = 0
let lastBucketH = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null

async function regenerate() {
  const el = rootEl.value
  if (!el)
    return
  const cfg = themeConfig.value
  if (cfg?.xuanPaper?.enable === false)
    return

  const bucketW = Math.max(320, Math.ceil(el.offsetWidth / 50) * 50)
  const bucketH = Math.max(320, Math.ceil(el.offsetHeight / 50) * 50)
  if (bucketW === lastBucketW && bucketH === lastBucketH && paperUrl.value)
    return
  lastBucketW = bucketW
  lastBucketH = bucketH

  try {
    const url = await generateXuanPaperTexture({
      variant: cfg?.xuanPaper?.variant || props.variant,
      width: bucketW,
      height: bucketH,
      seed: props.seed,
      isDark: isDark.value,
      goldDensity: cfg?.xuanPaper?.goldDensity,
    })
    const wasFirst = !paperUrl.value
    paperUrl.value = url
    loaded.value = true
    if (wasFirst)
      emit('loaded')
  }
  catch {
    loaded.value = false
  }
}

function schedule() {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = setTimeout(regenerate, 200)
}

watch(isDark, () => {
  // 暗色切换时强制重绘（尺寸未变但变体不同）
  lastBucketW = 0
  lastBucketH = 0
  schedule()
})

onMounted(() => {
  schedule()
  if (rootEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(rootEl.value)
  }
})

onUnmounted(() => {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="rootEl"
    class="shuimo-xuan-paper"
    :class="{ 'shuimo-xuan-paper--loaded': loaded }"
    :style="paperUrl ? { backgroundImage: `url(${paperUrl})` } : undefined"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-xuan-paper {
  // 不设 background-color，由父组件（Layout）控制底色透明度
  // 这里只叠加纤维纹理
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(180, 170, 150, 0.04) 3px,
      rgba(180, 170, 150, 0.04) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 5px,
      rgba(170, 160, 140, 0.03) 5px,
      rgba(170, 160, 140, 0.03) 6px
    );

  &--loaded {
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
}
</style>
