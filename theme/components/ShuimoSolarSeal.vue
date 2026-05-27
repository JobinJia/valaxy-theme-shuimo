<script setup lang="ts">
import { computed } from 'vue'
import { resolveStampSize, useThemeConfig } from '../composables'
import { getSolarTerm, getTimeOfDay } from '../composables/useSolarTerm'

const themeConfig = useThemeConfig()
const term = getSolarTerm()
const time = getTimeOfDay()
// 字体走顶层 stamp.* —— 节气印章与主印章是同一作者身份。
const stampFontUrl = computed(() => themeConfig.value?.stamp?.fontUrl)
const stampFontFallbackUrl = computed(() => themeConfig.value?.stamp?.fontFallbackUrl)
const stampHarfbuzzWasmUrl = computed(() => themeConfig.value?.stamp?.harfbuzzSubsetWasmUrl)
// 默认 80；当用户在 stamp.size 配全局值时跟随。
const sealSize = computed(() => resolveStampSize(themeConfig.value?.stamp, 80))
</script>

<template>
  <div class="shuimo-solar-seal" :title="`${term.name} · ${time.shichen}时`">
    <ShuimoStamp
      :text="term.name"
      mode="yang"
      shape="ellipse"
      color="#8B2500"
      :size="sealSize"
      :font-url="stampFontUrl"
      :font-fallback-url="stampFontFallbackUrl"
      :harfbuzz-subset-wasm-url="stampHarfbuzzWasmUrl"
    />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-solar-seal {
  position: fixed;
  top: 10px;
  right: 56px;
  z-index: 3;
  opacity: 0.65;
  transition: opacity 0.3s;
  cursor: default;
  pointer-events: auto;
  transform: scale(0.5);
  transform-origin: top right;

  &:hover {
    opacity: 0.9;
  }
}

@media (max-width: 767px) {
  .shuimo-solar-seal {
    top: 6px;
    right: 46px;

    :deep(.shuimo-stamp) {
      transform: scale(0.4);
      transform-origin: top right;
    }
  }
}
</style>
