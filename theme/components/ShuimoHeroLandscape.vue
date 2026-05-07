<script setup lang="ts">
import type { HeroSceneResult } from '../composables/useHeroSceneWorker'
import { computed, onMounted, ref } from 'vue'
import { buildHeroScene, buildHeroSceneInWorker, getSessionSeed, scheduleShuimoTask, useBlankSide, useThemeConfig } from '../composables'

const emit = defineEmits<{
  seedGenerated: [seed: number]
}>()

interface HeroSceneCache {
  imgUrl: string
  blankSide: 'left' | 'right'
  seed: number
  W: number
  H: number
}

// 内存缓存：覆盖同一次 page load 内的 SPA 路由切换；
// 刷新页面时模块重新加载，缓存自然清零 —— 和"每次刷新换新山水"的 seed 策略一致
let cachedHeroScene: HeroSceneCache | null = null

const svgContainer = ref<HTMLDivElement>()
const { setBlankSide } = useBlankSide()
const themeConfig = useThemeConfig()

const sceneHeight = computed(() => themeConfig.value?.hero?.sceneHeight ?? 800)
const containerStyle = computed(() => ({
  height: `${sceneHeight.value}px`,
  // 用 margin-top 做纯几何居中，避免 transform 创建 stacking context
  // —— 那会让 mix-blend-mode:multiply 找不到下层全局宣纸作 backdrop
  marginTop: `${-sceneHeight.value / 2}px`,
}))

async function getHeroScene(W: number, H: number): Promise<HeroSceneCache> {
  const heroConfig = themeConfig.value?.hero
  const seed = heroConfig?.seed ?? getSessionSeed()

  // 内存缓存：同一次 page load 内的路由切换秒开
  if (cachedHeroScene && cachedHeroScene.W === W && cachedHeroScene.H === H && cachedHeroScene.seed === seed)
    return cachedHeroScene

  // Worker 生成（输出 PNG blob；无 OffscreenCanvas 时退回 SVG 字符串）
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

  let imgUrl: string
  if (result.png) {
    imgUrl = URL.createObjectURL(result.png)
  }
  else if (result.svg) {
    const blob = new Blob([result.svg], { type: 'image/svg+xml' })
    imgUrl = URL.createObjectURL(blob)
  }
  else {
    throw new Error('[shuimo] hero scene worker returned empty')
  }

  // 覆盖旧缓存前 revoke 旧 blob URL，避免 SPA 内 resize/seed 切换累积大 PNG 内存
  if (cachedHeroScene)
    URL.revokeObjectURL(cachedHeroScene.imgUrl)

  cachedHeroScene = { imgUrl, blankSide: result.blankSide, seed: result.seed, W, H }
  return cachedHeroScene
}

onMounted(async () => {
  const el = svgContainer.value
  if (!el)
    return

  try {
    // W 必须跟实际视口宽度一致：外层 <img object-fit:cover> 在容器 vs PNG 宽高比
    // 不匹配时会做垂直裁剪（4K 下容器 3840×800 / PNG 1920×800 → 上下各切 400px，
    // 山顶和地面线都没了）。和 useGlobalXuanPaper 一样不设 1920 上限。
    const W = window.innerWidth
    // H 是 SVG 画布高度（scene 坐标系），由 themeConfig.hero.sceneHeight 决定
    const H = themeConfig.value?.hero?.sceneHeight ?? 800
    const scene = await getHeroScene(W, H)
    setBlankSide(scene.blankSide)
    emit('seedGenerated', scene.seed)
    const img = new Image()
    img.decoding = 'async'
    // shuimo-core transparent:true 输出无根 multiply 的 SVG，但保留内部 fill:white
    // 层次遮挡。主题层这里套一层 mix-blend-mode:multiply：白色 multiply 下层纸 = 纸
    // （零色差穿透），墨色 multiply 成深墨。单层合成，不会双重 multiply。
    img.style.cssText = 'width:100%;height:100%;mix-blend-mode:multiply;object-fit:cover'
    img.src = scene.imgUrl
    el.innerHTML = ''
    el.appendChild(img)
  }
  catch (e) {
    console.error('[shuimo] 山水画生成失败', e)
  }

  // shuimo-core 文字测量临时 SVG 清理
  document.querySelectorAll('body > svg').forEach(s => s.remove())
})
</script>

<template>
  <div
    class="shuimo-hero-landscape"
    :style="containerStyle"
  >
    <!-- 注意：ShuimoDaySky / ShuimoNightSky 已迁出到 App.vue 顶层渲染。
         hero 容器的 overflow 限制和 sceneHeight 的几何会让晚霞/朝霞渐变
         无法在视口边缘软淡出，必须挂到 viewport 层用 vh/vw 单位画。 -->
    <div ref="svgContainer" class="shuimo-hero-landscape__svg" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-hero-landscape {
  /* 用 absolute（z-index:auto）避免 stacking context —— position:fixed 现代浏览器
     会无条件创建 SC，会让内部 <img> 的 mix-blend-mode:multiply 找不到下层全局宣纸
     作 backdrop，导致山体 fill 不做 multiply 直接硬涂。absolute + 无 z-index 才能
     保留 blend 透过去。 父 .shuimo-app 已是 position:relative; min-height:100vh，
     首页无内容时其高度 == 视口，居中效果等同 fixed。 */
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  /* 高度 + margin-top 偏移由 inline style 控制 */
  pointer-events: none;
  /* 故意 overflow: visible —— 让 ShuimoDaySky 的晚霞 / 朝霞 radial-gradient
     可以柔和地延伸到 hero 矩形之外，避免在容器底/侧出现硬切。SVG <img> 自身
     由 object-fit:cover + width/height:100% 约束在 __svg 容器里，不会越界。 */
  overflow: visible;
}

.shuimo-hero-landscape__svg {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

<style>
/* 暗色模式（全局，不受 scoped 限制） */
html.dark .shuimo-hero-landscape__svg {
  filter: invert(0.88) hue-rotate(180deg);
}
</style>
