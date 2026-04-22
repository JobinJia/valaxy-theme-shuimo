<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, onMounted, ref } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.ttf?url'
import { preheatHeroSceneWorker, preheatXuanPaperWorker, provideBlankSide, setFixedSeed, useThemeConfig, useThemeCssVars } from '../composables'
import { curtainRevealed, openInitialCurtain } from '../composables/useCurtainTransition'

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
const heroLandscapeEnabled = computed(() =>
  props.heroLandscape && themeConfig.value?.decorations?.heroLandscape !== false,
)
const currentSeed = ref(0)
const showSeedControl = computed(() =>
  heroLandscapeEnabled.value && themeConfig.value?.hero?.showSeedControl === true,
)

const fontUrl = computed(() => themeConfig.value?.fonts?.url)
useHead({
  link: computed(() => [
    { rel: 'preload', href: yishanFontUrl, as: 'font', type: 'font/ttf', crossorigin: 'anonymous' },
    ...(fontUrl.value ? [{ rel: 'stylesheet', href: fontUrl.value }] : []),
  ]),
})

function onSeedGenerated(seed: number) {
  currentSeed.value = seed
}

// --- Initial curtain: signal when hero resources are ready ---

let initialCurtainTriggered = false
const heroPaperReady = ref(false)
const landscapeReady = ref(false)
const contentPaperReady = ref(false)

function tryOpenInitialCurtain() {
  if (initialCurtainTriggered)
    return
  if (!heroPaperReady.value || !landscapeReady.value || !contentPaperReady.value)
    return
  initialCurtainTriggered = true
  openInitialCurtain()
}

function onHeroPaperReady() {
  heroPaperReady.value = true
  tryOpenInitialCurtain()
}

function onLandscapeReady() {
  landscapeReady.value = true
  tryOpenInitialCurtain()
}

function onContentPaperReady() {
  contentPaperReady.value = true
  tryOpenInitialCurtain()
}

setTimeout(() => {
  if (!initialCurtainTriggered) {
    initialCurtainTriggered = true
    openInitialCurtain()
  }
}, 1000)

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
    <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false" />
    <ShuimoThemeToggle />
    <ShuimoHeroLandscape v-if="heroLandscapeEnabled" @ready="onLandscapeReady" @paper-ready="onHeroPaperReady" @seed-generated="onSeedGenerated" />
    <ShuimoSeedControl v-if="showSeedControl && currentSeed" :seed="currentSeed" />

    <!-- 竖排导航：首页启用，幕布打开后淡入留白区域 -->
    <ShuimoVerticalNav v-if="verticalNav" :revealed="curtainRevealed" />

    <div class="shuimo-app__paper">
      <ShuimoXuanPaper class="shuimo-app__paper-surface" @loaded="onContentPaperReady">
        <!-- 竖排模式下桌面端隐藏 header，移动端仍显示 -->
        <ShuimoHeader :class="{ 'shuimo-header--hidden-desktop': verticalNav }" />

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
  animation: shuimo-fade-in 0.5s ease;

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
}

@keyframes shuimo-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
