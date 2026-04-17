<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { provideBlankSide, useThemeConfig, useThemeCssVars } from '../composables'

defineProps<{
  verticalNav?: boolean
}>()

const themeConfig = useThemeConfig()
const themeCssVars = useThemeCssVars()
const { blankSide } = provideBlankSide()
const heroLandscapeEnabled = computed(() => themeConfig.value?.decorations?.heroLandscape !== false)
const revealed = ref(!heroLandscapeEnabled.value)
const route = useRoute()

// 加载外部字体
const fontUrl = computed(() => themeConfig.value?.fonts?.url)
useHead({
  link: computed(() => fontUrl.value ? [{ rel: 'stylesheet', href: fontUrl.value }] : []),
})

function onLandscapeReady() {
  requestAnimationFrame(() => {
    revealed.value = true
  })
}

watch(heroLandscapeEnabled, (enabled) => {
  if (!enabled)
    revealed.value = true
})

// 路由切换时重新播放幕布动画：先合拢，再展开
watch(() => route.path, () => {
  if (!heroLandscapeEnabled.value) {
    revealed.value = true
    return
  }
  revealed.value = false
  // 等幕布合拢完成（0.5s）后再展开
  setTimeout(() => {
    revealed.value = true
  }, 550)
})
</script>

<template>
  <div class="shuimo-app" :class="[`blank-${blankSide}`, { 'has-vertical-nav': verticalNav }]" :style="themeCssVars">
    <ShuimoThemeToggle />
    <ShuimoHeroLandscape v-if="heroLandscapeEnabled" @ready="onLandscapeReady" />

    <!-- 竖排导航：首页启用，幕布打开后淡入留白区域 -->
    <ShuimoVerticalNav v-if="verticalNav" :revealed="revealed" />

    <div class="shuimo-app__paper">
      <ShuimoXuanPaper class="shuimo-app__paper-surface">
        <!-- 竖排模式下桌面端隐藏 header，移动端仍显示 -->
        <ShuimoHeader :class="{ 'shuimo-header--hidden-desktop': verticalNav }" />

        <slot>
          <router-view />
        </slot>

        <ShuimoHelper />
      </ShuimoXuanPaper>
    </div>

    <!-- Footer 独立于 paper，始终全宽居中贴底 -->
    <footer class="shuimo-app__footer">
      <ShuimoFooter />
    </footer>

    <!-- 开屏幕布 -->
    <div v-if="heroLandscapeEnabled" class="shuimo-curtain shuimo-curtain--left" :class="{ revealed }" />
    <div v-if="heroLandscapeEnabled" class="shuimo-curtain shuimo-curtain--right" :class="{ revealed }" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;

  &__paper {
    position: relative;
    z-index: 1;
    flex: 1;
    background-color: var(--sm-paper-overlay);
  }

  &__paper-surface {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__footer {
    position: relative;
    z-index: 1;
    width: 100%;
    text-align: center;
    margin-top: auto;
  }

  // 竖排模式下，隐藏内容区，所有内容在竖排导航里
  &.has-vertical-nav .shuimo-app__paper {
    display: none;
  }
}

.shuimo-curtain {
  position: fixed;
  top: 0;
  width: 50%;
  height: 100%;
  background: var(--sm-paper);
  z-index: 9999;
  pointer-events: none;
  will-change: transform;
  // 关闭（合拢）快，打开（展开）慢
  transition: transform 0.5s ease-in;

  &--left {
    left: 0;
  }

  &--right {
    right: 0;
  }

  &.revealed {
    // 展开用慢速优雅过渡
    transition: transform 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &.shuimo-curtain--left {
      transform: translateX(-100%);
    }

    &.shuimo-curtain--right {
      transform: translateX(100%);
    }
  }
}

// 桌面端竖排模式隐藏水平 header
.shuimo-header--hidden-desktop {
  display: none;
}

// 移动端
@media (max-width: 767px) {
  // 首页：竖排导航改为流式展示，隐藏横排 header
  .shuimo-header--hidden-desktop {
    display: none;
  }

  // 移动端首页：隐藏 paper 层，只保留竖排导航 + 山水画
  .shuimo-app.has-vertical-nav .shuimo-app__paper {
    display: none;
  }

  // 移动端不需要幕布蒙层
  .shuimo-curtain {
    display: none;
  }
}
</style>
