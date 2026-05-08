<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, onMounted, watch } from 'vue'
import { mobileFlowerSeed, preheatHeroSceneWorker, preheatXuanPaperWorker, provideBlankSide, setFixedSeed, useIsMobile, useThemeConfig, useThemeCssVars } from '../composables'
import { curtainPaperReady, curtainRevealed, curtainStampReady, openInitialCurtain } from '../composables/useCurtainTransition'
import { useGlobalXuanPaper } from '../composables/useGlobalXuanPaper'
import ShuimoMobileInscription from './ShuimoMobileInscription.vue'

const props = withDefaults(defineProps<{
  verticalNav?: boolean
  heroLandscape?: boolean
}>(), {
  verticalNav: false,
  heroLandscape: false,
})

const themeConfig = useThemeConfig()
const themeCssVars = useThemeCssVars()
const { blankSide } = provideBlankSide()
const isMobile = useIsMobile()

const heroLandscapeEnabled = computed(() =>
  props.heroLandscape && themeConfig.value?.decorations?.heroLandscape !== false,
)

const mobileFlowerEnabled = computed(() =>
  themeConfig.value?.hero?.mobileFlower?.enable !== false,
)
const shouldRenderHeroLandscape = computed(() =>
  !isMobile.value && heroLandscapeEnabled.value,
)
const shouldRenderMobileFlower = computed(() =>
  isMobile.value && mobileFlowerEnabled.value,
)
const showSeedControl = computed(() =>
  (shouldRenderHeroLandscape.value || shouldRenderMobileFlower.value) && themeConfig.value?.hero?.showSeedControl === true,
)

const fontUrl = computed(() => themeConfig.value?.fonts?.url)
useHead({
  link: computed(() => [
    ...(fontUrl.value ? [{ rel: 'stylesheet', href: fontUrl.value }] : []),
  ]),
})

function onSeedGenerated(seed: number) {
  mobileFlowerSeed.value = seed
}

// --- Initial curtain ---
//
// 幕布等三条信号都到位才开：
//   1. 页面全局宣纸 (globalPaperReady) — useGlobalXuanPaper 生成
//   2. 印章 (curtainStampReady) — useCurtainStamp 生成
//   3. 幕布自己的宣纸 (curtainPaperReady) — App.vue 单独生成，带 ×3 金屑
// 这样幕布拉开瞬间洒金/纤维/印章一起出现，而不是看到纯纸色后涌现。
// 总等待 ≈ max(三者)。

let initialCurtainTriggered = false
const { ready: globalPaperReady } = useGlobalXuanPaper()

function tryOpenInitialCurtain() {
  if (initialCurtainTriggered)
    return
  if (!globalPaperReady.value)
    return
  if (!curtainStampReady.value)
    return
  if (!curtainPaperReady.value)
    return
  initialCurtainTriggered = true
  openInitialCurtain()
}

watch([globalPaperReady, curtainStampReady, curtainPaperReady], tryOpenInitialCurtain, { immediate: true })

onMounted(() => {
  const heroSeed = themeConfig.value?.hero?.seed
  if (typeof heroSeed === 'number')
    setFixedSeed(heroSeed)

  preheatXuanPaperWorker()
  preheatHeroSceneWorker()
})
</script>

<template>
  <div class="shuimo-app" :class="[`blank-${blankSide}`, { 'has-vertical-nav': verticalNav }]" :style="themeCssVars">
    <ClientOnly>
      <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false && !isMobile" />
    </ClientOnly>
    <ShuimoThemeToggle v-if="!isMobile" />
    <ShuimoHeroLandscape
      v-if="shouldRenderHeroLandscape"
      @seed-generated="onSeedGenerated"
    />
    <ClientOnly>
      <ShuimoMobileInscription
        v-if="isMobile && verticalNav"
      />
    </ClientOnly>
    <ShuimoSeedControl v-if="showSeedControl && mobileFlowerSeed" :seed="mobileFlowerSeed" />

    <!-- 竖排导航：首页启用，幕布打开后淡入留白区域 -->
    <!-- 移动端：主题切换 + 导航标题放在同一 flex 行，space-between 自然对齐 -->
    <div v-if="verticalNav && isMobile" class="shuimo-mobile-header">
      <ShuimoThemeToggle class="shuimo-mobile-header__toggle" />
      <ShuimoVerticalNav :revealed="curtainRevealed" />
    </div>
    <ShuimoVerticalNav v-else-if="verticalNav" :revealed="curtainRevealed" />

    <div v-if="!verticalNav" class="shuimo-app__paper">
      <ShuimoXuanPaper class="shuimo-app__paper-surface">
        <ShuimoHeader />

        <slot>
          <router-view />
        </slot>

        <ShuimoHelper />

        <!-- Footer 在宣纸区域内，保持统一背景 -->
        <footer class="shuimo-app__footer">
          <ShuimoFooter />
        </footer>
      </ShuimoXuanPaper>
    </div>
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
    background-color: transparent;
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

// 桌面端竖排模式隐藏水平 header
.shuimo-header--hidden-desktop {
  display: none;
}

.shuimo-mobile-header {
  display: flex;
  justify-content: space-between;
  padding: 1.5vh 3vw 0;
}

@media (max-width: 767px) {
  // 首页：竖排导航改为流式展示，隐藏横排 header
  .shuimo-header--hidden-desktop {
    display: none;
  }

  // 移动端首页：隐藏 paper 层，只保留竖排导航 + 花卉
  .shuimo-app.has-vertical-nav .shuimo-app__paper {
    display: none;
  }
}
</style>

<style>
/* 移动端首页 header：主题切换回归正常流 + 去除导航自带 padding */
@media (max-width: 767px) {
  .shuimo-mobile-header__toggle.shuimo-theme-toggle {
    position: static;
  }

  .shuimo-mobile-header .shuimo-vnav--title {
    padding-top: 0;
  }

  .shuimo-mobile-header .shuimo-vnav__stamp {
    display: none;
  }
}
</style>
