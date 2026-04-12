<script setup lang="ts">
import { ref } from 'vue'

const revealed = ref(false)

function onLandscapeReady() {
  requestAnimationFrame(() => {
    revealed.value = true
  })
}
</script>

<template>
  <div class="shuimo-app">
    <ShuimoHeroLandscape @ready="onLandscapeReady" />

    <div class="shuimo-app__paper">
      <ShuimoHeader />

      <slot name="main">
        <router-view />
      </slot>

      <ShuimoHelper />
      <ShuimoFooter />
    </div>

    <!-- 开屏幕布：z-index 最高，盖住所有内容，从中间向两侧滑走 -->
    <div class="shuimo-curtain shuimo-curtain--left" :class="{ revealed }" />
    <div class="shuimo-curtain shuimo-curtain--right" :class="{ revealed }" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-app {
  min-height: 100vh;
  position: relative;

  &__paper {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: rgba(245, 240, 230, 0.55);
  }
}

.shuimo-curtain {
  position: fixed;
  top: 0;
  width: 50%;
  height: 100%;
  background: rgb(245, 232, 207);
  z-index: 9999;
  pointer-events: none;
  will-change: transform;
  transition: transform 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &--left {
    left: 0;
  }

  &--right {
    right: 0;
  }

  &.revealed {
    &.shuimo-curtain--left {
      transform: translateX(-100%);
    }

    &.shuimo-curtain--right {
      transform: translateX(100%);
    }
  }
}
</style>
