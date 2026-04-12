<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeConfig } from '../composables/config'
import { generateCached } from '../composables/useShuimoCache'

const props = withDefaults(defineProps<{
  variant?: 'processed' | 'aged' | 'gold'
  width?: number
  height?: number
  seed?: number
}>(), {
  variant: 'processed',
  width: 256,
  height: 256,
  seed: 42,
})

const themeConfig = useThemeConfig()
const paperUrl = ref<string | null>(null)
const loaded = ref(false)

const colorPresets: Record<string, [number, number, number]> = {
  processed: [252, 248, 230],
  aged: [235, 220, 190],
  gold: [250, 245, 225],
}

onMounted(async () => {
  const cfg = themeConfig.value
  if (cfg?.xuanPaper?.enable === false)
    return

  const variant = cfg?.xuanPaper?.variant || props.variant
  const cacheKey = `xuan-paper-${variant}-${props.width}-${props.height}-${props.seed}`

  try {
    const url = await generateCached(cacheKey, async () => {
      const { XuanPaper } = await import('@jobinjia/shuimo-core/elements')

      const options: Record<string, any> = {
        width: props.width,
        height: props.height,
        baseColor: colorPresets[variant] || colorPresets.processed,
        fiberDensity: 0.8,
        textureIntensity: 0.3,
        grainDensity: 0.4,
        seed: props.seed,
      }

      if (variant === 'aged')
        options.age = 0.4

      if (variant === 'gold') {
        options.goldFlecks = true
        options.goldDensity = 0.3
      }

      return XuanPaper.generateDataURL(options)
    })

    paperUrl.value = url
    loaded.value = true
  }
  catch {
    loaded.value = false
  }
})
</script>

<template>
  <div
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
    background-size: 512px 512px;
    background-repeat: repeat;
  }
}
</style>
