<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGoBack, useThemeConfig, useThemeCssVars } from '../composables'
import { INITIAL_ROUTE_PATH_KEY } from '../composables/useCurtainTransition'

const { t } = useI18n()
const { goBack } = useGoBack()
const themeCssVars = useThemeCssVars()
const themeConfig = useThemeConfig()

// useRoute() returns undefined here during SSG/hydration setup (valaxy bootstraps
// vue-router after layout setup runs under vite-ssg's concurrent renders),
// which locks pageType to 'home' for every route and prevents SPA nav from
// swapping the branch. Read the SSG path via injected INITIAL_ROUTE_PATH_KEY
// for initial render, then switch to router.currentRoute once mounted so
// subsequent navigations reactively flip the v-if chain.
const initialRoutePath = inject(INITIAL_ROUTE_PATH_KEY, '/')
const router = useRouter()
const isHydrated = ref(false)
onMounted(() => {
  isHydrated.value = true
})

const currentPath = computed(() => {
  if (!isHydrated.value)
    return initialRoutePath
  return router?.currentRoute?.value?.path ?? initialRoutePath
})

const pageType = computed(() => {
  const path = currentPath.value.replace(/\/$/, '') || '/'
  if (path === '/')
    return 'home'
  if (path === '/about')
    return 'about'
  if (path === '/archives')
    return 'archives'
  if (path.startsWith('/categories') || path.startsWith('/tags'))
    return 'cat-tag'
  return 'other'
})
</script>

<template>
  <ShuimoClickPetals />

  <!-- 首页：山水画 + 竖排导航 -->
  <ShuimoLayout v-if="pageType === 'home'" vertical-nav hero-landscape>
    <slot>
      <RouterView />
    </slot>
  </ShuimoLayout>

  <!-- 关于页：不带标题/副标题 -->
  <div v-else-if="pageType === 'about'" class="shuimo-page" :style="themeCssVars">
    <ShuimoThemeToggle />
    <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false" />
    <ShuimoXuanPaper class="shuimo-page__paper">
      <ShuimoAboutPage>
        <RouterView />
      </ShuimoAboutPage>
    </ShuimoXuanPaper>
    <ShuimoDecoration type="season" position="bottom-right" size="md" name="about-season" />
  </div>

  <!-- 归档页：不带标题/副标题 -->
  <div v-else-if="pageType === 'archives'" class="shuimo-page" :style="themeCssVars">
    <ShuimoThemeToggle />
    <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false" />
    <ShuimoXuanPaper class="shuimo-page__paper">
      <ShuimoArchivesPage />
    </ShuimoXuanPaper>
    <ShuimoDecoration type="season" position="bottom-right" size="md" name="archives-season" />
  </div>

  <!-- 分类/标签页：不带标题/副标题 -->
  <div v-else-if="pageType === 'cat-tag'" class="shuimo-page" :style="themeCssVars">
    <ShuimoThemeToggle />
    <ShuimoLunarClock v-if="themeConfig?.decorations?.enable !== false" />
    <ShuimoXuanPaper class="shuimo-page__paper">
      <RouterView />
    </ShuimoXuanPaper>
    <ShuimoDecoration type="season" position="bottom-right" size="md" name="cat-tag-season" />
  </div>

  <!-- 其他页面 -->
  <ShuimoLayout v-else>
    <div class="shuimo-page--plain">
      <RouterView />
      <a href="#" class="shuimo-page__back" @click.prevent="goBack">
        {{ t('shuimo.back') }} ←
      </a>
    </div>
  </ShuimoLayout>
</template>

<style lang="scss" scoped>
.shuimo-page {
  min-height: 100vh;
  background: transparent;
  color: var(--sm-ink-dark);
  position: relative;
  overflow: hidden;
  animation: shuimo-fade-in 0.5s ease;
}

@keyframes shuimo-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.shuimo-page__paper {
  min-height: 100vh;
}

.shuimo-page--plain {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}

.shuimo-page__back {
  margin-top: 24px;
  font-size: 13px;
  color: var(--sm-ink-light);
  text-decoration: none;
  letter-spacing: 2px;
  font-family: var(--sm-font-kai);
  transition: color 0.2s;

  &:hover {
    color: var(--sm-accent);
  }
}

@media (max-width: 767px) {
  .shuimo-page--plain {
    padding: 40px 16px;
  }
}
</style>
