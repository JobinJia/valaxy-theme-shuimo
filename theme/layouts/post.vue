<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const route = useRoute()
const router = useRouter()
const frontmatter = computed(() => (route.meta?.frontmatter || {}) as any)

function goBack() {
  if (window.history.length > 1)
    router.back()
  else
    router.push('/')
}
</script>

<template>
  <ShuimoClickPetals />
  <div class="shuimo-page">
    <div class="shuimo-post-page">
      <!-- 头像回首页 -->
      <router-link v-if="author?.avatar" to="/" class="shuimo-post-page__avatar-link">
        <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-post-page__avatar">
      </router-link>

      <!-- 文章标题 -->
      <h1 class="shuimo-post-page__title">
        {{ frontmatter.title || '无题' }}
      </h1>

      <!-- 日期 + 分类 -->
      <div class="shuimo-post-page__meta">
        <span v-if="frontmatter.date">{{ new Date(frontmatter.date).toLocaleDateString('zh-CN') }}</span>
        <span v-if="frontmatter.categories"> · {{ Array.isArray(frontmatter.categories) ? frontmatter.categories.join(' / ') : frontmatter.categories }}</span>
      </div>

      <ShuimoBrushLine variant="light" :length="200" :width="1" class="shuimo-post-page__line" />

      <!-- 文章正文：页面作为子路由，必须用 RouterView 渲染 -->
      <article class="shuimo-post-page__content markdown-body">
        <RouterView />
      </article>

      <!-- 返回上一页 -->
      <a href="#" class="shuimo-post-page__back" @click.prevent="goBack">
        ← 返回
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-page {
  min-height: 100vh;
  background: #F5F0E6;
  color: #2A2520;
}

.shuimo-post-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 60px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__avatar-link {
    display: block;
    margin-bottom: 24px;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(139, 69, 19, 0.15);
  }

  &__title {
    font-size: 22px;
    font-weight: bold;
    color: #1a1410;
    letter-spacing: 4px;
    margin: 0 0 12px;
    text-align: center;
  }

  &__meta {
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }

  &__line {
    margin-bottom: 28px;
  }

  &__content {
    width: 100%;
    font-size: 15px;
    color: var(--sm-ink-medium);
    line-height: 2;
    letter-spacing: 0.5px;

    :deep(h2) {
      font-size: 18px;
      color: #1a1410;
      letter-spacing: 3px;
      margin: 32px 0 16px;
      font-weight: bold;
    }

    :deep(h3) {
      font-size: 16px;
      color: #1a1410;
      letter-spacing: 2px;
      margin: 24px 0 12px;
    }

    :deep(p) {
      margin: 12px 0;
      text-indent: 2em;
    }

    :deep(blockquote) {
      margin: 16px 0;
      padding: 12px 20px;
      border-left: 3px solid rgba(139, 69, 19, 0.2);
      color: var(--sm-ink-light);
      font-style: italic;

      p { text-indent: 0; }
    }

    :deep(pre) {
      background: rgba(42, 37, 32, 0.04);
      border-radius: 4px;
      padding: 16px;
      overflow-x: auto;
      margin: 16px 0;
      font-size: 13px;
      line-height: 1.6;
    }

    :deep(code:not(pre code)) {
      background: rgba(42, 37, 32, 0.06);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    :deep(a) {
      color: var(--sm-accent);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  &__back {
    margin-top: 40px;
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
