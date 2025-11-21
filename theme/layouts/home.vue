<script setup lang="ts">
import { ref } from 'vue'

const showContent = ref(false)

function onScrollAnimationComplete() {
  showContent.value = true
}
</script>

<template>
  <!-- 卷轴开屏动画 - 展示山水画 -->
  <ShuimoScrollPainting @complete="onScrollAnimationComplete" />

  <!-- 首页内容 -->
  <Transition name="fade-in">
    <Layout v-if="showContent">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <ShuimoHeader />

        <slot>
          <RouterView />
        </slot>
      </div>
    </Layout>
  </Transition>
</template>

<style scoped lang="scss">
.fade-in-enter-active {
  transition: opacity 0.8s ease;
}

.fade-in-enter-from {
  opacity: 0;
}
</style>
