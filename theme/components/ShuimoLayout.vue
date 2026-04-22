<script setup lang="ts">
import type { ThemeModeColor } from '../types'
import { useHead } from '@unhead/vue'
import { useValaxyDark } from 'valaxy'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.ttf?url'
import { generateXuanPaperTexture, preheatHeroSceneWorker, preheatXuanPaperWorker, provideBlankSide, setFixedSeed, useThemeConfig, useThemeCssVars } from '../composables'

const props = withDefaults(defineProps<{
  verticalNav?: boolean
  heroLandscape?: boolean
}>(), {
  verticalNav: false,
  heroLandscape: false,
})

// 会话级开关：幕布只在会话内首次进入 hero 页面时播一次
// 同一次浏览里后续路由切换保持展开，不再重播，避免打断阅读节奏
let curtainPlayedInSession = false

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined')
    return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function resolveModeColor(value: ThemeModeColor | undefined, dark: boolean): string | undefined {
  if (!value)
    return undefined
  if (typeof value === 'string')
    return value
  return dark ? value.dark : value.light
}

const themeConfig = useThemeConfig()
const themeCssVars = useThemeCssVars()
const { isDark } = useValaxyDark()
const { blankSide } = provideBlankSide()
const heroLandscapeEnabled = computed(() =>
  props.heroLandscape && themeConfig.value?.decorations?.heroLandscape !== false,
)
const curtainStampConfig = computed(() => themeConfig.value?.stamp?.curtain || {})
const curtainStampText = computed(() => curtainStampConfig.value.author || '墨')
const curtainStampType = computed(() => curtainStampConfig.value.type || 'yin')
const curtainStampShape = computed(() => curtainStampConfig.value.shape || 'auto')
const curtainStampFont = computed(() =>
  curtainStampConfig.value.fontFamily
  || themeConfig.value?.fonts?.title
  || 'YiShanBeiZhuan, serif',
)
const curtainStampFontFamily = computed(() => {
  const primaryFont = curtainStampFont.value.split(',')[0]?.trim()
  return primaryFont?.replace(/^['"]|['"]$/g, '') || 'YiShanBeiZhuan'
})
const curtainStampSize = computed(() => {
  const userSize = curtainStampConfig.value.size
  if (typeof userSize === 'number' && userSize > 0)
    return userSize
  // 容器只显示一半印章，需足够大让多列文字也能看全
  const columns = curtainStampText.value.split(/[,，]/).filter(Boolean).length || 1
  if (columns >= 3)
    return 240
  if (columns === 2)
    return 180
  return 140
})
const curtainStampProps = computed(() => ({
  ...curtainStampConfig.value,
  text: curtainStampText.value,
  type: curtainStampType.value,
  shape: curtainStampShape.value,
  fontFamily: curtainStampFont.value,
  size: curtainStampSize.value,
}))
const currentSeed = ref(0)
const showSeedControl = computed(() =>
  heroLandscapeEnabled.value && themeConfig.value?.hero?.showSeedControl === true,
)
const curtainPaperUrl = ref<string | null>(null)
// 幕布两半共享一张"完整"视口宽的纸：左半 background-position: left 显示左半，
// 右半 position: right 显示右半，合起来就是一张被沿中线剖开的连续宣纸
function makeCurtainStyle(side: 'left' | 'right') {
  return computed(() => {
    const userColor = resolveModeColor(themeConfig.value?.decorations?.curtainColor, isDark.value)
    return {
      backgroundColor: userColor || 'var(--sm-curtain-bg)',
      backgroundImage: curtainPaperUrl.value ? `url(${curtainPaperUrl.value})` : undefined,
      backgroundRepeat: curtainPaperUrl.value ? 'no-repeat' : undefined,
      backgroundSize: curtainPaperUrl.value ? '200% 100%' : undefined,
      backgroundPosition: curtainPaperUrl.value ? `${side} center` : undefined,
    }
  })
}
const curtainLeftStyle = makeCurtainStyle('left')
const curtainRightStyle = makeCurtainStyle('right')
const revealed = ref(
  !heroLandscapeEnabled.value
  || curtainPlayedInSession
  || prefersReducedMotion(),
)
const curtainStampReady = ref(false)
const route = useRoute()

// 加载外部字体
const fontUrl = computed(() => themeConfig.value?.fonts?.url)
useHead({
  link: computed(() => [
    { rel: 'preload', href: yishanFontUrl, as: 'font', type: 'font/ttf', crossorigin: 'anonymous' },
    ...(fontUrl.value ? [{ rel: 'stylesheet', href: fontUrl.value }] : []),
  ]),
})

async function ensureCurtainStampFontReady() {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    curtainStampReady.value = true
    return
  }

  const loadPromise = document.fonts.load(`16px "${curtainStampFontFamily.value}"`)
  const timeoutPromise = new Promise<void>(resolve => setTimeout(resolve, 1200))

  try {
    await Promise.race([loadPromise, timeoutPromise])
  }
  finally {
    curtainStampReady.value = true
  }
}

// 幕布按视口尺寸生成；localStorage 缓存由 generateXuanPaperTexture 通用实现
let curtainDebounceTimer: ReturnType<typeof setTimeout> | null = null

async function ensureCurtainPaperReady() {
  const xuanPaper = themeConfig.value?.xuanPaper
  if (xuanPaper?.enable === false)
    return

  // 幕布纸色默认与首页宣纸不同，做出"拉开时有层次"的观感
  const userBase = resolveModeColor(themeConfig.value?.decorations?.curtainPaperColor, isDark.value)
  const baseColor = userBase || (isDark.value ? '#1D2230' : '#E8D7A5')

  // 幕布底色偏金黄，对比度差 → 金屑密度单独放大 3 倍下限 0.2
  const userGold = xuanPaper?.goldDensity
  const curtainGold = typeof userGold === 'number'
    ? Math.max(userGold * 3, 0.2)
    : undefined

  const variant = xuanPaper?.variant || 'processed'
  const width = Math.max(320, Math.ceil(Math.min(window.innerWidth, 1920) / 50) * 50)
  const height = Math.max(320, Math.ceil(Math.min(window.innerHeight, 1080) / 50) * 50)

  try {
    curtainPaperUrl.value = await generateXuanPaperTexture({
      variant,
      width,
      height,
      seed: 42,
      baseColor,
      isDark: isDark.value,
      goldDensity: curtainGold,
    })
  }
  catch {
    curtainPaperUrl.value = null
  }
}

function scheduleCurtainRegen() {
  if (curtainDebounceTimer)
    clearTimeout(curtainDebounceTimer)
  curtainDebounceTimer = setTimeout(ensureCurtainPaperReady, 200)
}

function onSeedGenerated(seed: number) {
  currentSeed.value = seed
}

function openCurtain() {
  if (revealed.value)
    return
  curtainPlayedInSession = true
  revealed.value = true
}

// 幕布打开条件：幕布纸 + 主页宣纸 + 山水 SVG + 主内容宣纸，四者都就绪才开
// 幕后全部准备好再拉开，打开时用户看到的就是"成品"，不需要任何淡入过渡
// 兜底 2.5s 超时，万一哪个环节挂了也保证开幕
let curtainTriggered = false
const heroPaperReady = ref(false)
const landscapeReady = ref(false)
const contentPaperReady = ref(false)

function tryOpenCurtain() {
  if (curtainTriggered)
    return
  if (!curtainPaperUrl.value || !heroPaperReady.value || !landscapeReady.value || !contentPaperReady.value)
    return
  curtainTriggered = true
  openCurtain()
}

function onHeroPaperReady() {
  heroPaperReady.value = true
  tryOpenCurtain()
}

function onLandscapeReady() {
  landscapeReady.value = true
  tryOpenCurtain()
}

function onContentPaperReady() {
  contentPaperReady.value = true
  tryOpenCurtain()
}

// 1s 兜底 —— 任何环节在 1s 内没就绪就强制开幕（dev 下 worker 冷启动慢会触发；prod 下正常都在 500ms 内就绪）
setTimeout(() => {
  if (!curtainTriggered) {
    curtainTriggered = true
    openCurtain()
  }
}, 1000)

watch(() => curtainPaperUrl.value, () => tryOpenCurtain())

onMounted(() => {
  const heroSeed = themeConfig.value?.hero?.seed
  if (typeof heroSeed === 'number')
    setFixedSeed(heroSeed)

  // 空闲时预热 workers，减少首次生成的冷启动延迟
  preheatXuanPaperWorker()
  preheatHeroSceneWorker()

  if (!heroLandscapeEnabled.value)
    return

  ensureCurtainStampFontReady()
  ensureCurtainPaperReady()
  window.addEventListener('resize', scheduleCurtainRegen)
})

onUnmounted(() => {
  if (curtainDebounceTimer)
    clearTimeout(curtainDebounceTimer)
  window.removeEventListener('resize', scheduleCurtainRegen)
})

// 暗色模式切换时同步幕布纸纹：仅在本页启用了幕布时才需要
watch(isDark, () => {
  if (heroLandscapeEnabled.value)
    ensureCurtainPaperReady()
})

watch(heroLandscapeEnabled, (enabled) => {
  if (!enabled)
    revealed.value = true
})

// 路由切换策略：
// - 当前路由无 hero / 本会话已播过一次 / 用户偏好 reduced-motion → 保持展开，不重播
// - 其他情况（会话内首次进入 hero 页面）→ 合拢 0.5s 再展开
watch(() => route.path, () => {
  if (!heroLandscapeEnabled.value || curtainPlayedInSession || prefersReducedMotion()) {
    revealed.value = true
    return
  }
  curtainPlayedInSession = true
  revealed.value = false
  setTimeout(() => {
    revealed.value = true
  }, 550)
})
</script>

<template>
  <div class="shuimo-app" :class="[`blank-${blankSide}`, { 'has-vertical-nav': verticalNav }]" :style="themeCssVars">
    <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false" />
    <ShuimoThemeToggle />
    <ShuimoHeroLandscape v-if="heroLandscapeEnabled" @ready="onLandscapeReady" @paper-ready="onHeroPaperReady" @seed-generated="onSeedGenerated" />
    <ShuimoSeedControl v-if="showSeedControl && currentSeed" :seed="currentSeed" />

    <!-- 竖排导航：首页启用，幕布打开后淡入留白区域 -->
    <ShuimoVerticalNav v-if="verticalNav" :revealed="revealed" />

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

    <!-- 开屏幕布 -->
    <div v-if="heroLandscapeEnabled" class="shuimo-curtain shuimo-curtain--left" :class="{ revealed }" :style="curtainLeftStyle">
      <div v-if="curtainStampReady" class="shuimo-curtain__stamp shuimo-curtain__stamp--left">
        <ShuimoStamp
          v-bind="curtainStampProps"
        />
      </div>
    </div>
    <div v-if="heroLandscapeEnabled" class="shuimo-curtain shuimo-curtain--right" :class="{ revealed }" :style="curtainRightStyle">
      <div v-if="curtainStampReady" class="shuimo-curtain__stamp shuimo-curtain__stamp--right">
        <ShuimoStamp
          v-bind="curtainStampProps"
        />
      </div>
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

.shuimo-curtain {
  position: fixed;
  top: 0;
  width: 50%;
  height: 100%;
  background: var(--sm-paper);
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  will-change: transform;
  // 关闭（合拢）快，打开（展开）慢
  transition: transform 0.5s ease-in;

  &__stamp {
    position: absolute;
    top: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.96;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12));

    // 印章居中对齐在幕布靠中间的边缘，由两片幕布各显示一半拼成完整印章；
    // 使用 translate 百分比让位移自动跟随元素实际尺寸，避免 size 与 SVG 实际宽高不一致时错位
    &--left {
      right: 0;
      transform: translate(50%, -50%);
    }

    &--right {
      left: 0;
      transform: translate(-50%, -50%);
    }
  }

  &--left {
    left: 0;
  }

  &--right {
    right: 0;
  }

  &.revealed {
    // 展开用匀速线性过渡，避免尾部有明显"减速停顿"感
    transition: transform 0.7s linear;

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

@keyframes shuimo-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
