<script setup lang="ts">
import type { ThemeModeColor } from './types'
import { useValaxyDark } from 'valaxy'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { generateXuanPaperTexture, useThemeConfig } from './composables'
import { curtainRevealed, setupInitialCurtain } from './composables/useCurtainTransition'
import { useGlobalXuanPaper } from './composables/useGlobalXuanPaper'

// useRoute() can be undefined during SSG app init or under duplicate vue-router
// instances (e.g. when this theme is consumed via `link:` workspaces).
const initialRoute = useRoute() as ReturnType<typeof useRoute> | undefined
setupInitialCurtain(initialRoute?.path ?? '/')

const { urlA, urlB, active } = useGlobalXuanPaper()
const themeConfig = useThemeConfig()
const { isDark } = useValaxyDark()

function resolveModeColor(value: ThemeModeColor | undefined, dark: boolean): string | undefined {
  if (!value)
    return undefined
  if (typeof value === 'string')
    return value
  return dark ? value.dark : value.light
}

// --- Curtain stamp ---

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

const curtainStampReady = ref(false)

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

// --- Curtain paper texture ---

const curtainPaperUrl = ref<string | null>(null)

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

let curtainDebounceTimer: ReturnType<typeof setTimeout> | null = null

function setCurtainPaperUrl(url: string | null) {
  if (curtainPaperUrl.value === url)
    return
  if (curtainPaperUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(curtainPaperUrl.value)
  curtainPaperUrl.value = url
}

async function ensureCurtainPaperReady() {
  const xuanPaper = themeConfig.value?.xuanPaper
  if (xuanPaper?.enable === false)
    return

  const userBase = resolveModeColor(themeConfig.value?.decorations?.curtainPaperColor, isDark.value)
  const baseColor = userBase || (isDark.value ? '#1D2230' : '#E8D7A5')

  const userGold = xuanPaper?.goldDensity
  const curtainGold = typeof userGold === 'number'
    ? Math.max(userGold * 3, 0.2)
    : undefined

  const variant = xuanPaper?.variant || 'processed'
  const width = Math.max(320, Math.ceil(Math.min(window.innerWidth, 1920) / 50) * 50)
  const height = Math.max(320, Math.ceil(Math.min(window.innerHeight, 1080) / 50) * 50)

  try {
    setCurtainPaperUrl(await generateXuanPaperTexture({
      variant,
      width,
      height,
      seed: 42,
      baseColor,
      isDark: isDark.value,
      goldDensity: curtainGold,
    }))
  }
  catch {
    setCurtainPaperUrl(null)
  }
}

function scheduleCurtainRegen() {
  if (curtainDebounceTimer)
    clearTimeout(curtainDebounceTimer)
  curtainDebounceTimer = setTimeout(ensureCurtainPaperReady, 200)
}

onMounted(() => {
  ensureCurtainStampFontReady()
  ensureCurtainPaperReady()
  window.addEventListener('resize', scheduleCurtainRegen)
})

onUnmounted(() => {
  if (curtainDebounceTimer)
    clearTimeout(curtainDebounceTimer)
  setCurtainPaperUrl(null)
  window.removeEventListener('resize', scheduleCurtainRegen)
})

watch(isDark, () => {
  ensureCurtainPaperReady()
})
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

  <!-- 开屏幕布 -->
  <div class="shuimo-curtain shuimo-curtain--left" :class="{ revealed: curtainRevealed }" :style="curtainLeftStyle">
    <div v-if="curtainStampReady" class="shuimo-curtain__stamp shuimo-curtain__stamp--left">
      <ShuimoStamp v-bind="curtainStampProps" />
    </div>
  </div>
  <div class="shuimo-curtain shuimo-curtain--right" :class="{ revealed: curtainRevealed }" :style="curtainRightStyle">
    <div v-if="curtainStampReady" class="shuimo-curtain__stamp shuimo-curtain__stamp--right">
      <ShuimoStamp v-bind="curtainStampProps" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
}

.shuimo-paper-bg__layer--active {
  opacity: 1;
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
  transition: transform 0.5s ease-in;

  &__stamp {
    position: absolute;
    top: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.96;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12));

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
    transition: transform 0.7s linear;

    &.shuimo-curtain--left {
      transform: translateX(-100%);
    }

    &.shuimo-curtain--right {
      transform: translateX(100%);
    }
  }
}

@media (max-width: 767px) {
  .shuimo-curtain {
    display: none;
  }
}
</style>
