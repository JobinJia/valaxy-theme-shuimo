<script setup lang="ts">
import type { XuanPaperOptions } from './composables'
import type { ThemeModeColor } from './types'
import { useValaxyDark } from 'valaxy'
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ShuimoMobileFlower from './components/ShuimoMobileFlower.vue'
import { blobUrlToDataURL, buildXuanPaperLocalStorageKey, generateXuanPaperTexture, getCurtainPaper, mobileFlowerReady, mobileFlowerSeed, putCurtainPaper, useIsMobile, useThemeConfig } from './composables'
import { useCurtainStamp } from './composables/useCurtainStamp'
import { CURRENT_ROUTE_PATH_KEY, curtainRevealed, markCurtainPaperReady, markCurtainStampReady, setupInitialCurtain } from './composables/useCurtainTransition'
import { useGlobalXuanPaper } from './composables/useGlobalXuanPaper'
import { timedDebounce } from './composables/useTimedCallback'

// Initial path comes from theme/setup/main.ts (ctx.routePath under SSG, else
// window.location.pathname). Reading the provided ref's current value at
// setup time captures the SSG path before any client navigation, which is
// exactly what setupInitialCurtain wants. Keep this read synchronous so
// vite-ssg's concurrent renders don't race on module-scope curtainRevealed.
const routePathRef = inject(CURRENT_ROUTE_PATH_KEY, ref('/'))
const initialRoutePath = routePathRef.value
setupInitialCurtain(initialRoutePath)

const { urlA, urlB, active } = useGlobalXuanPaper()
const themeConfig = useThemeConfig()
const { isDark } = useValaxyDark()

// Sky overlays (sun/moon/glow/tints) live at viewport level so the dusk/dawn
// radial-gradient can fade out in vh/vw space without any rectangle clipping.
// They previously sat inside ShuimoHeroLandscape but hero's overflow + sceneHeight
// geometry made it impossible to keep both "wide visible glow" and "no hard cut
// at viewport edges".
const skyEnabled = computed(() => themeConfig.value?.astronomy?.enable !== false)

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
const curtainStampMode = computed(() => curtainStampConfig.value.mode ?? curtainStampConfig.value.type ?? 'yin')
const curtainStampShape = computed(() => curtainStampConfig.value.shape || 'auto')
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
  mode: curtainStampMode.value,
  shape: curtainStampShape.value,
  size: curtainStampSize.value,
}))

// 4 个 stamp 挂载点（桌面 left/right + 移动 top/bottom）原本各自调用
// generateStampAsync —— 主线程同步串行 4 次，加上字体首次 fontkit parse，
// 是首屏幕布等 4-6s 的主因。改为共享一份 raw SVG，挂载点只做轻量 ID 重命名。
const { svgRaw: curtainStampSvg, failed: curtainStampFailed, ready: curtainStampDone }
  = useCurtainStamp(curtainStampProps)

watch(curtainStampDone, (v) => {
  if (v)
    markCurtainStampReady()
}, { immediate: true })

const isMobile = useIsMobile()

// 路由切换时 routePathRef 由 ctx.router.afterEach 更新（见 setup/main.ts）。
// 之前用 initialRoutePath snapshot 判断会导致：从首页 SPA 切走后花卉仍残留，
// 直接打开非首页的部分场景（hash/redirect）也会漏判。改为响应式 normalized path。
const isHomeRoute = computed(() => (routePathRef.value.replace(/\/$/, '') || '/') === '/')
const showMobileFlower = computed(() => isMobile.value && isHomeRoute.value)
// 一次性 latch：首次需要显示后保留挂载，路由来回切只用 v-show 切换可见性，
// canvas 数据不重建。首屏直接进非首页时仍不挂载，避免无意义生成。
const flowerMounted = ref(false)
watch(showMobileFlower, (v) => {
  if (v)
    flowerMounted.value = true
}, { immediate: true })
function onFlowerSeedGenerated(seed: number) {
  mobileFlowerSeed.value = seed
}
function onFlowerReady() {
  mobileFlowerReady.value = true
}

// --- Curtain paper texture ---
//
// 注：曾把 4 个 :style 改成 root setProperty + SCSS 静态 CSS var 来消除 worker
// 完成时的 setStyle 风暴 (~225ms 主线程 / 1488 sample on vue setStyle)，但那
// 225ms 阻塞恰好是用户看到带金屑 curtain 的视觉窗口期；消掉后 paper 出现就
// 立刻进 transition，金屑一闪而过。在 shuimo-core 把 paper 生成压到主线程同步
// (~50-100ms) 之前，这里保留 :style 路径以保住视觉。后续 shuimo-core 优化完成
// 再切回 CSS var 方案。
const curtainPaperUrl = ref<string | null>(null)

function makeCurtainBgStyle(side: 'left' | 'right' | 'top' | 'bottom') {
  return computed(() => {
    const userColor = resolveModeColor(themeConfig.value?.decorations?.curtainColor, isDark.value)
    const isVertical = side === 'top' || side === 'bottom'
    return {
      backgroundColor: userColor || 'var(--sm-curtain-bg)',
      // dataURL（来自 IDB / blobUrlToDataURL）含 ; 和 , ，CSS url() 须加引号；
      // 与 node bootstrap 的 url("...") 一致。blob URL 加引号亦无副作用。
      backgroundImage: curtainPaperUrl.value ? `url("${curtainPaperUrl.value}")` : undefined,
      backgroundRepeat: curtainPaperUrl.value ? 'no-repeat' : undefined,
      backgroundSize: curtainPaperUrl.value
        ? (isVertical ? '100% 200%' : '200% 100%')
        : undefined,
      backgroundPosition: curtainPaperUrl.value
        ? (isVertical
            ? `center ${side}`
            : `${side} center`)
        : undefined,
    }
  })
}

const curtainLeftStyle = makeCurtainBgStyle('left')
const curtainRightStyle = makeCurtainBgStyle('right')
const curtainTopStyle = makeCurtainBgStyle('top')
const curtainBottomStyle = makeCurtainBgStyle('bottom')

function setCurtainPaperUrl(url: string | null) {
  if (curtainPaperUrl.value === url)
    return
  const prev = curtainPaperUrl.value
  curtainPaperUrl.value = url
  // 4 个 curtain 元素的 :style 当前还指向 prev；Vue 要等 nextTick 才把新 url
  // 写进 DOM。立即 revoke 会导致 isDark / resize 触发的重绘拿不到 blob →
  // net::ERR_FILE_NOT_FOUND（可见的两片同时报错）。等一次 paint 再 revoke。
  if (prev?.startsWith('blob:')) {
    const stale = prev
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          URL.revokeObjectURL(stale)
        })
      })
    })
  }
}

async function ensureCurtainPaperReady() {
  const xuanPaper = themeConfig.value?.xuanPaper
  if (xuanPaper?.enable === false) {
    // 关闭宣纸时 curtain 退化为纯色 backgroundColor，但 gate 仍要解锁，否则
    // curtainPaperReady 永不为真，tryOpenInitialCurtain 等不到信号 → 幕布永不打开
    markCurtainPaperReady()
    return
  }

  const userBase = resolveModeColor(themeConfig.value?.decorations?.curtainPaperColor, isDark.value)
  const baseColor = userBase || (isDark.value ? '#1D2230' : '#E8D7A5')

  const userGold = xuanPaper?.goldDensity
  const curtainGold = typeof userGold === 'number'
    ? Math.max(userGold * 3, 0.2)
    : undefined

  const variant = xuanPaper?.variant || 'processed'
  const width = Math.max(320, Math.ceil(Math.min(window.innerWidth, 1920) / 50) * 50)
  const height = Math.max(320, Math.ceil(Math.min(window.innerHeight, 1080) / 50) * 50)

  const options: XuanPaperOptions = {
    variant,
    width,
    height,
    seed: 42,
    baseColor,
    isDark: isDark.value,
    goldDensity: curtainGold,
    // curtain paper（×3 金屑，~2.5MB）不写 localStorage：会挤掉 global paper 的
    // LS bootstrap 缓存。改用 IndexedDB（getCurtainPaper/putCurtainPaper）持久化，
    // 配额独立、互不挤占，curtain 保持全尺寸全金屑密度。
    persistToLocalStorage: false,
  }

  // IndexedDB 缓存 key：复用 LS 路径的同一份参数指纹，保证同参数命中
  const cacheKey = buildXuanPaperLocalStorageKey(options)

  // 二次刷新（含新 tab / 新会话）：IDB 命中直接拿 dataURL，跳过 worker 生成。
  // curtain 的「纯色窗口」从 worker 生成 ×3 金屑的秒级，降到 IDB 读取的几 ms。
  let dataUrl = await getCurtainPaper(cacheKey)

  if (!dataUrl) {
    // 首次访问：worker 生成 blob URL，转成 dataURL 落 IDB（dataURL 无 revoke
    // 生命周期，适合持久化；blob URL 跨会话即失效）
    let blobUrl: string | null = null
    try {
      blobUrl = await generateXuanPaperTexture(options)
    }
    catch {}
    if (blobUrl) {
      let resolved: string
      try {
        resolved = await blobUrlToDataURL(blobUrl)
      }
      catch {
        resolved = blobUrl
      }
      dataUrl = resolved
      // persistToLocalStorage:false 时 generateXuanPaperTexture 不持有该 blob URL，
      // 转完 dataURL 后即可释放，避免泄漏
      if (resolved !== blobUrl && blobUrl.startsWith('blob:'))
        URL.revokeObjectURL(blobUrl)
      if (resolved.startsWith('data:image/'))
        putCurtainPaper(cacheKey, resolved).catch(() => {})
    }
  }

  if (dataUrl) {
    // 等 image onload —— dataURL 数据已在内存，onload 几乎瞬间触发。
    // decoding='async' 让 GPU 异步 decode，curtain 拉开的 0.7s transition 期间
    // 浏览器后台完成 decode，首帧 paint 时纹理就绪。onload/onerror 必触发其一。
    const preload = new Image()
    preload.decoding = 'async'
    await new Promise<void>((resolve) => {
      preload.onload = () => resolve()
      preload.onerror = () => resolve()
      preload.src = dataUrl as string
    })
    setCurtainPaperUrl(dataUrl)
  }
  else {
    setCurtainPaperUrl(null)
  }
  // 无论成功还是失败都标记 ready：失败时 wrapper 退化为纯色 backgroundColor，
  // 但 curtain gate 必须解锁，否则永远等不到信号导致幕布永不打开
  markCurtainPaperReady()
}

// trailing debounce 200ms：拖窗期间持续 reset 计时，停下后才真跑 worker。
// 之前用 rAF 每帧合并，但 resize 事件本身约 30Hz，每次 w/h 都不同导致 worker
// 内部 lastW/lastH dedup 不生效，拖窗期间会 ~30/s 跑 worker。trailing 版本
// 拖动期 0 次实跑，停下来才一次到位
const curtainRegen = timedDebounce(ensureCurtainPaperReady, 200)

onMounted(() => {
  ensureCurtainPaperReady()
  window.addEventListener('resize', curtainRegen.schedule)
})

onUnmounted(() => {
  curtainRegen.cancel()
  setCurtainPaperUrl(null)
  window.removeEventListener('resize', curtainRegen.schedule)
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

  <!-- 天文驱动的天空层（晚霞 / 朝霞 / 月 / 星 / 雾），挂在 paper-bg 之上、
       hero 与内容之下，全 viewport 几何，避免被 hero 矩形裁出硬边 -->
  <ClientOnly>
    <ShuimoNightSky v-if="isDark && skyEnabled" />
  </ClientOnly>
  <ClientOnly>
    <ShuimoDaySky v-if="!isDark && skyEnabled" />
  </ClientOnly>

  <!-- 移动端花卉背景：放在 App.vue 层保持跨路由存活，避免切页面重建。
       v-if 走 lazy mount latch，v-show 按当前是否首页控制可见性。 -->
  <ClientOnly>
    <ShuimoMobileFlower
      v-if="flowerMounted"
      v-show="showMobileFlower"
      @ready="onFlowerReady"
      @seed-generated="onFlowerSeedGenerated"
    />
  </ClientOnly>

  <!-- 开屏幕布：桌面（左右） -->
  <div v-show="!isMobile" class="shuimo-curtain shuimo-curtain--left" :class="{ revealed: curtainRevealed }" :style="curtainLeftStyle">
    <div class="shuimo-curtain__stamp shuimo-curtain__stamp--left">
      <ShuimoCurtainStampSlot
        :svg="curtainStampSvg"
        uid="left"
        :size="curtainStampSize"
        :failed="curtainStampFailed"
        :fallback-text="curtainStampText"
        :fallback-type="curtainStampMode"
      />
    </div>
  </div>
  <div v-show="!isMobile" class="shuimo-curtain shuimo-curtain--right" :class="{ revealed: curtainRevealed }" :style="curtainRightStyle">
    <div class="shuimo-curtain__stamp shuimo-curtain__stamp--right">
      <ShuimoCurtainStampSlot
        :svg="curtainStampSvg"
        uid="right"
        :size="curtainStampSize"
        :failed="curtainStampFailed"
        :fallback-text="curtainStampText"
        :fallback-type="curtainStampMode"
      />
    </div>
  </div>

  <!-- 开屏幕布：移动端（上下） -->
  <div v-show="isMobile" class="shuimo-curtain shuimo-curtain--top" :class="{ revealed: curtainRevealed }" :style="curtainTopStyle">
    <div class="shuimo-curtain__stamp shuimo-curtain__stamp--top">
      <ShuimoCurtainStampSlot
        :svg="curtainStampSvg"
        uid="top"
        :size="curtainStampSize"
        :failed="curtainStampFailed"
        :fallback-text="curtainStampText"
        :fallback-type="curtainStampMode"
      />
    </div>
  </div>
  <div v-show="isMobile" class="shuimo-curtain shuimo-curtain--bottom" :class="{ revealed: curtainRevealed }" :style="curtainBottomStyle">
    <div class="shuimo-curtain__stamp shuimo-curtain__stamp--bottom">
      <ShuimoCurtainStampSlot
        :svg="curtainStampSvg"
        uid="bottom"
        :size="curtainStampSize"
        :failed="curtainStampFailed"
        :fallback-text="curtainStampText"
        :fallback-type="curtainStampMode"
      />
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
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  will-change: transform;
  transition: transform 0.5s ease-in;

  // Desktop: left-right split
  &--left,
  &--right {
    top: 0;
    width: 50%;
    height: 100%;
    background: var(--sm-paper);
  }

  &--left {
    left: 0;
  }

  &--right {
    right: 0;
  }

  // Mobile: top-bottom split
  &--top,
  &--bottom {
    left: 0;
    width: 100%;
    height: 50%;
    background: var(--sm-paper);
  }

  &--top {
    top: 0;
  }

  &--bottom {
    bottom: 0;
  }

  &__stamp {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.96;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12));

    // Desktop: centered on vertical seam
    &--left {
      top: 50%;
      right: 0;
      transform: translate(50%, -50%);
    }

    &--right {
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
    }

    // Mobile: centered on horizontal seam
    &--top {
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 50%);
    }

    &--bottom {
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  &.revealed {
    transition: transform 0.7s linear;

    &.shuimo-curtain--left {
      transform: translateX(-100%);
    }

    &.shuimo-curtain--right {
      transform: translateX(100%);
    }

    &.shuimo-curtain--top {
      transform: translateY(-100%);
    }

    &.shuimo-curtain--bottom {
      transform: translateY(100%);
    }
  }
}
</style>
