<script setup lang="ts">
/**
 * ShuimoCurtainStampSlot — 幕布印章共享渲染挂载点。
 *
 * 接收 useCurtainStamp 算好的 raw SVG，本地仅做 ID 重命名（防 SVG <defs>
 * 在 DOM 里重复）。当 generateStampAsync 失败时显示 CSS fallback。
 *
 * 不重复生成 stamp —— 同一个 raw SVG 被左右（或上下）两个 slot 共用。
 */
import { computed } from 'vue'

const props = defineProps<{
  svg: string | null
  uid: string
  size: number
  failed: boolean
  fallbackText: string
  fallbackType: 'yin' | 'yang'
}>()

const renderedHtml = computed(() => {
  if (!props.svg)
    return null
  // 来源若是 <img src="data:..."> 则不需要 ID 替换（toDataURL 路径）
  if (!props.svg.startsWith('<svg'))
    return props.svg
  return props.svg
    .replace(/stamp-ink-texture/g, `stamp-ink-texture-${props.uid}`)
    .replace(/stamp-border-texture/g, `stamp-border-texture-${props.uid}`)
    .replace(/stamp-text-texture/g, `stamp-text-texture-${props.uid}`)
})
</script>

<template>
  <div
    v-if="renderedHtml"
    class="shuimo-stamp"
    v-html="renderedHtml"
  />
  <div
    v-else-if="failed"
    class="shuimo-stamp-fallback"
    :class="[`shuimo-stamp-fallback--${fallbackType}`]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.4}px` }"
  >
    {{ fallbackText.slice(0, 2) }}
  </div>
</template>

<style lang="scss" scoped>
.shuimo-stamp {
  --shuimo-stamp-size: v-bind(`${size}px`);
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    max-width: var(--shuimo-stamp-size);
    max-height: var(--shuimo-stamp-size);
    width: auto;
    height: auto;
  }
}

.shuimo-stamp-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--va-font-family-base);
  font-weight: bold;
  border-radius: 3px;
  transform: rotate(-3deg);
  line-height: 1.2;

  &--yin {
    background: var(--sm-stamp);
    color: var(--sm-paper);
  }

  &--yang {
    background: transparent;
    color: var(--sm-stamp);
    border: 2px solid var(--sm-stamp);
  }
}
</style>
