<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { preheatHeroSceneWorker, preheatXuanPaperWorker, provideBlankSide, setFixedSeed, useThemeConfig, useThemeCssVars } from '../composables'
import { curtainRevealed, openInitialCurtain } from '../composables/useCurtainTransition'
import { useGlobalXuanPaper } from '../composables/useGlobalXuanPaper'

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
    ...(fontUrl.value ? [{ rel: 'stylesheet', href: fontUrl.value }] : []),
  ]),
})

function onSeedGenerated(seed: number) {
  currentSeed.value = seed
}

// --- Initial curtain: signal when hero resources are ready ---
//
// The home-page curtain only opens once the visual layers underneath it have
// actually rendered. A pure-CSS auto-open (commit 1babfbd) shipped to prod and
// produced a blank reveal on cold loads — workers need 1–3s to generate xuan
// paper and the hero SVG, but the CSS animation fired at 1.4s regardless.
// Restoring the multi-signal gate plus the safety timer fixes that.

let initialCurtainTriggered = false
const heroPaperReady = ref(false)
const landscapeReady = ref(false)
const contentPaperReady = ref(false)
const { ready: globalPaperReady } = useGlobalXuanPaper()

function tryOpenInitialCurtain() {
  if (initialCurtainTriggered)
    return
  if (!globalPaperReady.value)
    return
  if (heroLandscapeEnabled.value && (!heroPaperReady.value || !landscapeReady.value))
    return
  // verticalNav 模式（首页）不渲染 ShuimoXuanPaper，没有 contentPaperReady 信号
  if (!props.verticalNav && !contentPaperReady.value)
    return
  initialCurtainTriggered = true
  openInitialCurtain()
}

watch(globalPaperReady, (v) => {
  if (v)
    tryOpenInitialCurtain()
})

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

// 兜底：worker 异常 / 网络挂死时也必须开幕，避免幕布永远挡着页面。
// 冷启动强制刷新下宣纸 worker 生成可能需要 1-3s，所以给 6s 的宽裕窗口，
// 让 globalPaperReady 有充分时间点亮再触发。正常路径都走 gate，不走这里。
setTimeout(() => {
  if (!initialCurtainTriggered) {
    initialCurtainTriggered = true
    openInitialCurtain()
  }
}, 6000)

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
      <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false" />
    </ClientOnly>
    <ShuimoThemeToggle />
    <ShuimoHeroLandscape
      v-if="heroLandscapeEnabled"
      @ready="onLandscapeReady"
      @paper-ready="onHeroPaperReady"
      @seed-generated="onSeedGenerated"
    />
    <ShuimoSeedControl v-if="showSeedControl && currentSeed" :seed="currentSeed" />

    <!-- 竖排导航：首页启用，幕布打开后淡入留白区域 -->
    <ShuimoVerticalNav v-if="verticalNav" :revealed="curtainRevealed" />

    <div v-if="!verticalNav" class="shuimo-app__paper">
      <ShuimoXuanPaper class="shuimo-app__paper-surface" @loaded="onContentPaperReady">
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
</style>
