<script setup lang="ts">
import { useValaxyDark } from 'valaxy'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '../composables'

const { isDark, toggleDark } = useValaxyDark()
const { t } = useI18n()
const isMobile = useIsMobile()
const toggleSize = computed(() => isMobile.value ? 32 : 48)
const toggleStyle = computed(() => ({
  width: `${toggleSize.value}px`,
  height: `${toggleSize.value}px`,
}))
</script>

<template>
  <button
    type="button"
    class="shuimo-theme-toggle"
    :title="t(isDark ? 'shuimo.theme.toggle_to_light' : 'shuimo.theme.toggle_to_dark')"
    :aria-label="t(isDark ? 'shuimo.theme.toggle_to_light' : 'shuimo.theme.toggle_to_dark')"
    :style="toggleStyle"
    @click="toggleDark()"
  >
    <span class="shuimo-theme-toggle__stamp" :style="toggleStyle">
      <ShuimoStamp
        :text="isDark ? '月映' : '日照'"
        :mode="isDark ? 'yin' : 'yang'"
        shape="rect"
        color="#8B2500"
        :size="toggleSize"
      />
    </span>
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
  opacity: 0.65;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.9;
  }

  &__stamp {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
}

@media (max-width: 767px) {
  .shuimo-theme-toggle {
    top: 6px;
    right: 6px;
  }
}
</style>
