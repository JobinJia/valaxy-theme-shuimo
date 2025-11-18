<script setup lang="ts">
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  complete: []
}>()

const isAnimating = ref(true)
const animationDuration = 2000 // 2秒

onMounted(() => {
  // 动画完成后触发事件
  setTimeout(() => {
    isAnimating.value = false
    emit('complete')
  }, animationDuration)
})
</script>

<template>
  <Transition name="fade-out">
    <div v-if="isAnimating" class="scroll-animation-container">
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
        <div class="scroll-line-wrapper scroll-line-top">
          <img src="../assets/line.png" alt="top-line" class="scroll-line">
        </div>

        <!-- 下边连接线 -->
        <div class="scroll-line-wrapper scroll-line-bottom">
          <img src="../assets/line.png" alt="bottom-line" class="scroll-line">
        </div>
      </div>

      <!-- 中间内容区域 -->
      <div class="scroll-content">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.scroll-animation-container {
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
  animation: slide-bar-left 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.scroll-bar-right {
  right: 0;
  animation: slide-bar-right 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.scroll-bar {
  height: 80vh;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
}

// 上下连接线
.scroll-line-wrapper {
  position: absolute;
  display: flex;
  justify-content: center;
  overflow: hidden;
  z-index: 1;
  animation: expand-line-width 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.scroll-line-top {
  top: 14.3%;
}

.scroll-line-bottom {
  bottom: 13.3%;
}

.scroll-line {
  width: 100%;
  height: auto;
  object-fit: fill;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}

// 中间内容区域
.scroll-content {
  position: absolute;
  z-index: 10;
  color: #333;
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  opacity: 0;
  animation: fade-in 0.5s ease-in 0.5s forwards;
  pointer-events: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* 左侧bar从中间向左移动 */
@keyframes slide-bar-left {
  0% {
    transform: translateX(40vw);
  }
  100% {
    transform: translateX(0);
  }
}

/* 右侧bar从中间向右移动（带水平翻转） */
@keyframes slide-bar-right {
  0% {
    transform: translateX(-40vw) scaleX(-1);
  }
  100% {
    transform: translateX(0) scaleX(-1);
  }
}

/* 线条通过clip-path裁剪，保持图片不变形，宽度从小到大展开 */
@keyframes expand-line-width {
  0% {
    /* 线条容器固定在最终位置 */
    left: 103px;
    right: 103px;
    /* 从中间裁剪，只显示中间很小的部分 */
    clip-path: inset(0 calc(50% - (10vw - 103px)) 0 calc(50% - (10vw - 103px)));
  }
  100% {
    /* 线条容器保持不变 */
    left: 103px;
    right: 103px;
    /* 完全显示 */
    clip-path: inset(0 0 0 0);
  }
}

/* 内容淡入 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
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
</style>
