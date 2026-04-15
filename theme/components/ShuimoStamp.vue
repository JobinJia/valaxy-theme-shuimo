<script setup lang="ts">
import { onMounted, ref } from 'vue'

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

const stampSvg = ref<string | null>(null)
const hasShuimoCore = ref(false)

onMounted(async () => {
  try {
    const { generateStampAsync } = await import('@jobinjia/shuimo-core/drawing')
    hasShuimoCore.value = true

    await document.fonts.ready

    const textArray = Array.isArray(props.text)
      ? props.text
      : props.text.includes(',') || props.text.includes('，')
        ? props.text.split(/[,，]/).map(s => s.trim())
        : [props.text]
    const result = await generateStampAsync({
      text: textArray,
      type: props.type,
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
})
</script>

<template>
  <div
    class="shuimo-stamp"
    :class="[`shuimo-stamp--${type}`]"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <div
      v-if="stampSvg"
      class="shuimo-stamp__svg"
      v-html="stampSvg"
    />
    <div
      v-else
      class="shuimo-stamp__fallback"
    >
      {{ text.slice(0, 2) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-stamp {
  display: inline-block;
  // 暗色模式切换时平滑过渡
  transition: filter 0.5s ease;

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
    font-size: calc(v-bind(size) * 0.4px);
  }

  // 阴章 fallback：红底白字
  &--yin .shuimo-stamp__fallback {
    background: var(--sm-stamp);
    color: var(--sm-paper);
  }

  // 阳章 fallback：白底红字+红边框
  &--yang .shuimo-stamp__fallback {
    background: transparent;
    color: var(--sm-stamp);
    border: 2px solid var(--sm-stamp);
  }
}
</style>

