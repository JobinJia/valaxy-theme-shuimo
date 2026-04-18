<script setup lang="ts">
import { useValaxyDark } from 'valaxy'
import { computed } from 'vue'
import { useThemeConfig } from '../composables'

const { isDark, toggleDark } = useValaxyDark()
const themeConfig = useThemeConfig()
const titleFont = computed(() => themeConfig.value?.fonts?.title || 'YiShanBeiZhuan, serif')
</script>

<template>
  <button
    class="shuimo-theme-toggle"
    :title="isDark ? '切换亮色' : '切换暗色'"
    @click="toggleDark()"
  >
    <ShuimoStamp
      :text="isDark ? '月映' : '日照'"
      :type="isDark ? 'yin' : 'yang'"
      shape="rectangle"
      color="#8B2500"
      :font-family="titleFont"
      :size="80"
    />
  </button>
</template>

<style lang="scss" scoped>
.shuimo-theme-toggle {
  position: fixed;
  top: 10px;
  right: 8px;
  z-index: 100;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  transform: scale(0.5);
  transform-origin: top right;
  opacity: 0.65;

  &:hover {
    opacity: 0.9;
  }
}

@media (max-width: 767px) {
  .shuimo-theme-toggle {
    top: 6px;
    right: 6px;
    transform: scale(0.38);
  }
}
</style>
