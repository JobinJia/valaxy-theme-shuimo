<script setup lang="ts">
import { ref } from 'vue'

const showContent = ref(false)

function onScrollAnimationComplete() {
  showContent.value = true
}
</script>

<template>
  <!-- 卷轴开屏动画 -->
  <ShuimoScrollAnimation @complete="onScrollAnimationComplete">
    <!-- 可选：在卷轴中间显示站点标题 -->
    <!-- <div>您的站点标题</div> -->
  </ShuimoScrollAnimation>

  <!-- 首页内容 -->
  <Transition name="fade-in">
    <Layout v-if="showContent">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <ShuimoHeader style="border: 1px solid red;" />

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
