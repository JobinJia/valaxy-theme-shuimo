<script setup lang="ts">
import { useCategories, usePostList, useTags } from 'valaxy'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoBack, useThemeConfig } from '../composables'

const { goBack } = useGoBack()

const themeConfig = useThemeConfig()
const { t } = useI18n()
const author = computed(() => themeConfig.value?.sidebar?.author)
const titleFont = computed(() => themeConfig.value?.fonts?.title)
const stampProps = computed(() => ({
  ...(themeConfig.value?.stamp || {}),
  text: themeConfig.value?.stamp?.author || '墨',
  mode: themeConfig.value?.stamp?.mode ?? themeConfig.value?.stamp?.type ?? 'yin',
  shape: themeConfig.value?.stamp?.shape || 'auto',
  size: 64,
}))

const postList = usePostList()
const categories = useCategories()
const tags = useTags()

const postCount = computed(() => (postList.value || []).length)
const categoryCount = computed(() => categories.value?.children?.size || 0)
const tagCount = computed(() => tags.value?.size || 0)
</script>

<template>
  <div class="shuimo-about-page">
    <!-- 头像（点击回首页） -->
    <router-link v-if="author?.avatar" to="/" class="shuimo-about-page__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-about-page__avatar">
    </router-link>

    <!-- 名字 -->
    <h1 class="shuimo-about-page__name" :style="titleFont ? { fontFamily: titleFont } : undefined">
      {{ author?.name || t('shuimo.author.anonymous') }}
    </h1>

    <!-- 座右铭 -->
    <p v-if="author?.motto" class="shuimo-about-page__motto">
      {{ author.motto }}
    </p>

    <!-- 统计卡片：归档 / 分类 / 标签 -->
    <div class="shuimo-about-page__stats">
      <router-link to="/archives" class="shuimo-about-page__stat-card">
        <span class="shuimo-about-page__stat-label">{{ t('shuimo.archives_studio') }}</span>
        <span class="shuimo-about-page__stat-count">{{ postCount }}</span>
      </router-link>
      <router-link to="/categories" class="shuimo-about-page__stat-card">
        <span class="shuimo-about-page__stat-label">{{ t('shuimo.categories') }}</span>
        <span class="shuimo-about-page__stat-count">{{ categoryCount }}</span>
      </router-link>
      <router-link to="/tags" class="shuimo-about-page__stat-card">
        <span class="shuimo-about-page__stat-label">{{ t('shuimo.tags') }}</span>
        <span class="shuimo-about-page__stat-count">{{ tagCount }}</span>
      </router-link>
    </div>

    <!-- 正文（来自 about.md，通过子路由渲染） -->
    <div class="shuimo-about-page__content">
      <slot />
    </div>

    <!-- 印章 -->
    <ShuimoStamp
      v-if="themeConfig?.stamp?.enable !== false"
      v-bind="stampProps"
      class="shuimo-about-page__stamp"
    />

    <!-- 返回 -->
    <button type="button" class="shuimo-about-page__back" @click="goBack">
      {{ t('shuimo.back') }} ←
    </button>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-about-page {
  max-width: 450px;
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
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--sm-primary-light);
  }

  &__name {
    font-size: 22px;
    font-weight: bold;
    color: var(--sm-ink-dark);
    letter-spacing: 6px;
    margin: 0 0 8px;
  }

  &__motto {
    font-size: 13px;
    color: var(--sm-ink-light);
    letter-spacing: 2px;
    margin: 0 0 24px;
    font-family: var(--sm-font-kai);
  }

  &__stats {
    display: flex;
    gap: 1px;
    width: 60%;
    margin-bottom: 24px;
    border: 1px solid var(--sm-c-border);
    border-radius: 4px;
    overflow: hidden;
  }

  &__stat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    text-decoration: none;
    background: var(--sm-card-bg);
    transition: background 0.2s;

    &:hover {
      background: var(--sm-sidebar-bg);
    }

    &:not(:last-child) {
      border-right: 1px solid var(--sm-c-border);
    }
  }

  &__stat-label {
    font-size: 10px;
    color: var(--sm-ink-light);
    letter-spacing: 1px;
    margin-bottom: 1px;
  }

  &__stat-count {
    font-size: 13px;
    font-weight: bold;
    color: var(--sm-ink-dark);
  }

  &__content {
    width: 100%;
    font-size: 14px;
    color: var(--sm-ink-medium);
    line-height: 2;
    letter-spacing: 1px;
    text-align: left;
    font-family: var(--sm-font-kai);

    :deep(p) {
      margin: 10px 0;
      text-indent: 2em;
    }

    :deep(a) {
      color: var(--sm-accent);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__stamp {
    margin-top: 32px;
  }

  &__back {
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    margin-top: 32px;
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
  .shuimo-about-page {
    padding: 60px 16px 32px;

    &__avatar {
      width: 56px;
      height: 56px;
    }

    &__name {
      font-size: 18px;
      letter-spacing: 4px;
    }

    &__content {
      font-size: 13px;
    }
  }
}
</style>
