<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

function createPetal(x: number, y: number) {
  const petal = document.createElement('div')
  petal.className = 'shuimo-petal'

  // 随机参数
  const size = 6 + Math.random() * 8
  const dx = (Math.random() - 0.5) * 80 // 水平漂移
  const dy = 60 + Math.random() * 100 // 下落距离
  const rotate = Math.random() * 360
  const duration = 1.2 + Math.random() * 0.8
  const delay = Math.random() * 0.15

  // 起始位置围绕点击点散开
  const startX = x + (Math.random() - 0.5) * 30
  const startY = y + (Math.random() - 0.5) * 30

  petal.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: ${size}px;
    height: ${size * 1.3}px;
    background: rgba(200, 16, 46, ${0.5 + Math.random() * 0.4});
    border-radius: 50% 0 50% 50%;
    pointer-events: none;
    z-index: 99998;
    transform: rotate(${rotate}deg);
    animation: shuimo-petal-fall ${duration}s ease-out ${delay}s forwards;
    --dx: ${dx}px;
    --dy: ${dy}px;
    --rot: ${rotate + 180 + Math.random() * 180}deg;
  `

  document.body.appendChild(petal)

  // 动画结束后移除
  setTimeout(() => {
    petal.remove()
  }, (duration + delay) * 1000 + 100)
}

function onClick(e: MouseEvent) {
  const count = 5 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    createPetal(e.clientX, e.clientY)
  }
}

onMounted(() => {
  document.addEventListener('click', onClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onClick)
})
</script>

<template>
  <div />
</template>

<style>
/* 全局动画（不能 scoped，因为花瓣直接插入 body） */
@keyframes shuimo-petal-fall {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(var(--rot)) scale(1);
  }
  60% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.3);
  }
}
</style>
