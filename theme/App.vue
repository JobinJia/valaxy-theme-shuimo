<script setup lang="ts">
import { useGlobalXuanPaper } from './composables/useGlobalXuanPaper'

const { urlA, urlB, active } = useGlobalXuanPaper()
</script>

<template>
  <div class="shuimo-paper-bg">
    <div
      class="shuimo-paper-bg__layer"
      :class="{ 'shuimo-paper-bg__layer--active': active === 'a' }"
      :style="urlA ? { backgroundImage: `url(${urlA})` } : undefined"
    />
    <div
      class="shuimo-paper-bg__layer"
      :class="{ 'shuimo-paper-bg__layer--active': active === 'b' }"
      :style="urlB ? { backgroundImage: `url(${urlB})` } : undefined"
    />
  </div>
</template>

<style scoped>
.shuimo-paper-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.shuimo-paper-bg__layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.shuimo-paper-bg__layer--active {
  opacity: 1;
}
</style>
