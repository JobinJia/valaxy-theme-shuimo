<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
  type?: 'yin' | 'yang'
  shape?: 'auto' | 'circle' | 'ellipse'
  fontFamily?: string
  size?: number
}>(), {
  text: '墨',
  type: 'yin',
  shape: 'auto',
  fontFamily: 'serif',
  size: 56,
})

const isDark = useDark()
// 暗色模式：阴阳互换
const actualType = computed(() => {
  if (isDark.value)
    return props.type === 'yin' ? 'yang' : 'yin'
  return props.type
})

const stampSvg = ref<string | null>(null)
const hasShuimoCore = ref(false)

async function renderStamp(type: 'yin' | 'yang') {
  try {
    const { generateStampAsync } = await import('@jobinjia/shuimo-core/drawing')
    hasShuimoCore.value = true

    await document.fonts.ready

    // 支持逗号分列：'隔窗,听雨' → ['隔窗', '听雨']
    const textArray = Array.isArray(props.text)
      ? props.text
      : props.text.includes(',') || props.text.includes('，')
        ? props.text.split(/[,，]/).map(s => s.trim())
        : [props.text]
    const result = await generateStampAsync({
      text: textArray,
      type,
      shape: props.shape,
      fontFamily: props.fontFamily,
      width: props.size * 2,
      height: props.size * 2,
    })

    if (typeof result === 'string') {
      stampSvg.value = result
    }
    else if (result?.toDataURL) {
      stampSvg.value = `<img src="${result.toDataURL()}" width="100%" height="100%" />`
    }
  }
  catch {
    hasShuimoCore.value = false
  }
}

onMounted(() => renderStamp(actualType.value))

// 暗色模式切换时重新生成印章
watch(actualType, (newType) => {
  renderStamp(newType)
})
</script>

<template>
  <div
    class="shuimo-stamp"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <!-- shuimo-core 生成的印章：直接注入 SVG 到 DOM，可访问页面字体 -->
    <div
      v-if="stampSvg"
      class="shuimo-stamp__svg"
      v-html="stampSvg"
    />
    <!-- CSS Fallback 印章 -->
    <div
      v-else
      class="shuimo-stamp__fallback"
      :class="[`shuimo-stamp--${actualType}`]"
    >
      {{ text.slice(0, 2) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-stamp {
  display: inline-block;

  &__svg {
    width: 100%;
    height: 100%;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &__fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--va-font-family-base);
    font-weight: bold;
    border-radius: 3px;
    transform: rotate(-3deg);
    line-height: 1.2;
  }

  // 阴章：红底白字
  &--yin {
    background: var(--sm-stamp);
    color: var(--sm-paper);
    font-size: calc(v-bind(size) * 0.4px);
  }

  // 阳章：白底红字+红边框
  &--yang {
    background: transparent;
    color: var(--sm-stamp);
    border: 2px solid var(--sm-stamp);
    font-size: calc(v-bind(size) * 0.4px);
  }
}
</style>
