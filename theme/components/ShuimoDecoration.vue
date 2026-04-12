<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeConfig } from '../composables/config'
import { generateCached } from '../composables/useShuimoCache'
import { scheduleShuimoTask } from '../composables/useShuimoScheduler'
import { getSeasonFlora, useComponentSeed } from '../composables/useShuimoSeed'

export type DecorationType = 'bamboo' | 'orchid' | 'plum' | 'chrysanthemum' | 'mountain' | 'water' | 'tree' | 'rock' | 'season'
export type DecorationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const props = withDefaults(defineProps<{
  type?: DecorationType
  position?: DecorationPosition
  size?: 'sm' | 'md' | 'lg'
  opacity?: number
  name?: string
}>(), {
  type: 'season',
  position: 'bottom-right',
  size: 'sm',
  opacity: 0.12,
  name: 'decoration',
})

const themeConfig = useThemeConfig()
const svgContent = ref<string | null>(null)
const loaded = ref(false)
const seed = useComponentSeed(props.name)

// 尺寸映射
const sizeMap = {
  sm: { w: 150, h: 200 },
  md: { w: 250, h: 300 },
  lg: { w: 400, h: 450 },
}

const dimensions = sizeMap[props.size]

// 解析实际的装饰类型（season 会根据季节自动选择）
function resolveType(): Exclude<DecorationType, 'season'> {
  if (props.type === 'season')
    return getSeasonFlora()
  return props.type
}

onMounted(async () => {
  // 检查配置开关
  const cfg = themeConfig.value
  if (cfg?.decorations?.enable === false)
    return

  const actualType = resolveType()
  const cacheKey = `decoration-${actualType}-${props.size}-${seed.value}`

  try {
    const svg = await scheduleShuimoTask(() => generateCached(cacheKey, async () => {
      const elements = await import('@jobinjia/shuimo-core/elements')
      const cx = dimensions.w / 2
      const cy = dimensions.h / 2
      const s = seed.value

      switch (actualType) {
        case 'bamboo':
          return elements.Bamboo.generate(cx, dimensions.h, s, { hei: dimensions.h * 0.8, stalks: props.size === 'sm' ? 2 : 3, leaves: true, leafDensity: 0.6 })
        case 'orchid':
          return elements.Orchid.generate(cx, cy, s, { leafCount: 4, hasFlower: true, flowerCount: 2 })
        case 'plum':
          return elements.WinterPlum.generate(cx * 0.3, cy, s, { hei: dimensions.h * 0.6, branches: 2, flowerDensity: 0.5, flowerColor: '#C8102E' })
        case 'chrysanthemum':
          return elements.Chrysanthemum.generate(cx, cy, s, { size: dimensions.w * 0.25, withStem: true, withLeaves: true })
        case 'water':
          return elements.Water.generate(0, cy, s, { len: dimensions.w, hei: 20 })
        case 'tree':
          return elements.Tree.tree05(cx, dimensions.h * 0.9, { hei: dimensions.h * 0.7 })
        case 'rock':
          return elements.Mount.rock(cx, dimensions.h * 0.7, s, { hei: dimensions.h * 0.3 })
        case 'mountain':
        default:
          return ''
      }
    }))

    if (svg) {
      svgContent.value = svg
      loaded.value = true
    }
  }
  catch {
    loaded.value = false
  }
})
</script>

<template>
  <div
    v-if="loaded && svgContent"
    class="shuimo-decoration"
    :class="[`shuimo-decoration--${position}`]"
    :style="{ opacity }"
  >
    <svg
      :width="dimensions.w"
      :height="dimensions.h"
      :viewBox="`0 0 ${dimensions.w} ${dimensions.h}`"
      class="shuimo-decoration__svg"
      aria-hidden="true"
      v-html="svgContent"
    />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-decoration {
  position: absolute;
  pointer-events: none;
  z-index: 0;

  &__svg {
    display: block;
  }

  &--top-left {
    top: 0;
    left: 0;
  }

  &--top-right {
    top: 0;
    right: 0;
  }

  &--bottom-left {
    bottom: 0;
    left: 0;
  }

  &--bottom-right {
    bottom: 0;
    right: 0;
  }
}
</style>
