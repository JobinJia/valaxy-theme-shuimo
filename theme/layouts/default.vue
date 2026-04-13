<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageType = computed(() => {
  const path = route.path.replace(/\/$/, '') || '/'
  if (path === '/')
    return 'home'
  if (path === '/about')
    return 'about'
  if (path === '/archives')
    return 'archives'
  return 'other'
})
</script>

<template>
  <ShuimoClickPetals />

  <!-- 首页：山水画 + 竖排导航 -->
  <ShuimoLayout v-if="pageType === 'home'" vertical-nav>
    <slot>
      <RouterView />
    </slot>
  </ShuimoLayout>

  <!-- 关于页 -->
  <div v-else-if="pageType === 'about'" class="shuimo-page">
    <ShuimoAboutPage>
      <RouterView />
    </ShuimoAboutPage>
  </div>

  <!-- 归档页 -->
  <div v-else-if="pageType === 'archives'" class="shuimo-page">
    <ShuimoArchivesPage />
  </div>

  <!-- 其他页面 -->
  <div v-else class="shuimo-page shuimo-page--plain">
    <RouterView />
    <router-link to="/" class="shuimo-page__back">
      ← 返回
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-page {
  min-height: 100vh;
  background: #F5F0E6;
  color: #2A2520;

  &--plain {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 20px;
  }

  &__back {
    margin-top: 24px;
    font-size: 13px;
    color: var(--sm-ink-light);
    text-decoration: none;
    letter-spacing: 2px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
    transition: color 0.2s;

    &:hover {
      color: var(--sm-accent);
    }
  }
}
</style>
