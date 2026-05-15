<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoBack, useThemeConfig } from '../composables'

const { goBack } = useGoBack()

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const { t } = useI18n()
const titleFont = computed(() => themeConfig.value?.fonts?.title)
const postList = usePostList()

interface ArchivePost {
  path?: string
  // title 在 valaxy 里可能是 string 或多语言 Record，模板兜底逻辑沿用原有 `|| '无题'`
  title?: string | Record<string, string>
  formattedDate: string
  ts: number
}

// 按年份分组，倒序。
// 在 group 阶段一次性把日期 parse + format 投影到 post 字段；模板 v-for 直接读字段，
// 不会因任何 reactive tick 触发整列表 re-render 时反复 new Date()
const postsByYear = computed(() => {
  const groups = new Map<number, ArchivePost[]>()
  for (const post of (postList.value || [])) {
    const d = new Date(post.date ?? 0)
    const year = d.getFullYear()
    const ts = d.getTime()
    const formattedDate = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let bucket = groups.get(year)
    if (!bucket) {
      bucket = []
      groups.set(year, bucket)
    }
    bucket.push({ path: post.path, title: post.title, formattedDate, ts })
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, posts]) => ({
      year,
      posts: posts.sort((a, b) => b.ts - a.ts),
    }))
})
</script>

<template>
  <div class="shuimo-archives-page">
    <!-- 头像 -->
    <router-link v-if="author?.avatar" to="/" class="shuimo-archives-page__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-archives-page__avatar">
    </router-link>

    <!-- 标题 -->
    <h1 class="shuimo-archives-page__title" :style="titleFont ? { fontFamily: titleFont } : undefined">
      {{ t('shuimo.archives_studio') }}
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
              <span class="shuimo-archives-page__post-title">{{ post.title || t('shuimo.untitled') }}</span>
              <span class="shuimo-archives-page__post-date">{{ post.formattedDate }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <p v-if="!postsByYear.length" class="shuimo-archives-page__empty">
        {{ t('shuimo.empty') }}
      </p>
    </div>

    <!-- 返回 -->
    <button type="button" class="shuimo-archives-page__back" @click="goBack">
      {{ t('shuimo.back') }} ←
    </button>
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
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
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
