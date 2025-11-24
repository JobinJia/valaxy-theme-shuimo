<script setup lang="ts">
/**
 * 水墨画卷轴开屏动画组件
 *
 * 展示一个古典卷轴展开的动画效果，内容为程序生成的中国山水画。
 * 卷轴从中间向两侧展开，画作渐现，营造开卷有益的意境。
 *
 * @emits complete - 动画完成时触发
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useShuimoPainting } from '../composables/useShuimoPainting'

const emit = defineEmits<{
  complete: []
}>()

const isAnimating = ref(true)
const animationDuration = 2000 // 2秒卷轴展开动画
const paintingUrl = ref('')
const containerRef = ref<HTMLElement | null>(null)

// 使用 shuimo-core 重构后的山水画生成器
const { generate, generatePaperTexture, cleanup } = useShuimoPainting()

/**
 * 将 SVG 预渲染为 PNG 图片
 * 通过 Canvas 将 SVG 转换为位图，避免动画过程中 SVG 重绘
 */
function svgToPng(svgString: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    // 设置 canvas 尺寸
    canvas.width = width
    canvas.height = height

    // 创建 SVG Blob URL
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      // 绘制到 canvas
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)

      // 转换为 PNG Blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob))
        }
        else {
          reject(new Error('Failed to create PNG blob'))
        }
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error('Failed to load SVG'))
    }
    img.src = svgUrl
  })
}

/**
 * 生成山水画
 * 每次页面刷新都会生成不同的画作
 */
async function createPainting() {
  try {
    // 使用当前时间戳作为种子，确保每次刷新都不同
    const seed = Date.now()

    // 生成真实的山水画 (1100x600 适配卷轴比例)
    // 先生成优化后的纸张纹理 (128x128 以提高性能)
    const textureUrl = generatePaperTexture(128, 128)
    const svgString = generate(seed, 1100, 600, textureUrl)

    // 预渲染 SVG 为 PNG，提高动画性能
    const pngUrl = await svgToPng(svgString, 1100, 600)

    if (paintingUrl.value) {
      URL.revokeObjectURL(paintingUrl.value)
    }
    paintingUrl.value = pngUrl

    // 应用纸张纹理到容器背景
    if (textureUrl && containerRef.value) {
      containerRef.value.style.backgroundImage = `url(${textureUrl})`
      containerRef.value.style.backgroundSize = '8em 8em'
    }
  }
  catch (error) {
    console.error('❌ 生成山水画失败:', error)
    // 降级方案：直接使用 SVG
    try {
      const seed = Date.now()
      const textureUrl = generatePaperTexture(128, 128)
      const svgString = generate(seed, 1100, 600, textureUrl)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      paintingUrl.value = URL.createObjectURL(blob)
    }
    catch {
      // 静默失败
    }
  }
}

onMounted(() => {
  // 立即生成画作
  createPainting()

  // 动画完成后触发事件
  setTimeout(() => {
    // isAnimating.value = false
    emit('complete')
  }, animationDuration)
})

onBeforeUnmount(() => {
  // 清理
  if (paintingUrl.value) {
    URL.revokeObjectURL(paintingUrl.value)
  }
  cleanup()
})
</script>

<template>
  <Transition name="fade-out">
    <div v-if="isAnimating" ref="containerRef" class="scroll-animation-container">
      <!-- 卷轴框架 -->
      <div class="scroll-frame">
        <!-- 左侧卷轴轴杆 -->
        <div class="scroll-bar-wrapper scroll-bar-left">
          <img src="../assets/bar.png" alt="left-bar" class="scroll-bar">
        </div>

        <!-- 右侧卷轴轴杆 -->
        <div class="scroll-bar-wrapper scroll-bar-right">
          <img src="../assets/bar.png" alt="right-bar" class="scroll-bar">
        </div>

        <!-- 上边连接线 -->
        <div class="scroll-line-clip scroll-line-top">
          <div class="scroll-line-wrapper">
            <img src="../assets/line.png" alt="top-line" class="scroll-line">
          </div>
        </div>

        <!-- 下边连接线 -->
        <div class="scroll-line-clip scroll-line-bottom">
          <div class="scroll-line-wrapper">
            <img src="../assets/line.png" alt="bottom-line" class="scroll-line">
          </div>
        </div>

        <!-- 中间内容区域 - 山水画 -->
        <div class="scroll-content-clip">
          <div class="scroll-content">
            <div class="painting-wrapper">
              <img :src="paintingUrl" class="painting-image" alt="Shuimo Painting">
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
// 响应式基准字体大小
// 使用 CSS 变量统一管理尺寸，便于在不同分辨率下调整
.scroll-animation-container {
  // 基准字体大小，所有 em 单位基于此计算
  // 默认 16px，在不同屏幕尺寸下自适应
  --scroll-base-font: clamp(12px, 1vw + 0.5vh, 18px);
  // 线条左右边界偏移，等于卷轴轴杆宽度，让线条紧贴卷轴内侧
  --scroll-bar-offset: 5.5em; // 微调后的卷轴轴杆宽度
  --scroll-content-offset: 5.8em; // 内容区域边界偏移，略大于线条偏移

  font-size: var(--scroll-base-font);
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #f5f5f0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

// 卷轴框架容器
.scroll-frame {
  position: relative;
  width: 100%;
  height: 100%;
}

// 左右卷轴轴杆
.scroll-bar-wrapper {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 2;
}

.scroll-bar-left {
  left: 0;
  will-change: transform;
  animation: slide-bar-left 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.scroll-bar-right {
  right: 0;
  will-change: transform;
  animation: slide-bar-right 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.scroll-bar {
  height: 80vh;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0.3125em 0.9375em rgba(0, 0, 0, 0.3));
}

// 上下连接线 - 外层裁剪容器
.scroll-line-clip {
  position: absolute;
  left: var(--scroll-bar-offset);
  right: var(--scroll-bar-offset);
  overflow: hidden;
  z-index: 1;
  // 使用 GPU 加速
  will-change: clip-path;
  transform: translateZ(0);
  animation: expand-clip 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  // 初始裁剪状态
  clip-path: inset(0 50% 0 50%);
}

.scroll-line-top {
  top: 14.3%;
}

.scroll-line-bottom {
  bottom: 13.3%;
}

// 内层线条容器 - 保持内容不变形
.scroll-line-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.scroll-line {
  width: 100%;
  height: auto;
  object-fit: fill;
  filter: drop-shadow(0 0.125em 0.5em rgba(0, 0, 0, 0.2));
}

// 中间内容区域 - 外层裁剪容器
.scroll-content-clip {
  position: absolute;
  overflow: hidden;
  z-index: 1;
  // 使用 GPU 加速
  will-change: clip-path;
  transform: translateZ(0);
  animation: expand-clip 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: none;
  // 上边线位置：14.3%，下边线位置：13.3%
  top: 15%;
  bottom: 14%;
  left: var(--scroll-content-offset);
  right: var(--scroll-content-offset);
  margin: 1.5em 0;
  // 初始裁剪状态
  clip-path: inset(0 50% 0 50%);
}

// 内层内容容器 - 保持山水画不变形
.scroll-content {
  width: 100%;
  height: 100%;
}

.painting-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  .painting-image {
    width: 100%;
    height: 100%;
    object-fit: cover; // Use cover to fill space better in fullscreen
  }
}

/* 左侧bar从中间向左移动 */
@keyframes slide-bar-left {
  0% {
    transform: translateX(42vw) translateZ(0);
  }
  100% {
    transform: translateX(0) translateZ(0);
  }
}

/* 右侧bar从中间向右移动（带水平翻转） */
@keyframes slide-bar-right {
  0% {
    transform: translateX(-42vw) scaleX(-1) translateZ(0);
  }
  100% {
    transform: translateX(0) scaleX(-1) translateZ(0);
  }
}

/* 使用 clip-path 展开动画 - 从中间向两侧 */
/* translateZ(0) 强制 GPU 加速，提升 clip-path 动画性能 */
@keyframes expand-clip {
  0% {
    clip-path: inset(0 50% 0 50%);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}

/* 内容淡入 - 画作慢慢显现 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 整体淡出动画 */
.fade-out-enter-active,
.fade-out-leave-active {
  transition: opacity 2s ease;
}

.fade-out-enter-from,
.fade-out-leave-to {
  opacity: 0;
}

// 响应式媒体查询
// 小屏幕设备 (手机)
@media screen and (max-width: 768px) {
  .scroll-animation-container {
    --scroll-base-font: clamp(10px, 2vw + 0.5vh, 14px);
    --scroll-content-offset: 4.5em;
  }

  .scroll-bar {
    height: 70vh;
  }

  .scroll-line-top {
    top: 18%;
  }

  .scroll-line-bottom {
    bottom: 17%;
  }

  .scroll-content-clip {
    top: 19%;
    bottom: 18%;
  }
}

// 中等屏幕设备 (平板)
@media screen and (min-width: 769px) and (max-width: 1024px) {
  .scroll-animation-container {
    --scroll-base-font: clamp(12px, 1.2vw + 0.4vh, 16px);
    --scroll-content-offset: 6em;
  }

  .scroll-bar {
    height: 75vh;
  }
}

// 大屏幕设备 (桌面显示器)
@media screen and (min-width: 1025px) and (max-width: 1440px) {
  .scroll-animation-container {
    --scroll-base-font: clamp(14px, 1vw + 0.5vh, 18px);
  }
}

// 超大屏幕设备 (4K 显示器)
@media screen and (min-width: 1921px) {
  .scroll-animation-container {
    --scroll-base-font: clamp(16px, 0.8vw + 0.4vh, 24px);
    --scroll-content-offset: 9em;
  }
}
</style>
