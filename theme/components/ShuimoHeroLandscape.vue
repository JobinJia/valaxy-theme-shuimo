<script setup lang="ts">
import type { HeroSceneResult } from '../composables/useHeroSceneWorker'
import { useValaxyDark } from 'valaxy'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { buildHeroScene, buildHeroSceneInWorker, generateXuanPaperTexture, getSessionSeed, scheduleShuimoTask, useBlankSide, useThemeConfig } from '../composables'

const emit = defineEmits<{
  ready: []
  paperReady: []
  seedGenerated: [seed: number]
}>()

interface HeroSceneCache {
  imgUrl: string
  blankSide: 'left' | 'right'
  seed: number
  W: number
  H: number
}

// SVG 本身不区分亮/暗色（暗色走 CSS filter 反色），缓存只按尺寸区分
let cachedHeroScene: HeroSceneCache | null = null

// sessionStorage 持久化：刷新同一 tab 复用上次渲染结果（配合 sticky seed 命中）
const SCENE_CACHE_PREFIX = 'shuimo-hero-scene-v1'

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error || new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

function loadCachedScene(key: string): { dataUrl: string, blankSide: 'left' | 'right' } | null {
  if (typeof window === 'undefined')
    return null
  try {
    const s = sessionStorage.getItem(key)
    if (!s)
      return null
    const parsed = JSON.parse(s)
    if (typeof parsed?.dataUrl === 'string' && (parsed.blankSide === 'left' || parsed.blankSide === 'right'))
      return parsed
    return null
  }
  catch {
    return null
  }
}

function saveCachedScene(key: string, dataUrl: string, blankSide: 'left' | 'right'): void {
  if (typeof window === 'undefined')
    return
  try {
    // 保留一个活跃条目：先清掉同前缀的旧条目，避免 5MB 配额被历史种子占满
    const toRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(SCENE_CACHE_PREFIX) && k !== key)
        toRemove.push(k)
    }
    toRemove.forEach(k => sessionStorage.removeItem(k))
    sessionStorage.setItem(key, JSON.stringify({ dataUrl, blankSide }))
  }
  catch {}
}

const svgContainer = ref<HTMLDivElement>()
const { setBlankSide } = useBlankSide()
const themeConfig = useThemeConfig()
const nightSkyEnabled = computed(() => themeConfig.value?.astronomy?.enable !== false)
const daySkyEnabled = computed(() => themeConfig.value?.astronomy?.enable !== false)
const { isDark } = useValaxyDark()
const paperUrl = ref<string | null>(null)

async function getHeroScene(W: number, H: number): Promise<HeroSceneCache> {
  const heroConfig = themeConfig.value?.hero
  const seed = heroConfig?.seed ?? getSessionSeed()
  const cacheKey = `${SCENE_CACHE_PREFIX}-${W}-${H}-${seed}`

  // 1. 内存缓存（同一次会话内路由切换）
  if (cachedHeroScene && cachedHeroScene.W === W && cachedHeroScene.H === H && cachedHeroScene.seed === seed)
    return cachedHeroScene

  // 2. sessionStorage（刷新 tab 命中，秒开）
  const stored = loadCachedScene(cacheKey)
  if (stored) {
    cachedHeroScene = { imgUrl: stored.dataUrl, blankSide: stored.blankSide, seed, W, H }
    return cachedHeroScene
  }

  // 3. Worker 生成（输出 PNG blob；无 OffscreenCanvas 时退回 SVG 字符串）
  let result: HeroSceneResult | null = null
  const workerPromise = buildHeroSceneInWorker(W, H, seed)
  if (workerPromise) {
    try {
      result = await workerPromise
    }
    catch (err) {
      console.warn('[shuimo] Hero scene worker failed, falling back to sync:', err)
    }
  }
  if (!result) {
    const scene = await scheduleShuimoTask(() => buildHeroScene(W, H, seed))
    result = { svg: scene.svg, blankSide: scene.blankSide, seed: scene.seed }
  }

  // 4. 产出 img URL + 回写缓存
  let imgUrl: string
  if (result.png) {
    imgUrl = URL.createObjectURL(result.png)
    // 异步写 sessionStorage 不阻塞渲染；配额满就静默忽略
    blobToDataURL(result.png)
      .then(dataUrl => saveCachedScene(cacheKey, dataUrl, result!.blankSide))
      .catch(() => {})
  }
  else if (result.svg) {
    const blob = new Blob([result.svg], { type: 'image/svg+xml' })
    imgUrl = URL.createObjectURL(blob)
    // SVG 太大（15MB+）不写 sessionStorage；PNG 才值得持久化
  }
  else {
    throw new Error('[shuimo] hero scene worker returned empty')
  }

  cachedHeroScene = { imgUrl, blankSide: result.blankSide, seed: result.seed, W, H }
  return cachedHeroScene
}

// 按视口尺寸生成一张铺满 hero 背景的宣纸，不平铺；分桶避免 resize 抖动
let lastPaperBucketW = 0
let lastPaperBucketH = 0
let paperDebounceTimer: ReturnType<typeof setTimeout> | null = null

async function regeneratePaper() {
  const xuanPaper = themeConfig.value?.xuanPaper
  if (xuanPaper?.enable === false) {
    paperUrl.value = null
    return
  }
  const bucketW = Math.max(320, Math.ceil(Math.min(window.innerWidth, 1920) / 50) * 50)
  const bucketH = Math.max(320, Math.ceil(Math.min(window.innerHeight, 1080) / 50) * 50)
  if (bucketW === lastPaperBucketW && bucketH === lastPaperBucketH && paperUrl.value)
    return
  lastPaperBucketW = bucketW
  lastPaperBucketH = bucketH

  paperUrl.value = await generateXuanPaperTexture({
    variant: xuanPaper?.variant || 'processed',
    width: bucketW,
    height: bucketH,
    seed: 42,
    isDark: isDark.value,
    goldDensity: xuanPaper?.goldDensity,
  })
}

function schedulePaperRegen() {
  if (paperDebounceTimer)
    clearTimeout(paperDebounceTimer)
  paperDebounceTimer = setTimeout(regeneratePaper, 200)
}

onMounted(async () => {
  const el = svgContainer.value
  if (!el)
    return

  try {
    await regeneratePaper()
    // 宣纸 ready 后立刻通知父组件 —— 幕布可以开始打开动画，不用等更慢的山水 SVG
    emit('paperReady')

    const W = Math.min(window.innerWidth, 1920)
    const H = Math.min(window.innerHeight, 1080)
    const scene = await getHeroScene(W, H)
    setBlankSide(scene.blankSide)
    emit('seedGenerated', scene.seed)
    const img = new Image()
    img.decoding = 'async'
    img.style.cssText = 'width:100%;height:100%;mix-blend-mode:multiply;object-fit:cover'
    // emit('ready') 要在 img 真正 decode 完成后，才代表山水已可见；幕布打开等这个信号
    img.onload = () => {
      emit('ready')
    }
    img.onerror = () => {
      emit('ready') // 加载失败也通知，避免幕布永远不开
    }
    img.src = scene.imgUrl
    el.innerHTML = ''
    el.appendChild(img)
  }
  catch (e) {
    console.error('[shuimo] 山水画生成失败', e)
  }

  window.addEventListener('resize', schedulePaperRegen)

  // shuimo-core 文字测量临时 SVG 清理
  document.querySelectorAll('body > svg').forEach(s => s.remove())
})

onUnmounted(() => {
  if (paperDebounceTimer)
    clearTimeout(paperDebounceTimer)
  window.removeEventListener('resize', schedulePaperRegen)
})

// 切换暗色时同步重生成纸纹（亮色米色、暗色乌金黑）
watch(isDark, () => {
  lastPaperBucketW = 0
  lastPaperBucketH = 0
  regeneratePaper()
})
</script>

<template>
  <div
    class="shuimo-hero-landscape"
    :style="paperUrl ? { backgroundImage: `url(${paperUrl})`, backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%' } : undefined"
  >
    <!-- 暗色模式：天文驱动的夜空（在 SVG 之前 → 自然位于山水之下） -->
    <ClientOnly>
      <ShuimoNightSky v-if="isDark && nightSkyEnabled" />
    </ClientOnly>
    <!-- 亮色模式：天文驱动的白昼（包含日 / 朝霞 / 晚霞 / 飞鸟） -->
    <ClientOnly>
      <ShuimoDaySky v-if="!isDark && daySkyEnabled" />
    </ClientOnly>
    <div ref="svgContainer" class="shuimo-hero-landscape__svg" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-hero-landscape {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background: var(--sm-paper);
  transition: background 0.5s ease;
}

.shuimo-hero-landscape__svg {
  width: 100%;
  height: 100%;
}
</style>

<style>
/* 暗色模式（全局，不受 scoped 限制） */
html.dark .shuimo-hero-landscape {
  background: var(--sm-paper);
}
html.dark .shuimo-hero-landscape__svg {
  filter: invert(0.88) hue-rotate(180deg);
}
</style>
