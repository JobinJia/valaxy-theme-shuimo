<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useGoBack, useThemeConfig } from '../composables'

const { goBack } = useGoBack()

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const titleFont = computed(() => themeConfig.value?.fonts?.title)
const postList = usePostList()

// 按年份分组，倒序
const postsByYear = computed(() => {
  const groups: Record<number, any[]> = {}
  for (const post of (postList.value || [])) {
    const year = new Date(post.date).getFullYear()
    ;(groups[year] ||= []).push(post)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => +b - +a)
    .map(([year, posts]) => ({
      year: +year,
      posts: posts.sort((a: any, b: any) => +new Date(b.date) - +new Date(a.date)),
    }))
})

function formatDate(date: string | Date) {
  const d = new Date(date)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="shuimo-archives-page">
    <!-- 头像 -->
    <router-link v-if="author?.avatar" to="/" class="shuimo-archives-page__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-archives-page__avatar">
    </router-link>

    <!-- 标题 -->
    <h1 class="shuimo-archives-page__title" :style="titleFont ? { fontFamily: titleFont } : undefined">
      栖墨斋
    </h1>

    <!-- 分隔线已移除 -->

    <!-- 时间轴 -->
    <div class="shuimo-archives-page__timeline">
      <div v-for="group in postsByYear" :key="group.year" class="shuimo-archives-page__year-group">
        <!-- 年份 -->
        <h2 class="shuimo-archives-page__year" :style="titleFont ? { fontFamily: titleFont } : undefined">
          {{ group.year }}
        </h2>

        <!-- 文章列表 -->
        <ul class="shuimo-archives-page__list">
          <li v-for="post in group.posts" :key="post.path" class="shuimo-archives-page__item">
            <span class="shuimo-archives-page__dot" />
            <router-link :to="post.path || '/'" class="shuimo-archives-page__post-link">
              <span class="shuimo-archives-page__post-title">{{ post.title || '无题' }}</span>
              <span class="shuimo-archives-page__post-date">{{ formatDate(post.date) }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <p v-if="!postsByYear.length" class="shuimo-archives-page__empty">
        暂无文章
      </p>
    </div>

    <!-- 返回 -->
    <a href="#" class="shuimo-archives-page__back" @click.prevent="goBack">
      归去来兮 ←
    </a>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-archives-page {
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
    border: 2px solid var(--sm-primary-light);
  }

  &__title {
    font-size: 20px;
    font-weight: bold;
    color: var(--sm-ink-dark);
    letter-spacing: 8px;
    margin: 0 0 16px;
  }

  &__timeline {
    width: 100%;
  }

  &__year-group {
    margin-bottom: 28px;
  }

  &__year {
    font-size: 16px;
    color: var(--sm-ink-dark);
    letter-spacing: 4px;
    margin: 0 0 12px;
    padding-left: 4px;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    margin-left: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sm-primary-medium);
    flex-shrink: 0;
  }

  &__post-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 8px 0;
    text-decoration: none;
    transition: color 0.2s;
    gap: 16px;

    &:hover {
      .shuimo-archives-page__post-title {
        color: var(--sm-accent);
      }
    }
  }

  &__post-title {
    font-size: 14px;
    color: var(--sm-ink-medium);
    font-family: var(--sm-font-kai);
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
    font-family: var(--sm-font-kai);
  }

  &__back {
    margin-top: 40px;
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
}

@media (max-width: 767px) {
  .shuimo-archives-page {
    padding: 60px 16px 32px;

    &__title {
      font-size: 18px;
      letter-spacing: 4px;
    }

    &__post-link {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    &__post-date {
      font-size: 11px;
    }
  }
}
</style>
