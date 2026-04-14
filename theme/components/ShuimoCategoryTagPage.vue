<script setup lang="ts">
import type { Post } from 'valaxy'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeConfig } from '../composables'

const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

const props = defineProps<{
  title: string
  posts: Post[]
  type: 'category' | 'tag'
}>()

const themeConfig = useThemeConfig()
const titleFont = computed(() => themeConfig.value?.fonts?.title)
const author = computed(() => themeConfig.value?.sidebar?.author)

function formatDate(date: string | Date) {
  const d = new Date(date)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="shuimo-cat-tag-page">
    <!-- 头像 -->
    <router-link v-if="author?.avatar" to="/" class="shuimo-cat-tag-page__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-cat-tag-page__avatar">
    </router-link>

    <!-- 分类/标签名 -->
    <h1 class="shuimo-cat-tag-page__title" :style="titleFont ? { fontFamily: titleFont } : undefined">
      {{ title }}
    </h1>

    <p class="shuimo-cat-tag-page__count">
      {{ posts.length }} 篇
    </p>

    <!-- 文章列表 -->
    <div class="shuimo-cat-tag-page__list">
      <router-link
        v-for="post in posts"
        :key="post.path"
        :to="post.path || '/'"
        class="shuimo-cat-tag-page__item"
      >
        <span class="shuimo-cat-tag-page__dot" />
        <span class="shuimo-cat-tag-page__post-title">{{ post.title || '无题' }}</span>
        <span class="shuimo-cat-tag-page__post-date">{{ formatDate(post.date) }}</span>
      </router-link>

      <p v-if="!posts.length" class="shuimo-cat-tag-page__empty">
        暂无文章
      </p>
    </div>

    <!-- 返回 -->
    <a href="#" class="shuimo-cat-tag-page__back" @click.prevent="goBack">
      归去来兮 ←
    </a>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-cat-tag-page {
  max-width: 500px;
  margin: 0 auto;
  padding: 80px 20px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__avatar-link {
    display: block;
    margin-bottom: 20px;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(139, 69, 19, 0.15);
  }

  &__title {
    font-size: 22px;
    font-weight: bold;
    color: var(--sm-ink-dark);
    letter-spacing: 6px;
    margin: 0 0 8px;
  }

  &__count {
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 2px;
    margin: 0 0 28px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
  }

  &__list {
    width: 100%;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    text-decoration: none;
    transition: color 0.2s;

    &:hover .shuimo-cat-tag-page__post-title {
      color: var(--sm-accent);
    }
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(139, 69, 19, 0.3);
    flex-shrink: 0;
  }

  &__post-title {
    flex: 1;
    font-size: 14px;
    color: var(--sm-ink-medium);
    font-family: "楷体", "KaiTi", "STKaiti", serif;
    letter-spacing: 1px;
    transition: color 0.2s;
  }

  &__post-date {
    font-size: 12px;
    color: var(--sm-ink-light);
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__empty {
    text-align: center;
    color: var(--sm-ink-light);
    font-size: 14px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
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

@media (max-width: 767px) {
  .shuimo-cat-tag-page {
    padding: 60px 16px 32px;

    &__title {
      font-size: 18px;
      letter-spacing: 4px;
    }

    &__item {
      flex-wrap: wrap;
      gap: 4px;
    }

    &__post-date {
      margin-left: 18px;
      font-size: 11px;
    }
  }
}
</style>
