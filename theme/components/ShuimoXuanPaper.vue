<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeConfig } from '../composables/config'
import { generateXuanPaperTexture } from '../composables/useXuanPaperTexture'

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

onMounted(async () => {
  const cfg = themeConfig.value
  if (cfg?.xuanPaper?.enable === false)
    return

  try {
    const url = await generateXuanPaperTexture({
      variant: cfg?.xuanPaper?.variant || props.variant,
      width: props.width,
      height: props.height,
      seed: props.seed,
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
