<script setup lang="ts">
import type { ThemeModeColor } from '../types'
import { useHead } from '@unhead/vue'
import { useValaxyDark } from 'valaxy'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.ttf?url'
import { generateXuanPaperTexture, provideBlankSide, useThemeConfig, useThemeCssVars } from '../composables'

const props = withDefaults(defineProps<{
  verticalNav?: boolean
  heroLandscape?: boolean
}>(), {
  verticalNav: false,
  heroLandscape: false,
})

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
const curtainStampText = computed(() => themeConfig.value?.stamp?.author || '墨')
const curtainStampType = computed(() => themeConfig.value?.stamp?.type || 'yin')
const curtainStampShape = computed(() => themeConfig.value?.stamp?.shape || 'auto')
const curtainStampFont = computed(() => themeConfig.value?.fonts?.title || 'YiShanBeiZhuan, serif')
const curtainStampFontFamily = computed(() => {
  const primaryFont = curtainStampFont.value.split(',')[0]?.trim()
  return primaryFont?.replace(/^['"]|['"]$/g, '') || 'YiShanBeiZhuan'
})
const curtainStampSize = computed(() => {
  const textLength = curtainStampText.value.replace(/[,，]/g, '').length
  return textLength > 2 ? 116 : 104
})
const curtainPaperUrl = ref<string | null>(null)
const curtainStyle = computed(() => {
  const userColor = resolveModeColor(themeConfig.value?.decorations?.curtainColor, isDark.value)
  return {
    backgroundColor: userColor || 'var(--sm-curtain-bg)',
    backgroundImage: curtainPaperUrl.value ? `url(${curtainPaperUrl.value})` : undefined,
    backgroundRepeat: curtainPaperUrl.value ? 'repeat' : undefined,
    backgroundSize: curtainPaperUrl.value ? '512px 512px' : undefined,
  }
})
const revealed = ref(!heroLandscapeEnabled.value)
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

async function ensureCurtainPaperReady() {
  const xuanPaper = themeConfig.value?.xuanPaper
  if (xuanPaper?.enable === false)
    return

  // 幕布纸色默认与首页宣纸不同，做出"拉开时有层次"的观感：
  //   亮色：#E8D7A5 金褐陈年纸 vs 首页 #FCF8E6 米白宣纸
  //   暗色：#1D2230 青黛夜幕 vs 首页纯黑宣纸（冷暖对比）
  // 用户通过 decorations.curtainPaperColor 自定义时以用户配置为准
  const userBase = resolveModeColor(themeConfig.value?.decorations?.curtainPaperColor, isDark.value)
  const baseColor = userBase || (isDark.value ? '#1D2230' : '#E8D7A5')

  try {
    curtainPaperUrl.value = await generateXuanPaperTexture({
      variant: xuanPaper?.variant || 'processed',
      width: 512,
      height: 512,
      seed: 42,
      baseColor,
      isDark: isDark.value,
    })
  }
  catch {
    curtainPaperUrl.value = null
  }
}

function onLandscapeReady() {
  requestAnimationFrame(() => {
    revealed.value = true
  })
}

onMounted(() => {
  if (!heroLandscapeEnabled.value)
    return
  ensureCurtainStampFontReady()
  ensureCurtainPaperReady()
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

// 路由切换时重新播放幕布动画：仅在本页启用了幕布时生效
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
    <div v-if="heroLandscapeEnabled" class="shuimo-curtain shuimo-curtain--left" :class="{ revealed }" :style="curtainStyle">
      <div v-if="curtainStampReady" class="shuimo-curtain__stamp shuimo-curtain__stamp--left">
        <ShuimoStamp
          :text="curtainStampText"
          :type="curtainStampType"
          :shape="curtainStampShape"
          :font-family="curtainStampFont"
          :size="curtainStampSize"
        />
      </div>
    </div>
    <div v-if="heroLandscapeEnabled" class="shuimo-curtain shuimo-curtain--right" :class="{ revealed }" :style="curtainStyle">
      <div v-if="curtainStampReady" class="shuimo-curtain__stamp shuimo-curtain__stamp--right">
        <ShuimoStamp
          :text="curtainStampText"
          :type="curtainStampType"
          :shape="curtainStampShape"
          :font-family="curtainStampFont"
          :size="curtainStampSize"
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
  overflow: hidden;
  will-change: transform;
  // 关闭（合拢）快，打开（展开）慢
  transition: transform 0.5s ease-in;

  &__stamp {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.96;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12));

    &--left {
      right: calc(v-bind(curtainStampSize) * -0.5px);
    }

    &--right {
      left: calc(v-bind(curtainStampSize) * -0.5px);
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
    transition: transform 1.2s linear;

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
