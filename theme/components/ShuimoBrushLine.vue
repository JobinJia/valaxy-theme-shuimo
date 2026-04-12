<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeConfig } from '../composables/config'
import { generateCached } from '../composables/useShuimoCache'
import { scheduleShuimoTask } from '../composables/useShuimoScheduler'

const props = withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  length?: number
  width?: number
  color?: string
  variant?: 'brush' | 'ink' | 'light'
  seed?: number
}>(), {
  direction: 'horizontal',
  length: 200,
  width: 3,
  color: 'rgba(42, 37, 32, 0.5)',
  variant: 'brush',
  seed: 0,
})

const themeConfig = useThemeConfig()
const svgContent = ref<string | null>(null)
const loaded = ref(false)

// SVG 尺寸：水平线宽=length 高=width*4；竖线反过来
const svgWidth = props.direction === 'horizontal' ? props.length : props.width * 4
const svgHeight = props.direction === 'horizontal' ? props.width * 4 : props.length

onMounted(async () => {
  if (themeConfig.value?.brushStrokes?.enable === false)
    return

  const cacheKey = `brush-line-${props.variant}-${props.direction}-${props.length}-${props.width}-${props.seed}`

  try {
    const svg = await scheduleShuimoTask(() => generateCached(cacheKey, async () => {
      const { stroke, naturalBrushStroke } = await import('@jobinjia/shuimo-core/drawing')

      const margin = props.width * 2
      let points: [number, number][]

      if (props.direction === 'horizontal')
        points = [[margin, svgHeight / 2], [svgWidth - margin, svgHeight / 2]]
      else
        points = [[svgWidth / 2, margin], [svgWidth / 2, svgHeight - margin]]

      if (props.variant === 'brush') {
        return naturalBrushStroke(points, {
          width: props.width,
          color: props.color,
          pressure: (t: number) => Math.sin(t * Math.PI),
        })
      }
      else if (props.variant === 'ink') {
        return stroke(points, { wid: props.width, col: props.color, noi: 0.3 })
      }
      else {
        return stroke(points, { wid: 1, col: props.color, noi: 0.1 })
      }
    }))

    svgContent.value = svg
    loaded.value = true
  }
  catch {
    // shuimo-core 不可用，使用 CSS fallback
    loaded.value = false
  }
})
</script>

<template>
  <div
    class="shuimo-brush-line"
    :class="[
      `shuimo-brush-line--${direction}`,
      `shuimo-brush-line--${variant}`,
      { 'shuimo-brush-line--loaded': loaded },
    ]"
  >
    <!-- shuimo-core 生成的笔触 -->
    <svg
      v-if="svgContent"
      :width="svgWidth"
      :height="svgHeight"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      class="shuimo-brush-line__svg"
      v-html="svgContent"
    />
    <!-- CSS Fallback -->
    <div v-else class="shuimo-brush-line__fallback" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-brush-line {
  display: flex;
  align-items: center;
  justify-content: center;

  &__svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  // CSS Fallback 样式
  &--horizontal &__fallback {
    width: 100%;
    height: 3px;
  }

  &--vertical &__fallback {
    height: 100%;
    width: 2px;
  }

  // brush 变体 fallback
  &--brush &__fallback {
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--sm-ink-dark) 8%,
      var(--sm-ink-dark) 45%,
      var(--sm-ink-medium) 65%,
      transparent 92%
    );
    border-radius: 50%;
    opacity: 0.5;
  }

  // ink 变体 fallback
  &--ink &__fallback {
    background: linear-gradient(
      90deg,
      var(--sm-ink-medium),
      transparent
    );
    border-radius: 1px;
  }

  // light 变体 fallback
  &--light &__fallback {
    opacity: 0.25;
  }

  &--light#{&}--horizontal &__fallback {
    background: linear-gradient(
      90deg,
      transparent,
      var(--sm-ink-medium) 15%,
      var(--sm-ink-medium) 85%,
      transparent
    );
  }

  &--light#{&}--vertical &__fallback {
    background: linear-gradient(
      180deg,
      transparent,
      var(--sm-ink-medium) 15%,
      var(--sm-ink-medium) 85%,
      transparent
    );
  }
}
</style>
