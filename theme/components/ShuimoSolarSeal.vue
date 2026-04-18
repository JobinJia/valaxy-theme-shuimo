<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables'
import { getSolarTerm, getTimeOfDay } from '../composables/useSolarTerm'

const themeConfig = useThemeConfig()
const titleFont = computed(() => themeConfig.value?.fonts?.title || 'YiShanBeiZhuan, serif')
const term = getSolarTerm()
const time = getTimeOfDay()
</script>

<template>
  <div class="shuimo-solar-seal" :title="`${term.name} · ${time.shichen}时`">
    <ShuimoStamp
      :text="term.name"
      type="yang"
      shape="ellipse"
      color="#8B2500"
      :font-family="titleFont"
      :size="80"
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
