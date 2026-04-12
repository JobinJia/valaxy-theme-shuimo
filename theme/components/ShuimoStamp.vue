<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
  type?: 'yin' | 'yang'
  size?: number
}>(), {
  text: '墨',
  type: 'yin',
  size: 56,
})

const stampSrc = ref<string | null>(null)
const hasShuimoCore = ref(false)

onMounted(async () => {
  try {
    const { generateStampAsync } = await import('@jobinjia/shuimo-core/drawing')
    hasShuimoCore.value = true

    const canvas = await generateStampAsync({
      text: props.text,
      type: props.type,
      width: props.size * 2,
      height: props.size * 2,
    })

    if (canvas)
      stampSrc.value = canvas.toDataURL()
  }
  catch {
    hasShuimoCore.value = false
  }
})
</script>

<template>
  <div
    class="shuimo-stamp"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <!-- shuimo-core 生成的印章 -->
    <img
      v-if="stampSrc"
      :src="stampSrc"
      :alt="`印章: ${text}`"
      class="shuimo-stamp__img"
    >
    <!-- CSS Fallback 印章 -->
    <div
      v-else
      class="shuimo-stamp__fallback"
      :class="[`shuimo-stamp--${type}`]"
    >
      {{ text.slice(0, 2) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-stamp {
  display: inline-block;

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
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
